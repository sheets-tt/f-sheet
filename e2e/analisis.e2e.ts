import type { Page } from '@playwright/test'
import { EXPERTO, entrar, evidencia, expect, interceptarS3, ir, test } from './ayuda'

// Análisis con cajas, tarjetas, agrupación y detalle, sobre los datos de db/demo (5 análisis).
// Cada paso clave queda como captura adjunta (ver evidencia() en ayuda.ts).
const capturar = (page: Page, nombre: string) => evidencia(page, nombre)

test.describe('Análisis', () => {
  test.beforeEach(async ({ page }) => {
    await interceptarS3(page)
    await entrar(page, EXPERTO)
  })

  test('las cajas cuentan y filtran; la tabla sigue como antes', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    const filas = page.getByRole('table', { name: 'Análisis' }).getByRole('row')
    await expect(filas).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Infestado: 2 análisis, 40 %' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Requieren atención: 3 análisis, 60 %/ })).toBeVisible()
    await capturar(page, 'analisis-cajas-claro')

    await page.getByRole('button', { name: 'Infestado: 2 análisis, 40 %' }).click()
    await expect(page).toHaveURL(/#\/analisis\?caja_resultado=infestado$/)
    await expect(filas).toHaveCount(3)
    await page.getByRole('button', { name: /^Corteza:/ }).click()
    await expect(filas).toHaveCount(2)
    await expect(filas.nth(1)).toContainText('3 oct 2026, 09:10')
    await expect(page.getByRole('region', { name: 'Cajas elegidas' })).toContainText('Tipo: Corteza')

    // Atrás deshace la última caja.
    await page.goBack()
    await expect(filas).toHaveCount(3)
    await page.getByRole('button', { name: 'Quitar filtros' }).click()
    await expect(page).toHaveURL(/#\/analisis$/)
    await expect(filas).toHaveCount(6)
  })

  test('tarjetas con miniatura, agrupadas por lugar, y el detalle con foto y enlace al seguimiento', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Tarjetas' }).click()
    const tarjetas = page.getByRole('list', { name: 'Análisis' }).getByRole('article')
    await expect(tarjetas).toHaveCount(5)
    // Miniaturas firmadas y cargadas (4 con foto; e5 no tiene). Se piden al acercarse a la pantalla
    // (IntersectionObserver): se recorre cada tarjeta y, con la suite completa en paralelo, se da más margen.
    for (let i = 0; i < 5; i++) await tarjetas.nth(i).scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.locator('.tarjeta-foto img').evaluateAll((imgs) => imgs.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length), {
        timeout: 15_000,
      })
      .toBe(4)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(tarjetas.filter({ hasText: '8 oct 2026, 05:00' })).toContainText('Sin foto')
    await capturar(page, 'analisis-tarjetas-claro')
    await page.emulateMedia({ colorScheme: 'dark' })
    await capturar(page, 'analisis-tarjetas-oscuro')
    await page.emulateMedia({ colorScheme: 'light' })

    await page.getByLabel('Agrupar por').selectOption('lugar')
    await expect(page.locator('details.grupo')).toHaveCount(4)
    await expect(page.locator('details.grupo').first().locator('summary')).toContainText('Zona lago menor')
    await capturar(page, 'analisis-agrupado')

    // El detalle: foto grande firmada y enlaces.
    await page.getByRole('button', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    const foto = dialogo.getByRole('img', { name: /^Foto de corteza capturada el 3 oct 2026, 09:10/ })
    await expect(foto).toBeVisible()
    await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(dialogo.getByRole('link', { name: 'Ver en Gráficos' })).toHaveAttribute('href', '#/graficos?arbol=b0000000-0000-0000-0000-000000000001')
    await capturar(page, 'analisis-detalle')
    await dialogo.getByRole('link', { name: 'Ver seguimiento de Oyamel del lago' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
    await expect(page).toHaveURL(/#\/arbol\/b0000000-0000-0000-0000-000000000001$/)
  })

  test('el detalle se abre desde la tabla y Esc devuelve el foco', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    const boton = page.getByRole('button', { name: 'Ver detalle del 7 oct 2026, 03:00' })
    await boton.click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 7 oct 2026, 03:00' })
    await expect(dialogo).toContainText('No determinado, Confianza baja')
    await dialogo.getByRole('button', { name: 'Anterior de este lugar' }).click()
    await expect(page.getByRole('dialog', { name: 'Análisis del 4 oct 2026, 06:00' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(boton).toBeFocused()
  })

  test('una fecha inválida en la URL no deja la app en blanco y se normaliza', async ({ page }) => {
    const errores: string[] = []
    page.on('pageerror', (e) => errores.push(e.message))
    for (const q of ['desde=2026-13-45', 'hasta=2026-10-32', 'desde=9999-99-99', 'desde=2026-02-30']) {
      await page.goto(`/#/analisis?${q}`)
      await expect(page).toHaveURL(/#\/analisis$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Análisis' })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
      await expect(page.getByLabel('Desde', { exact: true })).toHaveValue('')
      await expect(page.getByRole('table', { name: 'Análisis' }).getByRole('row')).toHaveCount(6)
    }
    expect(errores).toEqual([])
  })
})
