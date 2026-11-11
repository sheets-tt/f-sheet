import { useEffect, useMemo, useRef, useState } from 'react'
import BarraSegmentada from '../components/BarraSegmentada'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoSeguimiento } from '../components/Esqueleto'
import FotoEvidencia, { IconoFoto } from '../components/FotoEvidencia'
import GraficaConfianza from '../components/GraficaConfianza'
import MapaCampo, { type CapturaMapa, type ZonaMapa } from '../components/MapaCampo'
import { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../components/Simbolo'
import { buscarAnalisis, getArbol, getZona, type Analisis, type TipoImagen } from '../lib/api'
import {
  ETIQUETA_RESULTADO,
  ETIQUETA_SINCRONIZACION,
  ETIQUETA_TIPO,
  formatFecha,
  formatPorcentaje,
  haceCuanto,
} from '../lib/format'
import { distanciaMetros, formatCoordenadas, limitesDe } from '../lib/geo'
import { hrefDe } from '../lib/router'
import { useCarga } from '../lib/useCarga'
import { estadoDe, marcaDe, puntoDeArbol, puntoDeZona, tonoDe, zonaDe, type Punto } from './MapaScreen'
import { partesCromatico } from './ResumenScreen'

/** Tope del historial que se pide al backend (el más reciente primero). */
export const LIMITE_SEGUIMIENTO = 200

interface Props {
  tipo: 'arbol' | 'zona'
  id: string
}

/** #/arbol/<id> y #/zona/<id>: todo lo que se sabe de un punto, para seguirlo en el tiempo. */
export default function SeguimientoScreen({ tipo, id }: Props) {
  const carga = useCarga(
    async (signal) => {
      const [registro, analisis] = await Promise.all([
        tipo === 'arbol' ? getArbol(id, signal).then(puntoDeArbol) : getZona(id, signal).then(puntoDeZona),
        buscarAnalisis({ [tipo]: id, limite: LIMITE_SEGUIMIENTO }, signal),
      ])
      return { punto: registro, analisis }
    },
    [tipo, id],
  )

  useEffect(() => {
    document.title = `${carga.datos?.punto.nombre ?? 'Seguimiento'} · Sheets TT`
  }, [carga.datos])

  return (
    <div className="pagina seguimiento">
      <a className="volver" href={hrefDe('mapa', `${tipo === 'arbol' ? 'a' : 'z'}-${id}`)}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Volver al mapa
      </a>
      {carga.estado === 'cargando' && <EsqueletoSeguimiento />}
      {carga.estado === 'error' && (
        <>
          <header className="pagina-encabezado">
            <h1>{tipo === 'arbol' ? 'Árbol' : 'Zona'} no disponible</h1>
          </header>
          <ErrorCarga mensaje={carga.error} onReintentar={carga.reintentar} />
        </>
      )}
      {carga.datos && <Contenido punto={carga.datos.punto} analisis={carga.datos.analisis} />}
    </div>
  )
}

function Contenido({ punto, analisis }: { punto: Punto; analisis: Analisis[] }) {
  const [tipoVisible, setTipoVisible] = useState<TipoImagen | 'todos'>('todos')
  const [capturaElegida, setCapturaElegida] = useState<string | null>(null)
  const [foto, setFoto] = useState<Analisis | null>(null)

  const tipos = useMemo(() => new Set(analisis.map((a) => a.tipoImagen)), [analisis])
  const filtrados = useMemo(
    () => (tipoVisible === 'todos' ? analisis : analisis.filter((a) => a.tipoImagen === tipoVisible)),
    [analisis, tipoVisible],
  )
  const conCromatico = useMemo(() => analisis.filter((a) => a.cromatico), [analisis])
  const infestados = analisis.filter((a) => a.resultadoClasificacion === 'infestado').length

  return (
    <>
      <header className="pagina-encabezado seguimiento-encabezado">
        <h1>{punto.nombre}</h1>
        <p className="muted">
          {punto.tipo === 'arbol' ? <i>{punto.detalle}</i> : punto.detalle}
        </p>
      </header>

      <section className={`panel seguimiento-ficha${tonoDe(punto) === 'alerta' ? ' ficha-alerta' : ''}`} aria-label="Estado actual">
        <dl className="datos">
          <div>
            <dt>Estado actual</dt>
            <dd>
              <Estado tono={tonoDe(punto)}>{estadoDe(punto)}</Estado>
            </dd>
          </div>
          <div>
            <dt>Último análisis</dt>
            <dd>
              {punto.ultimo ? (
                <>
                  {haceCuanto(punto.ultimo.fechaCaptura)}
                  <span className="muted dato-nota">{formatFecha(punto.ultimo.fechaCaptura)}</span>
                </>
              ) : (
                'Ninguno'
              )}
            </dd>
          </div>
          <div>
            <dt>Análisis registrados</dt>
            <dd>
              {analisis.length === LIMITE_SEGUIMIENTO ? `${LIMITE_SEGUIMIENTO}+` : analisis.length}
              {analisis.length > 0 && (
                <span className="muted dato-nota">
                  {infestados} con infestación
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Registrado</dt>
            <dd>
              {formatFecha(punto.fechaRegistro)}
              {punto.lat !== null && punto.lon !== null && (
                <span className="muted dato-nota">{formatCoordenadas(punto.lat, punto.lon)}</span>
              )}
            </dd>
          </div>
        </dl>
        {punto.descripcion && <p className="detalle-descripcion">{punto.descripcion}</p>}
      </section>

      <div className="seguimiento-rejilla">
        <MiniMapa
          punto={punto}
          analisis={analisis}
          capturaElegida={capturaElegida}
          onElegirCaptura={setCapturaElegida}
        />

        <section className="panel" aria-labelledby="titulo-confianza">
          <h2 id="titulo-confianza">Resultado de cada análisis</h2>
          <p className="muted bloque-nota">Qué tan segura estuvo la clasificación, captura por captura</p>
          {analisis.length ? (
            <GraficaConfianza
              analisis={analisis}
              elegido={capturaElegida}
              onElegir={setCapturaElegida}
            />
          ) : (
            <p className="muted">Todavía no tiene análisis. Aparecerán aquí cuando se sincronicen desde la app móvil.</p>
          )}
        </section>
      </div>

      {conCromatico.length > 0 && (
        <section className="panel" aria-labelledby="titulo-evolucion">
          <h2 id="titulo-evolucion">Evolución del follaje</h2>
          <p className="muted bloque-nota">Porcentaje del dosel en cada condición, de la captura más reciente a la más antigua</p>
          <ul className="evolucion">
            {conCromatico.map((a) => (
              <li key={a.id}>
                <span className="evolucion-fecha">{formatFecha(a.fechaCaptura)}</span>
                <BarraSegmentada
                  titulo="Cromático"
                  nombre={`Follaje el ${formatFecha(a.fechaCaptura)}`}
                  modo="porcentaje"
                  variante="delgada"
                  partes={partesCromatico(a.cromatico!)}
                />
              </li>
            ))}
          </ul>
          <ul className="leyenda" aria-hidden="true">
            {partesCromatico(conCromatico[0].cromatico!).map((p) => (
              <li key={p.clave}>
                <span className={`muestra ${p.color}`} />
                {p.etiqueta}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel" aria-labelledby="titulo-linea">
        <div className="linea-cabeza">
          <h2 id="titulo-linea">Línea de tiempo</h2>
          {tipos.size > 1 && (
            <div className="fichas" role="group" aria-label="Tipo de imagen">
              {(['todos', 'corteza', 'follaje'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="ficha"
                  aria-pressed={tipoVisible === t}
                  onClick={() => setTipoVisible(t)}
                >
                  {t === 'todos' ? 'Todos' : ETIQUETA_TIPO[t]}
                </button>
              ))}
            </div>
          )}
        </div>
        {filtrados.length ? (
          <ol className="linea-tiempo" aria-labelledby="titulo-linea">
            {filtrados.map((a, i) => (
              <EventoLinea
                key={a.id}
                analisis={a}
                anterior={filtrados[i + 1] ?? null}
                punto={punto}
                elegido={a.id === capturaElegida}
                onElegir={() => setCapturaElegida(a.id)}
                onFoto={() => setFoto(a)}
              />
            ))}
          </ol>
        ) : (
          <p className="muted">Sin análisis que mostrar.</p>
        )}
        {analisis.length === LIMITE_SEGUIMIENTO && (
          <p className="muted conteo">
            Se muestran los {LIMITE_SEGUIMIENTO} más recientes; los anteriores están en{' '}
            <a href={hrefDe('analisis')}>Análisis</a>.
          </p>
        )}
      </section>
      {foto && <FotoEvidencia analisis={foto} onCerrar={() => setFoto(null)} />}
    </>
  )
}

function EventoLinea({
  analisis: a,
  anterior,
  punto,
  elegido,
  onElegir,
  onFoto,
}: {
  analisis: Analisis
  anterior: Analisis | null
  punto: Punto
  elegido: boolean
  onElegir: () => void
  onFoto: () => void
}) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (elegido) ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [elegido])

  const cambio = anterior && anterior.resultadoClasificacion !== a.resultadoClasificacion
  const lejos =
    a.latitudCaptura !== null && a.longitudCaptura !== null && punto.lat !== null && punto.lon !== null
      ? Math.round(distanciaMetros([punto.lon, punto.lat], [a.longitudCaptura, a.latitudCaptura]))
      : null

  return (
    <li ref={ref} className={`evento evento-${TONO_RESULTADO[a.resultadoClasificacion]}${elegido ? ' elegido' : ''}`}>
      <span className="evento-marca" aria-hidden="true" />
      <div className="evento-cuerpo">
        <div className="evento-cabeza">
          <Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado>
          <time dateTime={a.fechaCaptura} className="evento-fecha">
            {formatFecha(a.fechaCaptura)}
          </time>
        </div>
        {cambio && (
          <p className="evento-cambio">
            Cambió de {ETIQUETA_RESULTADO[anterior.resultadoClasificacion].toLowerCase()} a{' '}
            {ETIQUETA_RESULTADO[a.resultadoClasificacion].toLowerCase()}
          </p>
        )}
        <p className="muted evento-datos">
          {ETIQUETA_TIPO[a.tipoImagen]}, confianza {formatPorcentaje(a.confianza)}
          {lejos !== null && lejos >= 5 && `, tomada a ${lejos} m ${punto.tipo === 'arbol' ? 'del árbol' : 'del centro'}`}
        </p>
        {a.observaciones && <p className="evento-obs">{a.observaciones}</p>}
        <div className="evento-pie">
          <Estado tono={TONO_SINCRONIZACION[a.estadoSincronizacion]}>{ETIQUETA_SINCRONIZACION[a.estadoSincronizacion]}</Estado>
          {a.latitudCaptura !== null && a.longitudCaptura !== null && (
            <button type="button" className="btn-foto" aria-pressed={elegido} onClick={onElegir}>
              Ubicar
            </button>
          )}
          {a.tieneEvidencia && (
            <button type="button" className="btn-foto" aria-label={`Ver foto del ${formatFecha(a.fechaCaptura)}`} onClick={onFoto}>
              <IconoFoto />
              Ver foto
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function MiniMapa({
  punto,
  analisis,
  capturaElegida,
  onElegirCaptura,
}: {
  punto: Punto
  analisis: Analisis[]
  capturaElegida: string | null
  onElegirCaptura: (id: string) => void
}) {
  const { marcas, zonas, capturas, encuadre } = useMemo(() => {
    const ubicado = punto.lat !== null && punto.lon !== null ? { ...punto, lat: punto.lat, lon: punto.lon } : null
    const zona = ubicado && zonaDe(ubicado)
    const capturas: CapturaMapa[] = analisis
      .filter((a) => a.latitudCaptura !== null && a.longitudCaptura !== null)
      .map((a) => ({ clave: a.id, lngLat: [a.longitudCaptura!, a.latitudCaptura!], tono: TONO_RESULTADO[a.resultadoClasificacion] }))
    return {
      marcas: ubicado ? [marcaDe(ubicado)] : [],
      zonas: zona ? [zona] : ([] as ZonaMapa[]),
      capturas,
      encuadre: limitesDe([
        ...(ubicado ? [{ lon: ubicado.lon, lat: ubicado.lat, radioMetros: ubicado.radioMetros }] : []),
        ...capturas.map((c) => ({ lon: c.lngLat[0], lat: c.lngLat[1] })),
      ]),
    }
  }, [punto, analisis])

  return (
    <section className="panel panel-mapa" aria-labelledby="titulo-ubicacion">
      <h2 id="titulo-ubicacion">Ubicación</h2>
      {encuadre ? (
        <>
          <MapaCampo
            className="mapa-mini"
            nombre={`Ubicación de ${punto.nombre}${capturas.length ? ` y ${capturas.length} ${capturas.length === 1 ? 'captura' : 'capturas'}` : ''}`}
            marcas={marcas}
            zonas={zonas}
            capturas={capturas}
            capturaElegida={capturaElegida}
            encuadre={encuadre}
            zoomMaximo={18}
            onElegirCaptura={onElegirCaptura}
          />
          {capturas.length > 0 && (
            <p className="muted bloque-nota">
              Los puntos pequeños marcan dónde se tomó cada foto. Tócalos para encontrarla en la línea de tiempo.
            </p>
          )}
        </>
      ) : (
        <p className="muted">Este registro no tiene coordenadas.</p>
      )}
    </section>
  )
}
