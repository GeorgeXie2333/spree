# CenWatch Debian 13 Deployment

This deployment runs PostgreSQL, Redis, Spree, Sidekiq, and the CenWatch
storefront on one Docker host. It exposes only:

- `30000`: Spree API and admin
- `30001`: CenWatch storefront

1Panel, DNS, and TLS configuration are intentionally outside this script.

## Deploy

On a Debian 13 server with Docker and Docker Compose v2 installed:

```bash
git clone https://github.com/GeorgeXie2333/spree.git
cd spree
sudo bash deploy/cenwatch/deploy.sh --check
sudo bash deploy/cenwatch/deploy.sh
```

The script generates database and application secrets, starts Spree, seeds the
administrator, creates a storefront publishable key, builds the pinned Spree
base image with the CenWatch locale-isolation backport, builds the storefront,
and starts the complete stack. At completion it prints the generated admin
credentials.

The storefront talks to Spree over the Docker network:

```text
SPREE_API_URL=http://web:3000
```

The configured public domains are:

```text
https://api-shop.cenwatch.com
https://shop.cenwatch.com
```

Configure 1Panel to proxy `https://api-shop.cenwatch.com` to
`127.0.0.1:30000` and `https://shop.cenwatch.com` to `127.0.0.1:30001`.

Both application ports listen on loopback only. They cannot be reached
directly from the public internet and must be published through 1Panel.

## Optional Stripe Setup

To enable Stripe before the first deployment:

```bash
bash deploy/cenwatch/deploy.sh --prepare-env
nano deploy/cenwatch/.env
sudo bash deploy/cenwatch/deploy.sh
```

Set both values from the same Stripe account:

```env
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_SECRET_KEY=sk_live_or_test_key
```

The Stripe secret is passed only to Spree. It is never included in the
storefront image or environment.

## Operations

Run the deployment script again after pulling updates. Existing secrets,
database contents, uploads, and Docker volumes are preserved.

```bash
git pull --ff-only
sudo bash deploy/cenwatch/deploy.sh
```

Back up `deploy/cenwatch/.env` together with the Docker volumes. If the
environment file is missing while the production PostgreSQL volume exists,
the script refuses to generate replacement credentials.

Inspect the stack:

```bash
cd deploy/cenwatch
sudo docker compose --project-name cenwatch --env-file .env -f compose.yml ps
sudo docker compose --project-name cenwatch --env-file .env -f compose.yml \
  logs -f web storefront
```

Do not remove the named volumes. They contain the production database,
Redis data, and local Active Storage uploads.

### Locale-content recovery

The derived Spree image keeps the admin UI locale independent from the catalog
content locale. This prevents an admin UI selection such as `zh-CN` from
causing Store API responses in `en` or `zh` to return null product names,
slugs, category names, or permalinks.

Before applying any data repair, back up PostgreSQL and inspect the locale rows:

```bash
cd deploy/cenwatch
sudo docker compose --project-name cenwatch --env-file .env -f compose.yml \
  exec -T web bin/rails runner /rails/lib/cenwatch/audit_locale_content.rb
```

If the audit shows blank default-locale fields with valid `zh-CN` source
content, run the repair once. It fills only blank default-locale fields and
never overwrites existing translations:

```bash
sudo docker compose --project-name cenwatch --env-file .env -f compose.yml \
  exec -T -e APPLY=true -e SOURCE_LOCALE=zh-CN web \
  bin/rails runner /rails/lib/cenwatch/repair_locale_content.rb
```

Recreate the storefront container after the backend update or repair so its
ten-minute catalog cache does not retain the old null response.
