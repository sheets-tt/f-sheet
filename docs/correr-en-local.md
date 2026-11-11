# Cómo correr Sheets TT en local

Esta guía levanta la aplicación web completa en tu máquina: la base de datos con datos de ejemplo,
el backend (`b-sheet`) y el frontend (`f-sheet`). También explica cómo correr las pruebas, incluidas
las de punta a punta (E2E) en modo lento para verlas paso a paso.

Nada de esto toca AWS ni la base de producción.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Docker Desktop | cualquiera reciente, **abierto** | Postgres local |
| Java (JDK) | 25 | `b-sheet` |
| Node.js | 20.19 o mayor | `f-sheet` |
| pnpm | 12 | Dependencias y scripts de `f-sheet` |

Si no tienes pnpm, instálalo una vez con `npm install -g pnpm@12.16.1` (la versión exacta está en
`packageManager` de `package.json`).

Los dos repos deben estar uno junto al otro:

```
tt/
├── b-sheet/
└── f-sheet/
```

La primera vez, instala las dependencias del frontend y el navegador de las pruebas:

```bash
cd tt/f-sheet
pnpm install
pnpm exec playwright install chromium
```

### Puertos

| Puerto | Qué corre ahí |
|---|---|
| 5434 | Postgres de `b-sheet` (Docker) |
| 8081 | `b-sheet` cuando lo corres a mano (esta guía) |
| 5173 | `f-sheet` con `pnpm dev` |
| 8082 y 5174 | Reservados para las pruebas E2E: déjalos libres |

El backend usa por defecto el 8080 y la base el 5432. Si otro proyecto ya los ocupa, usa los
puertos de la tabla, como en los comandos de abajo.

## Opción 1: correr la aplicación y navegarla

Necesitas dos terminales.

### Terminal 1: base de datos y backend

```bash
cd tt/b-sheet

# Postgres en Docker (puerto 5434)
docker compose up -d --wait db

# Solo la primera vez: una base propia para trabajar en local
docker compose exec -T db psql -U sheets -d sheets -c "CREATE DATABASE sheets_local"

# Backend en el puerto 8081
export JAVA_HOME=$(/usr/libexec/java_home -v 25)
DB_URL=jdbc:postgresql://localhost:5434/sheets_local DB_USER=sheets DB_PASSWORD=sheets PORT=8081 \
  ./mvnw mn:run -Pdev
```

Al arrancar, Flyway crea las tablas y carga los datos de ejemplo de `src/main/resources/db/demo`.
El backend está listo cuando `curl localhost:8081/health` responde.

`-Pdev` activa el entorno de desarrollo, que trae un secreto JWT solo para local. En AWS el backend
lee sus secretos de Secrets Manager; ver el README de `b-sheet`.

### Terminal 2: frontend

```bash
cd tt/f-sheet
DEV_API_TARGET=http://localhost:8081 pnpm dev
```

Abre **http://localhost:5173**. Vite manda las llamadas a `/api/*` al backend, igual que
CloudFront en producción.

### Cuentas de ejemplo

Todas usan la contraseña `Demo1234!`.

| Correo | Qué ves |
|---|---|
| `demo@sheets.tt` | Experto de campo: Resumen, Mapa y Análisis |
| `admin@sheets.tt` | Administrador: además, la sección Administración |
| `baja@sheets.tt` | Cuenta dada de baja: el login la rechaza |

### Lo que no funciona en local

**Las fotos de evidencia no cargan.** Las fotos de los datos de ejemplo (`evidencias/e1.jpg`, …) no
existen en el bucket real de S3, así que verás el mensaje de error en lugar de la foto. En las
pruebas E2E sí aparecen, porque el navegador intercepta la descarga y responde con una imagen de prueba.

### Apagar todo

- Backend y frontend: `Ctrl+C` en cada terminal.
- Base de datos: `cd tt/b-sheet && docker compose stop db`. Los datos se conservan para la próxima vez.

Para empezar con los datos de ejemplo limpios, borra la base y vuelve a crearla:

```bash
cd tt/b-sheet
docker compose exec -T db psql -U sheets -d sheets \
  -c "DROP DATABASE IF EXISTS sheets_local" -c "CREATE DATABASE sheets_local"
```

## Opción 2: ver las pruebas de punta a punta

Las pruebas E2E levantan todo solas: una base nueva (`sheets_e2e`), `b-sheet` en el 8082 y el
build de producción de `f-sheet` en el 5174. Solo necesitas Docker abierto y esos dos puertos libres.
Si dejaste corriendo la Opción 1, no estorba: usa otros puertos.

### Paso a paso

1. **Abre Docker Desktop** y espera a que diga que está corriendo.
2. **Revisa que los puertos 8082 y 5174 estén libres.** Si este comando no imprime nada, están libres:
   ```bash
   lsof -i :8082 -i :5174
   ```
   Si imprime algo, ciérralo con `lsof -ti :8082 -i :5174 | xargs kill`.
3. **Entra al frontend.** Si es la primera vez, instala también las dependencias y el navegador:
   ```bash
   cd tt/f-sheet
   pnpm install                           # solo la primera vez
   pnpm exec playwright install chromium  # solo la primera vez
   ```
4. **Corre las pruebas en modo visible y lento:**
   ```bash
   pnpm test:e2e:ver
   ```
5. **Espera a que arranque todo.** No necesitas levantar nada a mano: Playwright crea la base
   `sheets_e2e`, arranca `b-sheet` en el 8082 y construye y sirve `f-sheet` en el 5174. Puede tardar
   1 o 2 minutos, sobre todo la primera vez que Maven descarga dependencias. Mientras tanto la
   terminal se ve quieta.
6. **Mira las pruebas.** Se abre una ventana de Chromium que escribe, hace clic y navega sola, con
   800 ms de pausa por acción. Al terminar cada prueba la ventana se cierra y se abre la siguiente.
7. **Lee el resultado** en la terminal (`21 passed`). Si algo falló, abre el reporte con capturas y
   trazas:
   ```bash
   pnpm exec playwright show-report
   ```

Al terminar, Playwright apaga el backend y el frontend de prueba. La base de Docker sigue
encendida; apágala con `cd tt/b-sheet && docker compose stop db` si ya no la usas.

### Otras formas de correrlas

| Comando | Qué hace |
|---|---|
| `pnpm test:e2e` | Corre las 21 pruebas sin ventana, en paralelo (~25 s) |
| `pnpm test:e2e:ver` | Una sola ventana de Chromium, pruebas una tras otra, 800 ms de pausa por acción |
| `E2E_LENTO=1500 pnpm test:e2e:ver` | Igual, pero más lento (el número son milisegundos por acción) |
| `pnpm test:e2e:ver -g "mapa"` | Solo las pruebas cuyo nombre contiene "mapa" |
| `pnpm test:e2e:ver --project=escritorio` | Solo escritorio, sin las pruebas de móvil |
| `pnpm test:e2e --ui` | Interfaz de Playwright: eliges una prueba y avanzas o retrocedes paso a paso |
| `pnpm exec playwright show-report` | Abre el reporte HTML de la última corrida |

En modo `ver`, cada prueba abre su propia ventana y la cierra al terminar: verás que una se cierra y
se abre otra, pero nunca hay más de una a la vez.

## Pruebas unitarias y revisiones

```bash
# Frontend
cd tt/f-sheet
pnpm test        # Vitest
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm build       # build de producción en dist/

# Backend
cd tt/b-sheet
docker compose up -d --wait db
export JAVA_HOME=$(/usr/libexec/java_home -v 25)
./mvnw test
```

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop cerrado | Ábrelo y espera a que diga que está corriendo |
| `Port 5173 is in use` o `address already in use` | Quedó un proceso de antes | `lsof -ti :5173 \| xargs kill` (cambia el puerto según el caso) |
| El E2E dice que el 8082 o el 5174 ya está en uso | Una corrida anterior no terminó | `lsof -ti :8082 -i :5174 \| xargs kill` |
| `release version 25 not supported` | Maven está usando otro JDK | Corre el `export JAVA_HOME=...` de arriba |
| `database "sheets_local" does not exist` | Te saltaste el `CREATE DATABASE` | Córrelo (Terminal 1) |
| Flyway: `Validate failed` / `checksum mismatch` | La base se creó con una versión anterior de las migraciones | Bórrala y créala de nuevo (ver *Apagar todo*) |
| La página carga pero dice que no se pudieron cargar los datos | El backend no está arriba o `DEV_API_TARGET` apunta a otro puerto | Revisa la Terminal 1 y `curl localhost:8081/health` |
