import { useEffect, useState, type FormEvent } from 'react'
import BarraSegmentada from '../components/BarraSegmentada'
import { Cargando, ErrorCarga } from '../components/EstadoCarga'
import FotoEvidencia from '../components/FotoEvidencia'
import { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../components/Simbolo'
import { buscarAnalisis, type Analisis, type EstadoSincronizacion, type FiltroAnalisis, type Resultado, type TipoImagen } from '../lib/api'
import {
  ETIQUETA_RESULTADO,
  ETIQUETA_SINCRONIZACION,
  ETIQUETA_TIPO,
  finDelDia,
  formatFecha,
  formatPorcentaje,
  inicioDelDia,
} from '../lib/format'
import { useCarga } from '../lib/useCarga'
import { partesCromatico } from './ResumenScreen'

const LIMITE = 100

interface Formulario {
  tipo: '' | TipoImagen
  resultado: '' | Resultado
  estado: '' | EstadoSincronizacion
  desde: string
  hasta: string
}

const VACIO: Formulario = { tipo: '', resultado: '', estado: '', desde: '', hasta: '' }

function aFiltro(f: Formulario): FiltroAnalisis {
  return {
    tipo: f.tipo || undefined,
    resultado: f.resultado || undefined,
    estado: f.estado || undefined,
    desde: inicioDelDia(f.desde),
    hasta: finDelDia(f.hasta),
    limite: LIMITE,
  }
}

export default function AnalisisScreen() {
  // `borrador` es lo que se edita; `aplicado` es lo que se consultó (cambia solo al enviar).
  const [borrador, setBorrador] = useState<Formulario>(VACIO)
  const [aplicado, setAplicado] = useState<Formulario>(VACIO)
  const clave = JSON.stringify(aplicado)
  const carga = useCarga((signal) => buscarAnalisis(aFiltro(aplicado), signal), [clave])
  const hayFiltros = clave !== JSON.stringify(VACIO)
  const [foto, setFoto] = useState<Analisis | null>(null)

  useEffect(() => {
    document.title = 'Análisis · Sheets TT'
  }, [])

  function aplicar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAplicado(borrador)
  }

  function quitar() {
    setBorrador(VACIO)
    setAplicado(VACIO)
  }

  const campo = <K extends keyof Formulario>(k: K) => ({
    value: borrador[k],
    onChange: (e: { target: { value: string } }) => setBorrador((b) => ({ ...b, [k]: e.target.value })),
  })

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1>Análisis</h1>
        <p className="muted">Capturas de corteza y follaje clasificadas en campo, de la más reciente a la más antigua.</p>
      </header>

      <form className="filtros" onSubmit={aplicar} aria-label="Filtros">
        <div className="field">
          <label htmlFor="f-desde">Desde</label>
          <input id="f-desde" type="date" {...campo('desde')} />
        </div>
        <div className="field">
          <label htmlFor="f-hasta">Hasta</label>
          <input id="f-hasta" type="date" {...campo('hasta')} />
        </div>
        <div className="field">
          <label htmlFor="f-tipo">Tipo</label>
          <select id="f-tipo" {...campo('tipo')}>
            <option value="">Todos</option>
            <option value="corteza">{ETIQUETA_TIPO.corteza}</option>
            <option value="follaje">{ETIQUETA_TIPO.follaje}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-resultado">Resultado</label>
          <select id="f-resultado" {...campo('resultado')}>
            <option value="">Todos</option>
            {(Object.keys(ETIQUETA_RESULTADO) as Resultado[]).map((r) => (
              <option key={r} value={r}>{ETIQUETA_RESULTADO[r]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-estado">Sincronización</label>
          <select id="f-estado" {...campo('estado')}>
            <option value="">Todas</option>
            {(Object.keys(ETIQUETA_SINCRONIZACION) as EstadoSincronizacion[]).map((s) => (
              <option key={s} value={s}>{ETIQUETA_SINCRONIZACION[s]}</option>
            ))}
          </select>
        </div>
        <div className="filtros-acciones">
          <button type="submit" className="btn btn-primary">Aplicar filtros</button>
          {/* Sin resultados, el botón vive en el mensaje vacío (no se duplica). */}
          {hayFiltros && carga.datos?.length !== 0 && (
            <button type="button" className="btn btn-ghost" onClick={quitar}>Quitar filtros</button>
          )}
        </div>
      </form>

      {carga.estado === 'cargando' && <Cargando texto="Cargando análisis…" lineas={5} />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} />}

      {carga.datos && (
        <div className={carga.recargando ? 'recargando' : undefined}>
          {carga.datos.length === 0 ? (
            <div className="vacio">
              <p>Ningún análisis coincide con estos filtros.</p>
              {hayFiltros && (
                <button type="button" className="btn btn-secondary" onClick={quitar}>Quitar filtros</button>
              )}
            </div>
          ) : (
            <>
              <p className="muted conteo" role="status">
                {carga.datos.length === LIMITE
                  ? `Se muestran los ${LIMITE} más recientes. Acota por fechas para ver los anteriores.`
                  : `${carga.datos.length} ${carga.datos.length === 1 ? 'análisis' : 'análisis'}`}
              </p>
              <div className="tabla-desplazable">
                <table className="tabla">
                  <caption className="visually-hidden">Análisis</caption>
                  <thead>
                    <tr>
                      <th scope="col">Captura</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Resultado</th>
                      <th scope="col" className="num">Confianza</th>
                      <th scope="col">Sincronización</th>
                      <th scope="col">Cromático</th>
                      <th scope="col">Observaciones</th>
                      <th scope="col"><span className="visually-hidden">Foto</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carga.datos.map((a) => (
                      <tr key={a.id}>
                        <td className="nowrap">{formatFecha(a.fechaCaptura)}</td>
                        <td>{ETIQUETA_TIPO[a.tipoImagen]}</td>
                        <td><Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado></td>
                        <td className="num">{formatPorcentaje(a.confianza)}</td>
                        <td><Estado tono={TONO_SINCRONIZACION[a.estadoSincronizacion]}>{ETIQUETA_SINCRONIZACION[a.estadoSincronizacion]}</Estado></td>
                        <td className="celda-barra">
                          {a.cromatico ? (
                            <BarraSegmentada titulo="Cromático" modo="porcentaje" variante="delgada" partes={partesCromatico(a.cromatico)} />
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="observaciones">{a.observaciones ?? <span className="muted">—</span>}</td>
                        <td>
                          {a.tieneEvidencia && (
                            <button
                              type="button"
                              className="enlace"
                              aria-label={`Ver foto del ${formatFecha(a.fechaCaptura)}`}
                              onClick={() => setFoto(a)}
                            >
                              Ver foto
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      {foto && <FotoEvidencia analisis={foto} onCerrar={() => setFoto(null)} />}
    </div>
  )
}
