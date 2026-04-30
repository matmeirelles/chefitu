import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerImportRoutes } from "./modules/imports/routes.js";
import { registerRecipeRoutes } from "./modules/recipes/routes.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
  });

  app.get("/health", async () => ({
    status: "ok",
  }));

  await app.register(registerImportRoutes, {
    prefix: "/imports",
  });

  await app.register(registerRecipeRoutes, {
    prefix: "/recipes",
  });

  return app;
};
