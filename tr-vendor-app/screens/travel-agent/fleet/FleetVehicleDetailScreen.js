// screens/travel-agent/fleet/FleetVehicleDetailScreen.js
// Read-only detail view for one fleet vehicle, in the same "Deep Emerald +
// Champagne" language as the fleet list and the Add/Edit form.
//
// The list card used to open the edit form directly, so there was no way to
// just *look* at a vehicle — every tap dropped you into a 950-line form. This
// screen is the landing spot instead; Edit is one tap away.
//
// Backend: GET /api/travel-agent/fleet/[id]
//
// Route params: { id, vehicle? }. `vehicle` is the row the list already has,
// used to paint the screen immediately while the fetch refreshes it.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  getTravelAgentFleetVehicle,
  updateTravelAgentFleetVehicle,
  deleteTravelAgentFleetVehicle,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const GOLD = "#E4C066";
const FILL = "#FBF8F1";
const HEADER_GRAD = ["#0F2A22", "#16382E", "#1C6B52"];

// Same table as the list and the form, so a vehicle reads identically wherever
// you meet it.
const TYPE_META = {
  SEDAN:           { icon: "car-sport",    color: C.blue,       label: "Sedan" },
  SUV:             { icon: "car",          color: "#C4703A",    label: "SUV" },
  MUV:             { icon: "car",          color: C.purple,     label: "MUV" },
  HATCHBACK:       { icon: "car-sport",    color: "#3FA79A",    label: "Hatchback" },
  TEMPO_TRAVELLER: { icon: "bus",          color: C.amber,      label: "Tempo" },
  MINI_BUS:        { icon: "bus",          color: C.emerald600, label: "Mini bus" },
  BUS:             { icon: "bus",          color: "#C65772",    label: "Bus" },
  LUXURY_CAR:      { icon: "diamond",      color: "#8A6DD4",    label: "Luxury" },
  BIKE:            { icon: "bicycle",      color: C.red,        label: "Bike" },
  SCOOTER:         { icon: "bicycle",      color: "#4A9DBE",    label: "Scooter" },
  CAMPER_VAN:      { icon: "trail-sign",   color: C.emerald600, label: "Camper" },
  OTHER:           { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;

const titleCase = (s) =>
  !s ? "" : String(s).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso) => {
  try {
    return iso
      ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
  } catch {
    return "—";
  }
};

/** amenities / galleryImages / chauffeurLanguages are JSON array strings. */
function parseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    // chauffeurLanguages is sometimes a plain comma list rather than JSON.
    return String(raw).split(",").map((x) => x.trim()).filter(Boolean);
  }
}

/** Days until a validity date; negative once expired. null when unset. */
function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86400000);
}

export default function FleetVehicleDetailScreen({ navigation, route }) {
  const { id, vehicle: seed } = route?.params || {};

  const [vehicle, setVehicle] = useState(seed || null);
  const [loading, setLoading] = useState(!seed);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const vehicleId = id || seed?.id;

  const load = useCallback(async () => {
    if (!vehicleId) return;
    setError(null);
    try {
      const data = await getTravelAgentFleetVehicle(vehicleId);
      setVehicle(data?.fleet || data?.vehicle || data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load vehicle");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);
  // Coming back from the edit form should show the edit, not the stale copy.
  useEffect(() => navigation.addListener("focus", load), [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const patch = async (partial, revert) => {
    setVehicle((v) => ({ ...v, ...partial }));
    setBusy(true);
    try {
      await updateTravelAgentFleetVehicle(vehicle.id, partial);
    } catch (e) {
      setVehicle((v) => ({ ...v, ...revert }));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const onToggleActive = () => {
    const next = !(vehicle.isActive !== false);
    patch({ isActive: next }, { isActive: vehicle.isActive });
  };

  const onToggleAvailable = () => {
    // A vehicle held by a Fleet Calendar booking can't be talked out of it with
    // the manual flag — the API derives `isBooked` from the booking and would
    // keep reporting it as booked. Say so instead of a silent no-op.
    if (vehicle.isBooked) {
      const b = vehicle.currentBooking || {};
      const until = b.endDate
        ? new Date(b.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        : null;
      Alert.alert(
        "Booked in calendar",
        `${b.customerName || "This vehicle"} has it${until ? ` until ${until}` : ""}. ` +
          "Change or cancel the booking in Fleet Calendar to free it up.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open calendar", onPress: () => navigation.navigate("TAFleetCalendar") },
        ]
      );
      return;
    }
    const next = !(vehicle.isAvailable !== false);
    patch({ isAvailable: next }, { isAvailable: vehicle.isAvailable });
  };

  const onDelete = () => {
    Alert.alert(
      "Delete vehicle?",
      `"${vehicle?.vehicleName || "This vehicle"}" will be removed permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTravelAgentFleetVehicle(vehicle.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  const callChauffeur = () => {
    if (!vehicle?.chauffeurPhone) return;
    Linking.openURL(`tel:${vehicle.chauffeurPhone}`).catch(() => {});
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading vehicle…</Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <SafeAreaView edges={["top"]} style={{ padding: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtnLight}>
            <Ionicons name="arrow-back" size={22} color={C.ink} />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.loadingWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={40} color={C.red} />
          </View>
          <Text style={styles.emptyTitle}>{error || "Vehicle not found"}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const meta = TYPE_META[vehicle.vehicleType] || TYPE_META.OTHER;
  const isActive = vehicle.isActive !== false;
  const bookedNow = vehicle.isBooked === true;
  const isAvail = !bookedNow && vehicle.isAvailable !== false;
  const gallery = parseArray(vehicle.galleryImages);
  const amenities = parseArray(vehicle.amenities);
  const languages = parseArray(vehicle.chauffeurLanguages);
  const rate = INR(vehicle.ratePerDay) || INR(vehicle.ratePerKm);
  const rateUnit = vehicle.ratePerDay ? "per day" : vehicle.ratePerKm ? "per km" : null;

  // Header meta line — built from whatever exists so the title never sits alone
  // on an empty gradient.
  const headerMeta = [
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ")
      ? { key: "model", icon: "pricetag", text: [vehicle.brand, vehicle.model].filter(Boolean).join(" ") }
      : null,
    vehicle.registrationNumber ? { key: "reg", icon: "card", text: vehicle.registrationNumber } : null,
    vehicle.baseLocation ? { key: "base", icon: "location", text: vehicle.baseLocation } : null,
  ].filter(Boolean).slice(0, 2);

  // Only the figures this vehicle has — a strip of "— — —" reads as a broken
  // screen rather than an incomplete listing.
  const facts = [
    { key: "seats",   icon: "people",   label: "Seats",   value: vehicle.seatingCapacity, tint: C.emerald50,   color: C.emerald600 },
    { key: "luggage", icon: "briefcase", label: "Bags",   value: vehicle.luggageCapacity, tint: C.blueLight,   color: C.blue },
    { key: "fuel",    icon: "flash",    label: "Fuel",    value: titleCase(vehicle.fuelType), tint: C.purpleLight, color: C.purple },
    { key: "trans",   icon: "settings", label: "Gearbox", value: titleCase(vehicle.transmission), tint: C.amberLight, color: C.amber },
  ].filter((f) => f.value != null && f.value !== "" && f.value !== 0);

  // Compliance dates, with the same "expires in Nd" treatment the list card
  // uses for insurance — extended to fitness and permit, since all three
  // ground a vehicle when they lapse.
  const docs = [
    { key: "ins",  label: "Insurance", date: vehicle.insuranceValidity, extra: vehicle.insuranceProvider },
    { key: "fit",  label: "Fitness",   date: vehicle.fitnessValidity },
    { key: "perm", label: "Permit",    date: null, extra: vehicle.permitType },
  ].filter((d) => d.date || d.extra);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ═══════════ Header (fixed) ═══════════
          Outside the ScrollView so back / edit / delete stay reachable while
          the detail scrolls — same as the other Travel Agent detail screens. */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 22 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCircleBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.headerCircleBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("TAAddEditFleet", { vehicle })}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.95)" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            <View style={styles.headerTypeChip}>
              <Ionicons name={meta.icon} size={11} color="#fff" />
              <Text style={styles.headerEyebrow}>{meta.label.toUpperCase()}</Text>
            </View>

            <Text style={styles.headerTitle} numberOfLines={2}>{vehicle.vehicleName}</Text>

            {headerMeta.length > 0 && (
              <View style={styles.headerMetaRow}>
                {headerMeta.map((m, i) => (
                  <React.Fragment key={m.key}>
                    {i > 0 && <View style={styles.headerMetaDot} />}
                    <View style={styles.headerMetaItem}>
                      <Ionicons name={m.icon} size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.headerSub} numberOfLines={1}>{m.text}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} colors={[C.emerald600]} />
        }
      >
        {/* ═══════════ Cover ═══════════ Just the photo. */}
        <View style={styles.coverWrap}>
          <View style={styles.coverCard}>
            {vehicle.coverImage ? (
              <RemoteImage source={{ uri: vehicle.coverImage }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverEmpty]}>
                <Ionicons name={meta.icon} size={40} color={meta.color} />
                <Text style={styles.coverEmptyText}>No cover image</Text>
              </View>
            )}
          </View>
        </View>

        {gallery.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
            {gallery.map((uri, i) => (
              <RemoteImage key={`${uri}-${i}`} source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        {/* ═══════════ Rate + status ═══════════ */}
        <View style={styles.section}>
          <View style={styles.headlineCard}>
            {rate ? (
              <View style={styles.priceBlock}>
                <Text style={styles.priceBlockValue}>{rate}</Text>
                <Text style={styles.priceBlockUnit}>{rateUnit}</Text>
              </View>
            ) : (
              <Text style={styles.priceBlockMuted}>No rate set</Text>
            )}
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: isActive ? C.emerald50 : C.amberLight }]}>
                <Text style={[styles.pillText, { color: isActive ? C.emerald600 : C.amber }]}>
                  {isActive ? "ACTIVE" : "PAUSED"}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: isAvail ? C.emerald50 : C.redLight }]}>
                <Text style={[styles.pillText, { color: isAvail ? C.emerald600 : C.red }]}>
                  {isAvail ? "FREE" : "BOOKED"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════ Fact strip ═══════════ */}
        {facts.length > 0 && (
          <View style={styles.statsCard}>
            {facts.map((f) => (
              <Stat key={f.key} icon={f.icon} label={f.label} value={f.value} tint={f.tint} color={f.color} />
            ))}
          </View>
        )}

        {/* ═══════════ Status toggles ═══════════ */}
        <View style={styles.section}>
          <View style={styles.card}>
            {bookedNow && (
              <View style={styles.bookedNotice}>
                <Ionicons name="lock-closed" size={13} color={C.red} />
                <Text style={styles.bookedNoticeText} numberOfLines={2}>
                  Held by a calendar booking
                  {vehicle.currentBooking?.customerName ? ` — ${vehicle.currentBooking.customerName}` : ""}
                  {vehicle.currentBooking?.endDate
                    ? ` until ${formatDate(vehicle.currentBooking.endDate)}`
                    : ""}
                </Text>
              </View>
            )}
            <View style={[styles.actions, !bookedNow && { marginTop: 0, paddingTop: 0, borderTopWidth: 0 }]}>
              <TouchableOpacity
                style={[
                  styles.actBtn,
                  isActive
                    ? { backgroundColor: C.emerald50, borderColor: `${C.emerald600}3D` }
                    : { backgroundColor: C.amberLight, borderColor: `${C.amber}3D` },
                ]}
                onPress={onToggleActive}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Ionicons name={isActive ? "power" : "pause"} size={14} color={isActive ? C.emerald600 : C.amber} />
                <Text style={[styles.actText, { color: isActive ? C.emerald600 : C.amber }]}>
                  {isActive ? "Active" : "Inactive"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actBtn,
                  isAvail
                    ? { backgroundColor: C.emerald50, borderColor: `${C.emerald600}3D` }
                    : { backgroundColor: C.redLight, borderColor: `${C.red}3D` },
                ]}
                onPress={onToggleAvailable}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Ionicons name={isAvail ? "checkmark-circle" : "lock-closed"} size={14} color={isAvail ? C.emerald600 : C.red} />
                <Text style={[styles.actText, { color: isAvail ? C.emerald600 : C.red }]}>
                  {isAvail ? "Available" : "Booked"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════ Rates ═══════════ */}
        {(vehicle.ratePerDay || vehicle.ratePerKm || vehicle.minimumBookingHours) && (
          <Section kicker="Rates" title="Pricing" icon="pricetag" tone={[C.emerald500, C.emerald700]}>
            {!!vehicle.ratePerDay && <Row label="Per day" value={INR(vehicle.ratePerDay)} />}
            {!!vehicle.ratePerKm && <Row label="Per km" value={INR(vehicle.ratePerKm)} />}
            {!!vehicle.minimumBookingHours && (
              <Row label="Minimum booking" value={`${vehicle.minimumBookingHours} hrs`} last />
            )}
          </Section>
        )}

        {/* ═══════════ Chauffeur ═══════════ */}
        {(vehicle.chauffeurIncluded || vehicle.chauffeurName || vehicle.chauffeurPhone) && (
          <Section
            kicker="Driver"
            title="Chauffeur"
            icon="person"
            tone={[C.plumLight || C.purple, C.purple]}
            action={vehicle.chauffeurPhone ? { label: "Call", onPress: callChauffeur } : null}
          >
            <Row label="Included" value={vehicle.chauffeurIncluded ? "Yes" : "No"} />
            {!!vehicle.chauffeurName && <Row label="Name" value={vehicle.chauffeurName} />}
            {!!vehicle.chauffeurPhone && <Row label="Phone" value={vehicle.chauffeurPhone} />}
            {languages.length > 0 && (
              <View style={{ paddingTop: 10 }}>
                <View style={styles.chipWrap}>
                  {languages.map((l) => (
                    <View key={l} style={styles.chip}><Text style={styles.chipText}>{l}</Text></View>
                  ))}
                </View>
              </View>
            )}
          </Section>
        )}

        {/* ═══════════ Specs ═══════════ */}
        {(vehicle.yearOfManufacture || vehicle.color || vehicle.registrationNumber || vehicle.baseLocation) && (
          <Section kicker="Vehicle" title="Specifications" icon="construct" tone={[C.blue, "#245C7A"]}>
            {!!vehicle.registrationNumber && <Row label="Registration" value={vehicle.registrationNumber} />}
            {!!vehicle.yearOfManufacture && <Row label="Year" value={vehicle.yearOfManufacture} />}
            {!!vehicle.color && <Row label="Colour" value={titleCase(vehicle.color)} />}
            {!!vehicle.baseLocation && <Row label="Base location" value={vehicle.baseLocation} last />}
          </Section>
        )}

        {/* ═══════════ Compliance ═══════════ */}
        {docs.length > 0 && (
          <Section kicker="Papers" title="Documents & validity" icon="shield-checkmark" tone={[GOLD, C.amber]}>
            {docs.map((d, i) => (
              <ValidityRow key={d.key} label={d.label} date={d.date} extra={d.extra} last={i === docs.length - 1} />
            ))}
          </Section>
        )}

        {/* ═══════════ About ═══════════ */}
        {!!vehicle.description && (
          <Section kicker="Overview" title="About this vehicle" icon="document-text" tone={[C.plumLight || C.purple, C.purple]}>
            <Text style={styles.bodyText}>{vehicle.description}</Text>
          </Section>
        )}

        {amenities.length > 0 && (
          <Section kicker="Comfort" title="Amenities" icon="grid" tone={[C.emerald500, C.emerald700]}>
            <View style={styles.chipWrap}>
              {amenities.map((a) => (
                <View key={a} style={styles.chip}><Text style={styles.chipText}>{titleCase(a)}</Text></View>
              ))}
            </View>
          </Section>
        )}

        {/* ═══════════ Meta ═══════════ */}
        <Section kicker="Record" title="Details" icon="information-circle" tone={["#8FA39A", "#5E7168"]}>
          <Row label="Total trips" value={vehicle.totalTrips ?? 0} />
          {(vehicle.totalRatings || 0) > 0 && (
            <Row label="Rating" value={`${vehicle.rating} ★  (${vehicle.totalRatings})`} />
          )}
          <Row label="Added" value={formatDate(vehicle.createdAt)} />
          <Row label="Updated" value={formatDate(vehicle.updatedAt)} last />
        </Section>

        {/* ═══════════ Actions ═══════════ */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.editBtnWrap}
            onPress={() => navigation.navigate("TAAddEditFleet", { vehicle })}
          >
            <LinearGradient
              colors={[C.emerald500, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={17} color="#fff" />
              <Text style={styles.editBtnText}>Edit vehicle</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.calendarBtn}
            onPress={() => navigation.navigate("TAFleetCalendar")}
          >
            <Ionicons name="calendar-outline" size={16} color={C.emerald600} />
            <Text style={styles.calendarBtnText}>Open fleet calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ───────── Small pieces ───────── */

function Section({ kicker, title, icon, tone, action, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        {!!icon && (
          <LinearGradient
            colors={tone || [C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.sectionChip}
          >
            <Ionicons name={icon} size={14} color="#fff" />
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionKicker}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {!!action && (
          <TouchableOpacity onPress={action.onPress} activeOpacity={0.8} style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>{action.label}</Text>
            <Ionicons name="arrow-forward" size={12} color={C.emerald600} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{String(value)}</Text>
    </View>
  );
}

/** A validity date that says how close it is, not just what it is. */
function ValidityRow({ label, date, extra, last }) {
  const days = daysUntil(date);
  const expired = days !== null && days < 0;
  const soon = days !== null && days >= 0 && days < 30;
  const tone = expired ? C.red : soon ? C.amber : C.ink;

  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={[styles.rowValue, { color: tone }]} numberOfLines={1}>
          {date ? formatDate(date) : extra ? titleCase(extra) : "—"}
        </Text>
        {days !== null && (
          <Text style={[styles.validityNote, { color: tone }]}>
            {expired ? `Expired ${Math.abs(days)}d ago` : soon ? `Expires in ${days}d` : `${days}d left`}
          </Text>
        )}
        {!!extra && !!date && <Text style={styles.validityNote}>{titleCase(extra)}</Text>}
      </View>
    </View>
  );
}

function Stat({ icon, label, value, tint, color }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={[styles.statValue, { color }]} numberOfLines={1}>{String(value)}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },
  errorRetry: { fontFamily: DISPLAY, color: C.emerald600, fontWeight: "bold", fontSize: 14, marginTop: 8 },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: "bold", color: C.ink, textAlign: "center", paddingHorizontal: 24 },

  // ── Header ──
  headerGrad: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: "hidden", position: "relative" },
  orbA: {
    position: "absolute", top: -44, right: -28,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -30, left: -34,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(46,158,119,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  circleBtnLight: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  headerTypeChip: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 9,
  },
  headerEyebrow: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 1.4 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 0.2, lineHeight: 28 },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" },
  headerMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.4)" },
  headerSub: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.78)", fontSize: 12.5 },

  // ── Cover ──
  coverWrap: { marginHorizontal: 16, marginTop: 18 },
  coverCard: {
    backgroundColor: C.card, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
      default: {},
    }),
  },
  cover: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#EFEAE0" },
  coverEmpty: { alignItems: "center", justifyContent: "center", gap: 8 },
  coverEmptyText: { fontFamily: DISPLAY, color: C.subText, fontSize: 12 },
  galleryStrip: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  galleryThumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#EFEAE0" },

  // ── Headline ──
  headlineCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12,
    backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
      default: {},
    }),
  },
  priceBlock: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  priceBlockValue: { fontFamily: DISPLAY, color: C.ink, fontSize: 26, fontWeight: "bold", letterSpacing: 0.2 },
  priceBlockUnit: { fontFamily: DISPLAY, color: C.subText, fontSize: 12 },
  priceBlockMuted: { fontFamily: DISPLAY, color: C.subText, fontSize: 14, fontWeight: "bold" },
  pillRow: { flexDirection: "row", gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  pillText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.8 },

  // ── Fact strip ──
  statsCard: {
    flexDirection: "row", alignItems: "stretch", gap: 6,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 7,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
      default: {},
    }),
  },
  stat: { flex: 1, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 4, alignItems: "center" },
  statTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", flexShrink: 1, includeFontPadding: false },
  statLabel: {
    fontFamily: DISPLAY, fontSize: 8.5, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.6, textTransform: "uppercase", includeFontPadding: false, marginTop: 2,
  },

  // ── Sections ──
  section: { marginHorizontal: 16, marginTop: 18 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionChip: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionKicker: {
    fontFamily: DISPLAY, fontSize: 9.5, color: GOLD, fontWeight: "bold",
    letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 2,
  },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 16.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.1 },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  sectionActionText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.emerald600 },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
      default: {},
    }),
  },

  // ── Status ──
  bookedNotice: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.redLight, borderRadius: 12, padding: 10,
  },
  bookedNoticeText: { fontFamily: DISPLAY, fontSize: 12, color: C.red, fontWeight: "bold", flex: 1, lineHeight: 17 },
  actions: {
    flexDirection: "row", gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  actBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, height: 34, borderRadius: 10, borderWidth: 1,
  },
  actText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", includeFontPadding: false },

  // ── Rows / text ──
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 9 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { fontFamily: DISPLAY, fontSize: 13, color: C.subText },
  rowValue: { fontFamily: DISPLAY, fontSize: 13, color: C.ink, fontWeight: "bold", flex: 1, textAlign: "right" },
  validityNote: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, marginTop: 2 },
  bodyText: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, lineHeight: 21 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontFamily: DISPLAY, fontSize: 12, color: C.ink, fontWeight: "bold" },

  editBtnWrap: { borderRadius: 14, overflow: "hidden" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52 },
  editBtnText: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: "#fff" },
  calendarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 48, borderRadius: 14, marginTop: 10,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: `${C.emerald600}30`,
  },
  calendarBtnText: { fontFamily: DISPLAY, fontSize: 13.5, fontWeight: "bold", color: C.emerald600 },
});
