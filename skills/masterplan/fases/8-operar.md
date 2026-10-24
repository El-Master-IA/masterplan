# Fase 8 · Operar

Objetivo: que el plano siga describiendo el sistema real mientras cambia, y que el proyecto no se
degrade después del lanzamiento.

## Specs vivas
- `masterplan/specs/` describe cómo funciona el sistema **hoy**.
- Todo cambio (feature, bug, refactor) entra con `/masterplan:cambio "<qué>"`: crea
  `masterplan/cambios/<fecha>-<slug>/` con `delta.md` (requisitos AGREGADOS, MODIFICADOS,
  ELIMINADOS con motivo y migración), tareas propias y, para bugs, "lo que NO debe cambiar".
- El cambio pasa por fases 3 (solo el delta) → 4 → 5 → 6 → 7. Al publicarlo,
  `masterplan.mjs cambio archivar <carpeta>` aplica el delta a `specs/` y mueve la carpeta a
  `cambios/archivo/`.

## Desvío (deriva)
`node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" deriva` compara specs, tareas y código:
requisitos sin test que los cite, tests que citan requisitos que ya no existen, tablas nuevas sin
política RLS, variables de entorno usadas que no están documentadas. Úsalo en CI (ver
`kit-deploy`) para que cada PR diga qué rompió.

## Mantenimiento con /loop
Propón un `loop.md` de mantenimiento semanal con meta medible y tope: dependencias con
vulnerabilidades, errores nuevos en producción, consultas lentas, backups restaurados (al menos uno
al mes de verdad).

## Puerta (continua)
- [ ] `masterplan.mjs deriva` sale 0 en main
- [ ] Ningún cambio en producción sin su carpeta en `cambios/archivo/`
