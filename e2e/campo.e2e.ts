import type { Page } from '@playwright/test'
import { EXPERTO, entrar, evidencia, expect, interceptarS3, ir, test } from './ayuda'

// Lo que hace la gente en campo y el lenguaje para agrónomos, sobre db/demo con los autores de
// V5__datos_demo_autores.sql: e1–e3 los subió Usuario Demo, e4 y e6 (Oyamel, 5 oct) Experta de Campo Demo, e5 no
// tiene autor (como los análisis anteriores a la columna). Al Oyamel y a la Zona lago menor les dan
// seguimiento 2 personas.

const OYAMEL = 'b0000000-0000-0000-0000-000000000001'
const LAGO_MENOR = 'c0000000-0000-0000-0000-000000000001'

/** Jerga de ingeniería que no debe verse en la pantalla principal (solo en «Detalle técnico»). */
const JERGA = /confianza del modelo|crom[aá]tico|sincronizaci[oó]n|no determinado|clasificaci[oó]n|inferencia|pct_/i

/** El texto que se ve en <main> (innerText: lo plegado en un <details> cerrado no cuenta). */
const textoVisible = (page: Page) => page.locator('main').innerText()

test.describe('Campo y lenguaje', () => {
  test.beforeEach(async ({ page }) => {
    await interceptarS3(page)
    await entrar(page, EXPERTO)
  })

  test('autor › "Subido por" en tabla, tarjetas, detalle y actividad reciente', async ({ page }) => {
    const actividad = page.getByRole('region', { name: 'Actividad reciente' })
    await expect(actividad.getByRole('listitem').first()).toContainText('Autor no registrado') // e5
    await expect(actividad).toContainText('Subido por Usuario Demo')

    await ir(page, '#/analisis', 'Análisis')
    const tabla = page.getByRole('table', { name: 'Análisis' })
    await expect(tabla.getByRole('columnheader', { name: 'Subido por' })).toBeVisible()
    await expect(tabla.getByRole('row').filter({ hasText: '7 oct 2026, 03:00' })).toContainText('Experta de Campo Demo')

    await page.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Tarjetas' }).click()
    const tarjetas = page.getByRole('list', { name: 'Análisis' }).getByRole('article')
    await expect(tarjetas.filter({ hasText: '8 oct 2026, 05:00' })).toContainText('Autor no registrado')
    await expect(tarjetas.filter({ hasText: '3 oct 2026, 09:10' })).toContainText('Subido por Usuario Demo')
    await evidencia(page, 'campo-tarjetas-autor')

    await page.getByRole('button', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    await expect(dialogo).toContainText('Subido porUsuario Demo')
  })

  test('autor › las cajas por quién subió la foto filtran', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    const grupo = page.getByRole('group', { name: 'Por quién subió la foto' })
    await grupo.getByRole('button', { name: /^Experta de Campo Demo:/ }).click()
    await expect(page).toHaveURL(/caja_autor=a0000000-0000-0000-0000-000000000004$/)
    const filas = page.getByRole('table', { name: 'Análisis' }).getByRole('row')
    await expect(filas.nth(1)).toContainText('Experta de Campo Demo')
    await expect(page.getByRole('region', { name: 'Cajas elegidas' })).toContainText('Subido por: Experta de Campo Demo')
  })

  test('observaciones › completas en el detalle, marcadas como escritas en campo', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('button', { name: 'Ver detalle del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    const obs = dialogo.locator('.observaciones-campo')
    await expect(obs.getByRole('heading', { name: /^Observaciones de campo · escritas por Usuario Demo$/ })).toBeVisible()
    await expect(obs.locator('blockquote')).toHaveText('Galerías visibles')
    await evidencia(page, 'campo-detalle-observaciones')
    // Sin observaciones: un aviso discreto, no una caja vacía.
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Ver detalle del 6 oct 2026, 04:00' }).click()
    const otro = page.getByRole('dialog', { name: 'Análisis del 6 oct 2026, 04:00' })
    await expect(otro).toContainText('Sin observaciones de campo')
    await expect(otro.locator('.observaciones-campo')).toHaveCount(0)
  })

  test('seguimiento › quién le da seguimiento al Oyamel (2 personas) y sus observaciones', async ({ page }) => {
    await ir(page, `#/arbol/${OYAMEL}`, 'Oyamel del lago')
    const quien = page.getByRole('region', { name: 'Quién le da seguimiento' })
    await expect(quien).toContainText('Registrado por Usuario Demo')
    await expect(quien).toContainText('2 personas le dan seguimiento a este árbol')
    const personas = quien.getByRole('list', { name: 'Personas que suben fotos' }).getByRole('listitem')
    await expect(personas).toHaveCount(2)
    // La más reciente primero: e6 (5 oct, Experta) y e1 (3 oct, Usuario Demo).
    await expect(personas.first()).toContainText('Experta de Campo Demo')
    await expect(personas.nth(1)).toContainText('Usuario Demo')

    const linea = page.getByRole('list', { name: 'Línea de tiempo' })
    await expect(linea).toContainText('Observaciones de campo · escritas por Usuario DemoGalerías visibles')
    await expect(linea).toContainText('Subido por Experta de Campo Demo')
    await expect(page.getByRole('region', { name: 'Estado actual' })).toContainText(
      'Inspecciona el árbol en campo, márcalo y avisa al responsable de sanidad forestal.',
    )
    await evidencia(page, 'campo-seguimiento-oyamel')
    await page.emulateMedia({ colorScheme: 'dark' })
    await evidencia(page, 'campo-seguimiento-oyamel-oscuro')
  })

  test('seguimiento › la Zona lago menor también tiene 2 personas y las observaciones de la experta', async ({ page }) => {
    await ir(page, `#/zona/${LAGO_MENOR}`, 'Zona lago menor')
    const quien = page.getByRole('region', { name: 'Quién le da seguimiento' })
    await expect(quien).toContainText('2 personas le dan seguimiento a esta zona')
    await expect(page.getByRole('list', { name: 'Línea de tiempo' })).toContainText(
      'Observaciones de campo · escritas por Experta de Campo DemoPoca luz',
    )
  })

  test('lenguaje › sin jerga técnica en Resumen, Análisis, Gráficos, Mapa y Seguimiento', async ({ page }) => {
    const pantallas: [string, string][] = [
      ['#/', 'Resumen'],
      ['#/analisis', 'Análisis'],
      ['#/analisis?vista=tarjetas', 'Análisis'],
      ['#/graficos', 'Gráficos'],
      ['#/mapa', 'Mapa'],
      [`#/arbol/${OYAMEL}`, 'Oyamel del lago'],
      [`#/zona/${LAGO_MENOR}`, 'Zona lago menor'],
    ]
    for (const [hash, titulo] of pantallas) {
      // Salir del mapa (MapLibre con SwiftShader) puede tardar más de 5 s con la suite en paralelo.
      await page.goto(`/${hash}`)
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible({ timeout: 15_000 })
      // Lo que carga aparte (gráficas perezosas, listas) ya está pintado; las miniaturas fuera de
      // pantalla siguen en esqueleto a propósito (se piden al acercarse).
      await expect(page.locator('.hueso:not(.tarjeta-foto .hueso)')).toHaveCount(0, { timeout: 10_000 })
      expect(await textoVisible(page), hash).not.toMatch(JERGA)
    }
    await ir(page, '#/', 'Resumen')
    await expect(page.getByRole('region', { name: 'Envío desde el móvil' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Color promedio del follaje' })).toBeVisible()
  })

  test('lenguaje › el detalle dice el diagnóstico, qué hacer y deja lo técnico plegado', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('button', { name: 'Ver detalle del 7 oct 2026, 03:00' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 7 oct 2026, 03:00' })
    await expect(dialogo).toContainText('Sin diagnóstico claro: conviene repetir la foto')
    await expect(dialogo.getByRole('heading', { name: 'Qué hacer' })).toBeVisible()
    await expect(dialogo).toContainText('Repite la foto con buena luz')
    await expect(dialogo).toContainText('Certeza del diagnósticoBaja (42 %)')
    await expect(dialogo).toContainText('Envío desde el móvilPendiente')
    expect(await dialogo.innerText()).not.toMatch(JERGA)

    const tecnico = dialogo.locator('details.detalle-tecnico')
    await tecnico.locator('summary').click()
    await expect(tecnico).toContainText('Confianza del modelo')
    await expect(tecnico).toContainText('pct_incierto 40')
    await evidencia(page, 'campo-detalle-tecnico')
  })

  test('360 px › tarjetas, tabla apilada, detalle y seguimiento sin desbordar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    const sinDesborde = () =>
      expect.poll(() => page.evaluate(() => Math.max(innerWidth, document.documentElement.scrollWidth))).toBe(360)

    await ir(page, '#/analisis', 'Análisis')
    // Tabla apilada: cada fila dice quién la subió y las observaciones completas.
    const fila = page.getByRole('table', { name: 'Análisis' }).getByRole('row').filter({ hasText: '7 oct 2026, 03:00' })
    await expect(fila).toContainText('Experta de Campo Demo')
    await expect(fila).toContainText('Poca luz')
    await sinDesborde()
    await fila.scrollIntoViewIfNeeded()
    await evidencia(page, 'campo-360-tabla')

    await page.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Tarjetas' }).click()
    await sinDesborde()
    await evidencia(page, 'campo-360-tarjetas')

    await page.getByRole('button', { name: 'Ver detalle del análisis del 3 oct 2026, 09:10' }).click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toContainText('Qué hacer')
    // Nada del detalle se sale del diálogo (las observaciones y los botones caben a lo ancho).
    const anchos = await dialogo.evaluate((d) => {
      const caja = d.getBoundingClientRect()
      const fuera = [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > caja.right + 1)
      return fuera.map((e) => `${e.tagName}.${e.className}`)
    })
    expect(anchos).toEqual([])
    await evidencia(page, 'campo-360-detalle')
    await page.keyboard.press('Escape')

    await ir(page, `#/arbol/${OYAMEL}`, 'Oyamel del lago')
    await expect(page.getByRole('region', { name: 'Quién le da seguimiento' })).toBeVisible()
    await sinDesborde()
    await page.getByRole('region', { name: 'Quién le da seguimiento' }).scrollIntoViewIfNeeded()
    await evidencia(page, 'campo-360-seguimiento')
    await page.emulateMedia({ colorScheme: 'dark' })
    await evidencia(page, 'campo-360-seguimiento-oscuro')
  })
})
