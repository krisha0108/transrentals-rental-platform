// screens/travel-agent/fleet/FleetInsuranceScreen.js
// Phase 9 / C1 — Fleet insurance & compliance dashboard.
// Mirrors web src/app/travel-agent/(dashboard)/fleet/insurance/page.tsx:
// summary buckets (expired/expiring/valid/not-added by insurance validity),
// search, status filter, per-vehicle doc status (insurance/fitness/permit).
// "Manage" opens the full AddEditFleet edit screen (which already has all the
// document fields), instead of duplicating the web's upload modal.
//
// REDESIGNED — UI only. Repainted into the warm "Elevate" language already used
// by TravelAgentDashboardScreen and FleetCalendarScreen (ivory ground, forest→
// emerald gradient hero with floating orbs, serif display type, glass cards) so
// the two fleet screens read as one product.
//
// ⚠️ No behaviour changed: identical state, load(), useFocusEffect, summary /
// filtered memos, filter keys, navigation targets and field reads. The doc
// triplet moved from three cramped columns to a vertical list purely so the
// insurer name and days-left have room to render without truncating.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, StatusBar,
  Animated, Easing, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import RemoteImage from "../_shared/RemoteImage";
import { listTravelAgentFleet } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G, TONES } from "../_shared/theme";

// ── Warm palette (shared with FleetCalendarScreen) ──────────────────
// Local key names are kept so no JSX changes are needed — only the VALUES now
const GOLD = "#E4C066";
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

// Same four semantic buckets as before — labels and icons unchanged, tones
// re-mixed to sit on the ivory ground instead of the old cool slate.
const STATUS_META = {
  expired:  { fg: "#8A2F27",         bg: T.redL,        bar: T.red,     label: "Expired",   icon: "shield" },
  expiring: { fg: TONES.amber.ink,   bg: T.tintGold,    bar: T.gold,    label: "Expiring",  icon: "alert-circle" },
  valid:    { fg: T.emeraldDeep,     bg: T.tintEmerald, bar: T.emerald, label: "Valid",     icon: "shield-checkmark" },
  missing:  { fg: T.muted,           bg: T.tintSand,    bar: T.sand,    label: "Not added", icon: "help-circle" },
};

// Summary tiles, in display order. `key` doubles as the filter value so a tap
// maps straight onto the existing `filter` state.
const SUMMARY_TILES = [
  { key: "expired", hint: "need renewal" },
  { key: "expiring", hint: "within 30 days" },
  { key: "valid", hint: "in policy" },
  { key: "missing", hint: "missing details" },
];

function statusOf(date) {
  if (!date) return "missing";
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}
function daysLeft(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function worstStatus(f) {
  const order = ["expired", "expiring", "missing", "valid"];
  const ss = [statusOf(f.insuranceValidity), statusOf(f.fitnessValidity)];
  for (const s of order) if (ss.includes(s)) return s;
  return "valid";
}
function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Softly drifting bubble behind the hero gradient (same motion as the calendar
// screen). Purely decorative; native-driven so it costs nothing on the JS thread.
function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 5200, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return <Animated.View pointerEvents="none" style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]} />;
}

export default function FleetInsuranceScreen({ navigation }) {
  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentFleet();
      setFleets(data?.fleets || data?.fleet || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load fleet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const summary = useMemo(() => {
    const b = { expired: 0, expiring: 0, valid: 0, missing: 0 };
    for (const f of fleets) b[statusOf(f.insuranceValidity)]++;
    return b;
  }, [fleets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fleets.filter((f) => {
      if (q) {
        const hay = [f.vehicleName, f.brand, f.model, f.registrationNumber, f.insuranceProvider]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter !== "ALL" && worstStatus(f) !== filter) return false;
      return true;
    });
  }, [fleets, search, filter]);

  // The chip row that used to render these was removed — filtering now happens
  // entirely through the summary tiles (tap to select, tap again to clear back
  // to "ALL"). `filter` state and the `filtered` memo above are unchanged.

  // Render-time derivations from state already above — no new data or effects.
  const total = summary.expired + summary.expiring + summary.valid + summary.missing;
  const needsAttention = summary.expired + summary.expiring;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={T.forestDark} />

      {/* ===== Gradient hero ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>FLEET COMPLIANCE</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>Insurance &amp; Documents</Text>
              <View style={styles.headerBadgeRow}>
                <View style={styles.headerBadge}>
                  <Ionicons name="car-sport" size={10} color="#fff" />
                  <Text style={styles.headerBadgeText}>{total} vehicles</Text>
                </View>
                {needsAttention > 0 && (
                  <View style={[styles.headerBadge, styles.headerBadgeWarn]}>
                    <Ionicons name="alert-circle" size={10} color="#2A1A05" />
                    <Text style={[styles.headerBadgeText, { color: "#2A1A05" }]}>
                      {needsAttention} need attention
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating search bar =====
          Deliberately a SIBLING of the ScrollView (not a child), same as the
          calendar screen's stats strip. That's what lets it use a negative
          marginTop to straddle the hero without being clipped, and it keeps
          search reachable while the list scrolls underneath. */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={C.subText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicle, registration or insurer…"
          placeholderTextColor={C.subText}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={C.subText} /></TouchableOpacity>
        )}
      </View>

      {/* ===== Sticky compliance card =====
          Sibling of the ScrollView (like the search bar above it), so it stays
          pinned while only the vehicle list below scrolls. */}
      <View style={styles.complianceCard}>
        <View style={styles.complianceHead}>
          <Text style={styles.complianceTitle}>Insurance status</Text>
          {/* Doubles as the "show everything" reset. Highlighted while no
              status tile is selected, which is the default on open. */}
          <TouchableOpacity
            style={[styles.allChip, filter === "ALL" && styles.allChipActive]}
            onPress={() => setFilter("ALL")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === "ALL" }}
            accessibilityLabel={`Show all ${total} vehicles`}
          >
            <Ionicons
              name="albums-outline"
              size={11}
              color={filter === "ALL" ? "#fff" : C.subText}
            />
            <Text style={[styles.allChipText, filter === "ALL" && { color: "#fff" }]}>
              All {total}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Proportional bar — segments sized off the same summary buckets */}
        <View style={styles.barTrack}>
          {total > 0 ? (
            ["expired", "expiring", "valid", "missing"].map((k) =>
              summary[k] > 0 ? (
                <View
                  key={k}
                  style={{ flex: summary[k], backgroundColor: STATUS_META[k].bar }}
                />
              ) : null
            )
          ) : (
            <View style={{ flex: 1, backgroundColor: C.border }} />
          )}
        </View>

        {/* Tiles double as filter shortcuts — tapping one selects that status,
            tapping the selected one clears back to "All". */}
        <View style={styles.summaryGrid}>
          {SUMMARY_TILES.map((t) => (
            <SummaryTile
              key={t.key}
              meta={STATUS_META[t.key]}
              count={summary[t.key]}
              hint={t.hint}
              active={filter === t.key}
              onPress={() => setFilter(filter === t.key ? "ALL" : t.key)}
            />
          ))}
        </View>
      </View>

      {/* Only this list scrolls. flex:1 so it claims exactly the space left
          under the pinned hero / search / compliance card. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
      >
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={C.emerald600} />
            <Text style={styles.stateText}>Loading fleet…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <View style={[styles.stateIconWrap, { backgroundColor: C.redLight }]}>
              <Ionicons name="alert-circle-outline" size={34} color={C.red} />
            </View>
            <Text style={styles.stateTitle}>Couldn’t load fleet</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn} activeOpacity={0.85}>
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateWrap}>
            <View style={[styles.stateIconWrap, { backgroundColor: C.emerald50 }]}>
              <Ionicons name="shield-checkmark-outline" size={34} color={C.emerald600} />
            </View>
            <Text style={styles.stateTitle}>Nothing here</Text>
            <Text style={styles.stateText}>No vehicles match the filter.</Text>
          </View>
        ) : (
          filtered.map((f) => {
            const worst = worstStatus(f);
            const wm = STATUS_META[worst];
            return (
              // The whole card is the "Manage" target now — same navigate() the
              // full-width CTA used to fire, just without spending 52px on a
              // button. The chevron is the affordance.
              <TouchableOpacity
                key={f.id}
                style={styles.vCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("TAAddEditFleet", { vehicle: f })}
                accessibilityRole="button"
                accessibilityLabel={`${f.vehicleName}. ${wm.label}. Manage documents`}
              >
                {/* Lifecycle stripe — instant read of the vehicle's worst doc */}
                <View style={[styles.vStripe, { backgroundColor: wm.bar }]} />

                <View style={styles.vBody}>
                  <View style={styles.vHead}>
                    {f.coverImage ? (
                      <RemoteImage source={{ uri: f.coverImage }} style={styles.vThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.vThumb, styles.vThumbPlaceholder]}>
                        <Ionicons name="car" size={18} color={C.subText} />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.vName} numberOfLines={1}>{f.vehicleName}</Text>
                      {/* Registration and insurer share one line — the insurer
                          used to sit inside the Insurance row, which is gone. */}
                      <Text style={styles.vMeta} numberOfLines={1}>
                        {f.registrationNumber || f.vehicleType || "—"}
                        {!!f.insuranceProvider && ` · ${f.insuranceProvider}`}
                      </Text>
                    </View>
                    <View style={[styles.vStatusPill, { backgroundColor: wm.bg }]}>
                      <Ionicons name={wm.icon} size={9} color={wm.fg} />
                      <Text style={[styles.vStatusText, { color: wm.fg }]}>{wm.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={C.subText} />
                  </View>

                  <View style={styles.docGrid}>
                    <DocCol
                      title="Insurance"
                      status={statusOf(f.insuranceValidity)}
                      date={fmtDate(f.insuranceValidity)}
                      dleft={daysLeft(f.insuranceValidity)}
                    />
                    <DocCol
                      title="Fitness"
                      status={statusOf(f.fitnessValidity)}
                      date={fmtDate(f.fitnessValidity)}
                      dleft={daysLeft(f.fitnessValidity)}
                    />
                    <DocCol
                      title="Permit"
                      status={f.permitImage ? "valid" : "missing"}
                      date={f.permitType || (f.permitImage ? "Uploaded" : "—")}
                      dleft={null}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function SummaryTile({ meta, count, hint, active, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.summaryTile,
        { backgroundColor: meta.bg },
        active && { borderColor: meta.fg },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={`${meta.label}: ${count} vehicles, ${hint}`}
    >
      <View style={styles.summaryTop}>
        <Ionicons name={meta.icon} size={13} color={meta.fg} />
        <Text style={[styles.summaryLabel, { color: meta.fg }]} numberOfLines={1}>{meta.label}</Text>
        {active && (
          <Ionicons name="checkmark-circle" size={12} color={meta.fg} style={styles.summaryTick} />
        )}
      </View>
      <Text style={[styles.summaryCount, { color: meta.fg }]}>{count}</Text>
      <Text style={[styles.summaryHint, { color: meta.fg }]} numberOfLines={1}>{hint}</Text>
    </TouchableOpacity>
  );
}

// One compact column per document, three across. A coloured top rule + dot
// carries the status instead of a text badge, which is what let the card shrink.
// The days-left guard and format are the originals; when they don't apply the
// column falls back to the status label so nothing is left blank.
function DocCol({ title, status, date, dleft }) {
  const m = STATUS_META[status] || STATUS_META.missing;
  const showDays = dleft !== null && status !== "missing";
  return (
    <View style={styles.docCol}>
      <View style={[styles.docRule, { backgroundColor: m.bar }]} />
      <Text style={styles.docColTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.docColDate} numberOfLines={1}>{date}</Text>
      <View style={styles.docColFoot}>
        <View style={[styles.docDot, { backgroundColor: m.bar }]} />
        <Text
          style={[styles.docColState, { color: m.fg }, status === "expired" && { color: C.red }]}
          numberOfLines={1}
        >
          {showDays
            ? (dleft < 0 ? `${Math.abs(dleft)}d ago` : `${dleft}d left`)
            : m.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Hero ──
  hero: { overflow: "hidden", borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  orbA: {
    position: "absolute", top: -30, right: -26, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(23,166,124,0.22)",
  },
  orbB: {
    position: "absolute", bottom: -46, left: -30, width: 122, height: 122,
    borderRadius: 61, backgroundColor: "rgba(228,192,102,0.14)",
  },
  // paddingTop pushes the whole header block (eyebrow → title → badges) down off
  // the status bar. Applied to the row, not the text block, so the back button
  // drops with it and stays aligned to the title.
  headerRow: { flexDirection: "row", alignItems: "flex-start", paddingTop: 14, gap: 10 },
  headerCircleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitleBlock: { flex: 1, minWidth: 0, paddingTop: 1 },
  headerEyebrow: {
    fontFamily: DISPLAY, fontSize: 9.5, color: GOLD, fontWeight: "bold",
    letterSpacing: 1.4, includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: DISPLAY, fontSize: 21, fontWeight: "bold", color: "#fff",
    marginTop: 3, includeFontPadding: false,
  },
  headerBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 9 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  headerBadgeWarn: { backgroundColor: GOLD, borderColor: GOLD },
  headerBadgeText: {
    fontFamily: DISPLAY, fontSize: 10, color: "#fff", fontWeight: "bold",
    includeFontPadding: false,
  },

  // ── Floating compliance card ──
  // Pinned: a sibling of the ScrollView, so it never scrolls away. Keep it that
  // way — when this card lived inside the ScrollView a negative marginTop got
  // clipped against the header, which is what made it look hidden.
  complianceCard: {
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 18, padding: 12,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 5 },
    }),
  },
  complianceHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  complianceTitle: {
    fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink,
    includeFontPadding: false,
  },
  allChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    backgroundColor: FILL, borderWidth: 1, borderColor: C.border,
  },
  allChipActive: { backgroundColor: C.emerald700, borderColor: C.emerald700 },
  allChipText: {
    fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.text,
    includeFontPadding: false, fontVariant: ["tabular-nums"],
  },
  barTrack: {
    flexDirection: "row", height: 6, borderRadius: 999, overflow: "hidden",
    backgroundColor: C.border, marginTop: 8,
  },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  // Border is always present but transparent when unselected, so toggling the
  // active ring never reflows the grid.
  summaryTile: {
    width: "47.8%", flexGrow: 1, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1.5, borderColor: "transparent",
  },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  summaryTick: { marginLeft: "auto" },
  summaryLabel: {
    fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.5,
    textTransform: "uppercase", includeFontPadding: false, flexShrink: 1,
  },
  summaryCount: {
    fontFamily: DISPLAY, fontSize: 19, fontWeight: "bold", lineHeight: 22,
    marginTop: 2, includeFontPadding: false, fontVariant: ["tabular-nums"],
  },
  summaryHint: {
    fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "600", opacity: 0.85,
    lineHeight: 12, includeFontPadding: false,
  },

  // ── Search ──
  // Floats over the hero's lower edge (negative marginTop) — only safe because
  // this View is a sibling of the ScrollView, not a child of it.
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: -24, zIndex: 2,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  searchInput: {
    fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, padding: 0,
    includeFontPadding: false,
  },

  // ── Loading / error / empty ──
  stateWrap: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 44, gap: 8 },
  stateIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  stateTitle: {
    fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink,
    includeFontPadding: false,
  },
  stateText: {
    fontFamily: DISPLAY, color: C.subText, fontSize: 12.5, textAlign: "center",
    lineHeight: 18, includeFontPadding: false,
  },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
    backgroundColor: C.emerald600, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 999,
  },
  retryText: {
    fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 12.5,
    includeFontPadding: false,
  },

  // ── Vehicle card (compact) ──
  // Deliberately lighter than the compliance card above it: thin stripe, small
  // radius, hairline border, no pastel fills — so the two don't read as siblings.
  vCard: {
    flexDirection: "row", overflow: "hidden",
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  vStripe: { width: 3 },
  vBody: { flex: 1, minWidth: 0, paddingHorizontal: 11, paddingVertical: 10 },

  vHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  vThumb: { width: 42, height: 42, borderRadius: 11, backgroundColor: FILL },
  vThumbPlaceholder: {
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  vName: {
    fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink,
    includeFontPadding: false,
  },
  vMeta: {
    fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600",
    letterSpacing: 0.2, marginTop: 2, includeFontPadding: false,
  },
  vStatusPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999,
  },
  vStatusText: {
    fontFamily: DISPLAY, fontSize: 8.5, fontWeight: "bold",
    includeFontPadding: false,
  },

  // ── Document columns (3 across) ──
  docGrid: { flexDirection: "row", gap: 7, marginTop: 10 },
  docCol: {
    flex: 1, minWidth: 0, overflow: "hidden",
    backgroundColor: FILL, borderRadius: 9,
    paddingHorizontal: 7, paddingTop: 7, paddingBottom: 6,
  },
  docRule: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  docColTitle: {
    fontFamily: DISPLAY, fontSize: 8, fontWeight: "bold", color: C.subText,
    letterSpacing: 0.5, textTransform: "uppercase", includeFontPadding: false,
  },
  docColDate: {
    fontFamily: DISPLAY, fontSize: 11, color: C.ink, fontWeight: "bold",
    lineHeight: 14, marginTop: 2, includeFontPadding: false,
  },
  docColFoot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  docDot: { width: 5, height: 5, borderRadius: 2.5 },
  docColState: {
    fontFamily: DISPLAY, fontSize: 9, fontWeight: "bold", flexShrink: 1,
    includeFontPadding: false, fontVariant: ["tabular-nums"],
  },
});
