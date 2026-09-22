import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, TextInput,
  StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showConfirm, showSuccess } from '../../../../services/alertService';
import {
  getBookingById, acceptBooking, rejectBooking,
  generateTripOtp, verifyTripOtp, completeBooking,
  getBaseURL, getSessionToken,
} from '../../../api/client';
import { SC as T, G, rs, shade, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const { width: W } = Dimensions.get('window');

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, text: T.ink,
  sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange, orangeL: T.orangeL,
  indigo: T.indigo, indigoL: T.indigoLight,
  teal: T.teal, tealL: T.tintOcean,
  cyan: shade(T.ocean, 25), cyanL: T.tintOcean,
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: '#D97706', bg: '#FFFBEB', label: 'Awaiting Payment',  icon: 'time-outline'         },
  PAYMENT_VERIFIED: { color: '#059669', bg: '#ECFDF5', label: 'Payment Verified',  icon: 'checkmark-circle'     },
  PENDING_VENDOR:   { color: '#EA580C', bg: '#FFF7ED', label: 'Pending',           icon: 'hourglass-outline'    },
  BROADCASTED:      { color: '#2563EB', bg: '#EFF6FF', label: 'Open',              icon: 'radio-outline'        },
  ACCEPTED:         { color: '#059669', bg: '#ECFDF5', label: 'Accepted',          icon: 'checkmark-circle'     },
  CONFIRMED:        { color: '#047857', bg: '#D1FAE5', label: 'Confirmed',         icon: 'shield-checkmark'     },
  READY_FOR_PICKUP: { color: '#0891B2', bg: '#ECFEFF', label: 'Ready for Pickup',  icon: 'bicycle-outline'      },
  IN_PROGRESS:      { color: '#7C3AED', bg: '#F5F3FF', label: 'In Progress',       icon: 'navigate-circle'      },
  COMPLETED:        { color: '#047857', bg: '#D1FAE5', label: 'Completed',         icon: 'trophy-outline'       },
  CANCELLED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled',         icon: 'close-circle'         },
};

export default function BikeBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};

  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking,       setBooking]       = useState(null);
  const [otpInput,      setOtpInput]      = useState('');
  const [otpLoading,    setOtpLoading]    = useState(false);
  const [otpError,      setOtpError]      = useState(null);
  const [otpSuccess,    setOtpSuccess]    = useState(null);
  const [showQuote,     setShowQuote]     = useState(false);   // collapsible quote details

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('bike', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[BikeBookingDetail] Error:', error);
      showError('Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
  }, [fetchBooking]);

  const handleAccept = async () => {
    showConfirm('Accept Booking', 'Are you sure you want to accept this booking?', async () => {
      try {
        setActionLoading(true);
        await acceptBooking('bike', bookingId);
        await fetchBooking();
        showSuccess('Booking accepted successfully');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to accept booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Accept' });
  };

  const handleReject = async () => {
    showConfirm('Reject Booking', 'Are you sure you want to reject this booking?', async () => {
      try {
        setActionLoading(true);
        await rejectBooking('bike', bookingId, 'Vendor rejected');
        await fetchBooking();
        showSuccess('Booking rejected');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to reject booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Reject', destructive: true });
  };

  const handleCall = (phone, bookingType, bookingId) => {
    if (!phone) return;
    if (bookingType && bookingId) {
      (async () => {
        try {
          const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
          fetch(`${baseURL}/api/vendor/call-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-Token': token || '' },
            body: JSON.stringify({ bookingType, bookingId, source: 'app' }),
          }).catch(() => {});
        } catch (e) {}
      })();
    }
    Linking.openURL(`tel:${phone}`);
  };
  const handleWhatsApp  = (phone) => {
    if (phone) Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}`);
  };
  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId:     booking.id,
      customerName:  booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType:   'bike',
    });
  };

  const handleGenerateOtp = async () => {
    if (!booking) return;
    setOtpLoading(true); setOtpError(null); setOtpSuccess(null);
    try {
      await generateTripOtp('bike', booking.id);
      setOtpSuccess('OTP sent to customer successfully!');
      showSuccess('OTP sent to customer successfully!');
      await fetchBooking();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to generate OTP';
      setOtpError(msg); showError(msg);
    } finally { setOtpLoading(false); }
  };

  const handleStartTrip = async () => {
    if (!booking || !otpInput) { showError('Please enter OTP'); return; }
    if (otpInput.length !== 6) { showError('Please enter a valid 6-digit OTP'); return; }
    setOtpLoading(true); setOtpError(null);
    try {
      await verifyTripOtp('bike', booking.id, otpInput, 'start');
      setOtpSuccess('Trip started successfully!');
      showSuccess('Trip started successfully!');
      setOtpInput('');
      await fetchBooking();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to verify OTP';
      setOtpError(msg); showError(msg);
    } finally { setOtpLoading(false); }
  };

  const handleEndTrip = async () => {
    if (!booking) return;
    showConfirm('End Trip', 'Are you sure you want to complete this trip?', async () => {
      setOtpLoading(true); setOtpError(null);
      try {
        await completeBooking('bike', booking.id);
        setOtpSuccess('Trip completed successfully!');
        showSuccess('Trip completed successfully!');
        await fetchBooking();
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to complete trip';
        setOtpError(msg); showError(msg);
      } finally { setOtpLoading(false); }
    }, { confirmText: 'Complete' });
  };

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const canAccept = () => ['PENDING_VENDOR', 'BROADCASTED'].includes(booking?.status);
  const canReject = () => ['PENDING_VENDOR', 'BROADCASTED'].includes(booking?.status);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Booking summary card skeleton — now a body panel */}
          <View style={s.heroCard}>
            <View style={s.heroCardTop}>
              <View>
                <Bone w={70} h={9} r={3} style={{ marginBottom: 6 }} />
                <Bone w={110} h={22} r={5} />
              </View>
              <Bone w={80} h={22} r={11} />
            </View>
            <Bone w={140} h={10} r={4} />
          </View>

          {/* Status strip skeleton */}
          <View style={s.statusStrip}>
            {[0,1,2].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={s.statusLine} />}
                <View style={s.statusStep}>
                  <Bone w={24} h={24} r={12} />
                  <Bone w={44} h={9} r={3} style={{ marginTop: 6 }} />
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Customer card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={100} h={13} r={4} />
            </View>
            <View style={s.customerRow}>
              <Bone w={46} h={46} r={23} />
              <View style={{ flex: 1, gap: 6 }}>
                <Bone w={130} h={13} r={4} />
                <Bone w={90} h={10} r={4} />
              </View>
            </View>
            <View style={s.contactRow}>
              <Bone h={36} r={10} style={{ flex: 1 }} />
              <Bone h={36} r={10} style={{ flex: 1 }} />
              <Bone h={36} r={10} style={{ flex: 1 }} />
            </View>
          </View>

          {/* Vehicle & Trip card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={120} h={13} r={4} />
            </View>
            <Bone w="100%" h={72} r={14} />
          </View>

          {/* Payment Summary card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            <View style={s.payList}>
              {[0,1,2].map(i => (
                <View key={i} style={s.payRow}>
                  <Bone w={70} h={11} r={4} />
                  <Bone w={60} h={11} r={4} />
                </View>
              ))}
            </View>
            <Bone w="100%" h={48} r={12} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={56} color={C.muted} />
          <Text style={s.centeredTxt}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const showTripControl =
    booking.status === 'ACCEPTED' ||
    booking.status === 'CONFIRMED' ||
    booking.status === 'READY_FOR_PICKUP' ||
    booking.status === 'IN_PROGRESS' ||
    (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

      {/* ══ Hero Header ══════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />

        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={s.titleWrap}>
              <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
              <Text style={s.heroTitle}>Booking Detail</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ══ Body ═════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
        {/* Booking summary card — now a body panel, matches real layout */}
        <View style={s.heroCard}>
          <View style={s.heroCardTop}>
            <View>
              <Text style={s.heroLabel}>BOOKING #</Text>
              <Text style={s.heroNumber}>{booking.bookingNumber || String(booking.id).slice(-8)}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.color + '22', borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
          <View style={s.heroMeta}>
            <View style={s.heroMetaItem}>
              <Ionicons name="calendar-outline" size={11} color={C.muted} />
              <Text style={s.heroMetaTxt}>Created {formatDate(booking.createdAt)}</Text>
            </View>
            {booking.totalDays > 0 && (
              <View style={s.heroMetaItem}>
                <Ionicons name="time-outline" size={11} color={C.muted} />
                <Text style={s.heroMetaTxt}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Status progression: Quoted → Accepted → Pickup OTP ── */}
        {(() => {
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
            <View style={s.statusStrip}>
              {steps.map((stp, i) => (
                <React.Fragment key={stp.key}>
                  {i > 0 && <View style={[s.statusLine, steps[i - 1].done && { backgroundColor: C.g500 }]} />}
                  <View style={s.statusStep}>
                    <View style={[s.statusDot, stp.done && s.statusDotDone, stp.current && s.statusDotCurrent]}>
                      {stp.done
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <Text style={[s.statusDotNum, stp.current && { color: '#fff' }]}>{i + 1}</Text>}
                    </View>
                    <Text style={[s.statusStepLbl, (stp.done || stp.current) && { color: C.text, fontWeight: '700' }]}>{stp.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          );
        })()}

        {/* ── Quote Details (collapsible) ── */}
        <View style={s.card}>
          <TouchableOpacity style={s.quoteHead} activeOpacity={0.7} onPress={() => setShowQuote(v => !v)}>
            <View style={s.cardHead0}>
              <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
                <Ionicons name="document-text-outline" size={15} color={C.g700} />
              </View>
              <Text style={s.cardTitle}>Quote Details</Text>
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
              <View style={s.quoteBody}>
                {/* Pricing */}
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Vehicle</Text>
                  <Text style={s.payVal}>{q.vehicleName || booking.vehicleName || booking.requestedVehicleName || '—'}</Text>
                </View>
                {dailyRate ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Daily Rate × {booking.totalDays || 1}</Text>
                    <Text style={s.payVal}>{money(dailyRate)}</Text>
                  </View>
                ) : null}
                {deposit > 0 ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Security Deposit</Text>
                    <Text style={s.payVal}>{money(deposit)}</Text>
                  </View>
                ) : null}
                {q.helmetsIncluded ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Helmets Included</Text>
                    <Text style={s.payVal}>{q.helmetsIncluded}</Text>
                  </View>
                ) : null}
                {(q.unlimitedKm || q.kmLimitPerDay != null) ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>KM Limit</Text>
                    <Text style={s.payVal}>{q.unlimitedKm ? 'Unlimited' : `${q.kmLimitPerDay} km/day`}</Text>
                  </View>
                ) : null}
                {(!q.unlimitedKm && q.extraKmCharge) ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Extra KM Charge</Text>
                    <Text style={s.payVal}>₹{q.extraKmCharge}/km</Text>
                  </View>
                ) : null}
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total Quoted</Text>
                  <Text style={[s.totalVal, { fontSize: 18 }]}>{money(total)}</Text>
                </View>
                {advance > 0 ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Advance{q.advancePercent ? ` (${q.advancePercent}%)` : ''}</Text>
                    <Text style={s.payVal}>{money(advance)}</Text>
                  </View>
                ) : null}

                {/* Inclusions */}
                {inc.length > 0 && (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Inclusions</Text>
                    <View style={s.pillWrap}>
                      {inc.map((t, i) => (
                        <View key={i} style={[s.pill, { backgroundColor: C.g100 }]}>
                          <View style={[s.pillPip, { backgroundColor: C.g700 }]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                          <Text style={[s.pillTxt, { color: C.g700 }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Exclusions */}
                {exc.length > 0 && (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Exclusions</Text>
                    <View style={s.pillWrap}>
                      {exc.map((t, i) => (
                        <View key={i} style={[s.pill, { backgroundColor: C.redL }]}>
                          <View style={[s.pillPip, { backgroundColor: C.red }]}>
                            <Ionicons name="close" size={10} color="#fff" />
                          </View>
                          <Text style={[s.pillTxt, { color: C.red }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Terms */}
                {terms.length > 0 && (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Terms & Conditions</Text>
                    <View style={s.termsCard}>
                      {terms.map((t, i) => (
                        <View key={i} style={[s.termLine, i === terms.length - 1 && { marginBottom: 0 }]}>
                          <Text style={s.termNum}>{i + 1}.</Text>
                          <Text style={s.termTxt}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {/* Vendor note */}
                {q.vendorMessage ? (
                  <View style={s.quoteNote}>
                    <Ionicons name="chatbox-ellipses-outline" size={13} color={C.muted} />
                    <Text style={[s.quoteLiTxt, { flex: 1 }]}>{q.vendorMessage}</Text>
                  </View>
                ) : null}
                {q.validTill ? (
                  <Text style={s.quoteValid}>Valid until {formatDate(q.validTill)}</Text>
                ) : null}
              </View>
            );
          })()}
        </View>

        {/* Payment Verified Banner */}
        {booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking && (
          <View style={s.alertBanner}>
            <View style={[s.alertIconBox, { backgroundColor: C.g100 }]}>
              <Ionicons name="checkmark-circle" size={22} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Advance Payment Received!</Text>
              <Text style={s.alertDesc}>
                Prepare the bike and generate OTP when customer arrives for pickup.
              </Text>
            </View>
          </View>
        )}

        {/* ── Customer Card ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.blueL }]}>
              <Ionicons name="person" size={15} color={C.blue} />
            </View>
            <Text style={s.cardTitle}>Customer</Text>
          </View>

          <View style={s.customerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>
                {(booking.customerName || 'C')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName || 'Customer'}</Text>
              {booking.customerEmail ? (
                <Text style={s.customerEmail} numberOfLines={1}>{booking.customerEmail}</Text>
              ) : null}
            </View>
          </View>

          {/* Contact buttons */}
          <View style={s.contactRow}>
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                onPress={() => handleCall(booking.customerPhone, 'bike_booking', booking.id)}
              >
                <Ionicons name="call" size={15} color={C.g700} />
                <Text style={[s.contactTxt, { color: C.g700 }]}>Call</Text>
              </TouchableOpacity>
            ) : null}
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => handleWhatsApp(booking.customerPhone)}
              >
                <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
                <Text style={[s.contactTxt, { color: '#16A34A' }]}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[s.contactBtn, { flex: 1, backgroundColor: C.purpleL, borderColor: C.purple + '25' }]}
              onPress={handleChat}
            >
              <Ionicons name="chatbubble" size={15} color={C.purple} />
              <Text style={[s.contactTxt, { color: C.purple }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Vehicle & Trip Card ───────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.amberL }]}>
              <MaterialCommunityIcons name="motorbike" size={15} color={C.amber} />
            </View>
            <Text style={s.cardTitle}>Vehicle & Trip</Text>
          </View>

          {/* Vehicle box */}
          <View style={s.vehicleBox}>
            <View style={s.vehicleIconWrap}>
              <MaterialCommunityIcons name="motorbike" size={34} color={C.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName} numberOfLines={2}>
                {booking.requestedVehicleName || booking.vehicleName || 'Bike'}
              </Text>
              {(booking.requestedBrand || booking.vehicleCategory) ? (
                <Text style={s.vehicleSub}>{booking.requestedBrand || booking.vehicleCategory}</Text>
              ) : null}
              {booking.acceptedVehicleName ? (
                <View style={s.assignedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color={C.g600} />
                  <Text style={s.assignedTxt}>Assigned: {booking.acceptedVehicleName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Location + Duration */}
          <View style={s.tripMetaRow}>
            <View style={s.tripMetaItem}>
              <View style={[s.tripMetaIcon, { backgroundColor: C.indigoL }]}>
                <Ionicons name="location" size={14} color={C.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tripMetaLabel}>Location</Text>
                <Text style={s.tripMetaValue} numberOfLines={1}>
                  {booking.locationName || booking.pickupCity || 'Not specified'}
                </Text>
              </View>
            </View>
            {booking.totalDays ? (
              <View style={s.tripMetaItem}>
                <View style={[s.tripMetaIcon, { backgroundColor: C.purpleL }]}>
                  <Ionicons name="calendar" size={14} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripMetaLabel}>Duration</Text>
                  <Text style={s.tripMetaValue}>{booking.totalDays} Day{booking.totalDays > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Pickup / Dropoff dates */}
          <View style={s.dateRow}>
            <View style={[s.dateBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <View style={[s.dateDot, { backgroundColor: C.blue }]} />
              <Text style={[s.dateLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={s.dateVal}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime ? <Text style={s.dateTime}>{formatTime(booking.pickupTime)}</Text> : null}
            </View>
            {booking.dropDate ? (
              <View style={[s.dateBox, { backgroundColor: C.redL, borderColor: C.red + '25' }]}>
                <View style={[s.dateDot, { backgroundColor: C.red }]} />
                <Text style={[s.dateLabel, { color: C.red }]}>DROP-OFF</Text>
                <Text style={s.dateVal}>{formatDate(booking.dropDate)}</Text>
                {booking.dropTime ? <Text style={s.dateTime}>{formatTime(booking.dropTime)}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Payment Summary ───────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.indigoL }]}>
              <Ionicons name="card" size={15} color={C.indigo} />
            </View>
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>

          <View style={s.payList}>
            {booking.dailyRate ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Daily Rate</Text>
                <Text style={s.payVal}>₹{booking.dailyRate.toLocaleString()}</Text>
              </View>
            ) : null}
            {booking.totalDays ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Days</Text>
                <Text style={s.payVal}>{booking.totalDays}</Text>
              </View>
            ) : null}
            <View style={s.payRow}>
              <Text style={s.payLabel}>Subtotal</Text>
              <Text style={s.payVal}>₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}</Text>
            </View>
            {booking.securityDeposit > 0 ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Security Deposit</Text>
                <Text style={s.payVal}>₹{booking.securityDeposit.toLocaleString()}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Grand Total</Text>
            <Text style={s.totalVal}>₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}</Text>
          </View>

          {(booking.advancePaid || booking.paidAmount) > 0 ? (
            <View style={s.payList}>
              <View style={s.payRow}>
                <Text style={[s.payLabel, { color: C.g600 }]}>Advance Paid</Text>
                <Text style={[s.payVal, { color: C.g600, fontWeight: '700' }]}>
                  ₹{(booking.advancePaid || booking.paidAmount || 0).toLocaleString()}
                </Text>
              </View>
              <View style={s.payRow}>
                <Text style={[s.payLabel, { color: C.amber }]}>Balance Due</Text>
                <Text style={[s.payVal, { color: C.amber, fontWeight: '700' }]}>
                  ₹{((booking.totalAmount || 0) - (booking.advancePaid || booking.paidAmount || 0)).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Trip Control ─────────────────────────────────────────────── */}
        {showTripControl && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.purpleL }]}>
                <Ionicons name="key" size={15} color={C.purple} />
              </View>
              <Text style={s.cardTitle}>Trip Control</Text>
            </View>

            {otpError ? (
              <View style={[s.msgBox, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
                <Ionicons name="alert-circle" size={15} color={C.red} />
                <Text style={[s.msgTxt, { color: C.red }]}>{otpError}</Text>
              </View>
            ) : null}
            {otpSuccess ? (
              <View style={[s.msgBox, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
                <Ionicons name="checkmark-circle" size={15} color={C.g600} />
                <Text style={[s.msgTxt, { color: C.g700 }]}>{otpSuccess}</Text>
              </View>
            ) : null}

            {/* Generate OTP */}
            {(booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED' ||
              (booking.status === 'PAYMENT_VERIFIED' && booking.isOwnBooking)) && (
              <View>
                <Text style={s.tripDesc}>
                  {booking.status === 'PAYMENT_VERIFIED'
                    ? 'Advance payment received. Generate OTP when customer arrives for pickup.'
                    : 'When customer arrives, generate OTP to start the trip.'}
                </Text>
                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: C.purple }]}
                  onPress={handleGenerateOtp}
                  disabled={otpLoading}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="send" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>Generate & Send OTP to Customer</Text>
                      </>)}
                </TouchableOpacity>
              </View>
            )}

            {/* Enter OTP to start */}
            {booking.status === 'READY_FOR_PICKUP' && (
              <View>
                <View style={[s.infoAlert, { backgroundColor: C.blueL, borderColor: C.blue + '20' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={C.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoAlertTitle, { color: C.blue }]}>OTP sent to customer!</Text>
                    <Text style={s.infoAlertDesc}>Ask customer for the OTP shown on their booking page.</Text>
                  </View>
                </View>

                <Text style={s.otpLbl}>Enter OTP from Customer</Text>
                <View style={[s.otpInputWrap, otpInput.length === 6 && { borderColor: C.purple }]}>
                  <Icon name="key" size={17} color={otpInput.length === 6 ? C.purple : C.muted} />
                  <TextInput
                    style={s.otpInput}
                    value={otpInput}
                    onChangeText={(t) => setOtpInput(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    placeholderTextColor={C.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {otpInput.length === 6 && (
                    <Ionicons name="checkmark-circle" size={20} color={C.purple} />
                  )}
                </View>

                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: otpInput.length === 6 ? C.g600 : C.muted }]}
                  onPress={handleStartTrip}
                  disabled={otpLoading || otpInput.length !== 6}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="play-circle" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>Verify OTP & Start Trip</Text>
                      </>)}
                </TouchableOpacity>

                <TouchableOpacity style={s.ctaBtnOutline} onPress={handleGenerateOtp} disabled={otpLoading}>
                  <Icon name="refresh-cw" size={15} color={C.purple} />
                  <Text style={[s.ctaTxt, { color: C.purple }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* End trip */}
            {booking.status === 'IN_PROGRESS' && (
              <View>
                <View style={[s.infoAlert, { backgroundColor: C.purpleL, borderColor: C.purple + '20' }]}>
                  <MaterialCommunityIcons name="motorbike" size={20} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoAlertTitle, { color: C.purple }]}>Trip In Progress</Text>
                    <Text style={s.infoAlertDesc}>When customer returns the bike, complete the trip below.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.ctaBtn, { backgroundColor: C.red }]}
                  onPress={handleEndTrip}
                  disabled={otpLoading}
                >
                  {otpLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (<>
                        <Ionicons name="stop-circle" size={17} color="#fff" />
                        <Text style={s.ctaTxt}>End Trip & Complete Booking</Text>
                      </>)}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Completed ────────────────────────────────────────────────── */}
        {booking.status === 'COMPLETED' && (
          <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <LinearGradient colors={[C.g800, C.g500]} style={s.trophyRing}>
                <Ionicons name="trophy" size={36} color="#fff" />
              </LinearGradient>
              <Text style={s.completedTitle}>Trip Completed!</Text>
              <Text style={s.completedDesc}>This booking has been successfully completed.</Text>
            </View>
          </View>
        )}

        {/* ── Customer Notes ────────────────────────────────────────────── */}
        {booking.customerNotes ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.amberL }]}>
                <Ionicons name="chatbox-ellipses" size={15} color={C.amber} />
              </View>
              <Text style={s.cardTitle}>Customer Notes</Text>
            </View>
            <View style={s.notesBox}>
              <Text style={s.notesTxt}>{booking.customerNotes}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ══ Action Bar ═══════════════════════════════════════════════════════ */}
      {(canAccept() || canReject()) && (
        <View style={s.actionBar}>
          {canReject() && (
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={actionLoading}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <Text style={s.rejectTxt}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : (<>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={s.acceptTxt}>Accept Booking</Text>
                  </>)}
            </TouchableOpacity>
          )}
        </View>
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  centeredTxt: { fontSize: 14, color: C.muted },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  heroCard: { backgroundColor: C.card, borderRadius: rs(16), padding: 16, borderWidth: 1, borderColor: C.border, ...cardShadow, marginBottom: 14 },
  heroCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  heroLabel:  { fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroNumber: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 12, fontWeight: '700' },
  heroMeta:     { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt:  { fontSize: 12, color: C.muted, fontWeight: '500' },

  // ── Alert banner ──────────────────────────────────────────────────────────
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.g50, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.g400 + '50',
  },
  alertIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertTitle:   { fontSize: 14, fontWeight: '700', color: C.g700, marginBottom: 3 },
  alertDesc:    { fontSize: 13, color: C.sub, lineHeight: 17 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardHead0: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  // Status progression strip
  statusStrip: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 14 },
  statusStep:  { alignItems: 'center', width: 66 },
  statusLine:  { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11 },
  statusDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusDotDone:    { backgroundColor: C.g600, borderColor: C.g600 },
  statusDotCurrent: { backgroundColor: C.blue, borderColor: C.blue },
  statusDotNum:     { fontSize: 12, fontWeight: '800', color: C.muted },
  statusStepLbl:    { fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center' },

  // Collapsible quote details
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteBody: { marginTop: 14, gap: 10 },
  quoteSub:      { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 },
  quoteSubTitle: { fontSize: 12, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  quoteLiTxt:    { flex: 1, fontSize: 13.5, color: C.sub, lineHeight: 18 },
  pillWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 12, paddingLeft: 7, borderRadius: 20 },
  pillPip:       { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillTxt:       { fontSize: 13, fontWeight: '600' },
  termsCard:     { backgroundColor: C.bg, borderRadius: rs(12), padding: 11 },
  termLine:      { flexDirection: 'row', gap: 8, marginBottom: 7 },
  termNum:       { fontSize: 13, fontWeight: '800', color: C.text },
  termTxt:       { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },
  quoteNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.bg, borderRadius: rs(10), padding: 10, marginTop: 4 },
  quoteValid:    { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 6 },

  // ── Customer ──────────────────────────────────────────────────────────────
  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerEmail: { fontSize: 13, color: C.muted },

  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt: { fontSize: 13, fontWeight: '700' },

  // ── Vehicle ───────────────────────────────────────────────────────────────
  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, backgroundColor: C.amberL,
    borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.amber + '22',
  },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.amber + '28' },
  vehicleName:     { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 13, color: C.sub },
  assignedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7, alignSelf: 'flex-start', backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  assignedTxt:     { fontSize: 12, fontWeight: '600', color: C.g700 },

  tripMetaRow:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripMetaItem:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripMetaIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tripMetaLabel: { fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tripMetaValue: { fontSize: 14, fontWeight: '700', color: C.text },

  dateRow:  { flexDirection: 'row', gap: 10 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // ── Payment ───────────────────────────────────────────────────────────────
  payList: { gap: 10, marginBottom: 12 },
  payRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel:{ fontSize: 14, color: C.sub },
  payVal:  { fontSize: 14, fontWeight: '600', color: C.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.g100, marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal:   { fontFamily: DISPLAY, fontSize: 24, fontWeight: '900', color: C.g700 },

  // ── Trip Control ──────────────────────────────────────────────────────────
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  msgTxt: { fontSize: 13, fontWeight: '500', flex: 1 },
  tripDesc: { fontSize: 14, color: C.sub, marginBottom: 14, lineHeight: 19 },

  infoAlert:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  infoAlertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  infoAlertDesc:  { fontSize: 13, color: C.sub, lineHeight: 16 },

  otpLbl: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  otpInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 2, borderColor: C.border, borderRadius: 14, backgroundColor: C.bg, marginBottom: 14 },
  otpInput: { flex: 1, fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: C.text },

  ctaBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(14), marginBottom: 10 },
  ctaBtnOutline:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: rs(14), marginBottom: 10, borderWidth: 2, borderColor: C.purple, backgroundColor: 'transparent' },
  ctaTxt:       { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },

  // ── Completed ─────────────────────────────────────────────────────────────
  trophyRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc:  { fontSize: 14, color: C.sub, textAlign: 'center' },

  // ── Notes ─────────────────────────────────────────────────────────────────
  notesBox: { padding: 12, backgroundColor: C.amberL, borderRadius: 12, borderWidth: 1, borderColor: C.amber + '22' },
  notesTxt: { fontSize: 14, color: C.text, lineHeight: 20 },

  // ── Action Bar ────────────────────────────────────────────────────────────
  actionBar: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: rs(14), borderWidth: 2, borderColor: C.red, backgroundColor: C.redL },
  rejectTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.red },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: rs(14), backgroundColor: C.g600 },
  acceptTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
});
