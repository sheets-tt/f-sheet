import { max } from 'd3-array'
import { ETIQUETA_RESULTADO } from '../../lib/format'
import {
  claveLugar,
  desglose,
  etiquetaTick,
  plural,
  type Celda,
  type FilaLugar,
  type Intervalo,
  type Lugar,
  type Periodo,
} from '../../lib/graficos'
import Simbolo, { Forma, TONO_RESULTADO } from '../Simbolo'
import { MarcoGrafica, recortarAlAncho, Tooltip, useAncho, useResalte, useRoving } from './comunes'

const FILA = 30
const MIN_CELDA = 18
const M = { arriba: 8, derecha: 8, abajo: 26 }
const NIVELES = 4

interface Props {
  filas: FilaLugar[]
  periodos: Periodo[]
  celdas: Celda[][]
  intervalo: Intervalo
  elegido: Lugar | null
  onElegir: (l: Lugar) => void
  onQuitarFiltros: () => void
}

/** Nivel de la rampa café (1 = pocos … 4 = el máximo); 0 = sin análisis. */
export function nivel(total: number, maximo: number): number {
  if (!total) return 0
  return Math.min(NIVELES, Math.max(1, Math.ceil((total / Math.max(1, maximo)) * NIVELES)))
}

/** Lugar × periodo: intensidad = cuántos análisis; triángulo = hubo un resultado infestado. */
export default function MapaCalor({ filas, periodos, celdas, intervalo, elegido, onElegir, onQuitarFiltros }: Props) {
  const [lienzo, ancho] = useAncho<HTMLDivElement>()
  const izquierda = Math.min(170, Math.round(ancho * 0.36))
  const disponible = ancho - izquierda - M.derecha
  const celda = Math.max(MIN_CELDA, Math.floor(disponible / Math.max(1, periodos.length)))
  // Con muchos periodos en pantalla angosta, el lienzo se desplaza dentro de su caja (no la página).
  const anchoSvg = Math.max(ancho, izquierda + celda * periodos.length + M.derecha)
  const alto = M.arriba + filas.length * FILA + M.abajo
  const maximo = max(celdas.flat(), (c) => c.total) ?? 0
  const columnas = periodos.length
  const plana = celdas.flat()
  const roving = useRoving(plana.length, { columnas, onActivar: (i) => onElegir(filas[Math.floor(i / columnas)].lugar) })
  const { resaltada, eventos } = useResalte(roving.enfocado)
  const elegidoClave = elegido ? claveLugar(elegido) : null
  const cada = Math.ceil(56 / celda)
  const activa = resaltada !== null ? plana[resaltada] : null
  const conDatos = plana.filter((c) => c.total > 0).length
  const resumen = `Mapa de calor de ${plural(filas.length, 'lugar', 'lugares')} por ${plural(columnas, 'periodo', 'periodos')}: ${plural(conDatos, 'celda', 'celdas')} con análisis; máximo ${maximo} en una celda.`
  // Rangos de cada nivel para la leyenda.
  const rangos = Array.from({ length: NIVELES }, (_, i) => {
    const desde = Math.floor((i * maximo) / NIVELES) + 1
    const hasta = Math.floor(((i + 1) * maximo) / NIVELES)
    return { nivel: i + 1, texto: desde >= hasta ? `${hasta}` : `${desde}–${hasta}`, vacio: hasta < desde }
  }).filter((r) => !r.vacio)

  return (
    <MarcoGrafica
      id="titulo-calor"
      titulo="Actividad por árbol y zona"
      descripcion="Cada celda es un árbol o zona en un periodo: cuanto más intenso el color, más análisis; el triángulo marca que hubo infestación. Las flechas recorren la rejilla; clic o Enter filtra por ese lugar."
      vacio={filas.length === 0 || columnas === 0}
      onQuitarFiltros={onQuitarFiltros}
      leyenda={
        <ul className="leyenda" aria-label="Escala">
          <li>
            <span className="muestra calor-0" />
            Sin análisis
          </li>
          {rangos.map((r) => (
            <li key={r.nivel}>
              <span className={`muestra calor-${r.nivel}`} />
              {r.texto}
            </li>
          ))}
          <li>
            <Simbolo tono="alerta" />
            Con infestación
          </li>
        </ul>
      }
      tabla={
        <table className="tabla tabla-compacta">
          <caption className="visually-hidden">Análisis por árbol o zona y periodo</caption>
          <thead>
            <tr>
              <th scope="col">Árbol o zona</th>
              {periodos.map((p) => (
                <th key={p.clave} scope="col" className="num">
                  {etiquetaTick(p.inicio, intervalo)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.clave}>
                <th scope="row">{f.nombre}</th>
                {celdas[i].map((c) => (
                  <td key={c.columna} className="num">
                    {c.total || ''}
                    {c.conteos.infestado > 0 && <span className="visually-hidden"> (con infestación)</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="grafica-lienzo lienzo-desplazable" ref={lienzo}>
        <div className="lienzo-interior">
          <svg width={anchoSvg} height={alto} viewBox={`0 0 ${anchoSvg} ${alto}`} role="group" aria-label={resumen} className="grafica-svg">
            {filas.map((f, i) => (
              <text
                key={f.clave}
                className={`eje eje-nombre${elegidoClave && elegidoClave !== f.clave ? ' atenuado' : ''}`}
                x={izquierda - 8}
                y={M.arriba + i * FILA + FILA / 2 + 4}
                textAnchor="end"
              >
                <title>{f.nombre}</title>
                {recortarAlAncho(f.nombre, izquierda - 16)}
              </text>
            ))}
            {periodos.map((p, j) =>
              j % cada === 0 ? (
                <text key={p.clave} className="eje" x={izquierda + j * celda + celda / 2} y={alto - 8} textAnchor="middle">
                  {etiquetaTick(p.inicio, intervalo)}
                </text>
              ) : null,
            )}
            {plana.map((c, i) => {
              const f = filas[c.fila]
              const p = periodos[c.columna]
              const cx = izquierda + c.columna * celda
              const cy = M.arriba + c.fila * FILA
              const atenuada = elegidoClave !== null && elegidoClave !== f.clave
              return (
                <g
                  // Clave por lugar y periodo (no por posición): al reordenarse las filas con un filtro,
                  // cada nodo sigue siendo el mismo lugar y el foco no salta a otro.
                  key={`${f.clave}|${p.clave}`}
                  className={`marca celda${resaltada === i ? ' marca-activa' : ''}${atenuada ? ' atenuado' : ''}`}
                  role="button"
                  aria-label={`${f.nombre}, ${p.etiqueta}: ${plural(c.total, 'análisis', 'análisis')}${c.total ? `. ${desglose(c.conteos, ETIQUETA_RESULTADO)}` : ''}.`}
                  {...roving.props(i)}
                  {...eventos(i)}
                  onClick={() => onElegir(f.lugar)}
                >
                  <rect className={`calor calor-${nivel(c.total, maximo)}`} x={cx + 1} y={cy + 1} width={celda - 2} height={FILA - 2} rx={3} />
                  {c.conteos.infestado > 0 && (
                    <g transform={`translate(${cx + celda - 7} ${cy + 8})`} className="celda-alerta">
                      <Forma tono={TONO_RESULTADO.infestado} r={3.2} />
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
          {activa && (
            <Tooltip
              x={izquierda + activa.columna * celda + celda / 2}
              y={M.arriba + activa.fila * FILA}
              ancho={anchoSvg}
              alto={alto}
            >
              <strong>{filas[activa.fila].nombre}</strong>
              <span className="muted">{periodos[activa.columna].etiqueta}</span>
              <span>{plural(activa.total, 'análisis', 'análisis')}</span>
              {activa.total > 0 && <span>{desglose(activa.conteos, ETIQUETA_RESULTADO)}</span>}
              <span className="muted">Clic o Enter: filtrar por este lugar</span>
            </Tooltip>
          )}
        </div>
      </div>
    </MarcoGrafica>
  )
}
