import { getMe } from '../lib/api'
import { hrefDe, type Route } from '../lib/router'
import { useCarga } from '../lib/useCarga'

interface Props {
  ruta: Route
  esAdmin: boolean
  username: string
  onCerrarSesion: () => void
}

const SECCIONES: { ruta: Route; nombre: string; soloAdmin?: boolean }[] = [
  { ruta: 'resumen', nombre: 'Resumen' },
  { ruta: 'mapa', nombre: 'Mapa' },
  { ruta: 'analisis', nombre: 'Análisis' },
  { ruta: 'admin', nombre: 'Administración', soloAdmin: true },
]

export default function Encabezado({ ruta, esAdmin, username, onCerrarSesion }: Props) {
  const me = useCarga((signal) => getMe(signal), [])

  return (
    <header className="topbar topbar-app">
      <a className="brand" href={hrefDe('resumen')} aria-label="Sheets TT, ir al resumen">
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="currentColor" />
          <path d="M9 10h14M9 16h14M9 22h9" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        Sheets&nbsp;TT
      </a>
      <nav aria-label="Secciones" className="secciones">
        {SECCIONES.filter((s) => !s.soloAdmin || esAdmin).map((s) => (
          <a key={s.ruta} href={hrefDe(s.ruta)} aria-current={s.ruta === ruta ? 'page' : undefined}>
            {s.nombre}
          </a>
        ))}
      </nav>
      <div className="cuenta">
        <span className="cuenta-nombre" title={username}>
          {me.datos?.displayName ?? username}
        </span>
        <button type="button" className="btn btn-ghost btn-chico" onClick={onCerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
