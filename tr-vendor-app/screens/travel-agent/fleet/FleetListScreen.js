// screens/travel-agent/fleet/FleetListScreen.js
// REDESIGNED (v3) — premium "Deep Emerald + Champagne" fleet list.
// Deep gradient header + animated orbs + gold eyebrow + embedded search, a row
// of mini stat-cards, filled pill type-filters, and cinematic vehicle cards with
// a spec-grid (seats / fuel / gearbox), chauffeur pill, prominent rate & actions.
// NOTE: UI-only redesign — every field is still shown, and all state, data
// loading, toggle/delete handlers and API calls are unchanged.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Alert, StatusBar,
  Animated, Easing, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentFleet, updateTravelAgentFleetVehicle, deleteTravelAgentFleetVehicle, FLEET_VEHICLE_TYPE } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, C as T, G } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

// ── Premium warm palette (matches the Add Vehicle form) ──
// Local key names are kept so no JSX changes are needed — only the VALUES now
const GOLD = "#E4C066";
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

// Per-type icon + color so vehicle cards/chips have visual variety.
const TYPE_META = {
  SEDAN:           { icon: "car-sport",    color: C.blue,    label: "Sedan" },
  SUV:             { icon: "car",          color: "#C4703A", label: "SUV" },
  MUV:             { icon: "car",          color: C.purple,  label: "MUV" },
  HATCHBACK:       { icon: "car-sport",    color: "#3FA79A", label: "Hatchback" },
  TEMPO_TRAVELLER: { icon: "bus",          color: C.amber,   label: "Tempo" },
  MINI_BUS:        { icon: "bus",          color: C.emerald600, label: "Mini bus" },
  BUS:             { icon: "bus",          color: "#C65772", label: "Bus" },
  LUXURY_CAR:      { icon: "diamond",      color: "#8A6DD4", label: "Luxury" },
  BIKE:            { icon: "bicycle",      color: C.red,     label: "Bike" },
  SCOOTER:         { icon: "bicycle",      color: "#4A9DBE", label: "Scooter" },
  CAMPER_VAN:      { icon: "trail-sign",   color: C.emerald600, label: "Camper" },
  OTHER:           { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;
// Display helper — prettifies enum-ish values (DIESEL → Diesel). Presentational only.
const titleCase = (s) =>
  s ? String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase() : s;

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
    // A vehicle held by a Fleet Calendar booking can't be talked out of it with
    // the manual flag — the API derives `isBooked` from the booking and would
    // keep reporting it as booked. Say so instead of a silent no-op.
    if (v.isBooked) {
      const b = v.currentBooking || {};
      const until = b.endDate
        ? new Date(b.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : null;
      Alert.alert(
        "Booked in calendar",
        `${b.customerName || "This vehicle"} has it${until ? ` until ${until}` : ""}. ` +
          "Change or cancel the booking in Fleet Calendar to free it up.",
        [
          { text: "Cancel", style: "cancel" },
          // No fleetId param — FleetCalendarScreen doesn't read route params,
          // it always opens on the full fleet.
          { text: "Open calendar", onPress: () => navigation.navigate("TAFleetCalendar") },
        ]
      );
      return;
    }
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
      <StatusBar barStyle="light-content" backgroundColor={T.forestDark} />

      {/* ===== Gradient header with animated orbs + embedded search ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerEyebrow}>YOUR FLEET</Text>
              <Text style={styles.headerTitle}>Fleet</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerCircleBtn}
                onPress={() => navigation.navigate("TAFleetCalendar")}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => navigation.navigate("TAAddEditFleet")}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={22} color={C.emerald700} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Embedded search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicle, brand, reg. no.…"
              placeholderTextColor="#A99F8D"
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

      {/* ===== Stat card — one card, 3 cells, floats over the header bottom ===== */}
      {stats && (
        <View style={styles.statsCard}>
          <StatCell value={stats.total ?? 0} label="Total" icon="car" color={C.emerald600} />
          <View style={styles.statDivider} />
          <StatCell value={stats.active ?? 0} label="Active" icon="checkmark-circle" color={C.blue} />
          <View style={styles.statDivider} />
          <StatCell value={stats.available ?? 0} label="Free" icon="flash" color={GOLD} />
        </View>
      )}

      {/* ===== Section ops — labeled pills + primary "Add Vehicle" CTA ===== */}
      <View style={styles.opsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opsRow}>
          <View style={[styles.opsPill, styles.opsPillActive]}>
            <Ionicons name="car-sport" size={13} color={C.emerald600} />
            <Text style={[styles.opsPillText, { color: C.emerald700 }]}>All Vehicles</Text>
          </View>
          <TouchableOpacity style={styles.opsPill} onPress={() => navigation.navigate("TAFleetCalendar")} activeOpacity={0.85}>
            <Ionicons name="calendar" size={13} color={C.emerald600} />
            <Text style={styles.opsPillText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.opsPill} onPress={() => navigation.navigate("TAFleetInsurance")} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={13} color={C.emerald600} />
            <Text style={styles.opsPillText}>Insurance</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ===== Type filter pills ===== */}
      <View style={styles.chipsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRowOuter}
          contentContainerStyle={styles.chipsRow}
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
          <Text style={styles.loadingText}>Loading vehicles…</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              // Tapping a card opens the read-only detail; Edit is the pencil
              // on the card and on that screen. It used to drop straight into
              // the form, so there was no way to just look at a vehicle.
              onPress={() => navigation.navigate("TAFleetVehicleDetail", { id: item.id, vehicle: item })}
              onEdit={() => navigation.navigate("TAAddEditFleet", { vehicle: item })}
              onToggleAvailable={() => onToggleAvailable(item)}
              onToggleActive={() => onToggleActive(item)}
              onDelete={() => onDelete(item)}
            />
          )}
          ListHeaderComponent={
            vehicles.length > 0 ? (
              <View style={styles.listHead}>
                <Text style={styles.listHeadTitle}>Your vehicles</Text>
                <View style={styles.listHeadBadge}>
                  <Text style={styles.listHeadBadgeText}>{vehicles.length}</Text>
                </View>
              </View>
            ) : null
          }
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
                    colors={[C.emerald500, C.emerald700]}
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
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ minWidth: 0 }}>
        <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

function Chip({ label, icon, count, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.chip, active && { backgroundColor: `${color}12`, borderColor: color }]}
    >
      <View style={styles.chipIconWrap}>
        <View style={[styles.chipIcon, { backgroundColor: active ? color : `${color}18` }]}>
          <Ionicons name={icon} size={16} color={active ? "#fff" : color} />
        </View>
        {count > 0 && (
          <View style={[styles.chipBadge, { backgroundColor: active ? color : C.emerald600 }]}>
            <Text style={styles.chipBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.chipLabel, active && { color, fontWeight: "bold" }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

// One spec column: muted label above, value below, both centred on the cell's
// own axis. The previous version put an icon beside the text and centred the
// whole group, so cells with longer values pushed their icon further left than
// short ones and nothing lined up across the four columns. Stacking guarantees
// every label shares one line and every value shares another, whatever the
// content length. Labels also make each cell self-describing — previously
// "7 seats" carried its own label while "Diesel" and "Manual" carried none.
function Spec({ label, value, color }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.specValue, !!color && { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function VehicleCard({ vehicle, onPress, onEdit, onToggleAvailable, onToggleActive, onDelete }) {
  const isActive = vehicle.isActive !== false;
  const meta = TYPE_META[vehicle.vehicleType] || TYPE_META.OTHER;
  // Two ways a vehicle is unavailable: the agent flipped the manual flag, or
  // the Fleet Calendar holds a booking that hasn't ended yet (`isBooked`,
  // derived server-side). Either one shows as Booked.
  const bookedNow = vehicle.isBooked === true;
  const isAvail = !bookedNow && vehicle.isAvailable !== false;
  const insuranceExpiry = vehicle.insuranceValidity
    ? new Date(vehicle.insuranceValidity)
    : null;
  const daysToExpiry = insuranceExpiry
    ? Math.round((insuranceExpiry - Date.now()) / 86400000)
    : null;
  const isInsuranceSoon = daysToExpiry !== null && daysToExpiry < 30 && daysToExpiry >= 0;
  const isInsuranceExpired = daysToExpiry !== null && daysToExpiry < 0;
  const subLine = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  const rate = vehicle.ratePerDay
    ? { amount: INR(vehicle.ratePerDay), unit: "day" }
    : vehicle.ratePerKm
    ? { amount: INR(vehicle.ratePerKm), unit: "km" }
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.94}>
      {/* ===== Cover =====
          Carries only two chips now. The name, registration and rate moved into
          the white body below, where they're legible without a text-shadow and
          don't fight the photo. */}
      <View style={styles.coverWrap}>
        {vehicle.coverImage ? (
          <RemoteImage source={{ uri: vehicle.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[`${meta.color}26`, `${meta.color}0A`]}
            style={[styles.cover, styles.coverPlaceholder]}
          >
            <Ionicons name={meta.icon} size={44} color={meta.color} />
          </LinearGradient>
        )}

        {/* Top-left: type pill */}
        <View style={[styles.typePill, { borderColor: meta.color }]}>
          <Ionicons name={meta.icon} size={11} color={meta.color} />
          <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        {/* Top-right: booked only — insurance warnings moved to the body strip */}
        {!isAvail && (
          <View style={styles.bookedBadge}>
            <Ionicons name="lock-closed" size={10} color="#fff" />
            <Text style={styles.bookedBadgeText}>BOOKED</Text>
          </View>
        )}
      </View>

      {/* ===== Body ===== */}
      <View style={styles.cardBody}>
        {/* Title + rate share one baseline row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.vName} numberOfLines={1}>{vehicle.vehicleName}</Text>
            {(subLine || vehicle.registrationNumber) && (
              <Text style={styles.vSub} numberOfLines={1}>
                {subLine}
                {vehicle.registrationNumber ? `  ·  ${vehicle.registrationNumber}` : ""}
              </Text>
            )}
          </View>
          <View style={styles.priceBlock}>
            {rate ? (
              <>
                <Text style={styles.priceAmount} numberOfLines={1}>{rate.amount}</Text>
                <Text style={styles.priceUnit}>per {rate.unit}</Text>
              </>
            ) : (
              <Text style={styles.priceOnReq}>On request</Text>
            )}
          </View>
        </View>

        {/* Spec strip — four aligned columns: labels on one line, values on another */}
        <View style={styles.specStrip}>
          <Spec
            label="Seats"
            value={vehicle.seatingCapacity > 0 ? String(vehicle.seatingCapacity) : "—"}
          />
          <View style={styles.specSep} />
          <Spec
            label="Fuel"
            value={vehicle.fuelType ? titleCase(vehicle.fuelType) : "—"}
          />
          <View style={styles.specSep} />
          <Spec
            label="Gearbox"
            value={vehicle.transmission ? titleCase(vehicle.transmission) : "—"}
          />
          <View style={styles.specSep} />
          <Spec
            label="Driver"
            value={vehicle.chauffeurIncluded ? "Chauffeur" : "Self-drive"}
            color={vehicle.chauffeurIncluded ? C.emerald700 : C.text}
          />
        </View>

        {/* Insurance warning — same two conditions as before, now a readable
            inline bar instead of a badge stacked on the photo. */}
        {isInsuranceExpired && (
          <View style={[styles.insBar, { backgroundColor: C.redLight }]}>
            <Ionicons name="alert" size={12} color={C.red} />
            <Text style={[styles.insText, { color: C.red }]}>Insurance expired</Text>
          </View>
        )}
        {!isInsuranceExpired && isInsuranceSoon && (
          <View style={[styles.insBar, { backgroundColor: C.amberLight }]}>
            <Ionicons name="alert-circle" size={12} color={C.amber} />
            <Text style={[styles.insText, { color: "#8A5A10" }]}>
              Insurance expires in {daysToExpiry}d
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.fleetActions}>
          <TouchableOpacity
            style={[styles.fleetActBtn, { backgroundColor: isAvail ? C.emerald50 : C.redLight }]}
            onPress={onToggleAvailable}
            activeOpacity={0.85}
          >
            <Ionicons name={isAvail ? "checkmark-circle" : "lock-closed"} size={14} color={isAvail ? C.emerald600 : C.red} />
            <Text style={[styles.fleetActText, { color: isAvail ? C.emerald600 : C.red }]}>{isAvail ? "Available" : "Booked"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fleetActToggle, { backgroundColor: isActive ? C.emerald50 : C.amberLight }]}
            onPress={onToggleActive}
            activeOpacity={0.85}
          >
            <Ionicons name={isActive ? "power" : "pause"} size={14} color={isActive ? C.emerald600 : C.amber} />
          </TouchableOpacity>
          {/* Icon-only so the labelled Available toggle keeps its width. */}
          <TouchableOpacity style={styles.fleetActEdit} onPress={onEdit} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={14} color={C.emerald600} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fleetActDel} onPress={onDelete} activeOpacity={0.85}>
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
  headerGrad: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: "hidden", position: "relative" },
  orbA: {
    position: "absolute", top: -44, right: -28,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(228,192,102,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -30, left: -34,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(23,166,124,0.14)",
  },
  // paddingTop drops the whole header row (back button, YOUR FLEET / Fleet,
  // action buttons) away from the status bar together, so nothing misaligns.
  // Matches the Insurance screen's header inset.
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 14 },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerAddBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  headerEyebrow: { fontFamily: DISPLAY, color: GOLD, fontSize: 10, fontWeight: "bold", letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 3 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 0.2 },

  // Embedded search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 14, height: 44,
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },

  // Single stat card (3 cells + dividers) — floats over the header's rounded bottom
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -24, zIndex: 2,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1, justifyContent: "center", minWidth: 0 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold" },
  statLabel: { fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold", marginTop: 1, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 30, backgroundColor: C.border },

  // Section ops — labeled pills + primary CTA (Option B)
  opsBar: { backgroundColor: C.bg, marginTop: 12 },
  opsRow: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 12, paddingTop: 2, paddingBottom: 2, gap: 7, flexDirection: "row", alignItems: "center" },
  opsPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },
  opsPillActive: { backgroundColor: C.emerald50, borderColor: C.emerald600 },
  opsPillText: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.text },
  opsPillCta: {
    borderRadius: 999, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  opsPillCtaInner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9 },
  opsPillCtaText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: "#fff" },

  // Type filter chips — rounded-rect tiles like the Add Vehicle "Vehicle type" picker.
  // Fixed-height bar so the row can't collapse behind cards.
  chipsBar: { height: 76, backgroundColor: C.bg, marginTop: 2, zIndex: 1 },
  chipsRowOuter: { flexGrow: 0, flexShrink: 0, height: 76 },
  chipsRow: { paddingHorizontal: 16, paddingTop: 6, gap: 8, flexDirection: "row", alignItems: "center" },
  chip: {
    alignItems: "center", gap: 5,
    paddingTop: 9, paddingBottom: 9, paddingHorizontal: 12,
    borderRadius: 13, backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border, minWidth: 74,
  },
  chipIconWrap: { width: 30, height: 30, position: "relative", alignItems: "center", justifyContent: "center" },
  chipIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chipBadge: {
    position: "absolute", top: -6, right: -6,
    minWidth: 17, height: 17, borderRadius: 8.5,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, borderWidth: 2, borderColor: FILL,
  },
  chipBadgeText: { fontFamily: DISPLAY, fontSize: 9, fontWeight: "bold", color: "#fff" },
  chipLabel: { fontFamily: DISPLAY, fontSize: 11, color: C.text, fontWeight: "bold", textAlign: "center" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginVertical: 6, padding: 11, backgroundColor: C.redLight, borderRadius: 12, borderWidth: 1, borderColor: "#F0CFC9" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 100 },
  // Section header above the cards — creates clear space from the chips row
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 12, paddingHorizontal: 2 },
  listHeadTitle: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.3 },
  listHeadBadge: { backgroundColor: C.emerald50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: "#CFE7DD" },
  listHeadBadgeText: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: C.emerald700 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center", paddingHorizontal: 16 },
  emptyCta: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 13 },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13.5 },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 20, marginBottom: 14, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#2A2216", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 9 } },
      android: { elevation: 4 },
    }),
  },
  coverWrap: { width: "100%", height: 110, backgroundColor: FILL, position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },

  // Type pill (top-left) — light pill with the type colour as border + text
  typePill: {
    position: "absolute", top: 10, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "#fff", borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  typePillText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", letterSpacing: 0.4 },
  bookedBadge: {
    position: "absolute", top: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "rgba(229,72,77,0.95)",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  bookedBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.4 },

  // Body — even 12px inset all round; every block below is spaced on the same
  // 12px rhythm (10 only for the conditional insurance bar, which hugs the strip).
  cardBody: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },

  // Title + rate share a row; rate is right-aligned and emerald so it reads as
  // the card's one "value" number without needing a floating chip on the photo.
  // Both sides of this row are two-line blocks. Matching lineHeight + marginTop
  // on each pair puts the name/amount on one baseline and the sub/unit on the
  // next, instead of the four texts drifting against each other.
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  vName: {
    fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink,
    lineHeight: 19, includeFontPadding: false,
  },
  vSub: {
    fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "600",
    lineHeight: 14, marginTop: 2, includeFontPadding: false,
  },
  priceBlock: { alignItems: "flex-end", maxWidth: "42%" },
  priceAmount: {
    fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.emerald700,
    lineHeight: 19, includeFontPadding: false, fontVariant: ["tabular-nums"],
  },
  priceUnit: {
    fontFamily: DISPLAY, fontSize: 9, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.3, textTransform: "uppercase",
    lineHeight: 14, marginTop: 2, includeFontPadding: false,
  },
  priceOnReq: {
    fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.emerald700,
    includeFontPadding: false,
  },

  // Spec strip — four equal columns. `alignItems: stretch` lets each column own
  // the full band height so the separators span it evenly; the dividers are
  // centred rather than stretched so they read as hairlines, not walls.
  specStrip: {
    flexDirection: "row", alignItems: "stretch", marginTop: 12,
    backgroundColor: FILL, borderRadius: 11,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 8, paddingHorizontal: 2,
  },
  specItem: {
    flex: 1, minWidth: 0, alignItems: "center",
    justifyContent: "flex-start", paddingHorizontal: 3,
  },
  specLabel: {
    fontFamily: DISPLAY, fontSize: 8.5, fontWeight: "bold", color: C.subText,
    letterSpacing: 0.5, textTransform: "uppercase",
    lineHeight: 11, textAlign: "center", includeFontPadding: false,
  },
  specValue: {
    fontFamily: DISPLAY, fontSize: 8, fontWeight: "bold", color: C.ink,
    lineHeight: 11, marginTop: 2, textAlign: "center", includeFontPadding: false,
  },
  specSep: { width: 1, height: 26, alignSelf: "center", backgroundColor: C.border },

  // Insurance warning — inline bar (was a badge stacked on the cover)
  insBar: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
  },
  insText: {
    fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", includeFontPadding: false,
  },

  // Actions — no top rule needed; the spec strip already separates them
  fleetActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  fleetActBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10 },
  fleetActToggle: { alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  fleetActEdit: { alignItems: "center", justifyContent: "center", paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10, backgroundColor: C.emerald50 },
  fleetActDel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10, backgroundColor: C.redLight },
  fleetActText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold" },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
