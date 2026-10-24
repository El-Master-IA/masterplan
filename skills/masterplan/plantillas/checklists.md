# Checklists de calidad de requisitos

Se corren en la fase 4 (Puerta C). Prueban que **los requisitos** están completos, sin ambigüedad
y son verificables; no prueban código. Cada ítem se responde SÍ o NO mirando los documentos de
`masterplan/`. Un NO se convierte en pregunta `[ABIERTA: …]` o en Non-Goal; nunca se deja pasar.
Si un ítem no aplica al tipo, se marca "N/A" con una razón de una línea.

Formato de registro en el relevo de la fase 4: `SEG-03: NO → [ABIERTA: …]`.

## Seguridad

| ID | Pregunta | SÍ/NO |
|---|---|---|
| SEG-01 | ¿Cada rol del producto aparece en la matriz rol × recurso × acción de `seguridad.md`? | |
| SEG-02 | ¿Toda tabla con datos tiene política RLS descrita para leer, crear, actualizar y borrar? | |
| SEG-03 | ¿Está escrito qué ve un anónimo en cada recurso (aunque sea "nada")? | |
| SEG-04 | ¿Cada secreto tiene nombre, entorno donde vive y quién lo puede leer, y ninguno usa prefijo público? | |
| SEG-05 | ¿Hay requisito de aislamiento entre inquilinos con su test nombrado? | |
| SEG-06 | ¿Cada webhook entrante tiene requisito de verificación de firma e idempotencia? | |
| SEG-07 | ¿Están definidos límites de uso (rate limit) para login, formularios públicos y endpoints caros? | |
| SEG-08 | ¿Está definido cómo se asignan y cambian roles, y que solo el servidor puede hacerlo? | |
| SEG-09 | ¿Están definidos los headers de seguridad (CSP, HSTS y demás) que debe servir producción? | |
| SEG-10 | ¿Las amenazas STRIDE de cada capacidad tienen mitigación o están aceptadas como excepción con motivo? | |

## Datos

| ID | Pregunta | SÍ/NO |
|---|---|---|
| DAT-01 | ¿Cada entidad tiene dueño explícito (`org_id`, `user_id` o sistema)? | |
| DAT-02 | ¿Cada relación dice qué pasa al borrar el padre (cascada, restringir, lógico)? | |
| DAT-03 | ¿Los montos de dinero están en enteros con su moneda? | |
| DAT-04 | ¿Todas las fechas son con zona horaria y está definida la zona de visualización? | |
| DAT-05 | ¿Cada consulta frecuente tiene su índice nombrado? | |
| DAT-06 | ¿Está definido cuánto tiempo se guarda cada dato personal y cómo se borra a pedido? | |
| DAT-07 | ¿Está definido el backup (frecuencia) y cuándo se prueba una restauración? | |
| DAT-08 | ¿Los valores con estados (pedido, suscripción) tienen sus transiciones permitidas escritas? | |
| DAT-09 | ¿Las operaciones que tocan varias tablas tienen requisito de atomicidad? | |
| DAT-10 | ¿Hay datos de semilla definidos para desarrollo y tests, sin datos reales? | |

## API

| ID | Pregunta | SÍ/NO |
|---|---|---|
| API-01 | ¿Cada endpoint o función tiene entrada, salida y errores con su código? | |
| API-02 | ¿Hay un formato de error único para toda la API? | |
| API-03 | ¿Cada endpoint dice qué autenticación exige y qué permiso verifica? | |
| API-04 | ¿Las operaciones que crean, cobran o envían tienen requisito de idempotencia? | |
| API-05 | ¿Los listados tienen paginación con tamaño máximo? | |
| API-06 | ¿Está definido el límite de uso por endpoint o grupo de endpoints? | |
| API-07 | ¿Están definidos los tiempos máximos y qué pasa si un tercero no responde? | |
| API-08 | ¿Está definida la política de versiones y de cambios incompatibles? | |
| API-09 | ¿Está definida la lista de orígenes permitidos (CORS)? | |
| API-10 | ¿Está definido qué se registra por petición y que nunca se registran cuerpos con datos personales? | |

## UX

| ID | Pregunta | SÍ/NO |
|---|---|---|
| UX-01 | ¿Cada pantalla de `EXPERIENCE.md` tiene sus estados cargando, vacío, error y sin permiso? | |
| UX-02 | ¿El flujo principal está escrito paso a paso y cada paso apunta a una pantalla? | |
| UX-03 | ¿Los textos clave (titulares, botones principales, errores frecuentes) están escritos, no "lorem"? | |
| UX-04 | ¿Cada par texto/fondo de `DESIGN.md` tiene contraste calculado que cumple AA? | |
| UX-05 | ¿Está definido el comportamiento en móvil de cada pantalla principal? | |
| UX-06 | ¿El flujo principal se puede completar solo con teclado y está escrito como requisito? | |
| UX-07 | ¿Hay presupuestos de rendimiento (LCP, INP, CLS, JS inicial) con números? | |
| UX-08 | ¿Está escrito qué ve un usuario nuevo la primera vez (onboarding o estado vacío útil)? | |
| UX-09 | ¿Las acciones destructivas tienen confirmación o deshacer definido? | |
| UX-10 | ¿La lista "No usar" de `DESIGN.md` nombra patrones concretos? | |

## Deploy

| ID | Pregunta | SÍ/NO |
|---|---|---|
| DEP-01 | ¿Están definidos los entornos (local, preview, producción) y qué servicios usa cada uno? | |
| DEP-02 | ¿Preview usa datos y llaves de prueba, nunca de producción? | |
| DEP-03 | ¿Está escrito que las migraciones se aplican antes de promover a producción? | |
| DEP-04 | ¿Hay un health check con su URL y respuesta esperada? | |
| DEP-05 | ¿Está definido el smoke test que corre contra la preview? | |
| DEP-06 | ¿Está escrito cómo se hace rollback y cuánto tarda? | |
| DEP-07 | ¿Las alertas de error tienen destinatario real? | |
| DEP-08 | ¿Toda variable de entorno usada está listada con su entorno? | |
| DEP-09 | ¿La lista de lanzamiento manual (dominio, pagos, correo, legales) está completa? | |
| DEP-10 | ¿El costo mensual a 1× y 10× está estimado con el punto de salto de plan? | |
