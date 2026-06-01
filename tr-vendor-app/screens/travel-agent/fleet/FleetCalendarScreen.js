// screens/travel-agent/fleet/FleetCalendarScreen.js
// REDESIGNED — emerald-themed fleet calendar/timeline. Shows ongoing +
// upcoming bookings grouped by lifecycle, with a polished "Block dates"
// bottom-sheet for marking a vehicle unavailable.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  StatusBar, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  listFleetBookings,
  listTravelAgentFleet,
  createFleetBooking,
  updateFleetBooking,
  deleteFleetBooking,
} from "../../api/travelAgentClient";

// Booking-type chips for the create/edit form. Customer + Reserved capture a
// guest; Maintenance + Block just hold the dates.
const TYPE_OPTIONS = [
  { key: "CUSTOMER", label: "Customer", icon: "person", color: "#3B82F6" },
  { key: "RESERVED", label: "Reserved", icon: "bookmark", color: "#8B5CF6" },
  { key: "MAINTENANCE", label: "Maintenance", icon: "construct", color: "#EF4444" },
  { key: "MANUAL_BLOCK", label: "Block", icon: "lock-closed", color: "#F59E0B" },
];
const CAPTURES_CUSTOMER = (t) => t === "CUSTOMER" || t === "RESERVED";

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
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
};

// Per booking-type colour + icon so each row's left stripe / pill is instantly recognisable.
const TYPE_META = {
  CUSTOMER:     { color: C.blue,       icon: "person",    label: "Customer" },
  MANUAL_BLOCK: { color: C.amber,      icon: "lock-closed", label: "Blocked" },
  MAINTENANCE:  { color: C.red,        icon: "construct", label: "Maintenance" },
  RESERVED:     { color: C.purple,     icon: "bookmark",  label: "Reserved" },
};
const STATUS_COLORS = {
  CONFIRMED: { bg: "#DCFCE7", fg: "#15803D" },
  TENTATIVE: { bg: C.amberLight, fg: "#A16207" },
  COMPLETED: { bg: "#F1F5F9", fg: "#475569" },
  CANCELLED: { bg: C.redLight, fg: "#B91C1C" },
};

function fmtFull(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
}
function fmtShort(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); }
  catch { return ""; }
}
function daysBetween(a, b) {
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
}
function dayDelta(iso) {
  const d = new Date(iso); const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

export default function FleetCalendarScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // null = closed; { mode: 'create' } = new; { mode: 'edit', booking } = edit
  const [editor, setEditor] = useState(null);
  const openCreate = () => setEditor({ mode: "create" });
  const openEdit = (booking) => setEditor({ mode: "edit", booking });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [bRes, vRes] = await Promise.all([
        listFleetBookings({}),
        listTravelAgentFleet({}),
      ]);
      setBookings(bRes.bookings || []);
      setVehicles(vRes.fleets || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  // Group bookings into ongoing/upcoming/past lifecycle buckets.
  const groups = useMemo(() => {
    const now = Date.now();
    const ongoing = []; const upcoming = []; const past = [];
    for (const b of bookings) {
      const s = new Date(b.startDate).getTime();
      const e = new Date(b.endDate).getTime();
      if (e < now) past.push(b);
      else if (s <= now && now <= e) ongoing.push(b);
      else upcoming.push(b);
    }
    ongoing.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    return { ongoing, upcoming, past };
  }, [bookings]);

  // Stats for the floating card.
  const stats = useMemo(() => {
    const blocked = bookings.filter(
      (b) => b.bookingType === "MANUAL_BLOCK" || b.bookingType === "MAINTENANCE"
    ).length;
    return {
      ongoing: groups.ongoing.length,
      upcoming: groups.upcoming.length,
      blocked,
    };
  }, [bookings, groups]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 28 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Fleet Calendar</Text>
              <Text style={styles.headerSub}>
                {bookings.length} bookings · {vehicles.length} vehicles
              </Text>
            </View>
            <TouchableOpacity
              style={styles.blockBtn}
              onPress={openCreate}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={15} color={C.emerald700} />
              <Text style={styles.blockBtnText}>Add Booking / Block</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell value={stats.ongoing} label="Ongoing" icon="play-circle" color={C.emerald600} />
        <View style={styles.statDivider} />
        <StatCell value={stats.upcoming} label="Upcoming" icon="calendar" color={C.blue} />
        <View style={styles.statDivider} />
        <StatCell value={stats.blocked} label="Blocked" icon="lock-closed" color={C.amber} />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-clear-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>No active bookings</Text>
              <Text style={styles.emptyBody}>
                Block dates manually for service/personal use, or wait for customer bookings to fill your calendar.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={openCreate}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.emerald600, C.emerald700]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.emptyCtaText}>Add booking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {groups.ongoing.length > 0 && (
                <Group
                  title="Ongoing"
                  color={C.emerald600}
                  icon="play-circle"
                  items={groups.ongoing}
                  onRefresh={load}
                  onEdit={openEdit}
                />
              )}
              {groups.upcoming.length > 0 && (
                <Group
                  title="Upcoming"
                  color={C.blue}
                  icon="calendar"
                  items={groups.upcoming}
                  onRefresh={load}
                  onEdit={openEdit}
                />
              )}
              {groups.past.length > 0 && (
                <Group
                  title="Recently completed"
                  color={C.subText}
                  icon="checkmark-done"
                  items={groups.past.slice(0, 10)}
                  onRefresh={load}
                  onEdit={openEdit}
                  muted
                />
              )}
            </>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ===== FAB (new booking) ===== */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[C.emerald500, C.emerald700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BookingFormModal
        editor={editor}
        vehicles={vehicles}
        onClose={() => setEditor(null)}
        onSaved={() => { setEditor(null); load(); }}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Group({ title, color, icon, items, onRefresh, onEdit, muted }) {
  return (
    <View style={styles.groupBlock}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupHeaderIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <Text style={[styles.groupTitle, { color }]}>{title}</Text>
        <View style={[styles.groupCount, { backgroundColor: color }]}>
          <Text style={styles.groupCountText}>{items.length}</Text>
        </View>
      </View>
      {items.map((b) => (
        <BookingRow key={b.id} booking={b} onRefresh={onRefresh} onEdit={onEdit} muted={muted} />
      ))}
    </View>
  );
}

function BookingRow({ booking, onRefresh, onEdit, muted }) {
  const typeMeta = TYPE_META[booking.bookingType] || TYPE_META.CUSTOMER;
  const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.CONFIRMED;
  const isBlock = booking.bookingType === "MANUAL_BLOCK" || booking.bookingType === "MAINTENANCE";
  const startDelta = dayDelta(booking.startDate);
  const endDelta = dayDelta(booking.endDate);
  const totalDays = daysBetween(booking.startDate, booking.endDate);

  // Human-readable timing label.
  let timing = "";
  if (startDelta > 0) timing = `in ${startDelta}d`;
  else if (endDelta >= 0) timing = endDelta === 0 ? "ends today" : `${endDelta}d remaining`;
  else timing = `${Math.abs(endDelta)}d ago`;

  const onDelete = () => {
    Alert.alert(
      isBlock ? "Remove block?" : "Remove booking?",
      "This will free up the dates.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try { await deleteFleetBooking(booking.id); onRefresh(); }
            catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.row, muted && { opacity: 0.75 }]}
      activeOpacity={0.85}
      onPress={() => onEdit?.(booking)}
    >
      {/* Left color stripe = booking type */}
      <View style={[styles.rowStripe, { backgroundColor: typeMeta.color }]} />

      <View style={styles.rowMain}>
        {/* Top row: type pill + status pill + delete */}
        <View style={styles.rowTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeMeta.color}1A` }]}>
            <Ionicons name={typeMeta.icon} size={11} color={typeMeta.color} />
            <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>
              {typeMeta.label}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.fg }]}>{booking.status}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => onEdit?.(booking)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="create-outline" size={18} color={C.emerald700} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={C.subText} />
          </TouchableOpacity>
        </View>

        {/* Vehicle */}
        <View style={styles.rowVehicleRow}>
          <Ionicons name="car-sport" size={14} color={C.emerald700} />
          <Text style={styles.rowVehicle} numberOfLines={1}>
            {booking.vehicleName || booking.fleet?.vehicleName || "Vehicle"}
          </Text>
          {booking.registrationNumber && (
            <View style={styles.regPill}>
              <Text style={styles.regPillText} numberOfLines={1}>
                {booking.registrationNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Date bar — start → end with day count + timing */}
        <View style={styles.dateBar}>
          <View style={styles.dateBox}>
            <Text style={styles.dateBoxLabel}>FROM</Text>
            <Text style={styles.dateBoxValue}>{fmtShort(booking.startDate)}</Text>
          </View>
          <View style={styles.dateArrow}>
            <View style={[styles.dateLine, { backgroundColor: typeMeta.color }]} />
            <View style={[styles.dateDaysBadge, { backgroundColor: `${typeMeta.color}1A`, borderColor: typeMeta.color }]}>
              <Text style={[styles.dateDaysText, { color: typeMeta.color }]}>
                {totalDays}d
              </Text>
            </View>
            <View style={[styles.dateLine, { backgroundColor: typeMeta.color }]} />
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.dateBoxLabel}>TO</Text>
            <Text style={styles.dateBoxValue}>{fmtShort(booking.endDate)}</Text>
          </View>
        </View>

        {/* Timing line */}
        <View style={styles.rowMeta}>
          <Ionicons name="time-outline" size={11} color={C.subText} />
          <Text style={styles.rowMetaText}>{timing}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{fmtFull(booking.startDate)} → {fmtFull(booking.endDate)}</Text>
        </View>

        {/* Customer (if any) */}
        {!!booking.customerName && (
          <View style={styles.rowMeta}>
            <Ionicons name="person" size={11} color={C.blue} />
            <Text style={styles.rowMetaText} numberOfLines={1}>{booking.customerName}</Text>
            {!!booking.customerPhone && (
              <>
                <Text style={styles.rowMetaDot}>·</Text>
                <Text style={styles.rowMetaText}>{booking.customerPhone}</Text>
              </>
            )}
          </View>
        )}

        {/* Notes */}
        {!!booking.notes && (
          <View style={styles.notesBox}>
            <Ionicons name="document-text-outline" size={11} color={C.subText} />
            <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BookingFormModal({ editor, vehicles, onClose, onSaved }) {
  const visible = !!editor;
  const isEdit = editor?.mode === "edit";
  const existing = editor?.booking || null;

  const [fleetId, setFleetId] = useState(null);
  const [bookingType, setBookingType] = useState("CUSTOMER");
  const [status, setStatus] = useState("CONFIRMED");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [bookingRefId, setBookingRefId] = useState("");
  const [notes, setNotes] = useState("");
  const [pickerType, setPickerType] = useState(null);
  const [saving, setSaving] = useState(false);

  // Prefill from the booking being edited, or reset to defaults for a new one.
  useEffect(() => {
    if (!visible) return;
    if (isEdit && existing) {
      setFleetId(existing.fleetId || null);
      setBookingType(existing.bookingType || "CUSTOMER");
      setStatus(existing.status || "CONFIRMED");
      setStartDate(existing.startDate ? new Date(existing.startDate).toISOString() : null);
      setEndDate(existing.endDate ? new Date(existing.endDate).toISOString() : null);
      setCustomerName(existing.customerName || "");
      setCustomerPhone(existing.customerPhone || "");
      setPickupLocation(existing.pickupLocation || "");
      setDropLocation(existing.dropLocation || "");
      setAmount(existing.amount != null ? String(existing.amount) : "");
      setBookingRefId(existing.bookingRefId || "");
      setNotes(existing.notes || "");
    } else {
      setFleetId(null);
      setBookingType("CUSTOMER");
      setStatus("CONFIRMED");
      setStartDate(null);
      setEndDate(null);
      setCustomerName("");
      setCustomerPhone("");
      setPickupLocation("");
      setDropLocation("");
      setAmount("");
      setBookingRefId("");
      setNotes("");
    }
  }, [visible, isEdit, existing?.id]);

  const close = () => { onClose(); };

  const selectedVehicle = vehicles.find((v) => v.id === fleetId);
  const totalDays = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const capturesCustomer = CAPTURES_CUSTOMER(bookingType);

  const submit = async () => {
    if (!fleetId) return Alert.alert("Required", "Pick a vehicle.");
    if (!startDate || !endDate) return Alert.alert("Required", "Pick start and end dates.");
    if (new Date(endDate) < new Date(startDate)) return Alert.alert("Invalid", "End date must be on or after start date.");
    if (capturesCustomer && !customerName.trim()) return Alert.alert("Required", "Customer name is required for this booking type.");
    const payload = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      bookingType,
      status,
      customerName: capturesCustomer ? (customerName.trim() || null) : null,
      customerPhone: capturesCustomer ? (customerPhone.trim() || null) : null,
      pickupLocation: capturesCustomer ? (pickupLocation.trim() || null) : null,
      dropLocation: capturesCustomer ? (dropLocation.trim() || null) : null,
      amount: capturesCustomer && amount !== "" ? Number(amount) : null,
      bookingRefId: capturesCustomer ? (bookingRefId.trim() || null) : null,
      notes: notes.trim() || null,
    };
    try {
      setSaving(true);
      if (isEdit) {
        // fleetId is immutable on the backend PATCH, so it's not sent here.
        await updateFleetBooking(existing.id, payload);
      } else {
        await createFleetBooking({ fleetId, ...payload });
      }
      onSaved();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed (maybe overlapping booking)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: "90%" }]}>
          {/* Modal gradient header */}
          <LinearGradient
            colors={["#022C22", "#064E3B", "#047857"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name={isEdit ? "create" : "calendar"} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{isEdit ? "Edit calendar entry" : "Add to fleet calendar"}</Text>
                <Text style={styles.modalSub}>{isEdit ? "Update vehicle booking details" : "Customer, reservation, service or block"}</Text>
              </View>
              <TouchableOpacity onPress={close} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ padding: 16 }}>
            {/* Booking type selector */}
            <Text style={[styles.modalLabel, { marginTop: 0 }]}>Type *</Text>
            <View style={styles.typeChips}>
              {TYPE_OPTIONS.map((t) => {
                const active = bookingType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeChip, active && { backgroundColor: `${t.color}1A`, borderColor: t.color }]}
                    onPress={() => setBookingType(t.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={t.icon} size={13} color={active ? t.color : C.subText} />
                    <Text style={[styles.typeChipText, { color: active ? t.color : C.subText }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vehicle selector */}
            <Text style={styles.modalLabel}>Vehicle *</Text>
            {isEdit ? (
              <View style={[styles.vehicleRow, { borderColor: C.emerald600, backgroundColor: C.emerald50 }]}>
                <Ionicons name="car-sport" size={16} color={C.emerald700} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vehName} numberOfLines={1}>{selectedVehicle?.vehicleName || existing?.vehicleName || "Vehicle"}</Text>
                  <Text style={styles.vehSub} numberOfLines={1}>Vehicle can't be changed when editing</Text>
                </View>
              </View>
            ) : vehicles.length === 0 ? (
              <View style={styles.modalEmptyHint}>
                <Ionicons name="information-circle" size={14} color={C.amber} />
                <Text style={styles.modalEmptyHintText}>Add a vehicle first to create a booking.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {vehicles.map((v) => {
                  const active = fleetId === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.vehicleRow,
                        active && { backgroundColor: C.emerald50, borderColor: C.emerald600 },
                      ]}
                      onPress={() => setFleetId(v.id)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.vehicleRadio,
                          active && { backgroundColor: C.emerald600, borderColor: C.emerald600 },
                        ]}
                      >
                        {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.vehName} numberOfLines={1}>{v.vehicleName}</Text>
                        <Text style={styles.vehSub} numberOfLines={1}>
                          {(v.vehicleType || "").replace("_", " ")}
                          {v.registrationNumber ? `  ·  ${v.registrationNumber}` : ""}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={18} color={C.emerald600} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Date range pickers */}
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Start *</Text>
                <TouchableOpacity
                  style={[styles.dateField, startDate && { borderColor: C.emerald600 }]}
                  onPress={() => setPickerType("start")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar" size={15} color={startDate ? C.emerald600 : C.subText} />
                  <Text style={[styles.dateFieldText, !startDate && styles.dateFieldPlaceholder]}>
                    {startDate ? fmtFull(startDate) : "Pick start"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>End *</Text>
                <TouchableOpacity
                  style={[styles.dateField, endDate && { borderColor: C.emerald600 }]}
                  onPress={() => setPickerType("end")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar" size={15} color={endDate ? C.emerald600 : C.subText} />
                  <Text style={[styles.dateFieldText, !endDate && styles.dateFieldPlaceholder]}>
                    {endDate ? fmtFull(endDate) : "Pick end"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status (tentative allows overlap on the backend; cancelled is a
                soft-cancel — frees the dates but keeps the record, unlike Delete) */}
            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.typeChips}>
              {["CONFIRMED", "TENTATIVE", "COMPLETED", "CANCELLED"].map((s) => {
                const active = status === s;
                const isCancel = s === "CANCELLED";
                const activeBg = isCancel ? C.redLight : C.emerald50;
                const activeBorder = isCancel ? C.red : C.emerald600;
                const activeFg = isCancel ? C.red : C.emerald700;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.typeChip, active && { backgroundColor: activeBg, borderColor: activeBorder }]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.typeChipText, { color: active ? activeFg : C.subText }]}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Customer fields (only for customer / reserved bookings) */}
            {capturesCustomer && (
              <>
                <Text style={styles.modalLabel}>Customer name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rohan Sharma"
                  placeholderTextColor="#A3B3C2"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <Text style={styles.modalLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#A3B3C2"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Pickup</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="From"
                      placeholderTextColor="#A3B3C2"
                      value={pickupLocation}
                      onChangeText={setPickupLocation}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Drop</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="To"
                      placeholderTextColor="#A3B3C2"
                      value={dropLocation}
                      onChangeText={setDropLocation}
                    />
                  </View>
                </View>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Amount (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#A3B3C2"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Reference</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Booking ref"
                      placeholderTextColor="#A3B3C2"
                      value={bookingRefId}
                      onChangeText={setBookingRefId}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Live preview */}
            {selectedVehicle && startDate && endDate && (
              <View style={styles.previewCard}>
                <Ionicons name="information-circle" size={16} color={C.emerald700} />
                <Text style={styles.previewText}>
                  <Text style={{ fontWeight: "800" }}>{selectedVehicle.vehicleName}</Text>
                  {capturesCustomer ? " booked for " : " blocked for "}
                  <Text style={{ fontWeight: "800" }}>{totalDays}d</Text> ·{" "}
                  {fmtShort(startDate)} → {fmtShort(endDate)}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>{capturesCustomer ? "Notes" : "Reason / notes"}</Text>
            <TextInput
              style={styles.input}
              placeholder={capturesCustomer ? "Anything else about this trip" : "e.g. Service visit, owner trip, repair"}
              placeholderTextColor="#A3B3C2"
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              style={[styles.publishBtnWrap, saving && { opacity: 0.6 }]}
              onPress={submit}
              disabled={saving}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[C.emerald600, C.emerald700]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.publishBtnInner}
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name={isEdit ? "checkmark" : "add"} size={18} color="#fff" />
                    <Text style={styles.publishBtnText}>{isEdit ? "Save changes" : "Add to calendar"}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      <DateTimePickerModal
        isVisible={!!pickerType}
        mode="date"
        date={
          pickerType === "start" && startDate ? new Date(startDate) :
          pickerType === "end" && endDate ? new Date(endDate) : new Date()
        }
        onConfirm={(d) => {
          if (pickerType === "start") setStartDate(d.toISOString());
          else if (pickerType === "end") setEndDate(d.toISOString());
          setPickerType(null);
        }}
        onCancel={() => setPickerType(null)}
      />
    </Modal>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  blockBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#fff",
  },
  blockBtnText: { color: C.emerald700, fontWeight: "800", fontSize: 12 },

  // Floating stats card
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 10.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  emptyState: { alignItems: "center", padding: 24, paddingTop: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center", paddingHorizontal: 16, lineHeight: 18 },
  emptyCta: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Group section
  groupBlock: { marginBottom: 18 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, marginBottom: 10 },
  groupHeaderIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  groupTitle: { fontSize: 13.5, fontWeight: "800", flex: 1, letterSpacing: 0.3 },
  groupCount: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, alignItems: "center" },
  groupCountText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Booking row
  row: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  rowStripe: { width: 4 },
  rowMain: { flex: 1, padding: 12 },

  rowTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  rowVehicleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  rowVehicle: { fontSize: 14, fontWeight: "800", color: C.ink, flex: 1 },
  regPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#F1F5F9" },
  regPillText: { fontSize: 10, fontWeight: "800", color: C.text, letterSpacing: 0.5 },

  // Date bar (start → end visual)
  dateBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FAFBFC", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  dateBox: { alignItems: "center", paddingHorizontal: 6, minWidth: 60 },
  dateBoxLabel: { fontSize: 9, color: C.subText, fontWeight: "800", letterSpacing: 0.5 },
  dateBoxValue: { fontSize: 13, color: C.ink, fontWeight: "800", marginTop: 1 },
  dateArrow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  dateLine: { flex: 1, height: 2, borderRadius: 1 },
  dateDaysBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  dateDaysText: { fontSize: 10, fontWeight: "800" },

  rowMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  rowMetaText: { fontSize: 11.5, color: C.subText, fontWeight: "600", flexShrink: 1 },
  rowMetaDot: { fontSize: 11, color: C.subText, fontWeight: "800" },

  notesBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 5,
    marginTop: 8, padding: 8, backgroundColor: "#F8FAFC", borderRadius: 8,
  },
  notesText: { fontSize: 11.5, color: C.text, fontStyle: "italic", flex: 1, lineHeight: 16 },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  modalSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  modalLabel: { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 8, marginTop: 14 },
  // Booking-type / status chips
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC",
  },
  typeChipText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },
  modalEmptyHint: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, backgroundColor: C.amberLight, borderRadius: 10 },
  modalEmptyHintText: { fontSize: 12, color: "#A16207", fontWeight: "600", flex: 1 },

  vehicleRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC",
    marginBottom: 6,
  },
  vehicleRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  vehName: { fontSize: 13.5, fontWeight: "800", color: C.ink },
  vehSub: { fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 10 },
  dateField: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FAFBFC", borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  dateFieldText: { flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "700" },
  dateFieldPlaceholder: { color: "#A3B3C2", fontWeight: "600" },

  previewCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald600,
  },
  previewText: { flex: 1, fontSize: 12.5, color: C.emerald700, fontWeight: "600", lineHeight: 17 },

  input: {
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },

  publishBtnWrap: {
    marginTop: 18, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  publishBtnText: { color: "#fff", fontWeight: "800", fontSize: 14.5 },
});
