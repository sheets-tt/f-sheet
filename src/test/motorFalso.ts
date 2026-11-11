import type { Coleccion, Motor, OpcionesMotor } from '../lib/motorMapa'
import type { Limites, LngLat } from '../lib/geo'

/**
 * Motor de mapa para jsdom (no hay WebGL): pone los marcadores como hijos del contenedor y anota lo
 * que la pantalla le pide. Lo carga src/test/setup.ts en lugar de src/lib/motorMapa.ts.
 */
export interface Registro {
  opciones: OpcionesMotor
  zonas: Coleccion | null
  capturas: Coleccion | null
  resaltado: Record<'zonas' | 'capturas', string | null>
  vuelos: LngLat[]
  encuadres: Limites[]
  oscuro: boolean
}

export const motores: Registro[] = []

export function soportaWebGL(): boolean {
  return true
}

export async function crearMotor(contenedor: HTMLElement, opciones: OpcionesMotor): Promise<Motor> {
  const r: Registro = {
    opciones,
    zonas: null,
    capturas: null,
    resaltado: { zonas: null, capturas: null },
    vuelos: [],
    encuadres: [],
    oscuro: opciones.oscuro,
  }
  motores.push(r)
  return {
    marcador(el, lngLat) {
      el.dataset.lngLat = lngLat.join(',')
      contenedor.appendChild(el)
      return () => el.remove()
    },
    zonas: (d) => void (r.zonas = d),
    capturas: (d) => void (r.capturas = d),
    resaltar: (capa, clave) => void (r.resaltado[capa] = clave),
    encuadrar: (l) => void r.encuadres.push(l),
    volarA: (p) => void r.vuelos.push(p),
    tema: (o) => void (r.oscuro = o),
    destruir: () => void motores.splice(motores.indexOf(r), 1),
  }
}
