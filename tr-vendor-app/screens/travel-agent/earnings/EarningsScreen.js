// screens/travel-agent/earnings/EarningsScreen.js
// REDESIGNED — emerald-themed Earnings dashboard. Mirrors web
// /travel-agent/earnings: period selector, big revenue hero, summary cards,
// 6-month bar chart, breakdown by booking type, recent transactions.
//
// GET /api/travel-agent/earnings?period=month|last30|year|all
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { BarChart } from "react-native-chart-kit";
import { getTravelAgentEarnings, EARNINGS_PERIODS } from "../../api/travelAgentClient";

const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald500: "#10B981",
  emerald400: "#34D399",
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
  indigo: "#6366F1",
  indigoLight: "#E0E7FF",
};

const TYPE_META = {
  TOUR:       { color: C.emerald600, bg: C.emerald50,    icon: "map",           label: "Tour" },
  PROPERTY:   { color: C.amber,      bg: C.amberLight,   icon: "bed",           label: "Property" },
  TRANSPORT:  { color: C.blue,       bg: C.blueLight,    icon: "car",           label: "Transport" },
  CUSTOM:     { color: C.purple,     bg: C.purpleLight,  icon: "construct",     label: "Custom" },
  FLEET:      { color: C.indigo,     bg: C.indigoLight,  icon: "car-sport",     label: "Fleet" },
  LEAD_QUOTE: { color: C.red,        bg: C.redLight,     icon: "document-text", label: "Lead quote" },
};
const KIND_META = {
  BOOKING: { color: C.blue,    icon: "receipt" },
  LEAD:    { color: C.purple,  icon: "person" },
  FLEET:   { color: C.indigo,  icon: "car-sport" },
};
const PERIOD_META = {
  month:  { label: "This month",   short: "Month",  icon: "calendar" },
  last30: { label: "Last 30 days", short: "30d",    icon: "today" },
  year:   { label: "This year",    short: "Year",   icon: "calendar-clear" },
  all:    { label: "All time",     short: "All",    icon: "infinite" },
};

const SCREEN_W = Dimensions.get("window").width;

const INR = (n) => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const fmtMonth = (ym) => {
  if (!ym) return "";
  try {
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("en-IN", { month: "short" });
  } catch { return ym; }
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
};

export default function EarningsScreen({ navigation }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getTravelAgentEarnings(period);
      setData(res);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const trend = data?.trend || [];
  const summary = data?.summary || {};
  const breakdown = data?.breakdownByType || [];
  const recent = data?.recent || [];

  const trendMax = Math.max(0, ...trend.map((t) => Number(t.revenue) || 0));
  const breakdownTotal = breakdown.reduce((s, b) => s + Number(b.amount || 0), 0);
  const hasChartData = trend.length > 0 && trendMax > 0;

  const chartData = useMemo(() => ({
    labels: trend.map((t) => fmtMonth(t.month)),
    datasets: [{ data: trend.map((t) => Math.round(Number(t.revenue) || 0)) }],
  }), [trend]);

  // Derived metrics for the hero
  const totalRev = Number(summary.totalRevenue) || 0;
  const collected = Number(summary.collectedRevenue) || 0;
  const pending = Number(summary.pendingRevenue) || 0;
  const collectionPct = totalRev > 0 ? Math.round((collected / totalRev) * 100) : 0;
  const delta = summary?.trend?.deltaPercent;
  const hasTrend = typeof delta === "number" && !isNaN(delta);
  const positive = (delta || 0) >= 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient hero header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 70 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Earnings</Text>
              <Text style={styles.headerSub}>{PERIOD_META[period].label}</Text>
            </View>
            <TouchableOpacity onPress={load} style={styles.iconBtn}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Hero amount block */}
          <View style={styles.heroAmountBlock}>
            <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
            <Text style={styles.heroAmount} numberOfLines={1}>
              {loading ? "—" : INR(summary.totalRevenue)}
            </Text>
            {hasTrend && !loading && (
              <View style={[styles.heroTrend, { backgroundColor: positive ? "rgba(255,255,255,0.2)" : "rgba(239,68,68,0.85)" }]}>
                <Ionicons
                  name={positive ? "trending-up" : "trending-down"}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.heroTrendText}>
                  {Math.abs(delta).toFixed(1)}% vs previous
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Period selector (floats over header) ===== */}
      <View style={styles.periodsWrap}>
        <View style={styles.periodsCard}>
          {EARNINGS_PERIODS.map((p) => {
            const active = period === p;
            const meta = PERIOD_META[p];
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.85}
              >
                <Ionicons name={meta.icon} size={12} color={active ? "#fff" : C.subText} />
                <Text style={[styles.periodText, active && styles.periodTextActive]}>
                  {meta.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
          <Text style={styles.loadingText}>Loading earnings…</Text>
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
          {/* ===== Collection progress card ===== */}
          {totalRev > 0 && (
            <View style={styles.collectCard}>
              <View style={styles.collectHeader}>
                <View style={styles.collectIconWrap}>
                  <Ionicons name="checkmark-done-circle" size={18} color={C.emerald600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.collectTitle}>Collection progress</Text>
                  <Text style={styles.collectSub}>
                    {collectionPct}% collected from total revenue
                  </Text>
                </View>
                <View style={styles.collectPctPill}>
                  <Text style={styles.collectPctText}>{collectionPct}%</Text>
                </View>
              </View>

              {/* Progress bar (emerald gradient) */}
              <View style={styles.collectBarTrack}>
                <LinearGradient
                  colors={[C.emerald500, C.emerald600]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.collectBarFill, { width: `${collectionPct}%` }]}
                />
              </View>

              <View style={styles.collectStatsRow}>
                <View style={styles.collectStat}>
                  <View style={[styles.collectDot, { backgroundColor: C.emerald600 }]} />
                  <View>
                    <Text style={styles.collectStatLabel}>Collected</Text>
                    <Text style={[styles.collectStatValue, { color: C.emerald700 }]}>
                      {INR(collected)}
                    </Text>
                  </View>
                </View>
                <View style={styles.collectStat}>
                  <View style={[styles.collectDot, { backgroundColor: C.amber }]} />
                  <View>
                    <Text style={styles.collectStatLabel}>Pending</Text>
                    <Text style={[styles.collectStatValue, { color: C.amber }]}>
                      {INR(pending)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ===== Summary cards (4 in 2x2 grid) ===== */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Bookings"
              value={String(summary.bookingCount ?? 0)}
              color={C.blue}
              icon="receipt"
              isText
            />
            <SummaryCard
              label="Avg booking"
              value={
                summary.bookingCount > 0
                  ? INR(totalRev / Number(summary.bookingCount))
                  : "—"
              }
              color={C.purple}
              icon="trending-up"
            />
          </View>

          {/* ===== Trend chart ===== */}
          <SectionLabel icon="bar-chart" color={C.emerald600} label="Last 6 months" />
          <View style={styles.chartCard}>
            {hasChartData ? (
              <>
                <BarChart
                  data={chartData}
                  width={SCREEN_W - 56}
                  height={200}
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: C.card,
                    backgroundGradientFrom: C.card,
                    backgroundGradientTo: C.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                    labelColor: () => C.subText,
                    propsForLabels: { fontSize: 10, fontWeight: "700" },
                    barPercentage: 0.55,
                    fillShadowGradientFrom: C.emerald600,
                    fillShadowGradientTo: C.emerald400,
                    fillShadowGradientFromOpacity: 1,
                    fillShadowGradientToOpacity: 0.7,
                  }}
                  style={{ borderRadius: 12, marginLeft: -10 }}
                />
                <View style={styles.chartFooter}>
                  <Ionicons name="information-circle" size={11} color={C.subText} />
                  <Text style={styles.chartFooterText}>
                    Monthly revenue across all booking types
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.chartEmpty}>
                <View style={styles.chartEmptyIconWrap}>
                  <Ionicons name="bar-chart-outline" size={32} color={C.emerald600} />
                </View>
                <Text style={styles.chartEmptyTitle}>No revenue yet</Text>
                <Text style={styles.chartEmptyBody}>
                  Your monthly revenue chart will appear here once bookings close.
                </Text>
              </View>
            )}
          </View>

          {/* ===== Breakdown by type ===== */}
          {breakdown.length > 0 && (
            <>
              <SectionLabel icon="pie-chart" color={C.purple} label="Breakdown by type" />
              <View style={styles.card}>
                {breakdown.map((b, i) => {
                  const meta = TYPE_META[b.type] || TYPE_META.CUSTOM;
                  const pct = breakdownTotal > 0
                    ? Math.round((Number(b.amount) / breakdownTotal) * 100)
                    : 0;
                  return (
                    <View
                      key={b.type}
                      style={[styles.breakdownRow, i > 0 && styles.breakdownRowBorder]}
                    >
                      <View style={[styles.breakdownIcon, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={16} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.breakdownTopLine}>
                          <Text style={styles.breakdownLabel}>{meta.label}</Text>
                          <Text style={[styles.breakdownAmount, { color: meta.color }]}>
                            {INR(b.amount)}
                          </Text>
                        </View>
                        <View style={styles.breakdownBarTrack}>
                          <View
                            style={[
                              styles.breakdownBarFill,
                              { width: `${pct}%`, backgroundColor: meta.color },
                            ]}
                          />
                        </View>
                        <View style={styles.breakdownBottomLine}>
                          <Text style={styles.breakdownMeta}>
                            {b.count} item{b.count > 1 ? "s" : ""}
                          </Text>
                          <View style={[styles.breakdownPctPill, { backgroundColor: meta.bg }]}>
                            <Text style={[styles.breakdownPctText, { color: meta.color }]}>
                              {pct}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ===== Recent transactions ===== */}
          {recent.length > 0 && (
            <>
              <SectionLabel
                icon="time"
                color={C.blue}
                label="Recent transactions"
                rightBadge={`${recent.length}`}
              />
              <View style={styles.card}>
                {recent.map((r, i) => {
                  const km = KIND_META[r.kind] || KIND_META.BOOKING;
                  const paid = Number(r.paidAmount) || 0;
                  const amount = Number(r.amount) || 0;
                  const fullyPaid = paid >= amount && amount > 0;
                  return (
                    <View
                      key={`${r.kind}-${r.id || i}`}
                      style={[styles.recentRow, i > 0 && styles.recentRowBorder]}
                    >
                      <View style={[styles.recentIcon, { backgroundColor: `${km.color}1A` }]}>
                        <Ionicons name={km.icon} size={15} color={km.color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.recentTitle} numberOfLines={1}>
                          {r.customerName || r.title || r.ref || "—"}
                        </Text>
                        <View style={styles.recentMetaRow}>
                          <Text style={styles.recentSub} numberOfLines={1}>
                            {r.type ? r.type.replace("_", " ") : r.kind}
                          </Text>
                          <Text style={styles.recentSubDot}>·</Text>
                          <Text style={styles.recentSub} numberOfLines={1}>
                            {fmtDate(r.date)}
                          </Text>
                        </View>
                        {!!r.status && (
                          <View
                            style={[
                              styles.recentStatusPill,
                              { backgroundColor: `${km.color}1A` },
                            ]}
                          >
                            <Text style={[styles.recentStatusText, { color: km.color }]}>
                              {r.status}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.recentAmount}>{INR(r.amount)}</Text>
                        {paid > 0 && (
                          <View style={styles.recentPaidPill}>
                            <Ionicons
                              name={fullyPaid ? "checkmark-circle" : "ellipse"}
                              size={9}
                              color={fullyPaid ? C.emerald600 : C.amber}
                            />
                            <Text
                              style={[
                                styles.recentPaidText,
                                { color: fullyPaid ? C.emerald600 : C.amber },
                              ]}
                            >
                              {fullyPaid ? "Fully paid" : `${INR(paid)} paid`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ===== Empty state (entire screen) ===== */}
          {breakdown.length === 0 && recent.length === 0 && totalRev === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cash-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>No earnings yet</Text>
              <Text style={styles.emptyBody}>
                Convert leads or close bookings to start earning. Your collected revenue will show here.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SummaryCard({ label, value, color, icon, isText }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={[styles.summaryIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, { color }, isText && { fontSize: 22 }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionLabel({ icon, color, label, rightBadge }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
      {!!rightBadge && (
        <View style={[styles.sectionLabelBadge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.sectionLabelBadgeText, { color }]}>{rightBadge}</Text>
        </View>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },

  heroAmountBlock: { marginTop: 18, paddingHorizontal: 4 },
  heroLabel: { fontSize: 10.5, color: "rgba(255,255,255,0.8)", fontWeight: "800", letterSpacing: 1 },
  heroAmount: { fontSize: 36, color: "#fff", fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },
  heroTrend: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  heroTrendText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Period selector (floats over header)
  periodsWrap: { marginTop: -28, marginHorizontal: 16, marginBottom: 4 },
  periodsCard: {
    flexDirection: "row", padding: 4, gap: 4,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  periodChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 9, borderRadius: 10,
    backgroundColor: "transparent",
  },
  periodChipActive: { backgroundColor: C.emerald600 },
  periodText: { fontSize: 11.5, fontWeight: "700", color: C.subText },
  periodTextActive: { color: "#fff", fontWeight: "800" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 },

  // Collection card
  collectCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  collectHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  collectIconWrap: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  collectTitle: { fontSize: 13.5, fontWeight: "800", color: C.ink },
  collectSub: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 1 },
  collectPctPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600 },
  collectPctText: { fontSize: 13, fontWeight: "900", color: C.emerald700 },

  collectBarTrack: { height: 10, backgroundColor: "#F1F5F9", borderRadius: 5, overflow: "hidden", marginBottom: 12 },
  collectBarFill: { height: "100%", borderRadius: 5 },

  collectStatsRow: { flexDirection: "row", gap: 12 },
  collectStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  collectDot: { width: 10, height: 10, borderRadius: 5 },
  collectStatLabel: { fontSize: 10.5, color: C.subText, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  collectStatValue: { fontSize: 14, fontWeight: "900", marginTop: 1 },

  // Summary grid
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 4 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 4,
  },
  summaryIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryLabel: { fontSize: 11, color: C.subText, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  summaryValue: { fontSize: 18, fontWeight: "900", marginTop: 4 },

  // Section label
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, marginBottom: 10 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase", flex: 1 },
  sectionLabelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionLabelBadgeText: { fontSize: 11, fontWeight: "900" },

  // Chart card
  chartCard: {
    backgroundColor: C.card, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  chartFooter: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 },
  chartFooterText: { fontSize: 10.5, color: C.subText, fontWeight: "600", fontStyle: "italic" },
  chartEmpty: { alignItems: "center", padding: 24, gap: 8 },
  chartEmptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  chartEmptyTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  chartEmptyBody: { fontSize: 12, color: C.subText, textAlign: "center", paddingHorizontal: 8, lineHeight: 17, fontWeight: "500" },

  // Generic card
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  // Breakdown
  breakdownRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 10 },
  breakdownRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  breakdownIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  breakdownTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  breakdownLabel: { fontSize: 13.5, fontWeight: "800", color: C.ink },
  breakdownAmount: { fontSize: 13.5, fontWeight: "900" },
  breakdownBarTrack: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, marginVertical: 6, overflow: "hidden" },
  breakdownBarFill: { height: "100%", borderRadius: 3 },
  breakdownBottomLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breakdownMeta: { fontSize: 11, color: C.subText, fontWeight: "700" },
  breakdownPctPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  breakdownPctText: { fontSize: 10.5, fontWeight: "900" },

  // Recent
  recentRow: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 11 },
  recentRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  recentIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  recentTitle: { fontSize: 13.5, fontWeight: "800", color: C.ink },
  recentMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  recentSub: { fontSize: 11, color: C.subText, fontWeight: "600" },
  recentSubDot: { fontSize: 11, color: C.subText, fontWeight: "800" },
  recentStatusPill: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  recentStatusText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
  recentAmount: { fontSize: 14, fontWeight: "900", color: C.ink },
  recentPaidPill: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  recentPaidText: { fontSize: 10, fontWeight: "800" },

  // Empty
  emptyState: { alignItems: "center", padding: 24, paddingTop: 32 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
});
