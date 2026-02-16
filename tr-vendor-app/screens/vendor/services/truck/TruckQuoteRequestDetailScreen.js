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

export default function TruckQuoteRequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      console.log('❌ [TruckRequestDetail] Request ID is missing');
      Alert.alert('Error', 'Request ID is missing');
      navigation.goBack();
      return;
    }

    console.log('🔍 [TruckRequestDetail] Fetching request with ID:', requestId);

    try {
      // FIX: Fetch ALL pages to find the request
      let allRequests = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
        console.log(`📄 [TruckRequestDetail] Fetching page ${page}...`);
        const response = await getQuoteRequests('truck', { page, limit: 20 });
        const pageRequests = response.quoteRequests || response.requests || response.data || [];

        allRequests = [...allRequests, ...pageRequests];

        // Check if we found the request
        const found = pageRequests.find(r => {
          const itemId = (r.id || r._id)?.toString();
          const searchId = requestId?.toString();
          return itemId === searchId;
        });

        if (found) {
          console.log('✅ [TruckRequestDetail] Request found on page', page);
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
      console.log('❌ [TruckRequestDetail] Request not found after checking all pages');
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

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = timeStr.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1] || '00';

    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hours}:${minutes} ${period}`;
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
    navigation.navigate('TruckSendQuote', { requestId: request.id || request._id });
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

  // Safe property access helper
  const get = (obj, path, defaultValue = null) => {
    try {
      return obj?.[path] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const status = request?.status?.toUpperCase() || 'PENDING';
  const statusColor = STATUS_COLORS[status] || '#6B7280';

  // Customer Information
  const customerName = get(request, 'customerName') || get(request, 'customer_name') || 'Customer';
  const customerEmail = get(request, 'customerEmail') || get(request, 'customer_email');
  const customerPhone = get(request, 'customerPhone') || get(request, 'customer_phone');

  // Service Type (Personal/Commercial)
  const serviceType = get(request, 'serviceType') || get(request, 'service_type');

  // Truck Details
  const truckType = get(request, 'vehicleCategoryName') || get(request, 'vehicle_category_name') || get(request, 'truckType') || get(request, 'truck_type') || get(request, 'vehicleType');

  // Load Details
  const goodType = get(request, 'goodsType') || get(request, 'goods_type') || get(request, 'goodType') || get(request, 'good_type') || get(request, 'materialType');
  const goodsDescription = get(request, 'goodsDescription') || get(request, 'goods_description');
  const weight = get(request, 'estimatedWeight') || get(request, 'estimated_weight') || get(request, 'weight');
  const volume = get(request, 'estimatedVolume') || get(request, 'estimated_volume');

  // Labour Details
  const requiresLabour = get(request, 'requiresLabour') || get(request, 'requires_labour');
  const labourCount = get(request, 'labourCount') || get(request, 'labour_count');

  // Trip Details - Pickup
  const pickupCity = get(request, 'pickupCity') || get(request, 'pickup_city') || get(request, 'pickupLocation') || get(request, 'pickup_location');
  const pickupAddress = get(request, 'pickupAddress') || get(request, 'pickup_address');
  const pickupFloor = get(request, 'pickupFloor') || get(request, 'pickup_floor');
  const hasPickupLift = get(request, 'hasPickupLift') ?? get(request, 'has_pickup_lift');

  // Trip Details - Drop
  const dropCity = get(request, 'dropCity') || get(request, 'drop_city') || get(request, 'destination') || get(request, 'dropLocation') || get(request, 'drop_location');
  const dropAddress = get(request, 'dropAddress') || get(request, 'drop_address');
  const dropFloor = get(request, 'dropFloor') || get(request, 'drop_floor');
  const hasDropLift = get(request, 'hasDropLift') ?? get(request, 'has_drop_lift');

  // Distance
  const estimatedDistance = get(request, 'estimatedDistance') || get(request, 'estimated_distance');

  // Date & Time
  const pickupDate = get(request, 'pickupDate') || get(request, 'pickup_date') || get(request, 'startDate') || get(request, 'start_date');
  const pickupTime = get(request, 'pickupTime') || get(request, 'pickup_time') || get(request, 'startTime') || get(request, 'start_time');
  const isFlexibleDate = get(request, 'isFlexibleDate') || get(request, 'is_flexible_date');

  // Additional Requirements
  const needInsurance = get(request, 'needInsurance') || get(request, 'need_insurance');
  const needPackaging = get(request, 'needPackaging') || get(request, 'need_packaging');
  const requirements = get(request, 'requirements') || get(request, 'notes') || get(request, 'description');

  // Budget Information
  const budgetMin = get(request, 'budgetMin') || get(request, 'budget_min');
  const budgetMax = get(request, 'budgetMax') || get(request, 'budget_max');

  // Request Metadata
  const requestNumber = request.requestNumber || request.request_number || (request.id || request._id)?.toString().slice(-8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>Truck Rental</Text>
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

          {/* Service Type & Truck Details */}
          {(serviceType || truckType) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="truck" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Service & Vehicle Details</Text>
              </View>
              <View style={styles.card}>
                {serviceType && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name={serviceType?.toLowerCase().includes('personal') ? 'person' : 'business'}
                      size={18}
                      color="#64748B"
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Service Type</Text>
                      <Text style={styles.infoValue}>
                        {serviceType?.toLowerCase().includes('personal') ? '🏠 Personal Use' : '🏭 Commercial Use'}
                      </Text>
                    </View>
                  </View>
                )}
                {truckType && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="truck" size={18} color={GREEN} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Truck Type</Text>
                      <Text style={styles.infoValue}>{truckType}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Load Details */}
          {(goodType || weight || volume || requiresLabour) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Load Details</Text>
              </View>
              <View style={styles.card}>
                {goodType && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="cube-outline" size={18} color="#64748B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Material Type</Text>
                      <Text style={styles.infoValue}>{goodType}</Text>
                      {goodsDescription && (
                        <Text style={styles.infoSubtext}>{goodsDescription}</Text>
                      )}
                    </View>
                  </View>
                )}
                {weight && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="weight" size={18} color="#F59E0B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Estimated Weight</Text>
                      <Text style={styles.infoValue}>{weight} TON</Text>
                    </View>
                  </View>
                )}
                {volume && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="cube" size={18} color="#3B82F6" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Volume</Text>
                      <Text style={styles.infoValue}>{volume}</Text>
                    </View>
                  </View>
                )}
                {requiresLabour && (
                  <View style={styles.infoRow}>
                    <Ionicons name="people" size={18} color="#10B981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Labour Required</Text>
                      <Text style={styles.infoValue}>
                        Yes{labourCount ? ` (${labourCount} workers)` : ''}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Trip Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Trip Details</Text>
            </View>
            <View style={styles.card}>
              {/* Pickup Location */}
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupCity}</Text>
                  {pickupAddress && (
                    <Text style={styles.infoSubtext}>{pickupAddress}</Text>
                  )}
                  {(pickupFloor || hasPickupLift !== undefined) && (
                    <Text style={styles.infoSubtext}>
                      {pickupFloor ? `Floor: ${pickupFloor}` : ''}
                      {pickupFloor && hasPickupLift !== undefined ? ' | ' : ''}
                      {hasPickupLift !== undefined ? (hasPickupLift ? 'Lift Available ✓' : 'No Lift') : ''}
                    </Text>
                  )}
                </View>
              </View>

              {/* Drop Location */}
              {dropCity && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Drop Location</Text>
                    <Text style={styles.infoValue}>{dropCity}</Text>
                    {dropAddress && (
                      <Text style={styles.infoSubtext}>{dropAddress}</Text>
                    )}
                    {(dropFloor || hasDropLift !== undefined) && (
                      <Text style={styles.infoSubtext}>
                        {dropFloor ? `Floor: ${dropFloor}` : ''}
                        {dropFloor && hasDropLift !== undefined ? ' | ' : ''}
                        {hasDropLift !== undefined ? (hasDropLift ? 'Lift Available ✓' : 'No Lift') : ''}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Distance */}
              {estimatedDistance && (
                <View style={styles.infoRow}>
                  <Ionicons name="navigate" size={18} color="#6366F1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Estimated Distance</Text>
                    <Text style={styles.infoValue}>{estimatedDistance} km</Text>
                  </View>
                </View>
              )}

              {/* Pickup Date & Time */}
              {pickupDate && (
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar" size={16} color="#64748B" />
                    <View style={styles.dateTimeContent}>
                      <Text style={styles.infoLabel}>Pickup Date</Text>
                      <Text style={styles.dateTimeValue}>{formatDate(pickupDate)}</Text>
                    </View>
                  </View>
                  {pickupTime && (
                    <View style={styles.dateTimeItem}>
                      <Ionicons name="time" size={16} color="#64748B" />
                      <View style={styles.dateTimeContent}>
                        <Text style={styles.infoLabel}>Time</Text>
                        <Text style={styles.dateTimeValue}>{formatTime(pickupTime)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Flexible Date */}
              {isFlexibleDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#10B981" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Date Flexibility</Text>
                    <Text style={styles.infoValue}>Dates are flexible</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Additional Requirements */}
          {(needInsurance || needPackaging || requirements) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="clipboard-check" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Additional Requirements</Text>
              </View>
              <View style={styles.card}>
                {needInsurance && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Insurance</Text>
                      <Text style={styles.infoValue}>Required</Text>
                    </View>
                  </View>
                )}
                {needPackaging && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="package-variant-closed" size={18} color="#F59E0B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Packaging</Text>
                      <Text style={styles.infoValue}>Required</Text>
                    </View>
                  </View>
                )}
                {requirements && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text" size={18} color="#64748B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Special Requirements</Text>
                      <Text style={styles.infoValue}>{requirements}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Budget Range */}
          {(budgetMin || budgetMax) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Budget Range</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.budgetRow}>
                  {budgetMin && (
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Minimum</Text>
                      <Text style={styles.budgetValue}>₹{budgetMin?.toLocaleString()}</Text>
                    </View>
                  )}
                  {budgetMax && (
                    <View style={styles.budgetItem}>
                      <Text style={styles.budgetLabel}>Maximum</Text>
                      <Text style={styles.budgetValue}>₹{budgetMax?.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
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
  infoSubtext: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 16 },

  vehicleInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: DARK },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#92400E' },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateTimeContent: { flex: 1 },
  dateTimeValue: { fontSize: 13, fontWeight: '600', color: DARK, marginTop: 2 },

  budgetRow: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetItem: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  budgetLabel: { fontSize: 11, color: '#166534', marginBottom: 4 },
  budgetValue: { fontSize: 16, fontWeight: '700', color: '#15803D' },

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
