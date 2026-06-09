// screens/travel-agent/auth/TravelAgentRegisterScreen.js
// 2-step travel agent registration. Collects agency fields and hits the
// /api/travel-agent/register endpoint. On success, auto-logs the agent in
// and navigates to the document upload screen.
//
// UI: minimal / professional redesign — flat single-surface form, slim progress
// bar, hairline section headers. Functionality, fields and validations unchanged.
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
  Animated,
  Easing,
  Image,
  Modal,
  StatusBar,
  Dimensions,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomAlert from "../../CustomAlertmahek";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  registerTravelAgent,
  loginTravelAgentDirect,
} from "../../api/travelAgentClient";

const C = {
  primary: "#12AD66",
  primaryDark: "#0E9457",
  primarySoft: "#E8F7F0",
  ink: "#0F172A",
  text: "#334155",
  sub: "#64748B",
  faint: "#94A3B8",
  bg: "#FFFFFF",
  field: "#F8FAFC",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  error: "#EF4444",
};

// Agency types — mirror web register options
const AGENCY_TYPES = [
  "Solo Travel Agent",
  "Travel Agency",
  "Corporate / In-house Travel Desk",
  "DMC (Destination Management Co.)",
  "OTA (Online Travel Agency)",
  "Tour Operator",
  "Other",
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh",
];

// ---- Stable presentational helpers (module scope so inputs keep focus) ----
const SectionHeader = ({ label, hint }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
    <View style={styles.sectionRule} />
  </View>
);

const Field = ({ label, icon, required, valid, invalid, helper, children }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.req}> *</Text>}
    </Text>
    <View style={[styles.inputWrap, valid && styles.inputOK, invalid && styles.inputError]}>
      {!!icon && <Ionicons name={icon} size={18} color={C.faint} style={styles.leftIcon} />}
      {children}
    </View>
    {!!helper && <Text style={[styles.helperText, invalid && styles.helperError]}>{helper}</Text>}
  </View>
);

const PrimaryButton = ({ onPress, disabled, loading: btnLoading, label, icon = "arrow-forward", style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || btnLoading}
    activeOpacity={0.85}
    style={[styles.cta, disabled && styles.ctaDisabled, style]}
  >
    {btnLoading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <>
        <Text style={styles.ctaText}>{label}</Text>
        <Ionicons name={icon} size={18} color="#fff" />
      </>
    )}
  </TouchableOpacity>
);

export default function TravelAgentRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 — Basic
    agencyName: "",
    agencyType: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2 — Business
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
  const [showAgencyTypeModal, setShowAgencyTypeModal] = useState(false);
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

  // Entrance animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  // Floating icons
  const L = 6;
  const R = SCREEN_W - 32;
  const FLOAT_ICONS = [
    // LEFT SIDE
    { name: "calendar",    color: "#0A7A4B", size: 22, x: L,     startY: SCREEN_H * 0.06, delay: 0,    duration: 3400 },
    { name: "bicycle",     color: "#DB2777", size: 22, x: L + 2, startY: SCREEN_H * 0.18, delay: 550,  duration: 3000 },
    { name: "people",      color: "#7C3AED", size: 20, x: L,     startY: SCREEN_H * 0.30, delay: 250,  duration: 3200 },
    { name: "car-sport",   color: "#1e6bb8", size: 22, x: L + 2, startY: SCREEN_H * 0.43, delay: 800,  duration: 3800 },
    { name: "bus",         color: "#D97706", size: 22, x: L,     startY: SCREEN_H * 0.56, delay: 350,  duration: 3100 },
    { name: "location",    color: "#0A7A4B", size: 20, x: L + 2, startY: SCREEN_H * 0.68, delay: 650,  duration: 3500 },
    { name: "trending-up", color: "#DB2777", size: 19, x: L,     startY: SCREEN_H * 0.80, delay: 150,  duration: 3600 },
    // RIGHT SIDE
    { name: "airplane",    color: "#1e6bb8", size: 22, x: R,     startY: SCREEN_H * 0.05, delay: 400,  duration: 3300 },
    { name: "map",         color: "#0A7A4B", size: 22, x: R - 2, startY: SCREEN_H * 0.17, delay: 900,  duration: 3100 },
    { name: "bar-chart",   color: "#D97706", size: 20, x: R,     startY: SCREEN_H * 0.29, delay: 100,  duration: 3700 },
    { name: "card",        color: "#DB2777", size: 22, x: R - 2, startY: SCREEN_H * 0.41, delay: 600,  duration: 2900 },
    { name: "train",       color: "#7C3AED", size: 22, x: R,     startY: SCREEN_H * 0.54, delay: 300,  duration: 3400 },
    { name: "briefcase",   color: "#1e6bb8", size: 20, x: R - 2, startY: SCREEN_H * 0.66, delay: 750,  duration: 3500 },
    { name: "key",         color: "#0A7A4B", size: 19, x: R,     startY: SCREEN_H * 0.79, delay: 500,  duration: 3200 },
  ];
  const floatAnims = useRef(FLOAT_ICONS.map((_, i) => new Animated.Value(i % 2 === 0 ? 0 : 0.5))).current;
  useEffect(() => {
    const anims = FLOAT_ICONS.map((cfg, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.timing(floatAnims[i], { toValue: 1, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnims[i], { toValue: 0, duration: cfg.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach(a => a.stop());
  }, []);

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

  const isStep1Valid = useMemo(() => {
    return (
      formData.agencyName.trim().length >= 2 &&
      formData.ownerName.trim().length >= 2 &&
      isEmailValid &&
      isPhoneValid &&
      isPasswordValid &&
      passwordsMatch
    );
  }, [formData, isEmailValid, isPhoneValid, isPasswordValid, passwordsMatch]);

  const validateStep1 = () => {
    if (!formData.agencyName.trim()) { showAlert("Required", "Agency name is required"); return false; }
    if (!formData.ownerName.trim()) { showAlert("Required", "Owner name is required"); return false; }
    if (!isEmailValid) { showAlert("Invalid Email", "Please enter a valid email"); return false; }
    if (!isPhoneValid) { showAlert("Invalid Phone", "Please enter a valid 10-digit phone number"); return false; }
    if (!isPasswordValid) { showAlert("Weak Password", "Password must be at least 8 characters"); return false; }
    if (!passwordsMatch) { showAlert("Password Mismatch", "Passwords do not match"); return false; }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  // Skip the optional business-details step and register straight away
  const handleSkipRegister = () => {
    if (validateStep1()) handleRegister();
  };

  const handleRegister = async () => {
    try {
      setLoading(true);

      const result = await registerTravelAgent({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.replace(/\D/g, ""),
        agencyName: formData.agencyName.trim(),
        agencyType: formData.agencyType || null,
        ownerName: formData.ownerName.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase() || null,
        panNumber: formData.panNumber.trim().toUpperCase() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        pincode: formData.pincode.trim() || null,
      });

      if (result.travelAgent || result.message) {
        // Auto-login after successful registration
        try {
          const loginResult = await loginTravelAgentDirect(
            formData.email.trim().toLowerCase(),
            formData.password
          );
          if (loginResult.success && loginResult.travelAgent) {
            navigation.reset({
              index: 0,
              routes: [{ name: "TravelAgentDocuments" }],
            });
          } else {
            setSuccess(true);
          }
        } catch (loginErr) {
          console.log("TA Auto-login failed:", loginErr);
          setSuccess(true);
        }
      } else {
        showAlert("Error", result.error || "Registration failed");
      }
    } catch (err) {
      console.log("TA Register Error:", err?.response?.data || err);
      const errorMessage =
        err?.response?.data?.error || err?.message || "Something went wrong. Please try again.";
      showAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== Success screen =====
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color={C.primary} />
          </View>
          <Text style={styles.successTitle}>Registration successful</Text>
          <Text style={styles.successText}>
            Your travel agent account has been created. Please login and upload your business
            documents for verification.
          </Text>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Next steps</Text>
            {[
              "Login to your account",
              "Upload business documents (GST, PAN, etc.)",
              "Add bank details for payouts",
              "Start managing leads, tours & bookings!",
            ].map((t, i) => (
              <View key={i} style={[styles.stepItem, i === 3 && { marginBottom: 0 }]}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="Go to login"
            icon="arrow-forward"
            style={{ width: "100%" }}
            onPress={() => navigation.navigate("VendorLoginScreen")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Floating icons overlay */}
      <View style={styles.floatOverlay} pointerEvents="none">
        {FLOAT_ICONS.map((cfg, i) => (
          <Animated.View
            key={i}
            style={[
              styles.floatIcon,
              {
                left: cfg.x,
                top: cfg.startY,
                opacity: floatAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.10, 0.25, 0.10] }),
                transform: [{ translateY: floatAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }],
              },
            ]}
          >
            <Ionicons name={cfg.name} size={cfg.size} color={cfg.color} />
          </Animated.View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Image source={require("../../../assets/logo-white-tr.png")} style={{ width: 30, height: 30 }} />
                </View>
                <Image
                  source={require("../../../assets/logo-trans.png")}
                  style={styles.logoWordmark}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Become a Travel Agent</Text>
              <Text style={styles.subtitle}>
                Manage leads, tours, properties and bookings — all in one place.
              </Text>
            </View>

            {/* Progress */}
            <View style={styles.progressBlock}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressStepText}>
                  Step {step} of 2 · <Text style={{ color: C.ink, fontWeight: "700" }}>
                    {step === 1 ? "Basic Info" : "Business Details"}
                  </Text>
                </Text>
                <Text style={styles.progressPct}>{step === 1 ? "50%" : "100%"}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: step === 1 ? "50%" : "100%" }]} />
              </View>
            </View>

            {/* Step 1 */}
            {step === 1 && (
              <>
                <SectionHeader label="AGENCY" />

                <Field label="Agency Name" required valid={formData.agencyName.trim().length >= 2} icon="briefcase-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Your agency name"
                    placeholderTextColor={C.faint}
                    value={formData.agencyName}
                    onChangeText={(v) => handleChange("agencyName", v)}
                  />
                  {formData.agencyName.trim().length >= 2 && (
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} style={styles.rightIcon} />
                  )}
                </Field>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Agency Type</Text>
                  <TouchableOpacity style={styles.inputWrap} onPress={() => setShowAgencyTypeModal(true)} activeOpacity={0.7}>
                    <Ionicons name="business-outline" size={18} color={C.faint} style={styles.leftIcon} />
                    <Text style={[styles.dropdownText, !formData.agencyType && styles.dropdownPlaceholder]}>
                      {formData.agencyType || "Select agency type"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={C.faint} style={styles.rightIcon} />
                  </TouchableOpacity>
                </View>

                <SectionHeader label="CONTACT" />

                <Field label="Owner / Contact Name" required valid={formData.ownerName.trim().length >= 2} icon="person-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor={C.faint}
                    value={formData.ownerName}
                    onChangeText={(v) => handleChange("ownerName", v)}
                  />
                  {formData.ownerName.trim().length >= 2 && (
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} style={styles.rightIcon} />
                  )}
                </Field>

                <Field
                  label="Email"
                  required
                  icon="mail-outline"
                  valid={!!formData.email && isEmailValid}
                  invalid={!!formData.email && !isEmailValid}
                  helper={formData.email && !isEmailValid ? "Please enter a valid email" : undefined}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="agency@example.com"
                    placeholderTextColor={C.faint}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(v) => handleChange("email", v)}
                  />
                  {!!formData.email && (
                    <Ionicons
                      name={isEmailValid ? "checkmark-circle" : "alert-circle"}
                      size={20}
                      color={isEmailValid ? C.primary : C.error}
                      style={styles.rightIcon}
                    />
                  )}
                </Field>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone<Text style={styles.req}> *</Text></Text>
                  <View
                    style={[
                      styles.inputWrap,
                      formData.phone && (isPhoneValid ? styles.inputOK : styles.inputError),
                    ]}
                  >
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="9737965551"
                      placeholderTextColor={C.faint}
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(v) => handleChange("phone", v.replace(/\D/g, ""))}
                      maxLength={10}
                    />
                    {!!formData.phone && (
                      <Ionicons
                        name={isPhoneValid ? "checkmark-circle" : "alert-circle"}
                        size={20}
                        color={isPhoneValid ? C.primary : C.error}
                        style={styles.rightIcon}
                      />
                    )}
                  </View>
                  {formData.phone && !isPhoneValid && (
                    <Text style={styles.helperError}>Please enter a valid 10-digit phone number</Text>
                  )}
                </View>

                <SectionHeader label="SECURITY" />

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password<Text style={styles.req}> *</Text></Text>
                  <View
                    style={[
                      styles.inputWrap,
                      formData.password && (isPasswordValid ? styles.inputOK : styles.inputError),
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={18} color={C.faint} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min 8 characters"
                      placeholderTextColor={C.faint}
                      secureTextEntry={!isPasswordVisible}
                      value={formData.password}
                      onChangeText={(v) => handleChange("password", v)}
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons name={isPasswordVisible ? "eye" : "eye-off"} size={18} color={C.faint} />
                    </TouchableOpacity>
                  </View>
                  {!!formData.password && (() => {
                    const p = formData.password;
                    let s = 0;
                    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[a-z]/.test(p)) s++;
                    if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
                    s = Math.min(s, 5);
                    const color = s <= 2 ? "#EF4444" : s === 3 ? "#F59E0B" : "#22C55E";
                    const label = s <= 2 ? "Weak" : s === 3 ? "Fair" : "Strong";
                    return (
                      <View style={styles.pwStrengthRow}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View key={i} style={[styles.pwStrengthSeg, { backgroundColor: i <= s ? color : C.border }]} />
                        ))}
                        <Text style={[styles.pwStrengthText, { color }]}>{label}</Text>
                      </View>
                    );
                  })()}
                  {formData.password && !isPasswordValid && (
                    <Text style={styles.helperError}>Password must be at least 8 characters</Text>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password<Text style={styles.req}> *</Text></Text>
                  <View
                    style={[
                      styles.inputWrap,
                      formData.confirmPassword && (passwordsMatch ? styles.inputOK : styles.inputError),
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={18} color={C.faint} style={styles.leftIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter your password"
                      placeholderTextColor={C.faint}
                      secureTextEntry={!isConfirmPasswordVisible}
                      value={formData.confirmPassword}
                      onChangeText={(v) => handleChange("confirmPassword", v)}
                    />
                    <TouchableOpacity onPress={() => setIsConfirmPasswordVisible((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons name={isConfirmPasswordVisible ? "eye" : "eye-off"} size={18} color={C.faint} />
                    </TouchableOpacity>
                  </View>
                  {formData.confirmPassword && !passwordsMatch && (
                    <Text style={styles.helperError}>Passwords do not match</Text>
                  )}
                </View>

                <PrimaryButton label="Continue" onPress={handleNextStep} disabled={!isStep1Valid} />

                {/* Skip optional business details and register directly */}
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleSkipRegister}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={styles.skipText}>
                      Skip & register without business details
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <SectionHeader label="TAX INFORMATION" hint="Optional" />

                <Field label="GST Number" icon="document-text-outline" helper="Can be added later">
                  <TextInput
                    style={[styles.input, { textTransform: "uppercase" }]}
                    placeholder="22AAAAA0000A1Z5"
                    placeholderTextColor={C.faint}
                    value={formData.gstNumber}
                    onChangeText={(v) => handleChange("gstNumber", v.toUpperCase())}
                    maxLength={15}
                    autoCapitalize="characters"
                  />
                </Field>

                <Field label="PAN Number" icon="card-outline">
                  <TextInput
                    style={[styles.input, { textTransform: "uppercase" }]}
                    placeholder="AAAAA0000A"
                    placeholderTextColor={C.faint}
                    value={formData.panNumber}
                    onChangeText={(v) => handleChange("panNumber", v.toUpperCase())}
                    maxLength={10}
                    autoCapitalize="characters"
                  />
                </Field>

                <SectionHeader label="BUSINESS ADDRESS" />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Street Address</Text>
                  <View style={[styles.inputWrap, styles.textareaWrap]}>
                    <Ionicons name="location-outline" size={18} color={C.faint} style={[styles.leftIcon, { top: 16 }]} />
                    <TextInput
                      style={[styles.input, { textAlignVertical: "top", paddingTop: 0 }]}
                      placeholder="Street address, building name, etc."
                      placeholderTextColor={C.faint}
                      value={formData.address}
                      onChangeText={(v) => handleChange("address", v)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>

                <Field label="City" icon="business-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={C.faint}
                    value={formData.city}
                    onChangeText={(v) => handleChange("city", v)}
                  />
                </Field>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>State</Text>
                  <TouchableOpacity style={styles.inputWrap} onPress={() => setShowStateModal(true)} activeOpacity={0.7}>
                    <Ionicons name="map-outline" size={18} color={C.faint} style={styles.leftIcon} />
                    <Text style={[styles.dropdownText, !formData.state && styles.dropdownPlaceholder]}>
                      {formData.state || "Select state"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={C.faint} style={styles.rightIcon} />
                  </TouchableOpacity>
                </View>

                <Field label="Pincode" icon="navigate-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="380001"
                    placeholderTextColor={C.faint}
                    keyboardType="number-pad"
                    value={formData.pincode}
                    onChangeText={(v) => handleChange("pincode", v.replace(/\D/g, ""))}
                    maxLength={6}
                  />
                </Field>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={18} color={C.text} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>

                  <PrimaryButton
                    label="Create Account"
                    onPress={handleRegister}
                    loading={loading}
                    disabled={loading}
                    style={{ flex: 1, marginTop: 0 }}
                  />
                </View>

                {/* Skip the optional business details and register now */}
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipText}>Skip for now &amp; create account</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.smallText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("VendorLoginScreen")}>
                <Text style={styles.linkBold}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Trust note */}
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={15} color={C.faint} />
              <Text style={styles.trustText}>Your details are kept private & secure.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Agency Type Modal */}
      <Modal
        visible={showAgencyTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAgencyTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agency Type</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowAgencyTypeModal(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {AGENCY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.modalItem, formData.agencyType === type && styles.modalItemSelected]}
                  onPress={() => {
                    handleChange("agencyType", type);
                    setShowAgencyTypeModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, formData.agencyType === type && styles.modalItemTextSelected]}>
                    {type}
                  </Text>
                  {formData.agencyType === type && (
                    <Ionicons name="checkmark-circle" size={22} color={C.primary} />
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
        transparent
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowStateModal(false)}>
                <Ionicons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[styles.modalItem, formData.state === state && styles.modalItemSelected]}
                  onPress={() => {
                    handleChange("state", state);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, formData.state === state && styles.modalItemTextSelected]}>
                    {state}
                  </Text>
                  {formData.state === state && (
                    <Ionicons name="checkmark-circle" size={22} color={C.primary} />
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
  safe: { flex: 1, backgroundColor: C.bg },
  floatOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  floatIcon: { position: "absolute" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 36 },

  // ===== Header =====
  header: { alignItems: "flex-start", marginBottom: 22 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  logoBadge: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  logoWordmark: { height: 28, width: 140 },
  title: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: C.sub, marginTop: 6, lineHeight: 20 },

  // ===== Progress =====
  progressBlock: { marginBottom: 24 },
  progressTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressStepText: { fontSize: 13, color: C.sub, fontWeight: "500" },
  progressPct: { fontSize: 13, color: C.primary, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: C.primary },

  // ===== Section header =====
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: C.faint, letterSpacing: 1.2 },
  sectionHint: { fontSize: 11, fontWeight: "600", color: C.faint, marginLeft: 8, fontStyle: "italic" },
  sectionRule: { flex: 1, height: 1, backgroundColor: C.border, marginLeft: 12 },

  // ===== Inputs =====
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 7 },
  req: { color: C.primary, fontWeight: "800" },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.field,
    borderWidth: 1, borderColor: C.border, borderRadius: 12, height: 52,
  },
  textareaWrap: { height: 80, alignItems: "flex-start", paddingTop: 12 },
  input: { flex: 1, paddingLeft: 42, paddingRight: 42, fontSize: 15, color: C.ink, fontWeight: "500" },
  leftIcon: { position: "absolute", left: 14 },
  rightIcon: { position: "absolute", right: 14 },
  eyeBtn: { position: "absolute", right: 10, height: "100%", width: 40, alignItems: "center", justifyContent: "center" },

  // Phone +91 prefix
  phonePrefix: {
    height: "100%", justifyContent: "center", paddingLeft: 14, paddingRight: 12,
    borderRightWidth: 1, borderRightColor: C.border, marginRight: 12,
  },
  phonePrefixText: { fontSize: 15, fontWeight: "700", color: C.text },
  phoneInput: { flex: 1, paddingRight: 42, fontSize: 15, color: C.ink, fontWeight: "500" },

  dropdownText: { flex: 1, paddingLeft: 42, paddingRight: 42, fontSize: 15, color: C.ink, fontWeight: "500" },
  dropdownPlaceholder: { color: C.faint, fontWeight: "400" },

  inputOK: { borderColor: C.primary, backgroundColor: "#FFFFFF" },
  inputError: { borderColor: C.error, backgroundColor: "#FFFFFF" },
  helperText: { color: C.sub, fontSize: 12, marginTop: 6 },
  helperError: { color: C.error, fontSize: 12.5, marginTop: 6 },

  pwStrengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  pwStrengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  pwStrengthText: { marginLeft: 6, fontWeight: "700", fontSize: 12 },

  // ===== Buttons =====
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 22, alignItems: "stretch" },
  backBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54,
    paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: C.borderStrong,
    backgroundColor: C.bg, gap: 6,
  },
  backBtnText: { fontSize: 15, fontWeight: "600", color: C.text },

  cta: {
    height: 54, borderRadius: 12, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
    marginTop: 24,
  },
  ctaDisabled: { backgroundColor: "#A7D9C0" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  skipBtn: { height: 46, alignItems: "center", justifyContent: "center", marginTop: 10 },
  skipText: { color: C.primaryDark, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },

  // ===== Footer =====
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  smallText: { color: C.sub, fontSize: 14 },
  linkBold: { color: C.primaryDark, fontWeight: "800", fontSize: 14 },
  trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 },
  trustText: { color: C.faint, fontSize: 12 },

  // ===== Success =====
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: C.bg },
  successIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: C.primarySoft,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.ink, marginBottom: 10, textAlign: "center" },
  successText: { fontSize: 14.5, color: C.sub, textAlign: "center", marginBottom: 28, lineHeight: 21 },
  stepsCard: {
    width: "100%", backgroundColor: C.field, borderRadius: 14, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
  },
  stepsTitle: { fontSize: 13, fontWeight: "800", color: C.faint, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" },
  stepItem: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  stepNumber: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  stepNumberText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  stepText: { fontSize: 14, color: C.text, flex: 1 },

  // ===== Modal =====
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingTop: 10, paddingBottom: 32, maxHeight: "72%",
  },
  modalHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: C.border, marginBottom: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  modalClose: { padding: 4 },
  modalList: { paddingHorizontal: 20 },
  modalItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 15, paddingHorizontal: 16, marginBottom: 8,
    backgroundColor: C.field, borderRadius: 12, borderWidth: 1, borderColor: C.border,
  },
  modalItemSelected: { backgroundColor: C.primarySoft, borderColor: C.primary },
  modalItemText: { fontSize: 15, color: C.text, fontWeight: "500" },
  modalItemTextSelected: { color: C.primaryDark, fontWeight: "700" },
});
