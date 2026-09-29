/**
 * SelfDriveEditTemplateScreen.js - Edit existing self-drive quote template
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getTemplateById, updateTemplate } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const { width: W } = Dimensions.get('window');

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g50: T.tintEmerald, g100: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border, text: T.ink,
  sub: T.text, muted: T.subText,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  green: T.emerald500, greenL: T.tintEmerald,
  indigo: T.indigo, indigoL: T.indigoLight,
};

const SELF_DRIVE_CATEGORIES = [
  { id: 'hatchback',   name: 'Hatchback',   icon: 'car-hatchback' },
  { id: 'sedan',       name: 'Sedan',       icon: 'car-sedan'     },
  { id: 'suv',         name: 'SUV',         icon: 'car-estate'    },
  { id: 'muv',         name: 'MUV',         icon: 'van-utility'   },
  { id: 'compact-suv', name: 'Compact SUV', icon: 'car-sports'    },
  { id: 'luxury',      name: 'Luxury',      icon: 'car-sports'    },
];

export default function SelfDriveEditTemplateScreen({ navigation, route }) {
  const { templateId } = route.params;
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [dailyRate, setDailyRate] = useState('');
  const [kmLimit, setKmLimit] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => { loadTemplate(); }, []);

  const loadTemplate = async () => {
    try {
      const data = await getTemplateById('self-drive', templateId);
      const t = data.template || data;
      setTemplateName(t.name);
      setName(t.name);
      setCategory(t.category);
      setDescription(t.description || '');
      setInclusions(t.inclusions || []);
      setExclusions(t.exclusions || []);
      setTerms(t.termsConditions || []);
      setDailyRate(t.dailyRateHint       ? t.dailyRateHint.toString()       : '');
      setKmLimit(t.kmLimitPerDay         ? t.kmLimitPerDay.toString()        : '');
      setExtraKmRate(t.extraKmRateHint   ? t.extraKmRateHint.toString()      : '');
      setSecurityDeposit(t.securityDepositHint ? t.securityDepositHint.toString() : '');
      setIsDefault(t.isDefault || false);
      setIsActive(t.isActive !== undefined ? t.isActive : true);
    } catch {
      showError('Failed to load template');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const addItem = (val, list, setList, setVal) => {
    const v = val.trim();
    if (v && !list.includes(v)) { setList([...list, v]); setVal(''); }
  };

  const removeItem = (item, list, setList) => setList(list.filter(i => i !== item));

  const handleSubmit = async () => {
    if (!name.trim() || !category) { showError('Please enter template name and select category'); return; }
    if (inclusions.length === 0) { showError('Please add at least one inclusion'); return; }

    setIsSubmitting(true);
    try {
      await updateTemplate('self-drive', templateId, {
        name: name.trim(), category,
        description: description.trim() || null,
        inclusions, exclusions,
        termsConditions: terms,
        dailyRateHint:       dailyRate       ? parseFloat(dailyRate)       : null,
        kmLimitPerDay:       kmLimit         ? parseInt(kmLimit)           : null,
        extraKmRateHint:     extraKmRate     ? parseFloat(extraKmRate)     : null,
        securityDepositHint: securityDeposit ? parseFloat(securityDeposit) : null,
        isDefault, isActive,
      });
      showSuccess('Template updated!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch {
      showError('Failed to update template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionCard = ({ icon, iconColor, iconBg, title, children }) => (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <View style={[s.sectionIconBox, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={16} color={iconColor} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.hero}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={s.heroRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Icon name="arrow-left" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.heroTitle}>Edit Template</Text>
                <Text style={s.heroSub}>Loading template data...</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIconBox, { backgroundColor: C.indigoL }]} />
              <Bone w={130} h={14} />
            </View>
            <Bone w={80} h={12} style={{ marginBottom: 7 }} />
            <Bone w="100%" h={42} r={12} style={{ marginBottom: 12 }} />
            <Bone w={60} h={12} style={{ marginBottom: 7 }} />
            <View style={[s.catGrid, { marginBottom: 12 }]}>
              {[0, 1, 2].map(i => <Bone key={i} w={90} h={32} r={20} />)}
            </View>
            <Bone w={90} h={12} style={{ marginBottom: 7 }} />
            <Bone w="100%" h={80} r={12} />
          </View>

          <View style={s.section}>
            <View style={s.sectionHead}>
              <View style={[s.sectionIconBox, { backgroundColor: C.g50 }]} />
              <Bone w={100} h={14} />
            </View>
            <View style={s.rateGrid}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={s.rateField}>
                  <Bone w={90} h={12} style={{ marginBottom: 7 }} />
                  <Bone w="100%" h={42} r={12} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

      {/* Hero Header */}
      <LinearGradient colors={G.hero} style={s.hero}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.heroRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <View style={s.editBadgeRow}>
                <View style={s.editBadge}>
                  <Icon name="edit-2" size={11} color={C.amber} />
                  <Text style={s.editBadgeText}>Editing</Text>
                </View>
              </View>
              <Text style={s.heroTitle} numberOfLines={1}>{templateName}</Text>
              <Text style={s.heroSub}>Update template details</Text>
            </View>
            <View style={s.heroBadge}>
              <MaterialCommunityIcons name="car" size={20} color={C.g400} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <SectionCard icon="info" iconColor={C.indigo} iconBg={C.indigoL} title="Basic Information">
          <Text style={s.label}>Template Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Hatchback Daily Rental"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={s.label}>Category *</Text>
          <View style={s.catGrid}>
            {SELF_DRIVE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category === cat.id && s.catChipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={13}
                  color={category === cat.id ? '#fff' : C.sub}
                />
                <Text style={[s.catChipText, category === cat.id && s.catChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Description <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Brief description of this template..."
            placeholderTextColor={C.muted}
            value={description}
            onChangeText={setDescription}
            multiline numberOfLines={3}
          />
        </SectionCard>

        {/* Rate Hints */}
        <SectionCard icon="tag" iconColor={C.g700} iconBg={C.g50} title="Rate Hints">
          <Text style={s.sectionNote}>These are hints only — actual rates set while quoting</Text>
          <View style={s.rateGrid}>
            {[
              { label: 'Daily Rate (₹)',       val: dailyRate,       set: setDailyRate,       ph: '1200' },
              { label: 'KM Limit/Day',         val: kmLimit,         set: setKmLimit,         ph: '120'  },
              { label: 'Extra KM Rate (₹/km)', val: extraKmRate,     set: setExtraKmRate,     ph: '10'   },
              { label: 'Security Deposit (₹)', val: securityDeposit, set: setSecurityDeposit, ph: '3000' },
            ].map((f, i) => (
              <View key={i} style={s.rateField}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  placeholder={f.ph}
                  placeholderTextColor={C.muted}
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Inclusions */}
        <SectionCard icon="check-circle" iconColor={C.green} iconBg={C.greenL} title="Inclusions *">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add inclusion item..."
              placeholderTextColor={C.muted}
              value={newInclusion}
              onChangeText={setNewInclusion}
              onSubmitEditing={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.green }]}
              onPress={() => addItem(newInclusion, inclusions, setInclusions, setNewInclusion)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {inclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.greenL, borderColor: C.green + '40' }]}>
              <View style={[s.listDot, { backgroundColor: C.green }]}>
                <Icon name="check" size={11} color="#fff" />
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, inclusions, setInclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {inclusions.length === 0 && <Text style={s.emptyHint}>No inclusions added yet</Text>}
        </SectionCard>

        {/* Exclusions */}
        <SectionCard icon="x-circle" iconColor={C.red} iconBg={C.redL} title="Exclusions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add exclusion item..."
              placeholderTextColor={C.muted}
              value={newExclusion}
              onChangeText={setNewExclusion}
              onSubmitEditing={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.red }]}
              onPress={() => addItem(newExclusion, exclusions, setExclusions, setNewExclusion)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {exclusions.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.redL, borderColor: C.red + '30' }]}>
              <View style={[s.listDot, { backgroundColor: C.red }]}>
                <Icon name="x" size={11} color="#fff" />
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, exclusions, setExclusions)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {exclusions.length === 0 && <Text style={s.emptyHint}>No exclusions added yet</Text>}
        </SectionCard>

        {/* Terms */}
        <SectionCard icon="file-text" iconColor={C.indigo} iconBg={C.indigoL} title="Terms & Conditions">
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              placeholder="Add a term or condition..."
              placeholderTextColor={C.muted}
              value={newTerm}
              onChangeText={setNewTerm}
              onSubmitEditing={() => addItem(newTerm, terms, setTerms, setNewTerm)}
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: C.indigo }]}
              onPress={() => addItem(newTerm, terms, setTerms, setNewTerm)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {terms.map((item, i) => (
            <View key={i} style={[s.listItem, { backgroundColor: C.indigoL, borderColor: C.indigo + '30' }]}>
              <View style={s.termNumBox}>
                <Text style={s.termNumText}>{i + 1}</Text>
              </View>
              <Text style={s.listItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeItem(item, terms, setTerms)} style={s.removeBtn}>
                <Icon name="x" size={14} color={C.red} />
              </TouchableOpacity>
            </View>
          ))}
          {terms.length === 0 && <Text style={s.emptyHint}>No terms added yet</Text>}
        </SectionCard>

        {/* Settings */}
        <View style={s.section}>
          <TouchableOpacity style={s.checkRow} onPress={() => setIsDefault(!isDefault)} activeOpacity={0.7}>
            <View style={[s.checkbox, isDefault && s.checkboxOn]}>
              {isDefault && <Icon name="check" size={13} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.checkLabel}>Set as default template</Text>
              <Text style={s.checkSub}>Auto-selected when creating quotes for this category</Text>
            </View>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.checkRow} onPress={() => setIsActive(!isActive)} activeOpacity={0.7}>
            <View style={[s.checkbox, isActive && { backgroundColor: C.green, borderColor: C.green }]}>
              {isActive && <Icon name="check" size={13} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.checkLabel}>Template Active</Text>
              <Text style={s.checkSub}>Show this template in the list</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Icon name="save" size={18} color="#fff" />
          <Text style={s.submitBtnText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editBadgeRow: { marginBottom: 3 },
  editBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editBadgeText: { fontSize: 11, fontWeight: '700', color: C.amber },
  heroTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },


  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Section
  section: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconBox: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', color: C.text },
  sectionNote: { fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 17 },

  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 7 },
  optional: { fontWeight: '400', color: C.muted },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.text, backgroundColor: C.bg, marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: C.bg,
    borderWidth: 1.5, borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.g700, borderColor: C.g700 },
  catChipText: { fontSize: 14, fontWeight: '600', color: C.sub },
  catChipTextActive: { color: '#fff' },

  rateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  rateField: { width: '50%', paddingRight: 8 },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  addInput: { flex: 1, marginBottom: 0 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 10, marginBottom: 7, borderWidth: 1,
  },
  listDot: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  listItemText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 18 },
  removeBtn: { padding: 4 },
  termNumBox: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: C.indigo,
    justifyContent: 'center', alignItems: 'center',
  },
  termNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  emptyHint: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 8 },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  checkboxOn: { backgroundColor: C.g700, borderColor: C.g700 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  checkSub: { fontSize: 13, color: C.muted },

  // Footer
  footer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, gap: 12,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
  submitBtn: {
    flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: rs(14),
    backgroundColor: C.g700, alignItems: 'center', justifyContent: 'center', gap: 8,
    ...cardShadow,
  },
  submitBtnText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', color: '#fff' },
});
