import test from "node:test";
import assert from "node:assert/strict";
import { resolveButtonContainerStyle, resolveButtonLabelColor } from "./button-styles";
import { COLORS, RADIUS } from "./tokens";

// ─── Container styles ─────────────────────────────────────────────────────────

test("primary button has orange background and pill radius", () => {
  const s = resolveButtonContainerStyle("primary");
  assert.equal(s.backgroundColor, COLORS.laranja);
  assert.equal(s.borderRadius, RADIUS.pill);
  assert.equal(s.height, 48);
});

test("secondary button is transparent with brown border", () => {
  const s = resolveButtonContainerStyle("secondary");
  assert.equal(s.backgroundColor, "transparent");
  assert.equal(s.borderColor, COLORS.marrom);
  assert.equal(s.borderWidth, 1.5);
  assert.equal(s.borderRadius, RADIUS.pill);
});

test("tertiary button has bege background", () => {
  const s = resolveButtonContainerStyle("tertiary");
  assert.equal(s.backgroundColor, COLORS.bege);
  assert.equal(s.borderRadius, RADIUS.pill);
});

test("ghost button is fully transparent without border", () => {
  const s = resolveButtonContainerStyle("ghost");
  assert.equal(s.backgroundColor, "transparent");
  assert.equal(s.borderWidth, 0);
});

test("all button variants share height 48 and pill radius", () => {
  for (const v of ["primary", "secondary", "tertiary", "ghost"] as const) {
    const s = resolveButtonContainerStyle(v);
    assert.equal(s.height, 48, `${v} height`);
    assert.equal(s.borderRadius, RADIUS.pill, `${v} borderRadius`);
  }
});

// ─── Label color ─────────────────────────────────────────────────────────────

test("primary button label is white", () => {
  assert.equal(resolveButtonLabelColor("primary"), COLORS.white);
});

test("secondary button label is marrom", () => {
  assert.equal(resolveButtonLabelColor("secondary"), COLORS.marrom);
});

test("tertiary button label is marrom", () => {
  assert.equal(resolveButtonLabelColor("tertiary"), COLORS.marrom);
});

test("ghost button label is marrom", () => {
  assert.equal(resolveButtonLabelColor("ghost"), COLORS.marrom);
});
