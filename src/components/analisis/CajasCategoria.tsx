import type { ReactNode } from 'react'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO } from '../../lib/format'
import {
  alternar,
  ETIQUETA_NIVEL,
  NIVELES,
  porcentaje,
  RANGO_NIVEL,
  RESULTADOS,
  TIPOS,
  type Cajas,
  type ConteosCajas,
} from '../../lib/analisis'
import { SIN_AUTOR, TITULO_CERTEZA } from '../../lib/lenguaje'
import Simbolo, { TONO_RESULTADO } from '../Simbolo'

interface Props {
  conteos: ConteosCajas
  cajas: Cajas
  onCambiar: (c: Cajas) => void
}

/** Medidor café de la proporción (magnitud): SVG con atributos, sin style (CSP). */
export function Medidor({ fraccion, className = '' }: { fraccion: number; className?: string }) {
  const ancho = Math.max(0, Math.min(1, fraccion)) * 100
  return (
    <svg className={`medidor ${className}`} viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="medidor-fondo" width="100" height="6" rx="3" />
      {ancho > 0 && <rect className="medidor-valor" width={Math.max(ancho, 3)} height="6" rx="3" />}
    </svg>
  )
}

const ICONO_TIPO = {
  // Corteza: placas; follaje: hoja. Decorativos (la etiqueta dice el tipo).
  corteza: 'M5 4h6v7H5zM13 4h6v5h-6zM13 11h6v9h-6zM5 13h6v7H5z',
  follaje: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14zM5 19l8-8',
}

function Caja({
  activa,
  etiqueta,
  n,
  total,
  icono,
  detalle,
  onClick,
  medidor = false,
}: {
  activa: boolean
  etiqueta: string
  n: number
  total: number
  icono: ReactNode
  detalle?: string
  onClick: () => void
  medidor?: boolean
}) {
  return (
    <button
      type="button"
      className={`caja${activa ? ' caja-activa' : ''}`}
      aria-pressed={activa}
      aria-label={`${etiqueta}: ${n} ${n === 1 ? 'análisis' : 'análisis'}, ${porcentaje(n, total)}${detalle ? ` (${detalle})` : ''}`}
      onClick={onClick}
    >
      <span className="caja-encabezado">
        {icono}
        <span className="caja-etiqueta">{etiqueta}</span>
      </span>
      <span className="caja-cifra">{n}</span>
      <span className="caja-pct">{porcentaje(n, total)}</span>
      {medidor && <Medidor fraccion={total ? n / total : 0} />}
      {detalle && <span className="caja-detalle">{detalle}</span>}
    </button>
  )
}

/**
 * Cajas por categoría sobre los análisis cargados: un clic filtra (y se combina con las demás
 * cajas). Dentro de un grupo suman; entre grupos, se cruzan. Los resultados llevan su color de
 * estado + forma; la certeza, un medidor café (magnitud). Quién subió la foto aparece si hay más
 * de una opción entre los cargados.
 */
export default function CajasCategoria({ conteos, cajas, onCambiar }: Props) {
  const t = conteos.total
  // La certeza solo aplica a la corteza: sus porcentajes son sobre los análisis de corteza.
  const tCorteza = NIVELES.reduce((s, n) => s + conteos.confianza[n], 0)
  return (
    <section className="cajas" aria-labelledby="titulo-cajas">
      <h2 id="titulo-cajas" className="visually-hidden">
        Por categoría
      </h2>
      <div className="cajas-grupo" role="group" aria-labelledby="cajas-resultado">
        <h3 id="cajas-resultado">Por resultado</h3>
        <div className="cajas-fila">
          {RESULTADOS.map((r) => (
            <Caja
              key={r}
              activa={cajas.resultado.includes(r)}
              etiqueta={ETIQUETA_RESULTADO[r]}
              n={conteos.resultado[r]}
              total={t}
              icono={<Simbolo tono={TONO_RESULTADO[r]} />}
              onClick={() => onCambiar({ ...cajas, resultado: alternar(cajas.resultado, r, RESULTADOS) })}
            />
          ))}
        </div>
      </div>

      <div className="cajas-grupo" role="group" aria-labelledby="cajas-tipo">
        <h3 id="cajas-tipo">Por tipo de foto</h3>
        <div className="cajas-fila">
          {TIPOS.map((tipo) => (
            <Caja
              key={tipo}
              activa={cajas.tipo.includes(tipo)}
              etiqueta={ETIQUETA_TIPO[tipo]}
              n={conteos.tipo[tipo]}
              total={t}
              icono={
                <svg className="icono" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d={ICONO_TIPO[tipo]} />
                </svg>
              }
              onClick={() => onCambiar({ ...cajas, tipo: alternar(cajas.tipo, tipo, TIPOS) })}
            />
          ))}
        </div>
      </div>

      <div className="cajas-grupo" role="group" aria-labelledby="cajas-confianza">
        <h3 id="cajas-confianza">Por {TITULO_CERTEZA.toLowerCase()} (solo corteza)</h3>
        <div className="cajas-fila">
          {NIVELES.map((nivel) => (
            <Caja
              key={nivel}
              activa={cajas.confianza.includes(nivel)}
              etiqueta={ETIQUETA_NIVEL[nivel]}
              n={conteos.confianza[nivel]}
              total={tCorteza}
              detalle={RANGO_NIVEL[nivel]}
              medidor
              icono={null}
              onClick={() => onCambiar({ ...cajas, confianza: alternar(cajas.confianza, nivel, NIVELES) })}
            />
          ))}
        </div>
      </div>

      {conteos.autores.length > 1 && (
        <div className="cajas-grupo" role="group" aria-labelledby="cajas-autor">
          <h3 id="cajas-autor">Por quién subió la foto</h3>
          <div className="cajas-fila">
            {conteos.autores.map((x) => (
              <Caja
                key={x.id}
                activa={cajas.autor.includes(x.id)}
                etiqueta={x.nombre ?? SIN_AUTOR}
                n={x.n}
                total={t}
                icono={null}
                onClick={() => onCambiar({ ...cajas, autor: alternar(cajas.autor, x.id, [...new Set([...cajas.autor, x.id])].sort()) })}
              />
            ))}
          </div>
        </div>
      )}

      <div className="cajas-grupo cajas-atencion" role="group" aria-labelledby="cajas-atencion">
        <h3 id="cajas-atencion">Requieren atención</h3>
        <div className="cajas-fila">
          <Caja
            activa={cajas.atencion}
            etiqueta="Requieren atención"
            n={conteos.atencion}
            total={t}
            detalle="infestados, sin diagnóstico claro, certeza baja o con error al enviar"
            icono={<Simbolo tono="alerta" />}
            onClick={() => onCambiar({ ...cajas, atencion: !cajas.atencion })}
          />
        </div>
      </div>
    </section>
  )
}
