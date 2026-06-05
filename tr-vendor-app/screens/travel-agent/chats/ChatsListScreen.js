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
  RefreshControl, ActivityIndicator, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { listTravelAgentConversations, CHAT_STATUS } from "../../api/travelAgentClient";

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

const POLL_INTERVAL_MS = 15000;

// Pleasant gradient pairs cycled by name hash so each contact has a stable
// distinct avatar feel.
const AVATAR_GRADS = [
  ["#10B981", "#047857"], // emerald
  ["#3B82F6", "#1E40AF"], // blue
  ["#8B5CF6", "#6D28D9"], // purple
  ["#EC4899", "#BE185D"], // pink
  ["#F59E0B", "#B45309"], // amber
  ["#06B6D4", "#0E7490"], // cyan
  ["#6366F1", "#4338CA"], // indigo
  ["#F97316", "#C2410C"], // orange
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
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Compact gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Customer Chats</Text>
              <Text style={styles.headerSub}>
                {totalUnread > 0
                  ? `${totalUnread} unread · ${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`
                  : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
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
            placeholderTextColor="#A3B3C2"
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
                <Text style={[styles.chipText, active && { color: meta.color, fontWeight: "800" }]}>
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
              isUnread && { color: C.ink, fontWeight: "900" },
            ]}
            numberOfLines={1}
          >
            {customer.name}
          </Text>
          {!!time && (
            <Text
              style={[
                styles.time,
                isUnread && { color: C.emerald700, fontWeight: "800" },
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
              isUnread && { color: C.ink, fontWeight: "700" },
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

function EmptyState({ filter, hasSearch }) {
  if (hasSearch) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="search-outline" size={36} color={C.emerald600} />
        </View>
        <Text style={styles.emptyTitle}>No matches</Text>
        <Text style={styles.emptyBody}>Try a different name, phone number, or subject.</Text>
      </View>
    );
  }
  const map = {
    ACTIVE:   { icon: "chatbubbles-outline", title: "No active chats",   body: "Customer enquiries will land here when they message you." },
    ARCHIVED: { icon: "archive-outline",     title: "No archived chats", body: "Conversations you've archived appear here." },
    BLOCKED:  { icon: "ban",                  title: "No blocked chats",  body: "Conversations you've blocked appear here." },
  };
  const m = map[filter] || map.ACTIVE;
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

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  unreadHeroBadge: {
    minWidth: 36, paddingHorizontal: 10, height: 32, borderRadius: 16,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  unreadHeroText: { color: C.emerald700, fontSize: 14, fontWeight: "900" },

  // Search + filters strip
  controlsBar: {
    backgroundColor: C.card,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, height: 42,
    backgroundColor: "#FAFBFC", borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: C.ink, paddingVertical: 0, fontWeight: "600" },

  chipsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "#FAFBFC",
    borderWidth: 1, borderColor: C.border,
  },
  chipText: { fontSize: 11.5, color: C.text, fontWeight: "700" },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },

  // Conversation card (floating, shadowed)
  row: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  // Avatar
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },
  avatarDot: {
    position: "absolute", top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.emerald500,
    borderWidth: 2.5, borderColor: C.card,
  },

  // Top line
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 14.5, color: C.text, fontWeight: "700" },
  time: { fontSize: 11, color: C.subText, fontWeight: "700" },

  // Subject row
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  subjectText: { fontSize: 11, color: C.emerald700, fontWeight: "700", flex: 1 },

  // Preview line
  rowBottomLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  preview: { flex: 1, fontSize: 12.5, color: C.subText },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 7,
    backgroundColor: C.emerald600,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.emerald600, shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  // Empty
  empty: { alignItems: "center", padding: 32 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center" },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 19, maxWidth: 280 },
});
