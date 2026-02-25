import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PBookings, acceptP2PBooking, getVendorFleet, getStaffDrivers, getP2PComments, addP2PComment } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1A1A2E', sub: '#64748B',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
  indigo: '#6366F1',
};

const URG = {
  HIGH: { bg: '#FEE2E2', text: '#DC2626', label: 'HIGH' },
  MEDIUM: { bg: '#FEF3C7', text: '#D97706', label: 'MEDIUM' },
  LOW: { bg: '#D1FAE5', text: '#059669', label: 'LOW' },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}
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

export default function BrowseBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Accept modal
  const [accModal, setAccModal] = useState(false);
  const [selBooking, setSelBooking] = useState(null);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [accNotes, setAccNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [staffDrivers, setStaffDrivers] = useState([]);

  // Comments
  const [commentCounts, setCommentCounts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [sendingComment, setSendingComment] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  // Share
  const [shareOpen, setShareOpen] = useState(null);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
  const showAlert = (t, ti, m) => setAlert({ visible: true, type: t, title: ti, message: m });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchBookings = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (serviceFilter !== 'all') params.serviceType = serviceFilter;
      if (urgencyFilter !== 'all') params.urgency = urgencyFilter;
      if (search.trim()) params.search = search.trim();
      const res = await getP2PBookings(params);
      const bList = res?.bookings || res?.postings || [];
      setBookings(bList);
      setTotalPages(res?.pagination?.totalPages || res?.totalPages || 1);
      setTotalCount(res?.pagination?.total || bList.length);

      // Fetch comment counts
      if (bList.length > 0) {
        const ids = bList.map(b => b.id).join(',');
        getP2PComments({ postingType: 'BOOKING', postingIds: ids, mode: 'counts' })
          .then(r => setCommentCounts(prev => ({ ...prev, ...(r?.counts || {}) })))
          .catch(() => {});
      }
    } catch (e) { showAlert('error', 'Error', 'Failed to load bookings'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, serviceFilter, urgencyFilter, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchBookings(); };

  // Comments
  const toggleComments = async (id) => {
    const isExpanded = expandedComments[id];
    setExpandedComments(p => ({ ...p, [id]: !isExpanded }));
    if (!isExpanded && !commentsData[id]) {
      setLoadingComments(p => ({ ...p, [id]: true }));
      try {
        const res = await getP2PComments({ postingType: 'BOOKING', postingId: id });
        setCommentsData(p => ({ ...p, [id]: res?.comments || [] }));
      } catch (e) {}
      finally { setLoadingComments(p => ({ ...p, [id]: false })); }
    }
  };

  const sendComment = async (id) => {
    const msg = (commentInputs[id] || '').trim();
    if (!msg) return;
    setSendingComment(p => ({ ...p, [id]: true }));
    try {
      const res = await addP2PComment({ postingType: 'BOOKING', postingId: id, message: msg });
      if (res?.comment) {
        setCommentsData(p => ({ ...p, [id]: [...(p[id] || []), res.comment] }));
        setCommentCounts(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
      }
      setCommentInputs(p => ({ ...p, [id]: '' }));
    } catch (e) { showAlert('error', 'Error', 'Failed to send comment'); }
    finally { setSendingComment(p => ({ ...p, [id]: false })); }
  };

  // Share
  const shareWhatsApp = (item) => {
    const msg = `📦 *Booking Available - P2P*\n\n` +
      `*${item.vehicleRequired || item.bookingType}*\n` +
      `📍 ${item.fromCity} → ${item.toCity || 'N/A'}\n` +
      `📅 ${fmtDate(item.tripDate)}\n` +
      `💰 Budget: ${fmtPrice(item.customerBudget)}\n` +
      `👤 Posted by: ${item.vendor?.businessName || 'Vendor'}\n\n` +
      `Check it out on TranStable P2P Marketplace!`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    setShareOpen(null);
  };

  const shareGeneric = async (item) => {
    try {
      await Share.share({
        message: `Booking Available: ${item.vehicleRequired || item.bookingType}\n${item.fromCity} → ${item.toCity}\n${fmtDate(item.tripDate)}\nBudget: ${fmtPrice(item.customerBudget)}`,
      });
    } catch (e) {}
    setShareOpen(null);
  };

  // Accept
  const openAccept = async (booking) => {
    setSelBooking(booking);
    setVehicleName(''); setVehicleNumber('');
    setDriverName(''); setDriverPhone('');
    setAccNotes(''); setAccModal(true);
    try {
      const [fleetRes, driverRes] = await Promise.all([
        getVendorFleet().catch(() => ({})),
        getStaffDrivers().catch(() => ({})),
      ]);
      setFleetVehicles(fleetRes?.fleet || fleetRes?.vehicles || []);
      setStaffDrivers(driverRes?.drivers || []);
    } catch (e) {}
  };

  const selectFleetVehicle = (v) => {
    const brands = v.vehicle_models?.brands?.name || v.brands?.name || '';
    const model = v.vehicle_models?.name || v.chauffeur_vehicle_categories?.name || '';
    setVehicleName(brands && model ? `${brands} ${model}` : v.name || v.vehicleName || '');
    setVehicleNumber(v.registrationNumber || v.vehicleNumber || '');
  };

  const selectDriver = (d) => {
    setDriverName(d.name || '');
    setDriverPhone(d.phone || '');
  };

  const handleAccept = async () => {
    if (!vehicleName.trim()) return showAlert('warning', 'Required', 'Enter vehicle name');
    if (!driverName.trim()) return showAlert('warning', 'Required', 'Enter driver name');
    if (!driverPhone.trim()) return showAlert('warning', 'Required', 'Enter driver phone');
    setSubmitting(true);
    try {
      await acceptP2PBooking(selBooking.id, {
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        notes: accNotes.trim() || undefined,
      });
      setAccModal(false);
      showAlert('success', 'Booking Accepted!', 'Transaction created. Redirecting to Activity...');
      setTimeout(() => navigation.navigate('P2PActivityScreen'), 1500);
    } catch (e) { showAlert('error', 'Failed', 'Could not accept booking'); }
    finally { setSubmitting(false); }
  };

  const renderBooking = ({ item }) => {
    const urg = URG[item.urgency] || URG.LOW;
    const cCount = commentCounts[item.id] || 0;
    const isExpanded = expandedComments[item.id];
    const comments = commentsData[item.id] || [];

    return (
      <View style={s.card}>
        {/* Top row: Urgency + Posting # */}
        <View style={s.cardTop}>
          <Text style={s.postingNum}>{item.postingNumber || ''}</Text>
          <View style={[s.urgBadge, { backgroundColor: urg.bg }]}>
            <Text style={[s.urgText, { color: urg.text }]}>{urg.label}</Text>
          </View>
        </View>

        {/* Vendor Info */}
        <View style={s.vendorRow}>
          <View style={s.vendorAvatar}>
            <Text style={s.vendorInitial}>{item.vendor?.businessName?.charAt(0) || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.vendorName} numberOfLines={1}>{item.vendor?.businessName || 'Vendor'}</Text>
            <View style={s.vendorMeta}>
              <Text style={s.vendorCity}>{item.vendor?.city || '-'}</Text>
              {item.vendor?.rating > 0 && (
                <View style={s.ratingWrap}>
                  <MCI name="star" size={12} color={C.amber} />
                  <Text style={s.ratingText}>{Number(item.vendor.rating).toFixed(1)}</Text>
                  {item.vendor.totalRatings > 0 && (
                    <Text style={s.ratingCount}>({item.vendor.totalRatings})</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Booking type & vehicle tags */}
        <View style={s.tagsRow}>
          <View style={[s.tagPill, { backgroundColor: '#F3E8FF' }]}>
            <MCI name={item.serviceType === 'truck' ? 'truck' : 'car-side'} size={12} color={C.purple} />
            <Text style={[s.tagText, { color: C.purple }]}>{item.bookingType || item.serviceType?.toUpperCase()}</Text>
          </View>
          {!!item.vehicleRequired && (
            <View style={s.tagPill}>
              <Text style={s.tagText}>{item.vehicleRequired}</Text>
            </View>
          )}
          {!!item.vehicleCategory && (
            <View style={[s.tagPill, { backgroundColor: '#F1F5F9' }]}>
              <Text style={s.tagText}>{item.vehicleCategory}</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={s.routeRow}>
          <MCI name="map-marker" size={14} color={C.purple} />
          <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
          {!!item.toCity && (
            <>
              <Icon name="arrow-right" size={12} color={C.muted} />
              <Text style={s.routeCity} numberOfLines={1}>{item.toCity}</Text>
            </>
          )}
          {!!item.returnDate && (
            <View style={[s.tagPill, { backgroundColor: '#DBEAFE', marginLeft: 6 }]}>
              <Text style={[s.tagText, { color: C.blue, fontSize: 10 }]}>Round Trip</Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={s.infoRow}>
          <View style={s.infoChip}>
            <Icon name="calendar" size={11} color={C.muted} />
            <Text style={s.infoText}>{fmtDate(item.tripDate)}</Text>
          </View>
          {!!item.tripTime && (
            <View style={s.infoChip}>
              <Icon name="clock" size={11} color={C.muted} />
              <Text style={s.infoText}>{item.tripTime}</Text>
            </View>
          )}
          {!!item.returnDate && (
            <View style={s.infoChip}>
              <MCI name="calendar-arrow-left" size={12} color={C.blue} />
              <Text style={[s.infoText, { color: C.blue }]}>Return: {fmtDate(item.returnDate)}</Text>
            </View>
          )}
        </View>

        {/* Passengers / Goods */}
        <View style={s.detailsRow}>
          {item.passengers > 0 && (
            <View style={s.detailChip}>
              <MCI name="account-group" size={12} color={C.blue} />
              <Text style={s.detailText}>{item.passengers} pax</Text>
            </View>
          )}
          {!!item.goodsType && (
            <View style={s.detailChip}>
              <MCI name="package-variant" size={12} color={C.amber} />
              <Text style={s.detailText}>{item.goodsType}</Text>
            </View>
          )}
          {!!item.estimatedWeight && (
            <View style={s.detailChip}>
              <Text style={s.detailText}>~{item.estimatedWeight} kg</Text>
            </View>
          )}
        </View>

        {/* Reason */}
        {!!item.reason && (
          <View style={s.reasonBox}>
            <Icon name="alert-circle" size={12} color={C.amber} />
            <Text style={s.reasonText}>{item.reason}</Text>
          </View>
        )}

        {/* Commission Breakdown */}
        <View style={s.commRow}>
          <View style={s.commItem}>
            <Text style={s.commLabel}>CUSTOMER BUDGET</Text>
            <Text style={s.commVal}>{fmtPrice(item.customerBudget)}</Text>
          </View>
          <View style={[s.commItem, { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }]}>
            <Text style={s.commLabel}>YOUR EARNING</Text>
            <Text style={[s.commVal, { color: C.brand }]}>{fmtPrice(item.partnerEarning)}</Text>
          </View>
          <View style={[s.commItem, { borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }]}>
            <Text style={s.commLabel}>COMMISSION</Text>
            <Text style={[s.commVal, { color: C.purple }]}>{fmtPrice(item.commission)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.accBtn} onPress={() => openAccept(item)}>
            <Icon name="plus" size={14} color="#fff" />
            <Text style={s.accBtnText}>Accept Booking</Text>
          </TouchableOpacity>
          {!!item.vendor?.phone && (
            <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openURL(`tel:${item.vendor.phone}`)}>
              <Icon name="phone" size={16} color={C.brand} />
            </TouchableOpacity>
          )}
          {!!item.vendor?.phone && (
            <TouchableOpacity style={s.iconBtn}
              onPress={() => Linking.openURL(`https://wa.me/91${item.vendor.phone.replace(/\D/g, '')}`)}>
              <MCI name="whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>

        {/* Comment & Share Bar */}
        <View style={s.socialBar}>
          <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id)}>
            <MCI name="comment-outline" size={16} color={C.sub} />
            <Text style={s.socialText}>{cCount}</Text>
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.socialBtn} onPress={() => setShareOpen(shareOpen === item.id ? null : item.id)}>
            <Icon name="share-2" size={14} color={C.sub} />
            <Text style={s.socialText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Share dropdown */}
        {shareOpen === item.id && (
          <View style={s.shareMenu}>
            <TouchableOpacity style={s.shareOption} onPress={() => shareGeneric(item)}>
              <Icon name="copy" size={14} color={C.sub} />
              <Text style={s.shareOptionText}>Copy & Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareOption} onPress={() => shareWhatsApp(item)}>
              <MCI name="whatsapp" size={16} color="#25D366" />
              <Text style={s.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expanded Comments */}
        {isExpanded && (
          <View style={s.commentsSection}>
            {loadingComments[item.id] ? (
              <ActivityIndicator size="small" color={C.purple} style={{ padding: 12 }} />
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
                value={commentInputs[item.id] || ''}
                onChangeText={t => setCommentInputs(p => ({ ...p, [item.id]: t }))}
                placeholder="Write a comment..."
                placeholderTextColor={C.muted}
                onSubmitEditing={() => sendComment(item.id)}
              />
              <TouchableOpacity
                style={[s.commentSendBtn, !(commentInputs[item.id] || '').trim() && { opacity: 0.4 }]}
                onPress={() => sendComment(item.id)}
                disabled={!(commentInputs[item.id] || '').trim() || sendingComment[item.id]}
              >
                {sendingComment[item.id]
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="send" size={14} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Available Bookings</Text>
          <Text style={s.headerSub}>Accept bookings from other vendors</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('PostBookingScreen')} style={s.addBtn}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search bookings..." placeholderTextColor={C.muted}
            onSubmitEditing={() => { setPage(1); fetchBookings(); }} returnKeyType="search" />
        </View>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {['all', 'truck', 'car'].map(f => (
          <TouchableOpacity key={f}
            style={[s.filterChip, serviceFilter === f && s.filterActive]}
            onPress={() => { setServiceFilter(f); setPage(1); }}>
            {f !== 'all' && <MCI name={f === 'truck' ? 'truck' : 'car-side'} size={13}
              color={serviceFilter === f ? '#fff' : C.muted} />}
            <Text style={[s.filterText, serviceFilter === f && s.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Urgency filters */}
      <View style={s.filterRow}>
        {['all', 'HIGH', 'MEDIUM', 'LOW'].map(u => {
          const uc = URG[u];
          const active = urgencyFilter === u;
          return (
            <TouchableOpacity key={u}
              style={[s.filterChip, active && { backgroundColor: uc?.bg || C.purple, borderColor: uc?.text }]}
              onPress={() => { setUrgencyFilter(u); setPage(1); }}>
              {uc && <View style={[s.urgDot, { backgroundColor: uc.text }]} />}
              <Text style={[s.filterText, active && { color: uc?.text || '#fff', fontWeight: '700' }]}>
                {u === 'all' ? 'All Urgency' : u}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!loading && totalCount > 0 && (
        <Text style={s.resultCount}>Showing {bookings.length} of {totalCount} bookings</Text>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.purple} /></View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.purple]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: '#F3E8FF' }]}>
                <MCI name="package-variant" size={36} color={C.purple} />
              </View>
              <Text style={s.emptyTitle}>No bookings available</Text>
              <Text style={s.emptyMsg}>Try adjusting your filters or check back later</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('PostBookingScreen')}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Post a Booking</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={totalPages > 1 ? (
            <View style={s.pagination}>
              <TouchableOpacity style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                disabled={page <= 1} onPress={() => setPage(p => p - 1)}>
                <Icon name="chevron-left" size={16} color={page <= 1 ? C.muted : C.text} />
                <Text style={[s.pageBtnText, page <= 1 && { color: C.muted }]}>Prev</Text>
              </TouchableOpacity>
              <Text style={s.pageInfo}>Page {page} / {totalPages}</Text>
              <TouchableOpacity style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                disabled={page >= totalPages} onPress={() => setPage(p => p + 1)}>
                <Text style={[s.pageBtnText, page >= totalPages && { color: C.muted }]}>Next</Text>
                <Icon name="chevron-right" size={16} color={page >= totalPages ? C.muted : C.text} />
              </TouchableOpacity>
            </View>
          ) : null}
        />
      )}

      {/* Accept Modal */}
      <Modal visible={accModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setAccModal(false)} />
          <ScrollView bounces={false} style={{ maxHeight: '88%' }}>
            <View style={s.modalContent}>
              <View style={s.modalHandle} />
              <View style={s.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s.modalIconWrap, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="check-circle" size={16} color={C.purple} />
                  </View>
                  <Text style={s.modalTitle}>Accept Booking</Text>
                </View>
                <TouchableOpacity onPress={() => setAccModal(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              {/* Booking summary */}
              <View style={s.modalSummary}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalSummaryNum}>{selBooking?.postingNumber}</Text>
                  <Text style={s.modalSummaryTitle}>{selBooking?.vehicleRequired || selBooking?.bookingType}</Text>
                  <Text style={s.modalSummaryRoute}>
                    <MCI name="map-marker" size={12} color={C.purple} /> {selBooking?.fromCity} → {selBooking?.toCity || '-'}
                  </Text>
                </View>
              </View>

              {/* Commission */}
              <View style={s.modalCommRow}>
                <View style={s.modalCommItem}>
                  <Text style={s.modalCommLabel}>Budget</Text>
                  <Text style={s.modalCommVal}>{fmtPrice(selBooking?.customerBudget)}</Text>
                </View>
                <View style={[s.modalCommItem, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[s.modalCommLabel, { color: C.purple }]}>Commission</Text>
                  <Text style={[s.modalCommVal, { color: C.purple }]}>{fmtPrice(selBooking?.commission)}</Text>
                </View>
                <View style={[s.modalCommItem, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[s.modalCommLabel, { color: '#047857' }]}>Your Earning</Text>
                  <Text style={[s.modalCommVal, { color: C.brand, fontSize: 16 }]}>{fmtPrice(selBooking?.partnerEarning)}</Text>
                </View>
              </View>

              {/* Vehicle from fleet */}
              {fleetVehicles.length > 0 && (
                <>
                  <Text style={s.fLabel}>SELECT FROM FLEET</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {fleetVehicles.slice(0, 10).map(v => {
                      const nm = v.vehicle_models?.brands?.name && v.vehicle_models?.name
                        ? `${v.vehicle_models.brands.name} ${v.vehicle_models.name}`
                        : v.name || v.vehicleName || 'Vehicle';
                      return (
                        <TouchableOpacity key={v.id} style={s.pickChip} onPress={() => selectFleetVehicle(v)}>
                          <MCI name="truck" size={12} color={C.purple} />
                          <Text style={s.pickText} numberOfLines={1}>{nm}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <Text style={s.fLabel}>VEHICLE NAME *</Text>
              <TextInput style={s.input} value={vehicleName} onChangeText={setVehicleName}
                placeholder="e.g. Tata Ace, Innova Crysta" placeholderTextColor={C.muted} />
              <Text style={s.fLabel}>VEHICLE NUMBER</Text>
              <TextInput style={s.input} value={vehicleNumber} onChangeText={setVehicleNumber}
                placeholder="e.g. MH04AB1234" placeholderTextColor={C.muted} autoCapitalize="characters" />

              {/* Driver from staff */}
              {staffDrivers.length > 0 && (
                <>
                  <Text style={s.fLabel}>SELECT DRIVER</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {staffDrivers.map(d => (
                      <TouchableOpacity key={d.id} style={s.pickChip} onPress={() => selectDriver(d)}>
                        <MCI name="account" size={12} color={C.blue} />
                        <Text style={s.pickText}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={s.fLabel}>DRIVER NAME *</Text>
              <TextInput style={s.input} value={driverName} onChangeText={setDriverName}
                placeholder="Driver name" placeholderTextColor={C.muted} />
              <Text style={s.fLabel}>DRIVER PHONE *</Text>
              <TextInput style={s.input} value={driverPhone} onChangeText={setDriverPhone}
                placeholder="10-digit phone" placeholderTextColor={C.muted} keyboardType="phone-pad" />
              <Text style={s.fLabel}>NOTES (Optional)</Text>
              <TextInput style={[s.input, { height: 60, textAlignVertical: 'top' }]}
                value={accNotes} onChangeText={setAccNotes}
                placeholder="Any additional info..." placeholderTextColor={C.muted} multiline />

              <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleAccept} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
                  <><Icon name="check" size={16} color="#fff" /><Text style={s.submitBtnText}>Accept Booking</Text></>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: C.purple },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Search
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },

  // Filters
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterActive: { backgroundColor: C.purple },
  filterText: { fontSize: 12, fontWeight: '600', color: C.sub },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  urgDot: { width: 6, height: 6, borderRadius: 3 },

  resultCount: { fontSize: 12, color: C.sub, paddingHorizontal: 16, paddingVertical: 4 },

  list: { padding: 16, paddingBottom: 80 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12 },
  postingNum: { fontSize: 11, color: C.muted, fontFamily: 'monospace' },
  urgBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  urgText: { fontSize: 10, fontWeight: '800' },

  // Vendor
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 8 },
  vendorAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center' },
  vendorInitial: { fontSize: 14, fontWeight: '700', color: '#fff' },
  vendorName: { fontSize: 14, fontWeight: '600', color: C.text },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 },
  vendorCity: { fontSize: 11, color: C.muted },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: C.amber },
  ratingCount: { fontSize: 10, color: C.muted },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, marginTop: 10 },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600', color: C.sub },

  // Route
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  routeCity: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },

  // Info
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, marginTop: 8 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 12, color: C.sub },

  // Details
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, marginTop: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailText: { fontSize: 11, color: C.sub, fontWeight: '500' },

  // Reason
  reasonBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginTop: 8, backgroundColor: '#FFF7ED', borderRadius: 8, padding: 8 },
  reasonText: { fontSize: 12, color: '#C2410C', flex: 1 },

  // Commission
  commRow: { flexDirection: 'row', marginHorizontal: 14, marginTop: 10, backgroundColor: '#F8FAFC', borderRadius: 12, overflow: 'hidden' },
  commItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  commLabel: { fontSize: 8, color: C.muted, fontWeight: '700', letterSpacing: 0.5 },
  commVal: { fontSize: 13, fontWeight: '800', color: C.text, marginTop: 2 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 12 },
  accBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.purple, paddingVertical: 11, borderRadius: 12 },
  accBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  // Social bar
  socialBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // Share menu
  shareMenu: { marginHorizontal: 14, marginBottom: 10, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  shareOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  shareOptionText: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Comments
  commentsSection: { backgroundColor: '#FAFBFC', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 10 },
  noComments: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 12 },
  commentItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  commentInitial: { fontSize: 10, fontWeight: '700', color: C.purple },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentName: { fontSize: 12, fontWeight: '600', color: C.text },
  commentTime: { fontSize: 10, color: C.muted },
  commentMsg: { fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  commentInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: C.text },
  commentSendBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center' },

  // Pagination
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  pageInfo: { fontSize: 13, fontWeight: '600', color: C.sub },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10, paddingHorizontal: 30 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3E8FF', borderRadius: 12, padding: 12, marginBottom: 8 },
  modalSummaryNum: { fontSize: 10, color: C.muted, fontFamily: 'monospace' },
  modalSummaryTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 2 },
  modalSummaryRoute: { fontSize: 12, color: C.sub, marginTop: 4 },
  modalCommRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  modalCommItem: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, alignItems: 'center' },
  modalCommLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },
  modalCommVal: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 2 },
  fLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text },
  pickChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3E8FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E9D5FF' },
  pickText: { fontSize: 12, color: C.text, fontWeight: '500', maxWidth: 120 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.purple, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
