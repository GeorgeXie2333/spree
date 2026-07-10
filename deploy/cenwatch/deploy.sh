#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose.yml"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
ENV_FILE="${DEPLOY_ENV_FILE:-$SCRIPT_DIR/.env}"
PREPARE_ONLY=false
CHECK_ONLY=false

usage() {
  cat <<'EOF'
Usage: bash deploy/cenwatch/deploy.sh [--check | --prepare-env]

Options:
  --check        Validate prerequisites and Compose without writing files.
  --prepare-env  Create or complete the deployment .env, then exit.
  -h, --help     Show this help.
EOF
}

log() {
  printf '\n==> %s\n' "$1"
}

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

env_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1
}

set_env_value() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

ensure_generated_value() {
  local key="$1"
  local bytes="$2"

  if [[ -z "$(env_value "$key")" ]]; then
    set_env_value "$key" "$(openssl rand -hex "$bytes")"
  fi
}

ensure_default_value() {
  local key="$1"
  local value="$2"

  if [[ -z "$(env_value "$key")" ]]; then
    set_env_value "$key" "$value"
  fi
}

prepare_env() {
  require_command openssl
  require_command grep
  require_command sed

  if [[ ! -f "$ENV_FILE" ]]; then
    mkdir -p "$(dirname "$ENV_FILE")"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  fi

  set_env_value SPREE_VERSION_TAG "5.5.2"
  ensure_default_value SPREE_PUBLIC_URL "https://api-shop.cenwatch.com"
  ensure_generated_value POSTGRES_PASSWORD 32
  ensure_generated_value SECRET_KEY_BASE 64
  ensure_generated_value ADMIN_PASSWORD 20
  chmod 600 "$ENV_FILE"
}

compose() {
  docker compose --project-name cenwatch \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    "$@"
}

check_docker() {
  require_command docker
  docker compose version >/dev/null 2>&1 ||
    die "Docker Compose v2 is not available"
  docker info >/dev/null 2>&1 ||
    die "Docker daemon is unavailable or the current user lacks permission"
}

guard_existing_database_volume() {
  local key
  local needs_generated_value=false

  if [[ ! -f "$ENV_FILE" ]]; then
    needs_generated_value=true
  else
    for key in POSTGRES_PASSWORD SECRET_KEY_BASE ADMIN_PASSWORD; do
      if [[ -z "$(env_value "$key")" ]]; then
        needs_generated_value=true
        break
      fi
    done
  fi

  if [[ "$needs_generated_value" != "true" ]]; then
    return 0
  fi

  if docker volume inspect cenwatch_postgres_data >/dev/null 2>&1; then
    die "found an existing PostgreSQL volume but deployment secrets are missing; restore the original .env before continuing"
  fi
}

ensure_publishable_key() {
  local output
  local publishable_key

  output="$(
    compose exec -T web bin/rails runner '
      store = Spree::Store.default
      key = store.api_keys.active.publishable.find_by(name: "CenWatch Storefront")
      key ||= store.api_keys.create!(
        name: "CenWatch Storefront",
        key_type: "publishable"
      )
      puts key.token
    '
  )"
  publishable_key="$(
    printf '%s\n' "$output" |
      grep -oE 'pk_[A-Za-z0-9_-]+' |
      tail -n 1
  )"

  [[ -n "$publishable_key" ]] ||
    die "Spree did not return a publishable API key"

  set_env_value SPREE_PUBLISHABLE_KEY "$publishable_key"
}

ensure_allowed_origin() {
  compose exec -T web bin/rails runner '
    store = Spree::Store.default
    origin = ENV.fetch("STOREFRONT_ORIGIN")
    store.allowed_origins.find_or_create_by!(origin: origin)
    puts "Allowed storefront origin: #{origin}"
  '
}

run_spree_upgrade() {
  compose exec -T web bundle exec rake spree:upgrade
}

repair_product_media() {
  compose exec -T web bin/rails runner /rails/cenwatch-scripts/repair_product_media.rb
}

configure_stripe() {
  local publishable_key
  local secret_key

  publishable_key="$(env_value STRIPE_PUBLISHABLE_KEY)"
  secret_key="$(env_value STRIPE_SECRET_KEY)"

  if [[ -z "$publishable_key" && -z "$secret_key" ]]; then
    log "Stripe keys are empty; skipping payment gateway setup"
    return
  fi

  if [[ -z "$publishable_key" || -z "$secret_key" ]]; then
    die "set both STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY, or leave both empty"
  fi

  compose exec -T web bin/rails runner '
    store = Spree::Store.default
    gateway = Spree::PaymentMethod.where(
      type: "SpreeStripe::Gateway",
      name: "CenWatch Stripe"
    ).first_or_initialize
    gateway.assign_attributes(
      active: true,
      display_on: "both",
      auto_capture: true,
      stores: [store],
      preferences: {
        publishable_key: ENV.fetch("STRIPE_PUBLISHABLE_KEY"),
        secret_key: ENV.fetch("STRIPE_SECRET_KEY")
      }
    )
    gateway.save!(validate: false)
    puts "Stripe gateway ready: #{gateway.id}"
  '
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)
      CHECK_ONLY=true
      ;;
    --prepare-env)
      PREPARE_ONLY=true
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      die "unknown option: $1"
      ;;
  esac
  shift
done

if [[ "$CHECK_ONLY" == "true" && "$PREPARE_ONLY" == "true" ]]; then
  die "--check and --prepare-env cannot be used together"
fi

if [[ "$CHECK_ONLY" == "true" ]]; then
  require_command docker
  docker compose version >/dev/null 2>&1 ||
    die "Docker Compose v2 is not available"
  docker compose --project-name cenwatch \
    --env-file "$ENV_EXAMPLE" \
    -f "$COMPOSE_FILE" \
    config --quiet
  printf 'Deployment configuration is valid.\n'
  exit 0
fi

check_docker
guard_existing_database_volume

prepare_env

if [[ "$PREPARE_ONLY" == "true" ]]; then
  printf 'Deployment environment ready: %s\n' "$ENV_FILE"
  exit 0
fi

log "Validating Docker Compose configuration"
compose config --quiet

log "Pulling infrastructure images"
compose pull postgres redis

log "Building the CenWatch Spree locale-fix image"
compose build --pull web worker

log "Starting PostgreSQL, Redis, Spree, and Sidekiq"
compose up -d --wait postgres redis web worker

log "Seeding the default Spree store and administrator"
compose exec -T -e AUTO_ACCEPT=1 web bin/rails db:seed

log "Running required Spree catalog upgrade tasks"
run_spree_upgrade

log "Creating or reusing the storefront API key"
ensure_publishable_key

log "Configuring the allowed storefront origin"
ensure_allowed_origin

configure_stripe

log "Repairing missing product primary media"
repair_product_media

log "Building the CenWatch storefront"
compose build --pull storefront

log "Starting the storefront with a fresh catalog cache"
compose up -d --wait --force-recreate storefront

admin_email="$(env_value ADMIN_EMAIL)"
admin_password="$(env_value ADMIN_PASSWORD)"
api_url="$(env_value SPREE_API_URL)"
public_api_url="$(env_value SPREE_PUBLIC_URL)"
site_url="$(env_value SITE_URL)"

cat <<EOF

CenWatch is running.

  Spree API host port: 30000
  Storefront host port: 30001
  Internal API URL: $api_url
  Public API URL: $public_api_url
  Storefront URL: $site_url
  Admin URL: $public_api_url/admin
  Admin email: $admin_email
  Admin password: $admin_password

Deployment secrets are stored in:
  $ENV_FILE

1Panel can now proxy the API domain to 127.0.0.1:30000 and the storefront
domain to 127.0.0.1:30001.
EOF
