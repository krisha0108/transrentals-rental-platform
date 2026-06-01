// screens/travel-agent/tours/TourQuoteRequestsScreen.js
// REDESIGNED — emerald-themed list of incoming customer quote requests.
// Backend reuses /leads (source=WEBSITE). Tap a request → lead detail.
// Inline Call / WhatsApp / Email shortcuts on each card.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Linking, StatusBar, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentTourQuoteRequests, LEAD_STATUS } from "../../api/travelAgentClient";

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
  wa: "#25D366",
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return ""; }
}
function fmtRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
// Pleasant avatar tints cycled by name hash so each customer has a
// stable but varied background.
const AVATAR_PALETTE = [
  { bg: "#DBEAFE", fg: "#1D4ED8" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#D1FAE5", fg: "#047857" },
  { bg: "#FEF3C7", fg: "#A16207" },
  { bg: "#EDE9FE", fg: "#6D28D9" },
  { bg: "#CFFAFE", fg: "#0E7490" },
];
function tintFor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export default function TourQuoteRequestsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | new | expired
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL"); // ALL | HOT | WARM | COLD
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | NEW | CONTACTED | ...
  const [statusStats, setStatusStats] = useState(null); // per-status counts from API

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (!append) setError(null);
        const data = await listTravelAgentTourQuoteRequests({
          page: pageNum, limit: 20,
          priority: priorityFilter === "ALL" ? undefined : priorityFilter,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: debouncedSearch || undefined,
        });
        // Backend reuses /leads here (source=WEBSITE), array on `leads`.
        const list =
          data.leads || data.items || data.requests || data.quoteRequests ||
          (Array.isArray(data) ? data : []);
        if (!append && data.stats) setStatusStats(data.stats);
        setItems((prev) => (append ? [...prev, ...list] : list));
        if (data.pagination) {
          setPage(data.pagination.page || pageNum);
          setPages(data.pagination.pages || 1);
        } else {
          setPage(pageNum);
          setPages(list.length < 20 ? pageNum : pageNum + 1);
        }
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Failed to load quote requests");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [priorityFilter, statusFilter, debouncedSearch]
  );

  useEffect(() => { setLoading(true); fetchPage(1, false); }, [fetchPage]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchPage(1, false));
    return unsub;
  }, [navigation, fetchPage]);

  const onRefresh = async () => { setRefreshing(true); await fetchPage(1, false); };
  const onEndReached = () => {
    if (loadingMore || loading || page >= pages) return;
    setLoadingMore(true);
    fetchPage(page + 1, true);
  };

  // Compute counts + filter result.
  const { filteredItems, counts } = useMemo(() => {
    const counts = { all: items.length, new: 0, expired: 0, today: 0 };
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    items.forEach((it) => {
      const expired = it.expiresAt && new Date(it.expiresAt).getTime() < now;
      if (expired) counts.expired++;
      else counts.new++;
      if (it.createdAt && new Date(it.createdAt).getTime() >= todayStart.getTime()) counts.today++;
    });
    let f = items;
    if (filter === "new") {
      f = items.filter((it) => !it.expiresAt || new Date(it.expiresAt).getTime() >= now);
    } else if (filter === "expired") {
      f = items.filter((it) => it.expiresAt && new Date(it.expiresAt).getTime() < now);
    }
    // priority + search are applied SERVER-SIDE (passed to the API); only the
    // lifecycle filter (all/new/expired) is computed client-side here.
    return { filteredItems: f, counts };
  }, [items, filter]);

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
              <Text style={styles.headerTitle}>Tour Quote Requests</Text>
              <Text style={styles.headerSub}>From your tours on the website</Text>
            </View>
            <TouchableOpacity onPress={() => fetchPage(1, false)} style={styles.iconBtn}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell value={counts.all} label="Total" icon="mail-unread" color={C.emerald600} />
        <View style={styles.statDivider} />
        <StatCell value={counts.new} label="Active" icon="sparkles" color={C.blue} />
        <View style={styles.statDivider} />
        <StatCell value={counts.today} label="Today" icon="today" color={C.amber} />
        <View style={styles.statDivider} />
        <StatCell value={counts.expired} label="Expired" icon="time" color={C.red} />
      </View>

      {/* ===== Filter chips ===== */}
      <View style={styles.chipsRow}>
        <Chip
          label="All" icon="apps"
          count={counts.all}
          active={filter === "all"}
          onPress={() => setFilter("all")}
          color={C.emerald600}
        />
        <Chip
          label="Active" icon="sparkles"
          count={counts.new}
          active={filter === "new"}
          onPress={() => setFilter("new")}
          color={C.blue}
        />
        <Chip
          label="Expired" icon="time"
          count={counts.expired}
          active={filter === "expired"}
          onPress={() => setFilter("expired")}
          color={C.red}
        />
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={C.subText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, phone, destination…"
          placeholderTextColor={C.subText}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={C.subText} /></TouchableOpacity>
        )}
      </View>

      {/* Status filter (server-side; counts from API stats) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBar}>
        {["ALL", ...LEAD_STATUS].map((s) => {
          const active = statusFilter === s;
          const count = s === "ALL" ? (statusStats?.total ?? null) : (statusStats?.[s] ?? null);
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.statusChip, active && { backgroundColor: C.ink, borderColor: C.ink }]}
            >
              <Text style={[styles.statusChipText, active && { color: "#fff" }]}>
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </Text>
              {count != null && count > 0 && (
                <View style={[styles.statusChipBadge, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Text style={[styles.statusChipBadgeText, active && { color: "#fff" }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Priority filter */}
      <View style={styles.priorityBar}>
        {[{ k: "ALL", l: "Any" }, { k: "HOT", l: "Hot" }, { k: "WARM", l: "Warm" }, { k: "COLD", l: "Cold" }].map((p) => {
          const active = priorityFilter === p.k;
          return (
            <TouchableOpacity
              key={p.k}
              onPress={() => setPriorityFilter(p.k)}
              style={[styles.prioChip, active && { backgroundColor: C.emerald50, borderColor: C.emerald600 }]}
            >
              <Text style={[styles.prioChipText, active && { color: C.emerald700, fontWeight: "800" }]}>{p.l}</Text>
            </TouchableOpacity>
          );
        })}
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
          <Text style={styles.loadingText}>Loading quote requests…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, idx) => item.id || `req-${idx}`}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onPress={() =>
                navigation.navigate("TALeadDetail", {
                  id: item.id,
                  customerName: item.customerName,
                })
              }
            />
          )}
          contentContainerStyle={
            filteredItems.length === 0 ? styles.emptyWrap : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoad}>
                <ActivityIndicator size="small" color={C.emerald600} />
                <Text style={styles.footerLoadText}>Loading more…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="mail-unread-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "all" ? "No quote requests yet" : `No ${filter} requests`}
              </Text>
              <Text style={styles.emptyBody}>
                {filter === "all"
                  ? "When customers submit quote requests for your tours on the website, they'll appear here."
                  : "Try a different filter or wait for new submissions."}
              </Text>
              {filter !== "all" && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => setFilter("all")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.emptyCtaInner}
                  >
                    <Ionicons name="apps" size={16} color="#fff" />
                    <Text style={styles.emptyCtaText}>See all requests</Text>
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
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Chip({ label, icon, count, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: `${color}18`, borderColor: color }]}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={12} color={active ? color : C.subText} />
      <Text style={[styles.chipText, active && { color, fontWeight: "800" }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.chipBadge, active && { backgroundColor: color }]}>
          <Text style={[styles.chipBadgeText, active && { color: "#fff" }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function RequestCard({ request, onPress }) {
  const phone = request.customerPhone || request.phone;
  const email = request.customerEmail || request.email;
  const name = request.customerName || request.name || "Customer";
  const destination = request.destination || request.tour?.destination;
  const tripType = request.tripType;
  const dates = request.travelDate ? fmtDate(request.travelDate) : null;
  const passengers = request.passengers || request.numberOfPassengers;
  const isExpired = request.expiresAt && new Date(request.expiresAt).getTime() < Date.now();
  const isNew = !isExpired &&
    request.createdAt &&
    (Date.now() - new Date(request.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  const tint = tintFor(name);
  const stripeColor = isExpired ? C.red : isNew ? C.emerald600 : C.blue;

  const callPhone = () => phone && Linking.openURL(`tel:${phone}`).catch(() => {});
  const openWa = () => {
    if (!phone) return;
    const cleaned = String(phone).replace(/^\+?91/, "").replace(/\D/g, "");
    Linking.openURL(`whatsapp://send?phone=91${cleaned}`)
      .catch(() => Linking.openURL(`https://wa.me/91${cleaned}`).catch(() => {}));
  };
  const openMail = () => email && Linking.openURL(`mailto:${email}`).catch(() => {});

  return (
    <TouchableOpacity
      style={[styles.card, isExpired && styles.cardExpired]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Left status stripe */}
      <View style={[styles.cardStripe, { backgroundColor: stripeColor }]} />

      <View style={styles.cardBody}>
        {/* Top row: avatar + name + relative time + status pill */}
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
            <Text style={[styles.avatarText, { color: tint.fg }]}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
              {isNew && !isExpired && (
                <View style={styles.newDot}>
                  <Text style={styles.newDotText}>NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.metaTopRow}>
              <Ionicons name="time-outline" size={11} color={C.subText} />
              <Text style={styles.cardTime}>{fmtRelative(request.createdAt)}</Text>
              {!!request.source && (
                <>
                  <Text style={styles.cardTimeDot}>·</Text>
                  <Text style={styles.cardTime}>{String(request.source).toLowerCase()}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Contact row (phone + email pills) */}
        {(phone || email) && (
          <View style={styles.contactRow}>
            {!!phone && (
              <View style={styles.contactPill}>
                <Ionicons name="call" size={11} color={C.blue} />
                <Text style={styles.contactPillText} numberOfLines={1}>{phone}</Text>
              </View>
            )}
            {!!email && (
              <View style={styles.contactPill}>
                <Ionicons name="mail" size={11} color={C.purple} />
                <Text style={styles.contactPillText} numberOfLines={1}>{email}</Text>
              </View>
            )}
          </View>
        )}

        {/* Trip meta block */}
        {(destination || tripType || dates || passengers) && (
          <View style={styles.metaBlock}>
            {!!destination && (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: `${C.red}1A` }]}>
                  <Ionicons name="location" size={11} color={C.red} />
                </View>
                <Text style={styles.metaText} numberOfLines={1}>{destination}</Text>
              </View>
            )}
            {!!tripType && (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: `${C.purple}1A` }]}>
                  <Ionicons name="map" size={11} color={C.purple} />
                </View>
                <Text style={styles.metaText} numberOfLines={1}>{String(tripType).replace("_", " ")}</Text>
              </View>
            )}
            {!!dates && (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: `${C.amber}1A` }]}>
                  <Ionicons name="calendar" size={11} color={C.amber} />
                </View>
                <Text style={styles.metaText}>{dates}</Text>
              </View>
            )}
            {!!passengers && (
              <View style={styles.metaItem}>
                <View style={[styles.metaIconWrap, { backgroundColor: `${C.emerald600}1A` }]}>
                  <Ionicons name="people" size={11} color={C.emerald600} />
                </View>
                <Text style={styles.metaText}>{passengers} pax</Text>
              </View>
            )}
          </View>
        )}

        {/* Requirement / message */}
        {!!request.requirement && (
          <View style={styles.requirementBox}>
            <Ionicons name="chatbubble-ellipses" size={12} color={C.emerald700} />
            <Text style={styles.requirement} numberOfLines={3}>{request.requirement}</Text>
          </View>
        )}

        {/* Expired pill */}
        {isExpired && (
          <View style={styles.expiredPill}>
            <Ionicons name="time" size={11} color={C.red} />
            <Text style={styles.expiredText}>
              EXPIRED · {fmtDate(request.expiresAt)}
            </Text>
          </View>
        )}

        {/* Quick action row */}
        {(phone || email) && (
          <View style={styles.actionsRow}>
            {!!phone && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionCall]} onPress={callPhone} activeOpacity={0.85}>
                <Ionicons name="call" size={13} color={C.blue} />
                <Text style={[styles.actionBtnText, { color: C.blue }]}>Call</Text>
              </TouchableOpacity>
            )}
            {!!phone && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionWA]} onPress={openWa} activeOpacity={0.85}>
                <Ionicons name="logo-whatsapp" size={13} color={C.wa} />
                <Text style={[styles.actionBtnText, { color: C.wa }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {!!email && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionMail]} onPress={openMail} activeOpacity={0.85}>
                <Ionicons name="mail" size={13} color={C.purple} />
                <Text style={[styles.actionBtnText, { color: C.purple }]}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.actionOpen]} onPress={onPress} activeOpacity={0.85}>
              <Ionicons name="arrow-forward" size={13} color={C.emerald700} />
              <Text style={[styles.actionBtnText, { color: C.emerald700 }]}>Open</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
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

  // Floating stats
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", minWidth: 0 },
  statIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 14.5, fontWeight: "900" },
  statLabel: { fontSize: 9.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 26, backgroundColor: C.border },

  // Filter chips
  chipsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 12, color: C.text, fontWeight: "600" },
  chipBadge: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E2E8F0" },
  chipBadgeText: { fontSize: 10, fontWeight: "800", color: C.text },

  // Search + priority (E3)
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },
  priorityBar: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  prioChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  prioChipText: { fontSize: 12, color: C.text, fontWeight: "700" },
  statusBar: { gap: 6, paddingHorizontal: 16, paddingTop: 10, alignItems: "center" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  statusChipText: { fontSize: 12, color: C.text, fontWeight: "700" },
  statusChipBadge: { minWidth: 16, paddingHorizontal: 4, borderRadius: 999, backgroundColor: "#E2E8F0", alignItems: "center" },
  statusChipBadgeText: { fontSize: 9.5, fontWeight: "800", color: C.text },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
  footerLoad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  footerLoadText: { fontSize: 12, color: C.subText, fontWeight: "600" },

  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 14, marginBottom: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardExpired: { opacity: 0.7 },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },

  // Header inside card
  avatar: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { flex: 1, fontSize: 15, fontWeight: "800", color: C.ink },
  newDot: { backgroundColor: C.emerald600, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newDotText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  metaTopRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  cardTime: { fontSize: 11, color: C.subText, fontWeight: "700" },
  cardTimeDot: { fontSize: 11, color: C.subText, fontWeight: "800" },

  // Contact pills
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  contactPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border, maxWidth: "100%" },
  contactPillText: { fontSize: 11, color: C.text, fontWeight: "700", maxWidth: 180 },

  // Trip meta block
  metaBlock: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaIconWrap: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  metaText: { fontSize: 11.5, color: C.text, fontWeight: "700" },

  // Requirement
  requirementBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    padding: 10, borderRadius: 10,
    backgroundColor: C.emerald50, borderLeftWidth: 3, borderLeftColor: C.emerald600,
    marginTop: 10,
  },
  requirement: { flex: 1, fontSize: 12.5, color: C.text, lineHeight: 18, fontStyle: "italic" },

  // Expired
  expiredPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.redLight, marginTop: 10 },
  expiredText: { color: C.red, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  // Action row
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  actionBtn: {
    flex: 1, minWidth: 70,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 9, paddingHorizontal: 6,
    borderRadius: 10, borderWidth: 1,
  },
  actionCall: { backgroundColor: C.blueLight, borderColor: "#BFDBFE" },
  actionWA:   { backgroundColor: "#F0FDF4",   borderColor: "#BBF7D0" },
  actionMail: { backgroundColor: "#F5F3FF",   borderColor: "#DDD6FE" },
  actionOpen: { backgroundColor: C.emerald50, borderColor: "#A7F3D0" },
  actionBtnText: { fontSize: 11.5, fontWeight: "800" },
});
