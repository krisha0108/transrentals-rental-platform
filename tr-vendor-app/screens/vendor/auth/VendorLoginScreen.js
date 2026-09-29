// screens/vendor/LoginScreen.js
// Shared login screen for both vendor and travel-agent accounts — one
// endpoint (loginUnified) detects the account type and routes accordingly.
//
// Visual language ported from TravelAgentRegisterScreen / VendorRegisterScreen's
// "Elevate" design (forest→emerald hero, serif DISPLAY type, glass form card)
// — with the same deliberate swap used on the register screens: the hero's
// floating bubble orbs / light blobs are replaced with a static grid-line
// pattern here instead.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import messaging from '@react-native-firebase/messaging';
import { showError } from '../../../services/alertService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISPLAY } from '../../travel-agent/_shared/typography';
import { C, G, rs, rf, GUT, cardShadow } from '../../travel-agent/_shared/theme';
// Unified mobile login — same endpoint detects vendor/staff/travel_agent
// and returns `userType` so we route to the right dashboard.
import { loginUnified } from '../../api/travelAgentClient';

// Static grid-line overlay for the hero — this screen's stand-in for the
// register screens' floating bubble orbs.
function HeroGridPattern() {
  const CELL = rs(20);
  const cols = Math.ceil(SCREEN_W / CELL) + 1;
  const rowsCount = Math.ceil(rs(320) / CELL) + 1;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: cols }).map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLineV, { left: i * CELL }]} />
      ))}
      {Array.from({ length: rowsCount }).map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLineH, { top: i * CELL }]} />
      ))}
    </View>
  );
}

const PrimaryButton = ({ onPress, disabled, loading: btnLoading, label, icon = 'log-in-outline', style }) => {
  const press = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  const idle = !disabled && !btnLoading;

  useEffect(() => {
    if (!idle) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(sheen, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen, idle]);

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-rs(140), SCREEN_W] });
  const sheenOpacity = sheen.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.5, 0.5, 0] });

  return (
    <Animated.View style={[styles.cta, style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || btnLoading}
        activeOpacity={1}
        onPressIn={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 26, bounciness: 9 }).start()}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={disabled ? ['#B7C6BF', '#A3B5AC'] : G.emerald}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaInner}
        >
          {idle && (
            <Animated.View
              pointerEvents="none"
              style={[styles.ctaSheen, { opacity: sheenOpacity, transform: [{ translateX: sheenX }, { skewX: '-20deg' }] }]}
            />
          )}
          {btnLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={icon} size={rs(18)} color="#fff" />
              <Text style={styles.ctaText}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fcmToken, setFcmToken] = useState('');
  const [loading, setLoading] = useState(false);

  // entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  // floating background icons
  const L = 6;
  const R = SCREEN_W - 32;
  const FLOAT_ICONS = [
    // LEFT SIDE — top to bottom
    { name: 'calendar',    color: C.emeraldDeep, size: 22, x: L,     startY: SCREEN_H * 0.06, delay: 0,    duration: 3400 },
    { name: 'bicycle',     color: C.rose,        size: 22, x: L + 2, startY: SCREEN_H * 0.18, delay: 550,  duration: 3000 },
    { name: 'people',      color: C.plum,        size: 20, x: L,     startY: SCREEN_H * 0.30, delay: 250,  duration: 3200 },
    { name: 'car-sport',   color: C.ocean,       size: 22, x: L + 2, startY: SCREEN_H * 0.43, delay: 800,  duration: 3800 },
    { name: 'bus',         color: C.gold,        size: 22, x: L,     startY: SCREEN_H * 0.56, delay: 350,  duration: 3100 },
    { name: 'location',    color: C.emeraldDeep, size: 20, x: L + 2, startY: SCREEN_H * 0.68, delay: 650,  duration: 3500 },
    { name: 'trending-up', color: C.rose,        size: 19, x: L,     startY: SCREEN_H * 0.80, delay: 150,  duration: 3600 },
    // RIGHT SIDE — top to bottom
    { name: 'airplane',    color: C.ocean,       size: 22, x: R,     startY: SCREEN_H * 0.05, delay: 400,  duration: 3300 },
    { name: 'map',         color: C.emeraldDeep, size: 22, x: R - 2, startY: SCREEN_H * 0.17, delay: 900,  duration: 3100 },
    { name: 'bar-chart',   color: C.gold,        size: 20, x: R,     startY: SCREEN_H * 0.29, delay: 100,  duration: 3700 },
    { name: 'card',        color: C.rose,        size: 22, x: R - 2, startY: SCREEN_H * 0.41, delay: 600,  duration: 2900 },
    { name: 'train',       color: C.plum,        size: 22, x: R,     startY: SCREEN_H * 0.54, delay: 300,  duration: 3400 },
    { name: 'briefcase',   color: C.ocean,       size: 20, x: R - 2, startY: SCREEN_H * 0.66, delay: 750,  duration: 3500 },
    { name: 'key',         color: C.emeraldDeep, size: 19, x: R,     startY: SCREEN_H * 0.79, delay: 500,  duration: 3200 },
  ];
  const floatAnims = useRef(FLOAT_ICONS.map((_, i) => new Animated.Value(i % 2 === 0 ? 0 : 0.5))).current;

  useEffect(() => {
    const anims = FLOAT_ICONS.map((cfg, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.timing(floatAnims[i], { toValue: 1, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnims[i], { toValue: 0, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach(a => a.stop());
  }, []);

  // cycling word animation: "Vendor" ↔ "Travel Agent"
  const WORDS = ['Vendor', 'Travel Agent'];
  const [wordIdx, setWordIdx] = useState(0);
  const wordOpacity = useRef(new Animated.Value(1)).current;
  const wordTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 0, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(wordTranslateY, { toValue: -14, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setWordIdx(prev => (prev + 1) % WORDS.length);
        wordTranslateY.setValue(14);
        Animated.parallel([
          Animated.timing(wordOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(wordTranslateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      });
    };
    const t = setInterval(cycle, 3000);
    return () => clearInterval(t);
  }, [wordOpacity, wordTranslateY]);

  // Get FCM token
  useEffect(() => {
    messaging()
      .getToken()
      .then(token => setFcmToken(token))
      .catch(err => console.log('FCM error', err));
  }, []);

  // simple validators - accept email, vendor ID (vn-0001) or travel agent ID (ta-0001)
  const isIdentifierValid = useMemo(() => {
    const trimmed = email.trim();
    const isEmail = /^\S+@\S+\.\S+$/.test(trimmed);
    const isVendorId = /^vn-\d+$/i.test(trimmed);
    const isAgentId = /^ta-\d+$/i.test(trimmed);
    return isEmail || isVendorId || isAgentId;
  }, [email]);
  const isPasswordValid = useMemo(() => password?.length >= 6, [password]);
  const canSubmit = isIdentifierValid && isPasswordValid && !loading;

  const handleLogin = async () => {
    if (!isIdentifierValid) {
      showError('Please enter a valid email, Vendor ID (vn-0001) or Agent ID (ta-0001).', 'Invalid Login');
      return;
    }
    if (!isPasswordValid) {
      showError('Password must be at least 6 characters.', 'Weak Password');
      return;
    }

    try {
      setLoading(true);

      // Unified login — backend detects whether the credentials belong to a
      // vendor, staff, or travel agent and returns `userType` accordingly.
      const result = await loginUnified(email, password, fcmToken);

      if (!result?.success) {
        showError('Unexpected response. Please try again.', 'Login Failed');
        return;
      }

      // --- TRAVEL AGENT ---
      if (result.userType === 'travel_agent' && result.travelAgent) {
        const ta = result.travelAgent;
        if (ta.status === 'DOCUMENTS_PENDING') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TravelAgentDocuments' }],
          });
        } else if (ta.status === 'REJECTED') {
          showError(
            ta.rejectionReason || 'Your application was rejected. Please contact support.',
            'Application Rejected'
          );
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TravelAgentDashboard' }],
          });
        }
        return;
      }

      // --- VENDOR / STAFF (existing flow) ---
      if (result.vendor) {
        const { vendor } = result;
        if (vendor.status === 'DOCUMENTS_PENDING') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDocuments' }],
          });
        } else if (vendor.status === 'PENDING_APPROVAL') {
          showError('Your account is under review. We will notify you once approved.', 'Pending Approval');
        } else if (vendor.status === 'APPROVED' || vendor.status === 'ACTIVE') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDashboard' }],
          });
        } else {
          navigation.navigate('VendorDashboard');
        }
        return;
      }

      showError('Unexpected response. Please try again.', 'Login Failed');
    } catch (error) {
      const errorMessage = error?.response?.data?.error
        || error?.message
        || 'Something went wrong. Please try again later.';
      showError(errorMessage, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* Floating icons — full screen fixed overlay, outside scroll */}
      <View style={styles.floatOverlay} pointerEvents="none">
        {FLOAT_ICONS.map((cfg, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatIcon,
              {
                left: cfg.x,
                top: cfg.startY,
                opacity: floatAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.25, 0.10] }),
                transform: [{
                  translateY: floatAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -20] }),
                }],
              },
            ]}
          >
            <Ionicons name={cfg.name} size={cfg.size} color={cfg.color} />
          </Animated.View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={G.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <HeroGridPattern />

            <SafeAreaView edges={['top']} style={{ paddingHorizontal: GUT }}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Image source={require('../../../assets/logo-white-tr.png')} style={{ width: rs(28), height: rs(28) }} />
                </View>
                <Image
                  source={require('../../../assets/logo-trans.png')}
                  style={styles.logoWordmark}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.title}>TransRentals </Text>
                <Animated.Text
                  style={[
                    styles.titleAccent,
                    { opacity: wordOpacity, transform: [{ translateY: wordTranslateY }] },
                  ]}
                >
                  {WORDS[wordIdx]}
                </Animated.Text>
              </View>
              <Text style={styles.subtitle}>
                Sign in to manage bookings, quotes & fleet.
              </Text>

              <View style={{ height: rs(26) }} />
            </SafeAreaView>
          </LinearGradient>

          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {/* ── Form card tucked into the hero curve ── */}
            <View style={[styles.formCard, cardShadow]}>
              {/* Email or Vendor/Agent ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email or ID</Text>
                <View
                  style={[
                    styles.inputWrap,
                    !email ? null : isIdentifierValid ? styles.inputOK : styles.inputError,
                  ]}
                >
                  <Ionicons name="mail-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email, Vendor ID or Agent ID"
                    placeholderTextColor={C.muted}
                    keyboardType="default"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    returnKeyType="next"
                  />
                  {!!email && (
                    <Ionicons
                      name={isIdentifierValid ? 'checkmark-circle' : 'alert-circle'}
                      size={rs(18)}
                      color={isIdentifierValid ? C.emerald : C.red}
                      style={styles.rightIcon}
                    />
                  )}
                </View>
                {!!email && !isIdentifierValid && (
                  <Text style={styles.helperError}>Enter a valid email, Vendor ID or Agent ID.</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    !password ? null : isPasswordValid ? styles.inputOK : styles.inputError,
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={rs(18)} color={C.muted} style={styles.leftIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={C.muted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={rs(18)} color={C.muted} />
                  </TouchableOpacity>
                </View>
                {!!password && !isPasswordValid && (
                  <Text style={styles.helperError}>Minimum 6 characters required.</Text>
                )}
              </View>

              {/* Row: Forgot */}
              <View style={styles.rowBetween}>
                <View />
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Reset password',
                      'Which account type is this?',
                      [
                        { text: 'Vendor', onPress: () => navigation.navigate('ForgotPasswordScreen') },
                        { text: 'Travel Agent', onPress: () => navigation.navigate('TravelAgentForgotPasswordScreen') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    )
                  }
                >
                  <Text style={styles.link}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <PrimaryButton label="Sign In" onPress={handleLogin} disabled={!canSubmit} loading={loading} />

              {/* Divider */}
              <View style={styles.separatorRow}>
                <View style={styles.separator} />
                <Text style={styles.separatorText}>or</Text>
                <View style={styles.separator} />
              </View>

              {/* Register options — vendor or travel agent (same login form, different signup) */}
              <View style={styles.registerBlock}>
                <Text style={styles.registerBlockLabel}>New to TransRentals?</Text>

                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('VendorRegisterScreen')}
                  activeOpacity={0.7}
                >
                  <View style={styles.registerLinkIcon}>
                    <Ionicons name="storefront-outline" size={rs(17)} color={C.emeraldDeep} />
                  </View>
                  <Text style={styles.linkBold}>Register as Vendor</Text>
                  <Ionicons name="chevron-forward" size={rs(16)} color={C.emeraldDeep} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.registerLink, styles.registerLinkOcean]}
                  onPress={() => navigation.navigate('TravelAgentRegisterScreen')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.registerLinkIcon, styles.registerLinkIconOcean]}>
                    <Ionicons name="airplane-outline" size={rs(17)} color={C.ocean} />
                  </View>
                  <Text style={[styles.linkBold, { color: C.ocean }]}>Register as Travel Agent</Text>
                  <Ionicons name="chevron-forward" size={rs(16)} color={C.ocean} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer microcopy */}
            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark-outline" size={rs(15)} color={C.muted} />
              <Text style={styles.footerText}>Secured by industry-standard encryption</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  floatOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  floatIcon: { position: 'absolute' },
  scrollContent: { flexGrow: 1, paddingBottom: rs(36) },

  // ===== Hero =====
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: 'hidden',
  },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.09)' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.09)' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginTop: rs(14), marginBottom: rs(18) },
  logoBadge: {
    width: rs(46), height: rs(46), borderRadius: rs(15),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWordmark: { height: rs(26), width: rs(136), tintColor: '#fff' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  title: { fontFamily: DISPLAY, fontSize: rf(25), color: '#fff', letterSpacing: 0.2 },
  titleAccent: { fontFamily: DISPLAY, fontSize: rf(25), color: C.goldLight, letterSpacing: 0.2, fontWeight: 'bold' },
  subtitle: {
    fontFamily: DISPLAY, fontSize: rf(12.5), color: 'rgba(255,255,255,0.7)',
    marginTop: rs(5), lineHeight: rf(18), fontWeight: '600',
  },

  // ===== Form card =====
  formCard: {
    marginHorizontal: GUT, marginTop: -rs(20),
    backgroundColor: C.card, borderRadius: rs(20),
    paddingHorizontal: rs(16), paddingTop: rs(20), paddingBottom: rs(18),
    borderWidth: 1, borderColor: C.glassBorder,
  },

  inputGroup: { marginBottom: rs(16) },
  label: {
    fontFamily: DISPLAY, fontSize: rf(12), fontWeight: 'bold',
    color: C.sub, marginBottom: rs(7), letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.ivory,
    borderWidth: 1, borderColor: C.border, borderRadius: rs(13), height: rs(52),
  },
  input: {
    fontFamily: DISPLAY, flex: 1, paddingLeft: rs(42), paddingRight: rs(42),
    fontSize: rf(15), color: C.ink, fontWeight: '500',
  },
  leftIcon: { position: 'absolute', left: rs(14) },
  rightIcon: { position: 'absolute', right: rs(14) },
  eyeBtn: {
    position: 'absolute', right: rs(10), height: '100%', width: rs(40),
    alignItems: 'center', justifyContent: 'center',
  },

  inputOK: { borderColor: C.emerald, backgroundColor: C.card },
  inputError: { borderColor: C.red, backgroundColor: C.card },
  helperError: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12), marginTop: rs(6), fontWeight: '600' },

  rowBetween: {
    marginTop: rs(2), marginBottom: rs(6),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  link: { fontFamily: DISPLAY, color: C.emeraldDeep, fontWeight: 'bold', fontSize: rf(13.5) },

  // ===== CTA (PrimaryButton) =====
  cta: { height: rs(54), borderRadius: rs(14), overflow: 'hidden', marginTop: rs(6) },
  ctaInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: rs(8), overflow: 'hidden',
  },
  ctaSheen: {
    position: 'absolute', top: -rs(20), bottom: -rs(20), left: 0,
    width: rs(70), backgroundColor: 'rgba(255,255,255,0.35)',
  },
  ctaText: { fontFamily: DISPLAY, color: '#fff', fontSize: rf(16), fontWeight: 'bold', letterSpacing: 0.2 },

  separatorRow: { marginVertical: rs(16), gap: rs(8), flexDirection: 'row', alignItems: 'center' },
  separator: { flex: 1, height: 1, backgroundColor: C.border },
  separatorText: { fontFamily: DISPLAY, color: C.muted, fontSize: rf(13.5), fontWeight: '600' },

  registerBlock: { width: '100%' },
  registerBlockLabel: {
    fontFamily: DISPLAY, color: C.sub, fontSize: rf(13.5), fontWeight: '600',
    textAlign: 'center', marginBottom: rs(10),
  },
  registerLink: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: C.tintEmerald, borderWidth: 1, borderColor: 'rgba(28,107,82,0.22)',
    borderRadius: rs(14), paddingVertical: rs(12), paddingHorizontal: rs(14), marginTop: rs(8),
  },
  registerLinkOcean: { backgroundColor: C.tintOcean, borderColor: 'rgba(44,110,140,0.22)' },
  registerLinkIcon: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    backgroundColor: 'rgba(28,107,82,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: rs(10),
  },
  registerLinkIconOcean: { backgroundColor: 'rgba(44,110,140,0.1)' },
  linkBold: { fontFamily: DISPLAY, color: C.emeraldDeep, fontWeight: 'bold', fontSize: rf(14), flex: 1 },

  footerNote: {
    marginTop: rs(18), gap: rs(6), flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  footerText: { fontFamily: DISPLAY, color: C.muted, fontSize: rf(12.5), fontWeight: '600' },
});
