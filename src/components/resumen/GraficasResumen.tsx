import { utcDay } from 'd3-time'
import { useMemo } from 'react'
import type { Analisis, Arbol, Zona } from '../../lib/api'
import {
  dominioDatos,
  escribirFiltros,
  histogramaConfianza,
  intervaloPara,
  nombresDeLugares,
  porLugar,
  rangoDe,
  serieTiempo,
  SIN_FILTROS,
  type Dominio,
  type Filtros,
} from '../../lib/graficos'
import { navigate } from '../../lib/router'
import GraficaLugares from '../graficos/GraficaLugares'
import GraficaTiempo from '../graficos/GraficaTiempo'
import HistogramaConfianza from '../graficos/HistogramaConfianza'

// Las gráficas clave del Resumen, en su propio chunk (d3): se cargan sin frenar los indicadores.
// Versiones ligeras de las de Gráficos (sin pincel); cada una lleva a Gráficos con los mismos filtros.

/** Días que muestra la gráfica de actividad (los últimos con datos). */
export const DIAS_ACTIVIDAD = 30
const TOP_LUGARES = 5

interface Props {
  analisis: Analisis[]
  arboles: Arbol[]
  zonas: Zona[]
}

const aGraficos = (f: Partial<Filtros>) => {
  const qs = escribirFiltros({ ...SIN_FILTROS, ...f }).toString()
  return `#/graficos${qs ? `?${qs}` : ''}`
}
const ir = (href: string) => {
  window.location.hash = href
}

export default function GraficasResumen({ analisis, arboles, zonas }: Props) {
  const datos = useMemo(() => dominioDatos(analisis), [analisis])
  const nombres = useMemo(() => nombresDeLugares(arboles, zonas), [arboles, zonas])

  const vista = useMemo<{ dominio: Dominio; rango: Pick<Filtros, 'desde' | 'hasta'> } | null>(() => {
    if (!datos) return null
    const inicio = utcDay.offset(datos[1], -DIAS_ACTIVIDAD)
    const dominio: Dominio = [inicio > datos[0] ? inicio : datos[0], datos[1]]
    return { dominio, rango: rangoDe(dominio, datos) }
  }, [datos])

  const tiempo = useMemo(
    () => (vista ? serieTiempo(analisis, vista.dominio, intervaloPara(vista.dominio), nombres) : []),
    [analisis, vista, nombres],
  )
  const histograma = useMemo(() => histogramaConfianza(analisis), [analisis])
  // Los lugares con más infestación (y, a igualdad, más análisis).
  const top = useMemo(
    () =>
      porLugar(analisis, arboles, zonas)
        .filter((f) => f.total > 0)
        .sort((a, b) => b.conteos.infestado - a.conteos.infestado || b.total - a.total)
        .slice(0, TOP_LUGARES),
    [analisis, arboles, zonas],
  )

  if (!datos || !vista) return null
  const intervalo = intervaloPara(vista.dominio)

  return (
    <div className="rejilla-graficos resumen-graficas">
      <div className="resumen-grafica-ancha">
        <GraficaTiempo
          compacta
          periodos={tiempo}
          intervalo={intervalo}
          dominio={vista.dominio}
          general={{ dominio: datos, dias: tiempo }}
          conRango={false}
          resultadoElegido={null}
          onElegirResultado={(r) => ir(aGraficos({ ...vista.rango, resultado: r }))}
          onElegirPeriodo={(p) => {
            const d0 = p.inicio < datos[0] ? datos[0] : p.inicio
            const d1 = p.fin > datos[1] ? datos[1] : p.fin
            ir(aGraficos(rangoDe([d0, d1], datos)))
          }}
          onRango={() => {}}
          onQuitarFiltros={() => {}}
          enlace={{ href: aGraficos(vista.rango), texto: 'Ver en Gráficos', etiqueta: 'Ver la actividad en Gráficos' }}
          nivel={3}
        />
      </div>
      <GraficaLugares
        filas={top}
        elegido={null}
        onAbrir={(l) => navigate(l.tipo, { id: l.id })}
        onQuitarFiltros={() => {}}
        titulo="Dónde hay más infestación"
        descripcion={`Los ${TOP_LUGARES} árboles y zonas con más análisis infestados. Clic o Enter abre su seguimiento.`}
        enlace={{ href: aGraficos({ resultado: 'infestado' }), texto: 'Ver en Gráficos', etiqueta: 'Ver dónde hay más infestación en Gráficos' }}
        nivel={3}
      />
      <HistogramaConfianza
        decenas={histograma.decenas}
        sinConfianza={histograma.sinConfianza}
        elegida={null}
        onElegir={(i) => ir(aGraficos({ confianza: i }))}
        onQuitarFiltros={() => {}}
        descripcion="Cuántos análisis hay en cada decena de confianza. Clic o Enter en una barra la abre en Gráficos."
        enlace={{ href: aGraficos({}), texto: 'Ver en Gráficos', etiqueta: 'Ver la confianza del modelo en Gráficos' }}
        nivel={3}
      />
    </div>
  )
}
