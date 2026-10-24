# Perfil: todo en el borde con Cloudflare

Para sitios y apps que deben ser **rápidos en todo el mundo y baratos**: contenido, catálogos,
APIs ligeras, apps con mucho tráfico de archivos. Frontend en Pages o Workers con assets, lógica en
Workers, datos en D1 (SQLite) o en un Postgres externo vía Hyperdrive, archivos en R2 (sin costo de
salida), colas en Queues, estado en tiempo real con Durable Objects.

Versiones: ninguna aquí. Fíjalas con `masterplan:investigador` en la fase 5 (referencia 2026-10).

## Cuándo elegirlo
| Señal | Por qué este perfil |
|---|---|
| `borde-global`, `sitio-estatico`, `ssr` con tráfico alto | Responde desde el punto más cercano al usuario |
| `sin-costo-salida`, `archivos-grandes` | R2 no cobra la descarga de archivos |
| `presupuesto-cero` con uso comercial | Los planes gratis permiten proyectos comerciales (verifícalo en la fase 3) |
| `pubsub`, `presencia` con pocos usuarios por sala | Durable Objects guarda el estado de cada sala |

No lo elijas si necesitas procesos de varios minutos, librerías nativas de Node o una base con RLS
y login integrados sin escribir esa capa: ahí gana el perfil Node en contenedor o Supabase.

## Piezas
| Capa | Elección base | Nota |
|---|---|---|
| Frontend | React + Vite (SPA) o un framework con adaptador de Cloudflare | Assets estáticos servidos por el Worker |
| API | Hono sobre Workers | El mismo código corre en Node para tests |
| Datos | D1 para SQLite en el borde; Postgres externo (Neon o Supabase) vía Hyperdrive si necesitas Postgres | D1 no tiene RLS: autoriza en el Worker |
| Archivos | R2 con URLs firmadas para subir directo desde el navegador | — |
| Colas y tareas | Queues y Workflows; Cron Triggers | Ver `masterplan:kit-trabajos` |
| Caché | KV para lecturas muy frecuentes y poco cambiantes | No es una base de datos |
| Tiempo real | Durable Objects | Una instancia por sala/documento |
| Auth | Better Auth en el Worker, Clerk, o Supabase Auth validando su JWT | Una sola fuente de sesión |
| Config | `wrangler.jsonc` con bindings por entorno | Secretos con `wrangler secret`, nunca en el archivo |

## Estructura
```
src/
  worker.ts             entrada: rutas de la API y assets
  rutas/                una por recurso (Hono)
  db/                   esquema y migraciones de D1 (wrangler d1 migrations)
  lib/                  auth, errores, logger
web/                    frontend (Vite)
wrangler.jsonc          bindings: D1, R2, KV, Queues, DO; entornos preview y production
```

## Reglas del perfil
- **Sin APIs de Node no soportadas**: revisa compatibilidad de cada librería con el runtime de Workers antes de elegirla.
- **Autorización en el Worker** con una sola función y test de aislamiento entre clientes contra la API (D1 no tiene RLS).
- **Límites del plan:** tiempo de CPU por petición, tamaño del bundle y filas leídas en D1. Anótalos en `arquitectura.md` con su fecha.
- **Entornos separados** (`--env preview`, `--env production`) con bases y buckets distintos.
- **Migraciones de D1** aplicadas antes de publicar la versión que las usa.

## Scripts esperados
`dev` (wrangler dev), `build`, `deploy:preview`, `deploy`, `typecheck`, `lint`, `test`, `db:migrate:local`, `db:migrate:remote`.

## Trampas
- Usar KV como base de datos: es eventualmente consistente.
- Abrir conexiones TCP a Postgres directo desde el Worker sin Hyperdrive o un driver HTTP.
- Olvidar que cada binding existe por entorno: un bucket de producción usado en preview.
