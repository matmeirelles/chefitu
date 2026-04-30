export type InstagramData = {
  description: string | null;
  coverImageUrl: string | null;
};

export const fetchInstagramData = async (url: string): Promise<InstagramData> => {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) return { description: null, coverImageUrl: null };

  const html = await response.text();

  const description = extractOgTag(html, "og:description");
  const coverImageUrl = extractOgTag(html, "og:image");

  return {
    description: description ? decodeHtmlEntities(description) : null,
    coverImageUrl: coverImageUrl ? decodeHtmlEntities(coverImageUrl) : null,
  };
};

const extractOgTag = (html: string, property: string): string | null => {
  const match =
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"));
  return match?.[1] ?? null;
};

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
