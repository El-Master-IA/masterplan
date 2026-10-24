# Perfil: API Node en contenedor (Railway, Render o Fly.io)

Para backends que **no caben en funciones serverless**: procesos que duran minutos, workers que
consumen colas, WebSockets propios, cron frecuente, librerías nativas (ffmpeg, Puppeteer) o una
API que otros programas consumen. El frontend puede vivir aparte (perfil React + Vite o Next.js) y
llamar a esta API.

Versiones: ninguna aquí. Fíjalas con `masterplan:investigador` en la fase 5 (referencia 2026-10).

## Cuándo elegirlo
| Señal | Por qué este perfil |
|---|---|
| `proceso-largo`, `worker-cola` | Un proceso siempre encendido no tiene límite de duración por petición |
| `websockets` con estado propio | Conexiones largas sin depender de un servicio de tiempo real |
| `contenedor-docker` o binarios nativos | Imagen propia con lo que haga falta |
| API pública con clientes externos | Contrato estable y versionado, separado del frontend |

No lo elijas para un CRUD con login que Supabase + RLS ya resuelve: es más código que mantener.

## Piezas
| Capa | Elección base | Alternativas |
|---|---|---|
| Runtime | Node LTS + TypeScript | Bun si el equipo lo conoce |
| Framework HTTP | Hono (portable: Node, Bun, Workers) | Fastify, Express |
| Validación | zod en la frontera, compartido con el frontend | valibot |
| Base de datos | Postgres gestionado (Railway Postgres, Neon o Supabase) | según `proveedores recomendar` |
| ORM / SQL | Drizzle (SQL tipado, migraciones en el repo) | Prisma, Kysely |
| Colas | BullMQ + Redis en el mismo proyecto, o un servicio gestionado (`masterplan:kit-trabajos`) | Inngest, Trigger.dev |
| Auth | Validar el JWT del proveedor de identidad elegido (Supabase Auth, Clerk o Better Auth) | — |
| Tests | Vitest + supertest/fetch contra la app en memoria | — |
| Hosting | Railway (servicios + Postgres + Redis en un proyecto) | Render, Fly.io, VPS con Coolify |

## Estructura
```
api/
  src/
    index.ts            arranque, puerto desde PORT, cierre ordenado en SIGTERM
    rutas/<recurso>.ts  una ruta por recurso; valida, autoriza, llama al servicio
    servicios/          lógica de negocio sin HTTP
    db/                 esquema, migraciones, cliente
    trabajos/           procesadores de cola y cron
    lib/                errores, logger con request id, config (lee env y falla rápido)
  Dockerfile            o detección automática del proveedor
  .env.example
```

## Reglas del perfil
- **Escucha en `0.0.0.0` y en el puerto de `PORT`.** Es la causa número uno de deploys que "no levantan".
- **Health check** en `/salud` que toque la base; el proveedor lo usa para no mandar tráfico a una instancia rota.
- **Cierre ordenado:** en `SIGTERM` deja de aceptar peticiones, termina los trabajos en curso y cierra la conexión a la base.
- **Web y worker separados:** dos servicios con el mismo código y distinto comando de arranque. Un worker colgado no tumba la API.
- **Migraciones como paso de release**, antes de que arranque la versión nueva, nunca en el arranque de cada instancia.
- **Sin estado en memoria entre instancias:** sesiones, contadores y colas en Redis o en la base.
- **Autorización en cada ruta** con una sola función; si la base no tiene RLS, el test de aislamiento entre clientes se hace contra la API.
- **Límites de uso** por IP y por usuario en rutas de login y de escritura.

## Scripts esperados
`dev`, `build`, `start`, `start:worker`, `typecheck`, `lint`, `test`, `db:migrate`, `db:seed`.

## Trampas
- Pagar 24/7 por un servicio que casi no se usa: revisa si el proveedor permite dormir el servicio (escala a cero) en entornos de prueba.
- Logs sin request id: imposibles de seguir con varias instancias.
- Conexiones a Postgres sin pool o con demasiadas instancias: usa un pooler o limita el pool por instancia.
