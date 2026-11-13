import type { CuentaResumen, DatosCuenta, Rol } from './api'

export const ETIQUETA_ROL: Record<Rol, string> = { ADMINISTRADOR: 'Administrador', EXPERTO_CAMPO: 'Experto de campo' }

export interface FormCuenta {
  nombreCompleto: string
  correo: string
  rol: Rol | ''
  contrasena: string
  confirmacion: string
}

export type CampoCuenta = keyof FormCuenta
export type ErroresCuenta = Partial<Record<CampoCuenta, string>>

/** Mismos límites que b-sheet: bcrypt solo usa los primeros 72 bytes de la contraseña. */
export const MIN_CONTRASENA = 8
export const MAX_BYTES_CONTRASENA = 72
export const MAX_NOMBRE = 255
export const MAX_CORREO = 254

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

export function formVacio(): FormCuenta {
  return { nombreCompleto: '', correo: '', rol: '', contrasena: '', confirmacion: '' }
}

export function formDe(cuenta: CuentaResumen): FormCuenta {
  return { nombreCompleto: cuenta.nombreCompleto, correo: cuenta.correo, rol: cuenta.rol, contrasena: '', confirmacion: '' }
}

/**
 * Validación del formulario (la misma que aplica el backend, que es quien decide).
 * Al crear, la contraseña es obligatoria; al editar, vacía significa "conservar la actual".
 */
export function validarCuenta(form: FormCuenta, modo: 'crear' | 'editar'): ErroresCuenta {
  const errores: ErroresCuenta = {}
  const nombre = form.nombreCompleto.trim()
  const correo = form.correo.trim()

  if (!nombre) errores.nombreCompleto = 'Escribe el nombre completo.'
  else if (nombre.length > MAX_NOMBRE) errores.nombreCompleto = `Usa como máximo ${MAX_NOMBRE} caracteres.`

  if (!correo) errores.correo = 'Escribe el correo.'
  else if (correo.length > MAX_CORREO || !CORREO.test(correo))
    errores.correo = 'Escribe un correo válido, como nombre@dominio.mx.'

  if (!form.rol) errores.rol = 'Elige un rol.'

  const { contrasena } = form
  if (!contrasena) {
    if (modo === 'crear') errores.contrasena = 'Escribe una contraseña.'
  } else if (!contrasena.trim()) {
    // Al editar, b-sheet toma una contraseña en blanco como "conservar": no se cambiaría nada.
    errores.contrasena = 'La contraseña no puede ser solo espacios.'
  } else if ([...contrasena].length < MIN_CONTRASENA) {
    errores.contrasena = `Usa al menos ${MIN_CONTRASENA} caracteres.`
  } else if (bytesUtf8(contrasena) > MAX_BYTES_CONTRASENA) {
    errores.contrasena = 'Es demasiado larga: usa menos caracteres (máximo 72 bytes; los acentos y emojis ocupan más de uno).'
  }

  if (contrasena && !errores.contrasena && form.confirmacion !== contrasena)
    errores.confirmacion = 'Las contraseñas no coinciden.'
  else if (!contrasena && form.confirmacion && modo === 'editar')
    errores.contrasena = 'Escribe la contraseña nueva o borra la confirmación.'

  return errores
}

/** Lo que se envía: textos recortados y, al editar sin contraseña, sin el campo. */
export function datosDe(form: FormCuenta): DatosCuenta {
  const datos: DatosCuenta = {
    nombreCompleto: form.nombreCompleto.trim(),
    correo: form.correo.trim(),
    rol: form.rol as Rol,
  }
  if (form.contrasena) datos.contrasena = form.contrasena
  return datos
}

/** La cuenta de la sesión (el username del token es el correo). */
export function esPropia(cuenta: CuentaResumen, username: string): boolean {
  return cuenta.correo.trim().toLowerCase() === username.trim().toLowerCase()
}

export interface FiltroCuentas {
  texto: string
  rol: Rol | ''
  estado: 'activa' | 'desactivada' | ''
}

export function filtrarCuentas(cuentas: CuentaResumen[], f: FiltroCuentas): CuentaResumen[] {
  const texto = normalizar(f.texto.trim())
  return cuentas.filter(
    (c) =>
      (!texto || normalizar(c.nombreCompleto).includes(texto) || normalizar(c.correo).includes(texto)) &&
      (!f.rol || c.rol === f.rol) &&
      (!f.estado || (f.estado === 'activa') === c.activa),
  )
}

/** Sin mayúsculas ni acentos: "José" se encuentra escribiendo "jose". */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
