# Fase 4 · Puertas

Objetivo: intentar matar el diseño antes de gastar en construirlo. Ninguna puerta se salta, ni en
modo rápido.

## Orden
Las puertas B, C y D las hacen agentes que no participaron en el diseño. Despáchalos **en un solo
mensaje**: `masterplan:critico` (pre-mortem y checklists) y `masterplan:revisor-plano` (reglas del
plano), después de correr `validar`. Con sus resultados cierras la puerta A una sola vez, en vez de
volver a preguntar tras cada revisión.

## Puerta A · Cero preguntas abiertas
1. Busca `[ABIERTA` en `masterplan/`. Cada una se cierra de una de tres formas, en voz alta:
   **respondida** (la persona contesta), **default aceptado** ("asumo X; dime si no") o
   **pospuesta** (pasa a Non-Goals). El silencio no cuenta como sí.
2. Máximo 5 preguntas en total **contando las que ya hiciste en la fase 3** (regla 2 de la
   skill), priorizadas: alcance > seguridad/privacidad > experiencia > técnica. Cada una con la
   opción que recomiendas. Lo que no quepa en el presupuesto se cierra como default aceptado.

## Puerta B · Pre-mortem
Lo corre `masterplan:critico` ("Pasaron 6 meses y esto fracasó. ¿Por qué?", 8 ángulos) y
devuelve 3–7 hallazgos que sobreviven. Tú decides el destino de cada uno: riesgo con mitigación
(`arquitectura.md` › Riesgos, con el paso del plan que lo mitiga), Non-Goal, o rediseño (vuelve a
la fase 3).

## Puerta C · Checklists de calidad de requisitos
Los recorre `masterplan:critico` con `plantillas/checklists.md` (seguridad, datos, API, UX,
deploy) y devuelve solo los ítems en NO. Prueban que los requisitos están completos y son
verificables, no el código. Un ítem en NO es pregunta abierta o Non-Goal.

## Puerta D · Validadores
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" validar` → 0 BLOCKER.
2. Despacha `masterplan:revisor-plano` (no lee las preferencias de la persona, para no ablandarse).
   Devuelve PASS/FAIL con hallazgos por severidad. Corrige lo que marque. Vueltas máximas según
   `proyecto.json.rigor`: `bajo` 1, `medio` 1, `alto` 2 (`masterplan.mjs reglas`). Con una sola
   vuelta no se vuelve a despachar: corriges los BLOCKER y MAJOR, corres `validar` y anotas cada
   corrección en `decisiones.log`. Si tras la última vuelta quedan BLOCKER que no sabes cerrar, es
   un problema de diseño: vuelve a la fase 3.
3. **Solo BLOCKER y MAJOR obligan otra vuelta.** Los MINOR se anotan en `masterplan/backlog.md` o
   se corrigen de paso, sin nueva revisión.
4. **Regla anti-rediseño:** si la misma pieza (un modelo, un flujo) ya se rediseñó 2 veces, la
   tercera no es una versión más completa: simplifica el requisito o recórtalo a un Non-Goal. Un
   diseño que necesita cinco rediseños para un equipo pequeño está resolviendo un problema que
   todavía no existe.

## Presentación (un solo mensaje, < 40 líneas)
Tabla de stack con una razón por fila · cómo encaja (3–5 líneas) · v1 incluye / v1 NO incluye ·
riesgos principales con mitigación · costo mensual estimado. Termina con: "¿Lo construimos así?"

## Puerta
- [ ] 0 `[ABIERTA` · pre-mortem registrado · checklists en SÍ o resueltos · validador y revisor en PASS
- [ ] La persona dijo "sí" explícitamente (anótalo en `decisiones.log`)
- [ ] `proyecto.json`: `aprobaciones.diseno = <fecha>`, `fase: 5`
- [ ] Sigue a la fase 5 en esta misma sesión (mismo tramo). Solo si el contexto ya pasó de la
      mitad: `masterplan.mjs relevo 04-puertas` y sesión nueva.
