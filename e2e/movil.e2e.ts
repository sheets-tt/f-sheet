import type { Page } from '@playwright/test'
import { ADMIN, ejeConfianzaSinEncimar, entrar, evidencia, interceptarS3, ir, expect, test } from './ayuda'

// En móvil, si algo desborda a lo ancho, Chrome aleja el zoom de toda la página en vez de mostrar una
// barra: innerWidth crece por encima del ancho del dispositivo. Pasó con la tabla de análisis.
async function sinDesbordeHorizontal(page: Page) {
  const ancho = page.viewportSize()!.width
  await expect.poll(() => page.evaluate(() => Math.max(innerWidth, document.documentElement.scrollWidth))).toBe(ancho)
}

test.describe('Móvil (Pixel 7)', () => {
  test.beforeEach(async ({ page }) => {
    await interceptarS3(page)
    await entrar(page, ADMIN)
  })

  for (const [nombre, hash] of [
    ['Resumen', '#/'],
    ['Mapa', '#/mapa'],
    ['Análisis', '#/analisis'],
    ['Gráficos', '#/graficos'],
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

  test('las marcas del mapa se pueden ver y tocar', async ({ page }) => {
    await ir(page, '#/mapa', 'Mapa')
    const punto = page.getByRole('group', { name: /^Mapa de campo/ }).getByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' })
    const marca = (await punto.locator('.forma').boundingBox())!
    const toque = (await punto.boundingBox())!
    expect(Math.min(marca.width, marca.height)).toBeGreaterThanOrEqual(8)
    expect(Math.min(toque.width, toque.height)).toBeGreaterThanOrEqual(24)
    await punto.tap()
    // El foco pasa al detalle, que en móvil queda debajo del mapa.
    await expect(page.getByRole('region', { name: 'Oyamel del lago' })).toBeInViewport()
  })

  test('el seguimiento de un árbol cabe a lo ancho', async ({ page }) => {
    await ir(page, '#/arbol/b0000000-0000-0000-0000-000000000001', 'Oyamel del lago')
    await expect(page.getByRole('list', { name: 'Línea de tiempo' })).toBeVisible()
    await sinDesbordeHorizontal(page)
  })

  test('el formulario de cuenta cabe en la pantalla y se cierra con Cancelar', async ({ page }) => {
    await ir(page, '#/admin', 'Administración')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Crear cuenta' })
    await expect(dialogo.getByLabel('Nombre completo')).toBeFocused()
    await expect(dialogo.getByRole('button', { name: 'Crear cuenta' })).toBeInViewport()
    await sinDesbordeHorizontal(page)
    await dialogo.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialogo).toBeHidden()
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeFocused()
  })

  test('Gráficos a 360 px: sin desborde horizontal de la página', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await ir(page, '#/graficos', 'Gráficos')
    await expect(page.getByRole('group', { name: /^Mapa de calor/ })).toBeVisible()
    await sinDesbordeHorizontal(page)
    await ejeConfianzaSinEncimar(page)
    // Sin página completa: en el emulador móvil falla con páginas muy altas.
    await evidencia(page, 'graficos-360', { completa: false })
    await page.getByRole('heading', { name: 'Actividad por árbol y zona' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'graficos-360-calor', { completa: false })
    await page.emulateMedia({ colorScheme: 'dark' })
    await evidencia(page, 'graficos-360-oscuro', { completa: false })
  })

  test('Análisis a 360 px: cajas, tarjetas y detalle sin desborde horizontal', async ({ page }) => {
    await interceptarS3(page)
    await page.setViewportSize({ width: 360, height: 780 })
    await ir(page, '#/analisis?vista=tarjetas', 'Análisis')
    await expect(page.getByRole('list', { name: 'Análisis' }).getByRole('article')).toHaveCount(5)
    await sinDesbordeHorizontal(page)
    await evidencia(page, 'analisis-360', { completa: false })
    await page.getByRole('list', { name: 'Análisis' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'analisis-360-tarjetas', { completa: false })
    await page.getByRole('button', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    await expect(dialogo.getByRole('button', { name: 'Cerrar' })).toBeVisible()
    await sinDesbordeHorizontal(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await evidencia(page, 'analisis-360-detalle-oscuro', { completa: false })
  })

  test('Resumen a 360 px: atención, indicadores, gráficas y accesos sin desborde horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await ir(page, '#/', 'Resumen')
    await expect(page.getByRole('group', { name: /^Análisis por día/ })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Ir a' })).toBeVisible()
    await sinDesbordeHorizontal(page)
    await page.getByRole('region', { name: 'Necesita tu atención' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'resumen-360-atencion', { completa: false })
    await page.getByRole('navigation', { name: 'Ir a' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'resumen-360-accesos', { completa: false })
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.getByRole('region', { name: 'Análisis en el tiempo' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'resumen-360-graficas-oscuro', { completa: false })
  })
})
