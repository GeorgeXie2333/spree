# CenWatch Storefront

Customer storefront for `shop.cenwatch.com`, built with Next.js 16, React 19,
Tailwind CSS 4, and the Spree Store API.

The storefront exposes the complete catalog visible through the configured Spree
Store API. Product visibility, availability, markets, and storefront access are
enforced by Spree rather than a frontend category allowlist.

## Supported Storefront

- Store API product and category browsing
- Cart, addresses, shipping, taxes, and discount codes
- Stripe checkout, including saved Stripe cards and zero-value orders
- Customer profile, address book, saved cards, and order history
- Order tracking, contact, operation instructions, and store policies
- English and Simplified Chinese routes

## Configuration

Copy `.env.local.example` to `.env.local` and set the Spree and Stripe values:

```env
SITE_URL=https://shop.cenwatch.com
NEXT_PUBLIC_SITE_URL=https://shop.cenwatch.com
SPREE_API_URL=http://localhost:3000
SPREE_PUBLIC_URL=http://localhost:3000
SPREE_PUBLISHABLE_KEY=pk_live_or_test_publishable_key
SPREE_CHANNEL_CODE=shop
SPREE_VALIDATE_MARKETS=false
NEXT_PUBLIC_DEFAULT_COUNTRY=us
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_STORE_NAME=CenWatch
NEXT_PUBLIC_STORE_DESCRIPTION=The air touch watch for controlling screens, rooms, smart devices, and AR experiences.
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_publishable_key
CONTACT_TO_EMAIL=hello@cenwatch.com
```

No fixed category permalink is required. All products and categories visible to
the configured Store API key are eligible for the storefront.

Stripe secret keys stay in Spree. The storefront only receives the publishable
key used by Stripe.js.

Optional services:

```env
ORDER_TRACKING_API_URL=
ORDER_TRACKING_API_SECRET=
SPREE_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=CenWatch <orders@cenwatch.com>
GTM_ID=
```

## Development

From the repository root:

```bash
pnpm install
pnpm --filter @cenwatch/storefront dev
```

The storefront runs at [http://localhost:3001](http://localhost:3001). Spree is
expected at the configured `SPREE_API_URL`; product images must be reachable by
the browser at `SPREE_PUBLIC_URL`.

Useful checks:

```bash
pnpm --filter @cenwatch/storefront check:locales
pnpm --filter @cenwatch/storefront test
pnpm --filter @cenwatch/storefront typecheck
pnpm --filter @cenwatch/storefront check
pnpm --filter @cenwatch/storefront build
```

## CenWatch E2E Checkout

The E2E backend seeds a minimal category and a purchasable product with SKU
`CENWATCH-E2E`; it does not load Spree's generic catalog.

Provide a Stripe test key pair from the same sandbox:

```bash
export STRIPE_PUBLISHABLE_KEY=pk_test_...
export STRIPE_SECRET_KEY=sk_test_...
pnpm --filter @cenwatch/storefront e2e:up
pnpm --filter @cenwatch/storefront test:e2e
pnpm --filter @cenwatch/storefront e2e:down
```

## Production

Build and run the standalone Next.js image. The API URL must be reachable from
inside the storefront container; in the `deploy/cenwatch` Compose stack this is
the Docker-internal Spree service URL `http://web:3000`.

```bash
docker build -f apps/storefront/Dockerfile \
  --build-arg SITE_URL=https://shop.cenwatch.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://shop.cenwatch.com \
  --build-arg SPREE_API_URL=http://web:3000 \
  --build-arg SPREE_PUBLIC_URL=https://api-shop.cenwatch.com \
  --build-arg SPREE_PUBLISHABLE_KEY=pk_live_or_test_publishable_key \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key \
  -t cenwatch-storefront .

docker run -d \
  --name cenwatch-storefront \
  --restart unless-stopped \
  --env-file apps/storefront/.env.local \
  -p 3001:3001 \
  cenwatch-storefront
```

Use `deploy/cenwatch` to run the complete PostgreSQL, Redis, Spree, worker, and
storefront stack. Terminate TLS at the reverse proxy and forward
`shop.cenwatch.com` to `127.0.0.1:3001`.
