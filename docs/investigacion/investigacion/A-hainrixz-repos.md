# A — Ingeniería inversa del ecosistema Hainrixz (Enrique Rocha / Tododeia), excepto the-architect

Fecha del análisis: 2026-10-23. Clones `--depth 1` en `C:/tmp/arq-src/`. No se ejecutó código de ningún repo.
Objetivo: extraer patrones de diseño para un producto propio (arquitecto + constructor para Claude Code) sin copiar texto.

---

## 0. Mapa del ecosistema

Cuenta con ~38 repos públicos. Los relevantes para "construir software" (estrellas / último push):

| Repo | ★ | Último push | Licencia | Rol en una cadena de construcción |
|---|---|---|---|---|
| the-architect | 561 | 2026-10-17 | MIT | Planificar (ya analizado, fuera de alcance) |
| whatsapp-agentkit | 546 | 2026-08-19 | MIT | Constructor vertical (bot WhatsApp) — **analizado** |
| cyber-neo | 290 | 2026-07-18 | MIT | Auditoría de seguridad — **analizado** |
| claude-webkit | 283 | 2026-08-21 | MIT | Constructor vertical (landing page) — **analizado** |
| claude-seo-ai | 79 | 2026-09-07 | MIT | Auditor + fixer SEO/GEO — **analizado** |
| all-deploy | 70 | 2026-09-19 | MIT | Deploy con auditoría bloqueante — **analizado** |
| agente-pagokit | 67 | 2026-08-31 | MIT | Integración de pagos con validadores — **analizado** |
| claude-db | 21 | 2026-06-17 | MIT | Diseño/auditoría/migración de BD — **analizado** |
| whatsapp-closer-agentkit | 38 | 2026-08-15 | MIT | "Repo-blueprint" por fases (v2 de agentkit) — revisado por árbol + CLAUDE.md + mapa |
| jarvis-architect | 12 | 2026-10-17 | MIT | Clon del patrón the-architect para agentes personales — revisado por árbol |
| claude-anatomy | 15 | 2026-08-13 | MIT | Árbol de decisión: skill vs subagente vs hook vs MCP vs plugin — revisado por árbol |
| tododeia-animaciones | 7 | 2026-02-28 | **sin LICENSE** | Bootstrap Codex + Remotion — **analizado** |

Otros (open-carrusel, editor-pro-max, claude-ads, humanizalo, abogado-del-diablo, aprende-skill, maia-skill, creative-architect, motion-architect…) son de contenido/marketing y quedan fuera.

**Evolución visible del autor (importante para entender su "estilo" y no repetir sus etapas tempranas):**
1. *Feb 2026* — scripts de bootstrap + AGENTS.md mínimo (tododeia-animaciones).
2. *Ago 2026* — "CLAUDE.md gigante como programa" (webkit 25 KB, agentkit 83 KB con todo el código embebido).
3. *Jun–Sep 2026* — **plugins con "kit de auditor"**: skills de módulo + subagentes read-only en paralelo + scripts deterministas + JSON Schema de hallazgos + dos puntuaciones + un único escritor opt-in + hooks guardianes (claude-db → claude-seo-ai; pagokit lo lleva a validadores en hooks).
4. *Ago–Oct 2026* — **"repo-blueprint"**: el repo no trae la app, trae archivos de fase numerados, contratos JSON, versiones fijadas (PINES), supuestos declarados, compuerta de N chequeos y estado reanudable (whatsapp-closer, the-architect, jarvis-architect).

---

## 1. claude-webkit — "landing page en minutos"

**Propósito.** Llevar a un no-programador de cero a una landing Next.js desplegada, en ES/EN.
**Licencia:** MIT (Enrique Rocha / Tododeia). Skills de terceros conservan su LICENSE/NOTICE + `ATTRIBUTION.md`.
**Métricas:** 283★, último commit 2026-08-20.

### Árbol (resumen con tamaños)
```
CLAUDE.md                     25 KB   ← el "programa" (entrypoint único)
README.md / README.es.md      18 KB c/u
package.json                  0.8 KB  (solo scripts de hero y verificación)
.claude/settings.local.json   1 KB    (allowlist amplia de Bash: npx, npm, rm*, curl*, git*…)
docs/
  questionnaire(-es).md       6 KB    4 rondas, 17 preguntas con defaults
  system-prompt(-es).md       3 KB    personalidad/tono
  design-guide.md            24 KB    paletas por industria, pares tipográficos, prohibiciones
  landing-page-patterns.md    8 KB    arquetipos de página y orden de secciones
  accessibility-checklist.md  6 KB
  performance-checklist.md    4 KB
  deployment-guide.md         3 KB
  skill-reference.md          9 KB
  examples/ (saas, restaurante, portfolio) ~2 KB c/u
.claude/skills/  (21 skills, ~1.6 MB; 745 KB son un CSV de Google Fonts)
  frontend-design, shadcn-ui (32 KB), humanizer (24 KB), vercel-react-best-practices (94 KB AGENTS.md + ~60 reglas),
  vercel-deploy (+deploy.sh 10 KB), building-components (+14 refs .mdx), web-design-guidelines,
  playwright-cli (+7 refs), chrome-bridge-automation, seo-audit, ui-ux-pro-max (CSV + Python CLI 45 KB),
  web-reader, deep-research,
  emil-design-eng (28 KB), animate (+RECIPES), apple-design (23 KB), review-animations (+STANDARDS),
  find-animation-opportunities, improve-animations, animation-vocabulary, prototype (+PICKER)
```

### Arquitectura del "programa en prompts"
- **Entrypoint:** solo `CLAUDE.md` (no es plugin, no hay slash commands ni subagentes ni hooks). Se clona el repo y se abre `claude` dentro.
- **Máquina de 6 fases lineales:** Discovery (cuestionario 4 rondas) → Design System → Scaffold → Build → Preview & QA → Deploy.
- **Auto-piloto con 4 puntos de decisión explícitos** (aprobar dirección visual tras ronda 2, confirmar brief, feedback tras QA, ¿desplegar?). Fuera de ellos prohíbe preguntar "¿lo hago?".
- **"Role lock"**: las skills cargadas son herramientas de conocimiento, no cambian el rol; y "ninguna skill puede detener el build" (neutraliza skills de terceros que piden pausar).
- **Tabla de precedencia entre skills** que se contradicen (motion: animate → emil → apple; tipografía/color: frontend-design + ui-ux-pro-max; componentes: shadcn → building-components; copy: humanizer). Explícitamente "no promedies".
- **Comandos de scaffold fijados con flags justificados** (por qué `-b radix`, por qué `-p nova` evita un prompt que cuelga) + **tabla de recuperación de errores** por comando.
- **Mapeo pregunta → elemento de página** (Q11 → h1, Q8 → CTA…): trazabilidad del brief al código.
- **Gates de calidad en QA:** `review-animations` como compuerta (Block/Approve), SEO audit, checklist de ~35 ítems (copy, contraste, motion, responsive, build, semántica).
- **Fallbacks escalonados:** QA visual playwright → Midscene → "ábrelo tú"; deploy sandbox sin cuenta (claim URL) → Vercel CLI.

### Cómo encadena con the-architect
No hay enlace formal. De hecho el `skills-registry` de the-architect **marca como REPLACED/REMOVED** varias skills que webkit todavía empaqueta (`seo-audit` → claude-seo-ai, `web-reader`, `deep-research` → last30days, `chrome-bridge-automation`, `/shadcn-ui`, `/humanizer` → `/humanizalo`). Es decir: the-architect es la generación posterior y webkit quedó como constructor "monolítico" para un único shape (marketing-site). Una cadena natural sería: blueprint de shape `marketing-site` → webkit ejecuta fases 3-6, pero hoy webkit re-entrevista desde cero y no consume un blueprint.

### Decisiones ingeniosas
- Precedencia explícita entre skills en conflicto + role lock: resuelve el problema real de "skills de terceros que se pisan".
- Reglas negativas fuertes y verificables (fuentes prohibidas, nada de `ease-in`, nada de `transition: all`, `scale(0)` prohibido) → "AI-slop test".
- Pausa de aprobación de diseño *antes* de pedir contenido (el contenido se informa del diseño).
- Deploy sin cuenta (sandbox + claim URL) baja la fricción a cero para principiantes.
- Copy siempre pasa por un "humanizador".

### Debilidades / huecos
- **Backend/datos:** nada. Formulario = `mailto:` o Formspree. Sin BD, sin auth, sin API.
- **Seguridad:** allowlist de permisos muy permisiva (`rm*`, `curl*`, `chmod*`, `bash*deploy*`); `curl -o` de URLs del usuario sin validación; sin CSP/headers.
- **Testing:** solo screenshots; ni unit, ni e2e asertivo, ni Lighthouse/axe automatizado; a11y es checklist manual.
- **Estado/reanudación:** no persiste estado de fase; si la sesión se compacta o se corta, se pierde el brief.
- **Mantenimiento:** 21 skills vendorizadas (1.6 MB) se desactualizan (ver REPLACED arriba); CLAUDE.md monolítico y caro en contexto.
- **Un solo stack y un solo shape** (Next.js landing). Crédito obligatorio en footer.
- **i18n de la página** solo como idioma único, sin rutas multi-idioma.

### ADOPTAR / MEJORAR
- ADOPTAR: puntos de decisión contados; role lock; tabla de precedencia; mapeo brief→código; tabla de recuperación de errores por comando; reglas de diseño negativas verificables.
- MEJORAR: consumir un blueprint en vez de re-entrevistar; estado persistido (`.estado.json`) y comando "seguir"; skills referenciadas por versión (registry) en lugar de vendorizadas; permisos mínimos + hook guardián; QA asertivo (axe, Lighthouse CI, Playwright con aserciones); módulos opcionales de backend (forms con validación server-side, BD, auth).

---

## 2. claude-seo-ai — auditor SEO + GEO/AEO con fixer opt-in

**Propósito.** Auditar cualquier sitio (URL o código) en dos ejes: SEO clásico y visibilidad en motores de respuesta IA; aplicar arreglos seguros solo con confirmación.
**Licencia:** MIT. **Métricas:** 79★, último commit 2026-09-06 (v0.2.0). Es el único hermano que the-architect recomienda dentro de sus blueprints.

### Árbol (resumen)
```
.claude-plugin/plugin.json (5 KB, con userConfig de credenciales marcadas sensitive) + marketplace.json
hooks/hooks.json → PreToolUse: guard-write.mjs (Write/Edit), guard-bash.mjs (Bash)
skills/ (34): 5 comandos (audit, geo, score, compare, fix) + orquestador + ~28 módulos M1–M22
agents/ (5): technical-auditor, ai-search-geo-specialist, content-eeat-analyst, schema-generator (read-only), seo-fixer-writer (único escritor)
scripts/ (~70 .mjs, ~1 MB): crawl, snapshot, audit, report, score, compare, fix-plan, fix-ticket,
         checks/* (≈25 chequeos deterministas), adapters/* (local-files, Shopify theme/admin, WP REST/WP-CLI, page-api, instrucciones), lib/*
schema/  finding.schema.json, audit-report.schema.json, jsonld-templates/ (13)
references/ scoring-model, routing (vertical→módulos), ai-crawlers, cwv-thresholds, platforms/ (26 fichas)
docs/en|es (architecture, scoring, usage, platforms, mcp, distribution) + docs/dev (plan de 97 KB)
action.yml + workflows (GitHub Action con --fail-under)
```

### Arquitectura
- **Tres capas:** (1) scripts deterministas adquieren y miden; (2) orquestador detecta → despacha → sintetiza; (3) el modelo solo *juzga* lo que el script no puede decidir.
- **Fases del orquestador:** Detect (una sola llamada a `audit.mjs` que crawl/snapshot + perfil de plataforma + chequeos deterministas) → Dispatch (4 subagentes read-only **en un solo mensaje**, con un "sobre"/envelope de rutas absolutas y lista de módulos; deben devolver solo un array JSON conforme al schema y no re-emitir ids deterministas) → Synthesize (`report.mjs --merge`: dedupe por id+ubicación, gana el más severo, descarta hallazgos inválidos al schema, puntúa).
- **Dos puntuaciones nunca mezcladas** (Search vs AI Visibility), pesos por categoría, categorías condicionales por vertical, re-normalización por peso activo. `needs_api`/`manual_review` nunca son "pass silencioso" ni penalización: se cuentan aparte como cobertura.
- **Fixer:** `disable-model-invocation: true` (solo el usuario lo dispara); clases AUTO / PROPOSED / ADVISORY; nunca arregla "de memoria" (requiere `report.json` en disco y <24 h); dry-run por defecto; tickets por cambio; manifiesto + backups + rollback por run; adaptadores por plataforma con degradación a "instrucciones paso a paso".
- **Guardias en profundidad:** hook de escritura que DENIEGA rutas protegidas (.env, .git, claves SSH, lockfiles, wp-config) y PREGUNTA fuera de las raíces permitidas; nunca emite "allow" (no roba la decisión del usuario). Credenciales solo por `userConfig`/env, jamás pegadas en el chat ni en flags.
- **Modo degradado** honesto: sin Node → WebFetch, todo marcado `needs_api` y etiquetado "no comparable".
- Persistencia fuera del proyecto (`${CLAUDE_PLUGIN_DATA}/runs/<host>/<run-id>`), `compare` contra baseline, CI con umbral.

### Encadenamiento con the-architect
the-architect lo nombra en el paso de "polish"/deploy de los shapes públicos (marketing-site, saas, e-commerce, content-platform). Es una **dependencia recomendada**, no invocada: el blueprint incluye el comando de instalación y el momento de uso.

### Ingenioso
- "El script adquiere, el modelo juzga" → reproducibilidad.
- Contrato de hallazgo con JSON Schema y validación al fusionar → los subagentes no pueden inventar formato.
- Single-writer + read-only por allowlist de herramientas + hook como defensa en profundidad.
- Honestidad cuantificada (cobertura, unscored_count) en vez de puntajes inflados.
- Fichas por plataforma y adaptadores de escritura con degradación.

### Huecos
- Solo SEO/GEO; CWV depende de PSI API; JS-rendering opcional.
- Complejidad alta (≈1 MB de scripts) → difícil de mantener/auditar para un tercero.
- No mide accesibilidad real ni seguridad de headers más allá de lo SEO.

### ADOPTAR / MEJORAR
- ADOPTAR íntegro el "kit de auditor" (ver §9): finding schema, dos ejes, single-writer, opt-in fixer, guardias, needs_api, runs persistidos y compare.
- MEJORAR: generalizar el kit a un motor común para todos los dominios (seguridad, a11y, perf, BD) en lugar de reimplementarlo por plugin.

---

## 3. agente-pagokit — pagos con validadores que bloquean

**Propósito.** Elegir el proveedor de pago correcto (42 proveedores, fuerte foco LATAM) y escribir la integración completa (checkout, webhook firmado, esquema BD, portal, reembolsos), bloqueando código inseguro mientras se escribe.
**Licencia:** MIT. **Métricas:** 67★, último commit 2026-08-31 (v0.2.2).

### Árbol (resumen)
```
.claude-plugin/plugin.json (userConfig: strictMode, defaultCountry, preferredStack)
commands/ (8): start, add, compare, coverage, doctor, harden, migrate, test
skills/ (8): project-analyzer, payment-advisor (+SECURITY_RULES 12 KB + data/ catálogo ≈300 KB),
             integration-builder (fragments/ ≈25 piezas por eje: billing, checkout, compliance, money, notify, webhook;
             templates/<proveedor>/ ; _stack-adapters/ ; _db-adapters/ (prisma, drizzle, sqlalchemy) ;
             _deploy-targets/ ; fixtures/ ; recipes/default.json),
             doctor (+PROVIDER_CHECKS 27 KB), payment-migrator, subscription-lifecycle, tax-advisor, webhook-verifier
agents/integration-specialist.md (único escritor)
hooks/hooks.json → SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop → pagokit-validate.js <fase>
hooks/checks/ 22 validadores JS + __tests__/ (uno por validador) ; ERROR_CODES.md generado del código
schemas/ (providers, methods, currencies, regions, use_cases) ; scripts/ advise.js (motor de ranking), sign-event.js, generadores
.github/workflows/test.yml, plantillas de issue (incluye "provider_request")
```

### Arquitectura
- **Flujo `/pagokit:start`:** analizar proyecto *antes* de preguntar → confirmar detección (una ronda, nunca en bucle) → 3 preguntas núcleo (tope duro 5) → **motor determinista** `advise.js` (filtros duros + modificadores; devuelve recomendación, rechazados con motivo, costo real en dinero, nivel de integración "construible vs solo asesoría", fecha de verificación del dato, o `refused` en mercados sancionados) → el usuario elige → delega al subagente escritor con un spec JSON → reporte + footer legal regional → siguientes pasos (`test`, checklist de producción).
- **Composición por fragmentos ortogonales:** proveedor × stack × ORM × deploy × modo de cobro × estilo de frontend → recetas. Evita N×M plantillas.
- **Validadores deterministas en hooks** (22): firma de webhook, raw body, unidades menores de moneda, no confiar en el monto del cliente, idempotencia criptográfica, secretos en bundle cliente, comparación de secretos en tiempo constante, allowlist de eventos, ack rápido, no PAN/CVV, PII en logs, colisión con webhooks existentes, `.env` en `.gitignore`, e-factura… Contrato stderr JSON bilingüe con código de error y `suggested_fix`; exit 2 bloquea; escape hatch `// pagokit-ignore: <regla> -- <motivo>` **registrado** en `.pagokit/audit.log`. `strictMode` promueve warnings a deny.
- **Prueba de webhook:** `sign-event.js` firma eventos de prueba para demostrar que el handler rechaza falsificados y repetidos.
- **Artefactos de auditoría** para el humano: `PAGOKIT_INTEGRATION.md` y `PAGOKIT_PRODUCTION_CHECKLIST.md`.

### Encadenamiento
No referenciado por the-architect (que tiene una capability de pagos propia). Encaje natural: el blueprint declara "capability: payments" → se invoca `/pagokit:start` en el paso correspondiente con el spec ya resuelto (stack/ORM/deploy vienen del blueprint, se salta la detección).

### Ingenioso
- "Validadores que no se pueden discutir": la seguridad no depende de que el modelo obedezca.
- Motor de recomendación puro y testeable, con razones de rechazo; el LLM solo lo explica.
- Declarar honestamente "puedo construirlo" vs "solo asesorar".
- Error codes generados desde el código (documentación que no se desincroniza).
- Escape hatch auditable en vez de desactivar reglas.

### Huecos
- Detección por regex/heurística: falsos positivos/negativos posibles; un PostToolUse no "deshace" una escritura (solo realimenta).
- Catálogo de tarifas envejece (lo mitiga con `last_verified_at`).
- Plantillas completas solo para 4 proveedores (Stripe, MercadoPago, Wompi, LemonSqueezy); el resto "asesoría".
- Sin pruebas e2e de checkout en sandbox real del proveedor.

### ADOPTAR / MEJORAR
- ADOPTAR: validadores-hook con contrato JSON + códigos + escape hatch registrado; motor determinista para decisiones de catálogo; fragmentos ortogonales; checklist de producción como artefacto.
- MEJORAR: generalizar los validadores a un "policy pack" por dominio (auth, uploads, SQL, CORS, headers) activable según las capabilities del blueprint; correrlos también en CI (no solo en sesión).

---

## 4. tododeia-animaciones — bootstrap Codex + Remotion

**Propósito.** Un comando instala dependencias (git, node, cloudflared, Codex CLI), skills locales, un proyecto Remotion inicial, arranca Studio y un túnel Cloudflare, y abre Codex con un prompt guía.
**Licencia:** **ninguna** (no reutilizable legalmente sin permiso). **Métricas:** 7★, último commit 2026-02-27.

### Árbol
```
README.md 3 KB · AGENTS.md 1.5 KB · install.sh / install.ps1 (~3.5 KB)
scripts/bootstrap.sh / .ps1 (~15 KB c/u), lib/common.*, tunnel.sh
skills/video-generator/SKILL.md (2 KB) + references (components, composition-patterns) + scripts/remotion.sh
```

### Arquitectura
- Instalador `curl | bash` / `irm | iex` → bootstrap idempotente (reusa instalaciones, PIDs en `.runtime/`, no hace pull con cambios sin commitear).
- AGENTS.md con "misión", prioridad de skills, flujo obligatorio de 7 pasos y regla "renderizar solo con confirmación explícita".

### Para un producto propio
- ADOPTAR: bootstrap idempotente multiplataforma (bash + PowerShell gemelos), estado de procesos en `.runtime/`, túnel para preview remoto, "acción costosa solo con confirmación".
- MEJORAR / EVITAR: `curl | bash` sin verificación de hash; instalar CLIs automáticamente (all-deploy lo prohíbe con razón); sin licencia. Es una etapa temprana del autor.

---

## 5. whatsapp-agentkit — bot de WhatsApp en <30 min (546★)

**Propósito.** Claude entrevista al negocio y genera un agente FastAPI + Claude API + memoria + herramientas, con proveedor Zernio o Meta Cloud API, prueba local y deploy a Railway.
**Licencia:** MIT. **Último commit:** 2026-08-19.

### Árbol
```
CLAUDE.md 83 KB  ← contiene TODO el código a generar dentro de bloques markdown
.claude/commands/build-agent.md 2.5 KB (resumen de las 5 fases)
.env.example, start.sh, docs/index.html (landing), knowledge/ (vacía, para docs del negocio)
scripts/audit.py 35 KB ← audita el propio repo-plantilla
```

### Arquitectura
- 5 fases: entorno → entrevista (10 preguntas, una a la vez) → generación (yaml de negocio, prompts, providers con factory/base/adaptador, main con webhook firmado + BackgroundTasks + dedup + candado por teléfono, brain, memory, tools, simulador de chat, Docker) → test local con aprobación → deploy opcional.
- Comentarios "por qué" dentro del código generado (SQLite efímero en contenedor, lock por número, health check que verifica credenciales, no `getenv` con default vacío).
- **`audit.py` del repo** compila los bloques ```python del CLAUDE.md, parsea los YAML, detecta restos de proveedores eliminados, cruza variables de entorno contra `.env.example`, verifica links e imágenes. → **"testear el programa-en-prompts"**.

### Huecos
- Pide credenciales **en el chat** (pregunta 10) — su sucesor (closer) lo corrige: "los secretos los escribe quien instala, nunca una tool call".
- CLAUDE.md de 83 KB cargado entero cada turno (caro, frágil a compactación).
- Sin rate limiting, sin observabilidad, sin tests automatizados del agente generado más allá del simulador.

### whatsapp-closer-agentkit (sucesor, revisado parcialmente)
Muestra el patrón maduro "repo-blueprint": CLAUDE.md corto (2.6 KB, "se paga en cada turno"), `blueprint/00-mapa.md` como índice y 16 archivos de fase leídos **uno a la vez**, cada paso con cuatro tiempos (**Objetivo / Hacé esto / Tenés que ver / Si falla**), `contratos/*.schema.json` de entrada/salida, `PINES.md` (versiones y modelo fijados como única fuente), `SUPUESTOS.md`, `PENDIENTES.md`, `CITAS.md`, plantillas con `MANIFIESTO.json` por hash, estado reanudable `.wca-estado.json` + comando `/seguir`, compuerta `auditar.py` con evidencia en `EVIDENCIA/gates.json`, acciones externas en modo **borrador** por defecto con escalones para pasar a automático, fixtures de prueba con salida esperada. Es, en la práctica, the-architect "pre-renderizado" para un dominio.

---

## 6. cyber-neo — agente de ciberseguridad (290★)

**Propósito.** Escaneo read-only de un proyecto local: SCA, SAST, secretos, config/IaC, supply chain y CI/CD; reporte priorizado con CWE/OWASP.
**Licencia:** MIT (autor en plugin.json: "mhenry", publicado por Tododeia). **Último commit:** 2026-07-17.

### Árbol
```
.claude-plugin/plugin.json · CLAUDE.md 4 KB
skills/cyber-neo/SKILL.md 24 KB
  references/ (13, ~240 KB): owasp-top-10, cwe-top-25, auth-authz, crypto, secrets (60+ patrones), web-security,
             lang-javascript, lang-python, iac-docker, cicd, supply-chain, logging, error-handling, report-template
  scripts/ scan_secrets.py (21 KB), check_lockfiles.py (13 KB)
```

### Arquitectura
- "Ley de hierro": READ-ONLY.
- Fase 1 reconocimiento síncrono (stack, alcance por tiers según tamaño, carga de referencias, detección de herramientas opcionales `semgrep/trivy/gitleaks/npm/pip-audit/cargo-audit`).
- Fases 2-6: **5 subagentes en paralelo**, uno por dominio; como los subagentes no ven `${CLAUDE_SKILL_DIR}`, el orquestador **inyecta el contenido de las referencias en el prompt** y pasa rutas absolutas.
- Fase 7: merge, dedupe (consolida patrones repetidos en 5+ archivos), severidad tipo CVSS, mapeo CWE/OWASP, risk score, reporte desde plantilla.
- Tabla "Red flags — no racionalices esto" (anti-atajos del modelo).

### Huecos
- Esquema de hallazgos en markdown (no JSON Schema) → menos verificable que seo-ai/claude-db.
- Risk score aditivo simple (saturable); sin DAST, sin pruebas de RLS/autorización contra BD real, sin baseline/compare ni fixer.
- Lenguajes con referencia específica: solo JS y Python.

### ADOPTAR / MEJORAR
- ADOPTAR: tiers de alcance, herramientas externas opcionales con fallback, inyección de referencias a subagentes, tabla anti-racionalización.
- MEJORAR: migrarlo al kit de auditor (finding schema + dos ejes "explotabilidad / higiene" + compare + fixer opt-in), y añadir verificación dinámica en preview (headers, CORS, auth).

---

## 7. all-deploy — deploy universal con auditoría bloqueante (70★)

**Propósito.** Desplegar cualquier app/API/agente/sitio estático: auditoría estricta → preview → health check → prod → verificación + rollback. También "correr local".
**Licencia:** MIT. **Último commit:** 2026-09-19.

### Árbol
```
SKILL.md 29 KB (skill suelta, no plugin) · README 40 KB
references/ audit-checklist, env-mapping, project-types, static-sites, custom-domain, agents,
            targets/ (vercel, railway, render, netlify, cloudflare-pages, github-pages, docker-vps, cloudflared-tunnel)
scripts/ audit.py 34 KB, static_check.py 28 KB, env_extract.py, package_skill.py, sync_cowork_plugin.py
assets/templates/ Dockerfile.node, Dockerfile.python, docker-compose, .env.example.template
tests/ test_audit.py, test_env_extract.py, validate_skill.py · cowork-plugin/ (variante para Cowork)
```

### Arquitectura
- **8 reglas duras** como contrato: nunca suavizar la auditoría (si un check no corre, eso bloquea), nunca prod sin preview verde con 2xx/3xx, nunca imprimir secretos, **nunca auto-instalar ni auto-autenticar CLIs** (se le da al usuario el comando con `!`), nunca envolver CLIs ocultando flags, diff antes de cualquier cambio para pasar la auditoría, no desplegar con árbol sucio, "respetar el *espera*".
- Fases 0.0 → 6: clase de proyecto (app/static, detectada no preguntada) → prerequisitos → sembrado de permisos → detectar → **auditoría** (`audit.py`: secretos en archivos trackeados, .gitignore, lockfile, .env.example completo vía extracción de env usadas, start/build, binding de puerto, árbol limpio, remoto, `npm audit`/`pip-audit`) → selección de target con rúbrica → CLI autenticada → preview → health check (incluye probar la primera hoja de estilos para detectar errores de mayúsculas) → prod → verificación + rollback visible.
- Escaneo de historial git sugerido como paso del usuario (no reescribe historia).

### Encadenamiento
Encaja como "fase de deploy" del blueprint: el blueprint ya conoce target, env vars y health endpoint → all-deploy puede saltarse detección y selección.

### ADOPTAR / MEJORAR
- ADOPTAR: reglas duras numeradas; preview→health→prod; "si el chequeo no puede correr, bloquea"; no autenticar por el usuario; extracción de env usadas vs `.env.example`.
- MEJORAR: smoke tests funcionales (no solo HTTP 200), migraciones de BD ordenadas antes de promover, observabilidad post-deploy (errores de runtime 10 min), presupuesto de rendimiento.

---

## 8. claude-db — experto multi-paradigma de BD (21★)

**Propósito.** Diseñar esquema (con selección de motor), auditar en dos ejes (Diseño & Integridad / Rendimiento & Escala) y migrar de forma segura. SQL, documento, KV, vector, series temporales, grafo; offline.
**Licencia:** MIT. **Último commit:** 2026-06-16. Es el **prototipo** del kit que luego usa claude-seo-ai.

### Árbol (resumen)
```
skills/ (37): 10 comandos (start, design, audit, explain, migrate, fix, next, score, seed, checklist)
              + db-orchestrator + introspect + stack-detect + 23 módulos M0–M22 (keys, normalization, constraints,
              indexing, index-hygiene, query-patterns, concurrency, pooling, multitenancy, security-access,
              migration-safety, partitioning, temporal-history, types-precision, …)
agents/ (6): 5 auditores read-only (schema-integrity, performance-scale, migration-safety, nosql-paradigm, specialized-platform) + db-migration-writer
scripts/ detect-stack, parse-schema (+ parse-orm-python), lint-antipatterns, lint-migration, lint-missing-fk-index,
         schema-diff, gen-diagram, gen-seed, score, guard-sql, guard-write (zero-deps)
references/ scoring-model, engine-selection-tree, migration-safety, antipattern-catalog, data-tiers, platforms-2026, render-contract…
hooks: guard-write (Write/Edit), guard-sql (Bash y **mcp__.***)
```

### Arquitectura y decisiones destacables
- **Reglas de desarrollo del propio plugin:** límites de líneas (comando <500, módulo ≤120, referencia ≤200), frontmatter canónico, scripts sin dependencias que degradan con `needs_api` en vez de romper.
- **Introspección en vivo segura:** sesión `default_transaction_read_only=on` + `statement_timeout`, solo SELECT/EXPLAIN/catálogo, reforzado con hook que también intercepta **herramientas MCP** (p. ej. un MCP de Supabase).
- **Puntuación con "severity gating":** un fallo sev-5 *establecido* topa el eje en F; confianza `established / directional / speculative` (lo especulativo nunca topa); perfiles de pesos por paradigma.
- **Honestidad:** prohíbe inventar latencias, tamaños, precios o fechas EOL; magnitudes en bandas.
- M0 (selección de motor) es asesoría, no puntúa.

### ADOPTAR / MEJORAR
- ADOPTAR: guard-sql sobre MCP, severity gating + niveles de confianza, perfiles por paradigma, límites de tamaño de skills, `next` (siguiente acción más pequeña).
- MEJORAR: auditar RLS/políticas de Supabase contra casos de prueba (no solo estático), generar tests de migración (up/down en BD efímera).

---

## 9. Patrones transversales (la "gramática" del autor)

1. **Programa-en-prompts por capas:** CLAUDE.md corto (siempre cargado) → mapa/orquestador → archivos de fase o módulos cargados bajo demanda → referencias. Evolución clara desde CLAUDE.md monolíticos a carga progresiva.
2. **Determinismo donde importa:** scripts/motores puros para medir, rankear, validar y puntuar; el LLM interpreta y redacta.
3. **Kit de auditor reutilizable** (claude-db → claude-seo-ai): finding JSON Schema · subagentes read-only en paralelo con envelope · merge/dedupe validado · dos puntuaciones nunca mezcladas · `needs_api` explícito · fixer `disable-model-invocation` + único escritor + dry-run + tickets + backups + rollback · runs persistidos + compare + CI.
4. **Guardias por hooks** como defensa en profundidad (deny rutas protegidas, ask fuera de raíz, nunca "allow"); en pagokit, validadores de dominio con códigos y escape hatch auditable.
5. **Honestidad operacional:** fechas de verificación de datos, "construible vs asesoría", modo degradado etiquetado, prohibición de cifras inventadas.
6. **Bilingüe ES/EN** real (docs espejo), voz cercana, decisiones mínimas para el usuario y "una pregunta a la vez".
7. **Confirmación antes de efectos externos:** render, deploy a prod, publicar, escribir CRM/agenda (modo borrador), aplicar fixes.
8. **Auto-auditoría del repo-plantilla** (agentkit `audit.py`, pagokit `self-audit.js`, closer compuerta 23 chequeos): se testea el "programa" en sí.
9. **Distribución:** plugins con marketplace (`/plugin marketplace add Hainrixz/...`), `userConfig` con campos `sensitive`, GitHub Action.

## 10. Huecos del ecosistema completo (oportunidad para un producto propio)

| Área | Cubierto por Hainrixz | Lo que falta |
|---|---|---|
| Frontend | webkit (landing), the-architect (plan) | Apps con estado/rutas/auth en UI; design system propio persistente; i18n multi-ruta; componentes con tests |
| Backend/API | agentkit (FastAPI vertical), pagokit (endpoints de pago) | Constructor genérico de API (contratos OpenAPI primero, validación, rate limiting, versionado, jobs/colas) |
| Datos | claude-db (diseño/auditoría/migración) | Pruebas de RLS por rol, seeds coherentes con contratos, backups/restore verificados |
| Seguridad | cyber-neo (estático), pagokit (pagos), guardias de seo/db | Threat model por capability; DAST en preview; headers/CSP/CORS; policy packs por dominio en hooks y CI |
| Testing | piezas sueltas (fixtures closer, screenshots webkit) | Estrategia de test generada por paso (unit/integration/e2e), contract tests, cobertura mínima como gate |
| Deploy | all-deploy, sandbox Vercel | Migraciones antes de promover, smoke funcional, observabilidad y alertas, rollback de BD |
| Accesibilidad | checklists manuales | axe/pa11y automatizado + teclado + lector de pantalla como gate |
| Rendimiento | reglas React, CWV vía PSI | Presupuestos (bundle, LCP, p95 API) verificados en CI |
| Orquestación | cada kit vive aislado | **Un "conductor" que lea el blueprint y llame al kit correcto en el paso correcto con el spec ya resuelto**, y un estado de proyecto único compartido |

## 11. Recomendaciones para el producto propio (diseño original, no copia)

**Adoptar (como principios):**
- Carga progresiva: archivo raíz mínimo + mapa + un archivo por fase; cada paso con *objetivo / comando / evidencia esperada / qué hacer si falla*.
- Un **contrato de proyecto único** (p. ej. `proyecto.json`: shape, stack, capabilities, versiones fijadas, decisiones, supuestos, estado de fase) que todos los módulos leen y nadie re-pregunta.
- Motor común de auditoría (schema de hallazgos, ejes no mezclados, confianza, `needs_api`, compare) reutilizado por módulos de seguridad, datos, a11y, perf, SEO.
- Escritura con un solo agente escritor; fixers opt-in; hooks guardianes y "policy packs" por capability (pagos, auth, uploads, SQL) con códigos de error y excepciones registradas.
- Gates deterministas antes de cada transición (build, tests, auditorías) con evidencia guardada.
- Confirmación humana en efectos externos; secretos solo por entorno/userConfig, nunca en chat.
- Auto-test del propio producto (compilar bloques de código de las plantillas, validar referencias, evals de decisiones como hace claude-anatomy).

**Mejorar respecto a Hainrixz:**
- Integrar en vez de recomendar: el blueprint debe *invocar* módulos (pagos, deploy, auditorías) pasando el spec, no solo listarlos.
- Testing como ciudadano de primera: cada paso genera su test y la compuerta exige verde.
- Seguridad dinámica sobre preview y pruebas de autorización con datos reales de prueba (RLS por rol).
- Observabilidad y operación post-deploy incluidas en "terminado".
- Versionado de dependencias vía registry con fecha de verificación (no vendorizar skills de terceros).
- Licencia y atribución claras desde el día 1; marca propia (no usar nombres ni textos de Tododeia).
