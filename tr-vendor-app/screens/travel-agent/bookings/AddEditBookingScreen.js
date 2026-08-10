// screens/travel-agent/bookings/AddEditBookingScreen.js
// REDESIGNED (UI only) — clean card-section Add/Edit Booking form matching the
// reference: light header, section cards (icon + title + subtitle), inline-icon
// inputs, a green payment card (total / advance / balance), segmented status
// controls and a Cancel + Create Booking bottom bar.
//
// UI ONLY — every piece of state, validation, field binding and the save /
// reference-picker logic is byte-for-byte the same as before.
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
import { DISPLAY } from "../_shared/typography";
import {
  createTravelAgentBooking,
  updateTravelAgentBooking,
  listTravelAgentTours,
  listTravelAgentProperties,
  BOOKING_TYPE,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
} from "../../api/travelAgentClient";
import { SC as C, SHEET_RADIUS } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
import SheetHandle from "../_shared/SheetHandle";


const TYPE_META = {
  TOUR:      { icon: "airplane",  label: "Tour",      desc: "Group & packages",       color: C.purple, light: "#EFE9F5", gradient: [C.purple, "#5B3E7E"] },
  PROPERTY:  { icon: "bed",       label: "Property",  desc: "Villa · Hotel · Stay",   color: "#8A6420", light: "#F6EEDB", gradient: [C.gold, "#8A6420"] },
  TRANSPORT: { icon: "car",       label: "Transport", desc: "Cab · Fleet",            color: C.blue, light: "#E9F1F8", gradient: [C.blue, "#1E4E86"] },
  CUSTOM:    { icon: "sparkles",  label: "Custom",    desc: "Bespoke itinerary",      color: "#B0567A", light: "#F7E9EF", gradient: ["#B0567A", "#7E3A54"] },
};

const PAYMENT_META = {
  PENDING:  { fg: "#8A6420",      bg: C.amberLight, icon: "hourglass" },
  PARTIAL:  { fg: "#1E4E86",      bg: C.blueLight,  icon: "card" },
  PAID:     { fg: C.emerald700,   bg: C.greenLight, icon: "checkmark-circle" },
  REFUNDED: { fg: "#9E362E",      bg: C.redLight,   icon: "return-up-back" },
};

const STATUS_META = {
  DRAFT:            { fg: C.subText, bg: C.tintSand },
  PENDING_CUSTOMER: { fg: "#8A6420", bg: C.amberLight },
  CONFIRMED:        { fg: "#1E4E86", bg: C.blueLight },
  IN_PROGRESS:      { fg: "#5B3E7E", bg: C.purpleLight },
  COMPLETED:        { fg: C.emerald700, bg: C.greenLight },
  CANCELLED:        { fg: "#9E362E", bg: C.redLight },
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
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ===== Green header ===== */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        {/* Drifting orbs — this was the one Travel Agent header without them. */}
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backCircle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>{isEdit ? "Edit Booking" : "Add Booking"}</Text>
              <Text style={styles.headerSub}>Create a new booking for your customer.</Text>
            </View>
            <TouchableOpacity
              style={[styles.savePill, !canSave && { opacity: 0.5 }]}
              onPress={save}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={C.emerald700} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={15} color={C.emerald700} />
                  <Text style={styles.savePillText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ===== Booking Type (no card behind the tiles) ===== */}
          <View style={styles.bareHeader}>
            <View style={styles.sectionCardIcon}>
              <Ionicons name="pricetags" size={16} color={C.emerald600} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.sectionCardTitle}>Booking Type</Text>
              <Text style={styles.sectionCardSub}>
                {isEdit ? "Type can't be changed after creation" : "Choose booking category"}
              </Text>
            </View>
          </View>
          <View style={[styles.typeGridBare, isEdit && { opacity: 0.55 }]}>
              {BOOKING_TYPE.map((t) => {
                const meta = TYPE_META[t] || TYPE_META.CUSTOM;
                const active = form.bookingType === t;
                const inner = (
                  <>
                    <View style={styles.typeTileTop}>
                      <View style={[styles.typeTileIcon, { backgroundColor: active ? meta.color : meta.light }]}>
                        <Ionicons name={meta.icon} size={17} color={active ? "#fff" : meta.color} />
                      </View>
                      {active && (
                        <View style={[styles.typeTileCheck, { backgroundColor: meta.color }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.typeTileLabel, active && { color: meta.color }]} numberOfLines={1}>{meta.label}</Text>
                    <Text style={[styles.typeTileDesc, active && { color: meta.color, opacity: 0.72 }]} numberOfLines={1}>{meta.desc}</Text>
                  </>
                );
                return (
                  <TouchableOpacity
                    key={t}
                    style={styles.typeTileWrap}
                    onPress={() => update("bookingType", t)}
                    disabled={isEdit}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.typeTile, active ? { backgroundColor: meta.light, borderWidth: 1.5, borderColor: meta.color } : styles.typeTileUnsel]}>
                      {inner}
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>

          {/* ===== Customer ===== */}
          <SectionCard icon="person" title="Customer" subtitle="Customer information">
            <IconInput
              icon="person-outline"
              placeholder="Full Name"
              value={form.customerName}
              onChangeText={(v) => update("customerName", v)}
            />
            <View style={styles.phoneRow}>
              <View style={styles.ccBox}>
                <Text style={styles.ccText}>IN +91</Text>
              </View>
              <IconInput
                icon="call-outline"
                placeholder="Phone Number"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.customerPhone}
                onChangeText={(v) => update("customerPhone", v.replace(/\D/g, ""))}
                wrapStyle={{ flex: 1 }}
              />
            </View>
            {form.customerPhone && !isPhoneValid ? (
              <Text style={styles.errText}>Enter a valid 10-digit phone</Text>
            ) : null}
            <IconInput
              icon="mail-outline"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.customerEmail}
              onChangeText={(v) => update("customerEmail", v)}
            />
          </SectionCard>

          {/* ===== Reference ===== */}
          <SectionCard icon="bookmark" title="Reference" subtitle="Tour or package details">
            {(form.bookingType === "TOUR" || form.bookingType === "PROPERTY") && (
              <TouchableOpacity style={styles.dropdownField} onPress={openRefPicker} activeOpacity={0.8}>
                <Ionicons name="search-outline" size={17} color={C.subText} style={{ marginRight: 8 }} />
                <Text style={[styles.dropdownText, !form.referenceId && { color: "#A99F8D" }]} numberOfLines={1}>
                  {form.referenceId ? form.referenceTitle : `Choose from ${form.bookingType === "PROPERTY" ? "Properties" : "Tours"}`}
                </Text>
                {!!form.referenceId && <Ionicons name="checkmark-circle" size={16} color={C.emerald600} style={{ marginRight: 4 }} />}
                <Ionicons name="chevron-down" size={16} color={C.subText} />
              </TouchableOpacity>
            )}
            <IconInput
              icon={isProperty ? "bed-outline" : form.bookingType === "TRANSPORT" ? "car-outline" : "airplane-outline"}
              placeholder={
                isProperty ? "Property name" :
                form.bookingType === "TOUR" ? "Tour name / package title" :
                form.bookingType === "TRANSPORT" ? "Vehicle / route" :
                "Package title"
              }
              value={form.referenceTitle}
              onChangeText={(v) => { update("referenceTitle", v); if (form.referenceId) update("referenceId", ""); }}
            />
            {!!form.referenceId && (
              <Text style={styles.linkedNote}>✓ Linked to a saved {isProperty ? "property" : "tour"}.</Text>
            )}
          </SectionCard>

          {/* ===== Trip / Stay Details ===== */}
          <SectionCard
            icon={isProperty ? "bed" : "calendar"}
            title={isProperty ? "Stay Details" : "Trip Details"}
            subtitle="Travel schedule"
          >
            <View style={styles.dateRow}>
              <DateBtn
                value={formatDate(isProperty ? form.checkInDate : form.travelDate)}
                placeholder={isProperty ? "CHECK-IN" : "TRAVEL"}
                onPress={() => setPickerType(isProperty ? "checkInDate" : "travelDate")}
                onClear={(isProperty ? form.checkInDate : form.travelDate) ? () => update(isProperty ? "checkInDate" : "travelDate", null) : null}
              />
              <DateBtn
                value={formatDate(isProperty ? form.checkOutDate : form.returnDate)}
                placeholder={isProperty ? "CHECK-OUT" : "RETURN"}
                onPress={() => setPickerType(isProperty ? "checkOutDate" : "returnDate")}
                onClear={(isProperty ? form.checkOutDate : form.returnDate) ? () => update(isProperty ? "checkOutDate" : "returnDate", null) : null}
              />
            </View>

            {isProperty ? (
              <>
                <Stepper icon="people" label="Guests" value={form.passengers} onChange={(v) => update("passengers", v)} />
                <Stepper icon="bed" label="Rooms" value={form.rooms} onChange={(v) => update("rooms", v)} />
              </>
            ) : (
              <>
                <View style={styles.locField}>
                  <View style={styles.locDot} />
                  <TextInput
                    style={styles.locInput}
                    placeholder="Pickup Location"
                    placeholderTextColor="#A99F8D"
                    value={form.pickupLocation}
                    onChangeText={(v) => update("pickupLocation", v)}
                  />
                </View>
                <View style={styles.locField}>
                  <Ionicons name="location" size={17} color={C.red} />
                  <TextInput
                    style={styles.locInput}
                    placeholder="Drop Location"
                    placeholderTextColor="#A99F8D"
                    value={form.dropLocation}
                    onChangeText={(v) => update("dropLocation", v)}
                  />
                </View>
                <Stepper icon="people" label="Passengers" value={form.passengers} onChange={(v) => update("passengers", v)} />
              </>
            )}
          </SectionCard>

          {/* ===== Payment ===== */}
          <SectionCard icon="wallet" title="Payment" subtitle="Booking amount">
            {/* Total amount — prominent light field */}
            <Text style={styles.payLabel}>Total Amount</Text>
            <View style={styles.amtBig}>
              <Text style={styles.amtBigRupee}>₹</Text>
              <TextInput
                style={styles.amtBigInput}
                placeholder="0"
                placeholderTextColor="#B3AA98"
                keyboardType="number-pad"
                value={form.totalAmount}
                onChangeText={(v) => update("totalAmount", v.replace(/[^\d.]/g, ""))}
              />
              <View style={styles.inrTag}><Text style={styles.inrTagText}>INR</Text></View>
            </View>

            {/* Advance + Balance */}
            <View style={styles.payRow2}>
              <View style={styles.advField}>
                <Text style={styles.payLabelSm}>ADVANCE PAID</Text>
                <View style={styles.advInputRow}>
                  <Text style={styles.advRupee}>₹</Text>
                  <TextInput
                    style={styles.advInput}
                    placeholder="0"
                    placeholderTextColor="#B3AA98"
                    keyboardType="number-pad"
                    value={form.paidAmount}
                    onChangeText={(v) => update("paidAmount", v.replace(/[^\d.]/g, ""))}
                  />
                </View>
              </View>
              <View style={styles.balField}>
                <Text style={styles.balLabel}>BALANCE DUE</Text>
                <Text style={styles.balValue} numberOfLines={1}>{INR(balanceNum)}</Text>
              </View>
            </View>

            {totalNum > 0 && (
              <View style={styles.payProgRow}>
                <View style={styles.payProgTrack}>
                  <View style={[styles.payProgFill, { width: `${paidPct}%` }]} />
                </View>
                <Text style={styles.payProgText}>{paidPct}% paid</Text>
              </View>
            )}

            <Text style={styles.miniLabel}>PAYMENT STATUS</Text>
            <View style={styles.payPillWrap}>
              {BOOKING_PAYMENT_STATUS.map((s) => {
                const meta = PAYMENT_META[s] || PAYMENT_META.PENDING;
                const active = form.paymentStatus === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.payPill, active && { backgroundColor: meta.bg, borderColor: meta.fg }]}
                    onPress={() => update("paymentStatus", s)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={meta.icon} size={13} color={active ? meta.fg : C.subText} />
                    <Text style={[styles.payPillText, active && { color: meta.fg }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ===== Booking status ===== */}
          <SectionCard icon="flag" title="Booking Status" subtitle="Current stage">
            <View style={styles.pillWrap}>
              {BOOKING_STATUS.map((s) => {
                const meta = STATUS_META[s] || STATUS_META.DRAFT;
                const active = form.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusPill, active && { backgroundColor: meta.bg, borderColor: meta.fg }]}
                    onPress={() => update("status", s)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.statusPillText, active && { color: meta.fg, fontWeight: "bold" }]}>{s.replace("_", " ")}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ===== Notes ===== */}
          <SectionCard icon="document-text" title="Notes" subtitle="Additional information">
            <TextInput
              style={styles.notesInput}
              placeholder="Internal notes about this booking…"
              placeholderTextColor="#A99F8D"
              value={form.notes}
              onChangeText={(v) => update("notes", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </SectionCard>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Bottom bar: Cancel + Create Booking ===== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createBtnWrap, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.createBtn}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={17} color="#fff" />
                <Text style={styles.createBtnText}>{isEdit ? "Save Changes" : "Create Booking"}</Text>
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
            <SheetHandle />
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

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionCardIcon}>
          <Ionicons name={icon} size={16} color={C.emerald600} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionCardTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.sectionCardSub}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
}

function IconInput({ icon, wrapStyle, ...props }) {
  return (
    <View style={[styles.iconField, wrapStyle]}>
      <Ionicons name={icon} size={17} color={C.subText} style={{ marginRight: 9 }} />
      <TextInput style={styles.iconFieldInput} placeholderTextColor="#A99F8D" {...props} />
    </View>
  );
}

function DateBtn({ value, placeholder, onPress, onClear }) {
  return (
    <TouchableOpacity style={[styles.dateBtn, value && styles.dateBtnFilled]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dateIcon, value && styles.dateIconFilled]}>
        <Ionicons name="calendar" size={15} color={value ? "#fff" : C.emerald600} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.dateCaption} numberOfLines={1}>{placeholder || "Date"}</Text>
        <Text style={[styles.dateValue, !value && { color: "#A99F8D", fontWeight: "600" }]} numberOfLines={1}>
          {value || "Select"}
        </Text>
      </View>
      {onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={16} color={C.subText} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={15} color={C.subText} />
      )}
    </TouchableOpacity>
  );
}

// Number stepper — writes to the same field; keeps "" (→ null on save) at 0.
function Stepper({ icon, label, value, onChange }) {
  const n = Number(value) || 0;
  const dec = () => { const v = Math.max(0, n - 1); onChange(v === 0 ? "" : String(v)); };
  const inc = () => onChange(String(n + 1));
  return (
    <View style={styles.stepperField}>
      <View style={styles.stepperIcon}>
        <Ionicons name={icon} size={16} color={C.emerald600} />
      </View>
      <Text style={styles.stepperLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={dec} activeOpacity={0.7}>
          <Ionicons name="remove" size={18} color={n > 0 ? C.emerald700 : "#C0B7A5"} />
        </TouchableOpacity>
        <Text style={styles.stepCount}>{n}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={inc} activeOpacity={0.7}>
          <Ionicons name="add" size={18} color={C.emerald700} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  // ── Green header ──
  headerGrad: {
    paddingBottom: 14,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  // Same two orbs as the sibling booking screens, so the header reads as part
  // of the same set rather than a flatter version of it.
  orbA: {
    position: "absolute", top: -50, right: -30,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -60, left: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 6 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 0.2 },
  headerSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: "600", marginTop: 2 },
  savePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F4F0E7", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999,
  },
  savePillText: { fontFamily: DISPLAY, color: C.emerald700, fontWeight: "bold", fontSize: 13 },

  scroll: { paddingTop: 6, paddingBottom: 24 },

  // ── Section card ──
  sectionCard: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 14 },
  sectionCardIcon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: C.emerald50,
    alignItems: "center", justifyContent: "center",
  },
  sectionCardTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink },
  sectionCardSub: { fontFamily: DISPLAY, fontSize: 12, color: C.subText, fontWeight: "600", marginTop: 1 },

  // ── Type grid (2×2) ──
  bareHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginHorizontal: 16, marginTop: 14, marginBottom: 12 },
  typeGridBare: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginHorizontal: 16, marginBottom: 4 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  typeTileWrap: { width: "47.5%", flexGrow: 1, borderRadius: 18 },
  typeTile: {
    borderRadius: 18, padding: 13, minHeight: 98, justifyContent: "space-between",
    shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  typeTileUnsel: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.border },
  typeTileTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 9 },
  typeTileIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  typeTileCheck: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  typeTileLabel: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: C.ink },
  typeTileDesc: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 3 },

  // ── Inputs ──
  iconField: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.field, borderRadius: 14,
    paddingHorizontal: 14, minHeight: 52, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  iconFieldInput: { fontFamily: DISPLAY, flex: 1, fontSize: 14.5, color: C.ink, paddingVertical: 0, fontWeight: "600" },
  errText: { fontFamily: DISPLAY, color: C.red, fontSize: 11.5, marginTop: -6, marginBottom: 10, marginLeft: 4, fontWeight: "600" },

  phoneRow: { flexDirection: "row", gap: 10 },
  ccBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 14, minHeight: 52,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  ccText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },

  dropdownField: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 14, minHeight: 52,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  dropdownText: { fontFamily: DISPLAY, flex: 1, fontSize: 14.5, color: C.ink, fontWeight: "600" },
  linkedNote: { fontFamily: DISPLAY, fontSize: 11.5, color: C.emerald600, fontWeight: "bold", marginTop: -4, marginLeft: 4 },

  // ── Dates + locations ──
  dateRow: { flexDirection: "row", gap: 10 },
  dateBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, minHeight: 56,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  dateBtnFilled: { backgroundColor: C.emerald50, borderColor: "#C6DACE" },
  dateIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  dateIconFilled: { backgroundColor: C.emerald600 },
  dateCaption: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold", letterSpacing: 0.2 },
  dateValue: { fontFamily: DISPLAY, fontSize: 13.5, color: C.ink, fontWeight: "bold", marginTop: 1 },

  // Passenger / count stepper
  stepperField: {
    flexDirection: "row", alignItems: "center", gap: 11,
    backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, minHeight: 56,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  stepperIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  stepperLabel: { fontFamily: DISPLAY, flex: 1, fontSize: 14.5, color: C.ink, fontWeight: "bold" },
  stepper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 11, borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  stepBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  stepCount: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: C.ink, minWidth: 30, textAlign: "center" },

  locField: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 14, minHeight: 52,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  locDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.emerald500, borderWidth: 3, borderColor: "#CDE1D6" },
  locInput: { fontFamily: DISPLAY, flex: 1, fontSize: 14.5, color: C.ink, paddingVertical: 0, fontWeight: "600" },

  // ── Payment (clean light) ──
  payLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 7 },
  payLabelSm: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", color: C.subText, letterSpacing: 0.6 },
  amtBig: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.emerald50, borderRadius: 16, paddingHorizontal: 15, minHeight: 62,
    borderWidth: 1.5, borderColor: "#C6DACE", marginBottom: 12,
  },
  amtBigRupee: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: C.emerald600 },
  amtBigInput: { fontFamily: DISPLAY, flex: 1, fontSize: 27, fontWeight: "bold", color: C.ink, padding: 0, letterSpacing: -0.4 },
  inrTag: { backgroundColor: "#FFFFFF", paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: "#C6DACE" },
  inrTagText: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: C.emerald700, letterSpacing: 0.4 },
  payRow2: { flexDirection: "row", gap: 10, marginBottom: 12 },
  advField: { flex: 1, backgroundColor: C.field, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  advInputRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  advRupee: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.subText },
  advInput: { fontFamily: DISPLAY, flex: 1, fontSize: 18, fontWeight: "bold", color: C.ink, padding: 0 },
  balField: { flex: 1, backgroundColor: C.emerald50, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: "#C6DACE", justifyContent: "center" },
  balLabel: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", color: C.emerald700, letterSpacing: 0.6 },
  balValue: { fontFamily: DISPLAY, fontSize: 18, fontWeight: "bold", color: C.emerald700, marginTop: 3 },
  payProgRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  payProgTrack: { flex: 1, height: 6, backgroundColor: "#EDE7DA", borderRadius: 3, overflow: "hidden" },
  payProgFill: { height: "100%", borderRadius: 3, backgroundColor: C.emerald500 },
  payProgText: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: C.emerald600 },

  // ── Payment status pills ──
  miniLabel: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.subText, letterSpacing: 1, marginBottom: 10 },
  payPillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  payPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: C.field, borderWidth: 1, borderColor: C.border,
  },
  payPillText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.subText },
  segBtnTextActive: { color: "#fff" },

  // ── Booking status pills ──
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  statusPill: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.field, borderWidth: 1, borderColor: C.border,
  },
  statusPillText: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: C.subText },

  // ── Notes ──
  notesInput: {
    fontFamily: DISPLAY, backgroundColor: C.field, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 14, fontSize: 14.5, color: C.ink,
    minHeight: 96, fontWeight: "600",
  },

  // ── Reference picker modal ──
  refModalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: "flex-end" },
  refModalSheet: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, paddingBottom: 24, paddingTop: 16, paddingHorizontal: 16 },
  refModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  refModalTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink },
  refEmpty: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, textAlign: "center", marginVertical: 24, paddingHorizontal: 20, lineHeight: 19 },
  refRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6, backgroundColor: C.field },
  refRowTitle: { fontFamily: DISPLAY, fontSize: 14, color: C.ink, fontWeight: "bold" },
  refRowSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: "row", gap: 10, alignItems: "center",
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 26 : 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  cancelBtn: {
    paddingHorizontal: 22, paddingVertical: 15, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.ink },
  createBtnWrap: { flex: 1, borderRadius: 16, overflow: "hidden" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  createBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15, letterSpacing: 0.3 },
});
