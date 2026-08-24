import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getTemplateById, updateTemplate } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import AnimatedOrb from '../../_shared/AnimatedOrb';

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  red: T.red, redL: T.redLight,
};

const EQUIPMENT_CATEGORIES = [
  { label: 'Construction Equipment', value: 'construction' },
  { label: 'Material Handling', value: 'material_handling' },
  { label: 'Power Tools & Generators', value: 'power_tools' },
  { label: 'Event Equipment', value: 'event' },
  { label: 'Industrial Machinery', value: 'industrial' },
  { label: 'Specialized Equipment', value: 'specialized' },
];

const EQUIPMENT_TYPE_OPTIONS = [
  'JCB / Excavator', 'Crane', 'Forklift', 'Scaffolding',
  'Generator', 'Concrete Mixer', 'Compactor', 'Tower Light',
];

const DEFAULT_INCLUSIONS = [
  'Equipment in working condition',
  'Trained operator (if required)',
  'Basic safety equipment',
  'Maintenance during rental period',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel/diesel charges',
  'Operator accommodation & meals',
  'Damage due to misuse',
];

const DEFAULT_TERMS = [
  'Advance payment required to confirm booking',
  'Security deposit refundable after inspection',
  'Equipment must be used by trained personnel only',
  'Minimum rental: 8 hours/day',
];

export default function EquipmentEditTemplateScreen({ navigation, route }) {
  const { templateId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState([]);
  const [dailyRateHint, setDailyRateHint] = useState('');
  const [weeklyRateHint, setWeeklyRateHint] = useState('');
  const [monthlyRateHint, setMonthlyRateHint] = useState('');
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [isActive, setIsActive] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (!templateId) { showError('Template ID not found'); navigation.goBack(); return; }
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await getTemplateById('equipment', templateId);
      const t = data.template || data;
      setName(t.name || '');
      setCategory(t.category || '');
      setDescription(t.description || '');
      setSelectedEquipmentTypes(t.equipmentTypes || []);
      setDailyRateHint(t.dailyRateHint ? t.dailyRateHint.toString() : '');
      setWeeklyRateHint(t.weeklyRateHint ? t.weeklyRateHint.toString() : '');
      setMonthlyRateHint(t.monthlyRateHint ? t.monthlyRateHint.toString() : '');
      setInclusions(t.inclusions || [...DEFAULT_INCLUSIONS]);
      setExclusions(t.exclusions || [...DEFAULT_EXCLUSIONS]);
      setTermsConditions(t.termsConditions || [...DEFAULT_TERMS]);
      setIsActive(t.isActive !== undefined ? t.isActive : true);
    } catch (error) {
      showError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipmentType = (type) => {
    if (selectedEquipmentTypes.includes(type)) {
      setSelectedEquipmentTypes(selectedEquipmentTypes.filter(t => t !== type));
    } else {
      setSelectedEquipmentTypes([...selectedEquipmentTypes, type]);
    }
  };

  const openEditModal = (type) => {
    setEditType(type);
    if (type === 'inclusions') setEditList([...inclusions]);
    else if (type === 'exclusions') setEditList([...exclusions]);
    else if (type === 'terms') setEditList([...termsConditions]);
    setEditModalVisible(true);
  };

  const saveEditModal = () => {
    if (editType === 'inclusions') setInclusions([...editList]);
    else if (editType === 'exclusions') setExclusions([...editList]);
    else if (editType === 'terms') setTermsConditions([...editList]);
    setEditModalVisible(false);
    setEditList([]);
    setNewItemText('');
  };

  const addItemToList = () => {
    if (newItemText.trim() && !editList.includes(newItemText.trim())) {
      setEditList([...editList, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const removeItemFromList = (item) => setEditList(editList.filter((i) => i !== item));

  const handleSubmit = async () => {
    if (!name.trim()) { showError('Please enter template name'); return; }
    if (!category) { showError('Please select a category'); return; }
    if (inclusions.length === 0) { showError('Please add at least one inclusion'); return; }

    try {
      setSubmitting(true);
      await updateTemplate('equipment', templateId, {
        name: name.trim(),
        category,
        description: description.trim() || null,
        equipmentTypes: selectedEquipmentTypes,
        inclusions,
        exclusions,
        termsConditions,
        dailyRateHint: dailyRateHint ? parseFloat(dailyRateHint) : null,
        weeklyRateHint: weeklyRateHint ? parseFloat(weeklyRateHint) : null,
        monthlyRateHint: monthlyRateHint ? parseFloat(monthlyRateHint) : null,
        isActive,
      });
      showSuccess('Template updated successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={s.heroMin}>
          <SafeAreaView edges={['top']}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={s.heroTitle}>Edit Template</Text>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={s.loadingText}>Loading template...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      <LinearGradient
        colors={G.hero}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={s.heroTitle}>Edit Template</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={s.heroSub}>Equipment Rental</Text>
      </LinearGradient>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Basic Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Basic Information</Text>

          <Text style={s.inputLabel}>Template Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g., Standard Crane Package" placeholderTextColor={C.muted} />

          <CustomDropdown
            label="Equipment Category *"
            value={category}
            items={EQUIPMENT_CATEGORIES}
            onValueChange={setCategory}
            placeholder="Select category"
          />

          <Text style={s.inputLabel}>Description</Text>
          <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} placeholder="Brief description of this template..." placeholderTextColor={C.muted} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* Equipment Types */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Equipment Types</Text>
          <Text style={s.cardSubtitle}>Select applicable equipment types</Text>
          <View style={s.checkboxGrid}>
            {EQUIPMENT_TYPE_OPTIONS.map((type) => (
              <TouchableOpacity key={type} style={s.checkbox} onPress={() => toggleEquipmentType(type)}>
                <View style={[s.checkboxBox, selectedEquipmentTypes.includes(type) && s.checkboxBoxChecked]}>
                  {selectedEquipmentTypes.includes(type) && <Icon name="check" size={12} color="#fff" />}
                </View>
                <Text style={s.checkboxLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Pricing Hints (Optional)</Text>
          <Text style={s.cardSubtitle}>Suggested rates to help you quote faster</Text>

          <Text style={s.inputLabel}>Daily Rate Hint (₹)</Text>
          <TextInput style={s.input} value={dailyRateHint} onChangeText={setDailyRateHint} placeholder="e.g., 2500" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Weekly Rate Hint (₹)</Text>
          <TextInput style={s.input} value={weeklyRateHint} onChangeText={setWeeklyRateHint} placeholder="e.g., 15000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

          <Text style={s.inputLabel}>Monthly Rate Hint (₹)</Text>
          <TextInput style={s.input} value={monthlyRateHint} onChangeText={setMonthlyRateHint} placeholder="e.g., 50000" keyboardType="decimal-pad" placeholderTextColor={C.muted} />
        </View>

        {/* Inclusions */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Inclusions ({inclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.g50 }]}>
                <Icon name="check-circle" size={12} color={C.g600} />
                <Text style={[s.chipText, { color: C.g700 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Exclusions ({exclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.redL }]}>
                <Icon name="x-circle" size={12} color={C.red} />
                <Text style={[s.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('terms')}><Icon name="edit-2" size={16} color={C.g600} /></TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={s.termRow}>
              <Text style={s.termNum}>{idx + 1}.</Text>
              <Text style={s.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Active Status */}
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Active Status</Text>
              <Text style={s.cardSubtitle}>{isActive ? 'Template is active and can be used' : 'Template is inactive'}</Text>
            </View>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: C.border, true: C.g400 }} thumbColor={isActive ? C.g600 : C.muted} />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
            <><Icon name="check" size={18} color="#fff" /><Text style={s.submitBtnTxt}>Update Template</Text></>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Icon name="x" size={22} color={C.text} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {editList.map((item, idx) => (
                <View key={idx} style={s.modalItem}>
                  <Text style={s.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}><Icon name="trash-2" size={16} color={C.red} /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={s.modalAddRow}>
              <TextInput style={s.modalInput} value={newItemText} onChangeText={setNewItemText} placeholder="Add new item..." placeholderTextColor={C.muted} />
              <TouchableOpacity style={s.modalAddBtn} onPress={addItemToList}><Icon name="plus" size={18} color="#fff" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveEditModal}>
              <Text style={s.modalSaveTxt}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.muted },

  hero: { paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden', borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20) },
  heroMin: { paddingHorizontal: 16, paddingBottom: 16 },
  deco1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)' },
  deco2: { position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 20 },

  card: { backgroundColor: C.card, borderRadius: rs(16), padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, ...cardShadow },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: C.muted, marginBottom: 12 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  textArea: { height: 80 },

  checkboxGrid: { gap: 8 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkboxBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxBoxChecked: { backgroundColor: C.g600, borderColor: C.g600 },
  checkboxLabel: { fontSize: 14, color: C.text },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  chipText: { fontSize: 11, fontWeight: '600' },

  termRow: { flexDirection: 'row', marginBottom: 8 },
  termNum: { fontSize: 13, fontWeight: '700', color: C.g600, marginRight: 6, width: 18 },
  termText: { flex: 1, fontSize: 13, color: C.sub, lineHeight: 18 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  footer: { padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, ...cardShadow },
  submitBtn: { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: rs(12) },
  submitBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.card, borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '800', color: C.text },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: C.bg, borderRadius: 8, marginBottom: 8 },
  modalItemText: { flex: 1, fontSize: 14, color: C.text },
  modalAddRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  modalInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, fontSize: 14, color: C.text },
  modalAddBtn: { backgroundColor: C.g600, width: 46, height: 46, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn: { backgroundColor: C.g600, paddingVertical: 14, borderRadius: rs(12), alignItems: 'center' },
  modalSaveTxt: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: '#fff' },
});
