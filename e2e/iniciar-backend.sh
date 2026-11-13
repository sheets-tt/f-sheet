#!/bin/sh
# Backend real para el E2E: b-sheet (hermano de este repo) contra una BD recién creada.
# Flyway (perfil dev) aplica la réplica del esquema de TT_BKN + db/demo en cada corrida.
set -eu

# Candado: dos corridas a la vez comparten :8082 y la BD sheets_e2e (que aquí se borra y se vuelve a
# crear), y se rompen entre sí. Se revisa ANTES de tocar la BD. Es un directorio (mkdir es atómico:
# de dos corridas que arrancan juntas, solo una lo crea) con el PID del backend dentro (exec mantiene
# el PID). Si ese proceso ya no vive, el candado está viejo y se reemplaza.
CANDADO="${TMPDIR:-/tmp}/sheets-tt-e2e.lock.d"
tomar_candado() { mkdir "$CANDADO" 2>/dev/null && echo $$ >"$CANDADO/pid"; }
if ! tomar_candado; then
  DUENO=$(cat "$CANDADO/pid" 2>/dev/null || true)
  if [ -n "$DUENO" ] && kill -0 "$DUENO" 2>/dev/null; then
    echo "Ya hay una corrida E2E en curso (backend con PID $DUENO): comparten el puerto 8082 y la BD sheets_e2e." >&2
    echo "Espera a que termine (o deténla) y vuelve a correr. Candado: $CANDADO" >&2
    exit 1
  fi
  # Candado viejo (la corrida anterior terminó): se reemplaza. Si otra corrida lo toma primero, gana ella.
  rm -rf "$CANDADO"
  if ! tomar_candado; then
    echo "Otra corrida E2E acaba de tomar el candado ($CANDADO). Espera a que termine." >&2
    exit 1
  fi
fi
if (exec 3<>/dev/tcp/127.0.0.1/8082) 2>/dev/null || nc -z 127.0.0.1 8082 2>/dev/null; then
  echo "El puerto 8082 ya está ocupado (¿otra corrida E2E o un b-sheet abierto?). Libéralo y vuelve a correr." >&2
  rm -rf "$CANDADO"
  exit 1
fi

B_SHEET_DIR=${B_SHEET_DIR:-../b-sheet}
cd "$B_SHEET_DIR"

# b-sheet compila con Java 25; en macOS se elige aunque el JDK por defecto sea otro.
if [ -x /usr/libexec/java_home ] && /usr/libexec/java_home -v 25 >/dev/null 2>&1; then
  JAVA_HOME=$(/usr/libexec/java_home -v 25)
  export JAVA_HOME
fi

docker compose up -d --wait db >/dev/null
docker compose exec -T db psql -U sheets -d sheets -q \
  -c "DROP DATABASE IF EXISTS sheets_e2e" -c "CREATE DATABASE sheets_e2e"

export DB_URL=jdbc:postgresql://localhost:5434/sheets_e2e DB_USER=sheets DB_PASSWORD=sheets PORT=8082
# Credenciales ficticias: la firma de S3 es local y el navegador intercepta la descarga.
# Nunca se usa un perfil real (las variables de entorno tienen prioridad sobre AWS_PROFILE).
export AWS_ACCESS_KEY_ID=AKIAE2EFICTICIA AWS_SECRET_ACCESS_KEY=e2e-ficticio
unset AWS_PROFILE AWS_SESSION_TOKEN 2>/dev/null || true

exec ./mvnw -q mn:run -Pdev
