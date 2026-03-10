// screens/vendor/services/VendorServicesScreen.js
// Service selection and management screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { import { showError, showConfirm, showError, showInfo, showSuccess } from '../../services/alertService';
  getVendorServices,
  requestService,
  apiGet,
} from '../../api/client';

const BRAND = {
  primary: '#1FC77A',
  primaryDark: '#12AD66',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
  error: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  green: '#10B981',
};

// Service icons mapping
const SERVICE_ICONS = {
  'car': 'car-sport',
  'bike': 'bicycle',
  'bus': 'bus',
  'luxury': 'diamond',
  'tempo': 'cube',
  'truck': 'cube-outline',
  'equipment': 'construct',
  'packers': 'cube-outline',
  'self-drive': 'key',
  'default': 'layers',
};

const getServiceIcon = (slug) => {
  const key = slug?.toLowerCase() || 'default';
  return SERVICE_ICONS[key] || SERVICE_ICONS.default;
};

export default function VendorServicesScreen({ navigation }) {
  const [approvedServiceIds, setApprovedServiceIds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      // Fetch vendor's services (includes allServices, approvedServiceIds, requests)
      const vendorServices = await getVendorServices();
      console.log('Vendor services response:', vendorServices);

      // API returns allServices directly
      setAllServices(vendorServices.allServices || []);
      setApprovedServiceIds(vendorServices.approvedServiceIds || []);
      setRequests(vendorServices.requests || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Fallback to static list if API fails
      setAllServices([
        { id: '1', name: 'Car Rental', slug: 'car', description: 'Sedan, SUV, Hatchback rentals' },
        { id: '2', name: 'Bike Rental', slug: 'bike', description: 'Two-wheeler rentals' },
        { id: '3', name: 'Bus Rental', slug: 'bus', description: 'Mini bus and coach rentals' },
        { id: '4', name: 'Luxury Vehicle', slug: 'luxury', description: 'Premium and luxury cars' },
        { id: '5', name: 'Tempo/Truck', slug: 'truck', description: 'Goods transport vehicles' },
        { id: '6', name: 'Equipment Rental', slug: 'equipment', description: 'Construction equipment' },
        { id: '7', name: 'Packers & Movers', slug: 'packers', description: 'Relocation services' },
        { id: '8', name: 'Self Drive', slug: 'self-drive', description: 'Self-drive car rentals' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />;
      case 'REJECTED':
        return <Ionicons name="close-circle" size={20} color={BRAND.error} />;
      default:
        return <Ionicons name="time" size={20} color={BRAND.yellow} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING':
        return 'Under Review';
      default:
        return status;
    }
  };

  const getRequestForService = (serviceId) => {
    return requests.find((r) => r.serviceId === serviceId);
  };

  const isServiceApproved = (serviceId) => {
    return approvedServiceIds.includes(serviceId);
  };

  const openRequestModal = (service) => {
    setSelectedService(service);
    setRequestMessage('');
    setShowRequestModal(true);
  };

  const handleRequestService = async () => {
    if (!selectedService) return;

    setSubmitting(true);
    try {
      await requestService(selectedService.id, requestMessage);
      setShowRequestModal(false);
      fetchServices();
      showSuccess('Service request submitted successfully!');
    } catch (error) {
      console.error('Request service failed:', error);
      showError(error?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('VendorLocations');
  };

  const handleRequestAllServices = async () => {
    // Get all services that are not approved and not already requested
    const availableServices = allServices.filter(service => {
      const isApproved = isServiceApproved(service.id);
      const existingRequest = getRequestForService(service.id);
      const isPending = existingRequest?.status === 'PENDING';
      return !isApproved && !isPending;
    });

    if (availableServices.length === 0) {
      showInfo('All services are already requested or approved.');
      return;
    }

    showConfirm('Request All Services', `Do you want to request all ${availableServices.length} available services?`, async () => {
            try {
              // Request all services
              for (const service of availableServices) {
                await requestService(service.id, `Requesting ${service.name} service`);
              }
              await fetchServices();
              showSuccess(`${availableServices.length} service(s) requested successfully!`);
            } catch (error) {
              console.error('Request all services failed:', error);
              showError(error?.response?.data?.error || 'Failed to request services');
            }
          }, { confirmText: 'Request All' });
  };

  const approvedCount = approvedServiceIds.length;
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Services</Text>
            <Text style={styles.headerSubtitle}>
              {requests.length === 0
                ? 'Step 2: Select services you want to offer'
                : 'Services you are approved to offer'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={BRAND.blue} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#D1FAE5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={24} color={BRAND.green} />
            </View>
            <View>
              <Text style={styles.statLabel}>Approved</Text>
              <Text style={[styles.statNumber, { color: BRAND.green }]}>{approvedCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={24} color={BRAND.yellow} />
            </View>
            <View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statNumber, { color: BRAND.yellow }]}>{pendingCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEE2E2' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={24} color={BRAND.error} />
            </View>
            <View>
              <Text style={styles.statLabel}>Rejected</Text>
              <Text style={[styles.statNumber, { color: BRAND.error }]}>{rejectedCount}</Text>
            </View>
          </View>
        </View>

        {/* Service Requests List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers" size={20} color={BRAND.ink} />
            <Text style={styles.sectionTitle}>Service Requests</Text>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="layers-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No service requests yet</Text>
              <Text style={styles.emptyText}>Request services below to start offering them</Text>
            </View>
          ) : (
            requests.map((request) => {
              const statusColors = getStatusColor(request.status);
              return (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestLeft}>
                    <View style={[styles.serviceIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name={getServiceIcon(request.services?.slug)} size={24} color={BRAND.blue} />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{request.services?.name}</Text>
                      <Text style={styles.requestDate}>
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                    {getStatusIcon(request.status)}
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>

                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionText}>
                        <Text style={styles.rejectionLabel}>Reason: </Text>
                        {request.rejectionReason}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Available Services */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={20} color={BRAND.ink} />
            <Text style={styles.sectionTitle}>Available Services</Text>
          </View>

          {/* Select All Button */}
          <TouchableOpacity
            style={styles.selectAllServicesBtn}
            onPress={handleRequestAllServices}
          >
            <Ionicons name="layers" size={20} color={BRAND.blue} />
            <Text style={styles.selectAllServicesText}>Request All Services</Text>
            <Ionicons name="arrow-forward" size={18} color={BRAND.blue} />
          </TouchableOpacity>

          <View style={styles.servicesGrid}>
            {allServices.map((service) => {
              const isApproved = isServiceApproved(service.id);
              const existingRequest = getRequestForService(service.id);
              const isPending = existingRequest?.status === 'PENDING';

              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    isApproved && styles.serviceCardApproved,
                    isPending && styles.serviceCardPending,
                  ]}
                  onPress={() => !isApproved && !isPending && openRequestModal(service)}
                  disabled={isApproved || isPending}
                >
                  <View style={[
                    styles.serviceCardIcon,
                    isApproved && styles.serviceCardIconApproved,
                  ]}>
                    <Ionicons
                      name={getServiceIcon(service.slug)}
                      size={28}
                      color={isApproved ? BRAND.green : BRAND.blue}
                    />
                  </View>
                  <Text style={styles.serviceCardName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceCardDesc} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  {isApproved ? (
                    <View style={styles.approvedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={BRAND.green} />
                      <Text style={styles.approvedBadgeText}>Approved</Text>
                    </View>
                  ) : isPending ? (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time" size={14} color={BRAND.yellow} />
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  ) : (
                    <View style={styles.requestBadge}>
                      <Ionicons name="add" size={14} color={BRAND.blue} />
                      <Text style={styles.requestBadgeText}>Request</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Continue Button */}
        {(approvedCount > 0 || requests.length > 0) && (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue to Locations</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Skip Option for users who haven't requested anything yet */}
        {approvedCount === 0 && requests.length === 0 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleContinue}>
            <Text style={styles.skipBtnText}>Skip for now (You can add services later)</Text>
            <Ionicons name="arrow-forward" size={18} color={BRAND.subText} />
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={BRAND.blue} />
          <Text style={styles.infoText}>
            Request services you want to offer. Admin will review and approve based on your fleet capabilities.
          </Text>
        </View>
      </ScrollView>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Service</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowRequestModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            {selectedService && (
              <View style={styles.selectedServiceBox}>
                <View style={styles.selectedServiceIcon}>
                  <Ionicons name={getServiceIcon(selectedService.slug)} size={32} color={BRAND.blue} />
                </View>
                <View>
                  <Text style={styles.selectedServiceName}>{selectedService.name}</Text>
                  {selectedService.description && (
                    <Text style={styles.selectedServiceDesc}>{selectedService.description}</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Message (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea]}
                placeholder="Tell us about your experience with this service..."
                placeholderTextColor="#A3B3C2"
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleRequestService}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: BRAND.subText,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 4,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: BRAND.card,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: BRAND.subText,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Section Card
  sectionCard: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.ink,
  },

  // Select All Services Button
  selectAllServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    gap: 10,
  },
  selectAllServicesText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.blue,
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 4,
  },

  // Request Item
  requestItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.ink,
  },
  requestDate: {
    fontSize: 13,
    color: BRAND.subText,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  rejectionText: {
    fontSize: 13,
    color: BRAND.error,
  },
  rejectionLabel: {
    fontWeight: '700',
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  serviceCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#FBFDFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  serviceCardApproved: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  serviceCardPending: {
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
  },
  serviceCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceCardIconApproved: {
    backgroundColor: '#D1FAE5',
  },
  serviceCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.ink,
    textAlign: 'center',
  },
  serviceCardDesc: {
    fontSize: 12,
    color: BRAND.subText,
    textAlign: 'center',
    marginTop: 4,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    gap: 4,
  },
  approvedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 4,
  },
  requestBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.blue,
  },

  // Continue Button
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Skip Button
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.subText,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.text,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.ink,
  },
  modalClose: {
    padding: 4,
  },
  selectedServiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  selectedServiceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: BRAND.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
  },
  selectedServiceDesc: {
    fontSize: 13,
    color: BRAND.subText,
    marginTop: 2,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: BRAND.ink,
    backgroundColor: '#FBFDFF',
  },
  modalTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.text,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND.blue,
    gap: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
