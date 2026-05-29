# Project Structure

This document defines the initial monorepo structure for the MVP.

## Goal

The project should be organized so that:

- the mobile app and backend can evolve in parallel
- shared types and schemas live in one place
- tests are easy to organize
- the import pipeline can be added later without reshaping the whole repository

## Proposed structure

```txt
chefitu/
  apps/
    mobile/
    api/
  packages/
    shared/
  docs/
  prisma/
  infra/
```

## Folder responsibilities

### `apps/mobile`

Expo + React Native app.

Suggested responsibilities:

- recipe library UI
- import inbox UI
- recipe details screen
- search and filters
- API integration
- app-level tests

### `apps/api`

Fastify + TypeScript backend.

Suggested responsibilities:

- REST API
- import endpoints
- recipe endpoints
- validation
- business rules
- future ingestion worker entrypoints
- backend tests

### `packages/shared`

Shared code used by both app and API.

Suggested responsibilities:

- shared TypeScript types
- schema contracts
- status enums
- API DTOs
- validation helpers if we want to reuse them

This package is especially useful to avoid duplicated types like:

- `RecipeStatus`
- `ImportStatus`
- `RecipeIngredient`
- `RecipeStep`

### `docs`

Product and architecture decisions.

This already includes:

- recipe schema
- ingestion flow
- data model

### `prisma`

Database schema and migrations.

Suggested responsibilities:

- `schema.prisma`
- migrations
- seed scripts

### `infra`

Local infrastructure setup.

Suggested responsibilities:

- Docker Compose for PostgreSQL
- environment examples
- future local services if needed

## Suggested internal structure

### `apps/mobile`

```txt
apps/mobile/
  app/
  src/
    components/
    features/
    services/
    hooks/
    test/
```

Notes:

- `app/` can be used if we choose Expo Router.
- `features/` helps organize screens and logic by domain instead of by file type only.

### `apps/api`

```txt
apps/api/
  src/
    routes/
    modules/
      imports/
      recipes/
    services/
    lib/
    test/
```

Notes:

- `modules/imports` and `modules/recipes` map well to our current domain model.
- the ingestion worker can later live in `modules/imports`.

### `packages/shared`

```txt
packages/shared/
  src/
    recipe/
    import/
    api/
```

## Why this structure is a good fit

This structure gives us:

- clear separation between frontend and backend
- one place for shared contracts
- easier testing boundaries
- low friction to add the import pipeline later

## Initial implementation order

1. Create the monorepo structure.
2. Set up the backend app.
3. Set up PostgreSQL and Prisma.
4. Create the shared package with core types.
5. Expose recipe and import endpoints with mocked or seeded data.
6. Set up the mobile app consuming those endpoints.
7. Add the ingestion pipeline later on top of the same model.
