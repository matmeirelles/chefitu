import type { ImageSourcePropType } from "react-native";

/** Full-body mascot stickers (Chefitu grandinho) — `assets/stickers/`. */
export type MascotStickerId =
  | "angry"
  | "cheering"
  | "confused"
  | "firedUp"
  | "grateful"
  | "hi"
  | "okSign"
  | "pointing"
  | "reading"
  | "ready"
  | "sad"
  | "serving"
  | "sleeping"
  | "spoon"
  | "surprised"
  | "tasting"
  | "thinking"
  | "thumbsUp"
  | "waving"
  | "whisking"
  | "worried";

export const MASCOT_STICKERS: Record<MascotStickerId, ImageSourcePropType> = {
  angry: require("./assets/stickers/mascot-angry.png"),
  cheering: require("./assets/stickers/mascot-cheering.png"),
  confused: require("./assets/stickers/mascot-confused.png"),
  firedUp: require("./assets/stickers/mascot-fired-up.png"),
  grateful: require("./assets/stickers/mascot-grateful.png"),
  hi: require("./assets/stickers/mascot-hi.png"),
  okSign: require("./assets/stickers/mascot-ok-sign.png"),
  pointing: require("./assets/stickers/mascot-pointing.png"),
  reading: require("./assets/stickers/mascot-reading.png"),
  ready: require("./assets/stickers/mascot-ready.png"),
  sad: require("./assets/stickers/mascot-sad.png"),
  serving: require("./assets/stickers/mascot-serving.png"),
  sleeping: require("./assets/stickers/mascot-sleeping.png"),
  spoon: require("./assets/stickers/mascot-spoon.png"),
  surprised: require("./assets/stickers/mascot-surprised.png"),
  tasting: require("./assets/stickers/mascot-tasting.png"),
  thinking: require("./assets/stickers/mascot-thinking.png"),
  thumbsUp: require("./assets/stickers/mascot-thumbs-up.png"),
  waving: require("./assets/stickers/mascot-waving.png"),
  whisking: require("./assets/stickers/mascot-whisking.png"),
  worried: require("./assets/stickers/mascot-worried.png"),
};

/** Logo / food / small decorative stickers — `assets/illustrations/`. */
export const MASCOT_SYMBOL = require("./assets/illustrations/mascot-symbol.png") as number;
export const LOGO_FULL = require("./assets/illustrations/logo-full.png") as number;
export const LOGO_HORIZONTAL = require("./assets/illustrations/logo-horizontal.png") as number;

/** Sticker at the top of import result sheets. */
export type ImportFlowStickerKind = "success" | "failed" | "no_recipe";

export const IMPORT_FLOW_STICKER_SIZE = 168;

/** Mascot id per import result state. */
export const IMPORT_FLOW_STICKER_BY_KIND: Record<ImportFlowStickerKind, MascotStickerId> = {
  success: "cheering",
  failed: "worried",
  no_recipe: "confused",
};

export const IMPORT_FLOW_STICKERS: Record<ImportFlowStickerKind, ImageSourcePropType> = {
  success: MASCOT_STICKERS[IMPORT_FLOW_STICKER_BY_KIND.success],
  failed: MASCOT_STICKERS[IMPORT_FLOW_STICKER_BY_KIND.failed],
  no_recipe: MASCOT_STICKERS[IMPORT_FLOW_STICKER_BY_KIND.no_recipe],
};

/** Mascot for the import progress banner while loading. */
export const IMPORT_LOADING_STICKER_ID: MascotStickerId = "reading";
export const IMPORT_LOADING_STICKER = MASCOT_STICKERS[IMPORT_LOADING_STICKER_ID];
