---
description: Modo rápido de Masterplan, solo 3 preguntas y defaults declarados; las puertas de la fase 4 siguen siendo obligatorias
argument-hint: "[tu idea en una frase]"
---

Carga la skill `masterplan` y sigue sus reglas en todo el turno, en modo rápido.

Idea de la persona: $ARGUMENTS

1. Ejecuta la fase 0 (`fases/0-contexto.md`) y anota `"modo": "rapido"` en `proyecto.json` además
   de greenfield o brownfield, si el schema lo admite; si no, regístralo en `decisiones.log`.
2. Fase 1 con solo tres preguntas, una por mensaje: el problema (P1), quién lo usa y cuántos (P2)
   y restricciones (P4). Salta las que ya responde la idea de arriba.
3. Toma defaults para todo lo demás y decláralos en un solo bloque: tipo, etapa, versión
   "recomendada" del alcance, 5 Non-Goals, perfil por defecto, métrica de éxito y `rigor`
   (herramienta interna o prototipo de pocos usuarios → `bajo`; con usuarios externos → `medio`;
   con cobros o datos sensibles → `alto`). Es la ruta recomendada para herramientas internas. Cada default va a
   `decisiones.log` con fuente `default-rapido`. La persona puede corregir cualquiera en una línea.
4. Sigue a la fase 3 y luego a la 4. La fase 4 completa es obligatoria: cero preguntas abiertas,
   pre-mortem, checklists, validador y `masterplan:revisor-plano` en PASS (las vueltas máximas
   dependen del `rigor`: bajo 1, medio 2, alto 3), y un "sí" explícito.
   Rápido acorta la entrevista, nunca las puertas.
