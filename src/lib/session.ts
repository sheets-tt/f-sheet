// Token JWT en sessionStorage: se borra al cerrar la pestaña.
// Todos los accesos van en try/catch (modo privado, storage bloqueado, cuotas…).
const KEY = 'sheets-tt.session'

export interface Session {
  accessToken: string
  tokenType: string
  username: string
  /** Epoch ms en que expira el token (según expires_in). */
  expiresAt: number
}

let memoryFallback: Session | null = null

export function saveSession(session: Session): void {
  memoryFallback = session
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* storage no disponible: queda en memoria */
  }
}

export function loadSession(): Session | null {
  let s: Session | null = memoryFallback
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) s = JSON.parse(raw) as Session
  } catch {
    /* ignorar y usar memoria */
  }
  if (!s || typeof s.accessToken !== 'string' || !s.accessToken) return null
  if (typeof s.expiresAt === 'number' && Date.now() >= s.expiresAt) {
    clearSession()
    return null
  }
  return s
}

export function clearSession(): void {
  memoryFallback = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nada que hacer */
  }
}
