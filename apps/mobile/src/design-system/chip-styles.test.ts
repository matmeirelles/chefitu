import test from "node:test";
import assert from "node:assert/strict";
import { resolveChipStyle } from "./chip-styles";
import { COLORS, RADIUS } from "./tokens";

test("active chip has laranjaSoft background and laranja border", () => {
  const s = resolveChipStyle(true);
  assert.equal(s.container.backgroundColor, COLORS.laranjaSoft);
  assert.equal(s.container.borderColor, COLORS.laranja);
  assert.equal(s.container.borderWidth, 1.5);
});

test("inactive chip has white background and no border", () => {
  const s = resolveChipStyle(false);
  assert.equal(s.container.backgroundColor, COLORS.white);
  assert.equal(s.container.borderWidth, 0);
});

test("active chip label is laranja colored", () => {
  const s = resolveChipStyle(true);
  assert.equal(s.label.color, COLORS.laranja);
});

test("inactive chip label is marrom colored", () => {
  const s = resolveChipStyle(false);
  assert.equal(s.label.color, COLORS.marrom);
});

test("both chip states have pill radius", () => {
  assert.equal(resolveChipStyle(true).container.borderRadius, RADIUS.pill);
  assert.equal(resolveChipStyle(false).container.borderRadius, RADIUS.pill);
});
