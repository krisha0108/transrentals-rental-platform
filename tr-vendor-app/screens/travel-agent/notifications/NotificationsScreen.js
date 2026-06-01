// screens/travel-agent/notifications/NotificationsScreen.js
// REDESIGNED — modern inbox: gradient header, pill filter tabs with icons,
// date-grouped sections, type-color left-border on unread cards, polished
// empty state.
//
// GET    /api/travel-agent/notifications
// PATCH  /api/travel-agent/notifications  body { action: 'markRead' | 'markAllRead', ids? }
// DELETE /api/travel-agent/notifications  body { ids } | { all: true }
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  getTravelAgentNotifications,
  getTravelAgentUnreadCount,
  markTravelAgentNotification,
  deleteTravelAgentNotification,
  deleteAllTravelAgentNotifications,
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
  green: "#10B981",
  greenLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
};

// Per-type meta: icon + accent colors
const TYPE_META = {
  LEAD:    { icon: "people",  color: C.blue,   bg: C.blueLight,   label: "Lead" },
  PAYMENT: { icon: "cash",    color: C.green,  bg: C.greenLight,  label: "Payment" },
  BOOKING: { icon: "receipt", color: C.purple, bg: C.purpleLight, label: "Booking" },
  CHAT:    { icon: "chatbubble-ellipses", color: C.amber, bg: C.amberLight, label: "Chat" },
  SYSTEM:  { icon: "information-circle",  color: C.subText, bg: "#F1F5F9", label: "System" },
};

const FILTERS = [
  { key: "all",     label: "All",     icon: "apps" },
  { key: "unread",  label: "Unread",  icon: "mail-unread" },
  { key: "lead",    label: "Lead",    icon: "people" },
  { key: "payment", label: "Payment", icon: "cash" },
  { key: "booking", label: "Booking", icon: "receipt" },
  { key: "chat",    label: "Chat",    icon: "chatbubble-ellipses" },
  { key: "system",  label: "System",  icon: "information-circle" },
];

const POLL_MS = 30000;

function fmtRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  if (m < 10080) return `${Math.round(m / 1440)}d`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function dayBucketKey(iso) {
  if (!iso) return "earlier";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "earlier";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const diff = Math.round((today - t) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff <= 7) return "thisweek";
  return "earlier";
}
const BUCKET_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  thisweek: "This week",
  earlier: "Earlier",
};
const BUCKET_ORDER = ["today", "yesterday", "thisweek", "earlier"];

export default function NotificationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchPage = useCallback(
    async ({ cursor, append } = {}) => {
      try {
        if (!append) setError(null);
        const data = await getTravelAgentNotifications({
          cursor,
          limit: 20,
          filter,
        });
        setItems((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
        setNextCursor(data.nextCursor || null);
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      } catch (e) {
        setError(e?.response?.data?.error || e?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => { setLoading(true); fetchPage({ cursor: null, append: false }); }, [fetchPage]);
  useEffect(() => {
    const unsub = navigation.addListener("focus", () => fetchPage({ cursor: null, append: false }));
    return unsub;
  }, [navigation, fetchPage]);

  // Poll unread count every 30s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getTravelAgentUnreadCount();
        if (typeof res?.count === "number") setUnreadCount(res.count);
      } catch {}
    }, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchPage({ cursor: null, append: false }); };

  const onEndReached = () => {
    if (loadingMore || loading || !nextCursor) return;
    setLoadingMore(true);
    fetchPage({ cursor: nextCursor, append: true });
  };

  const markRead = async (item) => {
    if (item.isRead) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true, readAt: new Date().toISOString() } : i)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markTravelAgentNotification("markRead", [item.id]);
    } catch {
      // Revert on failure
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: false, readAt: null } : i)));
      setUnreadCount((c) => c + 1);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    Alert.alert("Mark all as read?", `${unreadCount} unread notifications will be marked as read.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark all",
        onPress: async () => {
          try {
            await markTravelAgentNotification("markAllRead");
            await fetchPage({ cursor: null, append: false });
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
          }
        },
      },
    ]);
  };

  const deleteOne = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (!item.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try { await deleteTravelAgentNotification(item.id); }
    catch (e) {
      // Re-fetch on error to restore consistent state
      fetchPage({ cursor: null, append: false });
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to delete");
    }
  };

  const clearAll = () => {
    if (items.length === 0) return;
    Alert.alert(
      "Clear all notifications?",
      "This will delete every notification in your inbox. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all", style: "destructive",
          onPress: async () => {
            try {
              await deleteAllTravelAgentNotifications();
              setItems([]); setUnreadCount(0); setNextCursor(null);
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
            }
          },
        },
      ]
    );
  };

  const handleTap = (item) => {
    markRead(item);
    if (item.link && typeof item.link === "string") {
      const leadMatch = item.link.match(/\/travel-agent\/leads\/([^/?#]+)/);
      if (leadMatch) { navigation.navigate("TALeadDetail", { id: leadMatch[1] }); return; }
      const bookingMatch = item.link.match(/\/travel-agent\/bookings\/([^/?#]+)/);
      if (bookingMatch) { navigation.navigate("TABookingDetail", { id: bookingMatch[1] }); return; }
      const chatMatch = item.link.match(/\/travel-agent(?:\/social)?\/(?:chats|messages)\/([^/?#]+)/);
      if (chatMatch) {
        const isSocial = item.link.includes("/social/");
        navigation.navigate(isSocial ? "TASocialChat" : "TAChatThread", { id: chatMatch[1] });
        return;
      }
    }
  };

  // Group items into day buckets for SectionList
  const sections = useMemo(() => {
    const buckets = { today: [], yesterday: [], thisweek: [], earlier: [] };
    for (const it of items) buckets[dayBucketKey(it.createdAt)].push(it);
    return BUCKET_ORDER
      .filter((k) => buckets[k].length > 0)
      .map((k) => ({ title: BUCKET_LABELS[k], data: buckets[k] }));
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Gradient header */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSub}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.iconBtn, unreadCount === 0 && { opacity: 0.4 }]}
              onPress={markAllRead}
              disabled={unreadCount === 0}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="checkmark-done" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, items.length === 0 && { opacity: 0.4 }]}
              onPress={clearAll}
              disabled={items.length === 0}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={f.icon}
                    size={12}
                    color={active ? C.emerald700 : "rgba(255,255,255,0.85)"}
                  />
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                  {f.key === "unread" && unreadCount > 0 && (
                    <View style={[styles.filterBadge, active && { backgroundColor: C.emerald600 }]}>
                      <Text style={[styles.filterBadgeText, active && { color: "#fff" }]}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage({ cursor: null, append: false })}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      ) : sections.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <NotifCard
              item={item}
              onPress={() => handleTap(item)}
              onDelete={() => deleteOne(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={C.subText} style={{ padding: 14 }} /> : null}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function NotifCard({ item, onPress, onDelete }) {
  const meta = TYPE_META[item.type] || TYPE_META.SYSTEM;
  const unread = !item.isRead;
  return (
    <TouchableOpacity
      style={[
        styles.card,
        unread && { borderLeftWidth: 4, borderLeftColor: meta.color, backgroundColor: "#FBFDFF" },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
        {unread && <View style={[styles.unreadDot, { backgroundColor: meta.color }]} />}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.cardTopLine}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.cardTime}>{fmtRelative(item.createdAt)}</Text>
        </View>
        <Text style={[styles.cardTitle, unread && { fontWeight: "800" }]} numberOfLines={1}>
          {item.title}
        </Text>
        {!!item.body && (
          <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color={C.subText} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }) {
  const map = {
    all:     { icon: "notifications-off-outline", title: "No notifications", body: "When something happens, you'll see it here." },
    unread:  { icon: "checkmark-done-circle",     title: "All caught up! 🎉", body: "You've read everything. Nice work." },
    lead:    { icon: "people-outline",            title: "No lead activity",  body: "New leads, conversions, and follow-ups will show here." },
    payment: { icon: "cash-outline",              title: "No payment alerts", body: "Customer payments will appear here." },
    booking: { icon: "receipt-outline",           title: "No booking events", body: "Booking confirmations and updates will appear here." },
    chat:    { icon: "chatbubbles-outline",       title: "No chat messages",  body: "New messages from customers will appear here." },
    system:  { icon: "information-circle-outline", title: "No system messages", body: "Announcements and updates will appear here." },
  };
  const m = map[filter] || map.all;
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Ionicons name={m.icon} size={36} color={C.emerald600} />
      </View>
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptyBody}>{m.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  headerGrad: { paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4, paddingHorizontal: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },

  // Filter pills
  filtersRow: { paddingHorizontal: 8, paddingTop: 12, gap: 6, flexDirection: "row" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  filterChipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  filterText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  filterTextActive: { color: C.emerald700, fontWeight: "800" },
  filterBadge: {
    minWidth: 18, height: 16, paddingHorizontal: 5, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 14, padding: 10, backgroundColor: C.redLight, borderRadius: 10,
    borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 14, paddingTop: 10 },

  // Section header
  sectionHeaderWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 4, paddingTop: 12, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 11.5, fontWeight: "800", color: C.subText, letterSpacing: 0.7, textTransform: "uppercase" },
  sectionCount: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Notification card
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 8,
    paddingLeft: 12,
  },
  typeIcon: { position: "relative", width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unreadDot: { position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#FBFDFF" },
  cardTopLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  cardTime: { fontSize: 10.5, color: C.subText, fontWeight: "700", marginLeft: "auto" },
  cardTitle: { fontSize: 13.5, color: C.ink, fontWeight: "700", marginTop: 4 },
  cardBody: { fontSize: 12, color: C.subText, marginTop: 3, lineHeight: 17 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  // Empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center" },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
});
