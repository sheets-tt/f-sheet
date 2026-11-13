import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'

/** Ancho real del contenedor (las gráficas dibujan en píxeles reales: el texto no se escala). */
export function useAncho<T extends HTMLElement>(defecto = 640): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(defecto)
  useEffect(() => {
    const el = ref.current
    // jsdom (pruebas) no tiene ResizeObserver ni layout: se queda el ancho por defecto.
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      if (w > 0) setAncho(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, ancho]
}

/**
 * Tabindex itinerante: la gráfica es una sola parada de Tab y las flechas recorren las marcas.
 * `columnas` da una rejilla (←→ por columna, ↑↓ por fila); sin él, todas las flechas avanzan o
 * retroceden. Enter o Espacio activan la marca; Inicio/Fin van a la primera y la última.
 */
export function useRoving(total: number, { columnas, onActivar }: { columnas?: number; onActivar?: (i: number) => void } = {}) {
  const [activo, setActivo] = useState(0)
  const [enfocado, setEnfocado] = useState<number | null>(null)
  const refs = useRef<(SVGElement | null)[]>([])
  const indice = Math.min(activo, Math.max(0, total - 1))

  const mover = useCallback((i: number) => {
    setActivo(i)
    refs.current[i]?.focus()
  }, [])

  function onKeyDown(e: KeyboardEvent, i: number) {
    const c = columnas ?? 0
    let destino: number | null = null
    switch (e.key) {
      case 'ArrowRight':
        destino = c ? (i % c < c - 1 ? i + 1 : i) : i + 1
        break
      case 'ArrowLeft':
        destino = c ? (i % c > 0 ? i - 1 : i) : i - 1
        break
      case 'ArrowDown':
        destino = c ? i + c : i + 1
        break
      case 'ArrowUp':
        destino = c ? i - c : i - 1
        break
      case 'Home':
        destino = c ? i - (i % c) : 0
        break
      case 'End':
        destino = c ? Math.min(total - 1, i - (i % c) + c - 1) : total - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onActivar?.(i)
        return
      default:
        return
    }
    e.preventDefault()
    if (destino !== null && destino >= 0 && destino < total) mover(destino)
  }

  const props = (i: number) => ({
    tabIndex: i === indice ? 0 : -1,
    ref: (el: SVGElement | null) => {
      refs.current[i] = el
    },
    onKeyDown: (e: KeyboardEvent) => onKeyDown(e, i),
    onFocus: () => {
      setActivo(i)
      setEnfocado(i)
    },
    onBlur: () => setEnfocado((f) => (f === i ? null : f)),
  })

  return { activo: indice, enfocado, props }
}

/** Marca bajo el puntero o con el foco: es la que muestra el tooltip. */
export function useResalte(enfocado: number | null) {
  const [encima, setEncima] = useState<number | null>(null)
  const resaltada = encima ?? enfocado
  const eventos = (i: number) => ({
    onPointerEnter: () => setEncima(i),
    onPointerLeave: () => setEncima((e) => (e === i ? null : e)),
  })
  return { resaltada, eventos }
}

interface MarcoProps {
  id: string
  titulo: string
  /** Qué muestra y qué hace un clic (texto visible bajo el título). */
  descripcion: ReactNode
  /** Vista en tabla, la alternativa en texto de la gráfica. */
  tabla: ReactNode
  /** Sin datos que dibujar con los filtros actuales. */
  vacio?: boolean
  onQuitarFiltros?: () => void
  leyenda?: ReactNode
  children: ReactNode
  className?: string
}

/** Panel de una gráfica: título, descripción, "Ver como tabla", leyenda y estado vacío. */
export function MarcoGrafica({ id, titulo, descripcion, tabla, vacio = false, onQuitarFiltros, leyenda, children, className = '' }: MarcoProps) {
  const [comoTabla, setComoTabla] = useState(false)
  const descId = useId()
  return (
    <section className={`panel panel-grafica ${className}`} aria-labelledby={id} aria-describedby={descId}>
      <div className="panel-titulo">
        <h2 id={id}>{titulo}</h2>
        {!vacio && (
          <button type="button" className="btn btn-ghost btn-chico" aria-pressed={comoTabla} onClick={() => setComoTabla((v) => !v)}>
            {comoTabla ? 'Ver gráfica' : 'Ver como tabla'}
          </button>
        )}
      </div>
      <p className="muted bloque-nota" id={descId}>
        {descripcion}
      </p>
      {vacio ? (
        <div className="grafica-vacia">
          <p>Ningún análisis coincide con los filtros.</p>
          {onQuitarFiltros && (
            <button type="button" className="enlace" onClick={onQuitarFiltros}>
              Quitar filtros
            </button>
          )}
        </div>
      ) : comoTabla ? (
        <div className="tabla-desplazable tabla-grafica">{tabla}</div>
      ) : (
        <>
          {children}
          {leyenda}
        </>
      )}
    </section>
  )
}

/** Tooltip HTML sobre la gráfica, en % del lienzo (aria-hidden: cada marca ya dice lo mismo). */
export function Tooltip({ x, y, ancho, alto, children }: { x: number; y: number; ancho: number; alto: number; children: ReactNode }) {
  // Cerca de los bordes se abre hacia dentro para no salirse de la pantalla.
  const lado = x < ancho * 0.25 ? ' tooltip-derecha' : x > ancho * 0.75 ? ' tooltip-izquierda' : ''
  const abajo = y < 90 ? ' tooltip-abajo' : ''
  return (
    <div
      className={`grafica-tooltip tooltip-rico${lado}${abajo}`}
      // Posición por CSSOM (React asigna style.left/top), permitido por la CSP style-src 'self'.
      style={{ left: `${(x / ancho) * 100}%`, top: `${(y / alto) * 100}%` }}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
