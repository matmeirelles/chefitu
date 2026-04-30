import { appName } from "@my-recipes/shared";
import { buildApp } from "./app.js";
import { startProcessingWatchdog } from "./lib/processing-watchdog.js";

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? "0.0.0.0";

const bootstrap = async () => {
  await startProcessingWatchdog();

  const app = await buildApp();

  try {
    await app.listen({ host, port });
    app.log.info(`${appName} API listening on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void bootstrap();
