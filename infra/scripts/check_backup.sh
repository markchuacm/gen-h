#!/bin/sh
set -eu

docker compose --env-file infra/docker/.env.production \
  -f infra/docker/compose.production.yml exec -T --user postgres postgres \
  pgbackrest --stanza=verae check

docker compose --env-file infra/docker/.env.production \
  -f infra/docker/compose.production.yml exec -T --user postgres postgres \
  pgbackrest --stanza=verae info
