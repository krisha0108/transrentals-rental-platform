// screens/travel-agent/bank/BankDetailsListScreen.js
// Bank accounts list. Cards are credit-card style tiles with a gradient face
// and a masked account number. Backend has no PATCH endpoint, so "Edit" is not
// exposed (mirrors web — delete + re-add). Primary flag flips via re-POST
// (which demotes the previous primary).
//
// REDESIGNED (v2) — "Elevate" visual language (ivory ground, forest→emerald
// gradient hero with floating orbs, serif DISPLAY type, glass cards), matching
// TravelAgentDashboardScreen / DocumentsScreen / GetStartedScreen / Support.
//
// ⚠️ UI ONLY — no logic changes. Preserved exactly:
//   • every state hook, load() and its primary-first sort, the focus listener
//   • onSetPrimary / onDelete — identical Alert titles, bodies, button labels
//     and handlers (including setBusyId and the reload on success)
//   • onCopyAcc / onCopyIfsc — same Clipboard writes and confirmation Alerts
//   • hasPrimary useMemo, and both navigate calls passing { hasPrimary }
//   • mask()'s grouping is untouched
// The per-account gradient cycle was dropped: cards are now white with a
// coloured top rail only, matching the Add-account screen's live preview.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import { C, G, TONES, rs, rf, GUT, alpha, cardShadow } from "../_shared/theme";
import {
  listTravelAgentBankAccounts,
  deleteTravelAgentBankAccount,
  setPrimaryTravelAgentBankAccount,
} from "../../api/travelAgentClient";

// Hero ↔ banner spacing. Visible gap = HERO_TAIL + hero paddingBottom(8) − OVERLAP.
const HERO_TAIL = rs(30);
const BANNER_OVERLAP = rs(20);

// Cards are plain white, matching the Add-account screen's live preview. Only
// the top rail is coloured: gold on the primary account, emerald on the rest —
// enough hierarchy to scan the list without six competing gradients.
const railFor = (isPrimary) => (isPrimary ? G.gold : G.emerald);

// Classic EMV contact plate — the detail that makes a white rectangle read as
// a real bank card. Same component as the Add-account preview.
function EmvChip() {
  return (
    <LinearGradient
      colors={G.gold}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.emv}
    >
      <View style={styles.emvRowLine} />
      <View style={[styles.emvColLine, { left: "33%" }]} />
      <View style={[styles.emvColLine, { left: "66%" }]} />
    </LinearGradient>
  );
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
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      {/* ── Hero ── */}
      <LinearGradient
        colors={G.hero}
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

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate("TAAddBankAccount", { hasPrimary })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={rs(21)} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle} numberOfLines={1}>Bank Accounts</Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {accounts.length > 0
                ? `${accounts.length} account${accounts.length === 1 ? "" : "s"} · payouts every Monday`
                : "Where you receive payouts"}
            </Text>
          </View>

          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Info banner, tucked into the hero curve ── */}
      <View style={styles.bannerWrap}>
        <View style={[styles.infoBanner, cardShadow]}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information-circle" size={rs(16)} color={C.emeraldDeep} />
          </View>
          <Text style={styles.infoText}>
            Payouts go to your{" "}
            <Text style={styles.infoStrong}>primary</Text> account.
            {accounts.length > 0 && !hasPrimary
              ? "  Mark one as primary."
              : "  Add multiple accounts if you need."}
          </Text>
        </View>
      </View>

      {/* ── Warning when no primary set ── */}
      {!loading && accounts.length > 0 && !hasPrimary && (
        <View style={styles.warnBanner}>
          <Ionicons name="alert-circle" size={rs(15)} color={C.red} />
          <Text style={styles.warnText}>
            No primary account selected — payouts won't be sent until you mark one.
          </Text>
        </View>
      )}

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
          <ActivityIndicator size="large" color={C.emeraldDeep} />
          <Text style={styles.loadingText}>Loading bank accounts…</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a.id}
          showsVerticalScrollIndicator={false}
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
              tintColor={C.emeraldDeep}
              colors={[C.emeraldDeep]}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, cardShadow]}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="card-outline" size={rs(32)} color={C.emeraldDeep} />
              </View>
              <Text style={styles.emptyTitle}>No bank accounts yet</Text>
              <Text style={styles.emptyBody}>
                Add a bank account to start receiving payouts from confirmed bookings.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate("TAAddBankAccount", { hasPrimary: false })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={G.emerald}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="add" size={rs(17)} color="#fff" />
                  <Text style={styles.emptyCtaText}>Add Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Floating Add FAB ── */}
      {accounts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("TAAddBankAccount", { hasPrimary })}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={G.emerald}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={rs(26)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

function BankCard({ account, busy, onSetPrimary, onDelete, onCopyAcc, onCopyIfsc }) {
  const accountType = (account.accountType || "SAVINGS").replace("_", " ");
  const isPrimary = !!account.isPrimary;

  return (
    <View style={styles.cardWrap}>
      {/* White "credit card" tile — same anatomy as the Add-account preview:
          rail, chip + contactless, number, holder/IFSC, issuer strip. */}
      <View style={[styles.cardTile, cardShadow]}>
        <LinearGradient
          colors={railFor(isPrimary)}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cardRail}
        />
        {/* Two faint washes for depth — emerald top-right, gold bottom-left */}
        <View style={styles.cardWash} />
        <View style={styles.cardWashB} />

        <View style={styles.cardBody}>
          <View style={styles.emvRow}>
            <EmvChip />
            <Ionicons
              name="wifi"
              size={rs(16)}
              color={C.muted}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
            <View style={{ flex: 1 }} />
            {isPrimary && (
              <View style={styles.primaryBadge}>
                <Ionicons name="star" size={rs(10)} color={TONES.amber.ink} />
                <Text style={styles.primaryText}>PRIMARY</Text>
              </View>
            )}
          </View>

          {/* Masked account number — tap to copy the full one */}
          <TouchableOpacity onPress={onCopyAcc} activeOpacity={0.7} style={styles.cardAccRow}>
            <Text style={styles.cardAccValue} numberOfLines={1}>
              {mask(account.accountNumber)}
            </Text>
            <View style={styles.copyChip}>
              <Ionicons name="copy-outline" size={rs(12)} color={C.emeraldDeep} />
            </View>
          </TouchableOpacity>

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardSubLabel}>HOLDER</Text>
              <Text style={styles.cardSubValue} numberOfLines={1}>
                {account.accountHolderName || "—"}
              </Text>
            </View>
            <TouchableOpacity onPress={onCopyIfsc} activeOpacity={0.7} style={styles.cardIfscBlock}>
              <Text style={styles.cardSubLabel}>IFSC</Text>
              <View style={styles.cardIfscRow}>
                <Text style={styles.cardSubValue} numberOfLines={1}>
                  {account.ifscCode || "—"}
                </Text>
                <Ionicons name="copy-outline" size={rs(11)} color={C.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Issuer strip — bank identity sits at the foot, like a real card */}
          <View style={styles.issuerRow}>
            <View style={styles.cardChip}>
              <Ionicons name="business" size={rs(14)} color={C.emeraldDeep} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardBankName} numberOfLines={1}>{account.bankName}</Text>
              {!!account.branchName && (
                <Text style={styles.cardBranchName} numberOfLines={1}>{account.branchName}</Text>
              )}
            </View>
            <View style={styles.cardFooterChips}>
              <View style={styles.cardFooterChip}>
                <Text style={styles.cardFooterChipText}>{accountType}</Text>
              </View>
              {!!account.upiId && (
                <View style={styles.cardFooterChip}>
                  <Ionicons name="phone-portrait" size={rs(9)} color={C.emeraldDeep} />
                  <Text style={styles.cardFooterChipText} numberOfLines={1}>{account.upiId}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action row (below the card tile) */}
      <View style={styles.actionsRow}>
        {!account.isPrimary && (
          <TouchableOpacity
            style={styles.setPrimaryBtn}
            onPress={onSetPrimary}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color={TONES.amber.ink} />
            ) : (
              <>
                <Ionicons name="star" size={rs(14)} color={TONES.amber.ink} />
                <Text style={[styles.actionBtnText, { color: TONES.amber.ink }]}>
                  Set as primary
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.removeBtn, account.isPrimary && { flex: 1 }]}
          onPress={onDelete}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={rs(14)} color={C.red} />
          <Text style={[styles.actionBtnText, { color: C.red }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  heroTextBlock: { marginTop: rs(18) },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(22), lineHeight: rf(28),
    color: "#fff", letterSpacing: 0.2,
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(12), lineHeight: rf(16),
    color: "rgba(255,255,255,0.72)", fontWeight: "bold", marginTop: rs(4),
  },

  // ── Banners ──
  bannerWrap: { marginHorizontal: GUT, marginTop: -BANNER_OVERLAP },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: rs(10),
    padding: rs(12), borderRadius: rs(16),
    backgroundColor: C.card, borderWidth: 1, borderColor: C.glassBorder,
  },
  infoIconWrap: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  infoText: {
    fontFamily: DISPLAY, color: C.sub, fontSize: rf(11.5),
    flex: 1, lineHeight: rf(16), fontWeight: "600",
  },
  infoStrong: { fontWeight: "bold", color: TONES.amber.ink },

  warnBanner: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(10), padding: rs(11),
    borderRadius: rs(14), backgroundColor: C.redL,
    borderWidth: 1, borderColor: alpha(C.red, 0.22),
  },
  warnText: {
    fontFamily: DISPLAY, color: C.red, fontSize: rf(11.5),
    flex: 1, fontWeight: "bold", lineHeight: rf(16),
  },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: rs(8),
    marginHorizontal: GUT, marginTop: rs(10), padding: rs(11),
    backgroundColor: C.redL, borderRadius: rs(14),
    borderWidth: 1, borderColor: alpha(C.red, 0.22),
  },
  errorText: {
    fontFamily: DISPLAY, color: C.red, fontSize: rf(12),
    flex: 1, fontWeight: "600",
  },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: rf(12) },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: rs(12) },
  loadingText: { fontFamily: DISPLAY, fontSize: rf(13), color: C.muted, fontWeight: "600" },

  listContent: { paddingHorizontal: GUT, paddingTop: rs(16), paddingBottom: rs(100) },

  // ── Empty state ──
  emptyWrap: { flexGrow: 1, justifyContent: "center", paddingHorizontal: GUT, paddingVertical: rs(20) },
  emptyCard: {
    alignItems: "center", paddingVertical: rs(32), paddingHorizontal: rs(22),
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  emptyIconWrap: {
    width: rs(64), height: rs(64), borderRadius: rs(20),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center", marginBottom: rs(14),
  },
  emptyTitle: {
    fontFamily: DISPLAY, fontSize: rf(16), lineHeight: rf(21),
    fontWeight: "bold", color: C.ink,
  },
  emptyBody: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(18),
    color: C.sub, marginTop: rs(6), textAlign: "center", fontWeight: "600",
  },
  emptyCta: { marginTop: rs(18), borderRadius: rs(14), overflow: "hidden" },
  emptyCtaInner: {
    flexDirection: "row", alignItems: "center", gap: rs(7),
    paddingHorizontal: rs(20), paddingVertical: rs(13),
  },
  emptyCtaText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: rf(13.5) },

  // ── Card ── white tile, only the top rail carries colour
  cardWrap: { marginBottom: rs(18) },
  cardTile: {
    backgroundColor: C.card, borderRadius: rs(20),
    borderWidth: 1, borderColor: C.glassBorder,
    overflow: "hidden",
  },
  cardRail: { height: rs(4), width: "100%" },
  cardWash: {
    position: "absolute", right: -rs(50), top: -rs(30),
    width: rs(160), height: rs(160), borderRadius: rs(80),
    backgroundColor: alpha(C.emeraldDeep, 0.075),
  },
  cardWashB: {
    position: "absolute", left: -rs(45), bottom: -rs(55),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: alpha(C.gold, 0.11),
  },
  cardBody: { paddingHorizontal: rs(15), paddingTop: rs(13), paddingBottom: rs(13) },

  // EMV contact plate
  emvRow: { flexDirection: "row", alignItems: "center", gap: rs(9), marginBottom: rs(12) },
  emv: {
    width: rs(34), height: rs(25), borderRadius: rs(5),
    overflow: "hidden", justifyContent: "center",
    borderWidth: 0.5, borderColor: alpha("#8A6A1E", 0.5),
  },
  emvRowLine: {
    position: "absolute", left: 0, right: 0, top: "50%",
    height: 1, backgroundColor: alpha("#6B4A10", 0.45),
  },
  emvColLine: {
    position: "absolute", top: 0, bottom: 0,
    width: 1, backgroundColor: alpha("#6B4A10", 0.45),
  },

  primaryBadge: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), height: rs(22), borderRadius: 999,
    backgroundColor: C.tintGold,
    borderWidth: 1, borderColor: alpha(C.gold, 0.3),
  },
  primaryText: {
    fontFamily: DISPLAY, color: TONES.amber.ink, fontSize: rf(9),
    lineHeight: rf(12), fontWeight: "bold", letterSpacing: 0.5,
  },

  cardAccRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(9), marginBottom: rs(12),
  },
  cardAccValue: {
    fontFamily: DISPLAY, fontSize: rf(19), lineHeight: rf(25),
    color: C.ink, fontWeight: "bold", letterSpacing: 2.4, flex: 1,
  },
  copyChip: {
    width: rs(28), height: rs(28), borderRadius: rs(10),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  cardBottomRow: {
    flexDirection: "row", gap: rs(12),
    alignItems: "flex-end", marginBottom: rs(13),
  },
  cardSubLabel: {
    fontFamily: DISPLAY, fontSize: rf(8), lineHeight: rf(10),
    color: C.muted, fontWeight: "bold",
    letterSpacing: 0.8, marginBottom: rs(2),
  },
  cardSubValue: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(16),
    color: C.ink, fontWeight: "bold",
  },
  cardIfscBlock: { alignItems: "flex-end", minWidth: 0 },
  cardIfscRow: { flexDirection: "row", alignItems: "center", gap: rs(5) },

  // Issuer strip at the foot of the card
  issuerRow: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    paddingTop: rs(11), borderTopWidth: 1, borderTopColor: C.border,
  },
  cardChip: {
    width: rs(30), height: rs(30), borderRadius: rs(10),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  cardBankName: {
    fontFamily: DISPLAY, fontSize: rf(13), lineHeight: rf(17),
    fontWeight: "bold", color: C.ink, letterSpacing: 0.3,
  },
  cardBranchName: {
    fontFamily: DISPLAY, fontSize: rf(10), lineHeight: rf(13),
    color: C.muted, marginTop: rs(1), fontWeight: "600",
  },
  cardFooterChips: {
    flexDirection: "row", gap: rs(5), flexWrap: "wrap",
    justifyContent: "flex-end", maxWidth: "46%",
  },
  cardFooterChip: {
    flexDirection: "row", alignItems: "center", gap: rs(4),
    paddingHorizontal: rs(8), height: rs(21), borderRadius: 999,
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.16)",
  },
  cardFooterChipText: {
    fontFamily: DISPLAY, color: C.emeraldDeep, fontSize: rf(9),
    lineHeight: rf(12), fontWeight: "bold", letterSpacing: 0.3,
    flexShrink: 1,
  },

  // ── Actions ──
  actionsRow: { flexDirection: "row", gap: rs(8), marginTop: rs(11) },
  setPrimaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), paddingVertical: rs(11), borderRadius: rs(12),
    backgroundColor: C.tintGold, borderWidth: 1, borderColor: alpha(C.gold, 0.35),
  },
  removeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(6), paddingVertical: rs(11), borderRadius: rs(12),
    backgroundColor: C.redL, borderWidth: 1, borderColor: alpha(C.red, 0.25),
  },
  actionBtnText: {
    fontFamily: DISPLAY, fontWeight: "bold",
    fontSize: rf(12.5), lineHeight: rf(17),
  },

  // ── FAB ──
  fab: {
    position: "absolute", right: GUT, bottom: rs(24),
    width: rs(58), height: rs(58), borderRadius: rs(20),
    overflow: "hidden",
    shadowColor: "#0B3327", shadowOpacity: 0.35, shadowRadius: rs(14),
    shadowOffset: { width: 0, height: rs(8) }, elevation: 9,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
