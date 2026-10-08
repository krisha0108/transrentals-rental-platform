/**
 * WanderListingDetailScreen.js
 * Tour detail + Quote Request — matches TransRentals app design language
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Dimensions,
  Alert, Platform, Linking, KeyboardAvoidingView, Share, StatusBar, Animated,
} from 'react-native';
import Modal from '../../../components/SafeModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wanderService from '../../services/wanderService';
import { BASE_URL } from '../../api';
import StoriesRail from '../../../components/StoriesRail';
import { TEAL_DEEP, TEAL_MID } from '../../../theme';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';
const HERO_HEIGHT = Math.round(width * 1.05);

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
  const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  if (listing.priceType === 'ON_REQUEST') return 'Price on request';
  if (listing.priceType === 'PER_PERSON' && listing.basePrice) return `${rupees(listing.basePrice)}/person`;
  if (listing.priceType === 'PER_GROUP' && listing.basePrice) return `${rupees(listing.basePrice)}/group`;
  const tiers = safeArr(listing.priceTiers).filter((t) => Number(t.price) > 0);
  if (tiers.length > 0) {
    return `From ${rupees(Math.min(...tiers.map((t) => Number(t.price))))}`;
  }
  if (listing.basePrice) return rupees(listing.basePrice);
  return 'Get Quote';
}

// Lists arrive as arrays, JSON strings, or comma-separated text, and items
// may be strings or {name|title|label} objects.
function toTextList(val) {
  let list = val;
  if (typeof val === 'string') {
    try { list = JSON.parse(val); } catch { list = val.split(','); }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.title || x?.label || ''))
    .map((s) => plainText(s))
    .filter(Boolean);
}

// Tour descriptions written in the web editor can contain HTML.
function plainText(text) {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// "HOTEL_PICKUP" -> "Hotel pickup"
function humanize(value) {
  if (!value || typeof value !== 'string') return '';
  const s = value.replace(/_/g, ' ').toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const titleCase = (s) => String(s || '').replace(/\b\w/g, (c) => c.toUpperCase());

// Vendor tours store [{title, description}] per day; travel-agent tours store
// [{day, emoji, time, title, description, activities[]}] per stop.
function normaliseItinerary(raw) {
  return safeArr(raw).map((step, i) => {
    if (typeof step === 'string') {
      return { label: `Day ${i + 1}`, title: plainText(step), description: '', activities: [], time: '', emoji: '' };
    }
    const day = step.day || i + 1;
    return {
      label: typeof day === 'number' || /^\d+$/.test(String(day)) ? `Day ${day}` : String(day),
      title: plainText(step.title) || `Day ${day}`,
      description: plainText(step.description),
      activities: toTextList(step.activities),
      time: step.time || step.timeSpent || '',
      emoji: step.emoji || '',
    };
  });
}

/* ─── Hero gallery ──────────────────────────────────────────────────────── */
function HeroGallery({ images, category, title, city, duration }) {
  const [idx, setIdx] = useState(0);
  const uris = images.map(getImg).filter(Boolean);
  return (
    <View style={styles.hero}>
      {uris.length > 0 ? (
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {uris.map((uri, i) => <Image key={i} source={{ uri }} style={styles.heroImg} resizeMode="cover" />)}
        </ScrollView>
      ) : (
        <LinearGradient colors={['#064E3B', '#09B368']} style={[styles.heroImg, styles.heroEmpty]}>
          <Ionicons name="compass-outline" size={72} color="rgba(255,255,255,0.35)" />
        </LinearGradient>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText} pointerEvents="none">
        {category ? <Text style={styles.heroCategory}>{category.toUpperCase()}</Text> : null}
        <Text style={styles.heroTitle} numberOfLines={3}>{title}</Text>
        <View style={styles.heroMetaRow}>
          {city ? (
            <View style={styles.heroMeta}>
              <Ionicons name="location" size={13} color="#A7F3D0" />
              <Text style={styles.heroMetaText}>{titleCase(city)}</Text>
            </View>
          ) : null}
          {duration ? (
            <View style={styles.heroMeta}>
              <Ionicons name="time" size={13} color="#A7F3D0" />
              <Text style={styles.heroMetaText}>{duration}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {uris.length > 1 && (
        <View style={styles.heroCounter} pointerEvents="none">
          <Ionicons name="images-outline" size={12} color="#fff" />
          <Text style={styles.heroCounterText}>{idx + 1}/{uris.length}</Text>
        </View>
      )}
    </View>
  );
}

// Pinned above the scrolling content so the back/share/save buttons and the
// status bar stay readable no matter what part of the hero photo has
// scrolled underneath — a thin scrim backs them near the top, and a solid
// gradient + the tour title fade in together as the hero scrolls away.
const STICKY_HEADER_HEIGHT = 56;
function StickyHeader({ scrollY, topInset, title, onBack, onShare, onSaved }) {
  const fadeStart = HERO_HEIGHT * 0.35;
  const fadeEnd = HERO_HEIGHT * 0.72;
  const solidOpacity = scrollY.interpolate({
    inputRange: [fadeStart, fadeEnd],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const barHeight = topInset + STICKY_HEADER_HEIGHT;

  return (
    <View style={[styles.stickyHeader, { height: barHeight }]} pointerEvents="box-none">
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: solidOpacity }]}>
        <LinearGradient
          colors={[TEAL_DEEP, '#09B368']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[styles.stickyHeaderRow, { top: topInset + 8 }]}>
        <TouchableOpacity style={styles.heroBtn} onPress={onBack} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </TouchableOpacity>
        <Animated.Text numberOfLines={1} style={[styles.stickyHeaderTitle, { opacity: solidOpacity }]}>
          {title}
        </Animated.Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.heroBtn} onPress={onShare} accessibilityLabel="Share tour">
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroBtn} onPress={onSaved} accessibilityLabel="My trips">
            <Ionicons name="bookmark-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
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

  // Page state
  const [aboutOpen, setAboutOpen]   = useState(false);
  const [openDays, setOpenDays]     = useState({});
  const [includeTab, setIncludeTab] = useState('in');
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // The photo runs under the status bar on this screen only — but while
  // loading/errored there's no photo yet, just the plain white topBar, so
  // the status bar needs dark (not light) content to stay visible there.
  const showsPhotoHeader = !isLoading && !error && !!listing;
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(showsPhotoHeader ? 'light-content' : 'dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent');
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setTranslucent(false);
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, [showsPhotoHeader]),
  );

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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
  const images      = safeArr(listing.images).filter(Boolean);
  const heroImages  = images.length > 0 ? images : (listing.coverImage ? [listing.coverImage] : []);
  const priceTiers  = safeArr(listing.priceTiers);
  const inclusions  = toTextList(listing.inclusions);
  const exclusions  = toTextList(listing.exclusions);
  const highlights  = toTextList(listing.highlights);
  const itinerary   = normaliseItinerary(listing.itinerary);
  const tripTypes   = toTextList(listing.tripTypes);
  const languages   = toTextList(listing.guideLanguages);
  const availableDays = toTextList(listing.availableDays);
  const price       = formatPrice(listing);
  const isOnRequest = price === 'Price on request' || price === 'Get Quote';
  const vendor      = listing.vendor || {};
  const vendorName  = vendor.businessName || vendor.name || '';
  const city        = listing.mainLocation?.name || listing.destination || '';
  const about       = plainText(listing.description || listing.shortDescription);
  const groupText   = listing.minGroupSize > 0 && listing.maxGroupSize > 0
    ? `${listing.minGroupSize}–${listing.maxGroupSize} people`
    : listing.maxGroupSize > 0 ? `Up to ${listing.maxGroupSize}` : null;
  const pickupText  = listing.meetingPoint || humanize(listing.pickupType);

  const facts = [
    listing.duration && { icon: 'time-outline', label: 'Duration', value: listing.duration },
    groupText && { icon: 'people-outline', label: 'Group size', value: groupText },
    pickupText && { icon: 'navigate-outline', label: 'Pickup', value: pickupText },
    languages.length > 0 && { icon: 'chatbubbles-outline', label: 'Guide', value: languages.slice(0, 2).join(', ') },
  ].filter(Boolean);

  const goodToKnow = [
    listing.meetingPoint && { icon: 'location-outline', label: 'Meeting point', value: listing.meetingPoint },
    availableDays.length > 0 && { icon: 'calendar-outline', label: 'Runs on', value: availableDays.join(', ') },
    listing.advanceNoticeHours > 0 && { icon: 'alarm-outline', label: 'Book ahead', value: `At least ${listing.advanceNoticeHours} hours before` },
    listing.cancellationPolicy && { icon: 'shield-checkmark-outline', label: 'Cancellation', value: `${humanize(listing.cancellationPolicy)} policy` },
    listing.cancellationNotes && { icon: 'document-text-outline', label: 'Policy details', value: plainText(listing.cancellationNotes) },
  ].filter(Boolean);

  const shareTour = () => {
    const url = `${BASE_URL}/wander/${listing.slug || listing.id}`;
    Share.share({ message: `${listing.title}\n${url}` }).catch(() => {});
  };
  const openGroup = () => navigation.navigate('WanderGroup', { listingId: listing.id, listingTitle: listing.title });
  const includeList = includeTab === 'in' ? inclusions : exclusions;

  /* ── Render ── */
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >

        {/* HERO */}
        <HeroGallery
          images={heroImages}
          category={listing.category?.name}
          title={listing.title}
          city={city}
          duration={listing.duration}
        />

        <View style={styles.sheet}>
          {/* Rating + trip types */}
          <View style={styles.badgeRow}>
            {listing.rating > 0 ? (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingPillText}>{Number(listing.rating).toFixed(1)}</Text>
                {listing.totalRatings > 0 && <Text style={styles.ratingPillCount}>({listing.totalRatings})</Text>}
              </View>
            ) : (
              <View style={styles.newPill}>
                <Ionicons name="sparkles" size={12} color={GREEN} />
                <Text style={styles.newPillText}>New tour</Text>
              </View>
            )}
            {tripTypes.slice(0, 3).map((t) => (
              <View key={t} style={styles.typePill}><Text style={styles.typePillText}>{t}</Text></View>
            ))}
          </View>

          {/* Quick facts */}
          {facts.length > 0 && (
            <View style={styles.factsGrid}>
              {facts.map((f) => (
                <View key={f.label} style={[styles.factTile, facts.length === 1 && { width: '100%' }]}>
                  <View style={styles.factIcon}><Ionicons name={f.icon} size={18} color={GREEN} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factLabel}>{f.label}</Text>
                    <Text style={styles.factValue} numberOfLines={2}>{f.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>{isOnRequest ? 'Pricing' : 'Starting from'}</Text>
              <Text style={styles.priceBig}>{isOnRequest ? 'Get a custom quote' : price}</Text>
              {isOnRequest && <Text style={styles.priceHint}>The host sends a price for your dates and group.</Text>}
            </View>
            <View style={styles.priceIcon}><Ionicons name="pricetag" size={20} color="#fff" /></View>
          </View>
          {priceTiers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierRow}>
              {priceTiers.map((t, i) => (
                <View key={i} style={styles.tierChip}>
                  <Text style={styles.tierChipGroup}>{t.groupSize} {Number(t.groupSize) === 1 ? 'person' : 'people'}</Text>
                  <Text style={styles.tierChipPrice}>₹{Number(t.price || 0).toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* About */}
          {about ? (
            <Section title="About this tour">
              <Text style={styles.bodyText} numberOfLines={aboutOpen ? undefined : 5}>{about}</Text>
              {about.length > 260 && (
                <TouchableOpacity onPress={() => setAboutOpen((v) => !v)} style={styles.moreBtn}>
                  <Text style={styles.moreBtnText}>{aboutOpen ? 'Show less' : 'Read more'}</Text>
                  <Ionicons name={aboutOpen ? 'chevron-up' : 'chevron-down'} size={14} color={GREEN} />
                </TouchableOpacity>
              )}
            </Section>
          ) : null}

          {/* Highlights */}
          {highlights.length > 0 && (
            <Section title="Highlights">
              {highlights.map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <View style={styles.highlightIcon}><Ionicons name="sparkles" size={12} color="#B45309" /></View>
                  <Text style={styles.bodyText}>{h}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Itinerary timeline */}
          {itinerary.length > 0 && (
            <Section title="Itinerary" subtitle={`${itinerary.length} ${itinerary.length === 1 ? 'stop' : 'stops'} planned`}>
              {itinerary.map((step, i) => {
                const last = i === itinerary.length - 1;
                const open = openDays[i] ?? i === 0;
                return (
                  <View key={i} style={styles.tlRow}>
                    <View style={styles.tlRail}>
                      <View style={[styles.tlDot, open && styles.tlDotActive]}>
                        {step.emoji
                          ? <Text style={{ fontSize: 12 }}>{step.emoji}</Text>
                          : <Text style={[styles.tlDotText, open && { color: '#fff' }]}>{i + 1}</Text>}
                      </View>
                      {!last && <View style={styles.tlLine} />}
                    </View>
                    <TouchableOpacity
                      style={[styles.tlCard, last && { marginBottom: 0 }]}
                      activeOpacity={0.8}
                      onPress={() => setOpenDays((d) => ({ ...d, [i]: !open }))}
                    >
                      <View style={styles.tlHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tlKicker}>{step.label}{step.time ? ` · ${step.time}` : ''}</Text>
                          <Text style={styles.tlTitle}>{step.title}</Text>
                        </View>
                        {(step.description || step.activities.length > 0) && (
                          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                        )}
                      </View>
                      {open && step.description ? <Text style={styles.tlDesc}>{step.description}</Text> : null}
                      {open && step.activities.map((a, j) => (
                        <View key={j} style={styles.tlActivity}>
                          <View style={styles.tlActivityDot} />
                          <Text style={styles.tlActivityText}>{a}</Text>
                        </View>
                      ))}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </Section>
          )}

          {/* Included / not included */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <Section title="What's included">
              {inclusions.length > 0 && exclusions.length > 0 && (
                <View style={styles.segment}>
                  {[['in', `Included (${inclusions.length})`], ['out', `Not included (${exclusions.length})`]].map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.segmentBtn, includeTab === key && styles.segmentBtnActive]}
                      onPress={() => setIncludeTab(key)}
                    >
                      <Text style={[styles.segmentText, includeTab === key && styles.segmentTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {(inclusions.length > 0 && exclusions.length > 0 ? includeList : inclusions.length > 0 ? inclusions : exclusions).map((item, i) => {
                const included = inclusions.length > 0 && exclusions.length > 0 ? includeTab === 'in' : inclusions.length > 0;
                return (
                  <View key={i} style={styles.incRow}>
                    <Ionicons
                      name={included ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={included ? GREEN : '#EF4444'}
                    />
                    <Text style={styles.bodyText}>{item}</Text>
                  </View>
                );
              })}
            </Section>
          )}

          {/* Good to know */}
          {goodToKnow.length > 0 && (
            <Section title="Good to know">
              {goodToKnow.map((g, i) => (
                <View key={g.label} style={[styles.infoRow, i === goodToKnow.length - 1 && { borderBottomWidth: 0 }]}>
                  <Ionicons name={g.icon} size={18} color="#475569" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{g.label}</Text>
                    <Text style={styles.infoValue}>{g.value}</Text>
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* Stories about this place */}
          {city ? (
            <StoriesRail
              city={city}
              title={`Stories from ${titleCase(city)}`}
              subtitle="Places to see, food and tips before you go"
              style={styles.storiesRail}
            />
          ) : null}

          {/* Host */}
          {vendorName ? (
            <Section title="Your host">
              <View style={styles.hostRow}>
                {getImg(vendor.logo) ? (
                  <Image source={{ uri: getImg(vendor.logo) }} style={styles.hostLogo} />
                ) : (
                  <View style={styles.hostAvatar}><Text style={styles.hostInitial}>{vendorName.charAt(0).toUpperCase()}</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.hostNameRow}>
                    <Text style={styles.hostName} numberOfLines={1}>{vendorName}</Text>
                    <Ionicons name="checkmark-circle" size={15} color={GREEN} />
                  </View>
                  <Text style={styles.hostMeta}>
                    {[
                      vendor.rating > 0 ? `★ ${Number(vendor.rating).toFixed(1)}` : null,
                      vendor._count?.wander_listings > 0 ? `${vendor._count.wander_listings} tours` : null,
                      listing.totalBookings > 0 ? `${listing.totalBookings} trips done` : null,
                    ].filter(Boolean).join('  ·  ') || 'Verified TransRentals partner'}
                  </Text>
                </View>
                {vendor.phone ? (
                  <TouchableOpacity style={styles.hostCall} onPress={() => Linking.openURL(`tel:${vendor.phone}`)} accessibilityLabel="Call host">
                    <Ionicons name="call" size={16} color={GREEN} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </Section>
          ) : null}

          {/* Plan with friends */}
          <TouchableOpacity activeOpacity={0.9} onPress={openGroup}>
            <LinearGradient colors={['#064E3B', '#078A52']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.friendsCard}>
              <View style={styles.friendsIcon}><Ionicons name="people" size={22} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.friendsTitle}>Going with friends?</Text>
                <Text style={styles.friendsSub}>Make a group, vote on dates and plan this trip together.</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </View>
      </Animated.ScrollView>

      <StickyHeader
        scrollY={scrollY}
        topInset={insets.top}
        title={listing.title}
        onBack={() => navigation.goBack()}
        onShare={shareTour}
        onSaved={() => navigation.navigate('MyWanderBookings')}
      />

      {/* STICKY CTA */}
      <View style={styles.ctaBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaLabel}>{isOnRequest ? 'Custom pricing' : 'Starting from'}</Text>
          <Text style={styles.ctaPrice} numberOfLines={1}>{isOnRequest ? 'Get a quote' : price}</Text>
        </View>
        <TouchableOpacity style={styles.ctaIconBtn} onPress={openGroup} activeOpacity={0.85} accessibilityLabel="Plan with friends">
          <Ionicons name="people-outline" size={20} color={GREEN} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowQuoteForm(true)} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Request Quote</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
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

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          </KeyboardAvoidingView>
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

  // Hero
  hero: { width, height: HERO_HEIGHT, backgroundColor: '#0F172A' },
  heroImg: { width, height: HERO_HEIGHT },
  heroEmpty: { justifyContent: 'center', alignItems: 'center' },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', alignItems: 'center' },

  // Sticky header — pinned above the ScrollView, fades from scrim to solid
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  stickyHeaderRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stickyHeaderTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800', marginHorizontal: 12, textAlign: 'center' },
  heroText: { position: 'absolute', left: 18, right: 18, bottom: 40 },
  heroCategory: { color: '#A7F3D0', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '800', lineHeight: 31 },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  heroCounter: { position: 'absolute', right: 16, bottom: 44, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  heroCounterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Content sheet over the hero
  sheet: { marginTop: -24, backgroundColor: BG, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  ratingPillText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  ratingPillCount: { fontSize: 12, color: '#B45309' },
  newPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8F2', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  newPillText: { fontSize: 12, fontWeight: '700', color: GREEN },
  typePill: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  typePillText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  factTile: {
    width: (width - 32 - 10) / 2, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  factIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E8F8F2', justifyContent: 'center', alignItems: 'center' },
  factLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  factValue: { fontSize: 13, color: '#0F172A', fontWeight: '700', marginTop: 1 },

  priceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(9,179,104,0.25)',
  },
  priceLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  priceBig: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  priceHint: { fontSize: 12, color: '#64748B', marginTop: 4 },
  priceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  tierRow: { gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  tierChip: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  tierChipGroup: { fontSize: 11, color: '#64748B' },
  tierChipPrice: { fontSize: 15, fontWeight: '800', color: GREEN, marginTop: 1 },

  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.035, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  bodyText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 22 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
  moreBtnText: { fontSize: 13, fontWeight: '700', color: GREEN },

  highlightRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  highlightIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginTop: 1 },

  tlRow: { flexDirection: 'row' },
  tlRail: { width: 34, alignItems: 'center' },
  tlDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F8F2', borderWidth: 2, borderColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  tlDotActive: { backgroundColor: GREEN },
  tlDotText: { fontSize: 11, fontWeight: '800', color: GREEN },
  tlLine: { flex: 1, width: 2, backgroundColor: 'rgba(9,179,104,0.3)', marginVertical: 2 },
  tlCard: { flex: 1, marginLeft: 10, marginBottom: 12, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#EEF2F7' },
  tlHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlKicker: { fontSize: 11, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  tlTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  tlDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 8 },
  tlActivity: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 },
  tlActivityDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN, marginTop: 8 },
  tlActivityText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },

  segment: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 12 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 12.5, fontWeight: '600', color: '#64748B' },
  segmentTextActive: { color: '#0F172A', fontWeight: '800' },
  incRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },

  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#0F172A', marginTop: 2, lineHeight: 20 },

  storiesRail: { marginTop: 22 },

  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostLogo: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
  hostAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F8F2', justifyContent: 'center', alignItems: 'center' },
  hostInitial: { fontSize: 20, fontWeight: '800', color: GREEN },
  hostNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hostName: { fontSize: 15, fontWeight: '800', color: '#0F172A', flexShrink: 1 },
  hostMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  hostCall: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8F8F2', justifyContent: 'center', alignItems: 'center' },

  friendsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 16 },
  friendsIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  friendsTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  friendsSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 17 },

  ctaIconBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: GREEN, backgroundColor: '#E8F8F2', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
});
