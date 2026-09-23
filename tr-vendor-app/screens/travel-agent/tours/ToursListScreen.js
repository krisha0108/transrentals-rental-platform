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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentTours, updateTravelAgentTour, deleteTravelAgentTour, getCurrentTravelAgent, TOUR_STATUS } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, SHEET_RADIUS } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
import SheetHandle from "../_shared/SheetHandle";


const STATUS_COLORS = {
  DRAFT:    { bg: "rgba(107,122,114,0.95)", fg: "#fff",  icon: "create",       label: "Draft" },
  ACTIVE:   { bg: "rgba(28,107,82,0.96)",   fg: "#fff",  icon: "checkmark-circle", label: "Active" },
  PAUSED:   { bg: "rgba(184,134,46,0.96)",  fg: "#fff",  icon: "pause-circle", label: "Paused" },
  INACTIVE: { bg: "rgba(192,69,59,0.95)",   fg: "#fff",  icon: "close-circle", label: "Inactive" },
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
  const [isApproved, setIsApproved] = useState(false);

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
      const [data, agent] = await Promise.all([
        listTravelAgentTours({ search: debouncedSearch, status: statusFilter }),
        getCurrentTravelAgent(),
      ]);
      setTours(data.tours || []);
      setStats(data.stats || null);
      setIsApproved(agent?.status === "APPROVED");
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
  // Gate publish proactively (mirrors web's disabled-checkbox + lock badge —
  // src/app/travel-agent/(dashboard)/tours/page.tsx:129-133) instead of
  // firing the request and only finding out from the backend's rejection.
  const onTogglePublish = async (tour) => {
    const next = !tour.isPublic;
    if (next && !isApproved) {
      Alert.alert(
        "Approval required",
        "Your account must be approved before a tour can go public. Complete your KYC documents to get verified."
      );
      return;
    }
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
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* Gradient header */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
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

          {/* Status pill filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRowOuter} contentContainerStyle={styles.chipsRow}>
            {statusChips.map((c) => {
              const active = statusFilter === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setStatusFilter(c.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                >
                  <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
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

      {/* Search — floats on the seam between the header and the content below,
          pulled up so it straddles the gradient's bottom edge. */}
      <View style={styles.searchFloatWrap}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={C.emerald600} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tours…"
            placeholderTextColor={C.subText}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={18} color={C.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
            <SheetHandle />
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
              <View style={[styles.sheetOptIcon, { backgroundColor: "#F6EEDB" }]}>
                <Ionicons name="list" size={20} color={C.gold} />
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
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const TourCard = React.memo(function TourCard({
  tour, onPress, onEdit, onTogglePublish, onToggleActive, onDelete,
}) {
  const isActive = tour.isActive !== false;
  const sc = STATUS_COLORS[tour.status] || STATUS_COLORS.DRAFT;
  const priceLabel = tour.priceType === "ON_REQUEST"
    ? "On request"
    : INR(tour.basePrice || tour.startingPrice);
  const priceSuffix = tour.priceType === "PER_PERSON" ? "/person" : tour.priceType === "PER_GROUP" ? "/group" : "";

  // Facts for the spec strip — same guards the old dot-separated line used.
  const specs = [
    (tour.durationDays || tour.duration) && {
      icon: "calendar-outline",
      value: `${tour.durationDays || tour.duration}D${tour.durationNights ? `/${tour.durationNights}N` : ""}`,
      label: "duration",
    },
    tour.rating > 0 && {
      icon: "star",
      value: Number(tour.rating).toFixed(1),
      label: `${tour.totalRatings} rating${tour.totalRatings !== 1 ? "s" : ""}`,
      gold: true,
    },
    tour.totalBookings > 0 && {
      icon: "ticket-outline",
      value: tour.totalBookings,
      label: `booking${tour.totalBookings !== 1 ? "s" : ""}`,
    },
  ].filter(Boolean);

  return (
    // Cover-hero layout: the photo carries status / published / title /
    // destination / price, and the body holds the spec strip and controls.
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.93}>
      {/* ── Cover ── */}
      <View style={styles.coverWrap}>
        {tour.coverImage ? (
          <RemoteImage source={{ uri: tour.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="image-outline" size={34} color="rgba(107,122,114,0.35)" />
            <Text style={styles.coverPlaceholderText}>No photo</Text>
          </View>
        )}

        {/* Scrim — only what the badges need at the top, plus a whisper at the
            bottom so the photo doesn't hard-cut into the white body. The title
            lives below the image now, so no heavy bottom gradient. */}
        <LinearGradient
          colors={["rgba(11,32,25,0.34)", "rgba(11,32,25,0)", "rgba(11,32,25,0.12)"]}
          locations={[0, 0.4, 1]}
          style={styles.coverOverlay}
          pointerEvents="none"
        />

        {/* Paused/inactive tours read dimmer than live ones. */}
        {!isActive && <View style={styles.inactiveVeil} pointerEvents="none" />}

        {/* Status tag — solid coloured cap + frosted label */}
        <View style={styles.statusTag}>
          <View style={[styles.statusTagCap, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={11} color="#fff" />
          </View>
          <Text style={styles.statusTagText} numberOfLines={1}>{sc.label}</Text>
        </View>

        {tour.isPublic ? (
          <View style={styles.publicBadge}>
            <View style={styles.publicDot} />
            <Text style={styles.publicBadgeText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.globeOnlyBadge}>
            <Ionicons name="globe-outline" size={14} color="rgba(255,255,255,0.82)" />
          </View>
        )}

      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Head — title/destination on the left, price plate on the right.
            One row, so a long title can never collide with the price. */}
        <View style={styles.headRow}>
          <View style={styles.headMain}>
            <Text style={styles.title} numberOfLines={1}>{tour.title}</Text>
            {!!tour.destination && (
              <View style={styles.destRow}>
                <Ionicons name="location" size={11} color={C.gold} />
                <Text style={styles.destText} numberOfLines={1}>{tour.destination}</Text>
              </View>
            )}
          </View>

          {!!priceLabel && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceValue} numberOfLines={1}>{priceLabel}</Text>
              {!!priceSuffix && <Text style={styles.priceSuffix}>{priceSuffix}</Text>}
            </View>
          )}
        </View>

        {specs.length > 0 && (
          <View style={styles.specStrip}>
            {specs.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.specDivider} />}
                <View style={styles.specCell}>
                  <Ionicons name={s.icon} size={12} color={s.gold ? C.gold : C.emerald600} />
                  <Text style={styles.specValue} numberOfLines={1}>{s.value}</Text>
                  <Text style={styles.specLabel} numberOfLines={1}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Controls — Edit and Publish carry labels; the two state toggles stay
            compact. Each is tinted by what it does. */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actBtn, { backgroundColor: C.amberLight, borderColor: `${C.gold}45` }]}
            onPress={onEdit}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit tour"
          >
            <Ionicons name="create-outline" size={14} color={C.gold} />
            <Text style={[styles.actBtnText, { color: C.gold }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actBtn,
              tour.isPublic
                ? { backgroundColor: "#E4EFF2", borderColor: "rgba(46,110,124,0.3)" }
                : { backgroundColor: "#F4F1E9", borderColor: C.border },
            ]}
            onPress={onTogglePublish}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tour.isPublic ? "Unpublish tour" : "Publish tour"}
          >
            <Ionicons
              name={tour.isPublic ? "globe" : "globe-outline"}
              size={14}
              color={tour.isPublic ? "#2E6E7C" : C.subText}
            />
            {/* The label names the ACTION, not the state — "Public" read as a
                status badge next to two other buttons that are all verbs. The
                LIVE pill on the cover already carries the state. */}
            <Text style={[styles.actBtnText, { color: tour.isPublic ? "#2E6E7C" : C.subText }]}>
              {tour.isPublic ? "Unpublish" : "Publish"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actIconBtn,
              isActive
                ? { backgroundColor: C.emerald50, borderColor: `${C.emerald600}3D` }
                : { backgroundColor: C.amberLight, borderColor: `${C.amber}3D` },
            ]}
            onPress={onToggleActive}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isActive ? "Pause tour" : "Activate tour"}
          >
            <Ionicons name={isActive ? "power" : "pause"} size={15} color={isActive ? C.emerald600 : C.amber} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actIconBtn, { backgroundColor: "#FBEDEB", borderColor: `${C.red}30` }]}
            onPress={onDelete}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Delete tour"
          >
            <Ionicons name="trash-outline" size={15} color={C.red} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
  // paddingBottom leaves room for the floating search bar (pulled up 24px) so
  // it never covers the status chips.
  headerGrad: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 30, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "bold", marginTop: 2 },

  // Floating search — negative marginTop lifts it onto the header/content seam.
  searchFloatWrap: { marginHorizontal: 16, marginTop: -24, zIndex: 5 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 9,
    paddingHorizontal: 15, height: 46,
    backgroundColor: C.card, borderRadius: 999,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, paddingVertical: 0, fontWeight: "600" },

  chipsRowOuter: { flexGrow: 0, flexShrink: 0, height: 48 },
  chipsRow: { paddingTop: 12, gap: 6, flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  chipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  chipText: { fontFamily: DISPLAY, fontSize: 12, color: "#fff", fontWeight: "bold" },
  chipTextActive: { color: C.emerald700, fontWeight: "bold" },
  chipBadge: { minWidth: 18, height: 16, paddingHorizontal: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  chipBadgeActive: { backgroundColor: C.emerald50 },
  chipBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold" },

  // Stats card — single-row blocks (icon · value · label). Stacking them cost
  // ~40px of vertical space for the same three numbers.
  statsCardWrap: { marginHorizontal: 16, marginTop: 10 },
  statsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 12, paddingVertical: 10,
    shadowColor: C.shadow, shadowOpacity: 0.09, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statBlock: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 5, minWidth: 0,
  },
  statValue: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", includeFontPadding: false },
  statLabel: {
    fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold",
    textTransform: "uppercase", letterSpacing: 0.4, includeFontPadding: false,
  },
  statDivider: { width: 1, height: 18, backgroundColor: C.border },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, padding: 10, backgroundColor: "#FBEDEB", borderRadius: 10, borderWidth: 1, borderColor: "rgba(192,69,59,0.2)" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingTop: 14, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // ── Card ──────────────────────────────────────────────────────────
  // Cover-hero: photo on top, spec strip + controls below. The soft wide
  // shadow + hairline border + generous radius carry the "premium" read.
  card: {
    backgroundColor: C.card, borderRadius: 18,
    marginBottom: 11, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  // ── Cover ──
  // Deliberately letterboxed — the photo sets the mood, the body carries the
  // facts, and a short cover keeps the list scannable.
  coverWrap: { height: 120, backgroundColor: "#EFE8DA", position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center", gap: 6 },
  coverPlaceholderText: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: C.subText,
    letterSpacing: 0.8, textTransform: "uppercase", includeFontPadding: false,
  },
  coverOverlay: { ...StyleSheet.absoluteFillObject },
  // Paused/inactive tours sit behind a warm veil so live ones pop in the list.
  inactiveVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(247,244,238,0.34)" },

  // Status tag — solid coloured cap + frosted label, top-left.
  statusTag: {
    position: "absolute", top: 9, left: 9,
    flexDirection: "row", alignItems: "center", gap: 5,
    padding: 2.5, paddingRight: 9, borderRadius: 999,
    backgroundColor: "rgba(11,32,25,0.52)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
  },
  statusTagCap: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  statusTagText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 10, fontWeight: "bold",
    letterSpacing: 0.5, textTransform: "uppercase", includeFontPadding: false,
  },

  // Published state — emerald "LIVE" pill, or a quiet frosted globe when not.
  publicBadge: {
    position: "absolute", top: 9, right: 9,
    flexDirection: "row", alignItems: "center", gap: 5,
    height: 23, paddingHorizontal: 9, borderRadius: 999,
    backgroundColor: "rgba(28,107,82,0.94)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
  },
  publicDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7BE3B6" },
  publicBadgeText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold",
    letterSpacing: 0.9, includeFontPadding: false,
  },
  globeOnlyBadge: {
    position: "absolute", top: 9, right: 9,
    width: 25, height: 25, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.scrim,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.20)",
  },

  // ── Body ──
  body: { padding: 11, gap: 9 },

  // Head — title/destination left, price plate right. Title sits on the white
  // body (not over the photo) so it stays crisp regardless of the cover image.
  headRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  headMain: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink,
    lineHeight: 19, includeFontPadding: false,
  },
  destRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  destText: {
    fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },

  // Price plate — emerald-tinted so the amount reads as the card's hard fact
  // against the white body.
  priceBadge: {
    flexDirection: "row", alignItems: "baseline",
    maxWidth: 128, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 11, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: `${C.emerald600}33`,
  },
  priceValue: {
    fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.emerald600,
    flexShrink: 1, includeFontPadding: false,
  },
  priceSuffix: {
    fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, marginLeft: 2,
    fontWeight: "bold", includeFontPadding: false,
  },

  // Facts as a bordered "spec sheet" strip rather than a loose meta line.
  // Single-row cells (icon · value · label) — stacking them cost ~18px of
  // card height for no extra information.
  specStrip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.bg, borderRadius: 12,
    paddingVertical: 7, paddingHorizontal: 2,
    borderWidth: 1, borderColor: C.border,
  },
  specCell: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 4, minWidth: 0,
  },
  specValue: {
    fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.ink,
    includeFontPadding: false,
  },
  specLabel: {
    fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },
  specDivider: { width: 1, height: 16, backgroundColor: C.border },

  // Controls — two labelled buttons flex to fill, two icon toggles stay fixed.
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actBtn: {
    flex: 1, height: 33, flexDirection: "row", gap: 5,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10, borderWidth: 1,
  },
  actBtnText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", includeFontPadding: false },
  actIconBtn: {
    width: 33, height: 33, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  // Empty
  empty: { alignItems: "center", padding: 28 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, textAlign: "center" },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
  emptyCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: C.emerald600 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13.5 },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 18,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, borderRadius: 28, alignItems: "center", justifyContent: "center" },

  // #6c — create chooser bottom sheet
  sheetOverlay: { flex: 1, backgroundColor: C.scrim, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, padding: 20, paddingBottom: 30 },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#D8D0C0", marginBottom: 14 },
  sheetTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: "bold", color: C.ink },
  sheetSub: { fontFamily: DISPLAY, fontSize: 12.5, color: C.subText, marginTop: 4, marginBottom: 14 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  sheetOptIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetOptTitle: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: C.ink },
  sheetOptSub: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, marginTop: 2 },
  sheetCancel: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  sheetCancelText: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.subText },
});
