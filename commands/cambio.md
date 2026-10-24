---
description: Abre un cambio (delta) sobre un proyecto ya publicado: feature, bug o refactor, con sus propias puertas y tareas
argument-hint: "\"<qué cambia, en una frase>\""
---

Carga la skill `masterplan` y lee completo `${CLAUDE_PLUGIN_ROOT}/skills/masterplan/fases/8-operar.md`.

Cambio pedido: $ARGUMENTS

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Si no hay proyecto, propone
   `/masterplan:empezar`. Si `proyecto.json.fase` es menor que 8, di que los cambios se abren
   después de publicar y que lo que pide se suma al alcance actual (fase 2 o 3).
2. Si `$ARGUMENTS` está vacío, pregunta una sola cosa: qué quiere cambiar y por qué.
3. Clasifica en una línea: `feature`, `bug` o `refactor`. Revisa si ya hay una carpeta abierta en
   `masterplan/cambios/` que lo cubra; si la hay, retómala en vez de abrir otra.
4. Crea `masterplan/cambios/<AAAA-MM-DD>-<slug>/delta.md` con:
   - Motivo y tipo.
   - Requisitos AGREGADOS (EARS, ids nuevos), MODIFICADOS (id, antes → después) y ELIMINADOS
     (id, motivo y migración de datos si aplica), citando los de `masterplan/specs/`.
   - Para bugs: pasos para reproducir y la sección "lo que NO debe cambiar".
   - Impacto: tablas, políticas RLS, endpoints, pantallas y variables de entorno que toca.
   - Lo no decidido como `[ABIERTA: pregunta — bloquea X]`.
5. Anota la apertura en `masterplan/decisiones.log`.
6. El cambio sigue el ciclo 3 (solo el delta) → 4 → 5 → 6 → 7. Ninguna puerta se salta: la 4
   exige 0 `[ABIERTA` y `masterplan:revisor-plano` en PASS sobre el delta. Las tareas del cambio
   viven en su carpeta y siguen el formato de `tareas.json`.
7. Al publicarlo: `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" cambio archivar <carpeta>`
   aplica el delta a `specs/` y mueve la carpeta a `cambios/archivo/`. Luego corre
   `masterplan.mjs deriva` y muestra el resultado.
8. Cierra diciendo en qué fase del ciclo quedó el cambio y el siguiente paso más pequeño.
