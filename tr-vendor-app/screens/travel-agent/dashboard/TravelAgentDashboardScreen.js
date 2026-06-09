// screens/travel-agent/dashboard/TravelAgentDashboardScreen.js
// REDESIGNED — TA dashboard inspired by the vendor dashboard layout.
//
// Sections (top → bottom):
//  1. Emerald gradient hero (avatar + agency + status pill + bell + dynamic
//     content below: earnings card OR action stats OR onboarding progress)
//  2. Recent Leads (TA equivalent of vendor "New Inquiries")
//  3. Pending Setup (only when not APPROVED)
//  4. Quick Actions (4-per-row circular icons)
//  5. Your Listings (Tours / Properties / Fleet — 2-col grid)
//  6. Manage (Pipeline, Follow-ups, Quote Requests, Earnings — 2-col grid)
//  7. Community (Social Feed + Messages — 2-col grid)
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import {
  getCurrentTravelAgent,
  getTravelAgentProfile,
  updateCachedTravelAgent,
  getTravelAgentDashboard,
  getTravelAgentEarnings,
  getTravelAgentUnreadCount,
  listTravelAgentLeads,
  listTravelAgentBookings,
} from "../../api/travelAgentClient";

const { width: W } = Dimensions.get("window");

// ── Design tokens (mirrors vendor palette, emerald-anchored) ──────
const C = {
  g900: "#022C22", g800: "#065F46", g700: "#047857",
  g600: "#059669", g500: "#10B981", g400: "#34D399",
  g100: "#D1FAE5", g50:  "#ECFDF5",
  bg:     "#F1F5F9",
  card:   "#FFFFFF",
  border: "#E2E8F0",
  text:   "#0F172A",
  sub:    "#475569",
  muted:  "#94A3B8",
  blue:    "#2563EB", blueL:   "#EFF6FF",
  purple:  "#7C3AED", purpleL: "#F5F3FF",
  amber:   "#D97706", amberL:  "#FFFBEB",
  red:     "#DC2626", redL:    "#FEF2F2",
  orange:  "#EA580C", orangeL: "#FFF7ED",
  indigo:  "#4F46E5", indigoL: "#EEF2FF",
  teal:    "#0D9488", tealL:   "#F0FDFA",
  pink:    "#DB2777", pinkL:   "#FDF2F8",
  cyan:    "#0891B2", cyanL:   "#ECFEFF",
};

const STATUS_CFG = {
  APPROVED:          { dot: C.g400,   color: "#fff",     bg: "rgba(52,211,153,0.18)", label: "Verified" },
  PENDING:           { dot: "#FCD34D", color: "#FCD34D", bg: "rgba(252,211,77,0.16)", label: "Pending" },
  DOCUMENTS_PENDING: { dot: "#FCD34D", color: "#FCD34D", bg: "rgba(252,211,77,0.16)", label: "Docs pending" },
  UNDER_REVIEW:      { dot: "#93C5FD", color: "#BFDBFE", bg: "rgba(147,197,253,0.18)", label: "Under review" },
  REJECTED:          { dot: "#FCA5A5", color: "#FECACA", bg: "rgba(252,165,165,0.18)", label: "Rejected" },
  SUSPENDED:         { dot: "#FCA5A5", color: "#FECACA", bg: "rgba(252,165,165,0.18)", label: "Suspended" },
};

// Grid sizing (mirrors vendor — 2-col cards + 4-per-row quick actions)
const CARD_W = (W - 32 - 10) / 2;
const QA_W   = (W - 32 - 18) / 4;

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
  if (h < 12) return "Good morning 👋";
  if (h < 17) return "Good afternoon 👋";
  return "Good evening 👋";
}
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
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
      const [ta, d, e, u, leadsRes, bookingsRes] = await Promise.all([
        fetchAgent(),
        getTravelAgentDashboard().catch(() => null),
        getTravelAgentEarnings("month").catch(() => null),
        getTravelAgentUnreadCount().catch(() => null),
        listTravelAgentLeads({ limit: 4 }).catch(() => null),
        // limit=1 just to fetch the selfBookings array which the endpoint
        // returns un-paginated alongside the manual-bookings page.
        listTravelAgentBookings({ page: 1, limit: 1 }).catch(() => null),
      ]);
      setAgent(ta);
      setDash(d);
      setEarnings(e);
      if (u?.count != null) setUnread(u.count);
      setRecentLeads(leadsRes?.leads || leadsRes?.items || []);
      setSelfBookingsCount((bookingsRes?.selfBookings || []).length);
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
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator size="large" color={C.g600} />
        <Text style={{ color: C.sub, fontWeight: "600" }}>Loading your dashboard…</Text>
      </View>
    );
  }

  const status = agent?.status || "PENDING";
  const isApproved = status === "APPROVED";
  const stCfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  const agencyName = agent?.agencyName || agent?.ownerName || "Travel Agent";

  // Stats from dashboard endpoint
  const leads = dash?.leads || dash?.stats?.leads || {};
  const followUps = dash?.followUps || {};
  const bookings = dash?.bookings || dash?.stats?.bookings || {};
  const tours = dash?.tours || {};
  const properties = dash?.properties || {};
  const fleet = dash?.fleet || {};

  const monthRevenue = earnings?.summary?.totalRevenue ?? bookings.totalAmount ?? 0;
  const trend = earnings?.summary?.trend;
  const growth = Math.round(Math.abs(trend?.deltaPercent || 0));
  const positive = (trend?.deltaPercent ?? 0) >= 0;
  // Earnings card shows only when this-month revenue ≥ ₹10K — otherwise
  // the 4 action-stat cards take its place (user preference).
  const showEarnings = isApproved && Number(monthRevenue) >= 10000;

  // 4 quick "action stat" cards shown in hero (when approved but low rev)
  const headerStats = [
    { icon: "people", value: String(leads.active ?? leads.total ?? 0), label: "Active leads",  route: "TravelAgentDashboard", params: { screen: "TALeads" }, hot: (leads.hot || 0) > 0 },
    { icon: "alarm",  value: String((followUps.overdue || 0) + (followUps.today || 0)), label: "Follow-ups", route: "TAFollowUps", hot: (followUps.overdue || 0) > 0 },
    { icon: "receipt", value: String(bookings.total ?? 0), label: "Bookings", route: "TravelAgentDashboard", params: { screen: "TABookings" } },
    { icon: "map",    value: String(tours.total ?? 0), label: "Tours", route: "TATours" },
  ];

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

  // Pending setup grid (when not approved)
  const pendingActions = [
    { name: "Complete profile", desc: "Agency details & GST",  icon: "person",          color: C.g600,   route: "TAProfile",   done: profileDone },
    { name: "Upload documents", desc: "Address proof (KYC)", icon: "document-text", color: C.amber,  route: "TADocuments", done: docsDone },
    { name: "Add bank account", desc: "Receive payouts",        icon: "card",            color: C.blue,   route: "TABankDetails", done: bankDone },
  ];

  // Quick actions (4 per row; will wrap)
  const quickActions = [
    { label: "Add Lead",     icon: "person-add",     lib: "ion", color: C.blue,    route: "TAAddEditLead" },
    { label: "New Booking",  icon: "calendar",       lib: "ion", color: C.purple,  route: "TAAddEditBooking" },
    { label: "Add Tour",     icon: "map",            lib: "mci", color: C.g600,    route: "TAAddEditTour" },
    { label: "Add Property", icon: "bed",            lib: "ion", color: C.amber,   route: "TAAddEditProperty" },
    { label: "Add Vehicle",  icon: "car-sport",      lib: "ion", color: C.indigo,  route: "TAAddEditFleet" },
    { label: "Capture Link", icon: "link-variant",   lib: "mci", color: C.red,     route: "TAAddEditCaptureLink" },
    { label: "Pipeline",     icon: "git-network",    lib: "ion", color: C.indigo,  route: "TAPipeline" },
    { label: "Post",         icon: "create",         lib: "ion", color: C.pink,    route: "TACreatePost" },
  ];

  // Listings (Your Services equivalent). "Leads" opens the Leads tab, whose
  // own ops bar exposes Add Lead / Pipeline / Follow-Ups / Capture Links /
  // Quote Requests — so the dashboard stays clean.
  const listings = [
    { name: "Leads",      icon: "people",     color: C.indigo,  route: "TravelAgentDashboard", params: { screen: "TALeads" }, count: leads.total ?? leads.active ?? 0 },
    { name: "Tours",      icon: "map",        color: C.g600,    route: "TATours",     count: tours.total ?? 0 },
    { name: "Properties", icon: "bed",        color: C.amber,   route: "TAProperties", count: properties.total ?? 0 },
    { name: "Fleet",      icon: "car-sport",  color: C.blue,    route: "TAFleet",     count: fleet.total ?? 0 },
  ];

  // Manage items (2-col grid). Self-Bookings tile appears only when this TA
  // has placed any customer-side bookings (Personal or Company) — keeps the
  // grid clean for agents who don't book on the customer side.
  const manageItems = [
    { label: "Pipeline",       sub: "Kanban view",       icon: "git-network",    lib: "ion", color: C.indigo, route: "TAPipeline" },
    { label: "Follow-ups",     sub: "Overdue & today",   icon: "alarm",          lib: "ion", color: C.amber,  route: "TAFollowUps" },
    { label: "Quote Requests", sub: "Customer enquiries", icon: "mail-unread",   lib: "ion", color: C.red,    route: "TATourQuoteRequests" },
    { label: "Earnings",       sub: "Revenue & payouts", icon: "trending-up",    lib: "ion", color: C.g600,   route: "TAEarnings" },
    { label: "Payments",       sub: "Transactions",      icon: "card",           lib: "ion", color: C.blue,   route: "TAPayments" },
    { label: "Capture Links",  sub: "Public lead forms", icon: "link",           lib: "ion", color: C.teal,   route: "TACaptureLinks" },
    ...(selfBookingsCount > 0 ? [{
      label: "Self-Bookings",
      sub: `${selfBookingsCount} Personal / Company`,
      icon: "briefcase",
      lib: "ion",
      color: C.indigo,
      route: "TravelAgentDashboard",
      params: { screen: "TABookings" },
      badge: selfBookingsCount,
    }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.g500]}
            tintColor={C.g400}
          />
        }
      >
        {/* ══════════════════ HEADER — Emerald Green ══════════════════ */}
        <LinearGradient
          colors={[C.g900, "#064E3B", C.g700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* Decorative circles */}
          <View style={s.deco1} />
          <View style={s.deco2} />

          <SafeAreaView edges={["top"]}>
            {/* Top bar — avatar + greeting + name + status pill + bell */}
            <View style={s.topBar}>
              <TouchableOpacity
                style={s.topLeft}
                onPress={() => navigation.navigate("TAProfile")}
                activeOpacity={0.85}
              >
                <View style={s.avatar}>
                  {agent?.logo ? null : <Text style={s.avatarTxt}>{initials(agencyName)}</Text>}
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={s.greeting}>{greeting()}</Text>
                  <Text style={s.bizName} numberOfLines={1}>{agencyName}</Text>
                  <View
                    style={[
                      s.statusPill,
                      { backgroundColor: stCfg.bg, borderColor: "rgba(255,255,255,0.25)" },
                    ]}
                  >
                    <View style={[s.statusDot, { backgroundColor: stCfg.dot }]} />
                    <Text style={[s.statusTxt, { color: stCfg.color }]}>{stCfg.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={s.topRight}>
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => navigation.navigate("TANotifications")}
                  activeOpacity={0.75}
                >
                  <Ionicons name="notifications-outline" size={16} color="rgba(255,255,255,0.9)" />
                  {unread > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{unread > 9 ? "9+" : unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Action stats (approved + revenue still ramping) */}
            {isApproved && !showEarnings && (
              <View style={s.statRow}>
                {headerStats.map((st, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.statCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      st.params
                        ? navigation.navigate(st.route, st.params)
                        : navigation.navigate(st.route)
                    }
                  >
                    <View style={s.statTop}>
                      <Ionicons name={st.icon} size={15} color="rgba(255,255,255,0.85)" />
                      {st.hot && <View style={s.statHotDot} />}
                    </View>
                    <Text style={s.statVal}>{st.value}</Text>
                    <Text style={s.statLbl}>{st.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Earnings card (approved + revenue ≥ ₹5K this month) */}
            {showEarnings && (
              <TouchableOpacity
                onPress={() => navigation.navigate("TAEarnings")}
                activeOpacity={0.88}
                style={s.earningsCard}
              >
                <View style={s.earningsTop}>
                  <View>
                    <Text style={s.earningsLbl}>THIS MONTH</Text>
                    <Text style={s.earningsAmt}>{fmt(monthRevenue)}</Text>
                  </View>
                  {!!trend && (
                    <View
                      style={[
                        s.growthPill,
                        {
                          backgroundColor: positive
                            ? "rgba(52,211,153,0.2)"
                            : "rgba(252,165,165,0.2)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={positive ? "trending-up-outline" : "trending-down-outline"}
                        size={13}
                        color={positive ? C.g400 : "#FCA5A5"}
                      />
                      <Text style={[s.growthTxt, { color: positive ? C.g400 : "#FCA5A5" }]}>
                        {growth}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.miniStrip}>
                  {[
                    { v: fmt(earnings?.summary?.collectedRevenue || 0), l: "Collected" },
                    { v: fmt(earnings?.summary?.pendingRevenue || 0),   l: "Pending" },
                    { v: String(bookings.total || 0),                   l: "Bookings" },
                    { v: "Details →", l: "Earnings", accent: true },
                  ].map((m, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={s.vLine} />}
                      <View style={s.miniCell}>
                        <Text style={[s.miniVal, m.accent && { color: C.g400, fontSize: 13 }]}>
                          {m.v}
                        </Text>
                        <Text style={s.miniLbl}>{m.l}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </TouchableOpacity>
            )}

            {/* Progress block (not approved) */}
            {!isApproved && (
              <View style={s.progressBlock}>
                <View style={s.progressHeader}>
                  <Text style={s.progressTitle}>Complete setup to go live</Text>
                  <Text style={s.progressCount}>{doneCount}/{steps.length} done</Text>
                </View>
                <View style={s.progressBarBg}>
                  <View
                    style={[
                      s.progressBarFill,
                      { width: `${(doneCount / steps.length) * 100}%` },
                    ]}
                  />
                </View>
                <View style={s.stepRow}>
                  {steps.map((st, i) => (
                    <React.Fragment key={st.id}>
                      <View
                        style={[
                          s.stepDot,
                          st.done && s.stepDotDone,
                          st.current && s.stepDotActive,
                        ]}
                      >
                        {st.done ? (
                          <Ionicons name="checkmark" size={9} color="#fff" />
                        ) : (
                          <Text style={[s.stepNum, st.current && { color: "#fff" }]}>{st.id}</Text>
                        )}
                      </View>
                      {i < steps.length - 1 && (
                        <View style={[s.stepLine, st.done && { backgroundColor: C.g400 }]} />
                      )}
                    </React.Fragment>
                  ))}
                  <Text style={s.stepCurrent}>
                    {steps.find((st) => st.current)?.name || (doneCount === steps.length ? "All done!" : steps[doneCount]?.name)}
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>

        {/* ══════════ Incomplete-step alert banners ══════════ */}
        {!bankDone && (
          <TouchableOpacity
            style={s.alertBanner}
            onPress={() => navigation.navigate("TABankDetails")}
            activeOpacity={0.85}
          >
            <View style={[s.alertIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="card-outline" size={16} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: C.red }]}>Bank details missing</Text>
              <Text style={s.alertSub}>Add your bank account to receive payouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.red} />
          </TouchableOpacity>
        )}

        {!docsDone && (
          <TouchableOpacity
            style={[s.alertBanner, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}
            onPress={() => navigation.navigate("TADocuments")}
            activeOpacity={0.85}
          >
            <View style={[s.alertIcon, { backgroundColor: "#FFEDD5" }]}>
              <Ionicons name="document-text-outline" size={16} color={C.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.alertTitle, { color: C.orange }]}>Address proof not uploaded</Text>
              <Text style={s.alertSub}>Upload your identity & address documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.orange} />
          </TouchableOpacity>
        )}

        {/* ══════════════════ BODY ══════════════════ */}
        <View style={s.body}>

          {/* ── Recent Leads (TA equivalent of New Inquiries) ── */}
          {isApproved && recentLeads.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recent Leads</Text>
                <View style={s.inqCountPill}>
                  <View style={s.inqLiveDot} />
                  <Text style={s.inqCountTxt}>{recentLeads.length} new</Text>
                </View>
              </View>
              <View style={{ gap: 10 }}>
                {recentLeads.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={s.inqCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("TALeadDetail", {
                        id: l.id,
                        customerName: l.customerName,
                      })
                    }
                  >
                    <View style={s.inqTop}>
                      <View style={[s.inqIconBox, { backgroundColor: C.blue + "14" }]}>
                        <Ionicons name="person" size={20} color={C.blue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.inqTitle} numberOfLines={1}>
                          {l.customerName || "Customer"}
                        </Text>
                        {!!(l.destination || l.tripType) && (
                          <Text style={s.inqSub} numberOfLines={1}>
                            {l.destination || ""}
                            {l.destination && l.tripType ? " · " : ""}
                            {l.tripType ? String(l.tripType).replace("_", " ") : ""}
                          </Text>
                        )}
                      </View>
                      <Text style={s.inqAgo}>{fmtAgo(l.createdAt)}</Text>
                    </View>
                    <View style={s.inqBottom}>
                      <View style={s.inqCustomer}>
                        <View style={s.inqAvatar}>
                          <Text style={s.inqAvatarTxt}>
                            {(l.customerName || "?").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={s.inqCustomerTxt} numberOfLines={1}>
                          {l.customerPhone || l.customerEmail || l.status || "—"}
                        </Text>
                      </View>
                      <View style={[s.inqBtn, { backgroundColor: C.g600 }]}>
                        <Ionicons name="arrow-forward" size={13} color="#fff" />
                        <Text style={s.inqBtnTxt}>Open</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={s.inqViewAll}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })
                }
              >
                <Text style={s.inqViewAllTxt}>View all leads</Text>
                <Ionicons name="arrow-forward" size={13} color={C.g700} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Pending setup ── */}
          {!isApproved && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Complete Setup</Text>
              <View style={s.pendingGrid}>
                {pendingActions.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.pendingCard}
                    onPress={() => navigation.navigate(a.route)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        s.pendingIconBox,
                        { backgroundColor: a.color + "15" },
                      ]}
                    >
                      <Ionicons name={a.icon} size={18} color={a.color} />
                    </View>
                    <Text style={s.pendingName}>{a.name}</Text>
                    <Text style={s.pendingDesc}>{a.desc}</Text>
                    {a.done && (
                      <View style={s.pendingDoneTag}>
                        <Ionicons name="checkmark" size={10} color={C.g700} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {status === "DOCUMENTS_PENDING" && (
                <TouchableOpacity
                  style={[s.alertRow, { backgroundColor: C.amberL, borderColor: "#FDE68A" }]}
                  onPress={() => navigation.navigate("TADocuments")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="warning-outline" size={15} color={C.amber} />
                  <Text style={[s.alertTxt, { color: "#92400E", flex: 1, marginLeft: 9 }]}>
                    Upload documents to continue
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={C.amber} />
                </TouchableOpacity>
              )}
              {status === "UNDER_REVIEW" && (
                <View style={[s.alertRow, { backgroundColor: C.blueL, borderColor: "#BFDBFE" }]}>
                  <Ionicons name="time-outline" size={15} color={C.blue} />
                  <Text style={[s.alertTxt, { color: C.blue, flex: 1, marginLeft: 9 }]}>
                    Under review · 1–2 business days
                  </Text>
                </View>
              )}
              {status === "REJECTED" && (
                <View style={[s.alertRow, { backgroundColor: C.redL, borderColor: "#FECACA" }]}>
                  <Ionicons name="close-circle-outline" size={15} color={C.red} />
                  <Text style={[s.alertTxt, { color: C.red, flex: 1, marginLeft: 9 }]}>
                    {agent?.rejectionReason || "Application rejected — contact support"}
                  </Text>
                </View>
              )}

              {/* Getting started guide */}
              <View style={s.guideCard}>
                <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Getting Started</Text>
                {[
                  { n: 1, t: "Complete your profile",   d: "Agency name, GST/PAN, contact info" },
                  { n: 2, t: "Upload KYC documents",    d: "GST certificate, PAN card, address" },
                  { n: 3, t: "Add bank account",         d: "Where you'll receive payouts" },
                  { n: 4, t: "Create your first tour",   d: "Add a tour package once approved" },
                ].map((item, idx, arr) => (
                  <View key={item.n}>
                    <View style={s.guideRow}>
                      <View
                        style={[
                          s.guideNum,
                          steps[item.n - 1]?.done && { backgroundColor: C.g600 },
                          steps[item.n - 1]?.current && { backgroundColor: C.blue },
                        ]}
                      >
                        {steps[item.n - 1]?.done ? (
                          <Ionicons name="checkmark" size={11} color="#fff" />
                        ) : (
                          <Text style={s.guideNumTxt}>{item.n}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.guideTitle}>{item.t}</Text>
                        <Text style={s.guideDesc}>{item.d}</Text>
                      </View>
                    </View>
                    {idx < arr.length - 1 && <View style={s.guideLine} />}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Quick Actions ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Quick Actions</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.qaRow}>
              {quickActions.map((qa, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.qaItem}
                  onPress={() => navigation.navigate(qa.route)}
                  activeOpacity={0.7}
                >
                  <View style={[s.qaCircle, { backgroundColor: qa.color + "14" }]}>
                    <Ico lib={qa.lib} name={qa.icon} size={26} color={qa.color} />
                  </View>
                  <Text style={s.qaLabel} numberOfLines={2}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Your Listings ── */}
          {isApproved && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Your Listings</Text>
                <View style={s.countPill}>
                  <Text style={s.countPillTxt}>{listings.length} types</Text>
                </View>
              </View>
              <View style={s.svcGrid}>
                {listings.map((svc, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.svcCard}
                    onPress={() => svc.params ? navigation.navigate(svc.route, svc.params) : navigation.navigate(svc.route)}
                    activeOpacity={0.75}
                  >
                    <View style={{ marginRight: 10 }}>
                      <View style={[s.svcIconBox, { backgroundColor: svc.color + "14" }]}>
                        <Ionicons name={svc.icon} size={22} color={svc.color} />
                      </View>
                      {svc.count > 0 && (
                        <View style={[s.svcCountDot, { backgroundColor: svc.color }]}>
                          <Text style={s.svcCountDotTxt}>
                            {svc.count > 99 ? "99+" : svc.count}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.svcName} numberOfLines={2}>{svc.name}</Text>
                    <Ionicons name="chevron-forward" size={13} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Manage — 2-col grid ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Manage</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.manageGrid}>
              {manageItems.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.manageCard}
                  onPress={() =>
                    m.params
                      ? navigation.navigate(m.route, m.params)
                      : navigation.navigate(m.route)
                  }
                  activeOpacity={0.75}
                >
                  <View style={[s.manageIconBox, { backgroundColor: m.color + "14" }]}>
                    <Ico lib={m.lib} name={m.icon} size={20} color={m.color} />
                  </View>
                  <Text style={s.manageLabel}>{m.label}</Text>
                  <Text style={s.manageSub}>{m.sub}</Text>
                  {m.badge > 0 && (
                    <View style={[s.manageBadge, { backgroundColor: m.color }]}>
                      <Text style={s.manageBadgeTxt}>{m.badge > 99 ? "99+" : m.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={12} color={C.muted} style={s.manageArrow} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Community ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Community</Text>
              {!isApproved && (
                <View style={s.previewPill}>
                  <Ionicons name="eye-outline" size={11} color={C.amber} />
                  <Text style={s.previewPillTxt}>Preview</Text>
                </View>
              )}
            </View>
            <View style={s.manageGrid}>
              {[
                { label: "Social Feed", sub: "Posts & updates", icon: "newspaper-outline", lib: "ion", color: C.pink, route: "TASocialFeed" },
                { label: "Messages",    sub: "Vendor chats",    icon: "chatbubbles-outline", lib: "ion", color: C.blue, route: "TASocialMessages" },
              ].map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.manageCard}
                  onPress={() => navigation.navigate(m.route)}
                  activeOpacity={0.75}
                >
                  <View style={[s.manageIconBox, { backgroundColor: m.color + "14" }]}>
                    <Ico lib={m.lib} name={m.icon} size={20} color={m.color} />
                  </View>
                  <Text style={s.manageLabel}>{m.label}</Text>
                  <Text style={s.manageSub}>{m.sub}</Text>
                  <Ionicons name="chevron-forward" size={12} color={C.muted} style={s.manageArrow} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

/* ───────── Styles (closely mirrors vendor dashboard) ───────── */
const s = StyleSheet.create({
  // ── Alert banners ──
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  alertIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 13, fontWeight: "800" },
  alertSub: { fontSize: 11, color: "#64748B", fontWeight: "600", marginTop: 1 },

  // ── Header ──
  hero: { paddingHorizontal: 16, paddingBottom: 14, overflow: "hidden" },
  deco1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(52,211,153,0.07)", top: -60, right: -40,
  },
  deco2: {
    position: "absolute", width: 130, height: 130, borderRadius: 65,
    backgroundColor: "rgba(16,185,129,0.05)", bottom: 0, left: W * 0.35,
  },
  topBar:   { flexDirection: "row", alignItems: "center", paddingTop: 8, marginBottom: 12 },
  topLeft:  { flexDirection: "row", alignItems: "center", flex: 1 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center", justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 0.3 },

  greeting: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: 0.3 },
  bizName:  { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginTop: 2 },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start", marginTop: 4,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: "700" },

  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -3, right: -3,
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#022C22",
    alignItems: "center", justifyContent: "center",
  },
  badgeTxt: { fontSize: 7, fontWeight: "900", color: "#fff" },

  // ── Earnings card ──
  earningsCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.13)",
  },
  earningsTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
  earningsLbl: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "700", letterSpacing: 1.5, marginBottom: 3 },
  earningsAmt: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  growthPill:  { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  growthTxt:   { fontSize: 13, fontWeight: "800" },
  miniStrip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.13)", borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 10,
  },
  vLine:    { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.12)", marginHorizontal: 6 },
  miniCell: { flex: 1, alignItems: "center" },
  miniVal:  { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 2 },
  miniLbl:  { fontSize: 9.5, fontWeight: "600", color: "rgba(255,255,255,0.5)" },

  // ── Hero stat cards ──
  statRow:    { flexDirection: "row", gap: 8 },
  statCard:   { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" },
  statTop:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, minHeight: 15 },
  statHotDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FCA5A5" },
  statVal:    { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  statLbl:    { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.55)", marginTop: 2 },

  // ── Progress (pending) ──
  progressBlock:  { marginBottom: 2 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressTitle:  { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "700" },
  progressCount:  { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  progressBarBg:  { height: 4, backgroundColor: "rgba(255,255,255,0.13)", borderRadius: 2, marginBottom: 12 },
  progressBarFill:{ height: 4, backgroundColor: "#34D399", borderRadius: 2 },
  stepRow:    { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  stepDotDone:   { backgroundColor: "#059669", borderColor: "#059669" },
  stepDotActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  stepNum:       { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.4)" },
  stepLine:      { flex: 1, height: 1.5, backgroundColor: "rgba(255,255,255,0.12)", maxWidth: 28 },
  stepCurrent:   { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "600", marginLeft: 10 },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 18 },
  section:      { marginBottom: 22 },
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: C.text, letterSpacing: -0.2 },

  countPill:    { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  countPillTxt: { fontSize: 10, fontWeight: "700", color: C.g700 },
  previewPill:    { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: C.amberL, borderWidth: 1, borderColor: "#FDE68A" },
  previewPillTxt: { fontSize: 10, fontWeight: "800", color: C.amber, letterSpacing: 0.3 },

  // ── Recent Leads ──
  inqCountPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: C.redL, borderWidth: 1, borderColor: "#FECACA" },
  inqLiveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  inqCountTxt:  { fontSize: 10, fontWeight: "800", color: C.red },
  inqCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inqTop:     { flexDirection: "row", alignItems: "center", gap: 10 },
  inqIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  inqTitle:   { fontSize: 13, fontWeight: "800", color: C.text },
  inqSub:     { fontSize: 11, color: C.sub, marginTop: 2 },
  inqAgo:     { fontSize: 10, color: C.muted, fontWeight: "600" },
  inqBottom:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border },
  inqCustomer:    { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  inqAvatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: C.g50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.g100 },
  inqAvatarTxt:   { fontSize: 11, fontWeight: "800", color: C.g700 },
  inqCustomerTxt: { fontSize: 12, fontWeight: "600", color: C.text, flex: 1 },
  inqBtn:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.g600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  inqBtnTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },
  inqViewAll:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 11, borderRadius: 12, backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100 },
  inqViewAllTxt: { fontSize: 12, fontWeight: "800", color: C.g700 },

  // ── Quick Actions ──
  qaRow:    { flexDirection: "row", flexWrap: "wrap", rowGap: 14, columnGap: 6 },
  qaItem:   { width: QA_W, alignItems: "center" },
  qaCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  qaLabel:  { fontSize: 9, fontWeight: "700", color: C.sub, textAlign: "center", lineHeight: 12, height: 24 },

  // ── Listings ──
  svcGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  svcCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 13,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  svcIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  svcName:    { flex: 1, fontSize: 11.5, fontWeight: "700", color: C.text, marginLeft: 9, lineHeight: 15 },
  svcCountDot: {
    position: "absolute", top: -5, right: -5,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: C.card,
  },
  svcCountDotTxt: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // ── Manage (2-col grid) ──
  manageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  manageCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  manageIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  manageLabel:   { fontSize: 12.5, fontWeight: "800", color: C.text, marginBottom: 2 },
  manageSub:     { fontSize: 10, color: C.muted, lineHeight: 14 },
  manageArrow:   { position: "absolute", bottom: 12, right: 12 },
  manageBadge: {
    position: "absolute", top: 12, right: 12,
    minWidth: 22, height: 22, borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center", justifyContent: "center",
  },
  manageBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // ── Pending setup ──
  pendingGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  pendingCard: {
    width: CARD_W, backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border, position: "relative",
  },
  pendingIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  pendingName:    { fontSize: 12, fontWeight: "800", color: C.text, marginBottom: 3 },
  pendingDesc:    { fontSize: 10, color: C.muted },
  pendingDoneTag: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: C.g100, alignItems: "center", justifyContent: "center" },

  // ── Alert ──
  alertRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 12,
  },
  alertTxt: { fontSize: 12, fontWeight: "600" },

  // ── Getting started ──
  guideCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  guideRow:    { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10 },
  guideNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  guideNumTxt: { fontSize: 11, fontWeight: "800", color: C.sub },
  guideTitle:  { fontSize: 12, fontWeight: "700", color: C.text, marginBottom: 2 },
  guideDesc:   { fontSize: 11, color: C.muted, lineHeight: 15 },
  guideLine:   { height: 1, backgroundColor: C.border, marginLeft: 38 },
});
