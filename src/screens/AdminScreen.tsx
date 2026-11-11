import { useEffect } from 'react'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoTabla } from '../components/Esqueleto'
import { Estado } from '../components/Simbolo'
import { getCuentas, getDispositivos } from '../lib/api'
import { formatFecha } from '../lib/format'
import { useCarga } from '../lib/useCarga'

const ROL = { ADMINISTRADOR: 'Administrador', EXPERTO_CAMPO: 'Experto de campo' } as const

/** Solo se enlaza para ADMINISTRADOR; aun así el backend es quien autoriza (403). */
export default function AdminScreen() {
  // Secciones independientes: si una falla, la otra se sigue mostrando.
  const cuentas = useCarga((signal) => getCuentas(signal), [])
  const dispositivos = useCarga((signal) => getDispositivos(signal), [])

  useEffect(() => {
    document.title = 'Administración · Sheets TT'
  }, [])

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1>Administración</h1>
        <p className="muted">Cuentas con acceso y dispositivos que envían capturas.</p>
      </header>

      <section className="panel" aria-labelledby="titulo-cuentas">
        <h2 id="titulo-cuentas">Cuentas</h2>
        {cuentas.estado === 'cargando' && <EsqueletoTabla texto="Cargando cuentas…" filas={3} columnas={5} />}
        {cuentas.estado === 'error' && <ErrorCarga mensaje={cuentas.error} onReintentar={cuentas.reintentar} />}
        {cuentas.datos && (
          <div className="tabla-desplazable panel-tabla">
            <table className="tabla" aria-labelledby="titulo-cuentas">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Alta</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.datos.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombreCompleto}</td>
                    <td className="correo">{c.correo}</td>
                    <td>{ROL[c.rol]}</td>
                    <td><Estado tono={c.activa ? 'bien' : 'neutro'}>{c.activa ? 'Activa' : 'Desactivada'}</Estado></td>
                    <td className="nowrap">{formatFecha(c.fechaCreacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}
