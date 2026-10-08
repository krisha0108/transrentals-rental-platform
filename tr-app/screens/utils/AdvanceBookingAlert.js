import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Modal from '../../components/SafeModal';
import Icon from 'react-native-vector-icons/Feather';
import { getEarliestPickupLabel, MIN_ADVANCE_HOURS } from './dateValidation';

const { width } = Dimensions.get('window');

const BookingAlertModal = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const earliest = getEarliestPickupLabel();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={styles.iconCircle}>
            <Icon name="clock" size={28} color="#fff" />
          </View>

          <Text style={styles.title}>Advance Booking Required</Text>

          <Text style={styles.message}>
            Bookings need to be made at least{' '}
            <Text style={styles.bold}>{MIN_ADVANCE_HOURS} hours</Text> in advance
            to ensure vehicle availability and driver assignment.
          </Text>

          <View style={styles.timeCard}>
            <Icon name="calendar" size={16} color="#2563EB" />
            <View style={styles.timeTextWrap}>
              <Text style={styles.timeLabel}>Earliest Available Pickup</Text>
              <Text style={styles.timeValue}>{earliest}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Got it, I'll select a later time</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  timeTextWrap: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default BookingAlertModal;
