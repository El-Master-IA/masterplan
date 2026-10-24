# Masterplan

**De la idea a un SaaS en producción, con bases sólidas.** Un plugin gratis para Claude Code que te
entrevista, diseña el frontend, el backend, los datos, las APIs y la seguridad, construye paso a
paso con un agente por tarea, audita, publica y mantiene tu proyecto. En español.

Un kit de [La Bóveda del Master](https://la-boveda-del-master.vercel.app/boveda/masterplan) por
Alexander Cast.

---

## Instalar

En una terminal con Claude Code:

```
/plugin marketplace add La-Boveda-del-Master/masterplan
/plugin install masterplan@la-boveda-del-master
```

Desde la shell:

```bash
claude plugin marketplace add La-Boveda-del-Master/masterplan
claude plugin install masterplan@la-boveda-del-master
```

En la app de escritorio (pestaña Code): botón **+** junto al campo de texto → **Plugins** →
**Add marketplace** con `La-Boveda-del-Master/masterplan` → **Add plugin**.

**Necesitas:** Claude Code reciente, Node.js 20 o superior y git. Para construir el SaaS: una
cuenta gratis de Supabase y de Vercel (el plugin te dice cuándo).

## Empezar

Abre Claude Code en una carpeta vacía (o en tu proyecto existente) y escribe:

```
/masterplan:empezar Quiero un sistema de reservas para barberías
```

Masterplan lee primero lo que ya hay, te hace **una pregunta a la vez** con su recomendación y
avanza por fases. Al cerrar cada fase te pide seguir en una **sesión nueva** con:

```
/masterplan:seguir
```

Así ninguna conversación carga todo el proyecto.

## Cómo trabaja

| Fase | Qué pasa | Para pasar a la siguiente |
|---|---|---|
| 0 · Contexto | Lee tu carpeta, tu repo o tus documentos antes de preguntar | Contrato del proyecto creado |
| 1 · Descubrir | Qué construyes, para quién, en qué etapa | Tipo de producto confirmado |
| 2 · Recortar | Tres versiones de tu idea y lo que v1 NO hace | MVP firmado y 5 Non-Goals |
| 3 · Diseñar | Arquitectura, datos, API, seguridad, DESIGN.md y EXPERIENCE.md | Ninguna decisión en silencio |
| 4 · Puertas | Preguntas abiertas, pre-mortem, validador y revisor independiente | Tu "sí" explícito |
| 5 · Planear | Tareas con criterio verificable, comando de prueba y punto de retorno | Plan validado |
| 6 · Construir | Un agente por tarea, revisor de código, políticas de seguridad activas | Todas las tareas en verde |
| 7 · Publicar | Auditoría de seguridad y de experiencia, preview, producción con tu confirmación | Sin hallazgos críticos |
| 8 · Operar | Specs vivas, cambios como deltas, detector de desvíos en CI | El plano describe el sistema real |

## Qué trae

- **Skill principal** `masterplan` con las 9 fases, 6 tipos de producto (SaaS, sitio, API,
  herramienta interna, bot, app con IA) y 2 perfiles de stack (React + Vite + Supabase + Vercel
  por defecto; Next.js como alternativa).
- **7 kits por capacidad:** datos (migraciones, RLS y sus tests), auth (organizaciones, roles,
  invitaciones), API (contratos, rate limiting, webhooks), frontend (design system, estados,
  accesibilidad, rendimiento), pagos para Latinoamérica (Stripe, Mercado Pago, Wompi/PSE/Nequi,
  Lemon Squeezy), deploy y observabilidad.
- **Auditor** con dos notas que nunca se mezclan: Seguridad y Calidad de experiencia.
- **10 agentes, uno por tipo de tarea:** explorador, investigador de versiones, arquitecto de
  datos, diseñador, revisor del plano, constructor, revisor de código, auditor de seguridad,
  auditor de frontend y desplegador.
- **Comandos:** `/masterplan:empezar`, `/masterplan:seguir`, `/masterplan:rapido`,
  `/masterplan:estado`, `/masterplan:auditar`, `/masterplan:cambio`, `/masterplan:relevo`.
- **Políticas de seguridad (hooks)** que bloquean mientras se escribe: la llave `service_role` en el
  navegador, secretos con prefijo `VITE_`, llaves escritas en el código, escribir `.env`, push
  forzado, `db reset` contra una base remota. Y avisan: tablas sin RLS, webhooks sin firma,
  migraciones editadas, HTML sin sanitizar. Solo actúan en carpetas con un proyecto Masterplan.
- **Conexiones (MCP) listas:** Supabase (solo lectura), Vercel, Context7 (documentación al día) y
  Playwright (pruebas de interfaz). Supabase y Vercel te piden iniciar sesión la primera vez.
- **CLI sin dependencias** `scripts/masterplan.mjs`: `estado`, `validar`, `tarea`, `auditoria`,
  `deriva`, `cambio`, `relevo`, `buzon`.

## Sesiones conectadas (mod)

Masterplan trae un **mod** que conecta las sesiones del mismo proyecto:

- Cada sesión se registra con su fase y su ola de trabajo.
- Las sesiones se mandan mensajes en vivo; si la otra no está abierta, el mensaje queda en un
  buzón y lo recibe al arrancar.
- Un panel (`/masterplan-panel`) y una banda sobre el campo de texto muestran fase, tareas,
  sesiones y mensajes.

Los mods de Claude Code están en acceso anticipado. Para activarlos en un plugin instalado, agrega
esto a `~/.claude/settings.json` y reinicia:

```json
{ "env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" } }
```

Sin el mod, todo funciona igual: los relevos viven en `masterplan/relevos/` y los mensajes en
`masterplan/buzon/` (con `node masterplan.mjs buzon`).

## Lo que deja en tu proyecto

```
masterplan/
  proyecto.json        contrato único: tipo, stack, capacidades, versiones, fase, aprobaciones
  decisiones.log       cada decisión con su fecha y su razón
  arquitectura.md · datos.md · seguridad.md · api.md · DESIGN.md · EXPERIENCE.md
  specs/  cambios/     requisitos vivos y los cambios que los actualizan
  plan/tareas.json     tareas en olas, con criterio, verificación y punto de retorno
  relevos/  buzon/  evidencia/  auditoria/
CLAUDE.md · AGENTS.md  instrucciones cortas para quien construya después
```

## Preguntas frecuentes

**¿Tengo que saber programar?** No. Por tu primera respuesta decide si te habla en lenguaje de
negocio o técnico, te dice cuál eligió y puedes cambiarlo cuando quieras ("háblame más técnico").

**¿Funciona con un proyecto que ya tengo?** Sí. Lee tu repo, respeta tus convenciones y diseña
solo el cambio.

**¿Me cobra algo?** El plugin es gratis (MIT). Los servicios que uses (Supabase, Vercel, pagos)
tienen planes gratuitos y te avisa el costo a 1× y a 10× antes de construir.

**¿Publica solo a producción?** Nunca. Publicar, cobrar de verdad o borrar datos siempre espera tu
confirmación. Los secretos los escribes tú en `.env`; jamás te los pide por el chat.

## Desarrollo

```bash
npm test                                      # pruebas de los scripts y las políticas
claude plugin validate .claude-plugin/plugin.json
claude --plugin-dir .                         # probar el plugin desde esta carpeta
```

## Licencia

MIT © 2026 Alexander Cast · La Bóveda del Master. Ver [LICENSE](LICENSE).
