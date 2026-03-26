import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerDriver, setDriverToken } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';

const LICENSE_TYPES = ['LMV', 'MCWG', 'HMV', 'HPMV', 'TRANS', 'PSV'];
const STEPS = ['Personal', 'Documents', 'Bank'];

function formatDate(d) {
  if (!d) return '';
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

// ── Reusable field ─────────────────────────────────────────────────────────────
function Field({ label, icon, error, rightIcon, onRightPress, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error && styles.inputRowErr]}>
        {icon && <Ionicons name={icon} size={17} color={error ? '#EF4444' : '#94A3B8'} style={{ marginRight: 10 }} />}
        <TextInput style={styles.input} placeholderTextColor="#CBD5E1" {...props} />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={{ padding: 4 }}>
            <Ionicons name={rightIcon} size={17} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

function SectionLabel({ icon, title }) {
  return (
    <View style={styles.secRow}>
      <View style={styles.secIcon}>
        <Ionicons name={icon} size={14} color="#16A34A" />
      </View>
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top bar (outside scroll — no layout issues) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Create Account</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Step indicator (outside scroll) ── */}
      <View style={styles.stepBar}>
        {STEPS.map((s, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepActive, done && styles.stepDone]}>
                  {done
                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                    : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{n}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Scrollable form ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ─── Step 1 ──────────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Text style={styles.stepHeading}>Personal Information</Text>

              <Field label="Full Name *" icon="person-outline"
                placeholder="Enter your full name" value={name}
                onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: '' })); }}
                error={errors.name} />
              <Field label="Phone Number *" icon="call-outline"
                placeholder="10-digit mobile number" value={phone}
                onChangeText={t => { setPhone(t); setErrors(e => ({ ...e, phone: '' })); }}
                keyboardType="phone-pad" error={errors.phone} />
              <Field label="Email Address *" icon="mail-outline"
                placeholder="your@email.com" value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                keyboardType="email-address" autoCapitalize="none" error={errors.email} />
              <Field label="Password *" icon="lock-closed-outline"
                placeholder="Minimum 6 characters" value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPass}
                rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
                onRightPress={() => setShowPass(!showPass)}
                error={errors.password} />

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity style={styles.inputRow} onPress={() => setShowDob(true)}>
                  <Ionicons name="calendar-outline" size={17} color="#94A3B8" style={{ marginRight: 10 }} />
                  <Text style={[styles.input, { color: dob ? '#0F172A' : '#CBD5E1' }]}>
                    {dob ? formatDate(dob) : 'Select date of birth'}
                  </Text>
                </TouchableOpacity>
                {showDob && (
                  <DateTimePicker value={dob || new Date(1990, 0, 1)} mode="date"
                    display="default" maximumDate={new Date()}
                    onChange={(_, d) => { setShowDob(false); if (d) setDob(d); }} />
                )}
              </View>

              <Field label="Address" icon="location-outline"
                placeholder="Street, locality, area" value={address} onChangeText={setAddress} />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="City" placeholder="City" value={city} onChangeText={setCity} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="State" placeholder="State" value={stateName} onChangeText={setStateName} />
                </View>
              </View>

              <PrimaryBtn label="Next: Documents" onPress={() => { if (validateStep1()) setStep(2); }} />
            </>
          )}

          {/* ─── Step 2 ──────────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <Text style={styles.stepHeading}>Identity & License</Text>

              <SectionLabel icon="id-card-outline" title="Identity Documents" />
              <Field label="Aadhar Number" icon="card-outline"
                placeholder="XXXX-XXXX-XXXX" value={aadhar} onChangeText={setAadhar}
                keyboardType="numeric" maxLength={14} />
              <Field label="PAN Number" icon="card-outline"
                placeholder="ABCDE1234F" value={pan} onChangeText={setPan}
                autoCapitalize="characters" maxLength={10} />

              <SectionLabel icon="car-outline" title="Driving License" />
              <Field label="License Number" icon="document-outline"
                placeholder="MH0220220012345" value={licenseNo} onChangeText={setLicenseNo}
                autoCapitalize="characters" />

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>License Type</Text>
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
                <Text style={styles.label}>License Expiry</Text>
                <TouchableOpacity style={styles.inputRow} onPress={() => setShowExpiry(true)}>
                  <Ionicons name="calendar-outline" size={17} color="#94A3B8" style={{ marginRight: 10 }} />
                  <Text style={[styles.input, { color: licenseExpiry ? '#0F172A' : '#CBD5E1' }]}>
                    {licenseExpiry ? formatDate(licenseExpiry) : 'Select expiry date'}
                  </Text>
                </TouchableOpacity>
                {showExpiry && (
                  <DateTimePicker value={licenseExpiry || new Date()} mode="date"
                    display="default" minimumDate={new Date()}
                    onChange={(_, d) => { setShowExpiry(false); if (d) setLicenseExpiry(d); }} />
                )}
              </View>

              <PrimaryBtn label="Next: Bank Details" onPress={() => setStep(3)} />
            </>
          )}

          {/* ─── Step 3 ──────────────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={styles.stepHeading}>Bank & Emergency</Text>

              <SectionLabel icon="card-outline" title="Bank Account" />
              <Field label="Bank Name" icon="business-outline"
                placeholder="e.g. State Bank of India" value={bankName} onChangeText={setBankName} />
              <Field label="Account Holder Name" icon="person-outline"
                placeholder="As per bank records" value={accountHolder} onChangeText={setAccountHolder} />
              <Field label="Account Number" icon="card-outline"
                placeholder="Enter account number" value={accountNo} onChangeText={setAccountNo}
                keyboardType="numeric" />
              <Field label="IFSC Code" icon="code-outline"
                placeholder="SBIN0001234" value={ifsc} onChangeText={setIfsc}
                autoCapitalize="characters" />

              <SectionLabel icon="call-outline" title="Emergency Contact" />
              <Field label="Contact Name" icon="person-outline"
                placeholder="Emergency contact name" value={emergencyContact} onChangeText={setEmergencyContact} />
              <Field label="Contact Phone" icon="call-outline"
                placeholder="Emergency phone number" value={emergencyPhone} onChangeText={setEmergencyPhone}
                keyboardType="phone-pad" />

              <PrimaryBtn label="Complete Registration" onPress={handleRegister} loading={loading} />
            </>
          )}

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PrimaryBtn({ label, onPress, loading }) {
  return (
    <TouchableOpacity
      onPress={onPress}
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
              <Text style={styles.btnText}>{label}</Text>
              <Ionicons name={label.startsWith('Complete') ? 'checkmark-circle' : 'arrow-forward'} size={18} color="#fff" />
            </>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },

  // Step indicator
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  stepItem: { alignItems: 'center', gap: 5 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  stepActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  stepDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  stepNumActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  stepLabelActive: { color: '#16A34A' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 8, marginBottom: 16 },
  stepLineDone: { backgroundColor: '#16A34A' },

  // Scroll
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  stepHeading: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 24 },

  // Section label
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 8 },
  secIcon: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  secTitle: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  // Fields
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16,
    height: 52, backgroundColor: '#FAFAFA',
  },
  inputRowErr: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  errText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  twoCol: { flexDirection: 'row', gap: 12 },

  // Chips
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  chipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },

  // Button
  btn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  btnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56,
  },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  // Footer
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#94A3B8' },
  loginLink: { fontSize: 14, color: '#16A34A', fontWeight: '700' },
});
