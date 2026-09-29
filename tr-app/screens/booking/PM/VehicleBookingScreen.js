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
  KeyboardAvoidingView,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import TravelAgentBookingToggle from '../../../components/TravelAgentBookingToggle';
import { getTravelAgentContext } from '../../../utils/isTravelAgent';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';


const cities = [
    { id: 3, name: 'Ahmedabad', img: require('../../../assets/ahmedabad.png') },
    { id: 5, name: 'Bangalore', img: require('../../../assets/bangalore.png') },
    { id: 7, name: 'Udaipur' , img: require('../../../assets/udaipur.png') },
    { id: 8, name: 'Goa', img: require('../../../assets/goa.png') },
    { id: 10, name: 'Hyderabad', img: require('../../../assets/hyderabad.png') },
    { id: 13, name: 'Delhi', img: require('../../../assets/delhi.png') },
    { id: 12, name: 'Mumbai', img: require('../../../assets/mumbai.png') },
    { id: 14, name: 'Jaipur', img: require('../../../assets/jaipur.png') },
  ];
  
  const truckTypesList = [
    { label: 'BIKE', value: 'BIKE' },
    { label: 'CAR', value: 'CAR' },
    { label: 'SUV', value: 'SUV' },
  ];
 
// Function to get today's date formatted as "YYYY-MM-DD"
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};
  // Handle truck type selection
  // const handleTruckTypeSelect = (type) => {
  //   setSelectedTruckTypes(type.label); // Set the truck type label to display
  //   setOfficeShifting(type.value); // Set the truck type value for submission (store in office_shifting)
  //   setShowDropdown(false); // Close the dropdown after selection
  // };
  // const handleTruckTypeSelect = (type) => {
  //   setSelectedTruckTypes(type.label); // Set the truck type label to display
  //   setOfficeShifting(type.value); // Set the value for office_shifting (to send to backend)
  //   setShowDropdown(false); // Close the dropdown after selection
  
  //   // Ensure shifting_type corresponds to the selected option
  //   if (type.value === 'UPTO_10_EMPLOYEES') {
  //     setSelectedService('2'); // Office
  //   } else if (type.value === 'INDIVIDUAL_ITEMS') {
  //     setSelectedService('1'); // Home
  //   } else if (type.value === 'MORE_THAN_20_EMPLOYEES') {
  //     setSelectedService('3'); // Vehicle
  //   }
  // };

const VehicleBookingScreen = () => {
  const [showBookingAlert, setShowBookingAlert] = useState(false);
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  const [destination, setDestination] = useState('');
  // const [selectedVehicleTyes, setvehicleTypes] = useState(null);
  // const [selectedBikeType, setSelectedBikeType] = useState(null);
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  // const [returnDate, setReturnDate] = useState(new Date()); // Date object for Return Date
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState('');  // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

  const [showNoResults, setShowNoResults] = useState(false);
  const navigation = useNavigation();
  // const [totalPassengers, setTotalPassengers] = useState('');
  // const [selectedService, setSelectedService] = useState(route.params?.service || null); // Get the trip_type from params
  const route = useRoute();  // Use this to access route params
  const [selectedService, setSelectedService] = useState(route.params?.service || null);
  // const [selectedTruckTypes, setSelectedTruckTypes] = useState(null);
  const [selectedTruckTypes, setSelectedTruckTypes] = useState(null);

  
  const [TruckTypes, setTruckTypes] = useState(truckTypesList);
  const [officeShifting, setOfficeShifting] = useState('');
  // Phase 7 — Travel Agent Personal/Company booking mode
  const [taState, setTaState] = useState({ mode: 'PERSONAL', vehicleCount: '1', employeeCount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);


  

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get('https://app.transrentals.in/api/locations');
      console.log("Response from API:", res.data);
      if (res.data.status) {
        setAllLocations(res.data.locations); // Set all locations
        setFilteredLocations(res.data.locations); // Show all locations initially
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
    // if (step === 2 && !selectedVehicleTyes) return alert('Please select Vehicle Type');
    // if (step === 5 && !totalPassengers) return alert('Please enter the number of passengers');
    // if (step === 3 && !selectedBikeType) return alert('Please select bike type');
    setStep(prev => Math.min(prev + 1, 7));
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


const handleBookingSubmit = async () => {
  if (isSubmitting) return; // Prevent multiple submissions
  
  setIsSubmitting(true);
  try {
    const customerId = await AsyncStorage.getItem("customer_id");
    const token = await AsyncStorage.getItem("token");
    console.log("🪪 Retrieved customer_id from AsyncStorage:", customerId); // ✅ Add this
    if (!customerId) {
      alert("Customer ID is missing, please login first");
      return;
    }

    const payload = {
      customer_id: customerId,
      service_id: 7, // Adjust this as needed
      service_name: "Packers and Movers",
      location_id: pickupLocationId, 
      location_name: pickupLocation,
      destination, 
      journey_datetime: startDate.toISOString(),
      vehicle_shifting: officeShifting, // Value to store for office_shifting
      shifting_type: selectedService,
      // car_type:selectedVehicleTyes,
      total_passengers: 4,
      other_info: otherDetails,
    };

    // Phase 7 — TA fields (only when TA customer).
    const { isTravelAgent } = await getTravelAgentContext();
    if (isTravelAgent) {
      payload.ta_booking_mode = taState.mode;
      payload.number_of_vehicles = taState.mode === 'COMPANY'
        ? (parseInt(taState.vehicleCount) || 1)
        : 1;
      payload.number_of_employees = taState.mode === 'COMPANY' && taState.employeeCount
        ? parseInt(taState.employeeCount)
        : null;
    }

    console.log("📦 Payload:", payload);
    const response = await axios.post("https://app.transrentals.in/api/store-vehicle-booking", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (response.data.booking_id) {
      navigation.replace("BookingConfirmation", {
        booking_id: response.data.request_number || response.data.booking_number || response.data.booking_id,
        service_name: 'Vehicle Shifting',
        service_type: 'packers',
        shifting_type: 'Vehicle',
      });
    } else {
      alert("Booking failed");
    }
  } catch (error) {
    console.error("Booking error:", error?.response?.data || error);
    alert("There was an error. Please try again later.");
  } finally {
    setIsSubmitting(false);
  }
};

  // Handle truck type selection
  const handleTruckTypeSelect = (type) => {
    setSelectedTruckTypes(type.label);  // Set the truck type label to display
    setOfficeShifting(type.value); // Set the truck type value for submission (store in office_shifting)
    setShowDropdown(false); // Close the dropdown after selection
  
    // Ensure shifting_type corresponds to the selected option
    if (type.value === 'BIKE') {
      setSelectedService('2'); // Office
    } else if (type.value === 'CAR') {
      setSelectedService('1'); // Home
    } else if (type.value === 'SUV') {
      setSelectedService('3'); // Vehicle
    }
  };
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
                  <ScrollView>
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
          <ScrollView contentContainerStyle={styles.stepContainer}>
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
          </ScrollView>
        );

        case 2:
          return (
            <ScrollView contentContainerStyle={styles.stepContainer}>
              <Text style={styles.label}>Select Truck Type</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text>{selectedTruckTypes || 'Select an option'}</Text>
                <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#333"
              />
              </TouchableOpacity>
    
              {/* Dropdown Menu */}
              {showDropdown && (
                <ScrollView style={styles.dropdownMenu}>
                  {truckTypesList.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={styles.dropdownItem}
                      onPress={() => handleTruckTypeSelect(type)} // Ensure this triggers handleTruckTypeSelect
                    >
                      <Text>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
    
              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
                  <Text style={styles.nextBtnText}>{'<-'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => {
                    if (!selectedTruckTypes) {  // Check if no truck type selected
                      alert('Please select a truck type');
                      return;
                    }
                    nextStep();  // Proceed if truck type is selected
                  }}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          );

        // Other cases for the next steps...
      
        
        case 3:
          return (
            <ScrollView contentContainerStyle={styles.stepContainer}>
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
            </ScrollView>
          );
        
  
       

      case 4:
        return (
          <ScrollView contentContainerStyle={styles.stepContainer}>
            <Text style={styles.label}>Any Other Details</Text>
            <TextInput
              style={[styles.input, { height: 120 }]}
              placeholder="Enter details..."
              multiline
              value={otherDetails}
              onChangeText={setOtherDetails}
            />
            {/* Phase 7 — TA Personal/Company toggle (self-gated). */}
            <TravelAgentBookingToggle value={taState} onChange={setTaState} />
            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
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
                    <Text style={styles.loaderText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.nextBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };


  return <SafeAreaView style={styles.container}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{renderStep()}</KeyboardAvoidingView><BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} /></SafeAreaView>;
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dropdownMenu: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: -16,
    marginBottom: 20,
    zIndex: 100,
    elevation: 10,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
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
    backgroundColor: '#f6f6f6',
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
    backgroundColor: '#d9fbe8',
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
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
});

export default VehicleBookingScreen;
