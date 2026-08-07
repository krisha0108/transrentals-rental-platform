// screens/travel-agent/fleet/FleetCalendarScreen.js
// REDESIGNED — emerald-themed fleet calendar/timeline. Shows ongoing +
// upcoming bookings grouped by lifecycle, with a polished "Block dates"
// bottom-sheet for marking a vehicle unavailable.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  StatusBar, Platform, Animated, Easing,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar } from "react-native-calendars";
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G, SHEET_RADIUS } from "../_shared/theme";
import {
  listFleetBookings,
  listTravelAgentFleet,
  createFleetBooking,
  updateFleetBooking,
  deleteFleetBooking,
} from "../../api/travelAgentClient";
import AnimatedOrb from "../_shared/AnimatedOrb";

// Booking-type chips for the create/edit form. Customer + Reserved capture a
// guest; Maintenance + Block just hold the dates.
// Warm Elevate tones (was #3B82F6 / #8B5CF6 / #EF4444 / #F59E0B).
const TYPE_OPTIONS = [
  { key: "CUSTOMER", label: "Customer", icon: "person", color: T.ocean },
  { key: "RESERVED", label: "Reserved", icon: "bookmark", color: T.plum },
  { key: "MAINTENANCE", label: "Maintenance", icon: "construct", color: T.red },
  { key: "MANUAL_BLOCK", label: "Block", icon: "lock-closed", color: T.gold },
];
const CAPTURES_CUSTOMER = (t) => t === "CUSTOMER" || t === "RESERVED";

// ── Premium warm palette (matches the Fleet list & Add Vehicle form) ──
// Local key names are kept so no JSX changes are needed — only the VALUES now
const GOLD = "#E4C066";
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

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
  COMPLETED: { bg: FILL, fg: "#475569" },
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
function localDateKey(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  // "List" keeps the original ongoing/upcoming/past grouping; "Month" is a
  // real calendar grid with prev/next navigation — mirrors the web's month
  // view, which the app never had (only ever had the list/timeline).
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'month'
  const todayKey = localDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);

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

  // One dot per booking-type present that day, colour-matched to TYPE_META —
  // simple multi-dot marking (not a lane-stacked bar like web) but a real
  // day-by-day picture with month navigation, which is what was missing.
  //
  // Date keys are built from local Y/M/D components, never `toISOString()`
  // — that serializes to UTC and silently shifts the day backward for any
  // timezone ahead of UTC (e.g. IST), which is exactly how this first
  // shipped broken: a booking starting Aug 6 09:00 UTC showed as Aug 5.
  const markedDates = useMemo(() => {
    const marks = {};
    for (const b of bookings) {
      const color = (TYPE_META[b.bookingType] || TYPE_META.CUSTOMER).color;
      let cur = new Date(b.startDate);
      cur.setHours(0, 0, 0, 0);
      const last = new Date(b.endDate);
      last.setHours(0, 0, 0, 0);
      let guard = 0;
      while (cur <= last && guard < 366) {
        const key = localDateKey(cur);
        const entry = marks[key] || { dots: [] };
        if (!entry.dots.some((d) => d.color === color)) entry.dots.push({ key: color, color });
        marks[key] = entry;
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
        guard += 1;
      }
    }
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: C.emerald600 };
    return marks;
  }, [bookings, selectedDate]);

  const selectedDayBookings = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    return bookings
      .filter((b) => new Date(b.startDate) <= dayEnd && new Date(b.endDate) >= dayStart)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [bookings, selectedDate]);

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
      <StatusBar barStyle="light-content" backgroundColor={T.forestDark} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 42 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>FLEET SCHEDULE</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>Fleet Calendar</Text>
              <View style={styles.headerBadgeRow}>
                <View style={styles.headerBadge}>
                  <Ionicons name="calendar-outline" size={10} color="#fff" />
                  <Text style={styles.headerBadgeText}>{bookings.length} bookings</Text>
                </View>
                <View style={styles.headerBadge}>
                  <Ionicons name="car-sport" size={10} color="#fff" />
                  <Text style={styles.headerBadgeText}>{vehicles.length} vehicles</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={openCreate}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={22} color={C.emerald700} />
            </TouchableOpacity>
          </View>

          {/* List / Month view toggle */}
          <View style={styles.viewToggle}>
            {[
              { key: "list", label: "List", icon: "list" },
              { key: "month", label: "Month", icon: "calendar" },
            ].map((v) => {
              const active = viewMode === v.key;
              return (
                <TouchableOpacity
                  key={v.key}
                  style={[styles.viewToggleBtn, active && styles.viewToggleBtnActive]}
                  onPress={() => setViewMode(v.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={v.icon} size={13} color={active ? C.emerald700 : "rgba(255,255,255,0.85)"} />
                  <Text style={[styles.viewToggleText, active && styles.viewToggleTextActive]}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
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
          {viewMode === "month" ? (
            <MonthView
              markedDates={markedDates}
              selectedDate={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              dayBookings={selectedDayBookings}
              onRefresh={load}
              onEdit={openEdit}
              onAdd={openCreate}
            />
          ) : bookings.length === 0 ? (
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

// Stacked cell (icon → value → label), each element centred on the cell's
// own axis. The previous row layout (icon beside text) centred the whole
// icon+text group per cell, so cells with wider labels ("Upcoming") pushed
// their icon further left than narrower ones ("Blocked") and nothing lined
// up across the three columns. Stacking guarantees the icons share one
// horizontal line, the values share another and the labels a third,
// regardless of how long a label is or how many digits a value has.
function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
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

// Real month grid — react-native-calendars gives prev/next navigation for
// free; each day gets a coloured dot per booking-type present, tapping a day
// lists that day's bookings below (reusing BookingRow so entries look and
// behave identically to the List view).
function MonthView({ markedDates, selectedDate, onDayPress, dayBookings, onRefresh, onEdit, onAdd }) {
  return (
    <View>
      <View style={styles.monthCalWrap}>
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          markingType="multi-dot"
          enableSwipeMonths
          theme={{
            backgroundColor: C.card,
            calendarBackground: C.card,
            textSectionTitleColor: C.subText,
            selectedDayBackgroundColor: C.emerald600,
            selectedDayTextColor: "#fff",
            todayTextColor: C.emerald600,
            dayTextColor: C.ink,
            textDisabledColor: "#D6D0C2",
            arrowColor: C.emerald600,
            monthTextColor: C.ink,
            textDayFontFamily: DISPLAY,
            textMonthFontFamily: DISPLAY,
            textDayHeaderFontFamily: DISPLAY,
            textMonthFontWeight: "bold",
            textDayFontWeight: "600",
          }}
          style={styles.monthCal}
        />
      </View>

      <View style={styles.monthDayHeader}>
        <Text style={styles.monthDayTitle}>
          {new Date(selectedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
        </Text>
        <TouchableOpacity style={styles.monthDayAddBtn} onPress={onAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={14} color={C.emerald700} />
          <Text style={styles.monthDayAddText}>Add</Text>
        </TouchableOpacity>
      </View>

      {dayBookings.length === 0 ? (
        <View style={styles.monthEmptyDay}>
          <Ionicons name="calendar-clear-outline" size={24} color={C.subText} />
          <Text style={styles.monthEmptyDayText}>No bookings on this day</Text>
        </View>
      ) : (
        dayBookings.map((b) => (
          <BookingRow key={b.id} booking={b} onRefresh={onRefresh} onEdit={onEdit} />
        ))
      )}
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
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: "90%" }]}>
          {/* Modal gradient header */}
          <LinearGradient
            colors={HEADER_GRAD}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.modalHeaderGrad}
          >
            <View style={styles.grabHandle} />
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
                  placeholderTextColor="#A99F8D"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <Text style={styles.modalLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#A99F8D"
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
                      placeholderTextColor="#A99F8D"
                      value={pickupLocation}
                      onChangeText={setPickupLocation}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Drop</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="To"
                      placeholderTextColor="#A99F8D"
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
                      placeholderTextColor="#A99F8D"
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
                      placeholderTextColor="#A99F8D"
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
                  <Text style={{ fontWeight: "bold" }}>{selectedVehicle.vehicleName}</Text>
                  {capturesCustomer ? " booked for " : " blocked for "}
                  <Text style={{ fontWeight: "bold" }}>{totalDays}d</Text> ·{" "}
                  {fmtShort(startDate)} → {fmtShort(endDate)}
                </Text>
              </View>
            )}

            <Text style={styles.modalLabel}>{capturesCustomer ? "Notes" : "Reason / notes"}</Text>
            <TextInput
              style={styles.input}
              placeholder={capturesCustomer ? "Anything else about this trip" : "e.g. Service visit, owner trip, repair"}
              placeholderTextColor="#A99F8D"
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
      </KeyboardAvoidingView>
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
  headerGrad: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: "hidden", position: "relative" },
  orbA: {
    position: "absolute", top: -44, right: -28,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(228,192,102,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -30, left: -34,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(23,166,124,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 14 },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitleBlock: { flex: 1, marginLeft: 12, marginRight: 10 },
  headerEyebrow: { fontFamily: DISPLAY, color: GOLD, fontSize: 10, fontWeight: "bold", letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 3 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: "#fff", letterSpacing: 0.2 },
  headerBadgeRow: { flexDirection: "row", gap: 6, marginTop: 7 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
  },
  headerBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 0.2 },
  viewToggle: {
    flexDirection: "row", gap: 6, marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 11, padding: 3, alignSelf: "flex-start",
  },
  viewToggleBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9,
  },
  viewToggleBtnActive: { backgroundColor: "#fff" },
  viewToggleText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: "rgba(255,255,255,0.85)" },
  viewToggleTextActive: { color: C.emerald700 },

  headerAddBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },

  // Floating stats card
  // `alignItems: stretch` lets every cell claim the card's full height, so the
  // dividers span the same distance and the three columns are exact thirds
  // (flex:1 each) instead of being spread by `space-around`.
  statsCard: {
    flexDirection: "row", alignItems: "stretch",
    backgroundColor: C.card, marginHorizontal: 26, marginTop: -24, zIndex: 2,
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  statCell: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 2 },
  statIcon: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  // includeFontPadding:false strips the extra leading Android adds around
  // text — the main reason the value/label pair used to sit optically high
  // inside the card. Explicit lineHeight + tabular figures keep the row from
  // shifting when a count goes 9 → 10.
  statValue: {
    fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold",
    lineHeight: 19, textAlign: "center",
    includeFontPadding: false, fontVariant: ["tabular-nums"],
  },
  // Uppercase removes the descenders ("Ongoing"/"Upcoming" have g/p, "Blocked"
  // has none), so all three labels present the same visual height and sit on
  // one clean line.
  statLabel: {
    fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold",
    lineHeight: 12, marginTop: 1, letterSpacing: 0.4,
    textAlign: "center", textTransform: "uppercase", includeFontPadding: false,
  },
  statDivider: { width: 1, height: 34, alignSelf: "center", backgroundColor: C.border },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: C.redLight, borderRadius: 10, borderWidth: 1, borderColor: "#F0CFC9" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  emptyState: { alignItems: "center", padding: 24, paddingTop: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center", paddingHorizontal: 16, lineHeight: 18 },
  emptyCta: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Month view
  monthCalWrap: {
    borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border,
    marginBottom: 16, backgroundColor: C.card,
  },
  monthCal: { borderRadius: 16 },
  monthDayHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  monthDayTitle: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink, flex: 1 },
  monthDayAddBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: `${C.emerald600}3D`,
  },
  monthDayAddText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.emerald700 },
  monthEmptyDay: {
    alignItems: "center", gap: 8, paddingVertical: 28,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  monthEmptyDayText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, fontWeight: "600" },

  // Group section
  groupBlock: { marginBottom: 18 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, marginBottom: 10 },
  groupHeaderIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  groupTitle: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", flex: 1, letterSpacing: 0.3 },
  groupCount: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, alignItems: "center" },
  groupCountText: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold" },

  // Booking row
  row: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#2A2216", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 2 },
    }),
  },
  rowStripe: { width: 5 },
  rowMain: { flex: 1, padding: 14 },

  rowTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 11 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  typeBadgeText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", letterSpacing: 0.3 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },

  rowVehicleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 11 },
  rowVehicle: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: C.ink, flex: 1, letterSpacing: 0.2 },
  regPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: FILL, borderWidth: 1, borderColor: C.border },
  regPillText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: C.text, letterSpacing: 0.6 },

  // Date bar (start → end visual) — premium
  dateBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: FILL, borderRadius: 13, paddingVertical: 11, paddingHorizontal: 8,
    marginBottom: 11, borderWidth: 1, borderColor: C.border,
  },
  dateBox: { alignItems: "center", paddingHorizontal: 6, minWidth: 62 },
  dateBoxLabel: { fontFamily: DISPLAY, fontSize: 8.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.6 },
  dateBoxValue: { fontFamily: DISPLAY, fontSize: 14.5, color: C.ink, fontWeight: "bold", marginTop: 2 },
  dateArrow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  dateLine: { flex: 1, height: 2, borderRadius: 1 },
  dateDaysBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1.5 },
  dateDaysText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold" },

  rowMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  rowMetaText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", flexShrink: 1 },
  rowMetaDot: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "bold" },

  notesBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    marginTop: 10, padding: 10, backgroundColor: FILL, borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  notesText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.text, fontStyle: "italic", flex: 1, lineHeight: 16 },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 24,
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  grabHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.38)", alignSelf: "center", marginBottom: 12 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: "bold", color: "#fff" },
  modalSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  modalLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 8, marginTop: 14 },
  // Booking-type / status chips
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: FILL,
  },
  typeChipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", letterSpacing: 0.2 },
  modalEmptyHint: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, backgroundColor: C.amberLight, borderRadius: 10 },
  modalEmptyHintText: { fontFamily: DISPLAY, fontSize: 12, color: "#A16207", fontWeight: "600", flex: 1 },

  vehicleRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: FILL,
    marginBottom: 6,
  },
  vehicleRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  vehName: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink },
  vehSub: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 2, fontWeight: "600" },

  row2: { flexDirection: "row", gap: 10 },
  dateField: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: FILL, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, height: 46,
  },
  dateFieldText: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, fontWeight: "bold" },
  dateFieldPlaceholder: { color: "#A99F8D", fontWeight: "600" },

  previewCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald600,
  },
  previewText: { fontFamily: DISPLAY, flex: 1, fontSize: 12.5, color: C.emerald700, fontWeight: "600", lineHeight: 17 },

  input: {
    fontFamily: DISPLAY,
    backgroundColor: FILL, borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.ink, minHeight: 46,
  },

  publishBtnWrap: {
    marginTop: 18, borderRadius: 12, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  publishBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  publishBtnText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14.5 },
});
