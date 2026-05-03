/**
 * Quick one-shot test: fetch an Instagram URL and run AI extraction.
 * Usage: npm run eval:try --workspace=apps/api -- <instagram-url>
 *   OR:  npm run eval:try --workspace=apps/api -- --caption "your raw caption here"
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { aiProviderFactory } from "../../src/lib/ai/index.js";
import { instagramFetcher } from "../../src/lib/fetch-instagram.js";

const ROOT_ENV_PATH = path.resolve(process.cwd(), "../../.env");

const loadRootEnv = async () => {
  try {
    const raw = await readFile(ROOT_ENV_PATH, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sep = trimmed.indexOf("=");
      if (sep === -1) continue;
      const key = trimmed.slice(0, sep).trim();
      let value = trimmed.slice(sep + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // allow relying on shell env
  }
};

const main = async () => {
  await loadRootEnv();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage:");
    console.error("  npm run eval:try --workspace=apps/api -- <instagram-url>");
    console.error("  npm run eval:try --workspace=apps/api -- --caption \"your caption here\"");
    process.exit(1);
  }

  let description: string;
  let source: string;

  if (args[0] === "--caption") {
    const caption = args.slice(1).join(" ").trim();
    if (!caption) {
      console.error("Provide a caption after --caption");
      process.exit(1);
    }
    description = caption;
    source = "(caption provided directly)";
  } else if (args[0] === "--description-file") {
    const filePath = args[1];
    if (!filePath) {
      console.error("Provide a file path after --description-file");
      process.exit(1);
    }
    description = (await readFile(filePath, "utf8")).trim();
    source = "(from cached description file)";
  } else {
    const url = args[0]!;
    source = url;
    console.log(`Fetching: ${url}`);
    const igData = await instagramFetcher.fetchInstagramData(url);
    if (!igData.description?.trim()) {
      console.error("Could not fetch a description from that URL.");
      console.error("Try passing the caption directly with --caption \"...\"");
      process.exit(1);
    }
    description = igData.description.trim();
    console.log(`\nDescription (${description.length} chars):`);
    console.log("─".repeat(60));
    console.log(description.slice(0, 500) + (description.length > 500 ? "..." : ""));
    console.log("─".repeat(60));
  }

  const provider = aiProviderFactory.getAIProvider();
  console.log(`\nProvider: ${process.env.AI_PROVIDER ?? "anthropic"} / Model: ${process.env.AI_MODEL ?? "default"}`);
  console.log("Calling AI...\n");

  const start = Date.now();
  const extraction = await provider.extractRecipe(description);
  const elapsed = Date.now() - start;

  console.log(`Done in ${elapsed}ms`);
  console.log(`Input tokens: ${extraction.metadata.inputTokens ?? "n/a"} | Output tokens: ${extraction.metadata.outputTokens ?? "n/a"}`);
  console.log(`Source: ${source}`);
  console.log("\nExtracted result:");
  console.log("─".repeat(60));
  console.log(JSON.stringify(extraction.recipe, null, 2));
  console.log("─".repeat(60));
};

await main();
