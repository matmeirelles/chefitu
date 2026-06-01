import { useCallback, useEffect, useRef, useState } from "react";
import type { ImportListItem, RecipeRecord } from "@chefitu/shared";
import { createImport, deleteImport, fetchImports, fetchRecipes, retryImport } from "../services/api";

const POLL_MS = 2000;

export const LOADING_STEPS = [
  "Buscando link",
  "Lendo a receita",
  "Montando o preparo",
  "Adicionando no livro",
] as const;

export type ImportFlowPhase = "paste" | "loading" | "success" | "no_recipe" | "failed";

export type ImportFlowOpenOptions = {
  phase?: ImportFlowPhase;
  importId?: string;
  sourceUrl?: string;
};

export const useImportFlow = (onRecipeReady?: () => void) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<ImportFlowPhase>("paste");
  const [importId, setImportId] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPercent, setLoadingPercent] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const importIdRef = useRef<string | null>(null);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const resetLoadingUi = useCallback(() => {
    setLoadingStep(0);
    setLoadingPercent(8);
  }, []);

  const stopTimers = useCallback(() => {
    clearPoll();
    clearProgress();
  }, [clearPoll, clearProgress]);

  const resolveRecipe = useCallback(async (id: string): Promise<RecipeRecord | undefined> => {
    const { items } = await fetchRecipes();
    return items.find((r) => r.importId === id);
  }, []);

  const applyImportStatus = useCallback(
    async (item: ImportListItem) => {
      if (item.status === "failed") {
        stopTimers();
        setPhase("failed");
        return;
      }
      if (item.status === "no_recipe_in_description") {
        stopTimers();
        setPhase("no_recipe");
        return;
      }
      if (item.status === "queued") {
        setLoadingStep(0);
        setLoadingPercent((p) => Math.max(p, 12));
        return;
      }
      if (item.status === "processing") {
        setLoadingStep((s) => Math.max(s, 1));
        setLoadingPercent((p) => Math.max(p, 25));
      }
    },
    [stopTimers],
  );

  const pollImport = useCallback(async () => {
    const id = importIdRef.current;
    if (!id) return;

    const { items } = await fetchImports();
    const item = items.find((i) => i.id === id);

    if (item) {
      await applyImportStatus(item);
      return;
    }

    const found = await resolveRecipe(id);
    if (found) {
      stopTimers();
      setRecipe(found);
      setPhase("success");
      setLoadingPercent(100);
      onRecipeReady?.();
      return;
    }

    setLoadingPercent((p) => Math.min(p + 4, 92));
  }, [applyImportStatus, onRecipeReady, resolveRecipe, stopTimers]);

  const startPolling = useCallback(
    (id: string) => {
      importIdRef.current = id;
      clearPoll();
      void pollImport();
      pollTimerRef.current = setInterval(() => void pollImport(), POLL_MS);
    },
    [clearPoll, pollImport],
  );

  const startProgressAnimation = useCallback(() => {
    clearProgress();
    progressTimerRef.current = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
      setLoadingPercent((p) => Math.min(p + 3, 88));
    }, 2200);
  }, [clearProgress]);

  const close = useCallback(() => {
    stopTimers();
    setVisible(false);
    setPhase("paste");
    setImportId(null);
    importIdRef.current = null;
    setSourceUrl("");
    setRecipe(null);
    resetLoadingUi();
    setIsSubmitting(false);
    setIsActionLoading(false);
  }, [resetLoadingUi, stopTimers]);

  const open = useCallback(
    (options?: ImportFlowOpenOptions) => {
      stopTimers();
      setVisible(true);
      if (options?.phase && options.phase !== "paste") {
        setPhase(options.phase);
        setImportId(options.importId ?? null);
        importIdRef.current = options.importId ?? null;
        setSourceUrl(options.sourceUrl ?? "");
        if (options.phase === "loading") {
          resetLoadingUi();
          if (options.importId) {
            startPolling(options.importId);
            startProgressAnimation();
          }
        }
        return;
      }
      setPhase("paste");
      setImportId(null);
      importIdRef.current = null;
      setSourceUrl(options?.sourceUrl ?? "");
      setRecipe(null);
      resetLoadingUi();
    },
    [resetLoadingUi, startPolling, startProgressAnimation, stopTimers],
  );

  const startImport = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;
      setIsSubmitting(true);
      setSourceUrl(trimmed);
      setPhase("loading");
      resetLoadingUi();
      try {
        const item = await createImport(trimmed);
        setImportId(item.id);
        importIdRef.current = item.id;
        startPolling(item.id);
        startProgressAnimation();
      } catch {
        setPhase("failed");
        stopTimers();
      } finally {
        setIsSubmitting(false);
      }
    },
    [resetLoadingUi, startPolling, startProgressAnimation, stopTimers],
  );

  const openFromProblem = useCallback(
    (item: ImportListItem) => {
      const errorPhase: ImportFlowPhase =
        item.status === "no_recipe_in_description" ? "no_recipe" : "failed";
      open({
        phase: errorPhase,
        importId: item.id,
        sourceUrl: item.sourceUrl,
      });
    },
    [open],
  );

  const discardImport = useCallback(async () => {
    const id = importIdRef.current;
    if (!id) {
      close();
      return;
    }
    setIsActionLoading(true);
    try {
      await deleteImport(id);
      close();
    } finally {
      setIsActionLoading(false);
    }
  }, [close]);

  const retryImportFlow = useCallback(async () => {
    const id = importIdRef.current;
    if (!id) return;
    setIsActionLoading(true);
    setPhase("loading");
    resetLoadingUi();
    try {
      await retryImport(id);
      startPolling(id);
      startProgressAnimation();
    } catch {
      setPhase("failed");
      stopTimers();
    } finally {
      setIsActionLoading(false);
    }
  }, [resetLoadingUi, startPolling, startProgressAnimation, stopTimers]);

  useEffect(() => () => stopTimers(), [stopTimers]);

  return {
    visible,
    phase,
    importId,
    sourceUrl,
    recipe,
    loadingStep,
    loadingPercent,
    isSubmitting,
    isActionLoading,
    open,
    close,
    startImport,
    openFromProblem,
    discardImport,
    retryImportFlow,
  };
};
