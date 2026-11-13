import { useSyncExternalStore } from 'react'

// Routing por hash (#/login, #/, #/mapa…). Elegido a propósito para S3 + CloudFront:
// no necesita reescrituras ni "custom error responses" 403/404 → index.html,
// que en CloudFront son globales y también enmascararían los 401/403/404 de /api/*.
//
// Algunas rutas llevan un identificador:
//   #/arbol/<id>    seguimiento de un árbol
//   #/zona/<id>     seguimiento de una zona de follaje
//   #/mapa/<clave>  el mapa con un punto ya elegido ("a-<id>" árbol, "z-<id>" zona)
//
// Y una consulta opcional tras "?" (#/graficos?desde=2026-10-01&zona=c1): el estado de una vista que
// se puede compartir y que el botón Atrás recorre. Ver useConsulta y fijarConsulta.
export type Route = 'login' | 'resumen' | 'mapa' | 'analisis' | 'graficos' | 'admin' | 'arbol' | 'zona'

const HASH: Record<Route, string> = {
  login: '#/login',
  resumen: '#/',
  mapa: '#/mapa',
  analisis: '#/analisis',
  graficos: '#/graficos',
  admin: '#/admin',
  arbol: '#/arbol',
  zona: '#/zona',
}

/** Rutas que aceptan identificador, y si lo exigen. */
const CON_ID: Partial<Record<Route, 'opcional' | 'obligatorio'>> = {
  mapa: 'opcional',
  arbol: 'obligatorio',
  zona: 'obligatorio',
}

export interface Ubicacion {
  ruta: Route
  id: string | null
}

export function hrefDe(route: Route, id?: string | null): string {
  return id && CON_ID[route] ? `${HASH[route]}/${encodeURIComponent(id)}` : HASH[route]
}

export function parseUbicacion(hash: string): Ubicacion {
  const path = hash.replace(/^#/, '').split('?')[0] || '/'
  const conId = /^\/([a-z]+)\/([^/]+)$/.exec(path)
  if (conId) {
    const ruta = conId[1] as Route
    if (CON_ID[ruta]) {
      try {
        return { ruta, id: decodeURIComponent(conId[2]) }
      } catch {
        return { ruta: 'resumen', id: null }
      }
    }
  }
  const ruta = (Object.keys(HASH) as Route[]).find((r) => HASH[r] === `#${path}` && CON_ID[r] !== 'obligatorio')
  return { ruta: ruta ?? 'resumen', id: null }
}

export function parseRoute(hash: string): Route {
  return parseUbicacion(hash).ruta
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Consulta del hash ("desde=…&zona=…", sin "?"); "" si no hay. */
export function consultaDe(hash: string): string {
  const i = hash.indexOf('?')
  return i < 0 ? '' : hash.slice(i + 1)
}

/** La consulta actual como texto (estable entre renders: se compara por valor). */
export function useConsulta(): string {
  return useSyncExternalStore(subscribe, () => consultaDe(window.location.hash), () => '')
}

/**
 * Cambia la consulta sin cambiar de pantalla. `replace` para cambios continuos (arrastrar el rango),
 * que no deben llenar el historial; sin él, cada cambio queda como un paso de Atrás.
 */
export function fijarConsulta(params: URLSearchParams, { replace = false }: { replace?: boolean } = {}): void {
  const actual = window.location.hash || '#/'
  const base = actual.split('?')[0]
  const qs = params.toString()
  const hash = qs ? `${base}?${qs}` : base
  if (actual === hash) return
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => parseRoute(window.location.hash), () => 'login' as Route)
}

/** Identificador de la ruta actual (#/arbol/<id> → "<id>"), o null. */
export function useRutaId(): string | null {
  return useSyncExternalStore(subscribe, () => parseUbicacion(window.location.hash).id, () => null)
}

export function navigate(route: Route, { replace = false, id = null }: { replace?: boolean; id?: string | null } = {}): void {
  const hash = hrefDe(route, id)
  if (window.location.hash === hash) return
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}
