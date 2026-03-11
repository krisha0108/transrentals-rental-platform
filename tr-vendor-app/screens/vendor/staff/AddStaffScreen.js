import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { addStaff, updateStaff } from '../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  red: '#EF4444',
};

const ROLES = [
  { label: 'Driver', value: 'DRIVER' },
  { label: 'Helper', value: 'HELPER' },
  { label: 'Mechanic', value: 'MECHANIC' },
  { label: 'Supervisor', value: 'SUPERVISOR' },
  { label: 'Office Staff', value: 'OFFICE_STAFF' },
];

const LICENSE_TYPES = [
  { label: 'LMV (Light Motor Vehicle)', value: 'LMV' },
  { label: 'LMV-TR (LMV + Transport)', value: 'LMV-TR' },
  { label: 'HMV (Heavy Motor Vehicle)', value: 'HMV' },
  { label: 'HGMV (Heavy Goods Motor Vehicle)', value: 'HGMV' },
  { label: 'HPMV (Heavy Passenger Motor Vehicle)', value: 'HPMV' },
  { label: 'MCWG (Motorcycle with Gear)', value: 'MCWG' },
  { label: 'MCWOG (Motorcycle without Gear)', value: 'MCWOG' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function AddStaffScreen({ route, navigation }) {
  const { staffId, staff: existingStaff } = route.params || {};
  const isEditing = !!staffId;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLicenseTypeModal, setShowLicenseTypeModal] = useState(false);

  // Date picker states
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showJoiningDatePicker, setShowJoiningDatePicker] = useState(false);
  const [showLicenseExpiryPicker, setShowLicenseExpiryPicker] = useState(false);

  const [form, setForm] = useState({
    // Personal Info
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',

    // Role & Status
    role: '',
    status: 'ACTIVE',

    // Documents
    aadharNumber: '',
    panNumber: '',

    // License (for drivers)
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',

    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',

    // Employment
    salary: '',
    joiningDate: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  useEffect(() => {
    if (existingStaff) {
      setForm({
        name: existingStaff.name || '',
        phone: existingStaff.phone || '',
        email: existingStaff.email || '',
        password: '',
        address: existingStaff.address || '',
        city: existingStaff.city || '',
        state: existingStaff.state || '',
        pincode: existingStaff.pincode || '',
        dateOfBirth: existingStaff.dateOfBirth || '',
        role: existingStaff.role || '',
        status: existingStaff.status || 'ACTIVE',
        aadharNumber: existingStaff.aadharNumber || '',
        panNumber: existingStaff.panNumber || '',
        licenseNumber: existingStaff.licenseNumber || '',
        licenseType: existingStaff.licenseType || '',
        licenseExpiry: existingStaff.licenseExpiry || '',
        bankName: existingStaff.bankName || '',
        accountNumber: existingStaff.accountNumber || '',
        ifscCode: existingStaff.ifscCode || '',
        accountHolderName: existingStaff.accountHolderName || '',
        salary: existingStaff.salary?.toString() || '',
        joiningDate: existingStaff.joiningDate || '',
        emergencyContact: existingStaff.emergencyContact || '',
        emergencyPhone: existingStaff.emergencyPhone || '',
      });
    }
  }, [existingStaff]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Date picker handlers
  const handleDateConfirm = (date, field) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    updateForm(field, formattedDate);
    setShowDOBPicker(false);
    setShowJoiningDatePicker(false);
    setShowLicenseExpiryPicker(false);
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getRoleLabel = (value) => {
    const role = ROLES.find(r => r.value === value);
    return role ? role.label : 'Select Role';
  };

  const getStatusLabel = (value) => {
    const status = STATUS_OPTIONS.find(s => s.value === value);
    return status ? status.label : 'Select Status';
  };

  const getLicenseTypeLabel = (value) => {
    const type = LICENSE_TYPES.find(t => t.value === value);
    return type ? type.label : 'Select License Type';
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showError('Please enter staff name');
      return false;
    }
    if (!form.phone.trim()) {
      showError('Please enter phone number');
      return false;
    }
    if (!form.role) {
      showError('Please select role');
      return false;
    }

    // Password validation
    if (!isEditing) {
      if (!form.password.trim()) {
        showError('Password is required for new staff');
        return false;
      }
      if (form.password.length < 6) {
        showError('Password must be at least 6 characters');
        return false;
      }
    } else if (form.password.trim() && form.password.length < 6) {
      showError('Password must be at least 6 characters');
      return false;
    }

    // For drivers, email is also required
    if (form.role === 'DRIVER' && !form.email.trim()) {
      showError('Email is required for drivers (needed for app login)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TEMPORARY FIX: Send as JSON instead of FormData (skip files for now)
      // Files will be uploaded separately later
      const staffData = {
        name: form.name,
        phone: form.phone,
        email: form.email || '',
        password: form.password || '',
        address: form.address || '',
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || '',
        dateOfBirth: form.dateOfBirth || '',
        role: form.role,
        status: form.status,
        aadharNumber: form.aadharNumber || '',
        panNumber: form.panNumber || '',
        licenseNumber: form.licenseNumber || '',
        licenseType: form.licenseType || '',
        licenseExpiry: form.licenseExpiry || '',
        bankName: form.bankName || '',
        accountNumber: form.accountNumber || '',
        ifscCode: form.ifscCode || '',
        accountHolderName: form.accountHolderName || '',
        salary: form.salary || '0',
        joiningDate: form.joiningDate || '',
        emergencyContact: form.emergencyContact || '',
        emergencyPhone: form.emergencyPhone || '',
        // Files skipped for now - will be added via separate upload endpoint
        profilePhoto: null,
        aadharDocument: null,
        panDocument: null,
        licenseDocument: null,
      };

      console.log('[AddStaff] Submitting data:', { ...staffData, password: '***' });

      if (isEditing) {
        await updateStaff(staffId, staffData);
        showSuccess('Staff updated successfully', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
      } else {
        await addStaff(staffData);
        showSuccess('Staff added successfully', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
      }
    } catch (error) {
      console.error('[AddStaff] Error saving staff:', error);
      console.error('[AddStaff] Error response:', error?.response?.data);
      console.error('[AddStaff] Error status:', error?.response?.status);
      showError(error?.response?.data?.error || error?.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  const isDriver = form.role === 'DRIVER';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Staff' : 'Add Staff'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor={C.muted}
              value={form.name}
              onChangeText={(v) => updateForm('name', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={C.muted}
              value={form.phone}
              onChangeText={(v) => updateForm('phone', v)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email {isDriver && '*'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={C.muted}
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {isDriver && <Text style={styles.hint}>Required for driver app login</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isEditing ? 'Update Password' : 'Password'} {!isEditing && isDriver && '*'}
            </Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder={isEditing ? 'Enter new password to change' : 'Enter password (min 6 characters)'}
                placeholderTextColor={C.muted}
                value={form.password}
                onChangeText={(v) => updateForm('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            {isEditing ? (
              <Text style={styles.hint}>Leave empty to keep current password</Text>
            ) : (
              isDriver && <Text style={styles.hint}>Required for driver app login</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowDOBPicker(true)}
            >
              <Text style={form.dateOfBirth ? styles.selectInputText : styles.selectInputPlaceholder}>
                {form.dateOfBirth ? formatDateForDisplay(form.dateOfBirth) : 'Select Date of Birth'}
              </Text>
              <Icon name="calendar" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowRoleModal(true)}
            >
              <Text style={form.role ? styles.selectInputText : styles.selectInputPlaceholder}>
                {getRoleLabel(form.role)}
              </Text>
              <Icon name="chevron-down" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={form.status ? styles.selectInputText : styles.selectInputPlaceholder}>
                {getStatusLabel(form.status)}
              </Text>
              <Icon name="chevron-down" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter address"
              placeholderTextColor={C.muted}
              value={form.address}
              onChangeText={(v) => updateForm('address', v)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor={C.muted}
              value={form.city}
              onChangeText={(v) => updateForm('city', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowStateModal(true)}
            >
              <Text style={form.state ? styles.selectInputText : styles.selectInputPlaceholder}>
                {form.state || 'Select State'}
              </Text>
              <Icon name="chevron-down" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pincode"
              placeholderTextColor={C.muted}
              value={form.pincode}
              onChangeText={(v) => updateForm('pincode', v)}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Documents</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aadhar Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Aadhar number"
              placeholderTextColor={C.muted}
              value={form.aadharNumber}
              onChangeText={(v) => updateForm('aadharNumber', v)}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PAN number"
              placeholderTextColor={C.muted}
              value={form.panNumber}
              onChangeText={(v) => updateForm('panNumber', v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>
        </View>

        {/* License (Only for drivers) */}
        {isDriver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driving License</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter license number"
                placeholderTextColor={C.muted}
                value={form.licenseNumber}
                onChangeText={(v) => updateForm('licenseNumber', v.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Type</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowLicenseTypeModal(true)}
              >
                <Text style={form.licenseType ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {getLicenseTypeLabel(form.licenseType)}
                </Text>
                <Icon name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Expiry</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowLicenseExpiryPicker(true)}
              >
                <Text style={form.licenseExpiry ? styles.selectInputText : styles.selectInputPlaceholder}>
                  {form.licenseExpiry ? formatDateForDisplay(form.licenseExpiry) : 'Select Expiry Date'}
                </Text>
                <Icon name="calendar" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>

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
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account holder name"
              placeholderTextColor={C.muted}
              value={form.accountHolderName}
              onChangeText={(v) => updateForm('accountHolderName', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor={C.muted}
              value={form.accountNumber}
              onChangeText={(v) => updateForm('accountNumber', v)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter IFSC code"
              placeholderTextColor={C.muted}
              value={form.ifscCode}
              onChangeText={(v) => updateForm('ifscCode', v.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Employment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Salary</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter monthly salary"
              placeholderTextColor={C.muted}
              value={form.salary}
              onChangeText={(v) => updateForm('salary', v)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Joining Date</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowJoiningDatePicker(true)}
            >
              <Text style={form.joiningDate ? styles.selectInputText : styles.selectInputPlaceholder}>
                {form.joiningDate ? formatDateForDisplay(form.joiningDate) : 'Select Joining Date'}
              </Text>
              <Icon name="calendar" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter emergency contact name"
              placeholderTextColor={C.muted}
              value={form.emergencyContact}
              onChangeText={(v) => updateForm('emergencyContact', v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter emergency contact phone"
              placeholderTextColor={C.muted}
              value={form.emergencyPhone}
              onChangeText={(v) => updateForm('emergencyPhone', v)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Update Staff' : 'Add Staff'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={showDOBPicker}
        mode="date"
        onConfirm={(date) => handleDateConfirm(date, 'dateOfBirth')}
        onCancel={() => setShowDOBPicker(false)}
        maximumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={showJoiningDatePicker}
        mode="date"
        onConfirm={(date) => handleDateConfirm(date, 'joiningDate')}
        onCancel={() => setShowJoiningDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showLicenseExpiryPicker}
        mode="date"
        onConfirm={(date) => handleDateConfirm(date, 'licenseExpiry')}
        onCancel={() => setShowLicenseExpiryPicker(false)}
        minimumDate={new Date()}
      />

      {/* Role Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={styles.optionItem}
                  onPress={() => {
                    updateForm('role', role.value);
                    setShowRoleModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{role.label}</Text>
                  {form.role === role.value && <Icon name="check" size={20} color={C.brand} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={styles.optionItem}
                  onPress={() => {
                    updateForm('status', status.value);
                    setShowStatusModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{status.label}</Text>
                  {form.status === status.value && <Icon name="check" size={20} color={C.brand} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* License Type Modal */}
      <Modal
        visible={showLicenseTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLicenseTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select License Type</Text>
              <TouchableOpacity onPress={() => setShowLicenseTypeModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {LICENSE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.optionItem}
                  onPress={() => {
                    updateForm('licenseType', type.value);
                    setShowLicenseTypeModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{type.label}</Text>
                  {form.licenseType === type.value && <Icon name="check" size={20} color={C.brand} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Selection Modal */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {INDIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.optionItem}
                  onPress={() => {
                    updateForm('state', state);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{state}</Text>
                  {form.state === state && <Icon name="check" size={20} color={C.brand} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
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
  selectInput: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  selectInputText: {
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  selectInputPlaceholder: {
    fontSize: 15,
    color: C.muted,
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.brand,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  optionText: {
    fontSize: 15,
    color: C.text,
  },
});
