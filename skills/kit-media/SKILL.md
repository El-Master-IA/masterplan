---
name: kit-media
description: >-
  Archivos, video e imágenes en una app: elegir dónde guardar (Supabase Storage, Cloudflare R2,
  Bunny Storage, S3), cuándo el video necesita un servicio propio (Bunny Stream, Mux, Cloudflare
  Stream, api.video) y cuándo las imágenes necesitan transformación (Cloudinary, ImageKit, Bunny
  Optimizer), con subidas directas desde el navegador, URLs firmadas, permisos por usuario,
  límites de tamaño, webhooks de procesamiento y costo de salida. Úsala cuando el alcance tenga
  documentos, fotos, cursos, contenido en video o en vivo, en fases 3, 5 y 6.
  EN: file uploads, object storage, video streaming (VOD/live/DRM), image transformation, signed URLs.
---

# Kit · Media (archivos, video e imágenes)

El error más caro en apps con contenido es guardar video en el almacenamiento de la base y
servirlo tal cual: pesa, no se adapta a la conexión del usuario y la salida de datos se come el
presupuesto. Este kit separa las tres cosas: **archivos**, **video** e **imágenes**.

Los proveedores salen de `masterplan.mjs proveedores recomendar` (rasgos `subidas-directas`,
`archivos-grandes`, `sin-costo-salida`, `video-vod`, `video-en-vivo`, `drm`,
`transformacion-imagenes`). Precios en `conocimiento/proveedores.json` con fecha; confírmalos con
`masterplan:investigador` antes de presentarlos.

## Cuándo aplica
Cualquier subida o descarga de archivos: avatares, documentos, comprobantes, fotos de producto,
cursos, clases grabadas o en vivo.

## Preguntas de negocio (se asume el default)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Qué suben tus usuarios o tú: documentos, fotos o video? ¿De qué tamaño?" | Fotos y PDFs de menos de 50 MB | Almacenamiento simple vs. servicio de video y subidas grandes |
| 2 | "¿Ese contenido es privado (solo su dueño o quien pagó) o público?" | Privado | URLs firmadas con vencimiento y permisos por usuario |
| 3 | "¿Te importa que no puedan descargar ni compartir los videos?" | Basta con URLs firmadas | DRM (más caro) vs. tokens de reproducción |

## Decisión: dónde va cada cosa
| Si… | Entonces… | Por qué |
|---|---|---|
| Archivos de usuarios con permisos (avatares, documentos) y la base es Supabase | Supabase Storage con políticas RLS por carpeta de usuario/org | Los permisos viven donde viven los datos |
| Mucha descarga de archivos o archivos grandes | Cloudflare R2 (sin costo de salida) con URLs firmadas desde tu servidor | La salida gratis cambia la factura; ojo: R2 no tiene ubicación en Sudamérica |
| Los datos deben quedar físicamente en Latinoamérica | Bunny Storage (región São Paulo) o S3 `sa-east-1` | Residencia de datos |
| Video bajo demanda (cursos, contenido) con presupuesto bajo | Bunny Stream | Encoding estándar gratis, almacenamiento y entrega por GB muy baratos; sin plan gratis (prueba de 14 días) |
| Video bajo demanda + en vivo, o DRM, o analítica de calidad | Mux | VOD y en vivo con plan gratis para probar; DRM como complemento a cotizar |
| La app ya vive en Cloudflare y el video es VOD o en vivo sin DRM | Cloudflare Stream | Cobra por minutos guardados y entregados, encoding gratis |
| Transcripción o resúmenes automáticos del video | api.video (complementos de IA) o tu propio paso con un modelo | Evita armar el pipeline |
| Fotos que se muestran en varios tamaños (catálogo, miniaturas) | Cloudinary o ImageKit (plan gratis); Bunny Optimizer si ya usas Bunny (tarifa fija por sitio) | Transformación por URL y formatos modernos sin procesar tú |
| Imágenes pocas y fijas del propio sitio | Las optimiza el build (imágenes del framework) | No necesitas un servicio |

Nunca: video en el almacenamiento de la base para hacer streaming, ni archivos dentro de la base de
datos como columnas binarias.

## Cómo se sube (igual con cualquier proveedor)
1. El navegador pide permiso a **tu servidor** (Edge Function, ruta de API o Worker): envía tipo,
   tamaño y para qué es.
2. El servidor valida sesión, permiso, tipo (lista blanca de MIME), tamaño máximo y cuota del plan;
   registra una fila `archivos` en estado `subiendo` y devuelve una **URL firmada de subida** (o el
   token de subida directa del servicio de video) con vencimiento corto.
3. El navegador sube **directo al proveedor**, sin pasar el archivo por tu servidor.
4. El proveedor avisa por **webhook firmado** (video listo, procesamiento fallido) o tu servidor
   confirma la subida; la fila pasa a `listo` con su id externo, duración, tamaño.
5. Para ver o reproducir, el servidor entrega una **URL o token firmado** con vencimiento.

## Modelo de datos
```
archivos(id uuid, org_id, subido_por, tipo, mime, bytes, proveedor, clave_externa,
         estado subiendo|procesando|listo|fallido, publico bool, created_at, deleted_at)
videos(id uuid, archivo_id, proveedor_video_id, duracion_seg, estado, miniatura_url, created_at)
```
RLS (o autorización en la API): solo miembros de `org_id` leen; solo el dueño o un admin borra.

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| MED-01 | Las subidas validan tipo (lista blanca) y tamaño en el servidor, no solo en el navegador | test que sube un `.exe` y uno de 2× el límite: ambos rechazados |
| MED-02 | Contenido privado solo se entrega con URL o token firmado con vencimiento | test: URL vencida devuelve 403 |
| MED-03 | Las llaves del proveedor de archivos/video viven solo en el servidor | políticas MP-SEC-0x + `auditor` |
| MED-04 | Webhooks del servicio de video verificados por firma e idempotentes por id de evento | test con evento falso y repetido |
| MED-05 | Video para streaming va a un servicio de video, nunca al almacenamiento de la base | revisión de `docs/media.md` |
| MED-06 | Borrar un registro borra (o programa borrar) el archivo en el proveedor | test de borrado + trabajo de limpieza |
| MED-07 | Costo de almacenamiento y salida a 1× y 10× anotado en `arquitectura.md` | `revisor-plano` |

## Construcción
Archivos, pasos del plan, pruebas obligatorias, lista de producción y trampas están en
`construccion.md` (junto a este archivo). Lo lee quien planea (fase 5) y quien construye (fase 6);
para decidir en la fase 3 basta este archivo.
