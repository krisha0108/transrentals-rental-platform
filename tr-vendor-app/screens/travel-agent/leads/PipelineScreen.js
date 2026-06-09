// screens/travel-agent/leads/PipelineScreen.js
// REDESIGNED — emerald-themed kanban pipeline.
// Horizontal scroll with 6 stage columns (NEW / CONTACTED / INTERESTED /
// QUOTED / NEGOTIATING / BOOKED). Each card has a priority stripe + value
// pill. Long-press → "Move to…" bottom-sheet.
//
// Data: GET /api/travel-agent/leads?limit=100 → active stages only.
// Move: PATCH /api/travel-agent/leads/[id] { status }.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
import {
  listTravelAgentPipelineLeads,
  setTravelAgentLeadStatus,
  PIPELINE_STAGES,
} from "../../api/travelAgentClient";

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
};

// Each stage gets a distinct accent + icon so the board reads at a glance.
const STAGE_META = {
  NEW:         { color: "#3B82F6", light: "#DBEAFE", icon: "sparkles",      label: "New" },
  CONTACTED:   { color: "#06B6D4", light: "#CFFAFE", icon: "call",          label: "Contacted" },
  INTERESTED:  { color: "#10B981", light: "#D1FAE5", icon: "heart",         label: "Interested" },
  QUOTED:      { color: "#8B5CF6", light: "#EDE9FE", icon: "document-text", label: "Quoted" },
  NEGOTIATING: { color: "#6366F1", light: "#E0E7FF", icon: "swap-horizontal", label: "Negotiating" },
  BOOKED:      { color: "#15803D", light: "#DCFCE7", icon: "checkmark-circle", label: "Booked" },
};
const PRIORITY_META = {
  HOT:  { color: C.red,    icon: "flame",     label: "Hot" },
  WARM: { color: C.amber,  icon: "sunny",     label: "Warm" },
  COLD: { color: C.blue,   icon: "snow",      label: "Cold" },
};

const SCREEN_W = Dimensions.get("window").width;
// Column ~78% of screen so the next column peeks (discoverability).
const COLUMN_WIDTH = Math.min(280, Math.round(SCREEN_W * 0.78));

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

  // Aggregate stats for the floating summary card.
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
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 28 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Pipeline</Text>
              <Text style={styles.headerSub}>
                Tap to view · Long-press to move stage
              </Text>
            </View>
            <TouchableOpacity onPress={load} style={styles.iconBtn}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell value={stats.total} label="Leads" icon="people" color={C.emerald600} />
        <View style={styles.statDivider} />
        <StatCell
          value={INR(stats.totalValue) || "—"}
          label="Pipeline"
          icon="cash"
          color={C.amber}
          isText
        />
        <View style={styles.statDivider} />
        <StatCell value={stats.hot} label="Hot" icon="flame" color={C.red} />
        <View style={styles.statDivider} />
        <StatCell value={stats.booked} label="Booked" icon="checkmark-circle" color="#15803D" />
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
                {/* Column gradient header */}
                <LinearGradient
                  colors={[meta.color, shade(meta.color, -10)]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.columnHeaderGrad}
                >
                  <View style={styles.columnHeaderIconWrap}>
                    <Ionicons name={meta.icon} size={14} color="#fff" />
                  </View>
                  <Text style={styles.columnHeaderTitle} numberOfLines={1}>
                    {meta.label}
                  </Text>
                  <View style={styles.columnHeaderBadge}>
                    <Text style={[styles.columnHeaderBadgeText, { color: meta.color }]}>
                      {col.items.length}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Value bar — total quoted/estimated for column */}
                {col.total > 0 ? (
                  <View style={[styles.columnValueBar, { backgroundColor: meta.light }]}>
                    <Ionicons name="trending-up" size={11} color={meta.color} />
                    <Text style={[styles.columnValueText, { color: meta.color }]}>
                      {INR(col.total)} pipeline value
                    </Text>
                  </View>
                ) : (
                  <View style={styles.columnValueBarEmpty} />
                )}

                {/* Cards */}
                <ScrollView
                  style={styles.columnScroll}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  {col.items.length === 0 ? (
                    <View style={styles.emptyCol}>
                      <View style={[styles.emptyColIcon, { backgroundColor: meta.light }]}>
                        <Ionicons name={meta.icon} size={18} color={meta.color} />
                      </View>
                      <Text style={styles.emptyColText}>No leads here</Text>
                      <Text style={styles.emptyColSub}>
                        {col.stage === "NEW"
                          ? "New leads land here"
                          : "Move leads from other stages"}
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

      {/* ===== Move-to bottom sheet ===== */}
      <Modal
        visible={!!movingLead}
        animationType="slide"
        transparent
        onRequestClose={() => setMovingLead(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <LinearGradient
              colors={["#022C22", "#064E3B", "#047857"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.modalHeaderGrad}
            >
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="swap-horizontal" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.modalTitle}>Move lead</Text>
                  <Text style={styles.modalSub} numberOfLines={1}>
                    {movingLead?.customerName || "Customer"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMovingLead(null)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={{ padding: 14 }}>
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
                    <View style={[styles.moveItemIconWrap, { backgroundColor: active ? meta.color : `${meta.color}22` }]}>
                      <Ionicons name={meta.icon} size={16} color={active ? "#fff" : meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moveItemText, { color: meta.color }]}>{meta.label}</Text>
                      {active && (
                        <Text style={styles.moveCurrent}>Current stage</Text>
                      )}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={meta.color} />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color={C.subText} />
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

function StatCell({ value, label, icon, color, isText }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text
          style={[styles.statValue, { color, fontSize: isText ? 13 : 15 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function LeadCard({ lead, stageColor, onPress, onLongPress }) {
  const pMeta = PRIORITY_META[lead.priority] || PRIORITY_META.WARM;
  const valLabel = INR(lead.quotedAmount || lead.estimatedValue);
  const isQuoted = !!lead.quotedAmount;
  return (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      {/* Left priority stripe */}
      <View style={[styles.leadStripe, { backgroundColor: pMeta.color }]} />

      <View style={styles.leadBody}>
        {/* Top row: priority pill + name */}
        <View style={styles.leadTopRow}>
          <View style={[styles.priorityPill, { backgroundColor: `${pMeta.color}1A` }]}>
            <Ionicons name={pMeta.icon} size={9} color={pMeta.color} />
            <Text style={[styles.priorityText, { color: pMeta.color }]}>{pMeta.label}</Text>
          </View>
          <Text style={styles.leadName} numberOfLines={1}>
            {lead.customerName || "—"}
          </Text>
        </View>

        {!!lead.destination && (
          <View style={styles.leadMetaRow}>
            <Ionicons name="location" size={10} color={C.subText} />
            <Text style={styles.leadMetaText} numberOfLines={1}>{lead.destination}</Text>
          </View>
        )}

        {(lead.travelDate || lead.passengers) && (
          <View style={styles.leadMetaRow}>
            <Ionicons name="calendar" size={10} color={C.subText} />
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
              <Text style={styles.leadValue}>{valLabel}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ───────── Helpers ───────── */

// Lighten/darken hex shade by `pct` (-100 to 100). Used for column header
// gradient endpoint.
function shade(hex, pct) {
  const f = parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0xff;
  const B = f & 0xff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  // Floating stats
  statsCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: C.card, marginHorizontal: 16, marginTop: -22,
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1, justifyContent: "center", minWidth: 0 },
  statIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontWeight: "900" },
  statLabel: { fontSize: 9.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.2 },
  statDivider: { width: 1, height: 26, backgroundColor: C.border },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  // Board / column
  boardContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 },
  column: {
    marginRight: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: C.border,
  },

  // Column header (gradient)
  columnHeaderGrad: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  columnHeaderIconWrap: {
    width: 26, height: 26, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  columnHeaderTitle: { flex: 1, fontSize: 14, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  columnHeaderBadge: { minWidth: 26, height: 22, paddingHorizontal: 8, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  columnHeaderBadgeText: { fontSize: 11.5, fontWeight: "900" },

  // Value bar under header
  columnValueBar: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6 },
  columnValueText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },
  columnValueBarEmpty: { height: 4 },

  columnScroll: { flex: 1, paddingHorizontal: 8, paddingTop: 8 },

  // Empty column placeholder
  emptyCol: { padding: 16, alignItems: "center", gap: 6 },
  emptyColIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emptyColText: { color: C.text, fontSize: 12, fontWeight: "800", marginTop: 4 },
  emptyColSub: { color: C.subText, fontSize: 10.5, fontWeight: "600", textAlign: "center" },

  // Lead card
  leadCard: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 8, overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  leadStripe: { width: 3 },
  leadBody: { flex: 1, padding: 10 },

  leadTopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  priorityPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 999 },
  priorityText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  leadName: { flex: 1, fontSize: 13, fontWeight: "800", color: C.ink },

  leadMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  leadMetaText: { fontSize: 11, color: C.subText, fontWeight: "600", flex: 1 },

  leadFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  quotedTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  quotedTagText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  leadValueWrap: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: C.emerald50 },
  leadValue: { fontSize: 11.5, fontWeight: "900", color: C.emerald700 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    overflow: "hidden",
  },
  modalHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  modalSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  moveItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 6,
    backgroundColor: "#FAFBFC",
    borderWidth: 1.5, borderColor: C.border,
  },
  moveItemIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  moveItemText: { fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  moveCurrent: { fontSize: 11, color: C.subText, fontWeight: "700", marginTop: 1 },
});
