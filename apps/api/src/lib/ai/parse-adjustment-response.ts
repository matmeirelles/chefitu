import type { AdjustedRecipeFields, AIAdjustmentResult, AIAdjustmentMetadata } from "./types.js";

type ParsedEnvelope = {
  type?: unknown;
  content?: unknown;
};

const stripMarkdownFences = (raw: string) =>
  raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

const extractJsonCandidate = (raw: string) => {
  const stripped = stripMarkdownFences(raw);
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  return start !== -1 && end !== -1 ? stripped.slice(start, end + 1) : stripped;
};

const decodeJsonStringLike = (value: string) =>
  value
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");

const extractMessageContentFallback = (jsonCandidate: string) => {
  if (!/"type"\s*:\s*"message"/.test(jsonCandidate)) return null;

  const contentMatch = jsonCandidate.match(/"content"\s*:\s*"([\s\S]*)"\s*}\s*$/);
  if (!contentMatch) return null;

  return decodeJsonStringLike(contentMatch[1] ?? "").trim();
};

const isAdjustedRecipeFields = (value: unknown): value is AdjustedRecipeFields => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    Array.isArray(candidate.ingredients) &&
    Array.isArray(candidate.steps) &&
    Array.isArray(candidate.tags)
  );
};

export const parseAdjustmentResponse = (
  raw: string,
  metadata: AIAdjustmentMetadata,
): AIAdjustmentResult => {
  const text = raw.trim();
  const jsonCandidate = extractJsonCandidate(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    const fallbackMessage = extractMessageContentFallback(jsonCandidate);
    if (fallbackMessage) {
      return { kind: "message", message: fallbackMessage, metadata };
    }
    return { kind: "message", message: text, metadata };
  }

  if (isAdjustedRecipeFields(parsed)) {
    return { kind: "adjustment", adjustedFields: parsed, metadata };
  }

  const envelope = parsed as ParsedEnvelope;

  if (envelope.type === "adjustment" && isAdjustedRecipeFields(envelope.content)) {
    return { kind: "adjustment", adjustedFields: envelope.content, metadata };
  }

  if (envelope.type === "message") {
    return {
      kind: "message",
      message: typeof envelope.content === "string" ? envelope.content : text,
      metadata,
    };
  }

  return { kind: "message", message: text, metadata };
};
