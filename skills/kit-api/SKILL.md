---
name: kit-api
description: >-
  Contratos y funciones del servidor sobre Supabase: contrato primero con zod compartido, cuándo
  usar Edge Function, RPC de Postgres o consulta directa con RLS, sobre de error único, validación
  en la frontera, verificación de JWT, límite de uso, idempotencia, webhooks firmados con dedupe,
  trabajos largos con cola o pg_cron, CORS estricto y tests de contrato. Úsala al escribir api.md
  (fase 3), al planear (fase 5) y en tareas con kit masterplan:kit-api. EN: API contracts, zod,
  Edge Functions vs RPC, error envelope, rate limiting, idempotency, signed webhooks, queues, CORS.
---

# Kit · API

Cada cosa que entra al sistema pasa por una puerta con contrato: qué acepta, qué devuelve, quién
puede llamarla, cuántas veces y qué pasa si llega dos veces.

## Cuándo aplica
- Siempre que exista lógica que no sea un CRUD simple protegido por RLS.
- Cuando hay terceros: webhooks entrantes, llamadas a APIs externas, IA, correo.
- Cuando el tipo de producto es `api` (otros programas son el cliente).

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Otros programas (de clientes o socios) van a llamar a tu sistema?" | No en v1 | Sí: llaves de API por org, versionado `/v1`, documentación pública |
| 2 | "¿Hay tareas que tardan más de unos segundos (generar reportes, IA, importar archivos)?" | Sí, al menos una | Cola de trabajos con estado visible en la UI |
| 3 | "¿Qué servicios externos avisan a tu sistema (pagos, WhatsApp, formularios)?" | Solo el de pagos | Un receptor de webhook firmado por proveedor |

## Decisión
| Si la operación… | Usa… | Por qué |
|---|---|---|
| Lee o escribe filas de una sola tabla y RLS basta | Consulta directa con `supabase-js` desde el cliente | Menos código; la política ya protege |
| Toca varias tablas y debe ser atómica, sin secretos ni red | RPC de Postgres (`security invoker`), validando argumentos en SQL | Una transacción, RLS sigue activa |
| Necesita un secreto, llamar a un tercero, enviar correo o cobrar | Edge Function | El secreto vive en el servidor |
| Recibe un webhook | Edge Function con `verify_jwt = false` y verificación de firma propia | El tercero no trae JWT de Supabase; la firma lo reemplaza |
| Tarda más de ~10 s o puede reintentarse | Encolar (tabla `trabajos` o `pgmq`) + trabajador por `pg_cron` o Edge Function programada | No bloquea la UI ni se corta por tiempo |
| Se repite en horario | `pg_cron` llamando a una función SQL o a una Edge Function | Sin servidores extra |
| La exponen terceros | Edge Function `/v1/...` con llave de API hasheada por org | Versionar desde el día 1 |

## Contrato primero
1. Cada operación se escribe en `masterplan/api.md`: nombre, entrada, salida, errores, quién
   llama, límite de uso, idempotente sí/no.
2. Ese contrato se vuelve un esquema zod en `src/shared/contratos/<operacion>.ts`, importado por
   el cliente y por la Edge Function (vía import map). Un solo origen de tipos.
3. Sobre de respuesta único:
```ts
type Respuesta<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; requestId: string; details?: unknown } }
```
   `code` en mayúsculas estable (`VALIDACION`, `NO_AUTENTICADO`, `PROHIBIDO`, `NO_ENCONTRADO`,
   `CONFLICTO`, `LIMITE`, `INTERNO`). `message` apto para mostrar; nunca trazas ni SQL.

## Archivos que produce
```
masterplan/api.md
src/shared/contratos/*.ts                     esquemas zod compartidos
supabase/functions/_shared/                   respuesta.ts, auth.ts, cors.ts, limite.ts, idempotencia.ts
supabase/functions/<operacion>/index.ts
supabase/functions/webhook-<proveedor>/index.ts
supabase/migrations/<ts>_api_soporte.sql      idempotencia, eventos_webhook, trabajos, limites
supabase/config.toml                          verify_jwt por función
tests/contrato/*.test.ts
```

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| API-01 | Toda Edge Function valida la entrada con zod antes de usarla | grep de `.parse`/`.safeParse` por función |
| API-02 | Toda Edge Function no pública verifica el JWT (`verify_jwt = true` o `getUser` explícito) | `supabase/config.toml` + grep |
| API-03 | Todo receptor de webhook verifica firma sobre el cuerpo crudo antes de parsear | grep `req.text()` antes de verificar; sin `req.json()` previo |
| API-04 | Todo webhook registra el id del evento con índice único y responde 200 al repetido sin reprocesar | migración `eventos_webhook` + test |
| API-05 | Operaciones que crean cobros, envíos o recursos aceptan `Idempotency-Key` y la guardan | test de doble envío |
| API-06 | Respuestas de error usan el sobre único y no filtran trazas, SQL ni secretos | test de contrato |
| API-07 | CORS con lista explícita de orígenes; prohibido `*` en funciones con credenciales | grep `Access-Control-Allow-Origin: *` |
| API-08 | Operaciones costosas o abusables tienen límite de uso por usuario/org/IP | tabla de límites o servicio, y test |
| API-09 | Ninguna función usa `service_role` sin comentario que justifique por qué RLS no basta | grep `SUPABASE_SERVICE_ROLE_KEY` |
| API-10 | Trabajos largos tienen estado, reintentos con tope y registro del último error | migración `trabajos` |
| API-11 | Llamadas a terceros con tiempo límite y reintento con espera creciente | grep de `fetch` sin `AbortSignal` |

## Pasos que agrega al plan
**Base compartida de funciones**
- Archivos: `supabase/functions/_shared/*`, `tests/contrato/base.test.ts`
- CUANDO una función recibe un cuerpo inválido EL SISTEMA DEBE responder 400 con `code: "VALIDACION"` y los campos fallidos.
- CUANDO llega una petición sin JWT a una función privada EL SISTEMA DEBE responder 401 con `code: "NO_AUTENTICADO"`.
- CUANDO llega una petición de un origen no permitido EL SISTEMA DEBE omitir las cabeceras CORS.
- Verificar: `npx vitest run tests/contrato` (requiere `supabase start`; el `globalSetup` de Vitest levanta `supabase functions serve` y lo baja al terminar)

**Idempotencia y límite de uso**
- CUANDO se repite una operación con la misma `Idempotency-Key` EL SISTEMA DEBE devolver la primera respuesta sin repetir el efecto.
- CUANDO un usuario supera el límite configurado EL SISTEMA DEBE responder 429 con `code: "LIMITE"` y `Retry-After`.
- Verificar: `npx vitest run tests/contrato/idempotencia.test.ts tests/contrato/limite.test.ts`

**Receptor de webhook** (por proveedor)
- CUANDO llega un webhook con firma inválida EL SISTEMA DEBE responder 400 y no escribir nada.
- CUANDO llega el mismo evento dos veces EL SISTEMA DEBE procesarlo una sola vez y responder 200 ambas.
- Verificar: `npx vitest run tests/contrato/webhook-<proveedor>.test.ts`

**Cola de trabajos** (si P2 = sí)
- CUANDO se encola un trabajo EL SISTEMA DEBE devolver su id de inmediato y mostrar su estado.
- CUANDO un trabajo falla 3 veces EL SISTEMA DEBE marcarlo `fallido` con el último error y avisar.
- Verificar: `npx vitest run tests/contrato/trabajos.test.ts`

## Pruebas obligatorias
1. Contrato por operación: entrada válida, inválida, sin auth, rol sin permiso.
2. Webhook: firma válida, inválida, repetido, fuera de orden.
3. Idempotencia: dos peticiones simultáneas con la misma llave producen un solo efecto.
4. Límite de uso: la petición N+1 recibe 429.

## Lista de producción
- [ ] Secretos de funciones cargados con `supabase secrets set` en producción (nunca en el repo)
- [ ] URLs de webhooks de producción registradas en cada proveedor, con su secreto de firma
- [ ] Orígenes CORS de producción y previews en la lista
- [ ] Límites de uso con valores reales (no los de desarrollo)
- [ ] `api.md` al día con lo publicado

## Trampas
- Parsear el JSON del webhook antes de verificar la firma: la firma se calcula sobre bytes exactos.
- Procesar el webhook y luego guardar el id: si falla a mitad, el reintento duplica. Guarda primero
  (insert con conflicto) y procesa dentro de la misma lógica.
- Confiar en el `org_id` que manda el cliente en una función con `service_role`: verifica la
  membresía en la función.
- Esperar a la IA o a un tercero dentro de la petición del usuario sin tiempo límite.
- Responder el error del proveedor tal cual al cliente: filtra detalles internos.
