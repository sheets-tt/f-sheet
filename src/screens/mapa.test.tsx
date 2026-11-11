import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ANALISIS, conSesion, json, llamadasA, mockBackend } from '../test/backend'
import { motores } from '../test/motorFalso'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  sessionStorage.clear()
  window.location.hash = ''
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function abrir(hash: string) {
  window.location.hash = hash
  render(<App />)
}

/** El grupo del mapa, ya con sus marcadores puestos (el motor se crea de forma asíncrona). */
async function mapa() {
  const grupo = await screen.findByRole('group', { name: /^Mapa de campo/ })
  await within(grupo).findAllByRole('button')
  return grupo
}

function botonesDelMapa(grupo: HTMLElement): string[] {
  return within(grupo).queryAllByRole('button').map((b) => b.getAttribute('aria-label') ?? '')
}

describe('mapa interactivo', () => {
  it('dibuja el radio real de las zonas que lo tienen', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    await mapa()
    await waitFor(() => expect(motores.at(-1)?.zonas?.features).toHaveLength(1))
    const [zona] = motores.at(-1)!.zonas!.features
    expect(zona.properties).toEqual({ clave: 'z-c1', tono: 'neutro' })
  })

  it('elegir un punto lo deja en la URL y lleva la cámara hacia él', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const user = userEvent.setup()
    await user.click(within(await mapa()).getByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' }))
    expect(window.location.hash).toBe('#/mapa/a-b1')
    expect(screen.getByRole('region', { name: 'Oyamel del lago' })).toBeInTheDocument()
    expect(motores.at(-1)!.vuelos.at(-1)).toEqual([-99.1818, 19.4205])
    expect(within(await mapa()).getByRole('button', { name: /^Oyamel del lago/ })).toHaveAttribute('aria-pressed', 'true')
    // El foco pasa al detalle.
    expect(screen.getByRole('heading', { level: 2, name: 'Oyamel del lago' })).toHaveFocus()
  })

  it('abre directo con un punto elegido desde la URL', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa/z-c1')
    expect(await screen.findByRole('region', { name: 'Zona lago menor' })).toBeInTheDocument()
    // Abrir desde la URL no roba el foco.
    expect(screen.getByRole('heading', { level: 2, name: 'Zona lago menor' })).not.toHaveFocus()
  })

  it('el detalle lleva al seguimiento del árbol', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa/a-b1')
    const detalle = await screen.findByRole('region', { name: 'Oyamel del lago' })
    expect(within(detalle).getByRole('link', { name: 'Ver seguimiento del árbol' })).toHaveAttribute('href', '#/arbol/b1')
  })

  it('Esc y el botón de cerrar vuelven a la lista', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa/a-b3')
    const user = userEvent.setup()
    await screen.findByRole('region', { name: 'Pino del cerro' })
    await user.keyboard('{Escape}')
    expect(window.location.hash).toBe('#/mapa')
    expect(await screen.findByRole('list', { name: 'Puntos registrados' })).toBeInTheDocument()

    await user.click(within(await mapa()).getByRole('button', { name: /^Pino del cerro/ }))
    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('region', { name: 'Pino del cerro' })).not.toBeInTheDocument()
  })

  it('los filtros por estado y por tipo quitan puntos del mapa y de la lista', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const user = userEvent.setup()
    const grupo = await mapa()
    const estados = screen.getByRole('group', { name: 'Mostrar por estado' })

    const infestado = within(estados).getByRole('button', { name: /Infestado/ })
    expect(infestado).toHaveTextContent('2')
    await user.click(infestado)
    expect(infestado).toHaveAttribute('aria-pressed', 'false')
    expect(botonesDelMapa(grupo)).toHaveLength(3)
    expect(botonesDelMapa(grupo).some((n) => n.endsWith('Infestado'))).toBe(false)
    expect(screen.getByText('3 de 5 con estos filtros')).toBeInTheDocument()

    await user.click(within(screen.getByRole('group', { name: 'Mostrar por tipo' })).getByRole('button', { name: /Zonas/ }))
    expect(botonesDelMapa(grupo).sort()).toEqual([
      'Ahuehuete de la calzada (Taxodium mucronatum): Sano',
      'Pino del cerro (Pinus hartwegii): Sin análisis',
    ])
    expect(within(screen.getByRole('list', { name: 'Puntos registrados' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('la búsqueda ignora acentos y Enter elige el primer resultado', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const user = userEvent.setup()
    await mapa()
    const buscar = screen.getByRole('searchbox', { name: 'Buscar árbol o zona' })
    await user.type(buscar, 'ahuehuete')
    expect(within(screen.getByRole('list', { name: 'Puntos registrados' })).getAllByRole('listitem')).toHaveLength(1)
    await user.clear(buscar)
    await user.type(buscar, 'pinus{Enter}')
    expect(window.location.hash).toBe('#/mapa/a-b3')
    expect(screen.getByRole('region', { name: 'Pino del cerro' })).toBeInTheDocument()
  })

  it('pasar por la lista resalta la zona en el mapa', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const user = userEvent.setup()
    await mapa()
    const lista = screen.getByRole('list', { name: 'Puntos registrados' })
    await user.hover(within(lista).getByRole('button', { name: /Zona lago menor/ }))
    expect(motores.at(-1)!.resaltado.zonas).toBe('z-c1')
  })

  it('el panel muestra solo los 5 análisis más recientes', async () => {
    conSesion()
    const muchos = Array.from({ length: 7 }, (_, i) => ({ ...ANALISIS[4], id: `x${i}` }))
    mockBackend(fetchMock, { '/analisis': json(200, muchos) })
    abrir('#/mapa/a-b1')
    const detalle = await screen.findByRole('region', { name: 'Oyamel del lago' })
    await waitFor(() => expect(within(detalle).getAllByRole('listitem')).toHaveLength(5))
    expect(detalle).toHaveTextContent('Se muestran los 5 más recientes de 7')
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?arbol=b1&limite=50'])
  })
})
