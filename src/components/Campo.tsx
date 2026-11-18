import { useId, useState } from 'react'
import type { Analisis } from '../lib/api'
import { observacionesDe, subidoPor, TITULO_OBSERVACIONES } from '../lib/lenguaje'

// Lo que escribe y hace una persona en campo, separado de lo que sale automático de la foto:
// quién la subió y sus observaciones.

/** Más de esto no cabe en dos líneas de una tarjeta: se ofrece ver el texto completo. */
const LARGO_RECORTE = 90

/** "Subido por Ana López" (o solo el nombre, si ya hay una etiqueta) con un icono de persona; "Autor no registrado" atenuado. */
export function Autor({ analisis, className = '', soloNombre = false }: { analisis: Pick<Analisis, 'autor'>; className?: string; soloNombre?: boolean }) {
  return (
    <span className={`autor${analisis.autor ? '' : ' autor-sin'}${className ? ` ${className}` : ''}`}>
      <svg className="icono" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      {soloNombre && analisis.autor ? analisis.autor.nombre : subidoPor(analisis)}
    </span>
  )
}

interface PropsObservaciones {
  analisis: Pick<Analisis, 'observaciones' | 'autor'>
  /** «recortada»: dos líneas y un botón para leer todo (tarjetas). */
  variante?: 'completa' | 'recortada'
  /** Sin observaciones: null (no se muestra nada) o un «Sin observaciones» discreto. */
  vacio?: 'nada' | 'discreto'
  /** Nivel del título (h3 en el detalle; en listas basta un párrafo). */
  titulo?: 'h3' | 'p'
}

/**
 * Observaciones de campo: el texto que escribió quien tomó la foto, marcado como escrito por una
 * persona (icono de lápiz, cita y su nombre), distinto de los resultados automáticos.
 */
export function Observaciones({ analisis: a, variante = 'completa', vacio = 'nada', titulo = 'p' }: PropsObservaciones) {
  const texto = observacionesDe(a)
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  if (!texto) return vacio === 'discreto' ? <p className="observaciones-vacias muted">Sin observaciones de campo</p> : null
  const recortable = variante === 'recortada' && texto.length > LARGO_RECORTE
  const Titulo = titulo
  return (
    <div className={`observaciones-campo${recortable && !abierta ? ' observaciones-recortadas' : ''}`}>
      <Titulo className="observaciones-titulo">
        <svg className="icono" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M4 20h4l10-10-4-4L4 16zM13.5 6.5l4 4" />
        </svg>
        {TITULO_OBSERVACIONES}
        {a.autor && <span className="observaciones-quien"> · escritas por {a.autor.nombre}</span>}
      </Titulo>
      <blockquote className="observaciones-texto" id={id}>
        <p>{texto}</p>
      </blockquote>
      {recortable && (
        <button
          type="button"
          className="btn-texto observaciones-mas"
          aria-expanded={abierta}
          aria-controls={id}
          onClick={() => setAbierta((v) => !v)}
        >
          {abierta ? 'Ver menos' : 'Ver completas'}
        </button>
      )}
    </div>
  )
}
