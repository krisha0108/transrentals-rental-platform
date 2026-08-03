// screens/travel-agent/_shared/theme.js
// Single source of truth for the Travel Agent "Elevate" design language.
//
// These values were previously copy-pasted into every screen's local `const C`
// (45 duplicates, which is how #059669-era colours survived in a few corners).
// The canonical set lives here now — it is lifted verbatim from
// TravelAgentDashboardScreen, which is the reference implementation.
//
// Usage:
//   import { C, G, TONES, rs, rf, GUT, shade, cardShadow } from "../_shared/theme";
//
// Pair it with DISPLAY from ./typography — the TA language is serif-first.
import { Dimensions, Platform } from "react-native";

const { width: W } = Dimensions.get("window");

// ── Responsive scaling ───────────────────────────────────────────────
// Layouts are designed against a 390dp baseline and scaled to device width,
// clamped so nothing gets extreme on small phones or tablets.
//   rs() → spacing / sizes / radii   ·   rf() → fonts (gentler curve)
const BASE_W = 390;
const SCALE = Math.min(Math.max(W / BASE_W, 0.86), 1.28);
const FONT_SCALE = Math.min(Math.max(W / BASE_W, 0.92), 1.12);

export const SCREEN_W = W;
export const rs = (n) => Math.round(n * SCALE);
export const rf = (n) => Math.round(n * FONT_SCALE * 2) / 2; // half-px precision

/** Standard screen gutter. */
export const GUT = rs(16);
/** Wider gutter used by the dashboard's bento grid. */
export const GUT_WIDE = rs(20);

// ── Palette (Lovable OKLCH palette → hex approximations) ─────────────
export const C = {
  ivory:       "#F7F5EF",
  bg:          "#F7F4EE",
  sand:        "#EBE4D5",
  ink:         "#13211C",
  forest:      "#16382E",
  forestDark:  "#0F2A22",
  emeraldDeep: "#1C6B52",
  emerald:     "#2E9E78",
  ocean:       "#2C6E8C",
  oceanLight:  "#4A9DBE",
  gold:        "#DDA33F",
  goldLight:   "#F0B85A",
  card:        "#FFFFFF",
  glass:       "rgba(255,255,255,0.74)",
  glassBorder: "rgba(255,255,255,0.65)",
  border:      "rgba(20,56,46,0.09)",
  text:        "#13211C",
  sub:         "#586B63",
  muted:       "#8B968F",
  red:         "#C0453B",
  redL:        "#FBEDEB",
  orange:      "#C77A2E",
  orangeL:     "#FBF1E6",
  blue:        "#2C6E8C",
  plum:        "#5E43A8",
  plumLight:   "#8A6DD4",
  rose:        "#C65772",
  roseLight:   "#E88AA0",
  // Indigo is not one of the five Elevate tones, but four screens (Earnings,
  // Payments, More, Self-booking detail) use it *alongside* plum to separate
  // two accents, so folding it into plum would collapse a real distinction.
  indigo:      "#5B6AAE",
  tintIndigo:  "#E6E9F5",
  // Brand colour, not a palette tone — fixed by WhatsApp, never restyled.
  whatsapp:    "#25D366",
  // Shadow ink. Screens were hand-writing `shadowColor: "#1F2A24"` inline while
  // cardShadow/rowShadow below used "#0B3327"; this is the one value.
  shadow:      "#0B3327",
  // Soft accent tints — light card fills for visual variety.
  tintEmerald: "#E7F1EC",
  tintGold:    "#F8F0DC",
  tintOcean:   "#E6EFF4",
  tintSand:    "#F2EBDB",
  tintPlum:    "#EFE9FA",
  tintRose:    "#FBE9EE",
  tintBorder:  "rgba(20,56,46,0.06)",
};

// ── Gradient presets ─────────────────────────────────────────────────
export const G = {
  hero:    [C.forestDark, C.forest, C.emeraldDeep],
  emerald: [C.emerald, C.emeraldDeep],
  gold:    [C.goldLight, C.gold],
  ocean:   [C.oceanLight, "#245C7A"],
  sand:    ["#F3EDDF", "#E7DDC8"],
  // Status heroes — warm-palette equivalents of the old blue/red headers.
  review:  ["#123545", "#1D4F66", C.ocean],
  danger:  ["#4A1A16", "#7A2A23", C.red],
};

// ── Accent tones for tiles / icon chips ──────────────────────────────
// Each tone = icon gradient + soft pill tint + readable ink.
export const TONES = {
  emerald: { grad: [C.emerald, C.emeraldDeep],   tint: C.tintEmerald, ink: C.emeraldDeep },
  ocean:   { grad: [C.oceanLight, "#245C7A"],    tint: C.tintOcean,   ink: "#245C7A" },
  amber:   { grad: [C.goldLight, C.gold],        tint: C.tintGold,    ink: "#9A6B16" },
  plum:    { grad: [C.plumLight, C.plum],        tint: C.tintPlum,    ink: C.plum },
  rose:    { grad: [C.roseLight, C.rose],        tint: C.tintRose,    ink: "#B14A64" },
};

// ── Shared shadows ───────────────────────────────────────────────────
/** Soft floating-card shadow used by glass/white cards. */
export const cardShadow = Platform.select({
  ios: {
    shadowColor: "#0B3327",
    shadowOpacity: 0.1,
    shadowRadius: rs(14),
    shadowOffset: { width: 0, height: rs(6) },
  },
  android: { elevation: 4 },
  default: {},
});

/** Tighter shadow for list rows / small cards. */
export const rowShadow = Platform.select({
  ios: {
    shadowColor: "#0B3327",
    shadowOpacity: 0.06,
    shadowRadius: rs(6),
    shadowOffset: { width: 0, height: rs(2) },
  },
  android: { elevation: 2 },
  default: {},
});

// ── Helpers ──────────────────────────────────────────────────────────
/**
 * Lighten (pct > 0) or darken (pct < 0) a #rrggbb hex by a percentage.
 * Used to derive the second stop of a two-stop gradient from a single accent.
 */
export function shade(hex, pct) {
  const f = parseInt(String(hex).slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16;
  const Gc = (f >> 8) & 0xff;
  const B = f & 0xff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - Gc) * p) + Gc) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/** `rgba()` from a #rrggbb hex + alpha — for tints that must stay translucent. */
export function alpha(hex, a) {
  const f = parseInt(String(hex).slice(1), 16);
  return `rgba(${f >> 16}, ${(f >> 8) & 0xff}, ${f & 0xff}, ${a})`;
}

// ── Screen palette (SC) ──────────────────────────────────────────────
// The names the screens actually use, pointed at the canonical tokens above.
//
// The screens were built before this file existed, so each one carried its own
// `const C = {…}` with its own vocabulary — `ink`/`text`/`subText` for the type
// ramp, `blue` for what the palette calls ocean, `emerald500/600/700` for the
// green ramp, `purple` for plum. Nine screens had already started mapping those
// names onto the theme by hand, which is how the same key ended up meaning two
// different colours (`amber` was T.gold in Fleet and TONES.amber.ink in Social;
// `purple` was T.plum in one and T.plumLight in the other).
//
// Rather than rewrite ~5 000 call sites, the mapping lives here once and every
// screen imports it:
//
//   import { SC as C } from "../_shared/theme";
//
// A screen therefore cannot hold a colour of its own any more — change a value
// above and all 34 screens move together.
export const SC = {
  // Type ramp. `ink` is the heading, `text` the body, `subText` the muted line.
  ink: C.text,
  text: C.sub,
  subText: C.muted,
  sub: C.sub,
  muted: C.muted,

  // Surfaces
  bg: C.bg,
  card: C.card,
  border: C.border,
  field: C.ivory,
  ivory: C.ivory,
  sand: C.sand,
  glass: C.glass,
  glassBorder: C.glassBorder,
  tintBorder: C.tintBorder,
  tintSand: C.tintSand,

  // Green ramp
  emerald: C.emerald,
  emerald500: C.emerald,
  emerald600: C.emeraldDeep,
  emerald700: C.forest,
  emerald50: C.tintEmerald,
  emeraldDeep: C.emeraldDeep,
  forest: C.forest,
  forestDark: C.forestDark,
  tintEmerald: C.tintEmerald,
  green: C.emeraldDeep,
  greenLight: C.tintEmerald,
  // Misnamed in three screens — the values behind `indigo600/700/50` were the
  // emerald ramp, not indigo. Mapped to what they actually were.
  indigo600: C.emeraldDeep,
  indigo700: C.forest,
  indigo50: C.tintEmerald,

  // Ocean (screens call it blue/teal)
  blue: C.ocean,
  teal: C.ocean,
  ocean: C.ocean,
  oceanLight: C.oceanLight,
  blueLight: C.tintOcean,
  tintOcean: C.tintOcean,

  // Gold / amber. `gold` is the decorative gold; `amber` is the readable ink —
  // it is used as text 28 times, and the bright gold fails contrast at 13dp.
  gold: C.gold,
  goldLight: C.goldLight,
  tintGold: C.tintGold,
  amber: TONES.amber.ink,
  amberLight: C.tintGold,
  orange: C.orange,
  orangeL: C.orangeL,

  // Violets
  purple: C.plum,
  plum: C.plum,
  plumLight: C.plumLight,
  purpleLight: C.tintPlum,
  tintPlum: C.tintPlum,
  indigo: C.indigo,
  indigoLight: C.tintIndigo,

  // Reds
  red: C.red,
  redLight: C.redL,
  redL: C.redL,
  rose: C.rose,
  roseLight: C.roseLight,
  tintRose: C.tintRose,

  // Brand
  whatsapp: C.whatsapp,
  wa: C.whatsapp,

  shadow: C.shadow,
};
