# Local backend development

Only synthetic data belongs in the local environment.

## First setup

1. Install Docker Desktop, Node.js 24 LTS, and pnpm.
2. Copy `server/.env.example` to `server/.env`.
3. Set `PARTNER_CREDENTIAL_ENCRYPTION_KEY` to the output of `openssl rand -base64 32`.
4. Start PostgreSQL, MinIO, and ClamAV:

   ```sh
   docker compose -f infra/docker/compose.local.yml up -d
   ```

5. Apply the clean database and create synthetic users:

   ```sh
   pnpm db:migrate
   pnpm db:seed
   ```

6. Start the API and portal in separate terminals:

   ```sh
   pnpm dev:api
   pnpm dev
   ```

The API is at `http://localhost:4000`, generated documentation at `http://localhost:4000/docs`, and the portal at `http://localhost:5173/member.html`.

## Developer mode password

The admin panel's destructive account controls use a separate developer-mode
password. Set it without putting the plaintext value in source code, shell
history, or chat:

```sh
pnpm --filter @verae/api developer:password
```

The command prompts without echoing, asks for confirmation, and prints a
one-way `DEVELOPER_MODE_PASSWORD_HASH=...` value. Add that generated line to
the API's local environment file or secret manager, then restart the API. Only
the hash is stored; the password itself cannot be recovered from it.

If `DEVELOPER_MODE_PASSWORD_HASH` is absent, the menu shows developer mode as
not configured and the deletion API remains unavailable. An enabled grant is
HTTP-only, tied to the signed-in administrator, and expires after 30 minutes.

## Clean reset

Because this is greenfield and synthetic-only, reset by removing the local dependency volumes and recreating them:

```sh
docker compose -f infra/docker/compose.local.yml down -v
docker compose -f infra/docker/compose.local.yml up -d
pnpm db:migrate
pnpm db:seed
```

## Checks before a change is merged

```sh
pnpm test
pnpm build:all
rg -n "supabase|@supabase" src package.json
```

The final command must return no matches. Browser OCR is compiled only in development and is not present in the production portal bundle.
