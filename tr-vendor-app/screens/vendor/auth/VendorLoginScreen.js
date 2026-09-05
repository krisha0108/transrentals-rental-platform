// screens/vendor/LoginScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import CustomAlert from '../../CustomAlertmahek';
import { SafeAreaView } from 'react-native-safe-area-context';
// Unified mobile login — same endpoint detects vendor/staff/travel_agent
// and returns `userType` so we route to the right dashboard.
import { loginUnified } from '../../api/travelAgentClient';

const BRAND = {
  primary: '#1FC77A',        // fresh green (light theme friendly)
  primaryDark: '#12AD66',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
  error: '#EF4444',
};

const { width, height: SCREEN_H } = Dimensions.get('window');
const isTablet = width >= 768;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fcmToken, setFcmToken] = useState('');
  const [loading, setLoading] = useState(false);

  // CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  // floating background icons
  // left-side icons: x = 4–14px from left edge (clearly in the margin)
  // right-side icons: x = width - 30px from right edge
  const L = 6;                  // px from left
  const R = width - 32;         // px from right
  const FLOAT_ICONS = [
    // LEFT SIDE — top to bottom
    { name: 'calendar',     color: '#0A7A4B', size: 22, x: L,     startY: SCREEN_H * 0.06, delay: 0,    duration: 3400 },
    { name: 'bicycle',      color: '#DB2777', size: 22, x: L + 2, startY: SCREEN_H * 0.18, delay: 550,  duration: 3000 },
    { name: 'people',       color: '#7C3AED', size: 20, x: L,     startY: SCREEN_H * 0.30, delay: 250,  duration: 3200 },
    { name: 'car-sport',    color: '#1e6bb8', size: 22, x: L + 2, startY: SCREEN_H * 0.43, delay: 800,  duration: 3800 },
    { name: 'bus',          color: '#D97706', size: 22, x: L,     startY: SCREEN_H * 0.56, delay: 350,  duration: 3100 },
    { name: 'location',     color: '#0A7A4B', size: 20, x: L + 2, startY: SCREEN_H * 0.68, delay: 650,  duration: 3500 },
    { name: 'trending-up',  color: '#DB2777', size: 19, x: L,     startY: SCREEN_H * 0.80, delay: 150,  duration: 3600 },
    // RIGHT SIDE — top to bottom
    { name: 'airplane',     color: '#1e6bb8', size: 22, x: R,     startY: SCREEN_H * 0.05, delay: 400,  duration: 3300 },
    { name: 'map',          color: '#0A7A4B', size: 22, x: R - 2, startY: SCREEN_H * 0.17, delay: 900,  duration: 3100 },
    { name: 'bar-chart',    color: '#D97706', size: 20, x: R,     startY: SCREEN_H * 0.29, delay: 100,  duration: 3700 },
    { name: 'card',         color: '#DB2777', size: 22, x: R - 2, startY: SCREEN_H * 0.41, delay: 600,  duration: 2900 },
    { name: 'train',        color: '#7C3AED', size: 22, x: R,     startY: SCREEN_H * 0.54, delay: 300,  duration: 3400 },
    { name: 'briefcase',    color: '#1e6bb8', size: 20, x: R - 2, startY: SCREEN_H * 0.66, delay: 750,  duration: 3500 },
    { name: 'key',          color: '#0A7A4B', size: 19, x: R,     startY: SCREEN_H * 0.79, delay: 500,  duration: 3200 },
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
      // fade up & out
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 0, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(wordTranslateY, { toValue: -14, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setWordIdx(prev => (prev + 1) % WORDS.length);
        wordTranslateY.setValue(14); // start from below
        // fade in from below
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
      showAlert('Invalid Login', 'Please enter a valid email, Vendor ID (vn-0001) or Agent ID (ta-0001).');
      return;
    }
    if (!isPasswordValid) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      // Unified login — backend detects whether the credentials belong to a
      // vendor, staff, or travel agent and returns `userType` accordingly.
      const result = await loginUnified(email, password, fcmToken);

      if (!result?.success) {
        showAlert('Login Failed', 'Unexpected response. Please try again.');
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
          showAlert(
            'Application Rejected',
            ta.rejectionReason || 'Your application was rejected. Please contact support.'
          );
        } else {
          // PENDING / UNDER_REVIEW / APPROVED — all land on the TA dashboard.
          // The dashboard itself applies the approval gate (reduced menu for non-approved).
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
          showAlert('Pending Approval', 'Your account is under review. We will notify you once approved.');
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

      showAlert('Login Failed', 'Unexpected response. Please try again.');
    } catch (error) {
      const errorMessage = error?.response?.data?.error
        || error?.message
        || 'Something went wrong. Please try again later.';
      showAlert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subtle light gradient background using blocks */}
          <View style={styles.bgBlobA} />
          <View style={styles.bgBlobB} />

          {/* Brand header */}
          <Animated.View
            style={[
              styles.headerWrap,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            <View style={styles.brandBadge}>
               <Image source={require('../../../assets/logo-white-tr.png')}  style={{width:40, height:40}} />
              {/* <Ionicons name="car-sport" size={22} color="#fff" /> */}
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>TransRentals </Text>
              <Animated.Text
                style={[
                  styles.brandTitleWord,
                  { opacity: wordOpacity, transform: [{ translateY: wordTranslateY }] },
                ]}
              >
                {WORDS[wordIdx]}
              </Animated.Text>
            </View>
            <Text style={styles.brandTagline}>
              Sign in to manage bookings, quotes & fleet.
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fade,
                transform: [{ translateY: slide }],
              },
            ]}
          >
            {/* Email or Vendor ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or ID</Text>
              <View
                style={[
                  styles.inputWrap,
                  !email
                    ? null
                    : isIdentifierValid
                    ? styles.inputOK
                    : styles.inputError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={BRAND.subText}
                  style={styles.leftIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email, Vendor ID or Agent ID"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
                {!!email && (
                  <Ionicons
                    name={isIdentifierValid ? 'checkmark-circle' : 'alert-circle'}
                    size={18}
                    color={isIdentifierValid ? BRAND.primary : BRAND.error}
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
                  !password
                    ? null
                    : isPasswordValid
                    ? styles.inputOK
                    : styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={BRAND.subText}
                  style={styles.leftIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A3B3C2"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={BRAND.subText}
                  />
                </TouchableOpacity>
              </View>
              {!!password && !isPasswordValid && (
                <Text style={styles.helperError}>
                  Minimum 6 characters required.
                </Text>
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

            {/* CTA */}
            <TouchableOpacity
              disabled={!canSubmit}
              onPress={handleLogin}
              activeOpacity={0.85}
              style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.ctaText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.separatorRow}>
              <View style={styles.separator} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.separator} />
            </View>

            {/* Register options — vendor or travel agent (same login form, different signup) */}
            <View style={styles.registerBlock}>
              <Text style={[styles.smallText, { textAlign: 'center', marginBottom: 10 }]}>
                New to TransRentals?
              </Text>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('VendorRegisterScreen')}
                activeOpacity={0.7}
              >
                <Ionicons name="storefront-outline" size={18} color={BRAND.primaryDark} />
                <Text style={styles.linkBold}>Register as Vendor</Text>
                <Ionicons name="chevron-forward" size={16} color={BRAND.primaryDark} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('TravelAgentRegisterScreen')}
                activeOpacity={0.7}
              >
                <Ionicons name="airplane-outline" size={18} color={BRAND.primaryDark} />
                <Text style={styles.linkBold}>Register as Travel Agent</Text>
                <Ionicons name="chevron-forward" size={16} color={BRAND.primaryDark} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer microcopy */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={BRAND.subText} />
            <Text style={styles.footerText}>
              Secured by industry-standard encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },

  floatOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  floatIcon: {
    position: 'absolute',
  },

  // Decorative light blobs (no extra libs)
  bgBlobA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    backgroundColor: '#DFF9EC',
    borderRadius: 999,
    opacity: 0.6,
  },
  bgBlobB: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 260,
    height: 260,
    backgroundColor: '#EAF3FF',
    borderRadius: 999,
    opacity: 0.55,
  },

  headerWrap: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.ink,
  },
  brandTitleWord: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A7A4B',
  },
  brandTagline: {
    fontSize: 13.5,
    color: BRAND.subText,
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: '#0B1020',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFDFF',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    height: 52,
  },
  input: {
    flex: 1,
    paddingLeft: 42,
    paddingRight: 42,
    fontSize: 13.5,
    color: BRAND.ink,
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputOK: {
    borderColor: '#CFF5E2',
    backgroundColor: '#F5FFFA',
  },
  inputError: {
    borderColor: '#FBD5D5',
    backgroundColor: '#FFF8F8',
  },
  helperError: {
    color: BRAND.error,
    fontSize: 13.5,
    marginTop: 6,
  },

  rowBetween: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    shadowColor: BRAND.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  ctaDisabled: {
    backgroundColor: '#A1E8C6',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  separatorRow: {
    marginVertical: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: BRAND.border,
  },
  separatorText: {
    color: BRAND.subText,
    fontSize: 13.5,
  },

  centerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  smallText: {
    color: BRAND.subText,
    fontSize: 13.5,
  },
  link: {
    color: BRAND.primaryDark,
    fontWeight: '700',
    fontSize: 13.5,
  },
  linkBold: {
    color: BRAND.primaryDark,
    fontWeight: '800',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },

  registerBlock: {
    width: '100%',
    marginTop: 4,
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FFFA',
    borderWidth: 1,
    borderColor: '#CFF5E2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 8,
  },

  footerNote: {
    marginTop: 14,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: BRAND.subText,
    fontSize: 13.5,
  },
});
