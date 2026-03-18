import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, TextInput,
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
} from '../../../api/client';

const { width: W } = Dimensions.get('window');

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
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

export default function BusBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};

  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [booking,        setBooking]        = useState(null);
  const [showDriverModal,setShowDriverModal] = useState(false);
  const [drivers,        setDrivers]        = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

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

  const handleCall     = (phone) => { if (phone) Linking.openURL(`tel:${phone}`); };
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
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.hero}>
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
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={s.hero}>
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
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
            <MaterialCommunityIcons name="bus" size={18} color={C.g400} />
            <Text style={s.heroTitle}>Booking Detail</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

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
              <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={s.heroMetaTxt}>Created {formatDate(booking.createdAt)}</Text>
            </View>
            {booking.tripType && (
              <View style={s.heroMetaItem}>
                <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.4)" />
                <Text style={s.heroMetaTxt}>{booking.tripType?.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />
        }
      >
        {/* Customer */}
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
                onPress={() => handleCall(booking.customerPhone)}
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

        {/* Vehicle & Trip */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="bus" size={15} color={C.g700} />
            </View>
            <Text style={s.cardTitle}>Vehicle & Trip</Text>
          </View>

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

          <View style={s.tripMetaRow}>
            <View style={s.tripMetaItem}>
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
              <View style={s.tripMetaItem}>
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
        </View>

        {/* Driver Assignment */}
        {booking.driverName ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
                <Icon name="user-check" size={15} color={C.g700} />
              </View>
              <Text style={s.cardTitle}>Assigned Driver</Text>
            </View>
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
                    style={[s.contactBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                    onPress={() => handleCall(booking.driverPhone)}
                  >
                    <Ionicons name="call" size={15} color={C.g700} />
                  </TouchableOpacity>
                ) : null}
                {canAssignDriver() ? (
                  <TouchableOpacity
                    style={[s.contactBtn, { backgroundColor: C.blueL, borderColor: C.blue + '30' }]}
                    onPress={handleAssignDriverPress}
                    disabled={actionLoading}
                  >
                    <Icon name="edit-2" size={15} color={C.blue} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        ) : canAssignDriver() ? (
          <TouchableOpacity
            style={s.assignBtn}
            onPress={handleAssignDriverPress}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : (<>
                  <Icon name="user-plus" size={18} color="#fff" />
                  <Text style={s.assignBtnText}>Assign Driver</Text>
                </>)}
          </TouchableOpacity>
        ) : null}

        {/* Trip Status */}
        {['VEHICLE_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.purpleL }]}>
                <Ionicons name="navigate" size={15} color={C.purple} />
              </View>
              <Text style={s.cardTitle}>Trip Status</Text>
            </View>
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
              <View style={[s.card, { backgroundColor: C.g50, borderColor: C.g400 + '50', marginBottom: 0, padding: 0 }]}>
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <LinearGradient colors={[C.g800, C.g500]} style={s.trophyRing}>
                    <Ionicons name="trophy" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={s.completedTitle}>Trip Completed!</Text>
                  <Text style={s.completedDesc}>This booking has been successfully completed.</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Summary */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardIcon, { backgroundColor: C.indigoL }]}>
              <Ionicons name="card" size={15} color={C.indigo} />
            </View>
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>

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
        </View>

        {/* Customer Notes */}
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

        {/* Quote Reference */}
        {booking.quoteRequest?.requestNumber ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardIcon, { backgroundColor: C.bg }]}>
                <Icon name="link" size={15} color={C.sub} />
              </View>
              <Text style={s.cardTitle}>Quote Reference</Text>
            </View>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Request #</Text>
              <Text style={s.payVal}>{booking.quoteRequest.requestNumber}</Text>
            </View>
            {booking.quoteRequest.requirements ? (
              <View style={s.notesBox}>
                <Text style={s.notesTxt}>{booking.quoteRequest.requirements}</Text>
              </View>
            ) : null}
          </View>
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

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
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
  scrollContent: { padding: 16 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  centeredTxt: { fontSize: 14, color: C.muted },

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

  heroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  heroCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  heroLabel:  { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroNumber: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroMeta:     { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  customerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:        { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue + '20' },
  avatarTxt:     { fontSize: 18, fontWeight: '800', color: C.blue },
  customerName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerEmail: { fontSize: 12, color: C.muted },

  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  contactTxt: { fontSize: 12, fontWeight: '700' },

  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, backgroundColor: C.g50,
    borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: C.g100,
  },
  vehicleIconWrap: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g100 },
  vehicleName:     { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
  vehicleSub:      { fontSize: 12, color: C.sub },
  assignedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7, alignSelf: 'flex-start', backgroundColor: C.g100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  assignedTxt:     { fontSize: 11, fontWeight: '600', color: C.g700 },

  tripMetaRow:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
  tripMetaItem:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tripMetaIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tripMetaLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tripMetaValue: { fontSize: 13, fontWeight: '700', color: C.text },

  dateRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateBox:  { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  dateDot:  { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  dateLabel:{ fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  dateVal:  { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateTime: { fontSize: 11, color: C.sub, fontWeight: '500' },

  passengerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  passengerText: { fontSize: 13, color: C.sub, fontWeight: '600' },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.g600, borderRadius: 14, paddingVertical: 15,
    marginBottom: 12,
  },
  assignBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

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
  totalVal:   { fontSize: 24, fontWeight: '900', color: C.g700 },

  notesBox: { padding: 12, backgroundColor: C.amberL, borderRadius: 12, borderWidth: 1, borderColor: C.amber + '22' },
  notesTxt: { fontSize: 13, color: C.text, lineHeight: 20 },

  trophyRing:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  completedTitle: { fontSize: 20, fontWeight: '800', color: C.g700, marginBottom: 6 },
  completedDesc:  { fontSize: 13, color: C.sub, textAlign: 'center' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 24,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: C.border, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: C.text },
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
