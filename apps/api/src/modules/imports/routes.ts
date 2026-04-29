import type { FastifyInstance } from "fastify";
import { listInboxImports } from "./service.js";

export const registerImportRoutes = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const items = await listInboxImports();

    return {
      items,
    };
  });
};
