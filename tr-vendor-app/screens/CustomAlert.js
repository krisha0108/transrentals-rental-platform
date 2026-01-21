// components/CustomAlert.js
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BRAND = {
  success: '#1FC77A',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  card: '#FFFFFF',
  border: '#E6EDF5',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
};

const ICONS = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'alert-circle',
  info: 'information-circle',
};

const CustomAlert = ({
  visible,
  title = '',
  message = '',
  onClose,
  /** New (optional) props */
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  primaryText = 'OK',
  onPrimary = null, // defaults to onClose
  secondaryText = '', // e.g. 'Cancel'
  onSecondary = null,
  autoCloseMs = 0, // e.g. 1800 to auto-dismiss
  dismissible = true, // tap outside or X to close
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const color = useMemo(() => BRAND[type] ?? BRAND.info, [type]);
  const icon = useMemo(() => ICONS[type] ?? ICONS.info, [type]);

  useEffect(() => {
    if (visible) {
      // entrance
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // icon pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // auto-close progress
      if (autoCloseMs > 0) {
        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 1,
          duration: autoCloseMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) (onPrimary || onClose)?.();
        });
      }
    } else {
      // reset
      fade.setValue(0);
      scale.setValue(0.95);
      pulse.setValue(0);
      progress.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.32] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] });

  const handlePrimary = () => (onPrimary || onClose)?.();
  const handleSecondary = () => onSecondary?.() ?? onClose?.();

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.overlay, { opacity: fade }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.touchFill}
          onPress={dismissible ? onClose : undefined}
        />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
              shadowColor: '#0B1020',
              shadowOpacity: 0.12,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5,
            },
          ]}
        >
          {/* close button */}
          {dismissible && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={BRAND.subText} />
            </TouchableOpacity>
          )}

          {/* Icon with pulse ring */}
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.ring,
                { backgroundColor: color, transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            />
            <View style={[styles.iconBadge, { backgroundColor: color }]}>
              <Ionicons name={icon} size={28} color="#fff" />
            </View>
          </View>

          {/* Title & message */}
          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && (
            <Text style={styles.message}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            {!!secondaryText ? (
              <>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleSecondary}>
                  <Text style={styles.secondaryText}>{secondaryText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: color }]}
                  onPress={handlePrimary}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryText}>{primaryText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtnFull, { backgroundColor: color }]}
                onPress={handlePrimary}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryText}>{primaryText}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Auto-dismiss bar */}
          {autoCloseMs > 0 && (
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth, backgroundColor: color },
                ]}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 20, 33, 0.45)',
  },
  touchFill: {
    flex: 1,
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F5F8FC',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: BRAND.ink,
    marginTop: 10,
    paddingHorizontal: 6,
  },
  message: {
    textAlign: 'center',
    fontSize: 14.5,
    color: BRAND.subText,
    marginTop: 8,
    paddingHorizontal: 6,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFDFF',
  },
  secondaryText: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnFull: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFF4FA',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});

export default CustomAlert;