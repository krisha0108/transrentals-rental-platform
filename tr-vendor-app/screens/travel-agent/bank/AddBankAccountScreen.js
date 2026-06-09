// screens/travel-agent/bank/AddBankAccountScreen.js
// REDESIGNED — emerald-themed Add Bank Account form with a live
// "credit-card" preview tile that updates as you type.
// IFSC format validated client-side; backend also enforces.
//
// POST /api/travel-agent/bank-details
// If isPrimary=true, backend demotes the previous primary automatically.
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { createTravelAgentBankAccount, BANK_ACCOUNT_TYPES } from "../../api/travelAgentClient";

const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald500: "#10B981",
  emerald50: "#ECFDF5",
  ink: "#0F172A",
  text: "#334155",
  subText: "#64748B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6EDF5",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
};

// IFSC format: 4 letters + 0 + 6 alphanumerics (e.g. SBIN0001234).
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function maskForPreview(n) {
  if (!n) return "•••• •••• •••• ••••";
  const s = String(n);
  if (s.length <= 4) return s.padStart(4, "•");
  const hidden = "•".repeat(Math.max(0, s.length - 4));
  return (hidden + s.slice(-4)).match(/.{1,4}/g)?.join(" ") || s;
}

export default function AddBankAccountScreen({ navigation, route }) {
  const hasPrimary = !!route?.params?.hasPrimary;

  const [form, setForm] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    accountType: "SAVINGS",
    branchName: "",
    upiId: "",
    isPrimary: !hasPrimary, // First account → default to primary
  });
  const [saving, setSaving] = useState(false);
  const [showAcc, setShowAcc] = useState(false);
  const [showConfirmAcc, setShowConfirmAcc] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isIfscValid = useMemo(
    () => IFSC_RE.test(form.ifscCode.trim().toUpperCase()),
    [form.ifscCode]
  );
  const accountsMatch = useMemo(
    () => form.accountNumber === form.confirmAccountNumber,
    [form.accountNumber, form.confirmAccountNumber]
  );
  const canSave =
    form.bankName.trim() &&
    form.accountHolderName.trim() &&
    form.accountNumber.trim().length >= 6 &&
    accountsMatch &&
    isIfscValid &&
    !saving;

  // Completion ratio for header progress dots.
  const completedSections = useMemo(() => {
    let c = 0;
    if (form.bankName.trim()) c++;
    if (form.accountHolderName.trim()) c++;
    if (form.accountNumber.trim().length >= 6 && accountsMatch) c++;
    if (isIfscValid) c++;
    return c;
  }, [form, isIfscValid, accountsMatch]);

  const save = async () => {
    if (!form.bankName.trim()) return Alert.alert("Required", "Bank name is required.");
    if (!form.accountHolderName.trim()) return Alert.alert("Required", "Account holder name is required.");
    if (!form.accountNumber.trim()) return Alert.alert("Required", "Account number is required.");
    if (!accountsMatch) return Alert.alert("Mismatch", "Account numbers do not match.");
    if (!isIfscValid) return Alert.alert("Invalid IFSC", "IFSC must be 11 chars: 4 letters + 0 + 6 alphanumerics (e.g. SBIN0001234).");

    try {
      setSaving(true);
      await createTravelAgentBankAccount({
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        accountType: form.accountType,
        branchName: form.branchName.trim() || null,
        upiId: form.upiId.trim() || null,
        isPrimary: form.isPrimary,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Live card preview gradient: emerald if marked primary, blue otherwise.
  const previewGradient = form.isPrimary
    ? [C.emerald700, C.emerald600]
    : ["#1E40AF", "#3B82F6"];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Add Bank Account</Text>
              <Text style={styles.headerSub}>
                {completedSections}/4 sections complete
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={save}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <Text style={styles.headerSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Mini progress dots */}
          <View style={styles.progressRow}>
            {["Bank", "Holder", "Acc no.", "IFSC"].map((label, i) => (
              <View key={label} style={styles.progressItem}>
                <View style={[styles.progressDot, i < completedSections && styles.progressDotDone]}>
                  {i < completedSections && <Ionicons name="checkmark" size={9} color={C.emerald700} />}
                </View>
                <Text style={styles.progressLabel} numberOfLines={1}>{label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ===== Live credit-card style preview ===== */}
          <View style={styles.previewWrap}>
            <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
            <LinearGradient
              colors={previewGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.previewTile}
            >
              {/* Decorative circles */}
              <View style={styles.previewCircleA} />
              <View style={styles.previewCircleB} />

              <View style={styles.previewHeader}>
                <View style={styles.previewChip}>
                  <Ionicons name="business" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.previewBankName} numberOfLines={1}>
                    {form.bankName.trim() || "Bank name"}
                  </Text>
                  {!!form.branchName.trim() && (
                    <Text style={styles.previewBranchName} numberOfLines={1}>
                      {form.branchName.trim()}
                    </Text>
                  )}
                </View>
                {form.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Ionicons name="star" size={11} color="#fff" />
                    <Text style={styles.primaryText}>PRIMARY</Text>
                  </View>
                )}
              </View>

              <View style={styles.previewAccRow}>
                <Text style={styles.previewAccLabel}>ACCOUNT NUMBER</Text>
                <Text style={styles.previewAccValue} numberOfLines={1}>
                  {maskForPreview(form.accountNumber)}
                </Text>
              </View>

              <View style={styles.previewBottomRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.previewSubLabel}>HOLDER</Text>
                  <Text style={styles.previewSubValue} numberOfLines={1}>
                    {form.accountHolderName.trim() || "Holder name"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.previewSubLabel}>IFSC</Text>
                  <Text style={styles.previewSubValue} numberOfLines={1}>
                    {form.ifscCode.trim().toUpperCase() || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.previewFooterChips}>
                <View style={styles.previewFooterChip}>
                  <Text style={styles.previewFooterChipText}>{form.accountType}</Text>
                </View>
                {!!form.upiId.trim() && (
                  <View style={styles.previewFooterChip}>
                    <Ionicons name="phone-portrait" size={10} color="#fff" />
                    <Text style={styles.previewFooterChipText}>{form.upiId.trim()}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* ===== Bank details ===== */}
          <SectionLabel icon="business" color={C.emerald600} label="Bank details" />
          <View style={styles.card}>
            <Field label="Bank name *">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                  <Ionicons name="business" size={14} color={C.emerald600} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField]}
                  placeholder="e.g. State Bank of India"
                  placeholderTextColor="#A3B3C2"
                  value={form.bankName}
                  onChangeText={(v) => update("bankName", v)}
                />
              </View>
            </Field>
            <Field label="Branch (optional)">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.blue}22` }]}>
                  <Ionicons name="location" size={14} color={C.blue} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField]}
                  placeholder="e.g. Indiranagar Branch"
                  placeholderTextColor="#A3B3C2"
                  value={form.branchName}
                  onChangeText={(v) => update("branchName", v)}
                />
              </View>
            </Field>
          </View>

          {/* ===== Account ===== */}
          <SectionLabel icon="person" color={C.blue} label="Account" />
          <View style={styles.card}>
            <Field label="Account holder name *">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.purple}22` }]}>
                  <Ionicons name="person" size={14} color={C.purple} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField]}
                  placeholder="As per bank records"
                  placeholderTextColor="#A3B3C2"
                  value={form.accountHolderName}
                  onChangeText={(v) => update("accountHolderName", v)}
                />
              </View>
            </Field>

            <Field label="Account number *">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.emerald600}22` }]}>
                  <Ionicons name="card" size={14} color={C.emerald600} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField, { paddingRight: 44 }]}
                  placeholder="Account number"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="number-pad"
                  value={form.accountNumber}
                  onChangeText={(v) => update("accountNumber", v.replace(/\s/g, ""))}
                  secureTextEntry={!showAcc}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowAcc((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showAcc ? "eye" : "eye-off"}
                    size={18}
                    color={C.subText}
                  />
                </TouchableOpacity>
              </View>
            </Field>

            <Field
              label="Confirm account number *"
              error={form.confirmAccountNumber && !accountsMatch ? "Account numbers do not match" : null}
              success={
                form.confirmAccountNumber &&
                accountsMatch &&
                form.accountNumber.trim().length >= 6
                  ? "Match ✓"
                  : null
              }
            >
              <View style={styles.iconInputWrap}>
                <View
                  style={[
                    styles.iconInputIcon,
                    {
                      backgroundColor:
                        form.confirmAccountNumber && accountsMatch
                          ? `${C.emerald600}22`
                          : form.confirmAccountNumber && !accountsMatch
                          ? `${C.red}22`
                          : "#F1F5F9",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      form.confirmAccountNumber && accountsMatch
                        ? "checkmark-circle"
                        : form.confirmAccountNumber && !accountsMatch
                        ? "close-circle"
                        : "lock-closed"
                    }
                    size={14}
                    color={
                      form.confirmAccountNumber && accountsMatch
                        ? C.emerald600
                        : form.confirmAccountNumber && !accountsMatch
                        ? C.red
                        : C.subText
                    }
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.iconInputField,
                    { paddingRight: 44 },
                    form.confirmAccountNumber && !accountsMatch && { borderColor: C.red },
                    form.confirmAccountNumber && accountsMatch && { borderColor: C.emerald600 },
                  ]}
                  placeholder="Re-enter account number"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="number-pad"
                  value={form.confirmAccountNumber}
                  onChangeText={(v) => update("confirmAccountNumber", v.replace(/\s/g, ""))}
                  secureTextEntry={!showConfirmAcc}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmAcc((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmAcc ? "eye" : "eye-off"}
                    size={18}
                    color={C.subText}
                  />
                </TouchableOpacity>
              </View>
            </Field>

            <Field
              label="IFSC code *"
              helper="Format: 4 letters + 0 + 6 alphanumerics (e.g. SBIN0001234)"
              error={form.ifscCode && !isIfscValid ? "Invalid IFSC format" : null}
              success={form.ifscCode && isIfscValid ? "Valid IFSC ✓" : null}
            >
              <View style={styles.iconInputWrap}>
                <View
                  style={[
                    styles.iconInputIcon,
                    {
                      backgroundColor:
                        form.ifscCode && isIfscValid
                          ? `${C.emerald600}22`
                          : form.ifscCode && !isIfscValid
                          ? `${C.red}22`
                          : `${C.amber}22`,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      form.ifscCode && isIfscValid
                        ? "checkmark-circle"
                        : form.ifscCode && !isIfscValid
                        ? "close-circle"
                        : "key"
                    }
                    size={14}
                    color={
                      form.ifscCode && isIfscValid
                        ? C.emerald600
                        : form.ifscCode && !isIfscValid
                        ? C.red
                        : C.amber
                    }
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.iconInputField,
                    { textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "monospace" },
                    form.ifscCode && !isIfscValid && { borderColor: C.red },
                    form.ifscCode && isIfscValid && { borderColor: C.emerald600 },
                  ]}
                  placeholder="SBIN0001234"
                  placeholderTextColor="#A3B3C2"
                  maxLength={11}
                  autoCapitalize="characters"
                  value={form.ifscCode}
                  onChangeText={(v) => update("ifscCode", v.toUpperCase())}
                />
              </View>
            </Field>

            <Field label="Account type">
              <View style={styles.segRow}>
                {BANK_ACCOUNT_TYPES.map((t) => {
                  const active = form.accountType === t;
                  const isSavings = t === "SAVINGS";
                  const color = isSavings ? C.emerald600 : C.blue;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.seg,
                        active && { backgroundColor: `${color}1A`, borderColor: color },
                      ]}
                      onPress={() => update("accountType", t)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={isSavings ? "wallet" : "briefcase"}
                        size={15}
                        color={active ? color : C.subText}
                      />
                      <Text style={[styles.segText, active && { color, fontWeight: "800" }]}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <Field label="UPI ID (optional)" helper="For instant transfers via UPI">
              <View style={styles.iconInputWrap}>
                <View style={[styles.iconInputIcon, { backgroundColor: `${C.purple}22` }]}>
                  <Ionicons name="phone-portrait" size={14} color={C.purple} />
                </View>
                <TextInput
                  style={[styles.input, styles.iconInputField]}
                  placeholder="e.g. agency@upi"
                  placeholderTextColor="#A3B3C2"
                  autoCapitalize="none"
                  value={form.upiId}
                  onChangeText={(v) => update("upiId", v.trim())}
                />
              </View>
            </Field>
          </View>

          {/* ===== Primary toggle ===== */}
          <SectionLabel icon="star" color={C.amber} label="Payout preference" />
          <TouchableOpacity
            style={[
              styles.primaryToggleCard,
              form.isPrimary && { borderColor: C.amber, backgroundColor: C.amberLight },
            ]}
            onPress={() => update("isPrimary", !form.isPrimary)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.toggleIcon,
                form.isPrimary
                  ? { backgroundColor: C.amber }
                  : { backgroundColor: "#E2E8F0" },
              ]}
            >
              <Ionicons
                name={form.isPrimary ? "star" : "star-outline"}
                size={18}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, form.isPrimary && { color: "#A16207" }]}>
                Set as primary
              </Text>
              <Text style={styles.toggleHint}>
                {form.isPrimary
                  ? hasPrimary
                    ? "Will replace the current primary account"
                    : "Payouts will be sent to this account"
                  : hasPrimary
                  ? "Existing primary stays — this is an additional account"
                  : "No account will receive payouts — toggle on to enable"}
              </Text>
            </View>
            {/* Visual switch */}
            <View
              style={[
                styles.toggleTrack,
                form.isPrimary && { backgroundColor: C.amber },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  form.isPrimary && { transform: [{ translateX: 16 }] },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* ===== Security note ===== */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={14} color={C.emerald600} />
            <Text style={styles.securityText}>
              Your account details are encrypted and only used for payouts. We never share them with customers.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky bottom save bar ===== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.publishBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.publishBtnInner}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.publishBtnText}>Save Account</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, color, label }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
    </View>
  );
}

function Field({ label, helper, error, success, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!error && (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle" size={11} color={C.red} />
          <Text style={[styles.feedbackText, { color: C.red }]}>{error}</Text>
        </View>
      )}
      {!error && !!success && (
        <View style={styles.feedbackRow}>
          <Ionicons name="checkmark-circle" size={11} color={C.emerald600} />
          <Text style={[styles.feedbackText, { color: C.emerald600 }]}>{success}</Text>
        </View>
      )}
      {!error && !success && !!helper && (
        <Text style={styles.helper}>{helper}</Text>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: "center" },
  headerSaveText: { color: C.emerald700, fontWeight: "800", fontSize: 13 },

  // Progress dots
  progressRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 4 },
  progressItem: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
  progressDotDone: { backgroundColor: "#fff", borderColor: "#fff" },
  progressLabel: { fontSize: 9.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", letterSpacing: 0.3 },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },

  // Live preview card
  previewWrap: { marginBottom: 8 },
  previewLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.6, marginBottom: 8 },
  previewTile: {
    borderRadius: 18, padding: 16, paddingBottom: 14,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    minHeight: 190,
  },
  previewCircleA: { position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.08)" },
  previewCircleB: { position: "absolute", right: -60, top: 20, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.05)" },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  previewChip: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  previewBankName: { fontSize: 15, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  previewBranchName: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },
  primaryBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(245,158,11,0.95)" },
  primaryText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

  previewAccRow: { marginBottom: 14 },
  previewAccLabel: { fontSize: 9.5, color: "rgba(255,255,255,0.75)", fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  previewAccValue: { fontSize: 17, color: "#fff", fontWeight: "900", letterSpacing: 2 },

  previewBottomRow: { flexDirection: "row", gap: 12, alignItems: "flex-end", marginBottom: 10 },
  previewSubLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "800", letterSpacing: 0.8, marginBottom: 3 },
  previewSubValue: { fontSize: 12.5, color: "#fff", fontWeight: "800" },

  previewFooterChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  previewFooterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)" },
  previewFooterChipText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  // Section label
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, marginBottom: 10 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },

  // Card
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  feedbackText: { fontSize: 11, fontWeight: "700" },
  helper: { fontSize: 10.5, color: C.subText, marginTop: 4, fontWeight: "600", fontStyle: "italic" },
  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },

  // Icon-prefix input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch", position: "relative" },
  iconInputIcon: {
    width: 44, justifyContent: "center", alignItems: "center",
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderWidth: 1, borderRightWidth: 0, borderColor: C.border,
  },
  iconInputField: {
    flex: 1, borderLeftWidth: 0,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
  },
  eyeBtn: {
    position: "absolute", right: 0, top: 0, bottom: 0,
    width: 40, alignItems: "center", justifyContent: "center",
  },

  // Account type segmented control
  segRow: { flexDirection: "row", gap: 8 },
  seg: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
  },
  segText: { fontSize: 12.5, fontWeight: "700", color: C.subText },

  // Primary toggle
  primaryToggleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  toggleIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  toggleTitle: { fontSize: 14, fontWeight: "800", color: C.text },
  toggleHint: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2, lineHeight: 15 },
  toggleTrack: { width: 36, height: 20, borderRadius: 10, backgroundColor: "#E2E8F0", padding: 2, justifyContent: "center" },
  toggleThumb: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },

  // Security note
  securityNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 16, padding: 11, borderRadius: 10,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
  },
  securityText: { flex: 1, fontSize: 11.5, color: C.emerald700, fontWeight: "600", lineHeight: 16 },

  // Bottom save bar
  bottomBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  publishBtnWrap: {
    flex: 1, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});
