# Recipe Schema

This document defines the initial MVP contract for recipes imported from Instagram.

## Goal

The system must:

- receive a shared Instagram post link
- read the post description
- structure the recipe when there is enough content
- clearly inform the user when the recipe is not present in the description

## Processing statuses

Imported items must use one of the statuses below:

- `queued`: link received and waiting to be processed
- `processing`: extraction is currently running
- `ready`: structured recipe is ready to display
- `no_recipe_in_description`: no usable recipe was found in the description
- `failed`: a technical failure happened during processing

## Recipe

```ts
type RecipeStatus =
  | "queued"
  | "processing"
  | "ready"
  | "no_recipe_in_description"
  | "failed";

type RecipeIngredient = {
  amount?: string | null;
  unit?: string | null;
  item: string;
};

type RecipeStep = {
  order: number;
  instruction: string;
};

type Recipe = {
  id: string;
  sourceUrl: string;
  sourcePlatform: "instagram";
  sourceAuthorName?: string | null;
  rawDescription?: string | null;
  title?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
  status: RecipeStatus;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## Population rules

### Required fields for every imported item

- `id`
- `sourceUrl`
- `sourcePlatform`
- `ingredients`
- `steps`
- `tags`
- `status`
- `createdAt`
- `updatedAt`

### When `status = queued`

The item has been accepted by the system but has not started extraction yet.

### When `status = processing`

The item is being processed by the extraction pipeline.

### When `status = ready`

The following fields are expected to be populated:

- `title`
- `ingredients` with at least 1 item
- `steps` with at least 1 item

Fields such as time, servings, and image may still be empty in the MVP.

### When `status = no_recipe_in_description`

The system must:

- keep `sourceUrl`
- keep `rawDescription` when available
- allow empty `ingredients`
- allow empty `steps`
- show the user that the recipe was not found in the description

### When `status = failed`

The system must:

- keep `sourceUrl`
- keep `rawDescription` if it has already been fetched
- record the technical error outside this display schema

## Validation rules

### `sourceUrl`

- required
- must be a valid URL
- in the MVP, it must point to Instagram

### `title`

- optional in the general schema
- required when `status = ready`
- ideally short and readable

### `ingredients`

Each item must contain:

- `item`: required
- `amount`: optional, free text in the MVP
- `unit`: optional, free text in the MVP

Example:

```ts
{
  amount: "2",
  unit: "cups",
  item: "all-purpose flour"
}
```

### `steps`

Each step must contain:

- `order`: required
- `instruction`: required

`order` must start at 1 and continue without duplicates.

### time fields

- `prepTimeMinutes`, `cookTimeMinutes`, and `totalTimeMinutes` are optional
- when `totalTimeMinutes` is present, it must be greater than or equal to each partial time

### `servings`

- optional
- free text in the MVP, for example `2 servings`, `1 cake`, `8 slices`

### `tags`

- list of strings
- should start empty when the AI is not confident
- should avoid duplicates

## Expected AI response

For the structuring pipeline, the AI must always return an object compatible with this contract:

```ts
type RecipeExtractionResult =
  | {
      status: "ready";
      title: string;
      ingredients: RecipeIngredient[];
      steps: RecipeStep[];
      prepTimeMinutes?: number | null;
      cookTimeMinutes?: number | null;
      totalTimeMinutes?: number | null;
      servings?: string | null;
      tags?: string[];
    }
  | {
      status: "no_recipe_in_description";
      reason: string;
    };
```

## Testing implications

This contract allows us to test:

- parser and validation without depending on the app
- the AI layer with mocks
- happy paths and no-recipe-in-description cases
- evals with real inputs and expected outputs
