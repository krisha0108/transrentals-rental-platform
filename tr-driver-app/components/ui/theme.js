/**
 * One place for the colours and spacing the whole driver app already used.
 *
 * Every screen had its own private `BRAND` / `C` object with the same hex
 * codes copy-pasted into it, which is why popups drifted away from the rest
 * of the UI. Shared components import from here so a popup can never again
 * be a different green from the screen behind it.
 */
import { Dimensions, PixelRatio } from 'react-native';

export const COLORS = {
  // Brand greens — the header gradient runs dark → primary.
  primary: '#16A34A',
  primaryDark: '#064E3B',
  primaryDeep: '#043927',
  primaryMid: '#0D7A4E',
  primarySoft: '#F0FDF4',
  primaryBorder: '#BBF7D0',

  // Accents already in use across the app.
  orange: '#EA580C',
  orangeSoft: '#FFF7ED',
  amber: '#F59E0B',
  amberSoft: '#FFFBEB',
  blue: '#3B82F6',
  blueSoft: '#EFF6FF',
  purple: '#9333EA',
  purpleSoft: '#F5F3FF',
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerSoft: '#FEF2F2',
  success: '#10B981',

  // Neutrals.
  text: '#0F172A',
  subText: '#64748B',
  muted: '#94A3B8',
  faint: '#CBD5E1',
  border: '#E2E8F0',
  bg: '#F0F4F8',
  card: '#FFFFFF',
  white: '#FFFFFF',
  backdrop: 'rgba(8, 20, 15, 0.55)',
};

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

/**
 * Font/px scaling against a 390pt-wide reference (iPhone 13 / common Android).
 *
 * Clamped both ways: below 0.88 text stops being readable on a small phone,
 * above 1.18 a tablet ends up with comically large alert text.
 */
const GUIDELINE_WIDTH = 390;

export function scaleFor(width, size) {
  const ratio = Math.min(Math.max(width / GUIDELINE_WIDTH, 0.88), 1.18);
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

export function scale(size) {
  return scaleFor(Dimensions.get('window').width, size);
}

export const SHADOW = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  button: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 7,
  },
};
