// import React from 'react';
// import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// export default function CustomAlert({
//   visible,
//   type = 'success', // 'success' | 'error' | 'warning' | 'info'
//   title = '',
//   message = '',
//   onClose,
//   okText = 'OK',
// }) {
//   const palette = {
//     success: { bg: '#E9F8EF', fg: '#067647', icon: 'checkmark-circle-outline', ring: '#B7F0C0' },
//     error: { bg: '#FEECEC', fg: '#B42318', icon: 'close-circle-outline', ring: '#F2B8B5' },
//     warning: { bg: '#FFF7E6', fg: '#B54708', icon: 'alert-circle-outline', ring: '#FED7AA' },
//     info: { bg: '#EEF4FF', fg: '#1849A9', icon: 'information-circle-outline', ring: '#C7D7FE' },
//   };
//   const tone = palette[type] || palette.info;

//   return (
//     <Modal transparent visible={!!visible} animationType="fade" onRequestClose={onClose}>
//       <View style={styles.backdrop}>
//         <View style={styles.card}>
//           <View style={[styles.iconWrap, { backgroundColor: tone.bg, borderColor: tone.ring }]}>
//             <Ionicons name={tone.icon} size={28} color={tone.fg} />
//           </View>
//           {!!title && <Text style={[styles.title, { color: '#111827' }]}>{title}</Text>}
//           {!!message && <Text style={[styles.message, { color: '#475467' }]}>{message}</Text>}

//           <TouchableOpacity onPress={onClose} activeOpacity={0.9} style={[styles.okBtn]}> 
//             <Text style={styles.okTxt}>{okText}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   backdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   card: {
//     width: '100%',
//     maxWidth: 360,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     paddingHorizontal: 18,
//     paddingTop: 22,
//     paddingBottom: 12,
//     elevation: 8,
//   },
//   iconWrap: {
//     alignSelf: 'center',
//     height: 64,
//     width: 64,
//     borderRadius: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '800',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   message: {
//     fontSize: 14,
//     textAlign: 'center',
//     marginTop: 8,
//     lineHeight: 20,
//   },
//   okBtn: {
//     marginTop: 16,
//     marginBottom: 4,
//     backgroundColor: '#16A34A',
//     borderRadius: 10,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   okTxt: { color: '#fff', fontWeight: '800' },
// });
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
      success: { bg: '#F0FFF6', fg: '#067647', icon: 'checkmark-circle-outline', ring: '#B7F0C0', bar: '#22C55E' },
      error:   { bg: '#FFF1F1', fg: '#B42318', icon: 'close-circle-outline',     ring: '#F2B8B5', bar: '#EF4444' },
      warning: { bg: '#FFFAEB', fg: '#B54708', icon: 'alert-circle-outline',     ring: '#FED7AA', bar: '#F59E0B' },
      info:    { bg: '#EEF4FF', fg: '#1849A9', icon: 'information-circle-outline', ring: '#C7D7FE', bar: '#3B82F6' },
    }),
    []
  );
  const tone = palette[type] || palette.info;

  const backOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (haptics && Platform.OS === 'android') Vibration.vibrate(12);

      Animated.parallel([
        Animated.timing(backOpacity, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 210, mass: 0.6 }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();

      bar.setValue(0);
      if (autoCloseMs && autoCloseMs > 400) {
        Animated.timing(bar, { toValue: 1, duration: autoCloseMs, useNativeDriver: false, easing: Easing.linear })
          .start(({ finished }) => finished && onClose?.());
      }
    } else {
      backOpacity.setValue(0);
      scale.setValue(0.92);
      translateY.setValue(8);
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
        <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }], shadowOpacity: 0.18 }]}>
          {!!autoCloseMs && (
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: tone.bar }]} />
            </View>
          )}

          <View style={[styles.iconWrap, { backgroundColor: tone.bg, borderColor: tone.ring }]}>
            <Ionicons name={tone.icon} size={30} color={tone.fg} />
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
                  activeOpacity={0.9}
                  style={[
                    styles.btn,
                    isPrimary && [styles.btnPrimary, { backgroundColor: tone.bar }],
                    isGhost && styles.btnGhost,
                    a.destructive && !isPrimary && { borderColor: '#EF4444' },
                  ]}
                  onPress={() => a.onPress?.()}
                >
                  <Text
                    style={[
                      styles.btnTxt,
                      isPrimary ? styles.btnTxtPrimary : styles.btnTxtGhost,
                      a.destructive && !isPrimary && { color: '#EF4444' },
                    ]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showCloseX && (
            <TouchableOpacity onPress={onClose} style={styles.closeX} hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}>
              <Ionicons name="close" size={18} color="#4B5563" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropPress: { flex: 1 },
  centerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 18,
    paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14,
    elevation: 10, shadowColor: '#000', shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, position: 'relative',
  },
  barTrack: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  barFill: { height: '100%' },
  iconWrap: { alignSelf: 'center', height: 64, width: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: '#111827', marginTop: 2 },
  message: { fontSize: 14, textAlign: 'center', color: '#475467', marginTop: 8, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { borderColor: 'transparent' },
  btnGhost: { backgroundColor: '#FFFFFF' },
  btnTxt: { fontWeight: '800' },
  btnTxtPrimary: { color: '#FFFFFF' },
  btnTxtGhost: { color: '#111827' },
  closeX: { position: 'absolute', top: 8, right: 8, height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
});
