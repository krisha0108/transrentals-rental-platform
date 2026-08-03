// screens/travel-agent/support/TASupportScreen.js
//
// REDESIGNED (v2) — "Elevate" visual language (ivory ground, forest→emerald
// gradient hero with floating orbs, serif DISPLAY type, glass cards), matching
// TravelAgentDashboardScreen / DocumentsScreen / GetStartedScreen.
//
// ⚠️ UI ONLY — no logic changes. Preserved exactly:
//   • tab state (faq / ticket / mytickets) + the FAQ accordion
//   • the contact-settings fetch and its hardcoded fallbacks
//   • loadMyTickets + the tab-driven effect
//   • handleSubmitTicket — same validations, same order, same Alert copy,
//     same 6s `submitted` banner timeout, same submitSupportTicket payload
//   • FAQS / TICKET_CATEGORIES data and all three Linking targets
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, TextInput, Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { submitSupportTicket, getMySupportTickets } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import AnimatedOrb from "../_shared/AnimatedOrb";
import { C, G, TONES, rs, rf, GUT, alpha, cardShadow, rowShadow } from "../_shared/theme";

// Hero ↔ contact-card spacing. Visible gap = HERO_TAIL + hero paddingBottom(8)
// − CARDS_OVERLAP. Both live inside the same scroll content, so the negative
// margin is NOT clipped (it was, back when the hero sat outside the ScrollView).
const HERO_TAIL = rs(26);
const CARDS_OVERLAP = rs(22);

// `icon` / `tone` are presentational only — the q/a copy is unchanged.
const FAQS = [
  {
    icon: "shield-checkmark", tone: "emerald",
    q: "How do I get my account approved?",
    a: "Upload your GST Certificate, PAN Card, and Address Proof in the Documents section. Your application is reviewed within 1-2 business days and you'll be notified once approved.",
  },
  {
    icon: "map", tone: "ocean",
    q: "How do I add tours to my portfolio?",
    a: "Go to Tours from the menu, then tap 'Add Tour'. Fill in the tour details, pricing, and photos. Your tour goes live immediately after submission.",
  },
  {
    icon: "people", tone: "plum",
    q: "How do I manage my leads?",
    a: "All incoming leads appear in Lead Management. Add notes, set follow-up reminders, and move leads through your pipeline with the kanban view.",
  },
  {
    icon: "wallet", tone: "amber",
    q: "When will I receive my earnings?",
    a: "Payouts are processed every Monday. Make sure your bank details are correctly added and a cancelled cheque is uploaded. Minimum payout is ₹500.",
  },
  {
    icon: "megaphone", tone: "rose",
    q: "How do SOS posts work?",
    a: "SOS posts appear as urgent story bubbles for 24 hours. Use them for genuine urgent requests — like needing a bus or vehicle immediately — so the community can respond quickly.",
  },
  {
    icon: "document-text", tone: "emerald",
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

// Neutral tone for CLOSED — TONES has no grey entry, so `toneFor` falls back
// to this for any key it doesn't know.
const NEUTRAL_TONE = { grad: [C.muted, C.sub], tint: C.tintSand, ink: C.sub };
const toneFor = (key) => TONES[key] || NEUTRAL_TONE;

// All FIVE helpdesk statuses. PENDING was previously missing from this map, so
// a pending ticket fell through to the OPEN styling and was mislabelled "Open"
// (prisma enum: OPEN | PENDING | IN_PROGRESS | RESOLVED | CLOSED).
const STATUS_STYLE = {
  OPEN:        { label: "Open",        tone: "ocean",   icon: "mail-open" },
  PENDING:     { label: "Pending",     tone: "amber",   icon: "hourglass" },
  IN_PROGRESS: { label: "In Progress", tone: "plum",    icon: "sync" },
  RESOLVED:    { label: "Resolved",    tone: "emerald", icon: "checkmark-done" },
  CLOSED:      { label: "Closed",      tone: "neutral", icon: "lock-closed" },
};

// `priority` is a free-text column (default "NORMAL"). Only non-default values
// get a chip — a "NORMAL" badge on every ticket would just be noise.
const PRIORITY_STYLE = {
  URGENT: { label: "Urgent", tone: "rose",  icon: "flame" },
  HIGH:   { label: "High",   tone: "amber", icon: "arrow-up-circle" },
  LOW:    { label: "Low",    tone: "ocean", icon: "arrow-down-circle" },
};

const TABS = [
  { key: "faq",       label: "FAQs",         icon: "help-circle-outline" },
  { key: "ticket",    label: "Raise Ticket", icon: "create-outline" },
  { key: "mytickets", label: "My Tickets",   icon: "ticket-outline" },
];

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
      <StatusBar barStyle="light-content" backgroundColor={C.forestDark} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: rs(40) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──
            Lives INSIDE the scroll content for two reasons: the contact cards'
            negative margin would otherwise be clipped by the ScrollView's own
            bounds, and letting the hero scroll away frees the whole screen for
            the FAQ / form / ticket content. Title sits on the button row to
            keep the header short. */}
        <LinearGradient
          colors={G.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />

          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: GUT }}>
            <View style={styles.heroTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-back" size={rs(19)} color="#fff" />
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              <View style={styles.circleBtn}>
                <Ionicons name="help-buoy-outline" size={rs(19)} color="#fff" />
              </View>
            </View>

            {/* Title on its own line, below the button row — sits in the middle
                of the hero rather than pinned to the top edge. */}
            <Text style={styles.heroTitle} numberOfLines={1}>Help &amp; Support</Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              We're here — usually within 24 hours
            </Text>

            <View style={{ height: HERO_TAIL }} />
          </SafeAreaView>
        </LinearGradient>

        {/* ── Contact cards, tucked into the hero curve ── */}
        <View style={styles.contactRow}>
          <ContactCard
            tone="ocean"
            icon="call"
            label="Call Us"
            value={contactPhone}
            onPress={() => Linking.openURL(`tel:${contactPhone.replace(/\s/g, "")}`)}
          />
          <ContactCard
            tone="emerald"
            icon="logo-whatsapp"
            label="WhatsApp"
            value="Chat Now"
            onPress={() => Linking.openURL("https://wa.me/919737965551")}
          />
          <ContactCard
            tone="plum"
            icon="mail"
            label="Email"
            value="Email Us"
            onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
          />
        </View>

        {/* ── Segmented tabs ── */}
        <View style={styles.segRow}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.seg, on && styles.segOn]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t.icon}
                  size={rs(14)}
                  color={on ? "#fff" : C.sub}
                />
                <Text style={[styles.segTxt, on && styles.segTxtOn]} numberOfLines={1}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── FAQs ── */}
        {tab === "faq" && (
          <View style={styles.body}>
            <SectionLabel icon="help-circle" tone="emerald" label="Frequently asked" />
            {FAQS.map((faq, i) => (
              <FaqCard
                key={i}
                faq={faq}
                open={expanded === i}
                onPress={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </View>
        )}

        {/* ── Raise Ticket ── */}
        {tab === "ticket" && (
          <View style={styles.body}>
            <SectionLabel icon="create" tone="ocean" label="Submit a ticket" />

            {submitted && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={rs(18)} color={C.emeraldDeep} />
                <Text style={styles.successText}>
                  Ticket submitted! We'll reply within 24 hours.
                </Text>
              </View>
            )}

            <View style={[styles.formCard, cardShadow]}>
              {/* Category */}
              <Text style={styles.fieldLabel}>
                Category <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.pickerBtn, showCatPicker && styles.pickerBtnOpen]}
                onPress={() => setShowCatPicker(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerBtnText, !selectedCatLabel && { color: C.muted }]}>
                  {selectedCatLabel || "Select category…"}
                </Text>
                <Ionicons
                  name={showCatPicker ? "chevron-up" : "chevron-down"}
                  size={rs(16)}
                  color={C.muted}
                />
              </TouchableOpacity>

              {showCatPicker && (
                <View style={styles.catDropdown}>
                  {TICKET_CATEGORIES.map((c, idx) => {
                    const on = category === c.value;
                    return (
                      <TouchableOpacity
                        key={c.value}
                        style={[
                          styles.catOption,
                          idx === TICKET_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
                          on && styles.catOptionActive,
                        ]}
                        onPress={() => { setCategory(c.value); setShowCatPicker(false); }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.catOptionText, on && styles.catOptionTextActive]}>
                          {c.label}
                        </Text>
                        {on && <Ionicons name="checkmark-circle" size={rs(17)} color={C.emeraldDeep} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Subject */}
              <Text style={[styles.fieldLabel, { marginTop: rs(15) }]}>
                Subject <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={C.muted}
                maxLength={120}
              />

              {/* Message */}
              <Text style={[styles.fieldLabel, { marginTop: rs(15) }]}>
                Message <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue in detail…"
                placeholderTextColor={C.muted}
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
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={G.emerald}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.submitInner}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={rs(16)} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit Ticket</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.responseNote}>
                <Ionicons name="time-outline" size={rs(13)} color={C.muted} />
                <Text style={styles.responseNoteText}>Expected response: within 24 hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── My Tickets ── */}
        {tab === "mytickets" && (
          <View style={styles.body}>
            <View style={styles.ticketsHeader}>
              <SectionLabel icon="ticket" tone="plum" label="My tickets" flush />
              <TouchableOpacity
                onPress={loadMyTickets}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.refreshBtn}
              >
                <Ionicons
                  name="refresh"
                  size={rs(16)}
                  color={C.emeraldDeep}
                  style={loadingTickets ? { opacity: 0.5 } : null}
                />
              </TouchableOpacity>
            </View>

            {loadingTickets ? (
              <View style={styles.ticketsEmpty}>
                <ActivityIndicator color={C.emeraldDeep} />
              </View>
            ) : myTickets.length === 0 ? (
              <View style={[styles.emptyCard, cardShadow]}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="ticket-outline" size={rs(28)} color={C.emeraldDeep} />
                </View>
                <Text style={styles.emptyTitle}>No tickets yet</Text>
                <Text style={styles.emptySub}>
                  Submit a ticket if you need help with anything.
                </Text>
                <TouchableOpacity
                  onPress={() => setTab("ticket")}
                  style={styles.raiseBtn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={rs(14)} color={C.emeraldDeep} />
                  <Text style={styles.raiseBtnText}>Raise a Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myTickets.map((t) => <TicketCard key={t.id} t={t} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function ContactCard({ tone, icon, label, value, onPress }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <TouchableOpacity
      style={[styles.contactCard, cardShadow]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={t.grad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.contactIcon}
      >
        <Ionicons name={icon} size={rs(18)} color="#fff" />
      </LinearGradient>
      <Text style={styles.contactLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.contactValue, { color: t.ink }]} numberOfLines={1}>{value}</Text>
    </TouchableOpacity>
  );
}

// Ticket row. Status drives the left rail, the icon tile (gradient once the
// ticket is resolved/closed) and the status chip. `priority` and `resolvedAt`
// come back from the API and were previously never rendered.
function TicketCard({ t }) {
  const st = STATUS_STYLE[t.status] || STATUS_STYLE.OPEN;
  const sTone = toneFor(st.tone);
  const pr = PRIORITY_STYLE[String(t.priority || "").toUpperCase()];
  const pTone = pr ? toneFor(pr.tone) : null;
  const settled = t.status === "RESOLVED" || t.status === "CLOSED";

  return (
    <View style={[styles.ticketCard, rowShadow]}>
      <View style={[styles.ticketRail, { backgroundColor: sTone.ink }]} />

      <View style={styles.ticketBody}>
        <View style={styles.ticketTop}>
          {settled ? (
            <LinearGradient
              colors={sTone.grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ticketIcon}
            >
              <Ionicons name={st.icon} size={rs(17)} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={[styles.ticketIcon, { backgroundColor: sTone.tint }]}>
              <Ionicons name={st.icon} size={rs(17)} color={sTone.ink} />
            </View>
          )}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.ticketHeading} numberOfLines={2}>{t.heading}</Text>

            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: sTone.tint }]}>
                <View style={[styles.statusDot, { backgroundColor: sTone.ink }]} />
                <Text style={[styles.chipText, { color: sTone.ink }]}>{st.label}</Text>
              </View>

              {pr && (
                <View style={[styles.chip, { backgroundColor: pTone.tint }]}>
                  <Ionicons name={pr.icon} size={rs(10)} color={pTone.ink} />
                  <Text style={[styles.chipText, { color: pTone.ink }]}>{pr.label}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer meta — ticket number + raised date, split by a hairline */}
        <View style={styles.ticketFooter}>
          <View style={styles.metaLine}>
            <Ionicons name="pricetag-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.ticketNo} numberOfLines={1}>{t.ticketNo}</Text>
          </View>
          <View style={styles.metaLine}>
            <Ionicons name="calendar-outline" size={rs(11)} color={C.muted} />
            <Text style={styles.ticketDate}>Raised {fmtDate(t.createdAt)}</Text>
          </View>
        </View>

        {!!t.resolution && (
          <View style={styles.resolutionBox}>
            <View style={styles.resolutionHead}>
              <Ionicons name="chatbubble-ellipses" size={rs(12)} color={C.emeraldDeep} />
              <Text style={styles.resolutionLabel}>Admin response</Text>
              {!!t.resolvedAt && (
                <Text style={styles.resolutionDate}>{fmtDate(t.resolvedAt)}</Text>
              )}
            </View>
            <Text style={styles.resolutionText}>{t.resolution}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Accordion row. Collapsed: tinted topic icon + question + chevron chip.
// Open: icon tile fills with its gradient, the question takes the tone colour,
// and the answer drops into a tinted panel with a matching left rail.
function FaqCard({ faq, open, onPress }) {
  const t = TONES[faq.tone] || TONES.emerald;
  return (
    <TouchableOpacity
      style={[styles.faqItem, rowShadow, open && { borderColor: alpha(t.ink, 0.25) }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.faqHeader}>
        {open ? (
          <LinearGradient
            colors={t.grad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.faqIcon}
          >
            <Ionicons name={faq.icon} size={rs(17)} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[styles.faqIcon, { backgroundColor: t.tint }]}>
            <Ionicons name={faq.icon} size={rs(17)} color={t.ink} />
          </View>
        )}

        <Text
          style={[styles.faqQ, open && { color: t.ink }]}
          numberOfLines={open ? undefined : 2}
        >
          {faq.q}
        </Text>

        <View style={[styles.faqChev, open && { backgroundColor: t.tint }]}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={rs(14)}
            color={open ? t.ink : C.muted}
          />
        </View>
      </View>

      {open && (
        <View
          style={[
            styles.faqAnswerWrap,
            { backgroundColor: alpha(t.ink, 0.045), borderLeftColor: t.ink },
          ]}
        >
          <Text style={styles.faqA}>{faq.a}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectionLabel({ icon, tone, label, flush }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <View style={[styles.sectionLabelRow, flush && { marginBottom: 0 }]}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: t.tint }]}>
        <Ionicons name={icon} size={rs(13)} color={t.ink} />
      </View>
      <Text style={[styles.sectionLabelText, { color: t.ink }]}>{label}</Text>
    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  // ── Hero ──
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    overflow: "hidden",
  },
  orbA: {
    position: "absolute", top: -rs(60), right: -rs(40),
    width: rs(190), height: rs(190), borderRadius: rs(95),
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  orbB: {
    position: "absolute", bottom: -rs(70), left: -rs(50),
    width: rs(170), height: rs(170), borderRadius: rs(85),
    backgroundColor: "rgba(46,158,120,0.16)",
  },
  heroTop: {
    flexDirection: "row", alignItems: "center",
    gap: rs(11), paddingTop: rs(10),
  },
  circleBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    fontFamily: DISPLAY, fontSize: rf(21), lineHeight: rf(27),
    color: "#fff", letterSpacing: 0.2, marginTop: rs(14),
  },
  heroSub: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    color: "rgba(255,255,255,0.65)", fontWeight: "bold", marginTop: rs(2),
  },

  // ── Contact cards ──
  // Slightly inset from the content gutter and with a wider inter-card gap,
  // so the three cards read as compact chips rather than full-width blocks.
  contactRow: {
    flexDirection: "row", gap: rs(12),
    marginHorizontal: GUT + rs(6), marginTop: -CARDS_OVERLAP,
  },
  contactCard: {
    flex: 1, minWidth: 0,
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.glassBorder,
    paddingVertical: rs(10), paddingHorizontal: rs(6),
    alignItems: "center",
  },
  contactIcon: {
    width: rs(32), height: rs(32), borderRadius: rs(11),
    alignItems: "center", justifyContent: "center", marginBottom: rs(6),
  },
  contactLabel: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(12), color: C.muted,
    fontWeight: "bold", letterSpacing: 0.4, textTransform: "uppercase",
  },
  contactValue: {
    fontFamily: DISPLAY, fontSize: rf(10), lineHeight: rf(13),
    fontWeight: "bold", textAlign: "center", marginTop: rs(1),
  },

  // ── Segmented tabs ──
  segRow: {
    flexDirection: "row", gap: rs(7),
    marginHorizontal: GUT, marginTop: rs(18),
  },
  seg: {
    flex: 1, minWidth: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: rs(5), height: rs(38), paddingHorizontal: rs(6), borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  segOn: { backgroundColor: C.emeraldDeep, borderColor: C.emeraldDeep },
  segTxt: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", color: C.sub, flexShrink: 1,
  },
  segTxtOn: { color: "#fff" },

  body: { paddingHorizontal: GUT, paddingTop: rs(18) },

  // ── Section label ──
  sectionLabelRow: {
    flexDirection: "row", alignItems: "center",
    gap: rs(7), marginBottom: rs(12),
  },
  sectionLabelIcon: {
    width: rs(26), height: rs(26), borderRadius: rs(9),
    alignItems: "center", justifyContent: "center",
  },
  sectionLabelText: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", letterSpacing: 0.6, textTransform: "uppercase",
  },

  // ── FAQ ──
  faqItem: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    marginBottom: rs(9), overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: rs(12), paddingHorizontal: rs(12), gap: rs(11),
  },
  faqIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
  },
  faqQ: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(13), lineHeight: rf(18),
    fontWeight: "bold", color: C.ink,
  },
  faqChev: {
    width: rs(26), height: rs(26), borderRadius: rs(13),
    backgroundColor: C.ivory,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  faqAnswerWrap: {
    marginHorizontal: rs(12), marginBottom: rs(12),
    marginLeft: rs(59),
    borderRadius: rs(12), borderLeftWidth: rs(3),
    paddingHorizontal: rs(12), paddingVertical: rs(11),
  },
  faqA: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(19),
    color: C.sub, fontWeight: "600",
  },

  // ── Ticket form ──
  formCard: {
    backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: C.glassBorder,
    padding: rs(16), marginBottom: rs(16),
  },
  fieldLabel: {
    fontFamily: DISPLAY, fontSize: rf(11.5), lineHeight: rf(15),
    fontWeight: "bold", color: C.sub,
    marginBottom: rs(7), letterSpacing: 0.3, textTransform: "uppercase",
  },
  req: { color: C.gold, fontWeight: "bold" },
  pickerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: C.border, borderRadius: rs(12),
    paddingHorizontal: rs(13), height: rs(48),
    backgroundColor: C.ivory,
  },
  pickerBtnOpen: { borderColor: C.emerald, backgroundColor: C.card },
  pickerBtnText: {
    fontFamily: DISPLAY, fontSize: rf(13.5), color: C.ink, fontWeight: "600",
  },
  catDropdown: {
    borderWidth: 1, borderColor: C.border, borderRadius: rs(12),
    marginTop: rs(6), backgroundColor: C.card, overflow: "hidden",
  },
  catOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: rs(13), paddingVertical: rs(12),
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  catOptionActive: { backgroundColor: C.tintEmerald },
  catOptionText: {
    fontFamily: DISPLAY, fontSize: rf(13), lineHeight: rf(17),
    color: C.sub, fontWeight: "600",
  },
  catOptionTextActive: { color: C.emeraldDeep, fontWeight: "bold" },
  textInput: {
    fontFamily: DISPLAY,
    borderWidth: 1, borderColor: C.border, borderRadius: rs(12),
    paddingHorizontal: rs(13), paddingVertical: rs(11),
    fontSize: rf(13.5), color: C.ink, backgroundColor: C.ivory,
    minHeight: rs(48),
  },
  textArea: { height: rs(112), paddingTop: rs(11) },
  charCount: {
    fontFamily: DISPLAY, fontSize: rf(10.5), color: C.muted,
    textAlign: "right", marginTop: rs(5), fontWeight: "600",
  },
  submitBtn: {
    height: rs(50), borderRadius: rs(14),
    overflow: "hidden", marginTop: rs(14),
  },
  submitInner: {
    flex: 1, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: rs(8),
  },
  submitBtnText: {
    fontFamily: DISPLAY, fontSize: rf(14), fontWeight: "bold", color: "#fff",
  },
  responseNote: {
    flexDirection: "row", alignItems: "center",
    gap: rs(5), marginTop: rs(11), justifyContent: "center",
  },
  responseNoteText: {
    fontFamily: DISPLAY, fontSize: rf(11), color: C.muted, fontWeight: "600",
  },
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: rs(9),
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.2)",
    borderRadius: rs(14), padding: rs(13), marginBottom: rs(14),
  },
  successText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(17),
    color: C.emeraldDeep, fontWeight: "600", flex: 1,
  },

  // ── My tickets ──
  ticketsHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: rs(13),
  },
  refreshBtn: {
    width: rs(34), height: rs(34), borderRadius: rs(12),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center",
  },
  ticketsEmpty: { alignItems: "center", paddingVertical: rs(40) },

  emptyCard: {
    alignItems: "center", paddingVertical: rs(30), paddingHorizontal: rs(20),
    backgroundColor: C.card, borderRadius: rs(18),
    borderWidth: 1, borderColor: C.glassBorder,
  },
  emptyIcon: {
    width: rs(56), height: rs(56), borderRadius: rs(18),
    backgroundColor: C.tintEmerald,
    alignItems: "center", justifyContent: "center", marginBottom: rs(12),
  },
  emptyTitle: {
    fontFamily: DISPLAY, fontSize: rf(15), lineHeight: rf(20),
    fontWeight: "bold", color: C.ink,
  },
  emptySub: {
    fontFamily: DISPLAY, fontSize: rf(12.5), lineHeight: rf(18),
    color: C.sub, textAlign: "center", fontWeight: "600", marginTop: rs(4),
  },
  raiseBtn: {
    flexDirection: "row", alignItems: "center", gap: rs(6),
    marginTop: rs(14),
    backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.2)",
    borderRadius: rs(12), paddingHorizontal: rs(15), paddingVertical: rs(10),
  },
  raiseBtnText: {
    fontFamily: DISPLAY, fontSize: rf(12.5), fontWeight: "bold", color: C.emeraldDeep,
  },

  ticketCard: {
    flexDirection: "row",
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    marginBottom: rs(10), overflow: "hidden",
  },
  ticketRail: { width: rs(4) },
  ticketBody: { flex: 1, padding: rs(13) },

  ticketTop: { flexDirection: "row", alignItems: "flex-start", gap: rs(11) },
  ticketIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(12),
    alignItems: "center", justifyContent: "center",
  },
  ticketHeading: {
    fontFamily: DISPLAY, fontSize: rf(13.5), lineHeight: rf(18),
    fontWeight: "bold", color: C.ink,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: rs(6), marginTop: rs(7) },
  chip: {
    flexDirection: "row", alignItems: "center", gap: rs(5),
    borderRadius: 999, paddingHorizontal: rs(9), paddingVertical: rs(4),
  },
  statusDot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
  chipText: {
    fontFamily: DISPLAY, fontSize: rf(9.5), lineHeight: rf(13),
    fontWeight: "bold", letterSpacing: 0.4,
  },

  // Footer meta sits below a hairline so the card has a clear head/foot split.
  ticketFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: rs(10), marginTop: rs(12), paddingTop: rs(10),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  metaLine: { flexDirection: "row", alignItems: "center", gap: rs(5), minWidth: 0 },
  ticketNo: {
    fontFamily: "monospace", fontSize: rf(10.5),
    color: C.muted, letterSpacing: 0.3, flexShrink: 1,
  },
  ticketDate: {
    fontFamily: DISPLAY, fontSize: rf(11), lineHeight: rf(15),
    color: C.muted, fontWeight: "600",
  },

  resolutionBox: {
    marginTop: rs(11), backgroundColor: C.tintEmerald,
    borderWidth: 1, borderColor: "rgba(28,107,82,0.18)",
    borderRadius: rs(12), padding: rs(11),
  },
  resolutionHead: { flexDirection: "row", alignItems: "center", gap: rs(5), marginBottom: rs(6) },
  resolutionLabel: {
    fontFamily: DISPLAY, flex: 1, fontSize: rf(10.5), lineHeight: rf(14),
    fontWeight: "bold", color: C.emeraldDeep,
    letterSpacing: 0.5, textTransform: "uppercase",
  },
  resolutionDate: {
    fontFamily: DISPLAY, fontSize: rf(10), lineHeight: rf(13),
    color: C.emeraldDeep, fontWeight: "bold", opacity: 0.7,
  },
  resolutionText: {
    fontFamily: DISPLAY, fontSize: rf(12), lineHeight: rf(17),
    color: C.sub, fontWeight: "600",
  },
});
