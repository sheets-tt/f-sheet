import { useEffect, useId, useRef, useState } from 'react'
import Dialogo from '../components/Dialogo'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoTabla } from '../components/Esqueleto'
import FormularioCuenta from '../components/FormularioCuenta'
import { Estado } from '../components/Simbolo'
import { activarCuenta, ApiError, desactivarCuenta, getCuentas, getDispositivos, type CuentaResumen } from '../lib/api'
import { ETIQUETA_ROL, esPropia, filtrarCuentas, type FiltroCuentas } from '../lib/cuentas'
import { formatFecha } from '../lib/format'
import { useCarga } from '../lib/useCarga'

interface Props {
  /** Correo de la sesión: su fila no se puede desactivar ni perder el rol de administrador. */
  username: string
  /** La cuenta propia cambió de correo: b-sheet invalidó el token y hay que volver a entrar. */
  onCorreoPropioCambiado: (correo: string) => void
}

type Accion =
  | { tipo: 'crear' }
  | { tipo: 'editar'; cuenta: CuentaResumen }
  | { tipo: 'desactivar' | 'activar'; cuenta: CuentaResumen }

const FILTRO_VACIO: FiltroCuentas = { texto: '', rol: '', estado: '' }

/** Solo se enlaza para ADMINISTRADOR; aun así el backend es quien autoriza (403). RF-26, RN-01. */
export default function AdminScreen({ username, onCorreoPropioCambiado }: Props) {
  // Secciones independientes: si una falla, la otra se sigue mostrando.
  const cuentas = useCarga((signal) => getCuentas(signal), [])
  const dispositivos = useCarga((signal) => getDispositivos(signal), [])
  // Cambios hechos aquí sobre la lista cargada: se aplican en su sitio, sin volver a pedir todo.
  const [editadas, setEditadas] = useState<CuentaResumen[] | null>(null)
  const [filtro, setFiltro] = useState<FiltroCuentas>(FILTRO_VACIO)
  const [accion, setAccion] = useState<Accion | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const origen = useRef<HTMLElement | null>(null)
  const ayudaPropiaId = useId()

  useEffect(() => {
    document.title = 'Administración · Sheets TT'
  }, [])

  const lista = editadas ?? cuentas.datos
  const filtradas = lista ? filtrarCuentas(lista, filtro) : []
  const hayFiltro = filtro.texto !== '' || filtro.rol !== '' || filtro.estado !== ''

  function abrir(a: Accion, boton: HTMLElement) {
    origen.current = boton
    setAviso(null)
    setAccion(a)
  }

  function cerrar() {
    setAccion(null)
    // El diálogo sale del DOM: el foco vuelve al botón que lo abrió (si sigue ahí).
    const boton = origen.current
    requestAnimationFrame(() => {
      if (boton?.isConnected) boton.focus()
    })
  }

  function aplicar(cuenta: CuentaResumen, mensaje: string) {
    setEditadas((previas) => {
      const base = previas ?? cuentas.datos ?? []
      return base.some((c) => c.id === cuenta.id) ? base.map((c) => (c.id === cuenta.id ? cuenta : c)) : [cuenta, ...base]
    })
    setAviso(mensaje)
    // Una cuenta recién creada que no pasa el filtro quedaría oculta: se quita el filtro.
    if (!filtrarCuentas([cuenta], filtro).length) setFiltro(FILTRO_VACIO)
    cerrar()
  }

  function reintentar() {
    setEditadas(null)
    cuentas.reintentar()
  }

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1>Administración</h1>
        <p className="muted">Cuentas con acceso y dispositivos que envían capturas.</p>
      </header>

      <section className="panel" aria-labelledby="titulo-cuentas">
        <div className="panel-titulo">
          <h2 id="titulo-cuentas">Cuentas</h2>
          {lista && (
            <button type="button" className="btn btn-primary btn-chico" onClick={(e) => abrir({ tipo: 'crear' }, e.currentTarget)}>
              Crear cuenta
            </button>
          )}
        </div>

        <div className="alert-slot" role="status" aria-live="polite" aria-atomic="true">
          {aviso && <p className="notice notice-exito">{aviso}</p>}
        </div>

        {cuentas.estado === 'cargando' && <EsqueletoTabla texto="Cargando cuentas…" filas={3} columnas={6} />}
        {cuentas.estado === 'error' && <ErrorCarga mensaje={cuentas.error} onReintentar={reintentar} />}
        {lista && (
          <>
            <form className="filtros filtros-cuentas" role="search" aria-label="Filtrar cuentas" onSubmit={(e) => e.preventDefault()}>
              <div className="field">
                <label htmlFor="filtro-texto">Buscar</label>
                <input
                  id="filtro-texto"
                  type="search"
                  placeholder="Nombre o correo"
                  autoComplete="off"
                  value={filtro.texto}
                  onChange={(e) => setFiltro((f) => ({ ...f, texto: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="filtro-rol">Rol</label>
                <select
                  id="filtro-rol"
                  value={filtro.rol}
                  onChange={(e) => setFiltro((f) => ({ ...f, rol: e.target.value as FiltroCuentas['rol'] }))}
                >
                  <option value="">Todos</option>
                  <option value="ADMINISTRADOR">{ETIQUETA_ROL.ADMINISTRADOR}</option>
                  <option value="EXPERTO_CAMPO">{ETIQUETA_ROL.EXPERTO_CAMPO}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="filtro-estado">Estado</label>
                <select
                  id="filtro-estado"
                  value={filtro.estado}
                  onChange={(e) => setFiltro((f) => ({ ...f, estado: e.target.value as FiltroCuentas['estado'] }))}
                >
                  <option value="">Todos</option>
                  <option value="activa">Activa</option>
                  <option value="desactivada">Desactivada</option>
                </select>
              </div>
            </form>

            <p className="muted conteo" aria-live="polite">
              {hayFiltro ? `${filtradas.length} de ${lista.length} cuentas` : `${lista.length} cuentas`}
              {hayFiltro && (
                <button type="button" className="enlace" onClick={() => setFiltro(FILTRO_VACIO)}>
                  Quitar filtros
                </button>
              )}
            </p>

            <div className={`tabla-desplazable panel-tabla${cuentas.recargando ? ' recargando' : ''}`}>
              <table className="tabla tabla-cuentas" aria-labelledby="titulo-cuentas">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Alta</th>
                    <th scope="col">
                      <span className="visually-hidden">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((c) => {
                    const propia = esPropia(c, username)
                    return (
                      <tr key={c.id}>
                        <td>
                          {c.nombreCompleto}
                          {propia && <span className="etiqueta-propia"> (tú)</span>}
                        </td>
                        <td className="correo">{c.correo}</td>
                        <td>{ETIQUETA_ROL[c.rol]}</td>
                        <td>
                          <Estado tono={c.activa ? 'bien' : 'neutro'}>{c.activa ? 'Activa' : 'Desactivada'}</Estado>
                        </td>
                        <td className="nowrap">{formatFecha(c.fechaCreacion)}</td>
                        <td>
                          <div className="acciones-fila">
                            <button
                              type="button"
                              className="btn btn-ghost btn-chico"
                              aria-label={`Editar ${c.correo}`}
                              onClick={(e) => abrir({ tipo: 'editar', cuenta: c }, e.currentTarget)}
                            >
                              Editar
                            </button>
                            {c.activa ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-chico btn-peligro"
                                aria-label={`Desactivar ${c.correo}`}
                                disabled={propia}
                                aria-describedby={propia ? ayudaPropiaId : undefined}
                                onClick={(e) => abrir({ tipo: 'desactivar', cuenta: c }, e.currentTarget)}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-chico"
                                aria-label={`Activar ${c.correo}`}
                                onClick={(e) => abrir({ tipo: 'activar', cuenta: c }, e.currentTarget)}
                              >
                                Activar
                              </button>
                            )}
                          </div>
                          {propia && (
                            <p className="field-ayuda" id={ayudaPropiaId}>
                              Es tu cuenta: no puedes desactivarla ni quitarte el rol.
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        Ninguna cuenta coincide con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="titulo-dispositivos">
        <h2 id="titulo-dispositivos">Dispositivos</h2>
        {dispositivos.estado === 'cargando' && <EsqueletoTabla texto="Cargando dispositivos…" filas={2} columnas={5} />}
        {dispositivos.estado === 'error' && (
          <ErrorCarga mensaje={dispositivos.error} onReintentar={dispositivos.reintentar} />
        )}
        {dispositivos.datos && (
          <div className="tabla-desplazable panel-tabla">
            <table className="tabla" aria-labelledby="titulo-dispositivos">
              <thead>
                <tr>
                  <th scope="col">Identificador</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Cuenta asociada</th>
                  <th scope="col">Registro</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.datos.map((d) => (
                  <tr key={d.id}>
                    <td className="correo">{d.identificadorUnico}</td>
                    <td>{d.nombreDispositivo ?? <span className="muted">—</span>}</td>
                    <td><Estado tono={d.estado === 'Activo' ? 'bien' : 'neutro'}>{d.estado}</Estado></td>
                    <td className="correo">{d.cuentaVigente ?? <span className="muted">Ninguna</span>}</td>
                    <td className="nowrap">{formatFecha(d.fechaRegistro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(accion?.tipo === 'crear' || accion?.tipo === 'editar') && (
        <FormularioCuenta
          cuenta={accion.tipo === 'editar' ? accion.cuenta : undefined}
          propia={accion.tipo === 'editar' && esPropia(accion.cuenta, username)}
          onCerrar={cerrar}
          onGuardada={(c) => {
            if (accion.tipo === 'editar' && esPropia(accion.cuenta, username) && !esPropia(c, username)) {
              onCorreoPropioCambiado(c.correo)
              return
            }
            aplicar(c, accion.tipo === 'crear' ? `Cuenta creada: ${c.correo}.` : `Cambios guardados: ${c.correo}.`)
          }}
        />
      )}
      {(accion?.tipo === 'desactivar' || accion?.tipo === 'activar') && (
        <ConfirmarEstado
          tipo={accion.tipo}
          cuenta={accion.cuenta}
          onCerrar={cerrar}
          onHecho={(c) => aplicar(c, accion.tipo === 'desactivar' ? `Cuenta desactivada: ${c.correo}.` : `Cuenta activada: ${c.correo}.`)}
        />
      )}
    </div>
  )
}

interface ConfirmarProps {
  tipo: 'desactivar' | 'activar'
  cuenta: CuentaResumen
  onHecho: (c: CuentaResumen) => void
  onCerrar: () => void
}

/** Paso de confirmación: desactivar corta el acceso web y la sincronización desde la app. */
function ConfirmarEstado({ tipo, cuenta, onHecho, onCerrar }: ConfirmarProps) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const desactivar = tipo === 'desactivar'
  const accion = desactivar ? 'Desactivar cuenta' : 'Activar cuenta'

  async function confirmar() {
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      onHecho(desactivar ? await desactivarCuenta(cuenta.id) : await activarCuenta(cuenta.id))
    } catch (err) {
      setEnviando(false)
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado de la cuenta.')
    }
  }

  return (
    <Dialogo
      titulo={`¿${accion}?`}
      descripcion={
        <p>
          {desactivar
            ? `${cuenta.nombreCompleto} (${cuenta.correo}) no podrá iniciar sesión hasta que vuelvas a activar la cuenta. Sus datos y capturas se conservan.`
            : `${cuenta.nombreCompleto} (${cuenta.correo}) podrá volver a iniciar sesión.`}
        </p>
      }
      onCerrar={onCerrar}
      bloqueado={enviando}
    >
      <div className="alert-slot" aria-live="assertive" aria-atomic="true">
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="dialogo-acciones">
        <button type="button" className="btn btn-ghost" onClick={onCerrar} disabled={enviando} data-autofocus>
          Cancelar
        </button>
        <button
          type="button"
          className={`btn ${desactivar ? 'btn-peligro-lleno' : 'btn-primary'}`}
          onClick={confirmar}
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando && <span className="spinner" aria-hidden="true" />}
          {enviando ? (desactivar ? 'Desactivando…' : 'Activando…') : accion}
        </button>
      </div>
    </Dialogo>
  )
}
