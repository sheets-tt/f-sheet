import { useId } from 'react'

export interface Parte {
  clave: string
  etiqueta: string
  valor: number
  /** Clase de color: "c-sano", "c-regular", "c-infestado", "c-neutro". */
  color: string
}

const pct = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })

interface Props {
  titulo: string
  partes: Parte[]
  /** "conteo": valores absolutos con su porcentaje; "porcentaje": los valores ya son porcentajes. */
  modo: 'conteo' | 'porcentaje'
  /** "alta" (28px, porcentaje impreso dentro, leyenda y tabla) o "delgada" (8px, sin texto: el texto va al lado). */
  variante?: 'alta' | 'delgada'
  /** Nombre accesible si no se quiere el título (filas de tabla). */
  nombre?: string
}

/**
 * Un todo dividido en partes (forma "segmented bar" de la skill de dataviz): anchos proporcionales,
 * 2px de separación en el color de la superficie, nada para las partes en cero. El nombre accesible
 * lleva todas las cifras; la variante alta agrega una tabla para leerla sin color.
 */
export default function BarraSegmentada({ titulo, partes, modo, variante = 'alta', nombre }: Props) {
  const id = useId()
  const total = partes.reduce((s, p) => s + p.valor, 0)
  const share = (p: Parte) => (total > 0 ? (p.valor / total) * 100 : 0)
  const texto = (p: Parte) =>
    modo === 'conteo' ? `${p.etiqueta} ${p.valor} (${pct.format(share(p))} %)` : `${p.etiqueta} ${pct.format(p.valor)} %`
  const etiqueta = `${nombre ?? titulo}: ${partes.map(texto).join(', ')}`
  const visibles = partes.filter((p) => p.valor > 0)

  return (
    <div className={`barra barra-${variante}`}>
      <div className="barra-pista" role="img" aria-label={etiqueta}>
        {visibles.map((p) => (
          <span
            key={p.clave}
            className={`barra-parte ${p.color}`}
            style={{ flexGrow: p.valor }}
            title={texto(p)}
          >
            {variante === 'alta' && share(p) >= 12 && <span className="barra-cifra">{pct.format(share(p))} %</span>}
          </span>
        ))}
      </div>

      {variante === 'alta' && (
        <>
          <ul className="leyenda" aria-hidden="true">
            {partes.map((p) => (
              <li key={p.clave}>
                <span className={`muestra ${p.color}`} />
                {p.etiqueta}
              </li>
            ))}
          </ul>
          <details className="como-tabla">
            <summary>Ver como tabla</summary>
            <table aria-labelledby={id}>
              <caption id={id}>{titulo}</caption>
              <thead>
                <tr>
                  <th scope="col">Categoría</th>
                  {modo === 'conteo' && <th scope="col">Análisis</th>}
                  <th scope="col">Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {partes.map((p) => (
                  <tr key={p.clave}>
                    <th scope="row">{p.etiqueta}</th>
                    {modo === 'conteo' && <td className="num">{p.valor}</td>}
                    <td className="num">{pct.format(modo === 'conteo' ? share(p) : p.valor)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  )
}
