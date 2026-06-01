export type ImportSourceInfo = {
  label: string;
  host: string;
  displayUrl: string;
};

export const parseImportSource = (sourceUrl: string): ImportSourceInfo => {
  try {
    const parsed = new URL(sourceUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host.includes("instagram")) {
      return { label: "Instagram", host, displayUrl: truncateUrl(sourceUrl) };
    }
    return { label: "Link", host, displayUrl: truncateUrl(sourceUrl) };
  } catch {
    return { label: "Link", host: "link", displayUrl: truncateUrl(sourceUrl) };
  }
};

const truncateUrl = (url: string, max = 42): string => {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
};
