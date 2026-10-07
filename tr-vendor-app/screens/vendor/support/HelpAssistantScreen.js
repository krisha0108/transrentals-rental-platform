// screens/vendor/support/HelpAssistantScreen.js
// AI Help Assistant — app-side port of the web's floating VendorHelpBotWidget.tsx.
// Same public, unauthenticated FAQ endpoint (/api/vendor/help-chat, a
// DeepSeek-backed how-to assistant grounded in the real page structure — no
// account data, just "how do I..." answers). Web mounts it as a floating
// widget on every page; the app surfaces it as its own screen reached from
// Help & Support, mirroring screens/travel-agent/support/HelpAssistantScreen.js
// (a persistent cross-screen overlay isn't a fit for this navigator's structure).
//
// Reply links come back as markdown `[Label](/vendor/some-path)` —
// PATH_TO_SCREEN below maps each real web path to its app screen so those
// links are tappable here too, not just inert text.
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
  StatusBar,
} from "react-native";
// From react-native-keyboard-controller, not react-native — see the note in
// travel-agent's HelpAssistantScreen.js. RN's Android KeyboardAvoidingView
// double-counts the `adjustResize` shift and pushes the composer off-screen;
// the controller version pads only for the overlap it actually measures.
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { sendVendorHelpChat } from "../../api/client";
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
  "How do I register?",
  "How do I get approved?",
  "Booking kaise manage karu?",
  "Location/service kaise request karu?",
  "How do I add a vehicle?",
];

const GREETINGS = {
  auto: "Hi! Ask me how to register, get approved, request locations/services, manage bookings, fleet, staff or earnings — in English, Hindi or Hinglish, jaise bhi aapko comfortable ho.",
  english: "Hi! Ask me how to register, get approved, request locations/services, or manage your bookings, fleet, staff and earnings.",
  hindi: "नमस्ते! मुझसे पूछें कि रजिस्टर कैसे करें, अप्रूव कैसे हों, लोकेशन/सर्विस कैसे रिक्वेस्ट करें, या अपनी बुकिंग्स, फ्लीट, स्टाफ और अर्निंग्स कैसे मैनेज करें।",
  hinglish: "Hi! Mujhse poochho ki register kaise karein, approve kaise hon, location/service kaise request karein, ya apni bookings, fleet, staff aur earnings kaise manage karein.",
};

// Web path -> app navigation target. Paths with no in-app screen yet (Wander
// tours, fleet/bulk-booking analytics, auth pages the vendor is already past)
// are simply omitted, so their links render as plain text instead of a dead
// tappable pill. Keep in sync with BASE_SYSTEM_PROMPT in
// src/app/api/vendor/help-chat/route.ts if that path list changes.
const PATH_TO_SCREEN = {
  "/vendor/register": "VendorRegisterScreen",
  "/vendor/login": "VendorLoginScreen",
  "/vendor/forgot-password": "ForgotPasswordScreen",
  "/vendor/get-started": "GetStartedScreen",
  "/vendor/profile": "BusinessProfileScreen",
  "/vendor/documents": "VendorDocuments",
  "/vendor/locations": "VendorLocations",
  "/vendor/locations/request": "VendorLocations",
  "/vendor/services": "VendorServices",
  "/vendor/services/request": "VendorServices",
  "/vendor/bank-details": "BankDetailsScreen",

  "/vendor/bike-rentals/requests": "BikeQuoteRequests",
  "/vendor/bike-rentals/quotes": "BikeMyQuotes",
  "/vendor/bike-rentals/bookings": "BikeBookings",
  "/vendor/bike-rentals/templates": "BikeTemplates",
  "/vendor/bike-rentals/templates/create": "BikeCreateTemplate",

  "/vendor/self-drive/requests": "SelfDriveQuoteRequests",
  "/vendor/self-drive/quotes": "SelfDriveMyQuotes",
  "/vendor/self-drive/bookings": "SelfDriveBookings",
  "/vendor/self-drive/templates": "SelfDriveTemplates",
  "/vendor/self-drive/templates/create": "SelfDriveCreateTemplate",

  "/vendor/car-rental/bookings": "CarRentalBookings",

  "/vendor/luxury/requests": "LuxuryQuoteRequests",
  "/vendor/luxury/quotes": "LuxuryMyQuotes",
  "/vendor/luxury/bookings": "LuxuryBookings",
  "/vendor/luxury/templates": "LuxuryTemplates",
  "/vendor/luxury/templates/create": "LuxuryCreateTemplate",

  "/vendor/bus/requests": "BusQuoteRequests",
  "/vendor/bus/quotes": "BusMyQuotes",
  "/vendor/bus/bookings": "BusBookings",
  "/vendor/bus/templates": "BusTemplates",
  "/vendor/bus/templates/create": "BusCreateTemplate",

  "/vendor/packers/requests": "PackersQuoteRequests",
  "/vendor/packers/quotes": "PackersMyQuotes",
  "/vendor/packers/bookings": "PackersBookings",
  "/vendor/packers/templates": "PackersTemplates",
  "/vendor/packers/templates/create": "PackersCreateTemplate",

  "/vendor/transporter/requests": "TruckQuoteRequests",
  "/vendor/transporter/quotes": "TruckMyQuotes",
  "/vendor/transporter/bookings": "TruckBookings",
  "/vendor/transporter/templates": "TruckTemplates",
  "/vendor/transporter/templates/create": "TruckCreateTemplate",

  "/vendor/equipment/requests": "EquipmentQuoteRequests",
  "/vendor/equipment/quotes": "EquipmentMyQuotes",
  "/vendor/equipment/bookings": "EquipmentBookings",
  "/vendor/equipment/templates": "EquipmentTemplates",
  "/vendor/equipment/templates/create": "EquipmentCreateTemplate",

  "/vendor/booking-links": "BookingLinks",
  "/vendor/direct-bookings": "DirectBookings",
  "/vendor/direct-bookings/add": "AddDirectBooking",
  "/vendor/all-bookings": "AllBookings",

  "/vendor/b2b-bookings": "B2BOpenBookings",
  "/vendor/b2b-bookings/my-quotes": "B2BMyQuotes",

  "/vendor/fleet": "FleetListScreen",
  "/vendor/fleet/add": "AddVehicleScreen",
  "/vendor/fleet/documents": "FleetDocumentsScreen",
  "/vendor/fleet/service": "ServiceMaintenanceScreen",
  "/vendor/fleet/incidents": "IncidentsScreen",
  "/vendor/fleet/fuel": "FuelTrackingScreen",

  "/vendor/staff": "StaffListScreen",
  "/vendor/staff/add": "AddStaffScreen",
  "/vendor/staff/attendance": "StaffAttendanceScreen",
  "/vendor/staff/payroll": "StaffPayrollScreen",

  "/vendor/tracking": "VendorTracking",

  "/vendor/p2p": "P2PDashboard",
  "/vendor/p2p/vehicles": "BrowseVehiclesScreen",
  "/vendor/p2p/vehicles/post": "PostVehicleScreen",
  "/vendor/p2p/my-postings": "MyPostingsScreen",
  "/vendor/p2p/activity": "P2PActivityScreen",

  "/vendor/social": "SocialFeed",
  "/vendor/social/create": "CreatePostScreen",
  "/vendor/social/profile/me": "SocialProfileScreen",
  "/vendor/social/messages": "SocialMessagesScreen",

  "/vendor/chat": "ChatListScreen",
  "/vendor/financials": "Financials",
  "/vendor/notifications": "NotificationsScreen",
  "/vendor/support": "HelpSupportScreen",
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
      const data = await sendVendorHelpChat(next, language);
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
