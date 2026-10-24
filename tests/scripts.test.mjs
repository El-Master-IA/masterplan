// Pruebas de scripts/masterplan.mjs y scripts/politicas.mjs sobre proyectos temporales.
// Correr: node --test tests/

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(RAIZ, 'scripts', 'masterplan.mjs')
const POL = path.join(RAIZ, 'scripts', 'politicas.mjs')

function proyectoTemporal(pr = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-'))
  fs.mkdirSync(path.join(dir, 'masterplan', 'plan'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'masterplan', 'proyecto.json'), JSON.stringify({ nombre: 'demo', modo: 'greenfield', fase: 1, creado: '2026-10-24', ...pr }))
  return dir
}
const escribir = (dir, rel, texto) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, texto) }
const mp = (dir, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' })
const pol = (dir, fase, evento) => spawnSync(process.execPath, [POL, fase], { cwd: dir, input: JSON.stringify({ cwd: dir, ...evento }), encoding: 'utf8' })

const tareaBuena = (id, extra = {}) => ({
  id, titulo: `Tarea ${id}`, ola: 1, depende: [], agente: 'masterplan:constructor', specs: ['AUTH-001'],
  archivos: [`src/${id}.ts`], hacer: 'algo concreto',
  criterios: ['CUANDO un anónimo pide /app EL SISTEMA DEBE redirigir a /login', 'CUANDO la sesión expira EL SISTEMA DEBE pedir login de nuevo'],
  verificar: ['npm test'], checkpoint: `git add -A && git commit -m "${id}" && git tag mp-${id}`, estado: 'pendiente', ...extra
})

function proyectoFase5(tareas) {
  const dir = proyectoTemporal({ fase: 5, capacidades: ['auth'], alcance: { version: 'recomendada', flujoPrincipal: ['entra'], noGoals: ['a', 'b', 'c', 'd', 'e'] } })
  for (const d of ['arquitectura.md', 'datos.md', 'api.md', 'DESIGN.md', 'EXPERIENCE.md']) escribir(dir, `masterplan/${d}`, `# ${d}\n`)
  escribir(dir, 'masterplan/seguridad.md', '# Seguridad\n## Matriz rol × recurso\n## Políticas RLS\n')
  escribir(dir, 'masterplan/specs/auth.md', '# Auth\n### AUTH-001\nCUANDO … EL SISTEMA DEBE …\n')
  escribir(dir, 'masterplan/plan/gate.md', '# Gate\n')
  escribir(dir, 'masterplan/plan/tareas.json', JSON.stringify(tareas))
  return dir
}

test('estado: contrato válido sale 0 y sin proyecto sale 1', () => {
  const dir = proyectoTemporal()
  const r = mp(dir, 'estado')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /Fase: 1 · descubrir/)
  assert.equal(mp(fs.mkdtempSync(path.join(os.tmpdir(), 'vacio-')), 'estado').status, 1)
})

test('validar: un plan correcto pasa', () => {
  const dir = proyectoFase5([tareaBuena('T01'), tareaBuena('T02', { ola: 2, depende: ['T01'] })])
  const r = mp(dir, 'validar')
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('validar: criterios vagos, sin verify, ciclos y pocos Non-Goals bloquean', () => {
  const dir = proyectoFase5([
    tareaBuena('T01', { depende: ['T02'], criterios: ['CUANDO entra EL SISTEMA DEBE funciona', 'algo sin forma'] }),
    tareaBuena('T02', { depende: ['T01'], verificar: [] })
  ])
  const pr = JSON.parse(fs.readFileSync(path.join(dir, 'masterplan/proyecto.json'), 'utf8'))
  pr.alcance.noGoals = ['solo uno']
  fs.writeFileSync(path.join(dir, 'masterplan/proyecto.json'), JSON.stringify(pr))
  const r = mp(dir, 'validar', '--json')
  assert.equal(r.status, 1)
  const textos = JSON.parse(r.stdout).map(h => h.texto).join('\n')
  assert.match(textos, /no observable/)
  assert.match(textos, /sin forma EARS/)
  assert.match(textos, /sin comando de verificación/)
  assert.match(textos, /ciclo de dependencias/)
  assert.match(textos, /Non-Goals/)
})

test('validar: preguntas abiertas bloquean desde la fase 4', () => {
  const dir = proyectoFase5([tareaBuena('T01')])
  escribir(dir, 'masterplan/datos.md', '# Datos\n[ABIERTA: ¿borrado suave? — bloquea tablas]\n')
  assert.equal(mp(dir, 'validar').status, 1)
})

test('tarea: no se toma una tarea con dependencias sin terminar ni dos veces', () => {
  const dir = proyectoFase5([tareaBuena('T01'), tareaBuena('T02', { ola: 2, depende: ['T01'] })])
  assert.equal(mp(dir, 'tarea', 'T02', 'en-curso').status, 2)
  assert.equal(mp(dir, 'tarea', 'T01', 'en-curso').status, 0)
  assert.equal(mp(dir, 'tarea', 'T01', 'en-curso').status, 2)
  assert.equal(mp(dir, 'tarea', 'T01', 'hecha').status, 0)
  assert.match(mp(dir, 'tarea').stdout, /T02/)
})

test('deriva: tabla sin RLS y variable sin documentar fallan; corregidas pasan', () => {
  const dir = proyectoTemporal({ fase: 8 })
  escribir(dir, 'supabase/migrations/20261024_init.sql', 'create table public.notas (id uuid primary key);')
  escribir(dir, 'src/cliente.ts', 'const u = import.meta.env.VITE_SUPABASE_URL')
  let r = mp(dir, 'deriva')
  assert.equal(r.status, 1)
  assert.match(r.stdout, /notas/)
  assert.match(r.stdout, /VITE_SUPABASE_URL/)
  escribir(dir, 'supabase/migrations/20261024_init.sql', 'create table public.notas (id uuid primary key);\nalter table public.notas enable row level security;')
  escribir(dir, '.env.example', 'VITE_SUPABASE_URL=\n')
  r = mp(dir, 'deriva')
  assert.equal(r.status, 0, r.stdout)
})

test('cambio: el delta se aplica a las specs vivas y se archiva', () => {
  const dir = proyectoTemporal({ fase: 8 })
  escribir(dir, 'masterplan/specs/auth.md', '# Auth\n\n### AUTH-001\nversión vieja\n\n### AUTH-002\nse va\n')
  assert.equal(mp(dir, 'cambio', 'nuevo', 'Login con Google').status, 0)
  const carpeta = fs.readdirSync(path.join(dir, 'masterplan', 'cambios')).find(n => n.endsWith('login-con-google'))
  escribir(dir, `masterplan/cambios/${carpeta}/delta.md`, [
    '# Cambio', '## Agregados', '### AUTH-003 · specs/auth.md', 'CUANDO entra con Google EL SISTEMA DEBE crear su org', '',
    '## Modificados', '### AUTH-001 · specs/auth.md', 'versión nueva', '',
    '## Eliminados', '### AUTH-002 · specs/auth.md', 'Motivo: ya no aplica', ''
  ].join('\n'))
  const r = mp(dir, 'cambio', 'archivar', `masterplan/cambios/${carpeta}`)
  assert.equal(r.status, 0, r.stderr)
  const spec = fs.readFileSync(path.join(dir, 'masterplan/specs/auth.md'), 'utf8')
  assert.match(spec, /AUTH-003/)
  assert.match(spec, /versión nueva/)
  assert.doesNotMatch(spec, /versión vieja|AUTH-002/)
  assert.ok(fs.existsSync(path.join(dir, 'masterplan/cambios/archivo', carpeta)))
})

test('auditoria: fusiona, deduplica y separa las dos notas', () => {
  const dir = proyectoTemporal({ fase: 7 })
  const h = (id, dominio, severidad, regla, archivo) => ({ id, dominio, severidad, titulo: id, evidencia: 'x', regla, confianza: 'establecida', archivo })
  escribir(dir, 'masterplan/auditoria/pendientes/seguridad.json', JSON.stringify([h('S1', 'seguridad', 'critica', 'DEP-02', 'src/a.ts'), h('S2', 'seguridad', 'media', 'DEP-02', 'src/a.ts')]))
  escribir(dir, 'masterplan/auditoria/pendientes/frontend.json', JSON.stringify([h('F1', 'frontend-a11y', 'media', 'FE-05', 'src/b.tsx'), { id: 'mal' }]))
  const r = mp(dir, 'auditoria', 'fusionar')
  assert.equal(r.status, 1)
  assert.match(r.stdout, /Seguridad 49\/100 · Experiencia 97\/100 · 2 hallazgos/)
})

test('buzon: un mensaje para la fase llega y se marca leído', () => {
  const dir = proyectoTemporal({ fase: 6 })
  assert.equal(mp(dir, 'buzon', 'enviar', '--para', 'fase-6', 'T05 ya está hecha').status, 0)
  assert.match(mp(dir, 'buzon', 'leer').stdout, /T05 ya está hecha/)
  assert.match(mp(dir, 'buzon', 'leer').stdout, /Buzón vacío/)
})

test('políticas: bloquean service_role en el cliente y escribir .env', () => {
  const dir = proyectoTemporal()
  let r = pol(dir, 'pre', { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'src/lib/db.ts'), content: 'createClient(url, import.meta.env.VITE_SERVICE_ROLE_KEY)' } })
  const salida = JSON.parse(r.stdout)
  assert.equal(salida.hookSpecificOutput.permissionDecision, 'deny')
  assert.match(salida.hookSpecificOutput.permissionDecisionReason, /MP-SEC-01/)
  r = pol(dir, 'pre', { tool_name: 'Write', tool_input: { file_path: path.join(dir, '.env'), content: 'A=1' } })
  assert.match(r.stdout, /MP-SEC-04/)
  r = pol(dir, 'pre', { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'supabase/functions/x/index.ts'), content: 'Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")' } })
  assert.equal(r.stdout, '')
})

test('políticas: avisan tabla sin RLS; la excepción con motivo se registra', () => {
  const dir = proyectoTemporal()
  const ev = { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'supabase/migrations/1_x.sql'), content: 'create table public.logs (id int);' } }
  let r = pol(dir, 'post', ev)
  assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /MP-DAT-01/)
  assert.equal(pol(dir, 'pre', ev).stdout, '')
  ev.tool_input.content += '\n-- masterplan-permitir: MP-DAT-01 -- tabla interna sin acceso por API'
  r = pol(dir, 'post', ev)
  assert.equal(r.stdout, '')
  assert.match(fs.readFileSync(path.join(dir, 'masterplan/evidencia/excepciones.log'), 'utf8'), /MP-DAT-01/)
})

test('políticas: modo estricto convierte avisos en bloqueos; fuera de un proyecto no actúan', () => {
  const dir = proyectoTemporal({ politicas: 'estrictas' })
  const ev = { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'supabase/migrations/1_x.sql'), content: 'create table public.logs (id int);' } }
  assert.match(pol(dir, 'pre', ev).stdout, /deny/)
  const fuera = fs.mkdtempSync(path.join(os.tmpdir(), 'nomp-'))
  assert.equal(pol(fuera, 'pre', { tool_name: 'Write', tool_input: { file_path: path.join(fuera, '.env'), content: 'A=1' } }).stdout, '')
})

test('políticas: bloquean push forzado y db reset remoto', () => {
  const dir = proyectoTemporal()
  assert.match(pol(dir, 'pre', { tool_name: 'Bash', tool_input: { command: 'git push --force origin main' } }).stdout, /MP-GIT-01/)
  assert.match(pol(dir, 'pre', { tool_name: 'Bash', tool_input: { command: 'npx supabase db reset --linked' } }).stdout, /MP-DAT-04/)
  assert.equal(pol(dir, 'pre', { tool_name: 'Bash', tool_input: { command: 'git push --force-with-lease origin feat' } }).stdout, '')
})

// ---------- proveedores ----------
function catalogoEjemplo() {
  const f = (id, categoria, rasgos, extra = {}) => ({
    id, nombre: id, categoria, especialidad: 'x', rasgos, usarCuando: ['x'], evitarCuando: ['x'],
    gratis: 'Plan gratis', precio: 'uso', fuente: 'https://ejemplo.com', verificado: '2026-10-24', ...extra
  })
  const lista = [
    f('supabase-db', 'base-de-datos', ['postgres', 'rls', 'realtime-db', 'backups-automaticos'], { porDefecto: true, empresa: 'supabase' }),
    f('neon', 'base-de-datos', ['postgres', 'ramas-de-base', 'serverless-db', 'escala-a-cero']),
    f('mongodb-atlas', 'base-de-datos', ['nosql-documentos']),
    f('vercel', 'hosting-web', ['ssr', 'spa', 'sitio-estatico', 'preview-por-pr'], { usoComercialGratis: false }),
    f('cloudflare-pages', 'hosting-web', ['ssr', 'spa', 'sitio-estatico', 'borde-global'], { usoComercialGratis: true, empresa: 'cloudflare' }),
    f('railway', 'backend', ['api-http', 'proceso-largo', 'contenedor-docker', 'cron']),
    f('cloudflare-workers', 'serverless-borde', ['borde-global', 'api-http'], { empresa: 'cloudflare' }),
    f('bunny-stream', 'video', ['video-vod', 'cdn-global', 'presupuesto-bajo'], { gratis: 'No tiene plan gratis', latam: 'PoPs en São Paulo' }),
    f('mux', 'video', ['video-vod', 'video-en-vivo', 'drm']),
    f('cloudflare-r2', 'almacenamiento', ['archivos-grandes', 'sin-costo-salida', 'subidas-directas'], { empresa: 'cloudflare' }),
    f('better-auth', 'auth', ['auth-email']),
    f('better-stack', 'observabilidad', ['errores']),
    f('supabase-storage', 'almacenamiento', ['subidas-directas'], { empresa: 'supabase' }),
    f('pancake', 'chatbots', ['bandeja-compartida', 'crm-ventas', 'whatsapp'], { empresa: 'pancake' }),
    f('botcake', 'chatbots', ['chatbot-no-code', 'whatsapp'], { empresa: 'pancake' }),
    f('otrobot', 'chatbots', ['chatbot-no-code']),
    f('whatsapp-cloud-api', 'mensajeria', ['whatsapp', 'api-whatsapp-oficial']),
  ]
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cat-')), 'proveedores.json')
  fs.writeFileSync(p, JSON.stringify(lista))
  return p
}
const mpCat = (dir, cat, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, MASTERPLAN_CATALOGO: cat } })

test('proveedores: el catálogo real del plugin es válido', () => {
  const r = spawnSync(process.execPath, [CLI, 'proveedores', 'validar'], { cwd: RAIZ, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('proveedores: video pide un servicio de video y no el storage de la base', () => {
  const dir = proyectoTemporal()
  const r = mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'postgres,video-vod,drm', '--json')
  assert.equal(r.status, 0, r.stderr)
  const out = JSON.parse(r.stdout)
  const video = out.find(c => c.categoria === 'video')
  assert.equal(video.recomendado.id, 'mux')                     // único que cubre DRM
  assert.ok(video.descartes.some(d => d.id === 'bunny-stream' && /drm/.test(d.motivo)))
  assert.equal(out.find(c => c.categoria === 'base-de-datos').recomendado.id, 'supabase-db')
  assert.ok(!out.some(c => c.categoria === 'almacenamiento'))  // nadie pidió archivos
})

test('proveedores: procesos largos llevan a un backend con contenedor, no a funciones', () => {
  const dir = proyectoTemporal()
  const out = JSON.parse(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'proceso-largo,cron', '--json').stdout)
  assert.equal(out.find(c => c.categoria === 'backend').recomendado.id, 'railway')
})

test('proveedores: presupuesto cero con uso comercial descarta planes gratis no comerciales', () => {
  const dir = proyectoTemporal()
  const out = JSON.parse(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'ssr', '--presupuesto', 'cero', '--comercial', '--json').stdout)
  const web = out.find(c => c.categoria === 'hosting-web')
  assert.equal(web.recomendado.id, 'cloudflare-pages')
  assert.ok(web.alternativas.find(a => a.id === 'vercel').razones.some(x => /no permite uso comercial/.test(x)))
})

test('proveedores: prefiere repetir proveedor y respeta lo que la persona evita', () => {
  const dir = proyectoTemporal({ necesidades: { rasgos: ['borde-global', 'archivos-grandes', 'ssr'], evitar: ['vercel'] } })
  const out = JSON.parse(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--json').stdout)
  const web = out.find(c => c.categoria === 'hosting-web')
  assert.equal(web.recomendado.id, 'cloudflare-pages')
  assert.ok(web.descartes.some(d => d.id === 'vercel'))
  assert.equal(out.find(c => c.categoria === 'almacenamiento').recomendado.id, 'cloudflare-r2')
})

test('proveedores: rasgos desconocidos y fichas incompletas se rechazan', () => {
  const dir = proyectoTemporal()
  assert.equal(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'teletransporte').status, 1)
  const malo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cat-')), 'p.json')
  fs.writeFileSync(malo, JSON.stringify([{ id: 'x', categoria: 'inventada', rasgos: ['nada'] }]))
  const r = mpCat(dir, malo, 'proveedores', 'validar')
  assert.equal(r.status, 1)
  assert.match(r.stdout, /categoría desconocida/)
  assert.match(r.stdout, /rasgo fuera del vocabulario/)
})

test('proveedores: --guardar escribe la elección en proyecto.json', () => {
  const dir = proyectoTemporal()
  assert.equal(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'postgres,video-vod', '--guardar').status, 0)
  const pr = JSON.parse(fs.readFileSync(path.join(dir, 'masterplan/proyecto.json'), 'utf8'))
  assert.equal(pr.proveedores['base-de-datos'], 'supabase-db')
  assert.ok(pr.proveedores.video)
})

test('proveedores: la afinidad usa la empresa real, no la primera palabra del id', () => {
  const dir = proyectoTemporal()
  const out = JSON.parse(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'auth-email,errores', '--json').stdout)
  for (const c of out) assert.ok(!c.recomendado.razones.some(r => /mismo proveedor/.test(r)), c.categoria)
})

test('proveedores: si nadie cubre todo, propone la pareja que sí (mejor de la misma empresa)', () => {
  const dir = proyectoTemporal()
  const out = JSON.parse(mpCat(dir, catalogoEjemplo(), 'proveedores', 'recomendar', '--rasgos', 'chatbot-no-code,bandeja-compartida,crm-ventas,whatsapp', '--json').stdout)
  const chat = out.find(c => c.categoria === 'chatbots')
  assert.deepEqual(chat.recomendado.combo, ['pancake', 'botcake'].sort((a, b) => chat.recomendado.combo.indexOf(a) - chat.recomendado.combo.indexOf(b)))
  assert.ok(chat.recomendado.combo.includes('pancake') && chat.recomendado.combo.includes('botcake'))
  const men = out.find(c => c.categoria === 'mensajeria')
  assert.equal(men.recomendado, null)
  assert.match(men.cubiertoPor, /Pancake|pancake/)
})
