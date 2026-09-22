/**
 * The driver app's own alert dialog.
 *
 * Every popup in the app used to be the OS `Alert.alert` — a grey system box
 * with a blue iOS button or a purple Android one, no icon, no brand colour,
 * and sizing that ignored the phone it was on. This replaces all of them with
 * one dialog that matches the app.
 *
 * It is a *drop-in* replacement on purpose: the exported `Alert` keeps React
 * Native's `alert(title, message, buttons, options)` signature, so a screen
 * only changes which module it imports `Alert` from. The 80-odd existing call
 * sites keep working, and any new `Alert.alert` written out of habit lands in
 * the styled dialog too.
 *
 *   import { Alert } from '../../components/ui/AppAlert';
 *   Alert.alert('Vehicle Added!', 'Your vehicle has been added.', [
 *     { text: 'OK', onPress: goBack },
 *   ]);
 *
 * `options` accepts what RN's does (`cancelable`, `onDismiss`) plus a `type`
 * ('success' | 'error' | 'warning' | 'confirm' | 'info') and an `icon`
 * override. With no `type` the tone is inferred from the wording and the
 * buttons, so old call sites get the right colour without being rewritten.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert as RNAlert, Animated, BackHandler, Easing, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, SHADOW, scaleFor } from './theme';

// ── Appearance per tone ──────────────────────────────────────────────────────
const TYPES = {
  success: { icon: 'checkmark-circle',   tint: COLORS.primary, soft: COLORS.primarySoft, grad: ['#0D7A4E', '#16A34A'] },
  error:   { icon: 'close-circle',       tint: COLORS.danger,  soft: COLORS.dangerSoft,  grad: ['#DC2626', '#EF4444'] },
  warning: { icon: 'warning',            tint: COLORS.amber,   soft: COLORS.amberSoft,   grad: ['#D97706', '#F59E0B'] },
  confirm: { icon: 'help-circle',        tint: COLORS.blue,    soft: COLORS.blueSoft,    grad: ['#2563EB', '#3B82F6'] },
  info:    { icon: 'information-circle', tint: COLORS.primary, soft: COLORS.primarySoft, grad: ['#0D7A4E', '#16A34A'] },
};

// Checked against the title alone: "Required" and "Select Vehicle" are the
// app telling you to finish filling something in, which is an amber nudge,
// not the red "something broke" that a word scan would make of them.
const VALIDATION_TITLES = /^(required|missing|incomplete|select\b|choose\b|enter\b|pick\b)/;

const ERROR_WORDS = /(fail|error|invalid|denied|not found|unable|could not|cannot|wrong|expired|rejected)/;
const SUCCESS_WORDS = /(success|added|updated|saved|complete|sent|uploaded|created|approved|submitted|assigned|started|accepted)/;
const WARN_WORDS = /(warning|caution|careful|expiring|pending|reminder|note|required|missing)/;

/** Guess the tone from the wording when the caller did not say. */
function inferType(title, message) {
  const head = String(title || '').trim().toLowerCase();
  if (VALIDATION_TITLES.test(head)) return 'warning';

  const t = `${title} ${message}`.toLowerCase();
  if (ERROR_WORDS.test(t)) return 'error';
  if (SUCCESS_WORDS.test(t)) return 'success';
  if (WARN_WORDS.test(t)) return 'warning';
  return 'info';
}

// ── Imperative bridge ────────────────────────────────────────────────────────
// The host registers itself here so any module can raise a dialog without a
// context being threaded through screens that never render one.
let deliverToHost = null;
const preMountQueue = [];

function show(title, message, buttons, options = {}) {
  const list = Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'OK' }];

  const hasDestructive = list.some(b => b && b.style === 'destructive');
  const hasCancel = list.some(b => b && b.style === 'cancel');
  const asksAQuestion = /\?\s*$/.test(String(title || '')) || /\?\s*$/.test(String(message || ''));

  // Order matters: "Remove Vehicle?" is a destructive confirm, not an error,
  // even though a plain word scan would call it one. The buttons and the
  // question mark are stronger signals than the wording, so they win.
  let type = options.type;
  if (!type) {
    if (hasDestructive) type = 'warning';
    else if (asksAQuestion || (hasCancel && list.length > 1)) type = 'confirm';
    else type = inferType(title, message);
  }

  const config = {
    key: `${Date.now()}-${Math.random()}`,
    title: title == null ? '' : String(title),
    message: message == null ? '' : String(message),
    buttons: list,
    type,
    icon: options.icon,
    // Dismissable only when the dialog offers a way out. A lone "OK" often
    // carries the whole outcome — `Alert.alert('Vehicle Added!', ..., [{ text:
    // 'OK', onPress: goBack }])` — and a stray backdrop tap would swallow it,
    // leaving the driver on a form they already submitted. An explicit
    // `cancelable` from the caller still wins.
    cancelable: options.cancelable !== undefined ? options.cancelable : hasCancel,
    onDismiss: options.onDismiss,
  };

  if (deliverToHost) deliverToHost(config);
  else preMountQueue.push(config);
}

/** Drop-in stand-in for React Native's `Alert`. */
export const Alert = {
  alert: show,
  /** `Alert.prompt` is iOS-only and unused here — pass it through untouched. */
  prompt: (...args) => (RNAlert.prompt ? RNAlert.prompt(...args) : undefined),
};

/** Same thing under a clearer name, for new code. */
export const showAlert = show;

// ── The dialog ───────────────────────────────────────────────────────────────
export function AppAlertHost() {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);
  const queue = useRef([]);
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.92)).current;
  const { width, height } = useWindowDimensions();

  // Register as the delivery target, and flush anything raised before mount.
  useEffect(() => {
    deliverToHost = (item) => {
      // A second alert raised while one is open waits its turn rather than
      // replacing it — the OS alert queued too, and screens rely on that (a
      // photo-upload loop can raise several in a row).
      setConfig(current => {
        if (current) { queue.current.push(item); return current; }
        return item;
      });
    };
    while (preMountQueue.length) deliverToHost(preMountQueue.shift());
    return () => { deliverToHost = null; };
  }, []);

  useEffect(() => {
    if (!config) return;
    setVisible(true);
    fade.setValue(0);
    pop.setValue(0.92);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [config, fade, pop]);

  const close = useCallback((after) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(pop, { toValue: 0.95, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      // Run the handler once the dialog is gone: a handler that navigates or
      // raises another alert should not fight this one's exit animation.
      if (after) after();
      setTimeout(() => {
        const item = queue.current.shift();
        if (item) setConfig(item);
      }, 60);
    });
  }, [fade, pop]);

  const dismiss = useCallback(() => {
    if (!config || !config.cancelable) return;
    const cancelBtn = config.buttons.find(b => b && b.style === 'cancel');
    close(() => {
      if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      if (config.onDismiss) config.onDismiss();
    });
  }, [config, close]);

  // Android back closes a cancelable dialog, as the OS one did.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (config && config.cancelable) dismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible, config, dismiss]);

  if (!config) return null;

  const look = TYPES[config.type] || TYPES.info;
  const f = (n) => scaleFor(width, n);
  const buttons = config.buttons;

  // The filled button is the last one that is not "Cancel" — the convention
  // the OS dialog used, so muscle memory still works.
  let primaryIndex = -1;
  for (let i = buttons.length - 1; i >= 0; i--) {
    if (!buttons[i] || buttons[i].style !== 'cancel') { primaryIndex = i; break; }
  }

  // Side by side only when two short labels genuinely fit; otherwise stacked,
  // which is what a narrow phone or a large system font size needs anyway.
  const labelChars = buttons.reduce((n, b) => n + String((b && b.text) || '').length, 0);
  const stacked = buttons.length > 2 || (buttons.length === 2 && labelChars > 26);

  const cardWidth = Math.min(width - f(40), 420);
  // Landscape leaves very little height, so the message scrolls rather than
  // pushing the buttons off screen.
  const maxMessageHeight = Math.max(height * 0.4, 120);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessible={false} />

        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              transform: [{ scale: pop }],
              paddingHorizontal: f(22),
              paddingBottom: f(18),
            },
          ]}
        >
          {/* A thin tinted cap rather than a full coloured header: it carries
              the tone without shouting over the message. */}
          <View style={[styles.cap, { backgroundColor: look.tint }]} />

          <View
            style={[
              styles.iconBadge,
              { backgroundColor: look.soft, width: f(60), height: f(60), borderRadius: f(20), marginTop: f(24) },
            ]}
          >
            <Ionicons name={config.icon || look.icon} size={f(32)} color={look.tint} />
          </View>

          {!!config.title && (
            <Text style={[styles.title, { fontSize: f(18), marginTop: f(14) }]}>{config.title}</Text>
          )}

          {!!config.message && (
            <ScrollView
              style={{ maxHeight: maxMessageHeight, width: '100%' }}
              contentContainerStyle={{ paddingTop: f(7) }}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={[styles.message, { fontSize: f(14), lineHeight: f(21) }]}>{config.message}</Text>
            </ScrollView>
          )}

          <View style={[styles.actions, stacked ? styles.actionsStacked : styles.actionsRow, { marginTop: f(20) }]}>
            {buttons.map((btn, i) => {
              const label = String((btn && btn.text) != null ? btn.text : 'OK');
              const isCancel = btn && btn.style === 'cancel';
              const isDestructive = btn && btn.style === 'destructive';
              const press = () => close(() => { if (btn && btn.onPress) btn.onPress(); });

              if (i === primaryIndex) {
                return (
                  <TouchableOpacity
                    key={`${label}-${i}`}
                    onPress={press}
                    activeOpacity={0.85}
                    style={[styles.btnWrap, stacked ? styles.btnFull : styles.btnFlex, { height: f(50) }]}
                  >
                    <LinearGradient
                      colors={isDestructive ? TYPES.error.grad : look.grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnFill}
                    >
                      <Text style={[styles.btnFillText, { fontSize: f(15) }]} numberOfLines={1}>{label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={`${label}-${i}`}
                  onPress={press}
                  activeOpacity={0.7}
                  style={[
                    styles.btnOutline,
                    stacked ? styles.btnFull : styles.btnFlex,
                    { height: f(50) },
                    isDestructive && { borderColor: '#FECACA', backgroundColor: COLORS.dangerSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.btnOutlineText,
                      { fontSize: f(15) },
                      isCancel && { color: COLORS.subText },
                      isDestructive && { color: COLORS.dangerDark },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cap: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  iconBadge: { alignItems: 'center', justifyContent: 'center' },
  title: {
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  message: {
    color: COLORS.subText,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: { width: '100%' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  // Reversed so the filled action sits on top of a stacked list while the
  // buttons array keeps its original order.
  actionsStacked: { flexDirection: 'column-reverse', gap: 9 },
  btnFlex: { flex: 1 },
  btnFull: { width: '100%' },
  btnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.button },
  btnFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnFillText: { color: COLORS.white, fontWeight: '800', letterSpacing: 0.3 },
  btnOutline: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontWeight: '700', color: COLORS.text },
});

export default AppAlertHost;
