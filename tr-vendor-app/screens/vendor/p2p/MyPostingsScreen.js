import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, Linking, Share, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  getP2PMyPostings, deleteP2PVehicle, deleteP2PBooking,
  respondP2PRequest, getP2PMyRequests, getP2PComments, addP2PComment,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  g950: '#011B14', g900: '#022C22', g800: '#064E3B', g700: '#047857',
  g600: '#059669', g500: '#10B981', g400: '#34D399', g300: '#6EE7B7',
  g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F8FAFC', surface: '#FFFFFF',
  text: '#0F172A', sub: '#334155', muted: '#94A3B8',
  border: '#E2E8F0',
  amber: '#F59E0B', amberBg: '#FFFBEB',
  red: '#EF4444', redBg: '#FEF2F2',
  blue: '#3B82F6', blueBg: '#EFF6FF',
  purple: '#8B5CF6', purpleBg: '#F5F3FF',
  // legacy aliases used in original logic
  subtext: '#334155',
};

const STATUS_CFG = {
  ACTIVE: { label: 'Active', bg: '#D1FAE5', text: '#065F46', icon: 'check-circle', dot: '#10B981' },
  REQUESTED: { label: 'Requested', bg: '#FEF3C7', text: '#92400E', icon: 'clock', dot: '#F59E0B' },
  ACCEPTED: { label: 'Accepted', bg: '#DBEAFE', text: '#1E40AF', icon: 'thumbs-up', dot: '#3B82F6' },
  IN_PROGRESS: { label: 'In Progress', bg: '#E0E7FF', text: '#3730A3', icon: 'loader', dot: '#6366F1' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#065F46', icon: 'check-circle', dot: '#10B981' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', icon: 'x-circle', dot: '#EF4444' },
  EXPIRED: { label: 'Expired', bg: '#F1F5F9', text: '#64748B', icon: 'clock', dot: '#94A3B8' },
  PENDING: { label: 'Pending', bg: '#FEF3C7', text: '#92400E', icon: 'clock', dot: '#F59E0B' },
  REJECTED: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B', icon: 'x-circle', dot: '#EF4444' },
};

const TABS = [
  { key: 'vehicles', label: 'Vehicles', icon: 'truck', mci: 'truck', addLabel: 'Post Vehicle', color: C.blue },
  { key: 'bookings', label: 'Bookings', icon: 'package', mci: 'package-variant', addLabel: 'Share Booking', color: C.purple },
  { key: 'requests', label: 'Requests', icon: 'send', mci: 'send', addLabel: '', color: C.amber },
];

const STATUS_FILTERS = ['All', 'ACTIVE', 'REQUESTED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];
const REQ_STATUS_FILTERS = ['All', 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

const TX_STATUS = {
  PENDING: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  IN_TRANSIT: { label: 'In Transit', bg: '#DBEAFE', text: '#1E40AF' },
  DELIVERED: { label: 'Delivered', bg: '#D1FAE5', text: '#065F46' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', text: '#065F46' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B' },
};
const PAY_STATUS = {
  PENDING: { label: 'Unpaid', bg: '#FEF3C7', text: '#92400E' },
  PARTIAL: { label: 'Partial', bg: '#FFF7ED', text: '#C2410C' },
  COMPLETED: { label: 'Paid', bg: '#D1FAE5', text: '#065F46' },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'; }
function fmtPrice(n) { return '\u20B9' + Number(n || 0).toLocaleString('en-IN'); }
function relTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  return dy < 30 ? `${dy}d ago` : fmtDate(d);
}

export default function MyPostingsScreen({ navigation, route }) {
  const [tab, setTab] = useState(route?.params?.initialTab || 'vehicles');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  // Respond modal
  const [respondModal, setRespondModal] = useState(false);
  const [selRequest, setSelRequest] = useState(null);
  const [respondAction, setRespondAction] = useState('');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [responding, setResponding] = useState(false);

  // Expanded requests
  const [expandedId, setExpandedId] = useState(null);

  // Comments
  const [commentCounts, setCommentCounts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [sendingComment, setSendingComment] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  // Share & Transactions
  const [shareOpen, setShareOpen] = useState(null);
  const [expandedTx, setExpandedTx] = useState({});

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchData = useCallback(async () => {
    try {
      const [postingsRes, reqRes] = await Promise.all([
        getP2PMyPostings(),
        getP2PMyRequests(),
      ]);
      const vList = postingsRes?.vehiclePostings || postingsRes?.vehicles || [];
      const bList = postingsRes?.bookingPostings || postingsRes?.bookings || [];
      setVehicles(vList);
      setBookings(bList);
      setRequests(reqRes?.requests || []);

      // Fetch comment counts in bulk
      if (vList.length > 0) {
        const ids = vList.map(v => v.id).join(',');
        getP2PComments({ postingType: 'VEHICLE', postingIds: ids, mode: 'counts' })
          .then(r => setCommentCounts(prev => ({ ...prev, ...(r?.counts || {}) })))
          .catch(() => {});
      }
      if (bList.length > 0) {
        const ids = bList.map(b => b.id).join(',');
        getP2PComments({ postingType: 'BOOKING', postingIds: ids, mode: 'counts' })
          .then(r => setCommentCounts(prev => ({ ...prev, ...(r?.counts || {}) })))
          .catch(() => {});
      }
    } catch (e) {
      showAlert('error', 'Error', 'Failed to load postings');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    if (route?.params?.initialTab) setTab(route.params.initialTab);
    fetchData();
  }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDelete = async (id, type) => {
    try {
      if (type === 'vehicle') await deleteP2PVehicle(id);
      else await deleteP2PBooking(id);
      showAlert('success', 'Deleted', 'Posting removed');
      fetchData();
    } catch (e) { showAlert('error', 'Error', 'Failed to delete'); }
  };

  const openRespond = (req, action) => {
    setSelRequest(req);
    setRespondAction(action);
    setAgreedAmount('');
    setRespondModal(true);
  };

  const handleRespond = async () => {
    if (!selRequest) return;
    setResponding(true);
    try {
      const data = { action: respondAction };
      if (respondAction === 'ACCEPT' && agreedAmount) data.agreedAmount = parseFloat(agreedAmount);
      await respondP2PRequest(selRequest.id, data);
      setRespondModal(false);
      showAlert('success', respondAction === 'ACCEPT' ? 'Accepted!' : 'Rejected', 'Response sent successfully');
      fetchData();
    } catch (e) { showAlert('error', 'Error', 'Failed to respond'); }
    finally { setResponding(false); }
  };

  // ─── Comments ───
  const toggleComments = async (id, type) => {
    const isExp = expandedComments[id];
    setExpandedComments(p => ({ ...p, [id]: !isExp }));
    if (!isExp && !commentsData[id]) {
      setLoadingComments(p => ({ ...p, [id]: true }));
      try {
        const res = await getP2PComments({ postingType: type, postingId: id });
        setCommentsData(p => ({ ...p, [id]: res?.comments || [] }));
      } catch (e) {}
      finally { setLoadingComments(p => ({ ...p, [id]: false })); }
    }
  };

  const sendComment = async (id, type) => {
    const msg = (commentInputs[id] || '').trim();
    if (!msg) return;
    setSendingComment(p => ({ ...p, [id]: true }));
    try {
      const res = await addP2PComment({ postingType: type, postingId: id, message: msg });
      if (res?.comment) {
        setCommentsData(p => ({ ...p, [id]: [...(p[id] || []), res.comment] }));
        setCommentCounts(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
      }
      setCommentInputs(p => ({ ...p, [id]: '' }));
    } catch (e) { showAlert('error', 'Error', 'Failed to send comment'); }
    finally { setSendingComment(p => ({ ...p, [id]: false })); }
  };

  // ─── Share ───
  const shareVehicleWhatsApp = (item) => {
    const msg = `\u{1F69B} *Vehicle Available - P2P*\n\n` +
      `*${item.vehicleName}* (${(item.serviceType || '').toUpperCase()})\n` +
      `\u{1F4CD} ${item.fromCity} \u2192 ${item.toCity}\n` +
      `\u{1F4C5} ${fmtDate(item.departureDate)}\n` +
      `\u{1F4B0} ${fmtPrice(item.priceFullLoad)} (Full Load)\n\n` +
      `Check it out on TranStable P2P Marketplace!`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    setShareOpen(null);
  };

  const shareVehicleGeneric = async (item) => {
    try {
      await Share.share({
        message: `Vehicle: ${item.vehicleName}\n${item.fromCity} \u2192 ${item.toCity}\n${fmtDate(item.departureDate)}\nPrice: ${fmtPrice(item.priceFullLoad)}`,
      });
    } catch (e) {}
    setShareOpen(null);
  };

  const shareBookingWhatsApp = (item) => {
    const msg = `\u{1F4E6} *Booking Available - P2P*\n\n` +
      `*${item.vehicleRequired || 'Booking'}*\n` +
      `\u{1F4CD} ${item.fromCity} \u2192 ${item.toCity || 'N/A'}\n` +
      `\u{1F4C5} ${fmtDate(item.tripDate)}\n` +
      `\u{1F4B0} Budget: ${fmtPrice(item.customerBudget)}\n\n` +
      `Check it out on TranStable P2P Marketplace!`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    setShareOpen(null);
  };

  const shareBookingGeneric = async (item) => {
    try {
      await Share.share({
        message: `Booking: ${item.vehicleRequired}\n${item.fromCity} \u2192 ${item.toCity}\n${fmtDate(item.tripDate)}\nBudget: ${fmtPrice(item.customerBudget)}`,
      });
    } catch (e) {}
    setShareOpen(null);
  };

  // ─── Render helpers ───
  const renderCommentsSection = (id, type) => {
    const comments = commentsData[id] || [];
    return (
      <View style={s.commentsSection}>
        {loadingComments[id] ? (
          <ActivityIndicator size="small" color={C.g600} style={{ padding: 12 }} />
        ) : comments.length === 0 ? (
          <Text style={s.noComments}>No comments yet. Be the first!</Text>
        ) : (
          comments.map(c => (
            <View key={c.id} style={s.commentItem}>
              <LinearGradient colors={[C.g700, C.g500]} style={s.commentAvatar}>
                <Text style={s.commentInitial}>{c.vendor?.businessName?.charAt(0) || '?'}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={s.commentHeader}>
                  <Text style={s.commentName}>{c.vendor?.businessName || 'Vendor'}</Text>
                  <Text style={s.commentTime}>{relTime(c.createdAt)}</Text>
                </View>
                <Text style={s.commentMsg}>{c.message}</Text>
              </View>
            </View>
          ))
        )}
        <View style={s.commentInputRow}>
          <TextInput
            style={s.commentInput}
            value={commentInputs[id] || ''}
            onChangeText={t => setCommentInputs(p => ({ ...p, [id]: t }))}
            placeholder="Write a comment..."
            placeholderTextColor={C.muted}
            onSubmitEditing={() => sendComment(id, type)}
          />
          <TouchableOpacity
            onPress={() => sendComment(id, type)}
            disabled={!(commentInputs[id] || '').trim() || sendingComment[id]}
            style={[{ opacity: !(commentInputs[id] || '').trim() ? 0.4 : 1 }]}
          >
            <LinearGradient colors={[C.g700, C.g600]} style={s.commentSendBtn}>
              {sendingComment[id]
                ? <ActivityIndicator size="small" color="#fff" />
                : <Icon name="send" size={14} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTransactions = (txList) => {
    if (!txList || txList.length === 0) return (
      <Text style={s.noComments}>No transactions yet</Text>
    );
    return txList.map(tx => {
      const ts = TX_STATUS[tx.tripStatus] || TX_STATUS.PENDING;
      const ps = PAY_STATUS[tx.paymentStatus] || PAY_STATUS.PENDING;
      return (
        <View key={tx.id} style={s.txItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MCI name="swap-horizontal-bold" size={16} color={C.g600} />
            <Text style={s.txNumber}>{tx.transactionNumber}</Text>
            <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 4 }}>
              <View style={[s.txBadge, { backgroundColor: ts.bg }]}>
                <Text style={[s.txBadgeText, { color: ts.text }]}>{ts.label}</Text>
              </View>
              <View style={[s.txBadge, { backgroundColor: ps.bg }]}>
                <Text style={[s.txBadgeText, { color: ps.text }]}>{ps.label}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.txVendor}>{tx.vendorA?.businessName || 'Vendor A'}</Text>
              <MCI name="arrow-right" size={12} color={C.muted} />
              <Text style={s.txVendor}>{tx.vendorB?.businessName || 'Vendor B'}</Text>
            </View>
            {tx.agreedAmount > 0 && (
              <Text style={s.txAmount}>{fmtPrice(tx.agreedAmount)}</Text>
            )}
          </View>
          <Text style={s.txTime}>{relTime(tx.createdAt)}</Text>
        </View>
      );
    });
  };

  const getFilteredData = () => {
    let data = tab === 'vehicles' ? vehicles : tab === 'bookings' ? bookings : requests;
    if (statusFilter !== 'All') {
      data = data.filter(d => d.status === statusFilter);
    }
    return data;
  };

  const getStatusCount = (status) => {
    const data = tab === 'vehicles' ? vehicles : tab === 'bookings' ? bookings : requests;
    if (status === 'All') return data.length;
    return data.filter(d => d.status === status).length;
  };

  const getTabCount = (key) => {
    if (key === 'vehicles') return vehicles.length;
    if (key === 'bookings') return bookings.length;
    return requests.length;
  };

  const handleAdd = () => {
    if (tab === 'vehicles') navigation.navigate('PostVehicleScreen');
    else if (tab === 'bookings') navigation.navigate('PostBookingScreen');
  };

  /* ─── Route Row ─── */
  const RouteRow = ({ fromCity, toCity, icon }) => (
    <View style={s.routeRow}>
      <View style={s.routeDotGreen} />
      <Text style={s.routeCity} numberOfLines={1}>{fromCity || '-'}</Text>
      <View style={s.routeLine} />
      <MCI name={icon || 'truck'} size={13} color={C.muted} />
      <View style={s.routeLine} />
      <Text style={s.routeCity} numberOfLines={1}>{toCity || '-'}</Text>
      <View style={s.routeDotRed} />
    </View>
  );

  /* ─── Vehicle Card ─── */
  const renderVehicleCard = ({ item }) => {
    const sc = STATUS_CFG[item.status] || STATUS_CFG.ACTIVE;
    const canEdit = ['ACTIVE', 'REQUESTED'].includes(item.status);
    const pendingReqs = item.p2p_requests?.filter(r => r.status === 'PENDING') || [];
    const acceptedReqs = item.p2p_requests?.filter(r => r.status === 'ACCEPTED') || [];
    const isExpanded = expandedId === item.id;
    const isTruck = item.serviceType === 'truck';
    const headGrad = isTruck ? [C.g800, C.g700] : ['#1E3A5F', '#1D4ED8'];

    return (
      <View style={s.card}>
        {/* Card Header — colored gradient band */}
        <LinearGradient colors={headGrad} style={s.cardGradHeader}>
          {/* Decorative circles */}
          <View style={s.headerCircle1} />
          <View style={s.headerCircle2} />
          {/* Icon circle */}
          <View style={s.headerIconCircle}>
            <MCI name={isTruck ? 'truck' : 'car-side'} size={22} color="#fff" />
          </View>
          {/* Center info */}
          <View style={{ flex: 1 }}>
            <Text style={s.headerVehName} numberOfLines={1}>{item.vehicleName || 'Vehicle'}</Text>
            {item.vehicleNumber && (
              <Text style={s.headerVehPlate}>{item.vehicleNumber}</Text>
            )}
          </View>
          {/* Right: status + number */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[s.headerStatusChip, { backgroundColor: sc.bg }]}>
              <View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: sc.dot }]} />
              <Text style={[s.headerStatusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
            <Text style={s.headerPostingNum}>{item.postingNumber}</Text>
          </View>
        </LinearGradient>

        {/* Route Row */}
        <RouteRow fromCity={item.fromCity} toCity={item.toCity} icon={isTruck ? 'truck' : 'car-side'} />

        {/* Card Body */}
        <View style={s.cardBody}>
          {/* Info row */}
          <View style={s.infoRow}>
            <View style={s.infoChip}>
              <Icon name="calendar" size={11} color={C.g700} />
              <Text style={s.infoChipText}>{fmtDate(item.departureDate)}</Text>
            </View>
            <View style={[s.infoChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Icon name="tag" size={11} color="#92400E" />
              <Text style={[s.infoChipText, { color: '#92400E', fontWeight: '700' }]}>{fmtPrice(item.priceFullLoad)}</Text>
            </View>
            {item.pricePartLoad > 0 && (
              <View style={[s.infoChip, { backgroundColor: C.purpleBg, borderColor: '#DDD6FE' }]}>
                <Icon name="tag" size={11} color={C.purple} />
                <Text style={[s.infoChipText, { color: C.purple }]}>{fmtPrice(item.pricePartLoad)} part</Text>
              </View>
            )}
          </View>

          {/* Feature badges */}
          {(item.capacity || item.bodyType || item.driverIncluded || item.acceptsPartLoad) && (
            <View style={s.badgeRow}>
              {item.capacity && (
                <View style={s.featureBadge}>
                  <MCI name="weight" size={10} color={C.sub} />
                  <Text style={s.featureBadgeText}>{item.capacity}</Text>
                </View>
              )}
              {item.bodyType && (
                <View style={s.featureBadge}>
                  <MCI name="shape" size={10} color={C.sub} />
                  <Text style={s.featureBadgeText}>{item.bodyType}</Text>
                </View>
              )}
              {item.driverIncluded && (
                <View style={[s.featureBadge, { backgroundColor: C.g50, borderColor: C.g300 }]}>
                  <MCI name="account-check" size={10} color={C.g700} />
                  <Text style={[s.featureBadgeText, { color: C.g700 }]}>Driver</Text>
                </View>
              )}
              {item.acceptsPartLoad && (
                <View style={[s.featureBadge, { backgroundColor: C.purpleBg, borderColor: '#DDD6FE' }]}>
                  <MCI name="package-variant" size={10} color={C.purple} />
                  <Text style={[s.featureBadgeText, { color: C.purple }]}>Part Load OK</Text>
                </View>
              )}
            </View>
          )}

          {/* Pending requests bar */}
          {pendingReqs.length > 0 && (
            <TouchableOpacity style={s.pendingBar} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
              <View style={s.pendingPulse} />
              <MCI name="bell-ring-outline" size={16} color={C.amber} />
              <Text style={s.pendingText}>{pendingReqs.length} pending request{pendingReqs.length > 1 ? 's' : ''}</Text>
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.amber} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {isExpanded && pendingReqs.map(req => (
            <View key={req.id} style={s.inlineReqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <LinearGradient colors={[C.g700, C.g500]} style={s.reqAvatar}>
                  <Text style={s.reqAvatarText}>{(req.requestingVendor?.businessName || 'V')[0]}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqFrom}>{req.requestingVendor?.businessName || 'Vendor'}</Text>
                  {req.requestingVendor?.city && <Text style={s.reqCity}>{req.requestingVendor.city}</Text>}
                </View>
                <Text style={s.reqTime}>{relTime(req.createdAt)}</Text>
              </View>
              {req.pickupAddress && (
                <View style={s.reqInfoRow}>
                  <Icon name="map-pin" size={11} color={C.g600} />
                  <Text style={s.reqInfoText}>Pickup: {req.pickupAddress}</Text>
                </View>
              )}
              {req.dropAddress && (
                <View style={s.reqInfoRow}>
                  <Icon name="map-pin" size={11} color={C.red} />
                  <Text style={s.reqInfoText}>Drop: {req.dropAddress}</Text>
                </View>
              )}
              {req.notes && (
                <View style={s.reqInfoRow}>
                  <Icon name="file-text" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>{req.notes}</Text>
                </View>
              )}
              <View style={s.reqBtnRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openRespond(req, 'ACCEPT')}>
                  <LinearGradient colors={[C.g700, C.g600]} style={s.reqAcceptBtnGrad}>
                    <Icon name="check" size={14} color="#fff" />
                    <Text style={s.reqAcceptBtnText}>Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={s.reqRejectBtn} onPress={() => openRespond(req, 'REJECT')}>
                  <Icon name="x" size={14} color={C.red} />
                  <Text style={s.reqRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Accepted requests */}
          {acceptedReqs.length > 0 && acceptedReqs.map(req => (
            <View key={req.id} style={s.acceptedReqBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name="check-circle" size={16} color={C.g600} />
                <Text style={s.acceptedReqText}>Deal confirmed with {req.requestingVendor?.businessName || 'Vendor'}</Text>
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.g700} />
                <Text style={s.viewActivityText}>View in Activity</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Transactions toggle */}
          {(item.p2p_transactions?.length > 0) && (
            <TouchableOpacity style={s.txToggle} onPress={() => setExpandedTx(p => ({ ...p, [item.id]: !p[item.id] }))}>
              <MCI name="swap-horizontal-bold" size={15} color={C.g700} />
              <Text style={s.txToggleText}>{item.p2p_transactions.length} Transaction{item.p2p_transactions.length > 1 ? 's' : ''}</Text>
              <Icon name={expandedTx[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.g700} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          {expandedTx[item.id] && (
            <View style={s.txSection}>{renderTransactions(item.p2p_transactions)}</View>
          )}

          {/* Social Bar */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id, 'VEHICLE')}>
              <MCI name="comment-outline" size={16} color={C.sub} />
              <Text style={s.socialText}>{commentCounts[item.id] || 0}</Text>
              <Icon name={expandedComments[item.id] ? 'chevron-up' : 'chevron-down'} size={13} color={C.muted} />
            </TouchableOpacity>
            <View style={s.socialDivider} />
            <TouchableOpacity style={s.socialBtn} onPress={() => setShareOpen(shareOpen === item.id ? null : item.id)}>
              <Icon name="share-2" size={14} color={C.sub} />
              <Text style={s.socialText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Share dropdown */}
          {shareOpen === item.id && (
            <View style={s.shareMenu}>
              <TouchableOpacity style={s.shareOption} onPress={() => shareVehicleGeneric(item)}>
                <Icon name="copy" size={14} color={C.sub} />
                <Text style={s.shareOptionText}>Copy & Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareOption} onPress={() => shareVehicleWhatsApp(item)}>
                <MCI name="whatsapp" size={16} color="#25D366" />
                <Text style={s.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expanded Comments */}
          {expandedComments[item.id] && renderCommentsSection(item.id, 'VEHICLE')}

          {/* Footer Actions */}
          <View style={s.cardFooter}>
            {canEdit && (
              <TouchableOpacity style={s.footerEditBtn} onPress={() => navigation.navigate('PostVehicleScreen', { editData: item })}>
                <Icon name="edit-2" size={13} color={C.g700} />
                <Text style={s.footerEditText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.footerDeleteBtn} onPress={() => handleDelete(item.id, 'vehicle')}>
              <Icon name="trash-2" size={13} color={C.red} />
              <Text style={s.footerDeleteText}>Delete</Text>
            </TouchableOpacity>
            {pendingReqs.length > 0 && (
              <TouchableOpacity
                style={s.footerAmberBtn}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <MCI name="bell-ring-outline" size={13} color="#92400E" />
                <Text style={s.footerAmberText}>View Requests</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ─── Booking Card ─── */
  const renderBookingCard = ({ item }) => {
    const sc = STATUS_CFG[item.status] || STATUS_CFG.ACTIVE;
    const canEdit = ['ACTIVE', 'REQUESTED'].includes(item.status);
    const urgCfg = item.urgency === 'HIGH' ? { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' }
      : item.urgency === 'MEDIUM' ? { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' }
      : { bg: C.g50, text: '#065F46', dot: '#10B981' };
    const pendingReqs = item.p2p_requests?.filter(r => r.status === 'PENDING') || [];
    const acceptedReqs = item.p2p_requests?.filter(r => r.status === 'ACCEPTED') || [];
    const isExpanded = expandedId === item.id;

    return (
      <View style={s.card}>
        {/* Card Header — purple gradient */}
        <LinearGradient colors={['#7C2D12', '#C2410C']} style={s.cardGradHeader}>
          <View style={s.headerCircle1} />
          <View style={s.headerCircle2} />
          <View style={[s.headerIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MCI name="package-variant" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerVehName} numberOfLines={1}>{item.vehicleRequired || 'Booking'}</Text>
            <Text style={s.headerVehPlate}>{(item.serviceType || '').toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[s.headerStatusChip, { backgroundColor: sc.bg }]}>
              <View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: sc.dot }]} />
              <Text style={[s.headerStatusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
            <Text style={s.headerPostingNum}>{item.postingNumber}</Text>
          </View>
        </LinearGradient>

        {/* Route Row */}
        <RouteRow fromCity={item.fromCity} toCity={item.toCity} icon="package-variant" />

        {/* Card Body */}
        <View style={s.cardBody}>
          {/* Info row */}
          <View style={s.infoRow}>
            <View style={[s.infoChip, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
              <Icon name="calendar" size={11} color={C.purple} />
              <Text style={[s.infoChipText, { color: C.purple }]}>{fmtDate(item.tripDate)}</Text>
            </View>
            <View style={[s.infoChip, { backgroundColor: urgCfg.bg, borderColor: urgCfg.dot + '80' }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: urgCfg.dot }} />
              <Text style={[s.infoChipText, { color: urgCfg.text, fontWeight: '700' }]}>{item.urgency || 'LOW'}</Text>
            </View>
            {item.returnDate && (
              <View style={s.infoChip}>
                <Icon name="corner-down-left" size={11} color={C.sub} />
                <Text style={s.infoChipText}>{fmtDate(item.returnDate)}</Text>
              </View>
            )}
          </View>

          {/* Reason for sharing */}
          {item.reasonForSharing && (
            <View style={s.reasonRow}>
              <Icon name="info" size={12} color={C.muted} />
              <Text style={s.reasonText} numberOfLines={2}>{item.reasonForSharing}</Text>
            </View>
          )}

          {/* Commission grid */}
          <View style={s.commGrid}>
            <View style={[s.commBox, { backgroundColor: C.g50, borderColor: C.g100 }]}>
              <Text style={s.commLbl}>Budget</Text>
              <Text style={s.commAmount}>{fmtPrice(item.customerBudget)}</Text>
            </View>
            <View style={[s.commBox, { backgroundColor: '#F0FDF4', borderColor: C.g200 }]}>
              <Text style={[s.commLbl, { color: C.g700 }]}>You Earn</Text>
              <Text style={[s.commAmount, { color: C.g700 }]}>{fmtPrice(item.partnerEarning)}</Text>
            </View>
            <View style={[s.commBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[s.commLbl, { color: '#B45309' }]}>Commission</Text>
              <Text style={[s.commAmount, { color: '#B45309' }]}>{fmtPrice(item.commission)}</Text>
            </View>
          </View>

          {/* Pending requests */}
          {pendingReqs.length > 0 && (
            <TouchableOpacity style={s.pendingBar} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
              <View style={s.pendingPulse} />
              <MCI name="bell-ring-outline" size={16} color={C.amber} />
              <Text style={s.pendingText}>{pendingReqs.length} pending request{pendingReqs.length > 1 ? 's' : ''}</Text>
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.amber} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {isExpanded && pendingReqs.map(req => (
            <View key={req.id} style={s.inlineReqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <LinearGradient colors={[C.g700, C.g500]} style={s.reqAvatar}>
                  <Text style={s.reqAvatarText}>{(req.requestingVendor?.businessName || 'V')[0]}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqFrom}>{req.requestingVendor?.businessName || 'Vendor'}</Text>
                  {req.requestingVendor?.city && <Text style={s.reqCity}>{req.requestingVendor.city}</Text>}
                </View>
                <Text style={s.reqTime}>{relTime(req.createdAt)}</Text>
              </View>
              {req.vehicleName && (
                <View style={s.reqInfoRow}>
                  <MCI name="truck" size={11} color={C.purple} />
                  <Text style={s.reqInfoText}>{req.vehicleName}{req.vehicleNumber ? ` (${req.vehicleNumber})` : ''}</Text>
                </View>
              )}
              {req.driverName && (
                <View style={s.reqInfoRow}>
                  <MCI name="account" size={11} color={C.sub} />
                  <Text style={s.reqInfoText}>{req.driverName}{req.driverPhone ? ` - ${req.driverPhone}` : ''}</Text>
                </View>
              )}
              {req.notes && (
                <View style={s.reqInfoRow}>
                  <Icon name="file-text" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>{req.notes}</Text>
                </View>
              )}
              <View style={s.reqBtnRow}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openRespond(req, 'ACCEPT')}>
                  <LinearGradient colors={[C.g700, C.g600]} style={s.reqAcceptBtnGrad}>
                    <Icon name="check" size={14} color="#fff" />
                    <Text style={s.reqAcceptBtnText}>Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={s.reqRejectBtn} onPress={() => openRespond(req, 'REJECT')}>
                  <Icon name="x" size={14} color={C.red} />
                  <Text style={s.reqRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Accepted requests */}
          {acceptedReqs.length > 0 && acceptedReqs.map(req => (
            <View key={req.id} style={s.acceptedReqBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name="check-circle" size={16} color={C.g600} />
                <Text style={s.acceptedReqText}>Deal confirmed with {req.requestingVendor?.businessName || 'Vendor'}</Text>
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.g700} />
                <Text style={s.viewActivityText}>View in Activity</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Transactions toggle */}
          {(item.p2p_transactions?.length > 0) && (
            <TouchableOpacity style={s.txToggle} onPress={() => setExpandedTx(p => ({ ...p, [item.id]: !p[item.id] }))}>
              <MCI name="swap-horizontal-bold" size={15} color={C.g700} />
              <Text style={s.txToggleText}>{item.p2p_transactions.length} Transaction{item.p2p_transactions.length > 1 ? 's' : ''}</Text>
              <Icon name={expandedTx[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.g700} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          {expandedTx[item.id] && (
            <View style={s.txSection}>{renderTransactions(item.p2p_transactions)}</View>
          )}

          {/* Social Bar */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id, 'BOOKING')}>
              <MCI name="comment-outline" size={16} color={C.sub} />
              <Text style={s.socialText}>{commentCounts[item.id] || 0}</Text>
              <Icon name={expandedComments[item.id] ? 'chevron-up' : 'chevron-down'} size={13} color={C.muted} />
            </TouchableOpacity>
            <View style={s.socialDivider} />
            <TouchableOpacity style={s.socialBtn} onPress={() => setShareOpen(shareOpen === item.id ? null : item.id)}>
              <Icon name="share-2" size={14} color={C.sub} />
              <Text style={s.socialText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Share dropdown */}
          {shareOpen === item.id && (
            <View style={s.shareMenu}>
              <TouchableOpacity style={s.shareOption} onPress={() => shareBookingGeneric(item)}>
                <Icon name="copy" size={14} color={C.sub} />
                <Text style={s.shareOptionText}>Copy & Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareOption} onPress={() => shareBookingWhatsApp(item)}>
                <MCI name="whatsapp" size={16} color="#25D366" />
                <Text style={s.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expanded Comments */}
          {expandedComments[item.id] && renderCommentsSection(item.id, 'BOOKING')}

          {/* Footer Actions */}
          <View style={s.cardFooter}>
            {canEdit && (
              <TouchableOpacity
                style={[s.footerEditBtn, { backgroundColor: C.purpleBg, borderColor: '#DDD6FE' }]}
                onPress={() => navigation.navigate('PostBookingScreen', { editData: item })}
              >
                <Icon name="edit-2" size={13} color={C.purple} />
                <Text style={[s.footerEditText, { color: C.purple }]}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.footerDeleteBtn} onPress={() => handleDelete(item.id, 'booking')}>
              <Icon name="trash-2" size={13} color={C.red} />
              <Text style={s.footerDeleteText}>Delete</Text>
            </TouchableOpacity>
            {pendingReqs.length > 0 && (
              <TouchableOpacity
                style={s.footerAmberBtn}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <MCI name="bell-ring-outline" size={13} color="#92400E" />
                <Text style={s.footerAmberText}>View Responses</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ─── Request Card ─── */
  const renderRequestCard = ({ item }) => {
    const sc = STATUS_CFG[item.status] || STATUS_CFG.PENDING;
    const isVehicle = item.postingType === 'VEHICLE';
    const isExpanded = expandedId === item.id;
    const requesterName = item.requestingVendor?.businessName || 'Vendor';
    const requesterCity = item.requestingVendor?.city || '';
    const initial = requesterName.charAt(0).toUpperCase();
    const accentColor = isVehicle ? C.blue : C.purple;
    const accentBg = isVehicle ? C.blueBg : C.purpleBg;

    return (
      <View style={s.card}>
        {/* Card Top: requester info */}
        <View style={s.reqCardTop}>
          <LinearGradient
            colors={isVehicle ? [C.blue, '#1D4ED8'] : [C.purple, '#6D28D9']}
            style={s.reqAvatarLarge}
          >
            <Text style={s.reqAvatarLargeText}>{initial}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.reqCardName}>{requesterName}</Text>
            {requesterCity ? <Text style={s.reqCardCity}>{requesterCity}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={s.reqCardTime}>{relTime(item.createdAt)}</Text>
            <View style={[s.headerStatusChip, { backgroundColor: sc.bg }]}>
              <View style={[{ width: 5, height: 5, borderRadius: 3, backgroundColor: sc.dot }]} />
              <Text style={[s.headerStatusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>
        </View>

        {/* Posting info row */}
        <View style={s.reqPostingRow}>
          <View style={[s.reqTypeBadge, { backgroundColor: accentBg }]}>
            <MCI name={isVehicle ? 'truck' : 'package-variant'} size={12} color={accentColor} />
            <Text style={[s.reqTypeBadgeText, { color: accentColor }]}>{isVehicle ? 'Vehicle' : 'Booking'}</Text>
          </View>
          <Text style={s.reqPostingNum}>{item.requestNumber}</Text>
          <Text style={s.reqPostingOwner}>
            {item.postingVendor?.businessName ? `· ${item.postingVendor.businessName}` : ''}
          </Text>
        </View>

        {/* Route Row */}
        {(item.vehiclePosting || item.bookingPosting) && (
          <RouteRow
            fromCity={item.vehiclePosting?.fromCity || item.bookingPosting?.fromCity}
            toCity={item.vehiclePosting?.toCity || item.bookingPosting?.toCity}
            icon={isVehicle ? 'truck' : 'package-variant'}
          />
        )}

        {/* Card Body */}
        <View style={s.cardBody}>
          {/* Posting detail card */}
          {item.vehiclePosting && (
            <View style={[s.postingInfoCard, { borderLeftColor: C.blue }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MCI name="truck" size={14} color={C.blue} />
                <Text style={s.postingInfoTitle}>{item.vehiclePosting.vehicleName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-pin" size={10} color={C.muted} />
                <Text style={s.postingInfoRoute}>{item.vehiclePosting.fromCity} → {item.vehiclePosting.toCity}</Text>
              </View>
            </View>
          )}
          {item.bookingPosting && (
            <View style={[s.postingInfoCard, { borderLeftColor: C.purple }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MCI name="package-variant" size={14} color={C.purple} />
                <Text style={s.postingInfoTitle}>{item.bookingPosting.vehicleRequired}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-pin" size={10} color={C.muted} />
                <Text style={s.postingInfoRoute}>{item.bookingPosting.fromCity} → {item.bookingPosting.toCity}</Text>
              </View>
            </View>
          )}

          {/* Expand toggle */}
          {(item.pickupAddress || item.dropAddress || item.notes) && (
            <TouchableOpacity
              style={s.expandToggle}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.g700} />
              <Text style={s.expandToggleText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
            </TouchableOpacity>
          )}

          {/* Request details — expanded */}
          {isExpanded && (
            <View style={s.reqDetailsExpanded}>
              {item.pickupAddress && (
                <View style={s.reqInfoRow}>
                  <View style={[s.miniDot, { backgroundColor: C.g600 }]} />
                  <Text style={s.reqInfoText}>Pickup: {item.pickupAddress}</Text>
                </View>
              )}
              {item.dropAddress && (
                <View style={s.reqInfoRow}>
                  <View style={[s.miniDot, { backgroundColor: C.red }]} />
                  <Text style={s.reqInfoText}>Drop: {item.dropAddress}</Text>
                </View>
              )}
              {item.goodsType && (
                <View style={s.reqInfoRow}>
                  <MCI name="package" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>Goods: {item.goodsType}</Text>
                </View>
              )}
              {item.weight && (
                <View style={s.reqInfoRow}>
                  <MCI name="weight" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>Weight: {item.weight}</Text>
                </View>
              )}
              {item.loadType && (
                <View style={s.reqInfoRow}>
                  <MCI name="format-list-bulleted" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>Load: {item.loadType}</Text>
                </View>
              )}
              {item.notes && (
                <View style={s.reqInfoRow}>
                  <Icon name="file-text" size={11} color={C.muted} />
                  <Text style={s.reqInfoText}>{item.notes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Status banners */}
          {item.status === 'PENDING' && (
            <View style={s.statusBanner}>
              <ActivityIndicator size="small" color={C.amber} />
              <Text style={s.statusBannerText}>Waiting for response...</Text>
            </View>
          )}
          {item.status === 'ACCEPTED' && (
            <View style={[s.statusBanner, { backgroundColor: C.g50, borderColor: C.g300 }]}>
              <MCI name="check-circle" size={18} color={C.g600} />
              <View style={{ flex: 1 }}>
                <Text style={[s.statusBannerText, { color: '#065F46' }]}>Request Accepted!</Text>
                {item.agreedAmount > 0 && (
                  <Text style={[s.statusBannerSub, { color: C.g600 }]}>Agreed: {fmtPrice(item.agreedAmount)}</Text>
                )}
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.g700} />
                <Text style={s.viewActivityText}>View in Activity</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.status === 'REJECTED' && (
            <View style={[s.statusBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <MCI name="close-circle" size={18} color={C.red} />
              <Text style={[s.statusBannerText, { color: '#991B1B' }]}>Request Rejected</Text>
            </View>
          )}

          {/* Contact actions for accepted */}
          {item.status === 'ACCEPTED' && item.postingVendor?.phone && (
            <View style={s.contactRow}>
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${item.postingVendor.phone}`)}>
                <Icon name="phone" size={14} color={C.blue} />
                <Text style={s.callBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.waBtn} onPress={() => {
                const ph = (item.postingVendor.phone || '').replace(/\D/g, '');
                Linking.openURL(`https://wa.me/91${ph}`);
              }}>
                <MCI name="whatsapp" size={16} color="#25D366" />
                <Text style={s.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Created time */}
          <View style={s.timestampRow}>
            <Icon name="clock" size={11} color={C.muted} />
            <Text style={s.timestampText}>{relTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredData = getFilteredData();
  const activeFilters = tab === 'requests' ? REQ_STATUS_FILTERS : STATUS_FILTERS;
  const canAdd = tab !== 'requests';
  const activeTab = TABS.find(t => t.key === tab);

  const ListHeader = () => (
    <>
      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(t => {
          const active = tab === t.key;
          const count = getTabCount(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tabItem, active && s.tabItemActive]}
              onPress={() => { setTab(t.key); setStatusFilter('All'); }}
            >
              <MCI name={t.mci} size={16} color={active ? C.g700 : C.muted} />
              <Text style={[s.tabItemText, active && s.tabItemTextActive]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabBadge, active && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, active && s.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
        {activeFilters.map(f => {
          const active = statusFilter === f;
          const cfg = STATUS_CFG[f];
          const count = getStatusCount(f);
          return (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, active && { backgroundColor: cfg?.dot || C.g700, borderColor: cfg?.dot || C.g700 }]}
              onPress={() => setStatusFilter(f)}
            >
              {cfg && <View style={[s.filterDot, { backgroundColor: active ? '#fff' : cfg.dot }]} />}
              {f === 'All' && <Icon name="layers" size={11} color={active ? '#fff' : C.muted} />}
              <Text style={[s.filterText, active && { color: '#fff', fontWeight: '700' }]}>
                {f === 'All' ? 'All' : (cfg?.label || f)}
              </Text>
              <View style={[s.filterCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[s.filterCountText, active && { color: '#fff' }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <View style={s.resultsRow}>
        <Text style={s.resultsText}>
          {filteredData.length} {tab === 'vehicles' ? 'vehicle' : tab === 'bookings' ? 'booking' : 'request'}{filteredData.length !== 1 ? 's' : ''}
          {statusFilter !== 'All' && ` · ${STATUS_CFG[statusFilter]?.label || statusFilter}`}
        </Text>
      </View>
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.g950 }}>
        {/* Gradient Header */}
        <LinearGradient colors={[C.g950, C.g900, C.g800]} style={s.header}>
          {/* Decorative circles */}
          <View style={s.hCircle1} />
          <View style={s.hCircle2} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>My Postings</Text>
            <Text style={s.headerSub}>Manage your P2P listings</Text>
          </View>
          {canAdd && (
            <TouchableOpacity style={s.addHeaderBtn} onPress={handleAdd}>
              <Icon name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </SafeAreaView>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.g600} /></View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={tab === 'vehicles' ? renderVehicleCard : tab === 'bookings' ? renderBookingCard : renderRequestCard}
          keyExtractor={item => String(item.id)}
          extraData={[commentCounts, expandedComments, commentsData, expandedTx, shareOpen, expandedId]}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} />}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={s.empty}>
              <LinearGradient colors={[C.g100, C.g50]} style={s.emptyIconWrap}>
                <MCI name={tab === 'vehicles' ? 'truck-outline' : tab === 'bookings' ? 'package-variant' : 'send'} size={40} color={C.g700} />
              </LinearGradient>
              <Text style={s.emptyTitle}>
                {tab === 'vehicles' ? 'No Vehicles Posted' : tab === 'bookings' ? 'No Bookings Shared' : 'No Requests Sent'}
              </Text>
              <Text style={s.emptyMsg}>
                {tab === 'vehicles' ? 'Post a vehicle to share it with other vendors'
                  : tab === 'bookings' ? 'Share a booking to find partner vehicles'
                  : 'Browse vehicles or bookings and send requests'}
              </Text>
              {canAdd && (
                <TouchableOpacity onPress={handleAdd}>
                  <LinearGradient colors={[C.g700, C.g600]} style={s.emptyBtn}>
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={s.emptyBtnText}>{activeTab?.addLabel}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {!canAdd && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('BrowseVehiclesScreen')}>
                    <LinearGradient colors={[C.blue + 'E0', C.blue]} style={s.emptyBtnSmall}>
                      <MCI name="truck" size={16} color="#fff" />
                      <Text style={s.emptyBtnText}>Browse Vehicles</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('BrowseBookingsScreen')}>
                    <LinearGradient colors={[C.purple + 'E0', C.purple]} style={s.emptyBtnSmall}>
                      <MCI name="package-variant" size={16} color="#fff" />
                      <Text style={s.emptyBtnText}>Browse Bookings</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      {canAdd && (
        <TouchableOpacity activeOpacity={0.85} onPress={handleAdd} style={s.fabWrapper}>
          <LinearGradient colors={[C.g700, C.g600]} style={s.fab}>
            <Icon name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Respond Modal */}
      <Modal visible={respondModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {/* Gradient header with handle */}
            <LinearGradient
              colors={respondAction === 'ACCEPT' ? [C.g800, C.g700] : ['#7F1D1D', '#991B1B']}
              style={s.modalGradientHeader}
            >
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalIconWrap}>
                  <Icon name={respondAction === 'ACCEPT' ? 'check' : 'x'} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitle}>Respond to Request</Text>
                  <Text style={s.modalTitleSub}>From: {selRequest?.requestingVendor?.businessName || 'Vendor'}</Text>
                </View>
                <TouchableOpacity onPress={() => setRespondModal(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={s.modalBody}>
              {/* Request summary */}
              {selRequest && (
                <View style={s.modalSummaryCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <LinearGradient colors={[C.g700, C.g500]} style={s.modalSummaryAvatar}>
                      <Text style={s.modalSummaryInitial}>
                        {(selRequest?.requestingVendor?.businessName || 'V')[0]}
                      </Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.modalSummaryName}>{selRequest?.requestingVendor?.businessName || 'Vendor'}</Text>
                      {selRequest?.requestingVendor?.city && (
                        <Text style={s.modalSummaryCity}>{selRequest.requestingVendor.city}</Text>
                      )}
                    </View>
                  </View>
                  {selRequest.pickupAddress && (
                    <View style={s.modalSummaryRow}>
                      <View style={[s.miniDot, { backgroundColor: C.g600, width: 8, height: 8 }]} />
                      <Text style={s.modalSummaryText}>Pickup: {selRequest.pickupAddress}</Text>
                    </View>
                  )}
                  {selRequest.dropAddress && (
                    <View style={s.modalSummaryRow}>
                      <View style={[s.miniDot, { backgroundColor: C.red, width: 8, height: 8 }]} />
                      <Text style={s.modalSummaryText}>Drop: {selRequest.dropAddress}</Text>
                    </View>
                  )}
                </View>
              )}

              {respondAction === 'ACCEPT' && (
                <>
                  <Text style={s.formLabel}>AGREED AMOUNT (OPTIONAL)</Text>
                  <View style={s.amountFieldCard}>
                    <View style={s.rupeeIcon}>
                      <Text style={s.rupeeText}>₹</Text>
                    </View>
                    <TextInput
                      style={s.amountInput}
                      value={agreedAmount}
                      onChangeText={setAgreedAmount}
                      placeholder="Enter agreed amount"
                      placeholderTextColor={C.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <View style={s.modalBtnRow}>
                <TouchableOpacity
                  style={{ flex: 1, opacity: responding ? 0.6 : 1 }}
                  onPress={handleRespond}
                  disabled={responding}
                >
                  <LinearGradient
                    colors={respondAction === 'ACCEPT' ? [C.g700, C.g600] : ['#DC2626', C.red]}
                    style={s.respondBtn}
                  >
                    {responding ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Icon name={respondAction === 'ACCEPT' ? 'check' : 'x'} size={18} color="#fff" />
                        <Text style={s.respondBtnText}>
                          {respondAction === 'ACCEPT' ? 'Accept Request' : 'Decline'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                {respondAction === 'ACCEPT' && (
                  <TouchableOpacity
                    style={s.modalDeclineOutline}
                    onPress={() => { setRespondAction('REJECT'); }}
                  >
                    <Icon name="x" size={16} color={C.red} />
                    <Text style={s.modalDeclineText}>Decline</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
    overflow: 'hidden',
  },
  hCircle1: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -40, right: 60,
  },
  hCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -10, right: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  addHeaderBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: C.g600,
  },
  tabItemText: { fontSize: 12, fontWeight: '600', color: C.muted },
  tabItemTextActive: { color: C.g700, fontWeight: '700' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: C.g100 },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: C.muted },
  tabBadgeTextActive: { color: C.g700 },

  /* Filter Chips */
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { fontSize: 11, color: C.muted, fontWeight: '600' },
  filterCount: {
    minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: C.g100, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 9, fontWeight: '800', color: C.g700 },

  /* Results row */
  resultsRow: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 2 },
  resultsText: { fontSize: 11, color: C.muted, fontWeight: '600' },

  /* List */
  list: { paddingHorizontal: 12, paddingBottom: 110 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: 18, marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10,
    elevation: 3, overflow: 'hidden',
  },

  /* Card Gradient Header */
  cardGradHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -30, right: 40,
  },
  headerCircle2: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -5, right: 10,
  },
  headerIconCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerVehName: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  headerVehPlate: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerStatusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  headerStatusText: { fontSize: 10, fontWeight: '700' },
  headerPostingNum: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '600', letterSpacing: 0.3 },

  /* Route Row */
  routeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 14, marginTop: 10,
    paddingVertical: 9, paddingHorizontal: 12,
    backgroundColor: '#F8FAFC', borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },
  routeDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500 },
  routeDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  routeLine: { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  routeCity: { fontSize: 12, fontWeight: '600', color: C.text, maxWidth: 90 },

  /* Card Body */
  cardBody: { padding: 14, paddingTop: 12 },

  /* Info row chips */
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: C.g100,
  },
  infoChipText: { fontSize: 11, color: C.g700, fontWeight: '600' },

  /* Feature badges */
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  featureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 7, borderWidth: 1, borderColor: C.border,
  },
  featureBadgeText: { fontSize: 10, color: C.sub, fontWeight: '600' },

  /* Reason row */
  reasonRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8,
    marginTop: 8, borderWidth: 1, borderColor: C.border,
  },
  reasonText: { fontSize: 11, color: C.sub, flex: 1, lineHeight: 16 },

  /* Commission grid */
  commGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  commBox: {
    flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6,
    alignItems: 'center', gap: 2, borderWidth: 1, borderColor: C.border,
  },
  commLbl: { fontSize: 9, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  commAmount: { fontSize: 13, fontWeight: '800', color: C.text },
  // used in booking, needs alias
  g200: '#A7F3D0',

  /* Pending bar */
  pendingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.amberBg, marginTop: 10,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  pendingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber },
  pendingText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  /* Inline request card */
  inlineReqCard: {
    backgroundColor: C.g50, borderRadius: 14, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: C.border,
  },
  reqAvatar: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  reqFrom: { fontSize: 13, fontWeight: '700', color: C.text },
  reqCity: { fontSize: 10, color: C.muted },
  reqTime: { fontSize: 10, color: C.muted },
  reqInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  reqInfoText: { fontSize: 11, color: C.sub, flex: 1 },
  reqBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reqAcceptBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: 12,
  },
  reqAcceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  reqRejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: C.redBg, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  reqRejectBtnText: { fontSize: 13, fontWeight: '700', color: C.red },

  /* Accepted request bar */
  acceptedReqBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g50, marginTop: 8, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.g300,
  },
  acceptedReqText: { fontSize: 12, fontWeight: '600', color: '#065F46', flex: 1 },
  viewActivityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: C.g100,
  },
  viewActivityText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  /* Transactions */
  txToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g50, marginTop: 10,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  txToggleText: { fontSize: 12, color: C.g700, fontWeight: '700' },
  txSection: { marginTop: 6 },
  txItem: {
    backgroundColor: C.g50, borderRadius: 12, padding: 10, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  txNumber: { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'monospace' },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  txBadgeText: { fontSize: 9, fontWeight: '700' },
  txVendor: { fontSize: 11, fontWeight: '600', color: C.sub },
  txAmount: { fontSize: 13, fontWeight: '800', color: C.g700 },
  txTime: { fontSize: 10, color: C.muted, marginTop: 4 },

  /* Social Bar */
  socialBar: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  socialDivider: { width: 1, height: 20, backgroundColor: C.border },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6,
  },
  socialText: { fontSize: 12, color: C.sub, fontWeight: '600' },

  /* Share menu */
  shareMenu: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 4, marginTop: 6,
    borderWidth: 1, borderColor: C.border,
  },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
  },
  shareOptionText: { fontSize: 13, color: C.text, fontWeight: '600' },

  /* Card Footer */
  cardFooter: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  footerEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.blueBg, borderWidth: 1, borderColor: '#BFDBFE',
  },
  footerEditText: { fontSize: 12, fontWeight: '700', color: C.blue },
  footerDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.redBg, borderWidth: 1, borderColor: '#FECACA',
  },
  footerDeleteText: { fontSize: 12, fontWeight: '700', color: C.red },
  footerAmberBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    backgroundColor: C.amberBg, borderWidth: 1, borderColor: '#FDE68A',
  },
  footerAmberText: { fontSize: 12, fontWeight: '700', color: '#92400E' },

  /* Request Card */
  reqCardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingBottom: 10,
  },
  reqAvatarLarge: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvatarLargeText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  reqCardName: { fontSize: 15, fontWeight: '700', color: C.text },
  reqCardCity: { fontSize: 11, color: C.muted, marginTop: 2 },
  reqCardTime: { fontSize: 10, color: C.muted, fontWeight: '500' },

  reqPostingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingBottom: 4,
  },
  reqTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  reqTypeBadgeText: { fontSize: 10, fontWeight: '700' },
  reqPostingNum: { fontSize: 11, color: C.sub, fontWeight: '600', fontFamily: 'monospace' },
  reqPostingOwner: { fontSize: 11, color: C.muted },

  /* Expand toggle */
  expandToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: C.g50, borderRadius: 8, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: C.g100,
  },
  expandToggleText: { fontSize: 11, fontWeight: '700', color: C.g700 },

  /* Request details expanded */
  reqDetailsExpanded: {
    marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 10, gap: 4, borderWidth: 1, borderColor: C.border,
  },
  miniDot: { width: 6, height: 6, borderRadius: 3 },

  /* Posting info card */
  postingInfoCard: {
    marginTop: 10, backgroundColor: C.g50, borderRadius: 12,
    padding: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: C.border,
  },
  postingInfoTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  postingInfoRoute: { fontSize: 11, color: C.sub },

  /* Status banners */
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.amberBg, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, marginTop: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  statusBannerText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  statusBannerSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  /* Contact row */
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.blueBg, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  callBtnText: { fontSize: 12, fontWeight: '700', color: C.blue },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#F0FDF4', paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  /* Timestamp */
  timestampRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border,
  },
  timestampText: { fontSize: 10, color: C.muted },

  /* Comments */
  commentsSection: {
    marginTop: 8, backgroundColor: C.g50, borderRadius: 14,
    padding: 10, borderWidth: 1, borderColor: C.border,
  },
  noComments: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' },
  commentItem: {
    flexDirection: 'row', gap: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  commentInitial: { fontSize: 12, fontWeight: '800', color: '#fff' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentName: { fontSize: 12, fontWeight: '700', color: C.text },
  commentTime: { fontSize: 9, color: C.muted },
  commentMsg: { fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border,
  },
  commentInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 12, color: C.text,
  },
  commentSendBtn: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Empty state */
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14, marginTop: 4,
  },
  emptyBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* FAB */
  fabWrapper: { position: 'absolute', bottom: 24, right: 20 },
  fab: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.g800, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
  },
  modalGradientHeader: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 18 },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: 16,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconWrap: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  modalTitleSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { padding: 20 },

  /* Modal summary card */
  modalSummaryCard: {
    backgroundColor: C.g50, borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: C.g100,
  },
  modalSummaryAvatar: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  modalSummaryInitial: { fontSize: 15, fontWeight: '800', color: '#fff' },
  modalSummaryName: { fontSize: 14, fontWeight: '700', color: C.text },
  modalSummaryCity: { fontSize: 11, color: C.muted, marginTop: 1 },
  modalSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  modalSummaryText: { fontSize: 12, color: C.sub, fontWeight: '500', flex: 1 },

  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },

  /* Amount field card */
  amountFieldCard: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, overflow: 'hidden',
  },
  rupeeIcon: {
    width: 44, justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: C.border, paddingVertical: 14,
    backgroundColor: C.g100,
  },
  rupeeText: { fontSize: 16, fontWeight: '700', color: C.g700 },
  amountInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: C.text, fontWeight: '600',
  },

  /* Modal buttons */
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  respondBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 16,
  },
  respondBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modalDeclineOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 15, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: C.redBg,
  },
  modalDeclineText: { fontSize: 14, fontWeight: '700', color: C.red },
});
