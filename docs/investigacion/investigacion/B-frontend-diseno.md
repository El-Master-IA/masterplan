# B — Capa FRONTEND / DISEÑO / CALIDAD: ingeniería inversa del ecosistema

Fecha: 2026-10-23 · Repos clonados (`--depth 1`, sin ejecutar código) en `C:/tmp/arq-src/`.
Objetivo: decidir qué debe dominar la capa de frontend de un producto propio para Claude Code (marca original) que lleve a cualquier persona de cero a una app con bases sólidas.

---

## 0. Tabla resumen

| Repo | Licencia | Estrellas | Último push | Qué es en una línea | Cómo se activa | Cómo verifica |
|---|---|---|---|---|---|---|
| nextlevelbuilder/ui-ux-pro-max-skill | MIT | ~139k | 2026-10-23 | Base de datos de diseño en CSV + motor BM25 en Python que genera un design system | Skill auto-invocada por descripción + plugin; CLI npm | Checklist pre-entrega, validador de datos (`validate_data.py`), contraste calculado en código, procedencia por registro |
| vercel-labs/agent-skills | Sin LICENSE en raíz (skills declaran MIT en frontmatter) | ~33k | 2026-10-14 | Reglas atómicas (1 archivo = 1 regla) compiladas a AGENTS.md; reviewer UI que descarga reglas remotas | Skill por descripción; `web-design-guidelines` vía WebFetch | Salida `file:line`; reglas con ejemplo malo/bueno extraídas a `test-cases.json` para evals |
| VoltAgent/awesome-design-md | MIT | ~123k | 2026-10-14 | 84 DESIGN.md (formato Google Stitch) de marcas conocidas | Copiar el archivo al repo; el agente lo lee | Ninguna automática; sección "Known Gaps" por archivo |
| referodesign/refero_skill | MIT | ~325 | 2026-10-15 | Metodología "research-first" + MCP con 150k pantallas reales | Plugin + MCP HTTP (requiere login) | "Decision ledger", reference-lock y comparación visual post-build; checklist anti-slop |
| emilkowalski/skills | MIT | ~49k | 2026-10-11 | 15 skills de design engineering, sobre todo animación | Algunas auto, otras `disable-model-invocation: true` (solo explícitas) | Tablas de estándares (duración/easing/frecuencia), auditoría en 8 ejes, "break-ui" con datos peor-caso |
| JCodesMore/ai-website-cloner-template | MIT | ~37k | 2026-10-19 | Plantilla Next.js + skill para clonar un sitio desde URL | Slash command `/clone-website` → lee SKILL.md | `npm run check` (lint+tsc+build) + comparación lado a lado misma vista/estado |
| anthropics/claude-code `plugins/` | Repo "All rights reserved" (no reutilizar código) | ~153k | 2026-10-23 | 13 plugins oficiales de ejemplo: estructura, hooks, agentes | `.claude-plugin/plugin.json` + `hooks/hooks.json` | security-guidance: regex en PostToolUse + revisión LLM del diff en Stop + revisor agéntico en commit |
| anthropics/claude-plugins-official | Apache-2.0 | ~44k | 2026-10-23 | Marketplace oficial (incluye frontend-design, claude-security, hookify, LSPs) | `/plugin install x@claude-plugins-official` | claude-security: inventario → investigación → verificación independiente → parche verificado |
| Hainrixz/cyber-neo | MIT | ~290 | 2026-07-18 | Auditor de seguridad: 5 subagentes paralelos, 11 dominios de referencia | `/cyber-neo [path]` | Rúbrica de severidad CVSS, CWE/OWASP por hallazgo, risk score 0–100, tabla "no racionalices" |
| anthropics/skills `frontend-design` | Apache-2.0 | ~183k (repo) | 2026-10-09 | Skill de ~70 líneas: dirección estética anti-plantilla | Auto-invocada al construir UI | Proceso de 2 pasadas: plan de tokens → revisar contra "defaults genéricos" → construir → autocrítica con capturas |

Nota: las estrellas están infladas en todo el ecosistema de skills; úsalas como señal de adopción, no de calidad.

---

## 1. UI UX Pro Max (nextlevelbuilder)

**Propósito.** Darle al agente "inteligencia de diseño" consultable: en vez de meter todo en el prompt, guarda el conocimiento en tablas y el agente busca lo que necesita.

**Estructura.**
- `src/ui-ux-pro-max/data/*.csv` — la base de datos: `styles.csv` (79 estilos, ~30 columnas: keywords, colores, efectos, "best for / do not use for", soporte light/dark, rendimiento, accesibilidad, checklist de implementación, variables CSS, estado active/deprecated, reemplazo), `colors.csv` (192 paletas por tipo de producto con tokens semánticos estilo shadcn: primary/on-primary/background/foreground/card/muted/border/destructive/ring), `typography.csv` (74 pareos con URL de Google Fonts y config Tailwind), `google-fonts.csv` (~1.900 familias), `products.csv` y `ui-reasoning.csv` (192 categorías de producto → patrón, estilo, mood, anti-patrones y **reglas de decisión en JSON**), `ux-guidelines.csv` (119 reglas con Do/Don't, código bueno/malo y severidad), `landing.csv` (34 patrones de landing), `charts.csv`, `icons.csv`, `motion.csv` (presets GSAP), `react-performance.csv`, `app-interface.csv` y `stacks/*.csv` (22 stacks).
- `data-provenance.json` — cada registro tiene estado, fecha de verificación, SLA de frescura (365/90 días), confianza y fuentes. Muy buena idea para mantener una base viva.
- `scripts/core.py` — BM25 propio (k1=1.5, b=0.75) sin dependencias, con caché por firma de archivo, reescritura de consultas por dominio, umbrales mínimos por dominio y sugerencias de términos si no hay match.
- `scripts/design_system.py` — agrega 5 búsquedas paralelas (producto, estilo, color, landing, tipografía), aplica las reglas de `ui-reasoning.csv`, **calcula luminancia y contraste WCAG**, deriva paleta oscura, y emite ASCII o Markdown. Tiene 3 "diales" 1–10: `--variance`, `--motion`, `--density`.
- Persistencia "Master + overrides": `design-system/<proyecto>/MASTER.md` + `pages/<página>.md` que sobrescribe al master. No sobrescribe sin `--force`.
- `SKILL.md` — tabla de 10 categorías priorizadas (Accesibilidad y Touch = CRÍTICO… Charts = bajo), "contrato de consulta" (2–5 términos, un intent, reintentar una vez, no persistir resultados no verificados).

**Calidad.** Checklist pre-entrega (sin emojis como íconos, foco visible, contraste 4.5:1, reduced-motion, breakpoints 375/768/1024/1440), validador de datos para CI, tests con fixtures.

**Fortalezas.** Separación conocimiento (datos) / razonamiento (reglas) / presentación (prompt). Búsqueda local, offline y barata en tokens. Tokens semánticos listos para shadcn/Tailwind. Procedencia y caducidad de datos.
**Huecos.** Riesgo de "diseño por catálogo": mismo query → mismo resultado → todos los sitios se parecen (justo lo que el anti-slop combate). Paletas por *industria* son estereotipadas (spa = rosa+dorado). Python obligatorio. No verifica el código generado (solo recomienda). Muchísimo alcance (logos, slides, banners, CIP) que diluye el foco.
**Adoptar/Mejorar.** Adoptar: datos estructurados + motor de búsqueda local, tokens semánticos con pares `on-*`, contraste calculado, MASTER+overrides, procedencia. Mejorar: añadir semilla/aleatoriedad controlada y "perfil de marca" del usuario para romper la homogeneidad; reglas en formato verificable (lint), no solo texto; Node/TS en vez de Python para el público JS.

---

## 2. Vercel agent-skills

**Propósito.** Destilar el conocimiento de ingeniería de Vercel en reglas aplicables por agentes.

**Estructura y representación.**
- `react-best-practices/rules/*.md` — 70 reglas, **un archivo por regla** con frontmatter (`title`, `impact`, `impactDescription`, `tags`), explicación, ejemplo *Incorrect* y *Correct*, y referencia. Prefijos por categoría priorizada: `async-` (waterfalls, CRÍTICO), `bundle-` (CRÍTICO), `server-`, `client-`, `rerender-`, `rendering-`, `js-`, `advanced-`.
- `packages/react-best-practices-build` — parser/validador/compilador en TS: valida que cada regla tenga título, explicación y al menos un ejemplo bueno y uno malo; compila todo a un `AGENTS.md` de ~3.800 líneas; **extrae `test-cases.json`** (pares bueno/malo) para evaluar si un LLM detecta la regla.
- `composition-patterns` — arquitectura de componentes: evitar props booleanas, compound components, children > render props, variantes explícitas, React 19 sin forwardRef, contexto como interfaz, desacoplar estado de implementación.
- `web-design-guidelines` — skill de 40 líneas que **descarga en cada uso** `web-interface-guidelines/command.md` (~104 reglas en 17 secciones: accesibilidad, foco, formularios, animación, tipografía, imágenes, rendimiento, navegación/estado en URL, touch, safe areas, dark mode, i18n, hidratación, copy, anti-patrones) y reporta `archivo:línea` en formato terso.
- `vercel-optimize` — auditoría "metrics-first": no lee código hasta tener señales reales (CWV, costos), gates deterministas en scripts, citas validadas por versión.

**Fortalezas.** Formato de regla atómica + build + evals es lo más profesional del lote. Priorización por impacto medible. Formato de salida accionable. "Primero métricas, luego código" en rendimiento.
**Huecos.** El reviewer UI depende de una URL remota (sin red no funciona; además, contenido remoto que se inyecta como instrucciones = superficie de prompt-injection/cadena de suministro). Muy centrado en Next.js. Sin LICENSE en raíz.
**Adoptar/Mejorar.** Adoptar el formato "1 regla = 1 archivo con malo/bueno + impacto" y el pipeline validar → compilar → generar evals. Empaquetar reglas **localmente y versionadas** (no fetch en runtime). Cubrir Vite/React SPA + Supabase (el stack de Alexander), no solo Next.

---

## 3. awesome-design-md (VoltAgent) y el concepto DESIGN.md

**Propósito.** Colección de 84 DESIGN.md "inspirados en" marcas (Apple, Airbnb, Claude, Linear, Figma, BMW…) para que el agente genere UI con ese lenguaje visual.

**Formato (Google Stitch, `version: alpha`).** Frontmatter YAML con `colors`, `typography` (escala con fontSize/lineHeight/letterSpacing), `rounded`, `spacing`, y `components` que **referencian tokens** (`"{colors.primary}"`) con estados (`button-primary-active`, `-disabled`). Luego prosa: Overview, Colors, Typography, Layout, Elevation, Shapes, Components, Do's/Don'ts, Responsive, Iteration Guide y **Known Gaps** (lo que no se pudo extraer). Cada carpeta trae README que ahora redirige a getdesign.md (modelo comercial: peticiones privadas de DESIGN.md).

**Fortalezas.** El formato es el gran aporte: tokens máquina-legibles + intención en prosa en un solo archivo; referencias entre tokens; honestidad con "Known Gaps".
**Huecos.** Ninguna verificación. Riesgo legal/marca: imitar el sistema de una marca (fuentes con licencia, logos) no sirve para un producto propio y puede rozar trade dress. Contenido migrando a sitio comercial; no acepta PRs.
**Adoptar/Mejorar.** Adoptar DESIGN.md como **artefacto canónico del proyecto** (junto a CLAUDE.md/AGENTS.md), generado por el propio producto desde el brief del usuario, no copiado de marcas. Añadir: validación de esquema, chequeo de contraste de cada par `bg/text` declarado, y exportación a CSS variables / Tailwind theme.

**Refero (referodesign/refero_skill).** No es un repo de DESIGN.md sino una **metodología research-first** + MCP (`api.refero.design/mcp`, con login) sobre 150k pantallas y flujos reales. Tres capas: *styles* (dirección visual), *screens* (patrones concretos), *flows* (journeys). Reglas clave: investigar antes de diseñar, no copiar una referencia, no "promediar" referencias, no cambiar el rol de un token, "decision ledger" que traza cada decisión a una fuente, "reference lock" antes de construir, validar el render contra el target. Referencias locales muy buenas (~3.600 líneas): `anti-ai-slop.md` (9 "tells": índigo/violeta, cards por todos lados, dark por defecto, serif editorial en piloto automático, emojis, franja de acento lateral, promedio de referencias, deriva de rol de token, gráficos falsos), `color.md`, `typography.md`, `motion.md`, `craft-details.md`, `copywriting.md`. **Hueco:** el valor real está detrás de un servicio de pago/login; se declara "autoridad única" frente a otras skills (choca en un producto compuesto).

---

## 4. Emil Kowalski — emilkowalski/skills

**Propósito.** Codificar el criterio de un design engineer (ex Vercel/Linear, autor de Sonner y Vaul) sobre animación y pulido.

**Estructura.** 15 skills cortas (~4.800 líneas en total): `emil-design-eng` (filosofía + marco de decisión de animación), `animate`, `animate-expo`, `review-animations` (+ `STANDARDS.md`), `improve-animations` (+ `AUDIT.md` en 8 ejes + plantilla de plan), `find-animation-opportunities`, `animation-performance`, `animation-vocabulary` (glosario inverso), `apple-design`, `mobile-native`, `break-ui` (+ `CATALOG.md` de datos peor-caso), `pick-ui-library`, `prototype` (varias versiones con selector), `ask-sonner`, `write-swift`.

**Conocimiento medible.** Tabla de frecuencia (100+ veces/día → no animar nunca; ocasional → estándar; raro → puede deleitar); duraciones por elemento (press 100–160 ms, tooltip 125–200, dropdown 150–250, modal 200–500); ease-out para entrar, nunca `scale(0)`, popovers con origen, transiciones CSS (interrumpibles) sobre keyframes, `@starting-style`, solo `transform`/`opacity`, springs para gestos, asimetría entrada/salida, reduced-motion.

**Activación.** Mezcla inteligente: las que modifican mucho o son opinadas (`review-animations`, `prototype`, `pick-ui-library`) llevan `disable-model-invocation: true` → solo se ejecutan si el usuario las pide. "Review: default to flagging; approval is earned."

**Fortalezas.** Reglas concretas con números; separación "auditar (solo lectura) → plan autocontenido → otro agente ejecuta"; `break-ui` es un QA de contenido que casi nadie hace.
**Huecos.** Casi solo animación/pulido; nada de tokens, a11y profunda ni arquitectura de estado. Muy dependiente de su gusto personal.
**Adoptar/Mejorar.** Adoptar: tabla frecuencia→decisión, tokens de motion (duración/easing como variables), patrón auditor read-only + planes para ejecutores baratos, `break-ui` como paso obligatorio de QA, `disable-model-invocation` para skills caras. Mejorar: convertir estándares en lint (p. ej. detectar `transition: all`, `ease-in` en entradas, animación de width/height).

---

## 5. AI Website Cloner Template (JCodesMore)

**Propósito.** Plantilla Next.js (Tailwind, shadcn/Base UI) + skill para recrear un sitio a partir de su URL.

**Estructura.** `.agents/skills/clone-website/SKILL.md` (61 líneas) + `references/inspection-guide.md` y `framer-and-motion.md`; `.claude/commands/clone-website.md` solo apunta al SKILL (portabilidad entre Claude/Codex/Cursor); `AGENTS.md`/`CLAUDE.md`; Docker; `npm run check` = lint + typecheck + build.

**Método (4 fases).** Mapear rutas y propiedad de archivos → observar antes de construir (desktop/móvil, scroll completo, estados hover/click/tiempo; leer estilos computados en vez de inferir; usar fuentes y assets reales) → primera pasada completa (componentes compartidos con todos sus estados primero, luego delegar secciones a builders en paralelo con brief concreto) → comparar misma vista/scroll/estado, arreglar diferencias grandes primero, "no digas pixel-perfect si no lo verificaste".

**Fortalezas.** Definición de "terminado" explícita (build + comparación renderizada). Excelente disciplina de observación. Corto.
**Huecos.** Clonar sitios ajenos tiene implicaciones legales (copyright/marca); no extrae un design system reutilizable; sin a11y/perf.
**Adoptar/Mejorar.** No vender "clonar"; reutilizar el método como **"extraer referencia → DESIGN.md propio"** y como **QA visual** (comparar render vs. mockup aprobado). Adoptar el `check` único como puerta de calidad.

---

## 6. Plugins oficiales (anthropics/claude-code `plugins/` y claude-plugins-official)

**Estructura de plugin.** `.claude-plugin/plugin.json` (metadatos) + `commands/`, `agents/`, `skills/`, `hooks/hooks.json`, `.mcp.json`, README. Marketplace = `marketplace.json` que lista plugins.

**security-guidance (v2).** Tres capas: (1) regex/substring sobre ~25 patrones peligrosos en `PostToolUse` de Edit/Write (`dangerouslySetInnerHTML`, `.innerHTML=`, `child_process.exec`, `new Function`, `yaml.load`, workflows de GitHub…); (2) en `Stop`, envía el diff a un LLM y re-despierta a Claude con hallazgos (`asyncRewake`); (3) en `git commit`/`push`, revisor agéntico que lee archivos relacionados para encontrar IDOR/auth bypass multiarchivo. Todo configurable por variables de entorno (kill switch, capas, modelo, modo doble para más recall). ~6.600 líneas de Python. **Licencia del repo: All rights reserved** → estudiar el patrón, no copiar código.
**hookify.** Reglas de hook escritas como Markdown con frontmatter (`event`, `pattern`, `action: block|warn`) y un motor genérico → patrón genial para que usuarios no técnicos creen guardarraíles.
**claude-security (oficial, Apache-2.0).** Pipeline con agentes: inventario → carga → investigador → **verificador independiente** → generador de parche → verificador de parche; pide confirmar costo antes de escanear.
**Otros útiles como patrón:** `feature-dev` (7 fases con explorer/architect/reviewer), `code-review` (5 agentes paralelos + filtro por confianza), `pr-review-toolkit` (silent-failure-hunter, type-design-analyzer), `plugin-dev` (skills para crear plugins y validarlos).

**Adoptar.** Hooks como "red de seguridad automática" (barato en edición, profundo en Stop/commit), configuración por env con kill switch, verificación independiente de hallazgos, reglas declarativas tipo hookify.

---

## 7. Cyber Neo (Hainrixz — mismo autor que the-architect)

**Propósito.** Auditoría de seguridad read-only con reporte profesional.
**Estructura.** `SKILL.md` (579 líneas) + 14 referencias (~8.800 líneas: OWASP 2025, CWE Top 25, auth/authz, cripto, errores, logging, web, IaC/Docker, CI/CD, supply chain, secretos, JS, Python) + 2 scripts (`scan_secrets.py` con 60+ patrones, `check_lockfiles.py`).
**Flujo.** Fase 1 reconocimiento (stack, tamaño, herramientas externas: semgrep, npm audit, etc.) → fases 2–6 en **5 subagentes paralelos** (SCA, SAST, secretos, configuración/infra, supply chain/CI) con **esquema de salida común** y referencias embebidas en el prompt de cada subagente → fase 7: merge, dedupe, severidad CVSS, CWE+OWASP por hallazgo, `risk = min(100, 25·C + 10·H + 3·M + 1·L)`, reporte guardado.
**Fortalezas.** "IRON LAW: READ-ONLY"; tabla anti-racionalización; usa herramientas reales si existen y cae a análisis nativo si no; edge cases documentados.
**Huecos.** Sin verificación independiente de hallazgos (falsos positivos); sin RLS de Supabase ni políticas específicas de BaaS; sin seguimiento entre ejecuciones (baseline/diff); score lineal simple; último commit en julio.
**Adoptar/Mejorar.** Adoptar la orquestación por dominios con esquema común y el reporte con CWE/OWASP. Añadir: verificador independiente (estilo claude-security), dominio Supabase (RLS, `service_role` en cliente, buckets públicos, Edge Functions sin auth), headers/CSP del frontend, baseline para ver regresiones.

---

## 8. Skill oficial frontend-design (Anthropic)

**Versiones.** `anthropics/skills/skills/frontend-design` (Apache-2.0) y el plugin homónimo en claude-code/claude-plugins-official (texto ligeramente distinto; misma idea).
**Contenido (≈70 líneas, solo prosa).** Rol de "design lead de un estudio que nunca repite identidad"; anclar el diseño al tema real del producto; el hero muestra lo más característico del mundo del sujeto; 1–2 familias tipográficas elegidas a propósito, escala según *Elements of Typographic Style*, líneas < 80 caracteres; la estructura visual es información (no numerar 01/02/03 si no es secuencia); movimiento no disparado por el usuario con mucha moderación (un solo momento orquestado); **lista de 5 "clusters" de diseño generado por IA** (crema + serif + terracota; negro + acento ácido; periódico con hairlines; kit de cards SaaS; cromo de plantilla: eyebrows en mayúsculas, "A · B · C", "→" en botones…); proceso en dos pasadas (plan de tokens de 4–6 hex + tipos + layout ASCII + principios → revisar contra lo genérico y decir qué cambió → construir → autocrítica con capturas); "gasta la audacia en un solo lugar"; piso de calidad silencioso (responsive, foco, reduced-motion, contraste); guía de microcopy (voz activa, mismo verbo en todo el flujo, errores que dicen cómo arreglar).
**Fortalezas.** Muy eficiente en tokens; ataca la causa del "AI slop" (defaults) con un proceso de autocrítica, no con un catálogo.
**Huecos.** Sin datos, sin verificación automática, sin persistencia del sistema de diseño entre sesiones.

---

## 9. Síntesis: qué debe tener la capa frontend del producto propio

Principio rector: **conocimiento como datos versionados + reglas verificables + proceso con puertas de calidad**. Prosa para criterio, datos para elección, lint/scripts para comprobar.

### 9.1 Artefactos canónicos del proyecto del usuario
- `DESIGN.md` propio (formato tipo Stitch: frontmatter de tokens con referencias + prosa + Known Gaps), generado desde el brief, nunca copiado de una marca.
- Exportadores: `DESIGN.md → tokens.css` (variables) + `tailwind theme` + tokens de motion.
- Patrón MASTER + overrides por página (de UUPM).
- `decisions.md` / ledger de decisiones de diseño (de Refero): cada decisión → fuente (brief, referencia, regla).

### 9.2 Por dominio

| Dominio | Adoptar de | Mejora propia |
|---|---|---|
| Design system / tokens | UUPM (tokens semánticos con `on-*`, contraste calculado), DESIGN.md, frontend-design (plan de 4–6 hex) | Generador con semilla + perfil de marca para evitar homogeneidad; validador de esquema; todo en Node/TS |
| Accesibilidad | WIG de Vercel (~104 reglas), UUPM (prioridad CRÍTICO), checklist pre-entrega | Reglas locales y versionadas; parte automatizable vía axe/Playwright + ESLint jsx-a11y; reporte `file:line` |
| Rendimiento / CWV | react-best-practices (70 reglas priorizadas), vercel-optimize (metrics-first) | Versión SPA Vite + Supabase; presupuestos (LCP < 2.5 s, INP < 200 ms, CLS < 0.1, JS inicial) chequeados con Lighthouse CI |
| Animación | Emil (tabla de frecuencia, duraciones, easing, interrumpibilidad, solo transform/opacity) | Tokens de motion en DESIGN.md + lint de anti-patrones (`transition: all`, `ease-in` de entrada, animar layout) |
| Anti-"AI slop" | frontend-design (5 clusters + 2 pasadas), Refero (9 tells, no promediar referencias) | Detector automático sobre el código/capturas (índigo por defecto, eyebrows en mayúsculas, cards idénticas, emojis como íconos, "→" en CTAs) con puntuación |
| Arquitectura de componentes y estado | composition-patterns (compound components, sin props booleanas, variantes explícitas), rerender-* | Guía de estado: servidor (TanStack Query/Supabase) vs. URL vs. local vs. global; reglas de carpetas; plantillas de componentes con todos los estados (loading/empty/error) |
| Calidad de contenido / QA | Emil `break-ui`, cloner (comparar misma vista/estado), Refero (validar contra target) | Paso obligatorio "datos peor-caso" + captura móvil/desktop + comparación con mockup aprobado |
| Seguridad | security-guidance (3 capas por hook), Cyber Neo (5 subagentes, CWE/OWASP, score), claude-security (verificador independiente) | Dominio Supabase/RLS, CSP/headers, secretos en bundle de Vite (`VITE_*`), baseline entre ejecuciones |

### 9.3 Formato y mecánica recomendados
1. **Regla atómica** (Vercel): `rules/<dominio>-<id>.md` con frontmatter `impact`, `tags`, `stack`, `auto_checkable`, ejemplo malo/bueno, fuente. Build que valida, compila a un índice ligero y extrae evals.
2. **Datos consultables** (UUPM) para lo combinatorio: paletas, pareos tipográficos, patrones de landing, presets de motion; búsqueda local sin red. Con `provenance` y fecha de verificación.
3. **Activación por capas**: skill de criterio auto-invocada y breve (estilo frontend-design); skills caras o invasivas con `disable-model-invocation` (estilo Emil); comandos explícitos para auditorías (`/audit-ui`, `/audit-security`).
4. **Puertas de calidad** con hooks (estilo security-guidance/hookify): avisos baratos en PostToolUse, revisión del diff en Stop, auditoría profunda en commit; todo con kill switch por env.
5. **Auditor read-only → plan autocontenido → ejecutor** (Emil/Cyber Neo) con esquema de hallazgos común (`id, dominio, severidad, archivo:línea, evidencia, fix, regla`) y **verificador independiente** antes de reportar.
6. **Definición de terminado** explícita (cloner): `check` (lint+types+build+tests) + capturas móvil/desktop + checklist a11y + presupuesto de rendimiento + sin hallazgos críticos de seguridad.

### 9.4 Licencias y riesgos
- Reutilizable con atribución: UUPM, awesome-design-md, Refero, Emil, cloner, Cyber Neo (MIT); frontend-design y claude-plugins-official (Apache-2.0: conservar aviso y NOTICE).
- **No copiar código** de `anthropics/claude-code` (All rights reserved): solo inspirarse en patrones.
- Vercel agent-skills: sin LICENSE en raíz; solo hay MIT en el frontmatter → redactar reglas propias, no copiar.
- No incluir DESIGN.md de marcas reales en el producto (fuentes con licencia, trade dress). No posicionarlo como "clonador de sitios".
- Evitar reglas descargadas en runtime (WIG): riesgo de inyección y de fallos sin red; empaquetar y versionar.

### 9.5 Diferenciador posible
Ninguno de los repos une las tres cosas: **(a) design system generado y persistido como DESIGN.md + tokens, (b) reglas verificables por máquina en a11y/perf/motion/anti-slop/seguridad, (c) puertas automáticas por hooks con verificación independiente**, todo en español y orientado al stack React + Vite + Supabase + Vercel. Ese hueco es la oportunidad.
