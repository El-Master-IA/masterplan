---
# masterplan/DESIGN.md · Fase 3 · lo escribe masterplan:disenador.
# Tokens fuente de verdad. El constructor los traduce a variables CSS; ningún color, tamaño
# ni duración fuera de aquí. Contraste calculado (WCAG 2.2): texto normal >= 4.5, grande >= 3.
version: 1
color:
  pares:            # cada par texto/fondo que se usa, con su contraste calculado
    - nombre: base
      texto: "#______"
      fondo: "#______"
      contraste: 0.0
    - nombre: suave
      texto: "#______"
      fondo: "#______"
      contraste: 0.0
    - nombre: primario
      texto: "#______"
      fondo: "#______"
      contraste: 0.0
    - nombre: peligro
      texto: "#______"
      fondo: "#______"
      contraste: 0.0
  borde: "#______"
  foco: "#______"          # anillo de foco visible sobre todos los fondos (>= 3:1)
  oscuro: null             # mismos pares para modo oscuro, o null si es Non-Goal
tipografia:
  titulos: { familia: "<fuente>", respaldo: "<pila del sistema>", pesos: [600, 700] }
  texto: { familia: "<fuente>", respaldo: "<pila del sistema>", pesos: [400, 500] }
  mono: { familia: "<fuente>", respaldo: "ui-monospace, monospace" }
  escala:                  # rem; razón declarada
    razon: 1.25
    xs: 0.75
    sm: 0.875
    base: 1
    lg: 1.25
    xl: 1.563
    "2xl": 1.953
    "3xl": 2.441
  interlineado: { titulos: 1.15, texto: 1.55 }
  medidaMaxima: "68ch"
espacio:                   # base 4px
  base: 4
  pasos: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]
radio: { ninguno: 0, sm: 4, md: 8, lg: 12, completo: 9999 }
sombra:
  ninguna: "none"
  baja: "<valor>"
  media: "<valor>"
motion:
  duracion: { instantanea: 80, rapida: 150, media: 240, lenta: 400 }   # ms
  curva:
    salida: "cubic-bezier(0.2, 0, 0, 1)"
    entrada: "cubic-bezier(0.4, 0, 1, 1)"
    estandar: "cubic-bezier(0.2, 0, 0.2, 1)"
  reducido: "respeta prefers-reduced-motion: solo opacidad, sin desplazamientos"
rendimiento:
  LCP_ms: 2500
  INP_ms: 200
  CLS: 0.1
  jsInicial_kb_gzip: 170   # objetivo; ajustar por tipo y justificar
---

# Sistema visual · <nombre del proyecto>

## Dirección
_Tres a cinco líneas: personalidad de la marca, a quién le habla, una referencia concreta y por qué. Nada genérico ("moderno y limpio" no vale)._

## Color
_Cuándo se usa cada par; qué color significa acción, estado y peligro. Nunca el color como única señal._

## Tipografía
_Por qué estas fuentes, cómo se cargan (subconjunto, `font-display`), qué nivel de la escala usa cada elemento._

## Espacio y ritmo
_Cómo se usa la escala: separación entre secciones, dentro de componentes, densidad de tablas._

## Forma y profundidad
_Radios y sombras por tipo de elemento; cuándo una superficie se eleva y cuándo no._

## Movimiento
_Qué se anima, con qué duración y curva, y qué nunca se anima._

## Componentes base
_Lista de componentes (botón, campo, tabla, diálogo, aviso, vacío) con variantes y estados: reposo, hover, foco, activo, deshabilitado, cargando, error._

| Componente | Variantes | Notas |
|---|---|---|

## Iconos e imágenes
_Librería de iconos única, tamaños, estilo de ilustración o fotografía, formato y tamaños responsivos._

## No usar
_Patrones prohibidos en este proyecto, concretos. Base que siempre aplica más los propios:_
- Degradado morado-azul como fondo o en botones.
- Inter (o la fuente del sistema) por defecto sin decisión explícita.
- Emojis como iconos.
- Todo centrado en todas las secciones.
- Rejillas de tarjetas idénticas con sombra para cualquier contenido.
- Textos de relleno o titulares vacíos ("Potencia tu productividad").
- _…propios del proyecto_

## Presupuestos de rendimiento
_Medidos en móvil, en la página principal y en la pantalla del flujo principal._

| Métrica | Presupuesto | Cómo se mide |
|---|---|---|
| LCP | < 2,5 s | Lighthouse móvil en CI y en producción |
| INP | < 200 ms | Lighthouse / datos de campo |
| CLS | < 0,1 | Lighthouse |
| JS inicial | objetivo del frontmatter (gzip) | Reporte del build |
| Fuentes | ≤ 2 familias, subconjunto | Revisión |
| Imagen principal | formato moderno, tamaño explícito | Revisión |
