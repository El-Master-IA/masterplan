# Kit · trabajos · construcción

Segunda mitad del kit `masterplan:kit-trabajos`. Las decisiones y los candados están en `SKILL.md`.

## Archivos que produce
`src/trabajos/<nombre>.ts` (un archivo por trabajo, con su clave de idempotencia), registro del
cron o de la cola según el proveedor, endpoint firmado que recibe los trabajos (si el proveedor los
entrega por HTTP), `docs/trabajos.md` con la lista de trabajos, frecuencia, reintentos y alertas.

## Pasos que agrega al plan
1. Infraestructura de trabajos del proveedor elegido y un trabajo de prueba.
   - CUANDO se encola el trabajo de prueba EL SISTEMA DEBE ejecutarlo y registrar `hecho` en menos de 1 minuto
   - CUANDO el trabajo falla tres veces EL SISTEMA DEBE moverlo a fallidos y emitir una alerta
2. Primer trabajo real (ej. correo de bienvenida) con idempotencia.
   - CUANDO el mismo evento llega dos veces EL SISTEMA DEBE enviar un solo correo
3. Cron necesarios con su zona horaria.
   - CUANDO llega la hora programada EL SISTEMA DEBE ejecutar el trabajo una vez
4. Estado visible al usuario para procesos largos (procesando / listo / error).

## Pruebas obligatorias
Doble ejecución sin efecto doble · fallo forzado llega a fallidos · firma falsa rechazada · cron
probado con reloj simulado.

## Lista de producción
Alertas de fallidos conectadas a `kit-observabilidad` · límites del plan del proveedor anotados con
fecha · costo a 1× y 10× · procedimiento para reprocesar fallidos.

## Trampas
- `setTimeout` o colas en memoria en serverless: desaparecen al terminar la función.
- Reintentar sin idempotencia: correos y cobros duplicados.
- Un solo trabajo gigante: pártelo en pasos para no perder todo a la mitad.
- Cron en UTC sin decirlo: el recordatorio "de las 8" llega a las 3.
