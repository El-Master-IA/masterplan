---
description: Retoma el proyecto en una sesión nueva desde proyecto.json, el último relevo y el buzón, y ejecuta la fase actual
argument-hint: "[nota opcional para esta sesión]"
---

Carga la skill `masterplan` y sigue sus reglas en todo el turno.

Nota de la persona: $ARGUMENTS

1. Si no existe `masterplan/proyecto.json`, dilo en una línea y propone `/masterplan:empezar`.
2. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Si sale distinto de 0,
   muestra el error y no avances.
3. Lee en este orden y nada más: `masterplan/proyecto.json` y el relevo más reciente de
   `masterplan/relevos/` (empieza por su sección "qué leer primero").
4. Buzón y registro:
   - Mod activo (ves `mcp__masterplan__registrar` y `mcp__masterplan__buzon`): llama
     `mcp__masterplan__registrar` con `{fase}` (y `ola` si la fase es 6) y luego
     `mcp__masterplan__buzon`.
   - Sin mod: `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" buzon leer`.
5. Resume en 3 líneas: fase, qué quedó hecho, qué sigue. Si la fase es 6, indica la ola y la
   próxima tarea `pendiente` con sus dependencias en `hecha`.
6. Lee completo `${CLAUDE_PLUGIN_ROOT}/skills/masterplan/fases/<n>-<fase>.md` de la fase actual y
   ejecútala en esta sesión.
