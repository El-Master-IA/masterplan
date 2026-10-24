# Checks deterministas por dominio

Comandos que corren `masterplan.mjs` o los auditores antes de cualquier juicio del modelo. Se
ejecutan desde la raíz del proyecto, en bash (Git Bash en Windows). Cada check tiene un código
`CHK-*` y los candados que respalda; un hallazgo que sale de un check usa como `regla` el candado
(si existe) o el código del check, con `confianza: "establecida"`.

Salida esperada: **vacía o 0 = pasa**. Cualquier línea es un hallazgo potencial que el auditor
confirma (falsos positivos en tests, ejemplos o comentarios se descartan con razón escrita).
Guarda cada salida en `masterplan/evidencia/auditoria/<CHK>.txt`.

## seguridad

| Código | Respalda | Comando | Severidad sugerida |
|---|---|---|---|
| CHK-SEG-01 | DEP-02 | `grep -rnE "service_role\|SERVICE_ROLE" src/ public/ index.html` | critica |
| CHK-SEG-02 | DEP-02 | `grep -nE "^VITE_[A-Z_]*(SECRET\|SERVICE\|PRIVATE\|WEBHOOK\|TOKEN)" .env.example; grep -rnE "import\.meta\.env\.VITE_[A-Z_]*(SECRET\|SERVICE\|PRIVATE)" src/` | critica |
| CHK-SEG-03 | DEP-02 | Secretos en el bundle: `npm run build && grep -rnoE "(sk_live_[0-9A-Za-z]{8,}\|sk_test_[0-9A-Za-z]{8,}\|eyJhbGciOi[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{20,}\.)" dist/` y comparar cada JWT con la anon key (la anon key es pública; cualquier otro es hallazgo) | critica |
| CHK-SEG-04 | DEP-01 | `git ls-files \| grep -E "(^\|/)\.env(\..*)?$" \| grep -v "\.env\.example$"; git log --all --name-only --format= -- '.env' '.env.*' \| grep -v example \| sort -u` | critica |
| CHK-SEG-05 | — | Escaneo de secretos en historial: `npx --yes gitleaks detect --no-banner --redact` (si está disponible; si no, "no verificado") | critica/alta |
| CHK-SEG-06 | API-03, PAG-02 | En cada `supabase/functions/webhook-*/index.ts`: `grep -n "req.json()"` (no debe aparecer antes de la verificación) y `grep -nE "constructEvent\|createHmac\|subtle\.(verify\|sign)\|verificarFirma"` (debe aparecer) | critica |
| CHK-SEG-07 | API-02 | `grep -nE "verify_jwt\s*=\s*false" supabase/config.toml` y confirmar que cada función listada es webhook o pública declarada en `api.md` | alta |
| CHK-SEG-08 | API-01 | Funciones sin validación: `for f in supabase/functions/*/index.ts; do grep -qE "\.(safeParse\|parse)\(" "$f" \|\| echo "$f"; done` (excluir `_shared`) | alta |
| CHK-SEG-09 | API-07 | `grep -rn "Access-Control-Allow-Origin" supabase/functions \| grep "\*"` | alta |
| CHK-SEG-10 | API-09 | `grep -rn "SUPABASE_SERVICE_ROLE_KEY" supabase/functions \| grep -v "masterplan-permitir"` (cada uso requiere justificación) | media |
| CHK-SEG-11 | DEP-07 | `curl -sI "$BASE_URL" \| grep -iE "strict-transport-security\|content-security-policy\|x-content-type-options\|referrer-policy\|x-frame-options"` (deben aparecer las 5, o `frame-ancestors` en la CSP) | media |
| CHK-SEG-12 | — | SQL armado con texto: `grep -rnE "\.(rpc\|from)\(.*\\\$\{\|sql\`.*\\\$\{\|\.or\(\`.*\\\$\{" src/ supabase/functions` | alta |
| CHK-SEG-13 | AUT-04 | `grep -rnE "user_metadata\|raw_user_meta_data" supabase/migrations src/ \| grep -iE "role\|rol\|admin\|plan"` | alta |
| CHK-SEG-14 | AUT-03 | `grep -niE "token\s+(text\|varchar)" supabase/migrations/*.sql \| grep -vi hash` | alta |
| CHK-SEG-15 | PAG-01 | `grep -nE "(amount\|monto\|price\|precio)" supabase/functions/crear-checkout/index.ts \| grep -iE "body\|req\|payload"` | critica |
| CHK-SEG-16 | OBS-02 | `grep -rnE "(log\|track\|captureException\|console\.(log\|error))\(.*(email\|correo\|password\|token\|telefono\|phone\|documento)" src/ supabase/functions` | media |

## rls

Contra la base local (`supabase start`) y, en la fase 7, contra producción con un usuario de solo
lectura: `psql "$DATABASE_URL" -At -c "<consulta>"`.

| Código | Respalda | Consulta | Severidad sugerida |
|---|---|---|---|
| CHK-RLS-01 | DAT-01 | `select schemaname\|\|'.'\|\|tablename from pg_tables where schemaname = 'public' and not rowsecurity;` | critica |
| CHK-RLS-02 | DAT-02 | `select t.tablename from pg_tables t left join pg_policies p on p.schemaname = t.schemaname and p.tablename = t.tablename where t.schemaname = 'public' and t.rowsecurity group by t.tablename having count(p.policyname) = 0;` (RLS sin políticas: nadie accede; confirmar que es intencional) | media |
| CHK-RLS-03 | DAT-03 | `select tablename, policyname, cmd from pg_policies where schemaname = 'public' and (qual = 'true' or with_check = 'true');` | critica |
| CHK-RLS-04 | DAT-03 | `select tablename, policyname from pg_policies where schemaname = 'public' and 'anon' = any(roles) and cmd <> 'SELECT';` | critica |
| CHK-RLS-05 | — | `select tablename, policyname from pg_policies where schemaname = 'public' and cmd = 'UPDATE' and with_check is null;` | alta |
| CHK-RLS-06 | DAT-09, AUT-02 | `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');` | alta |
| CHK-RLS-07 | DAT-10 | `select id from storage.buckets where public;` (cada bucket público debe estar justificado en `datos.md`) | alta |
| CHK-RLS-08 | — | Vistas que saltan RLS: `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'v' and not coalesce((select bool_or(o = 'security_invoker=true') from unnest(c.reloptions) o), false);` | alta |
| CHK-RLS-09 | DAT-07 | Columnas de políticas sin índice: listar `org_id`/`user_id` de tablas públicas sin índice que empiece por ellas: `select c.table_name, c.column_name from information_schema.columns c where c.table_schema = 'public' and c.column_name in ('org_id','user_id') and not exists (select 1 from pg_indexes i where i.schemaname = 'public' and i.tablename = c.table_name and i.indexdef ~ ('\(' \|\| c.column_name));` | media |
| CHK-RLS-10 | DAT-08 | Test de aislamiento existe y pasa: `ls tests/rls/*.test.ts && npx vitest run tests/rls` | critica si falla, alta si no existe |
| CHK-RLS-11 | DAT-05 | `grep -niE "(amount\|monto\|price\|precio\|total)[a-z_]*\s+(float\|real\|double precision\|money\|numeric)" supabase/migrations/*.sql` | alta |
| CHK-RLS-12 | DAT-06 | `masterplan.mjs deriva` (reporta migraciones aplicadas modificadas y tablas nuevas sin política) | alta |

## dependencias

| Código | Comando | Severidad |
|---|---|---|
| CHK-DEP-01 | `npm audit --omit=dev --audit-level=high --json` | la del aviso (critical → critica, high → alta) |
| CHK-DEP-02 | `npm audit --audit-level=moderate` (dev incluidas) | media/baja |
| CHK-DEP-03 | Lockfile presente y sincronizado: `test -f package-lock.json && npm ci --dry-run` | media |
| CHK-DEP-04 | `npx --yes npm-check-updates --target minor` para ver desfase; el modelo juzga paquetes sin publicación en más de 2 años o con nombre parecido a uno popular | baja (modelo puede subir) |
| CHK-DEP-05 | Scripts de instalación de terceros: `npm query ":attr(scripts, [postinstall])"` y revisar cada paquete listado | media |

## frontend-a11y

| Código | Respalda | Comando |
|---|---|---|
| CHK-A11Y-01 | FE-05 | `npx playwright test e2e/a11y.spec.ts` usando `@axe-core/playwright` (`new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()`) en cada pantalla del flujo principal; `critical` → critica si bloquea el flujo, si no alta; `serious` → alta; `moderate` → media |
| CHK-A11Y-02 | FE-06 | E2E de teclado: recorrer el flujo con `page.keyboard.press('Tab')` / `Enter` sin usar el mouse |
| CHK-A11Y-03 | FE-06 | `grep -rnE "outline-none\|outline:\s*none" src/ \| grep -v "focus-visible"` |
| CHK-A11Y-04 | FE-04 | `grep -rnE "animate-\|transition\|@keyframes\|motion\." src/ -l` y confirmar `motion-reduce:` o `prefers-reduced-motion` en el proyecto: `grep -rn "prefers-reduced-motion\|motion-reduce" src/` |
| CHK-A11Y-05 | FE-07 | `grep -rnP "<img(?![^>]*alt=)" src/` y `grep -rnP "<(input\|select\|textarea)(?![^>]*(aria-label\|id=))" src/` |
| CHK-A11Y-06 | — | `grep -n "<html" index.html \| grep -v "lang="` |

## rendimiento

| Código | Respalda | Comando | Umbral |
|---|---|---|---|
| CHK-REN-01 | FE-10 | `npx --yes @lhci/cli autorun` con `lighthouserc.json` (pantallas públicas, móvil) | rendimiento ≥ 90, accesibilidad ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms |
| CHK-REN-02 | FE-09 | `npx size-limit` o `npm run build` y sumar `dist/assets/*.js` del chunk inicial con gzip: `gzip -c dist/assets/index-*.js \| wc -c` | ≤ presupuesto de `DESIGN.md` (default 200 KB) |
| CHK-REN-03 | FE-09 | Rutas sin carga diferida: `grep -nE "^import .* from '\.\./features\|^import .* from '@/features" src/app/router.tsx` | 0 importaciones estáticas de pantallas |
| CHK-REN-04 | FE-11 | `grep -rnP "<img(?![^>]*(width\|height))" src/` | 0 |
| CHK-REN-05 | FE-08 | `grep -rnA3 "useEffect" src/ \| grep -E "fetch\(\|supabase\.from\("` | 0 |
| CHK-REN-06 | DAT-07 | Consultas lentas en base local con datos de seed ampliado: `select query, mean_exec_time from pg_stat_statements order by mean_exec_time desc limit 10;` y `explain analyze` de las 3 peores | sin `Seq Scan` en tablas > 10.000 filas |

## estetica-generica

| Código | Respalda | Comando |
|---|---|---|
| CHK-EST-01 | FE-02 | `grep -rnE "#[0-9a-fA-F]{3,8}\b\|rgba?\(\|hsla?\(" src/ --include=*.tsx --include=*.ts` (excluye `src/styles/tokens.css`) |
| CHK-EST-02 | FE-02 | `grep -rnoE "(text\|bg\|p\|m\|w\|h\|rounded\|shadow)-\[[^]]+\]" src/` |
| CHK-EST-03 | FE-03 | `grep -rnE "transition-all\|transition:\s*all" src/` |
| CHK-EST-04 | FE-12 (1, 2) | `grep -rnE "bg-gradient-to-[a-z]+ from-(purple\|violet\|indigo\|fuchsia\|pink)\|bg-clip-text text-transparent" src/` |
| CHK-EST-05 | FE-12 (4) | `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/ --include=*.tsx` |
| CHK-EST-06 | FE-12 (9) | `grep -rniE "lorem ipsum\|bienvenido a nuestra plataforma\|potencia tu negocio\|lleva tu .* al siguiente nivel" src/` |
| CHK-EST-07 | FE-12 (6, 7) | `grep -rnoE "shadow-2xl\|backdrop-blur-[a-z]+\|rounded-(3xl\|full)" src/ \| wc -l` (conteo alto se revisa contra `DESIGN.md`) |
| CHK-EST-08 | FE-01 | Por pantalla de `EXPERIENCE.md`, existencia de los estados: `grep -lE "Vacio\|ErrorVista\|SinPermiso\|Skeleton" src/features/<feature>/` |
| CHK-EST-09 | — | Capturas 390×844 y 1440×900, claro y oscuro: `npx playwright test e2e/capturas.spec.ts`; el modelo las juzga contra los 12 patrones de `masterplan:kit-frontend` |

## seo-agentes

Solo para rutas públicas (landing, precios, blog, docs). Con `BASE_URL` de la preview.

| Código | Comando | Pasa si |
|---|---|---|
| CHK-SEO-01 | `curl -s "$BASE_URL" \| grep -oE "<title>[^<]+</title>\|<meta name=\"description\"[^>]+>"` | título y descripción propios por ruta pública |
| CHK-SEO-02 | `curl -s "$BASE_URL" \| grep -cE "property=\"og:(title\|description\|image)\""` | 3 |
| CHK-SEO-03 | `curl -s "$BASE_URL/robots.txt"; curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sitemap.xml"` | robots no bloquea lo público; sitemap 200 |
| CHK-SEO-04 | Contenido sin JS: `curl -s "$BASE_URL" \| sed 's/<[^>]*>//g' \| tr -s ' \n' \| wc -w` | > 150 palabras en la landing (si es SPA pura, prerender de rutas públicas) |
| CHK-SEO-05 | `curl -s "$BASE_URL" \| grep -c "application/ld+json"` | ≥ 1 (Organization o SoftwareApplication) |
| CHK-SEO-06 | `curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/llms.txt"` | 200 con resumen del producto y enlaces clave |
| CHK-SEO-07 | `curl -s "$BASE_URL" \| grep -oE "<link rel=\"canonical\"[^>]+>"` | presente y absoluto |
| CHK-SEO-08 | `curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ruta-que-no-existe"` | 404 o página 404 con `noindex` |

## Cómo registrar un resultado

```json
[
  {
    "id": "RLS-001",
    "dominio": "rls",
    "severidad": "critica",
    "titulo": "La tabla public.facturas no tiene RLS habilitada",
    "archivo": "supabase/migrations/20261020120000_facturas.sql",
    "linea": 1,
    "evidencia": "CHK-RLS-01 devolvió: public.facturas",
    "regla": "DAT-01",
    "cwe": "CWE-284",
    "owasp": "A01:2021",
    "arreglo": "Nueva migración con alter table public.facturas enable row level security y políticas por org.",
    "confianza": "establecida",
    "verificado": true,
    "auditor": "masterplan:auditor-seguridad"
  }
]
```
Se guarda en `masterplan/auditoria/pendientes/<agente>.json` y luego
`node "${CLAUDE_PLUGIN_ROOT}/scripts/masterplan.mjs" auditoria fusionar`.
