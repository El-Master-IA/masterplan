# Fase 5 · Planear

Objetivo: un plan que otra sesión, sin contexto, ejecute sin preguntar nada.

## 1. Versiones
Usa el reporte de `masterplan:investigador` de esta sesión (despáchalo si no hay). Cada paquete en
`proyecto.json.versiones` con `{version, fuente, verificado}`. Lo no verificado: "verificar antes de
instalar".

## 2. Orden de construcción
Parte del orden base del archivo del tipo (`conocimiento/tipos/<tipo>.md`) y de la sección "Pasos
que agrega al plan" del `construccion.md` de cada kit del proyecto. Reglas:
- **Primero el esqueleto que corre** (`conocimiento/bases-tecnicas.md`). La ola 1 (y la 2 si no
  cabe) no construye funciones: deja el proyecto con lint, typecheck, pruebas, build y CI en
  verde, la estructura del perfil con sus reglas de límites de importación, la configuración
  validada, el formato de error, una pantalla o endpoint real que atraviesa todas las capas con
  su prueba, el login si lo hay y el despliegue a vista previa. La tarea que lo cierra lleva
  `"hito": "esqueleto"`. Si la cuenta de despliegue no está conectada, anótalo con
  `masterplan.mjs auto pendiente` y el esqueleto se prueba con build y arranque local.
- Seguridad y datos antes que pantallas: tenencia y RLS con su test de aislamiento antes del CRUD.
- **Cortes verticales, no capas.** No construyas toda la base, luego todas las funciones y al final
  las pantallas. Tras los cimientos (proyecto, acceso, tablas del flujo principal), arma el primer
  corte completo: datos de semilla → función/API mínima → pantalla del flujo principal, de modo que
  una persona real pueda usarlo antes de la mitad de las olas. Marca esa tarea con `"hito": "visible"`.
  Lo secundario (ajustes completos, historiales, atajos, reportes) viene después.
- **Núcleo vs ampliación.** Marca cada tarea con `"fase_producto": "nucleo"` (el flujo principal)
  o `"ampliacion"` (se puede mover a v1.1 sin romper nada). Una tarea del núcleo no depende de una
  ampliación; el validador lo comprueba.
- **Contrasta antes de construir.** Una integración externa (API de un tercero) se prueba con una
  respuesta real grabada **antes** de la tarea que la consume; si no hay llave, la tarea de
  contraste queda en la lista de preparación humana y bloquea esa ola, no la anterior.
- Cada paso cabe en una sentada: ≤5 archivos, 2–6 criterios (uno de error como mínimo).
- Ningún paso rompe la verificación de uno anterior.
- Lo que depende de terceros (aprobación de tiendas, DNS, pagos reales) va a la lista de
  lanzamiento, no a un paso.

## 3. Formato de cada tarea (`plan/tareas.json`, ver `plantillas/tareas.schema.json`)
```json
{
  "id": "T05",
  "titulo": "Guard de tenencia y test de aislamiento",
  "ola": 2,
  "depende": ["T03", "T04"],
  "agente": "masterplan:constructor",
  "kit": "masterplan:kit-auth",
  "specs": ["AUTH-004", "DATA-002"],
  "archivos": ["supabase/migrations/…_rls.sql", "src/lib/tenancy.ts", "tests/rls.test.ts"],
  "hacer": "Una función de autorización que toda consulta usa; políticas RLS por org.",
  "criterios": [
    "CUANDO un usuario de la org A pide un registro de la org B EL SISTEMA DEBE responder vacío/404",
    "CUANDO un anónimo consulta una tabla con datos EL SISTEMA DEBE devolver 0 filas"
  ],
  "verificar": ["npm run test -- tests/rls.test.ts"],
  "checkpoint": "git add -A && git commit -m \"T05: guard de tenencia\" && git tag mp-T05",
  "estado": "pendiente"
}
```
Los archivos generados por herramientas (migraciones con fecha, lockfiles) se nombran con patrón,
no con nombre inventado.

`hacer` tiene como máximo **600 caracteres**: qué hacer y qué decisión tomar, nada más. El detalle
(formas de datos, casos borde, mensajes) vive en la spec citada; no lo copies a la tarea. Campos
opcionales: `"fase_producto"`, `"hito"` (`"esqueleto"` o `"visible"`) y, en construcción, `"sesion"` (lo escribe el conductor).

## 4. Olas
Agrupa en olas: dentro de una ola ninguna tarea comparte archivos ni depende de otra. Cada tarea de
una ola corre en su propia sesión (fase 6, `masterplan.mjs ola`), así que **prefiere olas anchas y
pocas**: cuantas más tareas independientes por ola, más rápido avanza el proyecto. Si
`proyecto.json.entorno.paralelo_base` es `false`, agrupa en la misma ola como máximo una tarea que
toque la base de datos.

## 5. Gate global
En `plan/gate.md`: los comandos que deben salir 0 al final (install, typecheck, lint, test, test
e2e, build, correr lo construido, auditoría) y la lista de lanzamiento manual. Marca cuáles forman
el **gate rápido** (lint, typecheck y pruebas unitarias y de integración): es lo que el conductor
corre una vez al integrar cada ola. El validador exige lint, typecheck, pruebas y build.

## 6. Herramienta en el repo
Copia `${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs` a `masterplan/bin/masterplan.mjs` del proyecto
(el CI no tiene el plugin instalado) y agrega a `package.json` el script
`"mp:deriva": "node masterplan/bin/masterplan.mjs deriva"`, que el CI de `masterplan:kit-deploy` corre en cada PR.

## 7. Workspace del constructor
Escribe en la raíz del proyecto un `CLAUDE.md` corto (≤150 líneas) desde
`plantillas/claude-proyecto.md`: comandos primero, convenciones, "prueba real antes de decir listo",
"solo lo que pide la tarea", lista de patrones visuales prohibidos y cómo pedir la siguiente tarea.
Copia `AGENTS.md` igual de corto para otras herramientas.

## Puerta
- [ ] `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" validar` → 0 BLOCKER (revisa tareas, olas, criterios, verify, referencias a specs)
- [ ] `masterplan:revisor-plano` sobre el plan, **una sola vuelta** (revisa lo que el script no
      puede: criterio de error, pasos que rompen pasos anteriores, aislamiento antes del CRUD).
      Corrige BLOCKER y MAJOR y vuelve a correr `validar`; no se despacha de nuevo.
- [ ] `proyecto.json`: `fase: 6`
- [ ] Fin del tramo **Diseñar y aprobar**: `masterplan.mjs relevo 05-planear`. Corre `masterplan.mjs auto --json --registrar`: con autonomía continua lanza tú la sesión de construcción; si no, propón: "Abre una sesión nueva en esta carpeta y dime: *Sigamos con mi proyecto*, para construir."
