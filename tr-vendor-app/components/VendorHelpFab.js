// components/VendorHelpFab.js
// Floating "Help Assistant" launcher — app parity with the web's
// VendorHelpBotWidget.tsx toggle button (fixed bottom-right, every page).
// Tapping it opens screens/vendor/support/HelpAssistantScreen.js. Rendered
// once at the App.js root (a sibling of NavigationContainer, not inside any
// one screen) so it floats over every vendor screen; App.js decides when to
// hide it (auth-less Splash/Onboarding, the assistant screen itself, and the
// unrelated travel-agent flow, which has its own separate entry point).
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { G } from '../screens/vendor/_shared/theme';

// Height of the floating pill tab bar drawn by CustomTabBar in App.js
// (tabBarContainer/tabBarInner) — kept above it here so the two never
// overlap. That bar draws at a fixed distance from the screen edge
// (it doesn't add its own safe-area inset), so this is a flat value too,
// not insets-based, on the 5 tab screens (Dashboard/Bookings/B2B/Chats/
// Profile). Everywhere else there's no tab bar, so the FAB sits just above
// the safe area instead.
const TAB_BAR_CLEARANCE = 124;

export default function VendorHelpFab({ onPress, aboveTabBar }) {
  const insets = useSafeAreaInsets();
  const bottom = aboveTabBar ? TAB_BAR_CLEARANCE : insets.bottom + 16;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.wrap, { bottom, right: 16 }]}
    >
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inner}>
        <Ionicons name="sparkles" size={22} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    zIndex: 999, elevation: 12,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  inner: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
});
