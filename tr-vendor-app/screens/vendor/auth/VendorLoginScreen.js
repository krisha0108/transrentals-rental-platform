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
import { loginVendorDirect } from '../../api/client';

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

const { width } = Dimensions.get('window');
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

  // Get FCM token
  useEffect(() => {
    messaging()
      .getToken()
      .then(token => setFcmToken(token))
      .catch(err => console.log('FCM error', err));
  }, []);

  // simple validators
  const isEmailValid = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()),
    [email]
  );
  const isPasswordValid = useMemo(() => password?.length >= 6, [password]);
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  const handleLogin = async () => {
    if (!isEmailValid) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      // Use new Next.js backend API
      const result = await loginVendorDirect(email, password, fcmToken);

      if (result.success && result.vendor) {
        const { vendor } = result;

        // Check vendor status and redirect accordingly
        if (vendor.status === 'DOCUMENTS_PENDING') {
          // Redirect to document upload
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDocuments' }],
          });
        } else if (vendor.status === 'PENDING_APPROVAL') {
          // Show pending approval message
          showAlert('Pending Approval', 'Your account is under review. We will notify you once approved.');
        } else if (vendor.status === 'APPROVED' || vendor.status === 'ACTIVE') {
          // Go to dashboard
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorDashboard' }],
          });
        } else {
          // Default to dashboard
          navigation.navigate('VendorDashboard');
        }
      } else {
        showAlert('Login Failed', 'Unexpected response. Please try again.');
      }
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
            <Text style={styles.brandTitle}>TransRentals Vendor</Text>
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
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrap,
                  !email
                    ? null
                    : isEmailValid
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
                  placeholder="you@company.com"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
                {!!email && (
                  <Ionicons
                    name={isEmailValid ? 'checkmark-circle' : 'alert-circle'}
                    size={18}
                    color={isEmailValid ? BRAND.primary : BRAND.error}
                    style={styles.rightIcon}
                  />
                )}
              </View>
              {!!email && !isEmailValid && (
                <Text style={styles.helperError}>Enter a valid email.</Text>
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
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
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

            {/* Register */}
            <View style={styles.centerRow}>
              <Text style={styles.smallText}>New to TransRentals? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('VendorRegisterScreen')}
              >
                <Text style={styles.linkBold}>Create an account</Text>
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
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.ink,
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
    fontSize: 13,
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
    fontSize: 15.5,
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
    fontSize: 12.5,
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
    fontSize: 12.5,
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
  },

  footerNote: {
    marginTop: 14,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: BRAND.subText,
    fontSize: 12.5,
  },
});
