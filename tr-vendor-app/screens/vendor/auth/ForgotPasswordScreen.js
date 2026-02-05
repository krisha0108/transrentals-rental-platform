import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, Image
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/Ionicons";

// Same URL config as screens/api/client.js
const DEFAULT_PROD = "https://transrentals.in";
const DEFAULT_DEV_ANDROID = "http://192.168.29.68:3000";
const DEFAULT_DEV_IOS = "http://localhost:3000";

function getBaseURL() {
  if (__DEV__) {
    return Platform.OS === "android" ? DEFAULT_DEV_ANDROID : DEFAULT_DEV_IOS;
  }
  return DEFAULT_PROD;
}

const BASE_URL = `${getBaseURL()}/api/vendor`;

const BRAND = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  ink: "#0F1720",
  text: "#334155",
  sub: "#64748B",
  border: "#E6EDF5",
  primary: "#1FC77A",
  primaryDark: "#12AD66",
  success: "#22C55E",
  warn: "#F59E0B",
  error: "#EF4444",
};

/* ---------- helpers ---------- */
const maskEmail = (e="") => {
  const [u="", d=""] = e.split("@"); if(!u||!d) return e;
  const left = u.slice(0,2), right = u.length>2?u.slice(-1):"";
  return `${left}${"*".repeat(Math.max(1,u.length-3))}${right}@${d}`;
};
const strength = (pwd="") => {
  let s=0; if(pwd.length>=8)s++; if(/[A-Z]/.test(pwd))s++; if(/[a-z]/.test(pwd))s++; if(/\d/.test(pwd))s++; if(/[^A-Za-z0-9]/.test(pwd))s++;
  return Math.min(s,5);
};

export default function VendorForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["","","",""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const otp = useMemo(()=>otpDigits.join(""),[otpDigits]);

  /* ---------- timers ---------- */
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  /* ---------- API ---------- */
  const sendOtp = async () => {
    const e={};
    if(!email.trim()) e.email="Email is required";
    else if(!/^\S+@\S+\.\S+$/.test(email.trim())) e.email="Enter a valid email";
    setErrors(e); if(Object.keys(e).length) return;

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forgot-password/send-otp`, { email: email.trim() });
      if (res?.data?.status) {
        setStep(2);
        setTimer(60);
        setOtpDigits(["","","",""]);
        setTimeout(()=>otpRefs[0].current?.focus(), 150);
      } else {
        Alert.alert("Error", res?.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 4) { setErrors({otp:"Enter 4-digit OTP"}); return; }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forgot-password/verify-otp`, { email: email.trim(), otp });
      if (res?.data?.status) setStep(3);
      else Alert.alert("Invalid OTP", res?.data?.message || "Please try again");
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (timer>0) return;
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forgot-password/send-otp`, { email: email.trim() });
      if (res?.data?.status) {
        setTimer(60);
        setOtpDigits(["","","",""]);
        setTimeout(()=>otpRefs[0].current?.focus(),150);
      } else {
        Alert.alert("Error", res?.data?.message || "Failed to resend OTP");
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    const e={};
    if(!password) e.password="Enter a new password";
    if(password && strength(password)<3) e.password="Use 8+ chars with mix of case/number/symbol";
    if(!confirmPassword) e.confirmPassword="Confirm your password";
    if(password && confirmPassword && password!==confirmPassword) e.confirmPassword="Passwords do not match";
    setErrors(e); if(Object.keys(e).length) return;

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/forgot-password/reset-password`, {
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
      });
      if (res?.data?.status) {
        Alert.alert("Success", res?.data?.message || "Password updated", [
          { text: "Login", onPress: () => navigation.navigate("VendorLoginScreen") }
        ]);
      } else {
        Alert.alert("Error", res?.data?.message || "Reset failed");
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  /* ---------- OTP helpers ---------- */
  const onOtpChange = (i, v) => {
    const digit = v.replace(/[^0-9]/g,"").slice(-1);
    const arr=[...otpDigits]; arr[i]=digit; setOtpDigits(arr);
    if(digit && i<3) otpRefs[i+1].current?.focus();
    if(!digit && i>0) otpRefs[i-1].current?.focus();
  };
  const onOtpKey = (i, e) => {
    if(e.nativeEvent.key==="Backspace" && !otpDigits[i] && i>0) otpRefs[i-1].current?.focus();
  };

  /* ---------- UI bits ---------- */
  const StepChip = () => {
    const labels = ["Enter Email", "Verify OTP", "Reset Password"];
    return (
      <View style={styles.stepChip}>
        <Text style={styles.stepChipText}>Step {step}/3 • {labels[step-1]}</Text>
      </View>
    );
  };

  const StrengthBar = () => {
    const s = strength(password), segs=[1,2,3,4,5];
    const color = s<=2?BRAND.error: s===3?BRAND.warn: BRAND.success;
    return (
      <View style={styles.strengthWrap}>
        {segs.map(i=>(
          <View key={i} style={[styles.strengthSeg,{backgroundColor: i<=s?color:"#E8EEF6"}]}/>
        ))}
        <Text style={[styles.strengthText,{color}]}>
          {s<=2?"Weak": s===3?"Fair":"Strong"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor: BRAND.bg}}>
      <StatusBar barStyle="dark-content" />
      {/* Decorative bubbles */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* top-right bubble cluster */}
        <View style={[styles.bubble, {top:-70, right:-60, width:220, height:220, backgroundColor:"#DFF7EA"}]} />
        <View style={[styles.bubble, {top:40, right:-30, width:120, height:120, backgroundColor:"#EAFBF2"}]} />
        {/* bottom-left bubble */}
        <View style={[styles.bubble, {bottom:-80, left:-70, width:280, height:280, backgroundColor:"#E7F1FF"}]} />
      </View>

      <KeyboardAvoidingView style={{flex:1,justifyContent:'center'}} behavior={Platform.OS==="ios" ? "padding" : undefined}>
        {/* Hero header similar to login */}
        <View style={styles.heroHead}>
          <View style={styles.brandBadge}>
                       <Image source={require('../../../assets/logo-white-tr.png')}  style={{width:40, height:40}} />
                      {/* <Ionicons name="car-sport" size={22} color="#fff" /> */}
                    </View>
          <Text style={styles.brandTitle}>TransRentals Vendor</Text>
          <Text style={styles.brandSub}>Reset your password securely</Text>
        </View>

        {/* Step chip */}
        <View style={{alignItems:"center", marginBottom: 10}}>
          <StepChip />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Step 1: Email */}
          {step===1 && (
            <>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                <Icon name="mail-outline" size={18} color={BRAND.sub} />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor={BRAND.sub}
                  value={email}
                  onChangeText={t=>{setEmail(t); if(errors.email) setErrors(p=>({...p,email:undefined}));}}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                />
              </View>
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <TouchableOpacity style={styles.primaryBtn} onPress={sendOtp} disabled={loading}>
                <Icon name="send-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{loading? "Sending…" : "Send OTP"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkRow} onPress={()=>navigation.navigate("VendorLoginScreen")}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: OTP */}
          {step===2 && (
            <>
              <Text style={styles.titleCenter}>Verify OTP</Text>
              <Text style={styles.captionCenter}>
                Code sent to <Text style={styles.captionStrong}>{maskEmail(email)}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otpRefs.map((ref,i)=>(
                  <TextInput
                    key={i}
                    ref={ref}
                    style={[styles.otpBox, errors.otp && styles.inputError]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otpDigits[i]}
                    onChangeText={v=>onOtpChange(i,v)}
                    onKeyPress={e=>onOtpKey(i,e)}
                    autoFocus={i===0}
                  />
                ))}
              </View>
              {!!errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

              <TouchableOpacity style={styles.primaryBtn} onPress={verifyOtp} disabled={loading}>
                <Icon name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>{loading? "Verifying…" : "Verify OTP"}</Text>
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.caption}>Didn’t get the code?</Text>
                <TouchableOpacity disabled={timer>0||loading} onPress={resendOtp}>
                  <Text style={[styles.linkText, timer>0 && {opacity:0.6}]}>
                    {timer>0? `Resend in ${timer}s` : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 3: Reset */}
          {step===3 && (
            <>
              <Text style={styles.titleCenter}>Create a new password</Text>
              <Text style={styles.captionCenter}>Account: <Text style={styles.captionStrong}>{maskEmail(email)}</Text></Text>

              {/* Password */}
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                <Icon name="lock-closed-outline" size={18} color={BRAND.sub} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={BRAND.sub}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={t=>{setPassword(t); if(errors.password) setErrors(p=>({...p,password:undefined}));}}
                />
                <TouchableOpacity onPress={()=>setShowPassword(s=>!s)}>
                  <Icon name={showPassword?"eye":"eye-off"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {!!password && (
                <View style={styles.strengthWrap}>
                  {[1,2,3,4,5].map(i=>(
                    <View key={i} style={[
                      styles.strengthSeg,
                      {backgroundColor: i<=strength(password) ? (strength(password)<=2?BRAND.error: strength(password)===3?BRAND.warn:BRAND.success) : "#E8EEF6"}
                    ]}/>
                  ))}
                  <Text style={[styles.strengthText,{
                    color: strength(password)<=2?BRAND.error: strength(password)===3?BRAND.warn:BRAND.success
                  }]}>
                    {strength(password)<=2?"Weak": strength(password)===3?"Fair":"Strong"}
                  </Text>
                </View>
              )}
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Confirm */}
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={[styles.inputWrap, errors.confirmPassword && styles.inputError]}>
                <Icon name="lock-closed-outline" size={18} color={BRAND.sub} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={BRAND.sub}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={t=>{setConfirmPassword(t); if(errors.confirmPassword) setErrors(p=>({...p,confirmPassword:undefined}));}}
                />
                <TouchableOpacity onPress={()=>setShowConfirmPassword(s=>!s)}>
                  <Icon name={showConfirmPassword?"eye":"eye-off"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

              <TouchableOpacity style={styles.primaryBtn} onPress={resetPassword} disabled={loading}>
                <Icon name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{loading? "Resetting…" : "Reset Password"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkRow} onPress={()=>navigation.navigate("VendorLoginScreen")}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer security note (like login) */}
        <View style={styles.footerNote}>
          <Icon name="shield-checkmark-outline" size={16} color={BRAND.sub} />
          <Text style={styles.footerText}>Secured by industry-standard encryption</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------- styles ------------------------------- */
const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.55,
  },

  heroHead: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
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
  brandTitle: { marginTop: 10, color: BRAND.ink, fontSize: 22, fontWeight: "800" },
  brandSub: { color: BRAND.sub, fontSize: 13, marginTop: 2 },

  card: {
    marginHorizontal: 16,
    backgroundColor: BRAND.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    shadowColor: "#0B1020",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  stepChip: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepChipText: { color: BRAND.text, fontSize: 12, fontWeight: "800" },

  titleCenter: { color: BRAND.ink, fontSize: 18, fontWeight: "800", textAlign: "center" },
  captionCenter: { color: BRAND.sub, fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 12 },
  captionStrong: { color: BRAND.text, fontWeight: "800" },

  fieldLabel: { color: BRAND.text, fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 6 },

  inputWrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  input: { flex: 1, color: BRAND.ink, fontSize: 14 },
  inputError: { borderColor: "#F3C1C1", backgroundColor: "#FFF9F9" },
  errorText: { color: BRAND.error, fontSize: 12, marginTop: -6, marginBottom: 8 },

  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    shadowColor: "#0B1020",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  linkRow: { alignItems: "center", marginTop: 12 },
  linkText: { color: BRAND.primaryDark, fontWeight: "800" },

  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 8, marginTop: 6 },
  otpBox: {
    flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: BRAND.border,
    backgroundColor: "#FFFFFF", textAlign: "center", fontSize: 22, color: BRAND.ink,
    shadowColor: "#0B1020", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: {width:0, height:6}, elevation: 1,
  },

  resendRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  caption: { color: BRAND.sub, fontSize: 13 },

  strengthWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: -2 },
  strengthSeg: { width: 26, height: 6, borderRadius: 4 },
  strengthText: { marginLeft: 6, fontWeight: "800", fontSize: 12 },

  footerNote: { alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 14, marginBottom: 12 },
  footerText: { color: BRAND.sub, fontSize: 13 },
});
