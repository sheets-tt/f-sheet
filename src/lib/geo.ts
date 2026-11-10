// Proyección local equirectangular para el plano de campo: a la escala de un parque (cientos de
// metros) el error frente a una proyección real es despreciable y no hace falta ninguna librería.

export interface Coordenada {
  lat: number
  lon: number
  /** Zonas de follaje: el círculo entra completo en el encuadre. */
  radioMetros?: number | null
}

export interface Lienzo {
  ancho: number
  alto: number
  margen: number
}

export interface Proyeccion {
  punto(c: Coordenada): { x: number; y: number }
  /** Longitud en unidades del lienzo de una distancia en metros. */
  metros(m: number): number
}

const METROS_POR_GRADO_LAT = 110_574
const METROS_POR_GRADO_LON_ECUADOR = 111_320
/** Encuadre mínimo (m) cuando hay un solo punto o todos coinciden. */
const ENCUADRE_MINIMO = 200

export function proyectar(puntos: Coordenada[], lienzo: Lienzo): Proyeccion {
  const latRef = puntos.length ? puntos.reduce((s, p) => s + p.lat, 0) / puntos.length : 0
  const lonRef = puntos.length ? puntos.reduce((s, p) => s + p.lon, 0) / puntos.length : 0
  const mLon = METROS_POR_GRADO_LON_ECUADOR * Math.cos((latRef * Math.PI) / 180)

  // Metros respecto al centroide: x hacia el este, y hacia el norte.
  const aMetros = (c: Coordenada) => ({ x: (c.lon - lonRef) * mLon, y: (c.lat - latRef) * METROS_POR_GRADO_LAT })

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of puntos) {
    const m = aMetros(p)
    const r = p.radioMetros ?? 0
    minX = Math.min(minX, m.x - r)
    maxX = Math.max(maxX, m.x + r)
    minY = Math.min(minY, m.y - r)
    maxY = Math.max(maxY, m.y + r)
  }
  if (!puntos.length) minX = maxX = minY = maxY = 0

  // Ensancha el encuadre alrededor de su centro si es demasiado pequeño.
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const spanX = Math.max(maxX - minX, ENCUADRE_MINIMO)
  const spanY = Math.max(maxY - minY, ENCUADRE_MINIMO)

  const utilX = lienzo.ancho - 2 * lienzo.margen
  const utilY = lienzo.alto - 2 * lienzo.margen
  const escala = Math.min(utilX / spanX, utilY / spanY)

  return {
    punto(c) {
      const m = aMetros(c)
      return {
        x: lienzo.ancho / 2 + (m.x - cx) * escala,
        y: lienzo.alto / 2 - (m.y - cy) * escala, // el norte arriba
      }
    },
    metros: (m) => m * escala,
  }
}

const LONGITUDES_REDONDAS = [5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000]

/** Barra de escala: la longitud redonda más cercana a 1/5 del ancho útil. */
export function escalaGrafica(pxPorMetro: number, anchoUtil: number): { metros: number; ancho: number } {
  const objetivo = anchoUtil / 5 / pxPorMetro
  const metros = LONGITUDES_REDONDAS.reduce((mejor, m) =>
    Math.abs(m - objetivo) < Math.abs(mejor - objetivo) ? m : mejor,
  )
  return { metros, ancho: metros * pxPorMetro }
}
