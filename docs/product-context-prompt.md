# Product Context Prompt — My Recipes

Use the context below to create a full PRD for the My Recipes app.

---

## What is My Recipes?

My Recipes is a personal mobile app (iOS-first) that lets a user save recipes found on Instagram and access them in a clean, structured library. The core problem it solves: recipes discovered on Instagram are scattered across saved posts, DMs, and story replies — hard to find later, never organized, and impossible to follow while cooking.

The app takes an Instagram post URL, extracts the recipe from the post description using AI, and stores it in a structured format (title, ingredients, steps, timing, servings). The result is a personal recipe library the user actually controls.

---

## Target User

Single user (personal app, not multi-tenant). The owner is the sole user — no auth, no social features. The focus is entirely on personal utility: fast capture, clean reading experience while cooking.

---

## Core User Journey

1. User sees a recipe on Instagram
2. User copies the post URL and pastes it into the app
3. App saves the import and processes it in the background (AI extracts the recipe)
4. User gets notified when it's ready (or sees the status in the Imports inbox)
5. Recipe appears in the library, ready to browse and follow while cooking

---

## Current State (already built)

### Recipe Library (done)
- List of all saved recipes with cover image, title, time, servings, category, tags
- Filter chips to filter by category/tag
- Search (client-side, deferred)
- Tap to open full recipe detail

### Recipe Detail (done)
- Hero image with glass nav buttons (back, bookmark, share, more)
- Recipe metadata: category, cuisine, total time, servings, ingredient count
- Tabbed view: Ingredients / Instructions
- Ingredients: interactive checklist (tap to cross off while cooking)
- Instructions: numbered timeline layout with vertical connector line
- Floating AI bar at bottom (placeholder for future "adjust this recipe" feature)

### API (done)
- `GET /recipes` — returns full recipe library
- `GET /recipes/:id` — returns single recipe
- `GET /imports` — returns inbox imports (non-ready statuses only)
- Built with Fastify (Node.js), connected to PostgreSQL via Prisma ORM

### Data model (done)
- **Import**: id, sourcePlatform, sourceUrl, sourceAuthorName, rawDescription, coverImageUrl, status, failureReason, recipeId, createdAt, updatedAt
- **Recipe**: id, importId, title, coverImageUrl, category, cuisine, ingredients (JSON), steps (JSON), prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, servings, tags, createdAt, updatedAt
- Import statuses: `queued` → `processing` → `ready` | `failed` | `no_recipe_in_description`

---

## What Needs to Be Built Next

### 1. Imports Inbox Screen (next up)
Shows the user the status of their imports — the "processing pipeline" view.

Should show:
- Imports that are currently processing (spinner/loading state)
- Imports that failed (with reason)
- Imports where no recipe was found in the description
- Each item: source author, thumbnail if available, status badge, failure reason if applicable
- Ability to retry a failed import
- Ability to dismiss/delete an import
- When an import is `ready`, it should NOT appear here (it moves to the library)

### 2. New Import Flow
The user needs a way to submit a new Instagram URL.

- Entry point: a prominent button (probably in the Library header or a bottom action button)
- Input: paste an Instagram post URL
- On submit: calls `POST /imports`, creates an import record with status `queued`
- User is taken to (or sees) the Imports inbox where they can watch the status update

### 3. AI Processing Pipeline (backend)
When an import is created:
1. Fetch the Instagram post description (sourceUrl → scrape or use API)
2. Send the raw description to the Claude API with a structured prompt
3. Claude returns a structured JSON matching the Recipe schema
4. Save the Recipe record, update Import status to `ready`, link recipeId
5. On failure: set status to `failed` or `no_recipe_in_description` with a reason

The `rawDescription` field is always saved so any import can be re-processed with an improved prompt without re-fetching the post.

### 4. Re-process / Retry
- User can tap "Try again" on a failed or no-recipe import
- This re-runs the AI extraction with the current prompt
- If rawDescription is empty, it re-fetches the post first

---

## AI Extraction — Design Principles

- The prompt is the core product lever — quality of extraction = quality of the app
- Output must be validated before saving (required fields: title, at least 1 ingredient, at least 1 step)
- If Claude can't extract a recipe, it should return a structured "no recipe found" response, not fail silently
- Evals: a set of real post descriptions with expected outputs, scored before/after prompt changes
- Model: Claude (Anthropic API) — specifically designed around this use case

---

## Design Language

- Platform: React Native + Expo (iOS-first)
- Design system: Material Design 3, warm terracotta palette
- Primary color: #8E4D22 (terracotta brown)
- Background/surface: #FFF8F5 (warm off-white)
- Card color: #FEF1EB
- No dark mode (for now)
- No bottom tab bar — simple stack navigation
- Tone: warm, calm, focused on the food — not loud or gamified

---

## Technical Stack (for reference)

- **Mobile**: React Native + Expo SDK 54, React Native Paper (M3), TypeScript
- **API**: Fastify (Node.js), TypeScript, Prisma ORM
- **Database**: PostgreSQL 16 (local for now, cloud deploy planned)
- **AI**: Anthropic Claude API (planned)
- **Monorepo**: Turborepo, npm workspaces
- **Shared types**: `@chefitu/shared` package consumed by both API and mobile

---

## Out of Scope (for now)

- Multi-user / auth
- Social / sharing features
- Web app
- Push notifications
- Meal planning or shopping list
- Recipe editing by the user
- Dark mode
