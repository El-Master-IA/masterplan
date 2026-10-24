# Fase 3 · Diseñar

Objetivo: la columna vertebral del sistema. Solo se fijan las decisiones que, si se cambian
después, obligan a reescribir. Todo lo demás se deja al constructor.

Antes de empezar dile a la persona cuánto va a tardar (normalmente 10–20 min) y que verás avances.

## 1. Perfil y capacidades
- Elige el perfil de `conocimiento/perfiles/` (por defecto `react-vite-supabase-vercel.md`) salvo
  restricción real del repo o de la persona.
- Lista las capacidades que el alcance exige: auth, datos, api, frontend, pagos, deploy,
  observabilidad, correo, archivos, tiempo real, IA. Para cada una hay un kit
  (`masterplan:kit-*`): lee su SKILL.md antes de decidirla.
- Revisa `conocimiento/compatibilidad.md`.
- Despacha `masterplan:investigador` en segundo plano con la lista de paquetes del perfil: devuelve
  versión estable actual, fuente y fecha. Se usa en la fase 5.

## 2. Atributos de calidad
Elige 3 que mandan y uno que se sacrifica (ver `conocimiento/fundamentos.md`): disponibilidad,
seguridad, privacidad, rendimiento, costo, velocidad de cambio, accesibilidad. Escríbelos en
`arquitectura.md`.

## 3. Documentos (usa `plantillas/`)
Escríbelos en este orden; cada uno lee los anteriores.

| Documento | Quién | Debe contener |
|---|---|---|
| `masterplan/arquitectura.md` | tú | C4 nivel 1 y 2 en mermaid, atributos de calidad, estilo (monolito modular por defecto), ADR-001 con la decisión más cara de revertir |
| `masterplan/datos.md` | `masterplan:arquitecto-datos` | Entidades, dueño de cada fila (`org_id`/`user_id`), qué pasa al borrar, dinero en enteros, índices por consulta, retención de datos personales |
| `masterplan/seguridad.md` | `masterplan:arquitecto-datos` + tú | Mapa de amenazas (STRIDE corto por capacidad), matriz rol × recurso × acción, políticas RLS por tabla, secretos por entorno, régimen de privacidad (Habeas Data/GDPR) |
| `masterplan/api.md` | tú (con `masterplan:kit-api`) | Contratos por endpoint/función: entrada, salida, errores, auth, límite de uso, idempotencia |
| `masterplan/DESIGN.md` | `masterplan:disenador` | Tokens (color con contraste calculado, tipografía, espacio, radio, sombra, motion), componentes base, lista de "no usar" |
| `masterplan/EXPERIENCE.md` | `masterplan:disenador` | Mapa de pantallas, estados por pantalla (cargando/vacío/error/sin permiso), flujo principal, accesibilidad, textos clave |
| `masterplan/specs/<capacidad>.md` | tú | Requisitos EARS numerados (`AUTH-001`), cada uno verificable |

Regla de silencio cero: cada dimensión queda decidida, pospuesta (Non-Goal) o como pregunta
`[ABIERTA: pregunta — bloquea X]` en el documento.

## 4. Costos
En `arquitectura.md`, tabla de costo mensual a 1× y 10× por servicio y el punto donde el precio
salta. Usa los planes vigentes; si no los verificaste hoy, márcalo "verificar".

## Puerta
- [ ] Los 7 documentos existen y `node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" validar` no
      reporta BLOCKER de estructura
- [ ] `proyecto.json`: `perfil`, `capacidades[]`, `calidad`, `fase: 4`
- [ ] Relevo `relevos/03-disenar.md` y propuesta de sesión nueva para las puertas
