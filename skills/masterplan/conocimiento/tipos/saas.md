# Tipo: SaaS

Producto web donde personas **de fuera de tu organización** inician sesión, crean y guardan su
propia información y, normalmente, pagan por usarlo. Es el tipo más común y el que más se rompe
cuando se improvisa la tenencia y los permisos.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Que cada cliente tenga su cuenta y vea solo lo suyo" | Tenencia y aislamiento |
| "Planes: gratis, pro y empresa" | Suscripciones y límites por plan |
| "Que pueda invitar a su equipo" | Organizaciones y roles |
| "Un panel donde el usuario gestiona sus X" | CRUD autenticado |
| "Quiero cobrar mensual" | Pagos recurrentes |
| "Como Notion/Trello/Calendly pero para…" | SaaS vertical |
| "Mis clientes suben sus archivos y yo se los proceso" | Datos por cliente + trabajo en segundo plano |

## No es este tipo si…

- Quienes lo usan **trabajan para ti** → `herramienta-interna`.
- Nadie inicia sesión ni guarda nada (solo se lee contenido) → `sitio`.
- Lo consume **otro programa**, no una persona en pantalla → `api`.
- Se dispara solo (cron, webhook, chat) y no tiene panel propio → `bot`.
- Si cambias cada respuesta del modelo por un texto fijo y no queda producto → `app-ia`.
  Si sí queda producto, es SaaS con la capacidad IA.

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| auth (registro, login, recuperar, cerrar sesión) | Sí | `masterplan:kit-auth` |
| datos con tenencia y RLS | Sí | `masterplan:kit-datos` |
| frontend con estados completos | Sí | `masterplan:kit-frontend` |
| deploy con preview y producción | Sí | `masterplan:kit-deploy` |
| observabilidad (errores, health, métrica de éxito) | Sí | `masterplan:kit-observabilidad` |
| api (funciones de servidor, webhooks) | Casi siempre | `masterplan:kit-api` |
| pagos y planes | Si cobra | `masterplan:kit-pagos` |
| correo transaccional | Si invita o notifica | `masterplan:kit-auth` / `kit-api` |
| archivos | Si sube documentos o imágenes | `masterplan:kit-datos` |
| tiempo real | Solo si dos personas editan lo mismo a la vez | `masterplan:kit-datos` |

## Decisión clave: tenencia por usuario o por organización

Esta es la decisión más cara de revertir del SaaS. Va en el ADR-001 de `arquitectura.md`.

| | Por usuario (`user_id`) | Por organización (`org_id`) |
|---|---|---|
| Qué es | Cada fila pertenece a una persona | Cada fila pertenece a una organización; las personas son miembros |
| Ventaja | Un poco menos de código al inicio | Equipos, invitaciones, cambio de dueño y facturación por empresa sin reescribir |
| Costo de cambiar después | Alto: migrar datos, reescribir todas las políticas RLS, cambiar pantallas y facturación | Bajo: ya está |
| Cuándo | Herramienta estrictamente personal, sin equipos ni en el horizonte | Todo lo demás |

**Recomendación por defecto: organización personal desde el día 1.** Al registrarse, cada usuario
recibe automáticamente una organización propia de la que es `owner`. La interfaz puede ocultar la
palabra "organización" hasta que el producto tenga equipos. Toda tabla de negocio lleva `org_id`
y toda política RLS pregunta "¿es miembro de esta org?". Agregar equipos después es solo una
pantalla de invitaciones.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `nombre`, `avatar_url`, `creado` | 1 a 1 con el usuario; creada por trigger al registrarse |
| `organizations` | `id`, `nombre`, `slug` único, `plan`, `creado` | Se crea una personal en el registro |
| `memberships` | `org_id`, `user_id`, `rol` (`owner`/`admin`/`member`), único (`org_id`,`user_id`) | Fuente de verdad de permisos; nunca en metadatos editables |
| `invitations` | `id`, `org_id`, `email`, `rol`, `token_hash`, `expira`, `aceptada` | Token guardado como hash; vence |
| `<entidad_principal>` | `id`, `org_id`, `creado_por`, campos del negocio, `creado`, `actualizado` | La razón de ser del producto |
| `subscriptions` | `org_id`, `proveedor_id`, `estado`, `plan`, `periodo_fin` | Solo la escribe el webhook de pagos (servidor) |
| `billing_events` | `id_evento` único, `tipo`, `payload`, `procesado` | Idempotencia de webhooks |
| `audit_log` | `org_id`, `actor_id`, `accion`, `recurso`, `fecha` | Acciones sensibles: cambio de rol, borrado, plan |

Reglas: `timestamptz` en todas las fechas; dinero en enteros (centavos) con `moneda`; índice por
`org_id` en toda tabla de negocio; función `es_miembro(org_id)` reutilizada por todas las políticas.

## Estructura de carpetas (perfil React + Vite + Supabase)

```
src/
  app/                 # router, providers, layout raíz
  features/
    auth/              # registro, login, recuperar, guard de sesión
    orgs/              # organización activa, miembros, invitaciones
    <entidad>/         # api.ts (consultas), hooks.ts, components/, routes.tsx
    billing/           # planes, checkout, portal
  components/ui/       # base shadcn/ui
  lib/
    supabase.ts        # cliente único (clave pública)
    data/              # capa de datos: única puerta a Supabase
    env.ts             # variables validadas con zod
  styles/              # tokens de DESIGN.md
supabase/
  migrations/          # esquema + RLS, una migración por cambio
  functions/           # Edge Functions: webhooks, invitaciones, tareas con secretos
  tests/               # pgTAP de RLS
  seed.sql
tests/
  unit/  integration/  e2e/
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | Registro, organización personal, CRUD de la entidad principal, deploy | Mínima + invitar equipo con roles, planes con pago, correo transaccional, panel de cuenta |
| Pasos de construcción | 8–10 | 12–16 |
| Non-Goals frecuentes | Equipos, pagos, archivos, notificaciones | Roles personalizados, SSO empresarial, app móvil, multi-idioma, API pública |

## Orden base de construcción

Seguridad y datos antes que pantallas. Cada paso es una tarea (o dos) de `plan/tareas.json`.

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, `.gitignore`, lint, typecheck, test en verde | CUANDO se corre `npm run typecheck && npm run lint && npm run test` en un clon limpio EL SISTEMA DEBE salir con código 0 | Los tres scripts |
| 2 | Supabase local y variables validadas | CUANDO falta una variable obligatoria al arrancar EL SISTEMA DEBE fallar con un mensaje que nombra la variable | `npm run db:reset` y test de `env.ts` |
| 3 | Esquema base: `profiles`, `organizations`, `memberships` con RLS activo | CUANDO se crea cualquier tabla de negocio EL SISTEMA DEBE tener RLS habilitado y al menos una política | Test que lista tablas sin RLS = 0 |
| 4 | Registro crea perfil + organización personal + membresía `owner` | CUANDO un usuario se registra EL SISTEMA DEBE crear exactamente una organización y una membresía `owner` | Test de integración con usuario nuevo |
| 5 | Aislamiento entre organizaciones | CUANDO un usuario de la org A consulta datos de la org B EL SISTEMA DEBE devolver 0 filas | `npm run db:test` (pgTAP o dos usuarios) |
| 6 | Auth en la UI: registro, login, recuperar, cerrar sesión, rutas protegidas | CUANDO un anónimo abre una ruta privada EL SISTEMA DEBE redirigir a login y volver a la ruta tras entrar | Test e2e del guard |
| 7 | Capa de datos única y manejo de errores | CUANDO una consulta falla EL SISTEMA DEBE mostrar un mensaje entendible y registrar el error con contexto, sin datos personales | Test unitario de la capa + test de componente |
| 8 | Entidad principal: crear y listar con estados vacío, cargando y error | CUANDO la organización no tiene registros EL SISTEMA DEBE mostrar el estado vacío con la acción para crear el primero | Tests de componente de los 3 estados |
| 9 | Entidad principal: editar y borrar con permisos por rol | CUANDO un `member` intenta borrar algo que la matriz reserva a `admin` EL SISTEMA DEBE rechazarlo en la base, no solo ocultar el botón | Test de RLS por rol |
| 10 | Validación de entradas en cliente y servidor | CUANDO llega un dato que no cumple el esquema zod EL SISTEMA DEBE rechazarlo con un error por campo y no escribir nada | Tests de esquema |
| 11 | Invitaciones y miembros | CUANDO se acepta una invitación vencida o ya usada EL SISTEMA DEBE rechazarla sin crear membresía | Test de integración de la Edge Function |
| 12 | Planes y pagos (checkout + webhook firmado) | CUANDO llega un webhook con firma inválida EL SISTEMA DEBE responder 400 y no cambiar la suscripción | Test del webhook con firma falsa y evento repetido |
| 13 | Límites por plan | CUANDO una org gratuita supera el límite de su plan EL SISTEMA DEBE bloquear la creación y ofrecer el cambio de plan | Test de integración del límite |
| 14 | Observabilidad: errores, health check, evento de la métrica de éxito | CUANDO ocurre un error no controlado EL SISTEMA DEBE reportarlo con id de release y ruta | Test del health + error de prueba visible en el panel |
| 15 | Flujo principal de punta a punta | CUANDO un usuario nuevo recorre el flujo principal de `proyecto.json` EL SISTEMA DEBE completarlo sin errores de consola | `npm run test:e2e` |
| 16 | Deploy: preview, headers de seguridad, migraciones antes de promover | CUANDO se despliega una preview EL SISTEMA DEBE usar llaves de prueba y pasar el smoke test | Smoke contra la URL de preview |

En la versión mínima se omiten 11–13 y se fusionan 6 con 2 si hace falta.

## Trampas típicas

| Trampa | Consecuencia | Prevención |
|---|---|---|
| Tenencia por usuario "porque es más simple" | Reescritura cuando llega el primer cliente con equipo | Organización personal desde el día 1 |
| RLS escrita sin test | Una política con `true` deja todo abierto y nadie lo nota | Test de aislamiento obligatorio en el paso 5 |
| Rol en `user_metadata` | El usuario se asigna `admin` | Rol en `memberships`, escrito solo por el servidor |
| Plan del cliente decidido en el frontend | Funciones pagas gratis con una petición manual | Límites verificados en la base o en funciones de servidor |
| Webhook de pagos sin idempotencia | Suscripciones duplicadas o plan cambiado dos veces | `billing_events.id_evento` único |
| Borrar cuenta sin definir qué pasa con la org | Datos huérfanos u otra persona pierde su trabajo | Regla de traspaso de `owner` o borrado de la org con aviso |
| Onboarding vacío | El usuario entra, ve una pantalla en blanco y se va | Estado vacío con la primera acción y datos de ejemplo opcionales |
| Correos de invitación sin dominio verificado | Llegan a spam y nadie se une | Verificar dominio antes del lanzamiento |

## Lista de lanzamiento

- [ ] Dominio propio con HTTPS y redirección desde `www` o hacia `www`
- [ ] URL de producción configurada en Auth (redirecciones permitidas, plantillas de correo)
- [ ] Proveedor de pagos en modo real, webhook de producción con su secreto, un pago real reembolsado
- [ ] Dominio de correo verificado (SPF, DKIM) y correo de invitación probado
- [ ] Política de privacidad y términos publicados; tratamiento de datos según `seguridad.md`
- [ ] Backups activos y una restauración probada
- [ ] Alertas de errores apuntando a una persona real
- [ ] Evento de la métrica de éxito llegando a la analítica
- [ ] Cuenta de soporte o canal de contacto visible en la app
