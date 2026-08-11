// screens/travel-agent/chats/ChatsListScreen.js
// REDESIGNED v2 — emerald-themed customer chats inbox with floating cards.
// Compact gradient header (title + unread badge) + white search/filter strip
// + shadowed conversation cards (matches SocialMessagesList polish).
//
// GET /api/travel-agent-chat/conversations  → { success, conversations, totalUnread }
// Server wraps customer info under `participant.{name,phone,email}` on the
// list endpoint (flat fields on the detail endpoint), so we read participant
// first with a fallback to flat fields.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, StatusBar, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentConversations, CHAT_STATUS } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";


const POLL_INTERVAL_MS = 15000;

// Pleasant gradient pairs cycled by name hash so each contact has a stable
// distinct avatar feel.
// Warm Elevate tones — the old set was bright/cool (#10B981, #3B82F6, #EC4899…)
// and clashed with the ivory ground.
const AVATAR_GRADS = [
  ["#2E9E78", "#1C6B52"], // emerald
  ["#4A9DBE", "#245C7A"], // ocean
  ["#8A6DD4", "#5E43A8"], // plum
  ["#E88AA0", "#C65772"], // rose
  ["#F0B85A", "#9A6B16"], // gold
  ["#3FA79A", "#176F66"], // teal
  ["#7B8ED6", "#3A4E8C"], // indigo
  ["#D98E56", "#9A5A22"], // clay
];
function avatarGrad(name) {
  if (!name) return AVATAR_GRADS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_GRADS.length;
  return AVATAR_GRADS[h];
}

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
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function getCustomer(conv) {
  const p = conv.participant || {};
  return {
    name: p.name || conv.customerName || "Customer",
    phone: p.phone || conv.customerPhone || "",
    email: p.email || conv.customerEmail || "",
  };
}

const STATUS_META = {
  ALL:      { icon: "apps",                label: "All",      color: C.subText },
  ACTIVE:   { icon: "chatbubble-ellipses", label: "Active",   color: C.emerald600 },
  ARCHIVED: { icon: "archive",             label: "Archived", color: C.amber },
  BLOCKED:  { icon: "ban",                 label: "Blocked",  color: C.red },
};

export default function ChatsListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const focusedRef = useRef(true);

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setError(null);
    try {
      const data = await listTravelAgentConversations({ status: statusFilter });
      setConversations(data.conversations || []);
      if (typeof data.totalUnread === "number") setTotalUnread(data.totalUnread);
    } catch (e) {
      if (!silent) setError(e?.response?.data?.error || e?.message || "Failed to load chats");
    } finally {
      if (!silent) { setLoading(false); setRefreshing(false); }
    }
  }, [statusFilter]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const sub1 = navigation.addListener("focus", () => {
      focusedRef.current = true;
      load();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(
        () => focusedRef.current && load({ silent: true }), POLL_INTERVAL_MS
      );
    });
    const sub2 = navigation.addListener("blur", () => {
      focusedRef.current = false;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    });
    return () => {
      sub1(); sub2();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  // Client-side filtering for search + computed unread-in-list count for the
  // small label.
  const { visibleConversations, unreadInListCount } = useMemo(() => {
    let f = conversations;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      f = f.filter((c) => {
        const cust = getCustomer(c);
        return (
          cust.name.toLowerCase().includes(q) ||
          (cust.phone || "").includes(q) ||
          (c.subject || "").toLowerCase().includes(q)
        );
      });
    }
    const u = f.filter((c) => (c.unreadCount || c.agentUnread || 0) > 0).length;
    return { visibleConversations: f, unreadInListCount: u };
  }, [conversations, search]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* ===== Compact gradient header ===== */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 22 }}>
          <View style={styles.headerRow}>
            <View style={styles.headerIconChip}>
              <Ionicons name="chatbubbles" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerKicker}>MESSAGES</Text>
              <Text style={styles.headerTitle}>Customer Chats</Text>
              <Text style={styles.headerSub}>
                {totalUnread > 0
                  ? `${totalUnread} unread · ${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`
                  : conversations.length > 0
                    ? `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`
                    : "Reply to customer enquiries here"}
              </Text>
            </View>
            {totalUnread > 0 && (
              <View style={styles.unreadHeroBadge}>
                <Text style={styles.unreadHeroText}>
                  {totalUnread > 99 ? "99+" : totalUnread}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== White search + filter strip ===== */}
      <View style={styles.controlsBar}>
        {/* Search input */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={C.subText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, subject…"
            placeholderTextColor="#9AA79E"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close-circle" size={17} color={C.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.chipsRow}>
          {CHAT_STATUS.map((s) => {
            const active = statusFilter === s;
            const meta = STATUS_META[s];
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[
                  styles.chip,
                  active && { backgroundColor: `${meta.color}18`, borderColor: meta.color },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons name={meta.icon} size={12} color={active ? meta.color : C.subText} />
                <Text style={[styles.chipText, active && { color: meta.color, fontWeight: "bold" }]}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
          <Text style={styles.loadingText}>Loading chats…</Text>
        </View>
      ) : (
        <FlatList
          data={visibleConversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const cust = getCustomer(item);
            return (
              <ConversationCard
                conversation={item}
                customer={cust}
                onPress={() =>
                  navigation.navigate("TAChatThread", {
                    id: item.id,
                    customerName: cust.name,
                    customerPhone: cust.phone,
                    leadId: item.leadId,
                  })
                }
              />
            );
          }}
          contentContainerStyle={
            visibleConversations.length === 0 ? styles.emptyWrap : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.emerald600}
              colors={[C.emerald600]}
            />
          }
          ListEmptyComponent={<EmptyState filter={statusFilter} hasSearch={!!search.trim()} />}
        />
      )}
    </View>
  );
}

/* ───────── Sub-components ───────── */

function ConversationCard({ conversation, customer, onPress }) {
  const unread = conversation.unreadCount || conversation.agentUnread || 0;
  const lastMsg = conversation.lastMessage?.content || conversation.lastMessageText || "";
  const lastFromAgent = (conversation.lastMessage?.senderType || conversation.lastSenderType) === "agent";
  const time = fmtRelative(conversation.lastMessageAt || conversation.createdAt);
  const grad = avatarGrad(customer.name);
  const isUnread = unread > 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      {/* Gradient avatar with unread dot */}
      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials(customer.name)}</Text>
        </LinearGradient>
        {isUnread && <View style={styles.avatarDot} />}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Top line: name + time */}
        <View style={styles.rowTopLine}>
          <Text
            style={[
              styles.name,
              isUnread && { color: C.ink, fontWeight: "bold" },
            ]}
            numberOfLines={1}
          >
            {customer.name}
          </Text>
          {!!time && (
            <Text
              style={[
                styles.time,
                isUnread && { color: C.emerald700, fontWeight: "bold" },
              ]}
            >
              {time}
            </Text>
          )}
        </View>

        {/* Subject (if present and distinct from preview) */}
        {!!conversation.subject && conversation.subject !== lastMsg && (
          <View style={styles.subjectRow}>
            <Ionicons name="bookmark" size={9.5} color={C.emerald600} />
            <Text style={styles.subjectText} numberOfLines={1}>
              {conversation.subject}
            </Text>
          </View>
        )}

        {/* Preview line */}
        <View style={styles.rowBottomLine}>
          {lastFromAgent && !!lastMsg && (
            <Ionicons name="checkmark-done" size={13} color={C.emerald600} style={{ marginTop: 1 }} />
          )}
          <Text
            style={[
              styles.preview,
              isUnread && { color: C.ink, fontWeight: "bold" },
            ]}
            numberOfLines={1}
          >
            {lastFromAgent && lastMsg ? "You: " : ""}
            {lastMsg || "No messages yet"}
          </Text>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Gentle looping animation for the empty-state icon: box "breathes"
// (scale + opacity pulse) while the icon softly rocks.
function AnimatedEmptyIcon({ name }) {
  const rock = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const mkLoop = (val, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    const l1 = mkLoop(rock, 1600);
    const l2 = mkLoop(pulse, 1400);
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, [rock, pulse]);
  const iconRotate = rock.interpolate({ inputRange: [0, 1], outputRange: ["-10deg", "10deg"] });
  const boxScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const boxOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  return (
    <Animated.View style={[styles.emptyIconBox, { opacity: boxOpacity, transform: [{ scale: boxScale }] }]}>
      <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
        <Ionicons name={name} size={36} color={C.emerald600} />
      </Animated.View>
    </Animated.View>
  );
}

function EmptyState({ filter, hasSearch }) {
  if (hasSearch) {
    return (
      <View style={styles.empty}>
        <AnimatedEmptyIcon name="search-outline" />
        <Text style={styles.emptyTitle}>No matches</Text>
        <Text style={styles.emptyBody}>Try a different name, phone number, or subject.</Text>
      </View>
    );
  }
  const map = {
    ALL:      { icon: "chatbubbles-outline", title: "No conversations",  body: "Customer enquiries will land here when they message you." },
    ACTIVE:   { icon: "chatbubbles-outline", title: "No active chats",   body: "Customer enquiries will land here when they message you." },
    ARCHIVED: { icon: "archive-outline",     title: "No archived chats", body: "Conversations you've archived appear here." },
    BLOCKED:  { icon: "ban",                  title: "No blocked chats",  body: "Conversations you've blocked appear here." },
  };
  const m = map[filter] || map.ACTIVE;
  return (
    <View style={styles.empty}>
      <AnimatedEmptyIcon name={m.icon} />
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptyBody}>{m.body}</Text>
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -40, width: 190, height: 190,
    borderRadius: 95, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 20, left: -60, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(46,158,119,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingTop: 4 },
  headerIconChip: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  headerKicker: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: "rgba(255,255,255,0.6)", letterSpacing: 1.6, marginBottom: 3 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: "bold", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.82)", fontWeight: "600", marginTop: 3 },
  unreadHeroBadge: {
    minWidth: 36, paddingHorizontal: 10, height: 32, borderRadius: 16,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  unreadHeroText: { fontFamily: DISPLAY, color: C.emerald700, fontSize: 14, fontWeight: "bold" },

  // Search + filters strip
  controlsBar: {
    backgroundColor: C.card,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, height: 42,
    backgroundColor: "#FBF8F1", borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { fontFamily: DISPLAY, flex: 1, fontSize: 13.5, color: C.ink, paddingVertical: 0, fontWeight: "600" },

  chipsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "#FBF8F1",
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.text, fontWeight: "bold" },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginTop: 10, padding: 10, backgroundColor: "#FBEDEB", borderRadius: 10, borderWidth: 1, borderColor: "rgba(192,69,59,0.2)" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // Conversation card (floating, shadowed)
  row: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },

  // Avatar
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
  avatarDot: {
    position: "absolute", top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.emerald500,
    borderWidth: 2.5, borderColor: C.card,
  },

  // Top line
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontFamily: DISPLAY, flex: 1, fontSize: 14.5, color: C.text, fontWeight: "bold" },
  time: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, fontWeight: "bold" },

  // Subject row
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  subjectText: { fontFamily: DISPLAY, fontSize: 11, color: C.emerald700, fontWeight: "bold", flex: 1 },

  // Preview line
  rowBottomLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  preview: { fontFamily: DISPLAY, flex: 1, fontSize: 12.5, color: C.subText },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 7,
    backgroundColor: C.emerald600,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.emerald600, shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  unreadText: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold" },

  // Empty
  empty: { alignItems: "center", padding: 32 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(28,107,82,0.12)" },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, textAlign: "center" },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
});
