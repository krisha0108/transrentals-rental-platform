// components/AppHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const C = {
  ink: '#0F1720',
  bg: '#F4F6F8',
  card: '#FFFFFF',
  border: '#E6EBF0',
  brand: '#1FC77A',
};

const HEADERBAR_HEIGHT = 54; // content height (excluding safe top)

/** Hook: get top padding for page content to not hide under fixed header */
export const useHeaderPaddingTop = (extra = 8) => {
  const insets = useSafeAreaInsets();
  return insets.top + HEADERBAR_HEIGHT + extra;
};

/** Sticky header component (fixed at top) */
export default function AppHeader({
  title = '',
  showBack = true,
  onBack,
  showBell = true,
  onBellPress,
  bellDot = true,
  showAvatar = true,
  avatarUri = 'https://i.pravatar.cc/100?img=15',
  onAvatarPress,
  // style overrides
  backgroundColor = C.card,
  borderColor = C.border,
  textColor = C.ink,
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.wrap,
        {
          backgroundColor,
          paddingTop: insets.top,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.bar}>
        {/* Left */}
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color={textColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, { color: textColor }]}
        >
          {title}
        </Text>

        {/* Right */}
        <View style={styles.right}>
          {showBell && (
            <TouchableOpacity onPress={onBellPress} style={styles.iconBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={22} color={textColor} />
              {bellDot ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
          )}
          {/* {showAvatar && (
            <TouchableOpacity onPress={onAvatarPress} style={styles.avatarWrap} activeOpacity={0.8}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    // subtle elevation
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.07 : 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bar: {
    height: HEADERBAR_HEIGHT,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  right: { width: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: C.border,
  },
  dot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 999, backgroundColor: '#FF4D4D',
    borderWidth: 1, borderColor: '#fff',
  },
  avatarWrap: {
    width: 36, height: 36, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#fff', borderWidth: 1, borderColor: C.border,
  },
  avatar: { width: '100%', height: '100%' },
});
