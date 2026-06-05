// screens/travel-agent/bookings/BookingDetailScreen.js
// REDESIGNED — emerald-themed booking detail with gradient hero, floating
// contact bar, payment progress card (prominent), trip info, share card with
// copy/share/revoke, notes, meta, and a danger zone.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  Share,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  getTravelAgentBooking,
  updateTravelAgentBooking,
  deleteTravelAgentBooking,
  shareTravelAgentBooking,
  revokeTravelAgentBookingShare,
  getBaseURL,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
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
  green: "#10B981",
  greenLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  whatsapp: "#25D366",
};

const STATUS_COLORS = {
  DRAFT:            { bg: "rgba(255,255,255,0.22)", fg: "#fff", icon: "create" },
  PENDING_CUSTOMER: { bg: "rgba(255,255,255,0.22)", fg: "#FEF3C7", icon: "hourglass" },
  CONFIRMED:        { bg: "rgba(255,255,255,0.22)", fg: "#fff", icon: "checkmark-circle" },
  IN_PROGRESS:      { bg: "rgba(255,255,255,0.22)", fg: "#fff", icon: "navigate" },
  COMPLETED:        { bg: "rgba(255,255,255,0.22)", fg: "#fff", icon: "checkmark-done" },
  CANCELLED:        { bg: "rgba(255,255,255,0.22)", fg: "#FECACA", icon: "close-circle" },
};
const TYPE_META = {
  TOUR:      { icon: "map",       label: "Tour",      gradient: [C.purple, "#6D28D9"], color: "#6D28D9" },
  PROPERTY:  { icon: "bed",       label: "Property",  gradient: [C.amber, "#D97706"], color: "#A16207" },
  TRANSPORT: { icon: "car",       label: "Transport", gradient: [C.blue, "#1D4ED8"],  color: "#1D4ED8" },
  CUSTOM:    { icon: "construct", label: "Custom",    gradient: ["#EC4899", "#9D174D"], color: "#9D174D" },
};
const PAYMENT_META = {
  PENDING:  { bg: C.amberLight, fg: "#A16207", icon: "hourglass" },
  PARTIAL:  { bg: "#E0E7FF",    fg: "#4338CA", icon: "card" },
  PAID:     { bg: C.greenLight, fg: "#15803D", icon: "checkmark-circle" },
  REFUNDED: { bg: C.redLight,   fg: "#B91C1C", icon: "return-up-back" },
};

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
const INR = (n) => n == null || isNaN(Number(n)) ? "—" : `₹${Number(n).toLocaleString("en-IN")}`;
const INRshort = (n) => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export default function BookingDetailScreen({ navigation, route }) {
  const { id } = route?.params || {};
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await getTravelAgentBooking(id);
      setBooking(data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load booking");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); };

  const updateField = async (partial) => {
    try {
      const { booking: updated } = await updateTravelAgentBooking(booking.id, partial);
      setBooking((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed");
    }
  };

  const onDelete = () => {
    Alert.alert("Delete booking?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteTravelAgentBooking(booking.id); navigation.goBack(); }
          catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  const onShare = async () => {
    try {
      setSharing(true);
      const { shareToken, shareExpiresAt } = await shareTravelAgentBooking(booking.id, 7);
      const baseURL = await getBaseURL();
      const url = `${baseURL}/travel-agent/booking/share/${shareToken}`;
      setBooking((prev) => ({
        ...prev,
        shareToken,
        shareExpiresAt,
        status: prev.status === "DRAFT" ? "PENDING_CUSTOMER" : prev.status,
      }));
      Share.share({
        message: `Hi ${booking.customerName},\n\nYour booking ${booking.bookingNumber} details:\n${url}\n\nLink valid for 7 days.`,
        url,
      });
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  const onCopyShareUrl = async () => {
    if (!booking.shareToken) return;
    const baseURL = await getBaseURL();
    Clipboard.setString(`${baseURL}/travel-agent/booking/share/${booking.shareToken}`);
    Alert.alert("Copied", "Share link copied to clipboard.");
  };

  const onRevokeShare = async () => {
    Alert.alert("Revoke share link?", "The customer's existing link will stop working.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke", style: "destructive",
        onPress: async () => {
          try {
            await revokeTravelAgentBookingShare(booking.id);
            setBooking((prev) => ({ ...prev, shareToken: null, shareExpiresAt: null }));
          } catch (e) { Alert.alert("Error", e?.response?.data?.error || e?.message || "Failed"); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.emerald600} /></View>
      </View>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.safe]} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={C.subText} />
          <Text style={styles.emptyTitle}>Booking not found</Text>
          {!!error && <Text style={styles.emptyBody}>{error}</Text>}
          <TouchableOpacity style={styles.backCta} onPress={() => navigation.goBack()}>
            <Text style={styles.backCtaText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.DRAFT;
  const tm = TYPE_META[booking.bookingType] || TYPE_META.CUSTOM;
  const pm = PAYMENT_META[booking.paymentStatus] || PAYMENT_META.PENDING;
  const isProp = booking.bookingType === "PROPERTY";
  const totalAmt = Number(booking.totalAmount || 0);
  const paidAmt = Number(booking.paidAmount || 0);
  const balanceAmt = Math.max(0, totalAmt - paidAmt);
  const paidPct = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emerald700} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
                onPress={() => navigation.navigate("TAAddEditBooking", { booking })}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.95)" />
              </TouchableOpacity>
            </View>

            {/* Booking number + type pill */}
            <View style={styles.identityBlock}>
              <View style={[styles.typeIcon, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
                <Ionicons name={tm.icon} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <Text style={styles.typeLabel}>{tm.label.toUpperCase()} BOOKING</Text>
                <Text style={styles.bookingNumber} numberOfLines={1}>{booking.bookingNumber}</Text>
                <Text style={styles.customerName} numberOfLines={1}>{booking.customerName}</Text>
              </View>
            </View>

            {/* Status pill (inline picker) */}
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[styles.statusBtn, { backgroundColor: sc.bg }]}
                onPress={() => setShowStatusModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name={sc.icon} size={12} color={sc.fg} />
                <Text style={[styles.statusBtnText, { color: sc.fg }]}>{booking.status.replace("_", " ")}</Text>
                <Ionicons name="chevron-down" size={13} color={sc.fg} />
              </TouchableOpacity>
              {!!booking.shareToken && (
                <View style={styles.sharedBadge}>
                  <Ionicons name="share-social" size={11} color="#fff" />
                  <Text style={styles.sharedBadgeText}>Link active</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ===== Floating contact bar ===== */}
        <View style={styles.contactRowWrap}>
          <View style={styles.contactRow}>
            <ContactBtn
              icon="call" label="Call" color={C.emerald600}
              onPress={() => booking.customerPhone && Linking.openURL(`tel:${booking.customerPhone}`)}
              disabled={!booking.customerPhone}
            />
            <View style={styles.contactDivider} />
            <ContactBtn
              icon="logo-whatsapp" label="WhatsApp" color={C.whatsapp}
              onPress={() => {
                if (!booking.customerPhone) return;
                const cleaned = String(booking.customerPhone).replace(/^\+?91/, "");
                Linking.openURL(`whatsapp://send?phone=91${cleaned}`)
                  .catch(() => Linking.openURL(`https://wa.me/91${cleaned}`));
              }}
              disabled={!booking.customerPhone}
            />
            <View style={styles.contactDivider} />
            <ContactBtn
              icon="mail" label="Email" color={C.blue}
              onPress={() => booking.customerEmail && Linking.openURL(`mailto:${booking.customerEmail}`)}
              disabled={!booking.customerEmail}
            />
          </View>
        </View>

        {/* ===== Payment progress card (hero of the page) ===== */}
        <SectionLabel icon="cash" label="PAYMENT" />
        <View style={styles.paymentCard}>
          <View style={styles.paymentTopRow}>
            <View>
              <Text style={styles.paymentTotalLabel}>TOTAL BOOKING VALUE</Text>
              <Text style={styles.paymentTotalValue}>{INR(totalAmt)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.paymentStatusPill, { backgroundColor: pm.bg }]}
              onPress={() => setShowPaymentModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name={pm.icon} size={13} color={pm.fg} />
              <Text style={[styles.paymentStatusText, { color: pm.fg }]}>{booking.paymentStatus}</Text>
              <Ionicons name="chevron-down" size={12} color={pm.fg} />
            </TouchableOpacity>
          </View>

          {totalAmt > 0 && (
            <>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={paidPct === 100 ? [C.emerald500, C.emerald600] : [C.amber, "#D97706"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${paidPct}%` }]}
                />
              </View>
              <View style={styles.paymentRow}>
                <View style={styles.paymentItem}>
                  <View style={[styles.paymentDot, { backgroundColor: C.emerald500 }]} />
                  <View>
                    <Text style={styles.paymentItemLabel}>Received</Text>
                    <Text style={styles.paymentItemValue}>{INRshort(paidAmt)}</Text>
                  </View>
                </View>
                <View style={styles.paymentVDivider} />
                <View style={styles.paymentItem}>
                  <View style={[styles.paymentDot, { backgroundColor: C.amber }]} />
                  <View>
                    <Text style={styles.paymentItemLabel}>Balance</Text>
                    <Text style={[styles.paymentItemValue, { color: C.amber }]}>{INRshort(balanceAmt)}</Text>
                  </View>
                </View>
                <View style={styles.paymentVDivider} />
                <View style={styles.paymentItem}>
                  <View style={[styles.paymentDot, { backgroundColor: C.blue }]} />
                  <View>
                    <Text style={styles.paymentItemLabel}>Collected</Text>
                    <Text style={[styles.paymentItemValue, { color: C.blue }]}>{paidPct}%</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ===== Customer card ===== */}
        <SectionLabel icon="person" label="CUSTOMER" />
        <View style={styles.card}>
          <Text style={styles.customerCardName}>{booking.customerName}</Text>
          {!!booking.customerPhone && (
            <View style={styles.contactItem}>
              <Ionicons name="call" size={13} color={C.subText} />
              <Text style={styles.contactItemText}>{booking.customerPhone}</Text>
            </View>
          )}
          {!!booking.customerEmail && (
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={13} color={C.subText} />
              <Text style={styles.contactItemText}>{booking.customerEmail}</Text>
            </View>
          )}
        </View>

        {/* ===== Reference ===== */}
        {!!booking.referenceTitle && (
          <>
            <SectionLabel icon="bookmark" label="REFERENCE" />
            <View style={styles.card}>
              <View style={styles.referenceRow}>
                <View style={[styles.referenceIcon, { backgroundColor: `${tm.color}22` }]}>
                  <Ionicons name={tm.icon} size={16} color={tm.color} />
                </View>
                <Text style={styles.referenceText}>{booking.referenceTitle}</Text>
              </View>
            </View>
          </>
        )}

        {/* ===== Trip / Stay ===== */}
        <SectionLabel icon={isProp ? "bed" : "calendar"} label={isProp ? "STAY DETAILS" : "TRIP DETAILS"} />
        <View style={styles.card}>
          {isProp ? (
            <>
              <DateRow
                fromLabel="Check-in"
                toLabel="Check-out"
                fromDate={booking.checkInDate}
                toDate={booking.checkOutDate}
              />
              <View style={styles.guestsRow}>
                <Stat icon="people" label="Guests" value={booking.passengers || "—"} color={C.blue} bg={C.blueLight} />
                <Stat icon="bed" label="Rooms" value={booking.rooms || "—"} color={C.amber} bg={C.amberLight} />
              </View>
            </>
          ) : (
            <>
              <DateRow
                fromLabel="Travel"
                toLabel="Return"
                fromDate={booking.travelDate}
                toDate={booking.returnDate}
              />
              {(booking.pickupLocation || booking.dropLocation) && (
                <View style={styles.locationRow}>
                  <View style={styles.locationItem}>
                    <Ionicons name="navigate" size={14} color={C.emerald600} />
                    <View>
                      <Text style={styles.locationLabel}>FROM</Text>
                      <Text style={styles.locationValue} numberOfLines={1}>{booking.pickupLocation || "—"}</Text>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={C.subText} style={{ marginHorizontal: 6 }} />
                  <View style={styles.locationItem}>
                    <Ionicons name="flag" size={14} color={C.red} />
                    <View>
                      <Text style={styles.locationLabel}>TO</Text>
                      <Text style={styles.locationValue} numberOfLines={1}>{booking.dropLocation || "—"}</Text>
                    </View>
                  </View>
                </View>
              )}
              {!!booking.passengers && (
                <View style={styles.passengerPill}>
                  <Ionicons name="people" size={13} color={C.blue} />
                  <Text style={styles.passengerText}>{booking.passengers} passengers</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ===== Notes ===== */}
        {!!booking.notes && (
          <>
            <SectionLabel icon="document-text" label="NOTES" />
            <View style={[styles.card, styles.notesCard]}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </>
        )}

        {/* ===== Share link ===== */}
        <SectionLabel icon="share-social" label="CUSTOMER SHARE LINK" />
        {booking.shareToken ? (
          <View style={styles.shareActiveCard}>
            <LinearGradient
              colors={[C.emerald500, C.emerald700]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.shareActiveHeader}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.shareActiveTitle}>Active share link</Text>
              {!!booking.shareExpiresAt && (
                <View style={styles.shareExpiresPill}>
                  <Text style={styles.shareExpiresText}>Expires {formatDate(booking.shareExpiresAt)}</Text>
                </View>
              )}
            </LinearGradient>
            <View style={styles.shareActions}>
              <TouchableOpacity style={styles.shareAction} onPress={onShare} disabled={sharing}>
                {sharing ? <ActivityIndicator size="small" color={C.emerald600} /> : (
                  <>
                    <Ionicons name="share-social" size={16} color={C.emerald600} />
                    <Text style={styles.shareActionText}>Regenerate</Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={styles.shareActionDivider} />
              <TouchableOpacity style={styles.shareAction} onPress={onCopyShareUrl}>
                <Ionicons name="copy-outline" size={16} color={C.blue} />
                <Text style={[styles.shareActionText, { color: C.blue }]}>Copy</Text>
              </TouchableOpacity>
              <View style={styles.shareActionDivider} />
              <TouchableOpacity style={styles.shareAction} onPress={onRevokeShare}>
                <Ionicons name="close-circle" size={16} color={C.red} />
                <Text style={[styles.shareActionText, { color: C.red }]}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.createShareCard} onPress={onShare} disabled={sharing} activeOpacity={0.9}>
            <View style={styles.createShareIcon}>
              <Ionicons name="share-social" size={20} color={C.emerald600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createShareTitle}>Generate Link</Text>
              <Text style={styles.createShareSub}>7-day public link the customer can open to view & confirm.</Text>
            </View>
            {sharing ? <ActivityIndicator size="small" color={C.emerald600} /> : (
              <Ionicons name="chevron-forward" size={18} color={C.emerald600} />
            )}
          </TouchableOpacity>
        )}

        {/* ===== Meta ===== */}
        <SectionLabel icon="information-circle" label="META" />
        <View style={styles.card}>
          <MetaRow label="Booking #" value={booking.bookingNumber} />
          <MetaRow label="Created" value={formatRelative(booking.createdAt)} />
          <MetaRow label="Last updated" value={formatRelative(booking.updatedAt)} />
          {booking.customerFilledAt && <MetaRow label="Customer filled" value={formatRelative(booking.customerFilledAt)} />}
        </View>

        {/* ===== Danger zone ===== */}
        <SectionLabel icon="alert-circle" label="DANGER ZONE" />
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
          <Ionicons name="trash" size={16} color={C.red} />
          <Text style={styles.deleteBtnText}>Delete this booking</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky bottom edit bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.editBtnWrap}
          onPress={() => navigation.navigate("TAAddEditBooking", { booking })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.emerald600, C.emerald700]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.editBtnInner}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit Booking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Status modal */}
      <PickerModal
        visible={showStatusModal}
        title="Change status"
        options={BOOKING_STATUS.map((s) => ({ value: s, label: s.replace("_", " ") }))}
        selected={booking.status}
        onClose={() => setShowStatusModal(false)}
        onSelect={async (v) => { setShowStatusModal(false); await updateField({ status: v }); }}
      />
      {/* Payment status modal */}
      <PickerModal
        visible={showPaymentModal}
        title="Payment status"
        options={BOOKING_PAYMENT_STATUS.map((s) => ({ value: s, label: s, icon: PAYMENT_META[s]?.icon, color: PAYMENT_META[s]?.fg }))}
        selected={booking.paymentStatus}
        onClose={() => setShowPaymentModal(false)}
        onSelect={async (v) => { setShowPaymentModal(false); await updateField({ paymentStatus: v }); }}
      />
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, label }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={12} color={C.emerald600} />
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
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

function DateRow({ fromLabel, toLabel, fromDate, toDate }) {
  return (
    <View style={styles.dateRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.dateLabel}>{fromLabel.toUpperCase()}</Text>
        <Text style={styles.dateValue}>{formatDate(fromDate)}</Text>
      </View>
      <View style={styles.dateArrow}>
        <Ionicons name="arrow-forward" size={16} color={C.emerald600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dateLabel}>{toLabel.toUpperCase()}</Text>
        <Text style={styles.dateValue}>{formatDate(toDate)}</Text>
      </View>
    </View>
  );
}

function Stat({ icon, label, value, color, bg }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function MetaRow({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function PickerModal({ visible, title, options, selected, onClose, onSelect }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.ink} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalItem, active && styles.modalItemActive]}
                  onPress={() => onSelect(opt.value)}
                >
                  {opt.icon && <Ionicons name={opt.icon} size={16} color={active ? C.emerald600 : C.subText} />}
                  <Text style={[styles.modalItemText, active && { color: opt.color || C.emerald700, fontWeight: "800" }]}>
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
  safe: { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 12 },
  emptyBody: { fontSize: 13, color: C.subText, marginTop: 6, textAlign: "center" },
  backCta: { marginTop: 16, backgroundColor: C.emerald600, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backCtaText: { color: "#fff", fontWeight: "700" },

  // Hero
  heroWrap: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  identityBlock: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, marginTop: 8 },
  typeIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  typeLabel: { fontSize: 10.5, color: "rgba(255,255,255,0.85)", fontWeight: "800", letterSpacing: 0.6 },
  bookingNumber: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },
  customerName: { fontSize: 13.5, color: "rgba(255,255,255,0.9)", fontWeight: "700", marginTop: 2 },

  pillRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 14, marginBottom: 4, paddingHorizontal: 4 },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  statusBtnText: { fontSize: 12.5, fontWeight: "800", letterSpacing: 0.3 },
  sharedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  sharedBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Floating contact bar
  contactRowWrap: { marginHorizontal: 16, marginTop: -28 },
  contactRow: { flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 6, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  contactBtn: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  contactBtnText: { fontSize: 11.5, fontWeight: "800" },
  contactDivider: { width: 1, backgroundColor: C.border, marginVertical: 8 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  sectionIconBox: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: C.emerald700, letterSpacing: 0.6 },

  // Payment card (hero of page)
  paymentCard: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  paymentTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentTotalLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.6 },
  paymentTotalValue: { fontSize: 26, fontWeight: "900", color: C.ink, marginTop: 4 },
  paymentStatusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  paymentStatusText: { fontSize: 11.5, fontWeight: "800", letterSpacing: 0.3 },

  progressTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden", marginTop: 14 },
  progressFill: { height: "100%", borderRadius: 4 },

  paymentRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  paymentItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  paymentDot: { width: 8, height: 8, borderRadius: 4 },
  paymentItemLabel: { fontSize: 10, color: C.subText, fontWeight: "700", letterSpacing: 0.3 },
  paymentItemValue: { fontSize: 13.5, color: C.emerald600, fontWeight: "800", marginTop: 1 },
  paymentVDivider: { width: 1, height: 28, backgroundColor: C.border, marginHorizontal: 4 },

  // Card
  card: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },

  // Customer card
  customerCardName: { fontSize: 16, fontWeight: "800", color: C.ink },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  contactItemText: { fontSize: 13, color: C.text, fontWeight: "600" },

  // Reference
  referenceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  referenceIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  referenceText: { flex: 1, fontSize: 14, fontWeight: "700", color: C.ink },

  // Date row (highlighted from→to layout)
  dateRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  dateLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.5 },
  dateValue: { fontSize: 14, fontWeight: "800", color: C.ink, marginTop: 4 },
  dateArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.emerald50, alignItems: "center", justifyContent: "center", marginHorizontal: 8 },

  // Location row (trip)
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  locationItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  locationLabel: { fontSize: 10, color: C.subText, fontWeight: "800", letterSpacing: 0.5 },
  locationValue: { fontSize: 12.5, color: C.ink, fontWeight: "700", marginTop: 1, maxWidth: 100 },

  passengerPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.blueLight, marginTop: 12 },
  passengerText: { fontSize: 12, color: C.blue, fontWeight: "800" },

  // Stat box (property guests/rooms)
  guestsRow: { flexDirection: "row", gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  statBox: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12 },
  statBoxValue: { fontSize: 18, fontWeight: "900", marginTop: 4 },
  statBoxLabel: { fontSize: 10, color: C.subText, fontWeight: "700", marginTop: 1, textTransform: "uppercase", letterSpacing: 0.4 },

  // Notes
  notesCard: { borderLeftWidth: 4, borderLeftColor: C.emerald600, paddingLeft: 12 },
  notesText: { fontSize: 13.5, color: C.text, lineHeight: 20 },

  // Share — active state
  shareActiveCard: { marginHorizontal: 16, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  shareActiveHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  shareActiveTitle: { color: "#fff", fontSize: 13, fontWeight: "800", flex: 1 },
  shareExpiresPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  shareExpiresText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  shareActions: { flexDirection: "row", backgroundColor: C.card },
  shareAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 14 },
  shareActionText: { fontSize: 12.5, fontWeight: "800", color: C.emerald600 },
  shareActionDivider: { width: 1, backgroundColor: C.border, marginVertical: 6 },

  // Share — create state
  createShareCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, padding: 14, borderRadius: 14,
    backgroundColor: C.emerald50, borderWidth: 1, borderColor: "#A7F3D0",
  },
  createShareIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  createShareTitle: { fontSize: 13.5, fontWeight: "800", color: C.emerald700 },
  createShareSub: { fontSize: 11.5, color: C.text, marginTop: 3, lineHeight: 16 },

  // Meta
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 7 },
  metaLabel: { fontSize: 12, color: C.subText, fontWeight: "600" },
  metaValue: { fontSize: 12.5, color: C.ink, fontWeight: "700", maxWidth: "60%", textAlign: "right" },

  // Danger
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: C.redLight, borderWidth: 1, borderColor: "#FECACA" },
  deleteBtnText: { color: C.red, fontWeight: "800", fontSize: 13.5 },

  // Bottom bar
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  editBtnWrap: { borderRadius: 14, overflow: "hidden", shadowColor: C.emerald600, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  editBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  editBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, paddingTop: 8, paddingHorizontal: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  modalItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: "#FAFBFC" },
  modalItemActive: { backgroundColor: C.emerald50 },
  modalItemText: { flex: 1, fontSize: 14, color: C.text, fontWeight: "700" },
});
