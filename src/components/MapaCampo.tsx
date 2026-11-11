import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { circulo, type Limites, type LngLat } from '../lib/geo'
import type { Coleccion, Motor } from '../lib/motorMapa'
import { Forma, type Tono } from './Simbolo'

/** Un árbol o zona dibujado como botón sobre el mapa. */
export interface MarcaMapa {
  clave: string
  tipo: 'arbol' | 'zona'
  lngLat: LngLat
  tono: Tono
  nombre: string
  /** Nombre accesible: "Oyamel del lago (Abies religiosa): Infestado". */
  etiqueta: string
}

/** Zona de follaje con radio: círculo a escala real. */
export interface ZonaMapa {
  clave: string
  centro: LngLat
  radioMetros: number
  tono: Tono
}

/** Lugar donde se tomó una foto de análisis. */
export interface CapturaMapa {
  clave: string
  lngLat: LngLat
  tono: Tono
}

export interface ControlMapa {
  verTodo(): void
}

interface Props {
  /** Nombre del grupo para lectores de pantalla: "Mapa de campo: 3 árboles y 2 zonas". */
  nombre: string
  marcas: MarcaMapa[]
  zonas?: ZonaMapa[]
  capturas?: CapturaMapa[]
  /** Captura resaltada en el lienzo (por su clave). */
  capturaElegida?: string | null
  encuadre: Limites
  seleccion?: string | null
  /** Resaltada desde fuera (p. ej. al pasar por la lista). */
  resaltada?: string | null
  mostrarNombres?: boolean
  zoomMaximo?: number
  controles?: boolean
  className?: string
  onElegir?: (clave: string) => void
  onElegirCaptura?: (clave: string) => void
  ref?: Ref<ControlMapa>
}

function consulta(q: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(q).matches
}

function coleccionZonas(zonas: ZonaMapa[]): Coleccion {
  return {
    type: 'FeatureCollection',
    features: zonas.map((z) => ({
      type: 'Feature',
      properties: { clave: z.clave, tono: z.tono },
      geometry: { type: 'Polygon', coordinates: [circulo(z.centro, z.radioMetros)] },
    })),
  }
}

function coleccionCapturas(capturas: CapturaMapa[]): Coleccion {
  return {
    type: 'FeatureCollection',
    features: capturas.map((c) => ({
      type: 'Feature',
      properties: { clave: c.clave, tono: c.tono },
      geometry: { type: 'Point', coordinates: c.lngLat },
    })),
  }
}

/**
 * Mapa interactivo (MapLibre GL JS). Los árboles y zonas son <button> de verdad, colocados sobre
 * el mapa: se enfocan con Tab, tienen nombre accesible y se prueban como cualquier botón. Los
 * radios de las zonas y los puntos de captura van pintados en el lienzo.
 */
export default function MapaCampo({
  nombre,
  marcas,
  zonas = [],
  capturas = [],
  capturaElegida = null,
  encuadre,
  seleccion = null,
  resaltada = null,
  mostrarNombres = true,
  zoomMaximo,
  controles = true,
  className,
  onElegir,
  onElegirCaptura,
  ref,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [motor, setMotor] = useState<Motor | null>(null)
  const [fallo, setFallo] = useState(false)

  // Lo que el mapa necesita al crearse o al tocar el lienzo, sin recrearlo cuando cambia.
  const alTocar = useEffectEvent((capa: 'zonas' | 'capturas', clave: string) =>
    capa === 'zonas' ? onElegir?.(clave) : onElegirCaptura?.(clave),
  )
  const encuadreActual = useEffectEvent(() => encuadre)

  // Crear y destruir el motor con el componente.
  useEffect(() => {
    if (fallo || !contenedor.current) return
    let vivo = true
    let creado: Motor | null = null
    const nodo = contenedor.current
    // MapLibre se descarga aparte: la lista y los filtros ya se pueden usar mientras llega.
    import('../lib/motorMapa')
      .then(({ crearMotor, soportaWebGL }) => {
        if (!soportaWebGL()) throw new Error('Sin WebGL')
        return crearMotor(nodo, {
          limites: encuadreActual(),
          oscuro: consulta('(prefers-color-scheme: dark)'),
          sinMovimiento: consulta('(prefers-reduced-motion: reduce)'),
          zoomMaximoEncuadre: zoomMaximo,
          controles,
          alTocar: (capa, clave) => alTocar(capa, clave),
        })
      })
      .then((m) => {
        if (!vivo) return m.destruir()
        creado = m
        setMotor(m)
      })
      .catch(() => {
        if (vivo) setFallo(true)
      })
    return () => {
      vivo = false
      creado?.destruir()
      setMotor(null)
    }
  }, [fallo, zoomMaximo, controles])

  // El modo oscuro del sistema cambia los colores del mapa sin recrearlo.
  useEffect(() => {
    if (!motor || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const cambiar = () => motor.tema(mq.matches)
    mq.addEventListener('change', cambiar)
    return () => mq.removeEventListener('change', cambiar)
  }, [motor])

  useEffect(() => motor?.zonas(coleccionZonas(zonas)), [motor, zonas])
  useEffect(() => motor?.capturas(coleccionCapturas(capturas)), [motor, capturas])
  useEffect(() => motor?.resaltar('zonas', seleccion ?? resaltada), [motor, seleccion, resaltada])
  useEffect(() => motor?.resaltar('capturas', capturaElegida), [motor, capturaElegida])

  // Al elegir un punto, la cámara va hacia él.
  const elegida = marcas.find((m) => m.clave === seleccion)
  const destino = elegida?.lngLat.join(',')
  useEffect(() => {
    if (motor && destino) motor.volarA(destino.split(',').map(Number) as LngLat)
  }, [motor, destino])

  useImperativeHandle(ref, () => ({ verTodo: () => motor?.encuadrar(encuadre) }), [motor, encuadre])

  if (fallo) {
    return (
      <div className={`mapa-campo mapa-sin-webgl ${className ?? ''}`} role="note">
        <p>
          Este navegador no puede dibujar el mapa (necesita WebGL). Los mismos puntos están en la lista.
        </p>
      </div>
    )
  }

  return (
    <div className={`mapa-campo ${className ?? ''}`}>
      <div ref={contenedor} className="mapa-lienzo" role="group" aria-label={nombre} />
      {!motor && <div className="mapa-cargando hueso" aria-hidden="true" />}
      {motor &&
        marcas.map((m) => (
          <Marcador
            key={m.clave}
            motor={motor}
            marca={m}
            activa={m.clave === seleccion}
            resaltada={m.clave === resaltada}
            conNombre={mostrarNombres || m.clave === seleccion}
            onElegir={onElegir}
          />
        ))}
    </div>
  )
}

interface PropsMarca {
  marca: MarcaMapa
  activa: boolean
  resaltada: boolean
  conNombre: boolean
  onElegir?: (clave: string) => void
}

/** Un nodo DOM propio que MapLibre posiciona; React pinta el botón dentro (portal). */
function Marcador({ motor, ...props }: PropsMarca & { motor: Motor }) {
  const [nodo] = useState(() => {
    const div = document.createElement('div')
    div.className = 'marcador-nodo'
    return div
  })
  const [lon, lat] = props.marca.lngLat
  useEffect(() => motor.marcador(nodo, [lon, lat]), [motor, nodo, lon, lat])
  return createPortal(<BotonMarca {...props} />, nodo)
}

function BotonMarca({
  marca,
  activa,
  resaltada,
  conNombre,
  onElegir,
}: {
  marca: MarcaMapa
  activa: boolean
  resaltada: boolean
  conNombre: boolean
  onElegir?: (clave: string) => void
}) {
  const clase = ['marcador', `marcador-${marca.tipo}`, activa && 'activo', resaltada && 'resaltado']
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type="button"
      className={clase}
      aria-label={marca.etiqueta}
      aria-pressed={activa}
      title={marca.etiqueta}
      onClick={(e) => {
        // Que el clic no llegue al mapa (evita que también "toque" la zona de debajo).
        e.stopPropagation()
        onElegir?.(marca.clave)
      }}
    >
      <svg className="marcador-simbolo" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
        {marca.tipo === 'zona' && <circle className="marcador-anillo" r={10} />}
        <Forma tono={marca.tono} r={marca.tipo === 'arbol' ? 7 : 5} />
      </svg>
      {conNombre && (
        <span className="marcador-nombre" aria-hidden="true">
          {marca.nombre}
        </span>
      )}
    </button>
  )
}
