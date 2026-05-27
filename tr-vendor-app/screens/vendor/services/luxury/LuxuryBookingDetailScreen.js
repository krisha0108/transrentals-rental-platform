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
import { showError, showConfirm, showSuccess } from '../../../../services/alertService';
import {
  getBookingById, acceptBooking, rejectBooking,
  assignOperator, getStaffDrivers,
  getBaseURL, getSessionToken,
} from '../../../api/client';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED', indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: C.amber,  bg: C.amberL,  label: 'Awaiting Payment',  icon: 'time-outline'                 },
  PAYMENT_SUBMITTED:{ color: C.orange, bg: C.orangeL, label: 'Payment Submitted', icon: 'card-outline'                 },
  ADVANCE_PAID:     { color: C.g600,   bg: C.g50,     label: 'Advance Paid',      icon: 'checkmark-circle-outline'     },
  PAYMENT_VERIFIED: { color: C.g600,   bg: C.g50,     label: 'Payment Verified',  icon: 'shield-checkmark-outline'     },
  CONFIRMED:        { color: C.g600,   bg: C.g50,     label: 'Confirmed',         icon: 'checkmark-done-circle-outline'},
  DRIVER_ASSIGNED:  { color: C.blue,   bg: C.blueL,   label: 'Driver Assigned',   icon: 'car-outline'                  },
  PENDING_VENDOR:   { color: C.amber,  bg: C.amberL,  label: 'Pending',           icon: 'hourglass-outline'            },
  BROADCASTED:      { color: C.blue,   bg: C.blueL,   label: 'Open',              icon: 'radio-outline'                },
  ACCEPTED:         { color: C.g600,   bg: C.g50,     label: 'Accepted',          icon: 'checkmark-circle'             },
  IN_PROGRESS:      { color: C.purple, bg: C.purpleL, label: 'In Progress',       icon: 'navigate-circle-outline'      },
  COMPLETED:        { color: C.muted,  bg: '#F8FAFC', label: 'Completed',         icon: 'trophy-outline'               },
  CANCELLED:        { color: C.red,    bg: C.redL,    label: 'Cancelled',         icon: 'close-circle-outline'         },
};

export default function LuxuryBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};

  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking,       setBooking]       = useState(null);
  const [showQuote,       setShowQuote]       = useState(false);   // collapsible quote details
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers,       setDrivers]       = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('luxury', bookingId);
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
        await acceptBooking('luxury', bookingId);
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
        await rejectBooking('luxury', bookingId, 'Vendor rejected');
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
  const handleWhatsApp = (phone) => {
    if (phone) Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}`);
  };
  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId:     booking.id,
      customerName:  booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
      serviceType:   'luxury',
    });
  };

  const canAssignDriver = () =>
    ['ADVANCE_PAID', 'CONFIRMED'].includes(booking?.status) && !booking?.driverName;

  const canChangeDriver = () =>
    ['CONFIRMED', 'DRIVER_ASSIGNED'].includes(booking?.status) && booking?.driverName;

  const canAccept = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canReject = () => ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);

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
      await assignOperator('luxury', bookingId, {
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

  const formatDate = (d) => {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  /* ─── Loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="car-sports" size={18} color={C.g400} />
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

  /* ─── Not found state ───────────────────────────────────────── */
  if (!booking) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.hero}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="car-sports" size={18} color={C.g400} />
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

  /* ─── Main render ───────────────────────────────────────────── */
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={[C.g900, C.g800, C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.deco1} />
        <View style={s.deco2} />

        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="car-sports" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Booking Detail</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Glassmorphic heroCard */}
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
              <MaterialCommunityIcons name="car-sports" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.heroMetaTxt}>Luxury Cars</Text>
            </View>
            <View style={s.heroMetaItem}>
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.heroMetaTxt}>Created {formatDate(booking.createdAt)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
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
            const total   = q.totalAmount ?? booking.totalAmount ?? booking.grandTotal;
            const advance = q.advanceAmount ?? booking.advanceAmount ?? booking.advancePaid ?? booking.paidAmount;
            const money = (v) => `₹${Number(v || 0).toLocaleString()}`;
            return (
              <View style={s.quoteBody}>
                {/* Vehicle */}
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Vehicle</Text>
                  <Text style={s.payVal}>{q.vehicleName || booking.vehicleName || booking.requestedVehicleName || '—'}</Text>
                </View>
                {q.vehicleCategory ? (
                  <View style={s.payRow}>
                    <Text style={s.payLabel}>Category</Text>
                    <Text style={s.payVal}>{q.vehicleCategory}</Text>
                  </View>
                ) : null}
                {/* Total */}
                <View style={s.payRow}>
                  <Text style={[s.payLabel, { fontWeight: '700', color: C.text }]}>Total Quoted</Text>
                  <Text style={[s.payVal, { color: C.g700 }]}>{money(total)}</Text>
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
                    {inc.map((t, i) => (
                      <View key={i} style={s.quoteLi}>
                        <Ionicons name="checkmark-circle" size={13} color={C.g600} />
                        <Text style={s.quoteLiTxt}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Exclusions */}
                {exc.length > 0 && (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Exclusions</Text>
                    {exc.map((t, i) => (
                      <View key={i} style={s.quoteLi}>
                        <Ionicons name="close-circle" size={13} color={C.red} />
                        <Text style={s.quoteLiTxt}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Terms */}
                {terms.length > 0 && (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Terms & Conditions</Text>
                    {terms.map((t, i) => (
                      <View key={i} style={s.quoteLi}>
                        <Text style={s.quoteBullet}>•</Text>
                        <Text style={s.quoteLiTxt}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Vendor note */}
                {q.vendorMessage ? (
                  <View style={s.quoteSub}>
                    <Text style={s.quoteSubTitle}>Your Note</Text>
                    <Text style={s.quoteLiTxt}>{q.vendorMessage}</Text>
                  </View>
                ) : null}
                {q.validTill ? (
                  <Text style={s.quoteValid}>Valid until {formatDate(q.validTill)}</Text>
                ) : null}
              </View>
            );
          })()}
        </View>

        {/* ── Customer card ── */}
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

          <View style={s.contactRow}>
            {booking.customerPhone ? (
              <TouchableOpacity
                style={[s.contactBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                onPress={() => handleCall(booking.customerPhone, 'luxury_booking', booking.id)}
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

        {/* ── Vehicle card ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="car-sports" size={15} color={C.g700} />
            </View>
            <Text style={s.cardTitle}>Vehicle</Text>
          </View>

          <View style={s.vehicleBox}>
            <View style={s.vehicleIconWrap}>
              <MaterialCommunityIcons name="car-sports" size={34} color={C.g700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName} numberOfLines={2}>
                {booking.vehicleName || booking.requestedVehicleName || 'Luxury Car'}
              </Text>
              {(booking.vehicleCategory || booking.carCategory || booking.carCategoryName) ? (
                <Text style={s.vehicleSub}>
                  {booking.vehicleCategory || booking.carCategory || booking.carCategoryName}
                </Text>
              ) : null}
              {booking.requestedBrand ? (
                <Text style={[s.vehicleSub, { marginTop: 2 }]}>{booking.requestedBrand}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Trip section ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.indigoL }]}>
              <Ionicons name="map" size={15} color={C.indigo} />
            </View>
            <Text style={s.cardTitle}>Trip Details</Text>
          </View>

          {(booking.tripType || booking.occasion) ? (
            <View style={s.tripMetaRow}>
              {booking.tripType ? (
                <View style={s.tripMetaItem}>
                  <View style={[s.tripMetaIcon, { backgroundColor: C.purpleL }]}>
                    <Ionicons name="navigate" size={14} color={C.purple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tripMetaLabel}>Trip Type</Text>
                    <Text style={s.tripMetaValue}>
                      {booking.tripType.charAt(0).toUpperCase() + booking.tripType.slice(1)}
                    </Text>
                  </View>
                </View>
              ) : null}
              {booking.occasion ? (
                <View style={s.tripMetaItem}>
                  <View style={[s.tripMetaIcon, { backgroundColor: C.amberL }]}>
                    <Ionicons name="star" size={14} color={C.amber} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tripMetaLabel}>Occasion</Text>
                    <Text style={s.tripMetaValue}>
                      {booking.occasion.charAt(0).toUpperCase() + booking.occasion.slice(1)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={s.tripLocRow}>
            <View style={s.tripLocItem}>
              <View style={[s.tripMetaIcon, { backgroundColor: C.indigoL }]}>
                <Ionicons name="location" size={14} color={C.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tripMetaLabel}>Pickup</Text>
                <Text style={s.tripMetaValue} numberOfLines={1}>
                  {booking.pickupCity || booking.locationName || 'Not specified'}
                </Text>
              </View>
            </View>
            {booking.dropCity ? (
              <View style={s.tripLocItem}>
                <View style={[s.tripMetaIcon, { backgroundColor: C.redL }]}>
                  <Ionicons name="location" size={14} color={C.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tripMetaLabel}>Drop</Text>
                  <Text style={s.tripMetaValue} numberOfLines={1}>{booking.dropCity}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={s.dateRow}>
            <View style={[s.dateBox, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
              <View style={[s.dateDot, { backgroundColor: C.blue }]} />
              <Text style={[s.dateLabel, { color: C.blue }]}>PICKUP</Text>
              <Text style={s.dateVal}>{formatDate(booking.pickupDate)}</Text>
              {booking.pickupTime ? <Text style={s.dateTime}>{formatTime(booking.pickupTime)}</Text> : null}
            </View>
            {(booking.returnDate || booking.dropDate) ? (
              <View style={[s.dateBox, { backgroundColor: C.redL, borderColor: C.red + '25' }]}>
                <View style={[s.dateDot, { backgroundColor: C.red }]} />
                <Text style={[s.dateLabel, { color: C.red }]}>RETURN</Text>
                <Text style={s.dateVal}>{formatDate(booking.returnDate || booking.dropDate)}</Text>
                {(booking.returnTime || booking.dropTime) ? (
                  <Text style={s.dateTime}>{formatTime(booking.returnTime || booking.dropTime)}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Requirements card ── */}
        {(booking.needChauffeur !== undefined || booking.needDecoration) ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
                <MaterialCommunityIcons name="shield-check" size={15} color={C.g700} />
              </View>
              <Text style={s.cardTitle}>Requirements</Text>
            </View>
            <View style={s.payList}>
              {booking.needChauffeur !== undefined ? (
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Chauffeur</Text>
                  <Text style={[s.payVal, { color: booking.needChauffeur ? C.g600 : C.muted }]}>
                    {booking.needChauffeur ? 'Required' : 'Not Required'}
                  </Text>
                </View>
              ) : null}
              {booking.needDecoration !== undefined ? (
                <View style={s.payRow}>
                  <Text style={s.payLabel}>Decoration</Text>
                  <Text style={[s.payVal, { color: booking.needDecoration ? C.purple : C.muted }]}>
                    {booking.needDecoration ? (booking.decorationType || 'Required') : 'Not Required'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Payment summary ── */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.indigoL }]}>
              <Ionicons name="card" size={15} color={C.indigo} />
            </View>
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>

          <View style={s.payList}>
            {booking.totalAmount ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Total Amount</Text>
                <Text style={s.payVal}>₹{(booking.totalAmount || 0).toLocaleString()}</Text>
              </View>
            ) : null}
            {(booking.advanceAmount || 0) > 0 ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Advance Required</Text>
                <Text style={s.payVal}>₹{(booking.advanceAmount || 0).toLocaleString()}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Grand Total</Text>
            <Text style={s.totalVal}>
              ₹{(booking.grandTotal || booking.totalAmount || 0).toLocaleString()}
            </Text>
          </View>

          {(booking.advancePaid || booking.paidAmount || 0) > 0 ? (
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
                  ₹{Math.max(0,
                    (booking.grandTotal || booking.totalAmount || 0) -
                    (booking.advancePaid || booking.paidAmount || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Assigned driver info ── */}
        {booking.driverName ? (
          <View style={[s.card, { backgroundColor: C.blueL, borderColor: C.blue + '25' }]}>
            <View style={s.driverCardHead}>
              <View style={s.cardHead}>
                <View style={[s.cardIcon, { backgroundColor: '#fff' }]}>
                  <Ionicons name="person" size={15} color={C.blue} />
                </View>
                <Text style={s.cardTitle}>Assigned Driver</Text>
              </View>
              {canChangeDriver() ? (
                <TouchableOpacity
                  style={s.changeDriverBtn}
                  onPress={handleAssignDriverPress}
                  disabled={actionLoading}
                >
                  <Icon name="edit-2" size={14} color={C.blue} />
                  <Text style={s.changeDriverTxt}>Change</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.driverRow}>
              <View style={s.driverAvatar}>
                <Ionicons name="person" size={22} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.driverName}>{booking.driverName}</Text>
                {booking.driverPhone ? (
                  <TouchableOpacity onPress={() => handleCall(booking.driverPhone)}>
                    <Text style={[s.driverPhone, { color: C.blue }]}>{booking.driverPhone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={[s.statusPill, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                <Ionicons name="checkmark-circle" size={12} color={C.g600} />
                <Text style={[s.statusPillTxt, { color: C.g600 }]}>Assigned</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Completed trophy ── */}
        {booking.status === 'COMPLETED' ? (
          <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g400 + '50' }]}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <LinearGradient colors={[C.g800, C.g500]} style={s.trophyRing}>
                <Ionicons name="trophy" size={36} color="#fff" />
              </LinearGradient>
              <Text style={s.completedTitle}>Booking Completed!</Text>
              <Text style={s.completedDesc}>This luxury booking has been successfully completed.</Text>
            </View>
          </View>
        ) : null}

        {/* ── Customer notes ── */}
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

      {/* ── Action bar: Assign Driver or Accept/Decline ── */}
      {canAssignDriver() ? (
        <View style={s.actionBar}>
          <TouchableOpacity
            style={[s.acceptBtn, { backgroundColor: C.indigo }]}
            onPress={handleAssignDriverPress}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : (<>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={s.acceptTxt}>Assign Driver</Text>
                </>)}
          </TouchableOpacity>
        </View>
      ) : (canAccept() || canReject()) ? (
        <View style={s.actionBar}>
          {canReject() ? (
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} disabled={actionLoading}>
              <Ionicons name="close-circle" size={18} color={C.red} />
              <Text style={s.rejectTxt}>Decline</Text>
            </TouchableOpacity>
          ) : null}
          {canAccept() ? (
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : (<>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={s.acceptTxt}>Accept Booking</Text>
                  </>)}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* ── Driver selection modal ── */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Modal header */}
            <View style={s.modalHead}>
              <LinearGradient colors={[C.g900, C.g700]} style={s.modalHeadGrad}>
                <View style={s.modalHeadRow}>
                  <View style={s.modalHeadLeft}>
                    <MaterialCommunityIcons name="car-sports" size={20} color={C.g400} />
                    <Text style={s.modalTitle}>
                      {booking?.driverName ? 'Change Driver' : 'Assign Driver'}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowDriverModal(false)}>
                    <Icon name="x" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={s.modalSub}>Select a driver for this luxury booking</Text>
              </LinearGradient>
            </View>

            {loadingDrivers ? (
              <View style={s.modalLoader}>
                <ActivityIndicator size="large" color={C.g600} />
                <Text style={s.modalLoaderTxt}>Loading drivers...</Text>
              </View>
            ) : drivers.length === 0 ? (
              <View style={s.modalEmpty}>
                <Ionicons name="people-outline" size={52} color={C.muted} />
                <Text style={s.modalEmptyTitle}>No drivers available</Text>
                <Text style={s.modalEmptySub}>Add drivers from Staff Management</Text>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => String(item.id || item._id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.driverItem} onPress={() => handleSelectDriver(item)}>
                    <View style={s.driverItemAvatar}>
                      <Ionicons name="person" size={22} color={C.g700} />
                    </View>
                    <View style={s.driverItemInfo}>
                      <Text style={s.driverItemName} numberOfLines={1}>{item.name}</Text>
                      {item.phone ? (
                        <Text style={s.driverItemPhone} numberOfLines={1}>{item.phone}</Text>
                      ) : null}
                      {item.licenseNumber ? (
                        <Text style={s.driverItemLic} numberOfLines={1}>
                          License: {item.licenseNumber}
                        </Text>
                      ) : null}
                    </View>
                    <Icon name="chevron-right" size={18} color={C.muted} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
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
  scrollContent: { padding: 16 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  centeredTxt: { fontSize: 14, color: C.muted },

  /* Hero */
  hero: { paddingHorizontal: 16, paddingBottom: 20, overflow: 'hidden' },
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
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  heroCard:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  heroCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  heroLabel:   { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroNumber:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt:{ fontSize: 11, fontWeight: '700' },
  heroMeta:    { flexDirection: 'row', gap: 16 },
  heroMetaItem:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  /* Cards */
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardHead0: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  /* Status progression strip */
  statusStrip: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 14 },
  statusStep:  { alignItems: 'center', width: 66 },
  statusLine:  { flex: 1, height: 2, backgroundColor: C.border, marginTop: 11 },
  statusDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statusDotDone:    { backgroundColor: C.g600, borderColor: C.g600 },
  statusDotCurrent: { backgroundColor: C.blue, borderColor: C.blue },
  statusDotNum:     { fontSize: 11, fontWeight: '800', color: C.muted },
  statusStepLbl:    { fontSize: 10, fontWeight: '600', color: C.muted, textAlign: 'center' },

  /* Collapsible quote details */
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteBody: { marginTop: 14, gap: 10 },
  quoteSub:      { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 7 },
  quoteSubTitle: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 2 },
  quoteLi:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  quoteLiTxt:    { flex: 1, fontSize: 12.5, color: C.sub, lineHeight: 18 },
  quoteBullet:   { fontSize: 13, color: C.muted, lineHeight: 18, width: 13, textAlign: 'center' },
  quoteValid:    { fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 6 },

  /* Customer */
  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerEmail: { fontSize: 12, color: C.muted },
  contactRow:    { flexDirection: 'row', gap: 8 },
  contactBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt:    { fontSize: 12, fontWeight: '700' },

  /* Vehicle */
  vehicleBox:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: C.g50, borderRadius: 14, borderWidth: 1, borderColor: C.g100 },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  vehicleName:     { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 12, color: C.sub },

  /* Trip */
  tripMetaRow:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripLocRow:    { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripMetaItem:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripLocItem:   { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripMetaIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tripMetaLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tripMetaValue: { fontSize: 13, fontWeight: '700', color: C.text },

  /* Dates */
  dateRow:  { flexDirection: 'row', gap: 10 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 11, color: C.sub, fontWeight: '500' },

  /* Payment */
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
  totalVal:   { fontSize: 24, fontWeight: '900', color: C.g700 },

  /* Driver section */
  driverCardHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
  driverRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar:    { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.blue + '30' },
  driverName:      { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  driverPhone:     { fontSize: 12, color: C.sub },
  changeDriverBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: C.blue + '30' },
  changeDriverTxt: { fontSize: 13, fontWeight: '600', color: C.blue },

  /* Completed */
  trophyRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc:  { fontSize: 13, color: C.sub, textAlign: 'center' },

  /* Notes */
  notesBox: { padding: 12, backgroundColor: C.amberL, borderRadius: 12, borderWidth: 1, borderColor: C.amber + '22' },
  notesTxt: { fontSize: 13, color: C.text, lineHeight: 20 },

  /* Action bar */
  actionBar: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 }, elevation: 10,
  },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: C.red, backgroundColor: C.redL },
  rejectTxt: { fontSize: 14, fontWeight: '700', color: C.red },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14, borderRadius: 14, backgroundColor: C.g600 },
  acceptTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Driver modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%', overflow: 'hidden' },
  modalHead:    { overflow: 'hidden' },
  modalHeadGrad:{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  modalHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modalHeadLeft:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalSub:     { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  modalCloseBtn:{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalLoader:  { padding: 48, alignItems: 'center', gap: 12 },
  modalLoaderTxt:{ fontSize: 14, color: C.muted },
  modalEmpty:   { padding: 48, alignItems: 'center', gap: 10 },
  modalEmptyTitle:{ fontSize: 16, fontWeight: '700', color: C.text },
  modalEmptySub:  { fontSize: 13, color: C.muted, textAlign: 'center' },
  driverItem:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  driverItemAvatar:{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  driverItemInfo: { flex: 1 },
  driverItemName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  driverItemPhone:{ fontSize: 12, color: C.sub, marginTop: 1 },
  driverItemLic:  { fontSize: 11, color: C.muted, marginTop: 1 },
});
