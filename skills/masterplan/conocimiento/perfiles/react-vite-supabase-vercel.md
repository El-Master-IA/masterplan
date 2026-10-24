# Perfil: React + Vite + Supabase + Vercel (por defecto)

SPA en React construida con Vite, datos, auth, archivos y funciones en Supabase, y hosting
estático en Vercel. Un solo lenguaje (TypeScript), una sola factura de backend y permisos que
viven en la base. Es el perfil por defecto de Masterplan.

**Úsalo cuando:** el producto vive detrás de un login (saas, herramienta-interna, app-ia) o es un
sitio pequeño con prerender. **Cambia a `nextjs-supabase-vercel.md` cuando:** muchas páginas
públicas deben indexarse con contenido que cambia por visita, o el repo ya es Next.js.

## Paquetes por capa

> Versiones: **referencia, verificar con `masterplan:investigador`** (fecha de referencia
> 2026-10). Nunca se instalan desde esta tabla; en la fase 5 se usan las de
> `proyecto.json.versiones` con su fuente y fecha.

| Capa | Paquete | Rol | Versión de referencia |
|---|---|---|---|
| UI | `react`, `react-dom` | Componentes | 19.x |
| Build | `vite`, `@vitejs/plugin-react` | Dev server y bundle | 7.x |
| Lenguaje | `typescript` | Tipos, modo `strict` | 5.x |
| Estilos | `tailwindcss`, `@tailwindcss/vite` | Utilidades + tokens en variables CSS | 4.x |
| Componentes | shadcn/ui (CLI `shadcn`, copia código) + `@radix-ui/*` | Base accesible | CLI actual |
| Datos del servidor | `@tanstack/react-query` | Cache, reintentos, estados | 5.x |
| Rutas | `react-router` | Rutas, loaders, rutas protegidas | 7.x |
| Validación | `zod` | Esquemas compartidos cliente/servidor, variables de entorno | 4.x |
| Formularios | `react-hook-form`, `@hookform/resolvers` | Formularios con zod | 7.x |
| Backend | `@supabase/supabase-js` | Cliente de datos/auth/storage | 2.x |
| Backend local | `supabase` (CLI, dev dependency) | Base local, migraciones, tipos, funciones | 2.x |
| Tests | `vitest`, `@testing-library/react`, `jsdom` | Unitarios e integración | 3.x |
| E2E | `@playwright/test` | Flujo principal y smoke | 1.x |
| Calidad | `eslint` + `typescript-eslint` + `prettier` **o** `@biomejs/biome` | Lint y formato (elige uno) | 9.x / 3.x / 2.x |
| Errores | `@sentry/react` | Errores con release y ruta | 10.x |

Regla: si el repo ya trae una herramienta de la misma capa, manda la del repo.

## Scaffold

```bash
npm create vite@latest <nombre> -- --template react-ts
cd <nombre>
npm install @supabase/supabase-js @tanstack/react-query react-router zod react-hook-form @hookform/resolvers
npm install -D supabase vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
npm install -D tailwindcss @tailwindcss/vite
npx shadcn@latest init
npx supabase init
npx playwright install --with-deps chromium
git init && git add -A && git commit -m "T01: scaffold"
```

Las versiones exactas salen de `proyecto.json.versiones`; si una no está verificada, se instala
la última estable y se anota la resultante.

## Scripts npm esperados

| Script | Comando típico | Sale 0 cuando |
|---|---|---|
| `dev` | `vite` | Arranca sin errores |
| `build` | `tsc -b && vite build` | Compila y genera `dist/` |
| `typecheck` | `tsc -b --noEmit` | Sin errores de tipos |
| `lint` | `eslint .` o `biome check .` | Sin errores |
| `test` | `vitest run` | Todos los tests pasan |
| `test:e2e` | `playwright test` | Flujo principal pasa |
| `db:reset` | `supabase db reset` | Migraciones + seed aplican desde cero |
| `db:test` | `supabase test db` | Tests pgTAP de RLS pasan |
| `db:types` | `supabase gen types typescript --local > src/lib/database.types.ts` | Tipos generados |

## Estructura de carpetas

```
src/
  app/                 # main.tsx, router, providers (QueryClient, sesión), layout
  features/<nombre>/   # api.ts, hooks.ts, components/, routes.tsx, schemas.ts, *.test.ts
  components/ui/       # shadcn/ui
  lib/
    supabase.ts        # único createClient (clave pública)
    data/              # capa de datos: toda consulta pasa por aquí
    env.ts             # import.meta.env validado con zod
    database.types.ts  # generado, no se edita
  styles/              # tokens de DESIGN.md como variables CSS
supabase/
  config.toml
  migrations/          # <timestamp>_<nombre>.sql (lo genera la CLI)
  functions/<nombre>/index.ts
  functions/_shared/   # cors, errores, auth, validación
  tests/               # *.test.sql (pgTAP)
  seed.sql
tests/e2e/             # Playwright
vercel.json            # rewrites de SPA y headers
```

## Convenciones

| Convención | Regla |
|---|---|
| Carpetas por feature | Todo lo de una función del producto vive junto; nada de `components/` gigante por tipo |
| Capa de datos única | Los componentes usan hooks de la feature; los hooks llaman a `lib/data` o `features/*/api.ts`; ningún componente importa `supabase` directo |
| Clave pública en el cliente | Solo `VITE_SUPABASE_URL` y la clave anónima/publicable. `service_role` jamás en `src/` |
| Prefijo `VITE_` | Solo para valores públicos; todo lo que lleva el prefijo se publica en el bundle |
| Variables validadas | `env.ts` falla al arrancar si falta una variable |
| Tipos de la base | Generados con la CLI después de cada migración |
| Migraciones | Toda modificación de esquema por archivo en `supabase/migrations/`; nunca desde el panel |
| RLS | Activo en la misma migración que crea la tabla, con política explícita y test |
| Secretos de servidor | En Edge Functions con `supabase secrets set`; localmente en `supabase/functions/.env` (ignorado por git) |
| Nombres | Tablas y columnas en `snake_case`; componentes en `PascalCase`; archivos en `kebab-case` |

## Edge Functions de Supabase

- Runtime Deno, TypeScript. Una carpeta por función en `supabase/functions/`.
- Para: webhooks (pagos, terceros), tareas con secretos (correo, modelos de IA), invitaciones,
  lógica que no debe vivir en el cliente.
- Toda función: valida la sesión (o la firma, si es webhook), valida la entrada con zod, responde
  con el formato de error común, maneja CORS con lista de orígenes.
- Usan `service_role` solo dentro de la función y solo cuando la operación lo exige; si basta el
  JWT del usuario, se crea el cliente con ese JWT para que RLS siga aplicando.
- Local: `npx supabase functions serve`. Despliegue: `npx supabase functions deploy <nombre>`.
- Webhooks sin JWT: desactivar la verificación de JWT de esa función y verificar la firma propia.
- Trabajo de más de unos segundos: encolar (tabla de trabajos + cron o cola) y responder rápido.

## Supabase local

```bash
npx supabase start          # levanta Postgres, Auth, Storage, Studio (requiere Docker)
npx supabase status         # URLs y claves locales (solo locales, no son secretos de producción)
npx supabase migration new <nombre>
npm run db:reset            # aplica migraciones + seed.sql desde cero
npm run db:types
npx supabase stop
```

`.env.local` del frontend apunta a la URL y clave anónima locales. Producción se enlaza con
`npx supabase link --project-ref <ref>` y las migraciones se aplican con `npx supabase db push`
**antes** de promover el deploy.

## Cómo testear RLS

Dos caminos; el plan usa al menos uno por tabla con datos.

| Camino | Cómo | Cuándo |
|---|---|---|
| pgTAP (`supabase test db`) | En `supabase/tests/*.test.sql`: crear dos usuarios, fijar el rol `authenticated` y los claims del JWT de cada uno, y afirmar con `results_eq`/`is_empty` qué filas ve cada uno | Por defecto: rápido y cerca de la política |
| Integración con dos usuarios (Vitest) | Crear usuarios A y B contra Supabase local, iniciar sesión con cada uno usando la clave anónima, intentar leer/escribir lo del otro y afirmar 0 filas o error | Cuando la regla pasa por Edge Functions o Storage |

Casos mínimos por tabla: anónimo ve 0 filas · usuario ve solo su org · usuario no puede insertar
con `org_id` ajeno · rol sin permiso no puede actualizar/borrar · test que lista tablas del esquema
`public` sin RLS y espera 0.

## Vercel

- `vercel.json` con rewrite de todas las rutas a `/index.html` (SPA) y headers: CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- Variables por entorno (Development, Preview, Production); Preview usa el proyecto de Supabase de
  prueba y llaves de pago de prueba.
- Assets con hash: caché larga e inmutable (Vite ya los nombra con hash).

## Trampas conocidas

| Trampa | Prevención |
|---|---|
| `service_role` importada en `src/` | Política del plugin + revisión |
| Olvidar el rewrite de SPA: 404 al recargar | `vercel.json` en el paso de deploy |
| Tipos de la base desactualizados | `db:types` en el checkpoint de cada migración |
| Sesión no refrescada al volver a la pestaña | Un solo cliente y `onAuthStateChange` en el provider |
| URL de redirección de Auth sin la de preview/producción | Configurar en Auth las URLs permitidas por entorno |
| Consultas en `useEffect` sueltas | TanStack Query en la capa de datos |
| Docker apagado: `supabase start` falla | Es requisito del entorno; dilo en el README |
| Storage sin políticas | Buckets privados por defecto con políticas por `org_id` en la ruta |
