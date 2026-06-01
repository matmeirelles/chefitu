import { useCallback, useEffect, useRef, useState } from "react";
import type { ImportListItem } from "@chefitu/shared";
import { createImport, deleteImport, fetchImports, retryImport } from "../services/api";

const POLL_MS = 3000;

export const hasActiveImports = (list: ImportListItem[]) =>
  list.some((i) => i.status === "queued" || i.status === "processing");

export const useImportQueue = (onImportFinished?: () => void) => {
  const [items, setItems] = useState<ImportListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wasActiveRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchImports();
      const active = hasActiveImports(data.items);
      if (wasActiveRef.current && !active) {
        onImportFinished?.();
      }
      wasActiveRef.current = active;
      setItems(data.items);
    } catch {
      // keep previous list
    } finally {
      setIsLoading(false);
    }
  }, [onImportFinished]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!hasActiveImports(items)) return;
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [items, load]);

  const addImport = useCallback(
    async (sourceUrl: string) => {
      await createImport(sourceUrl.trim());
      wasActiveRef.current = true;
      await load();
    },
    [load],
  );

  const removeImport = useCallback(
    async (importId: string) => {
      await deleteImport(importId);
      await load();
    },
    [load],
  );

  const retryImportJob = useCallback(
    async (importId: string) => {
      await retryImport(importId);
      wasActiveRef.current = true;
      await load();
    },
    [load],
  );

  return {
    items,
    isLoading,
    load,
    addImport,
    removeImport,
    retryImportJob,
  };
};
