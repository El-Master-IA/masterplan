---
name: kit-deploy
description: >-
  Entornos y publicación: local, preview y producción con variables por entorno, .env.example
  completo, nada secreto en VITE_, GitHub Actions con las puertas (typecheck, lint, test, build,
  masterplan.mjs deriva), migraciones antes de promover, preview con smoke de Playwright y
  producción solo con confirmación, rollback, headers de seguridad, dominio y hosting que permita
  uso comercial, en Vercel, Cloudflare, Railway, Render, Fly.io o un VPS con Coolify. Úsala en las
  fases 3, 5 y 7 (agente masterplan:desplegador).
  EN: environments, env vars, CI gates, preview to production, rollback, security headers, domains, multi-provider.
---

# Kit · Deploy

Publicar debe ser aburrido: el mismo camino cada vez, con puertas automáticas y un botón de volver
atrás probado antes de necesitarlo.

## Cuándo aplica
- Desde la primera tarea del plan (CI) hasta la fase 7 (publicar) y la 8 (cada cambio).
- En brownfield: deploys manuales desde la máquina de alguien, secretos en el repo, sin preview.

## Preguntas de negocio (máx. 3)
| # | Pregunta | Default recomendado | Qué cambia |
|---|---|---|---|
| 1 | "¿Ya tienes dominio? ¿Cuál?" | Comprar uno propio antes de lanzar | Configuración de DNS y URLs de Auth |
| 2 | "¿Este producto va a cobrar o es de uso comercial?" | Sí | Plan de hosting que permita uso comercial (Vercel Pro, no Hobby) |
| 3 | "¿Quién más puede publicar a producción?" | Solo tú, con confirmación | Protección de rama y permisos del proyecto |

## Decisión
| Si… | Entonces… | Por qué |
|---|---|---|
| El proyecto es comercial (cobra, es de una empresa o de un cliente) | Vercel Pro (o un hosting cuyos términos permitan uso comercial) | Vercel Hobby es solo para uso personal no comercial |
| Hay base de datos | Dos proyectos de Supabase: uno de pruebas (previews) y uno de producción | Las previews nunca tocan datos reales |
| Se abre un PR | CI corre las puertas y Vercel crea un preview con variables de pruebas | Ver antes de publicar |
| Se va a promover a producción | Migraciones primero (`supabase db push` al proyecto de producción), luego el deploy | El código nuevo espera el esquema nuevo; al revés rompe |
| Una migración borra o renombra | Dos pasos: agregar y migrar datos en un deploy; quitar lo viejo en otro | Permite rollback del código sin perder datos |
| Algo falla en producción | Rollback instantáneo al deploy anterior (`vercel rollback` o promover el anterior) | Volver atrás en segundos; arreglar con calma |
| Variable que el navegador necesita (URL de Supabase, anon key, llave pública de pagos) | Prefijo `VITE_` | Se empaqueta en el JS público: solo lo que es público por diseño |
| Variable secreta | Secretos de Supabase Functions o variables de Vercel sin `VITE_` | Nunca llega al navegador |

## Destinos: el mismo proceso en cualquier proveedor
El destino sale de `proyecto.json.proveedores` (`hosting-web`, `backend`, `serverless-borde`),
elegido con `masterplan.mjs proveedores recomendar`. Lo de arriba usa Vercel como ejemplo; el
proceso (preview → smoke → migraciones → producción con confirmación → verificación → rollback) es
igual en todos. Cambia el cómo:

| Destino | Preview | Producción | Rollback | Headers de seguridad | Ojo con |
|---|---|---|---|---|---|
| Vercel | Automático por PR (Git) o `vercel` | `vercel --prod` o promover | `vercel rollback` | `vercel.json`/`vercel.ts` → `headers` | Hobby no permite uso comercial |
| Cloudflare Pages/Workers | Rama de preview o `wrangler deploy --env preview` | `wrangler deploy` (env production) | `wrangler rollback` o versión anterior | Archivo `_headers` o en el Worker | Bindings (D1, R2, KV) distintos por entorno |
| Railway | Entorno de PR (PR environments) o entorno `preview` | Deploy del servicio en `production` | Redeploy de una versión anterior desde el panel o CLI | En la app (middleware de headers) | Servicio web y worker separados; healthcheck configurado |
| Render | Preview environments o servicio de prueba | Deploy del servicio | Rollback a un deploy anterior | En la app | El plan gratis duerme el servicio |
| Fly.io | App de staging (`fly deploy -a <app>-staging`) | `fly deploy` | `fly releases` + desplegar la imagen anterior | En la app | Volúmenes ligados a una región |
| VPS + Coolify (Hostinger u otro) | Entorno de preview de Coolify | Deploy desde Coolify | Redeploy de la imagen anterior | Proxy (Traefik/Caddy) o la app | Tú cuidas actualizaciones, backups y firewall |

Reglas que no cambian con el destino: secretos solo en el panel o CLI del proveedor (jamás en el
repo), variables públicas solo con el prefijo del framework, health check que toca la base, y
`DEP-06`: producción solo con confirmación.

## Archivos que produce
```
.env.example                    toda variable usada, con comentario: dónde se obtiene, pública o secreta, por entorno
.gitignore                      .env, .env.*, excepto .env.example
.github/workflows/ci.yml        puertas en cada PR y en main
.github/workflows/migraciones.yml   (opcional) db push a producción al aprobar
vercel.json                     headers de seguridad, rewrites de SPA
e2e/smoke.spec.ts               flujo principal + health contra una URL dada
docs/despliegue.md              cómo publicar, cómo volver atrás, quién puede
```

### Puertas de CI (orden)
```yaml
# .github/workflows/ci.yml (extracto)
- run: npm ci
- run: npm run typecheck
- run: npm run lint
- run: npx supabase start && npx supabase db reset   # migraciones limpias + seed
- run: npm run test                                  # incluye tests de RLS
- run: npm run build
- run: npx size-limit                                # presupuesto de JS (FE-09)
- run: npm run mp:deriva                             # node masterplan/bin/masterplan.mjs deriva
```
En CI no existe `${CLAUDE_PLUGIN_ROOT}`: en la fase 5 se copia `masterplan.mjs` a
`masterplan/bin/` del proyecto y se agrega el script `mp:deriva`. La regla es una: `deriva` corre
en cada PR y sale 0.

### Headers de seguridad (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://<ref>.supabase.co wss://<ref>.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
    ]
  }]
}
```
Ajusta `connect-src`, `script-src` y `frame-src` por cada tercero real (pagos, analítica, Sentry).
Empieza con `Content-Security-Policy-Report-Only` en preview si hay dudas y pásalo a obligatorio
antes de producción.

## Candados
| Código | Regla | Cómo se verifica |
|---|---|---|
| DEP-01 | `.env` y variantes están en `.gitignore` y nunca entraron a git | `git ls-files` + `git log --all -- .env` |
| DEP-02 | Ninguna variable `VITE_*` contiene secretos (`SERVICE_ROLE`, `SECRET`, `sk_`, `PRIVATE`, `WEBHOOK`) y `service_role` no aparece en `src/` | grep (ver `auditor/checks.md`) |
| DEP-03 | `.env.example` lista toda variable usada en el código, y nada más | `masterplan.mjs deriva` |
| DEP-04 | CI corre typecheck, lint, test, build y `deriva` en cada PR; la rama principal exige CI verde | workflow + protección de rama |
| DEP-05 | Migraciones se aplican a producción antes de promover el deploy que las necesita | `docs/despliegue.md` + orden en el workflow |
| DEP-06 | Producción solo se publica con confirmación explícita de la persona | registro en `decisiones.log` |
| DEP-07 | Headers HSTS, CSP, nosniff, Referrer-Policy y frame-ancestors/X-Frame-Options presentes | `curl -sI` a la preview |
| DEP-08 | Previews usan el proyecto de datos de pruebas, nunca el de producción | variables por entorno en Vercel |
| DEP-09 | Rollback documentado y probado una vez antes del lanzamiento | evidencia |
| DEP-10 | Hosting con términos que permiten el uso comercial del proyecto | `arquitectura.md` › costos |

## Pasos que agrega al plan
**Primera tarea: repo, CI y entorno** (siempre T01 junto con el proyecto base)
- Archivos: `.gitignore`, `.env.example`, `.github/workflows/ci.yml`, `package.json` (scripts)
- CUANDO se abre un PR EL SISTEMA DEBE correr typecheck, lint, test y build y bloquear el merge si alguno falla.
- CUANDO alguien intenta agregar `.env` a git EL SISTEMA DEBE ignorarlo.
- Verificar: `npm run typecheck && npm run lint && npm run test && npm run build`

**Preview conectada**
- CUANDO se abre un PR EL SISTEMA DEBE publicar una preview con variables del entorno de pruebas.
- CUANDO se pide la preview EL SISTEMA DEBE responder con los headers de seguridad.
- Verificar: `curl -sI <preview> | grep -i strict-transport-security`

**Smoke y publicación** (fase 7, agente `masterplan:desplegador`)
- CUANDO el smoke corre contra la preview EL SISTEMA DEBE completar el flujo principal y el health check en verde.
- CUANDO la persona confirma la publicación EL SISTEMA DEBE aplicar migraciones, promover y verificar health en producción.
- CUANDO el health falla tras promover EL SISTEMA DEBE volver al deploy anterior y reportarlo.
- Verificar: `BASE_URL=<preview> npx playwright test e2e/smoke.spec.ts`

## Pruebas obligatorias
1. Smoke de Playwright contra la preview (flujo principal de la fase 2 + `/health`).
2. Headers verificados en la preview.
3. Rollback ensayado una vez.
4. `deriva` en verde en main.

## Lista de producción
- [ ] Dominio comprado, DNS apuntando a Vercel, HTTPS activo, redirección de `www` decidida
- [ ] Plan de hosting acorde al uso comercial
- [ ] Variables de producción cargadas (todas las de `.env.example` marcadas para prod)
- [ ] URLs de Auth, CORS y webhooks actualizadas al dominio final
- [ ] Protección de rama y deploy de producción restringido
- [ ] Rollback probado y documentado

## Trampas
- Poner la `service_role` en una variable `VITE_` "para probar": queda en el bundle público para siempre; rótala.
- Previews contra la base de producción: un PR de prueba borra datos reales.
- Desplegar código que lee una columna que la migración todavía no creó.
- CSP copiada de otro proyecto que bloquea Supabase Realtime (`wss:`) o el checkout de pagos.
- Olvidar los rewrites de SPA: recargar una ruta interna da 404.
- Cambiar variables en Vercel y no redeplegar: las de build no se actualizan solas.
