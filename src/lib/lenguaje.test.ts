import { describe, expect, it } from 'vitest'
import { ANALISIS } from '../test/backend'
import { seguimientoDe } from './analisis'
import {
  ETIQUETA_CERTEZA,
  ETIQUETA_ENVIO,
  ETIQUETA_RESULTADO,
  etiquetaDispositivo,
  fraseResultado,
  fraseSeguimiento,
  observacionesDe,
  partesFollaje,
  queHacer,
  RANGO_CERTEZA,
  subidoPor,
  TITULO_CERTEZA,
  TITULO_ENVIO,
  TITULO_FOLLAJE,
} from './lenguaje'

// Palabras de ingeniería que no deben llegar a la pantalla principal (solo al «Detalle técnico»).
const JERGA = /modelo|clasificaci|confianza|crom[aá]tic|sincroniz|inferencia|pct_|no determinado/i

describe('lenguaje para agrónomos', () => {
  it('ningún texto visible usa jerga técnica', () => {
    const textos = [
      ...Object.values(ETIQUETA_RESULTADO),
      ...Object.values(ETIQUETA_CERTEZA),
      ...Object.values(RANGO_CERTEZA),
      ...Object.values(ETIQUETA_ENVIO),
      TITULO_CERTEZA,
      TITULO_ENVIO,
      TITULO_FOLLAJE,
      ...(['sano', 'infestado', 'no_determinado'] as const).flatMap((r) => [
        fraseResultado(r),
        ...(['alta', 'media', 'baja', 'sin'] as const).flatMap((n) => [queHacer(r, n, 'arbol'), queHacer(r, n, 'zona'), queHacer(r, n, null)]),
      ]),
    ]
    for (const t of textos) expect(t).not.toMatch(JERGA)
  })

  it('el resultado se dice con lo que significa', () => {
    expect(fraseResultado('sano')).toBe('Sano: sin señales de descortezador')
    expect(fraseResultado('infestado')).toBe('Infestado: señales de descortezador')
    expect(fraseResultado('no_determinado')).toBe('Sin diagnóstico claro: conviene repetir la foto')
  })

  it('qué hacer según el resultado, la certeza y el lugar', () => {
    expect(queHacer('infestado', 'alta', 'arbol')).toBe('Inspecciona el árbol en campo, márcalo y avisa al responsable de sanidad forestal.')
    expect(queHacer('infestado', 'alta', 'zona')).toMatch(/^Recorre la zona en campo/)
    expect(queHacer('infestado', 'baja', 'arbol')).toMatch(/confírmalo en campo antes de tomar medidas\.$/)
    expect(queHacer('no_determinado', 'alta', 'arbol')).toMatch(/^Repite la foto con buena luz/)
    expect(queHacer('sano', 'alta', 'arbol')).toBe('Sigue con el monitoreo de costumbre.')
    expect(queHacer('sano', 'baja', 'arbol')).toMatch(/conviene repetir la foto para confirmarlo\.$/)
  })

  it('quién subió la foto y sus observaciones', () => {
    expect(subidoPor({ autor: { id: 'a1', nombre: 'Usuario Demo' } })).toBe('Subido por Usuario Demo')
    expect(subidoPor({ autor: null })).toBe('Autor no registrado')
    expect(subidoPor({})).toBe('Autor no registrado') // backend anterior: sin el campo
    expect(observacionesDe({ observaciones: '  Galerías visibles \n' })).toBe('Galerías visibles')
    expect(observacionesDe({ observaciones: '   ' })).toBeNull()
    expect(observacionesDe({ observaciones: null })).toBeNull()
    expect(etiquetaDispositivo({ id: 'd1', nombre: 'Google Pixel 7 Pro', codigo: 'b71f' })).toBe('Google Pixel 7 Pro · b71f')
    expect(etiquetaDispositivo({ id: 'd2', nombre: 'Pixel 7 Pro', codigo: null })).toBe('Pixel 7 Pro')
    expect(etiquetaDispositivo(null)).toBeNull()
  })

  it('cuántas personas le dan seguimiento', () => {
    expect(fraseSeguimiento(2, 'arbol')).toBe('2 personas le dan seguimiento a este árbol')
    expect(fraseSeguimiento(3, 'zona')).toBe('3 personas le dan seguimiento a esta zona')
  })

  it('el color del follaje conserva los colores de estado', () => {
    expect(partesFollaje({ pctSano: 30, pctRegular: 20, pctDanado: 10, pctIncierto: 40 }).map((p) => `${p.etiqueta} ${p.valor} ${p.color}`)).toEqual([
      'Sano 30 c-sano',
      'Regular 20 c-regular',
      'Dañado 10 c-infestado',
      'Incierto 40 c-neutro',
    ])
  })
})

describe('quién le da seguimiento (sin el dato del backend)', () => {
  it('usa la lista del backend si llega, aunque esté vacía', () => {
    expect(seguimientoDe([], ANALISIS)).toEqual([])
  })

  it('si no llega, la arma con los autores de los análisis cargados (el más reciente primero)', () => {
    const c1 = ANALISIS.filter((a) => a.idZona === 'c1')
    expect(seguimientoDe(undefined, c1)).toEqual([
      { id: 'a4', nombre: 'Experta de Campo Demo', analisis: 1, ultimo: '2026-10-07T09:00:00Z' },
      { id: 'a1', nombre: 'Usuario Demo', analisis: 1, ultimo: '2026-10-04T12:00:00Z' },
    ])
    // e5 no tiene autor: no cuenta.
    expect(seguimientoDe(undefined, ANALISIS.filter((a) => a.idZona === 'c2'))).toEqual([])
  })
})
