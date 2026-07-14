#!/usr/bin/env bash
# Bootstrap the E2E Spree backend using @spree/cli.
#
# Steps:
#   1. `spree seed` — seed the default store, roles, countries.
#   2. Create the CenWatch category and a purchasable watch fixture.
#   3. `spree api-key create --name E2E --type publishable` — mint a key
#      and capture the printed pk_... token.
#
# Idempotent: the CLI seed task and CenWatch fixture use stable identifiers.
# A fresh API key per run is fine; old E2E keys accumulate harmlessly.
#
# Output: writes `.env.e2e` at the repo root with SPREE_API_URL +
# SPREE_PUBLISHABLE_KEY for the storefront to consume.

set -euo pipefail

readonly REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
readonly BACKEND_DIR="$REPO_ROOT/e2e-backend"
readonly ENV_FILE="$REPO_ROOT/.env.e2e"
readonly SPREE_URL="http://localhost:4000"
readonly SKIP_STRIPE="${E2E_SKIP_STRIPE:-false}"
readonly SPREE_CLI="$REPO_ROOT/node_modules/.bin/spree"

if [[ ! -x "$SPREE_CLI" ]]; then
  echo "Local @spree/cli executable not found at $SPREE_CLI." >&2
  echo "Install the Storefront dependencies before running E2E bootstrap." >&2
  exit 1
fi

# Stripe test-mode API keys. Both must come from the SAME Stripe sandbox
# account — a mismatched pair makes Stripe.js fail to confirm the
# PaymentIntent during checkout. Stripe no longer publishes a working
# sample pair (the old docs sk_test_... key is expired), so use keys from
# your own Stripe sandbox:
#
#   export STRIPE_PUBLISHABLE_KEY=pk_test_...
#   export STRIPE_SECRET_KEY=sk_test_...
#   pnpm --filter @cenwatch/storefront e2e:up
#
# The secret key is never committed: GitHub's push protection flags any
# sk_test_ literal as a secret regardless of provenance. In CI,
# STRIPE_SECRET_KEY is a repository secret and STRIPE_PUBLISHABLE_KEY a
# repository variable, both injected via the workflow env (see
# .github/workflows/ci.yml).
if [[ "$SKIP_STRIPE" != "true" ]]; then
  if [[ -z "${STRIPE_PUBLISHABLE_KEY:-}" || -z "${STRIPE_SECRET_KEY:-}" ]]; then
    echo "STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY must both be set." >&2
    echo "Use a pk_test_.../sk_test_... pair from your own Stripe sandbox." >&2
    echo "For non-payment E2E only, set E2E_SKIP_STRIPE=true." >&2
    exit 1
  fi

  # Full-shape checks (not just prefix): a stray quote, space, or other
  # copy-paste artifact would otherwise flow into .env.e2e and break parsing.
  if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_test_[A-Za-z0-9_]+$ ]]; then
    echo "STRIPE_PUBLISHABLE_KEY must be a test-mode key (pk_test_...)." >&2
    echo "Got: ${STRIPE_PUBLISHABLE_KEY:0:8}..." >&2
    exit 1
  fi

  if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_test_[A-Za-z0-9_]+$ ]]; then
    echo "STRIPE_SECRET_KEY must be a test-mode key (sk_test_...)." >&2
    echo "Got: ${STRIPE_SECRET_KEY:0:8}..." >&2
    exit 1
  fi
fi

# @spree/cli looks for docker-compose.yml in the cwd, so all CLI calls
# happen from the backend dir.
cd "$BACKEND_DIR"

# Both callers (`pnpm --filter @cenwatch/storefront e2e:up` and CI) already gate on the compose
# healthcheck via `up -d --wait`; this guard only covers running the
# script standalone against a still-booting stack.
echo "==> Waiting for Spree to accept HTTP requests at $SPREE_URL/up"
if ! curl -fsS --retry 60 --retry-delay 2 --retry-all-errors "$SPREE_URL/up" >/dev/null 2>&1; then
  echo "Spree never came up. Check 'docker compose -f $BACKEND_DIR/docker-compose.yml logs web'." >&2
  exit 1
fi

echo "==> Seeding default Spree data (spree seed)"
"$SPREE_CLI" seed

echo "==> Creating the CenWatch E2E catalog"
docker compose exec -T web bin/rails runner - <<'RUBY'
store = Spree::Store.default
taxonomy = store.taxonomies.find_or_create_by!(name: 'CenWatch')
category = Spree::Taxon.find_or_initialize_by(permalink: 'cenwatch-products')
category.assign_attributes(
  name: 'CenWatch',
  taxonomy: taxonomy,
  parent: taxonomy.root
)
category.save!

shipping_category = Spree::ShippingCategory.find_or_create_by!(name: 'Default')
product = Spree::Product.find_or_initialize_by(slug: 'cenwatch-e2e')
product.assign_attributes(
  name: 'CenWatch Air Touch Watch',
  description: 'Air touch control for phones, tablets, computers, and smart displays.',
  available_on: 1.day.ago,
  shipping_category: shipping_category
)
product.save!
product.stores << store unless product.stores.include?(store)
product.taxons << category unless product.taxons.include?(category)

variant = product.master
variant.update!(sku: 'CENWATCH-E2E')
price = variant.prices.find_or_initialize_by(
  currency: store.default_currency || 'USD'
)
price.amount = 199
price.save!

stock_location = Spree::StockLocation.first ||
  Spree::StockLocation.create!(name: 'CenWatch Warehouse', default: true)
stock_item = stock_location.stock_items.find_or_create_by!(variant: variant)
stock_item.set_count_on_hand(100)

puts "OK: #{product.name} / #{variant.sku} in #{category.permalink}"
RUBY

# Vanilla Spree ships without any payment gateway configured. Use a direct
# runner fixture so the E2E setup remains explicit and idempotent.
# The script is idempotent: re-running matches the existing row by name
# (where(...).first_or_initialize) and reapplies the same attributes.
# The keys reach Ruby via the container environment (-e pass-through from
# this script's env) rather than heredoc interpolation, so the Ruby source
# never embeds them — the heredoc delimiter is quoted on purpose.
if [[ "$SKIP_STRIPE" == "true" ]]; then
  echo "==> Skipping Stripe gateway setup (non-payment E2E mode)"
else
  echo "==> Configuring Stripe payment gateway on the default store"
  docker compose exec -T -e STRIPE_PUBLISHABLE_KEY -e STRIPE_SECRET_KEY web bin/rails runner - <<'RUBY'
store = Spree::Store.default
gateway = Spree::PaymentMethod.where(type: 'SpreeStripe::Gateway', name: 'E2E Stripe').first_or_initialize
gateway.assign_attributes(
  active: true,
  display_on: 'both',
  auto_capture: true,
  stores: [store],
  preferences: {
    publishable_key: ENV.fetch('STRIPE_PUBLISHABLE_KEY'),
    secret_key: ENV.fetch('STRIPE_SECRET_KEY')
  }
)
# validate: false skips SpreeStripe's validate_secret_key hook — a live
# Stripe API roundtrip at save time. The key still gets exercised for real
# when checkout creates a PaymentIntent.
gateway.save!(validate: false)
puts "OK: gateway #{gateway.id} (#{gateway.name})"
RUBY
fi

echo "==> Creating publishable API key (spree api-key create)"
api_key_output=$("$SPREE_CLI" api-key create --name E2E --type publishable)

publishable_key=$(printf '%s\n' "$api_key_output" | grep -oE 'pk_[A-Za-z0-9_-]+' | head -n 1)
if [[ -z "$publishable_key" ]]; then
  echo "Could not extract publishable key from CLI output:" >&2
  printf '%s\n' "$api_key_output" >&2
  exit 1
fi

cat >"$ENV_FILE" <<EOF
# Generated by scripts/e2e/bootstrap-spree.sh — DO NOT EDIT
SPREE_API_URL=$SPREE_URL
SPREE_PUBLISHABLE_KEY=$publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY:-}
EOF

echo
echo "==> Done. Wrote $ENV_FILE"
echo "    SPREE_API_URL=$SPREE_URL"
echo "    SPREE_PUBLISHABLE_KEY=${publishable_key:0:12}..."
