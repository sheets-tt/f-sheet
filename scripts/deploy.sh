#!/usr/bin/env sh
# Publica dist/ en S3 y invalida index.html en CloudFront.
#
# Uso:
#   S3_BUCKET=mi-bucket CLOUDFRONT_DISTRIBUTION_ID=E123ABC npm run deploy
#
# Variables opcionales:
#   DRY_RUN=1      muestra lo que haría (aws s3 sync --dryrun) y no invalida.
#   SKIP_BUILD=1   no ejecuta `npm run build` (usa el dist/ existente).
#   PRUNE=1        borra del bucket assets antiguos (por defecto se conservan para que
#                  los clientes con un index.html anterior en memoria sigan funcionando).
#   AWS_PROFILE / AWS_REGION  los de la CLI de AWS.
set -eu

: "${S3_BUCKET:?Define S3_BUCKET (output BucketName del stack)}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Define CLOUDFRONT_DISTRIBUTION_ID (output DistributionId del stack)}"

DIST_DIR="dist"
DRY=""
[ "${DRY_RUN:-0}" = "1" ] && DRY="--dryrun"
DELETE=""
[ "${PRUNE:-0}" = "1" ] && DELETE="--delete"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npm run build
fi
[ -f "$DIST_DIR/index.html" ] || { echo "No existe $DIST_DIR/index.html" >&2; exit 1; }

IMMUTABLE="public,max-age=31536000,immutable"
NO_CACHE="no-cache"

echo "==> 1/3 assets con hash (immutable, 1 año)"
# shellcheck disable=SC2086
aws s3 sync "$DIST_DIR/assets" "s3://$S3_BUCKET/assets" \
  --cache-control "$IMMUTABLE" $DELETE $DRY

echo "==> 2/3 resto de ficheros (no-cache), index.html al final"
# shellcheck disable=SC2086
aws s3 sync "$DIST_DIR" "s3://$S3_BUCKET" \
  --exclude "assets/*" --exclude "index.html" \
  --cache-control "$NO_CACHE" $DRY
# shellcheck disable=SC2086
aws s3 cp "$DIST_DIR/index.html" "s3://$S3_BUCKET/index.html" \
  --cache-control "$NO_CACHE" --content-type "text/html; charset=utf-8" $DRY

echo "==> 3/3 invalidación de CloudFront (/index.html y /)"
if [ -n "$DRY" ]; then
  echo "(dry-run) aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths /index.html /"
else
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/index.html" "/" \
    --query 'Invalidation.Id' --output text
fi

echo "Despliegue completado."
