# Tipo: API

Servicio que **consumen otros programas**: tu propia app móvil, integraciones de clientes,
socios o desarrolladores externos. No tiene pantallas propias más allá de la documentación y,
a veces, un panel para gestionar llaves. El contrato es el producto.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Que otros sistemas se conecten a mis datos" | API para terceros |
| "Un backend para mi app móvil" | API privada con clientes conocidos |
| "Que mis clientes lo integren con su ERP/CRM" | API con llaves por cliente |
| "Exponer un endpoint que calcule/valide/convierta X" | Servicio de cómputo |
| "Cobrar por uso / por llamada" | Medición y límites |

## No es este tipo si…

- Hay personas usando pantallas como producto principal → `saas` (la API es una capacidad).
- Se despierta solo por cron o eventos y no lo llama nadie → `bot`.
- Su valor es la respuesta de un modelo de IA → `app-ia` (con API como forma de entrega).

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| api (contratos, versionado, errores) | Sí | `masterplan:kit-api` |
| auth de máquina (llaves o tokens) | Sí | `masterplan:kit-auth` |
| datos con tenencia por cliente | Casi siempre | `masterplan:kit-datos` |
| observabilidad (logs por petición, métricas, health) | Sí | `masterplan:kit-observabilidad` |
| deploy | Sí | `masterplan:kit-deploy` |
| pagos por uso | Si se cobra | `masterplan:kit-pagos` |
| frontend (docs + panel de llaves) | Si es pública | `masterplan:kit-frontend` |

## Decisión clave: estilo de contrato y versionado

| Opción | Cuándo |
|---|---|
| REST con OpenAPI | Por defecto; lo entienden todos los clientes y herramientas |
| RPC (funciones Postgres o Edge Functions) | API privada para tu propia app, pocas operaciones |
| GraphQL | Muchos clientes con necesidades de datos muy distintas; casi nunca en v1 |

**Recomendación:** REST con especificación OpenAPI escrita **antes** del código, versión en la ruta
(`/v1/`), errores con formato único (código, mensaje, detalle por campo) y llaves por cliente
guardadas como hash. Cambios incompatibles solo en una versión nueva.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `clients` | `id`, `nombre`, `plan`, `estado`, `creado` | El inquilino de la API |
| `api_keys` | `id`, `client_id`, `prefijo` (visible), `hash`, `scopes[]`, `ultima_vez`, `revocada` | La llave completa se muestra una sola vez |
| `usage` | `client_id`, `periodo`, `endpoint`, `llamadas` | Agregado, no una fila por petición |
| `idempotency_keys` | `client_id`, `clave`, `respuesta_hash`, `expira` | Para POST que crean o cobran |
| `<recurso>` | `id`, `client_id`, campos del negocio | Tenencia por cliente |
| `webhook_endpoints` (si envía eventos) | `client_id`, `url`, `secreto_hash`, `eventos[]` | Firma en cada envío |

## Estructura de carpetas (perfil React + Vite + Supabase)

```
openapi/
  v1.yaml              # contrato fuente de verdad
supabase/
  functions/
    _shared/           # auth por llave, errores, rate limit, validación zod, logger
    v1-<recurso>/      # una función por recurso
  migrations/
  tests/
src/                   # solo si hay panel: docs + gestión de llaves
tests/
  contract/            # el servidor cumple openapi/v1.yaml
  integration/
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | Contrato, 2–4 endpoints, llaves, errores, rate limit, docs generadas | Mínima + panel de llaves, medición de uso, idempotencia, webhooks salientes, SDK o ejemplos |
| Pasos | 8–10 | 12–14 |
| Non-Goals frecuentes | GraphQL, SDKs en varios lenguajes, OAuth para terceros, facturación por uso, multirregión | |

## Orden base de construcción

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, lint, typecheck, test | CUANDO se corren los scripts de calidad en un clon limpio EL SISTEMA DEBE salir con código 0 | Scripts |
| 2 | Contrato OpenAPI v1 validado | CUANDO se modifica `openapi/v1.yaml` EL SISTEMA DEBE validarlo con un linter de OpenAPI sin errores | Lint del contrato |
| 3 | Esquema base con RLS: `clients`, `api_keys`, `usage` | CUANDO se crea una tabla EL SISTEMA DEBE tener RLS activo y política explícita | Test de tablas sin RLS = 0 |
| 4 | Autenticación por llave | CUANDO llega una petición sin llave, con llave revocada o inválida EL SISTEMA DEBE responder 401 con el formato de error único | Tests de integración |
| 5 | Formato de error y validación de entrada | CUANDO el cuerpo no cumple el esquema EL SISTEMA DEBE responder 422 con un detalle por campo | Tests de validación |
| 6 | Aislamiento entre clientes | CUANDO el cliente A pide un recurso del cliente B EL SISTEMA DEBE responder 404 | Test con dos llaves |
| 7 | Primer recurso (lectura) | CUANDO se lista un recurso EL SISTEMA DEBE paginar con cursor y un máximo de elementos por página | Test de contrato |
| 8 | Escritura con idempotencia | CUANDO se repite un POST con la misma `Idempotency-Key` EL SISTEMA DEBE devolver la misma respuesta sin crear un duplicado | Test de repetición |
| 9 | Rate limit por llave | CUANDO una llave supera su límite EL SISTEMA DEBE responder 429 con `Retry-After` | Test de límite |
| 10 | Tests de contrato | CUANDO una respuesta no coincide con `openapi/v1.yaml` EL SISTEMA DEBE fallar la suite | `npm run test` (carpeta contract) |
| 11 | Logs y métricas por petición | CUANDO se procesa una petición EL SISTEMA DEBE registrar id de petición, cliente, ruta, estado y duración, sin el cuerpo | Test del logger |
| 12 | Medición de uso | CUANDO termina una petición exitosa EL SISTEMA DEBE sumar una llamada al periodo del cliente | Test de integración |
| 13 | Docs publicadas desde el contrato | CUANDO se despliega EL SISTEMA DEBE publicar la referencia generada desde `openapi/v1.yaml` | Smoke a la URL de docs |
| 14 | Deploy con health check y CORS explícito | CUANDO un origen no permitido llama desde un navegador EL SISTEMA DEBE rechazar el preflight | `curl` en preview |

## Trampas típicas

| Trampa | Prevención |
|---|---|
| Llaves guardadas en texto plano | Solo hash + prefijo visible |
| Cambiar un campo en `/v1` y romper integraciones | Cambios incompatibles solo en `/v2`; test de contrato |
| Errores con formatos distintos por endpoint | Módulo `_shared/errores` único |
| Paginación con `offset` en tablas grandes | Cursor |
| CORS con `*` y credenciales | Lista de orígenes explícita |
| Logs con el cuerpo de la petición (datos personales, secretos) | Registrar metadatos, nunca cuerpos |

## Lista de lanzamiento

- [ ] Dominio de la API con HTTPS
- [ ] Docs públicas con ejemplos que funcionan copiando y pegando
- [ ] Política de deprecación escrita (cuánto aviso antes de retirar una versión)
- [ ] Página de estado o canal para incidentes
- [ ] Términos de uso y límites publicados
- [ ] Un cliente real (o de prueba externo) integró sin ayuda
