// screens/travel-agent/bookings/BookingsListScreen.js
// REDESIGNED — emerald-themed Bookings inbox with gradient header, embedded
// search, pill filters with counts, type sub-bar, mini stats banner, and
// visually rich booking cards.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import {
  listTravelAgentBookings,
  getBaseURL,
  BOOKING_STATUS,
  BOOKING_TYPE,
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
  green: "#10B981",
  greenLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  indigo: "#6366F1",
  indigoLight: "#E0E7FF",
};

const STATUS_COLORS = {
  DRAFT:            { bg: "#F1F5F9", fg: "#475569" },
  PENDING_CUSTOMER: { bg: "#FEF3C7", fg: "#A16207" },
  CONFIRMED:        { bg: "#DBEAFE", fg: "#1D4ED8" },
  IN_PROGRESS:      { bg: "#E0E7FF", fg: "#4338CA" },
  COMPLETED:        { bg: "#DCFCE7", fg: "#15803D" },
  CANCELLED:        { bg: "#FEE2E2", fg: "#B91C1C" },
};
const TYPE_META = {
  TOUR:      { bg: C.purpleLight, fg: "#6D28D9", icon: "map",       gradient: [C.purple, "#6D28D9"] },
  PROPERTY:  { bg: C.amberLight,  fg: "#A16207", icon: "bed",       gradient: [C.amber, "#D97706"] },
  TRANSPORT: { bg: C.blueLight,   fg: "#1D4ED8", icon: "car",       gradient: [C.blue, "#1D4ED8"] },
  CUSTOM:    { bg: "#FCE7F3",     fg: "#9D174D", icon: "construct", gradient: ["#EC4899", "#9D174D"] },
};

// Service meta for self-bookings (mirrors web's SERVICE_META at
// src/app/travel-agent/(dashboard)/bookings/page.tsx). B2B_* prefixed entries
// represent COMPANY-mode bookings routed to the manager queue.
const SERVICE_META = {
  BIKE:        { label: "Bike",       icon: "bicycle",            lib: "ion", bg: "#FEE2E2", fg: "#B91C1C" },
  CAR:         { label: "Car",        icon: "car-sport",          lib: "ion", bg: "#DBEAFE", fg: "#1D4ED8" },
  BUS:         { label: "Bus",        icon: "bus",                lib: "ion", bg: "#EDE9FE", fg: "#6D28D9" },
  LUXURY:      { label: "Luxury",     icon: "diamond",            lib: "ion", bg: "#FEF3C7", fg: "#A16207" },
  CHAUFFEUR:   { label: "Chauffeur",  icon: "car",                lib: "ion", bg: "#E0E7FF", fg: "#4338CA" },
  TRUCK:       { label: "Truck",      icon: "truck",              lib: "mci", bg: "#FED7AA", fg: "#9A3412" },
  PACKERS:     { label: "Packers",    icon: "package-variant",    lib: "mci", bg: "#D1FAE5", fg: "#047857" },
  EQUIPMENT:   { label: "Equipment",  icon: "tools",              lib: "mci", bg: "#CCFBF1", fg: "#0F766E" },
  WANDER:      { label: "Group Trip", icon: "earth",              lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_CAR:        { label: "TA · Car (Mgr)",       icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_BIKE:       { label: "TA · Bike (Mgr)",      icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_BUS:        { label: "TA · Bus (Mgr)",       icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_LUXURY:     { label: "TA · Luxury (Mgr)",    icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_CHAUFFEUR:  { label: "TA · Chauffeur (Mgr)", icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_TRUCK:      { label: "TA · Truck (Mgr)",     icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
  B2B_SELF_DRIVE: { label: "TA · Self-Drive (Mgr)", icon: "briefcase", lib: "ion", bg: "#E0E7FF", fg: "#3730A3" },
};

function ServiceIco({ lib, name, size, color }) {
  if (lib === "mci") return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} />;
}
const PAYMENT_COLORS = {
  PENDING:  { fg: "#A16207", icon: "hourglass" },
  PARTIAL:  { fg: "#4338CA", icon: "card" },
  PAID:     { fg: "#15803D", icon: "checkmark-circle" },
  REFUNDED: { fg: "#B91C1C", icon: "return-up-back" },
};

const INR = (n) => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};
const formatDate = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); } catch { return null; }
};

export default function BookingsListScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  // Self-bookings = customer-side bookings made by this TA (Personal + Company).
  // Backend returns them on the same endpoint as `data.selfBookings`. Mirrors
  // web's "My Self-Bookings" section.
  const [selfBookings, setSelfBookings] = useState([]);
  const [showAllSelf, setShowAllSelf] = useState(false);
  const [stats, setStats] = useState(null);
  const [totals, setTotals] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setError(null);
        const data = await listTravelAgentBookings({
          page: pageNum, limit: 20,
          status: statusFilter,
          bookingType: typeFilter,
          search: debouncedSearch,
        });
        setBookings((prev) => (append ? [...prev, ...(data.bookings || [])] : data.bookings || []));
        // Self-bookings are not paginated server-side — only refresh on page 1.
        if (!append) setSelfBookings(data.selfBookings || []);
        if (data.stats) setStats(data.stats);
        if (data.totals) setTotals(data.totals);
        if (data.pagination) setPagination(data.pagination);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, typeFilter, debouncedSearch]
  );

  useEffect(() => { setLoading(true); fetchPage(1, false); }, [fetchPage]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchPage(1, false));
    return unsub;
  }, [navigation, fetchPage]);

  const onRefresh = async () => { setRefreshing(true); await fetchPage(1, false); };
  const onEndReached = () => {
    if (loadingMore || loading || pagination.page >= pagination.pages) return;
    setLoadingMore(true);
    fetchPage(pagination.page + 1, true);
  };

  const statusChips = useMemo(() => {
    const items = [{ key: "ALL", label: "All", count: stats?.total ?? null }];
    for (const s of BOOKING_STATUS) {
      items.push({ key: s, label: s.replace("_", " "), count: stats?.[s] ?? null });
    }
    return items;
  }, [stats]);

  const collectionPct = totals?.bookedAmount > 0
    ? Math.round((Number(totals.receivedAmount || 0) / Number(totals.bookedAmount)) * 100)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Bookings</Text>
              <Text style={styles.headerSub}>
                {pagination.total > 0
                  ? `${pagination.total} total${collectionPct != null ? ` · ${collectionPct}% collected` : ""}`
                  : "Track every customer booking"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("TAAddEditBooking")}
              style={styles.headerAddBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={C.emerald700} />
              <Text style={styles.headerAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.85)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search booking #, customer, reference…"
              placeholderTextColor="rgba(255,255,255,0.65)"
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status pill filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {statusChips.map((c) => {
              const active = statusFilter === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setStatusFilter(c.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                  {c.count != null && c.count > 0 && (
                    <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                      <Text style={[styles.chipBadgeText, active && { color: C.emerald700 }]}>{c.count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Money summary card — floats slightly into gradient bottom */}
      {totals && (Number(totals.bookedAmount) > 0 || Number(totals.receivedAmount) > 0) && (
        <View style={styles.totalsWrap}>
          <View style={styles.totalsCard}>
            <View style={styles.totalsItem}>
              <Ionicons name="cash" size={14} color={C.emerald600} />
              <View>
                <Text style={styles.totalsLabel}>BOOKED</Text>
                <Text style={styles.totalsValue}>{INR(totals.bookedAmount)}</Text>
              </View>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Ionicons name="wallet" size={14} color={C.blue} />
              <View>
                <Text style={styles.totalsLabel}>RECEIVED</Text>
                <Text style={[styles.totalsValue, { color: C.blue }]}>{INR(totals.receivedAmount)}</Text>
              </View>
            </View>
            {collectionPct != null && (
              <>
                <View style={styles.totalsDivider} />
                <View style={styles.totalsItem}>
                  <Ionicons name="pie-chart" size={14} color={C.amber} />
                  <View>
                    <Text style={styles.totalsLabel}>COLLECTED</Text>
                    <Text style={[styles.totalsValue, { color: C.amber }]}>{collectionPct}%</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Type filter sub-bar */}
      <View style={styles.subFilterBar}>
        <Text style={styles.subFilterLabel}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[{ key: "ALL", label: "Any" }, ...BOOKING_TYPE.map((t) => ({ key: t, label: t }))].map((c) => {
            const active = typeFilter === c.key;
            const tc = TYPE_META[c.key];
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setTypeFilter(c.key)}
                style={[
                  styles.typeChip,
                  active && tc && { backgroundColor: tc.bg, borderColor: tc.fg },
                  active && !tc && { backgroundColor: C.emerald50, borderColor: C.emerald600 },
                ]}
              >
                {tc && <Ionicons name={tc.icon} size={11} color={active ? tc.fg : C.subText} />}
                <Text
                  style={[
                    styles.typeChipText,
                    active && tc && { color: tc.fg, fontWeight: "800" },
                    active && !tc && { color: C.emerald700, fontWeight: "800" },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, false)}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate("TABookingDetail", { id: item.id, bookingNumber: item.bookingNumber })}
            />
          )}
          contentContainerStyle={(bookings.length === 0 && selfBookings.length === 0) ? styles.emptyWrap : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <>
              <SelfBookingsSection
                items={selfBookings}
                showAll={showAllSelf}
                onToggle={() => setShowAllSelf((v) => !v)}
                onItemPress={(sb) => {
                  const isB2B = sb.service && sb.service.startsWith("B2B_");
                  // COMPANY (B2B_*) bookings open a read-only detail screen
                  // backed by the NO-AUTH /api/b2b/bookings/[id] endpoint,
                  // which accepts the travel-agent token (the vendor-side
                  // B2BBookingDetail can't be reused — it calls /vendor/*
                  // endpoints that 401 a TA token).
                  if (isB2B) {
                    navigation.navigate("TASelfBookingDetail", {
                      id: sb.id,
                      bookingNumber: sb.bookingNumber,
                      service: sb.service,
                    });
                    return;
                  }
                  // PERSONAL (regular service) bookings: open the customer track
                  // page in the browser (same as web's "Track" link — backend
                  // returns sb.trackUrl = /customer/track/{id}). No TA-side
                  // detail endpoint exists; this matches web behaviour exactly.
                  if (sb.trackUrl) {
                    (async () => {
                      try {
                        const base = await getBaseURL();
                        const url = sb.trackUrl.startsWith("http") ? sb.trackUrl : `${base}${sb.trackUrl}`;
                        await Linking.openURL(url);
                      } catch {
                        Alert.alert("Couldn't open", "Unable to open the booking page.");
                      }
                    })();
                    return;
                  }
                  Alert.alert(
                    sb.bookingNumber || "Booking",
                    [
                      `Service: ${sb.service}`,
                      `Status: ${sb.status}`,
                      `Amount: ${sb.amount > 0 ? `₹${Number(sb.amount).toLocaleString("en-IN")}` : "—"}`,
                      "",
                      "Open the TR customer app to manage this booking.",
                    ].join("\n")
                  );
                }}
              />
              {bookings.length > 0 && selfBookings.length > 0 && (
                <Text style={styles.manualHeading}>Manual Bookings</Text>
              )}
            </>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={C.subText} style={{ padding: 14 }} /> : null}
          ListEmptyComponent={
            // Don't show empty state if self-bookings exist — section above already fills the screen.
            selfBookings.length > 0 ? null : (
              <EmptyState
                filtered={!!debouncedSearch || statusFilter !== "ALL" || typeFilter !== "ALL"}
                onAdd={() => navigation.navigate("TAAddEditBooking")}
              />
            )
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TAAddEditBooking")}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[C.emerald600, C.emerald700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ───────── Sub-components ───────── */

// Mirrors web's "My Self-Bookings" section in
// src/app/travel-agent/(dashboard)/bookings/page.tsx:217-299. Renders the
// customer-side bookings (Personal + Company) this TA placed using their own
// customer login. B2B_* prefixed services represent COMPANY-mode rows from
// b2b_bookings; their status already carries a `(PERSONAL)` / `(COMPANY)`
// suffix attached server-side at /api/travel-agent/bookings/route.ts:149.
function SelfBookingsSection({ items, showAll, onToggle, onItemPress }) {
  if (!items || items.length === 0) return null;
  const visible = showAll ? items : items.slice(0, 5);
  return (
    <View style={selfStyles.wrap}>
      <LinearGradient
        colors={["#EEF2FF", "#FAF5FF"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={selfStyles.headerBand}
      >
        <View style={selfStyles.headerLeft}>
          <View style={selfStyles.sparkle}>
            <Ionicons name="sparkles" size={13} color="#4F46E5" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={selfStyles.title}>My Self-Bookings</Text>
            <Text style={selfStyles.sub}>
              Bookings you placed on the customer side ({items.length})
            </Text>
          </View>
        </View>
        {items.length > 5 && (
          <TouchableOpacity onPress={onToggle} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={selfStyles.toggle}>
              {showAll ? "Show less" : "Show all"} {showAll ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={selfStyles.body}>
        {visible.map((sb, idx) => {
          const meta = SERVICE_META[sb.service] || { label: sb.service, icon: "ellipsis-horizontal", lib: "ion", bg: "#F1F5F9", fg: "#475569" };
          const dateStr = sb.bookingDate
            ? new Date(sb.bookingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "—";
          return (
            <TouchableOpacity
              key={`${sb.service}-${sb.id}`}
              onPress={() => onItemPress(sb)}
              activeOpacity={0.7}
              style={[selfStyles.row, idx < visible.length - 1 && selfStyles.rowBorder]}
            >
              <View style={[selfStyles.servicePill, { backgroundColor: meta.bg }]}>
                <ServiceIco lib={meta.lib} name={meta.icon} size={11} color={meta.fg} />
                <Text style={[selfStyles.servicePillText, { color: meta.fg }]} numberOfLines={1}>
                  {meta.label}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                <Text style={selfStyles.bookingNum} numberOfLines={1}>
                  {sb.bookingNumber || sb.id.slice(0, 10)}
                </Text>
                <Text style={selfStyles.dateText} numberOfLines={1}>
                  {dateStr}
                  {sb.amount > 0 ? `  ·  ₹${Number(sb.amount).toLocaleString("en-IN")}` : ""}
                </Text>
              </View>
              <View style={selfStyles.statusBadge}>
                <Text style={selfStyles.statusText} numberOfLines={1}>
                  {String(sb.status).replace(/_/g, " ")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function BookingCard({ booking, onPress }) {
  const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.DRAFT;
  const tc = TYPE_META[booking.bookingType] || TYPE_META.CUSTOM;
  const pc = PAYMENT_COLORS[booking.paymentStatus] || PAYMENT_COLORS.PENDING;
  const isProp = booking.bookingType === "PROPERTY";
  const startDate = isProp ? booking.checkInDate : booking.travelDate;
  const endDate = isProp ? booking.checkOutDate : booking.returnDate;
  const totalAmt = Number(booking.totalAmount || 0);
  const paidAmt = Number(booking.paidAmount || 0);
  const paidPct = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top stripe with type icon + booking number */}
      <View style={styles.cardTopStripe}>
        <LinearGradient
          colors={tc.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.typeIconBox}
        >
          <Ionicons name={tc.icon} size={16} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.typeLabel, { color: tc.fg }]}>{booking.bookingType}</Text>
          <Text style={styles.bookingNumber} numberOfLines={1}>{booking.bookingNumber}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>{booking.status.replace("_", " ")}</Text>
        </View>
      </View>

      {/* Customer + reference */}
      <Text style={styles.cardName} numberOfLines={1}>{booking.customerName || "—"}</Text>
      {!!booking.referenceTitle && (
        <Text style={styles.cardRef} numberOfLines={1}>{booking.referenceTitle}</Text>
      )}

      {/* Meta row */}
      <View style={styles.cardMetaRow}>
        {!!startDate && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={C.subText} />
            <Text style={styles.metaText}>
              {formatDate(startDate)}
              {endDate ? `  →  ${formatDate(endDate)}` : ""}
            </Text>
          </View>
        )}
        {!!booking.passengers && (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={12} color={C.subText} />
            <Text style={styles.metaText}>{booking.passengers} pax</Text>
          </View>
        )}
        {!!booking.shareToken && (
          <View style={styles.shareChip}>
            <Ionicons name="share-social" size={11} color={C.blue} />
            <Text style={styles.shareChipText}>Shared</Text>
          </View>
        )}
      </View>

      {/* Money row with progress bar */}
      <View style={styles.moneyBlock}>
        <View style={styles.moneyTopRow}>
          <Text style={styles.moneyTotal}>{INR(totalAmt)}</Text>
          <View style={styles.paymentBadge}>
            <Ionicons name={pc.icon} size={11} color={pc.fg} />
            <Text style={[styles.paymentText, { color: pc.fg }]}>{booking.paymentStatus}</Text>
          </View>
        </View>
        {totalAmt > 0 && (
          <>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${paidPct}%`, backgroundColor: paidPct === 100 ? C.emerald500 : C.amber }]} />
            </View>
            <View style={styles.moneyBottomRow}>
              <Text style={styles.moneyPaidText}>{INR(paidAmt)} received</Text>
              <Text style={styles.moneyBalanceText}>{INR(totalAmt - paidAmt)} balance</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filtered, onAdd }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={filtered ? "search-outline" : "calendar-outline"} size={36} color={C.emerald600} />
      </View>
      <Text style={styles.emptyTitle}>{filtered ? "No matches" : "No bookings yet"}</Text>
      <Text style={styles.emptyBody}>
        {filtered
          ? "Try clearing your filters or searching for a different term."
          : "Create your first booking manually, or convert a lead into one."}
      </Text>
      {!filtered && (
        <TouchableOpacity style={styles.emptyCta} onPress={onAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyCtaText}>Add Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */

// Styles dedicated to "My Self-Bookings" section (web parity).
const selfStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    backgroundColor: "#fff",
  },
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  sparkle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#E0E7FF",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 13, fontWeight: "800", color: "#1E1B4B" },
  sub: { fontSize: 10.5, color: "#4338CA", marginTop: 1 },
  toggle: { fontSize: 11, fontWeight: "800", color: "#4338CA" },
  body: { borderTopWidth: 1, borderTopColor: "#E0E7FF" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 130,
  },
  servicePillText: { fontSize: 9.5, fontWeight: "800" },
  bookingNum: { fontSize: 12, fontWeight: "800", color: "#0F172A", fontVariant: ["tabular-nums"] },
  dateText: { fontSize: 10.5, color: "#64748B", marginTop: 1, fontWeight: "600" },
  statusBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 110,
  },
  statusText: { fontSize: 9, fontWeight: "800", color: "#475569", textTransform: "uppercase" },
});

const styles = StyleSheet.create({
  // Header
  headerGrad: { paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerAddBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#fff" },
  headerAddText: { color: C.emerald700, fontWeight: "800", fontSize: 12.5 },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 14, height: 42,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: "#fff", paddingVertical: 0, fontWeight: "600" },

  chipsRow: { paddingTop: 12, gap: 6, flexDirection: "row", paddingHorizontal: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  chipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  chipText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  chipTextActive: { color: C.emerald700, fontWeight: "800" },
  chipBadge: { minWidth: 18, height: 16, paddingHorizontal: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  chipBadgeActive: { backgroundColor: C.emerald50 },
  chipBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // Totals card (floats slightly into gradient bottom)
  totalsWrap: { marginHorizontal: 16, marginTop: 8 },
  totalsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  totalsItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  totalsLabel: { fontSize: 9.5, color: C.subText, fontWeight: "800", letterSpacing: 0.5 },
  totalsValue: { fontSize: 13.5, color: C.emerald600, fontWeight: "800", marginTop: 1 },
  totalsDivider: { width: 1, height: 28, backgroundColor: C.border, marginHorizontal: 6 },

  // Type sub-filter bar
  subFilterBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 10,
    backgroundColor: C.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border,
  },
  subFilterLabel: { fontSize: 11, fontWeight: "800", color: C.subText, letterSpacing: 0.4, textTransform: "uppercase" },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  typeChipText: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, padding: 10, backgroundColor: C.redLight, borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 12, paddingTop: 8, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  manualHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    color: C.subText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  cardTopStripe: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  typeIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  bookingNumber: { fontSize: 11.5, color: C.subText, fontWeight: "700", marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  cardName: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  cardRef: { fontSize: 12.5, color: C.text, marginTop: 3 },

  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: C.subText, fontWeight: "600" },
  shareChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: C.blueLight },
  shareChipText: { fontSize: 10.5, fontWeight: "800", color: C.blue },

  // Money block with progress
  moneyBlock: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  moneyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  moneyTotal: { fontSize: 17, fontWeight: "800", color: C.ink },
  paymentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border },
  paymentText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  progressTrack: { height: 4, backgroundColor: "#F1F5F9", borderRadius: 2, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 2 },
  moneyBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  moneyPaidText: { fontSize: 10.5, color: C.emerald600, fontWeight: "700" },
  moneyBalanceText: { fontSize: 10.5, color: C.subText, fontWeight: "700" },

  // Empty
  empty: { alignItems: "center", padding: 28 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center" },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: C.emerald600 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },

  // FAB
  fab: { position: "absolute", right: 18, bottom: 18, width: 56, height: 56, borderRadius: 28, shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  fabInner: { flex: 1, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});
