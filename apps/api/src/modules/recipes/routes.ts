import type { FastifyInstance } from "fastify";
import { getRecipeById, listRecipes } from "./service.js";

export const registerRecipeRoutes = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const items = await listRecipes();

    return {
      items,
    };
  });

  app.get("/:recipeId", async (request, reply) => {
    const { recipeId } = request.params as { recipeId: string };
    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
      return reply.code(404).send({
        message: "Recipe not found.",
      });
    }

    return {
      item: recipe,
    };
  });
};
