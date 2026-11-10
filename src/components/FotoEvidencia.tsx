import { useEffect, useId, useRef, useState } from 'react'
import { getEvidencia, type Analisis } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha } from '../lib/format'
import { useCarga } from '../lib/useCarga'
import { Cargando, ErrorCarga } from './EstadoCarga'

interface Props {
  analisis: Analisis
  onCerrar: () => void
}

/**
 * Foto de un análisis en un <dialog> modal (foco atrapado, Esc cierra y el foco vuelve al botón).
 * La URL es una firma de S3 de pocos minutos: se pide al abrir y se vuelve a pedir al reintentar.
 */
export default function FotoEvidencia({ analisis, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const tituloId = useId()
  const evidencia = useCarga((signal) => getEvidencia(analisis.id, signal), [analisis.id])
  const [rota, setRota] = useState<string | null>(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d || d.open) return
    // jsdom (tests) no implementa showModal; en navegadores siempre existe.
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
    // Sin limpieza a propósito: cerrar aquí dispara "close" → onCerrar, y en StrictMode (montar,
    // limpiar, montar) el diálogo se cerraba solo. Al desmontarse, salir del DOM ya lo quita.
  }, [])

  const fecha = formatFecha(analisis.fechaCaptura)
  const tipo = ETIQUETA_TIPO[analisis.tipoImagen]
  const url = evidencia.datos?.url
  const fallo = url !== undefined && rota === url

  return (
    // Esc dispara "cancel" y luego "close": basta con escuchar "close" (si no, onCerrar corre dos veces).
    <dialog ref={dialogo} className="foto" aria-labelledby={tituloId} onClose={onCerrar}>
      <header className="foto-encabezado">
        <h2 id={tituloId}>
          {tipo}, {fecha}
        </h2>
        <button type="button" className="btn btn-ghost btn-chico" onClick={onCerrar} autoFocus>
          Cerrar
        </button>
      </header>

      {evidencia.estado === 'cargando' && <Cargando texto="Cargando la foto…" lineas={1} />}
      {evidencia.estado === 'error' && <ErrorCarga mensaje={evidencia.error} onReintentar={evidencia.reintentar} />}
      {url && !fallo && (
        <img
          className="foto-imagen"
          src={url}
          alt={`Foto de ${tipo.toLowerCase()} capturada el ${fecha}. Resultado: ${ETIQUETA_RESULTADO[analisis.resultadoClasificacion]}.`}
          onError={() => setRota(url)}
        />
      )}
      {fallo && (
        <ErrorCarga
          mensaje="La foto no se pudo cargar. Si el enlace caducó, pide uno nuevo."
          onReintentar={evidencia.reintentar}
        />
      )}
    </dialog>
  )
}
