# CenWatch Storefront Security and Checkout Fixes

**Status:** Design Finalized
**Target:** CenWatch Storefront
**Depends on:** `cenwatch-storefront-scope.md`, Spree Store API v3, Stripe payment sessions, Resend transactional email delivery
**Author:** George / Codex
**Last updated:** 2026-07-10

## Summary

Fix five confirmed Storefront defects before launch: an unsafe post-login redirect, unsanitized product-description HTML, false-positive checkout completion, process-local webhook deduplication, and unconditional Stripe test-card guidance. The changes preserve existing routes and rich-text presentation while tightening trust boundaries and making completion and delivery outcomes explicit.

## Key Decisions (do not deviate without discussion)

- Post-login redirects accept only relative paths within the active country and locale prefix.
- Product rich text remains supported, but the Store API sanitizes `description_html` with the Rails safe-list sanitizer before returning it.
- Checkout reports success only when the completion endpoint or completed-order lookup returns an order.
- Resend receives the Spree webhook event ID as an idempotency key; process-local deduplication is removed.
- Stripe test-card guidance is rendered only when the configured public Stripe key is a test key.
- Each behavior is introduced through a failing regression test before production code changes.

## Design Details

### Safe post-login redirects

A small path utility validates the `redirect` query parameter before navigation. A valid value must be a single-origin relative URL, must remain under the current `/{country}/{locale}` prefix, and must not contain a URL scheme, protocol-relative prefix, or backslash-based path ambiguity. Invalid or absent values resolve to the localized account page. The login page never passes raw query-string input to `router.push`.

### Sanitized product HTML

`Spree::Api::V3::ProductSerializer` keeps the current plain-text `description` field and sanitizes `description_html` through Rails' safe-list sanitizer. Safe formatting such as paragraphs, lists, emphasis, and safe links remains available, while scripts, event-handler attributes, and unsafe URL protocols are removed. Storefront rendering continues to consume `description_html`; the API becomes the security boundary for every Store API consumer.

### Strict checkout completion

`completeCheckoutOrder` no longer treats broad HTTP statuses as evidence of completion. The current Store API completion endpoint is already idempotent and returns the completed order when the cart was completed previously. Any thrown error therefore remains a failure unless a follow-up completed-order lookup returns a real order. The offsite confirmation flow applies the same rule when its cart lookup fails. Callers stay on checkout and display the original error when no completed order can be proven.

### Durable email idempotency

`sendEmail` accepts an optional idempotency key and forwards it through the installed Resend SDK request options. Every webhook email handler supplies a deterministic key derived from the Spree event ID. Resend then deduplicates retries across Node processes and deployments. The in-memory `Set` and its race-prone check/mark lifecycle are removed. Local HTML previews remain development-only behavior and do not require cross-process deduplication.

### Stripe test-mode guidance

A Stripe configuration helper determines test mode from the configured `pk_test_` publishable key. `PaymentSection` renders the localized test-card callout only in that mode, using the existing shadcn `Alert` composition. Live-key and missing-key configurations never show test-card details.

## Migration Path

1. Add and run redirect-validation tests, then wire the login page to the validator.
2. Add a serializer regression test for unsafe product HTML, then sanitize `description_html`.
3. Change checkout tests to require a real completed order, verify they fail, then tighten completion handling.
4. Add email-delivery tests for Resend idempotency options, then pass webhook event IDs and remove the memory set.
5. Add Stripe-mode and payment-callout tests, then conditionally render the shadcn alert.
6. Run targeted tests after each fix, followed by Storefront Vitest, locale parity, TypeScript, Biome, relevant Ruby specs, and a production build when the environment supports it.

## Constraints on Current Work

- Work directly on `main` at the user's request; do not create a worktree or feature branch.
- Keep the existing CenWatch catalog and Stripe-only checkout decisions intact.
- Do not add Redis, a database, or a second HTML-sanitization dependency to the Storefront.
- Do not broaden accepted redirect destinations or HTML tags to preserve malformed legacy content.
- Preserve unrelated user changes and keep each fix independently testable.

## Open Questions

None.

## References

- `docs/plans/cenwatch-storefront-scope.md`
- `apps/storefront/src/app/(shop)/[country]/[locale]/(storefront)/account/page.tsx`
- `apps/storefront/src/lib/data/payment.ts`
- `apps/storefront/src/lib/webhooks/handlers.ts`
- `apps/storefront/src/components/checkout/PaymentSection.tsx`
- `spree/api/app/serializers/spree/api/v3/product_serializer.rb`
