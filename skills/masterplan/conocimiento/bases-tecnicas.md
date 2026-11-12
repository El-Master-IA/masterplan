# Bases técnicas

Lo que todo proyecto construido con Masterplan trae desde la primera ola, sea cual sea el perfil.
No son buenas prácticas para "cuando haya tiempo": son lo que hace barato cambiar el producto
después. Cada base tiene **cómo se comprueba**; si no se puede comprobar con un comando, no cuenta.

Se usan en la fase 3 (`arquitectura.md` dice cómo se cumple cada una en este proyecto), en la fase
5 (la ola del esqueleto las instala) y en la auditoría (`masterplan:auditor-bases` las revisa).

## Las 8 bases

| # | Base | Qué significa | Cómo se comprueba |
|---|---|---|---|
| B1 | **Capas con una sola dirección** | Interfaz → lógica de la función del producto → acceso a datos. Una capa nunca importa de la que está encima, y la interfaz nunca habla con la base ni con un proveedor directamente | Regla de lint de límites de importación (`no-restricted-imports` o `eslint-plugin-boundaries`) que falla el build |
| B2 | **Una sola puerta a los datos** | Toda consulta pasa por la capa de datos del proyecto (`lib/data` o `features/*/api.ts`). El cliente del proveedor se crea en un solo archivo | La misma regla de lint: el SDK de la base solo se puede importar desde la capa de datos |
| B3 | **Configuración validada al arrancar** | Las variables de entorno se leen en un solo módulo, con tipos y validación; si falta una, la app no arranca y dice cuál | Test que arranca sin una variable y espera el error · `masterplan.mjs deriva` (variables sin documentar) |
| B4 | **Contratos en el borde** | Toda entrada que viene de fuera (formulario, API, webhook, respuesta de un tercero) se valida con un esquema compartido entre cliente y servidor | Test por endpoint con una entrada inválida que espera el error del contrato |
| B5 | **Errores con una sola forma** | Un formato de error común (código, mensaje para la persona, id de rastreo), un límite de errores en la interfaz y nada de `catch` vacío | Regla de lint contra `catch` vacío · test del formato de error |
| B6 | **Tipos estrictos de punta a punta** | TypeScript en modo estricto; tipos de la base generados, no escritos a mano; sin `any` implícito | `typecheck` en el gate · tipos regenerados en el checkpoint de cada migración |
| B7 | **Pruebas desde la primera tarea** | El comando de pruebas existe y pasa desde la ola del esqueleto; cada tarea suma la suya antes de implementar | `test` en el gate desde la tarea 1 |
| B8 | **Integración continua desde el día 1** | Cada cambio corre lint, typecheck, pruebas y build en CI antes de mezclarse | Workflow de CI creado en la ola del esqueleto y en verde |

## El esqueleto que corre

La primera ola no construye funciones del producto: deja algo pequeño que **ya corre de punta a
punta** con las 8 bases puestas. Todo lo demás se integra sobre eso, así ningún problema de
arquitectura, de configuración o de despliegue aparece por primera vez al final.

El esqueleto incluye, como mínimo:
- Proyecto creado, con `lint`, `typecheck`, `test` y `build` saliendo 0, y el workflow de CI.
- La estructura de carpetas del perfil, con las reglas de límites de importación activas (B1, B2).
- Módulo de configuración validada (B3), formato de error y límite de errores (B5).
- Una pantalla o endpoint real que atraviesa todas las capas (aunque solo muestre "hola" con un
  dato de la base o de semilla) y su prueba.
- Login funcionando, si el producto lo tiene.
- Despliegue a un entorno de vista previa. Si la cuenta de despliegue todavía no está conectada,
  queda como pendiente de la persona y el esqueleto se prueba con build y arranque local.

En el plan, la tarea que cierra el esqueleto lleva `"hito": "esqueleto"` y cae en la ola 1 o 2.
El validador lo exige en los planes nuevos.

## Lo que NO es una base
No se instala "por si acaso": microservicios, colas, caché, feature flags, monorepo, contenedores
propios, internacionalización o un sistema de eventos. Entran solo cuando un requisito escrito los
pide. Un monolito modular con las 8 bases cambia más rápido que una arquitectura distribuida a medias.
