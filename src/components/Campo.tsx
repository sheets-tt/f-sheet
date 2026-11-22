import { useId, useState } from 'react'
import type { Analisis, Persona } from '../lib/api'
import { etiquetaDispositivo, observacionesDe, subidoPor, TITULO_OBSERVACIONES, tituloObservacionesLugar } from '../lib/lenguaje'

// Lo que escribe y hace una persona en campo, separado de lo que sale automático de la foto:
// quién la subió y sus observaciones.

/** Más de esto no cabe en dos líneas de una tarjeta: se ofrece ver el texto completo. */
const LARGO_RECORTE = 90

/** Teléfono desde el que se tomó la foto ("Pixel 7 Pro · b71f"), null si no quedó registrado. */
export function Dispositivo({
  analisis,
  comoSubtitulo = false,
  conSeparador = false,
}: {
  analisis: Pick<Analisis, 'dispositivo'>
  comoSubtitulo?: boolean
  conSeparador?: boolean
}) {
  const texto = etiquetaDispositivo(analisis.dispositivo)
  if (!texto) return null
  return (
    <span className={comoSubtitulo ? 'tabla-dispositivo' : 'autor-dispositivo'}>
      {conSeparador && <span aria-hidden="true">· </span>}
      <svg className="icono" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
      {texto}
    </span>
  )
}

/** "Subido por Ana López" (o solo el nombre, si ya hay una etiqueta) con icono; añade dispositivo si existe. */
export function Autor({
  analisis,
  className = '',
  soloNombre = false,
}: {
  analisis: Pick<Analisis, 'autor' | 'dispositivo'>
  className?: string
  soloNombre?: boolean
}) {
  return (
    <span className={`autor${analisis.autor ? '' : ' autor-sin'}${className ? ` ${className}` : ''}`}>
      <svg className="icono" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      {soloNombre && analisis.autor ? analisis.autor.nombre : subidoPor(analisis)}
      {!soloNombre && <Dispositivo analisis={analisis} conSeparador />}
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

interface PropsObservacionesLugar {
  tipo: 'arbol' | 'zona'
  descripcion: string | null
  registradoPor?: Persona | null
  className?: string
}

/**
 * Observaciones generales del árbol o de la zona (arbol.descripcion / zona_follaje.descripcion),
 * diferenciadas visualmente de las observaciones individuales por fotografía.
 */
export function ObservacionesLugar({ tipo, descripcion, registradoPor, className = '' }: PropsObservacionesLugar) {
  const texto = descripcion?.trim()
  if (!texto) return null
  return (
    <div className={`observaciones-campo${className ? ` ${className}` : ''}`}>
      <p className="observaciones-titulo">
        <svg className="icono" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M4 20h4l10-10-4-4L4 16zM13.5 6.5l4 4" />
        </svg>
        {tituloObservacionesLugar(tipo)}
        {registradoPor && <span className="observaciones-quien"> · registradas por {registradoPor.nombre}</span>}
      </p>
      <blockquote className="observaciones-texto">
        <p>{texto}</p>
      </blockquote>
    </div>
  )
}
