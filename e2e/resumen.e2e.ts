import { mkdir } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { ADMIN, CONTRASENA, EXPERTO, entrar, expect, test } from './ayuda'

// Resumen (dashboard) con los datos de db/demo. E2E_CAPTURAS=<carpeta> guarda capturas.
const CAPTURAS = process.env.E2E_CAPTURAS

async function capturar(page: Page, nombre: string, opciones: { espera?: number; completa?: boolean } = {}) {
  if (!CAPTURAS) return
  await mkdir(CAPTURAS, { recursive: true })
  await page.waitForTimeout(opciones.espera ?? 900)
  await page.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: opciones.completa ?? true })
}

/** Nombres de las animaciones CSS en curso o terminadas sobre los elementos que cumplen el selector. */
const animaciones = (page: Page, selector: string) =>
  page.evaluate(
    (sel) => [...document.querySelectorAll(sel)].flatMap((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName)),
    selector,
  )

test('la animación del login se conserva y el resumen entra con su misma coreografía', async ({ page }) => {
  await page.goto('/#/login')
  // Login: la galería se excava (excavar + aparecer-pupa), como siempre.
  expect(await animaciones(page, '.galeria-animada .galeria-madre')).toContain('excavar')
  expect(await animaciones(page, '.galeria-animada .galeria-pupa')).toContain('aparecer-pupa')
  await capturar(page, 'login-animacion', { espera: 500, completa: false })

  await page.getByLabel('Usuario').fill(EXPERTO)
  await page.getByLabel('Contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
  // La página entra con "entrar" y cada sección después, escalonada, con la misma animación.
  expect(await animaciones(page, '.pagina')).toContain('entrar')
  await expect(page.getByRole('region', { name: 'Necesita tu atención' })).toBeVisible()
  expect(new Set(await animaciones(page, '.resumen-secciones > *'))).toEqual(new Set(['entrar']))
  const retrasos = await page.evaluate(() =>
    [...document.querySelectorAll('.resumen-secciones > *')].slice(0, 4).map((el) => getComputedStyle(el).animationDelay),
  )
  expect(retrasos).toEqual(['0.08s', '0.14s', '0.2s', '0.26s'])
  await capturar(page, 'resumen-entrando', { espera: 120, completa: false })
  await capturar(page, 'resumen-claro')
  await page.emulateMedia({ colorScheme: 'dark' })
  await capturar(page, 'resumen-oscuro')
})

test('con movimiento reducido no hay desplazamientos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await entrar(page, EXPERTO)
  await expect(page.getByRole('region', { name: 'Necesita tu atención' })).toBeVisible()
  const duraciones = await page.evaluate(() =>
    [...document.querySelectorAll('.resumen-secciones > *')].map((el) => parseFloat(getComputedStyle(el).animationDuration)),
  )
  expect(Math.max(...duraciones)).toBeLessThan(0.001)
})

test('la atención lleva a Análisis filtrado y "Ver en Gráficos" conserva el filtro', async ({ page }) => {
  await entrar(page, EXPERTO)
  const atencion = page.getByRole('region', { name: 'Necesita tu atención' })
  await expect(atencion).toContainText('3 análisis requieren atención, de los 5 más recientes.')
  await atencion.getByRole('link', { name: /^Infestados: 2\./ }).click()
  await expect(page).toHaveURL(/#\/analisis\?caja_resultado=infestado$/)
  await expect(page.getByRole('table', { name: 'Análisis' }).getByRole('row')).toHaveCount(3)

  await page.goBack()
  const lugares = page.getByRole('region', { name: 'Dónde hay más infestación' })
  await lugares.getByRole('link', { name: 'Ver dónde hay más infestación en Gráficos' }).click()
  await expect(page).toHaveURL(/#\/graficos\?resultado=infestado$/)
  await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Resultado: Infestado')

  // Un lugar infestado abre su seguimiento.
  await page.goBack()
  await page.getByRole('region', { name: 'Necesita tu atención' }).getByRole('link', { name: 'Oyamel del lago' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
})

test('accesos rápidos en orden; un experto no ve Administración; la actividad abre el detalle', async ({ page }) => {
  await entrar(page, EXPERTO)
  const accesos = page.getByRole('navigation', { name: 'Ir a' })
  await expect(accesos.locator('strong')).toHaveText(['Mapa', 'Análisis', 'Gráficos', 'Seguimiento de Zona calzada'])
  await page.getByRole('region', { name: 'Actividad reciente' }).getByRole('link', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
  await expect(page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/#\/analisis$/)

  await page.goto('/#/')
  await accesos.getByRole('link', { name: /^Mapa/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mapa' })).toBeVisible()
})

test('un administrador ve Administración al final de los accesos', async ({ page }) => {
  await entrar(page, ADMIN)
  const accesos = page.getByRole('navigation', { name: 'Ir a' })
  await expect(accesos.locator('strong').last()).toHaveText('Administración')
})

test('D1: la cifra de errores de sincronización coincide con lo que abre su enlace', async ({ page }) => {
  await entrar(page, EXPERTO)
  const panel = page.getByRole('region', { name: 'Sincronización desde el móvil' })
  const conError = Number((await panel.locator('li').filter({ hasText: 'Con error' }).locator('.num').textContent())!.trim())
  const enlace = page.getByRole('region', { name: 'Necesita tu atención' }).getByRole('link', { name: /^Errores de sincronización: / })
  await expect(enlace).toHaveAccessibleName(new RegExp(`^Errores de sincronización: ${conError}\\.`))
  await enlace.click()
  await expect(page).toHaveURL(/#\/analisis\?estado=error$/)
  await expect(page.getByRole('table', { name: 'Análisis' }).getByRole('row')).toHaveCount(conError + 1)
})

