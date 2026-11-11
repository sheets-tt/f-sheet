import type { CSSProperties } from 'react'

/**
 * Esqueletos de carga con la forma de lo que va a aparecer: el contenido entra en su lugar sin
 * saltos. Son decorativos (aria-hidden); el texto para lectores de pantalla va en role="status".
 */

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="visually-hidden" role="status">
      {texto}
    </p>
  )
}

function Hueso({ className = '', ancho }: { className?: string; ancho?: string }) {
  return <span className={`hueso ${className}`} style={ancho ? { width: ancho } : undefined} aria-hidden="true" />
}

export function EsqueletoResumen() {
  return (
    <div className="esqueleto" aria-busy="true">
      <div className="hero hero-esqueleto" aria-hidden="true">
        <Hueso className="hueso-claro hueso-titulo" ancho="min(32rem, 80%)" />
        <Hueso className="hueso-claro hueso-linea" ancho="9rem" />
        <div className="totales totales-esqueleto">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>
              <Hueso className="hueso-claro hueso-cifra" />
              <Hueso className="hueso-claro hueso-linea" ancho="5rem" />
            </span>
          ))}
        </div>
      </div>
      <div className="rejilla-resumen" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel">
            <Hueso className="hueso-linea" ancho="60%" />
            <Hueso className="hueso-linea hueso-tenue" ancho="40%" />
            <Hueso className="hueso-barra" />
            <Hueso className="hueso-linea hueso-tenue" ancho="70%" />
          </div>
        ))}
      </div>
      <Aviso texto="Cargando el resumen…" />
    </div>
  )
}

export function EsqueletoTabla({ texto, filas = 5, columnas = 6 }: { texto: string; filas?: number; columnas?: number }) {
  return (
    <div className="esqueleto" aria-busy="true">
      <div className="panel panel-tabla esqueleto-tabla" aria-hidden="true">
        <div className="esqueleto-fila esqueleto-cabeza" style={{ '--columnas': columnas } as CSSProperties}>
          {Array.from({ length: columnas }, (_, c) => (
            <Hueso key={c} className="hueso-linea hueso-tenue" ancho="55%" />
          ))}
        </div>
        {Array.from({ length: filas }, (_, f) => (
          <div key={f} className="esqueleto-fila" style={{ '--columnas': columnas } as CSSProperties}>
            {Array.from({ length: columnas }, (_, c) => (
              <Hueso key={c} className="hueso-linea" ancho={`${55 + ((f * 7 + c * 13) % 40)}%`} />
            ))}
          </div>
        ))}
      </div>
      <Aviso texto={texto} />
    </div>
  )
}

export function EsqueletoMapa() {
  return (
    <div className="esqueleto mapa" aria-busy="true">
      <div className="plano-esqueleto" aria-hidden="true">
        {[
          [22, 30], [48, 58], [70, 36], [35, 72], [80, 70],
        ].map(([x, y], i) => (
          <span key={i} className="hueso hueso-punto" style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
      </div>
      <div className="panel" aria-hidden="true">
        <Hueso className="hueso-linea" ancho="55%" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="esqueleto-item">
            <Hueso className="hueso-linea" ancho={`${60 + ((i * 17) % 30)}%`} />
            <Hueso className="hueso-linea hueso-tenue" ancho="45%" />
          </div>
        ))}
      </div>
      <Aviso texto="Cargando el mapa…" />
    </div>
  )
}

/** Lista corta (historial de un punto). */
export function EsqueletoLista({ texto, filas = 3 }: { texto: string; filas?: number }) {
  return (
    <div className="esqueleto" aria-busy="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="esqueleto-item" aria-hidden="true">
          <Hueso className="hueso-linea" ancho="40%" />
          <Hueso className="hueso-linea hueso-tenue" ancho="70%" />
        </div>
      ))}
      <Aviso texto={texto} />
    </div>
  )
}

/** Pantalla mientras llega el chunk de la sección (Suspense). */
export function EsqueletoPagina() {
  return (
    <div className="esqueleto" aria-busy="true">
      <Hueso className="hueso-titulo" ancho="12rem" />
      <Hueso className="hueso-linea hueso-tenue" ancho="min(28rem, 70%)" />
      <div className="panel esqueleto-bloque" aria-hidden="true" />
      <Aviso texto="Cargando…" />
    </div>
  )
}
