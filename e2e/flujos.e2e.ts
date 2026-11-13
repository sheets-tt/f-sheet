import type { Browser, Page } from '@playwright/test'
import { ADMIN, CONTRASENA, crearCuenta, correoUnico, entrar, evidencia, expect, interceptarS3, ir, salir, test } from './ayuda'

// Flujos completos de la aplicación, de punta a punta contra b-sheet real. Cada flujo crea sus
// propias cuentas (correo único): no depende de otro ni del orden en que corran.

/** Una pestaña aparte (otra persona, con su propia sesión). */
async function otraPersona(browser: Browser): Promise<Page> {
  const contexto = await browser.newContext({ baseURL: test.info().project.use.baseURL, locale: 'es-MX', timezoneId: 'America/Mexico_City' })
  return contexto.newPage()
}

test.describe('Flujos completos', () => {
  test('administrador: entra, crea un experto, le cambia nombre y rol, y sale', async ({ page }) => {
    const correo = correoUnico('flujo.experto')
    await entrar(page, ADMIN)
    await evidencia(page, 'resumen-admin')
    await page.getByRole('navigation', { name: 'Ir a' }).getByRole('link', { name: /^Administración/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Administración' })).toBeVisible()

    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const alta = page.getByRole('dialog', { name: 'Crear cuenta' })
    await alta.getByLabel('Nombre completo').fill('Experta del Flujo')
    await alta.getByLabel('Correo').fill(correo)
    await alta.getByLabel('Rol').selectOption('EXPERTO_CAMPO')
    await alta.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
    await alta.getByLabel('Confirmar contraseña').fill(CONTRASENA)
    await evidencia(page, 'formulario-alta')
    await alta.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta creada: ${correo}.` })).toBeVisible()
    const fila = page.getByRole('table', { name: 'Cuentas' }).getByRole('row').filter({ hasText: correo })
    await expect(fila).toContainText('Experto de campo')
    await evidencia(page, 'cuenta-creada')

    await page.getByRole('button', { name: `Editar ${correo}` }).click()
    const edicion = page.getByRole('dialog', { name: 'Editar cuenta' })
    await edicion.getByLabel('Nombre completo').fill('Experta Ascendida')
    await edicion.getByLabel('Rol').selectOption('ADMINISTRADOR')
    await edicion.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cambios guardados: ${correo}.` })).toBeVisible()
    await expect(fila).toContainText('Experta Ascendida')
    await expect(fila).toContainText('Administrador')
    await evidencia(page, 'nombre-y-rol-cambiados')

    await salir(page)
    await evidencia(page, 'sesion-cerrada')
  })

  test('experto: atención en el Resumen → Análisis filtrado → detalle → seguimiento → Gráficos → Atrás → sale', async ({ page, request }) => {
    const experto = await crearCuenta(request, { nombre: 'Experta de Campo' })
    await interceptarS3(page)
    await entrar(page, experto.correo)
    await expect(page.getByRole('banner').getByText('Experta de Campo')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link')).toHaveText(['Resumen', 'Mapa', 'Análisis', 'Gráficos'])
    const atencion = page.getByRole('region', { name: 'Necesita tu atención' })
    await expect(atencion).toContainText('3 análisis requieren atención')
    await evidencia(page, 'resumen-atencion')

    // Análisis ya filtrado por la caja "Infestado".
    await atencion.getByRole('link', { name: /^Infestados: 2\./ }).click()
    await expect(page).toHaveURL(/#\/analisis\?caja_resultado=infestado$/)
    await expect(page.getByRole('table', { name: 'Análisis' }).getByRole('row')).toHaveCount(3)
    await evidencia(page, 'analisis-filtrado')

    // Detalle con su foto firmada.
    await page.getByRole('button', { name: 'Ver detalle del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    await expect(dialogo.getByRole('img', { name: /^Foto de corteza/ })).toBeVisible()
    await evidencia(page, 'detalle')

    // Seguimiento del árbol.
    await dialogo.getByRole('link', { name: 'Ver seguimiento de Oyamel del lago' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
    await evidencia(page, 'seguimiento-arbol')

    // Atrás vuelve a Análisis con la caja todavía elegida.
    await page.goBack()
    await expect(page).toHaveURL(/#\/analisis\?caja_resultado=infestado$/)
    await expect(page.getByRole('button', { name: /^Infestado:/ })).toHaveAttribute('aria-pressed', 'true')

    // Gráficos con filtros, desde el Resumen.
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Resumen' }).click()
    await page.getByRole('link', { name: 'Ver dónde hay más infestación en Gráficos' }).click()
    await expect(page).toHaveURL(/#\/graficos\?resultado=infestado$/)
    await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Resultado: Infestado')
    await evidencia(page, 'graficos-filtrado')
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()

    await salir(page)
  })

  test('el administrador desactiva a un experto con la sesión abierta: lo saca; al reactivarlo vuelve a entrar', async ({ page, browser, request }) => {
    const experto = await crearCuenta(request, { nombre: 'Experto Por Desactivar' })
    const suya = await otraPersona(browser)
    await entrar(suya, experto.correo)
    await evidencia(suya, 'experto-dentro')

    await entrar(page, ADMIN)
    await ir(page, '#/admin', 'Administración')
    await page.getByRole('button', { name: `Desactivar ${experto.correo}` }).click()
    await page.getByRole('dialog', { name: '¿Desactivar cuenta?' }).getByRole('button', { name: 'Desactivar cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta desactivada: ${experto.correo}.` })).toBeVisible()
    await evidencia(page, 'admin-desactiva')

    // Su siguiente petición recibe 401: vuelve al login con el aviso.
    await suya.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Análisis' }).click()
    await expect(suya.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(suya.getByRole('status')).toHaveText('Tu sesión terminó. Vuelve a iniciar sesión.')
    await evidencia(suya, 'experto-fuera')
    await suya.getByLabel('Usuario').fill(experto.correo)
    await suya.getByLabel('Contraseña').fill(CONTRASENA)
    await suya.getByRole('button', { name: 'Entrar' }).click()
    await expect(suya.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.')

    await page.getByRole('button', { name: `Activar ${experto.correo}` }).click()
    await page.getByRole('dialog', { name: '¿Activar cuenta?' }).getByRole('button', { name: 'Activar cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta activada: ${experto.correo}.` })).toBeVisible()

    await entrar(suya, experto.correo)
    await evidencia(suya, 'experto-de-vuelta')
    await suya.context().close()
  })

  test('un administrador cambia su propio correo y entra con el nuevo', async ({ page, request }) => {
    const jefa = await crearCuenta(request, { rol: 'ADMINISTRADOR', nombre: 'Jefa Del Flujo', prefijo: 'flujo.jefa' })
    const nuevo = correoUnico('flujo.jefa.nueva')
    await entrar(page, jefa.correo)
    await ir(page, '#/admin', 'Administración')
    await page.getByRole('button', { name: `Editar ${jefa.correo}` }).click()
    const edicion = page.getByRole('dialog', { name: 'Editar cuenta' })
    await edicion.getByLabel('Correo').fill(nuevo)
    await expect(edicion.getByText('Al cambiar tu correo tendrás que iniciar sesión de nuevo con el correo nuevo.')).toBeVisible()
    await evidencia(page, 'aviso-cambio-de-correo')
    await edicion.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(page.getByRole('status')).toHaveText(`Correo actualizado. Inicia sesión con ${nuevo}.`)
    await expect(page.getByLabel('Usuario')).toHaveValue(nuevo)
    await evidencia(page, 'login-con-correo-nuevo')
    await page.getByLabel('Contraseña').fill(CONTRASENA)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' })).toBeVisible()
  })
})
