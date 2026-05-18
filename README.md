# my-recipes

Monorepo for the My Recipes MVP.

## Running locally

Install dependencies:

```bash
npm install
```

Run the API:

```bash
npm run dev --workspace @my-recipes/api
```

Optional: enable Langfuse tracing for AI requests in the API by setting `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and optionally `LANGFUSE_BASE_URL` in the root `.env`.

Run the mobile app with Expo:

```bash
npm run dev --workspace @my-recipes/mobile
```

Open the Expo Go app on your phone and scan the QR code shown in the terminal.

If you are testing on a physical device, Expo reads `apps/mobile/.env`. Set `EXPO_PUBLIC_API_BASE_URL` there to your machine IP on the local network, for example `http://192.168.1.50:3333`.

## Workspace layout

- `apps/mobile`: Expo + React Native app
- `apps/api`: Fastify backend
- `packages/shared`: shared types and contracts
- `docs`: product and architecture docs
  - includes recipe schema, ingestion flow, design notes, and AI eval guidance
- `prisma`: database schema and migrations
- `infra`: local infrastructure setup

## Current status

This repository currently contains:

- product and architecture documentation
- initial monorepo workspace setup
- shared domain contracts for recipes and imports
- initial API structure with mock data endpoints
- initial Prisma schema and local PostgreSQL setup
- initial Expo mobile app wired to the mock API
