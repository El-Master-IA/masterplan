---
description: "Agrega, edita o arregla algo en un proyecto que ya existe. El tamaño del cambio decide cuánto proceso lleva: uno pequeño se hace en esta misma sesión."
argument-hint: "\"<qué cambia, en una frase>\""
---

Carga la skill `masterplan` y lee completo `${CLAUDE_PLUGIN_ROOT}/skills/masterplan/fases/8-operar.md`.

Cambio pedido: $ARGUMENTS

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Sin proyecto, propón
   `/masterplan:empezar` (o `/masterplan:auditar` si ya hay código hecho con otra herramienta).
2. Si `$ARGUMENTS` está vacío, pregunta una sola cosa: qué quiere cambiar y por qué.
3. **Según la fase del proyecto:**
   - Fases 1 a 5 (aún no se construye): el pedido se suma al alcance o al diseño en curso; no se
     abre un cambio. Dilo en una línea y ajusta el documento que corresponda.
   - Fase 6 o 7 (en construcción): un cambio pequeño es una tarea nueva en `plan/tareas.json`
     (ola siguiente) con su requisito en `specs/`; uno mediano o grande espera a que cierre la ola
     en curso y se trata como abajo.
   - Fase 8 (publicado): sigue al paso 4.
4. **Clasifica el tamaño** en una línea y dilo con el motivo. Ante la duda, sube un nivel.

   | Tamaño | Es esto | Proceso |
   |---|---|---|
   | **pequeño** | Una tarea, 5 archivos o menos, sin tablas ni políticas nuevas, sin tocar login, pagos ni secretos, sin dependencias nuevas. Un texto, un campo, un filtro, un ajuste visual, un bug acotado | Esta misma sesión: delta, una tarea, construir, verificar, revisar y archivar |
   | **mediano** | Varias tareas o una pantalla nueva; puede tocar datos o permisos | Specs y tareas del cambio, `validar`, construir por olas con su revisión. Sin rediseñar ni volver a las puertas |
   | **grande** | Capacidad nueva (pagos, equipos, IA), cambia el modelo de datos de fondo, el proveedor o la arquitectura | Ciclo completo 3 (solo el delta) → 4 → 5 → 6 → 7 |

   Todo lo que toca datos de personas, permisos, login o pagos es **al menos mediano** y lleva
   `masterplan:auditor-seguridad` antes de publicarse.
5. Revisa si ya hay una carpeta abierta en `masterplan/cambios/` que lo cubra; si la hay, retómala.
   Si no, créala con
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" cambio nuevo "<descripción corta>" --tamano=<pequeno|mediano|grande>`
   y completa `delta.md`:
   - Motivo y tipo (`feature`, `bug` o `refactor`).
   - Requisitos AGREGADOS (EARS, ids nuevos), MODIFICADOS (id, antes → después) y ELIMINADOS
     (id, motivo y migración de datos si aplica), citando los de `masterplan/specs/`.
   - Para bugs: pasos para reproducir y "lo que NO debe cambiar".
   - Impacto: tablas, políticas, endpoints, pantallas y variables de entorno que toca.
   Anota la apertura en `masterplan/decisiones.log`.
6. **Pequeño (carril rápido, sin salir de esta sesión):**
   a. Escribe una sola tarea en el `tareas.json` de la carpeta del cambio (mismo formato del plan:
      criterios EARS, `verificar`, `checkpoint`).
   b. Despacha un `masterplan:constructor` con la tarea y el delta. Test primero.
   c. Corre los `verificar` de la tarea y el gate rápido de `plan/gate.md`. Guarda la salida en
      `masterplan/evidencia/`.
   d. Despacha `masterplan:revisor-codigo` sobre el diff, una vuelta. Corrige BLOCKER y MAJOR.
   e. Si al construir resulta que toca más de lo previsto (otra tabla, otro permiso, más de 5
      archivos), detente y reclasifícalo como mediano.
7. **Mediano:** escribe las specs del delta y sus tareas, corre `masterplan.mjs validar`, construye
   por olas como en la fase 6 (con la revisión que pide el `rigor`) y corre el gate global.
8. **Grande:** el cambio sigue el ciclo 3 (solo el delta) → 4 → 5 → 6 → 7, con sus puertas.
9. **Publicar** siempre pide la confirmación de la persona, sea del tamaño que sea. Después:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" cambio archivar <carpeta>` aplica el delta a
   `specs/` y mueve la carpeta a `cambios/archivo/`. Corre `masterplan.mjs deriva` y muestra el
   resultado.
10. Cierra diciendo qué quedó hecho, qué falta y el siguiente paso más pequeño.
