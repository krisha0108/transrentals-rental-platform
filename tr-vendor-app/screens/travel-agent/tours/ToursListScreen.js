// screens/travel-agent/tours/ToursListScreen.js
// REDESIGNED — emerald-themed tours list with image-hero cards, floating
// stats, status pill filters and a polished empty state.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentTours, updateTravelAgentTour, deleteTravelAgentTour, TOUR_STATUS } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";

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
  red: "#EF4444",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  purple: "#8B5CF6",
};

const STATUS_COLORS = {
  DRAFT:    { bg: "rgba(100,116,139,0.95)", fg: "#fff",  icon: "create",       label: "Draft" },
  ACTIVE:   { bg: "rgba(16,185,129,0.95)",  fg: "#fff",  icon: "checkmark-circle", label: "Active" },
  PAUSED:   { bg: "rgba(245,158,11,0.95)",  fg: "#fff",  icon: "pause-circle", label: "Paused" },
  INACTIVE: { bg: "rgba(239,68,68,0.95)",   fg: "#fff",  icon: "close-circle", label: "Inactive" },
};

const INR = (n) => {
  if (n == null || isNaN(Number(n))) return null;
  const v = Number(n);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export default function ToursListScreen({ navigation }) {
  const [tours, setTours] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateChooser, setShowCreateChooser] = useState(false); // #6c

  const startCreate = (createMode) => {
    setShowCreateChooser(false);
    navigation.navigate("TAAddEditTour", { createMode });
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentTours({ search: debouncedSearch, status: statusFilter });
      setTours(data.tours || []);
      setStats(data.stats || null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load tours");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  // E4 — list-level publish toggle + delete
  const onTogglePublish = async (tour) => {
    const next = !tour.isPublic;
    setTours((prev) => prev.map((t) => (t.id === tour.id ? { ...t, isPublic: next, status: next ? "ACTIVE" : t.status } : t)));
    try {
      await updateTravelAgentTour(tour.id, { isPublic: next, status: next ? "ACTIVE" : "DRAFT" });
    } catch (e) {
      setTours((prev) => prev.map((t) => (t.id === tour.id ? { ...t, isPublic: tour.isPublic, status: tour.status } : t)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    }
  };
  const onToggleActive = async (tour) => {
    const next = !(tour.isActive !== false);
    setTours((prev) => prev.map((t) => (t.id === tour.id ? { ...t, isActive: next } : t)));
    try {
      await updateTravelAgentTour(tour.id, { isActive: next });
    } catch (e) {
      setTours((prev) => prev.map((t) => (t.id === tour.id ? { ...t, isActive: tour.isActive } : t)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    }
  };
  const onDelete = (tour) => {
    Alert.alert("Delete tour?", `"${tour.title || "This tour"}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setTours((prev) => prev.filter((t) => t.id !== tour.id));
          try { await deleteTravelAgentTour(tour.id); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); load(); }
        },
      },
    ]);
  };

  const statusChips = [
    { key: "ALL", label: "All", count: stats?.total ?? null },
    ...TOUR_STATUS.map((s) => ({
      key: s,
      label: s,
      count: s === "ACTIVE" ? stats?.active : null,
    })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Tours</Text>
              <Text style={styles.headerSub}>
                {stats ? `${stats.total} total · ${stats.active} active · ${stats.published} published` : "Tour packages"}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.85)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tours…"
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

      {/* Quick stats card */}
      {stats && (
        <View style={styles.statsCardWrap}>
          <View style={styles.statsCard}>
            <StatBlock icon="map" label="Total" value={stats.total ?? 0} color={C.emerald600} />
            <View style={styles.statDivider} />
            <StatBlock icon="checkmark-circle" label="Active" value={stats.active ?? 0} color={C.blue} />
            <View style={styles.statDivider} />
            <StatBlock icon="globe" label="Public" value={stats.published ?? 0} color={C.purple} />
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TourCard
              tour={item}
              onPress={() => navigation.navigate("TATourPreview", { id: item.id })}
              onEdit={() => navigation.navigate("TAAddEditTour", { tour: item })}
              onTogglePublish={() => onTogglePublish(item)}
              onToggleActive={() => onToggleActive(item)}
              onDelete={() => onDelete(item)}
            />
          )}
          contentContainerStyle={tours.length === 0 ? styles.emptyWrap : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
          ListEmptyComponent={
            <EmptyState
              filtered={!!debouncedSearch || statusFilter !== "ALL"}
              onAdd={() => navigation.navigate("TAAddEditTour")}
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateChooser(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[C.emerald600, C.emerald700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* #6c — quick-add chooser */}
      <Modal visible={showCreateChooser} transparent animationType="fade" onRequestClose={() => setShowCreateChooser(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowCreateChooser(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>How would you like to add the tour?</Text>
            <Text style={styles.sheetSub}>Pick how much detail you want to add now.</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={() => startCreate("QUICK")} activeOpacity={0.85}>
              <View style={[styles.sheetOptIcon, { backgroundColor: C.emerald50 }]}>
                <Ionicons name="flash" size={20} color={C.emerald600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptTitle}>Quick Add</Text>
                <Text style={styles.sheetOptSub}>Just the basics — add details later.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => startCreate("DETAILED")} activeOpacity={0.85}>
              <View style={[styles.sheetOptIcon, { backgroundColor: "#F5F3FF" }]}>
                <Ionicons name="list" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptTitle}>Detailed Add</Text>
                <Text style={styles.sheetOptSub}>Full itinerary, pricing & policies.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.subText} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowCreateChooser(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatBlock({ icon, label, value, color }) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TourCard({ tour, onPress, onEdit, onTogglePublish, onToggleActive, onDelete }) {
  const isActive = tour.isActive !== false;
  const sc = STATUS_COLORS[tour.status] || STATUS_COLORS.DRAFT;
  const priceLabel = tour.priceType === "ON_REQUEST"
    ? "On request"
    : INR(tour.basePrice || tour.startingPrice);
  const priceSuffix = tour.priceType === "PER_PERSON" ? "/person" : tour.priceType === "PER_GROUP" ? "/group" : "";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Cover image with overlays */}
      <View style={styles.coverWrap}>
        {tour.coverImage ? (
          <RemoteImage source={{ uri: tour.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.6)" />
          </View>
        )}

        {/* Bottom gradient overlay for badge readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={styles.coverOverlay}
        />

        {/* Status badge (top-left) */}
        <View style={styles.coverBadges}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={11} color={sc.fg} />
            <Text style={styles.statusBadgeText}>{sc.label}</Text>
          </View>
          {tour.isPublic && (
            <View style={[styles.statusBadge, { backgroundColor: "rgba(59,130,246,0.95)" }]}>
              <Ionicons name="globe" size={11} color="#fff" />
              <Text style={styles.statusBadgeText}>Public</Text>
            </View>
          )}
        </View>

        {/* Title over image bottom */}
        <View style={styles.coverTitleBlock}>
          <Text style={styles.coverTitle} numberOfLines={2}>{tour.title}</Text>
          {!!tour.destination && (
            <Text style={styles.coverDestination} numberOfLines={1}>📍 {tour.destination}</Text>
          )}
        </View>
      </View>

      {/* Below-image content */}
      <View style={styles.cardBody}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          {(tour.durationDays || tour.duration) && (
            <View style={styles.statChip}>
              <Ionicons name="time" size={11} color={C.blue} />
              <Text style={[styles.statChipText, { color: C.blue }]}>
                {tour.durationDays || tour.duration}D
                {tour.durationNights ? `/${tour.durationNights}N` : ""}
              </Text>
            </View>
          )}
          {tour.rating > 0 && (
            <View style={styles.statChip}>
              <Ionicons name="star" size={11} color={C.amber} />
              <Text style={[styles.statChipText, { color: C.amber }]}>
                {Number(tour.rating).toFixed(1)} ({tour.totalRatings})
              </Text>
            </View>
          )}
          {tour.totalBookings > 0 && (
            <View style={styles.statChip}>
              <Ionicons name="people" size={11} color={C.emerald600} />
              <Text style={[styles.statChipText, { color: C.emerald600 }]}>
                {tour.totalBookings} booked
              </Text>
            </View>
          )}
        </View>

        {/* Footer: price + actions */}
        <View style={styles.cardFooterCol}>
          {priceLabel && (
            <View style={styles.priceBlock}>
              <Text style={styles.priceValue}>{priceLabel}</Text>
              {!!priceSuffix && <Text style={styles.priceSuffix}>{priceSuffix}</Text>}
            </View>
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actBtn, { backgroundColor: C.emerald50 }]} onPress={onPress}>
              <Ionicons name="eye-outline" size={14} color={C.emerald600} />
              <Text style={[styles.actBtnText, { color: C.emerald600 }]}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, { backgroundColor: C.blueLight }]} onPress={onEdit}>
              <Ionicons name="create-outline" size={14} color={C.blue} />
              <Text style={[styles.actBtnText, { color: C.blue }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, { backgroundColor: tour.isPublic ? "#F5F3FF" : "#F8FAFC" }]} onPress={onTogglePublish}>
              <Ionicons name={tour.isPublic ? "globe" : "globe-outline"} size={14} color={tour.isPublic ? C.purple : C.subText} />
              <Text style={[styles.actBtnText, { color: tour.isPublic ? C.purple : C.subText }]}>{tour.isPublic ? "Public" : "Publish"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actBtn, styles.actBtnDel, { backgroundColor: isActive ? C.emerald50 : "#FEF3C7" }]}
              onPress={onToggleActive}
            >
              <Ionicons name={isActive ? "power" : "pause"} size={14} color={isActive ? C.emerald600 : C.amber} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, styles.actBtnDel]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={14} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filtered, onAdd }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={filtered ? "search-outline" : "map-outline"} size={36} color={C.emerald600} />
      </View>
      <Text style={styles.emptyTitle}>{filtered ? "No matches" : "No tours yet"}</Text>
      <Text style={styles.emptyBody}>
        {filtered
          ? "Try a different search term or clear filters."
          : "Create your first tour package — quick add or full detailed mode."}
      </Text>
      {!filtered && (
        <TouchableOpacity style={styles.emptyCta} onPress={onAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyCtaText}>Create your first tour</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  headerGrad: { paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
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
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  chipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  chipText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  chipTextActive: { color: C.emerald700, fontWeight: "800" },
  chipBadge: { minWidth: 18, height: 16, paddingHorizontal: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  chipBadgeActive: { backgroundColor: C.emerald50 },
  chipBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // Stats card pulled up
  statsCardWrap: { marginHorizontal: 16, marginTop: 10 },
  statsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14, paddingVertical: 12,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statBlock: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 17, fontWeight: "900" },
  statLabel: { fontSize: 10, color: C.subText, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingTop: 14, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // Card (image hero card)
  card: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  coverWrap: { position: "relative", width: "100%", height: 180, backgroundColor: "#1F2937" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 100 },

  coverBadges: { position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { color: "#fff", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },

  coverTitleBlock: { position: "absolute", left: 12, right: 12, bottom: 10 },
  coverTitle: { fontSize: 16, fontWeight: "800", color: "#fff", lineHeight: 20 },
  coverDestination: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 4, fontWeight: "600" },

  cardBody: { padding: 14 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border },
  statChipText: { fontSize: 11, fontWeight: "800" },

  cardFooterCol: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  priceBlock: { flexDirection: "row", alignItems: "baseline" },
  priceValue: { fontSize: 18, fontWeight: "900", color: C.emerald600 },
  priceSuffix: { fontSize: 11, color: C.subText, marginLeft: 3, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 6 },
  actBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8 },
  actBtnText: { fontWeight: "800", fontSize: 11.5 },
  actBtnDel: { flex: 0, paddingHorizontal: 12, backgroundColor: "#FEF2F2" },

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

  // #6c — create chooser bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30 },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: C.ink },
  sheetSub: { fontSize: 12.5, color: C.subText, marginTop: 4, marginBottom: 14 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  sheetOptIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetOptTitle: { fontSize: 14.5, fontWeight: "800", color: C.ink },
  sheetOptSub: { fontSize: 11.5, color: C.subText, marginTop: 2 },
  sheetCancel: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  sheetCancelText: { fontSize: 13.5, fontWeight: "700", color: C.subText },
});
