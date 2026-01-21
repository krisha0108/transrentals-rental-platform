import React, { useState, useRef,useEffect  } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
  
    Image,
    Modal,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');
const boxSize = (width - 60) / 3;
const ITEM_WIDTH = width * 0.75;
const SPACER_WIDTH = (width - ITEM_WIDTH) / 2;
const sliderItems  = [
 {
    image: require('../../../assets/carrrrr.png'),
    title: 'Sedan Car on Rent',
   
  },
  {
    image: require('../../../assets/InnovaCrystaCarOnRent.png'),
    title: 'Innova Crysta Car On Rent',
    
  },
  {
    image: require('../../../assets/7SeaterCarOnRent.png'),
    title: '7 Seater Car On Rent',
    
  },
  {
    image: require('../../../assets/carblacks.png'),
    title: '7 Seater Car On Rent',
    
  },
  {
    image: require('../../../assets/InnovaCarOnRent.png'),
    title: 'Innova Car On Rent',
    
  },
 
];
const faqs = [
   {
    question: 'How does TransRentals ensure safety during one-way cab journeys?',
    answer:
      'TransRentals prioritizes passenger safety by employing highly trained professional drivers with extensive experience in navigating various roads and terrains. Additionally, all our vehicles undergo regular maintenance checks to ensure they meet safety standards.',
  },
  {
    question: 'What are the benefits of choosing one-way cab services over round-trip bookings?',
    answer:
      'Our rates are competitive and transparent. Visit our website for detailed pricing based on your specific journey. We aim to provide the cheapest airport taxi options without compromising on service.',
  },
  {
    question: 'How far in advance should I book a one-way cab taxi with TransRentals?',
    answer:
      'It\'s recommended to book your one-way cab taxi in advance, especially during peak travel seasons, to secure your preferred vehicle and departure time. Booking ahead ensures a stress-free travel experience without any last-minute hassles.',
  },
  {
    question: 'What factors determine the pricing of one-way cab fares with TransRentals?',
    answer:
      'The pricing of one-way cab fares with TransRentals is transparent and based on factors such as the distance traveled, type of vehicle selected, and any additional services requested. You can rest assured that there are no hidden fees or surprises.',
  },
  {
    question: 'Are there any special discounts or promotions available for one-way cab bookings?',
    answer:
      'TransRentals occasionally offers special discounts and promotions on one-way cab bookings, especially for frequent travelers or during festive seasons. Keep an eye out for any ongoing offers on our website or mobile app.',
  },
  {
    question: 'What if I need to make changes to my one-way cab booking with TransRentals?',
    answer:
      'If you need to make changes to your one-way cab booking, such as adjusting the pick-up time or location, you can easily do so by contacting our 24/7 customer support team. We\'ll assist you in making the necessary adjustments to your booking.',
  },
  {
    question: 'Can I track the location of my one-way cab taxi during the journey?',
    answer:
      'Yes, TransRentals provides real-time tracking of your one-way cab taxi through our mobile app or website. You can monitor the location of your cab and estimated arrival time to ensure a seamless travel experience.',
  },
  {
    question: 'What types of vehicles are available for one-way cab bookings with TransRentals?',
    answer:
      'TransRentals offers a diverse fleet of vehicles to suit various travel needs, including compact sedans, spacious SUVs, and even luxury vehicles for special occasions. You can choose the vehicle that best fits your preferences and group size.',
  },
  {
    question: 'Is it possible to request additional services or amenities for my one-way cab journey?',
    answer:
      'Yes, TransRentals accommodates special requests for additional services or amenities to enhance your one-way cab journey. Whether you need a child seat, Wi-Fi access, or a designated stop along the way, simply let us know, and we\'ll do our best to fulfill your requirements.',
  },
  {
    question: 'Can I book a one-way cab taxi for a single journey without worrying about the return trip?',
    answer:
      'Absolutely! TransRentals offers one-side taxi booking services specifically designed for travelers who need transportation for a single journey. You can book your ride hassle-free and enjoy the convenience of not having to worry about the return journey.',
  },
 
];
const bikeData = [
    {
        name: 'Taxi Service',
        image: require('../../../assets/TaxiService.png'), // Update to actual scooter image
    },
    {
        name: 'One way car rental',
        image: require('../../../assets/oneWayCar.png'), // Replace with sport bike image
    },
    {
        name: 'Airport\nTaxi',
        image: require('../../../assets/airportTaxi.png'), // Replace with cruiser image
    },
   
];

const quoteData = [
  {
    id: '1',
    number: '1',
    heading: 'Enquire',
    body: `Post your requirement on our website or mobile app, providing all necessary details such as vehicle type, travel dates, and pickup and drop-off locations.`,
  },
  {
    id: '2',
    number: '2',
    heading: 'Get Quote',
    body: `From economy cars and luxury sedans to trucks and Bike or spacious buses, TransRentals offers an extensive selection of vehicles to suit your preferences and budget.`,
  },
  {
    id: '3',
    number: '3',
    heading: 'Book',
    body: `Compare the quotes and choose the one that best suits your needs, then confirm your booking by paying the required booking amountmentioned in the quote.`,
  },
  // add more cards as needed
];
export default function OnewayScreenHome() {

  const loopedSliderData = [...sliderItems, ...sliderItems, ...sliderItems];
const sliderMiddleIndex = sliderItems.length;
const sliderRef = useRef(null);
const [sliderActiveIndex, setSliderActiveIndex] = useState(sliderMiddleIndex);
const sliderScrollX = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();
const [isModalVisible, setModalVisible] = useState(false);
  const [customerData, setCustomerData] = useState(null);
      const [activeIndex, setActiveIndex] = useState(0);
       const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
      const fetchCustomerData = async () => {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        setCustomerData(JSON.parse(data));
      }
    };
    fetchCustomerData();
  if (sliderRef.current) {
    sliderRef.current.scrollToIndex({ index: sliderMiddleIndex, animated: false });
  }
}, []);
const handleBookNow = () => {
    if (customerData && !customerData.phone) {
      // If phone number is missing, show modal to navigate to profile
      setModalVisible(true);
    } else {
      // Proceed with booking - navigate to modern CarRentalFleetScreen with one_way trip type
      navigation.navigate('CarRentalFleetScreen', { tripType: 'one_way' });
    }
  };

  const closeModal = () => setModalVisible(false);

const onScrollToIndexFailed = (info) => {
  const wait = new Promise(resolve => setTimeout(resolve, 500));
  wait.then(() => {
    sliderRef.current?.scrollToIndex({ index: info.index, animated: true });
  });
};
const renderSliderItem = ({ item, index }) => {
  return (
     <Animated.View
      style={{
        width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <Image
        source={item.image}
        style={{ width: width * 0.9, height: 100, borderRadius: 10 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 8 }}>
        {item.title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#666',
          marginTop: 4,
          textAlign: 'center',
          width: width * 0.85,
        }}
      >
        {item.description}
      </Text>
    </Animated.View>
  );
};

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setActiveIndex(index);
      },
    }
  );
    const renderItem = ({ item, index }) => {
  const inputRange = [
    (index - 1) * width,
    index * width,
    (index + 1) * width,
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.85, 1, 0.85],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange,
    outputRange: [20, 0, 20], 
  });

  return (
    <Animated.View
      style={[
        styles.quoteCard,
        {
          width: width - 45,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      <View style={styles.quoteTextWrapperMain}>
        <View style={styles.quoteNumberCircle}>
          <Text style={styles.quoteNumber}>{item.number}</Text>
        </View>
        <Text style={styles.quoteHeading}>{item.heading}</Text>
      </View>
      <View style={styles.quoteBodyMain}>
        <Text style={styles.quoteBody}>{item.body}</Text>
      </View>
    </Animated.View>
  );
};


    return (
        <SafeAreaView >
          
            <ScrollView style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                          <Icon name="arrow-left" size={26} color="#000" marginLeft="5%" marginTop="5%" position="absolute"/>
                        </TouchableOpacity>
                <View style={styles.headerRow}>
                    <Image
                        source={require('../../../assets/CarHeader.png')}
                        style={styles.headerImage}
                    />
                </View>
                <Text style={styles.bikeTypesTitle}>One Way Cab</Text>

              
                              <View >
                                   <Text style={styles.TextNormal}>Get the best rates for Way Cab and Taxi Rentals
from India's Leading vehicle Rental Market Place.
Book outstation cabs for one way. Make your
Journey safe and hassle-free with One Way Cab
for Outstation from TransRentals.</Text>
                              </View>
                              <Text style={styles.bikeTypesTitle}>Top Car Rental</Text>
<View style={{ marginTop: 20 }}>
 <Animated.FlatList
  ref={sliderRef}
  data={loopedSliderData}
  keyExtractor={(_, index) => index.toString()}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { x: sliderScrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        let index = Math.round(offsetX / width);
        setSliderActiveIndex(index);
      },
    }
  )}
  scrollEventThrottle={16}
  renderItem={renderSliderItem}
  onMomentumScrollEnd={(event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    let index = Math.round(offsetX / width);
    if (index === 0) {
      index = sliderMiddleIndex;
      sliderRef.current.scrollToIndex({ index, animated: false });
    } else if (index === loopedSliderData.length - 1) {
      index = sliderMiddleIndex - 1;
      sliderRef.current.scrollToIndex({ index, animated: false });
    }
    setSliderActiveIndex(index);
  }}
  getItemLayout={(_, index) => ({
    length: width,
    offset: width * index,
    index,
  })}
  onScrollToIndexFailed={onScrollToIndexFailed}
/>
  {/* Pagination Dots */}
  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
    {sliderItems.map((_, i) => {
      const realIndex = sliderActiveIndex % sliderItems.length;
      return (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            margin: 5,
            backgroundColor: i === realIndex ? '#2FCD72' : '#D9D9D9',
          }}
        />
      );
    })}
  </View>
</View>
                <Text style={styles.quoteTitle}>How To Get Quote From{'\n'}TransRentals?</Text>

              
  <View>
     <Animated.FlatList
  data={quoteData}
  keyExtractor={(item) => item.id}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  onScroll={handleScroll}
  scrollEventThrottle={16}
  renderItem={renderItem}
  contentContainerStyle={{
    paddingHorizontal: 5,
    paddingVertical: 10,
    justifyContent: 'center',
  }}
/>
      <View style={styles.paginationDots}>
        {quoteData.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.activeDot : null]}
          />
        ))}
      </View>
    </View>

              
<View style={styles.faqSec}>
      <Text style={styles.faqTitle}>FAQs: About Our Airport Taxi
Service</Text>
      {faqs.map(({ question, answer }, index) => {
        const isExpanded = index === expandedIndex;
        return (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestionRow}
              onPress={() => toggleFAQ(index)}
            >
              <Text style={styles.faqQuestion}>{question}</Text>
              <Text style={styles.faqToggle}>{isExpanded ? '-' : '+'}</Text>
            </TouchableOpacity>
            {isExpanded && <Text style={styles.faqAnswer}>{answer}</Text>}
            <View style={styles.faqDivider} />
          </View>
        );
      })}
          <View style={styles.footerRow}>
                    <Image
                        source={require('../../../assets/AirportRoad.png')}
                        style={styles.footerImage}
                    />
                </View>
                 <View style={styles.footerEnd}>
                                    
                                </View>
    </View>
   

               

             
            </ScrollView>
              <TouchableOpacity style={styles.bookNowButton}   onPress={handleBookNow}   activeOpacity={1}>
                    <Text style={styles.bookNowText}>Book Now</Text>
                </TouchableOpacity>
<Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                 <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Please Add your phone number First</Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('EditProfileScreen'); // Navigate to Profile Screen
                }}
              >
                <Text style={styles.submitText}>Go to Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',

    },
    headerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
        modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    marginTop:20,
    marginBottom: 10,
    textAlign:'center'
  },
  submitButton: {
    backgroundColor: '#2FCD72',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },

    headerRow: {
        width: '100%',
        marginTop: 50,
        height: 125,
        justifyContent: 'flex-start',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
      footerEnd: {
        width: '100%',
        height: 30,
        justifyContent: 'flex-start',
        backgroundColor: '#000',
    },
    footerRow: {
        width: '100%',
        marginTop: 50,
      
        justifyContent: 'flex-start',
        backgroundColor: '#16161E',
    },

    footerImage: {
        width: '100%',
        height: 152,
         objectFit: 'cover',
    },
    moveWithText: {
        fontFamily: 'Manrope-SemiBold',
        fontWeight: '600',
        fontSize: 14,
        color: '#404040',
    },
    prideText: {
        fontFamily: 'Pattaya-Regular',
        fontSize: 14,
        color: '#1BB55B',
        marginLeft: 5,
    },
        TextNormal: {
  width: '100%',
  fontFamily: 'manarope',
fontSize: 16,
paddingHorizontal: 20,
marginBottom:10,

    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    bikeTypesTitle: {
        marginLeft: 15,
        fontSize: 18,
        fontWeight: '700',
        color: '#404040',
        fontFamily: 'Manrope-SemiBold',
        marginVertical: 10,
    },
    box: {
        width: boxSize,
        height: 120,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    image: {
        width: 70,
        height: 70,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        textAlign: 'center',
    },
    bikeIconPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#C4C4C4',
        borderRadius: 30,
        marginBottom: 8,
    },
    bikeTypeText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'black',
        fontFamily: 'Manrope-Medium',
    },
    quoteTitle: {
        marginTop: 20,
        marginLeft: 23,
        fontSize: 20,
        fontWeight: '700',
      color: '#404040',
        fontFamily: 'Manrope-Bold',
    },
    quoteTextWrapperMain: {
        width: '100%',
        flexDirection: 'row',
        alignContent: 'center',
marginBottom: 10,
    },
    quoteCard: {
        marginHorizontal: 20,
        marginTop: 18,
        backgroundColor: 'white',
        borderRadius: 5,
       paddingVertical:25,
       paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 3.55,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
        
    },
  quoteNumberCircle: {
        width: 60,
        borderRadius: 15,
        // backgroundColor: '#DDF7E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 50,
        boorderWidth: 2,
        position: 'absolute',
        opacity: 0.8,
bottom: -70,
        
    },
    quoteNumber: {
        fontWeight: '700',
        fontSize: 100,
        color: '#DDF7E8',
        fontFamily: 'Manrope-SemiBold',
    },
    quoteTextWrapper: {
        flex: 1,
    },
    quoteHeading: {
        fontWeight: '700',
        fontSize: 20,
       color: '#404040',
        marginLeft: 65,
        fontFamily: 'Manrope-Bold',
        marginTop: 5,
    },
    quoteBody: {
        fontWeight: '400',
        fontSize: 16,
        color: '#4D4C4C',
        fontFamily: 'Manrope-Regular',
        lineHeight: 18,
        textAlign: 'center',
marginTop: 10,
width: '100%',
    },
    quoteBodyMain: {
     
width: '100%',
    },
    paginationDots: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#D9D9D9',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: '#2FCD72',
    },
    faqTitle: {
      paddingHorizontal: 15,
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        fontFamily: 'Manrope-Bold',
        marginBottom: 15,
    },
    faqItem: {
        backgroundColor: '#16161E',
        paddingHorizontal: 10,
        marginBottom: 18,
    },
    faqSec: {
        width: '100%',
        backgroundColor: '#16161E',
        paddingTop:15,
    },
    faqQuestionRow: {
         paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
           width: '100%',
    },
   faqQuestion: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Manrope-Bold',
        flex: 1,
        lineHeight: 24,
    },
      faqToggle: {
        color: 'white',
        fontSize: 30,
        fontWeight: '400',
        fontFamily: 'Manrope-Bold',
        marginLeft: 10,
    },
    faqAnswer: {
         paddingHorizontal: 15,
        color: 'white',
        fontSize: 14,
        fontWeight: '300',
        fontFamily: 'Manrope-Regular',
        marginTop: 6,
        lineHeight: 18,
    },
   faqDivider: {
        borderBottomColor: '#404040',
        borderBottomWidth: 0.4,
        marginTop: 10,
    },
 
    bookNowButton: {
  position: 'absolute',
  width: '100%',
  bottom: 0,
  left: 0,
  right: 50,
  height: 80,
  justifyContent: 'center',
  alignItems: 'center',
   paddingVertical: 10,
},
// bookNowButton: {
//   position: 'absolute',
//   width: '100%',
//   bottom: 50,
//   left: 0,
//   right: 50,
//   backgroundColor: '#2FCD72',
//   height: 50,
//   borderRadius: 50,
//   justifyContent: 'center',
//   alignItems: 'center',
//    marginVertical: 50,
// },
       bookNowText: {
        color: '#fff',
        backgroundColor: '#2FCD72',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Manrope-Medium',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '50%',
        textAlign: 'center',
      
        
    },
});
