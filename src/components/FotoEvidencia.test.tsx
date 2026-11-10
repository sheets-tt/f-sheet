import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANALISIS, conSesion, mockBackend } from '../test/backend'
import FotoEvidencia from './FotoEvidencia'

// jsdom no implementa showModal/close. Aquí se imitan como en el navegador: close() quita `open`
// y dispara el evento "close". Sin esto, un bug que solo pasa en navegadores no se ve en tests.
const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>
const originales = { showModal: proto.showModal, close: proto.close }

const fetchMock = vi.fn<typeof fetch>()

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
  conSesion()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  mockBackend(fetchMock)
})

afterEach(() => {
  Object.assign(proto, originales)
  vi.unstubAllGlobals()
})

describe('FotoEvidencia en un navegador real', () => {
  it('sigue abierto con StrictMode (montar, limpiar y volver a montar no lo cierra)', async () => {
    const onCerrar = vi.fn()
    render(
      <StrictMode>
        <FotoEvidencia analisis={ANALISIS[4]} onCerrar={onCerrar} />
      </StrictMode>,
    )
    expect(await screen.findByRole('img', { name: /Foto de corteza/ })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(onCerrar).not.toHaveBeenCalled()
  })

  it('Esc (evento close del navegador) sí avisa que se cerró', async () => {
    const onCerrar = vi.fn()
    render(<FotoEvidencia analisis={ANALISIS[4]} onCerrar={onCerrar} />)
    const dialogo = await screen.findByRole('dialog')
    ;(dialogo as HTMLDialogElement).close()
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })
})
