# API · <nombre del proyecto>

<!-- masterplan/api.md · Fase 3 · con masterplan:kit-api. Incluye funciones de base (RPC),
     Edge Functions, route handlers y webhooks entrantes y salientes. -->

## Convenciones
_Base URL por entorno, versionado, formato de fechas y dinero, paginación, nombres._

## Autenticación
_Cómo se identifica cada tipo de cliente (JWT de usuario, llave de API, firma de webhook)._

## Formato de error
_Uno solo para toda la API._

```json
{ "error": { "codigo": "VALIDACION", "mensaje": "Texto para personas", "campos": { "email": "Formato inválido" }, "requestId": "…" } }
```

| Código | HTTP | Cuándo |
|---|---|---|
| `NO_AUTENTICADO` | 401 | Sin sesión o llave válida |
| `SIN_PERMISO` | 403 | Autenticado sin permiso |
| `NO_ENCONTRADO` | 404 | No existe o no es suyo |
| `VALIDACION` | 422 | Entrada inválida |
| `LIMITE` | 429 | Superó el límite de uso |
| `INTERNO` | 500 | Error no controlado (se reporta) |

## Endpoints
_Una subsección por endpoint o función._

### `<MÉTODO> /v1/<ruta>` · <nombre>
- **Qué hace:** _una línea._
- **Auth y permiso:** _quién puede, según la matriz de seguridad.md._
- **Entrada:** _esquema (zod o tabla de campos)._
- **Salida:** _esquema y código de éxito._
- **Errores:** _códigos posibles de la tabla de arriba._
- **Idempotencia:** _sí/no y clave._
- **Límite de uso:** _por usuario/llave/IP._
- **Tiempo máximo y dependencias:** _terceros que llama y qué pasa si fallan._
- **Requisitos:** _IDs de specs/ (API-00X)._

## Webhooks entrantes
_Proveedor, eventos, verificación de firma, registro de id de evento, respuesta rápida y procesamiento aparte._

| Proveedor | Eventos | Firma | Idempotencia | Función |
|---|---|---|---|---|

## Webhooks salientes
_Si el sistema avisa a otros: eventos, firma, reintentos._

## CORS
_Orígenes permitidos por entorno._

## Observabilidad
_Qué se registra por petición (id, actor, ruta, estado, duración) y qué nunca (cuerpos, secretos)._
