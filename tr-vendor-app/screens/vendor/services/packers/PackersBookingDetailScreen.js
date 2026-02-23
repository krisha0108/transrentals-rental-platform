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
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#22C55E',
};

const STATUS_CONFIG = {
  PENDING_PAYMENT: { color: C.amber, bg: '#FEF3C7', label: 'Awaiting Payment' },
  PAYMENT_SUBMITTED: { color: C.orange, bg: '#FED7AA', label: 'Payment Submitted' },
  ADVANCE_PAID: { color: C.green, bg: '#D1FAE5', label: 'Advance Paid' },
  CONFIRMED: { color: C.green, bg: '#DCFCE7', label: 'Confirmed' },
  PAYMENT_VERIFIED: { color: C.green, bg: '#D1FAE5', label: 'Payment Verified' },
  PENDING_VENDOR: { color: C.orange, bg: '#FEF3C7', label: 'Pending' },
  BROADCASTED: { color: C.blue, bg: '#DBEAFE', label: 'Open' },
  ACCEPTED: { color: C.green, bg: '#DCFCE7', label: 'Accepted' },
  VEHICLE_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Team Assigned' },
  TEAM_ASSIGNED: { color: C.blue, bg: '#DBEAFE', label: 'Team Assigned' },
  PACKING: { color: C.purple, bg: '#E9D5FF', label: 'Packing in Progress' },
  LOADING: { color: C.purple, bg: '#DDD6FE', label: 'Loading in Progress' },
  IN_TRANSIT: { color: C.purple, bg: '#F3E8FF', label: 'In Transit' },
  UNLOADING: { color: C.purple, bg: '#DDD6FE', label: 'Unloading in Progress' },
  UNPACKING: { color: C.purple, bg: '#E9D5FF', label: 'Unpacking in Progress' },
  IN_PROGRESS: { color: C.purple, bg: '#F3E8FF', label: 'In Progress' },
  COMPLETED: { color: C.muted, bg: '#F3F4F6', label: 'Completed' },
  CANCELLED: { color: C.red, bg: '#FEE2E2', label: 'Cancelled' },
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
      console.error('[PackersBookingDetail] Error:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const handleAccept = async () => {
    Alert.alert('Accept Booking', 'Are you sure you want to accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setActionLoading(true);
            await acceptBooking('packers', bookingId);
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

  const handleReject = async () => {
    Alert.alert('Reject Booking', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await rejectBooking('packers', bookingId, 'Vendor rejected');
            await fetchBooking();
            Alert.alert('Success', 'Booking rejected');
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.error || 'Failed to reject booking');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate('ChatScreen', {
      bookingId: booking.id,
      customerName: booking.customerName,
      bookingNumber: booking.bookingNumber || booking.id,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;
  };

  const canAccept = () => {
    const acceptableStatuses = ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'];
    return acceptableStatuses.includes(booking?.status);
  };

  const canReject = () => {
    const rejectableStatuses = ['PENDING_VENDOR', 'BROADCASTED', 'PAYMENT_VERIFIED'];
    return rejectableStatuses.includes(booking?.status);
  };

  const canAssignDriver = () => {
    const assignableStatuses = ['ADVANCE_PAID', 'ACCEPTED', 'PAYMENT_VERIFIED', 'VEHICLE_ASSIGNED', 'TEAM_ASSIGNED'];
    return assignableStatuses.includes(booking?.status) && !booking?.teamLeaderName;
  };

  const canChangeDriver = () => {
    const changeableStatuses = ['VEHICLE_ASSIGNED', 'TEAM_ASSIGNED', 'ACCEPTED', 'PAYMENT_VERIFIED'];
    return changeableStatuses.includes(booking?.status) && booking?.teamLeaderName;
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await getStaffDrivers();
      setDrivers(response?.drivers || response?.staff || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
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
      const isChanging = !!booking?.teamLeaderName;
      setShowDriverModal(false);
      setActionLoading(true);
      await assignOperator('packers', bookingId, {
        operatorName: driver.name,
        operatorPhone: driver.phone,
      });
      await fetchBooking();
      Alert.alert('Success', isChanging ? 'Team leader changed successfully' : 'Team leader assigned successfully');
    } catch (error) {
      console.error('Error assigning team leader:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to assign team leader');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle" size={48} color={C.muted} />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(booking.status);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking #{booking.bookingNumber || booking.id}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusHeaderCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.createdDate}>Created on {formatDate(booking.createdAt)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="truck-delivery" size={24} color={C.brand} />
            <Text style={styles.cardTitle}>Packers & Movers</Text>
          </View>

          {booking.shiftingType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shifting Type</Text>
              <Text style={styles.detailValue}>{booking.shiftingType}</Text>
            </View>
          )}

          {booking.teamSize && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Team Size</Text>
              <Text style={styles.detailValue}>{booking.teamSize} members</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shifting Details</Text>

          <View style={styles.locationItem}>
            <Icon name="map-pin" size={16} color={C.brand} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationText}>{booking.pickupCity || 'Not specified'}</Text>
              {booking.pickupAddress && (
                <Text style={styles.locationAddress}>{booking.pickupAddress}</Text>
              )}
              {booking.pickupFloor && (
                <Text style={styles.locationSubtext}>Floor: {booking.pickupFloor}</Text>
              )}
            </View>
          </View>

          {booking.dropCity && (
            <View style={styles.locationItem}>
              <Icon name="map-pin" size={16} color={C.red} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.locationLabel}>To</Text>
                <Text style={styles.locationText}>{booking.dropCity}</Text>
                {booking.dropAddress && (
                  <Text style={styles.locationAddress}>{booking.dropAddress}</Text>
                )}
                {booking.dropFloor && (
                  <Text style={styles.locationSubtext}>Floor: {booking.dropFloor}</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={C.muted} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.detailLabel}>Scheduled Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.scheduledDate)}</Text>
            </View>
          </View>

          {booking.scheduledTime && (
            <View style={styles.detailRow}>
              <Icon name="clock" size={16} color={C.muted} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.detailLabel}>Scheduled Time</Text>
                <Text style={styles.detailValue}>{booking.scheduledTime}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Info</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Icon name="user" size={20} color={C.blue} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName || 'Customer'}</Text>
            </View>
            <View style={styles.customerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={handleChat}
              >
                <Icon name="message-circle" size={18} color={C.blue} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount</Text>
            <Text style={styles.paymentValue}>
              ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
            </Text>
          </View>

          {(booking.advancePaid || booking.paidAmount) > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Advance Paid</Text>
              <Text style={[styles.paymentValue, { color: C.green }]}>
                ₹{(booking.advancePaid || booking.paidAmount || 0).toLocaleString()}
              </Text>
            </View>
          )}

          {(booking.balanceAmount > 0 || (booking.totalAmount > (booking.advancePaid || 0))) && (
            <View style={[styles.paymentRow, styles.paymentRowDivider]}>
              <Text style={[styles.paymentLabel, { fontWeight: '600' }]}>Balance</Text>
              <Text style={[styles.paymentValue, { color: C.amber }]}>
                ₹{((booking.totalAmount || 0) - (booking.advancePaid || booking.paidAmount || 0)).toLocaleString()}
              </Text>
            </View>
          )}
        </View>


        {/* Assign Team Leader Button */}
        {canAssignDriver() && (
          <TouchableOpacity
            style={styles.assignDriverButton}
            onPress={handleAssignDriverPress}
            disabled={actionLoading}
          >
            <Icon name="user-plus" size={20} color="#fff" />
            <Text style={styles.assignDriverText}>Assign Team Leader</Text>
          </TouchableOpacity>
        )}

        {/* Show assigned team leader info if exists */}
        {booking?.teamLeaderName && (
          <View style={[styles.card, { backgroundColor: '#F0F9FF' }]}>
            <View style={styles.driverCardHeader}>
              <Text style={styles.cardTitle}>Team Leader Details</Text>
              {canChangeDriver() && (
                <TouchableOpacity
                  style={styles.changeDriverBtn}
                  onPress={handleAssignDriverPress}
                  disabled={actionLoading}
                >
                  <Icon name="edit-2" size={16} color={C.blue} />
                  <Text style={styles.changeDriverText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{booking.teamLeaderName}</Text>
            </View>
            {booking.teamLeaderPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <TouchableOpacity onPress={() => handleCall(booking.teamLeaderPhone)}>
                  <Text style={[styles.detailValue, { color: C.blue }]}>{booking.teamLeaderPhone}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Trip Status Display */}
        {(booking?.status === 'VEHICLE_ASSIGNED' || booking?.status === 'TEAM_ASSIGNED') && booking?.teamLeaderName && (
          <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: C.blue }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="info" size={20} color={C.blue} />
              <Text style={styles.tripStatusText}>Team assigned, ready to start</Text>
            </View>
          </View>
        )}

        {booking?.status === 'PACKING' && (
          <View style={[styles.card, { backgroundColor: '#F5F3FF', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="package" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>Packing in progress</Text>
            </View>
            {booking.packingStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.packingStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'LOADING' && (
          <View style={[styles.card, { backgroundColor: '#EDE9FE', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="upload" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>Loading in progress</Text>
            </View>
            {booking.loadingStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.loadingStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'IN_TRANSIT' && (
          <View style={[styles.card, { backgroundColor: '#FAF5FF', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="truck" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>In transit</Text>
            </View>
            {booking.transitStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.transitStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'UNLOADING' && (
          <View style={[styles.card, { backgroundColor: '#EDE9FE', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="download" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>Unloading in progress</Text>
            </View>
            {booking.unloadingStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.unloadingStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'UNPACKING' && (
          <View style={[styles.card, { backgroundColor: '#F5F3FF', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="package" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>Unpacking in progress</Text>
            </View>
            {booking.unpackingStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.unpackingStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'IN_PROGRESS' && (
          <View style={[styles.card, { backgroundColor: '#FAF5FF', borderColor: C.purple }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="navigation" size={20} color={C.purple} />
              <Text style={styles.tripStatusText}>Service in progress</Text>
            </View>
            {booking.tripStartedAt && (
              <Text style={styles.tripStatusSubtext}>
                Started: {new Date(booking.tripStartedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        {booking?.status === 'COMPLETED' && (
          <View style={[styles.card, { backgroundColor: '#F0FDF4', borderColor: C.green }]}>
            <View style={styles.tripStatusRow}>
              <Icon name="check-circle" size={20} color={C.green} />
              <Text style={styles.tripStatusText}>Service completed</Text>
            </View>
            {booking.completedAt && (
              <Text style={styles.tripStatusSubtext}>
                Completed: {new Date(booking.completedAt).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {(canAccept() || canReject()) && (
        <View style={styles.actionBar}>
          {canReject() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Icon name="x" size={18} color={C.red} />
              <Text style={[styles.actionBtnText, { color: C.red }]}>Decline</Text>
            </TouchableOpacity>
          )}
          {canAccept() && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Accept Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {booking?.teamLeaderName ? 'Change Team Leader' : 'Select Team Leader'}
              </Text>
              <TouchableOpacity onPress={() => setShowDriverModal(false)} style={styles.modalCloseBtn}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            {loadingDrivers ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={C.brand} />
              </View>
            ) : drivers.length === 0 ? (
              <View style={styles.emptyDrivers}>
                <Icon name="users" size={48} color={C.muted} />
                <Text style={styles.emptyDriversText}>No team leaders available</Text>
                <Text style={styles.emptyDriversSubtext}>Add team leaders from Staff Management</Text>
              </View>
            ) : (
              <FlatList
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.driverItem}
                    onPress={() => handleSelectDriver(item)}
                  >
                    <View style={styles.driverIcon}>
                      <Icon name="user" size={24} color={C.brand} />
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{item.name}</Text>
                      {item.phone && <Text style={styles.driverPhone}>{item.phone}</Text>}
                      {item.licenseNumber && (
                        <Text style={styles.driverLicense}>License: {item.licenseNumber}</Text>
                      )}
                    </View>
                    <Icon name="chevron-right" size={20} color={C.muted} />
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statusHeaderCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createdDate: {
    fontSize: 12,
    color: C.muted,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: C.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  locationSubtext: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  customerContact: {
    fontSize: 13,
    color: C.muted,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentRowDivider: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 8,
    paddingTop: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: C.muted,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: C.surface,
    borderColor: '#FEE2E2',
  },
  acceptBtn: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: C.surface,
    borderColor: C.red,
  },
  acceptButton: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  assignDriverButton: {
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  assignDriverText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  changeDriverText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.blue,
  },
  tripStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
  },
  tripStatusSubtext: {
    fontSize: 13,
    color: C.muted,
    marginTop: 8,
    marginLeft: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoader: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDrivers: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyDriversText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  emptyDriversSubtext: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  driverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 2,
  },
  driverLicense: {
    fontSize: 12,
    color: C.muted,
  },
});
