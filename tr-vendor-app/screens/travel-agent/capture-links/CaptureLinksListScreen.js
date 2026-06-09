// screens/travel-agent/capture-links/CaptureLinksListScreen.js
// REDESIGNED — emerald-themed list of public lead-capture forms.
// Each card has its own slug-URL, submission stats, active toggle, and
// quick actions (share / copy / open / edit / delete).
//
// GET    /api/travel-agent/capture-links
// PATCH  /api/travel-agent/capture-links/[id]   (toggle isActive inline)
// DELETE /api/travel-agent/capture-links/[id]
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Share, Alert, Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  listTravelAgentCaptureLinks,
  updateTravelAgentCaptureLink,
  deleteTravelAgentCaptureLink,
  getCaptureLinkPublicUrl,
  getCurrentTravelAgent,
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

// Trip-type chip colour mapping for the form-default badge.
const TRIP_TYPE_COLORS = {
  TOUR_PACKAGE: { color: C.purple,    icon: "map" },
  PROPERTY:     { color: C.blue,      icon: "bed" },
  TRANSPORT:    { color: C.amber,     icon: "car" },
  CUSTOM:       { color: C.emerald600, icon: "compass" },
};

export default function CaptureLinksListScreen({ navigation }) {
  const [links, setLinks] = useState([]);
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, ta] = await Promise.all([
        listTravelAgentCaptureLinks(),
        getCurrentTravelAgent(),
      ]);
      setLinks(data.links || []);
      setAgent(ta);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load capture links");
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

  const isApproved = agent?.status === "APPROVED";

  // Gate creation behind approval (mirrors web — capture links are public, so
  // unapproved agents can't create them). Editing existing links stays allowed.
  const goCreate = () => {
    if (!isApproved) {
      Alert.alert(
        "Approval required",
        "Your account must be approved before you can create public capture links. Complete your KYC documents to get verified.",
      );
      return;
    }
    navigation.navigate("TAAddEditCaptureLink");
  };

  // Aggregated stats for floating card.
  const stats = useMemo(() => {
    const active = links.filter((l) => l.isActive).length;
    const totalSubmissions = links.reduce((s, l) => s + (l.totalSubmissions || 0), 0);
    const totalLeads = links.reduce((s, l) => s + (l.leadsGenerated || 0), 0);
    return { active, totalSubmissions, totalLeads };
  }, [links]);

  const onToggleActive = async (link) => {
    setBusyId(link.id);
    // Optimistic
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l)));
    try {
      await updateTravelAgentCaptureLink(link.id, { isActive: !link.isActive });
    } catch (e) {
      // Revert on error
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l)));
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const onShare = async (link) => {
    try {
      const url = await getCaptureLinkPublicUrl(link.slug);
      const message =
        `Hi! Please share your travel enquiry here:\n\n` +
        `${link.title}\n` +
        (link.description ? `${link.description}\n\n` : "\n") +
        `${url}\n\n— ${agent?.agencyName || "your travel agent"}`;
      await Share.share({ message, url });
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not share");
    }
  };

  const onCopy = async (link) => {
    try {
      const url = await getCaptureLinkPublicUrl(link.slug);
      Clipboard.setString(url);
      Alert.alert("Copied", "Public URL copied to clipboard.");
    } catch {
      Alert.alert("Error", "Could not copy URL");
    }
  };

  const onOpenPublic = async (link) => {
    try {
      const url = await getCaptureLinkPublicUrl(link.slug);
      Linking.openURL(url);
    } catch {}
  };

  const onDelete = (link) => {
    Alert.alert(
      "Delete capture link?",
      `"${link.title}" will be removed. Existing leads are kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try { await deleteTravelAgentCaptureLink(link.id); load(); }
            catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
          },
        },
      ]
    );
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
              <Text style={styles.headerTitle}>Capture Links</Text>
              <Text style={styles.headerSub}>Shareable lead-capture forms</Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={goCreate}
            >
              <Ionicons name="add-circle" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Floating stats card ===== */}
      <View style={styles.statsCard}>
        <StatCell value={stats.active}  label="Active"      icon="link"         color={C.emerald600} />
        <View style={styles.statDivider} />
        <StatCell value={stats.totalSubmissions} label="Forms"  icon="mail-unread"  color={C.blue} />
        <View style={styles.statDivider} />
        <StatCell value={stats.totalLeads} label="Leads"     icon="people"       color={C.amber} />
      </View>

      {!isApproved && (
        <View style={styles.warnBanner}>
          <Ionicons name="information-circle" size={16} color="#A16207" />
          <Text style={styles.warnText}>
            Approval pending — capture links work, but won't be discoverable on the public site yet.
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
          <Text style={styles.loadingText}>Loading capture links…</Text>
        </View>
      ) : (
        <FlatList
          data={links}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => (
            <LinkCard
              link={item}
              busy={busyId === item.id}
              onEdit={() => navigation.navigate("TAAddEditCaptureLink", { link: item })}
              onToggle={() => onToggleActive(item)}
              onShare={() => onShare(item)}
              onCopy={() => onCopy(item)}
              onOpen={() => onOpenPublic(item)}
              onDelete={() => onDelete(item)}
            />
          )}
          contentContainerStyle={links.length === 0 ? styles.emptyWrap : styles.listContent}
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
                <Ionicons name="link-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>No capture links yet</Text>
              <Text style={styles.emptyBody}>
                Create a shareable form once, then send it to many customers via WhatsApp, social, or email — leads land straight in your inbox.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={goCreate}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[C.emerald600, C.emerald700]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaInner}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyCtaText}>Create Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ===== Floating Add FAB ===== */}
      <TouchableOpacity
        style={styles.fab}
        onPress={goCreate}
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

function LinkCard({ link, busy, onEdit, onToggle, onShare, onCopy, onOpen, onDelete }) {
  const tripMeta = link.defaultTripType ? TRIP_TYPE_COLORS[link.defaultTripType] : null;
  const stripeColor = link.isActive ? C.emerald600 : C.subText;

  return (
    <View style={[styles.card, !link.isActive && styles.cardInactive]}>
      {/* Left status stripe */}
      <View style={[styles.cardStripe, { backgroundColor: stripeColor }]} />

      <View style={styles.cardBody}>
        {/* Top: status pill + title + toggle */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.statusPillRow}>
              <View style={[
                styles.statusPill,
                link.isActive
                  ? { backgroundColor: C.emerald50 }
                  : { backgroundColor: "#F1F5F9" },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: link.isActive ? C.emerald600 : C.subText },
                ]} />
                <Text style={[
                  styles.statusPillText,
                  { color: link.isActive ? C.emerald700 : C.subText },
                ]}>
                  {link.isActive ? "LIVE" : "PAUSED"}
                </Text>
              </View>
              {!!tripMeta && (
                <View style={[styles.tripPill, { backgroundColor: `${tripMeta.color}1A` }]}>
                  <Ionicons name={tripMeta.icon} size={10} color={tripMeta.color} />
                  <Text style={[styles.tripPillText, { color: tripMeta.color }]}>
                    {link.defaultTripType.replace("_", " ")}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>{link.title}</Text>
            {!!link.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>{link.description}</Text>
            )}
          </View>

          {/* Active/inactive toggle */}
          <TouchableOpacity onPress={onToggle} style={styles.toggleBtn} disabled={busy} activeOpacity={0.7}>
            {busy ? (
              <ActivityIndicator size="small" color={C.emerald600} />
            ) : (
              <View style={[
                styles.toggleTrack,
                link.isActive && { backgroundColor: C.emerald600 },
              ]}>
                <View style={[
                  styles.toggleThumb,
                  link.isActive && { transform: [{ translateX: 16 }] },
                ]} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Slug URL chip — tappable to copy */}
        <TouchableOpacity style={styles.slugRow} onPress={onCopy} activeOpacity={0.85}>
          <Ionicons name="link" size={12} color={C.emerald600} />
          <Text style={styles.slugText} numberOfLines={1}>
            /travel-agent/lead/{link.slug}
          </Text>
          <Ionicons name="copy-outline" size={12} color={C.subText} />
        </TouchableOpacity>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statBoxIcon, { backgroundColor: C.blueLight }]}>
              <Ionicons name="mail-unread" size={13} color={C.blue} />
            </View>
            <View>
              <Text style={styles.statBoxValue}>{link.totalSubmissions || 0}</Text>
              <Text style={styles.statBoxLabel}>Submissions</Text>
            </View>
          </View>
          <View style={styles.statBoxDivider} />
          <View style={styles.statBox}>
            <View style={[styles.statBoxIcon, { backgroundColor: C.emerald50 }]}>
              <Ionicons name="people" size={13} color={C.emerald600} />
            </View>
            <View>
              <Text style={styles.statBoxValue}>{link.leadsGenerated || 0}</Text>
              <Text style={styles.statBoxLabel}>Leads</Text>
            </View>
          </View>
        </View>

        {/* Primary actions — Share (gradient) + Open */}
        <View style={styles.primaryActionsRow}>
          <TouchableOpacity
            style={styles.shareBtnWrap}
            onPress={onShare}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.shareBtnInner}
            >
              <Ionicons name="share-social" size={15} color="#fff" />
              <Text style={styles.shareBtnText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.openBtn} onPress={onOpen} activeOpacity={0.85}>
            <Ionicons name="open-outline" size={15} color={C.emerald700} />
            <Text style={styles.openBtnText}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary actions — Edit + Delete */}
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onEdit} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={13} color={C.blue} />
            <Text style={[styles.secondaryBtnText, { color: C.blue }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onDelete} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={13} color={C.red} />
            <Text style={[styles.secondaryBtnText, { color: C.red }]}>Delete</Text>
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

  warnBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: C.amberLight, borderWidth: 1, borderColor: "#FDE68A" },
  warnText: { color: "#A16207", fontSize: 11.5, flex: 1, fontWeight: "600", lineHeight: 16 },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: 16, marginBottom: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardInactive: { opacity: 0.85 },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },

  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  statusPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },
  tripPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  tripPillText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.3 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.ink, lineHeight: 19 },
  cardDesc: { fontSize: 12, color: C.subText, marginTop: 4, fontWeight: "500", lineHeight: 16 },

  // Custom toggle switch
  toggleBtn: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  toggleTrack: { width: 36, height: 20, borderRadius: 10, backgroundColor: "#E2E8F0", padding: 2, justifyContent: "center" },
  toggleThumb: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },

  // Slug URL chip
  slugRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
    marginBottom: 10,
  },
  slugText: { fontSize: 11.5, color: C.emerald700, fontWeight: "700", flex: 1, fontFamily: "monospace" },

  // Stats grid (2 boxes)
  statsGrid: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, paddingHorizontal: 4,
    backgroundColor: "#FAFBFC", borderRadius: 10,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  statBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  statBoxIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statBoxValue: { fontSize: 15, fontWeight: "900", color: C.ink },
  statBoxLabel: { fontSize: 10, color: C.subText, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase", marginTop: -1 },
  statBoxDivider: { width: 1, height: 28, backgroundColor: C.border },

  // Primary actions
  primaryActionsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  shareBtnWrap: { flex: 2, borderRadius: 10, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  shareBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  shareBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  openBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 11, borderRadius: 10, backgroundColor: C.emerald50, borderWidth: 1.5, borderColor: C.emerald600 },
  openBtnText: { color: C.emerald700, fontWeight: "800", fontSize: 12.5 },

  // Secondary actions
  secondaryActionsRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9, borderRadius: 9, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border },
  secondaryBtnText: { fontSize: 11.5, fontWeight: "800" },

  // FAB
  fab: {
    position: "absolute", right: 18, bottom: 22, width: 60, height: 60, borderRadius: 30,
    overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
