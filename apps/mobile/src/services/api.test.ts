import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, fetchRecipes, fetchRecipeById } from "./api";

const mockFetch = (status: number, body: unknown) => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
};

test("ApiError carries statusCode, name and is an instance of Error", () => {
  const error = new ApiError("Not found", 404);

  assert.equal(error.message, "Not found");
  assert.equal(error.statusCode, 404);
  assert.equal(error.name, "ApiError");
  assert.ok(error instanceof Error);
});

test("request throws ApiError with server message when response is not ok", async () => {
  mockFetch(404, { message: "Recipe not found." });

  await assert.rejects(
    () => fetchRecipeById("missing"),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.message, "Recipe not found.");
      return true;
    },
  );
});

test("request falls back to generic message when error body has no message field", async () => {
  mockFetch(500, {});

  await assert.rejects(
    () => fetchRecipes(),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 500);
      assert.equal(err.message, "Unexpected API error.");
      return true;
    },
  );
});

test("request falls back to generic message when error body is not JSON", async () => {
  globalThis.fetch = async () =>
    new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });

  await assert.rejects(
    () => fetchRecipes(),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.message, "Unexpected API error.");
      return true;
    },
  );
});

test("request returns parsed JSON on a successful response", async () => {
  const payload = { items: [{ id: "rec_1", title: "Banana Oat Pancakes" }] };
  mockFetch(200, payload);

  const result = await fetchRecipes();

  assert.deepEqual(result, payload);
});
