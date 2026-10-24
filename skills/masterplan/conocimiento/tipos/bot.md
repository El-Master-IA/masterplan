# Tipo: Bot

Programa que **se despierta solo**: por un horario (cron), por un evento (webhook) o por un
mensaje (WhatsApp, Telegram, Slack, correo). No tiene un panel como producto principal. Su valor
es hacer algo de forma confiable sin que nadie lo empuje: sincronizar, notificar, responder,
procesar.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Que todos los días a las 8 me mande el resumen" | Cron |
| "Cuando entra un pedido en la tienda, que haga X" | Webhook entrante |
| "Un bot de WhatsApp/Telegram que responda" | Canal de mensajería |
| "Que revise la página y me avise si cambia" | Monitoreo programado |
| "Pasar los datos de A a B automáticamente" | Integración |

## No es este tipo si…

- Las personas usan un panel para gestionar la mayor parte → `saas` o `herramienta-interna`
  (el bot es una capacidad o un tipo secundario).
- Lo llama otro programa esperando una respuesta inmediata → `api`.
- El valor está en la conversación con un modelo de IA → `app-ia` (con canal de mensajería).
- Un flujo de n8n/Make/Zapier lo resuelve sin código y sin riesgo → dilo en la fase 2 como
  alternativa antes de construir.

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| api (webhooks entrantes con firma, llamadas salientes) | Sí | `masterplan:kit-api` |
| datos (estado, eventos procesados, cola) | Sí | `masterplan:kit-datos` |
| observabilidad (cada ejecución deja rastro, alertas) | Sí | `masterplan:kit-observabilidad` |
| deploy (cron programado, secretos) | Sí | `masterplan:kit-deploy` |
| auth | Solo si tiene panel o comandos por usuario | `masterplan:kit-auth` |

## Decisión clave: dónde corre y cómo garantiza "una sola vez"

| Pregunta | Recomendación por defecto |
|---|---|
| ¿Cuánto dura una ejecución? | < límite de la función: Edge Function. Más: cola + trabajador dedicado |
| ¿Quién lo despierta? | Cron de la plataforma (pg_cron o cron del hosting), nunca `setInterval` |
| ¿Qué pasa si se ejecuta dos veces? | Idempotencia por id de evento o por clave natural |
| ¿Qué pasa si falla? | Reintento con espera creciente y tope; luego a la tabla de fallidos y alerta |

**Recomendación:** cada evento se registra primero en una tabla (`events`) con id único, se
responde rápido y se procesa aparte. Toda ejecución deja una fila en `runs`.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `events` | `id_externo` único, `fuente`, `tipo`, `payload`, `estado` (`nuevo`/`procesado`/`fallido`), `intentos`, `recibido` | Idempotencia y cola simple |
| `runs` | `id`, `trabajo`, `inicio`, `fin`, `resultado`, `procesados`, `error` | Una fila por ejecución |
| `dead_letter` | `event_id`, `motivo`, `fecha` | Lo que agotó reintentos |
| `contacts` (si conversa) | `canal`, `id_canal`, `consentimiento`, `baja` | Respetar baja y ventanas de mensajería |
| `cursor_state` | `fuente`, `ultimo_cursor`, `actualizado` | Para sincronizaciones incrementales |

RLS activo en todas: solo el rol de servidor escribe; nadie anónimo lee.

## Estructura de carpetas (perfil React + Vite + Supabase)

```
supabase/
  functions/
    _shared/           # verificación de firma, logger, cliente de APIs externas con reintento
    webhook-<fuente>/  # recibe, verifica, registra en events, responde 2xx
    worker-<trabajo>/  # procesa events pendientes de forma idempotente
    cron-<trabajo>/    # lo llama el cron programado
  migrations/          # tablas + programación de pg_cron
  tests/
src/                   # opcional: panel mínimo de runs y fallidos
tests/
  fixtures/            # payloads reales anonimizados de cada fuente
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | 1 disparador, 1 acción, registro de runs, alerta de fallo | Mínima + idempotencia completa, reintentos con tope, dead letter, panel de runs, reproceso manual |
| Pasos | 6–8 | 10–12 |
| Non-Goals frecuentes | Varias fuentes, panel de configuración, multi-cliente, IA en las respuestas, métricas avanzadas | |

## Orden base de construcción

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, lint, typecheck, test | CUANDO se corren los scripts de calidad en un clon limpio EL SISTEMA DEBE salir con código 0 | Scripts |
| 2 | Supabase local, secretos por entorno validados | CUANDO falta un secreto al arrancar una función EL SISTEMA DEBE fallar con el nombre de la variable, sin imprimir valores | Test de configuración |
| 3 | Tablas `events`, `runs`, `dead_letter` con RLS | CUANDO un anónimo consulta cualquiera de estas tablas EL SISTEMA DEBE devolver 0 filas | `npm run db:test` |
| 4 | Webhook con verificación de firma | CUANDO llega un evento con firma inválida EL SISTEMA DEBE responder 401 y no registrarlo | Test con fixture firmado y falso |
| 5 | Registro idempotente del evento | CUANDO llega dos veces el mismo `id_externo` EL SISTEMA DEBE guardarlo una sola vez y responder 2xx ambas | Test de repetición |
| 6 | Trabajador que procesa pendientes | CUANDO el trabajador procesa un evento EL SISTEMA DEBE marcarlo `procesado` solo si la acción terminó | Test de integración |
| 7 | Cliente de API externa con reintento y tope | CUANDO la API externa responde 5xx EL SISTEMA DEBE reintentar con espera creciente hasta el tope y luego mover a `dead_letter` | Test con servidor simulado |
| 8 | Cron programado | CUANDO llega la hora programada EL SISTEMA DEBE crear una fila en `runs` con su resultado | Test que invoca la función de cron |
| 9 | Alertas de fallo | CUANDO un evento llega a `dead_letter` EL SISTEMA DEBE avisar a la persona responsable por el canal definido | Test con canal simulado |
| 10 | Respeto de baja y límites del canal (si conversa) | CUANDO un contacto pidió baja EL SISTEMA DEBE no enviarle mensajes | Test de la regla |
| 11 | Panel mínimo o comando de reproceso | CUANDO se pide reprocesar un fallido EL SISTEMA DEBE procesarlo una sola vez aunque se pida dos | Test |
| 12 | Deploy con secretos y cron activos | CUANDO se despliega a preview EL SISTEMA DEBE usar credenciales de prueba y no tocar cuentas reales | Smoke con evento de prueba |

## Trampas típicas

| Trampa | Prevención |
|---|---|
| Procesar dentro del webhook y tardar | Responder rápido, procesar aparte |
| Mensajes duplicados al cliente por reintentos | Idempotencia en `events` y en el envío |
| Bot que falla en silencio por semanas | `runs` + alerta + health del último run |
| Llamar APIs externas sin límite y quedar bloqueado | Respetar límites del proveedor, espera creciente |
| Cron que se solapa consigo mismo | Bloqueo (advisory lock) o "si hay un run en curso, salir" |
| Payloads con datos personales en los logs | Registrar ids, no cuerpos |

## Lista de lanzamiento

- [ ] Webhooks registrados en cada proveedor con la URL de producción y su secreto
- [ ] Plantillas de mensajes aprobadas por el canal (si aplica)
- [ ] Alerta de fallo probada llegando a una persona real
- [ ] Prueba con un evento real de producción, revisado a mano
- [ ] Procedimiento de pausa (apagar el cron) escrito
