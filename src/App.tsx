import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Encabezado from './components/Encabezado'
import { logout, setUnauthorizedHandler } from './lib/api'
import { esAdministrador, loadSession, type Session } from './lib/session'
import { navigate, useRoute, type Route } from './lib/router'

// Cada pantalla en su propio chunk: el login no descarga el plano ni las tablas, y viceversa.
const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const ResumenScreen = lazy(() => import('./screens/ResumenScreen'))
const MapaScreen = lazy(() => import('./screens/MapaScreen'))
const AnalisisScreen = lazy(() => import('./screens/AnalisisScreen'))
const AdminScreen = lazy(() => import('./screens/AdminScreen'))

/** Guardia de rutas: sin sesión → login; con sesión, login → resumen; admin solo para ADMINISTRADOR. */
function destino(ruta: Route, session: Session | null): Route {
  if (!session) return 'login'
  if (ruta === 'login') return 'resumen'
  if (ruta === 'admin' && !esAdministrador(session)) return 'resumen'
  return ruta
}

export default function App() {
  const route = useRoute()
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [notice, setNotice] = useState<string | null>(null)

  const handleSignedOut = useCallback((message: string | null) => {
    setSession(null)
    setNotice(message)
    navigate('login', { replace: true })
  }, [])

  // 401 en cualquier petición autenticada → vuelta a login con aviso.
  useEffect(() => {
    setUnauthorizedHandler(() => handleSignedOut('Tu sesión ha expirado. Inicia sesión de nuevo.'))
    return () => setUnauthorizedHandler(null)
  }, [handleSignedOut])

  const target = destino(route, session)
  useEffect(() => {
    if (route !== target) navigate(target, { replace: true })
  }, [route, target])

  const handleLoggedIn = useCallback((s: Session) => {
    setNotice(null)
    setSession(s)
    navigate('resumen', { replace: true })
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    handleSignedOut('Has cerrado sesión.')
  }, [handleSignedOut])

  const fallback = (
    <div className="card" aria-busy="true">
      <p className="muted">Cargando…</p>
    </div>
  )

  if (!session) {
    return (
      <div className="shell">
        <a className="skip-link" href="#main">Saltar al contenido</a>
        <header className="topbar">
          <span className="brand" aria-label="Sheets TT">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="7" fill="currentColor" />
              <path d="M9 10h14M9 16h14M9 22h9" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Sheets&nbsp;TT
          </span>
        </header>
        <main id="main" className="main">
          <Suspense fallback={fallback}>
            {route === target && <LoginScreen onLoggedIn={handleLoggedIn} notice={notice} />}
          </Suspense>
        </main>
      </div>
    )
  }

  return (
    <div className="shell shell-app">
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <Encabezado
        ruta={target}
        esAdmin={esAdministrador(session)}
        username={session.username}
        onCerrarSesion={handleLogout}
      />
      <main id="main" className="main main-app" tabIndex={-1}>
        <Suspense fallback={fallback}>
          {route === target && (
            <>
              {target === 'resumen' && <ResumenScreen />}
              {target === 'mapa' && <MapaScreen />}
              {target === 'analisis' && <AnalisisScreen />}
              {target === 'admin' && <AdminScreen />}
            </>
          )}
        </Suspense>
      </main>
    </div>
  )
}
