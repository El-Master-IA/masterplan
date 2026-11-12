---
name: kit-pagos
description: >-
  Cobros y suscripciones con enfoque LatAm: elegir proveedor por país y modelo (Stripe, Mercado
  Pago, Wompi con PSE/Nequi, Paddle como merchant of record), checkout creado en el
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

## Preguntas de negocio (se asume el default)
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
| Empresa en México, Brasil o EE. UU. con suscripciones | Stripe (Billing, Checkout, portal de cliente) | Mejor manejo de suscripciones y pruebas |
| Empresa en Colombia, Chile, Perú o Argentina que quiere Stripe | No es posible abrir cuenta local (verificado 2026-10). Merchant of record (Paddle) o una entidad en EE. UU. | Stripe no acepta empresas registradas en esos países |
| Venta de software a todo el mundo y no quieres manejar impuestos extranjeros | Paddle u otro merchant of record | Él vende, factura y paga impuestos; tú recibes el neto. Lemon Squeezy anuncia su paso a Stripe Managed Payments: evítalo en proyectos nuevos |
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

## Construcción
Archivos, pasos del plan, pruebas obligatorias, lista de producción y trampas están en
`construccion.md` (junto a este archivo). Lo lee quien planea (fase 5) y quien construye (fase 6);
para decidir en la fase 3 basta este archivo.
