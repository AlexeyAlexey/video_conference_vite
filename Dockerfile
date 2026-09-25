# Build the Vite (native JS) frontend and serve it with Nginx.
#
# The VITE_* variables are baked into the bundle at BUILD time via
# `import.meta.env`, so they must be present in the build stage.
#
#   VITE_SCHEMA / VITE_HOST / VITE_PORT
#       Origin of the frontend itself (used to build shared-link URLs).
#   VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL / VITE_MANAGER_SERVER_HOST / VITE_MANAGER_SERVER_PORT
#       Phoenix (video_conference) websocket endpoint the browser connects to.
#   VITE_MANAGER_HTTP_SERVER_PROTOCOL / VITE_MANAGER_HTTP_SERVER_PORT
#       Phoenix (video_conference) HTTP API endpoint the browser connects to.

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
# Pin npm to a version compatible with the committed lockfile (npm 12's `ci`
# rejects this lockfile, so match the npm that generated it).
COPY package.json package-lock.json ./
RUN npm install -g npm@11.6.2 && npm ci

# Copy the rest of the source.
COPY . .

# VITE_* values are read by Vite at build time (import.meta.env).
ARG VITE_SCHEMA=http
ARG VITE_HOST=localhost
ARG VITE_PORT=8080
ARG VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL=ws
ARG VITE_MANAGER_HTTP_SERVER_PROTOCOL=http
ARG VITE_MANAGER_SERVER_HOST=localhost
ARG VITE_MANAGER_SERVER_PORT=80
ARG VITE_MANAGER_HTTP_SERVER_PORT=80

ENV VITE_SCHEMA=${VITE_SCHEMA} \
    VITE_HOST=${VITE_HOST} \
    VITE_PORT=${VITE_PORT} \
    VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL=${VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL} \
    VITE_MANAGER_HTTP_SERVER_PROTOCOL=${VITE_MANAGER_HTTP_SERVER_PROTOCOL} \
    VITE_MANAGER_SERVER_HOST=${VITE_MANAGER_SERVER_HOST} \
    VITE_MANAGER_SERVER_PORT=${VITE_MANAGER_SERVER_PORT} \
    VITE_MANAGER_HTTP_SERVER_PORT=${VITE_MANAGER_HTTP_SERVER_PORT}

RUN npm run build

# --- Serve stage -----------------------------------------------------------
FROM nginx:1.27-alpine AS final

# SPA: always fall back to index.html so client-side routing works.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080 8443

CMD ["nginx", "-g", "daemon off;"]
