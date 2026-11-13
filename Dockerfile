# syntax=docker/dockerfile:1
# Imagen de respaldo del frontend. En producción la web se sirve desde S3 + CloudFront;
# esta imagen permite servirla en ECS/App Runner/EC2 si alguna vez hace falta.
# Replica lo que hace CloudFront: caché de assets, cabeceras de seguridad y /api/* -> backend.

FROM --platform=$BUILDPLATFORM node:25-alpine AS build
WORKDIR /app
# pnpm en la versión fijada en package.json (packageManager).
RUN npm install -g pnpm@12.16.1
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build

# nginx sin root, escucha en 8080. Las plantillas de /etc/nginx/templates se procesan con envsubst al arrancar.
FROM nginxinc/nginx-unprivileged:1.29-alpine
ENV API_UPSTREAM=http://backend:8080 \
    NGINX_ENVSUBST_FILTER=^API_
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
