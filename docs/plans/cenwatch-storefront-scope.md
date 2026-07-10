# CenWatch Storefront Catalog Visibility

**Status:** Complete
**Target:** CenWatch Storefront
**Depends on:** Spree Store API v3 categories, products, and Stripe payment sessions
**Author:** George / Codex
**Last updated:** 2026-07-10

## Summary

The CenWatch storefront is a single-brand watch store. It exposes every product
and category visible through its configured Spree Store API key, while retaining
the commerce, account, order, and support flows needed to sell and service the
watch.

## Key Decisions (do not deviate without discussion)

- Store API visibility is the sole catalog access boundary; there is no fixed
  category permalink or frontend category allowlist.
- Visible products may be assigned to any category or no category. Direct
  product and category routes return 404 only when the Store API cannot return
  the requested resource.
- Existing Spree records are not modified or deleted.
- Stripe is the only payment gateway. Zero-value orders remain supported.
- Wishlist, gift-card management, newsletter, PayPal, and Adyen surfaces are
  removed.
- The storefront is pre-launch, so removed features receive no legacy UI or
  historical-display compatibility.

## Design Details

Product listing, search, filters, metadata, and sitemap queries pass directly
to the Store API. Product and category detail routes accept any API-visible
resource. Header, footer, and home-page navigation load every top-level category
and its immediate descendants.

Checkout filters interactive payment methods to Stripe and presents a localized
configuration error when Stripe is unavailable. Existing saved Stripe cards,
discount codes, addresses, shipping, taxes, and order history remain intact.

## Migration Path

1. Remove the catalog guard and tests, then unscope all catalog entry points.
2. Remove unrelated customer features and non-Stripe payment integrations.
3. Replace generic copy, fixtures, dependencies, and configuration.
4. Seed a minimal CenWatch catalog for E2E tests instead of Spree sample data.
5. Run locale parity, unit tests, type checking, Biome, and a production build.

## Constraints on Current Work

- Preserve the existing uncommitted storefront redesign and edit it in place.
- Keep navigation resilient when category retrieval fails, while product-list
  failures continue to surface through the route error boundary.
- Do not mutate production Spree catalog or payment data.

## Open Questions

None.

## References

- `docs/plans/5.4-search-provider.md`
- `docs/plans/6.0-channels-catalogs-b2b.md`
