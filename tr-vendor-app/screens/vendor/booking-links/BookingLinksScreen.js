import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Linking, Share, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { getBookingLinks, updateBookingLink } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { useVerificationGate, VerificationBanner } from '../../../components/VerificationGate';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);
import CornerGrid from '../_shared/CornerGrid';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, subtext: T.text, muted: T.subText, border: T.border,
  blue: T.blue, indigo: T.indigo, purple: T.purple,
  amber: T.amber, orange: T.orange, red: T.red, teal: T.ocean,
};

const SVC_META = {
  'car-with-driver': { icon: 'car',            iconLib: 'mci', color: C.blue,    bg: '#DBEAFE', label: 'Car with Driver'   },
  'self-drive':      { icon: 'car-side',        iconLib: 'mci', color: C.purple,  bg: '#F3E8FF', label: 'Self-Drive Car'    },
  bike:              { icon: 'motorbike',        iconLib: 'mci', color: C.amber,   bg: '#FEF3C7', label: 'Bike Rental'       },
  bus:               { icon: 'bus',              iconLib: 'mci', color: C.teal,    bg: C.g100,    label: 'Bus & Tempo'       },
  luxury:            { icon: 'car-sports',       iconLib: 'mci', color: '#EAB308', bg: '#FEF9C3', label: 'Luxury Car'        },
  transporter:       { icon: 'truck',            iconLib: 'mci', color: C.orange,  bg: '#FFF7ED', label: 'Transporter'       },
  'packers-movers':  { icon: 'package-variant',  iconLib: 'mci', color: C.indigo,  bg: '#E0E7FF', label: 'Packers & Movers'  },
  equipment:         { icon: 'wrench',           iconLib: 'mci', color: C.red,     bg: '#FEE2E2', label: 'Equipment Rental'  },
  all:               { icon: 'globe',            iconLib: 'f',   color: C.g600,    bg: C.g100,    label: 'All Services'      },
};
const DEFAULT_META = { icon: 'link', iconLib: 'f', color: C.muted, bg: '#F3F4F6', label: 'Booking Link' };

export default function BookingLinksScreen({ navigation }) {
  const [links, setLinks] = useState([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  // Verification gate — pending vendors can browse and share existing links,
  // but toggling active state or customising is locked.
  const { status: vendorStatus, gate, LockGateModal } = useVerificationGate(navigation);

  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: null });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: null });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const fetchLinks = useCallback(async () => {
    try {
      const res = await getBookingLinks();
      setLinks(res?.links || []);
      setSlug(res?.slug || '');
    } catch (err) {
      console.error('[BookingLinks] Error:', err);
      showAlert('error', 'Load Failed', 'Failed to load booking links');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchLinks(); }, [fetchLinks]));
  const onRefresh = () => { setRefreshing(true); fetchLinks(); };

  const toggleActive = async (link) => {
    try {
      await updateBookingLink(link.id, { isActive: !link.isActive });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
    } catch (err) {
      showAlert('error', 'Failed', 'Could not update link status');
    }
  };

  const copyLink = (link) => {
    Clipboard.setString(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareWhatsApp = (link) => {
    const msg = `Book ${link.serviceLabel} with us: ${link.url}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  const shareLink = async (link) => {
    try {
      await Share.share({ message: `Book ${link.serviceLabel} with us: ${link.url}` });
    } catch (err) {}
  };

  const previewLink = (link) => { Linking.openURL(link.url); };

  const activeCount   = links.filter(l => l.isActive).length;
  const totalViews    = links.reduce((s, l) => s + (l.clickCount || 0), 0);
  const totalBookings = links.reduce((s, l) => s + (l.bookingCount || 0), 0);

  /* ── Loading state ── */
  if (loading) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={s.grad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.gradTitle}>Booking Links</Text>
              <Bone w={160} h={11} r={4} style={{ marginTop: 6 }} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View style={s.statsStrip}>
        {[0,1,2].map(i => (
          <React.Fragment key={i}>
            {i > 0 && <View style={s.statDiv} />}
            <View style={s.statItem}>
              <Bone w={30} h={20} r={4} style={{ marginBottom: 4 }} />
              <Bone w={40} h={9} r={3} />
            </View>
          </React.Fragment>
        ))}
      </View>
      <View style={{ padding: 14, gap: 12 }}>
        {[0,1,2].map(i => (
          <View key={i} style={{ backgroundColor: C.surface, borderRadius: rs(18), flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
            <View style={{ width: 4, backgroundColor: '#DDE4EE' }} />
            <View style={{ flex: 1, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Bone w={50} h={50} r={16} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone w={120} h={13} r={4} />
                  <Bone w={80} h={16} r={12} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Bone w={70} h={28} r={10} />
                <Bone w={90} h={28} r={10} />
                <Bone w={80} h={28} r={10} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient colors={G.hero} style={s.grad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.gradTitle}>Booking Links</Text>
              <Text style={s.gradSub}>Share links to get direct bookings</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
              <Icon name="refresh-cw" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Stats strip — moved out of the header into the body */}
      <View style={s.statsStrip}>
        <View style={s.statItem}>
          <Icon name="zap" size={14} color={C.g700} style={{ marginBottom: 4 }} />
          <Text style={[s.statNum, { color: C.g700 }]}>{activeCount}</Text>
          <Text style={s.statLbl}>Active</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.statItem}>
          <Icon name="eye" size={14} color={C.blue} style={{ marginBottom: 4 }} />
          <Text style={[s.statNum, { color: C.blue }]}>{totalViews}</Text>
          <Text style={s.statLbl}>Views</Text>
        </View>
        <View style={s.statDiv} />
        <View style={s.statItem}>
          <Icon name="book-open" size={14} color={C.purple} style={{ marginBottom: 4 }} />
          <Text style={[s.statNum, { color: C.purple }]}>{totalBookings}</Text>
          <Text style={s.statLbl}>Bookings</Text>
        </View>
      </View>

      <VerificationBanner status={vendorStatus} navigation={navigation} />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {links.map(link => {
          const meta = SVC_META[link.serviceType] || DEFAULT_META;
          const isCopied = copiedId === link.id;

          return (
            <View key={link.id} style={[s.card, !link.isActive && { opacity: 0.6 }]}>
              {/* Left accent */}
              <View style={[s.cardAccent, { backgroundColor: meta.color }]} />

              <View style={s.cardInner}>
                {/* Top row */}
                <View style={s.cardTop}>
                  <View style={[s.svcIconWrap, { backgroundColor: meta.bg }]}>
                    {meta.iconLib === 'mci' ? (
                      <MaterialCommunityIcons name={meta.icon} size={24} color={meta.color} />
                    ) : (
                      <Icon name={meta.icon} size={22} color={meta.color} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                      <Text style={s.svcName}>{link.serviceLabel || meta.label}</Text>
                      <View style={[s.statusPill, { backgroundColor: link.isActive ? C.g100 : '#F3F4F6' }]}>
                        <View style={[s.statusDot, { backgroundColor: link.isActive ? C.g600 : C.muted }]} />
                        <Text style={[s.statusTxt, { color: link.isActive ? C.g700 : C.muted }]}>
                          {link.isActive ? 'Active' : 'Paused'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[s.urlText, { color: meta.color }]} numberOfLines={1}>{link.url}</Text>

                    {link.formTitle ? (
                      <Text style={s.formTitle} numberOfLines={1}>"{link.formTitle}"</Text>
                    ) : null}

                    <View style={s.inlineStats}>
                      <View style={s.inlineStat}>
                        <Icon name="eye" size={11} color={C.muted} />
                        <Text style={s.inlineStatVal}>{link.clickCount || 0}</Text>
                        <Text style={s.inlineStatLbl}>views</Text>
                      </View>
                      <View style={s.inlineStat}>
                        <Icon name="book-open" size={11} color={C.muted} />
                        <Text style={s.inlineStatVal}>{link.bookingCount || 0}</Text>
                        <Text style={s.inlineStatLbl}>bookings</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity onPress={gate(() => toggleActive(link), 'change link settings')} style={s.toggleBtn}>
                    <Ionicons
                      name={link.isActive ? 'toggle' : 'toggle-outline'}
                      size={38}
                      color={link.isActive ? C.g600 : C.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Action chips */}
                <View style={s.chipsRow}>
                  <TouchableOpacity
                    style={[s.chip, isCopied && { backgroundColor: C.g100, borderColor: C.g400 }]}
                    onPress={() => copyLink(link)}
                  >
                    <Icon name={isCopied ? 'check' : 'copy'} size={13} color={isCopied ? C.g600 : C.subtext} />
                    <Text style={[s.chipTxt, isCopied && { color: C.g600 }]}>{isCopied ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.chip, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}
                    onPress={() => shareWhatsApp(link)}
                  >
                    <Ionicons name="logo-whatsapp" size={13} color="#128C7E" />
                    <Text style={[s.chipTxt, { color: '#128C7E' }]}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.chip, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
                    onPress={() => navigation.navigate('BookingLinkQR', { link })}
                  >
                    <MaterialCommunityIcons name="qrcode" size={13} color={C.purple} />
                    <Text style={[s.chipTxt, { color: C.purple }]}>QR Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.chip, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                    onPress={gate(() => navigation.navigate('CustomizeBookingLink', { link }), 'customise booking links')}
                  >
                    <Icon name="settings" size={12} color={C.amber} />
                    <Text style={[s.chipTxt, { color: C.amber }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.chip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                    onPress={() => shareLink(link)}
                  >
                    <Icon name="share-2" size={12} color={C.blue} />
                    <Text style={[s.chipTxt, { color: C.blue }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* Empty state */}
        {links.length === 0 && (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Icon name="link" size={38} color={C.g600} />
            </View>
            <Text style={s.emptyTitle}>No booking links yet</Text>
            <Text style={s.emptySub}>Your booking links will appear here once your services are approved.</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
      {LockGateModal}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Gradient header */
  grad: { paddingBottom: rs(10), overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  gradTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  gradTitle: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  gradSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  statsStrip: {
    flexDirection: 'row', backgroundColor: C.surface,
    marginHorizontal: 14, marginTop: 14, marginBottom: 4,
    borderRadius: rs(14), overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statItem: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statNum: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '800', color: C.text },
  statLbl: { fontSize: 10, color: C.muted, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, backgroundColor: C.border, marginVertical: 10 },

  /* Scroll */
  scroll: { padding: 14, paddingTop: 14, gap: 12, paddingBottom: 30 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: rs(18), flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  svcIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  svcName: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 12, fontWeight: '700' },
  urlText: { fontSize: 12, fontFamily: 'monospace', marginBottom: 2 },
  formTitle: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginBottom: 4 },

  inlineStats: { flexDirection: 'row', gap: 14, marginTop: 6 },
  inlineStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineStatVal: { fontSize: 13, fontWeight: '700', color: C.subtext },
  inlineStatLbl: { fontSize: 12, color: C.muted },

  toggleBtn: { padding: 2, marginTop: 2 },

  /* Chips */
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border + '80' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipTxt: { fontSize: 12, fontWeight: '700', color: C.subtext },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 10 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
  },
  emptyTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
