import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking,
  StatusBar, Dimensions, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showConfirm, showSuccess, showInfo } from '../../../../services/alertService';
import {
  getBookingById, acceptBooking, rejectBooking,
  assignOperator, getStaffDrivers,
  getBaseURL, getSessionToken,
} from '../../../api/client';
import { SC as T, G, rs, shade, cardShadow, SHEET_RADIUS } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';
import SheetHandle from '../../_shared/SheetHandle';

const { width: W } = Dimensions.get('window');

// How far the ticket summary card rides up over the hero's rounded bottom
// edge. Same technique/constant role as the bike/self-drive sibling detail
// screens' ticket card — the hero's own bottom padding is shortened by the
// same amount and the scroll content gets it back as paddingTop, so the gap
// stays the same, only the overlap changes.
const TICKET_OVERLAP = 40;

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
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: '#D97706', bg: '#FFFBEB', label: 'Awaiting Payment',  icon: 'time-outline'         },
  PAYMENT_SUBMITTED:{ color: '#D97706', bg: '#FFFBEB', label: 'Payment Submitted',  icon: 'hourglass-outline'    },
  ADVANCE_PAID:     { color: '#059669', bg: '#ECFDF5', label: 'Advance Paid',       icon: 'checkmark-circle'     },
  PAYMENT_VERIFIED: { color: '#059669', bg: '#ECFDF5', label: 'Payment Verified',   icon: 'checkmark-circle'     },
  PENDING_VENDOR:   { color: '#EA580C', bg: '#FFF7ED', label: 'Pending',            icon: 'hourglass-outline'    },
  BROADCASTED:      { color: '#2563EB', bg: '#EFF6FF', label: 'Open',               icon: 'radio-outline'        },
  ACCEPTED:         { color: '#059669', bg: '#ECFDF5', label: 'Accepted',           icon: 'checkmark-circle'     },
  VEHICLE_ASSIGNED: { color: '#2563EB', bg: '#EFF6FF', label: 'Vehicle Assigned',   icon: 'bus-outline'          },
  IN_PROGRESS:      { color: '#7C3AED', bg: '#F5F3FF', label: 'In Progress',        icon: 'navigate-circle'      },
  COMPLETED:        { color: '#047857', bg: '#D1FAE5', label: 'Completed',          icon: 'trophy-outline'       },
  CANCELLED:        { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled',          icon: 'close-circle'         },
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

export default function BusBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};

  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [booking,        setBooking]        = useState(null);
  const [showDriverModal,setShowDriverModal] = useState(false);
  const [drivers,        setDrivers]        = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showQuote,      setShowQuote]      = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('bus', bookingId);
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
        await acceptBooking('bus', bookingId);
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
        await rejectBooking('bus', bookingId, 'Vendor rejected');
        await fetchBooking();
        showInfo('Booking has been rejected', 'Rejected');
      } catch (error) {
        showError(error?.response?.data?.error || 'Failed to reject booking');
      } finally { setActionLoading(false); }
    }, { confirmText: 'Reject', destructive: true });
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
      const isChanging = !!booking?.driverName;
      setShowDriverModal(false);
      setActionLoading(true);
      await assignOperator('bus', bookingId, {
        driverName:  driver.name,
        driverPhone: driver.phone,
        driverPhoto: driver.photo || null,
      });
      await fetchBooking();
      showSuccess(isChanging ? 'Driver changed successfully' : 'Driver assigned successfully');
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to assign driver');
    } finally {
      setActionLoading(false);
    }
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
  const handleWhatsApp = (phone) => {
    if (phone) Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}`);
  };
  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId:     booking.id,
      customerName:  booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType:   'bus',
    });
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

  const canAccept      = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canReject      = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canAssignDriver = () => ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED', 'VEHICLE_ASSIGNED'].includes(booking?.status);

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <AnimatedOrb style={s.deco1} />
          <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="bus" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Booking Detail</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.centeredTxt}>Loading booking...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <AnimatedOrb style={s.deco1} />
          <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="bus" size={18} color={C.g400} />
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
  const balance = booking.balanceAmount ?? ((booking.totalAmount || 0) - (booking.advancePaid || 0));

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
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero ═════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />

        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="bus" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Booking Detail</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Identity block — booking # + customer, mirrors sibling detail screens */}
        <View style={s.identityBlock}>
          <View style={s.identityIcon}>
            <MaterialCommunityIcons name="bus" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12) }}>
            <Text style={s.identityLabel}>BOOKING #</Text>
            <Text style={s.identityName} numberOfLines={1}>{booking.bookingNumber || String(booking.id).slice(-8)}</Text>
            <Text style={s.identitySub} numberOfLines={1}>{booking.customerName || 'Customer'}</Text>
          </View>
        </View>

        {booking.tripType ? (
          <View style={s.tripTypeChip}>
            <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={s.tripTypeChipTxt}>{booking.tripType?.replace(/_/g, ' ')}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
        {/* ── Ticket summary — status, created date & grand total, floated over the hero ── */}
        <View style={s.ticketWrap}>
          <LinearGradient
            colors={[sc.color, shade(sc.color, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.ticketRail}
          />
          <View style={s.ticketUpperStub}>
            <View style={s.ticketIconBox}>
              <MaterialCommunityIcons name="bus" size={22} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.ticketLabel}>CREATED</Text>
              <Text style={s.ticketNumber} numberOfLines={1}>{formatDate(booking.createdAt)}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: sc.bg, borderColor: sc.color + '40' }]}>
              <Ionicons name={sc.icon} size={12} color={sc.color} />
              <Text style={[s.statusPillTxt, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Perforation — torn-ticket edge, echoes the bike/self-drive sibling ticket cards */}
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
              <Text style={s.ticketAmountLabel}>GRAND TOTAL</Text>
              <Text style={s.ticketAmountVal}>
                ₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString('en-IN')}
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
            const total   = q.totalAmount ?? booking.totalAmount;
            const advance = q.advanceAmount ?? booking.advanceAmount;
            const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
            return (
              <View style={s.quoteBody}>
                {/* Vehicle */}
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Vehicle</Text>
                  <Text style={s.payVal}>{q.vehicleName || booking.vehicleName || '—'}</Text>
                </View>
                {q.vehicleCategory ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Category</Text>
                    <Text style={s.payVal}>{q.vehicleCategory}</Text>
                  </View>
                ) : null}
                {/* Total */}
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total Quoted</Text>
                  <Text style={[s.totalVal, { fontSize: 18 }]}>{money(total)}</Text>
                </View>
                {/* Advance */}
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

        {/* ── Customer ── */}
        <Section icon={<Ionicons name="person" size={15} color={C.blue} />} title="Customer" iconBg={C.blueL}>
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

          <View style={s.contactRow}>
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                onPress={() => handleCall(booking.customerPhone, 'bus_booking', booking.id)}
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
        </Section>

        {/* ── Vehicle & Trip ── */}
        <Section icon={<MaterialCommunityIcons name="bus" size={15} color={C.g700} />} title="Vehicle & Trip" iconBg={C.g50}>
          <View style={s.vehicleBox}>
            <View style={s.vehicleIconWrap}>
              <MaterialCommunityIcons name="bus" size={34} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName} numberOfLines={2}>
                {booking.vehicleName || booking.vehicleCategory || 'Bus'}
              </Text>
              {booking.vehicleCategory && booking.vehicleName ? (
                <Text style={s.vehicleSub}>{booking.vehicleCategory}</Text>
              ) : null}
              {booking.vehicleNumber ? (
                <View style={s.assignedBadge}>
                  <Ionicons name="car-outline" size={11} color={C.g600} />
                  <Text style={s.assignedTxt}>{booking.vehicleNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Route — connected pickup → drop rail, mirrors the bike/self-drive siblings */}
          <View style={s.routeCard}>
            <View style={s.routeRail}>
              <View style={[s.routeDot, { backgroundColor: C.indigo }]} />
              {booking.dropCity ? <View style={s.routeLine} /> : null}
              {booking.dropCity ? <View style={[s.routeDot, { backgroundColor: C.red }]} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>PICKUP</Text>
              <Text style={s.routeValue} numberOfLines={1}>
                {booking.pickupCity || booking.locationName || 'Not specified'}
              </Text>
              {booking.dropCity ? (
                <>
                  <View style={{ height: rs(12) }} />
                  <Text style={s.routeLabel}>DROP</Text>
                  <Text style={s.routeValue} numberOfLines={1}>{booking.dropCity}</Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={s.dateRow}>
            <View style={[s.dateBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <View style={[s.dateDot, { backgroundColor: C.blue }]} />
              <Text style={[s.dateLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={s.dateVal}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime ? <Text style={s.dateTime}>{formatTime(booking.pickupTime)}</Text> : null}
            </View>
            {booking.returnDate ? (
              <View style={[s.dateBox, { backgroundColor: C.redL, borderColor: C.red + '25' }]}>
                <View style={[s.dateDot, { backgroundColor: C.red }]} />
                <Text style={[s.dateLabel, { color: C.red }]}>RETURN</Text>
                <Text style={s.dateVal}>{formatDate(booking.returnDate)}</Text>
                {booking.returnTime ? <Text style={s.dateTime}>{formatTime(booking.returnTime)}</Text> : null}
              </View>
            ) : null}
          </View>

          {booking.passengers ? (
            <View style={s.passengerChip}>
              <Ionicons name="people-outline" size={14} color={C.sub} />
              <Text style={s.passengerText}>{booking.passengers} Passengers</Text>
            </View>
          ) : null}
        </Section>

        {/* ── Driver Assignment ── */}
        {booking.driverName ? (
          <Section icon={<Icon name="user-check" size={15} color={C.g700} />} title="Assigned Driver" iconBg={C.g50}>
            <View style={s.customerRow}>
              <View style={[s.avatar, { backgroundColor: C.g50 }]}>
                <Icon name="user-check" size={20} color={C.g600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.customerName}>{booking.driverName}</Text>
                {booking.driverPhone ? (
                  <Text style={s.customerEmail}>{booking.driverPhone}</Text>
                ) : null}
              </View>
              <View style={s.contactRow}>
                {booking.driverPhone ? (
                  <TouchableOpacity
                    style={[s.inlineIconBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                    onPress={() => handleCall(booking.driverPhone)}
                  >
                    <Ionicons name="call" size={15} color={C.g700} />
                  </TouchableOpacity>
                ) : null}
                {canAssignDriver() ? (
                  <TouchableOpacity
                    style={[s.inlineIconBtn, { backgroundColor: C.blueL, borderColor: C.blue + '30' }]}
                    onPress={handleAssignDriverPress}
                    disabled={actionLoading}
                  >
                    <Icon name="edit-2" size={15} color={C.blue} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </Section>
        ) : canAssignDriver() ? (
          <TouchableOpacity
            style={s.assignBtnWrap}
            onPress={handleAssignDriverPress}
            disabled={actionLoading}
            activeOpacity={0.9}
          >
            <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.assignBtnInner}>
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : (<>
                    <Icon name="user-plus" size={18} color="#fff" />
                    <Text style={s.assignBtnText}>Assign Driver</Text>
                  </>)}
            </LinearGradient>
          </TouchableOpacity>
        ) : null}

        {/* ── Trip Status ── */}
        {['VEHICLE_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <Section icon={<Ionicons name="navigate" size={15} color={C.purple} />} title="Trip Status" iconBg={C.purpleL}>
            {booking.status === 'VEHICLE_ASSIGNED' && (
              <View style={s.tripStatusRow}>
                <View style={[s.tripStatusDot, { backgroundColor: C.blue }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.tripStatusText}>Vehicle assigned — ready to depart</Text>
                  {booking.driverName ? <Text style={s.tripStatusSub}>Driver: {booking.driverName}</Text> : null}
                </View>
              </View>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <View style={s.tripStatusRow}>
                <View style={[s.tripStatusDot, { backgroundColor: C.purple }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.tripStatusText}>Trip in progress</Text>
                  {booking.tripStartedAt ? (
                    <Text style={s.tripStatusSub}>Started: {new Date(booking.tripStartedAt).toLocaleString('en-IN')}</Text>
                  ) : null}
                </View>
              </View>
            )}
            {booking.status === 'COMPLETED' && (
              <View style={s.completedInner}>
                <LinearGradient colors={[C.g800, C.g500]} style={s.trophyRing}>
                  <Ionicons name="trophy" size={36} color="#fff" />
                </LinearGradient>
                <Text style={s.completedTitle}>Trip Completed!</Text>
                <Text style={s.completedDesc}>This booking has been successfully completed.</Text>
              </View>
            )}
          </Section>
        )}

        {/* ── Payment Summary ── */}
        <Section icon={<Ionicons name="card" size={15} color={C.indigo} />} title="Payment Summary" iconBg={C.indigoL}>
          <View style={s.payList}>
            {booking.baseAmount > 0 ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Base Amount</Text>
                <Text style={s.payVal}>₹{(booking.baseAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
            <View style={s.payRow}>
              <Text style={s.payLabel}>Total Amount</Text>
              <Text style={s.payVal}>₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            {booking.advanceAmount > 0 ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Advance Required</Text>
                <Text style={s.payVal}>₹{(booking.advanceAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Grand Total</Text>
            <Text style={s.totalVal}>₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
          </View>

          {(booking.advancePaid || 0) > 0 ? (
            <View style={s.payList}>
              <View style={s.payRow}>
                <Text style={[s.payLabel, { color: C.g600 }]}>Advance Paid</Text>
                <Text style={[s.payVal, { color: C.g600, fontWeight: '700' }]}>
                  ₹{(booking.advancePaid || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              {balance > 0 ? (
                <View style={s.payRow}>
                  <Text style={[s.payLabel, { color: C.amber }]}>Balance Due</Text>
                  <Text style={[s.payVal, { color: C.amber, fontWeight: '700' }]}>
                    ₹{balance.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Section>

        {/* ── Customer Notes ── */}
        {booking.customerNotes ? (
          <Section icon={<Ionicons name="chatbox-ellipses" size={15} color={C.amber} />} title="Customer Notes" iconBg={C.amberL}>
            <View style={s.notesBox}>
              <Text style={s.notesTxt}>{booking.customerNotes}</Text>
            </View>
          </Section>
        ) : null}

        {/* ── Quote Reference ── */}
        {booking.quoteRequest?.requestNumber ? (
          <Section icon={<Icon name="link" size={15} color={C.sub} />} title="Quote Reference" iconBg={C.bg}>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Request #</Text>
              <Text style={s.payVal}>{booking.quoteRequest.requestNumber}</Text>
            </View>
            {booking.quoteRequest.requirements ? (
              <View style={s.notesBox}>
                <Text style={s.notesTxt}>{booking.quoteRequest.requirements}</Text>
              </View>
            ) : null}
          </Section>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {(canAccept() || canReject()) && (
        <View style={s.actionBar}>
          {canReject() && (
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={actionLoading}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <Text style={s.rejectTxt}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity style={s.acceptBtnWrap} onPress={handleAccept} disabled={actionLoading} activeOpacity={0.9}>
              <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.acceptBtnInner}>
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : (<>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={s.acceptTxt}>Accept Booking</Text>
                    </>)}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <SheetHandle />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {booking?.driverName ? 'Change Driver' : 'Select Driver'}
              </Text>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setShowDriverModal(false)}
              >
                <Icon name="x" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>

            {loadingDrivers ? (
              <View style={s.modalLoader}>
                <ActivityIndicator size="large" color={C.g600} />
              </View>
            ) : drivers.length === 0 ? (
              <View style={s.emptyModal}>
                <Ionicons name="people-outline" size={44} color={C.muted} />
                <Text style={s.emptyModalTitle}>No drivers available</Text>
                <Text style={s.emptyModalSub}>Add drivers from Staff Management</Text>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.driverItem}
                    onPress={() => handleSelectDriver(item)}
                  >
                    <View style={s.driverAvatar}>
                      <Icon name="user" size={22} color={C.g700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.driverName}>{item.name}</Text>
                      {item.phone ? <Text style={s.driverSub}>{item.phone}</Text> : null}
                      {item.licenseNumber ? (
                        <Text style={s.driverSub}>License: {item.licenseNumber}</Text>
                      ) : null}
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
    paddingHorizontal: 16, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24),
  },
  deco1: {
    position: 'absolute', width: W * 0.55, height: W * 0.55,
    borderRadius: W * 0.275, backgroundColor: 'rgba(52,211,153,0.06)',
    top: -W * 0.18, right: -W * 0.1,
  },
  deco2: {
    position: 'absolute', width: W * 0.32, height: W * 0.32,
    borderRadius: W * 0.16, backgroundColor: 'rgba(16,185,129,0.05)',
    bottom: 0, left: W * 0.38,
  },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 16 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  identityBlock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  identityIcon: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  identityLabel: { fontSize: 9.5, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.4, marginBottom: 3 },
  identityName:  { fontFamily: DISPLAY, fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  identitySub:   { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 3 },

  tripTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    marginTop: 12, marginLeft: 2, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tripTypeChipTxt: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'capitalize' },

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
  ticketLabel: { fontSize: 9.5, color: C.muted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  ticketNumber: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '900', color: C.text, letterSpacing: -0.3 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },

  perforationRow: { height: 2, justifyContent: 'center' },
  dashLine: { marginHorizontal: 20, borderTopWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  notchLeft: { position: 'absolute', left: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },
  notchRight: { position: 'absolute', right: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },

  ticketLowerStub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 14 },
  moneyIconWrap: {
    width: rs(30), height: rs(30), borderRadius: rs(9),
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
  },
  ticketAmountLabel: { fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
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
  statusDotNum:     { fontSize: 11, fontWeight: '800', color: C.muted },
  statusStepLbl:    { fontSize: 10, fontWeight: '600', color: C.muted, textAlign: 'center' },

  // ── Cards ──
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardHead0: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  // Collapsible quote details
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteBody: { marginTop: 14, gap: 10 },
  quoteSub:      { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 },
  quoteSubTitle: { fontSize: 11, fontWeight: '800', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  quoteLiTxt:    { flex: 1, fontSize: 12.5, color: C.sub, lineHeight: 18 },
  pillWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingRight: 12, paddingLeft: 7, borderRadius: 20 },
  pillPip:       { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillTxt:       { fontSize: 12, fontWeight: '600' },
  termsCard:     { backgroundColor: C.bg, borderRadius: rs(12), padding: 11 },
  termLine:      { flexDirection: 'row', gap: 8, marginBottom: 7 },
  termNum:       { fontSize: 12, fontWeight: '800', color: C.text },
  termTxt:       { flex: 1, fontSize: 12, color: C.sub, lineHeight: 18 },
  quoteNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.bg, borderRadius: rs(10), padding: 10, marginTop: 4 },
  quoteValid:    { fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 6 },

  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerEmail: { fontSize: 12, color: C.muted },

  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt: { fontSize: 12, fontWeight: '700' },

  // Compact inline icon buttons — for a contact row nested inside a
  // horizontal avatar+name row (fixed-size squares, not flex:1 like
  // contactBtn above, which is only correct as its own full-width row).
  inlineIconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, backgroundColor: C.g50,
    borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  vehicleName:     { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 12, color: C.sub },
  assignedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7, alignSelf: 'flex-start', backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  assignedTxt:     { fontSize: 11, fontWeight: '600', color: C.g700 },

  // Route rail (pickup → drop), mirrors the bike/self-drive siblings
  routeCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.bg, borderRadius: rs(12), padding: 14,
    marginBottom: 14,
  },
  routeRail:  { alignItems: 'center', paddingTop: 3 },
  routeDot:   { width: 10, height: 10, borderRadius: 5 },
  routeLine:  { width: 2, flex: 1, minHeight: rs(28), backgroundColor: C.border, marginVertical: 4 },
  routeLabel: { fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.6 },
  routeValue: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '700', color: C.text, marginTop: 2 },

  dateRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 11, color: C.sub, fontWeight: '500' },

  passengerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  passengerText: { fontSize: 13, color: C.sub, fontWeight: '600' },

  assignBtnWrap: { borderRadius: rs(14), overflow: 'hidden', marginBottom: 12 },
  assignBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  assignBtnText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },

  tripStatusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tripStatusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  tripStatusText: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  tripStatusSub: { fontSize: 13, color: C.muted, marginBottom: 2 },

  payList: { gap: 10, marginBottom: 12 },
  payRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel:{ fontSize: 13, color: C.sub },
  payVal:  { fontSize: 13, fontWeight: '600', color: C.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.g50, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.g100, marginBottom: 10,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: C.g800 },
  totalVal:   { fontFamily: DISPLAY, fontSize: 24, fontWeight: '900', color: C.g700 },

  notesBox: { padding: 12, backgroundColor: C.amberL, borderRadius: 12, borderWidth: 1, borderColor: C.amber + '22' },
  notesTxt: { fontSize: 13, color: C.text, lineHeight: 20 },

  completedInner: { alignItems: 'center', paddingVertical: 6 },
  trophyRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc:  { fontSize: 13, color: C.sub, textAlign: 'center' },

  actionBar: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: rs(14), borderWidth: 2, borderColor: C.red, backgroundColor: C.redL },
  rejectTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.red },
  acceptBtnWrap: { flex: 2, borderRadius: rs(14), overflow: 'hidden' },
  acceptBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14 },
  acceptTxt: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '80%', paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle:    { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  modalLoader:   { padding: 44, alignItems: 'center' },
  emptyModal:    { padding: 44, alignItems: 'center', gap: 10 },
  emptyModalTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  emptyModalSub:   { fontSize: 14, color: C.muted, textAlign: 'center' },
  driverItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  driverName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  driverSub:  { fontSize: 13, color: C.muted },
});
