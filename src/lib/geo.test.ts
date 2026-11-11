import { describe, expect, it } from 'vitest'
import { circulo, distanciaMetros, formatCoordenadas, limitesDe, type LngLat } from './geo'

const LAGO: LngLat = [-99.1825, 19.421]
const CALZADA: LngLat = [-99.184, 19.422]

describe('circulo', () => {
  it('es un anillo cerrado con todos sus puntos al radio pedido', () => {
    const anillo = circulo(LAGO, 50, 32)
    expect(anillo).toHaveLength(33)
    expect(anillo[0]).toEqual(anillo[32])
    for (const p of anillo) expect(distanciaMetros(LAGO, p)).toBeCloseTo(50, 0)
  })
})

describe('limitesDe', () => {
  it('sin puntos no hay encuadre', () => {
    expect(limitesDe([])).toBeNull()
  })

  it('contiene todos los puntos y el radio completo de las zonas', () => {
    const [[oeste, sur], [este, norte]] = limitesDe([
      { lon: LAGO[0], lat: LAGO[1], radioMetros: 50 },
      { lon: CALZADA[0], lat: CALZADA[1] },
    ])!
    expect(oeste).toBeLessThanOrEqual(CALZADA[0])
    expect(norte).toBeGreaterThanOrEqual(CALZADA[1])
    // El círculo del lago (50 m) entra completo por el este y por el sur.
    expect(distanciaMetros(LAGO, [este, LAGO[1]])).toBeGreaterThanOrEqual(49.5)
    expect(distanciaMetros(LAGO, [LAGO[0], sur])).toBeGreaterThanOrEqual(49.5)
  })

  it('un solo punto queda centrado en un encuadre mínimo de 120 m', () => {
    const [[oeste, sur], [este, norte]] = limitesDe([{ lon: LAGO[0], lat: LAGO[1] }])!
    expect((oeste + este) / 2).toBeCloseTo(LAGO[0], 9)
    expect((sur + norte) / 2).toBeCloseTo(LAGO[1], 9)
    expect(distanciaMetros([oeste, LAGO[1]], [este, LAGO[1]])).toBeCloseTo(120, 0)
    expect(distanciaMetros([LAGO[0], sur], [LAGO[0], norte])).toBeCloseTo(120, 0)
  })
})

describe('formatCoordenadas', () => {
  it('usa hemisferios en vez de signos', () => {
    expect(formatCoordenadas(19.4205, -99.1818)).toBe('19.42050° N, 99.18180° O')
    expect(formatCoordenadas(-33.5, 151.2)).toBe('33.50000° S, 151.20000° E')
  })
})
