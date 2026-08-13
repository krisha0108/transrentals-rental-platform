// screens/travel-agent/more/MoreScreen.js
// REDESIGNED v2 — compact emerald-themed "More" hub.
// - Horizontal hero (avatar | name + status | edit) — much smaller than v1
// - Floating stats card (Leads / Bookings / Tours)
// - Approval CTA card (only when not approved)
// - 4 BIG featured tiles in 2-col grid for the most-used pages
// - Tight grouped section cards (CRM / Money / Social / Account)
// - Logout + version footer
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, StatusBar, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { DISPLAY } from "../_shared/typography";
import {
  getCurrentTravelAgent,
  getTravelAgentDashboard,
  logoutTravelAgent,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";
import CustomAlert from "../../../components/CustomAlert";


// Warm Elevate tones (was the bright set: #059669, #3B82F6, #EC4899 …).
const AVATAR_COLORS = ["#1C6B52", "#2C6E8C", "#5E43A8", "#C65772", "#9A6B16", "#2E9E78", "#245C7A", "#B14A64"];
function avatarColor(name) {
  if (!name) return C.emerald600;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function shade(hex, pct) {
  const f = parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff;
  return (
    "#" +
    (0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    ).toString(16).slice(1)
  );
}

// How far the floating stats card rides up over the hero's bottom edge. The
// hero is fixed and the card scrolls, so this value has to be subtracted from
// the hero's tail and added back as scroll padding to keep the gap the same.
const STATS_OVERLAP = 10;

const STATUS_PILL = {
  APPROVED:          { icon: "checkmark-circle", label: "Verified" },
  PENDING:           { icon: "time",             label: "Pending" },
  DOCUMENTS_PENDING: { icon: "document-attach",  label: "Docs pending" },
  UNDER_REVIEW:      { icon: "hourglass",        label: "Under review" },
  REJECTED:          { icon: "alert-circle",     label: "Rejected" },
  SUSPENDED:         { icon: "ban",              label: "Suspended" },
};

// Compact grouped sections — each row is single-line, tight.
const SECTIONS = [
  {
    title: "CRM",
    icon: "people-circle",
    color: C.blue,
    items: [
      { key: "TAPipeline",         icon: "git-network", label: "Pipeline",       color: C.indigo },
      { key: "TAFollowUps",        icon: "alarm",       label: "Follow-ups",     color: C.amber },
      { key: "TACaptureLinks",     icon: "link",        label: "Capture Links",  color: C.emerald600, requiresApproval: true },
      { key: "TATourQuoteRequests", icon: "mail-unread", label: "Quote Requests", color: C.red,        requiresApproval: true },
    ],
  },
  {
    title: "Listings",
    icon: "layers",
    color: C.purple,
    items: [
      { key: "TATours",      icon: "map", label: "Tours",      color: C.purple },
      { key: "TAProperties", icon: "bed", label: "Properties", color: C.amber },
      { key: "TAFleet",      icon: "car-sport", label: "Fleet", color: C.blue },
    ],
  },
  {
    title: "Money",
    icon: "wallet",
    color: C.emerald600,
    items: [
      { key: "TAEarnings",    icon: "trending-up", label: "Earnings",     color: C.emerald600, requiresApproval: true },
      { key: "TAPayments",    icon: "card",        label: "Payments",     color: C.blue,       requiresApproval: true },
      { key: "TABankDetails", icon: "business",    label: "Bank Details", color: C.purple },
    ],
  },
  {
    title: "Social",
    icon: "globe",
    color: C.indigo,
    items: [
      { key: "TASocialFeed",     icon: "newspaper",   label: "Social Feed",     color: C.emerald600 },
      { key: "TASocialMessages", icon: "paper-plane", label: "Social Messages", color: C.blue },
    ],
  },
  {
    title: "Account",
    icon: "person-circle",
    color: C.amber,
    items: [
      { key: "TANotifications", icon: "notifications", label: "Notifications",  color: C.red },
      { key: "TADocuments",     icon: "document-text", label: "Documents",      color: C.amber },
      { key: "TAProfile",       icon: "person",        label: "Agency Profile", color: C.emerald600 },
      { key: "TASupport",       icon: "help-circle",   label: "Help & Support", color: C.blue },
      { key: "TAGetStarted",    icon: "rocket",        label: "Get Started",    color: C.purple },
    ],
  },
];

export default function MoreScreen({ navigation }) {
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Custom alert state
  const [alert, setAlert] = useState({ visible: false, type: "info", title: "", message: "", actions: null });
  const hideAlert = () => setAlert((p) => ({ ...p, visible: false }));
  const showConfirm = (type, title, message, confirmLabel, onConfirm, destructive = false) => {
    setAlert({
      visible: true, type, title, message,
      actions: [
        { label: "Cancel", onPress: hideAlert, variant: "ghost" },
        { label: confirmLabel, onPress: () => { hideAlert(); onConfirm(); }, variant: "primary", destructive },
      ],
    });
  };

  const load = useCallback(async () => {
    const [ta, dash] = await Promise.all([
      getCurrentTravelAgent(),
      getTravelAgentDashboard().catch(() => null),
    ]);
    setAgent(ta);
    setStats(dash);
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = () => {
    showConfirm(
      "warning",
      "Logout?",
      "You'll need to log in again to access your account.",
      "Logout",
      async () => {
        await logoutTravelAgent();
        navigation.reset({ index: 0, routes: [{ name: "VendorLoginScreen" }] });
      },
      true
    );
  };

  const isApproved = agent?.status === "APPROVED";
  const statusMeta = STATUS_PILL[agent?.status] || STATUS_PILL.PENDING;
  const agencyName = agent?.agencyName || agent?.ownerName || "Travel Agent";
  const aColor = avatarColor(agencyName);

  const onItemPress = (item) => {
    if (item.requiresApproval && !isApproved) {
      Alert.alert(
        "Approval required",
        "Get your account verified to unlock this section.",
        [
          { text: "OK", style: "cancel" },
          { text: "Upload Documents", onPress: () => navigation.navigate("TADocuments") },
        ]
      );
      return;
    }
    navigation.navigate(item.key);
  };

  // 4 featured quick shortcuts — small icon + short label tiles, 4-per-row.
  const FEATURED = [
    { key: "TAProfile",       icon: "person-circle", label: "Profile",  color: C.emerald600 },
    { key: "TADocuments",     icon: "document-text", label: "Docs",     color: C.amber },
    { key: "TANotifications", icon: "notifications", label: "Alerts",   color: C.blue },
    { key: "TAGetStarted",    icon: "rocket",        label: "Get Started", color: C.purple },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ===== Compact gradient hero (fixed) =====
          Outside the ScrollView so the account name, status and the Edit pill
          stay put while the sections scroll — same as the other Travel Agent
          screens. paddingBottom is short by STATS_OVERLAP because the stats
          card can no longer climb into the tail from a different scroll
          parent; the tail gives that space back so the gap is unchanged. */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 26 - STATS_OVERLAP }}>
            {/* Top row: kicker label + labelled Edit pill */}
            <View style={styles.heroTopRow}>
              <Text style={styles.heroKicker}>MY ACCOUNT</Text>
              <TouchableOpacity
                style={styles.editPill}
                onPress={() => navigation.navigate("TAProfile")}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="create-outline" size={13} color={C.emerald700} />
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Avatar + name block */}
            <View style={styles.heroRow}>
              <LinearGradient
                colors={[aColor, shade(aColor, -18)]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials(agencyName)}</Text>
              </LinearGradient>

              <View style={{ flex: 1, minWidth: 0, marginLeft: 13 }}>
                <Text style={styles.agencyName} numberOfLines={1}>{agencyName}</Text>
                {!!agent?.email && (
                  <Text style={styles.email} numberOfLines={1}>{agent.email}</Text>
                )}
                <View style={styles.statusPill}>
                  <Ionicons name={statusMeta.icon} size={10} color="#fff" />
                  <Text style={styles.statusPillText}>{statusMeta.label.toUpperCase()}</Text>
                </View>
              </View>
            </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        // paddingTop cancels statsCard's -STATS_OVERLAP margin, which would
        // otherwise clip the card's top against the scroll edge now that the
        // hero is no longer its sibling.
        contentContainerStyle={{ paddingTop: STATS_OVERLAP, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} colors={[C.emerald600]} />
        }
      >
        {/* ===== Floating stats card ===== */}
        <View style={styles.statsCard}>
          <StatBlock
            label="Leads"
            value={stats?.leads?.total ?? 0}
            icon="people"
            color={C.blue}
            onPress={() =>
              // Leads is a tab in TravelAgentBottomNavigation
              navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })
            }
          />
          <View style={styles.statDivider} />
          <StatBlock
            label="Bookings"
            value={stats?.bookings?.total ?? 0}
            icon="receipt"
            color={C.purple}
            onPress={() =>
              navigation.navigate("TravelAgentDashboard", { screen: "TABookings" })
            }
          />
          <View style={styles.statDivider} />
          <StatBlock
            label="Tours"
            value={stats?.tours?.total ?? 0}
            icon="map"
            color={C.emerald600}
            onPress={() => navigation.navigate("TATours")}
          />
        </View>

        {/* ===== Approval CTA card (non-approved only) ===== */}
        {!isApproved && (
          <TouchableOpacity
            style={styles.approvalCardWrap}
            onPress={() =>
              navigation.navigate(
                agent?.status === "DOCUMENTS_PENDING" ? "TravelAgentDocuments" : "TAGetStarted"
              )
            }
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.amber, shade(C.amber, -18)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.approvalCard}
            >
              <View style={styles.approvalIconBox}>
                <Ionicons name="rocket" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.approvalTitle}>Get verified</Text>
                <Text style={styles.approvalDesc}>Unlock payments, earnings & public profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ===== 4 featured quick shortcuts (4 per row) ===== */}
        <View style={styles.featuredStrip}>
          {FEATURED.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={styles.featuredTile}
              onPress={() => navigation.navigate(f.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.featuredIconWrap, { backgroundColor: `${f.color}1A` }]}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <Text
                style={styles.featuredLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== Grouped sections ===== */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${section.color}1A` }]}>
                <Ionicons name={section.icon} size={12} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {section.title}
              </Text>
            </View>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => {
                const gated = item.requiresApproval && !isApproved;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.itemRow,
                      idx > 0 && styles.itemRowBorder,
                    ]}
                    onPress={() => onItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.itemIcon,
                        { backgroundColor: gated ? C.tintSand : `${item.color}18` },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={gated ? C.subText : item.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.itemLabel,
                        gated && { color: C.subText },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {gated ? (
                      <View style={styles.gatedBadge}>
                        <Ionicons name="lock-closed" size={9} color={C.amber} />
                        <Text style={styles.gatedBadgeText}>Verify</Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={15} color={C.subText} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* ===== Logout card ===== */}
        <View style={styles.logoutCard}>
          {/* User info row */}
          <View style={styles.logoutUserRow}>
            <LinearGradient
              colors={[aColor, shade(aColor, -18)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoutAvatar}
            >
              <Text style={styles.logoutAvatarText}>{initials(agencyName)}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.logoutName} numberOfLines={1}>{agencyName}</Text>
              {!!agent?.email && (
                <Text style={styles.logoutEmail} numberOfLines={1}>{agent.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.logoutDivider} />

          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.82}
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={C.red} />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
            <Ionicons name="chevron-forward" size={16} color="#CE9A94" />
          </TouchableOpacity>
        </View>

        {/* App version footer */}
        <Text style={styles.versionText}>TransRentals · Travel Agent · v1.0</Text>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatBlock({ label, value, icon, color, onPress }) {
  return (
    <TouchableOpacity style={styles.statBlock} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Hero (compact horizontal)
  heroGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 10, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.14)",
  },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 },
  heroKicker: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: "rgba(255,255,255,0.62)", letterSpacing: 1.8, marginTop: 12 },
  editPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999,
    marginTop: 12,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  editPillText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.emerald700, letterSpacing: 0.2 },
  heroRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 54, height: 54, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 18, letterSpacing: 0.3 },
  agencyName: { fontFamily: DISPLAY, fontSize: 18.5, fontWeight: "bold", color: "#fff", letterSpacing: -0.2 },
  email: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.85)", marginTop: 3, fontWeight: "600" },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    marginTop: 7,
  },
  statusPillText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.5 },

  // Floating stats card (pulled up -22)
  statsCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 14, marginTop: -STATS_OVERLAP,
    backgroundColor: C.card, borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontFamily: DISPLAY, fontSize: 18, fontWeight: "bold" },
  statLabel: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },

  // Approval CTA card (gradient)
  approvalCardWrap: {
    marginHorizontal: 14, marginTop: 14, borderRadius: 14, overflow: "hidden",
    shadowColor: C.amber, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  approvalCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  approvalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  approvalTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: "#fff" },
  approvalDesc: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.92)", marginTop: 2, fontWeight: "600" },

  // Featured quick shortcuts — 4 tiles in a single horizontal row (white card).
  featuredStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 14, marginTop: 14,
    paddingVertical: 14, paddingHorizontal: 8,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  featuredTile: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 4 },
  featuredIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  featuredLabel: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.text, textAlign: "center" },

  // Section
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 14, marginBottom: 6 },
  sectionIcon: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 11, fontWeight: "bold", letterSpacing: 0.7, textTransform: "uppercase" },

  sectionCard: {
    marginHorizontal: 14, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  // Compact single-line item rows
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 12 },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  itemIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemLabel: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, fontWeight: "bold", color: C.ink },
  gatedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: C.amberLight },
  gatedBadgeText: { fontFamily: DISPLAY, color: "#8A6420", fontSize: 9, fontWeight: "bold", letterSpacing: 0.4 },

  // Logout card
  logoutCard: {
    marginHorizontal: 14, marginTop: 22,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  logoutUserRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  logoutAvatar: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  logoutAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15 },
  logoutName: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  logoutEmail: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 2 },
  logoutDivider: { height: 1, backgroundColor: "#F3DAD6", marginHorizontal: 0 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: "#FBEDEB",
  },
  logoutIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#F3DAD6",
    alignItems: "center", justifyContent: "center",
  },
  logoutText: { fontFamily: DISPLAY, flex: 1, color: C.red, fontWeight: "bold", fontSize: 14 },

  versionText: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, textAlign: "center", marginTop: 16, marginBottom: 4, fontWeight: "bold", letterSpacing: 0.5 },
});
