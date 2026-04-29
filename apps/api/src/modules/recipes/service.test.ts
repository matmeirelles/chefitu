import test from "node:test";
import assert from "node:assert/strict";
import { getRecipeById, listRecipes } from "./service.js";

test("listRecipes returns available mock recipes", async () => {
  const items = await listRecipes();

  assert.ok(items.length > 0);
});

test("getRecipeById returns undefined when a recipe does not exist", async () => {
  const item = await getRecipeById("missing");

  assert.equal(item, undefined);
});
