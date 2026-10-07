/** Base de la API sin barra final. Default '/api' (mismo origen vía CloudFront → sin CORS). */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
