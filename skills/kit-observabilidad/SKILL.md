---
name: kit-observabilidad
description: >-
  Saber qué pasa en producción sin exponer datos personales: logs estructurados con request id,
  errores con Sentry sin PII, 4 a 6 métricas con alerta, health check que toca la base, monitoreo
  de disponibilidad, analítica de la métrica de éxito como eventos y costo mensual a 1× y 10×.
  Úsala en la fase 3 (arquitectura.md), 5, 7 y 8, y en tareas con kit masterplan:kit-observabilidad.
  EN: structured logging, error tracking without PII, alerts, health checks, uptime, product
  analytics events, cost model.
---

# Kit · Observabilidad

Si algo se rompe, debes enterarte tú antes que tu cliente, y poder seguir una petición de punta a
punta con un solo id. Si funciona, debes poder probar con un número que funciona.

## Cuándo aplica
- Todo proyecto que llega a producción.
- La métrica de éxito de la fase 1 (`proyecto.json.metricaExito`) siempre se vuelve un evento.

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "Si el sistema se cae a las 3 a. m., ¿quién se entera y por dónde?" | Tú, por correo y Telegram/WhatsApp | Canal de alertas |
| 2 | "¿Qué acción de un usuario te dice que el producto le sirvió?" | La de `metricaExito` | Evento principal y embudo |
| 3 | "¿Aceptas una herramienta de analítica que use cookies?" | No: analítica sin cookies ni datos personales | Sin banner de consentimiento vs. con banner |

## Decisión
| Si… | Entonces… | Por qué |
|---|---|---|
| Hay Edge Functions | Logger JSON propio (`nivel`, `mensaje`, `requestId`, `funcion`, `orgId`, `duracionMs`) | Se filtra y agrupa en los logs de Supabase |
| Llega una petición | `requestId` desde `x-request-id` o nuevo; se devuelve en la respuesta y en el sobre de error | El soporte pide ese id y encuentras todo |
| Hay errores en el navegador o en funciones | Sentry con `sendDefaultPii: false`, `beforeSend` que borra correos, tokens y cuerpos | Ves el error, no los datos de la persona |
| Hay que identificar al usuario en un error | Solo `user.id` y `org_id` (uuid) | Suficiente para investigar, nada personal |
| Se necesita saber si está vivo | Endpoint `/health` (Edge Function) que hace una consulta trivial a la base con tiempo límite | "Responde" no es "funciona": debe tocar la base |
| Se monitorea disponibilidad | Servicio externo de uptime cada 1–5 min sobre `/health` y la página principal | Detecta caídas cuando nadie está mirando |
| Se mide el producto | Eventos con nombre `objeto_accion` (`proyecto_creado`) a analítica sin cookies (Vercel Analytics, Plausible o PostHog sin cookies) | Mide sin consentimiento extra |

## Métricas con alerta (elige 4 a 6)
| Métrica | Umbral por defecto | Alerta a |
|---|---|---|
| Health check fallando | 2 fallas seguidas | inmediato |
| Tasa de errores 5xx en funciones | > 2 % en 10 min | inmediato |
| Errores nuevos en Sentry | primer evento de un error nuevo | diario o inmediato si es en pagos/auth |
| Latencia p95 de la función principal | > 1,5 s en 15 min | diario |
| Webhooks con error o pendientes | > 0 sin procesar por 15 min | inmediato |
| Trabajos fallidos en cola | > 5 en 1 h | diario |
| Uso de la base (disco, conexiones) | > 80 % del plan | semanal |

## Costo mensual
En `arquitectura.md`, tabla por servicio a 1× (usuarios esperados al lanzar) y 10×, con el punto
donde cambia de plan: hosting, base, correo, errores, analítica, uptime, IA si hay, pagos
(comisión por transacción). Precios verificados en la sesión con fuente y fecha, o "verificar".

## Archivos que produce
```
supabase/functions/_shared/log.ts          logger JSON y requestId
supabase/functions/health/index.ts
src/lib/sentry.ts                           inicialización con filtro de PII
src/lib/analitica.ts                        track(evento, props) con lista cerrada de eventos
masterplan/operacion.md                     métricas, umbrales, canal de alertas, qué hacer con cada alerta
```

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| OBS-01 | Toda Edge Function registra con el logger JSON e incluye `requestId` | grep de `console.log(` crudo en `supabase/functions` |
| OBS-02 | Ningún log ni evento incluye correo, teléfono, documento, tokens, contraseñas ni cuerpos de pago | grep de campos sensibles en llamadas a `log`/`track`/`Sentry` |
| OBS-03 | Sentry con `sendDefaultPii: false` y `beforeSend` que limpia datos | grep en `src/lib/sentry.ts` |
| OBS-04 | `/health` consulta la base y responde 503 si falla | test |
| OBS-05 | Existe monitoreo externo de uptime sobre `/health` | evidencia en `operacion.md` |
| OBS-06 | La métrica de éxito tiene evento instrumentado y aparece en la analítica | test E2E que espera la llamada |
| OBS-07 | De 4 a 6 métricas con umbral, canal y acción escrita | `operacion.md` |
| OBS-08 | Tabla de costo a 1× y 10× presente | `masterplan.mjs validar` |

## Pasos que agrega al plan
**Logger, requestId y health**
- CUANDO una función responde EL SISTEMA DEBE incluir `x-request-id` y registrar una línea JSON con duración.
- CUANDO la base no responde en 2 s EL SISTEMA DEBE devolver 503 en `/health`.
- Verificar: `npx vitest run tests/observabilidad/health.test.ts`

**Errores sin datos personales**
- CUANDO ocurre un error en el navegador EL SISTEMA DEBE enviarlo a Sentry sin correo ni cuerpo de la petición.
- Verificar: `npx vitest run tests/observabilidad/sentry.test.ts` (prueba `beforeSend` con un evento con PII)

**Evento de éxito**
- CUANDO el usuario completa la acción de `metricaExito` EL SISTEMA DEBE emitir el evento con `org_id` y sin datos personales.
- Verificar: `npx playwright test e2e/analitica.spec.ts`

**Alertas y uptime** (fase 7)
- CUANDO `/health` falla dos veces seguidas EL SISTEMA DEBE avisar por el canal elegido.
- Verificar: prueba manual de alerta registrada en `masterplan/evidencia/alerta.txt`

## Pruebas obligatorias
1. Health con base disponible y simulando caída.
2. `beforeSend` elimina PII de un evento fabricado.
3. Evento de éxito emitido en el E2E del flujo principal.
4. Una alerta real disparada y recibida antes del lanzamiento.

## Lista de producción
- [ ] DSN de Sentry de producción y source maps subidos sin publicarlos
- [ ] Uptime activo sobre producción
- [ ] Alertas llegan al canal elegido (probado)
- [ ] Analítica recibe eventos de producción, no de previews
- [ ] `operacion.md` con qué hacer ante cada alerta

## Trampas
- Health que devuelve 200 sin tocar la base: el sistema "vive" mientras nadie puede entrar.
- Loguear el cuerpo de la petición completo "para depurar": queda la información de pagos y correos.
- Alertas por todo: a la semana nadie las mira. Pocas, con acción clara.
- Mezclar eventos de preview y producción en la misma analítica.
- Source maps públicos en producción: exponen el código fuente completo.
