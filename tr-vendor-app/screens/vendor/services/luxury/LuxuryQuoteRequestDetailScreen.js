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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getQuoteRequests } from '../../../api/client';

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  QUOTED: '#3B82F6',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#6B7280',
};

export default function LuxuryQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID is missing');
      navigation.goBack();
      return;
    }

    try {
      const response = await getQuoteRequests('luxury', {});
      const requests = response.quoteRequests || response.requests || response.data || [];
      const foundRequest = requests.find(r => (r.id || r._id) === requestId);

      if (foundRequest) {
        setRequest(foundRequest);
      } else {
        Alert.alert('Error', 'Request not found');
      }
    } catch (error) {
      console.error('Error fetching request detail:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId, navigation]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequestDetail();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'time-outline';
      case 'QUOTED':
        return 'document-text';
      case 'ACCEPTED':
        return 'checkmark-circle';
      case 'REJECTED':
        return 'close-circle';
      case 'EXPIRED':
        return 'alert-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const handleSendQuote = () => {
    navigation.navigate('LuxurySendQuote', { requestId: request.id || request._id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loaderText}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Request Not Found</Text>
          <Text style={styles.emptySubtitle}>This request may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = request.status?.toUpperCase() || 'PENDING';
  const statusColor = STATUS_COLORS[status] || '#6B7280';

  const customerName = request.customerName || request.customer_name || 'Customer';
  const customerEmail = request.customerEmail || request.customer_email;
  const customerPhone = request.customerPhone || request.customer_phone;
  const pickupCity = request.pickupCity || request.pickup_location || request.pickupLocation || 'N/A';
  const pickupAddress = request.pickupAddress || request.pickup_address;
  const dropCity = request.dropCity || request.drop_location || request.dropLocation;
  const dropAddress = request.dropAddress || request.drop_address;
  const pickupDate = request.pickupDate || request.pickup_date || request.startDate;
  const pickupTime = request.pickupTime || request.pickup_time;
  const returnDate = request.returnDate || request.return_date || request.endDate;
  const returnTime = request.returnTime || request.return_time;
  const vehicleType = request.vehicleType || request.vehicle_type || request.vehicleCategory;
  const vehicleCategoryName = request.vehicleCategoryName || request.vehicle_category_name;
  const specificModel = request.specificModel || request.specific_model;
  const passengers = request.passengers;
  const tripType = request.tripType || request.trip_type;
  const occasion = request.occasion;
  const tripDays = request.tripDays || request.trip_days;
  const tripHours = request.tripHours || request.trip_hours;
  const packageType = request.packageType || request.package_type;
  const needChauffeur = request.needChauffeur !== false;
  const needDecoration = request.needDecoration === true;
  const decorationType = request.decorationType || request.decoration_type;
  const budgetMin = request.budgetMin || request.budget_min;
  const budgetMax = request.budgetMax || request.budget_max;
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.requirements || request.notes || request.description || request.additionalInfo || request.specialRequirements;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>Luxury Car</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={styles.statusContent}>
            <Ionicons name={getStatusIcon(status)} size={24} color={statusColor} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{status}</Text>
              <Text style={styles.requestNumberText}>Request #{requestNumber}</Text>
            </View>
          </View>
          {status === 'PENDING' && (
            <TouchableOpacity style={styles.sendQuoteBtn} onPress={handleSendQuote}>
              <Ionicons name="paper-plane" size={16} color="#fff" />
              <Text style={styles.sendQuoteBtnText}>Send Quote</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName}</Text>
                </View>
              </View>
              {customerEmail && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{customerEmail}</Text>
                  </View>
                </View>
              )}
              {customerPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{customerPhone}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle & Trip Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="car-sport" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Vehicle & Trip Details</Text>
            </View>
            <View style={styles.card}>
              {(vehicleType || vehicleCategoryName) && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="car-sport" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Vehicle Category</Text>
                    <Text style={styles.infoValue}>{vehicleCategoryName || vehicleType}</Text>
                  </View>
                </View>
              )}
              {specificModel && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="car-info" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Preferred Model</Text>
                    <Text style={styles.infoValue}>{specificModel}</Text>
                  </View>
                </View>
              )}
              {passengers && (
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Passengers</Text>
                    <Text style={styles.infoValue}>{passengers}</Text>
                  </View>
                </View>
              )}
              {tripType && (
                <View style={styles.infoRow}>
                  <Ionicons name="navigate" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Trip Type</Text>
                    <Text style={styles.infoValue}>{tripType.charAt(0).toUpperCase() + tripType.slice(1)}</Text>
                  </View>
                </View>
              )}
              {occasion && (
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Occasion</Text>
                    <Text style={styles.infoValue}>{occasion.charAt(0).toUpperCase() + occasion.slice(1)}</Text>
                  </View>
                </View>
              )}
              {packageType && (
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Package</Text>
                    <Text style={styles.infoValue}>{packageType}</Text>
                  </View>
                </View>
              )}
              {(tripDays || tripHours) && (
                <View style={styles.infoRow}>
                  <Ionicons name="timer" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Duration</Text>
                    <Text style={styles.infoValue}>
                      {tripDays ? `${tripDays} day${tripDays > 1 ? 's' : ''}` : ''}
                      {tripDays && tripHours ? ', ' : ''}
                      {tripHours ? `${tripHours} hour${tripHours > 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Route & Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Route & Schedule</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>
                    {pickupCity}
                    {pickupAddress ? `\n${pickupAddress}` : ''}
                  </Text>
                </View>
              </View>
              {dropCity && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Drop Location</Text>
                    <Text style={styles.infoValue}>
                      {dropCity}
                      {dropAddress ? `\n${dropAddress}` : ''}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Date & Time</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(pickupDate)}
                    {pickupTime ? ` at ${pickupTime}` : ''}
                  </Text>
                </View>
              </View>
              {returnDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Return Date & Time</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(returnDate)}
                      {returnTime ? ` at ${returnTime}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Requirements</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Chauffeur</Text>
                  <Text style={[styles.infoValue, { color: needChauffeur ? GREEN : '#EF4444' }]}>
                    {needChauffeur ? 'Required' : 'Not Required'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="party-popper" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Decoration</Text>
                  <Text style={[styles.infoValue, { color: needDecoration ? GREEN : '#64748B' }]}>
                    {needDecoration ? (decorationType || 'Required') : 'Not Required'}
                  </Text>
                </View>
              </View>
              {(budgetMin || budgetMax) && (
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Budget Range</Text>
                    <Text style={styles.infoValue}>
                      ₹{budgetMin ? budgetMin.toLocaleString('en-IN') : '0'} - ₹{budgetMax ? budgetMax.toLocaleString('en-IN') : '0'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          {notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbox-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Special Requirements</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}

          {/* Request Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Request Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <Ionicons name="add-circle" size={16} color={GREEN} />
                <Text style={styles.timelineText}>
                  Received on {formatDate(request.createdAt || request.created_at)}
                </Text>
              </View>
              {request.updatedAt && request.updatedAt !== request.createdAt && (
                <View style={styles.timelineRow}>
                  <Ionicons name="refresh" size={16} color="#64748B" />
                  <Text style={styles.timelineText}>
                    Updated on {formatDate(request.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      {status === 'PENDING' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sendQuoteButton} onPress={handleSendQuote}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
            <Text style={styles.sendQuoteButtonText}>Send Quote to Customer</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 14, color: '#64748B', marginTop: 8 },

  scrollView: { flex: 1 },

  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  requestNumberText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sendQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sendQuoteBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  content: { padding: 16, paddingTop: 8, paddingBottom: 100 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DARK },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  infoValue: { fontSize: 14, color: DARK, fontWeight: '600' },

  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: DARK, flex: 1 },

  notesText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timelineText: { fontSize: 13, color: '#64748B' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sendQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendQuoteButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
