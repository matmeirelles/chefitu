import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "./app.js";

test("GET /health returns ok", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    status: "ok",
  });

  await app.close();
});

test("GET /imports returns only inbox items", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/imports",
  });

  assert.equal(response.statusCode, 200);

  const body = response.json() as {
    items: Array<{ id: string; status: string }>;
  };

  assert.equal(Array.isArray(body.items), true);
  assert.equal(body.items.length, 3);
  assert.equal(body.items.some((item) => item.status === "ready"), false);
  assert.deepEqual(
    body.items.map((item) => item.id),
    ["imp_2", "imp_3", "imp_4"],
  );

  await app.close();
});

test("GET /recipes returns the recipe library", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes",
  });

  assert.equal(response.statusCode, 200);

  const body = response.json() as {
    items: Array<{ id: string; title: string }>;
  };

  assert.equal(Array.isArray(body.items), true);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0]?.id, "rec_1");
  assert.equal(body.items[0]?.title, "Banana Oat Pancakes");

  await app.close();
});

test("GET /recipes/:id returns a recipe when it exists", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes/rec_1",
  });

  assert.equal(response.statusCode, 200);

  const body = response.json() as {
    item: {
      id: string;
      importId: string;
      title: string;
      ingredients: Array<{ amount?: string; unit?: string; item: string }>;
    };
  };

  assert.equal(body.item.id, "rec_1");
  assert.equal(body.item.importId, "imp_1");
  assert.equal(body.item.title, "Banana Oat Pancakes");
  assert.deepEqual(body.item.ingredients[0], {
    amount: "2",
    item: "eggs",
  });

  await app.close();
});

test("GET /recipes/:id returns 404 when the recipe does not exist", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes/missing",
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Recipe not found.",
  });

  await app.close();
});
