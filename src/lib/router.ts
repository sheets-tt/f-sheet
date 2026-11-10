import { useSyncExternalStore } from 'react'

// Routing por hash (#/login, #/, #/mapa…). Elegido a propósito para S3 + CloudFront:
// no necesita reescrituras ni "custom error responses" 403/404 → index.html,
// que en CloudFront son globales y también enmascararían los 401/403/404 de /api/*.
export type Route = 'login' | 'resumen' | 'mapa' | 'analisis' | 'admin'

const HASH: Record<Route, string> = {
  login: '#/login',
  resumen: '#/',
  mapa: '#/mapa',
  analisis: '#/analisis',
  admin: '#/admin',
}

export function hrefDe(route: Route): string {
  return HASH[route]
}

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  const ruta = (Object.keys(HASH) as Route[]).find((r) => HASH[r] === `#${path}`)
  return ruta ?? 'resumen'
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => parseRoute(window.location.hash), () => 'login' as Route)
}

export function navigate(route: Route, { replace = false } = {}): void {
  const hash = hrefDe(route)
  if (window.location.hash === hash) return
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}
