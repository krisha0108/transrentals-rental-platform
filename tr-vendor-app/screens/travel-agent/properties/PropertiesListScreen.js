// screens/travel-agent/properties/PropertiesListScreen.js
// REDESIGNED — emerald-themed properties list with gradient header,
// embedded search, type filter chips, floating stats card, and image-hero
// property cards (matching Tours list pattern).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentProperties, updateTravelAgentProperty, deleteTravelAgentProperty, PROPERTY_TYPE } from "../../api/travelAgentClient";
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
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  purple: "#8B5CF6",
};

// Per-type colour + icon so cards have visual variety.
const TYPE_META = {
  RESORT:      { icon: "umbrella",      color: "#F97316", label: "Resort" },
  HOTEL:       { icon: "business",      color: C.blue,    label: "Hotel" },
  HOMESTAY:    { icon: "home",          color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",          color: C.purple,  label: "Apartment" },
  VILLA:       { icon: "diamond",       color: "#EC4899", label: "Villa" },
  GUEST_HOUSE: { icon: "people",        color: C.amber,   label: "Guest house" },
  HOSTEL:      { icon: "bed",           color: "#06B6D4", label: "Hostel" },
  ROOMS:       { icon: "bed-outline",   color: "#64748B", label: "Rooms" },
  OTHER:       { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;

export default function PropertiesListScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
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
      const data = await listTravelAgentProperties({
        search: debouncedSearch,
        propertyType: typeFilter,
      });
      setProperties(data.properties || []);
      setStats(data.stats || null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, typeFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  // E4 — list-level active toggle + delete
  const onToggleActive = async (p) => {
    const next = !(p.isActive !== false);
    setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: next } : x)));
    try {
      await updateTravelAgentProperty(p.id, { isActive: next });
    } catch (e) {
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: p.isActive } : x)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    }
  };
  const onTogglePublish = async (p) => {
    const next = !p.isPublic;
    setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, isPublic: next } : x)));
    try {
      await updateTravelAgentProperty(p.id, { isPublic: next });
    } catch (e) {
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, isPublic: p.isPublic } : x)));
      Alert.alert(
        next ? "Can't publish" : "Error",
        e?.response?.data?.error || e?.message || (next ? "Approval required to publish." : "Failed to update")
      );
    }
  };
  const onDelete = (p) => {
    Alert.alert("Delete property?", `"${p.name || "This property"}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setProperties((prev) => prev.filter((x) => x.id !== p.id));
          try { await deleteTravelAgentProperty(p.id); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); load(); }
        },
      },
    ]);
  };

  // Compute per-type counts from loaded list for filter pills.
  const typeCounts = useMemo(() => {
    const m = {};
    properties.forEach((p) => {
      const k = p.propertyType || "OTHER";
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [properties]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header with embedded search ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 18 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Properties</Text>
              <Text style={styles.headerSub}>
                Resorts · Hotels · Villas · Homestays
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("TAAddEditProperty")}
            >
              <Ionicons name="add-circle" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, city…"
              placeholderTextColor="#A3B3C2"
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={C.subText} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Stats card ===== */}
      {stats && (
        <View style={styles.statsCard}>
          <StatCell value={stats.total ?? 0} label="Total" icon="bed" color={C.emerald600} />
          <View style={styles.statDivider} />
          <StatCell value={stats.active ?? 0} label="Active" icon="checkmark-circle" color={C.blue} />
          <View style={styles.statDivider} />
          <StatCell value={stats.published ?? 0} label="Public" icon="globe" color={C.purple} />
        </View>
      )}

      {/* ===== Type filter chips ===== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={{ flexGrow: 0 }}
      >
        <Chip
          label="All"
          icon="apps"
          count={properties.length}
          active={typeFilter === "ALL"}
          onPress={() => setTypeFilter("ALL")}
          color={C.emerald600}
        />
        {PROPERTY_TYPE.map((t) => {
          const meta = TYPE_META[t] || TYPE_META.OTHER;
          return (
            <Chip
              key={t}
              label={meta.label}
              icon={meta.icon}
              count={typeCounts[t] || 0}
              active={typeFilter === t}
              onPress={() => setTypeFilter(t)}
              color={meta.color}
            />
          );
        })}
      </ScrollView>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading properties…</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() =>
                navigation.navigate("TAAddEditProperty", { property: item })
              }
              onToggleActive={() => onToggleActive(item)}
              onTogglePublish={() => onTogglePublish(item)}
              onDelete={() => onDelete(item)}
            />
          )}
          contentContainerStyle={
            properties.length === 0 ? styles.emptyWrap : styles.listContent
          }
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
                <Ionicons name="bed-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>
                {typeFilter === "ALL" ? "No properties yet" : "No matches"}
              </Text>
              <Text style={styles.emptyBody}>
                {typeFilter === "ALL"
                  ? "Tap + to add your first resort, hotel, villa, or homestay."
                  : "Try a different type filter or clear your search."}
              </Text>
              {typeFilter === "ALL" && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => navigation.navigate("TAAddEditProperty")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.emptyCtaInner}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyCtaText}>Add property</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ===== Floating Add FAB (emerald gradient) ===== */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TAAddEditProperty")}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[C.emerald500, C.emerald700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={15} color={color} />
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
      style={[
        styles.chip,
        active && { backgroundColor: `${color}18`, borderColor: color },
      ]}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={13} color={active ? color : C.subText} />
      <Text
        style={[
          styles.chipText,
          active && { color, fontWeight: "800" },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            styles.chipBadge,
            active && { backgroundColor: color },
          ]}
        >
          <Text
            style={[
              styles.chipBadgeText,
              active && { color: "#fff" },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PropertyCard({ property, onPress, onToggleActive, onTogglePublish, onDelete }) {
  const isActive = property.isActive !== false;
  const isPublic = !!property.isPublic;
  const priceLabel = INR(property.startingPrice);
  const meta = TYPE_META[property.propertyType] || TYPE_META.OTHER;
  const cityLine = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Cover image (180px hero) */}
      <View style={styles.coverWrap}>
        {property.coverImage ? (
          <RemoteImage
            source={{ uri: property.coverImage }}
            style={styles.cover}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[`${meta.color}22`, `${meta.color}08`]}
            style={[styles.cover, styles.coverPlaceholder]}
          >
            <Ionicons name={meta.icon} size={44} color={meta.color} />
          </LinearGradient>
        )}

        {/* Gradient overlay (bottom-up) for text readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={styles.coverOverlay}
        />

        {/* Top-left type pill (color-themed) */}
        <View style={[styles.typePill, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon} size={11} color="#fff" />
          <Text style={styles.typePillText}>{meta.label}</Text>
        </View>

        {/* Top-right public badge */}
        {property.isPublic && (
          <View style={styles.publicBadge}>
            <Ionicons name="globe" size={10} color="#fff" />
            <Text style={styles.publicBadgeText}>PUBLIC</Text>
          </View>
        )}

        {/* Bottom: title + city laid over the dark gradient overlay */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverTitle} numberOfLines={1}>{property.name}</Text>
          {!!cityLine && (
            <View style={styles.cityRow}>
              <Ionicons name="location" size={11} color="rgba(255,255,255,0.9)" />
              <Text style={styles.coverCity} numberOfLines={1}>{cityLine}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Body: rooms + price + chevron */}
      <View style={styles.cardBody}>
        <View style={styles.metaPills}>
          {property.totalRooms > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="bed" size={11} color={C.text} />
              <Text style={styles.metaPillText}>
                {property.totalRooms} {property.totalRooms > 1 ? "rooms" : "room"}
              </Text>
            </View>
          )}
          {property.totalCapacity > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="people" size={11} color={C.text} />
              <Text style={styles.metaPillText}>{property.totalCapacity} guests</Text>
            </View>
          )}
          {property.status && property.status !== "ACTIVE" && (
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor:
                    property.status === "INACTIVE" ? C.amberLight : "#FEE2E2",
                },
              ]}
            >
              <Text
                style={[
                  styles.metaPillText,
                  {
                    color:
                      property.status === "INACTIVE" ? C.amber : C.red,
                    fontWeight: "800",
                  },
                ]}
              >
                {property.status}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          {priceLabel ? (
            <View>
              <Text style={styles.priceFromLabel}>Starting from</Text>
              <Text style={styles.priceLabel}>
                {priceLabel} <Text style={styles.priceUnit}>/ night</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.priceOnRequest}>Price on request</Text>
          )}
          <View style={styles.chevWrap}>
            <Ionicons name="chevron-forward" size={18} color={C.emerald600} />
          </View>
        </View>

        {/* E4 — active + publish toggles + delete */}
        <View style={styles.propActions}>
          <TouchableOpacity
            style={[styles.propActBtn, { backgroundColor: isActive ? C.emerald50 : C.amberLight }]}
            onPress={onToggleActive}
            activeOpacity={0.85}
          >
            <Ionicons name={isActive ? "checkmark-circle" : "pause-circle"} size={14} color={isActive ? C.emerald600 : C.amber} />
            <Text style={[styles.propActText, { color: isActive ? C.emerald600 : C.amber }]}>{isActive ? "Active" : "Inactive"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.propActBtn, { backgroundColor: isPublic ? "#EDE9FE" : "#F1F5F9" }]}
            onPress={onTogglePublish}
            activeOpacity={0.85}
          >
            <Ionicons name={isPublic ? "globe" : "globe-outline"} size={14} color={isPublic ? C.purple : C.subText} />
            <Text style={[styles.propActText, { color: isPublic ? C.purple : C.subText }]}>{isPublic ? "Public" : "Publish"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.propActDel} onPress={onDelete} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={14} color={C.red} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  // Search inside header
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, marginHorizontal: 4, paddingHorizontal: 14, height: 44,
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },

  // Floating stats
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 10,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 10.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  // Type filter chips
  chipsRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 8, flexDirection: "row" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 12, color: C.text, fontWeight: "600" },
  chipBadge: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E2E8F0" },
  chipBadgeText: { fontSize: 10, fontWeight: "800", color: C.text },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginVertical: 6, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center", paddingHorizontal: 16 },
  emptyCta: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 16, marginBottom: 14, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  coverWrap: { width: "100%", height: 180, backgroundColor: "#F1F5F9", position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 100 },
  coverFooter: { position: "absolute", left: 14, right: 14, bottom: 12 },
  coverTitle: { color: "#fff", fontSize: 17, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  coverCity: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "600", flex: 1 },

  // Top-overlay badges
  typePill: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  typePillText: { color: "#fff", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.4 },
  publicBadge: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: "rgba(16,185,129,0.95)",
  },
  publicBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },

  // Body
  cardBody: { padding: 14 },
  metaPills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F1F5F9" },
  metaPillText: { fontSize: 11, color: C.text, fontWeight: "700" },

  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceFromLabel: { fontSize: 10, color: C.subText, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  priceLabel: { fontSize: 16, color: C.emerald700, fontWeight: "900", marginTop: 1 },
  priceUnit: { fontSize: 11, color: C.subText, fontWeight: "600" },
  priceOnRequest: { fontSize: 13, color: C.subText, fontWeight: "700", fontStyle: "italic" },
  chevWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },

  // E4 actions
  propActions: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  propActBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  propActDel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#FEF2F2" },
  propActText: { fontSize: 12, fontWeight: "800" },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
