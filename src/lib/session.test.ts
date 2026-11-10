import { beforeEach, describe, expect, it } from 'vitest'
import { esAdministrador, loadSession } from './session'

beforeEach(() => sessionStorage.clear())

describe('sesión', () => {
  it('una sesión guardada antes de existir roles se lee con roles vacíos', () => {
    sessionStorage.setItem(
      'sheets-tt.session',
      JSON.stringify({ accessToken: 't', tokenType: 'Bearer', username: 'u', expiresAt: Date.now() + 60_000 }),
    )
    expect(loadSession()?.roles).toEqual([])
  })

  it('esAdministrador depende del rol ADMINISTRADOR', () => {
    const base = { accessToken: 't', tokenType: 'Bearer', username: 'u', expiresAt: 0 }
    expect(esAdministrador({ ...base, roles: ['ADMINISTRADOR'] })).toBe(true)
    expect(esAdministrador({ ...base, roles: ['EXPERTO_CAMPO'] })).toBe(false)
    expect(esAdministrador(null)).toBe(false)
  })
})
