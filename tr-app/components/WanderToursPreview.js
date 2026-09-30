import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import wanderService from '../screens/services/wanderService';
import { BASE_URL } from '../screens/api';

const GREEN = '#09B368';
const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.72);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.92);
const SHOW = 2;

const firstImage = (listing) => {
  let images = listing.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  const img = (Array.isArray(images) && images.find(Boolean)) || listing.coverImage;
  if (!img || typeof img !== 'string') return null;
  if (img.startsWith('http')) return img;
  return `${BASE_URL}${img.startsWith('/') ? '' : '/uploads/'}${img}`;
};

const priceText = (listing) => {
  const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  if (listing.priceType === 'ON_REQUEST' || !listing.basePrice) return 'Get a quote';
  if (listing.priceType === 'PER_PERSON') return `${rupees(listing.basePrice)} / person`;
  if (listing.priceType === 'PER_GROUP') return `${rupees(listing.basePrice)} / group`;
  return `From ${rupees(listing.basePrice)}`;
};

// "Wander tours" strip for the home screen: the first couple of tours as
// large photo cards, then a card that opens the full Wander screen.
// Renders nothing if there are no tours or the request fails.
export default function WanderToursPreview() {
  const navigation = useNavigation();
  const [tours, setTours] = useState([]);

  useEffect(() => {
    let alive = true;
    wanderService.getListings({ page: 1, limit: 8, sortBy: 'popular' })
      .then((res) => {
        const list = res?.listings || [];
        // Tours with photos first, so the home screen always looks good.
        const sorted = [...list].sort((a, b) => Number(!!firstImage(b)) - Number(!!firstImage(a)));
        if (alive) setTours(sorted.slice(0, SHOW));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (tours.length === 0) return null;

  const openAll = () => navigation.navigate('WanderScreen');

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Wander Tours</Text>
          <Text style={styles.subtitle}>Handpicked trips by local hosts</Text>
        </View>
        <TouchableOpacity style={styles.viewAll} onPress={openAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.viewAllText}>View more</Text>
          <Ionicons name="chevron-forward" size={14} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {tours.map((tour) => {
          const uri = firstImage(tour);
          const city = tour.mainLocation?.name;
          return (
            <TouchableOpacity
              key={tour.id}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() => navigation.navigate('WanderListingDetail', { listingId: tour.id, listingTitle: tour.title })}
            >
              {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#064E3B', '#09B368']} style={[StyleSheet.absoluteFill, styles.noImage]}>
                  <Ionicons name="compass-outline" size={54} color="rgba(255,255,255,0.35)" />
                </LinearGradient>
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.topRow}>
                {tour.category?.name ? (
                  <View style={styles.tag}><Text style={styles.tagText} numberOfLines={1}>{tour.category.name}</Text></View>
                ) : <View />}
                {tour.rating > 0 && (
                  <View style={styles.rating}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingText}>{Number(tour.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.bottom}>
                <Text style={styles.cardTitle} numberOfLines={2}>{tour.title}</Text>
                <View style={styles.metaRow}>
                  {city ? (
                    <View style={styles.meta}>
                      <Ionicons name="location" size={12} color="#A7F3D0" />
                      <Text style={styles.metaText} numberOfLines={1}>{city}</Text>
                    </View>
                  ) : null}
                  {tour.duration ? (
                    <View style={styles.meta}>
                      <Ionicons name="time" size={12} color="#A7F3D0" />
                      <Text style={styles.metaText} numberOfLines={1}>{tour.duration}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{priceText(tour)}</Text>
                  <View style={styles.go}><Ionicons name="arrow-forward" size={14} color="#064E3B" /></View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity activeOpacity={0.85} style={styles.moreCard} onPress={openAll}>
          <View style={styles.moreIcon}><Ionicons name="compass" size={26} color={GREEN} /></View>
          <Text style={styles.moreTitle}>Explore all tours</Text>
          <Text style={styles.moreSub}>Day trips, weekend getaways and group tours</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#E8F8F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: GREEN },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: '#064E3B' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  topRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '70%' },
  tagText: { fontSize: 11, fontWeight: '700', color: '#064E3B' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { color: '#E5E7EB', fontSize: 12, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { color: '#fff', fontSize: 15, fontWeight: '800' },
  go: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#A7F3D0', justifyContent: 'center', alignItems: 'center' },
  moreCard: {
    width: Math.round(CARD_WIDTH * 0.62), height: CARD_HEIGHT, borderRadius: 20, backgroundColor: '#E8F8F2',
    borderWidth: 1.5, borderColor: 'rgba(9,179,104,0.3)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  moreIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  moreTitle: { fontSize: 15, fontWeight: '800', color: '#064E3B', textAlign: 'center' },
  moreSub: { fontSize: 12, color: '#047857', textAlign: 'center', marginTop: 4, lineHeight: 17 },
});
