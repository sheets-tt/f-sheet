import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LimiteError from './LimiteError'

let romper = true
function Pantalla() {
  if (romper) throw new RangeError('Invalid time value')
  return <h1>Pantalla bien</h1>
}

beforeEach(() => {
  romper = true
  window.location.hash = '#/analisis'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LimiteError', () => {
  it('muestra un aviso en vez de dejar la app en blanco, y "Volver a intentar" reintenta', async () => {
    const { rerender } = render(
      <LimiteError clave="a">
        <Pantalla />
      </LimiteError>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
    romper = false
    await userEvent.setup().click(screen.getByRole('button', { name: 'Volver a intentar' }))
    expect(screen.getByRole('heading', { name: 'Pantalla bien' })).toBeInTheDocument()
    rerender(
      <LimiteError clave="a">
        <Pantalla />
      </LimiteError>,
    )
  })

  it('"Ir a Resumen" navega, y cambiar de vista (clave) olvida el error', async () => {
    const { rerender } = render(
      <LimiteError clave="a">
        <Pantalla />
      </LimiteError>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ir a Resumen' }))
    expect(window.location.hash).toBe('#/')
    romper = false
    rerender(
      <LimiteError clave="b">
        <Pantalla />
      </LimiteError>,
    )
    expect(screen.getByRole('heading', { name: 'Pantalla bien' })).toBeInTheDocument()
  })
})
