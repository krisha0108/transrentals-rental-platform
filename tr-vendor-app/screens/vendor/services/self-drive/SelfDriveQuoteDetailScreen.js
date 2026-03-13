import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getVendorQuotes, getBaseURL, getQuoteRequestById } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 32; // Full width with padding

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g500: '#059669', g400: '#34D399',
  g50: '#ECFDF5', g100: '#D1FAE5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  green: '#059669', greenL: '#ECFDF5',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  blue: '#2563EB', blueL: '#EFF6FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
};

const STATUS_CFG = {
  PENDING:   { label: 'Pending',   bg: C.amberL,   text: C.amber,   icon: 'hourglass'        },
  SENT:      { label: 'Sent',      bg: C.blueL,    text: C.blue,    icon: 'send'             },
  ACCEPTED:  { label: 'Accepted',  bg: C.greenL,   text: C.green,   icon: 'checkmark-circle' },
  REJECTED:  { label: 'Rejected',  bg: C.redL,     text: C.red,     icon: 'close-circle'     },
  EXPIRED:   { label: 'Expired',   bg: '#F1F5F9',  text: '#6B7280', icon: 'time'             },
  WITHDRAWN: { label: 'Withdrawn', bg: '#F1F5F9',  text: '#9CA3AF', icon: 'close'            },
};

export default function SelfDriveQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [baseUrl, setBaseUrl] = useState('');
  const imageSliderRef = useRef(null);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    getBaseURL().then(url => {
      console.log('🌐 [SelfDrive Image Debug] Base URL:', url);
      setBaseUrl(url);
    });
  }, []);

  const fetchQuoteDetail = useCallback(async () => {
    if (!quoteId) {
      showError('Quote ID is missing');
      navigation.goBack();
      return;
    }

    try {
      const response = await getVendorQuotes('self-drive', {});
      const quotes = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);

      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('self-drive', rid);
              setBookingId(reqData.bookingId || null);
            } catch (_) {}
          }
        }
      } else {
        showError('Quote not found');
      }
    } catch (error) {
      console.error('Error fetching quote detail:', error);
      showError('Failed to load quote details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quoteId, navigation]);

  useEffect(() => {
    fetchQuoteDetail();
  }, [fetchQuoteDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuoteDetail();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'checkmark-circle';
      case 'REJECTED':
        return 'close-circle';
      case 'EXPIRED':
        return 'time';
      case 'PENDING':
      case 'SENT':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <View style={{ width: 40 }} />
            <View style={styles.headerCenter}>
              <Ionicons name="document-text-outline" size={18} color={C.g400} />
              <Text style={styles.headerTitle}>Quote Details</Text>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.g500} />
          <Text style={styles.loaderText}>Loading quote details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Ionicons name="document-text-outline" size={18} color={C.g400} />
              <Text style={styles.headerTitle}>Quote Details</Text>
              <Text style={styles.headerSubtitle}>Self Drive</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="document-text-outline" size={48} color={C.g400} />
          </View>
          <Text style={styles.emptyTitle}>Quote Not Found</Text>
          <Text style={styles.emptySubtitle}>This quote may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = quote.status || 'PENDING';
  const sc = STATUS_CFG[status] || STATUS_CFG.PENDING;

  const request = quote.request || {};
  const customerName = request.customerName || quote.customerName || 'Customer';
  const customerEmail = request.customerEmail || quote.customerEmail;
  const customerPhone = request.customerPhone || quote.customerPhone;
  const pickupCity = request.locationName || request.pickupCity || quote.pickupCity || 'N/A';
  const dropCity = request.dropCity || quote.dropCity;
  const pickupDate = request.pickupDate || quote.pickupDate || request.startDate;
  const returnDate = request.returnDate || quote.returnDate || request.endDate || request.dropDate;
  const vehicleName = quote.vehicleName || quote.carType || request.carType;
  const vehicleBrand = quote.vehicleBrand || quote.carBrand;

  const baseAmount = quote.baseAmount || quote.basePrice || 0;
  const securityDeposit = quote.securityDeposit || quote.deposit || 0;
  const taxes = quote.taxes || quote.tax || quote.gst || 0;
  const totalAmount = quote.grandTotal || quote.totalAmount || quote.quotedAmount || baseAmount;

  const validTill = quote.validTill || quote.validUntil;
  const quoteNumber = quote.quoteNumber || (quote.id || quote._id)?.toString().slice(-8);
  const requestNumber = request.requestNumber;
  const notes = quote.notes || quote.description || quote.additionalInfo;

  // Helper to get full image URL
  const getFullImageUrl = (path) => {
    console.log('🖼️ [SelfDrive Image Debug] Processing path:', path);
    if (!path) return null;
    if (path.startsWith('http')) {
      console.log('✅ [SelfDrive Image Debug] Path is already full URL:', path);
      return path;
    }
    const fullUrl = `${baseUrl}${path}`;
    console.log('🔗 [SelfDrive Image Debug] Constructed URL:', fullUrl);
    return fullUrl;
  };

  // Parse JSON fields
  const parseJSON = (field) => {
    if (!field) return null;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
        // Handle object format (like {front: "...", back: "..."})
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.values(parsed).filter(Boolean);
        }
        return null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Parse and convert image URLs
  console.log('🖼️ [SelfDrive Image Debug] Raw vehicleImages from quote:', quote.vehicleImages);
  console.log('🖼️ [SelfDrive Image Debug] Type:', typeof quote.vehicleImages);
  const rawImages = parseJSON(quote.vehicleImages);
  console.log('🖼️ [SelfDrive Image Debug] Parsed images array:', rawImages);
  const vehicleImages = rawImages?.map(img => getFullImageUrl(img)).filter(Boolean) || null;
  console.log('🖼️ [SelfDrive Image Debug] Final vehicleImages with full URLs:', vehicleImages);

  const vehicleFeatures = parseJSON(quote.vehicleFeatures);
  const inclusions = parseJSON(quote.inclusions);
  const exclusions = parseJSON(quote.exclusions);
  const termsConditions = parseJSON(quote.termsConditions);
  const registrationNumber = quote.registrationNumber || quote.vehicleNumber;
  const vehicleYear = quote.vehicleYear;

  // Debug logging
  console.log('Quote Data:', {
    id: quote.id,
    rawVehicleImages: quote.vehicleImages,
    rawImages: rawImages,
    finalImages: vehicleImages,
    imagesLength: vehicleImages?.length,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.gradientHeader}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="document-text-outline" size={18} color={C.g400} />
            <Text style={styles.headerTitle}>Quote Details</Text>
            <Text style={styles.headerSubtitle}>Self Drive</Text>
          </View>
          {/* Status badge in header */}
          <View style={[styles.headerStatusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.headerStatusText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g500]} tintColor={C.g500} />
        }
      >
        {/* Hero Amount Banner */}
        <LinearGradient colors={[C.g900, C.g700]} style={styles.heroBanner}>
          <View style={styles.heroBannerInner}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroQuoteLabel}>Quote #{quoteNumber}</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalAmount)}</Text>
              <View style={[styles.heroStatusBadge, { backgroundColor: sc.bg }]}>
                <Ionicons name={sc.icon} size={13} color={sc.text} />
                <Text style={[styles.heroStatusText, { color: sc.text }]}>{sc.label}</Text>
              </View>
            </View>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="car-outline" size={40} color={C.g400} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* Vehicle Images Slider */}
          {vehicleImages && vehicleImages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="images-outline" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Vehicle Images</Text>
              </View>
              <View style={styles.imageSliderContainer}>
                <FlatList
                  ref={imageSliderRef}
                  data={vehicleImages}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);
                    setCurrentImageIndex(index);
                  }}
                  renderItem={({ item }) => (
                    <View style={styles.imageSlide}>
                      <Image
                        source={{ uri: item }}
                        style={styles.sliderImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                />
                {/* Pagination Dots */}
                {vehicleImages.length > 1 && (
                  <View style={styles.paginationDots}>
                    {vehicleImages.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index === currentImageIndex ? styles.activeDot : styles.inactiveDot,
                        ]}
                      />
                    ))}
                  </View>
                )}
                {/* Image Counter */}
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {vehicleImages.length}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Request Reference */}
          {requestNumber && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="document-text-outline" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Request Reference</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.refRow}>
                  <View style={styles.refDot} />
                  <Text style={styles.cardText}>Request #{requestNumber}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="person-circle-outline" size={18} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="person" size={16} color={C.g700} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName}</Text>
                </View>
              </View>
              {customerEmail && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="mail" size={16} color={C.g700} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{customerEmail}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Vehicle Information */}
          {vehicleName && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <MaterialCommunityIcons name="car" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Vehicle Details</Text>
              </View>
              <View style={styles.card}>
                {/* Vehicle name hero row */}
                <LinearGradient colors={[C.g50, C.g100]} style={styles.vehicleHeroGradient}>
                  <View style={styles.vehicleIconCircle}>
                    <MaterialCommunityIcons name="car" size={28} color={C.g700} />
                  </View>
                  <View style={styles.vehicleTextWrap}>
                    <Text style={styles.vehicleName}>{vehicleName}</Text>
                    {vehicleBrand && (
                      <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                    )}
                  </View>
                </LinearGradient>

                {registrationNumber && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="car" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Registration Number</Text>
                      <Text style={styles.infoValue}>{registrationNumber}</Text>
                    </View>
                  </View>
                )}
                {vehicleYear && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="calendar" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Model Year</Text>
                      <Text style={styles.infoValue}>{vehicleYear}</Text>
                    </View>
                  </View>
                )}
                {vehicleFeatures && vehicleFeatures.length > 0 && (
                  <View style={styles.featuresWrap}>
                    <Text style={styles.featuresTitle}>Features</Text>
                    {vehicleFeatures.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={15} color={C.green} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="calendar-outline" size={18} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Booking Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="location" size={16} color={C.green} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupCity}</Text>
                </View>
              </View>
              {dropCity && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={[styles.infoIconBox, { backgroundColor: C.redL }]}>
                    <Ionicons name="location" size={16} color={C.red} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Drop Location</Text>
                    <Text style={styles.infoValue}>{dropCity}</Text>
                  </View>
                </View>
              )}
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="calendar" size={16} color={C.g700} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Date</Text>
                  <Text style={styles.infoValue}>{formatDate(pickupDate)}</Text>
                </View>
              </View>
              {returnDate && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="calendar" size={16} color={C.g700} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Return Date</Text>
                    <Text style={styles.infoValue}>{formatDate(returnDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Car Specifications */}
          {(quote.transmission || quote.fuelType || quote.seats || quote.kmLimitPerDay) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <MaterialCommunityIcons name="car-info" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Car Specifications</Text>
              </View>
              <View style={styles.card}>
                {quote.transmission && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="settings-outline" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Transmission</Text>
                      <Text style={styles.infoValue}>{quote.transmission}</Text>
                    </View>
                  </View>
                )}
                {quote.fuelType && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="water-outline" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Fuel Type</Text>
                      <Text style={styles.infoValue}>{quote.fuelType}</Text>
                    </View>
                  </View>
                )}
                {quote.seats && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="people-outline" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Seating Capacity</Text>
                      <Text style={styles.infoValue}>{quote.seats} seats</Text>
                    </View>
                  </View>
                )}
                {quote.kmLimitPerDay && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="speedometer" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>KM Limit Per Day</Text>
                      <Text style={styles.infoValue}>{quote.kmLimitPerDay} km</Text>
                    </View>
                  </View>
                )}
                {quote.extraKmRate > 0 && (
                  <View style={[styles.infoRow, styles.infoRowBorder]}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="cash-outline" size={16} color={C.g700} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Extra KM Rate</Text>
                      <Text style={styles.infoValue}>{formatCurrency(quote.extraKmRate)}/km</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Pricing Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="receipt-outline" size={18} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
            </View>
            <View style={styles.card}>
              {baseAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Amount</Text>
                  <Text style={styles.priceValue}>{formatCurrency(baseAmount)}</Text>
                </View>
              )}
              {quote.deliveryCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.deliveryCharges)}</Text>
                </View>
              )}
              {quote.pickupCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Pickup Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.pickupCharges)}</Text>
                </View>
              )}
              {securityDeposit > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Security Deposit</Text>
                  <Text style={styles.priceValue}>{formatCurrency(securityDeposit)}</Text>
                </View>
              )}
              {quote.gstAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>GST</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.gstAmount)}</Text>
                </View>
              )}
              {taxes > 0 && !quote.gstAmount && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Taxes & GST</Text>
                  <Text style={styles.priceValue}>{formatCurrency(taxes)}</Text>
                </View>
              )}
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceLabelTotal}>Grand Total</Text>
                <Text style={styles.priceValueTotal}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Quote Validity */}
          {validTill && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="time-outline" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Quote Validity</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons name="hourglass-outline" size={16} color={C.g700} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Valid Until</Text>
                    <Text style={styles.infoValue}>{formatDate(validTill)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Additional Notes */}
          {notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="chatbox-outline" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}

          {/* Inclusions */}
          {inclusions && inclusions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: C.greenL }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={C.green} />
                </View>
                <Text style={styles.sectionTitle}>Inclusions</Text>
              </View>
              <View style={styles.card}>
                {inclusions.map((item, idx) => (
                  <View key={idx} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                    <Ionicons name="checkmark-circle" size={17} color={C.green} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Exclusions */}
          {exclusions && exclusions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: C.redL }]}>
                  <Ionicons name="close-circle-outline" size={18} color={C.red} />
                </View>
                <Text style={styles.sectionTitle}>Exclusions</Text>
              </View>
              <View style={styles.card}>
                {exclusions.map((item, idx) => (
                  <View key={idx} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                    <Ionicons name="close-circle" size={17} color={C.red} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Terms & Conditions */}
          {termsConditions && termsConditions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="document-text-outline" size={18} color={C.g700} />
                </View>
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              </View>
              <View style={styles.card}>
                {termsConditions.map((item, idx) => (
                  <View key={idx} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                    <View style={styles.termNumberBox}>
                      <Text style={styles.listNumber}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quote Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="time-outline" size={18} color={C.g700} />
              </View>
              <Text style={styles.sectionTitle}>Quote Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: C.g100 }]}>
                  <Ionicons name="paper-plane" size={14} color={C.g700} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Sent on</Text>
                  <Text style={styles.timelineValue}>{formatDate(quote.createdAt || quote.created_at)}</Text>
                </View>
              </View>
              {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                <View style={[styles.timelineRow, styles.timelineRowBorder]}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="refresh" size={14} color={C.muted} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Updated on</Text>
                    <Text style={styles.timelineValue}>{formatDate(quote.updatedAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {status !== 'ACCEPTED' ? (
          <TouchableOpacity
            style={styles.viewRequestButton}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('SelfDriveQuoteRequestDetail', { requestId: rid });
              else showInfo('Request details not available.');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.bottomBtnInner}>
              <Ionicons name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>View Request Details</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewBookingButton}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('SelfDriveBookingDetail', { bookingId });
              } else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('SelfDriveQuoteRequestDetail', { requestId: rid });
                else showInfo('Please check your Bookings section.');
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.bottomBtnInner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>View Booking Details</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Gradient Header
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  headerStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Hero Amount Banner
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  heroBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  heroLeft: { flex: 1 },
  heroQuoteLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroStatusText: { fontSize: 12, fontWeight: '700' },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 14, color: C.sub, marginTop: 8 },

  scrollView: { flex: 1 },

  content: { padding: 16, paddingTop: 12, paddingBottom: 110 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardText: { fontSize: 14, color: '#334155', fontWeight: '600' },

  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.g500,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 2,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 10,
    paddingTop: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: C.muted, marginBottom: 3, fontWeight: '500', letterSpacing: 0.2 },
  infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  // Vehicle card
  vehicleHeroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  vehicleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.g700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleTextWrap: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: C.g700 },
  vehicleBrand: { fontSize: 13, color: C.sub, marginTop: 3 },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: { fontSize: 14, color: C.sub },
  priceValue: { fontSize: 14, color: C.text, fontWeight: '600' },
  priceDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  priceLabelTotal: { fontSize: 15, fontWeight: '700', color: C.text },
  priceValueTotal: { fontSize: 19, fontWeight: '800', color: C.g700 },

  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  timelineRowBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 10,
    paddingTop: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 11, color: C.muted, fontWeight: '500', marginBottom: 2 },
  timelineValue: { fontSize: 14, color: C.text, fontWeight: '600' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 12 },
  emptySubtitle: {
    fontSize: 14,
    color: C.sub,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Image Slider
  imageSliderContainer: {
    position: 'relative',
    backgroundColor: C.g50,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  imageSlide: {
    width: SLIDER_WIDTH,
    height: 250,
    backgroundColor: C.g50,
  },
  sliderImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: C.g700,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Features
  featuresWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  featureText: {
    fontSize: 13,
    color: C.sub,
    flex: 1,
  },

  // List items
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 9,
    paddingTop: 10,
  },
  listText: {
    fontSize: 13,
    color: C.sub,
    flex: 1,
    lineHeight: 20,
  },
  termNumberBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.g50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  listNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: C.g700,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  viewRequestButton: {
    backgroundColor: C.g700,
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewBookingButton: {
    backgroundColor: C.green,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bottomBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
