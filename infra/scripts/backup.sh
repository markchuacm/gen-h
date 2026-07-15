#!/bin/sh
set -eu

backup_type="${1:-diff}"
case "$backup_type" in
  full|diff|incr) ;;
  *) echo "usage: $0 [full|diff|incr]" >&2; exit 2 ;;
esac

docker compose --env-file infra/docker/.env.production \
  -f infra/docker/compose.production.yml exec -T --user postgres postgres \
  pgbackrest --stanza=verae --type="$backup_type" backup
