import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, Linking, Share, ScrollView, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PVehicles, requestP2PVehicle, getP2PComments, addP2PComment } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText,
  border: T.border, borderMed: '#CBD5E1',
  amber: T.amber,
  red: T.red,
  purple: T.purple, purpleBg: T.tintPlum,
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
    const isTruck = item.serviceType === 'truck';
    const cCount = commentCounts[item.id] || 0;
    const isExpanded = expandedComments[item.id];
    const comments = commentsData[item.id] || [];
    const headerGrad = isTruck ? [C.g800, C.g700] : ['#4C1D95', '#6D28D9'];

    return (
      <View style={s.card}>
        {/* ── Card Header Band ── */}
        <LinearGradient colors={headerGrad} style={s.cardHeaderBand}>
          <View style={s.cardHeaderInner}>
            <View style={s.vehIconCircle}>
              <MCI name={isTruck ? 'truck' : 'car-side'} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardVehName} numberOfLines={1}>{item.vehicleName || '-'}</Text>
              {!!item.vehicleNumber && (
                <Text style={s.cardPlateText}>{item.vehicleNumber}</Text>
              )}
            </View>
            <View style={s.cardSvcBadge}>
              <Text style={s.cardSvcBadgeText}>{item.serviceType?.toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Route Row ── */}
        <View style={s.cardRouteRow}>
          <View style={s.rFromDot} />
          <Text style={s.rCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
          <View style={s.rLine} />
          <MCI name={isTruck ? 'truck' : 'car-side'} size={13} color={C.muted} />
          <View style={s.rLine} />
          <Text style={s.rCity} numberOfLines={1}>{item.toCity || '-'}</Text>
          <View style={s.rToDot} />
        </View>

        {/* ── Card Body ── */}
        <View style={s.cardBody}>

          {/* Vendor Row */}
          <View style={s.vendorRow}>
            <LinearGradient colors={[C.g700, C.g600]} style={s.vendorAvatar}>
              <Text style={s.vendorInitial}>{item.vendor?.businessName?.charAt(0) || '?'}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.vendorName} numberOfLines={1}>{item.vendor?.businessName || 'Vendor'}</Text>
              <View style={s.vendorMeta}>
                <MCI name="map-marker-outline" size={11} color={C.muted} />
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

          {/* Price + Date Row */}
          <View style={s.priceDateRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.priceVal}>{fmtPrice(item.priceFullLoad)}</Text>
              <Text style={s.priceLabel}>{isTruck ? 'full load' : 'trip price'}</Text>
              {item.pricePartLoad > 0 && (
                <Text style={s.partPrice}>{fmtPrice(item.pricePartLoad)} part load</Text>
              )}
            </View>
            <View style={s.dateChipStack}>
              <View style={s.infoChip}>
                <Icon name="calendar" size={11} color={C.g700} />
                <Text style={s.infoText}>{fmtDate(item.departureDate)}</Text>
              </View>
              {!!item.departureTime && (
                <View style={s.infoChip}>
                  <Icon name="clock" size={11} color={C.g700} />
                  <Text style={s.infoText}>{item.departureTime}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Feature Badges */}
          <View style={s.badgesRow}>
            {!!item.capacity && (
              <View style={s.badge}>
                <MCI name={isTruck ? 'weight' : 'account-multiple'} size={10} color={C.sub} />
                <Text style={s.badgeText}>{item.capacity} {isTruck ? 'ton' : 'seater'}</Text>
              </View>
            )}
            {!!item.bodyType && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.bodyType}</Text>
              </View>
            )}
            {item.driverIncluded && (
              <View style={s.badgeGreen}>
                <MCI name="account-check" size={10} color={C.g700} />
                <Text style={s.badgeGreenText}>Driver</Text>
              </View>
            )}
            {item.fuelIncluded && (
              <View style={s.badgeGreen}>
                <MCI name="fuel" size={10} color={C.g700} />
                <Text style={s.badgeGreenText}>Fuel</Text>
              </View>
            )}
            {item.labourIncluded && (
              <View style={s.badgeGreen}>
                <MCI name="account-hard-hat" size={10} color={C.g700} />
                <Text style={s.badgeGreenText}>Labour</Text>
              </View>
            )}
            {item.acceptsPartLoad && (
              <View style={s.badgePurple}>
                <Text style={s.badgePurpleText}>Part Load OK</Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.reqBtn} onPress={() => openRequest(item)} activeOpacity={0.85}>
              <LinearGradient colors={[C.g700, C.g600]} style={s.reqBtnGrad}>
                <Icon name="send" size={14} color="#fff" />
                <Text style={s.reqBtnText}>Request Vehicle</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!!item.vendor?.phone && (
              <TouchableOpacity
                style={s.iconBtn}
                onPress={() => Linking.openURL(`tel:${item.vendor.phone}`)}>
                <Icon name="phone" size={16} color={C.g700} />
              </TouchableOpacity>
            )}
            {!!item.vendor?.phone && (
              <TouchableOpacity
                style={s.iconBtnWa}
                onPress={() => Linking.openURL(`https://wa.me/91${item.vendor.phone.replace(/\D/g, '')}`)}>
                <MCI name="whatsapp" size={18} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>

          {/* Social Bar */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id)}>
              <MCI name="comment-outline" size={16} color={C.sub} />
              <Text style={s.socialText}>{cCount}</Text>
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.socialBtn}
              onPress={() => setShareOpen(shareOpen === item.id ? null : item.id)}>
              <Icon name="share-2" size={14} color={C.sub} />
              <Text style={s.socialText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Share Dropdown */}
          {shareOpen === item.id && (
            <View style={s.shareMenu}>
              <TouchableOpacity style={s.shareOption} onPress={() => shareGeneric(item)}>
                <View style={s.shareIconWrap}>
                  <Icon name="copy" size={14} color={C.sub} />
                </View>
                <Text style={s.shareOptionText}>Copy &amp; Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.shareOption, { borderBottomWidth: 0 }]}
                onPress={() => shareWhatsApp(item)}>
                <View style={[s.shareIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <MCI name="whatsapp" size={16} color="#25D366" />
                </View>
                <Text style={s.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expanded Comments */}
          {isExpanded && (
            <View style={s.commentsSection}>
              <View style={s.commentsDivider} />
              {loadingComments[item.id] ? (
                <ActivityIndicator size="small" color={C.g600} style={{ padding: 12 }} />
              ) : comments.length === 0 ? (
                <Text style={s.noComments}>No comments yet. Be the first!</Text>
              ) : (
                comments.map(c => (
                  <View key={c.id} style={s.commentItem}>
                    <LinearGradient colors={[C.g700, C.g600]} style={s.commentAvatar}>
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
                  value={commentInputs[item.id] || ''}
                  onChangeText={t => setCommentInputs(p => ({ ...p, [item.id]: t }))}
                  placeholder="Write a comment..."
                  placeholderTextColor={C.muted}
                  onSubmitEditing={() => sendComment(item.id)}
                />
                <TouchableOpacity
                  style={[s.commentSendBtn, !(commentInputs[item.id] || '').trim() && { opacity: 0.4 }]}
                  onPress={() => sendComment(item.id)}
                  disabled={!(commentInputs[item.id] || '').trim() || sendingComment[item.id]}>
                  {sendingComment[item.id]
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <LinearGradient colors={[C.g700, C.g600]} style={s.commentSendGrad}>
                        <Icon name="send" size={13} color="#fff" />
                      </LinearGradient>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={G.hero} style={s.header}>
        {/* Decorative circles */}
        <AnimatedOrb style={s.decCircle1} />
        <AnimatedOrb style={s.decCircle2} delay={1200} dx={-10} dy={8} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Available Vehicles</Text>
              <Text style={s.headerSub}>Find empty vehicles from other vendors</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PostVehicleScreen')} style={s.addBtnWrap}>
              <LinearGradient colors={[C.g600, C.g500]} style={s.addBtnGrad}>
                <Icon name="plus" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Search Bar ── */}
      <View style={s.searchSection}>
        <View style={s.searchBox}>
          <Icon name="search" size={16} color={C.g600} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search vehicle name, city..."
            placeholderTextColor={C.muted}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); doSearch(); }}>
              <View style={s.searchClearBtn}>
                <Icon name="x" size={12} color={C.sub} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScrollContent}
        style={s.filterScroll}>
        {['all', 'truck', 'car'].map(f => {
          const isActive = serviceFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => { setServiceFilter(f); setPage(1); }}
              activeOpacity={0.8}
              style={isActive ? null : s.filterChipInactive}>
              {isActive ? (
                <LinearGradient colors={[C.g700, C.g600]} style={s.filterChipActive}>
                  {f !== 'all' && (
                    <MCI
                      name={f === 'truck' ? 'truck' : 'car-side'}
                      size={13}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={s.filterTextActive}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={s.filterChipInactiveInner}>
                  {f !== 'all' && (
                    <MCI
                      name={f === 'truck' ? 'truck' : 'car-side'}
                      size={13}
                      color={C.muted}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={s.filterTextInactive}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── City Filter Row ── */}
      <View style={s.cityRow}>
        <View style={s.cityBox}>
          <MCI name="map-marker" size={14} color={C.g600} style={{ marginRight: 6 }} />
          <TextInput
            style={s.cityInput}
            value={fromCity}
            onChangeText={setFromCity}
            placeholder="From City"
            placeholderTextColor={C.muted}
            onSubmitEditing={doSearch}
          />
        </View>
        <View style={s.cityArrow}>
          <Icon name="arrow-right" size={14} color="#fff" />
        </View>
        <View style={s.cityBox}>
          <MCI name="map-marker" size={14} color={C.red} style={{ marginRight: 6 }} />
          <TextInput
            style={s.cityInput}
            value={toCity}
            onChangeText={setToCity}
            placeholder="To City"
            placeholderTextColor={C.muted}
            onSubmitEditing={doSearch}
          />
        </View>
      </View>

      {/* ── Result Count ── */}
      {!loading && totalCount > 0 && (
        <View style={s.resultCountRow}>
          <View style={s.resultDot} />
          <Text style={s.resultCount}>{vehicles.length} of {totalCount} vehicles</Text>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.g950} />
        <LinearGradient colors={G.hero} style={s.header}>
          <AnimatedOrb style={s.decCircle1} />
          <AnimatedOrb style={s.decCircle2} delay={1200} dx={-10} dy={8} />
          <SafeAreaView edges={['top']}>
            <View style={s.headerInner}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={s.headerCenter}>
                <Text style={s.headerTitle}>Available Vehicles</Text>
                <Text style={s.headerSub}>Find empty vehicles from other vendors</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.center}>
          <View style={s.loadingIconWrap}>
            <ActivityIndicator size="large" color={C.g600} />
          </View>
          <Text style={s.loadingText}>Loading vehicles...</Text>
          <Text style={s.loadingSubText}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 30, gap: 14 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <LinearGradient colors={[C.g800, C.g700]} style={s.emptyIconWrap}>
              <MCI name="truck" size={40} color="#fff" />
            </LinearGradient>
            <Text style={s.emptyTitle}>No vehicles available</Text>
            <Text style={s.emptyMsg}>Try adjusting your filters or check back later</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PostVehicleScreen')} activeOpacity={0.85}>
              <LinearGradient colors={[C.g700, C.g600]} style={s.emptyBtn}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Post Your Vehicle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={totalPages > 1 ? (
          <View style={s.pagination}>
            <TouchableOpacity
              style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
              disabled={page <= 1}
              onPress={() => setPage(p => p - 1)}>
              <Icon name="chevron-left" size={16} color={page <= 1 ? C.muted : C.g700} />
              <Text style={[s.pageBtnText, page <= 1 && { color: C.muted }]}>Prev</Text>
            </TouchableOpacity>
            <LinearGradient colors={[C.g800, C.g700]} style={s.pageInfoPill}>
              <Text style={s.pageInfo}>{page} / {totalPages}</Text>
            </LinearGradient>
            <TouchableOpacity
              style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
              disabled={page >= totalPages}
              onPress={() => setPage(p => p + 1)}>
              <Text style={[s.pageBtnText, page >= totalPages && { color: C.muted }]}>Next</Text>
              <Icon name="chevron-right" size={16} color={page >= totalPages ? C.muted : C.g700} />
            </TouchableOpacity>
          </View>
        ) : null}
      />

      {/* ── Request Modal ── */}
      <Modal visible={reqModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setReqModal(false)} />
          <View style={s.modalSheet}>
            {/* Modal Header */}
            <LinearGradient colors={[T.forestDark, T.forest]} style={s.modalHeaderGrad}>
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalIconWrap}>
                  <Icon name="send" size={16} color="#fff" />
                </View>
                <Text style={s.modalTitle}>Request Vehicle</Text>
                <TouchableOpacity onPress={() => setReqModal(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              bounces={false}
              style={{ maxHeight: '78%' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>

              {/* Vehicle Summary Card */}
              <LinearGradient colors={[C.g50, C.g100]} style={s.modalSummary}>
                <LinearGradient
                  colors={selVehicle?.serviceType === 'truck' ? [C.g800, C.g700] : ['#4C1D95', '#6D28D9']}
                  style={s.modalSummaryIcon}>
                  <MCI
                    name={selVehicle?.serviceType === 'truck' ? 'truck' : 'car-side'}
                    size={18}
                    color="#fff"
                  />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.modalSummaryTitle}>{selVehicle?.vehicleName}</Text>
                  <Text style={s.modalSummaryRoute}>{selVehicle?.fromCity} → {selVehicle?.toCity}</Text>
                </View>
              </LinearGradient>

              {/* Info Grid */}
              <View style={s.modalInfoGrid}>
                <View style={s.modalInfoBox}>
                  <Icon name="calendar" size={14} color={C.g700} />
                  <Text style={s.modalInfoLabel}>Date</Text>
                  <Text style={s.modalInfoVal}>{fmtDate(selVehicle?.departureDate)}</Text>
                </View>
                {!!selVehicle?.departureTime && (
                  <View style={s.modalInfoBox}>
                    <Icon name="clock" size={14} color={C.g700} />
                    <Text style={s.modalInfoLabel}>Time</Text>
                    <Text style={s.modalInfoVal}>{selVehicle.departureTime}</Text>
                  </View>
                )}
                <View style={s.modalInfoBox}>
                  <MCI name="cash" size={15} color={C.g600} />
                  <Text style={s.modalInfoLabel}>
                    {selVehicle?.serviceType === 'truck' ? 'Full Load' : 'Trip Price'}
                  </Text>
                  <Text style={[s.modalInfoVal, { color: C.g700 }]}>
                    {fmtPrice(selVehicle?.priceFullLoad)}
                  </Text>
                </View>
                {selVehicle?.pricePartLoad > 0 && (
                  <View style={s.modalInfoBox}>
                    <MCI name="cash" size={15} color={C.sub} />
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
                      <TouchableOpacity
                        key={l}
                        style={[s.toggleBtn, loadType === l && s.toggleBtnActive]}
                        onPress={() => setLoadType(l)}>
                        <Text style={[s.toggleText, loadType === l && s.toggleTextActive]}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={s.fLabel}>TYPE OF GOODS</Text>
                  <View style={s.inputWrap}>
                    <MCI name="package-variant" size={16} color={C.muted} style={s.inputIcon} />
                    <TextInput
                      style={s.inputField}
                      value={goodsType}
                      onChangeText={setGoodsType}
                      placeholder="e.g. Electronics, Furniture"
                      placeholderTextColor={C.muted}
                    />
                  </View>
                  <Text style={s.fLabel}>ESTIMATED WEIGHT (KG)</Text>
                  <View style={s.inputWrap}>
                    <MCI name="weight" size={16} color={C.muted} style={s.inputIcon} />
                    <TextInput
                      style={s.inputField}
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="e.g. 500"
                      placeholderTextColor={C.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.fLabel}>NUMBER OF PASSENGERS</Text>
                  <View style={s.inputWrap}>
                    <MCI name="account-multiple" size={16} color={C.muted} style={s.inputIcon} />
                    <TextInput
                      style={s.inputField}
                      value={passengers}
                      onChangeText={setPassengers}
                      placeholder="e.g. 4"
                      placeholderTextColor={C.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <Text style={s.fLabel}>PICKUP ADDRESS *</Text>
              <View style={s.inputWrap}>
                <MCI name="map-marker-outline" size={16} color={C.g600} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  value={pickupAddr}
                  onChangeText={setPickupAddr}
                  placeholder="Full pickup address"
                  placeholderTextColor={C.muted}
                />
              </View>

              <Text style={s.fLabel}>DROP ADDRESS *</Text>
              <View style={s.inputWrap}>
                <MCI name="map-marker-check-outline" size={16} color={C.red} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  value={dropAddr}
                  onChangeText={setDropAddr}
                  placeholder="Full drop address"
                  placeholderTextColor={C.muted}
                />
              </View>

              <Text style={s.fLabel}>ADDITIONAL NOTES</Text>
              <View style={[s.inputWrap, { alignItems: 'flex-start' }]}>
                <MCI name="note-text-outline" size={16} color={C.muted} style={[s.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[s.inputField, { height: 72, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional info..."
                  placeholderTextColor={C.muted}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[s.submitBtnWrap, submitting && { opacity: 0.6 }]}
                onPress={handleRequest}
                disabled={submitting}
                activeOpacity={0.85}>
                <LinearGradient colors={[C.g700, C.g600]} style={s.submitBtn}>
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : (
                      <>
                        <Icon name="send" size={16} color="#fff" />
                        <Text style={s.submitBtnText}>Send Request</Text>
                      </>
                    )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },

  // Loading
  loadingIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  loadingText: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  loadingSubText: { fontSize: 13, color: C.muted },

  // ── Header ──
  header: { paddingBottom: 18, overflow: 'hidden', position: 'relative' },
  decCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60, right: -40,
  },
  decCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.045)',
    top: 20, right: 60,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, gap: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  addBtnWrap: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  addBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Search ──
  searchSection: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: rs(16), borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 2,
    ...cardShadow,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },
  searchClearBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Filter Pills ──
  filterScroll: { marginBottom: 4 },
  filterScrollContent: { paddingHorizontal: 14, paddingVertical: 6, gap: 8, flexDirection: 'row' },
  filterChipActive: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 22,
  },
  filterChipInactive: { borderRadius: 22 },
  filterChipInactiveInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  filterTextActive: { fontSize: 12, fontWeight: '700', color: '#fff' },
  filterTextInactive: { fontSize: 12, fontWeight: '600', color: C.muted },

  // ── City Row ──
  cityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 8, marginBottom: 4,
  },
  cityBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10,
    ...cardShadow,
  },
  cityInput: { flex: 1, fontSize: 13, color: C.text, paddingVertical: 9 },
  cityArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.g600,
    justifyContent: 'center', alignItems: 'center',
  },

  // Result count
  resultCountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  resultDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.g600 },
  resultCount: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // ── Vehicle Card ──
  card: {
    marginHorizontal: 14,
    backgroundColor: C.surface,
    borderRadius: rs(18),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },

  // Card Header Band
  cardHeaderBand: { paddingHorizontal: 14, paddingVertical: 12 },
  cardHeaderInner: { flexDirection: 'row', alignItems: 'center' },
  vehIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardVehName: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  cardPlateText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, letterSpacing: 0.5 },
  cardSvcBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardSvcBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Route Row
  cardRouteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rFromDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500 },
  rToDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  rLine: { flex: 1, height: 1, backgroundColor: C.borderMed },
  rCity: { fontSize: 12, fontWeight: '600', color: C.text },

  // Card Body
  cardBody: { padding: 14, paddingTop: 13 },

  // Vendor
  vendorRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 13, paddingBottom: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  vendorAvatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  vendorInitial: { fontSize: 15, fontWeight: '800', color: '#fff' },
  vendorName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  vendorMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vendorCity: { fontSize: 11, color: C.muted },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', color: C.amber },
  ratingCount: { fontSize: 10, color: C.muted },

  // Price + Date
  priceDateRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceVal: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '900', color: C.g700, letterSpacing: -0.8 },
  priceLabel: { fontSize: 11, color: C.muted, fontWeight: '500', marginTop: 1 },
  partPrice: { fontSize: 12, color: C.sub, marginTop: 3 },
  dateChipStack: { gap: 6, alignItems: 'flex-end' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.g50, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: C.g100,
  },
  infoText: { fontSize: 11, color: C.g700, fontWeight: '600' },

  // Badges
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 13 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  badgeText: { fontSize: 11, color: C.sub, fontWeight: '500' },
  badgeGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: C.g100,
  },
  badgeGreenText: { fontSize: 11, color: C.g700, fontWeight: '600' },
  badgePurple: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: C.purpleBg,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  badgePurpleText: { fontSize: 11, color: C.purple, fontWeight: '600' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  reqBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  reqBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 13,
  },
  reqBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  iconBtnWa: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center', alignItems: 'center',
  },

  // Social Bar
  socialBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 11, marginTop: 6,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  socialText: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // Share Menu
  shareMenu: {
    marginTop: 10,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  shareIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  shareOptionText: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Comments
  commentsSection: { marginTop: 8 },
  commentsDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  noComments: { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 14 },
  commentItem: { flexDirection: 'row', gap: 9, marginBottom: 11 },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  commentInitial: { fontSize: 10, fontWeight: '700', color: '#fff' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentName: { fontSize: 12, fontWeight: '600', color: C.text },
  commentTime: { fontSize: 10, color: C.muted },
  commentMsg: { fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentInput: {
    flex: 1,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, color: C.text,
  },
  commentSendBtn: {
    width: 40, height: 40, borderRadius: 10,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  commentSendGrad: { flex: 1, width: 40, justifyContent: 'center', alignItems: 'center' },

  // Pagination
  pagination: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 14,
    paddingVertical: 16, marginHorizontal: 14,
  },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
    ...cardShadow,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: C.g700 },
  pageInfoPill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12 },
  pageInfo: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Empty State
  empty: {
    alignItems: 'center', paddingVertical: 64,
    gap: 12, paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    ...cardShadow,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: rs(14), marginTop: 6,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Request Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: T.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  modalHeaderGrad: { paddingTop: 10, paddingBottom: 18, paddingHorizontal: 20 },
  modalHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { flex: 1, fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: '#fff' },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Modal Vehicle Summary
  modalSummary: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: rs(14), padding: 13, marginBottom: 14,
    borderWidth: 1, borderColor: C.g100,
  },
  modalSummaryIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  modalSummaryTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: C.text },
  modalSummaryRoute: { fontSize: 12, color: C.sub, marginTop: 2 },

  // Modal Info Grid
  modalInfoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 10,
  },
  modalInfoBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: C.g50,
    borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.g100,
  },
  modalInfoLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  modalInfoVal: { fontSize: 14, fontWeight: '700', color: C.text },

  // Form
  fLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    letterSpacing: 0.8, marginBottom: 7, marginTop: 16,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.g50,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12,
  },
  inputIcon: { marginLeft: 12, marginRight: 6 },
  inputField: {
    flex: 1, fontSize: 14, color: C.text,
    paddingHorizontal: 8, paddingVertical: 12,
  },

  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#F1F5F9',
    borderWidth: 1.5, borderColor: C.border,
  },
  toggleBtnActive: { backgroundColor: C.g50, borderColor: C.g600 },
  toggleText: { fontSize: 13, fontWeight: '600', color: C.sub },
  toggleTextActive: { color: C.g700, fontWeight: '700' },

  submitBtnWrap: { borderRadius: rs(14), overflow: 'hidden', marginTop: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 9, paddingVertical: 16,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
