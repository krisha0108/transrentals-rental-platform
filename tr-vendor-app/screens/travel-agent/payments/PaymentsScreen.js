// screens/travel-agent/payments/PaymentsScreen.js
// REDESIGNED — emerald-themed Payments overview.
// Backend aggregates payment activity from travel_agent_leads, returning
// stats + up to 200 items. Tap a card to open lead detail (verify there).
//
// GET /api/travel-agent/payments?status=&q=&from=&to=
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, StatusBar, Animated, Easing, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getTravelAgentPayments } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";


// Status meta: stripe color + bg/fg pill tint + icon + human label.
// "To verify" (SUBMITTED) is amber/urgent — agent action required.
const STATUS_META = {
  PENDING:   { stripe: C.blue,   bg: C.blueLight,   fg: "#1E4E86", icon: "hourglass-outline", label: "Awaiting" },
  SUBMITTED: { stripe: C.amber,  bg: C.amberLight,  fg: "#8A6420", icon: "hourglass",         label: "To verify" },
  VERIFIED:  { stripe: C.emerald600, bg: C.emerald50,  fg: C.emerald700, icon: "checkmark-circle", label: "Verified" },
  REJECTED:  { stripe: C.red,    bg: C.redLight,    fg: "#9E362E", icon: "close-circle",      label: "Rejected" },
};

// Tab order mirrors web payments page.
const TABS = [
  { key: "ALL",          label: "All",        icon: "apps" },
  { key: "SUBMITTED",    label: "To verify",  icon: "hourglass" },
  { key: "ADVANCE_PAID", label: "Balance",    icon: "cash" },
  { key: "PENDING",      label: "Awaiting",   icon: "hourglass-outline" },
  { key: "VERIFIED",     label: "Verified",   icon: "checkmark-circle" },
  { key: "REJECTED",     label: "Rejected",   icon: "close-circle" },
];
const TAB_COLORS = {
  ALL: C.emerald600, SUBMITTED: C.amber, ADVANCE_PAID: C.indigo,
  PENDING: C.blue, VERIFIED: C.emerald600, REJECTED: C.red,
};

const INR = (n) => n == null || isNaN(Number(n)) ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
const INRShort = (n) => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
};
const fmtDate = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return null; }
};
const fmtRelative = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  if (m < 20160) return `${Math.round(m / 1440)}d ago`;
  return fmtDate(iso);
};
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
// Warm Elevate tint/ink pairs — the old set was bright pastel (#DBEAFE,
// #FCE7F3, #CFFAFE …) and read as a different app on the ivory ground.
const AVATAR_PALETTE = [
  { bg: "#E6EFF4", fg: "#245C7A" }, // ocean
  { bg: "#FBE9EE", fg: "#B14A64" }, // rose
  { bg: "#E7F1EC", fg: "#1C6B52" }, // emerald
  { bg: "#F8F0DC", fg: "#9A6B16" }, // gold
  { bg: "#EFE9FA", fg: "#5E43A8" }, // plum
  { bg: "#E4F0EF", fg: "#176F66" }, // teal
];
function tintFor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// TEMP DEMO — sample payment card for previewing the card design without real
// data. Tapping it shows an info alert instead of navigating (its id is fake).
// Remove this block, its use in `load`, and the demo guard in onPress later.
const DEMO_PAY_ID = "__DEMO_PAY__";
const DEMO_PAYMENT = {
  id: DEMO_PAY_ID,
  paymentStatus: "SUBMITTED",
  customerName: "Priya Nair",
  customerPhone: "9876500000",
  tourTitle: "Goa Beach Getaway",
  destination: "Goa",
  quotedAmount: 25000,
  advanceAmount: 10000,
  balanceAmount: 15000,
  paymentSubmittedAt: "2026-07-23T09:00:00.000Z",
};

export default function PaymentsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = {};
      if (tab !== "ALL") params.status = tab;
      if (debouncedSearch) params.q = debouncedSearch;
      const data = await getTravelAgentPayments(params);
      // TEMP DEMO — prepend a sample payment card (remove after preview)
      setItems([DEMO_PAYMENT, ...(data.items || [])]);
      setStats(data.stats || null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, debouncedSearch]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const tabsWithCounts = useMemo(() => {
    if (!stats) return TABS;
    return TABS.map((t) => {
      let count = null;
      if (t.key === "ALL") count = stats.total;
      else if (t.key === "SUBMITTED") count = stats.submitted;
      else if (t.key === "ADVANCE_PAID") count = stats.advancePaid;
      else if (t.key === "PENDING") count = stats.pending;
      else if (t.key === "VERIFIED") count = stats.verified;
      else if (t.key === "REJECTED") count = stats.rejected;
      return { ...t, count };
    });
  }, [stats]);

  // Total collection % for the hero badge
  const totalAggregate = stats
    ? Number(stats.collectedAmount || 0) +
      Number(stats.awaitingAmount || 0) +
      Number(stats.pendingBalanceAmount || 0)
    : 0;
  const collectionPct = totalAggregate > 0
    ? Math.round((Number(stats.collectedAmount || 0) / totalAggregate) * 100)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ===== Gradient hero header ===== */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 46 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Payments</Text>
              <Text style={styles.headerSub}>
                {stats?.total != null ? `${stats.total} payments tracked` : "Track customer payments"}
              </Text>
            </View>
            <TouchableOpacity onPress={load} style={styles.iconBtn}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Hero "Collected" amount */}
          {stats && (
            <View style={styles.heroBlock}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>COLLECTED</Text>
                <Text style={styles.heroAmount} numberOfLines={1}>
                  {INR(stats.collectedAmount)}
                </Text>
              </View>
              {collectionPct > 0 && (
                <View style={styles.heroPctPill}>
                  <Ionicons name="checkmark-done" size={12} color="#fff" />
                  <Text style={styles.heroPctText}>{collectionPct}%</Text>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating 3-stat strip ===== */}
      {stats && (
        <View style={styles.statsCard}>
          <StatCell
            value={INRShort(stats.collectedAmount)}
            label="Collected"
            icon="checkmark-circle"
            color={C.emerald600}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={INRShort(stats.awaitingAmount)}
            label="Awaiting"
            icon="hourglass"
            color={C.amber}
          />
          <View style={styles.statDivider} />
          <StatCell
            value={INRShort(stats.pendingBalanceAmount)}
            label="Balance due"
            icon="time"
            color={C.indigo}
          />
        </View>
      )}

      {/* ===== Search ===== */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.subText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customer, phone, txn id…"
          placeholderTextColor="#9AA79E"
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={C.subText} />
          </TouchableOpacity>
        )}
      </View>

      {/* ===== Tabs (horizontal scroll) ===== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
        keyboardShouldPersistTaps="handled"
      >
        {tabsWithCounts.map((t) => {
          const active = tab === t.key;
          const color = TAB_COLORS[t.key] || C.emerald600;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                active && { backgroundColor: `${color}18`, borderColor: color },
              ]}
              onPress={() => setTab(t.key)}
              activeOpacity={0.85}
            >
              <Ionicons name={t.icon} size={12} color={active ? color : C.subText} />
              <Text
                style={[
                  styles.tabText,
                  active && { color, fontWeight: "bold" },
                ]}
              >
                {t.label}
              </Text>
              {t.count != null && t.count > 0 && (
                <View style={[styles.tabBadge, active && { backgroundColor: color }]}>
                  <Text style={[styles.tabBadgeText, active && { color: "#fff" }]}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading payments…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(p, i) => p.id || `pay-${i}`}
          renderItem={({ item }) => (
            <PaymentCard
              payment={item}
              onPress={() => {
                // TEMP DEMO — fake id has no real lead; show info instead of 404
                if (item.id === DEMO_PAY_ID) {
                  Alert.alert(
                    "Demo card",
                    "This is a sample card. A real payment card opens the customer's Lead Detail screen (to review & verify the payment)."
                  );
                  return;
                }
                navigation.navigate("TALeadDetail", {
                  id: item.id,
                  customerName: item.customerName,
                });
              }}
            />
          )}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="wallet-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>No payments</Text>
              <Text style={styles.emptyBody}>
                {debouncedSearch || tab !== "ALL"
                  ? "Try changing the filter or clearing the search."
                  : "Payments will appear here when customers pay for your quotes."}
              </Text>
              {(debouncedSearch || tab !== "ALL") && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => { setTab("ALL"); setSearch(""); }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.emptyCtaInner}
                  >
                    <Ionicons name="apps" size={16} color="#fff" />
                    <Text style={styles.emptyCtaText}>See all payments</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function PaymentCard({ payment, onPress }) {
  const status = payment.paymentStatus || "PENDING";
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const total = Number(payment.quotedAmount || 0);
  const paid = Number(payment.advanceAmount || 0);
  const balance = Number(payment.balanceAmount || 0);
  const isFullyPaid = total > 0 && balance <= 0 && paid >= total;
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const tint = tintFor(payment.customerName);
  const submittedTime = payment.paymentSubmittedAt || payment.customerAcceptedAt || payment.paymentVerifiedAt;
  const isUrgent = status === "SUBMITTED";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Left status stripe */}
      <View style={[styles.cardStripe, { backgroundColor: meta.stripe }]} />

      <View style={styles.cardBody}>
        {/* Top row: status pill + relative time */}
        <View style={styles.cardTop}>
          <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: meta.fg }]}>
            <Ionicons name={meta.icon} size={11} color={meta.fg} />
            <Text style={[styles.statusText, { color: meta.fg }]}>{meta.label}</Text>
          </View>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={9} color="#fff" />
              <Text style={styles.urgentBadgeText}>ACTION NEEDED</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {!!submittedTime && (
            <Text style={styles.cardTime}>{fmtRelative(submittedTime)}</Text>
          )}
        </View>

        {/* Customer row: avatar + name + phone */}
        <View style={styles.customerRow}>
          <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
            <Text style={[styles.avatarText, { color: tint.fg }]}>
              {initials(payment.customerName)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {payment.customerName || "—"}
            </Text>
            <View style={styles.cardMetaRow}>
              {!!payment.customerPhone && (
                <>
                  <Ionicons name="call" size={11} color={C.subText} />
                  <Text style={styles.cardMetaText} numberOfLines={1}>
                    {payment.customerPhone}
                  </Text>
                </>
              )}
              {!!(payment.tourTitle || payment.destination) && (
                <>
                  {!!payment.customerPhone && <Text style={styles.cardMetaDot}>·</Text>}
                  <Ionicons name="map" size={11} color={C.subText} />
                  <Text style={styles.cardMetaText} numberOfLines={1}>
                    {payment.tourTitle || payment.destination}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Payment progress block (when amounts are present) */}
        {total > 0 && (
          <View style={styles.payBlock}>
            {/* Progress bar */}
            <View style={styles.payBarTrack}>
              <View
                style={[
                  styles.payBarFill,
                  {
                    width: `${paidPct}%`,
                    backgroundColor: isFullyPaid ? C.emerald600 : C.amber,
                  },
                ]}
              />
            </View>

            {/* 3-column amounts */}
            <View style={styles.amountsRow}>
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>TOTAL</Text>
                <Text style={styles.amountValue}>{INR(total)}</Text>
              </View>
              <View style={styles.amountBlock}>
                <Text style={[styles.amountLabel, { color: C.emerald700 }]}>PAID</Text>
                <Text style={[styles.amountValue, { color: C.emerald700 }]}>
                  {INR(paid)}
                </Text>
              </View>
              <View style={[styles.amountBlock, { alignItems: "flex-end" }]}>
                <Text style={[styles.amountLabel, { color: isFullyPaid ? C.emerald700 : C.indigo }]}>
                  {isFullyPaid ? "STATUS" : "BALANCE"}
                </Text>
                <Text
                  style={[
                    styles.amountValue,
                    { color: isFullyPaid ? C.emerald700 : C.indigo },
                  ]}
                >
                  {isFullyPaid ? "✓ Paid" : INR(balance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Transaction id pill */}
        {!!payment.paymentTxnId && (
          <View style={styles.txnPill}>
            <Ionicons name="document-text-outline" size={11} color={C.purple} />
            <Text style={styles.txnLabel}>TXN</Text>
            <Text style={styles.txnText} numberOfLines={1}>{payment.paymentTxnId}</Text>
          </View>
        )}

        {/* Rejection reason */}
        {!!payment.paymentRejectReason && status === "REJECTED" && (
          <View style={styles.rejectBox}>
            <Ionicons name="alert-circle" size={13} color={C.red} />
            <Text style={styles.rejectText} numberOfLines={2}>
              {payment.paymentRejectReason}
            </Text>
          </View>
        )}

        {/* Footer hint — emphasised for "to verify" */}
        <View
          style={[
            styles.viewLeadHint,
            isUrgent && { backgroundColor: C.amberLight, borderColor: C.amber, borderWidth: 1, borderRadius: 9 },
          ]}
        >
          <Ionicons
            name={isUrgent ? "checkmark-done-circle" : "open-outline"}
            size={13}
            color={isUrgent ? C.amber : C.emerald600}
          />
          <Text
            style={[
              styles.viewLeadText,
              { color: isUrgent ? "#8A6420" : C.emerald700 },
            ]}
          >
            {isUrgent ? "Tap to review & verify payment" : "Tap to view lead"}
          </Text>
          <View style={{ flex: 1 }} />
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isUrgent ? C.amber : C.emerald600}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 20, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "bold", marginTop: 2 },

  heroBlock: { flexDirection: "row", alignItems: "flex-end", marginTop: 12, paddingHorizontal: 4 },
  heroLabel: { fontFamily: DISPLAY, fontSize: 10.5, color: "rgba(255,255,255,0.8)", fontWeight: "bold", letterSpacing: 1 },
  heroAmount: { fontFamily: DISPLAY, fontSize: 28, color: "#fff", fontWeight: "bold", marginTop: 3, letterSpacing: -0.5 },
  heroPctPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" },
  heroPctText: { fontFamily: DISPLAY, color: "#fff", fontSize: 13, fontWeight: "bold" },

  // Floating stats
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1, justifyContent: "center", minWidth: 0 },
  statIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold" },
  statLabel: { fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold", marginTop: 1, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 14, paddingHorizontal: 12, height: 44,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, paddingVertical: 0 },

  // Tabs
  // flexShrink:0 stops the tab strip from collapsing when the keyboard opens
  // and the window resizes — the FlatList (flex:1) absorbs the height change.
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8, flexDirection: "row" },
  list: { flex: 1 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  tabText: { fontFamily: DISPLAY, fontSize: 12, color: C.text, fontWeight: "bold" },
  tabBadge: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#EFE7D6" },
  tabBadgeText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: C.text },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FBEDEB", borderRadius: 10, borderWidth: 1, borderColor: "rgba(192,69,59,0.2)" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 14, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 10 },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase" },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: C.amber },
  urgentBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9, fontWeight: "bold", letterSpacing: 0.4 },
  cardTime: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "bold" },

  // Customer
  customerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: "bold", letterSpacing: 0.5 },
  cardName: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.ink },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  cardMetaText: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600", flexShrink: 1 },
  cardMetaDot: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "bold" },

  // Payment block
  payBlock: {
    backgroundColor: "#FBF8F1", borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: C.border, marginBottom: 6,
  },
  payBarTrack: { height: 6, backgroundColor: "#EFE7D6", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  payBarFill: { height: "100%", borderRadius: 3 },
  amountsRow: { flexDirection: "row", justifyContent: "space-between" },
  amountBlock: { flex: 1 },
  amountLabel: { fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.4 },
  amountValue: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink, marginTop: 2 },

  // Txn pill
  txnPill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.purple + "1A", marginBottom: 8 },
  txnLabel: { fontFamily: DISPLAY, fontSize: 9, color: C.purple, fontWeight: "bold", letterSpacing: 0.5 },
  txnText: { fontSize: 11, color: C.text, fontWeight: "bold", fontFamily: "monospace", maxWidth: 180 },

  // Reject reason
  rejectBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    padding: 10, borderRadius: 10, backgroundColor: C.redLight,
    borderLeftWidth: 3, borderLeftColor: C.red, marginBottom: 8,
  },
  rejectText: { fontFamily: DISPLAY, color: C.red, fontSize: 11.5, flex: 1, fontWeight: "600", lineHeight: 15 },

  // Footer hint
  viewLeadHint: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 2, paddingVertical: 6, paddingHorizontal: 8,
  },
  viewLeadText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold" },
});
