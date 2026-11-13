import { describe, expect, it } from 'vitest'
import { ANALISIS, ARBOLES, ZONAS } from '../test/backend'
import type { Analisis } from './api'
import { accesos, atencion, LIMITE_ANALISIS, cambio, hrefDetalle, indicadoresPeriodo, lugaresInfestados, recientes } from './resumen'

describe('necesita tu atención', () => {
  it('cuenta sobre los más recientes y enlaza a Análisis ya filtrado', () => {
    const a = atencion(ANALISIS, 1) // 1 error de sincronización en /estadisticas
    expect(a.total).toBe(3)
    expect(a.base).toBe(5)
    expect(a.hrefTodos).toBe('#/analisis?atencion=1')
    expect(a.puntos.map((p) => [p.clave, p.n, p.href])).toEqual([
      ['infestado', 2, '#/analisis?caja_resultado=infestado'],
      ['baja', 1, '#/analisis?caja_confianza=baja'],
      ['no_determinado', 1, '#/analisis?caja_resultado=no_determinado'],
      ['error', 1, '#/analisis?estado=error'],
    ])
  })

  it('solo mira los 100 más recientes (lo que muestra Análisis por defecto)', () => {
    const muchos: Analisis[] = Array.from({ length: 150 }, (_, i) => ({ ...ANALISIS[0], id: `x${i}`, resultadoClasificacion: i < 100 ? 'sano' : 'infestado' }))
    expect(atencion(muchos).base).toBe(100)
    expect(atencion(muchos).puntos[0].n).toBe(0)
  })

  it('árboles y zonas cuyo último análisis salió infestado, del más reciente al más antiguo', () => {
    expect(lugaresInfestados(ARBOLES, ZONAS).map((l) => [l.nombre, l.href])).toEqual([
      ['Zona calzada', '#/zona/c2'],
      ['Oyamel del lago', '#/arbol/b1'],
    ])
  })
})

describe('indicadores de los últimos 7 días', () => {
  it('sin periodo previo no hay cambio que mostrar', () => {
    const ind = indicadoresPeriodo(ANALISIS)!
    expect(ind).toMatchObject({ desde: '2026-10-02', hasta: '2026-10-08', ultimaCaptura: '2026-10-08T11:00:00Z' })
    expect(ind.analisis).toEqual({ valor: 5, previo: null })
    expect(ind.pctInfestado.valor).toBeCloseTo(0.4)
    expect(ind.lugares.valor).toBe(4)
    expect(cambio(ind.analisis, 'cuenta')).toBeNull()
    expect(indicadoresPeriodo([])).toBeNull()
  })

  it('compara con los 7 días anteriores', () => {
    // Dos análisis sanos una semana antes.
    const previos = ANALISIS.slice(2, 4).map((a, i) => ({ ...a, id: `p${i}`, fechaCaptura: `2026-09-2${8 + i}T18:00:00Z`, resultadoClasificacion: 'sano' as const }))
    const ind = indicadoresPeriodo([...ANALISIS, ...previos])!
    expect(ind.analisis).toEqual({ valor: 5, previo: 2 })
    expect(cambio(ind.analisis, 'cuenta')).toBe('+3 contra los 7 días previos')
    expect(cambio(ind.pctInfestado, 'fraccion')).toBe('+40 pts contra los 7 días previos')
    expect(cambio({ valor: 0.5, previo: 0.7 }, 'fraccion')).toBe('−20 pts contra los 7 días previos')
    expect(cambio({ valor: 2, previo: 2 }, 'cuenta')).toBe('igual que los 7 días previos')
  })
})

describe('accesos y actividad', () => {
  const base = { arboles: 3, zonas: 2, analisis: 5, atencion: 3, ultimoInfestado: lugaresInfestados(ARBOLES, ZONAS)[0] }

  it('en orden de prioridad; Administración solo para administradores', () => {
    expect(accesos({ ...base, esAdmin: false }).map((a) => a.titulo)).toEqual(['Mapa', 'Análisis', 'Gráficos', 'Seguimiento de Zona calzada'])
    const admin = accesos({ ...base, esAdmin: true })
    expect(admin.map((a) => a.ruta)).toEqual(['mapa', 'analisis', 'graficos', 'seguimiento', 'admin'])
    expect(admin[0].descripcion).toBe('3 árboles y 2 zonas con su último resultado')
    expect(admin[1].descripcion).toBe('5 análisis, 3 requieren atención')
    expect(admin[3].href).toBe('#/zona/c2')
  })

  it('sin datos todavía, descripciones sin cifras y sin seguimiento', () => {
    const l = accesos({ arboles: null, zonas: null, analisis: null, atencion: null, ultimoInfestado: null, esAdmin: false })
    expect(l.map((a) => a.ruta)).toEqual(['mapa', 'analisis', 'graficos'])
  })

  it('los más recientes enlazan a su detalle en Análisis', () => {
    expect(recientes(ANALISIS).map((a) => a.id)).toEqual(['e5', 'e4', 'e2', 'e3', 'e1'])
    expect(hrefDetalle(ANALISIS[0])).toBe('#/analisis?detalle=e5')
  })
})

describe('QA del dashboard', () => {
  it('D1: los errores de sincronización usan la cifra global (también fuera de los 100)', () => {
    const muchos: Analisis[] = Array.from({ length: 150 }, (_, i) => ({ ...ANALISIS[2], id: `x${i}`, estadoSincronizacion: i < 100 ? 'sincronizado' : 'error' }))
    expect(atencion(muchos).puntos[3]).toMatchObject({ n: 0, href: null })
    expect(atencion(muchos, 50).puntos[3]).toMatchObject({ n: 50, href: '#/analisis?estado=error' })
  })

  it('indicadores: con el límite alcanzado no se compara contra un periodo recortado', () => {
    const previos = ANALISIS.slice(2, 4).map((a, i) => ({ ...a, id: `p${i}`, fechaCaptura: `2026-09-2${8 + i}T18:00:00Z` }))
    const todos = [...ANALISIS, ...previos]
    expect(indicadoresPeriodo(todos, 500)!.incompleto).toBeNull()
    // Con 7 de 7 (límite alcanzado) y lo más antiguo el 28 sept: los 7 días previos (25 sept–1 oct) pueden faltar.
    const ind = indicadoresPeriodo(todos, todos.length)!
    expect(ind.incompleto).toBe('previo')
    expect(ind.analisis.previo).toBeNull()
    expect(indicadoresPeriodo(ANALISIS, ANALISIS.length)!.incompleto).toBe('actual')
  })

  it('accesos: con más de 100 cargados, Análisis dice "los 100 más recientes"', () => {
    const a = accesos({ arboles: 3, zonas: 2, analisis: 500, atencion: 7, ultimoInfestado: null, esAdmin: false })
    expect(a[1].descripcion).toBe(`Los ${LIMITE_ANALISIS} más recientes, 7 requieren atención`)
  })
})

describe('re-QA del dashboard', () => {
  const en = (fecha: string, id: string): Analisis => ({ ...ANALISIS[2], id, fechaCaptura: fecha })

  it('T1: el día más antiguo cargado puede venir a medias (>=)', () => {
    // Periodo actual: 2–8 oct; previo: 25 sept–1 oct.
    const conPrevioDesde = [...ANALISIS, en('2026-09-25T18:00:00Z', 'p0')]
    expect(indicadoresPeriodo(conPrevioDesde, conPrevioDesde.length)!.incompleto).toBe('previo')
    const conDesde = [...ANALISIS, en('2026-10-02T18:00:00Z', 'p1')]
    expect(indicadoresPeriodo(conDesde, conDesde.length)!.incompleto).toBe('actual')
    // Sin llegar al límite, no se marca.
    expect(indicadoresPeriodo(conPrevioDesde, 500)!.incompleto).toBeNull()
  })

  it('T1, el caso de QA: 301 en el periodo + 199 del primer día del previo (de 250) no dan "+102"', () => {
    const actuales = Array.from({ length: 301 }, (_, i) => en(`2026-10-0${3 + (i % 6)}T18:00:00Z`, `a${i}`))
    const previos = Array.from({ length: 199 }, (_, i) => en('2026-09-25T18:00:00Z', `p${i}`))
    const ind = indicadoresPeriodo([...actuales, ...previos], 500)!
    expect(ind.incompleto).toBe('previo')
    expect(ind.analisis).toEqual({ valor: 301, previo: null })
    expect(cambio(ind.analisis, 'cuenta')).toBeNull()
  })

  it('T2: sin /estadisticas, los errores se cuentan sobre los recientes, se dice así y no se enlazan', () => {
    const punto = atencion(ANALISIS).puntos[3]
    expect(punto).toMatchObject({ n: 1, href: null, descripcion: 'No llegaron bien desde el móvil (de los 5 más recientes)' })
  })
})

