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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH'
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
    if (res.status === 403) throw new ApiError(403, 'Tu cuenta no tiene permiso para ver esta sección.')
    if (res.status === 404) throw new ApiError(404, 'No se encontró el registro.')
    if (res.status === 400) throw new ApiError(400, msg ?? 'Revisa los datos introducidos.')
    if (res.status === 409) throw new ApiError(409, msg ?? 'La operación choca con el estado actual del registro.')
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
    roles: Array.isArray(data.roles) ? data.roles : [],
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

// ---------------------------------------------------------------------------------------------
// Módulos de consulta (b-sheet, solo lectura)
// ---------------------------------------------------------------------------------------------
export type TipoImagen = 'corteza' | 'follaje'
export type Resultado = 'sano' | 'infestado' | 'no_determinado'
export type EstadoSincronizacion = 'pendiente' | 'sincronizado' | 'error'

/** Análisis más reciente de un árbol o zona (para el mapa); null si aún no tiene. */
export interface UltimoAnalisis {
  id: string
  resultado: Resultado
  fechaCaptura: string
}

export interface Arbol {
  id: string
  nombreEspecifico: string
  especie: string
  latitud: number | null
  longitud: number | null
  fechaRegistro: string | null
  descripcion: string | null
  ultimoAnalisis: UltimoAnalisis | null
}

export interface Zona {
  id: string
  nombreZona: string
  latitudCentro: number
  longitudCentro: number
  radioMetros: number | null
  fechaRegistro: string | null
  descripcion: string | null
  ultimoAnalisis: UltimoAnalisis | null
}

export interface Cromatico {
  pctSano: number
  pctRegular: number
  pctDanado: number
  pctIncierto: number
}

export interface Analisis {
  id: string
  /** Hay foto que se puede pedir con getEvidencia (la ruta interna de S3 no llega a la web). */
  tieneEvidencia: boolean
  latitudCaptura: number | null
  longitudCaptura: number | null
  fechaCaptura: string
  fechaSincronizacion: string | null
  estadoSincronizacion: EstadoSincronizacion
  tipoImagen: TipoImagen
  resultadoClasificacion: Resultado
  confianza: number | null
  observaciones: string | null
  idArbol: string | null
  idZona: string | null
  cromatico: Cromatico | null
}

export interface Estadisticas {
  totales: {
    arboles: number
    zonas: number
    analisis: number
    dispositivos: number
    arbolesConInfestacion: number
    zonasConInfestacion: number
  }
  analisisPorResultado: Record<Resultado, number>
  analisisPorTipo: Record<TipoImagen, number>
  analisisPorSincronizacion: Record<EstadoSincronizacion, number>
  cromaticoPromedio: Cromatico | null
  ultimaCaptura: string | null
}

export type Rol = 'ADMINISTRADOR' | 'EXPERTO_CAMPO'

export interface CuentaResumen {
  id: string
  correo: string
  nombreCompleto: string
  rol: Rol
  activa: boolean
  fechaCreacion: string | null
}

export interface DispositivoResumen {
  id: string
  identificadorUnico: string
  nombreDispositivo: string | null
  estado: string
  fechaRegistro: string | null
  cuentaVigente: string | null
}

/** Filtros de GET /analisis; los vacíos no se envían. Fechas como instantes ISO-8601. */
export interface FiltroAnalisis {
  tipo?: TipoImagen
  resultado?: Resultado
  estado?: EstadoSincronizacion
  desde?: string
  hasta?: string
  arbol?: string
  zona?: string
  limite?: number
}

const ORDEN_FILTROS: (keyof FiltroAnalisis)[] = ['tipo', 'resultado', 'estado', 'desde', 'hasta', 'arbol', 'zona', 'limite']

/** "?tipo=follaje&limite=50" en orden fijo, sin vacíos; "" si no hay filtros. */
export function queryAnalisis(filtro: FiltroAnalisis): string {
  const params = new URLSearchParams()
  for (const clave of ORDEN_FILTROS) {
    const valor = filtro[clave]
    if (valor !== undefined && valor !== '') params.set(clave, String(valor))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function getEstadisticas(signal?: AbortSignal): Promise<Estadisticas> {
  return request<Estadisticas>('/estadisticas', { auth: true, signal })
}

export function getArboles(signal?: AbortSignal): Promise<Arbol[]> {
  return request<Arbol[]>('/arboles', { auth: true, signal })
}

export function getZonas(signal?: AbortSignal): Promise<Zona[]> {
  return request<Zona[]>('/zonas', { auth: true, signal })
}

/** Un árbol con su último análisis; 404 si no existe. */
export function getArbol(id: string, signal?: AbortSignal): Promise<Arbol> {
  return request<Arbol>(`/arboles/${encodeURIComponent(id)}`, { auth: true, signal })
}

/** Una zona de follaje con su último análisis; 404 si no existe. */
export function getZona(id: string, signal?: AbortSignal): Promise<Zona> {
  return request<Zona>(`/zonas/${encodeURIComponent(id)}`, { auth: true, signal })
}

export function buscarAnalisis(filtro: FiltroAnalisis, signal?: AbortSignal): Promise<Analisis[]> {
  return request<Analisis[]>(`/analisis${queryAnalisis(filtro)}`, { auth: true, signal })
}

/** URL firmada y temporal de la foto (el bucket es privado); 404 si no tiene foto. */
export interface Evidencia {
  url: string
  expira: string
}

export async function getEvidencia(idAnalisis: string, signal?: AbortSignal): Promise<Evidencia> {
  try {
    return await request<Evidencia>(`/analisis/${encodeURIComponent(idAnalisis)}/evidencia`, { auth: true, signal })
  } catch (e) {
    // Aquí un 404 significa algo concreto: el análisis no tiene foto que se pueda mostrar.
    if (e instanceof ApiError && e.status === 404) throw new ApiError(404, 'Este análisis no tiene foto disponible.')
    throw e
  }
}

/** Solo ADMINISTRADOR (403 para los demás). */
export function getCuentas(signal?: AbortSignal): Promise<CuentaResumen[]> {
  return request<CuentaResumen[]>('/cuentas', { auth: true, signal })
}

/** Solo ADMINISTRADOR (403 para los demás). */
export function getDispositivos(signal?: AbortSignal): Promise<DispositivoResumen[]> {
  return request<DispositivoResumen[]>('/dispositivos', { auth: true, signal })
}

/** Alta o edición de una cuenta. En edición, `contrasena` vacía u omitida conserva la actual. */
export interface DatosCuenta {
  correo: string
  nombreCompleto: string
  rol: Rol
  contrasena?: string
}

const rutaCuenta = (id: string) => `/cuentas/${encodeURIComponent(id)}`

/** RN-01: solo ADMINISTRADOR crea cuentas. 409 si el correo ya existe. */
export function crearCuenta(datos: DatosCuenta & { contrasena: string }): Promise<CuentaResumen> {
  return request<CuentaResumen>('/cuentas', { method: 'POST', body: datos, auth: true })
}

/** 409 si el correo ya existe o si la cuenta propia perdería el rol de administrador. */
export function editarCuenta(id: string, datos: DatosCuenta): Promise<CuentaResumen> {
  const { contrasena, ...resto } = datos
  return request<CuentaResumen>(rutaCuenta(id), {
    method: 'PUT',
    body: contrasena ? { ...resto, contrasena } : resto,
    auth: true,
  })
}

/** 409 si es la cuenta propia. */
export function desactivarCuenta(id: string): Promise<CuentaResumen> {
  return request<CuentaResumen>(`${rutaCuenta(id)}/desactivar`, { method: 'PATCH', auth: true })
}

export function activarCuenta(id: string): Promise<CuentaResumen> {
  return request<CuentaResumen>(`${rutaCuenta(id)}/activar`, { method: 'PATCH', auth: true })
}
