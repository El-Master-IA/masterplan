# Cambios

## 1.2.0 · 2026-10-24

- Categoría nueva **chatbots**: Pancake, Botcake, LucidBot, ManyChat, respond.io, Wati, Kommo, Chatwoot, Callbell, Treble, Leadsales y B2Chat. En mensajería: Zernio, 360dialog y Gupshup (API oficial de WhatsApp).
- Categoría nueva **ia-media**: Higgsfield, Magnific (antes Freepik), fal, Replicate, APIMart (marcado evitar en producción), Runway, Kling, Luma, Google Nano Banana/Imagen/Veo, OpenAI GPT Image, FLUX, Ideogram, Leonardo, ElevenLabs, HeyGen, Hedra y Synthesia.
- Catálogo: 152 fichas en 26 categorías.
- Recomendador: si nadie cubre todo solo, propone la pareja que sí (primero de la misma empresa); si la plataforma de chatbots ya conecta WhatsApp, no agrega otro proveedor.
- Kit nuevo `kit-ia-media`: generación en segundo plano, créditos con tope, resultados en almacenamiento propio, moderación y licencia comercial.

## 1.1.0 · 2026-10-24

Herramientas según la necesidad, no siempre Supabase + Vercel.

- Catálogo verificado de 120 proveedores en 24 categorías (`conocimiento/proveedores.json`) con especialidad, cuándo usar y evitar, plan gratis, uso comercial, presencia en LatAm, MCP, fuente y fecha.
- Recomendador determinista `masterplan.mjs proveedores recomendar`: de rasgos a una pieza por categoría con razones, alternativas y descartes; afinidad por proveedor, presupuesto, uso comercial, región y servicios descontinuados.
- Guía `conocimiento/proveedores.md` para pasar de lo que dice la persona a rasgos; la fase 3 elige proveedores antes que perfil.
- Perfiles nuevos: API Node en contenedor (Railway, Render, Fly.io) y todo en Cloudflare.
- Kits nuevos: `kit-media` (archivos, video, imágenes) y `kit-trabajos` (colas, cron, procesos largos).
- Kits de deploy, datos, auth y API ahora explican cada proveedor; kit de pagos corregido (Stripe no acepta empresas de Colombia, Chile, Perú ni Argentina; Lemon Squeezy en transición).
- El investigador también verifica precios y planes de los proveedores elegidos.

## 1.0.0 · 2026-10-24

Primera versión pública.

- Skill `masterplan` con 9 fases (contexto → operar), puertas verificables y relevos entre sesiones.
- 6 tipos de producto y 2 perfiles de stack (React + Vite + Supabase + Vercel; Next.js + Supabase + Vercel).
- 7 kits por capacidad (datos, auth, API, frontend, pagos LatAm, deploy, observabilidad) y el auditor.
- 10 agentes especializados y 7 comandos.
- Políticas de seguridad en hooks (bloqueos y avisos con excepción registrada; modo estricto).
- Mod de sesiones conectadas: registro, mensajes en vivo, buzón, panel y banda.
- CLI `scripts/masterplan.mjs` sin dependencias y conexiones MCP (Supabase, Vercel, Context7, Playwright).
