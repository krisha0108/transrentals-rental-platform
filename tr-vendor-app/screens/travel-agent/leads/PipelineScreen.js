// screens/travel-agent/leads/PipelineScreen.js
// REDESIGNED — matches the Leads screen design language (warm forest/emerald
// palette, hero with decorative orbs + glass stat cards, rs/rf scaling).
// Horizontal kanban with 6 stage columns (NEW / CONTACTED / INTERESTED /
// QUOTED / NEGOTIATING / BOOKED). Each card has a priority stripe + value
// pill. Long-press → "Move to…" bottom-sheet.
//
// Data & behaviour are UNCHANGED — this is a UI-only redesign.
// Data: GET /api/travel-agent/leads?limit=100 → active stages only.
// Move: PATCH /api/travel-agent/leads/[id] { status }.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { DISPLAY } from "../_shared/typography";
import {
  listTravelAgentPipelineLeads,
  setTravelAgentLeadStatus,
  PIPELINE_STAGES,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";

const { width: W } = Dimensions.get("window");

// ── Responsive scaling (same as Leads / TA dashboard) ────────────────
const BASE_W = 390;
const SCALE = Math.min(Math.max(W / BASE_W, 0.86), 1.28);
const FONT_SCALE = Math.min(Math.max(W / BASE_W, 0.92), 1.12);
const rs = (n) => Math.round(n * SCALE);
const rf = (n) => Math.round(n * FONT_SCALE * 2) / 2;
const GUT = rs(16);


const G = {
  hero:    [C.forestDark, C.forest, C.emeraldDeep],
  emerald: [C.emerald, C.emeraldDeep],
};

// Each stage gets a distinct accent aligned with the Leads status tones,
// so a stage reads the same colour on both screens.
const STAGE_META = {
  NEW:         { color: "#245C7A", light: C.tintOcean, icon: "sparkles",         label: "New" },
  CONTACTED:   { color: "#0F6B5A", light: "#DDEFEA",   icon: "call",             label: "Contacted" },
  INTERESTED:  { color: "#9A6B16", light: "#F8F0DC",   icon: "heart",            label: "Interested" },
  QUOTED:      { color: "#5E43A8", light: "#EFE9FA",   icon: "document-text",    label: "Quoted" },
  NEGOTIATING: { color: "#3A4E8C", light: "#E4EAF7",   icon: "swap-horizontal",  label: "Negotiating" },
  BOOKED:      { color: "#B14A64", light: "#FBE9EE",   icon: "checkmark-circle", label: "Booked" },
};
const PRIORITY_META = {
  HOT:  { color: "#B14A64", light: "#FBE9EE", icon: "flame", label: "Hot" },
  WARM: { color: "#9A6B16", light: C.tintGold, icon: "sunny", label: "Warm" },
  COLD: { color: "#245C7A", light: C.tintOcean, icon: "snow", label: "Cold" },
};

// Column ~84% of screen so the next column still peeks (discoverability).
const COLUMN_WIDTH = Math.min(rs(300), Math.round(W * 0.84));

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch { return null; }
}
const INR = (n) => {
  if (n == null || isNaN(Number(n))) return null;
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
};

// Slowly drifting/pulsing decorative orb for the header — gentle ambient motion.
function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 5200, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return (
    <Animated.View pointerEvents="none" style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]} />
  );
}

export default function PipelineScreen({ navigation }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movingLead, setMovingLead] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentPipelineLeads({ limit: 100 });
      const active = (data.leads || []).filter((l) => PIPELINE_STAGES.includes(l.status));
      setLeads(active);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const columns = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      const items = leads.filter((l) => l.status === stage);
      const total = items.reduce(
        (sum, l) => sum + Number(l.quotedAmount || l.estimatedValue || 0),
        0
      );
      return { stage, items, total };
    });
  }, [leads]);

  // Aggregate stats for the hero glass cards.
  const stats = useMemo(() => {
    const totalValue = leads.reduce(
      (sum, l) => sum + Number(l.quotedAmount || l.estimatedValue || 0), 0
    );
    const hot = leads.filter((l) => l.priority === "HOT").length;
    const booked = leads.filter((l) => l.status === "BOOKED").length;
    return { total: leads.length, totalValue, hot, booked };
  }, [leads]);

  const moveLead = async (lead, toStatus) => {
    setMovingLead(null);
    if (toStatus === lead.status) return;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: toStatus } : l)));
    try {
      await setTravelAgentLeadStatus(lead.id, toStatus);
    } catch (e) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to move lead");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Hero ── */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
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
            <TouchableOpacity
              onPress={load}
              style={styles.circleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh" size={rs(17)} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Pipeline</Text>
          <Text style={styles.heroSub}>Tap to open · long-press to move stage</Text>

          {/* four glass stats */}
          <View style={styles.statRow}>
            <HeroStat dot={C.emerald}    label="Leads"    value={String(stats.total)} />
            <HeroStat dot={C.goldLight}  label="Pipeline" value={INR(stats.totalValue) || "—"} />
            <HeroStat dot="#E0798F"      label="Hot"      value={String(stats.hot)} />
            <HeroStat dot={C.oceanLight} label="Booked"   value={String(stats.booked)} />
          </View>

          <View style={{ height: rs(12) }} />
        </SafeAreaView>
      </LinearGradient>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={rs(15)} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald} />
          <Text style={styles.loadingText}>Loading pipeline…</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.boardContent}
        >
          {columns.map((col) => {
            const meta = STAGE_META[col.stage];
            return (
              <View key={col.stage} style={[styles.column, { width: COLUMN_WIDTH }]}>
                {/* Column header */}
                <View style={styles.columnHeader}>
                  <View style={[styles.columnIconChip, { backgroundColor: meta.light }]}>
                    <Ionicons name={meta.icon} size={rs(13)} color={meta.color} />
                  </View>
                  <Text style={styles.columnTitle} numberOfLines={1}>{meta.label}</Text>
                  <View style={[styles.columnBadge, { backgroundColor: meta.light }]}>
                    <Text style={[styles.columnBadgeText, { color: meta.color }]}>
                      {col.items.length}
                    </Text>
                  </View>
                </View>

                {/* Value bar — total quoted/estimated for column */}
                {col.total > 0 && (
                  <View style={styles.columnValueBar}>
                    <Ionicons name="trending-up" size={rs(11)} color={meta.color} />
                    <Text style={[styles.columnValueText, { color: meta.color }]}>
                      {INR(col.total)} pipeline value
                    </Text>
                  </View>
                )}

                {/* Cards */}
                <ScrollView
                  style={styles.columnScroll}
                  contentContainerStyle={{ paddingBottom: rs(16) }}
                  showsVerticalScrollIndicator={false}
                >
                  {col.items.length === 0 ? (
                    <View style={styles.emptyCol}>
                      <View style={[styles.emptyColIcon, { backgroundColor: meta.light }]}>
                        <Ionicons name={meta.icon} size={rs(18)} color={meta.color} />
                      </View>
                      <Text style={styles.emptyColText}>No leads here</Text>
                      <Text style={styles.emptyColSub}>
                        {col.stage === "NEW" ? "New leads land here" : "Move leads from other stages"}
                      </Text>
                    </View>
                  ) : (
                    col.items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stageColor={meta.color}
                        onPress={() =>
                          navigation.navigate("TALeadDetail", {
                            id: lead.id,
                            customerName: lead.customerName,
                          })
                        }
                        onLongPress={() => setMovingLead(lead)}
                      />
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Move-to bottom sheet ── */}
      <Modal
        visible={!!movingLead}
        animationType="slide"
        transparent
        onRequestClose={() => setMovingLead(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalHeaderGrad}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="swap-horizontal" size={rs(19)} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.modalTitle}>Move lead</Text>
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {movingLead?.customerName || "Customer"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setMovingLead(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={rs(21)} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={{ padding: rs(14) }}>
              {PIPELINE_STAGES.map((stage) => {
                const active = movingLead?.status === stage;
                const meta = STAGE_META[stage];
                return (
                  <TouchableOpacity
                    key={stage}
                    style={[
                      styles.moveItem,
                      active && { backgroundColor: meta.light, borderColor: meta.color },
                    ]}
                    disabled={active}
                    onPress={() => moveLead(movingLead, stage)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.moveItemIconWrap, { backgroundColor: active ? meta.color : meta.light }]}>
                      <Ionicons name={meta.icon} size={rs(16)} color={active ? "#fff" : meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moveItemText, { color: meta.color }]}>{meta.label}</Text>
                      {active && <Text style={styles.moveCurrent}>Current stage</Text>}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={rs(20)} color={meta.color} />
                    ) : (
                      <Ionicons name="arrow-forward" size={rs(18)} color={C.muted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function HeroStat({ dot, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statDot, { backgroundColor: dot }]} />
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </Text>
    </View>
  );
}

function LeadCard({ lead, stageColor, onPress, onLongPress }) {
  const pMeta = PRIORITY_META[lead.priority] || PRIORITY_META.WARM;
  const valLabel = INR(lead.quotedAmount || lead.estimatedValue);
  const isQuoted = !!lead.quotedAmount;
  return (
    <TouchableOpacity
      style={[styles.leadCard, styles.cardShadow]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {/* Left priority stripe */}
      <View style={[styles.leadStripe, { backgroundColor: pMeta.color }]} />

      <View style={styles.leadBody}>
        {/* Top row: priority pill + name */}
        <View style={styles.leadTopRow}>
          <View style={[styles.priorityPill, { backgroundColor: pMeta.light }]}>
            <Ionicons name={pMeta.icon} size={rs(9)} color={pMeta.color} />
            <Text style={[styles.priorityText, { color: pMeta.color }]}>{pMeta.label}</Text>
          </View>
          <Text style={styles.leadName} numberOfLines={1}>
            {lead.customerName || "—"}
          </Text>
        </View>

        {!!lead.destination && (
          <View style={styles.leadMetaRow}>
            <Ionicons name="location-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.leadMetaText} numberOfLines={1}>{lead.destination}</Text>
          </View>
        )}

        {(lead.travelDate || lead.passengers) && (
          <View style={styles.leadMetaRow}>
            <Ionicons name="calendar-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.leadMetaText} numberOfLines={1}>
              {formatDate(lead.travelDate)}
              {lead.passengers ? `  ·  ${lead.passengers} pax` : ""}
            </Text>
          </View>
        )}

        {!!valLabel && (
          <View style={styles.leadFooter}>
            {isQuoted && (
              <View style={[styles.quotedTag, { backgroundColor: `${stageColor}1A` }]}>
                <Text style={[styles.quotedTagText, { color: stageColor }]}>QUOTED</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <View style={styles.leadValueWrap}>
              <Ionicons name="cash-outline" size={rs(10)} color={C.emeraldDeep} />
              <Text style={styles.leadValue}>{valLabel}</Text>
            </View>
          </View>
        )}
      </View>
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
  heroTop: { flexDirection: "row", alignItems: "center", paddingTop: rs(6) },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(23), color: "#fff",
    letterSpacing: 0.2, marginTop: rs(7),
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(12), color: "rgba(255,255,255,0.7)",
    fontWeight: "bold", marginTop: rs(2),
  },

  statRow: { flexDirection: "row", gap: rs(8), marginTop: rs(9), alignItems: "stretch" },
  statCard: {
    flex: 1, minWidth: 0,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    borderRadius: rs(14), paddingHorizontal: rs(9), paddingVertical: rs(9),
    justifyContent: "space-between",
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: rs(4), minHeight: rf(13) },
  statDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  statLabel: {
    fontFamily: DISPLAY, fontSize: rf(8.5), fontWeight: "bold",
    color: "rgba(255,255,255,0.6)", letterSpacing: 0.5,
    textTransform: "uppercase", flexShrink: 1,
  },
  statValue: {
    fontFamily: DISPLAY, fontSize: rf(19), lineHeight: rf(23), color: "#fff",
    letterSpacing: -0.4, marginTop: rs(4),
  },

  // ── Error / loading ──
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(12), padding: rs(11),
    backgroundColor: "#FBEDEB", borderRadius: rs(12),
    borderWidth: 1, borderColor: "rgba(192,69,59,0.2)",
  },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), flex: 1, fontWeight: "bold" },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontSize: rf(12.5), fontWeight: "bold", textDecorationLine: "underline" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: rs(12) },
  loadingText: { fontFamily: DISPLAY, fontSize: rf(13), color: C.sub, fontWeight: "bold" },

  // ── Board / column ──
  boardContent: { paddingHorizontal: GUT - rs(4), paddingTop: rs(16), paddingBottom: rs(10) },
  column: {
    marginHorizontal: rs(4),
    backgroundColor: "#FBFAF6",
    borderRadius: rs(18),
    overflow: "hidden",
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: C.border,
  },

  columnHeader: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    paddingHorizontal: rs(12), paddingVertical: rs(11),
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  columnIconChip: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  columnTitle: { fontFamily: DISPLAY, flex: 1, fontSize: rf(14), fontWeight: "bold", color: C.ink, letterSpacing: 0.2 },
  columnBadge: { minWidth: rs(24), height: rs(22), paddingHorizontal: rs(8), borderRadius: rs(11), alignItems: "center", justifyContent: "center" },
  columnBadgeText: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold" },

  columnValueBar: { flexDirection: "row", alignItems: "center", gap: rs(5), paddingHorizontal: rs(12), paddingVertical: rs(7) },
  columnValueText: { fontFamily: DISPLAY, fontSize: rf(10.5), fontWeight: "bold", letterSpacing: 0.2 },

  columnScroll: { flex: 1, paddingHorizontal: rs(8), paddingTop: rs(6) },

  // ── Empty column placeholder ──
  emptyCol: { padding: rs(16), alignItems: "center", gap: rs(6) },
  emptyColIcon: { width: rs(38), height: rs(38), borderRadius: rs(13), alignItems: "center", justifyContent: "center" },
  emptyColText: { fontFamily: DISPLAY, color: C.text, fontSize: rf(12), fontWeight: "bold", marginTop: rs(4) },
  emptyColSub: { fontFamily: DISPLAY, color: C.muted, fontSize: rf(10.5), fontWeight: "bold", textAlign: "center" },

  // ── Lead card ──
  cardShadow: {
    shadowColor: "#13211C", shadowOpacity: 0.06, shadowRadius: rs(6),
    shadowOffset: { width: 0, height: rs(2) }, elevation: 2,
  },
  leadCard: {
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.border,
    marginBottom: rs(9), overflow: "hidden",
    flexDirection: "row",
  },
  leadStripe: { width: rs(4) },
  leadBody: { flex: 1, padding: rs(11) },

  leadTopRow: { flexDirection: "row", alignItems: "center", gap: rs(6), marginBottom: rs(6) },
  priorityPill: { flexDirection: "row", alignItems: "center", gap: rs(3), paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: 999 },
  priorityText: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold", letterSpacing: 0.3 },
  leadName: { fontFamily: DISPLAY, flex: 1, fontSize: rf(13), fontWeight: "bold", color: C.ink },

  leadMetaRow: { flexDirection: "row", alignItems: "center", gap: rs(5), marginTop: rs(3) },
  leadMetaText: { fontFamily: DISPLAY, fontSize: rf(11), color: C.sub, fontWeight: "bold", flex: 1 },

  leadFooter: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: rs(9) },
  quotedTag: { paddingHorizontal: rs(5), paddingVertical: rs(1), borderRadius: rs(5) },
  quotedTagText: { fontFamily: DISPLAY, fontSize: rf(9), fontWeight: "bold", letterSpacing: 0.3 },
  leadValueWrap: { flexDirection: "row", alignItems: "center", gap: rs(3), paddingHorizontal: rs(7), paddingVertical: rs(3), borderRadius: rs(8), backgroundColor: C.tintEmerald },
  leadValue: { fontFamily: DISPLAY, fontSize: rf(11.5), fontWeight: "bold", color: C.emeraldDeep },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,42,34,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    paddingBottom: Platform.OS === "ios" ? rs(24) : rs(12),
    overflow: "hidden",
  },
  modalHeaderGrad: { paddingHorizontal: rs(16), paddingVertical: rs(16) },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: rs(12) },
  modalHeaderIcon: { width: rs(40), height: rs(40), borderRadius: rs(13), backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontFamily: DISPLAY, fontSize: rf(17), fontWeight: "bold", color: "#fff" },
  modalSub: { fontFamily: DISPLAY, fontSize: rf(12), color: "rgba(255,255,255,0.8)", fontWeight: "bold", marginTop: rs(1) },
  modalCloseBtn: { width: rs(36), height: rs(36), borderRadius: rs(11), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  moveItem: {
    flexDirection: "row", alignItems: "center", gap: rs(12),
    paddingVertical: rs(12), paddingHorizontal: rs(12),
    borderRadius: rs(13), marginBottom: rs(6),
    backgroundColor: "#FBFAF6",
    borderWidth: 1.5, borderColor: C.border,
  },
  moveItemIconWrap: { width: rs(36), height: rs(36), borderRadius: rs(12), alignItems: "center", justifyContent: "center" },
  moveItemText: { fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", letterSpacing: 0.2 },
  moveCurrent: { fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: "bold", marginTop: rs(1) },
});
