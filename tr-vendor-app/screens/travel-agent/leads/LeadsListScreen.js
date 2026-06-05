// screens/travel-agent/leads/LeadsListScreen.js
// REDESIGNED — modern CRM card list with emerald gradient header.
//
// Mirrors web /travel-agent/leads but built mobile-first: search embedded in
// the gradient header, sticky pill filters with live counts, quick-stats
// summary, and lead cards that surface priority + status + value + due-date
// in a single glance.
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import SectionOpsBar from "../_shared/SectionOpsBar";
import {
  listTravelAgentLeads,
  LEAD_STATUS,
  LEAD_PRIORITY,
  LEAD_SOURCE,
} from "../../api/travelAgentClient";

const SOURCE_SHORT = {
  ALL: "All", MANUAL: "Manual", CAPTURE_LINK: "Capture", WEBSITE: "Website",
  REFERRAL: "Referral", WALK_IN: "Walk-in", SOCIAL_MEDIA: "Social",
  GOOGLE_ADS: "Ads", WHATSAPP: "WhatsApp", OTHER: "Other",
};

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
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
};

const STATUS_COLORS = {
  NEW:         { bg: "#DBEAFE", fg: "#1D4ED8" },
  CONTACTED:   { bg: "#CFFAFE", fg: "#0E7490" },
  INTERESTED:  { bg: "#D1FAE5", fg: "#047857" },
  QUOTED:      { bg: "#EDE9FE", fg: "#6D28D9" },
  NEGOTIATING: { bg: "#E0E7FF", fg: "#4338CA" },
  BOOKED:      { bg: "#DCFCE7", fg: "#15803D" },
  LOST:        { bg: "#FEE2E2", fg: "#B91C1C" },
  COLD:        { bg: "#F1F5F9", fg: "#475569" },
};
const PRIORITY_META = {
  HOT:  { fg: "#B91C1C", bg: "#FEE2E2", icon: "flame", avatarBg: "#E11D48" },
  WARM: { fg: "#A16207", bg: "#FEF3C7", icon: "sunny", avatarBg: C.amber },
  COLD: { fg: "#0369A1", bg: "#E0F2FE", icon: "snow",  avatarBg: C.blue },
};

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
  if (diff === 0) return { label: "Due today", color: C.amber };
  if (diff === 1) return { label: "Due tomorrow", color: C.blue };
  if (diff <= 7) return { label: `In ${diff}d`, color: C.blue };
  return { label: formatDate(iso), color: C.subText };
}

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
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
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Leads</Text>
              <Text style={styles.headerSub}>
                {pagination.total > 0
                  ? `${pagination.total} total${conversionPct != null ? ` · ${conversionPct}% converted` : ""}`
                  : "Capture & convert enquiries"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate("TAPipeline")}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="git-network" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search bar embedded in gradient */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.85)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, phone, destination…"
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

      {/* Section operations bar — all Leads-group operations (web sidebar parity) */}
      <SectionOpsBar navigation={navigation} group="leads" active="TALeads" />

      {/* Priority filter (below header) */}
      <View style={styles.subFilterBar}>
        <Text style={styles.subFilterLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {[{ key: "ALL", label: "Any" }, ...LEAD_PRIORITY.map((p) => ({ key: p, label: p }))].map((c) => {
            const active = priorityFilter === c.key;
            const meta = PRIORITY_META[c.key];
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setPriorityFilter(c.key)}
                style={[
                  styles.priorityChip,
                  active && (meta ? { backgroundColor: meta.bg, borderColor: meta.fg } : { backgroundColor: C.emerald50, borderColor: C.emerald600 }),
                ]}
              >
                {meta && <Ionicons name={meta.icon} size={11} color={active ? meta.fg : C.subText} />}
                <Text
                  style={[
                    styles.priorityText,
                    active && (meta ? { color: meta.fg, fontWeight: "800" } : { color: C.emerald700, fontWeight: "800" }),
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Source filter */}
      <View style={styles.sourceBar}>
        <Text style={styles.subFilterLabel}>Source</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 12, alignItems: "center" }}>
          {["ALL", ...LEAD_SOURCE].map((s) => {
            const active = sourceFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSourceFilter(s)}
                style={[styles.priorityChip, active && { backgroundColor: C.emerald50, borderColor: C.emerald600 }]}
              >
                <Text style={[styles.priorityText, active && { color: C.emerald700, fontWeight: "800" }]}>
                  {SOURCE_SHORT[s] || s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Quick stats row (only when there's data) */}
      {!loading && leads.length > 0 && (hotCount > 0 || dueTodayCount > 0 || conversionPct != null) && (
        <View style={styles.quickStatsRow}>
          {hotCount > 0 && (
            <QuickStat icon="flame" label="Hot" value={hotCount} color={PRIORITY_META.HOT.fg} bg={PRIORITY_META.HOT.bg} />
          )}
          {dueTodayCount > 0 && (
            <QuickStat icon="alarm" label="Due today" value={dueTodayCount} color={C.amber} bg={C.amberLight} />
          )}
          {conversionPct != null && (
            <QuickStat icon="trending-up" label="Convert" value={`${conversionPct}%`} color={C.emerald600} bg={C.emerald50} isText />
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, false)}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={C.subText} style={{ padding: 14 }} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              filtered={!!debouncedSearch || statusFilter !== "ALL" || priorityFilter !== "ALL" || sourceFilter !== "ALL"}
              onAdd={() => navigation.navigate("TAAddEditLead")}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TAAddEditLead")}
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

function QuickStat({ icon, label, value, color, bg, isText }) {
  return (
    <View style={[styles.qStatChip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.qStatValue, { color }, isText && { fontSize: 13 }]}>{value}</Text>
      <Text style={[styles.qStatLabel, { color }]}>{label}</Text>
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
      style={[styles.card, lead.priority === "HOT" && styles.cardHot]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTopRow}>
        {/* Avatar with initials, colored by priority */}
        <View style={[styles.avatar, { backgroundColor: pc.avatarBg }]}>
          <Text style={styles.avatarText}>{initials(lead.customerName)}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>{lead.customerName || "—"}</Text>
            <View style={[styles.priorityPill, { backgroundColor: pc.bg }]}>
              <Ionicons name={pc.icon} size={10} color={pc.fg} />
              <Text style={[styles.priorityText, { color: pc.fg, fontSize: 9.5 }]}>{lead.priority}</Text>
            </View>
          </View>
          <Text style={styles.cardPhone} numberOfLines={1}>
            {lead.customerPhone || ""}
            {lead.customerEmail ? `  ·  ${lead.customerEmail}` : ""}
          </Text>
        </View>
      </View>

      {/* Trip info */}
      {(lead.destination || lead.tripType) && (
        <View style={styles.cardRow}>
          <Ionicons name="location-outline" size={13} color={C.subText} />
          <Text style={styles.cardRowText} numberOfLines={1}>
            {lead.destination || lead.tripType}
            {lead.passengers ? `  ·  ${lead.passengers} pax` : ""}
          </Text>
        </View>
      )}
      {lead.travelDate && (
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={13} color={C.subText} />
          <Text style={styles.cardRowText}>
            {formatDate(lead.travelDate)}
            {lead.returnDate ? `  →  ${formatDate(lead.returnDate)}` : ""}
          </Text>
        </View>
      )}

      {/* Footer pills */}
      <View style={styles.cardFooter}>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>{lead.status}</Text>
        </View>
        {!!valueLabel && (
          <View style={styles.valueChip}>
            <Ionicons name="cash-outline" size={12} color={C.emerald600} />
            <Text style={styles.valueText}>{valueLabel}</Text>
          </View>
        )}
        {due && (
          <View style={styles.dueChip}>
            <Ionicons name="time-outline" size={12} color={due.color} />
            <Text style={[styles.dueText, { color: due.color }]}>{due.label}</Text>
          </View>
        )}
        {lead.notesCount > 0 && (
          <View style={styles.notesChip}>
            <Ionicons name="chatbubble-ellipses-outline" size={12} color={C.subText} />
            <Text style={styles.notesText}>{lead.notesCount}</Text>
          </View>
        )}
        {!!lead.source && (
          <View style={styles.notesChip}>
            <Ionicons name="git-network-outline" size={12} color={C.subText} />
            <Text style={styles.notesText}>{SOURCE_SHORT[lead.source] || lead.source}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filtered, onAdd }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={filtered ? "search-outline" : "people-outline"} size={36} color={C.emerald600} />
      </View>
      <Text style={styles.emptyTitle}>{filtered ? "No matches" : "No leads yet"}</Text>
      <Text style={styles.emptyBody}>
        {filtered
          ? "Try clearing your filters or searching for a different term."
          : "Capture your first lead — manually or via a public capture link."}
      </Text>
      {!filtered && (
        <TouchableOpacity style={styles.emptyCta} onPress={onAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyCtaText}>Add Lead</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  // Header gradient
  headerGrad: { paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  headerActionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },

  // Search bar
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 14, height: 42,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: "#fff", paddingVertical: 0, fontWeight: "600" },

  // Status chips
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

  // Sub filter bar (priority)
  subFilterBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  subFilterLabel: { fontSize: 11, fontWeight: "800", color: C.subText, letterSpacing: 0.4, textTransform: "uppercase" },
  sourceBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingLeft: 16, paddingVertical: 8,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  priorityRow: { flexDirection: "row", gap: 6, flex: 1 },
  priorityChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  priorityText: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Quick stats
  quickStatsRow: { flexDirection: "row", gap: 8, padding: 12, paddingBottom: 4 },
  qStatChip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, justifyContent: "center" },
  qStatValue: { fontSize: 14, fontWeight: "800" },
  qStatLabel: { fontSize: 10.5, fontWeight: "700", opacity: 0.8 },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, padding: 10, backgroundColor: C.redLight, borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 12, paddingTop: 6, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
  },
  cardHot: { borderColor: "#FECACA", backgroundColor: "#FFFAFA" },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { flex: 1, fontSize: 15, fontWeight: "800", color: C.ink },
  cardPhone: { fontSize: 11.5, color: C.subText, marginTop: 2 },
  priorityPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  cardRowText: { fontSize: 12.5, color: C.text },

  cardFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  valueChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.emerald50 },
  valueText: { fontSize: 11.5, fontWeight: "800", color: C.emerald600 },
  dueChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border },
  dueText: { fontSize: 11.5, fontWeight: "800" },
  notesChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F8FAFC" },
  notesText: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Empty
  empty: { alignItems: "center", padding: 28 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center" },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: C.emerald600 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 18,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, borderRadius: 28, alignItems: "center", justifyContent: "center" },
});
