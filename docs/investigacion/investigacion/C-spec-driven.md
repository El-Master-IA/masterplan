# C — Ingeniería inversa comparativa: herramientas spec-driven para agentes de código

Fecha: 2026-10-23 · Fuentes: clones `--depth 1` en `C:/tmp/arq-src/` (spec-kit, BMAD-METHOD v7 preview, OpenSpec, cc-sdd, agent-os v3, superpowers v7.0.1) + docs públicas de Kiro (kiro.dev/docs/specs, steering, correctness). Referencia base: the-architect (`C:/tmp/ta-src/the-architect`). No se ejecutó código.

---

## 1. GitHub spec-kit

**Arquitectura de prompts.** CLI Python (`specify`) que instala plantillas de comandos para ~20 agentes. Núcleo en `templates/commands/`: `constitution`, `specify`, `clarify`, `plan`, `tasks`, `analyze`, `checklist`, `implement`, `converge`, `taskstoissues`. Plantillas de artefactos en `templates/` (spec, plan, tasks, checklist, constitution). Scripts bash/PowerShell/Python (`check-prerequisites`, `create-new-feature`, `setup-plan`) que devuelven JSON con rutas, para que el prompt no adivine el estado. Encima: sistema de **extensiones** (183 en el catálogo comunitario), **presets** (42), **bundles** y un motor de **workflows YAML** con pasos, gates humanos (`approve/reject`) y reanudación persistida. Hooks `before_*/after_*` en `.specify/extensions.yml` (obligatorios u opcionales).

**Fases y artefactos.** `memory/constitution.md` (principios versionados con semver y fecha de ratificación) → `specs/NNN-slug/spec.md` (historias priorizadas P1/P2/P3 *independientemente testeables*, FR-xxx, entidades, SC-xxx medibles y agnósticos de tecnología, supuestos) → `clarify` (escaneo de 10 categorías de ambigüedad, máx. 5 preguntas, una a la vez, con opción recomendada; respuestas se escriben en `## Clarifications / Session fecha`) → `plan.md` + `research.md` (Decision/Rationale/Alternatives) + `data-model.md` + `contracts/` + `quickstart.md` → `tasks.md` (Setup → Foundational → una fase por historia, `[P]` paralelo, `[US1]`) → `analyze` (consistencia cruzada, solo lectura) → `implement` → `converge` (compara código vs. intención y *añade* tareas faltantes; append-only).

**Estado entre sesiones.** Todo en archivos: `.specify/feature.json` apunta a la feature activa; numeración secuencial o timestamp; la rama git es opcional (hook). Workflows YAML guardan transiciones para reanudar.

**Verificación.** Tres capas: (1) checklist de calidad de la spec autogenerado (`checklists/requirements.md`); (2) `/checklist` = "tests unitarios para el inglés" por dominio (`ux.md`, `security.md`, `api.md`…) que validan la *redacción de requisitos*, no el código, y `implement` se detiene si quedan ítems sin marcar; (3) `analyze` con severidades (violar un MUST de la constitución = CRITICAL automático) y % de cobertura requisito→tarea. `converge` cierra el ciclo código↔spec.

**Fortalezas.** Constitución como ley con "Complexity Tracking" (toda violación se justifica en tabla); límite de 3 `[NEEDS CLARIFICATION]` en specify y 5 preguntas en clarify; separación estricta qué/cómo; checklists por dominio; ecosistema enorme; multiplataforma real (sh/ps/py); neutral en agentes.

**Debilidades.** Centrado en *feature*, no en producto completo: no hay entrevista de producto ni arquitectura de sistema greenfield (la "Technical Context" es una lista de 9 campos). El árbol de proyecto es una plantilla de 3 opciones (single/web/mobile). Tests opcionales por defecto. Sin estrategia de deploy en el núcleo. La reconciliación spec↔código tras la entrega es responsabilidad del equipo (documentan 3 modelos de persistencia pero no eligen). Prompts largos y burocráticos (hooks repetidos en cada comando).

**Por dimensión.**
- *Frontend/UX*: solo la categoría "Interaction & UX Flow" de clarify (journeys, estados error/vacío/carga, a11y/i18n) y el checklist `ux.md`. Sin design system ni tokens.
- *Datos*: `data-model.md` (entidades, campos, relaciones, validaciones, transiciones de estado). Bueno pero sin migraciones/índices.
- *APIs*: `contracts/` (OpenAPI/esquemas según tipo de proyecto) + guía "contract-driven development".
- *Seguridad*: categoría de clarify + checklist `security.md`; extensiones comunitarias (AttackTree, etc.). No hay threat model nativo.
- *Testing*: tests opcionales; carpetas contract/integration/unit sugeridas; TDD solo si la constitución lo exige.
- *Deploy*: ausente en el núcleo (solo ignore files en implement).

---

## 2. BMAD-METHOD (v7 "preview alpha")

**Arquitectura de prompts.** Reescrito como **skills** (`skills/bmad-*`), cada una con `SKILL.md`, `customize.toml` (configurable por org: pasos de activación, `persistent_facts`, reviewers, handoffs externos), `assets/` (plantillas, ejemplos), `references/` y `scripts/` Python (`memlog.py`, `resolve_customization.py`, `lint_spine.py`). Un skill orquestador `bmad` responde "qué sigue" leyendo la ayuda de los módulos instalados. Personas: Mary (analyst), PM, Winston (architect), Sally (UX), Sofia (PO), dev. Utilidades: `party-mode` (varios agentes debaten), `advanced-elicitation` (catálogo CSV de métodos), `forge-idea`, `prfaq`, `deep-recon`, `retrospective`, `eval`.

**Fases y artefactos.** Brief / PRFAQ → **PRD** (plantilla con "Essential Spine" — visión, JTBD, journeys, glosario, FR por feature, non-goals, MVP in/out, métricas, preguntas, índice de supuestos — más un *Adapt-In Menu* por tipo de producto: consumer, enterprise, regulado, developer product, embebido) → **UX** (dos contratos: `DESIGN.md` con tokens YAML según el spec de Google Labs y `EXPERIENCE.md` con IA, voz, patrones, estados, interacción, piso de accesibilidad, flows con protagonista nombrado) → **Architecture spine** (paradigma nombrado, invariantes `AD-n` con Binds/Prevents/Rule, convenciones, stack versionado verificado en web, seed estructural en mermaid, mapa capacidad→arquitectura, Deferred) → Sofia (PO) corta initiative→epics→stories como **tickets** (repo, GitHub, Jira, Linear, Notion, Trello) → `bmad-build` (clarify&route → plan → implement → review → present).

**Estado entre sesiones.** El **memlog** (`.memlog.md`, append-only vía script) es la memoria canónica: cada decisión/constraint/versión/supuesto/pregunta es una línea; el documento final se *destila* del memlog al terminar. Reanudar = recargar memlog. "Initiative activa" en config. **Altitud jerárquica**: un spine de epic hereda los AD del spine padre como invariantes de solo lectura; contradecirlos es un conflicto a reportar.

**Verificación.** Reviewer Gate: lint determinista (`lint_spine.py`) + "rubric walker" + lentes en subagentes paralelos (adversarial, edge-case hunter, verification-gap, estructura, prosa); paso de **reconciliación de inputs** (un subagente por documento de entrada busca requisitos "silenciosos" que se perdieron). En build: estándar "Ready for Development" (cada tarea con ruta y acción, ACs Given/When/Then, sin TBD), alcance 900–1600 tokens por plan, revisión del diff por lentes, `claims-check` y `deletion-check`. Reportes HTML.

**Fortalezas.** La mejor teoría de *qué va en una arquitectura*: "fija algo solo si dos unidades construidas por separado podrían elegir incompatiblemente, no es obvio y es un trade-off real" — evita documentos inflados. Modo Coaching vs. Fast con `[ASSUMPTION]`. Recomendar un starter conocido (verificado en web) para greenfield. El tratamiento de UX es el más serio de todos. Herencia de invariantes por altitud. Integración con gestores de tickets reales.

**Debilidades.** Complejo de instalar (requiere `uv`, Python, `_bmad/`); muchos personajes y skills: curva alta. v7 está en alfa (cambia rápido). Seguridad y deploy no tienen skill propio (solo lentes y secciones opcionales del PRD/spine). Testing serio vive en un módulo aparte (Test Architect, enterprise). Consume muchos tokens (subagentes paralelos por gate).

**Por dimensión.**
- *Frontend/UX*: **referente**. DESIGN.md (tokens: colors, typography, rounded, spacing, components; secciones en orden fijo) + EXPERIENCE.md; herencia del UI system (shadcn/MUI/Compose) especificando solo el delta; herramientas creativas (temas de color HTML, direcciones de diseño, wireframes Excalidraw, mocks HTML de pantallas clave); "surface closure" (toda necesidad tiene pantalla y toda pantalla un journey); revisión de cobertura de mocks; handoff a herramientas de diseño externas.
- *Datos*: ERD de nombres y relaciones en el seed; "quién es dueño de datos compartidos" como invariante. Sin detalle físico (lo deja al código).
- *APIs*: convenciones de formatos (ids, fechas, error shapes, envelopes) y contratos públicos en el Adapt-In de developer products.
- *Seguridad*: NFRs transversales, Constraints & Guardrails (safety/privacy/cost), compliance (HIPAA, PCI, GDPR, SOC2, WCAG) en el PRD; auth como concern transversal en convenciones. Sin threat model.
- *Testing*: ACs Given/When/Then; `qa-generate-e2e-tests` para features ya hechas; lente verification-gap.
- *Deploy*: el spine exige no dejar "en silencio" el sobre operacional (entornos, infra/provider, operaciones) — se decide, difiere o queda como pregunta. Sin runbook ni pipeline.

---

## 3. OpenSpec (Fission-AI)

**Arquitectura de prompts.** CLI TypeScript (`openspec`) + skills/comandos `/opsx:*` para ~25 herramientas: `explore`, `propose`, `new`, `continue`, `ff` (fast-forward), `apply`, `verify`, `sync`, `archive`, `bulk-archive`, `onboard`. El flujo está definido por un **schema YAML** (`schemas/spec-driven/schema.yaml`): grafo de artefactos (`proposal` → `specs` → `design` → `tasks`) con `requires`, plantilla e instrucción por artefacto. El CLI entrega instrucciones en JSON (`openspec instructions <artifact> --json`) y valida (`openspec validate --strict`). Schemas personalizables (puedes definir tu propio flujo). `config.yaml` del proyecto con `context` (stack, idioma de producto) y `rules` por artefacto.

**Fases y artefactos.** `openspec/specs/<capability>/spec.md` = **verdad viva** del comportamiento actual (Purpose + Requirements con SHALL/MUST + `#### Scenario` WHEN/THEN). Cada cambio es una carpeta `openspec/changes/<id>/` con `proposal.md` (Why, What Changes con **BREAKING**, Capabilities nuevas/modificadas, Impact), **delta specs** (`## ADDED / MODIFIED / REMOVED / RENAMED Requirements`; REMOVED exige Reason y Migration), `design.md` opcional (solo si es transversal, nueva dependencia, cambio de datos, seguridad/performance/migración), `tasks.md`. `archive` fusiona los deltas en las specs vivas y mueve el cambio a `changes/archive/fecha-id/`. Extras: stores (repos de specs independientes, multi-repo), initiatives, explorations.

**Estado entre sesiones.** El sistema de archivos es el estado: cambios activos vs. archivados; `openspec status --json` dice qué artefactos existen y qué sigue. No toca git (decisión explícita para encajar en cualquier flujo de PR).

**Verificación.** Validador determinista (formato de requisitos/escenarios, longitud ≤500 caracteres por requisito, Purpose ≥50 caracteres, un cambio sin deltas falla salvo `skip_specs: true`). `verify` reporta en tres dimensiones — **Completeness** (tareas, cobertura de spec), **Correctness** (cada requisito/escenario rastreado al código), **Coherence** (adherencia al design, consistencia de patrones) — con CRITICAL/WARNING/SUGGESTION y marcas honestas de "Not verified / Not applicable".

**Fortalezas.** El único con **specs vivas + deltas** de verdad: el repositorio siempre sabe cómo se comporta el sistema *hoy*, y cada cambio es un diff semántico revisable. Brownfield-first. Ligero y fluido (no hay fases rígidas; `ff` para lo obvio). Validación mecánica por CLI. Regla excelente: "si la implementación puede cambiar sin cambiar el comportamiento visible, no va en la spec". Preguntas abiertas solo si son *diferibles*; si cambian el enfoque, se preguntan ya.

**Debilidades.** No hace descubrimiento de producto ni arquitectura de sistema: asume que ya existe un sistema y se cambian capacidades. Sin constitución/estándares fuertes (solo `context` + `rules`). `design.md` es mínimo (Context, Goals, Decisions, Risks, Migration). Nada de UX/design system. Testing/deploy no son artefactos.

**Por dimensión.** *Frontend*: solo como comportamiento observable en escenarios. *Datos*: "significant data model changes" disparan design.md. *APIs*: requisitos de inputs/outputs/errores; BREAKING marcado. *Seguridad*: "external constraints" en specs; disparador de design. *Testing*: escenarios WHEN/THEN = base de tests, pero no genera estrategia. *Deploy*: Migration Plan + rollback dentro de design.

---

## 4. cc-sdd (gotalab) y Kiro specs

**Arquitectura de prompts (cc-sdd).** Instalador npm que genera el flujo de Kiro para 19 agentes (Claude Code como comandos, skills o subagentes). Skills: `kiro-discovery` (punto de entrada: decide si extender spec, crear nueva, descomponer o no hacer spec; escribe `steering/roadmap.md`), `kiro-steering` / `kiro-steering-custom`, `kiro-spec-init/requirements/design/tasks`, `kiro-spec-quick`, `kiro-spec-batch`, `kiro-validate-gap` (brownfield), `kiro-validate-design`, `kiro-impl`, `kiro-validate-impl`, `kiro-verify-completion`, `kiro-review`, `kiro-debug`, `kiro-spec-status`. Reglas en `.kiro/settings/rules/` (EARS, design principles, discovery full/light, **review gates** de requisitos y diseño, generación de tareas, análisis de paralelismo, gap analysis).

**Fases y artefactos.** *Steering* (memoria de proyecto): `product.md`, `tech.md`, `structure.md` + custom (`api-standards`, `authentication`, `database`, `deployment`, `error-handling`, `security`, `testing`). *Spec*: `.kiro/specs/<feature>/` con `spec.json` (fase, aprobaciones por artefacto, `ready_for_implementation`, idioma), `requirements.md` (EARS: When/While/If/Where/The system shall, con IDs numéricos), `research.md`, `design.md` (muy completo: boundary map, stack, **File Structure Plan con rutas concretas**, flujos, **trazabilidad requisito→componente**, contratos de servicio/API/eventos/batch/estado, modelos de dominio/lógico/físico, contratos de datos, estrategia de errores y monitoreo, estrategia de testing, seguridad/performance/migración opcionales), `tasks.md` (Foundation → Core → Integration → Validation; anotaciones `_Depends:_`, `_Boundary:_`, `_Blocked:_`, `(P)`).

**Estado.** `spec.json` como máquina de estados con aprobaciones humanas explícitas por fase; `roadmap.md` restaura contexto multi-spec; `tasks.md` re-leído en cada iteración.

**Verificación.** Gates antes de escribir el artefacto: chequeos mecánicos (cada ID de requisito aparece en el diseño; File Structure Plan sin TBD; ningún componente huérfano sin archivo) + revisión de juicio, máx. 2 pasadas de reparación antes de escalar a "hueco real de spec" (vuelve a requisitos, no inventa). `kiro-impl`: TDD obligatorio, **un subagente fresco por tarea** + revisor independiente + commit; descubre comandos reales del repo (`TEST/BUILD/SMOKE_COMMANDS`) desde manifests y CI; smoke test de "liveness" según forma de app. `kiro-validate-impl`: GO/NO-GO de integración, violaciones de boundary entre tareas, suite completa.

**Kiro (producto AWS).** Mismo trípode requirements/bugfix → design → tasks, variantes *Requirements-First* y *Design-First*, *Quick Spec* sin gates, *Analyze Requirements* (inconsistencias antes del diseño), **bugfix specs** (comportamiento actual / esperado / *sin cambios*), ejecución de tareas en **olas** según grafo de dependencias, revisión con comentarios en el Markdown, steering workspace/global/**team** con modos de inclusión, hooks de eventos del IDE, y **Correctness**: extrae propiedades de los requisitos EARS y las verifica con **property-based testing** (con shrinking).

**Fortalezas.** El diseño técnico más exhaustivo y trazable; gates mecánicos antes de escribir; EARS como formato; steering custom ya cubre security/deployment/testing/database/API; aprobaciones por fase en JSON; TDD + subagente-por-tarea; PBT (Kiro). Multilenguaje (EARS con keywords en inglés y contenido localizado).

**Debilidades.** Feature-céntrico (el producto entero solo vía roadmap de discovery). UX limitado a "usar skills locales de diseño/a11y si existen". Steering de seguridad/deploy son *plantillas de estándares*, no decisiones guiadas por entrevista. Kiro es un IDE propietario; cc-sdd depende de que el usuario entienda el modelo Kiro.

---

## 5. Agent OS v3 (Builder Methods)

**Arquitectura.** Mínimo: 5 comandos (`plan-product`, `shape-spec`, `discover-standards`, `index-standards`, `inject-standards`), perfiles con herencia (`profiles/default/global/tech-stack.md`), scripts de instalación/sincronización. v3 abandonó los subagentes y specs pesadas de v1/v2 en favor de "estándares + plan mode".

**Fases y artefactos.** `agent-os/product/` (`mission.md`, `roadmap.md`, `tech-stack.md`) vía conversación. `agent-os/standards/` (por carpeta: api, database, frontend…) con `index.yml` para descubrimiento; `discover-standards` **extrae convenciones del código existente** preguntando el porqué de cada una. `shape-spec` corre **en plan mode** de Claude Code: aclara alcance, pide visuales, pide implementaciones de referencia en el repo, verifica alineación con producto, sugiere estándares aplicables y arma un plan cuya **Task 1 es siempre "guardar la documentación del spec"** (`plan.md`, `shape.md`, `standards.md`, `references.md`, `visuals/`).

**Estado.** Carpetas fechadas por spec; estándares como memoria duradera; perfiles reutilizables entre proyectos.

**Verificación.** Prácticamente ninguna propia (delega en el plan mode y en el humano).

**Fortalezas.** Los estándares como activo de primera clase, indexados e inyectados *solo cuando aplican* (economía de contexto); descubrir estándares desde el código; perfiles heredables (útil para una agencia o un equipo con varios productos); "Task 1 = persistir el shaping" (truco simple que sobrevive a la compactación); referencias a código similar.

**Debilidades.** Sin requisitos formales, sin diseño técnico, sin gates, sin tests ni verificación. Frontend/datos/API/seguridad/deploy existen solo si el usuario escribe estándares para ellos.

---

## 6. Superpowers (obra) v7

**Arquitectura.** Plugin multi-host de **skills de proceso** con hook `session-start` que inyecta `using-superpowers` (obliga a revisar skills aplicables antes de actuar). Skills: `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting/receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `dispatching-parallel-agents`, `writing-skills`. Tiene tests de comportamiento de los skills por host.

**Fases y artefactos.** Brainstorming (mirar antes de preguntar; una pregunta por mensaje, abierta, en el lenguaje del usuario; diseñar 2–3 enfoques y que el humano elija; "visual companion" en navegador para mostrar opciones; spike con permiso) → design doc en `docs/superpowers/specs/AAAA-MM-DD-tema-design.md`, aprobado y commiteado → `writing-plans` (`docs/superpowers/plans/…`: cabecera con Goal/Architecture/Tech Stack/Spec, **Global Constraints** copiadas literal, **Review Focus** = las 5 entradas que la spec no menciona pero que más probablemente romperán al usuario, cada una con su test; tareas con archivos exactos, interfaces consumidas/producidas, pasos de 2–5 min red→green→commit) → ejecución con worktree, subagente por tarea, revisión spec+calidad por tarea y revisión final de rama → finishing (merge/PR/limpieza).

**Estado.** Archivos de spec/plan con checkboxes + "ledger" del plan; worktrees; skills diseñados para sobrevivir a la compactación.

**Verificación.** La más estricta en *disciplina*: "Iron Law" — ninguna afirmación de éxito sin evidencia fresca (comando ejecutado en este mensaje, salida leída, exit code); tabla afirmación→evidencia requerida; señales de alarma ("debería", "perfecto", confiar en el reporte de un subagente). TDD con borrado del código escrito antes del test.

**Fortalezas.** Psicología de la entrevista (la mejor); planes ejecutables por un ingeniero "sin contexto"; Review Focus; verificación por evidencia; worktrees; debug sistemático.

**Debilidades.** Sin conocimiento de dominio de arquitectura: no tiene catálogo de stacks, datos, seguridad, UX ni deploy; todo depende del criterio del modelo en el brainstorming. Documento de diseño libre (sin plantilla de secciones técnicas). Feature/proyecto pequeño-mediano.

---

## 7. Matriz comparativa

Leyenda: ●●● fuerte · ●● medio · ● mínimo · — ausente.

| Capacidad | spec-kit | BMAD v7 | OpenSpec | cc-sdd / Kiro | Agent OS | Superpowers | the-architect |
|---|---|---|---|---|---|---|---|
| Entrevista / descubrimiento de producto | ● (specify desde 1 frase) | ●●● (brief, PRFAQ, elicitación, coaching) | ● (explore) | ●● (discovery + roadmap) | ●● (plan-product) | ●●● (brainstorming, 1 pregunta/turno) | ●●● (DISCOVERY→DEEP DIVE) |
| Clarificación con gates | ●●● (≤3 marcadores, ≤5 preguntas con recomendación) | ●● (`[ASSUMPTION]`, triage de bloqueantes) | ●● (open questions solo diferibles) | ●● (gate de requisitos, Analyze) | ● | ●● | ●●● (`[NEEDS CLARIFICATION]` + pre-mortem) |
| Principios / constitución / estándares | ●●● (constitución versionada, gates) | ●● (persistent_facts, project-context) | ● (config context/rules) | ●●● (steering + custom) | ●●● (standards indexados, perfiles) | ● | ●● |
| Arquitectura de sistema greenfield | ● | ●●● (spine, paradigma, starter verificado) | — | ●● (design por feature) | ● (tech-stack) | ● | ●●● (14 shapes × 5 tracks) |
| Frontend / UX spec / design system | ● (taxonomía + checklist ux) | ●●● (DESIGN.md + EXPERIENCE.md, mocks) | ● | ● | ● (visuales) | ●● (visual companion) | ●● (capabilities frontend/styling/a11y) |
| Modelo de datos | ●● (data-model.md) | ●● (ERD seed, ownership) | ● | ●●● (dominio/lógico/físico + contratos) | ● | ● | ●● |
| APIs / contratos | ●●● (contracts/) | ●● (convenciones de envelope/errores) | ●● (I/O/errores, BREAKING) | ●●● (API/evento/batch/estado) | ● (estándares) | ● (interfaces por tarea) | ●● (api-design) |
| Seguridad | ●● (categoría + checklist) | ●● (NFR, compliance menu) | ● | ●● (steering security/auth) | ● | ● | ●● (capabilities + validator) |
| Testing | ● (opcional) | ●● (G/W/T, e2e skill, módulo TEA) | ●● (escenarios WHEN/THEN) | ●●● (TDD, smoke, PBT en Kiro) | — | ●●● (TDD estricto) | ●● (verify por paso) |
| Deploy / operaciones | — | ●● (sobre operacional obligatorio en spine) | ● (migration/rollback) | ●● (steering deployment) | — | ● (finishing branch) | ●● (runtime tracks) |
| Specs vivas / deltas de cambio | ● (converge append-only) | ●● (update con AD estables) | ●●● (deltas + archive) | ●● (extender spec existente) | — | — | ● |
| Trazabilidad requisito→diseño→tarea | ●●● (analyze, cobertura %) | ●● (capability map, reconcile) | ●● (verify correctness) | ●●● (IDs mecánicos, sin huérfanos) | — | ●● (Spec en cabecera) | ●● |
| Descomposición de tareas / DAG | ●● (fases por historia, [P]) | ●● (tickets epic/story) | ● (checklist) | ●●● (Depends/Boundary, olas) | ● | ●● (tareas TDD) | ●●● (tasks.json DAG) |
| Ejecución con subagentes + review | ● (implement lineal) | ●●● (lentes paralelos) | ● | ●●● (subagente por tarea + revisor) | — | ●●● (por tarea + final) | ●● (writer/validator) |
| Verificación de "hecho" con evidencia | ●● (checklists gate) | ●●● (claims/deletion check) | ●●● (3 dimensiones) | ●●● (GO/NO-GO) | — | ●●● (Iron Law) | ●●● (verify + git tag) |
| Estado / reanudación entre sesiones | ●● (feature.json, workflows) | ●●● (memlog append-only) | ●●● (filesystem + status JSON) | ●●● (spec.json aprobaciones) | ●● (Task 1 persiste) | ●● (ledger) | ●●● (/architect-next) |
| Brownfield | ●● (guías, extensiones) | ●●● (ratificar convenciones) | ●●● (diseñado para eso) | ●●● (gap analysis) | ●●● (discover-standards) | ●● (look before ask) | ●● (architect-brownfield) |
| Validación determinista (scripts/CLI) | ●● (scripts de rutas) | ●● (lint_spine.py) | ●●● (validate --strict) | ● | — | ● (tests de skills) | ● |
| Extensibilidad / ecosistema | ●●● (183 ext., presets, workflows) | ●●● (módulos, customize.toml) | ●● (schemas custom) | ●● (19 agentes) | ●● (perfiles) | ●● (multi-host) | ● |
| Costo / simplicidad | ●● | ● (pesado) | ●●● (ligero) | ●● | ●●● | ●● | ●● |

---

## 8. Lo mejor de cada uno — lista priorizada para un producto propio

1. **Specs vivas + deltas (OpenSpec).** Tras construir, el blueprint no debe pudrirse: `specs/<capability>` como verdad actual y cada cambio como carpeta con ADDED/MODIFIED/REMOVED(+Reason/Migration)/RENAMED, archivado al fusionar. Es lo que convierte un "arquitecto de arranque" en un compañero del ciclo de vida completo.
2. **Teoría del spine (BMAD) + decisiones con ID estable.** Fijar solo invariantes (Binds/Prevents/Rule), declarar Deferred, prohibir dimensiones en silencio (sobre todo deploy/operaciones), herencia por altitud (producto→feature→epic) y AD que nunca se renumeran. Recomendar un starter conocido verificado en la web.
3. **Memlog append-only como memoria canónica (BMAD).** Decisiones, supuestos, versiones y preguntas como líneas vía script; los documentos se *destilan* al final. Reanudación robusta y razonamiento separado del documento terso.
4. **UX como contrato doble (BMAD).** `DESIGN.md` (tokens, spec de Google Labs) + `EXPERIENCE.md` (IA, estados, interacción, a11y, flows con protagonista), heredando de shadcn/MUI y especificando solo el delta; "surface closure"; mocks HTML de pantallas clave.
5. **Diseño técnico trazable con gates mecánicos (cc-sdd/Kiro).** Plantilla de design con File Structure Plan concreto, contratos API/evento/batch/estado, modelo de datos dominio→lógico→físico, errores y monitoreo; antes de escribir: cada ID de requisito aparece, sin TBD, sin componentes huérfanos; máx. 2 pasadas y si no, volver a requisitos.
6. **EARS + property-based testing (Kiro).** Requisitos EARS → propiedades → PBT. Diferenciador fuerte para "bases sólidas".
7. **Evidencia antes de afirmar (Superpowers) + GO/NO-GO (cc-sdd) + 3 dimensiones (OpenSpec).** Descubrir los comandos reales TEST/BUILD/SMOKE del repo; ninguna tarea se cierra sin salida fresca; reporte Completeness/Correctness/Coherence con "Not verified" honesto.
8. **Psicología de entrevista (Superpowers).** Mirar antes de preguntar; una pregunta abierta por turno, en el vocabulario del usuario y diciendo *qué cambiaría* la respuesta; proponer 2–3 enfoques y que el humano elija; opción "solo hazlo".
9. **Clarificación acotada con recomendación (spec-kit).** Taxonomía de 10 categorías marcada Clear/Partial/Missing; máximo N preguntas priorizadas por impacto (alcance > seguridad > UX > técnica), cada una con "por qué importa" y opción recomendada aceptable con "sí".
10. **Constitución con Complexity Tracking + "tests unitarios para el inglés" (spec-kit).** Principios versionados que actúan como gate (violación = CRITICAL) y checklists por dominio (`security.md`, `ux.md`, `api.md`, `deploy.md`) que validan la *calidad de los requisitos* antes de construir.
11. **Plan ejecutable por alguien sin contexto (Superpowers) con Review Focus.** Global Constraints literales y las 5 entradas no especificadas más probables de romper, cada una con su test.
12. **Subagente fresco por tarea + revisor independiente + lentes paralelos (cc-sdd/Superpowers/BMAD),** con olas de paralelismo según el DAG (Kiro).
13. **Estándares indexados e inyectados bajo demanda + discover-standards desde el código + perfiles heredables (Agent OS).** Ideal para Alexander: un perfil "Kreoon/IA Master Tech" (React + Supabase + Vercel + Vitest) heredado por cada proyecto de cliente.
14. **Aprobaciones por fase en un JSON de estado (cc-sdd)** y **workflows con gates humanos reanudables (spec-kit).**
15. **Bugfix specs con "comportamiento que NO debe cambiar" (Kiro)** y **reconciliación de inputs** (BMAD: un subagente por documento fuente busca requisitos que se perdieron).
16. **Validador CLI determinista (OpenSpec `validate --strict`, BMAD `lint_spine.py`)** para que la calidad del artefacto no dependa solo del LLM.

---

## 9. Huecos que ninguno cubre bien (oportunidad de diferenciación)

1. **Seguridad como diseño, no como checklist.** Nadie hace threat modeling (STRIDE/abuse cases) ligado a requisitos, ni genera políticas concretas (RLS de Supabase por tabla y rol, matriz de autorización rol×recurso×acción, gestión de secretos por entorno) ni tests de seguridad que verifiquen esa matriz. Para un stack Supabase esto es crítico.
2. **Deploy y operaciones ejecutables.** Como máximo hay plantillas de estándares. Falta: definición de entornos (dev/preview/prod), variables por entorno, pipeline CI con gates, estrategia de migraciones de BD con rollback, observabilidad mínima (logs, errores, uptime), runbook y "primer deploy verificado" como hito del plan.
3. **Datos de punta a punta.** Nadie conecta el modelo lógico con migraciones versionadas, índices justificados por consultas, seed data, retención/PII y backups. cc-sdd llega a "modelo físico" pero sin migraciones ni verificación.
4. **Frontend más allá del documento.** BMAD especifica DESIGN/EXPERIENCE pero ninguno verifica la implementación contra los tokens, ni ejecuta pruebas visuales/a11y (axe, Lighthouse, Playwright) ni presupuestos de performance (Core Web Vitals, tamaño de bundle) como criterio de "hecho".
5. **Contratos API verificados.** Se escriben contratos, pero nadie genera/valida tests de contrato contra la API real ni detecta drift contrato↔código en CI.
6. **Detección de deriva continua.** Solo existen comandos manuales (converge, verify, validate-impl). Falta un hook/CI que en cada PR diga qué requisitos, AD o invariantes de UX tocó el cambio y si rompió alguno.
7. **Costos y límites de servicios.** Nadie modela costo mensual estimado, cuotas/rate limits de terceros (Supabase, Vercel, APIs de IA) ni su efecto en la arquitectura.
8. **Integraciones externas con modos de fallo.** Aparecen en la taxonomía de clarify, pero nadie produce un catálogo de integraciones con timeouts, reintentos, idempotencia, webhooks y pruebas con mocks.
9. **Usuario no experto.** Todos asumen un desarrollador. Ninguno adapta la profundidad (explicar trade-offs, glosario progresivo, "modo dueño de negocio") al perfil técnico detectado — clave para vibecoders y clientes de IA Master Tech.
10. **Métricas de producto conectadas al código.** Las Success Criteria/Metrics se escriben pero nunca se traducen en eventos de analítica instrumentados y verificados.
11. **Medición de la propia calidad del método.** Salvo los evals de BMAD y los tests de skills de Superpowers, nadie mide si sus artefactos producen mejor software (tasa de retrabajo, cobertura de requisitos, defectos tras deploy).

**Conclusión para el producto propio:** el espacio libre es un "arquitecto de ciclo de vida" que combine la entrevista de Superpowers, la clarificación acotada de spec-kit, el spine + memlog + UX doble de BMAD, el diseño trazable con gates mecánicos y EARS/PBT de Kiro/cc-sdd, las specs vivas con deltas de OpenSpec y los estándares por perfil de Agent OS, y que se diferencie cubriendo de verdad **seguridad (threat model → RLS/authz → tests), datos (migraciones + seed + retención), deploy/ops (entornos, CI, rollback, observabilidad) y verificación continua de deriva en CI**, todo ello con validación determinista por CLI.
