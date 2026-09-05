import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { showError, showConfirm, showInfo, showSuccess } from '../../../../services/alertService';
import {
  getBookingById,
  acceptBooking,
  rejectBooking,
  generateTripOtp,
  verifyTripOtp,
  completeBooking,
  getBaseURL,
  getSessionToken,
} from '../../../api/client';
import { SC as T, G, rs, cardShadow, shade } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// How far the ticket summary card rides up over the hero's rounded bottom
// edge. Same technique/constant role as the bike sibling detail screens'
// ticket card and the travel-agent BookingDetailScreen's contact bar — the
// hero's own bottom padding is shortened by the same amount and the scroll
// content gets it back as paddingTop, so the gap stays the same, only the
// overlap changes.
const TICKET_OVERLAP = 40;

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g500: T.emerald500, g400: T.emerald,
  g50: T.tintEmerald, g100: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, text: T.ink, sub: T.text, muted: T.subText,
  green: T.emerald500, greenL: T.tintEmerald, greenD: T.forest,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  teal: T.teal, tealL: T.tintOcean,
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { color: C.amber, bg: C.amberL, label: 'Awaiting Payment', icon: 'hourglass-outline' },
  PAYMENT_VERIFIED: { color: C.green, bg: C.greenL, label: 'Payment Verified', icon: 'checkmark-circle' },
  PENDING_VENDOR: { color: C.amber, bg: C.amberL, label: 'Pending', icon: 'hourglass-outline' },
  BROADCASTED: { color: C.blue, bg: C.blueL, label: 'Open', icon: 'radio-outline' },
  ACCEPTED: { color: C.g700, bg: C.g50, label: 'Accepted', icon: 'checkmark-circle' },
  CONFIRMED: { color: C.green, bg: C.greenL, label: 'Confirmed', icon: 'checkmark-circle' },
  READY_FOR_PICKUP: { color: C.teal, bg: C.tealL, label: 'Ready for Pickup', icon: 'car-outline' },
  IN_PROGRESS: { color: C.purple, bg: C.purpleL, label: 'In Progress', icon: 'car-sport-outline' },
  COMPLETED: { color: C.muted, bg: C.bg, label: 'Completed', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { color: C.red, bg: C.redL, label: 'Cancelled', icon: 'close-circle-outline' },
};

/* ── Section wrapper — icon + title header inside one bordered card ────── */
function Section({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardIcon}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function SelfDriveBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  const [showQuote, setShowQuote] = useState(false); // collapsible quote details

  // OTP States
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSuccess, setOtpSuccess] = useState(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('self-drive', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[SelfDriveBookingDetail] Error:', error);
      showError('Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
  }, [fetchBooking]);

  const handleAccept = async () => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
          try {
            setActionLoading(true);
            await acceptBooking('self-drive', bookingId);
            await fetchBooking();
            showSuccess('Booking accepted successfully');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to accept booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Accept' });
  };

  const handleReject = async () => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
          try {
            setActionLoading(true);
            await rejectBooking('self-drive', bookingId, 'Vendor rejected');
            await fetchBooking();
            showSuccess('Booking rejected');
          } catch (error) {
            showError(error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        }, { confirmText: 'Reject', destructive: true });
  };

  const handleCall = (phone, bookingType, bookingId) => {
    if (!phone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType, bookingId, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId: booking.id,
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType: 'self-drive',
    });
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const data = await generateTripOtp('self-drive', booking.id);
      setOtpSuccess('OTP sent to customer successfully!');
      showSuccess('OTP sent to customer successfully!');
      // Update booking status
      await fetchBooking();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to generate OTP';
      setOtpError(errorMsg);
      showError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and start trip
  const handleStartTrip = async () => {
    if (!booking || !otpInput) {
      showError('Please enter OTP');
      return;
    }
    if (otpInput.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const data = await verifyTripOtp('self-drive', booking.id, otpInput, 'start');
      setOtpSuccess('Trip started successfully!');
      showSuccess('Trip started successfully!');
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to verify OTP';
      setOtpError(errorMsg);
      showError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // End trip
  const handleEndTrip = async () => {
    if (!booking) return;

    showConfirm('End Trip', 'Are you sure you want to complete this trip?', async () => {
            setOtpLoading(true);
            setOtpError(null);

            try {
              await completeBooking('self-drive', booking.id);
              setOtpSuccess('Trip completed successfully!');
              showSuccess('Trip completed successfully!');
              await fetchBooking();
            } catch (err) {
              const errorMsg = err?.response?.data?.error || err?.message || 'Failed to complete trip';
              setOtpError(errorMsg);
              showError(errorMsg);
            } finally {
              setOtpLoading(false);
            }
          }, { confirmText: 'Complete' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;
  };

  const canAccept = () => {
    const acceptableStatuses = ['PENDING_VENDOR', 'BROADCASTED'];
    return acceptableStatuses.includes(booking?.status);
  };

  const canReject = () => {
    const rejectableStatuses = ['PENDING_VENDOR', 'BROADCASTED'];
    return rejectableStatuses.includes(booking?.status);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.hero}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons name="car-side" size={18} color={C.amber} />
                <Text style={styles.heroTitle}>Booking Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Identity card skeleton — now a body panel */}
          <View style={styles.identityCard}>
            <View style={styles.identityBlock}>
              <Bone w={rs(48)} h={rs(48)} r={rs(14)} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12), gap: 6 }}>
                <Bone w={70} h={9} r={3} />
                <Bone w={130} h={16} r={4} />
                <Bone w={100} h={11} r={4} />
              </View>
            </View>
          </View>

          {/* Ticket summary skeleton */}
          <View style={styles.ticketWrap}>
            <View style={[styles.ticketRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={styles.ticketUpperStub}>
              <Bone w={rs(44)} h={rs(44)} r={rs(12)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={60} h={9} r={3} />
                <Bone w={100} h={16} r={4} />
              </View>
              <Bone w={70} h={22} r={20} />
            </View>
            <View style={styles.perforationRow}>
              <View style={styles.dashLine} />
            </View>
            <View style={styles.ticketLowerStub}>
              <Bone w={rs(30)} h={rs(30)} r={rs(9)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={90} h={9} r={3} />
                <Bone w={120} h={16} r={4} />
              </View>
            </View>
          </View>

          {/* Status strip skeleton */}
          <View style={styles.statusStrip}>
            {[0,1,2].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statusLine} />}
                <View style={styles.statusStep}>
                  <Bone w={24} h={24} r={12} />
                  <Bone w={44} h={9} r={3} style={{ marginTop: 6 }} />
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Status banner skeleton */}
          <View style={styles.statusBanner}>
            <Bone w={26} h={26} r={13} />
            <View style={styles.statusTextWrap}>
              <Bone w={110} h={14} r={4} style={{ marginBottom: 6 }} />
              <Bone w={140} h={10} r={4} />
            </View>
          </View>

          {/* Customer Information card skeleton */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Bone w={34} h={34} r={10} />
              <Bone w={150} h={13} r={4} />
            </View>
            <View style={styles.customerGrid}>
              <View style={styles.infoBox}>
                <Bone w={40} h={40} r={12} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Bone w={50} h={9} r={3} />
                  <Bone w={100} h={13} r={4} />
                </View>
              </View>
            </View>
            <View style={styles.quickActions}>
              <Bone h={40} r={12} style={{ flex: 1 }} />
              <Bone h={40} r={12} style={{ flex: 1 }} />
            </View>
          </View>

          {/* Vehicle & Trip card skeleton */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            <View style={styles.vehicleBox}>
              <Bone w={64} h={64} r={16} />
              <View style={{ flex: 1, gap: 6 }}>
                <Bone w={130} h={15} r={4} />
                <Bone w={90} h={11} r={4} />
              </View>
            </View>
            <View style={styles.rentalRail}>
              <View style={styles.rentalGutter}>
                <Bone w={10} h={10} r={5} />
                <View style={styles.rentalLine} />
                <Bone w={10} h={10} r={5} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Bone w={50} h={9} r={3} />
                <Bone w={100} h={14} r={4} style={{ marginBottom: rs(12) }} />
                <Bone w={60} h={9} r={3} />
                <Bone w={90} h={14} r={4} />
              </View>
            </View>
          </View>

          {/* Payment Summary card skeleton */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            {[0,1,2].map(i => (
              <View key={i} style={styles.payRow}>
                <Bone w={70} h={11} r={4} />
                <Bone w={60} h={11} r={4} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.hero}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons name="car-side" size={18} color={C.amber} />
                <Text style={styles.heroTitle}>Booking Details</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={44} color={C.g400} />
          </View>
          <Text style={styles.emptyTitle}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  /* ── Status progression: Quoted → Accepted → Pickup OTP ── */
  const st = booking.status;
  const acceptedDone = ['ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'PAYMENT_VERIFIED'].includes(st);
  const otpDone      = ['IN_PROGRESS', 'COMPLETED'].includes(st);
  const steps = [
    { key: 'quoted',   label: 'Quoted',     done: true },
    { key: 'accepted', label: 'Accepted',   done: acceptedDone },
    { key: 'otp',      label: 'Pickup OTP', done: otpDone },
  ];
  const curIdx = steps.findIndex(x => !x.done);
  steps.forEach((x, i) => { x.current = i === curIdx; });

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero ═════════════════════════════════════════════════════════ */}
      <LinearGradient colors={G.hero} style={styles.hero}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <MaterialCommunityIcons name="car-side" size={18} color={C.amber} />
              <Text style={styles.heroTitle}>Self Drive</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g500} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card — booking # + customer, now a body panel */}
        <View style={styles.identityCard}>
          <View style={styles.identityBlock}>
            <View style={styles.identityIcon}>
              <MaterialCommunityIcons name="car-side" size={24} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12) }}>
              <Text style={styles.identityLabel}>BOOKING #</Text>
              <Text style={styles.identityName} numberOfLines={1}>{booking.bookingNumber || booking.id}</Text>
              <Text style={styles.identitySub} numberOfLines={1}>{booking.customerName || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* ── Ticket summary — status & grand total, floated over the hero ── */}
        <View style={styles.ticketWrap}>
          <LinearGradient
            colors={[statusConfig.color, shade(statusConfig.color, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ticketRail}
          />
          <View style={styles.ticketUpperStub}>
            <View style={styles.ticketIconBox}>
              <MaterialCommunityIcons name="car-side" size={22} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.ticketLabel}>CREATED</Text>
              <Text style={styles.ticketNumber} numberOfLines={1}>{formatDate(booking.createdAt)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '40' }]}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusPillTxt, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* Perforation — torn-ticket edge, echoes the bike sibling ticket card */}
          <View style={styles.perforationRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashLine} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.ticketLowerStub}>
            <View style={styles.moneyIconWrap}>
              <Ionicons name="cash" size={16} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketAmountLabel}>GRAND TOTAL</Text>
              <Text style={styles.ticketAmountVal}>
                ₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status progression stepper ── */}
        <View style={styles.statusStrip}>
          {steps.map((stp, i) => (
            <React.Fragment key={stp.key}>
              {i > 0 && <View style={[styles.statusLine, steps[i - 1].done && { backgroundColor: C.g500 }]} />}
              <View style={styles.statusStep}>
                <View style={[styles.statusDot, stp.done && styles.statusDotDone, stp.current && styles.statusDotCurrent]}>
                  {stp.done
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : <Text style={[styles.statusDotNum, stp.current && { color: '#fff' }]}>{i + 1}</Text>}
                </View>
                <Text style={[styles.statusStepLbl, (stp.done || stp.current) && { color: C.text, fontWeight: '700' }]}>{stp.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Status banner ── */}
        <View style={[styles.statusBanner, { borderLeftColor: statusConfig.color }]}>
          <Ionicons name={statusConfig.icon} size={26} color={statusConfig.color} />
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Text style={styles.statusDate}>
              Created on {formatDate(booking.createdAt)}
            </Text>
          </View>
        </View>

        {/* ── Quote Details (collapsible) ── */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.quoteHead} activeOpacity={0.7} onPress={() => setShowQuote(v => !v)}>
            <View style={styles.cardHead0}>
              <View style={styles.cardIcon}>
                <Ionicons name="document-text-outline" size={15} color={C.g700} />
              </View>
              <Text style={styles.cardTitle}>Quote Details</Text>
            </View>
            <Ionicons name={showQuote ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
          </TouchableOpacity>
          {showQuote && (() => {
            const q = booking.quote || {};
            const splitList = (v) => (v ? String(v).split(',').map(x => x.trim()).filter(Boolean) : []);
            const inc   = splitList(q.inclusions);
            const exc   = splitList(q.exclusions);
            const terms = splitList(q.termsConditions);
            const dailyRate = q.dailyRate ?? booking.dailyRate;
            const deposit   = q.securityDeposit ?? booking.securityDeposit;
            const total     = q.grandTotal ?? booking.grandTotal ?? booking.totalAmount;
            const advance   = q.advanceAmount ?? booking.advancePaid ?? booking.paidAmount;
            const money = (v) => `₹${Number(v || 0).toLocaleString()}`;
            return (
              <View style={styles.quoteBody}>
                {/* Pricing rows */}
                <View style={styles.payRow}>
                  <Text style={styles.payLabel}>Vehicle</Text>
                  <Text style={styles.payVal}>{q.vehicleName || booking.requestedVehicleName || booking.vehicleName || '—'}</Text>
                </View>
                {q.vehicleCategory ? (
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Category</Text>
                    <Text style={styles.payVal}>{q.vehicleCategory}</Text>
                  </View>
                ) : null}
                {dailyRate ? (
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Daily Rate × {booking.totalDays || 1}</Text>
                    <Text style={styles.payVal}>{money(dailyRate)}</Text>
                  </View>
                ) : null}
                {deposit > 0 ? (
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Security Deposit</Text>
                    <Text style={styles.payVal}>{money(deposit)}</Text>
                  </View>
                ) : null}
                {(q.unlimitedKm || q.kmLimitPerDay != null) ? (
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>KM Limit</Text>
                    <Text style={styles.payVal}>{q.unlimitedKm ? 'Unlimited' : `${q.kmLimitPerDay} km/day`}</Text>
                  </View>
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Quoted</Text>
                  <Text style={styles.totalVal}>{money(total)}</Text>
                </View>
                {advance > 0 ? (
                  <View style={styles.payRow}>
                    <Text style={styles.payLabel}>Advance{q.advancePercent ? ` (${q.advancePercent}%)` : ''}</Text>
                    <Text style={styles.payVal}>{money(advance)}</Text>
                  </View>
                ) : null}

                {/* Inclusions */}
                {inc.length > 0 && (
                  <View style={styles.quoteSub}>
                    <Text style={styles.quoteSubTitle}>Inclusions</Text>
                    <View style={styles.pillWrap}>
                      {inc.map((t, i) => (
                        <View key={i} style={[styles.pill, { backgroundColor: C.g100 }]}>
                          <View style={[styles.pillPip, { backgroundColor: C.g700 }]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                          <Text style={[styles.pillTxt, { color: C.g700 }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Exclusions */}
                {exc.length > 0 && (
                  <View style={styles.quoteSub}>
                    <Text style={styles.quoteSubTitle}>Exclusions</Text>
                    <View style={styles.pillWrap}>
                      {exc.map((t, i) => (
                        <View key={i} style={[styles.pill, { backgroundColor: C.redL }]}>
                          <View style={[styles.pillPip, { backgroundColor: C.red }]}>
                            <Ionicons name="close" size={10} color="#fff" />
                          </View>
                          <Text style={[styles.pillTxt, { color: C.red }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Terms */}
                {terms.length > 0 && (
                  <View style={styles.quoteSub}>
                    <Text style={styles.quoteSubTitle}>Terms & Conditions</Text>
                    <View style={styles.termsCard}>
                      {terms.map((t, i) => (
                        <View key={i} style={[styles.termLine, i === terms.length - 1 && { marginBottom: 0 }]}>
                          <Text style={styles.termNum}>{i + 1}.</Text>
                          <Text style={styles.termTxt}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Vendor note */}
                {q.vendorMessage ? (
                  <View style={styles.quoteNote}>
                    <Ionicons name="chatbox-ellipses-outline" size={13} color={C.muted} />
                    <Text style={[styles.quoteLiTxt, { flex: 1 }]}>{q.vendorMessage}</Text>
                  </View>
                ) : null}
                {q.validTill ? (
                  <Text style={styles.quoteValid}>Valid until {formatDate(q.validTill)}</Text>
                ) : null}
              </View>
            );
          })()}
        </View>

        {/* ── Customer Information ── */}
        <Section icon={<Ionicons name="person-circle-outline" size={15} color={C.g700} />} title="Customer Information">
          <View style={styles.customerGrid}>
            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: C.blueL }]}>
                <Ionicons name="person" size={20} color={C.blue} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{booking.customerName || 'Customer'}</Text>
              </View>
            </View>

            {booking.customerEmail && (
              <View style={[styles.infoBox, styles.infoBoxFull]}>
                <View style={[styles.infoIconBox, { backgroundColor: C.purpleL }]}>
                  <Ionicons name="mail" size={20} color={C.purple} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {booking.customerEmail}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {booking.customerPhone && (
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: C.tealL }]}
                onPress={() => handleCall(booking.customerPhone, 'self_drive_booking', booking.id)}
              >
                <Ionicons name="call" size={20} color={C.teal} />
                <Text style={[styles.quickActionText, { color: C.teal }]}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.quickActionBtn, { backgroundColor: C.purpleL }]}
              onPress={handleChat}
            >
              <Ionicons name="chatbubble" size={20} color={C.purple} />
              <Text style={[styles.quickActionText, { color: C.purple }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Vehicle & Trip Details ── */}
        <Section icon={<MaterialCommunityIcons name="car-side" size={15} color={C.g700} />} title="Vehicle & Trip Details">
          {/* Vehicle Info */}
          <View style={styles.vehicleBox}>
            <LinearGradient colors={[C.g50, C.g100]} style={styles.vehicleIconWrap}>
              <MaterialCommunityIcons name="car-side" size={32} color={C.g700} />
            </LinearGradient>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {booking.requestedVehicleName || booking.vehicleName || 'Self-Drive Car'}
              </Text>
              {(booking.requestedBrand || booking.vehicleCategory) && (
                <Text style={styles.vehicleDetails}>
                  {booking.requestedBrand || booking.vehicleCategory}
                </Text>
              )}
              {booking.acceptedVehicleName && (
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedText}>
                    Assigned: {booking.acceptedVehicleName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location & Duration */}
          <View style={styles.tripInfoGrid}>
            <View style={styles.tripInfoItem}>
              <Ionicons name="location" size={18} color={C.muted} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.tripInfoLabel}>Location</Text>
                <Text style={styles.tripInfoValue}>
                  {booking.locationName || booking.pickupCity || 'Not specified'}
                </Text>
              </View>
            </View>

            {booking.totalDays && (
              <View style={styles.tripInfoItem}>
                <Ionicons name="calendar" size={18} color={C.muted} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.tripInfoLabel}>Duration</Text>
                  <Text style={styles.tripInfoValue}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Rental period rail — connected pickup → drop-off, mirrors the
              bike siblings' route-rail treatment (dots + connecting line) */}
          <View style={styles.rentalRail}>
            <View style={styles.rentalGutter}>
              <View style={[styles.rentalDot, { backgroundColor: C.g500 }]} />
              {(booking.dropDate || booking.returnDate) && <View style={styles.rentalLine} />}
              {(booking.dropDate || booking.returnDate) && <View style={[styles.rentalDot, { backgroundColor: C.red }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rentalLabel}>PICKUP</Text>
              <Text style={styles.rentalValue}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime && <Text style={styles.rentalTime}>{formatTime(booking.pickupTime)}</Text>}
              {(booking.dropDate || booking.returnDate) && (
                <>
                  <Text style={[styles.rentalLabel, { marginTop: rs(12) }]}>DROP-OFF</Text>
                  <Text style={styles.rentalValue}>{formatDate(booking.dropDate || booking.returnDate)}</Text>
                  {(booking.dropTime || booking.returnTime) && (
                    <Text style={styles.rentalTime}>{formatTime(booking.dropTime || booking.returnTime)}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </Section>

        {/* ── Payment Summary ── */}
        <Section icon={<Ionicons name="card-outline" size={15} color={C.g700} />} title="Payment Summary">
          <View style={styles.paymentDetails}>
            {booking.dailyRate && (
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Daily Rate</Text>
                <Text style={styles.payVal}>₹{booking.dailyRate.toLocaleString()}</Text>
              </View>
            )}

            {booking.totalDays && (
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Days</Text>
                <Text style={styles.payVal}>{booking.totalDays}</Text>
              </View>
            )}

            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Subtotal</Text>
              <Text style={styles.payVal}>
                ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
              </Text>
            </View>

            {booking.securityDeposit > 0 && (
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Security Deposit</Text>
                <Text style={styles.payVal}>
                  ₹{booking.securityDeposit.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.paymentDivider} />

            <View style={styles.payRow}>
              <Text style={styles.paymentLabelBold}>Grand Total</Text>
              <Text style={styles.paymentValueTotal}>
                ₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}
              </Text>
            </View>

            {(booking.advancePaid || booking.paidAmount || booking.advanceAmount) > 0 && (
              <>
                <View style={styles.payRow}>
                  <Text style={[styles.payLabel, { color: C.green }]}>Advance Paid</Text>
                  <Text style={[styles.payVal, { color: C.green }]}>
                    ₹{(booking.advancePaid || booking.paidAmount || booking.advanceAmount || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.payRow}>
                  <Text style={[styles.payLabel, { color: C.amber }]}>Balance Due</Text>
                  <Text style={[styles.payVal, { color: C.amber }]}>
                    ₹{(
                      (booking.grandTotal || booking.totalAmount || 0) -
                      (booking.advancePaid || booking.paidAmount || booking.advanceAmount || 0)
                    ).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Section>

        {/* ── Payment Verified Info Card ── */}
        {booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking && (
          <View style={[styles.card, styles.verifiedCard]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="checkmark-circle" size={22} color={C.g700} />
              <Text style={[styles.cardTitle, { color: C.g700 }]}>Advance Payment Received!</Text>
            </View>
            <Text style={[styles.tripControlDesc, { color: C.g700, marginBottom: 0 }]}>
              Customer has paid the advance amount. You can now generate OTP to start the trip when the customer arrives.
            </Text>
          </View>
        )}

        {/* ── Trip Control - OTP Section ── */}
        {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || booking.status === 'READY_FOR_PICKUP' || booking.status === 'IN_PROGRESS' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="key-outline" size={22} color={C.g700} />
              <Text style={styles.cardTitle}>Trip Control</Text>
            </View>

            {/* Error/Success Messages */}
            {otpError && (
              <View style={[styles.messageBox, { backgroundColor: C.redL, borderColor: '#FCA5A5' }]}>
                <Text style={[styles.messageText, { color: C.red }]}>{otpError}</Text>
              </View>
            )}
            {otpSuccess && (
              <View style={[styles.messageBox, { backgroundColor: C.greenL, borderColor: '#6EE7B7' }]}>
                <Text style={[styles.messageText, { color: C.green }]}>{otpSuccess}</Text>
              </View>
            )}

            {/* For ACCEPTED/CONFIRMED/PAYMENT_VERIFIED - Generate OTP */}
            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' || (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
              <View>
                <Text style={styles.tripControlDesc}>
                  When customer arrives for pickup, generate OTP to start the trip.
                </Text>
                <TouchableOpacity
                  style={styles.otpBtnWrap}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.otpBtnInner}>
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={20} color="#fff" />
                        <Text style={styles.otpButtonText}>Generate & Send OTP to Customer</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* For READY_FOR_PICKUP - Enter OTP */}
            {booking.status === 'READY_FOR_PICKUP' && (
              <View>
                <View style={styles.otpSentBox}>
                  <Ionicons name="checkmark-circle" size={20} color={C.g700} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.otpSentTitle}>OTP sent to customer!</Text>
                    <Text style={styles.otpSentDesc}>
                      Ask customer to check their booking page for OTP and tell you.
                    </Text>
                  </View>
                </View>

                <View style={styles.otpInputSection}>
                  <Text style={styles.otpInputLabel}>Enter OTP from Customer</Text>
                  <View style={styles.otpInputWrapper}>
                    <Icon name="key" size={20} color={C.muted} />
                    <TextInput
                      style={styles.otpInput}
                      value={otpInput}
                      onChangeText={(text) => setOtpInput(text.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.otpBtnWrap}
                  onPress={handleStartTrip}
                  disabled={otpLoading || otpInput.length !== 6}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={otpInput.length === 6 ? G.emerald : [C.muted, C.muted]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.otpBtnInner}
                  >
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={styles.otpButtonText}>Verify OTP & Start Trip</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.otpButton, styles.otpButtonOutline]}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                >
                  <Icon name="refresh-cw" size={18} color={C.g700} />
                  <Text style={[styles.otpButtonText, { color: C.g700 }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* For IN_PROGRESS - End Trip */}
            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[styles.otpSentBox, { backgroundColor: C.purpleL, borderColor: '#C084FC' }]}>
                  <Ionicons name="car" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.otpSentTitle, { color: C.purple }]}>Trip is in progress</Text>
                    <Text style={styles.otpSentDesc}>
                      When customer returns the vehicle, click below to complete the trip.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.otpButton, styles.otpButtonDanger]}
                  onPress={handleEndTrip}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color={C.red} />
                  ) : (
                    <>
                      <Ionicons name="stop-circle" size={20} color={C.red} />
                      <Text style={[styles.otpButtonText, { color: C.red }]}>End Trip & Complete Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Completed Status ── */}
        {booking.status === 'COMPLETED' && (
          <View style={[styles.card, styles.completedCard]}>
            <View style={styles.completedInner}>
              <Ionicons name="checkmark-circle" size={48} color={C.green} />
              <Text style={styles.completedTitle}>Trip Completed!</Text>
              <Text style={styles.completedDesc}>
                This booking has been successfully completed.
              </Text>
            </View>
          </View>
        )}

        {/* ── Customer Notes ── */}
        {booking.customerNotes && (
          <Section icon={<Ionicons name="chatbox-ellipses-outline" size={15} color={C.amber} />} title="Customer Notes">
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{booking.customerNotes}</Text>
            </View>
          </Section>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      {(canAccept() || canReject()) && (
        <View style={styles.actionBar}>
          {canReject() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Ionicons name="close-circle" size={20} color={C.red} />
              <Text style={[styles.actionBtnText, { color: C.red }]}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity
              style={styles.acceptBtnWrap}
              onPress={handleAccept}
              disabled={actionLoading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.acceptBtnInner}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                      Accept Booking
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text, marginTop: 14,
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  identityCard: { backgroundColor: C.card, borderRadius: rs(16), padding: 14, borderWidth: 1, borderColor: C.border, ...cardShadow, marginBottom: 14 },
  identityBlock: { flexDirection: 'row', alignItems: 'center' },
  identityIcon: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    alignItems: 'center', justifyContent: 'center',
  },
  identityLabel: { fontSize: 10.5, color: C.muted, fontWeight: '700', letterSpacing: 1.4, marginBottom: 3 },
  identityName: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  identitySub: { fontSize: 13.5, color: C.muted, fontWeight: '600', marginTop: 3 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: TICKET_OVERLAP, paddingBottom: 40 },

  // ── Ticket summary card — status, created date, grand total ──
  ticketWrap: {
    marginTop: -TICKET_OVERLAP, backgroundColor: C.card,
    borderRadius: rs(16), overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    marginBottom: 12, ...cardShadow,
  },
  ticketRail: { height: 3, width: '100%' },
  ticketUpperStub: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  ticketIconBox: {
    width: rs(44), height: rs(44), borderRadius: rs(12),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  ticketLabel: { fontSize: 10.5, color: C.muted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  ticketNumber: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: -0.3 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 12, fontWeight: '700' },

  perforationRow: { height: 2, justifyContent: 'center' },
  dashLine: { marginHorizontal: 20, borderTopWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  notchLeft: { position: 'absolute', left: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },
  notchRight: { position: 'absolute', right: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },

  ticketLowerStub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 14 },
  moneyIconWrap: {
    width: rs(30), height: rs(30), borderRadius: rs(9),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  ticketAmountLabel: { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  ticketAmountVal: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '900', color: C.g700, letterSpacing: -0.4 },

  // ── Status progression strip ──
  statusStrip: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: C.card, borderRadius: rs(16), borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12, ...cardShadow,
  },
  statusStep: { alignItems: 'center', width: 66 },
  statusLine: { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11 },
  statusDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusDotDone: { backgroundColor: C.g500, borderColor: C.g500 },
  statusDotCurrent: { backgroundColor: C.amber, borderColor: C.amber },
  statusDotNum: { fontSize: 12, fontWeight: '800', color: C.muted },
  statusStepLbl: { fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center' },

  // ── Status banner ──
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4,
    ...cardShadow,
  },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusDate: { fontSize: 13, color: C.muted },

  // ── Cards ──
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  cardTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text },

  // Collapsible quote details
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHead0: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quoteBody: { marginTop: 14, gap: 10 },
  quoteSub: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 },
  quoteSubTitle: { fontSize: 12, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  quoteLiTxt: { flex: 1, fontSize: 13.5, color: C.sub, lineHeight: 18 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 12, paddingLeft: 7, borderRadius: 20 },
  pillPip: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillTxt: { fontSize: 13, fontWeight: '600' },
  termsCard: { backgroundColor: C.bg, borderRadius: rs(12), padding: 11 },
  termLine: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  termNum: { fontSize: 13, fontWeight: '800', color: C.text },
  termTxt: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },
  quoteNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.bg, borderRadius: rs(10), padding: 10, marginTop: 4 },
  quoteValid: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 6 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: rs(12), padding: 14,
    borderWidth: 1, borderColor: C.g100, marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '900', color: C.g700 },

  // Generic pay row (quote details + payment summary)
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  payLabel: { fontSize: 14, color: C.sub },
  payVal: { fontSize: 14, fontWeight: '600', color: C.text },

  // Customer grid
  customerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  infoBox: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoBoxFull: { minWidth: '100%' },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, color: C.muted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  quickActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  quickActionText: { fontSize: 14, fontWeight: '600' },

  // Vehicle box
  vehicleBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.bg, borderRadius: 12, marginBottom: 16 },
  vehicleIconWrap: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
  vehicleDetails: { fontSize: 14, color: C.muted },
  assignedBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: C.g50, borderRadius: 12, alignSelf: 'flex-start' },
  assignedText: { fontSize: 12, fontWeight: '600', color: C.g700 },

  // Trip info grid
  tripInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  tripInfoItem: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'flex-start' },
  tripInfoLabel: { fontSize: 12, color: C.muted, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  tripInfoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  // Rental period rail (pickup → drop-off)
  rentalRail: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.bg, borderRadius: rs(12), padding: 14,
    marginTop: 4,
  },
  rentalGutter: { alignItems: 'center', paddingTop: 3 },
  rentalDot: { width: 10, height: 10, borderRadius: 5 },
  rentalLine: { width: 2, flex: 1, minHeight: rs(28), backgroundColor: C.border, marginVertical: 4 },
  rentalLabel: { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 0.6 },
  rentalValue: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '700', color: C.text, marginTop: 2 },
  rentalTime: { fontSize: 13, color: C.sub, marginTop: 1 },

  // Payment summary
  paymentDetails: { gap: 2 },
  paymentLabelBold: { fontSize: 16, fontWeight: '700', color: C.text },
  paymentValueTotal: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.g700 },
  paymentDivider: { height: 1, backgroundColor: C.border, marginVertical: 6 },

  // Payment verified card
  verifiedCard: { backgroundColor: C.g50, borderColor: C.g100 },

  // Trip control / OTP
  messageBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  messageText: { fontSize: 14, fontWeight: '500' },
  tripControlDesc: { fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 18 },
  otpBtnWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  otpBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  otpButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  otpButtonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: C.g700 },
  otpButtonDanger: { backgroundColor: C.redL, borderWidth: 1.5, borderColor: '#FECACA' },
  otpButtonText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  otpSentBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    backgroundColor: C.g50, borderRadius: 12, borderWidth: 1, borderColor: C.g100, marginBottom: 16,
  },
  otpSentTitle: { fontSize: 14, fontWeight: '700', color: C.g700, marginBottom: 4 },
  otpSentDesc: { fontSize: 13, color: C.muted, lineHeight: 16 },
  otpInputSection: { marginBottom: 16 },
  otpInputLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  otpInputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 2, borderColor: C.g400, borderRadius: 12, backgroundColor: C.card,
  },
  otpInput: { flex: 1, fontSize: 20, fontWeight: '700', letterSpacing: 4, textAlign: 'center', color: C.text },

  // Completed card
  completedCard: { backgroundColor: C.greenL, borderColor: C.green },
  completedInner: { alignItems: 'center', paddingVertical: 12 },
  completedTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.green, marginTop: 12 },
  completedDesc: { fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 18, textAlign: 'center', marginTop: 8 },

  // Notes
  notesBox: { padding: 14, backgroundColor: C.amberL, borderRadius: 12 },
  notesText: { fontSize: 14, color: C.text, lineHeight: 20 },

  // Action bar
  actionBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: rs(12), borderWidth: 1,
  },
  rejectBtn: { backgroundColor: C.redL, borderColor: C.red },
  acceptBtnWrap: { flex: 1, borderRadius: rs(12), overflow: 'hidden' },
  acceptBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  actionBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800' },
});
