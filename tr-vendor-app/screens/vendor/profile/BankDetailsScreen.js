import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { apiGet, apiPost } from '../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
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

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!form.accountHolderName.trim()) {
      showError('Please enter account holder name');
      return false;
    }
    if (!form.accountNumber.trim()) {
      showError('Please enter account number');
      return false;
    }
    if (form.accountNumber !== form.confirmAccountNumber) {
      showError('Account numbers do not match');
      return false;
    }
    if (!form.ifscCode.trim()) {
      showError('Please enter IFSC code');
      return false;
    }
    if (form.ifscCode.length !== 11) {
      showError('IFSC code should be 11 characters');
      return false;
    }
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
      console.log('Error saving bank details:', error);
      showError(error?.response?.data?.error || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const maskAccountNumber = (accNo) => {
    if (!accNo || accNo.length < 4) return accNo;
    return '●'.repeat(accNo.length - 4) + accNo.slice(-4);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const hasExistingDetails = !!form.accountNumber && !isEditing;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        {hasExistingDetails && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Icon name="edit-2" size={18} color={C.blue} />
          </TouchableOpacity>
        )}
        {!hasExistingDetails && <View style={{ width: 36 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="shield" size={18} color={C.blue} />
          <Text style={styles.infoText}>
            Your bank details are encrypted and securely stored
          </Text>
        </View>

        {/* View Mode */}
        {hasExistingDetails ? (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Holder</Text>
              <Text style={styles.detailValue}>{form.accountHolderName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>{maskAccountNumber(form.accountNumber)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IFSC Code</Text>
              <Text style={styles.detailValue}>{form.ifscCode}</Text>
            </View>
            {form.bankName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank Name</Text>
                <Text style={styles.detailValue}>{form.bankName}</Text>
              </View>
            )}
            {form.branchName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Branch</Text>
                <Text style={styles.detailValue}>{form.branchName}</Text>
              </View>
            )}
            {form.upiId && (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>UPI ID</Text>
                <Text style={styles.detailValue}>{form.upiId}</Text>
              </View>
            )}
          </View>
        ) : (
          /* Edit/Add Mode */
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account holder name"
                placeholderTextColor={C.muted}
                value={form.accountHolderName}
                onChangeText={(v) => updateForm('accountHolderName', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor={C.muted}
                value={form.accountNumber}
                onChangeText={(v) => updateForm('accountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter account number"
                placeholderTextColor={C.muted}
                value={form.confirmAccountNumber}
                onChangeText={(v) => updateForm('confirmAccountNumber', v.replace(/\D/g, ''))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., SBIN0001234"
                placeholderTextColor={C.muted}
                value={form.ifscCode}
                onChangeText={(v) => updateForm('ifscCode', v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={11}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                placeholderTextColor={C.muted}
                value={form.bankName}
                onChangeText={(v) => updateForm('bankName', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter branch name"
                placeholderTextColor={C.muted}
                value={form.branchName}
                onChangeText={(v) => updateForm('branchName', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>UPI ID (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., name@upi"
                placeholderTextColor={C.muted}
                value={form.upiId}
                onChangeText={(v) => updateForm('upiId', v)}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Bank Details</Text>
                </>
              )}
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsEditing(false);
                  fetchBankDetails();
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: C.blue,
  },
  detailsCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: {
    fontSize: 14,
    color: C.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.brand,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
  },
});
