// screens/vendor/booking-links/CustomizeBookingLinkScreen.js
// Full-page "Customize Form" editor — mirrors the travel-agent side's
// AddEditCaptureLinkScreen structure: gradient header with inline Save pill,
// intro card, section labels, field cards, a live preview of the public
// booking form, and a sticky bottom Save bar.
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { updateBookingLink } from '../../api/client';
import { showError, showSuccess } from '../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

const C = {
  g900: T.forestDark, g700: T.emeraldDeep, g600: T.emerald600,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, muted: T.subText, blue: T.blue,
};

export default function CustomizeBookingLinkScreen({ navigation, route }) {
  const { link } = route.params || {};

  const [form, setForm] = useState({
    formTitle: link?.formTitle || '',
    welcomeMsg: link?.welcomeMsg || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!link) return;
    setSaving(true);
    try {
      await updateBookingLink(link.id, form);
      showSuccess('Form customization updated', 'Saved!');
      navigation.goBack();
    } catch (err) {
      showError('Could not save customization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ===== Gradient header ===== */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.headerGrad}>
        <AnimatedOrb style={s.orbA} delay={0} dx={14} dy={12} />
        <AnimatedOrb style={s.orbB} delay={900} dx={-12} dy={10} />
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 12, paddingBottom: 26 }}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Customize Form</Text>
              <Text style={s.headerSub} numberOfLines={1}>{link?.serviceLabel || 'Booking Link'}</Text>
            </View>
            <TouchableOpacity
              style={[s.headerSaveBtn, saving && { opacity: 0.5 }]}
              onPress={save}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color={C.g700} /> : <Text style={s.headerSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ===== How-it-works intro card ===== */}
          <View style={s.introCard}>
            <View style={s.introIconWrap}>
              <Ionicons name="bulb" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.introTitle}>How it works</Text>
              <Text style={s.introBody}>
                These show up right on your public booking form, so customers know exactly what they're booking and from whom.
              </Text>
            </View>
          </View>

          {/* ===== Form details section ===== */}
          <SectionLabel icon="document-text" color={C.g600} label="Form details" />
          <View style={s.card}>
            <Field label="Form Title">
              <TextInput
                style={s.input}
                placeholder="e.g. Book a Bike with Rahul Travels"
                placeholderTextColor={C.muted}
                value={form.formTitle}
                onChangeText={v => update('formTitle', v)}
              />
              <Text style={s.helper}>Shown as the heading on your booking form</Text>
            </Field>
            <Field label="Welcome Message">
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="e.g. Best rates in Pune. We offer Royal Enfield, Activa & more."
                placeholderTextColor={C.muted}
                value={form.welcomeMsg}
                onChangeText={v => update('welcomeMsg', v)}
                multiline numberOfLines={4} textAlignVertical="top"
              />
              <Text style={s.helper}>Shown as a note below your business name</Text>
            </Field>
          </View>

          {/* ===== Live preview section ===== */}
          <SectionLabel icon="eye" color={C.blue} label="Live preview" />
          <View style={s.card}>
            <Text style={s.previewLabel}>HOW CUSTOMERS WILL SEE IT</Text>
            <View style={s.previewBox}>
              <Text style={s.previewTitle} numberOfLines={2}>
                {form.formTitle.trim() || 'Your form title appears here'}
              </Text>
              {!!form.welcomeMsg.trim() && (
                <Text style={s.previewDesc} numberOfLines={3}>{form.welcomeMsg.trim()}</Text>
              )}
              <View style={s.previewFields}>
                <View style={s.previewField} />
                <View style={s.previewField} />
                <View style={[s.previewField, { width: '60%' }]} />
                <View style={s.previewCta}>
                  <Text style={s.previewCtaText}>Submit Booking Request</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== Sticky bottom save bar ===== */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.saveWrap, saving && { opacity: 0.5 }]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.saveBtn}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Icon name="check" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Save Changes</Text>
              </>
            )}
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

function Field({ label, children }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ───────── Styles ───────── */
const s = StyleSheet.create({
  // Header
  headerGrad: { borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20), overflow: 'hidden', position: 'relative' },
  orbA: {
    position: 'absolute', top: -44, right: -28, width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbB: {
    position: 'absolute', bottom: -36, left: -32, width: 128, height: 128,
    borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.045)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginTop: 2 },
  headerSaveBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, minWidth: 60, alignItems: 'center' },
  headerSaveText: { fontFamily: DISPLAY, color: C.g700, fontWeight: '800', fontSize: 13 },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },

  // Intro card
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: rs(14),
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    marginBottom: 14,
  },
  introIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.g600, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '800', color: C.g700, marginBottom: 3 },
  introBody: { fontSize: 12, color: C.text, lineHeight: 17, fontWeight: '500' },

  // Section label
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 8 },
  sectionLabelIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionLabelText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Card
  card: { backgroundColor: C.card, borderRadius: rs(14), padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 14 },

  // Field
  field: { marginBottom: 12 },
  fieldLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 6 },
  helper: { fontSize: 11, color: C.muted, marginTop: 4, fontWeight: '600' },
  input: {
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g100, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.text, minHeight: 46,
  },
  inputMultiline: { minHeight: 90, paddingTop: 10 },

  // Live preview
  previewLabel: { fontFamily: DISPLAY, fontSize: 10, color: C.muted, fontWeight: '800', letterSpacing: 0.6, marginBottom: 8 },
  previewBox: {
    padding: 14, borderRadius: rs(12),
    backgroundColor: '#fff', borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  previewTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 5 },
  previewDesc: { fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 10 },
  previewFields: { gap: 6 },
  previewField: { height: 32, backgroundColor: C.bg, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  previewCta: { marginTop: 6, backgroundColor: C.g600, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  previewCtaText: { fontFamily: DISPLAY, color: '#fff', fontSize: 12, fontWeight: '800' },

  // Bottom save bar
  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveWrap: {
    flex: 1, borderRadius: rs(12), overflow: 'hidden',
    ...cardShadow,
  },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnText: { fontFamily: DISPLAY, color: '#fff', fontWeight: '800', fontSize: 14.5 },
});
