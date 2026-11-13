import type { EstadoSincronizacion, Resultado, TipoImagen } from './api'
import { esDia } from './dia'

// Los datos son del Bosque de Chapultepec: se muestran en hora del centro de México.
// Desde octubre de 2022 no hay horario de verano: UTC−6 todo el año.
const ZONA_HORARIA = 'America/Mexico_City'
const OFFSET_CDMX = '-06:00'

export const ETIQUETA_RESULTADO: Record<Resultado, string> = {
  sano: 'Sano',
  infestado: 'Infestado',
  no_determinado: 'No determinado',
}

export const ETIQUETA_TIPO: Record<TipoImagen, string> = { corteza: 'Corteza', follaje: 'Follaje' }

export const ETIQUETA_SINCRONIZACION: Record<EstadoSincronizacion, string> = {
  sincronizado: 'Sincronizado',
  pendiente: 'Pendiente',
  error: 'Con error',
}

const fecha = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "8 oct 2026, 05:00" en hora de CDMX. */
export function formatFecha(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const partes = Object.fromEntries(fecha.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  const mes = String(partes.month).replace('.', '')
  return `${partes.day} ${mes} ${partes.year}, ${partes.hour}:${partes.minute}`
}

const porcentaje = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })

/** Fracción 0–1 (confianza) → "91 %". */
export function formatPorcentaje(fraccion: number | null): string {
  if (fraccion === null || Number.isNaN(fraccion)) return '—'
  return `${porcentaje.format(fraccion * 100)} %`
}

/** "2026-10-04" (input type=date) → primer instante de ese día en CDMX, en ISO UTC. */
export function inicioDelDia(dia: string): string | undefined {
  // Una fecha inválida no se envía (y no rompe: toISOString lanza con un Date inválido).
  return esDia(dia) ? new Date(`${dia}T00:00:00.000${OFFSET_CDMX}`).toISOString() : undefined
}

/** "2026-10-07" → último instante de ese día en CDMX, en ISO UTC (el filtro del backend es inclusivo). */
export function finDelDia(dia: string): string | undefined {
  return esDia(dia) ? new Date(`${dia}T23:59:59.999${OFFSET_CDMX}`).toISOString() : undefined
}

const relativo = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })

/** "hoy", "ayer", "hace 5 días", "hace 3 meses": cuánto pasó desde una captura. */
export function haceCuanto(iso: string, ahora: number = Date.now()): string {
  const dias = Math.floor((ahora - new Date(iso).getTime()) / 86_400_000)
  if (dias < 0) return relativo.format(0, 'day')
  if (dias < 45) return relativo.format(-dias, 'day')
  if (dias < 365) return relativo.format(-Math.round(dias / 30), 'month')
  return relativo.format(-Math.round(dias / 365), 'year')
}
