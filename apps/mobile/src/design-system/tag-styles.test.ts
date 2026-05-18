import test from "node:test";
import assert from "node:assert/strict";
import { resolveTagStyle } from "./tag-styles";
import { COLORS, RADIUS } from "./tokens";

test("orange tag has laranjaSoft background and marrom text", () => {
  const s = resolveTagStyle("orange");
  assert.equal(s.container.backgroundColor, COLORS.laranjaSoft);
  assert.equal(s.label.color, COLORS.marrom);
  assert.equal(s.container.borderRadius, RADIUS.pill);
});

test("green tag has salvia background and verdeDark text", () => {
  const s = resolveTagStyle("green");
  assert.equal(s.container.backgroundColor, COLORS.salvia);
  assert.equal(s.label.color, COLORS.verdeDark);
});

test("brown tag has bege background and marrom text", () => {
  const s = resolveTagStyle("brown");
  assert.equal(s.container.backgroundColor, COLORS.bege);
  assert.equal(s.label.color, COLORS.marrom);
});

test("all tag variants share pill radius and correct padding", () => {
  for (const v of ["orange", "green", "brown"] as const) {
    const { container } = resolveTagStyle(v);
    assert.equal(container.borderRadius, RADIUS.pill, `${v} pill radius`);
    assert.ok((container.paddingHorizontal as number) >= 8, `${v} has horizontal padding`);
  }
});
