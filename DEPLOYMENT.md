# iFluent — Production Deployment (VPS + Docker)

Target: Ubuntu VPS, single monorepo checkout, all services in one Docker network.

```
ifluent.app      → Landing  (static)           ─┐
crm.ifluent.app  → CRM dashboard (static SPA)    ├─ nginx
api.ifluent.app  → Laravel API + Reverb (/app)  ─┘
db (postgres) + redis → internal network only, no public ports
```

Stack defined in `docker-compose.prod.yml`. DB is **PostgreSQL 16** (the app uses
Postgres-only features like `ilike` and `jsonb`, so MySQL is not an option without
code changes).

---

## 1. DNS
Point all records at the VPS public IP:
```
A   ifluent.app        → <VPS_IP>
A   www.ifluent.app    → <VPS_IP>
A   crm.ifluent.app    → <VPS_IP>
A   api.ifluent.app    → <VPS_IP>
```

## 2. Server prep
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
git clone <repo> /opt/ifluent && cd /opt/ifluent
```

## 3. Environment
```bash
# host-level (postgres credentials for compose)
cp .env.prod.example .env.prod
nano .env.prod                      # set a strong DB_PASSWORD

# Laravel app config
cp backend/.env.example backend/.env
nano backend/.env                   # see .env.prod.example header for the full prod list
                                    # (APP_ENV=production, DB_HOST=db, REDIS_HOST=redis, …)
```

## 4. Build the frontends (static output served by nginx)
```bash
npm install
npm run build --workspace=@ifluent/landing        # → apps/landing/dist
npm run build --workspace=@ifluent/frontend-crm    # → apps/frontend-crm/dist
```
Set each app's API base URL to `https://api.ifluent.app/api/v1` before building
(`apps/frontend-crm/.env` → `VITE_API_URL`, `apps/landing/.env` → `EXPO_PUBLIC_API_URL`).

## 5. Bring the stack up
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## 6. First-run Laravel setup (inside the app container)
```bash
APP=ifluent_app_prod
docker exec -it $APP composer install --no-dev --optimize-autoloader
docker exec -it $APP php artisan key:generate          # only if APP_KEY empty
docker exec -it $APP php artisan migrate --force
docker exec -it $APP php artisan storage:link
docker exec -it $APP php artisan config:cache route:cache view:cache
```

## 7. SSL (after DNS resolves + stack is up on port 80)
```bash
docker run --rm \
  -v $(pwd)/docker/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/docker/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d ifluent.app -d www.ifluent.app -d crm.ifluent.app -d api.ifluent.app
```
Then uncomment the `listen 443 ssl` blocks in `docker/nginx/prod/*.conf`, add an
HTTP→HTTPS `return 301 https://$host$request_uri;` to each port-80 server (keeping
the `/.well-known/acme-challenge/` location above it), and reload:
```bash
docker exec ifluent_nginx_prod nginx -t && docker exec ifluent_nginx_prod nginx -s reload
```

## 8. Lock down the CRM (optional but recommended)
Edit `docker/nginx/prod/crm.ifluent.app.conf` → uncomment the `allow/deny` IP
allowlist (and/or the Basic Auth block), then reload nginx. The CRM already sends
`X-Robots-Tag: noindex` and a disallow-all `robots.txt`.

---

## Redeploying new code
Because production opcache has `validate_timestamps=0`, restart the PHP services
after pulling code so they pick up changes:
```bash
git pull
docker exec ifluent_app_prod composer install --no-dev --optimize-autoloader
docker exec ifluent_app_prod php artisan migrate --force
docker exec ifluent_app_prod php artisan config:cache route:cache view:cache
docker compose -f docker-compose.prod.yml restart app queue reverb scheduler
```

## Notes
- **DB & Redis have no published ports** — only reachable inside `ifluent_network`.
- **Persistent data**: `pgdata` (Postgres) and `redisdata` (Redis) named volumes;
  uploaded files live in `backend/storage/app/public` on the host.
- **Background work**: `queue` (lead distribution/jobs) and `scheduler` (Open Sea
  sweep, reminders, expiries) run as separate containers — both required.
