import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { locationService } from '../../services';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const BG = '#F5F5F7';
const GREEN = '#09B368';

const faqList = [
  { q: 'Do I need to pay deposit?', a: 'Some vendors may ask for a refundable security deposit depending on the car.' },
  { q: 'Can I get it delivered?', a: 'Yes, select doorstep option when requesting quote and vendor will deliver to your location.' },
  { q: 'Can I take it outstation?', a: 'Mention it in notes while requesting quote, vendor will quote accordingly.' },
];

export default function SelfDriveScreen() {
  const navigation = useNavigation();

  // Location data
  const [allLocations, setAllLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationId, setPickupLocationId] = useState(null);

  // Dates
  const [pickupDate, setPickupDate] = useState(new Date());
  const [dropDate, setDropDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +1 day

  // Android date picker
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date');
  const [androidPickingTarget, setAndroidPickingTarget] = useState('pickup');

  // iOS pickers
  const [showPickupPickerIOS, setShowPickupPickerIOS] = useState(false);
  const [showDropPickerIOS, setShowDropPickerIOS] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState(null);
  const dropdownTouching = useRef(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      if (response.success && response.locations) {
        setAllLocations(response.locations);
      }
    } catch (error) {
      console.log('Error fetching locations:', error?.response?.data || error);
    }
  };

  const textSafe = (t) => (t || '').toLowerCase();

  const filteredLocations = query.length
    ? allLocations.filter(
        (l) => typeof l.name === 'string' && l.name.toLowerCase().includes(textSafe(query))
      )
    : allLocations.slice(0, 35);

  const handleInputChange = (text) => {
    setQuery(text);
    setPickupLocation(text);
    setPickupLocationId(null);
    setShowSuggestions(true);
  };

  const handleLocationSelect = (loc) => {
    setPickupLocation(loc.name);
    setPickupLocationId(loc.id);
    setQuery('');
    setShowSuggestions(false);
  };

  // Calculate days
  const calculateDays = () => {
    const diffTime = dropDate.getTime() - pickupDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  // ANDROID date flow
  const openAndroidPicker = (target) => {
    setAndroidPickingTarget(target);
    setAndroidPickerMode('date');
    setAndroidPickerVisible(true);
  };

  const onAndroidChange = (event, selected) => {
    if (event.type === 'dismissed') {
      setAndroidPickerVisible(false);
      return;
    }
    if (!selected) {
      setAndroidPickerVisible(false);
      return;
    }

    if (androidPickerMode === 'date') {
      if (androidPickingTarget === 'pickup') {
        const newDate = new Date(selected);
        const merged = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          pickupDate.getHours(),
          pickupDate.getMinutes()
        );
        setPickupDate(merged);
        if (dropDate <= merged) {
          setDropDate(new Date(merged.getTime() + 24 * 60 * 60 * 1000));
        }
      } else {
        const newDate = new Date(selected);
        const merged = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          dropDate.getHours(),
          dropDate.getMinutes()
        );
        setDropDate(merged);
      }
      setAndroidPickerMode('time');
      setAndroidPickerVisible(true);
      return;
    }

    if (androidPickerMode === 'time') {
      if (androidPickingTarget === 'pickup') {
        const upd = new Date(pickupDate);
        upd.setHours(selected.getHours());
        upd.setMinutes(selected.getMinutes());
        setPickupDate(upd);
        if (dropDate <= upd) {
          setDropDate(new Date(upd.getTime() + 24 * 60 * 60 * 1000));
        }
      } else {
        const upd = new Date(dropDate);
        upd.setHours(selected.getHours());
        upd.setMinutes(selected.getMinutes());
        setDropDate(upd);
      }
      setAndroidPickerVisible(false);
    }
  };

  // Handle Explore
  const handleExplore = () => {
    if (!pickupLocationId) {
      Alert.alert('Select Location', 'Please select a pickup city from the list');
      return;
    }
    if (dropDate <= pickupDate) {
      Alert.alert('Invalid Dates', 'Drop date must be after pickup date');
      return;
    }

    navigation.navigate('SelfDriveFleetScreen', {
      locationId: pickupLocationId,
      locationName: pickupLocation,
      pickupDate: pickupDate.toISOString(),
      dropDate: dropDate.toISOString(),
    });
  };

  const popularCars = [
    { id: '1', name: 'Mahindra Thar', image: require('../../../assets/MahindraThar.png') },
    { id: '2', name: 'Fortuner', image: require('../../../assets/Fortuner.png') },
    { id: '3', name: 'Audi A4', image: require('../../../assets/AudiA4.png') },
    { id: '4', name: 'Willys Jeep', image: require('../../../assets/Willysjee.png') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Self Drive Car</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MySelfDriveBookings')}
          style={styles.bookingsBtn}
        >
          <Ionicons name="list" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          if (!dropdownTouching.current) setShowSuggestions(false);
        }}
      >
        {/* Search Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <View>
              <Text style={styles.formTitle}>Find Self Drive Cars</Text>
              <Text style={styles.formDesc}>Browse cars, request quotes from vendors</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="car-sport" size={14} color="#fff" />
              <Text style={styles.securePillText}>Self Drive</Text>
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Pickup City</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={GREEN} />
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup city"
                placeholderTextColor="#94A3B8"
                style={styles.locationInput}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {pickupLocation ? (
                <TouchableOpacity
                  onPress={() => {
                    setPickupLocation('');
                    setPickupLocationId(null);
                    setQuery('');
                    setShowSuggestions(false);
                  }}
                >
                  <Ionicons name="close-circle" size={22} color="#CBD5E1" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                <ScrollView
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="always"
                  onTouchStart={() => (dropdownTouching.current = true)}
                  onTouchEnd={() => (dropdownTouching.current = false)}
                >
                  {filteredLocations.length ? (
                    filteredLocations.map((loc) => (
                      <TouchableOpacity
                        key={loc.id}
                        style={styles.suggestionItem}
                        onPress={() => handleLocationSelect(loc)}
                      >
                        <Ionicons name="location-outline" size={16} color="#64748B" />
                        <Text style={styles.suggestionText}>{loc.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResult}>No location found</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Selection */}
          <View style={styles.dateRow}>
            {/* Pickup Date */}
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') openAndroidPicker('pickup');
                else setShowPickupPickerIOS(true);
              }}
            >
              <Text style={styles.dateLabel}>PICKUP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar" size={18} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {pickupDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {pickupDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Drop Date */}
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                if (Platform.OS === 'android') openAndroidPicker('drop');
                else setShowDropPickerIOS(true);
              }}
            >
              <Text style={styles.dateLabel}>DROP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar" size={18} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateMainText}>
                    {dropDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.dateSubText}>
                    {dropDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Duration Display */}
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.durationText}>
              Duration: <Text style={styles.durationBold}>{calculateDays()} day{calculateDays() > 1 ? 's' : ''}</Text>
            </Text>
          </View>

          {/* iOS Pickers */}
          {showPickupPickerIOS && Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                value={pickupDate}
                mode="datetime"
                display="spinner"
                onChange={(e, d) => {
                  if (!d) return;
                  setPickupDate(d);
                  if (dropDate <= d) {
                    setDropDate(new Date(d.getTime() + 24 * 60 * 60 * 1000));
                  }
                }}
                minimumDate={new Date()}
              />
              <TouchableOpacity style={styles.iosBtn} onPress={() => setShowPickupPickerIOS(false)}>
                <Text style={styles.iosBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {showDropPickerIOS && Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <DateTimePicker
                value={dropDate}
                mode="datetime"
                display="spinner"
                onChange={(e, d) => {
                  if (!d) return;
                  setDropDate(d);
                }}
                minimumDate={pickupDate}
              />
              <TouchableOpacity style={styles.iosBtn} onPress={() => setShowDropPickerIOS(false)}>
                <Text style={styles.iosBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Explore Button */}
          <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.exploreBtnText}>Explore Cars</Text>
          </TouchableOpacity>
        </View>

        {/* My Bookings Quick Access */}
        <TouchableOpacity
          style={styles.myBookingsCard}
          onPress={() => navigation.navigate('MySelfDriveBookings')}
        >
          <View style={styles.myBookingsLeft}>
            <View style={styles.myBookingsIcon}>
              <Ionicons name="car" size={24} color={GREEN} />
            </View>
            <View>
              <Text style={styles.myBookingsTitle}>My Self Drive Bookings</Text>
              <Text style={styles.myBookingsDesc}>View your quote requests & bookings</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
        </TouchableOpacity>

        {/* Popular Cars */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Popular Self Drive Cars</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularCars.map((car) => (
              <View key={car.id} style={styles.carCard}>
                <Image source={car.image} style={styles.carImage} />
                <Text style={styles.carName}>{car.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Cities */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
          <View style={styles.cityWrap}>
            {['Ahmedabad', 'Bangalore', 'Mumbai', 'Udaipur', 'Jaipur', 'Goa', 'Hyderabad', 'Delhi', 'Pune'].map(
              (city, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.cityChip}
                  onPress={() => {
                    const loc = allLocations.find(
                      (l) => l.name?.toLowerCase() === city.toLowerCase()
                    );
                    if (loc) {
                      handleLocationSelect(loc);
                    }
                  }}
                >
                  <Ionicons name="location" size={14} color={GREEN} />
                  <Text style={styles.cityText}>{city}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>FAQs</Text>
          {faqList.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(isOpen ? null : idx)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Android DateTimePicker */}
      {androidPickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={androidPickingTarget === 'pickup' ? pickupDate : dropDate}
          mode={androidPickerMode}
          display="default"
          onChange={onAndroidChange}
          minimumDate={androidPickingTarget === 'pickup' ? new Date() : pickupDate}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  bookingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  formDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  securePill: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  securePillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },

  locationBlock: {
    marginBottom: 16,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 52,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    marginLeft: 10,
  },
  suggestionBox: {
    position: 'absolute',
    top: 82,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 10,
  },
  noResult: {
    padding: 16,
    textAlign: 'center',
    color: '#94A3B8',
  },

  dateRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dateSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  durationText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  durationBold: {
    fontWeight: '700',
    color: GREEN,
  },

  iosPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
  },
  iosBtn: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  iosBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  exploreBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  myBookingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  myBookingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myBookingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(9,179,104,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  myBookingsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  myBookingsDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  carCard: {
    width: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  carImage: {
    width: 80,
    height: 50,
    resizeMode: 'contain',
  },
  carName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },

  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9,179,104,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  cityText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    marginLeft: 4,
  },

  faqSection: {
    backgroundColor: '#0F172A',
    marginTop: 16,
    padding: 16,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 20,
  },
});
