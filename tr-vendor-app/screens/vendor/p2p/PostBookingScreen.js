import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Platform,
  KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createP2PBooking, updateP2PBooking } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g950: T.forestDark, g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep,
  g600: T.emerald600, g500: T.emerald500, g400: T.emerald, g300: T.oceanLight,
  g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, surface: T.card,
  text: T.ink, sub: T.text, muted: T.subText,
  border: T.border, borderMed: '#CBD5E1',
  amber: T.amber, amberDark: shade(T.amber, -15), amberBg: T.amberLight,
  red: T.red, redDark: shade(T.red, -15), redBg: T.redLight,
  blue: T.blue, blueBg: T.blueLight, blueDark: '#1D4ED8',
  purple: T.purple, purpleBg: T.tintPlum,
};

const TRUCK_VEHICLES = ['Mini Truck', 'LCV', '14ft', '17ft', '19ft', '22ft', '32ft'];
const CAR_VEHICLES = ['Sedan', 'SUV', 'Luxury', 'Tempo Traveller'];
const REASONS = ['No Vehicle Available', 'Vehicle Under Maintenance', 'Overbooked', 'Route Not Covered', 'Other'];
const URGENCY_OPTIONS = [
  { value: 'HIGH', label: 'High', desc: 'ASAP', color: C.red, activeBg: C.redBg, activeBorder: C.red },
  { value: 'MEDIUM', label: 'Medium', desc: 'Within a day', color: C.amber, activeBg: C.amberBg, activeBorder: C.amber },
  { value: 'LOW', label: 'Low', desc: 'Flexible', color: C.g500, activeBg: C.g50, activeBorder: C.g500 },
];

function fmtDate(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtTime(d) { return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

export default function PostBookingScreen({ navigation, route }) {
  const editData = route?.params?.editData || null;
  const isEditing = !!editData;

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: [] });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: [{ label: 'OK', variant: 'primary', onPress: () => hideAlert() }] });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  // Form state
  const [serviceType, setServiceType] = useState('truck');
  const [vehicleRequired, setVehicleRequired] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  // Date
  const [tripDate, setTripDate] = useState(null);
  const [tripTime, setTripTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Truck-specific
  const [goodsType, setGoodsType] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [needInsurance, setNeedInsurance] = useState(false);
  const [needLabour, setNeedLabour] = useState(false);
  const [labourCount, setLabourCount] = useState('');

  // Car-specific
  const [passengers, setPassengers] = useState('');

  // Budget & Commission
  const [customerBudget, setCustomerBudget] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('10');

  // Urgency & Reason
  const [urgency, setUrgency] = useState('MEDIUM');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const budget = Number(customerBudget) || 0;
  const commPct = Number(commissionPercent) || 0;
  const commissionAmount = Math.round(budget * commPct / 100);
  const partnerEarning = budget - commissionAmount;
  const platformFee = Math.round(partnerEarning * 0.05);

  const vehicleOptions = serviceType === 'truck' ? TRUCK_VEHICLES : CAR_VEHICLES;

  // Pre-populate form when editing
  useEffect(() => {
    if (!editData) return;
    setServiceType(editData.serviceType || 'truck');
    setVehicleRequired(editData.vehicleRequired || '');
    setFromCity(editData.fromCity || '');
    setToCity(editData.toCity || '');
    if (editData.tripDate) setTripDate(new Date(editData.tripDate));
    if (editData.tripTime) {
      const [h, m] = editData.tripTime.split(':').map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0); setTripTime(t);
    }
    setGoodsType(editData.goodsType || '');
    setEstimatedWeight(editData.estimatedWeight ? String(editData.estimatedWeight) : '');
    setNeedInsurance(!!editData.needInsurance);
    setNeedLabour(!!editData.needLabour);
    setLabourCount(editData.labourCount ? String(editData.labourCount) : '');
    setPassengers(editData.passengers ? String(editData.passengers) : '');
    setCustomerBudget(editData.customerBudget ? String(editData.customerBudget) : '');
    if (editData.commission && editData.customerBudget && editData.customerBudget > 0) {
      setCommissionPercent(String(Math.round((editData.commission / editData.customerBudget) * 100)));
    }
    setUrgency(editData.urgency || 'MEDIUM');
    setReason(editData.reasonForSharing || '');
    setNotes(editData.notes || '');
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setTripDate(selectedDate);
    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;
    setTripTime(selectedTime);
    if (Platform.OS === 'ios') setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!fromCity.trim()) return showAlert('warning', 'Missing Info', 'From City is required.');
    if (!tripDate) return showAlert('warning', 'Missing Info', 'Trip date is required.');
    if (!customerBudget.trim() || budget <= 0) return showAlert('warning', 'Invalid Budget', 'Please enter a valid customer budget.');

    setLoading(true);
    try {
      const data = {
        serviceType,
        bookingType: 'One Way',
        vehicleRequired: vehicleRequired || undefined,
        fromCity: fromCity.trim(),
        toCity: toCity.trim() || undefined,
        tripDate: tripDate.toISOString(),
        tripTime: tripTime ? `${String(tripTime.getHours()).padStart(2, '0')}:${String(tripTime.getMinutes()).padStart(2, '0')}` : undefined,
        passengers: serviceType === 'car' && passengers.trim() ? Number(passengers) : undefined,
        goodsType: serviceType === 'truck' && goodsType.trim() ? goodsType.trim() : undefined,
        estimatedWeight: serviceType === 'truck' && estimatedWeight.trim() ? Number(estimatedWeight) : undefined,
        needInsurance: serviceType === 'truck' ? needInsurance : undefined,
        needLabour: serviceType === 'truck' ? needLabour : undefined,
        labourCount: serviceType === 'truck' && needLabour && labourCount.trim() ? Number(labourCount) : undefined,
        customerBudget: budget,
        commission: commissionAmount,
        partnerEarning,
        urgency,
        reason: reason || undefined,
        notes: notes.trim() || undefined,
      };

      if (isEditing) {
        await updateP2PBooking(editData.id, data);
      } else {
        await createP2PBooking(data);
      }
      setAlert({
        visible: true, type: 'success', title: isEditing ? 'Booking Updated!' : 'Booking Shared!',
        message: isEditing ? 'Your booking posting has been updated.' : 'Your booking has been posted to the P2P marketplace.',
        actions: [{ label: 'Done', variant: 'primary', onPress: () => { hideAlert(); navigation.navigate('MyPostingsScreen', { initialTab: 'bookings' }); } }],
      });
    } catch (err) {
      showAlert('error', 'Failed to Post', err?.response?.data?.error || err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.g950} />

      {/* ── HEADER ── */}
      <LinearGradient colors={G.hero} style={s.headerGradient}>
        {/* Decorative orbs */}
        <AnimatedOrb style={s.headerCircle1} />
        <AnimatedOrb style={s.headerCircle2} delay={1200} dx={-10} dy={8} />
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <View style={s.headerIconWrap}>
                <MCI name="share-variant" size={22} color="#fff" />
              </View>
              <Text style={s.headerTitle}>{isEditing ? 'Edit Booking' : 'Share Booking'}</Text>
              <Text style={s.headerSub}>{isEditing ? 'Update your booking posting' : 'Sub-contract a booking to partner vendor'}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── STEP 1: SERVICE TYPE ── */}
          <SectionCard>
            <StepHeader step="1" gradColors={[C.g700, C.g500]} title="Service Type" />
            <View style={s.serviceTypeRow}>
              {/* Truck card */}
              {(() => {
                const active = serviceType === 'truck';
                return (
                  <TouchableOpacity
                    style={[s.serviceCard, active && s.serviceCardActiveGreen]}
                    onPress={() => { setServiceType('truck'); setVehicleRequired(''); }}
                    activeOpacity={0.8}
                  >
                    {active && <View style={s.serviceCardCheckDot} />}
                    <View style={[s.serviceCardIconWrap, active ? s.serviceCardIconWrapGreen : s.serviceCardIconWrapGray]}>
                      <MCI name="truck" size={28} color={active ? C.g600 : C.muted} />
                    </View>
                    <Text style={[s.serviceCardLabel, active && { color: C.g700 }]}>Truck</Text>
                    <Text style={[s.serviceCardSub, active && { color: C.g500 }]}>Freight & logistics</Text>
                  </TouchableOpacity>
                );
              })()}
              {/* Car card */}
              {(() => {
                const active = serviceType === 'car';
                return (
                  <TouchableOpacity
                    style={[s.serviceCard, active && s.serviceCardActivePurple]}
                    onPress={() => { setServiceType('car'); setVehicleRequired(''); }}
                    activeOpacity={0.8}
                  >
                    {active && <View style={s.serviceCardCheckDotPurple} />}
                    <View style={[s.serviceCardIconWrap, active ? s.serviceCardIconWrapPurple : s.serviceCardIconWrapGray]}>
                      <MCI name="car" size={28} color={active ? C.purple : C.muted} />
                    </View>
                    <Text style={[s.serviceCardLabel, active && { color: C.purple }]}>Car</Text>
                    <Text style={[s.serviceCardSub, active && { color: C.purple }]}>Rides & transfers</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </SectionCard>

          {/* ── STEP 2: VEHICLE REQUIRED ── */}
          <SectionCard>
            <StepHeader step="2" gradColors={[C.blueDark, C.blue]} title="Vehicle Required" />
            <View style={s.chipGrid}>
              {vehicleOptions.map(v => {
                const active = vehicleRequired === v;
                const isTruck = serviceType === 'truck';
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.vehicleChip, active && s.vehicleChipActive]}
                    onPress={() => setVehicleRequired(active ? '' : v)}
                    activeOpacity={0.75}
                  >
                    <MCI
                      name={isTruck ? 'truck' : 'car'}
                      size={13}
                      color={active ? C.g700 : C.muted}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[s.vehicleChipText, active && s.vehicleChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── STEP 3: ROUTE & SCHEDULE ── */}
          <SectionCard>
            <StepHeader step="3" gradColors={['#6D28D9', C.purple]} title="Route & Schedule" />

            {/* Boarding pass style route card */}
            <View style={s.routeCard}>
              <View style={s.routeHalf}>
                <View style={s.routeDotRow}>
                  <View style={s.routeDotGreen} />
                  <Text style={s.routeCityLabel}>FROM CITY</Text>
                </View>
                <TextInput
                  style={s.routeInput}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={C.muted}
                  value={fromCity}
                  onChangeText={setFromCity}
                />
              </View>
              <View style={s.routeDivider}>
                <View style={s.routeDividerLine} />
                <View style={s.routeArrowCircle}>
                  <MCI name="arrow-right" size={14} color={C.purple} />
                </View>
                <View style={s.routeDividerLine} />
              </View>
              <View style={s.routeHalf}>
                <View style={s.routeDotRow}>
                  <View style={s.routeDotRed} />
                  <Text style={s.routeCityLabel}>TO CITY</Text>
                </View>
                <TextInput
                  style={s.routeInput}
                  placeholder="e.g. Delhi"
                  placeholderTextColor={C.muted}
                  value={toCity}
                  onChangeText={setToCity}
                />
              </View>
            </View>

            {/* Date + Time buttons */}
            <View style={s.dateTimeRow}>
              <TouchableOpacity
                style={[s.dateTimeCard, tripDate && s.dateTimeCardActive]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Icon name="calendar" size={18} color={tripDate ? C.g600 : C.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={s.dateTimeCardLabel}>Trip Date *</Text>
                  <Text style={[s.dateTimeCardValue, tripDate && { color: C.text }]}>
                    {tripDate ? fmtDate(tripDate) : 'Select date'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.dateTimeCard, tripTime && s.dateTimeCardActive]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Icon name="clock" size={18} color={tripTime ? C.g600 : C.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={s.dateTimeCardLabel}>Trip Time</Text>
                  <Text style={[s.dateTimeCardValue, tripTime && { color: C.text }]}>
                    {tripTime ? fmtTime(tripTime) : 'Optional'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── STEP 4a: GOODS DETAILS (truck only) ── */}
          {serviceType === 'truck' && (
            <SectionCard>
              <StepHeader step="4" gradColors={[C.amberDark, C.amber]} title="Goods Details" />

              {/* Goods Type */}
              <View style={s.fieldCard}>
                <View style={[s.fieldCardIconBox, { backgroundColor: C.amberBg }]}>
                  <MCI name="package-variant" size={18} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldCardLabel}>Goods Type</Text>
                  <TextInput
                    style={s.fieldCardInput}
                    placeholder="e.g. Furniture, Electronics"
                    placeholderTextColor={C.muted}
                    value={goodsType}
                    onChangeText={setGoodsType}
                  />
                </View>
              </View>

              {/* Weight */}
              <View style={[s.fieldCard, { marginTop: 10 }]}>
                <View style={[s.fieldCardIconBox, { backgroundColor: '#F0F9FF' }]}>
                  <MCI name="weight" size={18} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldCardLabel}>Estimated Weight (kg)</Text>
                  <TextInput
                    style={s.fieldCardInput}
                    placeholder="e.g. 5000"
                    placeholderTextColor={C.muted}
                    value={estimatedWeight}
                    onChangeText={setEstimatedWeight}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Insurance toggle */}
              <View style={[s.toggleCard, { marginTop: 12 }]}>
                <View style={[s.toggleCardIconBox, { backgroundColor: C.amberBg }]}>
                  <MCI name="shield-check" size={20} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleCardLabel}>Need Insurance</Text>
                  <Text style={s.toggleCardSub}>Transit insurance for goods</Text>
                </View>
                <Switch
                  value={needInsurance}
                  onValueChange={setNeedInsurance}
                  trackColor={{ false: C.border, true: C.g500 }}
                  thumbColor={needInsurance ? '#fff' : '#f4f4f5'}
                />
              </View>

              {/* Labour toggle */}
              <View style={[s.toggleCard, { marginTop: 10 }]}>
                <View style={[s.toggleCardIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <MCI name="account-hard-hat" size={20} color={C.amberDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleCardLabel}>Need Labour</Text>
                  <Text style={s.toggleCardSub}>Loading / unloading help</Text>
                </View>
                <Switch
                  value={needLabour}
                  onValueChange={setNeedLabour}
                  trackColor={{ false: C.border, true: C.g500 }}
                  thumbColor={needLabour ? '#fff' : '#f4f4f5'}
                />
              </View>

              {/* Labour count */}
              {needLabour && (
                <View style={[s.fieldCard, { marginTop: 10 }]}>
                  <View style={[s.fieldCardIconBox, { backgroundColor: C.g50 }]}>
                    <MCI name="account-group" size={18} color={C.g600} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldCardLabel}>Number of Labourers</Text>
                    <TextInput
                      style={s.fieldCardInput}
                      placeholder="e.g. 2"
                      placeholderTextColor={C.muted}
                      value={labourCount}
                      onChangeText={setLabourCount}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              )}
            </SectionCard>
          )}

          {/* ── STEP 4b: PASSENGER DETAILS (car only) ── */}
          {serviceType === 'car' && (
            <SectionCard>
              <StepHeader step="4" gradColors={[C.blueDark, C.blue]} title="Passenger Details" />
              <View style={s.fieldCard}>
                <View style={[s.fieldCardIconBox, { backgroundColor: C.blueBg }]}>
                  <MCI name="account-group" size={18} color={C.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldCardLabel}>Number of Passengers</Text>
                  <TextInput
                    style={s.fieldCardInput}
                    placeholder="e.g. 4"
                    placeholderTextColor={C.muted}
                    value={passengers}
                    onChangeText={setPassengers}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </SectionCard>
          )}

          {/* ── STEP 5: BUDGET & COMMISSION ── */}
          <SectionCard>
            <StepHeader step="5" gradColors={[C.amberDark, C.amber]} title="Budget & Commission" />

            {/* Customer Budget — dark gradient card */}
            <LinearGradient colors={[C.g800, C.g700]} style={s.budgetCard}>
              <Text style={s.budgetCardLabel}>CUSTOMER BUDGET</Text>
              <View style={s.budgetInputRow}>
                <Text style={s.budgetRupee}>{'₹'}</Text>
                <TextInput
                  style={s.budgetInput}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={customerBudget}
                  onChangeText={setCustomerBudget}
                  keyboardType="number-pad"
                />
              </View>
            </LinearGradient>

            {/* Commission row */}
            <View style={s.commissionRow}>
              <View style={s.commissionLabelCol}>
                <MCI name="percent" size={16} color={C.amber} />
                <Text style={s.commissionLabel}>Your Commission %</Text>
              </View>
              <TextInput
                style={s.commissionInput}
                placeholder="10"
                placeholderTextColor={C.muted}
                value={commissionPercent}
                onChangeText={setCommissionPercent}
                keyboardType="number-pad"
              />
              <View style={s.commissionBadge}>
                <Text style={s.commissionBadgeText}>{'₹'}{commissionAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Earnings Preview */}
            {budget > 0 && (
              <LinearGradient colors={[C.g900, C.g800]} style={s.previewCard}>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Customer Budget</Text>
                  <Text style={s.previewValueWhite}>{'₹'}{budget.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Your Commission ({commPct}%)</Text>
                  <Text style={[s.previewValueWhite, { color: C.g300 }]}>{'₹'}{commissionAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewDivider} />
                <View style={s.previewRow}>
                  <Text style={[s.previewLabel, { fontWeight: '800', color: '#fff', fontSize: 14 }]}>PARTNER EARNS</Text>
                  <Text style={[s.previewValueWhite, { fontSize: 20, color: C.g300, fontWeight: '800' }]}>{'₹'}{partnerEarning.toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={[s.previewLabel, { fontSize: 11, color: 'rgba(255,255,255,0.4)' }]}>Platform Fee (5%)</Text>
                  <Text style={[s.previewValueWhite, { fontSize: 11, color: 'rgba(255,255,255,0.4)' }]}>-{'₹'}{platformFee.toLocaleString('en-IN')}</Text>
                </View>
              </LinearGradient>
            )}
          </SectionCard>

          {/* ── STEP 6: URGENCY LEVEL ── */}
          <SectionCard>
            <StepHeader step="6" gradColors={[C.redDark, C.red]} title="Urgency Level" />
            <View style={s.urgencyRow}>
              {URGENCY_OPTIONS.map(opt => {
                const active = urgency === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      s.urgencyCard,
                      { borderColor: active ? opt.activeBorder : C.border, backgroundColor: active ? opt.activeBg : C.surface },
                    ]}
                    onPress={() => setUrgency(opt.value)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.urgencyDot, { backgroundColor: active ? opt.color : C.muted }]} />
                    <Text style={[s.urgencyLabel, { color: active ? opt.color : C.muted }]}>{opt.label}</Text>
                    <Text style={[s.urgencyDesc, { color: active ? opt.color : C.muted }]}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── STEP 7: REASON ── */}
          <SectionCard>
            <StepHeader step="7" gradColors={[C.blueDark, C.blue]} title="Why are you sharing?" />
            <View style={s.chipGrid}>
              {REASONS.map(r => {
                const active = reason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[s.vehicleChip, active && s.vehicleChipActive]}
                    onPress={() => setReason(active ? '' : r)}
                    activeOpacity={0.75}
                  >
                    <MCI
                      name="chat-question"
                      size={12}
                      color={active ? C.g700 : C.muted}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[s.vehicleChipText, active && s.vehicleChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── NOTES ── */}
          <SectionCard>
            <View style={s.notesSectionHead}>
              <View style={[s.notesIconWrap, { backgroundColor: C.g50 }]}>
                <MCI name="note-text" size={17} color={C.g600} />
              </View>
              <Text style={s.notesSectionTitle}>Additional Notes</Text>
            </View>
            <TextInput
              style={s.notesInput}
              placeholder="Any special requirements, route details, or remarks..."
              placeholderTextColor={C.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </SectionCard>

          {/* ── SUBMIT ── */}
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={loading ? { opacity: 0.6 } : {}}>
            <LinearGradient
              colors={G.emerald}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitBtn}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="share-2" size={20} color="#fff" />
                  <Text style={s.submitBtnText}>Share Booking</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={tripDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date()} onChange={onDateChange} />
      )}
      {showTimePicker && (
        <DateTimePicker value={tripTime || new Date()} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
      )}

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} actions={alert.actions} />
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ children }) {
  return <View style={s.sectionCard}>{children}</View>;
}

function StepHeader({ step, gradColors, title }) {
  return (
    <View style={s.stepHeader}>
      <LinearGradient colors={gradColors} style={s.stepCircle}>
        <Text style={s.stepNumber}>{step}</Text>
      </LinearGradient>
      <Text style={s.stepTitle}>{title}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  headerGradient: { paddingBottom: 20, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  headerCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -50,
  },
  headerCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.045)', bottom: -30, left: -30,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.35)',
    borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  // Scroll
  scroll: { padding: 16, gap: 14 },

  // Section card
  sectionCard: {
    backgroundColor: C.surface, borderRadius: rs(18), overflow: 'hidden',
    ...cardShadow,
  },

  // Step header
  stepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumber: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '800', color: '#fff' },
  stepTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: 0.1 },

  // Service type
  serviceTypeRow: { flexDirection: 'row', gap: 12, padding: 16 },
  serviceCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: rs(14), borderWidth: 2, borderColor: C.border, backgroundColor: C.surface,
    gap: 6, position: 'relative', overflow: 'hidden',
  },
  serviceCardActiveGreen: { borderColor: C.g500, backgroundColor: C.g50 },
  serviceCardActivePurple: { borderColor: C.purple, backgroundColor: C.purpleBg },
  serviceCardCheckDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.g500,
  },
  serviceCardCheckDotPurple: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.purple,
  },
  serviceCardIconWrap: {
    width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  serviceCardIconWrapGreen: { backgroundColor: C.g100 },
  serviceCardIconWrapPurple: { backgroundColor: '#EDE9FE' },
  serviceCardIconWrapGray: { backgroundColor: '#F1F5F9' },
  serviceCardLabel: { fontSize: 15, fontWeight: '800', color: C.muted, letterSpacing: 0.1 },
  serviceCardSub: { fontSize: 11, color: C.muted, textAlign: 'center' },

  // Vehicle chips grid
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    borderWidth: 2, borderColor: C.border, backgroundColor: C.surface,
  },
  vehicleChipActive: { borderColor: C.g600, backgroundColor: C.g50 },
  vehicleChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  vehicleChipTextActive: { color: C.g700, fontWeight: '700' },

  // Route card (boarding pass style)
  routeCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: '#F8FAFC', borderRadius: rs(14), borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  routeHalf: { paddingHorizontal: 16, paddingVertical: 14 },
  routeDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  routeDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.g500 },
  routeDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  routeCityLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase' },
  routeInput: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: C.text, paddingVertical: 0 },
  routeDivider: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.borderMed,
    paddingVertical: 10,
  },
  routeDividerLine: { flex: 1, height: 1, backgroundColor: C.borderMed },
  routeArrowCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.purpleBg,
    borderWidth: 1, borderColor: '#DDD6FE', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 10,
  },

  // Date/time cards
  dateTimeRow: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 12 },
  dateTimeCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: rs(14),
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  dateTimeCardActive: { borderColor: C.g400, backgroundColor: C.g50 },
  dateTimeCardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dateTimeCardValue: { fontSize: 13, fontWeight: '700', color: C.muted },

  // Field card (icon + label + input)
  fieldCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, backgroundColor: '#F8FAFC',
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  fieldCardIconBox: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  fieldCardLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  fieldCardInput: { fontSize: 14, color: C.text, fontWeight: '600', paddingVertical: 0 },

  // Toggle card (icon + label + switch)
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: C.border,
  },
  toggleCardIconBox: {
    width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  toggleCardLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  toggleCardSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  // Budget card
  budgetCard: {
    marginHorizontal: 16, marginTop: 4, borderRadius: rs(14), paddingHorizontal: 18, paddingVertical: 16,
  },
  budgetCardLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetRupee: { fontFamily: DISPLAY, fontSize: 30, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  budgetInput: { fontFamily: DISPLAY, flex: 1, fontSize: 36, fontWeight: '900', color: '#fff', paddingVertical: 0 },

  // Commission row
  commissionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  commissionLabelCol: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  commissionLabel: { fontSize: 13, fontWeight: '700', color: C.sub },
  commissionInput: {
    width: 56, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.text,
    backgroundColor: C.surface, borderRadius: 8, borderWidth: 1.5, borderColor: C.border,
    paddingVertical: 6,
  },
  commissionBadge: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g300,
  },
  commissionBadgeText: { fontSize: 13, fontWeight: '700', color: C.g700 },

  // Earnings preview
  previewCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 16,
    borderRadius: rs(14), paddingHorizontal: 16, paddingVertical: 14, gap: 8,
    ...cardShadow,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  previewValueWhite: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '800', color: '#fff' },
  previewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },

  // Urgency
  urgencyRow: { flexDirection: 'row', gap: 10, padding: 16 },
  urgencyCard: {
    flex: 1, alignItems: 'center', paddingVertical: 18,
    borderRadius: rs(14), borderWidth: 2, gap: 6,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyLabel: { fontSize: 13, fontWeight: '800' },
  urgencyDesc: { fontSize: 10, textAlign: 'center', fontWeight: '600' },

  // Notes section
  notesSectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  notesIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: C.g50 },
  notesSectionTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '800', color: C.text },
  notesInput: {
    margin: 16,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, height: 100, textAlignVertical: 'top',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: rs(18), marginTop: 4,
    ...cardShadow,
  },
  submitBtnText: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  cancelBtn: {
    alignItems: 'center', paddingVertical: 15, borderRadius: rs(18),
    borderWidth: 2, borderColor: C.border, marginTop: 10,
    backgroundColor: C.surface,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: C.muted },
});
