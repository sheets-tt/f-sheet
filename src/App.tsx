import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Encabezado from './components/Encabezado'
import { EsqueletoPagina } from './components/Esqueleto'
import Galeria, { Marca } from './components/Galeria'
import LimiteError from './components/LimiteError'
import { logout, SESION_TERMINADA, setUnauthorizedHandler } from './lib/api'
import { esAdministrador, loadSession, type Session } from './lib/session'
import { navigate, useConsulta, useRoute, useRutaId, type Route } from './lib/router'

// Cada pantalla en su propio chunk: el login no descarga el plano ni las tablas, y viceversa.
const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const ResumenScreen = lazy(() => import('./screens/ResumenScreen'))
const MapaScreen = lazy(() => import('./screens/MapaScreen'))
const AnalisisScreen = lazy(() => import('./screens/AnalisisScreen'))
// D3 solo viaja en este chunk: el resto de la app no lo descarga.
const GraficosScreen = lazy(() => import('./screens/GraficosScreen'))
const AdminScreen = lazy(() => import('./screens/AdminScreen'))
const SeguimientoScreen = lazy(() => import('./screens/SeguimientoScreen'))

/** Guardia de rutas: sin sesión → login; con sesión, login → resumen; admin solo para ADMINISTRADOR. */
function destino(ruta: Route, session: Session | null): Route {
  if (!session) return 'login'
  if (ruta === 'login') return 'resumen'
  if (ruta === 'admin' && !esAdministrador(session)) return 'resumen'
  return ruta
}

export default function App() {
  const route = useRoute()
  const rutaId = useRutaId()
  const consulta = useConsulta()
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [notice, setNotice] = useState<string | null>(null)
  // Correo para rellenar el login (tras cambiar el propio correo en Administración).
  const [usuarioSugerido, setUsuarioSugerido] = useState('')

  const handleSignedOut = useCallback((message: string | null, usuario = '') => {
    setSession(null)
    setNotice(message)
    setUsuarioSugerido(usuario)
    navigate('login', { replace: true })
  }, [])

  // 401 en cualquier petición autenticada → vuelta a login con aviso.
  useEffect(() => {
    setUnauthorizedHandler(() => handleSignedOut(SESION_TERMINADA))
    return () => setUnauthorizedHandler(null)
  }, [handleSignedOut])

  const target = destino(route, session)
  useEffect(() => {
    if (route !== target) navigate(target, { replace: true })
  }, [route, target])

  const handleLoggedIn = useCallback((s: Session) => {
    setNotice(null)
    setSession(s)
    navigate('resumen', { replace: true })
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    handleSignedOut('Has cerrado sesión.')
  }, [handleSignedOut])

  // b-sheet invalida el token al cambiar el correo de la cuenta: se cierra la sesión aquí, con aviso,
  // antes de que la siguiente petición falle con 401 y se pierda lo que se estaba haciendo.
  const handleCorreoPropioCambiado = useCallback(
    (correo: string) => {
      logout()
      handleSignedOut(`Correo actualizado. Inicia sesión con ${correo}.`, correo)
    },
    [handleSignedOut],
  )

  const fallback = <EsqueletoPagina />

  if (!session) {
    return (
      <div className="acceso">
        <a className="skip-link" href="#main">Saltar al contenido</a>
        {/* El único momento animado sin que nadie lo pida: la galería se excava al llegar. */}
        <aside className="acceso-arte" aria-label="Sheets TT">
          <Galeria animada className="acceso-galeria" />
          <span className="brand brand-claro">
            <Marca />
            Sheets&nbsp;TT
          </span>
          <div className="acceso-texto">
            <p className="acceso-titular">Sanidad del bosque, árbol por árbol.</p>
            <p className="acceso-bajada">
              Los análisis de corteza y follaje que el equipo captura en campo con la app móvil, en un solo lugar.
            </p>
          </div>
        </aside>
        <main id="main" className="acceso-main">
          <Suspense fallback={fallback}>
            {route === target && <LoginScreen onLoggedIn={handleLoggedIn} notice={notice} usuarioInicial={usuarioSugerido} />}
          </Suspense>
        </main>
      </div>
    )
  }

  return (
    <div className="shell shell-app">
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <Encabezado
        ruta={target}
        esAdmin={esAdministrador(session)}
        username={session.username}
        onCerrarSesion={handleLogout}
      />
      <main id="main" className="main main-app" tabIndex={-1}>
        {/* Un error al dibujar una pantalla no deja la app en blanco; cambiar de vista lo reinicia. */}
        <LimiteError clave={`${target}|${rutaId ?? ''}|${consulta}`}>
        <Suspense fallback={fallback}>
          {route === target && (
            <>
              {target === 'resumen' && <ResumenScreen />}
              {target === 'mapa' && <MapaScreen />}
              {target === 'analisis' && <AnalisisScreen />}
              {target === 'graficos' && <GraficosScreen />}
              {target === 'admin' && <AdminScreen username={session.username} onCorreoPropioCambiado={handleCorreoPropioCambiado} />}
              {(target === 'arbol' || target === 'zona') && rutaId && (
                <SeguimientoScreen key={`${target}-${rutaId}`} tipo={target} id={rutaId} />
              )}
            </>
          )}
        </Suspense>
        </LimiteError>
      </main>
    </div>
  )
}
