/**
 * WanderListingDetailScreen.js
 * Tour detail + Quote Request — matches TransRentals app design language
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Dimensions,
  Alert, Modal, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wanderService from '../../services/wanderService';
import { BASE_URL } from '../../api';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function safeArr(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (!val) return fallback;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : fallback; } catch { return fallback; }
}

function getImg(img) {
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${BASE_URL}${img}`;
  return `${BASE_URL}/uploads/${img}`;
}

function formatPrice(listing) {
  if (!listing) return 'Get Quote';
  if (listing.priceType === 'ON_REQUEST') return 'Price on request';
  if (listing.priceType === 'PER_PERSON')
    return `₹${Number(listing.basePrice || 0).toLocaleString('en-IN')}/person`;
  if (listing.priceType === 'GROUP_BASED') {
    const tiers = safeArr(listing.priceTiers);
    if (tiers.length > 0)
      return `From ₹${Number(tiers[0].price || 0).toLocaleString('en-IN')}`;
  }
  if (listing.basePrice) return `₹${Number(listing.basePrice).toLocaleString('en-IN')}`;
  return 'Get Quote';
}

/* ─── Image Carousel ────────────────────────────────────────────────────── */
function ImageCarousel({ images, coverImage }) {
  const [idx, setIdx] = useState(0);
  // Always ensure imgs is an array
  const imgs = safeArr(images).filter(Boolean);
  const allImgs = imgs.length > 0 ? imgs : (coverImage ? [coverImage] : []);

  if (allImgs.length === 0) {
    return (
      <View style={styles.heroPlaceholder}>
        <Ionicons name="image-outline" size={52} color="#94A3B8" />
        <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 13 }}>No images</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {allImgs.map((img, i) => {
          const uri = getImg(img);
          return uri
            ? <Image key={i} source={{ uri }} style={styles.heroImg} resizeMode="cover" />
            : <View key={i} style={[styles.heroImg, styles.heroPlaceholder]}>
                <Ionicons name="image-outline" size={40} color="#94A3B8" />
              </View>;
        })}
      </ScrollView>
      {allImgs.length > 1 && (
        <View style={styles.dotRow}>
          {allImgs.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Main Screen ───────────────────────────────────────────────────────── */
export default function WanderListingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId, experienceSlug, listingTitle } = route.params || {};

  const [listing, setListing]           = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successData, setSuccessData]   = useState(null);

  // Quote form
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState('');
  const [travelDate, setTravelDate]       = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [groupSize, setGroupSize]         = useState('2');
  const [pickupLocation, setPickupLocation] = useState('');
  const [requirements, setRequirements]   = useState('');

  useEffect(() => {
    if (listingId) loadById();
    else if (experienceSlug) loadByExp();
    else { setError('No tour ID provided'); setIsLoading(false); }
    prefill();
  }, []);

  const loadById = async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await wanderService.getListingById(listingId);
      const data = res?.listing || (res?.id ? res : null);
      if (data) setListing(data);
      else setError('Tour not found');
    } catch (e) {
      setError('Failed to load tour. Check your connection.');
      console.log('loadById error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadByExp = async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await wanderService.getExperienceBySlug(experienceSlug);
      const first = res?.experience?.listings?.[0] || res?.listings?.[0];
      if (first) setListing(first);
      else setError('No tours available for this experience');
    } catch (e) {
      setError('Failed to load experience.');
    } finally {
      setIsLoading(false);
    }
  };

  const prefill = async () => {
    try {
      const raw = await AsyncStorage.getItem('customer');
      if (raw) { const c = JSON.parse(raw); setName(c.name || ''); setPhone(c.phone || ''); setEmail(c.email || ''); }
    } catch (_) {}
  };

  const submitQuote = async () => {
    if (!name.trim() || !phone.trim() || !pickupLocation.trim()) {
      return Alert.alert('Missing Info', 'Name, Phone and Pickup Location are required.');
    }
    if (phone.replace(/\D/g, '').length < 10) {
      return Alert.alert('Invalid Phone', 'Enter a valid 10-digit number.');
    }
    setIsSubmitting(true);
    try {
      // Read stored customer id so the record links to the logged-in account
      let storedCustomerId = null;
      try {
        const raw = await AsyncStorage.getItem('customer');
        if (raw) storedCustomerId = JSON.parse(raw)?.id || null;
      } catch (_) {}

      const res = await wanderService.createQuoteRequest({
        listingId: listing.id,
        customerId: storedCustomerId,          // pass so API skips find-or-create
        name: name.trim(), phone: phone.trim(), email: email.trim(),
        travelDate: travelDate.toISOString().split('T')[0],
        groupSize: parseInt(groupSize) || 2,
        pickupLocation: pickupLocation.trim(),
        requirements: requirements.trim(),
        bookingFor: 'PERSONAL',
      });
      if (res?.success) {
        setShowQuoteForm(false);
        setSuccessData({ requestId: res.requestId, tourTitle: listing.title });
        setShowSuccess(true);
      } else {
        Alert.alert('Error', res?.error || 'Could not send request. Try again.');
      }
    } catch { Alert.alert('Error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const fmtDate = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>{listingTitle || 'Tour Details'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading tour…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Error / Not found ── */
  if (error || !listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{listingTitle || 'Tour Details'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="map-outline" size={56} color="#CBD5E1" />
          <Text style={styles.errorTitle}>Tour not available</Text>
          <Text style={styles.errorSub}>{error || 'This tour could not be loaded.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={listingId ? loadById : loadByExp}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Data ── */
  const images     = safeArr(listing.images);
  const priceTiers = safeArr(listing.priceTiers);
  const inclusions = safeArr(listing.inclusions);
  const exclusions = safeArr(listing.exclusions);
  const highlights = safeArr(listing.highlights);
  const itinerary  = safeArr(listing.itinerary);
  const tripTypes  = safeArr(listing.tripTypes);
  const price      = formatPrice(listing);
  const isOnRequest = listing.priceType === 'ON_REQUEST';
  const vendorName = listing.vendor?.name || listing.vendor?.businessName || '';

  /* ── Render ── */
  return (
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>Tour Details</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MyWanderBookings')}>
          <Ionicons name="bookmark-outline" size={20} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* IMAGES */}
        <ImageCarousel images={images} coverImage={listing.coverImage} />

        {/* TITLE CARD */}
        <View style={styles.card}>
          {listing.category?.name && (
            <Text style={styles.catLabel}>{listing.category.name.toUpperCase()}</Text>
          )}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {listing.mainLocation?.name && (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={13} color={GREEN} />
                <Text style={styles.metaChipText}>{listing.mainLocation.name}</Text>
              </View>
            )}
            {listing.duration && (
              <View style={styles.metaChip}>
                <Icon name="clock" size={13} color={GREEN} />
                <Text style={styles.metaChipText}>{listing.duration}</Text>
              </View>
            )}
            {tripTypes.slice(0, 2).map((t, i) => (
              <View key={i} style={styles.metaChip}>
                <Icon name="tag" size={11} color={GREEN} />
                <Text style={styles.metaChipText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Rating */}
          {listing.rating > 0 && (
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map(s => (
                <Ionicons key={s} name={s <= Math.round(listing.rating) ? 'star' : 'star-outline'} size={16} color="#FFB800" />
              ))}
              <Text style={styles.ratingVal}> {Number(listing.rating).toFixed(1)}</Text>
              {listing.totalRatings > 0 && (
                <Text style={styles.ratingCount}>({listing.totalRatings} reviews)</Text>
              )}
            </View>
          )}
        </View>

        {/* VENDOR */}
        {vendorName ? (
          <View style={styles.card}>
            <View style={styles.vendorRow}>
              <View style={styles.vendorAvatar}>
                <Ionicons name="business-outline" size={22} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vendorName}>{vendorName}</Text>
                <Text style={styles.vendorMeta}>
                  Verified Vendor{listing.totalBookings > 0 ? ` · ${listing.totalBookings} trips done` : ''}
                </Text>
              </View>
              {listing.vendor?.phone && (
                <TouchableOpacity style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${listing.vendor.phone}`)}>
                  <Icon name="phone" size={14} color={GREEN} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        {/* PRICE */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Pricing</Text>
          {priceTiers.length > 0 ? (
            <View style={styles.tierGrid}>
              {priceTiers.map((t, i) => (
                <View key={i} style={styles.tierItem}>
                  <Text style={styles.tierGroup}>{t.groupSize} persons</Text>
                  <Text style={styles.tierPrice}>₹{Number(t.price || 0).toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.priceValue, isOnRequest && { color: GREEN, fontSize: 16 }]}>
              {price}
            </Text>
          )}
          {listing.minGroupSize > 0 && (
            <Text style={styles.groupNote}>
              Min {listing.minGroupSize} · Max {listing.maxGroupSize} persons
            </Text>
          )}
          {listing.cancellationPolicy && (
            <View style={styles.policyRow}>
              <Icon name="shield" size={12} color={GREEN} />
              <Text style={styles.policyText}>
                {' '}{listing.cancellationPolicy.replace(/_/g, ' ')} cancellation
              </Text>
            </View>
          )}
        </View>

        {/* DESCRIPTION */}
        {listing.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>About This Tour</Text>
            <Text style={styles.descText}>{listing.description}</Text>
          </View>
        ) : null}

        {/* HIGHLIGHTS */}
        {highlights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Highlights</Text>
            {highlights.map((h, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="star" size={13} color="#FFB800" />
                <Text style={styles.bulletText}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        {/* INCLUSIONS / EXCLUSIONS */}
        {(inclusions.length > 0 || exclusions.length > 0) && (
          <View style={styles.card}>
            {inclusions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Inclusions</Text>
                {inclusions.map((inc, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Icon name="check-circle" size={14} color={GREEN} />
                    <Text style={styles.bulletText}>{inc}</Text>
                  </View>
                ))}
              </>
            )}
            {exclusions.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: inclusions.length > 0 ? 16 : 0 }]}>
                  Exclusions
                </Text>
                {exclusions.map((exc, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Icon name="x-circle" size={14} color="#EF4444" />
                    <Text style={styles.bulletText}>{exc}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ITINERARY */}
        {itinerary.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Itinerary</Text>
            {itinerary.map((day, i) => (
              <View key={i} style={styles.dayRow}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>D{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayTitle}>{day.title || `Day ${i + 1}`}</Text>
                  {day.description ? <Text style={styles.dayDesc}>{day.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* STICKY CTA */}
      <View style={styles.ctaBar}>
        <View>
          <Text style={styles.ctaLabel}>{isOnRequest ? 'Get personalised' : 'Starting from'}</Text>
          <Text style={styles.ctaPrice}>{isOnRequest ? 'Quote' : price}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.ctaBtnOutline}
            onPress={() => navigation.navigate('WanderGroup', { listingId: listing.id, listingTitle: listing.title })}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={16} color={GREEN} />
            <Text style={styles.ctaBtnOutlineText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => setShowQuoteForm(true)}
            activeOpacity={0.85}
          >
            <Icon name="send" size={16} color="#fff" />
            <Text style={styles.ctaBtnText}>Quote</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SUCCESS MODAL */}
      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            {/* Glow ring + check */}
            <View style={styles.successRingOuter}>
              <View style={styles.successRingInner}>
                <LinearGradient
                  colors={['#09B368', '#06A35C']}
                  style={styles.successCircle}
                >
                  <Icon name="check" size={36} color="#fff" />
                </LinearGradient>
              </View>
            </View>

            <Text style={styles.successTitle}>Quote Sent!</Text>
            <Text style={styles.successSubtitle}>Your request has been submitted</Text>

            {/* Tour chip */}
            {successData?.tourTitle ? (
              <View style={styles.successTourChip}>
                <Ionicons name="compass-outline" size={14} color={GREEN} />
                <Text style={styles.successTourText} numberOfLines={2}>{successData.tourTitle}</Text>
              </View>
            ) : null}

            {/* Info rows */}
            <View style={styles.successInfoBox}>
              {successData?.requestId ? (
                <View style={styles.successInfoRow}>
                  <Icon name="hash" size={13} color="#64748B" />
                  <Text style={styles.successInfoLabel}>Request ID</Text>
                  <Text style={styles.successInfoVal}>#{successData.requestId}</Text>
                </View>
              ) : null}
              <View style={styles.successInfoRow}>
                <Icon name="clock" size={13} color="#64748B" />
                <Text style={styles.successInfoLabel}>Response time</Text>
                <Text style={styles.successInfoVal}>Within 24 hrs</Text>
              </View>
              <View style={[styles.successInfoRow, { borderBottomWidth: 0 }]}>
                <Icon name="phone" size={13} color="#64748B" />
                <Text style={styles.successInfoLabel}>Contact</Text>
                <Text style={styles.successInfoVal}>Vendor will call you</Text>
              </View>
            </View>

            {/* Note */}
            <View style={styles.successNote}>
              <Ionicons name="information-circle-outline" size={15} color={GREEN} />
              <Text style={styles.successNoteText}>
                The tour vendor will review your request and send a personalised quote to your phone.
              </Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.successPrimaryBtn}
              onPress={() => { setShowSuccess(false); navigation.navigate('MyWanderBookings'); }}
              activeOpacity={0.85}
            >
              <Ionicons name="bookmark-outline" size={17} color="#fff" />
              <Text style={styles.successPrimaryBtnText}>View My Trips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successSecondaryBtn}
              onPress={() => setShowSuccess(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successSecondaryBtnText}>Explore More Tours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QUOTE FORM MODAL */}
      <Modal
        visible={showQuoteForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuoteForm(false)}
      >
        <SafeAreaView style={styles.safe}>
          {/* Modal header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setShowQuoteForm(false)} style={styles.backBtn}>
              <Icon name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Request a Quote</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

            {/* Tour name pill */}
            <View style={styles.tourPill}>
              <Ionicons name="compass-outline" size={16} color={GREEN} />
              <Text style={styles.tourPillText} numberOfLines={2}>{listing.title}</Text>
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Your Name *</Text>
            <View style={styles.inputRow}>
              <Icon name="user" size={16} color="#94A3B8" />
              <TextInput style={styles.inputField} placeholder="Full name" placeholderTextColor="#94A3B8"
                value={name} onChangeText={setName} />
            </View>

            {/* Phone */}
            <Text style={styles.fieldLabel}>Phone *</Text>
            <View style={styles.inputRow}>
              <Icon name="phone" size={16} color="#94A3B8" />
              <TextInput style={styles.inputField} placeholder="10-digit mobile" placeholderTextColor="#94A3B8"
                keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />
            </View>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email (optional)</Text>
            <View style={styles.inputRow}>
              <Icon name="mail" size={16} color="#94A3B8" />
              <TextInput style={styles.inputField} placeholder="your@email.com" placeholderTextColor="#94A3B8"
                keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>

            {/* Travel date */}
            <Text style={styles.fieldLabel}>Travel Date *</Text>
            <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={16} color={GREEN} />
              <Text style={[styles.inputField, { color: '#0F172A', paddingVertical: 0 }]}>{fmtDate(travelDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={travelDate} mode="date"
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setTravelDate(d); }}
              />
            )}

            {/* Group size */}
            <Text style={styles.fieldLabel}>Group Size</Text>
            <View style={styles.groupRow}>
              {['1','2','3','4','5','6+'].map(s => (
                <TouchableOpacity key={s}
                  style={[styles.groupBtn, groupSize === s && styles.groupBtnActive]}
                  onPress={() => setGroupSize(s)}
                >
                  <Text style={[styles.groupBtnText, groupSize === s && styles.groupBtnTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pickup */}
            <Text style={styles.fieldLabel}>Pickup Location *</Text>
            <View style={styles.inputRow}>
              <Icon name="map-pin" size={16} color="#94A3B8" />
              <TextInput style={styles.inputField} placeholder="e.g. Ahmedabad city centre"
                placeholderTextColor="#94A3B8" value={pickupLocation} onChangeText={setPickupLocation} />
            </View>

            {/* Requirements */}
            <Text style={styles.fieldLabel}>Special Requirements</Text>
            <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 12 }]}>
              <Icon name="edit-3" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
              <TextInput style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Dietary needs, custom stops, accessibility…"
                placeholderTextColor="#94A3B8" multiline numberOfLines={4}
                value={requirements} onChangeText={setRequirements} />
            </View>

            {/* Info note */}
            <View style={styles.infoBox}>
              <Icon name="info" size={13} color={GREEN} />
              <Text style={styles.infoText}>
                {' '}Vendor reviews your request and sends a personalised quote within 24 hours.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={submitQuote} disabled={isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <><Icon name="send" size={16} color="#fff" /><Text style={styles.submitBtnText}>Send Quote Request</Text></>
              }
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, justifyContent: 'space-between', backgroundColor: BG,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },

  // Center states
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { color: '#64748B', fontSize: 14 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  errorSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  retryBtn: {
    marginTop: 20, backgroundColor: GREEN, borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 13,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Carousel
  heroImg: { width, height: 260 },
  heroPlaceholder: {
    width, height: 260, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  dotActive: { backgroundColor: GREEN, width: 14, borderRadius: 3 },

  // Card block (white section)
  card: {
    backgroundColor: '#fff', marginHorizontal: 14, borderRadius: 22,
    padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },

  // Title
  catLabel: { fontSize: 10, fontWeight: '800', color: GREEN, letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', lineHeight: 27 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.15)',
  },
  metaChipText: { fontSize: 12, color: GREEN, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 12 },
  ratingVal: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginLeft: 4 },
  ratingCount: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },

  // Vendor
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F8F2',
    justifyContent: 'center', alignItems: 'center',
  },
  vendorName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  vendorMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F8F2',
    justifyContent: 'center', alignItems: 'center',
  },

  // Price
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  priceValue: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tierItem: {
    backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)', alignItems: 'center',
  },
  tierGroup: { fontSize: 11, color: '#64748B' },
  tierPrice: { fontSize: 16, fontWeight: '800', color: GREEN, marginTop: 2 },
  groupNote: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  policyText: { fontSize: 12, color: GREEN, fontWeight: '600' },

  // Content sections
  descText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  dayRow: {
    flexDirection: 'row', gap: 12, marginBottom: 12,
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  dayBadge: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  dayTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  dayDesc: { fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 18 },

  // CTA bar
  ctaBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F2F5',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 8,
  },
  ctaLabel: { fontSize: 11, color: '#94A3B8' },
  ctaPrice: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN,
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ctaBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#E8F8F2',
  },
  ctaBtnOutlineText: { color: GREEN, fontSize: 14, fontWeight: '700' },

  // Quote modal
  tourPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F8F2',
    borderRadius: 12, padding: 12, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)',
  },
  tourPillText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 18, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  inputField: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  groupRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  groupBtn: {
    width: 46, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  groupBtnActive: { backgroundColor: '#E8F8F2', borderColor: GREEN },
  groupBtnText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  groupBtnTextActive: { color: GREEN },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4',
    borderRadius: 12, padding: 12, marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.15)',
  },
  infoText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, marginTop: 20,
    shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Success modal
  successOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: '#fff', borderRadius: 28, padding: 24,
    width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16,
  },
  successRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(9,179,104,0.08)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successRingInner: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  successCircle: {
    width: 66, height: 66, borderRadius: 33,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  successSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 18 },

  successTourChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)', width: '100%', marginBottom: 16,
  },
  successTourText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' },

  successInfoBox: {
    backgroundColor: '#F8FAFC', borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
    width: '100%', marginBottom: 16, overflow: 'hidden',
  },
  successInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  successInfoLabel: { flex: 1, fontSize: 13, color: '#64748B' },
  successInfoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  successNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.15)',
    width: '100%', marginBottom: 22,
  },
  successNoteText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },

  successPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GREEN, borderRadius: 16, paddingVertical: 15,
    width: '100%', marginBottom: 10,
    shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  successPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successSecondaryBtn: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16,
    paddingVertical: 14, width: '100%', alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  successSecondaryBtnText: { color: '#374151', fontSize: 14, fontWeight: '700' },
});
