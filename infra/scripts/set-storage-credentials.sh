#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
APP_ENV="$ROOT_DIR/server/.env.production"
INFRA_ENV="$ROOT_DIR/infra/docker/.env.production"

if [ ! -f "$APP_ENV" ] || [ ! -f "$INFRA_ENV" ]; then
  echo "Production environment files were not found under $ROOT_DIR" >&2
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

read_secret() {
  prompt=$1
  printf "%s" "$prompt" >&2
  stty -echo
  IFS= read -r REPLY
  stty echo
  printf "\n" >&2
  if [ -z "$REPLY" ]; then
    echo "A value is required." >&2
    exit 1
  fi
}

trap 'stty echo 2>/dev/null || true' EXIT HUP INT TERM

read_secret "New documents access key: "
documents_key=$REPLY
read_secret "New documents secret key: "
documents_secret=$REPLY
read_secret "New backups access key: "
backups_key=$REPLY
read_secret "New backups secret key: "
backups_secret=$REPLY

replace_env S3_ACCESS_KEY_ID "$documents_key" "$APP_ENV"
replace_env S3_SECRET_ACCESS_KEY "$documents_secret" "$APP_ENV"
replace_env PGBACKREST_S3_KEY "$backups_key" "$INFRA_ENV"
replace_env PGBACKREST_S3_KEY_SECRET "$backups_secret" "$INFRA_ENV"

unset documents_key documents_secret backups_key backups_secret REPLY
echo "Storage credentials updated without printing them."
