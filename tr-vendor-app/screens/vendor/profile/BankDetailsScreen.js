import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, apiPost } from '../../api/client';
import { showError, showSuccess } from '../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
};

export default function BankDetailsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
  });

  const fetchBankDetails = useCallback(async () => {
    try {
      const response = await apiGet('/vendor/bank-details');
      const data = response.data?.bankDetails || response.data;
      if (data) {
        setForm({
          accountHolderName: data.accountHolderName || '',
          accountNumber: data.accountNumber || '',
          confirmAccountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          bankName: data.bankName || '',
          branchName: data.branchName || '',
          upiId: data.upiId || '',
        });
      }
    } catch (error) {
      console.log('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankDetails();
  }, [fetchBankDetails]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateForm = () => {
    if (!form.accountHolderName.trim()) { showError('Please enter account holder name'); return false; }
    if (!form.accountNumber.trim()) { showError('Please enter account number'); return false; }
    if (form.accountNumber !== form.confirmAccountNumber) { showError('Account numbers do not match'); return false; }
    if (!form.ifscCode.trim()) { showError('Please enter IFSC code'); return false; }
    if (form.ifscCode.length !== 11) { showError('IFSC code should be 11 characters'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await apiPost('/vendor/bank-details', {
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode.toUpperCase(),
        bankName: form.bankName,
        branchName: form.branchName,
        upiId: form.upiId,
      });
      showSuccess('Bank details saved successfully');
      setIsEditing(false);
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const maskAccountNumber = (accNo) => {
    if (!accNo || accNo.length < 4) return accNo;
    return '●'.repeat(accNo.length - 4) + accNo.slice(-4);
  };

  const hasExistingDetails = !!form.accountNumber && !isEditing;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            {hasExistingDetails && (
              <TouchableOpacity style={styles.editBtnTop} onPress={() => setIsEditing(true)}>
                <Icon name="edit-2" size={17} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              {loading ? (
                <ActivityIndicator size="large" color={C.g400} />
              ) : (
                <MaterialCommunityIcons name="bank-outline" size={34} color={C.g400} />
              )}
            </View>
            <Text style={styles.heroTitle}>Bank Details</Text>
            <Text style={styles.heroSub}>Secure payout account management</Text>
          </View>

          {/* Security Banner */}
          <View style={styles.securityStrip}>
            <Ionicons name="shield-checkmark" size={15} color={C.g400} />
            <Text style={styles.securityText}>256-bit encrypted · PCI DSS compliant · Secure storage</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {!loading && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {hasExistingDetails ? (
            /* ── VIEW MODE ── */
            <>
              <View style={styles.card}>
                {/* Bank Brand Row */}
                <View style={styles.bankBrandRow}>
                  <View style={styles.bankBrandIcon}>
                    <MaterialCommunityIcons name="bank" size={26} color={C.blue} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.bankName}>{form.bankName || 'Your Bank'}</Text>
                    <Text style={styles.branchName}>{form.branchName || 'Primary Account'}</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={C.g600} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.detailList}>
                  {[
                    { label: 'Account Holder', value: form.accountHolderName, icon: 'person-outline' },
                    { label: 'Account Number', value: maskAccountNumber(form.accountNumber), icon: 'card-outline' },
                    { label: 'IFSC Code',       value: form.ifscCode, icon: 'barcode-outline' },
                    ...(form.upiId ? [{ label: 'UPI ID', value: form.upiId, icon: 'phone-portrait-outline' }] : []),
                  ].map((item, i, arr) => (
                    <View key={i} style={[styles.detailRow, i < arr.length - 1 && styles.detailBorder]}>
                      <View style={styles.detailIconBox}>
                        <Ionicons name={item.icon} size={16} color={C.sub} />
                      </View>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0)']}
                  style={[styles.editBtnInner, { borderWidth: 1.5, borderColor: C.g600 }]}
                >
                  <Icon name="edit-2" size={16} color={C.g600} />
                  <Text style={[styles.editBtnText, { color: C.g600 }]}>Edit Bank Details</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* ── EDIT / ADD MODE ── */
            <View style={styles.card}>
              <View style={styles.formHeaderRow}>
                <View style={styles.formHeaderIcon}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={C.g600} />
                </View>
                <View>
                  <Text style={styles.formHeaderTitle}>Payout Account</Text>
                  <Text style={styles.formHeaderSub}>Add your bank account for receiving payments</Text>
                </View>
              </View>

              <InputField label="Account Holder Name" required
                placeholder="Enter account holder name"
                value={form.accountHolderName}
                onChangeText={(v) => updateForm('accountHolderName', v)}
              />
              <InputField label="Account Number" required
                placeholder="Enter account number"
                value={form.accountNumber}
                onChangeText={(v) => updateForm('accountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
              <InputField label="Confirm Account Number" required
                placeholder="Re-enter account number"
                value={form.confirmAccountNumber}
                onChangeText={(v) => updateForm('confirmAccountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <InputField label="IFSC Code" required
                    placeholder="SBIN0001234"
                    value={form.ifscCode}
                    onChangeText={(v) => updateForm('ifscCode', v.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="Bank Name"
                    placeholder="e.g. HDFC"
                    value={form.bankName}
                    onChangeText={(v) => updateForm('bankName', v)}
                  />
                </View>
              </View>

              <InputField label="Branch Name"
                placeholder="Enter branch name"
                value={form.branchName}
                onChangeText={(v) => updateForm('branchName', v)}
              />
              <InputField label="UPI ID (Optional)"
                placeholder="name@upi"
                value={form.upiId}
                onChangeText={(v) => updateForm('upiId', v)}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.g600, C.g500]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGrad}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>Save Details</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={() => { setIsEditing(false); fetchBankDetails(); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function InputField({ label, required, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={C.muted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerGrad: { paddingHorizontal: 16, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnTop: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  securityStrip: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, gap: 6,
  },
  securityText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  scroll: { padding: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  bankBrandRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  bankBrandIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: C.blueL,
    alignItems: 'center', justifyContent: 'center',
  },
  bankName: { fontSize: 16, fontWeight: '800', color: C.text },
  branchName: { fontSize: 13, color: C.sub, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: C.g600 },

  detailList: { paddingHorizontal: 4 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, gap: 10,
  },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  detailIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: C.sub },
  detailValue: { fontSize: 14, fontWeight: '700', color: C.text },

  editBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  editBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, gap: 8,
    borderRadius: 12,
  },
  editBtnText: { fontSize: 15, fontWeight: '700' },

  /* Form */
  formHeaderRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  formHeaderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  formHeaderTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  formHeaderSub: { fontSize: 12, color: C.sub, marginTop: 2 },

  inputGroup: { marginBottom: 14, paddingHorizontal: 16 },
  rowInputs: { flexDirection: 'row', gap: 0 },
  label: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 7, marginLeft: 2 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1,
    borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, fontWeight: '500',
  },

  saveBtn: { marginHorizontal: 16, marginTop: 4, marginBottom: 4, borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 15, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
  cancelBtnText: { fontSize: 14, color: C.sub, fontWeight: '600' },
});
