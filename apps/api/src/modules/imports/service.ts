import { randomUUID } from "node:crypto";
import type { ImportListItem, ImportStatus } from "@my-recipes/shared";
import { db } from "../../lib/db.js";

const visibleImportStatuses: ImportStatus[] = [
  "queued",
  "processing",
  "failed",
  "no_recipe_in_description",
];

const toImportListItem = (row: {
  id: string;
  sourcePlatform: string;
  sourceUrl: string;
  sourceAuthorName: string | null;
  rawDescription: string | null;
  coverImageUrl: string | null;
  status: string;
  failureReason: string | null;
  recipeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ImportListItem => ({
  id: row.id,
  sourcePlatform: "instagram",
  sourceUrl: row.sourceUrl,
  sourceAuthorName: row.sourceAuthorName,
  rawDescription: row.rawDescription,
  coverImageUrl: row.coverImageUrl,
  status: row.status as ImportStatus,
  failureReason: row.failureReason,
  recipeId: row.recipeId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listInboxImports = async (): Promise<ImportListItem[]> => {
  const rows = await db.import.findMany({
    where: { status: { in: visibleImportStatuses } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toImportListItem);
};

export const createImport = async (
  sourceUrl: string,
): Promise<ImportListItem> => {
  const row = await db.import.create({
    data: {
      id: `imp_${randomUUID()}`,
      sourcePlatform: "instagram",
      sourceUrl,
      status: "queued",
    },
  });
  return toImportListItem(row);
};

export const deleteImport = async (importId: string): Promise<boolean> => {
  const existing = await db.import.findUnique({ where: { id: importId } });
  if (!existing) return false;
  await db.import.delete({ where: { id: importId } });
  return true;
};

export const retryImport = async (
  importId: string,
): Promise<ImportListItem | null> => {
  const existing = await db.import.findUnique({ where: { id: importId } });
  if (!existing) return null;

  const updated = await db.import.update({
    where: { id: importId },
    data: { status: "queued", failureReason: null, updatedAt: new Date() },
  });
  return toImportListItem(updated);
};
