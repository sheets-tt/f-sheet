import { describe, expect, it } from 'vitest'
import { anchoTexto, recortarAlAncho } from './comunes'

// En jsdom no hay OffscreenCanvas: el ancho se estima en 7 px por carácter.
describe('recortarAlAncho', () => {
  it('no toca lo que cabe', () => {
    expect(recortarAlAncho('Oyamel del lago', 200)).toBe('Oyamel del lago')
  })

  it('recorta por el medio y conserva el final que distingue nombres parecidos', () => {
    const a = recortarAlAncho('Pino del cerro número 3', 84)
    const b = recortarAlAncho('Pino del cerro número 6', 84)
    expect(a).not.toBe(b)
    expect(a).toMatch(/…ero 3$/)
    expect(anchoTexto(a)).toBeLessThanOrEqual(84)
  })

  it('conserva la última palabra si es corta', () => {
    const t = recortarAlAncho('Ahuehuete de la calzada', 112)
    expect(t).toMatch(/^Ahuehuete?.*…calzada$/)
    expect(anchoTexto(t)).toBeLessThanOrEqual(112)
  })

  it('nunca devuelve algo más ancho que el espacio', () => {
    for (const px of [7, 20, 40, 60]) expect(anchoTexto(recortarAlAncho('Zona del lago menor número 12', px))).toBeLessThanOrEqual(Math.max(px, 7))
  })
})
