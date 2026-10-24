---
name: kit-ia-media
description: >-
  Apps que generan o editan imágenes, video, voz o avatares con IA: elegir entre agregadores (fal,
  Replicate) y proveedores directos (Google Nano Banana/Imagen/Veo, OpenAI GPT Image, FLUX de Black
  Forest Labs, Ideogram, Runway, Luma, Kling, Magnific, ElevenLabs, HeyGen, Hedra), generación en
  segundo plano con webhook, créditos por usuario con tope de gasto, guardado de resultados,
  moderación, licencia comercial de lo generado y costo por pieza. Úsala cuando el alcance tenga
  "genera fotos/videos/voz con IA", fotos de producto, anuncios, avatares o doblaje, en fases 3, 5 y 6.
  EN: generative image/video/voice APIs, aggregators vs direct providers, async generation, credits, moderation, licensing.
---

# Kit · IA generativa de imagen, video y voz

Generar cuesta dinero por pieza y tarda de segundos a minutos. Las tres reglas que evitan una
factura sorpresa o una app colgada: **se genera en segundo plano**, **cada usuario tiene créditos
con tope** y **lo generado se guarda en tu almacenamiento**, no en la URL temporal del proveedor.

Proveedores: `masterplan.mjs proveedores recomendar` con rasgos `generacion-imagenes`,
`edicion-imagenes`, `upscale`, `generacion-video`, `avatares-video`, `voz-sintetica`, y
`api-generativa` (para integrarlo en tu app) o `interfaz-web` (si la persona lo usa sin código).
Precios con fecha en `conocimiento/proveedores.json`; cambian seguido: confírmalos con
`masterplan:investigador`.

## Cuándo aplica
La app genera o edita imágenes, video, voz, música o avatares para sus usuarios, o el negocio
produce contenido en volumen (fotos de producto, anuncios, doblaje).

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Qué genera la app y cuántas piezas por usuario al mes?" | Imágenes, unas 50 por usuario | Proveedor, costo por usuario y precio de tu plan |
| 2 | "¿Lo generado se usa comercialmente (anuncios, productos, clientes)?" | Sí | Solo proveedores y planes con licencia comercial de las salidas |
| 3 | "¿Necesitas varios modelos o uno muy específico?" | Varios, para comparar | Agregador (un API, muchos modelos) vs. proveedor directo |

## Decisión: agregador o directo
| Si… | Entonces… | Por qué |
|---|---|---|
| Quieres probar y cambiar de modelo sin reescribir | **fal** (más de 1.000 modelos, cola para trabajos largos) o **Replicate** (ahora de Cloudflare) | Un API y una factura; cambias de modelo con un parámetro |
| Un modelo concreto en producción con volumen alto | El proveedor directo de ese modelo | Precio sin intermediario, soporte y términos claros |
| Imágenes con texto legible, logos, SVG | Ideogram | Fuerte en texto dentro de la imagen; plan gratis con uso comercial |
| Editar fotos con instrucciones de texto, fotos de producto | Google Nano Banana (Gemini API) o FLUX (Black Forest Labs) | Edición con texto; FLUX Klein muy barato por imagen |
| Mejorar resolución (upscale) de imágenes | Magnific (antes Freepik) o upscale de Ideogram/Topaz | El upscaler de referencia; precio por API a confirmar |
| Video de texto o imagen | fal (Kling, Seedance…) para empezar; Runway, Luma o Veo directos en volumen | Kling directo exige paquetes desde 700 USD: úsalo vía fal o Higgsfield |
| Presentador o avatar que habla | HeyGen (API pago por uso desde 5 USD) o Hedra (más barato por segundo) | Lip sync y voz incluidos |
| Voz en off o doblaje | ElevenLabs (plan Starter para licencia comercial) | El plan gratis no permite uso comercial |
| La persona lo usa sin programar (no dentro de una app) | Higgsfield, Magnific, Leonardo o Ideogram en su web | Interfaz lista; revisa la licencia del plan |
| Nunca para producción | APIMart y revendedores sin reputación verificable | Intermediarios pequeños, términos que prohíben revender |
| Video por API de OpenAI | No existe: la API de Sora cerró el 24-sep-2026 | Usa Veo, Runway, Luma o Kling |

## Flujo (igual con cualquier proveedor)
1. El usuario pide generar. El servidor valida sesión, **reserva créditos** (resta y marca
   `reservado`) y **revisa el texto** contra la política de contenido (lista de bloqueos + la
   moderación del proveedor).
2. Se crea un trabajo `generaciones` en estado `en-cola` y se encola (`masterplan:kit-trabajos`).
   El navegador recibe el id y muestra "generando".
3. El trabajo llama al proveedor en modo asíncrono (cola o webhook del proveedor), con tiempo
   máximo y reintentos limitados.
4. Al terminar, descarga el resultado y lo **guarda en tu almacenamiento** (`masterplan:kit-media`):
   las URLs del proveedor caducan.
5. Marca `listo`, **confirma el cobro** de créditos y avisa al navegador (tiempo real o consulta
   periódica). Si falla, **devuelve los créditos** y guarda el motivo.

## Modelo de datos
```
creditos_movimientos(id, org_id, usuario_id, cantidad, motivo compra|reserva|cobro|devolucion,
                     generacion_id, created_at)              -- el saldo es la suma; nunca un campo editable
generaciones(id, org_id, usuario_id, tipo imagen|video|voz|avatar, proveedor, modelo,
             prompt, parametros jsonb, estado en-cola|generando|listo|fallido|bloqueado,
             costo_estimado_usd, costo_real_usd, archivo_id, error, created_at)
```

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| GEN-01 | Ninguna generación corre dentro de la petición del usuario | revisión de rutas + `kit-trabajos` |
| GEN-02 | Créditos como libro de movimientos: reserva, cobro y devolución; nunca un saldo editable | test: generación fallida devuelve los créditos |
| GEN-03 | Tope de gasto por usuario y global por día, con alerta | test que supera el tope y es rechazado |
| GEN-04 | Las llaves de los proveedores viven solo en el servidor | políticas MP-SEC-0x |
| GEN-05 | Lo generado se copia a tu almacenamiento antes de mostrarse | test: el resultado no apunta a una URL del proveedor |
| GEN-06 | Moderación del texto antes de generar y respeto de la moderación del proveedor | test con texto bloqueado |
| GEN-07 | Licencia comercial de las salidas confirmada para el proveedor y plan elegidos | `arquitectura.md` › decisiones |
| GEN-08 | Webhooks del proveedor verificados e idempotentes | test con evento falso y repetido |
| GEN-09 | Costo por pieza a 1× y 10× y margen del plan de la app en `arquitectura.md` | `revisor-plano` |

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
