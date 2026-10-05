import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { setUnauthorizedHandler } from './lib/api'
import { loadSession, type Session } from './lib/session'
import { navigate, useRoute } from './lib/router'

// Cada pantalla en su propio chunk: el login no descarga el código de bienvenida y viceversa.
const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const WelcomeScreen = lazy(() => import('./screens/WelcomeScreen'))

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

  // Guardia de rutas.
  const target = session ? 'welcome' : 'login'
  useEffect(() => {
    if (route !== target) navigate(target, { replace: true })
  }, [route, target])

  const handleLoggedIn = useCallback((s: Session) => {
    setNotice(null)
    setSession(s)
    navigate('welcome', { replace: true })
  }, [])

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
        <Suspense fallback={<div className="card" aria-busy="true"><p className="muted">Cargando…</p></div>}>
          {route === target &&
            (session ? (
              <WelcomeScreen session={session} onSignedOut={handleSignedOut} />
            ) : (
              <LoginScreen onLoggedIn={handleLoggedIn} notice={notice} />
            ))}
        </Suspense>
      </main>
    </div>
  )
}
