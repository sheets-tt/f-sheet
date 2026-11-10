#!/bin/sh
# Backend real para el E2E: b-sheet (hermano de este repo) contra una BD recién creada.
# Flyway (perfil dev) aplica la réplica del esquema de TT_BKN + db/demo en cada corrida.
set -eu

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
