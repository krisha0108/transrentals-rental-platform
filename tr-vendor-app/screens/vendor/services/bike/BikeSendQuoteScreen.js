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
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates, getTemplateById } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';

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
  'Bike with full tank',
  'Helmet(s) included',
  'Valid insurance',
  'Basic maintenance during rental',
  'Roadside assistance',
];

const DEFAULT_EXCLUSIONS = [
  'Fuel charges',
  'Traffic challans/fines',
  'Damage due to misuse',
  'Personal accident coverage',
];

const DEFAULT_TERMS = [
  'Valid driving license required',
  'Security deposit refundable after inspection',
  'No off-road or racing use',
  'Late return charges apply',
];

export default function BikeSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  // Form state
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleImages, setVehicleImages] = useState(null);
  const [totalPrice, setTotalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [helmetsIncluded, setHelmetsIncluded] = useState('1');
  const [kmLimitPerDay, setKmLimitPerDay] = useState('100');
  const [extraKmRate, setExtraKmRate] = useState('10');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');

  // Inclusions/Exclusions/Terms
  const [inclusions, setInclusions] = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions, setExclusions] = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions, setTermsConditions] = useState([...DEFAULT_TERMS]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null); // 'inclusions', 'exclusions', 'terms'
  const [editList, setEditList] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('bike', requestId),
        getFleetVehicles(),
        getTemplates('bike', { isActive: true }),
      ]);
      setRequest(requestData.request || requestData);

      // Filter bike fleet
      const bikeFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) =>
          v.services?.slug === 'bike-on-rent' ||
          v.services?.name?.toLowerCase().includes('bike')
      );
      console.log('[Bike Send Quote] Total fleet:', fleetsData.fleet?.length || 0);
      console.log('[Bike Send Quote] Filtered bike fleet:', bikeFleet.length);
      setFleetVehicles(bikeFleet);

      // Handle templates data - ensure it's an array
      console.log('[Bike Send Quote] Templates data:', templatesData);
      if (Array.isArray(templatesData)) {
        setTemplates(templatesData);
      } else if (templatesData && Array.isArray(templatesData.templates)) {
        setTemplates(templatesData.templates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTemplates([]); // Ensure templates is always an array
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) {
      // Manual entry - clear fields
      setVehicleName('');
      setVehicleBrand('');
      setRegistrationNumber('');
      setVehicleImages(null);
      return;
    }

    const selectedVehicle = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedVehicle) {
      let vName = '';
      let vBrand = '';
      // API returns vehicle_models (with underscore), not vehicleModel
      if (selectedVehicle.vehicle_models) {
        vName = selectedVehicle.vehicle_models.name;
        vBrand = selectedVehicle.vehicle_models.brands?.name || '';
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        vName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      // brands field (plural) for direct brand relation
      if (selectedVehicle.brands) {
        vBrand = selectedVehicle.brands.name;
      }

      setVehicleName(vName);
      setVehicleBrand(vBrand);
      setRegistrationNumber(selectedVehicle.registrationNumber || '');

      // Extract vehicle images
      setVehicleImages(selectedVehicle.images || null);
      console.log('[Bike Send Quote] Selected vehicle images:', selectedVehicle.images);
    }
  };

  const handleTemplateSelection = async (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    try {
      const template = await getTemplateById('bike', templateId);

      // Auto-fill form fields from template
      if (template.dailyRateHint) {
        // Template has daily rate hint, calculate total from it
        const days = request?.totalDays || 1;
        const estimatedTotal = template.dailyRateHint * days;
        setTotalPrice(estimatedTotal.toString());
      }
      if (template.securityDepositHint) setSecurityDeposit(template.securityDepositHint.toString());
      if (template.inclusions && template.inclusions.length > 0) setInclusions([...template.inclusions]);
      if (template.exclusions && template.exclusions.length > 0) setExclusions([...template.exclusions]);
      if (template.termsConditions && template.termsConditions.length > 0) setTermsConditions([...template.termsConditions]);

      showSuccess('Template applied successfully!');
    } catch (error) {
      console.error('Error loading template:', error);
      showError('Failed to load template details');
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

  const calculateDailyRate = () => {
    const total = parseFloat(totalPrice) || 0;
    const days = request?.totalDays || 1;
    return total / days;
  };

  const calculateAdvance = () => {
    const total = parseFloat(totalPrice) || 0;
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!vehicleName.trim()) newErrors.vehicleName = 'Vehicle name is required';
    if (!totalPrice || parseFloat(totalPrice) <= 0) newErrors.totalPrice = 'Enter a valid total price';
    if (!validityDays || parseInt(validityDays) <= 0) newErrors.validityDays = 'Validity must be at least 1 day';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const calculatedDailyRate = calculateDailyRate();
      await submitQuote('bike', {
        requestId: requestId,
        vendorFleetId: selectedFleetId || null,
        vehicleName: vehicleName,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: request?.vehicleCategory || null,
        registrationNumber: registrationNumber || null,
        vehicleImages: vehicleImages || null,
        dailyRate: calculatedDailyRate,
        totalPrice: parseFloat(totalPrice),
        securityDeposit: parseFloat(securityDeposit) || 0,
        helmetsIncluded: parseInt(helmetsIncluded) || 1,
        kmLimitPerDay: parseInt(kmLimitPerDay) || null,
        extraKmCharge: parseFloat(extraKmRate) || null,
        advancePercent: parseInt(advancePercent),
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
        validityDays: parseInt(validityDays),
      });
      showConfirm('Success', 'Quote sent successfully!', () => navigation.goBack(), { confirmText: 'OK' });
    } catch (error) {
      console.error('Error submitting quote:', error);
      showError(error?.response?.data?.error || 'Failed to send quote');
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

  const total = parseFloat(totalPrice) || 0;
  const advance = calculateAdvance();
  const dailyRate = calculateDailyRate();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Quote - Bike</Text>
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
            <Text style={styles.value}>{request?.locationName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{request?.totalDays} days</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dates:</Text>
            <Text style={styles.value}>
              {new Date(request?.pickupDate).toLocaleDateString()} -{' '}
              {new Date(request?.dropDate).toLocaleDateString()}
            </Text>
          </View>
          {request?.helmetsRequired > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Helmets:</Text>
              <Text style={styles.value}>{request?.helmetsRequired} required</Text>
            </View>
          )}
        </View>

        {/* Template Selector */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon name="zap" size={18} color="#EA580C" style={{ marginRight: 6 }} />
                  <Text style={[styles.cardTitle, { color: '#C2410C' }]}>Quick Fill with Template</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#9A3412' }}>
                  Load saved template to auto-fill rates, inclusions, exclusions & terms
                </Text>
              </View>
            </View>
            <CustomDropdown
              label=""
              value={selectedTemplateId}
              items={[
                { label: '-- Select a template (optional) --', value: '' },
                ...templates.map((template) => ({
                  label: template.name + (template.description ? ` - ${template.description}` : ''),
                  value: template.id,
                })),
              ]}
              onValueChange={handleTemplateSelection}
              placeholder="-- Select a template (optional) --"
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
            style={[styles.input, errors.vehicleName && styles.inputError]}
            value={vehicleName}
            onChangeText={(v) => { setVehicleName(v); if (errors.vehicleName) setErrors(e => ({ ...e, vehicleName: '' })); }}
            placeholder="e.g., Royal Enfield Classic 350"
            placeholderTextColor={C.muted}
            editable={!selectedFleetId}
          />
          {errors.vehicleName ? <Text style={styles.errorText}>{errors.vehicleName}</Text> : null}

          <Text style={styles.inputLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
            placeholder="e.g., Royal Enfield"
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

          <Text style={styles.inputLabel}>Total Price (₹) *</Text>
          <TextInput
            style={[styles.input, errors.totalPrice && styles.inputError]}
            value={totalPrice}
            onChangeText={(v) => { setTotalPrice(v); if (errors.totalPrice) setErrors(e => ({ ...e, totalPrice: '' })); }}
            placeholder={`e.g., ${(request?.totalDays || 1) * 800} (for ${request?.totalDays || 1} days)`}
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />
          {errors.totalPrice ? <Text style={styles.errorText}>{errors.totalPrice}</Text> : null}

          <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
          <TextInput
            style={styles.input}
            value={securityDeposit}
            onChangeText={setSecurityDeposit}
            placeholder="e.g., 2000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Helmets Included</Text>
          <TextInput
            style={styles.input}
            value={helmetsIncluded}
            onChangeText={setHelmetsIncluded}
            placeholder="1"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>KM Limit per Day</Text>
          <TextInput
            style={styles.input}
            value={kmLimitPerDay}
            onChangeText={setKmLimitPerDay}
            placeholder="e.g., 100"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Extra KM Rate (₹/km)</Text>
          <TextInput
            style={styles.input}
            value={extraKmRate}
            onChangeText={setExtraKmRate}
            placeholder="e.g., 10"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <CustomDropdown
            label="Advance Payment Required"
            value={advancePercent}
            items={[
              { label: '25%', value: '25' },
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
        {totalPrice && parseFloat(totalPrice) > 0 && (
          <View style={[styles.card, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Text style={[styles.cardTitle, { color: '#0369A1' }]}>Quote Summary</Text>
            <View style={styles.row}>
              <Text style={styles.summaryLabel}>Total Price ({request?.totalDays} days)</Text>
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

          <Text style={styles.inputLabel}>Quote Valid For (Days) *</Text>
          <TextInput
            style={[styles.input, errors.validityDays && styles.inputError]}
            value={validityDays}
            onChangeText={(v) => { setValidityDays(v); if (errors.validityDays) setErrors(e => ({ ...e, validityDays: '' })); }}
            placeholder="3"
            keyboardType="number-pad"
            placeholderTextColor={C.muted}
          />
          {errors.validityDays ? <Text style={styles.errorText}>{errors.validityDays}</Text> : null}
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
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginBottom: 4,
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
