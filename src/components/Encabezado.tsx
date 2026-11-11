import { getMe } from '../lib/api'
import { hrefDe, type Route } from '../lib/router'
import { useCarga } from '../lib/useCarga'
import { Marca } from './Galeria'

interface Props {
  ruta: Route
  esAdmin: boolean
  username: string
  onCerrarSesion: () => void
}

/** Íconos de trazo (24×24, currentColor). Decorativos: el texto del enlace dice la sección. */
const ICONOS: Record<Route, string> = {
  login: '',
  resumen: 'M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z',
  mapa: 'M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  analisis: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
  arbol: '',
  zona: '',
  admin: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3 3 3 6',
}

const SECCIONES: { ruta: Route; nombre: string; soloAdmin?: boolean }[] = [
  { ruta: 'resumen', nombre: 'Resumen' },
  { ruta: 'mapa', nombre: 'Mapa' },
  { ruta: 'analisis', nombre: 'Análisis' },
  { ruta: 'admin', nombre: 'Administración', soloAdmin: true },
]

/** El seguimiento de un árbol o zona se llega desde el mapa: el menú marca Mapa. */
function seccionDe(ruta: Route): Route {
  return ruta === 'arbol' || ruta === 'zona' ? 'mapa' : ruta
}

function iniciales(nombre: string): string {
  const partes = nombre.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '·'
}

export default function Encabezado({ ruta, esAdmin, username, onCerrarSesion }: Props) {
  const me = useCarga((signal) => getMe(signal), [])
  const nombre = me.datos?.displayName ?? username

  return (
    <header className="riel">
      <a className="brand" href={hrefDe('resumen')} aria-label="Sheets TT, ir al resumen">
        <Marca />
        <span className="brand-texto">Sheets&nbsp;TT</span>
      </a>
      <nav aria-label="Secciones" className="secciones">
        {SECCIONES.filter((s) => !s.soloAdmin || esAdmin).map((s) => (
          <a key={s.ruta} href={hrefDe(s.ruta)} aria-current={seccionDe(ruta) === s.ruta ? 'page' : undefined}>
            <svg className="icono" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d={ICONOS[s.ruta]} />
            </svg>
            <span>{s.nombre}</span>
          </a>
        ))}
      </nav>
      <div className="cuenta">
        <span className="avatar" aria-hidden="true">{iniciales(nombre)}</span>
        <span className="cuenta-nombre" title={username}>
          {nombre}
        </span>
        <button type="button" className="btn btn-riel btn-chico" onClick={onCerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
