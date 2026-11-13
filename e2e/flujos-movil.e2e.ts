import { crearCuenta, entrar, evidencia, expect, interceptarS3, salir, test } from './ayuda'

// El flujo principal del experto en un teléfono (Pixel 7, 360 px de ancho), de punta a punta.

async function sinDesbordeHorizontal(page: import('@playwright/test').Page) {
  const ancho = page.viewportSize()!.width
  await expect.poll(() => page.evaluate(() => Math.max(innerWidth, document.documentElement.scrollWidth))).toBe(ancho)
}

test.describe('Flujos completos (móvil, 360 px)', () => {
  test('experto: Resumen → Análisis filtrado en tarjetas → detalle → seguimiento → sale', async ({ page, request }) => {
    const experto = await crearCuenta(request, { nombre: 'Experta Movil' })
    await page.setViewportSize({ width: 360, height: 780 })
    await interceptarS3(page)
    await entrar(page, experto.correo)
    await sinDesbordeHorizontal(page)
    await evidencia(page, 'resumen', { completa: false })

    const atencion = page.getByRole('region', { name: 'Necesita tu atención' })
    await atencion.getByRole('link', { name: /^Infestados: 2\./ }).click()
    await expect(page).toHaveURL(/#\/analisis\?caja_resultado=infestado$/)
    await page.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Tarjetas' }).click()
    const tarjetas = page.getByRole('list', { name: 'Análisis' }).getByRole('article')
    await expect(tarjetas).toHaveCount(2)
    await sinDesbordeHorizontal(page)
    await tarjetas.first().scrollIntoViewIfNeeded()
    await evidencia(page, 'analisis-tarjetas', { completa: false })

    await page.getByRole('button', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    await expect(dialogo.getByRole('button', { name: 'Cerrar' })).toBeVisible()
    await evidencia(page, 'detalle', { completa: false })
    await dialogo.getByRole('link', { name: 'Ver seguimiento de Oyamel del lago' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
    await sinDesbordeHorizontal(page)
    await evidencia(page, 'seguimiento', { completa: false })

    await salir(page)
  })
})
