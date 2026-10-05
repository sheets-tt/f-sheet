/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración pensada para servir desde S3 + CloudFront:
//  - base '/'           → la app vive en la raíz de la distribución.
//  - assets con hash    → `assets/[name]-[hash].js|css`, cacheables 1 año (immutable).
//  - sin source maps    → no se publican en prod (usa BUILD_SOURCEMAP=hidden para generarlos sin referenciarlos).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devTarget = env.DEV_API_TARGET || 'http://localhost:8080'
  const sourcemap = env.BUILD_SOURCEMAP === 'hidden' ? 'hidden' : false

  return {
    base: '/',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Igual que CloudFront en prod: /api/* → backend, quitando el prefijo /api.
        '/api': {
          target: devTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap,
      cssCodeSplit: true,
      // Los SVG/fuentes pequeñas se incrustan; evita peticiones extra.
      assetsInlineLimit: 4096,
      reportCompressedSize: true,
      modulePreload: { polyfill: false },
      rolldownOptions: {
        output: {
          // React en su propio chunk: cambia poco, así sobrevive en caché entre despliegues de la app.
          codeSplitting: {
            groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  }
})
