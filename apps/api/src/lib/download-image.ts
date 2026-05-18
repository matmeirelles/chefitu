import { createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = join(process.cwd(), "uploads", "images");

// Ensure directory exists at module load
mkdirSync(UPLOADS_DIR, { recursive: true });

export async function downloadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MyRecipesBot/1.0)" },
    });

    if (!response.ok || !response.body) return null;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(UPLOADS_DIR, filename);

    await pipeline(Readable.fromWeb(response.body as import("stream/web").ReadableStream), createWriteStream(filePath));

    return `/uploads/images/${filename}`;
  } catch {
    return null;
  }
}
