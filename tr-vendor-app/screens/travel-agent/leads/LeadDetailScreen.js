// screens/travel-agent/leads/LeadDetailScreen.js
// REDESIGNED — full lead detail with gradient hero, inline status/priority
// pickers, quick contact row, color-coded follow-up card, trip+money sections,
// notes timeline (vertical-line visualization), and a clear danger zone.
//
// Backend: GET /api/travel-agent/leads/[id] returns full lead + embedded notes[].
// Inline updates via PATCH /api/travel-agent/leads/[id] — backend auto-appends
// a "Status changed" note when status flips.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RemoteImage from "../_shared/RemoteImage";
import {
  getTravelAgentLead,
  updateTravelAgentLead,
  setTravelAgentLeadStatus,
  addTravelAgentLeadNote,
  deleteTravelAgentLead,
  convertTravelAgentLeadToBooking,
  sendTravelAgentLeadQuote,
  travelAgentLeadPaymentAction,
  listTravelAgentLeadVehicles,
  assignTravelAgentLeadVehicle,
  unassignTravelAgentLeadVehicle,
  startTravelAgentChatFromLead,
  listTravelAgentFleet,
  LEAD_STATUS,
  LEAD_PRIORITY,
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
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  whatsapp: "#25D366",
};

const STATUS_COLORS = {
  NEW:         { bg: "#DBEAFE", fg: "#1D4ED8" },
  CONTACTED:   { bg: "#CFFAFE", fg: "#0E7490" },
  INTERESTED:  { bg: "#D1FAE5", fg: "#047857" },
  QUOTED:      { bg: "#EDE9FE", fg: "#6D28D9" },
  NEGOTIATING: { bg: "#E0E7FF", fg: "#4338CA" },
  BOOKED:      { bg: "#DCFCE7", fg: "#15803D" },
  LOST:        { bg: "#FEE2E2", fg: "#B91C1C" },
  COLD:        { bg: "#F1F5F9", fg: "#475569" },
};
const PRIORITY_META = {
  HOT:  { fg: "#B91C1C", bg: "#FEE2E2", icon: "flame", avatarBg: "#E11D48" },
  WARM: { fg: "#A16207", bg: "#FEF3C7", icon: "sunny", avatarBg: C.amber },
  COLD: { fg: "#0369A1", bg: "#E0F2FE", icon: "snow",  avatarBg: C.blue },
};

const INR = (n) => (n == null || isNaN(Number(n))) ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
// Resolve the advance amount from a lead's quote (fixed ₹ wins, else % of total).
function quoteAdvance(lead) {
  if (!lead || lead.quotedAmount == null) return 0;
  if (lead.quoteAdvanceAmount != null) return Number(lead.quoteAdvanceAmount);
  if (lead.quoteAdvancePercent != null) return Math.round(Number(lead.quotedAmount) * Number(lead.quoteAdvancePercent) / 100);
  return 0;
}
// paymentProofImages is stored as a JSON string array of URLs (may be null).
function parseProofImages(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}
const PAYMENT_META = {
  PENDING:   { fg: "#A16207", bg: "#FEF3C7", label: "Awaiting customer", icon: "hourglass-outline" },
  SUBMITTED: { fg: "#6D28D9", bg: "#EDE9FE", label: "Proof submitted — review", icon: "document-attach" },
  VERIFIED:  { fg: "#15803D", bg: "#DCFCE7", label: "Verified", icon: "checkmark-circle" },
  REJECTED:  { fg: "#B91C1C", bg: "#FEE2E2", label: "Rejected", icon: "close-circle" },
};
const VEH_STATUS = ["CONFIRMED", "TENTATIVE", "COMPLETED", "CANCELLED"];
function vehStatusColor(s) {
  switch (s) {
    case "CONFIRMED": return { fg: "#15803D", bg: "#DCFCE7" };
    case "TENTATIVE": return { fg: "#A16207", bg: "#FEF3C7" };
    case "COMPLETED": return { fg: "#1D4ED8", bg: "#DBEAFE" };
    case "CANCELLED": return { fg: "#B91C1C", bg: "#FEE2E2" };
    default: return { fg: "#475569", bg: "#F1F5F9" };
  }
}
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatRelative = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  if (m < 20160) return `${Math.round(m / 1440)}d ago`;
  return formatDate(iso);
};
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function followUpUrgency(iso) {
  if (!iso) return { color: C.subText, bg: "#F1F5F9", label: "Not scheduled", icon: "calendar-outline" };
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  const diff = Math.round((t - today) / 86400000);
  if (diff < 0) return { color: C.red, bg: "#FEF2F2", label: `${Math.abs(diff)}d overdue`, icon: "alert-circle" };
  if (diff === 0) return { color: C.amber, bg: C.amberLight, label: "Due today", icon: "today" };
  if (diff === 1) return { color: C.blue, bg: C.blueLight, label: "Due tomorrow", icon: "calendar" };
  if (diff <= 7) return { color: C.blue, bg: C.blueLight, label: `In ${diff} days`, icon: "calendar" };
  return { color: C.subText, bg: "#F1F5F9", label: formatDate(iso), icon: "calendar-outline" };
}

export default function LeadDetailScreen({ navigation, route }) {
  const { id } = route?.params || {};
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReasonText, setLostReasonText] = useState("");
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // A1 — Quote modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [qAmount, setQAmount] = useState("");
  const [qAdvMode, setQAdvMode] = useState("PERCENT"); // 'PERCENT' | 'FIXED'
  const [qAdvValue, setQAdvValue] = useState("");
  const [qValidityDays, setQValidityDays] = useState("7");
  const [qTerms, setQTerms] = useState("");

  // A2 — Payment proof review
  const [savingPayment, setSavingPayment] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [viewerImage, setViewerImage] = useState(null);

  // A3 — Vehicle assignments
  const [assignments, setAssignments] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [fleetList, setFleetList] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [selFleetId, setSelFleetId] = useState(null);
  const [vStart, setVStart] = useState(null);
  const [vEnd, setVEnd] = useState(null);
  const [vAmount, setVAmount] = useState("");
  const [vStatus, setVStatus] = useState("CONFIRMED");
  const [vNotes, setVNotes] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);
  const [showVStartPicker, setShowVStartPicker] = useState(false);
  const [showVEndPicker, setShowVEndPicker] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await getTravelAgentLead(id);
      setLead(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load lead");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadVehicles = useCallback(async () => {
    if (!id) return;
    setLoadingVehicles(true);
    try {
      const data = await listTravelAgentLeadVehicles(id);
      setAssignments(data?.assignments || []);
    } catch {
      // non-fatal — section just shows empty
    } finally {
      setLoadingVehicles(false);
    }
  }, [id]);

  useEffect(() => { load(); loadVehicles(); }, [load, loadVehicles]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([load(), loadVehicles()]); };

  // ── A3: Vehicle assignment ──
  const openAssignModal = async () => {
    setSelFleetId(null);
    setVStart(lead?.travelDate ? new Date(lead.travelDate) : new Date());
    setVEnd(lead?.returnDate ? new Date(lead.returnDate) : (lead?.travelDate ? new Date(lead.travelDate) : new Date()));
    setVAmount("");
    setVStatus("CONFIRMED");
    setVNotes("");
    setShowAssignModal(true);
    if (!fleetList.length) {
      setLoadingFleet(true);
      try {
        const data = await listTravelAgentFleet({ isActive: true });
        setFleetList(data?.fleets || data?.fleet || data?.vehicles || (Array.isArray(data) ? data : []));
      } catch {
        // ignore — empty picker
      } finally {
        setLoadingFleet(false);
      }
    }
  };

  const submitAssign = async () => {
    if (!lead) return;
    if (!selFleetId) { Alert.alert("Pick a vehicle", "Select a vehicle to assign."); return; }
    const body = {
      fleetId: selFleetId,
      startDate: vStart ? vStart.toISOString() : undefined,
      endDate: vEnd ? vEnd.toISOString() : undefined,
      amount: vAmount === "" ? undefined : Number(vAmount),
      status: vStatus,
      notes: vNotes.trim() || undefined,
    };
    try {
      setSavingAssign(true);
      await assignTravelAgentLeadVehicle(lead.id, body);
      setShowAssignModal(false);
      await Promise.all([loadVehicles(), load()]);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 409) {
        const conf = e?.response?.data?.conflict;
        Alert.alert(
          "Vehicle not available",
          conf
            ? `Already booked ${formatDate(conf.startDate)} – ${formatDate(conf.endDate)}${conf.customerName ? ` for ${conf.customerName}` : ""}.`
            : "This vehicle is already booked/blocked in the selected dates."
        );
      } else {
        Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to assign vehicle");
      }
    } finally {
      setSavingAssign(false);
    }
  };

  const onUnassign = (assignment) => {
    Alert.alert("Remove vehicle?", `Unassign ${assignment.vehicleName || "this vehicle"} from the lead?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await unassignTravelAgentLeadVehicle(lead.id, assignment.id);
            await loadVehicles();
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to remove");
          }
        },
      },
    ]);
  };

  const changeStatus = async (status) => {
    setShowStatusModal(false);
    if (!lead || status === lead.status) return;
    // LOST → capture a reason first (web parity).
    if (status === "LOST") {
      setLostReasonText(lead.lostReason || "");
      setShowLostModal(true);
      return;
    }
    try {
      setSavingStatus(true);
      const { lead: updated } = await setTravelAgentLeadStatus(lead.id, status);
      setLead((prev) => ({ ...prev, ...updated }));
      // Reload to get the auto-appended status-change note
      load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const submitLost = async () => {
    if (!lead) return;
    try {
      setSavingStatus(true);
      const { lead: updated } = await updateTravelAgentLead(lead.id, {
        status: "LOST",
        lostReason: lostReasonText.trim() || null,
      });
      setLead((prev) => ({ ...prev, ...updated }));
      setShowLostModal(false);
      load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const changePriority = async (priority) => {
    setShowPriorityModal(false);
    if (!lead || priority === lead.priority) return;
    try {
      setSavingPriority(true);
      const { lead: updated } = await updateTravelAgentLead(lead.id, { priority });
      setLead((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to update priority");
    } finally {
      setSavingPriority(false);
    }
  };

  const changeFollowUp = async (date) => {
    setShowFollowUpPicker(false);
    if (!lead) return;
    try {
      const { lead: updated } = await updateTravelAgentLead(lead.id, { nextFollowUp: date.toISOString() });
      setLead((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
    }
  };

  const addNote = async () => {
    const text = noteText.trim();
    if (!text || !lead) return;
    try {
      setSavingNote(true);
      const { note } = await addTravelAgentLeadNote(lead.id, text);
      setLead((prev) => ({
        ...prev,
        notes: [note, ...(prev.notes || [])],
        lastContactAt: new Date().toISOString(),
      }));
      setNoteText("");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  const onDelete = () => {
    if (!lead) return;
    Alert.alert("Delete lead?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentLead(lead.id); navigation.goBack(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  const onConvert = async () => {
    setShowConvertModal(false);
    if (!lead) return;
    if (lead.convertedBookingId) {
      Alert.alert("Already converted", "This lead has already been converted to a booking.");
      return;
    }
    try {
      const { booking } = await convertTravelAgentLeadToBooking(lead.id);
      Alert.alert(
        "Booking created 🎉",
        `Booking ${booking.bookingNumber} created.\nLead status set to BOOKED.`,
        [{ text: "OK", onPress: load }]
      );
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to convert");
    }
  };

  // ── A1: Quote ──
  const openQuoteModal = () => {
    if (!lead) return;
    setQAmount(lead.quotedAmount != null ? String(lead.quotedAmount) : (lead.estimatedValue != null ? String(lead.estimatedValue) : ""));
    if (lead.quoteAdvanceAmount != null) {
      setQAdvMode("FIXED");
      setQAdvValue(String(lead.quoteAdvanceAmount));
    } else if (lead.quoteAdvancePercent != null) {
      setQAdvMode("PERCENT");
      setQAdvValue(String(lead.quoteAdvancePercent));
    } else {
      setQAdvMode("PERCENT");
      setQAdvValue("");
    }
    // Derive remaining validity days from quoteValidUntil, default 7
    if (lead.quoteValidUntil) {
      const days = Math.max(1, Math.round((new Date(lead.quoteValidUntil) - Date.now()) / 86400000));
      setQValidityDays(String(days || 7));
    } else {
      setQValidityDays("7");
    }
    setQTerms(lead.quoteTerms || "");
    setShowQuoteModal(true);
  };

  const submitQuote = async () => {
    if (!lead) return;
    const amount = Number(qAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Quote amount required", "Enter a valid quote amount.");
      return;
    }
    const advNum = qAdvValue === "" ? null : Number(qAdvValue);
    const days = Math.max(1, parseInt(qValidityDays) || 7);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);

    const payload = {
      quotedAmount: amount,
      quoteAdvanceAmount: qAdvMode === "FIXED" ? advNum : null,
      quoteAdvancePercent: qAdvMode === "PERCENT" ? advNum : null,
      quoteValidUntil: validUntil.toISOString(),
      quoteTerms: qTerms.trim() || null,
    };
    // Move the lead to QUOTED unless it's already further along.
    if (!["BOOKED", "NEGOTIATING"].includes(lead.status)) payload.status = "QUOTED";

    try {
      setSavingQuote(true);
      await sendTravelAgentLeadQuote(lead.id, payload);
      setShowQuoteModal(false);
      await load(); // refresh quote fields + auto-appended note
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to send quote");
    } finally {
      setSavingQuote(false);
    }
  };

  // ── A2: Payment proof review ──
  const verifyPayment = () => {
    if (!lead) return;
    Alert.alert(
      "Verify payment?",
      "Confirm you've received this advance. The lead will be marked BOOKED.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          onPress: async () => {
            try {
              setSavingPayment(true);
              await travelAgentLeadPaymentAction(lead.id, "VERIFY");
              await load();
            } catch (e) {
              Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to verify");
            } finally {
              setSavingPayment(false);
            }
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    if (!lead) return;
    try {
      setSavingPayment(true);
      await travelAgentLeadPaymentAction(lead.id, "REJECT", rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason("");
      await load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to reject");
    } finally {
      setSavingPayment(false);
    }
  };

  // ── A4: Start chat from lead ──
  const onStartChat = async () => {
    if (!lead) return;
    if (!lead.customerPhone) {
      Alert.alert("No phone number", "This lead has no phone number, so a chat can't be started.");
      return;
    }
    try {
      const res = await startTravelAgentChatFromLead(lead);
      const convId = res?.conversation?.id;
      if (convId) navigation.navigate("TAChatThread", { id: convId });
      else Alert.alert("Error", "Could not open the conversation.");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to start chat");
    }
  };

  const openTel = (phone) => phone && Linking.openURL(`tel:${phone}`).catch(() => {});
  const openWa = (phone) => {
    if (!phone) return;
    const cleaned = String(phone).replace(/^\+?91/, "");
    Linking.openURL(`whatsapp://send?phone=91${cleaned}`).catch(() =>
      Linking.openURL(`https://wa.me/91${cleaned}`)
    );
  };
  const openMail = (email) => email && Linking.openURL(`mailto:${email}`).catch(() => {});

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      </View>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.subText} />
          <Text style={styles.emptyTitle}>Lead not found</Text>
          {!!error && <Text style={styles.emptyBody}>{error}</Text>}
          <TouchableOpacity style={styles.backCta} onPress={() => navigation.goBack()}>
            <Text style={styles.backCtaText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.NEW;
  const pc = PRIORITY_META[lead.priority] || PRIORITY_META.WARM;
  const fu = followUpUrgency(lead.nextFollowUp);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.emerald600} />}
      >
        {/* ===== Gradient hero ===== */}
        <LinearGradient
          colors={["#022C22", "#064E3B", "#047857"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroWrap}
        >
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 12, paddingBottom: 40 }}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate("TAAddEditLead", { lead })}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onDelete}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.95)" />
              </TouchableOpacity>
            </View>

            {/* Avatar + name */}
            <View style={styles.identityRow}>
              <View style={[styles.avatar, { backgroundColor: pc.avatarBg }]}>
                <Text style={styles.avatarText}>{initials(lead.customerName)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.customerName} numberOfLines={1}>{lead.customerName || "—"}</Text>
                {!!lead.customerPhone && (
                  <Text style={styles.customerSub} numberOfLines={1}>📞 {lead.customerPhone}</Text>
                )}
                {!!lead.customerEmail && (
                  <Text style={styles.customerSub} numberOfLines={1}>✉ {lead.customerEmail}</Text>
                )}
              </View>
            </View>

            {/* Status + Priority chips (inline pickers) */}
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[styles.pickerPill, { backgroundColor: sc.bg }]}
                onPress={() => setShowStatusModal(true)}
                disabled={savingStatus}
                activeOpacity={0.85}
              >
                <View style={[styles.pickerDot, { backgroundColor: sc.fg }]} />
                <Text style={[styles.pickerPillText, { color: sc.fg }]}>{lead.status}</Text>
                {savingStatus ? <ActivityIndicator size={12} color={sc.fg} /> : <Ionicons name="chevron-down" size={13} color={sc.fg} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerPill, { backgroundColor: pc.bg }]}
                onPress={() => setShowPriorityModal(true)}
                disabled={savingPriority}
                activeOpacity={0.85}
              >
                <Ionicons name={pc.icon} size={12} color={pc.fg} />
                <Text style={[styles.pickerPillText, { color: pc.fg }]}>{lead.priority}</Text>
                {savingPriority ? <ActivityIndicator size={12} color={pc.fg} /> : <Ionicons name="chevron-down" size={13} color={pc.fg} />}
              </TouchableOpacity>

              {!!lead.convertedBookingId && (
                <View style={styles.convertedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#fff" />
                  <Text style={styles.convertedText}>Converted</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ===== Quick contact row (floating over gradient bottom) ===== */}
        <View style={styles.contactRowWrap}>
          <View style={styles.contactRow}>
            <ContactBtn icon="call" label="Call" color={C.emerald600} onPress={() => openTel(lead.customerPhone)} disabled={!lead.customerPhone} />
            <View style={styles.contactDivider} />
            <ContactBtn icon="logo-whatsapp" label="WhatsApp" color={C.whatsapp} onPress={() => openWa(lead.customerPhone)} disabled={!lead.customerPhone} />
            <View style={styles.contactDivider} />
            <ContactBtn icon="mail" label="Email" color={C.blue} onPress={() => openMail(lead.customerEmail)} disabled={!lead.customerEmail} />
          </View>
        </View>

        {/* ===== Primary actions ===== */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => lead.convertedBookingId
              ? navigation.navigate("TABookingDetail", { id: lead.convertedBookingId })
              : setShowConvertModal(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[C.emerald600, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryActionInner}
            >
              <Ionicons name={lead.convertedBookingId ? "open-outline" : "briefcase"} size={16} color="#fff" />
              <Text style={styles.primaryActionText}>
                {lead.convertedBookingId ? "View booking" : "Convert to booking"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={onStartChat}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles" size={18} color={C.emerald600} />
            <Text style={styles.iconActionText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={() => navigation.navigate("TAAddEditLead", { lead })}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color={C.emerald600} />
            <Text style={styles.iconActionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ===== Next follow-up card (color-coded urgency) ===== */}
        <SectionLabel icon="alarm" label="NEXT FOLLOW-UP" />
        <TouchableOpacity
          style={[styles.followUpCard, { backgroundColor: fu.bg, borderColor: fu.color + "33" }]}
          onPress={() => setShowFollowUpPicker(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.followUpIcon, { backgroundColor: fu.color }]}>
            <Ionicons name={fu.icon} size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.followUpLabel, { color: fu.color }]}>{fu.label}</Text>
            <Text style={styles.followUpDate}>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "Tap to schedule"}</Text>
            {lead.lastContactAt && (
              <Text style={styles.followUpMeta}>Last contact {formatRelative(lead.lastContactAt)}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={fu.color} />
        </TouchableOpacity>

        {/* ===== Trip details ===== */}
        <SectionLabel icon="map" label="TRIP DETAILS" />
        <View style={styles.card}>
          <InfoRow icon="map-outline" label="Trip type" value={lead.tripType ? lead.tripType.replace("_", " ") : "—"} />
          <InfoRow icon="location" label="Destination" value={lead.destination || "—"} />
          <InfoRow icon="navigate" label="Pickup" value={lead.pickupLocation || "—"} />
          <InfoRow icon="flag" label="Drop" value={lead.dropLocation || "—"} />
          <InfoRow icon="calendar-outline" label="Travel" value={formatDate(lead.travelDate)} />
          <InfoRow icon="calendar" label="Return" value={formatDate(lead.returnDate)} />
          <InfoRow icon="people" label="Passengers" value={lead.passengers ? String(lead.passengers) : "—"} />
          {!!lead.requirement && (
            <View style={styles.requirementBox}>
              <Text style={styles.requirementLabel}>REQUIREMENT</Text>
              <Text style={styles.requirementText}>{lead.requirement}</Text>
            </View>
          )}
        </View>

        {/* ===== Money / Quote ===== */}
        <SectionLabel icon="cash" label="DEAL VALUE" />
        <View style={styles.moneyRow}>
          <MoneyCard label="Estimated" value={INR(lead.estimatedValue)} color={C.blue} bg={C.blueLight} />
          <MoneyCard label="Quoted" value={INR(lead.quotedAmount)} color={C.emerald600} bg={C.emerald50} />
        </View>

        {/* Send / Update quote */}
        <TouchableOpacity style={styles.quoteCta} onPress={openQuoteModal} activeOpacity={0.9}>
          <Ionicons name="pricetag" size={15} color={C.emerald600} />
          <Text style={styles.quoteCtaText}>{lead.quotedAmount != null ? "Update quote" : "Send quote"}</Text>
        </TouchableOpacity>

        {/* Active quote card */}
        {lead.quotedAmount != null && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <View style={styles.quoteSplitRow}>
              <QuoteStat label="Total" value={INR(lead.quotedAmount)} color={C.ink} />
              <QuoteStat label="Advance" value={INR(quoteAdvance(lead))} color={C.emerald600} />
              <QuoteStat label="Balance" value={INR(Number(lead.quotedAmount) - (quoteAdvance(lead) || 0))} color={C.amber} />
            </View>
            {lead.quoteAdvancePercent != null && (
              <Text style={styles.quoteMeta}>Advance = {lead.quoteAdvancePercent}% of total</Text>
            )}
            {!!lead.quoteValidUntil && <InfoRow icon="time" label="Valid until" value={formatDate(lead.quoteValidUntil)} />}
            {!!lead.quoteSentAt && <InfoRow icon="send" label="Sent" value={formatRelative(lead.quoteSentAt)} />}
            {!!lead.quoteTerms && (
              <View style={styles.requirementBox}>
                <Text style={styles.requirementLabel}>TERMS</Text>
                <Text style={styles.requirementText}>{lead.quoteTerms}</Text>
              </View>
            )}
          </View>
        )}

        {/* ===== Advance payment (A2) ===== */}
        {(lead.paymentStatus || lead.customerAcceptedAt || parseProofImages(lead.paymentProofImages).length > 0) && (
          <>
            <SectionLabel icon="card" label="ADVANCE PAYMENT" />
            <View style={styles.card}>
              {(() => {
                const pm = PAYMENT_META[lead.paymentStatus] || PAYMENT_META.PENDING;
                return (
                  <View style={[styles.payStatusPill, { backgroundColor: pm.bg, alignSelf: "flex-start" }]}>
                    <Ionicons name={pm.icon} size={13} color={pm.fg} />
                    <Text style={[styles.payStatusText, { color: pm.fg }]}>{pm.label}</Text>
                  </View>
                );
              })()}

              <View style={{ marginTop: 6 }}>
                {!!lead.customerAcceptedAt && <InfoRow icon="checkmark-done" label="Customer accepted" value={formatRelative(lead.customerAcceptedAt)} />}
                <InfoRow icon="cash" label="Advance expected" value={INR(quoteAdvance(lead))} />
                {!!lead.paymentTxnId && <InfoRow icon="receipt" label="Txn / UTR" value={lead.paymentTxnId} />}
                {!!lead.paymentSubmittedAt && <InfoRow icon="time" label="Submitted" value={formatRelative(lead.paymentSubmittedAt)} />}
                {!!lead.paymentVerifiedAt && <InfoRow icon="shield-checkmark" label="Verified" value={formatRelative(lead.paymentVerifiedAt)} />}
              </View>

              {!!lead.paymentNote && (
                <View style={styles.requirementBox}>
                  <Text style={styles.requirementLabel}>CUSTOMER NOTE</Text>
                  <Text style={styles.requirementText}>{lead.paymentNote}</Text>
                </View>
              )}

              {parseProofImages(lead.paymentProofImages).length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Payment proof — tap to enlarge</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    {parseProofImages(lead.paymentProofImages).map((url, i) => (
                      <TouchableOpacity key={i} onPress={() => setViewerImage(url)} activeOpacity={0.85}>
                        <RemoteImage source={{ uri: url }} style={styles.proofThumb} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {lead.paymentStatus === "REJECTED" && !!lead.paymentRejectReason && (
                <View style={[styles.requirementBox, { backgroundColor: C.redLight, borderLeftColor: C.red }]}>
                  <Text style={[styles.requirementLabel, { color: C.red }]}>REJECTION REASON</Text>
                  <Text style={styles.requirementText}>{lead.paymentRejectReason}</Text>
                </View>
              )}

              {lead.paymentStatus === "SUBMITTED" && (
                <View style={styles.payActionsRow}>
                  <TouchableOpacity style={styles.payRejectBtn} onPress={() => setShowRejectModal(true)} disabled={savingPayment}>
                    <Ionicons name="close-circle" size={16} color={C.red} />
                    <Text style={styles.payRejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.payVerifyBtn} onPress={verifyPayment} disabled={savingPayment}>
                    {savingPayment ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.payVerifyText}>Verify & mark booked</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* ===== Assigned vehicles (A3) ===== */}
        <View style={styles.vehHeaderRow}>
          <SectionLabel icon="car-sport" label={`VEHICLES${assignments.length ? ` · ${assignments.length}` : ""}`} />
          <TouchableOpacity style={styles.vehAddBtn} onPress={openAssignModal} activeOpacity={0.85}>
            <Ionicons name="add" size={15} color={C.emerald600} />
            <Text style={styles.vehAddText}>Assign Vehicle</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.vehCalLink}
          onPress={() => navigation.navigate("TAFleetCalendar")}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={13} color={C.blue} />
          <Text style={styles.vehCalLinkText}>View on fleet calendar</Text>
          <Ionicons name="chevron-forward" size={13} color={C.blue} />
        </TouchableOpacity>
        {loadingVehicles && !assignments.length ? (
          <Text style={styles.vehEmpty}>Loading…</Text>
        ) : !assignments.length ? (
          <Text style={styles.vehEmpty}>No vehicles assigned yet — tap “Assign”.</Text>
        ) : (
          assignments.map((a) => {
            const vc = vehStatusColor(a.status);
            return (
              <View key={a.id} style={styles.vehCard}>
                {a.coverImage ? (
                  <RemoteImage source={{ uri: a.coverImage }} style={styles.vehThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.vehThumb, styles.vehThumbPlaceholder]}><Ionicons name="car" size={20} color={C.subText} /></View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.vehName} numberOfLines={1}>{a.vehicleName || "Vehicle"}</Text>
                  {!!a.registrationNumber && <Text style={styles.vehSub} numberOfLines={1}>{a.registrationNumber}</Text>}
                  <Text style={styles.vehSub}>{formatDate(a.startDate)} → {formatDate(a.endDate)}</Text>
                  <View style={styles.vehMetaRow}>
                    <View style={[styles.vehStatusPill, { backgroundColor: vc.bg }]}>
                      <Text style={[styles.vehStatusText, { color: vc.fg }]}>{a.status}</Text>
                    </View>
                    {a.amount != null && <Text style={styles.vehAmount}>{INR(a.amount)}</Text>}
                  </View>
                </View>
                <TouchableOpacity onPress={() => onUnassign(a)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={C.red} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* ===== Meta ===== */}
        <SectionLabel icon="information-circle" label="LEAD META" />
        <View style={styles.card}>
          <InfoRow icon="git-network" label="Source" value={lead.source || "—"} />
          <InfoRow icon="person-circle" label="Assigned to" value={lead.assignedToName || "—"} />
          <InfoRow icon="time-outline" label="Created" value={formatRelative(lead.createdAt)} />
          {!!lead.lostReason && <InfoRow icon="alert-circle" label="Lost reason" value={lead.lostReason} />}
        </View>

        {/* ===== Notes timeline ===== */}
        <SectionLabel
          icon="chatbubble-ellipses"
          label={`NOTES${lead.notes?.length ? ` · ${lead.notes.length}` : ""}`}
        />
        {/* Inline add note */}
        <View style={styles.noteInputCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note about this lead…"
            placeholderTextColor="#A3B3C2"
            value={noteText}
            onChangeText={setNoteText}
            multiline
          />
          <TouchableOpacity
            style={[styles.noteSendBtn, (!noteText.trim() || savingNote) && { opacity: 0.4 }]}
            onPress={addNote}
            disabled={!noteText.trim() || savingNote}
          >
            {savingNote ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Timeline */}
        {!lead.notes?.length ? (
          <Text style={styles.noNotes}>No notes yet — add the first one above.</Text>
        ) : (
          <View style={styles.timelineWrap}>
            {lead.notes.map((n, i) => (
              <View key={n.id} style={styles.timelineRow}>
                <View style={styles.timelineGutter}>
                  <View style={styles.timelineDot} />
                  {i < lead.notes.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineCard}>
                  <Text style={styles.timelineText}>{n.note}</Text>
                  <View style={styles.timelineFooter}>
                    {!!n.authorName && (
                      <View style={styles.authorChip}>
                        <Ionicons name="person" size={9} color={C.subText} />
                        <Text style={styles.authorText}>{n.authorName}</Text>
                      </View>
                    )}
                    <Text style={styles.timelineTime}>{formatRelative(n.createdAt)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Status picker */}
      <PickerModal
        visible={showStatusModal}
        title="Change status"
        options={LEAD_STATUS.map((s) => ({ value: s, label: s, color: STATUS_COLORS[s]?.fg, bg: STATUS_COLORS[s]?.bg }))}
        selected={lead.status}
        onClose={() => setShowStatusModal(false)}
        onSelect={changeStatus}
      />

      {/* Priority picker */}
      <PickerModal
        visible={showPriorityModal}
        title="Change priority"
        options={LEAD_PRIORITY.map((p) => ({ value: p, label: p, color: PRIORITY_META[p]?.fg, bg: PRIORITY_META[p]?.bg, icon: PRIORITY_META[p]?.icon }))}
        selected={lead.priority}
        onClose={() => setShowPriorityModal(false)}
        onSelect={changePriority}
      />

      {/* Convert confirm */}
      <Modal visible={showConvertModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <LinearGradient colors={[C.emerald500, C.emerald600]} style={styles.confirmIcon}>
              <Ionicons name="briefcase" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.confirmTitle}>Convert to booking?</Text>
            <Text style={styles.confirmBody}>
              A new booking is created with the lead's quoted/estimated amount. Lead status becomes BOOKED.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16, alignSelf: "stretch" }}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setShowConvertModal(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmOk} onPress={onConvert}>
                <Text style={styles.confirmOkText}>Convert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* A1 — Quote modal */}
      <Modal visible={showQuoteModal} animationType="slide" transparent onRequestClose={() => setShowQuoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lead.quotedAmount != null ? "Update quote" : "Send quote"}</Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
              {/* Amount */}
              <Text style={styles.fieldLabel}>Quote amount (₹) *</Text>
              <TextInput
                style={styles.fieldInput}
                value={qAmount}
                onChangeText={(t) => setQAmount(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="e.g. 45000"
                placeholderTextColor="#A3B3C2"
              />

              {/* Advance mode toggle */}
              <Text style={styles.fieldLabel}>Advance</Text>
              <View style={styles.segRow}>
                <TouchableOpacity
                  style={[styles.segBtn, qAdvMode === "PERCENT" && styles.segBtnActive]}
                  onPress={() => setQAdvMode("PERCENT")}
                >
                  <Text style={[styles.segText, qAdvMode === "PERCENT" && styles.segTextActive]}>Percent (%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segBtn, qAdvMode === "FIXED" && styles.segBtnActive]}
                  onPress={() => setQAdvMode("FIXED")}
                >
                  <Text style={[styles.segText, qAdvMode === "FIXED" && styles.segTextActive]}>Fixed (₹)</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.fieldInput}
                value={qAdvValue}
                onChangeText={(t) => setQAdvValue(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder={qAdvMode === "PERCENT" ? "e.g. 30  (30% advance)" : "e.g. 15000"}
                placeholderTextColor="#A3B3C2"
              />
              {/* Live advance/balance preview */}
              {!!Number(qAmount) && (
                <Text style={styles.quoteMeta}>
                  Advance {INR(qAdvMode === "FIXED" ? Number(qAdvValue || 0) : Math.round(Number(qAmount) * Number(qAdvValue || 0) / 100))}
                  {"  ·  "}Balance {INR(Number(qAmount) - (qAdvMode === "FIXED" ? Number(qAdvValue || 0) : Math.round(Number(qAmount) * Number(qAdvValue || 0) / 100)))}
                </Text>
              )}

              {/* Validity */}
              <Text style={styles.fieldLabel}>Valid for (days)</Text>
              <TextInput
                style={styles.fieldInput}
                value={qValidityDays}
                onChangeText={(t) => setQValidityDays(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="7"
                placeholderTextColor="#A3B3C2"
              />

              {/* Terms */}
              <Text style={styles.fieldLabel}>Terms / inclusions (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 80, textAlignVertical: "top" }]}
                value={qTerms}
                onChangeText={setQTerms}
                placeholder="What's included, payment terms, etc."
                placeholderTextColor="#A3B3C2"
                multiline
              />
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, savingQuote && { opacity: 0.6 }]}
              onPress={submitQuote}
              disabled={savingQuote}
            >
              {savingQuote ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.modalPrimaryBtnText}>{lead.quotedAmount != null ? "Update quote" : "Send quote"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* E2 — Lost reason modal */}
      <Modal visible={showLostModal} animationType="slide" transparent onRequestClose={() => setShowLostModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark lead as Lost</Text>
              <TouchableOpacity onPress={() => setShowLostModal(false)}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Why was this lost? (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { minHeight: 90, textAlignVertical: "top" }]}
              value={lostReasonText}
              onChangeText={setLostReasonText}
              placeholder="e.g. Chose a competitor, budget too high, plan dropped…"
              placeholderTextColor="#A3B3C2"
              multiline
            />
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: C.red }, savingStatus && { opacity: 0.6 }]}
              onPress={submitLost}
              disabled={savingStatus}
            >
              {savingStatus ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.modalPrimaryBtnText}>Mark Lost</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* A2 — Reject payment reason modal */}
      <Modal visible={showRejectModal} animationType="slide" transparent onRequestClose={() => setShowRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject payment</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Reason (shown to customer)</Text>
            <TextInput
              style={[styles.fieldInput, { minHeight: 90, textAlignVertical: "top" }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Amount received doesn't match, or screenshot unclear."
              placeholderTextColor="#A3B3C2"
              multiline
            />
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: C.red }, savingPayment && { opacity: 0.6 }]}
              onPress={submitReject}
              disabled={savingPayment}
            >
              {savingPayment ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="close-circle" size={16} color="#fff" />
                  <Text style={styles.modalPrimaryBtnText}>Confirm Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* A2 — Full-screen proof viewer */}
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImage(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {!!viewerImage && (
            <RemoteImage source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* A3 — Assign vehicle modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign vehicle</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Vehicle *</Text>
              {loadingFleet ? (
                <ActivityIndicator size="small" color={C.emerald600} style={{ marginVertical: 12 }} />
              ) : !fleetList.length ? (
                <Text style={styles.vehEmpty}>No vehicles in your fleet yet.</Text>
              ) : (
                fleetList.map((f) => {
                  const active = f.id === selFleetId;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.fleetPickRow, active && styles.fleetPickRowActive]}
                      onPress={() => setSelFleetId(f.id)}
                      activeOpacity={0.85}
                    >
                      {f.coverImage ? (
                        <RemoteImage source={{ uri: f.coverImage }} style={styles.fleetPickThumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.fleetPickThumb, styles.vehThumbPlaceholder]}><Ionicons name="car" size={18} color={C.subText} /></View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.vehName} numberOfLines={1}>{f.vehicleName || f.name || "Vehicle"}</Text>
                        <Text style={styles.vehSub} numberOfLines={1}>
                          {[f.registrationNumber, f.ratePerDay != null ? `${INR(f.ratePerDay)}/day` : null].filter(Boolean).join("  ·  ")}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={C.emerald600} />}
                    </TouchableOpacity>
                  );
                })
              )}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start date</Text>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowVStartPicker(true)}>
                    <Ionicons name="calendar-outline" size={14} color={C.subText} />
                    <Text style={styles.dateFieldText}>{vStart ? formatDate(vStart) : "Select"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>End date</Text>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowVEndPicker(true)}>
                    <Ionicons name="calendar-outline" size={14} color={C.subText} />
                    <Text style={styles.dateFieldText}>{vEnd ? formatDate(vEnd) : "Select"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Amount (₹, optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={vAmount}
                onChangeText={(t) => setVAmount(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="e.g. 8000"
                placeholderTextColor="#A3B3C2"
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.segRow}>
                {VEH_STATUS.slice(0, 2).map((s) => (
                  <TouchableOpacity key={s} style={[styles.segBtn, vStatus === s && styles.segBtnActive]} onPress={() => setVStatus(s)}>
                    <Text style={[styles.segText, vStatus === s && styles.segTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 60, textAlignVertical: "top" }]}
                value={vNotes}
                onChangeText={setVNotes}
                placeholder="Any note for this assignment…"
                placeholderTextColor="#A3B3C2"
                multiline
              />
              <Text style={styles.quoteMeta}>TENTATIVE skips the availability conflict check.</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, savingAssign && { opacity: 0.6 }]}
              onPress={submitAssign}
              disabled={savingAssign}
            >
              {savingAssign ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="car-sport" size={16} color="#fff" />
                  <Text style={styles.modalPrimaryBtnText}>Assign vehicle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={showVStartPicker}
        mode="date"
        date={vStart || new Date()}
        onConfirm={(d) => { setVStart(d); setShowVStartPicker(false); if (vEnd && d > vEnd) setVEnd(d); }}
        onCancel={() => setShowVStartPicker(false)}
      />
      <DateTimePickerModal
        isVisible={showVEndPicker}
        mode="date"
        date={vEnd || vStart || new Date()}
        minimumDate={vStart || undefined}
        onConfirm={(d) => { setVEnd(d); setShowVEndPicker(false); }}
        onCancel={() => setShowVEndPicker(false)}
      />

      <DateTimePickerModal
        isVisible={showFollowUpPicker}
        mode="date"
        date={lead.nextFollowUp ? new Date(lead.nextFollowUp) : new Date()}
        onConfirm={changeFollowUp}
        onCancel={() => setShowFollowUpPicker(false)}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, label }) {
  return (
    <View style={styles.sectionLabel}>
      <Ionicons name={icon} size={12} color={C.emerald600} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={13} color={C.subText} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MoneyCard({ label, value, color, bg }) {
  return (
    <View style={[styles.moneyCard, { backgroundColor: bg }]}>
      <Text style={[styles.moneyLabel, { color }]}>{label}</Text>
      <Text style={[styles.moneyValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function QuoteStat({ label, value, color }) {
  return (
    <View style={styles.quoteStat}>
      <Text style={styles.quoteStatLabel}>{label}</Text>
      <Text style={[styles.quoteStatValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ContactBtn({ icon, label, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.contactBtn, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.contactBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PickerModal({ visible, title, options, selected, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }}>
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalItem, active && { backgroundColor: opt.bg || "#EFF6FF" }]}
                  onPress={() => onSelect(opt.value)}
                >
                  <View style={[styles.modalDot, { backgroundColor: opt.color || C.subText }]} />
                  {!!opt.icon && <Ionicons name={opt.icon} size={14} color={opt.color || C.subText} />}
                  <Text style={[styles.modalItemText, { color: opt.color || C.text }, active && { fontWeight: "800" }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={opt.color || C.emerald600} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 12 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center" },
  backCta: { marginTop: 16, backgroundColor: C.emerald600, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backCtaText: { color: "#fff", fontWeight: "700" },

  // Hero
  heroWrap: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  identityRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 4, marginTop: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 22 },
  customerName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  customerSub: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2, fontWeight: "600" },

  // Status + priority pills — extra marginBottom so the floating contact bar
  // below has a clear breathing gap (otherwise pills + contact bar cramp).
  pillRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 8, paddingHorizontal: 4 },
  pickerPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pickerDot: { width: 8, height: 8, borderRadius: 4 },
  pickerPillText: { fontSize: 12.5, fontWeight: "800", letterSpacing: 0.3 },
  convertedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  convertedText: { color: "#fff", fontSize: 11.5, fontWeight: "800" },

  // Floating contact row — pulls up 28px to visually overlap the gradient
  // edge. Combined with SafeAreaView paddingBottom:40, that leaves 12px clear
  // gap between the status/priority pill row and the contact bar (no cramp).
  contactRowWrap: { marginHorizontal: 16, marginTop: -28 },
  contactRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 6, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  contactBtn: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  contactBtnText: { fontSize: 11.5, fontWeight: "800" },
  contactDivider: { width: 1, backgroundColor: C.border, marginVertical: 8 },

  // Action row
  actionsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  primaryAction: { flex: 1, borderRadius: 14, overflow: "hidden" },
  primaryActionInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  primaryActionText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
  secondaryAction: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.emerald600 },
  secondaryActionText: { color: C.emerald600, fontWeight: "800", fontSize: 13.5 },
  iconAction: { alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.emerald600 },
  iconActionText: { color: C.emerald600, fontWeight: "800", fontSize: 11 },

  // Section label
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 5, marginHorizontal: 16, marginTop: 22, marginBottom: 8 },
  sectionLabelText: { fontSize: 11, fontWeight: "800", color: C.emerald600, letterSpacing: 0.6 },

  // Follow-up card
  followUpCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  followUpIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  followUpLabel: { fontSize: 13.5, fontWeight: "800" },
  followUpDate: { fontSize: 12.5, color: C.ink, marginTop: 2, fontWeight: "700" },
  followUpMeta: { fontSize: 11, color: C.subText, marginTop: 3 },

  // Card
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 7 },
  infoLabel: { fontSize: 12, color: C.subText, fontWeight: "600", flex: 0 },
  infoValue: { flex: 1, fontSize: 13, color: C.ink, fontWeight: "700", textAlign: "right" },
  requirementBox: { marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: C.emerald50, borderLeftWidth: 3, borderLeftColor: C.emerald600 },
  requirementLabel: { fontSize: 10, color: C.emerald600, fontWeight: "800", letterSpacing: 0.5 },
  requirementText: { fontSize: 13, color: C.ink, marginTop: 4, lineHeight: 18 },

  // Money
  moneyRow: { flexDirection: "row", gap: 8, marginHorizontal: 16 },
  moneyCard: { flex: 1, padding: 12, borderRadius: 12 },
  moneyLabel: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5 },
  moneyValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },

  // Quote (A1)
  quoteCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 16, marginTop: 8, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: C.emerald600, backgroundColor: C.emerald50 },
  quoteCtaText: { color: C.emerald600, fontWeight: "800", fontSize: 13.5 },
  quoteSplitRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  quoteStat: { flex: 1, alignItems: "center" },
  quoteStatLabel: { fontSize: 10, color: C.subText, fontWeight: "700", letterSpacing: 0.4 },
  quoteStatValue: { fontSize: 15, fontWeight: "800", marginTop: 3 },
  quoteMeta: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 6, marginBottom: 2 },

  // Modal form fields (A1/A2/A3)
  fieldLabel: { fontSize: 12, fontWeight: "800", color: C.text, marginTop: 12, marginBottom: 6 },
  fieldInput: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.ink },
  segRow: { flexDirection: "row", gap: 8 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", backgroundColor: "#F8FAFC" },
  segBtnActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  segText: { fontSize: 12.5, fontWeight: "700", color: C.subText },
  segTextActive: { color: C.emerald700 },
  modalPrimaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.emerald600, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  modalPrimaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Payment (A2)
  payStatusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  payStatusText: { fontSize: 12, fontWeight: "800" },
  proofThumb: { width: 84, height: 110, borderRadius: 10, marginRight: 8, backgroundColor: "#EEF2F6", borderWidth: 1, borderColor: C.border },
  payActionsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  payRejectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.red, backgroundColor: C.redLight },
  payRejectText: { color: C.red, fontWeight: "800", fontSize: 13.5 },
  payVerifyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.emerald600 },
  payVerifyText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },

  // Full-screen image viewer (A2)
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 44, right: 20, zIndex: 2, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "92%", height: "80%" },

  // Vehicles (A3)
  vehHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 16 },
  vehAddBtn: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.emerald600, backgroundColor: C.emerald50, marginTop: 16 },
  vehCalLink: { flexDirection: "row", alignItems: "center", gap: 5, marginHorizontal: 16, marginTop: 4, marginBottom: 8 },
  vehCalLinkText: { flex: 1, fontSize: 12, color: C.blue, fontWeight: "700" },
  vehAddText: { color: C.emerald600, fontWeight: "800", fontSize: 12 },
  vehEmpty: { color: C.subText, fontSize: 12.5, fontStyle: "italic", marginHorizontal: 16, marginVertical: 8 },
  vehCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 8, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 10 },
  vehThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#EEF2F6" },
  vehThumbPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  vehName: { fontSize: 14, fontWeight: "800", color: C.ink },
  vehSub: { fontSize: 11.5, color: C.subText, fontWeight: "600", marginTop: 1 },
  vehMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  vehStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  vehStatusText: { fontSize: 10.5, fontWeight: "800" },
  vehAmount: { fontSize: 12.5, fontWeight: "800", color: C.emerald600 },

  // Fleet picker rows (A3 modal)
  fleetPickRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: "#F8FAFC", marginBottom: 8 },
  fleetPickRowActive: { borderColor: C.emerald600, backgroundColor: C.emerald50 },
  fleetPickThumb: { width: 46, height: 46, borderRadius: 9, backgroundColor: "#EEF2F6" },
  dateField: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  dateFieldText: { fontSize: 13.5, color: C.ink, fontWeight: "700" },

  // Notes
  noteInputCard: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginHorizontal: 16, padding: 8, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  noteInput: { flex: 1, fontSize: 13.5, color: C.ink, minHeight: 36, maxHeight: 120, paddingHorizontal: 8, paddingVertical: 6 },
  noteSendBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.emerald600, alignItems: "center", justifyContent: "center" },
  noNotes: { color: C.subText, fontSize: 12.5, fontStyle: "italic", textAlign: "center", marginVertical: 16 },

  // Timeline
  timelineWrap: { marginTop: 10, marginHorizontal: 16 },
  timelineRow: { flexDirection: "row", gap: 10 },
  timelineGutter: { width: 16, alignItems: "center" },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.emerald500, borderWidth: 2, borderColor: "#fff", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 3 },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 2 },
  timelineCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 11, marginBottom: 10 },
  timelineText: { fontSize: 13, color: C.ink, lineHeight: 18 },
  timelineFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  authorChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#F1F5F9" },
  authorText: { fontSize: 10.5, color: C.subText, fontWeight: "700" },
  timelineTime: { fontSize: 10.5, color: C.subText, fontWeight: "600", marginLeft: "auto" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, paddingTop: 16, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  modalItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: "#F8FAFC" },
  modalDot: { width: 8, height: 8, borderRadius: 4 },
  modalItemText: { fontSize: 14, fontWeight: "700", flex: 1 },

  // Confirm convert
  confirmCard: { margin: 24, backgroundColor: C.card, borderRadius: 22, padding: 22, alignItems: "center", alignSelf: "center" },
  confirmIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  confirmTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 4 },
  confirmBody: { fontSize: 13, color: C.subText, textAlign: "center", marginTop: 8, lineHeight: 19 },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  confirmCancelText: { color: C.text, fontWeight: "700", fontSize: 14 },
  confirmOk: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: C.emerald600, alignItems: "center" },
  confirmOkText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
