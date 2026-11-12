# Auditoría y propuesta de producto · nombre en clave **Cimientos**
*Plugin propio de Claude Code para construir software desde cero con bases sólidas. Versión 0 de la propuesta · 23-oct-2026.*

> "Cimientos" es solo nombre en clave para hablar del producto. La marca final la decides tú. Nada de este diseño usa nombres, textos ni código de Tododeia/Hainrixz: tomamos **ideas y patrones** (que no tienen dueño) y lo escribimos desde cero.

## 0. Qué se estudió
| Fuente | Qué es | Informe |
|---|---|---|
| the-architect (v2.6) | Planificador: entrevista → blueprint de 20 secciones | `informe-arquitectura.md` |
| 8 repos más de Hainrixz | claude-webkit, claude-seo-ai, agente-pagokit, cyber-neo, all-deploy, claude-db, whatsapp-agentkit (+closer), tododeia-animaciones | `investigacion/A-hainrixz-repos.md` |
| 9 repos de frontend/diseño/calidad | UI UX Pro Max, Vercel agent-skills, awesome-design-md, Refero, Emil Kowalski, AI Website Cloner, plugins oficiales de Claude Code, Cyber Neo, frontend-design | `investigacion/B-frontend-diseno.md` |
| 6 competidores spec-driven | spec-kit, BMAD v7, OpenSpec, cc-sdd/Kiro, Agent OS, Superpowers | `investigacion/C-spec-driven.md` |
| 73 guías de tododeia (búsqueda "web") | Modelo de cadena de herramientas y pedagogía | `investigacion/D-guias-tododeia.md` |
| Libros, cursos, marcos | DDIA, Fundamentals, C4, 12-Factor, Well-Architected, OWASP ASVS… | `informe-arquitectura.md` |

## 1. Auditoría: qué hace bien el ecosistema actual y dónde falla

### Lo que ya está resuelto (lo adoptamos como principio)
1. **Plan ejecutable por otra sesión**: pasos con 4 campos (hacer / terminado cuando / verificar / punto de retorno), criterios EARS y comando que sale 0.
2. **Puertas antes de generar**: cero dudas abiertas, pre-mortem, Non-Goals obligatorios.
3. **Validador independiente** que no lee las preferencias del usuario y reglas aprendidas de construcciones reales.
4. **Clasificación por tipo de producto** que decide preguntas y pasos.
5. **"El script mide, el modelo juzga"** (claude-seo-ai, claude-db): reproducibilidad.
6. **Validadores en hooks que no se pueden discutir** (pagokit): la seguridad no depende de que el modelo obedezca.
7. **Kit de auditor**: hallazgos con esquema, subagentes de solo lectura, un solo escritor, arreglos solo cuando el usuario los pide.
8. **Pedagogía hispana**: ficha fija, analogía → técnica, prompts copiables, "cuándo NO usarlo", URL en vivo el mismo día.

### Dónde falla (nuestra oportunidad)
| Hueco | Quién lo deja abierto | Consecuencia |
|---|---|---|
| **No hay conductor**: cada herramienta vive aislada y re-pregunta todo | Todo el ecosistema Hainrixz | El usuario es el pegamento; reportes sueltos en el Escritorio |
| **Backend débil**: sin RLS probadas, migraciones, Edge Functions, colas, rate limiting | the-architect (genérico), webkit (nada) | Apps que se ven bien y filtran datos |
| **Seguridad como checklist**, no como diseño | Todos (spec-kit, BMAD, Kiro, the-architect) | Nadie hace threat model → matriz de permisos → tests |
| **Frontend no verificado**: tokens, a11y, Core Web Vitals, anti-slop como opinión | Todos | "Se ve hecho con IA" y nadie lo mide |
| **Termina en el plano**: no construye, no publica, no opera | the-architect | El trabajo duro queda al usuario |
| **Specs que se pudren** después de construir | the-architect, spec-kit | El plano deja de describir el sistema real |
| **25–35 min en silencio** al generar | the-architect | Parece colgado |
| **Asume desarrollador** | Todos los spec-driven | Excluye al principiante/dueño de negocio |
| **LatAm a medias**: pagos sí (pagokit), facturación, Habeas Data, WhatsApp no integrados al plano | Ecosistema | El SaaS latino queda incompleto |

## 2. Visión
**Un solo compañero que lleva a cualquier persona de la idea a un SaaS en producción, con las bases bien puestas y verificadas por máquina, en español.**

Promesa medible (tu "terminado" de v1): *un principiante lo usa de la idea al deploy y sale un SaaS real con auth, base de datos, API, frontend con design system y auditoría de seguridad aprobada.*

## 3. Principios de diseño (10)
1. **Un agente + skills; subagentes solo** para investigar versiones, auditar, validar y construir tareas independientes.
2. **Un contrato de proyecto único** que todos leen y nadie re-pregunta.
3. **Lo que se puede medir, lo mide un script**; el modelo explica y decide lo demás.
4. **Puertas con evidencia guardada**: nada se da por hecho sin la salida fresca del comando.
5. **Seguridad por diseño**: amenazas → permisos → políticas → tests, desde el plano.
6. **Frontend con contrato**: DESIGN.md + EXPERIENCE.md, y reglas comprobables.
7. **Specs vivas**: el plano se actualiza con cada cambio (deltas), no se archiva.
8. **Carga progresiva**: archivo raíz corto; fases y módulos se leen uno a la vez.
9. **Confirmación humana** para todo efecto externo (deploy a producción, pagos reales, publicar). Secretos solo por entorno, nunca en el chat.
10. **Dos modos de voz**: *dueño de negocio* (analogías, decisiones en lenguaje de negocio) y *desarrollador* (técnico), detectado y ajustable.

## 4. El flujo: 9 fases con puertas

| # | Fase | Qué pasa | Puerta de salida | Inspirado en (idea, no texto) |
|---|---|---|---|---|
| 0 | **Contexto** | Lee carpeta `contexto/` (docs, capturas, referencias) o el repo existente antes de preguntar | Mapa de lo que ya se sabe | webkit, Superpowers, brownfield de the-architect |
| 1 | **Descubrir** | Una pregunta por turno, diciendo qué cambia según la respuesta; detecta nivel del usuario | Tipo de producto confirmado | Superpowers, the-architect |
| 2 | **Recortar** | 3 versiones de la idea (mínima, recomendada, soñada) → elige; Non-Goals ≥5 | MVP firmado | guía "de la idea a la tienda", BMAD |
| 3 | **Diseñar** | Columna vertebral: tipo × perfil de stack × capacidades; atributos de calidad; C4; modelo de datos; contratos de API; **matriz de permisos**; **mapa de amenazas**; DESIGN.md + EXPERIENCE.md | Todas las dimensiones decididas, pospuestas o en pregunta (ninguna en silencio) | BMAD spine, cc-sdd/Kiro, C4, STRIDE |
| 4 | **Puertas** | Máx. 5 preguntas con opción recomendada; pre-mortem; checklists de calidad de requisitos (seguridad, UX, API, deploy); validador CLI + validador IA independiente | 0 dudas, 0 BLOCKER | spec-kit, the-architect, OpenSpec |
| 5 | **Planear** | Grafo de tareas en olas paralelas; cada paso con 4 campos + su test | Plan validado | the-architect, Kiro |
| 6 | **Construir** | El conductor ejecuta paso a paso, invoca el kit de cada capacidad con el contrato ya resuelto; subagente por tarea + revisor; hooks de políticas activos | Cada paso en verde + tag | cc-sdd, Superpowers, pagokit |
| 7 | **Verificar y publicar** | Motor de auditoría común (seguridad, RLS dinámica, a11y, rendimiento, anti-slop, SEO y legible por agentes) → preview → smoke funcional → producción con confirmación | Gate global en verde + reporte | all-deploy, cyber-neo, claude-seo-ai |
| 8 | **Operar** | Cambios como deltas sobre specs vivas; detector de desvío en CI; loop de mantenimiento (upgrades, errores) | Spec = sistema real | OpenSpec, loops |

**Progreso visible**: cada fase larga emite avances cortos ("3/9 versiones verificadas"), nunca 30 minutos en silencio.

## 5. Qué deja en el proyecto del usuario
```
cimientos/
  proyecto.json        ← contrato único: tipo, perfil, capacidades, versiones con procedencia, fase, aprobaciones
  decisiones.log       ← bitácora append-only (decisión, supuesto, versión, pregunta) con IDs estables
  specs/<capacidad>.md ← specs vivas (EARS) · cambios/ ← deltas por cambio
  arquitectura.md      ← C4 contexto + contenedores, atributos de calidad, ADRs
  datos.md             ← modelo dominio→lógico→físico, borrado, retención de datos personales
  api.md               ← contratos (OpenAPI/zod), errores, versionado
  seguridad.md         ← mapa de amenazas, matriz rol×recurso×acción, políticas RLS
  DESIGN.md            ← tokens (colores, tipografía, espacio, motion) + lista de "no usar"
  EXPERIENCE.md        ← pantallas, estados (cargando/vacío/error), flujos, accesibilidad
  plan/tareas.json     ← grafo con olas · evidencia/ ← salidas de cada puerta
CLAUDE.md · AGENTS.md  ← cortos, con comandos primero
.claude/skills/ · .claude/hooks/ ← flujos del proyecto y políticas activas
```

## 6. Las capas técnicas (lo que hace "bases sólidas")

### Frontend
- Design system **generado desde el brief** (con semilla para que no salga todo igual), exportado a variables CSS y tema de Tailwind.
- Reglas atómicas versionadas en local: accesibilidad, rendimiento, animación, anti-"AI slop", composición de componentes, manejo de estado (servidor vs URL vs local vs global).
- Cada componente con sus estados (cargando, vacío, error, datos extremos).
- Verificación automática: axe/Playwright, Lighthouse CI con presupuestos (LCP < 2,5 s, INP < 200 ms, CLS < 0,1), capturas móvil/escritorio.

### Backend y API
- Contrato primero (zod/OpenAPI), validación en la frontera, sobre de errores único, paginación, versionado.
- Edge Functions/rutas con rate limiting, idempotencia en webhooks, colas para lo lento.
- Tests de contrato contra la API real.

### Datos
- Migraciones versionadas con vuelta atrás, índices justificados por consulta, seed coherente, dinero en enteros, borrado decidido, retención de datos personales.
- Introspección en solo lectura (también vía MCP de Supabase) con hook guardián.

### Seguridad
- Mapa de amenazas por capacidad → matriz de permisos → **políticas RLS generadas** → **tests que prueban que el cliente A no ve datos del B**.
- Policy packs en hooks según capacidades (auth, pagos, uploads, SQL, CORS, headers, secretos en bundle `VITE_*`), con códigos de error y excepciones registradas.
- Auditoría por capas: al editar, al terminar el turno y en cada commit.

### Deploy y operación
- Entornos (local/preview/prod) y variables por entorno; CI con las puertas; migraciones antes de promover; smoke funcional; monitoreo de errores y rollback.
- Hosting elegido también por términos de uso (p. ej. uso comercial).

### LatAm
- Pagos (Wompi, Mercado Pago, PSE, Nequi, Stripe) como kit; Habeas Data (Ley 1581) y facturación electrónica como checklist; WhatsApp como canal.

## 7. Arquitectura interna del plugin
| Pieza | Qué es |
|---|---|
| `CLAUDE.md`/skill raíz (corto) | Reglas innegociables + máquina de estados + "running brief" |
| `fases/0..8` | Un archivo por fase, se lee al entrar |
| `conocimiento/tipos/` | Tipos de producto (v1: SaaS y sitio/landing; luego API, herramienta interna, bot, agente…) |
| `conocimiento/perfiles/` | Perfiles de stack con versiones y procedencia (v1: **React + Vite + Supabase + Vercel + Vitest**; luego Next.js) |
| `kits/` | Uno por capacidad: auth+tenencia, datos, API, frontend/design system, pagos LatAm, deploy, observabilidad. Cada kit: preguntas de negocio → decisión determinista → archivos → candados → checklist de producción |
| `motor-auditoria/` | Esquema de hallazgo común, ejes que no se mezclan, confianza, "no verificado" honesto, comparación entre corridas, arreglos opt-in |
| `politicas/` | Validadores deterministas para hooks, con tests |
| `scripts/validar` (Node, sin dependencias) | Lint del plano: secciones, IDs, EARS, comandos, referencias rotas, conteos |
| `agentes/` | investigador de versiones, revisor del plano, auditores de solo lectura, verificador independiente, escritor único |
| `evals/` | "Constructor literal": una sesión limpia construye desde el plano; se mide pasos completados y defectos |

## 8. Frente a the-architect
| | the-architect | Cimientos |
|---|---|---|
| Alcance | Termina en el plano | Idea → plano → construcción → publicación → operación |
| Orquestación | Recomienda otras herramientas | Un conductor invoca kits con el contrato resuelto |
| Backend/datos | Capacidad genérica | Kits con RLS generada y probada, migraciones, contratos verificados |
| Seguridad | Checklist §14 | Amenazas → permisos → políticas → tests + hooks |
| Frontend | Capacidades de texto | DESIGN.md + EXPERIENCE.md + reglas medibles + Lighthouse/axe |
| Specs después de construir | Se quedan fijas | Vivas, con deltas y detector de desvío |
| Usuario | Desarrollador | Modo dueño de negocio y modo dev |
| Progreso | 25–35 min en silencio | Avances visibles por fase |
| Mercado | Genérico | LatAm de punta a punta |

## 9. Hoja de ruta (cuando arranque, después del 4-nov)
| Versión | Alcance | Terminado significa |
|---|---|---|
| **v0.1** (2 sem) | Fases 0–5, tipo SaaS, perfil React+Vite+Supabase+Vercel, `validar` | Una sesión limpia construye desde el plano los 5 primeros pasos sin preguntar |
| **v0.2** (2 sem) | Kits datos + auth/tenencia (RLS + tests) + frontend (design system) + hooks de políticas | Test de aislamiento entre tenants en verde en un proyecto de prueba |
| **v0.3** (2 sem) | Motor de auditoría + kit deploy + observabilidad + fase 7 | Preview → smoke → producción con reporte de auditoría sin críticos |
| **v1.0** (2 sem) | Fase 8, pagos LatAm, guías en español, landing del producto | **Un principiante saca un SaaS real a producción** (piloto: Bodega de Belleza u otro cliente IA Master Tech) |

## 10. Propiedad intelectual y licencia
- Todo escrito desde cero. Estudiamos patrones e ideas (no protegibles); no copiamos textos, nombres ni código.
- Si alguna vez se reutiliza código MIT/Apache de terceros, se conserva su aviso de licencia (requisito de esas licencias).
- Nada de `anthropics/claude-code` (todos los derechos reservados) ni de `tododeia-animaciones` (sin licencia).
- Licencia recomendada del producto: **MIT** para adopción en la comunidad, con la **marca** registrada a tu nombre.

## 11. Pendiente de ti
1. El nombre/marca definitiva.
2. La información adicional que dijiste que vas a mandar (se incorpora a este análisis antes de arrancar).
