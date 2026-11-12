# Kit · ia-media · construcción

Segunda mitad del kit `masterplan:kit-ia-media`. Las decisiones y los candados están en `SKILL.md`.

## Pasos que agrega al plan
1. Libro de créditos y tope de gasto.
   - CUANDO un usuario sin créditos pide generar EL SISTEMA DEBE rechazarlo con error LIMITE
   - CUANDO una generación falla EL SISTEMA DEBE devolver los créditos reservados
2. Trabajo de generación con el proveedor elegido y guardado del resultado.
   - CUANDO el proveedor entrega el resultado EL SISTEMA DEBE guardarlo en el almacenamiento propio y marcar `listo` una vez
   - CUANDO el proveedor tarda más del máximo EL SISTEMA DEBE marcar `fallido` y devolver créditos
3. Moderación previa y estados en la interfaz (generando, listo, bloqueado, error).
   - CUANDO el texto viola la política EL SISTEMA DEBE marcar `bloqueado` sin llamar al proveedor
4. Galería del usuario con permisos por organización.

## Pruebas obligatorias
Créditos devueltos en fallo · tope respetado · webhook falso rechazado · resultado guardado en el
almacenamiento propio · texto bloqueado no llega al proveedor. En CI se usa un **proveedor
simulado**: nunca se gasta dinero real en las pruebas.

## Lista de producción
Licencia comercial confirmada · alerta de gasto diario · precio de tu plan con margen sobre el
costo por pieza · política de contenido publicada · borrado de generaciones con datos personales.

## Trampas
- Mostrar la URL del proveedor: caduca y la galería se llena de imágenes rotas.
- Cobrar créditos antes de saber si la generación salió.
- Prometer "ilimitado" con un costo por pieza.
- Elegir un modelo por una demo: prueba 10 piezas reales del caso de uso con 2 o 3 modelos vía un
  agregador antes de decidir.
