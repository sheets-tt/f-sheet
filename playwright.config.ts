import { defineConfig, devices } from '@playwright/test'

// E2E de punta a punta: Chromium → build de producción de f-sheet (vite preview, mismo proxy /api
// que CloudFront) → b-sheet real → Postgres local con los datos de db/demo. Sin mocks entre capas;
// lo único interceptado es la descarga de S3 (ver e2e/ayuda.ts).
const FRONT = 'http://localhost:5174'
const BACK = 'http://localhost:8082'
// Para verlo a ritmo humano: E2E_LENTO=800 (ms de pausa por acción). Ver script test:e2e:ver.
const LENTO = Number(process.env.E2E_LENTO ?? 0)
// El mapa base (OpenFreeMap) es lo único que vendría de internet: las pruebas lo sirven desde la
// copia de e2e/mapa-base (ver e2e/ayuda.ts) y el navegador no puede resolver el dominio real.
// E2E_TESELAS=1 usa internet; E2E_GRABAR_MAPA=1 completa la copia.
const TESELAS = process.env.E2E_TESELAS === '1'
const ARGS_CHROMIUM = [
  // MapLibre necesita WebGL; en Chromium sin GPU (headless, CI) lo da SwiftShader.
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  ...(TESELAS ? [] : ['--host-resolver-rules=MAP tiles.openfreemap.org ~NOTFOUND']),
]

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  timeout: LENTO ? 180_000 : 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONT,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { slowMo: LENTO, args: ARGS_CHROMIUM },
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/movil.e2e.ts' },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: '**/movil.e2e.ts' },
  ],
  webServer: [
    {
      command: 'sh e2e/iniciar-backend.sh',
      url: `${BACK}/health`,
      timeout: 240_000,
      // Siempre uno nuevo: la BD se recrea al arrancar y los tests cuentan con los datos de db/demo.
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'pnpm build && pnpm exec vite preview --port 5174 --strictPort',
      url: FRONT,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { DEV_API_TARGET: BACK },
    },
  ],
})
