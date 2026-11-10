import { expect, type Page } from '@playwright/test'

/** Cuentas de b-sheet/src/main/resources/db/demo/V2__datos_demo.sql (contraseña Demo1234!). */
export const EXPERTO = 'demo@sheets.tt'
export const ADMIN = 'admin@sheets.tt'
export const DESACTIVADA = 'baja@sheets.tt'
export const CONTRASENA = 'Demo1234!'

/** Inicia sesión por el formulario, como una persona, y espera al resumen. */
export async function entrar(page: Page, correo: string): Promise<void> {
  await page.goto('/#/login')
  await page.getByLabel('Usuario').fill(correo)
  await page.getByLabel('Contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
}

/** Navega por hash y espera a que la pantalla de destino esté pintada (el cambio de hash no recarga). */
export async function ir(page: Page, hash: string, titulo: string): Promise<void> {
  await page.goto(`/${hash}`)
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible()
}

// PNG de 1×1: el contenido da igual, lo que se prueba es la URL que firmó el backend.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Intercepta las descargas del bucket de evidencias (el E2E no habla con AWS) y devuelve las URLs
 * pedidas, para revisar que son las que firmó b-sheet.
 */
export async function interceptarS3(page: Page): Promise<URL[]> {
  const pedidas: URL[] = []
  await page.route(/^https:\/\/descortezadores-archivos-prod\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\//, async (route) => {
    pedidas.push(new URL(route.request().url()))
    await route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
  })
  return pedidas
}
