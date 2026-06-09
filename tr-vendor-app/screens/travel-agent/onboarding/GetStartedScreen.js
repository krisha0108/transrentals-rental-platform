// screens/travel-agent/onboarding/GetStartedScreen.js
// REDESIGNED — emerald-themed Get Started checklist + onboarding hub.
//
// GET /api/travel-agent/profile — returns the full agent record + onboarding
// counts (documentsCount, bankAccountsCount, leadsCount, toursCount,
// propertiesCount, bookingsCount). We use those to drive a 3-step checklist
// + feature shortcuts + approval-status hero.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getTravelAgentProfile } from "../../api/travelAgentClient";

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
  blueLight: "#EFF6FF",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  indigo: "#6366F1",
  pink: "#EC4899",
};

// Per-status hero accent. Approved = emerald wins; pending/docs = amber;
// review = blue; rejected/suspended = red.
const STATUS_META = {
  APPROVED:          { accent: C.emerald600, secondary: C.emerald500, icon: "checkmark-circle", label: "Account Verified",      desc: "You're all set — publish and start accepting bookings.",       chipLabel: "VERIFIED" },
  PENDING:           { accent: C.amber,      secondary: "#D97706",    icon: "time",              label: "Pending Approval",       desc: "Complete the steps below and we'll review your application.",  chipLabel: "PENDING" },
  DOCUMENTS_PENDING: { accent: C.amber,      secondary: "#D97706",    icon: "document-attach",   label: "Documents Pending",      desc: "Upload required documents to begin verification.",             chipLabel: "DOCS PENDING" },
  UNDER_REVIEW:      { accent: C.blue,       secondary: "#1E40AF",    icon: "hourglass",         label: "Under Review",           desc: "Our team is reviewing your documents — usually 1-2 business days.", chipLabel: "IN REVIEW" },
  REJECTED:          { accent: C.red,        secondary: "#B91C1C",    icon: "alert-circle",      label: "Application Rejected",   desc: "Please contact support or upload corrected documents.",        chipLabel: "REJECTED" },
  SUSPENDED:         { accent: C.red,        secondary: "#B91C1C",    icon: "ban",               label: "Account Suspended",      desc: "Please reach out to support.",                                  chipLabel: "SUSPENDED" },
};

export default function GetStartedScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getTravelAgentProfile();
      setProfile(data.travelAgent || data.profile || data.agent || data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load");
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

  const status = profile?.status || "PENDING";
  const statusMeta = STATUS_META[status] || STATUS_META.PENDING;
  const isApproved = status === "APPROVED";

  // Onboarding completion heuristics — fields the profile endpoint returns.
  const profileComplete = !!(
    profile?.agencyName && profile?.ownerName &&
    (profile?.address || profile?.city) && profile?.gstNumber
  );
  const docsCount = profile?.documentsCount ?? profile?.documents?.length ?? 0;
  const docsComplete = docsCount >= 3;
  const banksCount = profile?.bankAccountsCount ?? profile?.bankAccounts?.length ?? 0;
  const banksComplete = banksCount >= 1;

  const steps = useMemo(() => [
    {
      key: "profile",
      icon: "person-circle",
      color: C.emerald600,
      title: "Complete agency profile",
      desc: "Add agency details, GST/PAN, address — needed for verification.",
      done: profileComplete,
      cta: profileComplete ? "Edit" : "Complete now",
      onPress: () => navigation.navigate("TAProfile"),
    },
    {
      key: "docs",
      icon: "document-attach",
      color: C.amber,
      title: "Upload KYC documents",
      desc: "GST certificate, PAN card, and address proof are required.",
      done: docsComplete,
      cta: docsComplete ? "Manage" : `Upload (${docsCount}/3)`,
      onPress: () => navigation.navigate("TADocuments"),
    },
    {
      key: "bank",
      icon: "card",
      color: C.blue,
      title: "Add bank account",
      desc: "Where you'll receive payouts. IFSC + account verified.",
      done: banksComplete,
      cta: banksComplete ? "Manage" : "Add account",
      onPress: () => navigation.navigate("TABankDetails"),
    },
  ], [profileComplete, docsComplete, banksComplete, docsCount, navigation]);

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  // Hero gradient — emerald when approved or all checklist done, else status accent.
  const heroColors = isApproved
    ? [C.emerald700, C.emerald600, C.emerald500]
    : status === "REJECTED" || status === "SUSPENDED"
    ? ["#B91C1C", C.red]
    : status === "UNDER_REVIEW"
    ? ["#1E40AF", C.blue]
    : [C.emerald700, C.emerald600]; // default emerald for pending/docs

  // ===== Loading state =====
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
        <LinearGradient
          colors={["#022C22", "#064E3B", "#047857"]}
          style={{ paddingBottom: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitleSimple}>Get Started</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading your onboarding…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={heroColors[0]} />

      {/* ===== Gradient hero header with progress ===== */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 38 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Get Started</Text>
            <View style={[styles.statusChip, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name={statusMeta.icon} size={11} color="#fff" />
              <Text style={styles.statusChipText}>{statusMeta.chipLabel}</Text>
            </View>
          </View>

          {/* Big progress block */}
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressTop}>
              <View>
                <Text style={styles.heroProgressLabel}>ONBOARDING PROGRESS</Text>
                <Text style={styles.heroProgressValue}>{progressPct}%</Text>
              </View>
              <View style={styles.heroProgressBadge}>
                <Ionicons name="checkmark-done" size={12} color={statusMeta.accent} />
                <Text style={[styles.heroProgressBadgeText, { color: statusMeta.accent }]}>
                  {completedCount}/{steps.length} DONE
                </Text>
              </View>
            </View>
            <View style={styles.heroBarTrack}>
              <View style={[styles.heroBarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Status card (floating, -22px over header) ===== */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIconBox, { backgroundColor: statusMeta.accent }]}>
          <Ionicons name={statusMeta.icon} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.statusTitle, { color: statusMeta.accent }]}>{statusMeta.label}</Text>
          <Text style={styles.statusDesc}>{statusMeta.desc}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.emerald600}
            colors={[C.emerald600]}
          />
        }
      >
        {/* All-done celebration banner (when not yet approved but checklist done) */}
        {allDone && !isApproved && (
          <View style={styles.celebrateCard}>
            <View style={styles.celebrateIcon}>
              <Ionicons name="hourglass" size={20} color={C.emerald700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.celebrateTitle}>Checklist complete 🎉</Text>
              <Text style={styles.celebrateBody}>
                We'll review your submission shortly and approve your account.
              </Text>
            </View>
          </View>
        )}

        {/* ===== Checklist section ===== */}
        <SectionLabel
          icon="checkmark-done-circle"
          color={C.emerald600}
          label="Setup checklist"
          badge={`${completedCount}/${steps.length}`}
        />
        {steps.map((step, idx) => (
          <StepCard key={step.key} step={step} number={idx + 1} />
        ))}

        {/* ===== Activity stats (approved-only) ===== */}
        {isApproved && (
          <>
            <SectionLabel
              icon="stats-chart"
              color={C.blue}
              label="Your activity"
            />
            <View style={styles.statsGrid}>
              <StatTile
                icon="people"
                color={C.blue}
                value={profile?.leadsCount ?? profile?.leads?.length ?? 0}
                label="Leads"
              />
              <StatTile
                icon="map"
                color={C.purple}
                value={profile?.toursCount ?? profile?.tours?.length ?? 0}
                label="Tours"
              />
              <StatTile
                icon="bed"
                color={C.amber}
                value={profile?.propertiesCount ?? profile?.properties?.length ?? 0}
                label="Properties"
              />
              <StatTile
                icon="receipt"
                color={C.emerald600}
                value={profile?.bookingsCount ?? profile?.bookings?.length ?? 0}
                label="Bookings"
              />
            </View>
          </>
        )}

        {/* ===== Feature shortcuts ===== */}
        <SectionLabel
          icon="apps"
          color={C.purple}
          label="Explore features"
          hint="Quick shortcuts to everything you can do"
        />
        <View style={styles.featuresGrid}>
          <FeatureTile
            icon="people"
            color={C.blue}
            label="Leads"
            sub="CRM pipeline"
            onPress={() =>
              // Leads is a tab inside TravelAgentDashboard — nested navigate.
              navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })
            }
          />
          <FeatureTile
            icon="map"
            color={C.purple}
            label="Tours"
            sub="Sell packages"
            onPress={() => navigation.navigate("TATours")}
          />
          <FeatureTile
            icon="bed"
            color={C.amber}
            label="Properties"
            sub="Resorts & hotels"
            onPress={() => navigation.navigate("TAProperties")}
          />
          <FeatureTile
            icon="car-sport"
            color={C.emerald600}
            label="Fleet"
            sub="Vehicles & cabs"
            onPress={() => navigation.navigate("TAFleet")}
          />
          <FeatureTile
            icon="link"
            color={C.red}
            label="Capture Links"
            sub="Auto-collect leads"
            onPress={() => navigation.navigate("TACaptureLinks")}
          />
          <FeatureTile
            icon="globe"
            color={C.indigo}
            label="Social"
            sub="Vendor network"
            onPress={() => navigation.navigate("TASocialFeed")}
          />
        </View>

        {/* ===== Help card ===== */}
        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Ionicons name="help-buoy" size={18} color={C.emerald700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpBody}>
              Our team is here to get you onboarded fast. Reach out anytime.
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, color, label, badge, hint }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
        <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
        {!!badge && (
          <View style={[styles.sectionLabelBadge, { backgroundColor: `${color}1A` }]}>
            <Text style={[styles.sectionLabelBadgeText, { color }]}>{badge}</Text>
          </View>
        )}
      </View>
      {!!hint && <Text style={styles.sectionLabelHint}>{hint}</Text>}
    </View>
  );
}

function StepCard({ step, number }) {
  const done = step.done;
  return (
    <TouchableOpacity
      style={[
        styles.stepCard,
        done && styles.stepCardDone,
      ]}
      onPress={step.onPress}
      activeOpacity={0.9}
    >
      {/* Number bubble (or checkmark when done) */}
      <View style={[
        styles.stepNumber,
        done ? { backgroundColor: C.emerald600 } : { backgroundColor: `${step.color}1A`, borderWidth: 1.5, borderColor: step.color },
      ]}>
        {done ? (
          <Ionicons name="checkmark" size={17} color="#fff" />
        ) : (
          <Text style={[styles.stepNumberText, { color: step.color }]}>{number}</Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.stepTop}>
          <Ionicons
            name={step.icon}
            size={14}
            color={done ? C.emerald700 : step.color}
          />
          <Text
            style={[
              styles.stepTitle,
              done && { color: C.emerald700 },
            ]}
            numberOfLines={1}
          >
            {step.title}
          </Text>
          {done && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark-circle" size={10} color={C.emerald600} />
              <Text style={styles.doneBadgeText}>DONE</Text>
            </View>
          )}
        </View>
        <Text style={styles.stepDesc}>{step.desc}</Text>

        {/* CTA — gradient when pending, light emerald when done */}
        <View style={styles.stepCtaWrap}>
          {done ? (
            <View style={styles.stepCtaDone}>
              <Text style={styles.stepCtaDoneText}>{step.cta}</Text>
              <Ionicons name="arrow-forward" size={12} color={C.emerald700} />
            </View>
          ) : (
            <LinearGradient
              colors={[step.color, shade(step.color, -12)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.stepCta}
            >
              <Text style={styles.stepCtaText}>{step.cta}</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </LinearGradient>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatTile({ icon, color, value, label }) {
  return (
    <View style={[styles.statTile, { borderLeftColor: color }]}>
      <View style={[styles.statTileIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.statTileValue, { color }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function FeatureTile({ icon, color, label, sub, onPress }) {
  return (
    <TouchableOpacity
      style={styles.featureTile}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.featureIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureSub} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

/* ───────── Helpers ───────── */
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

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },
  headerTitleSimple: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },

  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusChipText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  // Hero progress
  heroProgress: { marginTop: 16, paddingHorizontal: 4 },
  heroProgressTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 },
  heroProgressLabel: { fontSize: 10.5, color: "rgba(255,255,255,0.8)", fontWeight: "800", letterSpacing: 0.8 },
  heroProgressValue: { fontSize: 32, color: "#fff", fontWeight: "900", marginTop: 2, letterSpacing: -0.5 },
  heroProgressBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#fff" },
  heroProgressBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  heroBarTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 4, overflow: "hidden" },
  heroBarFill: { height: "100%", borderRadius: 4, backgroundColor: "#fff" },

  // Floating status card
  statusCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  statusIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  statusTitle: { fontSize: 14.5, fontWeight: "900" },
  statusDesc: { fontSize: 12, color: C.text, marginTop: 4, lineHeight: 16, fontWeight: "500" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Celebrate card (checklist done, awaiting review)
  celebrateCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 14,
  },
  celebrateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  celebrateTitle: { fontSize: 14, fontWeight: "900", color: C.emerald700 },
  celebrateBody: { fontSize: 12, color: C.text, marginTop: 4, lineHeight: 16, fontWeight: "500" },

  // Section label
  sectionLabelWrap: { marginTop: 6, marginBottom: 10 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sectionLabelText: { flex: 1, fontSize: 12, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" },
  sectionLabelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  sectionLabelBadgeText: { fontSize: 11, fontWeight: "900" },
  sectionLabelHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 4, marginLeft: 32, fontStyle: "italic" },

  // Step card
  stepCard: {
    flexDirection: "row", gap: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepCardDone: { backgroundColor: C.emerald50, borderColor: "#A7F3D0" },
  stepNumber: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  stepNumberText: { fontSize: 15, fontWeight: "900" },

  stepTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: C.ink },
  doneBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(5,150,105,0.15)" },
  doneBadgeText: { fontSize: 9, color: C.emerald600, fontWeight: "900", letterSpacing: 0.4 },
  stepDesc: { fontSize: 12, color: C.subText, marginTop: 4, lineHeight: 16, fontWeight: "500" },

  // Step CTA (gradient + done variants)
  stepCtaWrap: { marginTop: 10, alignSelf: "flex-start" },
  stepCta: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
  },
  stepCtaText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepCtaDone: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    backgroundColor: "rgba(5,150,105,0.12)", borderWidth: 1, borderColor: "#A7F3D0",
  },
  stepCtaDoneText: { color: C.emerald700, fontSize: 12, fontWeight: "800" },

  // Stats grid (approved)
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  statTile: {
    width: "47.5%",
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 4,
  },
  statTileIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statTileValue: { fontSize: 22, fontWeight: "900" },
  statTileLabel: { fontSize: 11, color: C.subText, fontWeight: "700", marginTop: 2, letterSpacing: 0.3, textTransform: "uppercase" },

  // Features grid (3 cols)
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureTile: {
    width: "31.5%",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    padding: 12, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  featureLabel: { fontSize: 12.5, fontWeight: "800", color: C.ink },
  featureSub: { fontSize: 10, color: C.subText, fontWeight: "600", textAlign: "center" },

  // Help card
  helpCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, marginTop: 16,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
  },
  helpIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  helpTitle: { fontSize: 13.5, fontWeight: "800", color: C.emerald700 },
  helpBody: { fontSize: 12, color: C.text, marginTop: 2, fontWeight: "500", lineHeight: 16 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 0, marginTop: 12, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },
});
