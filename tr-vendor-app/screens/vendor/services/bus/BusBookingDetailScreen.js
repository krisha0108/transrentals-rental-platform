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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getBookingById,
  acceptBooking,
  rejectBooking,
  assignOperator,
  getStaffDrivers,
} from '../../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  subtext: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  brand: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  amber: '#F59E0B',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { color: '#F59E0B', bg: '#FEF3C7', label: 'Awaiting Payment' },
  PAYMENT_SUBMITTED:{ color: '#F59E0B', bg: '#FEF3C7', label: 'Payment Submitted' },
  ADVANCE_PAID:     { color: '#10B981', bg: '#D1FAE5', label: 'Advance Paid' },
  PAYMENT_VERIFIED: { color: '#10B981', bg: '#D1FAE5', label: 'Payment Verified' },
  PENDING_VENDOR:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' },
  BROADCASTED:      { color: '#3B82F6', bg: '#DBEAFE', label: 'Open' },
  ACCEPTED:         { color: '#10B981', bg: '#DCFCE7', label: 'Accepted' },
  VEHICLE_ASSIGNED: { color: '#3B82F6', bg: '#DBEAFE', label: 'Vehicle Assigned' },
  IN_PROGRESS:      { color: '#8B5CF6', bg: '#F3E8FF', label: 'In Progress' },
  COMPLETED:        { color: '#059669', bg: '#ECFDF5', label: 'Completed' },
  CANCELLED:        { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled' },
};

const PAYMENT_STATUS_LABEL = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

// ── Small reusable row ──────────────────────────────────────────
function InfoRow({ label, value, valueColor, icon }) {
  if (!value && value !== 0) return null;
  return (
    <View style={s.infoRow}>
      {icon && <Icon name={icon} size={13} color={C.muted} style={{ marginTop: 1 }} />}
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// ── Section card wrapper ────────────────────────────────────────
function SectionCard({ title, icon, iconColor, children, accentColor }) {
  return (
    <View style={[s.card, accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null]}>
      {title && (
        <View style={s.cardHeader}>
          {icon && <Icon name={icon} size={16} color={iconColor || C.brand} />}
          <Text style={s.cardTitle}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

export default function BusBookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [booking, setBooking]           = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers]           = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getBookingById('bus', bookingId);
      setBooking(response?.booking || response);
    } catch (error) {
      console.error('[BusBookingDetail] Error:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const handleAccept = () => {
    Alert.alert('Accept Booking', 'Are you sure you want to accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setActionLoading(true);
            await acceptBooking('bus', bookingId);
            await fetchBooking();
            Alert.alert('Success', 'Booking accepted successfully');
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.error || 'Failed to accept booking');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await rejectBooking('bus', bookingId, 'Vendor rejected');
            await fetchBooking();
            Alert.alert('Rejected', 'Booking has been rejected');
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await getStaffDrivers();
      setDrivers(response?.drivers || response?.staff || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load drivers');
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
        driverName: driver.name,
        driverPhone: driver.phone,
        driverPhoto: driver.photo || null,
      });
      await fetchBooking();
      Alert.alert('Success', isChanging ? 'Driver changed successfully' : 'Driver assigned successfully');
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to assign driver');
    } finally {
      setActionLoading(false);
    }
  };

  const canAccept = () =>
    ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canReject = () =>
    ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'].includes(booking?.status);
  const canAssignDriver = () =>
    ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED', 'VEHICLE_ASSIGNED'].includes(booking?.status);

  // ── Loading / empty states ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.emptyContainer}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={s.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
  const balance = booking.balanceAmount ?? ((booking.totalAmount || 0) - (booking.advancePaid || 0));

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          #{booking.bookingNumber || bookingId}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Status banner ── */}
        <View style={[s.statusBanner, { backgroundColor: statusConf.bg, borderColor: statusConf.color + '40' }]}>
          <View style={[s.statusPill, { backgroundColor: statusConf.color }]}>
            <Text style={s.statusPillText}>{statusConf.label}</Text>
          </View>
          <View style={s.statusMeta}>
            <Text style={s.statusMetaText}>Booking #{booking.bookingNumber}</Text>
            <Text style={s.statusMetaText}>Created {formatDate(booking.createdAt)}</Text>
          </View>
          {booking.paymentStatus && (
            <View style={s.paymentStatusChip}>
              <Icon name="credit-card" size={12} color={C.subtext} />
              <Text style={s.paymentStatusText}>
                Payment: {PAYMENT_STATUS_LABEL[booking.paymentStatus] || booking.paymentStatus}
              </Text>
            </View>
          )}
        </View>

        {/* ── 2. Vehicle Info ── */}
        <SectionCard title="Vehicle Info" icon="truck" accentColor={C.brand}>
          <View style={s.vehicleHeader}>
            <View style={s.vehicleIconBox}>
              <MaterialCommunityIcons name="bus" size={28} color={C.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.vehicleName}>{booking.vehicleName || booking.vehicleCategory || 'Bus'}</Text>
              {booking.vehicleCategory && booking.vehicleName && (
                <Text style={s.vehicleCategory}>{booking.vehicleCategory}</Text>
              )}
            </View>
          </View>
          <View style={s.divider} />
          <InfoRow label="Vehicle Model"  value={booking.vehicleModel} />
          <InfoRow label="Vehicle Number" value={booking.vehicleNumber} />
          <InfoRow label="Trip Type"      value={booking.tripType?.replace(/_/g, ' ')} />
          {booking.passengers && (
            <InfoRow label="Passengers" value={`${booking.passengers} persons`} icon="users" />
          )}
        </SectionCard>

        {/* ── 3. Trip Details ── */}
        <SectionCard title="Trip Details" icon="map" accentColor={C.green}>
          {/* Timeline-style route */}
          <View style={s.timeline}>
            <View style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, { backgroundColor: C.green }]} />
                <View style={s.timelineConnector} />
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineLabel}>PICKUP</Text>
                <Text style={s.timelineCity}>{booking.pickupCity || '--'}</Text>
                {booking.pickupAddress && (
                  <Text style={s.timelineAddress}>{booking.pickupAddress}</Text>
                )}
                <Text style={s.timelineDateTime}>
                  {formatDate(booking.pickupDate)}
                  {booking.pickupTime ? `  •  ${formatTime(booking.pickupTime)}` : ''}
                </Text>
              </View>
            </View>

            <View style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, { backgroundColor: C.red }]} />
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineLabel}>DROP</Text>
                <Text style={s.timelineCity}>{booking.dropCity || 'Local'}</Text>
                {booking.dropAddress && (
                  <Text style={s.timelineAddress}>{booking.dropAddress}</Text>
                )}
                {booking.returnDate && (
                  <Text style={s.timelineDateTime}>
                    {formatDate(booking.returnDate)}
                    {booking.returnTime ? `  •  ${formatTime(booking.returnTime)}` : ''}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.metaGrid}>
            {booking.tripDays && (
              <View style={s.metaItem}>
                <Icon name="clock" size={14} color={C.muted} />
                <Text style={s.metaLabel}>Duration</Text>
                <Text style={s.metaValue}>{booking.tripDays} days</Text>
              </View>
            )}
            {booking.passengers && (
              <View style={s.metaItem}>
                <Icon name="users" size={14} color={C.muted} />
                <Text style={s.metaLabel}>Passengers</Text>
                <Text style={s.metaValue}>{booking.passengers}</Text>
              </View>
            )}
          </View>

          {booking.routeDetails && (
            <View style={s.noteBox}>
              <Icon name="navigation" size={14} color={C.subtext} />
              <Text style={s.noteText}>{booking.routeDetails}</Text>
            </View>
          )}
        </SectionCard>

        {/* ── 4. Customer Info ── */}
        <SectionCard title="Customer" icon="user" accentColor={C.purple}>
          <View style={s.customerRow}>
            <View style={s.avatar}>
              <Icon name="user" size={20} color={C.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.customerName}>{booking.customerName || 'Customer'}</Text>
              {booking.customerEmail && (
                <Text style={s.customerSub}>{booking.customerEmail}</Text>
              )}
            </View>
            <View style={s.customerActions}>
              <TouchableOpacity
                style={[s.iconBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={() => navigation.navigate('ChatScreen', {
                  bookingId: booking.id,
                  customerName: booking.customerName,
                  bookingNumber: booking.bookingNumber || booking.id,
                })}
              >
                <Icon name="message-circle" size={17} color={C.brand} />
              </TouchableOpacity>
            </View>
          </View>
        </SectionCard>

        {/* ── 5. Payment Summary ── */}
        <SectionCard title="Payment Summary" icon="credit-card" accentColor={C.orange}>
          {booking.baseAmount > 0 && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Base Amount</Text>
              <Text style={s.payValue}>₹{(booking.baseAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
          )}
          <View style={s.payRow}>
            <Text style={[s.payLabel, { fontWeight: '600' }]}>Total Amount</Text>
            <Text style={[s.payValue, { fontWeight: '800', fontSize: 17 }]}>
              ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          {booking.advanceAmount > 0 && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Advance Required</Text>
              <Text style={s.payValue}>₹{(booking.advanceAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
          )}
          {booking.advancePaid > 0 && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Advance Paid</Text>
              <Text style={[s.payValue, { color: C.green }]}>
                ₹{(booking.advancePaid || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {balance > 0 && (
            <>
              <View style={s.divider} />
              <View style={s.payRow}>
                <Text style={[s.payLabel, { fontWeight: '600', color: C.amber }]}>Balance Due</Text>
                <Text style={[s.payValue, { color: C.amber, fontWeight: '800' }]}>
                  ₹{balance.toLocaleString('en-IN')}
                </Text>
              </View>
            </>
          )}
        </SectionCard>

        {/* ── 6. Driver / Vehicle Assignment ── */}
        {booking.driverName ? (
          <SectionCard title="Assigned Driver" icon="user-check" accentColor={C.green}>
            <View style={s.driverRow}>
              <View style={[s.avatar, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="user-check" size={20} color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.customerName}>{booking.driverName}</Text>
                {booking.driverPhone && (
                  <Text style={s.customerSub}>{booking.driverPhone}</Text>
                )}
              </View>
              <View style={s.customerActions}>
                {booking.driverPhone && (
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: '#DCFCE7' }]}
                    onPress={() => Linking.openURL(`tel:${booking.driverPhone}`)}
                  >
                    <Icon name="phone" size={17} color={C.green} />
                  </TouchableOpacity>
                )}
                {canAssignDriver() && (
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: '#DBEAFE' }]}
                    onPress={handleAssignDriverPress}
                    disabled={actionLoading}
                  >
                    <Icon name="edit-2" size={17} color={C.brand} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SectionCard>
        ) : canAssignDriver() ? (
          <TouchableOpacity
            style={s.assignBtn}
            onPress={handleAssignDriverPress}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Icon name="user-plus" size={18} color="#fff" />
                  <Text style={s.assignBtnText}>Assign Driver</Text>
                </>
            }
          </TouchableOpacity>
        ) : null}

        {/* ── 7. Trip Status ── */}
        {['VEHICLE_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
          <SectionCard title="Trip Status" icon="activity" accentColor={C.purple}>
            {booking.status === 'VEHICLE_ASSIGNED' && (
              <View style={s.tripStatusRow}>
                <View style={[s.tripStatusDot, { backgroundColor: C.brand }]} />
                <View>
                  <Text style={s.tripStatusText}>Vehicle assigned — ready to depart</Text>
                  {booking.driverName && (
                    <Text style={s.tripStatusSub}>Driver: {booking.driverName}</Text>
                  )}
                </View>
              </View>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <View style={s.tripStatusRow}>
                <View style={[s.tripStatusDot, { backgroundColor: C.purple }]} />
                <View>
                  <Text style={s.tripStatusText}>Trip in progress</Text>
                  {booking.tripStartedAt && (
                    <Text style={s.tripStatusSub}>Started: {formatDateTime(booking.tripStartedAt)}</Text>
                  )}
                </View>
              </View>
            )}
            {booking.status === 'COMPLETED' && (
              <View style={s.tripStatusRow}>
                <View style={[s.tripStatusDot, { backgroundColor: C.green }]} />
                <View>
                  <Text style={s.tripStatusText}>Trip completed</Text>
                  {booking.tripStartedAt && (
                    <Text style={s.tripStatusSub}>Started: {formatDateTime(booking.tripStartedAt)}</Text>
                  )}
                  {booking.tripEndedAt && (
                    <Text style={s.tripStatusSub}>Ended: {formatDateTime(booking.tripEndedAt)}</Text>
                  )}
                  {booking.rating && (
                    <Text style={s.tripStatusSub}>Customer Rating: {'★'.repeat(booking.rating)} ({booking.rating}/5)</Text>
                  )}
                </View>
              </View>
            )}
          </SectionCard>
        )}

        {/* ── 8. Customer Notes ── */}
        {booking.customerNotes && (
          <SectionCard title="Customer Notes" icon="file-text" accentColor={C.amber}>
            <View style={s.noteBox}>
              <Text style={s.noteText}>{booking.customerNotes}</Text>
            </View>
          </SectionCard>
        )}

        {/* ── 9. Quote Request Reference ── */}
        {booking.quoteRequest?.requestNumber && (
          <SectionCard title="Quote Reference" icon="link">
            <InfoRow label="Request #" value={booking.quoteRequest.requestNumber} />
            {booking.quoteRequest.requirements && (
              <View style={[s.noteBox, { marginTop: 8 }]}>
                <Text style={s.noteText}>{booking.quoteRequest.requirements}</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* ── 10. Accept / Reject actions ── */}
        {(canAccept() || canReject()) && (
          <View style={s.actionsRow}>
            {canReject() && (
              <TouchableOpacity
                style={[s.actionBtn, s.rejectBtn]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                <Icon name="x" size={18} color={C.red} />
                <Text style={[s.actionBtnText, { color: C.red }]}>Reject</Text>
              </TouchableOpacity>
            )}
            {canAccept() && (
              <TouchableOpacity
                style={[s.actionBtn, s.acceptBtn]}
                onPress={handleAccept}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Icon name="check" size={18} color="#fff" />
                      <Text style={[s.actionBtnText, { color: '#fff' }]}>Accept</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Driver Selection Modal ── */}
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
              <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                <Icon name="x" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {loadingDrivers ? (
              <View style={s.modalLoader}>
                <ActivityIndicator size="large" color={C.brand} />
              </View>
            ) : drivers.length === 0 ? (
              <View style={s.emptyModal}>
                <Icon name="users" size={44} color={C.muted} />
                <Text style={s.emptyModalTitle}>No drivers available</Text>
                <Text style={s.emptyModalSub}>Add drivers from Staff Management</Text>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.driverItem}
                    onPress={() => handleSelectDriver(item)}
                  >
                    <View style={s.driverAvatar}>
                      <Icon name="user" size={22} color={C.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.driverName}>{item.name}</Text>
                      {item.phone && <Text style={s.driverSub}>{item.phone}</Text>}
                      {item.licenseNumber && (
                        <Text style={s.driverSub}>License: {item.licenseNumber}</Text>
                      )}
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: C.muted, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Status banner
  statusBanner: {
    borderRadius: 14, padding: 16,
    borderWidth: 1, gap: 8,
  },
  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  statusMetaText: { fontSize: 12, color: C.subtext, fontWeight: '500' },
  paymentStatusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  paymentStatusText: { fontSize: 11, color: C.subtext, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },

  // Vehicle
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  vehicleIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  vehicleName: { fontSize: 17, fontWeight: '700', color: C.text },
  vehicleCategory: { fontSize: 13, color: C.muted, marginTop: 2 },

  // InfoRow
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, gap: 6 },
  infoLabel: { fontSize: 13, color: C.muted, width: 110 },
  infoValue: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1 },

  // Timeline
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 14, paddingTop: 3 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineConnector: { flex: 1, width: 2, backgroundColor: C.border, marginTop: 4, marginBottom: 4, minHeight: 28 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  timelineCity: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 2 },
  timelineAddress: { fontSize: 12, color: C.subtext, marginBottom: 3 },
  timelineDateTime: { fontSize: 12, color: C.brand, fontWeight: '600' },

  // Meta grid
  metaGrid: { flexDirection: 'row', gap: 10 },
  metaItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, gap: 3 },
  metaLabel: { fontSize: 11, color: C.muted, fontWeight: '600' },
  metaValue: { fontSize: 14, fontWeight: '700', color: C.text },

  // Note box
  noteBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10,
  },
  noteText: { fontSize: 13, color: C.subtext, flex: 1, lineHeight: 18 },

  // Customer
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  customerName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  customerSub: { fontSize: 13, color: C.muted },
  customerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  // Payment
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  payLabel: { fontSize: 14, color: C.muted },
  payValue: { fontSize: 15, fontWeight: '700', color: C.text },

  // Driver
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Assign button
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.brand, borderRadius: 12, paddingVertical: 15,
  },
  assignBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Trip status
  tripStatusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tripStatusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  tripStatusText: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  tripStatusSub: { fontSize: 13, color: C.muted, marginBottom: 2 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  rejectBtn: { backgroundColor: C.surface, borderColor: C.red },
  acceptBtn: { backgroundColor: C.brand, borderColor: C.brand },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Driver modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 24,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: C.border, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalLoader: { padding: 44, alignItems: 'center' },
  emptyModal: { padding: 44, alignItems: 'center', gap: 10 },
  emptyModalTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  emptyModalSub: { fontSize: 14, color: C.muted, textAlign: 'center' },
  driverItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  driverSub: { fontSize: 13, color: C.muted },
});
