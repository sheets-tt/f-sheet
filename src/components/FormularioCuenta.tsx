import { useId, useRef, useState, type FormEvent } from 'react'
import { ApiError, crearCuenta, editarCuenta, type CuentaResumen } from '../lib/api'
import {
  datosDe,
  ETIQUETA_ROL,
  formDe,
  formVacio,
  validarCuenta,
  type CampoCuenta,
  type ErroresCuenta,
  type FormCuenta,
} from '../lib/cuentas'
import Dialogo from './Dialogo'

interface Props {
  /** Sin cuenta: alta. Con cuenta: edición. */
  cuenta?: CuentaResumen
  /** La cuenta de la sesión: no puede quitarse el rol de administrador. */
  propia?: boolean
  onGuardada: (cuenta: CuentaResumen) => void
  onCerrar: () => void
}

const ORDEN: CampoCuenta[] = ['nombreCompleto', 'correo', 'rol', 'contrasena', 'confirmacion']

export default function FormularioCuenta({ cuenta, propia = false, onGuardada, onCerrar }: Props) {
  const modo = cuenta ? 'editar' : 'crear'
  const [form, setForm] = useState<FormCuenta>(() => (cuenta ? formDe(cuenta) : formVacio()))
  const [errores, setErrores] = useState<ErroresCuenta>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const alertaRef = useRef<HTMLDivElement>(null)

  const campoId = (c: CampoCuenta) => `${id}-${c}`
  const errorId = (c: CampoCuenta) => `${id}-${c}-error`
  const ayudaId = (c: CampoCuenta) => `${id}-${c}-ayuda`

  function cambiar(campo: CampoCuenta, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
    // El error de un campo se quita en cuanto se corrige; los demás se quedan hasta el siguiente envío.
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function enfocar(campo: CampoCuenta) {
    formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(campoId(campo))}`)?.focus()
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (guardando) return
    const nuevos = validarCuenta(form, modo)
    setErrores(nuevos)
    setErrorServidor(null)
    const primero = ORDEN.find((c) => nuevos[c])
    if (primero) {
      enfocar(primero)
      return
    }
    setGuardando(true)
    try {
      const datos = datosDe(form)
      const guardada = cuenta
        ? await editarCuenta(cuenta.id, datos)
        : await crearCuenta({ ...datos, contrasena: datos.contrasena ?? '' })
      onGuardada(guardada)
    } catch (err) {
      setGuardando(false)
      const mensaje = err instanceof ApiError ? err.message : 'No se pudo guardar la cuenta. Inténtalo de nuevo.'
      // 409 por correo repetido: el error va en el campo, que es lo que hay que cambiar.
      if (err instanceof ApiError && err.status === 409 && /correo/i.test(mensaje)) {
        setErrores({ correo: mensaje })
        // Tras el render que vuelve a habilitar el campo.
        requestAnimationFrame(() => enfocar('correo'))
        return
      }
      setErrorServidor(mensaje)
      requestAnimationFrame(() => alertaRef.current?.focus())
    }
  }

  function atributos(campo: CampoCuenta, ayuda = false) {
    const describe = [errores[campo] && errorId(campo), ayuda && ayudaId(campo)].filter(Boolean).join(' ')
    return {
      id: campoId(campo),
      name: campo,
      'aria-invalid': errores[campo] ? (true as const) : undefined,
      'aria-describedby': describe || undefined,
      disabled: guardando,
    }
  }

  function error(campo: CampoCuenta) {
    return errores[campo] ? (
      <p className="field-error" id={errorId(campo)}>
        {errores[campo]}
      </p>
    ) : null
  }

  // b-sheet guarda el correo recortado y en minúsculas; si el de la sesión cambia, invalida el token.
  const cambiaCorreoPropio = propia && !!cuenta && form.correo.trim().toLowerCase() !== cuenta.correo.trim().toLowerCase()
  const avisoId = `${id}-aviso`

  const titulo = cuenta ? 'Editar cuenta' : 'Crear cuenta'
  const accion = cuenta ? 'Guardar cambios' : 'Crear cuenta'

  return (
    <Dialogo
      titulo={titulo}
      descripcion={cuenta ? <p className="muted">{cuenta.correo}</p> : <p className="muted">Solo un administrador puede dar de alta cuentas.</p>}
      onCerrar={onCerrar}
      bloqueado={guardando}
    >
      <div ref={alertaRef} tabIndex={-1} className="alert-slot" aria-live="assertive" aria-atomic="true">
        {errorServidor && (
          <p className="alert" role="alert">
            {errorServidor}
          </p>
        )}
      </div>

      <form ref={formRef} onSubmit={enviar} noValidate className="form-cuenta">
        <div className="field">
          <label htmlFor={campoId('nombreCompleto')}>Nombre completo</label>
          <input
            {...atributos('nombreCompleto')}
            type="text"
            autoComplete="off"
            maxLength={300}
            data-autofocus
            value={form.nombreCompleto}
            onChange={(e) => cambiar('nombreCompleto', e.target.value)}
          />
          {error('nombreCompleto')}
        </div>

        <div className="field">
          <label htmlFor={campoId('correo')}>Correo</label>
          <input
            {...atributos('correo')}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={form.correo}
            onChange={(e) => cambiar('correo', e.target.value)}
          />
          {error('correo')}
        </div>

        <div className="field">
          <label htmlFor={campoId('rol')}>Rol</label>
          <select
            {...atributos('rol', propia)}
            disabled={guardando || propia}
            value={form.rol}
            onChange={(e) => cambiar('rol', e.target.value)}
          >
            <option value="" disabled>
              Elige un rol
            </option>
            <option value="EXPERTO_CAMPO">{ETIQUETA_ROL.EXPERTO_CAMPO}</option>
            <option value="ADMINISTRADOR">{ETIQUETA_ROL.ADMINISTRADOR}</option>
          </select>
          {propia && (
            <p className="field-ayuda" id={ayudaId('rol')}>
              Es tu cuenta: no puedes quitarte el rol de administrador.
            </p>
          )}
          {error('rol')}
        </div>

        <div className="field">
          <label htmlFor={campoId('contrasena')}>{cuenta ? 'Contraseña nueva' : 'Contraseña'}</label>
          <input
            {...atributos('contrasena', true)}
            type="password"
            autoComplete="new-password"
            value={form.contrasena}
            onChange={(e) => cambiar('contrasena', e.target.value)}
          />
          <p className="field-ayuda" id={ayudaId('contrasena')}>
            {cuenta ? 'Déjala vacía para conservar la actual. ' : ''}Al menos 8 caracteres.
          </p>
          {error('contrasena')}
        </div>

        <div className="field">
          <label htmlFor={campoId('confirmacion')}>Confirmar contraseña</label>
          <input
            {...atributos('confirmacion')}
            type="password"
            autoComplete="new-password"
            value={form.confirmacion}
            onChange={(e) => cambiar('confirmacion', e.target.value)}
          />
          {error('confirmacion')}
        </div>

        {cambiaCorreoPropio && (
          <p className="notice notice-aviso" id={avisoId}>
            Al cambiar tu correo tendrás que iniciar sesión de nuevo con el correo nuevo.
          </p>
        )}

        <div className="dialogo-acciones">
          <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={guardando}
            aria-busy={guardando}
            aria-describedby={cambiaCorreoPropio ? avisoId : undefined}
          >
            {guardando && <span className="spinner" aria-hidden="true" />}
            {guardando ? (cuenta ? 'Guardando cambios…' : 'Creando cuenta…') : accion}
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
