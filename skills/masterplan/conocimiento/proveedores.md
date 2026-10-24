# Elegir proveedores según lo que se construye

Supabase + Vercel es un buen punto de partida, no una regla. Cada proyecto se arma con las piezas
que su necesidad pide: un curso con video necesita un servicio de video; una API con procesos de
20 minutos no cabe en funciones serverless; un sitio de contenido barato puede vivir entero en el
borde. Esta guía traduce lo que la persona cuenta en **rasgos**, y el recomendador del CLI elige.

## Cómo se usa (fase 3, paso 1)
1. Con lo que ya sabes de las fases 1 y 2, marca los rasgos de la tabla de abajo. Pregunta solo lo
   que no puedas deducir, una pregunta a la vez y en lenguaje de negocio.
2. Guarda en `proyecto.json` → `necesidades`:
   ```json
   { "rasgos": ["ssr", "postgres", "auth-orgs", "video-vod", "correo-transaccional"],
     "presupuesto": "bajo", "comercial": true, "region": "latam",
     "preferir": [], "evitar": [] }
   ```
3. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" proveedores recomendar`.
   Devuelve por categoría una recomendación con sus razones, dos alternativas y lo descartado.
4. Antes de presentarlo, despacha `masterplan:investigador` con los proveedores elegidos para
   confirmar precio y plan gratis de hoy (el catálogo tiene fecha de verificación por ficha).
5. Presenta una tabla: pieza · recomendación · por qué · alternativa. Si la persona acepta, corre el
   mismo comando con `--guardar` y anota la decisión en `decisiones.log`.

Regla de pocas piezas: cada proveedor nuevo es una cuenta, una factura, un panel y un punto de
falla. El recomendador premia repetir proveedor; tú no agregues uno si otro ya elegido cubre la
necesidad razonablemente.

## De lo que dice la persona a rasgos

| Si la persona dice… | Rasgos |
|---|---|
| "una página para mostrar mi negocio", "landing" | `sitio-estatico` |
| "que salga en Google", contenido que cambia seguido | `ssr` |
| "un panel donde mis clientes entran" | `spa` o `ssr`, `auth-email` |
| "mis clientes son empresas", "equipos", "invitar compañeros" | `auth-orgs` |
| "las empresas grandes piden entrar con su Google/Microsoft corporativo" | `sso-empresa` |
| "procesar archivos grandes", "generar reportes que tardan", "scraping" | `proceso-largo`, `worker-cola` |
| "chat", "notificaciones al instante", "ver quién está conectado" | `websockets` o `pubsub`, `presencia` |
| "editar entre varios a la vez" (tipo Google Docs) | `colaboracion-multiusuario` |
| "subir documentos o fotos" | `subidas-directas`, `archivos-grandes` si pasan de 50 MB |
| "cursos", "videos", "contenido en video" | `video-vod` |
| "transmitir en vivo", "clases en vivo" | `video-en-vivo` |
| "que no descarguen ni compartan mis videos" | `drm` |
| "muchas fotos de productos", "miniaturas" | `transformacion-imagenes` |
| "mandar correos de confirmación" | `correo-transaccional` |
| "newsletter", "campañas" | `correo-masivo` |
| "avisar por WhatsApp", "bot de WhatsApp" | `whatsapp` |
| "tareas cada noche", "recordatorios programados" | `cron`, `programador` |
| "buscar productos", "buscador del catálogo" | `busqueda-texto`, `busqueda-tolerante-errores` |
| "que responda preguntas sobre mis documentos" | `ia-llm`, `busqueda-semantica`, `embeddings` |
| "usar varios modelos de IA" | `gateway-modelos` |
| "cobrar en Colombia/México/LatAm" | `pagos-latam` |
| "que paguen con PSE" (Colombia) | `pagos-latam`, `pse` |
| "vender a todo el mundo sin lidiar con impuestos" | `merchant-of-record` |
| "que alguien sin saber programar edite los textos" | `cms-headless`, `editor-visual` |
| "app en la tienda de iPhone/Android" | `builds-moviles`, `ota-updates` |
| "saber qué usan mis clientes" | `analitica-producto` |
| "enterarme cuando algo falla" | `errores`, `uptime` (siempre en producción) |
| "conectar con mis herramientas sin código" | `flujos-no-code` |
| "probar dos versiones de una página" | `experimentos`, `feature-flags` |

Modificadores (afinan, no piden una pieza): `presupuesto-cero`, `presupuesto-bajo`,
`uso-comercial-gratis`, `region-latam`, `enterprise-cumplimiento`, `self-host`, `escala-a-cero`,
`backups-automaticos`, `multi-region`, `mcp-oficial`.

## Combinaciones que suelen ganar (punto de partida, el recomendador decide)

| Proyecto | Combinación típica | Por qué |
|---|---|---|
| SaaS B2B clásico | React/Next + Supabase (DB, auth, storage) + Vercel o Cloudflare | Una base con reglas de acceso y login en el mismo lugar |
| Plataforma de cursos o contenido | Lo anterior + Bunny Stream o Mux para video + Resend | El video no va en el storage de la base: necesita transcodificación y CDN |
| API con procesos largos o workers | Railway o Render (contenedor siempre encendido) + Postgres gestionado + cola | Sin límites de tiempo por petición |
| Sitio de contenido barato y global | Cloudflare Pages/Workers + D1 + R2 | Todo en el borde, salida de archivos gratis |
| App móvil | Expo (EAS) + Supabase o API propia | Builds y actualizaciones sin pelear con Xcode |
| Bot o automatización | n8n o un worker en Railway + cola con reintentos | Se despierta solo y aguanta reintentos de terceros |
| Producto con IA | API de Claude u otros vía gateway + pgvector + trabajos en segundo plano | Respuestas largas fuera de la petición del usuario |

## Lo que nunca cambia aunque cambie el proveedor
- Secretos solo en variables de entorno del servidor.
- Aislamiento entre clientes probado con un test (RLS en Postgres, o la regla equivalente en el
  servidor si la base no tiene RLS).
- Backups con restauración probada y costo a 1× y 10× en `arquitectura.md`.
- Términos de uso comercial revisados: un plan gratis que prohíbe cobrar no sirve para un cliente.
