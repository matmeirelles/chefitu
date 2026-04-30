import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db.js";
import {
  createImport,
  deleteImport,
  listInboxImports,
  retryImport,
} from "./service.js";

const stubMethod = (
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

test("listInboxImports maps rows into import list items", async (t) => {
  stubMethod(t, db.import, "findMany", async () => [
    {
      id: "imp_1",
      sourcePlatform: "instagram",
      sourceUrl: "https://instagram.com/p/1",
      sourceAuthorName: "author",
      rawDescription: "desc",
      coverImageUrl: null,
      status: "processing",
      failureReason: null,
      recipeId: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:01:00.000Z"),
    },
  ] as never);

  const items = await listInboxImports();

  assert.deepEqual(items, [
    {
      id: "imp_1",
      sourcePlatform: "instagram",
      sourceUrl: "https://instagram.com/p/1",
      sourceAuthorName: "author",
      rawDescription: "desc",
      coverImageUrl: null,
      status: "processing",
      failureReason: null,
      recipeId: null,
      createdAt: "2026-04-30T10:00:00.000Z",
      updatedAt: "2026-04-30T10:01:00.000Z",
    },
  ]);
});

test("createImport persists a queued instagram import", async (t) => {
  const calls: Array<{ data: { sourcePlatform: string; status: string } }> = [];

  stubMethod(t, db.import, "create", async ({ data }: { data: any }) => {
    calls.push({
      data: {
        sourcePlatform: data.sourcePlatform,
        status: data.status,
      },
    });

    return {
      ...data,
      sourceAuthorName: null,
      rawDescription: null,
      coverImageUrl: null,
      failureReason: null,
      recipeId: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:00:00.000Z"),
    };
  });

  const item = await createImport("https://instagram.com/p/2");

  assert.equal(item.id.startsWith("imp_"), true);
  assert.equal(item.status, "queued");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.data.sourcePlatform, "instagram");
  assert.equal(calls[0]!.data.status, "queued");
});

test("deleteImport returns false when the import does not exist", async (t) => {
  let deleteCalled = false;

  stubMethod(t, db.import, "findUnique", async () => null as never);
  stubMethod(t, db.import, "delete", async () => {
    deleteCalled = true;
    throw new Error("should not be called");
  });

  const result = await deleteImport("missing");

  assert.equal(result, false);
  assert.equal(deleteCalled, false);
});

test("deleteImport deletes an existing import", async (t) => {
  let deletedId: string | null = null;

  stubMethod(t, db.import, "findUnique", async () => ({ id: "imp_3" }) as never);
  stubMethod(t, db.import, "delete", async ({ where }: { where: any }) => {
    deletedId = where.id;
    return { id: "imp_3" } as never;
  });

  const result = await deleteImport("imp_3");

  assert.equal(result, true);
  assert.equal(deletedId, "imp_3");
});

test("retryImport returns null when the import does not exist", async (t) => {
  let updateCalled = false;

  stubMethod(t, db.import, "findUnique", async () => null as never);
  stubMethod(t, db.import, "update", async () => {
    updateCalled = true;
    throw new Error("should not be called");
  });

  const result = await retryImport("missing");

  assert.equal(result, null);
  assert.equal(updateCalled, false);
});

test("retryImport resets the status to queued and clears the failure reason", async (t) => {
  let updatedData:
    | { status: string; failureReason: null; updatedAt: Date }
    | undefined;

  stubMethod(t, db.import, "findUnique", async () => ({ id: "imp_4" }) as never);
  stubMethod(t, db.import, "update", async ({ data }: { data: any }) => {
    const normalizedData = data as {
      status: string;
      failureReason: null;
      updatedAt: Date;
    };

    updatedData = {
      status: normalizedData.status,
      failureReason: normalizedData.failureReason,
      updatedAt: normalizedData.updatedAt,
    };

    return {
      id: "imp_4",
      sourcePlatform: "instagram",
      sourceUrl: "https://instagram.com/p/4",
      sourceAuthorName: null,
      rawDescription: null,
      coverImageUrl: null,
      status: "queued",
      failureReason: null,
      recipeId: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:05:00.000Z"),
    } as never;
  });

  const result = await retryImport("imp_4");

  assert.ok(result);
  assert.equal(result.status, "queued");
  assert.equal(result.failureReason, null);
  assert.equal(updatedData?.status, "queued");
  assert.equal(updatedData?.failureReason, null);
  assert.ok(updatedData?.updatedAt instanceof Date);
});
