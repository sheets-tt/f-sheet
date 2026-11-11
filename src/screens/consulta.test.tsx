import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { ANALISIS, ESTADISTICAS, conSesion, json, llamadasA, mockBackend } from '../test/backend'

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

describe('navegación por rol', () => {
  it('un experto de campo ve Resumen, Mapa y Análisis, pero no Administración', async () => {
    conSesion(['EXPERTO_CAMPO'])
    mockBackend(fetchMock)
    abrir('#/')
    const nav = await screen.findByRole('navigation', { name: 'Secciones' })
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Resumen', 'Mapa', 'Análisis'])
    expect(within(nav).getByRole('link', { name: 'Resumen' })).toHaveAttribute('aria-current', 'page')
  })

  it('el encabezado muestra el nombre de la cuenta', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/')
    expect(await screen.findByText('Usuario Demo')).toBeInTheDocument()
  })

  it('un experto que abre #/admin vuelve al resumen', async () => {
    conSesion(['EXPERTO_CAMPO'])
    mockBackend(fetchMock)
    abrir('#/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Resumen' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/')
    expect(llamadasA(fetchMock, '/cuentas')).toEqual([])
  })
})

describe('resumen', () => {
  it('abre con los focos de infestación y los totales', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/')
    expect(await screen.findByText('1 árbol y 1 zona con infestación detectada')).toBeInTheDocument()
    const totales = screen.getByRole('list', { name: 'Totales' })
    expect(within(totales).getByText('Árboles').nextSibling).toHaveTextContent('3')
    expect(within(totales).getByText('Análisis').nextSibling).toHaveTextContent('5')
    expect(screen.getByText(/Última captura: 8 oct 2026, 05:00/)).toBeInTheDocument()
  })

  it('pluraliza y dice cuando no hay infestación', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/estadisticas': json(200, {
        ...ESTADISTICAS,
        totales: { ...ESTADISTICAS.totales, arbolesConInfestacion: 0, zonasConInfestacion: 0 },
      }),
    })
    abrir('#/')
    expect(await screen.findByText('Sin infestación detectada')).toBeInTheDocument()
  })

  it('cada barra segmentada se puede leer como texto y como tabla', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/')
    expect(
      await screen.findByRole('img', {
        name: 'Resultado de los análisis: Sano 2 (40 %), Infestado 2 (40 %), No determinado 1 (20 %)',
      }),
    ).toBeInTheDocument()
    const tabla = screen.getByRole('table', { name: 'Resultado de los análisis' })
    expect(within(tabla).getByRole('row', { name: 'Infestado 2 40 %' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Cromático promedio del follaje: Sano 55 %, Regular 15 %, Dañado 7.5 %, Incierto 22.5 %$/ })).toBeInTheDocument()
  })

  it('un error deja reintentar', async () => {
    conSesion()
    let veces = 0
    mockBackend(fetchMock, { '/estadisticas': () => (++veces === 1 ? json(500) : json(200, ESTADISTICAS)) })
    abrir('#/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Error del servidor (500)')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('1 árbol y 1 zona con infestación detectada')).toBeInTheDocument()
  })
})

describe('análisis', () => {
  it('lista los análisis con resultado, confianza y sincronización', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/analisis')
    const tabla = await screen.findByRole('table', { name: 'Análisis' })
    const filas = within(tabla).getAllByRole('row').slice(1)
    expect(filas).toHaveLength(5)
    expect(filas[4]).toHaveTextContent('3 oct 2026, 09:10')
    expect(filas[4]).toHaveTextContent('Corteza')
    expect(filas[4]).toHaveTextContent('Infestado')
    expect(filas[4]).toHaveTextContent('91 %')
    expect(filas[4]).toHaveTextContent('Galerías visibles')
    expect(within(filas[0]).getByText('Con error')).toBeInTheDocument()
    expect(within(filas[3]).getByRole('img', { name: 'Cromático: Sano 80 %, Regular 10 %, Dañado 5 %, Incierto 5 %' })).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?limite=100'])
  })

  it('aplica los filtros en la consulta al backend', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/analisis')
    const user = userEvent.setup()
    await screen.findByRole('table', { name: 'Análisis' })
    await user.selectOptions(screen.getByLabelText('Tipo'), 'follaje')
    await user.selectOptions(screen.getByLabelText('Resultado'), 'infestado')
    await user.type(screen.getByLabelText('Desde'), '2026-10-04')
    await user.type(screen.getByLabelText('Hasta'), '2026-10-07')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() =>
      expect(llamadasA(fetchMock, '/analisis').at(-1)).toBe(
        '/api/analisis?tipo=follaje&resultado=infestado&desde=2026-10-04T06%3A00%3A00.000Z&hasta=2026-10-08T05%3A59%3A59.999Z&limite=100',
      ),
    )
  })

  it('muestra el mensaje del backend si rechaza el filtro', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/analisis': (url) =>
        url.searchParams.has('desde') ? json(400, { message: 'desde no puede ser posterior a hasta' }) : json(200, []),
    })
    abrir('#/analisis')
    const user = userEvent.setup()
    await screen.findByText('Ningún análisis coincide con estos filtros.')
    await user.type(screen.getByLabelText('Desde'), '2026-10-09')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('desde no puede ser posterior a hasta')
  })

  it('sin resultados ofrece quitar los filtros', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis': () => json(200, []) })
    abrir('#/analisis')
    const user = userEvent.setup()
    await screen.findByText('Ningún análisis coincide con estos filtros.')
    await user.selectOptions(screen.getByLabelText('Tipo'), 'corteza')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await user.click(await screen.findByRole('button', { name: 'Quitar filtros' }))
    expect(screen.getByLabelText('Tipo')).toHaveValue('')
    await waitFor(() => expect(llamadasA(fetchMock, '/analisis').at(-1)).toBe('/api/analisis?limite=100'))
  })
})

describe('mapa', () => {
  it('pide árboles y zonas una sola vez, sin descargar todos los análisis', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    await screen.findByRole('group', { name: /Mapa de campo/ })
    expect(llamadasA(fetchMock, '/arboles')).toHaveLength(1)
    expect(llamadasA(fetchMock, '/zonas')).toHaveLength(1)
    expect(llamadasA(fetchMock, '/analisis')).toEqual([])
  })

  it('cada árbol y zona del mapa dice su último resultado', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const plano = await screen.findByRole('group', { name: 'Mapa de campo: 3 árboles y 2 zonas' })
    expect(await within(plano).findByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' })).toBeInTheDocument()
    expect(within(plano).getByRole('button', { name: 'Ahuehuete de la calzada (Taxodium mucronatum): Sano' })).toBeInTheDocument()
    expect(within(plano).getByRole('button', { name: 'Pino del cerro (Pinus hartwegii): Sin análisis' })).toBeInTheDocument()
    expect(within(plano).getByRole('button', { name: 'Zona lago menor, radio 50 m: No determinado' })).toBeInTheDocument()
    expect(within(plano).getByRole('button', { name: 'Zona calzada, sin radio: Infestado' })).toBeInTheDocument()
  })

  it('al elegir un punto pide y muestra su historial de análisis', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/analisis': (url) => json(200, url.searchParams.get('zona') === 'c1' ? ANALISIS.filter((a) => a.idZona === 'c1') : []),
    })
    abrir('#/mapa')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Zona lago menor, radio 50 m: No determinado' }))
    const detalle = screen.getByRole('region', { name: 'Zona lago menor' })
    const items = await within(detalle).findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('No determinado')
    expect(items[1]).toHaveTextContent('Sano')
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?zona=c1&limite=50'])
    await user.click(within(detalle).getByRole('button', { name: 'Ver todos los puntos' }))
    expect(screen.queryByRole('region', { name: 'Zona lago menor' })).not.toBeInTheDocument()
  })

  it('un punto sin análisis lo dice sin pedir nada', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Pino del cerro (Pinus hartwegii): Sin análisis' }))
    expect(within(screen.getByRole('region', { name: 'Pino del cerro' })).getByText('Todavía no tiene análisis.')).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/analisis')).toEqual([])
  })

  it('la lista de puntos es la alternativa accesible al mapa', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/mapa')
    const lista = await screen.findByRole('list', { name: 'Puntos registrados' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(5)
  })
})

describe('fotos de evidencia', () => {
  it('solo los análisis con foto ofrecen verla', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/analisis')
    const tabla = await screen.findByRole('table', { name: 'Análisis' })
    expect(within(tabla).getAllByRole('button', { name: /^Ver foto/ })).toHaveLength(4)
    expect(within(tabla).queryByRole('button', { name: 'Ver foto del 8 oct 2026, 05:00' })).not.toBeInTheDocument()
  })

  it('abre la foto firmada en un diálogo y se puede cerrar', async () => {
    conSesion()
    mockBackend(fetchMock)
    abrir('#/analisis')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Corteza, 3 oct 2026, 09:10' })
    const foto = await within(dialogo).findByRole('img', { name: 'Foto de corteza capturada el 3 oct 2026, 09:10. Resultado: Infestado.' })
    expect(foto).toHaveAttribute('src', 'https://descortezadores-archivos-prod.s3.amazonaws.com/evidencias/e1.jpg?X-Amz-Signature=prueba')
    expect(llamadasA(fetchMock, '/analisis/e1/evidencia')).toHaveLength(1)
    await user.click(within(dialogo).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si la foto no está disponible lo explica en el diálogo', async () => {
    conSesion()
    mockBackend(fetchMock, { '/analisis/:id/evidencia': json(404, { message: 'Este análisis no tiene foto disponible.' }) })
    abrir('#/analisis')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }))
    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Este análisis no tiene foto disponible.')
  })

  it('el historial del mapa también ofrece la foto', async () => {
    conSesion()
    mockBackend(fetchMock, {
      '/analisis': (url) => json(200, url.searchParams.get('arbol') === 'b1' ? ANALISIS.filter((a) => a.idArbol === 'b1') : []),
    })
    abrir('#/mapa')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' }))
    await user.click(await screen.findByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }))
    expect(await screen.findByRole('dialog', { name: 'Corteza, 3 oct 2026, 09:10' })).toBeInTheDocument()
  })
})

describe('administración', () => {
  it('lista cuentas y dispositivos para un administrador', async () => {
    conSesion(['ADMINISTRADOR'], 'admin@sheets.tt')
    mockBackend(fetchMock)
    abrir('#/admin')
    const cuentas = await screen.findByRole('table', { name: 'Cuentas' })
    const baja = within(cuentas).getByRole('row', { name: /baja@sheets\.tt/ })
    expect(baja).toHaveTextContent('Experto de campo')
    expect(baja).toHaveTextContent('Desactivada')
    const dispositivos = await screen.findByRole('table', { name: 'Dispositivos' })
    expect(within(dispositivos).getByRole('row', { name: /demo-pixel-7-pro/ })).toHaveTextContent('demo@sheets.tt')
  })

  it('si el backend responde 403 lo explica sin cerrar la sesión', async () => {
    conSesion(['ADMINISTRADOR'], 'admin@sheets.tt')
    mockBackend(fetchMock, { '/cuentas': json(403), '/dispositivos': json(403) })
    abrir('#/admin')
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Tu cuenta no tiene permiso para ver esta sección.')
    expect(sessionStorage.getItem('sheets-tt.session')).not.toBeNull()
  })
})

describe('carga', () => {
  it.each([
    ['#/', 'Cargando el resumen…'],
    ['#/mapa', 'Cargando el mapa…'],
    ['#/analisis', 'Cargando análisis…'],
  ])('%s muestra un esqueleto con su forma y lo anuncia', async (hash, aviso) => {
    conSesion()
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
    abrir(hash)
    const estado = await screen.findByRole('status')
    expect(estado).toHaveTextContent(aviso)
    // El esqueleto es decorativo y la región queda marcada como ocupada.
    expect(estado.closest('[aria-busy="true"]')).toBeInTheDocument()
    const huesos = [...estado.closest('[aria-busy="true"]')!.querySelectorAll('.hueso')]
    expect(huesos.length).toBeGreaterThan(0)
    for (const h of huesos) expect(h.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
