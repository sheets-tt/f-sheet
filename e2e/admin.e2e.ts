import { ADMIN, CONTRASENA, EXPERTO, entrar, expect, test } from './ayuda'

test.describe('Administración', () => {
  test('un administrador ve cuentas y dispositivos sin datos sensibles', async ({ page }) => {
    await entrar(page, ADMIN)
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' }).click()

    const cuentas = page.getByRole('table', { name: 'Cuentas' })
    // Las demás pruebas pueden haber creado cuentas en paralelo: se revisan las de db/demo.
    for (const correo of [ADMIN, EXPERTO, 'baja@sheets.tt']) await expect(cuentas.getByRole('row').filter({ hasText: correo })).toHaveCount(1)
    const baja = cuentas.getByRole('row').filter({ hasText: 'baja@sheets.tt' })
    await expect(baja).toContainText('Experto de campo')
    await expect(baja).toContainText('Desactivada')

    const dispositivos = page.getByRole('table', { name: 'Dispositivos' })
    await expect(dispositivos.getByRole('row').filter({ hasText: 'demo-pixel-7-pro' })).toContainText('demo@sheets.tt')

    // Ni hashes bcrypt ni tokens de dispositivo llegan al navegador.
    const cuerpo = await page.content()
    expect(cuerpo).not.toContain('$2a$')
    expect(cuerpo.toLowerCase()).not.toContain('token')
  })

  test('el administrador crea, edita, desactiva y reactiva una cuenta de experto', async ({ page, browser }) => {
    // Correo único: la BD se comparte entre pruebas y corridas en paralelo.
    const correo = `experta.${Date.now().toString(36)}@sheets.tt`
    const nueva = 'NuevaClave2026'

    await entrar(page, ADMIN)
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' }).click()
    const cuentas = page.getByRole('table', { name: 'Cuentas' })
    await expect(cuentas).toBeVisible()

    // La cuenta propia está protegida.
    const propia = cuentas.getByRole('row').filter({ hasText: ADMIN })
    await expect(propia.getByRole('button', { name: `Desactivar ${ADMIN}` })).toBeDisabled()

    // Crear
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    let dialogo = page.getByRole('dialog', { name: 'Crear cuenta' })
    await dialogo.getByLabel('Nombre completo').fill('Experta de Prueba')
    await dialogo.getByLabel('Correo').fill(correo)
    await dialogo.getByLabel('Rol').selectOption('EXPERTO_CAMPO')
    await dialogo.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
    await dialogo.getByLabel('Confirmar contraseña').fill(CONTRASENA)
    await dialogo.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta creada: ${correo}.` })).toBeVisible()
    await expect(dialogo).toBeHidden()
    const fila = cuentas.getByRole('row').filter({ hasText: correo })
    await expect(fila).toContainText('Experto de campo')
    await expect(fila).toContainText('Activa')

    // El correo ya existe: 409 del backend en el campo Correo.
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    dialogo = page.getByRole('dialog', { name: 'Crear cuenta' })
    await dialogo.getByLabel('Nombre completo').fill('Duplicada')
    await dialogo.getByLabel('Correo').fill(correo)
    await dialogo.getByLabel('Rol').selectOption('EXPERTO_CAMPO')
    await dialogo.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
    await dialogo.getByLabel('Confirmar contraseña').fill(CONTRASENA)
    await dialogo.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(dialogo.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true')
    await page.keyboard.press('Escape')
    await expect(dialogo).toBeHidden()

    // Editar: nombre y contraseña nueva.
    await page.getByRole('button', { name: `Editar ${correo}` }).click()
    dialogo = page.getByRole('dialog', { name: 'Editar cuenta' })
    await dialogo.getByLabel('Nombre completo').fill('Experta Editada')
    await dialogo.getByLabel('Contraseña nueva').fill(nueva)
    await dialogo.getByLabel('Confirmar contraseña').fill(nueva)
    await dialogo.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cambios guardados: ${correo}.` })).toBeVisible()
    await expect(fila).toContainText('Experta Editada')

    // La cuenta nueva entra con la contraseña nueva y no ve Administración.
    const otra = await browser.newContext({ baseURL: test.info().project.use.baseURL })
    const experta = await otra.newPage()
    await experta.goto('/#/login')
    await experta.getByLabel('Usuario').fill(correo)
    await experta.getByLabel('Contraseña').fill(nueva)
    await experta.getByRole('button', { name: 'Entrar' }).click()
    await expect(experta.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
    await expect(experta.getByRole('navigation', { name: 'Secciones' }).getByRole('link')).toHaveText(['Resumen', 'Mapa', 'Análisis', 'Gráficos'])
    await otra.close()

    // Desactivar (con confirmación) y reactivar.
    await page.getByRole('button', { name: `Desactivar ${correo}` }).click()
    await page.getByRole('dialog', { name: '¿Desactivar cuenta?' }).getByRole('button', { name: 'Desactivar cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta desactivada: ${correo}.` })).toBeVisible()
    await expect(fila).toContainText('Desactivada')

    await page.getByRole('button', { name: `Activar ${correo}` }).click()
    await page.getByRole('dialog', { name: '¿Activar cuenta?' }).getByRole('button', { name: 'Activar cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta activada: ${correo}.` })).toBeVisible()
    await expect(fila).toContainText('Activa')

    // Al recargar, lo guardado viene del backend.
    await page.reload()
    await expect(page.getByRole('table', { name: 'Cuentas' }).getByRole('row').filter({ hasText: correo })).toContainText('Experta Editada')
  })

  test('un administrador que cambia su propio correo vuelve a entrar con el correo nuevo', async ({ page, browser }) => {
    // Una cuenta de administrador nueva: cambiar el correo de admin@sheets.tt rompería las demás pruebas.
    const sufijo = Date.now().toString(36)
    const correo = `jefa.${sufijo}@sheets.tt`
    const nuevo = `jefa.nueva.${sufijo}@sheets.tt`

    await entrar(page, ADMIN)
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' }).click()
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const alta = page.getByRole('dialog', { name: 'Crear cuenta' })
    await alta.getByLabel('Nombre completo').fill('Jefa de Prueba')
    await alta.getByLabel('Correo').fill(correo)
    await alta.getByLabel('Rol').selectOption('ADMINISTRADOR')
    await alta.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA)
    await alta.getByLabel('Confirmar contraseña').fill(CONTRASENA)
    await alta.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Cuenta creada: ${correo}.` })).toBeVisible()

    const contexto = await browser.newContext({ baseURL: test.info().project.use.baseURL })
    const jefa = await contexto.newPage()
    await entrar(jefa, correo)
    await jefa.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Administración' }).click()
    await jefa.getByRole('button', { name: `Editar ${correo}` }).click()
    const edicion = jefa.getByRole('dialog', { name: 'Editar cuenta' })
    await edicion.getByLabel('Correo').fill(nuevo)
    await expect(edicion.getByText('Al cambiar tu correo tendrás que iniciar sesión de nuevo con el correo nuevo.')).toBeVisible()
    await edicion.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(jefa.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(jefa.getByRole('status')).toHaveText(`Correo actualizado. Inicia sesión con ${nuevo}.`)
    await expect(jefa.getByLabel('Usuario')).toHaveValue(nuevo)
    await expect(jefa.getByLabel('Contraseña')).toBeFocused()
    await jefa.getByLabel('Contraseña').fill(CONTRASENA)
    await jefa.getByRole('button', { name: 'Entrar' }).click()
    await expect(jefa.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
    await contexto.close()
  })
})
