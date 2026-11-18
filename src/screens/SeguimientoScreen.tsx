import { useEffect, useMemo, useRef, useState } from 'react'
import BarraSegmentada from '../components/BarraSegmentada'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoSeguimiento } from '../components/Esqueleto'
import FotoEvidencia, { IconoFoto } from '../components/FotoEvidencia'
import GraficaConfianza from '../components/GraficaConfianza'
import MapaCampo, { type CapturaMapa, type ZonaMapa } from '../components/MapaCampo'
import { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../components/Simbolo'
import { Autor, Observaciones } from '../components/Campo'
import { buscarAnalisis, getArbol, getZona, type Analisis, type DatosSeguimiento, type Persona, type Seguidor, type TipoImagen } from '../lib/api'
import { ETIQUETA_NIVEL, nivelConfianza, seguimientoDe } from '../lib/analisis'
import { fraseResultado, fraseSeguimiento, partesFollaje, queHacer, TITULO_FOLLAJE } from '../lib/lenguaje'
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
      const [{ punto, registro }, analisis] = await Promise.all([
        tipo === 'arbol'
          ? getArbol(id, signal).then((r) => ({ punto: puntoDeArbol(r), registro: r as DatosSeguimiento }))
          : getZona(id, signal).then((r) => ({ punto: puntoDeZona(r), registro: r as DatosSeguimiento })),
        buscarAnalisis({ [tipo]: id, limite: LIMITE_SEGUIMIENTO }, signal),
      ])
      return { punto, analisis, registro }
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
      {carga.datos && <Contenido punto={carga.datos.punto} analisis={carga.datos.analisis} registro={carga.datos.registro} />}
    </div>
  )
}

function Contenido({ punto, analisis, registro }: { punto: Punto; analisis: Analisis[]; registro: DatosSeguimiento }) {
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
  const seguidores = useMemo(() => seguimientoDe(registro.seguimiento, analisis), [registro.seguimiento, analisis])
  // El más reciente (los análisis llegan del más reciente al más antiguo): de él sale «Qué hacer».
  const reciente = analisis[0] ?? null

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
            <dt>Registrado el</dt>
            <dd>
              {formatFecha(punto.fechaRegistro)}
              {punto.lat !== null && punto.lon !== null && (
                <span className="muted dato-nota">{formatCoordenadas(punto.lat, punto.lon)}</span>
              )}
            </dd>
          </div>
        </dl>
        {punto.descripcion && <p className="detalle-descripcion">{punto.descripcion}</p>}
        {reciente && (
          <div className="que-hacer">
            <h2>Qué hacer</h2>
            <p>
              <span className="que-hacer-por">Según el análisis más reciente ({fraseResultado(reciente.resultadoClasificacion).toLowerCase()}):</span>{' '}
              {queHacer(reciente.resultadoClasificacion, nivelConfianza(reciente.confianza), punto.tipo)}
            </p>
          </div>
        )}
      </section>

      <QuienSigue tipo={punto.tipo} registradoPor={registro.registradoPor ?? null} seguidores={seguidores} />

      <div className="seguimiento-rejilla">
        <MiniMapa
          punto={punto}
          analisis={analisis}
          capturaElegida={capturaElegida}
          onElegirCaptura={setCapturaElegida}
        />

        <section className="panel" aria-labelledby="titulo-confianza">
          <h2 id="titulo-confianza">Resultado de cada análisis</h2>
          <p className="muted bloque-nota">Qué tan seguro fue cada diagnóstico, foto por foto</p>
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
          <h2 id="titulo-evolucion">Evolución del color del follaje</h2>
          <p className="muted bloque-nota">Qué parte del follaje se ve sana, regular, dañada o incierta en cada foto, de la más reciente a la más antigua</p>
          <ul className="evolucion">
            {conCromatico.map((a) => (
              <li key={a.id}>
                <span className="evolucion-fecha">{formatFecha(a.fechaCaptura)}</span>
                <BarraSegmentada
                  titulo={TITULO_FOLLAJE}
                  nombre={`Follaje el ${formatFecha(a.fechaCaptura)}`}
                  modo="porcentaje"
                  variante="delgada"
                  partes={partesFollaje(a.cromatico!)}
                />
              </li>
            ))}
          </ul>
          <ul className="leyenda" aria-hidden="true">
            {partesFollaje(conCromatico[0].cromatico!).map((p) => (
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
          {ETIQUETA_TIPO[a.tipoImagen]}, certeza {ETIQUETA_NIVEL[nivelConfianza(a.confianza)].toLowerCase()}
          {a.confianza !== null && ` (${formatPorcentaje(a.confianza)})`}
          {lejos !== null && lejos >= 5 && `, tomada a ${lejos} m ${punto.tipo === 'arbol' ? 'del árbol' : 'del centro'}`}
        </p>
        <p className="evento-autor">
          <Autor analisis={a} />
        </p>
        <Observaciones analisis={a} />
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

/**
 * Quién registró el lugar y quién sube sus fotos. Con 2 o más personas se destaca (varias manos
 * siguiendo el mismo árbol). Un backend sin el dato (autor nulo en todo) lo dice sin inventar.
 */
function QuienSigue({ tipo, registradoPor, seguidores }: { tipo: 'arbol' | 'zona'; registradoPor: Persona | null; seguidores: Seguidor[] }) {
  const varios = seguidores.length >= 2
  return (
    <section className={`panel quien-sigue${varios ? ' quien-sigue-varios' : ''}`} aria-labelledby="titulo-quien">
      <h2 id="titulo-quien">Quién le da seguimiento</h2>
      {!registradoPor && seguidores.length === 0 ? (
        <p className="muted">Sin registro de quién sube las fotos todavía.</p>
      ) : (
        <>
          <p className="quien-registro">
            {registradoPor ? (
              <>
                Registrado por <strong>{registradoPor.nombre}</strong>
              </>
            ) : (
              <span className="muted">No se sabe quién lo registró.</span>
            )}
          </p>
          {varios && (
            <p className="quien-destacado">
              <svg className="icono" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 3 3 6" />
              </svg>
              {fraseSeguimiento(seguidores.length, tipo)}
            </p>
          )}
          {seguidores.length > 0 ? (
            <ul className="quien-lista" aria-label="Personas que suben fotos">
              {seguidores.map((p) => (
                <li key={p.id}>
                  <span className="quien-nombre">{p.nombre}</span>
                  <span className="muted">
                    {p.analisis} análisis · última foto {haceCuanto(p.ultimo)} ({formatFecha(p.ultimo)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Todavía nadie ha subido fotos con su nombre.</p>
          )}
        </>
      )}
    </section>
  )
}
