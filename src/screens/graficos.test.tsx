import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { conSesion, json, llamadasA, mockBackend } from '../test/backend'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  sessionStorage.clear()
  window.location.hash = ''
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  conSesion()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function abrir(hash = '#/graficos', rutas: Parameters<typeof mockBackend>[1] = {}) {
  mockBackend(fetchMock, rutas)
  window.location.hash = hash
  render(<App />)
  await screen.findByRole('heading', { level: 2, name: 'Análisis en el tiempo' })
  return userEvent.setup()
}

const consulta = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '')
const grafica = (nombre: RegExp) => screen.getByRole('group', { name: nombre })

describe('Gráficos', () => {
  it('un experto la ve en el menú; pide los análisis (máx. 500), árboles y zonas', async () => {
    await abrir()
    expect(within(screen.getByRole('navigation', { name: 'Secciones' })).getByRole('link', { name: 'Gráficos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?limite=500'])
    expect(llamadasA(fetchMock, '/arboles')).toHaveLength(1)
    expect(llamadasA(fetchMock, '/zonas')).toHaveLength(1)
  })

  it('cada gráfica resume sus datos en su nombre accesible', async () => {
    await abrir()
    expect(grafica(/^Análisis por día: 5 análisis en 6 periodos; el máximo, 1 el 3 oct 2026\.$/)).toBeInTheDocument()
    expect(grafica(/^Confianza de 5 análisis en decenas; la más frecuente, 90–100 % con 2\.$/)).toBeInTheDocument()
    expect(grafica(/^Análisis por árbol y zona: 4 lugares con análisis de 5; el que más, Zona lago menor con 2\.$/)).toBeInTheDocument()
    expect(grafica(/^Mapa de calor de 5 lugares por 6 periodos: 5 celdas con análisis; máximo 1 en una celda\.$/)).toBeInTheDocument()
    const indicadores = screen.getByRole('list', { name: 'Indicadores de la selección' })
    expect(within(indicadores).getByText('Análisis').nextSibling).toHaveTextContent('5')
  })

  it('las flechas recorren las barras (una sola parada de Tab) y Enter acerca a ese día', async () => {
    const user = await abrir()
    const tiempo = grafica(/^Análisis por día/)
    const barras = within(tiempo).getAllByRole('button')
    expect(barras).toHaveLength(6)
    expect(barras.filter((b) => b.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(barras[0]).toHaveAccessibleName(/^3 oct 2026: 1 análisis\. Infestado 1 \(100 %\)\. Confianza media 91 %\. Oyamel del lago\.$/)

    barras[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(barras[1]).toHaveFocus()
    expect(barras[1]).toHaveAttribute('tabindex', '0')
    await user.keyboard('{End}')
    expect(barras[5]).toHaveFocus()
    await user.keyboard('{Home}{ArrowRight}{Enter}')
    await waitFor(() => expect(consulta().get('desde')).toBe('2026-10-04'))
    expect(consulta().get('hasta')).toBe('2026-10-04')
    // El rango queda como chip y se puede restablecer.
    expect(await screen.findByText('Del 4 oct 2026 al 4 oct 2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Restablecer' }))
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
  })

  it('el foco en una marca muestra el tooltip con el detalle', async () => {
    await abrir()
    const barra = within(grafica(/^Análisis por día/)).getAllByRole('button')[4]
    barra.focus()
    await waitFor(() => expect(document.querySelector('.tooltip-rico')).not.toBeNull())
    const tooltip = document.querySelector('.tooltip-rico')!
    expect(tooltip).toHaveAttribute('aria-hidden', 'true')
    expect(tooltip).toHaveTextContent('7 oct 2026')
    expect(tooltip).toHaveTextContent('No determinado: 1 (100 %)')
    expect(tooltip).toHaveTextContent('Confianza media: 42 %')
    expect(tooltip).toHaveTextContent('Zona lago menor')
  })

  it('elegir un resultado en la leyenda filtra las demás gráficas; Esc lo quita', async () => {
    const user = await abrir()
    await user.click(screen.getByRole('button', { name: 'Infestado', pressed: false }))
    await waitFor(() => expect(consulta().get('resultado')).toBe('infestado'))
    expect(screen.getByRole('button', { name: 'Infestado', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Resultado: Infestado')).toBeInTheDocument()
    expect(grafica(/^Confianza de 2 análisis/)).toBeInTheDocument()
    expect(grafica(/^Análisis por árbol y zona: 2 lugares con análisis/)).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: 'Análisis de la selección' })).getAllByRole('row')).toHaveLength(3)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(consulta().get('resultado')).toBeNull())
    expect(screen.queryByRole('region', { name: 'Filtros activos' })).not.toBeInTheDocument()
  })

  it('una barra de lugar abre su seguimiento', async () => {
    const user = await abrir()
    const lugar = within(grafica(/^Análisis por árbol y zona/)).getByRole('link', { name: /^Oyamel del lago \(árbol\)/ })
    lugar.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(window.location.hash).toBe('#/arbol/b1'))
  })

  it('una celda del mapa de calor filtra por su lugar y el chip lo quita', async () => {
    const user = await abrir()
    const calor = grafica(/^Mapa de calor/)
    await user.click(within(calor).getByRole('button', { name: /^Zona lago menor, 4 oct 2026: 1 análisis/ }))
    await waitFor(() => expect(consulta().get('zona')).toBe('c1'))
    expect(screen.getByRole('list', { name: 'Indicadores de la selección' })).toHaveTextContent('Análisis2')
    await user.click(screen.getByRole('button', { name: 'Quitar Zona: Zona lago menor' }))
    await waitFor(() => expect(consulta().get('zona')).toBeNull())
  })

  it('el mapa de calor se recorre como rejilla', async () => {
    const user = await abrir()
    const celdas = within(grafica(/^Mapa de calor/)).getAllByRole('button')
    expect(celdas).toHaveLength(5 * 6)
    celdas[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(celdas[6]).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(celdas[8]).toHaveFocus()
    await user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(celdas[1]).toHaveFocus()
  })

  it('una barra de confianza filtra por su decena', async () => {
    const user = await abrir()
    await user.click(within(grafica(/^Confianza de/)).getByRole('button', { name: /^Confianza 90–100 %: 2 análisis/ }))
    await waitFor(() => expect(consulta().get('confianza')).toBe('9'))
    const filas = within(screen.getByRole('table', { name: 'Análisis de la selección' })).getAllByRole('row')
    expect(filas).toHaveLength(3)
    expect(within(filas[1]).getByRole('link')).toHaveTextContent('Zona lago menor')
  })

  it('la vista se puede abrir desde la URL', async () => {
    await abrir('#/graficos?tipo=follaje&zona=c1&desde=2026-10-04&hasta=2026-10-07')
    expect(screen.getByText('Tipo: Follaje')).toBeInTheDocument()
    expect(screen.getByText('Zona: Zona lago menor')).toBeInTheDocument()
    expect(screen.getByText('Del 4 oct 2026 al 7 oct 2026')).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-10-04')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-10-07')
    expect(screen.getByLabelText('Tipo')).toHaveValue('follaje')
    expect(grafica(/^Análisis por día: 2 análisis en 4 periodos/)).toBeInTheDocument()
  })

  it('las fechas y los botones mueven el rango', async () => {
    const user = await abrir()
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Acercar' }))
    await waitFor(() => expect(consulta().get('desde')).toBe('2026-10-04'))
    expect(consulta().get('hasta')).toBe('2026-10-06')
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(consulta().get('desde')).toBe('2026-10-06'))
    expect(consulta().get('hasta')).toBe('2026-10-08')
    await user.click(screen.getByRole('button', { name: 'Alejar' }))
    await waitFor(() => expect(consulta().get('desde')).toBeNull())
  })

  it('"Ver como tabla" da la misma información en texto', async () => {
    const user = await abrir()
    const panel = screen.getByRole('region', { name: 'Análisis en el tiempo' })
    await user.click(within(panel).getByRole('button', { name: 'Ver como tabla' }))
    const tabla = within(panel).getByRole('table')
    expect(within(tabla).getAllByRole('row')).toHaveLength(7)
    expect(within(tabla).getByRole('row', { name: /7 oct 2026/ })).toHaveTextContent('7 oct 2026100142 %')
    expect(within(panel).getByRole('button', { name: 'Ver gráfica', pressed: true })).toBeInTheDocument()
  })

  it('sin análisis lo dice; un error se puede reintentar', async () => {
    await abrirSinEsperar('#/graficos', { '/analisis': json(200, []) })
    expect(await screen.findByText(/Aún no hay análisis/)).toBeInTheDocument()
  })

  it('error al cargar → mensaje y Reintentar', async () => {
    await abrirSinEsperar('#/graficos', { '/analisis': json(500, { message: 'Base de datos no disponible.' }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Base de datos no disponible.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

async function abrirSinEsperar(hash: string, rutas: Parameters<typeof mockBackend>[1]) {
  mockBackend(fetchMock, rutas)
  window.location.hash = hash
  render(<App />)
}
