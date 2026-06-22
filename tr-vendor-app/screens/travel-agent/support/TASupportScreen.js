// screens/travel-agent/support/TASupportScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, TextInput, Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { submitSupportTicket, getMySupportTickets } from "../../api/travelAgentClient";

const C = {
  emerald600: "#059669",
  emerald700: "#047857",
  emerald500: "#10B981",
  emerald50:  "#ECFDF5",
  ink:        "#0F172A",
  text:       "#334155",
  subText:    "#64748B",
  bg:         "#F6F8FB",
  card:       "#FFFFFF",
  border:     "#E6EDF5",
  blue:       "#3B82F6",
  blueLight:  "#EFF6FF",
  red:        "#EF4444",
  redLight:   "#FEE2E2",
  purple:     "#8B5CF6",
  purpleLight:"#EDE9FE",
  green:      "#22C55E",
  greenLight: "#DCFCE7",
};

const FAQS = [
  {
    q: "How do I get my account approved?",
    a: "Upload your GST Certificate, PAN Card, and Address Proof in the Documents section. Your application is reviewed within 1-2 business days and you'll be notified once approved.",
  },
  {
    q: "How do I add tours to my portfolio?",
    a: "Go to Tours from the menu, then tap 'Add Tour'. Fill in the tour details, pricing, and photos. Your tour goes live immediately after submission.",
  },
  {
    q: "How do I manage my leads?",
    a: "All incoming leads appear in Lead Management. Add notes, set follow-up reminders, and move leads through your pipeline with the kanban view.",
  },
  {
    q: "When will I receive my earnings?",
    a: "Payouts are processed every Monday. Make sure your bank details are correctly added and a cancelled cheque is uploaded. Minimum payout is ₹500.",
  },
  {
    q: "How do SOS posts work?",
    a: "SOS posts appear as urgent story bubbles for 24 hours. Use them for genuine urgent requests — like needing a bus or vehicle immediately — so the community can respond quickly.",
  },
  {
    q: "What documents do I need to upload?",
    a: "Required: GST Certificate, PAN Card, Address Proof. Recommended: Business Registration, Cancelled Cheque (for payouts). All documents must be clear and valid.",
  },
];

const TICKET_CATEGORIES = [
  { value: "account",   label: "Account & Profile" },
  { value: "documents", label: "Documents & Verification" },
  { value: "leads",     label: "Leads & Pipeline" },
  { value: "tours",     label: "Tours & Properties" },
  { value: "bookings",  label: "Bookings & Orders" },
  { value: "payments",  label: "Payments & Earnings" },
  { value: "technical", label: "Technical Issue" },
  { value: "other",     label: "Other" },
];

const STATUS_STYLE = {
  OPEN:        { label: "Open",        bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  IN_PROGRESS: { label: "In Progress", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  RESOLVED:    { label: "Resolved",    bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  CLOSED:      { label: "Closed",      bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
};
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TASupportScreen({ navigation }) {
  const [tab, setTab] = useState("faq");
  const [expanded, setExpanded] = useState(null);
  const [contactEmail, setContactEmail] = useState("book@transrentals.in");
  const [contactPhone, setContactPhone] = useState("+91 97379 65551");

  // ticket form
  const [category, setCategory] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // my tickets
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    fetch("/api/public/contact-settings")
      .then(r => r.json())
      .then(d => {
        if (d.contactEmail) setContactEmail(d.contactEmail);
        if (d.contactPhone) setContactPhone(d.contactPhone);
      })
      .catch(() => {});
  }, []);

  const loadMyTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await getMySupportTickets();
      setMyTickets(data.tickets || []);
    } catch (e) {
      console.warn("tickets load err", e.message);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "mytickets") loadMyTickets();
  }, [tab]);

  const handleSubmitTicket = async () => {
    if (!category) { Alert.alert("Required", "Please select a category."); return; }
    if (!subject.trim()) { Alert.alert("Required", "Please enter a subject."); return; }
    if (!message.trim() || message.trim().length < 10) {
      Alert.alert("Required", "Please describe your issue (at least 10 characters)."); return;
    }
    setSubmitting(true);
    try {
      const data = await submitSupportTicket({ subject: subject.trim(), category, message: message.trim() });
      setSubmitting(false);
      if (data.success) {
        setSubmitted(true);
        setCategory(""); setSubject(""); setMessage("");
        setTimeout(() => setSubmitted(false), 6000);
        Alert.alert("Ticket Submitted", `Your ticket ${data.ticketNo} has been submitted. We'll respond within 24 hours.`);
      } else {
        Alert.alert("Error", data.error || "Failed to submit ticket. Please try again.");
      }
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const selectedCatLabel = TICKET_CATEGORIES.find(c => c.value === category)?.label || "";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Help & Support</Text>
              <Text style={styles.headerSub}>We're here to help</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="help-circle" size={22} color={C.emerald500} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Contact Cards */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL(`tel:${contactPhone.replace(/\s/g, "")}`)}>
            <View style={[styles.contactIcon, { backgroundColor: C.blueLight }]}>
              <Ionicons name="call" size={20} color={C.blue} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactValue} numberOfLines={1}>{contactPhone}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL("https://wa.me/919737965551")}>
            <View style={[styles.contactIcon, { backgroundColor: C.greenLight }]}>
              <Ionicons name="logo-whatsapp" size={20} color={C.green} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={[styles.contactValue, { color: C.green }]}>Chat Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
            <View style={[styles.contactIcon, { backgroundColor: C.purpleLight }]}>
              <Ionicons name="mail" size={20} color={C.purple} />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={[styles.contactValue, { color: C.purple }]} numberOfLines={1}>Email Us</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "faq" && styles.tabBtnActive]}
            onPress={() => setTab("faq")}
          >
            <Ionicons name="help-circle-outline" size={15} color={tab === "faq" ? C.emerald600 : C.subText} />
            <Text style={[styles.tabBtnText, tab === "faq" && styles.tabBtnTextActive]}>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "ticket" && styles.tabBtnActive]}
            onPress={() => setTab("ticket")}
          >
            <Ionicons name="create-outline" size={15} color={tab === "ticket" ? C.emerald600 : C.subText} />
            <Text style={[styles.tabBtnText, tab === "ticket" && styles.tabBtnTextActive]}>Raise Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "mytickets" && styles.tabBtnActive]}
            onPress={() => setTab("mytickets")}
          >
            <Ionicons name="ticket-outline" size={15} color={tab === "mytickets" ? C.emerald600 : C.subText} />
            <Text style={[styles.tabBtnText, tab === "mytickets" && styles.tabBtnTextActive]}>My Tickets</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        {tab === "faq" && (
          <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {FAQS.map((faq, i) => (
              <TouchableOpacity
                key={i}
                style={styles.faqItem}
                onPress={() => setExpanded(expanded === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQ} numberOfLines={expanded === i ? undefined : 2}>{faq.q}</Text>
                  <Ionicons
                    name={expanded === i ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={C.subText}
                    style={{ marginLeft: 8, flexShrink: 0 }}
                  />
                </View>
                {expanded === i && (
                  <Text style={styles.faqA}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Raise Ticket */}
        {tab === "ticket" && (
          <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
            <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>

            {submitted && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={C.green} />
                <Text style={styles.successText}>Ticket submitted! We'll reply within 24 hours.</Text>
              </View>
            )}

            <View style={styles.formCard}>
              {/* Category */}
              <Text style={styles.fieldLabel}>Category <Text style={{ color: C.red }}>*</Text></Text>
              <TouchableOpacity
                style={[styles.pickerBtn, showCatPicker && { borderColor: C.emerald600 }]}
                onPress={() => setShowCatPicker(v => !v)}
              >
                <Text style={[styles.pickerBtnText, !selectedCatLabel && { color: C.subText }]}>
                  {selectedCatLabel || "Select category..."}
                </Text>
                <Ionicons name={showCatPicker ? "chevron-up" : "chevron-down"} size={16} color={C.subText} />
              </TouchableOpacity>
              {showCatPicker && (
                <View style={styles.catDropdown}>
                  {TICKET_CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.catOption, category === c.value && styles.catOptionActive]}
                      onPress={() => { setCategory(c.value); setShowCatPicker(false); }}
                    >
                      <Text style={[styles.catOptionText, category === c.value && { color: C.emerald600, fontWeight: "600" }]}>
                        {c.label}
                      </Text>
                      {category === c.value && <Ionicons name="checkmark" size={16} color={C.emerald600} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Subject */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Subject <Text style={{ color: C.red }}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={C.subText}
                maxLength={120}
              />

              {/* Message */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Message <Text style={{ color: C.red }}>*</Text></Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={C.subText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.charCount}>{message.length}/2000</Text>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitTicket}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Ticket</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.responseNote}>
                <Ionicons name="time-outline" size={14} color={C.subText} />
                <Text style={styles.responseNoteText}>Expected response: Within 24 hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* My Tickets */}
        {tab === "mytickets" && (
          <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
            <View style={styles.ticketsHeader}>
              <Text style={styles.sectionTitle}>My Support Tickets</Text>
              <TouchableOpacity onPress={loadMyTickets} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="refresh" size={18} color={C.emerald600} style={loadingTickets ? { opacity: 0.5 } : {}} />
              </TouchableOpacity>
            </View>

            {loadingTickets ? (
              <View style={styles.ticketsEmpty}>
                <ActivityIndicator color={C.emerald600} />
              </View>
            ) : myTickets.length === 0 ? (
              <View style={styles.ticketsEmpty}>
                <Ionicons name="ticket-outline" size={36} color={C.border} />
                <Text style={styles.ticketsEmptyTitle}>No tickets yet</Text>
                <Text style={styles.ticketsEmptySubt}>Submit a ticket if you need help with anything.</Text>
                <TouchableOpacity onPress={() => setTab("ticket")} style={styles.raiseBtn}>
                  <Text style={styles.raiseBtnText}>Raise a Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myTickets.map((t) => {
                const st = STATUS_STYLE[t.status] || STATUS_STYLE.OPEN;
                return (
                  <View key={t.id} style={styles.ticketCard}>
                    <View style={styles.ticketRow}>
                      <Text style={styles.ticketNo}>{t.ticketNo}</Text>
                      <View style={[styles.statusPill, { backgroundColor: st.bg, borderColor: st.border }]}>
                        <Text style={[styles.statusPillText, { color: st.text }]}>{st.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.ticketHeading} numberOfLines={2}>{t.heading}</Text>
                    <Text style={styles.ticketDate}>Raised on {fmtDate(t.createdAt)}</Text>
                    {!!t.resolution && (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionLabel}>Admin Response:</Text>
                        <Text style={styles.resolutionText}>{t.resolution}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: C.emerald700,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  contactCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    alignItems: "center",
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  contactLabel: { fontSize: 11, color: C.subText, fontWeight: "500", marginBottom: 3 },
  contactValue: { fontSize: 11, color: C.blue, fontWeight: "600", textAlign: "center" },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  tabBtnActive: {
    backgroundColor: C.emerald50,
    borderBottomWidth: 2,
    borderBottomColor: C.emerald600,
  },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: C.subText },
  tabBtnTextActive: { color: C.emerald600 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.ink,
    marginBottom: 12,
  },

  faqItem: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  faqQ: { flex: 1, fontSize: 13, fontWeight: "600", color: C.ink, lineHeight: 18 },
  faqA: {
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  formCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FAFBFC",
  },
  pickerBtnText: { fontSize: 13, color: C.ink, fontWeight: "500" },
  catDropdown: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: C.card,
    overflow: "hidden",
  },
  catOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  catOptionActive: { backgroundColor: C.emerald50 },
  catOptionText: { fontSize: 13, color: C.text },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.ink,
    backgroundColor: "#FAFBFC",
  },
  textArea: {
    height: 110,
    paddingTop: 10,
  },
  charCount: {
    fontSize: 11,
    color: C.subText,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 2,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.emerald600,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 14,
  },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  responseNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    justifyContent: "center",
  },
  responseNoteText: { fontSize: 12, color: C.subText },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successText: { fontSize: 13, color: "#166534", fontWeight: "500", flex: 1 },

  ticketsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ticketsEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  ticketsEmptyTitle:  { fontSize: 15, fontWeight: "700", color: C.ink, marginTop: 4 },
  ticketsEmptySubt:   { fontSize: 13, color: C.subText, textAlign: "center" },
  raiseBtn: {
    marginTop: 6,
    backgroundColor: C.emerald50,
    borderWidth: 1,
    borderColor: C.emerald500,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  raiseBtnText: { fontSize: 13, fontWeight: "600", color: C.emerald600 },
  ticketCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ticketNo: { fontSize: 11, fontFamily: "monospace", color: C.subText },
  statusPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  ticketHeading: { fontSize: 13, fontWeight: "600", color: C.ink, lineHeight: 18 },
  ticketDate: { fontSize: 11, color: C.subText, marginTop: 3 },
  resolutionBox: {
    marginTop: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 8,
    padding: 10,
  },
  resolutionLabel: { fontSize: 11, fontWeight: "700", color: "#166534", marginBottom: 3 },
  resolutionText:  { fontSize: 12, color: "#166534", lineHeight: 17 },
});
