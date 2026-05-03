import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { RecipeIngredient, RecipeStep } from "@my-recipes/shared";
import { aiProviderFactory } from "../../src/lib/ai/index.js";
import type { ExtractedRecipe } from "../../src/lib/ai/types.js";
import { instagramFetcher } from "../../src/lib/fetch-instagram.js";

type StructuredExtractedRecipe = Exclude<ExtractedRecipe, { noRecipe: true }>;

type EvalCase = {
  id: string;
  sourceUrl: string;
  description?: string | null;
  expected: ExtractedRecipe;
};

type FieldResult = {
  passed: boolean;
  score: number;
  expected: unknown;
  actual: unknown;
};

type IngredientsFieldResult = FieldResult & {
  subScores: {
    item_count_match: boolean;
    name_recall: number;
    name_precision: number;
    qty_unit_accuracy: number;
  };
};

type StepsFieldResult = FieldResult & {
  jaccard: number;
  judgeReason?: string;
};

type CaseResult = {
  id: string;
  sourceUrl: string;
  passed: boolean;
  fieldResults: Record<string, FieldResult>;
  expected: ExtractedRecipe;
  actual: ExtractedRecipe;
  resolvedDescription: string;
};

const DATASET_PATH = path.resolve(
  process.cwd(),
  "evals/datasets/recipe-extraction.v1.json",
);

const RESULTS_DIR = path.resolve(process.cwd(), "evals/results");
const ROOT_ENV_PATH = path.resolve(process.cwd(), "../../.env");

const loadRootEnv = async () => {
  try {
    const raw = await readFile(ROOT_ENV_PATH, "utf8");

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env and allow the script to rely on the current shell environment.
  }
};

const normalizeText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const comparePrimitive = (expected: unknown, actual: unknown): boolean => {
  if (typeof expected === "string" || typeof actual === "string") {
    return normalizeText(String(expected ?? "")) === normalizeText(String(actual ?? ""));
  }

  return JSON.stringify(expected ?? null) === JSON.stringify(actual ?? null);
};

const tokenize = (text: string | null | undefined): Set<string> => {
  const normalized = normalizeText(text);
  if (!normalized) return new Set();
  return new Set(normalized.split(" ").filter(Boolean));
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
};

const normalizeIngredients = (ingredients: RecipeIngredient[] | undefined) =>
  (ingredients ?? []).map((ingredient) => ({
    amount: normalizeText(ingredient.amount),
    unit: normalizeText(ingredient.unit),
    item: normalizeText(ingredient.item),
  }));

const normalizeSteps = (steps: RecipeStep[] | undefined) =>
  (steps ?? []).map((step) => ({
    order: step.order,
    title: normalizeText(step.title),
    instruction: normalizeText(step.instruction),
  }));

const normalizeTags = (tags: string[] | undefined) =>
  [...(tags ?? [])].map((tag) => normalizeText(tag)).sort();

const isStructuredRecipe = (
  recipe: ExtractedRecipe,
): recipe is StructuredExtractedRecipe => recipe.noRecipe !== true;

const compareIngredients = (
  expected: RecipeIngredient[],
  actual: RecipeIngredient[],
): IngredientsFieldResult => {
  const normExpected = normalizeIngredients(expected);
  const normActual = normalizeIngredients(actual);

  const item_count_match = normExpected.length === normActual.length;

  const MATCH_THRESHOLD = 0.5;

  const findBestMatch = (
    item: string | null,
    candidates: typeof normActual,
  ): number => {
    if (!item) return 0;
    const tokens = tokenize(item);
    let best = 0;
    for (const c of candidates) {
      const sim = jaccardSimilarity(tokens, tokenize(c.item));
      if (sim > best) best = sim;
    }
    return best;
  };

  const matchedExpected: Array<{ exp: (typeof normExpected)[number]; act: (typeof normActual)[number] }> = [];

  for (const exp of normExpected) {
    const tokens = tokenize(exp.item);
    let bestSim = 0;
    let bestAct = normActual[0];
    for (const act of normActual) {
      const sim = jaccardSimilarity(tokens, tokenize(act.item));
      if (sim > bestSim) {
        bestSim = sim;
        bestAct = act;
      }
    }
    if (bestSim >= MATCH_THRESHOLD && bestAct) {
      matchedExpected.push({ exp, act: bestAct });
    }
  }

  const name_recall =
    normExpected.length === 0
      ? 1
      : normExpected.filter((e) => findBestMatch(e.item, normActual) >= MATCH_THRESHOLD).length /
        normExpected.length;

  const name_precision =
    normActual.length === 0
      ? 1
      : normActual.filter((a) => findBestMatch(a.item, normExpected) >= MATCH_THRESHOLD).length /
        normActual.length;

  const qty_unit_accuracy =
    matchedExpected.length === 0
      ? 1
      : matchedExpected.filter(
          ({ exp, act }) => exp.amount === act.amount && exp.unit === act.unit,
        ).length / matchedExpected.length;

  const score =
    ((item_count_match ? 1 : 0) + name_recall + name_precision + qty_unit_accuracy) / 4;

  return {
    passed: score >= 0.75,
    score,
    expected,
    actual,
    subScores: { item_count_match, name_recall, name_precision, qty_unit_accuracy },
  };
};

const judgeSteps = async (
  expected: RecipeStep[],
  actual: RecipeStep[],
  jaccardScore: number,
): Promise<StepsFieldResult> => {
  const formatStepsForJudge = (steps: RecipeStep[]) =>
    steps.map((s) => `${s.order}. [${s.title}] ${s.instruction}`).join("\n");

  const prompt = `You are evaluating whether two sets of cooking steps describe the same procedure.

EXPECTED STEPS:
${formatStepsForJudge(expected)}

ACTUAL STEPS:
${formatStepsForJudge(actual)}

Score the semantic equivalence from 0 to 1:
- 1.0: same actions, same order, same key details
- 0.8: same actions, minor omissions or reordering
- 0.5: partially equivalent, some steps missing or wrong
- 0.0: completely different

Return ONLY valid JSON, no markdown: {"score": 0.0, "reason": "string"}`;

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

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const raw = data.content.find((b) => b.type === "text")?.text ?? "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const text = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : '{"score": 0, "reason": "parse error"}';

  let score = 0;
  let reason = "";

  try {
    const parsed = JSON.parse(text) as { score: number; reason: string };
    score = parsed.score;
    reason = parsed.reason;
  } catch {
    score = 0;
    reason = "Failed to parse judge response";
  }

  return {
    passed: score >= 0.8,
    score,
    jaccard: jaccardScore,
    judgeReason: reason,
    expected,
    actual,
  };
};

const compareSteps = async (
  expected: RecipeStep[],
  actual: RecipeStep[],
): Promise<StepsFieldResult> => {
  const expectedText = normalizeSteps(expected)
    .map((s) => s.instruction ?? "")
    .join(" ");
  const actualText = normalizeSteps(actual)
    .map((s) => s.instruction ?? "")
    .join(" ");
  const jaccardScore = jaccardSimilarity(tokenize(expectedText), tokenize(actualText));

  if (jaccardScore >= 0.8) {
    return { passed: true, score: jaccardScore, jaccard: jaccardScore, expected, actual };
  }

  return judgeSteps(expected, actual, jaccardScore);
};

const compareNumericField = (
  expected: number | null | undefined,
  actual: number | null | undefined,
): FieldResult => {
  const exp = expected ?? null;
  const act = actual ?? null;
  if (exp === null) {
    const passed = act === null;
    return { passed, score: passed ? 1 : 0, expected: exp, actual: act };
  }
  if (act === null) {
    return { passed: false, score: 0, expected: exp, actual: act };
  }
  const error = Math.abs(act - exp) / exp;
  const score = Math.max(0, 1 - error);
  return { passed: error <= 0.2, score, expected: exp, actual: act };
};

const compareServings = (
  expected: string | null | undefined,
  actual: string | null | undefined,
): FieldResult => {
  const exp = expected ?? null;
  const act = actual ?? null;
  const expNum = exp !== null ? parseInt(exp, 10) : NaN;
  const actNum = act !== null ? parseInt(act, 10) : NaN;
  if (!isNaN(expNum) && !isNaN(actNum)) {
    return compareNumericField(expNum, actNum);
  }
  const passed = comparePrimitive(exp, act);
  return { passed, score: passed ? 1 : 0, expected: exp, actual: act };
};

const compareTags = (
  expected: string[] | undefined,
  actual: string[] | undefined,
): FieldResult => {
  const expSet = new Set(normalizeTags(expected).filter(Boolean) as string[]);
  const actSet = new Set(normalizeTags(actual).filter(Boolean) as string[]);
  const score = jaccardSimilarity(expSet, actSet);
  return { passed: score >= 0.75, score, expected, actual };
};

const compareTitle = (expected: string, actual: string): FieldResult => {
  const score = jaccardSimilarity(tokenize(expected), tokenize(actual));
  return { passed: score >= 0.8, score, expected, actual };
};

const compareRecipe = async (
  expected: ExtractedRecipe,
  actual: ExtractedRecipe,
): Promise<Record<string, FieldResult>> => {
  const noRecipePassed = comparePrimitive(expected.noRecipe ?? false, actual.noRecipe ?? false);
  const fieldResults: Record<string, FieldResult> = {
    noRecipe: {
      passed: noRecipePassed,
      score: noRecipePassed ? 1 : 0,
      expected: expected.noRecipe ?? false,
      actual: actual.noRecipe ?? false,
    },
  };

  if (actual.noRecipe === true) {
    return fieldResults;
  }

  if (!isStructuredRecipe(expected) || !isStructuredRecipe(actual)) {
    return fieldResults;
  }

  fieldResults.title = compareTitle(expected.title, actual.title);

  const categoryPassed = comparePrimitive(expected.category ?? null, actual.category ?? null);
  fieldResults.category = {
    passed: categoryPassed,
    score: categoryPassed ? 1 : 0,
    expected: expected.category ?? null,
    actual: actual.category ?? null,
  };

  const cuisinePassed = comparePrimitive(expected.cuisine ?? null, actual.cuisine ?? null);
  fieldResults.cuisine = {
    passed: cuisinePassed,
    score: cuisinePassed ? 1 : 0,
    expected: expected.cuisine ?? null,
    actual: actual.cuisine ?? null,
  };

  fieldResults.ingredients = compareIngredients(expected.ingredients, actual.ingredients);
  fieldResults.steps = await compareSteps(expected.steps, actual.steps);
  fieldResults.totalTimeMinutes = compareNumericField(expected.totalTimeMinutes, actual.totalTimeMinutes);
  fieldResults.servings = compareServings(expected.servings, actual.servings);
  fieldResults.tags = compareTags(expected.tags, actual.tags);

  return fieldResults;
};

const resolveDescription = async (evalCase: EvalCase): Promise<string> => {
  if (evalCase.description?.trim()) {
    return evalCase.description.trim();
  }

  const instagramData = await instagramFetcher.fetchInstagramData(evalCase.sourceUrl);

  if (!instagramData.description?.trim()) {
    throw new Error(
      `Could not fetch a usable description for case "${evalCase.id}" from ${evalCase.sourceUrl}`,
    );
  }

  return instagramData.description.trim();
};

const main = async () => {
  await loadRootEnv();

  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf8")) as EvalCase[];
  const provider = aiProviderFactory.getAIProvider();

  const results: CaseResult[] = [];

  for (const evalCase of dataset) {
    console.log(`Running ${evalCase.id}...`);
    const resolvedDescription = await resolveDescription(evalCase);
    console.log(`- fetched description for ${evalCase.id}`);
    const extraction = await provider.extractRecipe(resolvedDescription);
    console.log(`- model response received for ${evalCase.id}`);
    const fieldResults = await compareRecipe(evalCase.expected, extraction.recipe);
    const passed = Object.values(fieldResults).every((field) => field.passed);

    results.push({
      id: evalCase.id,
      sourceUrl: evalCase.sourceUrl,
      passed,
      fieldResults,
      expected: evalCase.expected,
      actual: extraction.recipe,
      resolvedDescription,
    });
  }

  const passedCount = results.filter((result) => result.passed).length;
  const failed = results.filter((result) => !result.passed);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const providerName = process.env.AI_PROVIDER ?? "anthropic";
  const modelName = (process.env.AI_MODEL ?? "unknown-model").replace(/[^\w.-]/g, "_");

  const summary = {
    provider: providerName,
    model: modelName,
    dataset: path.basename(DATASET_PATH),
    totalCases: results.length,
    passedCases: passedCount,
    failedCases: failed.length,
    results,
  };

  await mkdir(RESULTS_DIR, { recursive: true });

  const outputPath = path.join(
    RESULTS_DIR,
    `${timestamp}-${providerName}-${modelName}.json`,
  );

  await writeFile(outputPath, JSON.stringify(summary, null, 2));

  // ── Console output ────────────────────────────────────────────────────────

  const W = 54;
  const LINE = "═".repeat(W);
  const DIV = "─".repeat(W);
  const ts = new Date().toLocaleString("pt-BR");

  const avgScore = (field: string): number => {
    const scores = results
      .map((r) => r.fieldResults[field]?.score)
      .filter((s): s is number => s !== undefined);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const fmt2 = (n: number) => n.toFixed(2);
  const icon = (score: number) => (score >= 0.75 ? "✓" : "⚠");
  const lpad = (s: string, w: number) => s.padEnd(w);

  console.log(`\n${LINE}`);
  console.log(`EVAL RESULTS — ${ts}`);
  console.log(`Dataset: ${path.basename(DATASET_PATH)} | Model: ${modelName}`);
  console.log(LINE);
  const overallAvgScore = results.reduce((sum, r) => {
    const scores = Object.values(r.fieldResults).map((f) => f.score);
    return sum + scores.reduce((a, b) => a + b, 0) / scores.length;
  }, 0) / results.length;

  console.log(`OVERALL PASS RATE: ${passedCount}/${results.length} (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log(`OVERALL AVG SCORE: ${fmt2(overallAvgScore)}`);
  console.log(DIV);
  console.log("SCORES BY FIELD (avg across all cases)");
  console.log(DIV);

  const withRecipeCount = results.filter((r) => isStructuredRecipe(r.actual)).length;
  const noRecipeCount = results.length - withRecipeCount;

  const binaryFields = ["noRecipe", "category", "cuisine"] as const;
  for (const f of binaryFields) {
    const relevant = results.filter((r) => r.fieldResults[f] !== undefined);
    const n = relevant.filter((r) => r.fieldResults[f]?.passed).length;
    const total = relevant.length;
    const pct = total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";
    console.log(`${lpad(f, 20)} ${n}/${total}    (${pct}%)`);
    if (f === "noRecipe") {
      console.log(`  com receita: ${withRecipeCount} | sem receita: ${noRecipeCount}`);
    }
  }

  const scoreFields = ["title", "steps", "totalTimeMinutes", "servings", "tags"] as const;
  for (const f of scoreFields) {
    const relevantCount = results.filter((r) => r.fieldResults[f] !== undefined).length;
    const score = avgScore(f);
    console.log(`${lpad(f, 20)} ${fmt2(score)}   ${icon(score)}   (${relevantCount}/${results.length} casos)`);
  }

  // Ingredients breakdown
  const ingScores = results
    .map((r) => r.fieldResults.ingredients as IngredientsFieldResult | undefined)
    .filter((f): f is IngredientsFieldResult => f !== undefined);

  if (ingScores.length > 0) {
    const avg = (fn: (f: IngredientsFieldResult) => number) =>
      ingScores.reduce((a, f) => a + fn(f), 0) / ingScores.length;

    const ingScore = avg((f) => f.score);
    console.log(`${"ingredients".padEnd(20)} ${fmt2(ingScore)}   ${icon(ingScore)}   (${ingScores.length}/${results.length} casos)`);
    console.log(`  ${"item_count".padEnd(18)} ${fmt2(avg((f) => (f.subScores.item_count_match ? 1 : 0)))}`);
    console.log(`  ${"name_recall".padEnd(18)} ${fmt2(avg((f) => f.subScores.name_recall))}`);
    console.log(`  ${"name_precision".padEnd(18)} ${fmt2(avg((f) => f.subScores.name_precision))}`);
    console.log(`  ${"qty_accuracy".padEnd(18)} ${fmt2(avg((f) => f.subScores.qty_unit_accuracy))}`);
  }

  if (failed.length > 0) {
    console.log(DIV);
    console.log(`FAILED CASES (${failed.length} failure${failed.length > 1 ? "s" : ""})`);
    console.log(DIV);
    for (const result of failed) {
      const failedFields = Object.entries(result.fieldResults)
        .filter(([, f]) => !f.passed)
        .map(([name, f]) => `${name}(${fmt2(f.score)})`);
      console.log(`[FAIL] ${result.id}`);
      console.log(`       ${failedFields.join(", ")}`);
    }

    console.log(DIV);
    console.log("FAILED CASES DETAIL");
    console.log(DIV);

    const formatArray = (arr: unknown): string => {
      if (!Array.isArray(arr)) return String(arr ?? "null");
      return `[${arr.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))).join(", ")}]`;
    };

    const formatSteps = (steps: unknown): string => {
      if (!Array.isArray(steps)) return String(steps ?? "null");
      return steps
        .map((s) => {
          const step = s as { order?: number; title?: string; instruction?: string };
          return `${step.order ?? "?"}. ${step.title ? `[${step.title}] ` : ""}${step.instruction ?? ""}`;
        })
        .join("\n      ");
    };

    for (const result of failed) {
      console.log(`[FAIL] ${result.id}`);
      for (const [field, fr] of Object.entries(result.fieldResults)) {
        if (fr.passed) continue;

        if (field === "steps") {
          const stepsFr = fr as StepsFieldResult;
          console.log(`  ${field}`);
          console.log(`    score    : ${Math.round(fr.score * 100)}%`);
          console.log(`    jaccard  : ${fmt2(stepsFr.jaccard)}`);
          if (stepsFr.judgeReason) {
            console.log(`    judge    : ${stepsFr.judgeReason}`);
          }
          console.log(`    expected :\n      ${formatSteps(fr.expected)}`);
          console.log(`    actual   :\n      ${formatSteps(fr.actual)}`);
        } else if (field === "ingredients") {
          const ingFr = fr as IngredientsFieldResult;
          const expIng = (ingFr.expected as RecipeIngredient[]) ?? [];
          const actIng = (ingFr.actual as RecipeIngredient[]) ?? [];
          console.log(`  ${field}`);
          console.log(`    score    : ${fmt2(ingFr.score)}`);
          console.log(`    item_count_match : ${ingFr.subScores.item_count_match} (expected ${expIng.length}, actual ${actIng.length})`);
          console.log(`    name_recall      : ${fmt2(ingFr.subScores.name_recall)}`);
          console.log(`    name_precision   : ${fmt2(ingFr.subScores.name_precision)}`);
          console.log(`    qty_accuracy     : ${fmt2(ingFr.subScores.qty_unit_accuracy)}`);
          console.log(`    expected items   : [${expIng.map((i) => i.item).join(", ")}]`);
          console.log(`    actual items     : [${actIng.map((i) => i.item).join(", ")}]`);
        } else if (Array.isArray(fr.expected) || Array.isArray(fr.actual)) {
          console.log(`  ${field}`);
          if (field === "tags") {
            console.log(`    score    : ${Math.round(fr.score * 100)}%`);
          }
          console.log(`    expected : ${formatArray(fr.expected)}`);
          console.log(`    actual   : ${formatArray(fr.actual)}`);
        } else {
          console.log(`  ${field}`);
          if (field === "title") {
            console.log(`    score    : ${Math.round(fr.score * 100)}%`);
          }
          console.log(`    expected : ${fr.expected ?? "null"}`);
          console.log(`    actual   : ${fr.actual ?? "null"}`);
          if ((field === "category" || field === "cuisine") && fr.actual === "Outro") {
            const suggestionKey = field === "category" ? "categorySuggestion" : "cuisineSuggestion";
            const actual = result.actual as Record<string, unknown>;
            const suggestion = actual[suggestionKey];
            if (suggestion) console.log(`    suggestion : ${suggestion}`);
          }
        }
      }
      console.log("");
    }
  }

  console.log(LINE);
  console.log(`Saved results to: ${outputPath}\n`);
};

await main();
