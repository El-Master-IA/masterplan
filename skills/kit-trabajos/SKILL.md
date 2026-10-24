---
name: kit-trabajos
description: >-
  Trabajo fuera de la petición del usuario: colas, tareas programadas (cron), reintentos, procesos
  largos y workflows de varios pasos. Elige entre pg_cron/Supabase Queues, Inngest, Trigger.dev,
  Upstash QStash, Cloudflare Queues y Workflows, Vercel Queues o BullMQ con Redis en un servidor
  propio, según duración, volumen y dónde vive la app. Úsala cuando el alcance envíe correos o
  WhatsApp en masa, procese archivos o video, genere reportes, llame modelos de IA largos, reciba
  webhooks o tenga recordatorios, en fases 3, 5 y 6.
  EN: background jobs, queues, cron, retries, durable workflows, long-running tasks.
---

# Kit · Trabajos en segundo plano

Regla base: **la petición del usuario responde rápido; lo lento se encola**. Todo lo que tarda
más de unos segundos, depende de un tercero o puede fallar y repetirse va a un trabajo con
reintentos, no dentro de la petición.

Proveedores: `masterplan.mjs proveedores recomendar` con rasgos `worker-cola`, `cola-simple`,
`cron`, `programador`, `reintentos`, `workflows-durables`, `proceso-largo`. Datos y precios con
fecha en `conocimiento/proveedores.json`.

## Cuándo aplica
Correos y mensajes, procesamiento de archivos o video, reportes, sincronización con terceros,
llamadas largas a modelos de IA, recordatorios, limpieza nocturna, webhooks entrantes que
disparan trabajo.

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Qué tiene que pasar sin que el usuario espere? ¿Cuánto tarda lo más lento?" | Correos y procesamiento de menos de 1 minuto | Cola simple vs. proceso largo |
| 2 | "¿Hay cosas que se repiten a una hora fija?" | Una limpieza diaria | Cron |
| 3 | "¿Algún proceso tiene varios pasos que no se pueden perder a la mitad (cobrar, luego enviar, luego avisar)?" | No | Workflow durable con pasos y reintentos por paso |

## Decisión
| Si… | Entonces… | Por qué |
|---|---|---|
| Solo cron simple y la base es Supabase | Supabase Cron (pg_cron) llamando a una Edge Function | Cero piezas nuevas |
| Cola simple, volumen bajo, base Supabase | Supabase Queues (pgmq) | Mensajes durables en la misma base, con RLS |
| App serverless (Vercel/Netlify) con trabajos de varios pasos, reintentos y eventos | Inngest | Corre en tu propia app, pasos durables; plan gratis por ejecuciones |
| Tareas largas en TypeScript que no caben en una función serverless | Trigger.dev | Corre en su infraestructura sin límite de tiempo de función |
| Pocos mensajes por HTTP con reintentos y retrasos, sin servidor | Upstash QStash | Entrega a tus endpoints; 1.000 mensajes diarios gratis |
| La app vive en Cloudflare Workers | Cloudflare Queues (cola) y Workflows (varios pasos) | Integrados al runtime; Workflows cobra pasos y almacenamiento desde ago-2026 |
| La app vive en Vercel y aceptas un producto en beta | Vercel Queues | Integrado a Vercel Functions |
| Ya tienes un servidor siempre encendido (Railway, Render, VPS) | BullMQ + Redis en el mismo proyecto, worker como servicio aparte | Gratis (MIT), sin límites de duración; tú operas Redis |

## Reglas que valen con cualquier proveedor
1. **Idempotencia:** cada trabajo tiene una clave (ej. `enviar-bienvenida:<user_id>`); ejecutarlo dos
   veces no duplica el efecto. Los reintentos y los webhooks repetidos son normales.
2. **Reintentos con espera creciente** y un máximo; al agotarlos, el trabajo va a una lista de
   fallidos (dead letter) visible, con alerta.
3. **Datos mínimos en el mensaje:** ids, no objetos completos ni datos personales; el trabajo lee lo
   actual de la base.
4. **Tiempo máximo por trabajo** declarado; lo que lo supere se parte en pasos.
5. **Estado visible:** tabla `trabajos` o el panel del proveedor; el usuario ve "procesando" y luego
   el resultado, nunca una pantalla congelada.
6. **Secretos** del proveedor solo en el servidor; los endpoints que reciben trabajos verifican la
   firma del proveedor.

## Archivos que produce
`src/trabajos/<nombre>.ts` (un archivo por trabajo, con su clave de idempotencia), registro del
cron o de la cola según el proveedor, endpoint firmado que recibe los trabajos (si el proveedor los
entrega por HTTP), `docs/trabajos.md` con la lista de trabajos, frecuencia, reintentos y alertas.

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| TRA-01 | Ninguna petición del usuario espera un trabajo de más de unos segundos | revisión de rutas + test de tiempo |
| TRA-02 | Cada trabajo es idempotente por clave | test que lo ejecuta dos veces |
| TRA-03 | Reintentos con máximo y lista de fallidos con alerta | configuración + test de fallo forzado |
| TRA-04 | Endpoints que reciben trabajos verifican la firma del proveedor | test con firma falsa |
| TRA-05 | Los mensajes llevan ids, no datos personales | revisión del código del trabajo |
| TRA-06 | Cron documentado con zona horaria explícita | `docs/trabajos.md` |

## Pasos que agrega al plan
1. Infraestructura de trabajos del proveedor elegido y un trabajo de prueba.
   - CUANDO se encola el trabajo de prueba EL SISTEMA DEBE ejecutarlo y registrar `hecho` en menos de 1 minuto
   - CUANDO el trabajo falla tres veces EL SISTEMA DEBE moverlo a fallidos y emitir una alerta
2. Primer trabajo real (ej. correo de bienvenida) con idempotencia.
   - CUANDO el mismo evento llega dos veces EL SISTEMA DEBE enviar un solo correo
3. Cron necesarios con su zona horaria.
   - CUANDO llega la hora programada EL SISTEMA DEBE ejecutar el trabajo una vez
4. Estado visible al usuario para procesos largos (procesando / listo / error).

## Pruebas obligatorias
Doble ejecución sin efecto doble · fallo forzado llega a fallidos · firma falsa rechazada · cron
probado con reloj simulado.

## Lista de producción
Alertas de fallidos conectadas a `kit-observabilidad` · límites del plan del proveedor anotados con
fecha · costo a 1× y 10× · procedimiento para reprocesar fallidos.

## Trampas
- `setTimeout` o colas en memoria en serverless: desaparecen al terminar la función.
- Reintentar sin idempotencia: correos y cobros duplicados.
- Un solo trabajo gigante: pártelo en pasos para no perder todo a la mitad.
- Cron en UTC sin decirlo: el recordatorio "de las 8" llega a las 3.
