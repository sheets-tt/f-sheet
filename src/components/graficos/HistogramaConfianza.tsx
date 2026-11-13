import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import { ETIQUETA_RESULTADO } from '../../lib/format'
import { desglose, plural, RESULTADOS, type Decena } from '../../lib/graficos'
import Simbolo, { TONO_RESULTADO } from '../Simbolo'
import { MarcoGrafica, Tooltip, useAncho, useResalte, useRoving } from './comunes'

const ALTO = 220
const M = { arriba: 14, derecha: 8, abajo: 34, izquierda: 30 }

interface Props {
  decenas: Decena[]
  sinConfianza: number
  elegida: number | null
  onElegir: (indice: number) => void
  onQuitarFiltros: () => void
}

/** Distribución de la confianza del modelo, en decenas. Un clic filtra las demás gráficas. */
export default function HistogramaConfianza({ decenas, sinConfianza, elegida, onElegir, onQuitarFiltros }: Props) {
  const [lienzo, ancho] = useAncho<HTMLDivElement>(320)
  const util = Math.max(40, ancho - M.izquierda - M.derecha)
  const x = scaleBand<number>()
    .domain(decenas.map((d) => d.indice))
    .range([M.izquierda, M.izquierda + util])
    .paddingInner(0.12)
  const maximo = Math.max(1, max(decenas, (d) => d.total) ?? 0)
  const y = scaleLinear().domain([0, maximo]).nice().range([ALTO - M.abajo, M.arriba])
  const yTicks = y.ticks(Math.min(4, y.domain()[1])).filter(Number.isInteger)
  const roving = useRoving(decenas.length, { onActivar: (i) => onElegir(decenas[i].indice) })
  const { resaltada, eventos } = useResalte(roving.enfocado)
  const total = decenas.reduce((s, d) => s + d.total, 0)
  const moda = decenas.reduce<Decena | null>((m, d) => (d.total && (!m || d.total > m.total) ? d : m), null)
  const resumen =
    `Confianza de ${plural(total, 'análisis', 'análisis')} en decenas` +
    (moda ? `; la más frecuente, ${moda.etiqueta} con ${moda.total}` : '') +
    (sinConfianza ? `; ${sinConfianza} sin confianza.` : '.')
  const activa = resaltada !== null ? decenas[resaltada] : null
  // Etiquetas del eje: todas si caben, si no cada 20 %.
  const cada = util / 10 < 34 ? 2 : 1

  return (
    <MarcoGrafica
      id="titulo-confianza"
      titulo="Confianza del modelo"
      descripcion="Cuántos análisis hay en cada decena de confianza. Clic o Enter en una barra filtra las demás gráficas por esa decena."
      vacio={total === 0 && sinConfianza === 0}
      onQuitarFiltros={onQuitarFiltros}
      tabla={
        <table className="tabla tabla-compacta">
          <caption className="visually-hidden">Análisis por decena de confianza</caption>
          <thead>
            <tr>
              <th scope="col">Confianza</th>
              <th scope="col" className="num">Total</th>
              {RESULTADOS.map((r) => (
                <th key={r} scope="col" className="num">{ETIQUETA_RESULTADO[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decenas.map((d) => (
              <tr key={d.indice}>
                <th scope="row">
                  <button type="button" className="enlace" aria-pressed={elegida === d.indice} onClick={() => onElegir(d.indice)}>
                    {d.etiqueta}
                  </button>
                </th>
                <td className="num">{d.total}</td>
                {RESULTADOS.map((r) => (
                  <td key={r} className="num">{d.conteos[r]}</td>
                ))}
              </tr>
            ))}
            {sinConfianza > 0 && (
              <tr>
                <th scope="row">Sin confianza</th>
                <td className="num">{sinConfianza}</td>
                <td colSpan={3} />
              </tr>
            )}
          </tbody>
        </table>
      }
      leyenda={
        sinConfianza > 0 ? <p className="muted bloque-nota nota-grafica">{plural(sinConfianza, 'análisis no trae', 'análisis no traen')} confianza y no aparece.</p> : null
      }
    >
      <div className="grafica-lienzo" ref={lienzo}>
        <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} role="group" aria-label={resumen} className="grafica-svg">
          {yTicks.map((t) => (
            <g key={t} className="eje">
              <line x1={M.izquierda} x2={M.izquierda + util} y1={y(t)} y2={y(t)} className={t === 0 ? 'eje-base' : 'eje-rejilla'} />
              <text x={M.izquierda - 6} y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {decenas.map((d, i) =>
            i % cada === 0 ? (
              <text key={d.indice} className="eje" x={x(d.indice)!} y={ALTO - 18} textAnchor="middle">
                {d.indice * 10}
              </text>
            ) : null,
          )}
          <text className="eje" x={M.izquierda + util} y={ALTO - 18} textAnchor="end">
            100
          </text>
          <text className="eje eje-titulo" x={M.izquierda + util / 2} y={ALTO - 3} textAnchor="middle">
            Confianza (%)
          </text>
          {decenas.map((d, i) => {
            const bx = x(d.indice)!
            const alto = y(0) - y(d.total)
            const atenuada = elegida !== null && elegida !== d.indice
            return (
              <g
                key={d.indice}
                className={`marca${resaltada === i ? ' marca-activa' : ''}`}
                role="button"
                aria-pressed={elegida === d.indice}
                aria-label={`Confianza ${d.etiqueta}: ${plural(d.total, 'análisis', 'análisis')}${d.total ? `. ${desglose(d.conteos, ETIQUETA_RESULTADO)}` : ''}.`}
                {...roving.props(i)}
                {...eventos(i)}
                onClick={() => onElegir(d.indice)}
              >
                <rect className="marca-toque" x={bx} width={x.bandwidth()} y={M.arriba} height={ALTO - M.abajo - M.arriba} />
                {d.total > 0 && (
                  <rect className={`barra-cafe${atenuada ? ' atenuado' : ''}`} x={bx} width={x.bandwidth()} y={y(d.total)} height={alto} rx={2} />
                )}
              </g>
            )
          })}
        </svg>
        {activa && (
          <Tooltip x={x(activa.indice)! + x.bandwidth() / 2} y={y(activa.total)} ancho={ancho} alto={ALTO}>
            <strong>Confianza {activa.etiqueta}</strong>
            <span>
              {plural(activa.total, 'análisis', 'análisis')}
              {total ? ` (${Math.round((activa.total / total) * 100)} % del total)` : ''}
            </span>
            {RESULTADOS.filter((r) => activa.conteos[r]).map((r) => (
              <span key={r} className="tooltip-fila">
                <Simbolo tono={TONO_RESULTADO[r]} />
                {ETIQUETA_RESULTADO[r]}: {activa.conteos[r]}
              </span>
            ))}
            <span className="muted">{elegida === activa.indice ? 'Clic o Enter: quitar el filtro' : 'Clic o Enter: filtrar'}</span>
          </Tooltip>
        )}
      </div>
    </MarcoGrafica>
  )
}
