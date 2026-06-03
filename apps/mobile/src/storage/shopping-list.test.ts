import assert from "node:assert/strict";
import { test } from "node:test";
import { formatIngredientQuantity } from "./shopping-list.js";

test("formatIngredientQuantity joins amount and unit", () => {
  assert.equal(
    formatIngredientQuantity({ item: "Tomate", amount: "500", unit: "g" }),
    "500 g",
  );
});

test("formatIngredientQuantity returns empty when no amount or unit", () => {
  assert.equal(formatIngredientQuantity({ item: "Sal" }), "");
});
