---
name: kit-frontend
description: >-
  Interfaz en React + Vite + Tailwind + shadcn/ui con criterio: DESIGN.md convertido en tokens CSS
  y tema de Tailwind, arquitectura por features, dónde vive cada estado, los cinco estados de cada
  pantalla, formularios con zod, accesibilidad, presupuestos de rendimiento, reglas de movimiento y
  patrones de estética genérica prohibidos, con capturas móvil y escritorio. Úsala en la fase 3
  (DESIGN.md, EXPERIENCE.md), la 5 y en tareas con kit masterplan:kit-frontend. EN: React frontend
  architecture, design tokens, state placement, screen states, forms, a11y, performance, motion.
---

# Kit · Frontend

La interfaz es donde la persona decide si confía en el producto. Debe sentirse hecha a propósito:
cada pantalla sabe qué mostrar cuando carga, cuando no hay nada, cuando falla y cuando no te toca.

## Cuándo aplica
- Todo producto con pantallas.
- Al escribir `masterplan/DESIGN.md` y `masterplan/EXPERIENCE.md` (agente `masterplan:disenador`).
- En brownfield: estilos sueltos sin tokens, `useEffect` para traer datos, pantallas sin estado de
  error, colores fuera de la paleta.

## Preguntas de negocio (se asume el default)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Tres palabras que describan cómo debe sentirse tu marca? ¿Algún producto que admires?" | Sobria, precisa, cálida | Dirección visual de `DESIGN.md` |
| 2 | "¿Tus usuarios entran más desde el celular o desde el computador?" | Computador para trabajar, celular para consultar | Diseño base y qué pantallas se optimizan primero |
| 3 | "¿Necesitas modo oscuro desde el inicio?" | Sí, por tokens (sale casi gratis) | Doble juego de tokens y capturas |

## Decisión: dónde vive cada estado
| Si el dato… | Vive en… | Por qué |
|---|---|---|
| Viene del servidor | TanStack Query (llaves por feature: `['proyectos', orgId, filtros]`) | Caché, reintentos y estados gratis |
| Debe sobrevivir a recargar o compartirse por enlace (filtros, pestaña, página) | URL (search params del router) | El enlace reproduce la vista |
| Es de un solo componente (abierto/cerrado, texto del input) | `useState` | Lo más simple que funciona |
| Lo comparten varias ramas lejanas y no es del servidor (tema, org activa) | Contexto pequeño o Zustand | Global solo cuando no hay otra salida |
| Es un formulario | react-hook-form + resolver zod con el esquema de `src/shared/contratos` | Mismas reglas en cliente y servidor |

## Decisión: estructura y componentes
| Si… | Entonces… | Por qué |
|---|---|---|
| Hay una capacidad del negocio | Carpeta `src/features/<feature>/` con `api.ts`, `components/`, `hooks/`, `routes.tsx` | Cambiar una feature no toca otras |
| Un componente lo usan 2+ features | `src/components/` | Reutilizar sin acoplar |
| Se necesita un control base | shadcn/ui en `src/components/ui/`, ajustado a los tokens | Accesible de fábrica, código propio |
| Hay una ruta | Carga diferida con `lazy()` y su `errorElement` | Código por ruta, fallos aislados |

## Tokens desde DESIGN.md
`DESIGN.md` define color (con contraste calculado), tipografía, espacio, radio, sombra y motion.
Se traducen a variables CSS en `src/styles/tokens.css` (`--color-fondo`, `--color-texto`,
`--color-acento`, `--radio-md`, `--dur-corta`...) con bloque `.dark`, y `tailwind` las referencia.
En componentes solo se usan clases que apuntan a tokens: nada de `#hex` ni `text-[13px]` sueltos.

## Movimiento
| Uso | Duración | Curva |
|---|---|---|
| Respuesta a un toque (hover, press) | 100–150 ms | `ease-out` |
| Entrar un elemento (popover, toast) | 150–220 ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Salir | 20–30 % más rápido que entrar | `ease-in` |
| Cambio de vista grande | ≤ 300 ms | `ease-in-out` |

Prohibido: `transition: all`; animar `width`, `height`, `top`, `left` o `margin` (solo `transform`
y `opacity`); `ease-in` al entrar; animaciones que bloquean la interacción; movimiento sin
alternativa bajo `prefers-reduced-motion: reduce`.

## Estética genérica prohibida
Estos patrones delatan una interfaz hecha en piloto automático. El auditor los marca:
1. Degradado violeta-azul o morado-rosa como fondo de héroe sin razón de marca.
2. Texto con degradado en el titular.
3. Tres tarjetas iguales con ícono, título y dos líneas como única sección de "beneficios".
4. Emojis como íconos de interfaz.
5. Tipografía por defecto del sistema o Inter en todo sin jerarquía real (un solo peso, un solo tamaño de cuerpo).
6. Sombras grandes y difusas en todo, o efecto vidrio sobre fondos planos.
7. Bordes redondeados máximos en cada elemento, incluidos tablas y entradas.
8. Botones primarios repetidos: más de un llamado principal por vista.
9. Textos de relleno ("Lorem", "Bienvenido a nuestra plataforma", "Potencia tu negocio").
10. Ilustraciones genéricas de personas flotando o blobs decorativos.
11. Estados vacíos con solo "No hay datos".
12. Contraste gris claro sobre blanco por debajo de 4.5:1.

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| FE-01 | Cada pantalla con datos maneja cargando, vacío, error, sin permiso y datos extremos | revisión contra `EXPERIENCE.md` + capturas |
| FE-02 | Sin colores ni tamaños fuera de tokens (`#hex`, `rgb(`, `text-[`, `bg-[` en componentes) | grep en `src/` excepto `tokens.css` |
| FE-03 | Sin `transition: all` ni `transition-all` | grep |
| FE-04 | Animaciones solo en `transform`/`opacity` y respetando `prefers-reduced-motion` | grep + revisión |
| FE-05 | 0 violaciones serias o críticas de axe en las pantallas del flujo principal | `@axe-core/playwright` |
| FE-06 | Todo control interactivo se alcanza y opera con teclado y tiene foco visible | e2e de teclado + axe |
| FE-07 | Toda entrada tiene etiqueta asociada y error anunciado (`aria-describedby`) | axe + revisión |
| FE-08 | Datos del servidor solo con TanStack Query; prohibido `fetch` en `useEffect` | grep `useEffect` con `fetch`/`supabase.from` |
| FE-09 | Rutas con carga diferida; JS inicial dentro del presupuesto de `DESIGN.md` (default 200 KB gzip) | size-limit / reporte de build |
| FE-10 | Lighthouse en pantallas públicas: rendimiento ≥ 90, accesibilidad ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1 | lighthouse-ci |
| FE-11 | Imágenes con `width`/`height`, `loading="lazy"` bajo el pliegue y formato moderno | grep de `<img` |
| FE-12 | Ninguno de los 12 patrones de estética genérica sin justificación escrita en `DESIGN.md` | auditor `estetica-generica` |
| FE-13 | Ningún secreto ni `service_role` en código del cliente | ver DEP-02 |

## Construcción
Archivos, pasos del plan, pruebas obligatorias, lista de producción y trampas están en
`construccion.md` (junto a este archivo). Lo lee quien planea (fase 5) y quien construye (fase 6);
para decidir en la fase 3 basta este archivo.
