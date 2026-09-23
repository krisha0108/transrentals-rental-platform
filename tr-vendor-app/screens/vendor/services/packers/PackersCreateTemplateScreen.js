import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Switch, StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { createTemplate } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  red: T.red, redL: T.redLight,
};

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

const SHIFTING_CATEGORIES = [
  { label: 'Local Shifting', value: 'local_shifting' },
  { label: 'Intercity Shifting', value: 'intercity_shifting' },
  { label: 'Domestic Relocation', value: 'domestic_relocation' },
  { label: 'Office Shifting', value: 'office_shifting' },
  { label: 'Vehicle Transportation', value: 'vehicle_transportation' },
  { label: 'Warehouse Shifting', value: 'warehouse_shifting' },
];

const SHIFTING_TYPE_OPTIONS = [
  'Home Shifting', 'Office Relocation', 'Vehicle Transport', 'Furniture Shifting',
  'Warehouse Goods', 'Fragile Items', 'Electronics', 'Complete Packing',
];

const DEFAULT_INCLUSIONS = [
  'Professional packing team', 'Quality packing materials',
  'Loading & unloading', 'Transportation', 'Unpacking', 'Basic transit insurance',
];

const DEFAULT_EXCLUSIONS = [
  'Toll & parking charges', 'Goods above ₹50,000 need separate insurance',
  'Disassembly/reassembly of furniture', 'Storage charges', 'Weekend/holiday surcharge',
];

const DEFAULT_TERMS = [
  'Advance payment required to confirm booking',
  'Fragile items must be declared before packing',
  'Customer must be present during packing/unpacking',
  'Transit time subject to road conditions',
  'Insurance claim within 7 days of delivery',
];

export default function PackersCreateTemplateScreen({ navigation }) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedShiftingTypes, setSelectedShiftingTypes] = useState([]);
  const [baseRateHint, setBaseRateHint] = useState('');
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [isActive, setIsActive] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 350);
    return () => clearTimeout(t);
  }, []);

  const toggleShiftingType = (type) => {
    setSelectedShiftingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
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
      await createTemplate('packers', {
        name: name.trim(),
        category,
        description: description.trim() || null,
        shiftingTypes: selectedShiftingTypes,
        inclusions,
        exclusions,
        termsConditions,
        baseRateHint: baseRateHint ? parseFloat(baseRateHint) : null,
        isActive,
      });
      showSuccess('Template created successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />

        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroMin}>
          <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
            <View style={s.topBar}>
              <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={s.titleWrap}>
                <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
                <Text style={s.heroTitle}>Create Template</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
            <Text style={s.heroSub}>Packers & Movers</Text>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.g50 }]} />
              <Bone w={130} h={14} />
            </View>
            <Bone w={90} h={11} style={{ marginBottom: 8 }} />
            <Bone w="100%" h={44} r={10} style={{ marginBottom: 14 }} />
            <Bone w={110} h={11} style={{ marginBottom: 8 }} />
            <Bone w="100%" h={44} r={10} style={{ marginBottom: 14 }} />
            <Bone w={80} h={11} style={{ marginBottom: 8 }} />
            <Bone w="100%" h={70} r={10} />
          </View>

          <View style={s.card}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: '#FEF3C7' }]} />
              <Bone w={120} h={14} />
            </View>
            <Bone w={160} h={11} style={{ marginBottom: 10 }} />
            <View style={s.checkboxGrid}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={s.checkbox}>
                  <Bone w={22} h={22} r={6} />
                  <Bone w={100} h={13} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroMin}>
        <CornerGrid style={s.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={s.titleWrap}>
              <MaterialCommunityIcons name="truck-delivery" size={18} color={C.g400} />
              <Text style={s.heroTitle}>Create Template</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
          <Text style={s.heroSub}>Packers & Movers</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
              <Icon name="file-text" size={16} color={C.g600} />
            </View>
            <Text style={s.cardTitle}>Basic Information</Text>
          </View>

          <Text style={s.inputLabel}>Template Name *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Standard Home Shifting Package"
            placeholderTextColor={C.muted}
          />

          <CustomDropdown
            label="Shifting Category *"
            value={category}
            items={SHIFTING_CATEGORIES}
            onValueChange={setCategory}
            placeholder="Select category"
          />

          <Text style={s.inputLabel}>Description</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of this template..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Shifting Types */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="home-switch-outline" size={16} color="#D97706" />
            </View>
            <Text style={s.cardTitle}>Shifting Types</Text>
          </View>
          <Text style={s.hint}>Select applicable shifting types for this template</Text>
          <View style={s.checkboxGrid}>
            {SHIFTING_TYPE_OPTIONS.map((type) => (
              <TouchableOpacity key={type} style={s.checkbox} onPress={() => toggleShiftingType(type)}>
                <View style={[s.checkboxBox, selectedShiftingTypes.includes(type) && s.checkboxBoxChecked]}>
                  {selectedShiftingTypes.includes(type) && <Icon name="check" size={12} color="#fff" />}
                </View>
                <Text style={s.checkboxLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing Hints */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={[s.cardIcon, { backgroundColor: C.g50 }]}>
              <Icon name="tag" size={16} color={C.g600} />
            </View>
            <Text style={s.cardTitle}>Pricing Hint (Optional)</Text>
          </View>
          <Text style={s.hint}>Suggested base rate to help you quote faster</Text>
          <Text style={s.inputLabel}>Base Rate Hint (₹)</Text>
          <TextInput
            style={s.input}
            value={baseRateHint}
            onChangeText={setBaseRateHint}
            placeholder="e.g., 8000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />
        </View>

        {/* Inclusions */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check-circle" size={16} color="#16A34A" />
              </View>
              <Text style={s.cardTitle}>Inclusions ({inclusions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check" size={12} color="#16A34A" />
                <Text style={[s.chipTxt, { color: '#166534' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.redL }]}>
                <Icon name="x-circle" size={16} color={C.red} />
              </View>
              <Text style={s.cardTitle}>Exclusions ({exclusions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          <View style={s.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[s.chip, { backgroundColor: C.redL }]}>
                <Icon name="x" size={12} color={C.red} />
                <Text style={[s.chipTxt, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms */}
        <View style={s.card}>
          <View style={s.cardTitleRowSpaced}>
            <View style={s.cardTitleRow}>
              <View style={[s.cardIcon, { backgroundColor: C.blueL }]}>
                <Icon name="file-text" size={16} color={C.blue} />
              </View>
              <Text style={s.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('terms')}>
              <Icon name="edit-2" size={18} color={C.g600} />
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={s.termRow}>
              <Text style={s.termNum}>{idx + 1}.</Text>
              <Text style={s.termTxt}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Active Status */}
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Active Status</Text>
              <Text style={s.hint}>{isActive ? 'Template is active and can be used' : 'Template is inactive'}</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: C.border, true: C.g100 }}
              thumbColor={isActive ? C.g600 : C.muted}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Icon name="check" size={18} color="#fff" />
              <Text style={s.submitBtnTxt}>Create Template</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300, paddingHorizontal: 20 }}>
              {editList.map((item, idx) => (
                <View key={idx} style={s.modalItem}>
                  <Text style={s.modalItemTxt}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}>
                    <Icon name="trash-2" size={18} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={s.modalAddRow}>
              <TextInput
                style={s.modalInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Add new item..."
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={s.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.modalSaveBtn} onPress={saveEditModal}>
              <Text style={s.modalSaveBtnTxt}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  heroMin: {
    paddingHorizontal: 16, paddingBottom: 16, overflow: 'hidden',
    borderBottomLeftRadius: rs(20), borderBottomRightRadius: rs(20),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitleRowSpaced: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },

  hint: { fontSize: 14, color: C.muted, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  textArea: { height: 80 },

  checkboxGrid: { gap: 4 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkboxBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxBoxChecked: { backgroundColor: C.g600, borderColor: C.g600 },
  checkboxLabel: { fontSize: 14, color: C.text },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipTxt: { fontSize: 13, fontWeight: '600' },

  termRow: { flexDirection: 'row', marginBottom: 8 },
  termNum: { fontSize: 14, fontWeight: '700', color: C.g600, marginRight: 8, width: 18 },
  termTxt: { flex: 1, fontSize: 14, color: C.sub, lineHeight: 20 },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  footer: {
    padding: 16, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...cardShadow,
  },
  submitBtn: { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: rs(12) },
  submitBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: T.scrim, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), paddingBottom: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: C.text },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: C.bg, borderRadius: 10, marginBottom: 8 },
  modalItemTxt: { flex: 1, fontSize: 14, color: C.text },
  modalAddRow: { flexDirection: 'row', gap: 10, margin: 20 },
  modalInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14, color: C.text },
  modalAddBtn: { backgroundColor: C.g600, width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn: { backgroundColor: C.g600, marginHorizontal: 20, paddingVertical: 14, borderRadius: rs(12), alignItems: 'center' },
  modalSaveBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },
});
