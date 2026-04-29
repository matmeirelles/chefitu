# Data Model

This document defines the initial database model for the MVP.

## Goal

The database must support:

- a list of completed recipes for the main app experience
- a list of import attempts with status tracking
- a clear separation between imported source data and structured recipe data
- future AI evaluation and debugging needs

## Main entities

The MVP should start with two main entities:

- `imports`
- `recipes`

## `imports`

This table represents every Instagram link received by the system, including successful and unsuccessful processing attempts.

### Purpose

Use `imports` to:

- track the processing lifecycle
- store source metadata
- store the raw description
- keep failed and no-recipe cases visible in the app

### Suggested fields

```ts
type ImportStatus =
  | "queued"
  | "processing"
  | "ready"
  | "no_recipe_in_description"
  | "failed";

type ImportRecord = {
  id: string;
  sourcePlatform: "instagram";
  sourceUrl: string;
  sourceAuthorName?: string | null;
  rawDescription?: string | null;
  coverImageUrl?: string | null;
  status: ImportStatus;
  failureReason?: string | null;
  recipeId?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### Notes

- `recipeId` is filled when the import successfully creates a recipe.
- `failureReason` is optional and mainly useful for internal debugging or limited user messaging.
- Imports with `ready` may stop appearing in the import inbox, but should remain in the database for traceability.

## `recipes`

This table represents recipes that were successfully structured and are ready to be shown in the main library.

### Purpose

Use `recipes` to:

- power the recipe list UI
- power search and filters
- store structured recipe data independently from import state

### Suggested fields

```ts
type RecipeRecord = {
  id: string;
  importId: string;
  title: string;
  ingredients: {
    amount?: string | null;
    unit?: string | null;
    item: string;
  }[];
  steps: {
    order: number;
    instruction: string;
  }[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

### Notes

- `importId` links the recipe back to the import that created it.
- The main app recipe list should read from this table.
- In the MVP, `ingredients`, `steps`, and `tags` can be stored as JSON.

## Relationship between entities

The relationship is:

- one `import` may create zero or one `recipe`
- every `recipe` must come from exactly one `import`

In practice:

- `queued`, `processing`, `failed`, and `no_recipe_in_description` imports have no recipe
- `ready` imports point to a created recipe

## App views supported by this model

### Recipe library

Read from `recipes`.

This is the main list of completed recipes the user can browse, search, and filter.

### Import inbox

Read from `imports` where status is one of:

- `queued`
- `processing`
- `failed`
- `no_recipe_in_description`

This is the operational list of imports that are still pending, failed, or did not contain a usable recipe.

## Why this separation is useful

Keeping `imports` and `recipes` separate gives us:

- a cleaner UI model
- simpler status tracking
- easier debugging
- better support for retries later
- better support for AI evals and audit trails

## Future extensions

The MVP does not require these yet, but this model leaves room for:

- retrying failed imports
- storing model input/output history
- user-edited recipes after import
- manual recipe creation
- recipe favorites
- recipe collections

## Testing implications

This model supports:

- unit tests for import-to-recipe transitions
- integration tests for persistence rules
- seeded mock data for frontend development
- future eval datasets tied back to real imports
