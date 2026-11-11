/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Hojas de fuentes self-hosted (solo CSS, sin tipos).
declare module '@fontsource-variable/*'
