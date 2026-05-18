import test from "node:test";
import assert from "node:assert/strict";
import { resolveTextStyle } from "./text-styles";
import { COLORS, TYPE_SCALE, FONTS } from "./tokens";

test("resolveTextStyle display uses Baloo 800, 36px, tight line height", () => {
  const s = resolveTextStyle("display");
  assert.equal(s.fontFamily, FONTS.display);
  assert.equal(s.fontSize, TYPE_SCALE.display);
  assert.equal(s.fontWeight, "800");
  assert.equal(s.color, COLORS.marrom);
});

test("resolveTextStyle h1 uses Baloo 700, 28px", () => {
  const s = resolveTextStyle("h1");
  assert.equal(s.fontFamily, FONTS.displayBold);
  assert.equal(s.fontSize, TYPE_SCALE.h1);
  assert.equal(s.fontWeight, "700");
});

test("resolveTextStyle h2 uses Baloo 700, 22px", () => {
  const s = resolveTextStyle("h2");
  assert.equal(s.fontFamily, FONTS.displayBold);
  assert.equal(s.fontSize, TYPE_SCALE.h2);
});

test("resolveTextStyle h3 uses Nunito 700, 18px", () => {
  const s = resolveTextStyle("h3");
  assert.equal(s.fontFamily, FONTS.uiBold);
  assert.equal(s.fontSize, TYPE_SCALE.h3);
});

test("resolveTextStyle body uses Nunito 400, 16px", () => {
  const s = resolveTextStyle("body");
  assert.equal(s.fontFamily, FONTS.ui);
  assert.equal(s.fontSize, TYPE_SCALE.body);
  assert.equal(s.fontWeight, "400");
});

test("resolveTextStyle bodySm uses 14px and marromSoft color", () => {
  const s = resolveTextStyle("bodySm");
  assert.equal(s.fontSize, TYPE_SCALE.bodySm);
  assert.equal(s.color, COLORS.marromSoft);
});

test("resolveTextStyle caption uses 12px, SemiBold, muted color", () => {
  const s = resolveTextStyle("caption");
  assert.equal(s.fontSize, TYPE_SCALE.caption);
  assert.equal(s.fontWeight, "600");
});

test("resolveTextStyle label uses Nunito SemiBold, 14px", () => {
  const s = resolveTextStyle("label");
  assert.equal(s.fontFamily, FONTS.uiSemiBold);
  assert.equal(s.fontSize, TYPE_SCALE.bodySm);
  assert.equal(s.color, COLORS.marrom);
});

test("resolveTextStyle eyebrow uses Baloo uppercase with letter spacing", () => {
  const s = resolveTextStyle("eyebrow");
  assert.equal(s.fontFamily, FONTS.displayBold);
  assert.ok((s.letterSpacing ?? 0) > 0.05, "eyebrow needs letter-spacing");
  assert.equal(s.textTransform, "uppercase");
});
