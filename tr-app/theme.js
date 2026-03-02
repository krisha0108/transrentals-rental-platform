// Shared Design System — Change colors here, reflects everywhere
import { Platform } from 'react-native';

// Primary Teal Palette
export const TEAL_DEEP = '#064E3B';
export const TEAL_MID = '#065F46';
export const TEAL = '#10B981';
export const TEAL_LIGHT = '#D1FAE5';

// Backgrounds & Cards
export const BG = '#F5F7FA';
export const CARD = '#FFFFFF';

// Text Colors
export const TEXT_PRIMARY = '#111827';
export const TEXT_SECONDARY = '#6B7280';
export const TEXT_MUTED = '#9CA3AF';

// Shadows
export const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  android: { elevation: 3 },
});

export const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  android: { elevation: 5 },
});
