# Cambios

## 2.0.0 · 2026-11-11

Calidad de lo construido: mejores bases desde la primera ola, cambios pequeños sin ceremonia y tiempos medidos.

- **Bases técnicas** (`conocimiento/bases-tecnicas.md`): ocho bases que todo proyecto trae desde el principio (capas con una sola dirección, una sola puerta a los datos, configuración validada, contratos en el borde, un solo formato de error, tipos estrictos, pruebas y CI), cada una con cómo se comprueba. Cada perfil dice con qué herramienta se cumplen y `arquitectura.md` lo deja escrito por proyecto.
- **Esqueleto que corre.** La primera ola ya no construye funciones: deja el proyecto corriendo de punta a punta con las bases puestas, una pantalla real, login si aplica y vista previa. La tarea que lo cierra lleva `"hito": "esqueleto"`. Al planear, `validar` exige el esqueleto en la ola 1 o 2 y un gate con lint, typecheck, pruebas y build.
- **Carril rápido para editar** (`/masterplan:cambio`): el cambio se clasifica en pequeño, mediano o grande. El pequeño se construye, verifica y revisa en la misma sesión; solo el grande repite diseño, puertas y plan. Lo que toca datos, permisos, login o pagos es al menos mediano. `cambio nuevo --tamano=…`. También funciona durante la construcción (fases 6 y 7), no solo después de publicar.
- **Tiempos por fase.** `masterplan.mjs fase <n>` es la forma de cambiar de fase: anota cuánto tomó la anterior y dice si sigues en la misma sesión o cierras el tramo. `estado` muestra las duraciones.
- **Auditoría:** el auditor de bases revisa las ocho bases una por una. El verificador independiente es un solo despacho con todos los hallazgos críticos, en vez de uno por hallazgo.

Compatibilidad: los proyectos en curso no reciben exigencias nuevas (el esqueleto y el gate solo se validan al planear un proyecto nuevo). Las fases conservan su número. Es 2.0 por el cambio de forma de trabajar (tramos, kits en dos mitades, carril de cambios), no porque rompa proyectos existentes.

## 1.6.0 · 2026-11-11

Velocidad: menos sesiones, menos preguntas, menos lectura y menos revisiones en fila. Las puertas siguen todas.

- **Tramos en vez de un relevo por fase.** Las fases se agrupan en Definir (0, 1, 2), Diseñar y aprobar (3, 4, 5), Construir (6, una sesión por ola) y Publicar (7). Dentro de un tramo se sigue en la misma conversación; el relevo se escribe al cerrar el tramo o si el contexto pasa de la mitad. Antes eran siete relevos, ahora son cuatro.
- **Presupuesto de preguntas.** En todo el diseño (fases 3 y 4) se hacen como máximo 5 preguntas. Las preguntas de los kits ya no se hacen una por una: se toma el default del tipo de producto y se muestran en un bloque "Asumí esto" que corriges en una línea.
- **Kits en dos mitades.** Cada kit se partió en `SKILL.md` (decisiones y candados, para diseñar) y `construccion.md` (pasos, pruebas, lista de producción y trampas). La fase 3 lee 807 líneas de kits en lugar de 1.321 si el proyecto usa los diez.
- **Fase 3 en paralelo.** Primero `arquitectura.md`; después, en un solo mensaje, `arquitecto-datos` y `disenador`, mientras el conductor escribe `api.md` y las specs.
- **Fase 4 con agentes independientes y en paralelo.** Agente nuevo `masterplan:critico` (pre-mortem y checklists) despachado junto con `masterplan:revisor-plano`.
- **Revisor del plano sin repetir al script.** Ya no revisa lo que `validar` comprueba. Vueltas máximas: rigor bajo 1, medio 1, alto 2 (antes 1, 2 y 3). En la fase 5, una sola vuelta.
- **Fase 6 más corta.** El brief de cada tarea trae los candados, pruebas y trampas de su kit, así el constructor no abre el kit. Tras integrar la ola se corre el gate una vez en lugar de repetir los `verificar` de cada tarea. `revisor-codigo` y `auditor-seguridad` van en el mismo mensaje.
- **El paralelo se autoriza una vez por proyecto** (`masterplan.mjs ola --autorizar`, `proyecto.json.paralelo_autorizado`).
- **`masterplan.mjs reglas`**: fuente única de "siempre pregunta a la persona", vueltas y revisión por rigor, tramos y tope de preguntas. Los documentos la citan en vez de copiarla, y un test comprueba que no la contradigan.

Compatibilidad: los proyectos en curso siguen igual; las fases no cambian de número y los campos nuevos de `proyecto.json` son opcionales.

## 1.5.2 · 2026-11-11

Limpieza y correcciones: el plugin deja de contradecirse. Nada cambia en cómo se usa.

- **Agentes con su modelo y sus herramientas.** Cinco agentes (`auditor-seguridad`, `auditor-frontend`, `auditor-bases`, `revisor-codigo`, `desplegador`) y dos comandos (`auto`, `cambio`) tenían la cabecera mal formada: Claude Code les descartaba el modelo y las herramientas. Corregido.
- **Esquemas al día con lo que escribe el CLI:** `tareas.json` admite `actualizado`; `proyecto.json` admite `modo: rapido`, las capacidades `video`, `trabajos`, `chatbots` e `ia-media`, y fecha con hora.
- **`validar`** comprueba lo que los kits ya prometían: retención de datos personales en `datos.md` (DAT-12) y tabla de costo a 1× y 10× en `arquitectura.md` (OBS-08). Con código existente, tener menos de 5 Non-Goals ya no bloquea.
- **`ola`** describe la revisión distinta para rigor bajo, medio y alto, y el brief ya no crea un segundo worktree cuando la sesión arranca en uno.
- **Políticas:** cada excepción se anota una sola vez en `excepciones.log`. `deriva` deja de reportar `PATH` y `HOME` como variables sin documentar.
- **Una sola versión de cada regla:** la fase 7 despacha los tres auditores y da tres notas; los auditores devuelven hallazgos y el conductor los guarda; el tag lo pone el conductor; `/masterplan:cambio` usa `cambio nuevo`; `arquitecto-datos` actúa solo en la fase 3.
- **Pruebas de coherencia** (`tests/referencias.test.mjs`): todo agente, comando, kit, ruta y subcomando citado existe; lo que escribe el CLI cumple sus esquemas; las cabeceras no rompen el YAML. `npm test` funciona igual en Windows, macOS y Linux, y corre en GitHub Actions.
- La investigación que dio origen a Masterplan vive ahora en `docs/investigacion/`.

## 1.5.1 · 2026-10-26

Nombre nuevo de la organización: **El-Master-IA** (antes La-Boveda-del-Master).

- El marketplace pasa a llamarse `el-master-ia`: se instala con `/plugin marketplace add El-Master-IA/masterplan` y `/plugin install masterplan@el-master-ia`. Quien ya lo tenía debe agregar el marketplace nuevo y quitar el viejo (ver README).
- Autor, enlaces, `homepage` (`/lab/masterplan`), licencia y los `$id` de los esquemas JSON con la marca El Máster IA.

## 1.5.0 · 2026-10-25

Piloto automático: nadie tiene que escribir `/masterplan:seguir` en otro chat.

- **`/masterplan:auto`** (`proyecto.json.autonomia: "continua"`): al cerrar cada fase u ola, Masterplan lanza solo la sesión siguiente (herramienta de sesiones del cliente o `claude -p`) y sigue, con las olas de la fase 6 en paralelo, hasta llegar a la fase 7.
- **Se detiene siempre ante lo delicado o lo que solo la persona tiene:** publicar a producción, cobros, mensajes a terceros, borrar datos, cuentas y llaves, gasto nuevo, push forzado, tareas bloqueadas, pendientes anotados (`auto pendiente "…"`) y las preguntas de las fases 1 a 4. Tope de 30 sesiones encadenadas.
- CLI nuevo `masterplan.mjs auto [--json] [--registrar]` (CONTINUAR/PARAR con el motivo) y `auto activar|desactivar|pendiente|resuelto`. `relevo`, `seguir` y las fases 5 y 6 lo consultan al cerrar en lugar de pedir que abras un chat a mano.
- Sin autonomía continua todo sigue igual que en 1.4.

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
