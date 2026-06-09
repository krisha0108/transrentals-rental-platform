// screens/travel-agent/fleet/FleetInsuranceScreen.js
// Phase 9 / C1 — Fleet insurance & compliance dashboard.
// Mirrors web src/app/travel-agent/(dashboard)/fleet/insurance/page.tsx:
// summary buckets (expired/expiring/valid/not-added by insurance validity),
// search, status filter, per-vehicle doc status (insurance/fitness/permit).
// "Manage" opens the full AddEditFleet edit screen (which already has all the
// document fields), instead of duplicating the web's upload modal.
import React, { useCallback, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import RemoteImage from "../_shared/RemoteImage";
import { listTravelAgentFleet } from "../../api/travelAgentClient";

const C = {
  emerald600: "#059669", emerald700: "#047857", emerald50: "#ECFDF5",
  ink: "#0F172A", text: "#334155", subText: "#64748B",
  bg: "#F6F8FB", card: "#FFFFFF", border: "#E6EDF5",
  red: "#EF4444", redLight: "#FEE2E2", amber: "#F59E0B", amberLight: "#FEF3C7",
};

const STATUS_META = {
  expired:  { fg: "#B91C1C", bg: "#FEE2E2", label: "Expired", icon: "shield" },
  expiring: { fg: "#A16207", bg: "#FEF3C7", label: "Expiring", icon: "alert-circle" },
  valid:    { fg: "#15803D", bg: "#DCFCE7", label: "Valid", icon: "shield-checkmark" },
  missing:  { fg: "#64748B", bg: "#F1F5F9", label: "Not added", icon: "help-circle" },
};

function statusOf(date) {
  if (!date) return "missing";
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}
function daysLeft(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}
function worstStatus(f) {
  const order = ["expired", "expiring", "missing", "valid"];
  const ss = [statusOf(f.insuranceValidity), statusOf(f.fitnessValidity)];
  for (const s of order) if (ss.includes(s)) return s;
  return "valid";
}
function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FleetInsuranceScreen({ navigation }) {
  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentFleet();
      setFleets(data?.fleets || data?.fleet || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load fleet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const summary = useMemo(() => {
    const b = { expired: 0, expiring: 0, valid: 0, missing: 0 };
    for (const f of fleets) b[statusOf(f.insuranceValidity)]++;
    return b;
  }, [fleets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fleets.filter((f) => {
      if (q) {
        const hay = [f.vehicleName, f.brand, f.model, f.registrationNumber, f.insuranceProvider]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter !== "ALL" && worstStatus(f) !== filter) return false;
      return true;
    });
  }, [fleets, search, filter]);

  const FILTERS = [
    { key: "ALL", label: "All" },
    { key: "expired", label: "Expired" },
    { key: "expiring", label: "Expiring" },
    { key: "valid", label: "Valid" },
    { key: "missing", label: "Not added" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
      <LinearGradient colors={["#022C22", "#064E3B", "#047857"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Insurance & Documents</Text>
              <Text style={styles.headerSub}>Track validity for every vehicle</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
      >
        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard meta={STATUS_META.expired} count={summary.expired} hint="need renewal" />
          <SummaryCard meta={STATUS_META.expiring} count={summary.expiring} hint="within 30 days" />
          <SummaryCard meta={STATUS_META.valid} count={summary.valid} hint="in policy" />
          <SummaryCard meta={STATUS_META.missing} count={summary.missing} hint="missing details" />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={C.subText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicle, registration or insurer…"
            placeholderTextColor={C.subText}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={C.subText} /></TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterChipText, active && { color: "#fff" }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={C.emerald600} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={40} color={C.subText} />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={load}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No vehicles match the filter.</Text>
          </View>
        ) : (
          filtered.map((f) => (
            <View key={f.id} style={styles.vCard}>
              <View style={styles.vHead}>
                {f.coverImage ? (
                  <RemoteImage source={{ uri: f.coverImage }} style={styles.vThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.vThumb, styles.vThumbPlaceholder]}><Ionicons name="car" size={20} color={C.subText} /></View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vName} numberOfLines={1}>{f.vehicleName}</Text>
                  <Text style={styles.vReg} numberOfLines={1}>{f.registrationNumber || f.vehicleType || "—"}</Text>
                </View>
                <TouchableOpacity
                  style={styles.manageBtn}
                  onPress={() => navigation.navigate("TAAddEditFleet", { vehicle: f })}
                >
                  <Ionicons name="create-outline" size={14} color={C.emerald700} />
                  <Text style={styles.manageText}>Manage</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.docRow}>
                <DocPill title="Insurance" status={statusOf(f.insuranceValidity)} date={fmtDate(f.insuranceValidity)} dleft={daysLeft(f.insuranceValidity)} extra={f.insuranceProvider} />
                <DocPill title="Fitness" status={statusOf(f.fitnessValidity)} date={fmtDate(f.fitnessValidity)} dleft={daysLeft(f.fitnessValidity)} />
                <DocPill title="Permit" status={f.permitImage ? "valid" : "missing"} date={f.permitType || (f.permitImage ? "Uploaded" : "—")} dleft={null} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ meta, count, hint }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: meta.bg }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Ionicons name={meta.icon} size={14} color={meta.fg} />
        <Text style={[styles.summaryLabel, { color: meta.fg }]}>{meta.label}</Text>
      </View>
      <Text style={[styles.summaryCount, { color: meta.fg }]}>{count}</Text>
      <Text style={[styles.summaryHint, { color: meta.fg }]}>{hint}</Text>
    </View>
  );
}

function DocPill({ title, status, date, dleft, extra }) {
  const m = STATUS_META[status] || STATUS_META.missing;
  return (
    <View style={styles.docPill}>
      <Text style={styles.docPillTitle}>{title}</Text>
      <View style={[styles.docPillBadge, { backgroundColor: m.bg }]}>
        <Ionicons name={m.icon} size={10} color={m.fg} />
        <Text style={[styles.docPillBadgeText, { color: m.fg }]}>{m.label}</Text>
      </View>
      <Text style={styles.docPillDate} numberOfLines={1}>{date}</Text>
      {dleft !== null && status !== "missing" && (
        <Text style={[styles.docPillDays, status === "expired" && { color: C.red }]}>
          {dleft < 0 ? `${Math.abs(dleft)}d ago` : `${dleft}d left`}
        </Text>
      )}
      {!!extra && <Text style={styles.docPillExtra} numberOfLines={1}>{extra}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, marginTop: 14 },
  summaryCard: { width: "47.5%", flexGrow: 1, borderRadius: 16, padding: 14 },
  summaryLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  summaryCount: { fontSize: 24, fontWeight: "800", marginTop: 6 },
  summaryHint: { fontSize: 10.5, fontWeight: "600", marginTop: 2, opacity: 0.85 },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.ink, borderColor: C.ink },
  filterChipText: { fontSize: 12.5, fontWeight: "700", color: C.text },

  empty: { alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyText: { color: C.subText, fontSize: 13, textAlign: "center" },
  retry: { color: C.emerald600, fontWeight: "800", marginTop: 4 },

  vCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12 },
  vHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  vThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#EEF2F6" },
  vThumbPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  vName: { fontSize: 14.5, fontWeight: "800", color: C.ink },
  vReg: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.emerald600, backgroundColor: C.emerald50 },
  manageText: { color: C.emerald700, fontWeight: "800", fontSize: 12 },

  docRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  docPill: { flex: 1, backgroundColor: "#FAFBFC", borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 8 },
  docPillTitle: { fontSize: 10, fontWeight: "800", color: C.subText, letterSpacing: 0.3, textTransform: "uppercase" },
  docPillBadge: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 5 },
  docPillBadgeText: { fontSize: 9, fontWeight: "800" },
  docPillDate: { fontSize: 11, color: C.ink, fontWeight: "700", marginTop: 5 },
  docPillDays: { fontSize: 9.5, color: C.subText, fontWeight: "700", marginTop: 1 },
  docPillExtra: { fontSize: 9.5, color: C.subText, marginTop: 1 },
});
