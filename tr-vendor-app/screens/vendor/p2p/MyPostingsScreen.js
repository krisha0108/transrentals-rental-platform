import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getP2PMyPostings, deleteP2PVehicle, deleteP2PBooking,
  respondP2PRequest, getP2PMyRequests, getP2PComments, addP2PComment,
} from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F1F5F9', surface: '#FFFFFF', text: '#1E293B', sub: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
  indigo: '#6366F1',
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
          <ActivityIndicator size="small" color={C.indigo} style={{ padding: 12 }} />
        ) : comments.length === 0 ? (
          <Text style={s.noComments}>No comments yet. Be the first!</Text>
        ) : (
          comments.map(c => (
            <View key={c.id} style={s.commentItem}>
              <View style={s.commentAvatar}>
                <Text style={s.commentInitial}>{c.vendor?.businessName?.charAt(0) || '?'}</Text>
              </View>
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
            style={[s.commentSendBtn, !(commentInputs[id] || '').trim() && { opacity: 0.4 }]}
            onPress={() => sendComment(id, type)}
            disabled={!(commentInputs[id] || '').trim() || sendingComment[id]}
          >
            {sendingComment[id]
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="send" size={14} color="#fff" />}
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
            <MCI name="swap-horizontal-bold" size={16} color={C.indigo} />
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

  /* ─── Vehicle Card ─── */
  const renderVehicleCard = ({ item }) => {
    const sc = STATUS_CFG[item.status] || STATUS_CFG.ACTIVE;
    const canEdit = ['ACTIVE', 'REQUESTED'].includes(item.status);
    const pendingReqs = item.p2p_requests?.filter(r => r.status === 'PENDING') || [];
    const acceptedReqs = item.p2p_requests?.filter(r => r.status === 'ACCEPTED') || [];
    const isExpanded = expandedId === item.id;
    const isTruck = item.serviceType === 'truck';

    return (
      <View style={s.card}>
        {/* Left accent */}
        <View style={[s.cardLeftAccent, { backgroundColor: C.blue }]} />

        <View style={s.cardBody}>
          {/* Header */}
          <View style={s.cardHeader}>
            <View style={[s.cardIcon, { backgroundColor: '#EFF6FF' }]}>
              <MCI name={isTruck ? 'truck' : 'car-side'} size={22} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.vehicleName || 'Vehicle'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={s.cardId}>{item.postingNumber}</Text>
                {item.vehicleNumber && (
                  <>
                    <View style={s.dotSep} />
                    <Text style={s.cardId}>{item.vehicleNumber}</Text>
                  </>
                )}
              </View>
            </View>
            <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
              <View style={[s.statusDot, { backgroundColor: sc.dot || sc.text }]} />
              <Text style={[s.statusLabel, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={s.routeCard}>
            <View style={s.routeTimeline}>
              <View style={[s.routeCircle, { borderColor: C.blue }]} />
              <View style={[s.routeLine, { backgroundColor: C.blue + '40' }]} />
              <View style={[s.routeCircleFilled, { backgroundColor: C.blue }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
              <Text style={s.routeCity} numberOfLines={1}>{item.toCity || '-'}</Text>
            </View>
          </View>

          {/* Info chips */}
          <View style={s.chipRow}>
            <View style={s.chip}>
              <Icon name="calendar" size={11} color={C.blue} />
              <Text style={s.chipText}>{fmtDate(item.departureDate)}</Text>
            </View>
            <View style={[s.chip, { backgroundColor: isTruck ? '#F3E8FF' : '#EFF6FF' }]}>
              <MCI name={isTruck ? 'truck' : 'car'} size={11} color={isTruck ? C.purple : C.blue} />
              <Text style={[s.chipText, { color: isTruck ? C.purple : C.blue, fontWeight: '700' }]}>
                {(item.serviceType || '').toUpperCase()}
              </Text>
            </View>
            {item.capacity && (
              <View style={s.chip}>
                <MCI name="weight" size={11} color={C.sub} />
                <Text style={s.chipText}>{item.capacity}</Text>
              </View>
            )}
            {item.driverIncluded && (
              <View style={[s.chip, { backgroundColor: '#ECFDF5' }]}>
                <MCI name="account-check" size={11} color={C.brand} />
                <Text style={[s.chipText, { color: C.brand }]}>Driver</Text>
              </View>
            )}
          </View>

          {/* Price + Features */}
          <View style={s.priceBar}>
            <View>
              <Text style={s.priceLbl}>Full Load Price</Text>
              <Text style={s.priceVal}>{fmtPrice(item.priceFullLoad)}</Text>
            </View>
            {item.pricePartLoad > 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.priceLbl}>Part Load</Text>
                <Text style={[s.priceVal, { color: C.purple, fontSize: 15 }]}>{fmtPrice(item.pricePartLoad)}</Text>
              </View>
            )}
          </View>

          {/* Feature badges */}
          {(item.bodyType || item.acceptsPartLoad) && (
            <View style={s.featRow}>
              {item.bodyType && (
                <View style={s.featBadge}>
                  <MCI name="shape" size={10} color={C.sub} />
                  <Text style={s.featText}>{item.bodyType}</Text>
                </View>
              )}
              {item.acceptsPartLoad && (
                <View style={[s.featBadge, { backgroundColor: '#F3E8FF' }]}>
                  <MCI name="package-variant" size={10} color={C.purple} />
                  <Text style={[s.featText, { color: C.purple }]}>Part Load OK</Text>
                </View>
              )}
            </View>
          )}

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
                <View style={s.reqAvatar}>
                  <Text style={s.reqAvatarText}>{(req.requestingVendor?.businessName || 'V')[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqFrom}>{req.requestingVendor?.businessName || 'Vendor'}</Text>
                  {req.requestingVendor?.city && <Text style={s.reqCity}>{req.requestingVendor.city}</Text>}
                </View>
                <Text style={s.reqTime}>{relTime(req.createdAt)}</Text>
              </View>
              {req.pickupAddress && (
                <View style={s.reqInfoRow}>
                  <Icon name="map-pin" size={11} color={C.brand} />
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
                <TouchableOpacity style={s.reqAcceptBtn} onPress={() => openRespond(req, 'ACCEPT')}>
                  <Icon name="check" size={14} color="#fff" />
                  <Text style={s.reqAcceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.reqRejectBtn} onPress={() => openRespond(req, 'REJECT')}>
                  <Icon name="x" size={14} color={C.red} />
                  <Text style={s.reqRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Accepted requests - View in Activity */}
          {acceptedReqs.length > 0 && acceptedReqs.map(req => (
            <View key={req.id} style={s.acceptedReqBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name="check-circle" size={16} color={C.brand} />
                <Text style={s.acceptedReqText}>Deal confirmed with {req.requestingVendor?.businessName || 'Vendor'}</Text>
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.brand} />
                <Text style={s.viewActivityText}>View in Activity</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Transactions toggle */}
          {(item.p2p_transactions?.length > 0) && (
            <TouchableOpacity style={s.txToggle} onPress={() => setExpandedTx(p => ({ ...p, [item.id]: !p[item.id] }))}>
              <MCI name="swap-horizontal-bold" size={15} color={C.indigo} />
              <Text style={s.txToggleText}>{item.p2p_transactions.length} Transaction{item.p2p_transactions.length > 1 ? 's' : ''}</Text>
              <Icon name={expandedTx[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.indigo} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          {expandedTx[item.id] && (
            <View style={s.txSection}>{renderTransactions(item.p2p_transactions)}</View>
          )}

          {/* Social Bar: Comments & Share */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id, 'VEHICLE')}>
              <MCI name="comment-outline" size={16} color={C.sub} />
              <Text style={s.socialText}>{commentCounts[item.id] || 0}</Text>
              <Icon name={expandedComments[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
            </TouchableOpacity>
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

          {/* Actions */}
          {canEdit && (
            <View style={s.cardActionsRow}>
              <TouchableOpacity style={s.editBtn} onPress={() => {
                navigation.navigate('PostVehicleScreen', { editId: item.id });
              }}>
                <Icon name="edit-2" size={13} color={C.blue} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id, 'vehicle')}>
                <Icon name="trash-2" size={13} color={C.red} />
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
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
      : { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' };
    const pendingReqs = item.p2p_requests?.filter(r => r.status === 'PENDING') || [];
    const acceptedReqs = item.p2p_requests?.filter(r => r.status === 'ACCEPTED') || [];
    const isExpanded = expandedId === item.id;

    return (
      <View style={s.card}>
        <View style={[s.cardLeftAccent, { backgroundColor: C.purple }]} />

        <View style={s.cardBody}>
          {/* Header */}
          <View style={s.cardHeader}>
            <View style={[s.cardIcon, { backgroundColor: '#F5F3FF' }]}>
              <MCI name="package-variant" size={22} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.vehicleRequired || 'Booking'}</Text>
              <Text style={s.cardId}>{item.postingNumber}</Text>
            </View>
            <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
              <View style={[s.statusDot, { backgroundColor: sc.dot || sc.text }]} />
              <Text style={[s.statusLabel, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={s.routeCard}>
            <View style={s.routeTimeline}>
              <View style={[s.routeCircle, { borderColor: C.purple }]} />
              <View style={[s.routeLine, { backgroundColor: C.purple + '40' }]} />
              <View style={[s.routeCircleFilled, { backgroundColor: C.purple }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
              <Text style={s.routeCity} numberOfLines={1}>{item.toCity || '-'}</Text>
            </View>
            {item.bookingType === 'ROUND_TRIP' && (
              <View style={s.roundTripBadge}>
                <MCI name="swap-horizontal" size={12} color={C.purple} />
                <Text style={s.roundTripText}>Round Trip</Text>
              </View>
            )}
          </View>

          {/* Info chips */}
          <View style={s.chipRow}>
            <View style={s.chip}>
              <Icon name="calendar" size={11} color={C.purple} />
              <Text style={s.chipText}>{fmtDate(item.tripDate)}</Text>
            </View>
            <View style={[s.chip, { backgroundColor: urgCfg.bg }]}>
              <View style={[s.miniDot, { backgroundColor: urgCfg.dot }]} />
              <Text style={[s.chipText, { color: urgCfg.text, fontWeight: '700' }]}>{item.urgency}</Text>
            </View>
            {item.returnDate && (
              <View style={s.chip}>
                <Icon name="corner-down-left" size={11} color={C.sub} />
                <Text style={s.chipText}>{fmtDate(item.returnDate)}</Text>
              </View>
            )}
          </View>

          {/* Commission breakdown */}
          <View style={s.commGrid}>
            <View style={[s.commBox, { backgroundColor: '#F8FAFC' }]}>
              <Text style={s.commLbl}>Budget</Text>
              <Text style={s.commAmount}>{fmtPrice(item.customerBudget)}</Text>
            </View>
            <View style={[s.commBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[s.commLbl, { color: C.brand }]}>Earning</Text>
              <Text style={[s.commAmount, { color: C.brand }]}>{fmtPrice(item.partnerEarning)}</Text>
            </View>
            <View style={[s.commBox, { backgroundColor: '#FFFBEB' }]}>
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
                <View style={[s.reqAvatar, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[s.reqAvatarText, { color: C.purple }]}>{(req.requestingVendor?.businessName || 'V')[0]}</Text>
                </View>
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
                <TouchableOpacity style={s.reqAcceptBtn} onPress={() => openRespond(req, 'ACCEPT')}>
                  <Icon name="check" size={14} color="#fff" />
                  <Text style={s.reqAcceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.reqRejectBtn} onPress={() => openRespond(req, 'REJECT')}>
                  <Icon name="x" size={14} color={C.red} />
                  <Text style={s.reqRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Accepted requests - View in Activity */}
          {acceptedReqs.length > 0 && acceptedReqs.map(req => (
            <View key={req.id} style={s.acceptedReqBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name="check-circle" size={16} color={C.brand} />
                <Text style={s.acceptedReqText}>Deal confirmed with {req.requestingVendor?.businessName || 'Vendor'}</Text>
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.brand} />
                <Text style={s.viewActivityText}>View in Activity</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Transactions toggle */}
          {(item.p2p_transactions?.length > 0) && (
            <TouchableOpacity style={s.txToggle} onPress={() => setExpandedTx(p => ({ ...p, [item.id]: !p[item.id] }))}>
              <MCI name="swap-horizontal-bold" size={15} color={C.indigo} />
              <Text style={s.txToggleText}>{item.p2p_transactions.length} Transaction{item.p2p_transactions.length > 1 ? 's' : ''}</Text>
              <Icon name={expandedTx[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.indigo} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          {expandedTx[item.id] && (
            <View style={s.txSection}>{renderTransactions(item.p2p_transactions)}</View>
          )}

          {/* Social Bar: Comments & Share */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id, 'BOOKING')}>
              <MCI name="comment-outline" size={16} color={C.sub} />
              <Text style={s.socialText}>{commentCounts[item.id] || 0}</Text>
              <Icon name={expandedComments[item.id] ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
            </TouchableOpacity>
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

          {/* Actions */}
          {canEdit && (
            <View style={s.cardActionsRow}>
              <TouchableOpacity style={s.editBtn} onPress={() => {
                navigation.navigate('PostBookingScreen', { editId: item.id });
              }}>
                <Icon name="edit-2" size={13} color={C.purple} />
                <Text style={[s.editBtnText, { color: C.purple }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id, 'booking')}>
                <Icon name="trash-2" size={13} color={C.red} />
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  /* ─── Request Card ─── */
  const renderRequestCard = ({ item }) => {
    const sc = STATUS_CFG[item.status] || STATUS_CFG.PENDING;
    const isVehicle = item.postingType === 'VEHICLE';
    const accentColor = isVehicle ? C.blue : C.purple;

    return (
      <View style={s.card}>
        <View style={[s.cardLeftAccent, { backgroundColor: accentColor }]} />

        <View style={s.cardBody}>
          {/* Header */}
          <View style={s.cardHeader}>
            <View style={[s.cardIcon, { backgroundColor: isVehicle ? '#EFF6FF' : '#F5F3FF' }]}>
              <MCI name={isVehicle ? 'truck' : 'package-variant'} size={22} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.requestNumber}</Text>
                <View style={[s.typeBadge, { backgroundColor: isVehicle ? '#EFF6FF' : '#F5F3FF' }]}>
                  <Text style={[s.typeBadgeText, { color: accentColor }]}>{isVehicle ? 'Vehicle' : 'Booking'}</Text>
                </View>
              </View>
              <Text style={s.reqToVendor}>
                To: {item.postingVendor?.businessName || 'Vendor'}{item.postingVendor?.city ? ` (${item.postingVendor.city})` : ''}
              </Text>
            </View>
            <View style={[s.statusChip, { backgroundColor: sc.bg }]}>
              <View style={[s.statusDot, { backgroundColor: sc.dot || sc.text }]} />
              <Text style={[s.statusLabel, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>

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

          {/* Request details */}
          {(item.pickupAddress || item.dropAddress) && (
            <View style={s.reqDetailsCard}>
              {item.pickupAddress && (
                <View style={s.reqInfoRow}>
                  <View style={[s.miniDot, { backgroundColor: C.brand }]} />
                  <Text style={s.reqInfoText}>Pickup: {item.pickupAddress}</Text>
                </View>
              )}
              {item.dropAddress && (
                <View style={s.reqInfoRow}>
                  <View style={[s.miniDot, { backgroundColor: C.red }]} />
                  <Text style={s.reqInfoText}>Drop: {item.dropAddress}</Text>
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

          {/* Status indicator */}
          {item.status === 'PENDING' && (
            <View style={s.statusBanner}>
              <ActivityIndicator size="small" color={C.amber} />
              <Text style={s.statusBannerText}>Waiting for response...</Text>
            </View>
          )}
          {item.status === 'ACCEPTED' && (
            <View style={[s.statusBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <MCI name="check-circle" size={18} color={C.brand} />
              <View style={{ flex: 1 }}>
                <Text style={[s.statusBannerText, { color: '#065F46' }]}>Request Accepted!</Text>
                {item.agreedAmount > 0 && (
                  <Text style={[s.statusBannerSub, { color: C.brand }]}>Agreed: {fmtPrice(item.agreedAmount)}</Text>
                )}
              </View>
              <TouchableOpacity style={s.viewActivityBtn} onPress={() => navigation.navigate('P2PActivityScreen')}>
                <Icon name="eye" size={13} color={C.brand} />
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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>My Postings</Text>
          <Text style={s.headerSub}>Manage your vehicles, bookings & requests</Text>
        </View>
        {canAdd && (
          <TouchableOpacity style={s.addHeaderBtn} onPress={handleAdd}>
            <Icon name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        {TABS.map((t, i) => {
          const count = getTabCount(t.key);
          const isActive = tab === t.key;
          return (
            <React.Fragment key={t.key}>
              {i > 0 && <View style={s.statsDivider} />}
              <TouchableOpacity style={[s.statsItem, isActive && s.statsItemActive]} onPress={() => { setTab(t.key); setStatusFilter('All'); }}>
                <View style={[s.statsIconWrap, { backgroundColor: isActive ? t.color + '20' : '#F1F5F9' }]}>
                  <MCI name={t.mci} size={16} color={isActive ? t.color : C.muted} />
                </View>
                <Text style={[s.statsCount, isActive && { color: t.color }]}>{count}</Text>
                <Text style={[s.statsLabel, isActive && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => {
          const active = tab === t.key;
          const count = getTabCount(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, active && { borderBottomColor: t.color, borderBottomWidth: 3 }]}
              onPress={() => { setTab(t.key); setStatusFilter('All'); }}
            >
              <Icon name={t.icon} size={15} color={active ? t.color : C.muted} />
              <Text style={[s.tabText, active && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabBadge, active && { backgroundColor: t.color }]}>
                  <Text style={[s.tabBadgeText, active && { color: '#fff' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filters */}
      <View style={s.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {activeFilters.map(f => {
            const active = statusFilter === f;
            const cfg = STATUS_CFG[f];
            const count = getStatusCount(f);
            return (
              <TouchableOpacity
                key={f}
                style={[s.filterChip, active && { backgroundColor: (cfg?.dot || C.indigo) + '15', borderColor: cfg?.dot || C.indigo }]}
                onPress={() => setStatusFilter(f)}
              >
                {cfg && <View style={[s.filterDot, { backgroundColor: active ? cfg.dot || cfg.text : cfg.dot + '60' }]} />}
                {f === 'All' && <Icon name="layers" size={12} color={active ? C.indigo : C.muted} />}
                <Text style={[s.filterText, active && { color: cfg?.text || C.indigo, fontWeight: '700' }]}>
                  {f === 'All' ? 'All' : (cfg?.label || f)}
                </Text>
                <View style={[s.filterCount, active && { backgroundColor: (cfg?.dot || C.indigo) + '30' }]}>
                  <Text style={[s.filterCountText, active && { color: cfg?.text || C.indigo }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={s.resultsRow}>
        <Text style={s.resultsText}>
          {filteredData.length} {tab === 'vehicles' ? 'vehicle' : tab === 'bookings' ? 'booking' : 'request'}{filteredData.length !== 1 ? 's' : ''}
          {statusFilter !== 'All' && ` (${STATUS_CFG[statusFilter]?.label || statusFilter})`}
        </Text>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={activeTab?.color || C.indigo} /></View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={tab === 'vehicles' ? renderVehicleCard : tab === 'bookings' ? renderBookingCard : renderRequestCard}
          keyExtractor={item => String(item.id)}
          extraData={[commentCounts, expandedComments, commentsData, expandedTx, shareOpen, expandedId]}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTab?.color || C.indigo]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: (activeTab?.color || C.indigo) + '15' }]}>
                <MCI name={tab === 'vehicles' ? 'truck-outline' : tab === 'bookings' ? 'package-variant' : 'send'} size={40} color={activeTab?.color || C.indigo} />
              </View>
              <Text style={s.emptyTitle}>
                {tab === 'vehicles' ? 'No Vehicles Posted' : tab === 'bookings' ? 'No Bookings Shared' : 'No Requests Sent'}
              </Text>
              <Text style={s.emptyMsg}>
                {tab === 'vehicles' ? 'Post a vehicle to share it with other vendors'
                  : tab === 'bookings' ? 'Share a booking to find partner vehicles'
                  : 'Browse vehicles or bookings and send requests'}
              </Text>
              {canAdd && (
                <TouchableOpacity style={[s.emptyBtn, { backgroundColor: activeTab?.color || C.indigo }]} onPress={handleAdd}>
                  <Icon name="plus" size={16} color="#fff" />
                  <Text style={s.emptyBtnText}>{activeTab?.addLabel}</Text>
                </TouchableOpacity>
              )}
              {!canAdd && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={[s.emptyBtn, { backgroundColor: C.blue }]} onPress={() => navigation.navigate('BrowseVehiclesScreen')}>
                    <MCI name="truck" size={16} color="#fff" />
                    <Text style={s.emptyBtnText}>Browse Vehicles</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.emptyBtn, { backgroundColor: C.purple }]} onPress={() => navigation.navigate('BrowseBookingsScreen')}>
                    <MCI name="package-variant" size={16} color="#fff" />
                    <Text style={s.emptyBtnText}>Browse Bookings</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      {canAdd && (
        <TouchableOpacity style={[s.fab, { backgroundColor: activeTab?.color || C.indigo, shadowColor: activeTab?.color || C.indigo }]} onPress={handleAdd} activeOpacity={0.85}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Respond Modal */}
      <Modal visible={respondModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />

            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[s.modalIconWrap, { backgroundColor: respondAction === 'ACCEPT' ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Icon name={respondAction === 'ACCEPT' ? 'check' : 'x'} size={20} color={respondAction === 'ACCEPT' ? C.brand : C.red} />
                </View>
                <View>
                  <Text style={s.modalTitle}>{respondAction === 'ACCEPT' ? 'Accept Request' : 'Reject Request'}</Text>
                  <Text style={s.modalSub}>From: {selRequest?.requestingVendor?.businessName || 'Vendor'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setRespondModal(false)} style={s.modalClose}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Request summary */}
            {selRequest && (
              <View style={s.modalSummary}>
                {selRequest.pickupAddress && (
                  <View style={s.modalSummaryRow}>
                    <Icon name="map-pin" size={12} color={C.brand} />
                    <Text style={s.modalSummaryText}>Pickup: {selRequest.pickupAddress}</Text>
                  </View>
                )}
                {selRequest.dropAddress && (
                  <View style={s.modalSummaryRow}>
                    <Icon name="map-pin" size={12} color={C.red} />
                    <Text style={s.modalSummaryText}>Drop: {selRequest.dropAddress}</Text>
                  </View>
                )}
              </View>
            )}

            {respondAction === 'ACCEPT' && (
              <>
                <Text style={s.formLabel}>AGREED AMOUNT (Optional)</Text>
                <TextInput
                  style={s.input}
                  value={agreedAmount}
                  onChangeText={setAgreedAmount}
                  placeholder={'\u20B9 Enter agreed amount'}
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                />
              </>
            )}

            <TouchableOpacity
              style={[
                s.respondBtn,
                { backgroundColor: respondAction === 'ACCEPT' ? C.brand : C.red },
                responding && { opacity: 0.6 },
              ]}
              onPress={handleRespond}
              disabled={responding}
            >
              {responding ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Icon name={respondAction === 'ACCEPT' ? 'check' : 'x'} size={18} color="#fff" />
                  <Text style={s.respondBtnText}>{respondAction === 'ACCEPT' ? 'Accept Request' : 'Reject Request'}</Text>
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

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.indigo, gap: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  addHeaderBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },

  /* Stats bar */
  statsBar: {
    flexDirection: 'row', backgroundColor: C.surface,
    paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  statsDivider: { width: 1, height: 40, backgroundColor: C.border, alignSelf: 'center' },
  statsItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  statsItemActive: {},
  statsIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statsCount: { fontSize: 18, fontWeight: '800', color: C.text },
  statsLabel: { fontSize: 10, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Tabs */
  tabRow: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabBadge: {
    minWidth: 20, height: 18, borderRadius: 9, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.muted },

  /* Filters */
  filterContainer: {
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  filterCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 9, fontWeight: '800', color: C.muted },

  /* Results */
  resultsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  resultsText: { fontSize: 12, color: C.muted, fontWeight: '600' },

  /* List */
  list: { padding: 12, paddingBottom: 100 },

  /* Card */
  card: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, marginBottom: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 3,
  },
  cardLeftAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardId: { fontSize: 11, color: C.muted, fontFamily: 'monospace', marginTop: 1 },
  dotSep: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.muted },

  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: '700' },

  /* Route */
  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12, marginTop: 12,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  routeTimeline: { alignItems: 'center', gap: 2 },
  routeCircle: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: '#fff' },
  routeLine: { width: 2, height: 14 },
  routeCircleFilled: { width: 10, height: 10, borderRadius: 5 },
  routeCity: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 22 },
  roundTripBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  roundTripText: { fontSize: 9, fontWeight: '700', color: C.purple },

  /* Chips */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  chipText: { fontSize: 11, color: C.sub, fontWeight: '500' },
  miniDot: { width: 5, height: 5, borderRadius: 3 },

  /* Price */
  priceBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  priceLbl: { fontSize: 10, color: C.muted, fontWeight: '600', marginBottom: 2 },
  priceVal: { fontSize: 18, fontWeight: '800', color: C.brand },

  /* Features */
  featRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  featBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  featText: { fontSize: 10, color: C.sub, fontWeight: '600' },

  /* Commission grid */
  commGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  commBox: { flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', gap: 2 },
  commLbl: { fontSize: 9, fontWeight: '700', color: C.muted, textTransform: 'uppercase' },
  commAmount: { fontSize: 13, fontWeight: '800', color: C.text },

  /* Pending bar */
  pendingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', marginTop: 10,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  pendingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.amber },
  pendingText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  /* Inline request card */
  inlineReqCard: {
    backgroundColor: '#FAFBFC', borderRadius: 12, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: C.border,
  },
  reqAvatar: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  reqAvatarText: { fontSize: 14, fontWeight: '800', color: C.blue },
  reqFrom: { fontSize: 13, fontWeight: '700', color: C.text },
  reqCity: { fontSize: 10, color: C.muted },
  reqTime: { fontSize: 10, color: C.muted },
  reqInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  reqInfoText: { fontSize: 11, color: C.sub, flex: 1 },
  reqBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reqAcceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: C.brand, paddingVertical: 10, borderRadius: 10,
  },
  reqAcceptBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  reqRejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: '#FEF2F2', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  reqRejectBtnText: { fontSize: 13, fontWeight: '700', color: C.red },

  /* Request card extras */
  reqToVendor: { fontSize: 11, color: C.muted, marginTop: 2 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },

  postingInfoCard: {
    marginTop: 10, backgroundColor: '#FAFBFC', borderRadius: 10,
    padding: 10, borderLeftWidth: 3,
  },
  postingInfoTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  postingInfoRoute: { fontSize: 11, color: C.sub },

  reqDetailsCard: {
    marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, gap: 4,
  },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginTop: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  statusBannerText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  statusBannerSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  contactRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  callBtnText: { fontSize: 12, fontWeight: '700', color: C.blue },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#F0FDF4', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  timestampRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  timestampText: { fontSize: 10, color: C.muted },

  /* Accepted request bar */
  acceptedReqBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', marginTop: 8, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  acceptedReqText: { fontSize: 12, fontWeight: '600', color: '#065F46', flex: 1 },
  viewActivityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#D1FAE5',
  },
  viewActivityText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  /* Social Bar */
  socialBar: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  socialText: { fontSize: 12, color: C.sub, fontWeight: '600' },

  /* Share dropdown */
  shareMenu: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 4, marginTop: 4,
    borderWidth: 1, borderColor: C.border,
  },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
  },
  shareOptionText: { fontSize: 13, color: C.text, fontWeight: '600' },

  /* Comments */
  commentsSection: {
    marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: C.border,
  },
  noComments: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 12, fontStyle: 'italic' },
  commentItem: {
    flexDirection: 'row', gap: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E7FF',
    justifyContent: 'center', alignItems: 'center',
  },
  commentInitial: { fontSize: 12, fontWeight: '800', color: C.indigo },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentName: { fontSize: 12, fontWeight: '700', color: C.text },
  commentTime: { fontSize: 9, color: C.muted },
  commentMsg: { fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  commentInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 12, color: C.text,
  },
  commentSendBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.indigo,
    justifyContent: 'center', alignItems: 'center',
  },

  /* Transactions */
  txToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EEF2FF', marginTop: 10,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  txToggleText: { fontSize: 12, color: C.indigo, fontWeight: '700' },
  txSection: { marginTop: 6 },
  txItem: {
    backgroundColor: '#FAFBFC', borderRadius: 10, padding: 10, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  txNumber: { fontSize: 12, fontWeight: '700', color: C.text, fontFamily: 'monospace' },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  txBadgeText: { fontSize: 9, fontWeight: '700' },
  txVendor: { fontSize: 11, fontWeight: '600', color: C.sub },
  txAmount: { fontSize: 13, fontWeight: '800', color: C.brand },
  txTime: { fontSize: 10, color: C.muted, marginTop: 4 },

  /* Card actions */
  cardActionsRow: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: C.blue },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: C.red },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  modalSummary: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16, gap: 6,
    borderWidth: 1, borderColor: C.border,
  },
  modalSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalSummaryText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  formLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  respondBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  respondBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
