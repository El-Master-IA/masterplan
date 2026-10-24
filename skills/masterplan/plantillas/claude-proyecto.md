# <nombre del proyecto>

<!-- Plantilla del CLAUDE.md que Masterplan deja en la raíz del proyecto (fase 5).
     Máximo 150 líneas. Copia equivalente en AGENTS.md. Rellena los <…> y borra este comentario. -->

<Una línea: qué es el producto y para quién.> Tipo: <tipo>. Perfil: <perfil>.
Plano completo en `masterplan/`; esta hoja es solo lo que necesitas para trabajar.

## Comandos

| Para | Comando |
|---|---|
| Instalar | `npm install` |
| Desarrollo | `npm run dev` |
| Base local | `npx supabase start` y luego `npm run db:reset` |
| Tipos de la base | `npm run db:types` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm run test` |
| Tests de RLS | `npm run db:test` |
| E2E | `npm run test:e2e` |
| Build | `npm run build` |

Antes de decir que algo está listo corren en verde: `typecheck`, `lint`, `test` y los comandos de
`verificar` de la tarea.

## Cómo trabajar

1. Lee tu tarea en `masterplan/plan/tareas.json` (por `id`). Haz **solo** lo que dice `hacer`,
   en los `archivos` que lista. Si necesitas tocar otro archivo, detente y dilo.
2. Lee las specs que cita la tarea en `masterplan/specs/` y, si aplica, `DESIGN.md`,
   `EXPERIENCE.md`, `seguridad.md` o `api.md`. No leas el resto.
3. Escribe primero el test que prueba cada criterio (CUANDO … EL SISTEMA DEBE …); nombra el test
   con el ID de la spec.
4. Implementa hasta que los comandos de `verificar` salgan 0. Guarda la salida en
   `masterplan/evidencia/<id>.txt`.
5. Corre el `checkpoint` de la tarea (commit + tag `mp-<id>`).

Para pedir la siguiente tarea: **`/masterplan:seguir`**.

## Reglas

- **Prueba real antes de decir listo.** Sin salida fresca del comando, no está hecho. Prohibido
  "debería funcionar", "se ve bien", "quedó conectado".
- **Solo lo que pide la tarea.** Nada de refactors, dependencias o archivos extra "de paso".
- **Nunca `service_role` en el cliente.** Ni en `src/` ni en variables con prefijo `VITE_` /
  `NEXT_PUBLIC_`. Esos prefijos son solo para valores públicos.
- **Secretos:** solo en `.env*` ignorados por git o en los secretos del hosting. Nunca en código,
  logs, tests ni en `masterplan/`.
- **Base de datos:** todo cambio de esquema es una migración nueva en `supabase/migrations/`
  (`npx supabase migration new <nombre>`). RLS activo en la misma migración que crea la tabla,
  con su test. Nunca edites una migración ya aplicada.
- **Datos:** toda consulta pasa por la capa de datos (`src/lib/data` o `features/*/api.ts`).
  Dinero en enteros; fechas `timestamptz`.
- **Entradas:** se validan con zod en el cliente y otra vez en el servidor.
- **Errores:** cada pantalla maneja cargando, vacío, error y sin permiso. Nada de pantallas en
  blanco ni errores silenciados.
- **Dependencias:** solo las versiones de `masterplan/proyecto.json` › `versiones`. Una nueva se
  propone, no se instala sola.
- **Políticas del plugin:** si un hook bloquea, corrige el código. Excepción solo con
  `// masterplan-permitir: <regla> -- <motivo>`, que queda registrada.
- **Tres intentos.** Si al tercer intento no pasa, marca la tarea `bloqueada` con el motivo y
  detente.

## Convenciones

| Tema | Regla |
|---|---|
| Estructura | Carpetas por feature: `src/features/<nombre>/` (api, hooks, components, schemas, tests) |
| Nombres | Componentes `PascalCase`; archivos `kebab-case`; tablas y columnas `snake_case` |
| Estilos | Solo tokens de `masterplan/DESIGN.md` (variables CSS). Ningún color o tamaño suelto |
| Componentes | Base shadcn/ui en `src/components/ui/`; extender, no duplicar |
| Datos del servidor | TanStack Query; nada de `fetch` en `useEffect` |
| Commits | `T<id>: <qué>`; uno por tarea |
| Idioma | Código e identificadores en inglés; textos de interfaz en <idioma del producto> |

<Convenciones propias del repo, si es brownfield: mandan sobre las de arriba.>

## Diseño: patrones prohibidos

Nada de esto llega a la interfaz salvo que `DESIGN.md` lo pida explícitamente:

- Degradado morado-azul en fondos, botones o titulares.
- Inter o la fuente del sistema "por defecto" sin decisión en `DESIGN.md`.
- Emojis como iconos.
- Todo centrado en todas las secciones.
- Rejillas de tarjetas idénticas con sombra para cualquier contenido.
- Titulares genéricos ("Potencia tu productividad", "La solución todo en uno").
- Textos de relleno (lorem ipsum) o datos falsos en producción.
- Animaciones sin propósito o que ignoran `prefers-reduced-motion`.
- <propios del proyecto, de la sección "No usar" de DESIGN.md>

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Estado y decisiones | `masterplan/proyecto.json`, `masterplan/decisiones.log` |
| Tareas | `masterplan/plan/tareas.json` |
| Requisitos | `masterplan/specs/` |
| Permisos y secretos | `masterplan/seguridad.md` |
| Contratos de API | `masterplan/api.md` |
| Sistema visual y pantallas | `masterplan/DESIGN.md`, `masterplan/EXPERIENCE.md` |
| Evidencia | `masterplan/evidencia/` |
