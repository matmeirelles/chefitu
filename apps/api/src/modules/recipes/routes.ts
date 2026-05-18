import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type {
  AdjustRecipeRequest,
  CreateAdjustedRecipeRequest,
  GenerateRecipeRequest,
  SaveGeneratedRecipeRequest,
  UpdateRecipeRequest,
} from "@my-recipes/shared";
import { aiProviderFactory } from "../../lib/ai/index.js";
import { db } from "../../lib/db.js";
import { traceAiWorkflow } from "../../lib/langfuse/tracing.js";
import {
  createAdjustedRecipe,
  createGeneratedRecipe,
  deleteRecipe,
  getRecipeById,
  listRecipes,
  updateRecipe,
} from "./service.js";

export const registerRecipeRoutes = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const items = await listRecipes();
    return { items };
  });

  app.post<{ Body: GenerateRecipeRequest }>("/generate", async (request, reply) => {
    return traceAiWorkflow(
      "generate-recipe-from-scratch",
      {
        input: {
          sessionId: request.body.sessionId,
          messages: request.body.messages,
        },
        metadata: {
          feature: "recipe-generation",
          route: "/recipes/generate",
        },
      },
      async () => {
        const provider = aiProviderFactory.getAIProvider();

        let result: Awaited<ReturnType<typeof provider.generateRecipe>>;
        const generateStartedAt = Date.now();
        try {
          result = await provider.generateRecipe(request.body.messages);
        } catch (err) {
          request.log.error({ err }, "[generate] AI call failed");
          return reply.code(500).send({ message: "AI recipe generation failed.", detail: String(err) });
        }
        const responseTimeMs = Date.now() - generateStartedAt;

        request.log.info(
          `[generate] provider=${result.metadata.provider} model=${result.metadata.model} kind=${result.kind} inputTokens=${result.metadata.inputTokens ?? "n/a"} outputTokens=${result.metadata.outputTokens ?? "n/a"} responseTimeMs=${responseTimeMs}`,
        );

        if (result.kind === "message") {
          return { kind: "message", message: result.message };
        }

        return { kind: "recipe", recipe: result.recipe };
      },
    );
  });

  app.post<{ Body: SaveGeneratedRecipeRequest }>("/generated", async (request, reply) => {
    const item = await createGeneratedRecipe(request.body);
    return reply.code(201).send({ item });
  });

  app.get<{ Params: { recipeId: string } }>("/:recipeId", async (request, reply) => {
    const { recipeId } = request.params;
    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
      return reply.code(404).send({ message: "Recipe not found." });
    }

    return { item: recipe };
  });

  app.delete<{ Params: { recipeId: string } }>("/:recipeId", async (request, reply) => {
    const deleted = await deleteRecipe(request.params.recipeId);
    if (!deleted) return reply.code(404).send({ message: "Recipe not found." });
    return reply.code(204).send();
  });

  app.post<{ Params: { recipeId: string }; Body: AdjustRecipeRequest }>(
    "/:recipeId/adjust",
    async (request, reply) => {
      const { recipeId } = request.params;
      const { messages, sessionId } = request.body;
      const effectiveSessionId = sessionId?.trim() || `fallback:${recipeId}:${randomUUID()}`;

      const recipe = await getRecipeById(recipeId);
      if (!recipe) return reply.code(404).send({ message: "Recipe not found." });

      return traceAiWorkflow(
        "adjust-existing-recipe",
        {
          input: {
            sessionId: effectiveSessionId,
            recipeId,
            recipeTitle: recipe.title,
            messages,
          },
          metadata: {
            feature: "recipe-adjustment",
            route: "/recipes/:recipeId/adjust",
          },
        },
        async () => {
          const provider = aiProviderFactory.getAIProvider();

          let result: Awaited<ReturnType<typeof provider.adjustRecipe>>;
          const adjustStartedAt = Date.now();
          try {
            result = await provider.adjustRecipe(messages);
          } catch (err) {
            request.log.error({ err }, "[adjust] AI call failed");
            return reply.code(500).send({ message: "AI adjustment failed.", detail: String(err) });
          }
          const responseTimeMs = Date.now() - adjustStartedAt;
          request.log.info(
            `[adjust] provider=${result.metadata.provider} model=${result.metadata.model} kind=${result.kind} inputTokens=${result.metadata.inputTokens ?? "n/a"} outputTokens=${result.metadata.outputTokens ?? "n/a"} responseTimeMs=${responseTimeMs}`,
          );

          const totalTokens =
            (result.metadata.inputTokens ?? 0) + (result.metadata.outputTokens ?? 0);

          try {
            await db.aIAdjustmentLog.create({
              data: {
                sessionId: effectiveSessionId,
                recipeId,
                provider: result.metadata.provider,
                model: result.metadata.model,
                kind: result.kind,
                inputTokens: result.metadata.inputTokens,
                outputTokens: result.metadata.outputTokens,
                totalTokens,
                responseTimeMs,
              },
            });
          } catch (err) {
            request.log.error({ err, recipeId, sessionId: effectiveSessionId }, "[adjust] failed to persist AI adjustment log");
          }

          if (result.kind === "message") {
            return { kind: "message", message: result.message };
          }

          const adjustedRecipe = {
            ...recipe,
            ...result.adjustedFields,
            id: recipe.id,
            importId: recipe.importId,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
            coverImageUrl: result.adjustedFields.coverImageUrl ?? recipe.coverImageUrl,
          };

          return { kind: "adjustment", adjustedRecipe };
        },
      );
    },
  );

  app.put<{ Params: { recipeId: string }; Body: UpdateRecipeRequest }>(
    "/:recipeId",
    async (request, reply) => {
      const { recipeId } = request.params;
      const updated = await updateRecipe(recipeId, request.body);
      if (!updated) return reply.code(404).send({ message: "Recipe not found." });
      return { item: updated };
    },
  );

  app.post<{ Body: CreateAdjustedRecipeRequest }>("/", async (request, reply) => {
    const item = await createAdjustedRecipe(request.body);
    return reply.code(201).send({ item });
  });
};
