import { describe, expect, it } from 'vitest'
import { ANALISIS, ARBOLES, ZONAS } from '../test/backend'
import {
  aPared,
  claveDia,
  decenaConfianza,
  diaAPared,
  dominioDatos,
  dominioVisible,
  escribirFiltros,
  filtrar,
  histogramaConfianza,
  indicadores,
  intervaloPara,
  leerFiltros,
  mapaCalor,
  moverDominio,
  nombresDeLugares,
  porLugar,
  rangoDe,
  serieTiempo,
  SIN_FILTROS,
  type Dominio,
} from './graficos'

const dia = (d: string) => diaAPared(d)
const dominio = (a: string, b: string): Dominio => [dia(a), dia(b)]

describe('tiempo en CDMX', () => {
  it('un análisis de las 23:00 en CDMX cuenta en su día, no en el siguiente (UTC)', () => {
    expect(claveDia(aPared('2026-10-04T05:00:00Z'))).toBe('2026-10-03')
    expect(claveDia(aPared('2026-10-04T06:00:00Z'))).toBe('2026-10-04')
  })

  it('el dominio va del primer al último día con datos (incluido)', () => {
    // e1 es el 3 oct 09:10 CDMX; e5 el 8 oct 05:00 CDMX.
    expect(dominioDatos(ANALISIS)).toEqual(dominio('2026-10-03', '2026-10-09'))
    expect(dominioDatos([])).toBeNull()
  })

  it('elige días, semanas o meses según lo acercado', () => {
    expect(intervaloPara(dominio('2026-10-01', '2026-11-30'))).toBe('dia')
    expect(intervaloPara(dominio('2026-01-01', '2026-12-31'))).toBe('semana')
    expect(intervaloPara(dominio('2024-01-01', '2026-12-31'))).toBe('mes')
  })
})

describe('filtros en la URL', () => {
  it('ida y vuelta con orden fijo', () => {
    const f = { ...SIN_FILTROS, desde: '2026-10-04', hasta: '2026-10-06', resultado: 'sano' as const, lugar: { tipo: 'zona' as const, id: 'c1' }, confianza: 8 }
    const qs = escribirFiltros(f).toString()
    expect(qs).toBe('desde=2026-10-04&hasta=2026-10-06&resultado=sano&zona=c1&confianza=8')
    expect(leerFiltros(qs)).toEqual(f)
  })

  it('ignora valores inválidos e intercambia fechas al revés', () => {
    expect(leerFiltros('resultado=x&tipo=y&confianza=12&desde=ayer')).toEqual(SIN_FILTROS)
    expect(leerFiltros('desde=2026-10-07&hasta=2026-10-04')).toMatchObject({ desde: '2026-10-04', hasta: '2026-10-07' })
  })
})

describe('crossfilter', () => {
  const f = { ...SIN_FILTROS, resultado: 'sano' as const, desde: '2026-10-04', hasta: '2026-10-06' }

  it('aplica todos los filtros', () => {
    expect(filtrar(ANALISIS, f).map((a) => a.id)).toEqual(['e2', 'e3'])
  })

  it('una gráfica ignora su propia dimensión', () => {
    expect(filtrar(ANALISIS, f, ['resultado']).map((a) => a.id)).toEqual(['e2', 'e3'])
    expect(filtrar(ANALISIS, f, ['tiempo']).map((a) => a.id)).toEqual(['e2', 'e3'])
    expect(filtrar(ANALISIS, { ...f, desde: null, hasta: null }, ['resultado']).map((a) => a.id)).toEqual(['e5', 'e4', 'e2', 'e3', 'e1'])
  })

  it('por lugar y por decena de confianza', () => {
    expect(filtrar(ANALISIS, { ...SIN_FILTROS, lugar: { tipo: 'zona', id: 'c1' } }).map((a) => a.id)).toEqual(['e4', 'e3'])
    expect(filtrar(ANALISIS, { ...SIN_FILTROS, confianza: 9 }).map((a) => a.id)).toEqual(['e3', 'e1'])
    expect(decenaConfianza(1)).toBe(9)
    expect(decenaConfianza(0.8)).toBe(8)
    expect(decenaConfianza(null)).toBeNull()
  })
})

describe('agregados', () => {
  it('serie por día con los días vacíos', () => {
    const serie = serieTiempo(ANALISIS, dominioDatos(ANALISIS)!, 'dia')
    expect(serie.map((p) => [p.clave, p.total])).toEqual([
      ['2026-10-03', 1],
      ['2026-10-04', 1],
      ['2026-10-05', 0],
      ['2026-10-06', 1],
      ['2026-10-07', 1],
      ['2026-10-08', 1],
    ])
    expect(serie[0]).toMatchObject({ etiqueta: '3 oct 2026', conteos: { sano: 0, infestado: 1, no_determinado: 0 }, confianzaMedia: 0.91 })
  })

  it('serie por semana empieza en lunes', () => {
    const serie = serieTiempo(ANALISIS, dominioDatos(ANALISIS)!, 'semana')
    expect(serie.map((p) => [p.clave, p.total, p.etiqueta])).toEqual([
      ['2026-09-28', 2, 'Semana del 28 sept 2026'],
      ['2026-10-05', 3, 'Semana del 5 oct 2026'],
    ])
  })

  it('histograma de confianza en decenas', () => {
    const { decenas, sinConfianza } = histogramaConfianza(ANALISIS)
    expect(decenas.map((d) => d.total)).toEqual([0, 0, 0, 0, 1, 0, 0, 1, 1, 2])
    expect(decenas[9].conteos).toEqual({ sano: 1, infestado: 1, no_determinado: 0 })
    expect(sinConfianza).toBe(0)
  })

  it('por lugar: todos los árboles y zonas, de más a menos análisis', () => {
    const filas = porLugar(ANALISIS, ARBOLES, ZONAS)
    expect(filas.map((f) => [f.nombre, f.total])).toEqual([
      ['Zona lago menor', 2],
      ['Ahuehuete de la calzada', 1],
      ['Oyamel del lago', 1],
      ['Zona calzada', 1],
      ['Pino del cerro', 0],
    ])
    expect(filas[0].ultimo?.id).toBe('e4')
  })

  it('mapa de calor lugar × día', () => {
    const filas = porLugar(ANALISIS, ARBOLES, ZONAS)
    const serie = serieTiempo(ANALISIS, dominioDatos(ANALISIS)!, 'dia')
    const celdas = mapaCalor(ANALISIS, filas, serie, 'dia')
    // Zona lago menor: e3 el 4 oct y e4 el 7 oct.
    expect(celdas[0].map((c) => c.total)).toEqual([0, 1, 0, 0, 1, 0])
    expect(celdas[3][5].conteos.infestado).toBe(1) // Zona calzada, 8 oct
  })

  it('indicadores de la selección', () => {
    const ind = indicadores(ANALISIS)
    expect(ind).toMatchObject({ total: 5, infestados: 2, pctInfestado: 0.4, lugares: 4 })
    expect(ind.confianzaMedia).toBeCloseTo(0.786)
    expect(nombresDeLugares(ARBOLES, ZONAS).get('zona:c1')).toBe('Zona lago menor')
  })
})

describe('rango', () => {
  const datos = dominio('2026-10-01', '2026-10-31')

  it('el rango que cubre todos los datos es "sin rango"', () => {
    expect(rangoDe(datos, datos)).toEqual({ desde: null, hasta: null })
    expect(rangoDe(dominio('2026-10-04', '2026-10-07'), datos)).toEqual({ desde: '2026-10-04', hasta: '2026-10-06' })
    expect(dominioVisible({ ...SIN_FILTROS, desde: '2026-10-04', hasta: '2026-10-06' }, datos)).toEqual(dominio('2026-10-04', '2026-10-07'))
  })

  it('acercar, alejar y desplazar sin salir de los datos', () => {
    const r = dominio('2026-10-10', '2026-10-20')
    expect(moverDominio(r, datos, 'acercar')).toEqual(dominio('2026-10-12', '2026-10-17'))
    expect(moverDominio(r, datos, 'alejar')).toEqual(dominio('2026-10-05', '2026-10-25'))
    expect(moverDominio(r, datos, 'anterior')).toEqual(dominio('2026-10-01', '2026-10-11'))
    expect(moverDominio(r, datos, 'siguiente')).toEqual(dominio('2026-10-20', '2026-10-30'))
    expect(moverDominio(dominio('2026-10-25', '2026-10-31'), datos, 'siguiente')).toEqual(dominio('2026-10-25', '2026-10-31'))
  })
})
