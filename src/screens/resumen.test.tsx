import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ESTADISTICAS, conSesion, json, llamadasA, mockBackend } from '../test/backend'

const fetchMock = vi.fn<typeof fetch>()
const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>
const originales = { showModal: proto.showModal, close: proto.close }

beforeEach(() => {
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  proto.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  sessionStorage.clear()
  localStorage.clear()
  window.location.hash = ''
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  Object.assign(proto, originales)
  vi.unstubAllGlobals()
})

async function abrir({ roles = ['EXPERTO_CAMPO'], rutas = {} }: { roles?: string[]; rutas?: Parameters<typeof mockBackend>[1] } = {}) {
  conSesion(roles, roles.includes('ADMINISTRADOR') ? 'admin@sheets.tt' : 'demo@sheets.tt')
  mockBackend(fetchMock, rutas)
  window.location.hash = '#/'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Resumen' })
  return userEvent.setup()
}

describe('Resumen (dashboard)', () => {
  it('las secciones van en orden de prioridad, después del hero de siempre', async () => {
    await abrir()
    await screen.findByRole('heading', { name: 'Gráficas clave' })
    await screen.findByRole('group', { name: /^Análisis por día/ }) // el chunk perezoso ya llegó
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual(['Necesita tu atención', 'Últimos 7 días con datos', 'Gráficas clave', 'Ir a', 'Actividad reciente', 'Todos los análisis'])
    // Las gráficas y los paneles de siempre van un nivel abajo, dentro de su sección.
    const h3 = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(h3).toEqual([
      'Siguen con infestación en su último análisis',
      'Análisis en el tiempo',
      'Dónde hay más infestación',
      'Confianza del modelo',
      'Resultado de los análisis',
      'Cromático promedio del follaje',
      'Sincronización desde el móvil',
    ])
    // Lo de siempre sigue: el hero con sus totales.
    expect(screen.getByText('1 árbol y 1 zona con infestación detectada')).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?limite=500'])
  })

  it('"Necesita tu atención" enlaza a Análisis ya filtrado y a los lugares infestados', async () => {
    await abrir()
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    await within(seccion).findByText('3 análisis requieren atención, de los 5 más recientes.')
    const enlace = (n: RegExp) => within(seccion).getByRole('link', { name: n })
    expect(enlace(/^Infestados: 2\./)).toHaveAttribute('href', '#/analisis?caja_resultado=infestado')
    expect(enlace(/^Confianza baja: 1\./)).toHaveAttribute('href', '#/analisis?caja_confianza=baja')
    expect(enlace(/^No determinados: 1\./)).toHaveAttribute('href', '#/analisis?caja_resultado=no_determinado')
    expect(enlace(/^Errores de sincronización: 1\./)).toHaveAttribute('href', '#/analisis?estado=error')
    expect(within(seccion).getByRole('link', { name: 'Ver los 3 en Análisis' })).toHaveAttribute('href', '#/analisis?atencion=1')
    expect(within(seccion).getByRole('link', { name: 'Zona calzada' })).toHaveAttribute('href', '#/zona/c2')
    expect(within(seccion).getByRole('link', { name: 'Oyamel del lago' })).toHaveAttribute('href', '#/arbol/b1')
  })

  it('un enlace de atención abre Análisis con las cajas aplicadas', async () => {
    const user = await abrir()
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    await user.click(await within(seccion).findByRole('link', { name: /^Infestados: 2\./ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Análisis' })).toBeInTheDocument()
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Análisis' })).getAllByRole('row')).toHaveLength(3))
    expect(screen.getByRole('button', { name: /^Infestado:/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('indicadores de los últimos 7 días (sin periodo previo para comparar)', async () => {
    await abrir()
    const lista = await screen.findByRole('list', { name: 'Indicadores de los últimos 7 días' })
    expect(within(lista).getByText('Análisis').parentElement).toHaveTextContent('Análisis5sin análisis en los 7 días previos para comparar')
    expect(within(lista).getByText('Infestados').parentElement).toHaveTextContent('40 %')
    expect(within(lista).getByText('Última captura').parentElement).toHaveTextContent('8 oct 2026, 05:00')
  })

  it('las gráficas clave (perezosas) llevan a Gráficos con los mismos filtros', async () => {
    await abrir()
    expect(await screen.findByRole('group', { name: /^Análisis por día: 5 análisis en 6 periodos/ })).toBeInTheDocument()
    // Cada "Ver en Gráficos" dice a qué lleva.
    expect(screen.getByRole('link', { name: 'Ver la actividad en Gráficos' })).toHaveAttribute('href', '#/graficos')
    expect(screen.getByRole('link', { name: 'Ver dónde hay más infestación en Gráficos' })).toHaveAttribute('href', '#/graficos?resultado=infestado')
    expect(screen.getByRole('link', { name: 'Ver la confianza del modelo en Gráficos' })).toHaveAttribute('href', '#/graficos')
    // Sin pincel: la versión ligera no trae la vista general.
    expect(document.querySelector('.grafica-vista')).toBeNull()
    // Top de infestación: primero los que tienen infestados.
    const lugares = within(screen.getByRole('group', { name: /^Análisis por árbol y zona/ })).getAllByRole('link')
    expect(lugares.map((l) => l.getAttribute('aria-label')?.split(' (')[0])).toEqual(['Oyamel del lago', 'Zona calzada', 'Zona lago menor', 'Ahuehuete de la calzada'])
  })

  it('accesos rápidos: un experto no ve Administración; un administrador sí, al final', async () => {
    await abrir()
    const accesos = await screen.findByRole('navigation', { name: 'Ir a' })
    await waitFor(() => expect(within(accesos).getAllByRole('link')).toHaveLength(4))
    expect(within(accesos).getAllByRole('link').map((a) => a.querySelector('strong')?.textContent)).toEqual([
      'Mapa',
      'Análisis',
      'Gráficos',
      'Seguimiento de Zona calzada',
    ])
    expect(within(accesos).getByRole('link', { name: /^Análisis/ })).toHaveTextContent('5 análisis, 3 requieren atención')
  })

  it('un administrador ve Administración en los accesos', async () => {
    await abrir({ roles: ['ADMINISTRADOR'] })
    const accesos = await screen.findByRole('navigation', { name: 'Ir a' })
    await waitFor(() => expect(within(accesos).getAllByRole('link').at(-1)).toHaveTextContent('Administración'))
    expect(within(accesos).getByRole('link', { name: /^Administración/ })).toHaveAttribute('href', '#/admin')
  })

  it('actividad reciente: cada análisis abre su detalle en Análisis', async () => {
    const user = await abrir()
    const seccion = await screen.findByRole('region', { name: 'Actividad reciente' })
    const items = within(seccion).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('Infestado')
    expect(items[0]).toHaveTextContent('Zona calzada')
    await user.click(within(seccion).getByRole('link', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }))
    expect(await screen.findByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/analisis?detalle=e1')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(window.location.hash).toBe('#/analisis'))
  })

  it('si /analisis falla, el hero y los accesos siguen; la atención lo dice y deja reintentar', async () => {
    let veces = 0
    const user = await abrir({ rutas: { '/analisis': () => (++veces === 1 ? json(500, { message: 'Base de datos no disponible.' }) : json(200, [])) } })
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    expect(await within(seccion).findByRole('alert')).toHaveTextContent('Base de datos no disponible.')
    expect(screen.getByText('1 árbol y 1 zona con infestación detectada')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Ir a' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Gráficas clave' })).not.toBeInTheDocument()
    await user.click(within(seccion).getByRole('button', { name: 'Reintentar' }))
    expect(await within(seccion).findByText(/Nada urgente/)).toBeInTheDocument()
  })

  it('si /estadisticas falla, lo demás se muestra igual', async () => {
    await abrir({ rutas: { '/estadisticas': json(500) } })
    expect(await screen.findByRole('region', { name: 'Necesita tu atención' })).toBeInTheDocument()
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Error del servidor (500)')
    expect(await screen.findByRole('group', { name: /^Análisis por día/ })).toBeInTheDocument()
  })

  it('si /arboles falla, la atención por análisis sigue y los lugares avisan', async () => {
    await abrir({ rutas: { '/arboles': json(500) } })
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    expect(await within(seccion).findByText('3 análisis requieren atención, de los 5 más recientes.')).toBeInTheDocument()
    expect(await within(seccion).findByRole('alert')).toHaveTextContent('Error del servidor (500)')
    expect(ESTADISTICAS.totales.arboles).toBe(3)
  })

  it('los errores de sincronización usan la cifra global, la misma que abre ?estado=error', async () => {
    await abrir({
      rutas: { '/estadisticas': json(200, { ...ESTADISTICAS, analisisPorSincronizacion: { ...ESTADISTICAS.analisisPorSincronizacion, error: 4 } }) },
    })
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    expect(await within(seccion).findByRole('link', { name: /^Errores de sincronización: 4\. No llegaron bien desde el móvil \(en todos los análisis\)/ })).toHaveAttribute(
      'href',
      '#/analisis?estado=error',
    )
  })

  it('con un solo análisis que requiere atención, el botón va en singular', async () => {
    await abrir({ rutas: { '/analisis': json(200, [{ ...(await import('../test/backend')).ANALISIS[4] }]) } })
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    expect(await within(seccion).findByRole('link', { name: 'Ver el análisis en Análisis' })).toHaveAttribute('href', '#/analisis?atencion=1')
    expect(within(seccion).getByText(/Arriba se cuentan los árboles y zonas con al menos un análisis infestado/)).toBeInTheDocument()
  })
})

describe('enlace directo al detalle en Análisis (?detalle=)', () => {
  it('anterior/siguiente actualiza el parámetro; al cerrar el foco va al conteo', async () => {
    conSesion()
    mockBackend(fetchMock)
    window.location.hash = '#/analisis?detalle=e3'
    render(<App />)
    const user = userEvent.setup()
    const dialogo = await screen.findByRole('dialog', { name: 'Análisis del 4 oct 2026, 06:00' })
    const largo = window.history.length
    await user.click(within(dialogo).getByRole('button', { name: 'Siguiente de este lugar' }))
    await waitFor(() => expect(window.location.hash).toBe('#/analisis?detalle=e4'))
    expect(window.history.length).toBe(largo)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(window.location.hash).toBe('#/analisis'))
    await waitFor(() => expect(document.activeElement?.id).toBe('analisis-conteo'))
  })

  it('un id que no está entre los cargados: avisa y quita el parámetro', async () => {
    conSesion()
    mockBackend(fetchMock)
    window.location.hash = '#/analisis?caja_tipo=follaje&detalle=no-existe'
    render(<App />)
    expect(await screen.findByText('El análisis enlazado no está entre los cargados con estos filtros.')).toBeInTheDocument()
    await waitFor(() => expect(window.location.hash).toBe('#/analisis?caja_tipo=follaje'))
    expect(screen.getByText('El análisis enlazado no está entre los cargados con estos filtros.')).toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Corteza:/ }))
    await waitFor(() => expect(screen.queryByText('El análisis enlazado no está entre los cargados con estos filtros.')).not.toBeInTheDocument())
    expect(window.location.hash).not.toContain('detalle')
  })
})

describe('Resumen: re-QA', () => {
  it('T2: si /estadisticas falla, "Errores de sincronización" dice de cuántos y no enlaza', async () => {
    conSesion()
    mockBackend(fetchMock, { '/estadisticas': json(500) })
    window.location.hash = '#/'
    render(<App />)
    const seccion = await screen.findByRole('region', { name: 'Necesita tu atención' })
    const item = await within(seccion).findByText('No llegaron bien desde el móvil (de los 5 más recientes)')
    expect(item.closest('a')).toBeNull()
    expect(within(seccion).queryByRole('link', { name: /^Errores de sincronización/ })).not.toBeInTheDocument()
  })

  it('con el periodo actual recortado por el límite: "500 o más" y "periodo actual incompleto"', async () => {
    const { ANALISIS } = await import('../test/backend')
    const quinientos = Array.from({ length: 500 }, (_, i) => ({ ...ANALISIS[2], id: `q${i}`, fechaCaptura: `2026-10-0${3 + (i % 6)}T18:00:00Z` }))
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, quinientos) })
    window.location.hash = '#/'
    render(<App />)
    const lista = await screen.findByRole('list', { name: 'Indicadores de los últimos 7 días' })
    expect(within(lista).getByText('Análisis').parentElement).toHaveTextContent('Análisis500 o mássin comparar (periodo actual incompleto)')
    expect(screen.getByText(/este periodo puede estar incompleto y no se compara/)).toBeInTheDocument()
  })
})

