# Experiencia · <nombre del proyecto>

<!-- masterplan/EXPERIENCE.md · Fase 3 · lo escribe masterplan:disenador.
     masterplan:auditor-frontend verifica los estados de este documento en la fase 7. -->

## Personas
_Quién usa el producto (máx. 3), qué quiere lograr y en qué dispositivo lo hace la mayoría de las veces._

## Flujo principal
_El de proyecto.json › alcance.flujoPrincipal, paso a paso, cada paso con su pantalla. Es la prueba e2e de la fase 7._

| # | El usuario… | Pantalla | Éxito visible |
|---|---|---|---|

## Mapa de pantallas
_Todas las rutas, quién puede verlas y de dónde se llega._

```mermaid
flowchart TD
  inicio[/] --> login[/login]
  login --> panel[/app]
```

| Ruta | Pantalla | Acceso | Propósito |
|---|---|---|---|

## Estados por pantalla
_Cada pantalla con sus cuatro estados obligatorios, más los propios. Qué se ve y qué acción ofrece._

| Pantalla | Cargando | Vacío | Error | Sin permiso | Otros |
|---|---|---|---|---|---|

## Primera vez
_Qué ve un usuario nuevo al entrar: estado vacío útil, guía o datos de ejemplo. Primera acción con valor._

## Acciones destructivas
_Cuáles hay y si llevan confirmación o deshacer._

## Formularios
_Validación (cuándo se muestra), mensajes de error por campo, qué pasa al enviar dos veces._

## Móvil
_Cómo cambian las pantallas principales en anchos pequeños; navegación en móvil._

## Accesibilidad
_Objetivo WCAG 2.2 AA. Flujo principal completo con teclado, orden de foco, etiquetas, anuncios de cambios (aria-live), movimiento reducido._

## Textos clave
_Titulares, botones principales, mensajes de error frecuentes y correos. Escritos de verdad, en la voz de la marca._

| Dónde | Texto |
|---|---|

## Legibilidad para buscadores y agentes
_Páginas públicas: título y descripción por ruta, encabezados en orden, datos estructurados, `llms.txt` si aplica._
