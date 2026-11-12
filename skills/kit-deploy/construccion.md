# Kit · deploy · construcción

Segunda mitad del kit `masterplan:kit-deploy`. Las decisiones y los candados están en `SKILL.md`.

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
