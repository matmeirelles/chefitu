# AI Evals

This document explains how recipe extraction evals work in My Recipes.

## Why We Need Evals

The recipe extraction pipeline is one of the highest-risk parts of the product.

We need evals to answer questions like:

- Did the model correctly detect whether a recipe exists in the caption?
- Did the model extract ingredients and steps correctly?
- Did the model hallucinate fields that were not present?
- Did a prompt or model change improve or degrade quality?

## How Evals Work

We run evals with a separate script.

The flow is:

1. Load a dataset of test cases
2. For each case, call the same AI extraction interface used in production
3. Compare the model output against the expected output
4. Print a summary report
5. Save a JSON result file for later comparison

This is intentionally separate from the normal app flow.

## Where The Files Live

```txt
apps/api/evals/
  datasets/
    recipe-extraction.v1.json
  results/
    2026-04-30T12-00-00-000Z-ollama-llama3.1-8b.json
  scripts/
    run-recipe-extraction-evals.ts
```

## How To Run

From the project root:

```bash
npm run eval:recipes --workspace=apps/api
```

The script will:

- read the dataset
- call the current provider from `.env`
- compare expected vs actual output
- print a summary
- save a result file in `apps/api/evals/results`

## What Format The Dataset Uses

The dataset is a JSON array.

Each item represents one Instagram post to evaluate.

Each case must contain:

- `id`
- `sourceUrl`
- `expected`

Optional:

- `description`

The expected object can be:

- a structured recipe
- or `{ "noRecipe": true }`

## Example Dataset With 5 Evals

Below is a realistic example of what the dataset looks like.

```json
[
  {
    "id": "case_001_banana_pancakes",
    "sourceUrl": "https://www.instagram.com/p/example-001",
    "expected": {
      "noRecipe": false,
      "title": "Panqueca de banana",
      "category": "Breakfast",
      "cuisine": "Outro",
      "ingredients": [
        { "amount": "2", "unit": "unidade", "item": "ovos" },
        { "amount": "1", "unit": "unidade", "item": "banana madura" },
        { "amount": "1/2", "unit": "xicara", "item": "aveia" }
      ],
      "steps": [
        { "order": 1, "title": "Bater os ingredientes", "instruction": "Bata tudo no liquidificador." },
        { "order": 2, "title": "Grelhar a panqueca", "instruction": "Grelhe em frigideira antiaderente por 2 minutos de cada lado." }
      ],
      "prepTimeMinutes": null,
      "cookTimeMinutes": 4,
      "totalTimeMinutes": 4,
      "servings": "2 porcoes",
      "tags": ["Rapido", "Cafe da manha"]
    }
  },
  {
    "id": "case_002_brownie",
    "sourceUrl": "https://www.instagram.com/p/example-002",
    "expected": {
      "noRecipe": false,
      "title": "Brownie facil",
      "category": "Dessert",
      "cuisine": "Outro",
      "ingredients": [
        { "amount": "200", "unit": "g", "item": "chocolate meio amargo" },
        { "amount": "100", "unit": "g", "item": "manteiga" },
        { "amount": "2", "unit": "unidade", "item": "ovos" },
        { "amount": "1", "unit": "xicara", "item": "acucar" },
        { "amount": "1/2", "unit": "xicara", "item": "farinha" }
      ],
      "steps": [
        { "order": 1, "title": "Derreter a base", "instruction": "Derreta o chocolate com a manteiga." },
        { "order": 2, "title": "Misturar os ingredientes", "instruction": "Misture os demais ingredientes." },
        { "order": 3, "title": "Assar o brownie", "instruction": "Asse por 25 minutos." }
      ],
      "prepTimeMinutes": null,
      "cookTimeMinutes": 25,
      "totalTimeMinutes": 25,
      "servings": "8 fatias",
      "tags": ["Doce", "Facil"]
    }
  },
  {
    "id": "case_003_no_recipe_video_only",
    "sourceUrl": "https://www.instagram.com/p/example-003",
    "expected": {
      "noRecipe": true
    }
  },
  {
    "id": "case_004_caesar_salad",
    "sourceUrl": "https://www.instagram.com/p/example-004",
    "expected": {
      "noRecipe": false,
      "title": "Caesar salad com frango",
      "category": "Main",
      "cuisine": "Outro",
      "ingredients": [
        { "item": "alface romana" },
        { "item": "frango grelhado em cubos" },
        { "item": "parmesao" },
        { "item": "croutons" },
        { "item": "molho caesar" }
      ],
      "steps": [
        { "order": 1, "title": "Grelhar o frango", "instruction": "Grelhe o frango." },
        { "order": 2, "title": "Montar a salada", "instruction": "Monte a salada." },
        { "order": 3, "title": "Finalizar", "instruction": "Finalize com parmesao." }
      ],
      "prepTimeMinutes": null,
      "cookTimeMinutes": null,
      "totalTimeMinutes": null,
      "servings": "2 porcoes",
      "tags": ["Leve", "Salada"]
    }
  },
  {
    "id": "case_005_ambiguous_caption",
    "sourceUrl": "https://www.instagram.com/p/example-005",
    "expected": {
      "noRecipe": true
    }
  }
]
```

## Practical Rules For Filling The Dataset

When creating new cases:

- do not complete missing information by hand
- if the caption does not clearly contain a recipe, prefer `noRecipe: true`
- keep expected output as close as possible to what the app should save

Recommended workflow:

- add `id`
- add the Instagram `sourceUrl`
- fill the `expected` object

Use `description` only if:

- you want to freeze a caption snapshot for debugging
- the original post may disappear later
- you want to compare the same exact caption across model versions

Important:

The dataset is not a place to write your ideal recipe.
It is a place to describe what the model should reasonably extract from that post.

## What The Eval Script Compares

The first version of the script compares:

- `noRecipe`
- `title`
- `category`
- `cuisine`
- `ingredients`
- `steps`
- `prepTimeMinutes`
- `cookTimeMinutes`
- `totalTimeMinutes`
- `servings`
- `tags`

The comparison is intentionally simple and deterministic.

It normalizes text before comparing, so:

- letter case differences are ignored
- repeated spaces are ignored
- small punctuation differences are ignored

## How Pass/Fail Works

Current rule:

- `noRecipe` must match exactly
- if a recipe exists, each field is checked individually
- a case passes only if all compared fields pass

This is strict by design for the first version.

Later, we can relax some comparisons if needed, especially for:

- title wording variation
- tags
- category or cuisine borderline cases

## Output Of The Eval Script

The script prints a summary like:

```txt
Recipe Extraction Evals
Provider: ollama
Model: llama3.1:8b
Dataset: recipe-extraction.v1.json

Total cases: 5
Passed: 4
Failed: 1
```

It also saves a JSON file with:

- run metadata
- pass/fail per case
- field-level comparison details
- raw model output

## Recommended Next Steps

After this first version is in place:

1. Add more real examples from your own usage
2. Separate the dataset into:
- core regression cases
- exploratory cases
3. Add a small script to compare one eval run against another

<!--
Eval best practices example:

1. Freeze a small benchmark set before changing prompt or model.
2. Keep hallucination tracking separate from extraction misses.
3. Prefer real user-like examples over synthetic clean examples.
4. Store run metadata with provider, model, date, and dataset version.
5. Review failures by category instead of only looking at one score.
-->
