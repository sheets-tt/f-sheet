import { useEffect, useMemo, useRef, useState } from 'react'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoLista, EsqueletoMapa } from '../components/Esqueleto'
import FotoEvidencia, { IconoFoto } from '../components/FotoEvidencia'
import MapaCampo, { type ControlMapa, type MarcaMapa, type ZonaMapa } from '../components/MapaCampo'
import Simbolo, { Estado, TONO_RESULTADO, type Tono } from '../components/Simbolo'
import { buscarAnalisis, getArboles, getZonas, type Analisis, type Arbol, type UltimoAnalisis, type Zona } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha, formatPorcentaje, haceCuanto } from '../lib/format'
import { formatCoordenadas, limitesDe, type Limites } from '../lib/geo'
import { hrefDe, navigate, useRutaId } from '../lib/router'
import { useCarga } from '../lib/useCarga'

export interface Punto {
  clave: string
  tipo: 'arbol' | 'zona'
  id: string
  nombre: string
  detalle: string
  /** Nombre accesible en el mapa: "Oyamel del lago (Abies religiosa): Infestado". */
  etiqueta: string
  lat: number | null
  lon: number | null
  radioMetros: number | null
  ultimo: UltimoAnalisis | null
  descripcion: string | null
  fechaRegistro: string | null
}

export function tonoDe(p: { ultimo: UltimoAnalisis | null }): Tono {
  return p.ultimo ? TONO_RESULTADO[p.ultimo.resultado] : 'vacio'
}

export function estadoDe(p: { ultimo: UltimoAnalisis | null }): string {
  return p.ultimo ? ETIQUETA_RESULTADO[p.ultimo.resultado] : 'Sin análisis'
}

export function puntoDeArbol(a: Arbol): Punto {
  return {
    clave: `a-${a.id}`, tipo: 'arbol', id: a.id, nombre: a.nombreEspecifico, detalle: a.especie,
    etiqueta: `${a.nombreEspecifico} (${a.especie}): ${estadoDe({ ultimo: a.ultimoAnalisis })}`,
    lat: a.latitud, lon: a.longitud, radioMetros: null, ultimo: a.ultimoAnalisis,
    descripcion: a.descripcion, fechaRegistro: a.fechaRegistro,
  }
}

export function puntoDeZona(z: Zona): Punto {
  const radio = z.radioMetros ? `radio ${z.radioMetros} m` : 'sin radio'
  return {
    clave: `z-${z.id}`, tipo: 'zona', id: z.id, nombre: z.nombreZona, detalle: `Zona de follaje, ${radio}`,
    etiqueta: `${z.nombreZona}, ${radio}: ${estadoDe({ ultimo: z.ultimoAnalisis })}`,
    lat: z.latitudCentro, lon: z.longitudCentro, radioMetros: z.radioMetros, ultimo: z.ultimoAnalisis,
    descripcion: z.descripcion, fechaRegistro: z.fechaRegistro,
  }
}

type Ubicado = Punto & { lat: number; lon: number }
const ubicado = (p: Punto): p is Ubicado => p.lat !== null && p.lon !== null

export function marcaDe(p: Ubicado): MarcaMapa {
  return { clave: p.clave, tipo: p.tipo, lngLat: [p.lon, p.lat], tono: tonoDe(p), nombre: p.nombre, etiqueta: p.etiqueta }
}

export function zonaDe(p: Ubicado): ZonaMapa | null {
  return p.tipo === 'zona' && p.radioMetros ? { clave: p.clave, centro: [p.lon, p.lat], radioMetros: p.radioMetros, tono: tonoDe(p) } : null
}

/** Centro de CDMX: solo si no hay ningún punto con coordenadas. */
const SIN_PUNTOS: Limites = [[-99.19, 19.415], [-99.175, 19.425]]

const ESTADOS: { tono: Tono; etiqueta: string }[] = [
  { tono: 'alerta', etiqueta: 'Infestado' },
  { tono: 'neutro', etiqueta: 'No determinado' },
  { tono: 'bien', etiqueta: 'Sano' },
  { tono: 'vacio', etiqueta: 'Sin análisis' },
]

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export default function MapaScreen() {
  // Consultas independientes: en paralelo, no en cascada.
  const carga = useCarga((signal) => Promise.all([getArboles(signal), getZonas(signal)]), [])
  // El punto elegido vive en la URL (#/mapa/a-<id>): se puede recargar, compartir y volver a él.
  const seleccion = useRutaId()

  useEffect(() => {
    document.title = 'Mapa · Sheets TT'
  }, [])

  const puntos = useMemo(
    () => (carga.datos ? [...carga.datos[1].map(puntoDeZona), ...carga.datos[0].map(puntoDeArbol)] : []),
    [carga.datos],
  )

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1>Mapa</h1>
        <p className="muted">
          Elige un árbol o una zona para ver su último análisis y abrir su seguimiento completo.
        </p>
      </header>

      {carga.estado === 'cargando' && <EsqueletoMapa />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />}
      {carga.datos && <Explorador puntos={puntos} seleccion={seleccion} />}
    </div>
  )
}

function Explorador({ puntos, seleccion }: { puntos: Punto[]; seleccion: string | null }) {
  const [ocultos, setOcultos] = useState<Set<string>>(() => new Set())
  const [busqueda, setBusqueda] = useState('')
  const [nombres, setNombres] = useState(true)
  const [resaltada, setResaltada] = useState<string | null>(null)
  const mapa = useRef<ControlMapa>(null)

  // Elegir (en el mapa, la lista o la búsqueda) lleva el foco al detalle; abrir desde la URL no.
  const pedirFoco = useRef(false)
  const elegir = (clave: string) => {
    pedirFoco.current = true
    navigate('mapa', { id: clave, replace: true })
  }
  const tomarFoco = () => {
    const pedido = pedirFoco.current
    pedirFoco.current = false
    return pedido
  }
  const cerrar = () => navigate('mapa', { replace: true })

  // Esc cierra el detalle y vuelve a la lista.
  useEffect(() => {
    if (!seleccion) return
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) navigate('mapa', { replace: true })
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [seleccion])

  const conteo = useMemo(() => {
    const c: Record<string, number> = { arbol: 0, zona: 0, bien: 0, alerta: 0, neutro: 0, vacio: 0 }
    for (const p of puntos) {
      c[p.tipo]++
      c[tonoDe(p)]++
    }
    return c
  }, [puntos])

  const q = normalizar(busqueda)
  const visibles = useMemo(
    () =>
      puntos.filter(
        (p) =>
          !ocultos.has(p.tipo) &&
          !ocultos.has(tonoDe(p)) &&
          (!q || normalizar(`${p.nombre} ${p.detalle}`).includes(q)),
      ),
    [puntos, ocultos, q],
  )

  const ubicados = useMemo(() => puntos.filter(ubicado), [puntos])
  const encuadre = useMemo(
    () => limitesDe(ubicados.map((p) => ({ lon: p.lon, lat: p.lat, radioMetros: p.radioMetros }))) ?? SIN_PUNTOS,
    [ubicados],
  )
  // El punto elegido se ve aunque los filtros lo oculten.
  const enMapa = useMemo(
    () => ubicados.filter((p) => p.clave === seleccion || visibles.includes(p)),
    [ubicados, visibles, seleccion],
  )
  const marcas = useMemo(() => enMapa.map(marcaDe), [enMapa])
  const zonas = useMemo(() => enMapa.map(zonaDe).filter((z): z is ZonaMapa => z !== null), [enMapa])

  const elegido = puntos.find((p) => p.clave === seleccion) ?? null
  const arboles = ubicados.filter((p) => p.tipo === 'arbol').length
  const nZonas = ubicados.length - arboles

  function alternar(clave: string) {
    setOcultos((prev) => {
      const sig = new Set(prev)
      if (sig.has(clave)) sig.delete(clave)
      else sig.add(clave)
      return sig
    })
  }

  return (
    <>
      <div className="mapa-herramientas" role="toolbar" aria-label="Filtros del mapa">
        <label className="mapa-busqueda">
          <span className="visually-hidden">Buscar árbol o zona</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5" />
          </svg>
          <input
            type="search"
            placeholder="Buscar árbol o zona"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && visibles[0]) elegir(visibles[0].clave)
            }}
          />
        </label>
        <div className="fichas" role="group" aria-label="Mostrar por estado">
          {ESTADOS.map((e) => (
            <button
              key={e.tono}
              type="button"
              className="ficha"
              aria-pressed={!ocultos.has(e.tono)}
              onClick={() => alternar(e.tono)}
            >
              <Simbolo tono={e.tono} />
              {e.etiqueta}
              <span className="ficha-cuenta">{conteo[e.tono]}</span>
            </button>
          ))}
        </div>
        <div className="fichas" role="group" aria-label="Mostrar por tipo">
          <button type="button" className="ficha" aria-pressed={!ocultos.has('arbol')} onClick={() => alternar('arbol')}>
            Árboles<span className="ficha-cuenta">{conteo.arbol}</span>
          </button>
          <button type="button" className="ficha" aria-pressed={!ocultos.has('zona')} onClick={() => alternar('zona')}>
            Zonas<span className="ficha-cuenta">{conteo.zona}</span>
          </button>
          <button type="button" className="ficha" aria-pressed={nombres} onClick={() => setNombres((n) => !n)}>
            Nombres
          </button>
        </div>
      </div>

      <div className="mapa">
        <div className="mapa-marco">
          <MapaCampo
            ref={mapa}
            nombre={`Mapa de campo: ${arboles} ${arboles === 1 ? 'árbol' : 'árboles'} y ${nZonas} ${nZonas === 1 ? 'zona' : 'zonas'}`}
            marcas={marcas}
            zonas={zonas}
            encuadre={encuadre}
            seleccion={seleccion}
            resaltada={resaltada}
            mostrarNombres={nombres}
            onElegir={elegir}
          />
          <button type="button" className="btn btn-chico mapa-ver-todo" onClick={() => mapa.current?.verTodo()}>
            Ver todos
          </button>
          <ul className="leyenda leyenda-mapa" aria-label="Simbología">
            {ESTADOS.map((e) => (
              <li key={e.tono}>
                <Simbolo tono={e.tono} />
                {e.etiqueta}
              </li>
            ))}
            <li>
              <span className="muestra-zona" aria-hidden="true" />
              Zona de follaje, radio a escala
            </li>
          </ul>
        </div>

        <aside className="mapa-panel panel">
          {elegido ? (
            <Detalle punto={elegido} onCerrar={cerrar} tomarFoco={tomarFoco} />
          ) : (
            <ListaPuntos
              puntos={visibles}
              total={puntos.length}
              onElegir={elegir}
              onResaltar={setResaltada}
            />
          )}
        </aside>
      </div>
    </>
  )
}

function ListaPuntos({
  puntos,
  total,
  onElegir,
  onResaltar,
}: {
  puntos: Punto[]
  total: number
  onElegir: (c: string) => void
  onResaltar: (c: string | null) => void
}) {
  const ordenados = [...puntos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return (
    <>
      <h2 id="titulo-puntos">Puntos registrados</h2>
      <p className="muted conteo" aria-live="polite">
        {puntos.length === total ? `${total} en total` : `${puntos.length} de ${total} con estos filtros`}
      </p>
      {ordenados.length ? (
        <ul className="lista-puntos" aria-labelledby="titulo-puntos" onMouseLeave={() => onResaltar(null)}>
          {ordenados.map((p) => (
            <li key={p.clave}>
              <button
                type="button"
                onClick={() => onElegir(p.clave)}
                onMouseEnter={() => onResaltar(p.clave)}
                onFocus={() => onResaltar(p.clave)}
                onBlur={() => onResaltar(null)}
              >
                <span className="lista-nombre">{p.nombre}</span>
                <span className="muted lista-detalle">
                  {p.detalle}
                  {p.lat === null || p.lon === null ? ', sin coordenadas' : ''}
                </span>
                <Estado tono={tonoDe(p)}>{estadoDe(p)}</Estado>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Ningún punto coincide. Cambia la búsqueda o los filtros.</p>
      )}
    </>
  )
}

function Detalle({ punto, onCerrar, tomarFoco }: { punto: Punto; onCerrar: () => void; tomarFoco: () => boolean }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const seccion = useRef<HTMLElement>(null)
  // Al elegir un punto, el foco pasa al detalle (teclado y lectores de pantalla) y, en pantallas
  // angostas, donde el detalle queda debajo del mapa, se desplaza hasta él.
  useEffect(() => {
    if (!tomarFoco()) return
    titulo.current?.focus({ preventScroll: true })
    const suave = typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    seccion.current?.scrollIntoView?.({ block: 'nearest', behavior: suave ? 'smooth' : 'auto' })
  }, [punto.clave]) // eslint-disable-line react-hooks/exhaustive-deps -- solo al cambiar de punto

  return (
    <section ref={seccion} aria-labelledby="titulo-detalle" className="detalle" key={punto.clave}>
      <div className="detalle-cabeza">
        <h2 id="titulo-detalle" ref={titulo} tabIndex={-1}>
          {punto.nombre}
        </h2>
        <button type="button" className="btn-cerrar" aria-label="Cerrar detalle" onClick={onCerrar}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="muted">{punto.detalle}</p>
      <div className="detalle-estado">
        <Estado tono={tonoDe(punto)}>{estadoDe(punto)}</Estado>
        {punto.ultimo && <span className="muted">{haceCuanto(punto.ultimo.fechaCaptura)}</span>}
      </div>
      {punto.descripcion && <p className="detalle-descripcion">{punto.descripcion}</p>}
      <p className="muted detalle-registro">
        Registrado el {formatFecha(punto.fechaRegistro)}
        {punto.lat !== null && punto.lon !== null && (
          <>
            <br />
            {formatCoordenadas(punto.lat, punto.lon)}
          </>
        )}
      </p>

      <a className="btn btn-primary detalle-seguimiento" href={hrefDe(punto.tipo, punto.id)}>
        Ver seguimiento {punto.tipo === 'arbol' ? 'del árbol' : 'de la zona'}
      </a>

      <h3>Análisis</h3>
      {/* Sin último análisis no hay historial: no se pide nada. */}
      {punto.ultimo ? <Historial punto={punto} /> : <p className="muted">Todavía no tiene análisis.</p>}
      <button type="button" className="btn btn-ghost" onClick={onCerrar}>
        Ver todos los puntos
      </button>
    </section>
  )
}

const LIMITE_HISTORIAL = 50
const EN_PANEL = 5

function Historial({ punto }: { punto: Punto }) {
  const filtro = punto.tipo === 'arbol' ? { arbol: punto.id } : { zona: punto.id }
  const historial = useCarga(
    (signal) => buscarAnalisis({ ...filtro, limite: LIMITE_HISTORIAL }, signal),
    [punto.clave],
  )
  const [foto, setFoto] = useState<Analisis | null>(null)

  if (historial.estado === 'cargando') return <EsqueletoLista texto="Cargando el historial…" filas={2} />
  if (historial.estado === 'error') return <ErrorCarga mensaje={historial.error} onReintentar={historial.reintentar} />
  const recientes = historial.datos.slice(0, EN_PANEL)
  return (
    <>
      <ul className="historial">
        {recientes.map((a) => (
          <li key={a.id}>
            <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado>
            <span className="muted">
              {ETIQUETA_TIPO[a.tipoImagen]}, confianza {formatPorcentaje(a.confianza)}
            </span>
            <span className="historial-fecha">{formatFecha(a.fechaCaptura)}</span>
            {a.observaciones && <span className="historial-obs">{a.observaciones}</span>}
            {a.tieneEvidencia && (
              <button
                type="button"
                className="btn-foto"
                aria-label={`Ver foto del ${formatFecha(a.fechaCaptura)}`}
                onClick={() => setFoto(a)}
              >
                <IconoFoto />
                Ver foto
              </button>
            )}
          </li>
        ))}
      </ul>
      {historial.datos.length > EN_PANEL && (
        <p className="muted conteo">
          Se muestran los {EN_PANEL} más recientes de {historial.datos.length === LIMITE_HISTORIAL ? `más de ${LIMITE_HISTORIAL - 1}` : historial.datos.length};
          el resto está en el seguimiento.
        </p>
      )}
      {foto && <FotoEvidencia analisis={foto} onCerrar={() => setFoto(null)} />}
    </>
  )
}
