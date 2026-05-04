CREATE OR REPLACE VIEW "AIAdjustmentLogReadable" AS
SELECT
  "id",
  "recipeId",
  "provider",
  "model",
  "kind",
  "inputTokens",
  "outputTokens",
  "totalTokens",
  "responseTimeMs",
  "createdAt",
  "sessionId"
FROM "AIAdjustmentLog";
