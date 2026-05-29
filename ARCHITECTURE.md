# Architecture

## Product Architecture

### Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54 + React Native |
| Backend | Fastify + TypeScript (ESM) |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude (Haiku for extraction, Sonnet for evals judge) |
| Observability | Langfuse (traces, costs, latency) |
| Monorepo | Turborepo + npm workspaces |
| Deploy | Railway (API) + EAS (mobile) |

---

### Import pipeline

The flow starts when the user shares an Instagram link directly to the app.

```
[User]
    │
    │  Shares Instagram link
    ▼
[Mobile App]
    │
    │  POST /imports  { sourceUrl }
    ▼
[API — Fastify]
    │
    │  Creates ImportRecord with status "queued"
    │  Enqueues processing job
    ▼
[Worker — process-import]
    │
    │  Fetches og:description + og:image from Instagram
    │
    ├─── empty description ────────────► status: "no_recipe_in_description"
    │
    │  Sends description to AI layer
    ▼
[AI — Claude via tool calling]
    │
    │  Classifies whether the description contains a recipe
    │
    ├─── no recipe found ──────────────► status: "no_recipe_in_description"
    │
    │  Extracts structured fields (JSON Schema)
    │  title, ingredients, steps, tags, servings
    ▼
[API — validation]
    │
    ├─── invalid schema ───────────────► status: "failed"
    │
    │  Saves Recipe + updated ImportRecord
    ▼
status: "ready"
```

**ImportRecord statuses:**
- `queued` — waiting to be processed
- `processing` — currently running
- `ready` — recipe structured and saved
- `no_recipe_in_description` — no identifiable recipe in the description
- `failed` — technical error during processing

A watchdog runs on API startup and every 5 minutes to clean up imports stuck in `processing`.

---

### AI extraction

Extraction uses **tool calling** rather than free-form text generation. The model receives the raw post description and returns a JSON object validated against the recipe schema.

The prompt instructs the model to:

1. Decide whether the description contains a recipe (ingredients + steps)
2. Translate to Brazilian Portuguese if needed
3. Extract each field following explicit rules (e.g. `amount` accepts numeric strings only, `unit` is always required except for qualitative ingredients)

Cases intentionally discarded: posts with "Preparo no vídeo", promotional content without ingredients, posts asking users to comment to receive the recipe.

The model is configurable via the `AI_MODEL` environment variable. Default is Claude Haiku (fast, low cost). Claude Sonnet is used when higher accuracy is needed.

---

### AI recipe adjustment

Beyond importing, the app supports a conversational adjustment flow. The user can request changes in natural language ("without gluten", "half the servings") directly from the recipe detail screen.

- The backend maintains a session history per recipe
- The model returns a structured diff, not the full recipe
- The app shows original vs adjusted for the user to approve before saving
- Each session logs token consumption via a Prisma migration

---

### Observability

All AI calls are instrumented via **Langfuse** using OpenTelemetry. Each trace captures:

- Provider and model used
- Input and output tokens
- Call latency
- Result status (successful extraction, `noRecipe`, error)

Langfuse is also the environment for running prompt experiments before shipping to production.

---

### Evals

The eval pipeline runs separately from the main application via script (`npm run eval:recipes`).

**Extraction evals:**
- JSON dataset of real cases (`recipe-extraction.v1.json`)
- Deterministic comparison: Jaccard for ingredients and steps, exact match for categorical fields
- Each run is saved with provider, model, date, and dataset version

**Adjustment evals:**
- Separate dataset (`recipe-adjustment.v1.json`)
- LLM-as-judge via Claude Haiku to score adjustment quality
- `eval:watch` script for real-time prompt iteration: edit `extractionPrompt.ts`, save, see result instantly

---

### Trade-offs and design decisions

**Why tool calling instead of free-form text generation?**
Tool calling forces the model to return structured JSON validated against the schema. It eliminates the need to parse text and dramatically reduces format hallucinations. The trade-off is that the prompt must describe the schema precisely.

**Why were `prepTimeMinutes` and `cookTimeMinutes` removed?**
The model hallucinated these fields frequently — posts rarely include explicit timing, and the model invented plausible-sounding values. Removed from schema and prompt in v0.2.0.

**Why does adjustment return a diff instead of the full recipe?**
It prevents the model from rewriting fields the user did not ask to change. The diff also lets the user see exactly what will change before saving, which improves trust in the result.

---

## Development Workflow

> To be defined. This section will document how the development agents (Spec Writer, Code Architect) integrate into the product evolution flow.
