import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl'

/**
 * Estilo propio del mapa base: teselas vectoriales de OpenFreeMap (datos de OpenStreetMap, esquema
 * OpenMapTiles, sin clave ni costo) pintadas con la paleta de la app. El fondo queda apagado a
 * propósito: lo que tiene que resaltar son los estados de los árboles, no las calles.
 *
 * Si las teselas no cargan (sin red, CSP, servicio caído) el mapa sigue funcionando: se ve el
 * fondo liso con los árboles y zonas encima.
 */
export const TESELAS_URL = 'https://tiles.openfreemap.org/planet'
export const GLIFOS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

export interface PaletaBase {
  tierra: string
  bosque: string
  pasto: string
  agua: string
  aguaLinea: string
  edificio: string
  calle: string
  calleBorde: string
  sendero: string
  texto: string
  halo: string
}

export const BASE_CLARA: PaletaBase = {
  tierra: '#f2f6f3',
  bosque: '#cfe4d7',
  pasto: '#dfeee3',
  agua: '#c6d9de',
  aguaLinea: '#a9c4cc',
  edificio: '#e1e8e4',
  calle: '#ffffff',
  calleBorde: '#d3e0da',
  sendero: '#9db9ae',
  texto: '#4f6a62',
  halo: '#f2f6f3',
}

export const BASE_OSCURA: PaletaBase = {
  tierra: '#10211c',
  bosque: '#17352b',
  pasto: '#163027',
  agua: '#13303a',
  aguaLinea: '#1d4250',
  edificio: '#1b3a31',
  calle: '#27463d',
  calleBorde: '#1a332b',
  sendero: '#44695d',
  texto: '#a8c3ba',
  halo: '#10211c',
}

/** Colores de estado, leídos de las variables CSS (--c-*) para no repetirlos aquí. */
export interface PaletaEstados {
  bien: string
  alerta: string
  neutro: string
  vacio: string
  foco: string
}

export const FUENTE_ZONAS = 'zonas'
export const FUENTE_CAPTURAS = 'capturas'

/** Color por la propiedad "tono" de cada zona o captura. */
function colorPorTono(e: PaletaEstados): ExpressionSpecification {
  return ['match', ['get', 'tono'], 'bien', e.bien, 'alerta', e.alerta, 'neutro', e.neutro, e.vacio]
}

const FUENTE = ['Noto Sans Regular']
const FUENTE_CURSIVA = ['Noto Sans Italic']

function capasBase(b: PaletaBase): LayerSpecification[] {
  const om = 'openmaptiles'
  return [
    { id: 'fondo', type: 'background', paint: { 'background-color': b.tierra } },
    {
      id: 'parques', type: 'fill', source: om, 'source-layer': 'park',
      paint: { 'fill-color': b.pasto },
    },
    {
      id: 'cobertura-pasto', type: 'fill', source: om, 'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'farmland', 'wetland']]],
      paint: { 'fill-color': b.pasto },
    },
    {
      id: 'cobertura-bosque', type: 'fill', source: om, 'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-color': b.bosque },
    },
    {
      id: 'agua', type: 'fill', source: om, 'source-layer': 'water',
      paint: { 'fill-color': b.agua },
    },
    {
      id: 'rios', type: 'line', source: om, 'source-layer': 'waterway',
      paint: { 'line-color': b.aguaLinea, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 18, 3] },
    },
    {
      id: 'edificios', type: 'fill', source: om, 'source-layer': 'building', minzoom: 14,
      paint: { 'fill-color': b.edificio, 'fill-outline-color': b.calleBorde },
    },
    {
      id: 'senderos', type: 'line', source: om, 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]], minzoom: 14,
      paint: {
        'line-color': b.sendero,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 19, 2],
        'line-dasharray': [2, 1.5],
      },
    },
    {
      id: 'calles-borde', type: 'line', source: om, 'source-layer': 'transportation',
      filter: ['!', ['in', ['get', 'class'], ['literal', ['path', 'track', 'rail', 'transit', 'ferry']]]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': b.calleBorde,
        'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 1, 18, 18],
      },
    },
    {
      id: 'calles', type: 'line', source: om, 'source-layer': 'transportation',
      filter: ['!', ['in', ['get', 'class'], ['literal', ['path', 'track', 'rail', 'transit', 'ferry']]]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': b.calle,
        'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 0.5, 18, 14],
      },
    },
    {
      id: 'nombres-agua', type: 'symbol', source: om, 'source-layer': 'water_name',
      layout: { 'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']], 'text-font': FUENTE_CURSIVA, 'text-size': 12 },
      paint: { 'text-color': b.texto, 'text-halo-color': b.halo, 'text-halo-width': 1.5 },
    },
    {
      id: 'nombres-calles', type: 'symbol', source: om, 'source-layer': 'transportation_name', minzoom: 15,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
        'text-font': FUENTE,
        'text-size': 11,
      },
      paint: { 'text-color': b.texto, 'text-halo-color': b.halo, 'text-halo-width': 1.5 },
    },
    {
      id: 'nombres-lugares', type: 'symbol', source: om, 'source-layer': 'place', maxzoom: 16,
      layout: { 'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']], 'text-font': FUENTE, 'text-size': 12 },
      paint: { 'text-color': b.texto, 'text-halo-color': b.halo, 'text-halo-width': 1.5 },
    },
  ]
}

function capasDatos(e: PaletaEstados): LayerSpecification[] {
  const activo = ['boolean', ['feature-state', 'activo'], false] as ExpressionSpecification
  return [
    {
      id: 'zonas-relleno', type: 'fill', source: FUENTE_ZONAS,
      paint: { 'fill-color': colorPorTono(e), 'fill-opacity': ['case', activo, 0.3, 0.16] },
    },
    {
      id: 'zonas-borde', type: 'line', source: FUENTE_ZONAS,
      paint: { 'line-color': colorPorTono(e), 'line-width': ['case', activo, 3, 2] },
    },
    {
      // Dónde se tomó cada foto del seguimiento (pantalla de un árbol o zona).
      id: 'capturas', type: 'circle', source: FUENTE_CAPTURAS,
      paint: {
        'circle-radius': ['case', activo, 8, 5],
        'circle-color': colorPorTono(e),
        'circle-stroke-color': e.foco,
        'circle-stroke-width': ['case', activo, 3, 1.5],
      },
    },
  ]
}

const VACIA = { type: 'FeatureCollection' as const, features: [] }

export function estiloMapa(base: PaletaBase, estados: PaletaEstados): StyleSpecification {
  return {
    version: 8,
    glyphs: GLIFOS_URL,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: TESELAS_URL,
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · ' +
          '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · ' +
          'Datos de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      },
      [FUENTE_ZONAS]: { type: 'geojson', data: VACIA, promoteId: 'clave' },
      [FUENTE_CAPTURAS]: { type: 'geojson', data: VACIA, promoteId: 'clave' },
    },
    layers: [...capasBase(base), ...capasDatos(estados)],
  }
}
