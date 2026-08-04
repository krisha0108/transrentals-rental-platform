// screens/travel-agent/social/SocialChatScreen.js
// REDESIGNED — emerald-themed direct message thread on the social network.
//
// GET  /api/social/chat/conversations/[id]/messages  → { messages }
// POST /api/social/chat/conversations/[id]/messages  → { message }
//
// Polls every 5s while focused. Optimistic send with rollback.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar,
  Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import {
  listSocialMessages,
  sendSocialMessage,
} from "../../api/travelAgentClient";
import RemoteImage from "../_shared/RemoteImage";
import { DISPLAY } from "../_shared/typography";
import { SC as C, G, TONES } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

// Warm "Elevate" palette — same keys, repainted to match the feed, profile and
// the rest of the Travel Agent module. The old set was cool slate (#F6F8FB).
// Values now come from the shared Elevate theme; key names unchanged so no JSX
// edits were needed. Only the emerald family, inks and header gradient drifted.
const FILL = "#FBF8F1";
const HEADER_GRAD = G.hero;

const POLL_MS = 5000;

const TYPE_META = {
  vendor: { color: C.purple, icon: "storefront", label: "Vendor" },
  agent:  { color: C.blue,   icon: "airplane",   label: "Agent" },
};

function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function pickName(o) {
  if (!o) return "Someone";
  return o.displayName || o.businessName || o.agencyName || o.name || o.ownerName || "Someone";
}
function fmtTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}
function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso); if (isNaN(d.getTime())) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const diff = Math.round((today - t) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isMine(m) {
  if (m.__pending || m.__failed) return true;
  return m.isMine === true;
}
function parsePostCard(content) {
  if (typeof content !== "string" || !content.startsWith("{")) return null;
  try {
    const d = JSON.parse(content);
    if (d && d.__type === "post_card") return d;
  } catch {}
  return null;
}
// Drifting decorative bubble — same motion as the Feed / Profile / Fleet
// headers. Native-driven, loop stopped on unmount.
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

export default function SocialChatScreen({ navigation, route }) {
  const { id, other: initialOther } = route?.params || {};
  const [other, setOther] = useState(initialOther || {});
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const pollRef = useRef(null);
  const focusedRef = useRef(true);
  const lastIdRef = useRef(null);

  const load = useCallback(async ({ silent } = {}) => {
    if (!id) return;
    if (!silent) setError(null);
    try {
      const data = await listSocialMessages(id);
      const serverMsgs = data?.messages || [];
      setMessages((prev) => {
        const pending = prev.filter((m) => m.__pending);
        if (pending.length === 0) return serverMsgs;
        const out = [...serverMsgs];
        for (const p of pending) {
          const confirmed = serverMsgs.find(
            (s) => isMine(s) && (s.content || "") === p.content &&
              Math.abs(new Date(s.createdAt) - new Date(p.createdAt)) < 60000
          );
          if (!confirmed) out.push(p);
        }
        return out;
      });
      if (data?.other) setOther((prev) => ({ ...prev, ...data.other }));
    } catch (e) {
      if (!silent) setError(e?.response?.data?.error || e?.message || "Failed to load chat");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last && last.id !== lastIdRef.current) {
      lastIdRef.current = last.id;
      requestAnimationFrame(() => {
        try { listRef.current?.scrollToEnd({ animated: true }); } catch {}
      });
    }
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic = {
      id: `pending-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      __pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const { message } = await sendSocialMessage(id, text);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...message } : m)));
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, __failed: true } : m)));
      setDraft(text);
      Alert.alert("Send failed", e?.response?.data?.error || e?.message || "Try again.");
    } finally {
      setSending(false);
    }
  };

  // Group by day for sticky day breaks
  const withDayBreaks = [];
  let lastDay = null;
  for (const m of messages) {
    const day = fmtDay(m.createdAt);
    if (day !== lastDay) {
      withDayBreaks.push({ __dayBreak: true, day, key: `day-${day}-${m.id}` });
      lastDay = day;
    }
    withDayBreaks.push(m);
  }

  const typeMeta = TYPE_META[other.type] || TYPE_META.agent;
  const otherName = pickName(other);
  const canViewProfile = other?.type && other?.id;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* ===== Gradient chat header ===== */}
      <LinearGradient
        colors={HEADER_GRAD}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 10, paddingBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerCenter}
              onPress={() =>
                canViewProfile &&
                navigation.navigate("TASocialProfile", { type: other.type, id: other.id })
              }
              activeOpacity={canViewProfile ? 0.7 : 1}
              disabled={!canViewProfile}
            >
              {/* Avatar with type-color ring */}
              <View style={[styles.headerAvatarRing, { borderColor: shade(typeMeta.color, 30) }]}>
                {other.logo ? (
                  <RemoteImage source={{ uri: other.logo }} style={styles.headerAvatar} />
                ) : (
                  <LinearGradient
                    colors={[typeMeta.color, shade(typeMeta.color, -15)]}
                    style={styles.headerAvatar}
                  >
                    <Text style={styles.headerAvatarText}>{initials(otherName)}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
                <View style={styles.headerMetaRow}>
                  <Ionicons name={typeMeta.icon} size={10} color="rgba(255,255,255,0.95)" />
                  <Text style={styles.headerMeta}>{typeMeta.label}</Text>
                  {!!other.city && (
                    <>
                      <Text style={styles.headerMetaDot}>·</Text>
                      <Ionicons name="location" size={10} color="rgba(255,255,255,0.95)" />
                      <Text style={styles.headerMeta} numberOfLines={1}>{other.city}</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {canViewProfile && (
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate("TASocialProfile", { type: other.type, id: other.id })}
                activeOpacity={0.85}
              >
                <Ionicons name="person-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={C.emerald600} />
            <Text style={styles.loadingText}>Loading messages…</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={withDayBreaks}
            keyExtractor={(item) => item.__dayBreak ? item.key : item.id}
            renderItem={({ item }) =>
              item.__dayBreak ? (
                <View style={styles.dayBreak}>
                  <View style={styles.dayBreakLine} />
                  <View style={styles.dayPill}>
                    <Text style={styles.dayText}>{item.day}</Text>
                  </View>
                  <View style={styles.dayBreakLine} />
                </View>
              ) : (
                <Bubble message={item} mine={isMine(item)} />
              )
            }
            contentContainerStyle={
              messages.length === 0 ? styles.emptyWrap : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={42} color={C.emerald600} />
                </View>
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyBody}>
                  Say hi 👋 — your message will start the chat with {otherName}.
                </Text>
              </View>
            }
            onContentSizeChange={() => {
              try { listRef.current?.scrollToEnd({ animated: false }); } catch {}
            }}
          />
        )}

        {/* ===== Input bar ===== */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor="#A3B3C2"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
            />
            {draft.length > 1500 && (
              <Text style={styles.charCount}>{draft.length}/2000</Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtnWrap,
              (!draft.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={send}
            disabled={!draft.trim() || sending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.emerald500, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.sendBtnInner}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ───────── Bubble ───────── */

function Bubble({ message, mine }) {
  const failed = message.__failed;
  const pending = message.__pending;
  const card = parsePostCard(message.content);

  if (card) {
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <PostCardBubble card={card} mine={mine} time={message.createdAt} pending={pending} failed={failed} />
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {mine ? (
        // Outgoing bubble — emerald gradient
        <LinearGradient
          colors={[C.emerald500, C.emerald700]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine, failed && { opacity: 0.7 }]}
        >
          <Text style={[styles.bubbleText, { color: "#fff" }]}>{message.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={styles.bubbleTimeMine}>{fmtTime(message.createdAt)}</Text>
            <Ionicons
              name={
                failed ? "alert-circle" :
                pending ? "time-outline" :
                "checkmark-done"
              }
              size={12}
              color={failed ? "#F1D0CA" : "rgba(255,255,255,0.85)"}
              style={{ marginLeft: 4 }}
            />
          </View>
        </LinearGradient>
      ) : (
        // Incoming bubble — white
        <View style={[styles.bubble, styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, { color: C.ink }]}>{message.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={styles.bubbleTimeTheirs}>{fmtTime(message.createdAt)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ───────── Shared-post card bubble (redesigned) ───────── */

function PostCardBubble({ card, mine, time, pending, failed }) {
  const sos = !!card.isSOS;
  const headerColors = sos
    ? [C.red, "#DC2626"]
    : mine
    ? [C.emerald500, C.emerald700]
    : [C.emerald600, C.emerald700];

  return (
    <View style={[pcStyles.card, failed && { opacity: 0.7 }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={headerColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={pcStyles.header}
      >
        <View style={pcStyles.avatar}>
          <Text style={pcStyles.avatarText}>
            {(card.vendorName || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={pcStyles.name} numberOfLines={1}>{card.vendorName || "Partner"}</Text>
          {!!card.ownerName && (
            <Text style={pcStyles.owner} numberOfLines={1}>{card.ownerName}</Text>
          )}
        </View>
        {!!card.category && (
          <View style={pcStyles.categoryPill}>
            {sos && <Ionicons name="flash" size={9} color="#fff" />}
            <Text style={pcStyles.categoryText} numberOfLines={1}>{card.category}</Text>
          </View>
        )}
      </LinearGradient>
      {/* Body */}
      <View style={pcStyles.body}>
        <Text style={pcStyles.content} numberOfLines={5}>{card.content || ""}</Text>
      </View>
      {/* Footer */}
      <View style={pcStyles.footer}>
        <Ionicons name="bookmark" size={10} color={C.subText} />
        <Text style={pcStyles.footerText}>Shared post · TransRentals</Text>
        <View style={{ flex: 1 }} />
        <Text style={pcStyles.time}>{fmtTime(time)}</Text>
        {mine && (
          <Ionicons
            name={
              failed ? "alert-circle" :
              pending ? "time-outline" :
              "checkmark-done"
            }
            size={11}
            color={failed ? C.red : C.emerald600}
            style={{ marginLeft: 3 }}
          />
        )}
      </View>
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    width: 270,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  avatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
  name: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 13 },
  owner: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.8)", fontSize: 10.5, marginTop: 1, fontWeight: "600" },
  categoryPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  categoryText: { fontFamily: DISPLAY, color: "#fff", fontSize: 9.5, fontWeight: "bold", letterSpacing: 0.3, maxWidth: 80 },

  body: { paddingHorizontal: 12, paddingVertical: 11, backgroundColor: C.card },
  content: { fontFamily: DISPLAY, fontSize: 13, color: C.text, lineHeight: 18 },

  footer: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: FILL },
  footerText: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, fontWeight: "bold" },
  time: { fontFamily: DISPLAY, fontSize: 10, color: C.subText, marginLeft: 4, fontWeight: "600" },
});

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // Gradient header
  headerGrad: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -50, right: -34, width: 165, height: 165,
    borderRadius: 83, backgroundColor: "rgba(228,192,102,0.10)",
  },
  orbB: {
    position: "absolute", bottom: -46, left: -38, width: 135, height: 135,
    borderRadius: 68, backgroundColor: "rgba(23,166,124,0.14)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11 },
  headerAvatarRing: { width: 50, height: 50, borderRadius: 16, padding: 2, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  headerAvatar: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 15 },
  headerName: { fontFamily: DISPLAY, fontSize: 16.5, fontWeight: "bold", color: "#fff", lineHeight: 21, includeFontPadding: false },
  headerMetaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  headerMeta: { fontFamily: DISPLAY, fontSize: 10.5, color: "rgba(255,255,255,0.88)", fontWeight: "bold", lineHeight: 14, includeFontPadding: false, flexShrink: 1 },
  headerMetaDot: { fontFamily: DISPLAY, fontSize: 10.5, color: "rgba(255,255,255,0.7)", fontWeight: "bold" },
  headerActionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, padding: 10, backgroundColor: C.redLight, borderRadius: 12, borderWidth: 1, borderColor: "#E7B5AF" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, fontWeight: "600" },

  // List
  listContent: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 8 },

  // Day break
  dayBreak: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 12 },
  dayBreakLine: { flex: 1, height: 1, backgroundColor: C.border },
  dayPill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, backgroundColor: FILL, borderWidth: 1, borderColor: C.border },
  dayText: { fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.7, textTransform: "uppercase", includeFontPadding: false },

  // Bubble
  bubbleRow: { marginVertical: 2.5 },
  bubbleRowLeft: { alignItems: "flex-start" },
  bubbleRowRight: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 20,
    shadowColor: C.shadow, shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: {
    backgroundColor: C.card, borderBottomLeftRadius: 6,
    borderWidth: 1, borderColor: C.border,
  },
  bubbleText: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 20, includeFontPadding: false },
  bubbleFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 3 },
  bubbleTimeMine: { fontFamily: DISPLAY, fontSize: 9.5, color: "rgba(255,255,255,0.8)", fontWeight: "bold", includeFontPadding: false },
  bubbleTimeTheirs: { fontFamily: DISPLAY, fontSize: 9.5, color: C.subText, fontWeight: "bold", includeFontPadding: false },

  // Empty
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 24 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink, marginTop: 6 },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13, color: C.subText, marginTop: 8, textAlign: "center", paddingHorizontal: 16, lineHeight: 19 },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 10,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  inputWrap: { flex: 1, position: "relative" },
  input: {
    fontFamily: DISPLAY,
    fontSize: 14, color: C.ink,
    backgroundColor: FILL, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    minHeight: 44, maxHeight: 130,
    borderWidth: 1, borderColor: C.border,
  },
  charCount: { fontFamily: DISPLAY, position: "absolute", right: 12, bottom: 4, fontSize: 9.5, color: C.subText, fontWeight: "bold" },
  sendBtnWrap: {
    width: 44, height: 44, borderRadius: 22, overflow: "hidden",
    shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  sendBtnInner: { flex: 1, alignItems: "center", justifyContent: "center" },
});
