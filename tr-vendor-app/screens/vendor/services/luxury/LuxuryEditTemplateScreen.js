import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdown from '../../../../components/CustomDropdown';
import api from '../../../../lib/api';
import { showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#A855F7',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

const VEHICLE_CATEGORIES = [
  { label: 'Luxury Sedan', value: 'luxury_sedan' },
  { label: 'Luxury SUV', value: 'luxury_suv' },
  { label: 'Premium Sedan', value: 'premium_sedan' },
  { label: 'Premium SUV', value: 'premium_suv' },
  { label: 'Vintage Car', value: 'vintage' },
  { label: 'Sports Car', value: 'sports' },
  { label: 'Limousine', value: 'limousine' },
  { label: 'Convertible', value: 'convertible' },
];

const TRIP_TYPES = [
  { id: 'local', name: 'Local' },
  { id: 'outstation', name: 'Outstation' },
  { id: 'airport', name: 'Airport Transfer' },
];

const OCCASIONS = [
  { id: 'wedding', name: 'Wedding' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'personal', name: 'Personal' },
  { id: 'airport', name: 'Airport' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'birthday', name: 'Birthday' },
];

const DEFAULT_INCLUSIONS = [
  'Professional Chauffeur',
  'Fuel Charges',
  'Vehicle Insurance',
  'Air Conditioning',
  'Bottled Water',
];

const DEFAULT_EXCLUSIONS = [
  'Toll Charges',
  'Parking Charges',
  'Night Halt Charges',
  'Extra Hours/Km',
];

const DEFAULT_TERMS = [
  'Advance payment is non-refundable',
  'Cancellation charges apply as per policy',
  'Driver allowance for outstation trips',
  'Vehicle will be provided as per availability',
];

export default function LuxuryEditTemplateScreen({ navigation, route }) {
  const { templateId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('luxury_sedan');
  const [baseAmount, setBaseAmount] = useState('');
  const [chauffeurCharges, setChauffeurCharges] = useState('');
  const [decorationCharges, setDecorationCharges] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [perHourRate, setPerHourRate] = useState('');
  const [includedKm, setIncludedKm] = useState('');
  const [includedHours, setIncludedHours] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [extraHourRate, setExtraHourRate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Multi-select
  const [tripTypes, setTripTypes] = useState(['local', 'outstation', 'airport']);
  const [occasions, setOccasions] = useState(['wedding', 'corporate', 'personal']);

  // Lists
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'inclusions', 'exclusions', 'terms'
  const [modalList, setModalList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  const toggleTripType = (id) => {
    setTripTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleOccasion = (id) => {
    setOccasions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const openModal = (type) => {
    setModalType(type);
    if (type === 'inclusions') setModalList([...inclusions]);
    else if (type === 'exclusions') setModalList([...exclusions]);
    else if (type === 'terms') setModalList([...termsConditions]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalList([]);
    setNewItemText('');
  };

  const saveModal = () => {
    if (modalType === 'inclusions') setInclusions([...modalList]);
    else if (modalType === 'exclusions') setExclusions([...modalList]);
    else if (modalType === 'terms') setTermsConditions([...modalList]);
    closeModal();
  };

  const addItemToModal = () => {
    if (newItemText.trim() && !modalList.includes(newItemText.trim())) {
      setModalList([...modalList, newItemText.trim()]);
      setNewItemText('');
    }
  };

  const removeItemFromModal = (item) => {
    setModalList(modalList.filter(i => i !== item));
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    if (!templateId) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/vendor/luxury-templates/${templateId}`);

      if (response.data.success) {
        const template = response.data.template;
        setName(template.name || '');
        setCategory(template.category || 'luxury_sedan');
        setBaseAmount(String(template.baseAmount || ''));
        setChauffeurCharges(String(template.chauffeurCharges || ''));
        setDecorationCharges(String(template.decorationCharges || ''));
        setPerKmRate(template.perKmRate ? String(template.perKmRate) : '');
        setPerHourRate(template.perHourRate ? String(template.perHourRate) : '');
        setIncludedKm(template.includedKm ? String(template.includedKm) : '');
        setIncludedHours(template.includedHours ? String(template.includedHours) : '');
        setExtraKmRate(template.extraKmRate ? String(template.extraKmRate) : '');
        setExtraHourRate(template.extraHourRate ? String(template.extraHourRate) : '');
        setTripTypes(template.tripTypes || []);
        setOccasions(template.occasions || []);
        setInclusions(template.inclusions || [...DEFAULT_INCLUSIONS]);
        setExclusions(template.exclusions || [...DEFAULT_EXCLUSIONS]);
        setTermsConditions(template.termsConditions || [...DEFAULT_TERMS]);
        setIsActive(template.isActive !== false);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      showConfirm('Error', 'Failed to load template', () => navigation.goBack(), { confirmText: 'OK' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !baseAmount) {
      showError('Template Name and Base Amount are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        category,
        baseAmount: parseFloat(baseAmount) || 0,
        chauffeurCharges: parseFloat(chauffeurCharges) || 0,
        decorationCharges: parseFloat(decorationCharges) || 0,
        perKmRate: perKmRate ? parseFloat(perKmRate) : null,
        perHourRate: perHourRate ? parseFloat(perHourRate) : null,
        includedKm: includedKm ? parseInt(includedKm) : null,
        includedHours: includedHours ? parseInt(includedHours) : null,
        extraKmRate: extraKmRate ? parseFloat(extraKmRate) : null,
        extraHourRate: extraHourRate ? parseFloat(extraHourRate) : null,
        inclusions,
        exclusions,
        termsConditions,
        tripTypes,
        occasions,
        isActive,
      };

      const response = await api.patch(`/vendor/luxury-templates/${templateId}`, payload);

      if (response.data.success) {
        showConfirm('Success', 'Template updated successfully!', () => navigation.goBack(), { confirmText: 'OK' });
      } else {
        showError(response.data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      showError(error?.response?.data?.error || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const getModalTitle = () => {
    if (modalType === 'inclusions') return 'Edit Inclusions';
    if (modalType === 'exclusions') return 'Edit Exclusions';
    if (modalType === 'terms') return 'Edit Terms & Conditions';
    return '';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading template...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Template</Text>
          <Text style={styles.headerSubtitle}>Luxury Car Rental</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>

          <Text style={styles.label}>Template Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Wedding Premium Package"
            placeholderTextColor={C.muted}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Vehicle Category *</Text>
          <CustomDropdown
            value={category}
            items={VEHICLE_CATEGORIES}
            onValueChange={setCategory}
            placeholder="Select Category"
          />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing Details</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Base Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                value={baseAmount}
                onChangeText={setBaseAmount}
                placeholder="15000"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Chauffeur (₹)</Text>
              <TextInput
                style={styles.input}
                value={chauffeurCharges}
                onChangeText={setChauffeurCharges}
                placeholder="2000"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Decoration (₹)</Text>
              <TextInput
                style={styles.input}
                value={decorationCharges}
                onChangeText={setDecorationCharges}
                placeholder="3000"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Extra Km Rate (₹)</Text>
              <TextInput
                style={styles.input}
                value={extraKmRate}
                onChangeText={setExtraKmRate}
                placeholder="50"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Included Km</Text>
              <TextInput
                style={styles.input}
                value={includedKm}
                onChangeText={setIncludedKm}
                placeholder="100"
                keyboardType="number-pad"
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Extra Hour Rate (₹)</Text>
              <TextInput
                style={styles.input}
                value={extraHourRate}
                onChangeText={setExtraHourRate}
                placeholder="500"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </View>
          </View>

          <Text style={styles.label}>Included Hours</Text>
          <TextInput
            style={styles.input}
            value={includedHours}
            onChangeText={setIncludedHours}
            placeholder="8"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />
        </View>

        {/* Trip Types */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Applicable Trip Types</Text>
          <View style={styles.checkboxContainer}>
            {TRIP_TYPES.map((tt) => (
              <TouchableOpacity
                key={tt.id}
                style={[
                  styles.checkbox,
                  tripTypes.includes(tt.id) && styles.checkboxActive,
                ]}
                onPress={() => toggleTripType(tt.id)}
              >
                <Ionicons
                  name={tripTypes.includes(tt.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={tripTypes.includes(tt.id) ? C.brand : C.muted}
                />
                <Text
                  style={[
                    styles.checkboxText,
                    tripTypes.includes(tt.id) && styles.checkboxTextActive,
                  ]}
                >
                  {tt.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Occasions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Applicable Occasions</Text>
          <View style={styles.checkboxContainer}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                style={[
                  styles.checkbox,
                  occasions.includes(occ.id) && styles.checkboxActive,
                ]}
                onPress={() => toggleOccasion(occ.id)}
              >
                <Ionicons
                  name={occasions.includes(occ.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={occasions.includes(occ.id) ? C.brand : C.muted}
                />
                <Text
                  style={[
                    styles.checkboxText,
                    occasions.includes(occ.id) && styles.checkboxTextActive,
                  ]}
                >
                  {occ.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Inclusions ({inclusions.length})</Text>
            <TouchableOpacity onPress={() => openModal('inclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipsContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check" size={12} color={C.green} />
                <Text style={[styles.chipText, { color: C.green }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exclusions ({exclusions.length})</Text>
            <TouchableOpacity onPress={() => openModal('exclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipsContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="x" size={12} color={C.red} />
                <Text style={[styles.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            <TouchableOpacity onPress={() => openModal('terms')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={styles.termRow}>
              <Text style={styles.termNumber}>{idx + 1}.</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Active Status */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsActive(!isActive)}
          >
            <View>
              <Text style={styles.toggleLabel}>Template is Active</Text>
              <Text style={styles.toggleDesc}>
                {isActive ? 'Template will be available for use' : 'Template will be hidden'}
              </Text>
            </View>
            <Ionicons
              name={isActive ? 'toggle' : 'toggle-outline'}
              size={40}
              color={isActive ? C.green : C.muted}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="save" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Update Template</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {modalList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromModal(item)}>
                    <Icon name="trash-2" size={18} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalAddSection}>
              <TextInput
                style={styles.modalInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Add new item..."
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity style={styles.modalAddBtn} onPress={addItemToModal}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveModal}>
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  col: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  checkboxActive: {
    backgroundColor: '#F3E8FF',
    borderColor: C.brand,
  },
  checkboxText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
  },
  checkboxTextActive: {
    color: C.brand,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  termNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: C.brand,
    marginRight: 8,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: C.brand,
    borderRadius: 10,
    shadowColor: C.brand,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },
  modalAddSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  modalAddBtn: {
    backgroundColor: C.brand,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtn: {
    backgroundColor: C.brand,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
