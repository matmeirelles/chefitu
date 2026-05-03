import type { TestContext } from "node:test";

export const stubMethod = (
  t: TestContext,
  target: object,
  methodName: string,
  implementation: unknown,
) => {
  const previous = (target as Record<string, unknown>)[methodName];
  (target as Record<string, unknown>)[methodName] = implementation;
  t.after(() => {
    (target as Record<string, unknown>)[methodName] = previous;
  });
};

export const stubEnv = (t: TestContext, key: string, value: string | undefined) => {
  const previous = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  t.after(() => {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  });
};

export const stubSilentConsole = (t: TestContext) => {
  stubMethod(t, console, "log", () => undefined);
  stubMethod(t, console, "error", () => undefined);
};
