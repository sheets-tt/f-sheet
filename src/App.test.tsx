import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  sessionStorage.clear()
  window.location.hash = ''
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function fillAndSubmit(username: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Usuario'), username)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  return user
}

describe('flujo de login', () => {
  it('sin sesión redirige a #/login', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/login')
  })

  it('login OK → muestra la bienvenida con displayName de /me', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url === '/api/auth/login')
        return json(200, {
          access_token: 'jwt-123',
          token_type: 'Bearer',
          expires_in: 3600,
          username: 'demo@sheets.tt',
          roles: [],
        })
      if (url === '/api/me') return json(200, { username: 'demo@sheets.tt', displayName: 'Usuario Demo' })
      return json(404)
    })

    render(<App />)
    await fillAndSubmit('demo@sheets.tt', 'Demo1234!')

    expect(await screen.findByRole('heading', { name: 'Hola, Usuario Demo' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')

    const [loginUrl, loginInit] = fetchMock.mock.calls[0]
    expect(loginUrl).toBe('/api/auth/login')
    expect(loginInit?.method).toBe('POST')
    expect(JSON.parse(String(loginInit?.body))).toEqual({ username: 'demo@sheets.tt', password: 'Demo1234!' })

    const meInit = fetchMock.mock.calls.find(([u]) => u === '/api/me')?.[1]
    expect((meInit?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    expect(JSON.parse(sessionStorage.getItem('sheets-tt.session')!).accessToken).toBe('jwt-123')
  })

  it('401 en login → mensaje de error accesible y sigue en login', async () => {
    fetchMock.mockResolvedValue(json(401))

    render(<App />)
    await fillAndSubmit('demo@sheets.tt', 'mala')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Usuario o contraseña incorrectos.')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveValue('')
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(sessionStorage.getItem('sheets-tt.session')).toBeNull()
  })

  it('campos vacíos → error de validación sin llamar a la API', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Introduce tu usuario y contraseña.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('token expirado (401 en /me) → vuelve a login con aviso', async () => {
    sessionStorage.setItem(
      'sheets-tt.session',
      JSON.stringify({ accessToken: 'viejo', tokenType: 'Bearer', username: 'demo@sheets.tt', expiresAt: Date.now() + 60_000 }),
    )
    fetchMock.mockResolvedValue(json(401, { message: 'expired' }))

    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión ha expirado')
    expect(sessionStorage.getItem('sheets-tt.session')).toBeNull()
  })

  it('cerrar sesión borra el token y vuelve a login', async () => {
    sessionStorage.setItem(
      'sheets-tt.session',
      JSON.stringify({ accessToken: 't', tokenType: 'Bearer', username: 'demo@sheets.tt', expiresAt: Date.now() + 60_000 }),
    )
    fetchMock.mockResolvedValue(json(200, { username: 'demo@sheets.tt', displayName: 'Usuario Demo' }))

    render(<App />)
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Hola, Usuario Demo' })
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument())
    expect(sessionStorage.getItem('sheets-tt.session')).toBeNull()
  })
})
