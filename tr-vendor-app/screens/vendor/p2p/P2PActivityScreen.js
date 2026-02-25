import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getP2PTransactions, getP2PStats,
  startP2PTrip, completeP2PTrip, cancelP2PTransaction,
  submitP2PRating,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1A1A2E', sub: '#64748B',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
  indigo: '#6366F1', sky: '#0EA5E9', emerald: '#059669',
};

// Category config matching web version
const CATEGORY_CONFIG = {
  VEHICLE_SHARED: { label: 'Vehicle Shared', bg: '#DBEAFE', text: '#1D4ED8', accent: C.blue },
  VEHICLE_RECEIVED: { label: 'Vehicle Received', bg: '#E0F2FE', text: '#0369A1', accent: C.sky },
  BOOKING_SHARED: { label: 'Booking Shared', bg: '#F3E8FF', text: '#7C3AED', accent: C.purple },
  BOOKING_RECEIVED: { label: 'Booking Received', bg: '#D1FAE5', text: '#047857', accent: C.emerald },
};

const TRIP_STATUS = {
  PENDING: { label: 'Pending', bg: '#F1F5F9', text: '#475569', icon: 'clock' },
  CONFIRMED: { label: 'Confirmed', bg: '#FEF3C7', text: '#92400E', icon: 'clock' },
  IN_PROGRESS: { label: 'In Progress', bg: '#DBEAFE', text: '#1E40AF', icon: 'play' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', icon: 'x-circle' },
  SETTLED: { label: 'Settled', bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' },
};

const MAIN_TABS = [
  { key: 'VEHICLE', label: 'Vehicle Deals', icon: 'truck' },
  { key: 'BOOKING', label: 'Booking Deals', icon: 'package' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

function fmtPrice(n) {
  return '\u20B9' + Number(n || 0).toLocaleString('en-IN');
}

function getRelativeTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

export default function P2PActivityScreen({ navigation }) {
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [mainTab, setMainTab] = useState('VEHICLE');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Rating modal
  const [ratingModal, setRatingModal] = useState(false);
  const [selTx, setSelTx] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  // Get current vendor ID
  useEffect(() => {
    (async () => {
      try {
        const vid = await AsyncStorage.getItem('vendor_id');
        if (vid) setCurrentVendorId(vid);
      } catch {}
    })();
  }, []);

  const isVendorA = (tx) => currentVendorId && tx.vendorA?.id === currentVendorId;

  const getPartner = (tx) => isVendorA(tx) ? tx.vendorB : tx.vendorA;

  const getMyEarning = (tx) => isVendorA(tx) ? tx.vendorAEarning : tx.vendorBEarning;

  const getCategory = (tx) => {
    if (tx.postingType === 'VEHICLE') {
      return isVendorA(tx) ? 'VEHICLE_SHARED' : 'VEHICLE_RECEIVED';
    }
    return isVendorA(tx) ? 'BOOKING_SHARED' : 'BOOKING_RECEIVED';
  };

  const getMyRole = (tx) => {
    const cat = getCategory(tx);
    switch (cat) {
      case 'VEHICLE_SHARED': return 'You shared your vehicle';
      case 'VEHICLE_RECEIVED': return 'You requested this vehicle';
      case 'BOOKING_SHARED': return 'You shared this booking';
      case 'BOOKING_RECEIVED': return 'You accepted this booking';
      default: return '';
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const params = { page, limit: 20, type: mainTab };
      if (statusFilter !== 'all') params.status = statusFilter;

      const [txRes, statsRes] = await Promise.all([
        getP2PTransactions(params),
        page === 1 ? getP2PStats().catch(() => null) : Promise.resolve(null),
      ]);
      setTransactions(txRes?.transactions || []);
      setPagination(txRes?.pagination || null);
      if (statsRes) setStats(statsRes?.stats || statsRes);
    } catch (e) {
      showAlert('error', 'Error', 'Failed to load activity');
    } finally { setLoading(false); setRefreshing(false); }
  }, [page, mainTab, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { setPage(1); fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchData(); };

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [mainTab, statusFilter]);

  const handleTripAction = async (txId, action) => {
    setActionLoading(txId);
    try {
      if (action === 'start') {
        const res = await startP2PTrip(txId);
        if (res?.startOtp) {
          showAlert('success', 'Trip Started!', `OTP: ${res.startOtp}\nClick "Complete Trip" when done.`);
        } else {
          showAlert('success', 'Done!', 'Trip started successfully');
        }
      } else if (action === 'complete') {
        await completeP2PTrip(txId);
        showAlert('success', 'Done!', 'Trip completed successfully');
      } else if (action === 'cancel') {
        await cancelP2PTransaction(txId);
        showAlert('success', 'Done!', 'Transaction cancelled');
      }
      fetchData();
    } catch (e) {
      showAlert('error', 'Error', `Failed to ${action} trip`);
    } finally { setActionLoading(null); }
  };

  const openRating = (tx) => {
    setSelTx(tx);
    setRating(5);
    setReview('');
    setRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selTx) return;
    setSubmittingRating(true);
    try {
      await submitP2PRating({
        transactionId: selTx.id,
        overallRating: rating,
        review: review.trim() || undefined,
      });
      setRatingModal(false);
      showAlert('success', 'Thanks!', 'Rating submitted successfully');
      fetchData();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to submit rating';
      if (msg.includes('already rated')) {
        showAlert('info', 'Already Rated', 'You have already rated this transaction');
        setRatingModal(false);
      } else {
        showAlert('error', 'Error', msg);
      }
    }
    finally { setSubmittingRating(false); }
  };

  const renderTransaction = ({ item }) => {
    const category = getCategory(item);
    const catCfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.VEHICLE_SHARED;
    const tsc = TRIP_STATUS[item.tripStatus] || TRIP_STATUS.PENDING;
    const partner = getPartner(item);
    const myEarning = getMyEarning(item);
    const roleText = getMyRole(item);
    const isA = isVendorA(item);

    return (
      <View style={[s.card, { borderLeftColor: catCfg.accent }]}>
        {/* Top bar: Category + Status + Time */}
        <View style={s.cardTopBar}>
          <View style={s.cardTopLeft}>
            <View style={[s.categoryBadge, { backgroundColor: catCfg.bg }]}>
              <Text style={[s.categoryText, { color: catCfg.text }]}>{catCfg.label}</Text>
            </View>
            <View style={[s.tripBadge, { backgroundColor: tsc.bg }]}>
              <Icon name={tsc.icon} size={10} color={tsc.text} />
              <Text style={[s.tripBadgeText, { color: tsc.text }]}>{tsc.label}</Text>
            </View>
          </View>
          <Text style={s.timeText}>{getRelativeTime(item.createdAt)}</Text>
        </View>

        {/* Main content */}
        <View style={s.cardBody}>
          <View style={s.cardMainRow}>
            {/* Left icon */}
            <View style={[s.cardIcon, { backgroundColor: catCfg.bg }]}>
              <MCI name={item.postingType === 'VEHICLE' ? 'truck' : 'package-variant'} size={22} color={catCfg.accent} />
            </View>

            {/* Center details */}
            <View style={s.cardDetails}>
              {/* Tx number + Role */}
              <View style={s.txRow}>
                <Text style={s.txNumber}>{item.transactionNumber}</Text>
              </View>
              {!!roleText && <Text style={s.roleText}>{roleText}</Text>}

              {/* Partner */}
              {partner && (
                <View style={s.partnerRow}>
                  <Text style={s.partnerLabel}>Partner:</Text>
                  <View style={s.partnerAvatar}>
                    <Text style={s.partnerInitial}>{partner.businessName?.charAt(0) || '?'}</Text>
                  </View>
                  <Text style={s.partnerName} numberOfLines={1}>{partner.businessName || '-'}</Text>
                  {!!partner.city && <Text style={s.partnerCity}>({partner.city})</Text>}
                </View>
              )}

              {/* Route */}
              <View style={s.routeRow}>
                <MCI name="map-marker" size={14} color={C.blue} />
                <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
                <Icon name="arrow-right" size={12} color={C.muted} />
                <Text style={s.routeCity} numberOfLines={1}>{item.toCity || '-'}</Text>
              </View>

              {/* Info row */}
              <View style={s.infoRow}>
                <View style={s.infoChip}>
                  <Icon name="calendar" size={11} color={C.muted} />
                  <Text style={s.infoText}>{fmtDate(item.tripDate)}</Text>
                </View>
                {!!item.vehicleName && (
                  <View style={s.infoChip}>
                    <MCI name="truck" size={11} color={C.muted} />
                    <Text style={s.infoText} numberOfLines={1}>
                      {item.vehicleName}{item.vehicleNumber ? ` (${item.vehicleNumber})` : ''}
                    </Text>
                  </View>
                )}
                {!!item.driverName && (
                  <View style={s.infoChip}>
                    <Icon name="user" size={11} color={C.muted} />
                    <Text style={s.infoText}>{item.driverName}</Text>
                  </View>
                )}
                {!!item.driverPhone && (
                  <View style={s.infoChip}>
                    <Icon name="phone" size={11} color={C.muted} />
                    <Text style={s.infoText}>{item.driverPhone}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right: Amount */}
            <View style={s.cardAmountCol}>
              <Text style={s.agreedAmt}>{fmtPrice(item.agreedAmount)}</Text>
              {myEarning != null && (
                <>
                  <Text style={s.myEarning}>+{fmtPrice(myEarning)}</Text>
                  <Text style={s.earningLabel}>Your earning</Text>
                </>
              )}
              <View style={s.payStatusWrap}>
                {item.paymentStatus === 'PAID' && <Icon name="check-circle" size={10} color={C.brand} />}
                <Text style={[s.payStatusText, {
                  color: item.paymentStatus === 'PAID' ? C.brand :
                    item.paymentStatus === 'SETTLED' ? C.blue : C.amber,
                }]}>{item.paymentStatus || 'PENDING'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {(item.tripStatus === 'CONFIRMED' || item.tripStatus === 'IN_PROGRESS' || item.tripStatus === 'PENDING' || item.tripStatus === 'COMPLETED') && (
          <View style={s.actionsRow}>
            {/* Start Trip — vendorA only, CONFIRMED */}
            {item.tripStatus === 'CONFIRMED' && isA && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.blue }]}
                onPress={() => handleTripAction(item.id, 'start')}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MCI name="play" size={15} color="#fff" />
                    <Text style={s.actionBtnText}>Start Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Complete Trip — vendorA only, IN_PROGRESS */}
            {item.tripStatus === 'IN_PROGRESS' && isA && (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: C.brand }]}
                onPress={() => handleTripAction(item.id, 'complete')}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Icon name="check-circle" size={14} color="#fff" />
                    <Text style={s.actionBtnText}>Complete Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Cancel — either vendor, PENDING or CONFIRMED */}
            {['PENDING', 'CONFIRMED'].includes(item.tripStatus) && (
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnCancel]}
                onPress={() => handleTripAction(item.id, 'cancel')}
                disabled={actionLoading === item.id}
              >
                <Icon name="x-circle" size={14} color={C.red} />
                <Text style={[s.actionBtnText, { color: C.red }]}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* IN_PROGRESS message for vendorB */}
            {item.tripStatus === 'IN_PROGRESS' && !isA && (
              <View style={[s.actionBtn, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="clock" size={14} color={C.blue} />
                <Text style={[s.actionBtnText, { color: C.blue }]}>Trip in progress...</Text>
              </View>
            )}

            {/* Rate Partner — COMPLETED */}
            {item.tripStatus === 'COMPLETED' && (() => {
              const alreadyRated = (item.p2p_ratings || []).some(r => r.raterVendorId === currentVendorId);
              return alreadyRated ? (
                <View style={[s.actionBtn, { backgroundColor: '#ECFDF5' }]}>
                  <MCI name="star-check" size={15} color={C.brand} />
                  <Text style={[s.actionBtnText, { color: '#065F46' }]}>Rated</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: '#FEF3C7' }]}
                  onPress={() => openRating(item)}
                >
                  <MCI name="star" size={15} color={C.amber} />
                  <Text style={[s.actionBtnText, { color: '#92400E' }]}>Rate Partner</Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>My P2P Activity</Text>
          <Text style={s.headerSub}>Track your transactions & earnings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Grid */}
      {stats && (
        <View style={s.statsGrid}>
          {/* Row 1 */}
          <View style={s.statsGridRow}>
            {/* Earnings - green gradient card */}
            <View style={[s.statCard, s.statEarnings]}>
              <View style={s.statCardRow}>
                <View style={s.statIconGreen}>
                  <MCI name="cash-multiple" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.statEarningsVal}>{fmtPrice(stats.totalEarnings)}</Text>
                  <Text style={s.statEarningsLabel}>Total Earnings</Text>
                </View>
              </View>
            </View>

            {/* Total Deals */}
            <View style={[s.statCard, s.statWhite]}>
              <View style={s.statCardRow}>
                <View style={[s.statIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <MCI name="swap-horizontal" size={18} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.statVal}>{stats.totalTransactions || 0}</Text>
                  <Text style={s.statLabel}>Total Deals</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View style={s.statsGridRow}>
            {/* Completed */}
            <View style={[s.statCard, s.statWhite]}>
              <View style={s.statCardRow}>
                <View style={[s.statIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="check-circle" size={18} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.statVal}>{stats.completedTransactions || 0}</Text>
                  <Text style={s.statLabel}>Completed</Text>
                </View>
              </View>
            </View>

            {/* P2P Rating */}
            <View style={[s.statCard, s.statWhite]}>
              <View style={s.statCardRow}>
                <View style={[s.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <MCI name="star" size={18} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.statVal}>
                    {stats.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A'}
                    {stats.totalRatings ? <Text style={s.ratingCount}> ({stats.totalRatings})</Text> : null}
                  </Text>
                  <Text style={s.statLabel}>P2P Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Main Tabs: Vehicle Deals / Booking Deals */}
      <View style={s.tabContainer}>
        <View style={s.tabRow}>
          {MAIN_TABS.map(t => {
            const active = mainTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[s.tab, active && s.tabActive]}
                onPress={() => setMainTab(t.key)}
              >
                <MCI name={t.icon === 'truck' ? 'truck' : 'package-variant'} size={16} color={active ? C.blue : C.muted} />
                <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                {active && <View style={s.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Filters inside tab container */}
        <View style={s.filterRow}>
          {STATUS_FILTERS.map(f => {
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, active && s.filterChipActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[s.filterText, active && s.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.blue} /></View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: mainTab === 'VEHICLE' ? '#DBEAFE' : '#F3E8FF' }]}>
                <MCI name={mainTab === 'VEHICLE' ? 'truck' : 'package-variant'} size={36}
                  color={mainTab === 'VEHICLE' ? C.blue : C.purple} />
              </View>
              <Text style={s.emptyTitle}>
                {mainTab === 'VEHICLE' ? 'No vehicle deals yet' : 'No booking deals yet'}
              </Text>
              <Text style={s.emptyMsg}>
                {mainTab === 'VEHICLE'
                  ? 'Share your empty vehicles or request vehicles from other vendors to see deals here.'
                  : 'Share bookings you can\'t fulfill or accept bookings from other vendors to see deals here.'}
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: mainTab === 'VEHICLE' ? C.blue : C.purple }]}
                onPress={() => navigation.navigate(mainTab === 'VEHICLE' ? 'BrowseVehiclesScreen' : 'BrowseBookingsScreen')}
              >
                <Text style={s.emptyBtnText}>
                  {mainTab === 'VEHICLE' ? 'Browse Vehicles' : 'Browse Bookings'}
                </Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={totalPages > 1 ? (
            <View style={s.pagination}>
              <Text style={s.pageShowText}>
                Showing <Text style={s.pageBold}>{((pagination?.page || 1) - 1) * 20 + 1}</Text>
                {' - '}
                <Text style={s.pageBold}>{Math.min((pagination?.page || 1) * 20, total)}</Text>
                {' of '}
                <Text style={s.pageBold}>{total}</Text>
              </Text>
              <View style={s.pageButtons}>
                <TouchableOpacity
                  style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                >
                  <Icon name="chevron-left" size={16} color={page <= 1 ? C.muted : C.text} />
                  <Text style={[s.pageBtnText, page <= 1 && { color: C.muted }]}>Prev</Text>
                </TouchableOpacity>
                <Text style={s.pageInfo}>{page} / {totalPages}</Text>
                <TouchableOpacity
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <Text style={[s.pageBtnText, page >= totalPages && { color: C.muted }]}>Next</Text>
                  <Icon name="chevron-right" size={16} color={page >= totalPages ? C.muted : C.text} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        />
      )}

      {/* Rating Modal */}
      <Modal visible={ratingModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setRatingModal(false)} />
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[s.modalIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <MCI name="star" size={18} color={C.amber} />
                </View>
                <Text style={s.modalTitle}>Rate Partner</Text>
              </View>
              <TouchableOpacity onPress={() => setRatingModal(false)} style={s.modalCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSub}>
              {selTx?.transactionNumber} - {getPartner(selTx || {})?.businessName || 'Partner'}
            </Text>

            <Text style={s.formLabel}>OVERALL RATING</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={s.starBtn}>
                  <MCI
                    name={n <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={n <= rating ? C.amber : C.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.ratingLabel}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>

            <Text style={s.formLabel}>REVIEW (Optional)</Text>
            <TextInput
              style={s.reviewInput}
              value={review}
              onChangeText={setReview}
              placeholder="Share your experience with this partner..."
              placeholderTextColor={C.muted}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[s.submitBtn, submittingRating && { opacity: 0.6 }]}
              onPress={handleSubmitRating}
              disabled={submittingRating}
            >
              {submittingRating ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <MCI name="star-check" size={18} color="#fff" />
                  <Text style={s.submitBtnText}>Submit Rating</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header - gradient style
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: C.blue,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Stats Grid
  statsGrid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  statsGridRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statWhite: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  statEarnings: { backgroundColor: '#059669' },
  statCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconGreen: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statIconCircle: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  statEarningsVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statEarningsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  statVal: { fontSize: 17, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: '500' },
  ratingCount: { fontSize: 12, fontWeight: '400', color: C.muted },

  // Tabs
  tabContainer: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, position: 'relative',
  },
  tabActive: { backgroundColor: 'rgba(59,130,246,0.04)' },
  tabText: { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.blue, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, backgroundColor: C.blue, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Filters
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: C.blue },
  filterText: { fontSize: 12, fontWeight: '600', color: C.sub },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  // List
  list: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 14, marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Card top bar
  cardTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FAFBFC',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: '700' },
  tripBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tripBadgeText: { fontSize: 10, fontWeight: '600' },
  timeText: { fontSize: 10, color: C.muted },

  // Card body
  cardBody: { paddingHorizontal: 14, paddingVertical: 12 },
  cardMainRow: { flexDirection: 'row', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardDetails: { flex: 1, gap: 6 },

  // Tx row
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txNumber: { fontSize: 13, fontWeight: '700', color: C.text, fontFamily: 'monospace' },
  roleText: { fontSize: 11, color: C.muted, fontStyle: 'italic' },

  // Partner
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partnerLabel: { fontSize: 11, color: C.muted },
  partnerAvatar: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center',
  },
  partnerInitial: { fontSize: 9, fontWeight: '700', color: '#fff' },
  partnerName: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },
  partnerCity: { fontSize: 11, color: C.muted },

  // Route
  routeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8FAFC', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  routeCity: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },

  // Info
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: C.sub },

  // Amount column
  cardAmountCol: { alignItems: 'flex-end', paddingLeft: 8, minWidth: 85 },
  agreedAmt: { fontSize: 15, fontWeight: '800', color: C.text },
  myEarning: { fontSize: 13, fontWeight: '700', color: C.brand, marginTop: 2 },
  earningLabel: { fontSize: 9, color: C.muted, marginTop: 1 },
  payStatusWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  payStatusText: { fontSize: 10, fontWeight: '600' },

  // Actions
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  actionBtnCancel: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Pagination
  pagination: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: C.border,
  },
  pageShowText: { fontSize: 12, color: C.sub, textAlign: 'center', marginBottom: 10 },
  pageBold: { fontWeight: '700', color: C.text },
  pageButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  pageInfo: { fontSize: 13, fontWeight: '600', color: C.sub, paddingHorizontal: 6 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalSub: { fontSize: 13, color: C.muted, marginBottom: 16, marginLeft: 46 },
  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: C.amber, textAlign: 'center', marginBottom: 4 },
  reviewInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, height: 90,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.amber, paddingVertical: 14, borderRadius: 14, marginTop: 20,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
