import { useMemo, type CSSProperties } from 'react'

/**
 * Motivo visual de la app: las galerías que el descortezador excava bajo la corteza. Una galería
 * materna vertical y, a cada lado, las galerías larvarias que crecen hacia afuera y terminan en la
 * cámara de pupa. Es decorativo (aria-hidden) y determinista: misma semilla, mismo dibujo.
 * Con `animada`, cada trazo se "excava" en orden (ver .galeria-animada en styles.css).
 */
interface Props {
  className?: string
  ramas?: number
  semilla?: number
  animada?: boolean
}

const ANCHO = 400
const ALTO = 800

function generador(semilla: number) {
  let s = semilla % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

export function trazosGaleria(ramas: number, semilla: number) {
  const azar = generador(semilla)
  const cx = ANCHO / 2
  const arriba = 40
  const abajo = ALTO - 40
  // La materna serpentea un poco; la muestreamos para que las larvarias nazcan sobre ella.
  const desvio = (y: number) => Math.sin((y / ALTO) * Math.PI * 2.2) * 10
  const madre = `M${cx + desvio(arriba)} ${arriba} ` +
    Array.from({ length: 16 }, (_, i) => {
      const y = arriba + ((i + 1) / 16) * (abajo - arriba)
      return `L${(cx + desvio(y)).toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')

  const larvas = Array.from({ length: ramas }, (_, i) => {
    const t = (i + 0.5) / ramas
    const y = arriba + 30 + t * (abajo - arriba - 60)
    const x0 = cx + desvio(y)
    const lado = i % 2 === 0 ? -1 : 1
    // Más largas a media galería (las primeras larvas tuvieron más tiempo), con algo de variación.
    const largo = 70 + Math.sin(t * Math.PI) * 100 + azar() * 30
    const x1 = x0 + lado * largo
    const y1 = y + (azar() - 0.5) * 70
    const c1 = { x: x0 + lado * largo * 0.35, y: y + (azar() - 0.5) * 30 }
    const c2 = { x: x0 + lado * largo * 0.75, y: y1 + (azar() - 0.5) * 40 }
    return {
      d: `M${x0.toFixed(1)} ${y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      fin: { x: x1, y: y1 },
    }
  })
  return { madre, larvas }
}

export default function Galeria({ className, ramas = 16, semilla = 7, animada = false }: Props) {
  const { madre, larvas } = useMemo(() => trazosGaleria(ramas, semilla), [ramas, semilla])
  const clase = ['galeria', animada ? 'galeria-animada' : '', className ?? ''].filter(Boolean).join(' ')
  return (
    <svg className={clase} viewBox={`0 0 ${ANCHO} ${ALTO}`} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
      <path className="galeria-madre" d={madre} pathLength={1} />
      {larvas.map((l, i) => (
        <g key={i} style={{ '--i': i } as CSSProperties}>
          <path className="galeria-larva" d={l.d} pathLength={1} />
          <ellipse className="galeria-pupa" cx={l.fin.x} cy={l.fin.y} rx={6} ry={4.5} />
        </g>
      ))}
    </svg>
  )
}

/** Marca de la app: la misma galería, reducida a un ícono. */
export function Marca({ tamano = 28 }: { tamano?: number }) {
  return (
    <svg className="marca" width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" className="marca-fondo" />
      <g className="marca-trazo" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <path d="M16 6v20" />
        <path d="M16 10c-3 0-5 1-7.5 3M16 15c3 0 5 1 7.5 3M16 20c-3 0-4.5 1-6.5 3M16 12c2.5 0 4 -.5 6 -2.5" />
      </g>
    </svg>
  )
}
