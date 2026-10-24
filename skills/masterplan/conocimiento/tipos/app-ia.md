# Tipo: App de IA

Producto cuyo valor **es** la respuesta de un modelo: asistente sobre documentos, generador de
contenido, clasificador, agente que ejecuta tareas, chat especializado. Prueba de fuego: si cambias
cada respuesta del modelo por un texto fijo y ya no queda producto, es este tipo. Si queda
producto, es otro tipo con la capacidad IA.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Un ChatGPT para mi sector / mis documentos" | Asistente con recuperación (RAG) |
| "Que genere guiones/copys/propuestas a partir de un brief" | Generador |
| "Que lea los correos y los clasifique" | Clasificación o extracción |
| "Un agente que haga X por mí" | Uso de herramientas (tool use) |
| "Que responda con la información de mi empresa" | Base de conocimiento propia |

## No es este tipo si…

- La IA es una función más dentro de un panel con cuentas y datos propios → `saas` con capacidad IA.
- Corre solo, sin interfaz, por cron o evento → `bot` (con IA dentro).
- Es una API que otros programas llaman → `api` (con IA dentro).

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| api de servidor que llama al modelo (nunca desde el navegador) | Sí | `masterplan:kit-api` |
| auth (para limitar gasto por persona) | Sí | `masterplan:kit-auth` |
| datos: conversaciones, uso y costo | Sí | `masterplan:kit-datos` |
| frontend con streaming y estados de espera | Sí | `masterplan:kit-frontend` |
| observabilidad de costo, latencia y calidad | Sí | `masterplan:kit-observabilidad` |
| deploy | Sí | `masterplan:kit-deploy` |
| recuperación (embeddings, búsqueda vectorial) | Si responde con documentos propios | `masterplan:kit-datos` |
| pagos por uso o por plan | Si cobra | `masterplan:kit-pagos` |

## Decisión clave: cómo se controla la calidad y el gasto

1. **Evaluación antes que prompts bonitos.** Se define un conjunto de 20–50 casos reales con la
   respuesta esperada (o criterio de aceptación) antes de escribir el prompt. Cada cambio de prompt
   o modelo se mide contra ese conjunto.
2. **Tope de gasto.** Límite por usuario y por día, y tope global mensual. Se registra tokens y
   costo de cada llamada.
3. **Contexto: RAG o no.** Si el conocimiento cabe en el prompt y cambia poco, no hay RAG. Si son
   muchos documentos o cambian, embeddings en Postgres (pgvector) dentro de Supabase.

**Recomendación:** el modelo se llama solo desde una Edge Function; salida estructurada validada
con zod cuando la respuesta alimenta lógica; streaming cuando la lee una persona; caché de prompt
para el contexto fijo; set de evaluación en el repo y corriendo en CI.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` / `organizations` / `memberships` | como en `saas.md` | Tenencia por organización si hay equipos |
| `conversations` | `id`, `org_id`, `user_id`, `titulo`, `creado` | |
| `messages` | `conversation_id`, `rol`, `contenido`, `modelo`, `tokens_entrada`, `tokens_salida`, `costo_micros`, `latencia_ms` | Costo en enteros (micro-USD) |
| `documents` (si RAG) | `id`, `org_id`, `titulo`, `fuente`, `estado` | |
| `chunks` (si RAG) | `document_id`, `org_id`, `contenido`, `embedding` (vector), `posicion` | Índice vectorial; RLS por `org_id` |
| `usage_daily` | `org_id`, `fecha`, `tokens`, `costo_micros` | Para topes |
| `feedback` | `message_id`, `voto`, `comentario` | Alimenta el set de evaluación |

## Estructura de carpetas (perfil React + Vite + Supabase)

```
src/
  features/
    chat/              # lista, conversación, streaming, estados
    documentos/        # carga y estado de indexación (si RAG)
    uso/               # consumo y límites visibles
  lib/  data/  env.ts
supabase/
  functions/
    _shared/           # cliente del modelo, topes, registro de costo
    responder/         # llamada principal con streaming
    indexar/           # trocear + embeddings (encolado si es largo)
  migrations/
evals/
  casos.jsonl          # entrada + criterio esperado
  correr.ts            # puntúa y falla si baja del umbral
prompts/               # prompts versionados como archivos, no en strings sueltos
tests/
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | Login, una tarea de IA con streaming, registro de costo, tope por usuario, set de evaluación | Mínima + historial, RAG sobre documentos propios, feedback por respuesta, planes |
| Pasos | 9–11 | 13–16 |
| Non-Goals frecuentes | Varios modelos a elegir, agentes autónomos con muchas herramientas, voz, ajuste fino, multimodal | |

## Orden base de construcción

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, lint, typecheck, test | CUANDO se corren los scripts de calidad en un clon limpio EL SISTEMA DEBE salir con código 0 | Scripts |
| 2 | Set de evaluación inicial (20+ casos) y script que puntúa | CUANDO se corre la evaluación EL SISTEMA DEBE reportar el porcentaje de casos aprobados y salir distinto de 0 bajo el umbral | `npm run eval` |
| 3 | Auth y tenencia con RLS | CUANDO un usuario consulta conversaciones de otra org EL SISTEMA DEBE devolver 0 filas | `npm run db:test` |
| 4 | Edge Function que llama al modelo con la llave solo en servidor | CUANDO el cliente llama a la función sin sesión EL SISTEMA DEBE responder 401 sin llamar al modelo | Test de integración |
| 5 | Registro de tokens, costo y latencia por llamada | CUANDO termina una llamada EL SISTEMA DEBE guardar tokens de entrada y salida, costo y latencia | Test de integración |
| 6 | Topes de gasto por usuario y global | CUANDO un usuario supera su tope diario EL SISTEMA DEBE rechazar la llamada con un mensaje claro y sin costo | Test del tope |
| 7 | Prompt versionado y salida validada | CUANDO el modelo devuelve una salida que no cumple el esquema EL SISTEMA DEBE reintentar una vez y luego mostrar un error recuperable | Test con respuesta simulada |
| 8 | UI con streaming y estados (esperando, escribiendo, error, cancelado) | CUANDO el usuario cancela una respuesta en curso EL SISTEMA DEBE detener el stream y no cobrar tokens no generados | Test de componente |
| 9 | Manejo de fallas del proveedor | CUANDO el proveedor responde 429 o 5xx EL SISTEMA DEBE reintentar con espera creciente hasta 2 veces y luego informar | Test con proveedor simulado |
| 10 | Ingesta de documentos (si RAG), encolada | CUANDO se sube un documento grande EL SISTEMA DEBE indexarlo fuera de la petición y mostrar su estado | Test de integración |
| 11 | Recuperación con aislamiento | CUANDO se busca contexto EL SISTEMA DEBE usar solo fragmentos de la org del usuario | Test de RLS sobre `chunks` |
| 12 | Defensa contra inyección de instrucciones | CUANDO un documento contiene instrucciones para el modelo EL SISTEMA DEBE tratarlas como datos y no ejecutar herramientas por ellas | Casos adversariales en `evals/` |
| 13 | Feedback por respuesta | CUANDO el usuario marca una respuesta como mala EL SISTEMA DEBE guardarla para revisión sin datos de otras orgs | Test |
| 14 | Evaluación en CI | CUANDO un cambio de prompt o modelo baja el puntaje bajo el umbral EL SISTEMA DEBE fallar el pipeline | CI |
| 15 | Flujo principal e2e y deploy | CUANDO un usuario nuevo completa el flujo principal en preview EL SISTEMA DEBE responder sin errores y registrar el costo | `npm run test:e2e` contra preview |

## Trampas típicas

| Trampa | Prevención |
|---|---|
| Llave del modelo en el navegador | Solo Edge Function; la política del plugin lo bloquea |
| "Se ve bien" como criterio de calidad | Set de evaluación con umbral |
| Sin tope: un usuario o un bot gasta el presupuesto del mes en una noche | Topes por usuario y global desde el paso 6 |
| Indexar dentro de la petición HTTP | Encolar y mostrar estado |
| Mezclar fragmentos de varias orgs en la búsqueda vectorial | RLS en `chunks` y filtro por `org_id` |
| Guardar prompts con datos personales en logs de terceros | Revisar retención del proveedor y declararla en `seguridad.md` |
| Cambiar de modelo "porque salió uno nuevo" sin medir | Correr la evaluación antes de cambiar |

## Lista de lanzamiento

- [ ] Límite de gasto configurado también en el panel del proveedor del modelo
- [ ] Términos que expliquen que las respuestas son generadas y pueden fallar
- [ ] Retención de datos del proveedor revisada y declarada en la política de privacidad
- [ ] Evaluación en verde con el modelo y prompt de producción
- [ ] Alerta cuando el costo diario supere el umbral
