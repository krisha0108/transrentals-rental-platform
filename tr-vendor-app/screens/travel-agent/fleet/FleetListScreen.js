// screens/travel-agent/fleet/FleetListScreen.js
// REDESIGNED — emerald-themed fleet list with gradient header, embedded
// search + Calendar shortcut, color-themed vehicle type filters, floating
// stats card, and image-hero vehicle cards.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentFleet, updateTravelAgentFleetVehicle, deleteTravelAgentFleetVehicle, FLEET_VEHICLE_TYPE } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import SectionOpsBar from "../_shared/SectionOpsBar";

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
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
};

// Per-type icon + color so vehicle cards/chips have visual variety.
const TYPE_META = {
  SEDAN:           { icon: "car-sport",    color: C.blue,    label: "Sedan" },
  SUV:             { icon: "car",          color: "#F97316", label: "SUV" },
  MUV:             { icon: "car",          color: C.purple,  label: "MUV" },
  HATCHBACK:       { icon: "car-sport",    color: "#06B6D4", label: "Hatchback" },
  TEMPO_TRAVELLER: { icon: "bus",          color: C.amber,   label: "Tempo" },
  MINI_BUS:        { icon: "bus",          color: C.emerald600, label: "Mini bus" },
  BUS:             { icon: "bus",          color: "#EC4899", label: "Bus" },
  LUXURY_CAR:      { icon: "diamond",      color: "#A855F7", label: "Luxury" },
  BIKE:            { icon: "bicycle",      color: C.red,     label: "Bike" },
  SCOOTER:         { icon: "bicycle",      color: "#0EA5E9", label: "Scooter" },
  CAMPER_VAN:      { icon: "trail-sign",   color: C.emerald600, label: "Camper" },
  OTHER:           { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;

export default function FleetListScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
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
      const data = await listTravelAgentFleet({
        search: debouncedSearch,
        vehicleType: typeFilter,
      });
      setVehicles(data.fleets || []);
      setStats(data.stats || null);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load fleet");
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

  // E4 — list-level availability toggle + delete
  const onToggleAvailable = async (v) => {
    const next = !(v.isAvailable !== false);
    setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, isAvailable: next } : x)));
    try {
      await updateTravelAgentFleetVehicle(v.id, { isAvailable: next });
    } catch (e) {
      setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, isAvailable: v.isAvailable } : x)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    }
  };
  const onToggleActive = async (v) => {
    const next = !(v.isActive !== false);
    setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, isActive: next } : x)));
    try {
      await updateTravelAgentFleetVehicle(v.id, { isActive: next });
    } catch (e) {
      setVehicles((prev) => prev.map((x) => (x.id === v.id ? { ...x, isActive: v.isActive } : x)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    }
  };
  const onDelete = (v) => {
    Alert.alert("Delete vehicle?", `"${v.vehicleName || "This vehicle"}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setVehicles((prev) => prev.filter((x) => x.id !== v.id));
          try { await deleteTravelAgentFleetVehicle(v.id); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); load(); }
        },
      },
    ]);
  };

  // Live per-type counts for filter chip badges.
  const typeCounts = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => {
      const k = v.vehicleType || "OTHER";
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [vehicles]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
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
              <Text style={styles.headerTitle}>Fleet</Text>
              <Text style={styles.headerSub}>
                Cars · Buses · Bikes · Luxury · Campers
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.calBtn, { marginRight: 8 }]}
              onPress={() => navigation.navigate("TAFleetInsurance")}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={15} color={C.emerald700} />
              <Text style={styles.calBtnText}>Insurance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calBtn}
              onPress={() => navigation.navigate("TAFleetCalendar")}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={15} color={C.emerald700} />
              <Text style={styles.calBtnText}>Calendar</Text>
            </TouchableOpacity>
          </View>

          {/* Embedded search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicle, brand, reg. no.…"
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

      <SectionOpsBar navigation={navigation} group="fleet" active="TAFleet" />

      {/* ===== Stats card ===== */}
      {stats && (
        <View style={styles.statsCard}>
          <StatCell value={stats.total ?? 0} label="Total" icon="car" color={C.emerald600} />
          <View style={styles.statDivider} />
          <StatCell value={stats.active ?? 0} label="Active" icon="checkmark-circle" color={C.blue} />
          <View style={styles.statDivider} />
          <StatCell value={stats.available ?? 0} label="Free" icon="flash" color={C.amber} />
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
          count={vehicles.length}
          active={typeFilter === "ALL"}
          onPress={() => setTypeFilter("ALL")}
          color={C.emerald600}
        />
        {FLEET_VEHICLE_TYPE.map((t) => {
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
          <Text style={styles.loadingText}>Loading vehicles…</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={() => navigation.navigate("TAAddEditFleet", { vehicle: item })}
              onToggleAvailable={() => onToggleAvailable(item)}
              onToggleActive={() => onToggleActive(item)}
              onDelete={() => onDelete(item)}
            />
          )}
          contentContainerStyle={
            vehicles.length === 0 ? styles.emptyWrap : styles.listContent
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
                <Ionicons name="car-sport-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>
                {typeFilter === "ALL" ? "No vehicles yet" : "No matches"}
              </Text>
              <Text style={styles.emptyBody}>
                {typeFilter === "ALL"
                  ? "Tap + to add your first car, bus, or bike."
                  : "Try a different type filter or clear your search."}
              </Text>
              {typeFilter === "ALL" && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => navigation.navigate("TAAddEditFleet")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.emptyCtaInner}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyCtaText}>Add vehicle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ===== Floating Add FAB ===== */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TAAddEditFleet")}
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
      <Text style={[styles.chipText, active && { color, fontWeight: "800" }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.chipBadge, active && { backgroundColor: color }]}>
          <Text style={[styles.chipBadgeText, active && { color: "#fff" }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function VehicleCard({ vehicle, onPress, onToggleAvailable, onToggleActive, onDelete }) {
  const isActive = vehicle.isActive !== false;
  const meta = TYPE_META[vehicle.vehicleType] || TYPE_META.OTHER;
  const isAvail = vehicle.isAvailable !== false;
  const insuranceExpiry = vehicle.insuranceValidity
    ? new Date(vehicle.insuranceValidity)
    : null;
  const daysToExpiry = insuranceExpiry
    ? Math.round((insuranceExpiry - Date.now()) / 86400000)
    : null;
  const isInsuranceSoon = daysToExpiry !== null && daysToExpiry < 30 && daysToExpiry >= 0;
  const isInsuranceExpired = daysToExpiry !== null && daysToExpiry < 0;
  const subLine = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.coverWrap}>
        {vehicle.coverImage ? (
          <RemoteImage source={{ uri: vehicle.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[`${meta.color}22`, `${meta.color}08`]}
            style={[styles.cover, styles.coverPlaceholder]}
          >
            <Ionicons name={meta.icon} size={48} color={meta.color} />
          </LinearGradient>
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          style={styles.coverOverlay}
        />

        {/* Top-left: type pill */}
        <View style={[styles.typePill, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon} size={11} color="#fff" />
          <Text style={styles.typePillText}>{meta.label}</Text>
        </View>

        {/* Top-right: availability / insurance warnings */}
        <View style={styles.topRightStack}>
          {vehicle.isAvailable === false && (
            <View style={[styles.statusBadge, { backgroundColor: "rgba(239,68,68,0.95)" }]}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
              <Text style={styles.statusBadgeText}>BOOKED</Text>
            </View>
          )}
          {isInsuranceExpired && (
            <View style={[styles.statusBadge, { backgroundColor: "rgba(239,68,68,0.95)", marginTop: 4 }]}>
              <Ionicons name="alert" size={10} color="#fff" />
              <Text style={styles.statusBadgeText}>INSURANCE EXPIRED</Text>
            </View>
          )}
          {!isInsuranceExpired && isInsuranceSoon && (
            <View style={[styles.statusBadge, { backgroundColor: "rgba(245,158,11,0.95)", marginTop: 4 }]}>
              <Ionicons name="alert-circle" size={10} color="#fff" />
              <Text style={styles.statusBadgeText}>INS {daysToExpiry}d</Text>
            </View>
          )}
        </View>

        {/* Bottom: name + brand/reg on dark gradient */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverTitle} numberOfLines={1}>{vehicle.vehicleName}</Text>
          {(subLine || vehicle.registrationNumber) && (
            <Text style={styles.coverSub} numberOfLines={1}>
              {subLine}
              {vehicle.registrationNumber ? `  ·  ${vehicle.registrationNumber}` : ""}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.metaPills}>
          {vehicle.seatingCapacity > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="people" size={11} color={C.text} />
              <Text style={styles.metaPillText}>{vehicle.seatingCapacity} seats</Text>
            </View>
          )}
          {!!vehicle.fuelType && (
            <View style={styles.metaPill}>
              <Ionicons name="flash" size={11} color={C.amber} />
              <Text style={styles.metaPillText}>{vehicle.fuelType}</Text>
            </View>
          )}
          {vehicle.chauffeurIncluded && (
            <View style={[styles.metaPill, { backgroundColor: C.emerald50 }]}>
              <Ionicons name="person" size={11} color={C.emerald700} />
              <Text style={[styles.metaPillText, { color: C.emerald700, fontWeight: "800" }]}>
                Chauffeur
              </Text>
            </View>
          )}
          {!!vehicle.transmission && (
            <View style={styles.metaPill}>
              <Ionicons name="cog" size={11} color={C.text} />
              <Text style={styles.metaPillText}>{vehicle.transmission}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          {vehicle.ratePerDay ? (
            <View>
              <Text style={styles.priceFromLabel}>Rate</Text>
              <Text style={styles.priceLabel}>
                {INR(vehicle.ratePerDay)} <Text style={styles.priceUnit}>/ day</Text>
              </Text>
            </View>
          ) : vehicle.ratePerKm ? (
            <View>
              <Text style={styles.priceFromLabel}>Rate</Text>
              <Text style={styles.priceLabel}>
                {INR(vehicle.ratePerKm)} <Text style={styles.priceUnit}>/ km</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.priceOnRequest}>Price on request</Text>
          )}
          <View style={styles.chevWrap}>
            <Ionicons name="chevron-forward" size={18} color={C.emerald600} />
          </View>
        </View>

        {/* E4 — availability toggle + delete */}
        <View style={styles.fleetActions}>
          <TouchableOpacity
            style={[styles.fleetActBtn, { backgroundColor: isAvail ? C.emerald50 : "#FEE2E2" }]}
            onPress={onToggleAvailable}
            activeOpacity={0.85}
          >
            <Ionicons name={isAvail ? "checkmark-circle" : "lock-closed"} size={14} color={isAvail ? C.emerald600 : C.red} />
            <Text style={[styles.fleetActText, { color: isAvail ? C.emerald600 : C.red }]}>{isAvail ? "Available" : "Booked"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fleetActDel, { backgroundColor: isActive ? C.emerald50 : "#FEF3C7" }]}
            onPress={onToggleActive}
            activeOpacity={0.85}
          >
            <Ionicons name={isActive ? "power" : "pause"} size={14} color={isActive ? C.emerald600 : C.amber} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fleetActDel} onPress={onDelete} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={14} color={C.red} />
            <Text style={[styles.fleetActText, { color: C.red }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // E4 actions
  fleetActions: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  fleetActBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  fleetActDel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#FEF2F2" },
  fleetActText: { fontSize: 12, fontWeight: "800" },

  // Header
  headerGrad: { paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  calBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#fff",
  },
  calBtnText: { color: C.emerald700, fontWeight: "800", fontSize: 12 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, marginHorizontal: 4, paddingHorizontal: 14, height: 44,
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },

  // Floating stats card
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 10,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
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
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  coverWrap: { width: "100%", height: 170, backgroundColor: "#F1F5F9", position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 95 },
  coverFooter: { position: "absolute", left: 14, right: 14, bottom: 12 },
  coverTitle: { color: "#fff", fontSize: 17, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  coverSub: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600", marginTop: 3 },

  // Top-overlay badges
  typePill: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  typePillText: { color: "#fff", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.4 },
  topRightStack: { position: "absolute", top: 12, right: 12, alignItems: "flex-end" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },

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

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
