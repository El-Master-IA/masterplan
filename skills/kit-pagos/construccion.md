# Kit · pagos · construcción

Segunda mitad del kit `masterplan:kit-pagos`. Las decisiones y los candados están en `SKILL.md`.

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
