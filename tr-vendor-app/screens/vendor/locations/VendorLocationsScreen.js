import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showError, showSuccess } from '../../../services/alertService';
import { getVendorLocations, requestLocation, apiDelete } from '../../api/client';

const { width: SW } = Dimensions.get('window');

const C = {
  g600: '#16a34a', g500: '#22c55e', g100: '#dcfce7', g50: '#f0fdf4',
  text: '#0A0F1E', textMid: '#374151', muted: '#6B7280',
  bg: '#F5F7FA', surface: '#FFFFFF', border: '#E8EDF2',
  blue: '#2563EB', blueL: '#EFF6FF',
  red: '#DC2626', redL: '#FEF2F2',
  amber: '#D97706', amberL: '#FFFBEB',
};

export default function VendorLocationsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [approvedLocations, setApprovedLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Request modal
  const [showModal, setShowModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Approved — search, state filter, bulk select
  const [locSearch, setLocSearch] = useState('');
  const [locStateFilter, setLocStateFilter] = useState('');
  const [selectedLocIds, setSelectedLocIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Pending — search, bulk select
  const [pendingSearch, setPendingSearch] = useState('');
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [bulkWithdrawing, setBulkWithdrawing] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await getVendorLocations();
      setRequests(data.requests || []);
      setApprovedLocations(data.approvedLocations || []);
      const flat = [];
      (data.allLocations || []).forEach((loc) => {
        const cities = loc.cities || loc.children || [];
        if (cities.length > 0) {
          cities.forEach((c) => flat.push({ id: c.id, name: c.name, slug: c.slug, type: c.type || 'CITY', parent: { id: loc.id, name: loc.name, type: loc.type } }));
        } else if (loc.type === 'UNION_TERRITORY') {
          flat.push({ id: loc.id, name: loc.name, slug: loc.slug, type: loc.type, parent: { id: null, name: 'Union Territory', type: 'UNION_TERRITORY' } });
        }
      });
      setAllLocations(flat);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchLocations(); }, [fetchLocations]);

  // ── Derived ──────────────────────────────────────────────────────────
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'PENDING'), [requests]);
  const rejectedRequests = useMemo(() => requests.filter((r) => r.status === 'REJECTED'), [requests]);

  const uniqueStates = useMemo(() => [...new Set(approvedLocations.map((l) => l.locations?.parent?.name || '').filter(Boolean))].sort(), [approvedLocations]);

  const filteredApproved = useMemo(() => approvedLocations.filter((l) => {
    const city = (l.locations?.name || '').toLowerCase();
    const state = (l.locations?.parent?.name || '').toLowerCase();
    const q = locSearch.toLowerCase();
    if (locSearch) return city.includes(q) || state.includes(q);
    return !locStateFilter || (l.locations?.parent?.name || '') === locStateFilter;
  }), [approvedLocations, locSearch, locStateFilter]);

  const allApprovedFilteredIds = useMemo(() => filteredApproved.map((l) => l.locationId), [filteredApproved]);
  const allApprovedSelected = allApprovedFilteredIds.length > 0 && allApprovedFilteredIds.every((id) => selectedLocIds.has(id));

  const filteredPending = useMemo(() => pendingRequests.filter((r) => {
    if (!pendingSearch) return true;
    const q = pendingSearch.toLowerCase();
    return (r.locations?.name || '').toLowerCase().includes(q) || (r.locations?.parent?.name || '').toLowerCase().includes(q);
  }), [pendingRequests, pendingSearch]);

  const allPendingFilteredIds = useMemo(() => filteredPending.map((r) => r.locationId), [filteredPending]);
  const allPendingSelected = allPendingFilteredIds.length > 0 && allPendingFilteredIds.every((id) => selectedPendingIds.has(id));

  // ── Select helpers ───────────────────────────────────────────────────
  const toggleApproved = (id) => setSelectedLocIds((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAllApproved = () => {
    if (allApprovedSelected) setSelectedLocIds((p) => { const s = new Set(p); allApprovedFilteredIds.forEach((id) => s.delete(id)); return s; });
    else setSelectedLocIds((p) => { const s = new Set(p); allApprovedFilteredIds.forEach((id) => s.add(id)); return s; });
  };
  const togglePending = (id) => setSelectedPendingIds((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAllPending = () => {
    if (allPendingSelected) setSelectedPendingIds((p) => { const s = new Set(p); allPendingFilteredIds.forEach((id) => s.delete(id)); return s; });
    else setSelectedPendingIds((p) => { const s = new Set(p); allPendingFilteredIds.forEach((id) => s.add(id)); return s; });
  };

  // ── Delete / Withdraw ────────────────────────────────────────────────
  const confirmDelete = (locationId) => Alert.alert('Remove Location', 'Remove this approved location? You will need to re-request approval.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      setDeletingId(locationId);
      try { await apiDelete(`/vendor/locations?locationId=${locationId}&type=approved`); await fetchLocations(); showSuccess('Location removed.'); }
      catch (e) { showError(e?.response?.data?.error || 'Failed to remove'); }
      finally { setDeletingId(null); }
    }},
  ]);

  const confirmBulkDelete = () => {
    const ids = [...selectedLocIds];
    Alert.alert('Remove Locations', `Remove ${ids.length} selected location(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Remove ${ids.length}`, style: 'destructive', onPress: async () => {
        setBulkDeleting(true);
        try { await apiDelete('/vendor/locations', { data: { locationIds: ids, type: 'approved' } }); setSelectedLocIds(new Set()); await fetchLocations(); showSuccess(`${ids.length} location(s) removed.`); }
        catch (e) { showError(e?.response?.data?.error || 'Failed to remove'); }
        finally { setBulkDeleting(false); }
      }},
    ]);
  };

  const confirmWithdraw = (locationId) => Alert.alert('Withdraw Request', 'Withdraw this location request?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Withdraw', style: 'destructive', onPress: async () => {
      setWithdrawingId(locationId);
      try { await apiDelete(`/vendor/locations?locationId=${locationId}&type=request`); await fetchLocations(); showSuccess('Request withdrawn.'); }
      catch (e) { showError(e?.response?.data?.error || 'Failed to withdraw'); }
      finally { setWithdrawingId(null); }
    }},
  ]);

  const confirmBulkWithdraw = () => {
    const ids = [...selectedPendingIds];
    Alert.alert('Withdraw Requests', `Withdraw ${ids.length} request(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Withdraw ${ids.length}`, style: 'destructive', onPress: async () => {
        setBulkWithdrawing(true);
        try { await apiDelete('/vendor/locations', { data: { locationIds: ids, type: 'request' } }); setSelectedPendingIds(new Set()); await fetchLocations(); showSuccess(`${ids.length} request(s) withdrawn.`); }
        catch (e) { showError(e?.response?.data?.error || 'Failed to withdraw'); }
        finally { setBulkWithdrawing(false); }
      }},
    ]);
  };

  // ── Request modal helpers ────────────────────────────────────────────
  const isApproved = (id) => approvedLocations.some((a) => a.locations?.id === id || a.locationId === id);
  const hasPending = (id) => requests.some((r) => r.locations?.id === id || r.locationId === id);

  const toggleModalLoc = (loc) => setSelectedLocations((p) => p.some((l) => l.id === loc.id) ? p.filter((l) => l.id !== loc.id) : [...p, loc]);
  const toggleModalState = (state, locs) => {
    const avail = locs.filter((l) => !isApproved(l.id) && !hasPending(l.id));
    const allSel = avail.every((c) => selectedLocations.some((l) => l.id === c.id));
    if (allSel) setSelectedLocations((p) => p.filter((l) => !avail.some((c) => c.id === l.id)));
    else setSelectedLocations((p) => { const n = [...p]; avail.forEach((c) => { if (!n.some((l) => l.id === c.id)) n.push(c); }); return n; });
  };
  const selectAllModal = () => {
    const avail = allLocations.filter((l) => !isApproved(l.id) && !hasPending(l.id));
    setSelectedLocations(selectedLocations.length === avail.length && avail.length > 0 ? [] : avail);
  };

  const handleRequest = async () => {
    if (!selectedLocations.length) { showError('Select at least one location'); return; }
    setSubmitting(true);
    try {
      for (const loc of selectedLocations) await requestLocation(loc.id, requestMessage);
      setShowModal(false); setSelectedLocations([]); setRequestMessage(''); setModalSearch('');
      fetchLocations(); showSuccess('Request(s) submitted!');
    } catch (e) { showError(e?.response?.data?.error || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const modalFiltered = allLocations.filter((l) => {
    const q = modalSearch.toLowerCase();
    return !q || (l.name || '').toLowerCase().includes(q) || (l.parent?.name || '').toLowerCase().includes(q);
  });
  const grouped = modalFiltered.reduce((a, l) => {
    const k = l.parent?.name || 'Other'; if (!a[k]) a[k] = []; a[k].push(l); return a;
  }, {});

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const availableCount = allLocations.filter((l) => !isApproved(l.id) && !hasPending(l.id)).length;
  const bulkApprovedActive = selectedLocIds.size > 0;
  const bulkPendingActive = selectedPendingIds.size > 0;

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.loadCenter}>
        <ActivityIndicator size="large" color={C.g600} />
        <Text style={s.loadText}>Loading locations...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <LinearGradient colors={['#15803d', '#16a34a', '#22c55e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.heroLabel}>Operational Locations</Text>
              <Text style={s.heroTitle}>My Locations</Text>
            </View>
            <TouchableOpacity style={s.heroBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color={C.g600} />
              <Text style={s.heroBtnText}>Request</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row inside hero */}
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{approvedLocations.length}</Text>
              <View style={s.heroStatRow}>
                <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.heroStatLabel}>Approved</Text>
              </View>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{pendingRequests.length}</Text>
              <View style={s.heroStatRow}>
                <Ionicons name="time" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.heroStatLabel}>Pending</Text>
              </View>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{rejectedRequests.length}</Text>
              <View style={s.heroStatRow}>
                <Ionicons name="close-circle" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.heroStatLabel}>Rejected</Text>
              </View>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>{availableCount}</Text>
              <View style={s.heroStatRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.heroStatLabel}>Available</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Approved Locations ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderLeft}>
              <View style={[s.dot, { backgroundColor: C.g600 }]} />
              <Text style={s.cardTitle}>Approved Locations</Text>
              <View style={[s.countBadge, { backgroundColor: C.g100 }]}>
                <Text style={[s.countBadgeText, { color: C.g600 }]}>{approvedLocations.length}</Text>
              </View>
            </View>
          </View>

          {approvedLocations.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: C.g50 }]}>
                <Ionicons name="location-outline" size={32} color={C.g600} />
              </View>
              <Text style={s.emptyTitle}>No approved locations</Text>
              <Text style={s.emptyText}>Request locations to start receiving bookings</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowModal(true)}>
                <Ionicons name="add-circle-outline" size={16} color={C.g600} />
                <Text style={s.emptyBtnText}>Request First Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Search */}
              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={17} color={C.muted} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search city or state..."
                  placeholderTextColor={C.muted}
                  value={locSearch}
                  onChangeText={(t) => { setLocSearch(t); setSelectedLocIds(new Set()); }}
                />
                {locSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLocSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={17} color={C.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* State chips */}
              {uniqueStates.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                  <TouchableOpacity style={[s.chip, !locStateFilter && s.chipActive]} onPress={() => { setLocStateFilter(''); setSelectedLocIds(new Set()); }}>
                    <Text style={[s.chipText, !locStateFilter && s.chipTextActive]}>All States</Text>
                  </TouchableOpacity>
                  {uniqueStates.map((st) => (
                    <TouchableOpacity key={st} style={[s.chip, locStateFilter === st && s.chipActive]} onPress={() => { setLocStateFilter(locStateFilter === st ? '' : st); setSelectedLocIds(new Set()); }}>
                      <Text style={[s.chipText, locStateFilter === st && s.chipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {filteredApproved.length === 0 ? (
                <View style={s.noMatch}>
                  <Ionicons name="search-outline" size={22} color={C.border} />
                  <Text style={s.noMatchText}>No locations match your filter</Text>
                </View>
              ) : (
                <>
                  {/* Select All row */}
                  <TouchableOpacity style={s.selectAllRow} onPress={toggleAllApproved} activeOpacity={0.7}>
                    <View style={[s.checkbox, allApprovedSelected && s.checkboxActive]}>
                      {allApprovedSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={s.selectAllText}>
                      {allApprovedSelected ? 'Deselect all' : `Select all ${filteredApproved.length}${locStateFilter ? ` · ${locStateFilter}` : ''}`}
                    </Text>
                    {selectedLocIds.size > 0 && (
                      <View style={s.selectedBadge}>
                        <Text style={s.selectedBadgeText}>{selectedLocIds.size} selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {filteredApproved.map((item, idx) => {
                    const loc = item.locations;
                    const isSel = selectedLocIds.has(item.locationId);
                    const isDel = deletingId === item.locationId;
                    const isLast = idx === filteredApproved.length - 1;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.locRow, isSel && s.locRowSelected, isLast && s.locRowLast]}
                        onPress={() => toggleApproved(item.locationId)}
                        activeOpacity={0.75}
                      >
                        <View style={[s.checkbox, isSel && s.checkboxActive]}>
                          {isSel && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                        <View style={s.locIconWrap}>
                          <Ionicons name="location" size={16} color={C.g600} />
                        </View>
                        <View style={s.locInfo}>
                          <Text style={s.locName}>{loc?.name || 'Unknown'}</Text>
                          {loc?.parent?.name && <Text style={s.locState}>{loc.parent.name}</Text>}
                        </View>
                        <TouchableOpacity
                          style={s.actionIconBtn}
                          onPress={() => confirmDelete(item.locationId)}
                          disabled={isDel || bulkDeleting}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {isDel
                            ? <ActivityIndicator size="small" color={C.red} />
                            : <Ionicons name="trash-outline" size={18} color={C.red} />}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* ── Pending Requests ── */}
        {pendingRequests.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardHeaderLeft}>
                <View style={[s.dot, { backgroundColor: C.amber }]} />
                <Text style={s.cardTitle}>Pending Requests</Text>
                <View style={[s.countBadge, { backgroundColor: C.amberL }]}>
                  <Text style={[s.countBadgeText, { color: C.amber }]}>{pendingRequests.length}</Text>
                </View>
              </View>
            </View>

            {pendingRequests.length > 1 && (
              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={17} color={C.muted} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search pending..."
                  placeholderTextColor={C.muted}
                  value={pendingSearch}
                  onChangeText={(t) => { setPendingSearch(t); setSelectedPendingIds(new Set()); }}
                />
                {pendingSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPendingSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={17} color={C.muted} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {filteredPending.length === 0 ? (
              <View style={s.noMatch}>
                <Text style={s.noMatchText}>No requests match your search</Text>
              </View>
            ) : (
              <>
                {pendingRequests.length > 1 && (
                  <TouchableOpacity style={s.selectAllRow} onPress={toggleAllPending} activeOpacity={0.7}>
                    <View style={[s.checkbox, allPendingSelected && s.checkboxActive]}>
                      {allPendingSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={s.selectAllText}>
                      {allPendingSelected ? 'Deselect all' : `Select all ${filteredPending.length}`}
                    </Text>
                    {selectedPendingIds.size > 0 && (
                      <View style={[s.selectedBadge, { backgroundColor: C.amberL }]}>
                        <Text style={[s.selectedBadgeText, { color: C.amber }]}>{selectedPendingIds.size} selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {filteredPending.map((req, idx) => {
                  const loc = req.locations;
                  const isSel = selectedPendingIds.has(req.locationId);
                  const isWd = withdrawingId === req.locationId;
                  const isLast = idx === filteredPending.length - 1;
                  return (
                    <TouchableOpacity
                      key={req.id}
                      style={[s.locRow, isSel && s.locRowSelectedAmber, isLast && s.locRowLast]}
                      onPress={() => pendingRequests.length > 1 && togglePending(req.locationId)}
                      activeOpacity={pendingRequests.length > 1 ? 0.75 : 1}
                    >
                      {pendingRequests.length > 1 && (
                        <View style={[s.checkbox, isSel && s.checkboxAmber]}>
                          {isSel && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                      )}
                      <View style={[s.locIconWrap, { backgroundColor: C.amberL }]}>
                        <Ionicons name="time" size={16} color={C.amber} />
                      </View>
                      <View style={s.locInfo}>
                        <Text style={s.locName}>{loc?.name || 'Unknown'}</Text>
                        <Text style={s.locState}>
                          {loc?.parent?.name ? `${loc.parent.name} · ` : ''}
                          {fmt(req.createdAt)}
                        </Text>
                      </View>
                      <View style={s.pendingRight}>
                        <View style={s.pendingPill}>
                          <Text style={s.pendingPillText}>Pending</Text>
                        </View>
                        <TouchableOpacity
                          style={s.actionIconBtn}
                          onPress={() => confirmWithdraw(req.locationId)}
                          disabled={isWd || bulkWithdrawing}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {isWd
                            ? <ActivityIndicator size="small" color={C.red} />
                            : <Ionicons name="close-circle-outline" size={20} color={C.red} />}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* ── Rejected Requests ── */}
        {rejectedRequests.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardHeaderLeft}>
                <View style={[s.dot, { backgroundColor: C.red }]} />
                <Text style={s.cardTitle}>Rejected Requests</Text>
                <View style={[s.countBadge, { backgroundColor: C.redL }]}>
                  <Text style={[s.countBadgeText, { color: C.red }]}>{rejectedRequests.length}</Text>
                </View>
              </View>
            </View>
            {rejectedRequests.map((req, idx) => {
              const loc = req.locations;
              const isLast = idx === rejectedRequests.length - 1;
              return (
                <View key={req.id} style={[s.locRow, isLast && s.locRowLast, { opacity: 0.8 }]}>
                  <View style={[s.locIconWrap, { backgroundColor: C.redL }]}>
                    <Ionicons name="close-circle" size={16} color={C.red} />
                  </View>
                  <View style={s.locInfo}>
                    <Text style={s.locName}>{loc?.name || 'Unknown'}</Text>
                    <Text style={s.locState}>
                      {loc?.parent?.name ? `${loc.parent.name} · ` : ''}
                      {req.rejectionReason ? `${req.rejectionReason}` : `Rejected ${req.reviewedAt ? fmt(req.reviewedAt) : ''}`}
                    </Text>
                  </View>
                  <View style={s.rejectedPill}>
                    <Text style={s.rejectedPillText}>Rejected</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Info tip */}
        <View style={s.tip}>
          <Ionicons name="information-circle" size={18} color={C.blue} />
          <Text style={s.tipText}>Request locations where you want to operate. Customers in these cities will be able to book your services.</Text>
        </View>

        {/* Continue / Skip */}
        {approvedLocations.length > 0 || requests.length > 0 ? (
          <TouchableOpacity style={s.continueBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'VendorDashboard' }] })} activeOpacity={0.85}>
            <LinearGradient colors={['#15803d', '#22c55e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.continueBtnGrad}>
              <Text style={s.continueBtnText}>Continue to Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.skipBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'VendorDashboard' }] })}>
            <Text style={s.skipBtnText}>Skip for now</Text>
            <Ionicons name="arrow-forward" size={16} color={C.muted} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Sticky Bulk Action Bar ── */}
      {(bulkApprovedActive || bulkPendingActive) && (
        <View style={s.bulkBar}>
          {bulkApprovedActive && (
            <TouchableOpacity style={s.bulkBarBtn} onPress={confirmBulkDelete} disabled={bulkDeleting} activeOpacity={0.85}>
              {bulkDeleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="trash" size={16} color="#fff" /><Text style={s.bulkBarBtnText}>Remove {selectedLocIds.size} Location{selectedLocIds.size > 1 ? 's' : ''}</Text></>}
            </TouchableOpacity>
          )}
          {bulkPendingActive && (
            <TouchableOpacity style={[s.bulkBarBtn, { backgroundColor: C.amber }]} onPress={confirmBulkWithdraw} disabled={bulkWithdrawing} activeOpacity={0.85}>
              {bulkWithdrawing
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="close-circle" size={16} color="#fff" /><Text style={s.bulkBarBtnText}>Withdraw {selectedPendingIds.size} Request{selectedPendingIds.size > 1 ? 's' : ''}</Text></>}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.bulkBarCancel}
            onPress={() => { setSelectedLocIds(new Set()); setSelectedPendingIds(new Set()); }}
          >
            <Ionicons name="close" size={18} color={C.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Request Locations Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Request Locations</Text>
                <Text style={s.modalSubtitle}>{availableCount} cities available</Text>
              </View>
              <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={C.textMid} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={s.modalSearch}>
              <Ionicons name="search-outline" size={17} color={C.muted} />
              <TextInput
                style={s.modalSearchInput}
                placeholder="Search city or state..."
                placeholderTextColor={C.muted}
                value={modalSearch}
                onChangeText={setModalSearch}
                autoCorrect={false}
              />
              {modalSearch.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearch('')}>
                  <Ionicons name="close-circle" size={17} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Select All */}
            <TouchableOpacity style={s.modalSelectAll} onPress={selectAllModal} activeOpacity={0.75}>
              <View style={[s.checkbox, selectedLocations.length === availableCount && availableCount > 0 ? s.checkboxActive : {}]}>
                {selectedLocations.length === availableCount && availableCount > 0 && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={s.modalSelectAllText}>
                {selectedLocations.length === availableCount && availableCount > 0 ? 'Deselect All' : 'Select All Cities'}
              </Text>
              {selectedLocations.length > 0 && (
                <View style={s.modalSelCount}>
                  <Text style={s.modalSelCountText}>{selectedLocations.length} selected</Text>
                  <TouchableOpacity onPress={() => setSelectedLocations([])} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={s.modalClearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            {/* City list */}
            <ScrollView style={s.modalList} showsVerticalScrollIndicator={false}>
              {Object.keys(grouped).length === 0 ? (
                <View style={s.modalEmpty}>
                  <Ionicons name="search-outline" size={40} color={C.border} />
                  <Text style={s.modalEmptyText}>No cities found</Text>
                </View>
              ) : (
                Object.entries(grouped).map(([state, locs]) => {
                  const avail = locs.filter((l) => !isApproved(l.id) && !hasPending(l.id));
                  const allSt = avail.length > 0 && avail.every((c) => selectedLocations.some((l) => l.id === c.id));
                  return (
                    <View key={state} style={s.stateGroup}>
                      <TouchableOpacity style={s.stateRow} onPress={() => toggleModalState(state, locs)} disabled={!avail.length} activeOpacity={0.7}>
                        <View style={[s.checkbox, allSt ? s.checkboxActive : {}, !avail.length && s.checkboxDisabled]}>
                          {allSt && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                        <Text style={[s.stateName, !avail.length && s.stateNameDim]}>{state}</Text>
                        {avail.length > 0 && <Text style={s.stateCount}>{avail.length} available</Text>}
                      </TouchableOpacity>
                      <View style={s.citiesWrap}>
                        {locs.map((loc) => {
                          const app = isApproved(loc.id), pend = hasPending(loc.id);
                          const sel = selectedLocations.some((l) => l.id === loc.id);
                          return (
                            <TouchableOpacity
                              key={loc.id}
                              style={[s.cityPill, app && s.cityPillApproved, pend && !app && s.cityPillPending, sel && s.cityPillSel]}
                              onPress={() => !app && !pend && toggleModalLoc(loc)}
                              disabled={app || pend}
                              activeOpacity={0.75}
                            >
                              {sel ? <Ionicons name="checkmark-circle" size={14} color={C.blue} />
                                : app ? <Ionicons name="checkmark-circle" size={14} color={C.g600} />
                                : pend ? <Ionicons name="time" size={14} color={C.amber} />
                                : <Ionicons name="add-circle-outline" size={14} color={C.muted} />}
                              <Text style={[s.cityPillText, app && s.cityPillTextApp, sel && s.cityPillTextSel]}>{loc.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
              <View style={{ height: 12 }} />
            </ScrollView>

            {/* Optional message */}
            <View style={s.modalMsgWrap}>
              <TextInput
                style={s.modalMsgInput}
                placeholder="Add a note (optional)..."
                placeholderTextColor={C.muted}
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, (!selectedLocations.length || submitting) && s.submitBtnDim]}
              onPress={handleRequest}
              disabled={!selectedLocations.length || submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={!selectedLocations.length || submitting ? ['#86efac', '#86efac'] : ['#15803d', '#22c55e']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.submitBtnGrad}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="send" size={17} color="#fff" />
                    <Text style={s.submitBtnText}>
                      Submit {selectedLocations.length > 0 ? `${selectedLocations.length} Request${selectedLocations.length > 1 ? 's' : ''}` : 'Request'}
                    </Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 120 },
  loadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { marginTop: 12, fontSize: 15, color: C.muted },

  // Hero
  hero: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, marginBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  heroLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  heroBtnText: { fontSize: 14, fontWeight: '700', color: C.g600 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroStat: { flex: 1, alignItems: 'center', gap: 4 },
  heroStatNum: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroStatRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  // Card
  card: { marginHorizontal: 14, marginBottom: 14, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 12, fontWeight: '700' },

  // Empty state
  empty: { padding: 36, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.g600, borderStyle: 'dashed' },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: C.g600 },

  // Search bar
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginTop: 12, marginBottom: 2, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },

  // State chips
  chipsRow: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.blueL, borderColor: C.blue },
  chipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  chipTextActive: { color: C.blue },

  // No match
  noMatch: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 20 },
  noMatchText: { fontSize: 13, color: C.muted },

  // Select all row
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#FAFBFC', borderTopWidth: 1, borderTopColor: C.border },
  selectAllText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.blue },
  selectedBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.blueL, borderRadius: 10 },
  selectedBadgeText: { fontSize: 11, fontWeight: '700', color: C.blue },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: C.blue, borderColor: C.blue },
  checkboxAmber: { backgroundColor: C.amber, borderColor: C.amber },
  checkboxDisabled: { borderColor: C.border, backgroundColor: '#f5f5f5' },

  // Location row
  locRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  locRowSelected: { backgroundColor: '#F0F9FF' },
  locRowSelectedAmber: { backgroundColor: '#FFFBEB' },
  locRowLast: { borderBottomWidth: 0 },
  locIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  locInfo: { flex: 1 },
  locName: { fontSize: 14, fontWeight: '700', color: C.text },
  locState: { fontSize: 12, color: C.muted, marginTop: 1 },
  actionIconBtn: { padding: 4 },

  // Pending
  pendingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingPill: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.amberL, borderRadius: 8 },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: C.amber },
  rejectedPill: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.redL, borderRadius: 8 },
  rejectedPillText: { fontSize: 11, fontWeight: '700', color: C.red },

  // Tip
  tip: { marginHorizontal: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, backgroundColor: C.blueL, borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  tipText: { flex: 1, fontSize: 13, color: C.textMid, lineHeight: 19 },

  // Continue / Skip
  continueBtn: { marginHorizontal: 14, marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
  continueBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  skipBtn: { marginHorizontal: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, gap: 6 },
  skipBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },

  // Bulk bar
  bulkBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 24, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12 },
  bulkBarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.red },
  bulkBarBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bulkBarCancel: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, paddingHorizontal: 18, paddingBottom: 32, maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 13, color: C.muted, marginTop: 3 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  modalSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 12 },
  modalSearchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  modalSelectAll: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8 },
  modalSelectAllText: { fontSize: 14, fontWeight: '600', color: C.blue },
  modalSelCount: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  modalSelCountText: { fontSize: 13, color: C.blue, fontWeight: '600' },
  modalClearText: { fontSize: 12, color: C.red, fontWeight: '700' },
  modalList: { maxHeight: 320 },
  modalEmpty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  modalEmptyText: { fontSize: 14, color: C.muted },
  stateGroup: { marginBottom: 18 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  stateName: { flex: 1, fontSize: 13, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.5 },
  stateNameDim: { color: C.border },
  stateCount: { fontSize: 11, color: C.muted, fontWeight: '600' },
  citiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, gap: 5 },
  cityPillApproved: { backgroundColor: C.g50, borderColor: '#a7f3d0' },
  cityPillPending: { backgroundColor: C.amberL, borderColor: '#fde68a' },
  cityPillSel: { backgroundColor: C.blueL, borderColor: C.blue },
  cityPillText: { fontSize: 13, color: C.textMid },
  cityPillTextApp: { color: C.g600 },
  cityPillTextSel: { color: C.blue, fontWeight: '700' },
  modalMsgWrap: { marginTop: 10, marginBottom: 12 },
  modalMsgInput: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text, backgroundColor: C.bg, minHeight: 60 },
  submitBtn: { borderRadius: 14, overflow: 'hidden' },
  submitBtnDim: { opacity: 0.65 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});
