---
description: Corre la auditoría de seguridad y de frontend de la fase 7 bajo demanda, solo lectura, y fusiona los hallazgos
argument-hint: "[seguridad | frontend | todo] [URL de preview opcional]"
---

Carga la skill `masterplan` y la skill `masterplan:auditor`. Esta auditoría solo lee: no arregla
nada sin aprobación de la persona.

Argumentos: $ARGUMENTS (por defecto `todo`; sin URL, el auditor de frontend usa el servidor local
si está corriendo o audita por lectura de código).

1. Confirma que existe `masterplan/proyecto.json` y lee `masterplan/seguridad.md`,
   `masterplan/DESIGN.md` y `masterplan/EXPERIENCE.md` solo para pasar sus rutas.
2. Despacha en paralelo, en un solo mensaje, lo que pide el argumento:
   `masterplan:auditor-seguridad` (alcance `repo`) y `masterplan:auditor-frontend` (con la URL).
   Pásales rutas absolutas.
3. Guarda cada JSON devuelto y corre
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" auditoria fusionar` para obtener
   `masterplan/auditoria/<fecha>.json`. Si existe una auditoría anterior, corre también
   `masterplan.mjs auditoria comparar` y muestra qué se cerró y qué es nuevo.
4. Presenta dos notas separadas, nunca mezcladas: **Seguridad** y **Calidad de experiencia**, cada
   una con conteo por severidad y los 3 hallazgos más graves con archivo:línea.
5. Pregunta una sola cosa: si arreglar los críticos y altos ahora (uno por uno con
   `masterplan:constructor`, re-auditando al final) o dejarlos registrados.
