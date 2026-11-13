import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { conSesion, json, llamadasA, mockBackend } from '../test/backend'

const fetchMock = vi.fn<typeof fetch>()

// jsdom no implementa showModal/close: se imitan como en el navegador (ver FotoEvidencia.test.tsx).
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
  window.location.hash = ''
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  Object.assign(proto, originales)
  vi.unstubAllGlobals()
})

async function abrirAdmin(rutas: Parameters<typeof mockBackend>[1] = {}) {
  conSesion(['ADMINISTRADOR'], 'admin@sheets.tt')
  mockBackend(fetchMock, rutas)
  window.location.hash = '#/admin'
  render(<App />)
  const tabla = await screen.findByRole('table', { name: 'Cuentas' })
  return { user: userEvent.setup(), tabla }
}

function fila(tabla: HTMLElement, correo: string) {
  return within(tabla).getByRole('row', { name: new RegExp(correo.replace(/[.@]/g, '\\$&')) })
}

/** Cuerpo JSON de la última petición con ese método a esa ruta. */
function cuerpo(metodo: string, ruta: string): unknown {
  const llamada = fetchMock.mock.calls.filter(([u, init]) => String(u) === `/api${ruta}` && init?.method === metodo).at(-1)
  return llamada ? JSON.parse(String(llamada[1]?.body)) : undefined
}

async function llenar(user: ReturnType<typeof userEvent.setup>, dialogo: HTMLElement, campos: Record<string, string>) {
  for (const [etiqueta, valor] of Object.entries(campos)) {
    const campo = within(dialogo).getByLabelText(etiqueta)
    if (campo instanceof HTMLSelectElement) await user.selectOptions(campo, valor)
    else {
      await user.clear(campo)
      if (valor) await user.type(campo, valor)
    }
  }
}

describe('gestión de cuentas', () => {
  it('no hay registro público: el login no ofrece crear cuenta', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: 'Iniciar sesión' })
    expect(screen.queryByText(/regístrate|registrarse|crear cuenta/i)).not.toBeInTheDocument()
  })

  it('un experto no ve Administración ni llega a pedir cuentas', async () => {
    conSesion(['EXPERTO_CAMPO'])
    mockBackend(fetchMock)
    window.location.hash = '#/admin'
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Resumen' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Crear cuenta' })).not.toBeInTheDocument()
    expect(llamadasA(fetchMock, '/cuentas')).toEqual([])
  })

  it('valida en el navegador antes de enviar y marca cada campo', async () => {
    const { user } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const dialogo = screen.getByRole('dialog', { name: 'Crear cuenta' })
    expect(within(dialogo).getByLabelText('Nombre completo')).toHaveFocus()

    await llenar(user, dialogo, { Correo: 'ana@', Contraseña: 'Corta1' })
    await user.click(within(dialogo).getByRole('button', { name: 'Crear cuenta' }))

    const nombre = within(dialogo).getByLabelText('Nombre completo')
    expect(nombre).toHaveAttribute('aria-invalid', 'true')
    expect(nombre).toHaveAccessibleDescription('Escribe el nombre completo.')
    expect(nombre).toHaveFocus()
    expect(within(dialogo).getByLabelText('Correo')).toHaveAccessibleDescription('Escribe un correo válido, como nombre@dominio.mx.')
    expect(within(dialogo).getByLabelText('Rol')).toHaveAccessibleDescription('Elige un rol.')
    expect(within(dialogo).getByLabelText('Contraseña')).toHaveAccessibleDescription(/Usa al menos 8 caracteres\./)
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('crea una cuenta, la muestra en la tabla y lo confirma', async () => {
    const { user, tabla } = await abrirAdmin()
    const boton = screen.getByRole('button', { name: 'Crear cuenta' })
    await user.click(boton)
    const dialogo = screen.getByRole('dialog', { name: 'Crear cuenta' })
    await llenar(user, dialogo, {
      'Nombre completo': ' Ana Pérez ',
      Correo: 'ana@sheets.tt',
      Rol: 'EXPERTO_CAMPO',
      Contraseña: 'Segura123',
      'Confirmar contraseña': 'Segura123',
    })
    await user.click(within(dialogo).getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Cuenta creada: ana@sheets.tt.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cuerpo('POST', '/cuentas')).toEqual({
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@sheets.tt',
      rol: 'EXPERTO_CAMPO',
      contrasena: 'Segura123',
    })
    const nueva = fila(tabla, 'ana@sheets.tt')
    expect(nueva).toHaveTextContent('Experto de campo')
    expect(nueva).toHaveTextContent('Activa')
    await waitFor(() => expect(boton).toHaveFocus())
    // Se actualiza en su sitio: no se vuelve a pedir la lista.
    expect(llamadasA(fetchMock, '/cuentas').length).toBe(2) // GET inicial + POST
  })

  it('409 por correo repetido: el error aparece en el campo Correo', async () => {
    const { user } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const dialogo = screen.getByRole('dialog', { name: 'Crear cuenta' })
    await llenar(user, dialogo, {
      'Nombre completo': 'Otra Demo',
      Correo: 'DEMO@sheets.tt',
      Rol: 'EXPERTO_CAMPO',
      Contraseña: 'Segura123',
      'Confirmar contraseña': 'Segura123',
    })
    await user.click(within(dialogo).getByRole('button', { name: 'Crear cuenta' }))

    const correo = within(dialogo).getByLabelText('Correo')
    await waitFor(() => expect(correo).toHaveAttribute('aria-invalid', 'true'))
    expect(correo).toHaveAccessibleDescription('Ya existe una cuenta con ese correo.')
    await waitFor(() => expect(correo).toHaveFocus())
    expect(screen.getByRole('dialog', { name: 'Crear cuenta' })).toBeInTheDocument()
  })

  it('otros errores del servidor se muestran como alerta en el formulario', async () => {
    const { user } = await abrirAdmin({ '/cuentas/:id': json(500, { message: 'Base de datos no disponible.' }) })
    await user.click(screen.getByRole('button', { name: 'Editar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Base de datos no disponible.')
    expect(within(dialogo).getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
  })

  it('el botón de guardar se desactiva mientras se envía', async () => {
    const { user } = await abrirAdmin({ '/cuentas/:id': () => new Promise<Response>(() => {}) })
    await user.click(screen.getByRole('button', { name: 'Editar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    expect(within(dialogo).getByRole('button', { name: 'Guardando cambios…' })).toBeDisabled()
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('edita una cuenta sin cambiar la contraseña (no la envía)', async () => {
    const { user, tabla } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Editar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    expect(within(dialogo).getByLabelText('Nombre completo')).toHaveValue('Usuario Demo')
    expect(within(dialogo).getByLabelText('Contraseña nueva')).toHaveAccessibleDescription(/Déjala vacía para conservar la actual/)

    await llenar(user, dialogo, { 'Nombre completo': 'Usuaria Demo', Rol: 'ADMINISTRADOR' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Cambios guardados: demo@sheets.tt.')).toBeInTheDocument()
    expect(cuerpo('PUT', '/cuentas/a1')).toEqual({ nombreCompleto: 'Usuaria Demo', correo: 'demo@sheets.tt', rol: 'ADMINISTRADOR' })
    expect(fila(tabla, 'demo@sheets.tt')).toHaveTextContent('Usuaria Demo')
    expect(fila(tabla, 'demo@sheets.tt')).toHaveTextContent('Administrador')
  })

  it('desactiva y vuelve a activar con un paso de confirmación', async () => {
    const { user, tabla } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Desactivar demo@sheets.tt' }))
    const confirmar = screen.getByRole('dialog', { name: '¿Desactivar cuenta?' })
    expect(confirmar).toHaveAccessibleDescription(/Usuario Demo \(demo@sheets\.tt\) no podrá iniciar sesión/)
    // Cancelar no cambia nada.
    await user.click(within(confirmar).getByRole('button', { name: 'Cancelar' }))
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Desactivar demo@sheets.tt' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar cuenta' }))
    expect(await screen.findByText('Cuenta desactivada: demo@sheets.tt.')).toBeInTheDocument()
    expect(llamadasA(fetchMock, '/cuentas/a1/desactivar')).toHaveLength(1)
    expect(fila(tabla, 'demo@sheets.tt')).toHaveTextContent('Desactivada')

    await user.click(screen.getByRole('button', { name: 'Activar demo@sheets.tt' }))
    await user.click(within(screen.getByRole('dialog', { name: '¿Activar cuenta?' })).getByRole('button', { name: 'Activar cuenta' }))
    expect(await screen.findByText('Cuenta activada: demo@sheets.tt.')).toBeInTheDocument()
    expect(fila(tabla, 'demo@sheets.tt')).toHaveTextContent('Activa')
  })

  it('Esc cierra el diálogo sin guardar', async () => {
    const { user } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    ;(screen.getByRole('dialog') as HTMLDialogElement).close()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('la cuenta propia no se puede desactivar ni perder el rol', async () => {
    const { user, tabla } = await abrirAdmin()
    const propia = fila(tabla, 'admin@sheets.tt')
    expect(propia).toHaveTextContent('(tú)')
    const desactivar = within(propia).getByRole('button', { name: 'Desactivar admin@sheets.tt' })
    expect(desactivar).toBeDisabled()
    expect(desactivar).toHaveAccessibleDescription('Es tu cuenta: no puedes desactivarla ni quitarte el rol.')

    await user.click(within(propia).getByRole('button', { name: 'Editar admin@sheets.tt' }))
    const rol = within(screen.getByRole('dialog', { name: 'Editar cuenta' })).getByLabelText('Rol')
    expect(rol).toBeDisabled()
    expect(rol).toHaveAccessibleDescription('Es tu cuenta: no puedes quitarte el rol de administrador.')
  })

  it('si el servidor rechaza desactivar (409) lo explica en la confirmación', async () => {
    const { user } = await abrirAdmin({
      '/cuentas/:id/desactivar': json(409, { message: 'No puedes desactivar tu propia cuenta.' }),
    })
    await user.click(screen.getByRole('button', { name: 'Desactivar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: 'Desactivar cuenta' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('No puedes desactivar tu propia cuenta.')
  })

  it('filtra por nombre, rol y estado', async () => {
    const { user, tabla } = await abrirAdmin()
    expect(within(tabla).getAllByRole('row')).toHaveLength(4)
    await user.selectOptions(screen.getByLabelText('Estado'), 'desactivada')
    expect(within(tabla).getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('1 de 3 cuentas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    await user.type(screen.getByLabelText('Buscar'), 'nadie')
    expect(within(tabla).getByText('Ninguna cuenta coincide con los filtros.')).toBeInTheDocument()
  })

  it('una contraseña de solo espacios no se envía al editar', async () => {
    const { user } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Editar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    await llenar(user, dialogo, { 'Contraseña nueva': '         ', 'Confirmar contraseña': '         ' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    const campo = within(dialogo).getByLabelText('Contraseña nueva')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription(/La contraseña no puede ser solo espacios\./)
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  it('cambiar el correo propio avisa antes y, al guardar, vuelve al login con el correo nuevo', async () => {
    const { user } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Editar admin@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    const aviso = 'Al cambiar tu correo tendrás que iniciar sesión de nuevo con el correo nuevo.'
    // Solo mayúsculas o espacios no cuentan como cambio (b-sheet lo guarda recortado y en minúsculas).
    await llenar(user, dialogo, { Correo: ' Admin@Sheets.tt ' })
    expect(within(dialogo).queryByText(aviso)).not.toBeInTheDocument()

    await llenar(user, dialogo, { Correo: 'Jefa@Sheets.tt' })
    expect(within(dialogo).getByText(aviso)).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Guardar cambios' })).toHaveAccessibleDescription(aviso)
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Correo actualizado. Inicia sesión con jefa@sheets.tt.')
    expect(screen.getByLabelText('Usuario')).toHaveValue('jefa@sheets.tt')
    expect(screen.getByLabelText('Contraseña')).toHaveFocus()
    expect(sessionStorage.getItem('sheets-tt.session')).toBeNull()
    expect(window.location.hash).toBe('#/login')
  })

  it('editar la cuenta propia sin cambiar el correo mantiene la sesión', async () => {
    const { user, tabla } = await abrirAdmin()
    await user.click(screen.getByRole('button', { name: 'Editar admin@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    await llenar(user, dialogo, { 'Nombre completo': 'Administradora Demo' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Cambios guardados: admin@sheets.tt.')).toBeInTheDocument()
    expect(fila(tabla, 'admin@sheets.tt')).toHaveTextContent('(tú)')
    expect(within(fila(tabla, 'admin@sheets.tt')).getByRole('button', { name: 'Desactivar admin@sheets.tt' })).toBeDisabled()
  })

  it('el 409 por último administrador activo se muestra como alerta', async () => {
    const mensaje = 'Debe quedar al menos un administrador activo'
    const { user } = await abrirAdmin({ '/cuentas/:id': json(409, { message: mensaje }) })
    await user.click(screen.getByRole('button', { name: 'Editar demo@sheets.tt' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar cuenta' })
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(mensaje)
    expect(within(dialogo).getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })
})
