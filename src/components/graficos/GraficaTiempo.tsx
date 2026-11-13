import { max } from 'd3-array'
import { brushX, type BrushBehavior, type D3BrushEvent } from 'd3-brush'
import { scaleLinear, scaleUtc } from 'd3-scale'
import { select } from 'd3-selection'
import { area, curveStepAfter } from 'd3-shape'
import { utcDay } from 'd3-time'
import { useEffect, useMemo, useRef } from 'react'
import type { Resultado } from '../../lib/api'
import { ETIQUETA_RESULTADO, formatPorcentaje } from '../../lib/format'
import {
  desglose,
  etiquetaTick,
  INTERVALO,
  plural,
  RESULTADOS,
  type Dominio,
  type Intervalo,
  type Periodo,
} from '../../lib/graficos'
import Simbolo, { TONO_RESULTADO } from '../Simbolo'
import { MarcoGrafica, Tooltip, useAncho, useResalte, useRoving } from './comunes'

const ALTO = 240
const ALTO_MINI = 72
const M = { arriba: 14, derecha: 12, abajo: 28, izquierda: 34 }

interface Props {
  periodos: Periodo[]
  intervalo: Intervalo
  dominio: Dominio
  /** Vista general: todos los días con datos (para el pincel). */
  general: { dominio: Dominio; dias: Periodo[] }
  /** Hay un rango elegido (el pincel lo muestra; sin rango, se ve todo). */
  conRango: boolean
  resultadoElegido: Resultado | null
  onElegirResultado: (r: Resultado | null) => void
  onElegirPeriodo: (p: Periodo) => void
  onRango: (d: Dominio | null) => void
  onQuitarFiltros: () => void
}

/** Ticks en inicios de periodo, espaciados para que las etiquetas no choquen. */
function ticksDe(dominio: Dominio, intervalo: Intervalo, anchoUtil: number): Date[] {
  const int = INTERVALO[intervalo]
  const n = Math.max(1, int.count(dominio[0], dominio[1]))
  const caben = Math.max(1, Math.floor(anchoUtil / 64))
  const paso = Math.ceil(n / caben)
  return int.range(int.ceil(dominio[0]), dominio[1]).filter((_, i) => i % paso === 0)
}

export default function GraficaTiempo(props: Props) {
  const { periodos, intervalo, dominio, general, conRango, resultadoElegido, onElegirResultado, onElegirPeriodo, onRango, onQuitarFiltros } = props
  const [lienzo, ancho] = useAncho<HTMLDivElement>()
  const util = Math.max(40, ancho - M.izquierda - M.derecha)

  const x = useMemo(() => scaleUtc().domain(dominio).range([M.izquierda, M.izquierda + util]), [dominio, util])
  const maximo = max(periodos, (p) => p.total) ?? 0
  const y = useMemo(
    () => scaleLinear().domain([0, Math.max(1, maximo)]).nice().range([ALTO - M.abajo, M.arriba]),
    [maximo],
  )
  const yTicks = y.ticks(Math.min(4, Math.max(1, y.domain()[1]))).filter(Number.isInteger)
  const xTicks = ticksDe(dominio, intervalo, util)

  const roving = useRoving(periodos.length, { onActivar: (i) => onElegirPeriodo(periodos[i]) })
  const { resaltada, eventos } = useResalte(roving.enfocado)
  const total = periodos.reduce((s, p) => s + p.total, 0)
  const conDatos = periodos.filter((p) => p.total > 0)
  const pico = conDatos.reduce<Periodo | null>((m, p) => (!m || p.total > m.total ? p : m), null)

  const resumen =
    `Análisis por ${intervalo === 'dia' ? 'día' : intervalo === 'semana' ? 'semana' : 'mes'}: ${plural(total, 'análisis', 'análisis')} ` +
    `en ${plural(periodos.length, 'periodo', 'periodos')}` +
    (pico ? `; el máximo, ${pico.total} el ${pico.etiqueta}.` : '.')

  const columna = (p: Periodo) => {
    const x0 = Math.max(M.izquierda, x(p.inicio))
    const x1 = Math.min(M.izquierda + util, x(p.fin))
    // 2 px de separación entre barras; nunca más delgadas que 2 px.
    const hueco = x1 - x0 > 6 ? 2 : 1
    // Barras delgadas: como mucho 44 px, centradas en su periodo.
    const ancho = Math.max(2, Math.min(44, x1 - x0 - hueco))
    return { x0: (x0 + x1) / 2 - ancho / 2, ancho }
  }

  const activo = resaltada !== null ? periodos[resaltada] : null

  return (
    <MarcoGrafica
      id="titulo-tiempo"
      titulo="Análisis en el tiempo"
      descripcion={
        <>
          Cada barra es un {intervalo === 'dia' ? 'día' : intervalo === 'semana' ? 'semana' : 'mes'}, apilada por resultado. Clic o Enter en
          una barra acerca a ese periodo; arrastra en la franja de abajo para elegir el rango.
        </>
      }
      vacio={total === 0 && general.dias.every((d) => d.total === 0)}
      onQuitarFiltros={onQuitarFiltros}
      tabla={
        <table className="tabla tabla-compacta">
          <caption className="visually-hidden">Análisis por periodo</caption>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col" className="num">Total</th>
              {RESULTADOS.map((r) => (
                <th key={r} scope="col" className="num">{ETIQUETA_RESULTADO[r]}</th>
              ))}
              <th scope="col" className="num">Confianza media</th>
            </tr>
          </thead>
          <tbody>
            {periodos.map((p) => (
              <tr key={p.clave}>
                <th scope="row">
                  <button type="button" className="enlace" onClick={() => onElegirPeriodo(p)}>
                    {p.etiqueta}
                  </button>
                </th>
                <td className="num">{p.total}</td>
                {RESULTADOS.map((r) => (
                  <td key={r} className="num">{p.conteos[r]}</td>
                ))}
                <td className="num">{formatPorcentaje(p.confianzaMedia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      leyenda={<LeyendaResultados elegido={resultadoElegido} onElegir={onElegirResultado} />}
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
          {xTicks.map((t) => {
            const p = periodos.find((q) => q.inicio.getTime() === t.getTime())
            const c = p ? columna(p) : { x0: x(t), ancho: 0 }
            const cx = Math.min(Math.max(c.x0 + c.ancho / 2, M.izquierda + 16), M.izquierda + util - 16)
            return (
              <text key={t.toISOString()} className="eje" x={cx} y={ALTO - 8} textAnchor="middle">
                {etiquetaTick(t, intervalo)}
              </text>
            )
          })}
          {periodos.map((p, i) => {
            const c = columna(p)
            let base = y(0)
            const etiqueta =
              `${p.etiqueta}: ${plural(p.total, 'análisis', 'análisis')}` +
              (p.total ? `. ${desglose(p.conteos, ETIQUETA_RESULTADO)}. Confianza media ${formatPorcentaje(p.confianzaMedia)}` : '') +
              (p.lugares.length ? `. ${p.lugares.join(', ')}` : '') +
              '.'
            return (
              <g
                key={p.clave}
                className={`marca${resaltada === i ? ' marca-activa' : ''}`}
                role="button"
                aria-label={etiqueta}
                {...roving.props(i)}
                {...eventos(i)}
                onClick={() => onElegirPeriodo(p)}
              >
                {/* Área de toque: toda la columna, más que la barra. */}
                <rect className="marca-toque" x={c.x0 - 1} width={c.ancho + 2} y={M.arriba} height={ALTO - M.abajo - M.arriba} />
                {RESULTADOS.map((r) => {
                  const n = p.conteos[r]
                  if (!n) return null
                  const alto = y(0) - y(n)
                  base -= alto
                  return (
                    <rect
                      key={r}
                      className={`segmento forma-${TONO_RESULTADO[r]}${resultadoElegido && resultadoElegido !== r ? ' atenuado' : ''}`}
                      x={c.x0}
                      width={c.ancho}
                      y={base}
                      height={alto}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>
        {activo && (
          <Tooltip x={columna(activo).x0 + columna(activo).ancho / 2} y={y(activo.total)} ancho={ancho} alto={ALTO}>
            <strong>{activo.etiqueta}</strong>
            <span>{plural(activo.total, 'análisis', 'análisis')}</span>
            {RESULTADOS.filter((r) => activo.conteos[r]).map((r) => (
              <span key={r} className="tooltip-fila">
                <Simbolo tono={TONO_RESULTADO[r]} />
                {ETIQUETA_RESULTADO[r]}: {activo.conteos[r]} ({Math.round((activo.conteos[r] / activo.total) * 100)} %)
              </span>
            ))}
            {activo.total > 0 && <span>Confianza media: {formatPorcentaje(activo.confianzaMedia)}</span>}
            {activo.lugares.length > 0 && (
              <span className="muted">
                {activo.lugares.slice(0, 3).join(', ')}
                {activo.lugares.length > 3 ? ` y ${activo.lugares.length - 3} más` : ''}
              </span>
            )}
            {intervalo !== 'dia' || utcDay.count(dominio[0], dominio[1]) > 1 ? <span className="muted">Clic o Enter: acercar</span> : null}
          </Tooltip>
        )}
      </div>
      <Vista general={general} dominio={dominio} conRango={conRango} ancho={ancho} onRango={onRango} />
    </MarcoGrafica>
  )
}

/** Franja con todos los datos y el pincel (d3-brush) para elegir el rango arrastrando. */
function Vista({
  general,
  dominio,
  conRango,
  ancho,
  onRango,
}: {
  general: Props['general']
  dominio: Dominio
  conRango: boolean
  ancho: number
  onRango: (d: Dominio | null) => void
}) {
  const pincelRef = useRef<SVGGElement>(null)
  const comportamiento = useRef<BrushBehavior<unknown> | null>(null)
  const util = Math.max(40, ancho - M.izquierda - M.derecha)
  const alto = ALTO_MINI - 20
  const x = useMemo(() => scaleUtc().domain(general.dominio).range([M.izquierda, M.izquierda + util]), [general.dominio, util])
  const maximo = Math.max(1, max(general.dias, (d) => d.total) ?? 0)
  const y = scaleLinear().domain([0, maximo]).range([alto, 4])
  // Escalón por día, cerrado con el último día.
  const puntos = [...general.dias, ...(general.dias.length ? [{ ...general.dias.at(-1)!, inicio: general.dias.at(-1)!.fin }] : [])]
  const camino =
    area<Periodo>()
      .x((d) => x(d.inicio))
      .y0(alto)
      .y1((d) => y(d.total))
      .curve(curveStepAfter)(puntos) ?? ''

  // El pincel es de d3 (arrastre con ratón o dedo); React no toca lo que hay dentro de ese <g>.
  const onRangoRef = useRef(onRango)
  useEffect(() => {
    onRangoRef.current = onRango
  })
  useEffect(() => {
    const g = pincelRef.current
    if (!g) return
    const pincel = brushX<unknown>()
      .extent([
        [M.izquierda, 0],
        [M.izquierda + util, alto],
      ])
      .on('end', (e: D3BrushEvent<unknown>) => {
        if (!e.sourceEvent) return // movido desde aquí (sincronía con los filtros), no por la persona
        const s = e.selection as [number, number] | null
        onRangoRef.current(s ? [x.invert(s[0]), x.invert(s[1])] : null)
      })
    comportamiento.current = pincel
    const sel = select(g)
    sel.call(pincel)
    return () => {
      sel.on('.brush', null)
      sel.selectAll('*').remove()
      comportamiento.current = null
    }
  }, [x, util, alto])

  // El rango elegido (por botones, fechas o URL) se refleja en el pincel.
  useEffect(() => {
    const g = pincelRef.current
    const pincel = comportamiento.current
    if (!g || !pincel) return
    select(g).call(pincel.move, conRango ? [x(dominio[0]), x(dominio[1])] : null)
  }, [x, dominio, conRango])

  return (
    <div className="grafica-vista">
      <svg width={ancho} height={ALTO_MINI} viewBox={`0 0 ${ancho} ${ALTO_MINI}`} aria-hidden="true" className="grafica-svg">
        <path className="vista-area" d={camino} />
        <line className="eje-base" x1={M.izquierda} x2={M.izquierda + util} y1={alto} y2={alto} />
        <text className="eje" x={M.izquierda} y={ALTO_MINI - 4} textAnchor="start">
          {etiquetaTick(general.dominio[0], 'dia')}
        </text>
        <text className="eje" x={M.izquierda + util} y={ALTO_MINI - 4} textAnchor="end">
          {etiquetaTick(utcDay.offset(general.dominio[1], -1), 'dia')}
        </text>
        <g ref={pincelRef} className="pincel" />
      </svg>
    </div>
  )
}

/**
 * Leyenda con forma + color + etiqueta. Con onElegir, cada resultado es un botón que filtra las
 * demás gráficas (crossfilter); el elegido queda marcado y los otros se atenúan.
 */
export function LeyendaResultados({ elegido, onElegir }: { elegido: Resultado | null; onElegir?: (r: Resultado | null) => void }) {
  return (
    <ul className="leyenda" aria-label="Resultados">
      {RESULTADOS.map((r) => (
        <li key={r} className={elegido && elegido !== r ? 'atenuado' : undefined}>
          {onElegir ? (
            <button type="button" className="leyenda-boton" aria-pressed={elegido === r} onClick={() => onElegir(elegido === r ? null : r)}>
              <Simbolo tono={TONO_RESULTADO[r]} />
              {ETIQUETA_RESULTADO[r]}
            </button>
          ) : (
            <>
              <Simbolo tono={TONO_RESULTADO[r]} />
              {ETIQUETA_RESULTADO[r]}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
