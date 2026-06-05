// screens/travel-agent/tours/TourPreviewScreen.js
// REDESIGNED — premium tour preview with full-bleed image hero, gradient
// overlays for header buttons, title card pulled up, price emphasis,
// timeline itinerary, and a sticky bottom action bar.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getTravelAgentTour, listTravelAgentFleet } from "../../api/travelAgentClient";
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
  red: "#EF4444",
  redLight: "#FEE2E2",
  greenLight: "#D1FAE5",
  amberLight: "#FEF3C7",
};

const STATUS_BADGE = {
  ACTIVE:   { bg: "rgba(16,185,129,0.95)", icon: "checkmark-circle", label: "Active" },
  DRAFT:    { bg: "rgba(100,116,139,0.95)", icon: "create",            label: "Draft" },
  PAUSED:   { bg: "rgba(245,158,11,0.95)", icon: "pause-circle",      label: "Paused" },
  INACTIVE: { bg: "rgba(239,68,68,0.95)",  icon: "close-circle",      label: "Inactive" },
};

const SCREEN_W = Dimensions.get("window").width;
const HERO_HEIGHT = 320;

const INR = (n) => (n == null || isNaN(Number(n))) ? null : `₹${Number(n).toLocaleString("en-IN")}`;
function toArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

export default function TourPreviewScreen({ navigation, route }) {
  const { id } = route?.params || {};
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [fleet, setFleet] = useState([]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await getTravelAgentTour(id);
      setTour(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load tour");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  // Resolve attached vehicleIds → fleet objects for the Vehicles section.
  useEffect(() => {
    (async () => {
      try {
        const d = await listTravelAgentFleet();
        setFleet(d?.fleets || d?.fleet || []);
      } catch {}
    })();
  }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.subText} />
          <Text style={styles.emptyTitle}>Tour not found</Text>
          {!!error && <Text style={styles.emptyBody}>{error}</Text>}
          <TouchableOpacity style={styles.backCta} onPress={() => navigation.goBack()}>
            <Text style={styles.backCtaText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const highlights = toArr(tour.highlights);
  const inclusions = toArr(tour.inclusions);
  const exclusions = toArr(tour.exclusions);
  const places     = toArr(tour.customPlaces).map((p) => (typeof p === "string" ? p : p?.name)).filter(Boolean);
  const itinerary  = toArr(tour.itinerary);
  const vehicleIds = toArr(tour.vehicleIds).map((v) => (typeof v === "string" ? v : v?.id)).filter(Boolean);
  const attachedVehicles = fleet.filter((f) => vehicleIds.includes(f.id));
  const gallery = [tour.coverImage, ...toArr(tour.galleryImages)].filter(Boolean);
  const priceLabel = tour.priceType === "ON_REQUEST"
    ? "On request"
    : INR(tour.basePrice || tour.startingPrice);
  const priceSuffix = tour.priceType === "PER_PERSON" ? " /person" : tour.priceType === "PER_GROUP" ? " /group" : "";
  const statusBadge = STATUS_BADGE[tour.status] || STATUS_BADGE.DRAFT;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
      >
        {/* ===== Full-bleed image hero ===== */}
        <View style={styles.heroWrap}>
          {gallery.length > 0 ? (
            <RemoteImage source={{ uri: gallery[galleryIdx] }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Top gradient overlay for button readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0)"]}
            style={styles.heroTopOverlay}
          />

          {/* Bottom gradient overlay for status badge readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
            style={styles.heroBottomOverlay}
          />

          {/* Header buttons */}
          <SafeAreaView edges={["top"]} style={styles.heroHeaderBar}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.navigate("TAAddEditTour", { tour })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Status + public badges (bottom-left over image) */}
          <View style={styles.heroBadgesRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Ionicons name={statusBadge.icon} size={12} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
            </View>
            {tour.isPublic && (
              <View style={styles.publicBadge}>
                <Ionicons name="globe" size={11} color="#fff" />
                <Text style={styles.statusBadgeText}>Public</Text>
              </View>
            )}
          </View>

          {/* Gallery thumbnails (bottom strip) */}
          {gallery.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbsScroll}
              contentContainerStyle={styles.thumbsRow}
            >
              {gallery.map((u, i) => (
                <TouchableOpacity key={`${u}-${i}`} onPress={() => setGalleryIdx(i)}>
                  <RemoteImage source={{ uri: u }} style={[styles.thumb, i === galleryIdx && styles.thumbActive]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ===== Title card (pulled up over image) ===== */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{tour.title}</Text>
          {!!tour.destination && (
            <View style={styles.destinationRow}>
              <Ionicons name="location" size={14} color={C.emerald600} />
              <Text style={styles.destinationText}>{tour.destination}</Text>
            </View>
          )}

          {/* Stat pills row */}
          <View style={styles.statsRow}>
            {(tour.durationDays || tour.durationNights) && (
              <Stat icon="time" color={C.blue} bg="#EFF6FF" label={`${tour.durationDays || 0}D / ${tour.durationNights || 0}N`} />
            )}
            {tour.rating > 0 && (
              <Stat icon="star" color={C.amber} bg={C.amberLight} label={`${Number(tour.rating).toFixed(1)} (${tour.totalRatings})`} />
            )}
            {tour.totalBookings > 0 && (
              <Stat icon="people" color={C.emerald600} bg={C.emerald50} label={`${tour.totalBookings} booked`} />
            )}
          </View>

          {/* Price card */}
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.priceCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.priceCardLabel}>STARTING PRICE</Text>
              <View style={styles.priceCardValueRow}>
                <Text style={styles.priceCardValue}>{priceLabel || "Contact"}</Text>
                {!!priceSuffix && <Text style={styles.priceCardSuffix}>{priceSuffix}</Text>}
              </View>
            </View>
            <View style={styles.priceCardIcon}>
              <Ionicons name="cash" size={26} color="#fff" />
            </View>
          </LinearGradient>
        </View>

        {/* ===== Short description ===== */}
        {!!tour.shortDescription && (
          <View style={styles.shortDescCard}>
            <Text style={styles.shortDescText}>"{tour.shortDescription}"</Text>
          </View>
        )}

        {/* ===== About ===== */}
        {!!tour.description && (
          <>
            <Section icon="document-text" label="About this tour" />
            <View style={styles.card}>
              <Text style={styles.body}>{tour.description}</Text>
            </View>
          </>
        )}

        {/* ===== Highlights ===== */}
        {highlights.length > 0 && (
          <>
            <Section icon="star" label="Highlights" />
            <View style={styles.highlightsGrid}>
              {highlights.map((h, i) => (
                <View key={i} style={styles.highlightChip}>
                  <View style={styles.highlightStar}>
                    <Ionicons name="star" size={10} color="#fff" />
                  </View>
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Itinerary (timeline) ===== */}
        {itinerary.length > 0 && (
          <>
            <Section icon="map" label={`Itinerary · ${itinerary.length} days`} />
            <View style={styles.timelineWrap}>
              {itinerary.map((d, i) => (
                <View key={i} style={styles.timelineRow}>
                  <View style={styles.timelineGutter}>
                    <LinearGradient
                      colors={[C.emerald500, C.emerald600]}
                      style={styles.timelineDayBadge}
                    >
                      <Text style={styles.timelineDayText}>{d.day || i + 1}</Text>
                    </LinearGradient>
                    {i < itinerary.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineCard}>
                    {!!d.title && <Text style={styles.timelineTitle}>{d.title}</Text>}
                    {!!d.description && <Text style={styles.timelineDesc}>{d.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Inclusions ===== */}
        {inclusions.length > 0 && (
          <>
            <Section icon="checkmark-done" label="What's included" />
            <View style={styles.card}>
              {inclusions.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletCheckBox}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Exclusions ===== */}
        {exclusions.length > 0 && (
          <>
            <Section icon="close-circle" label="What's not included" />
            <View style={styles.card}>
              {exclusions.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletCrossBox}>
                    <Ionicons name="close" size={11} color="#fff" />
                  </View>
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Places covered ===== */}
        {places.length > 0 && (
          <>
            <Section icon="pin" label="Places covered" />
            <View style={styles.card}>
              {places.map((p, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletCheckBox}>
                    <Ionicons name="location" size={11} color="#fff" />
                  </View>
                  <Text style={styles.bulletText}>{p}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Terms & conditions ===== */}
        {!!tour.termsConditions && (
          <>
            <Section icon="document-text" label="Terms & conditions" />
            <View style={styles.card}>
              <Text style={styles.body}>{tour.termsConditions}</Text>
            </View>
          </>
        )}

        {/* ===== Vehicles included ===== */}
        {attachedVehicles.length > 0 && (
          <>
            <Section icon="car-sport" label="Vehicles included" />
            <View style={styles.card}>
              {attachedVehicles.map((v) => (
                <View key={v.id} style={styles.vehRow}>
                  {v.coverImage ? (
                    <RemoteImage source={{ uri: v.coverImage }} style={styles.vehThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.vehThumb, styles.vehThumbPh]}><Ionicons name="car" size={18} color={C.subText} /></View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.vehName} numberOfLines={1}>{v.vehicleName || "Vehicle"}</Text>
                    <Text style={styles.vehSub} numberOfLines={1}>
                      {[v.vehicleType, v.seatingCapacity ? `${v.seatingCapacity} seats` : null, v.chauffeurIncluded ? "Chauffeur" : null].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ===== Cancellation policy ===== */}
        {!!tour.cancellationPolicy && (
          <>
            <Section icon="shield-checkmark" label="Cancellation policy" />
            <View style={[styles.card, styles.cancelCard]}>
              <View style={styles.cancelHeader}>
                <View style={styles.cancelBadge}>
                  <Text style={styles.cancelBadgeText}>{tour.cancellationPolicy}</Text>
                </View>
              </View>
              {!!tour.cancellationNotes && (
                <Text style={styles.body}>{tour.cancellationNotes}</Text>
              )}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ===== Sticky bottom action bar ===== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.editBtnWrap}
          onPress={() => navigation.navigate("TAAddEditTour", { tour })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.editBtnInner}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit Tour</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function Section({ icon, label }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={12} color={C.emerald600} />
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function Stat({ icon, color, bg, label }) {
  return (
    <View style={[styles.statPill, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[styles.statPillText, { color }]}>{label}</Text>
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 12 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center" },
  backCta: { marginTop: 16, backgroundColor: C.emerald600, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backCtaText: { color: "#fff", fontWeight: "700" },

  // Hero
  heroWrap: { width: SCREEN_W, height: HERO_HEIGHT, backgroundColor: "#222" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#1F2937" },
  heroTopOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  // Taller bottom overlay so the badges + thumbnails (now sitting higher up
  // to clear the floating title card's overlap zone) still get a dark gradient
  // underneath for readability over any image.
  heroBottomOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },
  heroHeaderBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 },
  heroIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center", justifyContent: "center",
    margin: 4,
  },

  // Lifted higher so the floating title-card (marginTop:-28) doesn't clip
  // these. Stack order from hero bottom: title-card-overlap (0-28) → gap →
  // thumbnails → gap → status badges.
  heroBadgesRow: {
    position: "absolute", left: 16, bottom: 110,
    flexDirection: "row", gap: 6,
  },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  publicBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.95)",
  },
  statusBadgeText: { color: "#fff", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.4 },

  // bottom:40 keeps thumbnails fully visible above the title card's -28px
  // overlap zone (leaves ~12px breathing gap to the title card).
  thumbsScroll: { position: "absolute", bottom: 40, left: 0, right: 0 },
  thumbsRow: { paddingHorizontal: 16, gap: 6, flexDirection: "row" },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#F1F5F9", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  thumbActive: { borderColor: "#fff" },

  // Title card (pulled up)
  titleCard: {
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -28,
    borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "800", color: C.ink, lineHeight: 28 },
  destinationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  destinationText: { fontSize: 13.5, color: C.text, fontWeight: "600" },

  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statPillText: { fontSize: 11.5, fontWeight: "800" },

  // Price card (gradient)
  priceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 14, padding: 14, borderRadius: 14,
  },
  priceCardLabel: { fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: "800", letterSpacing: 0.6 },
  priceCardValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  priceCardValue: { fontSize: 24, color: "#fff", fontWeight: "900" },
  priceCardSuffix: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginLeft: 4, fontWeight: "700" },
  priceCardIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },

  // Short description (quote-style)
  shortDescCard: {
    marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 12,
    backgroundColor: C.emerald50, borderLeftWidth: 4, borderLeftColor: C.emerald600,
  },
  shortDescText: { fontSize: 13.5, color: C.text, fontStyle: "italic", lineHeight: 20, fontWeight: "600" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
  sectionIconBox: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: C.emerald700, letterSpacing: 0.6, textTransform: "uppercase" },

  // Card
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  body: { fontSize: 13.5, color: C.text, lineHeight: 21 },

  // Highlights (chip grid)
  highlightsGrid: { paddingHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  highlightChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  highlightStar: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" },
  highlightText: { fontSize: 12.5, color: C.text, fontWeight: "700" },

  // Timeline itinerary
  timelineWrap: { paddingHorizontal: 16 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineGutter: { width: 32, alignItems: "center" },
  timelineDayBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 4 },
  timelineDayText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.emerald50, marginTop: 4 },
  timelineCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  timelineTitle: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 4 },
  timelineDesc: { fontSize: 13, color: C.text, lineHeight: 19 },

  // Inclusions/exclusions
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  bulletCheckBox: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.emerald500, alignItems: "center", justifyContent: "center", marginTop: 2 },
  bulletCrossBox: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: "center", justifyContent: "center", marginTop: 2 },
  bulletText: { flex: 1, fontSize: 13.5, color: C.text, lineHeight: 19 },
  vehRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  vehThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#EEF2F6" },
  vehThumbPh: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  vehName: { fontSize: 14, fontWeight: "800", color: C.ink },
  vehSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },

  // Cancellation
  cancelCard: { borderLeftWidth: 4, borderLeftColor: C.amber, paddingLeft: 12 },
  cancelHeader: { marginBottom: 8 },
  cancelBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.amberLight },
  cancelBadgeText: { color: "#A16207", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },

  // Sticky bottom bar
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 22,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  editBtnWrap: { borderRadius: 14, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  editBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  editBtnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
