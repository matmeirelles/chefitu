import { db } from "./db.js";
import { aiProviderFactory } from "./ai/index.js";
import { instagramFetcher } from "./fetch-instagram.js";
import { traceAiWorkflow } from "./langfuse/tracing.js";
import { downloadImage } from "./download-image.js";

export const processImport = async (importId: string): Promise<void> => {
  const record = await db.import.findUnique({ where: { id: importId } });
  if (!record) return;

  await traceAiWorkflow(
    "import-recipe-from-link",
    {
      input: {
        importId,
        sourceUrl: record.sourceUrl,
        sourcePlatform: record.sourcePlatform,
        hasSavedDescription: Boolean(record.rawDescription),
      },
      metadata: {
        feature: "recipe-import",
      },
    },
    async () => {
      try {
        await db.import.update({
          where: { id: importId },
          data: { status: "processing" },
        });

        // Get description — use saved one or fetch from Instagram
        let description = record.rawDescription;
        let coverImageUrl = record.coverImageUrl;

        if (!description) {
          console.log(`[process-import] Fetching Instagram data for: ${record.sourceUrl}`);
          const igData = await instagramFetcher.fetchInstagramData(record.sourceUrl);
          description = igData.description;
          const remoteImageUrl = igData.coverImageUrl ?? coverImageUrl;
          console.log(`[process-import] Description: ${description ? `"${description.slice(0, 100)}..."` : "null"}`);
          console.log(`[process-import] Cover image: ${remoteImageUrl ?? "null"}`);

          // Download and store image locally so the URL never expires
          if (remoteImageUrl) {
            const localPath = await downloadImage(remoteImageUrl);
            coverImageUrl = localPath ?? remoteImageUrl;
            console.log(`[process-import] Stored image: ${coverImageUrl}`);
          }

          await db.import.update({
            where: { id: importId },
            data: {
              rawDescription: description ?? null,
              coverImageUrl: coverImageUrl ?? null,
            },
          });
        }

        if (!description?.trim()) {
          console.log(`[process-import] No description found, marking as no_recipe_in_description`);
          await db.import.update({
            where: { id: importId },
            data: {
              status: "no_recipe_in_description",
              failureReason: "No description found in the post.",
            },
          });
          return;
        }

        // Extract recipe with AI
        console.log(`[process-import] Calling AI to extract recipe...`);
        const ai = aiProviderFactory.getAIProvider();
        const extractionStartedAt = Date.now();
        const extraction = await ai.extractRecipe(description);
        const responseTimeMs = Date.now() - extractionStartedAt;
        const result = extraction.recipe;
        console.log(
          `[process-import] AI provider=${extraction.metadata.provider} model=${extraction.metadata.model} inputTokens=${extraction.metadata.inputTokens ?? "n/a"} outputTokens=${extraction.metadata.outputTokens ?? "n/a"} responseTimeMs=${responseTimeMs}`,
        );
        console.log(`[process-import] AI result: ${JSON.stringify(result).slice(0, 200)}`);
        console.log(result);

        await db.aIExtractionLog.create({
          data: {
            importId,
            description: record.sourceUrl,
            provider: extraction.metadata.provider,
            model: extraction.metadata.model,
            inputTokens: extraction.metadata.inputTokens ?? null,
            outputTokens: extraction.metadata.outputTokens ?? null,
            responseTimeMs,
            finalResponse: result,
          },
        });

        if (!result.noRecipe) {
          if (result.category === "Outro" && result.categorySuggestion) {
            console.log(`[OUTRO-SUGGESTION] importId=${importId} field=category suggestion="${result.categorySuggestion}"`);
          }
          if (result.cuisine === "Outro" && result.cuisineSuggestion) {
            console.log(`[OUTRO-SUGGESTION] importId=${importId} field=cuisine suggestion="${result.cuisineSuggestion}"`);
          }
        }

        if (result.noRecipe) {
          await db.import.update({
            where: { id: importId },
            data: {
              status: "no_recipe_in_description",
              failureReason: "No recipe found in the post description.",
            },
          });
          return;
        }

        // Save recipe and mark import as ready
        const recipe = await db.recipe.create({
          data: {
            importId,
            title: result.title,
            coverImageUrl: coverImageUrl,
            category: result.category ?? null,
            cuisine: result.cuisine ?? null,
            ingredients: result.ingredients,
            steps: result.steps,
            instructionsGeneratedByAi: result.instructionsGeneratedByAi ?? false,
            totalTimeMinutes: result.totalTimeMinutes ?? null,
            servings: result.servings ?? null,
            tags: result.tags,
          },
        });

        await db.import.update({
          where: { id: importId },
          data: { status: "ready", recipeId: recipe.id },
        });
      } catch (err) {
        console.error(`[process-import] Error processing import ${importId}:`, err);
        await db.import.update({
          where: { id: importId },
          data: {
            status: "failed",
            failureReason:
              err instanceof Error ? err.message : "Unexpected error during processing.",
          },
        });
      }
    },
  );
};

export const importProcessor = {
  processImport,
};
