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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorQuotes, getBaseURL, getQuoteRequestById, withdrawQuote } from '../../../api/client';
import { showError, showSuccess, showInfo, showConfirm } from '../../../../services/alertService';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 32;

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#475569', muted: '#94A3B8', blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB', red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED', indigo: '#4F46E5', indigoL: '#EEF2FF',
  teal: '#0D9488', tealL: '#F0FDFA', pink: '#DB2777', pinkL: '#FDF2F8',
  cyan: '#0891B2', cyanL: '#ECFEFF',
};

const STATUS_COLORS = {
  PENDING:   { color: C.amber,  bg: C.amberL  },
  SENT:      { color: C.amber,  bg: C.amberL  },
  ACCEPTED:  { color: C.g600,   bg: C.g50     },
  REJECTED:  { color: C.red,    bg: C.redL    },
  EXPIRED:   { color: C.muted,  bg: '#F8FAFC' },
  WITHDRAWN: { color: C.muted,  bg: '#F8FAFC' },
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'ACCEPTED':  return 'checkmark-circle';
    case 'REJECTED':  return 'close-circle';
    case 'EXPIRED':   return 'time';
    case 'PENDING':
    case 'SENT':      return 'hourglass';
    default:          return 'help-circle';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
};

/* ── Section wrapper ─────────────────────────────────────────────────────── */
const Section = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        {icon}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

/* ── Info row inside a card ──────────────────────────────────────────────── */
const InfoRow = ({ iconName, iconLib = 'ion', color, label, value }) => {
  const ic = color || C.muted;
  const IcoComp = iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: `${ic}18` }]}>
        <IcoComp name={iconName} size={16} color={ic} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function BikeQuoteDetailScreen({ route, navigation }) {
  const { quoteId } = route.params || {};
  const [quote,              setQuote]              = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [refreshing,         setRefreshing]         = useState(false);
  const [currentImageIndex,  setCurrentImageIndex]  = useState(0);
  const [bookingId,          setBookingId]          = useState(null);
  const [isWithdrawing,      setIsWithdrawing]      = useState(false);
  const imageSliderRef = useRef(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    getBaseURL().then(url => {
      console.log('🌐 [Image Debug] Base URL:', url);
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
      const response = await getVendorQuotes('bike', {});
      const quotes   = response.quotes || [];
      const foundQuote = quotes.find(q => (q.id || q._id) === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        if (foundQuote.status === 'ACCEPTED') {
          const rid = foundQuote.requestId || foundQuote.request?.id || foundQuote.request?._id;
          if (rid) {
            try {
              const reqData = await getQuoteRequestById('bike', rid);
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

  useEffect(() => { fetchQuoteDetail(); }, [fetchQuoteDetail]);

  const onRefresh = () => { setRefreshing(true); fetchQuoteDetail(); };

  const handleWithdraw = () => {
    showConfirm(
      'Withdraw Quote',
      'Are you sure you want to withdraw this quote?',
      async () => {
        try {
          setIsWithdrawing(true);
          await withdrawQuote('bike', quoteId);
          setQuote(prev => prev ? { ...prev, status: 'WITHDRAWN' } : null);
          showSuccess('Quote withdrawn successfully');
        } catch (err) {
          showError(err?.response?.data?.error || 'Failed to withdraw quote');
        } finally {
          setIsWithdrawing(false);
        }
      },
      { confirmText: 'Withdraw', destructive: true }
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quote Details</Text>
            <Text style={styles.headerSubtitle}>Bike Rental</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={styles.loaderText}>Loading quote details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Not found ── */
  if (!quote) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quote Details</Text>
            <Text style={styles.headerSubtitle}>Bike Rental</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={44} color={C.g400} />
          </View>
          <Text style={styles.emptyTitle}>Quote Not Found</Text>
          <Text style={styles.emptySubtitle}>This quote may have been removed</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Data extraction ── */
  const status      = quote.status || 'PENDING';
  const sc          = STATUS_COLORS[status] || { color: C.muted, bg: '#F8FAFC' };
  const request     = quote.request || {};
  const isActive    = ['SENT', 'VIEWED'].includes(status);
  const canReQuote  = status === 'WITHDRAWN' && ['PENDING', 'QUOTES_RECEIVED'].includes(request.status);

  const customerName  = request.customerName  || quote.customerName  || 'Customer';
  const customerEmail = request.customerEmail || quote.customerEmail;
  const customerPhone = request.customerPhone || quote.customerPhone;
  const pickupCity    = request.locationName  || request.pickupCity  || quote.pickupCity || 'N/A';
  const dropCity      = request.dropCity      || quote.dropCity;
  const pickupDate    = request.pickupDate    || quote.pickupDate    || request.startDate;
  const returnDate    = request.returnDate    || quote.returnDate    || request.endDate   || request.dropDate;
  const vehicleName   = quote.vehicleName     || quote.bikeType      || request.bikeType;
  const vehicleBrand  = quote.vehicleBrand    || quote.bikeBrand;

  const baseAmount     = quote.baseAmount    || quote.basePrice    || 0;
  const securityDeposit = quote.securityDeposit || quote.deposit   || 0;
  const taxes          = quote.taxes         || quote.tax          || quote.gst || quote.gstAmount || 0;
  const totalAmount    = quote.grandTotal    || quote.totalAmount  || quote.quotedAmount || baseAmount;

  const validTill       = quote.validTill    || quote.validUntil;
  const quoteNumber     = quote.quoteNumber  || (quote.id || quote._id)?.toString().slice(-8);
  const requestNumber   = request.requestNumber;
  const notes           = quote.notes || quote.description || quote.additionalInfo || quote.vendorMessage;

  const getFullImageUrl = (path) => {
    console.log('🖼️ [Image Debug] Processing path:', path);
    if (!path) { console.log('❌ [Image Debug] Path is null/undefined'); return null; }
    if (path.startsWith('http')) { console.log('✅ [Image Debug] Already full URL:', path); return path; }
    const fullUrl = `${baseUrl}${path}`;
    console.log('🔗 [Image Debug] Constructed URL:', fullUrl);
    console.log('   Base URL:', baseUrl);
    console.log('   Path:', path);
    return fullUrl;
  };

  const parseJSON = (field) => {
    if (!field) return null;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed).filter(Boolean);
        return null;
      } catch { return null; }
    }
    return null;
  };

  const rawImages       = parseJSON(quote.vehicleImages);
  const vehicleImages   = rawImages?.map(img => getFullImageUrl(img)).filter(Boolean) || null;
  const vehicleFeatures = parseJSON(quote.vehicleFeatures);
  const inclusions      = parseJSON(quote.inclusions);
  const exclusions      = parseJSON(quote.exclusions);
  const termsConditions = parseJSON(quote.termsConditions);
  const registrationNumber = quote.registrationNumber;
  const vehicleYear        = quote.vehicleYear;

  console.log('📊 [Image Debug] ==================== QUOTE DATA ====================');
  console.log('📊 [Image Debug] Quote ID:', quote.id);
  console.log('📊 [Image Debug] Raw vehicleImages from API:', quote.vehicleImages);
  console.log('📊 [Image Debug] Type of vehicleImages:', typeof quote.vehicleImages);
  console.log('📊 [Image Debug] Parsed rawImages:', rawImages);
  console.log('📊 [Image Debug] Final vehicleImages array:', vehicleImages);
  console.log('📊 [Image Debug] Images count:', vehicleImages?.length || 0);
  if (vehicleImages && vehicleImages.length > 0) {
    vehicleImages.forEach((img, index) => { console.log(`   Image ${index + 1}:`, img); });
  }
  console.log('📊 [Image Debug] ====================================================');

  /* ── Render ── */
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* Gradient Header */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quote Details</Text>
          <Text style={styles.headerSubtitle}>Bike Rental</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} />
        }
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: `${sc.color}30` }]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIconCircle, { backgroundColor: `${sc.color}18` }]}>
              <Ionicons name={getStatusIcon(status)} size={22} color={sc.color} />
            </View>
            <View>
              <Text style={[styles.statusLabelText, { color: sc.color }]}>{status}</Text>
              <Text style={styles.quoteNumText}>Quote #{quoteNumber}</Text>
            </View>
          </View>
          <Text style={[styles.totalAmountText, { color: C.g700 }]}>{formatCurrency(totalAmount)}</Text>
        </View>

        <View style={styles.content}>
          {/* ── Vehicle Images ── */}
          {vehicleImages && vehicleImages.length > 0 && (
            <Section
              icon={<Ionicons name="images-outline" size={16} color={C.g700} />}
              title="Vehicle Images"
            >
              <View style={styles.sliderWrap}>
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
                      <Image source={{ uri: item }} style={styles.sliderImage} resizeMode="cover" />
                    </View>
                  )}
                />
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
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {vehicleImages.length}
                  </Text>
                </View>
              </View>
            </Section>
          )}

          {/* ── Request Reference ── */}
          {requestNumber && (
            <Section
              icon={<Ionicons name="document-text-outline" size={16} color={C.g700} />}
              title="Request Reference"
            >
              <View style={styles.refBadge}>
                <Ionicons name="document-text-outline" size={16} color={C.g700} />
                <Text style={styles.refBadgeText}>Request #{requestNumber}</Text>
              </View>
            </Section>
          )}

          {/* ── Customer Information ── */}
          <Section
            icon={<Ionicons name="person-circle-outline" size={16} color={C.g700} />}
            title="Customer Information"
          >
            <InfoRow iconName="person" color={C.g600} label="Name" value={customerName} />
            {customerEmail && (
              <InfoRow iconName="mail" color={C.blue} label="Email" value={customerEmail} />
            )}
            {customerPhone && (
              <InfoRow iconName="call" color={C.teal} label="Phone" value={customerPhone} />
            )}
          </Section>

          {/* ── Vehicle Details ── */}
          {vehicleName && (
            <Section
              icon={<MaterialCommunityIcons name="motorbike" size={16} color={C.g700} />}
              title="Vehicle Details"
            >
              {/* Vehicle hero row */}
              <View style={styles.vehicleHero}>
                <View style={styles.vehicleHeroIcon}>
                  <MaterialCommunityIcons name="motorbike" size={28} color={C.g700} />
                </View>
                <View style={styles.vehicleHeroText}>
                  <Text style={styles.vehicleHeroName}>{vehicleName}</Text>
                  {vehicleBrand && <Text style={styles.vehicleHeroBrand}>{vehicleBrand}</Text>}
                </View>
              </View>
              {registrationNumber && (
                <InfoRow iconName="card-outline" color={C.sub} label="Registration Number" value={registrationNumber} />
              )}
              {vehicleYear && (
                <InfoRow iconName="calendar" color={C.sub} label="Model Year" value={String(vehicleYear)} />
              )}
              {vehicleFeatures && vehicleFeatures.length > 0 && (
                <View style={styles.featuresWrap}>
                  <Text style={styles.featuresTitle}>Features</Text>
                  {vehicleFeatures.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={15} color={C.g500} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>
          )}

          {/* ── Booking Details ── */}
          <Section
            icon={<Ionicons name="calendar-outline" size={16} color={C.g700} />}
            title="Booking Details"
          >
            <InfoRow iconName="location" color={C.g600}   label="Pickup Location" value={pickupCity} />
            {dropCity && (
              <InfoRow iconName="location" color={C.red}  label="Drop Location"   value={dropCity} />
            )}
            <InfoRow iconName="calendar" color={C.sub}    label="Pickup Date"     value={formatDate(pickupDate)} />
            {returnDate && (
              <InfoRow iconName="calendar" color={C.sub}  label="Return Date"     value={formatDate(returnDate)} />
            )}
          </Section>

          {/* ── Rental Details ── */}
          {(quote.helmetsIncluded || quote.kmLimitPerDay || quote.extraKmCharge) && (
            <Section
              icon={<MaterialCommunityIcons name="information-outline" size={16} color={C.g700} />}
              title="Rental Details"
            >
              {quote.helmetsIncluded > 0 && (
                <InfoRow iconName="motorbike" iconLib="mci" color={C.sub} label="Helmets Included" value={String(quote.helmetsIncluded)} />
              )}
              {quote.kmLimitPerDay && (
                <InfoRow iconName="speedometer" color={C.sub} label="KM Limit Per Day" value={`${quote.kmLimitPerDay} km`} />
              )}
              {quote.extraKmCharge > 0 && (
                <InfoRow iconName="cash-outline" color={C.sub} label="Extra KM Charge" value={`${formatCurrency(quote.extraKmCharge)}/km`} />
              )}
            </Section>
          )}

          {/* ── Pricing Breakdown ── */}
          <Section
            icon={<Ionicons name="receipt-outline" size={16} color={C.g700} />}
            title="Pricing Breakdown"
          >
            {quote.dailyRate > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Daily Rate</Text>
                <Text style={styles.priceValue}>{formatCurrency(quote.dailyRate)}/day</Text>
              </View>
            )}
            {baseAmount > 0 && quote.totalAmount && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Amount</Text>
                <Text style={styles.priceValue}>{formatCurrency(quote.totalAmount)}</Text>
              </View>
            )}
            {securityDeposit > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Security Deposit</Text>
                <Text style={styles.priceValue}>{formatCurrency(securityDeposit)}</Text>
              </View>
            )}
            {taxes > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & GST</Text>
                <Text style={styles.priceValue}>{formatCurrency(taxes)}</Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
            {quote.advanceAmount > 0 && (
              <>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Advance Payment ({quote.advancePercent}%)
                  </Text>
                  <Text style={styles.priceValue}>{formatCurrency(quote.advanceAmount)}</Text>
                </View>
              </>
            )}
          </Section>

          {/* ── Quote Validity ── */}
          {validTill && (
            <Section
              icon={<Ionicons name="time-outline" size={16} color={C.g700} />}
              title="Quote Validity"
            >
              <InfoRow iconName="hourglass-outline" color={C.amber} label="Valid Until" value={formatDate(validTill)} />
            </Section>
          )}

          {/* ── Inclusions ── */}
          {inclusions && inclusions.length > 0 && (
            <Section
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={C.g700} />}
              title="Inclusions"
            >
              <View style={styles.chipGrid}>
                {inclusions.map((item, idx) => (
                  <View key={idx} style={styles.inclusionChip}>
                    <Ionicons name="checkmark-circle" size={14} color={C.g600} />
                    <Text style={styles.inclusionChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* ── Exclusions ── */}
          {exclusions && exclusions.length > 0 && (
            <Section
              icon={<Ionicons name="close-circle-outline" size={16} color={C.g700} />}
              title="Exclusions"
            >
              <View style={styles.chipGrid}>
                {exclusions.map((item, idx) => (
                  <View key={idx} style={styles.exclusionChip}>
                    <Ionicons name="close-circle" size={14} color={C.red} />
                    <Text style={styles.exclusionChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* ── Terms & Conditions ── */}
          {termsConditions && termsConditions.length > 0 && (
            <Section
              icon={<Ionicons name="document-text-outline" size={16} color={C.g700} />}
              title="Terms & Conditions"
            >
              {termsConditions.map((item, idx) => (
                <View key={idx} style={styles.termItem}>
                  <View style={styles.termNum}>
                    <Text style={styles.termNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.termText}>{item}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* ── Additional Notes ── */}
          {notes && (
            <Section
              icon={<Ionicons name="chatbox-outline" size={16} color={C.g700} />}
              title="Additional Notes"
            >
              <Text style={styles.notesText}>{notes}</Text>
            </Section>
          )}

          {/* ── Quote Timeline ── */}
          <Section
            icon={<Ionicons name="time-outline" size={16} color={C.g700} />}
            title="Quote Timeline"
          >
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: C.g500 }]} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineBody}>
                <Text style={styles.timelineEvent}>Quote Sent</Text>
                <Text style={styles.timelineDate}>{formatDate(quote.createdAt || quote.created_at)}</Text>
              </View>
            </View>
            {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: C.sub }]} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineEvent}>Last Updated</Text>
                  <Text style={styles.timelineDate}>{formatDate(quote.updatedAt)}</Text>
                </View>
              </View>
            )}
          </Section>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {status === 'ACCEPTED' ? (
          <TouchableOpacity
            style={styles.viewBookingBtn}
            onPress={() => {
              if (bookingId) {
                navigation.navigate('BikeBookingDetail', { bookingId });
              } else {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('BikeQuoteRequestDetail', { requestId: rid });
                else showInfo('Please check your Bookings section.');
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.bottomBtnText}>View Booking Details</Text>
          </TouchableOpacity>
        ) : isActive ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.withdrawBtn, isWithdrawing && { opacity: 0.6 }]}
              onPress={handleWithdraw}
              disabled={isWithdrawing}
            >
              <Icon name="x-circle" size={17} color="#fff" />
              <Text style={styles.bottomBtnText}>{isWithdrawing ? 'Withdrawing...' : 'Withdraw'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewRequestBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('BikeQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={17} color="#fff" />
              <Text style={styles.bottomBtnText}>View Request</Text>
            </TouchableOpacity>
          </View>
        ) : canReQuote ? (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[styles.viewRequestBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('BikeQuoteRequestDetail', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Ionicons name="document-text-outline" size={17} color="#fff" />
              <Text style={styles.bottomBtnText}>View Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.freshQuoteBtn, { flex: 1 }]}
              onPress={() => {
                const rid = quote.requestId || quote.request?.id || quote.request?._id;
                if (rid) navigation.navigate('BikeSendQuote', { requestId: rid });
                else showInfo('Request details not available.');
              }}
            >
              <Icon name="refresh-cw" size={17} color="#fff" />
              <Text style={styles.bottomBtnText}>Send Fresh Quote</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.viewRequestBtn}
            onPress={() => {
              const rid = quote.requestId || quote.request?.id || quote.request?._id;
              if (rid) navigation.navigate('BikeQuoteRequestDetail', { requestId: rid });
              else showInfo('Request details not available.');
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.bottomBtnText}>View Request Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText:  { fontSize: 14, color: C.muted, marginTop: 8 },

  scrollView: { flex: 1 },

  /* Status Banner */
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusLabelText:  { fontSize: 15, fontWeight: '700' },
  quoteNumText:     { fontSize: 12, color: C.muted, marginTop: 2 },
  totalAmountText:  { fontSize: 22, fontWeight: '800' },

  content: { padding: 16, paddingBottom: 110 },

  /* Section */
  section:      { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  /* Card */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },

  /* InfoRow */
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoContent:  { flex: 1 },
  infoLabel:    { fontSize: 11, color: C.muted, marginBottom: 2 },
  infoValue:    { fontSize: 14, color: C.text, fontWeight: '600' },

  /* Ref badge */
  refBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.g50, padding: 12, borderRadius: 10,
  },
  refBadgeText: { fontSize: 14, fontWeight: '700', color: C.g700 },

  /* Vehicle hero */
  vehicleHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleHeroIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleHeroText: { flex: 1 },
  vehicleHeroName:  { fontSize: 16, fontWeight: '700', color: C.text },
  vehicleHeroBrand: { fontSize: 13, color: C.sub, marginTop: 3 },

  /* Features */
  featuresWrap: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  featuresTitle: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  featureItem:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText:  { fontSize: 13, color: C.sub, flex: 1 },

  /* Pricing */
  priceRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel:  { fontSize: 14, color: C.sub },
  priceValue:  { fontSize: 14, color: C.text, fontWeight: '600' },
  priceDivider:{ height: 1, backgroundColor: C.border, marginVertical: 6 },
  totalRow:    { paddingTop: 4 },
  totalLabel:  { fontSize: 15, fontWeight: '700', color: C.text },
  totalValue:  { fontSize: 20, fontWeight: '800', color: C.g700 },

  /* Chips */
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inclusionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g100,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  inclusionChipText: { fontSize: 12, color: C.g700, fontWeight: '600' },
  exclusionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.redL, borderWidth: 1, borderColor: '#FECACA',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  exclusionChipText: { fontSize: 12, color: C.red, fontWeight: '600' },

  /* Terms */
  termItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  termNum:  {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center',
  },
  termNumText: { fontSize: 11, fontWeight: '700', color: C.g700 },
  termText:    { fontSize: 13, color: C.sub, flex: 1, lineHeight: 20 },

  /* Notes */
  notesText: { fontSize: 14, color: C.sub, lineHeight: 22 },

  /* Timeline */
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  timelineDot:  { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { position: 'absolute', left: 4, top: 18, width: 2, height: 24, backgroundColor: C.border },
  timelineBody: { flex: 1 },
  timelineEvent: { fontSize: 14, fontWeight: '600', color: C.text },
  timelineDate:  { fontSize: 12, color: C.muted, marginTop: 2 },

  /* Image Slider */
  sliderWrap: { borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageSlide: { width: SLIDER_WIDTH - 32, height: 240, backgroundColor: C.bg },
  sliderImage: { width: '100%', height: '100%' },
  paginationDots: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  activeDot:  { backgroundColor: C.g400, width: 20 },
  inactiveDot: { backgroundColor: 'rgba(255,255,255,0.6)' },
  imageCounter: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  /* Bottom Bar */
  bottomBar: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  bottomRow: { flexDirection: 'row', gap: 10 },
  viewRequestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sub, paddingVertical: 15, borderRadius: 14,
  },
  viewBookingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.blue, paddingVertical: 15, borderRadius: 14,
  },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.red, paddingVertical: 15, borderRadius: 14, flex: 1,
  },
  freshQuoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.orange, paddingVertical: 15, borderRadius: 14,
  },
  bottomBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Empty */
  emptyState:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 32 },
});
