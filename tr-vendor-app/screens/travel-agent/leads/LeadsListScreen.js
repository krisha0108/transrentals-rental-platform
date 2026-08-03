// screens/travel-agent/leads/LeadsListScreen.js
// REDESIGNED — built to the supplied reference: forest hero (the dashboard's
// own G.hero gradient) carrying kicker / title / subtitle + three glass stat
// cards, a white search card tucked into the hero's curve, a segmented status
// control, then scrollable Quick actions → Priority → Source → lead cards.
//
// UI ONLY. Every piece of state, the fetch, the debounce, pagination, the
// filters and all navigation targets are unchanged. The three header stats are
// the same hotCount / conversionPct / dueTodayCount that the old quick-stat row
// showed — just relocated. Quick actions render SECTION_OPS.leads through the
// shared navigateToOp helper, so the destinations are identical to the
// SectionOpsBar this screen used before (SectionOpsBar itself is untouched —
// FleetListScreen still uses it).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Platform,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { SECTION_OPS, navigateToOp } from "../_shared/SectionOpsBar";
import { DISPLAY } from "../_shared/typography";
import {
  listTravelAgentLeads,
  LEAD_STATUS,
  LEAD_PRIORITY,
  LEAD_SOURCE,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";

const { width: W } = Dimensions.get("window");

// ── Responsive scaling (mirrors TravelAgentDashboardScreen) ──────────
const BASE_W = 390;
const SCALE = Math.min(Math.max(W / BASE_W, 0.86), 1.28);
const FONT_SCALE = Math.min(Math.max(W / BASE_W, 0.92), 1.12);
const rs = (n) => Math.round(n * SCALE);
const rf = (n) => Math.round(n * FONT_SCALE * 2) / 2;

const GUT = rs(16);


const G = {
  hero:    [C.forestDark, C.forest, C.emeraldDeep],
  emerald: [C.emerald, C.emeraldDeep],
  gold:    [C.goldLight, C.gold],
  ocean:   [C.oceanLight, "#245C7A"],
};

const SOURCE_SHORT = {
  ALL: "All", MANUAL: "Manual", CAPTURE_LINK: "Capture", WEBSITE: "Website",
  REFERRAL: "Referral", WALK_IN: "Walk-in", SOCIAL_MEDIA: "Social",
  GOOGLE_ADS: "Ads", WHATSAPP: "WhatsApp", OTHER: "Other",
};

// Status tones — same status keys, re-mapped onto the warm palette.
const STATUS_COLORS = {
  NEW:         { bg: C.tintOcean,   fg: "#245C7A" },
  CONTACTED:   { bg: "#DDEFEA",     fg: "#0F6B5A" },
  INTERESTED:  { bg: C.tintEmerald, fg: C.emeraldDeep },
  QUOTED:      { bg: "#EFE9FA",     fg: "#5E43A8" },
  NEGOTIATING: { bg: "#E4EAF7",     fg: "#3A4E8C" },
  BOOKED:      { bg: C.tintEmerald, fg: C.emeraldDeep },
  LOST:        { bg: C.redL,        fg: C.red },
  COLD:        { bg: "#ECEAE3",     fg: "#6B7770" },
};
const PRIORITY_META = {
  HOT:  { fg: "#B14A64", bg: "#FBE9EE", icon: "flame", avatarBg: "#C65772" },
  WARM: { fg: "#9A6B16", bg: C.tintGold, icon: "sunny", avatarBg: C.gold },
  COLD: { fg: "#245C7A", bg: C.tintOcean, icon: "snow", avatarBg: C.ocean },
};

// Soft tints for the Quick-action cards, cycled in order.
const INR = (n) => {
  if (n == null || isNaN(Number(n))) return null;
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

function formatDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return null; }
}

function dueLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - today) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: C.red };
  if (diff === 0) return { label: "Due today", color: C.gold };
  if (diff === 1) return { label: "Due tomorrow", color: C.ocean };
  if (diff <= 7) return { label: `In ${diff}d`, color: C.ocean };
  return { label: formatDate(iso), color: C.muted };
}

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// Slowly drifting/pulsing decorative orb for the header — gentle ambient motion.
function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
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
  return (
    <Animated.View pointerEvents="none" style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]} />
  );
}

export default function LeadsListScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Quick-actions horizontal scroller — lets "Swipe →" also advance the cards.
  const qaScrollRef = useRef(null);
  const qaScrollX = useRef(0);
  const qaViewW = useRef(0);
  const qaContentW = useRef(0);
  const onSwipeHint = useCallback(() => {
    const maxX = Math.max(0, qaContentW.current - qaViewW.current);
    // Already at the end → next tap loops back to the first card.
    if (qaScrollX.current >= maxX - 4) {
      qaScrollRef.current?.scrollTo({ x: 0, animated: true });
      return;
    }
    // Advance ~one page, but clamp to the end so the last card is fully shown.
    const step = qaViewW.current ? qaViewW.current * 0.8 : rs(220);
    const next = Math.min(qaScrollX.current + step, maxX);
    qaScrollRef.current?.scrollTo({ x: next, animated: true });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setError(null);
        const data = await listTravelAgentLeads({
          page: pageNum, limit: 20,
          status: statusFilter,
          priority: priorityFilter,
          source: sourceFilter === "ALL" ? undefined : sourceFilter,
          search: debouncedSearch,
        });
        setLeads((prev) => (append ? [...prev, ...(data.leads || [])] : data.leads || []));
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Failed to load leads");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, priorityFilter, sourceFilter, debouncedSearch]
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
    for (const s of LEAD_STATUS) items.push({ key: s, label: s, count: stats?.[s] ?? null });
    return items;
  }, [stats]);

  // Quick-stat derivatives
  const hotCount = useMemo(() => leads.filter((l) => l.priority === "HOT").length, [leads]);
  const dueTodayCount = useMemo(() => leads.filter((l) => {
    const d = dueLabel(l.nextFollowUp);
    return d?.label === "Due today";
  }).length, [leads]);
  const conversionPct = stats?.total > 0
    ? Math.round(((stats?.BOOKED || 0) / stats.total) * 100)
    : null;

  const filtered = !!debouncedSearch || statusFilter !== "ALL" || priorityFilter !== "ALL" || sourceFilter !== "ALL";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Hero ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
          <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.circleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={rs(19)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => navigation.navigate("TAPipeline")}
              style={styles.circleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="git-network" size={rs(17)} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Leads</Text>
          <Text style={styles.heroSub}>
            {pagination.total > 0
              ? `${pagination.total} total${conversionPct != null ? ` · ${conversionPct}% converted` : ""}`
              : "Capture & convert enquiries"}
          </Text>

          {/* three glass stats — same numbers the old quick-stat row showed */}
          <View style={styles.statRow}>
            <HeroStat dot="#E0798F" label="Hot" value={String(hotCount)} />
            <HeroStat dot={C.oceanLight} label="Conversion" value={conversionPct != null ? `${conversionPct}%` : "—"} />
            <HeroStat dot={C.goldLight} label="Follow-ups" value={String(dueTodayCount)} />
          </View>

          <View style={{ height: rs(18) }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Search card tucked into the hero curve ── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchCard, styles.cardShadow]}>
          <Ionicons name="search" size={rs(17)} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, destination…"
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

      {/* ── Segmented status control ── */}
      <View style={styles.segWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segRow}
        >
          {statusChips.map((c) => {
            const active = statusFilter === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setStatusFilter(c.key)}
                style={[styles.seg, active && styles.segOn]}
                activeOpacity={0.85}
              >
                <Text style={[styles.segTxt, active && styles.segTxtOn]}>{c.label}</Text>
                {c.count != null && c.count > 0 && (
                  <View style={[styles.segBadge, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <Text style={[styles.segBadgeTxt, active && { color: "#fff" }]}>{c.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald} />
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => navigation.navigate("TALeadDetail", { id: item.id, customerName: item.customerName })}
            />
          )}
          contentContainerStyle={leads.length === 0 ? styles.emptyWrap : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <>
              {/* Quick actions — SECTION_OPS.leads, same routes as SectionOpsBar */}
              <View style={styles.qaHead}>
                <Text style={styles.qaTitle}>Quick actions</Text>
                <TouchableOpacity
                  onPress={onSwipeHint}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.qaHint}>Swipe →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={qaScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.qaRow}
                scrollEventThrottle={16}
                onScroll={(e) => { qaScrollX.current = e.nativeEvent.contentOffset.x; }}
                onLayout={(e) => { qaViewW.current = e.nativeEvent.layout.width; }}
                onContentSizeChange={(w) => { qaContentW.current = w; }}
              >
                {(SECTION_OPS.leads || []).map((op) => {
                  // Card bg/border derive from the op's own icon color so every
                  // card matches its icon (not an index-based rotating palette).
                  const tint = { bg: op.color + "14", ring: op.color + "33" };
                  const isActive = op.route === "TALeads";
                  return (
                    <TouchableOpacity
                      key={op.route}
                      activeOpacity={0.85}
                      onPress={() => { if (!isActive) navigateToOp(navigation, op); }}
                      style={[styles.qaCard, { backgroundColor: tint.bg, borderColor: tint.ring }]}
                    >
                      <View style={[styles.qaIcon, { backgroundColor: "rgba(255,255,255,0.75)" }]}>
                        <Ionicons name={op.icon} size={rs(15)} color={op.color} />
                      </View>
                      <Text style={styles.qaLabel} numberOfLines={1}>{op.label}</Text>
                      <Text style={styles.qaSub} numberOfLines={1}>
                        {isActive ? "You are here" : "Open"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Priority */}
              <Text style={styles.filterLabel}>Priority</Text>
              <View style={styles.filterRow}>
                {[{ key: "ALL", label: "Any" }, ...LEAD_PRIORITY.map((p) => ({ key: p, label: p }))].map((c) => {
                  const active = priorityFilter === c.key;
                  const meta = PRIORITY_META[c.key];
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setPriorityFilter(c.key)}
                      activeOpacity={0.8}
                      style={[
                        styles.pill,
                        active && (meta
                          ? { backgroundColor: meta.fg, borderColor: meta.fg }
                          : { backgroundColor: C.emeraldDeep, borderColor: C.emeraldDeep }),
                      ]}
                    >
                      {meta && <Ionicons name={meta.icon} size={rs(11)} color={active ? "#fff" : C.muted} />}
                      <Text style={[styles.pillTxt, active && styles.pillTxtOn]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Source */}
              <Text style={styles.filterLabel}>Source</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sourceRow}
              >
                {["ALL", ...LEAD_SOURCE].map((s) => {
                  const active = sourceFilter === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSourceFilter(s)}
                      activeOpacity={0.8}
                      style={[styles.pill, active && { backgroundColor: C.emeraldDeep, borderColor: C.emeraldDeep }]}
                    >
                      <Text style={[styles.pillTxt, active && styles.pillTxtOn]}>
                        {SOURCE_SHORT[s] || s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {leads.length > 0 && <View style={{ height: rs(16) }} />}
            </>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={C.muted} style={{ padding: rs(14) }} /> : null
          }
          ListEmptyComponent={
            <EmptyState filtered={filtered} onAdd={() => navigation.navigate("TAAddEditLead")} />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TAAddEditLead")}
        activeOpacity={0.85}
      >
        <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <Ionicons name="add" size={rs(24)} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function HeroStat({ dot, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statDot, { backgroundColor: dot }]} />
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
    </View>
  );
}

function LeadCard({ lead, onPress }) {
  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.NEW;
  const pc = PRIORITY_META[lead.priority] || PRIORITY_META.WARM;
  const due = dueLabel(lead.nextFollowUp);
  const valueLabel = INR(lead.estimatedValue);

  return (
    <TouchableOpacity
      style={[styles.card, styles.cardShadow, lead.priority === "HOT" && styles.cardHot]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.avatar, { backgroundColor: pc.avatarBg }]}>
          <Text style={styles.avatarText}>{initials(lead.customerName)}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{lead.customerName || "—"}</Text>
            <View style={[styles.priorityPill, { backgroundColor: pc.bg }]}>
              <Ionicons name={pc.icon} size={rs(9)} color={pc.fg} />
              <Text style={[styles.priorityPillTxt, { color: pc.fg }]}>{lead.priority}</Text>
            </View>
          </View>
          <Text style={styles.cardPhone} numberOfLines={1}>
            {lead.customerPhone || ""}
            {lead.customerEmail ? `  ·  ${lead.customerEmail}` : ""}
          </Text>
        </View>
      </View>

      {(lead.destination || lead.tripType) && (
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={rs(12)} color={C.muted} />
          <Text style={styles.cardRowText} numberOfLines={1}>
            {lead.destination || lead.tripType}
            {lead.passengers ? `  ·  ${lead.passengers} pax` : ""}
          </Text>
        </View>
      )}
      {lead.travelDate && (
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={rs(12)} color={C.muted} />
          <Text style={styles.cardRowText}>
            {formatDate(lead.travelDate)}
            {lead.returnDate ? `  →  ${formatDate(lead.returnDate)}` : ""}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>{lead.status}</Text>
        </View>
        {!!valueLabel && (
          <View style={styles.valueChip}>
            <Ionicons name="cash-outline" size={rs(11)} color={C.emeraldDeep} />
            <Text style={styles.valueText}>{valueLabel}</Text>
          </View>
        )}
        {due && (
          <View style={styles.dueChip}>
            <Ionicons name="time-outline" size={rs(11)} color={due.color} />
            <Text style={[styles.dueText, { color: due.color }]}>{due.label}</Text>
          </View>
        )}
        {lead.notesCount > 0 && (
          <View style={styles.notesChip}>
            <Ionicons name="chatbubble-ellipses-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.notesText}>{lead.notesCount}</Text>
          </View>
        )}
        {!!lead.source && (
          <View style={styles.notesChip}>
            <Ionicons name="git-network-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.notesText}>{SOURCE_SHORT[lead.source] || lead.source}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filtered, onAdd }) {
  // Gentle looping animation on the icon: halo "breathes", compass rocks.
  const rock = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const mkLoop = (val, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    const rockLoop = mkLoop(rock, 1600);
    const pulseLoop = mkLoop(pulse, 1400);
    rockLoop.start();
    pulseLoop.start();
    return () => { rockLoop.stop(); pulseLoop.stop(); };
  }, [rock, pulse]);

  const iconRotate = rock.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "12deg"] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={[styles.journey, styles.cardShadow]}>
      <Animated.View style={[styles.journeyHalo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        <View style={styles.journeyRing}>
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons name={filtered ? "search-outline" : "compass-outline"} size={rs(30)} color={C.emeraldDeep} />
          </Animated.View>
        </View>
      </Animated.View>

      <Text style={styles.journeyTitle}>
        {filtered ? "No matches" : "Your journey starts here"}
      </Text>
      <Text style={styles.journeyBody}>
        {filtered
          ? "Try clearing your filters or searching for a different term."
          : "No leads yet. Capture your first enquiry and we'll help you turn it into an unforgettable trip."}
      </Text>

      {!filtered && (
        <>
          <TouchableOpacity onPress={onAdd} activeOpacity={0.9} style={styles.cardShadow}>
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.journeyCta}>
              <Ionicons name="add" size={rs(16)} color="#fff" />
              <Text style={styles.journeyCtaTxt}>Add your first lead</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.journeyHint}>· or share a Capture Link to collect enquiries ·</Text>
        </>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#0F2A22",
    shadowOpacity: 0.08,
    shadowRadius: rs(14),
    shadowOffset: { width: 0, height: rs(6) },
    elevation: 4,
  },

  // ── Hero ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(60), right: -rs(40),
    width: rs(190), height: rs(190), borderRadius: rs(95),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(70), left: -rs(50),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  heroTop: { flexDirection: "row", alignItems: "center", paddingTop: rs(6) },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(25), color: "#fff",
    letterSpacing: 0.2, marginTop: rs(10),
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(12), color: "rgba(255,255,255,0.7)",
    fontWeight: "bold", marginTop: rs(3),
  },

  statRow: { flexDirection: "row", gap: rs(9), marginTop: rs(8), alignItems: "stretch" },
  statCard: {
    flex: 1, minWidth: 0,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    borderRadius: rs(16), paddingHorizontal: rs(11), paddingVertical: rs(9),
    justifyContent: "space-between",
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: rs(5), minHeight: rf(13) },
  statDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  statLabel: {
    fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold",
    color: "rgba(255,255,255,0.6)", letterSpacing: 0.6,
    textTransform: "uppercase", flexShrink: 1,
  },
  statValue: {
    fontFamily: DISPLAY, fontSize: rf(22), lineHeight: rf(26), color: "#fff",
    letterSpacing: -0.4, marginTop: rs(4),
  },

  // ── Search ──
  searchWrap: { marginHorizontal: GUT, marginTop: -rs(14) },
  searchCard: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    backgroundColor: C.card, borderRadius: 999,
    paddingHorizontal: rs(15), height: rs(48),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  searchInput: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(13),
    color: C.ink, paddingVertical: 0, fontWeight: "bold",
  },

  // ── Segmented status ──
  // paddingBottom keeps the pills clear of the list's first header row.
  segWrap: { marginTop: rs(12), paddingBottom: rs(12) },
  segRow: { flexDirection: "row", gap: rs(6), paddingHorizontal: GUT, paddingVertical: rs(2) },
  seg: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  segOn: { backgroundColor: C.emeraldDeep, borderColor: C.emeraldDeep },
  segTxt: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: C.sub },
  segTxtOn: { color: "#fff" },
  segBadge: {
    minWidth: rs(17), paddingHorizontal: rs(4), borderRadius: 999,
    backgroundColor: C.tintEmerald, alignItems: "center", justifyContent: "center",
  },
  segBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", color: C.emeraldDeep },

  // ── Quick actions ──
  qaHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: rs(4), marginBottom: rs(10),
  },
  qaTitle: { fontFamily: DISPLAY, fontSize: rf(17), color: C.ink },
  qaHint: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold", color: C.muted },
  qaRow: { flexDirection: "row", gap: rs(9), paddingBottom: rs(4) },
  qaCard: {
    width: rs(114), borderRadius: rs(16), padding: rs(10),
    borderWidth: 1,
  },
  qaIcon: {
    width: rs(27), height: rs(27), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center", marginBottom: rs(8),
  },
  qaLabel: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.ink },
  qaSub: { fontFamily: DISPLAY, fontSize: rf(10), color: C.muted, marginTop: rs(2), fontWeight: "bold" },

  // ── Filters ──
  filterLabel: {
    fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: C.muted,
    letterSpacing: 1.2, textTransform: "uppercase",
    marginTop: rs(11), marginBottom: rs(7),
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: rs(7) },
  sourceRow: { flexDirection: "row", gap: rs(7), paddingRight: rs(4) },
  pill: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(13), paddingVertical: rs(8), borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  pillTxt: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: C.sub },
  pillTxtOn: { color: "#fff" },

  // ── Error ──
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(12), padding: rs(11),
    backgroundColor: C.redL, borderRadius: rs(12),
    borderWidth: 1, borderColor: "rgba(192,69,59,0.2)",
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), flex: 1, fontWeight: "bold" },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: rf(12.5) },

  // ── List ──
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: GUT, paddingTop: rs(14), paddingBottom: rs(100) },
  emptyWrap: { flexGrow: 1, paddingHorizontal: GUT, paddingTop: rs(14), paddingBottom: rs(100) },

  // ── Lead card ──
  card: {
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(13),
    borderWidth: 1, borderColor: C.glassBorder, marginBottom: rs(10),
  },
  cardHot: { borderColor: "#F2DBE1" },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: rs(10), marginBottom: rs(8) },
  avatar: { width: rs(42), height: rs(42), borderRadius: rs(21), alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(14) },
  nameRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  cardName: { fontFamily: DISPLAY, flex: 1, fontSize: rf(16), color: C.ink },
  cardPhone: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.muted, marginTop: rs(2), fontWeight: "bold" },
  priorityPill: {
    flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: 999,
  },
  priorityPillTxt: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: rs(6), marginTop: rs(4) },
  cardRowText: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, fontWeight: "bold" },

  cardFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: rs(6), marginTop: rs(10) },
  statusPill: { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 999 },
  statusText: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", letterSpacing: 0.3 },
  valueChip: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(7),
    backgroundColor: C.tintEmerald,
  },
  valueText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold", color: C.emeraldDeep },
  dueChip: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(7),
    backgroundColor: C.ivory, borderWidth: 1, borderColor: C.border,
  },
  dueText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold" },
  notesChip: {
    flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(7), paddingVertical: rs(4), borderRadius: rs(7),
    backgroundColor: C.ivory,
  },
  notesText: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: "bold" },

  // ── Empty / journey card ──
  journey: {
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.glassBorder,
    alignItems: "center", paddingHorizontal: rs(22), paddingVertical: rs(30),
    marginTop: rs(10),
  },
  journeyHalo: {
    width: rs(104), height: rs(104), borderRadius: rs(52),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center", marginBottom: rs(18),
  },
  journeyRing: {
    width: rs(74), height: rs(74), borderRadius: rs(37),
    backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  journeyTitle: { fontFamily: DISPLAY, fontSize: rf(21), color: C.ink, textAlign: "center" },
  journeyBody: {
    fontFamily: DISPLAY, fontSize: rf(13), color: C.sub, marginTop: rs(8),
    textAlign: "center", lineHeight: rf(20), maxWidth: rs(270), fontWeight: "bold",
  },
  journeyCta: {
    flexDirection: "row", alignItems: "center", gap: rs(7), marginTop: rs(20),
    paddingHorizontal: rs(22), paddingVertical: rs(13), borderRadius: 999,
  },
  journeyCtaTxt: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(14) },
  journeyHint: {
    fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted,
    marginTop: rs(16), textAlign: "center", fontWeight: "bold",
  },

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
