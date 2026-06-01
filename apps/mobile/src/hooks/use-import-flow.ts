import { useCallback, useEffect, useRef, useState } from "react";
import type { ImportListItem, RecipeRecord } from "@chefitu/shared";
import { createImport, deleteImport, fetchImports, fetchRecipes, retryImport } from "../services/api";

const POLL_MS = 2000;
const PROGRESS_TICK_MS = 400;
const STEP_ADVANCE_MS = 1100;
const BANNER_SUCCESS_MS = 3000;

export const LOADING_STEPS = [
  "Buscando link",
  "Lendo a receita",
  "Montando o preparo",
  "Adicionando no livro",
] as const;

export const LOADING_STEP_PERCENTS = [22, 48, 74, 92] as const;

export type ImportFlowPhase = "paste" | "loading" | "success" | "no_recipe" | "failed";

export type ImportBannerState = {
  phase: ImportFlowPhase;
  sourceUrl: string;
  loadingStep: number;
  loadingPercent: number;
  recipe: RecipeRecord | null;
};

export type ImportFlowOpenOptions = {
  phase?: ImportFlowPhase;
  importId?: string;
  sourceUrl?: string;
};

const percentForStep = (step: number) =>
  LOADING_STEP_PERCENTS[Math.min(step, LOADING_STEP_PERCENTS.length - 1)];

/** Removes older failed attempts for the same URL after a successful import. */
export const cleanupStaleFailedImportsForUrl = async (
  url: string,
  keepImportId: string | null,
) => {
  const trimmed = url.trim();
  if (!trimmed) return;

  const { items } = await fetchImports();
  const stale = items.filter(
    (i) =>
      i.sourceUrl === trimmed &&
      i.id !== keepImportId &&
      (i.status === "failed" || i.status === "no_recipe_in_description"),
  );

  await Promise.all(stale.map((i) => deleteImport(i.id)));
};

export const useImportFlow = (onRecipeReady?: () => void) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<ImportFlowPhase>("paste");
  const [importId, setImportId] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPercent, setLoadingPercent] = useState<number>(LOADING_STEP_PERCENTS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [banner, setBanner] = useState<ImportBannerState | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importIdRef = useRef<string | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const clearProgressTimers = useCallback(() => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (creepTimerRef.current) {
      clearInterval(creepTimerRef.current);
      creepTimerRef.current = null;
    }
  }, []);

  const clearBannerDismiss = useCallback(() => {
    if (bannerDismissTimerRef.current) {
      clearTimeout(bannerDismissTimerRef.current);
      bannerDismissTimerRef.current = null;
    }
  }, []);

  const resetLoadingUi = useCallback(() => {
    setLoadingStep(0);
    setLoadingPercent(LOADING_STEP_PERCENTS[0]);
  }, []);

  const stopTimers = useCallback(() => {
    clearPoll();
    clearProgressTimers();
    clearBannerDismiss();
  }, [clearBannerDismiss, clearPoll, clearProgressTimers]);

  const buildBanner = useCallback(
    (nextPhase: ImportFlowPhase, nextRecipe: RecipeRecord | null = recipe): ImportBannerState => ({
      phase: nextPhase,
      sourceUrl,
      loadingStep,
      loadingPercent: nextPhase === "success" ? 100 : loadingPercent,
      recipe: nextRecipe,
    }),
    [loadingPercent, loadingStep, recipe, sourceUrl],
  );

  const scheduleBannerSuccessDismiss = useCallback(() => {
    clearBannerDismiss();
    bannerDismissTimerRef.current = setTimeout(() => {
      setBanner(null);
    }, BANNER_SUCCESS_MS);
  }, [clearBannerDismiss]);

  const showBannerForPhase = useCallback(
    (nextPhase: ImportFlowPhase, nextRecipe: RecipeRecord | null = null) => {
      setBanner(buildBanner(nextPhase, nextRecipe));
      if (nextPhase === "success") {
        scheduleBannerSuccessDismiss();
      }
    },
    [buildBanner, scheduleBannerSuccessDismiss],
  );

  const resolveRecipe = useCallback(async (id: string): Promise<RecipeRecord | undefined> => {
    const { items } = await fetchRecipes();
    return items.find((r) => r.importId === id);
  }, []);

  const applyImportStatus = useCallback(
    async (item: ImportListItem) => {
      if (item.status === "failed") {
        stopTimers();
        setPhase("failed");
        setLoadingPercent(100);
        if (!visibleRef.current) showBannerForPhase("failed");
        return;
      }
      if (item.status === "no_recipe_in_description") {
        stopTimers();
        setPhase("no_recipe");
        setLoadingPercent(100);
        if (!visibleRef.current) showBannerForPhase("no_recipe");
        return;
      }
      if (item.status === "queued") {
        setLoadingStep(0);
        setLoadingPercent((p) => Math.max(p, percentForStep(0)));
        return;
      }
      if (item.status === "processing") {
        setLoadingStep((s) => {
          const next = Math.max(s, 1);
          setLoadingPercent((p) => Math.max(p, percentForStep(next)));
          return next;
        });
      }
    },
    [showBannerForPhase, stopTimers],
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
      await cleanupStaleFailedImportsForUrl(sourceUrl, id);
      setRecipe(found);
      setPhase("success");
      setLoadingPercent(100);
      onRecipeReady?.();
      if (!visibleRef.current) showBannerForPhase("success", found);
      return;
    }

    setLoadingPercent((p) => Math.min(p + 2, LOADING_STEP_PERCENTS[LOADING_STEP_PERCENTS.length - 1]));
  }, [applyImportStatus, onRecipeReady, resolveRecipe, showBannerForPhase, sourceUrl, stopTimers]);

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
    clearProgressTimers();

    creepTimerRef.current = setInterval(() => {
      setLoadingPercent((p) => (p >= 92 ? p : Math.min(p + 5, 92)));
    }, PROGRESS_TICK_MS);

    stepTimerRef.current = setInterval(() => {
      setLoadingStep((s) => {
        if (s >= LOADING_STEPS.length - 1) return s;
        const next = s + 1;
        setLoadingPercent(percentForStep(next));
        return next;
      });
    }, STEP_ADVANCE_MS);
  }, [clearProgressTimers]);

  const resetFlow = useCallback(() => {
    stopTimers();
    setVisible(false);
    setPhase("paste");
    setImportId(null);
    importIdRef.current = null;
    setSourceUrl("");
    setRecipe(null);
    setBanner(null);
    resetLoadingUi();
    setIsSubmitting(false);
    setIsActionLoading(false);
  }, [resetLoadingUi, stopTimers]);

  const dismissSheet = useCallback(() => {
    setVisible(false);
    if (phase === "loading") {
      setBanner(buildBanner("loading"));
      return;
    }
    if (phase === "success" || phase === "failed" || phase === "no_recipe") {
      showBannerForPhase(phase, recipe);
    }
  }, [buildBanner, phase, recipe, showBannerForPhase]);

  const open = useCallback(
    (options?: ImportFlowOpenOptions) => {
      setBanner(null);
      clearBannerDismiss();
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
    [clearBannerDismiss, resetLoadingUi, startPolling, startProgressAnimation],
  );

  const dismissBanner = useCallback(() => {
    clearBannerDismiss();
    setBanner(null);
  }, [clearBannerDismiss]);

  const openFromBanner = useCallback(() => {
    if (!banner) return;

    if (banner.phase === "success") {
      dismissBanner();
      return;
    }

    const snapshot = banner;
    dismissBanner();
    setVisible(true);
    setPhase(snapshot.phase);
    setSourceUrl(snapshot.sourceUrl);
    setRecipe(snapshot.recipe);

    if (snapshot.phase === "loading" && importIdRef.current) {
      startPolling(importIdRef.current);
      startProgressAnimation();
    }
  }, [banner, dismissBanner, startPolling, startProgressAnimation]);

  const startImport = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;
      setIsSubmitting(true);
      setSourceUrl(trimmed);
      setPhase("loading");
      setBanner(null);
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

  const discardImport = useCallback(async () => {
    const id = importIdRef.current;
    if (!id) {
      resetFlow();
      return;
    }
    setIsActionLoading(true);
    try {
      await deleteImport(id);
      resetFlow();
    } finally {
      setIsActionLoading(false);
    }
  }, [resetFlow]);

  const retryImportFlow = useCallback(async () => {
    const id = importIdRef.current;
    if (!id) return;
    setIsActionLoading(true);
    setPhase("loading");
    setBanner(null);
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
    banner,
    open,
    dismissSheet,
    resetFlow,
    startImport,
    dismissBanner,
    openFromBanner,
    discardImport,
    retryImportFlow,
  };
};
