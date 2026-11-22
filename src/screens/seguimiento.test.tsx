import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { Analisis } from '../lib/api'
import { ANALISIS, ARBOLES, conSesion, json, llamadasA, mockBackend, ZONAS } from '../test/backend'
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

/** Historial más largo del Oyamel: pasó de sano a infestado y tiene dónde se tomó cada foto. */
const HISTORIA_OYAMEL: Analisis[] = [
  { ...ANALISIS[4], latitudCaptura: 19.4206, longitudCaptura: -99.18178 },
  {
    ...ANALISIS[4],
    id: 'e0',
    fechaCaptura: '2026-09-20T15:00:00Z',
    resultadoClasificacion: 'sano',
    confianza: 0.83,
    observaciones: null,
    autor: null,
    tieneEvidencia: false,
    latitudCaptura: null,
    longitudCaptura: null,
  },
]

describe('seguimiento de un árbol', () => {
  it('pide el árbol y todo su historial en paralelo', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/arbol/b1')
    expect(await screen.findByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/arboles/b1')).toHaveLength(1)
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?arbol=b1&limite=200'])
    await waitFor(() => expect(document.title).toBe('Oyamel del lago · Desco'))
  })

  it('muestra el estado actual, la línea de tiempo y el cambio de resultado', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    const ficha = await screen.findByRole('region', { name: 'Estado actual' })
    expect(ficha).toHaveTextContent('Infestado')
    expect(ficha).toHaveTextContent('Junto al lago menor')
    expect(ficha).toHaveTextContent(/Análisis registrados\s*2\s*1 con infestación/)

    const linea = screen.getByRole('list', { name: 'Línea de tiempo' })
    const eventos = within(linea).getAllByRole('listitem')
    expect(eventos).toHaveLength(2)
    expect(eventos[0]).toHaveTextContent('Cambió de sano a infestado')
    expect(eventos[0]).toHaveTextContent('Galerías visibles')
    expect(eventos[0]).toHaveTextContent('tomada a 11 m del árbol')
    expect(eventos[1]).not.toHaveTextContent('Cambió')
  })

  it('la gráfica resume los análisis para lectores de pantalla', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    expect(
      await screen.findByRole('img', { name: /^Certeza de cada diagnóstico: 2 análisis, del 20 sep 2026.* Infestado: 1, Sano: 1\.$/ }),
    ).toBeInTheDocument()
  })

  it('el mapa pequeño marca el árbol y dónde se tomó cada foto', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    const grupo = await screen.findByRole('group', { name: 'Ubicación de Oyamel del lago y 1 captura' })
    expect(await within(grupo).findByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' })).toBeInTheDocument()
    await waitFor(() => expect(motores.at(-1)?.capturas?.features).toHaveLength(1))

    // "Ubicar" resalta la captura en el mapa.
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Ubicar' }))
    expect(motores.at(-1)!.resaltado.capturas).toBe('e1')
  })

  it('tocar una captura en el mapa la marca en la línea de tiempo', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    await screen.findByRole('group', { name: /^Ubicación de Oyamel/ })
    await waitFor(() => expect(motores.at(-1)?.capturas).not.toBeNull())
    motores.at(-1)!.opciones.alTocar?.('capturas', 'e1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ubicar' })).toHaveAttribute('aria-pressed', 'true'))
  })

  it('ofrece la foto de cada análisis que la tiene', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }))
    expect(await screen.findByRole('dialog', { name: 'Corteza, 3 oct 2026, 09:10' })).toBeInTheDocument()
  })

  it('sin análisis lo dice y no dibuja la gráfica', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, []) })
    abrir('#/arbol/b3')
    await screen.findByRole('heading', { level: 1, name: 'Pino del cerro' })
    expect(screen.getByText(/Todavía no tiene análisis/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /^Certeza/ })).not.toBeInTheDocument()
  })

  it('un árbol que no existe lo explica y deja volver al mapa', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/arbol/no-existe')
    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró el registro.')
    expect(screen.getByRole('link', { name: 'Volver al mapa' })).toHaveAttribute('href', '#/mapa/a-no-existe')
  })

  it('el menú marca Mapa como la sección actual', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/arbol/b1')
    await screen.findByRole('heading', { level: 1, name: 'Oyamel del lago' })
    const nav = screen.getByRole('navigation', { name: 'Secciones' })
    expect(within(nav).getByRole('link', { name: 'Mapa' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('seguimiento de una zona', () => {
  it('muestra la evolución del follaje captura por captura', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/analisis': (url) => json(200, url.searchParams.get('zona') === 'c1' ? ANALISIS.filter((a) => a.idZona === 'c1') : []),
    })
    abrir('#/zona/c1')
    const evolucion = await screen.findByRole('region', { name: 'Evolución del color del follaje' })
    const barras = within(evolucion).getAllByRole('img')
    expect(barras.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Follaje el 7 oct 2026, 03:00: Sano 30 %, Regular 20 %, Dañado 10 %, Incierto 40 %',
      'Follaje el 4 oct 2026, 06:00: Sano 80 %, Regular 10 %, Dañado 5 %, Incierto 5 %',
    ])
    expect(screen.getByRole('list', { name: 'Línea de tiempo' })).toHaveTextContent('Cambió de sano a sin diagnóstico claro')
    expect(llamadasA(fetchMock, '/zonas/c1')).toHaveLength(1)
  })
})

describe('quién le da seguimiento', () => {
  it('con dos personas se destaca, con cuántos análisis y su última foto', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/analisis': (url) => json(200, ANALISIS.filter((a) => a.idZona === url.searchParams.get('zona'))),
    })
    abrir('#/zona/c1')
    const quien = await screen.findByRole('region', { name: 'Quién le da seguimiento' })
    expect(quien).toHaveTextContent('Registrado por Usuario Demo')
    expect(quien).toHaveTextContent('2 personas le dan seguimiento a esta zona')
    const personas = within(within(quien).getByRole('list', { name: 'Personas que suben fotos' })).getAllByRole('listitem')
    expect(personas.map((p) => p.textContent)).toEqual([
      expect.stringMatching(/^Experta de Campo Demo1 análisis · última foto .* \(7 oct 2026, 03:00\)$/),
      expect.stringMatching(/^Usuario Demo1 análisis · última foto .* \(4 oct 2026, 06:00\)$/),
    ])
    // La línea de tiempo dice quién subió cada foto y lo que escribió.
    const eventos = within(screen.getByRole('list', { name: 'Línea de tiempo' })).getAllByRole('listitem')
    expect(eventos[0]).toHaveTextContent('Subido por Experta de Campo Demo')
    expect(eventos[0]).toHaveTextContent('Observaciones de campo · escritas por Experta de Campo DemoPoca luz')
    expect(eventos[1]).toHaveTextContent('Subido por Usuario Demo')
    // Qué hacer, según el análisis más reciente.
    expect(screen.getByRole('region', { name: 'Estado actual' })).toHaveTextContent(
      'Según el análisis más reciente (sin diagnóstico claro: conviene repetir la foto): Repite la foto con buena luz',
    )
  })

  it('con una sola persona no se destaca; un análisis sin autor lo dice', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': json(200, HISTORIA_OYAMEL) })
    abrir('#/arbol/b1')
    const quien = await screen.findByRole('region', { name: 'Quién le da seguimiento' })
    expect(quien).toHaveTextContent('Registrado por Usuario Demo')
    expect(quien).not.toHaveTextContent('personas le dan seguimiento')
    expect(quien).toHaveTextContent(/^Quién le da seguimientoRegistrado por Usuario DemoUsuario Demo1 análisis/)
    const eventos = within(screen.getByRole('list', { name: 'Línea de tiempo' })).getAllByRole('listitem')
    expect(eventos[0]).toHaveTextContent('Subido por Usuario Demo')
    expect(eventos[1]).toHaveTextContent('Autor no registrado')
    expect(screen.getByRole('region', { name: 'Estado actual' })).toHaveTextContent('Inspecciona el árbol en campo, márcalo y avisa al responsable de sanidad forestal.')
  })

  it('un backend sin el dato: sin sección vacía, lo dice', async () => {
    conSesion()
    // ARBOLES no trae registradoPor ni seguimiento (como un backend anterior).
    mockBackend(fetchMock, { '/arboles/:id': json(200, ARBOLES[0]), '/analisis': json(200, []) })
    abrir('#/arbol/b3')
    const quien = await screen.findByRole('region', { name: 'Quién le da seguimiento' })
    expect(quien).toHaveTextContent('Sin registro de quién sube las fotos todavía.')
    expect(within(quien).queryByRole('list')).not.toBeInTheDocument()
  })

  it('si el backend no manda la lista, se arma con los autores de los análisis', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/zonas/:id': json(200, ZONAS[1]),
      '/analisis': json(200, ANALISIS.filter((a) => a.idZona === 'c1')),
    })
    abrir('#/zona/c1')
    const quien = await screen.findByRole('region', { name: 'Quién le da seguimiento' })
    expect(quien).toHaveTextContent('No se sabe quién lo registró.')
    expect(quien).toHaveTextContent('2 personas le dan seguimiento a esta zona')
  })
})
