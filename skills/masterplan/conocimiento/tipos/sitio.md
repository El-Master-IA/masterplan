# Tipo: Sitio

Sitio web cuyo trabajo es **ser leído y encontrado**: landing, sitio de marca, portafolio, blog,
documentación, catálogo. Los visitantes no inician sesión; como mucho dejan un formulario. Manda
la velocidad, la accesibilidad y que buscadores y agentes de IA lo entiendan.

## Señales

| Frase típica | Lo que delata |
|---|---|
| "Una landing para mi lanzamiento" | Página de conversión |
| "Mi web de marca / de la agencia" | Sitio institucional |
| "Que salga en Google" | SEO y prerender |
| "Un blog donde publique yo" | Contenido editado por el dueño |
| "Que dejen sus datos y me lleguen" | Formulario de captura |
| "La documentación de mi producto" | Sitio de docs |

## No es este tipo si…

- Los visitantes crean cuenta y guardan cosas propias → `saas`.
- El formulario dispara un proceso largo con varios pasos automáticos → `sitio` + `bot` secundario.
- Es un panel para tu equipo → `herramienta-interna`.
- Vende productos con carrito y pago → considera una plataforma de comercio; si se construye, es
  `saas` (tiene cuentas, pedidos e inventario).

## Capacidades que exige

| Capacidad | ¿Siempre? | Kit |
|---|---|---|
| frontend estático o prerenderizado | Sí | `masterplan:kit-frontend` |
| deploy | Sí | `masterplan:kit-deploy` |
| observabilidad mínima (analítica sin PII, errores) | Sí | `masterplan:kit-observabilidad` |
| formulario con anti-spam | Frecuente | `masterplan:kit-api` |
| datos (guardar leads) | Si hay formulario | `masterplan:kit-datos` |
| contenido editable (Markdown o CMS) | Si hay blog | `masterplan:kit-frontend` |

## Decisión clave: cómo se genera el HTML

| Opción | Cuándo |
|---|---|
| Estático/prerenderizado en build | Contenido que cambia por publicación (por defecto) |
| Renderizado en servidor (perfil Next.js) | Contenido que cambia por visita o miles de páginas |
| SPA pura | Nunca para páginas que deben indexarse |

**Recomendación:** prerender en build (Vite con prerender o Astro si la persona lo acepta; Next.js
con exportación estática si el resto del ecosistema ya es Next.js). Contenido en Markdown dentro
del repo hasta que alguien no técnico necesite editar; entonces CMS.

## Modelo de datos base

| Tabla | Columnas clave | Notas |
|---|---|---|
| `leads` | `id`, `email`, `nombre`, `mensaje`, `origen` (utm), `consentimiento` (bool + fecha), `creado` | Inserción solo vía función de servidor; lectura solo del dueño |
| `newsletter` (opcional) | `email` único, `confirmado`, `token_hash`, `creado` | Doble confirmación |

Sin formulario, no hay base de datos.

## Estructura de carpetas (perfil React + Vite + Supabase)

```
src/
  pages/               # una carpeta por página: index, precios, contacto, blog/[slug]
  content/             # Markdown/MDX del blog o docs
  components/          # secciones (hero, testimonios, faq) y ui/
  lib/                 # seo.ts (meta, JSON-LD), analytics.ts, env.ts
  styles/
public/                # robots.txt, sitemap.xml generado, og-image
supabase/
  functions/lead/      # recibe el formulario, valida, anti-spam, guarda, avisa
  migrations/
tests/
```

## Alcance típico

| | Mínima | Recomendada |
|---|---|---|
| Qué incluye | 1–3 páginas, metadatos, analítica, deploy | Mínima + formulario con anti-spam, blog en Markdown, sitemap, OG por página, `llms.txt` |
| Pasos | 6–8 | 10–12 |
| Non-Goals frecuentes | CMS, multi-idioma, búsqueda interna, cuentas de usuario, A/B testing | |

## Orden base de construcción

| # | Paso | Criterio EARS principal | Se verifica con |
|---|---|---|---|
| 1 | Proyecto, git, lint, typecheck, test | CUANDO se corren los scripts de calidad en un clon limpio EL SISTEMA DEBE salir con código 0 | `typecheck`, `lint`, `test` |
| 2 | Tokens de `DESIGN.md` y layout base | CUANDO se usa un color fuera de los tokens EL SISTEMA DEBE fallar el lint de estilos | Lint + revisión visual |
| 3 | Página principal con jerarquía de `EXPERIENCE.md` | CUANDO se carga la página en móvil EL SISTEMA DEBE mostrar el titular y la acción principal sin desplazarse | Test e2e con viewport móvil |
| 4 | Prerender de todas las rutas públicas | CUANDO se pide una ruta sin ejecutar JavaScript EL SISTEMA DEBE devolver el contenido principal en el HTML | `curl` a cada ruta y búsqueda del titular |
| 5 | SEO técnico: título, descripción, canonical, OG, JSON-LD | CUANDO se construye el sitio EL SISTEMA DEBE generar `sitemap.xml` y `robots.txt` con las rutas públicas | Test que valida el sitemap |
| 6 | Legibilidad para agentes: `llms.txt`, HTML semántico | CUANDO un agente lee la página EL SISTEMA DEBE exponer encabezados en orden y textos alternativos | axe + test de encabezados |
| 7 | Páginas secundarias o blog desde contenido | CUANDO se agrega un archivo de contenido válido EL SISTEMA DEBE publicar su página sin tocar código | Test de build con contenido de prueba |
| 8 | Formulario con validación y anti-spam | CUANDO un envío llega con el campo trampa lleno o supera el límite por IP EL SISTEMA DEBE descartarlo sin guardar | Test de la función |
| 9 | Guardado de leads con RLS y aviso al dueño | CUANDO un anónimo consulta la tabla de leads EL SISTEMA DEBE devolver 0 filas | Test de RLS |
| 10 | Analítica sin datos personales y consentimiento | CUANDO el visitante no acepta cookies no esenciales EL SISTEMA DEBE no cargar scripts de seguimiento | Test e2e del banner |
| 11 | Presupuestos de rendimiento | CUANDO se mide la página principal en móvil EL SISTEMA DEBE cumplir LCP < 2,5 s, INP < 200 ms y CLS < 0,1 | Lighthouse en CI |
| 12 | Deploy con headers de seguridad y caché | CUANDO se pide un recurso con hash EL SISTEMA DEBE servirlo con caché larga e inmutable | `curl -I` en preview |

## Trampas típicas

| Trampa | Prevención |
|---|---|
| SPA sin prerender: Google y los agentes ven una página vacía | Paso 4 obligatorio |
| Hero con imagen de 3 MB | Formatos modernos, tamaños responsivos, `fetchpriority` en la imagen principal |
| Formulario que manda correos directo desde el navegador con una llave | Función de servidor |
| Plantilla genérica (degradado morado, todo centrado, tarjetas iguales) | `DESIGN.md` con lista "No usar" y revisión de `masterplan:auditor-frontend` |
| Analítica que carga antes del consentimiento | Consentimiento primero |
| Textos de relleno que llegan a producción | Test que busca "lorem" y marcadores |

## Lista de lanzamiento

- [ ] Dominio, HTTPS, redirección canónica única
- [ ] Search Console (o equivalente) con el sitemap enviado
- [ ] Imagen OG revisada en un validador de previsualización
- [ ] Formulario probado de punta a punta con el correo real del dueño
- [ ] Política de privacidad publicada si se capturan datos
- [ ] Lighthouse móvil en producción dentro de presupuesto
