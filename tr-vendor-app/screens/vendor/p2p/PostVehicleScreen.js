import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Platform,
  KeyboardAvoidingView, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createP2PVehicle, getVendorFleet, getStaffDrivers } from '../../api/client';
import CustomAlert from '../../../components/CustomAlert';

const C = {
  bg: '#F7FAFC', surface: '#FFFFFF', text: '#1E293B', sub: '#475569',
  muted: '#94A3B8', border: '#E2E8F0', brand: '#10B981',
  blue: '#3B82F6', purple: '#8B5CF6', amber: '#F59E0B', red: '#EF4444',
};

const BODY_TYPES = ['Open', 'Closed', 'Container', 'Flatbed', 'Tanker'];
const CAR_CATEGORIES = ['Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury', 'Tempo Traveller'];
const GOODS_OPTIONS = ['General', 'Food', 'Chemicals', 'Electronics', 'Furniture', 'Construction'];

function fmtDate(d) { return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtTime(d) { return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

// Build display name from fleet vehicle object
function getFleetVehicleName(v) {
  if (v.vehicle_models?.brands?.name && v.vehicle_models?.name) {
    return `${v.vehicle_models.brands.name} ${v.vehicle_models.name}`;
  }
  if (v.brands?.name && v.chauffeur_vehicle_categories?.name) {
    return `${v.brands.name} ${v.chauffeur_vehicle_categories.name}`;
  }
  if (v.brands?.name && v.vehicle_models?.name) {
    return `${v.brands.name} ${v.vehicle_models.name}`;
  }
  if (v.brands?.name) return v.brands.name;
  if (v.vehicle_models?.name) return v.vehicle_models.name;
  if (v.chauffeur_vehicle_categories?.name) return v.chauffeur_vehicle_categories.name;
  return v.name || v.vehicleName || 'Vehicle';
}

export default function PostVehicleScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '', actions: [] });
  const showAlert = (type, title, message) => setAlert({ visible: true, type, title, message, actions: [{ label: 'OK', variant: 'primary', onPress: () => hideAlert() }] });
  const hideAlert = () => setAlert(a => ({ ...a, visible: false }));

  // Form state
  const [serviceType, setServiceType] = useState('truck');
  const [vehicleSource, setVehicleSource] = useState('fleet');
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetDropdownOpen, setFleetDropdownOpen] = useState(false);
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('');

  // Route
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  // Dates
  const [departureDate, setDepartureDate] = useState(null);
  const [departureTime, setDepartureTime] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(null);

  // Pricing
  const [fullLoadPrice, setFullLoadPrice] = useState('');
  const [partLoadEnabled, setPartLoadEnabled] = useState(false);
  const [partLoadPrice, setPartLoadPrice] = useState('');

  // Vehicle details
  const [capacity, setCapacity] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [driverIncluded, setDriverIncluded] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [staffDrivers, setStaffDrivers] = useState([]);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [fuelIncluded, setFuelIncluded] = useState(false);
  const [labourAvailable, setLabourAvailable] = useState(false);
  const [labourCount, setLabourCount] = useState('');
  const [goodsAccepted, setGoodsAccepted] = useState([]);
  const [notes, setNotes] = useState('');

  // Fetch fleet vehicles and staff drivers
  useEffect(() => {
    (async () => {
      try {
        const [fleetRes, driverRes] = await Promise.all([
          getVendorFleet({ limit: 100 }).catch(() => ({})),
          getStaffDrivers().catch(() => ({})),
        ]);
        const vehicles = fleetRes?.vehicles || fleetRes?.fleet || [];
        setFleetVehicles(Array.isArray(vehicles) ? vehicles : []);
        setStaffDrivers(driverRes?.drivers || []);
      } catch (e) {
        console.log('[PostVehicle] Fetch error:', e);
        setFleetVehicles([]);
        setStaffDrivers([]);
      } finally { setFleetLoading(false); }
    })();
  }, []);

  // Auto-fill from fleet selection
  useEffect(() => {
    if (vehicleSource === 'fleet' && selectedFleetId) {
      const v = fleetVehicles.find(f => String(f.id) === String(selectedFleetId));
      if (v) {
        setVehicleName(getFleetVehicleName(v));
        setVehicleNumber(v.registrationNumber || '');
      }
    }
  }, [selectedFleetId, vehicleSource, fleetVehicles]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(null);
    if (event.type === 'dismissed' || !selectedDate) return;
    if (showDatePicker === 'departure') setDepartureDate(selectedDate);
    else if (showDatePicker === 'arrival') setArrivalDate(selectedDate);
    if (Platform.OS === 'ios') setShowDatePicker(null);
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (event.type === 'dismissed' || !selectedTime) return;
    if (showTimePicker === 'departure') setDepartureTime(selectedTime);
    else if (showTimePicker === 'arrival') setArrivalTime(selectedTime);
    if (Platform.OS === 'ios') setShowTimePicker(null);
  };

  const toggleGoods = (g) => {
    setGoodsAccepted(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSubmit = async () => {
    if (vehicleSource === 'manual' && !vehicleName.trim()) return showAlert('warning', 'Missing Info', 'Vehicle name is required.');
    if (vehicleSource === 'fleet' && !selectedFleetId) return showAlert('warning', 'Missing Info', 'Please select a vehicle from your fleet.');
    if (!fromCity.trim()) return showAlert('warning', 'Missing Info', 'From City is required.');
    if (!toCity.trim()) return showAlert('warning', 'Missing Info', 'To City is required.');
    if (!departureDate) return showAlert('warning', 'Missing Info', 'Departure date is required.');
    if (!fullLoadPrice.trim() || isNaN(Number(fullLoadPrice)) || Number(fullLoadPrice) <= 0) return showAlert('warning', 'Invalid Price', 'Please enter a valid full load price.');

    setLoading(true);
    try {
      let departureDT = new Date(departureDate);
      if (departureTime) departureDT.setHours(departureTime.getHours(), departureTime.getMinutes(), 0, 0);

      let arrivalDT = null;
      if (arrivalDate) {
        arrivalDT = new Date(arrivalDate);
        if (arrivalTime) arrivalDT.setHours(arrivalTime.getHours(), arrivalTime.getMinutes(), 0, 0);
      }

      const data = {
        serviceType,
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        vehicleCategory: vehicleCategory || undefined,
        vehicleId: vehicleSource === 'fleet' && selectedFleetId ? String(selectedFleetId) : undefined,
        fromCity: fromCity.trim(),
        toCity: toCity.trim(),
        departureDate: departureDT.toISOString(),
        departureTime: departureTime ? `${String(departureTime.getHours()).padStart(2, '0')}:${String(departureTime.getMinutes()).padStart(2, '0')}` : undefined,
        arrivalDate: arrivalDT ? arrivalDT.toISOString() : undefined,
        arrivalTime: arrivalTime ? `${String(arrivalTime.getHours()).padStart(2, '0')}:${String(arrivalTime.getMinutes()).padStart(2, '0')}` : undefined,
        priceFullLoad: Number(fullLoadPrice),
        pricePartLoad: partLoadEnabled && partLoadPrice.trim() ? Number(partLoadPrice) : undefined,
        acceptsPartLoad: partLoadEnabled,
        availableSpace: partLoadEnabled ? undefined : undefined,
        capacity: capacity.trim() || undefined,
        bodyType: serviceType === 'truck' && bodyType ? bodyType : undefined,
        driverIncluded,
        driverName: driverIncluded && driverName.trim() ? driverName.trim() : undefined,
        driverPhone: driverIncluded && driverPhone.trim() ? driverPhone.trim() : undefined,
        fuelIncluded,
        labourAvailable: serviceType === 'truck' ? labourAvailable : undefined,
        labourCount: serviceType === 'truck' && labourAvailable && labourCount.trim() ? Number(labourCount) : undefined,
        goodsAccepted: serviceType === 'truck' && goodsAccepted.length > 0 ? goodsAccepted : undefined,
        notes: notes.trim() || undefined,
      };

      await createP2PVehicle(data);
      setAlert({
        visible: true, type: 'success', title: 'Vehicle Posted!',
        message: 'Your vehicle has been posted to the P2P marketplace.',
        actions: [{ label: 'Done', variant: 'primary', onPress: () => { hideAlert(); navigation.navigate('MyPostingsScreen', { initialTab: 'vehicles' }); } }],
      });
    } catch (err) {
      showAlert('error', 'Failed to Post', err?.response?.data?.error || err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Service Type */}
          <View style={s.section}>
            <SectionHead icon="truck-fast-outline" color={C.brand} bg="#D1FAE5" title="Service Type" />
            <View style={s.chipRow}>
              {[{ value: 'truck', label: 'Truck', icon: 'truck' }, { value: 'car', label: 'Car', icon: 'car' }].map(opt => {
                const active = serviceType === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.typeChip, active && s.typeChipActive]} onPress={() => setServiceType(opt.value)}>
                    <MCI name={opt.icon} size={20} color={active ? C.brand : C.muted} />
                    <Text style={[s.typeChipText, active && s.typeChipTextActive]}>{opt.label}</Text>
                    {active && <View style={s.chipDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Vehicle Selection */}
          <View style={s.section}>
            <SectionHead icon="car-cog" color={C.blue} bg="#DBEAFE" title="Vehicle Selection" />
            <View style={s.chipRow}>
              {[{ value: 'fleet', label: 'From Fleet' }, { value: 'manual', label: 'Manual Entry' }].map(opt => {
                const active = vehicleSource === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.toggleBtn, active && s.toggleBtnActive]}
                    onPress={() => { setVehicleSource(opt.value); setSelectedFleetId(''); setVehicleName(''); setVehicleNumber(''); }}>
                    <Text style={[s.toggleBtnText, active && s.toggleBtnTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {vehicleSource === 'fleet' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>Select Vehicle</Text>
                {fleetLoading ? <ActivityIndicator size="small" color={C.brand} style={{ marginVertical: 12 }} /> :
                  fleetVehicles.length === 0 ? (
                    <View style={s.emptyFleet}>
                      <MCI name="car-off" size={24} color={C.muted} />
                      <Text style={s.emptyFleetText}>No vehicles in your fleet.</Text>
                      <TouchableOpacity onPress={() => setVehicleSource('manual')}>
                        <Text style={[s.emptyFleetText, { color: C.brand, fontWeight: '700', marginTop: 4 }]}>Enter manually instead</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {/* Dropdown Trigger */}
                      <TouchableOpacity style={[s.dropdownBtn, selectedFleetId && s.dropdownBtnActive]} onPress={() => setFleetDropdownOpen(true)}>
                        <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={18} color={selectedFleetId ? C.brand : C.muted} />
                        <View style={{ flex: 1 }}>
                          {selectedFleetId ? (
                            <>
                              <Text style={s.dropdownValue} numberOfLines={1}>{vehicleName || 'Selected'}</Text>
                              {vehicleNumber ? <Text style={s.dropdownSub} numberOfLines={1}>{vehicleNumber}</Text> : null}
                            </>
                          ) : (
                            <Text style={s.dropdownPlaceholder}>Tap to select vehicle</Text>
                          )}
                        </View>
                        <Icon name="chevron-down" size={18} color={C.muted} />
                      </TouchableOpacity>

                      {/* Selected vehicle info (read-only) */}
                      {selectedFleetId && (
                        <View style={s.selectedCard}>
                          <View style={s.selectedCardRow}>
                            <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={22} color={C.brand} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.selectedCardName}>{vehicleName || 'Vehicle'}</Text>
                              {vehicleNumber ? <Text style={s.selectedCardNum}>{vehicleNumber}</Text> : null}
                            </View>
                            <TouchableOpacity onPress={() => { setSelectedFleetId(''); setVehicleName(''); setVehicleNumber(''); }} style={s.selectedCardClear}>
                              <Icon name="x" size={14} color={C.muted} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>Vehicle Name *</Text>
                <TextInput style={s.input} placeholder="e.g. Tata Ace, Innova Crysta" placeholderTextColor={C.muted} value={vehicleName} onChangeText={setVehicleName} />
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Vehicle Number</Text>
                <TextInput style={s.input} placeholder="e.g. MH-04-AB-1234" placeholderTextColor={C.muted} value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
              </View>
            )}

            {/* Car category */}
            {serviceType === 'car' && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>Vehicle Category</Text>
                <View style={s.chipGrid}>
                  {CAR_CATEGORIES.map(cat => {
                    const active = vehicleCategory === cat;
                    return (
                      <TouchableOpacity key={cat} style={[s.optionChip, active && s.optionChipActive]} onPress={() => setVehicleCategory(active ? '' : cat)}>
                        <Text style={[s.optionChipText, active && s.optionChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Route & Dates */}
          <View style={s.section}>
            <SectionHead icon="map-pin" color={C.purple} bg="#EDE9FE" title="Route & Dates" feather />
            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>From City *</Text>
                <TextInput style={s.input} placeholder="e.g. Mumbai" placeholderTextColor={C.muted} value={fromCity} onChangeText={setFromCity} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>To City *</Text>
                <TextInput style={s.input} placeholder="e.g. Delhi" placeholderTextColor={C.muted} value={toCity} onChangeText={setToCity} />
              </View>
            </View>

            <View style={[s.rowFields, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Departure Date *</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker('departure')}>
                  <Icon name="calendar" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, departureDate && { color: C.text }]}>{departureDate ? fmtDate(departureDate) : 'Select date'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Departure Time</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowTimePicker('departure')}>
                  <Icon name="clock" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, departureTime && { color: C.text }]}>{departureTime ? fmtTime(departureTime) : 'Set time'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.rowFields, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Arrival Date</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker('arrival')}>
                  <Icon name="calendar" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, arrivalDate && { color: C.text }]}>{arrivalDate ? fmtDate(arrivalDate) : 'Optional'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Arrival Time</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowTimePicker('arrival')}>
                  <Icon name="clock" size={16} color={C.muted} />
                  <Text style={[s.dateBtnText, arrivalTime && { color: C.text }]}>{arrivalTime ? fmtTime(arrivalTime) : 'Optional'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={s.section}>
            <SectionHead icon="currency-inr" color={C.amber} bg="#FEF3C7" title="Pricing" />
            <Text style={s.fieldLabel}>{serviceType === 'car' ? 'Trip Price *' : 'Full Load Price *'}</Text>
            <View style={s.priceRow}>
              <View style={s.pricePrefix}><Text style={s.pricePrefixText}>{'\u20B9'}</Text></View>
              <TextInput style={[s.input, s.priceInput]} placeholder="0" placeholderTextColor={C.muted} value={fullLoadPrice} onChangeText={setFullLoadPrice} keyboardType="number-pad" />
            </View>

            {serviceType === 'truck' && (
              <>
                <View style={[s.switchRow, { marginTop: 16 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Part Load Available</Text>
                    <Text style={s.switchSub}>Allow partial cargo bookings</Text>
                  </View>
                  <Switch value={partLoadEnabled} onValueChange={setPartLoadEnabled} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={partLoadEnabled ? C.brand : '#f4f4f5'} />
                </View>
                {partLoadEnabled && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.fieldLabel}>Part Load Price</Text>
                    <View style={s.priceRow}>
                      <View style={s.pricePrefix}><Text style={s.pricePrefixText}>{'\u20B9'}</Text></View>
                      <TextInput style={[s.input, s.priceInput]} placeholder="0" placeholderTextColor={C.muted} value={partLoadPrice} onChangeText={setPartLoadPrice} keyboardType="number-pad" />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Vehicle Details */}
          <View style={s.section}>
            <SectionHead icon="cog-outline" color={C.blue} bg="#DBEAFE" title="Vehicle Details" />
            <Text style={s.fieldLabel}>{serviceType === 'truck' ? 'Capacity (Tonnage)' : 'Seating Capacity'}</Text>
            <TextInput style={s.input} placeholder={serviceType === 'truck' ? 'e.g. 9 (in tonnes)' : 'e.g. 5'} placeholderTextColor={C.muted} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />

            {serviceType === 'truck' && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>Body Type</Text>
                <View style={s.chipGrid}>
                  {BODY_TYPES.map(bt => {
                    const active = bodyType === bt;
                    return (
                      <TouchableOpacity key={bt} style={[s.optionChip, active && s.optionChipActive]} onPress={() => setBodyType(active ? '' : bt)}>
                        <Text style={[s.optionChipText, active && s.optionChipTextActive]}>{bt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Driver */}
            <View style={[s.switchRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchLabel}>Driver Included</Text>
                <Text style={s.switchSub}>Vehicle comes with a driver</Text>
              </View>
              <Switch value={driverIncluded} onValueChange={setDriverIncluded} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={driverIncluded ? C.brand : '#f4f4f5'} />
            </View>

            {driverIncluded && (
              <View style={{ marginTop: 12, gap: 10 }}>
                {/* Driver dropdown */}
                {staffDrivers.length > 0 && (
                  <>
                    <Text style={s.fieldLabel}>Select from Staff</Text>
                    <TouchableOpacity style={[s.dropdownBtn, driverName && s.dropdownBtnActive]} onPress={() => setDriverDropdownOpen(true)}>
                      <MCI name="account" size={18} color={driverName ? C.brand : C.muted} />
                      <View style={{ flex: 1 }}>
                        {driverName ? (
                          <>
                            <Text style={s.dropdownValue}>{driverName}</Text>
                            {driverPhone ? <Text style={s.dropdownSub}>{driverPhone}</Text> : null}
                          </>
                        ) : (
                          <Text style={s.dropdownPlaceholder}>Tap to select driver</Text>
                        )}
                      </View>
                      <Icon name="chevron-down" size={18} color={C.muted} />
                    </TouchableOpacity>
                  </>
                )}
                <View style={s.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Driver Name</Text>
                    <TextInput style={s.input} placeholder="Enter name" placeholderTextColor={C.muted} value={driverName} onChangeText={setDriverName} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Driver Phone</Text>
                    <TextInput style={s.input} placeholder="Enter phone" placeholderTextColor={C.muted} value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />
                  </View>
                </View>
              </View>
            )}

            {/* Fuel */}
            <View style={[s.switchRow, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchLabel}>Fuel Included</Text>
                <Text style={s.switchSub}>Fuel cost covered in price</Text>
              </View>
              <Switch value={fuelIncluded} onValueChange={setFuelIncluded} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={fuelIncluded ? C.brand : '#f4f4f5'} />
            </View>

            {/* Truck-specific: Labour & Goods */}
            {serviceType === 'truck' && (
              <>
                <View style={[s.switchRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Labour Available</Text>
                    <Text style={s.switchSub}>Loading / unloading labour</Text>
                  </View>
                  <Switch value={labourAvailable} onValueChange={setLabourAvailable} trackColor={{ false: C.border, true: C.brand + '55' }} thumbColor={labourAvailable ? C.brand : '#f4f4f5'} />
                </View>
                {labourAvailable && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={s.fieldLabel}>Number of Labourers</Text>
                    <TextInput style={s.input} placeholder="e.g. 2" placeholderTextColor={C.muted} value={labourCount} onChangeText={setLabourCount} keyboardType="number-pad" />
                  </View>
                )}

                <View style={{ marginTop: 14 }}>
                  <Text style={s.fieldLabel}>Goods Accepted</Text>
                  <View style={s.chipGrid}>
                    {GOODS_OPTIONS.map(g => {
                      const active = goodsAccepted.includes(g);
                      return (
                        <TouchableOpacity key={g} style={[s.optionChip, active && s.optionChipActive]} onPress={() => toggleGoods(g)}>
                          <Text style={[s.optionChipText, active && s.optionChipTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Notes */}
          <View style={s.section}>
            <SectionHead icon="file-text" color={C.sub} bg="#F1F5F9" title="Additional Notes" feather />
            <TextInput style={[s.input, s.textArea]} placeholder="Any special instructions, route details, or remarks..." placeholderTextColor={C.muted} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
          </View>

          {/* Submit */}
          <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : (
              <><Icon name="check" size={20} color="#fff" /><Text style={s.submitBtnText}>Post Vehicle</Text></>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'departure' ? departureDate || new Date() : arrivalDate || departureDate || new Date()}
          mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={showDatePicker === 'arrival' && departureDate ? departureDate : new Date()}
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'departure' ? departureTime || new Date() : arrivalTime || new Date()}
          mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      {/* Fleet Dropdown Modal */}
      <Modal visible={fleetDropdownOpen} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFleetDropdownOpen(false)}>
          <TouchableOpacity style={s.modalContent} activeOpacity={1} onPress={() => {}}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setFleetDropdownOpen(false)} style={s.modalCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>{fleetVehicles.length} vehicles in your fleet</Text>
            <FlatList
              data={fleetVehicles}
              keyExtractor={item => String(item.id)}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item: v }) => {
                const id = String(v.id);
                const active = selectedFleetId === id;
                const name = getFleetVehicleName(v);
                const reg = v.registrationNumber || '';
                const category = v.chauffeur_vehicle_categories?.name || v.vehicle_models?.chauffeur_vehicle_categories?.name || '';
                return (
                  <TouchableOpacity
                    style={[s.fleetDropItem, active && s.fleetDropItemActive]}
                    onPress={() => { setSelectedFleetId(id); setFleetDropdownOpen(false); }}
                  >
                    <View style={[s.fleetDropIcon, active && { backgroundColor: '#D1FAE5' }]}>
                      <MCI name={serviceType === 'truck' ? 'truck' : 'car'} size={22} color={active ? C.brand : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.fleetDropName, active && { color: C.brand }]} numberOfLines={1}>{name}</Text>
                      {!!reg && <Text style={s.fleetDropReg}>{reg}</Text>}
                      {!!category && <Text style={s.fleetDropCategory}>{category}</Text>}
                    </View>
                    {active && <Icon name="check-circle" size={18} color={C.brand} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.muted, padding: 20 }}>No vehicles found</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Driver Dropdown Modal */}
      <Modal visible={driverDropdownOpen} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setDriverDropdownOpen(false)}>
          <TouchableOpacity style={s.modalContent} activeOpacity={1} onPress={() => {}}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Driver</Text>
              <TouchableOpacity onPress={() => setDriverDropdownOpen(false)} style={s.modalCloseBtn}>
                <Icon name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>{staffDrivers.length} drivers available</Text>
            <FlatList
              data={staffDrivers}
              keyExtractor={item => String(item.id)}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item: d }) => {
                const active = driverName === (d.name || '');
                return (
                  <TouchableOpacity
                    style={[s.fleetDropItem, active && s.fleetDropItemActive]}
                    onPress={() => {
                      setDriverName(d.name || '');
                      setDriverPhone(d.phone || '');
                      setDriverDropdownOpen(false);
                    }}
                  >
                    <MCI name="account" size={20} color={active ? C.brand : C.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.fleetDropName, active && { color: C.brand }]}>{d.name || 'Driver'}</Text>
                      {!!d.phone && <Text style={s.fleetDropReg}>{d.phone}</Text>}
                    </View>
                    {active && <Icon name="check-circle" size={18} color={C.brand} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: C.muted, padding: 20 }}>No drivers found</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={hideAlert} actions={alert.actions} />
    </SafeAreaView>
  );
}

function SectionHead({ icon, color, bg, title, feather }) {
  const IC = feather ? Icon : MCI;
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: bg }]}><IC name={icon} size={16} color={color} /></View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.brand },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scroll: { padding: 16, gap: 14 },

  section: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },

  chipRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface },
  typeChipActive: { borderColor: C.brand, backgroundColor: '#ECFDF5' },
  typeChipText: { fontSize: 14, fontWeight: '700', color: C.muted },
  typeChipTextActive: { color: C.brand },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand },

  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center' },
  toggleBtnActive: { borderColor: C.blue, backgroundColor: '#EFF6FF' },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: C.muted },
  toggleBtnTextActive: { color: C.blue },

  emptyFleet: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  emptyFleetText: { fontSize: 13, color: C.muted },

  // Dropdown fleet picker
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: '#F8FAFC' },
  dropdownBtnActive: { borderColor: C.brand, backgroundColor: '#ECFDF5' },
  dropdownValue: { fontSize: 14, fontWeight: '600', color: C.text },
  dropdownSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  dropdownPlaceholder: { fontSize: 14, color: C.muted },
  // Selected vehicle card (read-only)
  selectedCard: { marginTop: 10, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: C.brand },
  selectedCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedCardName: { fontSize: 15, fontWeight: '700', color: C.text },
  selectedCardNum: { fontSize: 12, color: C.blue, fontFamily: 'monospace', marginTop: 2 },
  selectedCardClear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  // Fleet dropdown modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '65%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  modalSub: { fontSize: 13, color: C.muted, marginBottom: 12 },
  fleetDropItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#F8FAFC', marginBottom: 8 },
  fleetDropItemActive: { borderColor: C.brand, backgroundColor: '#ECFDF5', borderWidth: 2 },
  fleetDropIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  fleetDropName: { fontSize: 14, fontWeight: '700', color: C.text },
  fleetDropReg: { fontSize: 12, color: C.blue, fontFamily: 'monospace', marginTop: 2 },
  fleetDropCategory: { fontSize: 11, color: C.muted, marginTop: 1 },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  textArea: { height: 90, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 12, marginTop: 4 },

  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  dateBtnText: { fontSize: 14, color: C.muted },

  priceRow: { flexDirection: 'row', alignItems: 'stretch' },
  pricePrefix: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 14, borderRightWidth: 0 },
  pricePrefixText: { fontSize: 16, fontWeight: '700', color: C.sub },
  priceInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  switchSub: { fontSize: 12, color: C.muted, marginTop: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface },
  optionChipActive: { borderColor: C.brand, backgroundColor: '#ECFDF5' },
  optionChipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  optionChipTextActive: { color: C.brand },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.brand, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: C.border, marginTop: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
});
