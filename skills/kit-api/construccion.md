# Kit · api · construcción

Segunda mitad del kit `masterplan:kit-api`. Las decisiones y los candados están en `SKILL.md`.

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
