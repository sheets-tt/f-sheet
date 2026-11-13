import type { Analisis, Arbol, Resultado, Zona } from './api'
import { claveDiaCdmx, claveLugar, lugarDe, nivelConfianza, requiereAtencion, type LugarAnalisis } from './analisis'

// Datos del Resumen (dashboard): qué necesita atención, indicadores con su cambio, lugares con
// infestación reciente y actividad. Puro, sin DOM ni d3 (las gráficas van en su propio chunk).

/** Análisis lo que ve Análisis por defecto (sus 100 más recientes): los conteos con enlace coinciden. */
export const LIMITE_ANALISIS = 100

export interface PuntoAtencion {
  clave: 'infestado' | 'baja' | 'no_determinado' | 'error'
  titulo: string
  descripcion: string
  n: number
  /**
   * #/analisis ya filtrado (cajas o filtro del formulario). null si la cifra no coincidiría con lo
   * que abre el enlace (errores de sincronización sin /estadisticas): se muestra sin enlace.
   */
  href: string | null
  tono: 'alerta' | 'neutro' | 'aviso'
}

export interface Atencion {
  total: number
  /** Sobre cuántos análisis (los más recientes) se contó. */
  base: number
  puntos: PuntoAtencion[]
  hrefTodos: string
}

/**
 * "Necesita tu atención", sobre los análisis más recientes (ya vienen del más reciente al más
 * antiguo). Los errores de sincronización enlazan a un filtro del backend (?estado=error, sobre
 * todos los análisis): con `erroresTotales` (de /estadisticas) la cifra coincide con lo que se abre.
 */
export function atencion(analisis: Analisis[], erroresTotales: number | null = null): Atencion {
  const base = analisis.slice(0, LIMITE_ANALISIS)
  const contar = (f: (a: Analisis) => boolean) => base.filter(f).length
  const puntos: PuntoAtencion[] = [
    {
      clave: 'infestado',
      titulo: 'Infestados',
      descripcion: 'Análisis con infestación detectada',
      n: contar((a) => a.resultadoClasificacion === 'infestado'),
      href: '#/analisis?caja_resultado=infestado',
      tono: 'alerta',
    },
    {
      clave: 'baja',
      titulo: 'Confianza baja',
      descripcion: 'El modelo no estuvo seguro (menos de 50 %)',
      n: contar((a) => nivelConfianza(a.confianza) === 'baja'),
      href: '#/analisis?caja_confianza=baja',
      tono: 'aviso',
    },
    {
      clave: 'no_determinado',
      titulo: 'No determinados',
      descripcion: 'Conviene repetir la captura',
      n: contar((a) => a.resultadoClasificacion === 'no_determinado'),
      href: '#/analisis?caja_resultado=no_determinado',
      tono: 'neutro',
    },
    {
      clave: 'error',
      titulo: 'Errores de sincronización',
      // ?estado=error filtra en el backend sobre todos: solo con la cifra global coincide. Sin ella
      // (estadísticas caídas), se cuenta sobre los recientes, se dice así y no se enlaza.
      descripcion:
        erroresTotales !== null
          ? 'No llegaron bien desde el móvil (en todos los análisis)'
          : `No llegaron bien desde el móvil (de los ${base.length} más recientes)`,
      n: erroresTotales ?? contar((a) => a.estadoSincronizacion === 'error'),
      href: erroresTotales !== null ? '#/analisis?estado=error' : null,
      tono: 'alerta',
    },
  ]
  return { total: contar(requiereAtencion), base: base.length, puntos, hrefTodos: '#/analisis?atencion=1' }
}

export interface LugarInfestado {
  lugar: LugarAnalisis
  nombre: string
  detalle: string
  fecha: string
  href: string
}

/** Árboles y zonas cuyo último análisis salió infestado, del más reciente al más antiguo. */
export function lugaresInfestados(arboles: Arbol[], zonas: Zona[]): LugarInfestado[] {
  const lista: LugarInfestado[] = []
  for (const a of arboles) {
    if (a.ultimoAnalisis?.resultado === 'infestado')
      lista.push({ lugar: { tipo: 'arbol', id: a.id }, nombre: a.nombreEspecifico, detalle: a.especie, fecha: a.ultimoAnalisis.fechaCaptura, href: `#/arbol/${encodeURIComponent(a.id)}` })
  }
  for (const z of zonas) {
    if (z.ultimoAnalisis?.resultado === 'infestado')
      lista.push({ lugar: { tipo: 'zona', id: z.id }, nombre: z.nombreZona, detalle: 'Zona de follaje', fecha: z.ultimoAnalisis.fechaCaptura, href: `#/zona/${encodeURIComponent(z.id)}` })
  }
  return lista.sort((a, b) => b.fecha.localeCompare(a.fecha))
}

// ---------------------------------------------------------------------------------------------
// Indicadores del periodo (7 días que terminan en el día de la última captura) contra los 7 previos
// ---------------------------------------------------------------------------------------------
export const DIAS_PERIODO = 7

const sumarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export interface Medida {
  valor: number | null
  /** Del periodo anterior; null si no hubo análisis entonces (no hay contra qué comparar). */
  previo: number | null
}

export interface IndicadoresPeriodo {
  desde: string
  hasta: string
  /**
   * Con el límite de análisis cargados, el periodo anterior (o hasta el actual) puede venir
   * recortado: entonces no se compara (o se avisa).
   */
  incompleto: 'previo' | 'actual' | null
  analisis: Medida
  pctInfestado: Medida
  confianzaMedia: Medida
  lugares: Medida
  ultimaCaptura: string | null
  ultimaSincronizacion: string | null
}

function medidas(lista: Analisis[]) {
  const n = lista.length
  const conConfianza = lista.filter((a) => a.confianza !== null)
  return {
    analisis: n,
    pctInfestado: n ? lista.filter((a) => a.resultadoClasificacion === 'infestado').length / n : null,
    confianzaMedia: conConfianza.length ? conConfianza.reduce((s, a) => s + (a.confianza ?? 0), 0) / conConfianza.length : null,
    lugares: new Set(lista.map(lugarDe).filter((l): l is LugarAnalisis => !!l).map(claveLugar)).size,
  }
}

export function indicadoresPeriodo(analisis: Analisis[], limite: number | null = null): IndicadoresPeriodo | null {
  if (!analisis.length) return null
  const ultima = analisis.reduce((m, a) => (a.fechaCaptura > m ? a.fechaCaptura : m), analisis[0].fechaCaptura)
  const hasta = claveDiaCdmx(ultima)
  const desde = sumarDias(hasta, -(DIAS_PERIODO - 1))
  const previoDesde = sumarDias(desde, -DIAS_PERIODO)
  const dia = (a: Analisis) => claveDiaCdmx(a.fechaCaptura)
  const actual = medidas(analisis.filter((a) => dia(a) >= desde && dia(a) <= hasta))
  const previos = analisis.filter((a) => dia(a) >= previoDesde && dia(a) < desde)
  const previo = medidas(previos)
  // Si se llegó al límite, lo más antiguo cargado marca hasta dónde se ve: lo anterior falta.
  const masAntiguo = analisis.reduce((m, a) => (dia(a) < m ? dia(a) : m), dia(analisis[0]))
  const recortado = limite !== null && analisis.length >= limite
  // >=: el día más antiguo cargado puede venir a medias (el límite lo cortó en algún punto del día).
  const incompleto = recortado && masAntiguo >= desde ? 'actual' : recortado && masAntiguo >= previoDesde ? 'previo' : null
  const hayPrevio = previos.length > 0 && incompleto === null
  const sinc = analisis.map((a) => a.fechaSincronizacion).filter((f): f is string => !!f)
  const m = (k: keyof typeof actual): Medida => ({ valor: actual[k], previo: hayPrevio ? previo[k] : null })
  return {
    desde,
    hasta,
    incompleto,
    analisis: m('analisis'),
    pctInfestado: m('pctInfestado'),
    confianzaMedia: m('confianzaMedia'),
    lugares: m('lugares'),
    ultimaCaptura: ultima,
    ultimaSincronizacion: sinc.length ? sinc.reduce((x, y) => (y > x ? y : x)) : null,
  }
}

const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })

/**
 * Cambio contra el periodo anterior, en palabras: "+3 contra los 7 días previos",
 * "−5 pts", "igual que…". Para fracciones (porcentajes), en puntos porcentuales.
 */
export function cambio(m: Medida, tipo: 'cuenta' | 'fraccion'): string | null {
  if (m.valor === null || m.previo === null) return null
  const d = tipo === 'fraccion' ? (m.valor - m.previo) * 100 : m.valor - m.previo
  if (Math.abs(d) < 0.05) return `igual que los ${DIAS_PERIODO} días previos`
  return `${num.format(d).replace('-', '−')}${tipo === 'fraccion' ? ' pts' : ''} contra los ${DIAS_PERIODO} días previos`
}

/** Los más recientes (ya vienen ordenados del backend). */
export const recientes = (analisis: Analisis[], n = 6) => analisis.slice(0, n)

/** Enlace al detalle de un análisis en la pantalla Análisis. */
export const hrefDetalle = (a: Analisis) => `#/analisis?detalle=${encodeURIComponent(a.id)}`

export interface Acceso {
  ruta: 'mapa' | 'analisis' | 'graficos' | 'seguimiento' | 'admin'
  titulo: string
  descripcion: string
  href: string
}

/** Accesos rápidos en orden de prioridad; Administración solo para administradores. */
export function accesos(opciones: {
  arboles: number | null
  zonas: number | null
  /** Los cargados (hasta 500); Análisis muestra los LIMITE_ANALISIS más recientes. */
  analisis: number | null
  atencion: number | null
  ultimoInfestado: LugarInfestado | null
  esAdmin: boolean
}): Acceso[] {
  const { arboles, zonas, analisis, atencion: requieren, ultimoInfestado, esAdmin } = opciones
  const p = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
  const lista: Acceso[] = [
    {
      ruta: 'mapa',
      titulo: 'Mapa',
      descripcion: arboles !== null && zonas !== null ? `${p(arboles, 'árbol', 'árboles')} y ${p(zonas, 'zona', 'zonas')} con su último resultado` : 'Árboles y zonas con su último resultado',
      href: '#/mapa',
    },
    {
      ruta: 'analisis',
      titulo: 'Análisis',
      descripcion:
        analisis !== null
          ? `${analisis > LIMITE_ANALISIS ? `Los ${LIMITE_ANALISIS} más recientes` : p(analisis, 'análisis', 'análisis')}${
              requieren ? `, ${p(requieren, 'requiere', 'requieren')} atención` : ''
            }`
          : 'Capturas por resultado, tipo y confianza',
      href: '#/analisis',
    },
    { ruta: 'graficos', titulo: 'Gráficos', descripcion: 'Tendencias en el tiempo, confianza y lugares', href: '#/graficos' },
  ]
  if (ultimoInfestado)
    lista.push({
      ruta: 'seguimiento',
      titulo: `Seguimiento de ${ultimoInfestado.nombre}`,
      descripcion: 'El último lugar con infestación detectada',
      href: ultimoInfestado.href,
    })
  if (esAdmin) lista.push({ ruta: 'admin', titulo: 'Administración', descripcion: 'Cuentas con acceso y dispositivos', href: '#/admin' })
  return lista
}

export const ORDEN_RESULTADOS: Resultado[] = ['sano', 'infestado', 'no_determinado']
