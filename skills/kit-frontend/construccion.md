# Kit · frontend · construcción

Segunda mitad del kit `masterplan:kit-frontend`. Las decisiones y los candados están en `SKILL.md`.

## Archivos que produce
```
masterplan/DESIGN.md, masterplan/EXPERIENCE.md
src/styles/tokens.css, src/styles/globals.css
tailwind.config.ts (o @theme en CSS)       tema que apunta a las variables
src/components/ui/*                         shadcn ajustado
src/components/estados/                     Cargando, Vacio, ErrorVista, SinPermiso
src/features/<feature>/...
src/app/router.tsx, src/app/providers.tsx   QueryClient, tema, sesión
e2e/capturas.spec.ts                        capturas 390×844 y 1440×900 por pantalla clave
lighthouserc.json, .size-limit.json         presupuestos
```

## Pasos que agrega al plan
**Tokens, tema y base de componentes**
- Archivos: `src/styles/tokens.css`, `tailwind.config.ts`, `src/components/ui/*`, `src/components/estados/*`
- CUANDO cambia un token en `tokens.css` EL SISTEMA DEBE reflejarlo en todos los componentes sin tocar su código.
- CUANDO el sistema operativo pide modo oscuro EL SISTEMA DEBE aplicar el juego oscuro con contraste ≥ 4.5:1 en texto.
- Verificar: `npm run typecheck && npm run lint && npx playwright test e2e/capturas.spec.ts`

**Esqueleto de la app** (router, providers, layout, rutas diferidas)
- CUANDO una ruta lanza un error EL SISTEMA DEBE mostrar `ErrorVista` en esa ruta sin tumbar el layout.
- CUANDO se navega a una ruta inexistente EL SISTEMA DEBE mostrar una página 404 propia.
- Verificar: `npm run build && npx playwright test e2e/navegacion.spec.ts`

**Cada pantalla del flujo principal** (una tarea por pantalla)
- CUANDO la consulta está en curso EL SISTEMA DEBE mostrar un esqueleto con la forma final, sin saltos de layout.
- CUANDO no hay registros EL SISTEMA DEBE mostrar un vacío que explica qué hacer y ofrece la acción principal.
- CUANDO la consulta falla EL SISTEMA DEBE mostrar el error en lenguaje claro con opción de reintentar.
- CUANDO el usuario no tiene permiso EL SISTEMA DEBE mostrar `SinPermiso`, no una lista vacía.
- CUANDO un texto mide 200 caracteres o hay 1.000 filas EL SISTEMA DEBE mantener el layout sin desbordes.
- Verificar: `npx playwright test e2e/<pantalla>.spec.ts`

**Accesibilidad y rendimiento** (antes de publicar)
- CUANDO se recorre el flujo principal solo con teclado EL SISTEMA DEBE permitir completarlo.
- CUANDO se analiza cada pantalla del flujo con axe EL SISTEMA DEBE reportar 0 violaciones serias o críticas.
- Verificar: `npx playwright test e2e/a11y.spec.ts && npx lhci autorun`

## Pruebas obligatorias
1. axe en cada pantalla del flujo principal.
2. Recorrido de teclado del flujo principal.
3. Capturas móvil (390×844) y escritorio (1440×900), claro y oscuro, guardadas en `masterplan/evidencia/capturas/`.
4. Formularios: envío válido, inválido, error del servidor, doble clic.
5. Presupuesto de bundle y Lighthouse en CI.

## Lista de producción
- [ ] Título, descripción y Open Graph por ruta pública; favicon y manifest
- [ ] Página 404 y de error con salida
- [ ] Capturas revisadas por la persona
- [ ] Fuentes con `font-display: swap` y precarga de la principal
- [ ] Textos finales (sin relleno) en todas las pantallas

## Trampas
- Spinner centrado en lugar de esqueleto: la pantalla salta cuando llegan los datos.
- Invalidar toda la caché tras una mutación: invalida solo las llaves de la feature.
- Esconder un botón por rol y creer que eso protege: lo protege RLS (ver `masterplan:kit-auth`).
- Copiar componentes de shadcn y luego editarlos con colores literales: se pierde el tema.
- `outline: none` sin reemplazo de foco.
- Probar solo en escritorio con datos bonitos.
