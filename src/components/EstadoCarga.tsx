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
