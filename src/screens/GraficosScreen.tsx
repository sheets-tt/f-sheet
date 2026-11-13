import { utcDay } from 'd3-time'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type RefObject } from 'react'
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
  NOMBRE_INTERVALO,
  normalizarFiltros,
  esDia,
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
import { consultaDe, fijarConsulta, hrefDe, navigate, useConsulta } from '../lib/router'
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
  const datos = useMemo(() => dominioDatos(analisis), [analisis])
  const nombres = useMemo(() => nombresDeLugares(arboles, zonas), [arboles, zonas])
  // Lo que llega en la URL se acota a los datos (rango, árbol o zona que existan) antes de dibujar.
  const filtros = useMemo(() => {
    const leidos = leerFiltros(consulta)
    return datos ? normalizarFiltros(leidos, datos, new Set(nombres.keys())) : leidos
  }, [consulta, datos, nombres])

  // Y la URL se reescribe (sin paso nuevo en el historial) si traía algo inválido o fuera de rango.
  // Si el rango pedido no tocaba ningún día con datos, se avisa en la URL ya reescrita.
  // (Se guarda la URL canónica a la que aplica: en cuanto la vista cambia, el aviso se va.)
  const descarteDe = (q: string) =>
    datos && rangoFueraDeDatos(leerFiltros(q), datos) ? escribirFiltros(normalizarFiltros(leerFiltros(q), datos, new Set(nombres.keys()))).toString() : null
  const [descartado, setDescartado] = useState<string | null>(() => descarteDe(consulta))
  const [consultaPrevia, setConsultaPrevia] = useState(consulta)
  if (consultaPrevia !== consulta) {
    setConsultaPrevia(consulta)
    const d = descarteDe(consulta)
    // Solo sigue mientras la URL sea la que dejó el descarte; cualquier otra vista lo quita (y
    // volver después a "todo" con Restablecer o Alejar ya no lo trae de vuelta).
    if (d !== null) setDescartado(d)
    else if (consulta !== descartado) setDescartado(null)
  }
  useEffect(() => {
    const canonica = escribirFiltros(filtros).toString()
    if (canonica !== consulta) fijarConsulta(new URLSearchParams(canonica), { replace: true })
  }, [filtros, consulta])

  if (!datos) {
    return (
      <section className="panel grafica-vacia">
        <p>Aún no hay análisis. Las gráficas aparecen en cuanto la app móvil sincronice las primeras capturas.</p>
      </section>
    )
  }
  return (
    <Vista
      analisis={analisis}
      arboles={arboles}
      zonas={zonas}
      filtros={filtros}
      datos={datos}
      nombres={nombres}
      rangoDescartado={descartado !== null && descartado === consulta}
    />
  )
}

/** El rango pedido en la URL no toca ningún día con datos (por eso se descarta). */
function rangoFueraDeDatos(f: Filtros, datos: Dominio): boolean {
  if (!f.desde && !f.hasta) return false
  const d0 = f.desde ? diaAPared(f.desde) : datos[0]
  const d1 = f.hasta ? utcDay.offset(diaAPared(f.hasta), 1) : datos[1]
  return d1 <= datos[0] || d0 >= datos[1] || d1 <= d0
}

interface VistaProps extends Datos {
  filtros: Filtros
  datos: Dominio
  nombres: Map<string, string>
  rangoDescartado: boolean
}

type Campo = 'desde' | 'hasta'
type Mover = Parameters<typeof moverDominio>[2]

function Vista({ analisis, arboles, zonas, filtros, datos, nombres, rangoDescartado }: VistaProps) {
  const visible = useMemo(() => dominioVisible(filtros, datos), [filtros, datos])
  const intervalo = intervaloPara(visible)
  const conRango = filtros.desde !== null || filtros.hasta !== null
  const lugaresValidos = useMemo(() => new Set(nombres.keys()), [nombres])

  // Una fecha escrita y confirmada por un clic en otro control (ver alPresionar) espera aquí para
  // salir en el mismo paso del historial que ese clic.
  const pendiente = useRef<Partial<Filtros> | null>(null)
  const yaConfirmado = useRef<HTMLInputElement | null>(null)

  /**
   * Todo cambio parte de la URL de este instante (más la fecha pendiente), no de los filtros con
   * que se dibujó la pantalla: si una fecha se confirmó en este mismo clic, no se pierde.
   * Cada cambio es un paso del historial (Atrás lo deshace) y la URL se puede compartir.
   */
  function aplicar(cambio: (actual: Filtros) => Partial<Filtros>) {
    const actual = { ...normalizarFiltros(leerFiltros(consultaDe(window.location.hash)), datos, lugaresValidos), ...pendiente.current }
    pendiente.current = null
    fijarConsulta(escribirFiltros({ ...actual, ...cambio(actual) }))
  }
  const cambiar = (parcial: Partial<Filtros>) => aplicar(() => parcial)
  const fijarRango = (d: Dominio | null) => aplicar(() => (d ? rangoDe(d, datos) : { desde: null, hasta: null }))
  const mover = (accion: Mover) => aplicar((f) => rangoDe(moverDominio(dominioVisible(f, datos), datos, accion), datos))
  const quitarTodo = () => aplicar(() => SIN_FILTROS)
  const quitarSeleccion = () => cambiar({ resultado: null, tipo: null, lugar: null, confianza: null })

  // ---- Fechas: se aplican al confirmar (salir del campo o Enter), no en cada tecla ----------
  // Escribir el año pasa por 0002, 0020, 0202…: cada uno sería un rango absurdo y un paso más.
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({})
  const desdeRef = useRef<HTMLInputElement>(null)
  const hastaRef = useRef<HTMLInputElement>(null)
  const min = claveDia(datos[0])
  const max = claveDia(utcDay.offset(datos[1], -1))
  const aplicado: Record<Campo, string> = { desde: claveDia(visible[0]), hasta: claveDia(utcDay.offset(visible[1], -1)) }

  // Los campos no son controlados (el navegador guarda lo que se escribe). "Sucio" = la persona
  // escribió algo que aún no se confirma. Un campo limpio siempre muestra el rango aplicado, aunque
  // tenga el foco (Atrás, el intercambio de extremos, botones, pincel); uno sucio no se toca.
  const sucio = useRef<Record<Campo, boolean>>({ desde: false, hasta: false })
  // Se sincroniza en cada render y en cada cambio de hash: si dos cambios de hash llegan juntos
  // (Enter y enseguida Atrás), React puede no volver a dibujar, y el valor viejo se quedaría.
  useEffect(() => {
    const sincronizar = () => {
      const vista = dominioVisible(normalizarFiltros(leerFiltros(consultaDe(window.location.hash)), datos, lugaresValidos), datos)
      const valores: Record<Campo, string> = { desde: claveDia(vista[0]), hasta: claveDia(utcDay.offset(vista[1], -1)) }
      for (const [ref, c] of [
        [desdeRef, 'desde'],
        [hastaRef, 'hasta'],
      ] as const) {
        if (ref.current && !sucio.current[c] && ref.current.value !== valores[c]) ref.current.value = valores[c]
      }
    }
    sincronizar()
    window.addEventListener('hashchange', sincronizar)
    window.addEventListener('popstate', sincronizar)
    return () => {
      window.removeEventListener('hashchange', sincronizar)
      window.removeEventListener('popstate', sincronizar)
    }
  })

  /** Lo que significa el valor escrito: nada que cambiar, un error, o el cambio de rango. */
  function evaluar(campo: Campo, valor: string): 'igual' | 'error' | Partial<Filtros> {
    // Lo que no escribió la persona no se aplica (un valor viejo que quedó en el campo, por ejemplo).
    if (!sucio.current[campo] || valor === aplicado[campo]) return 'igual'
    if (!valor) return { [campo]: null }
    if (!esDia(valor) || valor < min || valor > max) return 'error'
    const actual = dominioVisible({ ...normalizarFiltros(leerFiltros(consultaDe(window.location.hash)), datos, lugaresValidos), ...pendiente.current }, datos)
    const otro = campo === 'desde' ? claveDia(utcDay.offset(actual[1], -1)) : claveDia(actual[0])
    // Si quedan al revés, se intercambian (nunca un rango vacío).
    const [a, b] = campo === 'desde' ? [valor, otro] : [otro, valor]
    const [d0, d1] = a <= b ? [a, b] : [b, a]
    return rangoDe([diaAPared(d0), utcDay.offset(diaAPared(d1), 1)], datos)
  }

  function confirmarFecha(campo: Campo, input: HTMLInputElement, diferir = false) {
    const r = evaluar(campo, input.value)
    sucio.current[campo] = false
    if (r === 'igual') {
      input.value = aplicado[campo]
      return setErrores((e) => ({ ...e, [campo]: undefined }))
    }
    if (r === 'error') {
      setErrores((e) => ({ ...e, [campo]: `Elige una fecha entre el ${formatoDia(datos[0])} y el ${formatoDia(utcDay.offset(datos[1], -1))}.` }))
      input.value = aplicado[campo]
      return
    }
    // Una fecha válida corrige este campo y deja sin efecto el aviso del otro.
    setErrores({})
    if (!diferir) return aplicar(() => r)
    pendiente.current = { ...pendiente.current, ...r }
    // Si el clic no lo consume ningún control (o no llega), la fecha sale sola.
    const salir = () => {
      window.removeEventListener('click', salir)
      window.removeEventListener('pointercancel', salir)
      if (pendiente.current) aplicar(() => ({}))
    }
    window.addEventListener('click', salir)
    window.addEventListener('pointercancel', salir)
  }

  /**
   * Al presionar otro control con una fecha a medio confirmar, el blur llegaría antes que el clic y
   * serían dos pasos del historial (y el clic, con filtros viejos). Aquí la fecha se confirma como
   * pendiente y el clic la incluye en su propio cambio.
   */
  function alPresionar() {
    const activo = document.activeElement
    if (activo !== desdeRef.current && activo !== hastaRef.current) return
    const input = activo as HTMLInputElement
    yaConfirmado.current = input
    confirmarFecha(input === desdeRef.current ? 'desde' : 'hasta', input, true)
  }

  const fechas = {
    errores,
    min,
    max,
    aplicado,
    desdeRef,
    hastaRef,
    alSalir: (campo: Campo, input: HTMLInputElement) => {
      if (yaConfirmado.current === input) {
        yaConfirmado.current = null
        return
      }
      confirmarFecha(campo, input)
    },
    alEnter: (campo: Campo, input: HTMLInputElement) => confirmarFecha(campo, input),
    alEscribir: (campo: Campo) => {
      sucio.current[campo] = true
    },
  }

  // Datos de cada gráfica: todos los filtros menos los de su propia dimensión (crossfilter).
  const tiempo = useMemo(
    () => serieTiempo(filtrar(analisis, filtros, ['resultado']), visible, intervalo, nombres),
    [analisis, filtros, visible, intervalo, nombres],
  )
  const general = useMemo(
    () => ({ dominio: datos, dias: serieTiempo(filtrar(analisis, filtros, ['tiempo', 'resultado']), datos, intervaloPara(datos), nombres) }),
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

  // Al quitar un chip su botón desaparece: el foco pasa al chip siguiente (o al anterior si era el
  // último), a "Quitar todo", o al texto del rango si ya no queda ninguno.
  const chipQuitado = useRef<number | null>(null)
  const clavesChips = chips.map((c) => c.clave).join('|')
  function quitarChip(indice: number, quitar: Partial<Filtros>) {
    chipQuitado.current = indice
    if (quitar === SIN_FILTROS) quitarTodo()
    else cambiar(quitar)
  }
  useEffect(() => {
    const i = chipQuitado.current
    if (i === null) return
    chipQuitado.current = null
    const botones = [...(document.querySelectorAll<HTMLButtonElement>('.chips .chip button'))]
    const destino =
      botones[Math.min(i, botones.length - 1)] ??
      document.querySelector<HTMLButtonElement>('.chips > .enlace') ??
      document.querySelector<HTMLElement>('.rango-texto')
    destino?.focus()
  }, [clavesChips])

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
    <div className="graficos" onKeyDown={onKeyDown} onPointerDownCapture={alPresionar}>
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
        mover={mover}
        fechas={fechas}
      />

      {rangoDescartado && (
        <p className="notice" role="status">
          El rango pedido no tiene análisis; se muestra todo.
        </p>
      )}

      {chips.length > 0 && (
        <div className="chips" role="region" aria-label="Filtros activos">
          <ul>
            {chips.map((c, i) => (
              <li key={c.clave} className="chip">
                <span>{c.texto}</span>
                <button type="button" aria-label={`Quitar ${c.texto}`} onClick={() => quitarChip(i, c.quitar)}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" className="icono">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="enlace" onClick={() => quitarChip(chips.length, SIN_FILTROS)}>
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

interface Fechas {
  errores: Partial<Record<Campo, string>>
  min: string
  max: string
  aplicado: Record<Campo, string>
  desdeRef: RefObject<HTMLInputElement | null>
  hastaRef: RefObject<HTMLInputElement | null>
  alSalir: (campo: Campo, input: HTMLInputElement) => void
  alEnter: (campo: Campo, input: HTMLInputElement) => void
  alEscribir: (campo: Campo) => void
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
  mover: (a: Mover) => void
  fechas: Fechas
}

/** Una fila sobre las gráficas: rango (fechas y botones), tipo y lugar. */
function FilaFiltros({ filtros, datos, visible, intervalo, conRango, arboles, zonas, cambiar, fijarRango, mover, fechas }: FilaProps) {
  const todo = !conRango
  const dias = utcDay.count(visible[0], visible[1])
  const rangoTexto = useRef<HTMLParagraphElement>(null)
  const claveRango = `${claveDia(visible[0])}|${claveDia(visible[1])}`
  // El botón de rango recién usado y el rango que había al usarlo.
  const usado = useRef<{ boton: HTMLButtonElement; rango: string } | null>(null)

  /** Si el botón usado queda deshabilitado (Restablecer, o Siguiente en el borde), el foco no cae al <body>. */
  function accionRango(e: MouseEvent<HTMLButtonElement>, accion: () => void) {
    usado.current = { boton: e.currentTarget, rango: claveRango }
    accion()
  }
  // Se revisa cuando el rango nuevo ya está dibujado (el cambio de hash llega en otra tarea).
  useEffect(() => {
    const u = usado.current
    if (!u || u.rango === claveRango) return
    usado.current = null
    const foco = document.activeElement
    if (u.boton.disabled && (foco === u.boton || foco === document.body || foco === null)) rangoTexto.current?.focus()
  }, [claveRango])

  const campo = (c: Campo) => {
    const error = fechas.errores[c]
    return (
      <div className="field">
        <label htmlFor={`g-${c}`}>{c === 'desde' ? 'Desde' : 'Hasta'}</label>
        {/* Sin control y con clave fija: el navegador guarda lo que se escribe y el foco no se pierde
            al aplicar; el valor se sincroniza desde Vista cuando el campo no tiene el foco. */}
        <input
          id={`g-${c}`}
          ref={c === 'desde' ? fechas.desdeRef : fechas.hastaRef}
          type="date"
          min={fechas.min}
          max={fechas.max}
          defaultValue={fechas.aplicado[c]}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `g-${c}-error` : undefined}
          onChange={() => fechas.alEscribir(c)}
          onBlur={(e) => fechas.alSalir(c, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              fechas.alEnter(c, e.currentTarget)
            }
          }}
        />
        {error && (
          <p className="field-error" id={`g-${c}-error`} role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form className="filtros panel filtros-graficos" aria-label="Filtros de las gráficas" onSubmit={(e) => e.preventDefault()}>
      {campo('desde')}
      {campo('hasta')}
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
        <p className="rango-texto" aria-live="polite" tabIndex={-1} ref={rangoTexto}>
          {formatoDia(visible[0])} – {formatoDia(utcDay.offset(visible[1], -1))} · por {NOMBRE_INTERVALO[intervalo]}
        </p>
        <div className="botones-rango" role="group" aria-label="Rango de fechas">
          <button type="button" className="btn btn-ghost btn-chico" onClick={(e) => accionRango(e, () => mover('anterior'))} disabled={visible[0] <= datos[0]}>
            Anterior
          </button>
          <button type="button" className="btn btn-ghost btn-chico" onClick={(e) => accionRango(e, () => mover('acercar'))} disabled={dias <= 1}>
            Acercar
          </button>
          <button type="button" className="btn btn-ghost btn-chico" onClick={(e) => accionRango(e, () => mover('alejar'))} disabled={todo}>
            Alejar
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-chico"
            onClick={(e) => accionRango(e, () => mover('siguiente'))}
            disabled={visible[1] >= datos[1]}
          >
            Siguiente
          </button>
          <button type="button" className="btn btn-secondary btn-chico" onClick={(e) => accionRango(e, () => fijarRango(null))} disabled={todo}>
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
