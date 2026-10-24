---
description: Audita un proyecto, se haya hecho con Masterplan o no (Lovable, Bolt, v0, a mano), en tres notas separadas (Seguridad, Calidad de experiencia y Bases técnicas). Solo lee y entrega un plan de arreglos
argument-hint: "[todo | seguridad | frontend | bases] [URL de preview opcional]"
---

Carga la skill `masterplan` y la skill `masterplan:auditor`. Esta auditoría **solo lee**: no cambia,
instala ni publica nada sin aprobación de la persona.

Argumentos: $ARGUMENTS (por defecto `todo`; sin URL, el auditor de frontend usa el servidor local
si está corriendo o audita por lectura de código).

## 0. ¿Qué proyecto es?
- **Existe `masterplan/proyecto.json`** → modo proyecto Masterplan. Lee `masterplan/seguridad.md`,
  `masterplan/DESIGN.md`, `masterplan/EXPERIENCE.md`, `masterplan/arquitectura.md` y
  `masterplan/datos.md` solo para pasar sus rutas a los auditores.
- **No existe** → **modo auditor** (proyecto hecho con otra herramienta o a mano):
  1. Si la carpeta está vacía o no tiene código, pregunta dónde está el proyecto (ruta o link de
     GitHub). Con un link, clónalo en una carpeta hermana, nunca encima de otra cosa.
  2. Si `contexto/auditoria.md` existe, léelo: es lo que la persona contó (con qué lo hizo, qué le
     preocupa, si ya está en producción).
  3. Despacha `masterplan:explorador` con la ruta absoluta y guarda el Mapa del repo en
     `masterplan/auditoria/mapa.md`. Muéstrale a la persona un resumen de 5 líneas (qué es, stack,
     dónde vive, si tiene datos de clientes o pagos) y sigue sin esperar respuesta, salvo que el
     mapa no encuentre código.
  4. No crees `masterplan/proyecto.json`: en modo auditor solo existe `masterplan/auditoria/`.

## 1. Auditores en paralelo
Despacha en un solo mensaje lo que pide el argumento, con rutas absolutas y el Mapa del repo:
- `masterplan:auditor-seguridad` (alcance `repo`) → guarda su JSON en
  `masterplan/auditoria/pendientes/seguridad.json`.
- `masterplan:auditor-frontend` (con la URL si hay) → `pendientes/frontend.json`.
- `masterplan:auditor-bases` → `pendientes/bases.json`.

Cada archivo lleva solo el arreglo JSON que devolvió el agente. Si un agente no devolvió JSON
válido, vuelve a pedírselo una vez; si falla otra vez, dilo en el informe.

## 2. Fusionar
`node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" auditoria fusionar` deja
`masterplan/auditoria/<fecha>.json` y `<fecha>.md` con las notas, "Qué arreglar primero" y todos
los hallazgos. Si existe una auditoría anterior, corre también `masterplan.mjs auditoria comparar`
y muestra qué se cerró y qué es nuevo.

## 3. Informe para la persona
Escribe `masterplan/auditoria/INFORME.md` en el idioma y la voz de la persona (de negocio si no es
técnica):
1. **Veredicto en una línea:** ¿se puede usar con clientes reales hoy? (sí / sí, con arreglos / no
   todavía) y por qué.
2. **Las tres notas por separado**, nunca promediadas, y lo que no se auditó.
3. **Los 5 riesgos más graves** en lenguaje de negocio ("cualquiera puede ver los pedidos de otros
   clientes"), cada uno con archivo:línea y el arreglo propuesto.
4. **Lo que ya está bien** (de las salidas de los auditores).
5. **Plan de arreglos en olas:** ola 1 críticos y altos de seguridad; ola 2 bases (respaldos,
   pruebas, errores); ola 3 experiencia. Cada arreglo con su tamaño (pequeño / medio / grande).

Muéstrale el veredicto, las notas y los 5 riesgos en el chat; el resto queda en el archivo.

## 4. Una sola pregunta al final
Ofrece, con tu recomendación, una de estas tres:
- **Arreglar la ola 1 ahora:** un `masterplan:constructor` por hallazgo, con un commit por arreglo
  (crea antes una rama `auditoria/<fecha>` si el repo usa git) y re-auditoría de lo arreglado al
  final. Nada sale a producción sin confirmación.
- **Seguir construyendo con Masterplan:** convierte el proyecto en uno de Masterplan (fase 0 en
  modo brownfield → fase 3 solo para el delta) usando el mapa y la auditoría como punto de partida.
- **Dejarlo registrado:** el informe queda en `masterplan/auditoria/` para cuando quiera.
