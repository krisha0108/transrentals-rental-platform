import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates } from '../../../api/client';
import { showError, showSuccess } from '../../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
};

const DEFAULT_INCLUSIONS = [
  'Professional driver with experience',
  'Fully air-conditioned bus',
  'Valid commercial insurance',
  'Basic maintenance during rental',
  'Driver accommodation & meals included',
  'Toll tax included (as per route)',
];

const DEFAULT_EXCLUSIONS = [
  'Parking charges',
  'State tax/permit',
  'Entry tickets/sightseeing charges',
  'Extra hours beyond package',
  'Night halt charges for driver',
];

const DEFAULT_TERMS = [
  'Advance payment required as per quote',
  'Cancellation charges apply as per policy',
  'Driver duty: 10 hours/day or 250 km/day',
  'Extra hours: ₹300-500/hour',
  'Extra KM charges as quoted',
  'Passenger count must not exceed seating capacity',
];

export default function BusSendQuoteScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request,    setRequest]    = useState(null);
  const [fleetVehicles, setFleetVehicles]     = useState([]);
  const [templates,     setTemplates]         = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName,     setVehicleName]     = useState('');
  const [vehicleNumber,   setVehicleNumber]   = useState('');
  const [baseRate,        setBaseRate]        = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');
  const [tollCharges,     setTollCharges]     = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [advancePercent,  setAdvancePercent]  = useState('40');
  const [notes,           setNotes]           = useState('');
  const [validityDays,    setValidityDays]    = useState('2');

  const [inclusions,        setInclusions]        = useState([...DEFAULT_INCLUSIONS]);
  const [exclusions,        setExclusions]        = useState([...DEFAULT_EXCLUSIONS]);
  const [termsConditions,   setTermsConditions]   = useState([...DEFAULT_TERMS]);
  const [editModalVisible,  setEditModalVisible]  = useState(false);
  const [editType,          setEditType]          = useState(null);
  const [editList,          setEditList]          = useState([]);
  const [newItemText,       setNewItemText]       = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestData, fleetsData, templatesData] = await Promise.all([
        getQuoteRequestById('bus', requestId),
        getFleetVehicles(),
        getTemplates('bus').catch(() => ({ templates: [] })),
      ]);
      setRequest(requestData.request || requestData);

      const busFleet = (fleetsData.fleet || fleetsData.fleets || fleetsData.vehicles || []).filter(
        (v) => v.services?.slug === 'bus-rental' || v.services?.name?.toLowerCase().includes('bus')
      );
      setFleetVehicles(busFleet);

      const activeTemplates = (templatesData.templates || []).filter((t) => t.isActive !== false);
      setTemplates(activeTemplates);

      const defaultTemplate = activeTemplates.find((t) => t.isDefault);
      if (defaultTemplate) handleTemplateSelection(defaultTemplate.id);
    } catch (error) {
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setInclusions([...DEFAULT_INCLUSIONS]);
      setExclusions([...DEFAULT_EXCLUSIONS]);
      setTermsConditions([...DEFAULT_TERMS]);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (template.inclusions?.length)      setInclusions([...template.inclusions]);
      if (template.exclusions?.length)      setExclusions([...template.exclusions]);
      if (template.termsConditions?.length) setTermsConditions([...template.termsConditions]);
      if (template.baseRateHint)            setBaseRate(template.baseRateHint.toString());
    }
  };

  const handleFleetSelection = (fleetId) => {
    setSelectedFleetId(fleetId);
    if (!fleetId) { setVehicleName(''); setVehicleNumber(''); return; }
    const selectedVehicle = fleetVehicles.find((v) => v.id === fleetId);
    if (selectedVehicle) {
      let displayName = '';
      if (selectedVehicle.vehicle_models) {
        const brandName = selectedVehicle.vehicle_models.brands?.name || '';
        displayName = brandName
          ? `${brandName} ${selectedVehicle.vehicle_models.name}`
          : selectedVehicle.vehicle_models.name;
      } else if (selectedVehicle.brands && selectedVehicle.chauffeur_vehicle_categories) {
        displayName = `${selectedVehicle.brands.name} ${selectedVehicle.chauffeur_vehicle_categories.name}`;
      } else if (selectedVehicle.chauffeur_vehicle_categories) {
        displayName = selectedVehicle.chauffeur_vehicle_categories.name;
      }
      setVehicleName(displayName);
      setVehicleNumber(selectedVehicle.registrationNumber || '');
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

  const calculateTotal = () => {
    return (parseFloat(baseRate) || 0)
      + (parseFloat(driverAllowance) || 0)
      + (parseFloat(tollCharges) || 0)
      + (parseFloat(additionalCharges) || 0);
  };

  const calculateAdvance = () => {
    const total = calculateTotal();
    const percent = parseInt(advancePercent) || 40;
    return Math.round((total * percent) / 100);
  };

  const handleSubmit = async () => {
    if (!vehicleName) { showError('Please enter vehicle name/model or select from fleet'); return; }
    if (!baseRate || parseFloat(baseRate) <= 0) { showError('Please enter valid base rate'); return; }
    try {
      setSubmitting(true);
      await submitQuote('bus', {
        requestId:        requestId,
        templateId:       selectedTemplateId || null,
        fleetId:          selectedFleetId || null,
        vehicleCategory:  request?.vehicleCategory || null,
        vehicleName:      vehicleName,
        vehicleNumber:    vehicleNumber || null,
        seats:            request?.passengerCount || 17,
        baseAmount:       parseFloat(baseRate) || 0,
        driverAllowance:  parseFloat(driverAllowance) || 0,
        tollEstimate:     parseFloat(tollCharges) || 0,
        parkingEstimate:  parseFloat(additionalCharges) || 0,
        advanceAmount:    calculateAdvance(),
        advancePercent:   parseInt(advancePercent) || 40,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage:    notes || null,
        validityDays:     parseInt(validityDays) || 3,
      });
      showSuccess('Quote sent successfully!', 'Success', {
        actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }],
      });
    } catch (error) {
      showError(error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar backgroundColor={C.g900} barStyle="light-content" />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleWhite}>Send Quote</Text>
            <Text style={styles.headerSubtitleWhite}>Bus & Tempo</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={styles.loadingText}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = calculateTotal();
  const advance = calculateAdvance();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar backgroundColor={C.g900} barStyle="light-content" />

      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleWhite}>Send Quote</Text>
          <Text style={styles.headerSubtitleWhite}>Bus & Tempo</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Request Summary */}
        <View style={[styles.card, { backgroundColor: C.amberL, borderColor: '#FDE68A', marginTop: 20 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#FDE68A' }]}>
              <MaterialCommunityIcons name="bus" size={18} color={C.amber} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: C.orange }]}>Request Summary</Text>
              <Text style={[styles.cardSubtitle, { color: '#92400E' }]}>Customer's requirement</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Customer</Text>
              <Text style={styles.summaryCellValue}>{request?.customerName}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Pickup</Text>
              <Text style={styles.summaryCellValue}>{request?.pickupCity || request?.locationName || 'N/A'}</Text>
            </View>
            {request?.pickupDate ? (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Pickup Date</Text>
                <Text style={styles.summaryCellValue}>{new Date(request.pickupDate).toLocaleDateString()}</Text>
              </View>
            ) : null}
            {request?.passengerCount ? (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Passengers</Text>
                <Text style={styles.summaryCellValue}>{request.passengerCount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.orangeL, borderColor: '#FED7AA' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#FED7AA' }]}>
                <Icon name="zap" size={18} color={C.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.orange }]}>Quick Fill with Template</Text>
                <Text style={[styles.cardSubtitle, { color: '#7C2D12' }]}>Auto-fill rates, inclusions & terms</Text>
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

        {/* Vehicle Details */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="bus" size={18} color={C.g600} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Vehicle Details</Text>
              <Text style={styles.cardSubtitle}>Select from fleet or enter manually</Text>
            </View>
          </View>

          <CustomDropdown
            label="Select from Fleet (Optional)"
            value={selectedFleetId}
            items={[
              { label: '-- Manual Entry --', value: '' },
              ...fleetVehicles.map((vehicle) => {
                let displayName = '';
                if (vehicle.vehicle_models) {
                  displayName = vehicle.vehicle_models.brands?.name
                    ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}`
                    : vehicle.vehicle_models.name;
                } else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) {
                  displayName = `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories.name}`;
                } else if (vehicle.chauffeur_vehicle_categories) {
                  displayName = vehicle.chauffeur_vehicle_categories.name;
                }
                const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                return { label: `${displayName}${regNum}`, value: vehicle.id };
              }),
            ]}
            onValueChange={handleFleetSelection}
            placeholder="-- Manual Entry --"
            searchable={fleetVehicles.length > 5}
          />

          <Text style={styles.inputLabel}>Vehicle Name/Model <Text style={{ color: C.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={(text) => { setVehicleName(text); setSelectedFleetId(''); }}
            placeholder="e.g., Force Traveller 17 Seater"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={(text) => { setVehicleNumber(text.toUpperCase()); setSelectedFleetId(''); }}
            placeholder="e.g., DL 01 AB 1234"
            placeholderTextColor={C.muted}
          />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <Ionicons name="wallet-outline" size={18} color={C.g600} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Pricing Details</Text>
              <Text style={styles.cardSubtitle}>Set your competitive rates</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Base Rate (₹) <Text style={{ color: C.red }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={baseRate}
            onChangeText={setBaseRate}
            placeholder="15000"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Driver Allowance (if separate) (₹)</Text>
          <TextInput
            style={styles.input}
            value={driverAllowance}
            onChangeText={setDriverAllowance}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Toll Charges (if separate) (₹)</Text>
          <TextInput
            style={styles.input}
            value={tollCharges}
            onChangeText={setTollCharges}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <Text style={styles.inputLabel}>Additional Charges (₹)</Text>
          <TextInput
            style={styles.input}
            value={additionalCharges}
            onChangeText={setAdditionalCharges}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={C.muted}
          />

          <CustomDropdown
            label="Advance Payment Required"
            value={advancePercent}
            items={[
              { label: '20%', value: '20' },
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
        {total > 0 && (
          <View style={[styles.card, { backgroundColor: C.blueL, borderColor: '#BFDBFE' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calculator-outline" size={18} color={C.blue} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: C.blue }]}>Quote Summary</Text>
                <Text style={[styles.cardSubtitle, { color: '#1E40AF' }]}>Calculated breakdown</Text>
              </View>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Base Rate</Text>
              <Text style={styles.summaryLineValue}>₹{parseFloat(baseRate || 0).toFixed(0)}</Text>
            </View>
            {parseFloat(driverAllowance || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Driver Allowance</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(driverAllowance).toFixed(0)}</Text>
              </View>
            )}
            {parseFloat(tollCharges || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Toll Charges</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(tollCharges).toFixed(0)}</Text>
              </View>
            )}
            {parseFloat(additionalCharges || 0) > 0 && (
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Additional Charges</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(additionalCharges).toFixed(0)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLineLabel, { fontWeight: '700', color: C.text }]}>
                Advance ({advancePercent}%)
              </Text>
              <Text style={[styles.summaryLineValue, { color: C.blue, fontSize: 17, fontWeight: '800' }]}>
                ₹{advance.toFixed(0)}
              </Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Balance on pickup</Text>
              <Text style={styles.summaryLineValue}>₹{(total - advance).toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* Inclusions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <Icon name="check-circle" size={18} color={C.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Inclusions ({inclusions.length})</Text>
              <Text style={styles.cardSubtitle}>What's included in the quote</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.g50 }]}
              onPress={() => openEditModal('inclusions')}
            >
              <Icon name="edit-2" size={13} color={C.g700} />
              <Text style={[styles.editChipText, { color: C.g700 }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {inclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.g50, borderColor: C.g100 }]}>
                <Icon name="check-circle" size={13} color={C.g600} />
                <Text style={[styles.chipText, { color: C.g700 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exclusions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.redL }]}>
              <Icon name="x-circle" size={18} color={C.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Exclusions ({exclusions.length})</Text>
              <Text style={styles.cardSubtitle}>What's not covered</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.redL }]}
              onPress={() => openEditModal('exclusions')}
            >
              <Icon name="edit-2" size={13} color={C.red} />
              <Text style={[styles.editChipText, { color: C.red }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipWrap}>
            {exclusions.map((item, idx) => (
              <View key={idx} style={[styles.chip, { backgroundColor: C.redL, borderColor: '#FECACA' }]}>
                <Icon name="x-circle" size={13} color={C.red} />
                <Text style={[styles.chipText, { color: C.red }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.purpleL }]}>
              <Ionicons name="document-text-outline" size={18} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
              <Text style={styles.cardSubtitle}>Service policies</Text>
            </View>
            <TouchableOpacity
              style={[styles.editChip, { backgroundColor: C.purpleL }]}
              onPress={() => openEditModal('terms')}
            >
              <Icon name="edit-2" size={13} color={C.purple} />
              <Text style={[styles.editChipText, { color: C.purple }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          {termsConditions.map((term, idx) => (
            <View key={idx} style={styles.termRow}>
              <View style={[styles.termBullet, { backgroundColor: C.purpleL }]}>
                <Text style={[styles.termNumber, { color: C.purple }]}>{idx + 1}</Text>
              </View>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.bg }]}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={C.sub} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Additional Information</Text>
              <Text style={styles.cardSubtitle}>Notes & validity</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Notes for Customer</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special notes or conditions..."
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

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Footer */}
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
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>
                Send Quote {total > 0 ? `• ₹${total.toFixed(0)}` : ''}
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
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {editType === 'inclusions' && <Icon name="check-circle" size={20} color={C.g600} style={{ marginRight: 8 }} />}
                {editType === 'exclusions' && <Icon name="x-circle" size={20} color={C.red} style={{ marginRight: 8 }} />}
                {editType === 'terms' && <Ionicons name="document-text-outline" size={20} color={C.purple} style={{ marginRight: 8 }} />}
                <Text style={styles.modalTitle}>
                  Edit {editType === 'inclusions' ? 'Inclusions' : editType === 'exclusions' ? 'Exclusions' : 'Terms'}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditModalVisible(false)}>
                <Icon name="x" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <View style={styles.modalItemIndexWrap}>
                    <Text style={styles.modalItemIndex}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => removeItemFromList(item)}>
                    <Icon name="trash-2" size={16} color={C.red} />
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
                onSubmitEditing={addItemToList}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.modalAddBtn} onPress={addItemToList}>
                <Icon name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  gradientHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtnWhite: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerCenter:        { alignItems: 'center', flex: 1 },
  headerTitleWhite:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitleWhite: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.sub },

  scrollView: { flex: 1, paddingHorizontal: 16 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardIconWrap:  { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:     { fontSize: 15, fontWeight: '700', color: C.text },
  cardSubtitle:  { fontSize: 12, color: C.muted, marginTop: 1 },

  summaryGrid:      { gap: 10 },
  summaryCell:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryCellLabel: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  summaryCellValue: { fontSize: 13, fontWeight: '700', color: C.text, maxWidth: '60%', textAlign: 'right' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 7, marginTop: 12 },
  input: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: C.text,
  },
  textArea: { height: 88, textAlignVertical: 'top' },

  summaryLine:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLineLabel: { fontSize: 14, color: C.sub },
  summaryLineValue: { fontSize: 14, fontWeight: '600', color: C.text },
  summaryDivider:   { height: 1, backgroundColor: '#BFDBFE', marginVertical: 10 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  chipText:  { fontSize: 12, fontWeight: '600' },
  editChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  editChipText: { fontSize: 12, fontWeight: '700' },

  termRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  termBullet: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  termNumber: { fontSize: 11, fontWeight: '800' },
  termText:   { flex: 1, fontSize: 13, color: C.sub, lineHeight: 20 },

  footer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 12,
  },
  submitBtn: {
    backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 32, maxHeight: '82%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: C.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  modalBody:     { maxHeight: 280, marginBottom: 8 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: C.bg, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  modalItemIndexWrap: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center' },
  modalItemIndex:     { fontSize: 11, fontWeight: '800', color: C.sub },
  modalItemText:      { flex: 1, fontSize: 13, color: C.text },
  modalDeleteBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: C.redL, justifyContent: 'center', alignItems: 'center' },
  modalAddSection:    { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 14 },
  modalInput: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, fontSize: 14, color: C.text,
  },
  modalAddBtn:     { width: 48, height: 48, borderRadius: 10, backgroundColor: C.g600, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn:    { backgroundColor: C.g600, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  modalSaveBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
});
