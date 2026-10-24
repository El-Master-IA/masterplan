# Perfil: Next.js + Supabase + Vercel (alternativa)

Aplicación Next.js (App Router) con renderizado en servidor, datos y auth en Supabase y hosting en
Vercel. Más potencia para páginas públicas e indexables; más conceptos que dominar (componentes de
servidor y cliente, caché, middleware).

**Úsalo cuando:** hay muchas páginas públicas que deben indexarse y cambian por visita, el producto
mezcla marketing y app en el mismo dominio con SEO serio, o el repo ya es Next.js.
**Quédate en el perfil por defecto cuando:** todo vive detrás de login.

## Paquetes por capa

> Versiones: **referencia, verificar con `masterplan:investigador`** (fecha de referencia
> 2026-10). En la fase 5 se usan las de `proyecto.json.versiones`.

| Capa | Paquete | Rol | Versión de referencia |
|---|---|---|---|
| Framework | `next`, `react`, `react-dom` | App Router, servidor y cliente | 16.x / 19.x |
| Lenguaje | `typescript` | `strict` | 5.x |
| Estilos | `tailwindcss`, `@tailwindcss/postcss` | Utilidades + tokens | 4.x |
| Componentes | shadcn/ui + `@radix-ui/*` | Base accesible | CLI actual |
| Datos en cliente | `@tanstack/react-query` | Solo para interacción en cliente (opcional) | 5.x |
| Validación | `zod` | Server Actions, route handlers, env | 4.x |
| Formularios | `react-hook-form`, `@hookform/resolvers` | | 7.x |
| Backend | `@supabase/supabase-js`, `@supabase/ssr` | Cliente con cookies en servidor | 2.x / 0.x |
| Backend local | `supabase` (CLI) | Base local, migraciones, tipos | 2.x |
| Tests | `vitest`, `@testing-library/react` | Unitarios | 3.x |
| E2E | `@playwright/test` | Flujo principal | 1.x |
| Calidad | `eslint` (config de Next) + `prettier` **o** `@biomejs/biome` | | 9.x / 3.x / 2.x |
| Errores | `@sentry/nextjs` | Errores en servidor y cliente | 10.x |

## Scaffold

```bash
npx create-next-app@latest <nombre> --typescript --tailwind --eslint --app --src-dir
cd <nombre>
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers
npm install -D supabase vitest @testing-library/react jsdom @playwright/test
npx shadcn@latest init
npx supabase init
git init && git add -A && git commit -m "T01: scaffold"
```

## Scripts npm esperados

| Script | Comando típico |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint .` o `biome check .` |
| `test` | `vitest run` |
| `test:e2e` | `playwright test` |
| `db:reset` | `supabase db reset` |
| `db:test` | `supabase test db` |
| `db:types` | `supabase gen types typescript --local > src/lib/database.types.ts` |

## Estructura de carpetas

```
src/
  app/
    (marketing)/       # páginas públicas, renderizadas en servidor o estáticas
    (app)/             # rutas autenticadas, layout con guard
    api/<ruta>/route.ts  # webhooks y endpoints
  features/<nombre>/   # actions.ts (Server Actions), queries.ts, components/, schemas.ts
  components/ui/
  lib/
    supabase/
      server.ts        # cliente para Server Components/Actions (cookies)
      client.ts        # cliente de navegador (clave pública)
      admin.ts         # service_role: solo importable desde código de servidor ('server-only')
    env.ts
  middleware.ts        # refresca sesión; no decide permisos finos
supabase/  migrations/  functions/  tests/  seed.sql
tests/e2e/
```

## Convenciones

| Convención | Regla |
|---|---|
| Servidor por defecto | Componentes de servidor salvo que necesiten estado o eventos (`'use client'`) |
| Capa de datos | Lecturas en `features/*/queries.ts`, escrituras en Server Actions; los componentes no crean clientes |
| `service_role` | Solo en `lib/supabase/admin.ts` con `import 'server-only'`; nunca en un archivo `'use client'` |
| `NEXT_PUBLIC_` | Solo valores públicos; todo con ese prefijo llega al navegador |
| Server Actions | Validan con zod, verifican sesión y permiso aunque la UI ya lo haga; son endpoints públicos |
| Caché | Declarar explícitamente qué se cachea y cómo se invalida; nada de datos de un usuario en caché compartida |
| Migraciones y RLS | Igual que el perfil por defecto |

## Edge Functions de Supabase o route handlers

- Webhooks y tareas con secretos pueden vivir en `app/api/*/route.ts` (runtime de Node en Vercel)
  o en Edge Functions de Supabase. Por defecto: route handlers si la lógica es de la app; Edge
  Functions si la usan también otros clientes o necesitan estar cerca de la base.
- Mismas reglas: firma verificada, entrada validada, error con formato común, idempotencia.
- Procesos largos fuera de la petición (cola o trabajador), por el límite de duración de las
  funciones.

## Supabase local y tests de RLS

Idénticos al perfil `react-vite-supabase-vercel.md` (secciones "Supabase local" y "Cómo testear
RLS"). Diferencia: el cliente de servidor lleva la sesión del usuario por cookies, así que los
tests de integración deben crear la sesión y llamar a la Server Action o al route handler.

## Vercel

- Headers de seguridad en `next.config` o middleware (CSP con nonce si hay scripts en línea).
- Variables por entorno; Preview con Supabase de prueba y llaves de pago de prueba.
- Revisar qué rutas quedan estáticas y cuáles dinámicas en la salida de `next build`.

## Trampas conocidas

| Trampa | Prevención |
|---|---|
| Importar `admin.ts` desde un componente cliente | `server-only` + política del plugin |
| Confiar en el middleware para autorizar | El permiso se verifica en la Server Action, el route handler y RLS |
| Página personalizada cacheada para todos | Marcar dinámica lo que depende del usuario |
| Cliente de Supabase con cookies creado una vez a nivel de módulo | Crear por petición |
| Mezclar Pages Router y App Router sin plan | Solo App Router en proyectos nuevos |
| Server Actions sin validación | zod en cada acción |
| Hidratación con fechas y aleatorios distintos servidor/cliente | Formatear en un solo lado |
