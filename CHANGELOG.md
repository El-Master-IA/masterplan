# Cambios

## 1.4.0 · 2026-10-25

Construir más rápido sin perder las puertas. Medido en un proyecto real (53 tareas, herramienta interna): 2 h 31 de documentos antes de la primera línea, 22 tareas construidas sin una sola pantalla usable y ~25 min por tarea en serie.

- **Construcción en paralelo, una sesión por tarea.** Comando nuevo `/masterplan:ola` y CLI `masterplan.mjs ola [n] [--escribir|--json]`: calcula las tareas libres de la ola (sin dependencias pendientes ni archivos compartidos), respeta `paralelo_max` (5 por defecto) y escribe un brief autocontenido por tarea con su spec y su worktree/rama `mp-<id>`. El conductor lanza una sesión nueva por tarea (herramienta de sesiones del cliente, `claude --worktree`, subagentes con worktree o briefs manuales), no hace polling, integra en orden y sigue aunque una tarea quede bloqueada. `tarea <id> en-curso --sesion=<id>` guarda quién la tiene.
- **`rigor` por proyecto** (`bajo|medio|alto`, propuesto en la fase 1): vueltas del revisor-plano (1/2/3), revisión y auditoría de seguridad por ola o por tarea, y qué severidades bloquean. Solo BLOCKER/MAJOR obligan otra vuelta; lo demás va a `masterplan/backlog.md` (máx. una tarea de endurecimiento por ola). Los agentes revisor-código y auditor-seguridad marcan `ESPECULATIVO` lo inalcanzable para el tamaño del proyecto.
- **Plan en cortes verticales.** `validar` exige (en planes de 6+ tareas) una tarea con `hito: "visible"` en la primera mitad de las olas; `fase_producto: nucleo|ampliacion` permite mover ampliaciones a v1.1 y se prohíbe que el núcleo dependa de ellas; `hacer` de máximo 600 caracteres (aviso MINOR).
- **Entorno de pruebas decidido en la fase 3** (`proyecto.json.entorno`): base local en contenedor si hay Docker, para poder paralelizar sin bases de pago extra.
- **Menos papel.** `relevo` autocompleta estado de tareas, bloqueos, tags, evidencia y decisiones nuevas (una página); una sola evidencia por tarea; regla anti-rediseño en la fase 4.
- **`pgtap-resumen`**: lista los asertos que fallan de una salida TAP/pgTAP.
- Pruebas nuevas en `tests/v130.test.mjs` (ahora v1.4.0); `npm test` corre todas.

## 1.3.0 · 2026-10-24

Dos caminos: **Constructor** y **Auditor**.

- `/masterplan:auditar` (o "audita mi proyecto") funciona en cualquier proyecto ya construido, aunque se haya hecho con Lovable, Bolt, v0, Cursor o a mano: explorador → tres auditores en paralelo → informe con veredicto, riesgos en lenguaje de negocio y plan de arreglos en olas. Solo lee; no crea `proyecto.json`.
- Agente nuevo `auditor-bases`: arquitectura, migraciones e índices, manejo de errores, pruebas, CI, deploy, observabilidad, respaldos y stack desactualizado. Tercera nota, **Bases técnicas**, que nunca se promedia con las otras.
- Los auditores de seguridad y frontend trabajan sin los documentos de Masterplan: infieren la matriz de permisos desde el código y usan presupuestos de rendimiento por defecto.
- `auditoria fusionar` agrega "Qué arreglar primero", declara las notas no auditadas (nunca un 100 sin auditor) y funciona sin `proyecto.json`.
- Al terminar la auditoría ofrece arreglar la ola 1, convertir el proyecto en uno de Masterplan o dejarlo registrado.

## 1.2.1 · 2026-10-24

- Lenguaje natural primero: "sigamos con mi proyecto", "¿cómo vamos?", "quiero agregarle X" o "revisa la seguridad" funcionan igual que los comandos, y el plugin sugiere el siguiente paso como frase.
- La fase 0 usa `contexto/idea.md` (la idea en palabras de la persona, que guarda el prompt de instalación) y no la vuelve a preguntar.

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
