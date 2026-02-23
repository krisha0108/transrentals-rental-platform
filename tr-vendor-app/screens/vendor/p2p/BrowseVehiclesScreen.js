import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Linking, Share, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PVehicles, requestP2PVehicle, getP2PComments, addP2PComment } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', text: '#1A1A2E', sub: '#64748B',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
  indigo: '#6366F1',
};

const SVC = {
  truck: { bg: '#F3E8FF', text: '#7C3AED', icon: 'truck' },
  car: { bg: '#DBEAFE', text: '#2563EB', icon: 'car-side' },
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

export default function BrowseVehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  // Request modal
  const [reqModal, setReqModal] = useState(false);
  const [selVehicle, setSelVehicle] = useState(null);
  const [loadType, setLoadType] = useState('Full Load');
  const [goodsType, setGoodsType] = useState('');
  const [weight, setWeight] = useState('');
  const [passengers, setPassengers] = useState('');
  const [pickupAddr, setPickupAddr] = useState('');
  const [dropAddr, setDropAddr] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const fetchVehicles = useCallback(async () => {
    try {
      const params = { page, limit: 20 };
      if (serviceFilter !== 'all') params.serviceType = serviceFilter;
      if (search.trim()) params.search = search.trim();
      if (fromCity.trim()) params.fromCity = fromCity.trim();
      if (toCity.trim()) params.toCity = toCity.trim();
      const res = await getP2PVehicles(params);
      const vList = res?.vehicles || res?.postings || [];
      setVehicles(vList);
      setTotalPages(res?.pagination?.totalPages || res?.totalPages || 1);
      setTotalCount(res?.pagination?.total || vList.length);

      // Fetch comment counts in bulk
      if (vList.length > 0) {
        const ids = vList.map(v => v.id).join(',');
        getP2PComments({ postingType: 'VEHICLE', postingIds: ids, mode: 'counts' })
          .then(r => setCommentCounts(prev => ({ ...prev, ...(r?.counts || {}) })))
          .catch(() => {});
      }
    } catch (e) { showAlert('error', 'Error', 'Failed to load vehicles'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, serviceFilter, search, fromCity, toCity]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  const onRefresh = () => { setRefreshing(true); setPage(1); fetchVehicles(); };
  const doSearch = () => { setPage(1); fetchVehicles(); };

  // Comments
  const toggleComments = async (id) => {
    const isExpanded = expandedComments[id];
    setExpandedComments(p => ({ ...p, [id]: !isExpanded }));
    if (!isExpanded && !commentsData[id]) {
      setLoadingComments(p => ({ ...p, [id]: true }));
      try {
        const res = await getP2PComments({ postingType: 'VEHICLE', postingId: id });
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
      const res = await addP2PComment({ postingType: 'VEHICLE', postingId: id, message: msg });
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
    const msg = `🚛 *Vehicle Available - P2P*\n\n` +
      `*${item.vehicleName}* (${item.serviceType?.toUpperCase()})\n` +
      `📍 ${item.fromCity} → ${item.toCity}\n` +
      `📅 ${fmtDate(item.departureDate)}\n` +
      `💰 ${fmtPrice(item.priceFullLoad)} (Full Load)\n` +
      `👤 Posted by: ${item.vendor?.businessName || 'Vendor'}\n\n` +
      `Check it out on TranStable P2P Marketplace!`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    setShareOpen(null);
  };

  const shareGeneric = async (item) => {
    try {
      await Share.share({
        message: `Vehicle Available: ${item.vehicleName}\n${item.fromCity} → ${item.toCity}\n${fmtDate(item.departureDate)}\nPrice: ${fmtPrice(item.priceFullLoad)}`,
      });
    } catch (e) {}
    setShareOpen(null);
  };

  // Request
  const openRequest = (v) => {
    setSelVehicle(v);
    setLoadType('Full Load');
    setGoodsType(''); setWeight(''); setPassengers('');
    setPickupAddr(''); setDropAddr(''); setNotes('');
    setReqModal(true);
  };

  const handleRequest = async () => {
    if (!pickupAddr.trim()) return showAlert('warning', 'Required', 'Enter pickup address');
    if (!dropAddr.trim()) return showAlert('warning', 'Required', 'Enter drop address');
    setSubmitting(true);
    try {
      const data = { pickupAddress: pickupAddr.trim(), dropAddress: dropAddr.trim(), notes: notes.trim() || undefined };
      if (selVehicle?.serviceType === 'truck') {
        data.loadType = loadType;
        if (goodsType.trim()) data.goodsType = goodsType.trim();
        if (weight.trim()) data.weight = weight.trim();
      } else {
        if (passengers.trim()) data.passengers = parseInt(passengers);
      }
      await requestP2PVehicle(selVehicle.id, data);
      setReqModal(false);
      showAlert('success', 'Request Sent!', 'The vehicle owner will be notified');
      setTimeout(() => navigation.navigate('MyPostingsScreen', { initialTab: 'requests' }), 1200);
    } catch (e) { showAlert('error', 'Failed', 'Could not send request'); }
    finally { setSubmitting(false); }
  };

  const renderVehicle = ({ item }) => {
    const sc = SVC[item.serviceType] || SVC.car;
    const cCount = commentCounts[item.id] || 0;
    const isExpanded = expandedComments[item.id];
    const comments = commentsData[item.id] || [];
    const isTruck = item.serviceType === 'truck';

    return (
      <View style={s.card}>
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
          <View style={[s.typeBadge, { backgroundColor: sc.bg }]}>
            <MCI name={sc.icon} size={12} color={sc.text} />
            <Text style={[s.typeText, { color: sc.text }]}>{item.serviceType?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Vehicle Title */}
        <View style={s.vehRow}>
          <View style={[s.vehIcon, { backgroundColor: '#DBEAFE' }]}>
            <MCI name={isTruck ? 'truck' : 'car-side'} size={18} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.vehName} numberOfLines={1}>{item.vehicleName || '-'}</Text>
            {!!item.vehicleNumber && <Text style={s.vehNumber}>{item.vehicleNumber}</Text>}
          </View>
        </View>

        {/* Route */}
        <View style={s.routeRow}>
          <MCI name="map-marker" size={14} color={C.blue} />
          <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
          <Icon name="arrow-right" size={12} color={C.muted} />
          <Text style={s.routeCity} numberOfLines={1}>{item.toCity || '-'}</Text>
        </View>

        {/* Date & Time */}
        <View style={s.infoRow}>
          <View style={s.infoChip}>
            <Icon name="calendar" size={11} color={C.muted} />
            <Text style={s.infoText}>{fmtDate(item.departureDate)}</Text>
          </View>
          {!!item.departureTime && (
            <View style={s.infoChip}>
              <Icon name="clock" size={11} color={C.muted} />
              <Text style={s.infoText}>{item.departureTime}</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={s.priceRow}>
          <View style={s.priceBox}>
            <Text style={s.priceVal}>{fmtPrice(item.priceFullLoad)}</Text>
            <Text style={s.priceLabel}>{isTruck ? 'full load' : 'trip price'}</Text>
          </View>
          {item.pricePartLoad > 0 && (
            <View style={s.priceBox}>
              <Text style={[s.priceVal, { color: C.sub, fontSize: 14 }]}>{fmtPrice(item.pricePartLoad)}</Text>
              <Text style={s.priceLabel}>part load</Text>
            </View>
          )}
        </View>

        {/* Feature badges */}
        <View style={s.badgesRow}>
          {!!item.capacity && (
            <View style={s.badge}><Text style={s.badgeText}>{item.capacity} {isTruck ? 'ton' : 'seater'}</Text></View>
          )}
          {!!item.bodyType && <View style={s.badge}><Text style={s.badgeText}>{item.bodyType}</Text></View>}
          {item.driverIncluded && (
            <View style={[s.badge, { backgroundColor: '#D1FAE5' }]}>
              <MCI name="account" size={10} color="#047857" />
              <Text style={[s.badgeText, { color: '#047857' }]}>Driver</Text>
            </View>
          )}
          {item.acceptsPartLoad && (
            <View style={[s.badge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[s.badgeText, { color: '#7C3AED' }]}>Part Load OK</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.reqBtn} onPress={() => openRequest(item)}>
            <Icon name="send" size={14} color="#fff" />
            <Text style={s.reqBtnText}>Request Vehicle</Text>
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
              <ActivityIndicator size="small" color={C.blue} style={{ padding: 12 }} />
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
            {/* Comment input */}
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
          <Text style={s.headerTitle}>Available Vehicles</Text>
          <Text style={s.headerSub}>Find empty vehicles from other vendors</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('PostVehicleScreen')} style={s.addBtn}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search vehicle name, city..." placeholderTextColor={C.muted}
            onSubmitEditing={doSearch} returnKeyType="search" />
        </View>
      </View>

      {/* Filter pills */}
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

      {/* City filters */}
      <View style={s.cityRow}>
        <View style={s.cityBox}>
          <MCI name="map-marker" size={14} color={C.blue} />
          <TextInput style={s.cityInput} value={fromCity} onChangeText={setFromCity}
            placeholder="From City" placeholderTextColor={C.muted} onSubmitEditing={doSearch} />
        </View>
        <Icon name="arrow-right" size={14} color={C.muted} />
        <View style={s.cityBox}>
          <MCI name="map-marker" size={14} color={C.red} />
          <TextInput style={s.cityInput} value={toCity} onChangeText={setToCity}
            placeholder="To City" placeholderTextColor={C.muted} onSubmitEditing={doSearch} />
        </View>
      </View>

      {/* Results count */}
      {!loading && totalCount > 0 && (
        <Text style={s.resultCount}>Showing {vehicles.length} of {totalCount} vehicles</Text>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.blue} /></View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: '#DBEAFE' }]}>
                <MCI name="truck" size={36} color={C.blue} />
              </View>
              <Text style={s.emptyTitle}>No vehicles available</Text>
              <Text style={s.emptyMsg}>Try adjusting your filters or check back later</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('PostVehicleScreen')}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Post Your Vehicle</Text>
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

      {/* Request Modal */}
      <Modal visible={reqModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setReqModal(false)} />
          <ScrollView bounces={false} style={{ maxHeight: '88%' }}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[s.modalIconWrap, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="send" size={16} color={C.blue} />
                </View>
                <Text style={s.modalTitle}>Request Vehicle</Text>
              </View>
              <TouchableOpacity onPress={() => setReqModal(false)} style={s.modalCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Vehicle summary */}
            <View style={s.modalSummary}>
              <MCI name={selVehicle?.serviceType === 'truck' ? 'truck' : 'car-side'} size={18} color={C.blue} />
              <View style={{ flex: 1 }}>
                <Text style={s.modalSummaryTitle}>{selVehicle?.vehicleName}</Text>
                <Text style={s.modalSummaryRoute}>{selVehicle?.fromCity} → {selVehicle?.toCity}</Text>
              </View>
            </View>

            {/* Date, Time, Price info boxes */}
            <View style={s.modalInfoGrid}>
              <View style={s.modalInfoBox}>
                <Icon name="calendar" size={13} color={C.muted} />
                <Text style={s.modalInfoLabel}>Date</Text>
                <Text style={s.modalInfoVal}>{fmtDate(selVehicle?.departureDate)}</Text>
              </View>
              {!!selVehicle?.departureTime && (
                <View style={s.modalInfoBox}>
                  <Icon name="clock" size={13} color={C.muted} />
                  <Text style={s.modalInfoLabel}>Time</Text>
                  <Text style={s.modalInfoVal}>{selVehicle.departureTime}</Text>
                </View>
              )}
              <View style={s.modalInfoBox}>
                <MCI name="cash" size={14} color={C.brand} />
                <Text style={s.modalInfoLabel}>{selVehicle?.serviceType === 'truck' ? 'Full Load' : 'Trip Price'}</Text>
                <Text style={[s.modalInfoVal, { color: C.brand }]}>{fmtPrice(selVehicle?.priceFullLoad)}</Text>
              </View>
              {selVehicle?.pricePartLoad > 0 && (
                <View style={s.modalInfoBox}>
                  <MCI name="cash" size={14} color={C.sub} />
                  <Text style={s.modalInfoLabel}>Part Load</Text>
                  <Text style={s.modalInfoVal}>{fmtPrice(selVehicle.pricePartLoad)}</Text>
                </View>
              )}
            </View>

            {selVehicle?.serviceType === 'truck' ? (
              <>
                <Text style={s.fLabel}>LOAD TYPE</Text>
                <View style={s.toggleRow}>
                  {['Full Load', 'Part Load'].map(l => (
                    <TouchableOpacity key={l}
                      style={[s.toggleBtn, loadType === l && s.toggleBtnActive]}
                      onPress={() => setLoadType(l)}>
                      <Text style={[s.toggleText, loadType === l && s.toggleTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={s.fLabel}>TYPE OF GOODS</Text>
                <TextInput style={s.input} value={goodsType} onChangeText={setGoodsType}
                  placeholder="e.g. Electronics, Furniture" placeholderTextColor={C.muted} />
                <Text style={s.fLabel}>ESTIMATED WEIGHT (KG)</Text>
                <TextInput style={s.input} value={weight} onChangeText={setWeight}
                  placeholder="e.g. 500" placeholderTextColor={C.muted} keyboardType="numeric" />
              </>
            ) : (
              <>
                <Text style={s.fLabel}>NUMBER OF PASSENGERS</Text>
                <TextInput style={s.input} value={passengers} onChangeText={setPassengers}
                  placeholder="e.g. 4" placeholderTextColor={C.muted} keyboardType="numeric" />
              </>
            )}

            <Text style={s.fLabel}>PICKUP ADDRESS *</Text>
            <TextInput style={s.input} value={pickupAddr} onChangeText={setPickupAddr}
              placeholder="Full pickup address" placeholderTextColor={C.muted} />
            <Text style={s.fLabel}>DROP ADDRESS *</Text>
            <TextInput style={s.input} value={dropAddr} onChangeText={setDropAddr}
              placeholder="Full drop address" placeholderTextColor={C.muted} />
            <Text style={s.fLabel}>ADDITIONAL NOTES</Text>
            <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="Any additional info..." placeholderTextColor={C.muted} multiline />

            <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleRequest} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Icon name="send" size={16} color="#fff" /><Text style={s.submitBtnText}>Send Request</Text></>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: C.blue },
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterActive: { backgroundColor: C.blue },
  filterText: { fontSize: 12, fontWeight: '600', color: C.sub },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  // City
  cityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  cityBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10 },
  cityInput: { flex: 1, fontSize: 13, color: C.text, paddingVertical: 8 },

  resultCount: { fontSize: 12, color: C.sub, paddingHorizontal: 16, paddingVertical: 4 },

  list: { padding: 16, paddingBottom: 80 },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Vendor
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  vendorAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  vendorInitial: { fontSize: 14, fontWeight: '700', color: '#fff' },
  vendorName: { fontSize: 14, fontWeight: '600', color: C.text },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 },
  vendorCity: { fontSize: 11, color: C.muted },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: C.amber },
  ratingCount: { fontSize: 10, color: C.muted },

  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700' },

  // Vehicle
  vehRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  vehIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  vehName: { fontSize: 16, fontWeight: '700', color: C.text },
  vehNumber: { fontSize: 12, color: C.muted, marginTop: 1 },

  // Route
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginTop: 8, backgroundColor: '#F8FAFC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  routeCity: { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },

  // Info
  infoRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginTop: 8 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 12, color: C.sub },

  // Price
  priceRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 14, marginTop: 10 },
  priceBox: {},
  priceVal: { fontSize: 18, fontWeight: '800', color: C.brand },
  priceLabel: { fontSize: 10, color: C.muted },

  // Badges
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 11, color: C.sub, fontWeight: '500' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 12 },
  reqBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, paddingVertical: 11, borderRadius: 12 },
  reqBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
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
  commentAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },
  commentInitial: { fontSize: 10, fontWeight: '700', color: C.indigo },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentName: { fontSize: 12, fontWeight: '600', color: C.text },
  commentTime: { fontSize: 10, color: C.muted },
  commentMsg: { fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  commentInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: C.text },
  commentSendBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },

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
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.blue, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 8 },
  modalSummaryTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  modalSummaryRoute: { fontSize: 12, color: C.sub, marginTop: 2 },
  modalInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  modalInfoBox: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, alignItems: 'center', gap: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  modalInfoLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  modalInfoVal: { fontSize: 14, fontWeight: '700', color: C.text },
  fLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border },
  toggleBtnActive: { backgroundColor: '#DBEAFE', borderColor: C.blue },
  toggleText: { fontSize: 13, fontWeight: '600', color: C.sub },
  toggleTextActive: { color: C.blue, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
