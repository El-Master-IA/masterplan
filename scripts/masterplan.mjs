#!/usr/bin/env node
// Masterplan CLI: estado, validación del plano, tareas, olas en paralelo, auditoría, deriva, cambios, relevos, buzón y proveedores.
// Sin dependencias. Se ejecuta desde la raíz del proyecto de la persona.
// Uso: node masterplan.mjs <comando> [args]   (node masterplan.mjs ayuda)

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = process.cwd()
const MP = path.join(RAIZ, 'masterplan')
const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLANTILLAS = path.join(PLUGIN, 'skills', 'masterplan', 'plantillas')

const FASES = ['contexto', 'descubrir', 'recortar', 'disenar', 'puertas', 'planear', 'construir', 'publicar', 'operar']
const ESTADOS_TAREA = ['pendiente', 'en-curso', 'hecha', 'bloqueada']
const RIGOR = ['bajo', 'medio', 'alto']
const FASES_PRODUCTO = ['nucleo', 'ampliacion']
const HACER_MAX = 600
const PARALELO_MAX = 5
const PALABRAS_VAGAS = /\b(funciona|se ve bien|queda bien|quedó conectado|está implementado|esta implementado|funcione correctamente|works|looks good|is implemented)\b/i
const ID_SPEC = /\b[A-Z]{2,6}-\d{3}\b/g
const PESO = { critica: 25, alta: 10, media: 3, baja: 1 }
const ORDEN_SEV = { critica: 4, alta: 3, media: 2, baja: 1 }
const DOM_SEGURIDAD = new Set(['seguridad', 'rls', 'dependencias'])
const DOM_BASES = new Set(['bases'])
const grupo = x => DOM_SEGURIDAD.has(x.dominio) ? 'seguridad' : DOM_BASES.has(x.dominio) ? 'bases' : 'experiencia'
// Qué nota cubre cada archivo de pendientes/ (por nombre). Una nota sin su auditor no se calcula:
// "100" sin haber auditado sería mentira.
const NOTA_DE_ARCHIVO = { seguridad: 'seguridad', frontend: 'experiencia', bases: 'bases' }

// ---------- utilidades ----------
const hoy = () => new Date().toISOString().slice(0, 10)
const ahora = () => new Date().toISOString()
const existe = p => fs.existsSync(p)
const leer = p => fs.readFileSync(p, 'utf8')
const escribir = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t) }
function leerJSON(p) {
  try { return JSON.parse(leer(p)) } catch (e) { throw new Error(`No pude leer ${rel(p)}: ${e.message}`) }
}
const escribirJSON = (p, v) => escribir(p, JSON.stringify(v, null, 2) + '\n')
const rel = p => path.relative(RAIZ, p).split(path.sep).join('/')
function archivos(dir, filtro = () => true, salida = []) {
  if (!existe(dir)) return salida
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build', '.next', '.vercel', 'coverage'].includes(n.name)) continue
    const p = path.join(dir, n.name)
    if (n.isDirectory()) archivos(p, filtro, salida)
    else if (filtro(p)) salida.push(p)
  }
  return salida
}
function fallar(msg, codigo = 1) { console.error(`✗ ${msg}`); process.exit(codigo) }
function proyecto() {
  const p = path.join(MP, 'proyecto.json')
  if (!existe(p)) fallar('No hay masterplan/proyecto.json en esta carpeta. Empieza con /masterplan:empezar.')
  return leerJSON(p)
}
function guardarProyecto(pr) { pr.actualizado = ahora(); escribirJSON(path.join(MP, 'proyecto.json'), pr) }
const rutaTareas = () => path.join(MP, 'plan', 'tareas.json')
function tareas() { return existe(rutaTareas()) ? leerJSON(rutaTareas()) : [] }

// ---------- estado ----------
function cmdEstado() {
  const pr = proyecto()
  const faltan = ['nombre', 'modo', 'fase', 'creado'].filter(k => pr[k] === undefined || pr[k] === '')
  if (faltan.length) fallar(`proyecto.json incompleto: falta ${faltan.join(', ')}`)
  if (!Number.isInteger(pr.fase) || pr.fase < 0 || pr.fase > 8) fallar('proyecto.json: "fase" debe ser un entero de 0 a 8')
  if (pr.rigor !== undefined && !RIGOR.includes(pr.rigor)) fallar(`proyecto.json: "rigor" debe ser ${RIGOR.join(' | ')}`)
  if (pr.autonomia !== undefined && !AUTONOMIA.includes(pr.autonomia)) fallar(`proyecto.json: "autonomia" debe ser ${AUTONOMIA.join(' | ')}`)
  if (pr.paralelo_max !== undefined && !(Number.isInteger(pr.paralelo_max) && pr.paralelo_max >= 1 && pr.paralelo_max <= 10)) fallar('proyecto.json: "paralelo_max" debe ser un entero de 1 a 10')
  const ts = tareas()
  const cuenta = Object.fromEntries(ESTADOS_TAREA.map(e => [e, ts.filter(t => t.estado === e).length]))
  const relevos = archivos(path.join(MP, 'relevos'), p => p.endsWith('.md')).sort()
  const buzon = archivos(path.join(MP, 'buzon'), p => p.endsWith('.md') && !p.includes(`${path.sep}leidos${path.sep}`))
  console.log(`Proyecto: ${pr.nombre}  (${pr.modo}${pr.tipo ? ', ' + pr.tipo : ''})`)
  console.log(`Fase: ${pr.fase} · ${FASES[pr.fase]} · rigor ${pr.rigor || 'medio (por defecto)'} · autonomía ${pr.autonomia || 'guiada'}`)
  if (ts.length) console.log(`Tareas: ${cuenta.hecha}/${ts.length} hechas · ${cuenta['en-curso']} en curso · ${cuenta.bloqueada} bloqueadas`)
  const sig = siguientes(ts)
  if (sig.length) console.log(`Siguiente: ${sig.map(t => `${t.id} (${t.titulo})`).join(', ')}`)
  if (relevos.length) console.log(`Último relevo: ${rel(relevos.at(-1))}`)
  if (buzon.length) console.log(`Buzón: ${buzon.length} mensaje(s) sin leer → node masterplan.mjs buzon leer`)
  if (pr.produccion?.url) console.log(`Producción: ${pr.produccion.url}`)
  console.log('✓ contrato válido')
}

function siguientes(ts) {
  const hecha = new Set(ts.filter(t => t.estado === 'hecha').map(t => t.id))
  return ts.filter(t => t.estado === 'pendiente' && (t.depende || []).every(d => hecha.has(d)))
}

// ---------- validar ----------
function cmdValidar(args) {
  const pr = proyecto()
  const h = []
  const add = (sev, donde, texto) => h.push({ sev, donde, texto })

  // Preguntas abiertas
  for (const f of archivos(MP, p => p.endsWith('.md') && !p.includes(`${path.sep}cambios${path.sep}archivo`))) {
    leer(f).split(/\r?\n/).forEach((l, i) => {
      if (l.includes('[ABIERTA')) add(pr.fase >= 4 ? 'BLOCKER' : 'MINOR', `${rel(f)}:${i + 1}`, 'pregunta abierta sin resolver')
    })
  }

  // Alcance
  if (pr.fase >= 3) {
    const ng = pr.alcance?.noGoals || []
    if (ng.length < 5) add('BLOCKER', 'masterplan/proyecto.json', `Non-Goals: hay ${ng.length}, se necesitan al menos 5`)
    if (!(pr.alcance?.flujoPrincipal || []).length) add('MAJOR', 'masterplan/proyecto.json', 'falta alcance.flujoPrincipal')
  }

  // Documentos de diseño
  if (pr.fase >= 4) {
    const docs = ['arquitectura.md', 'datos.md', 'seguridad.md', 'api.md', 'DESIGN.md', 'EXPERIENCE.md']
    for (const d of docs) if (!existe(path.join(MP, d))) add('BLOCKER', `masterplan/${d}`, 'documento de diseño faltante')
    const specs = archivos(path.join(MP, 'specs'), p => p.endsWith('.md'))
    if (!specs.length) add('BLOCKER', 'masterplan/specs/', 'no hay specs con requisitos')
    if (existe(path.join(MP, 'seguridad.md'))) {
      const s = leer(path.join(MP, 'seguridad.md'))
      if (!/rol/i.test(s) || !/(polític|policy)/i.test(s)) add('MAJOR', 'masterplan/seguridad.md', 'falta la matriz de permisos o las políticas RLS')
    }
    if (!pr.capacidades?.length) add('MAJOR', 'masterplan/proyecto.json', 'falta la lista de capacidades')
  }

  // Specs: IDs únicos y en forma EARS
  const idsSpec = new Set()
  for (const f of archivos(path.join(MP, 'specs'), p => p.endsWith('.md'))) {
    leer(f).split(/\r?\n/).forEach((l, i) => {
      const m = l.match(/^#{2,4}\s+([A-Z]{2,6}-\d{3})\b/)
      if (!m) return
      if (idsSpec.has(m[1])) add('MAJOR', `${rel(f)}:${i + 1}`, `ID de requisito repetido: ${m[1]}`)
      idsSpec.add(m[1])
    })
  }

  // Tareas
  if (pr.fase >= 5 || existe(rutaTareas())) {
    if (!existe(rutaTareas())) add(pr.fase >= 6 ? 'BLOCKER' : 'MAJOR', 'masterplan/plan/tareas.json', 'no existe el plan de tareas')
    else validarTareas(tareas(), idsSpec, add)
    if (!existe(path.join(MP, 'plan', 'gate.md'))) add('MAJOR', 'masterplan/plan/gate.md', 'falta el gate global')
  }

  // Variables de entorno documentadas
  if (pr.fase >= 6) for (const v of variablesSinDocumentar()) add('MAJOR', '.env.example', `variable usada pero no documentada: ${v}`)

  const orden = { BLOCKER: 0, MAJOR: 1, MINOR: 2 }
  h.sort((a, b) => orden[a.sev] - orden[b.sev])
  if (args.includes('--json')) console.log(JSON.stringify(h, null, 2))
  else {
    for (const x of h) console.log(`${x.sev.padEnd(7)} ${x.donde} — ${x.texto}`)
    const b = h.filter(x => x.sev === 'BLOCKER').length, m = h.filter(x => x.sev === 'MAJOR').length
    console.log(h.length ? `\n${b} BLOCKER · ${m} MAJOR · ${h.length - b - m} MINOR` : '✓ sin hallazgos')
  }
  process.exit(h.some(x => x.sev === 'BLOCKER') ? 1 : 0)
}

function validarTareas(ts, idsSpec, add) {
  const donde = 'masterplan/plan/tareas.json'
  if (!Array.isArray(ts)) return add('BLOCKER', donde, 'debe ser un arreglo de tareas')
  const porId = new Map()
  for (const t of ts) {
    const d = `${donde} › ${t.id ?? '(sin id)'}`
    if (!/^T\d{2,3}$/.test(t.id || '')) add('BLOCKER', d, 'id inválido (formato T01)')
    if (porId.has(t.id)) add('BLOCKER', d, 'id repetido')
    porId.set(t.id, t)
    for (const k of ['titulo', 'hacer', 'checkpoint']) if (!t[k]) add('BLOCKER', d, `falta "${k}"`)
    if (!Number.isInteger(t.ola) || t.ola < 1) add('MAJOR', d, '"ola" debe ser un entero ≥ 1')
    if (!ESTADOS_TAREA.includes(t.estado)) add('MAJOR', d, `estado inválido: ${t.estado}`)
    const c = t.criterios || []
    if (c.length < 2 || c.length > 6) add('MAJOR', d, `tiene ${c.length} criterios; deben ser de 2 a 6`)
    for (const k of c) {
      if (!/CUANDO/.test(k) || !/EL SISTEMA DEBE/.test(k)) add('BLOCKER', d, `criterio sin forma EARS: "${k.slice(0, 60)}"`)
      if (PALABRAS_VAGAS.test(k)) add('BLOCKER', d, `criterio no observable: "${k.slice(0, 60)}"`)
    }
    if (!(t.verificar || []).length) add('BLOCKER', d, 'sin comando de verificación')
    const a = t.archivos || []
    if (!a.length || a.length > 5) add('MAJOR', d, `toca ${a.length} archivos; deben ser de 1 a 5`)
    if (t.checkpoint && !/git tag\s+mp-T\d+/.test(t.checkpoint)) add('MAJOR', d, 'el checkpoint no crea el tag mp-T<n>')
    if (typeof t.hacer === 'string' && t.hacer.length > HACER_MAX) add('MINOR', d, `"hacer" tiene ${t.hacer.length} caracteres (máx. ${HACER_MAX}): deja el detalle en la spec citada`)
    if (t.fase_producto !== undefined && !FASES_PRODUCTO.includes(t.fase_producto)) add('MAJOR', d, `fase_producto inválida: ${t.fase_producto} (usa ${FASES_PRODUCTO.join(' | ')})`)
    if (t.hito !== undefined && t.hito !== 'visible') add('MAJOR', d, `hito inválido: ${t.hito} (solo "visible")`)
    for (const s of t.specs || []) if (idsSpec.size && !idsSpec.has(s)) add('MAJOR', d, `cita un requisito que no existe: ${s}`)
  }
  for (const t of ts) {
    for (const dep of t.depende || []) {
      const o = porId.get(dep)
      if (!o) add('BLOCKER', `${donde} › ${t.id}`, `depende de una tarea inexistente: ${dep}`)
      else if (o.ola >= t.ola) add('MAJOR', `${donde} › ${t.id}`, `depende de ${dep}, que está en la misma ola o en una posterior`)
      else if (t.fase_producto !== 'ampliacion' && o.fase_producto === 'ampliacion') add('MAJOR', `${donde} › ${t.id}`, `es del núcleo pero depende de ${dep}, que es una ampliación: no se podría mover a v1.1`)
    }
  }
  // Primer hito visible antes de la mitad del plan
  const maxOla = Math.max(...ts.map(t => t.ola || 1))
  if (ts.length >= 6 && maxOla >= 2) {
    const visibles = ts.filter(t => t.hito === 'visible')
    if (!visibles.length) add('MAJOR', donde, 'ninguna tarea marca hito:"visible": una persona debe poder usar el flujo principal (con datos de semilla) en la primera mitad del plan')
    else {
      const primera = Math.min(...visibles.map(t => t.ola))
      if (primera > Math.ceil(maxOla / 2)) add('MAJOR', donde, `el primer hito visible llega en la ola ${primera} de ${maxOla}: súbelo a la ola ${Math.ceil(maxOla / 2)} o antes (cortes verticales, no capas)`)
    }
  }
  // Ciclos
  const visit = new Map()
  const dfs = id => {
    if (visit.get(id) === 1) return true
    if (visit.get(id) === 2) return false
    visit.set(id, 1)
    for (const d of porId.get(id)?.depende || []) if (porId.has(d) && dfs(d)) return true
    visit.set(id, 2); return false
  }
  for (const id of porId.keys()) if (dfs(id)) { add('BLOCKER', donde, `ciclo de dependencias que pasa por ${id}`); break }
  // Archivos compartidos en la misma ola
  const porOla = new Map()
  for (const t of ts) for (const a of t.archivos || []) {
    const k = `${t.ola}|${a}`
    if (porOla.has(k)) add('MAJOR', donde, `${porOla.get(k)} y ${t.id} tocan ${a} en la misma ola`)
    else porOla.set(k, t.id)
  }
  // Requisitos sin tarea
  const citados = new Set(ts.flatMap(t => t.specs || []))
  for (const s of idsSpec) if (!citados.has(s)) add('MINOR', donde, `ninguna tarea cubre el requisito ${s}`)
}

function variablesSinDocumentar() {
  const usadas = new Set()
  const re = [/import\.meta\.env\.([A-Z0-9_]+)/g, /process\.env\.([A-Z0-9_]+)/g, /Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g]
  for (const f of archivos(RAIZ, p => /\.(m?[jt]sx?|vue|svelte)$/.test(p) && !p.includes(`${path.sep}masterplan${path.sep}`))) {
    const t = leer(f)
    for (const r of re) for (const m of t.matchAll(r)) usadas.add(m[1])
  }
  for (const v of ['NODE_ENV', 'MODE', 'DEV', 'PROD', 'SSR', 'BASE_URL', 'CI', 'VERCEL', 'VERCEL_ENV', 'VERCEL_URL']) usadas.delete(v)
  const ej = path.join(RAIZ, '.env.example')
  const doc = existe(ej) ? new Set([...leer(ej).matchAll(/^\s*([A-Z0-9_]+)\s*=/gm)].map(m => m[1])) : new Set()
  return [...usadas].filter(v => !doc.has(v)).sort()
}

// ---------- tareas ----------
function cmdTarea([id, estado, ...resto0]) {
  let resto = resto0
  if (!id) return cmdSiguiente()
  if (!ESTADOS_TAREA.includes(estado)) fallar(`Estado inválido. Usa: ${ESTADOS_TAREA.join(' | ')}`)
  const ts = tareas()
  const t = ts.find(x => x.id === id)
  if (!t) fallar(`No existe la tarea ${id}`)
  if (estado === 'en-curso') {
    if (t.estado === 'en-curso') fallar(`${id} ya está en curso (otra sesión o agente la tomó)`, 2)
    if (t.estado === 'hecha') fallar(`${id} ya está hecha`, 2)
    const pend = (t.depende || []).filter(d => ts.find(x => x.id === d)?.estado !== 'hecha')
    if (pend.length) fallar(`${id} depende de tareas sin terminar: ${pend.join(', ')}`, 2)
  }
  t.estado = estado
  const ses = resto.find(x => x.startsWith('--sesion='))
  if (ses && estado === 'en-curso') t.sesion = ses.slice(9)
  if (estado !== 'en-curso') delete t.sesion
  if (ses) resto = resto.filter(x => x !== ses)
  if (estado === 'bloqueada') t.motivo = resto.join(' ') || t.motivo || 'sin motivo'
  else delete t.motivo
  t.actualizado = ahora()
  escribirJSON(rutaTareas(), ts)
  console.log(`✓ ${id} → ${estado}`)
}
function cmdSiguiente() {
  const sig = siguientes(tareas())
  if (!sig.length) return console.log('No hay tareas disponibles (todas hechas, en curso o esperando dependencias).')
  const ola = Math.min(...sig.map(t => t.ola))
  for (const t of sig.filter(x => x.ola === ola)) console.log(`${t.id} · ola ${t.ola} · ${t.titulo}`)
}

// ---------- olas en paralelo (una sesión por tarea) ----------
function textoSpec(id) {
  for (const f of archivos(path.join(MP, 'specs'), p => p.endsWith('.md'))) {
    const ls = leer(f).split(/\r?\n/)
    const i = ls.findIndex(l => new RegExp(`^#{2,4}\\s+${id}\\b`).test(l))
    if (i < 0) continue
    const nivel = ls[i].match(/^#+/)[0].length
    let j = i + 1
    while (j < ls.length && !(/^#+\s/.test(ls[j]) && ls[j].match(/^#+/)[0].length <= nivel)) j++
    return ls.slice(i, j).join('\n').trim()
  }
  return `(no se encontró ${id} en masterplan/specs/)`
}

function briefTarea(t, pr, ola) {
  const nombre = path.basename(RAIZ)
  const rama = `mp-${t.id}`
  const worktree = path.join(path.dirname(RAIZ), `${nombre}-${rama}`)
  const specs = (t.specs || []).map(textoSpec).join('\n\n') || '(la tarea no cita specs)'
  const md = `# Brief · ${t.id} · ${t.titulo}

Eres el constructor de UNA tarea de Masterplan, en tu propia sesión. Trabaja solo aquí.

- Proyecto (principal): ${RAIZ}
- Tu worktree: ${worktree}   (rama ${rama})
- Perfil: ${pr.perfil || '(ver proyecto.json)'} · rigor: ${pr.rigor || 'medio'} · ola ${ola}
- Kit: ${t.kit || '(ninguno)'}
- Antes de empezar: \`git worktree add "${worktree}" -b ${rama}\` y trabaja dentro de ese directorio. Lee su \`CLAUDE.md\`.

## Tarea
\`\`\`json
${JSON.stringify(t, null, 2)}
\`\`\`

## Specs citadas
${specs}

## Cierre
1. Test primero cuando se pueda; implementa solo lo que pide \`hacer\`, solo en \`archivos\`.
2. Corre cada comando de \`verificar\`. Guarda la salida real en \`masterplan/evidencia/${t.id}.txt\` (un solo archivo).
3. Haz commit solo en la rama ${rama}: \`${t.id}: <qué>\`. No toques la rama principal ni pongas el tag; lo hace el conductor al integrar.
4. Si necesitas un archivo fuera de \`archivos\`, detente y repórtalo. Tres intentos fallidos → reporta "bloqueada" con el motivo.
5. Tu último mensaje: criterios cumplidos, salida de verificación (exit), rama y commit, dudas. Avisa al conductor por el buzón (\`mcp__masterplan__enviar\` o \`masterplan.mjs buzon enviar\`).
`
  return { id: t.id, titulo: t.titulo, rama, worktree, md }
}

function cmdOla(args) {
  const pr = proyecto()
  const ts = tareas()
  const libres = siguientes(ts)
  if (!libres.length) return console.log('No hay tareas libres (todas hechas, en curso o esperando dependencias).')
  const num = args.find(a => /^\d+$/.test(a))
  const ola = num ? Number(num) : Math.min(...libres.map(t => t.ola))
  const deOla = libres.filter(t => t.ola === ola)
  if (!deOla.length) fallar(`No hay tareas libres en la ola ${ola}. Libres en: ${[...new Set(libres.map(t => t.ola))].join(', ')}`)
  const max = pr.paralelo_max ?? PARALELO_MAX
  const lote = [], conflictos = [], usados = new Map()
  for (const t of deOla) {
    const choca = (t.archivos || []).find(a => usados.has(a))
    if (choca) { conflictos.push(`${t.id} comparte ${choca} con ${usados.get(choca)}: va después`); continue }
    if (lote.length >= max) continue
    for (const a of t.archivos || []) usados.set(a, t.id)
    lote.push(t)
  }
  const esperan = deOla.filter(t => !lote.includes(t)).map(t => t.id)
  const briefs = lote.map(t => briefTarea(t, pr, ola))
  const dir = path.join(MP, 'olas', `ola-${ola}`)
  if (args.includes('--escribir')) for (const b of briefs) escribir(path.join(dir, `${b.id}.brief.md`), b.md)
  const resumen = {
    ola, paralelo_max: max, rigor: pr.rigor || 'medio',
    lanzar: briefs.map(b => ({ id: b.id, titulo: b.titulo, rama: b.rama, worktree: b.worktree, brief: args.includes('--escribir') ? rel(path.join(dir, `${b.id}.brief.md`)) : undefined })),
    esperan, conflictos,
    revision: (pr.rigor || 'medio') === 'alto' ? 'revisor-codigo y auditor-seguridad por tarea' : 'una revisión por ola sobre el diff acumulado (seguridad solo en kits auth/datos/pagos)'
  }
  if (args.includes('--json')) return console.log(JSON.stringify({ ...resumen, briefs: briefs.map(b => ({ id: b.id, brief: b.md })) }, null, 2))
  console.log(`Ola ${ola} · ${lote.length} sesión(es) en paralelo (máx. ${max}) · rigor ${resumen.rigor}`)
  for (const b of resumen.lanzar) console.log(`  ${b.id} · ${b.titulo} → rama ${b.rama}${b.brief ? ` · ${b.brief}` : ''}`)
  if (esperan.length) console.log(`En espera (límite o archivos): ${esperan.join(', ')}`)
  for (const c of conflictos) console.log(`⚠ ${c}`)
  console.log(`Revisión: ${resumen.revision}`)
  if (!args.includes('--escribir')) console.log('Añade --escribir para dejar los briefs en masterplan/olas/ola-' + ola + '/ (o --json para leerlos completos).')
}

// ---------- resumen de pruebas pgTAP / TAP ----------
function cmdPgtap([archivo]) {
  const texto = !archivo || archivo === '-' ? fs.readFileSync(0, 'utf8') : leer(archivo)
  const ls = texto.split(/\r?\n/)
  const fallan = ls.filter(l => /^\s*not ok\b/.test(l) || /Failed test/.test(l) || /Looks like you (failed|planned)/.test(l))
  const ok = ls.filter(l => /^\s*ok\b/.test(l)).length
  const malos = ls.filter(l => /^\s*not ok\b/.test(l)).length
  const plan = ls.find(l => /^1\.\.\d+/.test(l.trim()))
  const error = ls.filter(l => /"_tag"\s*:\s*"Error"|ERROR:|exception/i.test(l)).slice(0, 5)
  console.log(`asertos: ${ok} ok · ${malos} fallan${plan ? ` · plan ${plan.trim()}` : ''}`)
  for (const l of fallan) console.log(`  ${l.trim()}`)
  for (const l of error) console.log(`  ! ${l.trim().slice(0, 200)}`)
  process.exit(malos || error.length || (plan && ok + malos < Number(plan.trim().split('..')[1])) ? 1 : 0)
}

// ---------- auditoría ----------
function cmdAuditoria([sub]) {
  const dir = path.join(MP, 'auditoria')
  if (sub === 'fusionar') {
    const pend = archivos(path.join(dir, 'pendientes'), p => p.endsWith('.json'))
    if (!pend.length) fallar('No hay hallazgos en masterplan/auditoria/pendientes/*.json')
    const vistos = new Map()
    const descartados = []
    for (const f of pend) {
      let arr
      try { arr = leerJSON(f) } catch (e) { descartados.push(`${rel(f)}: ${e.message}`); continue }
      for (const x of Array.isArray(arr) ? arr : arr.hallazgos || []) {
        const falta = ['id', 'dominio', 'severidad', 'titulo', 'evidencia', 'regla', 'confianza'].filter(k => !x[k])
        if (falta.length || !PESO[x.severidad]) { descartados.push(`${x.id || '?'}: falta ${falta.join(', ') || 'severidad válida'}`); continue }
        const k = `${x.regla}|${x.archivo || ''}|${x.linea || ''}`
        const prev = vistos.get(k)
        if (!prev || ORDEN_SEV[x.severidad] > ORDEN_SEV[prev.severidad]) vistos.set(k, x)
      }
    }
    const hallazgos = [...vistos.values()].sort((a, b) => ORDEN_SEV[b.severidad] - ORDEN_SEV[a.severidad])
    const nota = g => {
      const hs = hallazgos.filter(x => grupo(x) === g).filter(x => x.confianza !== 'especulativa')
      let n = Math.max(0, 100 - hs.reduce((s, x) => s + PESO[x.severidad], 0))
      if (hs.some(x => x.severidad === 'critica')) n = Math.min(n, 49)
      return n
    }
    // Notas auditadas: por el nombre de cada archivo de pendientes; si ninguno coincide, las de siempre.
    let auditadas = [...new Set(pend.map(f => NOTA_DE_ARCHIVO[path.basename(f, '.json')]).filter(Boolean))]
    if (!auditadas.length) auditadas = ['seguridad', 'experiencia']
    for (const x of hallazgos) if (!auditadas.includes(grupo(x))) auditadas.push(grupo(x))
    const NOMBRE_NOTA = { seguridad: 'Seguridad', experiencia: 'Calidad de experiencia', bases: 'Bases técnicas' }
    const orden = ['seguridad', 'experiencia', 'bases'].filter(g => auditadas.includes(g))
    const informe = {
      fecha: ahora(),
      notas: Object.fromEntries(orden.map(g => [g, nota(g)])),
      noAuditado: ['seguridad', 'experiencia', 'bases'].filter(g => !auditadas.includes(g)),
      conteo: Object.fromEntries(Object.keys(PESO).map(s => [s, hallazgos.filter(x => x.severidad === s).length])),
      noVerificados: hallazgos.filter(x => x.verificado === false).length,
      descartados,
      hallazgos
    }
    const nombre = ahora().replace(/[:.]/g, '-')
    escribirJSON(path.join(dir, `${nombre}.json`), informe)
    const donde = x => x.archivo ? `${x.archivo}${x.linea ? ':' + x.linea : ''}` : 'global'
    const primero = hallazgos.filter(x => ORDEN_SEV[x.severidad] >= ORDEN_SEV.alta && x.confianza !== 'especulativa')
    const lineas = [
      `# Auditoría ${hoy()}`, '',
      `| Nota | Valor |`, `|---|---|`,
      ...orden.map(g => `| ${NOMBRE_NOTA[g]} | ${informe.notas[g]}/100 |`),
      ...informe.noAuditado.map(g => `| ${NOMBRE_NOTA[g]} | no auditado |`), '',
      `Críticas ${informe.conteo.critica} · Altas ${informe.conteo.alta} · Medias ${informe.conteo.media} · Bajas ${informe.conteo.baja} · No verificados ${informe.noVerificados}`, '',
      '## Qué arreglar primero',
      ...(primero.length
        ? primero.map((x, i) => `${i + 1}. **${x.titulo}** (${x.severidad}, ${donde(x)})${x.arreglo ? ` → ${x.arreglo}` : ''}`)
        : ['Nada crítico ni alto. Revisa los medios cuando puedas.']), '',
      '## Todos los hallazgos',
      ...hallazgos.map(x => `- **${x.severidad}** [${x.dominio}] ${x.titulo} — ${donde(x)} (${x.regla})`),
      ...(descartados.length ? ['', '## Descartados por formato', ...descartados.map(d => `- ${d}`)] : [])
    ]
    escribir(path.join(dir, `${nombre}.md`), lineas.join('\n') + '\n')
    fs.mkdirSync(path.join(dir, 'procesados'), { recursive: true })
    for (const f of pend) fs.renameSync(f, path.join(dir, 'procesados', `${nombre}-${path.basename(f)}`))
    const CORTO = { seguridad: 'Seguridad', experiencia: 'Experiencia', bases: 'Bases' }
    console.log(`${orden.map(g => `${CORTO[g]} ${informe.notas[g]}/100`).join(' · ')} · ${hallazgos.length} hallazgos`)
    console.log(`→ ${rel(path.join(dir, nombre + '.md'))}`)
    process.exit(informe.conteo.critica || informe.conteo.alta ? 1 : 0)
  }
  if (sub === 'comparar') {
    const inf = archivos(dir, p => /\d{4}-\d{2}-\d{2}T.*\.json$/.test(p) && !p.includes('procesados') && !p.includes('pendientes')).sort()
    if (inf.length < 2) fallar('Se necesitan al menos dos auditorías para comparar')
    const [a, b] = inf.slice(-2).map(leerJSON)
    const clave = x => `${x.regla}|${x.archivo || ''}|${x.linea || ''}`
    const ka = new Set(a.hallazgos.map(clave)), kb = new Set(b.hallazgos.map(clave))
    const cerrados = a.hallazgos.filter(x => !kb.has(clave(x)))
    const nuevos = b.hallazgos.filter(x => !ka.has(clave(x)))
    const notas = ['seguridad', 'experiencia', 'bases'].filter(g => g in a.notas || g in b.notas)
    console.log(notas.map(g => `${g[0].toUpperCase() + g.slice(1)} ${a.notas[g] ?? '–'} → ${b.notas[g] ?? '–'}`).join(' · '))
    console.log(`Cerrados ${cerrados.length} · Nuevos ${nuevos.length} · Siguen ${b.hallazgos.length - nuevos.length}`)
    for (const x of nuevos) console.log(`  nuevo: ${x.severidad} ${x.titulo}`)
    return
  }
  fallar('Uso: masterplan.mjs auditoria fusionar | comparar')
}

// ---------- deriva ----------
function cmdDeriva() {
  const h = []
  const idsSpec = new Set()
  for (const f of archivos(path.join(MP, 'specs'), p => p.endsWith('.md')))
    for (const m of leer(f).matchAll(/^#{2,4}\s+([A-Z]{2,6}-\d{3})\b/gm)) idsSpec.add(m[1])
  const codigo = archivos(RAIZ, p => /\.(m?[jt]sx?|sql)$/.test(p) && !p.includes(`${path.sep}masterplan${path.sep}`))
  const pruebas = codigo.filter(p => /(\.test\.|\.spec\.|[\\/]tests?[\\/]|[\\/]e2e[\\/])/.test(p))
  const citadosEnPruebas = new Set()
  for (const f of pruebas) for (const m of leer(f).matchAll(ID_SPEC)) citadosEnPruebas.add(m[0])
  if (idsSpec.size && pruebas.length) {
    for (const s of idsSpec) if (!citadosEnPruebas.has(s)) h.push(`requisito sin prueba que lo cite: ${s}`)
    for (const s of citadosEnPruebas) if (/^[A-Z]{2,6}-\d{3}$/.test(s) && !idsSpec.has(s)) h.push(`prueba cita un requisito que ya no existe: ${s}`)
  }
  for (const t of tablasSinRLS()) h.push(`tabla sin RLS habilitada: ${t}`)
  for (const v of variablesSinDocumentar()) h.push(`variable usada pero no documentada en .env.example: ${v}`)
  if (!h.length) { console.log('✓ sin deriva: specs, pruebas, RLS y variables al día'); return }
  for (const x of h) console.log(`• ${x}`)
  process.exit(1)
}
function tablasSinRLS() {
  const sql = archivos(path.join(RAIZ, 'supabase', 'migrations'), p => p.endsWith('.sql')).sort().map(leer).join('\n').toLowerCase()
  const nombre = s => s.replace(/"/g, '').replace(/^public\./, '')
  const creadas = new Set([...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)/g)].map(m => nombre(m[1])))
  const conRLS = new Set([...sql.matchAll(/alter\s+table\s+(?:only\s+)?([a-z0-9_."]+)\s+enable\s+row\s+level\s+security/g)].map(m => nombre(m[1])))
  const borradas = new Set([...sql.matchAll(/drop\s+table\s+(?:if\s+exists\s+)?([a-z0-9_."]+)/g)].map(m => nombre(m[1])))
  // Las tablas de esquemas no expuestos (private.*, extensions.*) no pasan por la API: se omiten.
  return [...creadas].filter(t => !t.includes('.') && !conRLS.has(t) && !borradas.has(t)).sort()
}

// ---------- cambios (specs vivas) ----------
function cmdCambio([sub, dir]) {
  if (sub === 'nuevo') {
    const slug = (dir || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!slug) fallar('Uso: masterplan.mjs cambio nuevo "<descripción corta>"')
    const d = path.join(MP, 'cambios', `${hoy()}-${slug}`)
    if (existe(d)) fallar(`Ya existe ${rel(d)}`)
    escribir(path.join(d, 'delta.md'), [
      `# Cambio: ${dir}`, '', `Fecha: ${hoy()}`, '', 'Por qué:', '',
      'Lo que NO debe cambiar:', '',
      '## Agregados', '', '<!-- ### AUTH-010 · specs/auth.md  (requisito EARS completo debajo) -->', '',
      '## Modificados', '', '<!-- ### AUTH-004 · specs/auth.md  (versión nueva completa debajo) -->', '',
      '## Eliminados', '', '<!-- ### AUTH-002 · specs/auth.md  Motivo: … Migración: … -->', ''
    ].join('\n'))
    escribirJSON(path.join(d, 'tareas.json'), [])
    console.log(`✓ ${rel(d)}/delta.md`)
    return
  }
  if (sub === 'archivar') {
    if (!dir) fallar('Uso: masterplan.mjs cambio archivar <carpeta del cambio>')
    const d = path.resolve(RAIZ, dir)
    const delta = path.join(d, 'delta.md')
    if (!existe(delta)) fallar(`No existe ${rel(delta)}`)
    const texto = leer(delta)
    const seccion = nombreSec => {
      const m = texto.match(new RegExp(`^## ${nombreSec}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'))
      return m ? m[1] : ''
    }
    const bloques = s => [...s.replace(/<!--[\s\S]*?-->/g, '').matchAll(/^###\s+([A-Z]{2,6}-\d{3})\s*·\s*(\S+)\s*$([\s\S]*?)(?=^###\s|(?![\s\S]))/gm)]
      .map(m => ({ id: m[1], archivo: m[2], cuerpo: m[3].trim() }))
    const aplicados = []
    const reemplazar = (archivo, id, nuevo) => {
      const p = path.join(MP, archivo.replace(/^masterplan\//, ''))
      if (!existe(p)) fallar(`El delta apunta a ${archivo}, que no existe`)
      const t = leer(p)
      const re = new RegExp(`^(#{2,4})\\s+${id}\\b[\\s\\S]*?(?=^#{2,4}\\s+[A-Z]{2,6}-\\d{3}\\b|(?![\\s\\S]))`, 'm')
      if (!re.test(t)) fallar(`No encuentro ${id} en ${archivo}`)
      escribir(p, t.replace(re, (_, h) => nuevo === null ? '' : `${h} ${id}\n${nuevo}\n\n`))
    }
    for (const b of bloques(seccion('Agregados'))) {
      const p = path.join(MP, b.archivo.replace(/^masterplan\//, ''))
      const previo = existe(p) ? leer(p) : `# Specs\n`
      if (new RegExp(`^#{2,4}\\s+${b.id}\\b`, 'm').test(previo)) fallar(`${b.id} ya existe en ${b.archivo}`)
      escribir(p, previo.replace(/\s*$/, '\n\n') + `### ${b.id}\n${b.cuerpo}\n`)
      aplicados.push(`+ ${b.id}`)
    }
    for (const b of bloques(seccion('Modificados'))) { reemplazar(b.archivo, b.id, b.cuerpo); aplicados.push(`~ ${b.id}`) }
    for (const b of bloques(seccion('Eliminados'))) { reemplazar(b.archivo, b.id, null); aplicados.push(`- ${b.id}`) }
    const destino = path.join(MP, 'cambios', 'archivo', path.basename(d))
    fs.mkdirSync(path.dirname(destino), { recursive: true })
    fs.renameSync(d, destino)
    console.log(`✓ specs actualizadas (${aplicados.join(', ') || 'sin bloques'}) · archivado en ${rel(destino)}`)
    return
  }
  fallar('Uso: masterplan.mjs cambio nuevo "<qué>" | cambio archivar <carpeta>')
}

// ---------- relevos ----------
function bloqueAutomatico(pr) {
  const ts = tareas()
  const l = []
  if (ts.length) {
    const por = e => ts.filter(t => t.estado === e).map(t => t.id)
    const hechas = por('hecha'), curso = por('en-curso')
    l.push(`- Tareas: ${hechas.length}/${ts.length} hechas${hechas.length ? ` (última: ${hechas.at(-1)})` : ''}`)
    if (curso.length) l.push(`- En curso: ${curso.map(id => { const t = ts.find(x => x.id === id); return t.sesion ? `${id} (sesión ${t.sesion})` : id }).join(', ')}`)
    for (const t of ts.filter(x => x.estado === 'bloqueada')) l.push(`- Bloqueada: ${t.id} — ${t.motivo || 'sin motivo'}`)
    const sig = siguientes(ts)
    if (sig.length) { const o = Math.min(...sig.map(t => t.ola)); l.push(`- Siguiente ola libre: ${o} → ${sig.filter(t => t.ola === o).map(t => t.id).join(', ')} (\`masterplan.mjs ola ${o}\`)`) }
  }
  try {
    const tags = spawnSync('git', ['tag', '--list', 'mp-T*'], { cwd: RAIZ, encoding: 'utf8' }).stdout.split('\n').map(x => x.trim()).filter(Boolean)
    if (tags.length) l.push(`- Tags: ${tags.length} (último: ${tags.sort().at(-1)})`)
  } catch { /* sin git */ }
  const ev = archivos(path.join(MP, 'evidencia'), p => p.endsWith('.txt')).length
  if (ev) l.push(`- Evidencia: ${ev} archivo(s) en masterplan/evidencia/`)
  const dl = path.join(MP, 'decisiones.log')
  if (existe(dl)) {
    const ls = leer(dl).split('\n').map(x => x.trim()).filter(Boolean)
    const desde = pr.relevo?.decisiones ?? 0
    const nuevas = ls.slice(desde)
    if (nuevas.length) {
      l.push(`- Decisiones nuevas (${nuevas.length}):`)
      for (const d of nuevas.slice(-12)) { const [, id, txt] = d.split(' | '); l.push(`  - ${id}: ${(txt || d).slice(0, 140)}`) }
      if (nuevas.length > 12) l.push(`  - … y ${nuevas.length - 12} anteriores en decisiones.log`)
    }
    pr.relevo = { ...(pr.relevo || {}), decisiones: ls.length }
  }
  return l.join('\n')
}

function cmdRelevo([nombre]) {
  const pr = proyecto()
  const n = nombre || `${String(pr.fase).padStart(2, '0')}-${FASES[pr.fase]}`
  const p = path.join(MP, 'relevos', `${n}.md`)
  const base = existe(path.join(PLANTILLAS, 'relevo.md')) ? leer(path.join(PLANTILLAS, 'relevo.md')) : '# Relevo\n'
  if (!existe(p)) {
    const auto = bloqueAutomatico(pr)
    escribir(p, base.replace(/\{fecha\}/g, hoy()).replace(/\{fase\}/g, n).replace(/\{proyecto\}/g, pr.nombre).replace(/\{auto\}/g, auto || '- (sin tareas ni decisiones nuevas)'))
  }
  guardarProyecto(pr)
  console.log(`✓ ${rel(p)} — el estado va autocompletado; añade solo 3–5 líneas de contexto (qué sigue, riesgos) y abre una sesión nueva con /masterplan:seguir`)
}

// ---------- buzón (respaldo sin mod) ----------
function cmdBuzon([sub, ...resto]) {
  const dir = path.join(MP, 'buzon')
  if (sub === 'enviar') {
    const i = resto.indexOf('--para')
    const para = i >= 0 ? resto[i + 1] : 'todas'
    const texto = resto.filter((_, j) => j !== i && j !== i + 1).join(' ').trim()
    if (!texto) fallar('Uso: masterplan.mjs buzon enviar --para fase-6 "texto"')
    const p = path.join(dir, `${ahora().replace(/[:.]/g, '-')}-${para}.md`)
    escribir(p, `---\npara: ${para}\nfecha: ${ahora()}\n---\n${texto}\n`)
    return console.log(`✓ mensaje dejado en ${rel(p)}`)
  }
  if (sub === 'leer') {
    const pr = existe(path.join(MP, 'proyecto.json')) ? leerJSON(path.join(MP, 'proyecto.json')) : {}
    const mios = archivos(dir, p => p.endsWith('.md') && !p.includes(`${path.sep}leidos${path.sep}`)).sort()
      .filter(p => /-(todas|fase-\d)\.md$/.test(p) ? (p.endsWith('-todas.md') || p.endsWith(`-fase-${pr.fase}.md`) || resto.includes('--todo')) : true)
    if (!mios.length) return console.log('Buzón vacío.')
    fs.mkdirSync(path.join(dir, 'leidos'), { recursive: true })
    for (const p of mios) { console.log(`--- ${path.basename(p)}\n${leer(p).replace(/^---[\s\S]*?---\n/, '').trim()}`); fs.renameSync(p, path.join(dir, 'leidos', path.basename(p))) }
    return
  }
  fallar('Uso: masterplan.mjs buzon enviar --para <fase-N|todas> "texto" | buzon leer [--todo]')
}

// ---------- proveedores: catálogo y recomendador ----------
// El catálogo vive en skills/masterplan/conocimiento/proveedores.json (fichas verificadas con fuente y fecha).
// El recomendador es determinista: las necesidades del proyecto (rasgos) activan categorías; dentro de cada
// categoría puntúa cada proveedor y explica por qué gana, qué no cubre y por qué se descarta.

const CATALOGO = process.env.MASTERPLAN_CATALOGO || path.join(PLUGIN, 'skills', 'masterplan', 'conocimiento', 'proveedores.json')

// Rasgos que, si aparecen en las necesidades, piden una categoría.
const ANCLAS = {
  'hosting-web': ['sitio-estatico', 'ssr', 'spa'],
  backend: ['api-http', 'proceso-largo', 'contenedor-docker', 'gpu'],
  'serverless-borde': ['borde-global'],
  'base-de-datos': ['postgres', 'mysql', 'sqlite-borde', 'nosql-documentos', 'ramas-de-base', 'serverless-db', 'realtime-db'],
  auth: ['auth-email', 'auth-social', 'auth-magic-link', 'auth-orgs', 'sso-empresa', 'mfa'],
  almacenamiento: ['archivos-grandes', 'subidas-directas', 'sin-costo-salida'],
  video: ['video-vod', 'video-en-vivo', 'drm'],
  imagenes: ['transformacion-imagenes'],
  'cdn-dns': [],
  correo: ['correo-transaccional', 'correo-masivo'],
  mensajeria: ['whatsapp', 'sms', 'push', 'api-whatsapp-oficial'],
  chatbots: ['omnicanal', 'bandeja-compartida', 'chatbot-no-code', 'chatbot-ia', 'crm-ventas', 'campanas-masivas', 'pos-ecommerce', 'instagram-dm', 'messenger', 'tiktok-dm'],
  'tiempo-real': ['presencia', 'colaboracion-multiusuario', 'pubsub', 'websockets'],
  trabajos: ['worker-cola', 'cron', 'reintentos', 'workflows-durables', 'cola-simple', 'programador'],
  'cache-kv': [],
  busqueda: ['busqueda-texto', 'busqueda-tolerante-errores'],
  vectores: ['busqueda-semantica', 'embeddings'],
  'ia-modelos': ['ia-llm', 'gateway-modelos'],
  'ia-media': ['generacion-imagenes', 'edicion-imagenes', 'upscale', 'generacion-video', 'avatares-video', 'voz-sintetica', 'musica-ia'],
  observabilidad: ['errores', 'logs', 'uptime', 'trazas'],
  analitica: ['analitica-producto', 'analitica-web-privada', 'replays-sesion'],
  cms: ['cms-headless', 'editor-visual', 'cms-self-host'],
  pagos: ['pagos-latam', 'pse', 'merchant-of-record'],
  automatizacion: ['flujos-no-code'],
  movil: ['builds-moviles', 'ota-updates'],
  flags: ['feature-flags', 'experimentos'],
}
const CATEGORIAS = Object.keys(ANCLAS)
const MODIFICADORES = new Set(['region-latam', 'uso-comercial-gratis', 'presupuesto-cero', 'presupuesto-bajo', 'enterprise-cumplimiento',
  'self-host', 'escala-a-cero', 'mcp-oficial', 'preview-por-pr', 'monorepo', 'backups-automaticos', 'multi-region', 'cdn-global', 'rls',
  'api-generativa', 'multi-modelo', 'interfaz-web', 'creditos-prepago', 'uso-comercial-salidas'])
const RASGOS = new Set([...Object.values(ANCLAS).flat(), ...MODIFICADORES, 'websockets', 'auth-integrada-db', 'plantillas',
  'workflows-durables', 'cola-simple', 'programador', 'transformacion-imagenes'])
const CAMPOS_FICHA = ['id', 'nombre', 'categoria', 'especialidad', 'rasgos', 'usarCuando', 'evitarCuando', 'gratis', 'precio', 'fuente', 'verificado']

function catalogo() {
  if (!existe(CATALOGO)) fallar(`No encuentro el catálogo de proveedores (${CATALOGO}). Corre este comando desde el plugin o define MASTERPLAN_CATALOGO.`)
  const c = leerJSON(CATALOGO)
  const lista = Array.isArray(c) ? c : c.proveedores || []
  EMPRESA = new Map(lista.map(p => [p.id, p.empresa || p.id]))
  return lista
}
// Empresa dueña del producto (campo "empresa" de la ficha). Sin él, cada ficha es su propia empresa.
let EMPRESA = new Map()
const familia = id => EMPRESA.get(id) || id
const textoLatam = p => /(latam|am[eé]rica latina|s[aã]o paulo|brasil|m[eé]xico|colombia|bogot|chile|santiago|argentina|buenos aires|per[uú]|lima)/i.test(p.latam || '')

function validarCatalogo(lista) {
  const errores = []
  const ids = new Set()
  for (const p of lista) {
    const d = p.id || '(sin id)'
    for (const k of CAMPOS_FICHA) if (p[k] === undefined || p[k] === '' || (Array.isArray(p[k]) && !p[k].length)) errores.push(`${d}: falta "${k}"`)
    if (ids.has(p.id)) errores.push(`${d}: id repetido`)
    ids.add(p.id)
    if (p.categoria && !CATEGORIAS.includes(p.categoria)) errores.push(`${d}: categoría desconocida "${p.categoria}"`)
    for (const r of p.rasgos || []) if (!RASGOS.has(r)) errores.push(`${d}: rasgo fuera del vocabulario "${r}"`)
    if (p.fuente && !/^https:\/\//.test(p.fuente)) errores.push(`${d}: la fuente debe ser una URL https`)
    if (p.verificado && !/^\d{4}-\d{2}-\d{2}$/.test(p.verificado)) errores.push(`${d}: "verificado" debe ser AAAA-MM-DD`)
    if (p.aviso && !['descontinuado', 'evitar-en-nuevos'].includes(p.aviso)) errores.push(`${d}: aviso desconocido "${p.aviso}"`)
  }
  return errores
}

function necesidadesDe(args) {
  // Prioridad: --rasgos a,b,c en la línea de comandos; si no, proyecto.json → necesidades.
  const i = args.indexOf('--rasgos')
  let n = {}
  if (existe(path.join(MP, 'proyecto.json'))) n = leerJSON(path.join(MP, 'proyecto.json')).necesidades || {}
  if (i >= 0) n = { ...n, rasgos: (args[i + 1] || '').split(',').map(s => s.trim()).filter(Boolean) }
  const v = (flag, def) => { const j = args.indexOf(flag); return j >= 0 ? args[j + 1] : def }
  return {
    rasgos: n.rasgos || [],
    categorias: (v('--categorias', null)?.split(',') ?? n.categorias ?? []).filter(Boolean),
    presupuesto: v('--presupuesto', n.presupuesto || 'bajo'),
    comercial: args.includes('--comercial') ? true : n.comercial ?? true,
    region: v('--region', n.region || 'latam'),
    preferir: n.preferir || [],
    evitar: n.evitar || [],
  }
}

// La ubicación importa donde hay latencia, residencia de datos o medios de pago locales.
const CATS_REGION = new Set(['hosting-web', 'backend', 'serverless-borde', 'base-de-datos', 'almacenamiento', 'video', 'imagenes', 'cdn-dns', 'pagos', 'mensajeria', 'chatbots'])

function puntuarCategoria(lista, cat, nec, pide, otros) {
  const relevantes = [...pide].filter(r => ANCLAS[cat].includes(r) || (MODIFICADORES.has(r) && r !== 'region-latam'))
  const candidatos = []
  const descartes = []
  for (const p of lista.filter(x => x.categoria === cat)) {
    if (nec.evitar.includes(p.id) || nec.evitar.includes(familia(p.id))) { descartes.push({ id: p.id, motivo: 'la persona pidió evitarlo' }); continue }
    if (p.aviso === 'descontinuado') { descartes.push({ id: p.id, motivo: 'servicio descontinuado' }); continue }
    const tiene = new Set(p.rasgos || [])
    const cubre = relevantes.filter(r => tiene.has(r))
    const falta = ANCLAS[cat].filter(r => pide.has(r) && !tiene.has(r))
    let puntos = cubre.filter(r => ANCLAS[cat].includes(r)).length * 3 + cubre.filter(r => MODIFICADORES.has(r)).length
    const razones = cubre.length ? [`cubre: ${cubre.join(', ')}`] : []
    if (nec.presupuesto === 'cero') {
      const sinGratis = /^(no|sin plan gratis|ninguno)/i.test(String(p.gratis).trim())
      if (sinGratis) { puntos -= 4; razones.push('no tiene plan gratis') }
      else if (nec.comercial && p.usoComercialGratis === false) { puntos -= 4; razones.push('su plan gratis no permite uso comercial') }
      else puntos += 2
    }
    if (p.aviso === 'evitar-en-nuevos') { puntos -= 3; razones.push(`evitar en proyectos nuevos: ${p.evitarCuando?.[0] ?? 'ver ficha'}`) }
    if (nec.region === 'latam' && CATS_REGION.has(cat) && (tiene.has('region-latam') || textoLatam(p))) { puntos += 1; razones.push('presencia en Latinoamérica') }
    if (otros.some(e => familia(e) === familia(p.id))) { puntos += 2; razones.push('mismo proveedor que otra pieza: una cuenta y una factura menos') }
    if (nec.preferir.includes(p.id) || nec.preferir.includes(familia(p.id))) { puntos += 5; razones.push('preferido por la persona') }
    if (falta.length) razones.push(`no cubre: ${falta.join(', ')}`)
    candidatos.push({ id: p.id, nombre: p.nombre, puntos, falta, razones, porDefecto: !!p.porDefecto, especialidad: p.especialidad, fuente: p.fuente, verificado: p.verificado })
  }
  // Empate: gana la opción marcada porDefecto en el catálogo (la más probada para principiantes).
  candidatos.sort((a, b) => b.puntos - a.puntos || a.falta.length - b.falta.length || Number(b.porDefecto) - Number(a.porDefecto) || a.id.localeCompare(b.id))
  const completos = candidatos.filter(c => !c.falta.length)
  let gana = completos[0] || null
  // Nadie cubre todo solo: busca la mejor pareja que juntos lo cubran (mejor si son de la misma empresa).
  if (!gana && candidatos.length > 1) {
    const rasgosDe = new Map(lista.filter(x => x.categoria === cat).map(x => [x.id, new Set(x.rasgos || [])]))
    const necesarios = ANCLAS[cat].filter(r => pide.has(r))
    let mejor = null
    for (let i = 0; i < candidatos.length; i++) for (let j = i + 1; j < candidatos.length; j++) {
      const [a, b] = [candidatos[i], candidatos[j]]
      if (!necesarios.every(r => rasgosDe.get(a.id).has(r) || rasgosDe.get(b.id).has(r))) continue
      const juntos = familia(a.id) === familia(b.id)
      const puntos = a.puntos + b.puntos + (juntos ? 4 : 0)
      if (!mejor || (juntos && !mejor.juntos) || (juntos === mejor.juntos && puntos > mejor.puntos)) mejor = { a, b, juntos, puntos }
    }
    if (mejor) gana = {
      id: `${mejor.a.id}+${mejor.b.id}`, nombre: `${mejor.a.nombre} + ${mejor.b.nombre}`, puntos: mejor.puntos, falta: [],
      combo: [mejor.a.id, mejor.b.id], porDefecto: false, especialidad: `${mejor.a.especialidad} / ${mejor.b.especialidad}`,
      razones: [`juntos cubren: ${necesarios.join(', ')}`, ...(mejor.juntos ? ['misma empresa: se integran entre sí'] : ['dos servicios distintos: confirma que se integran'])],
    }
  }
  gana ||= candidatos[0] || null
  const enCombo = new Set(gana?.combo || [])
  return {
    categoria: cat,
    pide: ANCLAS[cat].filter(r => pide.has(r)),
    recomendado: gana,
    alternativas: candidatos.filter(c => c !== gana && !enCombo.has(c.id)).slice(0, 2),
    descartes: [...descartes, ...candidatos.filter(c => c !== gana && !enCombo.has(c.id) && c.falta.length).slice(0, 3).map(c => ({ id: c.id, motivo: `no cubre ${c.falta.join(', ')}` }))],
    sinCobertura: !gana || gana.falta.length > 0,
  }
}

function recomendar(lista, nec) {
  const pide = new Set(nec.rasgos)
  const cats = CATEGORIAS.filter(c => nec.categorias.includes(c) || ANCLAS[c].some(r => pide.has(r)))
  // Primera pasada sin afinidad; luego se repite con los ganadores de las demás categorías hasta que
  // nada cambie, para que la afinidad (menos proveedores) no dependa del orden de las categorías.
  let res = cats.map(c => puntuarCategoria(lista, c, nec, pide, []))
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const ganadores = res.map(r => r.recomendado?.id).filter(Boolean)
    const nuevo = cats.map((c, i) => puntuarCategoria(lista, c, nec, pide, ganadores.filter((_, j) => j !== i)))
    const igual = nuevo.every((r, i) => r.recomendado?.id === res[i].recomendado?.id)
    res = nuevo
    if (igual) break
  }
  // Si la plataforma de chatbots elegida ya conecta WhatsApp (o lo que pida mensajería), no se agrega otra pieza.
  const chat = res.find(r => r.categoria === 'chatbots')?.recomendado
  const men = res.find(r => r.categoria === 'mensajeria')
  if (chat && men && !nec.categorias.includes('mensajeria')) {
    const ids = chat.combo || [chat.id]
    const cubre = new Set(lista.filter(p => ids.includes(p.id)).flatMap(p => p.rasgos || []))
    if (men.pide.every(r => cubre.has(r))) {
      men.cubiertoPor = chat.nombre
      men.alternativas = [men.recomendado, ...men.alternativas].filter(Boolean).slice(0, 2)
      men.recomendado = null
    }
  }
  return res
}

function cmdProveedores([sub, ...args]) {
  const lista = catalogo()
  if (sub === 'validar') {
    const e = validarCatalogo(lista)
    if (e.length) { e.forEach(x => console.log(`✗ ${x}`)); process.exit(1) }
    const porCat = CATEGORIAS.map(c => `${c} ${lista.filter(p => p.categoria === c).length}`).join(' · ')
    return console.log(`✓ ${lista.length} fichas válidas\n${porCat}`)
  }
  if (sub === 'lista') {
    const i = args.indexOf('--categoria')
    const cat = i >= 0 ? args[i + 1] : null
    for (const c of CATEGORIAS.filter(x => !cat || x === cat)) {
      const ps = lista.filter(p => p.categoria === c)
      if (!ps.length) continue
      console.log(`\n## ${c}`)
      for (const p of ps) console.log(`- ${p.nombre} (${p.id}): ${p.especialidad}`)
    }
    return
  }
  if (sub === 'ver') {
    const p = lista.find(x => x.id === args[0])
    if (!p) fallar(`No existe el proveedor ${args[0]}. Usa: masterplan.mjs proveedores lista`)
    return console.log(JSON.stringify(p, null, 2))
  }
  if (sub === 'recomendar') {
    const nec = necesidadesDe(args)
    if (!nec.rasgos.length && !nec.categorias.length) fallar('Sin necesidades. Usa --rasgos ssr,postgres,video-vod … o define "necesidades" en proyecto.json.')
    const desconocidos = nec.rasgos.filter(r => !RASGOS.has(r))
    if (desconocidos.length) fallar(`Rasgos desconocidos: ${desconocidos.join(', ')}. Vocabulario en conocimiento/proveedores.md`)
    const r = recomendar(lista, nec)
    if (args.includes('--json')) return console.log(JSON.stringify(r, null, 2))
    for (const c of r) {
      console.log(`\n## ${c.categoria}${c.pide.length ? ` (pide: ${c.pide.join(', ')})` : ''}`)
      if (c.cubiertoPor) { console.log(`  → ya lo cubre ${c.cubiertoPor}; si igual quieres la API directa: ${c.alternativas.map(a => a.nombre).join(' o ')}`); continue }
      if (!c.recomendado) { console.log('  sin proveedores en el catálogo'); continue }
      console.log(`  → ${c.recomendado.nombre} · ${c.recomendado.razones.join(' · ') || 'opción general'}`)
      for (const a of c.alternativas) console.log(`    alternativa: ${a.nombre} · ${a.razones.join(' · ') || 'opción general'}`)
      if (c.sinCobertura) console.log('    ⚠ ningún proveedor cubre todo lo pedido: decide qué ceder o combina dos')
    }
    if (args.includes('--guardar')) {
      const pr = proyecto()
      pr.proveedores = Object.fromEntries(r.filter(c => c.recomendado).map(c => [c.categoria, c.recomendado.id]))
      guardarProyecto(pr)
      console.log('\n✓ guardado en proyecto.json → proveedores')
    }
    return
  }
  fallar('Uso: masterplan.mjs proveedores recomendar [--rasgos a,b] [--presupuesto cero|bajo|medio|alto] [--json] [--guardar] | lista [--categoria c] | ver <id> | validar')
}

// ---------- piloto automático: seguir en una sesión nueva sin que la persona escriba nada ----------
const AUTONOMIA = ['guiada', 'continua']
const SESIONES_AUTO_MAX = 30
// Lo que SIEMPRE necesita a la persona, aunque haya dado permisos totales.
const SIEMPRE_HUMANO = 'publicar a producción, cobrar, enviar mensajes, borrar datos, crear cuentas o llaves, gastar dinero nuevo, rotar secretos, push forzado'

function decisionAuto(pr) {
  const parar = (motivo, quien = 'persona') => ({ accion: 'parar', motivo, quien })
  if ((pr.autonomia || 'guiada') !== 'continua') return parar('autonomía guiada: la persona decide cuándo seguir (actívala con /masterplan:auto)')
  if (pr.fase < 5) return parar(`la fase ${pr.fase} (${FASES[pr.fase]}) es una conversación con la persona: hay respuestas que solo ella tiene`)
  if (pr.fase >= 7) return parar(`la fase ${pr.fase} termina en publicar o mantener producción: hace falta tu confirmación (${SIEMPRE_HUMANO})`)
  const pend = (pr.pendientes_humanos || []).filter(Boolean)
  if (pend.length) return parar(`falta algo que solo la persona puede dar: ${pend.join('; ')}`)
  const ts = tareas()
  const bloq = ts.filter(t => t.estado === 'bloqueada')
  if (bloq.length) return parar(`tareas bloqueadas: ${bloq.map(t => `${t.id} (${t.motivo || 'sin motivo'})`).join(', ')}`)
  const n = pr.auto?.sesiones ?? 0
  const max = pr.auto?.max ?? SESIONES_AUTO_MAX
  if (n >= max) return parar(`ya se encadenaron ${n} sesiones automáticas (tope ${max}): revisa el avance antes de seguir`)
  if (pr.fase === 6) {
    if (!ts.length) return parar('no hay plan/tareas.json')
    const cur = ts.filter(t => t.estado === 'en-curso')
    const sig = siguientes(ts)
    if (!sig.length && !cur.length && ts.every(t => t.estado === 'hecha')) return { accion: 'continuar', motivo: 'todas las tareas están hechas: pasar a la fase 7 (verificar)', prompt: '/masterplan:seguir', sesiones: n + 1 }
    if (!sig.length && !cur.length) return parar('no hay tareas libres ni en curso, pero el plan no está completo: revisa dependencias')
  }
  return { accion: 'continuar', motivo: `fase ${pr.fase} (${FASES[pr.fase]}) con trabajo pendiente`, prompt: '/masterplan:seguir', sesiones: n + 1 }
}

function cmdAuto(args) {
  const pr = proyecto()
  if (args[0] === 'activar') {
    pr.autonomia = 'continua'
    pr.auto = { sesiones: 0, max: SESIONES_AUTO_MAX, desde: ahora() }
    guardarProyecto(pr)
    return console.log(`✓ autonomía continua: Masterplan seguirá solo en sesiones nuevas hasta terminar. Se detiene ante: ${SIEMPRE_HUMANO}, llaves o cuentas que falten, tareas bloqueadas y preguntas que solo tú puedes contestar.`)
  }
  if (args[0] === 'desactivar') {
    pr.autonomia = 'guiada'
    guardarProyecto(pr)
    return console.log('✓ autonomía guiada: al cerrar cada fase u ola se te dirá cómo seguir.')
  }
  if (args[0] === 'pendiente') {
    const txt = args.slice(1).join(' ').trim()
    if (!txt) fallar('Uso: masterplan.mjs auto pendiente "<qué necesita la persona>"')
    pr.pendientes_humanos = [...(pr.pendientes_humanos || []), txt]
    guardarProyecto(pr)
    return console.log(`✓ anotado: ${txt}`)
  }
  if (args[0] === 'resuelto') {
    pr.pendientes_humanos = []
    guardarProyecto(pr)
    return console.log('✓ pendientes de la persona resueltos')
  }
  const d = decisionAuto(pr)
  if (d.accion === 'continuar' && args.includes('--registrar')) {
    pr.auto = { ...(pr.auto || { max: SESIONES_AUTO_MAX }), sesiones: d.sesiones, ultima: ahora() }
    guardarProyecto(pr)
  }
  if (args.includes('--json')) return console.log(JSON.stringify(d, null, 2))
  console.log(d.accion === 'continuar' ? `CONTINUAR · ${d.motivo} · lanza una sesión nueva con: ${d.prompt}` : `PARAR · ${d.motivo}`)
  process.exit(d.accion === 'continuar' ? 0 : 3)
}

// ---------- main ----------
const AYUDA = `Masterplan · comandos (desde la raíz de tu proyecto)
  estado                         fase, tareas, último relevo y buzón
  validar [--json]               revisa el plano y el plan (sale 1 si hay BLOCKER)
  tarea                          muestra las tareas disponibles de la ola actual
  tarea <id> <estado> [motivo]   pendiente | en-curso | hecha | bloqueada  (en-curso acepta --sesion=<id>)
  auto [--json] [--registrar]   ¿seguir solo en una sesión nueva? (CONTINUAR/PARAR con el motivo); auto activar|desactivar|pendiente "…"|resuelto
  ola [n] [--escribir] [--json]  tareas libres de la ola para lanzar en paralelo, una sesión por tarea, con sus briefs
  pgtap-resumen <archivo|->      lista los asertos que fallan en una salida TAP/pgTAP
  auditoria fusionar|comparar    une hallazgos y calcula las dos notas / compara las 2 últimas
  deriva                         specs sin prueba, tablas sin RLS, variables sin documentar
  cambio nuevo "<qué>"           abre un cambio (delta) sobre las specs vivas
  cambio archivar <carpeta>      aplica el delta a specs/ y lo archiva
  relevo [NN-fase]               crea el relevo para seguir en una sesión nueva
  buzon enviar --para fase-N "…" | buzon leer   mensajes entre sesiones (sin mod)
  proveedores recomendar [--rasgos a,b] [--presupuesto cero|bajo|medio|alto] [--json] [--guardar]
  proveedores lista [--categoria c] | ver <id> | validar   catálogo de herramientas por necesidad`

const [cmd, ...args] = process.argv.slice(2)
try {
  switch (cmd) {
    case 'estado': cmdEstado(); break
    case 'validar': cmdValidar(args); break
    case 'tarea': cmdTarea(args); break
    case 'auditoria': cmdAuditoria(args); break
    case 'deriva': cmdDeriva(); break
    case 'cambio': cmdCambio(args); break
    case 'relevo': cmdRelevo(args); break
    case 'ola': cmdOla(args); break
    case 'auto': cmdAuto(args); break
    case 'pgtap-resumen': cmdPgtap(args); break
    case 'buzon': cmdBuzon(args); break
    case 'proveedores': cmdProveedores(args); break
    case undefined: case 'ayuda': case '--help': case '-h': console.log(AYUDA); break
    default: fallar(`Comando desconocido: ${cmd}\n\n${AYUDA}`)
  }
} catch (e) { fallar(e.message) }
