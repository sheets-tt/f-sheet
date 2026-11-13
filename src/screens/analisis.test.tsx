import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { conSesion, llamadasA, mockBackend } from '../test/backend'

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
  conSesion()
})

afterEach(() => {
  Object.assign(proto, originales)
  vi.unstubAllGlobals()
})

async function abrir(hash = '#/analisis') {
  mockBackend(fetchMock)
  window.location.hash = hash
  render(<App />)
  await screen.findByRole('group', { name: 'Por resultado' })
  return userEvent.setup()
}

const consulta = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '')
const filas = () => within(screen.getByRole('table', { name: 'Análisis' })).getAllByRole('row').slice(1)
const caja = (nombre: RegExp) => screen.getByRole('button', { name: nombre })

describe('Análisis: cajas por categoría', () => {
  it('cuentan los análisis cargados por resultado, tipo, confianza y atención', async () => {
    await abrir()
    expect(caja(/^Sano: 2 análisis, 40 %$/)).toHaveAttribute('aria-pressed', 'false')
    expect(caja(/^Infestado: 2 análisis, 40 %$/)).toBeInTheDocument()
    expect(caja(/^No determinado: 1 análisis, 20 %$/)).toBeInTheDocument()
    expect(caja(/^Corteza: 2 análisis, 40 %$/)).toBeInTheDocument()
    expect(caja(/^Follaje: 3 análisis, 60 %$/)).toBeInTheDocument()
    expect(caja(/^Alta: 3 análisis, 60 % \(80 % o más\)$/)).toBeInTheDocument()
    expect(caja(/^Baja: 1 análisis, 20 % \(menos de 50 %\)$/)).toBeInTheDocument()
    expect(caja(/^Sin confianza: 0 análisis, 0 %/)).toBeInTheDocument()
    expect(caja(/^Requieren atención: 3 análisis, 60 % \(infestados, no determinados, confianza baja o error de sincronización\)$/)).toBeInTheDocument()
    // La tabla sigue siendo la vista por defecto, con la misma consulta de siempre.
    expect(filas()).toHaveLength(5)
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?limite=100'])
  })

  it('un clic filtra; dentro de un grupo suman y entre grupos se cruzan; queda en la URL y en chips', async () => {
    const user = await abrir()
    await user.click(caja(/^Sano:/))
    await waitFor(() => expect(consulta().get('caja_resultado')).toBe('sano'))
    expect(caja(/^Sano:/)).toHaveAttribute('aria-pressed', 'true')
    expect(filas()).toHaveLength(2)
    await user.click(caja(/^No determinado:/))
    await waitFor(() => expect(filas()).toHaveLength(3))
    await user.click(caja(/^Follaje:/))
    await waitFor(() => expect(filas()).toHaveLength(2))
    expect(window.location.hash).toBe('#/analisis?caja_resultado=sano%2Cno_determinado&caja_tipo=follaje')
    expect(screen.getByRole('status')).toHaveTextContent('2 de 5 análisis.')
    const chips = screen.getByRole('region', { name: 'Cajas elegidas' })
    expect(within(chips).getAllByRole('listitem').map((c) => c.textContent)).toEqual(['Resultado: Sano', 'Resultado: No determinado', 'Tipo: Follaje'])
    // Quitar un chip pasa el foco al siguiente.
    await user.click(within(chips).getByRole('button', { name: 'Quitar Resultado: Sano' }))
    await waitFor(() => expect(within(chips).getByRole('button', { name: 'Quitar Resultado: No determinado' })).toHaveFocus())
    // "Quitar filtros" (el de siempre) también quita las cajas.
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    await waitFor(() => expect(window.location.hash).toBe('#/analisis'))
    expect(filas()).toHaveLength(5)
  })

  it('"Requieren atención" y confianza baja desde la URL; sin coincidencias ofrece quitar la selección', async () => {
    const user = await abrir('#/analisis?atencion=1&caja_confianza=baja')
    expect(filas()).toHaveLength(1)
    expect(filas()[0]).toHaveTextContent('No determinado')
    await user.click(caja(/^Sin confianza:/))
    await user.click(caja(/^Baja:/))
    expect(await screen.findByText('Ninguno de los análisis cargados cumple las cajas elegidas.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar selección' }))
    await waitFor(() => expect(window.location.hash).toBe('#/analisis'))
  })

  it('los filtros del formulario siguen consultando al backend y se leen de la URL', async () => {
    await abrir('#/analisis?tipo=follaje')
    expect(screen.getByLabelText('Tipo')).toHaveValue('follaje')
    expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?tipo=follaje&limite=100'])
  })
})

describe('Análisis: vista de tarjetas, agrupación y detalle', () => {
  it('Tarjetas | Tabla: se recuerda en la URL y en el navegador', async () => {
    const user = await abrir()
    const vista = screen.getByRole('group', { name: 'Vista' })
    expect(within(vista).getByRole('button', { name: 'Tabla' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(vista).getByRole('button', { name: 'Tarjetas' }))
    await waitFor(() => expect(consulta().get('vista')).toBe('tarjetas'))
    const tarjetas = screen.getByRole('list', { name: 'Análisis' })
    expect(within(tarjetas).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(localStorage.getItem('sheets-tt.analisis.vista')).toBe('tarjetas')
    // La tarjeta dice resultado, confianza, tipo, lugar (con enlace) y observaciones.
    const e1 = within(tarjetas).getAllByRole('article').at(-1)!
    expect(e1).toHaveTextContent('3 oct 2026, 09:10')
    expect(e1).toHaveTextContent('Infestado')
    expect(e1).toHaveTextContent('Confianza 91 % · Alta')
    expect(within(e1).getByRole('link', { name: 'Oyamel del lago' })).toHaveAttribute('href', '#/arbol/b1')
    expect(e1).toHaveTextContent('Galerías visibles')
    expect(e1).toHaveTextContent('Requiere atención: infestado')
  })

  it('sin vista en la URL usa la guardada', async () => {
    localStorage.setItem('sheets-tt.analisis.vista', 'tarjetas')
    await abrir()
    expect(screen.getByRole('list', { name: 'Análisis' })).toBeInTheDocument()
  })

  it('agrupar por árbol o zona: secciones plegables con su resumen y enlace al seguimiento', async () => {
    const user = await abrir()
    await user.selectOptions(screen.getByLabelText('Agrupar por'), 'lugar')
    await waitFor(() => expect(consulta().get('agrupar')).toBe('lugar'))
    const grupos = document.querySelectorAll('details.grupo')
    expect(grupos).toHaveLength(4)
    expect(grupos[0].querySelector('summary')).toHaveTextContent('Zona lago menor2 análisis: 1 sano, 1 no determinado · 1 requiere atención')
    expect(within(grupos[0] as HTMLElement).getByRole('link', { name: 'Ver seguimiento de Zona lago menor' })).toHaveAttribute('href', '#/zona/c1')
    expect(within(grupos[0] as HTMLElement).getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('table', { name: 'Zona calzada' })).toBeInTheDocument()
    await user.click(grupos[0].querySelector('summary')!)
    expect(grupos[0]).not.toHaveAttribute('open')
  })

  it('agrupar por día', async () => {
    const user = await abrir()
    await user.selectOptions(screen.getByLabelText('Agrupar por'), 'dia')
    const resumenes = [...document.querySelectorAll('details.grupo summary .grupo-titulo')].map((s) => s.textContent)
    expect(resumenes[0]).toBe('Jueves, 8 de octubre de 2026')
    expect(resumenes).toHaveLength(5)
  })

  it('el detalle muestra todo, la foto, enlaces y el anterior/siguiente del mismo lugar', async () => {
    const user = await abrir()
    const boton = screen.getByRole('button', { name: 'Ver detalle del 4 oct 2026, 06:00' })
    await user.click(boton)
    const dialogo = screen.getByRole('dialog', { name: 'Análisis del 4 oct 2026, 06:00' })
    expect(await within(dialogo).findByRole('img', { name: /^Foto de follaje capturada el 4 oct 2026, 06:00/ })).toBeInTheDocument()
    expect(dialogo).toHaveTextContent('Confianza95 % (alta)')
    expect(dialogo).toHaveTextContent('Requiere atenciónNo')
    expect(within(dialogo).getByRole('img', { name: /^Cromático/ })).toBeInTheDocument()
    expect(within(dialogo).getByRole('link', { name: 'Ver seguimiento de Zona lago menor' })).toHaveAttribute('href', '#/zona/c1')
    expect(within(dialogo).getByRole('link', { name: 'Ver en Gráficos' })).toHaveAttribute('href', '#/graficos?zona=c1')
    expect(within(dialogo).getByRole('button', { name: 'Anterior de este lugar' })).toBeDisabled()
    expect(dialogo).toHaveTextContent('Es el más antiguo de este lugar entre los cargados. Solo se recorren los análisis que trajeron los filtros de arriba.')
    await user.click(within(dialogo).getByRole('button', { name: 'Siguiente de este lugar' }))
    expect(screen.getByRole('dialog', { name: 'Análisis del 7 oct 2026, 03:00' })).toHaveTextContent('No determinado, Confianza baja')
    // El botón usado queda deshabilitado (último de ese lugar): el foco pasa a Cerrar.
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' })).toHaveFocus())
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(boton).toHaveFocus())
  })

  it('una tarjeta abre el detalle con el teclado; sin foto lo dice', async () => {
    const user = await abrir('#/analisis?vista=tarjetas')
    const tarjeta = screen.getByRole('button', { name: 'Ver detalle del análisis del 8 oct 2026, 05:00' })
    tarjeta.focus()
    await user.keyboard('{Enter}')
    const dialogo = screen.getByRole('dialog', { name: 'Análisis del 8 oct 2026, 05:00' })
    expect(dialogo).toHaveTextContent('Este análisis no tiene foto.')
    expect(dialogo).toHaveTextContent('Infestado, Error de sincronización')
    await user.keyboard('{Escape}')
    ;(screen.getByRole('dialog') as HTMLDialogElement).close()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('Análisis: URL inválida (A1, obs 4)', () => {
  it.each([['desde=2026-13-45'], ['hasta=2026-10-32'], ['desde=9999-99-99'], ['desde=2026-02-30&hasta=2026-02-31']])(
    '#/analisis?%s no rompe la pantalla y se normaliza',
    async (q) => {
      await abrir(`#/analisis?${q}`)
      expect(screen.getByRole('heading', { level: 1, name: 'Análisis' })).toBeInTheDocument()
      await waitFor(() => expect(window.location.hash).toBe('#/analisis'))
      expect(screen.getByLabelText('Desde')).toHaveValue('')
      expect(llamadasA(fetchMock, '/analisis')).toEqual(['/api/analisis?limite=100'])
    },
  )

  it('cajas repetidas o desconocidas se normalizan sin paso nuevo en el historial', async () => {
    const largo = window.history.length
    await abrir('#/analisis?caja_resultado=sano,sano,x&vista=lista&agrupar=mes&otro=1')
    await waitFor(() => expect(window.location.hash).toBe('#/analisis?caja_resultado=sano'))
    expect(window.history.length).toBe(largo + 1) // solo el de abrir la pantalla
  })
})

describe('Análisis: miniaturas (obs 1)', () => {
  it('si la imagen falla (firma caducada), pide una firma nueva una sola vez', async () => {
    // jsdom no tiene IntersectionObserver: uno que dice "visible" al observar.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private cb: IntersectionObserverCallback) {}
        observe() {
          this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        disconnect() {}
      },
    )
    await abrir('#/analisis?vista=tarjetas&caja_resultado=infestado&caja_tipo=corteza')
    const tarjeta = screen.getByRole('article')
    const img = await waitFor(() => {
      const i = tarjeta.querySelector('img')
      expect(i).not.toBeNull()
      return i!
    })
    expect(llamadasA(fetchMock, '/analisis/e1/evidencia')).toHaveLength(1)
    fireEvent.error(img)
    await waitFor(() => expect(llamadasA(fetchMock, '/analisis/e1/evidencia')).toHaveLength(2))
    const nueva = await waitFor(() => {
      const i = tarjeta.querySelector('img')
      expect(i).not.toBeNull()
      return i!
    })
    fireEvent.error(nueva)
    expect(await within(tarjeta).findByText('Foto no disponible')).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/analisis/e1/evidencia')).toHaveLength(2)
  })
})

