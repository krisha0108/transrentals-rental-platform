// screens/travel-agent/tours/TourPreviewScreen.js
// REDESIGNED (cards pass) — the detail cards now speak the shared Elevate
// language instead of the `luxe-itinerary` prototype's own tokens.
//
// What changed and why:
//   • Palette. The screen carried a private `const C` (teal #16706A brand,
//     cool #1F2633 ink, #E6E9ED borders) while the header gradient, the page
//     ground and every other Travel Agent screen use the warm Elevate set.
//     Cool cards on a cream ground was the reason the stack looked cheap.
//     It now imports `_shared/theme` — one palette, one shadow, one scale.
//   • Section cards. The full-width tinted header band gave every card a heavy
//     coloured slab; ten of them stacked read as stripes. Each card now wears a
//     3dp gradient accent on its top edge, a plain white header row with the
//     gradient icon chip, and an inset hairline over the body — the tone still
//     says what kind of section it is, at a tenth of the weight.
//   • No card inside a card. Itinerary days were shadowed cards nested in a
//     shadowed card, and "Places" chips were white-on-white with their own
//     shadow. Both are tinted blocks now: content reads as content, and only
//     the outer card floats.
//   • Separation. Border + shadow + band was three separators doing one job.
//     Cards keep the hairline + soft float; everything subordinate (location
//     row, quote, day blocks, chips) drops its shadow and uses a tint instead,
//     so there is an actual hierarchy rather than a wall of equal boxes.
//   • Sizes go through the theme's rs()/rf() scale, so the cards hold up on
//     small phones and tablets instead of being fixed to a 390dp design.
//
// UI only. Data, endpoints, navigation routes, load/refresh logic, the sections
// shown and the existing code style (RN + StyleSheet + DISPLAY type) unchanged.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import AnimatedOrb from "../_shared/AnimatedOrb";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { getTravelAgentTour, listTravelAgentFleet } from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import {
  C,
  G,
  TONES,
  rs,
  rf,
  GUT,
  SCREEN_W,
  cardShadow,
  rowShadow,
  alpha,
} from "../_shared/theme";

const STATUS_BADGE = {
  ACTIVE:   { icon: "checkmark-circle", label: "Active",   dot: C.emerald },
  DRAFT:    { icon: "create",           label: "Draft",    dot: C.muted },
  PAUSED:   { icon: "pause-circle",     label: "Paused",   dot: C.gold },
  INACTIVE: { icon: "close-circle",     label: "Inactive", dot: C.red },
};

const POLICY_META = {
  FLEXIBLE: { color: C.emeraldDeep, tint: C.tintEmerald, icon: "shield-checkmark", label: "Flexible", desc: "Free cancellation up to 24h before" },
  MODERATE: { color: C.orange,      tint: C.orangeL,     icon: "time",             label: "Moderate", desc: "Partial refund within the window" },
  STRICT:   { color: C.red,         tint: C.redL,        icon: "alert-circle",     label: "Strict",   desc: "Limited or no refund" },
};

// The photo is a card in the content flow, not a full-bleed hero, so it is
// inset by the standard gutter on both sides. 3:2-ish, which is what tour
// photos are usually shot at.
const PHOTO_W = SCREEN_W - GUT * 2;
const PHOTO_H = Math.round(PHOTO_W * 0.66);

// Vertical rhythm. Every stacked block on the page is spaced with GAP and does
// it through `marginTop` only — mixing marginTop on some blocks with
// marginBottom on others is how the gaps drifted between 4 and 22dp, since
// most blocks here are conditional and the pairs that actually meet change
// from tour to tour. One direction, one value, so the stack is even whichever
// sections a tour happens to have.
const GAP = rs(18);
// The thumbnail strip belongs to the photo above it, so it sits closer than a
// block boundary — the tighter gap is what groups them.
const GAP_TIGHT = rs(12);

const INR = (n) => (n == null || isNaN(Number(n))) ? null : `₹${Number(n).toLocaleString("en-IN")}`;
function toArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

// Route illustration for "Places covered".
//
// The prototype hard-codes one curve and five pins, so every tour would show
// the same shape and the same pin count regardless of its real stops. This
// derives both from `places`: one pin per actual place, spread across the
// viewBox, alternating high/low with a slight drift so the line wanders. The
// path is a smooth cubic through those points (control points at the midpoint
// x of each pair), so it reads as a route rather than a zigzag.
const ROUTE_VB = { w: 320, h: 128 };
function buildRoute(count) {
  const n = Math.max(1, Math.min(count, 8)); // beyond 8 the pins collide
  const left = 16;
  const right = ROUTE_VB.w - 16;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? ROUTE_VB.w / 2 : left + ((right - left) * i) / (n - 1);
    let y = i % 2 === 0 ? 96 : 48;
    y -= i * 3; // gentle upward drift so it doesn't look mechanical
    pts.push({ x, y: Math.max(28, Math.min(102, y)) });
  }
  let d = "";
  if (pts.length > 1) {
    d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const cx = (prev.x + cur.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
    }
  }
  return { pts, d, hidden: Math.max(0, count - n) };
}

// Tone per quick-info item, so the rail reads as a row of distinct facts
// rather than six identical green chips.
const QUICK_TONE = {
  dur: "emerald", itn: "plum", plc: "ocean",
  inc: "emerald", veh: "ocean", pol: "amber",
};

// Same idea for the title card's fact pills. All four in one green tint made
// the row read as a single blob; a tone each lets you pick out the rating from
// the duration at a glance.
const FACT_TONE = { rate: "amber", dur: "emerald", plc: "ocean", bk: "plum" };

export default function TourPreviewScreen({ navigation, route }) {
  const { id } = route?.params || {};
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [fleet, setFleet] = useState([]);

  const galleryRef = useRef(null);

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

  const goToImage = (i) => {
    galleryRef.current?.scrollTo({ x: i * PHOTO_W, animated: true });
    setGalleryIdx(i);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emeraldDeep} /></View>
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.muted} />
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
  const priceUnit = tour.priceType === "PER_PERSON" ? "Per person"
    : tour.priceType === "PER_GROUP" ? "Per group" : "Starting from";
  const statusBadge = STATUS_BADGE[tour.status] || STATUS_BADGE.DRAFT;
  const policyMeta = POLICY_META[String(tour.cancellationPolicy || "").toUpperCase()] || POLICY_META.MODERATE;
  const placeRoute = buildRoute(places.length);
  const durationText = `${tour.durationDays || 0}D${tour.durationNights ? ` / ${tour.durationNights}N` : ""}`;
  // Split here rather than inline in the JSX so the list can carry a count in
  // its header and know which row is last (for the divider).
  const terms = String(tour.termsConditions || "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^[\s•\-\d.)]+/, "").trim())
    .filter(Boolean);

  // Prototype's QuickInfo rail.
  const quickInfo = [
    { key: "dur", icon: "time-outline", label: "Duration", value: durationText },
    itinerary.length > 0 && { key: "itn", icon: "map-outline", label: "Itinerary", value: `${itinerary.length} days` },
    places.length > 0 && { key: "plc", icon: "location-outline", label: "Places", value: String(places.length) },
    inclusions.length > 0 && { key: "inc", icon: "gift-outline", label: "Included", value: `${inclusions.length} items` },
    attachedVehicles.length > 0 && { key: "veh", icon: "car-sport-outline", label: "Vehicles", value: String(attachedVehicles.length) },
    !!tour.cancellationPolicy && { key: "pol", icon: "shield-checkmark-outline", label: "Policy", value: policyMeta.label },
  ].filter(Boolean);

  // Fact badges. Rendered as tinted pills in the title card below the photo
  // (they were glass chips on the hero before).
  const facts = [
    tour.rating > 0 && { key: "rate", icon: "star", text: Number(tour.rating).toFixed(1) },
    { key: "dur", icon: "time-outline", text: durationText },
    places.length > 0 && { key: "plc", icon: "location-outline", text: `${places.length} Places` },
    tour.totalBookings > 0 && { key: "bk", icon: "people-outline", text: `${tour.totalBookings} Booked` },
  ].filter(Boolean);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ══════════ HEADER ══════════ */}
      {/* Same gradient header every other Travel Agent screen uses (Tours,
          Leads, Fleet …) instead of the immersive collapsing bar that floated
          over the photo. Title stays generic — the tour's own name lives in
          the title card below, so the two don't repeat each other. */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerTitle}>Tour Details</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {statusBadge.label} · {durationText}
                {tour.isPublic ? " · Public" : ""}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("TAAddEditTour", { tour })}
              style={styles.iconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="create-outline" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emeraldDeep} />
        }
      >
        {/* ══════════ PHOTO ══════════ */}
        <View style={styles.photoCard}>
          {gallery.length > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setGalleryIdx(Math.round(e.nativeEvent.contentOffset.x / PHOTO_W))
              }
            >
              {gallery.map((u, i) => (
                <RemoteImage key={`${u}-${i}`} source={{ uri: u }} style={styles.photoImg} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.photoImg, styles.photoEmpty]}>
              <Ionicons name="image-outline" size={44} color="rgba(255,255,255,0.45)" />
              <Text style={styles.photoEmptyText}>No photos yet</Text>
            </View>
          )}

          {/* Position readout for the pager — hidden on single-photo tours,
              where "1 / 1" is noise (the old copy read "1 Photos"). */}
          {gallery.length > 1 && (
            <View style={styles.photoChip} pointerEvents="none">
              <Ionicons name="camera" size={13} color="#fff" />
              <Text style={styles.photoChipText}>
                {galleryIdx + 1} / {gallery.length}
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
            style={styles.thumbStripWrap}
          >
            {gallery.map((u, i) => (
              <TouchableOpacity key={`th-${i}`} onPress={() => goToImage(i)} activeOpacity={0.85}>
                <RemoteImage
                  source={{ uri: u }}
                  style={[styles.stripThumb, i === galleryIdx && styles.stripThumbActive]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ══════════ TITLE ══════════ */}
        {/* Lifted off the photo. The hero used to carry the kicker, title,
            destination and the whole fact rail as glass overlays, so every
            detail was stacked on the image and the image itself never got to
            be one. On the page ground these read at full contrast, the title
            no longer needs clamping to 2 lines, and the facts wrap instead of
            hiding in a horizontal scroller. */}
        <View style={styles.titleCard}>
          {/* Corner wash. The card was the plainest thing on the screen while
              carrying the most important line on it; a soft emerald bloom in
              the top-right gives the title something to sit against without
              tinting the whole surface. */}
          <LinearGradient
            colors={[alpha(C.emerald, 0.13), alpha(C.emerald, 0)]}
            start={{ x: 1, y: 0 }} end={{ x: 0.15, y: 0.9 }}
            style={styles.titleWash}
            pointerEvents="none"
          />

          <View style={styles.kickerPill}>
            <Ionicons name="sparkles" size={11} color={TONES.amber.ink} />
            <Text style={styles.titleKicker}>TOUR PACKAGE</Text>
          </View>

          <Text style={styles.titleText}>{tour.title}</Text>

          {/* Short gold rule — closes the title off from the metadata under it
              the way a masthead does, so the two stop running together. */}
          <LinearGradient
            colors={G.gold}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.titleRule}
          />

          <View style={styles.titleLoc}>
            <View style={styles.titleLocChip}>
              <Ionicons name="location" size={13} color={C.emeraldDeep} />
            </View>
            <Text style={styles.titleLocText} numberOfLines={1}>
              {tour.destination || "—"}
            </Text>
          </View>

          {facts.length > 0 && (
            <>
              <View style={styles.titleDivider} />
              <View style={styles.factWrap}>
                {facts.map((f) => {
                  const t = TONES[FACT_TONE[f.key]] || TONES.emerald;
                  return (
                    <View key={f.key} style={[styles.factPill, { backgroundColor: t.tint }]}>
                      <Ionicons name={f.icon} size={13} color={t.ink} />
                      <Text style={[styles.factPillText, { color: t.ink }]}>{f.text}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ══════════ PRICE CARD ══════════ */}
        {/* The one number that matters, so it gets to be the anchor instead of
            another white box. Forest gradient ties it back to the header; the
            bright emerald gradient stays reserved for the CTA so the two
            don't compete. */}
        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.priceCard}
        >
          <AnimatedOrb style={styles.priceOrb} delay={400} dx={12} dy={9} />
          <View style={styles.priceTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.priceUnit}>{priceUnit}</Text>
              <Text style={styles.priceValue} numberOfLines={1}>{priceLabel || "On request"}</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name={statusBadge.icon} size={14} color="#fff" />
              <Text style={styles.statusPillText}>{statusBadge.label}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ══════════ LOCATION ROW ══════════ */}
        {/* A tinted band, not a card. It repeats the destination already shown
            in the title card, so it should sit under the real cards rather
            than float alongside them. */}
        {!!tour.destination && (
          <View style={styles.locationRow}>
            <LinearGradient
              colors={TONES.emerald.grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.iconChip}
            >
              <Ionicons name="location" size={19} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.locName} numberOfLines={1}>{tour.destination}</Text>
              <Text style={styles.locSub} numberOfLines={1}>Main destination</Text>
            </View>
          </View>
        )}

        {/* ══════════ QUICK INFO RAIL ══════════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickRailWrap}
          contentContainerStyle={styles.quickRail}
        >
          {quickInfo.map((q) => {
            const t = TONES[QUICK_TONE[q.key]] || TONES.emerald;
            return (
              <View key={q.key} style={styles.quickChip}>
                <LinearGradient
                  colors={t.grad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.quickChipIcon}
                >
                  <Ionicons name={q.icon} size={16} color="#fff" />
                </LinearGradient>
                <View style={{ minWidth: 0 }}>
                  <Text style={styles.quickLabel} numberOfLines={1}>{q.label}</Text>
                  <Text style={styles.quickValue} numberOfLines={1}>{q.value}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ══════════ SHORT DESCRIPTION ══════════ */}
        {/* A pull quote, so it gets a gold rule instead of a section header —
            it was the one card with no title, which made it read as an
            unfinished section. */}
        {!!tour.shortDescription && (
          <View style={styles.quoteCard}>
            <LinearGradient
              colors={G.gold}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.quoteBar}
            />
            <Text style={styles.quoteText}>{tour.shortDescription}</Text>
          </View>
        )}

        {/* ══════════ ABOUT ══════════ */}
        {!!tour.description && (
          <SectionCard icon="information-circle" title="About Tour" tone="ocean">
            <Text style={styles.bodyText}>{tour.description}</Text>
          </SectionCard>
        )}

        {/* ══════════ HIGHLIGHTS ══════════ */}
        {highlights.length > 0 && (
          <SectionCard icon="sparkles" title="Highlights" count={highlights.length} tone="amber">
            {/* Numbered gold chips on a connector, each highlight in its own
                tinted block. A bare dot + loose line was the weakest thing on
                the screen — the markers were interchangeable and the text had
                nothing holding it. Numbers also separate this from "Included"
                below, which is a checklist and stays one. */}
            {highlights.map((h, i) => (
              <View key={i} style={styles.hlRow}>
                <View style={styles.hlGutter}>
                  <LinearGradient
                    colors={TONES.amber.grad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.hlChip}
                  >
                    <Text style={styles.hlChipNum}>{i + 1}</Text>
                  </LinearGradient>
                  {i < highlights.length - 1 && <View style={styles.hlLine} />}
                </View>
                <View style={[styles.hlBlock, i === highlights.length - 1 && { marginBottom: 0 }]}>
                  <Text style={styles.hlText}>{h}</Text>
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ══════════ INCLUDED ══════════ */}
        {inclusions.length > 0 && (
          <SectionCard icon="checkmark-circle" title="What's Included" count={inclusions.length} tone="emerald">
            {inclusions.map((item, i) => (
              <View key={i} style={[styles.incRow, i === inclusions.length - 1 && { marginBottom: 0 }]}>
                <LinearGradient
                  colors={TONES.emerald.grad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.incDot}
                >
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </LinearGradient>
                <Text style={styles.incText}>{item}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ══════════ NOT INCLUDED ══════════ */}
        {exclusions.length > 0 && (
          <SectionCard icon="close-circle" title="What's Not Included" count={exclusions.length} tone="rose">
            {exclusions.map((item, i) => (
              <View key={i} style={[styles.excRow, i === exclusions.length - 1 && { marginBottom: 0 }]}>
                <View style={styles.excDot}>
                  <Ionicons name="close" size={13} color={C.red} />
                </View>
                <Text style={styles.excText}>{item}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ══════════ PLACES ══════════ */}
        {places.length > 0 && (
          <SectionCard icon="map" title="Places Covered" count={places.length} tone="ocean">

            {/* Route line — one pin per real place (see buildRoute) */}
            <View style={styles.routeMap}>
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${ROUTE_VB.w} ${ROUTE_VB.h}`}
                preserveAspectRatio="none"
              >
                <Defs>
                  <SvgLinearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={C.oceanLight} />
                    <Stop offset="1" stopColor={C.emerald} />
                  </SvgLinearGradient>
                </Defs>
                {!!placeRoute.d && (
                  <Path
                    d={placeRoute.d}
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth={3}
                    strokeDasharray="7 6"
                    strokeLinecap="round"
                  />
                )}
                {placeRoute.pts.map((p, i) => (
                  <Circle
                    key={`pin-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill={C.ocean}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                ))}
              </Svg>
              {placeRoute.hidden > 0 && (
                <View style={styles.routeMore}>
                  <Text style={styles.routeMoreText}>+{placeRoute.hidden} more</Text>
                </View>
              )}
            </View>

            {/* Tinted pills. They used to be white cards with their own shadow
                sitting on a white card — invisible edges, muddy shadows. */}
            <View style={styles.placeWrap}>
              {places.map((p, i) => (
                <View key={i} style={styles.placeChip}>
                  <Ionicons name="location" size={13} color={TONES.ocean.ink} />
                  <Text style={styles.placeChipText}>{p}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ══════════ ITINERARY ══════════ */}
        {itinerary.length > 0 && (
          <SectionCard icon="git-branch" title="Itinerary" count={itinerary.length} tone="plum">
            <View>
              {itinerary.map((d, i) => (
                <View key={i} style={styles.itRow}>
                  <View style={styles.itGutter}>
                    <LinearGradient
                      colors={TONES.plum.grad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.itBadge}
                    >
                      <Text style={styles.itBadgeCap}>DAY</Text>
                      <Text style={styles.itBadgeNum}>{d.day || i + 1}</Text>
                    </LinearGradient>
                    {i < itinerary.length - 1 && <View style={styles.itLine} />}
                  </View>
                  {/* Tinted block, no shadow — a day is content inside the card,
                      not another card. */}
                  <View style={[styles.itBlock, i === itinerary.length - 1 && { marginBottom: 0 }]}>
                    {!!d.title && <Text style={styles.itTitle}>{d.title}</Text>}
                    {!!d.description && <Text style={styles.itDesc}>{d.description}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ══════════ VEHICLES ══════════ */}
        {attachedVehicles.length > 0 && (
          <SectionCard icon="car-sport" title="Vehicles Included" count={attachedVehicles.length} tone="emerald">
            {attachedVehicles.map((v, i) => (
              <View
                key={v.id}
                style={[styles.vehRow, i < attachedVehicles.length - 1 && styles.vehRowDivided]}
              >
                {v.coverImage ? (
                  <RemoteImage source={{ uri: v.coverImage }} style={styles.vehThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.vehThumb, styles.vehThumbEmpty]}>
                    <Ionicons name="car" size={20} color={C.muted} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vehName} numberOfLines={1}>{v.vehicleName || "Vehicle"}</Text>
                  <Text style={styles.vehSub} numberOfLines={1}>
                    {[v.vehicleType, v.seatingCapacity ? `${v.seatingCapacity} seats` : null, v.chauffeurIncluded ? "Chauffeur" : null].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        {/* ══════════ CANCELLATION ══════════ */}
        {!!tour.cancellationPolicy && (
          <SectionCard icon="shield-checkmark" title="Cancellation Policy" tone="amber">
            <View style={[styles.policyBox, { backgroundColor: policyMeta.tint }]}>
              <View style={[styles.policyIcon, { backgroundColor: alpha(C.card, 0.9) }]}>
                <Ionicons name={policyMeta.icon} size={21} color={policyMeta.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.policyTitle, { color: policyMeta.color }]}>{policyMeta.label}</Text>
                <Text style={styles.policySub}>{policyMeta.desc}</Text>
              </View>
            </View>
            {!!tour.cancellationNotes && (
              <Text style={[styles.bodyText, styles.policyNotes]}>{tour.cancellationNotes}</Text>
            )}
          </SectionCard>
        )}

        {/* ══════════ TERMS ══════════ */}
        {!!tour.termsConditions && (
          <SectionCard icon="document-text" title="Terms & Conditions" count={terms.length} tone="ocean">
            {/* Clause list, so it reads like one: a serif numeral in a tinted
                square, a rule between clauses, and the text given room to
                breathe. Loose circles with no separators made ten clauses run
                together into one grey paragraph. */}
            {terms.map((line, i) => (
              <View
                key={i}
                style={[styles.termRow, i < terms.length - 1 && styles.termRowDivided]}
              >
                <View style={styles.termNum}>
                  <Text style={styles.termNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.termText}>{line}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Clears the fixed bottom bar (~84dp) plus one GAP, so the last card
            ends on the same rhythm as every gap above it instead of running
            under the bar or leaving a random dead strip. */}
        <View style={{ height: rs(84) + GAP }} />
      </ScrollView>

      {/* ══════════ BOTTOM BAR ══════════ */}
      <View style={styles.bottomBar}>
        <View style={styles.barPrice}>
          <Text style={styles.barPriceLabel} numberOfLines={1}>{priceUnit}</Text>
          <Text style={styles.barPriceValue} numberOfLines={1}>{priceLabel || "On request"}</Text>
        </View>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate("TAAddEditTour", { tour })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={G.emerald}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.ctaInner}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.ctaText}>Edit Tour</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Sub-components ───────── */

// SectionCard — white card, gradient accent on the top edge, plain header row.
//
// Two earlier versions of this failed in opposite directions. A flat white box
// with a small chip made ten sections read as one undifferentiated column; a
// full tinted header band overcorrected into ten coloured slabs. The accent is
// the middle: 3dp of the section's tone across the top edge identifies the card
// at a glance, the header stays white so the title carries it, and an inset
// hairline separates header from body without boxing anything in.
function SectionCard({ icon, title, count, tone = "emerald", children }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={t.grad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.cardAccent}
      />
      <View style={styles.cardHead}>
        <LinearGradient
          colors={t.grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.cardHeadIcon, { shadowColor: t.ink }]}
        >
          <Ionicons name={icon} size={17} color="#fff" />
        </LinearGradient>
        <Text style={styles.cardHeadTitle} numberOfLines={1}>{title}</Text>
        {count > 0 && (
          <View style={[styles.cardHeadCount, { backgroundColor: t.tint }]}>
            <Text style={[styles.cardHeadCountText, { color: t.ink }]}>{count}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardRule} />
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, backgroundColor: C.bg },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: "bold", color: C.text, marginTop: 12 },
  emptyBody: { fontFamily: DISPLAY, fontSize: rf(13), color: C.sub, marginTop: 6, textAlign: "center" },
  backCta: { marginTop: 16, backgroundColor: C.emeraldDeep, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  backCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold" },

  // ── Photo card ──
  // A card in the flow, not a full-bleed hero: same gutter and radius as the
  // surface cards under it, so the page reads as one stack.
  photoCard: {
    marginHorizontal: GUT, marginTop: GAP,
    width: PHOTO_W, height: PHOTO_H,
    borderRadius: rs(24), overflow: "hidden", backgroundColor: C.forest,
  },
  photoImg: { width: PHOTO_W, height: PHOTO_H },
  photoEmpty: { alignItems: "center", justifyContent: "center", gap: 8 },
  photoEmptyText: {
    fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold", color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.6, textTransform: "uppercase",
  },
  // RN has no backdrop-filter, so a dark translucent fill with a bright hairline
  // is the honest stand-in for frosted glass — it reads at any exposure.
  photoChip: {
    position: "absolute", right: 12, bottom: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 11, height: 32, borderRadius: 13,
    backgroundColor: "rgba(10,22,20,0.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
  },
  photoChipText: { fontFamily: DISPLAY, color: "#fff", fontSize: rf(12), fontWeight: "bold", includeFontPadding: false },

  // ── Title card (was the hero's glass panel + fact rail) ──
  titleCard: {
    marginHorizontal: GUT, marginTop: GAP, padding: rs(16), borderRadius: rs(22),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    overflow: "hidden", // clips the corner wash into the card's radius
    ...cardShadow,
  },
  titleWash: { position: "absolute", top: 0, right: 0, width: "80%", height: "72%" },
  // Kicker as a pill rather than floating letterspaced type — it now reads as
  // a label on the card instead of stray small print above the title.
  kickerPill: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: 999,
    backgroundColor: C.tintGold,
  },
  titleKicker: {
    fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", color: TONES.amber.ink,
    letterSpacing: 1.4, includeFontPadding: false,
  },
  titleText: {
    fontFamily: DISPLAY, fontSize: rf(21), fontWeight: "bold", color: C.text,
    lineHeight: rf(27), marginTop: rs(9), includeFontPadding: false,
  },
  titleRule: { width: rs(40), height: rs(3), borderRadius: 2, marginTop: rs(9) },
  titleLoc: { flexDirection: "row", alignItems: "center", gap: rs(8), marginTop: rs(9) },
  titleLocChip: {
    width: rs(24), height: rs(24), borderRadius: rs(8),
    backgroundColor: C.tintEmerald, alignItems: "center", justifyContent: "center",
  },
  titleLocText: { fontFamily: DISPLAY, fontSize: rf(13), color: C.sub, flexShrink: 1 },
  titleDivider: { height: 1, backgroundColor: C.border, marginTop: rs(12) },
  // Wraps rather than scrolling — off the photo there's width to spare, and a
  // horizontal scroller here would hide facts behind an invisible edge.
  factWrap: { flexDirection: "row", flexWrap: "wrap", gap: rs(7), marginTop: rs(11) },
  factPill: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: 999,
  },
  factPillText: {
    fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold",
    includeFontPadding: false,
  },

  // ── Thumbnail strip ──
  thumbStripWrap: { marginTop: GAP_TIGHT },
  thumbStrip: { flexDirection: "row", gap: rs(10), paddingHorizontal: GUT },
  // Selection reads through opacity + border, not border-colour alone — a 2dp
  // white→brand swap was almost invisible against a photo.
  stripThumb: {
    width: rs(80), height: rs(56), borderRadius: rs(16),
    borderWidth: 2, borderColor: "transparent",
    backgroundColor: C.sand, opacity: 0.5,
  },
  stripThumbActive: { borderColor: C.emerald, opacity: 1 },

  // ── Section cards ──
  // One float, one hairline. Everything inside is flat, so the card is the only
  // thing lifting off the cream ground.
  card: {
    marginHorizontal: GUT, marginTop: GAP, borderRadius: rs(22),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    overflow: "hidden", // clips the accent strip into the card's top corners
    ...cardShadow,
  },
  cardAccent: { height: rs(3), width: "100%" },
  cardHead: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    paddingHorizontal: rs(16), paddingTop: rs(15), paddingBottom: rs(13),
  },
  // Coloured shadow (shadowColor comes from the tone) so the chip lifts off the
  // white header instead of sitting flat on it.
  cardHeadIcon: {
    width: rs(38), height: rs(38), borderRadius: rs(13),
    alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.28, shadowRadius: rs(8), shadowOffset: { width: 0, height: rs(4) },
    elevation: 4,
  },
  cardHeadTitle: {
    flex: 1, fontFamily: DISPLAY, fontSize: rf(16), fontWeight: "bold",
    color: C.text, letterSpacing: -0.2, includeFontPadding: false,
  },
  // Tone-tinted pill — the only colour the header needs.
  cardHeadCount: {
    minWidth: rs(26), height: rs(26), paddingHorizontal: rs(8), borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
  cardHeadCountText: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", includeFontPadding: false },
  // Inset so it separates header from body without cutting the card in two.
  cardRule: { height: 1, marginHorizontal: rs(16), backgroundColor: C.border },
  cardBody: { padding: rs(16) },

  // Price card — gradient anchor
  priceCard: {
    marginHorizontal: GUT, marginTop: GAP,
    padding: rs(18), borderRadius: rs(22), overflow: "hidden",
    shadowColor: "#0B3327", shadowOpacity: 0.28, shadowRadius: rs(16), shadowOffset: { width: 0, height: rs(8) },
    elevation: 6,
  },
  priceOrb: {
    position: "absolute", top: -46, right: -30, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.16)",
  },
  priceTop: { flexDirection: "row", alignItems: "flex-end", gap: 14 },
  priceValue: {
    fontFamily: DISPLAY, fontSize: rf(28), fontWeight: "bold", color: "#fff",
    lineHeight: rf(33), marginTop: 3, includeFontPadding: false,
  },
  priceUnit: {
    fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: "rgba(255,255,255,0.72)",
    letterSpacing: 1.4, textTransform: "uppercase", includeFontPadding: false,
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
  },
  statusPillText: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold", color: "#fff", includeFontPadding: false },

  // Location row — tinted band, no shadow (see note at the call site)
  locationRow: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    marginHorizontal: GUT, marginTop: GAP, padding: rs(14), borderRadius: rs(20),
    backgroundColor: C.tintSand, borderWidth: 1, borderColor: C.tintBorder,
  },
  locName: { fontFamily: DISPLAY, fontSize: rf(14.5), fontWeight: "bold", color: C.text, includeFontPadding: false },
  locSub: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, marginTop: 2 },

  iconChip: {
    width: rs(40), height: rs(40), borderRadius: rs(15),
    alignItems: "center", justifyContent: "center",
  },

  // Quick info rail
  // The rail's own vertical padding is shadow room for the chips, not spacing —
  // without it the soft shadow gets clipped by the scroller's bounds.
  quickRailWrap: { marginTop: GAP },
  quickRail: { flexDirection: "row", gap: rs(12), paddingHorizontal: GUT, paddingVertical: rs(5) },
  quickChip: {
    flexDirection: "row", alignItems: "center", gap: rs(10),
    paddingHorizontal: rs(14), paddingVertical: rs(10), borderRadius: rs(18), minHeight: rs(48),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    ...rowShadow,
  },
  quickChipIcon: {
    width: rs(32), height: rs(32), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: {
    fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted,
    letterSpacing: 0.5, textTransform: "uppercase", includeFontPadding: false,
  },
  quickValue: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.text, marginTop: 1, includeFontPadding: false },

  // Short description — pull quote with a gold rule
  quoteCard: {
    flexDirection: "row", gap: rs(14),
    marginHorizontal: GUT, marginTop: GAP, padding: rs(18), borderRadius: rs(22),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  quoteBar: { width: rs(3), borderRadius: 2 },
  quoteText: { flex: 1, fontFamily: DISPLAY, fontSize: rf(13.5), color: C.sub, lineHeight: rf(21), fontStyle: "italic" },

  bodyText: { fontFamily: DISPLAY, fontSize: rf(13.5), color: C.sub, lineHeight: rf(21) },

  // Highlights — a timeline, so the connector should carry the eye and the
  // markers should stay quiet.
  hlRow: { flexDirection: "row", gap: rs(13) },
  hlGutter: { width: rs(30), alignItems: "center" },
  hlChip: {
    width: rs(30), height: rs(30), borderRadius: rs(15),
    alignItems: "center", justifyContent: "center",
    shadowColor: C.gold, shadowOpacity: 0.32, shadowRadius: rs(7), shadowOffset: { width: 0, height: rs(3) },
    elevation: 3,
  },
  hlChipNum: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: "#fff", includeFontPadding: false },
  hlLine: { flex: 1, width: 2, borderRadius: 1, backgroundColor: alpha(C.gold, 0.3), marginVertical: rs(5) },
  hlBlock: {
    flex: 1, marginBottom: rs(10), paddingHorizontal: rs(13), paddingVertical: rs(11),
    borderRadius: rs(14), backgroundColor: C.tintGold,
  },
  hlText: { fontFamily: DISPLAY, fontSize: rf(13.5), color: C.text, lineHeight: rf(20) },

  // Included — tinted row, no border. The fill already draws the edge; a border
  // on top of it was a second line saying the same thing.
  incRow: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    paddingHorizontal: rs(13), paddingVertical: rs(11), borderRadius: rs(14), marginBottom: rs(8),
    backgroundColor: C.tintEmerald,
  },
  incDot: {
    width: rs(24), height: rs(24), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
  },
  incText: { flex: 1, fontFamily: DISPLAY, fontSize: rf(13.5), color: C.text, lineHeight: rf(19) },

  // Not included — same shape in the red tint, so the pair reads as two sides
  // of one list rather than a list and its disabled copy.
  excRow: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    paddingHorizontal: rs(13), paddingVertical: rs(11), borderRadius: rs(14), marginBottom: rs(8),
    backgroundColor: C.redL,
  },
  excDot: {
    width: rs(24), height: rs(24), borderRadius: rs(12),
    backgroundColor: alpha(C.card, 0.75),
    alignItems: "center", justifyContent: "center",
  },
  excText: { flex: 1, fontFamily: DISPLAY, fontSize: rf(13.5), color: C.sub, lineHeight: rf(19) },

  // Places — route illustration + chips
  routeMap: {
    height: rs(128), borderRadius: rs(18), overflow: "hidden", marginBottom: rs(16),
    backgroundColor: C.tintOcean,
    justifyContent: "center",
  },
  routeMore: {
    position: "absolute", right: 10, bottom: 10,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    backgroundColor: alpha(C.card, 0.8),
  },
  routeMoreText: {
    fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold", color: TONES.ocean.ink,
    includeFontPadding: false,
  },
  placeWrap: { flexDirection: "row", flexWrap: "wrap", gap: rs(8) },
  placeChip: {
    flexDirection: "row", alignItems: "center", gap: rs(7),
    paddingHorizontal: rs(12), paddingVertical: rs(9), borderRadius: 999,
    backgroundColor: C.tintOcean,
  },
  placeChipText: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: TONES.ocean.ink, includeFontPadding: false },

  // Itinerary
  itRow: { flexDirection: "row", gap: rs(14) },
  itGutter: { width: rs(44), alignItems: "center" },
  itBadge: {
    width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: "center", justifyContent: "center",
    shadowColor: C.plum, shadowOpacity: 0.32, shadowRadius: rs(10), shadowOffset: { width: 0, height: rs(5) },
    elevation: 4,
  },
  itBadgeCap: { fontFamily: DISPLAY, fontSize: rf(8), fontWeight: "bold", color: "rgba(255,255,255,0.85)", letterSpacing: 0.8, includeFontPadding: false },
  itBadgeNum: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", color: "#fff", lineHeight: rf(17), includeFontPadding: false },
  itLine: { flex: 1, width: 2, borderRadius: 1, backgroundColor: alpha(C.plum, 0.22), marginVertical: 6 },
  itBlock: {
    flex: 1, marginBottom: rs(14), padding: rs(14), borderRadius: rs(16),
    backgroundColor: C.tintPlum,
  },
  itTitle: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", color: C.text, includeFontPadding: false },
  itDesc: { fontFamily: DISPLAY, fontSize: rf(13), color: C.sub, lineHeight: rf(19), marginTop: 5 },

  // Vehicles — hairline-divided rows rather than free-floating ones
  vehRow: { flexDirection: "row", alignItems: "center", gap: rs(12), paddingVertical: rs(11) },
  vehRowDivided: { borderBottomWidth: 1, borderBottomColor: C.border },
  vehThumb: { width: rs(56), height: rs(56), borderRadius: rs(16), backgroundColor: C.sand },
  vehThumbEmpty: { alignItems: "center", justifyContent: "center" },
  vehName: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: "bold", color: C.text, includeFontPadding: false },
  vehSub: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, marginTop: 3 },

  // Policy — tinted block in the policy's own colour, no border
  policyBox: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(14), borderRadius: rs(16),
  },
  policyIcon: { width: rs(44), height: rs(44), borderRadius: rs(16), alignItems: "center", justifyContent: "center" },
  policyTitle: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: "bold", includeFontPadding: false },
  policySub: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, marginTop: 2 },
  policyNotes: { marginTop: rs(14), fontSize: rf(13) },

  // Terms
  termRow: { flexDirection: "row", alignItems: "flex-start", gap: rs(13), paddingVertical: rs(12) },
  termRowDivided: { borderBottomWidth: 1, borderBottomColor: C.border },
  // Rounded square, not a circle — a numeral in a square reads as a clause
  // number; in a circle it reads as a bullet.
  termNum: {
    width: rs(28), height: rs(28), borderRadius: rs(10), backgroundColor: C.tintOcean,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  termNumText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: TONES.ocean.ink,
    letterSpacing: 0.2, includeFontPadding: false,
  },
  termText: { flex: 1, fontFamily: DISPLAY, fontSize: rf(13.5), color: C.sub, lineHeight: rf(21) },

  // ── Gradient header ──
  // Values copied from ToursListScreen so this screen's bar is the same object
  // the rest of the portal uses, not a look-alike.
  headerGrad: {
    paddingBottom: rs(26),
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
    overflow: "hidden",
  },
  // 7, not 16: the icon buttons are 40dp boxes around 22dp glyphs, so the
  // glyph sits 9dp inside its own box. 7 + 9 lands the back arrow on the same
  // vertical line as the cards' 16dp gutter — at 12 it was floating 5dp
  // inboard of everything below it.
  headerSafe: { paddingHorizontal: rs(7) },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 30, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.14)",
  },
  // gap, not bare adjacency — the title used to start right at the edge of the
  // back button's 40dp box, so it read as if it were part of the button.
  headerRow: { flexDirection: "row", alignItems: "center", gap: rs(6), paddingTop: rs(8) },
  iconBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    alignItems: "center", justifyContent: "center",
  },
  // Explicit lineHeight + includeFontPadding:false on both lines. Android's
  // serif carries its own vertical padding, which is what made the title and
  // the status line sit unevenly however the margin was tuned.
  headerTitle: {
    fontFamily: DISPLAY, fontSize: rf(20), fontWeight: "bold", color: "#fff",
    lineHeight: rf(26), letterSpacing: -0.2, includeFontPadding: false,
  },
  headerSub: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: "rgba(255,255,255,0.85)",
    fontWeight: "bold", lineHeight: rf(15), marginTop: rs(3),
    letterSpacing: 0.2, includeFontPadding: false,
  },

  // ── Bottom bar ──
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: GUT, paddingTop: 12, paddingBottom: 24,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  barPrice: { minWidth: 0, justifyContent: "center" },
  barPriceLabel: {
    fontFamily: DISPLAY, fontSize: rf(9.5), fontWeight: "bold", color: C.muted,
    letterSpacing: 0.6, textTransform: "uppercase", includeFontPadding: false,
  },
  barPriceValue: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: C.text, marginTop: 2, includeFontPadding: false },
  cta: {
    flex: 1, borderRadius: rs(18), overflow: "hidden",
    shadowColor: C.emeraldDeep, shadowOpacity: 0.4, shadowRadius: rs(16), shadowOffset: { width: 0, height: rs(8) },
    elevation: 6,
  },
  ctaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  ctaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(14), letterSpacing: 0.3 },
});
