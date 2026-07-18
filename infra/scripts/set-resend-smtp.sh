#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
# Target env file: pass a path (relative to repo root or absolute) as the first
# argument to target another environment, e.g. server/.env.staging. Defaults to
# production so existing usage is unchanged.
TARGET=${1:-server/.env.production}
case "$TARGET" in
  /*) APP_ENV="$TARGET" ;;
  *)  APP_ENV="$ROOT_DIR/$TARGET" ;;
esac
DEFAULT_FROM="Verae Health <noreply@veraehealth.com>"

if [ ! -f "$APP_ENV" ]; then
  echo "Environment file was not found at $APP_ENV" >&2
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
  printf "Resend API key (hidden): " >&2
  stty -echo
  IFS= read -r REPLY
  stty echo
  printf "\n" >&2
}

trap 'stty echo 2>/dev/null || true' EXIT HUP INT TERM

read_secret
api_key=$REPLY

case "$api_key" in
  re_[A-Za-z0-9_-]*) ;;
  *)
    echo "That does not look like a Resend API key. Expected a value beginning with re_." >&2
    exit 1
    ;;
esac

case "$api_key" in
  *[!A-Za-z0-9_-]*)
    echo "The API key contains characters that cannot safely be placed in the SMTP URL." >&2
    exit 1
    ;;
esac

replace_env SMTP_URL "smtps://resend:${api_key}@smtp.resend.com:465" "$APP_ENV"
replace_env EMAIL_FROM "$DEFAULT_FROM" "$APP_ENV"

unset api_key REPLY
echo "Resend SMTP configured for $DEFAULT_FROM without printing the API key."
