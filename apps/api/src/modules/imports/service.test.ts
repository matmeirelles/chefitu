import test from "node:test";
import assert from "node:assert/strict";
import { listInboxImports } from "./service.js";

test("listInboxImports excludes ready imports from the inbox", async () => {
  const items = await listInboxImports();

  assert.equal(items.some((item) => item.status === "ready"), false);
});
