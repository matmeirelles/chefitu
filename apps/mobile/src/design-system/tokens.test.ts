import test from "node:test";
import assert from "node:assert/strict";
import { COLORS, SPACING, RADIUS, SHADOWS, MOTION } from "./tokens";

// ─── Colors ──────────────────────────────────────────────────────────────────

test("COLORS.marrom is chocolate brown", () => {
  assert.equal(COLORS.marrom, "#4A2C1A");
});

test("COLORS.creme is the app background cream", () => {
  assert.equal(COLORS.creme, "#FFF6E9");
});

test("COLORS.laranja is the primary warm orange", () => {
  assert.equal(COLORS.laranja, "#FF8A2B");
});

test("COLORS.laranjaDark is the pressed/hover orange", () => {
  assert.equal(COLORS.laranjaDark, "#E5751A");
});

test("COLORS.laranjaSoft is the soft orange background", () => {
  assert.equal(COLORS.laranjaSoft, "#FFE3C7");
});

test("COLORS.verdeFolha is leaf green", () => {
  assert.equal(COLORS.verdeFolha, "#7DBA4D");
});

test("COLORS.salvia is soft sage", () => {
  assert.equal(COLORS.salvia, "#CFE2CF");
});

test("COLORS.bege is warm beige for cards", () => {
  assert.equal(COLORS.bege, "#F6EAD7");
});

test("COLORS.coracao is heart orange/red for favorites", () => {
  assert.equal(COLORS.coracao, "#FF6B2C");
});

test("COLORS.marromSoft is slightly lighter brown for secondary text", () => {
  assert.equal(COLORS.marromSoft, "#6B4530");
});

test("COLORS.danger is the error/delete red", () => {
  assert.equal(COLORS.danger, "#D9534F");
});

// ─── Spacing ─────────────────────────────────────────────────────────────────

test("SPACING uses 4px base scale", () => {
  assert.equal(SPACING[1], 4);
  assert.equal(SPACING[2], 8);
  assert.equal(SPACING[3], 12);
  assert.equal(SPACING[4], 16);
  assert.equal(SPACING[6], 24);
  assert.equal(SPACING[8], 32);
});

// ─── Border radius ────────────────────────────────────────────────────────────

test("RADIUS.pill is 999 for buttons and chips", () => {
  assert.equal(RADIUS.pill, 999);
});

test("RADIUS.card is 16 for recipe cards", () => {
  assert.equal(RADIUS.card, 16);
});

test("RADIUS.input is 20 for text inputs", () => {
  assert.equal(RADIUS.input, 20);
});

test("RADIUS.sheet is 24 for bottom sheets and modals", () => {
  assert.equal(RADIUS.sheet, 24);
});

// ─── Shadows ─────────────────────────────────────────────────────────────────

test("SHADOWS.sm has brown-tinted shadowColor", () => {
  assert.equal(SHADOWS.sm.shadowColor, "#4A2C1A");
  assert.equal(SHADOWS.sm.shadowOffset.width, 0);
  assert.equal(SHADOWS.sm.shadowOffset.height, 2);
  assert.equal(SHADOWS.sm.shadowOpacity, 0.06);
  assert.equal(SHADOWS.sm.shadowRadius, 6);
  assert.equal(SHADOWS.sm.elevation, 1);
});

test("SHADOWS.md has correct elevation for cards", () => {
  assert.equal(SHADOWS.md.shadowOffset.height, 8);
  assert.equal(SHADOWS.md.shadowOpacity, 0.08);
  assert.equal(SHADOWS.md.elevation, 4);
});

test("SHADOWS.lg has correct elevation for modals", () => {
  assert.equal(SHADOWS.lg.shadowOffset.height, 16);
  assert.equal(SHADOWS.lg.shadowOpacity, 0.12);
  assert.equal(SHADOWS.lg.elevation, 8);
});

test("SHADOWS.cta has orange-tinted shadow for primary buttons", () => {
  assert.equal(SHADOWS.cta.shadowColor, "#FF8A2B");
  assert.equal(SHADOWS.cta.shadowOpacity, 0.32);
});

// ─── Motion ──────────────────────────────────────────────────────────────────

test("MOTION.fast is 150ms", () => {
  assert.equal(MOTION.fast, 150);
});

test("MOTION.base is 220ms", () => {
  assert.equal(MOTION.base, 220);
});
