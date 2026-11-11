import { describe, expect, it } from 'vitest'
import { hrefDe, parseRoute, parseUbicacion } from './router'

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
    expect(parseRoute('#/analisis/x')).toBe('resumen')
  })

  it('hrefDe es el inverso de parseRoute', () => {
    for (const r of ['login', 'resumen', 'mapa', 'analisis', 'admin'] as const) {
      expect(parseRoute(hrefDe(r))).toBe(r)
    }
  })

  it('el seguimiento de un árbol o zona lleva su identificador', () => {
    expect(hrefDe('arbol', 'b0000000-0000-0000-0000-000000000001')).toBe('#/arbol/b0000000-0000-0000-0000-000000000001')
    expect(parseUbicacion('#/arbol/b1')).toEqual({ ruta: 'arbol', id: 'b1' })
    expect(parseUbicacion('#/zona/c1')).toEqual({ ruta: 'zona', id: 'c1' })
  })

  it('sin identificador, el seguimiento no existe', () => {
    expect(parseUbicacion('#/arbol')).toEqual({ ruta: 'resumen', id: null })
  })

  it('el mapa puede abrir con un punto elegido', () => {
    expect(parseUbicacion('#/mapa')).toEqual({ ruta: 'mapa', id: null })
    expect(parseUbicacion(hrefDe('mapa', 'a-b1'))).toEqual({ ruta: 'mapa', id: 'a-b1' })
  })

  it('codifica identificadores raros y no se rompe con uno mal codificado', () => {
    expect(parseUbicacion(hrefDe('arbol', 'a/b c'))).toEqual({ ruta: 'arbol', id: 'a/b c' })
    expect(parseUbicacion('#/arbol/%E0%A4%A')).toEqual({ ruta: 'resumen', id: null })
  })
})
