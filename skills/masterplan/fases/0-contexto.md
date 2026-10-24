# Fase 0 · Contexto

Objetivo: saber todo lo que ya se puede saber **sin preguntar**, y dejar creado el contrato del
proyecto.

## 1. ¿Hay un proyecto Masterplan aquí?
- Existe `masterplan/proyecto.json` → no empieces de cero. Lee `proyecto.json`, el último archivo de
  `masterplan/relevos/` y `masterplan/buzon/` (si hay mensajes sin leer). Ve a la fase que marca
  `proyecto.json.fase`. Dile a la persona en 3 líneas dónde quedó y qué sigue.
- No existe → sigue.

## 2. ¿Hay código?
Mira el directorio: `package.json`, `requirements.txt`, `supabase/`, `src/`, `.git`.
- **Sí hay código (brownfield):** despacha `masterplan:explorador` con la ruta absoluta. Devuelve un
  Mapa del repo: stack y versiones reales, estructura, comandos de test/lint/build/dev, base de
  datos y migraciones, deploy, convenciones (nombres, imports, estilos), `CLAUDE.md`/`AGENTS.md`
  existentes. Las convenciones del repo mandan sobre las de este plugin. Muestra el mapa y pide
  que corrija lo que esté mal (una sola pregunta).
- **No hay código (greenfield):** sigue.

## 3. Carpeta de contexto
Si existe `contexto/` (o la persona pegó documentos, capturas, links), léela antes de preguntar:
brief, referencias visuales, marca, competencia, notas de reuniones. **`contexto/idea.md` es la idea
contada por la persona en sus palabras** (la guarda el prompt de instalación): úsala como respuesta a
las preguntas de la fase 1 que ya contesta, y no se la vuelvas a pedir. Resume en 5 líneas lo que ya
sabes.

## 4. Crea el contrato
Crea `masterplan/` con la estructura de `plantillas/estructura.md` y `masterplan/proyecto.json` con
`plantillas/proyecto.schema.json` como guía: `nombre` (provisional), `modo`
(greenfield/brownfield), `fase: 1` (o `3` en brownfield), `voz`, `creado`. Crea
`masterplan/decisiones.log` vacío (una línea por decisión: `AAAA-MM-DD | D-001 | texto | fuente`).

Corre `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" estado` para confirmar que el contrato es
válido.

## Puerta
- [ ] `proyecto.json` existe y `masterplan.mjs estado` sale 0
- [ ] Resumen de contexto (o Mapa del repo) mostrado a la persona

Mod activo: llama `mcp__masterplan__registrar` con `fase: 0`.
