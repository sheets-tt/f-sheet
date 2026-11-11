import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Galeria, { trazosGaleria } from './Galeria'

describe('Galeria', () => {
  it('es determinista: misma semilla, mismo dibujo', () => {
    expect(trazosGaleria(10, 3)).toEqual(trazosGaleria(10, 3))
    expect(trazosGaleria(10, 3)).not.toEqual(trazosGaleria(10, 4))
  })

  it('dibuja una galería larvaria con su cámara por rama y no se anuncia', () => {
    const { container } = render(<Galeria ramas={6} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelectorAll('.galeria-larva')).toHaveLength(6)
    expect(svg.querySelectorAll('.galeria-pupa')).toHaveLength(6)
    expect(svg.querySelectorAll('.galeria-madre')).toHaveLength(1)
  })
})
