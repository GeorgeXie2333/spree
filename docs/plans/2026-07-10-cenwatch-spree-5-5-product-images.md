# CenWatch Spree 5.5 Product Image Recovery

**Status:** Design Finalized
**Target:** Spree 5.5.2
**Depends on:** `2026-07-09-cenwatch-single-server-deployment.md`
**Author:** George / Codex
**Last updated:** 2026-07-10

## Summary

Upgrade CenWatch from the pinned Spree `5.4.3.1` image to the official stable
`5.5.2` image and repair the complete product-image path. The upgrade supplies
the upstream fix that assigns `primary_media` after session uploads. The
deployment also separates the Docker-internal API URL from the public asset
origin, repairs existing products whose media exists but whose primary-media
pointer is blank, and recreates the storefront so cached null thumbnails are
discarded.

## Key Decisions (do not deviate without discussion)

- Pin `ghcr.io/spree/spree:5.5.2`; do not use `latest` or an unreleased build
  from `main`.
- Keep `SPREE_API_URL=http://web:3000` for server-to-server traffic and add
  `SPREE_PUBLIC_URL=https://api-shop.cenwatch.com` for generated public media
  URLs and the Next.js image allowlist.
- Preserve the existing PostgreSQL, Redis, and Active Storage volumes and all
  generated secrets during the upgrade.
- Keep the CenWatch locale-isolation initializer until its behavior is proven
  redundant on the upgraded production stack.
- Repair only products whose `primary_media_id` is blank. Reuse
  `Product#update_thumbnail!`; never recreate, delete, or replace media.
- Run the repair on every deployment as an idempotent reconciliation step.
- Recreate the storefront after backend reconciliation to clear cached
  `thumbnail_url: null` responses.

## Design Details

### Backend image and database lifecycle

`deploy/cenwatch/spree.Dockerfile` derives from the official `5.5.2` image and
continues copying CenWatch initializers and runner scripts into the image. The
existing Compose startup path remains responsible for the official image's
database preparation. The deployment must not add destructive database or
volume operations.

### Public media origin

The backend receives `SPREE_PUBLIC_URL`. A small CenWatch initializer validates
that it is an absolute HTTP(S) URL and configures `Spree.cdn_host` from its
host. `RAILS_FORCE_SSL` and `RAILS_ASSUME_SSL` continue to force HTTPS URL
generation. Invalid public URLs fail application startup instead of silently
emitting unusable media URLs.

The storefront receives the same variable at build and runtime. Its Next.js
image configuration derives an HTTPS remote pattern from `SPREE_PUBLIC_URL`.
It does not derive the browser-facing image allowlist from the internal
`SPREE_API_URL`.

### Existing-data reconciliation

An idempotent Rails runner iterates products with `primary_media_id: nil`,
skips products without any product or variant media, calls
`update_thumbnail!`, and reports inspected and repaired counts. `deploy.sh`
runs it after Spree is healthy and seeded, before rebuilding the storefront.
A failure aborts deployment so a partially repaired backend is not presented
as successful.

### Error handling and observability

- Missing or malformed `SPREE_PUBLIC_URL` fails fast with a descriptive error.
- The reconciliation script prints deterministic counts and exits non-zero on
  an unexpected exception.
- Deployment output reports internal API, public API/media, and storefront
  URLs separately.
- Existing volume and secret guards remain unchanged.

## Migration Path

1. Add failing deployment-contract tests for `5.5.2`, `SPREE_PUBLIC_URL`, the
   public image allowlist, and the reconciliation step.
2. Update the pinned backend image and environment propagation.
3. Add the public-media initializer and existing-data reconciliation runner.
4. Invoke reconciliation during deployment before the storefront rebuild.
5. Update deployment documentation and the existing single-server plan.
6. Run shell, locale-isolation, storefront unit/type, and Compose validation.
7. Before production rollout, back up PostgreSQL and Active Storage volumes.
8. Deploy once, verify the reconciled product API returns a non-null
   `thumbnail_url`, verify the public image URL returns an image response, and
   verify the storefront product card renders it.

## Rollback

Application rollback means restoring the pre-upgrade database backup and
pinning the backend image back to `5.4.3.1`. Merely changing the image tag after
5.5 migrations have run is not considered a safe database rollback. Active
Storage files are preserved independently and must not be deleted.

## Constraints on Current Work

- Do not use floating image tags.
- Do not expose PostgreSQL or Redis ports.
- Do not regenerate deployment secrets.
- Do not delete, reset, or recreate production volumes.
- Do not route public media through `shop.cenwatch.com`; that hostname is the
  Next.js storefront.
- Do not claim success until API data, the media URL, and the rendered product
  card are all verified.

## Open Questions

None.

## References

- `docs/plans/2026-07-09-cenwatch-single-server-deployment.md`
- `deploy/cenwatch/spree.Dockerfile`
- `deploy/cenwatch/compose.yml`
- `deploy/cenwatch/deploy.sh`
- `apps/storefront/next.config.ts`
- <https://github.com/spree/spree/releases/tag/v5.5.2>
- <https://github.com/spree/spree/commit/1be4db9b88ae52a8edf307a5539359ae709876ff>
