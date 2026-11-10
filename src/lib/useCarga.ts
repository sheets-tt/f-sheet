import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api'

export type Carga<T> =
  | { estado: 'cargando'; datos?: undefined; error?: undefined }
  | { estado: 'listo'; datos: T; error?: undefined }
  | { estado: 'error'; datos?: T; error: string }

/**
 * Carga datos con cancelación. `deps` deben ser valores serializables (se comparan por JSON).
 * Al recargar conserva los datos anteriores y marca `recargando`, para no vaciar la pantalla.
 * Los 401 los gestiona el handler global de api.ts (vuelve a login).
 */
export function useCarga<T>(
  cargar: (signal: AbortSignal) => Promise<T>,
  deps: readonly (string | number | boolean | null)[],
): Carga<T> & { recargando: boolean; reintentar: () => void } {
  const [intento, setIntento] = useState(0)
  const clave = JSON.stringify([...deps, intento])
  // `de` = la clave a la que corresponde la última respuesta; si no coincide, hay una petición en curso.
  const [resultado, setResultado] = useState<{ de: string | null; carga: Carga<T> }>({
    de: null,
    carga: { estado: 'cargando' },
  })

  useEffect(() => {
    const ctrl = new AbortController()
    cargar(ctrl.signal)
      .then((datos) => setResultado({ de: clave, carga: { estado: 'listo', datos } }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        if (err instanceof ApiError && err.status === 401) return
        setResultado((previo) => ({
          de: clave,
          carga: {
            estado: 'error',
            datos: previo.carga.datos,
            error: err instanceof ApiError ? err.message : 'No se pudieron cargar los datos.',
          },
        }))
      })
    return () => ctrl.abort()
    // `cargar` cambia en cada render; lo que importa está en `clave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return { ...resultado.carga, recargando: resultado.de !== clave, reintentar }
}
