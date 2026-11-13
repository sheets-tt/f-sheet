import { describe, expect, it } from 'vitest'
import { ANALISIS } from '../test/backend'
import {
  agrupar,
  alternar,
  CAJAS_VACIAS,
  claveDiaCdmx,
  conteosCajas,
  escribirEstado,
  filtrarCajas,
  FORM_VACIO,
  leerEstado,
  motivosAtencion,
  nivelConfianza,
  RESULTADOS,
  vecinos,
} from './analisis'

const nombres = new Map([
  ['arbol:b1', 'Oyamel del lago'],
  ['arbol:b2', 'Ahuehuete de la calzada'],
  ['zona:c1', 'Zona lago menor'],
  ['zona:c2', 'Zona calzada'],
])
const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe('categorías', () => {
  it('niveles de confianza', () => {
    expect([0.95, 0.8, 0.79, 0.5, 0.49, 0, null].map(nivelConfianza)).toEqual(['alta', 'alta', 'media', 'media', 'baja', 'baja', 'sin'])
  })

  it('"requieren atención" con sus motivos', () => {
    const e = (id: string) => ANALISIS.find((a) => a.id === id)!
    expect(motivosAtencion(e('e5'))).toEqual(['Infestado', 'Error de sincronización'])
    expect(motivosAtencion(e('e4'))).toEqual(['No determinado', 'Confianza baja'])
    expect(motivosAtencion(e('e2'))).toEqual([])
  })

  it('conteos de las cajas', () => {
    expect(conteosCajas(ANALISIS)).toEqual({
      total: 5,
      resultado: { sano: 2, infestado: 2, no_determinado: 1 },
      tipo: { corteza: 2, follaje: 3 },
      confianza: { alta: 3, media: 1, baja: 1, sin: 0 },
      atencion: 3,
    })
  })

  it('dentro de un grupo suman; entre grupos se cruzan', () => {
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, resultado: ['sano', 'no_determinado'] }))).toEqual(['e4', 'e2', 'e3'])
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, resultado: ['sano', 'no_determinado'], tipo: ['follaje'] }))).toEqual(['e4', 'e3'])
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, confianza: ['alta'], atencion: true }))).toEqual(['e1'])
    expect(alternar(['infestado'], 'sano', RESULTADOS)).toEqual(['sano', 'infestado'])
    expect(alternar(['sano', 'infestado'], 'sano', RESULTADOS)).toEqual(['infestado'])
  })
})

describe('estado en la URL', () => {
  it('ida y vuelta con orden fijo', () => {
    const e = {
      form: { ...FORM_VACIO, tipo: 'follaje' as const, desde: '2026-10-04' },
      cajas: { resultado: ['sano' as const, 'infestado' as const], tipo: [], confianza: ['baja' as const], atencion: true },
      vista: 'tarjetas' as const,
      agrupar: 'lugar' as const,
    }
    const qs = escribirEstado(e).toString()
    expect(qs).toBe('desde=2026-10-04&tipo=follaje&caja_resultado=sano%2Cinfestado&caja_confianza=baja&atencion=1&vista=tarjetas&agrupar=lugar')
    expect(leerEstado(qs)).toEqual(e)
  })

  it('ignora valores inválidos', () => {
    expect(leerEstado('tipo=x&caja_resultado=x,sano,sano&vista=lista&agrupar=mes&desde=ayer')).toEqual({
      form: FORM_VACIO,
      cajas: { ...CAJAS_VACIAS, resultado: ['sano'] },
      vista: null,
      agrupar: 'nada',
    })
  })
})

describe('agrupación y vecinos', () => {
  it('por árbol o zona, de más a menos análisis', () => {
    const g = agrupar(ANALISIS, 'lugar', nombres)
    expect(g.map((x) => [x.titulo, x.analisis.length])).toEqual([
      ['Zona lago menor', 2],
      ['Ahuehuete de la calzada', 1],
      ['Oyamel del lago', 1],
      ['Zona calzada', 1],
    ])
    expect(g[0].lugar).toEqual({ tipo: 'zona', id: 'c1' })
    expect(g[0].atencion).toBe(1)
  })

  it('por resultado en su orden y por día del más reciente', () => {
    expect(agrupar(ANALISIS, 'resultado', nombres).map((x) => [x.titulo, x.analisis.length])).toEqual([
      ['Sano', 2],
      ['Infestado', 2],
      ['No determinado', 1],
    ])
    const dias = agrupar(ANALISIS, 'dia', nombres)
    expect(dias.map((x) => x.clave)).toEqual(['2026-10-08', '2026-10-07', '2026-10-06', '2026-10-04', '2026-10-03'])
    expect(dias[0].titulo).toBe('Jueves, 8 de octubre de 2026')
    expect(claveDiaCdmx('2026-10-04T05:00:00Z')).toBe('2026-10-03')
  })

  it('anterior y siguiente del mismo lugar', () => {
    const e3 = ANALISIS.find((a) => a.id === 'e3')!
    const e4 = ANALISIS.find((a) => a.id === 'e4')!
    expect(vecinos(ANALISIS, e3)).toEqual({ anterior: null, siguiente: e4 })
    expect(vecinos(ANALISIS, e4)).toEqual({ anterior: e3, siguiente: null })
  })
})

describe('fechas inválidas y bordes de confianza (A1–A3)', () => {
  it.each(['2026-13-45', '2026-10-32', '9999-99-99', '2026-02-30', 'ayer'])('ignora desde/hasta = %s', (d) => {
    expect(leerEstado(`desde=${d}&hasta=${d}`).form).toEqual(FORM_VACIO)
  })

  it('clasifica la confianza como se muestra (redondeada a una décima)', () => {
    expect(nivelConfianza(0.79999)).toBe('alta') // se ve "80 %"
    expect(nivelConfianza(0.7994)).toBe('media') // se ve "79.9 %"
    expect(nivelConfianza(0.49999)).toBe('media') // se ve "50 %"
    expect(nivelConfianza(0.4994)).toBe('baja') // se ve "49.9 %"
  })
})

