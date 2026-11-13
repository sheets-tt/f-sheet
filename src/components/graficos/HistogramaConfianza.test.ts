import { describe, expect, it } from 'vitest'
import { anchoTexto } from './comunes'
import { ticksConfianza } from './HistogramaConfianza'

describe('eje x del histograma de confianza', () => {
  it.each([120, 240, 296, 400, 700, 1200])('con %i px útiles las etiquetas no se enciman (≥ 10 px entre ellas)', (util) => {
    const ticks = ticksConfianza(30, util)
    expect(ticks[0]).toEqual({ valor: 0, x: 30 })
    expect(ticks.at(-1)).toEqual({ valor: 100, x: 30 + util })
    for (let i = 1; i < ticks.length; i++) {
      const a = ticks[i - 1]
      const b = ticks[i]
      const hueco = b.x - anchoTexto(String(b.valor)) / 2 - (a.x + anchoTexto(String(a.valor)) / 2)
      expect(hueco).toBeGreaterThanOrEqual(10)
    }
  })

  it('cada 10 si caben, cada 20 si no', () => {
    expect(ticksConfianza(0, 700).map((t) => t.valor)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    expect(ticksConfianza(0, 240).map((t) => t.valor)).toEqual([0, 20, 40, 60, 80, 100])
  })
})
