import type { EstadoSincronizacion, Resultado } from '../lib/api'

/**
 * Forma + color de cada estado. La forma es el segundo canal: el estado se distingue también sin
 * color (daltonismo, impresión). Siempre va junto a su etiqueta en texto.
 *   bien (sano / sincronizado) -> círculo · alerta (infestado / error) -> triángulo
 *   aviso (pendiente) -> cuadrado · neutro (no determinado) -> rombo · sin datos -> anillo
 */
export type Tono = 'bien' | 'aviso' | 'alerta' | 'neutro' | 'vacio'

export const TONO_RESULTADO: Record<Resultado, Tono> = { sano: 'bien', infestado: 'alerta', no_determinado: 'neutro' }
export const TONO_SINCRONIZACION: Record<EstadoSincronizacion, Tono> = {
  sincronizado: 'bien',
  pendiente: 'aviso',
  error: 'alerta',
}

/** Dibujo del símbolo centrado en (0,0), con "radio" r. Se usa en SVG sueltos y en el plano. */
export function Forma({ tono, r = 5 }: { tono: Tono; r?: number }) {
  const clase = `forma forma-${tono}`
  switch (tono) {
    case 'alerta': {
      const h = r * 1.15
      return <path className={clase} d={`M0 ${-h} L${h} ${h * 0.8} L${-h} ${h * 0.8} Z`} />
    }
    case 'aviso':
      return <rect className={clase} x={-r * 0.85} y={-r * 0.85} width={r * 1.7} height={r * 1.7} rx={1} />
    case 'neutro':
      return <path className={clase} d={`M0 ${-r * 1.1} L${r * 1.1} 0 L0 ${r * 1.1} L${-r * 1.1} 0 Z`} />
    case 'vacio':
      return <circle className={clase} r={r * 0.8} />
    default:
      return <circle className={clase} r={r} />
  }
}

/** Símbolo en línea con el texto (decorativo: el texto de al lado dice el estado). */
export default function Simbolo({ tono }: { tono: Tono }) {
  return (
    <svg className="simbolo" viewBox="-7 -7 14 14" width="12" height="12" aria-hidden="true" focusable="false">
      <Forma tono={tono} />
    </svg>
  )
}

/** Símbolo + etiqueta, para celdas de tabla y listas. */
export function Estado({ tono, children }: { tono: Tono; children: string }) {
  return (
    <span className="estado">
      <Simbolo tono={tono} />
      {children}
    </span>
  )
}
