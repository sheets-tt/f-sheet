import type { Analisis, EstadoSincronizacion, Resultado, TipoImagen } from './api'
import { esDia } from './dia'

// Lógica de la pantalla Análisis: cajas por categoría, vistas, agrupación y vecinos. Pura (sin DOM),
// probada aparte. El estado completo vive en la URL: #/analisis?tipo=…&caja_resultado=…&vista=…

export const RESULTADOS: Resultado[] = ['sano', 'infestado', 'no_determinado']
export const TIPOS: TipoImagen[] = ['corteza', 'follaje']
const ESTADOS: EstadoSincronizacion[] = ['pendiente', 'sincronizado', 'error']

// ---------------------------------------------------------------------------------------------
// Confianza en categorías
// ---------------------------------------------------------------------------------------------
export type NivelConfianza = 'alta' | 'media' | 'baja' | 'sin'
export const NIVELES: NivelConfianza[] = ['alta', 'media', 'baja', 'sin']
export const ETIQUETA_NIVEL: Record<NivelConfianza, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  sin: 'Sin confianza',
}
export const RANGO_NIVEL: Record<NivelConfianza, string> = {
  alta: '80 % o más',
  media: 'de 50 % a menos de 80 %',
  baja: 'menos de 50 %',
  sin: 'el modelo no la reportó',
}

/**
 * Se clasifica el porcentaje tal como se muestra (redondeado a una décima, ver formatPorcentaje):
 * 0.79999 se ve "80 %" y es alta, no media.
 */
export function nivelConfianza(c: number | null): NivelConfianza {
  if (c === null || Number.isNaN(c)) return 'sin'
  const mostrado = Math.round(c * 1000) / 10
  if (mostrado >= 80) return 'alta'
  if (mostrado >= 50) return 'media'
  return 'baja'
}

// ---------------------------------------------------------------------------------------------
// "Requieren atención"
// ---------------------------------------------------------------------------------------------
/**
 * Un análisis requiere atención si: salió infestado, no se pudo determinar, la confianza es baja
 * (< 50 %) o falló su sincronización. Devuelve los motivos, en ese orden (vacío = no requiere).
 */
export function motivosAtencion(a: Analisis): string[] {
  const motivos: string[] = []
  if (a.resultadoClasificacion === 'infestado') motivos.push('Infestado')
  if (a.resultadoClasificacion === 'no_determinado') motivos.push('No determinado')
  if (nivelConfianza(a.confianza) === 'baja') motivos.push('Confianza baja')
  if (a.estadoSincronizacion === 'error') motivos.push('Error de sincronización')
  return motivos
}

export const requiereAtencion = (a: Analisis) => motivosAtencion(a).length > 0

// ---------------------------------------------------------------------------------------------
// Estado de la pantalla en la URL
// ---------------------------------------------------------------------------------------------
/** Filtros del formulario (se consultan al backend al aplicar), como ya existían. */
export interface Formulario {
  tipo: '' | TipoImagen
  resultado: '' | Resultado
  estado: '' | EstadoSincronizacion
  desde: string
  hasta: string
}

export const FORM_VACIO: Formulario = { tipo: '', resultado: '', estado: '', desde: '', hasta: '' }

/** Cajas: afinan, en el navegador, los análisis ya cargados. Dentro de un grupo suman (o); entre grupos, se combinan (y). */
export interface Cajas {
  resultado: Resultado[]
  tipo: TipoImagen[]
  confianza: NivelConfianza[]
  atencion: boolean
}

export const CAJAS_VACIAS: Cajas = { resultado: [], tipo: [], confianza: [], atencion: false }

export type Vista = 'tabla' | 'tarjetas'
export type Agrupar = 'nada' | 'lugar' | 'resultado' | 'dia'
export const AGRUPAR: Agrupar[] = ['nada', 'lugar', 'resultado', 'dia']
export const ETIQUETA_AGRUPAR: Record<Agrupar, string> = { nada: 'Nada', lugar: 'Árbol o zona', resultado: 'Resultado', dia: 'Día' }

export interface EstadoAnalisis {
  form: Formulario
  cajas: Cajas
  /** null = la URL no lo dice (se usa la preferencia guardada o la tabla). */
  vista: Vista | null
  agrupar: Agrupar
  /** Análisis abierto en el detalle (enlace directo, p. ej. desde el Resumen). */
  detalle: string | null
}

const lista = <T extends string>(valor: string | null, validos: readonly T[]): T[] =>
  valor ? [...new Set(valor.split(',').filter((v): v is T => (validos as readonly string[]).includes(v)))].sort((a, b) => validos.indexOf(a) - validos.indexOf(b)) : []
const uno = <T extends string>(valor: string | null, validos: readonly T[]): '' | T =>
  valor && (validos as readonly string[]).includes(valor) ? (valor as T) : ''

export function leerEstado(consulta: string): EstadoAnalisis {
  const p = new URLSearchParams(consulta)
  const vista = p.get('vista')
  const agrupar = p.get('agrupar')
  return {
    form: {
      tipo: uno(p.get('tipo'), TIPOS),
      resultado: uno(p.get('resultado'), RESULTADOS),
      estado: uno(p.get('estado'), ESTADOS),
      desde: esDia(p.get('desde')) ? p.get('desde')! : '',
      hasta: esDia(p.get('hasta')) ? p.get('hasta')! : '',
    },
    cajas: {
      resultado: lista(p.get('caja_resultado'), RESULTADOS),
      tipo: lista(p.get('caja_tipo'), TIPOS),
      confianza: lista(p.get('caja_confianza'), NIVELES),
      atencion: p.get('atencion') === '1',
    },
    vista: vista === 'tabla' || vista === 'tarjetas' ? vista : null,
    agrupar: (AGRUPAR as string[]).includes(agrupar ?? '') ? (agrupar as Agrupar) : 'nada',
    detalle: p.get('detalle') || null,
  }
}

/** Orden fijo y sin vacíos: la misma vista da siempre la misma URL. */
export function escribirEstado(e: EstadoAnalisis): URLSearchParams {
  const p = new URLSearchParams()
  for (const k of ['desde', 'hasta', 'tipo', 'resultado', 'estado'] as const) if (e.form[k]) p.set(k, e.form[k])
  if (e.cajas.resultado.length) p.set('caja_resultado', e.cajas.resultado.join(','))
  if (e.cajas.tipo.length) p.set('caja_tipo', e.cajas.tipo.join(','))
  if (e.cajas.confianza.length) p.set('caja_confianza', e.cajas.confianza.join(','))
  if (e.cajas.atencion) p.set('atencion', '1')
  if (e.vista) p.set('vista', e.vista)
  if (e.agrupar !== 'nada') p.set('agrupar', e.agrupar)
  if (e.detalle) p.set('detalle', e.detalle)
  return p
}

export const hayCajas = (c: Cajas) => c.resultado.length + c.tipo.length + c.confianza.length > 0 || c.atencion

/** Activa o quita un valor dentro de un grupo de cajas. */
export function alternar<T>(valores: T[], valor: T, orden: readonly T[]): T[] {
  const nuevo = valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor]
  return nuevo.sort((a, b) => orden.indexOf(a) - orden.indexOf(b))
}

export function filtrarCajas(analisis: Analisis[], c: Cajas): Analisis[] {
  return analisis.filter(
    (a) =>
      (!c.resultado.length || c.resultado.includes(a.resultadoClasificacion)) &&
      (!c.tipo.length || c.tipo.includes(a.tipoImagen)) &&
      (!c.confianza.length || c.confianza.includes(nivelConfianza(a.confianza))) &&
      (!c.atencion || requiereAtencion(a)),
  )
}

// ---------------------------------------------------------------------------------------------
// Conteos de las cajas
// ---------------------------------------------------------------------------------------------
export interface ConteosCajas {
  total: number
  resultado: Record<Resultado, number>
  tipo: Record<TipoImagen, number>
  confianza: Record<NivelConfianza, number>
  atencion: number
}

export function conteosCajas(analisis: Analisis[]): ConteosCajas {
  const c: ConteosCajas = {
    total: analisis.length,
    resultado: { sano: 0, infestado: 0, no_determinado: 0 },
    tipo: { corteza: 0, follaje: 0 },
    confianza: { alta: 0, media: 0, baja: 0, sin: 0 },
    atencion: 0,
  }
  for (const a of analisis) {
    c.resultado[a.resultadoClasificacion]++
    c.tipo[a.tipoImagen]++
    c.confianza[nivelConfianza(a.confianza)]++
    if (requiereAtencion(a)) c.atencion++
  }
  return c
}

const pct = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })
/** "40 %" de un total (0 si no hay). */
export const porcentaje = (n: number, total: number) => `${pct.format(total ? (n / total) * 100 : 0)} %`

// ---------------------------------------------------------------------------------------------
// Lugar, día y agrupación
// ---------------------------------------------------------------------------------------------
export interface LugarAnalisis {
  tipo: 'arbol' | 'zona'
  id: string
}

export function lugarDe(a: Analisis): LugarAnalisis | null {
  if (a.idArbol) return { tipo: 'arbol', id: a.idArbol }
  if (a.idZona) return { tipo: 'zona', id: a.idZona }
  return null
}

export const claveLugar = (l: LugarAnalisis) => `${l.tipo}:${l.id}`

const diaCdmx = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' })
const diaLargo = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-10-03": el día de la captura en hora de CDMX. */
export const claveDiaCdmx = (iso: string) => diaCdmx.format(new Date(iso))

export interface Grupo {
  clave: string
  titulo: string
  /** Para el enlace al seguimiento cuando se agrupa por lugar. */
  lugar: LugarAnalisis | null
  analisis: Analisis[]
  resultado: Record<Resultado, number>
  atencion: number
}

/** Grupos en un orden útil: lugar por más análisis, resultado en su orden fijo, día del más reciente. */
export function agrupar(analisis: Analisis[], modo: Agrupar, nombres: Map<string, string>): Grupo[] {
  if (modo === 'nada') return [grupo('todos', 'Todos', null, analisis)]
  const mapa = new Map<string, Analisis[]>()
  const claveDe = (a: Analisis) => {
    if (modo === 'resultado') return a.resultadoClasificacion
    if (modo === 'dia') return claveDiaCdmx(a.fechaCaptura)
    const l = lugarDe(a)
    return l ? claveLugar(l) : 'sin-lugar'
  }
  for (const a of analisis) mapa.set(claveDe(a), [...(mapa.get(claveDe(a)) ?? []), a])
  const grupos = [...mapa].map(([clave, lista]) => {
    if (modo === 'resultado') return grupo(clave, ETIQUETA_RESULTADO_LOCAL[clave as Resultado], null, lista)
    if (modo === 'dia') {
      const t = diaLargo.format(new Date(lista[0].fechaCaptura))
      return grupo(clave, t.charAt(0).toUpperCase() + t.slice(1), null, lista)
    }
    if (clave === 'sin-lugar') return grupo(clave, 'Sin árbol ni zona', null, lista)
    const l = lugarDe(lista[0])!
    return grupo(clave, nombres.get(clave) ?? (l.tipo === 'arbol' ? 'Árbol' : 'Zona'), l, lista)
  })
  if (modo === 'resultado') return grupos.sort((a, b) => RESULTADOS.indexOf(a.clave as Resultado) - RESULTADOS.indexOf(b.clave as Resultado))
  if (modo === 'dia') return grupos.sort((a, b) => b.clave.localeCompare(a.clave))
  return grupos.sort((a, b) => b.analisis.length - a.analisis.length || a.titulo.localeCompare(b.titulo, 'es'))
}

// Copia local para no depender de format.ts aquí (mismas etiquetas).
const ETIQUETA_RESULTADO_LOCAL: Record<Resultado, string> = { sano: 'Sano', infestado: 'Infestado', no_determinado: 'No determinado' }

function grupo(clave: string, titulo: string, lugar: LugarAnalisis | null, analisis: Analisis[]): Grupo {
  const resultado = { sano: 0, infestado: 0, no_determinado: 0 }
  for (const a of analisis) resultado[a.resultadoClasificacion]++
  return { clave, titulo, lugar, analisis, resultado, atencion: analisis.filter(requiereAtencion).length }
}

/** Análisis anterior (más antiguo) y siguiente (más reciente) del mismo árbol o zona, entre los cargados. */
export function vecinos(analisis: Analisis[], a: Analisis): { anterior: Analisis | null; siguiente: Analisis | null } {
  const l = lugarDe(a)
  if (!l) return { anterior: null, siguiente: null }
  const mismos = analisis
    .filter((x) => {
      const m = lugarDe(x)
      return m && claveLugar(m) === claveLugar(l)
    })
    .sort((x, y) => x.fechaCaptura.localeCompare(y.fechaCaptura))
  const i = mismos.findIndex((x) => x.id === a.id)
  return { anterior: mismos[i - 1] ?? null, siguiente: mismos[i + 1] ?? null }
}
