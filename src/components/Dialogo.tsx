import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  titulo: string
  /** Texto bajo el título; queda como descripción accesible del diálogo. */
  descripcion?: ReactNode
  onCerrar: () => void
  /** Mientras se guarda, Esc y "Cancelar" no cierran (la petición ya salió). */
  bloqueado?: boolean
  /** "ancho" para contenido con foto y datos (detalle de un análisis). */
  ancho?: 'normal' | 'ancho'
  children: ReactNode
}

/**
 * <dialog> modal: el navegador atrapa el foco y Esc cierra. Mismo patrón que FotoEvidencia: se abre
 * al montar y quien lo usa lo desmonta en onCerrar (y devuelve el foco a donde corresponda).
 */
export default function Dialogo({ titulo, descripcion, onCerrar, bloqueado = false, ancho = 'normal', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const tituloId = useId()
  const descripcionId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d || d.open) return
    // jsdom (tests) no implementa showModal; en navegadores siempre existe.
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
    // React no pone el atributo autofocus (enfoca al montar, antes de showModal, que luego enfoca el
    // propio diálogo): el control inicial se marca con data-autofocus y se enfoca aquí.
    d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    // Sin limpieza: ver FotoEvidencia (StrictMode cerraría el diálogo al volver a montar).
  }, [])

  return (
    <dialog
      ref={ref}
      className={ancho === 'ancho' ? 'dialogo dialogo-ancho' : 'dialogo'}
      aria-labelledby={tituloId}
      aria-describedby={descripcion ? descripcionId : undefined}
      onCancel={(e) => {
        if (bloqueado) e.preventDefault()
      }}
      onClose={onCerrar}
    >
      <h2 id={tituloId}>{titulo}</h2>
      {descripcion && (
        <div id={descripcionId} className="dialogo-descripcion">
          {descripcion}
        </div>
      )}
      {children}
    </dialog>
  )
}
