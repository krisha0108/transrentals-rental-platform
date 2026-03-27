import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import chatService from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../../theme';

const BG = '#F0FDF4';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  android: { elevation: 2 },
});

const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6 },
  android: { elevation: 5 },
});

export default function BookingChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, bookingNumber, vendorName, bookingType } = route.params || {};

  const BOOKING_DETAIL_SCREENS = {
    bus: 'BusBookingDetail',
    truck: 'TruckBookingDetail',
    equipment: 'EquipmentBookingDetail',
    packers: 'PackersBookingDetail',
    bike: 'BikeBookingDetail',
    car: 'BookingDetail',
    b2b: 'B2BBookingDetail',
  };

  const navigateToBookingDetail = () => {
    const screenName = BOOKING_DETAIL_SCREENS[bookingType];
    if (screenName) {
      const params = bookingType === 'car'
        ? { bookingId, bookingType: 'car' }
        : { bookingId };
      navigation.navigate(screenName, params);
    }
  };

  const [messages, setMessages] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef(null);

  // ── StatusBar management ──────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP, true);
      }
      return () => {
        StatusBar.setBarStyle('dark-content', true);
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#0A6B3F', true);
        }
      };
    }, [])
  );

  useEffect(() => {
    loadCustomerData();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [bookingId]);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const customer = JSON.parse(data);
        setCustomerName(customer.name || 'Customer');
      }
    } catch (error) {
      console.log('Error loading customer data:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatService.getBookingChat(bookingId);
      if (response.success) {
        setMessages(response.messages || []);
        setVendor(response.vendor);
      }
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const response = await chatService.sendBookingMessage(
        bookingId,
        messageText.trim(),
        customerName
      );

      if (response.success) {
        setMessages([...messages, response]);
        setMessageText('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd();
          setShowScrollButton(false);
        }, 100);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isCustomer = item.sender_type === 'customer';
    return (
      <View style={[styles.messageBubbleOuter, isCustomer ? styles.customerOuter : styles.vendorOuter]}>
        {isCustomer ? (
          <View style={styles.customerBubble}>
            <Text style={styles.customerText}>{item.message}</Text>
            <Text style={styles.customerTime}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.vendorBubble}>
            <Text style={styles.vendorText}>{item.message}</Text>
            <Text style={styles.vendorTime}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={wp(5.5)} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {vendorName || 'Vendor'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Booking #{bookingNumber || bookingId?.slice(-8)}
            </Text>
          </View>
          {bookingType && (
            <TouchableOpacity onPress={navigateToBookingDetail} style={styles.phoneBtn}>
              <Ionicons name="document-text-outline" size={wp(5)} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID, '#047857']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={wp(5.5)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {vendor?.name || vendorName || 'Vendor'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Booking #{bookingNumber || bookingId.slice(-8)}
          </Text>
        </View>
        {bookingType && (
          <TouchableOpacity onPress={navigateToBookingDetail} style={styles.bookingViewBtn}>
            <Ionicons name="document-text-outline" size={wp(5)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* ── Messages ───────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* ── Floating Scroll Down Button ────────────────── */}
        {showScrollButton && (
          <TouchableOpacity
            style={styles.scrollDownButton}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              style={styles.scrollDownGradient}
            >
              <Ionicons name="arrow-down" size={wp(5.5)} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Input ──────────────────────────────────────── */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={TEXT_MUTED}
              value={messageText}
              onChangeText={setMessageText}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[TEAL_MID, TEAL]}
              style={styles.sendBtnGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={wp(4.5)} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    borderBottomLeftRadius: wp(6),
    borderBottomRightRadius: wp(6),
    overflow: 'hidden',
  },
  backBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerInfo: {
    flex: 1,
    marginRight: wp(2),
  },
  headerTitle: {
    fontSize: wp(4.2),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: wp(3),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(0.3),
    fontWeight: '500',
  },
  bookingViewBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  phoneBtn: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Loading ─────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    fontSize: wp(3.5),
    color: TEXT_SECONDARY,
    marginTop: hp(1.5),
    fontWeight: '500',
  },

  // ── Messages List ───────────────────────────────────────
  messagesList: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },

  // ── Message Bubbles ─────────────────────────────────────
  messageBubbleOuter: {
    marginBottom: hp(1.2),
    maxWidth: '78%',
  },
  customerOuter: {
    alignSelf: 'flex-end',
  },
  vendorOuter: {
    alignSelf: 'flex-start',
  },
  customerBubble: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    borderRadius: wp(4.5),
    borderTopRightRadius: wp(1),
    backgroundColor: TEAL_MID,
    ...SHADOW_SM,
  },
  vendorBubble: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.2),
    borderRadius: wp(4.5),
    borderTopLeftRadius: wp(1),
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOW_SM,
  },
  customerText: {
    color: '#FFFFFF',
    fontSize: wp(3.6),
    lineHeight: wp(5.2),
    fontWeight: '400',
  },
  vendorText: {
    color: TEXT_PRIMARY,
    fontSize: wp(3.6),
    lineHeight: wp(5.2),
    fontWeight: '400',
  },
  customerTime: {
    fontSize: wp(2.6),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(0.5),
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  vendorTime: {
    fontSize: wp(2.6),
    color: TEXT_MUTED,
    marginTop: hp(0.5),
    alignSelf: 'flex-end',
    fontWeight: '500',
  },

  // ── Scroll Down Button ──────────────────────────────────
  scrollDownButton: {
    position: 'absolute',
    bottom: hp(9),
    right: wp(5),
    borderRadius: wp(5.5),
    overflow: 'hidden',
    ...SHADOW_MD,
  },
  scrollDownGradient: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Input Area ──────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.8),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#586273',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: '#586273',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: wp(4),
    paddingVertical: Platform.OS === 'ios' ? hp(2) : hp(1.8),
    maxHeight: hp(12),
    fontSize: wp(3.8),
    color: TEXT_PRIMARY,
    lineHeight: wp(5),
  },
  sendBtn: {
    marginLeft: wp(2.5),
    marginBottom: Platform.OS === 'ios' ? hp(0.2) : 0,
    borderRadius: wp(2.5),
    overflow: 'hidden',
  },
  sendBtnGradient: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
