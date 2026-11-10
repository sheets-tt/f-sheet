import { describe, expect, it } from 'vitest'
import { escalaGrafica, proyectar } from './geo'

const LAGO = { lat: 19.421, lon: -99.1825 }
const CALZADA = { lat: 19.422, lon: -99.184 }

describe('proyectar', () => {
  it('pone el norte arriba y el este a la derecha', () => {
    const p = proyectar([LAGO, CALZADA], { ancho: 1000, alto: 600, margen: 50 })
    const lago = p.punto(LAGO)
    const calzada = p.punto(CALZADA)
    expect(calzada.y).toBeLessThan(lago.y) // calzada está más al norte
    expect(calzada.x).toBeLessThan(lago.x) // y más al oeste
  })

  it('conserva la proporción: un metro mide lo mismo en x que en y', () => {
    const p = proyectar([LAGO, CALZADA], { ancho: 1000, alto: 600, margen: 50 })
    const norte = p.punto({ lat: LAGO.lat + 100 / 110_574, lon: LAGO.lon })
    const este = p.punto({ lat: LAGO.lat, lon: LAGO.lon + 100 / (111_320 * Math.cos((LAGO.lat * Math.PI) / 180)) })
    const lago = p.punto(LAGO)
    expect(lago.y - norte.y).toBeCloseTo(este.x - lago.x, 1)
    expect(lago.y - norte.y).toBeCloseTo(p.metros(100), 1)
  })

  it('todo queda dentro del margen', () => {
    const p = proyectar([LAGO, CALZADA], { ancho: 1000, alto: 600, margen: 50 })
    for (const q of [p.punto(LAGO), p.punto(CALZADA)]) {
      expect(q.x).toBeGreaterThanOrEqual(50 - 1e-9)
      expect(q.x).toBeLessThanOrEqual(950 + 1e-9)
      expect(q.y).toBeGreaterThanOrEqual(50 - 1e-9)
      expect(q.y).toBeLessThanOrEqual(550 + 1e-9)
    }
  })

  it('incluye el radio de las zonas en el encuadre', () => {
    const p = proyectar([{ ...LAGO, radioMetros: 300 }], { ancho: 1000, alto: 600, margen: 50 })
    expect(p.punto(LAGO).y - p.metros(300)).toBeGreaterThanOrEqual(50 - 1e-9)
  })

  it('un solo punto sin radio usa un encuadre mínimo y queda centrado', () => {
    const p = proyectar([LAGO], { ancho: 1000, alto: 600, margen: 50 })
    expect(p.punto(LAGO)).toEqual({ x: 500, y: 300 })
    expect(Number.isFinite(p.metros(1))).toBe(true)
  })
})

describe('escalaGrafica', () => {
  it('elige una longitud redonda cercana a la quinta parte del ancho útil', () => {
    expect(escalaGrafica(1, 900)).toEqual({ metros: 200, ancho: 200 })
    expect(escalaGrafica(0.5, 900)).toEqual({ metros: 500, ancho: 250 })
    expect(escalaGrafica(4, 900)).toEqual({ metros: 50, ancho: 200 })
  })
})
