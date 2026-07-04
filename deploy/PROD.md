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

# IMPORTANT: docker-compose v1 (python) is buggy with newer Docker and can crash with:
# KeyError: 'ContainerConfig'
# Use Docker Compose v2 plugin instead.
sudo apt install -y docker-compose-plugin

# remove v1 if installed
sudo apt remove -y docker-compose || true

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
Edit `deploy/caddy/Caddyfile` and set your real domain:
```
managant.com {
  ...
}
```
Caddy will auto-issue HTTPS certs.

Note: Caddy proxies `/api/*` to the backend without stripping the prefix.

## 7) Start
From `deploy/` on the droplet:
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If you previously installed docker-compose v1, verify:
```bash
docker compose version
```

## 8) Auto-deploy on merge (GitHub Actions -> SSH)
Repos are public, so GHCR pulls are easy.

Add these secrets in BOTH repos (Settings -> Secrets and variables -> Actions -> New repository secret):
- `DROPLET_HOST` = droplet public IP
- `DROPLET_USER` = usually `root` (or your sudo user)
- `DROPLET_SSH_PORT` = `22`
- `DROPLET_SSH_KEY` = private key content used by Actions to SSH
- `DEPLOY_PATH` = path on the droplet where `docker-compose.prod.yml` lives (example: `/opt/managant/deploy`)

Then every merge to `main` will:
- build and push to GHCR
- SSH into droplet
- `docker-compose pull` + `up -d` for the service

Note: the workflow uses `flock` to avoid two deploys running at the same time.

## 7) Backups (recommended)
At minimum: nightly mysqldump to a folder + DO backups or Spaces.

Example:
```bash
docker exec managant-mysql mysqldump -uroot -p$MYSQL_ROOT_PASSWORD $DB_NAME > backup.sql
```

## Common issue: API can't connect to MySQL (Access denied)
If API logs show:
`Access denied for user 'managant'@'...'`, your MySQL volume has a different password than your `.env`.
Reset it inside the container:

```bash
docker exec -it managant-mysql mysql -uroot -p
```

```sql
ALTER USER 'managant'@'%' IDENTIFIED BY 'YOUR_DB_PASSWORD';
GRANT ALL PRIVILEGES ON managant.* TO 'managant'@'%';
FLUSH PRIVILEGES;
```
