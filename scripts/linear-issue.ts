#!/usr/bin/env tsx
/**
 * Linear issue helpers for Spec Writer (fallback when Linear MCP is unavailable).
 *
 * Usage:
 *   npm run linear:fetch -- CHE-8
 *   npm run linear:update -- CHE-8 --file .spec-work/CHE-8/spec.md
 *   npm run linear:comment -- CHE-8 --file .spec-work/CHE-8/comment.md
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const LINEAR_API_URL = "https://api.linear.app/graphql";

type Issue = {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
};

function getApiKey(): string {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.error("LINEAR_API_KEY is not set. Add it to .env or export it.");
    process.exit(1);
  }
  return key;
}

function parseIdentifier(raw: string): { teamKey: string; number: number } {
  const match = /^([A-Za-z]+)-(\d+)$/.exec(raw.trim());
  if (!match) {
    console.error(`Invalid identifier: ${raw}. Expected format: CHE-8`);
    process.exit(1);
  }
  return { teamKey: match[1].toUpperCase(), number: Number(match[2]) };
}

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--file" && argv[i + 1]) {
      args.file = argv[++i];
    } else if (!args.command && !arg.startsWith("-")) {
      args.command = arg;
    } else if (!args.identifier && !arg.startsWith("-")) {
      args.identifier = arg.toUpperCase();
    }
  }
  return args;
}

async function linearRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Linear API ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (data.errors?.length) {
    throw new Error(`Linear API error: ${data.errors.map((e) => e.message).join(", ")}`);
  }
  return data.data as T;
}

async function fetchIssue(identifier: string): Promise<Issue> {
  const { teamKey, number } = parseIdentifier(identifier);
  const data = await linearRequest<{ issues: { nodes: Issue[] } }>(
    `
    query($filter: IssueFilter) {
      issues(filter: $filter) {
        nodes { id identifier title description url }
      }
    }
    `,
    { filter: { number: { eq: number }, team: { key: { eq: teamKey } } } },
  );

  const issue = data.issues.nodes[0];
  if (!issue) {
    console.error(`Issue ${identifier} not found in Linear.`);
    process.exit(1);
  }
  return issue;
}

function extractUrls(text: string): string[] {
  const urls = new Set<string>();
  const markdownLink = /\]\((https?:\/\/[^)]+)\)/g;
  const plainUrl = /https?:\/\/[^\s)]+/g;
  let match: RegExpExecArray | null;
  while ((match = markdownLink.exec(text)) !== null) urls.add(match[1]);
  for (const url of text.match(plainUrl) ?? []) urls.add(url.replace(/[.,;]+$/, ""));
  return [...urls];
}

async function downloadAsset(url: string, destDir: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await response.arrayBuffer());
    const urlPath = new URL(url).pathname;
    let filename = basename(urlPath) || "attachment";

    if (contentType.includes("html") && !filename.endsWith(".html")) {
      filename = `${filename}.html`;
    }
    if (contentType.includes("image/png") && !filename.endsWith(".png")) {
      filename = `${filename}.png`;
    }

    const filePath = join(destDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  } catch {
    return null;
  }
}

async function cmdFetch(identifier: string): Promise<void> {
  const issue = await fetchIssue(identifier);
  const workDir = join(process.cwd(), ".spec-work", identifier);
  await mkdir(workDir, { recursive: true });

  const urls = extractUrls(issue.description ?? "");
  const downloaded: string[] = [];
  for (const url of urls) {
    const path = await downloadAsset(url, workDir);
    if (path) downloaded.push(path);
  }

  await writeFile(join(workDir, "issue.json"), JSON.stringify(issue, null, 2));
  await writeFile(join(workDir, "issue.md"), `# ${issue.identifier} — ${issue.title}\n\n${issue.description ?? ""}\n`);

  console.log(`Issue: ${issue.identifier} — ${issue.title}`);
  console.log(`URL: ${issue.url}`);
  console.log(`Saved to: ${workDir}`);
  if (downloaded.length) {
    console.log("Downloaded attachments:");
    for (const path of downloaded) console.log(`  - ${path}`);
  }
}

async function cmdUpdate(identifier: string, filePath: string): Promise<void> {
  const issue = await fetchIssue(identifier);
  const description = await readFile(filePath, "utf8");
  const data = await linearRequest<{ issueUpdate: { success: boolean } }>(
    `
    mutation($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) { success }
    }
    `,
    { id: issue.id, input: { description } },
  );

  if (data.issueUpdate.success) {
    console.log(`✓ Updated description for ${issue.identifier}`);
  } else {
    console.error(`✗ Failed to update ${issue.identifier}`);
    process.exit(1);
  }
}

async function cmdComment(identifier: string, filePath: string): Promise<void> {
  const issue = await fetchIssue(identifier);
  const body = await readFile(filePath, "utf8");
  const data = await linearRequest<{ commentCreate: { success: boolean } }>(
    `
    mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) { success }
    }
    `,
    { input: { issueId: issue.id, body } },
  );

  if (data.commentCreate.success) {
    console.log(`✓ Posted comment on ${issue.identifier}`);
  } else {
    console.error(`✗ Failed to post comment on ${issue.identifier}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { command, identifier, file } = parseArgs(process.argv.slice(2));

  if (!command || !identifier) {
    console.error("Usage:");
    console.error("  npm run linear:fetch -- CHE-8");
    console.error("  npm run linear:update -- CHE-8 --file path/to/spec.md");
    console.error("  npm run linear:comment -- CHE-8 --file path/to/comment.md");
    process.exit(1);
  }

  switch (command) {
    case "fetch":
      await cmdFetch(identifier);
      break;
    case "update":
      if (!file) {
        console.error("--file is required for update");
        process.exit(1);
      }
      await cmdUpdate(identifier, file);
      break;
    case "comment":
      if (!file) {
        console.error("--file is required for comment");
        process.exit(1);
      }
      await cmdComment(identifier, file);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
