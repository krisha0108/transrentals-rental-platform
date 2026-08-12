// screens/travel-agent/leads/AddEditLeadScreen.js
// REDESIGNED — emerald-themed Add/Edit Lead form.
//
//   navigate("TAAddEditLead")              → create mode
//   navigate("TAAddEditLead", { lead })    → edit mode
//
// POST /api/travel-agent/leads      (create)
// PATCH /api/travel-agent/leads/[id] (edit)
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { DISPLAY } from "../_shared/typography";
import {
  createTravelAgentLead,
  updateTravelAgentLead,
  listTravelAgentTours,
  LEAD_PRIORITY,
  LEAD_SOURCE,
} from "../../api/travelAgentClient";
import { SC as C, SHEET_RADIUS } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
import SheetHandle from "../_shared/SheetHandle";


const TRIP_TYPES = [
  { value: "ONE_WAY",       label: "One-way",       icon: "arrow-forward" },
  { value: "ROUND_TRIP",    label: "Round trip",    icon: "swap-horizontal" },
  { value: "MULTI_CITY",    label: "Multi-city",    icon: "git-network" },
  { value: "TOUR_PACKAGE",  label: "Tour package",  icon: "map" },
  { value: "ACCOMMODATION", label: "Accommodation", icon: "bed" },
  { value: "OTHER",         label: "Other",         icon: "ellipsis-horizontal" },
];

const SOURCE_LABELS = {
  MANUAL: "Manual entry",
  CAPTURE_LINK: "Capture link",
  WEBSITE: "Website",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  SOCIAL_MEDIA: "Social media",
  GOOGLE_ADS: "Google Ads",
  WHATSAPP: "WhatsApp",
  OTHER: "Other",
};

const PRIORITY_META = {
  HOT:  { fg: "#B91C1C", bg: "#FEE2E2", icon: "flame", label: "Hot" },
  WARM: { fg: "#A16207", bg: "#FEF3C7", icon: "sunny", label: "Warm" },
  COLD: { fg: "#0369A1", bg: "#E0F2FE", icon: "snow",  label: "Cold" },
};

function isoOrNull(date) {
  if (!date) return null;
  try { return new Date(date).toISOString(); } catch { return null; }
}
function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; }
}
function formatWhen(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch { return ""; }
}

export default function AddEditLeadScreen({ navigation, route }) {
  const existing = route?.params?.lead || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState(() => ({
    customerName: existing?.customerName || "",
    customerPhone: existing?.customerPhone || "",
    customerEmail: existing?.customerEmail || "",
    source: existing?.source || "MANUAL",
    tripType: existing?.tripType || "",
    tourId: existing?.tourId || "",
    pickupLocation: existing?.pickupLocation || "",
    dropLocation: existing?.dropLocation || "",
    destination: existing?.destination || "",
    travelDate: existing?.travelDate || null,
    returnDate: existing?.returnDate || null,
    passengers: existing?.passengers ? String(existing.passengers) : "",
    requirement: existing?.requirement || "",
    estimatedValue: existing?.estimatedValue ? String(existing.estimatedValue) : "",
    quotedAmount: existing?.quotedAmount ? String(existing.quotedAmount) : "",
    priority: existing?.priority || "WARM",
    assignedToName: existing?.assignedToName || "",
    nextFollowUp: existing?.nextFollowUp || null,
  }));
  const [tours, setTours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showTripTypeModal, setShowTripTypeModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);

  useEffect(() => {
    listTravelAgentTours({ status: "ACTIVE" })
      .then((d) => setTours(d?.tours || []))
      .catch(() => {});
  }, []);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const isPhoneValid = useMemo(
    () => /^[6-9]\d{9}$/.test((form.customerPhone || "").replace(/\D/g, "")),
    [form.customerPhone]
  );
  const canSave =
    form.customerName.trim().length >= 2 && isPhoneValid && !saving;

  const handleSave = async () => {
    if (!form.customerName.trim()) return Alert.alert("Required", "Customer name is required.");
    if (!isPhoneValid) return Alert.alert("Invalid phone", "Enter a valid 10-digit phone number.");

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.replace(/\D/g, "").slice(-10),
      customerEmail: form.customerEmail.trim() || null,
      source: form.source || "MANUAL",
      tripType: form.tripType || null,
      tourId: form.tourId || null,
      pickupLocation: form.pickupLocation.trim() || null,
      dropLocation: form.dropLocation.trim() || null,
      destination: form.destination.trim() || null,
      travelDate: isoOrNull(form.travelDate),
      returnDate: isoOrNull(form.returnDate),
      passengers: form.passengers ? Number(form.passengers) : null,
      requirement: form.requirement.trim() || null,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      quotedAmount: form.quotedAmount ? Number(form.quotedAmount) : null,
      priority: form.priority || "WARM",
      assignedToName: form.assignedToName.trim() || null,
      nextFollowUp: isoOrNull(form.nextFollowUp),
    };

    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentLead(existing.id, payload);
      else await createTravelAgentLead(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPickDate = (date) => {
    if (pickerType) update(pickerType, date.toISOString());
    setPickerType(null);
  };

  const selectedTripType = TRIP_TYPES.find((t) => t.value === form.tripType);
  const selectedTour = tours.find((t) => t.id === form.tourId);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 18 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.circleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{isEdit ? "Edit Lead" : "New Lead"}</Text>
              <Text style={styles.headerSub}>
                {isEdit ? "Update lead details" : "Capture a new customer enquiry"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.headerSaveBtn, !canSave && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={12} color={C.emerald700} />
                  <Text style={styles.headerSaveText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ===== CUSTOMER ===== */}
          <Section icon="person" label="Customer" color={C.emerald600} />
          <Card>
            <Field label="Name *">
              <TextInput
                style={styles.input}
                placeholder="Customer's full name"
                placeholderTextColor="#A3B3C2"
                value={form.customerName}
                onChangeText={(v) => update("customerName", v)}
              />
            </Field>
            <Field
              label="Phone *"
              error={form.customerPhone && !isPhoneValid ? "Enter a valid 10-digit phone" : null}
            >
              <View style={styles.phoneInputWrap}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }]}
                  placeholder="9876543210"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.customerPhone}
                  onChangeText={(v) => update("customerPhone", v.replace(/\D/g, ""))}
                />
              </View>
            </Field>
            <Field label="Email">
              <TextInput
                style={styles.input}
                placeholder="customer@example.com"
                placeholderTextColor="#A3B3C2"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.customerEmail}
                onChangeText={(v) => update("customerEmail", v)}
              />
            </Field>
          </Card>

          {/* ===== TRIP ===== */}
          <Section icon="map" label="Trip Details" color={C.blue} />
          <Card>
            <Field label="Trip type">
              <PickerBtn
                value={selectedTripType?.label}
                placeholder="Select trip type"
                leftIcon={selectedTripType?.icon}
                onPress={() => setShowTripTypeModal(true)}
                onClear={form.tripType ? () => update("tripType", "") : null}
              />
            </Field>
            {tours.length > 0 && (
              <Field label="Link to tour (optional)">
                <PickerBtn
                  value={selectedTour?.title}
                  placeholder="Select a tour package"
                  leftIcon="map"
                  onPress={() => setShowTourModal(true)}
                  onClear={form.tourId ? () => update("tourId", "") : null}
                />
              </Field>
            )}
            <Field label="Destination">
              <TextInput
                style={styles.input}
                placeholder="e.g. Manali, Goa"
                placeholderTextColor="#A3B3C2"
                value={form.destination}
                onChangeText={(v) => update("destination", v)}
              />
            </Field>
            <View style={styles.row2}>
              <Field label="Pickup" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="From"
                  placeholderTextColor="#A3B3C2"
                  value={form.pickupLocation}
                  onChangeText={(v) => update("pickupLocation", v)}
                />
              </Field>
              <Field label="Drop" style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="To"
                  placeholderTextColor="#A3B3C2"
                  value={form.dropLocation}
                  onChangeText={(v) => update("dropLocation", v)}
                />
              </Field>
            </View>
            <View style={styles.row2}>
              <Field label="Travel date" style={{ flex: 1 }}>
                <PickerBtn
                  value={formatDate(form.travelDate)}
                  placeholder="Pick date"
                  leftIcon="calendar"
                  onPress={() => setPickerType("travelDate")}
                  onClear={form.travelDate ? () => update("travelDate", null) : null}
                />
              </Field>
              <Field label="Return date" style={{ flex: 1 }}>
                <PickerBtn
                  value={formatDate(form.returnDate)}
                  placeholder="Pick date"
                  leftIcon="calendar"
                  onPress={() => setPickerType("returnDate")}
                  onClear={form.returnDate ? () => update("returnDate", null) : null}
                />
              </Field>
            </View>
            <Field label="Passengers">
              <TextInput
                style={styles.input}
                placeholder="Number of pax"
                placeholderTextColor="#A3B3C2"
                keyboardType="number-pad"
                value={form.passengers}
                onChangeText={(v) => update("passengers", v.replace(/\D/g, ""))}
              />
            </Field>
          </Card>

          {/* ===== LEAD DETAILS ===== */}
          <Section icon="information-circle" label="Lead Details" color={C.purple} />
          <Card>
            <Field label="Priority">
              <View style={styles.prioritySegRow}>
                {LEAD_PRIORITY.map((p) => {
                  const meta = PRIORITY_META[p];
                  const active = form.priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.prioritySeg,
                        active && { backgroundColor: meta.bg, borderColor: meta.fg },
                      ]}
                      onPress={() => update("priority", p)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={meta.icon} size={14} color={active ? meta.fg : C.subText} />
                      <Text
                        style={[
                          styles.prioritySegText,
                          active && { color: meta.fg, fontWeight: "bold" },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <Field label="Source">
              <PickerBtn
                value={SOURCE_LABELS[form.source] || form.source}
                placeholder="Source"
                leftIcon="git-network"
                onPress={() => setShowSourceModal(true)}
              />
            </Field>

            <Field label="Estimated value">
              <View style={styles.valueInputWrap}>
                <View style={styles.valuePrefix}>
                  <Text style={styles.valuePrefixText}>₹</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }]}
                  placeholder="e.g. 25000"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="number-pad"
                  value={form.estimatedValue}
                  onChangeText={(v) => update("estimatedValue", v.replace(/[^\d.]/g, ""))}
                />
              </View>
            </Field>

            <Field label="Quoted amount (optional)" >
              <View style={styles.valueInputWrap}>
                <View style={styles.valuePrefix}>
                  <Text style={styles.valuePrefixText}>₹</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }]}
                  placeholder="Final quoted price (if any)"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="number-pad"
                  value={form.quotedAmount}
                  onChangeText={(v) => update("quotedAmount", v.replace(/[^\d.]/g, ""))}
                />
              </View>
            </Field>

            <Field label="Requirement / notes">
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Any specific requirements, preferences…"
                placeholderTextColor="#A3B3C2"
                value={form.requirement}
                onChangeText={(v) => update("requirement", v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>

            <Field label="Assigned to (optional)">
              <TextInput
                style={styles.input}
                placeholder="Team member name"
                placeholderTextColor="#A3B3C2"
                value={form.assignedToName}
                onChangeText={(v) => update("assignedToName", v)}
              />
            </Field>

            <Field label="Next follow-up">
              <PickerBtn
                value={formatWhen(form.nextFollowUp)}
                placeholder="Schedule follow-up"
                leftIcon="alarm"
                onPress={() => setPickerType("nextFollowUp")}
                onClear={form.nextFollowUp ? () => update("nextFollowUp", null) : null}
              />
            </Field>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom save button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.saveBtnInner}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? "Save Changes" : "Save Lead"}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={!!pickerType}
        mode={pickerType === "nextFollowUp" ? "datetime" : "date"}
        date={pickerType && form[pickerType] ? new Date(form[pickerType]) : new Date()}
        onConfirm={onPickDate}
        onCancel={() => setPickerType(null)}
      />

      {/* Source modal */}
      <PickerModal
        visible={showSourceModal}
        title="Lead source"
        options={LEAD_SOURCE.map((s) => ({ value: s, label: SOURCE_LABELS[s] || s }))}
        selected={form.source}
        onClose={() => setShowSourceModal(false)}
        onSelect={(v) => { update("source", v); setShowSourceModal(false); }}
      />

      {/* Trip type modal — with icons */}
      <PickerModal
        visible={showTripTypeModal}
        title="Trip type"
        options={TRIP_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
        selected={form.tripType}
        onClose={() => setShowTripTypeModal(false)}
        onSelect={(v) => { update("tripType", v); setShowTripTypeModal(false); }}
      />

      {/* Tour picker modal */}
      <PickerModal
        visible={showTourModal}
        title="Link to tour"
        options={[
          { value: "", label: "— Not linked to a tour —", icon: "close-circle-outline" },
          ...tours.map((t) => ({ value: t.id, label: t.title, icon: "map" })),
        ]}
        selected={form.tourId}
        onClose={() => setShowTourModal(false)}
        onSelect={(v) => { update("tourId", v); setShowTourModal(false); }}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function Section({ icon, label, color }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function Field({ label, error, children, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function PickerBtn({ value, placeholder, leftIcon, onPress, onClear }) {
  return (
    <TouchableOpacity style={styles.pickerBtn} onPress={onPress} activeOpacity={0.7}>
      {leftIcon && <Ionicons name={leftIcon} size={15} color={value ? C.emerald600 : C.subText} />}
      <Text style={[styles.pickerText, !value && { color: "#A3B3C2" }]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      {onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={C.subText} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={16} color={C.subText} />
      )}
    </TouchableOpacity>
  );
}

function PickerModal({ visible, title, options, selected, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <SheetHandle />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalItem, active && styles.modalItemActive]}
                  onPress={() => onSelect(opt.value)}
                >
                  {opt.icon && (
                    <Ionicons name={opt.icon} size={16} color={active ? C.emerald600 : C.subText} />
                  )}
                  <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={C.emerald600} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -60, right: -40,
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -70, left: -50,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 6 },
  circleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: "bold", color: "#fff" },
  headerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "bold", marginTop: 2 },
  headerSaveBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, justifyContent: "center" },
  headerSaveText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 11.5 },

  scroll: { paddingTop: 8, paddingBottom: 24 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 18, marginBottom: 8 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", letterSpacing: 0.4, textTransform: "uppercase" },

  // Card grouping inputs
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  input: {
    fontFamily: DISPLAY,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },
  inputMultiline: { minHeight: 80, paddingTop: 10 },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 11.5, marginTop: 4, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 10 },

  // Phone with +91 prefix
  phoneInputWrap: { flexDirection: "row", alignItems: "stretch" },
  phonePrefix: { paddingHorizontal: 12, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  phonePrefixText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 14 },

  // Value with ₹ prefix
  valueInputWrap: { flexDirection: "row", alignItems: "stretch" },
  valuePrefix: { paddingHorizontal: 14, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  valuePrefixText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 16 },

  // Picker button
  pickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, height: 46,
  },
  pickerText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, fontWeight: "600" },

  // Priority segmented
  prioritySegRow: { flexDirection: "row", gap: 6 },
  prioritySeg: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 11, borderRadius: 10,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
  },
  prioritySegText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: "bold", color: C.subText },

  // Sticky save bar
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtnWrap: { borderRadius: 14, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  saveBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  saveBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15, letterSpacing: 0.3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, paddingBottom: 24, paddingTop: 8, paddingHorizontal: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink },
  modalItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10,
    marginBottom: 6, backgroundColor: "#FAFBFC",
  },
  modalItemActive: { backgroundColor: C.emerald50 },
  modalItemText: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.text, fontWeight: "600" },
  modalItemTextActive: { color: C.emerald700, fontWeight: "bold" },
});
