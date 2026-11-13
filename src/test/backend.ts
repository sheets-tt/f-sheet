import type { Mock } from 'vitest'
import type { Analisis, Arbol, CuentaResumen, DispositivoResumen, Estadisticas, Zona } from '../lib/api'

// Mismos datos que b-sheet/src/main/resources/db/demo/V2__datos_demo.sql, ya en forma JSON.

export const ARBOLES: Arbol[] = [
  { id: 'b3', nombreEspecifico: 'Pino del cerro', especie: 'Pinus hartwegii', latitud: 19.4198, longitud: -99.1845, fechaRegistro: '2026-10-07T12:00:00Z', descripcion: null, ultimoAnalisis: null },
  { id: 'b2', nombreEspecifico: 'Ahuehuete de la calzada', especie: 'Taxodium mucronatum', latitud: 19.4213, longitud: -99.1831, fechaRegistro: '2026-10-05T17:30:00Z', descripcion: null, ultimoAnalisis: { id: 'e2', resultado: 'sano', fechaCaptura: '2026-10-06T10:00:00Z' } },
  { id: 'b1', nombreEspecifico: 'Oyamel del lago', especie: 'Abies religiosa', latitud: 19.4205, longitud: -99.1818, fechaRegistro: '2026-10-01T15:00:00Z', descripcion: 'Junto al lago menor', ultimoAnalisis: { id: 'e1', resultado: 'infestado', fechaCaptura: '2026-10-03T15:10:00Z' } },
]

export const ZONAS: Zona[] = [
  { id: 'c2', nombreZona: 'Zona calzada', latitudCentro: 19.422, longitudCentro: -99.184, radioMetros: null, fechaRegistro: '2026-10-06T18:00:00Z', descripcion: null, ultimoAnalisis: { id: 'e5', resultado: 'infestado', fechaCaptura: '2026-10-08T11:00:00Z' } },
  { id: 'c1', nombreZona: 'Zona lago menor', latitudCentro: 19.421, longitudCentro: -99.1825, radioMetros: 50, fechaRegistro: '2026-10-02T16:00:00Z', descripcion: 'Dosel mixto de oyameles', ultimoAnalisis: { id: 'e4', resultado: 'no_determinado', fechaCaptura: '2026-10-07T09:00:00Z' } },
]

const base = { tieneEvidencia: true, latitudCaptura: null, longitudCaptura: null, fechaSincronizacion: null, observaciones: null, idArbol: null, idZona: null, cromatico: null }

/** Orden del backend: captura más reciente primero (e5, e4, e2, e3, e1). */
export const ANALISIS: Analisis[] = [
  { ...base, id: 'e5', tieneEvidencia: false, fechaCaptura: '2026-10-08T11:00:00Z', estadoSincronizacion: 'error', tipoImagen: 'follaje', resultadoClasificacion: 'infestado', confianza: 0.77, idZona: 'c2' },
  { ...base, id: 'e4', fechaCaptura: '2026-10-07T09:00:00Z', estadoSincronizacion: 'pendiente', tipoImagen: 'follaje', resultadoClasificacion: 'no_determinado', confianza: 0.42, observaciones: 'Poca luz', idZona: 'c1', cromatico: { pctSano: 30, pctRegular: 20, pctDanado: 10, pctIncierto: 40 } },
  { ...base, id: 'e2', fechaCaptura: '2026-10-06T10:00:00Z', estadoSincronizacion: 'sincronizado', tipoImagen: 'corteza', resultadoClasificacion: 'sano', confianza: 0.88, idArbol: 'b2' },
  { ...base, id: 'e3', fechaCaptura: '2026-10-04T12:00:00Z', estadoSincronizacion: 'sincronizado', tipoImagen: 'follaje', resultadoClasificacion: 'sano', confianza: 0.95, idZona: 'c1', cromatico: { pctSano: 80, pctRegular: 10, pctDanado: 5, pctIncierto: 5 } },
  { ...base, id: 'e1', fechaCaptura: '2026-10-03T15:10:00Z', estadoSincronizacion: 'sincronizado', tipoImagen: 'corteza', resultadoClasificacion: 'infestado', confianza: 0.91, observaciones: 'Galerías visibles', idArbol: 'b1' },
]

export const ESTADISTICAS: Estadisticas = {
  totales: { arboles: 3, zonas: 2, analisis: 5, dispositivos: 1, arbolesConInfestacion: 1, zonasConInfestacion: 1 },
  analisisPorResultado: { sano: 2, infestado: 2, no_determinado: 1 },
  analisisPorTipo: { corteza: 2, follaje: 3 },
  analisisPorSincronizacion: { pendiente: 1, sincronizado: 3, error: 1 },
  cromaticoPromedio: { pctSano: 55, pctRegular: 15, pctDanado: 7.5, pctIncierto: 22.5 },
  ultimaCaptura: '2026-10-08T11:00:00Z',
}

export const CUENTAS: CuentaResumen[] = [
  { id: 'a2', correo: 'admin@sheets.tt', nombreCompleto: 'Administrador Demo', rol: 'ADMINISTRADOR', activa: true, fechaCreacion: '2026-10-01T00:00:00Z' },
  { id: 'a3', correo: 'baja@sheets.tt', nombreCompleto: 'Cuenta Desactivada', rol: 'EXPERTO_CAMPO', activa: false, fechaCreacion: '2026-10-01T00:00:00Z' },
  { id: 'a1', correo: 'demo@sheets.tt', nombreCompleto: 'Usuario Demo', rol: 'EXPERTO_CAMPO', activa: true, fechaCreacion: '2026-10-01T00:00:00Z' },
]

export const DISPOSITIVOS: DispositivoResumen[] = [
  { id: 'd1', identificadorUnico: 'demo-pixel-7-pro', nombreDispositivo: 'Pixel 7 Pro demo', estado: 'Activo', fechaRegistro: '2026-10-01T00:00:00Z', cuentaVigente: 'demo@sheets.tt' },
]

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type Respuesta = Response | ((url: URL, init?: RequestInit) => Response | Promise<Response>)

/**
 * Backend falso por ruta (sin el prefijo /api ni la query). Lo que no está en `rutas` responde 404.
 * Cada llamada queda en fetchMock.mock.calls para revisar URLs y cabeceras.
 */
export function mockBackend(fetchMock: Mock<typeof fetch>, rutas: Record<string, Respuesta> = {}): void {
  const defecto: Record<string, Respuesta> = {
    '/me': () => json(200, { username: 'demo@sheets.tt', displayName: 'Usuario Demo' }),
    '/estadisticas': () => json(200, ESTADISTICAS),
    '/arboles': () => json(200, ARBOLES),
    '/zonas': () => json(200, ZONAS),
    '/analisis': () => json(200, ANALISIS),
    '/cuentas': (_url, init) => cuentas.coleccion(init),
    '/dispositivos': () => json(200, DISPOSITIVOS),
  }
  const cuentas = cuentasEnMemoria()
  const todas = { ...defecto, ...rutas }
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const path = url.pathname.replace(/^\/api/, '')
    // Rutas con parámetro: /analisis/{id}/evidencia, /arboles/{id}, /zonas/{id}.
    const foto = /^\/analisis\/([^/]+)\/evidencia$/.exec(path)
    const uno = /^\/(arboles|zonas)\/([^/]+)$/.exec(path)
    const cuenta = /^\/cuentas\/([^/]+?)(?:\/(desactivar|activar))?$/.exec(path)
    if (cuenta) {
      const propia = todas[cuenta[2] ? `/cuentas/:id/${cuenta[2]}` : '/cuentas/:id']
      if (propia) return typeof propia === 'function' ? propia(url, init) : propia.clone()
      return cuentas.una(decodeURIComponent(cuenta[1]), cuenta[2] as 'desactivar' | 'activar' | undefined, init)
    }
    const ruta = foto
      ? (todas['/analisis/:id/evidencia'] ?? evidenciaPorDefecto(foto[1]))
      : uno
        ? (todas[`/${uno[1]}/:id`] ?? unoPorDefecto(uno[1] as 'arboles' | 'zonas', decodeURIComponent(uno[2])))
        : todas[path]
    if (!ruta) return json(404)
    return typeof ruta === 'function' ? ruta(url, init) : ruta.clone()
  })
}

/**
 * Cuentas con estado en memoria (una copia de CUENTAS por cada mockBackend), con las reglas de
 * b-sheet: 400 por datos inválidos, 404, 409 por correo repetido o por tocar la cuenta propia.
 */
function cuentasEnMemoria() {
  const lista: CuentaResumen[] = CUENTAS.map((c) => ({ ...c }))
  let siguiente = 1

  const cuerpo = (init?: RequestInit) => JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
  const yo = () => {
    try {
      return (JSON.parse(sessionStorage.getItem('sheets-tt.session') ?? '{}') as { username?: string }).username ?? ''
    } catch {
      return ''
    }
  }
  const repetido = (correo: string, salvo?: string) =>
    lista.some((c) => c.id !== salvo && c.correo.toLowerCase() === correo.toLowerCase())

  function invalido(b: Record<string, unknown>, crear: boolean): string | null {
    const correo = typeof b.correo === 'string' ? b.correo.trim() : ''
    const nombre = typeof b.nombreCompleto === 'string' ? b.nombreCompleto.trim() : ''
    const pass = typeof b.contrasena === 'string' ? b.contrasena : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'El correo no es válido.'
    if (!nombre || nombre.length > 255) return 'El nombre completo es obligatorio (máximo 255 caracteres).'
    if (b.rol !== 'ADMINISTRADOR' && b.rol !== 'EXPERTO_CAMPO') return 'El rol no es válido.'
    if ((crear || pass) && (pass.length < 8 || new TextEncoder().encode(pass).length > 72))
      return 'La contraseña debe tener entre 8 caracteres y 72 bytes.'
    return null
  }

  return {
    coleccion(init?: RequestInit): Response {
      if ((init?.method ?? 'GET') === 'GET') return json(200, lista)
      if (init?.method !== 'POST') return json(405)
      const b = cuerpo(init)
      const error = invalido(b, true)
      if (error) return json(400, { message: error })
      const correo = String(b.correo).trim().toLowerCase()
      if (repetido(correo)) return json(409, { message: 'Ya existe una cuenta con ese correo.' })
      const nueva: CuentaResumen = {
        id: `n${siguiente++}`,
        correo,
        nombreCompleto: String(b.nombreCompleto).trim(),
        rol: b.rol as CuentaResumen['rol'],
        activa: true,
        fechaCreacion: '2026-11-12T18:00:00Z',
      }
      lista.unshift(nueva)
      return json(201, nueva)
    },
    una(id: string, accion: 'desactivar' | 'activar' | undefined, init?: RequestInit): Response {
      const i = lista.findIndex((c) => c.id === id)
      if (i < 0) return json(404, { message: 'No existe la cuenta.' })
      const actual = lista[i]
      const propia = actual.correo.toLowerCase() === yo().toLowerCase()
      if (accion) {
        if (init?.method !== 'PATCH') return json(405)
        if (accion === 'desactivar' && propia) return json(409, { message: 'No puedes desactivar tu propia cuenta.' })
        lista[i] = { ...actual, activa: accion === 'activar' }
        return json(200, lista[i])
      }
      if (init?.method !== 'PUT') return json(405)
      const b = cuerpo(init)
      const error = invalido(b, false)
      if (error) return json(400, { message: error })
      const correo = String(b.correo).trim().toLowerCase()
      if (repetido(correo, id)) return json(409, { message: 'Ya existe una cuenta con ese correo.' })
      if (propia && b.rol !== 'ADMINISTRADOR') return json(409, { message: 'No puedes quitarte el rol de administrador.' })
      lista[i] = { ...actual, correo, nombreCompleto: String(b.nombreCompleto).trim(), rol: b.rol as CuentaResumen['rol'] }
      return json(200, lista[i])
    },
  }
}

/** Como b-sheet: el registro, o 404 si no existe. */
function unoPorDefecto(ruta: 'arboles' | 'zonas', id: string): Response {
  const registro = ruta === 'arboles' ? ARBOLES.find((a) => a.id === id) : ZONAS.find((z) => z.id === id)
  return registro ? json(200, registro) : json(404)
}

/** Como b-sheet: URL firmada para los análisis con foto, 404 para e5 (sin_imagen). */
function evidenciaPorDefecto(id: string): Response {
  if (!ANALISIS.find((a) => a.id === id)?.tieneEvidencia) return json(404, { message: 'Este análisis no tiene foto disponible.' })
  return json(200, {
    url: `https://descortezadores-archivos-prod.s3.amazonaws.com/evidencias/${id}.jpg?X-Amz-Signature=prueba`,
    expira: '2026-11-09T18:05:00Z',
  })
}

/** Sesión válida ya guardada (sin pasar por el login). */
export function conSesion(roles: string[] = ['EXPERTO_CAMPO'], username = 'demo@sheets.tt'): void {
  sessionStorage.setItem(
    'sheets-tt.session',
    JSON.stringify({ accessToken: 'jwt-test', tokenType: 'Bearer', username, roles, expiresAt: Date.now() + 60_000 }),
  )
}

/** URLs pedidas a una ruta (con su query), en orden. */
export function llamadasA(fetchMock: Mock<typeof fetch>, ruta: string): string[] {
  return fetchMock.mock.calls.map(([u]) => String(u)).filter((u) => u.split('?')[0] === `/api${ruta}`)
}
