// screens/vendor/services/VendorServicesScreen.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showSuccess } from '../../../services/alertService';
import {
  getVendorServices,
  apiPost,
  apiDelete,
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

const SERVICE_ICONS = {
  car: 'car-sport',
  bike: 'bicycle',
  bus: 'bus',
  luxury: 'diamond',
  tempo: 'cube',
  truck: 'cube-outline',
  equipment: 'construct',
  packers: 'cube-outline',
  'self-drive': 'key',
  default: 'layers',
};

const getServiceIcon = (slug) => {
  const key = slug?.toLowerCase() || 'default';
  return SERVICE_ICONS[key] || SERVICE_ICONS.default;
};

export default function VendorServicesScreen({ navigation }) {
  const [allServices, setAllServices] = useState([]);
  const [approvedServiceIds, setApprovedServiceIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Request modal (bulk)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqMessage, setReqMessage] = useState('');
  const [reqExperience, setReqExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Withdraw / Remove confirm modal
  const [actionModal, setActionModal] = useState(null); // { serviceId, serviceName, type: 'request'|'approved' }
  const [actioning, setActioning] = useState(false);

  // Search
  const [search, setSearch] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      const data = await getVendorServices();
      setAllServices(data.allServices || []);
      setApprovedServiceIds(data.approvedServiceIds || []);
      setPendingIds(
        (data.requests || [])
          .filter((r) => r.status === 'PENDING')
          .map((r) => r.serviceId)
      );
    } catch (e) {
      console.error('Failed to fetch services:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  const getStatus = (serviceId) => {
    if (approvedServiceIds.includes(serviceId)) return 'approved';
    if (pendingIds.includes(serviceId)) return 'pending';
    return 'available';
  };

  const filteredServices = search
    ? allServices.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : allServices;

  const availableServices = filteredServices.filter((s) => getStatus(s.id) === 'available');
  const allAvailableSelected =
    availableServices.length > 0 &&
    availableServices.every((s) => selectedIds.includes(s.id));

  const toggleSelect = (serviceId) => {
    if (getStatus(serviceId) !== 'available') return;
    setSelectedIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (allAvailableSelected) {
      setSelectedIds((prev) => prev.filter((id) => !availableServices.map((s) => s.id).includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...availableServices.map((s) => s.id)])]);
    }
  };

  // ── Bulk Request Submit ──────────────────────────────────────────────────
  const handleBulkRequest = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await apiPost('/vendor/services/bulk', {
        serviceIds: selectedIds,
        message: reqMessage,
        experience: reqExperience,
      });
      showSuccess(`${selectedIds.length} service request${selectedIds.length > 1 ? 's' : ''} submitted!`);
    } catch (e) {
      const msg = e?.response?.data?.error || '';
      if (!msg.toLowerCase().includes('already') && !msg.toLowerCase().includes('pending')) {
        showError(msg || 'Failed to submit requests');
      }
    } finally {
      setShowRequestModal(false);
      setSelectedIds([]);
      setReqMessage('');
      setReqExperience('');
      setSubmitting(false);
      setLoading(true);
      fetchServices();
    }
  };

  // ── Withdraw / Remove ────────────────────────────────────────────────────
  const handleActionConfirm = async () => {
    if (!actionModal) return;
    setActioning(true);
    try {
      await apiDelete(
        `/vendor/services?serviceId=${actionModal.serviceId}&type=${actionModal.type}`
      );
      const msg =
        actionModal.type === 'request'
          ? 'Request withdrawn successfully'
          : 'Service removed successfully';
      showSuccess(msg);
      setActionModal(null);
      setLoading(true);
      fetchServices();
    } catch (e) {
      showError(e?.response?.data?.error || 'Failed to process action');
    } finally {
      setActioning(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const approvedCount = approvedServiceIds.length;
  const pendingCount = pendingIds.length;
  const availableCount = allServices.filter((s) => getStatus(s.id) === 'available').length;

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Services</Text>
            <Text style={styles.headerSubtitle}>Manage the services you offer</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#D1FAE5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={22} color={BRAND.green} />
            </View>
            <View>
              <Text style={styles.statLabel}>Approved</Text>
              <Text style={[styles.statNumber, { color: BRAND.green }]}>{approvedCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={22} color={BRAND.yellow} />
            </View>
            <View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statNumber, { color: BRAND.yellow }]}>{pendingCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#DBEAFE' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="add-circle" size={22} color={BRAND.blue} />
            </View>
            <View>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={[styles.statNumber, { color: BRAND.blue }]}>{availableCount}</Text>
            </View>
          </View>
        </View>

        {/* Search + Select All row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={BRAND.subText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor={BRAND.subText}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={BRAND.subText} />
              </TouchableOpacity>
            )}
          </View>
          {availableServices.length > 0 && (
            <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
              <Ionicons
                name={allAvailableSelected ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                size={18}
                color={BRAND.blue}
              />
              <Text style={styles.selectAllText}>
                {allAvailableSelected ? 'Deselect' : 'All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected banner */}
        {selectedIds.length > 0 && (
          <View style={styles.selectedBanner}>
            <Ionicons name="layers" size={16} color={BRAND.blue} />
            <Text style={styles.selectedBannerText}>
              {selectedIds.length} service{selectedIds.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity onPress={() => setSelectedIds([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No services found</Text>
          </View>
        ) : (
          <View style={styles.servicesList}>
            {filteredServices.map((service) => {
              const status = getStatus(service.id);
              const isSelected = selectedIds.includes(service.id);
              const subCount = (service.other_services || []).length;

              const cardBg =
                status === 'approved'
                  ? '#F0FDF4'
                  : status === 'pending'
                  ? '#FFFBEB'
                  : isSelected
                  ? '#EFF6FF'
                  : BRAND.card;

              const cardBorder =
                status === 'approved'
                  ? '#86EFAC'
                  : status === 'pending'
                  ? '#FDE68A'
                  : isSelected
                  ? BRAND.blue
                  : BRAND.border;

              const iconBg =
                status === 'approved'
                  ? '#D1FAE5'
                  : status === 'pending'
                  ? '#FEF3C7'
                  : isSelected
                  ? '#BFDBFE'
                  : '#EFF6FF';

              const iconColor =
                status === 'approved'
                  ? BRAND.green
                  : status === 'pending'
                  ? BRAND.yellow
                  : BRAND.blue;

              return (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={() => toggleSelect(service.id)}
                  activeOpacity={status === 'available' ? 0.7 : 1}
                >
                  {/* Left icon + checkbox */}
                  <View style={[styles.serviceIconWrap, { backgroundColor: iconBg }]}>
                    {status === 'available' ? (
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : getServiceIcon(service.slug)}
                        size={26}
                        color={isSelected ? BRAND.blue : iconColor}
                      />
                    ) : (
                      <Ionicons name={getServiceIcon(service.slug)} size={26} color={iconColor} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.serviceMeta}>
                      {subCount > 0 && (
                        <View style={styles.subCountBadge}>
                          <Text style={styles.subCountText}>{subCount} sub-services</Text>
                        </View>
                      )}
                      {status === 'approved' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                          <Ionicons name="checkmark-circle" size={11} color="#059669" />
                          <Text style={[styles.statusBadgeText, { color: '#059669' }]}>Approved</Text>
                        </View>
                      )}
                      {status === 'pending' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Ionicons name="time" size={11} color="#D97706" />
                          <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>Under Review</Text>
                        </View>
                      )}
                      {status === 'available' && isSelected && (
                        <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                          <Text style={[styles.statusBadgeText, { color: BRAND.blue }]}>Selected</Text>
                        </View>
                      )}
                      {status === 'available' && !isSelected && (
                        <Text style={styles.tapHint}>Tap to select</Text>
                      )}
                    </View>
                  </View>

                  {/* Action buttons */}
                  {status === 'pending' && (
                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        setActionModal({ serviceId: service.id, serviceName: service.name, type: 'request' });
                      }}
                    >
                      <Ionicons name="close-circle" size={14} color="#92400E" />
                      <Text style={styles.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'approved' && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        setActionModal({ serviceId: service.id, serviceName: service.name, type: 'approved' });
                      }}
                    >
                      <Ionicons name="trash" size={14} color="#991B1B" />
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={BRAND.blue} />
          <Text style={styles.infoText}>
            Select services you want to offer and submit a request. Admin will review and approve based on your fleet capabilities.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Request Button */}
      {selectedIds.length > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => setShowRequestModal(true)}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.floatingBtnText}>
              Request {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Request Confirm Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent
        onRequestClose={() => !submitting && setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Request {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                onPress={() => !submitting && setShowRequestModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            {/* Selected chips */}
            <View style={styles.selectedChips}>
              {allServices
                .filter((s) => selectedIds.includes(s.id))
                .map((s) => (
                  <View key={s.id} style={styles.chip}>
                    <Text style={styles.chipText}>{s.name}</Text>
                  </View>
                ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Why do you want to offer these? (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textarea]}
                placeholder="Tell us about your business..."
                placeholderTextColor="#A3B3C2"
                value={reqMessage}
                onChangeText={setReqMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your experience (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textarea]}
                placeholder="How many years? Fleet size?"
                placeholderTextColor="#A3B3C2"
                value={reqExperience}
                onChangeText={setReqExperience}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleBulkRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Withdraw / Remove Confirm Modal ──────────────────────────────── */}
      <Modal
        visible={!!actionModal}
        animationType="fade"
        transparent
        onRequestClose={() => !actioning && setActionModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 24 }]}>
            <View style={styles.actionModalIcon}>
              <Ionicons
                name={actionModal?.type === 'approved' ? 'trash' : 'close-circle'}
                size={32}
                color={actionModal?.type === 'approved' ? BRAND.error : BRAND.yellow}
              />
            </View>
            <Text style={styles.actionModalTitle}>
              {actionModal?.type === 'approved' ? 'Remove Service' : 'Withdraw Request'}
            </Text>
            <Text style={styles.actionModalMsg}>
              {actionModal?.type === 'approved'
                ? `Are you sure you want to remove "${actionModal?.serviceName}"? You will stop receiving bookings for this service. You can request it again later.`
                : `Are you sure you want to withdraw your request for "${actionModal?.serviceName}"? The pending request will be cancelled.`}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setActionModal(null)}
                disabled={actioning}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      actionModal?.type === 'approved' ? BRAND.error : BRAND.yellow,
                  },
                  actioning && styles.submitBtnDisabled,
                ]}
                onPress={handleActionConfirm}
                disabled={actioning}
              >
                {actioning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {actionModal?.type === 'approved' ? 'Yes, Remove' : 'Yes, Withdraw'}
                  </Text>
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
  safe: { flex: 1, backgroundColor: BRAND.bg },
  scrollContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: BRAND.subText },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: BRAND.ink },
  headerSubtitle: { fontSize: 14, color: BRAND.subText, marginTop: 4 },

  statsRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: BRAND.card,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10, color: BRAND.subText },
  statNumber: { fontSize: 17, fontWeight: '800' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: BRAND.ink, padding: 0 },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 5,
  },
  selectAllText: { fontSize: 13, fontWeight: '700', color: BRAND.blue },

  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  selectedBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: BRAND.blue },
  clearText: { fontSize: 13, fontWeight: '700', color: BRAND.blue },

  servicesList: { gap: 10, marginBottom: 16 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontSize: 14, fontWeight: '700', color: BRAND.ink },
  serviceMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  subCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  subCountText: { fontSize: 11, color: BRAND.subText },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  tapHint: { fontSize: 11, color: '#A3B3C2' },

  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
    flexShrink: 0,
  },
  withdrawBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
    flexShrink: 0,
  },
  removeBtnText: { fontSize: 11, fontWeight: '700', color: '#991B1B' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: BRAND.subText, marginTop: 12 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: BRAND.text, lineHeight: 18 },

  // Floating button
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: BRAND.bg,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.blue,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
  },
  floatingBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: BRAND.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: BRAND.ink },
  modalCloseBtn: { padding: 4 },

  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: BRAND.blue },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: BRAND.ink,
    backgroundColor: '#FBFDFF',
  },
  textarea: { height: 80, textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: BRAND.text },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: BRAND.blue,
    gap: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Action modal (withdraw/remove)
  actionModalIcon: { alignItems: 'center', marginBottom: 14 },
  actionModalTitle: { fontSize: 18, fontWeight: '700', color: BRAND.ink, textAlign: 'center', marginBottom: 8 },
  actionModalMsg: { fontSize: 14, color: BRAND.subText, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});
