import type { FastifyInstance } from "fastify";
import { db } from "../../lib/db.js";
import { downloadImage } from "../../lib/download-image.js";

const ALLOWED_HOSTS = [
  "scontent.cdninstagram.com",
  "cdninstagram.com",
  "images.unsplash.com",
  "unsplash.com",
];

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export const registerImageProxyRoute = async (app: FastifyInstance) => {
  app.get<{ Querystring: { url: string } }>("/proxy", async (request, reply) => {
    const { url } = request.query;

    if (!url || !isAllowedHost(url)) {
      return reply.code(400).send({ message: "Invalid or disallowed image URL." });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          // No Referer — avoids Instagram CDN hotlink block
          "User-Agent": "Mozilla/5.0 (compatible; MyRecipesBot/1.0)",
        },
      });
    } catch {
      return reply.code(502).send({ message: "Failed to fetch image." });
    }

    if (!response.ok) {
      return reply.code(502).send({ message: `Upstream returned ${response.status}.` });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const body = await response.arrayBuffer();

    return reply
      .header("Content-Type", contentType)
      .header("Cache-Control", "public, max-age=86400")
      .send(Buffer.from(body));
  });

  // Backfill: re-scrape the original Instagram post to get a fresh og:image, then
  // download and store it locally. Safe to run repeatedly (skips already-local images).
  // POST /images/backfill
  app.post("/backfill", async (_request, reply) => {
    // Find recipes whose image is still a remote URL (not yet downloaded locally)
    const recipes = await db.recipe.findMany({
      where: {
        NOT: { coverImageUrl: { startsWith: "/uploads/" } },
      },
      select: { id: true, importId: true, coverImageUrl: true },
    });

    // Load corresponding import records to get the original source URL
    const importIds = recipes.map((r) => r.importId);
    const imports = await db.import.findMany({
      where: { id: { in: importIds } },
      select: { id: true, sourceUrl: true },
    });
    const importMap = new Map(imports.map((i) => [i.id, i.sourceUrl]));

    let refreshed = 0;
    let failed = 0;

    for (const recipe of recipes) {
      const sourceUrl = importMap.get(recipe.importId);
      if (!sourceUrl) { failed++; continue; }

      // Re-scrape the original post for a fresh og:image URL
      let freshImageUrl: string | null = null;
      try {
        const res = await fetch(sourceUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            Accept: "text/html,application/xhtml+xml",
          },
        });
        if (res.ok) {
          const html = await res.text();
          const match =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
          freshImageUrl = match?.[1]?.replace(/&amp;/g, "&") ?? null;
        }
      } catch { /* network error — skip */ }

      if (!freshImageUrl) { failed++; continue; }

      const localPath = await downloadImage(freshImageUrl);
      if (localPath) {
        await db.recipe.update({ where: { id: recipe.id }, data: { coverImageUrl: localPath } });
        await db.import.update({ where: { id: recipe.importId }, data: { coverImageUrl: localPath } });
        refreshed++;
      } else {
        failed++;
      }
    }

    return reply.send({ total: recipes.length, refreshed, failed });
  });
};
