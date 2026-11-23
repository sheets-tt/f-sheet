import { useEffect, useRef } from 'react'
import type { Analisis } from '../../lib/api'
import { certezaDe, claveLugar, ETIQUETA_NIVEL, lugarDe, motivosAtencion, nivelConfianza, usaCerteza, vecinos } from '../../lib/analisis'
import { ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../../lib/format'
import { hrefDe } from '../../lib/router'
import {
  ETIQUETA_ENVIO,
  etiquetaDispositivo,
  fraseResultado,
  partesFollaje,
  queHacer,
  SENTIDO_FOLLAJE,
  TITULO_CERTEZA,
  TITULO_ENVIO,
  TITULO_FOLLAJE,
} from '../../lib/lenguaje'
import BarraSegmentada from '../BarraSegmentada'
import { Autor, Dispositivo, Observaciones } from '../Campo'
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
  const nivel = nivelConfianza(certezaDe(a))
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

        <div className="detalle-info">
          <div className="detalle-diagnostico">
            <p className={`detalle-resultado detalle-resultado-${TONO_RESULTADO[a.resultadoClasificacion]}`}>
              <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{fraseResultado(a.resultadoClasificacion)}</Estado>
            </p>
            <div className="que-hacer">
              <h3>Qué hacer</h3>
              <p>{queHacer(a.resultadoClasificacion, nivel, l?.tipo ?? null)}</p>
            </div>
          </div>

          <dl className="detalle-datos">
            {usaCerteza(a) ? (
              <div>
                <dt>{TITULO_CERTEZA}</dt>
                <dd>
                  {ETIQUETA_NIVEL[nivel]}
                  {a.confianza !== null && <span className="muted"> ({formatPorcentaje(a.confianza)})</span>}
                  <Medidor fraccion={a.confianza ?? 0} />
                </dd>
              </div>
            ) : (
              // El follaje se diagnostica por su color, no por una certeza: sus porcentajes van en
              // «Color del follaje» (más abajo). Aquí solo se avisa si no llegaron.
              !a.cromatico && (
                <div>
                  <dt>{TITULO_FOLLAJE}</dt>
                  <dd className="muted">Sin datos de color</dd>
                </div>
              )
            )}
            <div>
              <dt>Tipo de foto</dt>
              <dd>{ETIQUETA_TIPO[a.tipoImagen]}</dd>
            </div>
            <div>
              <dt>Árbol o zona</dt>
              <dd>{l ? <a href={hrefDe(l.tipo, l.id)}>{nombre}</a> : <span className="muted">Sin árbol ni zona</span>}</dd>
            </div>
            <div>
              <dt>Foto tomada</dt>
              <dd>{fecha}</dd>
            </div>
            <div>
              <dt>Subido por</dt>
              <dd>
                <Autor analisis={a} soloNombre />
              </dd>
            </div>
            {etiquetaDispositivo(a.dispositivo) && (
              <div>
                <dt>Dispositivo</dt>
                <dd>
                  <Dispositivo analisis={a} />
                </dd>
              </div>
            )}
            <div>
              <dt>{TITULO_ENVIO}</dt>
              <dd>
                <Estado tono={TONO_SINCRONIZACION[a.estadoSincronizacion]}>{ETIQUETA_ENVIO[a.estadoSincronizacion]}</Estado>
                {a.fechaSincronizacion && <span className="muted"> · {formatFecha(a.fechaSincronizacion)}</span>}
              </dd>
            </div>
            {a.latitudCaptura !== null && a.longitudCaptura !== null && (
              <div>
                <dt>Dónde se tomó</dt>
                <dd>
                  {coord.format(a.latitudCaptura)}, {coord.format(a.longitudCaptura)}
                </dd>
              </div>
            )}
            <div>
              <dt>Requiere atención</dt>
              <dd>{motivos.length ? motivos.join(', ') : 'No'}</dd>
            </div>
            {a.cromatico && (
              <div className="detalle-ancho">
                <dt>{TITULO_FOLLAJE}</dt>
                <dd>
                  <BarraSegmentada titulo={TITULO_FOLLAJE} modo="porcentaje" variante="delgada" partes={partesFollaje(a.cromatico)} />
                  <span className="muted bloque-nota">{SENTIDO_FOLLAJE}</span>
                </dd>
              </div>
            )}
          </dl>

          <Observaciones analisis={a} vacio="discreto" titulo="h3" />

          <DetalleTecnico analisis={a} />
        </div>

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

const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 })

/** Los valores tal como los guarda el sistema, para quien los necesite (plegado por defecto). */
function DetalleTecnico({ analisis: a }: { analisis: Analisis }) {
  return (
    <details className="detalle-tecnico">
      <summary>Detalle técnico</summary>
      <dl>
        <div>
          <dt>Clasificación del modelo</dt>
          <dd>
            <code>{a.resultadoClasificacion}</code>
          </dd>
        </div>
        {usaCerteza(a) && (
          <div>
            <dt>Confianza del modelo</dt>
            <dd>{a.confianza === null ? 'sin dato' : <code>{decimal.format(a.confianza)}</code>}</dd>
          </div>
        )}
        {a.cromatico && (
          <div>
            <dt>Análisis cromático</dt>
            <dd>
              <code>
                pct_sano {decimal.format(a.cromatico.pctSano)} · pct_regular {decimal.format(a.cromatico.pctRegular)} · pct_danado{' '}
                {decimal.format(a.cromatico.pctDanado)} · pct_incierto {decimal.format(a.cromatico.pctIncierto)}
              </code>
            </dd>
          </div>
        )}
        <div>
          <dt>Estado de sincronización</dt>
          <dd>
            <code>{a.estadoSincronizacion}</code>
          </dd>
        </div>
        <div>
          <dt>Identificador del análisis</dt>
          <dd>
            <code>{a.id}</code>
          </dd>
        </div>
      </dl>
    </details>
  )
}
