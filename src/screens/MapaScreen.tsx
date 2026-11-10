import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { Cargando, ErrorCarga } from '../components/EstadoCarga'
import FotoEvidencia from '../components/FotoEvidencia'
import { Estado, Forma, TONO_RESULTADO, type Tono } from '../components/Simbolo'
import { buscarAnalisis, getArboles, getZonas, type Analisis, type Arbol, type UltimoAnalisis, type Zona } from '../lib/api'
import { ETIQUETA_RESULTADO, ETIQUETA_TIPO, formatFecha, formatPorcentaje } from '../lib/format'
import { escalaGrafica, proyectar } from '../lib/geo'
import { useCarga } from '../lib/useCarga'

const LIENZO = { ancho: 1000, alto: 620, margen: 60 }

interface Punto {
  clave: string
  tipo: 'arbol' | 'zona'
  nombre: string
  detalle: string
  /** Nombre accesible en el plano: "Oyamel del lago (Abies religiosa): Infestado". */
  etiqueta: string
  lat: number | null
  lon: number | null
  radioMetros: number | null
  ultimo: UltimoAnalisis | null
  arbol?: Arbol
  zona?: Zona
}

function tonoDe(p: Punto): Tono {
  return p.ultimo ? TONO_RESULTADO[p.ultimo.resultado] : 'vacio'
}

function estadoDe(p: Punto): string {
  return p.ultimo ? ETIQUETA_RESULTADO[p.ultimo.resultado] : 'Sin análisis'
}

/** El backend ya trae el último análisis de cada árbol y zona: el historial se pide al elegir un punto. */
function armarPuntos(arboles: Arbol[], zonas: Zona[]): Punto[] {
  const deArboles = arboles.map<Punto>((a) => {
    const p: Punto = {
      clave: `a-${a.id}`, tipo: 'arbol', nombre: a.nombreEspecifico, detalle: a.especie, etiqueta: '',
      lat: a.latitud, lon: a.longitud, radioMetros: null, ultimo: a.ultimoAnalisis, arbol: a,
    }
    p.etiqueta = `${a.nombreEspecifico} (${a.especie}): ${estadoDe(p)}`
    return p
  })
  const deZonas = zonas.map<Punto>((z) => {
    const radio = z.radioMetros ? `radio ${z.radioMetros} m` : 'sin radio'
    const p: Punto = {
      clave: `z-${z.id}`, tipo: 'zona', nombre: z.nombreZona, detalle: `Zona de follaje, ${radio}`, etiqueta: '',
      lat: z.latitudCentro, lon: z.longitudCentro, radioMetros: z.radioMetros, ultimo: z.ultimoAnalisis, zona: z,
    }
    p.etiqueta = `${z.nombreZona}, ${radio}: ${estadoDe(p)}`
    return p
  })
  // Zonas primero en el SVG: sus círculos quedan debajo de los árboles.
  return [...deZonas, ...deArboles]
}

export default function MapaScreen() {
  // Consultas independientes: en paralelo, no en cascada.
  const carga = useCarga((signal) => Promise.all([getArboles(signal), getZonas(signal)]), [])
  const [seleccion, setSeleccion] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Mapa · Sheets TT'
  }, [])

  const puntos = useMemo(() => (carga.datos ? armarPuntos(...carga.datos) : []), [carga.datos])
  const elegido = puntos.find((p) => p.clave === seleccion) ?? null

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1>Mapa</h1>
        <p className="muted">Árboles y zonas de follaje registrados, con el resultado de su análisis más reciente.</p>
      </header>

      {carga.estado === 'cargando' && <Cargando texto="Cargando el mapa…" />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />}

      {carga.datos && (
        <div className="mapa">
          <Plano puntos={puntos} seleccion={seleccion} onElegir={setSeleccion} />
          <aside className="mapa-panel">
            {elegido ? (
              <Detalle punto={elegido} onCerrar={() => setSeleccion(null)} />
            ) : (
              <ListaPuntos puntos={puntos} onElegir={setSeleccion} />
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function Plano({ puntos, seleccion, onElegir }: { puntos: Punto[]; seleccion: string | null; onElegir: (c: string) => void }) {
  const ubicados = useMemo(
    () => puntos.filter((p): p is Punto & { lat: number; lon: number } => p.lat !== null && p.lon !== null),
    [puntos],
  )
  const proy = useMemo(
    () => proyectar(ubicados.map((p) => ({ lat: p.lat, lon: p.lon, radioMetros: p.radioMetros })), LIENZO),
    [ubicados],
  )
  const escala = escalaGrafica(proy.metros(1), LIENZO.ancho - 2 * LIENZO.margen)
  const arboles = ubicados.filter((p) => p.tipo === 'arbol').length

  function teclado(e: KeyboardEvent, clave: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onElegir(clave)
    }
  }

  return (
    <figure className="plano">
      <svg
        viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
        role="group"
        aria-label={`Plano de campo: ${arboles} ${arboles === 1 ? 'árbol' : 'árboles'} y ${ubicados.length - arboles} ${ubicados.length - arboles === 1 ? 'zona' : 'zonas'}`}
      >
        <rect className="plano-fondo" x="0.5" y="0.5" width={LIENZO.ancho - 1} height={LIENZO.alto - 1} rx="8" />

        {ubicados.map((p) => {
          const { x, y } = proy.punto(p)
          const tono = tonoDe(p)
          const activo = p.clave === seleccion
          return (
            <g
              key={p.clave}
              className={`punto punto-${p.tipo}${activo ? ' activo' : ''}`}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              aria-label={p.etiqueta}
              aria-pressed={activo}
              onClick={() => onElegir(p.clave)}
              onKeyDown={(e) => teclado(e, p.clave)}
            >
              <title>{p.etiqueta}</title>
              {/* El radio va a escala real; lo demás es símbolo y crece en pantallas angostas (CSS). */}
              {p.tipo === 'zona' && p.radioMetros ? (
                <circle className={`zona zona-${tono}`} r={proy.metros(p.radioMetros)} />
              ) : null}
              <g className="punto-cuerpo">
                {p.tipo === 'zona' && !p.radioMetros && (
                  <circle className={`zona zona-${tono} zona-sin-radio`} r={16} />
                )}
                {/* Área de toque mayor que la marca (≥ 24px). */}
                <circle className="punto-toque" r={16} />
                <g className="punto-marca">
                  <Forma tono={tono} r={p.tipo === 'arbol' ? 7 : 6} />
                </g>
                {/* En la mitad derecha el nombre va a la izquierda para no salirse del plano. */}
                <text
                  className="punto-nombre"
                  x={x > LIENZO.ancho / 2 ? -12 : 12}
                  y={4}
                  textAnchor={x > LIENZO.ancho / 2 ? 'end' : 'start'}
                >
                  {p.nombre}
                </text>
              </g>
            </g>
          )
        })}

        {/* Barra de escala y norte: el plano está a escala real. */}
        <g className="plano-escala" transform={`translate(${LIENZO.margen} ${LIENZO.alto - 28})`} aria-hidden="true">
          <line x1="0" x2={escala.ancho} y1="0" y2="0" />
          <line x1="0" x2="0" y1="-5" y2="5" />
          <line x1={escala.ancho} x2={escala.ancho} y1="-5" y2="5" />
          <text x={escala.ancho / 2} y="-9">{escala.metros} m</text>
        </g>
        <g className="plano-norte" transform={`translate(${LIENZO.ancho - 40} 46)`} aria-hidden="true">
          <path d="M0 -18 L7 6 L0 1 L-7 6 Z" />
          <text y="22">N</text>
        </g>
      </svg>
      <figcaption>
        <ul className="leyenda leyenda-plano">
          <li><Leyenda tono="bien" />Sano</li>
          <li><Leyenda tono="alerta" />Infestado</li>
          <li><Leyenda tono="neutro" />No determinado</li>
          <li><Leyenda tono="vacio" />Sin análisis</li>
          <li><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle className="zona zona-vacio" r="6" /></svg>Zona de follaje, radio a escala</li>
        </ul>
      </figcaption>
    </figure>
  )
}

function Leyenda({ tono }: { tono: Tono }) {
  return (
    <svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true">
      <Forma tono={tono} r={5} />
    </svg>
  )
}

function ListaPuntos({ puntos, onElegir }: { puntos: Punto[]; onElegir: (c: string) => void }) {
  const ordenados = [...puntos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return (
    <>
      <h2 id="titulo-puntos">Puntos registrados</h2>
      <ul className="lista-puntos" aria-labelledby="titulo-puntos">
        {ordenados.map((p) => (
          <li key={p.clave}>
            <button type="button" onClick={() => onElegir(p.clave)}>
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
    </>
  )
}

function Detalle({ punto, onCerrar }: { punto: Punto; onCerrar: () => void }) {
  const descripcion = punto.arbol?.descripcion ?? punto.zona?.descripcion
  const registro = punto.arbol?.fechaRegistro ?? punto.zona?.fechaRegistro ?? null
  return (
    <section aria-labelledby="titulo-detalle" className="detalle">
      <h2 id="titulo-detalle">{punto.nombre}</h2>
      <p className="muted">{punto.detalle}</p>
      {descripcion && <p className="detalle-descripcion">{descripcion}</p>}
      <p className="muted detalle-registro">Registrado el {formatFecha(registro)}</p>

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

function Historial({ punto }: { punto: Punto }) {
  const filtro = punto.arbol ? { arbol: punto.arbol.id } : { zona: punto.zona!.id }
  const historial = useCarga(
    (signal) => buscarAnalisis({ ...filtro, limite: LIMITE_HISTORIAL }, signal),
    [punto.clave],
  )
  const [foto, setFoto] = useState<Analisis | null>(null)

  if (historial.estado === 'cargando') return <Cargando texto="Cargando el historial…" lineas={2} />
  if (historial.estado === 'error') return <ErrorCarga mensaje={historial.error} onReintentar={historial.reintentar} />
  return (
    <>
      <ul className="historial">
        {historial.datos.map((a) => (
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
                className="enlace"
                aria-label={`Ver foto del ${formatFecha(a.fechaCaptura)}`}
                onClick={() => setFoto(a)}
              >
                Ver foto
              </button>
            )}
          </li>
        ))}
      </ul>
      {historial.datos.length === LIMITE_HISTORIAL && (
        <p className="muted conteo">Se muestran los {LIMITE_HISTORIAL} más recientes; el resto está en Análisis.</p>
      )}
      {foto && <FotoEvidencia analisis={foto} onCerrar={() => setFoto(null)} />}
    </>
  )
}
