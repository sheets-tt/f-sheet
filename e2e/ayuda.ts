import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test'

export { expect }

/** Cuentas de b-sheet/src/main/resources/db/demo/V2__datos_demo.sql (contraseña Demo1234!). */
export const EXPERTO = 'demo@sheets.tt'
export const ADMIN = 'admin@sheets.tt'
export const DESACTIVADA = 'baja@sheets.tt'
export const CONTRASENA = 'Demo1234!'

/** Inicia sesión por el formulario, como una persona, y espera al resumen. */
export async function entrar(page: Page, correo: string): Promise<void> {
  await page.goto('/#/login')
  await page.getByLabel('Usuario').fill(correo)
  await page.getByLabel('Contraseña').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible()
}

/** Navega por hash y espera a que la pantalla de destino esté pintada (el cambio de hash no recarga). */
export async function ir(page: Page, hash: string, titulo: string): Promise<void> {
  await page.goto(`/${hash}`)
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible()
}

// Una imagen de prueba visible en las capturas (lo que se prueba es la URL que firmó el backend):
// corteza estilizada con el nombre de la clave pedida, para reconocerla en la evidencia.
function fotoDePrueba(clave: string): string {
  const vetas = Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 45} 0 C ${10 + i * 45} 100, ${50 + i * 45} 200, ${25 + i * 45} 300" stroke="#5d2417" stroke-width="${6 + (i % 3) * 3}" fill="none" opacity="0.7"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#c57d56"/>${vetas}<rect x="20" y="230" width="360" height="50" rx="8" fill="#ffffff" opacity="0.85"/><text x="200" y="262" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#1e3932">Foto de prueba E2E · ${clave.replace(/[<&>]/g, '')}</text></svg>`
}

/**
 * Intercepta las descargas del bucket de evidencias (el E2E no habla con AWS) y devuelve las URLs
 * pedidas, para revisar que son las que firmó b-sheet.
 */
export async function interceptarS3(page: Page): Promise<URL[]> {
  const pedidas: URL[] = []
  await page.route(/^https:\/\/descortezadores-archivos-prod\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\//, async (route) => {
    const url = new URL(route.request().url())
    pedidas.push(url)
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: fotoDePrueba(url.pathname.split('/').pop() ?? '') })
  })
  return pedidas
}

// ---------------------------------------------------------------------------------------------
// Mapa base sin internet
// ---------------------------------------------------------------------------------------------
// Las teselas, el TileJSON y las fuentes de OpenFreeMap que usan las pruebas (alrededor de los datos
// de db/demo) están guardados en e2e/mapa-base/, con la misma ruta que en tiles.openfreemap.org. Así
// el mapa se ve completo y las pruebas no dependen de la red.
//
//   E2E_GRABAR_MAPA=1  lo que falte se descarga una vez y se guarda (después: git add e2e/mapa-base)
//   E2E_TESELAS=1      sin copia: el navegador pide todo a internet
// Lo que no esté guardado se aborta: esa parte del mapa queda con el fondo liso.
const MAPA_BASE = join(dirname(fileURLToPath(import.meta.url)), 'mapa-base')
const GRABAR = process.env.E2E_GRABAR_MAPA === '1'
const EN_VIVO = process.env.E2E_TESELAS === '1'

const TIPOS: Record<string, string> = { '.pbf': 'application/x-protobuf', '.json': 'application/json' }

/** "/planet" (TileJSON, sin extensión) se guarda como planet.json. */
function archivoDe(url: URL): string {
  const ruta = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  return join(MAPA_BASE, /\.[a-z]+$/.test(ruta) ? ruta : `${ruta}.json`)
}

async function servirMapaBase(context: BrowserContext): Promise<void> {
  await context.route(/^https:\/\/tiles\.openfreemap\.org\//, async (route) => {
    const url = new URL(route.request().url())
    const archivo = archivoDe(url)
    const tipo = TIPOS[archivo.slice(archivo.lastIndexOf('.'))] ?? 'application/octet-stream'
    const cabeceras = { 'Content-Type': tipo, 'Access-Control-Allow-Origin': '*' }
    try {
      await route.fulfill({ status: 200, headers: cabeceras, body: await readFile(archivo) })
      return
    } catch {
      // No está guardado.
    }
    if (!GRABAR) return route.abort('internetdisconnected')
    const respuesta = await route.fetch()
    if (!respuesta.ok()) return route.fulfill({ response: respuesta })
    const cuerpo = await respuesta.body()
    await mkdir(dirname(archivo), { recursive: true })
    // Varias pruebas en paralelo pueden pedir la misma tesela: se escribe aparte y se renombra.
    const temporal = `${archivo}.${process.pid}.${Math.random().toString(36).slice(2)}`
    await writeFile(temporal, cuerpo)
    await rename(temporal, archivo)
    await route.fulfill({ status: 200, headers: cabeceras, body: cuerpo })
  })
}

// ---------------------------------------------------------------------------------------------
// Evidencia: capturas con nombre de los pasos clave, adjuntas a cada prueba
// ---------------------------------------------------------------------------------------------
// Se ven en el reporte HTML (pnpm exec playwright show-report) y quedan en la carpeta de evidencia
// de `pnpm test:e2e:evidencia`. E2E_PANTALLA_COMPLETA=1 las toma de página completa.
// E2E_CAPTURAS=<carpeta> además las guarda sueltas en esa carpeta.
const PANTALLA_COMPLETA = process.env.E2E_PANTALLA_COMPLETA === '1'
const CAPTURAS = process.env.E2E_CAPTURAS
const pasos = new Map<string, number>()

/**
 * Espera a que terminen las animaciones finitas (fundidos de entrada, la galería del login): la
 * captura sale con la pantalla quieta, sin pausas fijas. Las infinitas (esqueletos, el giro del
 * botón) no cuentan.
 */
export async function animacionesTerminadas(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  )
}

const hayDialogoAbierto = (page: Page) => page.locator('dialog[open]').count().then((n) => n > 0)

/** Adjunta una captura numerada del paso ("01-login.png", "02-resumen.png"…) a la prueba en curso. */
export async function evidencia(page: Page, nombre: string, opciones: { completa?: boolean } = {}): Promise<void> {
  const info = test.info()
  const n = (pasos.get(info.testId) ?? 0) + 1
  pasos.set(info.testId, n)
  await animacionesTerminadas(page)
  const archivo = `${String(n).padStart(2, '0')}-${nombre}.png`
  // Con un <dialog> abierto, la página completa sale cortada: se captura la ventana.
  const completa = (opciones.completa ?? PANTALLA_COMPLETA) && !(await hayDialogoAbierto(page))
  // Como archivo (no embebida): queda en la carpeta de la prueba y el JSON solo guarda la ruta.
  const ruta = info.outputPath(archivo)
  const body = await page.screenshot({ fullPage: completa, path: ruta })
  await info.attach(archivo, { path: ruta, contentType: 'image/png' })
  if (CAPTURAS) {
    await mkdir(CAPTURAS, { recursive: true })
    await writeFile(join(CAPTURAS, `${nombre}.png`), body)
  }
}

/**
 * El `test` de Playwright, con el mapa base servido desde e2e/mapa-base en todas las pruebas y una
 * captura final adjunta a cada prueba (la evidencia mínima de que corrió, también si falla).
 */
export const test = base.extend<{ mapaBase: void; capturaFinal: void }>({
  mapaBase: [
    async ({ context }, use) => {
      if (!EN_VIVO) await servirMapaBase(context)
      await use()
    },
    { auto: true },
  ],
  capturaFinal: [
    async ({ page }, use, info) => {
      await use()
      if (page.isClosed()) return
      try {
        await animacionesTerminadas(page)
        const ruta = info.outputPath('zz-final.png')
        const completa = PANTALLA_COMPLETA && info.project.name !== 'movil' && !(await hayDialogoAbierto(page))
        await page.screenshot({ fullPage: completa, timeout: 5_000, path: ruta })
        await info.attach('zz-final.png', { path: ruta, contentType: 'image/png' })
      } catch {
        /* la página pudo cerrarse o navegar: no es un fallo de la prueba */
      }
    },
    { auto: true },
  ],
})

/** Las etiquetas del eje x del histograma de confianza no se enciman (≥ 4 px entre cajas reales). */
export async function ejeConfianzaSinEncimar(page: Page): Promise<void> {
  const cajas = await page.locator('.eje-x-confianza').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { izq: r.left, der: r.right, texto: e.textContent }
    }),
  )
  expect(cajas.length).toBeGreaterThanOrEqual(3)
  expect(cajas.at(-1)!.texto).toBe('100')
  for (let i = 1; i < cajas.length; i++) expect(cajas[i].izq - cajas[i - 1].der, `${cajas[i - 1].texto} → ${cajas[i].texto}`).toBeGreaterThanOrEqual(4)
}

// ---------------------------------------------------------------------------------------------
// Datos propios por prueba: cuentas creadas por la API (rápido y sin depender de otra prueba)
// ---------------------------------------------------------------------------------------------
let secuencia = 0

/** Correo único por prueba y corrida (las pruebas corren en paralelo sobre la misma BD). */
export function correoUnico(prefijo: string): string {
  secuencia++
  return `${prefijo}.${Date.now().toString(36)}${process.pid.toString(36)}${secuencia}@sheets.tt`
}

export interface CuentaCreada {
  id: string
  correo: string
  contrasena: string
  nombreCompleto: string
}

/** Crea una cuenta con el administrador de db/demo, por la misma API que usa la pantalla. */
export async function crearCuenta(
  request: APIRequestContext,
  { rol = 'EXPERTO_CAMPO', nombre = 'Cuenta de Prueba', prefijo = 'e2e' }: { rol?: 'EXPERTO_CAMPO' | 'ADMINISTRADOR'; nombre?: string; prefijo?: string } = {},
): Promise<CuentaCreada> {
  const login = await request.post('/api/auth/login', { data: { username: ADMIN, password: CONTRASENA } })
  expect(login.ok()).toBeTruthy()
  const { access_token: token } = (await login.json()) as { access_token: string }
  const correo = correoUnico(prefijo)
  const res = await request.post('/api/cuentas', {
    headers: { Authorization: `Bearer ${token}` },
    data: { correo, nombreCompleto: nombre, rol, contrasena: CONTRASENA },
  })
  expect(res.status(), await res.text()).toBe(201)
  const cuenta = (await res.json()) as { id: string; correo: string; nombreCompleto: string }
  return { ...cuenta, contrasena: CONTRASENA }
}

/** Cierra la sesión desde el encabezado y espera al login. */
export async function salir(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
}
