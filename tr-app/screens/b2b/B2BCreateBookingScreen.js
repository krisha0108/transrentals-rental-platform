import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Platform,
  Dimensions, Modal, FlatList,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { b2bService } from '../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../utils/dateValidation';
import BookingAlertModal from '../utils/AdvanceBookingAlert';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const SERVICE_TYPES = [
  { value: 'car', label: 'Car', icon: 'truck' },
  { value: 'bus', label: 'Bus', icon: 'truck' },
  { value: 'self-drive', label: 'Self Drive', icon: 'navigation' },
];

const TRIP_TYPES = [
  { value: 'ONE_WAY', label: 'One Way' },
  { value: 'ROUND_TRIP', label: 'Round Trip' },
  { value: 'HOURLY', label: 'Hourly' },
];

const VEHICLE_CATEGORIES = ['Sedan', 'SUV', 'Hatchback', 'Tempo Traveller', 'Mini Bus', 'Luxury', 'Other'];

export default function B2BCreateBookingScreen({ navigation }) {
  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null); // 'scheduled' | 'return'
  const [showTimePicker, setShowTimePicker] = useState(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [form, setForm] = useState({
    serviceType: '',
    vehiclesRequired: '1',
    passengerCount: '',
    vehicleCategory: '',
    tripType: 'ONE_WAY',
    pickupLocation: '',
    dropLocation: '',
    scheduledDate: new Date(),
    scheduledTime: new Date(),
    returnDate: null,
    returnTime: null,
    specialNotes: '',
  });

  useEffect(() => {
    (async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) setCustomer(JSON.parse(data));
    })();
  }, []);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const formatDate = (d) => d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date';
  const formatTime = (t) => t ? t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Select Time';

  const handleSubmit = async () => {
    if (!form.serviceType) return Alert.alert('Error', 'Please select a service type.');
    if (!form.pickupLocation) return Alert.alert('Error', 'Please enter pickup location.');
    if (!form.vehiclesRequired || parseInt(form.vehiclesRequired) < 1) return Alert.alert('Error', 'Enter valid vehicle count.');

    // 12-hour advance booking validation
    const scheduledDateTime = new Date(form.scheduledDate);
    scheduledDateTime.setHours(form.scheduledTime.getHours(), form.scheduledTime.getMinutes(), 0, 0);
    if (isPickupTooSoon(scheduledDateTime)) {
      setShowBookingAlert(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: customer?.id,
        customerName: customer?.name,
        customerEmail: customer?.email,
        customerPhone: customer?.phone,
        companyName: customer?.companyName,
        serviceType: form.serviceType,
        vehiclesRequired: parseInt(form.vehiclesRequired),
        passengerCount: form.passengerCount ? parseInt(form.passengerCount) : null,
        vehicleCategory: form.vehicleCategory || null,
        tripType: form.tripType,
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation || null,
        scheduledDate: form.scheduledDate.toISOString().split('T')[0],
        scheduledTime: formatTime(form.scheduledTime),
        returnDate: form.returnDate ? form.returnDate.toISOString().split('T')[0] : null,
        returnTime: form.returnTime ? formatTime(form.returnTime) : null,
        specialNotes: form.specialNotes || null,
      };

      const response = await b2bService.createBooking(payload);
      if (response.booking || response.success) {
        Alert.alert('Booking Created!', `Booking ${response.booking?.bookingNumber || ''} created successfully. Vendors will be notified.`, [
          { text: 'View Booking', onPress: () => navigation.replace('B2BBookingDetail', { bookingId: response.booking?.id }) },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create booking');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderPickerModal = (visible, onClose, data, onSelect, title, selectedValue, isObject = false) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Icon name="x" size={scale(24)} color="#333" /></TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => isObject ? item.value : item}
            renderItem={({ item }) => {
              const val = isObject ? item.value : item;
              const label = isObject ? item.label : item;
              const isSelected = selectedValue === val;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => { onSelect(val); onClose(); }}
                >
                  <Text style={[styles.modalItemText, isSelected && { color: '#22C55E', fontWeight: '600' }]}>{label}</Text>
                  {isSelected && <Icon name="check" size={scale(18)} color="#22C55E" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create B2B Booking</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bottomOffset={20}>

          {/* Service Type */}
          <Text style={styles.label}>Service Type *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowServicePicker(true)}>
            <Icon name="truck" size={scale(18)} color="#666" />
            <Text style={[styles.pickerText, form.serviceType && { color: '#333' }]}>
              {SERVICE_TYPES.find(s => s.value === form.serviceType)?.label || 'Select Service'}
            </Text>
            <Icon name="chevron-down" size={scale(18)} color="#666" />
          </TouchableOpacity>

          {/* Vehicles Required */}
          <Text style={styles.label}>Vehicles Required *</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleChange('vehiclesRequired', String(Math.max(1, parseInt(form.vehiclesRequired || '1') - 1)))}
            >
              <Icon name="minus" size={scale(18)} color="#333" />
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={form.vehiclesRequired}
              onChangeText={(t) => handleChange('vehiclesRequired', t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleChange('vehiclesRequired', String(parseInt(form.vehiclesRequired || '0') + 1))}
            >
              <Icon name="plus" size={scale(18)} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Passenger Count */}
          <Text style={styles.label}>Passenger Count</Text>
          <View style={styles.inputBox}>
            <Icon name="users" size={scale(18)} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Total passengers"
              value={form.passengerCount}
              onChangeText={(t) => handleChange('passengerCount', t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
          </View>

          {/* Vehicle Category */}
          <Text style={styles.label}>Vehicle Category</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)}>
            <Icon name="grid" size={scale(18)} color="#666" />
            <Text style={[styles.pickerText, form.vehicleCategory && { color: '#333' }]}>
              {form.vehicleCategory || 'Select Category'}
            </Text>
            <Icon name="chevron-down" size={scale(18)} color="#666" />
          </TouchableOpacity>

          {/* Trip Type */}
          <Text style={styles.label}>Trip Type *</Text>
          <View style={styles.tripTypeRow}>
            {TRIP_TYPES.map((tt) => (
              <TouchableOpacity
                key={tt.value}
                style={[styles.tripTypeBtn, form.tripType === tt.value && styles.tripTypeBtnActive]}
                onPress={() => handleChange('tripType', tt.value)}
              >
                <Text style={[styles.tripTypeText, form.tripType === tt.value && styles.tripTypeTextActive]}>
                  {tt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pickup Location */}
          <Text style={styles.label}>Pickup Location *</Text>
          <View style={styles.inputBox}>
            <Icon name="map-pin" size={scale(18)} color="#22C55E" />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={form.pickupLocation}
              onChangeText={(t) => handleChange('pickupLocation', t)}
              placeholderTextColor="#999"
            />
          </View>

          {/* Drop Location */}
          <Text style={styles.label}>Drop Location</Text>
          <View style={styles.inputBox}>
            <Icon name="map-pin" size={scale(18)} color="#EF4444" />
            <TextInput
              style={styles.input}
              placeholder="Enter drop location"
              value={form.dropLocation}
              onChangeText={(t) => handleChange('dropLocation', t)}
              placeholderTextColor="#999"
            />
          </View>

          {/* Scheduled Date & Time */}
          <View style={styles.dateTimeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker('scheduled')}>
                <Icon name="calendar" size={scale(16)} color="#666" />
                <Text style={styles.pickerText}>{formatDate(form.scheduledDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: scale(10) }}>
              <Text style={styles.label}>Time *</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker('scheduled')}>
                <Icon name="clock" size={scale(16)} color="#666" />
                <Text style={styles.pickerText}>{formatTime(form.scheduledTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Return Date & Time (for round trip) */}
          {form.tripType === 'ROUND_TRIP' && (
            <View style={styles.dateTimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Return Date</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker('return')}>
                  <Icon name="calendar" size={scale(16)} color="#666" />
                  <Text style={styles.pickerText}>{form.returnDate ? formatDate(form.returnDate) : 'Select'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={styles.label}>Return Time</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker('return')}>
                  <Icon name="clock" size={scale(16)} color="#666" />
                  <Text style={styles.pickerText}>{form.returnTime ? formatTime(form.returnTime) : 'Select'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Special Notes */}
          <Text style={styles.label}>Special Notes</Text>
          <View style={[styles.inputBox, { height: scale(90), alignItems: 'flex-start', paddingTop: scale(12) }]}>
            <Icon name="edit-3" size={scale(18)} color="#666" style={{ marginTop: scale(2) }} />
            <TextInput
              style={[styles.input, { height: scale(70), textAlignVertical: 'top' }]}
              placeholder="Any special requirements..."
              value={form.specialNotes}
              onChangeText={(t) => handleChange('specialNotes', t)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { backgroundColor: '#A9A9A9' }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.submitText}>Creating Booking...</Text>
                <ActivityIndicator size="small" color="#fff" style={{ marginLeft: scale(8) }} />
              </View>
            ) : (
              <>
                <Icon name="check-circle" size={scale(20)} color="#fff" />
                <Text style={styles.submitText}>Create Booking</Text>
              </>
            )}
          </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'return' ? (form.returnDate || new Date()) : form.scheduledDate}
          mode="date"
          minimumDate={getMinBookingDate()}
          onChange={(e, date) => {
            setShowDatePicker(null);
            if (date) handleChange(showDatePicker === 'return' ? 'returnDate' : 'scheduledDate', date);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'return' ? (form.returnTime || new Date()) : form.scheduledTime}
          mode="time"
          onChange={(e, time) => {
            setShowTimePicker(null);
            if (time) handleChange(showTimePicker === 'return' ? 'returnTime' : 'scheduledTime', time);
          }}
        />
      )}

      {/* Picker Modals */}
      {renderPickerModal(showServicePicker, () => setShowServicePicker(false), SERVICE_TYPES, (v) => handleChange('serviceType', v), 'Select Service Type', form.serviceType, true)}
      {renderPickerModal(showTripPicker, () => setShowTripPicker(false), TRIP_TYPES, (v) => handleChange('tripType', v), 'Select Trip Type', form.tripType, true)}
      {renderPickerModal(showCategoryPicker, () => setShowCategoryPicker(false), VEHICLE_CATEGORIES, (v) => handleChange('vehicleCategory', v), 'Vehicle Category', form.vehicleCategory, false)}
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    paddingTop: Platform.OS === 'android' ? scale(10) : scale(14),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: scale(16), paddingBottom: scale(100) },
  label: { fontSize: scale(13), fontWeight: '600', color: '#444', marginBottom: scale(6), marginTop: scale(14) },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: scale(12), paddingHorizontal: scale(14), height: scale(50),
    borderWidth: 1, borderColor: '#E9ECEF',
  },
  input: { flex: 1, fontSize: scale(14), color: '#333', marginLeft: scale(10) },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: scale(12), paddingHorizontal: scale(14), height: scale(50),
    borderWidth: 1, borderColor: '#E9ECEF',
  },
  pickerText: { flex: 1, fontSize: scale(14), color: '#999', marginLeft: scale(10) },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  counterBtn: {
    width: scale(44), height: scale(44), borderRadius: scale(12),
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  counterInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: scale(12), height: scale(50),
    fontSize: scale(18), fontWeight: '700', color: '#333',
    borderWidth: 1, borderColor: '#E9ECEF',
  },
  tripTypeRow: { flexDirection: 'row', gap: scale(8) },
  tripTypeBtn: {
    flex: 1, paddingVertical: scale(12), borderRadius: scale(10),
    backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#E9ECEF',
  },
  tripTypeBtnActive: { backgroundColor: '#F0FFF4', borderColor: '#22C55E' },
  tripTypeText: { fontSize: scale(13), fontWeight: '600', color: '#666' },
  tripTypeTextActive: { color: '#22C55E' },
  dateTimeRow: { flexDirection: 'row', marginTop: scale(4) },
  submitBtn: {
    backgroundColor: '#22C55E', height: scale(54), borderRadius: scale(14),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: scale(24), gap: scale(8),
  },
  submitText: { fontSize: scale(16), color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), maxHeight: '50%', paddingBottom: scale(30) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(16), borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: scale(18), fontWeight: '700', color: '#333' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(16), borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  modalItemActive: { backgroundColor: '#F0FFF4' },
  modalItemText: { fontSize: scale(15), color: '#333' },
});
