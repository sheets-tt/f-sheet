import { useEffect, useRef } from 'react'
import type { Analisis } from '../../lib/api'
import { claveLugar, ETIQUETA_NIVEL, lugarDe, motivosAtencion, nivelConfianza, vecinos } from '../../lib/analisis'
import { ETIQUETA_RESULTADO, ETIQUETA_SINCRONIZACION, ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../../lib/format'
import { hrefDe } from '../../lib/router'
import { partesCromatico } from '../../screens/ResumenScreen'
import BarraSegmentada from '../BarraSegmentada'
import Dialogo from '../Dialogo'
import { ImagenEvidencia } from '../FotoEvidencia'
import { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../Simbolo'
import { Medidor } from './CajasCategoria'

interface Props {
  analisis: Analisis
  /** Todos los cargados: para el anterior y el siguiente del mismo lugar. */
  todos: Analisis[]
  nombres: Map<string, string>
  onCambiar: (a: Analisis) => void
  onCerrar: () => void
}

const coord = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 5, maximumFractionDigits: 5 })

/** Detalle de un análisis: foto grande, todos los datos y enlaces al seguimiento y a Gráficos. */
export default function DetalleAnalisis({ analisis: a, todos, nombres, onCambiar, onCerrar }: Props) {
  const l = lugarDe(a)
  const nombre = l ? (nombres.get(claveLugar(l)) ?? (l.tipo === 'arbol' ? 'Árbol' : 'Zona')) : null
  const { anterior, siguiente } = vecinos(todos, a)
  const motivos = motivosAtencion(a)
  const fecha = formatFecha(a.fechaCaptura)
  const cerrar = useRef<HTMLButtonElement>(null)

  // Al pasar al anterior/siguiente, si el botón usado queda deshabilitado (era el primero o el
  // último de ese lugar), el foco pasa a "Cerrar" en vez de caer al <body>.
  useEffect(() => {
    const foco = document.activeElement
    if (foco === document.body || (foco instanceof HTMLButtonElement && foco.disabled)) cerrar.current?.focus()
  }, [a.id])

  return (
    <Dialogo titulo={`Análisis del ${fecha}`} onCerrar={onCerrar} ancho="ancho">
      <div className="detalle-analisis">
        <div className="detalle-foto">
          {a.tieneEvidencia ? (
            // key: al pasar al anterior/siguiente, la foto se vuelve a pedir desde cero.
            <ImagenEvidencia key={a.id} analisis={a} />
          ) : (
            <p className="tarjeta-sin-foto">Este análisis no tiene foto.</p>
          )}
        </div>

        <dl className="detalle-datos">
          <div>
            <dt>Resultado</dt>
            <dd>
              <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado>
            </dd>
          </div>
          <div>
            <dt>Confianza</dt>
            <dd>
              {formatPorcentaje(a.confianza)} <span className="muted">({ETIQUETA_NIVEL[nivelConfianza(a.confianza)].toLowerCase()})</span>
              <Medidor fraccion={a.confianza ?? 0} />
            </dd>
          </div>
          <div>
            <dt>Tipo de imagen</dt>
            <dd>{ETIQUETA_TIPO[a.tipoImagen]}</dd>
          </div>
          <div>
            <dt>Árbol o zona</dt>
            <dd>{l ? <a href={hrefDe(l.tipo, l.id)}>{nombre}</a> : <span className="muted">Sin árbol ni zona</span>}</dd>
          </div>
          <div>
            <dt>Captura</dt>
            <dd>{fecha}</dd>
          </div>
          <div>
            <dt>Sincronización</dt>
            <dd>
              <Estado tono={TONO_SINCRONIZACION[a.estadoSincronizacion]}>{ETIQUETA_SINCRONIZACION[a.estadoSincronizacion]}</Estado>
              {a.fechaSincronizacion && <span className="muted"> · {formatFecha(a.fechaSincronizacion)}</span>}
            </dd>
          </div>
          {a.latitudCaptura !== null && a.longitudCaptura !== null && (
            <div>
              <dt>Ubicación de la captura</dt>
              <dd>
                {coord.format(a.latitudCaptura)}, {coord.format(a.longitudCaptura)}
              </dd>
            </div>
          )}
          <div>
            <dt>Requiere atención</dt>
            <dd>{motivos.length ? motivos.join(', ') : 'No'}</dd>
          </div>
          <div className="detalle-ancho">
            <dt>Observaciones</dt>
            <dd>{a.observaciones ?? <span className="muted">Sin observaciones</span>}</dd>
          </div>
          {a.cromatico && (
            <div className="detalle-ancho">
              <dt>Cromático del follaje</dt>
              <dd>
                <BarraSegmentada titulo="Cromático" modo="porcentaje" variante="delgada" partes={partesCromatico(a.cromatico)} />
              </dd>
            </div>
          )}
        </dl>

        {l && (
          <p className="detalle-enlaces">
            <a className="btn btn-secondary btn-chico" href={hrefDe(l.tipo, l.id)}>
              Ver seguimiento de {nombre}
            </a>
            <a className="btn btn-ghost btn-chico" href={`#/graficos?${l.tipo}=${encodeURIComponent(l.id)}`}>
              Ver en Gráficos
            </a>
          </p>
        )}

        <div className="dialogo-acciones detalle-acciones">
          {l && (
            <div className="detalle-vecinos" role="group" aria-label={`Otros análisis de ${nombre}`}>
              <button type="button" className="btn btn-ghost btn-chico" disabled={!anterior} onClick={() => anterior && onCambiar(anterior)}>
                Anterior de este lugar
              </button>
              <button type="button" className="btn btn-ghost btn-chico" disabled={!siguiente} onClick={() => siguiente && onCambiar(siguiente)}>
                Siguiente de este lugar
              </button>
              {(!anterior || !siguiente) && (
                <p className="detalle-nota">
                  {!anterior && !siguiente
                    ? 'Es el único análisis de este lugar entre los cargados.'
                    : !anterior
                      ? 'Es el más antiguo de este lugar entre los cargados.'
                      : 'Es el más reciente de este lugar entre los cargados.'}{' '}
                  Solo se recorren los análisis que trajeron los filtros de arriba.
                </p>
              )}
            </div>
          )}
          <button type="button" className="btn btn-primary" onClick={onCerrar} data-autofocus ref={cerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </Dialogo>
  )
}
