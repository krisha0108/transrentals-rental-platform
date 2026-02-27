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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, getBaseURL, getQuoteRequestById } from '../../../api/client';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 32; // Full width with padding

const GREEN = '#09B368';
const BG = '#F5F5F7';
const DARK = '#0F172A';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  SENT: '#3B82F6',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#6B7280',
  WITHDRAWN: '#9CA3AF',
};

export default function PackersQuoteDetailScreen({ route, navigation }) {
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
      console.log('🌐 [Packers Image Debug] Base URL:', url);
      setBaseUrl(url);
    });
  }, []);

  const fetchQuoteDetail = useCallback(async () => {
    if (!quoteId) {
      Alert.alert('Error', 'Quote ID is missing');
      navigation.goBack();
      return;
    }

    try {
      const response = await getVendorQuotes('packers', {});
      const quotes = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);

      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('packers', rid);
              setBookingId(reqData.bookingId || null);
            } catch (_) {}
          }
        }
      } else {
        Alert.alert('Error', 'Quote not found');
      }
    } catch (error) {
      console.error('Error fetching quote detail:', error);
      Alert.alert('Error', 'Failed to load quote details');
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
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loaderText}>Loading quote details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Quote Not Found</Text>
          <Text style={styles.emptySubtitle}>This quote may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = quote.status || 'PENDING';
  const statusColor = STATUS_COLORS[status] || '#6B7280';

  const request = quote.request || {};
  const customerName = request.customerName || quote.customerName || 'Customer';
  const customerEmail = request.customerEmail || quote.customerEmail;
  const customerPhone = request.customerPhone || quote.customerPhone;
  const pickupCity = request.locationName || request.pickupCity || quote.pickupCity || 'N/A';
  const dropCity = request.dropCity || quote.dropCity;
  const pickupDate = request.pickupDate || quote.pickupDate || request.startDate;
  const returnDate = request.returnDate || quote.returnDate || request.endDate || request.dropDate;
  const vehicleName = quote.vehicleName || quote.serviceType || request.serviceType;
  const vehicleBrand = quote.vehicleBrand || quote.equipmentBrand;

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
    console.log('🖼️ [Packers Image Debug] Processing path:', path);
    if (!path) return null;
    if (path.startsWith('http')) {
      console.log('✅ [Packers Image Debug] Path is already full URL:', path);
      return path;
    }
    const fullUrl = `${baseUrl}${path}`;
    console.log('🔗 [Packers Image Debug] Constructed URL:', fullUrl);
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
  console.log('🖼️ [Packers Image Debug] Raw vehicleImages from quote:', quote.vehicleImages);
  console.log('🖼️ [Packers Image Debug] Type:', typeof quote.vehicleImages);
  const rawImages = parseJSON(quote.vehicleImages);
  console.log('🖼️ [Packers Image Debug] Parsed images array:', rawImages);
  const vehicleImages = rawImages?.map(img => getFullImageUrl(img)).filter(Boolean) || null;
  console.log('🖼️ [Packers Image Debug] Final vehicleImages with full URLs:', vehicleImages);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quote Details</Text>
          <Text style={styles.headerSubtitle}>Packers & Movers</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={styles.statusContent}>
            <Ionicons name={getStatusIcon(status)} size={24} color={statusColor} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{status}</Text>
              <Text style={styles.quoteNumberText}>Quote #{quoteNumber}</Text>
            </View>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        <View style={styles.content}>
          {/* Service Images Slider */}
          {vehicleImages && vehicleImages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="images-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Service Images</Text>
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
                <Ionicons name="document-text-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Request Reference</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>Request #{requestNumber}</Text>
              </View>
            </View>
          )}

          {/* Customer Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{customerName}</Text>
                </View>
              </View>
              {customerEmail && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={18} color="#64748B" />
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
                <MaterialCommunityIcons name="dolly" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Vehicle Details</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.vehicleInfo}>
                  <MaterialCommunityIcons name="dolly" size={32} color={GREEN} />
                  <View style={styles.vehicleTextWrap}>
                    <Text style={styles.vehicleName}>{vehicleName}</Text>
                    {vehicleBrand && (
                      <Text style={styles.vehicleBrand}>{vehicleBrand}</Text>
                    )}
                  </View>
                </View>
                {quote.packingMaterials && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cube-outline" size={18} color="#64748B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Packing Materials</Text>
                      <Text style={styles.infoValue}>{quote.packingMaterials}</Text>
                    </View>
                  </View>
                )}
                {quote.estimatedDuration && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Estimated Duration</Text>
                      <Text style={styles.infoValue}>{quote.estimatedDuration}</Text>
                    </View>
                  </View>
                )}
                {quote.numberOfWorkers && (
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={18} color="#64748B" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Number of Workers</Text>
                      <Text style={styles.infoValue}>{quote.numberOfWorkers} persons</Text>
                    </View>
                  </View>
                )}
                {vehicleFeatures && vehicleFeatures.length > 0 && (
                  <View style={styles.featuresWrap}>
                    <Text style={styles.featuresTitle}>Features:</Text>
                    {vehicleFeatures.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Booking Details</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color={GREEN} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{pickupCity}</Text>
                </View>
              </View>
              {dropCity && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={18} color="#EF4444" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Drop Location</Text>
                    <Text style={styles.infoValue}>{dropCity}</Text>
                  </View>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color="#64748B" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pickup Date</Text>
                  <Text style={styles.infoValue}>{formatDate(pickupDate)}</Text>
                </View>
              </View>
              {returnDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color="#64748B" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Return Date</Text>
                    <Text style={styles.infoValue}>{formatDate(returnDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Pricing Breakdown</Text>
            </View>
            <View style={styles.card}>
              {baseAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Amount</Text>
                  <Text style={styles.priceValue}>{formatCurrency(baseAmount)}</Text>
                </View>
              )}
              {quote.packingCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Packing Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.packingCharges)}</Text>
                </View>
              )}
              {quote.unpackingCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Unpacking Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.unpackingCharges)}</Text>
                </View>
              )}
              {quote.loadingCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Loading Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.loadingCharges)}</Text>
                </View>
              )}
              {quote.unloadingCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Unloading Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.unloadingCharges)}</Text>
                </View>
              )}
              {quote.transportCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Transport Charges</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.transportCharges)}</Text>
                </View>
              )}
              {quote.insuranceCharges > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Insurance</Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.insuranceCharges)}</Text>
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
                <Ionicons name="time-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Quote Validity</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Ionicons name="hourglass-outline" size={18} color="#64748B" />
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
                <Ionicons name="chatbox-outline" size={20} color="#64748B" />
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
                <Ionicons name="checkmark-circle-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Inclusions</Text>
              </View>
              <View style={styles.card}>
                {inclusions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Ionicons name="checkmark-circle" size={16} color={GREEN} />
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
                <Ionicons name="close-circle-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Exclusions</Text>
              </View>
              <View style={styles.card}>
                {exclusions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
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
                <Ionicons name="document-text-outline" size={20} color="#64748B" />
                <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              </View>
              <View style={styles.card}>
                {termsConditions.map((item, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <Text style={styles.listNumber}>{idx + 1}.</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quote History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <Text style={styles.sectionTitle}>Quote Timeline</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <Ionicons name="paper-plane" size={16} color={GREEN} />
                <Text style={styles.timelineText}>
                  Sent on {formatDate(quote.createdAt || quote.created_at)}
                </Text>
              </View>
              {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                <View style={styles.timelineRow}>
                  <Ionicons name="refresh" size={16} color="#64748B" />
                  <Text style={styles.timelineText}>
                    Updated on {formatDate(quote.updatedAt)}
                  </Text>
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
              if (rid) navigation.navigate('PackersQuoteRequestDetail', { requestId: rid });
              else Alert.alert('Info', 'Request details not available.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>View Request Details</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewBookingButton}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('PackersBookingDetail', { bookingId });
              } else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('PackersQuoteRequestDetail', { requestId: rid });
                else Alert.alert('Info', 'Please check your Bookings section.');
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>View Booking Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DARK },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },

  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 14, color: '#64748B', marginTop: 8 },

  scrollView: { flex: 1 },

  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  statusContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusTextWrap: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  quoteNumberText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  totalAmount: { fontSize: 24, fontWeight: '700', color: GREEN },

  content: { padding: 16, paddingTop: 8, paddingBottom: 100 },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DARK },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardText: { fontSize: 14, color: '#334155', fontWeight: '600' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  infoValue: { fontSize: 14, color: DARK, fontWeight: '600' },

  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleTextWrap: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: DARK },
  vehicleBrand: { fontSize: 13, color: '#64748B', marginTop: 2 },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: { fontSize: 14, color: '#64748B' },
  priceValue: { fontSize: 14, color: DARK, fontWeight: '600' },
  priceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4
  },
  priceLabelTotal: { fontSize: 16, fontWeight: '700', color: DARK },
  priceValueTotal: { fontSize: 18, fontWeight: '700', color: GREEN },

  notesText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timelineText: { fontSize: 13, color: '#64748B' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: DARK, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Image Slider styles
  imageSliderContainer: {
    position: 'relative',
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageSlide: {
    width: SLIDER_WIDTH,
    height: 250,
    backgroundColor: '#F5F5F7',
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
    backgroundColor: GREEN,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Feature styles
  featuresWrap: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  listText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
  },
  listNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    width: 20,
  },

  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewRequestButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#475569', paddingVertical: 14, borderRadius: 12,
  },
  viewBookingButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
