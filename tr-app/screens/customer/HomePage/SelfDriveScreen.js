import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { locationService } from '../../services';
import { getMinBookingDate, isPickupTooSoon, getEarliestPickupLabel } from '../../utils/dateValidation';
import BookingAlertModal from '../../utils/AdvanceBookingAlert';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {
  TEAL_DEEP,
  TEAL_MID,
  TEAL,
  TEAL_LIGHT,
  BG,
  CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SHADOW_SM,
  SHADOW_MD,
} from '../../../theme';

const faqList = [
  { q: 'Do I need to pay deposit?', a: 'Some vendors may ask for a refundable security deposit depending on the car.' },
  { q: 'Can I get it delivered?', a: 'Yes, select doorstep option when requesting quote and vendor will deliver to your location.' },
  { q: 'Can I take it outstation?', a: 'Mention it in notes while requesting quote, vendor will quote accordingly.' },
];

export default function SelfDriveScreen() {
  const navigation = useNavigation();

  // Location data
  const [showBookingAlert, setShowBookingAlert] = useState(false);
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

  /* -- StatusBar management -- */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, []),
  );

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
    const start = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const end = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate());
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
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
        if (isPickupTooSoon(upd)) {
          setShowBookingAlert(true);
          setAndroidPickerVisible(false);
          return;
        }
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

    // 12-hour advance booking validation
    if (isPickupTooSoon(pickupDate)) {
      setShowBookingAlert(true);
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={styles.decoCircle1} pointerEvents="none" />
        <View style={styles.decoCircle2} pointerEvents="none" />
        <View style={styles.decoCircle3} pointerEvents="none" />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Self Drive Car</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MySelfDriveBookings')}
            style={styles.bookingsBtn}
          >
            <Ionicons name="list" size={wp('5%')} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>Find Self Drive Cars</Text>
              <Text style={styles.formDesc}>Browse cars, request quotes from vendors</Text>
            </View>
            <View style={styles.securePill}>
              <Ionicons name="car-sport" size={wp('3.5%')} color="#fff" />
              <Text style={styles.securePillText}>Self Drive</Text>
            </View>
          </View>

          {/* Location Input */}
          <View style={styles.locationBlock}>
            <Text style={styles.smallLabel}>Pickup City</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location" size={wp('4.2%')} color={TEAL} />
              </View>
              <TextInput
                value={query.length ? query : pickupLocation}
                onChangeText={handleInputChange}
                placeholder="Enter pickup city"
                placeholderTextColor={TEXT_MUTED}
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
                  <Ionicons name="close-circle" size={wp('5%')} color={TEXT_MUTED} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                <ScrollView
                  style={{ maxHeight: hp('26%') }}
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
                        <Ionicons name="navigate-outline" size={wp('3.8%')} color={TEAL} style={{ marginRight: wp('2%') }} />
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
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>PICKUP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
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
              style={[styles.dateCard, { marginRight: 0, marginLeft: wp('2%') }]}
              onPress={() => {
                if (Platform.OS === 'android') openAndroidPicker('drop');
                else setShowDropPickerIOS(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>DROP</Text>
              <View style={styles.dateContent}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar-outline" size={wp('4%')} color={TEAL} />
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
            <View style={styles.durationIconWrap}>
              <Ionicons name="time-outline" size={wp('3.5%')} color={TEAL} />
            </View>
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
                  if (isPickupTooSoon(d)) {
                    setShowBookingAlert(true);
                    return;
                  }
                  setPickupDate(d);
                  if (dropDate <= d) {
                    setDropDate(new Date(d.getTime() + 24 * 60 * 60 * 1000));
                  }
                }}
                minimumDate={getMinBookingDate()}
              />
              <TouchableOpacity style={styles.iosBtnWrap} onPress={() => setShowPickupPickerIOS(false)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.iosBtnGradient}
                >
                  <Text style={styles.iosBtnText}>Done</Text>
                </LinearGradient>
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
              <TouchableOpacity style={styles.iosBtnWrap} onPress={() => setShowDropPickerIOS(false)} activeOpacity={0.85}>
                <LinearGradient
                  colors={[TEAL_MID, TEAL]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.iosBtnGradient}
                >
                  <Text style={styles.iosBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Explore Button */}
          <TouchableOpacity style={styles.exploreBtnWrap} onPress={handleExplore} activeOpacity={0.85}>
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreBtnGradient}
            >
              <Ionicons name="search" size={wp('5%')} color="#fff" />
              <Text style={styles.exploreBtnText}>Explore Cars</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My Bookings Quick Access */}
        <TouchableOpacity
          style={styles.myBookingsCard}
          onPress={() => navigation.navigate('MySelfDriveBookings')}
          activeOpacity={0.8}
        >
          <View style={styles.myBookingsLeft}>
            <View style={styles.myBookingsIcon}>
              <Ionicons name="car" size={wp('5.5%')} color={TEAL} />
            </View>
            <View>
              <Text style={styles.myBookingsTitle}>My Self Drive Bookings</Text>
              <Text style={styles.myBookingsDesc}>View your quote requests & bookings</Text>
            </View>
          </View>
          <View style={styles.myBookingsArrow}>
            <Ionicons name="chevron-forward" size={wp('4%')} color={TEAL} />
          </View>
        </TouchableOpacity>

        {/* Popular Cars */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Popular Self Drive Cars</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: wp('4%') }}>
            {popularCars.map((car) => (
              <View key={car.id} style={styles.carCard}>
                <LinearGradient
                  colors={[TEAL_LIGHT, '#F0FDF9']}
                  style={styles.carImageWrap}
                >
                  <Image source={car.image} style={styles.carImage} />
                </LinearGradient>
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
                  activeOpacity={0.7}
                >
                  <View style={styles.cityIconCircle}>
                    <Ionicons name="location" size={wp('3%')} color={TEAL} />
                  </View>
                  <Text style={styles.cityText}>{city}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <Ionicons name="help-circle-outline" size={wp('5.5%')} color={TEAL} />
            <Text style={styles.faqTitle}>FAQs</Text>
          </View>
          {faqList.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            const isLast = idx === faqList.length - 1;
            return (
              <View key={idx} style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => setExpandedFaq(isOpen ? null : idx)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <View style={styles.faqChevronWrap}>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={wp('3.5%')} color={TEAL} />
                  </View>
                </TouchableOpacity>
                {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </View>
            );
          })}
        </View>


        <View style={{ height: hp('5%') }} />
      </ScrollView>

      {/* Android DateTimePicker */}
      {androidPickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={androidPickingTarget === 'pickup' ? pickupDate : dropDate}
          mode={androidPickerMode}
          display="default"
          onChange={onAndroidChange}
          minimumDate={androidPickingTarget === 'pickup' ? getMinBookingDate() : pickupDate}
        />
      )}
      <BookingAlertModal visible={showBookingAlert} onClose={() => setShowBookingAlert(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* -- HEADER -- */
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    top: -hp('4%'),
    right: -wp('8%'),
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -hp('3%'),
    left: -wp('10%'),
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoCircle3: {
    position: 'absolute',
    top: hp('2%'),
    left: wp('25%'),
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: wp('4.6%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bookingsBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* -- FORM CARD -- */
  formCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    borderRadius: wp('5%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    marginTop: -hp('0.5%'),
    ...SHADOW_MD,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  formTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  formDesc: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  securePill: {
    backgroundColor: TEAL,
    borderRadius: wp('10%'),
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  securePillText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: '600',
  },

  /* -- LOCATION -- */
  locationBlock: {
    backgroundColor: '#F8FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
  },
  smallLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '600',
    color: TEAL_MID,
    marginBottom: hp('0.5%'),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: wp('3%'),
    minHeight: hp('6.5%'),
    gap: wp('2%'),
    ...SHADOW_SM,
  },
  locationIconCircle: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    fontSize: wp('3.8%'),
    color: TEXT_PRIMARY,
    paddingVertical: hp('0.8%'),
  },
  suggestionBox: {
    position: 'absolute',
    top: hp('11%'),
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    zIndex: 100,
    ...SHADOW_MD,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.1%'),
    borderBottomWidth: 0.5,
    borderColor: '#F0F4F3',
  },
  suggestionText: {
    fontSize: wp('3.5%'),
    color: TEXT_PRIMARY,
  },
  noResult: {
    padding: wp('3%'),
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: wp('3.2%'),
  },

  /* -- DATE ROW -- */
  dateRow: {
    flexDirection: 'row',
    marginBottom: hp('1.2%'),
  },
  dateCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginRight: wp('2%'),
    ...SHADOW_SM,
  },
  dateLabel: {
    fontSize: wp('2.9%'),
    fontWeight: '700',
    color: TEAL_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp('0.7%'),
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  dateIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMainText: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateSubText: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.2%'),
  },

  /* -- DURATION -- */
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('1.5%'),
    gap: wp('2%'),
  },
  durationIconWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    fontSize: wp('3.2%'),
    color: TEXT_SECONDARY,
  },
  durationBold: {
    fontWeight: '700',
    color: TEAL_DEEP,
  },

  /* -- iOS PICKER -- */
  iosPickerContainer: {
    backgroundColor: CARD,
    borderRadius: wp('3%'),
    marginBottom: hp('1.2%'),
    padding: wp('2.5%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  iosBtnWrap: {
    borderRadius: wp('2.5%'),
    overflow: 'hidden',
    marginTop: hp('0.8%'),
  },
  iosBtnGradient: {
    borderRadius: wp('2.5%'),
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
  },
  iosBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: wp('3.5%'),
  },

  /* -- EXPLORE BUTTON -- */
  exploreBtnWrap: {
    marginTop: hp('0.5%'),
    borderRadius: wp('10%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  exploreBtnGradient: {
    borderRadius: wp('10%'),
    paddingVertical: hp('1.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* -- MY BOOKINGS CARD -- */
  myBookingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  myBookingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myBookingsIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  myBookingsTitle: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  myBookingsDesc: {
    fontSize: wp('3%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  myBookingsArrow: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* -- SECTION CARD -- */
  sectionCard: {
    backgroundColor: CARD,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4%'),
    padding: wp('4%'),
    ...SHADOW_SM,
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.2%'),
    letterSpacing: 0.2,
  },

  /* -- CAR CARDS -- */
  carCard: {
    width: wp('32%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('2.5%'),
    alignItems: 'center',
    marginRight: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
    ...SHADOW_SM,
  },
  carImageWrap: {
    width: '100%',
    height: hp('8%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  carImage: {
    width: wp('22%'),
    height: hp('5.5%'),
    resizeMode: 'contain',
  },
  carName: {
    fontSize: wp('3.2%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },

  /* -- CITY CHIPS -- */
  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_LIGHT,
    borderRadius: wp('10%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    marginRight: wp('2%'),
    marginBottom: hp('0.8%'),
    gap: wp('1.5%'),
  },
  cityIconCircle: {
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityText: {
    fontSize: wp('3.2%'),
    color: TEAL_DEEP,
    fontWeight: '600',
  },

  /* -- FAQ SECTION -- */
  faqSection: {
    backgroundColor: TEAL_DEEP,
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    ...SHADOW_MD,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  faqTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: hp('1.5%'),
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    marginRight: wp('2.5%'),
  },
  faqChevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqAnswer: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp('1%'),
    lineHeight: wp('5%'),
  },

  /* -- BOTTOM CTA -- */
  bottomCTAWrap: {
    marginHorizontal: wp('3.5%'),
    marginTop: hp('2%'),
    borderRadius: wp('4.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4.5%'),
    overflow: 'hidden',
  },
  ctaDecoCircle: {
    position: 'absolute',
    top: -wp('4%'),
    right: -wp('3%'),
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    flex: 1,
  },
  ctaIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  ctaArrowWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
