import type { Page } from '@playwright/test'
import { ADMIN, EXPERTO, entrar, evidencia, expect, interceptarS3, ir, test } from './ayuda'

// Una prueba por función que aún no tenía la suya (ver docs/e2e-cobertura.md), contra b-sheet real
// con los datos de db/demo: 5 análisis (e1…e5), 3 árboles (b1…b3) y 2 zonas (c1, c2).
// Cada prueba adjunta capturas de sus pasos clave como evidencia.

const OYAMEL = 'b0000000-0000-0000-0000-000000000001'
const tablaAnalisis = (page: Page) => page.getByRole('table', { name: 'Análisis' }).getByRole('row')
const grafica = (page: Page, nombre: RegExp) => page.getByRole('group', { name: nombre })

/** Id real (UUID de b-sheet) del análisis capturado en ese instante, pedido a la API con la sesión abierta. */
async function idAnalisis(page: Page, fechaCaptura: string): Promise<string> {
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sheets-tt.session')!).accessToken as string)
  const res = await page.request.get('/api/analisis?limite=100', { headers: { Authorization: `Bearer ${token}` } })
  const lista = (await res.json()) as { id: string; fechaCaptura: string }[]
  const a = lista.find((x) => Date.parse(x.fechaCaptura) === Date.parse(fechaCaptura))
  expect(a, `análisis del ${fechaCaptura}`).toBeTruthy()
  return a!.id
}
const E1 = '2026-10-03T15:10:00Z' // corteza, Oyamel del lago, infestado
const E3 = '2026-10-04T12:00:00Z' // follaje, Zona lago menor, sano
const E4 = '2026-10-07T09:00:00Z' // follaje, Zona lago menor, no determinado

type AnalisisApi = { id: string; fechaCaptura: string; estadoSincronizacion: string }

/**
 * Sustituye la respuesta de GET /analisis?limite=… por la que devuelve `cambiar`, a partir de la
 * real de b-sheet (para armar casos que db/demo no tiene: 100 o 500 análisis, uno muy antiguo…).
 */
async function cambiarAnalisis(page: Page, limite: '100' | '500', cambiar: (lista: AnalisisApi[]) => AnalisisApi[]) {
  await page.route(
    (url) => url.pathname === '/api/analisis' && url.searchParams.get('limite') === limite,
    async (route) => {
      const res = await route.fetch()
      await route.fulfill({ response: res, json: cambiar((await res.json()) as AnalisisApi[]) })
    },
  )
}

/** n copias de los análisis reales con ids nuevos (y, si se da, otra fecha de captura). */
const replicar = (lista: AnalisisApi[], n: number, fecha?: (i: number) => string): AnalisisApi[] =>
  Array.from({ length: n }, (_, i) => ({ ...lista[i % lista.length], id: `copia-${i}`, ...(fecha ? { fechaCaptura: fecha(i) } : {}) }))
const enElPeriodo = (i: number) => `2026-10-0${3 + (i % 6)}T18:00:00Z`

test.describe('Sesión', () => {
  test('campos vacíos: valida sin llamar al backend', async ({ page }) => {
    const llamadas: string[] = []
    page.on('request', (r) => r.url().includes('/api/auth/login') && llamadas.push(r.url()))
    await page.goto('/#/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('Introduce tu usuario y contraseña.')
    await evidencia(page, 'login-vacio')
    expect(llamadas).toEqual([])
  })
})

test.describe('Resumen', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, EXPERTO)
  })

  test('indicadores › últimos 7 días con sus cifras', async ({ page }) => {
    const lista = page.getByRole('list', { name: 'Indicadores de los últimos 7 días' })
    await expect(lista.getByRole('listitem').filter({ hasText: 'Análisis' }).first()).toContainText('5')
    await expect(lista.getByRole('listitem').filter({ hasText: 'Infestados' })).toContainText('40 %')
    await expect(lista.getByRole('listitem').filter({ hasText: 'Última captura' })).toContainText('8 oct 2026, 05:00')
    await lista.scrollIntoViewIfNeeded()
    await evidencia(page, 'indicadores')
  })

  test('gráficas clave › "Ver la actividad en Gráficos" y una decena de confianza abren Gráficos filtrado', async ({ page }) => {
    await page.getByRole('link', { name: 'Ver la actividad en Gráficos' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Gráficos' })).toBeVisible()
    await evidencia(page, 'actividad-en-graficos')
    await page.goBack()
    await grafica(page, /^Confianza de 5 análisis/).getByRole('button', { name: /^Confianza 90–100 %/ }).click()
    await expect(page).toHaveURL(/#\/graficos\?confianza=9$/)
    await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Confianza: 90–100 %')
    await evidencia(page, 'decena-en-graficos')
  })

  test('accesos › Gráficos y el seguimiento del último lugar infestado', async ({ page }) => {
    const accesos = page.getByRole('navigation', { name: 'Ir a' })
    await accesos.getByRole('link', { name: /^Gráficos/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Gráficos' })).toBeVisible()
    await page.goBack()
    await accesos.getByRole('link', { name: /^Seguimiento de Zona calzada/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Zona calzada' })).toBeVisible()
    await evidencia(page, 'seguimiento-ultimo-infestado')
  })

  test('fallos parciales › si /analisis falla, el hero y los accesos siguen y se puede reintentar', async ({ page }) => {
    let fallar = true
    await page.route('**/api/analisis?*', (r) => (fallar ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Falla de prueba"}' }) : r.continue()))
    await ir(page, '#/mapa', 'Mapa')
    await ir(page, '#/', 'Resumen')
    const atencion = page.getByRole('region', { name: 'Necesita tu atención' })
    await expect(atencion.getByRole('alert')).toContainText('Falla de prueba')
    await expect(page.getByText('1 árbol y 1 zona con infestación detectada')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Ir a' })).toBeVisible()
    await evidencia(page, 'analisis-caido')
    fallar = false
    await atencion.getByRole('button', { name: 'Reintentar' }).click()
    await expect(atencion).toContainText('3 análisis requieren atención')
    await evidencia(page, 'reintentado')
  })
})

test.describe('Resumen › casos límite', () => {
  test('gráficas clave › "Ver la actividad en Gráficos" lleva el rango de los últimos 30 días', async ({ page }) => {
    // Un análisis de agosto: los datos abarcan más de 30 días y la gráfica del Resumen se acota.
    await cambiarAnalisis(page, '500', (l) => [...l, { ...l[0], id: 'antiguo', fechaCaptura: '2026-08-01T18:00:00Z' }])
    await entrar(page, EXPERTO)
    const enlace = page.getByRole('link', { name: 'Ver la actividad en Gráficos' })
    await expect(enlace).toHaveAttribute('href', '#/graficos?desde=2026-09-09')
    await enlace.click()
    await expect(page).toHaveURL(/#\/graficos\?desde=2026-09-09$/)
    await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Del 9 sept 2026 al 8 oct 2026')
    await evidencia(page, 'rango-en-graficos')
  })

  test('indicadores › con el periodo recortado por el límite: "500 o más" y sin comparar', async ({ page }) => {
    await cambiarAnalisis(page, '500', (l) => replicar(l, 500, enElPeriodo))
    await entrar(page, EXPERTO)
    const lista = page.getByRole('list', { name: 'Indicadores de los últimos 7 días' })
    await expect(lista.getByRole('listitem').first()).toContainText('500 o más')
    await expect(lista.getByRole('listitem').first()).toContainText('sin comparar (periodo actual incompleto)')
    await expect(page.getByText(/este periodo puede estar incompleto y no se compara/)).toBeVisible()
    await lista.scrollIntoViewIfNeeded()
    await evidencia(page, 'periodo-recortado')
  })

  test('atención › sin /estadisticas, los errores de sincronización se cuentan sobre los recientes y no se enlazan', async ({ page }) => {
    await page.route('**/api/estadisticas', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
    await entrar(page, EXPERTO)
    const atencion = page.getByRole('region', { name: 'Necesita tu atención' })
    await expect(atencion).toContainText('No llegaron bien desde el móvil (de los 5 más recientes)')
    await expect(atencion.getByRole('link', { name: /^Errores de sincronización/ })).toHaveCount(0)
    await expect(atencion.getByRole('link', { name: /^Infestados: 2\./ })).toBeVisible()
    await evidencia(page, 'errores-sin-enlace')
  })
})

test.describe('Análisis', () => {
  test.beforeEach(async ({ page }) => {
    await interceptarS3(page)
    await entrar(page, EXPERTO)
  })

  test('miniatura › si la imagen falla, pide otra firma una vez y luego dice "Foto no disponible"', async ({ page }) => {
    const firmas: string[] = []
    page.on('request', (r) => /\/api\/analisis\/[^/]+\/evidencia$/.test(new URL(r.url()).pathname) && firmas.push(r.url()))
    // El bucket rechaza la descarga (como con una firma caducada).
    await page.route(/^https:\/\/descortezadores-archivos-prod\.s3/, (r) => r.fulfill({ status: 403, body: 'Forbidden' }))
    await ir(page, '#/analisis?vista=tarjetas&caja_resultado=infestado&caja_tipo=corteza', 'Análisis')
    const tarjeta = page.getByRole('article')
    await expect(tarjeta).toHaveCount(1)
    // La miniatura se pide al acercarse a la pantalla.
    await tarjeta.scrollIntoViewIfNeeded()
    await expect(tarjeta).toContainText('Foto no disponible')
    expect(firmas).toHaveLength(2)
    await evidencia(page, 'foto-no-disponible')
  })

  test('límite › con 100 análisis pide acotar por fechas', async ({ page }) => {
    await cambiarAnalisis(page, '100', (l) => replicar(l, 100))
    await ir(page, '#/analisis', 'Análisis')
    await expect(page.locator('#analisis-conteo')).toHaveText('Se muestran los 100 más recientes. Acota por fechas para ver los anteriores.')
    await evidencia(page, 'cien-analisis')
  })

  test('detalle › anterior y siguiente con ?detalle= cambian la URL sin paso nuevo en el historial', async ({ page }) => {
    const [e3, e4] = [await idAnalisis(page, E3), await idAnalisis(page, E4)]
    await ir(page, `#/analisis?detalle=${e3}`, 'Análisis')
    const largo = await page.evaluate(() => history.length)
    await page.getByRole('dialog', { name: 'Análisis del 4 oct 2026, 06:00' }).getByRole('button', { name: 'Siguiente de este lugar' }).click()
    await expect(page.getByRole('dialog', { name: 'Análisis del 7 oct 2026, 03:00' })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`detalle=${e4}$`))
    expect(await page.evaluate(() => history.length)).toBe(largo)
    await evidencia(page, 'siguiente-del-lugar')
  })

  test('cajas › filtran por confianza baja', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('button', { name: /^Baja: 1 análisis/ }).click()
    await expect(page).toHaveURL(/caja_confianza=baja$/)
    await expect(tablaAnalisis(page)).toHaveCount(2)
    await expect(tablaAnalisis(page).nth(1)).toContainText('No determinado')
    await evidencia(page, 'confianza-baja')
  })

  test('cajas › "Requieren atención" junta infestados, no determinados, confianza baja y errores', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('button', { name: /^Requieren atención: 3 análisis/ }).click()
    await expect(tablaAnalisis(page)).toHaveCount(4)
    await expect(page.getByRole('region', { name: 'Cajas elegidas' })).toContainText('Requieren atención')
    await evidencia(page, 'requieren-atencion')
  })

  test('cajas › quitar un chip pasa el foco al siguiente', async ({ page }) => {
    await ir(page, '#/analisis?caja_resultado=sano&caja_tipo=follaje', 'Análisis')
    const chips = page.getByRole('region', { name: 'Cajas elegidas' })
    await chips.getByRole('button', { name: 'Quitar Resultado: Sano' }).click()
    await expect(chips.getByRole('button', { name: 'Quitar Tipo: Follaje' })).toBeFocused()
    await expect(page).toHaveURL(/#\/analisis\?caja_tipo=follaje$/)
    await evidencia(page, 'chip-quitado')
  })

  test('vista › "Tarjetas" se recuerda al volver a la sección', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByRole('group', { name: 'Vista' }).getByRole('button', { name: 'Tarjetas' }).click()
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Resumen' }).click()
    await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Análisis' }).click()
    await expect(page).toHaveURL(/#\/analisis$/)
    await expect(page.getByRole('list', { name: 'Análisis' }).getByRole('article')).toHaveCount(5)
    await evidencia(page, 'tarjetas-recordadas')
  })

  test('agrupar › por resultado y por día', async ({ page }) => {
    await ir(page, '#/analisis', 'Análisis')
    await page.getByLabel('Agrupar por').selectOption('resultado')
    await expect(page.locator('details.grupo summary .grupo-titulo')).toHaveText(['Sano', 'Infestado', 'No determinado'])
    await evidencia(page, 'por-resultado')
    await page.getByLabel('Agrupar por').selectOption('dia')
    await expect(page.locator('details.grupo')).toHaveCount(5)
    await expect(page.locator('details.grupo summary .grupo-titulo').first()).toHaveText('Jueves, 8 de octubre de 2026')
    // Plegar un grupo.
    await page.locator('details.grupo summary').first().click()
    await expect(page.locator('details.grupo').first()).not.toHaveAttribute('open', '')
    await evidencia(page, 'por-dia')
  })

  test('detalle › enlace directo ?detalle= abre el análisis; Cerrar deja la URL limpia', async ({ page }) => {
    await ir(page, `#/analisis?detalle=${await idAnalisis(page, E1)}`, 'Análisis')
    const dialogo = page.getByRole('dialog', { name: 'Análisis del 3 oct 2026, 09:10' })
    await expect(dialogo).toBeVisible()
    await evidencia(page, 'detalle-por-enlace')
    await dialogo.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page).toHaveURL(/#\/analisis$/)
    await expect(page.locator('#analisis-conteo')).toBeFocused()
  })

  test('detalle › un ?detalle= que no está entre los cargados avisa y se quita', async ({ page }) => {
    await ir(page, '#/analisis?detalle=no-existe', 'Análisis')
    await expect(page.getByText('El análisis enlazado no está entre los cargados con estos filtros.')).toBeVisible()
    await expect(page).toHaveURL(/#\/analisis$/)
    await evidencia(page, 'detalle-inexistente')
  })

  test('detalle › "Ver en Gráficos" abre Gráficos filtrado por el lugar', async ({ page }) => {
    await ir(page, `#/analisis?detalle=${await idAnalisis(page, E1)}`, 'Análisis')
    await page.getByRole('dialog').getByRole('link', { name: 'Ver en Gráficos' }).click()
    await expect(page).toHaveURL(new RegExp(`#/graficos\\?arbol=${OYAMEL}$`))
    await expect(page.getByRole('region', { name: 'Filtros activos' })).toContainText('Árbol: Oyamel del lago')
    await evidencia(page, 'graficos-del-lugar')
  })
})

test.describe('Gráficos', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, EXPERTO)
    await ir(page, '#/graficos', 'Gráficos')
  })

  test('confianza › clic en una decena filtra las demás gráficas', async ({ page }) => {
    await grafica(page, /^Confianza de 5 análisis/).getByRole('button', { name: /^Confianza 90–100 %: 2 análisis/ }).click()
    await expect(page).toHaveURL(/confianza=9$/)
    await expect(page.getByRole('table', { name: 'Análisis de la selección' }).getByRole('row')).toHaveCount(3)
    await expect(grafica(page, /^Análisis por día: 2 análisis/)).toBeVisible()
    await evidencia(page, 'decena-elegida')
  })

  test('filtros › Tipo y Árbol o zona se combinan', async ({ page }) => {
    await page.getByLabel('Tipo', { exact: true }).selectOption('follaje')
    await expect(page).toHaveURL(/tipo=follaje/)
    await page.getByLabel('Árbol o zona').selectOption({ label: 'Zona lago menor' })
    const chips = page.getByRole('region', { name: 'Filtros activos' })
    await expect(chips).toContainText('Tipo: Follaje')
    await expect(chips).toContainText('Zona: Zona lago menor')
    await expect(page.getByRole('table', { name: 'Análisis de la selección' }).getByRole('row')).toHaveCount(3)
    await evidencia(page, 'tipo-y-lugar')
  })

  test('mapa de calor › se recorre con flechas y Enter filtra por el lugar', async ({ page }) => {
    const celdas = grafica(page, /^Mapa de calor/).getByRole('button')
    await celdas.first().focus()
    await page.keyboard.press('ArrowDown')
    await expect(celdas.nth(6)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(celdas.nth(7)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/graficos\?arbol=/)
    await evidencia(page, 'calor-teclado')
  })

  test('tablas › cada gráfica tiene "Ver como tabla"', async ({ page }) => {
    for (const titulo of ['Análisis en el tiempo', 'Confianza del modelo', 'Por árbol y zona', 'Actividad por árbol y zona']) {
      const panel = page.getByRole('region', { name: titulo, exact: true })
      await panel.getByRole('button', { name: 'Ver como tabla' }).click()
      await expect(panel.getByRole('table')).toBeVisible()
      await expect(panel.getByRole('button', { name: 'Ver gráfica', pressed: true })).toBeVisible()
    }
    await evidencia(page, 'todas-como-tabla')
  })

  test('rango › Alejar vuelve a todo el rango', async ({ page }) => {
    await page.getByRole('button', { name: 'Acercar' }).click()
    await expect(page).toHaveURL(/desde=2026-10-04&hasta=2026-10-06$/)
    await page.getByRole('button', { name: 'Alejar' }).click()
    await expect(page).toHaveURL(/#\/graficos$/)
    await expect(page.getByRole('button', { name: 'Alejar' })).toBeDisabled()
    await evidencia(page, 'alejado')
  })

  test('rango › Anterior y Siguiente se deshabilitan en los bordes de los datos', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    await page.getByRole('button', { name: 'Acercar' }).click()
    await expect(page.getByRole('button', { name: 'Anterior' })).toBeEnabled()
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    await expect(page.locator('.rango-texto')).toBeFocused()
    await evidencia(page, 'rango-en-el-borde')
  })
})

test.describe('Gráficos › URL y avisos', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, EXPERTO)
  })

  test('rango sin análisis › lo avisa y muestra todo', async ({ page }) => {
    await ir(page, '#/graficos?desde=2025-05-01&hasta=2025-05-31', 'Gráficos')
    await expect(page.getByRole('status').filter({ hasText: 'El rango pedido no tiene análisis; se muestra todo.' })).toBeVisible()
    await expect(page).toHaveURL(/#\/graficos$/)
    await evidencia(page, 'rango-sin-analisis')
  })

  test('URL › parámetros inválidos (lugar inexistente, fechas absurdas) se normalizan', async ({ page }) => {
    await ir(page, '#/graficos?zona=no-existe&desde=0001-01-01&hasta=9999-12-31&resultado=x', 'Gráficos')
    await expect(page).toHaveURL(/#\/graficos$/)
    await expect(page.getByRole('region', { name: 'Filtros activos' })).toHaveCount(0)
    await expect(grafica(page, /^Análisis por día: 5 análisis en 6 periodos/)).toBeVisible()
  })

  test('chips › quitar uno pasa el foco al siguiente y, sin chips, al texto del rango', async ({ page }) => {
    await ir(page, '#/graficos?tipo=follaje&resultado=sano', 'Gráficos')
    const chips = page.getByRole('region', { name: 'Filtros activos' })
    await chips.getByRole('button', { name: 'Quitar Resultado: Sano' }).click()
    await expect(chips.getByRole('button', { name: 'Quitar Tipo: Follaje' })).toBeFocused()
    await chips.getByRole('button', { name: 'Quitar Tipo: Follaje' }).click()
    await expect(page.locator('.rango-texto')).toBeFocused()
    await evidencia(page, 'chips-quitados')
  })

  test('límite › con 500 análisis avisa que solo entran los más recientes', async ({ page }) => {
    await cambiarAnalisis(page, '500', (l) => replicar(l, 500, enElPeriodo))
    await ir(page, '#/graficos', 'Gráficos')
    await expect(page.getByText('Se muestran los 500 análisis más recientes; los anteriores no entran en las gráficas.')).toBeVisible()
    await evidencia(page, 'quinientos')
  })
})

test.describe('Administración', () => {
  test.beforeEach(async ({ page }) => {
    await entrar(page, ADMIN)
    await ir(page, '#/admin', 'Administración')
  })

  test('formulario › valida antes de enviar', async ({ page }) => {
    const posts: string[] = []
    page.on('request', (r) => r.method() === 'POST' && r.url().includes('/api/cuentas') && posts.push(r.url()))
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Crear cuenta' })
    await dialogo.getByLabel('Correo').fill('no-es-correo')
    await dialogo.getByLabel('Contraseña', { exact: true }).fill('corta')
    await dialogo.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(dialogo.getByLabel('Nombre completo')).toHaveAttribute('aria-invalid', 'true')
    await expect(dialogo.getByLabel('Nombre completo')).toBeFocused()
    await expect(dialogo).toContainText('Escribe un correo válido, como nombre@dominio.mx.')
    await expect(dialogo).toContainText('Usa al menos 8 caracteres.')
    await expect(dialogo).toContainText('Elige un rol.')
    await evidencia(page, 'validacion')
    expect(posts).toEqual([])
  })

  test('cuentas › buscar y filtrar por rol y estado', async ({ page }) => {
    const filas = page.getByRole('table', { name: 'Cuentas' }).getByRole('row')
    await page.getByLabel('Estado', { exact: true }).selectOption('desactivada')
    await expect(filas.filter({ hasText: 'baja@sheets.tt' })).toHaveCount(1)
    await expect(filas.filter({ hasText: ADMIN })).toHaveCount(0)
    await page.getByLabel('Estado', { exact: true }).selectOption('')
    await page.getByLabel('Rol', { exact: true }).selectOption('ADMINISTRADOR')
    await expect(filas.filter({ hasText: ADMIN })).toHaveCount(1)
    await expect(filas.filter({ hasText: EXPERTO })).toHaveCount(0)
    await page.getByLabel('Rol', { exact: true }).selectOption('')
    await page.getByLabel('Buscar').fill('desactivada')
    await expect(filas.filter({ hasText: 'baja@sheets.tt' })).toHaveCount(1)
    await expect(page.getByText(/de \d+ cuentas/)).toBeVisible()
    await evidencia(page, 'buscar-y-filtrar')
  })

  test('cuenta propia › no se puede desactivar ni quitarse el rol', async ({ page }) => {
    const propia = page.getByRole('table', { name: 'Cuentas' }).getByRole('row').filter({ hasText: ADMIN })
    await expect(propia).toContainText('(tú)')
    await expect(propia.getByRole('button', { name: `Desactivar ${ADMIN}` })).toBeDisabled()
    await propia.getByRole('button', { name: `Editar ${ADMIN}` }).click()
    await expect(page.getByRole('dialog', { name: 'Editar cuenta' }).getByLabel('Rol')).toBeDisabled()
    await evidencia(page, 'cuenta-propia')
  })
})

test.describe('Errores', () => {
  test('una pantalla que falla muestra "Algo salió mal" sin dejar la app en blanco, y se recupera', async ({ page }) => {
    await entrar(page, EXPERTO)
    // Una respuesta con forma inesperada hace fallar el dibujo de Gráficos.
    await page.route('**/api/arboles', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    await page.goto('/#/graficos')
    await expect(page.getByRole('alert').filter({ hasText: 'Algo salió mal' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
    await evidencia(page, 'algo-salio-mal')
    await page.unroute('**/api/arboles')
    await page.getByRole('button', { name: 'Ir a Resumen' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Necesita tu atención' })).toBeVisible()
  })
})
