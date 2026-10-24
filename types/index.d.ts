// Contrato de estado del mod de Masterplan (valores que dibujan el panel y la banda).

export type MasterplanSesion = {
  id: string
  fase: number
  ola?: number
  nombre?: string
  visto: number
}

export type MasterplanMensaje = {
  id: string
  de: string
  deFase?: number
  para: string
  texto: string
  fecha: number
  leidoPor: string[]
}

export type MasterplanResumen = {
  proyecto: string
  raiz: string
  fase: number
  faseNombre: string
  tareasHechas: number
  tareasTotal: number
  siguiente?: string
  sesiones: MasterplanSesion[]
  sinLeer: number
}

declare module 'claude-code' {
  interface PluginState {
    masterplan: {
      resumen: MasterplanResumen | null
      bandaOculta: boolean
    }
  }
}
