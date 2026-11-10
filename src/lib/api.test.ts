import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buscarAnalisis, getCuentas, getEstadisticas, login, queryAnalisis } from './api'
import { loadSession, saveSession } from './session'

function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  sessionStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  saveSession({ accessToken: 't', tokenType: 'Bearer', username: 'demo@sheets.tt', roles: [], expiresAt: Date.now() + 60_000 })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('queryAnalisis', () => {
  it('sin filtros no agrega query string', () => {
    expect(queryAnalisis({})).toBe('')
  })

  it('omite vacíos y respeta un orden fijo de parámetros', () => {
    expect(
      queryAnalisis({ resultado: 'infestado', tipo: 'follaje', estado: undefined, desde: '', limite: 50 }),
    ).toBe('?tipo=follaje&resultado=infestado&limite=50')
  })

  it('codifica los instantes ISO', () => {
    expect(queryAnalisis({ desde: '2026-10-01T06:00:00.000Z' })).toBe('?desde=2026-10-01T06%3A00%3A00.000Z')
  })
})

describe('peticiones de consulta', () => {
  it('buscarAnalisis llama a /analisis con el filtro y el token', async () => {
    fetchMock.mockResolvedValue(json(200, []))
    await buscarAnalisis({ tipo: 'corteza', arbol: 'b1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/analisis?tipo=corteza&arbol=b1')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer t')
  })

  it('400 conserva el mensaje del backend', async () => {
    fetchMock.mockResolvedValue(json(400, { message: 'desde no puede ser posterior a hasta' }))
    await expect(buscarAnalisis({})).rejects.toEqual(new ApiError(400, 'desde no puede ser posterior a hasta'))
  })

  it('403 explica que falta permiso y no cierra la sesión', async () => {
    fetchMock.mockResolvedValue(json(403, { message: 'Forbidden' }))
    await expect(getCuentas()).rejects.toEqual(new ApiError(403, 'Tu cuenta no tiene permiso para ver esta sección.'))
    expect(loadSession()).not.toBeNull()
  })

  it('getEstadisticas devuelve el cuerpo tal cual', async () => {
    const body = { totales: { arboles: 2 } }
    fetchMock.mockResolvedValue(json(200, body))
    await expect(getEstadisticas()).resolves.toEqual(body)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/estadisticas')
  })
})

describe('login', () => {
  it('guarda los roles del token en la sesión', async () => {
    fetchMock.mockResolvedValue(
      json(200, { access_token: 'a', token_type: 'Bearer', expires_in: 3600, username: 'admin@sheets.tt', roles: ['ADMINISTRADOR'] }),
    )
    const s = await login('admin@sheets.tt', 'x')
    expect(s.roles).toEqual(['ADMINISTRADOR'])
    expect(loadSession()?.roles).toEqual(['ADMINISTRADOR'])
  })
})
