import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Modal, FlatList,
  StatusBar,
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

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
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

export default function PackersBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

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

  const GradientHeader = ({ title }) => (
    <LinearGradient colors={[C.g900, '#064E3B', C.g700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroPlain}>
      <View style={s.deco1} /><View style={s.deco2} />
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={s.titleWrap}>
          <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
          <Text style={s.heroTitle}>{title}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <SafeAreaView edges={['top']}>
          <GradientHeader title="Booking Detail" />
        </SafeAreaView>
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
        <SafeAreaView edges={['top']}>
          <GradientHeader title="Booking Detail" />
        </SafeAreaView>
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={56} color={C.muted} />
          <Text style={s.centeredTxt}>Booking not found</Text>
        </View>
      </View>
    );
  }

  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={[C.g900, '#064E3B', C.g700]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.deco1} /><View style={s.deco2} />

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
            {booking.shiftingType && (
              <View style={s.heroMetaItem}>
                <MaterialCommunityIcons name="home-switch-outline" size={11} color="rgba(255,255,255,0.4)" />
                <Text style={s.heroMetaTxt}>{booking.shiftingType}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.g400} colors={[C.g600]} />}
      >
        {/* Shifting Details */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIconBox, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g600} />
            </View>
            <Text style={s.cardTitle}>Packers & Movers</Text>
          </View>

          {booking.teamSize && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Team Size</Text>
              <Text style={s.infoValue}>{booking.teamSize} members</Text>
            </View>
          )}

          <View style={s.locationBlock}>
            <View style={s.locationRow}>
              <View style={[s.locationDot, { backgroundColor: C.g600 }]} />
              <View style={s.locationContent}>
                <Text style={s.locationLabel}>FROM</Text>
                <Text style={s.locationCity}>{booking.pickupCity || 'Not specified'}</Text>
                {booking.pickupAddress && <Text style={s.locationAddress}>{booking.pickupAddress}</Text>}
                {booking.pickupFloor && <Text style={s.locationSub}>Floor: {booking.pickupFloor}</Text>}
              </View>
            </View>
            <View style={s.locationLine} />
            {booking.dropCity && (
              <View style={s.locationRow}>
                <View style={[s.locationDot, { backgroundColor: C.red }]} />
                <View style={s.locationContent}>
                  <Text style={s.locationLabel}>TO</Text>
                  <Text style={s.locationCity}>{booking.dropCity}</Text>
                  {booking.dropAddress && <Text style={s.locationAddress}>{booking.dropAddress}</Text>}
                  {booking.dropFloor && <Text style={s.locationSub}>Floor: {booking.dropFloor}</Text>}
                </View>
              </View>
            )}
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
        </View>

        {/* Customer Info */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIconBox, { backgroundColor: C.blueL }]}>
              <Ionicons name="person-outline" size={18} color={C.blue} />
            </View>
            <Text style={s.cardTitle}>Customer</Text>
          </View>
          <View style={s.customerRow}>
            <View style={s.customerAvatar}>
              <Icon name="user" size={22} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName || 'Customer'}</Text>
            </View>
            {booking.customerPhone && (
              <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F0FDFA', marginRight: 6 }]} onPress={() => handleCustomerCall(booking.customerPhone, booking.id)}>
                <Ionicons name="call" size={18} color="#0D9488" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: C.blueL }]} onPress={handleChat}>
              <Icon name="message-circle" size={18} color={C.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIconBox, { backgroundColor: C.g50 }]}>
              <Ionicons name="receipt-outline" size={18} color={C.g600} />
            </View>
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>
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
        </View>

        {/* Assign Team Leader */}
        {canAssignDriver() && (
          <TouchableOpacity style={s.assignBtn} onPress={handleAssignDriverPress} disabled={actionLoading}>
            <Icon name="user-plus" size={20} color="#fff" />
            <Text style={s.assignBtnTxt}>Assign Team Leader</Text>
          </TouchableOpacity>
        )}

        {/* Team Leader Card */}
        {booking?.teamLeaderName && (
          <View style={[s.card, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <View style={s.cardTitleRowSpaced}>
              <View style={s.cardTitleRow}>
                <View style={[s.cardIconBox, { backgroundColor: C.card }]}>
                  <Ionicons name="people-outline" size={18} color={C.blue} />
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

        <View style={{ height: 90 }} />
      </ScrollView>

      {(canAccept() || canReject()) && (
        <View style={s.actionBar}>
          {canReject() && (
            <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={handleReject} disabled={actionLoading}>
              <Icon name="x" size={18} color={C.red} />
              <Text style={[s.actionBtnTxt, { color: C.red }]}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity style={[s.actionBtn, s.acceptBtn]} onPress={handleAccept} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Icon name="check-circle" size={18} color="#fff" />
                  <Text style={[s.actionBtnTxt, { color: '#fff' }]}>Accept Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showDriverModal} animationType="slide" transparent onRequestClose={() => setShowDriverModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
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
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centeredTxt: { fontSize: 15, color: C.muted, marginTop: 8 },

  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  heroPlain: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(52,211,153,0.08)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(52,211,153,0.06)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  heroCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: C.g400, letterSpacing: 1, marginBottom: 4 },
  heroNumber: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillTxt: { fontSize: 11, fontWeight: '700' },
  heroMeta: { flexDirection: 'row', gap: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitleRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 13, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right', flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },

  locationBlock: { marginTop: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  locationLine: { width: 2, height: 16, backgroundColor: C.border, marginLeft: 4, marginVertical: 2 },
  locationContent: { flex: 1 },
  locationLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  locationCity: { fontSize: 14, fontWeight: '600', color: C.text },
  locationAddress: { fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 17 },
  locationSub: { fontSize: 11, color: C.muted, marginTop: 2 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.blueL, alignItems: 'center', justifyContent: 'center' },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.card, borderRadius: 8 },
  changeBtnTxt: { fontSize: 13, fontWeight: '600', color: C.blue },

  statusBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  statusBannerTxt: { fontSize: 14, fontWeight: '600' },
  statusBannerSub: { fontSize: 12, color: C.sub, marginTop: 4 },

  assignBtn: { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginBottom: 12 },
  assignBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  actionBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  rejectBtn: { backgroundColor: C.card, borderColor: '#FECACA' },
  acceptBtn: { backgroundColor: C.g600, borderColor: C.g600 },
  actionBtnTxt: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  modalLoader: { padding: 40, alignItems: 'center' },
  modalEmpty: { padding: 40, alignItems: 'center', gap: 10 },
  modalEmptyTxt: { fontSize: 15, fontWeight: '600', color: C.text },
  modalEmptySub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  driverItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  driverPhone: { fontSize: 13, color: C.muted },
});
