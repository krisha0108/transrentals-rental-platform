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

export default function PackersQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      console.log('❌ [PackersRequestDetail] Request ID is missing');
      Alert.alert('Error', 'Request ID is missing');
      navigation.goBack();
      return;
    }

    console.log('🔍 [PackersRequestDetail] Fetching request with ID:', requestId);

    try {
      // FIX: Fetch ALL pages to find the request
      let allRequests = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
        console.log(`📄 [PackersRequestDetail] Fetching page ${page}...`);
        const response = await getQuoteRequests('packers', { page, limit: 20 });
        const pageRequests = response.quoteRequests || response.requests || response.data || [];

        allRequests = [...allRequests, ...pageRequests];

        // Check if we found the request
        const found = pageRequests.find(r => {
          const itemId = (r.id || r._id)?.toString();
          const searchId = requestId?.toString();
          return itemId === searchId;
        });

        if (found) {
          console.log('✅ [PackersRequestDetail] Request found on page', page);
          setRequest(found);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Check if there are more pages
        const pagination = response.pagination || {};
        hasMore = page < (pagination.totalPages || 1);
        page++;
      }

      // If we reach here, request was not found
      console.log('❌ [PackersRequestDetail] Request not found after checking all pages');
      console.log('Total requests checked:', allRequests.length);
      Alert.alert('Error', 'Request not found');

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
    navigation.navigate('PackersSendQuote', { requestId: request.id || request._id });
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
  const pickupLocation = request.pickupLocation || request.pickup_location || request.pickupCity || 'N/A';
  const dropLocation = request.dropLocation || request.drop_location || request.dropCity;
  const pickupDate = request.pickupDate || request.pickup_date || request.startDate || request.preferredDate;
  const returnDate = request.returnDate || request.return_date || request.endDate;
  const serviceType = request.serviceType || request.service_type || request.vehicleType;
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);
  const notes = request.notes || request.description || request.additionalInfo || request.specialRequirements;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>Packers & Movers</Text>
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
          {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
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

          {/* Vehicle Information */}
          {serviceType && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="dolly" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Vehicle Requested</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.vehicleInfo}>
                  <MaterialCommunityIcons name="dolly" size={32} color={GREEN} />
                  <Text style={styles.vehicleName}>{serviceType}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Booking Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupLocation}</Text>
                </View>
              </View>
              {dropLocation && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Drop Location</Text>
                    <Text style={styles.infoValue}>{dropLocation}</Text>
                  </View>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Date</Text>
                  <Text style={styles.infoValue}>{formatDate(pickupDate)}</Text>
                </View>
              </View>
              {returnDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Return Date</Text>
                    <Text style={styles.infoValue}>{formatDate(returnDate)}</Text>
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
      {!request.hasQuoted && (status === 'PENDING' || status === 'QUOTES_RECEIVED') && (
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
