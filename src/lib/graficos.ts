import { mean } from 'd3-array'
import { utcDay, utcMonday, utcMonth, type CountableTimeInterval } from 'd3-time'
import { timeFormatLocale } from 'd3-time-format'
import type { Analisis, Arbol, Resultado, TipoImagen, Zona } from './api'

// Transformaciones de datos de la sección Gráficos: puras, sin DOM, probadas aparte.
//
// Tiempo: los datos son de CDMX (UTC−6 todo el año, ver format.ts). Cada instante se pasa a su
// "hora de pared" de CDMX como un Date UTC, y ahí se usan los intervalos utc* de d3-time: así un
// análisis de las 23:00 del 3 de octubre en CDMX cae en el 3 y no en el 4, sin importar la zona
// horaria del navegador.

export const RESULTADOS: Resultado[] = ['sano', 'infestado', 'no_determinado']
export const TIPOS: TipoImagen[] = ['corteza', 'follaje']

const OFFSET_CDMX_MS = 6 * 3_600_000

/** Instante ISO → hora de pared de CDMX (como Date UTC). */
export function aPared(iso: string): Date {
  return new Date(Date.parse(iso) - OFFSET_CDMX_MS)
}

/** Date de pared → "2026-10-03". */
export function claveDia(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** "2026-10-03" → inicio de ese día (pared). */
export function diaAPared(dia: string): Date {
  return new Date(`${dia}T00:00:00Z`)
}

const DIA_VALIDO = /^\d{4}-\d{2}-\d{2}$/
function esDia(s: string | null): s is string {
  return !!s && DIA_VALIDO.test(s) && !Number.isNaN(diaAPared(s).getTime())
}

// ---------------------------------------------------------------------------------------------
// Formato de fechas con d3-time-format (es-MX, como el resto de la app: "3 oct 2026")
// ---------------------------------------------------------------------------------------------
const locale = timeFormatLocale({
  dateTime: '%A, %e de %B de %Y, %X',
  date: '%d/%m/%Y',
  time: '%H:%M:%S',
  periods: ['a. m.', 'p. m.'],
  days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  shortDays: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  shortMonths: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
})

export const formatoDia = locale.utcFormat('%-d %b %Y')
const formatoMes = locale.utcFormat('%B de %Y')
const tickDia = locale.utcFormat('%-d %b')
const tickMes = locale.utcFormat('%b %Y')

// ---------------------------------------------------------------------------------------------
// Intervalos de tiempo
// ---------------------------------------------------------------------------------------------
export type Intervalo = 'dia' | 'semana' | 'mes'

export const INTERVALO: Record<Intervalo, CountableTimeInterval> = { dia: utcDay, semana: utcMonday, mes: utcMonth }

/** El detalle sigue al acercamiento: días hasta ~2 meses, semanas hasta ~1 año, meses después. */
export function intervaloPara(dominio: Dominio): Intervalo {
  const dias = utcDay.count(dominio[0], dominio[1])
  if (dias <= 62) return 'dia'
  if (dias <= 400) return 'semana'
  return 'mes'
}

export function etiquetaPeriodo(inicio: Date, intervalo: Intervalo): string {
  if (intervalo === 'dia') return formatoDia(inicio)
  if (intervalo === 'semana') return `Semana del ${formatoDia(inicio)}`
  return formatoMes(inicio).replace(/^./, (c) => c.toUpperCase())
}

export function etiquetaTick(inicio: Date, intervalo: Intervalo): string {
  return intervalo === 'mes' ? tickMes(inicio) : tickDia(inicio)
}

/** [inicio, fin) en hora de pared, siempre en días completos. */
export type Dominio = [Date, Date]

/** Días con datos: del primer día con análisis al último (incluido). null si no hay análisis. */
export function dominioDatos(analisis: Analisis[]): Dominio | null {
  if (!analisis.length) return null
  let min = Infinity
  let max = -Infinity
  for (const a of analisis) {
    const t = aPared(a.fechaCaptura).getTime()
    if (t < min) min = t
    if (t > max) max = t
  }
  return [utcDay.floor(new Date(min)), utcDay.offset(utcDay.floor(new Date(max)), 1)]
}

/** El rango elegido (desde/hasta inclusivos) o, sin rango, todos los datos. */
export function dominioVisible(filtros: Filtros, datos: Dominio): Dominio {
  const d0 = filtros.desde ? diaAPared(filtros.desde) : datos[0]
  const d1 = filtros.hasta ? utcDay.offset(diaAPared(filtros.hasta), 1) : datos[1]
  return d1 > d0 ? [d0, d1] : [d0, utcDay.offset(d0, 1)]
}

/** Dominio → desde/hasta (inclusivos). Si coincide con los datos, sin rango. */
export function rangoDe(dominio: Dominio, datos: Dominio): Pick<Filtros, 'desde' | 'hasta'> {
  const d0 = utcDay.round(dominio[0])
  let d1 = utcDay.round(dominio[1])
  if (d1 <= d0) d1 = utcDay.offset(d0, 1)
  if (d0 <= datos[0] && d1 >= datos[1]) return { desde: null, hasta: null }
  return { desde: claveDia(d0), hasta: claveDia(utcDay.offset(d1, -1)) }
}

type Mover = 'acercar' | 'alejar' | 'anterior' | 'siguiente'

/** Navegación del rango con botones (alternativa de teclado al pincel). */
export function moverDominio(dominio: Dominio, datos: Dominio, accion: Mover): Dominio {
  const dias = utcDay.count(dominio[0], dominio[1])
  const total = utcDay.count(datos[0], datos[1])
  let d0 = dominio[0]
  let largo = dias
  if (accion === 'acercar') {
    largo = Math.max(1, Math.round(dias / 2))
    d0 = utcDay.offset(dominio[0], Math.floor((dias - largo) / 2))
  } else if (accion === 'alejar') {
    largo = Math.min(total, dias * 2)
    d0 = utcDay.offset(dominio[0], -Math.floor((largo - dias) / 2))
  } else {
    d0 = utcDay.offset(dominio[0], accion === 'anterior' ? -dias : dias)
  }
  // Dentro de los datos.
  if (d0 < datos[0]) d0 = datos[0]
  let d1 = utcDay.offset(d0, largo)
  if (d1 > datos[1]) {
    d1 = datos[1]
    d0 = utcDay.offset(d1, -largo)
    if (d0 < datos[0]) d0 = datos[0]
  }
  return [d0, d1]
}

// ---------------------------------------------------------------------------------------------
// Filtros (estado de la vista; vive en la URL: #/graficos?desde=…&zona=…)
// ---------------------------------------------------------------------------------------------
export interface Lugar {
  tipo: 'arbol' | 'zona'
  id: string
}

export interface Filtros {
  /** Días inclusivos en CDMX ("2026-10-03"). */
  desde: string | null
  hasta: string | null
  resultado: Resultado | null
  tipo: TipoImagen | null
  lugar: Lugar | null
  /** Decena de confianza: 8 = de 80 % a 90 % (9 incluye el 100 %). */
  confianza: number | null
}

export type Dimension = 'tiempo' | 'resultado' | 'tipo' | 'lugar' | 'confianza'

export const SIN_FILTROS: Filtros = { desde: null, hasta: null, resultado: null, tipo: null, lugar: null, confianza: null }

export function leerFiltros(consulta: string): Filtros {
  const p = new URLSearchParams(consulta)
  const resultado = p.get('resultado') as Resultado | null
  const tipo = p.get('tipo') as TipoImagen | null
  const arbol = p.get('arbol')
  const zona = p.get('zona')
  const conf = p.get('confianza')
  const n = conf !== null && /^\d$/.test(conf) ? Number(conf) : null
  let desde = esDia(p.get('desde')) ? p.get('desde') : null
  let hasta = esDia(p.get('hasta')) ? p.get('hasta') : null
  if (desde && hasta && desde > hasta) [desde, hasta] = [hasta, desde]
  return {
    desde,
    hasta,
    resultado: resultado && RESULTADOS.includes(resultado) ? resultado : null,
    tipo: tipo && TIPOS.includes(tipo) ? tipo : null,
    lugar: arbol ? { tipo: 'arbol', id: arbol } : zona ? { tipo: 'zona', id: zona } : null,
    confianza: n,
  }
}

/** Orden fijo y sin vacíos: la misma vista da siempre la misma URL. */
export function escribirFiltros(f: Filtros): URLSearchParams {
  const p = new URLSearchParams()
  if (f.desde) p.set('desde', f.desde)
  if (f.hasta) p.set('hasta', f.hasta)
  if (f.tipo) p.set('tipo', f.tipo)
  if (f.resultado) p.set('resultado', f.resultado)
  if (f.lugar) p.set(f.lugar.tipo, f.lugar.id)
  if (f.confianza !== null) p.set('confianza', String(f.confianza))
  return p
}

export function lugarDe(a: Analisis): Lugar | null {
  if (a.idArbol) return { tipo: 'arbol', id: a.idArbol }
  if (a.idZona) return { tipo: 'zona', id: a.idZona }
  return null
}

export const claveLugar = (l: Lugar) => `${l.tipo}:${l.id}`

export function decenaConfianza(c: number | null): number | null {
  if (c === null || Number.isNaN(c)) return null
  return Math.min(9, Math.max(0, Math.floor(c * 10 + 1e-9)))
}

/**
 * Crossfilter: cada gráfica se dibuja con todos los filtros menos los de su propia dimensión (que
 * en ella se ven como resaltado), para que siempre se pueda cambiar de elección.
 */
export function filtrar(analisis: Analisis[], f: Filtros, excepto: Dimension[] = []): Analisis[] {
  const usa = (d: Dimension) => !excepto.includes(d)
  const d0 = usa('tiempo') && f.desde ? diaAPared(f.desde).getTime() : -Infinity
  const d1 = usa('tiempo') && f.hasta ? utcDay.offset(diaAPared(f.hasta), 1).getTime() : Infinity
  return analisis.filter((a) => {
    if (usa('tiempo') && (f.desde || f.hasta)) {
      const t = aPared(a.fechaCaptura).getTime()
      if (t < d0 || t >= d1) return false
    }
    if (usa('resultado') && f.resultado && a.resultadoClasificacion !== f.resultado) return false
    if (usa('tipo') && f.tipo && a.tipoImagen !== f.tipo) return false
    if (usa('lugar') && f.lugar) {
      const l = lugarDe(a)
      if (!l || l.tipo !== f.lugar.tipo || l.id !== f.lugar.id) return false
    }
    if (usa('confianza') && f.confianza !== null && decenaConfianza(a.confianza) !== f.confianza) return false
    return true
  })
}

// ---------------------------------------------------------------------------------------------
// Agregados
// ---------------------------------------------------------------------------------------------
export type Conteos = Record<Resultado, number>

const ceros = (): Conteos => ({ sano: 0, infestado: 0, no_determinado: 0 })

function confianzaMedia(analisis: Analisis[]): number | null {
  const m = mean(analisis, (a) => a.confianza ?? undefined)
  return m === undefined ? null : m
}

export interface Periodo {
  inicio: Date
  fin: Date
  clave: string
  etiqueta: string
  conteos: Conteos
  total: number
  confianzaMedia: number | null
  /** Nombres de los árboles y zonas con análisis en el periodo. */
  lugares: string[]
}

/** Un periodo por cada intervalo del dominio, también los vacíos (el eje no salta días). */
export function serieTiempo(
  analisis: Analisis[],
  dominio: Dominio,
  intervalo: Intervalo,
  nombres: Map<string, string> = new Map(),
): Periodo[] {
  const int = INTERVALO[intervalo]
  const inicios = int.range(int.floor(dominio[0]), dominio[1])
  const grupos = new Map<string, Analisis[]>()
  for (const a of analisis) {
    const clave = claveDia(int.floor(aPared(a.fechaCaptura)))
    grupos.set(clave, [...(grupos.get(clave) ?? []), a])
  }
  return inicios.map((inicio) => {
    const clave = claveDia(inicio)
    const grupo = grupos.get(clave) ?? []
    const conteos = ceros()
    for (const a of grupo) conteos[a.resultadoClasificacion]++
    const lugares = [
      ...new Set(grupo.map((a) => lugarDe(a)).filter((l): l is Lugar => !!l).map((l) => nombres.get(claveLugar(l)) ?? l.id)),
    ]
    return {
      inicio,
      // El primer y el último periodo se recortan al dominio (una semana que empieza antes del rango).
      fin: int.offset(inicio, 1),
      clave,
      etiqueta: etiquetaPeriodo(inicio, intervalo),
      conteos,
      total: grupo.length,
      confianzaMedia: confianzaMedia(grupo),
      lugares,
    }
  })
}

export interface Decena {
  indice: number
  etiqueta: string
  conteos: Conteos
  total: number
}

/** Histograma de confianza en decenas (0–10 %, …, 90–100 %) y cuántos no traen confianza. */
export function histogramaConfianza(analisis: Analisis[]): { decenas: Decena[]; sinConfianza: number } {
  const decenas: Decena[] = Array.from({ length: 10 }, (_, i) => ({
    indice: i,
    etiqueta: `${i * 10}–${(i + 1) * 10} %`,
    conteos: ceros(),
    total: 0,
  }))
  let sinConfianza = 0
  for (const a of analisis) {
    const i = decenaConfianza(a.confianza)
    if (i === null) {
      sinConfianza++
      continue
    }
    decenas[i].conteos[a.resultadoClasificacion]++
    decenas[i].total++
  }
  return { decenas, sinConfianza }
}

export interface FilaLugar {
  lugar: Lugar
  clave: string
  nombre: string
  detalle: string
  conteos: Conteos
  total: number
  confianzaMedia: number | null
  ultimo: Analisis | null
}

/** Todos los árboles y zonas (también los que no tienen análisis), de más a menos análisis. */
export function porLugar(analisis: Analisis[], arboles: Arbol[], zonas: Zona[]): FilaLugar[] {
  const grupos = new Map<string, Analisis[]>()
  for (const a of analisis) {
    const l = lugarDe(a)
    if (!l) continue
    const k = claveLugar(l)
    grupos.set(k, [...(grupos.get(k) ?? []), a])
  }
  const fila = (lugar: Lugar, nombre: string, detalle: string): FilaLugar => {
    const clave = claveLugar(lugar)
    const grupo = grupos.get(clave) ?? []
    const conteos = ceros()
    for (const a of grupo) conteos[a.resultadoClasificacion]++
    const ultimo = grupo.reduce<Analisis | null>((u, a) => (!u || a.fechaCaptura > u.fechaCaptura ? a : u), null)
    return { lugar, clave, nombre, detalle, conteos, total: grupo.length, confianzaMedia: confianzaMedia(grupo), ultimo }
  }
  return [
    ...arboles.map((a) => fila({ tipo: 'arbol', id: a.id }, a.nombreEspecifico, a.especie)),
    ...zonas.map((z) => fila({ tipo: 'zona', id: z.id }, z.nombreZona, 'Zona de follaje')),
  ].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'))
}

export function nombresDeLugares(arboles: Arbol[], zonas: Zona[]): Map<string, string> {
  return new Map([
    ...arboles.map((a) => [claveLugar({ tipo: 'arbol', id: a.id }), a.nombreEspecifico] as const),
    ...zonas.map((z) => [claveLugar({ tipo: 'zona', id: z.id }), z.nombreZona] as const),
  ])
}

export interface Celda {
  fila: number
  columna: number
  conteos: Conteos
  total: number
}

/** Lugar × periodo: cuántos análisis tuvo cada árbol o zona en cada periodo. */
export function mapaCalor(analisis: Analisis[], lugares: FilaLugar[], periodos: Periodo[], intervalo: Intervalo): Celda[][] {
  const int = INTERVALO[intervalo]
  const filaDe = new Map(lugares.map((l, i) => [l.clave, i]))
  const columnaDe = new Map(periodos.map((p, i) => [p.clave, i]))
  const celdas = lugares.map((_, fila) => periodos.map((_, columna) => ({ fila, columna, conteos: ceros(), total: 0 })))
  for (const a of analisis) {
    const l = lugarDe(a)
    const f = l ? filaDe.get(claveLugar(l)) : undefined
    const c = columnaDe.get(claveDia(int.floor(aPared(a.fechaCaptura))))
    if (f === undefined || c === undefined) continue
    celdas[f][c].conteos[a.resultadoClasificacion]++
    celdas[f][c].total++
  }
  return celdas
}

export interface Indicadores {
  total: number
  infestados: number
  pctInfestado: number | null
  confianzaMedia: number | null
  lugares: number
}

export function indicadores(analisis: Analisis[]): Indicadores {
  const infestados = analisis.filter((a) => a.resultadoClasificacion === 'infestado').length
  const lugares = new Set(analisis.map((a) => lugarDe(a)).filter((l): l is Lugar => !!l).map(claveLugar)).size
  return {
    total: analisis.length,
    infestados,
    pctInfestado: analisis.length ? infestados / analisis.length : null,
    confianzaMedia: confianzaMedia(analisis),
    lugares,
  }
}

const pct = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })

/** "Sano 1 (50 %), Infestado 1 (50 %)" (solo los que tienen análisis). */
export function desglose(conteos: Conteos, etiquetas: Record<Resultado, string>): string {
  const total = conteos.sano + conteos.infestado + conteos.no_determinado
  return RESULTADOS.filter((r) => conteos[r] > 0)
    .map((r) => `${etiquetas[r]} ${conteos[r]} (${pct.format((conteos[r] / total) * 100)} %)`)
    .join(', ')
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
