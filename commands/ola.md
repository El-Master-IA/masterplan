---
description: Lanza la ola de construcción en paralelo, una sesión nueva por tarea independiente, y la integra al terminar
argument-hint: "[número de ola] [--max N]"
---

Carga la skill `masterplan` y sigue sus reglas en todo el turno. Este comando ejecuta el bucle de
`fases/6-construir.md` para una ola.

Argumentos: $ARGUMENTS

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Si la fase no es 6, dilo y
   termina. Si `--max N` viene en los argumentos, usa N como `paralelo_max` solo en este turno.
2. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" ola <n> --escribir` (sin número usa
   la primera ola con tareas libres). Muestra a la persona en una tabla: tarea · título · rama, las
   que esperan y los conflictos de archivos.
3. Pide confirmación en una línea: "Lanzo N sesiones en paralelo (consumen cuota a la vez). ¿Sí?".
   Si la persona ya autorizó el paralelismo en este proyecto (anotado en `decisiones.log`), sigue.
4. Marca cada tarea con `masterplan.mjs tarea <id> en-curso` y lanza una sesión nueva por tarea
   como indica `fases/6-construir.md` paso 3 (herramienta de sesiones del cliente → `claude
   --worktree` → subagentes con worktree → briefs para pegar a mano). El prompt de cada sesión es
   el contenido de su `masterplan/olas/ola-<n>/<id>.brief.md`. Guarda el id de sesión con
   `masterplan.mjs tarea <id> en-curso --sesion=<id>` cuando exista.
5. No hagas polling. Cuando todas las sesiones reporten, integra en orden de id, verifica, revisa
   según el `rigor`, pon el tag de cada tarea y márcala `hecha` (pasos 5–7 de la fase 6).
6. Cierra con una línea por tarea y, si quedan olas libres, propón `/masterplan:ola` otra vez.
