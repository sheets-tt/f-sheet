import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, getMe, logout, type Me } from '../lib/api'
import type { Session } from '../lib/session'

interface Props {
  session: Session
  onSignedOut: (notice: string | null) => void
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; me: Me }
  | { status: 'error'; message: string }

export default function WelcomeScreen({ session, onSignedOut }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    getMe(ctrl.signal)
      .then((me) => setState({ status: 'ready', me }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        // Los 401 los gestiona el handler global (vuelve a login).
        if (err instanceof ApiError && err.status === 401) return
        setState({
          status: 'error',
          message: err instanceof ApiError ? err.message : 'No se pudo cargar tu perfil.',
        })
      })
    return () => ctrl.abort()
  }, [attempt])

  useEffect(() => {
    if (state.status === 'ready') {
      document.title = `Hola, ${state.me.displayName} · Sheets TT`
      headingRef.current?.focus()
    }
  }, [state])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    onSignedOut('Has cerrado sesión.')
  }, [onSignedOut])

  return (
    <section className="card" aria-labelledby="welcome-title" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && (
        <>
          <h1 id="welcome-title" className="visually-hidden">Bienvenida</h1>
          <div className="skeleton skeleton-title" aria-hidden="true" />
          <div className="skeleton skeleton-line" aria-hidden="true" />
          <p className="visually-hidden" role="status">Cargando tu perfil…</p>
        </>
      )}

      {state.status === 'ready' && (
        <>
          <p className="eyebrow">Bienvenida</p>
          <h1 id="welcome-title" ref={headingRef} tabIndex={-1}>
            Hola, {state.me.displayName}
          </h1>
          <p className="muted lead">
            Has iniciado sesión como <strong className="mono">{state.me.username || session.username}</strong>.
          </p>
        </>
      )}

      {state.status === 'error' && (
        <>
          <h1 id="welcome-title">Bienvenida</h1>
          <p className="alert" role="alert">
            {state.message}
          </p>
          <button type="button" className="btn btn-secondary" onClick={retry}>
            Reintentar
          </button>
        </>
      )}

      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </section>
  )
}
