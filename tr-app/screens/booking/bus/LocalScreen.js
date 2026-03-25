import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import api from '../../api';
import bookingService from '../../services/bookingService';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
const cities = [
    { id: 3, name: 'Ahmedabad', img: require('../../../assets/ahmedabad.png') },
    { id: 5, name: 'Bangalore', img: require('../../../assets/bangalore.png') },
    { id: 7, name: 'Udaipur', img: require('../../../assets/udaipur.png') },
    { id: 8, name: 'Goa', img: require('../../../assets/goa.png') },
    { id: 10, name: 'Hyderabad', img: require('../../../assets/hyderabad.png') },
    { id: 13, name: 'Delhi', img: require('../../../assets/delhi.png') },
    { id: 12, name: 'Mumbai', img: require('../../../assets/mumbai.png') },
    { id: 14, name: 'Jaipur', img: require('../../../assets/jaipur.png') },
  ];
// Function to get today's date formatted as "YYYY-MM-DD"
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};
const LocalScreen = () => {
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  const [destination, setDestination] = useState('');
  // const [selectedVehicleTyes, setvehicleTypes] = useState(null);
  // const [selectedAirportType, setairportBookingType] = useState(null);
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  const [returnDate, setReturnDate] = useState(new Date()); // Date object for Return Date
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState('');  // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const navigation = useNavigation();
  const [totalPassengers, setTotalPassengers] = useState('');
  const route = useRoute();  // Use this to access route params
    const [selectedService, setSelectedService] = useState(route.params?.service || null);
  useEffect(() => {
    fetchLocations();
  }, []);
  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      if (res.data.success || res.data.status) {
        const locs = res.data.locations || res.data.data || [];
        setAllLocations(locs);
        setFilteredLocations(locs);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };
  // Handle input change and filter locations dynamically
  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(''); // Reset pickupLocation when typing starts
    if (text.length === 0) {
      // If the query is empty, show all locations
      setFilteredLocations(allLocations);
      setShowNoResults(false);
    } else {
      // Filter locations that match the query
      const filtered = allLocations.filter((city) =>
        city.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowNoResults(filtered.length === 0); // Show "No results" if no matching locations
    }
  };
  // Handle location selection
  const handleLocationSelect = (location) => {
    setPickupLocation(location.name);  // Set pickup location name
    setPickupLocationId(location.id);  // Set pickup location ID
    setQuery('');  // Clear query after selecting location
  };
  const nextStep = () => {
    if (step === 0 && (!pickupLocation || !pickupLocationId)) return alert('Please select a pickup location');
    if (step === 1 && !destination) return alert('Please enter destination');
    // if (step === 2 && !selectedAirportType) return alert('Please select airportBookingType');
    // if (step === 3 && !selectedVehicleTyes) return alert('Please select Vehicle Type');
    if (step === 2 && !startDate) return alert('Please select Date');
    if (step === 3 && !returnDate) return alert('Please select Date');
    if (step === 4 && !totalPassengers) return alert('Please enter the number of passengers');
    if (step === 4 && parseInt(totalPassengers) < 10) return alert('Minimum 10 passengers required for bus booking');
    setStep(prev => Math.min(prev + 1, 5));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));
 // Open the Start Date and Time picker
 const openStartDateTimePicker = () => {
  DateTimePickerAndroid.open({
    value: startDate,
    mode: 'date', // Date picker first
    is24Hour: true,
    minDate: getMinBookingDate(), // Disable past dates
    onChange: (event, date) => {
      if (event.type === 'dismissed' || !date) return;
      // Check if the selected date is in the past, reset to today if so
      if (date < getTodayDate()) {
        alert("You cannot select past dates. Selecting today instead.");
        setStartDate(getTodayDate());
        return;
      }
      setStartDate(date); // Set the selected date
      // Open time picker after selecting date
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        is24Hour: true,
        onChange: (eventTime, time) => {
          if (eventTime.type === 'dismissed' || !time) return;
          const finalDateTime = new Date(date);
          finalDateTime.setHours(time.getHours());
          finalDateTime.setMinutes(time.getMinutes());
          if (isPickupTooSoon(finalDateTime)) {
            setShowBookingAlert(true);
            return;
          }
          setStartDate(finalDateTime); // Set final date and time
        },
      });
    },
  });
};


// Open the Return Date and Time picker
const openReturnDateTimePicker = () => {
  DateTimePickerAndroid.open({
    value: returnDate,
    mode: 'date',
    is24Hour: true,
    minDate: getTodayDate(),
    onChange: (event, date) => {
      if (event.type === 'dismissed' || !date) return;
      // Check if the selected date is in the past, reset to today if so
      if (date < getTodayDate()) {
        alert("You cannot select past dates. Selecting today instead.");
        setReturnDate(getTodayDate());
        return;
      }
      setReturnDate(date);
      // Open time picker after selecting date
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        is24Hour: true,
        onChange: (eventTime, time) => {
          if (eventTime.type === 'dismissed' || !time) return;
          const finalDateTime = new Date(date);
          finalDateTime.setHours(time.getHours());
          finalDateTime.setMinutes(time.getMinutes());
          setReturnDate(finalDateTime);
        },
      });
    },
  });
};
const handleBookingSubmit = async () => {
  // Prevent multiple submissions
  if (isSubmitting) return;

  setIsSubmitting(true);

  try {
    const customerStr = await AsyncStorage.getItem("customer");
    const customer = customerStr ? JSON.parse(customerStr) : null;

    if (!customer?.id) {
      alert("Please login first");
      setIsSubmitting(false);
      return;
    }

    const requestData = {
      customerId: customer.id,
      customerName: customer.name || customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      tripType: 'local',
      busType: 'standard',
      passengerCount: parseInt(totalPassengers) || 1,
      pickupCity: pickupLocation,
      pickupAddress: pickupLocation,
      pickupDate: startDate.toISOString().split('T')[0],
      pickupTime: startDate.toTimeString().split(' ')[0].slice(0, 5),
      dropCity: destination,
      dropAddress: destination,
      returnDate: returnDate.toISOString().split('T')[0],
      returnTime: returnDate.toTimeString().split(' ')[0].slice(0, 5),
      requirements: otherDetails,
    };

    const response = await bookingService.createBusQuoteRequest(requestData);

    if (response.success || response.id || response.quoteRequest) {
      navigation.navigate("BookingConfirmation", {
        booking_id: response?.quoteRequest?.requestNumber || response?.quoteRequest?.id || response?.id,
        bookingType: 'bus',
        service_name: 'Bus Rental',
        service_type: 'bus',
        message: 'Your bus rental quote request has been submitted. Vendors will send you quotes shortly.'
      });
    } else {
      alert("Booking failed. Please try again.");
    }
  } catch (error) {
    console.error("Booking error:", error?.response?.data || error);
    alert(error?.response?.data?.error || "There was an error. Please try again later.");
  } finally {
    setIsSubmitting(false);
  }
};
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Your PickUp Location</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Type or select an option"
                value={query.length > 0 ? query : pickupLocation}
                onChangeText={handleInputChange}
              />
              {query.length > 0 && (
                <View style={styles.suggestionWrapper}>
                  <ScrollView style={styles.suggestionBox}>
                    {filteredLocations.length > 0 ? (
                      filteredLocations.slice(0, 500).map((city) => (
                        <TouchableOpacity
                          key={city.id}
                          style={styles.suggestionItem}
                          onPress={() => handleLocationSelect(city)}
                        >
                          <Text>{city.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResultText}>No location found</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.gridContainer}>
              {cities.map((city) => {
                const isSelected = city.id === pickupLocationId;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[styles.cityBox, isSelected && styles.selectedImageBox]}
                    onPress={() => handleLocationSelect(city)}
                  >
                    <Image source={city.img} style={styles.cityImage} />
                    <Text style={styles.cityName}>{city.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        );


        case 1:
          return (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Your Destination Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter destination"
                value={destination}
                onChangeText={setDestination}
              />
              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
                  <Text style={styles.nextBtnText}>{'<-'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
                  <Text style={styles.nextBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          );
  
          case 2:
            return (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.stepContainer}>
                <Text style={styles.label}>Start Date & Time</Text>
                <TouchableOpacity
                  onPress={openStartDateTimePicker}
                  style={styles.input}
                >
                  <Text>{startDate.toLocaleString()} {/* Display as localized date and time */}</Text>
                </TouchableOpacity>
                <View style={styles.rowButtons}>
                  <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
                    <Text style={styles.nextBtnText}>{'<-'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
                    <Text style={styles.nextBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </ScrollView>
            );
            case 3:
              return (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.stepContainer}>
                  <Text style={styles.label}>Return Date & Time</Text>
                  <TouchableOpacity
                    onPress={openReturnDateTimePicker}
                    style={styles.input}
                  >
                    <Text>{startDate.toLocaleString()} {/* Display as localized date and time */}</Text>
                  </TouchableOpacity>
                  <View style={styles.rowButtons}>
                    <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
                      <Text style={styles.nextBtnText}>{'<-'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
                      <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </ScrollView>
              );
          case 4:
            return  (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <View style={styles.stepContainer}>
                    <Text style={styles.label}>Total Passengers</Text>
                    <View>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Enter number of passengers"
                        value={totalPassengers}
                        onChangeText={setTotalPassengers}
                      />
                    </View>
                    <View style={styles.rowButtons}>
                      <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
                        <Text style={styles.nextBtnText}>{'<-'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
                      <Text style={styles.nextBtnText}>Next</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  </ScrollView>
            );
        case 5:
          return (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.stepContainer}>
              <Text style={styles.label}>Any Other Details</Text>
              <TextInput
                style={[styles.input, { height: 120 }]}
                placeholder="Enter details..."
                multiline
                value={otherDetails}
                onChangeText={setOtherDetails}
              />
              <View style={styles.rowButtons}>
                <TouchableOpacity 
                  style={[styles.navBtn, isSubmitting && styles.disabledBtn]} 
                  onPress={prevStep}
                  disabled={isSubmitting}
                >
                  <Text style={styles.nextBtnText}>{'<-'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navBtn, isSubmitting && styles.disabledBtn]} 
                  onPress={handleBookingSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={[styles.nextBtnText, styles.loaderText]}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.nextBtnText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          );
        default:
          return null;
      }
    };
    return <SafeAreaView style={styles.container}>{renderStep()}<BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} /></SafeAreaView>;
  };
  const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    stepContainer: { marginBottom: 40 },
    label: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
    input: {
      borderWidth: 1,
      borderColor: '#333',
      padding: 14,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 20,
    },
    suggestionWrapper: {
      position: 'absolute',
      top: 64,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: '#fff',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    suggestionBox: {
      maxHeight: 200,
      paddingVertical: 4,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderColor: '#eee',
    },
    inputWrapper: {
      borderWidth: 1,
      borderColor: '#333',
      padding: 14,
      borderRadius: 10,
      fontSize: 16,
      marginBottom: 20,
    },
    noResultText: {
      padding: 12,
      textAlign: 'center',
      color: '#888',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    cityBox: {
      width: '48%',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 12,
      backgroundColor: '#eee',
    },
    iconImage: { width: 100, height: 60, marginBottom: 8 },
    icondurationImage: { width: 150, height: 60, marginBottom: 8 },
    optionBox: {
      width: '48%',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#F6F6F6',
      borderRadius: 10,
      marginBottom: 10,
    },
    iconImage: { width: 100, height: 60, marginBottom: 8 },
    iconAirportImage: { width: 100, height: 60, marginBottom: 8 },
    optionBox: {
      width: '48%',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#F6F6F6',
      borderRadius: 10,
      marginBottom: 10,
    },
    gridContainer3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridContainer4: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    selectedImageBox: {
      borderWidth: 2,
      borderColor: '#09B368',
      opacity: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cityImage: { width: '100%', height: 100, resizeMode: 'cover' },
    cityName: { textAlign: 'center', padding: 6, fontWeight: '600' },
    nextBtn: {
      backgroundColor: '#09B368',
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignSelf: 'flex-end',
    },
    nextBtnText: { color: '#fff', fontWeight: '600' },
    rowButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    selectedBox: {
      borderWidth: 2,
      borderColor: '#09B368',
      backgroundColor: '#D9FBE8',
    },
    navBtn: {
      backgroundColor: '#09B368',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    nextBtnText: { color: '#fff', fontWeight: '600' },
    loaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loaderText: {
      marginLeft: 10,
    },
    disabledBtn: {
      backgroundColor: '#ccc',
    },
  });
  export default LocalScreen;
    