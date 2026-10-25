---
description: Cierra la fase u ola actual escribiendo el relevo y deja listas las instrucciones para la sesión siguiente
argument-hint: "[nota para la sesión siguiente]"
---

Carga la skill `masterplan`. Este comando cierra; no empieza trabajo nuevo.

Nota de la persona: $ARGUMENTS

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado` y ubica la fase (y la ola si
   es la 6).
2. Revisa la puerta de la fase en su archivo de `fases/`. Si falta algo, dilo en una lista corta y
   pregunta una sola cosa: cerrar igual como relevo parcial o terminar primero. Un relevo parcial
   no avanza `proyecto.json.fase`.
3. Crea el relevo con `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" relevo <NN-fase>`
   (por ejemplo `03-disenar`, o `06-ola-2` en construcción). El script ya escribe el estado
   (tareas hechas y en curso, bloqueos, tags, evidencia y decisiones nuevas): **no lo reescribas**.
   Completa solo, en una página en total:
   - Contexto que el script no sabe (3–5 líneas): qué sorprendió, riesgo abierto, decisión pendiente.
   - Qué sigue: la primera acción concreta de la sesión siguiente.
   - Qué leer primero: máximo 5 archivos, en orden.
   - Incluye la nota de la persona si la hay.
4. Actualiza `proyecto.json` (fase solo si la puerta está completa) y reescribe el resumen vivo
   en ≤10 líneas.
5. Avisa a la sesión siguiente:
   - Mod activo: `mcp__masterplan__enviar` con `{para: "fase-<N siguiente>", texto}` resumiendo el
     relevo y su ruta. Si `mcp__masterplan__sesiones` muestra una sesión registrada en esa fase,
     envíalo a su `sessionId`.
   - Sin mod: `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" buzon enviar --para fase-<N> "<texto>"`.
6. Cierra con: "Relevo listo en `<ruta>`. Abre una sesión nueva en esta carpeta y escribe
   `/masterplan:seguir`."
