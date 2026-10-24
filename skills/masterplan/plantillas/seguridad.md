# Seguridad · <nombre del proyecto>

<!-- masterplan/seguridad.md · Fase 3 · masterplan:arquitecto-datos + maestro de obra.
     masterplan:auditor-seguridad audita el código contra este documento en las fases 6 y 7. -->

## Superficie
_Lista corta de lo expuesto a internet: dominios, funciones públicas, webhooks, buckets, formularios._

## Amenazas por capacidad (STRIDE corto)
_Por cada capacidad del proyecto, solo las amenazas que aplican, con mitigación y el requisito o tarea que la cubre._

| Capacidad | Amenaza (S/T/R/I/D/E) | Escenario | Mitigación | Req./Tarea |
|---|---|---|---|---|
| auth | S · suplantación | Robo de sesión por XSS | CSP, sin HTML de usuario sin sanear | AUTH-00X |
| datos | I · divulgación | Usuario lee filas de otra org | RLS + test de aislamiento | DATA-00X |
| pagos | T · manipulación | Webhook falsificado | Firma verificada + idempotencia | PAY-00X |

<!-- S suplantación · T manipulación · R repudio · I divulgación · D denegación · E elevación de privilegio -->

## Roles
_Cada rol con una línea de qué es. Dónde se guarda el rol (tabla, nunca metadatos editables)._

| Rol | Quién es | Cómo se asigna |
|---|---|---|
| anónimo | Visitante sin sesión | — |

## Matriz rol × recurso × acción
_C crear · L leer · A actualizar · B borrar. "propio" = solo filas de su org/usuario. Vacío = denegado._

| Recurso | anónimo | member | admin | owner | sistema |
|---|---|---|---|---|---|
| `<tabla>` | | L propio | CLAB propio | CLAB propio | |

## Políticas RLS por tabla
_Una fila por política; cada una se corresponde con una celda de la matriz y tiene su test._

| Tabla | Política | Operación | Rol | Condición (en palabras) | Test |
|---|---|---|---|---|---|
| `<tabla>` | `<tabla>_leer_miembros` | SELECT | authenticated | es miembro de `org_id` | `supabase/tests/<tabla>.test.sql` |

Regla: toda tabla de `public` tiene RLS activo. Tablas sin acceso del cliente: RLS activo y sin
políticas (solo servidor).

## Secretos por entorno
_Nombre, dónde vive, quién lo lee. Valores nunca aquí. Nada secreto con prefijo público (`VITE_`, `NEXT_PUBLIC_`)._

| Variable | Público | Local | Preview | Producción | Lo lee |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | sí | `.env.local` | Vercel | Vercel | navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | no | `supabase/functions/.env` | secrets | secrets | Edge Functions |

## Validación y límites
_Dónde se valida cada entrada (cliente y servidor), límites de uso por endpoint, tamaños máximos de archivo._

## Headers y transporte
_CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CORS por origen._

## Privacidad
_Régimen aplicable según dónde viven los usuarios. Marca los que aplican y qué exige cada uno._

| Régimen | Aplica | Exige en este proyecto |
|---|---|---|
| Colombia · Habeas Data (Ley 1581 de 2012) |  | Autorización previa y expresa, política de tratamiento publicada, canal para consultas y reclamos, finalidad declarada |
| UE · GDPR |  | Base legal por tratamiento, derechos de acceso/rectificación/supresión/portabilidad, encargados con contrato |
| México · LFPDPPP |  | Aviso de privacidad, derechos ARCO |
| Brasil · LGPD |  | Base legal, encargado de datos, derechos del titular |
| Argentina · Ley 25.326 / Chile · Ley 19.628 (y su reforma) / Perú · Ley 29733 |  | Consentimiento, derechos del titular, seguridad de los datos |

- **Datos personales tratados:** _cuáles, con qué finalidad (enlaza a datos.md › retención)._
- **Encargados (terceros que procesan datos):** _hosting, correo, analítica, IA, pagos; región._
- **Consentimiento:** _qué se pide, cuándo y dónde se guarda la prueba._
- **Derechos del titular:** _cómo se pide acceso o borrado y en cuántos días se atiende._
- **Incidentes:** _a quién se avisa y en qué plazo._

## Excepciones
_Riesgos aceptados conscientemente, con motivo, dueño y fecha de revisión. Coincide con evidencia/excepciones.log._

| Regla | Dónde | Motivo | Dueño | Revisar |
|---|---|---|---|---|
