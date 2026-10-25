// Pruebas de 1.4.0: rigor, hito visible, ampliaciones, olas en paralelo, relevo automático y pgtap-resumen.
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

function proyectoTemporal(pr = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp130-'))
  fs.mkdirSync(path.join(dir, 'masterplan', 'plan'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'masterplan', 'proyecto.json'), JSON.stringify({ nombre: 'demo', modo: 'greenfield', fase: 6, creado: '2026-10-24', ...pr }))
  return dir
}
const escribir = (dir, rel, texto) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, texto) }
const mp = (dir, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' })

const tarea = (id, extra = {}) => ({
  id, titulo: `Tarea ${id}`, ola: 1, depende: [], agente: 'masterplan:constructor', specs: ['AUTH-001'],
  archivos: [`src/${id}.ts`], hacer: 'algo concreto',
  criterios: ['CUANDO un anónimo pide /app EL SISTEMA DEBE redirigir a /login', 'CUANDO la sesión expira EL SISTEMA DEBE pedir login de nuevo'],
  verificar: ['npm test'], checkpoint: `git add -A && git commit -m "${id}" && git tag mp-${id}`, estado: 'pendiente', ...extra
})

function proyectoConPlan(tareas, pr = {}) {
  const dir = proyectoTemporal({ capacidades: ['auth'], alcance: { version: 'recomendada', flujoPrincipal: ['entra'], noGoals: ['a', 'b', 'c', 'd', 'e'] }, ...pr })
  for (const d of ['arquitectura.md', 'datos.md', 'api.md', 'DESIGN.md', 'EXPERIENCE.md']) escribir(dir, `masterplan/${d}`, `# ${d}\n`)
  escribir(dir, 'masterplan/seguridad.md', '# Seguridad\n## Matriz rol × recurso\n## Políticas RLS\n')
  escribir(dir, 'masterplan/specs/auth.md', '# Auth\n### AUTH-001\nCUANDO el anónimo entra EL SISTEMA DEBE pedir login.\n### AUTH-002\notro\n')
  escribir(dir, 'masterplan/plan/gate.md', '# Gate\n')
  escribir(dir, 'masterplan/plan/tareas.json', JSON.stringify(tareas))
  return dir
}

// Plan de 6 tareas en 3 olas (cumple el mínimo para exigir hito visible)
const plan = (visible = {}) => [
  tarea('T01', { ola: 1 }), tarea('T02', { ola: 1 }),
  tarea('T03', { ola: 2, depende: ['T01'] }), tarea('T04', { ola: 2, depende: ['T02'] }),
  tarea('T05', { ola: 3, depende: ['T03'] }), tarea('T06', { ola: 3, depende: ['T04'] })
].map(t => ({ ...t, ...(visible[t.id] || {}) }))

test('rigor: un valor inválido hace fallar estado; uno válido se muestra', () => {
  const mal = proyectoTemporal({ rigor: 'extremo' })
  assert.equal(mp(mal, 'estado').status, 1)
  const bien = proyectoTemporal({ rigor: 'bajo' })
  const r = mp(bien, 'estado')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /rigor bajo/)
})

test('validar: un plan de 6+ tareas sin hito visible es MAJOR', () => {
  const r = mp(proyectoConPlan(plan()), 'validar')
  assert.match(r.stdout, /MAJOR .*hito:"visible"/)
})

test('validar: hito visible tardío es MAJOR y temprano pasa', () => {
  const tarde = mp(proyectoConPlan(plan({ T05: { hito: 'visible' } })), 'validar')
  assert.match(tarde.stdout, /primer hito visible llega en la ola 3 de 3/)
  const bien = mp(proyectoConPlan(plan({ T03: { hito: 'visible' } })), 'validar')
  assert.doesNotMatch(bien.stdout, /hito/)
  assert.equal(bien.status, 0, bien.stdout)
})

test('validar: planes chicos (<6 tareas) no exigen hito visible', () => {
  const r = mp(proyectoConPlan([tarea('T01'), tarea('T02', { ola: 2, depende: ['T01'] })]), 'validar')
  assert.doesNotMatch(r.stdout, /hito/)
})

test('validar: el núcleo no puede depender de una ampliación; fase_producto inválida se rechaza', () => {
  const dep = mp(proyectoConPlan(plan({ T03: { hito: 'visible' }, T01: { fase_producto: 'ampliacion' }, T05: { fase_producto: 'nucleo' } })), 'validar')
  assert.match(dep.stdout, /T03 .*es del núcleo pero depende de T01/)
  const mal = mp(proyectoConPlan(plan({ T03: { hito: 'visible' }, T02: { fase_producto: 'luego' } })), 'validar')
  assert.match(mal.stdout, /fase_producto inválida: luego/)
})

test('validar: "hacer" de más de 600 caracteres avisa como MINOR y no bloquea', () => {
  const r = mp(proyectoConPlan(plan({ T03: { hito: 'visible' }, T01: { hacer: 'x'.repeat(601) } })), 'validar')
  assert.match(r.stdout, /MINOR .*máx\. 600/)
  assert.equal(r.status, 0, r.stdout)
})

test('ola: lanza solo tareas libres, respeta paralelo_max y escribe briefs con la spec', () => {
  const dir = proyectoConPlan(plan(), { paralelo_max: 1, rigor: 'bajo' })
  const r = mp(dir, 'ola', '--escribir')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /Ola 1 · 1 sesión\(es\) en paralelo \(máx\. 1\) · rigor bajo/)
  assert.match(r.stdout, /En espera.*T02/)
  const brief = fs.readFileSync(path.join(dir, 'masterplan', 'olas', 'ola-1', 'T01.brief.md'), 'utf8')
  assert.match(brief, /git worktree add/)
  assert.match(brief, /rama mp-T01/)
  assert.match(brief, /CUANDO el anónimo entra EL SISTEMA DEBE pedir login/)
  assert.doesNotMatch(brief, /otro\s*$/m) // no arrastra la spec siguiente
})

test('ola: --json devuelve los briefs y la revisión depende del rigor', () => {
  const alto = JSON.parse(mp(proyectoConPlan(plan(), { rigor: 'alto' }), 'ola', '--json').stdout)
  assert.equal(alto.lanzar.length, 2)
  assert.match(alto.revision, /por tarea/)
  const bajo = JSON.parse(mp(proyectoConPlan(plan(), { rigor: 'bajo' }), 'ola', '1', '--json').stdout)
  assert.match(bajo.revision, /una revisión por ola/)
  assert.equal(bajo.briefs.length, 2)
})

test('ola: dos tareas libres que comparten archivo no salen juntas', () => {
  const ts = [tarea('T01', { archivos: ['a.ts'] }), tarea('T02', { archivos: ['a.ts'] })]
  const r = mp(proyectoConPlan(ts), 'ola')
  assert.match(r.stdout, /1 sesión/)
  assert.match(r.stdout, /T02 comparte a\.ts con T01/)
})

test('tarea: en-curso guarda la sesión y hecha la limpia', () => {
  const dir = proyectoConPlan(plan())
  assert.equal(mp(dir, 'tarea', 'T01', 'en-curso', '--sesion=local_abc').status, 0)
  const t = JSON.parse(fs.readFileSync(path.join(dir, 'masterplan', 'plan', 'tareas.json'), 'utf8')).find(x => x.id === 'T01')
  assert.equal(t.sesion, 'local_abc')
  mp(dir, 'tarea', 'T01', 'hecha')
  const t2 = JSON.parse(fs.readFileSync(path.join(dir, 'masterplan', 'plan', 'tareas.json'), 'utf8')).find(x => x.id === 'T01')
  assert.equal(t2.sesion, undefined)
})

test('relevo: se autocompleta con estado de tareas y decisiones nuevas, una sola vez', () => {
  const dir = proyectoConPlan(plan({ T01: { estado: 'hecha' }, T02: { estado: 'en-curso', sesion: 's9' } }))
  escribir(dir, 'masterplan/decisiones.log', '2026-10-24 | D-001 | Se usa Postgres local | chat\n2026-10-24 | D-002 | Rigor bajo | chat\n')
  const r = mp(dir, 'relevo', '06-ola-1')
  assert.equal(r.status, 0, r.stderr)
  const md = fs.readFileSync(path.join(dir, 'masterplan', 'relevos', '06-ola-1.md'), 'utf8')
  assert.match(md, /Tareas: 1\/6 hechas \(última: T01\)/)
  assert.match(md, /En curso: T02 \(sesión s9\)/)
  assert.match(md, /D-001: Se usa Postgres local/)
  assert.doesNotMatch(md, /\{auto\}/)
  // el siguiente relevo solo trae las decisiones posteriores
  escribir(dir, 'masterplan/decisiones.log', '2026-10-24 | D-001 | Se usa Postgres local | chat\n2026-10-24 | D-002 | Rigor bajo | chat\n2026-10-25 | D-003 | Nueva | chat\n')
  mp(dir, 'relevo', '06-ola-2')
  const md2 = fs.readFileSync(path.join(dir, 'masterplan', 'relevos', '06-ola-2.md'), 'utf8')
  assert.match(md2, /Decisiones nuevas \(1\)/)
  assert.doesNotMatch(md2, /D-001/)
})

test('pgtap-resumen: lista los asertos que fallan y sale 1; si todo pasa sale 0', () => {
  const dir = proyectoTemporal()
  escribir(dir, 'mal.tap', '1..3\nok 1 a\nnot ok 2 b\n# Failed test 2\nok 3 c\n')
  escribir(dir, 'bien.tap', '1..2\nok 1 a\nok 2 b\n')
  const mal = mp(dir, 'pgtap-resumen', 'mal.tap')
  assert.equal(mal.status, 1)
  assert.match(mal.stdout, /2 ok · 1 fallan/)
  assert.match(mal.stdout, /not ok 2 b/)
  const bien = mp(dir, 'pgtap-resumen', 'bien.tap')
  assert.equal(bien.status, 0)
})
