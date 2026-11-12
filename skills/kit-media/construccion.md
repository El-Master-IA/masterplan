# Kit · media · construcción

Segunda mitad del kit `masterplan:kit-media`. Las decisiones y los candados están en `SKILL.md`.

## Archivos que produce
`supabase/functions/firmar-subida/` (o `api/src/rutas/archivos.ts` / Worker equivalente),
`src/features/archivos/` (componente de subida con progreso, reintento y cancelación),
`webhooks/video.ts` con verificación de firma, migración de `archivos`/`videos` con sus políticas,
`docs/media.md` con proveedor, límites y costo.

## Pasos que agrega al plan
1. Tabla `archivos` (+ `videos` si aplica) con permisos y test de aislamiento.
   - CUANDO un usuario de la org A pide un archivo de la org B EL SISTEMA DEBE responder 403/404
   - CUANDO se borra un archivo EL SISTEMA DEBE marcarlo y programar su borrado en el proveedor
2. Firma de subida en el servidor con límites.
   - CUANDO se pide subir un tipo no permitido EL SISTEMA DEBE rechazarlo con error VALIDACION
   - CUANDO el archivo supera el tamaño máximo EL SISTEMA DEBE rechazarlo antes de firmar
3. Componente de subida con progreso, reintento y estados (cargando, error, listo).
4. (Video) Integración con el servicio de video: subida directa, webhook de "listo", reproductor con token firmado.
   - CUANDO llega el webhook de video listo EL SISTEMA DEBE pasar el video a `listo` una sola vez
5. (Imágenes) URLs de transformación por tamaño y formato moderno en el componente de imagen.

## Pruebas obligatorias
Tipo y tamaño rechazados en el servidor · URL firmada vencida · aislamiento entre orgs · webhook
falso rechazado · webhook repetido sin efecto doble.

## Lista de producción
CORS del bucket solo para tus dominios · límites de tamaño por plan · regla de ciclo de vida para
archivos huérfanos · alerta de costo de salida · política de retención y borrado de datos
personales.

## Trampas
- Subir el archivo a tu servidor y de ahí al proveedor: duplica tiempo y costo.
- Buckets públicos "para que funcione": cualquiera lista y descarga.
- Olvidar la salida de datos al estimar costos: en video es la mayor parte de la factura.
- Mostrar el video antes de que termine el procesamiento: usa el estado y el webhook.
