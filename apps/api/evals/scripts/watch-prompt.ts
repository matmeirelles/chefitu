/**
 * Prompt iteration loop: edit prompt.ts → save → see new result automatically.
 *
 * Usage:
 *   npm run eval:watch --workspace=apps/api -- <instagram-url>
 *   npm run eval:watch --workspace=apps/api -- --caption "your caption here"
 *
 * How it works:
 *   1. Fetches (or receives) the description once and caches it.
 *   2. Runs the AI extraction immediately.
 *   3. Watches prompt.ts for changes.
 *   4. Every time you save prompt.ts, re-runs the extraction from scratch
 *      (spawns a fresh process so the updated prompt is always used).
 */
import { readFile, writeFile, unlink } from "node:fs/promises";
import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { instagramFetcher } from "../../src/lib/fetch-instagram.js";

const ROOT_ENV_PATH = path.resolve(process.cwd(), "../../.env");
const PROMPT_PATH = path.resolve(process.cwd(), "src/lib/ai/prompt.ts");
const TRY_URL_SCRIPT = path.resolve(process.cwd(), "evals/scripts/try-url.ts");
const TEMP_DESC_FILE = path.join(tmpdir(), "my-recipes-eval-desc.txt");

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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // allow relying on shell env
  }
};

const printHeader = (label: string) => {
  const time = new Date().toLocaleTimeString("pt-BR");
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`${label}  [${time}]`);
  console.log(`${line}\n`);
};

let activeProc: ReturnType<typeof spawn> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let runCount = 0;

const runExtraction = () => {
  // Kill any previous run still in progress
  if (activeProc) {
    activeProc.kill();
    activeProc = null;
  }

  runCount += 1;
  const label = runCount === 1 ? "Initial run" : `Re-run #${runCount - 1} — prompt changed`;
  printHeader(label);

  const proc = spawn(
    process.execPath,
    ["--import", "tsx", TRY_URL_SCRIPT, "--description-file", TEMP_DESC_FILE],
    { stdio: "inherit" },
  );

  activeProc = proc;

  proc.on("close", (code) => {
    activeProc = null;
    if (code !== null) {
      console.log(`\n${"─".repeat(60)}`);
      console.log(`Watching prompt.ts for changes... (Ctrl+C to quit)`);
    }
  });
};

const scheduleRun = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  // 400 ms debounce — editors often write the file twice on save
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runExtraction();
  }, 400);
};

const main = async () => {
  await loadRootEnv();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage:");
    console.error("  npm run eval:watch --workspace=apps/api -- <instagram-url>");
    console.error('  npm run eval:watch --workspace=apps/api -- --caption "caption"');
    process.exit(1);
  }

  let description: string;

  if (args[0] === "--caption") {
    description = args.slice(1).join(" ").trim();
    if (!description) {
      console.error("Provide a caption after --caption");
      process.exit(1);
    }
  } else {
    const url = args[0]!;
    console.log(`Fetching description from: ${url}`);
    const igData = await instagramFetcher.fetchInstagramData(url);
    if (!igData.description?.trim()) {
      console.error(
        'Could not fetch description from that URL.\nTry: --caption "your caption here"',
      );
      process.exit(1);
    }
    description = igData.description.trim();
    console.log(`Description fetched (${description.length} chars) — cached for re-runs.\n`);
  }

  // Cache description to temp file so subprocesses can read it
  await writeFile(TEMP_DESC_FILE, description, "utf8");

  // Clean up temp file on exit
  const cleanup = async () => {
    try {
      await unlink(TEMP_DESC_FILE);
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void cleanup());
  process.on("SIGTERM", () => void cleanup());

  // Run immediately
  runExtraction();

  // Watch the prompt file's parent directory — more reliable than watching the
  // file directly because VS Code uses atomic rename-on-save writes.
  const promptDir = path.dirname(PROMPT_PATH);
  const promptFile = path.basename(PROMPT_PATH);

  watch(promptDir, (_, filename) => {
    if (filename === promptFile) {
      scheduleRun();
    }
  });
};

await main();
