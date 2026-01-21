
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const GREEN = '#09B368';
const BG = '#F5F5F7';

// Car types for display
const CAR_TYPES = [
  { id: '1', name: 'Hatchback', img: require('../../../assets/carrrrr.png'), desc: 'Compact & affordable' },
  { id: '2', name: 'Sedan', img: require('../../../assets/7SeaterCarOnRent.png'), desc: 'Comfortable rides' },
  { id: '3', name: 'MUV', img: require('../../../assets/InnovaCrystaCarOnRent.png'), desc: '6-7 seaters' },
  { id: '4', name: 'SUV', img: require('../../../assets/InnovaCarOnRent.png'), desc: 'Premium comfort' },
];

// Trip types
const TRIP_TYPES = [
  { id: 'local', label: 'Local', icon: 'map-pin', desc: 'City rides with packages' },
  { id: 'one_way', label: 'One-Way', icon: 'arrow-right', desc: 'Drop to destination' },
  { id: 'round_trip', label: 'Round Trip', icon: 'repeat', desc: 'To & back journey' },
  { id: 'airport', label: 'Airport', icon: 'navigation', desc: 'Pickup or drop' },
];

const faqs = [
  {
    question: 'Can I book outstation cab?',
    answer: 'Yes. Choose round trip or one way, select date & see real-time pricing.',
  },
  {
    question: 'Are drivers included?',
    answer: 'Yes, for Chauffeur-driven cars driver is included. Fuel/toll extra as per pricing.',
  },
  {
    question: 'Can I get airport pickup?',
    answer: 'Yes. Select "Airport", choose pickup/drop, and see instant prices.',
  },
  {
    question: 'How do I pay?',
    answer: 'Book with real-time prices, pay online or to driver as per booking terms.',
  },
];

export default function CarRentalScreen() {
  const navigation = useNavigation();
  const [expandedFAQ, setExpandedFAQ] = React.useState(null);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Car Rental</Text>
        <View style={{ width: 40 }} />
        
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Book a Chauffeur-Driven Car</Text>
          <Text style={styles.heroSubtitle}>
            Real-time pricing, verified drivers, instant booking
          </Text>

          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => navigation.navigate('CarRentalFleetScreen')}
            activeOpacity={0.85}
          >
            <Ionicons name="car-sport" size={22} color="#fff" />
            <Text style={styles.bookNowBtnText}>Book Now</Text>
            <Icon name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Trip Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Types</Text>
          <View style={styles.tripTypeGrid}>
            {TRIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.tripTypeCard}
                onPress={() => navigation.navigate('CarRentalFleetScreen')}
                activeOpacity={0.8}
              >
                <View style={styles.tripTypeIcon}>
                  <Icon name={type.icon} size={18} color={GREEN} />
                </View>
                <Text style={styles.tripTypeLabel}>{type.label}</Text>
                <Text style={styles.tripTypeDesc}>{type.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Car Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Fleet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CAR_TYPES.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carCard}
                onPress={() => navigation.navigate('CarRentalFleetScreen')}
                activeOpacity={0.85}
              >
                <Image source={car.img} style={styles.carImage} />
                <Text style={styles.carName}>{car.name}</Text>
                <Text style={styles.carDesc}>{car.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'shield-checkmark', label: 'Verified Drivers' },
              { icon: 'time', label: 'On-Time Guarantee' },
              { icon: 'wallet', label: 'Transparent Pricing' },
              { icon: 'headset', label: '24/7 Support' },
            ].map((feature, idx) => (
              <View key={idx} style={styles.featureCard}>
                <Ionicons name={feature.icon} size={24} color={GREEN} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>FAQs</Text>
          {faqs.map((item, idx) => {
            const isOpen = expandedFAQ === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => setExpandedFAQ(isOpen ? null : idx)}
                >
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
                {isOpen && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          style={styles.bottomCTA}
          onPress={() => navigation.navigate('CarRentalFleetScreen')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconWrap}>
              <Ionicons name="flash" size={24} color="#fff" />
            </View>
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Ready to Book?</Text>
              <Text style={styles.ctaSubtitle}>See real-time prices & book instantly</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color={GREEN} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1 },

  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
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
  topTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  // Hero
  heroSection: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  bookNowBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },

  // Section
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },

  // Trip Types
  tripTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tripTypeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTypeLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  tripTypeDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // Car Cards
  carCard: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  carImage: { width: 80, height: 50, resizeMode: 'contain', marginBottom: 8 },
  carName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  carDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  // FAQ
  faqSection: {
    backgroundColor: '#0F172A',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: { fontSize: 14, color: '#fff', flex: 1, marginRight: 10 },
  faqA: { fontSize: 13, color: '#94A3B8', marginTop: 8, lineHeight: 20 },

  // Bottom CTA
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {},
  ctaTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  ctaSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
});
