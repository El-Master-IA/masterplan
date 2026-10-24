// Referencia de masterplan:kit-datos. Test de aislamiento con dos usuarios reales y un anónimo.
// Corre contra Supabase local (`supabase start`). Usa la anon key: nunca service_role aquí.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY! // la imprime `supabase status`

// Usuarios creados por supabase/seed.sql: cada uno dueño de su propia org.
const A = { email: 'ana@prueba.test', password: 'clave-de-prueba-A' }
const B = { email: 'beto@prueba.test', password: 'clave-de-prueba-B' }

function nuevoCliente() {
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

async function entrar(cred: typeof A) {
  const c = nuevoCliente()
  const { error } = await c.auth.signInWithPassword(cred)
  if (error) throw error
  return c
}

async function orgDe(c: SupabaseClient) {
  const { data, error } = await c.from('memberships').select('org_id').single()
  if (error) throw error
  return data.org_id as string
}

describe('aislamiento entre organizaciones', () => {
  let a: SupabaseClient
  let b: SupabaseClient
  let anon: SupabaseClient
  let orgA: string
  let orgB: string

  beforeAll(async () => {
    a = await entrar(A)
    b = await entrar(B)
    anon = nuevoCliente()
    orgA = await orgDe(a)
    orgB = await orgDe(b)
    const { error } = await a.from('proyectos').insert({ org_id: orgA, nombre: 'Secreto de A' })
    if (error) throw error
  })

  it('B no ve los proyectos de A', async () => {
    const { data, error } = await b.from('proyectos').select('id').eq('org_id', orgA)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('B no puede escribir en la org de A', async () => {
    const { error } = await b.from('proyectos').insert({ org_id: orgA, nombre: 'intruso' })
    expect(error).not.toBeNull()
  })

  it('A no puede mover su proyecto a la org de B', async () => {
    const { data: filas } = await a.from('proyectos').select('id').limit(1)
    const { error } = await a.from('proyectos').update({ org_id: orgB }).eq('id', filas![0].id)
    expect(error).not.toBeNull()
  })

  it('un anónimo no ve nada', async () => {
    const { data } = await anon.from('proyectos').select('id')
    expect(data ?? []).toHaveLength(0)
  })
})
