import { utcDay } from 'd3-time'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoTabla } from '../components/Esqueleto'
import GraficaLugares from '../components/graficos/GraficaLugares'
import GraficaTiempo from '../components/graficos/GraficaTiempo'
import HistogramaConfianza from '../components/graficos/HistogramaConfianza'
import MapaCalor from '../components/graficos/MapaCalor'
import { Estado, TONO_RESULTADO } from '../components/Simbolo'
import { buscarAnalisis, getArboles, getZonas, type Analisis, type Arbol, type Zona } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../lib/format'
import {
  claveDia,
  claveLugar,
  diaAPared,
  dominioDatos,
  dominioVisible,
  escribirFiltros,
  filtrar,
  formatoDia,
  histogramaConfianza,
  indicadores,
  intervaloPara,
  leerFiltros,
  lugarDe,
  mapaCalor,
  moverDominio,
  nombresDeLugares,
  plural,
  porLugar,
  rangoDe,
  serieTiempo,
  SIN_FILTROS,
  TIPOS,
  type Dominio,
  type Filtros,
  type Lugar,
} from '../lib/graficos'
import { fijarConsulta, hrefDe, navigate, useConsulta } from '../lib/router'
import { useCarga } from '../lib/useCarga'

/** El máximo que acepta GET /analisis: las gráficas se calculan en el navegador sobre estos. */
const LIMITE = 500

interface Datos {
  analisis: Analisis[]
  arboles: Arbol[]
  zonas: Zona[]
}

export default function GraficosScreen() {
  const carga = useCarga<Datos>(
    async (signal) => {
      const [analisis, arboles, zonas] = await Promise.all([
        buscarAnalisis({ limite: LIMITE }, signal),
        getArboles(signal),
        getZonas(signal),
      ])
      return { analisis, arboles, zonas }
    },
    [],
  )

  useEffect(() => {
    document.title = 'Gráficos · Sheets TT'
  }, [])

  return (
    <div className="pagina pagina-graficos" aria-busy={carga.estado === 'cargando'}>
      <header className="pagina-encabezado">
        <h1>Gráficos</h1>
        <p className="muted">
          Explora los análisis por fecha, resultado, confianza y lugar. Lo que eliges en una gráfica filtra las demás, y la vista queda en la
          dirección para compartirla.
        </p>
      </header>
      {carga.estado === 'cargando' && <EsqueletoTabla texto="Cargando gráficos…" filas={4} columnas={4} />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos && <Contenido {...carga.datos} />}
    </div>
  )
}

function Contenido({ analisis, arboles, zonas }: Datos) {
  const consulta = useConsulta()
  const filtros = useMemo(() => leerFiltros(consulta), [consulta])
  const datos = useMemo(() => dominioDatos(analisis), [analisis])
  const nombres = useMemo(() => nombresDeLugares(arboles, zonas), [arboles, zonas])

  if (!datos) {
    return (
      <section className="panel grafica-vacia">
        <p>Aún no hay análisis. Las gráficas aparecen en cuanto la app móvil sincronice las primeras capturas.</p>
      </section>
    )
  }
  return <Vista analisis={analisis} arboles={arboles} zonas={zonas} filtros={filtros} datos={datos} nombres={nombres} />
}

interface VistaProps extends Datos {
  filtros: Filtros
  datos: Dominio
  nombres: Map<string, string>
}

function Vista({ analisis, arboles, zonas, filtros, datos, nombres }: VistaProps) {
  const visible = useMemo(() => dominioVisible(filtros, datos), [filtros, datos])
  const intervalo = intervaloPara(visible)
  const conRango = filtros.desde !== null || filtros.hasta !== null

  /** Cada cambio es un paso del historial (Atrás lo deshace) y la URL se puede compartir. */
  function cambiar(parcial: Partial<Filtros>) {
    fijarConsulta(escribirFiltros({ ...filtros, ...parcial }))
  }
  const fijarRango = (d: Dominio | null) => cambiar(d ? rangoDe(d, datos) : { desde: null, hasta: null })
  const quitarTodo = () => fijarConsulta(escribirFiltros(SIN_FILTROS))
  const quitarSeleccion = () => cambiar({ resultado: null, tipo: null, lugar: null, confianza: null })

  // Datos de cada gráfica: todos los filtros menos los de su propia dimensión (crossfilter).
  const tiempo = useMemo(
    () => serieTiempo(filtrar(analisis, filtros, ['resultado']), visible, intervalo, nombres),
    [analisis, filtros, visible, intervalo, nombres],
  )
  const general = useMemo(
    () => ({ dominio: datos, dias: serieTiempo(filtrar(analisis, filtros, ['tiempo', 'resultado']), datos, 'dia', nombres) }),
    [analisis, filtros, datos, nombres],
  )
  const histograma = useMemo(() => histogramaConfianza(filtrar(analisis, filtros, ['confianza'])), [analisis, filtros])
  const lugares = useMemo(() => porLugar(filtrar(analisis, filtros, ['lugar']), arboles, zonas), [analisis, filtros, arboles, zonas])
  const celdas = useMemo(
    () => mapaCalor(filtrar(analisis, filtros, ['lugar']), lugares, tiempo, intervalo),
    [analisis, filtros, lugares, tiempo, intervalo],
  )
  const seleccion = useMemo(() => filtrar(analisis, filtros), [analisis, filtros])
  const ind = indicadores(seleccion)

  const chips = chipsDe(filtros, nombres, visible)

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Esc quita lo elegido en las gráficas (no el rango: para eso está "Restablecer").
    if (e.key !== 'Escape' || e.defaultPrevented) return
    if (filtros.resultado || filtros.tipo || filtros.lugar || filtros.confianza !== null) {
      e.preventDefault()
      quitarSeleccion()
    }
  }

  const irALugar = (l: Lugar) => navigate(l.tipo, { id: l.id })

  return (
    <div className="graficos" onKeyDown={onKeyDown}>
      <FilaFiltros
        filtros={filtros}
        datos={datos}
        visible={visible}
        intervalo={intervalo}
        conRango={conRango}
        arboles={arboles}
        zonas={zonas}
        cambiar={cambiar}
        fijarRango={fijarRango}
      />

      {chips.length > 0 && (
        <div className="chips" role="region" aria-label="Filtros activos">
          <ul>
            {chips.map((c) => (
              <li key={c.clave} className="chip">
                <span>{c.texto}</span>
                <button type="button" aria-label={`Quitar ${c.texto}`} onClick={() => cambiar(c.quitar)}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" className="icono">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="enlace" onClick={quitarTodo}>
            Quitar todo
          </button>
        </div>
      )}

      <ul className="indicadores" aria-label="Indicadores de la selección">
        <li>
          <span>Análisis</span>
          <strong>{ind.total}</strong>
        </li>
        <li>
          <span>Infestados</span>
          <strong>
            {ind.infestados}
            {ind.pctInfestado !== null && <small> ({formatPorcentaje(ind.pctInfestado)})</small>}
          </strong>
        </li>
        <li>
          <span>Confianza media</span>
          <strong>{formatPorcentaje(ind.confianzaMedia)}</strong>
        </li>
        <li>
          <span>Árboles y zonas</span>
          <strong>{ind.lugares}</strong>
        </li>
      </ul>
      {analisis.length >= LIMITE && (
        <p className="notice">Se muestran los {LIMITE} análisis más recientes; los anteriores no entran en las gráficas.</p>
      )}

      <GraficaTiempo
        periodos={tiempo}
        intervalo={intervalo}
        dominio={visible}
        general={general}
        conRango={conRango}
        resultadoElegido={filtros.resultado}
        onElegirResultado={(r) => cambiar({ resultado: r })}
        onElegirPeriodo={(p) => fijarRango([p.inicio < datos[0] ? datos[0] : p.inicio, p.fin > datos[1] ? datos[1] : p.fin])}
        onRango={fijarRango}
        onQuitarFiltros={quitarTodo}
      />

      <div className="rejilla-graficos">
        <HistogramaConfianza
          decenas={histograma.decenas}
          sinConfianza={histograma.sinConfianza}
          elegida={filtros.confianza}
          onElegir={(i) => cambiar({ confianza: filtros.confianza === i ? null : i })}
          onQuitarFiltros={quitarTodo}
        />
        <GraficaLugares filas={lugares} elegido={filtros.lugar} onAbrir={irALugar} onQuitarFiltros={quitarTodo} />
      </div>

      <MapaCalor
        filas={lugares}
        periodos={tiempo}
        celdas={celdas}
        intervalo={intervalo}
        elegido={filtros.lugar}
        onElegir={(l) => cambiar({ lugar: filtros.lugar && claveLugar(filtros.lugar) === claveLugar(l) ? null : l })}
        onQuitarFiltros={quitarTodo}
      />

      <ListaSeleccion analisis={seleccion} nombres={nombres} />
    </div>
  )
}

interface Chip {
  clave: string
  texto: string
  quitar: Partial<Filtros>
}

function chipsDe(f: Filtros, nombres: Map<string, string>, visible: Dominio): Chip[] {
  const chips: Chip[] = []
  if (f.desde || f.hasta) {
    chips.push({
      clave: 'rango',
      texto: `Del ${formatoDia(visible[0])} al ${formatoDia(utcDay.offset(visible[1], -1))}`,
      quitar: { desde: null, hasta: null },
    })
  }
  if (f.resultado) chips.push({ clave: 'resultado', texto: `Resultado: ${ETIQUETA_RESULTADO[f.resultado]}`, quitar: { resultado: null } })
  if (f.tipo) chips.push({ clave: 'tipo', texto: `Tipo: ${ETIQUETA_TIPO[f.tipo]}`, quitar: { tipo: null } })
  if (f.lugar) {
    const nombre = nombres.get(claveLugar(f.lugar)) ?? f.lugar.id
    chips.push({ clave: 'lugar', texto: `${f.lugar.tipo === 'arbol' ? 'Árbol' : 'Zona'}: ${nombre}`, quitar: { lugar: null } })
  }
  if (f.confianza !== null)
    chips.push({ clave: 'confianza', texto: `Confianza: ${f.confianza * 10}–${(f.confianza + 1) * 10} %`, quitar: { confianza: null } })
  return chips
}

interface FilaProps {
  filtros: Filtros
  datos: Dominio
  visible: Dominio
  intervalo: ReturnType<typeof intervaloPara>
  conRango: boolean
  arboles: Arbol[]
  zonas: Zona[]
  cambiar: (p: Partial<Filtros>) => void
  fijarRango: (d: Dominio | null) => void
}

/** Una fila sobre las gráficas: rango (fechas y botones), tipo y lugar. */
function FilaFiltros({ filtros, datos, visible, intervalo, conRango, arboles, zonas, cambiar, fijarRango }: FilaProps) {
  const min = claveDia(datos[0])
  const max = claveDia(utcDay.offset(datos[1], -1))
  const desde = claveDia(visible[0])
  const hasta = claveDia(utcDay.offset(visible[1], -1))
  const todo = !conRango
  const mover = (a: Parameters<typeof moverDominio>[2]) => fijarRango(moverDominio(visible, datos, a))
  const dias = utcDay.count(visible[0], visible[1])

  function fecha(campo: 'desde' | 'hasta', valor: string) {
    if (!valor) return cambiar({ [campo]: null })
    const otro = campo === 'desde' ? hasta : desde
    // Si quedan al revés, se intercambian (nunca un rango vacío).
    const [a, b] = campo === 'desde' ? [valor, otro] : [otro, valor]
    const [d0, d1] = a <= b ? [a, b] : [b, a]
    fijarRango([diaAPared(d0), utcDay.offset(diaAPared(d1), 1)])
  }

  return (
    <form className="filtros panel filtros-graficos" aria-label="Filtros de las gráficas" onSubmit={(e) => e.preventDefault()}>
      <div className="field">
        <label htmlFor="g-desde">Desde</label>
        <input id="g-desde" type="date" min={min} max={max} value={desde} onChange={(e) => fecha('desde', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="g-hasta">Hasta</label>
        <input id="g-hasta" type="date" min={min} max={max} value={hasta} onChange={(e) => fecha('hasta', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="g-tipo">Tipo</label>
        <select id="g-tipo" value={filtros.tipo ?? ''} onChange={(e) => cambiar({ tipo: (e.target.value || null) as Filtros['tipo'] })}>
          <option value="">Todos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="g-lugar">Árbol o zona</label>
        <select
          id="g-lugar"
          value={filtros.lugar ? claveLugar(filtros.lugar) : ''}
          onChange={(e) => {
            const [tipo, id] = e.target.value.split(':')
            cambiar({ lugar: id ? { tipo: tipo as Lugar['tipo'], id } : null })
          }}
        >
          <option value="">Todos</option>
          <optgroup label="Árboles">
            {arboles.map((a) => (
              <option key={a.id} value={claveLugar({ tipo: 'arbol', id: a.id })}>
                {a.nombreEspecifico}
              </option>
            ))}
          </optgroup>
          <optgroup label="Zonas de follaje">
            {zonas.map((z) => (
              <option key={z.id} value={claveLugar({ tipo: 'zona', id: z.id })}>
                {z.nombreZona}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="filtros-acciones rango-acciones">
        <p className="rango-texto" aria-live="polite">
          {formatoDia(visible[0])} – {formatoDia(utcDay.offset(visible[1], -1))} · por {intervalo === 'dia' ? 'día' : intervalo}
        </p>
        <div className="botones-rango" role="group" aria-label="Rango de fechas">
          <button type="button" className="btn btn-ghost btn-chico" onClick={() => mover('anterior')} disabled={visible[0] <= datos[0]}>
            Anterior
          </button>
          <button type="button" className="btn btn-ghost btn-chico" onClick={() => mover('acercar')} disabled={dias <= 1}>
            Acercar
          </button>
          <button type="button" className="btn btn-ghost btn-chico" onClick={() => mover('alejar')} disabled={todo}>
            Alejar
          </button>
          <button type="button" className="btn btn-ghost btn-chico" onClick={() => mover('siguiente')} disabled={visible[1] >= datos[1]}>
            Siguiente
          </button>
          <button type="button" className="btn btn-secondary btn-chico" onClick={() => fijarRango(null)} disabled={todo}>
            Restablecer
          </button>
        </div>
      </div>
    </form>
  )
}

const POR_PAGINA = 20

/** Los análisis que cumplen todos los filtros, con enlace al seguimiento de su árbol o zona. */
function ListaSeleccion({ analisis, nombres }: { analisis: Analisis[]; nombres: Map<string, string> }) {
  const [mostrar, setMostrar] = useState(POR_PAGINA)
  const visibles = analisis.slice(0, mostrar)
  return (
    <section className="panel" aria-labelledby="titulo-seleccion">
      <h2 id="titulo-seleccion">Análisis de la selección</h2>
      <p className="muted bloque-nota">{plural(analisis.length, 'análisis cumple', 'análisis cumplen')} los filtros, del más reciente al más antiguo.</p>
      {analisis.length === 0 ? (
        <p className="grafica-vacia">Ningún análisis coincide con los filtros.</p>
      ) : (
        <>
          <div className="tabla-desplazable panel-tabla">
            <table className="tabla" aria-labelledby="titulo-seleccion">
              <thead>
                <tr>
                  <th scope="col">Captura</th>
                  <th scope="col">Árbol o zona</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Resultado</th>
                  <th scope="col" className="num">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((a) => {
                  const l = lugarDe(a)
                  return (
                    <tr key={a.id}>
                      <td className="nowrap">{formatFecha(a.fechaCaptura)}</td>
                      <td>
                        {l ? (
                          <a href={hrefDe(l.tipo, l.id)}>{nombres.get(claveLugar(l)) ?? l.id}</a>
                        ) : (
                          <span className="muted">Sin asignar</span>
                        )}
                      </td>
                      <td>{ETIQUETA_TIPO[a.tipoImagen]}</td>
                      <td>
                        <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado>
                      </td>
                      <td className="num">{formatPorcentaje(a.confianza)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {analisis.length > mostrar && (
            <button type="button" className="btn btn-ghost btn-chico mostrar-mas" onClick={() => setMostrar((n) => n + POR_PAGINA)}>
              Mostrar {Math.min(POR_PAGINA, analisis.length - mostrar)} más
            </button>
          )}
        </>
      )}
    </section>
  )
}
