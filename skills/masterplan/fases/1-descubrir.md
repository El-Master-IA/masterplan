# Fase 1 · Descubrir

Objetivo: entender qué se construye, para quién y en qué etapa, y clasificarlo en **un tipo de
producto**. Nada de stack todavía.

## Cómo preguntar
- Una pregunta por mensaje, en el vocabulario de la persona.
- Cada pregunta dice por qué importa: "Esto decide si necesitamos equipos y permisos desde el día 1."
- Si la persona dice "hazlo ya" / "solo constrúyelo": modo rápido, solo P1, P2 y P4; toma defaults,
  decláralos en un bloque y sigue (la fase 4 igual se exige).

## Preguntas (en este orden, salta las ya respondidas)
1. **El problema.** "¿Qué quieres construir y qué se rompe hoy porque no existe?"
2. **Quién lo usa.** "¿Tu equipo, clientes que pagan, otros programas o una persona sola?" y cuántos
   (10, 1.000, 100.000).
3. **Etapa.** "¿Es para probar la idea o tiene que aguantar usuarios reales desde el primer día?"
4. **Restricciones.** "¿Algo que ya tengas o que no puedas cambiar: stack, hosting, presupuesto, país?"
5. **Éxito.** "¿Qué número te diría en un mes que funcionó?" (se vuelve evento de analítica).

## Clasificar
Lee la tabla de señales de cada archivo en `conocimiento/tipos/`. Elige un tipo principal y, solo si
tiene su propio deploy o sus propios usuarios, un secundario.

| Pregunta que desempata | → |
|---|---|
| ¿Las personas que lo usan trabajan para ti? | sí: herramienta-interna · no: saas |
| ¿Alguien inicia sesión y crea contenido? | no: sitio · sí: saas |
| Si cambio cada respuesta del modelo por un texto fijo, ¿queda producto? | no: app-ia · sí: saas con IA |
| ¿Lo llama un programa o se despierta solo (cron, webhook)? | llama: api · solo: bot |

Una capacidad no es un tipo: "tiene pagos", "usa IA", "tiene login" o "tiempo real" son
capacidades dentro de un tipo.

Di: "Esto es un **<tipo>** porque <señal de sus respuestas>." y espera confirmación.

## Puerta
- [ ] Tipo confirmado por la persona
- [ ] `proyecto.json`: `tipo`, `audiencia`, `escala`, `etapa`, `restricciones`, `metricaExito`, `fase: 2`
- [ ] Decisiones en `decisiones.log`
