// Coherencia interna del plugin: lo que un archivo cita existe, y lo que escribe el CLI cumple
// sus propios esquemas. Correr: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(RAIZ, 'scripts', 'masterplan.mjs')
const SKILL = path.join(RAIZ, 'skills', 'masterplan')
const existe = p => fs.existsSync(p)
const leer = p => fs.readFileSync(p, 'utf8')

function archivos(dir, filtro, salida = []) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name)
    if (n.isDirectory()) archivos(p, filtro, salida)
    else if (filtro(p)) salida.push(p)
  }
  return salida
}
const rel = p => path.relative(RAIZ, p).split(path.sep).join('/')
// Texto que lee el modelo: comandos, agentes y skills (no la investigación ni el changelog).
const DOCS = ['commands', 'agents', 'skills'].flatMap(d => archivos(path.join(RAIZ, d), p => p.endsWith('.md')))

test('referencias: todo masterplan:<nombre> citado es un agente, un comando o una skill que existe', () => {
  const agentes = new Set(fs.readdirSync(path.join(RAIZ, 'agents')).map(f => f.replace(/\.md$/, '')))
  const comandos = new Set(fs.readdirSync(path.join(RAIZ, 'commands')).map(f => f.replace(/\.md$/, '')))
  const skills = new Set(fs.readdirSync(path.join(RAIZ, 'skills')))
  const rotas = []
  for (const f of [...DOCS, path.join(RAIZ, 'README.md')]) {
    for (const m of leer(f).matchAll(/masterplan:([a-z][a-z-]*[a-z])/g)) {
      const n = m[1]
      if (n === 'kit') continue // "masterplan:kit-*" como comodín
      if (!agentes.has(n) && !comandos.has(n) && !skills.has(n)) rotas.push(`${rel(f)}: masterplan:${n}`)
    }
  }
  assert.deepEqual(rotas, [])
})

test('referencias: las rutas del plugin citadas en los documentos existen', () => {
  const patrones = [
    /`((?:fases|plantillas|conocimiento)\/[\w./-]+\.(?:md|json))`/g,
    /`((?:commands|agents|scripts|hooks|skills)\/[\w./-]+\.(?:md|json|mjs|tsx|sql|ts))`/g
  ]
  const rotas = []
  for (const f of DOCS) {
    const t = leer(f)
    for (const re of patrones) for (const m of t.matchAll(re)) {
      const ruta = m[1]
      if (/[<>*…]/.test(ruta)) continue
      const candidatos = [path.join(RAIZ, ruta), path.join(SKILL, ruta), path.join(path.dirname(f), ruta)]
      if (!candidatos.some(existe)) rotas.push(`${rel(f)}: ${ruta}`)
    }
  }
  assert.deepEqual(rotas, [])
})

test('referencias: todo subcomando de masterplan.mjs citado existe en el CLI', () => {
  const cli = leer(CLI)
  const validos = new Set([...cli.matchAll(/case '([a-z-]+)':/g)].map(m => m[1]))
  const rotos = []
  for (const f of DOCS) {
    for (const m of leer(f).matchAll(/masterplan\.mjs"?\s+([a-z][a-z-]+)/g)) {
      if (!validos.has(m[1])) rotos.push(`${rel(f)}: masterplan.mjs ${m[1]}`)
    }
  }
  assert.deepEqual(rotos, [])
})

test('referencias: la tabla de agentes de SKILL.md lista todos los agentes y ninguno de más', () => {
  const agentes = fs.readdirSync(path.join(RAIZ, 'agents')).map(f => f.replace(/\.md$/, '')).sort()
  const enTabla = [...leer(path.join(SKILL, 'SKILL.md')).matchAll(/^\| `masterplan:([a-z-]+)` \|/gm)].map(m => m[1]).sort()
  assert.deepEqual(enTabla, agentes)
})

// ---------- esquemas: validador mínimo (subconjunto de JSON Schema que usan las plantillas) ----------
function validar(valor, esquema, raiz, ruta = '$', errores = []) {
  if (esquema.$ref) return validar(valor, raiz.$defs[esquema.$ref.split('/').pop()], raiz, ruta, errores)
  const tipo = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v
  if (esquema.type) {
    const tipos = [].concat(esquema.type)
    const t = tipo(valor)
    if (!tipos.includes(t) && !(t === 'integer' && tipos.includes('number'))) { errores.push(`${ruta}: tipo ${t}, se esperaba ${tipos.join('|')}`); return errores }
  }
  if (esquema.enum && !esquema.enum.includes(valor)) errores.push(`${ruta}: "${valor}" no está en ${JSON.stringify(esquema.enum)}`)
  if (esquema.const !== undefined && valor !== esquema.const) errores.push(`${ruta}: debe ser ${esquema.const}`)
  if (typeof valor === 'string') {
    if (esquema.pattern && !new RegExp(esquema.pattern).test(valor)) errores.push(`${ruta}: no cumple ${esquema.pattern}`)
    if (esquema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) errores.push(`${ruta}: no es una fecha AAAA-MM-DD`)
    if (esquema.maxLength && valor.length > esquema.maxLength) errores.push(`${ruta}: muy largo`)
  }
  for (const s of esquema.allOf || []) validar(valor, s, raiz, ruta, errores)
  if (Array.isArray(valor) && esquema.items) valor.forEach((v, i) => validar(v, esquema.items, raiz, `${ruta}[${i}]`, errores))
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    for (const k of esquema.required || []) if (!(k in valor)) errores.push(`${ruta}: falta ${k}`)
    for (const [k, v] of Object.entries(valor)) {
      const sub = esquema.properties?.[k]
      if (sub) validar(v, sub, raiz, `${ruta}.${k}`, errores)
      else if (esquema.additionalProperties === false) errores.push(`${ruta}: propiedad no admitida "${k}"`)
      else if (esquema.additionalProperties && typeof esquema.additionalProperties === 'object') validar(v, esquema.additionalProperties, raiz, `${ruta}.${k}`, errores)
    }
  }
  return errores
}
const esquema = n => JSON.parse(leer(path.join(SKILL, 'plantillas', n)))
const mp = (dir, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' })

function proyectoFase6() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-ref-'))
  const w = (r, t) => { const p = path.join(dir, r); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t) }
  w('masterplan/proyecto.json', JSON.stringify({ nombre: 'demo', modo: 'rapido', fase: 6, creado: '2026-10-24', rigor: 'bajo', capacidades: ['auth', 'video', 'trabajos', 'chatbots', 'ia-media'] }))
  w('masterplan/specs/auth.md', '# Auth\n### AUTH-001\nCUANDO … EL SISTEMA DEBE …\n')
  w('masterplan/plan/tareas.json', JSON.stringify([{
    id: 'T01', titulo: 'Tarea T01', ola: 1, depende: [], agente: 'masterplan:constructor', specs: ['AUTH-001'],
    archivos: ['src/a.ts'], hacer: 'algo concreto',
    criterios: ['CUANDO un anónimo pide /app EL SISTEMA DEBE redirigir a /login', 'CUANDO la sesión expira EL SISTEMA DEBE pedir login de nuevo'],
    verificar: ['npm test'], checkpoint: 'git tag mp-T01', estado: 'pendiente'
  }]))
  return dir
}

test('esquemas: lo que escribe el CLI en tareas.json y proyecto.json cumple sus esquemas', () => {
  const dir = proyectoFase6()
  for (const args of [['tarea', 'T01', 'en-curso', '--sesion=abc'], ['tarea', 'T01', 'bloqueada', 'falta una llave'], ['auto', 'activar'], ['auto', 'pendiente', 'llave de pagos'], ['relevo', '06-ola-1']]) {
    const r = mp(dir, ...args)
    assert.equal(r.status, 0, `${args.join(' ')}: ${r.stdout}${r.stderr}`)
  }
  const tareas = JSON.parse(leer(path.join(dir, 'masterplan/plan/tareas.json')))
  const st = esquema('tareas.schema.json')
  assert.deepEqual(validar(tareas, st, st), [])
  const pr = JSON.parse(leer(path.join(dir, 'masterplan/proyecto.json')))
  const sp = esquema('proyecto.schema.json')
  assert.deepEqual(validar(pr, sp, sp), [])
})

test('ola: el texto de revisión distingue rigor bajo, medio y alto', () => {
  const textos = ['bajo', 'medio', 'alto'].map(rigor => {
    const dir = proyectoFase6()
    const p = path.join(dir, 'masterplan/proyecto.json')
    fs.writeFileSync(p, JSON.stringify({ ...JSON.parse(leer(p)), rigor }))
    const r = mp(dir, 'ola', '--json')
    assert.equal(r.status, 0, r.stdout + r.stderr)
    return JSON.parse(r.stdout).revision
  })
  assert.equal(new Set(textos).size, 3)
})

test('validar: con código existente, tener menos de 5 Non-Goals no bloquea', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-bf-'))
  fs.mkdirSync(path.join(dir, 'masterplan'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'masterplan/proyecto.json'), JSON.stringify({ nombre: 'demo', modo: 'brownfield', fase: 3, creado: '2026-10-24', alcance: { flujoPrincipal: ['entra'] } }))
  const r = mp(dir, 'validar')
  assert.doesNotMatch(r.stdout, /BLOCKER[^\n]*Non-Goals/)
  assert.match(r.stdout, /Non-Goals/)
})

test('validar: desde la fase 4 exige retención de datos (DAT-12) y costo a 10× (OBS-08)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-v-'))
  const w = (r, t) => { const p = path.join(dir, r); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t) }
  w('masterplan/proyecto.json', JSON.stringify({ nombre: 'demo', modo: 'greenfield', fase: 4, creado: '2026-10-24', capacidades: ['datos'], alcance: { flujoPrincipal: ['entra'], noGoals: ['a', 'b', 'c', 'd', 'e'] } }))
  w('masterplan/datos.md', '# Datos\n')
  w('masterplan/arquitectura.md', '# Arquitectura\n')
  let r = mp(dir, 'validar')
  assert.match(r.stdout, /DAT-12/)
  assert.match(r.stdout, /OBS-08/)
  w('masterplan/datos.md', '# Datos\n## Datos personales y retención\n')
  w('masterplan/arquitectura.md', '# Arquitectura\n| Servicio | 1× | 10× |\n')
  r = mp(dir, 'validar')
  assert.doesNotMatch(r.stdout, /DAT-12|OBS-08/)
})

test('cabeceras: description y argument-hint no rompen el YAML (si no, Claude Code descarta modelo y herramientas)', () => {
  const lista = [
    ...fs.readdirSync(path.join(RAIZ, 'agents')).map(f => path.join(RAIZ, 'agents', f)),
    ...fs.readdirSync(path.join(RAIZ, 'commands')).map(f => path.join(RAIZ, 'commands', f)),
    ...fs.readdirSync(path.join(RAIZ, 'skills')).map(d => path.join(RAIZ, 'skills', d, 'SKILL.md'))
  ]
  const malos = []
  for (const f of lista) {
    const m = leer(f).match(/^---\r?\n([\s\S]*?)\r?\n---/)
    assert.ok(m, `${rel(f)} no tiene cabecera`)
    for (const l of m[1].split(/\r?\n/)) {
      const k = l.match(/^(description|argument-hint): (.*)$/)
      if (!k || /^(>|\||"|')/.test(k[2])) continue
      if (/: | #|^[\[{&*!%@`]/.test(k[2])) malos.push(`${rel(f)}: ${k[1]} sin comillas con ": "`)
    }
  }
  assert.deepEqual(malos, [])
})

// ---------- 1.6.0: velocidad ----------
test('kits: cada kit tiene sus dos mitades (decisión con candados, construcción con pruebas)', () => {
  for (const d of fs.readdirSync(path.join(RAIZ, 'skills')).filter(x => x.startsWith('kit-'))) {
    const skill = leer(path.join(RAIZ, 'skills', d, 'SKILL.md'))
    const cons = leer(path.join(RAIZ, 'skills', d, 'construccion.md'))
    assert.match(skill, /^## Candados/m, `${d}: SKILL.md sin Candados`)
    assert.doesNotMatch(skill, /^## (Pasos que agrega al plan|Trampas)/m, `${d}: SKILL.md todavía trae construcción`)
    assert.match(cons, /^## Pasos que agrega al plan/m, `${d}: construccion.md sin pasos`)
    assert.match(cons, /^## Pruebas obligatorias/m, `${d}: construccion.md sin pruebas`)
  }
})

test('ola: el brief trae los candados, pruebas y trampas del kit de la tarea', () => {
  const dir = proyectoFase6()
  const p = path.join(dir, 'masterplan/plan/tareas.json')
  const ts = JSON.parse(leer(p)); ts[0].kit = 'masterplan:kit-auth'
  fs.writeFileSync(p, JSON.stringify(ts))
  const r = mp(dir, 'ola', '--json')
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const brief = JSON.parse(r.stdout).briefs[0].brief
  assert.match(brief, /## Del kit masterplan:kit-auth/)
  assert.match(brief, /### Candados/)
  assert.match(brief, /### Pruebas obligatorias/)
  assert.match(brief, /no abras el kit/)
})

test('ola: la autorización del paralelo se pide una vez y queda guardada', () => {
  const dir = proyectoFase6()
  const p = path.join(dir, 'masterplan/plan/tareas.json')
  const t = JSON.parse(leer(p))[0]
  fs.writeFileSync(p, JSON.stringify([t, { ...t, id: 'T02', titulo: 'Tarea T02', archivos: ['src/b.ts'] }]))
  assert.equal(JSON.parse(mp(dir, 'ola', '--json').stdout).confirmar, true)
  assert.equal(JSON.parse(mp(dir, 'ola', '--json', '--autorizar').stdout).confirmar, false)
  assert.equal(JSON.parse(mp(dir, 'ola', '--json').stdout).confirmar, false)
  const pr = JSON.parse(leer(path.join(dir, 'masterplan/proyecto.json')))
  const sp = esquema('proyecto.schema.json')
  assert.deepEqual(validar(pr, sp, sp), [])
})

test('reglas: fuente única, y los documentos no la contradicen', () => {
  const r = mp(fs.mkdtempSync(path.join(os.tmpdir(), 'mp-r-')), 'reglas', '--json')
  assert.equal(r.status, 0, r.stderr)
  const reglas = JSON.parse(r.stdout)
  const v = reglas.rigor
  const puertas = leer(path.join(SKILL, 'fases', '4-puertas.md'))
  assert.ok(puertas.includes(`\`bajo\` ${v.bajo.vueltas_revisor_plano}, \`medio\` ${v.medio.vueltas_revisor_plano}, \`alto\` ${v.alto.vueltas_revisor_plano}`), 'fase 4 no coincide con las vueltas del CLI')
  assert.ok(leer(path.join(SKILL, 'SKILL.md')).includes(`como máximo ${reglas.preguntas_max_diseno} preguntas`))
  assert.deepEqual(reglas.tramos.flatMap(t => t.fases), [0, 1, 2, 3, 4, 5, 6, 7, 8])
})
