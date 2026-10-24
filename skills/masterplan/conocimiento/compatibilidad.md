# Compatibilidad: combinaciones que se rompen juntas

Estas combinaciones fallan por el **rol** que cumple cada pieza, no por su versión. Revísalas en
la fase 3 (después de elegir perfil y capacidades) y otra vez en la fase 4. Una fila que aplique
y no tenga su "qué hacer" resuelto es una pregunta `[ABIERTA: …]`.

Las incompatibilidades de versión (paquete X no soporta Y) las verifica `masterplan:investigador`
en registros oficiales; no van aquí.

## Identidad y acceso

| Combinación | Por qué se rompe | Qué hacer |
|---|---|---|
| Dos proveedores de identidad (p. ej. Supabase Auth + otro servicio de login) | Dos fuentes de verdad del usuario; RLS lee `auth.uid()` de uno y la app usa el otro; sesiones que no coinciden | Un solo proveedor. Si se exige el externo, integrarlo como proveedor de terceros de Supabase y escribir un ADR |
| `service_role` (o cualquier clave de administrador) en el cliente | Salta todas las políticas RLS; cualquiera la lee en el bundle | Solo en servidor (Edge Function, función de servidor). El cliente usa la clave pública. Lo bloquea la política del plugin |
| Variables `VITE_*` (o `NEXT_PUBLIC_*`) con secretos | Todo lo que tiene ese prefijo se incrusta en el JavaScript público | Ese prefijo solo para valores públicos (URL del proyecto, clave anónima). Secretos en el servidor |
| RLS desactivado "mientras tanto" | Con la clave pública, la tabla queda abierta a internet | RLS activo desde la migración que crea la tabla, con su test de aislamiento |
| Autorización solo en el frontend (ocultar botones) | La API sigue aceptando la acción | La regla vive en RLS o en la función de servidor; el frontend solo refleja |
| Roles guardados en `user_metadata` editable por el usuario | El usuario se sube de rol a sí mismo | Roles en tabla propia (`memberships`) o en `app_metadata` escrito solo desde el servidor |
| Sesión en `localStorage` + contenido HTML de usuarios sin sanear | Un XSS roba la sesión | Sanear HTML, CSP estricta, nada de `dangerouslySetInnerHTML` con entrada de usuario |

## Ejecución y cómputo

| Combinación | Por qué se rompe | Qué hacer |
|---|---|---|
| Procesos largos (video, scraping masivo, lotes de IA) en funciones serverless | Límite de tiempo de ejecución; el trabajo muere a la mitad y no deja rastro | Cola o trabajador dedicado; la función solo encola y responde. El estado del trabajo en una tabla |
| Conexiones directas a Postgres desde serverless sin pooler | Cada invocación abre conexiones; se agota el límite de la base | Usar el pooler (modo transacción) o la API de datos de Supabase |
| Estado en memoria (sesiones, rate limit, cache) con varias instancias | Cada instancia tiene su propia memoria; el límite no limita y la cache miente | Estado compartido en la base o en un almacén externo (Redis o similar) |
| Archivos escritos en el disco local de una función | El disco es efímero; el archivo desaparece | Storage de Supabase u otro almacenamiento de objetos |
| Cron en el cliente o en `setInterval` del servidor | No corre si nadie tiene la página abierta o la instancia se duerme | Cron programado de la plataforma (pg_cron, cron del hosting) que llama una función |
| WebSockets propios en hosting serverless | Las conexiones largas no se mantienen | Realtime de Supabase o un servicio dedicado |
| Webhooks sin verificación de firma | Cualquiera puede falsificar un pago o un evento | Verificar firma con el secreto del proveedor y guardar el id del evento para idempotencia |
| Webhook que procesa todo antes de responder | El proveedor reintenta por timeout y duplica | Responder 2xx rápido, registrar el evento y procesar aparte de forma idempotente |

## Frontend y build

| Combinación | Por qué se rompe | Qué hacer |
|---|---|---|
| CSS-in-JS con runtime + framework de utilidades (Tailwind) | Dos sistemas de estilos peleando especificidad; peso extra de JS; problemas con renderizado en servidor | Un solo sistema: utilidades + variables CSS para tokens |
| Dos librerías de componentes con su propio tema | Tokens duplicados, focos y contrastes inconsistentes | Una base (shadcn/ui sobre Radix) y componentes propios encima |
| Dos gestores de estado para datos del servidor (cache propia + librería de consultas) | Datos desincronizados, doble fuente de verdad | Datos del servidor en TanStack Query; estado de UI local o en un store pequeño |
| SPA (Vite) para páginas que deben indexarse | Los buscadores y agentes ven una página vacía o tarde | Páginas públicas prerenderizadas o un sitio aparte; o perfil Next.js |
| Rutas de SPA sin reescritura en el hosting | Recargar una ruta interna da 404 | Regla de rewrite a `index.html` en la configuración del hosting |
| Fuentes e imágenes sin tamaño definido | CLS alto, saltos de layout | Dimensiones explícitas, `font-display: swap`, fuentes precargadas |
| Dos gestores de paquetes en el mismo repo | Lockfiles en conflicto; instalaciones distintas en CI | Uno solo; borrar el lockfile ajeno |

## Datos

| Combinación | Por qué se rompe | Qué hacer |
|---|---|---|
| Dinero en `float`/`numeric` sin escala fija en el cliente | Errores de redondeo | Enteros en la unidad mínima (centavos) y moneda en columna aparte |
| Fechas sin zona horaria | Reportes y cortes de día corridos | `timestamptz` siempre; mostrar en la zona del usuario |
| Borrado físico de filas con dependencias y sin regla | Huérfanos o borrados en cascada inesperados | Definir por relación: `cascade`, `restrict` o borrado lógico |
| Migraciones hechas a mano en el panel + migraciones en archivos | El repo deja de describir la base | Todo cambio de esquema en `supabase/migrations/`; el panel solo para mirar |
| Tenencia por usuario y luego "agregar equipos" | Reescribir RLS, datos y pantallas | Decidir tenencia por organización desde el día 1 (organización personal) |
| Búsqueda con `ILIKE '%x%'` sobre tablas grandes | Escaneo completo en cada búsqueda | Índice trigram o búsqueda de texto completo |

## Servicios externos

| Combinación | Por qué se rompe | Qué hacer |
|---|---|---|
| Llaves de pago de prueba y de producción mezcladas en el mismo entorno | Cobros reales en pruebas o webhooks que no llegan | Un juego de llaves por entorno; preview siempre en modo prueba |
| Correo transaccional desde el mismo dominio sin SPF/DKIM | Los correos caen en spam | Dominio verificado en el proveedor antes del lanzamiento |
| Llamadas a modelos de IA directas desde el navegador | Expone la llave y no hay límite de gasto | Pasar por función de servidor con límite por usuario |
| Analítica con datos personales sin consentimiento | Incumple Habeas Data / GDPR | Eventos sin PII o banner de consentimiento antes de cargar |
