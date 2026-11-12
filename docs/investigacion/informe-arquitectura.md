# Arquitectura desde las bases — informe
*Ingeniería inversa de `Hainrixz/the-architect` + mapa verificado de repos, marcos, libros y cursos. Fecha: 23-oct-2026.*

## Resumen en 5 líneas
1. **the-architect** no "sabe" más arquitectura que un buen libro: su fuerza es un **proceso con puertas** (clasificar → profundizar → confirmar sin huecos → generar con verificación) y un **auditor implacable**.
2. Sus 4 ideas más valiosas y copiables: **Non-Goals**, **`[NEEDS CLARIFICATION]`**, **pre-mortem**, y **cada paso con criterio EARS + comando que sale con 0 + git tag**.
3. Le faltan: atributos de calidad explícitos, diagramas C4, modelado de amenazas, RPO/RTO y evolución. Eso lo cubren los libros/cursos de la Parte 2.
4. Para tu stack (React + Supabase + Vercel) su propia tabla recomienda la variante **"Lean SaaS"**: Supabase Auth como único dueño de sesión, nunca dos proveedores de identidad.
5. Ruta propuesta: 12 semanas, gratis primero, con un entregable real cada semana (Parte 4).

---

# Parte 1 — Ingeniería inversa de `Hainrixz/the-architect`

> Revisado sobre el commit `a25b09e` (2026-10-17), versión 2.6.0. Licencia MIT. ~561★ / 103 forks al 2026-10-23.
> Autor: Enrique Rocha (marketplace `soyenriquerocha`). 100% markdown + JSON: **no contiene código**, es un "programa" escrito en prompts.

## 1. Qué es en una frase
Un plugin de Claude Code que actúa como **consultor de arquitectura**: entrevista, decide el stack, y escribe un **blueprint** (plano) tan completo que otra sesión de Claude sin contexto puede construir el proyecto sin hacer preguntas. No escribe código de la app.

## 2. Anatomía del repo (~1,4 MB de markdown)

| Carpeta | Rol | Peso |
|---|---|---|
| `skills/architect/SKILL.md` + `CLAUDE.md` | Punto de entrada (modo plugin / modo clon). 12 reglas innegociables + **máquina de estados** | 15 KB c/u |
| `questions/phase-1..4` | **Única fuente** del guion de la entrevista (descubrimiento, profundización, confirmación, generación) | 18–60 KB |
| `knowledge/shapes/` (14) | *Qué es* el producto: SaaS, marketing site, mobile, API, internal tool, comunidad, agente, media generativa, e-commerce, CLI/librería/MCP, extensión, desktop, bot/automatización, pipeline de datos | 12–23 KB c/u |
| `knowledge/runtime-tracks/` (5) | *En qué se escribe*: ts-node, python, go, rails-laravel, mobile-native. **Únicos archivos con números de versión** | 15–29 KB |
| `knowledge/capabilities/` (18) | *Qué hace*: auth, database, api-design, payments, deployment, testing, observability, a11y, AI/LLM, agent-loop, credit-metering, realtime-voice, sync/collab, availability-engine (reservas), enterprise-readiness, frontend, state, styling | 11–21 KB |
| `knowledge/stack-compatibility.md` | Combinaciones **probadas** y **conocidas-malas** (escritas por *rol*, no por versión) + "reglas que expiraron" | 20 KB |
| `agents/` (3) | `stack-researcher` (verifica versiones en vivo), `blueprint-writer` (único autor), `blueprint-validator` (auditor de solo lectura con ~30 barridos y ~40 tipos de falla) | 18 / 114 / 159 KB |
| `templates/` | Blueprint de **20 secciones**, `tasks.json` (DAG), épicas, CLAUDE.md del proyecto destino | 127 KB la principal |
| `commands/` (6) | `/architect`, `-quick`, `-brownfield`, `-next`, `-refresh`, `-audit` | — |

Dato revelador: **el validador (159 KB) pesa más que todo lo demás junto en "conocimiento"**. La calidad del sistema no viene de "saber arquitectura", sino de **auditar sin piedad** lo que escribe.

## 3. El flujo (máquina de estados)

```
[nuevo]      DISCOVERY → DEEP DIVE → ARCHITECTURE →(usuario dice "sí")→ GENERATE → listo
[código existente]       BROWNFIELD ───────────────┘
```

| Estado | Qué hace | Puerta de salida |
|---|---|---|
| **Gate 0** | ¿Proyecto nuevo o existente? (cambia todo lo demás) | — |
| DISCOVERY | 2–3 preguntas: visión, audiencia, etapa (prototipo vs producción), restricciones, plazo. Clasifica en **1 shape** (máx. 2) | El usuario acepta la shape |
| DEEP DIVE | 3–5 preguntas propias de la shape. Elige runtime track + capabilities. Revisa compatibilidad | Track y cada capability decididos |
| ARCHITECTURE | Un solo mensaje de <40 líneas: tabla de stack con porqué, cómo encaja, **v1 incluye / v1 excluye**, fases, riesgos | **Gate A + Gate B + "sí" explícito** |
| GENERATE | 8 pasos: avisar duración (25–35 min), verificar versiones, decidir formato, escribir, validar en bucle, *smoke test* real (bootstrap 2 veces, paso 1, base de datos), escribir, entregar | Validador en PASS (0 BLOCKER, 0 MAJOR) |
| BROWNFIELD | Fase 0 "Repo Map": lee el código antes de preguntar. Pregunta solo el **delta**: qué debe ser verdad después, qué no puede romperse, qué está prohibido tocar | Entra a ARCHITECTURE |

## 4. Las 10 ideas de diseño que lo hacen funcionar

1. **Clasificar antes de diseñar (shapes).** Cada tipo de producto tiene su propio orden de construcción. El error más común que combate: *convertir una capability en una shape* ("tiene pagos" ≠ e-commerce; "usa IA" ≠ agent-app; "tiene login" ≠ SaaS).
2. **Preguntas desempatadoras de una sola línea.** Ej.: *"Si reemplazo cada llamada al modelo por una respuesta fija, ¿sigue habiendo producto?"* → agent-app vs SaaS. *"¿Las personas que lo usan trabajan para ti?"* → internal-tool vs SaaS. *"¿Sigue valiendo la pena si el dashboard fuera un CSV?"* → pipeline vs herramienta interna.
3. **Conocimiento en 3 ejes ortogonales** (shape × runtime × capability). Las versiones viven solo en un eje → cuando algo cambia se edita un archivo, no trece (la v1 se pudrió en 4 meses por eso).
4. **Nunca versiones de memoria.** Toda versión se verifica en el registro en vivo *en esa sesión* y lleva procedencia (paquete, versión, URL, fecha). Lo no verificado se marca "verify before install".
5. **Gate A — `[NEEDS CLARIFICATION]`** (tomado de spec-driven development / spec-kit). Cada hueco se cierra de 3 formas: *respondido*, *default confirmado* o *diferido como Non-Goal*. El silencio no es confirmación.
6. **Gate B — pre-mortem adversarial** en 8 ángulos (supuestos falsos, mercado, competencia, viabilidad, números a 10× y 0,1×, ejecución, obituario a 6 meses, punto ciego). Los sobrevivientes van a un **Risk Register** o a **Non-Goals**.
7. **Los Non-Goals son la mitad valiosa.** El validador falla el blueprint si la tabla de Non-Goals tiene menos de 5 filas: es la valla del alcance.
8. **Definición de terminado por paso**: `Do / Done when / Verify / Checkpoint`. Criterios en **EARS** (*WHEN … THE SYSTEM SHALL …*), comando que sale con 0, y `git tag step-NN-slug` como punto de rollback. Palabras prohibidas: "funciona", "se ve bien", "está implementado". Pasos de 2–6 criterios y máx. 5 archivos.
9. **Separación de roles con permisos mínimos**: el escritor no tiene shell, el validador solo lee, el hilo principal es el único que ejecuta. Un solo autor por bundle ("dos autores sin árbitro = bundle medio inconsistente").
10. **Memoria resistente a la compactación**: "running brief" de ≤10 líneas tras cada cambio de estado, porque Claude solo re-adjunta los primeros 5.000 tokens del skill.

## 5. Las 20 secciones del blueprint
1 Visión y Non-Goals · 2 Stack · 3 Estructura de carpetas · 4 Modelo de datos · 5 API · 6 Frontend · 7 Design system · 8 AuthN/AuthZ · **9 Orden de construcción** · 10 Entorno · 11 Dependencias (con procedencia) · 12 Despliegue · 13 Testing · 14 Seguridad y secretos · 15 Accesibilidad · 16 Observabilidad y **costo** (a 1× y 10×, "el precipicio") · 17 Enrutamiento de modelos · 18 Skills · 19 Workspace del agente (CLAUDE.md, AGENTS.md, settings) · 20 Gate global, riesgos y log de decisiones.

Todas aparecen siempre (las que no aplican dicen `NOT APPLICABLE — razón`), y una sección N/A **nunca** puede ser fuente de un contrato que otro paso use.

## 6. Ejemplo de conocimiento destilado (shape SaaS)
- **Primera bifurcación: tenencia.** Si existe *cualquier* posibilidad de equipos, empezar multi-tenant con una org personal auto-creada por registro (cuesta 1 tabla y 1 columna; reconvertir después = reescribir la capa de datos).
- Orden de 14 pasos: scaffold+CI → tokens/shell → DB+tenencia → auth → **guard de tenencia + test de aislamiento (org A recibe 404 al pedir un id de org B)** → CRUD → listado → miembros/invitaciones → billing (webhook idempotente) → gating de planes en servidor → settings/borrado → marketing → hardening → deploy.
- Trampas: autorización dispersa, confiar en el cliente para permisos, webhooks ingenuos, abstraer antes del 2.º feature, N+1 en el dashboard.
- Stack por defecto: framework React full-stack + Tailwind/shadcn + **Supabase solo como DB/storage** + **Clerk como único dueño de sesión** + Stripe + Vercel. Variante "Lean SaaS": **Supabase Auth en lugar de Clerk** (nunca los dos) + merchant-of-record. → *Tu stack (React + Supabase + Vercel) es exactamente la variante Lean.*

## 7. De dónde toma sus ideas
| Idea en the-architect | Origen reconocible |
|---|---|
| `[NEEDS CLARIFICATION]`, spec antes de código | **GitHub spec-kit** / spec-driven development (lo cita explícitamente) |
| EARS (*WHEN… THE SYSTEM SHALL…*) | Rolls-Royce, Mavin et al. 2009; popularizado por **AWS Kiro** |
| Pre-mortem | Gary Klein (HBR 2007) |
| Non-Goals | Design docs de Google ("goals / non-goals") |
| Decision Log | ADRs (Michael Nygard, 2011) |
| Done when + checkpoint por paso | Definition of Done (Scrum) + trunk-based / commits atómicos |
| Combinaciones conocidas-malas | "Architecture fitness functions" / lecciones aprendidas |
| Tenencia, webhooks idempotentes, pooling | Patrones SaaS (AWS SaaS Lens), *Release It!*, DDIA |

## 8. Lo que NO cubre (huecos a complementar con las fuentes de la Parte 2)
- **Atributos de calidad explícitos** (ISO 25010 / escenarios de calidad del SEI-ATAM): decide stack por shape, no por "qué cualidades importan más".
- **Diagramas** (C4, arc42): todo es texto y tablas; no hay vista de contexto/contenedores.
- **Modelado de amenazas** (STRIDE/OWASP ASVS): la §14 es una checklist, no un análisis de amenazas.
- **Continuidad**: no hay RPO/RTO, backups probados ni plan de desastre.
- **Evolución**: no hay *fitness functions* ni plan para cuando el monolito crezca (DDD estratégico, bounded contexts).
- **Organización**: nada de Ley de Conway / Team Topologies (normal: está pensado para un builder solo + agentes).
- **Privacidad/regulación** concreta (GDPR, Habeas Data Colombia Ley 1581): solo se pide "nombrar el régimen".

**Veredicto:** es una excelente **"lista de verificación ejecutable"** del *cómo construir v1 sin derivar*. No sustituye la formación en *por qué* se decide una arquitectura; para eso están los libros y cursos de la Parte 2.


---

# Parte 2 — Fuentes verificadas (consulta: 23-oct-2026)

✅ verificado en vivo · ◐ dato de memoria, casi seguro correcto · ⚠️ con reservas

## 2.1 Herramientas "hermanas" de the-architect (spec-driven development para agentes)

| Herramienta | ★ | Qué hace | Frente a the-architect |
|---|---|---|---|
| [github/spec-kit](https://github.com/github/spec-kit) | 142.603 ✅ | `/specify → /plan → /tasks → /implement` con una "constitution" del proyecto; multi-agente | Mismo ADN (de aquí sale `[NEEDS CLARIFICATION]`). Más genérico y por fases; the-architect entrega todo en un blueprint con EARS + verify por paso |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 72.859 ✅ | Specs vivas + propuestas de cambio (deltas) | Mejor para proyectos existentes e iterar |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 54.485 ✅ | Equipo de agentes (analista, PM, arquitecto, SM, dev) → PRD, arquitectura, historias | Más pesado y ágil-céntrico; su rol "arquitecto" es el equivalente |
| [Kiro (AWS)](https://kiro.dev/docs/specs) | — | IDE con `requirements.md → design.md → tasks.md` en **EARS** | El comparable de formato más directo, pero cerrado |
| [gotalab/cc-sdd](https://github.com/gotalab/cc-sdd) | 3.737 ✅ | "Kiro dentro de Claude Code" como skills | Muy cercano |
| [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) | 28.269 ⚠️ | PRD → tareas con dependencias | Solo descompone; no diseña. ~6 meses sin push |
| [buildermethods/agent-os](https://github.com/buildermethods/agent-os) | 5.537 ✅ | Inyecta estándares del código existente | Complemento, no sustituto |

**Tu agente `architect` actual vs the-architect:** el tuyo ya lee el código y ordena DB → API → UI (bien), pero le faltan las 5 piezas que más valor aportan: Non-Goals, `[NEEDS CLARIFICATION]`, pre-mortem, criterios EARS con comando de verificación por paso, y versiones verificadas en vivo.

## 2.2 Repos de estudio

| Repo | ★ | Para qué | Nivel |
|---|---|---|---|
| [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | 46.607 ✅ | Curso lineal completo: redes → bases de datos → microservicios | Básico→Inter. |
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 375.338 ✅ | La referencia: caché, BD, CAP, colas + ejercicios resueltos | Básico→Inter. |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 90.690 ⚠️ | Conceptos con diagramas (sin cambios desde abr-2025) | Básico |
| [roadmap.sh](https://roadmap.sh/software-architect) ([repo](https://github.com/kamranahmedse/developer-roadmap)) | 370.234 ✅ | Mapas de "qué me falta" (arquitecto, system design, backend) | Básico |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | 42.781 ✅ | Índice de conceptos y artículos | Básico→Inter. |
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | 75.017 ✅ | Casos reales (Netflix, Uber…) | Inter.→Avanz. |
| [mehdihadeli/awesome-software-architecture](https://github.com/mehdihadeli/awesome-software-architecture) | 11.733 ✅ | DDD, CQRS, event sourcing, microservicios | Inter.→Avanz. |
| [architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) · [adr/madr](https://github.com/adr/madr) | 17.293 / 2.580 ✅ | Plantillas de ADR | Básico |
| [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) | 36.000 ✅ | Arquitectura de apps React (tu stack) | Inter. |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) · [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) | 16.208 / 4.960 ✅ | SaaS mínimo (Postgres + Stripe) · equipos, SSO, auditoría | Básico / Inter. |
| [Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) | 14.994 ⚠️ | DDD + hexagonal en TypeScript, muy didáctico (sin cambios desde 2024) | Inter. |
| [kgrzybek/modular-monolith-with-ddd](https://github.com/kgrzybek/modular-monolith-with-ddd) | 14.089 ⚠️ | Monolito modular completo con ADRs y C4 (.NET) | Avanz. |
| [ddd-crew/ddd-starter-modelling-process](https://github.com/ddd-crew/ddd-starter-modelling-process) | 6.072 ✅ | Proceso paso a paso para modelar un dominio | Inter. |
| [aws-samples/…serverless-saas](https://github.com/aws-samples/aws-saas-factory-ref-solution-serverless-saas) · [awslabs/sbt-aws](https://github.com/awslabs/sbt-aws) | 523 / 346 ✅ | Aislamiento por tenant (pool/silo), control plane | Avanz. |
| [marco-mendes/arquitetura-software](https://github.com/marco-mendes/arquitetura-software) | 145 ✅ | **PT**: libro abierto de fundamentos (lo mejor en portugués) | Básico |
| [CodelyTV (repos)](https://github.com/CodelyTV) | — | **ES**: ejemplos hexagonal/DDD/CQRS en TS, PHP, Java | Inter. |

En español no existe un repo de system design de calidad comparable; lo mejor nativo en ES son las docs de Azure (abajo) y CodelyTV.

## 2.3 Marcos y estándares (gratis salvo ISO)

| Marco | Para qué |
|---|---|
| [C4 model](https://c4model.com) | Dibujar la arquitectura en 4 zooms: contexto, contenedores, componentes, código |
| [arc42](https://arc42.org) | Plantilla de 12 secciones para documentar (hay versión en español) |
| [12-Factor App](https://12factor.net/es/) | 12 reglas para apps cloud/SaaS (config en entorno, procesos sin estado, logs como flujo…) |
| [Azure Well-Architected (ES)](https://learn.microsoft.com/es-es/azure/well-architected/) · [Azure Architecture Center](https://learn.microsoft.com/es-es/azure/architecture/) · [Guía multi-tenant](https://learn.microsoft.com/es-es/azure/architecture/guide/multitenant/overview) | **La mejor fuente nativa en español**: pilares, patrones cloud, estilos, multi-tenancy |
| [AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) + [SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html) | 6 pilares; el lente SaaS cubre tenencia, aislamiento, onboarding |
| [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework) | Pilares equivalentes |
| [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) | Requisitos de seguridad verificables por nivel |
| ISO/IEC 25010:2023 ⚠️ | Catálogo de atributos de calidad (de pago; estudiarlo por resúmenes) |

## 2.4 Libros

| Libro | Edición | Nivel | Para qué | ¿Español? |
|---|---|---|---|---|
| **Head First Software Architecture** (Gandhi, Richards, Ford) | 2024 ✅ | Principiante | La mejor puerta de entrada: pensar en trade-offs | No encontrado |
| **A Philosophy of Software Design** (Ousterhout) | 2ª, 2021 ✅ | Princ.-Inter. | Complejidad, módulos profundos, buenas abstracciones | No |
| **Fundamentals of Software Architecture** (Richards, Ford) | **2ª, 2025** ✅ | Inter. | El mapa completo: características, estilos, rol del arquitecto (+IA, datos, Team Topologies) | **Sí** (O'Reilly ES) · PT: Alta Books |
| **Designing Data-Intensive Applications** (Kleppmann, Riccomini) | **2ª, 2026** ✅ | Inter.-Avanz. | La biblia de datos: replicación, transacciones, consistencia, streams | **Sí** (1ª Marcombo 2022; 2ª en O'Reilly ES) |
| **Building Multi-Tenant SaaS Architectures** (Tod Golding) | 2024 ✅ | Inter. | **El libro de SaaS**: aislamiento, noisy neighbor, onboarding, identidad | No |
| **Learning Domain-Driven Design** (Khononov) | 2021 ◐ | Princ.-Inter. | La mejor entrada a DDD: subdominios, bounded contexts | No |
| **Release It!** (Nygard) | 2ª, 2018 ✅ | Inter. | Timeouts, circuit breakers, bulkheads: sobrevivir en producción | No |
| **Software Architecture: The Hard Parts** (Ford et al.) | 2021 ✅ | Inter.-Avanz. | Partir sistemas, datos distribuidos, sagas | No |
| **Building Evolutionary Architectures** (Ford et al.) | 2ª, 2022 ✅ | Inter. | Fitness functions: que la arquitectura no se degrade | No |
| **Balancing Coupling in Software Design** (Khononov) | 2024 ✅ | Inter.-Avanz. | Modelo moderno de acoplamiento | No |
| **Software Architecture in Practice** (Bass, Clements, Kazman) | 4ª, 2021 ✅ | Avanz. | Atributos de calidad, tácticas, ATAM (texto canónico) | No |
| **Building Microservices** (Newman) | 2ª, 2021 ✅ | Inter. | Cuándo sí (y cuándo no) microservicios | No |
| **Designing Distributed Systems** (Burns) | 2ª, 2024 ✅ | Inter. | Patrones de contenedores y sistemas distribuidos (+IA) | No |
| **Team Topologies** (Skelton, Pais) | 2ª, 2025 ✅ | Inter. | Ley de Conway, tipos de equipo, carga cognitiva | No |
| **Threats** / **Threat Modeling** (Shostack) | 2023 / 2014 ✅ | Princ. / Inter. | Modelado de amenazas (STRIDE) | No |
| **Clean Architecture** (Martin) | 2017 ◐ | Inter. | Dependencias y capas (útil, algo dogmático) | **Sí**: "Arquitectura limpia" |
| **The Pragmatic Programmer** (Thomas, Hunt) | 20º aniv., 2019 ✅ | Princ. | Hábitos de ingeniero profesional | **Sí**: Anaya 2022 |
| **Site Reliability Engineering** (Google) | 2016, [gratis](https://sre.google/books/) ◐ | Inter. | SLOs, error budgets, postmortems | No |
| **System Design Interview vol. 1 y 2** (Alex Xu) | 2020 / 2022 ✅ | Inter. | Casos prácticos (rate limiter, chat, pagos) | No |
| **Domain-Driven Design** (Evans) · **Implementing DDD** (Vernon) | 2003 / 2013 ✅ | Avanz. | Las obras fundacionales de DDD | No hay traducción oficial |
| **Introducción a la arquitectura de software** (Oscar Blancarte, MX) | 2020 ✅ | Princ. | Estilos y patrones escritos en español nativo | Original ES |
| *Próximo:* **Architecture as Code** (Ford, Richards) | dic-2026 / feb-2027 ⚠️ | Inter. | Arquitectura ejecutable con fitness functions | — |

## 2.5 Cursos y video

**Gratis (universitario / de autor)**

| Recurso | Formato | Aporta |
|---|---|---|
| [Kleppmann — Distributed Systems (Cambridge)](https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB) + [notas PDF](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf) | ~7 h + 87 págs. ✅ | La base teórica más limpia: relojes, replicación, consenso, consistencia |
| [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/) | 26 clases + proyectos ✅ | Cómo funciona Postgres por dentro (índices, transacciones) |
| [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/) | Papers + 5 labs en Go ✅ | Implementar MapReduce, Raft, KV tolerante a fallos |
| [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/) | 29 lecturas ✅ | Specs, tipos, testing, ADTs |
| [Software Architecture Monday (Mark Richards)](https://developertoarchitect.com/lessons/) | ~225 videos de 10–15 min ✅ | Estilos, trade-offs, ADRs en píldoras |
| [roadmap.sh](https://roadmap.sh/system-design) | Mapas interactivos ✅ | Checklist de lo que falta |
| Jordan Has No Life — Systems Design 0 to 1 (YouTube) | Serie larga ⚠️ | Profundidad real en replicación e índices |

**De pago**

| Recurso | Precio aprox. | Aporta |
|---|---|---|
| [Coursera — Software Design & Architecture (U. Alberta)](https://www.coursera.org/specializations/software-design-architecture) | Coursera Plus / ayuda financiera ✅ | Programa académico ordenado (52 h) |
| [Hussein Nasser — Fundamentals of Backend Engineering](https://www.udemy.com/course/fundamentals-of-backend-communications-and-protocols/) | Udemy en oferta | Protocolos, proxies, HTTP/2-3: puente perfecto desde frontend |
| [ByteByteGo](https://bytebytego.com/) · [Educative Grokking](https://www.educative.io/courses/grokking-the-system-design-interview) | Suscripción | System design por casos |
| [Udi Dahan — ADSD](https://learn.particular.net/courses/adsd-online) | US$2.500 | Mensajería, SOA, acoplamiento (solo con presupuesto) |

**Español**

| Recurso | Precio | Aporta |
|---|---|---|
| [**CodelyTV**](https://codely.com/en/courses/hexagonal-architecture-t5m4) — Hexagonal, DDD, CQRS | 19 €/mes (Lite) · 1.ª lección gratis ✅ | **Lo mejor en español** para arquitectura de aplicación |
| [EDteam — Arquitectura de Software con IA](https://ed.team/cursos) | ~US$11 ✅ | Contratos de API, persistencia, seguridad, monitoreo |
| [Platzi — Fundamentos de Arquitectura de Software](https://platzi.com/cursos/fundamentos-arquitectura-software/) | Suscripción ⚠️ | Primer contacto (2 h) |

**Portugués**: [Branas.io](https://branas.io) (Clean Arch + DDD con mentoría, 12×R$150) · [Full Cycle](https://fullcycle.com.br/) (microservicios, cloud, DevOps).

**SaaS y tu stack**: [AWS SaaS Architecture Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/saas-architecture-fundamentals.html) (vocabulario: tenant, control plane, silo/pool) · [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture) · [MakerKit: multi-tenant con RLS](https://makerkit.dev/blog/tutorials/multi-tenant-saas-architecture).


---

# Parte 3 — Las bases: lo que todas las fuentes repiten

## Los 12 principios universales
Aparecen, con distintas palabras, en the-architect, *Fundamentals of Software Architecture*, DDIA, AWS/Azure Well-Architected, 12-Factor, arc42 y *A Philosophy of Software Design*.

| # | Principio | En una línea | Pregunta de control |
|---|---|---|---|
| 1 | **Problema antes que solución** | Escribe qué duele, para quién, y qué significa "terminado" antes de elegir tecnología | ¿Puedo explicarlo sin nombrar una herramienta? |
| 2 | **Clasifica qué estás construyendo** | Un sitio, un SaaS, una API, un bot y un pipeline tienen órdenes de construcción distintos | ¿Cuál es la *shape* principal? ¿Hay una segunda con su propio deploy? |
| 3 | **Atributos de calidad explícitos** | Elige 3 "-ilidades" que mandan (disponibilidad, seguridad, costo, velocidad de cambio…). Todo es un trade-off | Si tengo que sacrificar una, ¿cuál? |
| 4 | **Alcance con valla (Non-Goals)** | Lo que *no* entra en v1 vale tanto como lo que entra | ¿Tengo al menos 5 Non-Goals escritos? |
| 5 | **Datos primero** | El modelo de datos, la identidad de cada registro, la tenencia y qué pasa al borrar son las decisiones más caras de cambiar | ¿Quién es dueño de cada fila? ¿Cascade, soft-delete o bloqueo? |
| 6 | **Límites y contratos** | Módulos con interfaces pequeñas y profundas; validar en la frontera; un solo lugar para la autorización | ¿Qué depende de qué? ¿Hay una sola puerta para leer/escribir datos? |
| 7 | **Decisiones registradas (ADR)** | Cada decisión con contexto, opciones, elección y consecuencia | En 6 meses, ¿sabré *por qué* elegí esto? |
| 8 | **Seguridad por diseño** | Secretos fuera del repo, mínimo privilegio, aislamiento entre clientes probado con un test, webhooks verificados | ¿Hay un test que pruebe que el cliente A no ve datos del B? |
| 9 | **Fallar bien** | Idempotencia, reintentos con backoff, timeouts, colas para lo lento, backups probados (RPO/RTO) | ¿Qué pasa si este servicio llega dos veces, tarde o nunca? |
| 10 | **Observable desde el día 1** | Logs estructurados con request-id, errores con contexto, 4–6 métricas con alerta | ¿Me entero del fallo antes que el cliente? |
| 11 | **Costo como requisito** | Costo a 1× y a 10×, y el "precipicio" donde el precio salta | ¿Qué línea de factura me mata si crezco? |
| 12 | **Terminado = verificable** | Cada paso con criterio observable (EARS) y un comando que lo prueba; entregas pequeñas y reversibles | ¿Qué comando sale con 0 cuando esto está bien? |

## Checklist "Antes de escribir código" (una página)
1. **Problema / Objetivo / Terminado significa…** (3 líneas).
2. **Shape** principal (+ secundaria solo si tiene deploy, usuarios o ciclo propio).
3. **Usuarios y escala** (orden de magnitud: 10, 1.000, 100.000).
4. **Top-3 atributos de calidad** y qué se sacrifica.
5. **Non-Goals** (≥5).
6. **Modelo de datos** v0: entidades, dueño de cada fila, borrado, dinero en enteros.
7. **Tenencia y permisos**: quién ve qué; ¿roles?; ¿org/workspace desde el día 1?
8. **Integraciones**: cuál, quién es dueño de la cuenta y de las llaves, webhooks.
9. **Stack** con una razón por fila; verificar versiones en vivo; revisar combinaciones incompatibles.
10. **Diagrama C4** nivel 1 (contexto) y 2 (contenedores).
11. **Amenazas** (STRIDE rápido) + regulación aplicable (Habeas Data / GDPR / pagos / menores).
12. **Pre-mortem**: "falló en 6 meses, ¿por qué?" → riesgos con mitigación.
13. **Orden de construcción**: 10–18 pasos, cada uno con `Do / Done when / Verify / Checkpoint`.
14. **Costo** a 1× y 10×.
15. **ADR-0001** con la decisión más cara de revertir.

## Qué cambia según lo que construyas

| Tipo | Decisión que más pesa | Riesgo típico | Paso que no puede faltar |
|---|---|---|---|
| **Sitio web / marketing** | Estático vs dinámico; CMS; rendimiento (Core Web Vitals) | Convertir un blog en una "plataforma" (5× esfuerzo) | Metadatos, sitemap, imágenes optimizadas, analítica |
| **SaaS** | Tenencia (user vs org) antes de la primera tabla | Autorización dispersa → fuga entre clientes | Test de aislamiento entre tenants + gating de planes en servidor |
| **App móvil** | ¿Offline? ¿Push? Toolchain gestionado (Expo/EAS) | Firmado y revisión de tiendas fuera de tu control | Actualizaciones OTA + versión mínima soportada |
| **API / backend** | Contrato (OpenAPI), versionado, auth entre máquinas | Romper clientes al cambiar un campo | Tests de contrato + rate limiting |
| **Herramienta / CLI / librería / MCP** | Superficie pública = símbolos exportados + semver | Cambios incompatibles sin major | Changelog + publicación reproducible |
| **Herramienta interna** | SSO, auditoría, velocidad > pulido | Construir billing/onboarding que nadie necesita | Log de auditoría |
| **Bot / automatización** | Idempotencia, reintentos, dead-letter, secretos | Ejecuciones duplicadas por reintentos del proveedor | Tabla de eventos procesados (dedupe) |
| **Agente / IA** | Bucle, herramientas, contexto, evals, costo por corrida | Costo y calidad sin medir | Suite de evals + tope de gasto |
| **Pipeline de datos** | Linaje, frescura, tests sobre los datos | "¿Por qué estos dos números no coinciden?" | Tests de calidad de datos (dbt tests) |
| **Infraestructura** | IaC, entornos, red, secretos, backups | Configuración manual irrepetible ("snowflake servers") | Todo en código + restauración de backup probada |


---

# Parte 4 — Ruta de estudio (12 semanas, 6–8 h/semana, gratis primero)

Cada semana termina con un **entregable sobre un proyecto tuyo real**: así lo aprendido queda en tu código, no en apuntes.

| Sem. | Foco | Material | Entregable |
|---|---|---|---|
| 1 | Mapa general | roadmap.sh (Software Architect + System Design) · Supabase Architecture · *Head First Software Architecture* (empezar) | Diagrama C4 (contexto + contenedores) de una app tuya |
| 2 | Diseño de módulos | *A Philosophy of Software Design* · MIT 6.031 (specs, testing) | Refactorizar un módulo hacia "módulo profundo" |
| 3 | Estilos y decisiones | Software Architecture Monday (10–15 lecciones) · repo de ADR / MADR | 3 ADRs de decisiones reales que ya tomaste |
| 4–5 | Arquitectura de aplicación | CodelyTV (1.ª lección gratis; si pagas un solo curso, este) · domain-driven-hexagon · bulletproof-react | Una feature con dominio separado de Supabase (puertos y adaptadores) |
| 6–7 | Bases de datos por dentro | CMU 15-445 (≈10 clases: storage, índices, transacciones) · DDIA caps. 1–3 | Revisar índices y RLS con `EXPLAIN ANALYZE` |
| 8 | Backend y red | Hussein Nasser · *Release It!* (estabilidad) | Documentar una request: Vercel → función → Postgres, con timeouts y reintentos |
| 9–10 | Sistemas distribuidos | Kleppmann Cambridge (7 h) · DDIA caps. de replicación/consistencia | Analizar qué pasa si un webhook llega 2 veces, tarde o nunca → idempotencia |
| 11 | System design | karanpratapsingh/system-design · system-design-primer · Jordan Has No Life | Diseñar en pizarra 2 sistemas: colas, caché, rate limiting |
| 12 | SaaS | AWS SaaS Fundamentals + SaaS Lens · Azure guía multi-tenant (ES) · *Building Multi-Tenant SaaS Architectures* | Documento de arquitectura SaaS de tu producto: tenencia, onboarding, billing, aislamiento probado |

**Después, sin prisa:** *Fundamentals of Software Architecture* 2ª (de referencia, hay versión en español) → *Learning DDD* → *Threats* (Shostack) + OWASP ASVS → *Team Topologies* cuando haya equipos.

## Top 7 de lectura, en orden
1. *Head First Software Architecture* — vocabulario base sin abrumar.
2. *A Philosophy of Software Design* — corto, aplica desde el primer día.
3. *Fundamentals of Software Architecture* 2ª — estructura todo; en español.
4. *Designing Data-Intensive Applications* 2ª — Supabase es Postgres; el mayor retorno a largo plazo.
5. *Building Multi-Tenant SaaS Architectures* — RLS por `tenant_id`, planes, onboarding.
6. *Learning Domain-Driven Design* — qué construir y qué comprar.
7. *Release It!* 2ª — sobrevivir en producción.

## Cómo usar the-architect como "profesor"
1. Instálalo: `/plugin marketplace add Hainrixz/the-architect` y `/plugin install the-architect@soyenriquerocha`.
2. Pásale una idea pequeña con `/architect-quick` y **lee el blueprint como material de estudio**: cada sección (Non-Goals, modelo de datos, §14 seguridad, §16 costo) es un tema de esta ruta.
3. Contrasta la misma idea en spec-kit o cc-sdd: comparar artefactos enseña qué hace buena una spec.
4. Lleva las mejores piezas a tu propio agente `architect` (Non-Goals, `[NEEDS CLARIFICATION]`, pre-mortem, EARS + verify) — eso sería un proyecto aparte.


---

