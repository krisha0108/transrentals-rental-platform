// screens/vendor/services/VendorServicesScreen.js
// REDESIGNED — "Elevate" visual language, matching
// screens/vendor/profile/BusinessProfileScreen.js and
// screens/vendor/documents/VendorDocumentsScreen.js (same app, same session).
//
// UI ONLY. All behaviour is preserved exactly: same GET (getVendorServices) /
// POST (bulk request) / DELETE (withdraw / remove) calls, same status logic,
// same select-all / multi-select / search behaviour, same navigation targets.
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
  StatusBar,
  KeyboardAvoidingView,
  Platform,
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
import { SC as T, G, rs, rf, shade, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already used everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
// Follows the same construction VendorDocumentsScreen.js (sibling folder) uses.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  yellow: T.amber, yellowL: T.amberLight,
  red: T.red, redL: T.redLight,
  green: T.emerald600, greenL: T.tintEmerald,
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

// Hero ↔ stats-card spacing — the card is pulled up by STATS_OVERLAP so it
// tucks into the hero's rounded bottom curve, matching VendorDocumentsScreen /
// BookingsListScreen.
const HERO_TAIL = rs(26);
const STATS_OVERLAP = rs(22);

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
      <View style={st.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={st.heroLoading}>
          <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
          <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: rs(16) }}>
            <View style={st.heroNav}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={st.heroMid}>
                <View style={st.heroBadge}>
                  <Ionicons name="layers-outline" size={11} color={C.g400} />
                  <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
                </View>
                <Text style={st.heroTitle}>My Services</Text>
              </View>
              <View style={{ width: rs(40) }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading services...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO — static sibling so it can never be clipped by the
          ScrollView's own viewport ── */}
      <LinearGradient colors={G.hero} style={st.hero}>
        <AnimatedOrb style={st.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={st.orbB} delay={900} dx={-12} dy={10} />

        <SafeAreaView edges={['top']} style={{ paddingHorizontal: rs(16) }}>
          <View style={st.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={st.heroMid}>
              <View style={st.heroBadge}>
                <Ionicons name="layers-outline" size={11} color={C.g400} />
                <Text style={st.heroBadgeTxt}>Vendor Portal</Text>
              </View>
              <Text style={st.heroTitle}>My Services</Text>
              <Text style={st.heroSub}>Manage your offerings</Text>
            </View>
            <View style={{ width: rs(40) }} />
          </View>

          {/* spacer so the floating stats card can tuck into the curve */}
          <View style={{ height: HERO_TAIL }} />
        </SafeAreaView>
      </LinearGradient>

      {/* ── Stats card tucked into the hero curve — static sibling, never
          the first child inside the ScrollView ── */}
      <View style={st.statsWrap}>
        <View style={[st.statsCard, cardShadow]}>
          {[
            { value: approvedCount, label: 'Approved', icon: 'checkmark-circle', color: C.green },
            { value: pendingCount, label: 'Pending', icon: 'time', color: C.yellow },
            { value: availableCount, label: 'Available', icon: 'add-circle', color: C.blue },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={st.statDivider} />}
              <View style={st.statCell}>
                <Ionicons name={s.icon} size={rs(15)} color={s.color} />
                <Text style={[st.statValue, { color: s.color }]} numberOfLines={1}>{s.value}</Text>
                <Text style={st.statLabel} numberOfLines={1}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={st.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Search + Select All row */}
        <View style={st.searchRow}>
          <View style={st.searchBox}>
            <Ionicons name="search" size={16} color={C.muted} />
            <TextInput
              style={st.searchInput}
              placeholder="Search services..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
          {availableServices.length > 0 && (
            <TouchableOpacity style={st.selectAllBtn} onPress={handleSelectAll}>
              <Ionicons
                name={allAvailableSelected ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                size={16}
                color={C.blue}
              />
              <Text style={st.selectAllText}>
                {allAvailableSelected ? 'Deselect' : 'All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected banner */}
        {selectedIds.length > 0 && (
          <View style={st.selectedBanner}>
            <Ionicons name="layers" size={15} color={C.blue} />
            <Text style={st.selectedBannerText}>
              {selectedIds.length} service{selectedIds.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity onPress={() => setSelectedIds([])}>
              <Text style={st.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Services List */}
        {filteredServices.length === 0 ? (
          <View style={st.emptyState}>
            <Ionicons name="layers-outline" size={rs(44)} color={C.muted} />
            <Text style={st.emptyTitle}>No services found</Text>
          </View>
        ) : (
          <View style={st.servicesList}>
            {filteredServices.map((service) => {
              const status = getStatus(service.id);
              const isSelected = selectedIds.includes(service.id);
              const subCount = (service.other_services || []).length;

              const cardBg =
                status === 'approved'
                  ? C.card
                  : status === 'pending'
                  ? C.yellowL
                  : isSelected
                  ? C.blueL
                  : C.card;

              const cardBorder =
                status === 'approved'
                  ? C.g100
                  : status === 'pending'
                  ? C.yellow + '40'
                  : isSelected
                  ? C.blue
                  : C.border;

              const iconBg =
                status === 'approved'
                  ? C.g50
                  : status === 'pending'
                  ? C.yellowL
                  : isSelected
                  ? shade(C.blueL, -6)
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
                  style={[st.serviceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={() => toggleSelect(service.id)}
                  activeOpacity={status === 'available' ? 0.7 : 1}
                >
                  {/* Left icon + checkbox */}
                  <View style={[st.serviceIconWrap, { backgroundColor: iconBg }]}>
                    {status === 'available' ? (
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : getServiceIcon(service.slug)}
                        size={24}
                        color={isSelected ? C.blue : iconColor}
                      />
                    ) : (
                      <Ionicons name={getServiceIcon(service.slug)} size={24} color={iconColor} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={st.serviceInfo}>
                    <Text style={st.serviceName}>{service.name}</Text>
                    <View style={st.serviceMeta}>
                      {subCount > 0 && (
                        <View style={st.subCountBadge}>
                          <Text style={st.subCountText}>{subCount} sub-services</Text>
                        </View>
                      )}
                      {status === 'approved' && (
                        <View style={[st.statusBadge, { backgroundColor: C.g100 }]}>
                          <Ionicons name="checkmark-circle" size={11} color={C.g600} />
                          <Text style={[st.statusBadgeText, { color: C.g600 }]}>Approved</Text>
                        </View>
                      )}
                      {status === 'pending' && (
                        <View style={[st.statusBadge, { backgroundColor: C.yellowL }]}>
                          <Ionicons name="time" size={11} color={C.yellow} />
                          <Text style={[st.statusBadgeText, { color: C.yellow }]}>Under Review</Text>
                        </View>
                      )}
                      {status === 'available' && isSelected && (
                        <View style={[st.statusBadge, { backgroundColor: shade(C.blueL, -6) }]}>
                          <Text style={[st.statusBadgeText, { color: C.blue }]}>Selected</Text>
                        </View>
                      )}
                      {status === 'available' && !isSelected && (
                        <Text style={st.tapHint}>Tap to select</Text>
                      )}
                    </View>
                  </View>

                  {/* Action buttons */}
                  {status === 'pending' && (
                    <TouchableOpacity
                      style={st.withdrawBtn}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        setActionModal({ serviceId: service.id, serviceName: service.name, type: 'request' });
                      }}
                    >
                      <Ionicons name="close-circle" size={13} color={C.yellow} />
                      <Text style={st.withdrawBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  )}
                  {status === 'approved' && (
                    <TouchableOpacity
                      style={st.removeBtn}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        setActionModal({ serviceId: service.id, serviceName: service.name, type: 'approved' });
                      }}
                    >
                      <Ionicons name="trash" size={13} color={C.red} />
                      <Text style={st.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Info note */}
        <View style={st.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={C.blue} />
          <Text style={st.infoText}>
            Select services you want to offer and submit a request. Admin will review and approve based on your fleet capabilities.
          </Text>
        </View>

        {/* Skip / Go to Dashboard — mirrors the same CTA on the documents
            screen so a vendor in the onboarding flow can leave this step
            and reach the dashboard at any time. */}
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorDashboard')}
          style={st.goDashboardBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={18} color={C.g700} />
          <Text style={st.goDashboardBtnTxt}>Skip & Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={16} color={C.g700} />
        </TouchableOpacity>

        <View style={{ height: rs(24) }} />
      </ScrollView>

      {/* Floating Request Button */}
      {selectedIds.length > 0 && (
        <View style={st.floatingBar}>
          <TouchableOpacity style={st.floatingBtn} onPress={() => setShowRequestModal(true)} activeOpacity={0.85}>
            <LinearGradient
              colors={G.emerald}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={st.floatingBtnGrad}
            >
              <Ionicons name="send" size={17} color="#fff" />
              <Text style={st.floatingBtnText}>
                Request {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Request Confirm Modal ─────────────────────────────────────────
          Modal → modalOverlay (T.scrim) → modalContent (maxHeight, overflow
          hidden, SHEET_RADIUS) → sheetHandle → single ScrollView wrapping
          header + body + actions. ── */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent
        onRequestClose={() => !submitting && setShowRequestModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.sheetHandleWrap}><View style={st.sheetHandle} /></View>

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: rs(24) }} keyboardShouldPersistTaps="handled">
              <View style={st.modalHeader}>
                <Text style={st.modalTitle}>
                  Request {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => !submitting && setShowRequestModal(false)}
                  style={st.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <View style={st.modalBody}>
                {/* Selected chips */}
                <View style={st.selectedChips}>
                  {allServices
                    .filter((s) => selectedIds.includes(s.id))
                    .map((s) => (
                      <View key={s.id} style={st.chip}>
                        <Text style={st.chipText}>{s.name}</Text>
                      </View>
                    ))}
                </View>

                <View style={st.inputGroup}>
                  <Text style={st.inputLabel}>Why do you want to offer these? <Text style={st.inputOptional}>(Optional)</Text></Text>
                  <TextInput
                    style={[st.textInput, st.textarea]}
                    placeholder="Tell us about your business..."
                    placeholderTextColor={C.muted}
                    value={reqMessage}
                    onChangeText={setReqMessage}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={st.inputGroup}>
                  <Text style={st.inputLabel}>Your experience <Text style={st.inputOptional}>(Optional)</Text></Text>
                  <TextInput
                    style={[st.textInput, st.textarea]}
                    placeholder="How many years? Fleet size?"
                    placeholderTextColor={C.muted}
                    value={reqExperience}
                    onChangeText={setReqExperience}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={st.modalActions}>
                  <TouchableOpacity
                    style={st.cancelBtn}
                    onPress={() => setShowRequestModal(false)}
                    disabled={submitting}
                  >
                    <Text style={st.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.submitWrap, submitting && st.submitBtnDisabled]}
                    onPress={handleBulkRequest}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={G.emerald} style={st.submitBtn}>
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="send" size={15} color="#fff" />
                          <Text style={st.submitBtnText}>Submit Request</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Withdraw / Remove Confirm Modal ──────────────────────────────── */}
      <Modal
        visible={!!actionModal}
        animationType="fade"
        transparent
        onRequestClose={() => !actioning && setActionModal(null)}
      >
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.sheetHandleWrap}><View style={st.sheetHandle} /></View>

            <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: rs(24) }}>
              <View style={st.modalBody}>
                <View style={st.actionModalIcon}>
                  <Ionicons
                    name={actionModal?.type === 'approved' ? 'trash' : 'close-circle'}
                    size={30}
                    color={actionModal?.type === 'approved' ? C.red : C.yellow}
                  />
                </View>
                <Text style={st.actionModalTitle}>
                  {actionModal?.type === 'approved' ? 'Remove Service' : 'Withdraw Request'}
                </Text>
                <Text style={st.actionModalMsg}>
                  {actionModal?.type === 'approved'
                    ? `Are you sure you want to remove "${actionModal?.serviceName}"? You will stop receiving bookings for this service. You can request it again later.`
                    : `Are you sure you want to withdraw your request for "${actionModal?.serviceName}"? The pending request will be cancelled.`}
                </Text>

                <View style={st.modalActions}>
                  <TouchableOpacity
                    style={st.cancelBtn}
                    onPress={() => setActionModal(null)}
                    disabled={actioning}
                  >
                    <Text style={st.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      st.submitBtn,
                      {
                        backgroundColor:
                          actionModal?.type === 'approved' ? C.red : C.yellow,
                      },
                      actioning && st.submitBtnDisabled,
                    ]}
                    onPress={handleActionConfirm}
                    disabled={actioning}
                  >
                    {actioning ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={st.submitBtnText}>
                        {actionModal?.type === 'approved' ? 'Yes, Remove' : 'Yes, Withdraw'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: rs(16), paddingTop: rs(16), paddingBottom: rs(100) },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: rs(10) },
  loaderTxt: { fontSize: rf(14), color: C.muted },

  /* ── Hero ── */
  hero: {
    paddingBottom: rs(8),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  heroLoading: {
    paddingBottom: rs(14),
    borderBottomLeftRadius: rs(26),
    borderBottomRightRadius: rs(26),
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute', top: -rs(60), right: -rs(40),
    width: rs(180), height: rs(180), borderRadius: rs(90),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orbB: {
    position: 'absolute', bottom: -rs(60), left: -rs(40),
    width: rs(150), height: rs(150), borderRadius: rs(75),
    backgroundColor: 'rgba(46,158,120,0.16)',
  },

  heroNav: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), marginTop: rs(6), paddingTop: rs(4) },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginTop: rs(2),
  },
  heroMid: { flex: 1, alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center',
    paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: 20, marginBottom: rs(5),
  },
  heroBadgeTxt: { fontFamily: DISPLAY, fontSize: rf(11), fontWeight: '600', color: C.g400 },
  heroTitle: { fontFamily: DISPLAY, fontSize: rf(20), fontWeight: '800', color: '#fff', textAlign: 'center' },
  heroSub: { fontSize: rf(12), color: 'rgba(255,255,255,0.65)', marginTop: rs(3), textAlign: 'center' },

  /* ── Stats card tucked into the hero curve ── */
  statsWrap: { marginHorizontal: rs(16), marginTop: -STATS_OVERLAP },
  statsCard: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: rs(16),
    paddingVertical: rs(12), paddingHorizontal: rs(6),
    borderWidth: 1, borderColor: T.glassBorder,
  },
  statCell: { flex: 1, alignItems: 'center', gap: rs(2) },
  statValue: { fontFamily: DISPLAY, fontSize: rf(16), fontWeight: '800' },
  statLabel: { fontFamily: DISPLAY, fontSize: rf(9.5), color: C.muted, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: rs(2) },

  /* ── Search + select all ── */
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(14) },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: rs(14),
    paddingVertical: rs(11),
    gap: rs(8),
  },
  searchInput: { flex: 1, fontSize: rf(14), color: C.text, padding: 0, fontWeight: '500' },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueL,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: rs(11),
    borderWidth: 1,
    borderColor: C.blue + '30',
    gap: rs(6),
  },
  selectAllText: { fontSize: rf(13), fontWeight: '700', color: C.blue },

  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueL,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    marginBottom: rs(14),
    borderWidth: 1,
    borderColor: C.blue + '30',
    gap: rs(8),
  },
  selectedBannerText: { flex: 1, fontSize: rf(13), fontWeight: '600', color: C.blue },
  clearText: { fontSize: rf(13), fontWeight: '700', color: C.blue },

  /* ── Service cards ── */
  servicesList: { gap: rs(12), marginBottom: rs(18) },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(14),
    borderRadius: rs(16),
    borderWidth: 1,
    gap: rs(12),
    ...cardShadow,
  },
  serviceIconWrap: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  serviceMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: rs(8), marginTop: rs(4) },
  subCountBadge: {
    backgroundColor: C.bg,
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(8),
  },
  subCountText: { fontSize: rf(11), fontWeight: '500', color: C.sub },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(8),
    paddingVertical: rs(2),
    borderRadius: 20,
    gap: rs(3),
  },
  statusBadgeText: { fontSize: rf(11), fontWeight: '600' },
  tapHint: { fontSize: rf(11), color: C.muted, fontWeight: '500' },

  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rs(7),
    borderRadius: rs(8),
    backgroundColor: C.yellowL,
    borderWidth: 1,
    borderColor: C.yellow + '40',
    gap: rs(4),
    flexShrink: 0,
  },
  withdrawBtnText: { fontSize: rf(11), fontWeight: '700', color: C.yellow },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    paddingVertical: rs(7),
    borderRadius: rs(8),
    backgroundColor: C.redL,
    borderWidth: 1,
    borderColor: C.red + '30',
    gap: rs(4),
    flexShrink: 0,
  },
  removeBtnText: { fontSize: rf(11), fontWeight: '700', color: C.red },

  emptyState: { alignItems: 'center', paddingVertical: rs(60) },
  emptyTitle: { fontSize: rf(15), fontWeight: '600', color: C.muted, marginTop: rs(12) },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.blueL,
    borderRadius: rs(14),
    padding: rs(16),
    gap: rs(12),
  },
  infoText: { flex: 1, fontSize: rf(13), color: C.text, lineHeight: rf(18), fontWeight: '500' },

  // Secondary CTA at end of scroll — quieter than the floating Request
  // button so it doesn't pull focus from the primary action when the
  // vendor has selections, but reachable otherwise.
  goDashboardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    marginTop: rs(12), paddingVertical: rs(14),
    backgroundColor: C.card, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  goDashboardBtnTxt: { fontSize: rf(14), fontWeight: '700', color: C.text, letterSpacing: 0.2 },

  /* ── Floating button ── */
  floatingBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: rs(16),
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: rs(8),
    elevation: 10,
  },
  floatingBtn: {
    borderRadius: rs(14),
    overflow: 'hidden',
  },
  floatingBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(16),
    gap: rs(8),
  },
  floatingBtnText: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff' },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.card,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetHandleWrap: { alignItems: 'center', paddingTop: rs(10) },
  sheetHandle: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(24),
    paddingTop: rs(14),
    paddingBottom: rs(18),
  },
  modalTitle: { flex: 1, fontFamily: DISPLAY, fontSize: rf(17), fontWeight: '800', color: C.text },
  modalCloseBtn: { width: rs(32), height: rs(32), borderRadius: rs(10), backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: rs(24), paddingBottom: rs(10) },

  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginBottom: rs(18) },
  chip: {
    paddingHorizontal: rs(14),
    paddingVertical: rs(6),
    backgroundColor: C.blueL,
    borderRadius: 20,
  },
  chipText: { fontSize: rf(13), fontWeight: '600', color: C.blue },

  inputGroup: { marginBottom: rs(16) },
  inputLabel: { fontSize: rf(13), fontWeight: '700', color: C.sub, marginBottom: rs(8) },
  inputOptional: { fontSize: rf(12), fontWeight: '500', color: C.muted },
  textInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: rs(12),
    paddingHorizontal: rs(14),
    paddingVertical: rs(12),
    fontSize: rf(14),
    color: C.text,
    backgroundColor: T.ivory,
  },
  textarea: { height: rs(100), textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', gap: rs(12), marginTop: rs(12) },
  cancelBtn: {
    flex: 1,
    paddingVertical: rs(15),
    borderRadius: rs(12),
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: rf(15), fontWeight: '700', color: C.text },
  submitWrap: { flex: 1, borderRadius: rs(12), overflow: 'hidden' },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: rs(15),
    borderRadius: rs(12),
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: DISPLAY, fontSize: rf(15), fontWeight: '700', color: '#fff' },

  actionModalIcon: {
    alignItems: 'center',
    marginTop: rs(4),
    marginBottom: rs(16),
  },
  actionModalTitle: {
    fontFamily: DISPLAY,
    fontSize: rf(20),
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: rs(12),
  },
  actionModalMsg: {
    fontSize: rf(14),
    color: C.sub,
    textAlign: 'center',
    lineHeight: rf(22),
    marginBottom: rs(24),
  },
});
