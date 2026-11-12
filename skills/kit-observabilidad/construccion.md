# Kit · observabilidad · construcción

Segunda mitad del kit `masterplan:kit-observabilidad`. Las decisiones y los candados están en `SKILL.md`.

## Archivos que produce
```
supabase/functions/_shared/log.ts          logger JSON y requestId
supabase/functions/health/index.ts
src/lib/sentry.ts                           inicialización con filtro de PII
src/lib/analitica.ts                        track(evento, props) con lista cerrada de eventos
masterplan/operacion.md                     métricas, umbrales, canal de alertas, qué hacer con cada alerta
```

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
