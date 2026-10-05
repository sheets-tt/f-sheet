import { useSyncExternalStore } from 'react'

// Routing por hash (#/login, #/). Elegido a propósito para S3 + CloudFront:
// no necesita reescrituras ni "custom error responses" 403/404 → index.html,
// que en CloudFront son globales y también enmascararían los 401/403/404 de /api/*.
export type Route = 'login' | 'welcome'

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  return path === '/login' ? 'login' : 'welcome'
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => parse(window.location.hash), () => 'login' as Route)
}

export function navigate(route: Route, { replace = false } = {}): void {
  const hash = route === 'login' ? '#/login' : '#/'
  if (window.location.hash === hash) return
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = hash
  }
}
