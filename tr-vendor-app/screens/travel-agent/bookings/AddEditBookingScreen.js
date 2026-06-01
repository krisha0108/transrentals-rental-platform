// screens/travel-agent/bookings/AddEditBookingScreen.js
// REDESIGNED — emerald-themed Add/Edit Booking form.
//
// Visual type selector (gradient tiles), customer/trip/stay/pricing sections
// with color accents, payment progress preview, status pills, sticky save.
//
// POST /api/travel-agent/bookings or PATCH /api/travel-agent/bookings/[id]
import React, { useMemo, useState } from "react";
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
  Alert,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  createTravelAgentBooking,
  updateTravelAgentBooking,
  listTravelAgentTours,
  listTravelAgentProperties,
  BOOKING_TYPE,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
} from "../../api/travelAgentClient";

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
  purple: "#8B5CF6",
  green: "#10B981",
  greenLight: "#D1FAE5",
};

const TYPE_META = {
  TOUR:      { icon: "map",       label: "Tour",      desc: "Tour package",      gradient: [C.purple, "#6D28D9"], color: "#6D28D9" },
  PROPERTY:  { icon: "bed",       label: "Property",  desc: "Hotel / resort",    gradient: [C.amber, "#D97706"],  color: "#A16207" },
  TRANSPORT: { icon: "car",       label: "Transport", desc: "Vehicle / cab",     gradient: [C.blue, "#1D4ED8"],   color: "#1D4ED8" },
  CUSTOM:    { icon: "construct", label: "Custom",    desc: "Anything else",     gradient: ["#EC4899", "#9D174D"], color: "#9D174D" },
};

const PAYMENT_META = {
  PENDING:  { fg: "#A16207", bg: C.amberLight, icon: "hourglass" },
  PARTIAL:  { fg: "#4338CA", bg: "#E0E7FF",    icon: "card" },
  PAID:     { fg: "#15803D", bg: C.greenLight, icon: "checkmark-circle" },
  REFUNDED: { fg: "#B91C1C", bg: "#FEE2E2",    icon: "return-up-back" },
};

const STATUS_META = {
  DRAFT:            { fg: "#475569", bg: "#F1F5F9" },
  PENDING_CUSTOMER: { fg: "#A16207", bg: C.amberLight },
  CONFIRMED:        { fg: "#1D4ED8", bg: "#DBEAFE" },
  IN_PROGRESS:      { fg: "#4338CA", bg: "#E0E7FF" },
  COMPLETED:        { fg: "#15803D", bg: C.greenLight },
  CANCELLED:        { fg: "#B91C1C", bg: "#FEE2E2" },
};

function isoOrNull(v) { try { return v ? new Date(v).toISOString() : null; } catch { return null; } }
function formatDate(iso) { try { return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""; } catch { return ""; } }
const INR = (n) => n == null || isNaN(Number(n)) ? "₹0" : `₹${Number(n).toLocaleString("en-IN")}`;

export default function AddEditBookingScreen({ navigation, route }) {
  const existing = route?.params?.booking || null;
  const isEdit = !!existing?.id;

  const [form, setForm] = useState(() => ({
    bookingType: existing?.bookingType || "TOUR",
    customerName: existing?.customerName || "",
    customerPhone: existing?.customerPhone || "",
    customerEmail: existing?.customerEmail || "",
    referenceTitle: existing?.referenceTitle || "",
    referenceId: existing?.referenceId || "",
    pickupLocation: existing?.pickupLocation || "",
    dropLocation: existing?.dropLocation || "",
    travelDate: existing?.travelDate || null,
    returnDate: existing?.returnDate || null,
    checkInDate: existing?.checkInDate || null,
    checkOutDate: existing?.checkOutDate || null,
    passengers: existing?.passengers ? String(existing.passengers) : "",
    rooms: existing?.rooms ? String(existing.rooms) : "",
    totalAmount: existing?.totalAmount ? String(existing.totalAmount) : "",
    paidAmount: existing?.paidAmount ? String(existing.paidAmount) : "",
    paymentStatus: existing?.paymentStatus || "PENDING",
    status: existing?.status || "DRAFT",
    notes: existing?.notes || "",
  }));
  const [saving, setSaving] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  // E5 — reference (tour/property) picker
  const [showRefModal, setShowRefModal] = useState(false);
  const [refOptions, setRefOptions] = useState([]);
  const [refLoading, setRefLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openRefPicker = async () => {
    setShowRefModal(true);
    setRefLoading(true);
    try {
      if (form.bookingType === "PROPERTY") {
        const d = await listTravelAgentProperties({});
        const list = d?.properties || d?.items || (Array.isArray(d) ? d : []);
        setRefOptions(list.map((p) => ({ id: p.id, title: p.name, sub: [p.propertyType, p.city].filter(Boolean).join(" · ") })));
      } else {
        const d = await listTravelAgentTours({});
        const list = d?.tours || d?.items || (Array.isArray(d) ? d : []);
        setRefOptions(list.map((t) => ({ id: t.id, title: t.title, sub: [t.destination, t.durationDays ? `${t.durationDays}D` : null].filter(Boolean).join(" · ") })));
      }
    } catch {
      setRefOptions([]);
    } finally {
      setRefLoading(false);
    }
  };

  const isPhoneValid = useMemo(
    () => /^[6-9]\d{9}$/.test((form.customerPhone || "").replace(/\D/g, "")),
    [form.customerPhone]
  );
  const canSave = form.customerName.trim().length >= 2 && isPhoneValid && !saving;

  const isProperty = form.bookingType === "PROPERTY";
  const tm = TYPE_META[form.bookingType] || TYPE_META.CUSTOM;

  // Payment progress preview
  const totalNum = Number(form.totalAmount || 0);
  const paidNum = Number(form.paidAmount || 0);
  const balanceNum = Math.max(0, totalNum - paidNum);
  const paidPct = totalNum > 0 ? Math.min(100, Math.round((paidNum / totalNum) * 100)) : 0;

  const save = async () => {
    if (!form.customerName.trim()) return Alert.alert("Required", "Customer name is required.");
    if (!isPhoneValid) return Alert.alert("Invalid phone", "Enter a valid 10-digit phone number.");

    const payload = {
      bookingType: form.bookingType,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.replace(/\D/g, "").slice(-10),
      customerEmail: form.customerEmail.trim() || null,
      referenceTitle: form.referenceTitle.trim() || null,
      referenceId: form.referenceId.trim() || null,
      pickupLocation: form.pickupLocation.trim() || null,
      dropLocation: form.dropLocation.trim() || null,
      travelDate: isoOrNull(form.travelDate),
      returnDate: isoOrNull(form.returnDate),
      checkInDate: isoOrNull(form.checkInDate),
      checkOutDate: isoOrNull(form.checkOutDate),
      passengers: form.passengers ? Number(form.passengers) : null,
      rooms: form.rooms ? Number(form.rooms) : null,
      totalAmount: totalNum,
      paidAmount: paidNum,
      paymentStatus: form.paymentStatus,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    try {
      setSaving(true);
      if (isEdit) await updateTravelAgentBooking(existing.id, payload);
      else await createTravelAgentBooking(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
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
              <Text style={styles.headerTitle}>{isEdit ? "Edit Booking" : "Add Booking"}</Text>
              <Text style={styles.headerSub}>
                {isEdit ? `Update ${existing?.bookingNumber || ""}` : "Create a customer booking"}
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
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ===== Booking type selector (4 colorful tiles) ===== */}
          <Section icon="layers" label="Booking Type" color={C.emerald600} />
          <View style={styles.typeGrid}>
            {BOOKING_TYPE.map((t) => {
              const meta = TYPE_META[t];
              const active = form.bookingType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={styles.typeTileWrap}
                  onPress={() => update("bookingType", t)}
                  activeOpacity={0.85}
                >
                  {active ? (
                    <LinearGradient
                      colors={meta.gradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.typeTileActive}
                    >
                      <View style={styles.typeIconActive}>
                        <Ionicons name={meta.icon} size={20} color="#fff" />
                      </View>
                      <Text style={styles.typeLabelActive}>{meta.label}</Text>
                      <Text style={styles.typeDescActive}>{meta.desc}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.typeTile}>
                      <View style={[styles.typeIcon, { backgroundColor: `${meta.color}22` }]}>
                        <Ionicons name={meta.icon} size={18} color={meta.color} />
                      </View>
                      <Text style={styles.typeLabel}>{meta.label}</Text>
                      <Text style={styles.typeDesc}>{meta.desc}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ===== Customer ===== */}
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
              <View style={styles.prefixInputWrap}>
                <View style={styles.prefixBox}><Text style={styles.prefixText}>+91</Text></View>
                <TextInput
                  style={[styles.input, styles.prefixInput]}
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

          {/* ===== Reference ===== */}
          <Section icon="bookmark" label="Reference" color={tm.color} />
          <Card>
            {(form.bookingType === "TOUR" || form.bookingType === "PROPERTY") && (
              <TouchableOpacity style={styles.refPickBtn} onPress={openRefPicker} activeOpacity={0.85}>
                <Ionicons name="list" size={15} color={tm.color} />
                <Text style={[styles.refPickText, { color: tm.color }]}>
                  Choose from your {form.bookingType === "PROPERTY" ? "properties" : "tours"}
                </Text>
                {!!form.referenceId && <Ionicons name="checkmark-circle" size={16} color={C.emerald600} />}
              </TouchableOpacity>
            )}
            <Field label={`${tm.label} name / package title`}>
              <TextInput
                style={styles.input}
                placeholder={
                  isProperty ? "e.g. Hilltop Resort - Manali" :
                  form.bookingType === "TOUR" ? "e.g. Manali 4N5D Honeymoon Package" :
                  form.bookingType === "TRANSPORT" ? "e.g. Innova Crysta - Mumbai to Pune" :
                  "e.g. Custom package"
                }
                placeholderTextColor="#A3B3C2"
                value={form.referenceTitle}
                onChangeText={(v) => { update("referenceTitle", v); if (form.referenceId) update("referenceId", ""); }}
              />
            </Field>
            {!!form.referenceId && (
              <Text style={styles.refLinkedNote}>✓ Linked to a saved {form.bookingType === "PROPERTY" ? "property" : "tour"}.</Text>
            )}
          </Card>

          {/* ===== Dates ===== */}
          <Section icon={isProperty ? "bed" : "calendar"} label={isProperty ? "Stay Details" : "Trip Details"} color={C.blue} />
          <Card>
            {isProperty ? (
              <>
                <View style={styles.row2}>
                  <Field label="Check-in" style={{ flex: 1 }}>
                    <DateBtn
                      value={formatDate(form.checkInDate)}
                      onPress={() => setPickerType("checkInDate")}
                      onClear={form.checkInDate ? () => update("checkInDate", null) : null}
                    />
                  </Field>
                  <Field label="Check-out" style={{ flex: 1 }}>
                    <DateBtn
                      value={formatDate(form.checkOutDate)}
                      onPress={() => setPickerType("checkOutDate")}
                      onClear={form.checkOutDate ? () => update("checkOutDate", null) : null}
                    />
                  </Field>
                </View>
                <View style={styles.row2}>
                  <Field label="Guests" style={{ flex: 1 }}>
                    <NumberInput
                      value={form.passengers}
                      placeholder="e.g. 4"
                      onChange={(v) => update("passengers", v)}
                      icon="people"
                    />
                  </Field>
                  <Field label="Rooms" style={{ flex: 1 }}>
                    <NumberInput
                      value={form.rooms}
                      placeholder="e.g. 2"
                      onChange={(v) => update("rooms", v)}
                      icon="bed"
                    />
                  </Field>
                </View>
              </>
            ) : (
              <>
                <View style={styles.row2}>
                  <Field label="Travel date" style={{ flex: 1 }}>
                    <DateBtn
                      value={formatDate(form.travelDate)}
                      onPress={() => setPickerType("travelDate")}
                      onClear={form.travelDate ? () => update("travelDate", null) : null}
                    />
                  </Field>
                  <Field label="Return date" style={{ flex: 1 }}>
                    <DateBtn
                      value={formatDate(form.returnDate)}
                      onPress={() => setPickerType("returnDate")}
                      onClear={form.returnDate ? () => update("returnDate", null) : null}
                    />
                  </Field>
                </View>
                <Field label="Pickup">
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: C.emerald50 }]}>
                      <Ionicons name="navigate" size={14} color={C.emerald600} />
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                      placeholder="Pickup location"
                      placeholderTextColor="#A3B3C2"
                      value={form.pickupLocation}
                      onChangeText={(v) => update("pickupLocation", v)}
                    />
                  </View>
                </Field>
                <Field label="Drop">
                  <View style={styles.iconInputWrap}>
                    <View style={[styles.iconInputIcon, { backgroundColor: "#FEE2E2" }]}>
                      <Ionicons name="flag" size={14} color={C.red} />
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                      placeholder="Drop location"
                      placeholderTextColor="#A3B3C2"
                      value={form.dropLocation}
                      onChangeText={(v) => update("dropLocation", v)}
                    />
                  </View>
                </Field>
                <Field label="Passengers">
                  <NumberInput
                    value={form.passengers}
                    placeholder="e.g. 4"
                    onChange={(v) => update("passengers", v)}
                    icon="people"
                  />
                </Field>
              </>
            )}
          </Card>

          {/* ===== Pricing ===== */}
          <Section icon="cash" label="Pricing" color={C.emerald600} />
          <Card>
            <View style={styles.row2}>
              <Field label="Total amount" style={{ flex: 1 }}>
                <View style={styles.prefixInputWrap}>
                  <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                  <TextInput
                    style={[styles.input, styles.prefixInput]}
                    placeholder="25000"
                    placeholderTextColor="#A3B3C2"
                    keyboardType="number-pad"
                    value={form.totalAmount}
                    onChangeText={(v) => update("totalAmount", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </Field>
              <Field label="Paid" style={{ flex: 1 }}>
                <View style={styles.prefixInputWrap}>
                  <View style={styles.prefixBox}><Text style={styles.prefixText}>₹</Text></View>
                  <TextInput
                    style={[styles.input, styles.prefixInput]}
                    placeholder="5000"
                    placeholderTextColor="#A3B3C2"
                    keyboardType="number-pad"
                    value={form.paidAmount}
                    onChangeText={(v) => update("paidAmount", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </Field>
            </View>

            {/* Live payment preview */}
            {totalNum > 0 && (
              <View style={styles.paymentPreview}>
                <View style={styles.paymentPreviewRow}>
                  <Text style={styles.paymentPreviewLabel}>{INR(paidNum)} of {INR(totalNum)} received</Text>
                  <Text style={[styles.paymentPreviewPct, { color: paidPct === 100 ? C.emerald600 : C.amber }]}>
                    {paidPct}%
                  </Text>
                </View>
                <View style={styles.previewTrack}>
                  <LinearGradient
                    colors={paidPct === 100 ? [C.emerald500, C.emerald600] : [C.amber, "#D97706"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.previewFill, { width: `${paidPct}%` }]}
                  />
                </View>
                {balanceNum > 0 && (
                  <Text style={styles.paymentPreviewBalance}>Balance due: {INR(balanceNum)}</Text>
                )}
              </View>
            )}

            <Field label="Payment status">
              <View style={styles.statusChipsRow}>
                {BOOKING_PAYMENT_STATUS.map((s) => {
                  const meta = PAYMENT_META[s];
                  const active = form.paymentStatus === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusChip,
                        active && { backgroundColor: meta.bg, borderColor: meta.fg },
                      ]}
                      onPress={() => update("paymentStatus", s)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={meta.icon} size={11} color={active ? meta.fg : C.subText} />
                      <Text style={[
                        styles.statusChipText,
                        active && { color: meta.fg, fontWeight: "800" },
                      ]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          </Card>

          {/* ===== Status ===== */}
          <Section icon="flag" label="Booking Status" color={C.amber} />
          <Card>
            <View style={styles.statusChipsRow}>
              {BOOKING_STATUS.map((s) => {
                const meta = STATUS_META[s];
                const active = form.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      active && { backgroundColor: meta.bg, borderColor: meta.fg },
                    ]}
                    onPress={() => update("status", s)}
                    activeOpacity={0.85}
                  >
                    <Text style={[
                      styles.statusChipText,
                      active && { color: meta.fg, fontWeight: "800" },
                    ]}>{s.replace("_", " ")}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* ===== Notes ===== */}
          <Section icon="document-text" label="Notes" color={C.purple} />
          <Card>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Internal notes about this booking…"
              placeholderTextColor="#A3B3C2"
              value={form.notes}
              onChangeText={(v) => update("notes", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom save */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.saveBtnInner}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? "Save Changes" : "Create Booking"}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={!!pickerType}
        mode="date"
        date={pickerType && form[pickerType] ? new Date(form[pickerType]) : new Date()}
        onConfirm={(d) => { if (pickerType) update(pickerType, d.toISOString()); setPickerType(null); }}
        onCancel={() => setPickerType(null)}
      />

      {/* E5 — Reference picker modal */}
      <Modal visible={showRefModal} animationType="slide" transparent onRequestClose={() => setShowRefModal(false)}>
        <View style={styles.refModalOverlay}>
          <View style={styles.refModalSheet}>
            <View style={styles.refModalHeader}>
              <Text style={styles.refModalTitle}>
                Select a {form.bookingType === "PROPERTY" ? "property" : "tour"}
              </Text>
              <TouchableOpacity onPress={() => setShowRefModal(false)}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
            </View>
            {refLoading ? (
              <ActivityIndicator size="large" color={C.emerald600} style={{ marginVertical: 30 }} />
            ) : refOptions.length === 0 ? (
              <Text style={styles.refEmpty}>
                No {form.bookingType === "PROPERTY" ? "properties" : "tours"} yet — type the name manually instead.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {refOptions.map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    style={styles.refRow}
                    onPress={() => {
                      update("referenceId", o.id);
                      update("referenceTitle", o.title);
                      setShowRefModal(false);
                    }}
                  >
                    <Ionicons name={form.bookingType === "PROPERTY" ? "business" : "map"} size={16} color={C.emerald600} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.refRowTitle} numberOfLines={1}>{o.title || "Untitled"}</Text>
                      {!!o.sub && <Text style={styles.refRowSub} numberOfLines={1}>{o.sub}</Text>}
                    </View>
                    {form.referenceId === o.id && <Ionicons name="checkmark-circle" size={18} color={C.emerald600} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

function DateBtn({ value, onPress, onClear }) {
  return (
    <TouchableOpacity style={styles.pickerBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="calendar" size={15} color={value ? C.emerald600 : C.subText} />
      <Text style={[styles.pickerText, !value && { color: "#A3B3C2" }]} numberOfLines={1}>
        {value || "Pick date"}
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

function NumberInput({ value, placeholder, onChange, icon }) {
  return (
    <View style={styles.iconInputWrap}>
      <View style={[styles.iconInputIcon, { backgroundColor: C.blueLight }]}>
        <Ionicons name={icon} size={14} color={C.blue} />
      </View>
      <TextInput
        style={[styles.input, { flex: 1, borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
        placeholder={placeholder}
        placeholderTextColor="#A3B3C2"
        keyboardType="number-pad"
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ""))}
      />
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerSaveBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: "center" },
  headerSaveText: { color: C.emerald700, fontWeight: "800", fontSize: 13 },

  scroll: { paddingTop: 8, paddingBottom: 24 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 18, marginBottom: 8 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },

  // Card
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },

  // Type tile grid (2x2)
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16 },
  typeTileWrap: { width: "48.5%" },
  typeTile: {
    padding: 14, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  typeTileActive: {
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  typeIconActive: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  typeLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
  typeLabelActive: { fontSize: 14, fontWeight: "800", color: "#fff" },
  typeDesc: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },
  typeDescActive: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },

  // Field
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 6 },
  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },
  errorText: { color: C.red, fontSize: 11.5, marginTop: 4, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 10 },

  // Reference picker (E5)
  refPickBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC", marginBottom: 12 },
  refPickText: { flex: 1, fontSize: 13, fontWeight: "800" },
  refLinkedNote: { fontSize: 11.5, color: C.emerald600, fontWeight: "700", marginTop: 4 },
  refModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  refModalSheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, paddingTop: 16, paddingHorizontal: 16 },
  refModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  refModalTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  refEmpty: { fontSize: 13, color: C.subText, textAlign: "center", marginVertical: 24, paddingHorizontal: 20, lineHeight: 19 },
  refRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6, backgroundColor: "#F8FAFC" },
  refRowTitle: { fontSize: 14, color: C.ink, fontWeight: "800" },
  refRowSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },

  // Prefix input
  prefixInputWrap: { flexDirection: "row", alignItems: "stretch" },
  prefixBox: { paddingHorizontal: 12, justifyContent: "center", backgroundColor: C.emerald50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },
  prefixText: { color: C.emerald700, fontWeight: "800", fontSize: 14 },
  prefixInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },

  // Icon-prefixed input
  iconInputWrap: { flexDirection: "row", alignItems: "stretch" },
  iconInputIcon: { width: 44, justifyContent: "center", alignItems: "center", borderTopLeftRadius: 10, borderBottomLeftRadius: 10, borderWidth: 1, borderRightWidth: 0, borderColor: C.border },

  // Picker button
  pickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, height: 46,
  },
  pickerText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: "600" },

  // Payment preview
  paymentPreview: { marginTop: 4, marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0" },
  paymentPreviewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  paymentPreviewLabel: { fontSize: 11.5, color: C.emerald700, fontWeight: "700" },
  paymentPreviewPct: { fontSize: 14, fontWeight: "900" },
  previewTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 3, overflow: "hidden" },
  previewFill: { height: "100%", borderRadius: 3 },
  paymentPreviewBalance: { fontSize: 11, color: C.subText, fontWeight: "700", marginTop: 6 },

  // Status chips (payment + booking)
  statusChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
  },
  statusChipText: { fontSize: 11.5, color: C.subText, fontWeight: "700" },

  // Sticky bottom
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtnWrap: { borderRadius: 14, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  saveBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
