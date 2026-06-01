// screens/travel-agent/bookings/SelfBookingDetailScreen.js
// Read-only detail for a COMPANY (B2B) self-booking — i.e. a booking the
// travel agent placed on the customer side in COMPANY mode. Data comes from
// the NO-AUTH endpoint /api/b2b/bookings/[id] (see getSelfBookingB2bDetail),
// which works with the TA token because that route skips auth. We do NOT
// reuse the vendor B2BBookingDetail screen — it calls /vendor/* endpoints
// that 401 a travel-agent token.
//
// Indigo→purple accent (matches the "My Self-Bookings" section on the list
// screen) rather than the emerald used for manual TA bookings, so the two
// booking sources stay visually distinct.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getSelfBookingB2bDetail } from "../../api/travelAgentClient";

const C = {
  indigo600: "#4F46E5",
  indigo700: "#4338CA",
  indigo50: "#EEF2FF",
  purple: "#7C3AED",
  ink: "#0F172A",
  text: "#334155",
  subText: "#64748B",
  bg: "#F6F8FB",
  card: "#FFFFFF",
  border: "#E6EDF5",
  green: "#10B981",
  greenLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  whatsapp: "#25D366",
};

// b2b_booking_status is an open-ended enum across deployments; map the known
// ones and fall back to a neutral style for anything new.
const STATUS_META = {
  OPEN_FOR_QUOTES:  { label: "Open for Quotes", color: C.amber,    icon: "hourglass-outline" },
  QUOTES_RECEIVED:  { label: "Quotes Received", color: C.blue,     icon: "documents-outline" },
  CONFIRMED:        { label: "Confirmed",       color: C.green,    icon: "checkmark-circle-outline" },
  IN_PROGRESS:      { label: "In Progress",     color: C.indigo600, icon: "navigate-outline" },
  COMPLETED:        { label: "Completed",       color: C.green,    icon: "checkmark-done-outline" },
  INVOICED:         { label: "Invoiced",        color: C.purple,   icon: "receipt-outline" },
  PAID:             { label: "Paid",            color: C.green,    icon: "cash-outline" },
  CANCELLED:        { label: "Cancelled",       color: C.red,      icon: "close-circle-outline" },
};
function statusMeta(s) {
  return (
    STATUS_META[s] || {
      label: String(s || "—").replace(/_/g, " "),
      color: C.subText,
      icon: "ellipse-outline",
    }
  );
}

const money = (n) =>
  n != null && Number(n) > 0 ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
}

export default function SelfBookingDetailScreen({ route, navigation }) {
  const { id, bookingNumber: passedNumber } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [tripStats, setTripStats] = useState(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("Missing booking id");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getSelfBookingB2bDetail(id);
      setBooking(data?.booking || null);
      setTripStats(data?.tripStats || null);
      if (!data?.booking) setError("Booking not found");
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Could not load this booking"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const call = (phone) => phone && Linking.openURL(`tel:${phone}`);
  const whatsapp = (phone) => {
    if (!phone) return;
    const clean = String(phone).replace(/[^\d]/g, "");
    Linking.openURL(`whatsapp://send?phone=91${clean}`).catch(() =>
      Linking.openURL(`https://wa.me/91${clean}`)
    );
  };
  const email = (e) => e && Linking.openURL(`mailto:${e}`);

  const Header = () => (
    <View style={styles.headerBar}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {booking?.bookingNumber || passedNumber || "Booking"}
      </Text>
      <View style={styles.iconBtn} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo700} />
        <LinearGradient colors={[C.indigo700, C.indigo600]} style={styles.heroFlat}>
          <Header />
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.indigo600} />
          <Text style={styles.muted}>Loading booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.indigo700} />
        <LinearGradient colors={[C.indigo700, C.indigo600]} style={styles.heroFlat}>
          <Header />
        </LinearGradient>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={C.red} />
          <Text style={styles.errorText}>{error || "Booking not found"}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sm = statusMeta(booking.status);
  const cust = booking.customer || {};
  const custName = booking.customerName || cust.name || "Customer";
  const custPhone = booking.customerPhone || cust.phone;
  const custEmail = booking.customerEmail || cust.email;
  const company = booking.companyName || cust.companyName;
  const quotes = booking.vendorQuotes || [];
  const acceptedQuotes = quotes.filter(
    (q) => q.status === "ACCEPTED" || q.status === "CONFIRMED"
  ).length;
  const trips = booking.trips || [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.indigo700} />
      <LinearGradient colors={[C.indigo700, C.indigo600]} style={styles.hero}>
        <Header />
        <View style={styles.heroBody}>
          <View style={styles.modePill}>
            <Ionicons name="business" size={12} color="#fff" />
            <Text style={styles.modePillTxt}>
              {booking.bookingMode || "COMPANY"} ·{" "}
              {String(booking.serviceType || "").toUpperCase() || "BOOKING"}
            </Text>
          </View>
          <Text style={styles.heroNumber}>{booking.bookingNumber}</Text>
          <View style={[styles.statusChip, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Ionicons name={sm.icon} size={13} color="#fff" />
            <Text style={styles.statusChipTxt}>{sm.label}</Text>
          </View>
          <Text style={styles.heroAmount}>{money(booking.finalAmount)}</Text>
          <Text style={styles.heroAmountLabel}>Final amount</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.indigo600]} />
        }
      >
        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.bigName}>{custName}</Text>
          {!!company && (
            <View style={styles.inlineRow}>
              <Ionicons name="business-outline" size={14} color={C.subText} />
              <Text style={styles.inlineTxt}>{company}</Text>
            </View>
          )}
          {!!custPhone && (
            <View style={styles.inlineRow}>
              <Ionicons name="call-outline" size={14} color={C.subText} />
              <Text style={styles.inlineTxt}>{custPhone}</Text>
            </View>
          )}
          {!!custEmail && (
            <View style={styles.inlineRow}>
              <Ionicons name="mail-outline" size={14} color={C.subText} />
              <Text style={styles.inlineTxt}>{custEmail}</Text>
            </View>
          )}
          <View style={styles.contactRow}>
            {!!custPhone && (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: C.blueLight }]} onPress={() => call(custPhone)}>
                <Ionicons name="call" size={16} color={C.blue} />
                <Text style={[styles.contactTxt, { color: C.blue }]}>Call</Text>
              </TouchableOpacity>
            )}
            {!!custPhone && (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: "#E7F9EF" }]} onPress={() => whatsapp(custPhone)}>
                <Ionicons name="logo-whatsapp" size={16} color={C.whatsapp} />
                <Text style={[styles.contactTxt, { color: C.whatsapp }]}>WhatsApp</Text>
              </TouchableOpacity>
            )}
            {!!custEmail && (
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: C.indigo50 }]} onPress={() => email(custEmail)}>
                <Ionicons name="mail" size={16} color={C.indigo600} />
                <Text style={[styles.contactTxt, { color: C.indigo600 }]}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Trip */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip details</Text>
          <Row label="Service" value={String(booking.serviceType || "—").toUpperCase()} />
          <Row label="Trip type" value={booking.tripType || "—"} />
          <Row label="Pickup" value={booking.pickupLocation || "—"} />
          {!!booking.dropLocation && <Row label="Drop" value={booking.dropLocation} />}
          <Row label="Vehicles" value={booking.vehiclesRequired != null ? String(booking.vehiclesRequired) : "—"} />
          {booking.vehicleCategory ? <Row label="Category" value={booking.vehicleCategory} /> : null}
          {booking.passengerCount != null ? <Row label="Passengers" value={String(booking.passengerCount)} /> : null}
          <Row label="Scheduled" value={`${fmtDate(booking.scheduledDate)}${booking.scheduledTime ? " · " + booking.scheduledTime : ""}`} />
          {booking.returnDate ? (
            <Row label="Return" value={`${fmtDate(booking.returnDate)}${booking.returnTime ? " · " + booking.returnTime : ""}`} />
          ) : null}
          {!!booking.specialNotes && <Row label="Notes" value={booking.specialNotes} />}
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <Row label="Vendor cost" value={money(booking.vendorCostTotal)} />
          <Row label="Company margin" value={money(booking.companyMargin)} />
          <Row label="GST" value={money(booking.gstAmount)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Final amount</Text>
            <Text style={styles.totalValue}>{money(booking.finalAmount)}</Text>
          </View>
        </View>

        {/* Quotes summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vendor quotes</Text>
          {quotes.length === 0 ? (
            <Text style={styles.muted}>No vendor quotes yet.</Text>
          ) : (
            <View style={styles.statsRow}>
              <Stat n={quotes.length} label="Received" color={C.indigo600} />
              <Stat n={acceptedQuotes} label="Accepted" color={C.green} />
              <Stat n={(booking.superQuotes || []).length} label="Super quotes" color={C.purple} />
            </View>
          )}
        </View>

        {/* Trips */}
        {trips.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trips ({trips.length})</Text>
            {trips.map((t, i) => {
              const ts = statusMeta(t.status);
              return (
                <View key={t.id || i} style={styles.tripRow}>
                  <View style={[styles.tripDot, { backgroundColor: ts.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripVendor}>
                      {t.vendor?.businessName || "Trip " + (i + 1)}
                    </Text>
                    <Text style={styles.tripStatus}>{ts.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cross-app hint */}
        <View style={styles.hintCard}>
          <Ionicons name="information-circle-outline" size={18} color={C.indigo600} />
          <Text style={styles.hintTxt}>
            This is a company booking you placed as a travel agent. For payment &
            full quote management, open the TR customer app → Profile → Company
            Bookings.
          </Text>
        </View>

        <Text style={styles.metaTxt}>Created {fmtDate(booking.createdAt)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Stat({ n, label, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, { color }]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: C.subText, fontSize: 13, marginTop: 10 },
  errorText: { color: C.text, fontSize: 14, textAlign: "center", marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: C.indigo600, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10 },
  retryTxt: { color: "#fff", fontWeight: "700" },

  hero: { paddingBottom: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  heroFlat: { paddingBottom: 6 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    height: 52,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  heroBody: { alignItems: "center", paddingHorizontal: 16, paddingTop: 4 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  modePillTxt: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  heroNumber: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 10 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  statusChipTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  heroAmount: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 14 },
  heroAmountLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: { fontSize: 13, fontWeight: "800", color: C.ink, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  bigName: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 6 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 3 },
  inlineTxt: { color: C.text, fontSize: 13.5, flex: 1 },
  contactRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  contactTxt: { fontSize: 13, fontWeight: "700" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 6, gap: 16 },
  rowLabel: { color: C.subText, fontSize: 13 },
  rowValue: { color: C.ink, fontSize: 13.5, fontWeight: "600", flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
  totalValue: { fontSize: 18, fontWeight: "800", color: C.indigo700 },

  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statN: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11.5, color: C.subText, marginTop: 2 },

  tripRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  tripDot: { width: 10, height: 10, borderRadius: 5 },
  tripVendor: { fontSize: 14, fontWeight: "600", color: C.ink },
  tripStatus: { fontSize: 12, color: C.subText, marginTop: 1 },

  hintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: C.indigo50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  hintTxt: { flex: 1, color: C.indigo700, fontSize: 12.5, lineHeight: 18 },

  metaTxt: { textAlign: "center", color: C.subText, fontSize: 12, marginTop: 16 },
});
