import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const SERVICE_SHORT = {
  bus: 'Bus',
  truck: 'Truck',
  equipment: 'Equip.',
  packers: 'Packers',
  bike: 'Bike',
  car: 'Car',
  b2b: 'B2B',
};

const BOOKING_DETAIL_SCREENS = {
  bus: 'BusBookingDetail',
  truck: 'TruckBookingDetail',
  equipment: 'EquipmentBookingDetail',
  packers: 'PackersBookingDetail',
  bike: 'BikeBookingDetail',
  car: 'BookingDetail',
  chauffeur: 'BookingDetail',
  luxury: 'BookingDetail',
  b2b: 'B2BBookingDetail',
};

export default function BookingChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const {
    bookingId: initialBookingId,
    bookingNumber: initialBookingNumber,
    vendorName,
    bookingType: initialBookingType,
    vendorBookings,  // array of all bookings for this vendor (from ChatListScreen)
  } = route.params || {};

  // Active booking state — default to whichever was tapped
  const [activeBookingId, setActiveBookingId] = useState(initialBookingId);
  const [activeBookingType, setActiveBookingType] = useState(initialBookingType);

  // Derive active booking info
  const allBookings = vendorBookings && vendorBookings.length > 0 ? vendorBookings : [
    { id: initialBookingId, bookingNumber: initialBookingNumber, type: initialBookingType },
  ];
  const activeBooking = allBookings.find((b) => b.id === activeBookingId) || allBookings[0];

  const [messages, setMessages] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef(null);
  const pollingRef = useRef(null);

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

  // Reload messages when active booking changes
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    loadCustomerData();
    fetchMessages();

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeBookingId]);

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('customer');
      if (data) {
        const customer = JSON.parse(data);
        setCustomerName(customer.name || 'Customer');
      }
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const convId = activeBooking?.conversationId;
      if (!convId) {
        // Fallback to old booking-chat endpoint if no conversationId
        const response = await chatService.getBookingChat(activeBookingId);
        if (response.success) {
          setMessages(response.messages || []);
          setVendor(response.vendor);
        }
        setLoading(false);
        return;
      }
      const response = await chatService.getMessages(convId);
      if (response.success) {
        setMessages(response.messages || []);
        setVendor(response.conversation?.vendor || null);
      }
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchBooking = (booking) => {
    if (booking.id === activeBookingId) return;
    setActiveBookingId(booking.id);
    setActiveBookingType(booking.rawType || booking.type);
  };

  const navigateToBookingDetail = () => {
    const type = (activeBookingType || activeBooking?.rawType || activeBooking?.type || '').toLowerCase();
    const screenName = BOOKING_DETAIL_SCREENS[type];
    if (screenName) {
      const needsCarParam = ['car', 'chauffeur', 'luxury'].includes(type);
      const params = needsCarParam
        ? { bookingId: activeBookingId, bookingType: 'car' }
        : { bookingId: activeBookingId };
      navigation.navigate(screenName, params);
    }
  };

  // Build messages list with date separators injected
  const messagesWithDates = useMemo(() => {
    const result = [];
    let lastDateStr = null;
    messages.forEach((msg) => {
      const d = new Date(msg.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let label;
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      }

      if (label !== lastDateStr) {
        result.push({ __type: 'date', label, key: `date-${label}` });
        lastDateStr = label;
      }
      result.push({ ...msg, __type: 'message' });
    });
    return result;
  }, [messages]);

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
      const convId = activeBooking?.conversationId;
      let newMsg = null;

      if (convId) {
        const response = await chatService.sendMessage(convId, messageText.trim());
        if (response.success) newMsg = response.message;
      } else {
        // Fallback: old booking-chat endpoint
        const response = await chatService.sendBookingMessage(
          activeBookingId,
          messageText.trim(),
          customerName
        );
        if (response.success) newMsg = response;
      }

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
        setMessageText('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd();
          setShowScrollButton(false);
        }, 100);
      }
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Booking Switcher ────────────────────────────────────────
  const renderBookingSwitcher = () => {
    if (allBookings.length <= 1) return null;

    return (
      <View style={styles.switcherContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.switcherScroll}
        >
          {allBookings.map((b) => {
            const isActive = b.id === activeBookingId;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.switcherTab, isActive && styles.switcherTabActive]}
                onPress={() => switchBooking(b)}
                activeOpacity={0.75}
              >
                <Text style={[styles.switcherTabLabel, isActive && styles.switcherTabLabelActive]}>
                  {SERVICE_SHORT[b.type] || b.type?.toUpperCase() || 'Booking'}
                </Text>
                <Text
                  style={[styles.switcherTabNum, isActive && styles.switcherTabNumActive]}
                  numberOfLines={1}
                >
                  #{b.bookingNumber?.slice(-6) || b.id?.slice(-6)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.__type === 'date') {
      return (
        <View style={styles.dateSeparatorRow}>
          <View style={styles.dateSeparatorLine} />
          <Text style={styles.dateSeparatorLabel}>{item.label}</Text>
          <View style={styles.dateSeparatorLine} />
        </View>
      );
    }
    const isCustomer = item.sender_type === 'customer';
    return (
      <View style={[styles.messageBubbleOuter, isCustomer ? styles.customerOuter : styles.vendorOuter]}>
        {isCustomer ? (
          <View style={styles.customerBubble}>
            <Text style={styles.customerText}>{item.message}</Text>
            <Text style={styles.customerTime}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ) : (
          <View style={styles.vendorBubble}>
            <Text style={styles.vendorText}>{item.message}</Text>
            <Text style={styles.vendorTime}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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
              {vendor?.name || vendorName || 'Vendor'}
            </Text>
            <Text style={styles.headerSubtitle}>
              #{activeBooking?.bookingNumber || activeBookingId?.slice(-8)}
            </Text>
          </View>
          <TouchableOpacity onPress={navigateToBookingDetail} style={styles.phoneBtn}>
            <Ionicons name="document-text-outline" size={wp(5)} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
        {renderBookingSwitcher()}
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
            #{activeBooking?.bookingNumber || activeBookingId?.slice(-8)}
          </Text>
        </View>
        <TouchableOpacity onPress={navigateToBookingDetail} style={styles.bookingViewBtn}>
          <Ionicons name="document-text-outline" size={wp(5)} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Booking Switcher ────────────────────────────────── */}
      {renderBookingSwitcher()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* ── Messages ───────────────────────────────────── */}
        {messages.length === 0 ? (
          <View style={styles.emptyMsgs}>
            <MaterialCommunityIcons name="chat-outline" size={wp(12)} color={TEAL_LIGHT} />
            <Text style={styles.emptyMsgsText}>No messages yet. Say hello!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messagesWithDates}
            keyExtractor={(item, index) => item.key || item.id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )}

        {/* ── Floating Scroll Down Button ────────────────── */}
        {showScrollButton && (
          <TouchableOpacity
            style={styles.scrollDownButton}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[TEAL_MID, TEAL]} style={styles.scrollDownGradient}>
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
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
            <LinearGradient colors={[TEAL_MID, TEAL]} style={styles.sendBtnGradient}>
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

  // ── Booking Switcher ────────────────────────────────────
  switcherContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  switcherScroll: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.9),
    gap: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  switcherTab: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.7),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    minWidth: wp(20),
  },
  switcherTabActive: {
    backgroundColor: TEAL_LIGHT,
    borderColor: TEAL,
  },
  switcherTabLabel: {
    fontSize: wp(2.7),
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  switcherTabLabelActive: {
    color: TEAL_DEEP,
  },
  switcherTabNum: {
    fontSize: wp(2.5),
    color: TEXT_MUTED,
    marginTop: hp(0.1),
  },
  switcherTabNumActive: {
    color: TEAL,
    fontWeight: '600',
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

  // ── Empty Messages ──────────────────────────────────────
  emptyMsgs: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(1.5),
  },
  emptyMsgsText: {
    fontSize: wp(3.5),
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  // ── Messages List ───────────────────────────────────────
  messagesList: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },

  // ── Date Separator ──────────────────────────────────────
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(1.5),
    paddingHorizontal: wp(2),
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateSeparatorLabel: {
    fontSize: wp(2.8),
    color: TEXT_MUTED,
    fontWeight: '600',
    paddingHorizontal: wp(3),
    backgroundColor: BG,
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
