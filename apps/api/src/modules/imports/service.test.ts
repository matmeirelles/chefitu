import test from "node:test";
import assert from "node:assert/strict";
import { listInboxImports } from "./service.js";

test("listInboxImports excludes ready imports from the inbox", async () => {
  const items = await listInboxImports();

  assert.equal(items.some((item) => item.status === "ready"), false);
});

test("listInboxImports includes processing, failed and no_recipe_in_description items", async () => {
  const items = await listInboxImports();
  const statuses = new Set(items.map((item) => item.status));

  assert.ok(statuses.has("processing"));
  assert.ok(statuses.has("failed"));
  assert.ok(statuses.has("no_recipe_in_description"));
});
