import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  getP2PTransactions, getP2PStats,
  startP2PTrip, completeP2PTrip, cancelP2PTransaction,
  submitP2PRating,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald, g300: T.oceanLight,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText,
  border: T.border,
  amber: T.amber, amberBg: T.amberLight,
  red: T.red, redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight, blueDark: '#1D4ED8',
  purple: T.purple, purpleBg: T.tintPlum,
  sky: T.blue, skyBg: T.blueLight,
};

const CATEGORY_CONFIG = {
  VEHICLE_SHARED:   { label: 'Vehicle Shared',   bg: '#DBEAFE', text: '#1D4ED8', accent: C.blue },
  VEHICLE_RECEIVED: { label: 'Vehicle Received',  bg: '#E0F2FE', text: '#0369A1', accent: C.sky },
  BOOKING_SHARED:   { label: 'Booking Shared',    bg: '#F5F3FF', text: '#7C3AED', accent: C.purple },
  BOOKING_RECEIVED: { label: 'Booking Received',  bg: '#D1FAE5', text: '#047857', accent: C.g700 },
};

const TRIP_STATUS = {
  PENDING:     { label: 'Pending',     bg: '#F1F5F9', text: '#475569', icon: 'clock' },
  CONFIRMED:   { label: 'Confirmed',   bg: '#FFFBEB', text: '#92400E', icon: 'clock' },
  IN_PROGRESS: { label: 'In Progress', bg: '#EFF6FF', text: '#1E40AF', icon: 'play' },
  COMPLETED:   { label: 'Completed',   bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FEF2F2', text: '#991B1B', icon: 'x-circle' },
  SETTLED:     { label: 'Settled',     bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' },
};

const MAIN_TABS = [
  { key: 'VEHICLE', label: 'Vehicle Deals', icon: 'truck' },
  { key: 'BOOKING', label: 'Booking Deals', icon: 'package' },
];

const STATUS_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'IN_PROGRESS', label: 'Active' },
  { key: 'COMPLETED',   label: 'Completed' },
  { key: 'CANCELLED',   label: 'Cancelled' },
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
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats]               = useState(null);
  const [mainTab, setMainTab]           = useState('VEHICLE');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Rating modal
  const [ratingModal, setRatingModal]           = useState(false);
  const [selTx, setSelTx]                       = useState(null);
  const [rating, setRating]                     = useState(5);
  const [review, setReview]                     = useState('');
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

  const isVendorA  = (tx) => currentVendorId && tx.vendorA?.id === currentVendorId;
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
      case 'VEHICLE_SHARED':   return 'You shared your vehicle';
      case 'VEHICLE_RECEIVED': return 'You requested this vehicle';
      case 'BOOKING_SHARED':   return 'You shared this booking';
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
    } finally { setSubmittingRating(false); }
  };

  // ─── Category avatar gradient map ───
  const CAT_GRADS = {
    VEHICLE_SHARED:   ['#1E3A5F', '#2563EB'],
    VEHICLE_RECEIVED: ['#0C4A6E', '#0EA5E9'],
    BOOKING_SHARED:   ['#3B0764', '#7C3AED'],
    BOOKING_RECEIVED: [C.g900, C.g700],
  };

  const renderTransaction = ({ item }) => {
    const category   = getCategory(item);
    const catCfg     = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.VEHICLE_SHARED;
    const tsc        = TRIP_STATUS[item.tripStatus] || TRIP_STATUS.PENDING;
    const partner    = getPartner(item);
    const myEarning  = getMyEarning(item);
    const roleText   = getMyRole(item);
    const isA        = isVendorA(item);
    const avatarGrad = CAT_GRADS[category] || CAT_GRADS.VEHICLE_SHARED;
    const isVehicle  = item.postingType === 'VEHICLE';

    return (
      <View style={s.card}>

        {/* ── TOP ROW ── */}
        <View style={s.cardTop}>
          {/* Category badge */}
          <View style={[s.catBadge, { backgroundColor: catCfg.bg }]}>
            <MCI name={isVehicle ? 'truck' : 'package-variant'} size={10} color={catCfg.text} />
            <Text style={[s.catBadgeText, { color: catCfg.text }]}>{catCfg.label}</Text>
          </View>
          {/* TX number */}
          <Text style={s.txNum} numberOfLines={1}>{item.transactionNumber}</Text>
          <View style={{ flex: 1 }} />
          {/* Status pill */}
          <View style={[s.statusPill, { backgroundColor: tsc.bg }]}>
            <Icon name={tsc.icon} size={9} color={tsc.text} />
            <Text style={[s.statusPillText, { color: tsc.text }]}>{tsc.label}</Text>
          </View>
          {/* Time ago */}
          <Text style={s.headTime}>{getRelativeTime(item.createdAt)}</Text>
        </View>

        {/* ── ROUTE ROW ── */}
        <View style={s.routeRow}>
          <View style={s.routeDotGreen} />
          <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
          <View style={s.routeLine} />
          <View style={s.routeIconWrap}>
            <MCI name={isVehicle ? 'truck' : 'package-variant'} size={12} color={C.muted} />
          </View>
          <View style={s.routeLine} />
          <Text style={s.routeCity} numberOfLines={1}>{item.toCity || '-'}</Text>
          <View style={s.routeDotRed} />
        </View>

        {/* ── CARD BODY ── */}
        <View style={s.cardBody}>

          {/* Role text */}
          {!!roleText && (
            <Text style={s.roleText}>{roleText}</Text>
          )}

          {/* Partner row */}
          {partner && (
            <View style={s.partnerRow}>
              <LinearGradient colors={avatarGrad} style={s.partnerAvatar}>
                <Text style={s.partnerInitial}>{partner.businessName?.charAt(0)?.toUpperCase() || '?'}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.partnerName} numberOfLines={1}>{partner.businessName || '-'}</Text>
                {!!partner.city && <Text style={s.partnerCity}>{partner.city}</Text>}
              </View>
              {/* Payment status pill */}
              {item.paymentStatus === 'PAID' && (
                <View style={[s.payPill, { backgroundColor: C.g50, borderColor: C.g300 }]}>
                  <Icon name="check-circle" size={9} color={C.g600} />
                  <Text style={[s.payText, { color: C.g700 }]}>PAID</Text>
                </View>
              )}
              {item.paymentStatus === 'SETTLED' && (
                <View style={[s.payPill, { backgroundColor: C.blueBg, borderColor: '#93C5FD' }]}>
                  <Icon name="check-circle" size={9} color={C.blue} />
                  <Text style={[s.payText, { color: C.blueDark }]}>SETTLED</Text>
                </View>
              )}
              {(!item.paymentStatus || item.paymentStatus === 'PENDING') && (
                <View style={[s.payPill, { backgroundColor: C.amberBg, borderColor: '#FCD34D' }]}>
                  <MCI name="clock-outline" size={9} color={C.amber} />
                  <Text style={[s.payText, { color: '#92400E' }]}>PENDING</Text>
                </View>
              )}
            </View>
          )}

          {/* Info chips row */}
          <View style={s.infoRow}>
            <View style={[s.infoChip, { backgroundColor: C.g50, borderColor: C.g100 }]}>
              <Icon name="calendar" size={10} color={C.g600} />
              <Text style={[s.infoChipText, { color: C.g700 }]}>{fmtDate(item.tripDate)}</Text>
            </View>
            {!!item.vehicleName && (
              <View style={[s.infoChip, { backgroundColor: '#F8FAFC', borderColor: C.border }]}>
                <MCI name="truck" size={10} color={C.muted} />
                <Text style={[s.infoChipText, { color: C.sub }]} numberOfLines={1}>
                  {item.vehicleName}{item.vehicleNumber ? ` · ${item.vehicleNumber}` : ''}
                </Text>
              </View>
            )}
            {!!item.driverName && (
              <View style={[s.infoChip, { backgroundColor: '#F8FAFC', borderColor: C.border }]}>
                <Icon name="user" size={10} color={C.muted} />
                <Text style={[s.infoChipText, { color: C.sub }]}>{item.driverName}</Text>
              </View>
            )}
          </View>

          {/* Amount footer */}
          <View style={s.amountFooter}>
            <View>
              <Text style={s.amtLabel}>DEAL VALUE</Text>
              <Text style={s.amtMain}>{fmtPrice(item.agreedAmount)}</Text>
            </View>
            {myEarning != null && (
              <View style={s.earningBox}>
                <Text style={s.amtLabel}>YOUR EARNING</Text>
                <Text style={s.amtEarning}>+{fmtPrice(myEarning)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        {(item.tripStatus === 'CONFIRMED' || item.tripStatus === 'IN_PROGRESS' ||
          item.tripStatus === 'PENDING'   || item.tripStatus === 'COMPLETED') && (
          <View style={s.actionsRow}>
            {/* Start Trip */}
            {item.tripStatus === 'CONFIRMED' && isA && (
              <TouchableOpacity
                onPress={() => handleTripAction(item.id, 'start')}
                disabled={actionLoading === item.id}
                style={{ flex: 1 }}
              >
                <LinearGradient colors={[C.g700, C.g600]} style={s.actionGradBtn}>
                  {actionLoading === item.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><MCI name="play" size={14} color="#fff" /><Text style={s.actionBtnTextWhite}>Start Trip</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Complete Trip */}
            {item.tripStatus === 'IN_PROGRESS' && isA && (
              <TouchableOpacity
                onPress={() => handleTripAction(item.id, 'complete')}
                disabled={actionLoading === item.id}
                style={{ flex: 1 }}
              >
                <LinearGradient colors={[C.g700, C.g600]} style={s.actionGradBtn}>
                  {actionLoading === item.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Icon name="check-circle" size={14} color="#fff" /><Text style={s.actionBtnTextWhite}>Complete Trip</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Cancel */}
            {['PENDING', 'CONFIRMED'].includes(item.tripStatus) && (
              <TouchableOpacity
                style={[s.actionOutlineBtn, { flex: 1, backgroundColor: C.redBg, borderColor: '#FCA5A5' }]}
                onPress={() => handleTripAction(item.id, 'cancel')}
                disabled={actionLoading === item.id}
              >
                <Icon name="x-circle" size={14} color={C.red} />
                <Text style={[s.actionBtnTextColored, { color: C.red }]}>Cancel</Text>
              </TouchableOpacity>
            )}

            {/* Trip in progress (vendor B) */}
            {item.tripStatus === 'IN_PROGRESS' && !isA && (
              <View style={[s.actionOutlineBtn, { flex: 1, backgroundColor: C.blueBg, borderColor: '#93C5FD' }]}>
                <Icon name="clock" size={14} color={C.blue} />
                <Text style={[s.actionBtnTextColored, { color: C.blueDark }]}>Trip in progress...</Text>
              </View>
            )}

            {/* Rate / Rated */}
            {item.tripStatus === 'COMPLETED' && (() => {
              const alreadyRated = (item.p2p_ratings || []).some(r => r.raterVendorId === currentVendorId);
              return alreadyRated ? (
                <View style={[s.actionOutlineBtn, { flex: 1, backgroundColor: C.g50, borderColor: C.g300 }]}>
                  <MCI name="star-check" size={15} color={C.g600} />
                  <Text style={[s.actionBtnTextColored, { color: C.g700 }]}>Rated</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.actionOutlineBtn, { flex: 1, backgroundColor: C.amberBg, borderColor: '#FCD34D' }]}
                  onPress={() => openRating(item)}
                >
                  <MCI name="star" size={15} color={C.amber} />
                  <Text style={[s.actionBtnTextColored, { color: '#92400E' }]}>Rate Partner</Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  const totalPages = pagination?.totalPages || 1;
  const total      = pagination?.total || 0;

  // ─── List Header ───
  const ListHeader = () => (
    <>
      {/* Stats strip */}
      {stats && (
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.totalTransactions || 0}</Text>
            <Text style={s.statLabel}>TOTAL DEALS</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.completedTransactions || 0}</Text>
            <Text style={s.statLabel}>COMPLETED</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A'}</Text>
            <Text style={s.statLabel}>AVG RATING</Text>
          </View>
        </View>
      )}

      {/* Main tab bar */}
      <View style={s.tabBarWrap}>
        <View style={s.tabBar}>
          {MAIN_TABS.map(t => {
            const active = mainTab === t.key;
            return active ? (
              <LinearGradient key={t.key} colors={[C.g700, C.g600]} style={s.tabItemActive}>
                <MCI name={t.key === 'VEHICLE' ? 'truck' : 'package-variant'} size={15} color="#fff" />
                <Text style={s.tabTextActive}>{t.label}</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity key={t.key} style={s.tabItemInactive} onPress={() => setMainTab(t.key)}>
                <MCI name={t.key === 'VEHICLE' ? 'truck' : 'package-variant'} size={15} color={C.g700} />
                <Text style={s.tabTextInactive}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Status filter chips */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.key;
          return active ? (
            <LinearGradient key={f.key} colors={[C.g700, C.g600]} style={s.filterChipActive}>
              <Text style={s.filterTextActive}>{f.label}</Text>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              key={f.key}
              style={s.filterChipInactive}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={s.filterTextInactive}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* ─────────── FIXED HEADER ─────────── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.g950 }}>
        <LinearGradient colors={G.hero} style={s.headerGrad}>
          {/* Decorative circles */}
          <AnimatedOrb style={s.decCircle1} />
          <AnimatedOrb style={s.decCircle2} delay={1200} dx={-10} dy={8} />

          {/* Nav row */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>My P2P Activity</Text>
              <Text style={s.headerSub}>Track transactions & earnings</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Earnings hero card inside gradient */}
          <View style={s.earningsCard}>
            {/* Icon circle */}
            <View style={s.earningsIconCircle}>
              <MCI name="cash-multiple" size={24} color={C.g400} />
            </View>
            {/* Center: amount */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.earningsAmt}>{stats ? fmtPrice(stats.totalEarnings) : '—'}</Text>
              <Text style={s.earningsLabel}>Total Earnings</Text>
            </View>
            {/* Right: deal + rating pills */}
            <View style={s.earningsPills}>
              <View style={s.earningsPillGreen}>
                <MCI name="handshake" size={9} color={C.g400} />
                <Text style={s.earningsPillGreenText}>
                  Deals: {stats?.totalTransactions ?? '—'}
                </Text>
              </View>
              <View style={s.earningsPillAmber}>
                <MCI name="star" size={9} color={C.amber} />
                <Text style={s.earningsPillAmberText}>
                  {stats?.averageRating ? Number(stats.averageRating).toFixed(1) : 'N/A'} ★
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      {/* ─────────── CONTENT ─────────── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.loadingText}>Loading activity...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
          }
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <LinearGradient colors={[C.g800, C.g700]} style={s.emptyIconCircle}>
                <MCI name={mainTab === 'VEHICLE' ? 'truck' : 'package-variant'} size={38} color="#fff" />
              </LinearGradient>
              <Text style={s.emptyTitle}>
                {mainTab === 'VEHICLE' ? 'No vehicle deals yet' : 'No booking deals yet'}
              </Text>
              <Text style={s.emptyMsg}>
                {mainTab === 'VEHICLE'
                  ? 'Share your empty vehicles or request vehicles from other vendors to see deals here.'
                  : "Share bookings you can't fulfill or accept bookings from other vendors to see deals here."}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(mainTab === 'VEHICLE' ? 'BrowseVehiclesScreen' : 'BrowseBookingsScreen')}
              >
                <LinearGradient colors={[C.g700, C.g600]} style={s.emptyBtn}>
                  <MCI name={mainTab === 'VEHICLE' ? 'truck' : 'package-variant'} size={16} color="#fff" />
                  <Text style={s.emptyBtnText}>
                    {mainTab === 'VEHICLE' ? 'Browse Vehicles' : 'Browse Bookings'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={totalPages > 1 ? (
            <View style={s.pagination}>
              <Text style={s.pageShowText}>
                Showing{' '}
                <Text style={s.pageBold}>{((pagination?.page || 1) - 1) * 20 + 1}</Text>
                {' – '}
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
                  <Icon name="chevron-left" size={15} color={page <= 1 ? C.muted : C.g700} />
                  <Text style={[s.pageBtnText, page <= 1 && { color: C.muted }]}>Prev</Text>
                </TouchableOpacity>
                <View style={s.pageIndicator}>
                  <Text style={s.pageIndicatorText}>{page} / {totalPages}</Text>
                </View>
                <TouchableOpacity
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <Text style={[s.pageBtnText, page >= totalPages && { color: C.muted }]}>Next</Text>
                  <Icon name="chevron-right" size={15} color={page >= totalPages ? C.muted : C.g700} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        />
      )}

      {/* ─────────── RATING MODAL ─────────── */}
      <Modal visible={ratingModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setRatingModal(false)} />
          <View style={s.modalSheet}>

            {/* Gradient header */}
            <LinearGradient colors={[T.forestDark, T.forest]} style={s.modalHeader}>
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalStarCircle}>
                  <MCI name="star" size={20} color={C.amber} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.modalTitle}>Rate Partner</Text>
                  <Text style={s.modalTitleSub}>{getPartner(selTx || {})?.businessName || 'Partner'}</Text>
                </View>
                <TouchableOpacity onPress={() => setRatingModal(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={s.modalBody}>
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

              <Text style={[s.formLabel, { marginTop: 20 }]}>REVIEW (Optional)</Text>
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
                style={{ opacity: submittingRating ? 0.6 : 1, marginTop: 20 }}
                onPress={handleSubmitRating}
                disabled={submittingRating}
              >
                <LinearGradient colors={[C.amber, '#D97706']} style={s.submitBtn}>
                  {submittingRating
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <MCI name="star-check" size={18} color="#fff" />
                        <Text style={s.submitBtnText}>Submit Rating</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  // ─── Header gradient ───
  headerGrad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  decCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.045)', bottom: -30, left: -20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // ─── Earnings hero card ───
  earningsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: rs(20), padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  earningsIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(52,211,153,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  earningsAmt:   { fontFamily: DISPLAY, fontSize: 28, fontWeight: '800', color: C.g300, letterSpacing: -1 },
  earningsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  earningsPills: { gap: 6, alignItems: 'flex-end' },
  earningsPillGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
  },
  earningsPillGreenText: { fontSize: 10, fontWeight: '700', color: C.g300 },
  earningsPillAmber: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  earningsPillAmberText: { fontSize: 10, fontWeight: '700', color: C.amber },

  // ─── Stats card ───
  statsCard: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: rs(16), marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border, alignSelf: 'center' },
  statVal:     { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel:   { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6 },

  // ─── Tab bar ───
  tabBarWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: rs(14), padding: 4,
  },
  tabItemActive: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 10, borderRadius: 10,
  },
  tabItemInactive: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 10, borderRadius: 10,
  },
  tabTextActive:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  tabTextInactive: { fontSize: 13, fontWeight: '600', color: C.g700 },

  // ─── Filter chips ───
  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16,
    paddingVertical: 10, paddingBottom: 12,
  },
  filterChipActive: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  filterChipInactive: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  filterTextActive:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  filterTextInactive: { fontSize: 12, fontWeight: '600', color: C.sub },

  // ─── List ───
  listContent: { paddingHorizontal: 16, paddingBottom: 110 },

  // ─── Card ───
  card: {
    backgroundColor: C.surface, borderRadius: rs(16), marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
    overflow: 'hidden',
  },

  // Card top row
  cardTop: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  catBadgeText:  { fontSize: 10, fontWeight: '700' },
  txNum:         { fontSize: 11, fontWeight: '500', color: C.muted, fontVariant: ['tabular-nums'] },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  headTime:       { fontSize: 10, color: C.muted },

  // Route row
  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginVertical: 8,
    backgroundColor: '#F8FAFC', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.border,
    gap: 6,
  },
  routeDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500 },
  routeDotRed:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  routeLine:     { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  routeIconWrap: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  routeCity: { fontSize: 12, fontWeight: '600', color: C.text, maxWidth: 90 },

  // Card body
  cardBody: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  roleText: { fontSize: 11, color: C.g600, fontStyle: 'italic', marginBottom: 8 },

  // Partner row
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  partnerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  partnerInitial: { fontSize: 13, fontWeight: '700', color: '#fff' },
  partnerName:    { fontSize: 13, fontWeight: '700', color: C.text },
  partnerCity:    { fontSize: 11, color: C.muted, marginTop: 1 },

  // Payment pill
  payPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  payText: { fontSize: 9, fontWeight: '700' },

  // Info chips
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  infoChipText: { fontSize: 11, fontWeight: '600' },

  // Amount footer
  amountFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  amtLabel:   { fontSize: 9, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 },
  amtMain:    { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  earningBox: { alignItems: 'flex-end' },
  amtEarning: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.g600, letterSpacing: -0.5 },

  // Action buttons row
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  actionGradBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  actionOutlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  actionBtnTextWhite:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  actionBtnTextColored: { fontSize: 12, fontWeight: '700' },

  // ─── Pagination ───
  pagination: {
    backgroundColor: C.surface, borderRadius: rs(16), padding: 16,
    marginTop: 4, marginBottom: 4,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  pageShowText: { fontSize: 12, color: C.sub, textAlign: 'center', marginBottom: 12 },
  pageBold:     { fontWeight: '700', color: C.text },
  pageButtons:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText:     { fontSize: 13, fontWeight: '600', color: C.g700 },
  pageIndicator: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  pageIndicatorText: { fontSize: 13, fontWeight: '700', color: C.g700 },

  // ─── Empty state ───
  emptyWrap: {
    alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 12,
  },
  emptyIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  emptyMsg:   { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: rs(14),
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ─── Rating Modal ───
  modalOverlay: {
    flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  modalHeader: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 18 },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  modalStarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle:    { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: '#fff' },
  modalTitleSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { paddingHorizontal: 22, paddingVertical: 20 },

  formLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 4, paddingVertical: 6,
  },
  starBtn:     { padding: 4 },
  ratingLabel: {
    fontSize: 14, fontWeight: '700', color: C.amber,
    textAlign: 'center', marginTop: 4,
  },
  reviewInput: {
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: rs(14), paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, height: 92,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: rs(16),
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
