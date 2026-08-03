// screens/travel-agent/onboarding/GetStartedScreen.js
// REDESIGNED (v2) — "Elevate" luxury-travel visual language, matching
// TravelAgentDashboardScreen / LeadsListScreen.
//
// ⚠️ UI ONLY. Every data source, derived value, conditional section and
// navigation target is preserved exactly from the previous version:
//   • same GET /api/travel-agent/profile call + focus-refresh + pull-refresh
//   • same profileComplete / docsComplete / banksComplete heuristics
//   • same 3-step checklist with identical routes (TAProfile / TADocuments /
//     TABankDetails)
//   • same approved-only stats block and the same 6 feature shortcuts
//
// Design language: warm ivory bg, forest→emerald gradient hero with floating
// orbs, glass stat cards, serif DISPLAY type, gold/ocean/emerald accents.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getTravelAgentProfile } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import { C, G, TONES, rs, rf, GUT, alpha, cardShadow, rowShadow } from "../_shared/theme";

// Hero ↔ status-card spacing. Visible gap = HERO_TAIL + hero paddingBottom(8)
// − STATUS_OVERLAP (the card is pulled up to tuck into the hero's curve).
const HERO_TAIL = rs(36);
const STATUS_OVERLAP = rs(20);

// Per-status accent for the hero chip and the floating status card. The hero
// gradient itself is always G.hero — status no longer recolours the header.
const STATUS_META = {
  APPROVED: {
    accent: C.emeraldDeep, tone: "emerald",
    icon: "checkmark-circle", label: "Account Verified",
    desc: "You're all set — publish and start accepting bookings.", chipLabel: "VERIFIED",
  },
  PENDING: {
    accent: C.gold, tone: "amber",
    icon: "time", label: "Pending Approval",
    desc: "Complete the steps below and we'll review your application.", chipLabel: "PENDING",
  },
  DOCUMENTS_PENDING: {
    accent: C.gold, tone: "amber",
    icon: "document-attach", label: "Documents Pending",
    desc: "Upload required documents to begin verification.", chipLabel: "DOCS PENDING",
  },
  UNDER_REVIEW: {
    accent: C.ocean, tone: "ocean",
    icon: "hourglass", label: "Under Review",
    desc: "Our team is reviewing your documents — usually 1-2 business days.", chipLabel: "IN REVIEW",
  },
  REJECTED: {
    accent: C.red, tone: "rose",
    icon: "alert-circle", label: "Application Rejected",
    desc: "Please contact support or upload corrected documents.", chipLabel: "REJECTED",
  },
  SUSPENDED: {
    accent: C.red, tone: "rose",
    icon: "ban", label: "Account Suspended",
    desc: "Please reach out to support.", chipLabel: "SUSPENDED",
  },
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
      tone: "emerald",
      title: "Complete agency profile",
      desc: "Add agency details, GST/PAN, address — needed for verification.",
      done: profileComplete,
      cta: profileComplete ? "Edit" : "Complete now",
      onPress: () => navigation.navigate("TAProfile"),
    },
    {
      key: "docs",
      icon: "document-attach",
      tone: "amber",
      title: "Upload KYC documents",
      desc: "GST certificate, PAN card, and address proof are required.",
      done: docsComplete,
      cta: docsComplete ? "Manage" : `Upload (${docsCount}/3)`,
      onPress: () => navigation.navigate("TADocuments"),
    },
    {
      key: "bank",
      icon: "card",
      tone: "ocean",
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

  // Always the standard forest hero, so this screen's header matches every
  // other TA screen. (It used to swap to ocean on UNDER_REVIEW and red on
  // REJECTED/SUSPENDED, which made it the odd one out.) The status itself is
  // still surfaced by the hero chip and the floating status card below.
  const heroColors = G.hero;

  // ===== Loading state =====
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={heroColors[0]} />
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
            <View style={styles.heroTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={rs(19)} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
            </View>
            <Text style={styles.heroTitle}>Get Started</Text>
            <View style={{ height: rs(20) }} />
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emeraldDeep} />
          <Text style={styles.loadingText}>Loading your onboarding…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={heroColors[0]} />

      {/* ── Hero ── */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
          <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.circleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={rs(19)} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={styles.statusChip}>
              <Ionicons name={statusMeta.icon} size={rs(12)} color="#fff" />
              <Text style={styles.statusChipText} numberOfLines={1}>
                {statusMeta.chipLabel}
              </Text>
            </View>
          </View>

          {/* Title + sub grouped, so the rhythm is set in one place instead of
              two independent marginTops. */}
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle} numberOfLines={1}>Get Started</Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {allDone
                ? "Setup complete — welcome aboard"
                : `${steps.length - completedCount} step${steps.length - completedCount === 1 ? "" : "s"} left to go live`}
            </Text>
          </View>

          {/* Progress as two compact pills + a full-width rail. Replaces the
              old stacked "label + 32pt numeral + badge" block, which was the
              single tallest thing in the hero. */}
          <View style={styles.heroPillRow}>
            <View style={styles.heroPctPill}>
              <Text style={styles.heroPct}>
                {progressPct}
                <Text style={styles.heroPctSign}>%</Text>
              </Text>
              <Text style={styles.heroPctCaption}>COMPLETE</Text>
            </View>

            <View style={styles.heroDonePill}>
              <Ionicons name="checkmark-done" size={rs(11)} color={C.emeraldDeep} />
              <Text style={styles.heroDoneText}>
                {completedCount}/{steps.length} DONE
              </Text>
            </View>
          </View>

          <View style={styles.heroBarTrack}>
            <LinearGradient
              colors={G.gold}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.heroBarFill, { width: `${progressPct}%` }]}
            />
          </View>

          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Status card tucked into the hero curve ── */}
      <View style={styles.statusWrap}>
        <View style={[styles.statusCard, cardShadow]}>
          <LinearGradient
            colors={(TONES[statusMeta.tone] || TONES.emerald).grad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.statusIconBox}
          >
            <Ionicons name={statusMeta.icon} size={rs(20)} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.statusTitle, { color: statusMeta.accent }]}>
              {statusMeta.label}
            </Text>
            <Text style={styles.statusDesc}>{statusMeta.desc}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.emeraldDeep}
            colors={[C.emeraldDeep]}
          />
        }
      >
        {/* All-done celebration banner (checklist done, not yet approved) */}
        {allDone && !isApproved && (
          <View style={styles.celebrateCard}>
            <View style={styles.celebrateIcon}>
              <Ionicons name="hourglass" size={rs(19)} color={C.emeraldDeep} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.celebrateTitle}>Checklist complete</Text>
              <Text style={styles.celebrateBody}>
                We'll review your submission shortly and approve your account.
              </Text>
            </View>
          </View>
        )}

        {/* ===== Checklist ===== */}
        <SectionLabel
          icon="checkmark-done-circle"
          tone="emerald"
          label="Setup checklist"
          badge={`${completedCount}/${steps.length}`}
        />
        {steps.map((step, idx) => (
          <StepCard
            key={step.key}
            step={step}
            number={idx + 1}
            isLast={idx === steps.length - 1}
          />
        ))}

        {/* ===== Activity stats (approved-only) ===== */}
        {isApproved && (
          <>
            <SectionLabel icon="stats-chart" tone="ocean" label="Your activity" />
            <View style={styles.statsGrid}>
              <StatTile
                icon="people" tone="ocean"
                value={profile?.leadsCount ?? profile?.leads?.length ?? 0}
                label="Leads"
              />
              <StatTile
                icon="map" tone="plum"
                value={profile?.toursCount ?? profile?.tours?.length ?? 0}
                label="Tours"
              />
              <StatTile
                icon="bed" tone="amber"
                value={profile?.propertiesCount ?? profile?.properties?.length ?? 0}
                label="Properties"
              />
              <StatTile
                icon="receipt" tone="emerald"
                value={profile?.bookingsCount ?? profile?.bookings?.length ?? 0}
                label="Bookings"
              />
            </View>
          </>
        )}

        {/* ===== Feature shortcuts ===== */}
        <SectionLabel
          icon="apps"
          tone="plum"
          label="Explore features"
          hint="Quick shortcuts to everything you can do"
        />
        <View style={styles.featuresGrid}>
          <FeatureTile
            icon="people" tone="ocean" label="Leads" sub="CRM pipeline"
            onPress={() =>
              // Leads is a tab inside TravelAgentDashboard — nested navigate.
              navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })
            }
          />
          <FeatureTile
            icon="map" tone="plum" label="Tours" sub="Sell packages"
            onPress={() => navigation.navigate("TATours")}
          />
          <FeatureTile
            icon="bed" tone="amber" label="Properties" sub="Resorts & hotels"
            onPress={() => navigation.navigate("TAProperties")}
          />
          <FeatureTile
            icon="car-sport" tone="emerald" label="Fleet" sub="Vehicles & cabs"
            onPress={() => navigation.navigate("TAFleet")}
          />
          <FeatureTile
            icon="link" tone="rose" label="Capture Links" sub="Auto-collect leads"
            onPress={() => navigation.navigate("TACaptureLinks")}
          />
          <FeatureTile
            icon="globe" tone="ocean" label="Social" sub="Vendor network"
            onPress={() => navigation.navigate("TASocialFeed")}
          />
        </View>

        {/* ===== Help card ===== */}
        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Ionicons name="help-buoy" size={rs(18)} color={C.emeraldDeep} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpBody}>
              Our team is here to get you onboarded fast. Reach out anytime.
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={rs(16)} color={C.red} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: rs(30) }} />
      </ScrollView>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, tone, label, badge, hint }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={styles.sectionLabelWrap}>
      <View style={styles.sectionLabelRow}>
        <View style={[styles.sectionLabelIcon, { backgroundColor: t.tint }]}>
          <Ionicons name={icon} size={rs(13)} color={t.ink} />
        </View>
        <Text style={[styles.sectionLabelText, { color: t.ink }]}>{label}</Text>
        {!!badge && (
          <View style={[styles.sectionLabelBadge, { backgroundColor: t.tint }]}>
            <Text style={[styles.sectionLabelBadgeText, { color: t.ink }]}>{badge}</Text>
          </View>
        )}
      </View>
      {!!hint && <Text style={styles.sectionLabelHint}>{hint}</Text>}
    </View>
  );
}

// Checklist row rendered as a TIMELINE: a numbered node in a left gutter with
// a connector running down to the next step, and the step's card beside it.
// Done steps get a filled gradient node, a tinted card and a solid connector.
function StepCard({ step, number, isLast }) {
  const done = step.done;
  const t = TONES[step.tone] || TONES.emerald;

  return (
    <View style={styles.stepRow}>
      {/* ── Timeline gutter ── */}
      <View style={styles.stepGutter}>
        {done ? (
          <LinearGradient
            colors={G.emerald}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.stepNode}
          >
            <Ionicons name="checkmark" size={rs(16)} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[styles.stepNode, styles.stepNodePending, { borderColor: t.ink }]}>
            <Text style={[styles.stepNodeText, { color: t.ink }]}>{number}</Text>
          </View>
        )}

        {!isLast && (
          <View
            style={[
              styles.stepLine,
              { backgroundColor: done ? alpha(C.emeraldDeep, 0.35) : C.border },
            ]}
          />
        )}
      </View>

      {/* ── Card ── */}
      <TouchableOpacity
        style={[styles.stepCard, rowShadow, done && styles.stepCardDone]}
        onPress={step.onPress}
        activeOpacity={0.9}
      >
        <View style={styles.stepHead}>
          {done ? (
            <View style={[styles.stepIconTile, { backgroundColor: alpha(C.emeraldDeep, 0.12) }]}>
              <Ionicons name={step.icon} size={rs(17)} color={C.emeraldDeep} />
            </View>
          ) : (
            <LinearGradient
              colors={t.grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.stepIconTile}
            >
              <Ionicons name={step.icon} size={rs(17)} color="#fff" />
            </LinearGradient>
          )}

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.stepTitleRow}>
              <Text
                style={[styles.stepTitle, done && { color: C.emeraldDeep }]}
                numberOfLines={2}
              >
                {step.title}
              </Text>
              {done && (
                <View style={styles.doneBadge}>
                  <Ionicons name="checkmark-circle" size={rs(10)} color={C.emeraldDeep} />
                  <Text style={styles.doneBadgeText}>DONE</Text>
                </View>
              )}
            </View>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </View>
        </View>

        {/* Footer CTA — full-width row under a hairline */}
        <View style={styles.stepCtaRow}>
          <Text style={[styles.stepCtaText, { color: done ? C.emeraldDeep : t.ink }]}>
            {step.cta}
          </Text>
          <View
            style={[
              styles.stepCtaChip,
              { backgroundColor: done ? alpha(C.emeraldDeep, 0.1) : t.tint },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={rs(13)}
              color={done ? C.emeraldDeep : t.ink}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function StatTile({ icon, tone, value, label }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={[styles.statTile, rowShadow]}>
      <View style={[styles.statTileIcon, { backgroundColor: t.tint }]}>
        <Ionicons name={icon} size={rs(15)} color={t.ink} />
      </View>
      <Text style={[styles.statTileValue, { color: t.ink }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function FeatureTile({ icon, tone, label, sub, onPress }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <TouchableOpacity
      style={[styles.featureTile, rowShadow]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={t.grad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.featureIcon}
      >
        <Ionicons name={icon} size={rs(19)} color="#fff" />
      </LinearGradient>
      <Text style={styles.featureLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.featureSub} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(60), right: -rs(40),
    width: rs(190), height: rs(190), borderRadius: rs(95),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(70), left: -rs(50),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  heroTop: {
    flexDirection: "row", alignItems: "center",
    gap: rs(10), paddingTop: rs(8),
  },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  // Height pinned to circleBtn's so the chip and the back button sit on the
  // same optical line. Previously it was padding-derived (~27px vs 38px) with
  // no lineHeight on the label, so its height varied with the serif metrics.
  statusChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(5), height: rs(38), flexShrink: 1,
    paddingHorizontal: rs(13), borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  statusChipText: {
    fontFamily: DISPLAY, color: "#fff", fontSize: rf(10.5), lineHeight: rf(14),
    fontWeight: "bold", letterSpacing: 0.6, flexShrink: 1,
  },

  // One block owns the title→sub rhythm; the block owns its distance from the
  // button row. All lineHeights explicit so serif metrics can't shift spacing.
  heroTextBlock: { marginTop: rs(18) },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(22), lineHeight: rf(28),
    color: "#fff", letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(12), lineHeight: rf(16),
    color: "rgba(255,255,255,0.72)", fontWeight: "bold", marginTop: rs(4),
  },

  // Compact progress: two pills on one line, then a full-width rail.
  heroPillRow: {
    flexDirection: "row", alignItems: "center",
    flexWrap: "wrap", gap: rs(8), marginTop: rs(16),
  },
  heroPctPill: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    height: rs(28), paddingHorizontal: rs(11), borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  heroPct: {
    fontFamily: DISPLAY, fontSize: rf(14), lineHeight: rf(18),
    color: "#fff", letterSpacing: -0.2,
  },
  // Nested inside heroPct so RN baseline-aligns it with the number.
  heroPctSign: { fontSize: rf(10), color: "rgba(255,255,255,0.65)" },
  heroPctCaption: {
    fontFamily: DISPLAY, fontSize: rf(8.5), lineHeight: rf(12),
    color: "rgba(255,255,255,0.55)", fontWeight: "bold", letterSpacing: 0.8,
  },
  heroDonePill: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(4), height: rs(28), paddingHorizontal: rs(10), borderRadius: 999,
    backgroundColor: "#fff",
  },
  heroDoneText: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(13),
    fontWeight: "bold", color: C.emeraldDeep, letterSpacing: 0.5,
  },
  heroBarTrack: {
    height: rs(7), backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: rs(4), overflow: "hidden", marginTop: rs(12),
  },
  heroBarFill: { height: "100%", borderRadius: rs(4) },

  // ── Status card ──
  statusWrap: { marginHorizontal: GUT, marginTop: -STATUS_OVERLAP },
  statusCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    backgroundColor: C.card, borderRadius: rs(18), padding: rs(14),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  statusIconBox: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center",
  },
  statusTitle: { fontFamily: DISPLAY, fontSize: rf(14.5), fontWeight: "bold" },
  statusDesc: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    marginTop: rs(3), lineHeight: rf(16), fontWeight: "600",
  },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: rs(12) },
  loadingText: { fontFamily: DISPLAY, fontSize: rf(13), color: C.muted, fontWeight: "600" },

  scroll: { paddingHorizontal: GUT, paddingTop: rs(18), paddingBottom: rs(16) },

  // ── Celebrate card ──
  celebrateCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(14), borderRadius: rs(16),
    backgroundColor: C.tintEmerald, borderWidth: 1, borderColor: C.border,
    marginBottom: rs(16),
  },
  celebrateIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(13),
    backgroundColor: "rgba(28,107,82,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  celebrateTitle: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", color: C.emeraldDeep },
  celebrateBody: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    marginTop: rs(3), lineHeight: rf(16), fontWeight: "600",
  },

  // ── Section label ──
  sectionLabelWrap: { marginTop: rs(6), marginBottom: rs(11) },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: rs(7) },
  sectionLabelIcon: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  sectionLabelText: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(11.5), fontWeight: "bold",
    letterSpacing: 0.6, textTransform: "uppercase",
  },
  sectionLabelBadge: { paddingHorizontal: rs(9), paddingVertical: rs(3), borderRadius: 999 },
  sectionLabelBadgeText: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold" },
  sectionLabelHint: {
    fontFamily: DISPLAY, fontSize: rf(11), color: C.muted,
    fontWeight: "600", marginTop: rs(4), marginLeft: rs(33), fontStyle: "italic",
  },

  // ── Step timeline ──
  stepRow: { flexDirection: "row", gap: rs(11) },
  stepGutter: { width: rs(32), alignItems: "center" },
  stepNode: {
    width: rs(30), height: rs(30), borderRadius: rs(15),
    alignItems: "center", justifyContent: "center", marginTop: rs(3),
  },
  stepNodePending: { backgroundColor: C.card, borderWidth: 2 },
  stepNodeText: { fontFamily: DISPLAY, fontSize: rf(13), lineHeight: rf(17), fontWeight: "bold" },
  // Connector down to the next node; flex fills the card's height.
  stepLine: { width: rs(2), flex: 1, marginVertical: rs(4), borderRadius: rs(1) },

  stepCard: {
    flex: 1, minWidth: 0,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: rs(16), padding: rs(13), marginBottom: rs(12),
  },
  stepCardDone: { backgroundColor: C.tintEmerald, borderColor: "rgba(28,107,82,0.18)" },

  stepHead: { flexDirection: "row", alignItems: "flex-start", gap: rs(11) },
  stepIconTile: {
    width: rs(36), height: rs(36), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
  },
  stepTitleRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  stepTitle: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(14), lineHeight: rf(19),
    fontWeight: "bold", color: C.ink,
  },
  doneBadge: {
    flexDirection: "row", alignItems: "center", gap: rs(3),
    paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(5),
    backgroundColor: "rgba(28,107,82,0.12)", flexShrink: 0,
  },
  doneBadgeText: {
    fontFamily: DISPLAY, fontSize: rf(9), lineHeight: rf(12), color: C.emeraldDeep,
    fontWeight: "bold", letterSpacing: 0.4,
  },
  stepDesc: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    marginTop: rs(4), lineHeight: rf(16), fontWeight: "600",
  },

  // CTA sits on its own row under a hairline — reads as the card's action.
  stepCtaRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: rs(10), marginTop: rs(12), paddingTop: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  stepCtaText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(16),
    fontWeight: "bold", flexShrink: 1,
  },
  stepCtaChip: {
    width: rs(28), height: rs(28), borderRadius: rs(10),
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  // ── Stats grid (approved) ──
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: rs(9), marginBottom: rs(6) },
  statTile: {
    width: "47.5%",
    backgroundColor: C.card, borderRadius: rs(14), padding: rs(12),
    borderWidth: 1, borderColor: C.border,
  },
  statTileIcon: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    alignItems: "center", justifyContent: "center", marginBottom: rs(8),
  },
  statTileValue: { fontFamily: DISPLAY, fontSize: rf(22), lineHeight: rf(26) },
  statTileLabel: {
    fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted, fontWeight: "bold",
    marginTop: rs(2), letterSpacing: 0.4, textTransform: "uppercase",
  },

  // ── Features grid (3 cols) ──
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: rs(9) },
  featureTile: {
    width: "31.2%",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: rs(14), paddingVertical: rs(13), paddingHorizontal: rs(8),
    alignItems: "center", gap: rs(5),
  },
  featureIcon: {
    width: rs(42), height: rs(42), borderRadius: rs(14),
    alignItems: "center", justifyContent: "center", marginBottom: rs(4),
  },
  featureLabel: { fontFamily: DISPLAY, fontSize: rf(12), fontWeight: "bold", color: C.ink },
  featureSub: {
    fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted,
    fontWeight: "600", textAlign: "center",
  },

  // ── Help card ──
  helpCard: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    padding: rs(14), borderRadius: rs(16), marginTop: rs(18),
    backgroundColor: C.tintSand, borderWidth: 1, borderColor: C.border,
  },
  helpIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(13),
    backgroundColor: "rgba(28,107,82,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  helpTitle: { fontFamily: DISPLAY, fontSize: rf(13.5), fontWeight: "bold", color: C.emeraldDeep },
  helpBody: {
    fontFamily: DISPLAY, fontSize: rf(11.5), color: C.sub,
    marginTop: rs(2), fontWeight: "600", lineHeight: rf(16),
  },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginTop: rs(14), padding: rs(11),
    backgroundColor: C.redL, borderRadius: rs(12),
    borderWidth: 1, borderColor: "rgba(192,69,59,0.22)",
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), flex: 1, fontWeight: "600" },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: rf(12.5) },
});
