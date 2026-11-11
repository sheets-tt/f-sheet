import { useMemo, useState } from 'react'
import type { Analisis } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../lib/format'
import Simbolo, { Forma, TONO_RESULTADO } from './Simbolo'

const ANCHO = 640
const ALTO = 220
const M = { arriba: 16, derecha: 20, abajo: 34, izquierda: 44 }
const DIA = 86_400_000

const fechaCorta = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'short' })

interface Props {
  analisis: Analisis[]
  /** Análisis resaltado (por id), compartido con el mapa y la línea de tiempo. */
  elegido?: string | null
  onElegir?: (id: string) => void
}

/**
 * Gráfica de puntos: cada análisis en su fecha de captura, a la altura de su confianza. Forma y
 * color dicen el resultado (la forma es el canal que no depende del color). La línea de tiempo de
 * la misma pantalla es la versión en texto de esta gráfica.
 */
export default function GraficaConfianza({ analisis, elegido = null, onElegir }: Props) {
  const [encima, setEncima] = useState<string | null>(null)

  const { puntos, ticks } = useMemo(() => {
    const tiempos = analisis.map((a) => new Date(a.fechaCaptura).getTime())
    let t0 = Math.min(...tiempos)
    let t1 = Math.max(...tiempos)
    // Un solo día: se abre una semana alrededor para que el punto no quede pegado al borde.
    if (t1 - t0 < DIA) {
      t0 -= 3.5 * DIA
      t1 += 3.5 * DIA
    }
    const ancho = ANCHO - M.izquierda - M.derecha
    const alto = ALTO - M.arriba - M.abajo
    const x = (t: number) => M.izquierda + ((t - t0) / (t1 - t0)) * ancho
    const y = (c: number) => M.arriba + (1 - c) * alto
    const puntos = analisis.map((a, i) => ({
      a,
      x: x(tiempos[i]),
      y: y(a.confianza ?? 0),
      sinConfianza: a.confianza === null,
    }))
    const n = 4
    // Fechas repetidas (un rango de pocos días) se dicen una sola vez.
    const ticks = Array.from({ length: n + 1 }, (_, i) => {
      const t = t0 + ((t1 - t0) * i) / n
      return { x: x(t), texto: fechaCorta.format(new Date(t)).replace('.', '') }
    }).filter((t, i, todos) => i === 0 || t.texto !== todos[i - 1].texto)
    return { puntos, ticks }
  }, [analisis])

  const activo = puntos.find((p) => p.a.id === (encima ?? elegido))
  const resultados = [...new Set(analisis.map((a) => a.resultadoClasificacion))]
  const resumen = `${analisis.length} análisis, del ${formatFecha(
    analisis.at(-1)!.fechaCaptura,
  )} al ${formatFecha(analisis[0].fechaCaptura)}. ${resultados
    .map((r) => `${ETIQUETA_RESULTADO[r]}: ${analisis.filter((a) => a.resultadoClasificacion === r).length}`)
    .join(', ')}.`

  return (
    <figure className="grafica-confianza">
      <div className="grafica-lienzo">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={`Confianza por análisis: ${resumen}`}>
          {[0, 0.5, 1].map((c) => {
            const yy = M.arriba + (1 - c) * (ALTO - M.arriba - M.abajo)
            return (
              <g key={c} className="eje">
                <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={yy} y2={yy} className={c === 0 ? 'eje-base' : 'eje-rejilla'} />
                <text x={M.izquierda - 8} y={yy + 4} textAnchor="end">
                  {c * 100} %
                </text>
              </g>
            )
          })}
          {ticks.map((t, i) => (
            <text key={i} className="eje" x={t.x} y={ALTO - 10} textAnchor={t.x <= M.izquierda + 1 ? 'start' : t.x >= ANCHO - M.derecha - 1 ? 'end' : 'middle'}>
              {t.texto}
            </text>
          ))}
          {activo && <line className="guia" x1={activo.x} x2={activo.x} y1={M.arriba} y2={ALTO - M.abajo} />}
          {puntos.map((p) => {
            const tono = TONO_RESULTADO[p.a.resultadoClasificacion]
            const esActivo = p === activo
            return (
              <g
                key={p.a.id}
                className={`grafica-punto${esActivo ? ' activo' : ''}`}
                transform={`translate(${p.x} ${p.y})`}
                onPointerEnter={() => setEncima(p.a.id)}
                onPointerLeave={() => setEncima(null)}
                onClick={() => onElegir?.(p.a.id)}
              >
                {/* Área de toque mayor que la marca. */}
                <circle r={14} className="grafica-toque" />
                <Forma tono={tono} r={esActivo ? 7 : 5.5} />
              </g>
            )
          })}
        </svg>
        {activo && (
          <div
            className="grafica-tooltip"
            style={{ left: `${(activo.x / ANCHO) * 100}%`, top: `${(activo.y / ALTO) * 100}%` }}
            aria-hidden="true"
          >
            <strong>{ETIQUETA_RESULTADO[activo.a.resultadoClasificacion]}</strong>
            <span>
              {ETIQUETA_TIPO[activo.a.tipoImagen]}, confianza {activo.sinConfianza ? 'sin dato' : formatPorcentaje(activo.a.confianza)}
            </span>
            <span className="muted">{formatFecha(activo.a.fechaCaptura)}</span>
          </div>
        )}
      </div>
      <figcaption>
        <ul className="leyenda">
          {(['sano', 'infestado', 'no_determinado'] as const).map((r) => (
            <li key={r}>
              <Simbolo tono={TONO_RESULTADO[r]} />
              {ETIQUETA_RESULTADO[r]}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
