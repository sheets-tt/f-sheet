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
  certezaDe,
  motivosAtencion,
  nivelConfianza,
  respaldoDiagnostico,
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
    expect(motivosAtencion(e('e5'))).toEqual(['Infestado', 'Error al enviar desde el móvil'])
    // e4 es follaje: su diagnóstico sale del color, así que su «confianza» (42 %) no cuenta como certeza baja.
    expect(motivosAtencion(e('e4'))).toEqual(['Sin diagnóstico claro'])
    expect(motivosAtencion({ ...e('e4'), tipoImagen: 'corteza' })).toEqual(['Sin diagnóstico claro', 'Certeza baja'])
    expect(motivosAtencion(e('e2'))).toEqual([])
  })

  it('conteos de las cajas', () => {
    expect(conteosCajas(ANALISIS)).toEqual({
      total: 5,
      resultado: { sano: 2, infestado: 2, no_determinado: 1 },
      tipo: { corteza: 2, follaje: 3 },
      // Solo corteza (e1, e2): el follaje no tiene certeza del diagnóstico.
      confianza: { alta: 2, media: 0, baja: 0, sin: 0 },
      // Por más análisis (empate: por nombre); «Autor no registrado» (e5) al final.
      autores: [
        { id: 'a1', nombre: 'Usuario Demo', n: 3 },
        { id: 'a4', nombre: 'Experta de Campo Demo', n: 1 },
        { id: 'sin', nombre: null, n: 1 },
      ],
      atencion: 3,
    })
  })

  it('la certeza solo aplica a corteza; el follaje se diagnostica por su color', () => {
    const e = (id: string) => ANALISIS.find((a) => a.id === id)!
    expect(certezaDe(e('e1'))).toBe(0.91)
    expect(certezaDe(e('e3'))).toBeNull()
    // Elegir una caja de certeza deja fuera al follaje.
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, confianza: ['alta'] }))).toEqual(['e2', 'e1'])
  })

  it('el respaldo del diagnóstico: certeza en corteza, porcentajes de color en follaje', () => {
    const e = (id: string) => ANALISIS.find((a) => a.id === id)!
    expect(respaldoDiagnostico(e('e1'))).toBe('certeza alta (91 %)')
    expect(respaldoDiagnostico({ ...e('e1'), confianza: null })).toBe('certeza sin dato')
    expect(respaldoDiagnostico(e('e3'))).toBe('color: 80 % sano · 10 % regular · 5 % dañado · 5 % incierto')
    expect(respaldoDiagnostico({ ...e('e3'), cromatico: { pctSano: 62.5, pctRegular: 37.5, pctDanado: 0, pctIncierto: 0 } })).toBe(
      'color: 62.5 % sano · 37.5 % regular',
    )
    expect(respaldoDiagnostico(e('e5'))).toBe('sin datos de color') // follaje sin análisis de color: su 77 % no se muestra
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
      cajas: { resultado: ['sano' as const, 'infestado' as const], tipo: [], confianza: ['baja' as const], autor: [], atencion: true },
      vista: 'tarjetas' as const,
      agrupar: 'lugar' as const,
      detalle: null,
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
      detalle: null,
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
      ['Sin diagnóstico claro', 1],
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


describe('cajas por quién subió la foto', () => {
  it('filtran por autor, «sin» junta los análisis sin autor registrado', () => {
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, autor: ['a4'] }))).toEqual(['e4'])
    expect(ids(filtrarCajas(ANALISIS, { ...CAJAS_VACIAS, autor: ['a4', 'sin'] }))).toEqual(['e5', 'e4'])
  })

  it('se guardan en la URL sin repetir y en orden fijo', () => {
    const e = leerEstado('caja_autor=a2,a1,a2,,')
    expect(e.cajas.autor).toEqual(['a1', 'a2'])
    expect(escribirEstado(e).toString()).toBe('caja_autor=a1%2Ca2')
  })
})
