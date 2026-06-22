// screens/travel-agent/bank/BankDetailsListScreen.js
// REDESIGNED — emerald-themed bank accounts list. Cards look like real
// credit-card style tiles with gradient stripe + masked account number.
// Backend has no PATCH endpoint, so "Edit" is not exposed (mirrors web —
// delete + re-add). Primary flag flips via re-POST (demotes prev primary).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  listTravelAgentBankAccounts,
  deleteTravelAgentBankAccount,
  setPrimaryTravelAgentBankAccount,
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

// Card gradient cycled per account so multiple accounts visually distinct.
const CARD_GRADIENTS = [
  ["#047857", "#059669"], // emerald (primary)
  ["#1E40AF", "#3B82F6"], // blue
  ["#6D28D9", "#8B5CF6"], // purple
  ["#0E7490", "#06B6D4"], // cyan
  ["#BE185D", "#EC4899"], // pink
  ["#9A3412", "#F97316"], // orange
];
function gradientFor(account, isPrimary) {
  if (isPrimary) return CARD_GRADIENTS[0];
  // hash the bank name so each non-primary card is stable
  const seed = (account.bankName || account.id || "x") + "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CARD_GRADIENTS[1 + (h % (CARD_GRADIENTS.length - 1))];
}

function mask(n) {
  if (!n) return "—";
  const s = String(n);
  if (s.length <= 4) return s;
  // Group with spaces for credit-card look — last 4 visible.
  const hidden = "•".repeat(Math.max(0, s.length - 4));
  const padded = hidden + s.slice(-4);
  return padded.match(/.{1,4}/g)?.join(" ") || padded;
}

export default function BankDetailsListScreen({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listTravelAgentBankAccounts();
      // Sort: primary first, then by createdAt desc (or order of arrival).
      const list = data.accounts || [];
      list.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      setAccounts(list);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load bank accounts");
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

  const hasPrimary = useMemo(() => accounts.some((a) => a.isPrimary), [accounts]);

  const onSetPrimary = (acc) => {
    if (acc.isPrimary) return;
    Alert.alert(
      "Set as primary?",
      `Future payouts will be sent to ${acc.bankName} (${mask(acc.accountNumber)}).`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set primary",
          onPress: async () => {
            try {
              setBusyId(acc.id);
              await setPrimaryTravelAgentBankAccount(acc);
              await load();
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const onDelete = (acc) => {
    Alert.alert(
      "Remove bank account?",
      `${acc.bankName} (${mask(acc.accountNumber)}) will be hidden from your account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              setBusyId(acc.id);
              await deleteTravelAgentBankAccount(acc.id);
              await load();
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const onCopyAcc = (acc) => {
    if (!acc.accountNumber) return;
    Clipboard.setString(String(acc.accountNumber));
    Alert.alert("Copied", "Full account number copied to clipboard.");
  };
  const onCopyIfsc = (acc) => {
    if (!acc.ifscCode) return;
    Clipboard.setString(String(acc.ifscCode));
    Alert.alert("Copied", "IFSC copied to clipboard.");
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
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 24 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Bank Accounts</Text>
              <Text style={styles.headerSub}>
                Where you receive payouts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() =>
                navigation.navigate("TAAddBankAccount", { hasPrimary })
              }
            >
              <Ionicons name="add-circle" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Info banner (always shown) ===== */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIconWrap}>
          <Ionicons name="information-circle" size={16} color={C.emerald700} />
        </View>
        <Text style={styles.infoText}>
          Payouts go to your{" "}
          <Text style={{ fontWeight: "900", color: C.amber }}>primary</Text> account.
          {accounts.length > 0 && !hasPrimary
            ? "  Mark one as primary."
            : "  Add multiple accounts if you need."}
        </Text>
      </View>

      {/* ===== Warning when no primary set ===== */}
      {!loading && accounts.length > 0 && !hasPrimary && (
        <View style={styles.warnBanner}>
          <Ionicons name="alert-circle" size={16} color={C.red} />
          <Text style={styles.warnText}>
            No primary account selected — payouts won't be sent until you mark one.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading bank accounts…</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <BankCard
              account={item}
              busy={busyId === item.id}
              onSetPrimary={() => onSetPrimary(item)}
              onDelete={() => onDelete(item)}
              onCopyAcc={() => onCopyAcc(item)}
              onCopyIfsc={() => onCopyIfsc(item)}
            />
          )}
          contentContainerStyle={
            accounts.length === 0 ? styles.emptyWrap : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="card-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>No bank accounts yet</Text>
              <Text style={styles.emptyBody}>
                Add a bank account to start receiving payouts from confirmed bookings.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() =>
                  navigation.navigate("TAAddBankAccount", { hasPrimary: false })
                }
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.emerald600, C.emerald700]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyCtaText}>Add Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ===== Floating Add FAB ===== */}
      {accounts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate("TAAddBankAccount", { hasPrimary })
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

function BankCard({ account, busy, onSetPrimary, onDelete, onCopyAcc, onCopyIfsc }) {
  const gradient = gradientFor(account, account.isPrimary);
  const accountType = (account.accountType || "SAVINGS").replace("_", " ");

  return (
    <View style={styles.cardWrap}>
      {/* The "credit card" tile (gradient) */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.cardTile}
      >
        {/* Decorative right-side circle */}
        <View style={styles.cardCircleA} />
        <View style={styles.cardCircleB} />

        {/* Top: bank name + primary badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardChip}>
            <Ionicons name="business" size={14} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardBankName} numberOfLines={1}>{account.bankName}</Text>
            {!!account.branchName && (
              <Text style={styles.cardBranchName} numberOfLines={1}>{account.branchName}</Text>
            )}
          </View>
          {account.isPrimary && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.primaryText}>PRIMARY</Text>
            </View>
          )}
        </View>

        {/* Masked account number */}
        <TouchableOpacity onPress={onCopyAcc} activeOpacity={0.85} style={styles.cardAccRow}>
          <Text style={styles.cardAccLabel}>ACCOUNT NUMBER</Text>
          <View style={styles.cardAccValueRow}>
            <Text style={styles.cardAccValue} numberOfLines={1}>
              {mask(account.accountNumber)}
            </Text>
            <Ionicons name="copy-outline" size={13} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* Bottom: holder + IFSC */}
        <View style={styles.cardBottomRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardSubLabel}>ACCOUNT HOLDER</Text>
            <Text style={styles.cardSubValue} numberOfLines={1}>
              {account.accountHolderName || "—"}
            </Text>
          </View>
          <TouchableOpacity onPress={onCopyIfsc} activeOpacity={0.85} style={styles.cardIfscBlock}>
            <Text style={styles.cardSubLabel}>IFSC</Text>
            <View style={styles.cardIfscRow}>
              <Text style={styles.cardSubValue} numberOfLines={1}>
                {account.ifscCode || "—"}
              </Text>
              <Ionicons name="copy-outline" size={11} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Type + UPI footer chips */}
        <View style={styles.cardFooterChips}>
          <View style={styles.cardFooterChip}>
            <Text style={styles.cardFooterChipText}>{accountType}</Text>
          </View>
          {!!account.upiId && (
            <View style={styles.cardFooterChip}>
              <Ionicons name="phone-portrait" size={10} color="#fff" />
              <Text style={styles.cardFooterChipText}>{account.upiId}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Action row (below the card tile) */}
      <View style={styles.actionsRow}>
        {!account.isPrimary && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onSetPrimary}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color={C.amber} />
            ) : (
              <>
                <Ionicons name="star" size={14} color={C.amber} />
                <Text style={[styles.actionBtnText, { color: C.amber }]}>Set as primary</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onDelete}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Ionicons name="trash" size={14} color={C.red} />
          <Text style={[styles.actionBtnText, { color: C.red }]}>Remove</Text>
        </TouchableOpacity>
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

  // Info / warn banners
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 14, padding: 11,
    borderRadius: 12, backgroundColor: C.emerald50,
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  infoIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(5,150,105,0.15)", alignItems: "center", justifyContent: "center" },
  infoText: { color: C.text, fontSize: 12, flex: 1, lineHeight: 17, fontWeight: "500" },

  warnBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 8, padding: 11,
    borderRadius: 12, backgroundColor: C.redLight,
    borderWidth: 1, borderColor: "#FCA5A5",
  },
  warnText: { color: C.red, fontSize: 12, flex: 1, fontWeight: "700", lineHeight: 16 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 8, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Card wrapper
  cardWrap: { marginBottom: 18 },

  // Credit-card style tile
  cardTile: {
    borderRadius: 18, padding: 18, paddingBottom: 16,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    minHeight: 200,
  },
  // Decorative circles (right side, behind everything)
  cardCircleA: {
    position: "absolute", right: -40, top: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardCircleB: {
    position: "absolute", right: -60, top: 20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  cardChip: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  cardBankName: { fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  cardBranchName: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },
  primaryBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(245,158,11,0.95)" },
  primaryText: { color: "#fff", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },

  // Account number row
  cardAccRow: { marginBottom: 16 },
  cardAccLabel: { fontSize: 9.5, color: "rgba(255,255,255,0.75)", fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  cardAccValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardAccValue: { fontSize: 18, color: "#fff", fontWeight: "900", letterSpacing: 2, flex: 1 },

  // Bottom row
  cardBottomRow: { flexDirection: "row", gap: 12, alignItems: "flex-end", marginBottom: 12 },
  cardSubLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "800", letterSpacing: 0.8, marginBottom: 3 },
  cardSubValue: { fontSize: 12.5, color: "#fff", fontWeight: "800" },
  cardIfscBlock: { alignItems: "flex-end" },
  cardIfscRow: { flexDirection: "row", alignItems: "center", gap: 5 },

  // Footer chips (type + upi)
  cardFooterChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  cardFooterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cardFooterChipText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },

  // Action row (outside the card tile)
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 11,
    backgroundColor: C.amberLight, borderWidth: 1.5, borderColor: C.amber,
  },
  removeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 11,
    backgroundColor: C.redLight, borderWidth: 1.5, borderColor: "#FCA5A5",
  },
  actionBtnText: { fontWeight: "800", fontSize: 12.5 },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
