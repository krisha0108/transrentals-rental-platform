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
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { getSelfBookingB2bDetail } from "../../api/travelAgentClient";
import { DISPLAY } from "../_shared/typography";
import { SC as C } from "../_shared/theme";
import AnimatedOrb from "../_shared/AnimatedOrb";


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

const initialsOf = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// icon per trip service (falls back to a generic briefcase)
const SERVICE_ICON = {
  car: "car-sport-outline",
  bike: "bicycle-outline",
  bus: "bus-outline",
  truck: "cube-outline",
  luxury: "diamond-outline",
  chauffeur: "person-outline",
  self_drive: "key-outline",
};
const serviceIcon = (s) => SERVICE_ICON[String(s || "").toLowerCase()] || "briefcase-outline";

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
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>Self-Booking</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <LinearGradient colors={["#0F2A22", "#16382E", "#1C6B52"]} style={styles.heroFlat}>
          {/* Same orbs as the loaded hero — without them the bar sat flat
              while the booking loaded and then popped into motion. */}
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
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
        <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
        <LinearGradient colors={["#0F2A22", "#16382E", "#1C6B52"]} style={styles.heroFlat}>
          {/* Same orbs as the loaded hero — without them the bar sat flat
              while the booking loaded and then popped into motion. */}
          <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
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
      <StatusBar barStyle="light-content" backgroundColor="#0F2A22" />
      <LinearGradient colors={["#0F2A22", "#16382E", "#1C6B52"]} style={styles.hero}>
        <AnimatedOrb style={styles.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={styles.orbB} delay={900} dx={-12} dy={10} />
        <Header />
        <View style={styles.heroBody}>
          <View style={styles.heroIcon}>
            <Ionicons name={serviceIcon(booking.serviceType)} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.heroNumber} numberOfLines={1}>{booking.bookingNumber}</Text>
            <View style={styles.modePill}>
              <Ionicons name="business" size={11} color="rgba(255,255,255,0.92)" />
              <Text style={styles.modePillTxt}>
                {booking.bookingMode || "COMPANY"} · {String(booking.serviceType || "BOOKING").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.indigo600]} tintColor={C.indigo600} />
        }
      >
        {/* Floating amount card — overlaps the hero */}
        <View style={styles.amountCard}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.amountLabel}>FINAL AMOUNT</Text>
            <Text style={styles.amountValue} numberOfLines={1}>{money(booking.finalAmount)}</Text>
          </View>
          <View style={styles.amountChip}>
            <Ionicons name={sm.icon} size={13} color={sm.color} />
            <Text style={[styles.amountChipTxt, { color: sm.color }]}>{sm.label}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <SectionTitle icon="person-circle-outline" label="Customer" />
          <View style={styles.custHead}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initialsOf(custName)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.bigName} numberOfLines={1}>{custName}</Text>
              {!!company && (
                <View style={styles.inlineRow}>
                  <Ionicons name="business-outline" size={13} color={C.subText} />
                  <Text style={styles.custSub} numberOfLines={1}>{company}</Text>
                </View>
              )}
            </View>
          </View>

          {(!!custPhone || !!custEmail) && (
            <View style={styles.contactRow}>
              {!!custPhone && (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: C.blueLight }]} onPress={() => call(custPhone)} activeOpacity={0.85}>
                  <Ionicons name="call" size={14} color={C.blue} />
                  <Text style={[styles.contactTxt, { color: C.blue }]} numberOfLines={1}>Call</Text>
                </TouchableOpacity>
              )}
              {!!custPhone && (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: "#E4F5EA" }]} onPress={() => whatsapp(custPhone)} activeOpacity={0.85}>
                  <Ionicons name="logo-whatsapp" size={14} color={C.whatsapp} />
                  <Text style={[styles.contactTxt, { color: "#128C4A" }]} numberOfLines={1}>WhatsApp</Text>
                </TouchableOpacity>
              )}
              {!!custEmail && (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: C.indigo50 }]} onPress={() => email(custEmail)} activeOpacity={0.85}>
                  <Ionicons name="mail" size={14} color={C.indigo600} />
                  <Text style={[styles.contactTxt, { color: C.indigo600 }]} numberOfLines={1}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {(!!custPhone || !!custEmail) && (
            <View style={styles.custContactList}>
              {!!custPhone && (
                <View style={styles.miniRow}>
                  <Ionicons name="call-outline" size={13} color={C.subText} />
                  <Text style={styles.miniTxt}>{custPhone}</Text>
                </View>
              )}
              {!!custEmail && (
                <View style={styles.miniRow}>
                  <Ionicons name="mail-outline" size={13} color={C.subText} />
                  <Text style={styles.miniTxt} numberOfLines={1}>{custEmail}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Trip details */}
        <View style={styles.card}>
          <SectionTitle icon="map-outline" label="Trip details" />
          <InfoItem icon="construct-outline" label="Service" value={String(booking.serviceType || "—").toUpperCase()} />
          <InfoItem icon="swap-horizontal-outline" label="Trip type" value={booking.tripType || "—"} />
          <InfoItem icon="location-outline" label="Pickup" value={booking.pickupLocation || "—"} />
          {!!booking.dropLocation && <InfoItem icon="flag-outline" label="Drop" value={booking.dropLocation} />}
          <InfoItem icon="car-outline" label="Vehicles" value={booking.vehiclesRequired != null ? String(booking.vehiclesRequired) : "—"} />
          {booking.vehicleCategory ? <InfoItem icon="pricetag-outline" label="Category" value={booking.vehicleCategory} /> : null}
          {booking.passengerCount != null ? <InfoItem icon="people-outline" label="Passengers" value={String(booking.passengerCount)} /> : null}
          <InfoItem icon="calendar-outline" label="Scheduled" value={`${fmtDate(booking.scheduledDate)}${booking.scheduledTime ? " · " + booking.scheduledTime : ""}`} />
          {booking.returnDate ? (
            <InfoItem icon="return-down-back-outline" label="Return" value={`${fmtDate(booking.returnDate)}${booking.returnTime ? " · " + booking.returnTime : ""}`} />
          ) : null}
          {!!booking.specialNotes && <InfoItem icon="reader-outline" label="Notes" value={booking.specialNotes} last />}
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <SectionTitle icon="cash-outline" label="Pricing" />
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
          <SectionTitle icon="documents-outline" label="Vendor quotes" />
          {quotes.length === 0 ? (
            <Text style={styles.muted}>No vendor quotes yet.</Text>
          ) : (
            <View style={styles.statsRow}>
              <Stat n={quotes.length} label="Received" color={C.indigo600} tint={C.indigo50} />
              <Stat n={acceptedQuotes} label="Accepted" color={C.green} tint={C.greenLight} />
              <Stat n={(booking.superQuotes || []).length} label="Super quotes" color={C.purple} tint="#EFE9F5" />
            </View>
          )}
        </View>

        {/* Trips */}
        {trips.length > 0 && (
          <View style={styles.card}>
            <SectionTitle icon="git-branch-outline" label={`Trips (${trips.length})`} />
            {trips.map((t, i) => {
              const ts = statusMeta(t.status);
              return (
                <View key={t.id || i} style={[styles.tripRow, i === trips.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <View style={[styles.tripDotRing, { borderColor: ts.color }]}>
                    <View style={[styles.tripDot, { backgroundColor: ts.color }]} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.tripVendor} numberOfLines={1}>
                      {t.vendor?.businessName || "Trip " + (i + 1)}
                    </Text>
                    <Text style={[styles.tripStatus, { color: ts.color }]}>{ts.label}</Text>
                  </View>
                  <Ionicons name={ts.icon} size={16} color={ts.color} />
                </View>
              );
            })}
          </View>
        )}

        {/* Cross-app hint */}
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Ionicons name="information-circle" size={17} color={C.indigo600} />
          </View>
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

function SectionTitle({ icon, label }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleIcon}>
        <Ionicons name={icon} size={14} color={C.indigo600} />
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
    </View>
  );
}

function InfoItem({ icon, label, value, last }) {
  return (
    <View style={[styles.infoItem, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={15} color={C.indigo600} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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

function Stat({ n, label, color, tint }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Text style={[styles.statN, { color }]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { fontFamily: DISPLAY, color: C.subText, fontSize: 13 },
  errorText: { fontFamily: DISPLAY, color: C.text, fontSize: 14, textAlign: "center", marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: C.indigo600, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  retryTxt: { fontFamily: DISPLAY, color: "#fff", fontWeight: "bold" },

  // ---- hero (compact) ----
  hero: {
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: "hidden",
    position: "relative",
  },
  // overflow, like hero — the orbs sit outside the bar's box and would
  // otherwise spill over the content below it.
  heroFlat: { paddingBottom: 6, overflow: "hidden" },
  orbA: {
    position: "absolute", top: -40, right: -26,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(201,154,63,0.13)",
  },
  orbB: {
    position: "absolute", bottom: -34, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(46,158,119,0.16)",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? 6 : 2,
    height: 46,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerTitle: { fontFamily: DISPLAY, color: "#fff", fontSize: 15, fontWeight: "bold", letterSpacing: 0.3 },

  heroBody: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 6 },
  heroIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },
  heroNumber: { fontFamily: DISPLAY, color: "#fff", fontSize: 19, fontWeight: "bold", letterSpacing: 0.2 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  modePillTxt: { fontFamily: DISPLAY, color: "rgba(255,255,255,0.95)", fontSize: 10.5, fontWeight: "bold", letterSpacing: 0.3 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  statusChipTxt: { fontFamily: DISPLAY, color: "#fff", fontSize: 11, fontWeight: "bold" },

  // ---- floating amount card ----
  amountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  amountLabel: { fontFamily: DISPLAY, fontSize: 10.5, fontWeight: "bold", color: C.subText, letterSpacing: 0.8 },
  amountValue: { fontFamily: DISPLAY, fontSize: 27, fontWeight: "bold", color: C.ink, marginTop: 3 },
  amountChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.bg,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: C.border,
  },
  amountChipTxt: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold" },

  // ---- cards ----
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitleIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.indigo50,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontFamily: DISPLAY, fontSize: 12.5, fontWeight: "bold", color: C.ink, textTransform: "uppercase", letterSpacing: 0.5 },

  // customer
  custHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.indigo50,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  avatarTxt: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.indigo600 },
  bigName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: "bold", color: C.ink },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  custSub: { fontFamily: DISPLAY, color: C.subText, fontSize: 13, flex: 1 },
  contactRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  contactBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 4, paddingVertical: 10, borderRadius: 12 },
  contactTxt: { fontFamily: DISPLAY, fontSize: 11.5, fontWeight: "bold", flexShrink: 1 },
  custContactList: { marginTop: 12, gap: 7 },
  miniRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniTxt: { fontFamily: DISPLAY, color: C.text, fontSize: 13, flex: 1 },

  // info items (trip details)
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.bg,
    alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontFamily: DISPLAY, color: C.subText, fontSize: 13 },
  infoValue: { fontFamily: DISPLAY, color: C.ink, fontSize: 13.5, fontWeight: "600", flex: 1, textAlign: "right" },

  // pricing rows
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 6, gap: 16 },
  rowLabel: { fontFamily: DISPLAY, color: C.subText, fontSize: 13 },
  rowValue: { fontFamily: DISPLAY, color: C.ink, fontSize: 13.5, fontWeight: "600", flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  totalValue: { fontFamily: DISPLAY, fontSize: 19, fontWeight: "bold", color: C.indigo600 },

  // quote stats
  statsRow: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  statN: { fontFamily: DISPLAY, fontSize: 23, fontWeight: "bold" },
  statLabel: { fontFamily: DISPLAY, fontSize: 11, color: C.subText, marginTop: 3, fontWeight: "600" },

  // trips
  tripRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  tripDotRing: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: "center", justifyContent: "center",
  },
  tripDot: { width: 9, height: 9, borderRadius: 5 },
  tripVendor: { fontFamily: DISPLAY, fontSize: 14, fontWeight: "bold", color: C.ink },
  tripStatus: { fontFamily: DISPLAY, fontSize: 12, marginTop: 2, fontWeight: "600" },

  // hint
  hintCard: {
    flexDirection: "row",
    gap: 11,
    backgroundColor: C.indigo50,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D8CDBB",
  },
  hintIcon: { paddingTop: 1 },
  hintTxt: { fontFamily: DISPLAY, flex: 1, color: C.indigo700, fontSize: 12.5, lineHeight: 19 },

  metaTxt: { fontFamily: DISPLAY, textAlign: "center", color: C.subText, fontSize: 12, marginTop: 8 },
});
