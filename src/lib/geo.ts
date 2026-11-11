// Geometría pequeña para el mapa: a la escala de un parque (cientos de metros) basta una
// aproximación local; no hace falta una librería de geodesia.

export type LngLat = [lon: number, lat: number]
export type Limites = [suroeste: LngLat, noreste: LngLat]

const METROS_POR_GRADO_LAT = 110_574
const METROS_POR_GRADO_LON_ECUADOR = 111_320

function metrosPorGradoLon(lat: number): number {
  return METROS_POR_GRADO_LON_ECUADOR * Math.cos((lat * Math.PI) / 180)
}

/** Polígono (anillo cerrado) que aproxima un círculo de `radio` metros alrededor de `centro`. */
export function circulo(centro: LngLat, radio: number, pasos = 64): LngLat[] {
  const [lon, lat] = centro
  const dLat = radio / METROS_POR_GRADO_LAT
  const dLon = radio / metrosPorGradoLon(lat)
  const anillo: LngLat[] = []
  for (let i = 0; i < pasos; i++) {
    const t = (i / pasos) * 2 * Math.PI
    anillo.push([lon + dLon * Math.cos(t), lat + dLat * Math.sin(t)])
  }
  anillo.push(anillo[0])
  return anillo
}

export interface Ubicable {
  lon: number
  lat: number
  /** Zonas de follaje: el círculo entra completo en el encuadre. */
  radioMetros?: number | null
}

/** Encuadre mínimo (m) cuando hay un solo punto o todos coinciden. */
const ENCUADRE_MINIMO = 120

/** Rectángulo que contiene todos los puntos (y sus radios), nunca menor que ENCUADRE_MINIMO. */
export function limitesDe(puntos: Ubicable[]): Limites | null {
  if (!puntos.length) return null
  let oeste = Infinity, este = -Infinity, sur = Infinity, norte = -Infinity
  for (const p of puntos) {
    const r = p.radioMetros ?? 0
    const dLat = r / METROS_POR_GRADO_LAT
    const dLon = r / metrosPorGradoLon(p.lat)
    oeste = Math.min(oeste, p.lon - dLon)
    este = Math.max(este, p.lon + dLon)
    sur = Math.min(sur, p.lat - dLat)
    norte = Math.max(norte, p.lat + dLat)
  }
  const cLat = (sur + norte) / 2
  const cLon = (oeste + este) / 2
  const medioLat = Math.max(norte - sur, ENCUADRE_MINIMO / METROS_POR_GRADO_LAT) / 2
  const medioLon = Math.max(este - oeste, ENCUADRE_MINIMO / metrosPorGradoLon(cLat)) / 2
  return [
    [cLon - medioLon, cLat - medioLat],
    [cLon + medioLon, cLat + medioLat],
  ]
}

/** Distancia aproximada en metros entre dos puntos cercanos. */
export function distanciaMetros(a: LngLat, b: LngLat): number {
  const lat = (a[1] + b[1]) / 2
  const dx = (b[0] - a[0]) * metrosPorGradoLon(lat)
  const dy = (b[1] - a[1]) * METROS_POR_GRADO_LAT
  return Math.hypot(dx, dy)
}

const coordenada = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 5, maximumFractionDigits: 5 })

/** "19.42050° N, 99.18180° O". */
export function formatCoordenadas(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const eo = lon >= 0 ? 'E' : 'O'
  return `${coordenada.format(Math.abs(lat))}° ${ns}, ${coordenada.format(Math.abs(lon))}° ${eo}`
}
