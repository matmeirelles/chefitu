# Context: My Recipes — Prompt Engineering

## What the app does
Mobile app (React Native) where the user pastes an Instagram link, or any other content. The backend fetches the post caption, sends it to an AI model, and stores the structured recipe. The AI step is the critical quality bottleneck.

## Full stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.81.5 + Expo SDK 54 + TypeScript |
| Backend | Node.js 22 + Fastify + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| AI inference | Ollama (local) — model `llama3.1:8b` |
| Monorepo | Turborepo (`apps/api`, `apps/mobile`, `packages/shared`) |

## Feature status

### Working end-to-end
- **Import flow**: user pastes URL → backend scrapes `og:description` → AI extracts recipe → saved to PostgreSQL → appears in library
- **Library screen**: lists saved recipes, filter by category, search by name
- **Recipe detail screen**: shows title, ingredients, steps, times, servings
- **Delete recipe**: swipe/button to remove from library
- **Import queue**: pending/processing/done states shown in UI

### In construction / being iterated
- **AI extraction quality**: prompt is the active work item — 0/5 eval cases pass today (see below)
- **Deployment**: Railway (API) + TestFlight (mobile) — infrastructure files exist but not yet deployed

## AI pipeline (where you come in)

```
Instagram URL
  → scrape og:description (caption text)
  → call AI with EXTRACTION_SYSTEM_PROMPT + caption
  → parse JSON response
  → save to DB or mark as noRecipe
```

The AI is called via `provider.extractRecipe(description: string)`.
The provider is abstracted — currently: **Ollama local, model llama3.1:8b**.

## Prompt structure

The prompt is a **single system message** injected on every AI call — no few-shot examples, no user-turn examples. It uses:
- A role declaration ("expert recipe extraction assistant")
- Numbered sequential instructions for input classification
- An explicit JSON schema (field names + types written out)
- Allowed-values lists for `category` and `cuisine`
- Extraction rules (language, formatting, units, steps, time, classification)
- A single error-handling rule (`{"noRecipe": true}`)

The prompt lives in `apps/api/src/lib/ai/prompt.ts` as `EXTRACTION_SYSTEM_PROMPT`. That's the **only** thing to edit to improve results.

## The prompt (current version — this is what we iterate on)

```
You are an expert recipe extraction assistant. Your task is to extract structured recipe data from Instagram post captions, descriptions, or linked websites.

When you are called you should follow the following instructions each one starting with delimeter #:

#1. Read the input that you received and recognize if it's an Instagram link, a text, a website link or an image
#2. If it's an Instagram link:
#2.a. Read the post and fetch the full description
#2.b. Identify if it's a recipe
#2.c. If it's not, return {"noRecipe": true}
#2.d. If only contains the a recipe ingredients, return those ingredients save those ingredients as "ingredients": [{ "amount": "string", "unit": "string", "item": "string" }]

### OUTPUT FORMAT
Return ONLY a valid JSON object. Do NOT include markdown code blocks, triple backticks, explanations, or any text other than the raw JSON.

### JSON SCHEMA
If a recognizable recipe is found, return this exact structure:
{
  "title": "string",
  "category": "One value from the allowed list below",
  "categorySuggestion": "Your original suggestion if category is 'Outro', otherwise omit",
  "cuisine": "One value from the allowed list below",
  "cuisineSuggestion": "Your original suggestion if cuisine is 'Outro', otherwise omit",
  "ingredients": [{ "amount": "string", "unit": "string", "item": "string" }],
  "steps": [{ "order": number, "title": "string", "instruction": "string" }],
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "totalTimeMinutes": number,
  "servings": "string",
  "tags": ["string"]
}

### ALLOWED VALUES
- Categories: Café da manhã | Almoço | Lanche | Sobremesa | Petisco | Snack | Bebida Alcoólica | Drink | Bebida | Condimento | Outro
- Cuisines: Italiana | Asiática | Saudável | Mexicana | Americana | Brasileira | Mediterrânea | Japonesa | Cafeteria | Alemã | Carnes | Outro | Aperitivos | Doces

### EXTRACTION RULES
1. Language: All extracted content MUST be in Brazilian Portuguese.
2. Ingredient Formatting: "item" must start with Capital Letter. Expand abbreviations.
3. Units & Amounts: "amount" is always a number string. "unit" must never be empty string — use "unidade", "dente", etc. Omit both only for qualitative measures like "sal a gosto".
4. Steps: "title" and "instruction" are mandatory for every step. Title = short action-oriented label. Instruction = full description.
5. Time & Servings: Always estimate totalTimeMinutes. Estimate servings if not stated (must be a number string).
6. Classification: category and cuisine must match allowed lists. Never null or empty.

### ERROR HANDLING
If no recognizable recipe exists, return exactly: {"noRecipe": true}
```

## Expected JSON output shape

```typescript
// Recipe found:
{
  title: string
  category: string          // from allowed list
  cuisine: string           // from allowed list
  ingredients: Array<{ amount?: string, unit?: string, item: string }>
  steps: Array<{ order: number, title: string, instruction: string }>
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  totalTimeMinutes: number
  servings: string
  tags: string[]
}

// No recipe:
{ noRecipe: true }
```

## Eval system

Test cases live in `evals/datasets/recipe-extraction.v1.json` — 5 real Instagram posts with expected output defined.

**Run full eval (all 5 cases, compares actual vs expected):**
```bash
npm run eval:recipes --workspace=apps/api
```

**Quick one-shot test with a caption:**
```bash
npm run eval:try --workspace=apps/api -- --caption "sua caption aqui"
```

**Watch mode (auto re-runs on every prompt.ts save — main iteration loop):**
```bash
npm run eval:watch --workspace=apps/api -- --caption "sua caption aqui"
```

## Current eval results: 0/5 passing (llama3.1:8b)

### Known failure patterns

| Field | Expected | Actual (llama3.1:8b) |
|---|---|---|
| `amount` | `"300"` | `"300g"` (unit merged into amount) |
| `unit` | `"g"` | `""` (empty) |
| `cuisine` | `"Japonesa"` | missing entirely |
| `ingredients` | 8 items | 2 items (truncated) |
| `servings` | `"1 porcao"` | `null` |
| `tags` | `["Sushi","Saudavel"]` | `["Rápido","Vegetariano"]` (hallucinated) |
| `title` | `"Sushi de Preguiçoso"` | `"Sushi de preguiçoso na travessa"` (added info) |
| `noRecipe` | `true` | `false` (failed to detect no-recipe post) |

### Concrete example (case_001 — Sushi)

**Input caption (excerpt):**
```
300g de salmão cortado em cubos, pepino, cebolinha, cream cheese, 1/2 xic de arroz japonês...
```

**Actual output:**
```json
{
  "title": "Sushi de preguiçoso na travessa",
  "category": "Lanche",
  "ingredients": [
    { "amount": "300g", "unit": "", "item": "salmão" },
    { "amount": "", "unit": "", "item": " pepino" }
  ],
  "steps": [
    { "order": 1, "title": "Lave muito bem o arroz e leve para cozinhar", "instruction": "cozinhar com 1 xic de água..." },
    { "order": 2, "title": "Corte o salmão em cubos", "instruction": "e o pepino" }
  ],
  "servings": null
}
```

**Expected output:**
```json
{
  "title": "Sushi de Preguiçoso",
  "category": "Almoço",
  "cuisine": "Japonesa",
  "ingredients": [
    { "amount": "300", "unit": "g", "item": "salmão cortado em cubos" },
    { "amount": "A gosto", "unit": "", "item": "Pepino" },
    { "amount": "1/2", "unit": "xicara", "item": "Arroz Japones" }
  ],
  "steps": [
    { "order": 1, "title": "Preparar o Arroz", "instruction": "Lave muito bem o arroz e leve para cozinhar com 1 xicara de agua ate chegar no ponto." },
    { "order": 2, "title": "Preparar ingredientes", "instruction": "Corte o salmão em cubos, o pepino e a cebolinha." }
  ],
  "servings": "1 porcao"
}
```

## How to edit the prompt

File: `apps/api/src/lib/ai/prompt.ts`
The exported constant `EXTRACTION_SYSTEM_PROMPT` is a string injected as the system message in every AI call. Editing and saving this file triggers the watch mode to re-run automatically.

## Constraints

- Model: **llama3.1:8b** (Ollama local) — smaller model, needs very explicit instructions
- No fine-tuning — prompt is the only lever
- Output must be valid JSON parseable by `JSON.parse()` — format errors crash the pipeline
- The app is in Brazilian Portuguese — all extracted content must be in PT-BR
