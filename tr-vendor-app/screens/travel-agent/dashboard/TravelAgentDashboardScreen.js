// screens/travel-agent/dashboard/TravelAgentDashboardScreen.js
// REDESIGNED (v2) — "Elevate" luxury-travel visual language ported from the
// Lovable web prototype (transrentals-elevate) into React Native.
//
// ⚠️ IMPORTANT: Only the *UI / look* changed. All data sources, derived values,
// conditional sections, navigation routes/params and the load() logic are
// preserved EXACTLY as the previous version — same details, same behaviour.
//
// Design language:
//  • Warm ivory background, emerald→forest gradient hero with floating orbs
//  • Glass cards (translucent white + soft shadow), gold/emerald/ocean accents
//  • Serif "display" numerals & headings (Android `serif` / iOS Georgia)
//  • Circular progress ring + sparkline via react-native-svg
//  • Bento KPI grid, timeline, floating-feel cards
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions, Platform,
  Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { DISPLAY } from "../_shared/typography";
import {
  getCurrentTravelAgent,
  getTravelAgentProfile,
  updateCachedTravelAgent,
  getTravelAgentDashboard,
  getTravelAgentEarnings,
  getTravelAgentUnreadCount,
  listTravelAgentLeads,
  listTravelAgentBookings,
  listSocialConversations,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const { width: W } = Dimensions.get("window");

// ── Responsive scaling ───────────────────────────────────────────────
// The layout is designed against a 390dp-wide baseline and scaled to the
// device width, clamped so it never gets extreme on tiny phones or tablets.
//   rs() → spacing / sizes / heights   ·   rf() → fonts (gentler curve)
const BASE_W = 390;
const SCALE = Math.min(Math.max(W / BASE_W, 0.86), 1.28);
const FONT_SCALE = Math.min(Math.max(W / BASE_W, 0.92), 1.12);
const rs = (n) => Math.round(n * SCALE);
const rf = (n) => Math.round(n * FONT_SCALE * 2) / 2; // half-px precision for text


// Gradient presets
const G = {
  hero:    [C.forestDark, C.forest, C.emeraldDeep],
  emerald: [C.emerald, C.emeraldDeep],
  gold:    [C.goldLight, C.gold],
  ocean:   [C.oceanLight, "#245C7A"],
  sand:    ["#F3EDDF", "#E7DDC8"],
};

// Compact-tile accent tones — icon gradient + soft pill tint + readable ink.
// Each management tile gets a distinct tone so the grid reads colourful but
// still premium (no muddy same-tint cards).
const TONES = {
  emerald: { grad: [C.emerald, C.emeraldDeep], tint: "#E7F2EC", ink: C.emeraldDeep },
  ocean:   { grad: [C.oceanLight, "#245C7A"],  tint: "#E4EFF5", ink: "#245C7A" },
  amber:   { grad: [C.goldLight, C.gold],      tint: "#F7EFD8", ink: "#9A6B16" },
  plum:    { grad: ["#8A6DD4", "#5E43A8"],      tint: "#EFE9FA", ink: "#5E43A8" },
  rose:    { grad: ["#E88AA0", "#C65772"],      tint: "#FBE9EE", ink: "#B14A64" },
};

// Elegant serif for "display" numerals & headings

// Layout (responsive — gutters/gaps scale with device width)
const GUT = rs(20);
const GAP = rs(12);
const COL2 = (W - GUT * 2 - GAP) / 2;
// Bento (Quick actions) — big feature tile + side stack + 3-across bottom row.
// BENTO_3W also feeds the Business-snapshot KPI row.
const FULLW = W - GUT * 2;
const BENTO_BIG_W = Math.round(FULLW * 0.62);
const BENTO_SIDE_W = FULLW - BENTO_BIG_W - GAP;
const BENTO_ROW_H = rs(104);
const BENTO_BIG_H = BENTO_ROW_H * 2 + GAP;
const BENTO_3W = Math.floor((FULLW - GAP * 2) / 3);
const BENTO_4W = Math.floor((FULLW - GAP * 3) / 4);

const fmt = (n) => {
  if (n == null || isNaN(Number(n))) return "₹0";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function fmtAgo(iso) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

// Tiny multi-library icon helper
function Ico({ lib, name, size, color }) {
  if (lib === "mci") return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} />;
}

// Softly "breathing" corner bubble for the compact tiles. Loops a gentle
// scale + float + opacity pulse (native-driven, so it's smooth & cheap).
// `delay` staggers each tile so the grid doesn't pulse in unison.
function AnimatedWash({ color, delay = 0 }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 2600, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.32] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[s.compactWash, { backgroundColor: color, opacity, transform: [{ scale }, { translateY }] }]}
    />
  );
}

// Compact management tile (accent-toned) — used in the two rows around Payments.
function CompactTile({ m, index, onPress }) {
  const tone = TONES[m.tone] || TONES.emerald;
  return (
    <TouchableOpacity
      style={[s.cardShadow, s.compactCard]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* softly breathing tone bubble in the corner */}
      <AnimatedWash color={tone.tint} delay={index * 300} />
      <View style={s.compactTop}>
        <LinearGradient colors={tone.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.compactIcon}>
          <Ico lib={m.lib} name={m.icon} size={19} color="#fff" />
        </LinearGradient>
        {m.value ? (
          <View style={[s.compactPill, { backgroundColor: tone.tint }]}>
            <Text style={[s.compactPillTxt, { color: tone.ink }]} numberOfLines={1}>{m.value}</Text>
          </View>
        ) : (
          <View style={[s.compactChev, { backgroundColor: tone.tint }]}>
            <Ionicons name="arrow-forward" size={14} color={tone.ink} />
          </View>
        )}
      </View>
      <Text style={s.compactLabel} numberOfLines={1}>{m.label}</Text>
      <Text style={s.compactSub} numberOfLines={1}>{m.sub}</Text>
    </TouchableOpacity>
  );
}

export default function TravelAgentDashboardScreen({ navigation }) {
  const [agent, setAgent] = useState(null);
  const [dash, setDash] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [unread, setUnread] = useState(0);
  // Count of customer-side bookings (Personal + Company) the TA placed via
  // their own customer login. Powers the dedicated "Self-Bookings" Manage tile
  // — see web parity at src/app/travel-agent/(dashboard)/bookings/page.tsx.
  const [selfBookingsCount, setSelfBookingsCount] = useState(0);
  // Total unread across social (vendor/partner) message threads → Messages badge.
  const [socialUnread, setSocialUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // Pull the LIVE profile so onboarding steps reflect reality (e.g. docs just
      // submitted → status UNDER_REVIEW). Falls back to the cached agent if offline.
      const fetchAgent = async () => {
        const cached = await getCurrentTravelAgent();
        try {
          const fresh = await getTravelAgentProfile();
          if (fresh?.status) { updateCachedTravelAgent(fresh).catch(() => {}); return { ...cached, ...fresh }; }
        } catch {}
        return cached;
      };
      const [ta, d, e, u, leadsRes, bookingsRes, socialRes] = await Promise.all([
        fetchAgent(),
        getTravelAgentDashboard().catch(() => null),
        getTravelAgentEarnings("month").catch(() => null),
        getTravelAgentUnreadCount().catch(() => null),
        listTravelAgentLeads({ limit: 4 }).catch(() => null),
        // limit=1 just to fetch the selfBookings array which the endpoint
        // returns un-paginated alongside the manual-bookings page.
        listTravelAgentBookings({ page: 1, limit: 1 }).catch(() => null),
        listSocialConversations().catch(() => null),
      ]);
      setAgent(ta);
      setDash(d);
      setEarnings(e);
      if (u?.count != null) setUnread(u.count);
      setRecentLeads(leadsRes?.leads || leadsRes?.items || []);
      setSelfBookingsCount((bookingsRes?.selfBookings || []).length);
      setSocialUnread(
        (socialRes?.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: rs(12) }}>
        <ActivityIndicator size="large" color={C.emeraldDeep} />
        <Text style={{ color: C.sub, fontWeight: "600" }}>Loading your dashboard…</Text>
      </View>
    );
  }

  const status = agent?.status || "PENDING";
  const isApproved = status === "APPROVED";
  const agencyName = agent?.agencyName || agent?.ownerName || "Travel Agent";
  const agentId = agent?.tid; // Travel Agent ID (ta-0001), shown in the hero

  // Stats from dashboard endpoint
  const leads = dash?.leads || dash?.stats?.leads || {};
  const followUps = dash?.followUps || {};
  const bookings = dash?.bookings || dash?.stats?.bookings || {};
  const tours = dash?.tours || {};
  const properties = dash?.properties || {};
  const fleet = dash?.fleet || {};

  const monthRevenue = earnings?.summary?.totalRevenue ?? bookings.totalAmount ?? 0;
  // Real last-6-months revenue series → powers the Revenue card sparkline.
  const revenueTrend = (earnings?.trend || []).map((t) => Number(t?.revenue) || 0);
  const trend = earnings?.summary?.trend;
  const growth = Math.round(Math.abs(trend?.deltaPercent || 0));
  const positive = (trend?.deltaPercent ?? 0) >= 0;
  // Collection ring — how much of this month's revenue has actually landed.
  // Same fields the Collected/Pending tiles used; denominator is the API's own
  // totalRevenue (note: collected + pending need not equal it — leads in
  // SUBMITTED state contribute their advance to pending but their full quote
  // to totalRevenue, so the ring tracks collected-of-total, not a 2-way split).
  const collectedRevenue = Number(earnings?.summary?.collectedRevenue || 0);
  const pendingRevenue = Number(earnings?.summary?.pendingRevenue || 0);
  const collectionPct = Number(monthRevenue) > 0
    ? Math.min(100, Math.round((collectedRevenue / Number(monthRevenue)) * 100))
    : 0;
  // Revenue card shows only when this-month revenue ≥ ₹10K; below that it's
  // hidden and the Business snapshot grid leads the approved dashboard.
  const showEarnings = isApproved && Number(monthRevenue) >= 10000;

  // Onboarding steps for non-approved
  // Docs are "done" once the required KYC doc (Address Proof) is submitted — the
  // backend flips status away from DOCUMENTS_PENDING/PENDING at that point.
  const docsSubmitted = !!agent?.status && !["DOCUMENTS_PENDING", "PENDING"].includes(agent.status);
  const docsDone = docsSubmitted || (!!agent?.documentsCount && agent.documentsCount >= 1);
  const bankDone = !!agent?.bankAccountsCount && agent.bankAccountsCount >= 1;
  const profileDone = !!(agent?.agencyName && agent?.ownerName && (agent?.address || agent?.city) && agent?.gstNumber);
  const steps = [
    { id: 1, name: "Profile",   done: profileDone, current: !profileDone },
    { id: 2, name: "Documents", done: docsDone,    current: profileDone && !docsDone },
    { id: 3, name: "Bank",      done: bankDone,    current: profileDone && docsDone && !bankDone },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const setupPct = Math.round((doneCount / steps.length) * 100);

  // Pending setup grid (when not approved)
  const pendingActions = [
    { name: "Complete profile", desc: "Agency details & GST",  icon: "person",          grad: G.emerald, route: "TAProfile",   done: profileDone },
    { name: "Upload documents", desc: "Address proof (KYC)", icon: "document-text", grad: G.gold,    route: "TADocuments", done: docsDone },
    { name: "Add bank account", desc: "Receive payouts",        icon: "card",            grad: G.ocean,   route: "TABankDetails", done: bankDone },
  ];
  const nextPending = pendingActions.find((a) => !a.done);

  // Quick actions (4 per row; will wrap)
  const quickActions = [
    { label: "Add Lead",     icon: "person-add",   lib: "ion", route: "TAAddEditLead" },
    { label: "New Booking",  icon: "calendar",     lib: "ion", route: "TAAddEditBooking" },
    { label: "Add Tour",     icon: "map",          lib: "mci", route: "TAAddEditTour" },
    { label: "Add Property", icon: "bed",          lib: "ion", route: "TAAddEditProperty" },
    { label: "Add Vehicle",  icon: "car-sport",    lib: "ion", route: "TAAddEditFleet" },
    { label: "Capture Link", icon: "link-variant", lib: "mci", route: "TAAddEditCaptureLink" },
    { label: "New Post",     icon: "create",       lib: "ion", route: "TACreatePost" },
  ];

  // Listings (Your Services equivalent). "Leads" opens the Leads tab, whose
  // own ops bar exposes Add Lead / Pipeline / Follow-Ups / Capture Links /
  // Quote Requests — so the dashboard stays clean.
  const listings = [
    { name: "Leads",      icon: "people",     grad: G.ocean,   route: "TravelAgentDashboard", params: { screen: "TALeads" }, count: leads.total ?? leads.active ?? 0 },
    { name: "Tours",      icon: "map",        grad: G.emerald, route: "TATours",     count: tours.total ?? 0 },
    { name: "Properties", icon: "bed",        grad: G.gold,    route: "TAProperties", count: properties.total ?? 0 },
    { name: "Fleet",      icon: "car-sport",  grad: G.ocean,   route: "TAFleet",     count: fleet.total ?? 0 },
  ];

  // Manage items (2-col grid). Self-Bookings tile appears only when this TA
  // has placed any customer-side bookings (Personal or Company) — keeps the
  // grid clean for agents who don't book on the customer side.
  const manageItems = [
    { label: "Pipeline",       sub: "Kanban view",       icon: "git-network",    lib: "ion", grad: G.emerald, route: "TAPipeline" },
    { label: "Follow-ups",     sub: "Overdue & today",   icon: "alarm",          lib: "ion", grad: G.gold,    route: "TAFollowUps" },
    { label: "Quote Requests", sub: "Customer enquiries", icon: "mail-unread",   lib: "ion", grad: G.ocean,   route: "TATourQuoteRequests" },
    { label: "Earnings",       sub: "Revenue & payouts", icon: "trending-up",    lib: "ion", grad: G.emerald, route: "TAEarnings" },
    { label: "Payments",       sub: "Transactions",      icon: "card",           lib: "ion", grad: G.ocean,   route: "TAPayments" },
    { label: "Capture Links",  sub: "Public lead forms", icon: "link",           lib: "ion", grad: G.gold,    route: "TACaptureLinks" },
    ...(selfBookingsCount > 0 ? [{
      label: "Self-Bookings",
      sub: `${selfBookingsCount} Personal / Company`,
      icon: "briefcase",
      lib: "ion",
      grad: G.emerald,
      route: "TravelAgentDashboard",
      params: { screen: "TABookings" },
      badge: selfBookingsCount,
    }] : []),
  ];

  // Compact management modules — Pipeline & Payments render as wide cards above.
  // Each tile carries a distinct `tone`; a real metric shows as a colour pill,
  // otherwise the tile shows an arrow affordance (no placeholder "View"/"Manage").
  const compactModules = [
    { label: "Follow-ups",     sub: "Due today & overdue", value: String((followUps.overdue || 0) + (followUps.today || 0)), icon: "alarm",       lib: "ion", tone: "amber",   route: "TAFollowUps" },
    { label: "Quote Requests", sub: "Customer enquiries",  icon: "mail-unread", lib: "ion", tone: "ocean",   route: "TATourQuoteRequests" },
    { label: "Earnings",       sub: "This month",          value: trend ? `${positive ? "+" : "-"}${growth}%` : null, icon: "trending-up", lib: "ion", tone: "emerald", route: "TAEarnings" },
    { label: "Capture Links",  sub: "Public lead forms",   icon: "link",        lib: "ion", tone: "plum",    route: "TACaptureLinks" },
    ...(selfBookingsCount > 0 ? [{ label: "Self-Bookings", sub: "Personal / Company", value: String(selfBookingsCount), icon: "briefcase", lib: "ion", tone: "rose", route: "TravelAgentDashboard", params: { screen: "TABookings" } }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(140) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.emeraldDeep]}
            tintColor={C.emerald}
          />
        }
      >
        {/* ══════════════════ HERO ══════════════════ */}
        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.hero, showEarnings && { paddingBottom: rs(24) }]}
        >
          {/* floating orbs */}
          <AnimatedOrb style={s.orb1} delay={0} dx={16} dy={14} />
          <AnimatedOrb style={s.orb2} delay={900} dx={-14} dy={10} />

          <SafeAreaView edges={["top"]}>
            {/* Top bar — agency name + ID on the left, notification bell on the right */}
            <View style={s.topBar}>
              {/* Name + ID chip pinned to the top-left */}
              <View style={s.headline}>
                <Text style={s.headName} numberOfLines={2}>{agencyName}</Text>
                {!!agentId && (
                  <View style={s.idChip}>
                    <Ionicons name="finger-print" size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={s.idChipTxt}>{String(agentId).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={s.iconChip}
                onPress={() => navigation.navigate("TANotifications")}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={17} color="rgba(255,255,255,0.92)" />
                {unread > 0 && (
                  <View style={s.bellDot}>
                    <Text style={s.bellDotTxt}>{unread > 9 ? "9+" : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Revenue — integrated into the header itself */}
            {showEarnings && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("TAEarnings")} style={s.heroRev}>
                <View style={s.heroRevTop}>
                  <View style={s.heroRevIcon}>
                    <Ionicons name="wallet" size={17} color="#fff" />
                  </View>
                  {trend ? (
                    <View style={s.heroRevDelta}>
                      <Ionicons name={positive ? "trending-up" : "trending-down"} size={12} color="#fff" />
                      <Text style={s.heroRevDeltaTxt}>{`${positive ? "+" : "-"}${growth}%`}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.heroRevLbl}>REVENUE THIS MONTH</Text>
                <Text style={s.heroRevAmt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{fmt(monthRevenue)}</Text>
                <View style={s.heroRevSpark}><Sparkline color="rgba(255,255,255,0.9)" data={revenueTrend} /></View>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </LinearGradient>

        {/* ══════════════════ BODY (overlaps hero) ══════════════════ */}
        <View style={s.body}>

          {/* ── Dynamic hero card: earnings / KPIs / onboarding ring ── */}

          {/* Revenue is now shown inside the hero itself. The body's negative
              top margin would tuck the first section heading under the hero, so
              (when approved) nudge it down to clear the hero's bottom curve. */}
          {isApproved && <View style={{ height: rs(40) }} />}

          {isApproved && (
            <View style={s.section}>
              <SectionHeading kicker="Today" title="Business snapshot" right={<Text style={s.countPill}>This month</Text>} />
              {/* Money-first snapshot: a collection ring over a counts strip.
                  Every value here already ships in the dashboard/earnings
                  payloads the screen was fetching anyway. */}
              <CollectionRingCard
                pct={collectionPct}
                collected={fmt(collectedRevenue)}
                total={fmt(monthRevenue)}
                pending={fmt(pendingRevenue)}
                delta={trend ? `${positive ? "+" : "-"}${growth}%` : null}
                positive={positive}
                bookings={String(bookings.total ?? 0)}
                leads={String(leads.total ?? leads.active ?? 0)}
                dueToday={String((followUps.overdue || 0) + (followUps.today || 0))}
                onPressRing={() => navigation.navigate("TAPayments")}
                onPressGrowth={() => navigation.navigate("TAEarnings")}
                onPressBookings={() => navigation.navigate("TravelAgentDashboard", { screen: "TABookings" })}
                onPressLeads={() => navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })}
                onPressDue={() => navigation.navigate("TAFollowUps")}
              />
            </View>
          )}

          {/* Onboarding progress ring (not approved) */}
          {!isApproved && (
            <View style={[s.glass, s.cardShadow, s.ringCard]}>
              <View style={s.ringRow}>
                <View style={s.ringWrap}>
                  <Ring pct={setupPct} />
                  <View style={s.ringCenter}>
                    <Text style={s.ringPct}>{setupPct}</Text>
                    <Text style={s.ringPctLbl}>PERCENT</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ringKicker}>ONBOARDING</Text>
                  <Text style={s.ringTitle}>Complete setup to go live</Text>
                  <View style={s.ringMeta}>
                    <Ionicons name="time-outline" size={13} color={C.sub} />
                    <Text style={s.ringMetaTxt}>{doneCount}/{steps.length} done · {steps.find((x) => x.current)?.name || "All set"}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate(nextPending?.route || "TAProfile")}
                style={s.cardShadow}
              >
                <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.continueBtn}>
                  <Text style={s.continueTxt}>Continue setup</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Action center (horizontal priority cards — ported from Lovable) ── */}
          {(!bankDone || !docsDone) && (
            <View style={s.section}>
              <SectionHeading kicker="Priority" title="Action center" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -GUT }}
                contentContainerStyle={{ gap: GAP, paddingHorizontal: GUT }}
              >
                {!bankDone && (
                  <PriorityCard
                    tone="gold" icon="card-outline" title="Verify payout account"
                    desc="Add your bank to receive payouts"
                    onPress={() => navigation.navigate("TABankDetails")}
                  />
                )}
                {!docsDone && (
                  <PriorityCard
                    tone="emerald" icon="document-text-outline" title="Upload address proof"
                    desc="Complete your KYC verification"
                    onPress={() => navigation.navigate("TADocuments")}
                  />
                )}
              </ScrollView>
            </View>
          )}

          {/* ── Recent Leads (approved) ── */}
          {isApproved && recentLeads.length > 0 && (
            <View style={s.section}>
              <SectionHeading kicker="Today" title="Recent leads"
                right={<View style={s.livePill}><View style={s.liveDot} /><Text style={s.livePillTxt}>{recentLeads.length} new</Text></View>} />
              <View style={{ gap: rs(12) }}>
                {recentLeads.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[s.glass, s.cardShadow, s.leadCard]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("TALeadDetail", { id: l.id, customerName: l.customerName })}
                  >
                    <View style={s.leadTop}>
                      <View style={s.leadAvatar}>
                        <Text style={s.leadAvatarTxt}>{(l.customerName || "?").charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.leadName} numberOfLines={1}>{l.customerName || "Customer"}</Text>
                        {!!(l.destination || l.tripType) && (
                          <Text style={s.leadSub} numberOfLines={1}>
                            {l.destination || ""}
                            {l.destination && l.tripType ? " · " : ""}
                            {l.tripType ? String(l.tripType).replace("_", " ") : ""}
                          </Text>
                        )}
                      </View>
                      <Text style={s.leadAgo}>{fmtAgo(l.createdAt)}</Text>
                    </View>
                    <View style={s.leadBottom}>
                      <Text style={s.leadContact} numberOfLines={1}>
                        {l.customerPhone || l.customerEmail || l.status || "—"}
                      </Text>
                      <View style={s.leadBtn}>
                        <Text style={s.leadBtnTxt}>Open</Text>
                        <Ionicons name="arrow-forward" size={13} color="#fff" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={s.viewAll}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })}
              >
                <Text style={s.viewAllTxt}>View all leads</Text>
                <Ionicons name="arrow-forward" size={13} color={C.emeraldDeep} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Pending setup (not approved) ── */}
          {!isApproved && (
            <View style={s.section}>
              <SectionHeading kicker="Get ready" title="Complete setup" />
              <View style={{ gap: GAP }}>
                {pendingActions.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.glass, s.cardShadow, s.setupRow]}
                    onPress={() => navigation.navigate(a.route)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.setupAccent} />
                    <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.setupIcon}>
                      <Ionicons name={a.icon} size={20} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.setupName} numberOfLines={1}>{a.name}</Text>
                      <Text style={s.setupDesc} numberOfLines={1}>
                        <Text style={s.setupStepInline}>Step {i + 1}</Text>
                        {"  ·  " + a.desc}
                      </Text>
                    </View>
                    {a.done ? (
                      <View style={s.setupDone}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    ) : (
                      <View style={s.setupStart}>
                        <Text style={s.setupStartTxt}>Start</Text>
                        <Ionicons name="arrow-forward" size={13} color={C.emeraldDeep} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {status === "UNDER_REVIEW" && (
                <View style={[s.statusNote, { backgroundColor: "#E7F2F8", borderColor: "#CBE4EF" }]}>
                  <Ionicons name="time-outline" size={15} color={C.ocean} />
                  <Text style={[s.statusNoteTxt, { color: C.ocean }]}>Under review · 1–2 business days</Text>
                </View>
              )}
              {status === "REJECTED" && (
                <View style={[s.statusNote, { backgroundColor: C.redL, borderColor: "#F3CFCB" }]}>
                  <Ionicons name="close-circle-outline" size={15} color={C.red} />
                  <Text style={[s.statusNoteTxt, { color: C.red }]}>{agent?.rejectionReason || "Application rejected — contact support"}</Text>
                </View>
              )}

              {/* Getting started timeline */}
              <View style={[s.glass, s.cardShadow, s.timelineCard]}>
                <SectionHeading kicker="Journey" title="Getting started" inset />
                {[
                  { n: 1, t: "Complete your profile",   d: "Agency name, GST/PAN, contact info" },
                  { n: 2, t: "Upload KYC documents",    d: "GST certificate, PAN card, address" },
                  { n: 3, t: "Add bank account",         d: "Where you'll receive payouts" },
                  { n: 4, t: "Create your first tour",   d: "Add a tour package once approved" },
                ].map((item, idx, arr) => {
                  const st = steps[item.n - 1];
                  const done = st?.done;
                  const current = st?.current;
                  return (
                    <View key={item.n} style={s.tlRow}>
                      <View style={s.tlLeft}>
                        <View style={[s.tlDot, done && s.tlDotDone, current && s.tlDotActive]}>
                          {done ? <Ionicons name="checkmark" size={13} color="#fff" /> : <Text style={[s.tlNum, current && { color: C.ink }]}>{item.n}</Text>}
                        </View>
                        {idx < arr.length - 1 && <View style={[s.tlLine, done && { backgroundColor: "rgba(28,107,82,0.4)" }]} />}
                      </View>
                      <View style={{ flex: 1, paddingBottom: idx < arr.length - 1 ? 18 : 0 }}>
                        <Text style={s.tlTitle}>{item.t}</Text>
                        <Text style={s.tlDesc}>{item.d}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Quick Actions (bento: big feature + side stack + row of 3) ── */}
          <View style={s.section}>
            <SectionHeading kicker="Toolkit" title="Quick actions"
              right={!isApproved ? <PreviewPill /> : null} />

            {/* Top block: big feature tile + side stack */}
            <View style={{ flexDirection: "row", gap: GAP }}>
              <BentoTile
                big w={BENTO_BIG_W} h={BENTO_BIG_H} grad={G.hero}
                icon={quickActions[0].icon} lib={quickActions[0].lib} label={quickActions[0].label}
                hint="Capture a new enquiry"
                onPress={() => navigation.navigate(quickActions[0].route)}
              />
              <View style={{ width: BENTO_SIDE_W, gap: GAP }}>
                <BentoTile
                  w={BENTO_SIDE_W} h={BENTO_ROW_H}
                  icon={quickActions[1].icon} lib={quickActions[1].lib} label={quickActions[1].label}
                  onPress={() => navigation.navigate(quickActions[1].route)}
                />
                <BentoTile
                  w={BENTO_SIDE_W} h={BENTO_ROW_H} grad={G.gold} goldInk
                  icon={quickActions[2].icon} lib={quickActions[2].lib} label={quickActions[2].label}
                  onPress={() => navigation.navigate(quickActions[2].route)}
                />
              </View>
            </View>

            {/* Bottom row of 4 */}
            <View style={{ flexDirection: "row", gap: GAP, marginTop: GAP }}>
              <BentoTile
                sm w={BENTO_4W} h={rs(92)}
                icon={quickActions[3].icon} lib={quickActions[3].lib} label={quickActions[3].label}
                onPress={() => navigation.navigate(quickActions[3].route)}
              />
              <BentoTile
                sm w={BENTO_4W} h={rs(92)} grad={G.ocean}
                icon={quickActions[4].icon} lib={quickActions[4].lib} label={quickActions[4].label}
                onPress={() => navigation.navigate(quickActions[4].route)}
              />
              <BentoTile
                sm w={BENTO_4W} h={rs(92)}
                icon={quickActions[5].icon} lib={quickActions[5].lib} label={quickActions[5].label}
                onPress={() => navigation.navigate(quickActions[5].route)}
              />
              <BentoTile
                sm w={BENTO_4W} h={rs(92)} grad={G.emerald}
                icon={quickActions[6].icon} lib={quickActions[6].lib} label={quickActions[6].label}
                onPress={() => navigation.navigate(quickActions[6].route)}
              />
            </View>
          </View>

          {/* ── Your Listings (approved) ── */}
          {isApproved && (
            <View style={s.section}>
              <SectionHeading kicker="Operate" title="Your listings"
                right={<Text style={s.countPill}>{listings.length} types</Text>} />
              <View style={s.grid2}>
                {listings.map((svc, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.cardShadow, s.svcCard, { backgroundColor: "#FFFFFF", borderColor: C.border, borderWidth: 1 }]}
                    onPress={() => svc.params ? navigation.navigate(svc.route, svc.params) : navigation.navigate(svc.route)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={svc.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.svcIcon}>
                      <Ionicons name={svc.icon} size={20} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.svcName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{svc.name}</Text>
                      <Text style={s.svcCount} numberOfLines={1}>{svc.count} total</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Management (Lovable rhythm: wide analytics + compact modules) ── */}
          <View style={s.section}>
            <SectionHeading kicker="Operate" title="Management"
              right={!isApproved ? <PreviewPill /> : null} />

            {/* Pipeline — premium analytic card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("TAPipeline")}
              style={[s.glass, s.cardShadow, s.pipelineCard]}
            >
              <View style={s.pipelineHead}>
                <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pipelineIcon}>
                  <Ionicons name="git-network" size={18} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.moduleKicker}>PIPELINE</Text>
                  <View style={s.pipelineValRow}>
                    <Text style={s.pipelineBig}>{leads.total ?? 0}</Text>
                    <Text style={s.pipelineUnit}>opportunities</Text>
                  </View>
                </View>
                <View style={s.convChip}>
                  <Text style={s.convVal}>{leads.total ? Math.round((leads.booked || 0) / leads.total * 100) : 0}%</Text>
                  <Text style={s.convLbl}>WON</Text>
                </View>
              </View>
              <PipelineBar leads={leads} />
              <View style={s.pipelineLegend}>
                {[
                  { l: "New", c: C.emerald, v: leads.new ?? 0 },
                  { l: "Hot", c: C.gold, v: leads.hot ?? 0 },
                  { l: "Booked", c: C.ocean, v: leads.booked ?? 0 },
                  { l: "Lost", c: "#B8B0A0", v: leads.lost ?? 0 },
                ].map((it, i) => (
                  <View key={i} style={s.legendItem}>
                    <View style={s.legendTop}>
                      <View style={[s.legendDot, { backgroundColor: it.c }]} />
                      <Text style={s.legendLabel}>{it.l}</Text>
                    </View>
                    <Text style={s.legendVal}>{it.v}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            {/* Payments — premium deep-gradient card with gold accent */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("TAPayments")}
              style={[s.cardShadow, { marginTop: GAP }]}
            >
              <LinearGradient colors={[C.forest, C.emeraldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.payCard}>
                <View style={s.payOrb} />
                <View style={s.payGlow} />
                <View style={s.payTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.payKicker}>TOTAL PAYMENTS</Text>
                    <Text style={s.payAmt}>
                      {fmt(Number(earnings?.summary?.collectedRevenue || 0) + Number(earnings?.summary?.pendingRevenue || 0))}
                    </Text>
                    <Text style={s.paySubLbl}>Collected + pending · this period</Text>
                  </View>
                </View>
                <View style={s.payStrip}>
                  {[
                    { l: "Collected",  v: fmt(earnings?.summary?.collectedRevenue || 0), c: "#7CE0B8" },
                    { l: "Pending",    v: fmt(earnings?.summary?.pendingRevenue || 0),   c: C.goldLight },
                    { l: "This month", v: fmt(monthRevenue),                              c: "rgba(255,255,255,0.85)" },
                  ].map((m, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={s.payDivider} />}
                      <View style={s.payCell}>
                        <View style={s.payCellTop}>
                          <View style={[s.payCellDot, { backgroundColor: m.c }]} />
                          <Text style={s.payCellLbl}>{m.l}</Text>
                        </View>
                        <Text style={s.payCellVal}>{m.v}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Compact modules — all accent-toned tiles in one grid */}
            <View style={[s.grid2, { marginTop: GAP }]}>
              {compactModules.map((m, i) => (
                <CompactTile
                  key={i}
                  m={m}
                  index={i}
                  onPress={() => m.params ? navigation.navigate(m.route, m.params) : navigation.navigate(m.route)}
                />
              ))}
            </View>
          </View>

          {/* ── Community ── */}
          <View style={s.section}>
            <SectionHeading kicker="Community" title="Stay in the loop"
              right={!isApproved ? <PreviewPill /> : null} />
            <View style={{ gap: GAP }}>
              {/* Social Feed — white card with decorative bubbles (no colour block) */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("TASocialFeed")} style={[s.cardShadow, s.commCardW]}>
                <View style={s.commOrb} />
                <View style={s.commGlow} />
                <LinearGradient colors={G.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.commIcon}>
                  <Ionicons name="newspaper" size={22} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.commTitleLight}>Social Feed</Text>
                  <Text style={s.commSubLight} numberOfLines={1}>Community posts & updates</Text>
                </View>
                <View style={s.commArrowGold}>
                  <Ionicons name="arrow-forward" size={16} color="#9A6B16" />
                </View>
              </TouchableOpacity>

              {/* Messages — clean white card with decorative bubbles */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("TASocialMessages")} style={[s.cardShadow, s.commCardLight]}>
                <View style={s.commOrbBlue} />
                <View style={s.commGlowBlue} />
                <View>
                  <LinearGradient colors={G.ocean} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.commIcon}>
                    <Ionicons name="chatbubbles" size={22} color="#fff" />
                  </LinearGradient>
                  {socialUnread > 0 && (
                    <View style={s.commBadge}>
                      <Text style={s.commBadgeTxt}>{socialUnread > 99 ? "99+" : socialUnread}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.commTitleLight}>Messages</Text>
                  <Text style={s.commSubLight} numberOfLines={1}>
                    {socialUnread > 0
                      ? `${socialUnread} unread message${socialUnread > 1 ? "s" : ""}`
                      : "Chat with vendors & partners"}
                  </Text>
                </View>
                <View style={s.commArrowLight}>
                  <Ionicons name="arrow-forward" size={16} color={C.ocean} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

/* ───────── Circular progress ring ───────── */
function Ring({ pct, size = 116, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.emerald} />
          <Stop offset="0.6" stopColor={C.ocean} />
          <Stop offset="1" stopColor={C.gold} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(20,56,46,0.08)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#ring)" strokeWidth={stroke} strokeLinecap="round" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

/* ───────── Sparkline (real data-driven) ───────── */
// `data` = array of numbers (e.g. last-6-months revenue). Draws the real shape;
// falls back to an honest flat baseline when there's no revenue yet.
function Sparkline({ color = "#fff", data }) {
  const VW = 120, VH = 32, padY = 4;
  const vals = Array.isArray(data) ? data.map((n) => Number(n) || 0) : [];
  const hasShape = vals.length > 1 && Math.max(...vals) > 0;
  let line, area = null;
  if (hasShape) {
    const max = Math.max(...vals);
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const x = (i / (n - 1)) * VW;
      const y = VH - padY - (v / max) * (VH - padY * 2);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    line = "M" + pts.join(" L");
    area = `${line} L${VW} ${VH} L0 ${VH} Z`;
  } else {
    const y = VH - padY;
    line = `M0 ${y} L${VW} ${y}`;
  }
  return (
    <Svg width="100%" height={34} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient id="sl" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      {area && <Path d={area} fill="url(#sl)" />}
      <Path d={line} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ───────── Shared ───────── */
function SectionHeading({ kicker, title, right, inset }) {
  return (
    <View style={[s.headRow, inset && { marginBottom: rs(14) }]}>
      <View>
        <Text style={s.headRowKicker}>{kicker?.toUpperCase()}</Text>
        <Text style={s.headRowTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function PreviewPill() {
  return (
    <View style={s.previewPill}>
      <Ionicons name="eye-outline" size={11} color={C.orange} />
      <Text style={s.previewPillTxt}>Preview</Text>
    </View>
  );
}

// Bento tile — gradient-filled (accent) or white glass, circular icon chip
// top-left, serif label bottom-left (+ optional hint on the big feature tile).
function BentoTile({ w, h, grad, goldInk, icon, lib = "ion", label, hint, big, sm, onPress }) {
  const onGrad = !!grad;
  const fg = onGrad ? (goldInk ? C.ink : "#fff") : C.text;
  const chipBg = onGrad ? (goldInk ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)") : "rgba(28,107,82,0.09)";
  const iconColor = onGrad ? (goldInk ? C.ink : "#fff") : C.emeraldDeep;
  const labelStyle = big ? s.bentoLabelBig : sm ? s.bentoLabelSm : s.bentoLabel;
  const body = { width: w, height: h };
  const inner = (
    <>
      <View style={[s.bentoChip, big && s.bentoChipBig, { backgroundColor: chipBg }]}>
        <Ico lib={lib} name={icon} size={big ? rf(24) : rf(19)} color={iconColor} />
      </View>
      <View>
        <Text style={[labelStyle, sm && { textAlign: "center" }, { color: fg }]} numberOfLines={big ? 1 : 2}>
          {label}
        </Text>
        {hint && (
          <Text style={[s.bentoHint, { color: onGrad ? "rgba(255,255,255,0.78)" : C.muted }]} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </>
  );
  if (onGrad) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[s.cardShadow, body]}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.bentoTile, sm && s.bentoTileSm, body]}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[s.cardShadow, s.bentoTile, s.bentoGlass, sm && s.bentoTileSm, body]}>
      {inner}
    </TouchableOpacity>
  );
}

// KPI card — Business snapshot bento (glass / emerald / sand / ocean)
function KpiCard({ w, label, value, delta, icon, lib = "ion", variant = "glass", spark, sparkData, chip, onPress }) {
  const grad = variant === "emerald" ? G.emerald : variant === "ocean" ? G.ocean : null;
  const sand = variant === "sand";
  const dark = !!grad;
  const fg = dark ? "#fff" : C.text;
  const iconColor = dark ? "#fff" : C.emeraldDeep;
  const iconBg = dark ? "rgba(255,255,255,0.16)" : "rgba(28,107,82,0.1)";
  const subColor = dark ? "rgba(255,255,255,0.7)" : C.sub;
  const chipTone = chip ? TONES[chip] : null;
  const inner = (
    <>
      {spark && <View style={s.kpiRevOrb} />}
      <View style={s.kpiTop}>
        {chipTone ? (
          <LinearGradient colors={chipTone.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.kpiIconChip}>
            <Ico lib={lib} name={icon} size={16} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[s.kpiIconChip, { backgroundColor: iconBg }]}>
            <Ico lib={lib} name={icon} size={16} color={iconColor} />
          </View>
        )}
        {delta ? (
          <View style={[s.kpiDelta, { backgroundColor: dark ? "rgba(255,255,255,0.18)" : "rgba(28,107,82,0.1)" }]}>
            <Text style={[s.kpiDeltaTxt, { color: dark ? "#fff" : C.emeraldDeep }]}>{delta}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[s.kpiLabel, { color: subColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{label}</Text>
      <Text style={[spark ? s.kpiValueBig : s.kpiValue, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
        {value}
      </Text>
      {spark && <View style={{ marginTop: rs(8) }}><Sparkline color="rgba(255,255,255,0.9)" data={sparkData} /></View>}
    </>
  );
  if (grad) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[s.cardShadow, { width: w }]}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.kpiCard, { width: w }]}>{inner}</LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      activeOpacity={0.9} onPress={onPress}
      style={[s.cardShadow, s.kpiCard, { width: w, backgroundColor: sand ? C.sand : "#FFFFFF", borderWidth: 1, borderColor: C.border }]}
    >
      {inner}
    </TouchableOpacity>
  );
}

// Collection ring — the headline of "Business snapshot".
// A donut of how much of this month's revenue has actually been collected,
// a Received/Pending legend, and a tappable counts strip underneath. Each
// region routes to the screen that owns that number.
function CollectionRingCard({
  pct, collected, total, pending, delta, positive,
  bookings, leads, dueToday,
  onPressRing, onPressGrowth, onPressBookings, onPressLeads, onPressDue,
}) {
  return (
    <View style={[s.glass, s.cardShadow, s.crCard]}>
      {/* Two softly breathing bubbles, same emerald+gold pairing (and the same
          AnimatedOrb) the hero uses — the card surface itself stays white. */}
      <AnimatedOrb style={s.crOrb} delay={0} dx={12} dy={10} />
      <AnimatedOrb style={s.crOrb2} delay={1400} dx={-10} dy={-8} />

      <TouchableOpacity activeOpacity={0.85} onPress={onPressRing} style={s.crTop}>
        <View style={s.ringWrap}>
          <Ring pct={pct} />
          <View style={s.ringCenter}>
            <Text style={s.ringPct}>{pct}</Text>
            <Text style={s.ringPctLbl}>PERCENT</Text>
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.crHeadRow}>
            <Text style={s.ringKicker}>COLLECTION</Text>
            {delta ? (
              <TouchableOpacity onPress={onPressGrowth} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <View style={[s.crDelta, { backgroundColor: positive ? "rgba(28,107,82,0.1)" : "rgba(192,69,59,0.1)" }]}>
                  <Ionicons
                    name={positive ? "trending-up" : "trending-down"}
                    size={rs(11)}
                    color={positive ? C.emeraldDeep : C.red}
                  />
                  <Text style={[s.crDeltaTxt, { color: positive ? C.emeraldDeep : C.red }]}>{delta}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={s.crAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {collected}
          </Text>
          <Text style={s.crOf} numberOfLines={1}>of {total} billed</Text>

          <View style={s.crLegend}>
            <View style={s.crLegendRow}>
              <View style={[s.crDot, { backgroundColor: C.emerald }]} />
              <Text style={s.crLegendLbl}>Received</Text>
              <Text style={s.crLegendVal} numberOfLines={1}>{collected}</Text>
            </View>
            <View style={s.crLegendRow}>
              <View style={[s.crDot, { backgroundColor: C.gold }]} />
              <Text style={s.crLegendLbl}>Pending</Text>
              <Text style={s.crLegendVal} numberOfLines={1}>{pending}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={s.crRule} />

      <View style={s.crStrip}>
        <TouchableOpacity style={s.crStat} activeOpacity={0.7} onPress={onPressBookings}>
          <Text style={s.crStatV} numberOfLines={1}>{bookings}</Text>
          <Text style={s.crStatL} numberOfLines={1}>Bookings</Text>
        </TouchableOpacity>
        <View style={s.crStripDiv} />
        <TouchableOpacity style={s.crStat} activeOpacity={0.7} onPress={onPressLeads}>
          <Text style={s.crStatV} numberOfLines={1}>{leads}</Text>
          <Text style={s.crStatL} numberOfLines={1}>Leads</Text>
        </TouchableOpacity>
        <View style={s.crStripDiv} />
        <TouchableOpacity style={s.crStat} activeOpacity={0.7} onPress={onPressDue}>
          <Text style={s.crStatV} numberOfLines={1}>{dueToday}</Text>
          <Text style={s.crStatL} numberOfLines={1}>Due today</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Priority card — Action center (horizontal snap)
function PriorityCard({ tone, icon, title, desc, onPress }) {
  const grad = tone === "gold" ? G.gold : tone === "ocean" ? G.ocean : G.emerald;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.glass, s.cardShadow, s.priorityCard]}>
      <View style={s.priorityBar}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </View>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.priorityIcon}>
        <Ionicons name={icon} size={20} color="#fff" />
      </LinearGradient>
      <Text style={s.priorityTitle}>{title}</Text>
      <Text style={s.priorityDesc}>{desc}</Text>
      <View style={s.priorityCta}>
        <Text style={s.priorityCtaTxt}>Resolve now</Text>
        <Ionicons name="arrow-forward" size={13} color={C.emeraldDeep} />
      </View>
    </TouchableOpacity>
  );
}

// Pipeline segmented bar — real lead-stage data (new / hot / booked / lost)
function PipelineBar({ leads }) {
  const segs = [
    { v: Number(leads.new ?? 0),    c: G.emerald },
    { v: Number(leads.hot ?? 0),    c: G.gold },
    { v: Number(leads.booked ?? 0), c: G.ocean },
    { v: Number(leads.lost ?? 0),   c: ["#C9C2B4", "#B8B0A0"] },
  ];
  const total = segs.reduce((a, b) => a + b.v, 0);
  if (!total) return <View style={[s.pipelineBar, { backgroundColor: C.sand, borderRadius: rs(4) }]} />;
  return (
    <View style={s.pipelineBar}>
      {segs.map((sg, i) => sg.v > 0 ? (
        <LinearGradient key={i} colors={sg.c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flex: sg.v / total, height: rs(8), borderRadius: rs(4), marginRight: i < 3 ? 3 : 0 }} />
      ) : null)}
    </View>
  );
}

/* ───────── Styles ───────── */
const s = StyleSheet.create({
  // Card + shadow primitives. NOTE: solid (not translucent) background — Android
  // `elevation` needs an opaque bg or it renders a hard-edged shadow rectangle.
  glass: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
  },
  cardShadow: {
    shadowColor: "#0B3327",
    shadowOffset: { width: rs(0), height: rs(14) },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },

  // ── Hero ──
  hero: { paddingHorizontal: GUT, paddingBottom: rs(46), borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: "hidden" },
  orb1: { position: "absolute", top: -60, left: -30, width: rs(170), height: rs(170), borderRadius: rs(85), backgroundColor: "rgba(255,255,255,0.08)" },
  orb2: { position: "absolute", bottom: -55, right: -10, width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: "rgba(221,163,63,0.16)" },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: rs(10) },
  greetChip: {
    flexDirection: "row", alignItems: "center", gap: rs(6),
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: rs(12), paddingVertical: rs(7), borderRadius: rs(20),
  },
  greetChipTxt: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.9)", fontSize: rf(12), fontWeight: "600", letterSpacing: 0.3 },
  iconChip: {
    width: rs(40), height: rs(40), borderRadius: rs(15),
    backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  bellDot: {
    position: "absolute", top: -3, right: -3, minWidth: 16, height: rs(16), paddingHorizontal: rs(3), borderRadius: rs(8),
    backgroundColor: C.gold, borderWidth: 1.5, borderColor: C.forestDark, alignItems: "center", justifyContent: "center",
  },
  bellDotTxt: { fontFamily: DISPLAY, fontSize: rf(8), fontWeight: "bold", color: C.ink },

  headline: { flex: 1, marginRight: rs(12) },
  headKicker: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.55)", fontSize: rf(11), fontWeight: "bold", letterSpacing: 3 },
  headName: { color: "#fff", fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "500", letterSpacing: -0.4, marginTop: rs(0), lineHeight: rf(22) },
  idChip: { flexDirection: "row", alignItems: "center", gap: rs(5), alignSelf: "flex-start", marginTop: rs(7), backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(20) },
  idChipTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: "#fff", letterSpacing: 1 },

  // ── Revenue card (a distinct glass card inside the hero) ──
  heroRev: {
    marginTop: rs(16),
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    borderRadius: rs(22), padding: rs(16), overflow: "hidden",
  },
  heroRevTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroRevIcon: {
    width: rs(42), height: rs(42), borderRadius: rs(15),
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroRevDelta: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: rs(11), paddingVertical: rs(6), borderRadius: rs(20),
  },
  heroRevDeltaTxt: { fontFamily: DISPLAY, color: "#fff", fontSize: rf(12), fontWeight: "bold" },
  heroRevLbl: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.66)", fontSize: rf(11), fontWeight: "bold", letterSpacing: 1.4, marginTop: rs(14) },
  heroRevAmt: { color: "#fff", fontFamily: DISPLAY, fontSize: rf(37), fontWeight: "500", letterSpacing: -1, marginTop: rs(3) },
  heroRevSpark: { marginTop: rs(10), marginHorizontal: -rs(16), marginBottom: -rs(16) },

  // ── Body ──
  body: { paddingHorizontal: GUT, marginTop: rs(-22), gap: rs(16) },

  // ── Earnings card ──
  earnCard: { borderRadius: rs(28), padding: rs(20), overflow: "hidden" },
  earnOrb: { position: "absolute", top: -40, right: -30, width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: "rgba(255,255,255,0.08)" },
  earnTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  earnLbl: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.6)", fontSize: rf(11), fontWeight: "bold", letterSpacing: 1.6 },
  earnAmt: { color: "#fff", fontFamily: DISPLAY, fontSize: rf(40), fontWeight: "500", letterSpacing: -1, marginTop: rs(4) },
  growthPill: { flexDirection: "row", alignItems: "center", gap: rs(4), paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: rs(20) },
  growthTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold" },
  sparkWrap: { marginTop: rs(10), marginBottom: rs(14) },
  miniStrip: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.14)", borderRadius: rs(16), paddingVertical: rs(12) },
  miniCell: { flex: 1, alignItems: "center" },
  miniVal: { color: "#fff", fontFamily: DISPLAY, fontSize: rf(16), fontWeight: "600" },
  miniLbl: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.55)", fontSize: rf(10), fontWeight: "600", marginTop: rs(3) },

  // ── KPI bento ──
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  kpiTile: { width: COL2, borderRadius: rs(24), padding: rs(16) },
  kpiTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
  kpiIcon: { width: rs(34), height: rs(34), borderRadius: rs(12), backgroundColor: "rgba(28,107,82,0.1)", alignItems: "center", justifyContent: "center" },
  hotDot: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: C.gold },
  kpiVal: { fontFamily: DISPLAY, fontSize: rf(30), fontWeight: "500", color: C.text, letterSpacing: -0.5, marginTop: rs(10) },
  kpiLbl: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "600", color: C.sub, marginTop: rs(2), textTransform: "uppercase", letterSpacing: 0.4 },

  // ── Onboarding ring card ──
  ringCard: { borderRadius: rs(28), padding: rs(20) },
  ringRow: { flexDirection: "row", alignItems: "center", gap: rs(16) },
  ringWrap: { width: rs(116), height: rs(116), alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ringPct: { fontFamily: DISPLAY, fontSize: rf(32), fontWeight: "500", color: C.text, letterSpacing: -1 },
  ringPctLbl: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold", color: C.muted, letterSpacing: 2, marginTop: rs(-2) },
  ringKicker: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 2 },
  ringTitle: { fontFamily: DISPLAY, fontSize: rf(20), fontWeight: "500", color: C.text, marginTop: rs(4), lineHeight: rf(25) },
  ringMeta: { flexDirection: "row", alignItems: "center", gap: rs(6), marginTop: rs(10) },
  ringMetaTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, fontWeight: "500" },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: rs(18), paddingHorizontal: rs(20), paddingVertical: rs(15), marginTop: rs(18) },
  continueTxt: { fontFamily: DISPLAY, color: "#fff", fontSize: rf(15), fontWeight: "bold" },

  // ── Alerts ──
  alert: { flexDirection: "row", alignItems: "center", gap: rs(12), borderRadius: rs(20), paddingHorizontal: rs(16), paddingVertical: rs(14) },
  alertIcon: { width: rs(36), height: rs(36), borderRadius: rs(12), alignItems: "center", justifyContent: "center" },
  alertTitle: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: "bold" },
  alertSub: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub, fontWeight: "600", marginTop: rs(2) },

  // ── Sections ──
  section: { marginTop: rs(6) },
  headRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: rs(16) },
  headRowKicker: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 2.5 },
  headRowTitle: { fontFamily: DISPLAY, fontSize: rf(24), fontWeight: "400", color: C.text, marginTop: rs(3), letterSpacing: -0.3 },
  countPill: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "bold", color: C.emeraldDeep, backgroundColor: "rgba(28,107,82,0.1)", paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(20), overflow: "hidden" },
  previewPill: { flexDirection: "row", alignItems: "center", gap: rs(3), backgroundColor: C.orangeL, borderWidth: 1, borderColor: "#F0D9BC", paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20) },
  previewPillTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: C.orange, letterSpacing: 0.3 },
  livePill: { flexDirection: "row", alignItems: "center", gap: rs(5), backgroundColor: C.redL, borderWidth: 1, borderColor: "#F3CFCB", paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20) },
  liveDot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: C.red },
  livePillTxt: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: C.red },

  // ── Recent leads ──
  leadCard: { borderRadius: rs(22), padding: rs(15) },
  leadTop: { flexDirection: "row", alignItems: "center", gap: rs(12) },
  leadAvatar: { width: rs(44), height: rs(44), borderRadius: rs(15), backgroundColor: "rgba(28,107,82,0.1)", alignItems: "center", justifyContent: "center" },
  leadAvatarTxt: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: C.emeraldDeep },
  leadName: { fontFamily: DISPLAY, fontSize: rf(14.5), fontWeight: "bold", color: C.text },
  leadSub: { fontFamily: DISPLAY, fontSize: rf(12), color: C.sub, marginTop: rs(2) },
  leadAgo: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: "600" },
  leadBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: rs(13), paddingTop: rs(13), borderTopWidth: 1, borderTopColor: C.border },
  leadContact: { fontFamily: DISPLAY, flex: 1, fontSize: rf(12.5), fontWeight: "600", color: C.sub },
  leadBtn: { flexDirection: "row", alignItems: "center", gap: rs(6), backgroundColor: C.emeraldDeep, paddingHorizontal: rs(16), paddingVertical: rs(9), borderRadius: rs(14) },
  leadBtnTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: "#fff" },
  viewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(6), marginTop: rs(14), paddingVertical: rs(13), borderRadius: rs(16), backgroundColor: "rgba(28,107,82,0.07)" },
  viewAllTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.emeraldDeep },

  // ── Pending grid ──
  pendGrid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  pendCard: { width: COL2, borderRadius: rs(22), padding: rs(16) },
  pendIcon: { width: rs(40), height: rs(40), borderRadius: rs(14), alignItems: "center", justifyContent: "center", marginBottom: rs(12) },
  pendName: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.text, marginBottom: rs(3) },
  pendDesc: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted },
  pendDone: { position: "absolute", top: 12, right: 12, width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: "rgba(28,107,82,0.12)", alignItems: "center", justifyContent: "center" },

  // Complete-setup action rows (distinct from grids)
  setupRow: { flexDirection: "row", alignItems: "center", gap: rs(12), borderRadius: rs(18), paddingVertical: rs(11), paddingLeft: rs(20), paddingRight: rs(14), overflow: "hidden" },
  setupAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: rs(5) },
  setupIcon: { width: rs(34), height: rs(34), borderRadius: rs(11), alignItems: "center", justifyContent: "center" },
  setupName: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: "600", color: C.text },
  setupDesc: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.muted, marginTop: rs(4) },
  setupStepInline: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 0.2 },
  setupDone: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: C.emeraldDeep, alignItems: "center", justifyContent: "center" },
  setupStart: { flexDirection: "row", alignItems: "center", gap: rs(5), backgroundColor: "rgba(28,107,82,0.1)", paddingHorizontal: rs(13), paddingVertical: rs(9), borderRadius: rs(20) },
  setupStartTxt: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.emeraldDeep },
  statusNote: { flexDirection: "row", alignItems: "center", gap: rs(9), borderRadius: rs(16), borderWidth: 1, padding: rs(13), marginTop: rs(14) },
  statusNoteTxt: { fontFamily: DISPLAY, flex: 1, fontSize: rf(12.5), fontWeight: "600" },

  // ── Timeline ──
  timelineCard: { borderRadius: rs(28), padding: rs(20), marginTop: rs(16) },
  tlRow: { flexDirection: "row", gap: rs(14) },
  tlLeft: { alignItems: "center", width: rs(32) },
  tlDot: { width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: C.sand, alignItems: "center", justifyContent: "center" },
  tlDotDone: { backgroundColor: C.emeraldDeep },
  tlDotActive: { backgroundColor: C.gold },
  tlNum: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: C.muted },
  tlLine: { flex: 1, width: rs(1.5), backgroundColor: C.border, marginTop: rs(2) },
  tlTitle: { fontFamily: DISPLAY, fontSize: rf(15.5), fontWeight: "500", color: C.text },
  tlDesc: { fontFamily: DISPLAY, fontSize: rf(12), color: C.muted, marginTop: rs(2) },

  // ── Quick actions (bento) ──
  bentoTile: { borderRadius: rs(22), padding: rs(12), justifyContent: "space-between", overflow: "hidden" },
  bentoTileSm: { alignItems: "center", justifyContent: "center", gap: rs(7), padding: rs(9) },
  bentoGlass: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.border },
  bentoChip: { width: rs(36), height: rs(36), borderRadius: rs(18), alignItems: "center", justifyContent: "center" },
  bentoChipBig: { width: rs(46), height: rs(46), borderRadius: rs(23) },
  bentoLabel: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "600" },
  bentoLabelSm: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "600" },
  bentoLabelBig: { fontFamily: DISPLAY, fontSize: rf(21), fontWeight: "600", letterSpacing: -0.3 },
  bentoHint: { fontFamily: DISPLAY, fontSize: rf(11.5), marginTop: rs(2), fontWeight: "500" },

  // ── 2-col grids (listings / manage) ──
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  svcCard: { width: COL2, borderRadius: rs(22), padding: rs(12), flexDirection: "row", alignItems: "center", gap: rs(10) },
  svcIcon: { width: rs(38), height: rs(38), borderRadius: rs(13), alignItems: "center", justifyContent: "center" },
  svcName: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.text },
  svcCount: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, marginTop: rs(2) },

  manageCard: { width: COL2, borderRadius: rs(22), padding: rs(16) },
  manageIcon: { width: rs(42), height: rs(42), borderRadius: rs(14), alignItems: "center", justifyContent: "center", marginBottom: rs(12) },
  manageLabel: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.text, marginBottom: rs(2) },
  manageSub: { fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted, lineHeight: rf(14) },
  manageArrow: { position: "absolute", bottom: 14, right: 14 },
  manageBadge: { position: "absolute", top: 14, right: 14, minWidth: 22, height: rs(22), paddingHorizontal: rs(6), borderRadius: rs(11), backgroundColor: C.emeraldDeep, alignItems: "center", justifyContent: "center" },
  manageBadgeTxt: { fontFamily: DISPLAY, color: "#fff", fontSize: rf(10), fontWeight: "bold" },

  // ── KPI / Business snapshot ──
  kpiCard: { borderRadius: rs(24), padding: rs(16), overflow: "hidden" },
  kpiIconChip: { width: rs(34), height: rs(34), borderRadius: rs(12), alignItems: "center", justifyContent: "center" },
  kpiDelta: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20) },
  kpiDeltaTxt: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold" },
  kpiLabel: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "600", marginTop: rs(12), textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontFamily: DISPLAY, fontSize: rf(22), fontWeight: "500", letterSpacing: -0.5, marginTop: rs(3) },
  kpiValueBig: { fontFamily: DISPLAY, fontSize: rf(38), fontWeight: "500", letterSpacing: -1, marginTop: rs(3) },
  kpiRevOrb: { position: "absolute", top: -40, right: -30, width: rs(150), height: rs(150), borderRadius: rs(75), backgroundColor: "rgba(255,255,255,0.08)" },

  // Collection ring card (Business snapshot headline)
  // overflow:hidden clips the bubble to the card's rounded corners
  crCard: { borderRadius: rs(28), padding: rs(18), overflow: "hidden" },
  // Echo the hero's orb pair (s.orb1 emerald / s.orb2 gold) at card scale.
  crOrb: {
    position: "absolute", top: -rs(45), right: -rs(35),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: "rgba(46,158,120,0.10)",
  },
  crOrb2: {
    position: "absolute", bottom: -rs(38), left: -rs(30),
    width: rs(120), height: rs(120), borderRadius: rs(60),
    backgroundColor: "rgba(221,163,63,0.10)",
  },
  crTop: { flexDirection: "row", alignItems: "center", gap: rs(16) },
  crHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: rs(8) },
  crDelta: {
    flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20),
  },
  crDeltaTxt: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold" },
  crAmount: {
    fontFamily: DISPLAY, fontSize: rf(26), fontWeight: "500",
    color: C.text, letterSpacing: -0.6, marginTop: rs(4),
  },
  crOf: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: "bold", marginTop: rs(1) },
  crLegend: { marginTop: rs(10), gap: rs(5) },
  crLegendRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  crDot: { width: rs(7), height: rs(7), borderRadius: rs(4) },
  crLegendLbl: { fontFamily: DISPLAY, flex: 1, fontSize: rf(11), color: C.sub, fontWeight: "bold" },
  crLegendVal: { fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.text },
  crRule: { height: 1, backgroundColor: C.border, marginVertical: rs(16) },
  crStrip: { flexDirection: "row", alignItems: "center" },
  crStat: { flex: 1, alignItems: "center", minWidth: 0 },
  crStatV: { fontFamily: DISPLAY, fontSize: rf(22), fontWeight: "500", color: C.text, letterSpacing: -0.5 },
  crStatL: {
    fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "600", color: C.sub,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: rs(2),
  },
  crStripDiv: { width: 1, height: rs(28), backgroundColor: C.border },

  // ── Action center (priority cards) ──
  priorityCard: { width: rs(250), borderRadius: rs(24), padding: rs(18), overflow: "hidden" },
  priorityBar: { position: "absolute", top: 0, left: 0, right: 0, height: rs(4) },
  priorityIcon: { width: rs(44), height: rs(44), borderRadius: rs(16), alignItems: "center", justifyContent: "center", marginTop: rs(6), marginBottom: rs(14) },
  priorityTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "600", color: C.text, lineHeight: rf(21) },
  priorityDesc: { fontFamily: DISPLAY, fontSize: rf(12.5), color: C.sub, marginTop: rs(4) },
  priorityCta: { flexDirection: "row", alignItems: "center", gap: rs(6), marginTop: rs(14) },
  priorityCtaTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold", color: C.emeraldDeep },

  // ── Management: pipeline wide ──
  pipelineCard: { borderRadius: rs(22), padding: rs(11) },
  moduleKicker: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 1.8 },
  pipelineValRow: { flexDirection: "row", alignItems: "flex-end", gap: rs(6), marginTop: rs(3) },
  pipelineBig: { fontFamily: DISPLAY, fontSize: rf(24), fontWeight: "600", color: C.text, letterSpacing: -0.6 },
  pipelineUnit: { fontFamily: DISPLAY, fontSize: rf(12), color: C.sub, fontWeight: "600", marginBottom: rs(3) },
  pipelineBar: { flexDirection: "row", marginTop: rs(9), height: rs(8), alignItems: "center" },
  pipelineLegend: { flexDirection: "row", marginTop: rs(9), paddingTop: rs(9), borderTopWidth: 1, borderTopColor: C.border },

  // ── Community rows ──
  // Community cards
  commCardW: { flexDirection: "row", alignItems: "center", gap: rs(13), borderRadius: rs(20), padding: rs(12), backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  commOrb: { position: "absolute", top: -30, right: -24, width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: "rgba(221,163,63,0.09)" },
  commGlow: { position: "absolute", bottom: -50, left: -20, width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: "rgba(221,163,63,0.11)" },
  commIcon: { width: rs(44), height: rs(44), borderRadius: rs(15), alignItems: "center", justifyContent: "center" },
  commArrowGold: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: C.tintGold, alignItems: "center", justifyContent: "center" },
  commCardLight: { flexDirection: "row", alignItems: "center", gap: rs(13), borderRadius: rs(20), padding: rs(12), backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  commOrbBlue: { position: "absolute", top: -30, right: -24, width: rs(120), height: rs(120), borderRadius: rs(60), backgroundColor: "rgba(44,110,140,0.08)" },
  commGlowBlue: { position: "absolute", bottom: -50, left: -20, width: rs(160), height: rs(160), borderRadius: rs(80), backgroundColor: "rgba(44,110,140,0.10)" },
  commTitleLight: { fontFamily: DISPLAY, fontSize: rf(18), fontWeight: "600", color: C.text },
  commSubLight: { fontFamily: DISPLAY, fontSize: rf(12), color: C.muted, marginTop: rs(2), fontWeight: "500" },
  commArrowLight: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: C.tintOcean, alignItems: "center", justifyContent: "center" },
  commBadge: { position: "absolute", top: -6, right: -6, minWidth: 20, height: rs(20), paddingHorizontal: rs(5), borderRadius: rs(10), backgroundColor: C.red, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  commBadgeTxt: { fontFamily: DISPLAY, color: "#fff", fontSize: rf(10), fontWeight: "bold" },

  // ── Management enhanced ──
  pipelineHead: { flexDirection: "row", alignItems: "center", gap: rs(12) },
  pipelineIcon: { width: rs(36), height: rs(36), borderRadius: rs(13), alignItems: "center", justifyContent: "center" },
  convChip: { alignItems: "center", backgroundColor: "#F7EFD8", borderRadius: rs(13), paddingHorizontal: rs(12), paddingVertical: rs(6), borderWidth: 1, borderColor: "rgba(221,163,63,0.35)" },
  convVal: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: "#9A6B16" },
  convLbl: { fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: "bold", color: "#B4894A", letterSpacing: 1, marginTop: rs(-1) },
  legendItem: { flex: 1, alignItems: "center" },
  legendTop: { flexDirection: "row", alignItems: "center", gap: rs(5) },
  legendDot: { width: rs(7), height: rs(7), borderRadius: rs(3.5) },
  legendLabel: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "600", color: C.muted },
  legendVal: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "600", color: C.text, marginTop: rs(3) },

  payCard: { borderRadius: rs(22), paddingVertical: rs(13), paddingHorizontal: rs(16), overflow: "hidden" },
  payOrb: { position: "absolute", top: -34, right: -24, width: rs(130), height: rs(130), borderRadius: rs(65), backgroundColor: "rgba(255,255,255,0.06)" },
  payGlow: { position: "absolute", bottom: -55, left: -25, width: rs(175), height: rs(175), borderRadius: rs(88), backgroundColor: "rgba(221,163,63,0.11)" },
  payTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  payKicker: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold", color: "rgba(255,255,255,0.85)", letterSpacing: 2 },
  payAmt: { fontFamily: DISPLAY, fontSize: rf(27), fontWeight: "600", color: "#fff", letterSpacing: -0.8, marginTop: rs(3) },
  paySubLbl: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: "600", color: "rgba(255,255,255,0.8)", marginTop: rs(4) },
  payStrip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.18)", borderRadius: rs(16), paddingVertical: rs(8), marginTop: rs(10) },
  payDivider: { width: rs(1), height: rs(22), backgroundColor: "rgba(255,255,255,0.12)" },
  payCell: { flex: 1, alignItems: "center" },
  payCellTop: { flexDirection: "row", alignItems: "center", gap: rs(5) },
  payCellDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  payCellLbl: { fontFamily: DISPLAY, fontSize: rf(10), fontWeight: "bold", color: "rgba(255,255,255,0.85)" },
  payCellVal: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: "bold", color: "#fff", marginTop: rs(3) },

  compactCard: { width: COL2, borderRadius: rs(20), padding: rs(11), backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  compactWash: { position: "absolute", top: -30, right: -30, width: rs(96), height: rs(96), borderRadius: rs(48) },
  compactTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  compactIcon: { width: rs(38), height: rs(38), borderRadius: rs(13), alignItems: "center", justifyContent: "center" },
  compactPill: { minWidth: 32, height: rs(26), paddingHorizontal: rs(10), borderRadius: rs(13), alignItems: "center", justifyContent: "center" },
  compactPillTxt: { fontFamily: DISPLAY, fontSize: rf(13), fontWeight: "bold" },
  compactChev: { width: rs(28), height: rs(28), borderRadius: rs(14), alignItems: "center", justifyContent: "center" },
  compactLabel: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: "600", color: C.text, marginTop: rs(8) },
  compactSub: { fontFamily: DISPLAY, fontSize: rf(11.5), color: C.muted, marginTop: rs(2) },
});
