# Fundamentos

Doce principios que gobiernan cada decisión de Masterplan. Cada uno trae una **pregunta de
control**: si la respuesta es "no" o "no sé", la decisión no está lista. Se usan en las fases 1–4
y en la revisión de `masterplan:revisor-plano`.

## Los 12 principios

| # | Principio | Qué significa en la práctica | Pregunta de control |
|---|---|---|---|
| 1 | **Problema antes que solución** | Se describe qué se rompe hoy y para quién antes de nombrar una herramienta. El stack sale del problema, no al revés. | ¿Puedo explicar el problema en una frase sin nombrar tecnología? |
| 2 | **Clasificar antes de diseñar** | Todo producto cae en un tipo (`saas`, `sitio`, `api`, `herramienta-interna`, `bot`, `app-ia`). El tipo trae su orden de construcción y sus trampas. | ¿El tipo está confirmado por la persona y no es una capacidad disfrazada ("tiene pagos")? |
| 3 | **Atributos de calidad explícitos** | Se eligen 3 atributos que mandan y 1 que se sacrifica. Sin esto, cada decisión técnica se discute desde cero. | ¿Cuando dos opciones empatan, sé cuál atributo desempata? |
| 4 | **Valla de alcance** | v1 tiene un flujo principal y al menos 5 Non-Goals con fecha o condición de regreso. Lo que no está escrito como dentro, está fuera. | ¿Puedo nombrar 5 cosas que v1 no hace y cuándo volverían? |
| 5 | **Datos primero** | El modelo de datos (dueño de cada fila, qué pasa al borrar, dinero en enteros) se decide antes de las pantallas. Cambiar una pantalla cuesta horas; cambiar la tenencia cuesta semanas. | ¿Cada tabla tiene dueño (`org_id`/`user_id`) y regla de borrado? |
| 6 | **Límites y contratos** | Cada módulo expone un contrato (entrada, salida, errores) y oculta su interior. El frontend habla con una capa de datos única, no con la base desde cualquier componente. | ¿Puedo cambiar el interior de un módulo sin tocar a quien lo llama? |
| 7 | **Decisiones registradas (ADR)** | Toda decisión cara de revertir queda en un ADR corto: contexto, opción elegida, opciones descartadas, consecuencia. Las menores van a `decisiones.log`. | ¿Alguien que llegue en 6 meses entiende por qué se eligió esto? |
| 8 | **Seguridad por diseño** | Permisos en la base (RLS), secretos solo en servidor, validación en el borde, mínimo privilegio. Se diseña con la matriz rol × recurso × acción, no se parcha después. | ¿Un usuario malicioso con la clave pública puede leer datos de otro? |
| 9 | **Fallar bien** | Cada operación define qué pasa si falla: reintento con límite, idempotencia, mensaje útil al usuario, nada a medias. Los estados vacío, cargando, error y sin permiso se diseñan. | ¿Qué ve el usuario y qué queda en la base si esta llamada falla a la mitad? |
| 10 | **Observable desde el día 1** | Errores capturados con contexto, un health check, logs estructurados sin datos personales y el evento de la métrica de éxito. Sin esto, producción es una caja negra. | ¿Me entero de un error en producción antes que el usuario me escriba? |
| 11 | **Costo como requisito** | Se estima el costo mensual a 1× y 10× y el punto donde salta de plan. Un diseño que no se puede pagar a 10× está mal diseñado. | ¿Sé cuánto cuesta este sistema con diez veces los usuarios esperados? |
| 12 | **Terminado = verificable** | Cada paso tiene criterios EARS, un comando que sale 0 cuando está bien y un tag de git para volver. "Funciona" no es evidencia. | ¿Qué comando corro para probar que esto está terminado? |

### Cómo se aplican por fase

| Fase | Principios que se revisan |
|---|---|
| 1 Descubrir | 1, 2 |
| 2 Recortar | 4 |
| 3 Diseñar | 3, 5, 6, 7, 8, 9, 10, 11 |
| 4 Puertas | Todos (el revisor usa las preguntas de control) |
| 5 Planear | 12 |
| 6–8 | 8, 9, 10, 12 |

## Atributos de calidad

Catálogo resumido a partir del modelo ISO/IEC 25010, traducido a lo que importa en un producto
web pequeño o mediano. Cada atributo trae una señal de que manda y un ejemplo de requisito medible.

| Atributo | Manda cuando… | Requisito medible de ejemplo |
|---|---|---|
| **Disponibilidad** | Si se cae, alguien pierde dinero o trabajo en ese momento | Uptime mensual ≥ 99,5 %; recuperación ≤ 30 min |
| **Seguridad** | Hay datos de varios clientes, pagos o permisos distintos | 0 accesos cruzados entre organizaciones en tests de aislamiento |
| **Privacidad** | Se guardan datos personales sensibles (salud, finanzas, menores, ubicación) | Datos personales borrados ≤ 30 días después de pedirlo |
| **Rendimiento** | La experiencia depende de la velocidad (búsqueda, feed, editor) | p95 de la acción principal < 300 ms; LCP < 2,5 s |
| **Costo** | Presupuesto fijo, margen bajo o uso gratuito masivo | Costo por usuario activo < USD 0,10/mes |
| **Velocidad de cambio** | Etapa de validación: se cambiará mucho y rápido | Un cambio pequeño llega a producción en < 1 día |
| **Accesibilidad** | Público amplio, sector público, educación, salud | WCAG 2.2 AA sin errores críticos en axe |
| **Fiabilidad de datos** | Dinero, inventario, registros legales | 0 pérdidas: transacciones atómicas y backups restaurados al mes |
| **Escalabilidad** | Crecimiento esperado de un orden de magnitud en el año | Soporta 10× usuarios sin cambiar de arquitectura, solo de plan |
| **Usabilidad** | El usuario no es técnico o el flujo es largo | Un usuario nuevo completa el flujo principal sin ayuda en < 5 min |
| **Mantenibilidad** | Equipo pequeño que rota, o una persona sola | Typecheck, lint y tests en verde; módulos con contrato |
| **Portabilidad** | Riesgo de cambiar de proveedor o requisito de soberanía de datos | Salida del proveedor documentada en un ADR |

### Cómo elegir 3 + 1 sacrificado

1. **Parte de la etapa.** Validación: velocidad de cambio casi siempre manda. Usuarios reales que
   pagan: seguridad y fiabilidad de datos entran.
2. **Mira qué hay en juego.** Datos de varios clientes → seguridad. Dinero → fiabilidad de datos.
   Datos sensibles → privacidad.
3. **Elige solo 3.** Si todo manda, nada manda. Los demás se cumplen en nivel "razonable".
4. **Nombra el sacrificado.** Es el que pierde cuando hay conflicto. Debe doler un poco; si no
   duele, no es un sacrificio real.
5. **Escríbelo** en `arquitectura.md` con su requisito medible y en `proyecto.json.calidad`.

| Combinación típica | Manda | Se sacrifica |
|---|---|---|
| SaaS en validación | velocidad de cambio, seguridad, costo | escalabilidad |
| SaaS con clientes que pagan | seguridad, disponibilidad, fiabilidad de datos | velocidad de cambio |
| Sitio de marketing | rendimiento, accesibilidad, costo | disponibilidad avanzada |
| Herramienta interna | velocidad de cambio, seguridad, usabilidad | rendimiento |
| API pública | disponibilidad, seguridad, rendimiento | velocidad de cambio |
| App de IA | costo, privacidad, usabilidad | rendimiento (latencia del modelo) |
| Bot de automatización | fiabilidad de datos, costo, mantenibilidad | usabilidad |

### Conflictos frecuentes y cómo se resuelven

| Conflicto | Regla |
|---|---|
| Rendimiento vs costo | Cache y paginación antes que plan más caro |
| Seguridad vs velocidad de cambio | La seguridad de datos nunca se sacrifica; se sacrifica alcance |
| Disponibilidad vs costo | Define cuánto cuesta una hora caída; si es menos que el plan alto, no lo pagues |
| Privacidad vs analítica | Analítica sin datos personales o con consentimiento explícito |
