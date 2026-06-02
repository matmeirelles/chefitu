import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PROFILE } from "./profile.js";

test("DEFAULT_PROFILE uses Mateus and default email", () => {
  assert.equal(DEFAULT_PROFILE.displayName, "Mateus");
  assert.equal(DEFAULT_PROFILE.email, "mat.meirelles1991@gmail.com");
  assert.equal(DEFAULT_PROFILE.avatarUri, null);
});
