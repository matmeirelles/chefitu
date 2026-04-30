import type { FastifyInstance } from "fastify";
import { deleteRecipe, getRecipeById, listRecipes } from "./service.js";

export const registerRecipeRoutes = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const items = await listRecipes();

    return {
      items,
    };
  });

  app.get<{ Params: { recipeId: string } }>("/:recipeId", async (request, reply) => {
    const { recipeId } = request.params;
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

  app.delete<{ Params: { recipeId: string } }>("/:recipeId", async (request, reply) => {
    const deleted = await deleteRecipe(request.params.recipeId);
    if (!deleted) return reply.code(404).send({ message: "Recipe not found." });
    return reply.code(204).send();
  });
};
