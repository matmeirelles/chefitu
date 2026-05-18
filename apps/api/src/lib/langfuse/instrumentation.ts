import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { loadRootEnv } from "../load-root-env.js";

loadRootEnv();

const hasLangfuseCredentials = Boolean(
  process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY,
);

let sdk: NodeSDK | null = null;
let shutdownRegistered = false;

if (hasLangfuseCredentials) {
  sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
  });

  sdk.start();
}

const shutdownSdk = async () => {
  if (!sdk) return;

  const activeSdk = sdk;
  sdk = null;

  try {
    await activeSdk.shutdown();
  } catch (error) {
    console.error("[langfuse] failed to shutdown tracing SDK", error);
  }
};

if (!shutdownRegistered && sdk) {
  shutdownRegistered = true;

  process.once("beforeExit", () => {
    void shutdownSdk();
  });

  process.once("SIGINT", () => {
    void shutdownSdk().finally(() => process.exit(0));
  });

  process.once("SIGTERM", () => {
    void shutdownSdk().finally(() => process.exit(0));
  });
}

export const isLangfuseEnabled = (): boolean => hasLangfuseCredentials;
