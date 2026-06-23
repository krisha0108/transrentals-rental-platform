import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerDriver, setDriverToken } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];
const STEPS = [
  { label: 'Personal', icon: 'person-outline' },
  { label: 'Documents', icon: 'document-text-outline' },
  { label: 'Bank', icon: 'card-outline' },
];

function formatDate(d) {
  if (!d) return '';
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, icon, error, rightIcon, onRightPress, focused, onFocus, onBlur, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[
        styles.inputBox,
        focused && styles.inputBoxFocused,
        error && styles.inputBoxError,
      ]}>
        {icon && (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Ionicons name={icon} size={17} color={focused ? '#16A34A' : '#94A3B8'} />
          </View>
        )}
        <TextInput
          style={[styles.input, !icon && { paddingLeft: 16 }]}
          placeholderTextColor="#CBD5E1"
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.eyeBtn}>
            <Ionicons name={rightIcon} size={17} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color="#16A34A" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const scrollRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  function goToStep(n) {
    setStep(n);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  }
  const [focused, setFocused] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [dob, setDob] = useState(null);
  const [showDob, setShowDob] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [errors, setErrors] = useState({});

  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState(null);
  const [showExpiry, setShowExpiry] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  function validateStep1() {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!phone.trim() || phone.length < 10) e.phone = 'Valid 10-digit phone required';
    if (!email.trim() || !email.includes('@')) e.email = 'Valid email required';
    if (!password || password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    setLoading(true);
    try {
      const res = await registerDriver({
        name: name.trim(), phone: phone.trim(),
        email: email.trim().toLowerCase(), password,
        dateOfBirth: dob?.toISOString() || null,
        address: address || null, city: city || null, state: stateName || null,
        aadharNumber: aadhar || null, panNumber: pan || null,
        licenseNumber: licenseNo || null, licenseType: licenseType || null,
        licenseExpiry: licenseExpiry?.toISOString() || null,
        bankName: bankName || null, accountHolderName: accountHolder || null,
        accountNumber: accountNo || null, ifscCode: ifsc || null,
        emergencyContact: emergencyContact || null, emergencyPhone: emergencyPhone || null,
      });
      if (res.data.success) {
        await setDriverToken(res.data.token);
        // Store driver ID if available
        if (res.data.driver?.did) {
          await AsyncStorage.setItem('driver_id', res.data.driver.did);
        }
        await signIn(res.data.driver, res.data.token);
        navigation.replace('Main');
      } else {
        Alert.alert('Registration Failed', res.data.error);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const f = (key) => ({
    focused: focused === key,
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(null),
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* ── Green Header ── */}
      <LinearGradient
        colors={['#064E3B', '#0D7A4E', '#16A34A']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => step > 1 ? goToStep(step - 1) : navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Create Account</Text>
            <Text style={styles.topSub}>Step {step} of {STEPS.length}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <React.Fragment key={s.label}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    active && styles.stepCircleActive,
                    done && styles.stepCircleDone,
                  ]}>
                    {done
                      ? <Ionicons name="checkmark" size={14} color="#16A34A" />
                      : <Ionicons name={s.icon} size={14} color={active ? '#16A34A' : 'rgba(255,255,255,0.5)'} />
                    }
                  </View>
                  <Text style={[styles.stepLabel, (active || done) && styles.stepLabelActive]}>
                    {s.label}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={styles.stepLineWrap}>
                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── White body ── */}
      <KeyboardAvoidingView
        style={styles.bodyWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >

          {/* ─── Step 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Text style={styles.stepHeading}>Personal Information</Text>
              <Text style={styles.stepSubheading}>Tell us about yourself to get started</Text>

              <SectionCard icon="person-outline" title="Basic Info">
                <Field label="Full Name *" icon="person-outline" placeholder="Enter your full name"
                  value={name} onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
                  error={errors.name} {...f('name')} />
                <Field label="Phone Number *" icon="call-outline" placeholder="10-digit mobile number"
                  value={phone} onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
                  keyboardType="phone-pad" error={errors.phone} {...f('phone')} />
                <Field label="Email Address *" icon="mail-outline" placeholder="your@email.com"
                  value={email} onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address" autoCapitalize="none" error={errors.email} {...f('email')} />
                <Field label="Password *" icon="lock-closed-outline" placeholder="Minimum 6 characters"
                  value={password} onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPass}
                  rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
                  onRightPress={() => setShowPass(!showPass)}
                  error={errors.password} {...f('password')} />
              </SectionCard>

              <SectionCard icon="calendar-outline" title="Additional Details">
                {/* DOB */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <TouchableOpacity
                    style={[styles.inputBox, { paddingHorizontal: 0 }]}
                    onPress={() => setShowDob(true)}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons name="calendar-outline" size={17} color="#94A3B8" />
                    </View>
                    <Text style={[styles.input, { color: dob ? '#0F172A' : '#CBD5E1', paddingHorizontal: 14 }]}>
                      {dob ? formatDate(dob) : 'Select date of birth'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginRight: 14 }} />
                  </TouchableOpacity>
                  {showDob && (
                    <DateTimePicker value={dob || new Date(1990, 0, 1)} mode="date"
                      display="default" maximumDate={new Date()}
                      onChange={(_, d) => { setShowDob(false); if (d) setDob(d); }} />
                  )}
                </View>

                <Field label="Address" icon="location-outline" placeholder="Street, locality, area"
                  value={address} onChangeText={setAddress} {...f('address')} />

                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Field label="City" placeholder="City" value={city}
                      onChangeText={setCity} {...f('city')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="State" placeholder="State" value={stateName}
                      onChangeText={setStateName} {...f('state')} />
                  </View>
                </View>
              </SectionCard>

              <PrimaryBtn label="Next: Documents" icon="arrow-forward-circle"
                onPress={() => { if (validateStep1()) goToStep(2); }} />
            </>
          )}

          {/* ─── Step 2 ───────────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <Text style={styles.stepHeading}>Identity & License</Text>
              <Text style={styles.stepSubheading}>We keep your documents secure & encrypted</Text>

              <SectionCard icon="id-card-outline" title="Identity Documents">
                <Field label="Aadhar Number" icon="card-outline" placeholder="XXXX-XXXX-XXXX"
                  value={aadhar} onChangeText={setAadhar} keyboardType="numeric" maxLength={14}
                  {...f('aadhar')} />
                <Field label="PAN Number" icon="card-outline" placeholder="ABCDE1234F"
                  value={pan} onChangeText={setPan} autoCapitalize="characters" maxLength={10}
                  {...f('pan')} />
              </SectionCard>

              <SectionCard icon="car-outline" title="Driving License">
                <Field label="License Number" icon="document-outline" placeholder="MH0220220012345"
                  value={licenseNo} onChangeText={setLicenseNo} autoCapitalize="characters"
                  {...f('license')} />

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>License Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                      {LICENSE_TYPES.map(t => (
                        <TouchableOpacity key={t}
                          style={[styles.chip, licenseType === t && styles.chipActive]}
                          onPress={() => setLicenseType(t)}
                        >
                          <Text style={[styles.chipText, licenseType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>License Expiry</Text>
                  <TouchableOpacity
                    style={[styles.inputBox, { paddingHorizontal: 0 }]}
                    onPress={() => setShowExpiry(true)}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons name="calendar-outline" size={17} color="#94A3B8" />
                    </View>
                    <Text style={[styles.input, { color: licenseExpiry ? '#0F172A' : '#CBD5E1', paddingHorizontal: 14 }]}>
                      {licenseExpiry ? formatDate(licenseExpiry) : 'Select expiry date'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginRight: 14 }} />
                  </TouchableOpacity>
                  {showExpiry && (
                    <DateTimePicker value={licenseExpiry || new Date()} mode="date"
                      display="default" minimumDate={new Date()}
                      onChange={(_, d) => { setShowExpiry(false); if (d) setLicenseExpiry(d); }} />
                  )}
                </View>
              </SectionCard>

              <PrimaryBtn label="Next: Bank Details" icon="arrow-forward-circle" onPress={() => goToStep(3)} />
            </>
          )}

          {/* ─── Step 3 ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={styles.stepHeading}>Bank & Emergency</Text>
              <Text style={styles.stepSubheading}>For secure payouts and emergency support</Text>

              <SectionCard icon="card-outline" title="Bank Account">
                <Field label="Bank Name" icon="business-outline" placeholder="e.g. State Bank of India"
                  value={bankName} onChangeText={setBankName} {...f('bankName')} />
                <Field label="Account Holder Name" icon="person-outline" placeholder="As per bank records"
                  value={accountHolder} onChangeText={setAccountHolder} {...f('accHolder')} />
                <Field label="Account Number" icon="card-outline" placeholder="Enter account number"
                  value={accountNo} onChangeText={setAccountNo} keyboardType="numeric"
                  {...f('accNo')} />
                <Field label="IFSC Code" icon="code-outline" placeholder="SBIN0001234"
                  value={ifsc} onChangeText={setIfsc} autoCapitalize="characters"
                  {...f('ifsc')} />
              </SectionCard>

              <SectionCard icon="alert-circle-outline" title="Emergency Contact">
                <Field label="Contact Name" icon="person-outline" placeholder="Emergency contact name"
                  value={emergencyContact} onChangeText={setEmergencyContact} {...f('eName')} />
                <Field label="Contact Phone" icon="call-outline" placeholder="Emergency phone number"
                  value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad"
                  {...f('ePhone')} />
              </SectionCard>

              <PrimaryBtn label="Complete Registration" icon="checkmark-circle"
                onPress={handleRegister} loading={loading} />
            </>
          )}

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PrimaryBtn({ label, icon, onPress, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
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
              <Text style={styles.btnText}>{label}</Text>
              <Ionicons name={icon} size={20} color="#fff" />
            </>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#064E3B' },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute', width: width, height: width,
    borderRadius: width / 2, backgroundColor: 'rgba(255,255,255,0.04)',
    top: -width * 0.55, right: -width * 0.2,
  },
  circle2: {
    position: 'absolute', width: width * 0.5, height: width * 0.5,
    borderRadius: width * 0.25, backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -width * 0.1, left: -width * 0.05,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  topSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Step row
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28,
  },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  stepCircleDone: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  stepLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  stepLabelActive: { color: '#FFFFFF' },
  stepLineWrap: { flex: 1, paddingBottom: 18, paddingHorizontal: 6 },
  stepLine: { height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  stepLineDone: { backgroundColor: '#FFFFFF' },

  // Body
  bodyWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  stepHeading: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  stepSubheading: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 24 },

  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#16A34A' },

  // Fields
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 7, letterSpacing: 0.2 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, backgroundColor: '#F8FAFC',
    height: 50, overflow: 'hidden',
  },
  inputBoxFocused: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  inputBoxError: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  iconWrap: {
    width: 42, height: '100%',
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#E2E8F0',
  },
  iconWrapActive: { borderRightColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  input: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', paddingHorizontal: 12 },
  eyeBtn: { padding: 12 },
  errText: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  twoCol: { flexDirection: 'row', gap: 10 },

  // Chips
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },

  // Button
  btn: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, height: 56,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },

  // Login link
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  loginText: { fontSize: 14, color: '#94A3B8' },
  loginLink: { fontSize: 14, color: '#16A34A', fontWeight: '700' },
});
