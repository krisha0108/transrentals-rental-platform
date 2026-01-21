import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api';

const GREEN = '#09B368';
const BG = '#F5F5F7';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewScreen({ navigation, route }) {
  const { booking, bookingType } = route.params;

  const [overallRating, setOverallRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Map booking type to API endpoint
  const getApiEndpoint = () => {
    switch (bookingType) {
      case 'bike':
        return `/bike-bookings/${booking.id}`;
      case 'self-drive':
        return `/self-drive-bookings/${booking.id}`;
      case 'chauffeur':
      case 'car':
        return `/chauffeur-bookings/${booking.id}`;
      case 'bus':
        return `/bus-bookings/${booking.id}`;
      case 'truck':
        return `/truck-bookings/${booking.id}`;
      case 'equipment':
        return `/equipment-bookings/${booking.id}`;
      case 'luxury':
        return `/luxury-bookings/${booking.id}`;
      case 'packers':
        return `/packers-bookings/${booking.id}`;
      default:
        return `/bookings/${booking.id}`;
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Error', 'Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.patch(getApiEndpoint(), {
        action: 'review',
        rating: overallRating,
        review: review.trim() || null,
        driverRating: driverRating || overallRating,
        vehicleRating: vehicleRating || overallRating,
      });

      if (response.data.success) {
        Alert.alert(
          'Thank You!',
          'Your review has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.log('Review error:', error?.response?.data || error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, setRating, size = 32) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFB800' : '#CBD5E1'}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Info Card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingIconWrap}>
            <MaterialCommunityIcons
              name={
                bookingType === 'bike' ? 'motorbike' :
                bookingType === 'bus' ? 'bus' :
                bookingType === 'truck' ? 'truck' :
                bookingType === 'equipment' ? 'crane' :
                bookingType === 'packers' ? 'package-variant' :
                'car'
              }
              size={28}
              color={GREEN}
            />
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingNumber}>
              {booking.bookingNumber || booking.id}
            </Text>
            <Text style={styles.bookingVendor}>
              {booking.vendor?.name || booking.vendor?.businessName || 'TransRentals'}
            </Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>Overall Experience</Text>
          <Text style={styles.ratingSubtitle}>
            How was your overall experience with this booking?
          </Text>
          {renderStars(overallRating, setOverallRating, 40)}
          {overallRating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[overallRating - 1]}</Text>
          )}
        </View>

        {/* Driver Rating - for applicable services */}
        {['chauffeur', 'car', 'bus', 'luxury'].includes(bookingType) && (
          <View style={styles.subRatingSection}>
            <View style={styles.subRatingHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#64748B" />
              <Text style={styles.subRatingTitle}>Driver</Text>
            </View>
            {renderStars(driverRating, setDriverRating, 28)}
          </View>
        )}

        {/* Vehicle Rating - for applicable services */}
        {['chauffeur', 'car', 'bus', 'luxury', 'self-drive', 'bike'].includes(bookingType) && (
          <View style={styles.subRatingSection}>
            <View style={styles.subRatingHeader}>
              <Ionicons name="car-sport-outline" size={24} color="#64748B" />
              <Text style={styles.subRatingTitle}>Vehicle</Text>
            </View>
            {renderStars(vehicleRating, setVehicleRating, 28)}
          </View>
        )}

        {/* Review Text */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Write a Review (Optional)</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share details of your experience..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>Quick Feedback</Text>
          <View style={styles.tagsGrid}>
            {['On Time', 'Clean Vehicle', 'Professional', 'Good Value', 'Safe Driving', 'Helpful'].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  review.includes(tag) && styles.tagActive,
                ]}
                onPress={() => {
                  if (review.includes(tag)) {
                    setReview(review.replace(tag + ' ', '').replace(tag, ''));
                  } else {
                    setReview((prev) => (prev ? prev + ' ' + tag : tag));
                  }
                }}
              >
                <Text style={[
                  styles.tagText,
                  review.includes(tag) && styles.tagTextActive,
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </>
          )}
        </TouchableOpacity>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  content: { flex: 1, padding: 16 },

  // Booking Card
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookingInfo: { flex: 1 },
  bookingNumber: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  bookingVendor: { fontSize: 14, color: '#64748B', marginTop: 2 },

  // Rating Section
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  ratingSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  starsRow: { flexDirection: 'row', alignItems: 'center' },
  ratingLabel: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: GREEN,
  },

  // Sub Rating
  subRatingSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  subRatingTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },

  // Review
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Tags
  tagsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagsTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagActive: {
    backgroundColor: 'rgba(9, 179, 104, 0.1)',
    borderColor: GREEN,
  },
  tagText: { fontSize: 13, color: '#64748B' },
  tagTextActive: { color: GREEN, fontWeight: '600' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
