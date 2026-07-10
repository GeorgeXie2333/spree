# CenWatch Spree 5.5 Catalog Backfill Design

## Problem

After upgrading the production backend from Spree 5.4.3.1 to 5.5.2, category records and their images remain visible, but the Store API returns no products on either the full catalog page or category pages.

Spree 5.5.2 adds `spree_products.store_id`. Its migration intentionally leaves existing products with a null `store_id` and requires the post-migration Spree upgrade tasks to backfill product ownership and channel publications. CenWatch's deployment currently starts the upgraded image and seeds the store, but does not run those tasks. Because Store API product scopes are store-specific, migrated products become invisible.

## Chosen Approach

Run the official, idempotent `spree:upgrade` task during every CenWatch deployment after the database is available and the default store has been seeded, and before product media repair or storefront rebuild.

The complete task is preferred over invoking only `spree:upgrade:populate_publications` because it executes every eligible official backfill through Spree 5.5, including default channel creation, product ownership and publication population, order channel migration, and publication date migration. Spree defines these steps as safe to rerun.

## Deployment Flow

The deployment sequence will be:

1. Start PostgreSQL, Redis, Spree, and Sidekiq.
2. Seed or reuse the default store and administrator.
3. Run `bundle exec rake spree:upgrade` in the web container.
4. Create or reuse the storefront publishable key.
5. Configure the allowed storefront origin and payment gateway.
6. Repair missing product primary media.
7. Rebuild and recreate the storefront so its catalog cache is fresh.

The upgrade command must fail the deployment if a required backfill fails. This prevents a partially upgraded catalog from being presented as a successful release.

## Scope

The change is limited to the CenWatch deployment script and its deployment regression tests. It does not introduce custom SQL, alter Spree models, or change storefront category filtering.

## Testing

Before changing the deployment script, add a regression assertion that requires:

- an explicit `spree:upgrade` invocation;
- execution after `db:seed`;
- execution before product media repair and storefront rebuild.

Run the deployment test first and verify that it fails because the upgrade invocation is absent. Then add the minimal deployment function and call, rerun the focused test, and run the complete CenWatch deployment test suite.

## Production Verification

After the updated deployment runs, verify that the public all-products page and the CenWatch category page both contain the existing product again. Re-running the deployment must leave the same product visible without creating duplicate publications.
