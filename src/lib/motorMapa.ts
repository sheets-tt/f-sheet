import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MapaML } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// El worker se sirve desde el propio sitio (no como blob:): la CSP de CloudFront no tiene que abrir
// worker-src a blob: ni a otros orígenes.
import urlTrabajador from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { BASE_CLARA, BASE_OSCURA, FUENTE_CAPTURAS, FUENTE_ZONAS, estiloMapa, type PaletaEstados } from './estiloMapa'
import type { Limites, LngLat } from './geo'

/**
 * Capa delgada sobre MapLibre GL JS. Las pantallas no importan maplibre-gl directamente: hablan con
 * este Motor. Así las pruebas unitarias (jsdom, sin WebGL) lo sustituyen por uno falso
 * (src/test/motorFalso.ts) y el resto de la pantalla se prueba igual.
 */

export interface Elemento {
  type: 'Feature'
  id?: string
  properties: { clave: string; tono: string; [k: string]: unknown }
  geometry: { type: 'Polygon'; coordinates: LngLat[][] } | { type: 'Point'; coordinates: LngLat }
}

export interface Coleccion {
  type: 'FeatureCollection'
  features: Elemento[]
}

export interface OpcionesMotor {
  limites: Limites
  oscuro: boolean
  /** Sin animaciones de cámara (prefers-reduced-motion). */
  sinMovimiento: boolean
  /** Zoom máximo al encuadrar (un solo árbol no debe quedar a zoom 22). */
  zoomMaximoEncuadre?: number
  /** Controles de zoom/brújula, escala y pantalla completa. */
  controles?: boolean
  /** Clic en el relleno de una zona o en un punto de captura. */
  alTocar?: (capa: 'zonas' | 'capturas', clave: string) => void
}

export interface Motor {
  /** Coloca un elemento DOM (un <button>) en una coordenada. Devuelve cómo quitarlo. */
  marcador(el: HTMLElement, lngLat: LngLat): () => void
  zonas(datos: Coleccion): void
  capturas(datos: Coleccion): void
  /** Resalta una zona o captura por su clave (null: ninguna). */
  resaltar(capa: 'zonas' | 'capturas', clave: string | null): void
  encuadrar(limites: Limites): void
  volarA(lngLat: LngLat, zoom?: number): void
  tema(oscuro: boolean): void
  destruir(): void
}

export function soportaWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

function leerEstados(): PaletaEstados {
  const css = getComputedStyle(document.documentElement)
  const v = (n: string, defecto: string) => css.getPropertyValue(n).trim() || defecto
  return {
    bien: v('--c-sano', '#2a78d6'),
    alerta: v('--c-infestado', '#d9466f'),
    neutro: v('--c-neutro', '#a6a9b0'),
    vacio: v('--muted', '#4f6a62'),
    foco: v('--surface', '#ffffff'),
  }
}

// A la derecha cabe el nombre de la marca; arriba a la izquierda, el botón "Ver todos".
const RELLENO = { top: 64, right: 140, bottom: 48, left: 56 }

let trabajadorListo = false

export async function crearMotor(contenedor: HTMLElement, op: OpcionesMotor): Promise<Motor> {
  if (!trabajadorListo) {
    maplibregl.setWorkerUrl(urlTrabajador)
    trabajadorListo = true
  }

  const mapa: MapaML = new maplibregl.Map({
    container: contenedor,
    style: estiloMapa(op.oscuro ? BASE_OSCURA : BASE_CLARA, leerEstados()),
    bounds: op.limites,
    fitBoundsOptions: { padding: RELLENO, maxZoom: op.zoomMaximoEncuadre ?? 18 },
    maxZoom: 20,
    attributionControl: { compact: true },
    cooperativeGestures: false,
    dragRotate: true,
    pitchWithRotate: false,
    locale: {
      'NavigationControl.ZoomIn': 'Acercar',
      'NavigationControl.ZoomOut': 'Alejar',
      'NavigationControl.ResetBearing': 'Orientar al norte',
      'FullscreenControl.Enter': 'Pantalla completa',
      'FullscreenControl.Exit': 'Salir de pantalla completa',
      'AttributionControl.ToggleAttribution': 'Créditos del mapa',
      'Map.Title': 'Mapa',
    },
  })

  if (op.controles !== false) {
    mapa.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right')
    mapa.addControl(new maplibregl.FullscreenControl({ container: contenedor.parentElement ?? contenedor }), 'top-right')
    mapa.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-left')
  }

  // Los datos pueden llegar antes de que cargue el estilo: se guardan y se aplican en "load".
  let cargado = false
  const pendientes: Partial<Record<string, Coleccion>> = {}
  const resaltados: Record<'zonas' | 'capturas', string | null> = { zonas: null, capturas: null }

  function fijar(fuente: string, datos: Coleccion) {
    if (!cargado) {
      pendientes[fuente] = datos
      return
    }
    ;(mapa.getSource(fuente) as GeoJSONSource | undefined)?.setData(datos as never)
  }

  function estado(capa: 'zonas' | 'capturas', clave: string | null, activo: boolean) {
    if (!cargado || !clave) return
    const source = capa === 'zonas' ? FUENTE_ZONAS : FUENTE_CAPTURAS
    try {
      mapa.setFeatureState({ source, id: clave }, { activo })
    } catch {
      // El elemento todavía no está en la fuente: no hay nada que resaltar.
    }
  }

  // "style.load" y no "load": "load" espera a las teselas, y sin red nunca llegaría.
  const alCargarEstilo: (() => void)[] = []
  mapa.once('style.load', () => {
    cargado = true
    for (const [fuente, datos] of Object.entries(pendientes)) if (datos) fijar(fuente, datos)
    estado('zonas', resaltados.zonas, true)
    estado('capturas', resaltados.capturas, true)
    for (const fn of alCargarEstilo.splice(0)) fn()
  })

  for (const capa of ['zonas-relleno', 'capturas'] as const) {
    const nombre = capa === 'zonas-relleno' ? 'zonas' : 'capturas'
    mapa.on('click', capa, (e) => {
      const clave = e.features?.[0]?.properties?.clave
      if (typeof clave === 'string') op.alTocar?.(nombre, clave)
    })
    mapa.on('mouseenter', capa, () => (mapa.getCanvas().style.cursor = 'pointer'))
    mapa.on('mouseleave', capa, () => (mapa.getCanvas().style.cursor = ''))
  }

  const duracion = op.sinMovimiento ? 0 : undefined

  return {
    marcador(el, lngLat) {
      const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(mapa)
      return () => m.remove()
    },
    zonas: (d) => fijar(FUENTE_ZONAS, d),
    capturas: (d) => fijar(FUENTE_CAPTURAS, d),
    resaltar(capa, clave) {
      estado(capa, resaltados[capa], false)
      resaltados[capa] = clave
      estado(capa, clave, true)
    },
    encuadrar(limites) {
      mapa.fitBounds(limites, { padding: RELLENO, maxZoom: op.zoomMaximoEncuadre ?? 18, duration: duracion })
    },
    volarA(lngLat, zoom) {
      const destino = { center: lngLat, zoom: Math.max(mapa.getZoom(), zoom ?? 17) }
      if (op.sinMovimiento) mapa.jumpTo(destino)
      else mapa.flyTo({ ...destino, speed: 1.4, curve: 1.2 })
    },
    tema(oscuro) {
      // Solo cambian colores: se repintan las capas sin recargar fuentes ni datos.
      const nuevo = estiloMapa(oscuro ? BASE_OSCURA : BASE_CLARA, leerEstados())
      const aplicar = () => {
        for (const capa of nuevo.layers) {
          if (!mapa.getLayer(capa.id) || !('paint' in capa) || !capa.paint) continue
          for (const [prop, valor] of Object.entries(capa.paint)) mapa.setPaintProperty(capa.id, prop as Parameters<MapaML["setPaintProperty"]>[1], valor)
        }
      }
      if (cargado) aplicar()
      else alCargarEstilo.push(aplicar)
    },
    destruir: () => mapa.remove(),
  }
}
