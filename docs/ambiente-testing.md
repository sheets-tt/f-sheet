# Ambiente de pruebas en la Raspberry Pi

Un ambiente completo de sheets-tt (web + API + BD) que vive en la Raspberry Pi 5 de casa, en Docker, y se
despliega solo al hacer push a la rama **`testing`** de cada repo. No toca producción: tiene su propia base
de datos con los datos demo, su propio `JWT_SECRET` y credenciales de AWS ficticias.

| | |
|---|---|
| En la LAN | http://192.168.100.103:8180 |
| Desde fuera | https://testing.formyke.com (túnel de Cloudflare + Cloudflare Access) |
| Cuentas | las de `db/demo` de b-sheet (`demo@sheets.tt`, `admin@sheets.tt`, contraseña `Demo1234!`) |
| Fotos de evidencia | no cargan (no hay S3 en este ambiente) |

## Cómo está armado

```
push a "testing" de b-sheet ─┐                    ┌─ push a "testing" de f-sheet
                             ▼                    ▼
        runner self-hosted de la organización sheets-tt en la Pi (etiqueta "raspberry",
        usuario github-runner, solo para b-sheet y f-sheet)
                             │
  b-sheet: Dockerfile.servidor → sheets-testing-api   │  f-sheet: Dockerfile → sheets-testing-web
  copia infra/testing/compose.yaml a /opt/sheets-testing│  y levanta web
  y levanta db + api                                  │
                             ▼
  /opt/sheets-testing (docker compose, proyecto sheets-testing)
    db   postgres:16   solo red interna   (BD propia; Flyway perfil dev crea el esquema + datos demo)
    api  b-sheet       solo red interna   (servidor Netty, no la imagen de Lambda)
    web  f-sheet       :8180              (nginx; /api/* → api, igual que CloudFront en producción)
```

- El compose vive en **b-sheet** (`infra/testing/compose.yaml`). Por eso el **primer** despliegue va en este
  orden: b-sheet primero (crea db y api), después f-sheet (nginx necesita que `api` exista para arrancar).
  Después, cada repo se despliega solo.
- Los secretos (`POSTGRES_PASSWORD`, `JWT_SECRET`) están solo en `/opt/sheets-testing/.env` en la Pi (600,
  dueño `github-runner`). No hay secretos en GitHub para este ambiente.
- Límites de memoria: db 512 MB, api 1 GB, web 128 MB, para no afectar Immich, Jellyfin y lo demás de la Pi.

## Puesta en marcha (una vez)

Desde tu Mac, con el script `ops/raspberry-testing.sh` (pide confirmación en cada paso):

1. `./raspberry-testing.sh estado` — ver qué falta.
2. `./raspberry-testing.sh runner` — te pide el token de registro de GitHub:
   organización sheets-tt → Settings → Actions → Runners → New runner (Linux, ARM64). En **Runner groups →
   Default**, limita el grupo a los repos `b-sheet` y `f-sheet`.
3. `./raspberry-testing.sh entorno` — crea `/opt/sheets-testing/.env` con secretos aleatorios.
4. Crea la rama `testing` en **b-sheet** desde `main` y haz push. Espera el workflow «Testing (Raspberry Pi)».
5. Lo mismo en **f-sheet**.
6. `./raspberry-testing.sh tunel` — agrega `testing.formyke.com` al túnel de cloudflared que ya usa la Pi.
7. Cloudflare Access (en el navegador): Zero Trust → Access → Applications → Add an application →
   Self-hosted → dominio `testing.formyke.com` → política «Allow» con tu correo (método: código por correo).
   Hasta que la crees, el sitio es público (aunque hace falta una cuenta para entrar a la app).
8. `./raspberry-testing.sh probar`.

## Uso diario

```bash
git switch testing && git merge main && git push   # o: git push origin <rama>:testing
```

El workflow construye la imagen en la Pi, reinicia solo su servicio, espera a que esté sano y lo prueba
(`/healthz`, `/api/health`, `/api/arboles` → 401). También se puede lanzar a mano desde Actions
(«Run workflow»).

## Operación en la Pi

```bash
ssh miguelrasp
cd /opt/sheets-testing
docker compose ps
docker compose logs -f api
# Empezar con la BD limpia (borra los datos del ambiente, no los de producción):
docker compose down && docker volume rm sheets-testing_db && docker compose up -d
```

Para quitar el ambiente: `docker compose down -v` en `/opt/sheets-testing`, `./raspberry-testing.sh
deshacer-tunel`, y quitar el runner en GitHub (Settings → Actions → Runners).
