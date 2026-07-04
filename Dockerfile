# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve static assets with Caddy, so this image is rarely used directly.
# Keep it around for App Platform / testing.
FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
