// screens/travel-agent/properties/PropertiesListScreen.js
// REDESIGNED (v2) — premium "Deep Emerald + Champagne" properties list.
// Deep gradient header with animated orbs + gold eyebrow + embedded search,
// floating stats card, type filter chips, and image-hero property cards on a
// warm-cream canvas (matches the Add/Edit Property form).
// NOTE: UI-only redesign — all state, data loading, toggle/delete handlers and
// API calls are unchanged from the previous version.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Alert, StatusBar,
  Animated, Easing, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentProperties, updateTravelAgentProperty, deleteTravelAgentProperty, getCurrentTravelAgent, PROPERTY_TYPE } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const GOLD = C.gold;
const FILL = "#FBF8F1";
// Canonical Elevate hero gradient (was #0B211A — one shade off the dashboard).
const HEADER_GRAD = ["#0F2A22", "#16382E", "#1C6B52"];

// Per-type colour + icon (matches the form so list & detail read the same).
const TYPE_META = {
  RESORT:      { icon: "umbrella",      color: "#C4703A", label: "Resort" },
  HOTEL:       { icon: "business",      color: C.blue,    label: "Hotel" },
  HOMESTAY:    { icon: "home",          color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",          color: C.purple,  label: "Apartment" },
  VILLA:       { icon: "diamond",       color: "#B0567A", label: "Villa" },
  GUEST_HOUSE: { icon: "people",        color: C.amber,   label: "Guest house" },
  HOSTEL:      { icon: "bed",           color: "#2C6E8C", label: "Hostel" },
  ROOMS:       { icon: "bed-outline",   color: C.subText, label: "Rooms" },
  OTHER:       { icon: "ellipsis-horizontal", color: C.subText, label: "Other" },
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;

const AMENITY_LABEL_MAP = {
  wifi: "WiFi", ac: "AC", pool: "Pool", gym: "Gym", restaurant: "Restaurant",
  free_parking: "Parking", elevator: "Lift", breakfast: "Breakfast", spa: "Spa",
  rooftop: "Rooftop", garden: "Garden", bbq: "BBQ", beach_access: "Beach",
  cctv: "CCTV", kitchen: "Kitchen", minibar: "Minibar", hot_water: "Hot Water",
  tv: "TV", washer: "Washer", heating: "Heating", conference_room: "Conf. Room",
};

function parseAmenityIds(raw) {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

function completenessScore(p) {
  const checks = [!!p.name, !!p.description, !!p.city, !!p.coverImage, !!p.startingPrice, !!p.amenities, !!p.inclusions];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function PropertiesListScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, agent] = await Promise.all([
        listTravelAgentProperties({ search: debouncedSearch, propertyType: typeFilter }),
        getCurrentTravelAgent(),
      ]);
      setProperties(data.properties || []);
      setStats(data.stats || null);
      setIsApproved(agent?.status === "APPROVED");
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
  // Gate publish proactively (mirrors web's disabled-checkbox + lock badge —
  // src/app/travel-agent/(dashboard)/properties/page.tsx:114-125) instead of
  // firing the request and only finding out from the backend's rejection.
  const onTogglePublish = async (p) => {
    const next = !p.isPublic;
    if (next && !isApproved) {
      Alert.alert(
        "Approval required",
        "Your account must be approved before a listing can go public. Complete your KYC documents to get verified."
      );
      return;
    }
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
      <StatusBar barStyle="light-content" backgroundColor={HEADER_GRAD[0]} />

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
              <Text style={styles.headerEyebrow}>YOUR PORTFOLIO</Text>
              <Text style={styles.headerTitle}>Properties</Text>
            </View>
            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => navigation.navigate("TAAddEditProperty")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, city…"
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

      {/* ===== Stats card ===== */}
      {stats && (
        <View style={styles.statsCard}>
          <StatCell value={stats.total ?? 0} label="Total" icon="bed" color={C.emerald600} tint={C.emerald50} />
          <StatCell value={stats.active ?? 0} label="Active" icon="checkmark-circle" color={C.blue} tint={C.blueLight} />
          <StatCell value={stats.published ?? 0} label="Public" icon="globe" color={C.purple} tint={C.purpleLight} />
          <StatCell value={stats.avgRating ?? "—"} label="Rating" icon="star" color={GOLD} tint={C.amberLight} />
        </View>
      )}

      {/* ===== Type filter chips ===== */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TypeChip
            label="All"
            icon="apps"
            count={properties.length}
            active={typeFilter === "ALL"}
            onPress={() => setTypeFilter("ALL")}
            color={C.emerald600}
          />
          {PROPERTY_TYPE.map((t) => {
            const meta = TYPE_META[t] || TYPE_META.OTHER;
            const cnt = typeCounts[t] || 0;
            return (
              <TypeChip
                key={t}
                label={meta.label}
                icon={meta.icon}
                count={cnt}
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
          <Text style={styles.loadingText}>Loading properties…</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              // Tapping a card opens the read-only detail, which is where Edit
              // now lives (the card's own actions are only Active / Publish /
              // Delete). It used to drop straight into the 950-line form, so
              // there was no way to just look at a property.
              onPress={() =>
                navigation.navigate("TAPropertyDetail", { id: item.id, property: item })
              }
              onEdit={() => navigation.navigate("TAAddEditProperty", { property: item })}
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
                    colors={[C.emerald500, C.emerald700]}
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

// Segmented stat cell — each metric gets its own soft-tinted tile so the strip
// reads as four distinct facts without needing divider hairlines between them.
function StatCell({ value, label, icon, color, tint }) {
  return (
    <View style={[styles.statCell, { backgroundColor: tint }]}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function TypeChip({ label, icon, count, active, onPress, color }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={styles.typeChipWrap}
    >
      <View style={styles.typeChipIconWrap}>
        <View style={[
          styles.typeChipIcon,
          active
            ? { backgroundColor: color, borderColor: color, borderWidth: 1 }
            : { backgroundColor: C.card, borderColor: C.border, borderWidth: 1 },
        ]}>
          <Ionicons name={icon} size={20} color={active ? "#fff" : C.subText} />
        </View>
        {count > 0 && (
          <View style={[styles.typeChipBadge, { backgroundColor: active ? color : C.emerald600 }]}>
            <Text style={[styles.typeChipBadgeText, { color: "#fff" }]}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.typeChipLabel,
        active && { color, fontWeight: "bold" },
      ]}>
        {label}
      </Text>
      {active && <View style={[styles.typeChipDot, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

function PropertyCard({ property, onPress, onEdit, onToggleActive, onTogglePublish, onDelete }) {
  const isActive = property.isActive !== false;
  const isPublic = !!property.isPublic;
  const priceLabel = INR(property.startingPrice);
  const meta = TYPE_META[property.propertyType] || TYPE_META.OTHER;
  const cityLine = [property.city, property.state].filter(Boolean).join(", ");
  const amenityIds = parseAmenityIds(property.amenities);
  // The bookings pill now shares the chip row, so show one fewer amenity when
  // it's present — the "+N" chip still accounts for every hidden amenity.
  const amenityShown = property.totalBookings > 0 ? 3 : 4;
  const topAmenities = amenityIds.slice(0, amenityShown).map((id) => AMENITY_LABEL_MAP[id]).filter(Boolean);
  const pct = completenessScore(property);
  const hasRating = (property.totalRatings || 0) > 0;

  // Capacity figures for the spec strip — same `> 0` guards the old inline
  // meta line used, just collected in one place so the strip can lay them out
  // with dividers and skip the ones this property doesn't have.
  const specs = [
    property.totalRooms > 0 && { icon: "bed", value: property.totalRooms, label: "rooms" },
    property.bedroomsCount > 0 && {
      icon: "bed-outline", value: property.bedroomsCount,
      label: property.bedroomsCount !== 1 ? "beds" : "bed",
    },
    property.bathroomsCount > 0 && {
      icon: "water-outline", value: property.bathroomsCount,
      label: property.bathroomsCount !== 1 ? "baths" : "bath",
    },
    property.maxGuests > 0 && { icon: "people", value: property.maxGuests, label: "guests" },
  ].filter(Boolean);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Cover */}
      <View style={styles.coverWrap}>
        {property.coverImage ? (
          <RemoteImage source={{ uri: property.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[`${meta.color}22`, `${meta.color}08`]} style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name={meta.icon} size={44} color={meta.color} />
            <Text style={{ fontFamily: DISPLAY, color: meta.color, fontSize: 11, fontWeight: "bold", marginTop: 4 }}>No photo</Text>
          </LinearGradient>
        )}
        {/* Scrim — only what the top badges need, plus a whisper at the bottom
            so the photo doesn't hard-cut into the white body. The name lives
            below the image now, so no heavy bottom gradient. */}
        <LinearGradient
          colors={["rgba(0,0,0,0.30)", "rgba(0,0,0,0)", "rgba(0,0,0,0.10)"]}
          locations={[0, 0.42, 1]}
          style={styles.coverOverlay}
          pointerEvents="none"
        />

        {/* Type tag — a solid coloured icon cap joined to a frosted label.
            The old version was one fully-opaque colour block, which sat on the
            photo like a sticker. */}
        <View style={styles.typePill}>
          <View style={[styles.typePillCap, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon} size={12} color="#fff" />
          </View>
          <Text style={styles.typePillText} numberOfLines={1}>{meta.label}</Text>
        </View>

        {isPublic ? (
          <View style={styles.publicBadge}>
            <View style={styles.publicDot} />
            <Ionicons name="globe" size={10} color="#fff" />
            <Text style={styles.publicBadgeText}>PUBLISHED</Text>
          </View>
        ) : (
          <View style={styles.globeOnlyBadge}>
            <Ionicons name="globe-outline" size={16} color="rgba(255,255,255,0.85)" />
          </View>
        )}

      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Head — name/city on the left, price plate on the right. One row, so
            a long name can never collide with the price. */}
        <View style={styles.headRow}>
          <View style={styles.headMain}>
            <Text style={styles.title} numberOfLines={1}>{property.name}</Text>
            {/* Meta line — city and rating share one line instead of the rating
                owning a whole pill row of its own. */}
            <View style={styles.metaLine}>
              {!!cityLine && (
                <>
                  <Ionicons name="location" size={11} color={GOLD} />
                  <Text style={styles.cityText} numberOfLines={1}>{cityLine}</Text>
                  <View style={styles.metaDot} />
                </>
              )}
              {hasRating ? (
                <>
                  <Ionicons name="star" size={10.5} color={GOLD} />
                  <Text style={styles.ratingInline}>{(property.rating || 0).toFixed(1)}</Text>
                  <Text style={styles.ratingInlineCount}>({property.totalRatings})</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={10.5} color={GOLD} />
                  <Text style={styles.ratingInline}>New</Text>
                </>
              )}
            </View>
          </View>

          {!!priceLabel && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText} numberOfLines={1}>{priceLabel}</Text>
              <Text style={styles.priceBadgeSuffix}>/night</Text>
            </View>
          )}
        </View>

        {/* Spec strip — capacity figures in one enclosed row with hairline
            dividers and a single muted icon colour. The old version was a
            free-wrapping line where every item had its own bright icon colour
            (emerald / blue / teal / purple / gold / grey), which read as noise. */}
        {specs.length > 0 && (
          <View style={styles.specStrip}>
            {specs.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.specDivider} />}
                <View style={styles.specCell}>
                  <Ionicons name={s.icon} size={13} color={C.emerald600} />
                  <Text style={styles.specValue}>{s.value}</Text>
                  <Text style={styles.specLabel} numberOfLines={1}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Chip row — bookings count and amenities share one wrapping row.
            They were two separate rows before, which cost a full row of height
            for what is visually the same kind of pill. */}
        {(property.totalBookings > 0 || topAmenities.length > 0) && (
          <View style={styles.cardChipsRow}>
            {property.totalBookings > 0 && (
              <View style={styles.bookingsPill}>
                <Ionicons name="calendar" size={11} color={C.subText} />
                <Text style={styles.bookingsPillText}>
                  {property.totalBookings} booking{property.totalBookings !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {topAmenities.map((label) => (
              <View key={label} style={styles.amenityChipSmall}>
                <Text style={styles.amenityChipSmallText}>{label}</Text>
              </View>
            ))}
            {amenityIds.length > amenityShown && (
              <View style={styles.amenityChipMore}>
                <Text style={styles.amenityChipMoreText}>+{amenityIds.length - amenityShown}</Text>
              </View>
            )}
          </View>
        )}

        {/* Completeness — a single slim line rather than a labelled block */}
        {pct < 100 && (
          <View style={styles.completenessWrap}>
            <View style={[styles.completenessDot, { backgroundColor: pct >= 70 ? GOLD : C.red }]} />
            <Text style={styles.completenessLabel}>Profile {pct}% complete</Text>
            <View style={styles.completenessTrack}>
              <View
                style={[
                  styles.completenessBar,
                  { width: `${pct}%`, backgroundColor: pct >= 70 ? GOLD : C.red },
                ]}
              />
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.propActions}>
          <TouchableOpacity
            style={[
              styles.propActBtn,
              isActive
                ? { backgroundColor: C.emerald50, borderColor: `${C.emerald600}3D` }
                : { backgroundColor: C.amberLight, borderColor: `${C.amber}3D` },
            ]}
            onPress={onToggleActive} activeOpacity={0.85}
          >
            <Ionicons name={isActive ? "checkmark-circle" : "pause-circle"} size={14} color={isActive ? C.emerald600 : C.amber} />
            <Text style={[styles.propActText, { color: isActive ? C.emerald600 : C.amber }]}>{isActive ? "Active" : "Inactive"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.propActBtn,
              isPublic
                ? { backgroundColor: C.purpleLight, borderColor: `${C.purple}3D` }
                : { backgroundColor: FILL, borderColor: C.border },
            ]}
            onPress={onTogglePublish} activeOpacity={0.85}
          >
            <Ionicons name={isPublic ? "globe" : "globe-outline"} size={14} color={isPublic ? C.purple : C.subText} />
            {/* Label names the ACTION, not the state — matches the tours list. */}
            <Text style={[styles.propActText, { color: isPublic ? C.purple : C.subText }]}>{isPublic ? "Unpublish" : "Publish"}</Text>
          </TouchableOpacity>
          {/* Icon-only so the two labelled toggles keep their width. */}
          <TouchableOpacity style={styles.propActEdit} onPress={onEdit} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={14} color={C.emerald600} />
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
  headerEyebrow: { fontFamily: DISPLAY, color: GOLD, fontSize: 10, fontWeight: "bold", letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 3 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 0.2 },

  // Search inside header
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, paddingHorizontal: 14, height: 42,
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },

  // Floating stat strip — overlaps the header bottom (like the Payments screen).
  // Four tinted segments instead of divider hairlines: the colour carries the
  // grouping, so the strip reads faster and looks less like a table row.
  statsCard: {
    flexDirection: "row", alignItems: "stretch", gap: 6,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, padding: 7,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  statCell: {
    flex: 1, minWidth: 0, alignItems: "center", gap: 2,
    borderRadius: 11, paddingVertical: 8, paddingHorizontal: 4,
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: {
    fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },
  statLabel: {
    fontFamily: DISPLAY, fontSize: 8.5, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.6, textTransform: "uppercase", includeFontPadding: false,
  },

  // Type filter
  filterWrap: {
    marginTop: 0,
  },
  chipsRow: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 0, gap: 4 },
  // paddingTop on the wrap gives the floating top badge room so it never clips.
  typeChipWrap: { alignItems: "center", paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 },
  // No-background wrapper so the floating badge is never clipped by the icon
  // tile's rounded background (an Android overflow quirk).
  typeChipIconWrap: { width: 54, height: 54, position: "relative", alignItems: "center", justifyContent: "center" },
  typeChipIcon: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  typeChipBadge: {
    position: "absolute", top: -6, right: -6,
    minWidth: 19, height: 19, borderRadius: 9.5,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, borderWidth: 2, borderColor: C.bg,
  },
  typeChipBadgeText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold" },
  typeChipLabel: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600", marginTop: 6, textAlign: "center" },
  typeChipDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginVertical: 6, padding: 11, backgroundColor: C.redLight, borderRadius: 12, borderWidth: 1, borderColor: "#F0CFC9" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 100 },
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
    backgroundColor: C.card, borderRadius: 18, marginBottom: 11, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#2A2216", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  // Letterboxed on purpose — the photo sets the mood, the body carries the
  // facts, and a short cover keeps the list scannable.
  coverWrap: { width: "100%", height: 112, backgroundColor: FILL, position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  coverOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  // Top-overlay badges
  // Frosted shell; the coloured cap is the only saturated part.
  typePill: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center",
    height: 28, paddingRight: 12, borderRadius: 999, overflow: "hidden",
    backgroundColor: "rgba(13,28,23,0.58)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    maxWidth: "62%",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  typePillCap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginRight: 7,
  },
  typePillText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 10.5,
    fontWeight: "bold", letterSpacing: 0.7, textTransform: "uppercase",
    flexShrink: 1,
  },
  // Same frosted language as the type tag, with an emerald status dot.
  publicBadge: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    height: 28, paddingHorizontal: 11, borderRadius: 999,
    backgroundColor: "rgba(13,28,23,0.58)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  publicDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.emerald500 },
  publicBadgeText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.7 },
  globeOnlyBadge: {
    position: "absolute", top: 12, right: 12,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(13,28,23,0.58)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
  },

  // Body
  cardBody: { paddingHorizontal: 12, paddingTop: 11, paddingBottom: 11 },

  // Head — name/city+rating left, price plate right. The name sits on the white
  // body (not over the photo) so it stays crisp regardless of the cover image.
  headRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 9 },
  headMain: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", color: C.ink,
    letterSpacing: 0.2, lineHeight: 19, includeFontPadding: false,
  },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cityText: {
    fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.border, marginHorizontal: 1 },
  ratingInline: {
    fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", color: "#8A5A10",
    includeFontPadding: false,
  },
  ratingInlineCount: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "600", color: "#A88A52",
    includeFontPadding: false,
  },
  // Spec strip — enclosed row, hairline dividers, one icon colour
  specStrip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: FILL, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 7, marginBottom: 8,
  },
  specCell: { flex: 1, minWidth: 0, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 },
  specDivider: { width: 1, height: 16, backgroundColor: C.border },
  specValue: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.ink, includeFontPadding: false },
  specLabel: {
    fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "600",
    flexShrink: 1, includeFontPadding: false,
  },

  // Bookings pill — shares the chip row with the amenities.
  bookingsPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, height: 21, borderRadius: 999,
    backgroundColor: FILL, borderWidth: 1, borderColor: C.border,
  },
  bookingsPillText: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: C.subText,
    includeFontPadding: false,
  },

  // Price plate — emerald-tinted so the nightly rate reads as the card's hard
  // fact against the white body.
  priceBadge: {
    flexDirection: "row", alignItems: "baseline",
    maxWidth: 132, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 11, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: `${C.emerald600}33`,
  },
  priceBadgeText: {
    fontFamily: DISPLAY, color: C.emerald600, fontSize: 14.5, fontWeight: "bold",
    flexShrink: 1, includeFontPadding: false,
  },
  priceBadgeSuffix: {
    fontFamily: DISPLAY, color: C.subText, fontSize: 9.5, fontWeight: "bold",
    marginLeft: 2, includeFontPadding: false,
  },

  // Card chip row — bookings pill + amenity tags, one wrapping row.
  // (Named apart from `chipsRow`, which is the header's type-filter strip.)
  cardChipsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, marginBottom: 8 },
  amenityChipSmall: {
    paddingHorizontal: 8, height: 21, justifyContent: "center", borderRadius: 999,
    backgroundColor: "#F1ECDF", borderWidth: 1, borderColor: "#E3DAC6",
  },
  amenityChipSmallText: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: "#6B6250",
    includeFontPadding: false,
  },
  amenityChipMore: {
    paddingHorizontal: 8, height: 21, justifyContent: "center", borderRadius: 999,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: `${C.emerald600}2E`,
  },
  amenityChipMoreText: {
    fontFamily: DISPLAY, fontSize: 10, fontWeight: "bold", color: C.emerald700,
    includeFontPadding: false,
  },

  // Completeness — one slim line: dot + label + inline track
  completenessWrap: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  completenessDot: { width: 6, height: 6, borderRadius: 3 },
  completenessLabel: {
    fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.2, includeFontPadding: false,
  },
  completenessTrack: { flex: 1, height: 4, backgroundColor: "#EAE2D3", borderRadius: 2, overflow: "hidden" },
  completenessBar: { height: "100%", borderRadius: 2 },

  // E4 actions
  propActions: { flexDirection: "row", gap: 6, paddingTop: 9, borderTopWidth: 1, borderTopColor: C.border },
  propActBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, height: 33, borderRadius: 10, borderWidth: 1,
  },
  propActEdit: {
    alignItems: "center", justifyContent: "center",
    height: 33, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: `${C.emerald600}30`,
  },
  propActDel: {
    alignItems: "center", justifyContent: "center",
    height: 33, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: C.redLight, borderWidth: 1, borderColor: `${C.red}30`,
  },
  propActText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", includeFontPadding: false },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
