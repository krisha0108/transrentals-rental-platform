// screens/vendor/booking-links/BookingLinkQRScreen.js
// Full-page QR code viewer/sharer — mirrors the same Elevate structural
// language as CustomizeBookingLinkScreen: gradient header with orbs, intro
// card, section labels, cards, sticky bottom action bar. Travel-agent side
// has no QR feature of its own to mirror directly, so this follows the same
// full-page pattern already established for this app's other booking-link
// screens instead of a cramped bottom-sheet modal.
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, StatusBar, Linking, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import { getBookingLinkQR } from '../../api/client';
import { showError, showSuccess } from '../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

let RNShare = null;
let RNFS = null;
try {
  RNShare = require('react-native-share').default;
  RNFS = require('react-native-fs');
} catch (e) {
  console.warn('[BookingLinkQR] Native share modules not available:', e.message);
}

const C = {
  g900: T.forestDark, g700: T.emeraldDeep, g600: T.emerald600,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, muted: T.subText,
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

export default function BookingLinkQRScreen({ navigation, route }) {
  const { link } = route.params || {};

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!link) return;
      setQrLoading(true);
      try {
        const res = await getBookingLinkQR(link.url, link.id);
        if (res?.qr) setQrDataUrl(res.qr);
      } catch (err) {
        showError('Could not generate QR code');
      } finally {
        setQrLoading(false);
      }
    })();
  }, [link]);

  const copyUrl = () => {
    if (!link) return;
    Clipboard.setString(link.url);
    showSuccess('Link copied to clipboard', 'Copied!');
  };

  const previewLink = () => { if (link) Linking.openURL(link.url); };

  const shareQrImage = async (social) => {
    if (!link || !qrDataUrl) return;
    try {
      if (RNShare && RNFS) {
        const base64Data = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const fileName = `booking-qr-${Date.now()}.png`;
        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, base64Data, 'base64');
        const shareOptions = {
          title: `Book ${link.serviceLabel}`,
          message: `Book ${link.serviceLabel} with us!\n${link.url}`,
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
        const msg = `Book ${link.serviceLabel} with us!\nScan the QR code or click here: ${link.url}`;
        if (social === 'whatsapp') {
          Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
        } else {
          await Share.share({ message: msg });
        }
      }
    } catch (err) {
      console.error('[BookingLinkQR] Share error:', err);
      if (err?.message?.includes?.('User did not share') || err?.message?.includes?.('CANCELED')) return;
      if (err?.message?.includes?.('not installed') || err?.error?.includes?.('not installed')) {
        showError('WhatsApp is not installed on this device', 'Not Available');
      } else {
        showError(err?.message || 'Could not share QR image', 'Share Failed');
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ===== Gradient header ===== */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.headerGrad}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 12, paddingBottom: 26 }}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>QR Code</Text>
              <Text style={s.headerSub} numberOfLines={1}>{link?.serviceLabel || 'Booking Link'}</Text>
            </View>
            <TouchableOpacity
              style={[s.iconBtn, !qrDataUrl && { opacity: 0.5 }]}
              onPress={() => shareQrImage()}
              disabled={!qrDataUrl}
            >
              <Ionicons name="share-social" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ===== How-it-works intro card ===== */}
        <View style={s.introCard}>
          <View style={s.introIconWrap}>
            <Ionicons name="scan" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.introTitle}>How it works</Text>
            <Text style={s.introBody}>
              Customers scan this with their phone camera to open your booking form instantly — great for flyers, standees, or business cards.
            </Text>
          </View>
        </View>

        {/* ===== QR code section ===== */}
        <SectionLabel icon="qr-code" color={C.g600} label="QR Code" />
        <View style={s.card}>
          <View style={s.qrFrame}>
            {qrLoading ? (
              <Bone w={196} h={196} r={12} />
            ) : qrDataUrl ? (
              <Image source={{ uri: qrDataUrl }} style={s.qrImage} resizeMode="contain" />
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Icon name="alert-circle" size={28} color={C.muted} />
                <Text style={{ color: C.muted, fontSize: 14 }}>Failed to load QR</Text>
              </View>
            )}
          </View>

          <View style={s.urlPill}>
            <Icon name="link" size={13} color={C.muted} />
            <Text style={s.urlPillTxt} numberOfLines={1}>{link?.url}</Text>
            <TouchableOpacity onPress={copyUrl} style={s.urlPillCopy}>
              <Text style={s.urlPillCopyTxt}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Share section ===== */}
        <SectionLabel icon="share-social" color={C.blue} label="Share" />
        <View style={s.card}>
          <View style={s.secRow}>
            <TouchableOpacity
              style={[s.secBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }, !qrDataUrl && { opacity: 0.4 }]}
              onPress={() => shareQrImage('whatsapp')}
              disabled={!qrDataUrl}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#128C7E" />
              <Text style={[s.secTxt, { color: '#128C7E' }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.secBtn, { backgroundColor: C.g50, borderColor: C.g100 }]} onPress={previewLink}>
              <Icon name="external-link" size={16} color={C.g700} />
              <Text style={[s.secTxt, { color: C.g700 }]}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ===== Sticky bottom share bar ===== */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.shareWrap, !qrDataUrl && { opacity: 0.5 }]}
          onPress={() => shareQrImage()}
          disabled={!qrDataUrl}
          activeOpacity={0.9}
        >
          <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.shareBtn}>
            <Icon name="share-2" size={18} color="#fff" />
            <Text style={s.shareBtnText}>Share QR Image</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ───────── Sub-components ───────── */

function SectionLabel({ icon, color, label }) {
  return (
    <View style={s.sectionLabelRow}>
      <View style={[s.sectionLabelIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={[s.sectionLabelText, { color }]}>{label}</Text>
    </View>
  );
}

/* ───────── Styles ───────── */
const s = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20), overflow: 'hidden', position: 'relative' },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: 2 },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },

  // Intro card
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: rs(14),
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    marginBottom: 14,
  },
  introIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.g600, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: C.g700, marginBottom: 3 },
  introBody: { fontSize: 13, color: C.text, lineHeight: 17, fontWeight: '500' },

  // Section label
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 8 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionLabelText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Card
  card: { backgroundColor: C.card, borderRadius: rs(14), padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 14, alignItems: 'center' },

  qrFrame: {
    width: 220, height: 220, borderRadius: rs(20), backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1.5, borderColor: C.border, ...cardShadow,
  },
  qrImage: { width: 196, height: 196, borderRadius: 12 },

  urlPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.g50, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, width: '100%', borderWidth: 1, borderColor: C.g100,
  },
  urlPillTxt: { flex: 1, fontSize: 12, fontFamily: 'monospace', color: C.muted },
  urlPillCopy: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.g100 },
  urlPillCopyTxt: { fontSize: 12, fontWeight: '700', color: C.g700 },

  secRow: { flexDirection: 'row', gap: 10, width: '100%' },
  secBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: rs(12), borderWidth: 1.5 },
  secTxt: { fontSize: 14, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  shareWrap: {
    flex: 1, borderRadius: rs(12), overflow: 'hidden',
    ...cardShadow,
  },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  shareBtnText: { fontFamily: DISPLAY, color: '#fff', fontWeight: '800', fontSize: 14.5 },
});
