import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput, ScrollView, Linking, Share, StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import { getP2PBookings, acceptP2PBooking, getVendorFleet, getStaffDrivers, getP2PComments, addP2PComment } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, cardShadow, SHEET_RADIUS } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

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
  blue: T.blue, blueBg: T.blueLight,
  purple: T.purple, purpleBg: T.tintPlum,
};

const URG = {
  HIGH: { accent: C.red, bg: '#FEE2E2', text: '#DC2626', label: 'HIGH', dot: '#EF4444' },
  MEDIUM: { accent: C.amber, bg: '#FEF3C7', text: '#D97706', label: 'MEDIUM', dot: '#F59E0B' },
  LOW: { accent: C.g600, bg: C.g50, text: C.g700, label: 'LOW', dot: C.g500 },
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

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
  const [searchOpen, setSearchOpen] = useState(false);

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

  const doSearch = () => { setPage(1); fetchBookings(); };

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
        {/* Left urgency accent bar */}
        <View style={[s.urgAccentBar, { backgroundColor: urg.accent }]} />

        <View style={s.cardInner}>
          {/* ── TOP ROW: urgency badge + YOU EARN ── */}
          <View style={s.cardTopRow}>
            <View style={s.cardTopLeft}>
              <View style={[s.urgBadge, { backgroundColor: urg.bg }]}>
                <View style={[s.urgDot, { backgroundColor: urg.dot }]} />
                <Text style={[s.urgBadgeTxt, { color: urg.text }]}>{urg.label} URGENCY</Text>
              </View>
            </View>
            <View style={s.earnBlock}>
              <Text style={s.earnLabel}>YOU EARN</Text>
              <Text style={s.earnAmt}>{fmtPrice(item.partnerEarning)}</Text>
            </View>
          </View>

          {/* ── ROUTE ROW ── */}
          <View style={s.routeBar}>
            <View style={s.routeEndWrap}>
              <View style={s.routeFromDot} />
              <Text style={s.routeCity} numberOfLines={1}>{item.fromCity || '-'}</Text>
            </View>
            <View style={s.routeMid}>
              <View style={s.routeLine} />
              <MCI name="package-variant-closed" size={15} color={C.g600} />
              <View style={s.routeLine} />
            </View>
            <View style={s.routeEndWrap}>
              <View style={s.routeToDot} />
              <Text style={s.routeCity} numberOfLines={1}>{item.toCity || 'Local'}</Text>
            </View>
          </View>
          {!!item.postingNumber && (
            <Text style={s.postingNum}>{item.postingNumber}</Text>
          )}

          {/* ── POSTER ROW ── */}
          <View style={s.posterRow}>
            <LinearGradient colors={[C.g700, C.g600]} style={s.posterAvatar}>
              <Text style={s.posterInitial}>{item.vendor?.businessName?.charAt(0) || '?'}</Text>
            </LinearGradient>
            <View style={s.posterInfo}>
              <Text style={s.posterName} numberOfLines={1}>{item.vendor?.businessName || 'Vendor'}</Text>
              <View style={s.posterMeta}>
                <MCI name="map-marker-outline" size={11} color={C.muted} />
                <Text style={s.posterCity}>{item.vendor?.city || '-'}</Text>
                {item.vendor?.rating > 0 && (
                  <View style={s.ratingWrap}>
                    <MCI name="star" size={11} color={C.amber} />
                    <Text style={s.ratingTxt}>{Number(item.vendor.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={s.posterTime}>{relTime(item.createdAt)}</Text>
          </View>

          {/* ── TRIP INFO CHIPS ── */}
          <View style={s.tripInfoRow}>
            <View style={s.tripChip}>
              <Icon name="calendar" size={11} color={C.g700} />
              <Text style={s.tripChipTxt}>{fmtDate(item.tripDate)}</Text>
            </View>
            {!!item.tripTime && (
              <View style={s.tripChip}>
                <Icon name="clock" size={11} color={C.g700} />
                <Text style={s.tripChipTxt}>{item.tripTime}</Text>
              </View>
            )}
            <View style={[s.tripChip, { backgroundColor: C.purpleBg, borderColor: '#DDD6FE' }]}>
              <MCI name={item.serviceType === 'truck' ? 'truck' : 'car-side'} size={12} color={C.purple} />
              <Text style={[s.tripChipTxt, { color: C.purple }]}>{item.bookingType || item.serviceType?.toUpperCase()}</Text>
            </View>
            {!!item.vehicleRequired && (
              <View style={[s.tripChip, { backgroundColor: '#F1F5F9', borderColor: C.border }]}>
                <MCI name="truck-outline" size={11} color={C.sub} />
                <Text style={[s.tripChipTxt, { color: C.sub }]}>{item.vehicleRequired}</Text>
              </View>
            )}
            {!!item.goodsType && (
              <View style={[s.tripChip, { backgroundColor: C.amberBg, borderColor: '#FDE68A' }]}>
                <MCI name="package-variant" size={11} color={C.amber} />
                <Text style={[s.tripChipTxt, { color: '#D97706' }]}>{item.goodsType}</Text>
              </View>
            )}
            {!!item.returnDate && (
              <View style={[s.tripChip, { backgroundColor: C.blueBg, borderColor: '#BFDBFE' }]}>
                <MCI name="calendar-arrow-left" size={11} color={C.blue} />
                <Text style={[s.tripChipTxt, { color: C.blue }]}>Ret: {fmtDate(item.returnDate)}</Text>
              </View>
            )}
          </View>

          {/* ── PASSENGER / WEIGHT DETAILS ── */}
          {(item.passengers > 0 || !!item.estimatedWeight) && (
            <View style={s.detailsRow}>
              {item.passengers > 0 && (
                <View style={s.detailChip}>
                  <MCI name="account-group" size={12} color={C.blue} />
                  <Text style={s.detailTxt}>{item.passengers} pax</Text>
                </View>
              )}
              {!!item.estimatedWeight && (
                <View style={s.detailChip}>
                  <MCI name="weight" size={12} color={C.muted} />
                  <Text style={s.detailTxt}>~{item.estimatedWeight} kg</Text>
                </View>
              )}
            </View>
          )}

          {/* ── REASON BOX ── */}
          {!!item.reason && (
            <View style={s.reasonBox}>
              <Icon name="alert-circle" size={12} color={C.amber} />
              <Text style={s.reasonTxt}>{item.reason}</Text>
            </View>
          )}

          {/* ── BUDGET BREAKDOWN CARD ── */}
          <View style={s.budgetCard}>
            <View style={s.budgetRow}>
              <Text style={s.budgetRowLabel}>Customer Budget</Text>
              <Text style={s.budgetRowVal}>{fmtPrice(item.customerBudget)}</Text>
            </View>
            {item.commission > 0 && (
              <View style={s.budgetRow}>
                <Text style={s.budgetRowLabel}>Your Commission</Text>
                <Text style={[s.budgetRowVal, { color: C.muted }]}>
                  {fmtPrice(item.commission)}
                  {item.customerBudget > 0 && (
                    <Text style={s.budgetPct}> ({Math.round((item.commission / item.customerBudget) * 100)}%)</Text>
                  )}
                </Text>
              </View>
            )}
            <View style={s.budgetDivider} />
            <View style={s.budgetRow}>
              <Text style={[s.budgetRowLabel, { color: C.g700, fontWeight: '700' }]}>You Earn (est.)</Text>
              <Text style={s.budgetEarnVal}>{fmtPrice(item.partnerEarning)}</Text>
            </View>
          </View>

          {/* ── SPECIAL REQUIREMENTS ── */}
          {(item.insuranceNeeded || item.labourNeeded) && (
            <View style={s.reqRow}>
              {!!item.insuranceNeeded && (
                <View style={s.reqBadge}>
                  <MCI name="shield-check-outline" size={12} color={C.amber} />
                  <Text style={s.reqBadgeTxt}>Insurance Needed</Text>
                </View>
              )}
              {!!item.labourNeeded && (
                <View style={s.reqBadge}>
                  <MCI name="account-hard-hat-outline" size={12} color={C.amber} />
                  <Text style={s.reqBadgeTxt}>Labour Needed</Text>
                </View>
              )}
            </View>
          )}

          {/* ── ACTION BUTTONS ── */}
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.acceptBtnWrap} onPress={() => openAccept(item)} activeOpacity={0.85}>
              <LinearGradient colors={[C.g700, C.g600]} style={s.acceptBtnGrad}>
                <Icon name="check-circle" size={14} color="#fff" />
                <Text style={s.acceptBtnTxt}>Accept Booking</Text>
              </LinearGradient>
            </TouchableOpacity>
            {!!item.vendor?.phone && (
              <TouchableOpacity style={s.iconActionBtn} onPress={() => Linking.openURL(`tel:${item.vendor.phone}`)}>
                <Icon name="phone" size={16} color={C.g700} />
              </TouchableOpacity>
            )}
            {!!item.vendor?.phone && (
              <TouchableOpacity
                style={[s.iconActionBtn, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}
                onPress={() => Linking.openURL(`https://wa.me/91${item.vendor.phone.replace(/\D/g, '')}`)}>
                <MCI name="whatsapp" size={18} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── SOCIAL BAR ── */}
          <View style={s.socialBar}>
            <TouchableOpacity style={s.socialBtn} onPress={() => toggleComments(item.id)}>
              <MCI name="comment-outline" size={15} color={C.muted} />
              <Text style={s.socialTxt}>{cCount > 0 ? cCount : ''} Comments</Text>
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={13} color={C.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialBtn} onPress={() => setShareOpen(shareOpen === item.id ? null : item.id)}>
              <Icon name="share-2" size={13} color={C.muted} />
              <Text style={s.socialTxt}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* ── SHARE MENU ── */}
          {shareOpen === item.id && (
            <View style={s.shareMenu}>
              <TouchableOpacity style={s.shareOption} onPress={() => shareGeneric(item)}>
                <View style={s.shareIconBox}>
                  <Icon name="copy" size={13} color={C.sub} />
                </View>
                <Text style={s.shareOptionTxt}>Copy & Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.shareOption, { borderBottomWidth: 0 }]} onPress={() => shareWhatsApp(item)}>
                <View style={[s.shareIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MCI name="whatsapp" size={15} color="#25D366" />
                </View>
                <Text style={s.shareOptionTxt}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── EXPANDED COMMENTS ── */}
          {isExpanded && (
            <View style={s.commentsSection}>
              <View style={s.commentsDivider} />
              {loadingComments[item.id] ? (
                <ActivityIndicator size="small" color={C.g600} style={{ paddingVertical: 14 }} />
              ) : comments.length === 0 ? (
                <Text style={s.noCommentsTxt}>No comments yet. Be the first!</Text>
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
                  disabled={!(commentInputs[item.id] || '').trim() || sendingComment[item.id]}
                >
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
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />
      {/* ── HEADER ── */}
      <LinearGradient colors={G.hero} style={s.header}>
        {/* Decorative orbs */}
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Load Requests</Text>
              <Text style={s.headerSub}>Find bookings that need partners</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setSearchOpen(v => !v); if (searchOpen) { setSearch(''); doSearch(); } }}
              style={[s.backBtn, { marginRight: 8 }]}
            >
              <Icon name={searchOpen ? 'x' : 'search'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('PostBookingScreen')} style={s.addBtn}>
              <LinearGradient colors={[C.g600, C.g500]} style={s.addBtnGrad}>
                <Icon name="plus" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── SEARCH BAR ── */}
      {searchOpen && (
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Icon name="search" size={16} color={C.g600} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by city, vehicle type..."
            placeholderTextColor={C.muted}
            onSubmitEditing={doSearch}
            returnKeyType="search"
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); doSearch(); }}>
              <View style={s.searchClearBtn}>
                <Icon name="x" size={12} color={C.muted} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      )}

      {/* ── SERVICE FILTERS ── */}
      <View style={s.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScrollOuter} contentContainerStyle={s.filterScroll}>
          {['all', 'truck', 'car'].map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, serviceFilter === f && s.filterPillActive]}
              onPress={() => { setServiceFilter(f); setPage(1); }}>
              {f !== 'all' && (
                <MCI
                  name={f === 'truck' ? 'truck' : 'car-side'}
                  size={13}
                  color={serviceFilter === f ? '#fff' : C.muted}
                />
              )}
              <Text numberOfLines={1} style={[s.filterPillTxt, serviceFilter === f && s.filterPillTxtActive]}>
                {f === 'all' ? 'All Types' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── URGENCY FILTERS ── */}
      <View style={s.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScrollOuter} contentContainerStyle={s.filterScroll}>
          {['all', 'HIGH', 'MEDIUM', 'LOW'].map(u => {
            const uc = URG[u];
            const active = urgencyFilter === u;
            return (
              <TouchableOpacity
                key={u}
                style={[
                  s.filterPill,
                  active && uc
                    ? { backgroundColor: uc.bg, borderColor: uc.dot, borderWidth: 1.5 }
                    : active && { backgroundColor: C.g50, borderColor: C.g400, borderWidth: 1.5 },
                ]}
                onPress={() => { setUrgencyFilter(u); setPage(1); }}>
                {uc && <View style={[s.urgDotFilter, { backgroundColor: uc.dot }]} />}
                <Text numberOfLines={1} style={[
                  s.filterPillTxt,
                  active && uc ? { color: uc.text, fontWeight: '700' } : active && { color: C.g700, fontWeight: '700' },
                ]}>
                  {u === 'all' ? 'All Urgency' : u.charAt(0) + u.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── RESULT COUNT ── */}
      {!loading && totalCount > 0 && (
        <View style={s.resultRow}>
          <View style={s.resultDot} />
          <Text style={s.resultTxt}>{bookings.length} of {totalCount} load requests</Text>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View style={s.flex}>
        <StatusBar barStyle="light-content" backgroundColor={C.g950} />
        <LinearGradient colors={G.hero} style={s.header}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']}>
            <View style={s.headerInner}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={s.headerCenter}>
                <Text style={s.headerTitle}>Load Requests</Text>
                <Text style={s.headerSub}>Find bookings that need partners</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ paddingBottom: 30, paddingTop: 14, gap: 14, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.card}>
              <View style={[s.urgAccentBar, { backgroundColor: C.g100 }]} />
              <View style={s.cardInner}>
                <View style={s.cardTopRow}>
                  <Bone w={110} h={20} r={8} />
                  <View style={s.earnBlock}>
                    <Bone w={60} h={9} style={{ marginBottom: 4 }} />
                    <Bone w={70} h={16} />
                  </View>
                </View>

                <View style={s.routeBar}>
                  <View style={s.routeEndWrap}>
                    <View style={s.routeFromDot} />
                    <Bone w={60} h={11} />
                  </View>
                  <View style={s.routeMid}>
                    <View style={s.routeLine} />
                    <MCI name="package-variant-closed" size={15} color={C.border} />
                    <View style={s.routeLine} />
                  </View>
                  <View style={s.routeEndWrap}>
                    <View style={s.routeToDot} />
                    <Bone w={60} h={11} />
                  </View>
                </View>

                <View style={s.posterRow}>
                  <Bone w={34} h={34} r={17} />
                  <View style={s.posterInfo}>
                    <Bone w={110} h={12} style={{ marginBottom: 6 }} />
                    <Bone w={80} h={10} />
                  </View>
                </View>

                <View style={s.tripInfoRow}>
                  <Bone w={80} h={22} r={8} />
                  <Bone w={70} h={22} r={8} />
                  <Bone w={90} h={22} r={8} />
                </View>

                <View style={s.budgetCard}>
                  <View style={s.budgetRow}>
                    <Bone w={100} h={11} />
                    <Bone w={70} h={13} />
                  </View>
                  <View style={s.budgetDivider} />
                  <View style={s.budgetRow}>
                    <Bone w={90} h={12} />
                    <Bone w={80} h={16} />
                  </View>
                </View>

                <View style={s.actionsRow}>
                  <Bone w="100%" h={40} r={10} style={{ flex: 1 }} />
                  <Bone w={40} h={40} r={10} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.flex}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <LinearGradient colors={[C.g800, C.g700, C.g600]} style={s.emptyIconCircle}>
              <MCI name="package-variant" size={38} color="#fff" />
            </LinearGradient>
            <Text style={s.emptyTitle}>No Load Requests</Text>
            <Text style={s.emptyMsg}>No bookings match your filters right now.{'\n'}Try adjusting the filters or post your own booking.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PostBookingScreen')} activeOpacity={0.85}>
              <LinearGradient colors={[C.g700, C.g600]} style={s.emptyBtn}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnTxt}>Share a Booking</Text>
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
              <Text style={[s.pageBtnTxt, page <= 1 && { color: C.muted }]}>Prev</Text>
            </TouchableOpacity>
            <LinearGradient colors={[C.g800, C.g700]} style={s.pageInfoPill}>
              <Text style={s.pageInfoTxt}>{page} / {totalPages}</Text>
            </LinearGradient>
            <TouchableOpacity
              style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
              disabled={page >= totalPages}
              onPress={() => setPage(p => p + 1)}>
              <Text style={[s.pageBtnTxt, page >= totalPages && { color: C.muted }]}>Next</Text>
              <Icon name="chevron-right" size={16} color={page >= totalPages ? C.muted : C.g700} />
            </TouchableOpacity>
          </View>
        ) : null}
      />

      {/* ── ACCEPT MODAL ── */}
      <Modal visible={accModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setAccModal(false)} />
          <View style={s.modalSheet}>
            {/* Modal Header */}
            <LinearGradient colors={[T.forestDark, T.forest]} style={s.modalHeader}>
              <View style={s.modalHandle} />
              <View style={s.modalHeaderRow}>
                <View style={s.modalHeaderIcon}>
                  <Icon name="check-circle" size={17} color="#fff" />
                </View>
                <Text style={s.modalHeaderTitle}>Accept Booking</Text>
                <TouchableOpacity onPress={() => setAccModal(false)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              bounces={false}
              style={s.modalScroll}
              contentContainerStyle={s.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Booking Summary Card */}
              <LinearGradient colors={[C.g50, C.g100]} style={s.modalSummaryCard}>
                <View style={s.modalSummaryIconWrap}>
                  <MCI name="package-variant-closed" size={22} color={C.g700} />
                </View>
                <View style={s.modalSummaryInfo}>
                  <Text style={s.modalSummaryNum}>{selBooking?.postingNumber}</Text>
                  <Text style={s.modalSummaryTitle}>{selBooking?.vehicleRequired || selBooking?.bookingType}</Text>
                  <View style={s.modalSummaryRouteRow}>
                    <View style={s.modalRouteFromDot} />
                    <Text style={s.modalSummaryRoute}>{selBooking?.fromCity}</Text>
                    <Icon name="arrow-right" size={12} color={C.muted} />
                    <View style={s.modalRouteToDot} />
                    <Text style={s.modalSummaryRoute}>{selBooking?.toCity || '-'}</Text>
                  </View>
                  <View style={s.modalDateRow}>
                    <Icon name="calendar" size={11} color={C.g700} />
                    <Text style={s.modalDateTxt}>{fmtDate(selBooking?.tripDate)}</Text>
                  </View>
                </View>
                <View style={s.modalEarnTag}>
                  <Text style={s.modalEarnTagLabel}>YOU EARN</Text>
                  <Text style={s.modalEarnTagAmt}>{fmtPrice(selBooking?.partnerEarning)}</Text>
                </View>
              </LinearGradient>

              {/* Commission Tiles */}
              <View style={s.modalTilesRow}>
                <View style={s.modalTile}>
                  <Text style={s.modalTileLabel}>Budget</Text>
                  <Text style={s.modalTileVal}>{fmtPrice(selBooking?.customerBudget)}</Text>
                </View>
                <View style={[s.modalTile, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                  <Text style={[s.modalTileLabel, { color: C.g700 }]}>You Earn</Text>
                  <Text style={[s.modalTileVal, { color: C.g700, fontSize: 15 }]}>{fmtPrice(selBooking?.partnerEarning)}</Text>
                </View>
                <View style={[s.modalTile, { backgroundColor: C.purpleBg, borderColor: '#DDD6FE' }]}>
                  <Text style={[s.modalTileLabel, { color: C.purple }]}>Commission</Text>
                  <Text style={[s.modalTileVal, { color: C.purple }]}>{fmtPrice(selBooking?.commission)}</Text>
                </View>
              </View>

              {/* Fleet Selection */}
              {fleetVehicles.length > 0 && (
                <>
                  <Text style={s.fieldLabel}>SELECT FROM FLEET</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pickRow}>
                    {fleetVehicles.slice(0, 10).map(v => {
                      const nm = v.vehicle_models?.brands?.name && v.vehicle_models?.name
                        ? `${v.vehicle_models.brands.name} ${v.vehicle_models.name}`
                        : v.name || v.vehicleName || 'Vehicle';
                      return (
                        <TouchableOpacity key={v.id} style={s.pickChip} onPress={() => selectFleetVehicle(v)}>
                          <MCI name="truck" size={12} color={C.g700} />
                          <Text style={s.pickChipTxt} numberOfLines={1}>{nm}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Vehicle Fields */}
              <View style={s.fieldCard}>
                <View style={s.fieldCardIconWrap}>
                  <LinearGradient colors={[C.g700, C.g600]} style={s.fieldCardIcon}>
                    <MCI name="truck" size={16} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={s.fieldCardBody}>
                  <Text style={s.fieldLabel}>VEHICLE NAME *</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={vehicleName}
                    onChangeText={setVehicleName}
                    placeholder="e.g. Tata Ace, Innova Crysta"
                    placeholderTextColor={C.muted}
                  />
                  <Text style={[s.fieldLabel, { marginTop: 12 }]}>VEHICLE NUMBER</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="e.g. MH04AB1234"
                    placeholderTextColor={C.muted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Driver Selection */}
              {staffDrivers.length > 0 && (
                <>
                  <Text style={[s.fieldLabel, { marginTop: 18 }]}>SELECT DRIVER</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pickRow}>
                    {staffDrivers.map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={[s.pickChip, { backgroundColor: C.blueBg, borderColor: '#BFDBFE' }]}
                        onPress={() => selectDriver(d)}>
                        <MCI name="account" size={12} color={C.blue} />
                        <Text style={[s.pickChipTxt, { color: C.blue }]}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Driver Fields */}
              <View style={s.fieldCard}>
                <View style={s.fieldCardIconWrap}>
                  <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.fieldCardIcon}>
                    <MCI name="account" size={16} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={s.fieldCardBody}>
                  <Text style={s.fieldLabel}>DRIVER NAME *</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={driverName}
                    onChangeText={setDriverName}
                    placeholder="Driver name"
                    placeholderTextColor={C.muted}
                  />
                  <Text style={[s.fieldLabel, { marginTop: 12 }]}>DRIVER PHONE *</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={driverPhone}
                    onChangeText={setDriverPhone}
                    placeholder="10-digit phone"
                    placeholderTextColor={C.muted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Notes */}
              <Text style={[s.fieldLabel, { marginTop: 18 }]}>NOTES (Optional)</Text>
              <TextInput
                style={[s.fieldInput, { height: 64, textAlignVertical: 'top', borderRadius: 14 }]}
                value={accNotes}
                onChangeText={setAccNotes}
                placeholder="Any additional information..."
                placeholderTextColor={C.muted}
                multiline
              />

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitWrap, submitting && { opacity: 0.6 }]}
                onPress={handleAccept}
                disabled={submitting}
                activeOpacity={0.85}>
                <LinearGradient colors={[C.g700, C.g600]} style={s.submitBtn}>
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Icon name="check" size={17} color="#fff" />
                        <Text style={s.submitBtnTxt}>Accept Booking</Text>
                      </>}
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
  flex: { flex: 1, backgroundColor: C.bg },

  // ── HEADER ──
  header: { paddingBottom: 20, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  addBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── SEARCH ──
  searchWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },
  searchClearBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },

  // ── FILTERS ──
  filterSection: { paddingBottom: 2 },
  filterScrollOuter: { flexGrow: 0, flexShrink: 0, height: 50 },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 5, gap: 8, alignItems: 'center' },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  filterPillActive: { backgroundColor: C.g700, borderColor: C.g700 },
  filterPillTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterPillTxtActive: { color: '#fff', fontWeight: '700' },
  urgDotFilter: { width: 7, height: 7, borderRadius: 3.5 },

  // ── RESULT COUNT ──
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  resultDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.g500 },
  resultTxt: { fontSize: 13, color: C.muted, fontWeight: '600' },

  // ── LIST ──
  listContent: { paddingBottom: 36, gap: 12 },

  // ── CARD ──
  card: {
    marginHorizontal: 14,
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: rs(18),
    ...cardShadow,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  urgAccentBar: { width: 5, borderRadius: 0 },
  cardInner: { flex: 1, padding: 14 },

  // Card top row
  cardTopRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  cardTopLeft: { gap: 6 },
  urgBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  urgDot: { width: 6, height: 6, borderRadius: 3 },
  urgBadgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  earnBlock: { alignItems: 'flex-end' },
  earnLabel: {
    fontSize: 10, color: C.muted, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3,
  },
  earnAmt: {
    fontFamily: DISPLAY, fontSize: 24, fontWeight: '900', color: C.g600,
    letterSpacing: -0.5, lineHeight: 28,
  },

  // Route bar
  routeBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: C.border,
  },
  routeEndWrap: { flex: 1, alignItems: 'center', gap: 5 },
  routeFromDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.g500 },
  routeToDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  routeMid: { flex: 0.6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeLine: { flex: 1, height: 1.5, backgroundColor: C.border },
  routeCity: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },
  postingNum: {
    fontSize: 11, color: C.muted, fontWeight: '600',
    fontFamily: 'monospace', textAlign: 'center', marginBottom: 10,
  },

  // Poster row
  posterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 12, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  posterAvatar: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  posterInitial: { fontSize: 14, fontWeight: '800', color: '#fff' },
  posterInfo: { flex: 1 },
  posterName: { fontSize: 14, fontWeight: '700', color: C.text },
  posterMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  posterCity: { fontSize: 12, color: C.muted },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 12, fontWeight: '700', color: C.amber },
  posterTime: { fontSize: 11, color: C.muted, fontWeight: '500' },

  // Trip info chips
  tripInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tripChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.g50, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: C.g100,
  },
  tripChipTxt: { fontSize: 12, fontWeight: '600', color: C.g700 },

  // Details row
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  detailChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', paddingHorizontal: 9,
    paddingVertical: 5, borderRadius: 8,
  },
  detailTxt: { fontSize: 12, color: C.sub, fontWeight: '500' },

  // Reason box
  reasonBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 9,
    marginBottom: 10, borderWidth: 1, borderColor: '#FDE68A',
  },
  reasonTxt: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 17 },

  // Budget breakdown card
  budgetCard: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  budgetRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  budgetRowLabel: { fontSize: 13, color: C.muted, fontWeight: '500' },
  budgetRowVal: { fontSize: 14, color: C.sub, fontWeight: '700' },
  budgetPct: { fontSize: 11, color: C.muted, fontWeight: '400' },
  budgetDivider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  budgetEarnVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '900', color: C.g600 },

  // Special requirements
  reqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reqBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.amberBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  reqBadgeTxt: { fontSize: 12, fontWeight: '600', color: '#D97706' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  acceptBtnWrap: { flex: 1, borderRadius: 13, overflow: 'hidden' },
  acceptBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, paddingVertical: 13,
  },
  acceptBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  iconActionBtn: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: C.g50, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },

  // Social bar
  socialBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, marginTop: 6,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialTxt: { fontSize: 13, color: C.muted, fontWeight: '500' },

  // Share menu
  shareMenu: {
    marginTop: 10, backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  shareIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  shareOptionTxt: { fontSize: 14, color: C.text, fontWeight: '500' },

  // Comments
  commentsSection: { marginTop: 8 },
  commentsDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  noCommentsTxt: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 12 },
  commentItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentAvatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  commentInitial: { fontSize: 11, fontWeight: '700', color: '#fff' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentName: { fontSize: 13, fontWeight: '600', color: C.text },
  commentTime: { fontSize: 11, color: C.muted },
  commentMsg: { fontSize: 13, color: C.sub, marginTop: 2, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentInput: {
    flex: 1, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 8, fontSize: 14, color: C.text,
  },
  commentSendBtn: {
    width: 38, height: 38, borderRadius: 10,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  commentSendGrad: {
    flex: 1, width: 38, justifyContent: 'center', alignItems: 'center',
  },

  // Pagination
  pagination: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12,
    paddingVertical: 16, marginHorizontal: 14,
  },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.surface,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnTxt: { fontSize: 14, fontWeight: '600', color: C.g700 },
  pageInfoPill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12 },
  pageInfoTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Empty state
  emptyWrap: {
    alignItems: 'center', paddingVertical: 60,
    paddingHorizontal: 32, gap: 14,
  },
  emptyIconCircle: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  emptyMsg: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: rs(14), marginTop: 4,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── MODAL ──
  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 10, paddingBottom: 18, paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalHeaderIcon: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalHeaderTitle: { fontFamily: DISPLAY, flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalScroll: { maxHeight: '80%' },
  modalScrollContent: { padding: 20, paddingBottom: 36 },

  // Modal summary card
  modalSummaryCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: rs(16), padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: C.g100, gap: 12,
  },
  modalSummaryIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(4,120,87,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalSummaryInfo: { flex: 1 },
  modalSummaryNum: {
    fontSize: 11, color: C.muted, fontFamily: 'monospace',
    fontWeight: '600', marginBottom: 3,
  },
  modalSummaryTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: C.text },
  modalSummaryRouteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5,
  },
  modalRouteFromDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500,
  },
  modalRouteToDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.red,
  },
  modalSummaryRoute: { fontSize: 13, color: C.sub },
  modalDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  modalDateTxt: { fontSize: 12, color: C.g700, fontWeight: '600' },
  modalEarnTag: { alignItems: 'flex-end' },
  modalEarnTagLabel: {
    fontSize: 10, color: C.muted, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3,
  },
  modalEarnTagAmt: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '900', color: C.g600, letterSpacing: -0.5 },

  // Commission tiles
  modalTilesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalTile: {
    flex: 1, backgroundColor: '#F8FAFC',
    borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  modalTileLabel: { fontSize: 10, color: C.muted, fontWeight: '600', marginBottom: 4 },
  modalTileVal: { fontSize: 14, fontWeight: '800', color: C.text },

  // Field sections
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },
  fieldCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#F8FAFC', borderRadius: rs(14),
    padding: 14, borderWidth: 1, borderColor: C.border,
    marginBottom: 6,
  },
  fieldCardIconWrap: { paddingTop: 2 },
  fieldCardIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  fieldCardBody: { flex: 1 },
  fieldInput: {
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 11, paddingHorizontal: 13,
    paddingVertical: 10, fontSize: 14, color: C.text,
  },

  // Pick chips
  pickRow: { gap: 8, paddingBottom: 4 },
  pickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.g50, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: C.g100,
  },
  pickChipTxt: {
    fontSize: 13, color: C.g700, fontWeight: '600', maxWidth: 120,
  },

  // Submit
  submitWrap: { borderRadius: rs(14), overflow: 'hidden', marginTop: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 16,
  },
  submitBtnTxt: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
