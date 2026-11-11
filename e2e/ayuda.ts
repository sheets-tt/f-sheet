import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test'

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

// PNG de 1×1: el contenido da igual, lo que se prueba es la URL que firmó el backend.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Intercepta las descargas del bucket de evidencias (el E2E no habla con AWS) y devuelve las URLs
 * pedidas, para revisar que son las que firmó b-sheet.
 */
export async function interceptarS3(page: Page): Promise<URL[]> {
  const pedidas: URL[] = []
  await page.route(/^https:\/\/descortezadores-archivos-prod\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\//, async (route) => {
    pedidas.push(new URL(route.request().url()))
    await route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
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

/** El `test` de Playwright, con el mapa base servido desde e2e/mapa-base en todas las pruebas. */
export const test = base.extend<{ mapaBase: void }>({
  mapaBase: [
    async ({ context }, use) => {
      if (!EN_VIVO) await servirMapaBase(context)
      await use()
    },
    { auto: true },
  ],
})
