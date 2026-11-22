import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import CajasCategoria from '../components/analisis/CajasCategoria'
import DetalleAnalisis from '../components/analisis/DetalleAnalisis'
import TarjetaAnalisis from '../components/analisis/TarjetaAnalisis'
import BarraSegmentada from '../components/BarraSegmentada'
import { Dispositivo } from '../components/Campo'
import { ErrorCarga } from '../components/EstadoCarga'
import { EsqueletoTabla } from '../components/Esqueleto'
import FotoEvidencia, { IconoFoto } from '../components/FotoEvidencia'
import { Estado, TONO_RESULTADO, TONO_SINCRONIZACION } from '../components/Simbolo'
import {
  AGRUPAR,
  agrupar,
  alternar,
  CAJAS_VACIAS,
  conteosCajas,
  ETIQUETA_AGRUPAR,
  ETIQUETA_NIVEL,
  escribirEstado,
  filtrarCajas,
  FORM_VACIO,
  hayCajas,
  leerEstado,
  NIVELES,
  nivelConfianza,
  RESULTADOS,
  SIN_AUTOR_ID,
  TIPOS,
  type Agrupar,
  type Cajas,
  type ConteosCajas,
  type EstadoAnalisis,
  type Formulario,
  type Grupo,
  type Vista,
} from '../lib/analisis'
import {
  buscarAnalisis,
  getArboles,
  getZonas,
  type Analisis,
  type EstadoSincronizacion,
  type FiltroAnalisis,
  type Resultado,
} from '../lib/api'
import {
  ETIQUETA_RESULTADO,
  ETIQUETA_SINCRONIZACION,
  ETIQUETA_TIPO,
  finDelDia,
  formatFecha,
  formatPorcentaje,
  inicioDelDia,
} from '../lib/format'
import { fijarConsulta, hrefDe, useConsulta } from '../lib/router'
import { useCarga } from '../lib/useCarga'
import { ETIQUETA_CERTEZA, observacionesDe, partesFollaje, SIN_AUTOR, TITULO_ENVIO, TITULO_FOLLAJE, TITULO_OBSERVACIONES } from '../lib/lenguaje'

const LIMITE = 100
const CLAVE_VISTA = 'sheets-tt.analisis.vista'

function aFiltro(f: Formulario): FiltroAnalisis {
  return {
    tipo: f.tipo || undefined,
    resultado: f.resultado || undefined,
    estado: f.estado || undefined,
    desde: inicioDelDia(f.desde),
    hasta: finDelDia(f.hasta),
    limite: LIMITE,
  }
}

/** Preferencia de vista del navegador (si la URL no la dice). Storage puede no estar disponible. */
function vistaGuardada(): Vista {
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'tarjetas' ? 'tarjetas' : 'tabla'
  } catch {
    return 'tabla'
  }
}

function guardarVista(v: Vista) {
  try {
    localStorage.setItem(CLAVE_VISTA, v)
  } catch {
    /* sin storage: queda solo en la URL */
  }
}

export default function AnalisisScreen() {
  // Todo el estado vive en la URL (#/analisis?tipo=…&caja_resultado=…&vista=…): se comparte y Atrás lo recorre.
  const consulta = useConsulta()
  const estado = useMemo(() => leerEstado(consulta), [consulta])
  const aplicado = estado.form
  const claveForm = JSON.stringify(aplicado)
  // `borrador` es lo que se edita; `aplicado` es lo que se consultó (cambia solo al enviar).
  const [borrador, setBorrador] = useState<Formulario>(aplicado)
  const [formPrevio, setFormPrevio] = useState(claveForm)
  if (formPrevio !== claveForm) {
    // La URL cambió por otra vía (Atrás, un enlace): el formulario la sigue.
    setFormPrevio(claveForm)
    setBorrador(aplicado)
  }
  const carga = useCarga((signal) => buscarAnalisis(aFiltro(aplicado), signal), [claveForm])
  // Nombres de árboles y zonas para tarjetas, grupos y detalle (si fallan, se muestran genéricos).
  const lugares = useCarga(async (signal) => {
    const [arboles, zonas] = await Promise.all([getArboles(signal).catch(() => []), getZonas(signal).catch(() => [])])
    return new Map([
      ...arboles.map((a) => [`arbol:${a.id}`, a.nombreEspecifico] as const),
      ...zonas.map((z) => [`zona:${z.id}`, z.nombreZona] as const),
    ])
  }, [])
  const nombres = useMemo(() => lugares.datos ?? new Map<string, string>(), [lugares.datos])
  const hayFiltros = claveForm !== JSON.stringify(FORM_VACIO)
  const [foto, setFoto] = useState<Analisis | null>(null)
  const [detalle, setDetalle] = useState<Analisis | null>(null)
  const origenDetalle = useRef<HTMLElement | null>(null)
  const vista: Vista = estado.vista ?? vistaGuardada()

  useEffect(() => {
    document.title = 'Análisis · Sheets TT'
  }, [])

  // URL canónica: valores inválidos (fechas que no existen, cajas repetidas o desconocidas) se
  // quitan sin dejar paso nuevo en el historial.
  useEffect(() => {
    const canonica = escribirEstado(estado)
    if (canonica.toString() !== consulta) fijarConsulta(canonica, { replace: true })
  }, [estado, consulta])

  function cambiarEstado(parcial: Partial<EstadoAnalisis>) {
    fijarConsulta(escribirEstado({ ...estado, ...parcial }))
  }

  // «Hasta» antes que «Desde»: se avisa en el campo y no se consulta (antes llegaba al backend, que
  // respondía 400 con un aviso genérico en minúsculas).
  const rangoInvertido = Boolean(borrador.desde && borrador.hasta && borrador.desde > borrador.hasta)
  const [errorRango, setErrorRango] = useState(false)
  const hastaRef = useRef<HTMLInputElement>(null)

  function aplicar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (rangoInvertido) {
      setErrorRango(true)
      hastaRef.current?.focus()
      return
    }
    setErrorRango(false)
    cambiarEstado({ form: borrador })
  }

  function quitar() {
    setBorrador(FORM_VACIO)
    cambiarEstado({ form: FORM_VACIO, cajas: CAJAS_VACIAS })
  }

  function cambiarVista(v: Vista) {
    guardarVista(v)
    cambiarEstado({ vista: v })
  }

  function abrirDetalle(a: Analisis, origen: HTMLElement) {
    origenDetalle.current = origen
    setDetalle(a)
  }

  function cerrarDetalle() {
    setDetalle(null)
    // Si se abrió por enlace (…?detalle=id), al cerrar se quita de la URL sin paso nuevo.
    if (estado.detalle) fijarConsulta(escribirEstado({ ...estado, detalle: null }), { replace: true })
    const o = origenDetalle.current
    origenDetalle.current = null
    requestAnimationFrame(() => {
      // Sin botón de origen (se abrió por enlace), el foco va al conteo (o al título).
      if (o?.isConnected) o.focus()
      else (document.getElementById('analisis-conteo') ?? document.getElementById('titulo-analisis'))?.focus()
    })
  }

  /** Anterior/siguiente: si el detalle vino por enlace, la URL sigue al análisis que se ve (sin paso nuevo). */
  function cambiarDetalle(a: Analisis) {
    setDetalle(a)
    if (estado.detalle) fijarConsulta(escribirEstado({ ...estado, detalle: a.id }), { replace: true })
  }

  const campo = <K extends keyof Formulario>(k: K) => ({
    value: borrador[k],
    onChange: (e: { target: { value: string } }) => setBorrador((b) => ({ ...b, [k]: e.target.value })),
  })

  const datos = carga.datos
  const filtrados = useMemo(() => (datos ? filtrarCajas(datos, estado.cajas) : []), [datos, estado.cajas])
  const conteos = useMemo(() => (datos ? conteosCajas(datos) : null), [datos])
  // caja_autor con personas que no están entre los cargados (enlace viejo, id inventado): ya con
  // los datos, se quitan de la URL sin paso nuevo, como los demás valores inválidos.
  const autoresSobrantes = conteos && !carga.recargando ? estado.cajas.autor.filter((id) => !conteos.autores.some((x) => x.id === id)) : []
  const claveSobrantes = autoresSobrantes.join(',')
  useEffect(() => {
    if (!claveSobrantes) return
    const quitar = claveSobrantes.split(',')
    fijarConsulta(escribirEstado({ ...estado, cajas: { ...estado.cajas, autor: estado.cajas.autor.filter((id) => !quitar.includes(id)) } }), { replace: true })
  }, [claveSobrantes, estado])
  const grupos = useMemo(() => agrupar(filtrados, estado.agrupar, nombres), [filtrados, estado.agrupar, nombres])
  const conCajas = hayCajas(estado.cajas)
  // Detalle abierto: el elegido aquí o, si no, el de la URL (enlace desde el Resumen).
  const porEnlace = estado.detalle && datos ? (datos.find((a) => a.id === estado.detalle) ?? null) : null
  const abierto = detalle ?? porEnlace
  // Un ?detalle= que no está entre los cargados: se avisa y el parámetro se quita (replace), para
  // que no se arrastre a los siguientes cambios. El aviso sigue mientras la URL sea la que quedó.
  const detalleInexistente = !!(estado.detalle && datos && !porEnlace)
  const sinDetalle = escribirEstado({ ...estado, detalle: null }).toString()
  const [avisoDetalle, setAvisoDetalle] = useState<string | null>(null)
  if (detalleInexistente && avisoDetalle !== sinDetalle) setAvisoDetalle(sinDetalle)
  useEffect(() => {
    if (detalleInexistente) fijarConsulta(new URLSearchParams(sinDetalle), { replace: true })
  }, [detalleInexistente, sinDetalle])

  return (
    <div className="pagina">
      <header className="pagina-encabezado">
        <h1 id="titulo-analisis" tabIndex={-1}>Análisis</h1>
        <p className="muted">Fotos de corteza y follaje tomadas en campo y su diagnóstico, de la más reciente a la más antigua.</p>
      </header>

      <form className="filtros panel" onSubmit={aplicar} aria-label="Filtros" noValidate>
        <div className="field">
          <label htmlFor="f-desde">Desde</label>
          {/* max/min: el calendario no deja elegir un rango al revés. */}
          <input id="f-desde" type="date" max={borrador.hasta || undefined} {...campo('desde')} />
        </div>
        <div className="field">
          <label htmlFor="f-hasta">Hasta</label>
          <input
            id="f-hasta"
            ref={hastaRef}
            type="date"
            min={borrador.desde || undefined}
            aria-invalid={errorRango && rangoInvertido ? true : undefined}
            aria-describedby={errorRango && rangoInvertido ? 'f-hasta-error' : undefined}
            {...campo('hasta')}
          />
          {errorRango && rangoInvertido && (
            <p className="field-error" id="f-hasta-error" role="alert">
              «Hasta» no puede ser anterior a «Desde».
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="f-tipo">Tipo de foto</label>
          <select id="f-tipo" {...campo('tipo')}>
            <option value="">Todos</option>
            <option value="corteza">{ETIQUETA_TIPO.corteza}</option>
            <option value="follaje">{ETIQUETA_TIPO.follaje}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-resultado">Resultado</label>
          <select id="f-resultado" {...campo('resultado')}>
            <option value="">Todos</option>
            {(Object.keys(ETIQUETA_RESULTADO) as Resultado[]).map((r) => (
              <option key={r} value={r}>{ETIQUETA_RESULTADO[r]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-estado">{TITULO_ENVIO}</label>
          <select id="f-estado" {...campo('estado')}>
            <option value="">Todas</option>
            {(Object.keys(ETIQUETA_SINCRONIZACION) as EstadoSincronizacion[]).map((s) => (
              <option key={s} value={s}>{ETIQUETA_SINCRONIZACION[s]}</option>
            ))}
          </select>
        </div>
        <div className="filtros-acciones">
          <button type="submit" className="btn btn-primary">Aplicar filtros</button>
          {/* Sin resultados, el botón vive en el mensaje vacío (no se duplica). Quita también las cajas. */}
          {(hayFiltros || conCajas) && datos?.length !== 0 && (
            <button type="button" className="btn btn-ghost" onClick={quitar}>Quitar filtros</button>
          )}
        </div>
      </form>

      {carga.estado === 'cargando' && <EsqueletoTabla texto="Cargando análisis…" filas={6} columnas={7} />}
      {carga.estado === 'error' && <ErrorCarga mensaje={carga.error} />}

      {datos && (
        <div className={carga.recargando ? 'recargando' : undefined}>
          {datos.length === 0 ? (
            <div className="vacio panel">
              <p>Ningún análisis coincide con estos filtros.</p>
              {(hayFiltros || conCajas) && (
                <button type="button" className="btn btn-secondary" onClick={quitar}>Quitar filtros</button>
              )}
            </div>
          ) : (
            <>
              <CajasCategoria conteos={conteos!} cajas={estado.cajas} onCambiar={(c) => cambiarEstado({ cajas: c })} />
              <ChipsCajas cajas={estado.cajas} autores={conteos!.autores} onCambiar={(c) => cambiarEstado({ cajas: c })} />

              <div className="analisis-barra">
                <p className="muted conteo" role="status" tabIndex={-1} id="analisis-conteo">
                  {conCajas ? `${filtrados.length} de ${datos.length} análisis. ` : ''}
                  {datos.length === LIMITE
                    ? `Se muestran los ${LIMITE} más recientes. Acota por fechas para ver los anteriores.`
                    : conCajas
                      ? ''
                      : `${datos.length} ${datos.length === 1 ? 'análisis' : 'análisis'}`}
                </p>
                <div className="analisis-controles">
                  <div className="segmentado" role="group" aria-label="Vista">
                    {(['tarjetas', 'tabla'] as const).map((v) => (
                      <button key={v} type="button" aria-pressed={vista === v} onClick={() => cambiarVista(v)}>
                        {v === 'tarjetas' ? 'Tarjetas' : 'Tabla'}
                      </button>
                    ))}
                  </div>
                  <div className="field field-en-linea">
                    <label htmlFor="f-agrupar">Agrupar por</label>
                    <select id="f-agrupar" value={estado.agrupar} onChange={(e) => cambiarEstado({ agrupar: e.target.value as Agrupar })}>
                      {AGRUPAR.map((g) => (
                        <option key={g} value={g}>{ETIQUETA_AGRUPAR[g]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filtrados.length === 0 ? (
                <div className="vacio panel">
                  <p>Ninguno de los análisis cargados cumple las cajas elegidas.</p>
                  <button type="button" className="btn btn-secondary" onClick={() => cambiarEstado({ cajas: CAJAS_VACIAS })}>
                    Quitar selección
                  </button>
                </div>
              ) : estado.agrupar === 'nada' ? (
                <Contenido
                  vista={vista}
                  analisis={filtrados}
                  titulo="Análisis"
                  nombres={nombres}
                  onFoto={setFoto}
                  onDetalle={abrirDetalle}
                />
              ) : (
                <div className="grupos">
                  {grupos.map((g) => (
                    <GrupoAnalisis key={g.clave} grupo={g}>
                      <Contenido vista={vista} analisis={g.analisis} titulo={g.titulo} nombres={nombres} onFoto={setFoto} onDetalle={abrirDetalle} />
                    </GrupoAnalisis>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {foto && <FotoEvidencia analisis={foto} onCerrar={() => setFoto(null)} />}
      {abierto && datos && (
        <DetalleAnalisis analisis={abierto} todos={datos} nombres={nombres} onCambiar={cambiarDetalle} onCerrar={cerrarDetalle} />
      )}
      {avisoDetalle !== null && avisoDetalle === consulta && (
        <p className="notice" role="status">
          El análisis enlazado no está entre los cargados con estos filtros.
        </p>
      )}
    </div>
  )
}

interface ContenidoProps {
  vista: Vista
  analisis: Analisis[]
  titulo: string
  nombres: Map<string, string>
  onFoto: (a: Analisis) => void
  onDetalle: (a: Analisis, origen: HTMLElement) => void
}

function Contenido({ vista, analisis, titulo, nombres, onFoto, onDetalle }: ContenidoProps) {
  if (vista === 'tarjetas') {
    return (
      <ul className="tarjetas" aria-label={titulo}>
        {analisis.map((a) => (
          <li key={a.id}>
            <TarjetaAnalisis analisis={a} nombres={nombres} onAbrir={onDetalle} />
          </li>
        ))}
      </ul>
    )
  }
  return <TablaAnalisis analisis={analisis} titulo={titulo} onFoto={onFoto} onDetalle={onDetalle} />
}

/** La tabla de siempre, más un botón de detalle por fila. */
function TablaAnalisis({
  analisis,
  titulo,
  onFoto,
  onDetalle,
}: {
  analisis: Analisis[]
  titulo: string
  onFoto: (a: Analisis) => void
  onDetalle: (a: Analisis, origen: HTMLElement) => void
}) {
  return (
    <div className="tabla-desplazable panel-tabla">
      <table className="tabla tabla-apilable">
        <caption className="visually-hidden">{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Foto tomada</th>
            <th scope="col">Tipo</th>
            <th scope="col">Resultado</th>
            <th scope="col">Certeza</th>
            <th scope="col">Subido por</th>
            <th scope="col">{TITULO_OBSERVACIONES}</th>
            <th scope="col">{TITULO_FOLLAJE}</th>
            <th scope="col">Envío</th>
            <th scope="col"><span className="visually-hidden">Foto y detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {analisis.map((a) => (
            <tr key={a.id}>
              <td className="nowrap celda-titulo">{formatFecha(a.fechaCaptura)}</td>
              <td data-label="Tipo">{ETIQUETA_TIPO[a.tipoImagen]}</td>
              <td data-label="Resultado"><Estado tono={TONO_RESULTADO[a.resultadoClasificacion]}>{ETIQUETA_RESULTADO[a.resultadoClasificacion]}</Estado></td>
              <td className="nowrap" data-label="Certeza">
                <span>
                  {ETIQUETA_CERTEZA[nivelConfianza(a.confianza)]}
                  {a.confianza !== null && <span className="muted"> · {formatPorcentaje(a.confianza)}</span>}
                </span>
              </td>
              <td data-label="Subido por">
                {a.autor ? a.autor.nombre : <span className="muted">{SIN_AUTOR}</span>}
                <Dispositivo analisis={a} comoSubtitulo />
              </td>
              <td className="observaciones" data-label={TITULO_OBSERVACIONES}>
                {observacionesDe(a) ? <q className="observaciones-cita">{observacionesDe(a)}</q> : <span className="muted">—</span>}
              </td>
              <td className="celda-barra" data-label={TITULO_FOLLAJE}>
                {a.cromatico ? (
                  <BarraSegmentada titulo={TITULO_FOLLAJE} modo="porcentaje" variante="delgada" partes={partesFollaje(a.cromatico)} />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td data-label="Envío"><Estado tono={TONO_SINCRONIZACION[a.estadoSincronizacion]}>{ETIQUETA_SINCRONIZACION[a.estadoSincronizacion]}</Estado></td>
              <td>
                <div className="acciones-celda">
                  {a.tieneEvidencia && (
                    <button
                      type="button"
                      className="btn-foto"
                      aria-label={`Ver foto del ${formatFecha(a.fechaCaptura)}`}
                      onClick={() => onFoto(a)}
                    >
                      <IconoFoto />
                      Ver foto
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-foto btn-detalle"
                    aria-label={`Ver detalle del ${formatFecha(a.fechaCaptura)}`}
                    onClick={(e) => onDetalle(a, e.currentTarget)}
                  >
                    Detalle
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Sección plegable de un grupo, con su resumen de conteos y, si es un lugar, el enlace al seguimiento. */
function GrupoAnalisis({ grupo: g, children }: { grupo: Grupo; children: ReactNode }) {
  const partes = RESULTADOS.filter((r) => g.resultado[r]).map((r) => `${g.resultado[r]} ${ETIQUETA_RESULTADO[r].toLowerCase()}`)
  return (
    <details className="grupo panel" open>
      <summary>
        <span className="grupo-titulo">{g.titulo}</span>
        <span className="grupo-resumen">
          {plural(g.analisis.length, 'análisis', 'análisis')}: {partes.join(', ')}
          {g.atencion > 0 && ` · ${plural(g.atencion, 'requiere', 'requieren')} atención`}
        </span>
      </summary>
      {g.lugar && (
        <p className="grupo-enlace">
          <a href={hrefDe(g.lugar.tipo, g.lugar.id)}>Ver seguimiento de {g.titulo}</a>
        </p>
      )}
      {children}
    </details>
  )
}

/** Chips de las cajas activas; cada una se quita con su botón (el foco pasa a la siguiente o al conteo). */
function ChipsCajas({ cajas, autores, onCambiar }: { cajas: Cajas; autores: ConteosCajas['autores']; onCambiar: (c: Cajas) => void }) {
  const nombreAutor = (id: string) => (id === SIN_AUTOR_ID ? SIN_AUTOR : (autores.find((x) => x.id === id)?.nombre ?? 'Persona sin nombre'))
  const chips = [
    ...cajas.resultado.map((r) => ({ clave: `r-${r}`, texto: `Resultado: ${ETIQUETA_RESULTADO[r]}`, quitar: { ...cajas, resultado: alternar(cajas.resultado, r, RESULTADOS) } })),
    ...cajas.tipo.map((t) => ({ clave: `t-${t}`, texto: `Tipo: ${ETIQUETA_TIPO[t]}`, quitar: { ...cajas, tipo: alternar(cajas.tipo, t, TIPOS) } })),
    ...cajas.confianza.map((n) => ({ clave: `c-${n}`, texto: `Certeza: ${ETIQUETA_NIVEL[n].toLowerCase()}`, quitar: { ...cajas, confianza: alternar(cajas.confianza, n, NIVELES) } })),
    ...cajas.autor.map((id) => ({ clave: `p-${id}`, texto: `Subido por: ${nombreAutor(id)}`, quitar: { ...cajas, autor: cajas.autor.filter((x) => x !== id) } })),
    ...(cajas.atencion ? [{ clave: 'atencion', texto: 'Requieren atención', quitar: { ...cajas, atencion: false } }] : []),
  ]
  const quitado = useRef<number | null>(null)
  const claves = chips.map((c) => c.clave).join('|')
  useEffect(() => {
    const i = quitado.current
    if (i === null) return
    quitado.current = null
    const botones = [...document.querySelectorAll<HTMLButtonElement>('.chips-cajas .chip button')]
    ;(botones[Math.min(i, botones.length - 1)] ?? document.getElementById('analisis-conteo'))?.focus()
  }, [claves])
  if (!chips.length) return null
  return (
    <div className="chips chips-cajas" role="region" aria-label="Cajas elegidas">
      <ul>
        {chips.map((c, i) => (
          <li key={c.clave} className="chip">
            <span>{c.texto}</span>
            <button
              type="button"
              aria-label={`Quitar ${c.texto}`}
              onClick={() => {
                quitado.current = i
                onCambiar(c.quitar)
              }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" className="icono">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
