import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Linking,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import api, { BASE_URL, IMAGE_BASE_URL } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDER_HEIGHT = 220;

// Design Tokens
const COLORS = {
  bg: '#F6F8F8',
  card: '#FFFFFF',
  primary: '#0C5A43',
  primary100: '#E8F9F1',
  secondary: '#16A085',
  text: '#0B1A1A',
  muted: '#6B6F74',
  shadow: 'rgba(12,26,26,0.06)',
  error: '#E23E3E',
  white: '#FFFFFF',
  border: '#E6E9E8',
  success: '#0C5A43',
  warning: '#E67E22',
};

const SPACING = {
  page: 16,
  card: 14,
  section: 12,
};

const RADIUS = {
  lg: 18,
  md: 12,
  sm: 8,
};

const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: '700', lineHeight: 30, color: COLORS.text },
  h2: { fontSize: 18, fontWeight: '600', lineHeight: 22, color: COLORS.text },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: COLORS.muted },
  small: { fontSize: 12, fontWeight: '500', lineHeight: 16, color: COLORS.muted },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 14, color: COLORS.muted },
};

const Bullet = ({ text, color = COLORS.secondary }) => (
  <View style={styles.bulletRowSmall}>
    <View style={[styles.bulletDotSmall, { backgroundColor: color }]} />
    <Text style={styles.bulletSmallText}>{text}</Text>
  </View>
);
// Tab Constants with Icons
// Tab Constants with Icons
// Tab Constants with Icons and Colors
const TABS = [
  { 
    key: 'highlights', 
    label: 'Highlights', 
    icon: 'stars',
    activeColor: '#FF6B35',
    lightColor: '#FFF1EB'
  },
  { 
    key: 'inclusions', 
    label: 'Inclusions', 
    icon: 'check-circle',
    activeColor: '#27AE60',
    lightColor: '#F0F7F0'
  },
  { 
    key: 'exclusions', 
    label: 'Exclusions', 
    icon: 'cancel',
    activeColor: '#E74C3C',
    lightColor: '#FDF2F0'
  },
  { 
    key: 'terms', 
    label: 'Terms & Conditions', 
    icon: 'description',
    activeColor: '#2980B9',
    lightColor: '#F0F7FF'
  },
];

// Tab Content Components with Dynamic Height
// const HighlightsContent = ({ quote }) => {
//   if (!quote?.highlight) return <Text style={styles.emptyTabText}>No highlights available</Text>;
  
//   const highlights = (quote.highlight || '').split(',').filter(Boolean);
  
//   return (
//     <View style={styles.tabContent}>
//       <View style={[styles.tabHeader, { backgroundColor: TABS[0].lightColor }]}>
//         <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
//           <MaterialIcons name="stars" size={20} color={TABS[0].activeColor} />
//         </View>
//         <View>
//           <Text style={[styles.tabTitle, { color: TABS[0].activeColor }]}>Service Highlights</Text>
//           <Text style={styles.tabSubtitle}>Key features of this service</Text>
//         </View>
//       </View>
//       <View style={styles.contentList}>
//         {highlights.map((h, idx) => (
//           <View key={idx} style={styles.listItem}>
//             <MaterialIcons name="star" size={16} color={TABS[0].activeColor} />
//             <Text style={styles.listText}>{h.trim()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const InclusionsContent = ({ quote }) => {
//   if (!quote?.included) return <Text style={styles.emptyTabText}>No inclusions available</Text>;
  
//   const inclusions = (quote.included || '').split(',').filter(Boolean);
  
//   return (
//     <View style={styles.tabContent}>
//       <View style={[styles.tabHeader, { backgroundColor: TABS[1].lightColor }]}>
//         <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
//           <MaterialIcons name="check-circle" size={20} color={TABS[1].activeColor} />
//         </View>
//         <View>
//           <Text style={[styles.tabTitle, { color: TABS[1].activeColor }]}>What's Included</Text>
//           <Text style={styles.tabSubtitle}>All services covered in this package</Text>
//         </View>
//       </View>
//       <View style={styles.contentList}>
//         {inclusions.map((h, idx) => (
//           <View key={idx} style={styles.listItem}>
//             <MaterialIcons name="check" size={16} color={TABS[1].activeColor} />
//             <Text style={styles.listText}>{h.trim()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const ExclusionsContent = ({ quote }) => {
//   if (!quote?.not_included) return <Text style={styles.emptyTabText}>No exclusions available</Text>;
  
//   const exclusions = (quote.not_included || '').split(',').filter(Boolean);
  
//   return (
//     <View style={styles.tabContent}>
//       <View style={[styles.tabHeader, { backgroundColor: TABS[2].lightColor }]}>
//         <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
//           <MaterialIcons name="cancel" size={20} color={TABS[2].activeColor} />
//         </View>
//         <View>
//           <Text style={[styles.tabTitle, { color: TABS[2].activeColor }]}>What's Not Included</Text>
//           <Text style={styles.tabSubtitle}>Additional charges may apply</Text>
//         </View>
//       </View>
//       <View style={styles.contentList}>
//         {exclusions.map((h, idx) => (
//           <View key={idx} style={styles.listItem}>
//             <MaterialIcons name="close" size={16} color={TABS[2].activeColor} />
//             <Text style={styles.listText}>{h.trim()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// const TermsContent = ({ quote }) => {
//   if (!quote?.terms) return <Text style={styles.emptyTabText}>No terms & conditions available</Text>;
  
//   const terms = (quote?.terms || '').split(',').filter(term => term.trim() !== '');
  
//   return (
//     <View style={styles.tabContent}>
//       <View style={[styles.tabHeader, { backgroundColor: TABS[3].lightColor }]}>
//         <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
//           <MaterialIcons name="description" size={20} color={TABS[3].activeColor} />
//         </View>
//         <View>
//           <Text style={[styles.tabTitle, { color: TABS[3].activeColor }]}>Terms & Conditions</Text>
//           <Text style={styles.tabSubtitle}>Important guidelines to follow</Text>
//         </View>
//       </View>
//       <View style={styles.contentList}>
//         {terms.map((term, index) => (
//           <View key={index} style={styles.listItem}>
//             <MaterialIcons name="info" size={16} color={TABS[3].activeColor} />
//             <Text style={styles.listText}>{term.trim()}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// };

// Main Tab Component with ServiceDetails Style
// Main Tab Component with Separate Cards
const TabSection = ({ quote }) => {
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'highlights':
        return <HighlightsContent quote={quote} />;
      case 'inclusions':
        return <InclusionsContent quote={quote} />;
      case 'exclusions':
        return <ExclusionsContent quote={quote} />;
      case 'terms':
        return <TermsContent quote={quote} />;
      default:
        return <HighlightsContent quote={quote} />;
    }
  };

  return (
    <View style={styles.tabSection}>
      {/* Tab Navigation Container */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <MaterialIcons 
                  name={tab.icon} 
                  size={16} 
                  color={isActive ? tab.activeColor : "#6B7280"} 
                />
                <Text style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                  isActive && { color: tab.activeColor }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content Card - Separate card for each tab */}
      <View style={styles.tabContentCard}>
        {renderTabContent()}
      </View>
    </View>
  );
};

// Tab Content Components - Each returns only the content without card wrapper
const HighlightsContent = ({ quote }) => {
  if (!quote?.highlight) return <Text style={styles.emptyTabText}>No highlights available</Text>;
  
  const highlights = (quote.highlight || '').split(',').filter(Boolean);
  
  return (
    <View style={styles.tabContent}>
      <View style={[styles.tabHeader, { backgroundColor: TABS[0].lightColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
          <MaterialIcons name="stars" size={20} color={TABS[0].activeColor} />
        </View>
        <View>
          <Text style={[styles.tabTitle, { color: TABS[0].activeColor }]}>Service Highlights</Text>
          <Text style={styles.tabSubtitle}>Key features of this service</Text>
        </View>
      </View>
      <View style={styles.contentList}>
        {highlights.map((h, idx) => (
          <View key={idx} style={styles.listItem}>
            <MaterialIcons name="star" size={16} color={TABS[0].activeColor} />
            <Text style={styles.listText}>{h.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const InclusionsContent = ({ quote }) => {
  if (!quote?.included) return <Text style={styles.emptyTabText}>No inclusions available</Text>;
  
  const inclusions = (quote.included || '').split(',').filter(Boolean);
  
  return (
    <View style={styles.tabContent}>
      <View style={[styles.tabHeader, { backgroundColor: TABS[1].lightColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
          <MaterialIcons name="check-circle" size={20} color={TABS[1].activeColor} />
        </View>
        <View>
          <Text style={[styles.tabTitle, { color: TABS[1].activeColor }]}>What's Included</Text>
          <Text style={styles.tabSubtitle}>All services covered in this package</Text>
        </View>
      </View>
      <View style={styles.contentList}>
        {inclusions.map((h, idx) => (
          <View key={idx} style={styles.listItem}>
            <MaterialIcons name="check" size={16} color={TABS[1].activeColor} />
            <Text style={styles.listText}>{h.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ExclusionsContent = ({ quote }) => {
  if (!quote?.not_included) return <Text style={styles.emptyTabText}>No exclusions available</Text>;
  
  const exclusions = (quote.not_included || '').split(',').filter(Boolean);
  
  return (
    <View style={styles.tabContent}>
      <View style={[styles.tabHeader, { backgroundColor: TABS[2].lightColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
          <MaterialIcons name="cancel" size={20} color={TABS[2].activeColor} />
        </View>
        <View>
          <Text style={[styles.tabTitle, { color: TABS[2].activeColor }]}>What's Not Included</Text>
          <Text style={styles.tabSubtitle}>Additional charges may apply</Text>
        </View>
      </View>
      <View style={styles.contentList}>
        {exclusions.map((h, idx) => (
          <View key={idx} style={styles.listItem}>
            <MaterialIcons name="close" size={16} color={TABS[2].activeColor} />
            <Text style={styles.listText}>{h.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const TermsContent = ({ quote }) => {
  if (!quote?.terms) return <Text style={styles.emptyTabText}>No terms & conditions available</Text>;
  
  const terms = (quote?.terms || '').split(',').filter(term => term.trim() !== '');
  
  return (
    <View style={styles.tabContent}>
      <View style={[styles.tabHeader, { backgroundColor: TABS[3].lightColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
          <MaterialIcons name="description" size={20} color={TABS[3].activeColor} />
        </View>
        <View>
          <Text style={[styles.tabTitle, { color: TABS[3].activeColor }]}>Terms & Conditions</Text>
          <Text style={styles.tabSubtitle}>Important guidelines to follow</Text>
        </View>
      </View>
      <View style={styles.contentList}>
        {terms.map((term, index) => (
          <View key={index} style={styles.listItem}>
            <MaterialIcons name="info" size={16} color={TABS[3].activeColor} />
            <Text style={styles.listText}>{term.trim()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Services Details Component
const ServicesDetailsSection = ({ quote }) => {
  if (!quote) return null;

  return (
    <View style={styles.servicesSection}>
      <ScrollView 
        style={styles.servicesScrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.servicesContent}
      >
        {/* Service Basic Info */}
        <View style={styles.serviceInfoCard}>
          <Text style={styles.serviceInfoTitle}>Service Information</Text>
          
          <View style={styles.serviceInfoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValue}>{quote.service_name || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{quote.capacity || 'N/A'} persons</Text>
            </View>
          </View>
          
          <View style={styles.serviceInfoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="luggage" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Luggage</Text>
              <Text style={styles.infoValue}>{quote.luggage_capacity || 'N/A'} bags</Text>
            </View>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="airline-seat-recline-extra" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Comfort</Text>
              <Text style={styles.infoValue}>{quote.vehicle_comfort || 'Standard'}</Text>
            </View>
          </View>
        </View>

        {/* Journey Details */}
        <View style={styles.serviceInfoCard}>
          <Text style={styles.serviceInfoTitle}>Journey Details</Text>
          
          <View style={styles.journeyRow}>
            <View style={styles.journeyStep}>
              <View style={styles.journeyDot} />
              <View style={styles.journeyLine} />
            </View>
            <View style={styles.journeyContent}>
              <Text style={styles.journeyLabel}>Pickup Location</Text>
              <Text style={styles.journeyValue}>{quote.booking?.location_name || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.journeyRow}>
            <View style={styles.journeyStep}>
              <View style={styles.journeyDot} />
              <View style={styles.journeyLine} />
            </View>
            <View style={styles.journeyContent}>
              <Text style={styles.journeyLabel}>Destination</Text>
              <Text style={styles.journeyValue}>{quote.booking?.destination || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.journeyRow}>
            <View style={styles.journeyStep}>
              <View style={[styles.journeyDot, styles.journeyDotFinal]} />
            </View>
            <View style={styles.journeyContent}>
              <Text style={styles.journeyLabel}>Journey Date & Time</Text>
              <Text style={styles.journeyValue}>
                {quote.booking?.journey_datetime ? 
                  new Date(quote.booking.journey_datetime).toLocaleString() : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.serviceInfoCard}>
          <Text style={styles.serviceInfoTitle}>Pricing Breakdown</Text>
          
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Fare</Text>
            <Text style={styles.pricingValue}>₹{quote.base_price || '0'}</Text>
          </View>
          
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Additional Charges</Text>
            <Text style={styles.pricingValue}>₹{quote.additional_charges || '0'}</Text>
          </View>
          
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Taxes & Fees</Text>
            <Text style={styles.pricingValue}>₹{quote.taxes || '0'}</Text>
          </View>
          
          <View style={[styles.pricingRow, styles.totalPriceRow]}>
            <Text style={styles.totalPriceLabel}>Total Amount</Text>
            <Text style={styles.totalPriceValue}>₹{quote.price || '0'}</Text>
          </View>
          
          <View style={[styles.pricingRow, styles.advanceRow]}>
            <Text style={styles.advanceLabel}>Advance to Pay</Text>
            <Text style={styles.advanceValue}>₹{quote.min_price || '0'}</Text>
          </View>
        </View>

        {/* Vendor Information */}
        <View style={styles.serviceInfoCard}>
          <Text style={styles.serviceInfoTitle}>Vendor Information</Text>
          
          <View style={styles.vendorInfo}>
            <View style={styles.vendorHeader}>
              <MaterialIcons name="business" size={24} color={COLORS.primary} />
              <Text style={styles.vendorName}>{quote.vendor?.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.vendorDetails}>
              <View style={styles.vendorDetailRow}>
                <MaterialIcons name="star" size={16} color={COLORS.secondary} />
                <Text style={styles.vendorDetailText}>Rating: {quote.vendor?.rating || '4.5'}/5</Text>
              </View>
              
              <View style={styles.vendorDetailRow}>
                <MaterialIcons name="location-on" size={16} color={COLORS.secondary} />
                <Text style={styles.vendorDetailText}>{quote.vendor?.address || 'Address not available'}</Text>
              </View>
              
              <View style={styles.vendorDetailRow}>
                <MaterialIcons name="phone" size={16} color={COLORS.secondary} />
                <Text style={styles.vendorDetailText}>{quote.vendor?.phone || 'Phone not available'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Improved Payment Modal Component
const PaymentModal = ({ 
  visible, 
  onClose, 
  quote, 
  onConfirmPayment, 
  isConfirmingPayment,
  onOpenUPI 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  
  const generateUPI = () => {
    const upiId = '9737965551@okbizaxis';
    const amount = quote?.min_price || 0;
    const name = 'TransRentals';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  };

  const handleCopy = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'UPI ID copied to clipboard');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header - Fixed */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Icon name="x" size={24} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Amount Section */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount to Pay</Text>
              <Text style={styles.amountValue}>₹{quote?.min_price || 0}</Text>
              <Text style={styles.amountNote}>Advance payment to confirm your booking</Text>
            </View>

            {/* Payment Method Selector */}
            {/* <View style={styles.paymentMethodSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                <TouchableOpacity 
                  style={[
                    styles.paymentMethodBtn,
                    paymentMethod === 'upi' && styles.paymentMethodBtnActive
                  ]}
                  onPress={() => setPaymentMethod('upi')}
                >
                  <MaterialIcons 
                    name="payment" 
                    size={20} 
                    color={paymentMethod === 'upi' ? COLORS.primary : COLORS.muted} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'upi' && styles.paymentMethodTextActive
                  ]}>
                    UPI Payment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.paymentMethodBtn,
                    paymentMethod === 'card' && styles.paymentMethodBtnActive
                  ]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <MaterialIcons 
                    name="credit-card" 
                    size={20} 
                    color={paymentMethod === 'card' ? COLORS.primary : COLORS.muted} 
                  />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'card' && styles.paymentMethodTextActive
                  ]}>
                    Card Payment
                  </Text>
                </TouchableOpacity>
              </View>
            </View> */}

            {/* UPI Payment Content */}
          {paymentMethod === 'upi' && (
  <View style={styles.upiSection}>
    {/* QR Code Section - Top */}
    <View style={styles.qrMainContainer}>
      <View style={styles.qrContainer}>
        <QRCode 
          value={generateUPI()} 
          size={160} 
          backgroundColor={COLORS.white}
          color={COLORS.text}
        />
        <View style={styles.qrOverlay}>
          <MaterialIcons name="qr-code-2" size={24} color={COLORS.primary} />
        </View>
      </View>
      <Text style={styles.qrLabel}>Scan QR Code to Pay</Text>
    </View>

    {/* UPI Details Section - Below QR Code */}
    <View style={styles.upiDetails}>
      <Text style={styles.upiLabel}>Or Use UPI ID</Text>
      <View style={styles.upiIdContainer}>
        <Text style={styles.upiValue}>9737965551@okbizaxis</Text>
        <TouchableOpacity 
          onPress={() => handleCopy('9737965551@okbizaxis')} 
          style={styles.copyBtn}
        >
          <Icon name="copy" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.upiNote}>
        Open any UPI app and scan the QR code or enter the UPI ID to pay
      </Text>
    </View>
  </View>
)}
         

            {/* Card Payment Content */}
            {paymentMethod === 'card' && (
              <View style={styles.cardPaymentSection}>
                <View style={styles.cardPlaceholder}>
                  <MaterialIcons name="credit-card" size={48} color={COLORS.muted} />
                  <Text style={styles.cardPlaceholderText}>
                    Card payment integration coming soon
                  </Text>
                  <Text style={styles.cardPlaceholderSubtext}>
                    Please use UPI payment for now
                  </Text>
                </View>
              </View>
            )}

            {/* Security Note */}
            <View style={styles.securityNote}>
              <MaterialIcons name="security" size={16} color={COLORS.success} />
              <Text style={styles.securityText}>
                Your payment is secure and encrypted
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons - Fixed at Bottom */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[
                styles.primaryActionBtn,
                paymentMethod === 'card' && styles.disabledActionBtn
              ]}
              onPress={paymentMethod === 'upi' ? onOpenUPI : null}
              disabled={paymentMethod === 'card'}
            >
              <MaterialIcons 
                name={paymentMethod === 'upi' ? "payment" : "credit-card"} 
                size={20} 
                color={COLORS.white} 
              />
              <Text style={styles.primaryActionText}>
                {paymentMethod === 'upi' ? 'Open UPI App' : 'Card Unavailable'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryActionBtn}
              onPress={onConfirmPayment}
              disabled={isConfirmingPayment}
            >
              {isConfirmingPayment ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.secondaryActionText}>I've Paid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function QuoteDetailScreen({ route, navigation }) {
  const quoteId = route?.params?.quoteId;

  const [quote, setQuote] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // payment modal
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const sliderRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Helpers to build storage urls (kept compatible with your backend)
  const STORAGE_BASE = `${IMAGE_BASE_URL}/`;
  const SITE_BASE = `${BASE_URL}/`;
  const isAbsoluteUrl = (u = '') => /^https?:\/\//i.test(u);
  const normalizeSlashes = (s = '') => s.replace(/\\/g, '/');
  const stripLeadingSlash = (s = '') => s.replace(/^\/+/, '');
  const toStorageUrl = (input) => {
    if (!input) return null;
    let p = normalizeSlashes(String(input).trim());
    if (isAbsoluteUrl(p)) return p;
    p = stripLeadingSlash(p);
    if (p.startsWith('storage/')) return `${SITE_BASE}${p}`;
    return `${STORAGE_BASE}${p}`;
  };

  const normalizeImage = (item) => {
    if (!item) return require('../../../assets/img1.png');
    if (typeof item === 'string') return { uri: toStorageUrl(item) };
    if (item?.uri) return { uri: toStorageUrl(item.uri) };
    return item;
  };

  const statusMessages = {
    Confirmed: 'Booking Confirmed',
    Ongoing: 'Booking Ongoing',
    Completed: 'Completed',
    Dropped: 'Dropped',
    Open: 'Open',
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    getLocalPaymentStatus();
    fetchQuoteDetail();
  }, [quoteId]);

  const getLocalPaymentStatus = async () => {
    try {
      const val = await AsyncStorage.getItem('isPaymentConfirmed');
      setIsPaymentConfirmed(val === 'true');
    } catch (e) {
      // swallow
    }
  };

  const fetchQuoteDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotation-detail/${quoteId}`);
      const data = res.data;
      if (data.success) {
        setQuote(data.quotation);
        // load images robustly
        const imgs = Array.isArray(data.service_images) && data.service_images.length
          ? data.service_images
          : [data.quotation?.service_thumbnail || ''];
        setImages(imgs.map(normalizeImage));
        // set payment state
        const paymentStatus = data.quotation?.payment_status;
        setIsPaymentConfirmed(paymentStatus === 'advance_done' || paymentStatus === 'Confirmed');
      } else {
        Alert.alert('Info', 'Quote not found');
      }
    } catch (err) {
      console.error('fetchQuoteDetail err', err);
      Alert.alert('Error', 'Unable to fetch quote details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuoteDetail();
  };

  const generateUPI = () => {
    const upiId = '9737965551@okbizaxis';
    const amount = quote?.min_price || 0;
    const name = 'TransRentals';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  };

  const openUPIApp = async () => {
    const url = generateUPI();
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open UPI app. Please try manual payment.');
    }
  };

  const handleConfirmPayments = async () => {
    if (!quote?.id) return Alert.alert('Error', 'Quotation ID missing');
    if (isConfirmingPayment) return;
    setIsConfirmingPayment(true);
    try {
      const res = await api.post('/payments/store', {
        quotation_id: quote.id,
        payment_amount: quote.min_price,
      });
      if (res.data.success) {
        await AsyncStorage.setItem('isPaymentConfirmed', 'true');
        setIsPaymentConfirmed(true);
        Alert.alert('Success', res.data.message || 'Payment noted');
        setModalVisible(false);
        navigation.navigate('CustomerDashboard');
      } else {
        Alert.alert('Error', res.data.message || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Payment request failed');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const renderSliderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setFullImageVisible(true)}>
      <Image source={item} style={styles.sliderImage} resizeMode="contain" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Quote not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="chevron-left" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Quotation Details</Text>
            <Text numberOfLines={2} style={styles.headerSub}>{quote.service_name}</Text>
          </View>
        </View>
        {/* <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusMessages[quote.booking_status] ?? quote.booking_status}</Text>
          </View>
        </View> */}
      </View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Image slider */}
        <View style={styles.sliderWrap}>
          <FlatList
            ref={sliderRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i, idx) => String(idx)}
            renderItem={renderSliderItem}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(idx);
            }}
          />
          <View style={styles.dotWrap}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Info card */}
        <View style={styles.cardElevated}>
          <View style={styles.rowSpace}>
            <View>
              <Text style={styles.priceBig}>₹{quote.price}</Text>
              <Text style={styles.subLabel}>Total price</Text>
            </View>
            <View style={styles.minPriceBox}>
              <Text style={styles.minPrice}>Pay ₹{quote.min_price}</Text>
              <Text style={styles.minLabel}>To confirm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoHeading}>Pickup</Text>
              <Text style={styles.infoText}>{quote.booking.location_name}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoHeading}>Destination</Text>
              <Text style={styles.infoText}>{quote.booking.destination}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoHeading}>Journey</Text>
              <Text style={styles.infoText}>{quote.booking.journey_datetime ? new Date(quote.booking.journey_datetime).toLocaleString() : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.rowSpaceSmall}>
            <View style={styles.vendorRow}>
              <MaterialIcons name="star" size={16} color={COLORS.secondary} />
              <Text style={styles.vendorName}>{quote.vendor?.name ?? 'Vendor'}</Text>
            </View>
            <View style={styles.quickActions}>
  <TouchableOpacity 
    style={[
      styles.smallBtn, 
      isPaymentConfirmed && styles.disabledSmallBtn
    ]} 
    disabled={isPaymentConfirmed} 
    onPress={() => setModalVisible(true)}
  >
    <Text style={[
      styles.smallBtnText,
      isPaymentConfirmed && styles.disabledSmallBtnText
    ]}>
      {isPaymentConfirmed ? 'Paid' : 'Pay'}
    </Text>
  </TouchableOpacity>
</View>
          </View>
        </View>

        {/* Tab Section for Highlights, Inclusions, Exclusions, Terms */}
        <TabSection quote={quote} />

        {/* Services Details Section with ScrollView */}
        <ServicesDetailsSection quote={quote} />

      </Animated.ScrollView>

      {/* Footer payment area */}
      <View style={styles.footerWrap}>
        <View style={styles.footerInner}>
          <View>
            <Text style={styles.footerPrice}>Pay ₹{quote.min_price}</Text>
            <Text style={styles.footerSub} numberOfLines={2}>Secure your booking now</Text>
          </View>

          <TouchableOpacity
            disabled={isPaymentConfirmed}
            onPress={() => setModalVisible(true)}
            style={[styles.primaryBtn, isPaymentConfirmed && styles.disabledBtn]}
          >
            <Text style={styles.primaryBtnText}>{isPaymentConfirmed ? 'Payment Confirmed' : 'Pay & Confirm'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Improved Payment Modal */}
      <PaymentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        quote={quote}
        onConfirmPayment={handleConfirmPayments}
        isConfirmingPayment={isConfirmingPayment}
        onOpenUPI={openUPIApp}
      />

      {/* Full image viewer */}
      <Modal visible={fullImageVisible} animationType="fade" transparent onRequestClose={() => setFullImageVisible(false)}>
        <View style={styles.fullImageBackdrop}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={activeIndex}
            renderItem={({ item }) => <Image source={item} style={styles.fullImage} resizeMode="contain" />}
            keyExtractor={(i, idx) => String(idx)}
          />
          <TouchableOpacity style={styles.fullClose} onPress={() => setFullImageVisible(false)}>
            <Text style={styles.fullCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  center: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    height: 64,
    paddingHorizontal: SPACING.page, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: { 
    ...TYPOGRAPHY.h1,
    fontSize: 20,
  },
  headerSub: { 
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginTop: 2,
    width: "80%",
  },
  iconBtn: { 
    marginRight: 12, 
    padding: 6 
  },
  headerRight: {},
  badge: { 
    backgroundColor: COLORS.primary100, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16 
  },
  badgeText: { 
    color: COLORS.primary, 
    fontSize: 12,
    fontWeight: '600'
  },
  content: { 
    flex: 1 
  },
  sliderWrap: { 
    height: SLIDER_HEIGHT, 
    marginTop: SPACING.section 
  },
  sliderImage: { 
    width: SCREEN_WIDTH, 
    height: SLIDER_HEIGHT, 
    borderRadius: RADIUS.lg 
  },
  dotWrap: { 
    position: 'absolute', 
    bottom: 10, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 8, 
    backgroundColor: '#E3E6EA', 
    margin: 4 
  },
  dotActive: { 
    width: 18, 
    backgroundColor: COLORS.secondary 
  },
  cardElevated: { 
    margin: SPACING.page, 
    backgroundColor: COLORS.card, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.card, 
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 4 
  },
  rowSpace: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  rowSpaceSmall: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: SPACING.section 
  },
  priceBig: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.text 
  },
  subLabel: { 
    ...TYPOGRAPHY.small,
    color: COLORS.muted 
  },
  minPriceBox: { 
    backgroundColor: COLORS.primary100, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: RADIUS.md, 
    alignItems: 'center' 
  },
  minPrice: { 
    color: COLORS.primary, 
    fontWeight: '700' 
  },
  minLabel: { 
    ...TYPOGRAPHY.caption,
    color: COLORS.muted 
  },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.bg, 
    marginVertical: SPACING.section 
  },
  infoGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  infoCol: { 
    flex: 1, 
    marginRight: 8 
  },
  infoHeading: { 
    ...TYPOGRAPHY.small,
    color: COLORS.muted 
  },
  infoText: { 
    ...TYPOGRAPHY.body,
    fontWeight: '600', 
    color: COLORS.text 
  },
  vendorRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  vendorName: { 
    marginLeft: 6, 
    fontWeight: '700',
    color: COLORS.text
  },
  // quickActions: { 
  //   flexDirection: 'row', 
  //   alignItems: 'center' 
  // },
  smallBtn: { 
    backgroundColor: COLORS.primary, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: 25, 
    paddingVertical: 8, 
    marginLeft: 8 
  },
  smallBtnText: { 
    color: COLORS.white, 
    fontWeight: '700',
    fontSize: 12
  },
  ghostBtn: { 
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: COLORS.bg 
  },
  ghostBtnText: { 
    color: COLORS.text 
  },
  // Tab Styles with Icons
  tabSection: {
  margin: SPACING.page,
  marginTop: 8,
},

// Tab Navigation Container
tabContainer: {
  backgroundColor: COLORS.card,
  borderRadius: RADIUS.lg,
  padding: 4,
  marginBottom: SPACING.section,
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
},

tabScrollContent: {
  paddingHorizontal: 4,
  paddingVertical: 2,
},

tab: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: RADIUS.md,
  marginHorizontal: 2,
  minWidth: 110,
  backgroundColor: 'transparent', // Always transparent
},

// Active Tab - REMOVE BACKGROUND COLOR
activeTab: {
  // Remove background color and shadow
  // backgroundColor: COLORS.white, // ❌ REMOVE THIS
  // shadowColor: '#000', // ❌ REMOVE THIS
  // shadowOffset: { width: 0, height: 1 }, // ❌ REMOVE THIS
  // shadowOpacity: 0.08, // ❌ REMOVE THIS
  // shadowRadius: 3, // ❌ REMOVE THIS
  // elevation: 2, // ❌ REMOVE THIS
},

tabText: {
  ...TYPOGRAPHY.body,
  fontWeight: '500',
  color: COLORS.muted,
  marginLeft: 6,
  fontSize: 13,
},

activeTabText: {
  fontWeight: '700',
},

  // Tab Content Card - Separate card for content
  tabContentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Tab Content Styles
  tabContent: {
    padding: 0,
  },
  
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.card,
    paddingBottom: 12,
  },
  
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  tabTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginBottom: 2,
  },
  
  tabSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
  },
  
  contentList: {
    padding: SPACING.card,
    gap: 12,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  
  listText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  emptyTabText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.muted,
    fontStyle: 'italic',
    paddingVertical: 40,
    paddingHorizontal: SPACING.card,
  },
  
  bulletRowSmall: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bulletDotSmall: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginTop: 7,
    marginRight: 12,
  },
  bulletSmallText: { 
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  termBullet: { 
    color: COLORS.error, 
    fontSize: 16, 
    marginRight: 12,
    marginTop: 2,
  },
  termText: { 
    flex: 1, 
    color: COLORS.muted, 
    fontSize: 14,
    lineHeight: 20,
  },
  // Services Details Section Styles
  servicesSection: {
    margin: SPACING.page,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxHeight: 400,
  },
  servicesTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    padding: SPACING.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary100,
    color: COLORS.primary,
  },
  servicesScrollView: {
    flex: 1,
  },
  servicesContent: {
    padding: SPACING.card,
  },
  serviceInfoCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.card,
    marginBottom: SPACING.section,
  },
  serviceInfoTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginBottom: 12,
    color: COLORS.text,
  },
  serviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  infoLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  journeyStep: {
    alignItems: 'center',
    marginRight: 12,
    width: 24,
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  journeyDotFinal: {
    backgroundColor: COLORS.success,
  },
  journeyLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  journeyContent: {
    flex: 1,
  },
  journeyLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    marginBottom: 4,
  },
  journeyValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pricingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
  pricingValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalPriceRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  totalPriceLabel: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    color: COLORS.text,
  },
  totalPriceValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    color: COLORS.primary,
  },
  advanceRow: {
    backgroundColor: COLORS.primary100,
    marginTop: 8,
    padding: 12,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 0,
  },
  advanceLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.primary,
  },
  advanceValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  vendorInfo: {
    marginTop: 8,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginLeft: 8,
    color: COLORS.text,
  },
  vendorDetails: {
    marginLeft: 32,
  },
  vendorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorDetailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
    marginLeft: 8,
  },
  servicesList: {
    marginTop: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  notesList: {
    marginTop: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  footerWrap: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: SPACING.page, 
    paddingHorizontal: 10,
    backgroundColor: 'transparent' 
  },
  footerInner: { 
    backgroundColor: COLORS.card, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.card, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8 
  },
  footerPrice: { 
    ...TYPOGRAPHY.h2,
    fontSize: 16
  },
  footerSub: { 
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    width: "80%",
  },
  primaryBtn: { 
    backgroundColor: COLORS.primary100, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: RADIUS.lg,
    width: "50%",
  },
  disabledBtn: { 
    backgroundColor: '#D1E8DD' 
  },
  primaryBtnText: { 
    color: COLORS.primary, 
    fontWeight: '700',
    fontSize: 12
  },
  // Improved Modal Styles
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(12,26,26,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: SPACING.page,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  amountSection: {
    padding: SPACING.card,
    backgroundColor: COLORS.primary100,
    alignItems: 'center',
  },
  amountLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 4,
  },
  amountNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    textAlign: 'center',
  },
  paymentMethodSection: {
    padding: SPACING.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: SPACING.section,
  },
  paymentMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  paymentMethodBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary100,
  },
  paymentMethodText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.muted,
  },
  paymentMethodTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
   upiSection: {
    padding: SPACING.card,
    alignItems: 'center',
  },
  
  qrMainContainer: {
    alignItems: 'center',
    marginBottom: SPACING.card,
  },
  
  qrContainer: {
    position: 'relative',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.section,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  qrOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    padding: 4,
  },
  
  qrLabel: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.section,
  },
  
  upiDetails: {
    width: '100%',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.card,
    alignItems: 'center',
  },
  
  upiLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  upiIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  
  upiValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    flex: 1,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  copyBtn: {
    padding: 6,
    marginLeft: 8,
  },
  
  upiNote: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    lineHeight: 16,
    textAlign: 'center',
  },
  cardPaymentSection: {
    padding: SPACING.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  cardPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  cardPlaceholderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
    textAlign: 'center',
  },
  cardPlaceholderSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.muted,
    textAlign: 'center',
  },
  modalActions: {
    padding: SPACING.card,
    gap: SPACING.section,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: RADIUS.lg,
  },
  disabledActionBtn: {
    backgroundColor: COLORS.muted,
  },
  primaryActionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary100,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryActionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.card,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityText: {
    ...TYPOGRAPHY.small,
    color: COLORS.success,
    fontWeight: '500',
  },
  fullImageBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.95)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fullImage: { 
    width: SCREEN_WIDTH, 
    height: '90%' 
  },
  fullClose: { 
    position: 'absolute', 
    top: 40, 
    right: 20 
  },
  fullCloseText: { 
    color: COLORS.white, 
    fontSize: 28 
  },
  emptyText: { 
    color: COLORS.error,
    ...TYPOGRAPHY.h2
  },
  contactBtn: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(12, 90, 67, 0.05)',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderRadius: RADIUS.lg,
  },
  contactBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});