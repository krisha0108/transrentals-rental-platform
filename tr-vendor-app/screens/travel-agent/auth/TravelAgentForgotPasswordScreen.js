// screens/travel-agent/auth/TravelAgentForgotPasswordScreen.js
// Phase 9 / B — Travel Agent password reset (3-step OTP flow).
// Backend contract (action-based POST):
//   { action:'send-otp', email }
//   { action:'verify-otp', email, otp }
//   { action:'reset-password', email, otp, password }
// Response uses { status: boolean, message }.
//
// REDESIGNED (v2) — "Elevate" visual language (ivory ground, forest→emerald
// gradient hero with floating orbs, serif DISPLAY type, glass card), matching
// TravelAgentDashboardScreen / DocumentsScreen / GetStartedScreen / Support.
//
// ⚠️ UI ONLY — no logic changes. Preserved exactly:
//   • every state hook, in the same order (including the six `otpRefs`)
//   • the `otp` useMemo and the step-2 countdown useEffect
//   • sendOtp / verifyOtp / resendOtp / resetPassword — identical payloads,
//     identical validation rules and messages, identical showError/showInfo/
//     showSuccess calls (including the "Login" action on success)
//   • onOtpChange / onOtpKey focus-advance behaviour
//   • maskEmail + strength helpers and the 60s resend timer
// The old inline `StepChip` pill is now a 3-node `Stepper` — presentation only,
// still driven by the same `step` value.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, Image, ScrollView,
  Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getBaseURL } from "../../api/client";
import { showError, showInfo, showSuccess } from "../../../services/alertService";
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import { C, G, rs, rf, GUT, alpha, cardShadow, SCREEN_W } from "../_shared/theme";

async function getTaApiURL() {
  const base = await getBaseURL();
  return `${base}/api/travel-agent`;
}

// Hero ↔ card spacing. Visible gap = HERO_TAIL + hero paddingBottom(8) − CARD_OVERLAP.
const HERO_TAIL = rs(34);
const CARD_OVERLAP = rs(22);

const STEP_LABELS = ["Email", "Verify", "Reset"];

const maskEmail = (e = "") => {
  const [u = "", d = ""] = e.split("@"); if (!u || !d) return e;
  const left = u.slice(0, 2), right = u.length > 2 ? u.slice(-1) : "";
  return `${left}${"*".repeat(Math.max(1, u.length - 3))}${right}@${d}`;
};
const strength = (pwd = "") => {
  let s = 0; if (pwd.length >= 8) s++; if (/[A-Z]/.test(pwd)) s++; if (/[a-z]/.test(pwd)) s++; if (/\d/.test(pwd)) s++; if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 5);
};

// Warm-palette equivalents of the old red/amber/green strength colours.
const strengthColor = (s) => (s <= 2 ? C.red : s === 3 ? C.gold : C.emerald);
const strengthLabel = (s) => (s <= 2 ? "Weak" : s === 3 ? "Fair" : "Strong");

// Fade + rise reveal driven by a 0→1 Animated.Value.
const revealStyle = (v) => ({
  opacity: v,
  transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
});

export default function TravelAgentForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);

  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const sendOtp = async () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email";
    setErrors(e); if (Object.keys(e).length) return;

    try {
      setLoading(true);
      const BASE_URL = await getTaApiURL();
      const res = await axios.post(`${BASE_URL}/forgot-password`, { action: "send-otp", email: email.trim() });
      if (res?.data?.status) {
        setStep(2);
        setTimer(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs[0].current?.focus(), 150);
      } else {
        showError(res?.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setErrors({ otp: "Enter 6-digit OTP" }); return; }
    try {
      setLoading(true);
      const BASE_URL = await getTaApiURL();
      const res = await axios.post(`${BASE_URL}/forgot-password`, { action: "verify-otp", email: email.trim(), otp });
      if (res?.data?.status) setStep(3);
      else showInfo(res?.data?.message || "Please try again", "Invalid OTP");
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (timer > 0) return;
    try {
      setLoading(true);
      const BASE_URL = await getTaApiURL();
      const res = await axios.post(`${BASE_URL}/forgot-password`, { action: "send-otp", email: email.trim() });
      if (res?.data?.status) {
        setTimer(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs[0].current?.focus(), 150);
      } else {
        showError(res?.data?.message || "Failed to resend OTP");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    const e = {};
    if (!password) e.password = "Enter a new password";
    if (password && strength(password) < 3) e.password = "Use 8+ chars with mix of case/number/symbol";
    if (!confirmPassword) e.confirmPassword = "Confirm your password";
    if (password && confirmPassword && password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e); if (Object.keys(e).length) return;

    try {
      setLoading(true);
      const BASE_URL = await getTaApiURL();
      const res = await axios.post(`${BASE_URL}/forgot-password`, {
        action: "reset-password",
        email: email.trim(),
        otp,
        password,
      });
      if (res?.data?.status) {
        showSuccess(res?.data?.message || "Password updated", "Success", {
          actions: [{ label: "Login", onPress: () => navigation.navigate("VendorLoginScreen"), variant: "primary" }],
        });
      } else {
        showError(res?.data?.message || "Reset failed");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const onOtpChange = (i, v) => {
    const digit = v.replace(/[^0-9]/g, "").slice(-1);
    const arr = [...otpDigits]; arr[i] = digit; setOtpDigits(arr);
    if (digit && i < 5) otpRefs[i + 1].current?.focus();
    if (!digit && i > 0) otpRefs[i - 1].current?.focus();
  };
  const onOtpKey = (i, e) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  const pwScore = strength(password);

  // ── Presentation-only state (appended after the logic hooks above) ────
  // Staggered hero reveal: button row → title block → stepper.
  const reveal = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      110,
      reveal.map((v) =>
        Animated.timing(v, {
          toValue: 1, duration: 560,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        })
      )
    ).start();
  }, [reveal]);

  // Card swap on step change — slides in from the right as you advance.
  const stepAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1, duration: 420,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [step, stepAnim]);

  // Resend countdown drains a thin rail smoothly (the label alone ticks in 1s
  // jumps, which reads as sluggish).
  const drain = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (timer <= 0) { drain.setValue(0); return; }
    drain.setValue(timer / 60);
    Animated.timing(drain, {
      toValue: (timer - 1) / 60, duration: 1000,
      easing: Easing.linear, useNativeDriver: false,
    }).start();
  }, [timer, drain]);

  // Live requirement checklist — mirrors the very same tests `strength()` runs,
  // purely so the user can see what's still missing. Validation is unchanged.
  const pwChecks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Upper & lowercase", ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number", ok: /\d/.test(password) },
    { label: "A symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const pwMatches = !!confirmPassword && password === confirmPassword;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={G.hero}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
            <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

            <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
              <Animated.View style={[styles.heroTop, revealStyle(reveal[0])]}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("VendorLoginScreen")}
                  style={styles.circleBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="arrow-back" size={rs(19)} color="#fff" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <View style={styles.brandBadge}>
                  <Image
                    source={require("../../../assets/logo-white-tr.png")}
                    style={{ width: rs(24), height: rs(24) }}
                  />
                </View>
              </Animated.View>

              <Animated.View style={[styles.heroTextBlock, revealStyle(reveal[1])]}>
                <Text style={styles.heroTitle} numberOfLines={1}>Reset password</Text>
                <Text style={styles.heroSub} numberOfLines={1}>
                  {step === 1
                    ? "We'll email you a 6-digit code"
                    : step === 2
                    ? "Enter the code we just sent"
                    : "Choose a strong new password"}
                </Text>
              </Animated.View>

              <Animated.View style={revealStyle(reveal[2])}>
                <Stepper step={step} />
              </Animated.View>

              <View style={{ height: HERO_TAIL }} />
            </SafeAreaView>
          </LinearGradient>

          {/* ── Card, tucked into the hero curve ── */}
          <View style={styles.cardWrap}>
            <Animated.View
              style={[
                styles.card,
                cardShadow,
                {
                  opacity: stepAnim,
                  transform: [
                    {
                      translateX: stepAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [rs(28), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {step === 1 && (
                <>
                  <FieldLabel>Email address</FieldLabel>
                  <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                    <Icon name="mail-outline" size={rs(18)} color={C.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@agency.com"
                      placeholderTextColor={C.muted}
                      value={email}
                      onChangeText={t => { setEmail(t); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={sendOtp}
                    />
                  </View>
                  <ErrorText msg={errors.email} />

                  <PrimaryBtn
                    icon="send-outline"
                    label={loading ? "Sending…" : "Send OTP"}
                    onPress={sendOtp}
                    disabled={loading}
                  />

                  <LinkRow onPress={() => navigation.navigate("VendorLoginScreen")} />
                </>
              )}

              {step === 2 && (
                <>
                  <View style={styles.sentPill}>
                    <Icon name="mail-unread-outline" size={rs(13)} color={C.emeraldDeep} />
                    <Text style={styles.sentPillText} numberOfLines={1}>
                      {maskEmail(email)}
                    </Text>
                  </View>

                  <FieldLabel center>Enter the 6-digit code</FieldLabel>

                  <View style={styles.otpRow}>
                    {otpRefs.map((ref, i) => {
                      const filled = !!otpDigits[i];
                      return (
                        <TextInput
                          key={i}
                          ref={ref}
                          style={[
                            styles.otpBox,
                            filled && styles.otpBoxFilled,
                            errors.otp && styles.inputError,
                          ]}
                          keyboardType="number-pad"
                          maxLength={1}
                          value={otpDigits[i]}
                          onChangeText={v => onOtpChange(i, v)}
                          onKeyPress={e => onOtpKey(i, e)}
                          autoFocus={i === 0}
                          selectionColor={C.emerald}
                        />
                      );
                    })}
                  </View>
                  <ErrorText msg={errors.otp} center />

                  <PrimaryBtn
                    icon="checkmark-circle-outline"
                    label={loading ? "Verifying…" : "Verify"}
                    onPress={verifyOtp}
                    disabled={loading}
                  />

                  <View style={styles.resendRow}>
                    <Text style={styles.caption}>Didn't get the code?</Text>
                    <TouchableOpacity disabled={timer > 0 || loading} onPress={resendOtp}>
                      <Text style={[styles.linkText, timer > 0 && { opacity: 0.5 }]}>
                        {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Countdown rail — drains smoothly over the 60s window */}
                  {timer > 0 && (
                    <View style={styles.drainTrack}>
                      <Animated.View
                        style={[
                          styles.drainFill,
                          {
                            width: drain.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            }),
                          },
                        ]}
                      />
                    </View>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <View style={styles.sentPill}>
                    <Icon name="person-circle-outline" size={rs(13)} color={C.emeraldDeep} />
                    <Text style={styles.sentPillText} numberOfLines={1}>
                      {maskEmail(email)}
                    </Text>
                  </View>

                  <FieldLabel>New password</FieldLabel>
                  <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                    <Icon name="lock-closed-outline" size={rs(18)} color={C.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor={C.muted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={t => { setPassword(t); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(s => !s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name={showPassword ? "eye" : "eye-off"} size={rs(19)} color={C.muted} />
                    </TouchableOpacity>
                  </View>

                  {!!password && (
                    <>
                      <View style={styles.strengthWrap}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <View
                              key={i}
                              style={[
                                styles.strengthSeg,
                                { backgroundColor: i <= pwScore ? strengthColor(pwScore) : C.border },
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthText, { color: strengthColor(pwScore) }]}>
                          {strengthLabel(pwScore)}
                        </Text>
                      </View>

                      {/* Live requirement ticks — display only */}
                      <View style={styles.checkGrid}>
                        {pwChecks.map((c) => (
                          <View key={c.label} style={styles.checkItem}>
                            <Icon
                              name={c.ok ? "checkmark-circle" : "ellipse-outline"}
                              size={rs(13)}
                              color={c.ok ? C.emerald : C.muted}
                            />
                            <Text
                              style={[styles.checkText, c.ok && styles.checkTextOn]}
                              numberOfLines={1}
                            >
                              {c.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  <ErrorText msg={errors.password} />

                  <FieldLabel>Confirm password</FieldLabel>
                  <View
                    style={[
                      styles.inputWrap,
                      pwMatches && styles.inputOk,
                      errors.confirmPassword && styles.inputError,
                    ]}
                  >
                    <Icon name="lock-closed-outline" size={rs(18)} color={C.muted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor={C.muted}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={t => { setConfirmPassword(t); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                    />
                    {/* Live match tick — display only */}
                    {pwMatches && (
                      <Icon name="checkmark-circle" size={rs(18)} color={C.emerald} />
                    )}
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(s => !s)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name={showConfirmPassword ? "eye" : "eye-off"} size={rs(19)} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                  <ErrorText msg={errors.confirmPassword} />

                  <PrimaryBtn
                    icon="refresh-outline"
                    label={loading ? "Resetting…" : "Reset Password"}
                    onPress={resetPassword}
                    disabled={loading}
                  />

                  <LinkRow onPress={() => navigation.navigate("VendorLoginScreen")} />
                </>
              )}
            </Animated.View>

            <View style={styles.footerNote}>
              <Icon name="shield-checkmark-outline" size={rs(14)} color={C.muted} />
              <Text style={styles.footerText}>Secured by industry-standard encryption</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ───────── Presentational sub-components ───────── */

// Three nodes joined by connectors — replaces the old "Step 1/3 • …" text pill.
// Completed steps fill white, the active one gets a gold ring, upcoming stay faint.
function Stepper({ step }) {
  return (
    <View style={styles.stepper}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepNode,
                  done && styles.stepNodeDone,
                  active && styles.stepNodeActive,
                ]}
              >
                {done ? (
                  <Icon name="checkmark" size={rs(13)} color={C.emeraldDeep} />
                ) : (
                  <Text style={[styles.stepNodeText, active && { color: C.forestDark }]}>{n}</Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, (done || active) && styles.stepLabelOn]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>

            {i < STEP_LABELS.length - 1 && (
              <View style={[styles.stepConnector, n < step && styles.stepConnectorDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function FieldLabel({ children, center }) {
  return (
    <Text style={[styles.fieldLabel, center && { textAlign: "center" }]}>{children}</Text>
  );
}

function ErrorText({ msg, center }) {
  if (!msg) return null;
  return (
    <View style={[styles.errorRow, center && { justifyContent: "center" }]}>
      <Icon name="alert-circle" size={rs(12)} color={C.red} />
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  );
}

// Gradient CTA with a slow light sweep + a spring squeeze on press.
function PrimaryBtn({ icon, label, onPress, disabled }) {
  const press = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1700),
        Animated.timing(sheen, {
          toValue: 1, duration: 950,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sheen, disabled]);

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-rs(120), SCREEN_W] });
  const sheenOpacity = sheen.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.45, 0.45, 0],
  });

  return (
    <Animated.View
      style={[styles.primaryBtn, disabled && { opacity: 0.6 }, { transform: [{ scale }] }]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
        }
        onPressOut={() =>
          Animated.spring(press, { toValue: 0, useNativeDriver: true, speed: 26, bounciness: 9 }).start()
        }
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={G.emerald}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.primaryBtnInner}
        >
          {!disabled && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.btnSheen,
                { opacity: sheenOpacity, transform: [{ translateX: sheenX }, { skewX: "-20deg" }] },
              ]}
            />
          )}
          <Icon name={icon} size={rs(18)} color="#fff" />
          <Text style={styles.primaryBtnText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LinkRow({ onPress }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.7}>
      <Icon name="arrow-back" size={rs(13)} color={C.emeraldDeep} />
      <Text style={styles.linkText}>Back to Login</Text>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: rs(30) },

  // ── Hero ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(60), right: -rs(40),
    width: rs(190), height: rs(190), borderRadius: rs(95),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(70), left: -rs(50),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  heroTop: {
    flexDirection: "row", alignItems: "center",
    gap: rs(10), paddingTop: rs(8),
  },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  brandBadge: {
    width: rs(38), height: rs(38), borderRadius: rs(13),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  heroTextBlock: { marginTop: rs(18) },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(22), lineHeight: rf(28),
    color: "#fff", letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(12), lineHeight: rf(16),
    color: "rgba(255,255,255,0.72)", fontWeight: "bold", marginTop: rs(4),
  },

  // ── Stepper ──
  stepper: {
    flexDirection: "row", alignItems: "flex-start",
    marginTop: rs(20), paddingHorizontal: rs(2),
  },
  stepItem: { alignItems: "center", width: rs(56) },
  stepNode: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.22)",
  },
  stepNodeDone: { backgroundColor: "#fff", borderColor: "#fff" },
  stepNodeActive: {
    backgroundColor: C.goldLight,
    borderColor: "rgba(255,255,255,0.9)",
  },
  stepNodeText: {
    fontFamily: DISPLAY, fontSize: rf(12), lineHeight: rf(16),
    fontWeight: "bold", color: "rgba(255,255,255,0.7)",
  },
  stepLabel: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(13),
    fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)", marginTop: rs(6),
  },
  stepLabelOn: { color: "#fff" },
  // Sits level with the node centres (28/2 − 2/2 = 13).
  stepConnector: {
    flex: 1, height: rs(2), borderRadius: rs(1),
    marginTop: rs(13), marginHorizontal: rs(2),
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  stepConnectorDone: { backgroundColor: "rgba(255,255,255,0.75)" },

  // ── Card ──
  cardWrap: { marginHorizontal: GUT, marginTop: -CARD_OVERLAP },
  card: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: C.glassBorder,
    padding: rs(18),
  },

  // Masked-email pill shown on steps 2 & 3
  sentPill: {
    alignSelf: "center", flexDirection: "row", alignItems: "center",
    gap: rs(6), maxWidth: "100%",
    paddingHorizontal: rs(12), height: rs(30), borderRadius: 999,
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.16)",
    marginBottom: rs(16),
  },
  sentPillText: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", color: C.emeraldDeep, flexShrink: 1,
  },

  fieldLabel: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", color: C.sub,
    letterSpacing: 0.4, textTransform: "uppercase",
    marginBottom: rs(8),
  },
  inputWrap: {
    height: rs(50), borderRadius: rs(13),
    borderWidth: 1, borderColor: C.border, backgroundColor: C.ivory,
    paddingHorizontal: rs(13), flexDirection: "row",
    alignItems: "center", gap: rs(9),
  },
  input: {
    fontFamily: DISPLAY, flex: 1, color: C.ink,
    fontSize: rf(14), fontWeight: "500", paddingVertical: 0,
  },
  inputError: { borderColor: alpha(C.red, 0.45), backgroundColor: alpha(C.red, 0.04) },
  inputOk: { borderColor: C.emerald, backgroundColor: C.tintEmerald },

  // ── Live password checklist (2×2) ──
  checkGrid: {
    flexDirection: "row", flexWrap: "wrap",
    marginTop: rs(11), rowGap: rs(7),
  },
  checkItem: {
    width: "50%", flexDirection: "row",
    alignItems: "center", gap: rs(5), paddingRight: rs(6),
  },
  checkText: {
    fontFamily: DISPLAY, fontSize: rf(10.5), lineHeight: rf(14),
    color: C.muted, fontWeight: "600", flexShrink: 1,
  },
  checkTextOn: { color: C.emeraldDeep, fontWeight: "bold" },

  errorRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(5), marginTop: rs(7),
  },
  errorText: {
    fontFamily: DISPLAY, color: C.red, fontSize: rf(11.5),
    lineHeight: rf(15), fontWeight: "600", flexShrink: 1,
  },

  // ── OTP ──
  otpRow: {
    flexDirection: "row", justifyContent: "space-between",
    gap: rs(8), marginTop: rs(2),
  },
  otpBox: {
    fontFamily: DISPLAY,
    flex: 1, height: rs(56), borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.ivory,
    textAlign: "center", fontSize: rf(21), fontWeight: "bold", color: C.ink,
    paddingVertical: 0,
  },
  otpBoxFilled: {
    borderColor: C.emerald, backgroundColor: C.tintEmerald, color: C.emeraldDeep,
  },

  resendRow: {
    marginTop: rs(14), flexDirection: "row", alignItems: "center",
    gap: rs(7), justifyContent: "center", flexWrap: "wrap",
  },
  caption: {
    fontFamily: DISPLAY, color: C.sub, fontSize: rf(12.5),
    lineHeight: rf(17), fontWeight: "600",
  },
  drainTrack: {
    height: rs(3), borderRadius: rs(2), overflow: "hidden",
    backgroundColor: C.border, marginTop: rs(10),
    marginHorizontal: rs(30),
  },
  drainFill: { height: "100%", borderRadius: rs(2), backgroundColor: C.gold },

  // ── Strength meter ──
  strengthWrap: {
    flexDirection: "row", alignItems: "center",
    gap: rs(9), marginTop: rs(10),
  },
  strengthBars: { flexDirection: "row", gap: rs(5), flex: 1 },
  strengthSeg: { flex: 1, height: rs(5), borderRadius: rs(3) },
  strengthText: {
    fontFamily: DISPLAY, fontWeight: "bold",
    fontSize: rf(11), lineHeight: rf(14), letterSpacing: 0.4,
  },

  // ── Buttons ──
  primaryBtn: {
    height: rs(52), borderRadius: rs(14),
    overflow: "hidden", marginTop: rs(18),
  },
  primaryBtnInner: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: rs(8),
    overflow: "hidden",
  },
  btnSheen: {
    position: "absolute", top: -rs(20), bottom: -rs(20), left: 0,
    width: rs(70), backgroundColor: "rgba(255,255,255,0.32)",
  },
  primaryBtnText: {
    fontFamily: DISPLAY, color: "#fff", fontWeight: "bold",
    fontSize: rf(15), letterSpacing: 0.2,
  },
  linkRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(5), marginTop: rs(16),
  },
  linkText: {
    fontFamily: DISPLAY, color: C.emeraldDeep,
    fontWeight: "bold", fontSize: rf(12.5), lineHeight: rf(17),
  },

  footerNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), marginTop: rs(18),
  },
  footerText: {
    fontFamily: DISPLAY, color: C.muted, fontSize: rf(11.5),
    lineHeight: rf(15), fontWeight: "600",
  },
});
