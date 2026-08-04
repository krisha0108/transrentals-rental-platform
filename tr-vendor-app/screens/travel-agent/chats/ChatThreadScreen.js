// screens/travel-agent/chats/ChatThreadScreen.js
// REDESIGNED — emerald-themed customer chat thread.
//
// GET  /api/travel-agent-chat/conversations/[id]  → { conversation, messages }
//      (auto-marks incoming as READ)
// POST /api/travel-agent-chat/conversations/[id]  → { message }
//
// Polls every 5s while focused. Optimistic send with rollback.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  StatusBar,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { DISPLAY } from "../_shared/typography";
import {
  getTravelAgentConversation,
  sendTravelAgentChatMessage,
} from "../../api/travelAgentClient";
import { SC as C } from "../_shared/theme";


const POLL_INTERVAL_MS = 5000;
// Consistent avatar color from name hash
// Warm Elevate tones (was the bright set: #059669, #3B82F6, #EC4899 …).
const AVATAR_COLORS = ["#1C6B52", "#2C6E8C", "#5E43A8", "#C65772", "#9A6B16", "#2E9E78", "#245C7A", "#B14A64"];
function avatarColor(name) {
  if (!name) return C.subText;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
// Lighten/darken a hex by pct (-100..100). Used for avatar gradient endpoint.
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
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function fmtTime(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function fmtDay(iso) {
  if (!iso) return "";
  const d = new Date(iso); if (isNaN(d.getTime())) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const diff = Math.round((today - t) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

// Slowly drifting/pulsing decorative orb for the header — gentle ambient motion.
function AnimatedOrb({ style, delay = 0, dx = 14, dy = 12 }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 5200, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return (
    <Animated.View pointerEvents="none" style={[style, { transform: [{ translateX }, { translateY }, { scale }] }]} />
  );
}

export default function ChatThreadScreen({ navigation, route }) {
  const { id, customerName: initialName, customerPhone: initialPhone, leadId: initialLeadId } = route?.params || {};

  const [conversation, setConversation] = useState({
    id,
    customerName: initialName,
    customerPhone: initialPhone,
    leadId: initialLeadId,
  });
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
      const data = await getTravelAgentConversation(id);
      if (data?.conversation) {
        setConversation((prev) => ({ ...prev, ...data.conversation }));
      }
      const serverMsgs = data?.messages || [];
      setMessages((prev) => {
        const pending = prev.filter((m) => m.__pending);
        if (pending.length === 0) return serverMsgs;
        const out = [...serverMsgs];
        for (const p of pending) {
          const confirmed = serverMsgs.find(
            (s) => s.senderType === "agent" && s.content === p.content &&
              Math.abs(new Date(s.createdAt) - new Date(p.createdAt)) < 60000
          );
          if (!confirmed) out.push(p);
        }
        return out;
      });
    } catch (e) {
      if (!silent) setError(e?.response?.data?.error || e?.message || "Failed to load chat");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Focus + poll
  useEffect(() => {
    const sub1 = navigation.addListener("focus", () => {
      focusedRef.current = true;
      load();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => focusedRef.current && load({ silent: true }), POLL_INTERVAL_MS);
    });
    const sub2 = navigation.addListener("blur", () => {
      focusedRef.current = false;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    });
    return () => { sub1(); sub2(); if (pollRef.current) clearInterval(pollRef.current); };
  }, [navigation, load]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last && last.id !== lastIdRef.current) {
      lastIdRef.current = last.id;
      requestAnimationFrame(() => { try { listRef.current?.scrollToEnd({ animated: true }); } catch {} });
    }
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic = {
      id: `pending-${Date.now()}`,
      senderType: "agent",
      content: text,
      messageType: "TEXT",
      status: "SENT",
      createdAt: new Date().toISOString(),
      __pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const { message } = await sendTravelAgentChatMessage(id, text);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...message } : m)));
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, __failed: true } : m)));
      setDraft(text);
      Alert.alert("Send failed", e?.response?.data?.error || e?.message || "Try again.");
    } finally {
      setSending(false);
    }
  };

  const callPhone = () => conversation.customerPhone && Linking.openURL(`tel:${conversation.customerPhone}`).catch(() => {});
  const openWa = () => {
    const phone = conversation.customerPhone;
    if (!phone) return;
    const cleaned = String(phone).replace(/^\+?91/, "");
    Linking.openURL(`whatsapp://send?phone=91${cleaned}`).catch(() => Linking.openURL(`https://wa.me/91${cleaned}`));
  };
  const openLead = () => conversation.leadId && navigation.navigate("TALeadDetail", { id: conversation.leadId });

  // Group with day separators + compute message-grouping flags.
  // A "group" = consecutive messages from same sender within 60s — they
  // visually attach together with tighter spacing and shared tail.
  const withDayBreaks = [];
  let lastDay = null;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const day = fmtDay(m.createdAt);
    if (day !== lastDay) {
      withDayBreaks.push({ __dayBreak: true, day, key: `day-${day}-${m.id}` });
      lastDay = day;
    }
    const sameSenderAsPrev =
      prev && !prev.__dayBreak && prev.senderType === m.senderType &&
      (new Date(m.createdAt) - new Date(prev.createdAt)) < 60_000 &&
      fmtDay(prev.createdAt) === day;
    const sameSenderAsNext =
      next && next.senderType === m.senderType &&
      (new Date(next.createdAt) - new Date(m.createdAt)) < 60_000 &&
      fmtDay(next.createdAt) === day;
    withDayBreaks.push({
      ...m,
      __isFirstInGroup: !sameSenderAsPrev,
      __isLastInGroup: !sameSenderAsNext,
    });
  }

  const customerName = conversation.customerName || "Customer";
  const aColor = avatarColor(customerName);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />

      {/* Gradient header */}
      <LinearGradient
        colors={["#0F2A22", "#16382E", "#1C6B52"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <AnimatedOrb style={styles.orbA} delay={0} dx={12} dy={10} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-10} dy={8} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 8, paddingBottom: 10 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Avatar + name → tappable as ONE block. Opens lead profile when
                we have a leadId, otherwise inert (still touchable for feedback). */}
            <TouchableOpacity
              style={styles.headerCenter}
              onPress={openLead}
              disabled={!conversation.leadId}
              activeOpacity={conversation.leadId ? 0.7 : 1}
            >
              <LinearGradient
                colors={[aColor, shade(aColor, -18)]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.headerAvatar}
              >
                <Text style={styles.headerAvatarText}>{initials(customerName)}</Text>
              </LinearGradient>

              <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                <View style={styles.headerNameRow}>
                  <Text style={styles.headerName} numberOfLines={1}>{customerName}</Text>
                  {!!conversation.leadId && (
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.85)" />
                  )}
                </View>
                {!!conversation.customerPhone && (
                  <Text style={styles.headerSub} numberOfLines={1}>
                    {conversation.customerPhone}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Right-side actions — only Call + WhatsApp now.
                (Profile button removed; avatar+name now opens profile.) */}
            <View style={styles.headerActions}>
              {!!conversation.customerPhone && (
                <>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={callPhone} activeOpacity={0.85}>
                    <Ionicons name="call" size={17} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={openWa} activeOpacity={0.85}>
                    <Ionicons name="logo-whatsapp" size={19} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Subject sub-bar */}
      {!!conversation.subject && (
        <View style={styles.subjectBar}>
          <Ionicons name="bookmark" size={12} color={C.emerald600} />
          <Text style={styles.subjectText} numberOfLines={1}>{conversation.subject}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.errorRetry}>Retry</Text></TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={withDayBreaks}
            keyExtractor={(item) => item.__dayBreak ? item.key : item.id}
            renderItem={({ item }) =>
              item.__dayBreak ? (
                <View style={styles.dayBreak}>
                  <View style={styles.dayPill}><Text style={styles.dayText}>{item.day}</Text></View>
                </View>
              ) : (
                <Bubble message={item} />
              )
            }
            contentContainerStyle={messages.length === 0 ? styles.emptyWrap : styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="chatbubbles" size={36} color={C.emerald600} />
                </View>
                <Text style={styles.emptyTitle}>Say hi 👋</Text>
                <Text style={styles.emptyBody}>
                  Start the conversation by sending {customerName.split(" ")[0]} a message below.
                </Text>
              </View>
            }
            onContentSizeChange={() => { try { listRef.current?.scrollToEnd({ animated: false }); } catch {} }}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor="#9AA79E"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!draft.trim() || sending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                !draft.trim() || sending
                  ? ["#C9DED2", "#C9DED2"]
                  : [C.emerald500, C.emerald700]
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.sendBtnInner}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message }) {
  const isAgent = message.senderType === "agent";
  const pending = message.__pending;
  const failed = message.__failed;
  const isFirst = message.__isFirstInGroup;
  const isLast = message.__isLastInGroup;

  const onLongPress = () => {
    Alert.alert(
      "Message",
      message.content,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy",
          onPress: () => {
            Clipboard.setString(message.content || "");
          },
        },
      ]
    );
  };

  // Corner radii — WhatsApp-style tail only on first message of group.
  // Subsequent grouped messages get tight corners on the tail side.
  const cornerStyle = isAgent
    ? {
        // Right side (sent): tail in top-right corner of first message
        borderTopRightRadius: isFirst ? 4 : 14,
        borderBottomRightRadius: 14,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
      }
    : {
        // Left side (received): tail in top-left corner of first message
        borderTopLeftRadius: isFirst ? 4 : 14,
        borderBottomLeftRadius: 14,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
      };

  // Tighter vertical gap inside a group, normal between groups.
  const rowSpacing = {
    marginTop: isFirst ? 8 : 2,
    marginBottom: isLast ? 4 : 0,
  };

  // Status icon mapping — WhatsApp-style with READ in light-blue accent.
  const statusIcon = failed
    ? "alert-circle"
    : pending
    ? "time-outline"
    : message.status === "READ"
    ? "checkmark-done"
    : message.status === "DELIVERED"
    ? "checkmark-done"
    : "checkmark";
  const statusColor = failed
    ? "#FECACA"
    : message.status === "READ"
    ? "#7DD3FC" // sky-blue read receipts (matches WhatsApp blue)
    : "rgba(255,255,255,0.85)";

  return (
    <View
      style={[
        styles.bubbleRow,
        isAgent ? styles.bubbleRowRight : styles.bubbleRowLeft,
        rowSpacing,
      ]}
    >
      {isAgent ? (
        <Pressable onLongPress={onLongPress} delayLongPress={350}>
          <LinearGradient
            colors={[C.emerald500, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bubble, cornerStyle, styles.bubbleAgent, failed && styles.bubbleFailed]}
          >
            <Text style={[styles.bubbleText, { color: "#fff" }]}>{message.content}</Text>

            {/* Footer — only on last message of group to reduce clutter.
                Footer always visible if pending/failed so user gets feedback. */}
            {(isLast || pending || failed) && (
              <View style={styles.bubbleFooterAgent}>
                <Text style={[styles.bubbleTime, { color: "rgba(255,255,255,0.85)" }]}>
                  {fmtTime(message.createdAt)}
                </Text>
                <Ionicons
                  name={statusIcon}
                  size={13}
                  color={statusColor}
                  style={{ marginLeft: 4 }}
                />
                {failed && (
                  <Text style={styles.failedLabel}>· Tap & hold</Text>
                )}
              </View>
            )}
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable onLongPress={onLongPress} delayLongPress={350}>
          <View style={[styles.bubble, cornerStyle, styles.bubbleCustomer]}>
            {/* Show sender name only on first message of group (avoids
                repeating "Rohit Sharma" 5 times in a row). */}
            {!!message.senderName && isFirst && (
              <Text style={styles.senderName}>{message.senderName}</Text>
            )}
            <Text style={styles.bubbleText}>{message.content}</Text>
            {isLast && (
              <View style={styles.bubbleFooter}>
                <Text style={styles.bubbleTime}>{fmtTime(message.createdAt)}</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -40, right: -30, width: 150, height: 150,
    borderRadius: 75, backgroundColor: "rgba(201,154,63,0.10)",
  },
  orbB: {
    position: "absolute", top: 0, left: -50, width: 120, height: 120,
    borderRadius: 60, backgroundColor: "rgba(46,158,119,0.12)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // The whole avatar+name block — tappable to open lead profile.
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 },
  headerAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  headerAvatarText: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold", fontSize: 14 },

  headerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerName: { fontFamily: DISPLAY, fontSize: 15.5, fontWeight: "bold", color: "#fff", flexShrink: 1 },
  headerSub: { fontFamily: DISPLAY, fontSize: 11.5, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 },

  headerActions: { flexDirection: "row", gap: 4, marginLeft: 4 },
  actionIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginLeft: 4 },

  // Subject sub-bar
  subjectBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.emerald50 },
  subjectText: { fontFamily: DISPLAY, fontSize: 12, color: C.emerald700, fontWeight: "bold", flex: 1 },

  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, padding: 10, backgroundColor: "#FBEDEB", borderRadius: 10, borderWidth: 1, borderColor: "rgba(192,69,59,0.2)" },
  errorText: { fontFamily: DISPLAY, color: C.red, fontSize: 12.5, flex: 1 },
  errorRetry: { fontFamily: DISPLAY, color: C.red, fontWeight: "bold", fontSize: 12.5 },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 12, paddingBottom: 16 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 16 },
  empty: { alignItems: "center", padding: 32 },
  emptyIconBox: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: "rgba(28,107,82,0.12)" },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 19, fontWeight: "bold", color: C.ink, textAlign: "center" },
  emptyBody: { fontFamily: DISPLAY, fontSize: 13.5, color: C.subText, marginTop: 8, textAlign: "center", lineHeight: 20, maxWidth: 280 },

  // Day break
  dayBreak: { alignItems: "center", marginVertical: 12 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  dayText: { fontFamily: DISPLAY, fontSize: 11.5, color: C.subText, fontWeight: "bold", letterSpacing: 0.3 },

  // Bubbles
  bubbleRow: {},
  bubbleRowLeft: { alignItems: "flex-start" },
  bubbleRowRight: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6,
  },
  bubbleAgent: {
    shadowColor: C.emerald600, shadowOpacity: 0.22,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bubbleCustomer: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  // Failed agent bubble — keep emerald but add red border + subtle red glow
  // so user sees the problem without losing the "this is mine" cue.
  bubbleFailed: {
    borderWidth: 1.5, borderColor: C.red,
    shadowColor: C.red, shadowOpacity: 0.35, shadowRadius: 6,
  },
  senderName: { fontFamily: DISPLAY, fontSize: 11.5, color: C.emerald700, fontWeight: "bold", marginBottom: 2 },
  bubbleText: { fontFamily: DISPLAY, fontSize: 14.5, color: C.ink, lineHeight: 20 },

  // Footers
  bubbleFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    marginTop: 4,
  },
  bubbleFooterAgent: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    marginTop: 4, gap: 0,
  },
  bubbleTime: { fontFamily: DISPLAY, fontSize: 10.5, color: C.subText, fontWeight: "600" },
  failedLabel: {
    fontFamily: DISPLAY,
    fontSize: 10, color: "#FECACA", fontWeight: "bold",
    marginLeft: 6,
  },

  // Input bar
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card },
  inputWrap: { flex: 1, backgroundColor: "#FBF8F1", borderRadius: 22, borderWidth: 1, borderColor: C.border, paddingHorizontal: 4 },
  input: { fontFamily: DISPLAY, fontSize: 14.5, color: C.ink, paddingHorizontal: 14, paddingVertical: 10, minHeight: 40, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  sendBtnDisabled: { shadowOpacity: 0 },
  sendBtnInner: { flex: 1, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
