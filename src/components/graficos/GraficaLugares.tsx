import { max } from 'd3-array'
import { scaleLinear } from 'd3-scale'
import { ETIQUETA_RESULTADO, formatFecha, formatPorcentaje } from '../../lib/format'
import { claveLugar, desglose, plural, RESULTADOS, type FilaLugar, type Lugar } from '../../lib/graficos'
import { hrefDe } from '../../lib/router'
import Simbolo, { TONO_RESULTADO } from '../Simbolo'
import { MarcoGrafica, recortarAlAncho, Tooltip, useAncho, useResalte, useRoving } from './comunes'
import { LeyendaResultados } from './GraficaTiempo'

const FILA = 30
const M = { arriba: 6, derecha: 30, abajo: 6 }

interface Props {
  filas: FilaLugar[]
  elegido: Lugar | null
  onAbrir: (l: Lugar) => void
  onQuitarFiltros: () => void
}

/** Análisis por árbol y zona, apilados por resultado. Clic o Enter abre el seguimiento. */
export default function GraficaLugares({ filas, elegido, onAbrir, onQuitarFiltros }: Props) {
  const [lienzo, ancho] = useAncho<HTMLDivElement>(320)
  const izquierda = Math.min(170, Math.round(ancho * 0.42))
  const util = Math.max(40, ancho - izquierda - M.derecha)
  const alto = M.arriba + filas.length * FILA + M.abajo
  const maximo = Math.max(1, max(filas, (f) => f.total) ?? 0)
  const x = scaleLinear().domain([0, maximo]).range([izquierda, izquierda + util])
  const roving = useRoving(filas.length, { onActivar: (i) => onAbrir(filas[i].lugar) })
  const { resaltada, eventos } = useResalte(roving.enfocado)
  const total = filas.reduce((s, f) => s + f.total, 0)
  const elegidoClave = elegido ? claveLugar(elegido) : null
  const conAnalisis = filas.filter((f) => f.total > 0)
  const resumen =
    `Análisis por árbol y zona: ${plural(conAnalisis.length, 'lugar', 'lugares')} con análisis de ${filas.length}` +
    (conAnalisis[0] ? `; el que más, ${conAnalisis[0].nombre} con ${conAnalisis[0].total}.` : '.')
  const activa = resaltada !== null ? filas[resaltada] : null

  return (
    <MarcoGrafica
      id="titulo-lugares"
      titulo="Por árbol y zona"
      descripcion="Análisis de cada árbol y zona de follaje, apilados por resultado. Clic o Enter abre su seguimiento."
      vacio={filas.length === 0}
      onQuitarFiltros={onQuitarFiltros}
      leyenda={<LeyendaResultados elegido={null} />}
      tabla={
        <table className="tabla tabla-compacta">
          <caption className="visually-hidden">Análisis por árbol y zona</caption>
          <thead>
            <tr>
              <th scope="col">Árbol o zona</th>
              <th scope="col" className="num">Total</th>
              {RESULTADOS.map((r) => (
                <th key={r} scope="col" className="num">{ETIQUETA_RESULTADO[r]}</th>
              ))}
              <th scope="col" className="num">Confianza media</th>
              <th scope="col">Último análisis</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.clave}>
                <th scope="row">
                  <a href={hrefDe(f.lugar.tipo, f.lugar.id)}>{f.nombre}</a>
                  <span className="muted celda-detalle">{f.detalle}</span>
                </th>
                <td className="num">{f.total}</td>
                {RESULTADOS.map((r) => (
                  <td key={r} className="num">{f.conteos[r]}</td>
                ))}
                <td className="num">{formatPorcentaje(f.confianzaMedia)}</td>
                <td className="nowrap">{f.ultimo ? formatFecha(f.ultimo.fechaCaptura) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="grafica-lienzo" ref={lienzo}>
        <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} role="group" aria-label={resumen} className="grafica-svg">
          <line className="eje-base" x1={izquierda} x2={izquierda} y1={M.arriba} y2={alto - M.abajo} />
          {filas.map((f, i) => {
            const y0 = M.arriba + i * FILA
            let base = izquierda
            const atenuada = elegidoClave !== null && elegidoClave !== f.clave
            const etiqueta =
              `${f.nombre} (${f.lugar.tipo === 'arbol' ? 'árbol' : 'zona'}): ${plural(f.total, 'análisis', 'análisis')}` +
              (f.total ? `. ${desglose(f.conteos, ETIQUETA_RESULTADO)}. Confianza media ${formatPorcentaje(f.confianzaMedia)}` : '') +
              '. Abre su seguimiento.'
            return (
              <g
                key={f.clave}
                className={`marca${resaltada === i ? ' marca-activa' : ''}${atenuada ? ' atenuado' : ''}`}
                role="link"
                aria-label={etiqueta}
                {...roving.props(i)}
                {...eventos(i)}
                onClick={() => onAbrir(f.lugar)}
              >
                <rect className="marca-toque" x={0} width={ancho} y={y0} height={FILA} />
                <text className="eje eje-nombre" x={izquierda - 8} y={y0 + FILA / 2 + 4} textAnchor="end">
                  <title>{f.nombre}</title>
                  {recortarAlAncho(f.nombre, izquierda - 16)}
                </text>
                {RESULTADOS.map((r) => {
                  const n = f.conteos[r]
                  if (!n) return null
                  const w = x(n) - izquierda
                  const bx = base
                  base += w
                  return (
                    <rect
                      key={r}
                      className={`segmento forma-${TONO_RESULTADO[r]}`}
                      x={bx}
                      width={Math.max(2, w)}
                      y={y0 + 7}
                      height={FILA - 14}
                    />
                  )
                })}
                <text className="eje eje-valor" x={base + 6} y={y0 + FILA / 2 + 4}>
                  {f.total}
                </text>
              </g>
            )
          })}
        </svg>
        {activa && (
          <Tooltip x={Math.min(x(activa.total), izquierda + util)} y={M.arriba + (resaltada ?? 0) * FILA} ancho={ancho} alto={alto}>
            <strong>{activa.nombre}</strong>
            <span className="muted">{activa.detalle}</span>
            <span>{plural(activa.total, 'análisis', 'análisis')}</span>
            {RESULTADOS.filter((r) => activa.conteos[r]).map((r) => (
              <span key={r} className="tooltip-fila">
                <Simbolo tono={TONO_RESULTADO[r]} />
                {ETIQUETA_RESULTADO[r]}: {activa.conteos[r]} ({Math.round((activa.conteos[r] / activa.total) * 100)} %)
              </span>
            ))}
            {activa.total > 0 && <span>Confianza media: {formatPorcentaje(activa.confianzaMedia)}</span>}
            {activa.ultimo && <span className="muted">Último: {formatFecha(activa.ultimo.fechaCaptura)}</span>}
            <span className="muted">Clic o Enter: ver seguimiento</span>
          </Tooltip>
        )}
      </div>
      {total === 0 && <p className="muted bloque-nota">Ningún árbol ni zona tiene análisis con estos filtros.</p>}
    </MarcoGrafica>
  )
}
