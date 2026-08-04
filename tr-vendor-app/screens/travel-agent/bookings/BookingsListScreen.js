// screens/travel-agent/bookings/BookingsListScreen.js
// REDESIGNED — rebuilt in the TA dashboard's "Lovable" design language:
// ivory/forest/emerald palette, responsive rs()/rf() scaling, serif display
// numerals, glass surfaces and tonal accent chips.
//
// UI ONLY. Data flow, filters, pagination, navigation targets and the
// self-booking routing rules are byte-for-byte the same as before.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { DISPLAY } from "../_shared/typography";
import {
  listTravelAgentBookings,
  getBaseURL,
  BOOKING_STATUS,
  BOOKING_TYPE,
} from "../../api/travelAgentClient";
import { SC as C, TONES } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const { width: W } = Dimensions.get("window");

// ── Responsive scaling (mirrors TravelAgentDashboardScreen) ──────────
const BASE_W = 390;
const SCALE = Math.min(Math.max(W / BASE_W, 0.86), 1.28);
const FONT_SCALE = Math.min(Math.max(W / BASE_W, 0.92), 1.12);
const rs = (n) => Math.round(n * SCALE);
const rf = (n) => Math.round(n * FONT_SCALE * 2) / 2;


const G = {
  hero:    [C.forestDark, C.forest, C.emeraldDeep],
  emerald: [C.emerald, C.emeraldDeep],
  gold:    [C.goldLight, C.gold],
  ocean:   [C.oceanLight, "#245C7A"],
};


const GUT = rs(16);
const GAP = rs(10);

// Status tones — re-mapped onto the warm palette (same status keys as before).
const STATUS_COLORS = {
  DRAFT:            { bg: "#ECEAE3", fg: "#6B7770" },
  PENDING_CUSTOMER: { bg: C.tintGold,    fg: "#9A6B16" },
  CONFIRMED:        { bg: C.tintOcean,   fg: "#245C7A" },
  IN_PROGRESS:      { bg: "#EFE9FA",     fg: "#5E43A8" },
  COMPLETED:        { bg: C.tintEmerald, fg: C.emeraldDeep },
  CANCELLED:        { bg: C.redL,        fg: C.red },
};

const TYPE_META = {
  TOUR:      { bg: TONES.plum.tint,  fg: TONES.plum.ink,  icon: "map",       gradient: TONES.plum.grad },
  PROPERTY:  { bg: TONES.amber.tint, fg: TONES.amber.ink, icon: "bed",       gradient: TONES.amber.grad },
  TRANSPORT: { bg: TONES.ocean.tint, fg: TONES.ocean.ink, icon: "car",       gradient: TONES.ocean.grad },
  CUSTOM:    { bg: TONES.rose.tint,  fg: TONES.rose.ink,  icon: "construct", gradient: TONES.rose.grad },
};

// Service meta for self-bookings (mirrors web's SERVICE_META at
// src/app/travel-agent/(dashboard)/bookings/page.tsx). B2B_* prefixed entries
// represent COMPANY-mode bookings routed to the manager queue.
const SERVICE_META = {
  BIKE:        { label: "Bike",       icon: "bicycle",            lib: "ion", bg: "#FBE9EE", fg: "#B14A64" },
  CAR:         { label: "Car",        icon: "car-sport",          lib: "ion", bg: C.tintOcean, fg: "#245C7A" },
  BUS:         { label: "Bus",        icon: "bus",                lib: "ion", bg: "#EFE9FA", fg: "#5E43A8" },
  LUXURY:      { label: "Luxury",     icon: "diamond",            lib: "ion", bg: C.tintGold, fg: "#9A6B16" },
  CHAUFFEUR:   { label: "Chauffeur",  icon: "car",                lib: "ion", bg: "#EFE9FA", fg: "#5E43A8" },
  TRUCK:       { label: "Truck",      icon: "truck",              lib: "mci", bg: "#F7E7D8", fg: "#9A5B23" },
  PACKERS:     { label: "Packers",    icon: "package-variant",    lib: "mci", bg: C.tintEmerald, fg: C.emeraldDeep },
  EQUIPMENT:   { label: "Equipment",  icon: "tools",              lib: "mci", bg: "#DDEFEA", fg: "#0F6B5A" },
  WANDER:      { label: "Group Trip", icon: "earth",              lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_CAR:        { label: "TA · Car (Mgr)",       icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_BIKE:       { label: "TA · Bike (Mgr)",      icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_BUS:        { label: "TA · Bus (Mgr)",       icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_LUXURY:     { label: "TA · Luxury (Mgr)",    icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_CHAUFFEUR:  { label: "TA · Chauffeur (Mgr)", icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_TRUCK:      { label: "TA · Truck (Mgr)",     icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
  B2B_SELF_DRIVE: { label: "TA · Self-Drive (Mgr)", icon: "briefcase", lib: "ion", bg: "#E4EAF7", fg: "#3A4E8C" },
};

// TEMP DEMO — sample company self-booking card so the "My Self-Bookings"
// section renders without real data. Tapping it opens SelfBookingDetail with
// the demo id. Remove after the Self-Booking redesign is approved.
const DEMO_SELF_BOOKING = {
  id: "__DEMO_SELF__",
  service: "B2B_CAR",
  bookingNumber: "TA-DEMO-0001",
  bookingDate: "2026-07-20T00:00:00.000Z",
  amount: 24500,
  status: "CONFIRMED (COMPANY)",
};

function ServiceIco({ lib, name, size, color }) {
  if (lib === "mci") return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} />;
}

const PAYMENT_COLORS = {
  PENDING:  { fg: "#9A6B16",     icon: "hourglass" },
  PARTIAL:  { fg: "#5E43A8",     icon: "card" },
  PAID:     { fg: C.emeraldDeep, icon: "checkmark-circle" },
  REFUNDED: { fg: C.red,         icon: "return-up-back" },
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

// Small leading icons for the status filter pills (visual only).
const STATUS_ICON = {
  ALL: "sparkles-outline",
  DRAFT: "document-text-outline",
  PENDING_CUSTOMER: "time-outline",
  CONFIRMED: "checkmark-circle-outline",
  IN_PROGRESS: "sync-outline",
  COMPLETED: "checkmark-done-outline",
  CANCELLED: "close-circle-outline",
};

// Tones for the summary stat tiles (mirror the reference: green / orange / green / blue).
const STAT_TONES = {
  emerald: { bg: "#EAF4EE", chip: "rgba(28,107,82,0.12)",  fg: C.emeraldDeep },
  gold:    { bg: "#FBF2E0", chip: "rgba(221,163,63,0.16)", fg: C.amber },
  ocean:   { bg: "#E9F1F6", chip: "rgba(44,110,140,0.12)", fg: "#245C7A" },
};

// SVG sparkline. `data` is a numeric series derived in-memory from the loaded
// bookings (no extra fetch). Falls back to an honest flat baseline when sparse.
function Sparkline({ color, data, gid }) {
  const VW = 120, VH = 30, padY = 4;
  const vals = Array.isArray(data) ? data.map((n) => Number(n) || 0) : [];
  const hasShape = vals.length > 1 && Math.max(...vals) > 0;
  let line, area = null;
  if (hasShape) {
    const max = Math.max(...vals);
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const x = (i / (n - 1)) * VW;
      const y = VH - padY - (v / max) * (VH - padY * 2);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    line = "M" + pts.join(" L");
    area = `${line} L${VW} ${VH} L0 ${VH} Z`;
  } else {
    line = `M0 ${VH - padY} L${VW} ${VH - padY}`;
  }
  return (
    <Svg width="100%" height={rs(28)} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.28" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      {area && <Path d={area} fill={`url(#${gid})`} />}
      <Path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Summary stat tile — icon chip + trend arrow, big value, label, optional sub,
// and a sparkline pinned to the bottom (reference layout).
function StatCard({ w, tone, icon, value, label, sub, data, gid }) {
  const t = STAT_TONES[tone] || STAT_TONES.emerald;
  return (
    <View style={[styles.statCard, styles.cardShadow, { width: w, backgroundColor: t.bg }]}>
      <View style={styles.statTopRow}>
        <View style={[styles.statIcoChip, { backgroundColor: t.chip }]}>
          <Ionicons name={icon} size={rs(15)} color={t.fg} />
        </View>
        <Ionicons name="trending-up" size={rs(13)} color={t.fg} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      {!!sub && <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>}
      <View style={styles.statSpark}><Sparkline color={t.fg} data={data} gid={gid} /></View>
    </View>
  );
}

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
        // TEMP DEMO — prepend a sample company self-booking so the section is
        // visible without real data (remove after Self-Booking redesign).
        if (!append) setSelfBookings([DEMO_SELF_BOOKING, ...(data.selfBookings || [])]);
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

  const hasTotals = !!totals && (Number(totals.bookedAmount) > 0 || Number(totals.receivedAmount) > 0);

  // Last-6-month trend buckets built from the loaded bookings only (in-memory,
  // no extra fetch) — powers the stat-tile sparklines. Sparse data → flat line.
  const spark = useMemo(() => {
    const N = 6;
    const b = Array.from({ length: N }, () => ({ count: 0, revenue: 0, confirmed: 0, pending: 0 }));
    const now = new Date();
    const baseY = now.getFullYear(), baseM = now.getMonth();
    for (const bk of bookings) {
      const iso = bk.createdAt || bk.travelDate;
      if (!iso) continue;
      const d = new Date(iso);
      if (isNaN(d.getTime())) continue;
      const diff = (baseY - d.getFullYear()) * 12 + (baseM - d.getMonth());
      if (diff < 0 || diff >= N) continue;
      const i = N - 1 - diff;
      b[i].count += 1;
      b[i].revenue += Number(bk.totalAmount || 0);
      if (bk.status === "CONFIRMED") b[i].confirmed += 1;
      if (bk.status === "PENDING_CUSTOMER") b[i].pending += 1;
    }
    return {
      count: b.map((x) => x.count),
      revenue: b.map((x) => x.revenue),
      confirmed: b.map((x) => x.confirmed),
      pending: b.map((x) => x.pending),
    };
  }, [bookings]);

  const statTotal = stats?.total ?? pagination.total ?? 0;
  const statPending = stats?.PENDING_CUSTOMER ?? 0;
  const statConfirmed = stats?.CONFIRMED ?? 0;
  const STAT_GAP = rs(12);
  const statW = (W - GUT * 2 - STAT_GAP) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Green hero header ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backCircle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => navigation.navigate("TAAddEditBooking")}
              style={[styles.addCircle, styles.cardShadow]}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={rs(24)} color={C.emeraldDeep} />
            </TouchableOpacity>
          </View>

          <Text style={styles.bigTitle}>Bookings</Text>
          <Text style={styles.bigSub}>Track and manage all customer bookings effortlessly.</Text>

          {/* spacer so the floating search card can tuck into the curve */}
          <View style={{ height: rs(28) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Floating search — tucks into the hero's bottom curve */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchCard}>
          <Ionicons name="search" size={rs(17)} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Booking ID, Customer, Destination…"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={rs(17)} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fixed status + type filters — kept OUTSIDE the FlatList so tapping a
          filter (which triggers a reload) doesn't reset the horizontal scroll
          or push the selected pill out of view. Wrapped in a plain View so the
          horizontal ScrollViews get a proper block context (no clipping). */}
      <View style={styles.filtersFixed}>
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
              {STATUS_ICON[c.key] && (
                <Ionicons name={STATUS_ICON[c.key]} size={rs(12)} color={active ? "#fff" : C.sub} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              {c.count != null && c.count > 0 && (
                <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, active && { color: "#fff" }]}>{c.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.typeFilterRow}>
        <Text style={styles.subFilterLabel}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.typeRowInner}>
          {[{ key: "ALL", label: "Any" }, ...BOOKING_TYPE.map((t) => ({ key: t, label: t }))].map((c) => {
            const active = typeFilter === c.key;
            const tc = TYPE_META[c.key];
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setTypeFilter(c.key)}
                style={[
                  styles.typeChip,
                  active && (tc ? { backgroundColor: tc.bg, borderColor: tc.fg } : { backgroundColor: C.tintEmerald, borderColor: C.emerald }),
                ]}
                activeOpacity={0.8}
              >
                {tc && <Ionicons name={tc.icon} size={rs(12)} color={active ? tc.fg : C.muted} />}
                <Text style={[styles.typeChipText, active && { color: tc ? tc.fg : C.emeraldDeep, fontWeight: "bold" }]}>
                  {c.label}
                </Text>
                {tc && <Ionicons name="chevron-down" size={rs(11)} color={active ? tc.fg : C.muted} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={rs(15)} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, false)}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald} /></View>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <>
              {/* Money summary — Booked / Received / Collected (always shown) */}
              <View style={[styles.totalsCard, styles.cardShadow, styles.totalsInList]}>
                <View style={styles.totalsItem}>
                  <View style={[styles.totalsIco, { backgroundColor: C.tintEmerald }]}>
                    <Ionicons name="cash" size={rs(13)} color={C.emeraldDeep} />
                  </View>
                  <View style={{ minWidth: 0 }}>
                    <Text style={styles.totalsLabel}>BOOKED</Text>
                    <Text style={styles.totalsValue} numberOfLines={1}>{INR(totals?.bookedAmount || 0)}</Text>
                  </View>
                </View>

                <View style={styles.totalsDivider} />

                <View style={styles.totalsItem}>
                  <View style={[styles.totalsIco, { backgroundColor: C.tintOcean }]}>
                    <Ionicons name="wallet" size={rs(13)} color={C.ocean} />
                  </View>
                  <View style={{ minWidth: 0 }}>
                    <Text style={styles.totalsLabel}>RECEIVED</Text>
                    <Text style={[styles.totalsValue, { color: C.ocean }]} numberOfLines={1}>{INR(totals?.receivedAmount || 0)}</Text>
                  </View>
                </View>

                <View style={styles.totalsDivider} />

                <View style={styles.totalsItem}>
                  <View style={[styles.totalsIco, { backgroundColor: C.tintGold }]}>
                    <Ionicons name="pie-chart" size={rs(13)} color={C.gold} />
                  </View>
                  <View style={{ minWidth: 0 }}>
                    <Text style={styles.totalsLabel}>COLLECTED</Text>
                    <Text style={[styles.totalsValue, { color: C.gold }]} numberOfLines={1}>{collectionPct != null ? `${collectionPct}%` : "0%"}</Text>
                  </View>
                </View>
              </View>
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
                <View style={styles.manualHeadingWrap}>
                  <Text style={styles.manualKicker}>Manual</Text>
                  <Text style={styles.manualHeading}>Bookings</Text>
                  <View style={styles.manualRule} />
                </View>
              )}
            </>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={C.muted} style={{ padding: rs(14) }} /> : null}
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
    <View style={[selfStyles.wrap, styles.cardShadow]}>
      <LinearGradient
        colors={["#F3EDDF", "#E7DDC8"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={selfStyles.headerBand}
      >
        <View style={selfStyles.headerLeft}>
          <LinearGradient colors={G.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={selfStyles.sparkle}>
            <Ionicons name="sparkles" size={rs(12)} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={selfStyles.title}>My Self-Bookings</Text>
            <Text style={selfStyles.sub}>
              Bookings you placed on the customer side ({items.length})
            </Text>
          </View>
        </View>
        {items.length > 5 && (
          <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={selfStyles.toggle}>
              {showAll ? "Show less" : "Show all"} {showAll ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={selfStyles.body}>
        {visible.map((sb, idx) => {
          const meta = SERVICE_META[sb.service] || { label: sb.service, icon: "ellipsis-horizontal", lib: "ion", bg: "#ECEAE3", fg: C.sub };
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
                <ServiceIco lib={meta.lib} name={meta.icon} size={rs(10)} color={meta.fg} />
                <Text style={[selfStyles.servicePillText, { color: meta.fg }]} numberOfLines={1}>
                  {meta.label}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: rs(10), minWidth: 0 }}>
                <View style={selfStyles.rowTop}>
                  <Text style={selfStyles.bookingNum} numberOfLines={1}>
                    {sb.bookingNumber || sb.id.slice(0, 10)}
                  </Text>
                  <View style={selfStyles.statusBadge}>
                    <Text style={selfStyles.statusText} numberOfLines={1}>
                      {String(sb.status).replace(/_/g, " ").replace(/\s*\([^)]*\)\s*/g, "").trim()}
                    </Text>
                  </View>
                </View>
                <Text style={selfStyles.dateText} numberOfLines={1}>
                  {dateStr}
                  {sb.amount > 0 ? `  ·  ₹${Number(sb.amount).toLocaleString("en-IN")}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={rs(13)} color={C.muted} style={{ marginLeft: rs(6) }} />
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
    <TouchableOpacity style={[styles.card, styles.cardShadow]} onPress={onPress} activeOpacity={0.85}>
      {/* Tonal accent rail — instant type recognition down the card edge */}
      <LinearGradient
        colors={tc.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.cardRail}
      />

      <View style={styles.cardInner}>
        {/* Top: type icon + booking number + status */}
        <View style={styles.cardTopStripe}>
          <LinearGradient
            colors={tc.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.typeIconBox}
          >
            <Ionicons name={tc.icon} size={rs(15)} color="#fff" />
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
              <Ionicons name="calendar-outline" size={rs(11)} color={C.muted} />
              <Text style={styles.metaText}>
                {formatDate(startDate)}
                {endDate ? `  →  ${formatDate(endDate)}` : ""}
              </Text>
            </View>
          )}
          {!!booking.passengers && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={rs(11)} color={C.muted} />
              <Text style={styles.metaText}>{booking.passengers} pax</Text>
            </View>
          )}
          {!!booking.shareToken && (
            <View style={styles.shareChip}>
              <Ionicons name="share-social" size={rs(10)} color={C.ocean} />
              <Text style={styles.shareChipText}>Shared</Text>
            </View>
          )}
        </View>

        {/* Money row with progress bar */}
        <View style={styles.moneyBlock}>
          <View style={styles.moneyTopRow}>
            <Text style={styles.moneyTotal}>{INR(totalAmt)}</Text>
            <View style={styles.paymentBadge}>
              <Ionicons name={pc.icon} size={rs(10)} color={pc.fg} />
              <Text style={[styles.paymentText, { color: pc.fg }]}>{booking.paymentStatus}</Text>
            </View>
          </View>
          {totalAmt > 0 && (
            <>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={paidPct === 100 ? G.emerald : G.gold}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${paidPct}%` }]}
                />
              </View>
              <View style={styles.moneyBottomRow}>
                <Text style={styles.moneyPaidText}>{INR(paidAmt)} received</Text>
                <Text style={styles.moneyBalanceText}>{INR(totalAmt - paidAmt)} balance</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filtered, onAdd }) {
  return (
    <View style={[styles.empty, styles.emptyCardWrap]}>
      {/* Calendar illustration */}
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtCardBack} />
        <View style={styles.emptyArtCard}>
          <Ionicons name={filtered ? "search" : "calendar"} size={rs(44)} color={C.emerald} />
        </View>
        <View style={styles.emptyArtDot} />
        <View style={styles.emptyArtTag}>
          <Text style={styles.emptyArtTagTxt}>{filtered ? "NO MATCH" : "CONFIRMED"}</Text>
        </View>
      </View>

      <Text style={styles.emptyTitle}>{filtered ? "No matches" : "No Bookings Yet"}</Text>
      <Text style={styles.emptyBody}>
        {filtered
          ? "Try clearing your filters or searching for a different term."
          : "Create your first booking or convert a lead into a confirmed reservation."}
      </Text>
      {!filtered && (
        <TouchableOpacity style={[styles.cardShadow, styles.emptyCtaWrap]} onPress={onAdd} activeOpacity={0.9}>
          <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCta}>
            <Ionicons name="add" size={rs(15)} color="#fff" />
            <Text style={styles.emptyCtaText}>Create Booking</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */

// Styles dedicated to "My Self-Bookings" section (web parity).
const selfStyles = StyleSheet.create({
  wrap: {
    marginTop: rs(4),
    marginBottom: rs(10),
    borderRadius: rs(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.sand,
    backgroundColor: C.card,
  },
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    gap: rs(8),
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: rs(8), minWidth: 0 },
  sparkle: {
    width: rs(26), height: rs(26), borderRadius: rs(13),
    alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.forest, letterSpacing: 0.2 },
  sub: { fontFamily: DISPLAY, fontSize: rf(10.5), color: "#7A6A45", marginTop: 1, fontWeight: "600" },
  toggle: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold", color: "#9A6B16" },
  body: { borderTopWidth: 1, borderTopColor: C.sand },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12),
    paddingVertical: rs(11),
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    paddingHorizontal: rs(7),
    paddingVertical: rs(3),
    borderRadius: 999,
    maxWidth: rs(118),
    flexShrink: 0,
  },
  servicePillText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: rs(8) },
  bookingNum: { flexShrink: 1, fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: C.ink, fontVariant: ["tabular-nums"] },
  dateText: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.sub, marginTop: rs(2), fontWeight: "600" },
  statusBadge: {
    flexShrink: 0,
    backgroundColor: C.tintSand,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: 999,
  },
  statusText: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold", color: C.sub, textTransform: "uppercase", letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#0F2A22",
    shadowOpacity: 0.08,
    shadowRadius: rs(14),
    shadowOffset: { width: 0, height: rs(6) },
    elevation: 4,
  },

  // ── Green hero header ──
  headerGrad: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(50), right: -rs(30),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  headerTopRow: { flexDirection: "row", alignItems: "center", paddingTop: rs(4), marginBottom: rs(10) },
  backCircle: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  addCircle: {
    width: rs(48), height: rs(48), borderRadius: rs(24),
    backgroundColor: C.ivory, alignItems: "center", justifyContent: "center",
    transform: [{ translateY: rs(14) }],
  },
  bigTitle: { fontFamily: DISPLAY, fontSize: rf(29), color: "#fff", letterSpacing: 0.2 },
  bigSub: { fontFamily: DISPLAY, fontSize: rf(12.5), color: "rgba(255,255,255,0.72)", fontWeight: "600", marginTop: rs(4) },

  // Floating search card — tucks into the hero's bottom curve.
  searchBarWrap: { marginHorizontal: GUT, marginTop: -rs(24) },
  searchCard: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    backgroundColor: C.card, borderRadius: rs(15),
    paddingHorizontal: rs(15), height: rs(44),
    borderWidth: 1, borderColor: C.glassBorder,
    shadowColor: "#0F2A22", shadowOpacity: 0.06, shadowRadius: rs(5),
    shadowOffset: { width: 0, height: rs(2) }, elevation: 2,
  },
  searchInput: {
    fontFamily: DISPLAY,
    flex: 1, fontSize: rf(13.5), color: C.ink,
    paddingVertical: 0, fontWeight: "600",
  },

  // Fixed filters wrapper — plain block so the horizontal ScrollViews inside
  // size to their content (prevents the pills getting vertically clipped).
  filtersFixed: { flexShrink: 0 },
  // Status pills (light — fixed row below the search bar)
  chipsRow: { paddingTop: rs(12), gap: rs(8), flexDirection: "row", paddingLeft: GUT, paddingRight: rs(4) },
  chip: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(13), paddingVertical: rs(8), borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.emeraldDeep, borderColor: C.emeraldDeep },
  chipText: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, fontWeight: "bold" },
  chipTextActive: { color: "#fff" },
  chipBadge: {
    minWidth: rs(18), height: rs(17), paddingHorizontal: rs(5), borderRadius: 999,
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  chipBadgeActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  chipBadgeText: { fontFamily: DISPLAY, color: C.emeraldDeep, fontSize: rf(10), fontWeight: "bold" },

  // Type pills row (reuses typeChip / typeChipText defined below)
  typeRow: { paddingTop: rs(6), gap: rs(8), flexDirection: "row", paddingRight: rs(4) },
  // "Type" label + scrollable pills on one row.
  typeFilterRow: { flexDirection: "row", alignItems: "center", gap: rs(8), paddingTop: rs(10), paddingBottom: rs(10), paddingLeft: GUT },
  typeRowInner: { gap: rs(8), flexDirection: "row", alignItems: "center", paddingRight: rs(4) },

  // ── Stat tiles ──
  statGrid: { paddingTop: rs(2), paddingBottom: rs(8) },
  statRow: { flexDirection: "row" },
  statCard: {
    borderRadius: rs(18), padding: rs(13), overflow: "hidden",
    borderWidth: 1, borderColor: C.glassBorder, minHeight: rs(120),
  },
  statTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statIcoChip: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    alignItems: "center", justifyContent: "center",
  },
  statValue: { fontFamily: DISPLAY, fontSize: rf(26), color: C.ink, marginTop: rs(9), letterSpacing: -0.5 },
  statLabel: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: "600", marginTop: rs(1) },
  statSub: { fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted, fontWeight: "bold", marginTop: rs(2) },
  statSpark: { marginTop: rs(6), marginHorizontal: -rs(13), marginBottom: -rs(13) },

  // ── Totals card ──
  totalsWrap: { marginHorizontal: GUT, marginTop: -rs(22) },
  totalsInList: { marginTop: rs(6), marginBottom: rs(12) },
  totalsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: rs(18),
    paddingHorizontal: rs(12), paddingVertical: rs(13),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  totalsItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: rs(8), minWidth: 0 },
  totalsIco: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  totalsLabel: { fontFamily: DISPLAY, fontSize: rf(8.5), color: C.muted, fontWeight: "bold", letterSpacing: 0.6 },
  totalsValue: {
    fontFamily: DISPLAY, fontSize: rf(14.5),
    color: C.emeraldDeep, marginTop: rs(1),
  },
  totalsDivider: { width: 1, height: rs(28), backgroundColor: C.border, marginHorizontal: rs(6) },

  // ── Type sub-filter bar ──
  subFilterBar: {
    flexDirection: "row", alignItems: "center", gap: rs(10),
    paddingHorizontal: GUT, paddingVertical: rs(10), marginTop: rs(12),
    backgroundColor: "rgba(255,255,255,0.6)",
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border,
  },
  subFilterLabel: {
    fontFamily: DISPLAY,
    fontSize: rf(10), fontWeight: "bold", color: C.muted,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  typeChip: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(12), paddingVertical: rs(7), borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  typeChipText: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: "bold" },

  // ── Error ──
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(12), padding: rs(11),
    backgroundColor: C.redL, borderRadius: rs(12),
    borderWidth: 1, borderColor: "rgba(192,69,59,0.2)",
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), flex: 1, fontWeight: "600" },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: rf(12.5) },

  // ── List ──
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: GUT, paddingTop: 0, paddingBottom: rs(100) },
  emptyWrap: { paddingHorizontal: GUT, paddingTop: 0, paddingBottom: rs(40) },

  manualHeadingWrap: {
    flexDirection: "row", alignItems: "center", gap: rs(6),
    marginTop: rs(6), marginBottom: rs(10),
  },
  manualKicker: {
    fontFamily: DISPLAY,
    fontSize: rf(9.5), fontWeight: "bold", color: C.muted,
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  manualHeading: { fontFamily: DISPLAY, fontSize: rf(15), color: C.forest },
  manualRule: { flex: 1, height: 1, backgroundColor: C.border, marginLeft: rs(4) },

  // ── Card ──
  card: {
    backgroundColor: C.card,
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginBottom: rs(12),
    overflow: "hidden",
    flexDirection: "row",
  },
  cardRail: { width: rs(4) },
  cardInner: { flex: 1, padding: rs(10), minWidth: 0 },

  cardTopStripe: { flexDirection: "row", alignItems: "center", gap: rs(10), marginBottom: rs(5) },
  typeIconBox: {
    width: rs(32), height: rs(32), borderRadius: rs(10),
    alignItems: "center", justifyContent: "center",
  },
  typeLabel: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", letterSpacing: 0.8 },
  bookingNumber: {
    fontFamily: DISPLAY,
    fontSize: rf(11.5), color: C.sub, fontWeight: "bold",
    marginTop: rs(1), fontVariant: ["tabular-nums"],
  },
  statusPill: { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 999 },
  statusText: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", letterSpacing: 0.4 },

  cardName: { fontFamily: DISPLAY, fontSize: rf(17), color: C.ink, letterSpacing: 0.1 },
  cardRef: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, marginTop: rs(3), fontWeight: "600" },

  cardMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: rs(12), marginTop: rs(7), alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  metaText: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: "600" },
  shareChip: {
    flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(7), paddingVertical: rs(2.5), borderRadius: rs(7),
    backgroundColor: C.tintOcean,
  },
  shareChipText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: C.ocean },

  // ── Money block ──
  moneyBlock: { marginTop: rs(7), paddingTop: rs(7), borderTopWidth: 1, borderTopColor: C.border },
  moneyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  moneyTotal: { fontFamily: DISPLAY, fontSize: rf(19), color: C.ink },
  paymentBadge: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: 999,
    backgroundColor: C.ivory, borderWidth: 1, borderColor: C.border,
  },
  paymentText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", letterSpacing: 0.3 },
  progressTrack: {
    height: rs(5), backgroundColor: C.sand, borderRadius: rs(3),
    overflow: "hidden", marginTop: rs(7),
  },
  progressFill: { height: "100%", borderRadius: rs(3) },
  moneyBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: rs(5) },
  moneyPaidText: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.emeraldDeep, fontWeight: "bold" },
  moneyBalanceText: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted, fontWeight: "bold" },

  // ── Empty ──
  empty: { alignItems: "center", paddingVertical: rs(30) },
  emptyCardWrap: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: rs(20), marginTop: rs(18),
  },
  emptyArt: {
    width: rs(150), height: rs(120), marginBottom: rs(18),
    alignItems: "center", justifyContent: "center",
  },
  emptyArtCardBack: {
    position: "absolute", top: rs(14), right: rs(24),
    width: rs(96), height: rs(70), borderRadius: rs(14),
    backgroundColor: C.tintEmerald, transform: [{ rotate: "8deg" }],
  },
  emptyArtCard: {
    width: rs(96), height: rs(84), borderRadius: rs(16),
    backgroundColor: "#F1F6F3", borderWidth: 1, borderColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  emptyArtDot: {
    position: "absolute", top: rs(6), right: rs(20),
    width: rs(22), height: rs(22), borderRadius: rs(11), backgroundColor: C.emerald,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: "absolute", bottom: rs(10), left: rs(6),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.tintEmerald,
    transform: [{ rotate: "-8deg" }],
  },
  emptyArtTagTxt: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 0.6 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(20), color: C.ink, textAlign: "center" },
  emptyBody: {
    fontFamily: DISPLAY,
    fontSize: rf(13), color: C.sub, marginTop: rs(8), textAlign: "center",
    lineHeight: rf(19), maxWidth: rs(280), fontWeight: "600",
  },
  emptyCtaWrap: { alignSelf: "center", marginTop: rs(18) },
  emptyCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(6),
    paddingVertical: rs(11), paddingHorizontal: rs(26), borderRadius: rs(14),
  },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(13.5) },

  // ── FAB ──
  fab: {
    position: "absolute", right: rs(18), bottom: rs(18),
    width: rs(56), height: rs(56), borderRadius: rs(28),
    shadowColor: C.emeraldDeep, shadowOpacity: 0.4,
    shadowRadius: rs(14), shadowOffset: { width: 0, height: rs(6) },
    elevation: 8,
  },
  fabInner: { flex: 1, borderRadius: rs(28), alignItems: "center", justifyContent: "center" },
});
