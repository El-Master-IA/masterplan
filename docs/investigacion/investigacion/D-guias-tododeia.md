# D · Guías de la comunidad tododeia (búsqueda "web")

Fecha: 2026-10-23 · Fuente: https://www.tododeia.com/community/<slug> (HTML servido por el servidor, descargado con curl y extraído a texto; las 73 guías listadas se leyeron completas o por secciones). Texto crudo en `C:/tmp/arq-research/txt/` y HTML en `C:/tmp/arq-research/raw/`.

> Nota: la página de búsqueda `?q=web` se pinta en el cliente (JS), así que no pude listar las 76 entradas desde ella. Se analizaron los 73 slugs que se pasaron; las 3 entradas restantes son probablemente fichas de repos (sección "repos" de la bóveda), no guías.
> Todo lo de abajo es resumen y lectura propia; no se copian bloques de las guías.

---

## 1. Resumen ejecutivo

1. **El ecosistema de Hainrixz (Enrique Rocha) es una cadena de herramientas pequeñas, open source (MIT) y en español, cada una con una sola tarea**: The Architect (plano) → Claude WebKit / Agent Webkit (construcción de webs) → Cyber Neo (auditoría de seguridad) → All Deploy (publicación) → Claude SEO AI (SEO + visibilidad en IA). Alrededor hay kits verticales: PagoKit (pagos LatAm), WhatsApp AgentKit / Closer AgentKit (bots), Humanízalo (texto), Claude Ads, Auto-CRM.
2. **La pieza central es The Architect v2.6**, y es la más valiosa para el producto de Alexander: entrevista → clasificación en 14 "shapes" → 2 gates bloqueantes (sin decisiones a medias + pre-mortem) → plano de 20 secciones donde cada paso es un contrato **Do / Done when (EARS) / Verify (comando que sale 0) / Checkpoint (tag git + punto de retorno)** → validador adversarial (31 barridos, 40 modos de falla, 0 BLOCKER/0 MAJOR) → bundle con `tasks.json` + carpeta `workspace/` (CLAUDE.md, AGENTS.md, .claude/skills, rules) que se copia al proyecto → otra sesión, sin contexto, construye. Las "18 reglas A–R" salieron de 7 ciclos de construcción real con un "constructor literal".
3. **La pedagogía es el verdadero producto**: fichas estándar (nivel, qué necesitas, qué NO necesitas, cuánto toma, qué te llevas, fecha de verificación), analogías caseras ("el plano antes del martillo", "niñero vs gerente"), prompts copiables en cada paso, sección de "letra chica / cuándo NO usarlo", y un rescate "si algo se atora". Todo verificado con fecha y versión de Claude Code.
4. **Huecos que un producto propio puede llenar**: (a) el backend queda en manos del plano + Claude genérico (no hay un "backend kit" con RLS, migraciones, colas, observabilidad como plantillas probadas); (b) el stack web por defecto es Next.js + Vercel y casi nada cubre Supabase a fondo (RLS, Edge Functions, multi-tenant); (c) no hay un orquestador único que lleve estado entre herramientas (cada una deja reportes sueltos en el Escritorio); (d) pruebas E2E y CI aparecen solo como recomendación; (e) mantenimiento post-lanzamiento (migraciones, upgrades, incidentes) casi no existe; (f) mezcla de voseo/tuteo y dependencia del email-gate.

---

## 2. El modelo tododeia

### 2.1 Cómo encadena herramientas
| Momento | Herramienta | Entrada | Salida verificable |
|---|---|---|---|
| Idea → plano | The Architect (`/architect`, `/architect-quick`, `/architect-brownfield`) | descripción en lenguaje natural, repo existente | `./blueprints/<slug>/` (blueprint.md, tasks.json, epics/, workspace/) |
| Plano → código | sesión nueva de Claude Code + `/architect-next`; o Claude WebKit para webs | bundle | commits con tag por paso |
| Diseño | WebKit (21 skills: frontend-design, ui-ux-pro-max, shadcn, humanizer, emil-kowalski x8, seo-audit, playwright, vercel-deploy) + DESIGN.md (Refero/awesome-design-md) | carpeta `contexto/` con docs y capturas | `site/` Next.js 16 + Tailwind 4 + shadcn |
| Seguridad | Cyber Neo (`/cyber-neo .`, 5 subagentes, 11 dominios) + plugin oficial security-guidance (3 capas por hooks) | repo | reporte Markdown por gravedad; reauditar hasta 0 Critical/High |
| Publicar | All Deploy (`/all-deploy`, `/all-deploy auto`) | repo auditado | preview → producción con rollback; prechequeos (index.html, mayúsculas, rutas file://, .env) |
| Visibilidad | Claude SEO AI (2 notas separadas Google vs IA, severity gating) + Is Agentic (Vercel Labs) | URL | arreglos con permiso; llms.txt, JSON-LD, 404 real, robots |
| Monetizar | PagoKit (Stripe / Mercado Pago / Wompi / Lemon Squeezy) | proyecto + 3 preguntas de negocio | ~14 archivos, 5 candados (sin llaves hardcodeadas, .env ignorado, firma de webhook, idempotencia por UUID, raw body) |
| Operar | /loop, /goal, /schedule, loop.md | meta medible | bitácora + reporte |

Patrón repetido: **escanear antes de tocar → preguntar poco y en lenguaje de negocio → generar → verificar con algo que devuelva pasa/no pasa → reporte por gravedad → arreglar uno a uno → volver a medir**.

### 2.2 Pedagogía
- **Formato fijo de guía**: hero con promesa concreta, "de un vistazo" (3–13 tarjetas numeradas), ficha técnica, secciones numeradas, prompts en cajas "Copiar", cierre con "letra chica", "cuándo NO usar", "si algo se atora". Muro de email ("Desbloquea la guía completa") que se abre una sola vez y alimenta newsletter.
- **Niveles explícitos**: Principiante / Intermedio, y "app primero, terminal después". Guías de entrada (instalar, anatomía, 0-a-100, terminal vs app) enlazadas desde las avanzadas.
- **Analogías domésticas** (casa/plano/albañil, camión de mudanza, receta de la abuela, carro automático vs estándar) seguidas de la versión técnica.
- **Honestidad como marca**: separa lo oficial de lo reportado, fecha de verificación y versión de Claude Code, dice qué cobra cada servicio y qué no funciona hoy (roadmap de PagoKit, canales rotos de Agent Reach).
- **Prompts que preguntan antes de actuar** ("te hace dos preguntas y recomienda una sola"), prompts de "compara el reporte nuevo con el anterior", prompts para convertir lo repetido en skill.

### 2.3 Por qué engancha a principiantes hispanohablantes
Español neutro-mexicano (con guías antiguas en voseo), cero llaves de API cuando se puede, "sin programar", resultados tangibles el mismo día (URL en vivo), herramientas gratis y con nombre propio, proveedores LatAm (Mercado Pago, Wompi, OXXO, PSE, Nequi), contexto de negocio (agencia, cotizaciones, negocio local), y un autor visible que publica rápido sobre lo último (Opus/Sonnet 5.5, /loop, Ultra Plan).

---

## 3. Análisis profundo — prioridad ALTA

### the-architect (plugin v2.6) — el núcleo
- **Estructura**: 11 paradas (qué es, historia de ciclos, instalar terminal/app, actualizar, 6 comandos, entrevista, plano, construir, mantener, tropiezos) + 15 prompts.
- **Flujo**: 4 fases (Descubrimiento → Profundización → Arquitectura → Generar). Primera pregunta: ¿hay código o partes de cero? (greenfield/brownfield). Clasifica en 14 shapes (SaaS, sitio de contenido, móvil, API, panel interno, comunidad, app de agente, media generativa, e-commerce, CLI/MCP, extensión, desktop, bot/integración, pipeline de datos); si duda, nombra 2 candidatos y hace la única pregunta que los separa. Elige "runtime track" + "capabilities" (cobrar, correo, archivos, tiempo real).
- **Gates**: A = cero `[NEEDS CLARIFICATION]` (se responde, se acepta un default dicho en voz alta, o se vuelve Non-Goal); B = pre-mortem de 8 ángulos que deja 3–7 hallazgos → registro de riesgos, Non-Goal o rediseño.
- **Subagentes**: stack-researcher (verifica versiones en registros oficiales), blueprint-writer (único autor, contexto aislado), blueprint-validator (Opus, sin leer el CLAUDE.md del usuario para no ablandarse).
- **Plano de 20 secciones**: Non-Goals, stack fijado, directorios, datos (incl. qué pasa al borrar), API, frontend, sistema de diseño, auth/permisos, ORDEN DE CONSTRUCCIÓN, entorno, dependencias, despliegue+rollback, pruebas, secretos, accesibilidad medible, observabilidad y costo, ruteo de modelos, skills de construcción (con comando de instalación), workspace del agente (CLAUDE.md = 19.1), gate/riesgos/decisiones.
- **Contrato por paso**: Do / Done when en EARS ("CUANDO… EL SISTEMA DEBE…") / Verify que sale 0 / Checkpoint con tag. Prohibido "se ve bien", "funciona", "quedó conectado". Tope: ≤6 criterios y ≤5 archivos por paso.
- **Formato por conteo**: ≥12 pasos → bundle (25–35 min en silencio); ≤11 → archivo único.
- **Workspace sin slash commands**: los flujos repetibles salen como skills porque un constructor autónomo no teclea comandos.
- **18 reglas A–R** (lección de 7 ciclos): config que carga lo que los checks importan; quién carga env vars; no afirmar números no contados; el bootstrap crea lo que los checkpoints necesitan (git init); nada "commiteado" en .gitignore; una convención de imports reconciliada en todo; verify sale 0 cuando está bien; checks posibles en su medio; copia de workspace idempotente; secciones "NO APLICA" sin contratos de los que dependa otro paso; valores repetidos en dos artefactos = una sola fuente; fail-fast (correr el ejecutable, no solo compilar); el bundle no rompe el tooling del proyecto; guards portables; un check no puede exigir lo que produce su propio checkpoint; salidas esperadas reconciliadas contra el runtime; gates que fallan por la razón correcta (código de salida exacto, compatible con `set -e`); .gitignore antes del primer commit.
- **Mantener**: `/architect-audit` (solo lectura, PASS/FAIL con líneas), `/architect-refresh [--apply]` (desoxidar versiones), `/architect-next` (siguiente tarea con dependencias resueltas desde tasks.json).
- **Huecos**: no construye ni despliega; 25–35 min sin feedback; validador comprueba consistencia interna, no si es lo que querías; acoplado al ecosistema de skills de terceros.
- **Adoptar**: contrato de 4 campos + EARS, gates bloqueantes, validador independiente, shapes, Non-Goals obligatorios, workspace copiado, reglas tipo A–R como linter del plan, "constructor literal" como prueba de calidad del propio producto.

### crea-y-audita-tu-app
Combo Arquitecto (versión antigua de 16 secciones) + Cyber Neo. Flujo en 5 pasos: diseñar → construir → auditar → arreglar Critical/High uno a uno explicando cada cambio → reauditar y comparar reportes. **Adoptar**: el ciclo de diff entre reportes y "seguridad en el plano, no como parche". **Hueco**: reportes al Escritorio, sin estado compartido.

### trifecta-perfecta
Architect → Cyber Neo → All Deploy, con analogía arquitecto/cerrajero/camión de mudanza. All Deploy detecta stack, elige hosting, preview → producción, rollback automático; modo auto con ventana ESC. Incluye "cuándo NO usar" (ya tienes specs, script desechable, CI/CD propio, no usas Claude Code). **Adoptar**: la secuencia como producto y la sección anti-uso.

### tu-propio-arnes
Concepto "agente = modelo + arnés", bucle mínimo en Python con LiteLLM (agnóstico de proveedor), Agent SDK como vía rápida, prompt para que Claude construya el arnés. **Adoptar** para un shape "Agent App": plantilla de bucle con condición de parada y capa agnóstica. Tono anti-dependencia de una sola suscripción.

### platica-luego-construye
Workflow de 3 prácticas: app antes que terminal; carpeta "platica" con modelo barato para pelotear + Arquitecto; exportar plan y construir en carpeta limpia con modelo fuerte. **Adoptar**: separación explícita "conversación de diseño" vs "sesión de construcción" y ruteo de modelos por fase (barato para explorar, fuerte para construir).

### habilidades-no-subagentes
Basada en la postura de Anthropic ("Skills, not subagents"): un agente único con carpeta (CLAUDE.md quién es, skills qué hace, examples.md cómo se ve bien hecho, un chequeo pasa/no pasa, MCP como manos, hooks como candado). Solo partir en subagentes en 3 casos: contexto contaminado (>1k tokens irrelevantes), tareas realmente independientes (gana minuciosidad, no velocidad), demasiadas herramientas (~20+). Seis prompts en orden. **Adoptar**: arquitectura del producto = un agente + skills + checks, subagentes solo para investigación de versiones/auditoría; "convierte en skill lo que repetiste 3 veces".

### de-la-idea-a-la-tienda
8 pasos para app móvil sin programar: dictado y foto del boceto → documento con huecos marcados → recorte a MVP (3 versiones de la idea) → The Architect → patrones de Mobbin (MCP) → piezas de 21st.dev → una función a la vez con `/architect-next` → prueba repetida convertida en skill → checklist de rechazo de App Store con número de guía. **Adoptar**: fase de "recorte" previa al plano, patrones de pantallas reales, checklist de publicación por tienda.

### sitio-web-10k-claude
Combo Arquitecto + Agent Webkit para negocio local/portafolio: plano → propuesta de diseño aprobada → construcción por secciones → vista local → Vercel sin cuenta. 4 prompts (A arrancar, B refinar, C construir, D publicar). Promesa económica fuerte ("antes de pagarle a una agencia"). **Adoptar**: el gancho de valor y entregable = URL en vivo.

### claude-web-builder (Hainrixz/claude-webkit)
Repo con 21 skills y 6 fases (descubrimiento 4 rondas → sistema de diseño → scaffold Next.js 16/Tailwind 4/shadcn → construir + humanizar textos → revisar en 375/768/1024/1440 + animaciones + SEO → publicar si dices que sí). Lee primero una carpeta de contexto (docs + capturas) y solo pregunta lo que falta; 4 puntos de decisión humana. Instalación por un prompt ("instala todo lo necesario"). Funciona con cualquier modelo. **Adoptar**: "contexto primero, cuestionario después", checkpoints humanos fijos, revisión visual multi-breakpoint antes de mostrar. **Hueco**: solo frontend/landing; nada de backend.

### loops-claude-code
/loop en 3 modos (intervalo, auto-ritmo, loop.md de mantenimiento), "de niñero a gerente", meta medible con número o lista + tope de vueltas, bitácora, cuándo te busca, costo por vuelta, límites (local, 7 días, 50 tareas), /loop vs /schedule, /goal. **Adoptar**: cada fase del producto con meta medible y tope; loop.md de mantenimiento post-lanzamiento.

### ultra-plan
/ultraplan: planificación en la nube, revisión del plan en navegador con comentarios por sección, ejecutar en la nube (PR) o devolver a la terminal. Requisitos: CC ≥2.1.91, GitHub, preview. **Adoptar**: revisión de plan comentable antes de gastar tokens en construir.

### stop-ai-slop
10 repos en 3 artes: diseño (UI/UX Pro Max, Impeccable con 61 reglas, Taste, awesome-design-md, design.md de Google), escritura (humanizer, stop-slop), explicar (frontend-slides, diagram-design, Understand-Anything). Regla clave: **una skill por trabajo, nunca encimar** (se contradicen). Tabla "qué vas a hacer → cuál instalas". **Adoptar**: selector de skills por tarea en vez de instalar todo; lista de anti-patrones visuales y de texto.

### kit-diseno-claude
5 skills con `npx skills add`: frontend-design (Anthropic), UI UX Pro Max, Emil Kowalski, Huashu Design, auditor de Vercel (web-design-guidelines). Flujo diseña → anima → audita y "pásale referencias". **Adoptar**: bloque de diseño en 3 tiempos (generar, animar, auditar).

### 11-sitios-diseno-ia
11 sitios en 4 momentos: mirar (Minimal Gallery, Design Bookmark, Refero), entender patrón (Component Gallery, CTA Gallery), copiar componente (21st.dev, Aceternity, Magic UI, Motion Primitives, Uiverse), poner asset (3dicons). Carpeta `contexto/diseno/` con DESIGN.md + capturas + `componentes.md` (una línea por sección con el link del componente). **Adoptar**: `componentes.md` como contrato sección→componente; mapa de en qué fase entra cada referencia.

### refero-design-md
DESIGN.md de 9 partes (tono, colores con función, tipografía, espaciado, componentes, densidad, movimiento, accesibilidad, **lista de "no usar"**) → envolverlo en SKILL.md para que persista → construir con UI/UX Pro Max prohibiendo otra paleta → publicar con WebKit. **Adoptar**: DESIGN.md como artefacto obligatorio del plano (sección 7) y como skill del workspace.

### awesome-design-md
Repo VoltAgent con ~55 DESIGN.md de marcas famosas + preview.html; copiar a la raíz y pedir "con este sistema". **Adoptar** como fuente de semillas de estilo (cuidando no clonar marcas ajenas).

### emil-kowalski-skills
14 skills MIT (incl. apple-design de WWDC) instaladas desde la pestaña Code; flujo revisión → arreglar uno → "juez"; prompts por micro-interacción, reduce-motion, "tres versiones para escoger". **Adoptar**: pasada de calidad de interacción como gate de frontend.

### claude-animador-web
Versión anterior: frontend-design + UI UX Pro Max + animación + GitHub/Vercel. Redundante con la anterior. Media.

### is-agentic
Escáner de Vercel Labs (nota 0–100 en 3 "bolsas") que mide si un agente puede leer tu sitio (no ejecuta JS, no hace login, no adivina rutas). 7 arreglos sin código (llms.txt con encabezado "When to use" en inglés, JSON-LD Organization, páginas de confianza, sitemap con lastmod, metadatos, 404 real, no bloquear bots) + 1 de config. CLI, API, MCP y skill. Caso medido 73→100. **Adoptar**: checklist "agent-readable" como gate de publicación (SSR, 404 reales, sitemap).

### claude-seo-ai (Hainrixz)
Plugin offline, dos notas separadas (Google vs IA) con letra A–F y severity gating; distingue bots de entrenamiento vs de citación; llms.txt puntuado 0 por impacto incierto; `fix` con 3 niveles y nada se escribe sin permiso. **Adoptar**: notas separadas por eje, gating por severidad, honestidad sobre tácticas no probadas.

### agente-pagokit (Hainrixz)
Escanea el proyecto, 3 preguntas de negocio (país de clientes, único vs recurrente, efectivo), elige proveedor (Stripe, Mercado Pago, Wompi, Lemon Squeezy), escribe ~14 archivos (frontend, API, schema, docs `PAGOKIT_INTEGRATION.md`, `PAGOKIT_PRODUCTION_CHECKLIST.md`) con 5 candados deterministas. Roadmap honesto por framework (Next/Prisma/Drizzle hoy; NestJS, FastAPI, Django, Laravel después). **Adoptar** tal cual como patrón de "capability kit": preguntas de negocio → proveedor → archivos + candados + checklist de producción. Muy relevante para LatAm/Colombia.

### plugin-seguridad-claude
security-guidance oficial de Anthropic: capa 1 hook por edición con reglas fijas (gratis), capa 2 revisión de otro Claude al terminar el turno, capa 3 revisión profunda en commit/push (tope 20/h); reglas propias del proyecto. **Adoptar**: defensa en capas por hooks dentro del workspace generado.

### stack-app-movil-ia
Ruta única Rork + Claude + Supabase + Stripe + tiendas/Vercel, costos por escenario (US$0–20, 45–120, 200+ primer año), checklist de lanzamiento. **Adoptar**: tabla de costos fijos/variables por escenario dentro del plano (sección 16).

### comienza-a-construir
Stack gratis (Claude Code, Vercel, GitHub, Supabase, Cloudflare, Clerk, Stripe, Gemini) + modelo "demo gratis → cliente paga → escalas". Flujo de 9 pasos de cliente a cobro. **Adoptar**: narrativa de negocio para freelancers; landing como primer servicio.

### sube-tu-pagina-gratis
Elegir hosting por términos de servicio (¿alguien cobró por hacerla? Vercel Hobby lo prohíbe; GitHub Pages sin tienda/SaaS; Cloudflare Pages para clientes; Netlify apaga por créditos), costo real del dominio, All Deploy y sus 3 roturas típicas (index.html, mayúsculas, rutas locales) + .env colado. **Adoptar**: ruteo de hosting por licencia/uso comercial; prechequeos de deploy.

### whatsapp-agentkit (Hainrixz)
Repo "casi sin código": 19 archivos, un documento que le dice a Claude Code qué construir; `/build-agent` con entrevista de 10 preguntas; Zernio vs Meta; prueba local, Docker opcional, 13 prompts. **Adoptar**: patrón **"repo-blueprint"** (el repo trae instrucciones y Claude genera el código contra tu SO y versiones). Ver también whatsapp-closer-agentkit (12 preguntas, contrato de 6 pasos con permisos, simulador sin llaves, 23 verificaciones que bloquean publicación).

### claude-disenador-web
frontend-design + MCP Magic UI + MCP shadcn + Playwright CLI ("el espejo"). **Adoptar**: el bucle generar → abrir en navegador → autocorregir.

### disenador-web-definitivo
UI/UX Pro Max + NanoBanana (Gemini) + Google Stitch MCP + 21st Magic; mockup primero, luego código. Requiere llaves (Google Cloud, 21st). Media: mucha fricción de setup.

### replica-disenos-web
UI UX Pro Max + prompt de replicación por URL (layout, tipografía, animación, paleta) + NanoBanana para imágenes. Media; riesgo de copia de marca.

### clonador-de-paginas
Template JCodesMore con `claude --chrome` y `/clone-website <url>`: 5 fases (reconocimiento, fundamentos/tokens, spec de componentes, construcción, QA). **Adoptar**: la fase "spec de componentes" como paso intermedio; aviso de no copiar contenido con derechos.

### top-10-claude-abril-2026 / cinco-herramientas-claude
Listas curadas: AgentKit, Superpowers (spec-first, subagentes, TDD), Claude Code Ultimate Guide, Antigravity Skills, Everything Claude Code, LightRAG, n8n-MCP, UI UX Pro Max, claude-mem, WebKit, Karpathy Skills, Hermes Agent, Generic Agent, Evolver; con "cuándo NO usar" y aclaración de las 3 capas n8n+Claude. **Adoptar**: Superpowers como referencia de disciplina (spec-first + TDD); formato "cuándo NO usar".

### 5-skills-diseno-claude
Skills oficiales de Anthropic: frontend-design, canvas-design, web-artifacts-builder, theme-factory, algorithmic-art. Media: útil como base gratuita del kit.

### opus-55-prompting / sonnet-55-prompting
Traducción de las docs de prompting por síntoma y dónde pegar (CLAUDE.md, proyecto, preferencias, Cowork). Claves: el esfuerzo es la palanca, no "piensa con cuidado"; instrucción contra las "4 paradas" en tareas largas + lista de pendientes en archivo; "explora antes de actuar"; "solo lo que pedí"; párrafo oficial de **"prueba real antes de decir listo"**; en diseño, **nombrar los patrones prohibidos** y pedir la lista de "lo que elegiste por inercia" para ampliarla por vueltas. **Adoptar**: estos párrafos dentro del CLAUDE.md que genere el producto.

---

## 4. Tabla de las 73 entradas analizadas

| # | slug | tipo | relevancia | idea clave |
|---|---|---|---|---|
| 1 | the-architect | plugin propio (MIT) | Alta | Plano de 20 secciones con contrato Do/Done when/Verify/Checkpoint, 2 gates, validador adversarial, 14 shapes, 6 comandos |
| 2 | crea-y-audita-tu-app | combo/flujo | Alta | Diseñar → construir → auditar (Cyber Neo) → arreglar Critical/High → reauditar y comparar |
| 3 | trifecta-perfecta | combo/flujo | Alta | Architect + Cyber Neo + All Deploy en orden; incluye "cuándo NO usar" |
| 4 | tu-propio-arnes | concepto + código | Alta | Agente = modelo + arnés; bucle mínimo agnóstico con LiteLLM |
| 5 | platica-luego-construye | workflow | Alta | Carpeta de plática con modelo barato, construir en carpeta limpia con el plano |
| 6 | habilidades-no-subagentes | arquitectura de agentes | Alta | Un agente + skills + ejemplos + check; subagentes solo en 3 casos |
| 7 | de-la-idea-a-la-tienda | flujo app móvil | Alta | 8 pasos: dictado, recorte MVP, Architect, Mobbin, 21st.dev, checklist App Store |
| 8 | sitio-web-10k-claude | combo web | Alta | Architect + Agent Webkit → URL en vivo sin agencia |
| 9 | claude-web-builder | repo propio (WebKit) | Alta | 21 skills, 6 fases, lee contexto antes de preguntar, 4 decisiones humanas |
| 10 | loops-claude-code | guía comando | Alta | /loop con meta medible + tope; loop gerente con bitácora; loop.md |
| 11 | ultra-plan | guía comando | Media | Plan en la nube, revisión comentable, ejecutar como PR o local |
| 12 | stop-ai-slop | curaduría | Alta | 10 repos anti-slop; una skill por trabajo, nunca encimar |
| 13 | kit-diseno-claude | curaduría skills | Alta | Generar, animar, auditar con 5 skills vía npx skills add |
| 14 | 11-sitios-diseno-ia | curaduría recursos | Media | Referencias por momento; carpeta contexto/diseno + componentes.md |
| 15 | refero-design-md | cadena | Alta | DESIGN.md de 9 partes con lista "no usar", envuelto como skill |
| 16 | awesome-design-md | repo terceros | Media | 55 DESIGN.md de marcas conocidas listos para copiar |
| 17 | emil-kowalski-skills | skills terceros | Media | 14 skills de movimiento/interacción, revisión estilo Apple |
| 18 | claude-animador-web | guía (antigua) | Baja | 3 skills de diseño + animación + deploy; superada por la anterior |
| 19 | is-agentic | herramienta Vercel Labs | Alta | Escáner de legibilidad para agentes; 7 arreglos sin código |
| 20 | claude-seo-ai | plugin propio | Alta | Dos notas separadas Google/IA, severity gating, arreglos con permiso |
| 21 | agente-pagokit | plugin propio | Alta | Pagos LatAm/global: 3 preguntas, ~14 archivos, 5 candados |
| 22 | plugin-seguridad-claude | plugin oficial | Alta | security-guidance: 3 capas por hooks (edición, fin de turno, commit) |
| 23 | stack-app-movil-ia | stack recomendado | Media | Rork + Claude + Supabase + Stripe; costos por escenario |
| 24 | comienza-a-construir | stack gratis | Media | Demo gratis → cliente paga → escalas; stack free tier |
| 25 | sube-tu-pagina-gratis | deploy | Alta | Hosting según términos de uso; prechequeos de All Deploy |
| 26 | whatsapp-agentkit | kit propio | Media | Repo-blueprint: entrevista /build-agent y Claude genera el bot |
| 27 | claude-disenador-web | combo MCP | Media | frontend-design + Magic UI + shadcn MCP + Playwright como "espejo" |
| 28 | disenador-web-definitivo | combo MCP | Media | UI/UX Pro Max + NanoBanana + Stitch + 21st Magic |
| 29 | replica-disenos-web | prompt + skill | Baja | Replicar layout/tipografía/paleta de una URL |
| 30 | clonador-de-paginas | template terceros | Media | /clone-website con 5 fases incl. spec de componentes |
| 31 | top-10-claude-abril-2026 | curaduría | Media | 14 proyectos del mes (Superpowers, ECC, claude-mem…) |
| 32 | cinco-herramientas-claude | curaduría | Media | Superpowers, ECC, UI UX Pro Max, claude-mem, n8n-MCP + "cuándo no" |
| 33 | 5-skills-diseno-claude | skills oficiales | Baja | frontend-design, canvas, artifacts, theme-factory, algorithmic-art |
| 34 | opus-55-prompting | prompting | Alta | Esfuerzo como palanca, anti-paradas, nombrar patrones prohibidos |
| 35 | sonnet-55-prompting | prompting | Alta | "Solo lo pedido", prueba real antes de decir listo |
| 36 | 3-servicios-agencia-ia | negocio | Media | Menú de agencia: marketing, leads, ecosistema; diagnóstico gratis primero |
| 37 | cuatro-repos-nuevos | curaduría | Baja | Colibri, OpenWorker, QM, AnyDoc (documentos/Excel) |
| 38 | credito-nube-claude-code | promo | Baja | Crédito único de Claude Code en la nube; no aporta |
| 39 | claude-en-excel | productividad | Baja | Cinco formas de meter Claude en Excel |
| 40 | cinco-departamentos-negocio | skills negocio | Baja | Paquetes de skills por área (marketing, redes, finanzas, legal) |
| 41 | 5-skills-que-cambian-todo | curaduría | Baja | Skill Creator, Humanízalo, Marketing, UI UX Pro Max, Superpowers |
| 42 | meta-ai-redes-sociales | marketing | Baja | Auditar cuentas públicas con Meta AI + tus Insights |
| 43 | agent-reach | herramienta | Baja | 15 canales de lectura web/redes sin APIs pagas; útil para research |
| 44 | seo-search-console | SEO contenido | Media | Huecos de contenido desde la exportación de Search Console |
| 45 | whatsapp-closer-agentkit | kit propio | Media | Bot vendedor: 12 preguntas, permisos por paso, 23 checks que bloquean |
| 46 | claude-design | producto Anthropic | Baja | Manual de Claude Design (claude.ai/design) |
| 47 | claude-movil-principiantes | onboarding | Baja | Primer día con la app móvil; patrón de onboarding con fotos |
| 48 | 5-claude-skills-necesarias | skills | Media | find-skills (meta-skill), mcp-builder, navegar, auditar, diseñar |
| 49 | kit-extraccion-claude | scraping | Baja | Apify, Scrapingdog… para prospectos |
| 50 | control-remoto-claude-code | uso | Baja | Seguir la sesión desde el teléfono |
| 51 | claude-skill | skill propia | Baja | "Claude sin E": ¿esto lo puede hacer Claude y en qué app? |
| 52 | terminal-o-app-claude-code | onboarding | Media | Diferencias reales terminal vs app; app primero |
| 53 | scrapegraphai | scraping | Baja | Patrón bajar-limpiar-extraer con LLM, nativo o local |
| 54 | anthropic-github | recursos | Baja | Mapa de repos oficiales de Anthropic |
| 55 | guia-claude-code-completa | onboarding | Media | 0-a-100: app primero, terminal después |
| 56 | anatomia-claude | conceptos | Media | 5 piezas (proyecto, skill, etc.) + una regla cardinal |
| 57 | openwa-whatsapp | gateway no oficial | Baja | WhatsApp no oficial con riesgo de baneo |
| 58 | browser-harness | herramienta | Baja | Navegación que se guarda como skill por sitio |
| 59 | gpt-realtime-2 | modelo OpenAI | Baja | App de voz armada por Claude Code con 4 prompts |
| 60 | 40-skills-claude | catálogo SKILL.md | Media | 40 skills en español copiables; formato de skill accesible |
| 61 | claude-microsoft-365 | productividad | Baja | Add-ins de Office vs conectores |
| 62 | awesome-gpt-image-2 | prompts imagen | Baja | 4,430 prompts de imagen personalizados con Claude |
| 63 | agent-browser | herramienta Vercel | Media | Navegador con refs numeradas, ~10x menos tokens; útil para QA/referencias |
| 64 | open-design | alternativa abierta | Baja | Reemplazo local de Claude Design con 71 estilos |
| 65 | hyperframes-claude-design | video | Baja | HTML/GSAP → MP4 con Hyperframes |
| 66 | claude-code-web | uso | Baja | Claude Code en web/celular y `--teleport` |
| 67 | animaciones | repo propio | Baja | Bootstrap idempotente de Remotion; patrón "un comando instala lo faltante" |
| 68 | restaura-tus-fotos | imagen | Baja | NanoBanana para restaurar fotos |
| 69 | 4-superpoderes-claude | herramientas | Baja | Supadata, Apify, Last30Days, navegador |
| 70 | stitch-diseno-ia | MCP Google | Baja | Stitch MCP para diseñar UI desde texto |
| 71 | cinco-habilidades-claude | herramientas | Media | Context7 y Task Master relevantes para planear y documentar |
| 72 | cinco-skills-contenido | contenido | Baja | NotebookLM, imágenes, editor, Stitch, Humanízalo |
| 73 | navega-y-automatiza | herramientas | Baja | Firecrawl + Playwright CLI como "ojos y manos" |

---

## 5. Qué adoptar para el producto propio (y cómo diferenciarse)

**Adoptar (como principios, con implementación propia):**
1. Plan como archivo ejecutable por otra sesión: pasos con contrato de 4 campos, criterios EARS y verificación que sale 0; tope de tamaño por paso.
2. Gates bloqueantes antes de generar (decisiones abiertas, pre-mortem) y Non-Goals explícitos.
3. Validador independiente que no lee las preferencias del usuario; reglas aprendidas de construcciones reales, versionadas (el equivalente a A–R).
4. Clasificación por tipo de producto (shapes) que decide preguntas, secciones y checks.
5. Workspace que nace con CLAUDE.md/AGENTS.md, skills y hooks (sin slash commands para el constructor autónomo).
6. Kits por capacidad con preguntas de negocio y candados deterministas (modelo PagoKit) — aplicable a auth, storage, email, colas, búsqueda.
7. Cadena con reauditoría: seguridad por capas (hooks + auditoría por gravedad + diff de reportes), prechequeos de deploy, legibilidad para agentes y SEO en dos ejes.
8. Diseño con insumos: carpeta de contexto + DESIGN.md con lista de prohibidos + componentes.md + una sola skill de diseño a la vez + revisión visual multi-breakpoint.
9. Pedagogía: ficha estándar, analogía → técnica, prompts copiables, "cuándo NO usar", rescate, fechas de verificación.

**Dónde diferenciarse:**
- **Backend de verdad**: shape SaaS con Supabase por defecto (RLS probadas con tests, migraciones, Edge Functions, multi-tenant, storage con políticas, jobs/cron, rate limiting, auditoría), en vez de dejarlo al plano genérico. tododeia es muy fuerte en landing/diseño y débil en backend.
- **Un solo orquestador con estado** (un manifiesto de proyecto que guarde fase, reportes y gates), en vez de herramientas sueltas que dejan Markdown en el Escritorio.
- **Calidad continua**: tests E2E y CI generados desde los Verify del plano; mantenimiento post-lanzamiento (upgrades, incidentes, loop.md).
- **LatAm de punta a punta**: pagos (Wompi, Mercado Pago, PSE, Nequi), facturación electrónica, WhatsApp como canal nativo, hosting según uso comercial.
- Español consistente (tuteo) y feedback durante la generación larga (tododeia se queda 25–35 min en silencio).
