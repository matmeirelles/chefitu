export type ImportSourceKind = "instagram" | "youtube" | "generic";

export type ImportSourceInfo = {
  kind: ImportSourceKind;
  label: string;
  host: string;
  displayUrl: string;
  iconColor: string;
  iconBackground: string;
};

export const parseImportSource = (sourceUrl: string): ImportSourceInfo => {
  try {
    const parsed = new URL(sourceUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host.includes("instagram")) {
      return {
        kind: "instagram",
        label: "Instagram",
        host,
        displayUrl: truncateUrl(sourceUrl),
        iconColor: "#FFFFFF",
        iconBackground: "#E4405F",
      };
    }
    if (host.includes("youtube") || host.includes("youtu.be")) {
      return {
        kind: "youtube",
        label: "YouTube",
        host,
        displayUrl: truncateUrl(sourceUrl),
        iconColor: "#FFFFFF",
        iconBackground: "#FF0000",
      };
    }
    return {
      kind: "generic",
      label: "Link",
      host,
      displayUrl: truncateUrl(sourceUrl),
      iconColor: "#FFFFFF",
      iconBackground: "#4A2C1A",
    };
  } catch {
    return {
      kind: "generic",
      label: "Link",
      host: "link",
      displayUrl: truncateUrl(sourceUrl),
      iconColor: "#FFFFFF",
      iconBackground: "#4A2C1A",
    };
  }
};

const truncateUrl = (url: string, max = 42): string => {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
};
