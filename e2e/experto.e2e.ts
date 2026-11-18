import { EXPERTO, entrar, interceptarS3, ir, expect, test } from './ayuda'

// Recorrido de un experto de campo con los datos reales de db/demo (b-sheet):
// 3 árboles (uno sin análisis), 2 zonas, 6 análisis e1..e6 (e6: Oyamel, 5 oct), 1 dispositivo.

test.beforeEach(async ({ page }) => {
  await entrar(page, EXPERTO)
})

test.describe('Resumen', () => {
  test('focos, totales y gráficas calculados por el backend', async ({ page }) => {
    await expect(page.getByText('1 árbol y 1 zona con infestación detectada')).toBeVisible()
    const totales = page.getByRole('list', { name: 'Totales' })
    await expect(totales.getByRole('listitem').filter({ hasText: 'Árboles' })).toContainText('3')
    await expect(totales.getByRole('listitem').filter({ hasText: 'Análisis' })).toContainText('6')
    await expect(page.getByText('Última foto: 8 oct 2026, 05:00')).toBeVisible()
    await expect(
      page.getByRole('img', { name: 'Resultado de los análisis: Sano 2 (33.3 %), Infestado 3 (50 %), Sin diagnóstico claro 1 (16.7 %)' }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: 'Color promedio del follaje: Sano 55 %, Regular 15 %, Dañado 7.5 %, Incierto 22.5 %' }),
    ).toBeVisible()
  })
})

test.describe('Permisos', () => {
  test('un experto no ve Administración y no puede entrar por la URL', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Secciones' })
    await expect(nav.getByRole('link')).toHaveText(['Resumen', 'Mapa', 'Análisis', 'Gráficos'])
    await page.goto('/#/admin')
    await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
    await expect(page).toHaveURL(/#\/$/)
  })
})

test.describe('Permisos', () => {
  test('el backend también le niega al experto los datos de administración (403)', async ({ page }) => {
    // Ocultar el enlace no basta: con su propio token, la API debe rechazarlo.
    const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sheets-tt.session')!).accessToken)
    for (const ruta of ['/api/cuentas', '/api/dispositivos']) {
      const res = await page.request.get(ruta, { headers: { Authorization: `Bearer ${token}` } })
      expect(res.status(), ruta).toBe(403)
    }
  })
})

test.describe('Análisis › filtros y fotos', () => {
  test('los filtros llegan al backend y se pueden quitar', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Análisis' }).click()
    const filas = page.getByRole('table', { name: 'Análisis' }).getByRole('row')
    await expect(filas).toHaveCount(7) // encabezado + 6

    await page.getByLabel('Tipo de foto', { exact: true }).selectOption('follaje')
    await page.getByLabel('Resultado', { exact: true }).selectOption('infestado')
    const respuesta = page.waitForResponse((r) => r.url().includes('/api/analisis?tipo=follaje&resultado=infestado'))
    await page.getByRole('button', { name: 'Aplicar filtros' }).click()
    expect((await respuesta).status()).toBe(200)
    await expect(filas).toHaveCount(2)
    await expect(filas.nth(1)).toContainText('8 oct 2026, 05:00')
    await expect(filas.nth(1)).toContainText('Con error')

    // Rango por día en hora de CDMX: del 4 al 7 de octubre entran e3, e6, e2 y e4.
    await page.getByRole('button', { name: 'Quitar filtros' }).click()
    await page.getByLabel('Desde', { exact: true }).fill('2026-10-04')
    await page.getByLabel('Hasta', { exact: true }).fill('2026-10-07')
    await page.getByRole('button', { name: 'Aplicar filtros' }).click()
    await expect(filas).toHaveCount(5)
  })
})

test.describe('Análisis › filtros y fotos', () => {
  test('un rango invertido se avisa en «Hasta» sin llegar al backend', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByLabel('Desde', { exact: true }).fill('2026-10-09')
    await page.getByLabel('Hasta', { exact: true }).fill('2026-10-01')
    let consultas = 0
    page.on('request', (r) => {
      if (r.url().includes('/api/analisis')) consultas++
    })
    await page.getByRole('button', { name: 'Aplicar filtros' }).click()
    await expect(page.getByRole('alert')).toHaveText('«Hasta» no puede ser anterior a «Desde».')
    await expect(page.getByLabel('Hasta', { exact: true })).toBeFocused()
    expect(consultas).toBe(0)
  })
})

test.describe('Análisis › filtros y fotos', () => {
  test('la foto se abre con la URL que firmó el backend y Esc la cierra', async ({ page }) => {
    const pedidas = await interceptarS3(page)
    await ir(page, '#/analisis', 'Análisis')
    const tabla = page.getByRole('table', { name: 'Análisis' })
    // e5 es "sin_imagen": no ofrece foto.
    await expect(tabla.getByRole('button', { name: /^Ver foto/ })).toHaveCount(4)

    const boton = tabla.getByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' })
    await boton.click()
    const dialogo = page.getByRole('dialog', { name: 'Corteza, 3 oct 2026, 09:10' })
    const foto = dialogo.getByRole('img', { name: 'Foto de corteza capturada el 3 oct 2026, 09:10. Resultado: Infestado.' })
    await expect(foto).toBeVisible()
    await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)

    // La URL la generó b-sheet: bucket y clave de e1, firma SigV4 de 5 minutos con sus credenciales.
    expect(pedidas).toHaveLength(1)
    const url = pedidas[0]
    expect(url.pathname).toBe('/evidencias/e1.jpg')
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300')
    expect(url.searchParams.get('X-Amz-Credential')).toMatch(/^AKIAE2EFICTICIA\/\d{8}\/us-east-1\/s3\/aws4_request$/)
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/)

    await page.keyboard.press('Escape')
    await expect(dialogo).toBeHidden()
    await expect(boton).toBeFocused() // el foco vuelve al botón que abrió el diálogo
  })
})

test.describe('Análisis › filtros y fotos', () => {
  test('e2 guarda la URL completa de S3 (formato de TT_BKN) y también se firma', async ({ page }) => {
    const pedidas = await interceptarS3(page)
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('button', { name: 'Ver foto del 6 oct 2026, 04:00' }).click()
    await expect(page.getByRole('dialog').getByRole('img')).toBeVisible()
    expect(pedidas.map((u) => u.pathname)).toEqual(['/evidencias/e2.jpg'])
  })
})

test.describe('Mapa', () => {
  test('último resultado por punto e historial al elegir uno', async ({ page }) => {
    await ir(page, '#/mapa', 'Mapa')
    const mapa = page.getByRole('group', { name: 'Mapa de campo: 3 árboles y 2 zonas' })
    await expect(mapa.getByRole('button', { name: 'Pino del cerro (Pinus hartwegii): Sin análisis' })).toBeVisible()
    await expect(mapa.getByRole('button', { name: 'Zona lago menor, radio 50 m: Sin diagnóstico claro' })).toBeVisible()

    const historial = page.waitForResponse((r) => r.url().includes('/api/analisis?arbol=b0000000-0000-0000-0000-000000000001'))
    await mapa.getByRole('button', { name: 'Oyamel del lago (Abies religiosa): Infestado' }).click()
    await historial
    await expect(page).toHaveURL(/#\/mapa\/a-b0000000-0000-0000-0000-000000000001$/)
    const detalle = page.getByRole('region', { name: 'Oyamel del lago' })
    await expect(detalle).toContainText('Junto al lago menor')
    // e6 (5 oct, Experta de Campo Demo) y e1 (3 oct, Usuario Demo), con quién subió cada uno.
    const historialOyamel = detalle.getByRole('listitem')
    await expect(historialOyamel).toHaveCount(2)
    await expect(historialOyamel.nth(0)).toContainText('Subido por Experta de Campo Demo')
    await expect(historialOyamel.nth(0)).toContainText('Resina fresca en la base del tronco')
    await expect(historialOyamel.nth(1)).toContainText('Galerías visibles')

    // El mapa también se maneja con teclado; Esc cierra el detalle.
    await page.keyboard.press('Escape')
    await mapa.getByRole('button', { name: 'Pino del cerro (Pinus hartwegii): Sin análisis' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Pino del cerro' })).toContainText('Todavía no tiene análisis.')
  })
})

test.describe('Mapa', () => {
  test('filtros y búsqueda', async ({ page }) => {
    await ir(page, '#/mapa', 'Mapa')
    // Marcadores: sus nombres dicen el estado ("…: Sano"); los demás botones son controles del mapa.
    const marcas = page.getByRole('group', { name: /^Mapa de campo/ }).getByRole('button', { name: /: / })
    await expect(marcas).toHaveCount(5)
    await page.getByRole('group', { name: 'Mostrar por estado' }).getByRole('button', { name: /Infestado/ }).click()
    await expect(marcas).toHaveCount(3)
    await expect(page.getByText('3 de 5 con estos filtros')).toBeVisible()

    await page.getByRole('searchbox', { name: 'Buscar árbol o zona' }).fill('pinus')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Pino del cerro' })).toBeVisible()
  })
})

test.describe('Seguimiento', () => {
  test('seguimiento: del mapa al historial completo de un árbol y de vuelta', async ({ page }) => {
    const pedidas = await interceptarS3(page)
    await ir(page, '#/mapa', 'Mapa')
    await page.getByRole('group', { name: /^Mapa de campo/ }).getByRole('button', { name: /^Oyamel del lago \(/ }).click()
    await page.getByRole('link', { name: 'Ver seguimiento del árbol' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Oyamel del lago' })).toBeVisible()
    await expect(page).toHaveURL(/#\/arbol\/b0000000-0000-0000-0000-000000000001$/)
    await expect(page.getByRole('region', { name: 'Estado actual' })).toContainText('Infestado')
    await expect(page.getByRole('img', { name: /^Certeza de cada diagnóstico: 2 análisis/ })).toBeVisible()
    const linea = page.getByRole('list', { name: 'Línea de tiempo' })
    await expect(linea.getByRole('listitem')).toHaveCount(2)
    await expect(linea).toContainText('Galerías visibles')
    await expect(page.getByRole('group', { name: 'Ubicación de Oyamel del lago y 2 capturas' })).toBeVisible()

    await linea.getByRole('button', { name: 'Ver foto del 3 oct 2026, 09:10' }).click()
    await expect(page.getByRole('dialog').getByRole('img')).toBeVisible()
    expect(pedidas.map((u) => u.pathname)).toEqual(['/evidencias/e1.jpg'])
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click()

    await page.getByRole('link', { name: 'Volver al mapa' }).click()
    await expect(page.getByRole('region', { name: 'Oyamel del lago' })).toBeVisible()
  })
})

test.describe('Seguimiento', () => {
  test('seguimiento de una zona: evolución del follaje', async ({ page }) => {
    await ir(page, '#/zona/c0000000-0000-0000-0000-000000000001', 'Zona lago menor')
    const evolucion = page.getByRole('region', { name: 'Evolución del color del follaje' })
    await expect(evolucion.getByRole('img')).toHaveCount(2)
    await expect(page.getByRole('list', { name: 'Línea de tiempo' })).toContainText('Cambió de sano a sin diagnóstico claro')
  })
})
