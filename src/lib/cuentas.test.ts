import { describe, expect, it } from 'vitest'
import { CUENTAS } from '../test/backend'
import { bytesUtf8, datosDe, esPropia, filtrarCuentas, validarCuenta, type FormCuenta } from './cuentas'

const valido: FormCuenta = {
  nombreCompleto: '  Ana Pérez ',
  correo: ' ana@sheets.tt ',
  rol: 'EXPERTO_CAMPO',
  contrasena: 'Segura123',
  confirmacion: 'Segura123',
}

describe('validarCuenta', () => {
  it('acepta un alta completa', () => {
    expect(validarCuenta(valido, 'crear')).toEqual({})
  })

  it('pide nombre, correo, rol y contraseña al crear', () => {
    expect(validarCuenta({ nombreCompleto: '  ', correo: '', rol: '', contrasena: '', confirmacion: '' }, 'crear')).toEqual({
      nombreCompleto: 'Escribe el nombre completo.',
      correo: 'Escribe el correo.',
      rol: 'Elige un rol.',
      contrasena: 'Escribe una contraseña.',
    })
  })

  it.each(['ana', 'ana@', 'ana@sheets', 'ana pérez@sheets.tt', `${'a'.repeat(250)}@sheets.tt`])('rechaza el correo %s', (correo) => {
    expect(validarCuenta({ ...valido, correo }, 'crear').correo).toBe('Escribe un correo válido, como nombre@dominio.mx.')
  })

  it('limita el nombre a 255 caracteres después de recortar', () => {
    expect(validarCuenta({ ...valido, nombreCompleto: ` ${'a'.repeat(255)} ` }, 'crear').nombreCompleto).toBeUndefined()
    expect(validarCuenta({ ...valido, nombreCompleto: 'a'.repeat(256) }, 'crear').nombreCompleto).toBe('Usa como máximo 255 caracteres.')
  })

  it('exige al menos 8 caracteres', () => {
    expect(validarCuenta({ ...valido, contrasena: 'Corta1', confirmacion: 'Corta1' }, 'crear').contrasena).toBe(
      'Usa al menos 8 caracteres.',
    )
  })

  it('cuenta el máximo en bytes UTF-8, no en caracteres', () => {
    const ascii = 'a'.repeat(72)
    const acentos = 'á'.repeat(37) // 74 bytes, 37 caracteres
    expect(bytesUtf8(acentos)).toBe(74)
    expect(validarCuenta({ ...valido, contrasena: ascii, confirmacion: ascii }, 'crear')).toEqual({})
    expect(validarCuenta({ ...valido, contrasena: acentos, confirmacion: acentos }, 'crear').contrasena).toMatch(/72 bytes/)
  })

  it('la confirmación tiene que coincidir', () => {
    expect(validarCuenta({ ...valido, confirmacion: 'Otra1234' }, 'crear')).toEqual({ confirmacion: 'Las contraseñas no coinciden.' })
  })

  it.each(['crear', 'editar'] as const)('al %s rechaza una contraseña de solo espacios', (modo) => {
    const espacios = ' '.repeat(10)
    expect(validarCuenta({ ...valido, contrasena: espacios, confirmacion: espacios }, modo)).toEqual({
      contrasena: 'La contraseña no puede ser solo espacios.',
    })
  })

  it('acepta espacios dentro de una contraseña con más caracteres', () => {
    expect(validarCuenta({ ...valido, contrasena: ' clave larga ', confirmacion: ' clave larga ' }, 'crear')).toEqual({})
  })

  it('al editar, la contraseña vacía conserva la actual', () => {
    expect(validarCuenta({ ...valido, contrasena: '', confirmacion: '' }, 'editar')).toEqual({})
    expect(validarCuenta({ ...valido, contrasena: 'corta', confirmacion: 'corta' }, 'editar').contrasena).toBeDefined()
  })
})

describe('datosDe', () => {
  it('recorta textos y omite la contraseña vacía', () => {
    expect(datosDe(valido)).toEqual({ nombreCompleto: 'Ana Pérez', correo: 'ana@sheets.tt', rol: 'EXPERTO_CAMPO', contrasena: 'Segura123' })
    expect(datosDe({ ...valido, contrasena: '', confirmacion: '' })).not.toHaveProperty('contrasena')
  })
})

describe('filtros y cuenta propia', () => {
  it('busca sin acentos ni mayúsculas, y filtra por rol y estado', () => {
    const ids = (f: Parameters<typeof filtrarCuentas>[1]) => filtrarCuentas(CUENTAS, f).map((c) => c.id)
    expect(ids({ texto: 'DEMO', rol: '', estado: '' })).toEqual(['a2', 'a1'])
    expect(ids({ texto: 'desactivádá', rol: '', estado: '' })).toEqual(['a3'])
    expect(ids({ texto: '', rol: 'EXPERTO_CAMPO', estado: 'activa' })).toEqual(['a1'])
    expect(ids({ texto: '', rol: '', estado: 'desactivada' })).toEqual(['a3'])
  })

  it('reconoce la cuenta de la sesión por el correo', () => {
    expect(esPropia(CUENTAS[0], 'Admin@Sheets.tt')).toBe(true)
    expect(esPropia(CUENTAS[2], 'admin@sheets.tt')).toBe(false)
  })
})
