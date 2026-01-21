import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bookingService from '../../services/bookingService';
import locationService from '../../services/locationService';
import api from '../../api';

const GREEN = '#09B368';
const BRAND_TEAL = '#0B6E4F';

const TRIP_TYPES = [
  {
    id: 'outstation',
    label: 'Outstation',
    icon: 'navigate-outline',
    desc: 'Intercity travel',
    color: '#3B82F6',
  },
  {
    id: 'local',
    label: 'Local',
    icon: 'location-outline',
    desc: 'Within city',
    color: '#10B981',
  },
  {
    id: 'pilgrimage',
    label: 'Pilgrimage',
    icon: 'star-outline',
    desc: 'Religious tours',
    color: '#F59E0B',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    icon: 'heart-outline',
    desc: 'Special occasions',
    color: '#EC4899',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    icon: 'briefcase-outline',
    desc: 'Business travel',
    color: '#8B5CF6',
  },
  {
    id: 'school',
    label: 'School Trip',
    icon: 'school-outline',
    desc: 'Educational tours',
    color: '#EF4444',
  },
];

export default function BusRentalFleetScreen() {
  const navigation = useNavigation();

  // Current step in the flow
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(7);

  // Form data
  const [tripType, setTripType] = useState('');
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const [passengers, setPassengers] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnDate, setReturnDate] = useState(new Date());
  const [returnTime, setReturnTime] = useState('10:00 AM');
  const [requirements, setRequirements] = useState('');
  const [needAC, setNeedAC] = useState(true);
  const [needLuxury, setNeedLuxury] = useState(false);
  const [needSleeper, setNeedSleeper] = useState(false);

  // Location search
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);

  // Submission
  const [customer, setCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRequestId, setConfirmedRequestId] = useState(null);

  // Phone collection
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    loadCustomer();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [step]);

  useEffect(() => {
    // Update total steps based on trip type
    if (tripType === 'local') {
      setTotalSteps(6); // No destination needed
    } else {
      setTotalSteps(7);
    }
  }, [tripType]);

  const loadCustomer = async () => {
    const customerData = await AsyncStorage.getItem('customer');
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }
  };

  const handleBackPress = () => {
    if (step === 8) {
      // On confirmation screen, go to dashboard
      navigation.navigate('CustomerDashboard');
      return true;
    } else if (step > 1) {
      setStep(step - 1);
      return true;
    }
    return false;
  };

  // Location search with debounce
  useEffect(() => {
    if (fromSearch.length >= 2) {
      const timer = setTimeout(() => searchLocations('from', fromSearch), 300);
      return () => clearTimeout(timer);
    } else {
      setFromResults([]);
    }
  }, [fromSearch]);

  useEffect(() => {
    if (toSearch.length >= 2) {
      const timer = setTimeout(() => searchLocations('to', toSearch), 300);
      return () => clearTimeout(timer);
    } else {
      setToResults([]);
    }
  }, [toSearch]);

  const searchLocations = async (type, query) => {
    if (type === 'from') setSearchingFrom(true);
    else setSearchingTo(true);

    try {
      // Use bus-specific location search
      const response = await locationService.searchBusLocations(query);

      if (response.success) {
        const locations = response.locations || [];
        if (type === 'from') {
          setFromResults(locations);
        } else {
          setToResults(locations);
        }

        // Show message if no locations found
        if (locations.length === 0 && query.length >= 2) {
          Alert.alert(
            'Location Not Available',
            'This location is not currently available for bus rental service. We will be available soon in more locations.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error searching bus locations:', error);
      Alert.alert(
        'Error',
        'Failed to search locations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (type === 'from') setSearchingFrom(false);
      else setSearchingTo(false);
    }
  };

  const selectLocation = (type, location) => {
    if (type === 'from') {
      setFromLocation(location);
      setFromSearch(location.name);
      setFromResults([]);
    } else {
      setToLocation(location);
      setToSearch(location.name);
      setToResults([]);
    }
  };

  const openDatePicker = (type) => {
    const currentDate = type === 'pickup' ? pickupDate : returnDate;
    // For return date, minimum date should be pickup date
    // For pickup date, minimum date should be today
    const minDate = type === 'return' ? pickupDate : new Date();

    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          if (type === 'pickup') {
            setPickupDate(selectedDate);
            // If pickup date is after current return date, update return date too
            if (selectedDate > returnDate) {
              setReturnDate(selectedDate);
            }
          } else {
            setReturnDate(selectedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: false,
      minimumDate: minDate,
    });
  };

  const openTimePicker = (type) => {
    const currentDate = type === 'pickup' ? pickupDate : returnDate;
    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          const hours = selectedDate.getHours();
          const minutes = selectedDate.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const formattedHours = hours % 12 || 12;
          const formattedMinutes = minutes.toString().padStart(2, '0');
          const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

          if (type === 'pickup') {
            setPickupTime(timeString);
          } else {
            setReturnTime(timeString);
          }
        }
      },
      mode: 'time',
      is24Hour: false,
    });
  };

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !tripType) {
      Alert.alert('Required', 'Please select a trip type');
      return;
    }
    if (step === 2 && !fromLocation && !fromSearch.trim()) {
      Alert.alert('Required', 'Please enter pickup location');
      return;
    }
    if (step === 3 && !toLocation && !toSearch.trim()) {
      Alert.alert('Required', 'Please enter drop location');
      return;
    }
    if (step === 4 && (!passengers || parseInt(passengers) < 1)) {
      Alert.alert('Required', 'Please enter number of passengers');
      return;
    }

    // Move to next step
    if (step === 7) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!customer) {
      Alert.alert('Login Required', 'Please login to submit quote request');
      return;
    }

    // Check if phone number is missing
    if (!customer.phone || customer.phone.trim() === '') {
      setShowPhoneModal(true);
      return;
    }

    setSubmitting(true);
    try {
      let tripDays = 1;
      if (returnDate && pickupDate && tripType !== 'local') {
        const diff = returnDate.getTime() - pickupDate.getTime();
        tripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const requestData = {
        customerId: customer.id,
        customerName: customer.name || customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        tripType,
        vehicleCategory: null,
        vehicleCategoryName: 'Standard Bus',
        passengers: parseInt(passengers),
        pickupCity: fromLocation?.name || fromSearch || null,
        pickupAddress: fromLocation?.name || fromSearch || null,
        pickupDate: pickupDate.toISOString().split('T')[0],
        pickupTime,
        dropCity: toLocation?.name || toSearch || null,
        dropAddress: toLocation?.name || toSearch || null,
        returnDate: returnDate ? returnDate.toISOString().split('T')[0] : null,
        returnTime: returnTime || null,
        tripDays,
        requirements: requirements || null,
        needAC,
        needLuxury,
        needSleeper,
        budgetMin: null,
        budgetMax: null,
      };

      const response = await bookingService.createBusQuoteRequest(requestData);

      if (response.success || response.quoteRequest || response.id) {
        setConfirmedRequestId(response.quoteRequest?.id || response.id || 'unknown');
        setStep(8); // Confirmation step
      }
    } catch (error) {
      console.error('Quote request error:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Validate phone number (basic validation for 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneLoading(true);

    try {
      // Update phone via API
      const response = await api.put('/customer/profile', {
        customerId: customer.id,
        phone: phoneNumber.trim(),
      });

      if (response.data.success) {
        // Update local storage and state
        const updatedCustomer = { ...customer, phone: phoneNumber.trim() };
        setCustomer(updatedCustomer);
        await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));

        // Close phone modal and proceed with booking
        setShowPhoneModal(false);
        setPhoneNumber('');

        // Retry submission
        handleSubmit();
      }
    } catch (error) {
      console.error('Phone update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update phone number. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // STEP 1: Trip Type Selection
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="bus" size={40} color={GREEN} />
        <Text style={styles.questionTitle}>What service do you need?</Text>
        <Text style={styles.questionSubtitle}>Choose your trip type</Text>
      </View>

      <View style={styles.tripTypeGrid}>
        {TRIP_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.tripTypeCard,
              tripType === type.id && { ...styles.tripTypeCardActive, borderColor: type.color },
            ]}
            onPress={() => setTripType(type.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.tripTypeIcon,
                { backgroundColor: tripType === type.id ? type.color : type.color + '20' },
              ]}
            >
              <Ionicons
                name={type.icon}
                size={28}
                color={tripType === type.id ? '#fff' : type.color}
              />
            </View>
            <Text style={[styles.tripTypeLabel, tripType === type.id && styles.tripTypeLabelActive]}>
              {type.label}
            </Text>
            <Text style={styles.tripTypeDesc}>{type.desc}</Text>
            {tripType === type.id && (
              <View style={[styles.checkmark, { backgroundColor: type.color }]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // STEP 2: Pickup Location
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="location" size={40} color={GREEN} />
        <Text style={styles.questionTitle}>Where will you start your journey?</Text>
        <Text style={styles.questionSubtitle}>Enter pickup location or select from suggestions</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={fromSearch}
            onChangeText={setFromSearch}
            placeholder="Type pickup city or place name..."
            placeholderTextColor="#999"
          />
          {searchingFrom && <ActivityIndicator size="small" color={GREEN} />}
          {fromSearch && !fromLocation && (
            <TouchableOpacity onPress={() => setFromSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {fromResults.length > 0 && !fromLocation && (
          <View style={styles.dropdown}>
            {fromResults.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.dropdownItem}
                onPress={() => selectLocation('from', loc)}
              >
                <Ionicons name="location-outline" size={18} color={GREEN} />
                <Text style={styles.dropdownText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {fromLocation && (
          <View style={styles.selectedLocation}>
            <Ionicons name="checkmark-circle" size={24} color={GREEN} />
            <Text style={styles.selectedLocationText}>{fromLocation.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setFromLocation(null);
                setFromSearch('');
                setFromResults([]);
              }}
              style={{ marginLeft: 'auto' }}
            >
              <Ionicons name="close-circle" size={20} color={GREEN} />
            </TouchableOpacity>
          </View>
        )}

        {fromSearch && !fromLocation && fromResults.length === 0 && !searchingFrom && (
          <View style={styles.manualEntryHint}>
            <Ionicons name="information-circle" size={18} color={GREEN} />
            <Text style={styles.manualEntryText}>
              You can continue with "{fromSearch}" as your pickup location
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // STEP 3: Drop Location
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="flag" size={40} color="#EF4444" />
        <Text style={styles.questionTitle}>Where will you be traveling to?</Text>
        <Text style={styles.questionSubtitle}>Enter destination or select from suggestions</Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={toSearch}
            onChangeText={setToSearch}
            placeholder="Type destination city or place name..."
            placeholderTextColor="#999"
          />
          {searchingTo && <ActivityIndicator size="small" color={GREEN} />}
          {toSearch && !toLocation && (
            <TouchableOpacity onPress={() => setToSearch('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {toResults.length > 0 && !toLocation && (
          <View style={styles.dropdown}>
            {toResults.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.dropdownItem}
                onPress={() => selectLocation('to', loc)}
              >
                <Ionicons name="location-outline" size={18} color="#EF4444" />
                <Text style={styles.dropdownText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {toLocation && (
          <View style={styles.selectedLocation}>
            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
            <Text style={styles.selectedLocationText}>{toLocation.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setToLocation(null);
                setToSearch('');
                setToResults([]);
              }}
              style={{ marginLeft: 'auto' }}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {toSearch && !toLocation && toResults.length === 0 && !searchingTo && (
          <View style={styles.manualEntryHint}>
            <Ionicons name="information-circle" size={18} color={GREEN} />
            <Text style={styles.manualEntryText}>
              You can continue with "{toSearch}" as your destination
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // STEP 4: Passengers
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="people" size={40} color={GREEN} />
        <Text style={styles.questionTitle}>How many passengers?</Text>
        <Text style={styles.questionSubtitle}>Enter total number of travelers</Text>
      </View>

      <View style={styles.passengerInputContainer}>
        <TouchableOpacity
          style={styles.passengerButton}
          onPress={() => setPassengers(Math.max(1, parseInt(passengers || 0) - 1).toString())}
        >
          <Ionicons name="remove-circle" size={48} color={GREEN} />
        </TouchableOpacity>

        <View style={styles.passengerDisplay}>
          <TextInput
            style={styles.passengerInput}
            value={passengers}
            onChangeText={setPassengers}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#ccc"
            maxLength={3}
          />
          <Text style={styles.passengerLabel}>Passengers</Text>
        </View>

        <TouchableOpacity
          style={styles.passengerButton}
          onPress={() => setPassengers((parseInt(passengers || 0) + 1).toString())}
        >
          <Ionicons name="add-circle" size={48} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Quick select options */}
      <View style={styles.quickSelectContainer}>
        <Text style={styles.quickSelectLabel}>Quick Select:</Text>
        <View style={styles.quickSelectButtons}>
          {[10, 20, 30, 40, 50].map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.quickSelectBtn,
                passengers === count.toString() && styles.quickSelectBtnActive,
              ]}
              onPress={() => setPassengers(count.toString())}
            >
              <Text
                style={[
                  styles.quickSelectBtnText,
                  passengers === count.toString() && styles.quickSelectBtnTextActive,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // STEP 5: Pickup Date/Time
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="calendar" size={40} color={GREEN} />
        <Text style={styles.questionTitle}>When do you need the service?</Text>
        <Text style={styles.questionSubtitle}>Select your pickup date and time</Text>
      </View>

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openDatePicker('pickup')}>
          <View style={styles.dateTimeIcon}>
            <Ionicons name="calendar-outline" size={28} color={GREEN} />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Pickup Date</Text>
            <Text style={styles.dateTimeValue}>
              {pickupDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openTimePicker('pickup')}>
          <View style={styles.dateTimeIcon}>
            <Ionicons name="time-outline" size={28} color={GREEN} />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Pickup Time</Text>
            <Text style={styles.dateTimeValue}>{pickupTime}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
        <Text style={styles.noteText}>Note: You cannot select past dates</Text>
      </View>
    </View>
  );

  // STEP 6: Return Date/Time (for non-local)
  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="calendar" size={40} color="#EF4444" />
        <Text style={styles.questionTitle}>When will you return?</Text>
        <Text style={styles.questionSubtitle}>Select your return date and time</Text>
      </View>

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openDatePicker('return')}>
          <View style={[styles.dateTimeIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="calendar-outline" size={28} color="#EF4444" />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Return Date</Text>
            <Text style={styles.dateTimeValue}>
              {returnDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateTimeCard} onPress={() => openTimePicker('return')}>
          <View style={[styles.dateTimeIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="time-outline" size={28} color="#EF4444" />
          </View>
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateTimeLabel}>Return Time</Text>
            <Text style={styles.dateTimeValue}>{returnTime}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
        <Text style={styles.noteText}>Note: Return date must be after pickup date</Text>
      </View>
    </View>
  );

  // STEP 7: Special Requirements
  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionHeader}>
        <Ionicons name="list" size={40} color={GREEN} />
        <Text style={styles.questionTitle}>Any special requirements?</Text>
        <Text style={styles.questionSubtitle}>
          Add any special requests or preferences
        </Text>
      </View>

      <View style={styles.preferencesContainer}>
        <TouchableOpacity
          style={[styles.preferenceCard, needAC && styles.preferenceCardActive]}
          onPress={() => setNeedAC(!needAC)}
        >
          <Ionicons
            name={needAC ? 'snow' : 'snow-outline'}
            size={32}
            color={needAC ? GREEN : '#666'}
          />
          <Text style={[styles.preferenceText, needAC && styles.preferenceTextActive]}>
            AC Required
          </Text>
          {needAC && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.preferenceCard, needLuxury && styles.preferenceCardActive]}
          onPress={() => setNeedLuxury(!needLuxury)}
        >
          <Ionicons
            name={needLuxury ? 'diamond' : 'diamond-outline'}
            size={32}
            color={needLuxury ? GREEN : '#666'}
          />
          <Text style={[styles.preferenceText, needLuxury && styles.preferenceTextActive]}>
            Luxury Bus
          </Text>
          {needLuxury && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.preferenceCard, needSleeper && styles.preferenceCardActive]}
          onPress={() => setNeedSleeper(!needSleeper)}
        >
          <Ionicons
            name={needSleeper ? 'bed' : 'bed-outline'}
            size={32}
            color={needSleeper ? GREEN : '#666'}
          />
          <Text style={[styles.preferenceText, needSleeper && styles.preferenceTextActive]}>
            Sleeper Bus
          </Text>
          {needSleeper && (
            <View style={styles.preferenceCheck}>
              <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.textInputContainer}>
        <Text style={styles.textInputLabel}>Additional Requirements</Text>
        <TextInput
          style={styles.textArea}
          value={requirements}
          onChangeText={setRequirements}
          placeholder="E.g., decorations, specific timing requirements, etc..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setRequirements('');
          setNeedAC(true);
          setNeedLuxury(false);
          setNeedSleeper(false);
        }}
      >
        <Text style={styles.skipButtonText}>Skip & Use Defaults</Text>
      </TouchableOpacity>
    </View>
  );

  // STEP 8: Confirmation
  const renderStep8 = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={60} color="#fff" />
      </View>

      <Text style={styles.confirmTitle}>Quote Request Submitted!</Text>
      <Text style={styles.confirmSubtitle}>
        Your bus rental quote request has been sent to verified vendors. You'll receive competitive
        quotes within 24-48 hours.
      </Text>

      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Ionicons name="document-text-outline" size={24} color={GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.confirmLabel}>Request ID</Text>
            <Text style={styles.confirmValue}>#{confirmedRequestId}</Text>
          </View>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="bus-outline" size={24} color={GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.confirmLabel}>Trip Type</Text>
            <Text style={styles.confirmValue}>
              {tripType.charAt(0).toUpperCase() + tripType.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="people-outline" size={24} color={GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.confirmLabel}>Passengers</Text>
            <Text style={styles.confirmValue}>{passengers} people</Text>
          </View>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="calendar-outline" size={24} color={GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.confirmLabel}>Journey Date</Text>
            <Text style={styles.confirmValue}>
              {pickupDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() =>
          navigation.navigate('BusQuoteRequestDetail', {
            requestId: confirmedRequestId,
          })
        }
      >
        <Text style={styles.primaryBtnText}>View Quote Request</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('CustomerDashboard')}
      >
        <Ionicons name="home-outline" size={20} color={GREEN} />
        <Text style={styles.secondaryBtnText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bus Rental</Text>
          {step < 8 && (
            <Text style={styles.headerSubtitle}>
              Step {step} of {totalSteps}
            </Text>
          )}
        </View>
          <TouchableOpacity
          onPress={() => navigation.navigate('MyBusBookings')}
          style={styles.myBookingsBtn}
        >
          <Ionicons name="document-text-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {step < 8 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((step - 1) / (totalSteps - 1)) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}
        {step === 8 && renderStep8()}
      </ScrollView>

      {/* Next Button */}
      {step < 8 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, submitting && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 7 ? 'Submit Request' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Phone Collection Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.phoneModal}>
            <View style={styles.phoneModalHeader}>
              <Text style={styles.phoneModalTitle}>Add Phone Number</Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.phoneModalContent}>
              <Ionicons name="call-outline" size={60} color={GREEN} style={styles.phoneIcon} />
              <Text style={styles.phoneModalText}>
                We need your phone number to process your booking request and send you quotes from vendors.
              </Text>

              <View style={styles.phoneInputGroup}>
                <Ionicons name="call" size={20} color={GREEN} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                    placeholderTextColor={"#888"}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.phoneSubmitBtn, phoneLoading && styles.phoneSubmitBtnDisabled]}
                onPress={handlePhoneSubmit}
                disabled={phoneLoading}
              >
                {phoneLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.phoneSubmitBtnText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  questionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // Trip Type Grid
  tripTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tripTypeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  tripTypeCardActive: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  tripTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTypeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tripTypeLabelActive: {
    color: GREEN,
  },
  tripTypeDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Location Input
  inputContainer: {
    marginTop: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: GREEN,
  },
  selectedLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
    flex: 1,
  },
  manualEntryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: GREEN,
  },
  manualEntryText: {
    fontSize: 13,
    color: '#059669',
    flex: 1,
  },

  // Passengers
  passengerInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 32,
  },
  passengerButton: {
    padding: 8,
  },
  passengerDisplay: {
    alignItems: 'center',
  },
  passengerInput: {
    fontSize: 64,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
    minWidth: 120,
  },
  passengerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  quickSelectContainer: {
    marginTop: 40,
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickSelectButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  quickSelectBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  quickSelectBtnActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  quickSelectBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickSelectBtnTextActive: {
    color: '#fff',
  },

  // Date Time
  dateTimeContainer: {
    gap: 16,
    marginTop: 20,
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateTimeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    gap: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },

  // Preferences
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  preferenceCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  preferenceCardActive: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  preferenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  preferenceTextActive: {
    color: GREEN,
  },
  preferenceCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  textInputContainer: {
    marginTop: 24,
  },
  textInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Confirmation
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 8,
    borderWidth: 2,
    borderColor: GREEN,
  },
  secondaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: GREEN,
  },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  phoneModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    width: '100%',
  },
  phoneModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  phoneModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  phoneModalContent: {
    padding: 24,
    alignItems: 'center',
  },
  phoneIcon: {
    marginBottom: 16,
  },
  phoneModalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  phoneInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  phoneSubmitBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  phoneSubmitBtnDisabled: {
    opacity: 0.6,
  },
  phoneSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
