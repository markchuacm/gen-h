#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
APP_ENV="$ROOT_DIR/server/.env.production"
COMPOSE_FILE="$ROOT_DIR/infra/docker/compose.production.yml"

if [ ! -f "$APP_ENV" ]; then
  echo "Production environment file was not found at $APP_ENV" >&2
  exit 1
fi

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

docker compose --env-file "$APP_ENV" -f "$COMPOSE_FILE" up -d --force-recreate api

attempt=1
while [ "$attempt" -le 12 ]; do
  if curl -fsS https://api.veraehealth.com/health/live >/dev/null 2>&1; then
    echo "Google OAuth configured and the Verae API is healthy."
    exit 0
  fi
  sleep 5
  attempt=$((attempt + 1))
done

echo "The credentials were saved, but the API health check did not recover in time." >&2
exit 1
