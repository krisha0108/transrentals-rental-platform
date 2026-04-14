/**
 * WanderScreen.js – Wander Tours & Experiences
 * Matches TransRentals app design language (same as LuxuryScreen / BikeRentalScreen)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wanderService from '../../services/wanderService';
import { BASE_URL } from '../../api';

const SAVED_KEY = '@wander_saved_tours';

const { width } = Dimensions.get('window');
const GREEN = '#09B368';
const BG = '#F5F5F7';

/* ─── Fallback data ────────────────────────────────────────────────────────── */
const FALLBACK_CATS = [
  { id: 'all',        name: 'All',          icon: '🌍' },
  { id: 'adventure',  name: 'Adventure',    icon: '🏔️' },
  { id: 'beach',      name: 'Beach',        icon: '🏖️' },
  { id: 'heritage',   name: 'Heritage',     icon: '🏛️' },
  { id: 'wildlife',   name: 'Wildlife',     icon: '🦁' },
  { id: 'pilgrimage', name: 'Pilgrimage',   icon: '🕌' },
  { id: 'hill',       name: 'Hill Stations',icon: '⛰️' },
];

const SORT_OPTIONS = [
  { key: 'newest',    label: 'Newest' },
  { key: 'popular',   label: 'Popular' },
  { key: 'priceAsc',  label: 'Price: Low → High' },
  { key: 'priceDesc', label: 'Price: High → Low' },
];

const VIBE_TAGS = [
  '🌅 Sunrise Treks', '⛺ Camping', '🤿 Scuba', '🎭 Cultural',
  '🪂 Paragliding', '🛕 Spiritual', '📸 Photography', '🚴 Cycling',
];

const POPULAR_DESTINATIONS = [
  { name: 'Goa',        img: require('../../../assets/goa.png') },
  { name: 'Jaipur',     img: require('../../../assets/jaipur.png') },
  { name: 'Delhi',      img: require('../../../assets/delhi.png') },
  { name: 'Ahmedabad',  img: require('../../../assets/ahmedabad.png') },
  { name: 'Udaipur',    img: require('../../../assets/udaipur.png') },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function getImageUri(img) {
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${BASE_URL}${img}`;
  return `${BASE_URL}/uploads/${img}`;
}

function formatPrice(listing) {
  if (!listing) return 'Get Quote';
  if (listing.priceType === 'ON_REQUEST') return 'Get Quote';
  if (listing.priceType === 'PER_PERSON')
    return `₹${Number(listing.basePrice || 0).toLocaleString('en-IN')}/person`;
  if (listing.priceType === 'GROUP_BASED') {
    const tiers = Array.isArray(listing.priceTiers) ? listing.priceTiers : [];
    if (tiers.length > 0)
      return `From ₹${Number(tiers[0].price || 0).toLocaleString('en-IN')}`;
  }
  if (listing.basePrice) return `₹${Number(listing.basePrice).toLocaleString('en-IN')}`;
  return 'Get Quote';
}

/* ─── Sub-components ───────────────────────────────────────────────────────── */

// Horizontal experience card
function ExpCard({ item, onPress }) {
  const uri = getImageUri(item.coverImage);
  return (
    <TouchableOpacity style={styles.expCard} onPress={onPress} activeOpacity={0.85}>
      {uri ? (
        <Image source={{ uri }} style={styles.expImg} resizeMode="cover" />
      ) : (
        <View style={[styles.expImg, styles.imgFallback]}>
          <Ionicons name="compass-outline" size={28} color="#94A3B8" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={styles.expGrad}
      >
        <Text style={styles.expTitle} numberOfLines={2}>{item.title}</Text>
        {item.duration ? <Text style={styles.expDuration}>{item.duration}</Text> : null}
        {item.vendorCount > 0 && (
          <View style={styles.expBadge}>
            <Text style={styles.expBadgeText}>{item.vendorCount} vendors</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Destination pill
function DestCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.destCard} onPress={onPress} activeOpacity={0.85}>
      <Image source={item.img} style={styles.destImg} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.destGrad}>
        <Text style={styles.destName}>{item.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Tour listing card — full width, clean card style matching the app
function TourCard({ item, onPress, saved, onSave }) {
  const uri = getImageUri(
    Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.coverImage
  );
  const price = formatPrice(item);
  const inclusions = Array.isArray(item.inclusions) ? item.inclusions.slice(0, 3) : [];
  const isOnRequest = item.priceType === 'ON_REQUEST';

  return (
    <TouchableOpacity style={styles.tourCard} onPress={onPress} activeOpacity={0.88}>
      {/* Image */}
      <View style={styles.tourImgWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.tourImg} resizeMode="cover" />
        ) : (
          <View style={[styles.tourImg, styles.imgFallback]}>
            <Ionicons name="image-outline" size={36} color="#94A3B8" />
          </View>
        )}
        {/* Save / Bookmark button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={(e) => { e.stopPropagation(); onSave(item.id); }}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? GREEN : '#fff'}
          />
        </TouchableOpacity>
        {/* Duration badge */}
        {item.duration ? (
          <View style={styles.durBadge}>
            <Icon name="clock" size={11} color="#fff" />
            <Text style={styles.durText}> {item.duration}</Text>
          </View>
        ) : null}
        {/* Rating */}
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#FFB800" />
            <Text style={styles.ratingText}> {Number(item.rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.tourBody}>
        {/* Category label */}
        {item.category?.name ? (
          <Text style={styles.tourCatLabel}>{item.category.name.toUpperCase()}</Text>
        ) : null}

        {/* Title */}
        <Text style={styles.tourTitle} numberOfLines={2}>{item.title}</Text>

        {/* Location */}
        {item.mainLocation?.name ? (
          <View style={styles.tourLocRow}>
            <Ionicons name="location-outline" size={13} color={GREEN} />
            <Text style={styles.tourLocText}>{item.mainLocation.name}</Text>
          </View>
        ) : null}

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <View style={styles.inclusionWrap}>
            {inclusions.map((inc, i) => (
              <View key={i} style={styles.inclusionChip}>
                <Icon name="check" size={10} color={GREEN} />
                <Text style={styles.inclusionText}>{inc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Price + CTA */}
        <View style={styles.tourFooter}>
          <View>
            {isOnRequest ? (
              <Text style={styles.onRequestText}>Price on request</Text>
            ) : (
              <>
                <Text style={styles.priceLabel}>Starting from</Text>
                <Text style={styles.priceValue}>{price}</Text>
              </>
            )}
          </View>
          <TouchableOpacity style={styles.viewBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.viewBtnText}>View Tour</Text>
            <Icon name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Main Screen ──────────────────────────────────────────────────────────── */
export default function WanderScreen() {
  const navigation = useNavigation();

  const [categories, setCategories]     = useState(FALLBACK_CATS);
  const [experiences, setExperiences]   = useState([]);
  const [listings, setListings]         = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [sortBy, setSortBy]           = useState('newest');
  const [showSort, setShowSort]       = useState(false);

  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [savedIds, setSavedIds]         = useState(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const scrollRef = useRef(null);

  /* ── Load saved IDs from AsyncStorage ── */
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then(raw => {
      if (raw) setSavedIds(new Set(JSON.parse(raw)));
    }).catch(() => {});
  }, []);

  const toggleSave = useCallback(async (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  /* ── Data loading ── */
  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    setPage(1);
    setListings([]);
    setHasMore(true);
    fetchListings(1, true);
  }, [selectedCat, sortBy]);

  const loadInitial = async () => {
    setIsLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        wanderService.getCategories().catch(() => ({ categories: [] })),
        wanderService.getExperiences().catch(() => ({ experiences: [] })),
      ]);
      if (catRes.categories?.length > 0)
        setCategories([{ id: 'all', name: 'All', icon: '🌍' }, ...catRes.categories]);
      if (expRes.experiences?.length > 0)
        setExperiences(expRes.experiences.slice(0, 8));
      await fetchListings(1, true);
    } catch (e) {
      console.log('Wander load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchListings = async (pageNum = 1, replace = false) => {
    try {
      const params = {
        page: pageNum, limit: 10, sortBy,
        ...(selectedCat !== 'all' ? { categoryIds: selectedCat } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const res = await wanderService.getListings(params);
      const items = res.listings || [];
      setListings(prev => replace ? items : [...prev, ...items]);
      setHasMore(items.length === 10);
    } catch (e) {
      console.log('Fetch listings error:', e);
    }
  };

  const handleSearch = () => {
    setPage(1); setListings([]); setHasMore(true);
    fetchListings(1, true);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1); setListings([]);
    await fetchListings(1, true);
    setIsRefreshing(false);
  }, [selectedCat, sortBy, search]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1; setPage(next);
    await fetchListings(next, false);
    setIsLoadingMore(false);
  };

  const openListing = (item) => {
    navigation.navigate('WanderListingDetail', {
      listingId: item.id,
      listingTitle: item.title || 'Tour Details',
    });
  };

  const openExperience = (exp) => {
    navigation.navigate('WanderListingDetail', {
      experienceSlug: exp.slug,
      listingTitle: exp.title || 'Experience',
    });
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Wander</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Discovering tours…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Main render ── */
  return (
    <SafeAreaView style={styles.safe}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Wander</Text>
        <TouchableOpacity
          style={styles.myTripsBtn}
          onPress={() => navigation.navigate('MyWanderBookings')}
        >
          <Ionicons name="grid-outline" size={18} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        onMomentumScrollEnd={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
            loadMore();
          }
        }}
      >
        {/* ── HERO BANNER ── */}
        <LinearGradient
          colors={['#0D3B2A', '#09B368', '#0D3B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>🧭 EXPLORE INDIA</Text>
            <Text style={styles.heroTitle}>Find your next{'\n'}adventure</Text>
            <Text style={styles.heroSub}>Curated tours · Verified vendors · Personalised quotes</Text>
          </View>

          {/* Search inside hero */}
          <View style={styles.heroSearch}>
            <Icon name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.heroSearchInput}
              placeholder="Goa, Leh, Kerala, Rajasthan…"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); handleSearch(); }}>
                <Icon name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.searchGoBtn} onPress={handleSearch}>
              <Text style={styles.searchGoBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── CATEGORY PILLS ── */}
        <View style={styles.groupCard}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, selectedCat === cat.id && styles.catPillActive]}
                onPress={() => setSelectedCat(cat.id)}
                activeOpacity={0.8}
              >
                {cat.icon ? <Text style={styles.catPillIcon}>{cat.icon}</Text> : null}
                <Text style={[styles.catPillText, selectedCat === cat.id && styles.catPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── POPULAR DESTINATIONS ── */}
        {selectedCat === 'all' && !search && (
          <View style={styles.groupCard}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destScroll}
            >
              {POPULAR_DESTINATIONS.map((d, i) => (
                <DestCard
                  key={i}
                  item={d}
                  onPress={() => {
                    setSearch(d.name);
                    handleSearch();
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── CURATED EXPERIENCES ── */}
        {experiences.length > 0 && selectedCat === 'all' && !search && (
          <View style={styles.groupCard}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Curated Experiences</Text>
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.expScroll}
            >
              {experiences.map(exp => (
                <ExpCard key={exp.id} item={exp} onPress={() => openExperience(exp)} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── VIBE TAGS ── */}
        {selectedCat === 'all' && !search && (
          <View style={styles.groupCard}>
            <Text style={styles.sectionTitle}>Find by Vibe</Text>
            <View style={styles.vibeWrap}>
              {VIBE_TAGS.map((tag, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.vibeChip}
                  onPress={() => {
                    const word = tag.split(' ').slice(1).join(' ');
                    setSearch(word);
                    handleSearch();
                  }}
                >
                  <Text style={styles.vibeText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── TOUR LISTINGS ── */}
        <View style={styles.groupCard}>
          {/* All / Saved tabs */}
          <View style={styles.savedTabRow}>
            <TouchableOpacity
              style={[styles.savedTab, !showSavedOnly && styles.savedTabActive]}
              onPress={() => setShowSavedOnly(false)}
            >
              <Text style={[styles.savedTabText, !showSavedOnly && styles.savedTabTextActive]}>All Tours</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.savedTab, showSavedOnly && styles.savedTabActive]}
              onPress={() => setShowSavedOnly(true)}
            >
              <Ionicons name="bookmark" size={13} color={showSavedOnly ? GREEN : '#94A3B8'} style={{ marginRight: 4 }} />
              <Text style={[styles.savedTabText, showSavedOnly && styles.savedTabTextActive]}>
                Saved{savedIds.size > 0 ? ` (${savedIds.size})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Listings header + sort — only for All tab */}
          {!showSavedOnly && (
            <View style={styles.listingsHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {selectedCat === 'all' ? 'All Tours' : categories.find(c => c.id === selectedCat)?.name || 'Tours'}
                </Text>
                <Text style={styles.countText}>{listings.length} tour{listings.length !== 1 ? 's' : ''} found</Text>
              </View>
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setShowSort(v => !v)}
              >
                <Icon name="sliders" size={14} color={GREEN} />
                <Text style={styles.sortBtnText}>
                  {SORT_OPTIONS.find(s => s.key === sortBy)?.label || 'Sort'}
                </Text>
                <Icon name={showSort ? 'chevron-up' : 'chevron-down'} size={13} color={GREEN} />
              </TouchableOpacity>
            </View>
          )}

          {/* Sort dropdown */}
          {showSort && !showSavedOnly && (
            <View style={styles.sortDropdown}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                  onPress={() => { setSortBy(opt.key); setShowSort(false); }}
                >
                  <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <Icon name="check" size={14} color={GREEN} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tour cards */}
          {showSavedOnly ? (
            (() => {
              const savedListings = listings.filter(item => savedIds.has(item.id));
              return savedListings.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="bookmark-outline" size={52} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No saved tours yet</Text>
                  <Text style={styles.emptySub}>Tap the bookmark icon on any tour to save it here</Text>
                  <TouchableOpacity style={styles.resetBtn} onPress={() => setShowSavedOnly(false)}>
                    <Text style={styles.resetBtnText}>Browse Tours</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                savedListings.map(item => (
                  <TourCard
                    key={item.id}
                    item={item}
                    onPress={() => openListing(item)}
                    saved={savedIds.has(item.id)}
                    onSave={toggleSave}
                  />
                ))
              );
            })()
          ) : listings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="map-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No tours found</Text>
              <Text style={styles.emptySub}>Try a different category or search term</Text>
              <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearch(''); setSelectedCat('all'); }}>
                <Text style={styles.resetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            listings.map(item => (
              <TourCard
                key={item.id}
                item={item}
                onPress={() => openListing(item)}
                saved={savedIds.has(item.id)}
                onSave={toggleSave}
              />
            ))
          )}

          {/* Load more */}
          {isLoadingMore && (
            <ActivityIndicator color={GREEN} style={{ marginVertical: 20 }} />
          )}
          {hasMore && !isLoadingMore && listings.length > 0 && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load more tours</Text>
              <Icon name="chevron-down" size={15} color={GREEN} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── USP STRIP ── */}
        <View style={styles.faqSec}>
          <Text style={styles.faqTitle}>Why Book with Wander?</Text>
          {[
            { icon: 'shield', label: 'Verified Vendors', sub: 'Every operator is background checked' },
            { icon: 'map',    label: '150+ Destinations', sub: 'All across India, all categories' },
            { icon: 'tag',    label: 'Personalised Quotes', sub: 'Get the best price for your group' },
            { icon: 'star',   label: 'Curated Experiences', sub: 'Handpicked itineraries, not random listings' },
          ].map((u, i) => (
            <View key={i} style={styles.uspRow}>
              <View style={styles.uspIconWrap}>
                <Icon name={u.icon} size={18} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uspLabel}>{u.label}</Text>
                <Text style={styles.uspSub}>{u.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: BG,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  myTripsBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // Loading
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: '#64748B', fontSize: 14 },

  // Hero
  hero: {
    marginHorizontal: 14,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    paddingBottom: 20,
  },
  heroOverlay: { padding: 20, paddingBottom: 12 },
  heroTag: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', lineHeight: 34 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 18 },
  heroSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroSearchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  searchGoBtn: {
    backgroundColor: GREEN, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  searchGoBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Group card (white section block)
  groupCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  newBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: '#92400E', letterSpacing: 0.8 },

  // Category pills
  catScroll: { gap: 8, paddingRight: 4 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  catPillActive: { backgroundColor: '#E8F8F2', borderColor: GREEN },
  catPillIcon: { fontSize: 14 },
  catPillText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  catPillTextActive: { color: GREEN, fontWeight: '700' },

  // Destinations
  destScroll: { gap: 10, paddingRight: 4 },
  destCard: { width: 100, height: 70, borderRadius: 14, overflow: 'hidden' },
  destImg: { width: '100%', height: '100%' },
  destGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 6, justifyContent: 'flex-end',
  },
  destName: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Experiences
  expScroll: { gap: 12, paddingRight: 4 },
  expCard: { width: 170, height: 110, borderRadius: 16, overflow: 'hidden' },
  expImg: { width: '100%', height: '100%' },
  expGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, gap: 2,
  },
  expTitle: { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  expDuration: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  expBadge: {
    marginTop: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(9,179,104,0.85)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  expBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  imgFallback: { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  // Vibe tags
  vibeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibeChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#F8FAFC', borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  vibeText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  // Saved tabs
  savedTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  savedTab: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10, gap: 4,
  },
  savedTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  savedTabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  savedTabTextActive: { color: GREEN },

  // Listings header
  listingsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 4,
  },
  countText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E8F8F2', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.2)',
  },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },
  sortDropdown: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 12, overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  sortOptionActive: { backgroundColor: '#F0FDF4' },
  sortOptionText: { fontSize: 14, color: '#374151' },
  sortOptionTextActive: { color: GREEN, fontWeight: '700' },

  // Tour card
  tourCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tourImgWrap: { position: 'relative' },
  tourImg: { width: '100%', height: 180 },
  durBadge: {
    position: 'absolute', bottom: 8, left: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  durText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  saveBtn: {
    position: 'absolute', top: 8, left: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center', alignItems: 'center',
  },

  tourBody: { padding: 14 },
  tourCatLabel: {
    fontSize: 10, fontWeight: '800', color: GREEN,
    letterSpacing: 1, marginBottom: 4,
  },
  tourTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', lineHeight: 22 },
  tourLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  tourLocText: { fontSize: 12, color: GREEN, fontWeight: '500' },

  inclusionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  inclusionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(9,179,104,0.15)',
  },
  inclusionText: { fontSize: 11, color: '#374151' },

  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },

  tourFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  onRequestText: { fontSize: 13, color: GREEN, fontWeight: '600' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11,
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  viewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  resetBtn: {
    marginTop: 16, backgroundColor: '#F1F5F9',
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
  },
  resetBtnText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // Load more
  loadMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  loadMoreText: { fontSize: 13, color: GREEN, fontWeight: '700' },

  // USP / FAQ strip
  faqSec: {
    backgroundColor: '#0D1F14',
    marginHorizontal: 14,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
  faqTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 16 },
  uspRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 14,
  },
  uspIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(9,179,104,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  uspLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  uspSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
});
