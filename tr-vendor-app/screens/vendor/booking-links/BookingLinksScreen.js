import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Share, Modal,
  TextInput, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { getBookingLinks, updateBookingLink, getBookingLinkQR } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { ListSkeleton } from '../../../components/SkeletonLoader';

let RNShare = null;
let RNFS = null;
try {
  RNShare = require('react-native-share').default;
  RNFS = require('react-native-fs');
} catch (e) {
  console.warn('[BookingLinks] Native share modules not available:', e.message);
}

const C = {
  g900: '#022C22', g800: '#064E3B', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g300: '#6EE7B7', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F0FDF9', surface: '#FFFFFF',
  text: '#1E293B', subtext: '#475569', muted: '#94A3B8', border: '#D1FAE5',
  blue: '#3B82F6', indigo: '#6366F1', purple: '#8B5CF6',
  amber: '#F59E0B', orange: '#F97316', red: '#EF4444', teal: '#14B8A6',
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

  const [qrModal, setQrModal] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [customizeLink, setCustomizeLink] = useState(null);
  const [customizeData, setCustomizeData] = useState({ formTitle: '', welcomeMsg: '' });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { fetchLinks(); }, [fetchLinks]);
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

  const openQr = async (link) => {
    setQrModal({ url: link.url, label: link.serviceLabel, linkId: link.id });
    setQrDataUrl(null);
    setQrLoading(true);
    try {
      const res = await getBookingLinkQR(link.url, link.id);
      if (res?.qr) setQrDataUrl(res.qr);
    } catch (err) {
      showAlert('error', 'QR Failed', 'Could not generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const shareQrImage = async (social) => {
    if (!qrModal || !qrDataUrl) return;
    try {
      if (RNShare && RNFS) {
        const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const fileName = `booking-qr-${Date.now()}.png`;
        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, base64Data, 'base64');
        const shareOptions = {
          title: `Book ${qrModal.label}`,
          message: `Book ${qrModal.label} with us!\n${qrModal.url}`,
          url: `file://${filePath}`,
          type: 'image/png',
        };
        if (social === 'whatsapp') {
          shareOptions.social = RNShare.Social.WHATSAPP;
          await RNShare.shareSingle(shareOptions);
        } else {
          await RNShare.open(shareOptions);
        }
      } else {
        const msg = `Book ${qrModal.label} with us!\nScan the QR code or click here: ${qrModal.url}`;
        if (social === 'whatsapp') {
          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
        } else {
          await Share.share({ message: msg });
        }
      }
    } catch (err) {
      console.error('[BookingLinks] Share error:', err);
      if (err?.message?.includes?.('User did not share') || err?.message?.includes?.('CANCELED')) return;
      if (err?.message?.includes?.('not installed') || err?.error?.includes?.('not installed')) {
        showAlert('warning', 'Not Available', 'WhatsApp is not installed on this device');
      } else {
        showAlert('error', 'Share Failed', err?.message || 'Could not share QR image');
      }
    }
  };

  const openCustomize = (link) => {
    setCustomizeLink(link);
    setCustomizeData({ formTitle: link.formTitle || '', welcomeMsg: link.welcomeMsg || '' });
  };

  const saveCustomize = async () => {
    if (!customizeLink) return;
    setSaving(true);
    try {
      await updateBookingLink(customizeLink.id, customizeData);
      setLinks(prev => prev.map(l => l.id === customizeLink.id ? { ...l, ...customizeData } : l));
      setCustomizeLink(null);
      showAlert('success', 'Saved!', 'Form customization updated');
    } catch (err) {
      showAlert('error', 'Failed', 'Could not save customization');
    } finally {
      setSaving(false);
    }
  };

  const activeCount   = links.filter(l => l.isActive).length;
  const totalViews    = links.reduce((s, l) => s + (l.clickCount || 0), 0);
  const totalBookings = links.reduce((s, l) => s + (l.bookingCount || 0), 0);

  /* ── Loading state ── */
  if (loading) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.grad}>
        <SafeAreaView edges={['top']}>
          <View style={s.gradTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={s.gradTitle}>Booking Links</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <ListSkeleton count={3} />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.grad}>
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

          {/* Stats strip */}
          <View style={s.statsStrip}>
            <View style={s.statItem}>
              <Icon name="zap" size={14} color={C.g400} style={{ marginBottom: 4 }} />
              <Text style={[s.statNum, { color: C.g400 }]}>{activeCount}</Text>
              <Text style={s.statLbl}>Active</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Icon name="eye" size={14} color="#93C5FD" style={{ marginBottom: 4 }} />
              <Text style={[s.statNum, { color: '#93C5FD' }]}>{totalViews}</Text>
              <Text style={s.statLbl}>Views</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Icon name="book-open" size={14} color="#C4B5FD" style={{ marginBottom: 4 }} />
              <Text style={[s.statNum, { color: '#C4B5FD' }]}>{totalBookings}</Text>
              <Text style={s.statLbl}>Bookings</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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

                  <TouchableOpacity onPress={() => toggleActive(link)} style={s.toggleBtn}>
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
                    onPress={() => openQr(link)}
                  >
                    <MaterialCommunityIcons name="qrcode" size={13} color={C.purple} />
                    <Text style={[s.chipTxt, { color: C.purple }]}>QR Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.chip, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                    onPress={() => openCustomize(link)}
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
            <LinearGradient colors={[C.g100, C.g50]} style={s.emptyIcon}>
              <Icon name="link" size={38} color={C.g600} />
            </LinearGradient>
            <Text style={s.emptyTitle}>No booking links yet</Text>
            <Text style={s.emptySub}>Your booking links will appear here once your services are approved.</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── QR Code Modal ── */}
      <Modal visible={!!qrModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* QR Header — handle inside gradient so no white strip */}
            <LinearGradient colors={[C.g900, C.g800, C.g700]} style={s.modalHead}>
              <View style={s.modalHandle} />
              <View style={s.modalHeadRow}>
                <View>
                  <Text style={s.modalHeadTitle}>QR Code</Text>
                  <Text style={s.modalHeadSub}>{qrModal?.label}</Text>
                </View>
                <TouchableOpacity onPress={() => setQrModal(null)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={s.qrBody}>
              {/* QR image */}
              <View style={s.qrFrame}>
                {qrLoading ? (
                  <ActivityIndicator size="large" color={C.g600} />
                ) : qrDataUrl ? (
                  <Image source={{ uri: qrDataUrl }} style={s.qrImage} resizeMode="contain" />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Icon name="alert-circle" size={28} color={C.muted} />
                    <Text style={{ color: C.muted, fontSize: 13 }}>Failed to load QR</Text>
                  </View>
                )}
              </View>

              {/* URL pill */}
              <View style={s.urlPill}>
                <Icon name="link" size={13} color={C.muted} />
                <Text style={s.urlPillTxt} numberOfLines={1}>{qrModal?.url}</Text>
                <TouchableOpacity
                  onPress={() => { if (qrModal) { Clipboard.setString(qrModal.url); showAlert('success', 'Copied!', 'Link copied to clipboard'); } }}
                  style={s.urlPillCopy}
                >
                  <Text style={s.urlPillCopyTxt}>Copy</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <TouchableOpacity
                style={[s.qrShareBtn, !qrDataUrl && { opacity: 0.4 }]}
                onPress={() => shareQrImage()}
                disabled={!qrDataUrl}
              >
                <LinearGradient colors={[C.g700, C.g600]} style={s.qrShareGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Icon name="share-2" size={17} color="#fff" />
                  <Text style={s.qrShareTxt}>Share QR Image</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={s.qrSecRow}>
                <TouchableOpacity
                  style={[s.qrSecBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }, !qrDataUrl && { opacity: 0.4 }]}
                  onPress={() => shareQrImage('whatsapp')}
                  disabled={!qrDataUrl}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#128C7E" />
                  <Text style={[s.qrSecTxt, { color: '#128C7E' }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.qrSecBtn, { backgroundColor: C.g50, borderColor: C.g100 }]}
                  onPress={() => { if (qrModal) Linking.openURL(qrModal.url); }}
                >
                  <Icon name="external-link" size={16} color={C.g700} />
                  <Text style={[s.qrSecTxt, { color: C.g700 }]}>Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Customize Modal ── */}
      <Modal visible={!!customizeLink} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <LinearGradient
              colors={[C.g900, C.g800, C.g700]}
              style={s.modalHead}
            >
              <View style={s.modalHandle} />
              <View style={s.modalHeadRow}>
                <View>
                  <Text style={s.modalHeadTitle}>Customize Form</Text>
                  <Text style={s.modalHeadSub}>{customizeLink?.serviceLabel}</Text>
                </View>
                <TouchableOpacity onPress={() => setCustomizeLink(null)} style={s.modalCloseBtn}>
                  <Icon name="x" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={s.customBody}>
              <Text style={s.fieldLabel}>FORM TITLE</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Book a Bike with Rahul Travels"
                placeholderTextColor={C.muted}
                value={customizeData.formTitle}
                onChangeText={v => setCustomizeData(p => ({ ...p, formTitle: v }))}
              />
              <Text style={s.fieldHint}>Shown as the heading on your booking form</Text>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>WELCOME MESSAGE</Text>
              <TextInput
                style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. Best rates in Pune. We offer Royal Enfield, Activa & more."
                placeholderTextColor={C.muted}
                value={customizeData.welcomeMsg}
                onChangeText={v => setCustomizeData(p => ({ ...p, welcomeMsg: v }))}
                multiline
              />
              <Text style={s.fieldHint}>Shown as a note below your business name</Text>

              <View style={s.customBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setCustomizeLink(null)}>
                  <Text style={s.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveWrap, saving && { opacity: 0.6 }]}
                  onPress={saveCustomize}
                  disabled={saving}
                >
                  <LinearGradient colors={[C.g700, C.g600]} style={s.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="check" size={16} color="#fff" />
                        <Text style={s.saveBtnTxt}>Save</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        actions={alert.actions}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Gradient header */
  grad: { paddingBottom: 18 },
  gradTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  gradTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  gradSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  statsStrip: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statItem: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },

  /* Scroll */
  scroll: { padding: 14, paddingTop: 14, gap: 12, paddingBottom: 30 },

  /* Card */
  card: { backgroundColor: C.surface, borderRadius: 18, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: C.g900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  svcIconWrap: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  svcName: { fontSize: 15, fontWeight: '800', color: C.text },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  urlText: { fontSize: 11, fontFamily: 'monospace', marginBottom: 2 },
  formTitle: { fontSize: 11, color: C.muted, fontStyle: 'italic', marginBottom: 4 },

  inlineStats: { flexDirection: 'row', gap: 14, marginTop: 6 },
  inlineStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineStatVal: { fontSize: 12, fontWeight: '700', color: C.subtext },
  inlineStatLbl: { fontSize: 11, color: C.muted },

  toggleBtn: { padding: 2, marginTop: 2 },

  /* Chips */
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border + '80' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  chipTxt: { fontSize: 11, fontWeight: '700', color: C.subtext },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', alignSelf: 'center', marginTop: 12, marginBottom: 14 },
  modalHead: { paddingHorizontal: 20, paddingBottom: 18 },
  modalHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeadTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  modalHeadSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  /* QR */
  qrBody: { padding: 20, alignItems: 'center' },
  qrFrame: { width: 210, height: 210, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  qrImage: { width: 190, height: 190, borderRadius: 12 },

  urlPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.g50, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: C.g100 },
  urlPillTxt: { flex: 1, fontSize: 11, fontFamily: 'monospace', color: C.muted },
  urlPillCopy: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.g100 },
  urlPillCopyTxt: { fontSize: 11, fontWeight: '700', color: C.g700 },

  qrShareBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  qrShareGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  qrShareTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  qrSecRow: { flexDirection: 'row', gap: 10, width: '100%' },
  qrSecBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5 },
  qrSecTxt: { fontSize: 13, fontWeight: '700' },

  /* Customize modal */
  customBody: { padding: 20, paddingBottom: 36 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: { backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.text },
  fieldHint: { fontSize: 11, color: C.muted, marginTop: 4 },
  customBtns: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: C.border, alignItems: 'center' },
  cancelBtnTxt: { fontSize: 14, fontWeight: '600', color: C.muted },
  saveWrap: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
