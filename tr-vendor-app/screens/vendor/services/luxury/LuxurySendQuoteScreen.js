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
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, getFleetVehicles, submitQuote } from '../../../api/client';
import api from '../../../../lib/api';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#FF6B35',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

const DEFAULT_INCLUSIONS = [
  'Professional chauffeur service',
  'Fully air-conditioned luxury vehicle',
  'Complimentary water bottles',
  'Premium insurance coverage',
  'Vehicle sanitization before each trip',
  '24/7 customer support',
];

const DEFAULT_EXCLUSIONS = [
  'Toll charges',
  'Parking fees',
  'State tax/permit',
  'Waiting charges beyond included time',
  'Night charges (11 PM - 6 AM)',
];

const DEFAULT_TERMS = [
  'Booking confirmation subject to availability',
  'Advance payment required as per quote',
  'Cancellation charges apply as per policy',
  'Extra hours: ₹500-1000/hour depending on vehicle',
  'Extra KM charges as quoted',
  'Chauffeur allowance included in package',
];

export default function LuxurySendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Form state
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('200');
  const [extraKmRate, setExtraKmRate] = useState('20');
  const [advancePercent, setAdvancePercent] = useState('50');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('2');

  // Inclusions/Exclusions/Terms
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null);
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('luxury', requestId),
        getFleetVehicles(),
        api.get('/vendor/luxury-templates').catch(() => ({ data: { templates: [] } })),
      ]);
      setRequest(requestData.request || requestData);

      // Filter luxury fleet
      const luxuryFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) =>
          v.services?.slug === 'luxury-car-rental' ||
          v.services?.name?.toLowerCase().includes('luxury')
      );
      setFleetVehicles(luxuryFleet);

      // Set templates (only active ones)
      const activeTemplates = (templatesData.data?.templates || []).filter(t => t.isActive);
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Populate pricing fields from template
    setDailyRate(template.baseAmount?.toString() || '');
    setExtraKmRate(template.extraKmRate?.toString() || '20');
    setKmLimitPerDay(template.kmLimitPerDay?.toString() || '200');

    // Populate inclusions, exclusions, terms
    if (template.inclusions && template.inclusions.length > 0) {
      setInclusions([...template.inclusions]);
    }
    if (template.exclusions && template.exclusions.length > 0) {
      setExclusions([...template.exclusions]);
    }
    if (template.termsConditions && template.termsConditions.length > 0) {
      setTermsConditions([...template.termsConditions]);
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) {
      setVehicleName('');
      setVehicleBrand('');
      setRegistrationNumber('');
      return;
    }

    const selectedVehicle = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedVehicle) {
      let vName = '';
      let vBrand = '';
      if (selectedVehicle.vehicleModel) {
        vName = selectedVehicle.vehicle_models.name;
        vBrand = selectedVehicle.vehicle_models.brand?.name || '';
      } else if (selectedVehicle.vehicleCategory) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      if (selectedVehicle.brand) {
        vBrand = selectedVehicle.brands.name;
      }

      setVehicleName(vName);
      setVehicleBrand(vBrand);
      setRegistrationNumber(selectedVehicle.registrationNumber || '');
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

  const removeItemFromList = (item) => {
    setEditList(editList.filter((i) => i !== item));
  };

  const calculateTotal = () => {
    const rate = parseFloat(dailyRate) || 0;
    const days = request?.tripDays || request?.totalDays || 1;
    return rate * days;
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 50;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!vehicleName) {
      Alert.alert('Error', 'Please enter vehicle name or select from fleet');
      return;
    }
    if (!dailyRate || parseFloat(dailyRate) <= 0) {
      Alert.alert('Error', 'Please enter valid daily rate');
      return;
    }

    try {
      setSubmitting(true);
      await submitQuote('luxury', {
        requestId: requestId,
        fleetId: selectedFleetId || null,
        vehicleName: vehicleName,
        vehicleModel: vehicleBrand || null,
        vehicleCategory: request?.vehicleCategory || null,
        vehicleNumber: registrationNumber || null,
        baseAmount: parseFloat(dailyRate),
        includedKm: parseInt(kmLimitPerDay) || null,
        extraKmRate: parseFloat(extraKmRate) || null,
        advancePercent: parseInt(advancePercent),
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
        validityDays: parseInt(validityDays),
      });
      Alert.alert('Success', 'Quote sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error submitting quote:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Quote - Luxury</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Summary */}
        <View style={[styles.card, { backgroundColor: '#FFF4ED', borderColor: '#FFE4CC' }]}>
          <Text style={[styles.cardTitle, { color: '#C2410C' }]}>Request Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{request?.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{request?.location?.name || request?.pickupCity || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{request?.tripDays || request?.totalDays || 1} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dates:</Text>
            <Text style={styles.value}>
              {new Date(request?.pickupDate).toLocaleDateString()} -{' '}
              {new Date(request?.returnDate || request?.dropDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.cardTitle, { color: '#7C3AED' }]}>Quick Fill from Template</Text>
                <Text style={{ fontSize: 12, color: '#8B5CF6', marginTop: 4 }}>
                  Select a template to auto-fill pricing and details
                </Text>
              </View>
              <Icon name="zap" size={20} color="#7C3AED" />
            </View>

            <CustomDropdown
              label=""
              value={selectedTemplateId}
              items={[
                { label: '-- Select Template --', value: '' },
                ...templates.map((template) => ({
                  label: template.name,
                  value: template.id,
                })),
              ]}
              onValueChange={handleTemplateSelection}
              placeholder="-- Select Template --"
              searchable={templates.length > 5}
            />
          </View>
        )}

        {/* Fleet Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Details</Text>

          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((vehicle) => ({
                label: `${vehicle.vehicleModel?.name || vehicle.vehicleCategory?.name || 'Vehicle'} ${
                  vehicle.registrationNumber ? `(${vehicle.registrationNumber})` : ''
                }`,
                value: vehicle.id,
              })),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <Text style={styles.inputLabel}>Vehicle Name *</Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder="e.g., Mercedes E-Class"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
          />

          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
            placeholder="e.g., Mercedes-Benz"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
          />

          <Text style={styles.inputLabel}>Registration Number</Text>
          <TextInput
            style={styles.input}
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="e.g., DL 01 AB 1234"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
          />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing Details</Text>

          <Text style={styles.inputLabel}>Daily Rate (₹) *</Text>
          <TextInput
            style={styles.input}
            value={dailyRate}
            onChangeText={setDailyRate}
            placeholder="e.g., 8000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
          <TextInput
            style={styles.input}
            value={securityDeposit}
            onChangeText={setSecurityDeposit}
            placeholder="e.g., 10000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>KM Limit per Day</Text>
          <TextInput
            style={styles.input}
            value={kmLimitPerDay}
            onChangeText={setKmLimitPerDay}
            placeholder="e.g., 200"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Extra KM Rate (₹/km)</Text>
          <TextInput
            style={styles.input}
            value={extraKmRate}
            onChangeText={setExtraKmRate}
            placeholder="e.g., 20"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <CustomDropdown
            label="Advance Payment Required"
            value={advancePercent}
            items={[
              { label: '30%', value: '30' },
              { label: '40%', value: '40' },
              { label: '50%', value: '50' },
              { label: '100%', value: '100' },
            ]}
            onValueChange={setAdvancePercent}
            placeholder="Select advance %"
          />
        </View>

        {/* Quote Summary */}
        {dailyRate && parseFloat(dailyRate) > 0 && (
          <View style={[styles.card, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Text style={[styles.cardTitle, { color: '#0369A1' }]}>Quote Summary</Text>
            <View style={styles.row}>
              <Text style={styles.summaryLabel}>Total ({request?.tripDays || request?.totalDays || 1} days)</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Advance ({advancePercent}%)</Text>
              <Text style={styles.totalValue}>₹{advance.toFixed(0)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Balance on pickup</Text>
              <Text style={styles.value}>₹{(total - advance).toFixed(0)}</Text>
            </View>
            {securityDeposit && parseFloat(securityDeposit) > 0 && (
              <View style={[styles.row, { marginTop: 8 }]}>
                <Text style={styles.label}>Security Deposit (Refundable)</Text>
                <Text style={styles.value}>₹{parseFloat(securityDeposit).toFixed(0)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Inclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Inclusions ({inclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('inclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#D1FAE5' }]}>
                <Icon name="check-circle" size={14} color="#059669" />
                <Text style={[styles.chipText, { color: '#059669' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Exclusions ({exclusions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('exclusions')}>
              <Icon name="edit-2" size={18} color={C.brand} />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="x-circle" size={14} color="#DC2626" />
                <Text style={[styles.chipText, { color: '#DC2626' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
            <TouchableOpacity onPress={() => openEditModal('terms')}>
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

        {/* Additional Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Information</Text>

          <Text style={styles.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Quote Valid For (Days)</Text>
          <TextInput
            style={styles.input}
            value={validityDays}
            onChangeText={setValidityDays}
            placeholder="2"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                Send Quote (₹{total.toFixed(0)})
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity onPress={() => removeItemFromList(item)}>
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
              <TouchableOpacity style={styles.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: C.muted,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
    marginTop: 8,
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
  textArea: {
    height: 80,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.brand,
  },
  chipContainer: {
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
  },
  footer: {
    padding: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
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
