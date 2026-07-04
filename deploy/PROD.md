# Production (DigitalOcean) - quick guide

Goal: 1 droplet running MySQL + Spring Boot API + Caddy (HTTPS) serving the Vite frontend.

This setup assumes **images are built in GitHub Actions and pushed to GHCR** on every merge to `main`.

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

## 4) Upload deploy bundle + env
On the droplet, you only need the `deploy/` folder (compose + caddy config).

Create `.env` next to `docker-compose.prod.yml`:
```bash
cp .env.prod.example .env
```
Edit `.env`:
- `GHCR_OWNER` (your github org/user, MUST be lowercase for GHCR, e.g. `locobit`)
- DB_* vars
- `GOOGLE_CLIENT_ID`

Also set these (used by the frontend build in GitHub Actions):
- `VITE_API_BASE` (recommended: empty string so frontend calls same-origin `/api`)
- `VITE_GOOGLE_CLIENT_ID`

## 5) Allow pulling GHCR images
If your GHCR packages are private, login once on the droplet:
```bash
docker login ghcr.io -u YOUR_GITHUB_USER
```
Use a GitHub Personal Access Token with `read:packages`.

## 6) Caddy domain
Edit `deploy/caddy/Caddyfile` and replace `:80` with your real domain:
```
your-domain.com {
  ...
}
```
Caddy will auto-issue HTTPS certs.

## 7) Start
From `deploy/` on the droplet:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 8) Update on new merges
Whenever you merge to main, GitHub Actions pushes new images.
On the droplet, update with:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 7) Backups (recommended)
At minimum: nightly mysqldump to a folder + DO backups or Spaces.

Example:
```bash
docker exec managant-mysql mysqldump -uroot -p$MYSQL_ROOT_PASSWORD $DB_NAME > backup.sql
```
