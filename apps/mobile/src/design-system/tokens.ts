export const COLORS = {
  marrom:       "#4A2C1A",
  marromSoft:   "#6B4530",
  marromFaint:  "rgba(74, 44, 26, 0.10)",
  creme:        "#FFF6E9",
  cremeDeep:    "#FBEFDC",
  laranja:      "#FF8A2B",
  laranjaDark:  "#E5751A",
  laranjaSoft:  "#FFE3C7",
  verdeFolha:   "#7DBA4D",
  verdeDark:    "#5E9633",
  salvia:       "#CFE2CF",
  salviaDeep:   "#B8D1B8",
  bege:         "#F6EAD7",
  begeDeep:     "#EDDCBF",
  coracao:      "#FF6B2C",
  white:        "#FFFFFF",
  danger:       "#D9534F",
  dangerBg:     "#F8DAD9",
  warning:      "#F2A93B",
  warningBg:    "#FFE9C7",
} as const;

export const SPACING = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const RADIUS = {
  xs:    8,
  sm:    12,
  card:  16,
  input: 20,
  sheet: 24,
  xl:    32,
  pill:  999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor:   COLORS.marrom,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  6,
    elevation:     1,
  },
  md: {
    shadowColor:   COLORS.marrom,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius:  24,
    elevation:     4,
  },
  lg: {
    shadowColor:   COLORS.marrom,
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius:  40,
    elevation:     8,
  },
  cta: {
    shadowColor:   COLORS.laranja,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius:  16,
    elevation:     4,
  },
} as const;

export const MOTION = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

export const FONTS = {
  display: "Baloo2_800ExtraBold",
  displayBold: "Baloo2_700Bold",
  ui: "Nunito_400Regular",
  uiSemiBold: "Nunito_600SemiBold",
  uiBold: "Nunito_700Bold",
  uiExtraBold: "Nunito_800ExtraBold",
} as const;

export const TYPE_SCALE = {
  display: 36,
  h1:      28,
  h2:      22,
  h3:      18,
  body:    16,
  bodySm:  14,
  caption: 12,
} as const;

export const LINE_HEIGHT = {
  tight: 1.15,
  snug:  1.30,
  base:  1.45,
  loose: 1.55,
} as const;
