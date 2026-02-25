import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Share, Modal,
  TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { getBookingLinks, updateBookingLink, getBookingLinkQR } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

// Lazy-load native modules (require native rebuild)
let RNShare = null;
let RNFS = null;
try {
  RNShare = require('react-native-share').default;
  RNFS = require('react-native-fs');
  console.log('[BookingLinks] react-native-share:', !!RNShare, 'RNFS:', !!RNFS);
} catch (e) {
  console.warn('[BookingLinks] Native share modules not available:', e.message);
}

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', subtext: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#3B82F6', green: '#10B981',
  orange: '#F59E0B', red: '#EF4444', purple: '#8B5CF6', emerald: '#059669',
  indigo: '#6366F1',
};

/* ── Service visual config ── */
const SVC_META = {
  'car-with-driver': { icon: 'car',            iconLib: 'mci', color: '#3B82F6', bg: '#DBEAFE', label: 'Car with Driver' },
  'self-drive':      { icon: 'car-side',        iconLib: 'mci', color: '#8B5CF6', bg: '#F3E8FF', label: 'Self-Drive Car' },
  bike:              { icon: 'motorbike',        iconLib: 'mci', color: '#F59E0B', bg: '#FEF3C7', label: 'Bike Rental' },
  bus:               { icon: 'bus',              iconLib: 'mci', color: '#10B981', bg: '#D1FAE5', label: 'Bus & Tempo' },
  luxury:            { icon: 'car-sports',       iconLib: 'mci', color: '#EAB308', bg: '#FEF9C3', label: 'Luxury Car' },
  transporter:       { icon: 'truck',            iconLib: 'mci', color: '#64748B', bg: '#F1F5F9', label: 'Transporter' },
  'packers-movers':  { icon: 'package-variant',  iconLib: 'mci', color: '#0EA5E9', bg: '#E0F2FE', label: 'Packers & Movers' },
  equipment:         { icon: 'wrench',           iconLib: 'mci', color: '#EF4444', bg: '#FEE2E2', label: 'Equipment Rental' },
  all:               { icon: 'globe',            iconLib: 'f',   color: '#6366F1', bg: '#E0E7FF', label: 'All Services' },
};
const DEFAULT_META = { icon: 'link', iconLib: 'f', color: '#6B7280', bg: '#F3F4F6', label: 'Booking Link' };

export default function BookingLinksScreen({ navigation }) {
  const [links, setLinks] = useState([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // QR modal
  const [qrModal, setQrModal] = useState(null); // { url, label, linkId }
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Customize modal
  const [customizeLink, setCustomizeLink] = useState(null);
  const [customizeData, setCustomizeData] = useState({ formTitle: '', welcomeMsg: '' });
  const [saving, setSaving] = useState(false);

  // Alert
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: null });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: null });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  /* ── Fetch ── */
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

  /* ── Toggle active ── */
  const toggleActive = async (link) => {
    try {
      await updateBookingLink(link.id, { isActive: !link.isActive });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
    } catch (err) {
      showAlert('error', 'Failed', 'Could not update link status');
    }
  };

  /* ── Copy link ── */
  const copyLink = (link) => {
    Clipboard.setString(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Share WhatsApp ── */
  const shareWhatsApp = (link) => {
    const msg = `Book ${link.serviceLabel} with us: ${link.url}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  /* ── Share native ── */
  const shareLink = async (link) => {
    try {
      await Share.share({
        message: `Book ${link.serviceLabel} with us: ${link.url}`,
      });
    } catch (err) {
      // user cancelled
    }
  };

  /* ── Preview in browser ── */
  const previewLink = (link) => {
    Linking.openURL(link.url);
  };

  /* ── QR Code ── */
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
        // Write base64 QR to a temp file, then share the file
        const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const fileName = `booking-qr-${Date.now()}.png`;
        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

        await RNFS.writeFile(filePath, base64Data, 'base64');
        console.log('[BookingLinks] QR image saved to:', filePath);

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
        // Fallback: share link text only
        const msg = `Book ${qrModal.label} with us!\nScan the QR code or click here: ${qrModal.url}`;
        if (social === 'whatsapp') {
          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
        } else {
          await Share.share({ message: msg });
        }
      }
    } catch (err) {
      console.error('[BookingLinks] Share error:', err);
      if (err?.message?.includes?.('User did not share') || err?.message?.includes?.('CANCELED')) {
        return;
      }
      if (err?.message?.includes?.('not installed') || err?.error?.includes?.('not installed')) {
        showAlert('warning', 'Not Available', 'WhatsApp is not installed on this device');
      } else {
        showAlert('error', 'Share Failed', err?.message || 'Could not share QR image');
      }
    }
  };

  /* ── Customize ── */
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

  /* ── Stats ── */
  const activeCount = links.filter(l => l.isActive).length;
  const totalViews = links.reduce((s, l) => s + (l.clickCount || 0), 0);
  const totalBookings = links.reduce((s, l) => s + (l.bookingCount || 0), 0);

  /* ── Loading ── */
  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.centered}><ActivityIndicator size="large" color={C.indigo} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Booking Links</Text>
          <Text style={s.headerSub}>Share links to get direct bookings</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <Icon name="refresh-cw" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        {[
          { label: 'Active', value: activeCount, icon: 'zap', color: '#22C55E' },
          { label: 'Views', value: totalViews, icon: 'eye', color: '#3B82F6' },
          { label: 'Bookings', value: totalBookings, icon: 'book-open', color: '#8B5CF6' },
        ].map(stat => (
          <View key={stat.label} style={s.statCard}>
            <View style={[s.statIconWrap, { backgroundColor: stat.color + '15' }]}>
              <Icon name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.indigo]} />}
      >
        {links.map(link => {
          const meta = SVC_META[link.serviceType] || DEFAULT_META;
          const isCopied = copiedId === link.id;

          return (
            <View key={link.id} style={[s.card, !link.isActive && { opacity: 0.55 }]}>
              {/* Colored top strip */}
              <View style={[s.cardStrip, { backgroundColor: meta.color }]} />

              <View style={s.cardBody}>
                {/* Top row: icon + info + toggle */}
                <View style={s.cardTopRow}>
                  {/* Service icon */}
                  <View style={[s.svcIcon, { backgroundColor: meta.bg }]}>
                    {meta.iconLib === 'mci' ? (
                      <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
                    ) : (
                      <Icon name={meta.icon} size={20} color={meta.color} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                      <Text style={s.svcName}>{link.serviceLabel || meta.label}</Text>
                      <View style={[s.activeBadge, { backgroundColor: link.isActive ? '#DCFCE7' : '#F3F4F6' }]}>
                        <View style={[s.activeDot, { backgroundColor: link.isActive ? C.green : C.muted }]} />
                        <Text style={[s.activeText, { color: link.isActive ? C.emerald : C.muted }]}>
                          {link.isActive ? 'Active' : 'Paused'}
                        </Text>
                      </View>
                    </View>

                    {/* URL */}
                    <Text style={[s.urlText, { color: meta.color }]} numberOfLines={1}>{link.url}</Text>

                    {/* Custom title */}
                    {link.formTitle ? (
                      <Text style={s.formTitleText} numberOfLines={1}>"{link.formTitle}"</Text>
                    ) : null}

                    {/* Stats */}
                    <View style={s.statsInline}>
                      <View style={s.statInline}>
                        <Icon name="eye" size={12} color={C.muted} />
                        <Text style={s.statInlineVal}>{link.clickCount || 0}</Text>
                        <Text style={s.statInlineLabel}>views</Text>
                      </View>
                      <View style={s.statInline}>
                        <Icon name="book-open" size={12} color={C.muted} />
                        <Text style={s.statInlineVal}>{link.bookingCount || 0}</Text>
                        <Text style={s.statInlineLabel}>bookings</Text>
                      </View>
                    </View>
                  </View>

                  {/* Toggle */}
                  <TouchableOpacity onPress={() => toggleActive(link)} style={s.toggleBtn}>
                    <Ionicons
                      name={link.isActive ? 'toggle' : 'toggle-outline'}
                      size={36}
                      color={link.isActive ? C.green : C.muted}
                    />
                  </TouchableOpacity>
                </View>

                {/* Action buttons */}
                <View style={s.actionsRow}>
                  {/* Copy */}
                  <TouchableOpacity
                    style={[s.actionChip, isCopied && { backgroundColor: '#DCFCE7', borderColor: C.green }]}
                    onPress={() => copyLink(link)}
                  >
                    <Icon name={isCopied ? 'check' : 'copy'} size={14} color={isCopied ? C.green : C.subtext} />
                    <Text style={[s.actionChipText, isCopied && { color: C.green }]}>
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  {/* WhatsApp */}
                  <TouchableOpacity
                    style={[s.actionChip, { backgroundColor: '#DCFCE710', borderColor: '#25D36640' }]}
                    onPress={() => shareWhatsApp(link)}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#128C7E" />
                    <Text style={[s.actionChipText, { color: '#128C7E' }]}>WhatsApp</Text>
                  </TouchableOpacity>

                  {/* QR */}
                  <TouchableOpacity
                    style={[s.actionChip, { backgroundColor: '#F3E8FF', borderColor: '#8B5CF640' }]}
                    onPress={() => openQr(link)}
                  >
                    <MaterialCommunityIcons name="qrcode" size={14} color={C.purple} />
                    <Text style={[s.actionChipText, { color: C.purple }]}>QR</Text>
                  </TouchableOpacity>

                  {/* Customize */}
                  <TouchableOpacity
                    style={[s.actionChip, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B40' }]}
                    onPress={() => openCustomize(link)}
                  >
                    <Icon name="settings" size={13} color={C.orange} />
                    <Text style={[s.actionChipText, { color: C.orange }]}>Edit</Text>
                  </TouchableOpacity>

                  {/* Share */}
                  <TouchableOpacity
                    style={[s.actionChip, { backgroundColor: '#DBEAFE', borderColor: '#3B82F640' }]}
                    onPress={() => shareLink(link)}
                  >
                    <Icon name="share-2" size={13} color={C.brand} />
                    <Text style={[s.actionChipText, { color: C.brand }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* Empty state */}
        {links.length === 0 && (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Icon name="globe" size={36} color={C.indigo} />
            </View>
            <Text style={s.emptyTitle}>No booking links yet</Text>
            <Text style={s.emptyMsg}>Your booking links will appear here once your services are approved.</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── QR Code Modal ── */}
      <Modal visible={!!qrModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {/* Header */}
            <View style={s.qrHeader}>
              <View>
                <Text style={s.qrHeaderTitle}>QR Code</Text>
                <Text style={s.qrHeaderSub}>{qrModal?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setQrModal(null)} style={s.qrCloseBtn}>
                <Icon name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.qrBody}>
              {/* QR Image */}
              <View style={s.qrImageWrap}>
                {qrLoading ? (
                  <ActivityIndicator size="large" color={C.purple} />
                ) : qrDataUrl ? (
                  <Image source={{ uri: qrDataUrl }} style={s.qrImage} resizeMode="contain" />
                ) : (
                  <Text style={{ color: C.muted }}>Failed to load QR</Text>
                )}
              </View>

              {/* URL pill */}
              <View style={s.urlPill}>
                <Text style={s.urlPillText} numberOfLines={1}>{qrModal?.url}</Text>
                <TouchableOpacity
                  onPress={() => { if (qrModal) { Clipboard.setString(qrModal.url); showAlert('success', 'Copied!', 'Link copied to clipboard'); } }}
                  style={s.urlPillCopy}
                >
                  <Icon name="copy" size={12} color={C.subtext} />
                  <Text style={s.urlPillCopyText}>Copy</Text>
                </TouchableOpacity>
              </View>

              {/* Share actions */}
              <View style={s.qrActions}>
                <TouchableOpacity
                  style={[s.qrShareBtn, !qrDataUrl && { opacity: 0.4 }]}
                  onPress={() => shareQrImage()}
                  disabled={!qrDataUrl}
                >
                  <Icon name="share-2" size={18} color="#fff" />
                  <Text style={s.qrShareBtnText}>Share QR Image</Text>
                </TouchableOpacity>

                <View style={s.qrSecondaryRow}>
                  <TouchableOpacity
                    style={[s.qrWhatsAppBtn, !qrDataUrl && { opacity: 0.4 }]}
                    onPress={() => shareQrImage('whatsapp')}
                    disabled={!qrDataUrl}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#128C7E" />
                    <Text style={s.qrWhatsAppText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.qrPreviewBtn} onPress={() => { if (qrModal) Linking.openURL(qrModal.url); }}>
                    <Icon name="external-link" size={16} color={C.subtext} />
                    <Text style={s.qrPreviewText}>Preview</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Customize Modal ── */}
      <Modal visible={!!customizeLink} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {/* Header */}
            <View style={[s.qrHeader, { backgroundColor: (SVC_META[customizeLink?.serviceType] || DEFAULT_META).color }]}>
              <View>
                <Text style={s.qrHeaderTitle}>Customize Form</Text>
                <Text style={s.qrHeaderSub}>{customizeLink?.serviceLabel}</Text>
              </View>
              <TouchableOpacity onPress={() => setCustomizeLink(null)} style={s.qrCloseBtn}>
                <Icon name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.customizeBody}>
              <Text style={s.customizeLabel}>FORM TITLE</Text>
              <TextInput
                style={s.customizeInput}
                placeholder="e.g. Book a Bike with Rahul Travels"
                placeholderTextColor={C.muted}
                value={customizeData.formTitle}
                onChangeText={v => setCustomizeData(p => ({ ...p, formTitle: v }))}
              />
              <Text style={s.customizeHint}>Shown as the heading on your booking form</Text>

              <Text style={[s.customizeLabel, { marginTop: 16 }]}>WELCOME MESSAGE</Text>
              <TextInput
                style={[s.customizeInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. Best rates in Pune. We offer Royal Enfield, Activa & more."
                placeholderTextColor={C.muted}
                value={customizeData.welcomeMsg}
                onChangeText={v => setCustomizeData(p => ({ ...p, welcomeMsg: v }))}
                multiline
              />
              <Text style={s.customizeHint}>Shown as a note below your business name</Text>

              <View style={s.customizeBtns}>
                <TouchableOpacity style={s.customizeCancelBtn} onPress={() => setCustomizeLink(null)}>
                  <Text style={s.customizeCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.customizeSaveBtn, saving && { opacity: 0.6 }]}
                  onPress={saveCustomize}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={16} color="#fff" />
                      <Text style={s.customizeSaveText}>Save</Text>
                    </>
                  )}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.indigo,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#C7D7FE', marginTop: 1 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.indigo, paddingBottom: 20,
  },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center',
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#C7D7FE', marginTop: 2 },

  scroll: { padding: 16, gap: 12 },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardStrip: { height: 3 },
  cardBody: { padding: 14 },

  // Card top row
  cardTopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  svcIcon: {
    width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  svcName: { fontSize: 15, fontWeight: '700', color: C.text },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontWeight: '700' },
  urlText: { fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
  formTitleText: { fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 2 },

  // Inline stats
  statsInline: { flexDirection: 'row', gap: 14, marginTop: 8 },
  statInline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statInlineVal: { fontSize: 12, fontWeight: '700', color: C.subtext },
  statInlineLabel: { fontSize: 11, color: C.muted },

  // Toggle
  toggleBtn: { padding: 4 },

  // Actions row
  actionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', borderStyle: 'dashed',
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: C.border,
  },
  actionChipText: { fontSize: 12, fontWeight: '700', color: C.subtext },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#E0E7FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyMsg: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

  // QR Modal
  qrHeader: {
    backgroundColor: C.purple, paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  qrHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  qrHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  qrCloseBtn: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  qrBody: { padding: 20, alignItems: 'center' },
  qrImageWrap: {
    width: 200, height: 200, borderRadius: 20, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  qrImage: { width: 180, height: 180, borderRadius: 12 },

  // URL pill
  urlPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    width: '100%', marginBottom: 16,
  },
  urlPillText: { flex: 1, fontSize: 11, fontFamily: 'monospace', color: C.muted },
  urlPillCopy: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  urlPillCopyText: { fontSize: 11, fontWeight: '600', color: C.subtext },

  // QR actions
  qrActions: { width: '100%', gap: 10 },
  qrShareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple, paddingVertical: 14, borderRadius: 16,
  },
  qrShareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  qrSecondaryRow: { flexDirection: 'row', gap: 10 },
  qrWhatsAppBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DCFCE7', paddingVertical: 13, borderRadius: 14,
  },
  qrWhatsAppText: { fontSize: 13, fontWeight: '700', color: '#128C7E' },
  qrPreviewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#F1F5F9', paddingVertical: 13, borderRadius: 14,
  },
  qrPreviewText: { fontSize: 13, fontWeight: '600', color: C.subtext },

  // Customize
  customizeBody: { padding: 20 },
  customizeLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 6 },
  customizeInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
  },
  customizeHint: { fontSize: 11, color: C.muted, marginTop: 4 },
  customizeBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  customizeCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: C.border,
    alignItems: 'center',
  },
  customizeCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
  customizeSaveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.indigo, paddingVertical: 14, borderRadius: 14,
  },
  customizeSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
