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
  ActivityIndicator
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';


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
    
  const airportBookingType = [
    { id: '1', label: 'Drop to Airport', icon: require('../../../assets/droptoairport.png') },
    { id: '2', label: 'Pick up from Airport', icon: require('../../../assets/pickupairport.png') },
  ];
  const vehicleTypes = [
    { id: '1', label: 'Hatchback', icon: require('../../../assets/hatchback.png') },
    { id: '2', label: 'Sedan', icon: require('../../../assets/sedan.png') },
    { id: '3', label: 'MUV', icon: require('../../../assets/muv.png') },
    { id: '4', label: 'SUV', icon: require('../../../assets/suv.png') },
  ];

// Function to get today's date formatted as "YYYY-MM-DD"
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};
const AirportBookingScreen = () => {
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState('');  // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null);  // Pickup location ID
  const [destination, setDestination] = useState('');
  const [selectedVehicleTyes, setvehicleTypes] = useState(null);
  const [selectedAirportType, setairportBookingType] = useState(null);
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  // const [returnDate, setReturnDate] = useState(new Date()); // Date object for Return Date
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState('');  // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const navigation = useNavigation();
  const [totalPassengers, setTotalPassengers] = useState('');
  const route = useRoute();  // Use this to access route params
    const [selectedService, setSelectedService] = useState(route.params?.service || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get('https://app.transrentals.in/api/locations');
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
    if (step === 2 && !selectedAirportType) return alert('Please select airportBookingType');
    if (step === 3 && !selectedVehicleTyes) return alert('Please select Vehicle Type');
    if (step === 4 && !startDate) return alert('Please select Date');
    if (step === 5 && !totalPassengers) return alert('Please enter the number of passengers');
   
    setStep(prev => Math.min(prev + 1, 7));
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

// Open the Return Date and Time picker
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


const handleBookingSubmit = async () => {
  if (isSubmitting) return; // Prevent multiple submissions
  
  setIsSubmitting(true);
  try {
    // Check if airport booking type is selected
    if (!selectedAirportType) {
      alert('Please select the airport booking type');
      return;
    }

    const customerId = await AsyncStorage.getItem("customer_id");
    const token = await AsyncStorage.getItem("token");

    if (!customerId) {
      alert("Customer ID is missing, please login first");
      return;
    }

    const payload = {
      customer_id: customerId,
      service_id: 2, // Adjust this as needed
      service_name: "Standard Car", // Or dynamically set the service name
      location_id: pickupLocationId,
      location_name: pickupLocation,
      destination,
      journey_datetime: startDate.toISOString(),
      car_type: selectedVehicleTyes,
      booking_type: selectedAirportType,  // Make sure this is being sent
      trip_type: selectedService, // Pass the selected trip type here
      total_passengers: totalPassengers, 
      other_info: otherDetails,
    };

    const response = await axios.post("https://app.transrentals.in/api/store-airport-booking", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.booking_id) {
      navigation.navigate("BookingConfirmation");
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
        );
//  case 2:
//         return (
//           <View style={styles.stepContainer}>
//             <Text style={styles.label}>Select Airport Booking Type
//             </Text>
//             <View style={styles.gridContainer4}>
//               {airportBookingType.map((item) => (
//                 <TouchableOpacity
//                   key={item.id}
//                   style={[styles.optionBox, selectedAirportType === item.id && styles.selectedBox]}
//                   onPress={() => setairportBookingType(item.id)}
//                 >
//                   <Image source={item.icon} style={styles.iconAirportImage} />
//                   <Text style={styles.cityName}>{item.label}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <View style={styles.rowButtons}>
//               <TouchableOpacity style={styles.navBtn} onPress={prevStep}>
//                 <Text style={styles.nextBtnText}>{'<-'}</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.navBtn} onPress={nextStep}>
//                 <Text style={styles.nextBtnText}>Next</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         );
case 2:  // Step where airport booking type is selected
return (
  <View style={styles.stepContainer}>
    <Text style={styles.label}>Select Airport Booking Type</Text>
    <View style={styles.gridContainer4}>
      {airportBookingType.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.optionBox, selectedAirportType === item.id && styles.selectedBox]}
          onPress={() => {
            setairportBookingType(item.id);  // Set selected airport booking type
            console.log("Selected Airport Booking Type:", item.id);  // Log the selected type
          }}
        >
          <Image source={item.icon} style={styles.iconAirportImage} />
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
            <Text style={styles.label}>Select Vehicle Type</Text>
            <View style={styles.gridContainer4}>
              {vehicleTypes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionBox, selectedVehicleTyes === item.id && styles.selectedBox]}
                  onPress={() => setvehicleTypes(item.id)}
                >
                  <Image source={item.icon} style={styles.icondurationImage} />
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

    
        case 4:
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
      
        case 5:
          return  (
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
            
          );

      case 6:
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
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    marginBottom: 10,
  },
  iconImage: { width: 100, height: 60, marginBottom: 8 },
  iconAirportImage: { width: 100, height: 60, marginBottom: 8 },
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

export default AirportBookingScreen;
