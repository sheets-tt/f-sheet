import { Component, type ErrorInfo, type ReactNode } from 'react'
import { navigate } from '../lib/router'

interface Props {
  /** Cambia con la ruta: al navegar a otra vista, el error anterior se olvida. */
  clave: string
  children: ReactNode
}

interface State {
  error: Error | null
  clave: string
}

/**
 * Si una pantalla lanza al dibujarse, se muestra este aviso en su lugar en vez de dejar la app en
 * blanco: el encabezado y la navegación siguen ahí.
 */
export default class LimiteError extends Component<Props, State> {
  state: State = { error: null, clave: this.props.clave }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.clave !== state.clave ? { error: null, clave: props.clave } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en la pantalla', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="pagina">
        <section className="panel error-pantalla" role="alert" aria-labelledby="titulo-error">
          <h1 id="titulo-error">Algo salió mal</h1>
          <p className="muted">Esta sección no se pudo mostrar. Puedes volver a intentarlo o ir al resumen.</p>
          <div className="error-acciones">
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
              Volver a intentar
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('resumen')}>
              Ir a Resumen
            </button>
          </div>
        </section>
      </div>
    )
  }
}
