// Mod de Masterplan: conecta las sesiones de un mismo proyecto para que el trabajo no viva en una
// sola conversación. Cada sesión se registra con su fase; las sesiones se mandan mensajes en vivo
// (o quedan en un buzón si la otra no está abierta); un panel y una banda muestran el estado.
// Sin este mod todo funciona igual con los archivos masterplan/relevos y masterplan/buzon.

import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { MasterplanMensaje, MasterplanResumen, MasterplanSesion } from '../types'

const FASES = ['contexto', 'descubrir', 'recortar', 'diseñar', 'puertas', 'planear', 'construir', 'publicar', 'operar']
const PANEL = 'masterplan-panel'
const VIGENCIA_SESION = 12 * 60 * 60 * 1000
const MAX_MENSAJES = 200

const resumen = atom({ plugin: 'masterplan', key: 'resumen' } as const, null)
const bandaOculta = atom({ plugin: 'masterplan', key: 'bandaOculta' } as const, false)

type Sesiones = Record<string, MasterplanSesion[]>
type Buzon = Record<string, MasterplanMensaje[]>
type Tarea = { id: string; titulo?: string; estado?: string; depende?: string[]; ola?: number }

// ---------- lectura del proyecto ----------
async function proyecto($: any): Promise<{ raiz: string; pr: any } | null> {
  const raiz: string = await $.session.root()
  try {
    return { raiz, pr: JSON.parse(await $.fs.read(`${raiz}/masterplan/proyecto.json`)) }
  } catch {
    return null
  }
}

async function tareas($: any, raiz: string): Promise<Tarea[]> {
  try {
    const t = JSON.parse(await $.fs.read(`${raiz}/masterplan/plan/tareas.json`))
    return Array.isArray(t) ? t : []
  } catch {
    return []
  }
}

async function sesionesDe($: any, raiz: string): Promise<MasterplanSesion[]> {
  const todas = ((await $.store.get('sesiones')) ?? {}) as Sesiones
  const limite = (await $.clock.now()) - VIGENCIA_SESION
  return (todas[raiz] ?? []).filter(s => s.visto > limite)
}

async function guardarSesiones($: any, raiz: string, lista: MasterplanSesion[]) {
  const todas = ((await $.store.get('sesiones')) ?? {}) as Sesiones
  todas[raiz] = lista
  await $.store.set('sesiones', todas)
}

async function buzonDe($: any, raiz: string): Promise<MasterplanMensaje[]> {
  const b = ((await $.store.get('buzon')) ?? {}) as Buzon
  return b[raiz] ?? []
}

async function guardarBuzon($: any, raiz: string, lista: MasterplanMensaje[]) {
  const b = ((await $.store.get('buzon')) ?? {}) as Buzon
  b[raiz] = lista.slice(-MAX_MENSAJES)
  await $.store.set('buzon', b)
}

function esParaMi(m: MasterplanMensaje, id: string, fase: number) {
  if (m.de === id || m.leidoPor.includes(id)) return false
  return m.para === 'todas' || m.para === id || m.para === `fase-${fase}`
}

async function refrescar($: any) {
  const p = await proyecto($)
  if (!p) return update($, resumen, () => null)
  const id: string = await $.session.id()
  const ts = await tareas($, p.raiz)
  const hechas = new Set(ts.filter(t => t.estado === 'hecha').map(t => t.id))
  const sig = ts.find(t => t.estado === 'pendiente' && (t.depende ?? []).every(d => hechas.has(d)))
  const fase = Number.isInteger(p.pr.fase) ? p.pr.fase : 0
  const r: MasterplanResumen = {
    proyecto: String(p.pr.nombre ?? 'proyecto'),
    raiz: p.raiz,
    fase,
    faseNombre: FASES[fase] ?? '?',
    tareasHechas: hechas.size,
    tareasTotal: ts.length,
    siguiente: sig ? `${sig.id} ${sig.titulo ?? ''}`.trim() : undefined,
    sesiones: await sesionesDe($, p.raiz),
    sinLeer: (await buzonDe($, p.raiz)).filter(m => esParaMi(m, id, fase)).length,
  }
  await update($, resumen, () => r)
  $.ui.status(`Masterplan · fase ${fase} ${r.faseNombre}${r.tareasTotal ? ` · ${r.tareasHechas}/${r.tareasTotal}` : ''}`)
}

async function registrarSesion($: any, raiz: string, datos: Partial<MasterplanSesion>) {
  const id: string = await $.session.id()
  const lista = (await sesionesDe($, raiz)).filter(s => s.id !== id)
  const previa = ((((await $.store.get('sesiones')) ?? {}) as Sesiones)[raiz] ?? []).find(s => s.id === id)
  lista.push({ id, fase: datos.fase ?? previa?.fase ?? 0, ola: datos.ola ?? previa?.ola, nombre: datos.nombre ?? previa?.nombre, visto: await $.clock.now() })
  await guardarSesiones($, raiz, lista)
  return id
}


export const register: Register = on => {
  // ---------- arranque ----------
  on('session.start', async ($, e, next) => {
    const herramientas = [
      {
        name: 'registrar',
        description: 'Masterplan: registra esta sesión en el proyecto con la fase (0-8) y la ola que trabaja, para que las demás sesiones la encuentren. Llámala al empezar una fase.',
        inputSchema: { type: 'object', properties: { fase: { type: 'integer', minimum: 0, maximum: 8 }, ola: { type: 'integer', minimum: 1 }, nombre: { type: 'string' } }, required: ['fase'] },
      },
      {
        name: 'sesiones',
        description: 'Masterplan: lista las sesiones abiertas del mismo proyecto, con su fase y ola.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'enviar',
        description: 'Masterplan: manda un mensaje a otras sesiones del proyecto. "para" es un id de sesión, "fase-N" (todas las sesiones de esa fase) o "todas". Si la sesión destino no está abierta, el mensaje queda en el buzón y lo lee al arrancar.',
        inputSchema: { type: 'object', properties: { para: { type: 'string' }, texto: { type: 'string', minLength: 1 } }, required: ['para', 'texto'] },
      },
      {
        name: 'buzon',
        description: 'Masterplan: lee los mensajes pendientes para esta sesión (por id, por su fase o para todas) y los marca como leídos.',
        inputSchema: { type: 'object', properties: {} },
      },
    ]
    for (const h of herramientas) await $.tool.register({ ...h, isDeferred: false })
    await $.command.register({ name: 'masterplan-panel', description: 'Abre el panel de Masterplan: fase, tareas, sesiones y mensajes' })

    const p = await proyecto($)
    if (p) {
      const fase = Number.isInteger(p.pr.fase) ? p.pr.fase : 0
      const id = await registrarSesion($, p.raiz, { fase })
      const pendientes = (await buzonDe($, p.raiz)).filter(m => esParaMi(m, id, fase))
      if (pendientes.length) {
        const texto = pendientes.map(m => `- (${new Date(m.fecha).toISOString().slice(0, 16)}, de ${m.deFase !== undefined ? `fase ${m.deFase}` : m.de.slice(0, 8)}) ${m.texto}`).join('\n')
        // $.session.append llegó en versiones recientes del motor; en las anteriores el mensaje
        // queda en el buzón y la skill lo lee con mcp__masterplan__buzon al arrancar.
        try {
          await $.session.append({
            message: { type: 'user', content: [{ type: 'text', text: `[Masterplan · mensajes de otras sesiones de este proyecto]\n${texto}\nTenlos en cuenta antes de seguir.` }] },
          })
          await guardarBuzon($, p.raiz, (await buzonDe($, p.raiz)).map(m => (pendientes.some(x => x.id === m.id) ? { ...m, leidoPor: [...m.leidoPor, id] } : m)))
        } catch {
          $.ui.toast(`Masterplan: ${pendientes.length} mensaje(s) de otras sesiones en el buzón`)
        }
      }
      await refrescar($)
      $.clock.every(30_000, () => { void refrescar($) })
    }
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    const p = await proyecto($)
    if (p) {
      const id: string = await $.session.id()
      await guardarSesiones($, p.raiz, (await sesionesDe($, p.raiz)).filter(s => s.id !== id))
    }
    return next(e)
  })

  // ---------- herramientas ----------
  on('tool.call', { tool: 'mcp__masterplan__registrar' }, async ($, e: any) => {
    const p = await proyecto($)
    if (!p) return { result: 'No hay masterplan/proyecto.json en esta carpeta: empieza con /masterplan:empezar.' }
    const id = await registrarSesion($, p.raiz, { fase: e.fase, ola: e.ola, nombre: e.nombre })
    await refrescar($)
    return { result: `Sesión ${id.slice(0, 8)} registrada en fase ${e.fase}${e.ola ? `, ola ${e.ola}` : ''}.` }
  })

  on('tool.call', { tool: 'mcp__masterplan__sesiones' }, async $ => {
    const p = await proyecto($)
    if (!p) return { result: 'No hay proyecto Masterplan en esta carpeta.' }
    const yo: string = await $.session.id()
    const lista = await sesionesDe($, p.raiz)
    if (!lista.length) return { result: 'No hay otras sesiones registradas.' }
    return {
      result: lista
        .map(s => `${s.id}${s.id === yo ? ' (esta)' : ''} · fase ${s.fase} ${FASES[s.fase] ?? ''}${s.ola ? ` · ola ${s.ola}` : ''}${s.nombre ? ` · ${s.nombre}` : ''}`)
        .join('\n'),
    }
  })

  on('tool.call', { tool: 'mcp__masterplan__enviar' }, async ($, e: any) => {
    const p = await proyecto($)
    if (!p) return { result: 'No hay proyecto Masterplan en esta carpeta.' }
    const yo: string = await $.session.id()
    const para = String(e.para ?? 'todas')
    const texto = String(e.texto ?? '').trim()
    if (!texto) return { deny: 'El mensaje está vacío.' }
    const vivas = (await sesionesDe($, p.raiz)).filter(s => s.id !== yo)
    const destinos = para === 'todas' ? vivas : para.startsWith('fase-') ? vivas.filter(s => `fase-${s.fase}` === para) : vivas.filter(s => s.id === para)
    const entregadas: string[] = []
    for (const s of destinos) {
      const r = await $.session.send({ to: { sessionId: s.id }, text: `[Masterplan] ${texto}` })
      if (r.isDelivered) entregadas.push(s.id)
    }
    const fase = Number.isInteger(p.pr.fase) ? p.pr.fase : undefined
    const msg: MasterplanMensaje = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, de: yo, deFase: fase, para, texto, fecha: await $.clock.now(), leidoPor: [yo, ...entregadas] }
    await guardarBuzon($, p.raiz, [...(await buzonDe($, p.raiz)), msg])
    await refrescar($)
    return {
      result: entregadas.length
        ? `Entregado en vivo a ${entregadas.length} sesión(es); también queda en el buzón para las que se abran después.`
        : 'Ninguna sesión destino está abierta: el mensaje queda en el buzón y se leerá al arrancar la próxima sesión de esa fase.',
    }
  })

  on('tool.call', { tool: 'mcp__masterplan__buzon' }, async $ => {
    const p = await proyecto($)
    if (!p) return { result: 'No hay proyecto Masterplan en esta carpeta.' }
    const yo: string = await $.session.id()
    const fase = Number.isInteger(p.pr.fase) ? p.pr.fase : 0
    const todos = await buzonDe($, p.raiz)
    const mios = todos.filter(m => esParaMi(m, yo, fase))
    if (!mios.length) return { result: 'Buzón vacío.' }
    await guardarBuzon($, p.raiz, todos.map(m => (mios.some(x => x.id === m.id) ? { ...m, leidoPor: [...m.leidoPor, yo] } : m)))
    await refrescar($)
    return { result: mios.map(m => `- de ${m.deFase !== undefined ? `fase ${m.deFase}` : m.de.slice(0, 8)}: ${m.texto}`).join('\n') }
  })

  // ---------- panel y banda ----------
  on('command.run', { command: 'masterplan-panel' }, async $ => {
    await refrescar($)
    await $.ui.open({ id: PANEL, title: 'Masterplan' })
    return { text: 'Panel de Masterplan abierto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANEL }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const r = await read($, resumen)
    if (!r) return <Text dimColor>Esta carpeta no tiene un proyecto Masterplan. Empieza con /masterplan:empezar.</Text>
    return (
      <Box flexDirection="column">
        <Text bold>{r.proyecto}</Text>
        <Text>Fase {r.fase} · {r.faseNombre}</Text>
        {r.tareasTotal > 0 && <Text>Tareas: {r.tareasHechas}/{r.tareasTotal}</Text>}
        {r.siguiente && <Text dimColor>Siguiente: {r.siguiente}</Text>}
        <Text> </Text>
        <Text bold>Sesiones del proyecto ({r.sesiones.length})</Text>
        {r.sesiones.map(s => (
          <Text dimColor>{s.id.slice(0, 8)} · fase {s.fase}{s.ola ? ` · ola ${s.ola}` : ''}{s.nombre ? ` · ${s.nombre}` : ''}</Text>
        ))}
        <Text> </Text>
        <Text>{r.sinLeer ? `${r.sinLeer} mensaje(s) sin leer: pídele a Claude que revise el buzón.` : 'Buzón al día.'}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, resumen)
    if (!r || e.props.hasSurvey || (await read($, bandaOculta))) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text dimColor>
          Masterplan · fase {r.fase} {r.faseNombre}
          {r.tareasTotal ? ` · ${r.tareasHechas}/${r.tareasTotal} tareas` : ''}
          {r.sesiones.length > 1 ? ` · ${r.sesiones.length} sesiones` : ''}
          {r.sinLeer ? ` · ${r.sinLeer} mensaje(s)` : ''}{' '}
        </Text>
        <Button key="panel" label="Panel" onPress={async () => { await $.ui.open({ id: PANEL, title: 'Masterplan' }) }} />
        <Button key="ocultar" label="Ocultar" onPress={() => update($, bandaOculta, () => true)} />
      </Box>
    )
  })
}
