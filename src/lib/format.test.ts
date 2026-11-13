import { describe, expect, it } from 'vitest'
import { finDelDia, formatFecha, formatPorcentaje, haceCuanto, inicioDelDia, ETIQUETA_RESULTADO } from './format'

describe('fechas (hora del centro de México, UTC−6 sin horario de verano)', () => {
  it('formatFecha muestra fecha y hora locales', () => {
    expect(formatFecha('2026-10-08T11:00:00Z')).toBe('8 oct 2026, 05:00')
  })

  it('formatFecha tolera null', () => {
    expect(formatFecha(null)).toBe('Sin fecha')
  })

  it('los filtros por día cubren el día completo en hora local', () => {
    expect(inicioDelDia('2026-10-04')).toBe('2026-10-04T06:00:00.000Z')
    expect(finDelDia('2026-10-07')).toBe('2026-10-08T05:59:59.999Z')
  })

  it('un día vacío no filtra', () => {
    expect(inicioDelDia('')).toBeUndefined()
    expect(finDelDia('')).toBeUndefined()
  })
})

describe('números y etiquetas', () => {
  it('formatPorcentaje redondea sin decimales innecesarios', () => {
    expect(formatPorcentaje(0.91)).toBe('91 %')
    expect(formatPorcentaje(0.425)).toBe('42.5 %')
    expect(formatPorcentaje(null)).toBe('—')
  })

  it('etiquetas en lenguaje de campo', () => {
    expect(ETIQUETA_RESULTADO.no_determinado).toBe('No determinado')
  })
})

describe('haceCuanto', () => {
  const ahora = new Date('2026-11-10T18:00:00Z').getTime()
  it('dice el tiempo transcurrido en palabras', () => {
    expect(haceCuanto('2026-11-10T08:00:00Z', ahora)).toBe('hoy')
    expect(haceCuanto('2026-11-09T12:00:00Z', ahora)).toBe('ayer')
    expect(haceCuanto('2026-11-02T18:00:00Z', ahora)).toBe('hace 8 días')
    expect(haceCuanto('2026-08-10T18:00:00Z', ahora)).toBe('hace 3 meses')
    expect(haceCuanto('2024-11-10T18:00:00Z', ahora)).toBe('hace 2 años')
  })
})

describe('inicioDelDia / finDelDia con fechas inválidas', () => {
  it('no lanzan: devuelven undefined', async () => {
    const { inicioDelDia, finDelDia } = await import('./format')
    for (const d of ['2026-13-45', '2026-10-32', '9999-99-99', '2026-02-30']) {
      expect(inicioDelDia(d)).toBeUndefined()
      expect(finDelDia(d)).toBeUndefined()
    }
    expect(inicioDelDia('2026-10-04')).toBe('2026-10-04T06:00:00.000Z')
  })
})

