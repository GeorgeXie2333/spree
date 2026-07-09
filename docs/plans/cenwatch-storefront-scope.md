# CenWatch Storefront Catalog Scope

**Status:** Complete
**Target:** CenWatch Storefront
**Depends on:** Spree Store API v3 categories, products, and Stripe payment sessions
**Author:** George / Codex
**Last updated:** 2026-07-09

## Summary

The CenWatch storefront is a single-brand watch store. It must expose only the
`cenwatch` category tree and products assigned to that tree, while retaining the
commerce, account, order, and support flows needed to sell and service the
watch.

## Key Decisions (do not deviate without discussion)

- The catalog root is the fixed category permalink `cenwatch`; there is no
  environment override.
- Descendant categories are allowed, but unrelated categories and products fail
  closed with a 404.
- Catalog isolation is enforced in the storefront only. Existing Spree records
  are not modified or deleted.
- Stripe is the only payment gateway. Zero-value orders remain supported.
- Wishlist, gift-card management, newsletter, PayPal, and Adyen surfaces are
  removed.
- The storefront is pre-launch, so removed features receive no legacy UI or
  historical-display compatibility.

## Design Details

A cached catalog guard resolves the CenWatch root category and supplies its ID
to product listing, search, filter, navigation, metadata, and sitemap queries.
Product and category detail routes validate membership before rendering. If the
root category cannot be resolved, catalog surfaces return no products rather
than falling back to the full store.

The storefront keeps `/products` as the complete CenWatch listing and preserves
the CenWatch category subtree at `/c/cenwatch/...`. Header, footer, home page,
structured navigation, and related-product rails consume only that subtree.

Checkout filters interactive payment methods to Stripe and presents a localized
configuration error when Stripe is unavailable. Existing saved Stripe cards,
discount codes, addresses, shipping, taxes, and order history remain intact.

## Migration Path

1. Add the catalog guard and tests, then scope all catalog entry points.
2. Remove unrelated customer features and non-Stripe payment integrations.
3. Replace generic copy, fixtures, dependencies, and configuration.
4. Seed a minimal CenWatch catalog for E2E tests instead of Spree sample data.
5. Run locale parity, unit tests, type checking, Biome, and a production build.

## Constraints on Current Work

- Preserve the existing uncommitted storefront redesign and edit it in place.
- Never allow a failed category lookup to broaden a product query.
- Do not mutate production Spree catalog or payment data.

## Open Questions

None.

## References

- `docs/plans/5.4-search-provider.md`
- `docs/plans/6.0-channels-catalogs-b2b.md`
