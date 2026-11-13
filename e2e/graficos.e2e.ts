import { mkdir } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { ADMIN, EXPERTO, entrar, expect, ir, test } from './ayuda'

// Gráficos con los datos reales de db/demo: 5 análisis del 3 al 8 de octubre de 2026 (CDMX),
// 3 árboles y 2 zonas. E2E_CAPTURAS=<carpeta> guarda capturas en claro y oscuro para revisarlas.
const CAPTURAS = process.env.E2E_CAPTURAS

async function capturar(page: Page, nombre: string) {
  if (!CAPTURAS) return
  await mkdir(CAPTURAS, { recursive: true })
  // La página entra con un fundido de 0.32 s: se espera a que termine.
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: true })
}

const grafica = (page: Page, nombre: RegExp) => page.getByRole('group', { name: nombre })

test('un experto ve Gráficos con los totales del backend en cada gráfica', async ({ page }) => {
  await entrar(page, EXPERTO)
  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Gráficos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Gráficos' })).toBeVisible()
  await expect(grafica(page, /^Análisis por día: 5 análisis en 6 periodos/)).toBeVisible()
  await expect(grafica(page, /^Confianza de 5 análisis en decenas/)).toBeVisible()
  await expect(grafica(page, /^Análisis por árbol y zona: 4 lugares con análisis de 5/)).toBeVisible()
  await expect(grafica(page, /^Mapa de calor de 5 lugares por 6 periodos/)).toBeVisible()
  await expect(page.getByRole('table', { name: 'Análisis de la selección' }).getByRole('row')).toHaveCount(6)
  await capturar(page, 'graficos-claro')
  await page.emulateMedia({ colorScheme: 'dark' })
  await capturar(page, 'graficos-oscuro')
})

test('el tooltip sale con el foco y una barra de lugar abre el seguimiento del árbol', async ({ page }) => {
  await entrar(page, EXPERTO)
  await ir(page, '#/graficos', 'Gráficos')
  const barras = grafica(page, /^Análisis por día/).getByRole('button')
  await barras.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(barras.nth(1)).toBeFocused()
  const tooltip = page.locator('.tooltip-rico')
  await expect(tooltip).toContainText('4 oct 2026')
  await expect(tooltip).toContainText('Sano: 1 (100 %)')
  await expect(tooltip).toContainText('Zona lago menor')
  await capturar(page, 'graficos-tooltip')

  await grafica(page, /^Análisis por árbol y zona/).getByRole('link', { name: /^Oyamel del lago \(árbol\)/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
  await expect(page).toHaveURL(/#\/arbol\/b0000000-0000-0000-0000-000000000001$/)
})

test('acercar, crossfilter con chips, Atrás y Restablecer; la vista vive en la URL', async ({ page }) => {
  await entrar(page, ADMIN)
  await ir(page, '#/graficos', 'Gráficos')

  // Clic en un día: el rango se acerca a ese día.
  await grafica(page, /^Análisis por día/).getByRole('button', { name: /^7 oct 2026/ }).click()
  await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-07&hasta=2026-10-07$/)
  await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Del 7 oct 2026 al 7 oct 2026')
  await expect(grafica(page, /^Análisis por día: 1 análisis en 1 periodo/)).toBeVisible()

  // Atrás deshace el paso; Restablecer vuelve a todo el rango.
  await page.goBack()
  await expect(grafica(page, /^Análisis por día: 5 análisis/)).toBeVisible()
  await page.getByRole('button', { name: 'Acercar' }).click()
  await expect(page).toHaveURL(/desde=2026-10-04&hasta=2026-10-06/)
  await page.getByRole('button', { name: 'Restablecer' }).click()
  await expect(page).toHaveURL(/#\/graficos$/)

  // Resultado en la leyenda + celda del mapa de calor: se combinan y se ven como chips.
  await page.getByRole('list', { name: 'Resultados' }).getByRole('button', { name: 'Sano', exact: true }).click()
  await expect(page).toHaveURL(/resultado=sano$/)
  await grafica(page, /^Mapa de calor/).getByRole('button', { name: /^Zona lago menor, 4 oct 2026/ }).click()
  await expect(page).toHaveURL(/resultado=sano&zona=/)
  const chips = page.getByRole('region', { name: 'Filtros activos' })
  await expect(chips).toContainText('Resultado: Sano')
  await expect(chips).toContainText('Zona: Zona lago menor')
  await expect(page.getByRole('table', { name: 'Análisis de la selección' }).getByRole('row')).toHaveCount(2)

  // La URL se comparte: otra pestaña (con su propia sesión: el token vive en sessionStorage) abre la misma vista.
  const url = page.url()
  const otra = await page.context().newPage()
  await entrar(otra, EXPERTO)
  await otra.goto(url)
  await expect(otra.getByRole('region', { name: 'Filtros activos' })).toContainText('Zona: Zona lago menor')
  await otra.close()

  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/#\/graficos$/)

  // "Ver como tabla"
  const panel = page.getByRole('region', { name: 'Confianza del modelo' })
  await panel.getByRole('button', { name: 'Ver como tabla' }).click()
  await expect(panel.getByRole('table').getByRole('row', { name: /90–100 %/ })).toContainText('2')
})

test('arrastrar en la vista general elige el rango (pincel)', async ({ page }) => {
  await entrar(page, EXPERTO)
  await ir(page, '#/graficos', 'Gráficos')
  const vista = page.locator('.grafica-vista svg')
  await vista.scrollIntoViewIfNeeded()
  const caja = (await vista.boundingBox())!
  // Del 4 al 5 de octubre (días 1 a 3 de los 6, del 3 al 8): márgenes de 34 px y 12 px.
  const util = caja.width - 34 - 12
  const x = (dia: number) => caja.x + 34 + (util * dia) / 6
  await page.mouse.move(x(1.1), caja.y + 20)
  await page.mouse.down()
  await page.mouse.move(x(3.4), caja.y + 20, { steps: 6 })
  await page.mouse.up()
  await expect(page).toHaveURL(/desde=2026-10-04&hasta=2026-10-05/)
  await expect(grafica(page, /^Análisis por día: 1 análisis en 2 periodos/)).toBeVisible()
  await capturar(page, 'graficos-pincel')
})
