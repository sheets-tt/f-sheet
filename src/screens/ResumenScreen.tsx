import { useEffect } from 'react'
import BarraSegmentada from '../components/BarraSegmentada'
import { Cargando, ErrorCarga } from '../components/EstadoCarga'
import Simbolo, { Estado, TONO_SINCRONIZACION } from '../components/Simbolo'
import { getEstadisticas, type Estadisticas } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_SINCRONIZACION, formatFecha } from '../lib/format'
import { hrefDe } from '../lib/router'
import { useCarga } from '../lib/useCarga'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "1 árbol y 1 zona con infestación detectada" / "Sin infestación detectada". */
export function fraseInfestacion(arboles: number, zonas: number): string {
  const partes = [
    arboles > 0 ? plural(arboles, 'árbol', 'árboles') : null,
    zonas > 0 ? plural(zonas, 'zona', 'zonas') : null,
  ].filter(Boolean)
  return partes.length ? `${partes.join(' y ')} con infestación detectada` : 'Sin infestación detectada'
}

export default function ResumenScreen() {
  const carga = useCarga((signal) => getEstadisticas(signal), [])

  useEffect(() => {
    document.title = 'Resumen · Sheets TT'
  }, [])

  return (
    <div className="pagina" aria-busy={carga.estado === 'cargando'}>
      <header className="pagina-encabezado">
        <h1>Resumen</h1>
        {carga.datos && (
          <p className="muted">
            Última captura: {carga.datos.ultimaCaptura ? formatFecha(carga.datos.ultimaCaptura) : 'aún no hay capturas'}
          </p>
        )}
      </header>

      {carga.estado === 'cargando' && <Cargando texto="Cargando el resumen…" />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos && <Contenido e={carga.datos} />}
    </div>
  )
}

function Contenido({ e }: { e: Estadisticas }) {
  const t = e.totales
  const hayFocos = t.arbolesConInfestacion + t.zonasConInfestacion > 0

  return (
    <>
      <p className={`foco${hayFocos ? ' foco-alerta' : ''}`}>
        <Simbolo tono={hayFocos ? 'alerta' : 'bien'} />
        <span>{fraseInfestacion(t.arbolesConInfestacion, t.zonasConInfestacion)}</span>
        {hayFocos && (
          <a className="foco-enlace" href={hrefDe('mapa')}>
            Ver en el mapa
          </a>
        )}
      </p>

      <ul className="totales" aria-label="Totales">
        <li><span>Árboles</span><strong>{t.arboles}</strong></li>
        <li><span>Zonas de follaje</span><strong>{t.zonas}</strong></li>
        <li><span>Análisis</span><strong>{t.analisis}</strong></li>
        <li><span>Dispositivos</span><strong>{t.dispositivos}</strong></li>
      </ul>

      <div className="rejilla-resumen">
        <section className="bloque" aria-labelledby="titulo-resultados">
          <h2 id="titulo-resultados">Resultado de los análisis</h2>
          <p className="muted bloque-nota">
            {e.analisisPorTipo.corteza} de corteza y {e.analisisPorTipo.follaje} de follaje
          </p>
          <BarraSegmentada
            titulo="Resultado de los análisis"
            modo="conteo"
            partes={[
              { clave: 'sano', etiqueta: ETIQUETA_RESULTADO.sano, valor: e.analisisPorResultado.sano, color: 'c-sano' },
              { clave: 'infestado', etiqueta: ETIQUETA_RESULTADO.infestado, valor: e.analisisPorResultado.infestado, color: 'c-infestado' },
              { clave: 'no_determinado', etiqueta: ETIQUETA_RESULTADO.no_determinado, valor: e.analisisPorResultado.no_determinado, color: 'c-neutro' },
            ]}
          />
        </section>

        <section className="bloque" aria-labelledby="titulo-cromatico">
          <h2 id="titulo-cromatico">Cromático promedio del follaje</h2>
          <p className="muted bloque-nota">Porcentaje del dosel en cada condición</p>
          {e.cromaticoPromedio ? (
            <BarraSegmentada
              titulo="Cromático promedio del follaje"
              modo="porcentaje"
              partes={partesCromatico(e.cromaticoPromedio)}
            />
          ) : (
            <p className="muted">Aún no hay análisis cromáticos de follaje.</p>
          )}
        </section>

        <section className="bloque" aria-labelledby="titulo-sincronizacion">
          <h2 id="titulo-sincronizacion">Sincronización desde el móvil</h2>
          <BarraSegmentada
            titulo="Sincronización desde el móvil"
            modo="conteo"
            variante="delgada"
            partes={[
              { clave: 'sincronizado', etiqueta: ETIQUETA_SINCRONIZACION.sincronizado, valor: e.analisisPorSincronizacion.sincronizado, color: 'c-sano' },
              { clave: 'pendiente', etiqueta: ETIQUETA_SINCRONIZACION.pendiente, valor: e.analisisPorSincronizacion.pendiente, color: 'c-regular' },
              { clave: 'error', etiqueta: ETIQUETA_SINCRONIZACION.error, valor: e.analisisPorSincronizacion.error, color: 'c-infestado' },
            ]}
          />
          <ul className="lista-cifras">
            {(['sincronizado', 'pendiente', 'error'] as const).map((k) => (
              <li key={k}>
                <Estado tono={TONO_SINCRONIZACION[k]}>{ETIQUETA_SINCRONIZACION[k]}</Estado>
                <span className="num">{e.analisisPorSincronizacion[k]}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

export function partesCromatico(c: { pctSano: number; pctRegular: number; pctDanado: number; pctIncierto: number }) {
  return [
    { clave: 'sano', etiqueta: 'Sano', valor: c.pctSano, color: 'c-sano' },
    { clave: 'regular', etiqueta: 'Regular', valor: c.pctRegular, color: 'c-regular' },
    { clave: 'danado', etiqueta: 'Dañado', valor: c.pctDanado, color: 'c-infestado' },
    { clave: 'incierto', etiqueta: 'Incierto', valor: c.pctIncierto, color: 'c-neutro' },
  ]
}
