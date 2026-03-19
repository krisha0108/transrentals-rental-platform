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
import LinearGradient from 'react-native-linear-gradient';
import { showError, showSuccess } from '../../../services/alertService';
import {
  getVendorServices,
  apiPost,
  apiDelete,
} from '../../api/client';

// ── Design tokens matching DashboardScreen ───────────────────────
const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399',
  g100: '#D1FAE5', g50:  '#ECFDF5',
  bg:     '#F1F5F9', // Light grayish-blue for background
  card:   '#FFFFFF',
  border: '#E2E8F0',
  text:   '#0F172A',
  sub:    '#475569',
  muted:  '#94A3B8',
  blue:   '#2563EB', blueL:   '#EFF6FF',
  yellow: '#F59E0B',
  red:    '#EF4444',
  green:  '#10B981',
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
      <View style={styles.safe}>
        <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={styles.headerGrad}>
          <SafeAreaView edges={['top']}>
             <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Services</Text>
                <View style={{ width: 40 }} />
             </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      {/* HEADER */}
      <LinearGradient colors={[C.g900, '#064E3B', C.g700]} style={styles.headerGrad}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>My Services</Text>
              <Text style={styles.headerSubtitle}>Manage your offerings</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: C.g100 }]}>
            <View style={[styles.statIcon, { backgroundColor: C.g100 }]}>
              <Ionicons name="checkmark-circle" size={20} color={C.green} />
            </View>
            <View>
              <Text style={styles.statLabel}>Approved</Text>
              <Text style={[styles.statNumber, { color: C.green }]}>{approvedCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color={C.yellow} />
            </View>
            <View>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statNumber, { color: C.yellow }]}>{pendingCount}</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: C.blueL }]}>
            <View style={[styles.statIcon, { backgroundColor: C.blueL }]}>
              <Ionicons name="add-circle" size={20} color={C.blue} />
            </View>
            <View>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={[styles.statNumber, { color: C.blue }]}>{availableCount}</Text>
            </View>
          </View>
        </View>

        {/* Search + Select All row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
          {availableServices.length > 0 && (
            <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
              <Ionicons
                name={allAvailableSelected ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                size={18}
                color={C.blue}
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
            <Ionicons name="layers" size={16} color={C.blue} />
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
            <Ionicons name="layers-outline" size={48} color={C.muted} />
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
                  ? C.card
                  : status === 'pending'
                  ? '#FFFBEB'
                  : isSelected
                  ? C.blueL
                  : C.card;

              const cardBorder =
                status === 'approved'
                  ? C.g100
                  : status === 'pending'
                  ? '#FDE68A'
                  : isSelected
                  ? C.blue
                  : C.border;

              const iconBg =
                status === 'approved'
                  ? C.g50
                  : status === 'pending'
                  ? '#FEF3C7'
                  : isSelected
                  ? '#BFDBFE'
                  : C.blueL;

              const iconColor =
                status === 'approved'
                  ? C.g600
                  : status === 'pending'
                  ? C.yellow
                  : C.blue;

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
                        color={isSelected ? C.blue : iconColor}
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
                          <Text style={[styles.statusBadgeText, { color: C.blue }]}>Selected</Text>
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
          <Ionicons name="information-circle-outline" size={20} color={C.blue} />
          <Text style={styles.infoText}>
            Select services you want to offer and submit a request. Admin will review and approve based on your fleet capabilities.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Request Button */}
      {selectedIds.length > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => setShowRequestModal(true)} activeOpacity={0.8}>
            <LinearGradient 
              colors={[C.blue, '#2D5CEB']}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
              style={styles.floatingBtnGrad}
            >
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.floatingBtnText}>
                Request {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
              </Text>
            </LinearGradient>
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
                <Ionicons name="close" size={22} color={C.text} />
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
                color={actionModal?.type === 'approved' ? C.red : C.yellow}
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
                      actionModal?.type === 'approved' ? C.red : C.yellow,
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
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: C.sub },

  /* Header matches Dashboard pattern */
  headerGrad: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  statsRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  statCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: '500' },
  statNumber: { fontSize: 20, fontWeight: '800' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueL,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 6,
  },
  selectAllText: { fontSize: 13, fontWeight: '700', color: C.blue },

  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueL,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  selectedBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.blue },
  clearText: { fontSize: 13, fontWeight: '700', color: C.blue },

  servicesList: { gap: 12, marginBottom: 20 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  serviceMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  subCountBadge: {
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subCountText: { fontSize: 11, fontWeight: '500', color: C.sub },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  tapHint: { fontSize: 11, color: C.muted, fontWeight: '500' },

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
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.muted, marginTop: 12 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.blueL,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18, fontWeight: '500' },

  // Floating button
  floatingBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  floatingBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  floatingBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalCloseBtn: { padding: 4 },

  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.blueL,
    borderRadius: 20,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: C.blue },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
  },
  textarea: { height: 100, textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: C.text },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  actionModalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  actionModalMsg: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
