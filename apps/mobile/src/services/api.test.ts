import test from "node:test";
import assert from "node:assert/strict";
import {
  adjustRecipe,
  ApiError,
  createImport,
  deleteImport,
  deleteRecipe,
  fetchImports,
  fetchRecipeById,
  fetchRecipes,
  retryImport,
} from "./api";

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

test("fetchRecipeById returns the recipe on a successful response", async () => {
  const payload = { item: { id: "rec_1", title: "Banana Oat Pancakes" } };
  mockFetch(200, payload);

  const result = await fetchRecipeById("rec_1");

  assert.deepEqual(result, payload);
});

test("fetchImports returns parsed JSON on a successful response", async () => {
  const payload = { items: [{ id: "imp_1", status: "processing" }] };
  mockFetch(200, payload);

  const result = await fetchImports();

  assert.deepEqual(result, payload);
});

test("createImport sends a POST request and succeeds on a 201 response", async () => {
  let input: unknown;
  let init: RequestInit | undefined;
  globalThis.fetch = async (url, options) => {
    input = url;
    init = options;
    return new Response(JSON.stringify({ item: { id: "imp_1" } }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  await createImport("https://instagram.com/p/1");

  assert.equal(input, "http://127.0.0.1:3333/imports");
  assert.equal(init?.method, "POST");
  assert.equal(init?.headers && (init.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.equal(init?.body, JSON.stringify({ sourceUrl: "https://instagram.com/p/1" }));
});

test("createImport throws ApiError on failure", async () => {
  mockFetch(500, {});

  await assert.rejects(
    () => createImport("https://instagram.com/p/1"),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.message, "Failed to create import.");
      return true;
    },
  );
});

test("deleteImport sends a DELETE request and succeeds on a 204 response", async () => {
  let input: unknown;
  let init: RequestInit | undefined;
  globalThis.fetch = async (url, options) => {
    input = url;
    init = options;
    return new Response(null, { status: 204 });
  };

  await deleteImport("imp_1");

  assert.equal(input, "http://127.0.0.1:3333/imports/imp_1");
  assert.equal(init?.method, "DELETE");
});

test("deleteImport throws ApiError on failure", async () => {
  mockFetch(500, {});

  await assert.rejects(
    () => deleteImport("imp_1"),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.message, "Failed to delete import.");
      return true;
    },
  );
});

test("retryImport sends a POST request and succeeds on a 200 response", async () => {
  let input: unknown;
  let init: RequestInit | undefined;
  globalThis.fetch = async (url, options) => {
    input = url;
    init = options;
    return new Response(JSON.stringify({ item: { id: "imp_1" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await retryImport("imp_1");

  assert.equal(input, "http://127.0.0.1:3333/imports/imp_1/retry");
  assert.equal(init?.method, "POST");
});

test("retryImport throws ApiError on failure", async () => {
  mockFetch(500, {});

  await assert.rejects(
    () => retryImport("imp_1"),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.message, "Failed to retry import.");
      return true;
    },
  );
});

test("deleteRecipe sends a DELETE request and succeeds on a 204 response", async () => {
  let input: unknown;
  let init: RequestInit | undefined;
  globalThis.fetch = async (url, options) => {
    input = url;
    init = options;
    return new Response(null, { status: 204 });
  };

  await deleteRecipe("rec_1");

  assert.equal(input, "http://127.0.0.1:3333/recipes/rec_1");
  assert.equal(init?.method, "DELETE");
});

test("deleteRecipe throws ApiError on failure", async () => {
  mockFetch(500, {});

  await assert.rejects(
    () => deleteRecipe("rec_1"),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.message, "Failed to delete recipe.");
      return true;
    },
  );
});

test("adjustRecipe sends a POST request and returns response payload", async () => {
  let input: unknown;
  let init: RequestInit | undefined;
  const payload = {
    kind: "message",
    message: "Quer que eu remova o glúten?",
  };
  globalThis.fetch = async (url, options) => {
    input = url;
    init = options;
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await adjustRecipe("rec_1", "session_abc", [
    { role: "user", content: "Remova glúten" },
  ]);

  assert.equal(input, "http://127.0.0.1:3333/recipes/rec_1/adjust");
  assert.equal(init?.method, "POST");
  assert.equal(init?.headers && (init.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.equal(
    init?.body,
    JSON.stringify({
      sessionId: "session_abc",
      messages: [{ role: "user", content: "Remova glúten" }],
    }),
  );
  assert.deepEqual(result, payload);
});

test("adjustRecipe throws ApiError combining message and detail from API", async () => {
  mockFetch(500, { message: "AI adjustment failed.", detail: "timeout from provider" });

  await assert.rejects(
    () => adjustRecipe("rec_1", "session_abc", [{ role: "user", content: "Teste" }]),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 500);
      assert.equal(err.message, "AI adjustment failed. — timeout from provider");
      return true;
    },
  );
});
