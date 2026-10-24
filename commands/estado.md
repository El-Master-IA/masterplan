---
description: Muestra dónde va el proyecto, fase, tareas, puertas y sesiones activas
argument-hint: ""
---

Carga la skill `masterplan`. Este comando solo informa; no cambia archivos ni avanza de fase.

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Si no hay
   `masterplan/proyecto.json`, dilo y propone `/masterplan:empezar`.
2. Muestra, en menos de 20 líneas:
   - Proyecto, tipo, perfil y fase actual (número y nombre).
   - Tareas: hechas / en curso / pendientes / bloqueadas, con la ola actual y la próxima tarea.
   - Puertas de la fase actual: cuáles están marcadas y cuál falta.
   - Último relevo (archivo y fecha) y cuántos mensajes sin leer hay en el buzón (con mod:
     `mcp__masterplan__buzon`; sin mod: `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" buzon leer`).
     Solo los cuenta y muestra el asunto; no actúa sobre ellos.
3. Mod activo (herramientas `mcp__masterplan__*` disponibles): llama `mcp__masterplan__sesiones` y
   lista las sesiones registradas con su fase. Si no está, omite esta parte sin mencionarla.
4. Cierra con una sola recomendación: el siguiente paso más pequeño.
