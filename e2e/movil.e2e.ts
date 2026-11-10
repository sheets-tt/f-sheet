import { expect, test, type Page } from '@playwright/test'
import { ADMIN, entrar, interceptarS3, ir } from './ayuda'

// En móvil, si algo desborda a lo ancho, Chrome aleja el zoom de toda la página en vez de mostrar una
// barra: innerWidth crece por encima del ancho del dispositivo. Pasó con la tabla de análisis.
async function sinDesbordeHorizontal(page: Page) {
  const ancho = page.viewportSize()!.width
  await expect.poll(() => page.evaluate(() => Math.max(innerWidth, document.documentElement.scrollWidth))).toBe(ancho)
}

test.beforeEach(async ({ page }) => {
  await interceptarS3(page)
  await entrar(page, ADMIN)
})

for (const [nombre, hash] of [
  ['Resumen', '#/'],
  ['Mapa', '#/mapa'],
  ['Análisis', '#/analisis'],
  ['Administración', '#/admin'],
] as const) {
  test(`${nombre} cabe a lo ancho`, async ({ page }) => {
    await ir(page, hash, nombre)
    await expect(page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: nombre })).toBeInViewport()
    await sinDesbordeHorizontal(page)
  })
}

test('la foto cabe en la pantalla', async ({ page }) => {
  await ir(page, '#/analisis', 'Análisis')
  await page.getByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }).click()
  const dialogo = page.getByRole('dialog')
  await expect(dialogo.getByRole('img')).toBeVisible()
  await expect(dialogo).toBeInViewport({ ratio: 1 })
  await sinDesbordeHorizontal(page)
})

test('las marcas del plano se pueden ver y tocar', async ({ page }) => {
  await ir(page, '#/mapa', 'Mapa')
  const punto = page.getByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' })
  const marca = (await punto.locator('.punto-marca').boundingBox())!
  const toque = (await punto.locator('.punto-toque').boundingBox())!
  expect(Math.min(marca.width, marca.height)).toBeGreaterThanOrEqual(8)
  expect(Math.min(toque.width, toque.height)).toBeGreaterThanOrEqual(24)
  await punto.tap()
  await expect(page.getByRole('region', { name: 'Oyamel del lago' })).toBeVisible()
})
