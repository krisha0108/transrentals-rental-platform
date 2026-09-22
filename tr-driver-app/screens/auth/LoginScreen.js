import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, ScrollView, Image, Dimensions, Animated, Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Alert } from '../../components/ui/AppAlert';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { loginDriver, setDriverToken, getBaseURL, describeApiError } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only the decorative circles use this — they are sized off the screen width
// and never need to react to the keyboard. Everything that has to survive the
// window resizing reads useWindowDimensions() inside the component instead.
const { width } = Dimensions.get('window');
const APP_LOGO = require('../../assets/driver_logo.png');

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  // The header used to be a fixed 38% of the screen height captured at import
  // time. With the keyboard up, Android resizes the window but that header
  // kept its original height, so it ate the shrunken screen and pushed the
  // email and password fields out of sight. It now collapses while typing and
  // springs back when the keyboard goes away.
  const { height: winHeight } = useWindowDimensions();
  const kb = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // iOS reports Will* before the keyboard animates in, Android only Did*.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animate = (to) => Animated.timing(kb, {
      toValue: to,
      duration: 220,
      // Height cannot be driven natively; this animation is cheap enough.
      useNativeDriver: false,
    }).start();
    const subShow = Keyboard.addListener(showEvt, () => animate(1));
    const subHide = Keyboard.addListener(hideEvt, () => animate(0));
    return () => { subShow.remove(); subHide.remove(); };
  }, [kb]);

  // Clamped so the header is neither a sliver on a short phone nor half the
  // screen on a tall one.
  const fullHeader = Math.min(Math.max(winHeight * 0.36, 210), 330);
  const headerHeight = kb.interpolate({ inputRange: [0, 1], outputRange: [fullHeader, 96] });
  const logoSize = kb.interpolate({ inputRange: [0, 1], outputRange: [92, 42] });
  const logoRadius = kb.interpolate({ inputRange: [0, 1], outputRange: [26, 13] });
  const logoGap = kb.interpolate({ inputRange: [0, 1], outputRange: [14, 6] });
  const titleSize = kb.interpolate({ inputRange: [0, 1], outputRange: [26, 16] });
  const subOpacity = kb.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const subHeight = kb.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!email.includes('@')) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      let fcmToken = '';
      try { fcmToken = await getToken(getMessaging()); } catch {}
      const res = await loginDriver(email.trim(), password, fcmToken);
      if (res.data.success) {
        await setDriverToken(res.data.token);
        // Store driver ID if available
        if (res.data.driver?.did) {
          await AsyncStorage.setItem('driver_id', res.data.driver.did);
        }
        await signIn(res.data.driver, res.data.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', res.data.error || 'Invalid credentials');
      }
    } catch (err) {
      // A failed sign-in is where a driver gets stuck hardest, so name the
      // real cause. When the request never reached a server at all, also say
      // which address was tried — in development that is almost always the
      // whole story (wrong port, phone not on the same network, firewall).
      let detail = describeApiError(err, 'Login failed. Please try again.');
      if (__DEV__ && !err?.response) {
        const base = await getBaseURL().catch(() => null);
        if (base) detail += `\n\nTried: ${base}`;
      }
      Alert.alert('Login Failed', detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* ── Green header (collapses while the keyboard is up) ── */}
      <Animated.View style={{ height: headerHeight }}>
        <LinearGradient
          colors={['#064E3B', '#0D7A4E', '#16A34A']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoRing,
              { width: logoSize, height: logoSize, borderRadius: logoRadius, marginBottom: logoGap },
            ]}
          >
            <Image source={APP_LOGO} style={styles.logoImg} resizeMode="cover" />
          </Animated.View>
          <Animated.Text style={[styles.headerTitle, { fontSize: titleSize }]}>Driver App</Animated.Text>
          <Animated.Text style={[styles.headerSub, { opacity: subOpacity, height: subHeight }]}>
            by TransRentals
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      {/* ── White card ── */}
      <KeyboardAvoidingView
        style={styles.cardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.card}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          // Android scrolls a focused input into view by itself once the
          // window resizes; this is the iOS equivalent.
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.welcomeSub}>Sign in to your driver account</Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[
              styles.inputBox,
              focusedField === 'email' && styles.inputBoxFocused,
              errors.email && styles.inputBoxError,
            ]}>
              <View style={[styles.iconWrap, focusedField === 'email' && styles.iconWrapActive]}>
                <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? '#16A34A' : '#94A3B8'} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#CBD5E1"
                value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.email ? <Text style={styles.errText}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[
              styles.inputBox,
              focusedField === 'password' && styles.inputBoxFocused,
              errors.password && styles.inputBoxError,
            ]}>
              <View style={[styles.iconWrap, focusedField === 'password' && styles.iconWrapActive]}>
                <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'password' ? '#16A34A' : '#94A3B8'} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#CBD5E1"
                value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPass}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
            style={[styles.btn, loading && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={['#064E3B', '#16A34A']}
              style={styles.btnInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Text style={styles.btnText}>Sign In</Text>
                    <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>Create New Account</Text>
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            By signing in, you agree to TransRentals{'\n'}Terms of Service & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#064E3B' },

  // Header
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.6,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  logoRing: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 20 },
  headerTitle: {
    fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500',
    marginTop: 3, letterSpacing: 1.2, textTransform: 'uppercase',
  },

  // White card
  cardWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  card: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },

  welcomeText: {
    fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 14, color: '#94A3B8', fontWeight: '500', marginBottom: 28,
  },

  // Fields
  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    height: 54,
  },
  inputBoxFocused: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  inputBoxError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  iconWrap: {
    width: 46,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  iconWrapActive: {
    borderRightColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingHorizontal: 14,
  },
  eyeBtn: { padding: 14 },
  errText: { fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 2 },

  // Button
  btn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, height: 56,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },

  // Divider
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  // Register button (outlined)
  registerBtn: {
    height: 54, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
  },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: '#16A34A' },

  footerNote: {
    fontSize: 12, color: '#CBD5E1', textAlign: 'center',
    marginTop: 24, lineHeight: 18,
  },
});
