// screens/travel-agent/properties/PropertyDetailScreen.js
// Read-only detail view for one property, in the same "Deep Emerald +
// Champagne" language as the properties list and the Add/Edit form:
// deep gradient header with animated orbs + gold eyebrow, a floating tinted
// stat strip overlapping the header, and white cards on a warm-cream canvas.
//
// The list card used to open the edit form directly, which meant there was no
// way to just *look* at a property — every tap dropped you into a 950-line
// form. This screen is the landing spot instead; Edit is one tap away.
//
// Backend: GET /api/travel-agent/properties/[id]
//
// Route params: { id, property? }. `property` is the row the list already has,
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
  getTravelAgentProperty,
  updateTravelAgentProperty,
  deleteTravelAgentProperty,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const GOLD = C.gold;
const FILL = "#FBF8F1";
const HEADER_GRAD = ["#0F2A22", "#16382E", "#1C6B52"];

// Same table as the list and the form, so a property reads identically
// wherever you meet it.
const TYPE_META = {
  RESORT:      { icon: "umbrella",            color: "#C4703A",    label: "Resort" },
  HOTEL:       { icon: "business",            color: C.blue,       label: "Hotel" },
  HOMESTAY:    { icon: "home",                color: C.emerald600, label: "Homestay" },
  APARTMENT:   { icon: "grid",                color: C.purple,     label: "Apartment" },
  VILLA:       { icon: "diamond",             color: "#B0567A",    label: "Villa" },
  GUEST_HOUSE: { icon: "people",              color: C.amber,      label: "Guest house" },
  HOSTEL:      { icon: "bed",                 color: "#2C6E8C",    label: "Hostel" },
  ROOMS:       { icon: "bed-outline",         color: C.subText,    label: "Rooms" },
  OTHER:       { icon: "ellipsis-horizontal", color: C.subText,    label: "Other" },
};

const AMENITY_LABEL_MAP = {
  wifi: "WiFi", ac: "AC", pool: "Pool", gym: "Gym", restaurant: "Restaurant",
  free_parking: "Parking", elevator: "Lift", breakfast: "Breakfast", spa: "Spa",
  rooftop: "Rooftop", garden: "Garden", bbq: "BBQ", beach_access: "Beach",
  cctv: "CCTV", kitchen: "Kitchen", minibar: "Minibar", hot_water: "Hot Water",
  tv: "TV", washer: "Washer", heating: "Heating", conference_room: "Conf. Room",
};

const INR = (n) =>
  n == null || isNaN(Number(n)) ? null : `₹${Number(n).toLocaleString("en-IN")}`;

const formatDate = (iso) => {
  try {
    return iso
      ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
  } catch {
    return "—";
  }
};

/** Same seven checks the list card scores, so both show the same number. */
function completenessScore(p) {
  const checks = [!!p.name, !!p.description, !!p.city, !!p.coverImage, !!p.startingPrice, !!p.amenities, !!p.inclusions];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** amenities / galleryImages are stored as JSON array strings. */
function parseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/** highlights / inclusions / exclusions / rules are plain text, one per line. */
function parseLines(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export default function PropertyDetailScreen({ navigation, route }) {
  const { id, property: seed } = route?.params || {};

  const [property, setProperty] = useState(seed || null);
  const [loading, setLoading] = useState(!seed);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const propertyId = id || seed?.id;

  const load = useCallback(async () => {
    if (!propertyId) return;
    setError(null);
    try {
      const data = await getTravelAgentProperty(propertyId);
      setProperty(data?.property || data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load property");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);
  // Coming back from the edit form should show the edit, not the stale copy.
  useEffect(() => navigation.addListener("focus", load), [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const patch = async (partial, revert) => {
    setProperty((p) => ({ ...p, ...partial }));
    setBusy(true);
    try {
      await updateTravelAgentProperty(property.id, partial);
    } catch (e) {
      setProperty((p) => ({ ...p, ...revert }));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const onToggleActive = () => {
    const next = !(property.isActive !== false);
    patch({ isActive: next }, { isActive: property.isActive });
  };

  const onTogglePublish = () => {
    const next = !property.isPublic;
    patch({ isPublic: next }, { isPublic: property.isPublic });
  };

  const onDelete = () => {
    Alert.alert(
      "Delete property?",
      `"${property?.name || "This property"}" will be removed permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTravelAgentProperty(property.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  const openMap = () => {
    if (!property) return;
    const q = property.latitude && property.longitude
      ? `${property.latitude},${property.longitude}`
      : [property.name, property.address, property.city, property.state].filter(Boolean).join(", ");
    if (!q) return;
    Linking.openURL(`geo:0,0?q=${encodeURIComponent(q)}`).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`).catch(() => {})
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading property…</Text>
        </View>
      </View>
    );
  }

  if (!property) {
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
          <Text style={styles.emptyTitle}>{error || "Property not found"}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const meta = TYPE_META[property.propertyType] || TYPE_META.OTHER;
  const isActive = property.isActive !== false;
  const isPublic = !!property.isPublic;
  const pct = completenessScore(property);
  const gallery = parseArray(property.galleryImages);
  const amenities = parseArray(property.amenities);
  const highlights = parseLines(property.highlights);
  const inclusions = parseLines(property.inclusions);
  const exclusions = parseLines(property.exclusions);
  const rules = parseLines(property.rules);
  const location = [property.address, property.city, property.state, property.pincode]
    .filter(Boolean)
    .join(", ");
  const price = INR(property.startingPrice);

  // Only the figures this property actually has. Rendering the full set meant
  // a strip of "12 / — / — / —", which reads as a broken screen rather than an
  // incomplete listing — the completeness meter is what says "incomplete".
  const facts = [
    { key: "rooms",    icon: "bed",    label: "Rooms",    value: property.totalRooms,      tint: C.emerald50,   color: C.emerald600 },
    { key: "guests",   icon: "people", label: "Guests",   value: property.maxGuests,       tint: C.blueLight,   color: C.blue },
    { key: "bedrooms", icon: "home",   label: "Bedrooms", value: property.bedroomsCount,   tint: C.purpleLight, color: C.purple },
    { key: "baths",    icon: "water",  label: "Baths",    value: property.bathroomsCount,  tint: C.amberLight,  color: C.amber },
  ].filter((f) => f.value != null && f.value !== "" && Number(f.value) > 0);

  // Header meta line. Built from whatever exists so the title never sits alone
  // on an empty gradient.
  const headerMeta = [
    (property.city || property.state)
      ? { key: "loc", icon: "location", text: [property.city, property.state].filter(Boolean).join(", ") }
      : null,
    property.totalRooms ? { key: "rooms", icon: "bed", text: `${property.totalRooms} rooms` } : null,
    property.maxGuests ? { key: "guests", icon: "people", text: `${property.maxGuests} guests` } : null,
  ].filter(Boolean).slice(0, 2);

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
              onPress={() => navigation.navigate("TAAddEditProperty", { property })}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity style={styles.headerCircleBtn} activeOpacity={0.8} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.95)" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            {/* Type chip rather than a bare word — it carries the type colour,
                which is the same cue the list card and the form use. */}
            <View style={styles.headerTypeChip}>
              <Ionicons name={meta.icon} size={11} color="#fff" />
              <Text style={styles.headerEyebrow}>{meta.label.toUpperCase()}</Text>
            </View>

            <Text style={styles.headerTitle} numberOfLines={2}>{property.name}</Text>

            {/* Meta line. Location first, then whatever else identifies the
                place — a property with no city still gets a populated line
                instead of a title floating in empty gradient. */}
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
        {/* ═══════════ Cover ═══════════
            Just the photo. Price and status used to sit on top of it behind a
            scrim, which meant they fought whatever the cover happened to show;
            they live in their own card underneath now. */}
        <View style={styles.coverWrap}>
          <View style={styles.coverCard}>
            {property.coverImage ? (
              <RemoteImage source={{ uri: property.coverImage }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverEmpty]}>
                <Ionicons name={meta.icon} size={40} color={meta.color} />
                <Text style={styles.coverEmptyText}>No cover image</Text>
              </View>
            )}
          </View>
        </View>

        {/* ═══════════ Price + status, under the photo ═══════════ */}
        <View style={styles.section}>
          <View style={styles.headlineCard}>
            {price ? (
              <View style={styles.priceBlock}>
                <Text style={styles.priceBlockValue}>{price}</Text>
                <Text style={styles.priceBlockUnit}>per night</Text>
              </View>
            ) : (
              <Text style={styles.priceBlockMuted}>No price set</Text>
            )}
            <View style={styles.coverPills}>
              <View style={[styles.coverPill, { backgroundColor: isActive ? C.emerald50 : C.amberLight }]}>
                <Text style={[styles.coverPillText, { color: isActive ? C.emerald600 : C.amber }]}>
                  {isActive ? "ACTIVE" : "PAUSED"}
                </Text>
              </View>
              <View style={[styles.coverPill, { backgroundColor: isPublic ? C.purpleLight : FILL }]}>
                <Text style={[styles.coverPillText, { color: isPublic ? C.purple : C.subText }]}>
                  {isPublic ? "LIVE" : "DRAFT"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gallery rides just under the cover, outside the card so the thumbs
            can run edge to edge. */}
        {gallery.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryStrip}
          >
            {gallery.map((uri, i) => (
              <RemoteImage key={`${uri}-${i}`} source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        {/* ═══════════ Fact strip ═══════════
            Only the figures this property has — see `facts` above. */}
        {facts.length > 0 && (
          <View style={styles.statsCard}>
            {facts.map((f) => (
              <Stat key={f.key} icon={f.icon} label={f.label} value={f.value} tint={f.tint} color={f.color} />
            ))}
          </View>
        )}

        {/* ═══════════ Status + completeness ═══════════ */}
        <View style={styles.section}>
          <View style={styles.card}>
            {pct < 100 && (
              <View style={styles.completenessWrap}>
                <View style={[styles.completenessDot, { backgroundColor: pct >= 70 ? GOLD : C.red }]} />
                <Text style={styles.completenessLabel}>Profile {pct}% complete</Text>
                <View style={styles.completenessTrack}>
                  <View style={[styles.completenessBar, { width: `${pct}%`, backgroundColor: pct >= 70 ? GOLD : C.red }]} />
                </View>
              </View>
            )}

            {/* Status toggles */}
            <View style={[styles.propActions, pct >= 100 && { marginTop: 0, paddingTop: 0, borderTopWidth: 0 }]}>
              <TouchableOpacity
                style={[
                  styles.propActBtn,
                  isActive
                    ? { backgroundColor: C.emerald50, borderColor: `${C.emerald600}3D` }
                    : { backgroundColor: C.amberLight, borderColor: `${C.amber}3D` },
                ]}
                onPress={onToggleActive}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Ionicons name={isActive ? "checkmark-circle" : "pause-circle"} size={14} color={isActive ? C.emerald600 : C.amber} />
                <Text style={[styles.propActText, { color: isActive ? C.emerald600 : C.amber }]}>
                  {isActive ? "Active" : "Inactive"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.propActBtn,
                  isPublic
                    ? { backgroundColor: C.purpleLight, borderColor: `${C.purple}3D` }
                    : { backgroundColor: FILL, borderColor: C.border },
                ]}
                onPress={onTogglePublish}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Ionicons name={isPublic ? "globe" : "globe-outline"} size={14} color={isPublic ? C.purple : C.subText} />
                <Text style={[styles.propActText, { color: isPublic ? C.purple : C.subText }]}>
                  {isPublic ? "Unpublish" : "Publish"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ═══════════ Stay rules ═══════════
            The price itself now lives on the cover, so this card is only the
            terms around it. */}
        {(property.minNights || property.maxNights || property.cancellationPolicy) && (
          <Section kicker="Rates" title="Stay & terms" icon="pricetag" tone={[C.emerald500, C.emerald700]}>
            {!!property.minNights && <Row label="Minimum stay" value={`${property.minNights} night${property.minNights > 1 ? "s" : ""}`} />}
            {!!property.maxNights && <Row label="Maximum stay" value={`${property.maxNights} night${property.maxNights > 1 ? "s" : ""}`} />}
            {!!property.cancellationPolicy && (
              <Row label="Cancellation" value={String(property.cancellationPolicy).replace(/_/g, " ")} last />
            )}
          </Section>
        )}

        {/* ═══════════ Location ═══════════ */}
        {!!(location || property.landmark) && (
          <Section kicker="Where" title="Location" icon="location" tone={[C.oceanLight || C.blue, C.blue]} action={{ label: "Open map", onPress: openMap }}>
            {!!location && <Text style={styles.bodyText}>{location}</Text>}
            {!!property.landmark && <Row label="Landmark" value={property.landmark} last />}
          </Section>
        )}

        {/* ═══════════ Check-in / out ═══════════ */}
        {!!(property.checkInTime || property.checkOutTime) && (
          <Section kicker="Timings" title="Check-in & check-out" icon="time" tone={[C.blue, "#245C7A"]}>
            <Row label="Check-in" value={property.checkInTime || "—"} />
            <Row label="Check-out" value={property.checkOutTime || "—"} last />
          </Section>
        )}

        {/* ═══════════ About ═══════════ */}
        {!!property.description && (
          <Section kicker="Overview" title="About this property" icon="document-text" tone={[C.plumLight || C.purple, C.purple]}>
            <Text style={styles.bodyText}>{property.description}</Text>
          </Section>
        )}

        {highlights.length > 0 && (
          <Section kicker="Why book" title="Highlights" icon="sparkles" tone={[C.goldLight || C.gold, C.gold]}>
            {highlights.map((h, i) => <Bullet key={i} text={h} color={GOLD} icon="sparkles" />)}
          </Section>
        )}

        {amenities.length > 0 && (
          <Section kicker="Facilities" title="Amenities" icon="grid" tone={[C.emerald500, C.emerald700]}>
            <View style={styles.chipWrap}>
              {amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityChipText}>{AMENITY_LABEL_MAP[a] || a}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {inclusions.length > 0 && (
          <Section kicker="Included" title="What's covered" icon="checkmark-circle" tone={[C.emerald500, C.emerald700]}>
            {inclusions.map((t, i) => <Bullet key={i} text={t} color={C.emerald600} icon="checkmark-circle" />)}
          </Section>
        )}
        {exclusions.length > 0 && (
          <Section kicker="Not included" title="What's extra" icon="close-circle" tone={[C.roseLight || C.red, C.red]}>
            {exclusions.map((t, i) => <Bullet key={i} text={t} color={C.red} icon="close-circle" />)}
          </Section>
        )}
        {rules.length > 0 && (
          <Section kicker="Good to know" title="House rules" icon="alert-circle" tone={[C.goldLight || C.gold, C.amber]}>
            {rules.map((t, i) => <Bullet key={i} text={t} color={C.subText} icon="ellipse" />)}
          </Section>
        )}

        {/* ═══════════ Meta ═══════════ */}
        <Section kicker="Record" title="Details" icon="information-circle" tone={["#8FA39A", "#5E7168"]}>
          <Row label="Bookings" value={property.totalBookings ?? 0} />
          {(property.totalRatings || 0) > 0 && (
            <Row label="Rating" value={`${property.rating} ★  (${property.totalRatings})`} />
          )}
          <Row label="Added" value={formatDate(property.createdAt)} />
          <Row label="Updated" value={formatDate(property.updatedAt)} last />
        </Section>

        {/* ═══════════ Edit CTA ═══════════ */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.editBtnWrap}
            onPress={() => navigation.navigate("TAAddEditProperty", { property })}
          >
            <LinearGradient
              colors={[C.emerald500, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={17} color="#fff" />
              <Text style={styles.editBtnText}>Edit property</Text>
            </LinearGradient>
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

function Bullet({ text, color, icon }) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons name={icon} size={13} color={color} style={{ marginTop: 3 }} />
      <Text style={styles.bulletText}>{text}</Text>
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
  headerEyebrow: {
    fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold",
    letterSpacing: 1.4,
  },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" },
  headerMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.4)" },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: 0.2, lineHeight: 28 },
  headerSub: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.78)", fontSize: 12.5 },

  // ── Floating stat strip ──
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
  statValue: { fontFamily: DISPLAY, fontSize: 15, fontWeight: "bold", flexShrink: 1, includeFontPadding: false },
  statLabel: {
    fontFamily: DISPLAY, fontSize: 8.5, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.6, textTransform: "uppercase", includeFontPadding: false, marginTop: 2,
  },

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

  // ── Sections ──
  section: { marginHorizontal: 16, marginTop: 18 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionChip: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sectionKicker: {
    fontFamily: DISPLAY, fontSize: 9.5, color: GOLD, fontWeight: "bold",
    letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 2,
  },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 16.5, fontWeight: "bold", color: C.ink, letterSpacing: 0.1 },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
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

  // ── Cover card ──
  coverCard: {
    backgroundColor: C.card, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
      default: {},
    }),
  },
  // Sits below the header with real breathing room — it used to tuck under
  // the header curve, which left the photo crowding the title.
  coverWrap: { marginHorizontal: 16, marginTop: 18 },
  // aspectRatio, not a fixed height: 16:9 is what phone cameras and stock
  // photos actually produce, so a normal cover fills it with no crop, and the
  // box scales with screen width instead of getting letterboxed on a tablet.
  // The old fixed 230 was taller than 16:9 here, which forced `cover` to show
  // a wider vertical band of the source — that is where the sliver of unrelated
  // image at the top edge was coming from.
  cover: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#EFEAE0" },
  coverEmpty: { alignItems: "center", justifyContent: "center", gap: 8 },
  coverEmptyBox: { aspectRatio: 16 / 9 },
  coverEmptyText: { fontFamily: DISPLAY, color: C.subText, fontSize: 12 },
  // Bottom half of the photo is darkened so white chrome always reads, whatever
  // the photo happens to be.
  priceBlock: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  priceBlockValue: { fontFamily: DISPLAY, color: C.ink, fontSize: 26, fontWeight: "bold", letterSpacing: 0.2 },
  priceBlockUnit: { fontFamily: DISPLAY, color: C.subText, fontSize: 12 },
  priceBlockMuted: { fontFamily: DISPLAY, color: C.subText, fontSize: 14, fontWeight: "bold" },
  coverPills: { flexDirection: "row", gap: 6 },
  coverPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  coverPillText: { fontFamily: DISPLAY, fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.8 },

  galleryStrip: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  galleryThumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#EFEAE0" },

  completenessWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
  completenessDot: { width: 6, height: 6, borderRadius: 3 },
  completenessLabel: {
    fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold",
    letterSpacing: 0.2, includeFontPadding: false,
  },
  completenessTrack: { flex: 1, height: 4, backgroundColor: "#EAE2D3", borderRadius: 2, overflow: "hidden" },
  completenessBar: { height: "100%", borderRadius: 2 },

  propActions: {
    flexDirection: "row", gap: 6,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  propActBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, height: 34, borderRadius: 10, borderWidth: 1,
  },
  propActText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", includeFontPadding: false },

  // ── Rows / text ──
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingVertical: 9 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { fontFamily: DISPLAY, fontSize: 13, color: C.subText },
  rowValue: { fontFamily: DISPLAY, fontSize: 13, color: C.ink, fontWeight: "bold", flex: 1, textAlign: "right" },
  bodyText: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, lineHeight: 21 },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 5 },
  bulletText: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, flex: 1, lineHeight: 21 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  amenityChip: {
    backgroundColor: FILL, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border,
  },
  amenityChipText: { fontFamily: DISPLAY, fontSize: 12, color: C.ink, fontWeight: "bold" },

  editBtnWrap: { borderRadius: 14, overflow: "hidden" },
  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52,
  },
  editBtnText: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: "bold", color: "#fff" },
});
