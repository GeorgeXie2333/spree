# CenWatch Single-Server Docker Deployment

**Status:** Complete
**Target:** Spree 5.5.2 + CenWatch Storefront
**Depends on:** CenWatch storefront Docker image
**Author:** George / Codex
**Last updated:** 2026-07-10

## Summary

Provide an idempotent, one-command deployment for a Debian 13 server that runs
the Spree API, Sidekiq, PostgreSQL, Redis, and the CenWatch storefront on one
Docker host. 1Panel will handle domain routing and TLS separately.

## Key Decisions (do not deviate without discussion)

- Publish the Spree API on host port `30000` and the storefront on `30001`.
- Use `https://api-shop.cenwatch.com` as the public API URL and
  `https://shop.cenwatch.com` as the public storefront URL.
- Keep PostgreSQL and Redis private to the Compose network.
- Pin the official Spree `5.5.2` image. The upgrade and product-image recovery
  contract is defined in `2026-07-10-cenwatch-spree-5-5-product-images.md`.
- Keep the Docker-internal API URL separate from the public API/media URL.
- Persist PostgreSQL, Redis, and Active Storage data in named Docker volumes.
- Generate deployment secrets once and preserve them on repeated runs.
- Keep Stripe optional. Empty Stripe credentials must not prevent startup.
- Do not configure 1Panel, DNS, nginx, or TLS in the deployment script.
- Never remove Docker volumes or reset an existing production database.

## Design Details

Deployment files live under `deploy/cenwatch/`:

- `compose.yml` defines PostgreSQL, Redis, Spree web, Sidekiq worker, and the
  Next.js storefront.
- `.env.example` documents user-configurable values and contains no secrets.
- `deploy.sh` validates prerequisites, creates a protected `.env`, starts and
  initializes Spree, creates or reuses a publishable API key, configures the
  storefront allowed origin, reconciles missing product primary-media pointers,
  builds the storefront, and starts the full stack.
- `README.md` documents the one-command path, optional Stripe variables,
  generated credentials, ports, logs, and safe reruns.
- Shell tests verify fixed ports and URLs, secret preservation, dry-run
  behavior, and the absence of destructive volume operations.

The script must support a non-mutating validation mode so its behavior can be
tested without a Docker daemon or production server.

## Migration Path

1. Add failing shell tests for the deployment contract.
2. Add the Compose definition and environment example.
3. Implement the deployment script until the tests pass.
4. Add the concise operator README.
5. Validate shell syntax, Compose interpolation, storefront checks, and build.
6. Review the complete diff before publishing.

## Constraints on Current Work

- Do not expose ports `5432` or `6379`.
- Do not use host port `3000`.
- Do not put Stripe secret keys into storefront build arguments or runtime
  environment.
- Do not regenerate `SECRET_KEY_BASE`, database credentials, or the admin
  password when `.env` already exists.
- Do not use `docker compose down -v`, `docker volume rm`, or database reset
  commands.
- Do not claim that the official backend image contains unpublished local
  changes under `spree/`.
- Use `SPREE_PUBLIC_URL=https://api-shop.cenwatch.com` for public media URLs;
  keep `SPREE_API_URL=http://web:3000` for internal storefront requests.

## Open Questions

None.

## References

- `apps/storefront/Dockerfile`
- `apps/storefront/e2e-backend/docker-compose.yml`
- `apps/storefront/README.md`
- `2026-07-10-cenwatch-spree-5-5-product-images.md`
