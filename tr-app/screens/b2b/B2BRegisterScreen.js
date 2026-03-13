import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Easing, ScrollView,
  KeyboardAvoidingView, Platform, Dimensions, Image, Modal, FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import { b2bService } from '../services';

const { width, height } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const BUSINESS_TYPES = [
  'IT/Software', 'Manufacturing', 'Logistics', 'Construction',
  'Healthcare', 'Education', 'Hospitality', 'Government',
  'BFSI', 'Retail', 'Other',
];

export default function B2BRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1 = personal, 2 = company
  const [loading, setLoading] = useState(false);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', gstin: '', businessType: '', companyAddress: '',
    companyPhone: '', companyEmail: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '', onClose: null });

  const showAlert = (type, title, message, onClose = null) => {
    setAlertModal({ visible: true, type, title, message, onClose });
  };
  const closeAlert = () => {
    const cb = alertModal.onClose;
    setAlertModal({ visible: false, type: '', title: '', message: '', onClose: null });
    if (cb) cb();
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goToStep2 = () => {
    const { name, email, phone, password } = formData;
    if (!name || !email || !phone || !password) {
      return showAlert('error', 'Missing Fields', 'All fields are required.');
    }
    if (password.length < 6) {
      return showAlert('error', 'Weak Password', 'Password must be at least 6 characters.');
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    setStep(2);
  };

  const handleRegister = async () => {
    const { companyName, businessType, companyAddress } = formData;
    if (!companyName || !businessType || !companyAddress) {
      return showAlert('error', 'Missing Details', 'Company name, business type and address are required.');
    }
    setLoading(true);
    try {
      const response = await b2bService.register(formData);
      if (response.status === 'success') {
        const customerData = response.customers || response.customer;
        await authService.saveCustomerData(customerData, response.token);
        try {
          const fcmToken = await messaging().getToken();
          await authService.saveFcmToken(customerData.id, fcmToken);
        } catch (err) {
          console.log('FCM token error:', err.message);
        }
        showAlert('success', 'Registration Successful!',
          `Your B2B account is pending admin approval. You'll be notified once approved.\n\nCustomer ID: ${customerData.id}`,
          () => navigation.replace('CustomerDashboard')
        );
      } else {
        showAlert('error', 'Registration Failed', response.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      showAlert('error', 'Something Went Wrong', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepLabel}>Step 1 of 2 - Contact Person</Text>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="user" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Full Name"
            value={formData.name}
            onChangeText={(t) => handleChange('name', t)}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="mail" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(t) => handleChange('email', t)}
            style={styles.input}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="phone" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(t) => handleChange('phone', t)}
            style={styles.input}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Create Password"
            value={formData.password}
            onChangeText={(t) => handleChange('password', t)}
            style={[styles.input, { paddingRight: scale(10) }]}
            placeholderTextColor="#999"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={{ width: scale(30), alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={passwordVisible ? 'eye' : 'eye-off'} size={scale(18)} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={goToStep2}>
        <Text style={styles.primaryBtnText}>Next - Company Details</Text>
        <Icon name="arrow-right" size={scale(18)} color="#fff" />
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepLabel}>Step 2 of 2 - Company Details</Text>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="briefcase" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Company Name *"
            value={formData.companyName}
            onChangeText={(t) => handleChange('companyName', t)}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="file-text" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="GSTIN (Optional)"
            value={formData.gstin}
            onChangeText={(t) => handleChange('gstin', t.toUpperCase())}
            style={styles.input}
            placeholderTextColor="#999"
            autoCapitalize="characters"
            maxLength={15}
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowBusinessPicker(true)}
        >
          <Icon name="grid" size={scale(20)} color="#666" style={styles.inputIcon} />
          <Text style={[styles.input, { color: formData.businessType ? '#333' : '#999' }]}>
            {formData.businessType || 'Select Business Type *'}
          </Text>
          <Icon name="chevron-down" size={scale(20)} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <View style={[styles.inputContainer, { height: scale(120), alignItems: 'flex-start', paddingVertical: scale(12) }]}>
          <Icon name="map-pin" size={scale(20)} color="#666" style={[styles.inputIcon, { marginTop: scale(2) }]} />
          <TextInput
            placeholder="Company Address *"
            value={formData.companyAddress}
            onChangeText={(t) => handleChange('companyAddress', t)}
            style={{ flex: 1, fontSize: scale(15), height: scale(100), color: '#333', textAlignVertical: 'top',paddingRight: scale(25) }}
            placeholderTextColor="#999"
            multiline
          />
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="phone" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Company Phone *"
            value={formData.companyPhone}
            onChangeText={(t) => handleChange('companyPhone', t)}
            style={styles.input}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <Icon name="mail" size={scale(20)} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Company Email *"
            value={formData.companyEmail}
            onChangeText={(t) => handleChange('companyEmail', t)}
            style={styles.input}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Icon name="info" size={scale(16)} color="#2563EB" />
        <Text style={styles.infoText}>
          Your B2B account will be reviewed by our team. You'll be notified once approved to start creating bulk bookings.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => { fadeAnim.setValue(0); slideAnim.setValue(50); setStep(1); }}>
          <Icon name="arrow-left" size={scale(18)} color="#22C55E" />
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { flex: 1, marginLeft: scale(12) }, loading && { backgroundColor: '#A9A9A9' }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.primaryBtnText, { marginRight: scale(8) }]}>Registering...</Text>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Register B2B Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={scale(24)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Icon name="briefcase" size={scale(40)} color="#fff" />
              <Text style={styles.headerTitle}>B2B Registration</Text>
              <Text style={styles.headerSub}>Register your company for bulk transport bookings</Text>
            </View>
          </View>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {step === 1 ? renderStep1() : renderStep2()}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Log In</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Business Type Picker Modal */}
      <Modal visible={showBusinessPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Business Type</Text>
              <TouchableOpacity onPress={() => setShowBusinessPicker(false)}>
                <Icon name="x" size={scale(24)} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BUSINESS_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, formData.businessType === item && styles.modalItemActive]}
                  onPress={() => { handleChange('businessType', item); setShowBusinessPicker(false); }}
                >
                  <Text style={[styles.modalItemText, formData.businessType === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {formData.businessType === item && <Icon name="check" size={scale(18)} color="#22C55E" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={alertStyles.overlay}>
          <View style={alertStyles.card}>
            <View style={[alertStyles.iconCircle, { backgroundColor: alertModal.type === 'success' ? '#F0FFF4' : '#FEF2F2' }]}>
              <Icon
                name={alertModal.type === 'success' ? 'check-circle' : 'alert-circle'}
                size={scale(36)}
                color={alertModal.type === 'success' ? '#22C55E' : '#EF4444'}
              />
            </View>
            <Text style={alertStyles.title}>{alertModal.title}</Text>
            <Text style={alertStyles.message}>{alertModal.message}</Text>
            <TouchableOpacity
              style={[alertStyles.btn, { backgroundColor: alertModal.type === 'success' ? '#22C55E' : '#EF4444' }]}
              onPress={closeAlert}
            >
              <Text style={alertStyles.btnText}>{alertModal.type === 'success' ? 'Continue' : 'Got it'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContainer: { flexGrow: 1 },
  header: {
    backgroundColor: '#22C55E',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + scale(16) : scale(60),
    paddingBottom: scale(40),
    paddingHorizontal: scale(20),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  backBtn: { marginBottom: scale(15) },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: scale(26), fontWeight: '800', color: '#fff', marginTop: scale(10) },
  headerSub: { fontSize: scale(14), color: 'rgba(255,255,255,0.85)', marginTop: scale(6), textAlign: 'center' },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: scale(16),
    marginTop: -scale(20),
    borderRadius: scale(20),
    padding: scale(20),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: scale(30),
  },
  stepLabel: { fontSize: scale(13), color: '#22C55E', fontWeight: '700', marginBottom: scale(16), textAlign: 'center' },
  inputWrapper: { marginBottom: scale(14) },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
    borderRadius: scale(12), paddingHorizontal: scale(14), height: scale(52),
    borderWidth: 1, borderColor: '#E9ECEF',
  },
  inputIcon: { marginRight: scale(10) },
  input: { flex: 1, fontSize: scale(15), color: '#333' },
  primaryBtn: {
    backgroundColor: '#22C55E', height: scale(52), borderRadius: scale(14),
    alignItems: 'center', justifyContent: 'center', marginTop: scale(10),
    flexDirection: 'row', gap: scale(8),
  },
  primaryBtnText: { fontSize: scale(16), color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    height: scale(52), borderRadius: scale(14), alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: scale(6), borderWidth: 1.5, borderColor: '#22C55E', paddingHorizontal: scale(16),
  },
  secondaryBtnText: { fontSize: scale(15), color: '#22C55E', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: scale(10) },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: scale(10),
    padding: scale(12), marginTop: scale(6), marginBottom: scale(6), gap: scale(8),
  },
  infoText: { fontSize: scale(12), color: '#2563EB', flex: 1, lineHeight: scale(18) },
  loginContainer: { alignItems: 'center', marginTop: scale(18) },
  loginText: { fontSize: scale(14), color: '#666' },
  loginLink: { color: '#22C55E', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), maxHeight: '60%', paddingBottom: scale(30) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: scale(18), fontWeight: '700', color: '#333' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(16), borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  modalItemActive: { backgroundColor: '#F0FFF4' },
  modalItemText: { fontSize: scale(15), color: '#333' },
  modalItemTextActive: { color: '#22C55E', fontWeight: '600' },
});

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: scale(30),
  },
  card: {
    backgroundColor: '#fff', borderRadius: scale(20), padding: scale(28),
    alignItems: 'center', width: '100%',
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  iconCircle: {
    width: scale(72), height: scale(72), borderRadius: scale(36),
    alignItems: 'center', justifyContent: 'center', marginBottom: scale(16),
  },
  title: {
    fontSize: scale(20), fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: scale(10),
  },
  message: {
    fontSize: scale(14), color: '#666', textAlign: 'center', lineHeight: scale(22), marginBottom: scale(24),
  },
  btn: {
    width: '100%', height: scale(50), borderRadius: scale(14),
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: scale(16), fontWeight: '700', color: '#fff' },
});
