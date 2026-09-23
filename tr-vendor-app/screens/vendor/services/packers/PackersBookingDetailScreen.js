import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Modal, FlatList,
  StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showConfirm, showSuccess } from '../../../../services/alertService';
import {
  getBookingById, acceptBooking, rejectBooking, assignOperator, getStaffDrivers,
  getBaseURL, getSessionToken,
} from '../../../api/client';
import { SC as T, G, rs, shade, cardShadow, SHEET_RADIUS } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);
import SheetHandle from '../../_shared/SheetHandle';

const { width: W } = Dimensions.get('window');

// How far the ticket summary card rides up over the hero's rounded bottom
// edge. Same technique/constant role as the bike/bus/luxury/equipment/truck/
// self-drive sibling detail screens' ticket card — the hero's own bottom
// padding is shortened by the same amount and the scroll content gets it
// back as paddingTop, so the gap stays the same, only the overlap changes.
const TICKET_OVERLAP = 40;

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: '#D97706', bg: '#FFFBEB', label: 'Awaiting Payment',       icon: 'time-outline'         },
  PAYMENT_SUBMITTED:{ color: '#EA580C', bg: '#FFF7ED', label: 'Payment Submitted',       icon: 'hourglass-outline'    },
  ADVANCE_PAID:     { color: '#059669', bg: '#ECFDF5', label: 'Advance Paid',            icon: 'checkmark-circle'     },
  PAYMENT_VERIFIED: { color: '#059669', bg: '#ECFDF5', label: 'Payment Verified',        icon: 'checkmark-circle'     },
  PENDING_VENDOR:   { color: '#EA580C', bg: '#FFF7ED', label: 'Pending',                 icon: 'hourglass-outline'    },
  BROADCASTED:      { color: '#2563EB', bg: '#EFF6FF', label: 'Open',                    icon: 'radio-outline'        },
  ACCEPTED:         { color: '#059669', bg: '#ECFDF5', label: 'Accepted',                icon: 'checkmark-circle'     },
  CONFIRMED:        { color: '#047857', bg: '#D1FAE5', label: 'Confirmed',               icon: 'shield-checkmark'     },
  VEHICLE_ASSIGNED: { color: '#2563EB', bg: '#EFF6FF', label: 'Team Assigned',           icon: 'people-outline'       },
  TEAM_ASSIGNED:    { color: '#2563EB', bg: '#EFF6FF', label: 'Team Assigned',           icon: 'people-outline'       },
  PACKING:          { color: '#7C3AED', bg: '#F5F3FF', label: 'Packing in Progress',     icon: 'cube-outline'         },
  LOADING:          { color: '#7C3AED', bg: '#F5F3FF', label: 'Loading in Progress',     icon: 'arrow-up-circle'      },
  IN_TRANSIT:       { color: '#7C3AED', bg: '#F5F3FF', label: 'In Transit',              icon: 'navigate-circle'      },
  UNLOADING:        { color: '#7C3AED', bg: '#F5F3FF', label: 'Unloading in Progress',   icon: 'arrow-down-circle'    },
  UNPACKING:        { color: '#7C3AED', bg: '#F5F3FF', label: 'Unpacking in Progress',   icon: 'cube-outline'         },
  IN_PROGRESS:      { color: '#7C3AED', bg: '#F5F3FF', label: 'In Progress',             icon: 'navigate-circle'      },
  COMPLETED:        { color: '#047857', bg: '#D1FAE5', label: 'Completed',               icon: 'trophy-outline'       },
  CANCELLED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled',               icon: 'close-circle'         },
};

/* ── Section wrapper — icon + title header inside one bordered card ────── */
function Section({ icon, title, iconBg, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={[s.cardIcon, iconBg && { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function PackersBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('packers', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
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
        await acceptBooking('packers', bookingId);
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
        await rejectBooking('packers', bookingId, 'Vendor rejected');
        await fetchBooking();
        showSuccess('Booking rejected');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to reject booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Reject', destructive: true });
  };

  const handleCall = (phone) => { if (phone) Linking.openURL(`tel:${phone}`); };

  const handleCustomerCall = (phone, bookingId) => {
    if (!phone) return;
    (async () => {
      try {
        const [baseURL, token] = await Promise.all([getBaseURL(), getSessionToken()]);
        fetch(`${baseURL}/api/vendor/call-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ bookingType: 'packers_booking', bookingId, source: 'app' }),
        }).catch(() => {});
      } catch {}
    })();
    Linking.openURL(`tel:${phone}`);
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId: booking.id,
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType: 'packers',
    });
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await getStaffDrivers();
      setDrivers(response?.drivers || response?.staff || []);
    } catch (error) {
      showError('Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignDriverPress = () => {
    setShowDriverModal(true);
    fetchDrivers();
  };

  const handleSelectDriver = async (driver) => {
    try {
      const isChanging = !!booking?.teamLeaderName;
      setShowDriverModal(false);
      setActionLoading(true);
      await assignOperator('packers', bookingId, {
        operatorName: driver.name,
        operatorPhone: driver.phone,
      });
      await fetchBooking();
      showSuccess(isChanging ? 'Team leader changed successfully' : 'Team leader assigned successfully');
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to assign team leader');
    } finally { setActionLoading(false); }
  };

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const canAccept = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canReject = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canAssignDriver = () => ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED', 'VEHICLE_ASSIGNED', 'TEAM_ASSIGNED'].includes(booking?.status) && !booking?.teamLeaderName;
  const canChangeDriver = () => ['VEHICLE_ASSIGNED', 'TEAM_ASSIGNED', 'ACCEPTED', 'PAYMENT_VERIFIED'].includes(booking?.status) && booking?.teamLeaderName;

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Identity card skeleton — now a body panel */}
          <View style={s.identityCard}>
            <View style={s.identityBlock}>
              <Bone w={rs(48)} h={rs(48)} r={rs(14)} />
              <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12), gap: 6 }}>
                <Bone w={70} h={9} r={3} />
                <Bone w={130} h={16} r={4} />
                <Bone w={100} h={11} r={4} />
              </View>
            </View>
          </View>

          {/* Ticket summary skeleton */}
          <View style={s.ticketWrap}>
            <View style={[s.ticketRail, { backgroundColor: '#DDE4EE' }]} />
            <View style={s.ticketUpperStub}>
              <Bone w={rs(44)} h={rs(44)} r={rs(12)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={60} h={9} r={3} />
                <Bone w={100} h={16} r={4} />
              </View>
              <Bone w={70} h={22} r={20} />
            </View>
            <View style={s.perforationRow}>
              <View style={s.dashLine} />
            </View>
            <View style={s.ticketLowerStub}>
              <Bone w={rs(30)} h={rs(30)} r={rs(9)} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={90} h={9} r={3} />
                <Bone w={120} h={16} r={4} />
              </View>
            </View>
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

          {/* Packers & Movers card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            <View style={s.routeCard}>
              <View style={s.routeRail}>
                <Bone w={10} h={10} r={5} />
                <View style={s.routeLine} />
                <Bone w={10} h={10} r={5} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Bone w={40} h={9} r={3} />
                <Bone w={100} h={14} r={4} style={{ marginBottom: rs(12) }} />
                <Bone w={30} h={9} r={3} />
                <Bone w={90} h={14} r={4} />
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Bone w={90} h={11} r={4} />
              <Bone w={80} h={12} r={4} />
            </View>
          </View>

          {/* Customer card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={100} h={13} r={4} />
            </View>
            <View style={s.customerRow}>
              <Bone w={46} h={46} r={23} />
              <Bone w={130} h={14} r={4} />
            </View>
            <View style={s.contactRow}>
              <Bone h={36} r={10} style={{ flex: 1 }} />
              <Bone h={36} r={10} style={{ flex: 1 }} />
            </View>
          </View>

          {/* Payment Summary card skeleton */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Bone w={34} h={34} r={10} />
              <Bone w={140} h={13} r={4} />
            </View>
            <View style={s.infoRow}>
              <Bone w={90} h={11} r={4} />
              <Bone w={90} h={18} r={4} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
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

  // Same "shifting type" meta the hero used to carry — now rides alongside
  // the created date on the ticket card, preserving the exact conditional.
  const shiftSuffix = booking.shiftingType ? ` • ${booking.shiftingType}` : '';

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero ═════════════════════════════════════════════════════════ */}
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
              <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
              <Text style={s.heroTitle}>Booking Detail</Text>
            </View>
            <TouchableOpacity style={s.backBtn} onPress={handleChat}>
              <Icon name="message-circle" size={18} color={C.g400} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
      >
        {/* Identity card — booking # + customer, now a body panel */}
        <View style={s.identityCard}>
          <View style={s.identityBlock}>
            <View style={s.identityIcon}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12) }}>
              <Text style={s.identityLabel}>BOOKING #</Text>
              <Text style={s.identityName} numberOfLines={1}>{booking.bookingNumber || String(booking.id).slice(-8)}</Text>
              <Text style={s.identitySub} numberOfLines={1}>{booking.customerName || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* ── Ticket summary — status, created date & total, floated over the hero ── */}
        <View style={s.ticketWrap}>
          <LinearGradient
            colors={[sc.color, shade(sc.color, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.ticketRail}
          />
          <View style={s.ticketUpperStub}>
            <View style={s.ticketIconBox}>
              <Ionicons name="calendar-outline" size={20} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.ticketLabel}>CREATED</Text>
              <Text style={s.ticketNumber} numberOfLines={1}>{formatDate(booking.createdAt)}{shiftSuffix}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.bg, borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Perforation — torn-ticket edge, echoes the bike/bus/luxury/equipment/truck/self-drive sibling ticket cards */}
          <View style={s.perforationRow}>
            <View style={s.notchLeft} />
            <View style={s.dashLine} />
            <View style={s.notchRight} />
          </View>

          <View style={s.ticketLowerStub}>
            <View style={s.moneyIconWrap}>
              <Ionicons name="cash" size={16} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ticketAmountLabel}>TOTAL AMOUNT</Text>
              <Text style={s.ticketAmountVal}>
                ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status progression stepper ── */}
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
            const total   = q.totalAmount ?? booking.totalAmount ?? booking.amount;
            const advance = q.advanceAmount ?? booking.advancePaid ?? booking.paidAmount;
            const money = (v) => `₹${Number(v || 0).toLocaleString()}`;
            return (
              <View style={s.quoteBody}>
                {/* Pricing */}
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total</Text>
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
                {q.validTill ? (
                  <Text style={s.quoteValid}>Valid until {formatDate(q.validTill)}</Text>
                ) : null}
              </View>
            );
          })()}
        </View>

        {/* ── Packers & Movers ── */}
        <Section icon={<MaterialCommunityIcons name="truck-delivery" size={15} color={C.g700} />} title="Packers & Movers" iconBg={C.g50}>
          {booking.teamSize && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Team Size</Text>
              <Text style={s.infoValue}>{booking.teamSize} members</Text>
            </View>
          )}

          {/* Route — connected from → to rail, mirrors the bike/bus/luxury/equipment/truck/self-drive siblings */}
          <View style={s.routeCard}>
            <View style={s.routeRail}>
              <View style={[s.routeDot, { backgroundColor: C.g600 }]} />
              {booking.dropCity && <View style={s.routeLine} />}
              {booking.dropCity && <View style={[s.routeDot, { backgroundColor: C.red }]} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>FROM</Text>
              <Text style={s.routeValue} numberOfLines={1}>{booking.pickupCity || 'Not specified'}</Text>
              {booking.pickupAddress && <Text style={s.routeAddress}>{booking.pickupAddress}</Text>}
              {booking.pickupFloor && <Text style={s.routeSub}>Floor: {booking.pickupFloor}</Text>}
              {booking.dropCity && (
                <>
                  <View style={{ height: rs(12) }} />
                  <Text style={s.routeLabel}>TO</Text>
                  <Text style={s.routeValue} numberOfLines={1}>{booking.dropCity}</Text>
                  {booking.dropAddress && <Text style={s.routeAddress}>{booking.dropAddress}</Text>}
                  {booking.dropFloor && <Text style={s.routeSub}>Floor: {booking.dropFloor}</Text>}
                </>
              )}
            </View>
          </View>

          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Scheduled Date</Text>
            <Text style={s.infoValue}>{formatDate(booking.scheduledDate)}</Text>
          </View>
          {booking.scheduledTime && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Scheduled Time</Text>
              <Text style={s.infoValue}>{booking.scheduledTime}</Text>
            </View>
          )}
        </Section>

        {/* ── Customer ── */}
        <Section icon={<Ionicons name="person-outline" size={18} color={C.blue} />} title="Customer" iconBg={C.blueL}>
          <View style={s.customerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{(booking.customerName || 'C')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName || 'Customer'}</Text>
            </View>
          </View>

          <View style={s.contactRow}>
            {booking.customerPhone && (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
                onPress={() => handleCustomerCall(booking.customerPhone, booking.id)}
              >
                <Ionicons name="call" size={15} color="#0D9488" />
                <Text style={[s.contactTxt, { color: '#0D9488' }]}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.contactBtn, { flex: 1, backgroundColor: C.blueL, borderColor: C.blue + '25' }]}
              onPress={handleChat}
            >
              <Icon name="message-circle" size={15} color={C.blue} />
              <Text style={[s.contactTxt, { color: C.blue }]}>Chat</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Payment Summary ── */}
        <Section icon={<Ionicons name="receipt-outline" size={18} color={C.g600} />} title="Payment Summary" iconBg={C.g50}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Total Amount</Text>
            <Text style={[s.infoValue, { fontSize: 18, color: C.g700 }]}>
              ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
            </Text>
          </View>
          {(booking.advancePaid || booking.paidAmount) > 0 && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Advance Paid</Text>
              <Text style={[s.infoValue, { color: C.g600 }]}>
                ₹{(booking.advancePaid || booking.paidAmount || 0).toLocaleString()}
              </Text>
            </View>
          )}
          {(booking.totalAmount > (booking.advancePaid || booking.paidAmount || 0)) && (
            <>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Text style={[s.infoLabel, { fontWeight: '700', color: C.text }]}>Balance Due</Text>
                <Text style={[s.infoValue, { color: C.amber }]}>
                  ₹{((booking.totalAmount || 0) - (booking.advancePaid || booking.paidAmount || 0)).toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </Section>

        {/* Assign Team Leader */}
        {canAssignDriver() && (
          <TouchableOpacity style={s.assignBtnWrap} onPress={handleAssignDriverPress} disabled={actionLoading} activeOpacity={0.9}>
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.assignBtnInner}>
              <Icon name="user-plus" size={18} color="#fff" />
              <Text style={s.assignBtnTxt}>Assign Team Leader</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Team Leader Card */}
        {booking?.teamLeaderName && (
          <View style={[s.card, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <View style={s.cardHeadSpaced}>
              <View style={s.cardHead0}>
                <View style={[s.cardIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="people-outline" size={15} color={C.blue} />
                </View>
                <Text style={s.cardTitle}>Team Leader</Text>
              </View>
              {canChangeDriver() && (
                <TouchableOpacity style={s.changeBtn} onPress={handleAssignDriverPress} disabled={actionLoading}>
                  <Icon name="edit-2" size={14} color={C.blue} />
                  <Text style={s.changeBtnTxt}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoValue}>{booking.teamLeaderName}</Text>
            </View>
            {booking.teamLeaderPhone && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Phone</Text>
                <TouchableOpacity onPress={() => handleCall(booking.teamLeaderPhone)}>
                  <Text style={[s.infoValue, { color: C.blue }]}>{booking.teamLeaderPhone}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Packing Status Banners */}
        {['VEHICLE_ASSIGNED', 'TEAM_ASSIGNED'].includes(booking?.status) && booking?.teamLeaderName && (
          <View style={[s.statusBanner, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <Ionicons name="people-outline" size={20} color={C.blue} />
            <Text style={[s.statusBannerTxt, { color: C.blue }]}>Team assigned, ready to start</Text>
          </View>
        )}
        {booking?.status === 'PACKING' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="package" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>Packing in progress</Text>
              {booking.packingStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.packingStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'LOADING' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="upload" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>Loading in progress</Text>
              {booking.loadingStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.loadingStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'IN_TRANSIT' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="truck" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>In transit</Text>
              {booking.transitStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.transitStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'UNLOADING' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="download" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>Unloading in progress</Text>
              {booking.unloadingStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.unloadingStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'UNPACKING' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="package" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>Unpacking in progress</Text>
              {booking.unpackingStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.unpackingStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'IN_PROGRESS' && (
          <View style={[s.statusBanner, { backgroundColor: C.purpleL, borderColor: '#DDD6FE' }]}>
            <Icon name="navigation" size={20} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.purple }]}>Service in progress</Text>
              {booking.tripStartedAt && <Text style={s.statusBannerSub}>Started: {new Date(booking.tripStartedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}
        {booking?.status === 'COMPLETED' && (
          <View style={[s.statusBanner, { backgroundColor: C.g50, borderColor: C.g100 }]}>
            <Icon name="check-circle" size={20} color={C.g600} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTxt, { color: C.g700 }]}>Service completed</Text>
              {booking.completedAt && <Text style={s.statusBannerSub}>Completed: {new Date(booking.completedAt).toLocaleString('en-IN')}</Text>}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {(canAccept() || canReject()) && (
        <View style={s.actionBar}>
          {canReject() && (
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={actionLoading}>
              <Icon name="x" size={18} color={C.red} />
              <Text style={s.rejectTxt}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity style={s.acceptBtnWrap} onPress={handleAccept} disabled={actionLoading} activeOpacity={0.9}>
              <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.acceptBtnInner}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Icon name="check-circle" size={18} color="#fff" />
                    <Text style={s.acceptTxt}>Accept Booking</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showDriverModal} animationType="slide" transparent onRequestClose={() => setShowDriverModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <SheetHandle />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{booking?.teamLeaderName ? 'Change Team Leader' : 'Select Team Leader'}</Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)} style={s.modalClose}>
                <Icon name="x" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            {loadingDrivers ? (
              <View style={s.modalLoader}>
                <ActivityIndicator size="large" color={C.g600} />
              </View>
            ) : drivers.length === 0 ? (
              <View style={s.modalEmpty}>
                <Icon name="users" size={48} color={C.muted} />
                <Text style={s.modalEmptyTxt}>No team leaders available</Text>
                <Text style={s.modalEmptySub}>Add staff from Staff Management</Text>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.driverItem} onPress={() => handleSelectDriver(item)}>
                    <View style={s.driverAvatar}>
                      <Icon name="user" size={22} color={C.g600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.driverName}>{item.name}</Text>
                      {item.phone && <Text style={s.driverPhone}>{item.phone}</Text>}
                    </View>
                    <Icon name="chevron-right" size={18} color={C.muted} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: TICKET_OVERLAP, paddingBottom: 40 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  centeredTxt: { fontSize: 14, color: C.muted },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
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
  identityName:  { fontFamily: DISPLAY, fontSize: 19, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  identitySub:   { fontSize: 13.5, color: C.muted, fontWeight: '600', marginTop: 3 },

  // ── Ticket summary card — status, created date, total amount ──
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
  statusStep:  { alignItems: 'center', width: 66 },
  statusLine:  { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11 },
  statusDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusDotDone:    { backgroundColor: C.g600, borderColor: C.g600 },
  statusDotCurrent: { backgroundColor: C.blue, borderColor: C.blue },
  statusDotNum:     { fontSize: 12, fontWeight: '800', color: C.muted },
  statusStepLbl:    { fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center' },

  // ── Cards ──
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardHead0:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeadSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 14, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right', flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },

  // Collapsible quote details
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteBody: { marginTop: 14, gap: 10 },
  quoteSub:      { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 },
  quoteSubTitle: { fontSize: 12, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  pillWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 12, paddingLeft: 7, borderRadius: 20 },
  pillPip:       { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillTxt:       { fontSize: 13, fontWeight: '600' },
  termsCard:     { backgroundColor: C.bg, borderRadius: rs(12), padding: 11 },
  termLine:      { flexDirection: 'row', gap: 8, marginBottom: 7 },
  termNum:       { fontSize: 13, fontWeight: '800', color: C.text },
  termTxt:       { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },
  quoteValid:    { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 6 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: rs(12), padding: 14,
    borderWidth: 1, borderColor: C.g100, marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal:   { fontFamily: DISPLAY, fontSize: 18, fontWeight: '900', color: C.g700 },
  payRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel:      { fontSize: 14, color: C.sub },
  payVal:        { fontSize: 14, fontWeight: '600', color: C.text },

  // Route rail (from → to), mirrors the bike/bus/luxury/equipment/truck/self-drive siblings
  routeCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.bg, borderRadius: rs(12), padding: 14,
    marginBottom: 14,
  },
  routeRail:    { alignItems: 'center', paddingTop: 3 },
  routeDot:     { width: 10, height: 10, borderRadius: 5 },
  routeLine:    { width: 2, flex: 1, minHeight: rs(28), backgroundColor: C.border, marginVertical: 4 },
  routeLabel:   { fontSize: 11, color: C.muted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  routeValue:   { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '700', color: C.text, marginTop: 2 },
  routeAddress: { fontSize: 13, color: C.sub, marginTop: 3, lineHeight: 17 },
  routeSub:     { fontSize: 12, color: C.muted, marginTop: 2 },

  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text },

  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt: { fontSize: 13, fontWeight: '700' },

  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.card, borderRadius: 8 },
  changeBtnTxt: { fontSize: 14, fontWeight: '600', color: C.blue },

  statusBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    borderRadius: rs(14), borderWidth: 1, marginBottom: 12,
  },
  statusBannerTxt: { fontSize: 14, fontWeight: '600' },
  statusBannerSub: { fontSize: 13, color: C.sub, marginTop: 4 },

  // Gradient-primary CTA (Assign Team Leader)
  assignBtnWrap:  { borderRadius: rs(14), overflow: 'hidden', marginBottom: 12 },
  assignBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  assignBtnTxt:   { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },

  actionBar: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  // Tonal-destructive CTA (Decline)
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: rs(14), borderWidth: 2, borderColor: C.red, backgroundColor: C.redL },
  rejectTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.red },
  // Gradient-primary CTA (Accept)
  acceptBtnWrap:  { flex: 2, borderRadius: rs(14), overflow: 'hidden' },
  acceptBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14 },
  acceptTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, maxHeight: '80%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  modalLoader: { padding: 40, alignItems: 'center' },
  modalEmpty: { padding: 40, alignItems: 'center', gap: 10 },
  modalEmptyTxt: { fontSize: 15, fontWeight: '600', color: C.text },
  modalEmptySub: { fontSize: 14, color: C.muted, textAlign: 'center' },
  driverItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  driverPhone: { fontSize: 14, color: C.muted },
});
