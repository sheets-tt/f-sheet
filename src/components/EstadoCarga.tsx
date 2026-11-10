/** Error de carga con su mensaje y la acción para reintentar. */
export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="error-carga">
      <p className="alert" role="alert">
        {mensaje}
      </p>
      {onReintentar && (
        <button type="button" className="btn btn-secondary" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

/** Marcador de carga: bloques grises del tamaño aproximado del contenido. */
export function Cargando({ texto, lineas = 3 }: { texto: string; lineas?: number }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" aria-hidden="true" />
      ))}
      <p className="visually-hidden" role="status">
        {texto}
      </p>
    </div>
  )
}
