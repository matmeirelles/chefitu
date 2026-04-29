import type { ImportListItem } from "@my-recipes/shared";
import { mockImports } from "../../lib/mock-data.js";

const visibleImportStatuses = new Set<ImportListItem["status"]>([
  "queued",
  "processing",
  "failed",
  "no_recipe_in_description",
]);

export const listInboxImports = async (): Promise<ImportListItem[]> =>
  mockImports.filter((item) => visibleImportStatuses.has(item.status));
