#!/usr/bin/env sh
set -eu

# Usage: set-google-oauth.sh [production|staging]   (defaults to production)
# Prompts (hidden) for the Google OAuth client ID + secret, writes them into
# the environment's server env file, and recreates the api container.
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENVIRONMENT=${1:-production}

case "$ENVIRONMENT" in
  production)
    APP_ENV="$ROOT_DIR/server/.env.production"
    COMPOSE_ENV="$ROOT_DIR/infra/aws/.env.production"
    COMPOSE_FILE="$ROOT_DIR/infra/aws/compose.production.yml"
    ;;
  staging)
    APP_ENV="$ROOT_DIR/server/.env.staging"
    COMPOSE_ENV="$ROOT_DIR/infra/aws/.env.staging"
    COMPOSE_FILE="$ROOT_DIR/infra/aws/compose.staging.yml"
    ;;
  *)
    echo "Usage: $0 [production|staging]" >&2
    exit 1
    ;;
esac

for f in "$APP_ENV" "$COMPOSE_ENV" "$COMPOSE_FILE"; do
  if [ ! -f "$f" ]; then
    echo "Required file not found: $f" >&2
    exit 1
  fi
done

API_DOMAIN=$(awk -F= '/^API_DOMAIN=/{print $2; exit}' "$COMPOSE_ENV")
HEALTH_URL="https://${API_DOMAIN}/health/live"

replace_env() {
  key=$1
  value=$2
  file=$3
  tmp=$(mktemp)
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$file" > "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$file"
}

read_hidden() {
  prompt=$1
  printf "%s" "$prompt" >&2
  stty -echo
  IFS= read -r REPLY
  stty echo
  printf "\n" >&2
}

trap 'stty echo 2>/dev/null || true' EXIT HUP INT TERM

read_hidden "Google OAuth client ID (hidden): "
client_id=$REPLY
read_hidden "Google OAuth client secret (hidden): "
client_secret=$REPLY

case "$client_id" in
  *.apps.googleusercontent.com) ;;
  *)
    echo "The client ID should end with .apps.googleusercontent.com." >&2
    exit 1
    ;;
esac

if [ "${#client_secret}" -lt 16 ]; then
  echo "The client secret is unexpectedly short." >&2
  exit 1
fi

replace_env GOOGLE_CLIENT_ID "$client_id" "$APP_ENV"
replace_env GOOGLE_CLIENT_SECRET "$client_secret" "$APP_ENV"
chmod 600 "$APP_ENV"

unset client_id client_secret REPLY

docker compose --env-file "$COMPOSE_ENV" -f "$COMPOSE_FILE" up -d --no-deps --force-recreate api

attempt=1
while [ "$attempt" -le 12 ]; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Google OAuth configured for $ENVIRONMENT and the API is healthy."
    exit 0
  fi
  sleep 5
  attempt=$((attempt + 1))
done

echo "The credentials were saved, but the API health check did not recover in time." >&2
exit 1
