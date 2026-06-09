// screens/travel-agent/social/SocialMessagesListScreen.js
// REDESIGNED — emerald-themed cross-network direct messages list.
// Polls every 15s while focused.
//
// GET /api/social/chat/conversations  → { conversations }
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, StatusBar, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  listSocialConversations,
  searchSocialDirectory,
  getOrCreateSocialConversation,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";

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

const POLL_MS = 15000;

const TYPE_META = {
  vendor: { color: C.purple, icon: "storefront", label: "Vendor" },
  agent:  { color: C.blue,   icon: "airplane",   label: "Agent" },
};

// Filter chips for the network type
const FILTERS = [
  { key: "all",    label: "All",     icon: "apps",       color: C.emerald600 },
  { key: "agent",  label: "Agents",  icon: "airplane",   color: C.blue },
  { key: "vendor", label: "Vendors", icon: "storefront", color: C.purple },
  { key: "unread", label: "Unread",  icon: "mail-unread", color: C.amber },
];

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

function normalizeOther(o) {
  if (!o) return null;
  return {
    ...o,
    displayName:
      o.displayName || o.businessName || o.agencyName || o.name || o.ownerName || "Someone",
  };
}
function getOther(conv) {
  if (conv.other) return normalizeOther(conv.other);
  if (conv.otherActor) return normalizeOther(conv.otherActor);
  if (conv.otherVendor) return normalizeOther({ type: "vendor", ...conv.otherVendor });
  if (conv.otherAgent) return normalizeOther({ type: "agent", ...conv.otherAgent });
  return null;
}

// Last-message preview honouring post_card payloads.
function previewText(conv) {
  const raw = conv.lastMessage?.content || conv.lastMessageText;
  if (!raw) return "No messages yet";
  if (typeof raw === "string" && raw.startsWith("{")) {
    try {
      const d = JSON.parse(raw);
      if (d && d.__type === "post_card") return "📎 Shared a post";
    } catch {}
  }
  return raw;
}

function shade(hex, pct) {
  const f = parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff;
  return (
    "#" +
    (0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    ).toString(16).slice(1)
  );
}

export default function SocialMessagesListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const focusedRef = useRef(true);

  // "New message" — network-wide directory search to start a fresh chat.
  const [showNewChat, setShowNewChat] = useState(false);
  const [ncQuery, setNcQuery] = useState("");
  const [ncResults, setNcResults] = useState([]);
  const [ncLoading, setNcLoading] = useState(false);
  const [ncStarting, setNcStarting] = useState(false);

  // Debounced directory search (backend requires q.length >= 2).
  useEffect(() => {
    if (!showNewChat) return;
    const q = ncQuery.trim();
    if (q.length < 2) { setNcResults([]); setNcLoading(false); return; }
    setNcLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchSocialDirectory(q);
        setNcResults(data?.results || []);
      } catch {
        setNcResults([]);
      } finally {
        setNcLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [ncQuery, showNewChat]);

  const openNewChat = () => {
    setNcQuery(""); setNcResults([]); setNcLoading(false);
    setShowNewChat(true);
  };
  const startChatWith = async (actor) => {
    if (ncStarting) return;
    setNcStarting(true);
    try {
      const data = await getOrCreateSocialConversation(actor.type, actor.id);
      // Backend returns { conversationId }; tolerate { conversation:{id} } too.
      const convId = data?.conversationId || data?.conversation?.id || data?.id;
      setShowNewChat(false);
      navigation.navigate("TASocialChat", {
        id: convId,
        other: normalizeOther({ type: actor.type, ...actor }),
      });
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Couldn't start chat");
    } finally {
      setNcStarting(false);
    }
  };

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setError(null);
    try {
      const data = await listSocialConversations();
      setConversations(data.conversations || []);
    } catch (e) {
      if (!silent) setError(e?.response?.data?.error || e?.message || "Failed to load messages");
    } finally {
      if (!silent) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const sub1 = navigation.addListener("focus", () => {
      focusedRef.current = true;
      load();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(
        () => focusedRef.current && load({ silent: true }), POLL_MS
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

  // Compute filtered list + stats.
  const { filtered, stats } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const counts = { all: conversations.length, agent: 0, vendor: 0, unread: 0, totalUnread: 0 };
    conversations.forEach((c) => {
      const other = getOther(c);
      if (other?.type === "agent") counts.agent++;
      if (other?.type === "vendor") counts.vendor++;
      if ((c.unreadCount || 0) > 0) {
        counts.unread++;
        counts.totalUnread += c.unreadCount || 0;
      }
    });
    let f = conversations;
    if (filter === "agent") f = f.filter((c) => getOther(c)?.type === "agent");
    else if (filter === "vendor") f = f.filter((c) => getOther(c)?.type === "vendor");
    else if (filter === "unread") f = f.filter((c) => (c.unreadCount || 0) > 0);
    if (q) {
      f = f.filter((c) => {
        const other = getOther(c);
        return (other?.displayName || other?.name || "").toLowerCase().includes(q);
      });
    }
    return { filtered: f, stats: counts };
  }, [conversations, filter, search]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient header ===== */}
      <LinearGradient
        colors={["#022C22", "#064E3B", "#047857"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Social Messages</Text>
              <Text style={styles.headerSub}>
                {stats.totalUnread > 0
                  ? `${stats.totalUnread} unread message${stats.totalUnread > 1 ? "s" : ""}`
                  : stats.all > 0
                  ? `${stats.all} conversation${stats.all > 1 ? "s" : ""}`
                  : "Direct messages"}
              </Text>
            </View>
            {stats.totalUnread > 0 && (
              <View style={styles.unreadBadgeHeader}>
                <Text style={styles.unreadBadgeHeaderText}>
                  {stats.totalUnread > 99 ? "99+" : stats.totalUnread}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={openNewChat} style={styles.composeBtn} activeOpacity={0.85}>
              <Ionicons name="create" size={18} color={C.emerald700} />
            </TouchableOpacity>
          </View>

          {/* Embedded search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations…"
              placeholderTextColor="#A3B3C2"
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={C.subText} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ===== Filter chips ===== */}
      <View style={styles.chipsBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={styles.chipsRowContent}
          renderItem={({ item: f }) => {
            const active = filter === f.key;
            const count =
              f.key === "all" ? stats.all :
              f.key === "agent" ? stats.agent :
              f.key === "vendor" ? stats.vendor :
              stats.unread;
            return (
              <TouchableOpacity
                onPress={() => setFilter(f.key)}
                style={[
                  styles.chip,
                  active && { backgroundColor: `${f.color}18`, borderColor: f.color },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons name={f.icon} size={12} color={active ? f.color : C.subText} />
                <Text style={[styles.chipText, active && { color: f.color, fontWeight: "800" }]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.chipBadge, active && { backgroundColor: f.color }]}>
                    <Text style={[styles.chipBadgeText, active && { color: "#fff" }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.emerald600} />
          <Text style={styles.loadingText}>Loading messages…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() =>
                navigation.navigate("TASocialChat", { id: item.id, other: getOther(item) })
              }
            />
          )}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyWrap : styles.listContent
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
                <Ionicons name="chatbubbles-outline" size={42} color={C.emerald600} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === "all" && !search
                  ? "No messages yet"
                  : filter === "unread"
                  ? "All caught up!"
                  : "No matches"}
              </Text>
              <Text style={styles.emptyBody}>
                {filter === "all" && !search
                  ? "Search the network to start a new conversation, or open someone's profile from the feed and tap Message."
                  : filter === "unread"
                  ? "No unread messages — you're up to date."
                  : "Try a different filter or clear your search."}
              </Text>
              {filter === "all" && !search && (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={openNewChat}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.emerald600, C.emerald700]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.emptyCtaInner}
                  >
                    <Ionicons name="create" size={16} color="#fff" />
                    <Text style={styles.emptyCtaText}>New message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* ===== New message — directory search ===== */}
      <Modal visible={showNewChat} animationType="slide" transparent onRequestClose={() => setShowNewChat(false)}>
        <View style={styles.ncOverlay}>
          <View style={styles.ncSheet}>
            <LinearGradient
              colors={["#022C22", "#064E3B", "#047857"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ncHeader}
            >
              <View style={styles.ncHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ncTitle}>New message</Text>
                  <Text style={styles.ncSub}>Search vendors & agents across the network</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNewChat(false)} style={styles.ncCloseBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.ncSearchWrap}>
              <Ionicons name="search" size={18} color={C.subText} />
              <TextInput
                style={styles.ncSearchInput}
                placeholder="Type a name or city (min 2 letters)…"
                placeholderTextColor="#A3B3C2"
                value={ncQuery}
                onChangeText={setNcQuery}
                autoFocus
              />
              {ncLoading && <ActivityIndicator size="small" color={C.emerald600} />}
              {!ncLoading && !!ncQuery && (
                <TouchableOpacity onPress={() => setNcQuery("")}>
                  <Ionicons name="close-circle" size={18} color={C.subText} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={ncResults}
              keyExtractor={(r) => `${r.type}:${r.id}`}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={ncResults.length === 0 ? { flexGrow: 1, justifyContent: "center" } : { padding: 12 }}
              renderItem={({ item }) => {
                const meta = TYPE_META[item.type] || TYPE_META.agent;
                const name = item.businessName || item.ownerName || "Someone";
                return (
                  <TouchableOpacity style={styles.ncRow} onPress={() => startChatWith(item)} activeOpacity={0.85} disabled={ncStarting}>
                    {item.logo ? (
                      <RemoteImage source={{ uri: item.logo }} style={styles.ncAvatar} />
                    ) : (
                      <LinearGradient colors={[meta.color, shade(meta.color, -15)]} style={styles.ncAvatar}>
                        <Text style={styles.ncAvatarText}>{initials(name)}</Text>
                      </LinearGradient>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.ncName} numberOfLines={1}>{name}</Text>
                      <View style={styles.ncMetaRow}>
                        <View style={[styles.typePill, { backgroundColor: `${meta.color}1A` }]}>
                          <Ionicons name={meta.icon} size={9} color={meta.color} />
                          <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                        {!!item.city && (
                          <>
                            <Text style={styles.dot}>·</Text>
                            <Text style={styles.locationText} numberOfLines={1}>{item.city}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chatbubble-ellipses" size={18} color={meta.color} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.ncEmpty}>
                  <Ionicons
                    name={ncQuery.trim().length < 2 ? "search" : "sad-outline"}
                    size={34}
                    color={C.subText}
                  />
                  <Text style={styles.ncEmptyText}>
                    {ncQuery.trim().length < 2
                      ? "Type at least 2 letters to search"
                      : ncLoading ? "Searching…" : "No vendors or agents found"}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function ConversationRow({ conversation, onPress }) {
  const other = getOther(conversation) || {};
  const typeMeta = TYPE_META[other.type] || TYPE_META.agent;
  const unread = conversation.unreadCount || 0;
  const lastMsg = previewText(conversation);
  const time = fmtRelative(conversation.lastMessageAt || conversation.createdAt);
  const isUnread = unread > 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar with online dot for unread */}
      <View style={styles.avatarWrap}>
        {other.logo ? (
          <RemoteImage source={{ uri: other.logo }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[typeMeta.color, shade(typeMeta.color, -15)]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {initials(other.displayName || other.name)}
            </Text>
          </LinearGradient>
        )}
        {isUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Center content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowTopLine}>
          <Text
            style={[
              styles.name,
              isUnread && { color: C.ink, fontWeight: "900" },
            ]}
            numberOfLines={1}
          >
            {other.displayName || other.name || "Someone"}
          </Text>
          {!!time && (
            <Text style={[styles.time, isUnread && { color: C.emerald700, fontWeight: "800" }]}>
              {time}
            </Text>
          )}
        </View>
        <View style={styles.rowMidLine}>
          <View style={[styles.typePill, { backgroundColor: `${typeMeta.color}1A` }]}>
            <Ionicons name={typeMeta.icon} size={9} color={typeMeta.color} />
            <Text style={[styles.typePillText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
          </View>
          {!!other.city && (
            <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="location" size={10} color={C.subText} />
              <Text style={styles.locationText} numberOfLines={1}>{other.city}</Text>
            </>
          )}
        </View>
        <View style={styles.rowBottomLine}>
          <Text
            style={[
              styles.preview,
              isUnread && { color: C.ink, fontWeight: "700" },
            ]}
            numberOfLines={1}
          >
            {lastMsg}
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

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "700", marginTop: 2 },
  unreadBadgeHeader: {
    minWidth: 28, paddingHorizontal: 8, height: 28, borderRadius: 14,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  unreadBadgeHeaderText: { color: C.emerald700, fontSize: 13, fontWeight: "900" },
  composeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginLeft: 8 },

  // New-message directory modal
  ncOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  ncSheet: { backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden", height: "82%" },
  ncHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
  ncHeaderRow: { flexDirection: "row", alignItems: "center" },
  ncTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  ncSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 2 },
  ncCloseBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  ncSearchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, paddingHorizontal: 14, height: 46,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
  },
  ncSearchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },
  ncRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  ncAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ncAvatarText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  ncName: { fontSize: 14.5, color: C.ink, fontWeight: "800" },
  ncMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ncEmpty: { alignItems: "center", gap: 10, padding: 24 },
  ncEmptyText: { fontSize: 13, color: C.subText, fontWeight: "600", textAlign: "center" },

  // Search
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, marginHorizontal: 4, paddingHorizontal: 14, height: 44,
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },

  // Filter chips
  chipsBar: {
    backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border,
    minHeight: 56, justifyContent: "center",
  },
  chipsRowContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row", alignItems: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#FAFBFC", borderWidth: 1, borderColor: C.border,
    minHeight: 34,
  },
  chipText: { fontSize: 12, color: C.text, fontWeight: "600" },
  chipBadge: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E2E8F0" },
  chipBadgeText: { fontSize: 10, fontWeight: "800", color: C.text },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: "#FEF2F2", borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { color: C.red, fontWeight: "800", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.subText, fontWeight: "600" },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 6 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },
  emptyCta: { marginTop: 18, borderRadius: 12, overflow: "hidden" },
  emptyCtaInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Conversation row
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 },
  unreadDot: {
    position: "absolute", top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.emerald500, borderWidth: 2, borderColor: C.card,
  },

  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { flex: 1, fontSize: 14.5, color: C.text, fontWeight: "700" },
  time: { fontSize: 11, color: C.subText, fontWeight: "700" },

  rowMidLine: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  typePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  typePillText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.3 },
  dot: { fontSize: 11, color: C.subText, fontWeight: "800" },
  locationText: { fontSize: 11, color: C.subText, fontWeight: "600", flexShrink: 1 },

  rowBottomLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  preview: { flex: 1, fontSize: 12.5, color: C.subText },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "900" },
});
