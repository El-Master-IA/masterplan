# Estructura de `masterplan/` en el proyecto

Se crea en la fase 0, en la raíz del proyecto de la persona. Lo que no existe todavía se crea
cuando su fase lo pide; las carpetas vacías se crean desde el inicio.

```
masterplan/
  proyecto.json          # contrato del proyecto: fase, tipo, alcance, perfil, versiones, aprobaciones (proyecto.schema.json)
  decisiones.log         # una línea por decisión: AAAA-MM-DD | D-001 | texto | fuente
  arquitectura.md        # C4 nivel 1 y 2, atributos de calidad, ADRs, costos, riesgos (fase 3)
  datos.md               # entidades, dueño de cada fila, borrado, índices, retención (fase 3)
  seguridad.md           # STRIDE por capacidad, matriz rol×recurso×acción, RLS, secretos, privacidad (fase 3)
  api.md                 # contrato por endpoint o función: entrada, salida, errores, auth, límites (fase 3)
  DESIGN.md              # tokens visuales, componentes base, "No usar", presupuestos de rendimiento (fase 3)
  EXPERIENCE.md          # mapa de pantallas, estados por pantalla, flujo principal, accesibilidad (fase 3)
  specs/
    <capacidad>.md       # requisitos EARS numerados (AUTH-001, DATA-001…) que describen el sistema HOY
  cambios/
    <fecha>-<slug>/      # un cambio en curso: delta.md + tareas propias (fase 8)
    archivo/             # cambios ya publicados y aplicados a specs/
  plan/
    tareas.json          # tareas con olas, criterios EARS, verificación y checkpoint (tareas.schema.json)
    gate.md              # comandos que deben salir 0 al final + lista de lanzamiento manual
  relevos/
    <NN>-<fase>.md       # relevo al cerrar cada fase u ola (relevo.md)
  buzon/
    <fecha>-<de>-<para>.md  # mensajes entre sesiones cuando el mod de sesiones no está activo
  olas/
    ola-<n>/<id>.brief.md   # brief autocontenido de cada tarea de la ola, para su sesión (masterplan.mjs ola)
  backlog.md             # hallazgos que no bloquean (MINOR, bajas, ESPECULATIVO), una línea cada uno
  evidencia/
    <id>.txt             # salida de los comandos de verificación de cada tarea (un solo archivo)
    gate.txt             # salida del gate global
    excepciones.log      # excepciones a políticas con su motivo
  auditoria/
    <fecha>.json         # hallazgos fusionados de los auditores
    <fecha>.md           # resumen con nota de Seguridad y nota de Calidad de experiencia
```

Fuera de `masterplan/`, en la raíz del proyecto:

```
CLAUDE.md                # instrucciones cortas para el constructor (claude-proyecto.md), fase 5
AGENTS.md                # copia equivalente para otras herramientas
contexto/                # opcional: documentos, capturas y referencias que trae la persona
```

Reglas:
- `proyecto.json` y `plan/tareas.json` se modifican con `masterplan.mjs` cuando hay comando para
  ello (`tarea <id> <estado>`), para no romper el esquema.
- `evidencia/` y `auditoria/` se versionan en git: son la prueba de que el trabajo se hizo.
- Ningún archivo de `masterplan/` contiene secretos.
