// components/CustomAlert.js
import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Vibration,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { C, rs, rf, cardShadow } from '../screens/travel-agent/_shared/theme';
import { DISPLAY } from '../screens/travel-agent/_shared/typography';

export default function CustomAlert({
  visible,
  type = 'success',          // 'success' | 'error' | 'warning' | 'info'
  title = '',
  message = '',
  onClose,
  okText = 'OK',
  // extras
  actions,                    // [{label, onPress, variant: 'primary'|'ghost', destructive?: boolean}]
  autoCloseMs,                // e.g. 2500
  haptics = true,
  dismissOnBackdrop = true,
  showCloseX = true,
}) {
  const palette = useMemo(
    () => ({
      success: { tint: C.tintEmerald, fg: C.emeraldDeep, icon: 'checkmark-circle', bar: C.emerald },
      error:   { tint: C.redL,        fg: C.red,          icon: 'close-circle',     bar: C.red },
      warning: { tint: C.orangeL,     fg: C.orange,        icon: 'alert-circle',     bar: C.orange },
      info:    { tint: C.tintOcean,   fg: C.ocean,          icon: 'information-circle', bar: C.ocean },
    }),
    []
  );
  const tone = palette[type] || palette.info;

  const backOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (haptics && Platform.OS === 'android') Vibration.vibrate(12);

      Animated.parallel([
        Animated.timing(backOpacity, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 220, mass: 0.6 }),
        Animated.timing(translateY, { toValue: 0, duration: 240, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();

      bar.setValue(0);
      if (autoCloseMs && autoCloseMs > 400) {
        Animated.timing(bar, { toValue: 1, duration: autoCloseMs, useNativeDriver: false, easing: Easing.linear })
          .start(({ finished }) => finished && onClose?.());
      }
    } else {
      backOpacity.setValue(0);
      scale.setValue(0.92);
      translateY.setValue(10);
      bar.setValue(0);
    }
  }, [visible]);

  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const renderedActions =
    actions && actions.length
      ? actions
      : [{ label: okText, onPress: onClose, variant: 'primary' }];

  return (
    <Modal transparent visible={!!visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backOpacity }]}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdropPress}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
          {!!autoCloseMs && (
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: tone.bar }]} />
            </View>
          )}

          {showCloseX && (
            <TouchableOpacity onPress={onClose} style={styles.closeX} hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}>
              <Ionicons name="close" size={rs(16)} color={C.sub} />
            </TouchableOpacity>
          )}

          <View style={[styles.iconWrap, { backgroundColor: tone.tint }]}>
            <Ionicons name={tone.icon} size={rs(32)} color={tone.fg} />
          </View>

          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.actionsRow}>
            {renderedActions.map((a, i) => {
              const isPrimary = a.variant === 'primary';
              const isGhost = a.variant === 'ghost';
              return (
                <TouchableOpacity
                  key={`${a.label}-${i}`}
                  activeOpacity={0.88}
                  style={[
                    styles.btn,
                    isPrimary && [styles.btnPrimary, { backgroundColor: a.destructive ? C.red : tone.bar }],
                    isGhost && styles.btnGhost,
                    a.destructive && !isPrimary && { borderColor: C.red },
                  ]}
                  onPress={() => a.onPress?.()}
                >
                  <Text
                    style={[
                      styles.btnTxt,
                      isPrimary ? styles.btnTxtPrimary : styles.btnTxtGhost,
                      a.destructive && !isPrimary && { color: C.red },
                    ]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: C.scrim },
  backdropPress: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: rs(20) },
  card: {
    width: '100%', maxWidth: rs(380), backgroundColor: C.card, borderRadius: rs(22),
    paddingHorizontal: rs(22), paddingTop: rs(26), paddingBottom: rs(18),
    borderWidth: 1, borderColor: C.border, position: 'relative', ...cardShadow,
  },
  barTrack: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, borderTopLeftRadius: rs(22), borderTopRightRadius: rs(22), overflow: 'hidden', backgroundColor: C.tintBorder },
  barFill: { height: '100%' },
  iconWrap: {
    alignSelf: 'center', height: rs(68), width: rs(68), borderRadius: rs(34),
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(14),
  },
  title: { fontFamily: DISPLAY, fontSize: rf(20), fontWeight: '700', textAlign: 'center', color: C.ink, letterSpacing: -0.2 },
  message: { fontSize: rf(14.5), textAlign: 'center', color: C.sub, marginTop: rs(8), lineHeight: rf(21) },
  actionsRow: { flexDirection: 'row', gap: rs(10), marginTop: rs(20) },
  btn: { flex: 1, height: rs(46), borderRadius: rs(14), borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { borderColor: 'transparent' },
  btnGhost: { backgroundColor: C.card },
  btnTxt: { fontWeight: '700', fontSize: rf(14.5) },
  btnTxtPrimary: { color: '#FFFFFF' },
  btnTxtGhost: { color: C.ink },
  closeX: {
    position: 'absolute', top: rs(12), right: rs(12), height: rs(28), width: rs(28), borderRadius: rs(14),
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.tintBorder, zIndex: 1,
  },
});
