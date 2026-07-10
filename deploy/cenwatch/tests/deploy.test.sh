#!/usr/bin/env bash

set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$TEST_DIR/.." && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"
COMPOSE_FILE="$DEPLOY_DIR/compose.yml"
ENV_EXAMPLE="$DEPLOY_DIR/.env.example"
DEPLOY_SCRIPT="$DEPLOY_DIR/deploy.sh"
DOCKERIGNORE="$REPO_ROOT/.dockerignore"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_file() {
  [[ -f "$1" ]] || fail "missing file: $1"
}

assert_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq -- "$expected" "$file" ||
    fail "$file does not contain: $expected"
}

assert_not_contains_pattern() {
  local file="$1"
  local pattern="$2"
  if grep -Eiq -- "$pattern" "$file"; then
    fail "$file contains forbidden pattern: $pattern"
  fi
}

assert_file "$COMPOSE_FILE"
assert_file "$ENV_EXAMPLE"
assert_file "$DEPLOY_SCRIPT"
assert_file "$DOCKERIGNORE"
assert_file "$DEPLOY_DIR/spree.Dockerfile"
assert_file "$DEPLOY_DIR/overrides/cenwatch_locale_isolation.rb"
assert_file "$DEPLOY_DIR/overrides/cenwatch_public_media.rb"
assert_file "$DEPLOY_DIR/scripts/repair_product_media.rb"

bash -n "$DEPLOY_SCRIPT"

assert_contains "$ENV_EXAMPLE" "SPREE_API_URL=http://web:3000"
assert_contains "$ENV_EXAMPLE" "SPREE_PUBLIC_URL=https://api-shop.cenwatch.com"
assert_contains "$ENV_EXAMPLE" "SPREE_VERSION_TAG=5.5.2"
assert_contains "$ENV_EXAMPLE" "SITE_URL=https://shop.cenwatch.com"
assert_contains "$DEPLOY_DIR/spree.Dockerfile" "ARG SPREE_VERSION_TAG=5.5.2"
assert_contains "$COMPOSE_FILE" '"127.0.0.1:30000:3000"'
assert_contains "$COMPOSE_FILE" '"127.0.0.1:30001:3001"'
assert_contains "$DEPLOY_SCRIPT" "docker compose --project-name cenwatch"
assert_contains "$DEPLOY_SCRIPT" 'public_api_url="$(env_value SPREE_PUBLIC_URL)"'
assert_contains "$DEPLOY_SCRIPT" 'Internal API URL: $api_url'
assert_contains "$DEPLOY_SCRIPT" 'Public API URL: $public_api_url'
assert_contains "$DEPLOY_SCRIPT" 'Admin URL: $public_api_url/admin'
assert_contains "$COMPOSE_FILE" 'image: cenwatch-spree:local'
assert_contains "$COMPOSE_FILE" 'dockerfile: deploy/cenwatch/spree.Dockerfile'
assert_contains "$COMPOSE_FILE" 'SPREE_VERSION_TAG: ${SPREE_VERSION_TAG:-5.5.2}'
assert_contains "$COMPOSE_FILE" 'SPREE_PUBLIC_URL: ${SPREE_PUBLIC_URL}'
assert_contains "$REPO_ROOT/apps/storefront/Dockerfile" 'ARG SPREE_PUBLIC_URL'
assert_contains "$REPO_ROOT/apps/storefront/Dockerfile" 'SPREE_PUBLIC_URL=$SPREE_PUBLIC_URL'
assert_contains "$DEPLOY_SCRIPT" 'compose build --pull web worker'
assert_contains "$DEPLOY_SCRIPT" 'compose pull postgres redis'
assert_contains "$DEPLOY_SCRIPT" 'compose up -d --wait --force-recreate storefront'
assert_contains "$DEPLOY_SCRIPT" '/rails/cenwatch-scripts/repair_product_media.rb'
assert_contains "$DEPLOY_DIR/overrides/cenwatch_locale_isolation.rb" 'Spree::Admin::BaseController'
assert_contains "$DEPLOY_DIR/overrides/cenwatch_locale_isolation.rb" 'Spree::Api::V3::BaseController'

grep -Fxq '**/.env*' "$DOCKERIGNORE" ||
  fail ".dockerignore does not exclude environment files repo-wide"
grep -Fxq '!**/.env.example' "$DOCKERIGNORE" ||
  fail ".dockerignore does not preserve environment examples"

if grep -Eq '(^|[[:space:]-])"?(5432|6379):' "$COMPOSE_FILE"; then
  fail "PostgreSQL or Redis is exposed on a host port"
fi

for file in "$DEPLOY_SCRIPT" "$COMPOSE_FILE"; do
  assert_not_contains_pattern "$file" \
    'docker[[:space:]]+(compose[[:space:]]+)?(down[[:space:]]+-v|volume[[:space:]]+rm)'
  assert_not_contains_pattern "$file" 'db:(drop|reset)'
done

storefront_block="$(
  awk '/^  storefront:/{capture=1} capture{print} /^volumes:/{exit}' \
    "$COMPOSE_FILE"
)"
if grep -Fq "STRIPE_SECRET_KEY" <<<"$storefront_block"; then
  fail "Stripe secret key is exposed to the storefront service"
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
test_env="$tmp_dir/deployment.env"
check_env="$tmp_dir/check.env"
fake_bin="$tmp_dir/bin"

mkdir -p "$fake_bin"
cat >"$fake_bin/docker" <<'EOF'
#!/usr/bin/env bash
if [[ "$1 $2 $3" == "volume inspect cenwatch_postgres_data" ]]; then
  [[ "${FAKE_VOLUME_EXISTS:-false}" == "true" ]]
  exit
fi
exit 0
EOF
chmod +x "$fake_bin/docker"

DEPLOY_ENV_FILE="$check_env" bash "$DEPLOY_SCRIPT" --check >/dev/null
[[ ! -e "$check_env" ]] ||
  fail "--check mutated the deployment environment"

PATH="$fake_bin:$PATH" DEPLOY_ENV_FILE="$test_env" \
  bash "$DEPLOY_SCRIPT" --prepare-env >/dev/null

first_db_password="$(grep '^POSTGRES_PASSWORD=' "$test_env")"
first_secret_key_base="$(grep '^SECRET_KEY_BASE=' "$test_env")"
first_admin_password="$(grep '^ADMIN_PASSWORD=' "$test_env")"

PATH="$fake_bin:$PATH" DEPLOY_ENV_FILE="$test_env" \
  bash "$DEPLOY_SCRIPT" --prepare-env >/dev/null

[[ "$(grep '^POSTGRES_PASSWORD=' "$test_env")" == "$first_db_password" ]] ||
  fail "database password changed on rerun"
[[ "$(grep '^SECRET_KEY_BASE=' "$test_env")" == "$first_secret_key_base" ]] ||
  fail "SECRET_KEY_BASE changed on rerun"
[[ "$(grep '^ADMIN_PASSWORD=' "$test_env")" == "$first_admin_password" ]] ||
  fail "admin password changed on rerun"

assert_contains "$test_env" "SPREE_API_URL=http://web:3000"
assert_contains "$test_env" "SPREE_PUBLIC_URL=https://api-shop.cenwatch.com"
assert_contains "$test_env" "SITE_URL=https://shop.cenwatch.com"

legacy_env="$tmp_dir/legacy.env"
cp "$test_env" "$legacy_env"
sed -i 's/^SPREE_VERSION_TAG=.*/SPREE_VERSION_TAG=5.4.3.1/' "$legacy_env"
sed -i '/^SPREE_PUBLIC_URL=/d' "$legacy_env"

PATH="$fake_bin:$PATH" DEPLOY_ENV_FILE="$legacy_env" \
  bash "$DEPLOY_SCRIPT" --prepare-env >/dev/null

assert_contains "$legacy_env" "SPREE_VERSION_TAG=5.5.2"
assert_contains "$legacy_env" "SPREE_PUBLIC_URL=https://api-shop.cenwatch.com"
[[ "$(grep '^POSTGRES_PASSWORD=' "$legacy_env")" == "$first_db_password" ]] ||
  fail "database password changed while migrating legacy env"
[[ "$(grep '^SECRET_KEY_BASE=' "$legacy_env")" == "$first_secret_key_base" ]] ||
  fail "SECRET_KEY_BASE changed while migrating legacy env"
[[ "$(grep '^ADMIN_PASSWORD=' "$legacy_env")" == "$first_admin_password" ]] ||
  fail "admin password changed while migrating legacy env"

for mode in deploy prepare; do
  missing_env="$tmp_dir/missing-$mode.env"
  args=()
  [[ "$mode" == "prepare" ]] && args=(--prepare-env)

  if FAKE_VOLUME_EXISTS=true PATH="$fake_bin:$PATH" \
    DEPLOY_ENV_FILE="$missing_env" \
    bash "$DEPLOY_SCRIPT" "${args[@]}" >"$tmp_dir/missing-$mode.log" 2>&1; then
    fail "$mode continued after detecting a database volume without .env"
  fi
  [[ ! -e "$missing_env" ]] ||
    fail "$mode generated new secrets for an existing database volume"
  assert_contains "$tmp_dir/missing-$mode.log" "existing PostgreSQL volume"
done

incomplete_env="$tmp_dir/incomplete.env"
cp "$ENV_EXAMPLE" "$incomplete_env"
if FAKE_VOLUME_EXISTS=true PATH="$fake_bin:$PATH" \
  DEPLOY_ENV_FILE="$incomplete_env" \
  bash "$DEPLOY_SCRIPT" --prepare-env >"$tmp_dir/incomplete.log" 2>&1; then
  fail "prepare completed with missing secrets for an existing database volume"
fi
[[ -z "$(grep '^POSTGRES_PASSWORD=' "$incomplete_env" | cut -d= -f2-)" ]] ||
  fail "prepare replaced a missing database password for an existing volume"
assert_contains "$tmp_dir/incomplete.log" "existing PostgreSQL volume"

printf 'PASS: CenWatch deployment contract\n'
