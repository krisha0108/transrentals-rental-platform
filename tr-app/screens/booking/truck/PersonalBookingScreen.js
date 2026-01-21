import React, {useEffect, useState} from 'react';
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
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const cities = [
  {id: 3, name: 'Ahmedabad', img: require('../../../assets/ahmedabad.png')},
  {id: 5, name: 'Bangalore', img: require('../../../assets/bangalore.png')},
  {id: 7, name: 'Udaipur', img: require('../../../assets/udaipur.png')},
  {id: 8, name: 'Goa', img: require('../../../assets/goa.png')},
  {id: 10, name: 'Hyderabad', img: require('../../../assets/hyderabad.png')},
  {id: 13, name: 'Delhi', img: require('../../../assets/delhi.png')},
  {id: 12, name: 'Mumbai', img: require('../../../assets/mumbai.png')},
  {id: 14, name: 'Jaipur', img: require('../../../assets/jaipur.png')},
];
const truckTypesList = [
  {id: 1, name: 'Canter Jumbo'},
  {id: 2, name: 'Canters 17feet / 4 wheel'},
  {id: 3, name: 'Canters 19feet / 6 wheel'},
  {id: 4, name: 'Canters 3MT / 4 wheel'},
  {id: 5, name: 'Canters Close Body 20 Feet'},
  {id: 6, name: 'Canters Close Body 24 Feet'},
  {id: 7, name: 'LCV (Light Commercial Vehicle)'},
  {id: 8, name: 'Semi Low Bed Trailer'},
  {id: 9, name: 'Truck 20MT / 12 Wheel'},
  {id: 10, name: 'Truck 25MT / 14 Wheel'},
  {id: 11, name: 'Truck 16MT / 10 Wheel'},
  {id: 12, name: 'Tata 407 2.5 MT / 4 Wheels'},
  {id: 13, name: 'Truck 9MT / 6 Wheel'},
  {id: 14, name: 'Tata Ace'},
];

const goodsTypesList = [
  {id: 1, name: 'Building materials'},
  {id: 2, name: 'Granites / Marbles'},
  {id: 3, name: 'Cement'},
  {id: 4, name: 'Chemical'},
  {id: 5, name: 'Coal & Ash'},
  {id: 6, name: 'Container'},
  {id: 7, name: 'Engineering goods'},
  {id: 8, name: 'Electronics / Consumer durable'},
  {id: 9, name: 'Fertilizer'},
  {id: 10, name: 'Fruits & Vegetables'},
  {id: 11, name: 'Furniture & Wood products'},
  {id: 12, name: 'Household goods'},
  {id: 13, name: 'Industrial Equipments'},
  {id: 14, name: 'Iron / Steel material'},
  {id: 15, name: 'Liquid / Oil drums'},
  {id: 16, name: 'Machineries'},
  {id: 17, name: 'Marble Slab / Block'},
  {id: 18, name: 'Medicines'},
  {id: 19, name: 'Packed foods'},
  {id: 20, name: 'Plastic Pipes'},
  {id: 21, name: 'Books / Paper rolls'},
  {id: 22, name: 'Plastic granules / Industrial goods'},
  {id: 23, name: 'Crop / Agriculture products'},
  {id: 24, name: 'Scrap'},
  {id: 25, name: 'Scones / Tiles'},
  {id: 26, name: 'Textiles'},
  {id: 27, name: 'Tyres & Rubber products'},
  {id: 28, name: 'Vehicles / Automobiles'},
  {id: 29, name: 'Others'},
];

const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to ensure we're comparing dates, not times
  return today;
};
const PersonalBookingScreen = () => {
  const [step, setStep] = useState(0);
  const [pickupLocation, setPickupLocation] = useState(''); // Pickup location text
  const [pickupLocationId, setPickupLocationId] = useState(null); // Pickup location ID
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date()); // Date object for Start Date
  // ✅ selected truck type

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTruckTypes, setSelectedTruckTypes] = useState(null);
  const [TruckTypes, setTruckTypes] = useState(truckTypesList);
  const [goodsTypes, setGoodsTypes] = useState(goodsTypesList);

  const [showGoodsDropdown, setShowGoodsDropdown] = useState(false);
  const [selectedGoodsType, setSelectedGoodsType] = useState(null); // Display
  const [selectedTruckTypeId, setSelectedTruckTypeId] = useState(null);
  const [selectedGoodsTypeId, setSelectedGoodsTypeId] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date());

  const [weightVal, setWeightVal] = useState('');
  const [weight, setWeight] = useState('');
  const [otherDetails, setOtherDetails] = useState('');
  const [query, setQuery] = useState(''); // Text input field
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const navigation = useNavigation();
  const route = useRoute(); // Use this to access route params
  const [selectedService, setSelectedService] = useState(
    route.params?.service || null,
  );
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
  const handleInputChange = text => {
    setQuery(text);
    setPickupLocation(''); // Reset pickupLocation when typing starts
    if (text.length === 0) {
      // If the query is empty, show all locations
      setFilteredLocations(allLocations);
      setShowNoResults(false);
    } else {
      // Filter locations that match the query
      const filtered = allLocations.filter(city =>
        city.name.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredLocations(filtered);
      setShowNoResults(filtered.length === 0); // Show "No results" if no matching locations
    }
  };

  // Handle location selection
  const handleLocationSelect = location => {
    setPickupLocation(location.name); // Set pickup location name
    setPickupLocationId(location.id); // Set pickup location ID
    setQuery(''); // Clear query after selecting location
  };

  const nextStep = () => {
    if (step === 0 && (!pickupLocation || !pickupLocationId))
      return alert('Please select a pickup location');
    if (step === 1 && !destination) return alert('Please enter destination');
    if (step === 3 && !selectedTruckTypeId)
      return alert('Please select a truck type');
    if (step === 4 && !selectedGoodsTypeId)
      return alert('Please select a goods type');
    if (step === 5 && (!weightVal || !weight))
      return alert('Please enter weight and unit');

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
          alert('You cannot select past dates. Selecting today instead.');
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
          alert('You cannot select past dates. Selecting today instead.');
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
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const token = await AsyncStorage.getItem('token');

      if (!customerId) {
        alert('Customer ID is missing, please login first');
        return;
      }

      const payload = {
        customer_id: customerId,
        service_id: 6,
        service_name: 'Truck Rental',
        truck_mode: 1,
        location_id: pickupLocationId,
        location_name: pickupLocation,
        destination,
        journey_datetime: startDate.toISOString(),
        truck_type: selectedTruckTypeId, // ✅ ID
        personal_good_type: selectedGoodsTypeId, // ✅ ID

        weight_val: weightVal,
        weight: weight === 'KG' ? 1 : weight === 'TON' ? 2 : null,
        other_info: otherDetails,
      };
      console.log('data ', payload);

      const response = await axios.post(
        'https://app.transrentals.in/api/customer-personal-booking',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.booking_id) {
        navigation.replace('BookingConfirmation');
      } else {
        alert('Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error?.response?.data || error.message);
      alert('There was an error. Please try again later.');
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
            <View style={{position: 'relative'}}>
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
                      filteredLocations.slice(0, 500).map(city => (
                        <TouchableOpacity
                          key={city.id}
                          style={styles.suggestionItem}
                          onPress={() => handleLocationSelect(city)}>
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
              {cities.map(city => {
                const isSelected = city.id === pickupLocationId;
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityBox,
                      isSelected && styles.selectedImageBox,
                    ]}
                    onPress={() => handleLocationSelect(city)}>
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

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Start Date & Time</Text>
            <TouchableOpacity
              onPress={openStartDateTimePicker}
              style={styles.input}>
              <Text>{startDate.toLocaleString()}</Text>
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

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Select truck type</Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              ]}
              onPress={() => setShowDropdown(!showDropdown)}>
              <Text>{selectedTruckTypes || 'Select an option'}</Text>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#333"
              />
            </TouchableOpacity>
            {showDropdown && (
              <ScrollView style={styles.dropdownMenu}>
                {TruckTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedTruckTypes(type.name); // Display
                      setSelectedTruckTypeId(type.id); // Submit
                      setShowDropdown(false);
                    }}>
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
                  if (!selectedTruckTypeId) {
                    alert('Please select a truck type');
                    return;
                  }
                  nextStep();
                }}>
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Select Goods Type</Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              ]}
              onPress={() => setShowGoodsDropdown(!showGoodsDropdown)}>
              <Text>{selectedGoodsType || 'Select an option'}</Text>
              <Ionicons
                name={showGoodsDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#333"
              />
            </TouchableOpacity>
            {showGoodsDropdown && (
              <ScrollView style={styles.dropdownMenu}>
                {goodsTypes.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedGoodsType(item.name); // ✅ display
                      setSelectedGoodsTypeId(item.id); // ✅ submit
                      setShowGoodsDropdown(false);
                    }}>
                    <Text>{item.name}</Text>
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
                  if (!selectedGoodsTypeId) {
                    alert('Please select a goods type');
                    return;
                  }
                  nextStep();
                }}>
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Enter Weight</Text>
            <TextInput
              style={styles.input}
              placeholder="Weight (e.g. 1500)"
              value={weightVal}
              keyboardType="numeric"
              onChangeText={setWeightVal}
              placeholderTextColor={'#888'}
            />
            <TextInput
              style={styles.input}
              placeholder="Unit (KG / TON)"
              value={weight}
              onChangeText={setWeight}
              placeholderTextColor={'#888'}
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

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Any Other Details</Text>
            <TextInput
              style={[styles.input, {height: 100}]}
              multiline
              placeholder="Additional info"
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
  container: {flex: 1, padding: 20, backgroundColor: '#fff'},
  stepContainer: {marginBottom: 40},
  label: {fontSize: 26, fontWeight: 'bold', marginBottom: 16},
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
    shadowOffset: {width: 0, height: 2},
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
  iconImage: {width: 100, height: 60, marginBottom: 8},
  icondurationImage: {width: 150, height: 60, marginBottom: 8},
  optionBox: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    marginBottom: 10,
  },
  gridContainer3: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cityImage: {width: '100%', height: 100, resizeMode: 'cover'},
  cityName: {textAlign: 'center', padding: 6, fontWeight: '600'},
  nextBtn: {
    backgroundColor: '#09B368',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  nextBtnText: {color: '#fff', fontWeight: '600'},
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
  nextBtnText: {color: '#fff', fontWeight: '600'},
  truckTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },

  truckTypeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
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
  selectedTruckTypeButton: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },

  truckTypeText: {
    color: '#333',
  },

  selectedTruckTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
});

export default PersonalBookingScreen;
