# Fase 7 · Verificar y publicar

Objetivo: probar que lo construido es seguro, accesible, rápido y hace el flujo principal, y
ponerlo en producción con la confirmación de la persona.

## 1. Gate global
Corre cada comando de `plan/gate.md` desde un checkout limpio. Todos salen 0. Guarda la salida en
`masterplan/evidencia/gate.txt`.

## 2. Auditoría (skill `masterplan:auditor`)
Despacha en paralelo, en un solo mensaje:
- `masterplan:auditor-seguridad` — secretos, authz, RLS contra la matriz de `seguridad.md`,
  inyección, headers, dependencias.
- `masterplan:auditor-frontend` — accesibilidad (axe), rendimiento (Lighthouse con presupuestos de
  `DESIGN.md`), estados de `EXPERIENCE.md`, estética genérica, legibilidad para buscadores y agentes.
Ambos devuelven hallazgos en el formato de `skills/auditor/hallazgo.schema.json`; guarda cada
arreglo en `masterplan/auditoria/pendientes/<auditor>.json`. Fusiona con
`node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" auditoria fusionar` → `masterplan/auditoria/<fecha>.json`
y un resumen con dos notas separadas (Seguridad y Calidad de experiencia), nunca mezcladas.

Críticos o altos: se arreglan uno por uno con un constructor (explicando cada cambio) y se vuelve a
auditar; `masterplan.mjs auditoria comparar` muestra qué se cerró.

## 3. Publicar (skill `masterplan:kit-deploy`, agente `masterplan:desplegador`)
1. Preview: despliega a un entorno de prueba con variables de prueba.
2. Smoke: corre el flujo principal de la fase 2 contra la preview (Playwright) y el health check.
3. Migraciones de base: se aplican antes de promover, nunca después.
4. **Pregunta**: "Preview verde (enlace). ¿Publico a producción?" Solo con un sí.
5. Producción y verificación: health check, flujo principal en modo lectura, errores de los
   primeros minutos. Si falla, rollback inmediato y reporta.

## 4. Lista de lanzamiento (manual)
Lo que depende de terceros: dominio y DNS, cuenta de pagos activada, pago real con reembolso,
correo transaccional verificado, políticas de privacidad publicadas. Entrégala marcada.

## Puerta
- [ ] Gate global en verde · auditoría sin críticos ni altos abiertos
- [ ] Producción confirmada por la persona y verificada
- [ ] `proyecto.json`: `produccion.url`, `produccion.fecha`, `fase: 8`
- [ ] Relevo `relevos/07-publicar.md`
