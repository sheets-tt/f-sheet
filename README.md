# f-sheet — frontend web de sheets-tt

SPA (Vite + React 19 + TypeScript, sin librerías de UI; mapa con MapLibre GL JS) para consultar los datos de
monitoreo fitosanitario que la app móvil captura. Las pantallas de consulta son de solo lectura (`GET` a
b-sheet); lo único que escribe es la gestión de cuentas de Administración.

| Ruta | Pantalla | Datos |
|---|---|---|
| `#/login` | Inicio de sesión; guarda el JWT y los `roles` en `sessionStorage` | `POST /auth/login` |
| `#/` | **Resumen**: focos de infestación, totales, resultado de los análisis, cromático promedio y sincronización | `GET /estadisticas` |
| `#/mapa` | **Mapa** interactivo (MapLibre GL JS): árboles y zonas con su último resultado, radio real de las zonas, filtros por estado y tipo, búsqueda y lista sincronizada. Al elegir un punto (`#/mapa/a-<id>`) muestra su detalle y los 5 análisis más recientes | `GET /arboles` y `/zonas` en paralelo; `GET /analisis?arbol=…&limite=50` o `?zona=…` al elegir |
| `#/arbol/<id>`, `#/zona/<id>` | **Seguimiento**: estado actual, mapa con el punto y dónde se tomó cada foto, confianza de cada análisis en el tiempo, evolución cromática del follaje y línea de tiempo con los cambios de resultado y las fotos | `GET /arboles/{id}` o `/zonas/{id}` y `GET /analisis?arbol=…&limite=200` en paralelo |
| `#/analisis` | **Análisis**: tabla con filtros por fechas, tipo, resultado y sincronización; "Ver foto" abre la evidencia en un diálogo | `GET /analisis?…&limite=100`, `GET /analisis/{id}/evidencia` |
| `#/admin` | **Administración** (solo `ADMINISTRADOR`): gestión de cuentas (crear, editar, asignar rol, desactivar y activar, con búsqueda y filtros por rol y estado) y dispositivos | `GET /cuentas`, `/dispositivos`; `POST /cuentas`, `PUT /cuentas/{id}`, `PATCH /cuentas/{id}/desactivar` y `/activar` |

El encabezado muestra el nombre de `GET /me`. Sin sesión todo redirige a `#/login`; un experto de campo
que abre `#/admin` vuelve al resumen (y el backend responde 403 de todos modos).

### Cuentas (RN-01, RF-26)

- **No hay registro público**: solo un administrador crea cuentas, desde Administración → "Crear cuenta".
- El formulario (un `<dialog>` modal: foco en el primer campo, Esc o "Cancelar" cierran y el foco
  vuelve al botón que lo abrió) valida lo mismo que b-sheet antes de enviar: correo válido (máx. 254),
  nombre de 1 a 255 caracteres sin contar espacios de los extremos, rol, contraseña de al menos 8
  caracteres y como máximo 72 bytes en UTF-8 (límite de bcrypt), y confirmación. Al editar, la
  contraseña vacía conserva la actual y no se envía.
- Desactivar y activar piden confirmación. Una cuenta desactivada no puede iniciar sesión; sus datos se conservan.
- La cuenta de la sesión no se puede desactivar ni perder el rol de administrador: los controles
  aparecen deshabilitados con la explicación (y el backend responde 409 si se intenta igual).
- Errores del backend: el 409 por correo repetido se muestra en el campo Correo; los demás, como
  alerta dentro del diálogo. Los cambios se aplican en la tabla sin volver a pedir la lista.

Está pensada para servirse desde **S3 + CloudFront**. El contrato de API está en `../API_CONTRACT.md` (v1).

Las fotos se muestran con la URL firmada (5 min) que entrega b-sheet. La CSP de `infra/cloudfront.yaml`
permite `img-src` solo para ese bucket (parámetros `EvidenciasBucket` y `EvidenciasRegion`).

### Mapa

- **Motor**: MapLibre GL JS (licencia BSD, sin clave). Las pantallas hablan con `lib/motorMapa.ts`,
  nunca con `maplibre-gl` directo; en las pruebas unitarias (jsdom, sin WebGL) se sustituye por
  `src/test/motorFalso.ts`.
- **Mapa base**: teselas vectoriales de [OpenFreeMap](https://openfreemap.org) (datos de
  OpenStreetMap, gratis y sin clave) con un estilo propio y apagado (`lib/estiloMapa.ts`), para que
  resalten los estados. Si las teselas no cargan, el mapa sigue funcionando con fondo liso.
- **Marcadores**: cada árbol y zona es un `<button>` real sobre el mapa, con nombre accesible
  ("Oyamel del lago (Abies religiosa): Infestado"), forma + color por estado y área de toque de 32 px.
  Se recorren con Tab; Esc cierra el detalle. La lista de puntos sigue siendo la alternativa en texto.
- **CSP**: `connect-src` agrega `https://tiles.openfreemap.org` (teselas y fuentes) y el worker de
  MapLibre se sirve desde el propio sitio (`worker-src 'self'`, sin `blob:`).
- **Sin WebGL** el mapa muestra un aviso y la lista sigue funcionando.
- **Créditos**: OpenFreeMap, OpenMapTiles y OpenStreetMap aparecen en el botón ⓘ del mapa; son
  obligatorios por licencia, no los quites.

### Identidad visual

- **Paleta de marca**: verde `#00704A`, blanco `#FFFFFF`, verde casa `#1E3932`, menta `#D4E9E2`
  y oro `#CBA258` (tokens en `src/styles.css`). En modo oscuro la superficie es el verde casa.
  El oro solo va sobre verde (sobre blanco no llega a 3:1); los colores de estado no salen de esta paleta.
- **Motivo**: las galerías que el descortezador excava bajo la corteza (`components/Galeria.tsx`).
  Se "excava" una vez en el login; en el resumen aparece quieto detrás del estado del bosque.
- **Tipografía**: Schibsted Grotesk variable, servida desde el propio sitio (`@fontsource-variable`),
  así la CSP sigue en `font-src 'self'`.
- **Carga**: esqueletos con la forma de cada pantalla (`components/Esqueleto.tsx`), decorativos
  (`aria-hidden`) y con su aviso en `role="status"`.
- **Movimiento**: solo en respuesta a lo que hace la persona (cambio de sección, elegir un punto,
  abrir una foto) más la galería del login. Con `prefers-reduced-motion` todo queda en su estado final.

### Colores de estado

Validados con el script de la skill de dataviz (CVD protan/deutan/tritan, contraste y luminosidad) en
modo claro y oscuro. Ningún estado depende solo del color: cada uno lleva **forma + etiqueta**
(círculo = bien, triángulo = alerta, cuadrado = aviso, rombo = neutro, anillo = sin datos).

| Significado | Claro | Oscuro |
|---|---|---|
| Sano / sincronizado / cromático sano | `#2a78d6` | `#3987e5` |
| Regular / pendiente | `#eda100` | `#c98500` |
| Infestado / con error / dañado | `#d9466f` | `#d9466f` |
| No determinado / incierto (neutro) | `#a6a9b0` | `#9a9da4` |

"Sano" es azul y no verde a propósito: verde contra carmín no se distingue con deuteranopia.
Las fechas se muestran en hora del centro de México (UTC−6, sin horario de verano) y los filtros por
día cubren el día completo en esa hora.

> **¿Quieres correrlo en tu máquina?** Sigue la guía [docs/correr-en-local.md](docs/correr-en-local.md).

## Requisitos

- Node.js ≥ 20.19 (probado con Node 25)
- pnpm 12 (`npm install -g pnpm@12.16.1`; la versión exacta está en `packageManager` de `package.json`)
- Backend en `http://localhost:8080` para desarrollo (ver repo `b-sheet`)

## Desarrollo

```bash
pnpm install --frozen-lockfile
pnpm dev                         # http://localhost:5173
```

Vite hace de proxy: `/api/*` → `http://localhost:8080/*` (quita el prefijo `/api`, igual que
CloudFront en producción). Así no hace falta CORS en local. Usuario demo: `demo@sheets.tt` / `Demo1234!`.

## Variables de entorno

| Variable            | Default                 | Uso |
|---------------------|-------------------------|-----|
| `VITE_API_BASE_URL` | `/api`                  | Base de la API (se incrusta en el build). Con `/api` las llamadas van al mismo origen y CloudFront las enruta a API Gateway. Puede ser una URL absoluta (`https://xxx.execute-api…`), pero entonces el backend debe permitir el origen en `CORS_ALLOWED_ORIGINS`. |
| `DEV_API_TARGET`    | `http://localhost:8080` | Solo `pnpm dev`: destino del proxy de `/api`. |
| `BUILD_SOURCEMAP`   | _(vacío)_               | `hidden` genera `.map` sin referenciarlos desde el JS (para subir a un sistema de errores, **no** al bucket). |

Copia `.env.example` a `.env.local` si necesitas cambiarlas.

## Scripts

| Comando             | Qué hace |
|---------------------|----------|
| `pnpm dev`          | Servidor de desarrollo con proxy `/api`. |
| `pnpm build`        | `tsc -b` (type-check) + build de producción en `dist/`. |
| `pnpm preview`      | Sirve `dist/` localmente. |
| `pnpm lint`         | ESLint (0 warnings permitidos). |
| `pnpm test`         | Vitest + Testing Library (fetch mockeado). |
| `pnpm test:e2e`     | E2E con Playwright contra b-sheet y Postgres reales (ver abajo). |
| `pnpm run deploy`   | Build + subida a S3 + invalidación de CloudFront (ver abajo). Lleva `run` porque `pnpm deploy` es un comando de pnpm. |

## Pruebas de punta a punta (E2E)

`pnpm test:e2e` levanta todo y lo recorre como una persona en Chromium:

```
Chromium ──► vite preview (build de producción, proxy /api como CloudFront) :5174
                └──► b-sheet real (mn:run, perfil dev) :8082 ──► Postgres local (BD sheets_e2e, nueva en cada corrida)
```

- **Requisitos:** Docker (el Postgres de `b-sheet/docker-compose.yml`), JDK 25 y el repo `b-sheet` al
  lado de este (o `B_SHEET_DIR=/ruta/a/b-sheet`). La primera vez: `pnpm exec playwright install chromium`.
- **Datos:** Flyway carga la réplica del esquema de TT_BKN y `db/demo` (3 árboles, 2 zonas, 5 análisis,
  cuentas `demo@`, `admin@` y `baja@sheets.tt` con `Demo1234!`).
- **S3 sin AWS:** b-sheet firma las fotos con credenciales ficticias y el navegador intercepta la
  descarga; el test revisa que la URL sea la firmada (bucket, clave, `X-Amz-Expires=300`, credencial).
- **Proyectos:** `escritorio` (sesión, recorridos de experto y administrador, mapa, filtros,
  seguimiento de árbol y zona, 403 del backend) y `movil` (Pixel 7: nada desborda a lo ancho, la foto
  cabe, las marcas del mapa miden ≥ 8 px y su área de toque ≥ 24 px).
- **Mapa:** Chromium dibuja WebGL con SwiftShader (sin GPU). El mapa base se ve completo sin internet:
  las teselas y fuentes de OpenFreeMap que usan las pruebas están guardadas en `e2e/mapa-base/`
  (~830 kB, la zona de `db/demo`) y se sirven desde ahí. Si cambian los datos de ejemplo o el mapa
  pide algo que no está guardado, esa parte sale con fondo liso: `pnpm test:e2e:grabar-mapa`
  descarga lo que falte (luego `git add e2e/mapa-base`). `E2E_TESELAS=1` usa internet en vez de la copia.
- Fallos: captura y traza en `test-results/`; reporte con `pnpm exec playwright show-report`.

No cubre la CSP de CloudFront (vite preview no la envía) ni `StrictMode` (solo existe en desarrollo;
lo cubre `FotoEvidencia.test.tsx`).

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
- **Peso**: sin librerías de UI ni router; una fuente variable (~68 kB woff2, latin + latin-ext); CSS propio (~8 kB gzip).
  MapLibre (~293 kB gzip + su worker) va en su propio chunk: solo lo descargan el mapa y el
  seguimiento, se carga después de la lista y sobrevive en caché entre despliegues de la app.

## Build y caché

`pnpm build` produce:

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
S3_BUCKET=<BucketName> CLOUDFRONT_DISTRIBUTION_ID=<DistributionId> pnpm run deploy
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
