import { lazy, Suspense, useEffect } from 'react'
import BarraSegmentada from '../components/BarraSegmentada'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoResumen } from '../components/Esqueleto'
import Galeria from '../components/Galeria'
import Simbolo, { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../components/Simbolo'
import { buscarAnalisis, getArboles, getEstadisticas, getZonas, type Analisis, type Arbol, type Estadisticas, type Zona } from '../lib/api'
import { claveLugar, lugarDe } from '../lib/analisis'
import { ETIQUETA_RESULTADO, ETIQUETA_SINCRONIZACION, ETIQUETA_TIPO, formatFecha, formatPorcentaje, haceCuanto } from '../lib/format'
import { accesos, atencion, cambio, hrefDetalle, indicadoresPeriodo, lugaresInfestados, recientes, type Medida, type PuntoAtencion } from '../lib/resumen'
import { hrefDe } from '../lib/router'
import { useCarga, type Carga } from '../lib/useCarga'

// Las gráficas (d3) en su propio chunk: los indicadores y la atención no esperan a que llegue.
const GraficasResumen = lazy(() => import('../components/resumen/GraficasResumen'))

/** Para las gráficas: los 500 más recientes (el máximo de GET /analisis), como en Gráficos. */
const LIMITE_GRAFICAS = 500

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "1 árbol y 1 zona con infestación detectada" / "Sin infestación detectada". */
export function fraseInfestacion(arboles: number, zonas: number): string {
  const partes = [
    arboles > 0 ? plural(arboles, 'árbol', 'árboles') : null,
    zonas > 0 ? plural(zonas, 'zona', 'zonas') : null,
  ].filter(Boolean)
  return partes.length ? `${partes.join(' y ')} con infestación detectada` : 'Sin infestación detectada'
}

interface Props {
  /** Administración solo aparece en los accesos de un administrador. */
  esAdmin?: boolean
}

type Lugares = { arboles: Arbol[]; zonas: Zona[] }
type CargaDe<T> = Carga<T> & { recargando: boolean; reintentar: () => void }

/**
 * El dashboard: el estado del bosque (hero, se conserva), lo que necesita atención, indicadores
 * de los últimos 7 días, las gráficas clave, accesos y actividad reciente, y al final el detalle
 * de siempre. Cada fuente carga por su lado: si una falla, las demás siguen.
 */
export default function ResumenScreen({ esAdmin = false }: Props) {
  const carga = useCarga((signal) => getEstadisticas(signal), [])
  const analisis = useCarga((signal) => buscarAnalisis({ limite: LIMITE_GRAFICAS }, signal), [])
  const lugares = useCarga<Lugares>(async (signal) => {
    const [arboles, zonas] = await Promise.all([getArboles(signal), getZonas(signal)])
    return { arboles, zonas }
  }, [])

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

      {carga.estado === 'cargando' && <EsqueletoResumen />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos && <Hero e={carga.datos} />}

      {/* Una sola coreografía: cada sección entra con "entrar" (la de las páginas), escalonada por
          su lugar (ver .resumen-secciones en styles.css). */}
      <div className="resumen-secciones">
        <SeccionAtencion analisis={analisis} lugares={lugares} errores={carga.datos?.analisisPorSincronizacion.error ?? null} />
        <SeccionIndicadores analisis={analisis} />
        {analisis.datos && analisis.datos.length > 0 && lugares.estado !== 'cargando' && (
          <section aria-labelledby="titulo-graficas" className="resumen-bloque">
            <h2 id="titulo-graficas" className="resumen-titulo">Gráficas clave</h2>
            <Suspense fallback={<EsqueletoBloque />}>
              <GraficasResumen analisis={analisis.datos} arboles={lugares.datos?.arboles ?? []} zonas={lugares.datos?.zonas ?? []} />
            </Suspense>
          </section>
        )}
        <SeccionAccesos analisis={analisis} lugares={lugares} esAdmin={esAdmin} errores={carga.datos?.analisisPorSincronizacion.error ?? null} />
        <SeccionActividad analisis={analisis} lugares={lugares} />
        {carga.datos && <Detalle e={carga.datos} />}
      </div>
    </div>
  )
}

/** El hero de siempre: cómo está el bosque, con los totales. */
function Hero({ e }: { e: Estadisticas }) {
  const t = e.totales
  const hayFocos = t.arbolesConInfestacion + t.zonasConInfestacion > 0

  return (
    <>
      <section className={`hero${hayFocos ? ' hero-alerta' : ''}`} aria-label="Estado del bosque">
        <Galeria className="hero-galeria" ramas={12} semilla={11} />
        <p className="foco">
          <Simbolo tono={hayFocos ? 'alerta' : 'bien'} />
          <span>{fraseInfestacion(t.arbolesConInfestacion, t.zonasConInfestacion)}</span>
        </p>
        {hayFocos && (
          <a className="btn btn-oro foco-enlace" href={hrefDe('mapa')}>
            Ver en el mapa
          </a>
        )}
        <ul className="totales" aria-label="Totales">
          <li><span>Árboles</span><strong>{t.arboles}</strong></li>
          <li><span>Zonas de follaje</span><strong>{t.zonas}</strong></li>
          <li><span>Análisis</span><strong>{t.analisis}</strong></li>
          <li><span>Dispositivos</span><strong>{t.dispositivos}</strong></li>
        </ul>
      </section>
    </>
  )
}

/** El detalle que el Resumen ya mostraba: resultados, cromático y sincronización. */
function Detalle({ e }: { e: Estadisticas }) {
  return (
    <section aria-labelledby="titulo-detalle" className="resumen-bloque">
      <h2 id="titulo-detalle" className="resumen-titulo">Todos los análisis</h2>
      <div className="rejilla-resumen">
        <section className="panel" aria-labelledby="titulo-resultados">
          <h3 id="titulo-resultados" className="panel-h3">Resultado de los análisis</h3>
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

        <section className="panel" aria-labelledby="titulo-cromatico">
          <h3 id="titulo-cromatico" className="panel-h3">Cromático promedio del follaje</h3>
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

        <section className="panel" aria-labelledby="titulo-sincronizacion">
          <h3 id="titulo-sincronizacion" className="panel-h3">Sincronización desde el móvil</h3>
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
    </section>
  )
}

/** Esqueleto decorativo de un bloque (sin role="status": el aviso de carga es uno solo, el del resumen). */
function EsqueletoBloque() {
  return (
    <div className="panel esqueleto-bloque" aria-hidden="true">
      <span className="hueso hueso-linea" />
      <span className="hueso hueso-barra" />
      <span className="hueso hueso-linea hueso-tenue" />
    </div>
  )
}

const plural2 = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** 1. Lo primero: qué necesita atención, con enlaces a Análisis ya filtrado y al seguimiento. */
function SeccionAtencion({ analisis, lugares, errores }: { analisis: CargaDe<Analisis[]>; lugares: CargaDe<Lugares>; errores: number | null }) {
  const datos = analisis.datos
  const a = datos ? atencion(datos, errores) : null
  const infestados = lugares.datos ? lugaresInfestados(lugares.datos.arboles, lugares.datos.zonas) : []
  return (
    <section className="panel resumen-atencion" aria-labelledby="titulo-atencion">
      <div className="panel-titulo">
        <h2 id="titulo-atencion">Necesita tu atención</h2>
        {a && a.total > 0 && (
          <a className="btn btn-primary btn-chico" href={a.hrefTodos}>
            {a.total === 1 ? 'Ver el análisis en Análisis' : `Ver los ${a.total} en Análisis`}
          </a>
        )}
      </div>
      {analisis.estado === 'cargando' && <EsqueletoBloque />}
      {analisis.estado === 'error' && <ErrorCarga mensaje={analisis.error} onReintentar={analisis.reintentar} />}
      {a && (
        <>
          <p className="muted bloque-nota">
            {a.total
              ? `${plural2(a.total, 'análisis requiere', 'análisis requieren')} atención, de los ${a.base} más recientes.`
              : `Nada urgente: ninguno de los ${a.base} análisis más recientes requiere atención.`}
          </p>
          <ul className="atencion-puntos">
            {a.puntos.map((p) => (
              <li key={p.clave}>
                {p.href ? (
                  <a
                    className={`atencion-punto${p.n ? '' : ' atencion-cero'}`}
                    href={p.href}
                    aria-label={`${p.titulo}: ${p.n}. ${p.descripcion}. Ver en Análisis`}
                  >
                    <ContenidoPunto p={p} />
                  </a>
                ) : (
                  <div className={`atencion-punto atencion-sin-enlace${p.n ? '' : ' atencion-cero'}`}>
                    <ContenidoPunto p={p} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3 className="resumen-subtitulo">Siguen con infestación en su último análisis</h3>
      <p className="muted bloque-nota nota-definicion">
        Arriba se cuentan los árboles y zonas con al menos un análisis infestado; aquí, solo los que siguen así en su análisis más reciente.
      </p>
      {lugares.estado === 'cargando' && <EsqueletoBloque />}
      {lugares.estado === 'error' && <ErrorCarga mensaje={lugares.error} onReintentar={lugares.reintentar} />}
      {lugares.datos &&
        (infestados.length ? (
          <ul className="lugares-infestados">
            {infestados.map((l) => (
              <li key={claveLugar(l.lugar)}>
                <a href={l.href}>
                  <Simbolo tono="alerta" />
                  <span className="lugar-nombre">{l.nombre}</span>
                </a>
                <span className="muted">
                  {l.detalle} · {haceCuanto(l.fecha)} ({formatFecha(l.fecha)})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Ningún árbol ni zona tiene infestación en su último análisis.</p>
        ))}
    </section>
  )
}

function ContenidoPunto({ p }: { p: PuntoAtencion }) {
  return (
    <>
      <span className="atencion-encabezado">
        <Simbolo tono={p.tono} />
        {p.titulo}
      </span>
      <strong className="atencion-cifra">{p.n}</strong>
      <span className="atencion-descripcion">{p.descripcion}</span>
    </>
  )
}

const SIN_COMPARAR = {
  actual: 'sin comparar (periodo actual incompleto)',
  previo: 'sin comparar (periodo anterior incompleto)',
}

function Cambio({ m, tipo, incompleto }: { m: Medida; tipo: 'cuenta' | 'fraccion'; incompleto: 'actual' | 'previo' | null }) {
  const texto = cambio(m, tipo)
  return <span className="indicador-cambio">{texto ?? (incompleto ? SIN_COMPARAR[incompleto] : 'sin análisis en los 7 días previos para comparar')}</span>
}

/** 2. Indicadores de los últimos 7 días con datos, contra los 7 anteriores. */
function SeccionIndicadores({ analisis }: { analisis: CargaDe<Analisis[]> }) {
  const ind = analisis.datos ? indicadoresPeriodo(analisis.datos, LIMITE_GRAFICAS) : null
  if (analisis.estado === 'cargando') return <EsqueletoBloque />
  if (!ind) return null
  const rango = `del ${formatFecha(`${ind.desde}T12:00:00-06:00`).split(',')[0]} al ${formatFecha(`${ind.hasta}T12:00:00-06:00`).split(',')[0]}`
  return (
    <section aria-labelledby="titulo-indicadores" className="resumen-bloque">
      <h2 id="titulo-indicadores" className="resumen-titulo">Últimos 7 días con datos</h2>
      <p className="muted bloque-nota">
        {ind.incompleto === 'actual'
          ? `Capturas ${rango}. Solo se cargan los ${LIMITE_GRAFICAS} análisis más recientes: este periodo puede estar incompleto y no se compara.`
          : ind.incompleto === 'previo'
            ? `Capturas ${rango}. Solo se cargan los ${LIMITE_GRAFICAS} análisis más recientes: los 7 días anteriores pueden estar incompletos y no se comparan.`
            : `Capturas ${rango}, comparadas con los 7 días anteriores.`}
      </p>
      <ul className="indicadores indicadores-resumen" aria-label="Indicadores de los últimos 7 días">
        <li>
          <span>Análisis</span>
          {/* Con el periodo actual recortado por el límite, la cifra es un mínimo. */}
          <strong>{ind.incompleto === 'actual' ? `${ind.analisis.valor} o más` : ind.analisis.valor}</strong>
          <Cambio m={ind.analisis} tipo="cuenta" incompleto={ind.incompleto} />
        </li>
        <li>
          <span>Infestados</span>
          <strong>{formatPorcentaje(ind.pctInfestado.valor)}</strong>
          <Cambio m={ind.pctInfestado} tipo="fraccion" incompleto={ind.incompleto} />
        </li>
        <li>
          <span>Confianza media</span>
          <strong>{formatPorcentaje(ind.confianzaMedia.valor)}</strong>
          <Cambio m={ind.confianzaMedia} tipo="fraccion" incompleto={ind.incompleto} />
        </li>
        <li>
          <span>Árboles y zonas con análisis</span>
          <strong>{ind.lugares.valor}</strong>
          <Cambio m={ind.lugares} tipo="cuenta" incompleto={ind.incompleto} />
        </li>
        <li>
          <span>Última captura</span>
          <strong className="indicador-fecha">{ind.ultimaCaptura ? haceCuanto(ind.ultimaCaptura) : '—'}</strong>
          <span className="indicador-cambio">{ind.ultimaCaptura ? formatFecha(ind.ultimaCaptura) : ''}</span>
        </li>
        <li>
          <span>Última sincronización</span>
          <strong className="indicador-fecha">{ind.ultimaSincronizacion ? haceCuanto(ind.ultimaSincronizacion) : '—'}</strong>
          <span className="indicador-cambio">{ind.ultimaSincronizacion ? formatFecha(ind.ultimaSincronizacion) : 'Ninguna aún'}</span>
        </li>
      </ul>
    </section>
  )
}

const ICONO_ACCESO = {
  mapa: 'M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  analisis: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
  graficos: 'M4 4v16h16M8 16v-4M12 16V8M16 16v-7M20 16v-2',
  seguimiento: 'M4 12h4l3-7 4 14 3-7h2',
  admin: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 3 3 6',
}

/** 4. Accesos rápidos en orden de prioridad (Administración, solo administradores). */
function SeccionAccesos({
  analisis,
  lugares,
  esAdmin,
  errores,
}: {
  analisis: CargaDe<Analisis[]>
  lugares: CargaDe<Lugares>
  esAdmin: boolean
  errores: number | null
}) {
  const infestados = lugares.datos ? lugaresInfestados(lugares.datos.arboles, lugares.datos.zonas) : []
  const lista = accesos({
    arboles: lugares.datos?.arboles.length ?? null,
    zonas: lugares.datos?.zonas.length ?? null,
    analisis: analisis.datos?.length ?? null,
    atencion: analisis.datos ? atencion(analisis.datos, errores).total : null,
    ultimoInfestado: infestados[0] ?? null,
    esAdmin,
  })
  return (
    <nav aria-labelledby="titulo-accesos" className="resumen-bloque">
      <h2 id="titulo-accesos" className="resumen-titulo">Ir a</h2>
      <ul className="atajos">
        {lista.map((a) => (
          <li key={a.ruta}>
            <a className="atajo" href={a.href}>
              <svg className="icono" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <path d={ICONO_ACCESO[a.ruta]} />
              </svg>
              <span className="atajo-texto">
                <strong>{a.titulo}</strong>
                <span>{a.descripcion}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** 5. Los análisis más recientes, con enlace a su detalle en Análisis. */
function SeccionActividad({ analisis, lugares }: { analisis: CargaDe<Analisis[]>; lugares: CargaDe<Lugares> }) {
  if (!analisis.datos?.length) return null
  const nombres = new Map<string, string>([
    ...(lugares.datos?.arboles ?? []).map((a) => [`arbol:${a.id}`, a.nombreEspecifico] as const),
    ...(lugares.datos?.zonas ?? []).map((z) => [`zona:${z.id}`, z.nombreZona] as const),
  ])
  return (
    <section className="panel" aria-labelledby="titulo-actividad">
      <div className="panel-titulo">
        <h2 id="titulo-actividad">Actividad reciente</h2>
        <a className="btn btn-ghost btn-chico" href="#/analisis">
          Ver todos los análisis
        </a>
      </div>
      <ol className="actividad">
        {recientes(analisis.datos).map((x) => {
          const l = lugarDe(x)
          const nombre = l ? (nombres.get(claveLugar(l)) ?? (l.tipo === 'arbol' ? 'Árbol' : 'Zona')) : null
          return (
            <li key={x.id}>
              <Estado tono={TONO_RESULTADO[x.resultadoClasificacion]}>{ETIQUETA_RESULTADO[x.resultadoClasificacion]}</Estado>
              <span className="actividad-lugar">
                {l ? <a href={hrefDe(l.tipo, l.id)}>{nombre}</a> : <span className="muted">Sin árbol ni zona</span>}
                <span className="muted"> · {ETIQUETA_TIPO[x.tipoImagen]}</span>
              </span>
              <time className="muted actividad-cuando" dateTime={x.fechaCaptura}>
                {haceCuanto(x.fechaCaptura)} · {formatFecha(x.fechaCaptura)}
              </time>
              <a className="actividad-detalle" href={hrefDetalle(x)} aria-label={`Ver detalle del análisis del ${formatFecha(x.fechaCaptura)}`}>
                Detalle
              </a>
            </li>
          )
        })}
      </ol>
    </section>
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
