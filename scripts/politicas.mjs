#!/usr/bin/env node
// Políticas de Masterplan: revisan cada escritura y comando ANTES (pre) y DESPUÉS (post) de que ocurra.
// pre  → bloquea lo que nunca debe pasar (secretos, service_role en el cliente, .env, force push).
// post → avisa al modelo de lo que debe corregir (tabla sin RLS, webhook sin firma, migración editada).
// Excepción registrada: en el contenido, `masterplan-permitir: <CODIGO> -- <motivo>`.
// Modo estricto: masterplan/proyecto.json { "politicas": "estrictas" } o MASTERPLAN_ESTRICTO=1 → los avisos bloquean.

import fs from 'node:fs'
import path from 'node:path'

const fase = process.argv[2] === 'post' ? 'post' : 'pre'
let entrada = ''
try { entrada = fs.readFileSync(0, 'utf8') } catch { process.exit(0) }
let ev
try { ev = JSON.parse(entrada || '{}') } catch { process.exit(0) }

const raiz = ev.cwd || process.cwd()
const herramienta = ev.tool_name || ''
const input = ev.tool_input || {}
const mp = path.join(raiz, 'masterplan')

// Solo actúa en proyectos Masterplan (o si se fuerza con MASTERPLAN_POLITICAS=1).
if (!fs.existsSync(path.join(mp, 'proyecto.json')) && process.env.MASTERPLAN_POLITICAS !== '1') process.exit(0)

let estricto = process.env.MASTERPLAN_ESTRICTO === '1'
try { estricto ||= JSON.parse(fs.readFileSync(path.join(mp, 'proyecto.json'), 'utf8')).politicas === 'estrictas' } catch {}

const norm = p => (p || '').split(path.sep).join('/')
const archivo = norm(input.file_path || input.notebook_path || '')
const relativo = norm(path.relative(raiz, path.resolve(raiz, archivo || '.')))

function contenidoNuevo() {
  if (herramienta === 'Write') return input.content || ''
  if (herramienta === 'Edit') return input.new_string || ''
  if (herramienta === 'MultiEdit') return (input.edits || []).map(e => e.new_string || '').join('\n')
  return ''
}

const esCliente = r => /^(src|app|components|pages|lib|hooks|public)\//.test(r) && !/(^|\/)(server|api|supabase\/functions|edge|scripts)\//.test(r) && !/\.(test|spec)\.[jt]sx?$/.test(r)
const esCodigo = r => /\.(m?[jt]sx?|vue|svelte|html)$/.test(r)
const esEnv = r => /(^|\/)\.env(\.|$)/.test(r) && !/\.env\.(example|sample|template)$/.test(r)
const esMigracion = r => /^supabase\/migrations\/.+\.sql$/.test(r)

const hallazgos = []
const regla = (codigo, nivel, texto, arreglo) => hallazgos.push({ codigo, nivel, texto, arreglo })

if (['Write', 'Edit', 'MultiEdit'].includes(herramienta) && archivo) {
  const t = contenidoNuevo()

  if (esEnv(relativo))
    regla('MP-SEC-04', 'bloquear', `No escribo ${relativo}: los secretos los pone la persona a mano.`, 'Documenta la variable en .env.example (sin valor) y pide a la persona que la llene en su .env.')

  if (esCodigo(relativo) && esCliente(relativo) && /service_role|SERVICE_ROLE_KEY|SUPABASE_SERVICE/i.test(t))
    regla('MP-SEC-01', 'bloquear', `${relativo} es código del navegador y menciona la llave service_role.`, 'La service_role solo vive en Edge Functions o en el servidor. En el cliente usa la anon key y RLS.')

  for (const m of t.matchAll(/\b(VITE|NEXT_PUBLIC|PUBLIC|EXPO_PUBLIC)_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|TOKEN_SECRET|SK)\b/g))
    regla('MP-SEC-02', 'bloquear', `${m[0]} expone un secreto: todo lo que empieza con ${m[1]}_ llega al navegador.`, 'Quita el prefijo público y úsala solo en el servidor o en una Edge Function.')

  if (!esEnv(relativo) && !/\.env\.(example|sample|template)$/.test(relativo)) {
    const patrones = [
      [/\bsk_live_[0-9a-zA-Z]{10,}/, 'llave secreta de Stripe en vivo'],
      [/\b(AKIA|ASIA)[0-9A-Z]{16}\b/, 'llave de AWS'],
      [/\bgh[pousr]_[0-9A-Za-z]{30,}\b/, 'token de GitHub'],
      [/\bxox[baprs]-[0-9A-Za-z-]{10,}/, 'token de Slack'],
      [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'llave privada'],
      [/\bsk-(ant-|proj-)?[A-Za-z0-9_-]{30,}/, 'llave de API de modelos de IA'],
      [/eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}/, 'JWT incrustado (¿service_role?)']
    ]
    for (const [re, nombre] of patrones) if (re.test(t))
      regla('MP-SEC-03', 'bloquear', `Hay una ${nombre} escrita en ${relativo}.`, 'Muévela a una variable de entorno; en el código solo el nombre de la variable.')
  }

  if (esMigracion(relativo)) {
    const sql = t.toLowerCase()
    const creadas = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?/g)].map(m => m[1])
    for (const tabla of creadas)
      if (!new RegExp(`alter\\s+table\\s+(?:only\\s+)?(?:public\\.)?"?${tabla}"?\\s+enable\\s+row\\s+level\\s+security`).test(sql))
        regla('MP-DAT-01', 'avisar', `La tabla ${tabla} se crea sin habilitar RLS en la misma migración.`, `Agrega: alter table public.${tabla} enable row level security; y sus políticas por rol (ver masterplan:kit-datos).`)
    if (/\bto\s+anon\b[\s\S]{0,80}\busing\s*\(\s*true\s*\)/.test(sql) || /\busing\s*\(\s*true\s*\)[\s\S]{0,40}\bto\s+anon\b/.test(sql))
      regla('MP-DAT-03', 'avisar', 'Una política deja leer todo a usuarios anónimos (using (true)).', 'Confírmalo en seguridad.md o restringe la política.')
    if (herramienta === 'Edit' || herramienta === 'MultiEdit')
      regla('MP-DAT-02', 'avisar', `Estás editando una migración existente (${relativo}). Si ya se aplicó en algún entorno, el cambio no llegará.`, 'Crea una migración nueva con supabase migration new <nombre>.')
  }

  if (/webhook/i.test(relativo) && esCodigo(relativo) && herramienta === 'Write' &&
      !/(constructEvent|verify|signature|hmac|x-signature|timingSafeEqual|firma)/i.test(t))
    regla('MP-API-01', 'avisar', `${relativo} parece un webhook y no verifica firma.`, 'Verifica la firma sobre el cuerpo crudo y deduplica por id de evento (ver masterplan:kit-api).')

  if (esCodigo(relativo) && esCliente(relativo) && /dangerouslySetInnerHTML/.test(t) && !/(DOMPurify|sanitize)/i.test(t))
    regla('MP-SEC-05', 'avisar', `${relativo} inyecta HTML sin sanitizar.`, 'Sanitiza con DOMPurify o renderiza como texto.')
}

if (herramienta === 'Bash') {
  const c = String(input.command || '')
  if (/\bgit\s+add\b[^;&|]*(^|\s)\.env(\s|$|\.(?!example|sample|template))/.test(c))
    regla('MP-SEC-06', 'bloquear', 'Ese git add incluye un archivo .env.', 'Agrega .env* a .gitignore (salvo .env.example) y quítalo del índice.')
  if (/\bgit\s+push\b.*(--force\b|-f\b)(?!-with-lease)/.test(c))
    regla('MP-GIT-01', 'bloquear', 'Push forzado bloqueado: reescribe historia compartida.', 'Usa --force-with-lease solo en tu rama y nunca en main.')
  if (/\bsupabase\s+db\s+reset\b.*--(linked|db-url)/.test(c))
    regla('MP-DAT-04', 'bloquear', 'db reset contra una base remota borra datos reales.', 'Resetea solo la base local (supabase db reset sin --linked).')
  if (/\bsupabase\s+db\s+push\b/.test(c) && !/--dry-run/.test(c))
    regla('MP-DAT-05', 'avisar', 'db push aplica migraciones a la base remota.', 'Hazlo solo desde la fase 7, después de la preview, y con confirmación de la persona.')
}

// Excepciones registradas
const texto = contenidoNuevo() + ' ' + String(input.command || '')
const permitidos = new Map([...texto.matchAll(/masterplan-permitir:\s*(MP-[A-Z]+-\d{2})\s*--\s*([^\n*]+)/g)].map(m => [m[1], m[2].trim()]))
const vigentes = []
for (const h of hallazgos) {
  if (permitidos.has(h.codigo)) {
    try {
      fs.mkdirSync(path.join(mp, 'evidencia'), { recursive: true })
      fs.appendFileSync(path.join(mp, 'evidencia', 'excepciones.log'), `${new Date().toISOString()} | ${h.codigo} | ${relativo || 'bash'} | ${permitidos.get(h.codigo)}\n`)
    } catch {}
    continue
  }
  vigentes.push(h)
}

const bloquean = vigentes.filter(h => h.nivel === 'bloquear' || (estricto && h.nivel === 'avisar'))
const avisos = vigentes.filter(h => !bloquean.includes(h))
const linea = h => `[${h.codigo}] ${h.texto} → ${h.arreglo}`

if (fase === 'pre' && bloquean.length) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Masterplan bloqueó esta acción:\n${bloquean.map(linea).join('\n')}\nSi es intencional, agrega en el código "masterplan-permitir: <CODIGO> -- <motivo>".`
    }
  }))
  process.exit(0)
}
if (fase === 'post' && avisos.length) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `Políticas de Masterplan (corrige antes de cerrar la tarea):\n${avisos.map(linea).join('\n')}`
    }
  }))
}
process.exit(0)
