import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import Fastify from "fastify";
import { join } from "node:path";
import { registerImportRoutes } from "./modules/imports/routes.js";
import { registerRecipeRoutes } from "./modules/recipes/routes.js";
import { registerImageProxyRoute } from "./modules/image-proxy/routes.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
  });

  await app.register(staticPlugin, {
    root: join(process.cwd(), "uploads"),
    prefix: "/uploads/",
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

  await app.register(registerImageProxyRoute, {
    prefix: "/images",
  });

  return app;
};
