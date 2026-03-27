import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StatusBar, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import { loginDriver, setDriverToken } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      try { fcmToken = await messaging().getToken(); } catch {}
      const res = await loginDriver(email.trim(), password, fcmToken);
      if (res.data.success) {
        await setDriverToken(res.data.token);
        await signIn(res.data.driver, res.data.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', res.data.error || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ── */}
          <View style={styles.brand}>
            <LinearGradient
              colors={['#064E3B', '#16A34A']}
              style={styles.logoBox}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="car" size={30} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>Driver App</Text>
            <Text style={styles.appSub}>by TransRentals</Text>
          </View>

          {/* ── Heading ── */}
          <Text style={styles.heading}>Welcome back 👋</Text>
          <Text style={styles.subHeading}>Sign in to continue</Text>

          {/* ── Fields ── */}
          <View style={styles.form}>
            <Field
              label="Email Address"
              icon="mail-outline"
              placeholder="your@email.com"
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Field
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
              secureTextEntry={!showPass}
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightPress={() => setShowPass(!showPass)}
              error={errors.password}
            />
          </View>

          {/* ── Sign In button ── */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
            style={[styles.btn, loading && { opacity: 0.65 }]}
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
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Register link ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to TransRentals?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, icon, error, rightIcon, onRightPress, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputRowErr]}>
        <Ionicons name={icon} size={18} color={error ? '#EF4444' : '#94A3B8'} style={{ marginRight: 10 }} />
        <TextInput style={styles.input} placeholderTextColor="#CBD5E1" {...props} />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
            <Ionicons name={rightIcon} size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },

  // Branding
  brand: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#16A34A', shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  appSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 3, letterSpacing: 0.5 },

  // Heading
  heading: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subHeading: { fontSize: 15, color: '#94A3B8', marginBottom: 32 },

  // Form
  form: { gap: 4 },
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16,
    height: 54, backgroundColor: '#FAFAFA',
  },
  inputRowErr: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  errText: { fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 2 },

  // Button
  btn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  btnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 58,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#94A3B8' },
  footerLink: { fontSize: 14, color: '#16A34A', fontWeight: '700' },
});
