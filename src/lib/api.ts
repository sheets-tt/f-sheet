import { API_BASE_URL } from './config'
import { clearSession, loadSession, saveSession, type Session } from './session'

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  username: string
  roles: string[]
}

export interface Me {
  username: string
  displayName: string
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Se invoca cuando una petición autenticada recibe 401 (token inválido/expirado). */
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  onUnauthorized = fn
}

async function readMessage(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text()
    if (!text) return undefined
    const body = JSON.parse(text) as { message?: unknown }
    return typeof body.message === 'string' ? body.message : undefined
  } catch {
    return undefined
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth) {
    const s = loadSession()
    if (!s) {
      onUnauthorized?.()
      throw new ApiError(401, 'Tu sesión ha expirado. Inicia sesión de nuevo.')
    }
    headers.Authorization = `Bearer ${s.accessToken}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: 'omit',
      cache: 'no-store',
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  if (!res.ok) {
    const msg = await readMessage(res)
    if (res.status === 401 && opts.auth) {
      clearSession()
      onUnauthorized?.()
      throw new ApiError(401, 'Tu sesión ha expirado. Inicia sesión de nuevo.')
    }
    if (res.status === 401) throw new ApiError(401, 'Usuario o contraseña incorrectos.')
    if (res.status === 400) throw new ApiError(400, msg ?? 'Revisa los datos introducidos.')
    throw new ApiError(res.status, msg ?? `Error del servidor (${res.status}). Inténtalo más tarde.`)
  }

  return (await res.json()) as T
}

export async function login(username: string, password: string): Promise<Session> {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
  const session: Session = {
    accessToken: data.access_token,
    tokenType: data.token_type || 'Bearer',
    username: data.username || username,
    expiresAt: Date.now() + Math.max(0, Number(data.expires_in) || 3600) * 1000,
  }
  saveSession(session)
  return session
}

export function getMe(signal?: AbortSignal): Promise<Me> {
  return request<Me>('/me', { auth: true, signal })
}

export function logout(): void {
  clearSession()
}
