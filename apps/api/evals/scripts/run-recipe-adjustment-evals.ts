import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { RecipeIngredient, RecipeRecord } from "@chefitu/shared";
import { aiProviderFactory } from "../../src/lib/ai/index.js";
import type { AdjustedRecipeFields } from "../../src/lib/ai/types.js";

// ─── Dataset types ────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string };

type Checks = {
  fieldsUnchanged?: string[];
  stepsUnchanged?: boolean;
  ingredientsUnchanged?: boolean;
  ingredientsMultipliedBy?: number;
  ingredientsToCheck?: string[];
  ingredientAmountReduced?: { item: string; mustBeLessThan: string };
  ingredientsOtherUnchanged?: string[];
  ingredientRemoved?: string;
  ingredientsOtherHalved?: string[];
  ingredientAddedOrSubstituted?: boolean;
  ingredientSubstituted?: { from: string; shouldContain: string };
  otherIngredientsUnchanged?: string[];
  atLeastOneIngredientChanged?: boolean;
  servingsHalved?: boolean;
  servingsDoubled?: boolean;
  judgePrompt?: string;
  note?: string;
};

type EvalCase = {
  id: string;
  description: string;
  request: string;
  history: ChatMessage[];
  baseRecipe: Omit<RecipeRecord, "id" | "importId" | "createdAt" | "updatedAt">;
  checks: Checks;
};

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

type CaseResult = {
  id: string;
  description: string;
  passed: boolean;
  checkResults: CheckResult[];
  request: string;
  baseRecipe: EvalCase["baseRecipe"];
  actual: AdjustedRecipeFields;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATASET_PATH = path.resolve(process.cwd(), "evals/datasets/recipe-adjustment.v1.json");
const RESULTS_DIR = path.resolve(process.cwd(), "evals/results");
const ROOT_ENV_PATH = path.resolve(process.cwd(), "../../.env");

const loadRootEnv = async () => {
  try {
    const raw = await readFile(ROOT_ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sepIdx = trimmed.indexOf("=");
      if (sepIdx === -1) continue;
      const key = trimmed.slice(0, sepIdx).trim();
      let value = trimmed.slice(sepIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
};

const normalize = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const findIngredient = (ingredients: RecipeIngredient[], itemName: string) => {
  const norm = normalize(itemName);
  return ingredients.find((i) => normalize(i.item).includes(norm) || norm.includes(normalize(i.item)));
};

const parseAmount = (amount: string | null | undefined): number | null => {
  if (!amount) return null;
  const cleaned = amount.replace(",", ".");
  if (cleaned.includes("/")) {
    const [num, den] = cleaned.split("/").map(Number);
    return num && den ? num / den : null;
  }
  return Number(cleaned) || null;
};

const callJudge = async (prompt: string): Promise<{ score: number; reason: string }> => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
  const raw = data.content.find((b) => b.type === "text")?.text ?? "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  try {
    return JSON.parse(raw.slice(start, end + 1)) as { score: number; reason: string };
  } catch {
    return { score: 0, reason: "parse error" };
  }
};

// ─── Check runners ────────────────────────────────────────────────────────────

const runChecks = async (
  checks: Checks,
  base: EvalCase["baseRecipe"],
  actual: AdjustedRecipeFields,
): Promise<CheckResult[]> => {
  const results: CheckResult[] = [];

  // Fields that should not change
  if (checks.fieldsUnchanged) {
    for (const field of checks.fieldsUnchanged) {
      const baseVal = JSON.stringify((base as Record<string, unknown>)[field] ?? null);
      const actualVal = JSON.stringify((actual as Record<string, unknown>)[field] ?? null);
      results.push({
        name: `field_unchanged:${field}`,
        passed: baseVal === actualVal,
        detail: baseVal === actualVal ? "ok" : `expected ${baseVal}, got ${actualVal}`,
      });
    }
  }

  // Steps should not change
  if (checks.stepsUnchanged) {
    const baseSteps = JSON.stringify(base.steps.map((s) => s.instruction));
    const actualSteps = JSON.stringify(actual.steps.map((s) => s.instruction));
    results.push({
      name: "steps_unchanged",
      passed: baseSteps === actualSteps,
      detail: baseSteps === actualSteps ? "ok" : "steps were modified unexpectedly",
    });
  }

  // All ingredients unchanged
  if (checks.ingredientsUnchanged) {
    const baseIng = JSON.stringify(base.ingredients.map((i) => ({ ...i })));
    const actualIng = JSON.stringify(actual.ingredients.map((i) => ({ ...i })));
    results.push({
      name: "ingredients_unchanged",
      passed: baseIng === actualIng,
      detail: baseIng === actualIng ? "ok" : "ingredients were modified unexpectedly",
    });
  }

  // Ingredients multiplied by a factor
  if (checks.ingredientsMultipliedBy !== undefined && checks.ingredientsToCheck) {
    const factor = checks.ingredientsMultipliedBy;
    for (const itemName of checks.ingredientsToCheck) {
      const baseIng = findIngredient(base.ingredients, itemName);
      const actualIng = findIngredient(actual.ingredients, itemName);

      if (!baseIng || !actualIng) {
        results.push({ name: `amount_multiplied:${itemName}`, passed: false, detail: `ingredient not found` });
        continue;
      }

      const baseAmt = parseAmount(baseIng.amount);
      const actualAmt = parseAmount(actualIng.amount);

      if (baseAmt === null || actualAmt === null) {
        results.push({ name: `amount_multiplied:${itemName}`, passed: true, detail: "non-numeric amount, skipped" });
        continue;
      }

      const expected = baseAmt * factor;
      const tolerance = 0.15;
      const passed = Math.abs(actualAmt - expected) / expected <= tolerance;
      results.push({
        name: `amount_multiplied:${itemName}`,
        passed,
        detail: passed ? `${baseAmt} × ${factor} ≈ ${actualAmt}` : `expected ≈${expected.toFixed(2)}, got ${actualAmt}`,
      });
    }
  }

  // Ingredient amount reduced
  if (checks.ingredientAmountReduced) {
    const { item, mustBeLessThan } = checks.ingredientAmountReduced;
    const actualIng = findIngredient(actual.ingredients, item);
    const baseIng = findIngredient(base.ingredients, item);
    if (!actualIng || !baseIng) {
      results.push({ name: `amount_reduced:${item}`, passed: false, detail: "ingredient not found in actual" });
    } else {
      const actualAmt = parseAmount(actualIng.amount);
      const baseAmt = parseAmount(baseIng.amount);
      const passed = actualAmt !== null && baseAmt !== null && actualAmt < baseAmt;
      results.push({
        name: `amount_reduced:${item}`,
        passed,
        detail: passed ? `${baseAmt} → ${actualAmt}` : `was ${baseAmt}, got ${actualAmt} (not reduced)`,
      });
    }
  }

  // Other ingredients unchanged
  for (const listKey of ["ingredientsOtherUnchanged", "otherIngredientsUnchanged"] as const) {
    if (checks[listKey]) {
      for (const itemName of checks[listKey]!) {
        const baseIng = findIngredient(base.ingredients, itemName);
        const actualIng = findIngredient(actual.ingredients, itemName);
        if (!baseIng || !actualIng) {
          results.push({ name: `other_unchanged:${itemName}`, passed: false, detail: "ingredient not found" });
          continue;
        }
        const sameAmt = baseIng.amount === actualIng.amount;
        const sameUnit = baseIng.unit === actualIng.unit;
        results.push({
          name: `other_unchanged:${itemName}`,
          passed: sameAmt && sameUnit,
          detail: sameAmt && sameUnit ? "ok" : `amount: ${baseIng.amount}→${actualIng.amount}, unit: ${baseIng.unit}→${actualIng.unit}`,
        });
      }
    }
  }

  // Ingredient removed
  if (checks.ingredientRemoved) {
    const found = findIngredient(actual.ingredients, checks.ingredientRemoved);
    results.push({
      name: `ingredient_removed:${checks.ingredientRemoved}`,
      passed: !found,
      detail: found ? `"${checks.ingredientRemoved}" still present` : "ok — ingredient removed",
    });
  }

  // Ingredient added or substituted (any new item appeared)
  if (checks.ingredientAddedOrSubstituted) {
    const baseItems = new Set(base.ingredients.map((i) => normalize(i.item)));
    const newItems = actual.ingredients.filter((i) => !baseItems.has(normalize(i.item)));
    results.push({
      name: "ingredient_substituted_or_added",
      passed: newItems.length > 0,
      detail: newItems.length > 0 ? `new items: ${newItems.map((i) => i.item).join(", ")}` : "no substitution found",
    });
  }

  // Specific ingredient substituted (original removed, something with keyword added)
  if (checks.ingredientSubstituted) {
    const { from, shouldContain } = checks.ingredientSubstituted;
    const originalRemoved = !findIngredient(actual.ingredients, from);
    const substitutionFound = actual.ingredients.some((i) =>
      normalize(i.item).includes(normalize(shouldContain)) ||
      normalize(from).includes(normalize(shouldContain)),
    );
    results.push({
      name: `substituted:${from}`,
      passed: originalRemoved || substitutionFound,
      detail: originalRemoved
        ? `"${from}" removed or renamed (substituted)`
        : `"${from}" still present with original name`,
    });
  }

  // At least one ingredient changed
  if (checks.atLeastOneIngredientChanged) {
    const baseIng = JSON.stringify(base.ingredients);
    const actualIng = JSON.stringify(actual.ingredients);
    results.push({
      name: "at_least_one_ingredient_changed",
      passed: baseIng !== actualIng,
      detail: baseIng !== actualIng ? "ok" : "ingredients identical to base — no change detected",
    });
  }

  // Servings halved
  if (checks.servingsHalved) {
    const baseNum = parseAmount(base.servings?.split(" ")[0] ?? null);
    const actualNum = parseAmount(actual.servings?.split(" ")[0] ?? null);
    const passed = baseNum !== null && actualNum !== null && Math.abs(actualNum - baseNum / 2) <= 0.5;
    results.push({
      name: "servings_halved",
      passed,
      detail: passed ? `${baseNum} → ${actualNum}` : `base=${baseNum}, actual=${actualNum} (expected ~${(baseNum ?? 0) / 2})`,
    });
  }

  // Servings doubled
  if (checks.servingsDoubled) {
    const baseNum = parseAmount(base.servings?.split(" ")[0] ?? null);
    const actualNum = parseAmount(actual.servings?.split(" ")[0] ?? null);
    const passed = baseNum !== null && actualNum !== null && Math.abs(actualNum - baseNum * 2) <= 1;
    results.push({
      name: "servings_doubled",
      passed,
      detail: passed ? `${baseNum} → ${actualNum}` : `base=${baseNum}, actual=${actualNum} (expected ~${(baseNum ?? 0) * 2})`,
    });
  }

  // LLM judge for open-ended checks
  if (checks.judgePrompt) {
    const prompt = `${checks.judgePrompt}

BASE RECIPE INGREDIENTS:
${base.ingredients.map((i) => `- ${i.item}: ${i.amount ?? ""} ${i.unit ?? ""}`).join("\n")}

ADJUSTED RECIPE INGREDIENTS:
${actual.ingredients.map((i) => `- ${i.item}: ${i.amount ?? ""} ${i.unit ?? ""}`).join("\n")}

Score from 0 to 1. Return ONLY valid JSON: {"score": 0.0, "reason": "string"}`;
    const { score, reason } = await callJudge(prompt);
    results.push({
      name: "llm_judge",
      passed: score >= 0.7,
      detail: `score=${score.toFixed(2)} — ${reason}`,
    });
  }

  return results;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  await loadRootEnv();

  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf8")) as EvalCase[];
  const provider = aiProviderFactory.getAIProvider();

  const caseResults: CaseResult[] = [];

  for (const evalCase of dataset) {
    console.log(`Running ${evalCase.id}...`);

    const recipeContext = {
      title: evalCase.baseRecipe.title,
      category: evalCase.baseRecipe.category,
      cuisine: evalCase.baseRecipe.cuisine,
      ingredients: evalCase.baseRecipe.ingredients,
      steps: evalCase.baseRecipe.steps,
      totalTimeMinutes: evalCase.baseRecipe.totalTimeMinutes,
      servings: evalCase.baseRecipe.servings,
      tags: evalCase.baseRecipe.tags,
    };

    const isFirstMessage = evalCase.history.length === 0;
    const userContent = isFirstMessage
      ? `Receita atual:\n${JSON.stringify(recipeContext, null, 2)}\n\nPedido: ${evalCase.request}`
      : evalCase.request;

    const messages: ChatMessage[] = [...evalCase.history, { role: "user", content: userContent }];

    let actual: AdjustedRecipeFields;
    try {
      ({ adjustedFields: actual } = await provider.adjustRecipe(messages));
    } catch (err) {
      console.error(`  ERROR on ${evalCase.id}:`, err);
      caseResults.push({
        id: evalCase.id,
        description: evalCase.description,
        passed: false,
        checkResults: [{ name: "ai_call", passed: false, detail: String(err) }],
        request: evalCase.request,
        baseRecipe: evalCase.baseRecipe,
        actual: {} as AdjustedRecipeFields,
      });
      continue;
    }

    const checkResults = await runChecks(evalCase.checks, evalCase.baseRecipe, actual);
    const passed = checkResults.every((c) => c.passed);

    console.log(`  ${passed ? "✓ PASS" : "✗ FAIL"} (${checkResults.filter((c) => c.passed).length}/${checkResults.length} checks)`);
    if (!passed) {
      for (const cr of checkResults.filter((c) => !c.passed)) {
        console.log(`    ✗ ${cr.name}: ${cr.detail}`);
      }
    }

    caseResults.push({
      id: evalCase.id,
      description: evalCase.description,
      passed,
      checkResults,
      request: evalCase.request,
      baseRecipe: evalCase.baseRecipe,
      actual,
    });
  }

  // ── Output ─────────────────────────────────────────────────────────────────

  const passedCount = caseResults.filter((r) => r.passed).length;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const providerName = process.env.AI_PROVIDER ?? "anthropic";
  const modelName = (process.env.AI_MODEL ?? "unknown").replace(/[^\w.-]/g, "_");

  const summary = {
    provider: providerName,
    model: modelName,
    dataset: "recipe-adjustment.v1.json",
    totalCases: caseResults.length,
    passedCases: passedCount,
    failedCases: caseResults.length - passedCount,
    results: caseResults,
  };

  await mkdir(RESULTS_DIR, { recursive: true });
  const outputPath = path.join(RESULTS_DIR, `${timestamp}-${providerName}-${modelName}-adjustment.json`);
  await writeFile(outputPath, JSON.stringify(summary, null, 2));

  const W = 54;
  console.log(`\n${"═".repeat(W)}`);
  console.log(`ADJUSTMENT EVALS — ${new Date().toLocaleString("pt-BR")}`);
  console.log(`Model: ${modelName}`);
  console.log("─".repeat(W));
  console.log(`PASS RATE: ${passedCount}/${caseResults.length} (${Math.round((passedCount / caseResults.length) * 100)}%)`);
  console.log("─".repeat(W));

  for (const r of caseResults) {
    const icon = r.passed ? "✓" : "✗";
    console.log(`${icon} ${r.id}`);
    if (!r.passed) {
      for (const cr of r.checkResults.filter((c) => !c.passed)) {
        console.log(`    ✗ ${cr.name}: ${cr.detail}`);
      }
    }
  }

  console.log("═".repeat(W));
  console.log(`Saved to: ${outputPath}\n`);
};

await main();
