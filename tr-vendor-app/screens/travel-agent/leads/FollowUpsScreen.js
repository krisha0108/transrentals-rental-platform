// screens/travel-agent/leads/FollowUpsScreen.js
// REDESIGNED — emerald-themed follow-ups inbox.
// Three buckets: Overdue / Today / Upcoming (next 7 days), with quick actions
// (call, whatsapp, mark contacted, snooze).
//
// Backend: GET /api/travel-agent/follow-ups → { overdue, today, upcoming, counts }
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  getTravelAgentFollowUps,
  updateTravelAgentLead,
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
  blueLight: "#EFF6FF",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
};

// Bucket meta: color + light bg + icon + title + label, used everywhere
// (row stripe, bucket header, due pill).
const BUCKET_META = {
  overdue:  { color: C.red,    light: C.redLight,    icon: "alert-circle",   title: "Overdue",  hint: "These slipped past — chase them today" },
  today:    { color: C.amber,  light: C.amberLight,  icon: "today",          title: "Today",    hint: "Due today" },
  upcoming: { color: C.blue,   light: C.blueLight,   icon: "calendar",       title: "Upcoming", hint: "Next 7 days" },
};

const PRIORITY_META = {
  HOT:  { color: C.red,   icon: "flame", label: "Hot" },
  WARM: { color: C.amber, icon: "sunny", label: "Warm" },
  COLD: { color: C.blue,  icon: "snow",  label: "Cold" },
};

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}
function dueLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - today) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

const SNOOZE_PRESETS = [
  { key: "tomorrow", label: "Tomorrow",   icon: "sunny",      days: 1 },
  { key: "3days",    label: "In 3 days",  icon: "calendar",   days: 3 },
  { key: "week",     label: "Next week",  icon: "calendar-clear", days: 7 },
  { key: "custom",   label: "Custom date", icon: "create",     days: null },
];

export default function FollowUpsScreen({ navigation }) {
  const [data, setData] = useState({
    overdue: [], today: [], upcoming: [],
    counts: { overdue: 0, today: 0, upcoming: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [snoozing, setSnoozing] = useState(null);     // lead being snoozed
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getTravelAgentFollowUps();
      setData({
        overdue: res.overdue || [],
        today: res.today || [],
        upcoming: res.upcoming || [],
        counts: res.counts || {
          overdue: (res.overdue || []).length,
          today: (res.today || []).length,
          upcoming: (res.upcoming || []).length,
        },
      });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load follow-ups");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const markContacted = async (lead) => {
    // Optimistically remove from list (will reappear if backend rejects).
    setData((prev) => ({
      ...prev,
      overdue: prev.overdue.filter((l) => l.id !== lead.id),
      today: prev.today.filter((l) => l.id !== lead.id),
      upcoming: prev.upcoming.filter((l) => l.id !== lead.id),
    }));
    try {
      await updateTravelAgentLead(lead.id, {
        lastContactAt: new Date().toISOString(),
        addNote: "Marked contacted from Follow-ups.",
      });
      load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update");
      load();
    }
  };

  const snoozeTo = async (date, leadOverride) => {
    const lead = leadOverride || snoozing;
    if (!lead) return;
    setSnoozing(null);
    setShowCustomPicker(false);
    try {
      await updateTravelAgentLead(lead.id, { nextFollowUp: date.toISOString() });
      load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to snooze");
    }
  };

  const handlePresetSnooze = (preset) => {
    if (!snoozing) return;
    if (preset.key === "custom") {
      setShowCustomPicker(true);
      return;
    }
    const d = new Date();
    d.setHours(10, 0, 0, 0); // default 10am
    d.setDate(d.getDate() + preset.days);
    snoozeTo(d);
  };

  const onCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };
  const onWhatsApp = (phone) => {
    if (!phone) return;
    const p = phone.replace(/\D/g, "");
    const num = p.length === 10 ? `91${p}` : p;
    Linking.openURL(`whatsapp://send?phone=${num}`).catch(() =>
      Linking.openURL(`https://wa.me/${num}`).catch(() => {})
    );
  };

  const totalCount =
    (data.counts.overdue || 0) + (data.counts.today || 0) + (data.counts.upcoming || 0);

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
              <Text style={styles.headerTitle}>Follow-ups</Text>
              <Text style={styles.headerSub}>
                {totalCount === 0 ? "All caught up" : `${totalCount} to attend`}
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
        <StatCell value={data.counts.overdue || 0}  label="Overdue"  icon="alert-circle" color={C.red} />
        <View style={styles.statDivider} />
        <StatCell value={data.counts.today || 0}    label="Today"    icon="today"        color={C.amber} />
        <View style={styles.statDivider} />
        <StatCell value={data.counts.upcoming || 0} label="Upcoming" icon="calendar"     color={C.blue} />
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
          <Text style={styles.loadingText}>Loading follow-ups…</Text>
        </View>
      ) : (
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
          {totalCount === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="checkmark-done-circle" size={48} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>All caught up! 🎉</Text>
              <Text style={styles.emptyBody}>
                No follow-ups due in the next 7 days. Great work staying on top of your pipeline.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() =>
                  // TALeads is a tab inside TravelAgentBottomNavigation,
                  // which is registered as "TravelAgentDashboard" in the
                  // root stack — need nested-navigator syntax.
                  navigation.navigate("TravelAgentDashboard", { screen: "TALeads" })
                }
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.emerald600, C.emerald700]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="people" size={16} color="#fff" />
                  <Text style={styles.emptyCtaText}>View leads</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            ["overdue", "today", "upcoming"].map((bucket) => {
              const items = data[bucket] || [];
              if (items.length === 0) return null;
              const meta = BUCKET_META[bucket];
              return (
                <View key={bucket} style={styles.bucketBlock}>
                  <View style={styles.bucketHeader}>
                    <View style={[styles.bucketHeaderIcon, { backgroundColor: `${meta.color}22` }]}>
                      <Ionicons name={meta.icon} size={15} color={meta.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.bucketTitle, { color: meta.color }]}>{meta.title}</Text>
                      <Text style={styles.bucketHint} numberOfLines={1}>{meta.hint}</Text>
                    </View>
                    <View style={[styles.bucketCount, { backgroundColor: meta.color }]}>
                      <Text style={styles.bucketCountText}>{items.length}</Text>
                    </View>
                  </View>

                  {items.map((lead) => (
                    <FollowUpRow
                      key={lead.id}
                      lead={lead}
                      bucketColor={meta.color}
                      onOpen={() =>
                        navigation.navigate("TALeadDetail", {
                          id: lead.id,
                          customerName: lead.customerName,
                        })
                      }
                      onCall={() => onCall(lead.customerPhone)}
                      onWhatsApp={() => onWhatsApp(lead.customerPhone)}
                      onMark={() => markContacted(lead)}
                      onSnooze={() => setSnoozing(lead)}
                    />
                  ))}
                </View>
              );
            })
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ===== Snooze bottom sheet ===== */}
      {!!snoozing && !showCustomPicker && (
        <View style={styles.snoozeBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSnoozing(null)}
            activeOpacity={1}
          />
          <View style={styles.snoozeSheet}>
            <LinearGradient
              colors={["#022C22", "#064E3B", "#047857"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.snoozeHeaderGrad}
            >
              <View style={styles.snoozeHeaderRow}>
                <View style={styles.snoozeHeaderIcon}>
                  <Ionicons name="alarm" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.snoozeTitle}>Snooze follow-up</Text>
                  <Text style={styles.snoozeSub} numberOfLines={1}>
                    {snoozing.customerName || "Customer"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSnoozing(null)}
                  style={styles.snoozeCloseBtn}
                >
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <View style={{ padding: 14, paddingBottom: 22 }}>
              {SNOOZE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.key}
                  style={styles.snoozeRow}
                  onPress={() => handlePresetSnooze(preset)}
                  activeOpacity={0.85}
                >
                  <View style={styles.snoozeRowIcon}>
                    <Ionicons name={preset.icon} size={16} color={C.emerald600} />
                  </View>
                  <Text style={styles.snoozeRowText}>{preset.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.subText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <DateTimePickerModal
        isVisible={showCustomPicker}
        mode="date"
        minimumDate={new Date()}
        date={snoozing?.nextFollowUp ? new Date(snoozing.nextFollowUp) : new Date()}
        onConfirm={(d) => snoozeTo(d)}
        onCancel={() => { setShowCustomPicker(false); setSnoozing(null); }}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function StatCell({ value, label, icon, color }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function FollowUpRow({ lead, bucketColor, onOpen, onCall, onWhatsApp, onMark, onSnooze }) {
  const pMeta = PRIORITY_META[lead.priority] || PRIORITY_META.WARM;
  const hasPhone = !!lead.customerPhone;
  return (
    <View style={styles.row}>
      {/* Left bucket stripe */}
      <View style={[styles.rowStripe, { backgroundColor: bucketColor }]} />

      <View style={styles.rowMain}>
        {/* Header: avatar + name + priority pill */}
        <TouchableOpacity
          style={styles.rowHeader}
          onPress={onOpen}
          activeOpacity={0.85}
        >
          <View style={[styles.avatar, { backgroundColor: `${bucketColor}22` }]}>
            <Text style={[styles.avatarText, { color: bucketColor }]}>
              {initials(lead.customerName)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.nameRow}>
              <Text style={styles.rowName} numberOfLines={1}>{lead.customerName || "—"}</Text>
              <View style={[styles.priorityPill, { backgroundColor: `${pMeta.color}1A` }]}>
                <Ionicons name={pMeta.icon} size={9} color={pMeta.color} />
                <Text style={[styles.priorityText, { color: pMeta.color }]}>{pMeta.label}</Text>
              </View>
            </View>
            {!!lead.destination && (
              <View style={styles.rowMetaRow}>
                <Ionicons name="location" size={11} color={C.subText} />
                <Text style={styles.rowMeta} numberOfLines={1}>{lead.destination}</Text>
              </View>
            )}
            {hasPhone && (
              <View style={styles.rowMetaRow}>
                <Ionicons name="call" size={11} color={C.subText} />
                <Text style={styles.rowMeta} numberOfLines={1}>{lead.customerPhone}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Due / travel summary block */}
        <View style={[styles.dueBlock, { backgroundColor: `${bucketColor}10`, borderColor: `${bucketColor}33` }]}>
          <View style={styles.dueRow}>
            <Ionicons name="time" size={13} color={bucketColor} />
            <Text style={[styles.dueLabel, { color: bucketColor }]}>
              {dueLabel(lead.nextFollowUp)}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.dueDate}>{formatDate(lead.nextFollowUp)}</Text>
          </View>
          {!!lead.travelDate && (
            <View style={[styles.dueRow, { marginTop: 4 }]}>
              <Ionicons name="airplane" size={11} color={C.subText} />
              <Text style={styles.travelText}>Travels {formatDate(lead.travelDate)}</Text>
              {lead.passengers > 0 && (
                <>
                  <Text style={styles.travelDot}>·</Text>
                  <Text style={styles.travelText}>{lead.passengers} pax</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Quick actions: Call / WhatsApp / Mark / Snooze */}
        <View style={styles.actionsRow}>
          {hasPhone && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionCall]} onPress={onCall} activeOpacity={0.85}>
              <Ionicons name="call" size={13} color={C.blue} />
              <Text style={[styles.actionBtnText, { color: C.blue }]}>Call</Text>
            </TouchableOpacity>
          )}
          {hasPhone && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionWA]} onPress={onWhatsApp} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
              <Text style={[styles.actionBtnText, { color: "#25D366" }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.actionMark]} onPress={onMark} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={13} color={C.emerald600} />
            <Text style={[styles.actionBtnText, { color: C.emerald600 }]}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSnooze]} onPress={onSnooze} activeOpacity={0.85}>
            <Ionicons name="alarm" size={13} color={C.amber} />
            <Text style={[styles.actionBtnText, { color: C.amber }]}>Snooze</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statCell: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" },
  statIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "900" },
  statLabel: { fontSize: 10.5, color: C.subText, fontWeight: "700", marginTop: 1, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Empty state
  emptyState: { alignItems: "center", padding: 24, paddingTop: 32 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 18 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Bucket
  bucketBlock: { marginBottom: 20 },
  bucketHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 4, marginBottom: 10,
  },
  bucketHeaderIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bucketTitle: { fontSize: 14, fontWeight: "900", letterSpacing: 0.4 },
  bucketHint: { fontSize: 11, color: C.subText, fontWeight: "600", marginTop: 1 },
  bucketCount: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignItems: "center" },
  bucketCountText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  // Row
  row: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 14, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  rowStripe: { width: 4 },
  rowMain: { flex: 1, padding: 12 },

  rowHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowName: { fontSize: 14, fontWeight: "800", color: C.ink, flex: 1 },
  priorityPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  priorityText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.3 },
  rowMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  rowMeta: { fontSize: 11.5, color: C.subText, fontWeight: "600", flex: 1 },

  // Due block
  dueBlock: {
    padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dueLabel: { fontSize: 12.5, fontWeight: "800", letterSpacing: 0.3 },
  dueDate: { fontSize: 11.5, color: C.text, fontWeight: "700" },
  travelText: { fontSize: 11, color: C.subText, fontWeight: "600" },
  travelDot: { fontSize: 11, color: C.subText, fontWeight: "800" },

  // Actions
  actionsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  actionBtn: {
    flex: 1, minWidth: 70,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 9, borderWidth: 1,
  },
  actionCall:   { backgroundColor: C.blueLight,  borderColor: "#BFDBFE" },
  actionWA:     { backgroundColor: "#F0FDF4",    borderColor: "#BBF7D0" },
  actionMark:   { backgroundColor: C.emerald50,  borderColor: "#A7F3D0" },
  actionSnooze: { backgroundColor: C.amberLight, borderColor: "#FDE68A" },
  actionBtnText: { fontSize: 11.5, fontWeight: "800" },

  // Snooze sheet
  snoozeBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  snoozeSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: "hidden",
  },
  snoozeHeaderGrad: { paddingHorizontal: 16, paddingVertical: 16 },
  snoozeHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  snoozeHeaderIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  snoozeTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  snoozeSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },
  snoozeCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },

  snoozeRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: "#FAFBFC",
    marginBottom: 8,
  },
  snoozeRowIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  snoozeRowText: { flex: 1, fontSize: 14, fontWeight: "800", color: C.text, letterSpacing: 0.2 },
});
