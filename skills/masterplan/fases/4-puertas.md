# Fase 4 · Puertas

Objetivo: intentar matar el diseño antes de gastar en construirlo. Ninguna puerta se salta, ni en
modo rápido.

## Puerta A · Cero preguntas abiertas
1. Busca `[ABIERTA` en `masterplan/`. Cada una se cierra de una de tres formas, en voz alta:
   **respondida** (la persona contesta), **default aceptado** ("asumo X; dime si no") o
   **pospuesta** (pasa a Non-Goals). El silencio no cuenta como sí.
2. Máximo 5 preguntas en total, priorizadas: alcance > seguridad/privacidad > experiencia >
   técnica. Cada una con la opción que recomiendas.

## Puerta B · Pre-mortem
"Pasaron 6 meses y esto fracasó. ¿Por qué?" Ataca el plan, no a la persona, desde 8 ángulos:
supuesto falso · nadie lo quiere · ya existe gratis · costo por usuario · números a 10× y 0,1× ·
lo más difícil está fuera de v1 · fuga de datos o abuso · operación (soporte, backups, caídas).
Quédate con 3–7 hallazgos que sobrevivan. Cada uno va a: riesgo con mitigación
(`arquitectura.md` › Riesgos, con el paso del plan que lo mitiga), Non-Goal, o rediseño (vuelve a
la fase 3).

## Puerta C · Checklists de calidad de requisitos
Corre `plantillas/checklists.md` (seguridad, datos, API, UX, deploy). Prueban que los requisitos
están completos y son verificables, no el código. Un ítem en NO es pregunta abierta o Non-Goal.

## Puerta D · Validadores
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" validar` → 0 BLOCKER.
2. Despacha `masterplan:revisor-plano` (no lee las preferencias de la persona, para no ablandarse).
   Devuelve PASS/FAIL con hallazgos por severidad. Corrige y repite hasta PASS. Máximo de vueltas
   según `proyecto.json.rigor`: `bajo` 1, `medio` 2, `alto` 3. Tras la última vuelta, si sigue en
   FAIL es un problema de diseño: vuelve a la fase 3.
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
- [ ] Relevo `relevos/04-puertas.md`
