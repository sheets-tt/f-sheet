import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError, login } from '../lib/api'
import type { Session } from '../lib/session'

interface Props {
  onLoggedIn: (s: Session) => void
  notice?: string | null
}

export default function LoginScreen({ onLoggedIn, notice }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const userRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Iniciar sesión · Sheets TT'
    userRef.current?.focus()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    const u = username.trim()
    if (!u || !password) {
      setError('Introduce tu usuario y contraseña.')
      ;(u ? document.getElementById('password') : userRef.current)?.focus()
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const session = await login(u, password)
      onLoggedIn(session)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ha ocurrido un error inesperado.')
      setPassword('')
      setSubmitting(false)
      requestAnimationFrame(() => errorRef.current?.focus())
    }
  }

  const invalid = error !== null

  return (
    <section className="card" aria-labelledby="login-title">
      <h1 id="login-title">Iniciar sesión</h1>
      <p className="muted lead">Accede con tu cuenta para continuar.</p>

      {notice && !error && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <div ref={errorRef} tabIndex={-1} aria-live="assertive" aria-atomic="true" className="alert-slot">
        {error && (
          <p className="alert" id="login-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate aria-describedby={invalid ? 'login-error' : undefined}>
        <div className="field">
          <label htmlFor="username">Usuario</label>
          <input
            ref={userRef}
            id="username"
            name="username"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={invalid || undefined}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={invalid || undefined}
            disabled={submitting}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
