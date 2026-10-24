---
name: kit-pagos
description: >-
  Cobros y suscripciones con enfoque LatAm: elegir proveedor por país y modelo (Stripe, Mercado
  Pago, Wompi con PSE/Nequi, Lemon Squeezy como merchant of record), checkout creado en el
  servidor, webhooks firmados sobre el cuerpo crudo con idempotencia por id de evento, estado de
  suscripción escrito solo por webhook, gating de plan en el servidor, reembolsos, modo prueba y
  checklist de facturación electrónica (DIAN, SAT). Úsala cuando el alcance cobre dinero, en fases
  3, 5, 6 y 7. EN: payments, subscriptions, provider choice for Latin America, webhooks, plan gating.
---

# Kit · Pagos

El dinero solo se mueve con datos que el servidor decide y el proveedor confirma. El navegador
pide; el webhook firmado es el que dice que se pagó.

## Cuándo aplica
- El producto cobra: suscripción, pago único, créditos o marketplace.
- Siempre junto con `masterplan:kit-api` (webhooks, idempotencia) y `masterplan:kit-datos`
  (dinero en enteros).

## Qué se construye y qué es asesoría
| Se construye completo | Solo asesoría y checklist (lo hace la persona con su contador o el proveedor) |
|---|---|
| Checkout en servidor, webhooks, tablas de pagos y suscripciones, gating de plan, portal o pantalla de facturación, reembolsos desde el panel interno, pruebas en modo prueba | Abrir y verificar la cuenta del proveedor, régimen tributario, facturación electrónica ante DIAN o SAT, retenciones, contratos y términos de venta, conciliación contable |

Dilo así a la persona antes de planear. Ningún paso del plan marca "facturación legal lista".

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿En qué país está registrada tu empresa (o tú como persona) y en qué países están tus clientes?" | Empresa y clientes en Colombia | Proveedor y medios de pago (ver tabla) |
| 2 | "¿Cobras mensual, una vez, o por uso?" | Mensual con plan gratis limitado | Suscripciones y webhooks de renovación vs. pago único |
| 3 | "¿Quieres que otro se encargue de impuestos y facturas en el exterior?" | Sí si vendes software a muchos países; no si vendes sobre todo en tu país | Merchant of record vs. proveedor directo |

## Decisión: proveedor
| Si… | Entonces… | Por qué |
|---|---|---|
| Empresa en Colombia, clientes en Colombia | Wompi (tarjeta, PSE, Nequi, Bancolombia) | Medios locales que la gente sí usa; liquida en pesos |
| Empresa en Colombia, clientes en varios países de LatAm | Mercado Pago en los países donde opera, o Wompi + merchant of record para el resto | Cobertura local sin abrir entidades |
| Empresa en México, Brasil, Chile o EE. UU. con suscripciones | Stripe (Billing, Checkout, portal de cliente) | Mejor manejo de suscripciones y pruebas; verificar disponibilidad del país hoy |
| Venta de software a todo el mundo y no quieres manejar impuestos extranjeros | Lemon Squeezy u otro merchant of record | Él vende, factura y paga impuestos; tú recibes el neto |
| Marketplace (pagas a terceros) | Stripe Connect o Mercado Pago con split; diseño aparte | Requiere verificación de terceros: más alcance, considerar Non-Goal |
| Solo validar la idea | Enlace de pago del proveedor + webhook mínimo | Cobrar antes de construir el sistema completo |

Disponibilidad de países, medios y comisiones cambian: el agente `masterplan:investigador`
los verifica en la documentación oficial en la sesión y deja fuente y fecha.

## Decisión: modelo de datos
| Tabla | Quién la escribe | Contenido mínimo |
|---|---|---|
| `clientes_pago` | Servidor al crear el primer checkout | `org_id`, `proveedor`, `cliente_externo_id` |
| `suscripciones` | **Solo** el webhook | `org_id`, `plan`, `estado`, `periodo_fin`, `cancelar_al_final`, `externo_id` |
| `pagos` | **Solo** el webhook | `org_id`, `monto_centavos bigint`, `moneda`, `estado`, `externo_id unique` |
| `eventos_webhook` | Webhook antes de procesar | `proveedor`, `evento_id unique`, `tipo`, `recibido_at`, `procesado_at`, `error` |
| `planes` | Migración / seed | `codigo`, `precio_centavos`, `moneda`, `limites jsonb`, `externo_precio_id` |

RLS: miembros leen lo de su org; nadie escribe desde el cliente (sin políticas de insert/update).

## Archivos que produce
```
supabase/migrations/<ts>_pagos.sql
supabase/functions/crear-checkout/index.ts       monto y precio desde la tabla planes, nunca del cliente
supabase/functions/webhook-<proveedor>/index.ts
supabase/functions/portal-facturacion/index.ts   (si el proveedor lo ofrece)
supabase/functions/_shared/plan.ts               exigirPlan(orgId, capacidad)
src/features/facturacion/                        precios, estado de suscripción, historial
tests/pagos/*.test.ts                            con eventos de prueba firmados
docs/pagos-lanzamiento.md                        checklist manual y facturación electrónica
```

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| PAG-01 | El monto, la moneda y el precio se toman del servidor (`planes`); el cliente solo envía el código del plan | grep de `amount`/`monto` leído del body en `crear-checkout` |
| PAG-02 | El webhook verifica la firma del proveedor sobre el cuerpo crudo antes de parsear | grep (igual que API-03) + test con firma inválida |
| PAG-03 | `eventos_webhook.evento_id` es único y el procesamiento es idempotente | migración + test de evento repetido |
| PAG-04 | `suscripciones` y `pagos` solo se escriben desde el webhook (sin políticas de escritura para `authenticated`) | `pg_policies` + grep de `.from('suscripciones').insert` en `src/` |
| PAG-05 | El acceso por plan se decide en el servidor (RLS o `exigirPlan`), nunca solo en la UI | revisión + test |
| PAG-06 | La página de "pago exitoso" no activa nada; solo muestra el estado que dejó el webhook | grep de escrituras en la ruta de retorno |
| PAG-07 | Llaves secretas del proveedor solo en secretos de funciones; nunca con prefijo `VITE_` | ver DEP-02 |
| PAG-08 | Llaves de prueba y de producción separadas por entorno; producción nunca usa llaves de prueba | `.env.example` + revisión de entornos |
| PAG-09 | Montos en `bigint` de unidad mínima con moneda explícita | ver DAT-05 |
| PAG-10 | Eventos fuera de orden no retroceden el estado (se compara fecha del evento o versión) | test |

## Pasos que agrega al plan
**Tablas y planes**
- CUANDO un usuario autenticado intenta insertar en `suscripciones` o `pagos` EL SISTEMA DEBE rechazarlo.
- CUANDO se consulta `planes` EL SISTEMA DEBE devolver precios en centavos con su moneda.
- Verificar: `npx vitest run tests/pagos/tablas.test.ts`

**Checkout en servidor**
- CUANDO el cliente envía un monto distinto al del plan EL SISTEMA DEBE ignorarlo y usar el de `planes`.
- CUANDO un member sin permiso de facturación pide un checkout EL SISTEMA DEBE responder 403.
- CUANDO se repite la petición con la misma `Idempotency-Key` EL SISTEMA DEBE devolver la misma sesión de pago.
- Verificar: `npx vitest run tests/pagos/checkout.test.ts`

**Webhook del proveedor**
- CUANDO llega un evento con firma inválida EL SISTEMA DEBE responder 400 sin escribir.
- CUANDO llega un pago aprobado EL SISTEMA DEBE registrar el pago y activar la suscripción de esa org.
- CUANDO llega el mismo evento dos veces EL SISTEMA DEBE procesarlo una vez.
- CUANDO llega un evento viejo después de uno nuevo EL SISTEMA DEBE conservar el estado más reciente.
- Verificar: `npx vitest run tests/pagos/webhook.test.ts`

**Gating de plan**
- CUANDO una org en plan gratis supera su límite EL SISTEMA DEBE bloquear la acción en el servidor con `code: "LIMITE"` y ofrecer mejorar el plan.
- CUANDO una suscripción vence sin pago EL SISTEMA DEBE pasar la org al plan gratis sin borrar datos.
- Verificar: `npx vitest run tests/pagos/plan.test.ts`

**Reembolsos y cancelación**
- CUANDO un admin interno emite un reembolso desde el panel EL SISTEMA DEBE pedirlo al proveedor y reflejarlo solo al recibir el webhook.
- CUANDO el cliente cancela EL SISTEMA DEBE mantener el acceso hasta `periodo_fin`.
- Verificar: `npx vitest run tests/pagos/reembolso.test.ts`

## Pruebas obligatorias
1. Webhook con eventos de prueba firmados con el secreto de prueba: válido, inválido, repetido, fuera de orden.
2. Checkout con monto manipulado.
3. Gating: el mismo pedido con plan gratis y pago.
4. Flujo E2E en modo prueba del proveedor con sus tarjetas o cuentas de prueba publicadas.
5. Antes del lanzamiento: un pago real pequeño y su reembolso (lo hace la persona, con confirmación).

## Lista de producción
- [ ] Cuenta del proveedor verificada y activada para cobros reales (persona)
- [ ] Llaves de producción cargadas como secretos; webhook de producción registrado con su secreto
- [ ] Pago real mínimo + reembolso hechos y registrados en evidencia
- [ ] Correos de recibo y de pago fallido configurados
- [ ] Términos de venta, política de reembolsos y datos del vendedor publicados
- [ ] Facturación electrónica resuelta (abajo)

### Facturación electrónica (checklist de asesoría)
**Colombia (DIAN)**
- [ ] Definir con el contador si eres responsable de facturar electrónicamente y tu régimen
- [ ] Habilitarte en la DIAN como facturador y elegir proveedor tecnológico o solución gratuita
- [ ] Resolución de numeración vigente
- [ ] Decidir cómo se emite: manual desde el proveedor, o automática vía su API tras cada webhook de pago (paso extra del plan)
- [ ] Datos del comprador requeridos (tipo y número de documento, correo) pedidos en el checkout

**México (SAT)**
- [ ] Emitir CFDI con un PAC autorizado
- [ ] Pedir RFC, régimen fiscal, código postal y uso de CFDI del cliente cuando quiera factura
- [ ] Factura global para ventas a público en general, según indique el contador

**Merchant of record**
- [ ] Confirmar que el MoR emite el comprobante al comprador; tú facturas al MoR según tu país

## Trampas
- Activar el plan en la página de retorno del checkout: el usuario puede abrirla sin pagar.
- Responder 500 al webhook por un error propio de negocio: el proveedor reintenta en bucle. Guarda
  el error en `eventos_webhook` y responde 200 si la firma fue válida.
- Usar `float` o el monto con decimales del proveedor sin convertir a centavos.
- Monedas sin decimales o con convenciones propias del proveedor: lee su documentación (el peso
  colombiano se envía distinto según proveedor).
- Probar solo el camino feliz: los pagos rechazados, pendientes (PSE) y vencidos son los que
  generan soporte.
- Pagos por PSE quedan pendientes minutos u horas: la UI debe mostrar "pendiente", no "fallido".
