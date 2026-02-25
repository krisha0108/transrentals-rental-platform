// screens/vendor/VendorRegisterScreen.js
// Updated for Next.js backend - 2-step registration matching web app
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Image, Modal
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomAlert from "../../CustomAlertmahek";
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerVendor, loginVendorDirect } from '../../api/client';

const BRAND = {
  primary: "#1FC77A",
  primaryDark: "#12AD66",
  ink: "#0F1720",
  text: "#334155",
  subText: "#64748B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6EDF5",
  error: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

const { width } = Dimensions.get("window");

const BUSINESS_TYPES = [
  'Sole Proprietor',
  'Partnership Firm',
  'Private Limited Company',
  'Limited Liability Partnership (LLP)',
  'Public Limited Company',
  'One Person Company (OPC)',
  'Other',
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh',
];

export default function VendorRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Basic Info
    businessName: "",
    businessType: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2 - Business Details
    gstNumber: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);

  // CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
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

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Validations
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()),
    [formData.email]
  );
  const isPhoneValid = useMemo(
    () => /^[6-9]\d{9}$/.test((formData.phone || "").replace(/\D/g, "")),
    [formData.phone]
  );
  const isPasswordValid = useMemo(
    () => formData.password.length >= 8,
    [formData.password]
  );
  const passwordsMatch = useMemo(
    () => formData.password === formData.confirmPassword,
    [formData.password, formData.confirmPassword]
  );

  // Step 1 validation
  const isStep1Valid = useMemo(() => {
    return (
      formData.businessName.trim().length >= 2 &&
      formData.ownerName.trim().length >= 2 &&
      isEmailValid &&
      isPhoneValid &&
      isPasswordValid &&
      passwordsMatch
    );
  }, [formData, isEmailValid, isPhoneValid, isPasswordValid, passwordsMatch]);

  const handleNextStep = () => {
    if (!formData.businessName.trim()) {
      return showAlert('Required', 'Business name is required');
    }
    if (!formData.ownerName.trim()) {
      return showAlert('Required', 'Owner name is required');
    }
    if (!isEmailValid) {
      return showAlert('Invalid Email', 'Please enter a valid email');
    }
    if (!isPhoneValid) {
      return showAlert('Invalid Phone', 'Please enter a valid 10-digit phone number');
    }
    if (!isPasswordValid) {
      return showAlert('Weak Password', 'Password must be at least 8 characters');
    }
    if (!passwordsMatch) {
      return showAlert('Password Mismatch', 'Passwords do not match');
    }
    setStep(2);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);

      const result = await registerVendor({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ""),
        businessName: formData.businessName.trim(),
        businessType: formData.businessType || null,
        ownerName: formData.ownerName.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase() || null,
        panNumber: formData.panNumber.trim().toUpperCase() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        pincode: formData.pincode.trim() || null,
      });

      if (result.vendor || result.message) {
        // Auto-login the user after successful registration
        try {
          const loginResult = await loginVendorDirect(
            formData.email.trim().toLowerCase(),
            formData.password
          );

          if (loginResult.success && loginResult.vendor) {
            // Navigate directly to documents screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'VendorDocuments' }],
            });
          } else {
            // If auto-login fails, show success message and ask to login
            setSuccess(true);
          }
        } catch (loginErr) {
          console.log("Auto-login failed:", loginErr);
          // Show success but ask to login manually
          setSuccess(true);
        }
      } else {
        showAlert('Error', result.error || 'Registration failed');
      }
    } catch (err) {
      console.log("Register Error:", err?.response?.data || err);
      const errorMessage = err?.response?.data?.error
        || err?.message
        || "Something went wrong. Please try again.";
      showAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={BRAND.primary} />
          </View>
          <Text style={styles.successTitle}>Registration Successful!</Text>
          <Text style={styles.successText}>
            Your vendor account has been created. Please login and upload your business documents for verification.
          </Text>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Next Steps:</Text>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>Login to your account</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>Upload business documents</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>Request services & locations</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
              <Text style={styles.stepText}>Start receiving bookings!</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation.navigate("VendorLoginScreen")}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative blobs */}
          <View style={styles.bgBlobA} />
          <View style={styles.bgBlobB} />

          {/* Header */}
          <Animated.View
            style={[
              styles.headerWrap,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            <View style={styles.brandBadge}>
              <Image source={require('../../../assets/logo-white-tr.png')} style={{width:40, height:40}} />
            </View>
            <Text style={styles.brandTitle}>Become a Vendor Partner</Text>
            <Text style={styles.brandTagline}>
              Join TransRentals and grow your rental business
            </Text>
          </Animated.View>

          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, step >= 1 && styles.progressCircleActive]}>
                {step > 1 ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
                )}
              </View>
              <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>Basic Info</Text>
            </View>
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, step >= 2 && styles.progressCircleActive]}>
                <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
              </View>
              <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>Business Details</Text>
            </View>
          </View>

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            {/* Step 1 - Basic Info */}
            {step === 1 && (
              <>
                {/* Section: Business Information */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="business" size={18} color={BRAND.blue} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Business Information</Text>
                    <Text style={styles.sectionSubtitle}>Tell us about your business</Text>
                  </View>
                </View>

                {/* Business Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Name *</Text>
                  <View style={[styles.inputWrap, formData.businessName.trim().length >= 2 && styles.inputOK]}>
                    <Ionicons name="business-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your Company Name"
                      placeholderTextColor="#A3B3C2"
                      value={formData.businessName}
                      onChangeText={(v) => handleChange("businessName", v)}
                    />
                  </View>
                </View>

                {/* Business Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Business Type</Text>
                  <TouchableOpacity
                    style={styles.inputWrap}
                    onPress={() => setShowBusinessTypeModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="briefcase-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <Text style={[styles.dropdownText, !formData.businessType && styles.dropdownPlaceholder]}>
                      {formData.businessType || 'Select Business Type'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={BRAND.subText} style={styles.rightIcon} />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Section: Contact Information */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="person" size={18} color={BRAND.primary} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <Text style={styles.sectionSubtitle}>Your contact details</Text>
                  </View>
                </View>

                {/* Owner Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Owner/Contact Name *</Text>
                  <View style={[styles.inputWrap, formData.ownerName.trim().length >= 2 && styles.inputOK]}>
                    <Ionicons name="person-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#A3B3C2"
                      value={formData.ownerName}
                      onChangeText={(v) => handleChange("ownerName", v)}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email *</Text>
                  <View style={[
                    styles.inputWrap,
                    formData.email && (isEmailValid ? styles.inputOK : styles.inputError)
                  ]}>
                    <Ionicons name="mail-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="business@example.com"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(v) => handleChange("email", v)}
                    />
                  </View>
                  {formData.email && !isEmailValid && (
                    <Text style={styles.helperError}>Please enter a valid email</Text>
                  )}
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone *</Text>
                  <View style={[
                    styles.inputWrap,
                    formData.phone && (isPhoneValid ? styles.inputOK : styles.inputError)
                  ]}>
                    <Ionicons name="call-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="9737965551"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(v) => handleChange("phone", v.replace(/\D/g, ""))}
                      maxLength={10}
                    />
                  </View>
                  {formData.phone && !isPhoneValid && (
                    <Text style={styles.helperError}>Please enter a valid 10-digit phone number</Text>
                  )}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Section: Security */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="shield-checkmark" size={18} color={BRAND.purple} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Account Security</Text>
                    <Text style={styles.sectionSubtitle}>Create a strong password</Text>
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={[
                    styles.inputWrap,
                    formData.password && (isPasswordValid ? styles.inputOK : styles.inputError)
                  ]}>
                    <Ionicons name="lock-closed-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min 8 characters"
                      placeholderTextColor="#A3B3C2"
                      secureTextEntry={!isPasswordVisible}
                      value={formData.password}
                      onChangeText={(v) => handleChange("password", v)}
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible((v) => !v)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons name={isPasswordVisible ? "eye" : "eye-off"} size={18} color={BRAND.subText} />
                    </TouchableOpacity>
                  </View>
                  {formData.password && !isPasswordValid && (
                    <Text style={styles.helperError}>Password must be at least 8 characters</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <View style={[
                    styles.inputWrap,
                    formData.confirmPassword && (passwordsMatch ? styles.inputOK : styles.inputError)
                  ]}>
                    <Ionicons name="lock-closed-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#A3B3C2"
                      secureTextEntry={!isConfirmPasswordVisible}
                      value={formData.confirmPassword}
                      onChangeText={(v) => handleChange("confirmPassword", v)}
                    />
                    <TouchableOpacity
                      onPress={() => setIsConfirmPasswordVisible((v) => !v)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={18} color={BRAND.subText} />
                    </TouchableOpacity>
                  </View>
                  {formData.confirmPassword && !passwordsMatch && (
                    <Text style={styles.helperError}>Passwords do not match</Text>
                  )}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[styles.cta, !isStep1Valid && styles.ctaDisabled]}
                  onPress={handleNextStep}
                  disabled={!isStep1Valid}
                >
                  <Text style={styles.ctaText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {/* Step 2 - Business Details */}
            {step === 2 && (
              <>
                {/* Section: Tax Information */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="document-text" size={18} color={BRAND.blue} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Tax Information</Text>
                    <Text style={styles.sectionSubtitle}>Business registration details (Optional)</Text>
                  </View>
                </View>

                {/* GST Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GST Number</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="document-text-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={[styles.input, { textTransform: 'uppercase' }]}
                      placeholder="22AAAAA0000A1Z5"
                      placeholderTextColor="#A3B3C2"
                      value={formData.gstNumber}
                      onChangeText={(v) => handleChange("gstNumber", v.toUpperCase())}
                      maxLength={15}
                      autoCapitalize="characters"
                    />
                  </View>
                  <Text style={styles.helperText}>Optional - can be added later</Text>
                </View>

                {/* PAN Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PAN Number</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="card-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={[styles.input, { textTransform: 'uppercase' }]}
                      placeholder="AAAAA0000A"
                      placeholderTextColor="#A3B3C2"
                      value={formData.panNumber}
                      onChangeText={(v) => handleChange("panNumber", v.toUpperCase())}
                      maxLength={10}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Section: Business Address */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="location" size={18} color={BRAND.primary} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Business Address</Text>
                    <Text style={styles.sectionSubtitle}>Where is your business located?</Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Street Address</Text>
                  <View style={[styles.inputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                    <Ionicons name="location-outline" size={18} color={BRAND.subText} style={[styles.leftIcon, { top: 16 }]} />
                    <TextInput
                      style={[styles.input, { textAlignVertical: 'top', paddingTop: 0 }]}
                      placeholder="Street address, building name, etc."
                      placeholderTextColor="#A3B3C2"
                      value={formData.address}
                      onChangeText={(v) => handleChange("address", v)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>

                {/* City */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="business-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor="#A3B3C2"
                      value={formData.city}
                      onChangeText={(v) => handleChange("city", v)}
                    />
                  </View>
                </View>

                {/* State */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>State</Text>
                  <TouchableOpacity
                    style={styles.inputWrap}
                    onPress={() => setShowStateModal(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="map-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <Text style={[styles.dropdownText, !formData.state && styles.dropdownPlaceholder]}>
                      {formData.state || 'Select State'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={BRAND.subText} style={styles.rightIcon} />
                  </TouchableOpacity>
                </View>

                {/* Pincode */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pincode</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="navigate-outline" size={18} color={BRAND.subText} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="380001"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="number-pad"
                      value={formData.pincode}
                      onChangeText={(v) => handleChange("pincode", v.replace(/\D/g, ""))}
                      maxLength={6}
                    />
                  </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back" size={18} color={BRAND.text} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cta, { flex: 1 }, loading && styles.ctaDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.ctaText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Divider */}
            <View style={styles.separatorRow}>
              <View style={styles.separator} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.separator} />
            </View>

            {/* Login link */}
            <View style={styles.centerRow}>
              <Text style={styles.smallText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("VendorLoginScreen")}
              >
                <Text style={styles.linkBold}>Login here</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Benefits */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Why Partner with TransRentals?</Text>
            <View style={styles.benefitsRow}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitNumber}>1000+</Text>
                <Text style={styles.benefitLabel}>Active Vendors</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitNumber}>50+</Text>
                <Text style={styles.benefitLabel}>Cities</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitNumber}>24/7</Text>
                <Text style={styles.benefitLabel}>Support</Text>
              </View>
              {/* <View style={styles.benefitItem}>
                <Text style={styles.benefitNumber}>0%</Text>
                <Text style={styles.benefitLabel}>Joining Fee</Text>
              </View> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Business Type Modal */}
      <Modal
        visible={showBusinessTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBusinessTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Business Type</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowBusinessTypeModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {BUSINESS_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.modalItem,
                    formData.businessType === type && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    handleChange('businessType', type);
                    setShowBusinessTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.businessType === type && styles.modalItemTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                  {formData.businessType === type && (
                    <Ionicons name="checkmark-circle" size={22} color={BRAND.blue} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowStateModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.modalItem,
                    formData.state === state && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    handleChange('state', state);
                    setShowStateModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.state === state && styles.modalItemTextSelected,
                    ]}
                  >
                    {state}
                  </Text>
                  {formData.state === state && (
                    <Ionicons name="checkmark-circle" size={22} color={BRAND.blue} />
                  )}
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
  safe: { flex: 1, backgroundColor: BRAND.bg },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
  },

  // Success screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: BRAND.subText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepText: {
    fontSize: 14,
    color: BRAND.text,
  },

  // decorative blobs
  bgBlobA: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    backgroundColor: "#DFF9EC",
    borderRadius: 999,
    opacity: 0.6,
  },
  bgBlobB: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 260,
    height: 260,
    backgroundColor: "#EAF3FF",
    borderRadius: 999,
    opacity: 0.55,
  },

  headerWrap: {
    width: "100%",
    maxWidth: 520,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BRAND.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: BRAND.ink,
  },
  brandTagline: {
    fontSize: 13.5,
    color: BRAND.subText,
    marginTop: 6,
    textAlign: "center",
  },

  // Progress steps
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  progressCircleActive: {
    backgroundColor: BRAND.blue,
    borderColor: '#DBEAFE',
    shadowColor: BRAND.blue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: BRAND.subText,
    fontWeight: '600',
  },
  progressLabelActive: {
    color: BRAND.blue,
    fontWeight: '700',
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 2,
  },
  progressLineActive: {
    backgroundColor: BRAND.blue,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: BRAND.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: "#0B1020",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: BRAND.subText,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 20,
  },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFDFF",
    borderWidth: 1.5,
    borderColor: BRAND.border,
    borderRadius: 12,
    height: 54,
  },
  input: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 15,
    color: '#0F1720', // Explicit dark color to prevent white text
    fontWeight: '500',
  },
  leftIcon: { position: "absolute", left: 14 },
  rightIcon: { position: "absolute", right: 14 },
  eyeBtn: {
    position: "absolute",
    right: 12,
    height: "100%",
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Dropdown Text
  dropdownText: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 15,
    color: '#0F1720', // Explicit dark color
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#A3B3C2',
    fontWeight: '400',
  },

  inputOK: {
    borderColor: "#CFF5E2",
    backgroundColor: "#F5FFFA",
  },
  inputError: {
    borderColor: "#FBD5D5",
    backgroundColor: "#FFF8F8",
  },
  helperError: { color: BRAND.error, fontSize: 12.5, marginTop: 6 },
  helperText: { color: BRAND.subText, fontSize: 12, marginTop: 4 },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
    gap: 6,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.text,
  },

  cta: {
    height: 54,
    borderRadius: 12,
    backgroundColor: BRAND.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
    shadowColor: BRAND.blue,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0.15,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  separatorRow: {
    marginVertical: 14,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  separator: { flex: 1, height: 1, backgroundColor: BRAND.border },
  separatorText: { color: BRAND.subText, fontSize: 12.5 },

  centerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  smallText: { color: BRAND.subText, fontSize: 13.5 },
  linkBold: { color: BRAND.primaryDark, fontWeight: "800", fontSize: 14 },

  // Benefits
  benefitsCard: {
    width: '100%',
    maxWidth: 520,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  benefitItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: BRAND.card,
    borderRadius: 12,
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  benefitNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.blue,
    marginBottom: 4,
  },
  benefitLabel: {
    fontSize: 11,
    color: BRAND.subText,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
  },
  modalClose: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND.border,
  },
  modalItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: BRAND.blue,
  },
  modalItemText: {
    fontSize: 15,
    color: BRAND.text,
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: BRAND.blue,
    fontWeight: '700',
  },
});
