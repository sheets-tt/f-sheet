import { mkdir } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { ADMIN, EXPERTO, ejeConfianzaSinEncimar, entrar, expect, ir, test } from './ayuda'

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
  await ejeConfianzaSinEncimar(page)
  // A 760 px (donde "90" y "100" se encimaban) tampoco.
  await page.setViewportSize({ width: 760, height: 900 })
  await ejeConfianzaSinEncimar(page)
  await page.setViewportSize({ width: 1280, height: 720 })
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

test('escribir el año en Desde no congela la pestaña ni llena el historial; un rango absurdo en la URL se acota', async ({ page }) => {
  await entrar(page, EXPERTO)
  await ir(page, '#/graficos?desde=2026-10-04', 'Gráficos')
  const largo = await page.evaluate(() => history.length)
  const nodos = () => page.evaluate(() => document.querySelectorAll('svg *').length)

  // dd/mm/aaaa: dos flechas llevan al año; cada dígito es una fecha intermedia (0002, 0020, 0202…).
  const desde = page.getByLabel('Desde')
  await desde.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  const inicio = Date.now()
  await page.keyboard.type('2025')
  expect(Date.now() - inicio).toBeLessThan(3000)
  expect(await nodos()).toBeLessThan(3000)
  await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-04$/)
  expect(await page.evaluate(() => history.length)).toBe(largo)

  // Al confirmar (Enter; en Chrome el primer Tab tras el año va al botón del calendario, dentro del
  // mismo campo): 2025 queda fuera de los datos → aviso, el campo vuelve al valor vigente, nada cambia.
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toHaveText('Elige una fecha entre el 3 oct 2026 y el 8 oct 2026.')
  await expect(desde).toHaveValue('2026-10-04')
  await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-04$/)
  expect(await page.evaluate(() => history.length)).toBe(largo)

  // Un rango de 10 000 años en la URL se acota a los datos y la URL se reescribe.
  const t0 = Date.now()
  await page.goto('/#/graficos?desde=0001-01-01&hasta=9999-12-31')
  await expect(page).toHaveURL(/#\/graficos$/)
  await expect(page.getByRole('group', { name: /^Análisis por día: 5 análisis en 6 periodos/ })).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(5000)
  expect(await nodos()).toBeLessThan(3000)
})

test.describe('fecha a medio confirmar + clic en otro control', () => {
  /** Escribe el día en Desde (dd/mm/aaaa: el foco empieza en el día) sin salir del campo. */
  async function escribirDia(page: Page, dia: string) {
    await page.getByLabel('Desde').focus()
    await page.keyboard.type(dia)
  }

  test('escribir Desde y hacer clic en la leyenda: un solo paso y nada se pierde', async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos?hasta=2026-10-06', 'Gráficos')
    const largo = await page.evaluate(() => history.length)
    await escribirDia(page, '05')
    await page.getByRole('list', { name: 'Resultados' }).getByRole('button', { name: 'Infestado', exact: true }).click()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-05&hasta=2026-10-06&resultado=infestado$/)
    await expect(page.getByLabel('Desde')).toHaveValue('2026-10-05')
    expect(await page.evaluate(() => history.length)).toBe(largo + 1)
  })

  test('escribir Desde y hacer clic en Siguiente: se mueve desde la fecha escrita, en un paso', async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos?hasta=2026-10-05', 'Gráficos')
    const largo = await page.evaluate(() => history.length)
    await escribirDia(page, '04')
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-06&hasta=2026-10-07$/)
    await expect(page.getByLabel('Desde')).toHaveValue('2026-10-06')
    await expect(page.getByLabel('Hasta')).toHaveValue('2026-10-07')
    expect(await page.evaluate(() => history.length)).toBe(largo + 1)
  })

  test('Enter aplica sin sacar el foco; Restablecer deja el foco en el texto del rango', async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos', 'Gráficos')
    await escribirDia(page, '05')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-05$/)
    await expect(page.getByLabel('Desde')).toBeFocused()

    await page.getByRole('button', { name: 'Restablecer' }).click()
    await expect(page).toHaveURL(/#\/graficos$/)
    await expect(page.locator('.rango-texto')).toBeFocused()
  })

  test('intercambio y salir conserva el rango (Desde después de Hasta, clic en Hasta, clic fuera)', async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos?desde=2026-10-04&hasta=2026-10-06', 'Gráficos')
    await escribirDia(page, '07')
    await page.getByLabel('Hasta').click()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-06&hasta=2026-10-07$/)
    await expect(page.getByLabel('Hasta')).toHaveValue('2026-10-07')
    const largo = await page.evaluate(() => history.length)
    await page.getByRole('heading', { level: 1, name: 'Gráficos' }).click()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-06&hasta=2026-10-07$/)
    await expect(page.getByLabel('Desde')).toHaveValue('2026-10-06')
    expect(await page.evaluate(() => history.length)).toBe(largo)
  })

  test('Atrás con el foco en Desde y luego Tab no rehace el cambio (Adelante intacto)', async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos', 'Gráficos')
    await escribirDia(page, '05')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-05$/)
    const largo = await page.evaluate(() => history.length)
    await page.goBack()
    await expect(page).toHaveURL(/#\/graficos$/)
    await expect(page.getByLabel('Desde')).toBeFocused()
    await expect(page.getByLabel('Desde')).toHaveValue('2026-10-03')
    // Salir del campo (Tab recorre los segmentos y el botón del calendario hasta salir).
    for (let i = 0; i < 4 && (await page.evaluate(() => document.activeElement?.id)) === 'g-desde'; i++) await page.keyboard.press('Tab')
    await expect(page.getByLabel('Desde')).not.toBeFocused()
    await expect(page).toHaveURL(/#\/graficos$/)
    expect(await page.evaluate(() => history.length)).toBe(largo)
    await page.goForward()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-10-05$/)
  })
})

