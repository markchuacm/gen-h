#!/usr/bin/env sh
set -eu

# Deploy the Verae backend to a Lightsail instance.
#
#   infra/scripts/deploy.sh <production|staging> <user@host>
#
# Only files tracked by git at HEAD are shipped. The working tree also holds
# gitignored material that must NEVER reach a server — real lab PDFs in
# ocr-sample/ (PHI) and provisioning secrets under outputs/aws-setup/. Sourcing
# the payload from `git archive` (not the working directory) makes it impossible
# to leak those by accident. The authoritative env files live only on the
# server; they are gitignored, so they are absent from the archive, and the
# rsync excludes below stop --delete from removing them.

ENVIRONMENT=${1:-}
TARGET=${2:-}

case "$ENVIRONMENT" in
  production|staging) ;;
  *)
    echo "Usage: $0 <production|staging> <user@host>" >&2
    exit 1
    ;;
esac

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <production|staging> <user@host>" >&2
  exit 1
fi

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT_DIR"

COMPOSE_FILE="infra/aws/compose.$ENVIRONMENT.yml"
ENV_FILE="infra/aws/.env.$ENVIRONMENT"
APP_ENV_FILE="server/.env.$ENVIRONMENT"
REMOTE_DIR=/opt/verae

if ! git diff --quiet HEAD 2>/dev/null; then
  echo "Working tree has uncommitted changes. Only committed files (HEAD) are deployed." >&2
  echo "Commit or stash first so what you ship matches what you review." >&2
  exit 1
fi

REVISION=$(git rev-parse --short HEAD)
echo "Deploying $ENVIRONMENT ($REVISION) to $TARGET"

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT
git archive --format=tar HEAD | tar -x -C "$work_dir"

# --delete keeps the server matching HEAD (removing files deleted from git),
# while the excludes protect the server-only secret files from deletion.
rsync -az --delete \
  --exclude "$APP_ENV_FILE" \
  --exclude "$ENV_FILE" \
  "$work_dir/" "$TARGET:$REMOTE_DIR/"

COMPOSE="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

# shellcheck disable=SC2087
ssh "$TARGET" "set -eu
  cd $REMOTE_DIR
  # `tools` has its own Compose build target. Rebuild it alongside the long-
  # running services so migrations from the release being deployed are present
  # when the one-off migration command runs.
  $COMPOSE build api worker tools
  $COMPOSE --profile tools run --rm tools
  $COMPOSE up -d
  $COMPOSE ps"

echo "Deployed $ENVIRONMENT ($REVISION). Verify /health/live, /health/ready, /docs."
