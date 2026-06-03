import assert from "node:assert/strict";
import { test } from "node:test";
import { itemFromIngredient } from "./shopping-list.js";

test("itemFromIngredient stores only ingredient name", () => {
  const item = itemFromIngredient({ item: "Tomate", amount: "500", unit: "g" });
  assert.equal(item.name, "Tomate");
  assert.equal("quantity" in item, false);
});
