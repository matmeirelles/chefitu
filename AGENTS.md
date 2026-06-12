# Chefitu — Agent Instructions

See also `CLAUDE.md` for stack, changelog, and branch naming conventions.

## Cursor Cloud specific instructions

Setup deps (`npm install`, `prisma generate`) are handled by the startup update script. Standard commands live in `README.md`. Notes that are non-obvious in the cloud VM:

- **Postgres runs as a local apt service, not Docker** (Docker isn't available). It is NOT auto-started on boot — start it each session with `sudo pg_ctlcluster 16 main start`. The role/db/password match `infra/docker-compose.yml` (`chefitu`/`chefitu`/`chefitu`), so the `DATABASE_URL` from `.env.example` works unchanged.
- **`.env` files are git-ignored and not in the snapshot reliably.** If missing, recreate: root `.env` with `DATABASE_URL="postgresql://chefitu:chefitu@localhost:5432/chefitu?schema=public"`, `PORT=3333`, `HOST=0.0.0.0`; and `apps/mobile/.env` with `EXPO_PUBLIC_API_BASE_URL=http://localhost:3333`.
- **After Postgres is up, run `npm run db:migrate`** (idempotent) to sync schema before starting the API.
- **`npm run db:seed` is broken** — `prisma/seed.ts` references the removed `prepTimeMinutes` column. Seeding is optional; create recipes via the API instead (e.g. `POST /recipes/generated`).
- **`ANTHROPIC_API_KEY` is not set by default.** The API boots fine and all CRUD/recipe endpoints work, but AI features (Instagram import extraction, `/recipes/generate`, `/recipes/:id/adjust`, evals) will fail until the key is provided as a secret.
- **Mobile app has no web target** (no `react-native-web`/`react-dom`). In the headless VM you can't render it; verify it builds by starting Metro (`npm run dev --workspace @chefitu/mobile`) and requesting the bundle at `http://localhost:8081/apps/mobile/index.bundle?platform=ios&dev=true`. On a device, use Expo Go and point `EXPO_PUBLIC_API_BASE_URL` at the LAN IP.

## Spec Writer mode

When a Linear issue comment contains `/spec-writer` or `continuar spec-writer`:

1. Follow `.cursor/skills/spec-writer/SKILL.md` exactly.
2. **Do NOT** implement code, create branches, or open pull requests.
3. **Your response is synced to Linear** — output Impact Reports, questions, and specs directly; do not wait for Linear MCP.
4. Read the full comment thread from the issue context provided by the integration.
5. Write the final spec to the issue description using the template in `Instructions.md` (via MCP, `linear:update` script, or manual paste fallback).
6. Use targeted repo search — never run repomix.

Invocation from Linear:

```
@Cursor /spec-writer [repo=matmeirelles/chefitu]
```

After PM answers questions:

```
@Cursor continuar spec-writer
```
