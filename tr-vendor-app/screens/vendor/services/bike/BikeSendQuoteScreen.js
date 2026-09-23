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
  StatusBar,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomDropdown from '../../../../components/CustomDropdown';
import { getQuoteRequestById, getFleetVehicles, submitQuote, getTemplates, getTemplateById } from '../../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../../services/alertService';
import AppEvents, { EVT_QUOTE_SENT } from '../../../../utils/AppEvents';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SC as T, G, rs, cardShadow } from '../../_shared/theme';
import { DISPLAY } from '../../_shared/typography';
import CornerGrid from '../../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  purple: T.purple, purpleL: T.purpleLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange, orangeL: T.orangeL,
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
  const insets = useSafeAreaInsets();
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
  const [kmLimitPerDay, setKmLimitPerDay] = useState('');
  const [unlimitedKm, setUnlimitedKm] = useState(false);
  const [extraKmRate, setExtraKmRate] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30');
  const [advanceMode, setAdvanceMode] = useState('percent'); // 'percent' | 'manual'
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState('3');
  const [validityMode, setValidityMode] = useState('days'); // 'days' | 'custom'
  const [customValidDate, setCustomValidDate] = useState(null);
  const [customValidTime, setCustomValidTime] = useState({ hours: 23, minutes: 59 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    if (advanceMode === 'manual') return parseFloat(customAdvanceAmount) || 0;
    const percent = parseInt(advancePercent) || 30;
    return Math.round((total * percent) / 100);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!vehicleName.trim()) newErrors.vehicleName = 'Vehicle name is required';
    if (!totalPrice || parseFloat(totalPrice) <= 0) newErrors.totalPrice = 'Enter a valid total price';
    if (validityMode === 'days' && (!validityDays || parseInt(validityDays) <= 0)) newErrors.validityDays = 'Validity must be at least 1 day';
    if (validityMode === 'custom' && !customValidDate) newErrors.validityDays = 'Please select a custom expiry date';
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
        kmLimitPerDay: unlimitedKm ? 0 : (parseInt(kmLimitPerDay) || null),
        unlimitedKm: unlimitedKm,
        extraKmCharge: unlimitedKm ? null : (parseFloat(extraKmRate) || null),
        advancePercent: advanceMode === 'percent' ? (parseInt(advancePercent) || 30) : 0,
        customAdvanceAmount: advanceMode === 'manual' ? (parseFloat(customAdvanceAmount) || 0) : undefined,
        inclusions,
        exclusions,
        termsConditions,
        vendorMessage: notes || null,
        validityDays: validityMode === 'days' ? parseInt(validityDays) : undefined,
        customValidTill: validityMode === 'custom' && customValidDate ? (() => {
          const d = new Date(customValidDate);
          d.setHours(customValidTime.hours, customValidTime.minutes, 0, 0);
          return d.toISOString();
        })() : undefined,
      });
      AppEvents.emit(EVT_QUOTE_SENT, { serviceType: 'bike' });
      showSuccess('Quote sent successfully!', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
    } catch (error) {
      console.error('Error submitting quote:', error);
      showError(error?.response?.data?.error || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left','right']}>
        <StatusBar backgroundColor={C.g900} barStyle="light-content" />
        <LinearGradient colors={G.hero} style={styles.gradientHeader}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
              <Icon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitleWhite}>Send Quote</Text>
              <Text style={styles.headerSubtitleWhite}>Bike Rental</Text>
            </View>
            <View style={{ width: 40 }} />
          </SafeAreaView>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Request Summary skeleton */}
          <View style={[styles.card, { backgroundColor: C.amberL, borderColor: '#FDE68A', marginTop: 20 }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#FDE68A' }]}>
                <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: C.orange }]}>Request Summary</Text>
                <Text style={[styles.cardSubtitle, { color: '#92400E' }]}>Customer's requirement</Text>
              </View>
            </View>
            <View style={styles.summaryGrid}>
              {[0,1,2,3].map(i => (
                <View key={i} style={styles.summaryCell}>
                  <Bone w={70} h={11} r={4} />
                  <Bone w={100} h={11} r={4} />
                </View>
              ))}
            </View>
          </View>

          {/* Template card skeleton */}
          <View style={[styles.card, { backgroundColor: C.orangeL, borderColor: '#FED7AA' }]}>
            <View style={styles.cardHeaderRow}>
              <Bone w={38} h={38} r={10} style={{ backgroundColor: '#FED7AA' }} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={160} h={13} r={4} />
                <Bone w={130} h={9} r={3} />
              </View>
            </View>
            <Bone w="100%" h={44} r={10} />
          </View>

          {/* Vehicle details card skeleton */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Bone w={38} h={38} r={10} />
              <View style={{ flex: 1, gap: 5 }}>
                <Bone w={140} h={13} r={4} />
                <Bone w={160} h={9} r={3} />
              </View>
            </View>
            <View style={{ gap: 12 }}>
              <Bone w="100%" h={44} r={10} />
              <Bone w="100%" h={44} r={10} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const total = parseFloat(totalPrice) || 0;
  const advance = calculateAdvance();
  const dailyRate = calculateDailyRate();

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      <StatusBar backgroundColor={C.g900} barStyle="light-content" />

      {/* ─── GRADIENT HEADER ─── */}
      <LinearGradient colors={G.hero} style={styles.gradientHeader}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWhite}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleWhite}>Send Quote</Text>
            <Text style={styles.headerSubtitleWhite}>Bike Rental</Text>
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >

        {/* ─── REQUEST SUMMARY ─── */}
        <View style={[styles.card, { backgroundColor: C.amberL, borderColor: '#FDE68A', marginTop: 20 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: '#FDE68A' }]}>
              <MaterialCommunityIcons name="motorbike" size={18} color={C.amber} />
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
              <Text style={styles.summaryCellLabel}>Location</Text>
              <Text style={styles.summaryCellValue}>{request?.locationName || 'N/A'}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Duration</Text>
              <Text style={styles.summaryCellValue}>{request?.totalDays} days</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryCellLabel}>Dates</Text>
              <Text style={styles.summaryCellValue}>
                {request?.pickupDate ? new Date(request.pickupDate).toLocaleDateString() : 'N/A'} –{' '}
                {request?.dropDate ? new Date(request.dropDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            {request?.helmetsRequired > 0 && (
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>Helmets</Text>
                <Text style={styles.summaryCellValue}>{request?.helmetsRequired} required</Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── TEMPLATE SELECTOR ─── */}
        {templates.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.orangeL, borderColor: '#FED7AA' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#FED7AA' }]}>
                <Icon name="zap" size={18} color={C.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.orange }]}>Quick Fill with Template</Text>
                <Text style={[styles.cardSubtitle, { color: '#7C2D12' }]}>
                  Auto-fill rates, inclusions & terms
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

        {/* ─── VEHICLE DETAILS ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.g50 }]}>
              <MaterialCommunityIcons name="motorbike" size={18} color={C.g600} />
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

          <Text style={styles.inputLabel}>Vehicle Name <Text style={{ color: C.red }}>*</Text></Text>
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

        {/* ─── PRICING DETAILS ─── */}
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

          <Text style={styles.inputLabel}>Total Price (₹) <Text style={{ color: C.red }}>*</Text></Text>
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
          <View style={styles.kmRow}>
            <TextInput
              style={[styles.input, styles.kmInput, unlimitedKm && { backgroundColor: C.bg, color: C.muted }]}
              value={unlimitedKm ? '' : kmLimitPerDay}
              onChangeText={setKmLimitPerDay}
              placeholder="e.g., 100"
              keyboardType="number-pad"
              placeholderTextColor={C.muted}
              editable={!unlimitedKm}
            />
            <TouchableOpacity
              style={[styles.unlimitedBtn, unlimitedKm && { backgroundColor: C.orangeL, borderColor: C.orange }]}
              onPress={() => setUnlimitedKm(!unlimitedKm)}
            >
              <Icon name="zap" size={14} color={unlimitedKm ? C.orange : C.muted} />
              <Text style={[styles.unlimitedBtnText, unlimitedKm && { color: C.orange }]}>Unlimited</Text>
            </TouchableOpacity>
          </View>

          {!unlimitedKm && (
            <>
              <Text style={styles.inputLabel}>Extra KM Rate (₹/km)</Text>
              <TextInput
                style={styles.input}
                value={extraKmRate}
                onChangeText={setExtraKmRate}
                placeholder="e.g., 10"
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
              />
            </>
          )}

          <Text style={styles.inputLabel}>Advance Payment Required</Text>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, advanceMode === 'percent' && styles.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('percent')}
            >
              <Text style={[styles.modeToggleBtnText, advanceMode === 'percent' && styles.modeToggleBtnTextActive]}>% Percent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, advanceMode === 'manual' && styles.modeToggleBtnActive]}
              onPress={() => setAdvanceMode('manual')}
            >
              <Text style={[styles.modeToggleBtnText, advanceMode === 'manual' && styles.modeToggleBtnTextActive]}>₹ Manual</Text>
            </TouchableOpacity>
          </View>
          {advanceMode === 'percent' ? (
            <CustomDropdown
              label=""
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
          ) : (
            <TextInput
              style={styles.input}
              value={customAdvanceAmount}
              onChangeText={setCustomAdvanceAmount}
              placeholder="Enter advance amount (₹)"
              keyboardType="decimal-pad"
              placeholderTextColor={C.muted}
            />
          )}

          <Text style={styles.inputLabel}>Quote Valid For <Text style={{ color: C.red }}>*</Text></Text>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, validityMode === 'days' && styles.modeToggleBtnActive]}
              onPress={() => setValidityMode('days')}
            >
              <Text style={[styles.modeToggleBtnText, validityMode === 'days' && styles.modeToggleBtnTextActive]}>Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, validityMode === 'custom' && styles.modeToggleBtnActive]}
              onPress={() => setValidityMode('custom')}
            >
              <Text style={[styles.modeToggleBtnText, validityMode === 'custom' && styles.modeToggleBtnTextActive]}>Custom Date</Text>
            </TouchableOpacity>
          </View>
          {validityMode === 'days' ? (
            <CustomDropdown
              label=""
              value={validityDays}
              items={[
                { label: '1 day', value: '1' },
                { label: '2 days', value: '2' },
                { label: '3 days', value: '3' },
                { label: '5 days', value: '5' },
                { label: '7 days', value: '7' },
              ]}
              onValueChange={(v) => { setValidityDays(v); if (errors.validityDays) setErrors(e => ({ ...e, validityDays: '' })); }}
              placeholder="Select validity"
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.datePicker, { flex: 1 }, errors.validityDays && { borderColor: C.red }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar" size={16} color={C.sub} />
                <Text style={[styles.datePickerText, !customValidDate && { color: C.muted }]}>
                  {customValidDate
                    ? customValidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePicker, { flex: 0.7 }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="clock" size={16} color={C.sub} />
                <Text style={styles.datePickerText}>
                  {String(customValidTime.hours).padStart(2, '0')}:{String(customValidTime.minutes).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {errors.validityDays ? <Text style={styles.errorText}>{errors.validityDays}</Text> : null}
        </View>

        {/* ─── QUOTE SUMMARY ─── */}
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
              <Text style={styles.summaryLineLabel}>Total Price ({request?.totalDays} days)</Text>
              <Text style={styles.summaryLineValue}>₹{total.toFixed(0)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Daily Rate</Text>
              <Text style={styles.summaryLineValue}>₹{dailyRate.toFixed(0)}/day</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLineLabel, { fontWeight: '700', color: C.text }]}>
                Advance {advanceMode === 'percent' ? `(${advancePercent}%)` : '(Fixed)'}
              </Text>
              <Text style={[styles.summaryLineValue, { color: C.blue, fontSize: 17, fontWeight: '800' }]}>
                ₹{advance.toFixed(0)}
              </Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLineLabel}>Balance on pickup</Text>
              <Text style={styles.summaryLineValue}>₹{(total - advance).toFixed(0)}</Text>
            </View>
            {securityDeposit && parseFloat(securityDeposit) > 0 && (
              <View style={[styles.summaryLine, { marginTop: 8 }]}>
                <Text style={styles.summaryLineLabel}>Security Deposit (Refundable)</Text>
                <Text style={styles.summaryLineValue}>₹{parseFloat(securityDeposit).toFixed(0)}</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── INCLUSIONS ─── */}
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

        {/* ─── EXCLUSIONS ─── */}
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

        {/* ─── TERMS & CONDITIONS ─── */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow, { marginBottom: 14 }]}>
            <View style={[styles.cardIconWrap, { backgroundColor: C.purpleL }]}>
              <Ionicons name="document-text-outline" size={18} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Terms & Conditions ({termsConditions.length})</Text>
              <Text style={styles.cardSubtitle}>Rental policies</Text>
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

        {/* ─── ADDITIONAL INFORMATION ─── */}
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

        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── SUBMIT FOOTER ─── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
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
      </KeyboardAvoidingView>

      {/* ─── DATE PICKER ─── */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => { setCustomValidDate(date); setShowDatePicker(false); if (errors.validityDays) setErrors(e => ({ ...e, validityDays: '' })); }}
        onCancel={() => setShowDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={(date) => { setCustomValidTime({ hours: date.getHours(), minutes: date.getMinutes() }); setShowTimePicker(false); }}
        onCancel={() => setShowTimePicker(false)}
      />

      {/* ─── EDIT MODAL ─── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />

            {/* Modal Header */}
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

            {/* Modal List */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {editList.map((item, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <View style={styles.modalItemIndexWrap}>
                    <Text style={styles.modalItemIndex}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.modalItemText}>{item}</Text>
                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => removeItemFromList(item)}
                  >
                    <Icon name="trash-2" size={16} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Add New Item */}
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

            {/* Save Button */}
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEditModal}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* ─── HEADER ─── */
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    borderBottomLeftRadius: rs(20),
    borderBottomRightRadius: rs(20),
  },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  backBtnWhite: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitleWhite: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSubtitleWhite: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  /* ─── LOADING ─── */

  /* ─── SCROLL ─── */
  scrollView: { flex: 1, paddingHorizontal: 16 },

  /* ─── CARD ─── */
  card: {
    backgroundColor: C.card,
    borderRadius: rs(16),
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    ...cardShadow,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  cardSubtitle: { fontSize: 13, color: C.muted, marginTop: 1 },

  /* ─── REQUEST SUMMARY GRID ─── */
  summaryGrid: { gap: 10 },
  summaryCell: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryCellLabel: { fontSize: 14, color: '#92400E', fontWeight: '500' },
  summaryCellValue: { fontSize: 14, fontWeight: '700', color: C.text, maxWidth: '60%', textAlign: 'right' },

  /* ─── INPUTS ─── */
  inputLabel: {
    fontSize: 14, fontWeight: '600', color: C.sub,
    marginBottom: 7, marginTop: 12,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  inputError: { borderColor: C.red, backgroundColor: C.redL },
  errorText: { fontSize: 13, color: C.red, marginTop: 4 },
  textArea: { height: 88, textAlignVertical: 'top' },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kmInput: { flex: 1, marginBottom: 0 },
  unlimitedBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  unlimitedBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  modeToggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 10 },
  modeToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: C.card },
  modeToggleBtnActive: { backgroundColor: C.g600 },
  modeToggleBtnText: { fontSize: 14, fontWeight: '600', color: C.sub },
  modeToggleBtnTextActive: { color: '#fff' },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.card, marginBottom: 12 },
  datePickerText: { flex: 1, fontSize: 14, color: C.text },

  /* ─── QUOTE SUMMARY ─── */
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLineLabel: { fontSize: 14, color: C.sub },
  summaryLineValue: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: C.text },
  summaryDivider: { height: 1, backgroundColor: '#BFDBFE', marginVertical: 10 },

  /* ─── CHIPS ─── */
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  editChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  editChipText: { fontSize: 13, fontWeight: '700' },

  /* ─── TERMS ─── */
  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  termBullet: {
    width: 24, height: 24, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  termNumber: { fontSize: 12, fontWeight: '800' },
  termText: { flex: 1, fontSize: 14, color: C.sub, lineHeight: 20 },

  /* ─── FOOTER ─── */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  submitBtn: {
    backgroundColor: C.g600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  /* ─── MODAL ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '82%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { maxHeight: 280, marginBottom: 8 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: C.bg,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalItemIndexWrap: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: C.border, justifyContent: 'center', alignItems: 'center',
  },
  modalItemIndex: { fontSize: 12, fontWeight: '800', color: C.sub },
  modalItemText: { flex: 1, fontSize: 14, color: C.text },
  modalDeleteBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.redL, justifyContent: 'center', alignItems: 'center',
  },
  modalAddSection: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 14 },
  modalInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  modalAddBtn: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: C.g600,
    justifyContent: 'center', alignItems: 'center',
  },
  modalSaveBtn: {
    backgroundColor: C.g600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalSaveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
