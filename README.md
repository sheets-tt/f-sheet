# f-sheet — frontend web de sheets-tt

SPA mínima (Vite + React 19 + TypeScript) con dos pantallas:

- **Login** (`#/login`): `POST /auth/login` y guarda el JWT en `sessionStorage`.
- **Bienvenida** (`#/`): `GET /me`, muestra `displayName` y tiene un botón para cerrar sesión.

Está pensada para servirse desde **S3 + CloudFront**. El contrato de API está en `../API_CONTRACT.md` (v1).

## Requisitos

- Node.js ≥ 20.19 (probado con Node 25 / npm 11)
- Backend en `http://localhost:8080` para desarrollo (ver repo `b-sheet`)

## Desarrollo

```bash
npm ci
npm run dev          # http://localhost:5173
```

Vite hace de proxy: `/api/*` → `http://localhost:8080/*` (quita el prefijo `/api`, igual que
CloudFront en producción). Así no hace falta CORS en local. Usuario demo: `demo@sheets.tt` / `Demo1234!`.

## Variables de entorno

| Variable            | Default                 | Uso |
|---------------------|-------------------------|-----|
| `VITE_API_BASE_URL` | `/api`                  | Base de la API (se incrusta en el build). Con `/api` las llamadas van al mismo origen y CloudFront las enruta a API Gateway. Puede ser una URL absoluta (`https://xxx.execute-api…`), pero entonces el backend debe permitir el origen en `CORS_ALLOWED_ORIGINS`. |
| `DEV_API_TARGET`    | `http://localhost:8080` | Solo `npm run dev`: destino del proxy de `/api`. |
| `BUILD_SOURCEMAP`   | _(vacío)_               | `hidden` genera `.map` sin referenciarlos desde el JS (para subir a un sistema de errores, **no** al bucket). |

Copia `.env.example` a `.env.local` si necesitas cambiarlas.

## Scripts

| Comando             | Qué hace |
|---------------------|----------|
| `npm run dev`       | Servidor de desarrollo con proxy `/api`. |
| `npm run build`     | `tsc -b` (type-check) + build de producción en `dist/`. |
| `npm run preview`   | Sirve `dist/` localmente. |
| `npm run lint`      | ESLint (0 warnings permitidos). |
| `npm test`          | Vitest + Testing Library (fetch mockeado). |
| `npm run deploy`    | Build + subida a S3 + invalidación de CloudFront (ver abajo). |

## Decisiones de diseño

- **Routing por hash** (`#/login`, `#/`). No requiere reglas en CloudFront: siempre se sirve
  `/index.html`. Se descartó History API porque el fallback típico (custom error responses
  403/404 → `/index.html`) es **global** a la distribución y convertiría los 401/403/404 de
  `/api/*` en un `200 text/html`, rompiendo el manejo de errores. Si en el futuro se quiere
  History API, usar una CloudFront Function en el *default behavior* que reescriba a
  `/index.html` las rutas sin extensión, no custom error responses.
- **Sesión**: `sessionStorage` (clave `sheets-tt.session`) con `try/catch` y fallback en memoria.
  Se descarta al expirar (`expires_in`) o ante cualquier 401 de una llamada autenticada,
  volviendo a login con un aviso.
- **Accesibilidad**: labels explícitos, foco gestionado (campo usuario al entrar, error tras
  fallo, encabezado en bienvenida), errores con `role="alert"` dentro de una región `aria-live`,
  `aria-invalid`/`aria-busy`, enlace "saltar al contenido", `prefers-reduced-motion`, modo oscuro.
- **Peso**: sin librerías de UI ni router; fuentes del sistema; CSS propio (~1,8 kB gzip).

## Build y caché

`npm run build` produce:

```
dist/index.html                   (no-cache)
dist/favicon.svg                  (no-cache)
dist/assets/index-[hash].js       entrada de la app
dist/assets/react-[hash].js       React/ReactDOM en chunk aparte (cambia poco → sigue en caché)
dist/assets/LoginScreen-[hash].js   pantallas cargadas bajo demanda
dist/assets/WelcomeScreen-[hash].js
dist/assets/index-[hash].css
```

Tamaños aproximados (gzip): app ≈ 2,7 kB + pantallas ≈ 1 kB c/u + CSS ≈ 1,8 kB + React ≈ 68 kB.
Sin source maps en producción. La compresión (gzip/brotli) la hace CloudFront (`Compress: true`);
no se precomprime en S3 porque S3 no negocia `Accept-Encoding`.

## Infraestructura (CloudFront)

`infra/cloudfront.yaml` (CloudFormation) crea:

- Bucket S3 **privado** (Block Public Access, cifrado, versionado) accesible solo vía **OAC**.
- Distribución CloudFront: HTTP/2 + HTTP/3, IPv6, `redirect-to-https`, `index.html` como raíz.
  - *Default behavior* → S3 con **CachingOptimized** y compresión.
  - `/api/*` → origen **API Gateway** (parámetro `ApiGatewayDomainName`) con **CachingDisabled**,
    **AllViewerExceptHostHeader** y una **CloudFront Function** que quita el prefijo `/api`
    (`/api/me` → `/me`). `ApiOriginPath` permite anteponer un stage (p. ej. `/prod`).
  - **Response headers policy** de seguridad: HSTS, CSP estricta (`'self'`), `X-Content-Type-Options`,
    `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP.
- Dominio propio opcional (`AliasDomainName` + `AcmCertificateArn` en us-east-1).

Ejemplo (no se ejecuta desde este repo; revisa antes de lanzarlo):

```bash
aws cloudformation deploy \
  --stack-name sheets-tt-web \
  --template-file infra/cloudfront.yaml \
  --parameter-overrides ApiGatewayDomainName=abc123.execute-api.us-east-1.amazonaws.com

aws cloudformation describe-stacks --stack-name sheets-tt-web \
  --query 'Stacks[0].Outputs' --output table   # BucketName, DistributionId, URL
```

## Despliegue

```bash
S3_BUCKET=<BucketName> CLOUDFRONT_DISTRIBUTION_ID=<DistributionId> npm run deploy
# DRY_RUN=1   → solo muestra lo que haría
# SKIP_BUILD=1 → reutiliza dist/
# PRUNE=1     → borra assets antiguos del bucket
```

`scripts/deploy.sh` hace, en este orden:

1. `aws s3 sync dist/assets s3://$S3_BUCKET/assets --cache-control "public,max-age=31536000,immutable"`
2. Resto de ficheros con `--cache-control no-cache`, y `index.html` el último (también `no-cache`).
3. `aws cloudfront create-invalidation --paths /index.html /`

Por defecto **no** borra assets antiguos: un usuario con el `index.html` anterior puede seguir
pidiendo chunks viejos (carga diferida). Usa `PRUNE=1` de vez en cuando.

## Tests

`src/App.test.tsx` (Vitest + jsdom + Testing Library, `fetch` mockeado):

- sin sesión → redirige a `#/login`
- login OK → bienvenida con `displayName` de `/me` y header `Authorization: Bearer …`
- 401 en login → mensaje de error accesible (`role="alert"`)
- campos vacíos → validación sin llamar a la API
- 401 en `/me` (token expirado) → vuelve a login con aviso
- cerrar sesión → borra el token y vuelve a login
