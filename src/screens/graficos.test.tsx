import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    expect(consulta().get('hasta')).toBeNull() // llega al último día con datos
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

describe('Gráficos: rango y URL acotados', () => {
  it.each([
    ['#/graficos?desde=0001-01-01&hasta=9999-12-31'],
    ['#/graficos?hasta=2025-05-31'],
    ['#/graficos?desde=2026-02-30'],
    ['#/graficos?zona=no-existe&resultado=x&tipo=y&confianza=12&otro=1'],
  ])('%s se normaliza a #/graficos sin paso nuevo en el historial', async (hash) => {
    const largo = window.history.length
    await abrir(hash)
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    expect(window.history.length).toBe(largo + 1) // solo el de abrir la pantalla
    expect(grafica(/^Análisis por día: 5 análisis en 6 periodos/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Filtros activos' })).not.toBeInTheDocument()
    expect(document.querySelectorAll('svg *').length).toBeLessThan(2000)
  })

  it('un rango que se sale por un lado se acota y se reescribe', async () => {
    await abrir('#/graficos?desde=2026-10-05&hasta=9999-12-31')
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-05'))
    expect(grafica(/^Análisis por día: 3 análisis en 4 periodos/)).toBeInTheDocument()
  })

  it('las fechas se aplican al confirmar, no en cada tecla, y solo dentro de los datos', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    expect(desde).toHaveAttribute('min', '2026-10-03')
    expect(desde).toHaveAttribute('max', '2026-10-08')
    const largo = window.history.length

    // Escribir el año pasa por fechas absurdas: nada se aplica mientras se escribe.
    for (const v of ['0002-10-03', '0020-10-03', '0202-10-03', '2025-10-03']) fireEvent.change(desde, { target: { value: v } })
    expect(window.location.hash).toBe('#/graficos')
    expect(window.history.length).toBe(largo)

    // Al salir del campo: fuera de los datos → aviso y vuelve al valor vigente.
    fireEvent.blur(desde)
    expect(await screen.findByRole('alert')).toHaveTextContent('Elige una fecha entre el 3 oct 2026 y el 8 oct 2026.')
    expect(desde).toHaveAttribute('aria-invalid', 'true')
    expect(desde.value).toBe('2026-10-03')
    expect(window.location.hash).toBe('#/graficos')

    // Una fecha válida con Enter se aplica.
    fireEvent.change(desde, { target: { value: '2026-10-06' } })
    fireEvent.keyDown(desde, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-06'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Gráficos: fecha a medio confirmar + clic en otro control (R1, R2)', () => {
  /** Lo que hace el navegador al hacer clic en otro control con el foco en una fecha. */
  function clicDesdeFecha(input: HTMLElement, control: HTMLElement) {
    fireEvent.pointerDown(control)
    // Como Chrome: el control recibe el foco (y la fecha lo pierde) antes del clic.
    if (control.tabIndex >= 0 || control instanceof HTMLButtonElement) control.focus()
    else input.blur()
    fireEvent.click(control)
  }

  it('la fecha escrita y el clic en la leyenda salen juntos, en un solo paso del historial', async () => {
    await abrir('#/graficos?hasta=2026-10-06')
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    const largo = window.history.length
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-05' } })
    clicDesdeFecha(desde, screen.getByRole('button', { name: 'Infestado', pressed: false }))
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-05&hasta=2026-10-06&resultado=infestado'))
    expect(window.history.length).toBe(largo + 1)
    expect(desde.value).toBe('2026-10-05')
  })

  it('con Siguiente: el rango se mueve desde la fecha escrita', async () => {
    await abrir('#/graficos?hasta=2026-10-05')
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    const largo = window.history.length
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-04' } })
    clicDesdeFecha(desde, screen.getByRole('button', { name: 'Siguiente' }))
    // 4–5 oct → siguientes dos días: 6–7 oct.
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-06&hasta=2026-10-07'))
    expect(window.history.length).toBe(largo + 1)
    await waitFor(() => expect(desde.value).toBe('2026-10-06'))
  })

  it('si el clic no lo consume ningún control, la fecha sale sola', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-05' } })
    const titulo = screen.getByRole('heading', { level: 1, name: 'Gráficos' })
    clicDesdeFecha(desde, titulo)
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-05'))
  })

  it('Enter aplica la fecha sin sacar el foco del campo', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-05' } })
    fireEvent.keyDown(desde, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-05'))
    expect(screen.getByLabelText('Desde')).toBe(desde) // el mismo nodo: no se volvió a montar
    expect(desde).toHaveFocus()
  })

  it('una fecha que intercambia el rango no saca el foco ni deja Hasta desfasado', async () => {
    await abrir('#/graficos?desde=2026-10-05&hasta=2026-10-06')
    const hasta = screen.getByLabelText('Hasta') as HTMLInputElement
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    hasta.focus()
    fireEvent.change(hasta, { target: { value: '2026-10-03' } })
    fireEvent.keyDown(hasta, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?hasta=2026-10-05'))
    expect(hasta).toHaveFocus()
    expect(desde.value).toBe('2026-10-03')
  })

  it('si el botón usado queda deshabilitado, el foco pasa al texto del rango', async () => {
    const user = await abrir('#/graficos?desde=2026-10-05')
    await user.click(screen.getByRole('button', { name: 'Restablecer' }))
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    await waitFor(() => expect(document.activeElement).toHaveClass('rango-texto'))
  })

  it('el aviso de fecha inválida es de su campo y se va al corregirlo', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    const hasta = screen.getByLabelText('Hasta') as HTMLInputElement
    fireEvent.change(desde, { target: { value: '2025-01-01' } })
    fireEvent.blur(desde)
    expect(await screen.findByRole('alert')).toHaveAttribute('id', 'g-desde-error')
    expect(desde).toHaveAttribute('aria-invalid', 'true')
    expect(desde).toHaveAccessibleDescription(/Elige una fecha entre/)
    expect(hasta).not.toHaveAttribute('aria-invalid')
    fireEvent.change(hasta, { target: { value: '2026-10-07' } })
    fireEvent.blur(hasta)
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(desde).not.toHaveAttribute('aria-invalid')
  })

  it('si el rango pedido no tiene análisis, lo avisa y muestra todo', async () => {
    const user = await abrir('#/graficos?desde=2025-05-01&hasta=2025-05-31')
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    expect(screen.getByText('El rango pedido no tiene análisis; se muestra todo.')).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('button', { name: 'Acercar' }))
    await waitFor(() => expect(screen.queryByText('El rango pedido no tiene análisis; se muestra todo.')).not.toBeInTheDocument())
  })

  it('un rango que abarca todos los datos no es "sin análisis"', async () => {
    await abrir('#/graficos?desde=0001-01-01&hasta=9999-12-31')
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    expect(screen.queryByText(/El rango pedido no tiene análisis/)).not.toBeInTheDocument()
  })
})

describe('Gráficos: campos de fecha "sucios" (N1), aviso de rango (N2) y foco de los chips', () => {
  it('intercambio con clic en Hasta: Hasta (con foco) muestra el valor nuevo y salir no lo vuelve a aplicar', async () => {
    await abrir('#/graficos?desde=2026-10-04&hasta=2026-10-06')
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    const hasta = screen.getByLabelText('Hasta') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-07' } })
    fireEvent.pointerDown(hasta)
    hasta.focus()
    fireEvent.click(hasta)
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-06&hasta=2026-10-07'))
    expect(hasta).toHaveFocus()
    await waitFor(() => expect(hasta.value).toBe('2026-10-07'))
    expect(desde.value).toBe('2026-10-06')
    const largo = window.history.length
    hasta.blur()
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe('#/graficos?desde=2026-10-06&hasta=2026-10-07')
    expect(window.history.length).toBe(largo)
  })

  it('intercambio con Enter: Desde (con foco) muestra el extremo real y salir no lo colapsa', async () => {
    await abrir('#/graficos?desde=2026-10-04&hasta=2026-10-06')
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-07' } })
    fireEvent.keyDown(desde, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-06&hasta=2026-10-07'))
    expect(desde).toHaveFocus()
    await waitFor(() => expect(desde.value).toBe('2026-10-06'))
    desde.blur()
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe('#/graficos?desde=2026-10-06&hasta=2026-10-07')
  })

  it('Atrás con el foco en Desde: el campo se sincroniza y salir no rehace el cambio', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-05' } })
    fireEvent.keyDown(desde, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/graficos?desde=2026-10-05'))
    window.history.back()
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    expect(desde).toHaveFocus()
    await waitFor(() => expect(desde.value).toBe('2026-10-03'))
    desde.blur()
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe('#/graficos')
  })

  it.each([
    ['Restablecer', ['Acercar', 'Restablecer']],
    ['Acercar → Alejar', ['Acercar', 'Alejar']],
  ])('el aviso de rango sin análisis no vuelve tras %s', async (_, botones) => {
    const user = await abrir('#/graficos?hasta=2025-05-31')
    const aviso = 'El rango pedido no tiene análisis; se muestra todo.'
    expect(await screen.findByText(aviso)).toBeInTheDocument()
    for (const b of botones) await user.click(screen.getByRole('button', { name: b }))
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    expect(screen.queryByText(aviso)).not.toBeInTheDocument()
  })

  it('al quitar un chip el foco pasa al siguiente y, sin chips, al texto del rango', async () => {
    const user = await abrir('#/graficos?tipo=follaje&resultado=sano')
    await user.click(screen.getByRole('button', { name: 'Quitar Resultado: Sano' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Quitar Tipo: Follaje' })).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Quitar Tipo: Follaje' }))
    await waitFor(() => expect(document.activeElement).toHaveClass('rango-texto'))
  })

  it('"Quitar todo" deja el foco en el texto del rango', async () => {
    const user = await abrir('#/graficos?tipo=follaje&resultado=sano')
    await user.click(screen.getByRole('button', { name: 'Quitar todo' }))
    await waitFor(() => expect(window.location.hash).toBe('#/graficos'))
    await waitFor(() => expect(document.activeElement).toHaveClass('rango-texto'))
  })

  it('dos cambios de hash seguidos (Enter y enseguida Atrás) también sincronizan el campo', async () => {
    await abrir()
    const desde = screen.getByLabelText('Desde') as HTMLInputElement
    desde.focus()
    fireEvent.change(desde, { target: { value: '2026-10-05' } })
    fireEvent.keyDown(desde, { key: 'Enter' })
    // Sin esperar a que React vuelva a dibujar: la URL regresa a la de antes en la misma tarea.
    expect(window.location.hash).toBe('#/graficos?desde=2026-10-05')
    window.history.replaceState(null, '', '#/graficos')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await waitFor(() => expect(desde.value).toBe('2026-10-03'))
    desde.blur()
    await new Promise((r) => setTimeout(r, 50))
    expect(window.location.hash).toBe('#/graficos')
  })
})

