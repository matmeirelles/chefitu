import { startActiveObservation } from "@langfuse/tracing";

type TraceMetadata = Record<string, unknown>;
type UsageDetails = Record<string, number | null | undefined>;

const normalizeUsageDetails = (
  usageDetails: UsageDetails | undefined,
): Record<string, number> | undefined => {
  if (!usageDetails) return undefined;

  const entries = Object.entries(usageDetails).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number",
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

export const traceAiWorkflow = async <T>(
  name: string,
  attributes: {
    input?: unknown;
    metadata?: TraceMetadata;
  },
  run: () => Promise<T>,
): Promise<T> =>
  startActiveObservation(
    name,
    async (span) => {
      span.update({
        ...(attributes.input !== undefined ? { input: attributes.input } : {}),
        ...(attributes.metadata ? { metadata: attributes.metadata } : {}),
      });

      try {
        return await run();
      } catch (error) {
        span.update({
          level: "ERROR",
          statusMessage: error instanceof Error ? error.message : "Unexpected AI workflow error.",
          output: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    },
    { asType: "span" },
  );

export const traceAiGeneration = async <T>(
  name: string,
  attributes: {
    model: string;
    input: unknown;
    modelParameters?: Record<string, string | number>;
    metadata?: TraceMetadata;
  },
  run: () => Promise<{
    result: T;
    output: unknown;
    usageDetails?: UsageDetails;
  }>,
): Promise<T> =>
  startActiveObservation(
    name,
    async (generation) => {
      const initialAttributes = {
        input: attributes.input,
        model: attributes.model,
        ...(attributes.modelParameters ? { modelParameters: attributes.modelParameters } : {}),
        ...(attributes.metadata ? { metadata: attributes.metadata } : {}),
      };

      generation.update({
        ...initialAttributes,
      });

      try {
        const completed = await run();
        const usageDetails = normalizeUsageDetails(completed.usageDetails);

        generation.update({
          output: completed.output,
          ...(usageDetails ? { usageDetails } : {}),
        });

        return completed.result;
      } catch (error) {
        generation.update({
          level: "ERROR",
          statusMessage: error instanceof Error ? error.message : "LLM call failed.",
          output: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    },
    { asType: "generation" },
  );
