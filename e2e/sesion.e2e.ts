import { CONTRASENA, DESACTIVADA, EXPERTO, entrar, expect, test } from './ayuda'

test.describe('Sesión', () => {
  test('sin sesión cualquier ruta lleva al login', async ({ page }) => {
    await page.goto('/#/mapa')
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(page).toHaveURL(/#\/login$/)
  })

  test('contraseña incorrecta: mensaje accesible y sigue en login', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel('Usuario').fill(EXPERTO)
    await page.getByLabel('Contraseña').fill('incorrecta')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.')
    await expect(page.getByLabel('Contraseña')).toHaveValue('')
  })

  test('una cuenta desactivada en la BD no puede entrar', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel('Usuario').fill(DESACTIVADA)
    await page.getByLabel('Contraseña').fill(CONTRASENA)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.')
  })

  test('el correo no distingue mayúsculas y el encabezado muestra el nombre de /me', async ({ page }) => {
    await entrar(page, 'Demo@Sheets.TT')
    await expect(page.getByRole('banner').getByText('Usuario Demo')).toBeVisible()
  })

  test('un token rechazado por el backend devuelve al login con aviso', async ({ page }) => {
    await entrar(page, EXPERTO)
    // Firma inválida: b-sheet responde 401 y la app debe cerrar la sesión sola.
    await page.evaluate(() => {
      const s = JSON.parse(sessionStorage.getItem('sheets-tt.session')!)
      sessionStorage.setItem('sheets-tt.session', JSON.stringify({ ...s, accessToken: 'abc.def.ghi' }))
    })
    await page.goto('/#/analisis')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Tu sesión terminó. Vuelve a iniciar sesión.')
  })

  test('cerrar sesión borra el token', async ({ page }) => {
    await entrar(page, EXPERTO)
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('sheets-tt.session'))).toBeNull()
    await page.goto('/#/')
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  })
})
