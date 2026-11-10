import { describe, expect, it } from 'vitest'
import { hrefDe, parseRoute } from './router'

describe('rutas por hash', () => {
  it('reconoce cada pantalla', () => {
    expect(parseRoute('#/login')).toBe('login')
    expect(parseRoute('#/')).toBe('resumen')
    expect(parseRoute('')).toBe('resumen')
    expect(parseRoute('#/mapa')).toBe('mapa')
    expect(parseRoute('#/analisis')).toBe('analisis')
    expect(parseRoute('#/admin')).toBe('admin')
  })

  it('una ruta desconocida cae en el resumen', () => {
    expect(parseRoute('#/nada')).toBe('resumen')
  })

  it('hrefDe es el inverso de parseRoute', () => {
    for (const r of ['login', 'resumen', 'mapa', 'analisis', 'admin'] as const) {
      expect(parseRoute(hrefDe(r))).toBe(r)
    }
  })
})
