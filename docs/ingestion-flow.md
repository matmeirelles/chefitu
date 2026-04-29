# Ingestion Flow

This document defines the MVP ingestion flow, from receiving an Instagram link to saving a structured recipe.

## Goal

The ingestion pipeline must:

- receive a shared Instagram link from the mobile app
- create a processing record immediately
- fetch the post description
- decide whether the description contains a usable recipe
- structure the recipe data with AI when possible
- save the final result with a clear status

## High-level flow

1. The user shares an Instagram post to the app.
2. The app sends the link to the backend.
3. The backend creates a new imported item with status `queued`.
4. The backend enqueues a processing job.
5. A worker picks up the job and updates the status to `processing`.
6. The worker fetches the Instagram post description.
7. If the description is empty or does not contain a recipe, the item becomes `no_recipe_in_description`.
8. If the description looks usable, the worker sends it to the AI structuring layer.
9. The AI returns structured recipe data.
10. The backend validates the response against the recipe schema.
11. If valid, the item becomes `ready`.
12. If a technical error happens, the item becomes `failed`.

## Suggested components

### Mobile app

Responsibilities:

- receive the shared Instagram link
- send the link to the backend
- display import status to the user
- show the final recipe or the fallback state

### API backend

Responsibilities:

- accept import requests
- persist the initial record
- enqueue processing jobs
- expose imported items and recipes to the app

### Worker

Responsibilities:

- process queued imports
- fetch the post description
- call the AI extraction layer
- validate and persist the final result

### AI extraction layer

Responsibilities:

- receive raw description text
- classify whether there is a recipe in the description
- return structured data in the expected schema

## Minimum backend flow

### 1. Import request

The app sends:

```ts
type CreateImportRequest = {
  sourceUrl: string;
};
```

The backend creates:

```ts
type ImportRecord = {
  id: string;
  sourceUrl: string;
  sourcePlatform: "instagram";
  status: "queued";
  createdAt: string;
  updatedAt: string;
};
```

### 2. Queue job

The backend enqueues a job using the import id.

Example:

```ts
type ImportJob = {
  importId: string;
};
```

### 3. Fetch description

The worker loads the import record and tries to fetch:

- `sourceAuthorName`
- `rawDescription`
- `coverImageUrl` if easily available

If the description cannot be fetched because of a technical issue, the record becomes `failed`.

### 4. Recipe detection

The worker checks whether the description is likely to contain a recipe.

For the MVP, this can be fully delegated to the AI layer, as long as the AI returns either:

- `ready`
- `no_recipe_in_description`

### 5. Structuring

If the description is usable, the AI returns:

- `title`
- `ingredients`
- `steps`
- optional time fields
- optional `servings`
- optional `tags`

### 6. Validation

Before saving, the backend validates:

- schema shape
- required fields for `ready`
- no duplicate step order
- item status consistency

Invalid AI output should become `failed` in the MVP, with the raw response logged for debugging.

### 7. Final persistence

The final item is saved with one of these statuses:

- `ready`
- `no_recipe_in_description`
- `failed`

## User-visible behavior

### While processing

The app should show the import as:

- pending when `queued`
- processing when `processing`

### When successful

The app shows the structured recipe.

### When no recipe is found

The app should show:

- a clear message that no recipe was found in the description
- the original Instagram link

### When processing fails

The app should show:

- a generic failure message
- the original Instagram link
- an option to retry later in a future version

## Testing strategy for this flow

### Unit tests

- import creation defaults to `queued`
- worker transitions `queued` -> `processing`
- valid AI result becomes `ready`
- no-recipe result becomes `no_recipe_in_description`
- invalid AI result becomes `failed`

### Integration tests

- API creates an import record and queues a job
- worker updates the database correctly
- schema validation rejects malformed AI output

### End-to-end tests

- shared link import reaches `ready`
- shared link import reaches `no_recipe_in_description`
- fetch failure reaches `failed`

### Evals preparation

The AI layer should be isolated so we can store:

- input description
- model output
- expected output
- pass/fail result

This will allow us to build a repeatable eval dataset from real examples later.
