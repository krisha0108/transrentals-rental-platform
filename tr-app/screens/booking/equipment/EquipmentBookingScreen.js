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
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';



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

const durations = [
  { id: '1', label: '1 To 5 Days', img: require('../../../assets/1to5.png') },
  { id: '2', label: '6 To 15 Days', img: require('../../../assets/6to15.png') },
  { id: '3', label: '16 To 30 Days', img: require('../../../assets/16to30.png') },
  { id: '4', label: '30+ Days', img: require('../../../assets/30+.png') },
];

// const bikeTypes = [
//   { id: '1', label: 'Sport Bikes', img: require('../../../assets/sport.png') },
//   { id: '2', label: 'Scooter', img: require('../../../assets/scooter.png') },
//   { id: '3', label: 'Cruiser', img: require('../../../assets/cruiser.png') },
//   { id: '4', label: 'Street/Naked Bikes', img: require('../../../assets/street.png') },
//   { id: '5', label: 'Adventure Tourers', img: require('../../../assets/adventure.png') },
//   { id: '6', label: 'Dirt Bikes', img: require('../../../assets/dirt.png') },
// ];
// Function to get today's date formatted as "YYYY-MM-DD"
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};
const getMachineTypeId = (name) => {
  const mapping = {
    'Grove crane': 1,
    'Truck mounted crane': 2,
    'Tower crane': 3,
    'Telescopic crane': 4,
    'Rough terrain crane': 5,
    'Overhead crane': 6,
    'Buldozer': 7,
    'Dumper': 8,
    'Loader': 9,
    'Excavators': 10,
    'Backhoe loader': 11,
  };
  return mapping[name] || null;
};

const EquipmentBookingScreen = () => {
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  //   const [destination, setDestination] = useState('');
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState(null);
  const [selecteddurations, setSelecteddurations] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // const [selectedBikeType, setSelectedBikeType] = useState(null);
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  const [equipmentCount, setEquipmentCount] = useState(null);

  // const [returnDate, setReturnDate] = useState(new Date()); // Date object for Return Date
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState('');  // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const navigation = useNavigation();
  // we did chnaged fo location saturday
  // useEffect(() => {
  //   fetchLocations();
  // }, []);

  // Refetch locations when the screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLocations(); // Fetch locations whenever screen is focused
    });
    return unsubscribe; // Cleanup the listener when the component is unmounted or focused
  }, [navigation]);



  const fetchLocations = async () => {
    // Only fetch locations if the data is not already in the state
    if (allLocations.length > 0) {
      console.log("Locations already fetched, skipping API call.");
      return; // Skip the API call if locations are already in the state
    }

    console.log("Fetching locations from API...");
    try {
      const res = await axios.get('https://app.transrentals.in/api/locations');

      
      console.log("Response from API:", res.data);

      if (res.data.status) {
        setAllLocations(res.data.locations); // Set all locations
        setFilteredLocations(res.data.locations); // Show all locations initially
      } else {
        console.error("Error: Locations not fetched");
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
      const filtered = allLocations.filter((city) => {
        // Make sure city.name and text are defined and are strings
        if (typeof city.name === 'string' && typeof text === 'string') {
          return city.name.toLowerCase().includes(text.toLowerCase());
        }
        return false; // Return false if city.name or text is undefined or not a string
      });
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
    // if (step === 1 && !destination) return alert('Please enter destination');
    if (step === 1 && !selectedEquipmentTypes) return alert('Please select equipmentTypes');
    if (step === 2 && !selecteddurations) return alert('Please select durations');
    if (step === 4 && !equipmentCount) return alert('Please select Equipment Count');


    setStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  // Open the Start Date and Time picker
  const openStartDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: startDate,
      mode: 'date', // Date picker first
      is24Hour: true,
      minDate: getTodayDate(), // Disable past dates
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
            setStartDate(finalDateTime); // Set final date and time
          },
        });
      },
    });
  };

  // // Open the Return Date and Time picker
  // const openReturnDateTimePicker = () => {
  //   DateTimePickerAndroid.open({
  //     value: returnDate,
  //     mode: 'date',
  //     is24Hour: true,
  //     minDate: getTodayDate(),
  //     onChange: (event, date) => {
  //       if (event.type === 'dismissed' || !date) return;
  //       // Check if the selected date is in the past, reset to today if so
  //       if (date < getTodayDate()) {
  //         alert("You cannot select past dates. Selecting today instead.");
  //         setReturnDate(getTodayDate());
  //         return;
  //       }
  //       setReturnDate(date);
  //       // Open time picker after selecting date
  //       DateTimePickerAndroid.open({
  //         value: date,
  //         mode: 'time',
  //         is24Hour: true,
  //         onChange: (eventTime, time) => {
  //           if (eventTime.type === 'dismissed' || !time) return;
  //           const finalDateTime = new Date(date);
  //           finalDateTime.setHours(time.getHours());
  //           finalDateTime.setMinutes(time.getMinutes());
  //           setReturnDate(finalDateTime);
  //         },
  //       });
  //     },
  //   });
  // };
  const [EquipmentTypes, setEquipmentTypes] = useState([]);

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  const fetchEquipmentTypes = async () => {
    try {
      const res = await axios.get('https://app.transrentals.in/api/equipment-types');
      if (res.data.status) {
        setEquipmentTypes(res.data.equipment_types);
      }
    } catch (error) {
      console.error('Error fetching equipment types:', error);
    }
  };




  const handleBookingSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true); // Start loading
    
    // try {
    //   const customerId = await AsyncStorage.getItem("customer_id");
    //   const token = await AsyncStorage.getItem("token");
    //   if (!customerId) {
    //     alert("Customer ID is missing, please login first");
    //     return;
    //   }
      try {
        const customerId = await AsyncStorage.getItem("customer_id");
             const token = await AsyncStorage.getItem("token");

console.log("🪪 Retrieved customer_id from AsyncStorage:", customerId); // ✅ Add this
      

      const payload = {
        customer_id: customerId, // ✅ Correct now
        service_id: 8, // Assuming service_id for bike rental
        service_name: "Equipment",
        location_id: pickupLocationId,
        location_name: pickupLocation,
        // destination,
        journey_datetime: startDate.toISOString(),
        // return_datetime: returnDate.toISOString(),
        // machine_type: getMachineTypeId(selectedEquipmentTypes), // You need to map type name to ID
        job_duration: selecteddurations,
        no_of_equipments: equipmentCount.toString(),
        Equipment_duration: selecteddurations,
machine_type: getMachineTypeId(selectedEquipmentTypes),

        other_info: otherDetails,
      };
      console.log("📦 Payload:", payload);

      const response = await axios.post("https://app.transrentals.in/api/store-equipment-booking", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
     
      console.log("✅ Booking Response:", response.data);
      
      

      console.log("✅ Booking Response:", response);

      if (response.data.booking_id) {
        navigation.navigate("BookingConfirmation");
      }
    } catch (error) {
      console.error("Booking error:", error?.response?.data || error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false); // Stop loading regardless of success/failure
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
      //   case 1:
      //     return (
      //       <View style={styles.stepContainer}>
      //         <Text style={styles.label}>Your Destination Location</Text>
      //         <TextInput
      //           style={styles.input}
      //           placeholder="Enter destination"
      //           value={destination}
      //           onChangeText={setDestination}
      //         />
      //         <View style={styles.rowButtons}>
      //           <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
      //             <Text style={styles.nextBtnText}>{'<-'}</Text>
      //           </TouchableOpacity>
      //           <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
      //             <Text style={styles.nextBtnText}>Next</Text>
      //           </TouchableOpacity>
      //         </View>
      //       </View>
      //     );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Select Configuration</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text>{selectedEquipmentTypes || 'Select an option'}</Text>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#333"
              />
            </TouchableOpacity>

            {showDropdown && (
              <ScrollView style={styles.dropdownMenu}>
                {EquipmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedEquipmentTypes(type.name);
                      setShowDropdown(false);
                    }}
                  >
                    <Text>{type.name}</Text>
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
                  if (!selectedEquipmentTypes) {
                    alert('Please select a configuration');
                    return;
                  }
                  nextStep();
                }}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Select Duration</Text>
            <View style={styles.gridContainer3}>
              {durations.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionBox, selecteddurations === item.id && styles.selectedBox]}
                  onPress={() => setSelecteddurations(item.id)}
                >
                  <Image source={item.img} style={styles.iconImage} />
                  <Text style={styles.cityName}>{item.label}</Text>
                </TouchableOpacity>
              ))}
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
        );

      case 3:
        return (
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
        );
      // case 4:
      //   return (
      //     <View style={styles.stepContainer}>
      //       <Text style={styles.label}>Return Date & Time</Text>
      //       <TouchableOpacity
      //         onPress={openReturnDateTimePicker}
      //         style={styles.input}
      //       >
      //         <Text> {returnDate.toLocaleString()} {/* Display as localized date and time */}</Text>
      //       </TouchableOpacity>
      //       <View style={styles.rowButtons}>
      //         <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
      //           <Text style={styles.nextBtnText}>{'<-'}</Text>
      //         </TouchableOpacity>
      //         <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
      //           <Text style={styles.nextBtnText}>Next</Text>
      //         </TouchableOpacity>
      //       </View>
      //     </View>
      //   );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Number of Equipment</Text>
            <TextInput
              style={styles.input}
              value={equipmentCount !== null ? equipmentCount.toString() : ''}
              keyboardType="numeric"
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num >= 1) {
                  setEquipmentCount(num);
                } else if (text === '') {
                  setEquipmentCount(null); // Allow empty (null) value
                }
              }}
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
        );
        



      case 5:
        return (
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
        );

      default:
        return null;
    }
  };

  return <SafeAreaView style={styles.container}>{renderStep()}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  stepContainer: { marginBottom: 40 },
  label: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
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
  suggestionBox: {
    maxHeight: 200,
    paddingVertical: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
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
  iconImage: { width: 70, height: 70, marginBottom: 8 },
  icondurationImage: { width: 60, height: 60, marginBottom: 8 },
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
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  spinnerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#09B368',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  spinnerValue: {
    marginHorizontal: 20,
    fontSize: 24,
    fontWeight: '600',
  },
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

export default EquipmentBookingScreen;
