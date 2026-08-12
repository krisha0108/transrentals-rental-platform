// screens/travel-agent/bank/AddBankAccountScreen.js
// Add Bank Account form with a live "credit-card" preview tile that updates as
// you type. IFSC format validated client-side; backend also enforces.
//
// POST /api/travel-agent/bank-details
// If isPrimary=true, backend demotes the previous primary automatically.
//
// REDESIGNED (v2) — "Elevate" visual language (ivory ground, forest→emerald
// gradient hero with floating orbs, serif DISPLAY type, glass cards), matching
// BankDetailsListScreen / DocumentsScreen / GetStartedScreen / Support.
//
// ⚠️ UI ONLY — no logic changes. Preserved exactly:
//   • the `form` shape (all 9 keys), `update()`, and the isPrimary default
//     derived from route.params.hasPrimary
//   • isIfscValid / accountsMatch / canSave / completedSections — same deps,
//     same conditions (including the `>= 6` account-number length)
//   • save() — all five Alert validations in the same order with identical
//     copy, the identical createTravelAgentBankAccount payload (same trims,
//     toUpperCase and `|| null` fallbacks), and navigation.goBack() on success
//   • IFSC_RE and maskForPreview() are byte-identical
//   • SectionLabel / Field stay at MODULE SCOPE — remounting them per render
//     would make the TextInputs lose focus on every keystroke
//   • Only the preview gradient's colour values were re-toned to match the
//     bank-list cards.
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  createTravelAgentBankAccount,
  updateTravelAgentBankAccount,
  BANK_ACCOUNT_TYPES,
} from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import { C, G, TONES, rs, rf, GUT, alpha, cardShadow } from "../_shared/theme";

// Hero ↔ preview spacing. Visible gap = HERO_TAIL + hero paddingBottom(8) − OVERLAP.
const HERO_TAIL = rs(30);
const PREVIEW_OVERLAP = rs(20);

// The preview tile is a plain white card — no gradient. Primary status is
// carried by the PRIMARY badge, not by the card colour.

const PROGRESS_STEPS = ["Bank", "Holder", "Acc no.", "IFSC"];

// IFSC format: 4 letters + 0 + 6 alphanumerics (e.g. SBIN0001234).
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function maskForPreview(n) {
  if (!n) return "•••• •••• •••• ••••";
  const s = String(n);
  if (s.length <= 4) return s.padStart(4, "•");
  const hidden = "•".repeat(Math.max(0, s.length - 4));
  return (hidden + s.slice(-4)).match(/.{1,4}/g)?.join(" ") || s;
}

/* ───────── Stable presentational helpers (module scope so inputs keep focus) ───────── */

function SectionLabel({ icon, tone, label }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: t.tint }]}>
        <Ionicons name={icon} size={rs(13)} color={t.ink} />
      </View>
      <Text style={[styles.sectionLabelText, { color: t.ink }]}>{label}</Text>
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
          <Ionicons name="alert-circle" size={rs(12)} color={C.red} />
          <Text style={[styles.feedbackText, { color: C.red }]}>{error}</Text>
        </View>
      )}
      {!error && !!success && (
        <View style={styles.feedbackRow}>
          <Ionicons name="checkmark-circle" size={rs(12)} color={C.emerald} />
          <Text style={[styles.feedbackText, { color: C.emeraldDeep }]}>{success}</Text>
        </View>
      )}
      {!error && !success && !!helper && (
        <Text style={styles.helper}>{helper}</Text>
      )}
    </View>
  );
}

// Classic EMV contact plate — the single detail that makes a flat white
// rectangle read as a real bank card. Gold plate + the usual contact grid.
function EmvChip() {
  return (
    <LinearGradient
      colors={G.gold}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.emv}
    >
      <View style={styles.emvRowLine} />
      <View style={[styles.emvColLine, { left: "33%" }]} />
      <View style={[styles.emvColLine, { left: "66%" }]} />
    </LinearGradient>
  );
}

// Rounded input with a tinted leading icon tile.
function IconInput({ tone, icon, iconColor, iconBg, invalid, valid, children }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View
      style={[
        styles.inputWrap,
        valid && styles.inputWrapValid,
        invalid && styles.inputWrapInvalid,
      ]}
    >
      <View style={[styles.inputIcon, { backgroundColor: iconBg || t.tint }]}>
        <Ionicons name={icon} size={rs(14)} color={iconColor || t.ink} />
      </View>
      {children}
    </View>
  );
}

export default function AddBankAccountScreen({ navigation, route }) {
  const hasPrimary = !!route?.params?.hasPrimary;
  // The list passes the whole account row when the user taps Edit; its absence
  // is what makes this the Add screen. Same form either way — only the initial
  // values, the two labels and which API call fires differ.
  const editing = route?.params?.account || null;

  const [form, setForm] = useState({
    bankName: editing?.bankName || "",
    accountHolderName: editing?.accountHolderName || "",
    accountNumber: editing?.accountNumber || "",
    // Pre-filled to match: the confirm field guards against a typo while
    // entering a new number, and re-typing it to edit the branch name would be
    // busywork. Clearing the account number still forces a re-confirm.
    confirmAccountNumber: editing?.accountNumber || "",
    ifscCode: editing?.ifscCode || "",
    accountType: editing?.accountType || "SAVINGS",
    branchName: editing?.branchName || "",
    upiId: editing?.upiId || "",
    // Editing keeps the account's own flag; a first account defaults to primary.
    isPrimary: editing ? !!editing.isPrimary : !hasPrimary,
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
      const payload = {
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        accountType: form.accountType,
        branchName: form.branchName.trim() || null,
        upiId: form.upiId.trim() || null,
        isPrimary: form.isPrimary,
      };
      if (editing) {
        await updateTravelAgentBankAccount(editing.id, payload);
      } else {
        await createTravelAgentBankAccount(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Derived confirm/IFSC states — used only to colour the inputs.
  const confirmTouched = !!form.confirmAccountNumber;
  const confirmOk = confirmTouched && accountsMatch;
  const confirmBad = confirmTouched && !accountsMatch;
  const ifscTouched = !!form.ifscCode;
  const ifscOk = ifscTouched && isIfscValid;
  const ifscBad = ifscTouched && !isIfscValid;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Hero (fixed) ──
          Outside the ScrollView so the close button, the Save pill and the
          progress nodes stay reachable while the form scrolls — the progress
          nodes are the whole point of the header here, and they were scrolling
          away exactly when you started filling the fields they track.

          It also sits outside the KeyboardAvoidingView, so opening the keyboard
          only shrinks the scrolling form, never the header. */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
            <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
            <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

            <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
              <View style={styles.heroTop}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.circleBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={rs(20)} color="#fff" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  style={[styles.savePill, !canSave && { opacity: 0.45 }]}
                  onPress={save}
                  disabled={!canSave}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={C.emeraldDeep} />
                  ) : (
                    <Text style={styles.savePillText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.heroTextBlock}>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {editing ? "Edit Bank Account" : "Add Bank Account"}
                </Text>
                <Text style={styles.heroSub} numberOfLines={1}>
                  {completedSections}/4 sections complete
                </Text>
              </View>

              {/* Progress nodes */}
              <View style={styles.progressRow}>
                {PROGRESS_STEPS.map((label, i) => {
                  const done = i < completedSections;
                  return (
                    <React.Fragment key={label}>
                      <View style={styles.progressItem}>
                        <View style={[styles.progressDot, done && styles.progressDotDone]}>
                          {done && (
                            <Ionicons name="checkmark" size={rs(11)} color={C.emeraldDeep} />
                          )}
                        </View>
                        <Text
                          style={[styles.progressLabel, done && styles.progressLabelOn]}
                          numberOfLines={1}
                        >
                          {label}
                        </Text>
                      </View>
                      {i < PROGRESS_STEPS.length - 1 && (
                        <View style={[styles.progressLine, done && styles.progressLineDone]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Short by PREVIEW_OVERLAP: the preview card used to climb that
                  far back up into the tail via its negative margin. It can't
                  any more (different scroll parent), so the tail gives the
                  same space back and the visible gap stays what it was. */}
              <View style={{ height: HERO_TAIL - PREVIEW_OVERLAP }} />
            </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Live credit-card preview ──
              A plain white card, matching the form cards below it. */}
          <View style={styles.previewWrap}>
            <View style={[styles.previewTile, cardShadow]}>
              {/* Gold rail across the very top — the card's only saturated colour */}
              <LinearGradient
                colors={G.gold}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.previewRail}
              />
              {/* Two faint washes for depth — emerald top-right, gold
                  bottom-left (picks up the rail). Both under 6% so the card
                  still reads as white. */}
              <View style={styles.previewWash} />
              <View style={styles.previewWashB} />

              {/* Real-card layout: chip top-left, number in the middle, holder
                  + IFSC below it, issuer at the bottom. Packs the same fields
                  into far less height than the old stacked version. */}
              <View style={styles.previewBody}>
                <View style={styles.emvRow}>
                  <EmvChip />
                  <Ionicons
                    name="wifi"
                    size={rs(16)}
                    color={C.muted}
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                  <View style={{ flex: 1 }} />
                  {form.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Ionicons name="star" size={rs(10)} color={TONES.amber.ink} />
                      <Text style={styles.primaryText}>PRIMARY</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.previewAccValue} numberOfLines={1}>
                  {maskForPreview(form.accountNumber)}
                </Text>

                <View style={styles.previewBottomRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.previewSubLabel}>HOLDER</Text>
                    <Text style={styles.previewSubValue} numberOfLines={1}>
                      {form.accountHolderName.trim() || "Holder name"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", minWidth: 0 }}>
                    <Text style={styles.previewSubLabel}>IFSC</Text>
                    <Text style={styles.previewSubValue} numberOfLines={1}>
                      {form.ifscCode.trim().toUpperCase() || "—"}
                    </Text>
                  </View>
                </View>

                {/* Issuer strip — bank identity sits at the foot, like a real card */}
                <View style={styles.issuerRow}>
                  <View style={styles.previewChip}>
                    <Ionicons name="business" size={rs(14)} color={C.emeraldDeep} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.previewBankName} numberOfLines={1}>
                      {form.bankName.trim() || "Bank name"}
                    </Text>
                    <Text style={styles.previewBranchName} numberOfLines={1}>
                      {form.branchName.trim() || "Branch"}
                    </Text>
                  </View>
                  <View style={styles.previewFooterChips}>
                    <View style={styles.previewFooterChip}>
                      <Text style={styles.previewFooterChipText}>{form.accountType}</Text>
                    </View>
                    {!!form.upiId.trim() && (
                      <View style={styles.previewFooterChip}>
                        <Ionicons name="phone-portrait" size={rs(9)} color={C.emeraldDeep} />
                        <Text style={styles.previewFooterChipText} numberOfLines={1}>
                          {form.upiId.trim()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.previewCaption}>
              <Ionicons name="eye-outline" size={rs(11)} color={C.muted} />
              <Text style={styles.previewCaptionText}>Live preview · updates as you type</Text>
            </View>
          </View>

          <View style={styles.body}>
            {/* ── Bank details ── */}
            <SectionLabel icon="business" tone="emerald" label="Bank details" />
            <View style={[styles.card, cardShadow]}>
              <Field label="Bank name *">
                <IconInput tone="emerald" icon="business">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor={C.muted}
                    value={form.bankName}
                    onChangeText={(v) => update("bankName", v)}
                  />
                </IconInput>
              </Field>

              <Field label="Branch (optional)">
                <IconInput tone="ocean" icon="location">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Indiranagar Branch"
                    placeholderTextColor={C.muted}
                    value={form.branchName}
                    onChangeText={(v) => update("branchName", v)}
                  />
                </IconInput>
              </Field>
            </View>

            {/* ── Account ── */}
            <SectionLabel icon="person" tone="ocean" label="Account" />
            <View style={[styles.card, cardShadow]}>
              <Field label="Account holder name *">
                <IconInput tone="plum" icon="person">
                  <TextInput
                    style={styles.input}
                    placeholder="As per bank records"
                    placeholderTextColor={C.muted}
                    value={form.accountHolderName}
                    onChangeText={(v) => update("accountHolderName", v)}
                  />
                </IconInput>
              </Field>

              <Field label="Account number *">
                <IconInput tone="emerald" icon="card">
                  <TextInput
                    style={[styles.input, { paddingRight: rs(42) }]}
                    placeholder="Account number"
                    placeholderTextColor={C.muted}
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
                    <Ionicons name={showAcc ? "eye" : "eye-off"} size={rs(18)} color={C.muted} />
                  </TouchableOpacity>
                </IconInput>
              </Field>

              <Field
                label="Confirm account number *"
                error={confirmBad ? "Account numbers do not match" : null}
                success={
                  confirmOk && form.accountNumber.trim().length >= 6 ? "Match ✓" : null
                }
              >
                <IconInput
                  tone="emerald"
                  valid={confirmOk}
                  invalid={confirmBad}
                  icon={confirmOk ? "checkmark-circle" : confirmBad ? "close-circle" : "lock-closed"}
                  iconColor={confirmOk ? C.emeraldDeep : confirmBad ? C.red : C.muted}
                  iconBg={confirmOk ? C.tintEmerald : confirmBad ? C.redL : C.sand}
                >
                  <TextInput
                    style={[styles.input, { paddingRight: rs(42) }]}
                    placeholder="Re-enter account number"
                    placeholderTextColor={C.muted}
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
                    <Ionicons name={showConfirmAcc ? "eye" : "eye-off"} size={rs(18)} color={C.muted} />
                  </TouchableOpacity>
                </IconInput>
              </Field>

              <Field
                label="IFSC code *"
                helper="Format: 4 letters + 0 + 6 alphanumerics (e.g. SBIN0001234)"
                error={ifscBad ? "Invalid IFSC format" : null}
                success={ifscOk ? "Valid IFSC ✓" : null}
              >
                <IconInput
                  tone="amber"
                  valid={ifscOk}
                  invalid={ifscBad}
                  icon={ifscOk ? "checkmark-circle" : ifscBad ? "close-circle" : "key"}
                  iconColor={ifscOk ? C.emeraldDeep : ifscBad ? C.red : TONES.amber.ink}
                  iconBg={ifscOk ? C.tintEmerald : ifscBad ? C.redL : C.tintGold}
                >
                  <TextInput
                    style={[styles.input, styles.ifscInput]}
                    placeholder="SBIN0001234"
                    placeholderTextColor={C.muted}
                    maxLength={11}
                    autoCapitalize="characters"
                    value={form.ifscCode}
                    onChangeText={(v) => update("ifscCode", v.toUpperCase())}
                  />
                </IconInput>
              </Field>

              <Field label="Account type">
                <View style={styles.segRow}>
                  {BANK_ACCOUNT_TYPES.map((t) => {
                    const active = form.accountType === t;
                    const isSavings = t === "SAVINGS";
                    const tone = isSavings ? TONES.emerald : TONES.ocean;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.seg,
                          active && { backgroundColor: tone.tint, borderColor: alpha(tone.ink, 0.35) },
                        ]}
                        onPress={() => update("accountType", t)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={isSavings ? "wallet" : "briefcase"}
                          size={rs(15)}
                          color={active ? tone.ink : C.muted}
                        />
                        <Text style={[styles.segText, active && { color: tone.ink }]}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>

              <Field label="UPI ID (optional)" helper="For instant transfers via UPI">
                <IconInput tone="plum" icon="phone-portrait">
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. agency@upi"
                    placeholderTextColor={C.muted}
                    autoCapitalize="none"
                    value={form.upiId}
                    onChangeText={(v) => update("upiId", v.trim())}
                  />
                </IconInput>
              </Field>
            </View>

            {/* ── Primary toggle ── */}
            <SectionLabel icon="star" tone="amber" label="Payout preference" />
            <TouchableOpacity
              style={[styles.toggleCard, cardShadow, form.isPrimary && styles.toggleCardOn]}
              onPress={() => update("isPrimary", !form.isPrimary)}
              activeOpacity={0.85}
            >
              {form.isPrimary ? (
                <LinearGradient
                  colors={G.gold}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.toggleIcon}
                >
                  <Ionicons name="star" size={rs(18)} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.toggleIcon, { backgroundColor: C.sand }]}>
                  <Ionicons name="star-outline" size={rs(18)} color={C.muted} />
                </View>
              )}

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.toggleTitle, form.isPrimary && { color: TONES.amber.ink }]}>
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

              <View style={[styles.toggleTrack, form.isPrimary && { backgroundColor: C.gold }]}>
                <View
                  style={[
                    styles.toggleThumb,
                    form.isPrimary && { transform: [{ translateX: rs(16) }] },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* ── Security note ── */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={rs(14)} color={C.emeraldDeep} />
              <Text style={styles.securityText}>
                Your account details are encrypted and only used for payouts. We never share them with customers.
              </Text>
            </View>
          </View>

          <View style={{ height: rs(100) }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky bottom save bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={G.emerald}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.saveBtnInner}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={rs(18)} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {editing ? "Update Account" : "Save Account"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // paddingTop cancels previewWrap's -PREVIEW_OVERLAP. That negative margin
  // used to pull the preview card up over the hero's rounded bottom while both
  // lived in the ScrollView; now the hero is fixed above it, so without this
  // the card's top 20dp would simply be cut off at the scroll edge.
  scroll: { flexGrow: 1, paddingTop: PREVIEW_OVERLAP },

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
  savePill: {
    height: rs(38), minWidth: rs(70), paddingHorizontal: rs(18),
    borderRadius: 999, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  savePillText: {
    fontFamily: DISPLAY, color: C.emeraldDeep,
    fontWeight: "bold", fontSize: rf(13.5), lineHeight: rf(18),
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

  // ── Progress nodes ──
  progressRow: {
    flexDirection: "row", alignItems: "flex-start",
    marginTop: rs(18), paddingHorizontal: rs(2),
  },
  progressItem: { alignItems: "center", width: rs(52) },
  progressDot: {
    width: rs(24), height: rs(24), borderRadius: rs(12),
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.24)",
    alignItems: "center", justifyContent: "center",
  },
  progressDotDone: { backgroundColor: "#fff", borderColor: "#fff" },
  progressLabel: {
    fontFamily: DISPLAY, fontSize: rf(9), lineHeight: rf(12),
    color: "rgba(255,255,255,0.5)", fontWeight: "bold",
    letterSpacing: 0.4, marginTop: rs(6), textTransform: "uppercase",
  },
  progressLabelOn: { color: "#fff" },
  // Level with the node centres (24/2 − 2/2 = 11).
  progressLine: {
    flex: 1, height: rs(2), borderRadius: rs(1),
    marginTop: rs(11), marginHorizontal: rs(2),
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressLineDone: { backgroundColor: "rgba(255,255,255,0.7)" },

  // ── Live preview ──
  previewWrap: { marginHorizontal: GUT, marginTop: -PREVIEW_OVERLAP },
  // White card dressed as a real bank card: gold rail, EMV chip, contactless
  // mark and a hairline split — no saturated fill, but not a plain box either.
  previewTile: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: C.glassBorder,
    overflow: "hidden",
  },
  previewRail: { height: rs(4), width: "100%" },
  previewWash: {
    position: "absolute", right: -rs(50), top: -rs(30),
    width: rs(160), height: rs(160), borderRadius: rs(80),
    backgroundColor: alpha(C.emeraldDeep, 0.075),
  },
  previewWashB: {
    position: "absolute", left: -rs(45), bottom: -rs(55),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: alpha(C.gold, 0.11),
  },
  previewBody: { paddingHorizontal: rs(15), paddingTop: rs(13), paddingBottom: rs(13) },

  previewChip: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },

  // ── EMV contact plate ──
  emvRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(9), marginBottom: rs(12),
  },
  emv: {
    width: rs(34), height: rs(25), borderRadius: rs(5),
    overflow: "hidden", justifyContent: "center",
    borderWidth: 0.5, borderColor: alpha("#8A6A1E", 0.5),
  },
  emvRowLine: {
    position: "absolute", left: 0, right: 0, top: "50%",
    height: 1, backgroundColor: alpha("#6B4A10", 0.45),
  },
  emvColLine: {
    position: "absolute", top: 0, bottom: 0,
    width: 1, backgroundColor: alpha("#6B4A10", 0.45),
  },
  previewBankName: {
    fontFamily: DISPLAY, fontSize: rf(13), lineHeight: rf(17),
    fontWeight: "bold", color: C.ink, letterSpacing: 0.3,
  },
  previewBranchName: {
    fontFamily: DISPLAY, fontSize: rf(10), lineHeight: rf(13),
    color: C.muted, marginTop: rs(1), fontWeight: "600",
  },
  primaryBadge: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), height: rs(22), borderRadius: 999,
    backgroundColor: C.tintGold,
    borderWidth: 1, borderColor: alpha(C.gold, 0.3),
  },
  primaryText: {
    fontFamily: DISPLAY, color: TONES.amber.ink, fontSize: rf(9),
    lineHeight: rf(12), fontWeight: "bold", letterSpacing: 0.5,
  },

  previewAccValue: {
    fontFamily: DISPLAY, fontSize: rf(19), lineHeight: rf(25),
    color: C.ink, fontWeight: "bold", letterSpacing: 2.4,
    marginBottom: rs(12),
  },

  previewBottomRow: {
    flexDirection: "row", gap: rs(12),
    alignItems: "flex-end", marginBottom: rs(13),
  },
  previewSubLabel: {
    fontFamily: DISPLAY, fontSize: rf(8), lineHeight: rf(10),
    color: C.muted, fontWeight: "bold",
    letterSpacing: 0.8, marginBottom: rs(2),
  },
  previewSubValue: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(16),
    color: C.ink, fontWeight: "bold",
  },

  // Issuer strip at the foot of the card
  issuerRow: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    paddingTop: rs(11), borderTopWidth: 1, borderTopColor: C.border,
  },
  previewFooterChips: {
    flexDirection: "row", gap: rs(5), flexWrap: "wrap",
    justifyContent: "flex-end", maxWidth: "46%",
  },
  previewFooterChip: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), height: rs(21), borderRadius: 999,
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.16)",
  },
  previewFooterChipText: {
    fontFamily: DISPLAY, color: C.emeraldDeep, fontSize: rf(9),
    lineHeight: rf(12), fontWeight: "bold", letterSpacing: 0.3,
    flexShrink: 1,
  },

  // Caption below the card (costs no card height)
  previewCaption: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(5), marginTop: rs(9),
  },
  previewCaptionText: {
    fontFamily: DISPLAY, fontSize: rf(10.5), lineHeight: rf(14),
    color: C.muted, fontWeight: "600", fontStyle: "italic",
  },

  body: { paddingHorizontal: GUT },

  // ── Section label ──
  sectionLabelRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(7), marginTop: rs(20), marginBottom: rs(11),
  },
  sectionLabelIcon: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  sectionLabelText: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", letterSpacing: 0.6, textTransform: "uppercase",
  },

  // ── Card + fields ──
  card: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(15),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  field: { marginBottom: rs(15) },
  fieldLabel: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", color: C.sub,
    letterSpacing: 0.3, marginBottom: rs(7),
  },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: rs(5), marginTop: rs(6) },
  feedbackText: { fontFamily: DISPLAY, fontSize: rf(11), lineHeight: rf(14), fontWeight: "bold" },
  helper: {
    fontFamily: DISPLAY, fontSize: rf(10.5), lineHeight: rf(14),
    color: C.muted, marginTop: rs(5), fontWeight: "600", fontStyle: "italic",
  },

  // Single-piece input: leading icon tile + field share one rounded shell.
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    height: rs(50), borderRadius: rs(13), overflow: "hidden",
    borderWidth: 1, borderColor: C.border, backgroundColor: C.ivory,
  },
  inputWrapValid: { borderColor: C.emerald },
  inputWrapInvalid: { borderColor: alpha(C.red, 0.5) },
  inputIcon: {
    width: rs(44), height: "100%",
    alignItems: "center", justifyContent: "center",
  },
  input: {
    fontFamily: DISPLAY, flex: 1,
    paddingHorizontal: rs(12), fontSize: rf(14),
    color: C.ink, fontWeight: "500", paddingVertical: 0,
  },
  ifscInput: { textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "bold" },
  eyeBtn: {
    position: "absolute", right: 0, top: 0, bottom: 0,
    width: rs(42), alignItems: "center", justifyContent: "center",
  },

  // ── Account type segmented ──
  segRow: { flexDirection: "row", gap: rs(8) },
  seg: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), height: rs(48), borderRadius: rs(13),
    backgroundColor: C.ivory, borderWidth: 1, borderColor: C.border,
  },
  segText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(17),
    fontWeight: "bold", color: C.sub,
  },

  // ── Primary toggle ──
  toggleCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(14), borderRadius: rs(18),
    borderWidth: 1, borderColor: C.glassBorder, backgroundColor: C.card,
  },
  toggleCardOn: { backgroundColor: C.tintGold, borderColor: alpha(C.gold, 0.35) },
  toggleIcon: {
    width: rs(38), height: rs(38), borderRadius: rs(13),
    alignItems: "center", justifyContent: "center",
  },
  toggleTitle: {
    fontFamily: DISPLAY, fontSize: rf(14), lineHeight: rf(19),
    fontWeight: "bold", color: C.ink,
  },
  toggleHint: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(16),
    color: C.sub, fontWeight: "600", marginTop: rs(2),
  },
  toggleTrack: {
    width: rs(38), height: rs(22), borderRadius: rs(11),
    backgroundColor: C.sand, padding: rs(3), justifyContent: "center",
  },
  toggleThumb: {
    width: rs(16), height: rs(16), borderRadius: rs(8), backgroundColor: "#fff",
    shadowColor: "#0B3327", shadowOpacity: 0.2, shadowRadius: rs(3),
    shadowOffset: { width: 0, height: rs(1) }, elevation: 2,
  },

  // ── Security note ──
  securityNote: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    marginTop: rs(18), padding: rs(12), borderRadius: rs(14),
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.18)",
  },
  securityText: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(11.5),
    lineHeight: rf(16), color: C.emeraldDeep, fontWeight: "600",
  },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: "row", gap: rs(10),
    paddingHorizontal: GUT, paddingTop: rs(11),
    paddingBottom: Platform.OS === "ios" ? rs(24) : rs(12),
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtnWrap: { flex: 1, height: rs(52), borderRadius: rs(14), overflow: "hidden" },
  saveBtnInner: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: rs(8),
  },
  saveBtnText: {
    fontFamily: DISPLAY, color: "#fff", fontWeight: "bold",
    fontSize: rf(14.5), letterSpacing: 0.2,
  },
});
