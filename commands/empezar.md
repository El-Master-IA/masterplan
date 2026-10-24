---
description: Inicia un proyecto Masterplan o retoma el que ya existe en esta carpeta (fase 0)
argument-hint: "[tu idea en una frase]"
---

Carga la skill `masterplan` y sigue sus reglas en todo el turno.

Idea de la persona: $ARGUMENTS

1. Lee `${CLAUDE_PLUGIN_ROOT}/skills/masterplan/fases/0-contexto.md` completo y ejecútalo.
2. Si ya existe `masterplan/proyecto.json`, no empieces de cero: lee el último relevo y el buzón,
   dile a la persona en 3 líneas dónde quedó y continúa en la fase que marca `proyecto.json.fase`.
3. Si no existe y hay código, despacha `masterplan:explorador`; si no hay código, crea el contrato
   y pasa a la fase 1 con la idea de arriba como respuesta a la primera pregunta.
4. Si `$ARGUMENTS` está vacío y no hay proyecto, abre con una sola pregunta: qué quiere construir y
   qué se rompe hoy porque no existe.
