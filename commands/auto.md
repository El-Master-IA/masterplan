---
description: Activa o desactiva el piloto automático: Masterplan sigue solo, sesión tras sesión, hasta terminar, y se detiene ante lo delicado
argument-hint: "[activar | desactivar | estado]"
---

Carga la skill `masterplan` y sigue sus reglas en todo el turno.

Argumentos: $ARGUMENTS

1. Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado`. Sin proyecto, dilo y propón
   `/masterplan:empezar`.
2. `estado` (o sin argumentos): corre `masterplan.mjs auto` y explica en 2 líneas si seguiría o
   pararía y por qué.
3. `desactivar`: corre `masterplan.mjs auto desactivar` y confirma.
4. `activar` (o la persona dice "sigue tú hasta terminar", "dame permisos totales"): explica en una
   lista corta lo que va a pasar y pide un "sí" explícito:
   - Al cerrar cada fase u ola, Masterplan lanza solo la sesión siguiente (`/masterplan:seguir`) y
     las olas de la fase 6 corren en paralelo (`/masterplan:ola`) sin que escribas nada.
   - **Siempre se detiene y te pregunta** ante: publicar a producción, cobrar, enviar mensajes a
     terceros, borrar datos, crear cuentas o llaves, gastar dinero nuevo, rotar secretos, push
     forzado, cualquier tarea que falle 3 veces, y las preguntas de las fases 1 a 4 (solo tú tienes
     las respuestas).
   - Tope de 30 sesiones encadenadas por activación.
   - Puedes apagarlo cuando quieras con `/masterplan:auto desactivar`.
   Con el sí, corre `masterplan.mjs auto activar`, anótalo en `decisiones.log` (fuente: la persona,
   fecha) y, si ya estás en la fase 5 o 6, sigue de inmediato con `/masterplan:seguir`.
5. Los permisos del cliente son aparte: para que las sesiones nuevas no se frenen en cada comando,
   la persona debe tener permisos amplios en Claude (por ejemplo modo automático o aceptar
   ediciones). Si no los tiene, dilo y deja que ella decida; nunca los cambies tú.
