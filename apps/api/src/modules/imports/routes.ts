import type { FastifyInstance } from "fastify";
import { createImport, deleteImport, listInboxImports, retryImport } from "./service.js";
import { importProcessor } from "../../lib/process-import.js";

export const registerImportRoutes = async (app: FastifyInstance) => {
  app.get("/", async () => {
    const items = await listInboxImports();
    return { items };
  });

  app.post<{ Body: { sourceUrl: string } }>("/", async (request, reply) => {
    const { sourceUrl } = request.body;
    if (!sourceUrl?.trim()) {
      return reply.status(400).send({ message: "sourceUrl is required." });
    }

    const item = await createImport(sourceUrl.trim());

    // Fire-and-forget processing
    setImmediate(() => void importProcessor.processImport(item.id));

    return reply.status(201).send({ item });
  });

  app.delete<{ Params: { importId: string } }>("/:importId", async (request, reply) => {
    const deleted = await deleteImport(request.params.importId);
    if (!deleted) return reply.code(404).send({ message: "Import not found." });
    return reply.code(204).send();
  });

  app.post<{ Params: { importId: string } }>(
    "/:importId/retry",
    async (request, reply) => {
      const item = await retryImport(request.params.importId);
      if (!item) {
        return reply.status(404).send({ message: "Import not found." });
      }

      setImmediate(() => void importProcessor.processImport(item.id));

      return { item };
    },
  );
};
