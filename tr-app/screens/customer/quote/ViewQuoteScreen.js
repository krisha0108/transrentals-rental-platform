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

          {/* For Packers - show individual charges */}
          {quote.packing_charges !== undefined && (
            <>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Packing Charges</Text>
                <Text style={styles.pricingValue}>₹{quote.packing_charges || 0}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Loading Charges</Text>
                <Text style={styles.pricingValue}>₹{quote.loading_charges || 0}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Transport Charges</Text>
                <Text style={styles.pricingValue}>₹{quote.transport_charges || 0}</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Unloading Charges</Text>
                <Text style={styles.pricingValue}>₹{quote.unloading_charges || 0}</Text>
              </View>
              {quote.unpacking_charges > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Unpacking Charges</Text>
                  <Text style={styles.pricingValue}>₹{quote.unpacking_charges}</Text>
                </View>
              )}
            </>
          )}

          {/* For Self-Drive - show daily rate and km limits */}
          {quote.daily_rate !== undefined && (
            <>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Daily Rate</Text>
                <Text style={styles.pricingValue}>₹{quote.daily_rate}</Text>
              </View>
              {quote.km_limit_per_day > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>KM Limit/Day</Text>
                  <Text style={styles.pricingValue}>{quote.km_limit_per_day} km</Text>
                </View>
              )}
              {quote.extra_km_rate > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Extra KM Rate</Text>
                  <Text style={styles.pricingValue}>₹{quote.extra_km_rate}/km</Text>
                </View>
              )}
              {quote.delivery_charges > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Delivery Charges</Text>
                  <Text style={styles.pricingValue}>₹{quote.delivery_charges}</Text>
                </View>
              )}
              {quote.platform_fee > 0 && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Platform Fee</Text>
                  <Text style={styles.pricingValue}>₹{quote.platform_fee}</Text>
                </View>
              )}
            </>
          )}

          {/* For other services - show base amount */}
          {!quote.packing_charges && !quote.daily_rate && quote.base_amount !== undefined && quote.base_amount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Amount</Text>
              <Text style={styles.pricingValue}>₹{quote.base_amount}</Text>
            </View>
          )}

          {/* Loading charges for trucks */}
          {quote.loading_charges > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Loading Charges</Text>
              <Text style={styles.pricingValue}>₹{quote.loading_charges}</Text>
            </View>
          )}

          {/* Unloading charges for trucks */}
          {quote.unloading_charges > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Unloading Charges</Text>
              <Text style={styles.pricingValue}>₹{quote.unloading_charges}</Text>
            </View>
          )}

          {/* Security Deposit */}
          {quote.security_deposit > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Security Deposit</Text>
              <Text style={styles.pricingValue}>₹{quote.security_deposit}</Text>
            </View>
          )}

          {/* GST */}
          {quote.gst_amount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>GST</Text>
              <Text style={styles.pricingValue}>₹{quote.gst_amount}</Text>
            </View>
          )}

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
  const [quotes, setQuotes] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // payment modal
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewingImages, setViewingImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteDetailsVisible, setQuoteDetailsVisible] = useState(false);
  const [acceptConfirmVisible, setAcceptConfirmVisible] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  const [acceptSuccess, setAcceptSuccess] = useState(null);
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
    // Handle base64 images
    if (p.startsWith('data:')) return p;
    p = stripLeadingSlash(p);
    if (p.startsWith('storage/')) return `${SITE_BASE}${p}`;
    // If path already starts with 'uploads/', use SITE_BASE instead of STORAGE_BASE
    if (p.startsWith('uploads/')) return `${SITE_BASE}${p}`;
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
        setQuotes(data.quotes || []);
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
      console.log('fetchQuoteDetail err', err);
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

  // Handle accept quote button click
  const handleAcceptQuote = (vendorQuote) => {
    setSelectedQuote(vendorQuote);
    setAcceptError(null);
    setAcceptSuccess(null);
    setQuoteDetailsVisible(false);
    setTimeout(() => {
      setAcceptConfirmVisible(true);
    }, 300);
  };

  // Confirm and process quote acceptance
  const confirmAcceptQuote = async () => {
    if (!selectedQuote) return;

    setAcceptingQuote(true);
    setAcceptError(null);

    try {
      const response = await api.post('/customer/accept-quote', {
        serviceType: quote?.type || 'general',
        quoteRequestId: quoteId,
        quoteId: selectedQuote.id,
      });

      if (response.data?.success) {
        if (!response.data.bookingId) {
          throw new Error('Booking was created but ID is missing. Please check your bookings.');
        }
        setAcceptSuccess({
          bookingId: response.data.bookingId,
          bookingNumber: response.data.bookingNumber || 'N/A',
        });
      } else {
        throw new Error(response.data?.message || 'Failed to accept quote');
      }
    } catch (err) {
      console.log('Accept quote error:', err);
      let errorMessage = 'Failed to accept quote. Please try again.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status) {
        errorMessage = `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setAcceptError(errorMessage);
    } finally {
      setAcceptingQuote(false);
    }
  };

  // Close accept confirmation modal and navigate if success
  const handleAcceptModalClose = () => {
    const successData = acceptSuccess;

    // Reset states
    setAcceptConfirmVisible(false);
    setSelectedQuote(null);
    setAcceptError(null);
    setAcceptSuccess(null);

    // Navigate to payment if successful
    if (successData && successData.bookingId) {
      navigation.replace('PaymentScreen', {
        bookingId: successData.bookingId,
        bookingNumber: successData.bookingNumber,
        serviceType: quote?.type || 'general',
        amount: selectedQuote?.totalAmount || 0,
        advanceAmount: selectedQuote?.advanceAmount || Math.round((selectedQuote?.totalAmount || 0) * 0.3),
      });
    }
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
      console.log(err);
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

  // Check if no quotes available
  if (!quotes || quotes.length === 0) {
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
              <Text numberOfLines={2} style={styles.headerSub}>{quote.type || 'Request'}</Text>
            </View>
          </View>
        </View>

        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="inbox" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>No Quotations Yet</Text>
            <Text style={styles.emptyStateMessage}>
              Your request has been sent to vendors. They will review your requirements and send you competitive quotes soon.
            </Text>
            <View style={styles.emptyInfoBox}>
              <Icon name="clock" size={20} color="#666" />
              <Text style={styles.emptyInfoText}>Usually within 24-48 hours</Text>
            </View>
            <Text style={styles.emptyPullRefresh}>Pull down to refresh</Text>
          </View>
        </Animated.ScrollView>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Vendor Quotations</Text>
            <Text numberOfLines={1} style={styles.headerSub}>
              {quotes.length} quote{quotes.length > 1 ? 's' : ''} received
            </Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Request Info Card */}
        <View style={styles.requestInfoCard}>
          <View style={styles.requestInfoRow}>
            <Icon name="map-pin" size={18} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.requestInfoLabel}>Pickup</Text>
              <Text style={styles.requestInfoValue}>{quote.booking?.location_name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.requestInfoDivider} />
          <View style={styles.requestInfoRow}>
            <Icon name="navigation" size={18} color={COLORS.secondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.requestInfoLabel}>Destination</Text>
              <Text style={styles.requestInfoValue}>{quote.booking?.destination || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.requestInfoDivider} />
          <View style={styles.requestInfoRow}>
            <Icon name="calendar" size={18} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.requestInfoLabel}>Journey Date</Text>
              <Text style={styles.requestInfoValue}>
                {quote.booking?.journey_datetime
                  ? new Date(quote.booking.journey_datetime).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quotes Section Header */}
        <View style={styles.quotesHeader}>
          <Text style={styles.quotesHeaderTitle}>Available Quotes</Text>
          <Text style={styles.quotesHeaderSub}>Compare and choose the best deal</Text>
        </View>

        {/* Vendor Quotes List */}
        {quotes.map((vendorQuote, index) => (
          <View key={vendorQuote.id || index} style={styles.vendorQuoteCard}>
            {/* Best Price Badge */}
            {index === 0 && (
              <View style={styles.bestPriceBadge}>
                <Icon name="award" size={14} color="#fff" />
                <Text style={styles.bestPriceText}>Best Price</Text>
              </View>
            )}

            {/* Vendor Header */}
            <View style={styles.vendorHeader}>
              <View style={styles.vendorIconCircle}>
                <Icon name="user" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.vendorNameText}>{vendorQuote.vendorName || 'Vendor'}</Text>
                {vendorQuote.vendorRating > 0 && (
                  <View style={styles.vendorRatingRow}>
                    <Icon name="star" size={14} color="#F59E0B" />
                    <Text style={styles.vendorRatingText}>{vendorQuote.vendorRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Pricing */}
            <View style={styles.quotePricingCard}>
              <View style={styles.pricingRow}>
                <View>
                  <Text style={styles.totalPriceLabel}>Total Amount</Text>
                  <Text style={styles.totalPriceValue}>₹{vendorQuote.totalAmount || 0}</Text>
                </View>
                <View style={styles.advanceBox}>
                  <Text style={styles.advanceLabel}>Pay Now</Text>
                  <Text style={styles.advanceValue}>₹{vendorQuote.advanceAmount || Math.round((vendorQuote.totalAmount || 0) * 0.25)}</Text>
                </View>
              </View>
            </View>

            {/* Vehicle Images */}
            {vendorQuote.vehicleImages && (() => {
              try {
                const imgs = typeof vendorQuote.vehicleImages === 'string'
                  ? JSON.parse(vendorQuote.vehicleImages)
                  : vendorQuote.vehicleImages;

                if (Array.isArray(imgs) && imgs.length > 0) {
                  return (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.quoteImagesContainer}
                    >
                      {imgs.map((img, idx) => {
                        // Construct proper image URL
                        let imageUrl = img;
                        if (img && !img.startsWith('http') && !img.startsWith('data:')) {
                          const cleanPath = img.replace(/\\/g, '/').replace(/^\/+/, '');
                          imageUrl = cleanPath.startsWith('uploads/')
                            ? `${BASE_URL}/${cleanPath}`
                            : `${IMAGE_BASE_URL}/${cleanPath}`;
                        }

                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.7}
                            onPress={() => {
                              const allImageUrls = imgs.map(i => {
                                if (i && !i.startsWith('http') && !i.startsWith('data:')) {
                                  const cp = i.replace(/\\/g, '/').replace(/^\/+/, '');
                                  return cp.startsWith('uploads/') ? `${BASE_URL}/${cp}` : `${IMAGE_BASE_URL}/${cp}`;
                                }
                                return i;
                              });
                              setViewingImages(allImageUrls);
                              setSelectedImageIndex(idx);
                              setFullImageVisible(true);
                            }}
                          >
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.quoteVehicleImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  );
                }
              } catch (e) {
                console.log('Error parsing vehicle images in quote card:', e);
              }
              return null;
            })()}

            {/* Vehicle/Service Info */}
            {vendorQuote.vehicleName && (
              <View style={styles.vehicleInfoRow}>
                <Icon name="truck" size={16} color={COLORS.muted} />
                <Text style={styles.vehicleInfoText}>{vendorQuote.vehicleName}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.quoteActions}>
              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() => {
                  setSelectedQuote(vendorQuote);
                  setQuoteDetailsVisible(true);
                }}
              >
                <Icon name="eye" size={16} color={COLORS.primary} />
                <Text style={styles.viewDetailsBtnText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptQuoteBtn}
                onPress={() => handleAcceptQuote(vendorQuote)}
              >
                <Text style={styles.acceptQuoteBtnText}>Accept Quote</Text>
                <Icon name="check-circle" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </Animated.ScrollView>

      {/* Quote Details Modal */}
      <Modal
        visible={quoteDetailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQuoteDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quoteDetailsModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quote Details</Text>
              <TouchableOpacity onPress={() => setQuoteDetailsVisible(false)}>
                <Icon name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedQuote && (
                <>
                  {/* Vendor Info */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Vendor Information</Text>
                    <Text style={styles.modalVendorName}>{selectedQuote.vendorName || 'Vendor'}</Text>
                    {selectedQuote.vendorRating > 0 && (
                      <View style={styles.modalRatingRow}>
                        <Icon name="star" size={16} color="#F59E0B" />
                        <Text style={styles.modalRatingText}>{selectedQuote.vendorRating.toFixed(1)} Rating</Text>
                      </View>
                    )}
                  </View>

                  {/* Pricing Breakdown */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Pricing Breakdown</Text>

                    {/* Packers - show individual charges */}
                    {selectedQuote.packingCharges !== undefined && (
                      <>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Packing Charges</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.packingCharges || 0}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Loading Charges</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.loadingCharges || 0}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Transport Charges</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.transportCharges || 0}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Unloading Charges</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.unloadingCharges || 0}</Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Unpacking Charges</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.unpackingCharges || 0}</Text>
                        </View>
                      </>
                    )}

                    {/* Self-drive - show daily rate and other charges */}
                    {selectedQuote.dailyRate !== undefined && (
                      <>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Daily Rate</Text>
                          <Text style={styles.priceValue}>₹{selectedQuote.dailyRate || 0}</Text>
                        </View>
                        {selectedQuote.baseAmount > 0 && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Amount</Text>
                            <Text style={styles.priceValue}>₹{selectedQuote.baseAmount}</Text>
                          </View>
                        )}
                        {selectedQuote.kmLimitPerDay > 0 && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>KM Limit/Day</Text>
                            <Text style={styles.priceValue}>{selectedQuote.kmLimitPerDay} km</Text>
                          </View>
                        )}
                        {selectedQuote.extraKmRate > 0 && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Extra KM Rate</Text>
                            <Text style={styles.priceValue}>₹{selectedQuote.extraKmRate}/km</Text>
                          </View>
                        )}
                        {selectedQuote.deliveryCharge > 0 && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Delivery Charges</Text>
                            <Text style={styles.priceValue}>₹{selectedQuote.deliveryCharge}</Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Bike/Bus/Truck/Luxury - show base amount if available */}
                    {!selectedQuote.packingCharges && !selectedQuote.dailyRate && selectedQuote.baseAmount !== undefined && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Amount</Text>
                        <Text style={styles.priceValue}>₹{selectedQuote.baseAmount || 0}</Text>
                      </View>
                    )}

                    {/* Loading charges for trucks */}
                    {selectedQuote.loadingCharges > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Loading Charges</Text>
                        <Text style={styles.priceValue}>₹{selectedQuote.loadingCharges}</Text>
                      </View>
                    )}

                    {/* Unloading charges for trucks */}
                    {selectedQuote.unloadingCharges > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Unloading Charges</Text>
                        <Text style={styles.priceValue}>₹{selectedQuote.unloadingCharges}</Text>
                      </View>
                    )}

                    {/* Security Deposit */}
                    {selectedQuote.securityDeposit > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Security Deposit</Text>
                        <Text style={styles.priceValue}>₹{selectedQuote.securityDeposit}</Text>
                      </View>
                    )}

                    {/* GST */}
                    {selectedQuote.gstAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>GST</Text>
                        <Text style={styles.priceValue}>₹{selectedQuote.gstAmount}</Text>
                      </View>
                    )}

                    {/* Total */}
                    <View style={[styles.priceRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>₹{selectedQuote.totalAmount || selectedQuote.grandTotal || 0}</Text>
                    </View>

                    {/* Advance */}
                    <View style={styles.advanceRow}>
                      <Text style={styles.advanceText}>Advance to Pay: </Text>
                      <Text style={styles.advanceAmount}>₹{selectedQuote.advanceAmount || Math.round((selectedQuote.totalAmount || selectedQuote.grandTotal || 0) * 0.25)}</Text>
                    </View>
                  </View>

                  {/* Vehicle/Service Details */}
                  {selectedQuote.vehicleName && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Service Details</Text>
                      <Text style={styles.modalDetailText}>{selectedQuote.vehicleName}</Text>
                    </View>
                  )}

                  {/* Vehicle Images */}
                  {selectedQuote.vehicleImages && (() => {
                    try {
                      const imgs = typeof selectedQuote.vehicleImages === 'string'
                        ? JSON.parse(selectedQuote.vehicleImages)
                        : selectedQuote.vehicleImages;

                      if (Array.isArray(imgs) && imgs.length > 0) {
                        return (
                          <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Vehicle Images</Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={styles.modalImagesContainer}
                            >
                              {imgs.map((img, idx) => {
                                // Construct proper image URL
                                let imageUrl = img;
                                if (img && !img.startsWith('http') && !img.startsWith('data:')) {
                                  const cleanPath = img.replace(/\\/g, '/').replace(/^\/+/, '');
                                  imageUrl = cleanPath.startsWith('uploads/')
                                    ? `${BASE_URL}/${cleanPath}`
                                    : `${IMAGE_BASE_URL}/${cleanPath}`;
                                }

                                return (
                                  <TouchableOpacity
                                    key={idx}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                      const allImageUrls = imgs.map(i => {
                                        if (i && !i.startsWith('http') && !i.startsWith('data:')) {
                                          const cp = i.replace(/\\/g, '/').replace(/^\/+/, '');
                                          return cp.startsWith('uploads/') ? `${BASE_URL}/${cp}` : `${IMAGE_BASE_URL}/${cp}`;
                                        }
                                        return i;
                                      });
                                      setViewingImages(allImageUrls);
                                      setSelectedImageIndex(idx);
                                      setFullImageVisible(true);
                                    }}
                                  >
                                    <Image
                                      source={{ uri: imageUrl }}
                                      style={styles.modalVehicleImage}
                                      resizeMode="cover"
                                    />
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        );
                      }
                    } catch (e) {
                      console.log('Error parsing vehicle images in modal:', e);
                    }
                    return null;
                  })()}

                  {/* Inclusions */}
                  {selectedQuote.inclusions && selectedQuote.inclusions.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Inclusions</Text>
                      {selectedQuote.inclusions.map((item, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Icon name="check" size={14} color={COLORS.success} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Exclusions */}
                  {selectedQuote.exclusions && selectedQuote.exclusions.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Exclusions</Text>
                      {selectedQuote.exclusions.map((item, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Icon name="x" size={14} color={COLORS.error} />
                          <Text style={styles.bulletText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Terms */}
                  {selectedQuote.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Terms & Conditions</Text>
                      <Text style={styles.modalDetailText}>{selectedQuote.notes}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalAcceptBtn}
                onPress={() => handleAcceptQuote(selectedQuote)}
              >
                <Text style={styles.modalAcceptBtnText}>Accept This Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity
              style={styles.imageViewerCloseBtn}
              onPress={() => setFullImageVisible(false)}
            >
              <Icon name="x" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.imageViewerCounter}>
              <Text style={styles.imageViewerCounterText}>
                {selectedImageIndex + 1} / {viewingImages.length}
              </Text>
            </View>
          </View>

          {/* Image */}
          <View style={styles.imageViewerContent}>
            <Image
              source={{ uri: viewingImages[selectedImageIndex] }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
          </View>

          {/* Navigation Arrows */}
          {viewingImages.length > 1 && (
            <>
              {selectedImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.imageViewerArrow, styles.imageViewerArrowLeft]}
                  onPress={() => setSelectedImageIndex(selectedImageIndex - 1)}
                >
                  <Icon name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
              )}
              {selectedImageIndex < viewingImages.length - 1 && (
                <TouchableOpacity
                  style={[styles.imageViewerArrow, styles.imageViewerArrowRight]}
                  onPress={() => setSelectedImageIndex(selectedImageIndex + 1)}
                >
                  <Icon name="chevron-right" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* Accept Quote Confirmation Modal */}
      <Modal
        visible={acceptConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleAcceptModalClose}
      >
        <View style={styles.acceptModalOverlay}>
          <View style={styles.acceptModalContainer}>
            {/* Success State */}
            {acceptSuccess ? (
              <View style={styles.acceptModalContent}>
                <View style={styles.successIconContainer}>
                  <Icon name="check-circle" size={70} color={COLORS.success} />
                </View>
                <Text style={styles.acceptModalTitle}>Booking Confirmed!</Text>
                <Text style={styles.successBookingNumber}>#{acceptSuccess.bookingNumber}</Text>
                <Text style={styles.acceptModalMessage}>
                  Your booking has been created successfully. Please proceed to payment to confirm your booking.
                </Text>
                <TouchableOpacity
                  style={styles.successBtn}
                  onPress={handleAcceptModalClose}
                >
                  <Icon name="credit-card" size={20} color="#fff" />
                  <Text style={styles.successBtnText}>Proceed to Payment</Text>
                  <Icon name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.acceptModalContent}>
                {/* Header */}
                <View style={styles.acceptModalHeader}>
                  <Text style={styles.acceptModalTitle}>
                    {acceptError ? 'Oops!' : 'Confirm Booking'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleAcceptModalClose}
                    style={styles.acceptModalCloseBtn}
                    disabled={acceptingQuote}
                  >
                    <Icon name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Error Display */}
                {acceptError && (
                  <View style={styles.errorContainer}>
                    <View style={styles.errorIconWrap}>
                      <Icon name="alert-circle" size={50} color={COLORS.error} />
                    </View>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMessage}>{acceptError}</Text>
                    <View style={styles.errorActions}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={confirmAcceptQuote}
                        disabled={acceptingQuote}
                      >
                        {acceptingQuote ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="refresh-cw" size={18} color="#fff" />
                            <Text style={styles.retryBtnText}>Try Again</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkBookingsBtn}
                        onPress={() => {
                          setAcceptConfirmVisible(false);
                          navigation.navigate('MyBookings');
                        }}
                      >
                        <Icon name="list" size={18} color={COLORS.primary} />
                        <Text style={styles.checkBookingsBtnText}>Check My Bookings</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Quote Details - Only show if no error */}
                {!acceptError && selectedQuote && (
                  <View style={styles.confirmQuoteDetails}>
                    <Text style={styles.confirmVendorName}>{selectedQuote.vendorName || 'Vendor'}</Text>
                    {selectedQuote.vehicleName && (
                      <Text style={styles.confirmVehicleName}>{selectedQuote.vehicleName}</Text>
                    )}

                    <View style={styles.confirmPricingCard}>
                      <View style={styles.confirmPriceRow}>
                        <Text style={styles.confirmPriceLabel}>Total Amount</Text>
                        <Text style={styles.confirmPriceValue}>₹{selectedQuote.totalAmount || 0}</Text>
                      </View>
                      {selectedQuote.advanceAmount && (
                        <View style={styles.confirmAdvanceRow}>
                          <Text style={styles.confirmAdvanceLabel}>Advance Payment</Text>
                          <Text style={styles.confirmAdvanceValue}>₹{selectedQuote.advanceAmount}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.confirmNote}>
                      By accepting, you agree to pay the advance amount to confirm your booking.
                    </Text>

                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        style={styles.cancelModalBtn}
                        onPress={handleAcceptModalClose}
                        disabled={acceptingQuote}
                      >
                        <Text style={styles.cancelModalBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmBtn, acceptingQuote && styles.confirmBtnDisabled]}
                        onPress={confirmAcceptQuote}
                        disabled={acceptingQuote}
                      >
                        {acceptingQuote ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="check" size={18} color="#fff" />
                            <Text style={styles.confirmBtnText}>Confirm & Book</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
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
  emptyStateContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  emptyInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 10,
  },
  emptyInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyPullRefresh: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 20,
    fontStyle: 'italic',
  },
  requestInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.card,
    marginHorizontal: SPACING.page,
    marginTop: SPACING.page,
    marginBottom: SPACING.section,
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  requestInfoLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
  },
  requestInfoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  requestInfoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  quotesHeader: {
    paddingHorizontal: SPACING.page,
    marginBottom: SPACING.section,
  },
  quotesHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  quotesHeaderSub: {
    fontSize: 13,
    color: COLORS.muted,
  },
  vendorQuoteCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.card,
    marginHorizontal: SPACING.page,
    marginBottom: SPACING.section,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bestPriceBadge: {
    position: 'absolute',
    top: SPACING.card,
    right: SPACING.card,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  bestPriceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.section,
  },
  vendorIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  vendorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorRatingText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
  },
  quotePricingCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.section,
    marginBottom: SPACING.section,
  },
  quoteImagesContainer: {
    marginBottom: SPACING.section,
  },
  quoteVehicleImage: {
    width: 100,
    height: 75,
    borderRadius: RADIUS.md,
    marginRight: 10,
    backgroundColor: COLORS.background,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPriceLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 4,
  },
  totalPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  advanceBox: {
    backgroundColor: COLORS.primary100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  advanceLabel: {
    fontSize: 11,
    color: COLORS.primary,
    marginBottom: 2,
    fontWeight: '500',
  },
  advanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.section,
  },
  vehicleInfoText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  viewQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  viewQuoteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  acceptQuoteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  acceptQuoteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quoteDetailsModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalImagesContainer: {
    marginTop: 8,
  },
  modalVehicleImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.background,
  },
  modalVendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalRatingText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.muted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.primary100,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },
  advanceText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  advanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalDetailText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalAcceptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  modalAcceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  imageViewerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCounter: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageViewerCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerArrowLeft: {
    left: 20,
  },
  imageViewerArrowRight: {
    right: 20,
  },
  // Accept Modal Styles
  acceptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptModalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  acceptModalContent: {
    padding: 24,
  },
  acceptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  acceptModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  acceptModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptModalMessage: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successBookingNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  successBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  successBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorIconWrap: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  retryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  checkBookingsBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkBookingsBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  confirmQuoteDetails: {
    gap: 16,
  },
  confirmVendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmVehicleName: {
    fontSize: 16,
    color: COLORS.muted,
  },
  confirmPricingCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  confirmPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmPriceLabel: {
    fontSize: 15,
    color: COLORS.muted,
  },
  confirmPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  confirmAdvanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmAdvanceLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  confirmAdvanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  confirmNote: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});