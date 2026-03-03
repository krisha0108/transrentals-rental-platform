import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import {
  TEAL_DEEP,
  TEAL_MID,
  TEAL,
  TEAL_LIGHT,
  BG,
  CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  SHADOW_SM,
  SHADOW_MD,
} from '../../../theme';

// Car types for display
const CAR_TYPES = [
  { id: '1', name: 'Hatchback', img: require('../../../assets/carrrrr.png'), desc: 'Compact & affordable' },
  { id: '2', name: 'Sedan', img: require('../../../assets/7SeaterCarOnRent.png'), desc: 'Comfortable rides' },
  { id: '3', name: 'MUV', img: require('../../../assets/InnovaCrystaCarOnRent.png'), desc: '6-7 seaters' },
  { id: '4', name: 'SUV', img: require('../../../assets/InnovaCarOnRent.png'), desc: 'Premium comfort' },
];

// Trip types
const TRIP_TYPES = [
  { id: 'local', label: 'Local', icon: 'location-outline', desc: 'City rides with packages' },
  { id: 'one_way', label: 'One-Way', icon: 'arrow-forward-outline', desc: 'Drop to destination' },
  { id: 'round_trip', label: 'Round Trip', icon: 'repeat-outline', desc: 'To & back journey' },
  { id: 'airport', label: 'Airport', icon: 'airplane-outline', desc: 'Pickup or drop' },
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

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF');
        }
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        style={styles.headerGrad}
      >
        <View style={[styles.decoCircle, { top: -30, right: -20, width: wp('25%'), height: wp('25%') }]} pointerEvents="none" />
        <View style={[styles.decoCircle, { bottom: -15, left: -15, width: wp('15%'), height: wp('15%') }]} pointerEvents="none" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Car Rental</Text>
          <View style={{ width: wp('9%') }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[TEAL_MID, TEAL_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={[styles.heroDecoCircle, { top: -wp('8%'), right: -wp('5%'), width: wp('30%'), height: wp('30%') }]} />
          <View style={[styles.heroDecoCircle, { bottom: -wp('6%'), left: -wp('4%'), width: wp('20%'), height: wp('20%') }]} />
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={wp('3%')} color={TEAL} />
            <Text style={styles.heroBadgeText}>Premium Service</Text>
          </View>
          <Text style={styles.heroTitle}>Book a Chauffeur-Driven Car</Text>
          <Text style={styles.heroSubtitle}>
            Real-time pricing, verified drivers, instant booking
          </Text>

          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => navigation.navigate('CarRentalFleetScreen')}
            activeOpacity={0.85}
          >
            <Ionicons name="car-sport" size={wp('5%')} color={TEAL_DEEP} />
            <Text style={styles.bookNowBtnText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={wp('4.5%')} color={TEAL_DEEP} />
          </TouchableOpacity>
        </LinearGradient>

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
                  <Ionicons name={type.icon} size={wp('4.5%')} color={TEAL} />
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: wp('4%') }}>
            {CAR_TYPES.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carCard}
                onPress={() => navigation.navigate('CarRentalFleetScreen')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[TEAL_LIGHT, '#F0FDF9']}
                  style={styles.carImageWrap}
                >
                  <Image source={car.img} style={styles.carImage} />
                </LinearGradient>
                <Text style={styles.carName}>{car.name}</Text>
                <Text style={styles.carDesc}>{car.desc}</Text>
                <View style={styles.carViewBtn}>
                  <Text style={styles.carViewBtnText}>View</Text>
                  <Ionicons name="chevron-forward" size={wp('3%')} color={TEAL} />
                </View>
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
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon} size={wp('5%')} color={TEAL} />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <Ionicons name="help-circle-outline" size={wp('5.5%')} color={TEAL} />
            <Text style={styles.faqTitle}>FAQs</Text>
          </View>
          {faqs.map((item, idx) => {
            const isOpen = expandedFAQ === idx;
            const isLast = idx === faqs.length - 1;
            return (
              <View key={idx} style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => setExpandedFAQ(isOpen ? null : idx)}
                >
                  <Text style={styles.faqQ}>{item.question}</Text>
                  <View style={styles.faqChevronWrap}>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={wp('3.5%')}
                      color={TEAL}
                    />
                  </View>
                </TouchableOpacity>
                {isOpen && <Text style={styles.faqA}>{item.answer}</Text>}
              </View>
            );
          })}
        </View>

        {/* Bottom CTA */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CarRentalFleetScreen')}
          activeOpacity={0.85}
          style={styles.bottomCTAWrap}
        >
          <LinearGradient
            colors={[TEAL_MID, TEAL_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomCTA}
          >
            <View style={[styles.ctaDecoCircle, { top: -wp('4%'), right: -wp('3%'), width: wp('16%'), height: wp('16%') }]} />
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconWrap}>
                <Ionicons name="flash" size={wp('5.5%')} color={TEAL_DEEP} />
              </View>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Ready to Book?</Text>
                <Text style={styles.ctaSubtitle}>See real-time prices & book instantly</Text>
              </View>
            </View>
            <View style={styles.ctaArrowWrap}>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: hp('5%') }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1 },

  /* ── Header ── */
  headerGrad: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + hp('1%') : hp('6%'),
    paddingBottom: hp('1.8%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* ── Hero ── */
  heroSection: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('3.5%'),
    paddingBottom: hp('3.5%'),
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroDecoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('5%'),
    gap: wp('1.5%'),
    marginBottom: hp('1.5%'),
  },
  heroBadgeText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: TEAL_LIGHT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: wp('5.8%'),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp('0.8%'),
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontSize: wp('3.5%'),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: hp('2.5%'),
    lineHeight: wp('5%'),
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('1.6%'),
    borderRadius: wp('8%'),
    gap: wp('2.5%'),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  bookNowBtnText: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: TEAL_DEEP,
  },

  /* ── Section ── */
  section: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2.5%'),
    paddingBottom: hp('0.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: hp('1.5%'),
    letterSpacing: 0.2,
  },

  /* ── Trip Types ── */
  tripTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tripTypeCard: {
    width: wp('44%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    marginBottom: hp('1.2%'),
    ...SHADOW_SM,
  },
  tripTypeIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('3%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  tripTypeLabel: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  tripTypeDesc: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },

  /* ── Car Cards ── */
  carCard: {
    width: wp('38%'),
    backgroundColor: CARD,
    borderRadius: wp('4%'),
    padding: wp('3%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    ...SHADOW_SM,
  },
  carImageWrap: {
    width: '100%',
    height: hp('9%'),
    borderRadius: wp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  carImage: {
    width: wp('24%'),
    height: hp('6%'),
    resizeMode: 'contain',
  },
  carName: {
    fontSize: wp('3.5%'),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  carDesc: {
    fontSize: wp('2.8%'),
    color: TEXT_MUTED,
    marginTop: hp('0.3%'),
  },
  carViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.8%'),
    gap: wp('1%'),
  },
  carViewBtnText: {
    fontSize: wp('2.8%'),
    fontWeight: '600',
    color: TEAL,
  },

  /* ── Features ── */
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: wp('44%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: wp('3.5%'),
    padding: wp('3.5%'),
    marginBottom: hp('1.2%'),
    gap: wp('2.5%'),
    ...SHADOW_SM,
  },
  featureIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    flex: 1,
  },

  /* ── FAQ ── */
  faqSection: {
    backgroundColor: TEAL_DEEP,
    marginHorizontal: wp('4%'),
    marginTop: hp('1.5%'),
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    ...SHADOW_MD,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  faqTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: hp('1.5%'),
  },
  faqHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: {
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    marginRight: wp('2.5%'),
  },
  faqChevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqA: {
    fontSize: wp('3.2%'),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp('1%'),
    lineHeight: wp('5%'),
  },

  /* ── Bottom CTA ── */
  bottomCTAWrap: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    borderRadius: wp('4.5%'),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  bottomCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4.5%'),
    overflow: 'hidden',
  },
  ctaDecoCircle: {
    position: 'absolute',
    borderRadius: wp('50%'),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: wp('3%'), flex: 1 },
  ctaIconWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { flex: 1 },
  ctaTitle: {
    fontSize: wp('4%'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.3%'),
  },
  ctaArrowWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
