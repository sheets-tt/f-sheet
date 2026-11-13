import { useEffect, useRef, useState } from 'react'
import { getEvidencia, type Analisis } from '../../lib/api'
import { claveLugar, ETIQUETA_NIVEL, lugarDe, motivosAtencion, nivelConfianza } from '../../lib/analisis'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../../lib/format'
import { hrefDe } from '../../lib/router'
import { useCarga } from '../../lib/useCarga'
import { Estado, TONO_RESULTADO } from '../Simbolo'
import { Medidor } from './CajasCategoria'

interface Props {
  analisis: Analisis
  nombres: Map<string, string>
  onAbrir: (a: Analisis, origen: HTMLElement) => void
}

/** true cuando el elemento entra (o está por entrar) en pantalla. Sin IntersectionObserver: nunca. */
function useVisible<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || visible || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])
  return [ref, visible] as const
}

/** Miniatura: la URL firmada se pide solo cuando la tarjeta se acerca a la pantalla. */
function Miniatura({ analisis }: { analisis: Analisis }) {
  const [ref, visible] = useVisible<HTMLDivElement>()
  return (
    <div className="tarjeta-foto" ref={ref}>
      {!analisis.tieneEvidencia ? (
        <span className="tarjeta-sin-foto">Sin foto</span>
      ) : visible ? (
        <FotoMiniatura id={analisis.id} />
      ) : (
        <span className="hueso" aria-hidden="true" />
      )}
    </div>
  )
}

function FotoMiniatura({ id }: { id: string }) {
  const evidencia = useCarga((signal) => getEvidencia(id, signal), [id])
  // La firma dura minutos: si la imagen falla (p. ej. 403 por caducada), se pide una firma nueva
  // una sola vez antes de darla por no disponible.
  const [fallos, setFallos] = useState(0)
  const url = evidencia.datos?.url
  if (evidencia.estado === 'cargando' || (evidencia.recargando && fallos === 1)) return <span className="hueso" aria-hidden="true" />
  if (!url || fallos > 1) return <span className="tarjeta-sin-foto">Foto no disponible</span>
  // Decorativa: la tarjeta ya dice qué es; la foto grande con su descripción está en el detalle.
  return (
    <img
      key={url}
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => {
        setFallos((n) => n + 1)
        if (fallos === 0) evidencia.reintentar()
      }}
    />
  )
}

/** Una caja por análisis: foto, resultado, confianza con medidor, lugar, tipo, fecha y observaciones. */
export default function TarjetaAnalisis({ analisis: a, nombres, onAbrir }: Props) {
  const l = lugarDe(a)
  const nombre = l ? (nombres.get(claveLugar(l)) ?? (l.tipo === 'arbol' ? 'Árbol' : 'Zona')) : null
  const fecha = formatFecha(a.fechaCaptura)
  const motivos = motivosAtencion(a)
  const nivel = nivelConfianza(a.confianza)
  return (
    <article className={`tarjeta-analisis${motivos.length ? ' tarjeta-atencion' : ''}`}>
      <Miniatura analisis={a} />
      <div className="tarjeta-cuerpo">
        <h3 className="tarjeta-titulo">
          {/* Toda la tarjeta abre el detalle (el área del botón se extiende con CSS); el enlace al
              lugar queda por encima y sigue funcionando. */}
          <button
            type="button"
            className="tarjeta-abrir"
            aria-label={`Ver detalle del análisis del ${fecha}`}
            onClick={(e) => onAbrir(a, e.currentTarget)}
          >
            {fecha}
          </button>
        </h3>
        <p className="tarjeta-linea">
          <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado>
          <span className="muted">· {ETIQUETA_TIPO[a.tipoImagen]}</span>
        </p>
        <div className="tarjeta-confianza">
          <span>
            Confianza <strong>{formatPorcentaje(a.confianza)}</strong>
            <span className="muted"> · {ETIQUETA_NIVEL[nivel]}</span>
          </span>
          <Medidor fraccion={a.confianza ?? 0} />
        </div>
        <p className="tarjeta-lugar">
          {l ? (
            <a href={hrefDe(l.tipo, l.id)} className="tarjeta-enlace">
              {nombre}
            </a>
          ) : (
            <span className="muted">Sin árbol ni zona</span>
          )}
        </p>
        {a.observaciones && <p className="tarjeta-observaciones">{a.observaciones}</p>}
        {motivos.length > 0 && <p className="tarjeta-motivos">Requiere atención: {motivos.join(', ').toLowerCase()}</p>}
      </div>
    </article>
  )
}
