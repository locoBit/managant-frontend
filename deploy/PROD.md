# Production (DigitalOcean) - quick guide

Goal: 1 droplet running MySQL + Spring Boot API + Caddy (HTTPS) serving the Vite frontend.

## 1) Create a droplet
- Ubuntu 24.04 LTS
- Size: Basic 1GB/1vCPU is usually enough for light prod
- Add SSH key

## 2) DNS
Point your domain A record to the droplet IP.

## 3) Install Docker
On droplet:
```bash
sudo apt update
sudo apt install -y docker.io
# docker compose (v2) OR docker-compose (v1)
sudo apt install -y docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

## 4) Upload repo + env
Clone your repos OR upload via scp.

Create a prod env file next to docker-compose.prod.yml:
```bash
cp ../../managant-backend/.env.example .env
```
Edit `.env`:
- DB_NAME/DB_USER/DB_PASSWORD/MYSQL_ROOT_PASSWORD
- GOOGLE_CLIENT_ID (same as frontend)

Frontend:
- build locally: `npm run build`
- upload `dist/` to the droplet at the path mounted by compose (`../dist` relative to deploy/).

## 5) Caddy domain
Edit `deploy/caddy/Caddyfile` and replace `:80` with your real domain:
```
your-domain.com {
  ...
}
```
Caddy will auto-issue HTTPS certs.

## 6) Start
From `managant/deploy` on the droplet:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 7) Backups (recommended)
At minimum: nightly mysqldump to a folder + DO backups or Spaces.

Example:
```bash
docker exec managant-mysql mysqldump -uroot -p$MYSQL_ROOT_PASSWORD $DB_NAME > backup.sql
```
