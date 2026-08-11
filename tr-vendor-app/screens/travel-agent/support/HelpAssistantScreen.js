// screens/travel-agent/support/HelpAssistantScreen.js
// AI Help Assistant — app-side port of the web's floating HelpBotWidget.tsx.
// Same public, unauthenticated FAQ endpoint (/api/travel-agent/help-chat, a
// DeepSeek-backed how-to assistant grounded in the real page structure — no
// account data, just "how do I..." answers). Web mounts it as a floating
// widget on every page; the app surfaces it as its own screen reached from
// Help & Support, since a persistent cross-screen overlay isn't a fit for
// this navigator's structure.
//
// Reply links come back as markdown `[Label](/travel-agent/some-path)` —
// PATH_TO_SCREEN below maps each real web path to its app screen so those
// links are tappable here too, not just inert text.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
  StatusBar,
} from "react-native";
// From react-native-keyboard-controller, not react-native — see the note in
// chats/ChatThreadScreen.js. RN's Android KeyboardAvoidingView double-counts
// the `adjustResize` shift and pushes the composer off-screen; the controller
// version pads only for the overlap it actually measures.
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { sendTravelAgentHelpChat } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import { C, G, rs, rf, GUT } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";

const LANGUAGES = [
  { value: "auto", label: "Auto" },
  { value: "english", label: "English" },
  { value: "hindi", label: "हिंदी" },
  { value: "hinglish", label: "Hinglish" },
];

const SUGGESTIONS = [
  "How do I get verified?",
  "Booking kaise manage karu?",
  "Lead kaise add karu?",
  "How do I add a property?",
];

const GREETINGS = {
  auto: "Hi! Ask me how to register, log in, get verified, or manage your leads, bookings, tours and properties — in English, Hindi or Hinglish, jaise bhi aapko comfortable ho.",
  english: "Hi! Ask me how to register, log in, get verified, or manage your leads, bookings, tours and properties.",
  hindi: "नमस्ते! मुझसे पूछें कि रजिस्टर कैसे करें, लॉग इन कैसे करें, वेरिफाई कैसे हों, या अपनी लीड्स, बुकिंग्स, टूर्स और प्रॉपर्टीज़ कैसे मैनेज करें।",
  hinglish: "Hi! Mujhse poochho ki register kaise karein, login kaise karein, verify kaise hon, ya apni leads, bookings, tours aur properties kaise manage karein.",
};

// Web path -> app navigation target. Paths with no in-app screen (auth pages
// the agent is already past, e.g. register/login) are simply omitted, so
// their links render as plain text instead of a dead tappable pill.
const PATH_TO_SCREEN = {
  "/travel-agent/profile": "TAProfile",
  "/travel-agent/documents": "TADocuments",
  "/travel-agent/bank-details": "TABankDetails",
  "/travel-agent/get-started": "TAGetStarted",
  "/travel-agent/leads": { screen: "TravelAgentDashboard", params: { screen: "TALeads" } },
  "/travel-agent/leads/add": "TAAddEditLead",
  "/travel-agent/pipeline": "TAPipeline",
  "/travel-agent/follow-ups": "TAFollowUps",
  "/travel-agent/tour-quote-requests": "TATourQuoteRequests",
  "/travel-agent/capture-links": "TACaptureLinks",
  "/travel-agent/bookings": { screen: "TravelAgentDashboard", params: { screen: "TABookings" } },
  "/travel-agent/bookings/add": "TAAddEditBooking",
  "/travel-agent/payments": "TAPayments",
  "/travel-agent/earnings": "TAEarnings",
  "/travel-agent/tours": "TATours",
  "/travel-agent/tours?addMode=open": "TATours",
  "/travel-agent/properties": "TAProperties",
  "/travel-agent/properties/add": "TAAddEditProperty",
  "/travel-agent/fleet": "TAFleet",
  "/travel-agent/fleet/add": "TAAddEditFleet",
  "/travel-agent/fleet/calendar": "TAFleetCalendar",
  "/travel-agent/fleet/insurance": "TAFleetInsurance",
  "/travel-agent/chats": { screen: "TravelAgentDashboard", params: { screen: "TAChats" } },
  "/travel-agent/social": "TASocialFeed",
  "/travel-agent/support": "TASupport",
};

// Splits a reply on markdown `[label](path)` links so each one renders as
// its own tappable inline Text span; everything else is plain text with
// `**bold**` markers stripped (RN Text can't do rich inline markdown without
// a parser library, and this bot's replies only ever use links + bold).
function renderReply(content, onNavigate) {
  const nodes = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m;
  let key = 0;
  const pushPlain = (text) => {
    if (!text) return;
    const cleaned = text.replace(/\*\*(.+?)\*\*/g, "$1");
    nodes.push(<Text key={key++}>{cleaned}</Text>);
  };
  while ((m = linkRe.exec(content)) !== null) {
    pushPlain(content.slice(lastIndex, m.index));
    const label = m[1];
    const path = m[2];
    const target = PATH_TO_SCREEN[path];
    if (target) {
      nodes.push(
        <Text
          key={key++}
          style={styles.inlineLink}
          onPress={() => onNavigate(target)}
        >
          {"  " + label + " ↗  "}
        </Text>
      );
    } else {
      pushPlain(label);
    }
    lastIndex = m.index + m[0].length;
  }
  pushPlain(content.slice(lastIndex));
  return nodes;
}

export default function HelpAssistantScreen({ navigation }) {
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("auto");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages, loading]);

  const goTo = (target) => {
    if (typeof target === "string") navigation.navigate(target);
    else navigation.navigate(target.screen, target.params);
  };

  const send = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await sendTravelAgentHelpChat(next, language);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.reply || data?.error || "Something went wrong." },
      ]);
    } catch (e) {
      // Resolve the message INSIDE the catch's own synchronous scope before
      // handing it to the setMessages updater — Hermes has a known issue
      // where a nested closure that reads a catch-bound variable (`e`) can
      // throw "Property 'e' doesn't exist" once React invokes that updater
      // later rather than synchronously.
      const errMsg = e?.response?.data?.error || "Connection error. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.headerTitle}>Help Assistant</Text>
              <Text style={styles.headerSub}>Ask how to do anything in the app</Text>
            </View>
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() => setShowLangMenu((v) => !v)}
                style={styles.langBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="language" size={14} color="#fff" />
                <Text style={styles.langBtnText}>
                  {LANGUAGES.find((l) => l.value === language)?.label}
                </Text>
              </TouchableOpacity>
              {showLangMenu && (
                <View style={styles.langMenu}>
                  {LANGUAGES.map((l) => (
                    <TouchableOpacity
                      key={l.value}
                      onPress={() => { setLanguage(l.value); setShowLangMenu(false); }}
                      style={styles.langMenuItem}
                    >
                      <Text style={[styles.langMenuText, language === l.value && styles.langMenuTextActive]}>
                        {l.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {messages.length > 0 && (
              <TouchableOpacity onPress={() => setMessages([])} style={styles.iconBtn} activeOpacity={0.8}>
                <Ionicons name="refresh" size={19} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* No keyboardVerticalOffset: this view is measured where it actually
          sits on screen (below the gradient header), so the header height is
          already accounted for. */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View>
              <View style={styles.bubbleRow}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={14} color={C.emeraldDeep} />
                </View>
                <View style={styles.botBubble}>
                  <Text style={styles.botBubbleText}>{GREETINGS[language]}</Text>
                </View>
              </View>
              <View style={styles.suggestRow}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => send(s)} activeOpacity={0.8}>
                    <Text style={styles.suggestChipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={[styles.bubbleRow, m.role === "user" && styles.bubbleRowMine]}>
                {m.role === "assistant" && (
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={14} color={C.emeraldDeep} />
                  </View>
                )}
                <View style={m.role === "user" ? styles.userBubble : styles.botBubble}>
                  {m.role === "user" ? (
                    <Text style={styles.userBubbleText}>{m.content}</Text>
                  ) : (
                    <Text style={styles.botBubbleText}>{renderReply(m.content, goTo)}</Text>
                  )}
                </View>
              </View>
            ))
          )}

          {loading && (
            <View style={styles.bubbleRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={14} color={C.emeraldDeep} />
              </View>
              <View style={styles.botBubble}>
                <ActivityIndicator size="small" color={C.emeraldDeep} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask how to do something…"
            placeholderTextColor={C.sub}
            editable={!loading}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGrad: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: "hidden" },
  orbA: { position: "absolute", top: -40, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(228,192,102,0.10)" },
  orbB: { position: "absolute", bottom: -20, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(23,166,124,0.14)" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 6, paddingBottom: 14, gap: 4 },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: "#fff" },
  headerSub: { fontFamily: DISPLAY, fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "600", marginTop: 1 },
  langBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.16)", paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999,
  },
  langBtnText: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold" },
  langMenu: {
    position: "absolute", top: 40, right: 0, backgroundColor: "#fff", borderRadius: 12,
    paddingVertical: 4, width: 110, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 8, zIndex: 20,
  },
  langMenuItem: { paddingHorizontal: 12, paddingVertical: 8 },
  langMenuText: { fontFamily: DISPLAY, fontSize: 12.5, color: C.text, fontWeight: "600" },
  langMenuTextActive: { color: C.forest, fontWeight: "bold" },

  scroll: { padding: GUT, paddingBottom: 20, gap: 10 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  bubbleRowMine: { flexDirection: "row-reverse" },
  botAvatar: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  botBubble: {
    maxWidth: "78%", backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 10,
  },
  botBubbleText: { fontFamily: DISPLAY, fontSize: 13.5, color: C.text, lineHeight: 19 },
  userBubble: {
    maxWidth: "78%", backgroundColor: C.emeraldDeep,
    borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 12, paddingVertical: 10,
  },
  userBubbleText: { fontFamily: DISPLAY, fontSize: 13.5, color: "#fff", lineHeight: 19 },
  inlineLink: {
    fontFamily: DISPLAY, fontSize: 12, fontWeight: "bold", color: C.forest,
    backgroundColor: C.tintEmerald, borderRadius: 999, overflow: "hidden",
  },

  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginLeft: 34, marginTop: 2 },
  suggestChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.tintEmerald, borderWidth: 1, borderColor: `${C.emeraldDeep}33`,
  },
  suggestChipText: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", color: C.forest },

  inputBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: GUT, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.card,
  },
  input: {
    flex: 1, fontFamily: DISPLAY, fontSize: 13.5, color: C.ink,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: C.emeraldDeep,
    alignItems: "center", justifyContent: "center",
  },
});
