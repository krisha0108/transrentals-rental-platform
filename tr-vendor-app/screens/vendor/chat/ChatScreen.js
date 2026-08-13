import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getChatMessages, sendChatMessage } from '../../api/client';
// KeyboardAvoidingView comes from react-native-keyboard-controller, NOT from
// react-native. RN's Android implementation reads the keyboard frame from the
// JS `Keyboard` events and compares it against its own measured frame, which
// double-counts the shift the window already made under `adjustResize` — the
// composer ended up pushed below the visible area, hidden behind the keyboard.
//
// The controller version measures how much of *this view* the keyboard
// actually covers (`frame.bottom - keyboardTop`, clamped at 0), so it adds
// padding only for the real overlap. That is correct whether or not the window
// resized — which matters on targetSdk 36, where Android enforces edge-to-edge
// and stops honouring `adjustResize` altogether.
//
// KeyboardProvider is already mounted at the root in App.js.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#3B82F6',  blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626',   redL: '#FEF2F2',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  orange: '#EA580C', orangeL: '#FFF7ED',
};

const SERVICE_MAP = {
  bike:        { label: 'Bike Rental',  color: C.orange, bg: C.orangeL, icon: 'motorbike' },
  car:         { label: 'Self Drive',   color: C.blue,   bg: C.blueL,   icon: 'car' },
  'self-drive':{ label: 'Self Drive',   color: C.blue,   bg: C.blueL,   icon: 'car' },
  bus:         { label: 'Bus Rental',   color: C.amber,  bg: C.amberL,  icon: 'bus' },
  truck:       { label: 'Truck Rental', color: C.purple, bg: C.purpleL, icon: 'truck-delivery' },
  luxury:      { label: 'Luxury Car',   color: '#8B5CF6', bg: '#EDE9FE', icon: 'car-sports' },
  chauffeur:   { label: 'Car Rental',   color: C.g700,   bg: C.g50,     icon: 'car-side' },
  packers:     { label: 'Packers',      color: C.orange, bg: C.orangeL, icon: 'package-variant' },
  equipment:   { label: 'Equipment',    color: C.red,    bg: C.redL,    icon: 'crane' },
};

const BOOKING_DETAIL_SCREEN_MAP = {
  bike:        'BikeBookingDetail',
  car:         'CarRentalBookingDetail',
  chauffeur:   'CarRentalBookingDetail',
  'self-drive':'SelfDriveBookingDetail',
  bus:         'BusBookingDetail',
  truck:       'TruckBookingDetail',
  luxury:      'LuxuryBookingDetail',
  packers:     'PackersBookingDetail',
  equipment:   'EquipmentBookingDetail',
};

const SERVICE_ICONS = {
  bike: 'motorbike', car: 'car', 'self-drive': 'car',
  bus: 'bus', truck: 'truck-delivery', luxury: 'car-sports',
  chauffeur: 'car-side', packers: 'package-variant', equipment: 'crane',
};

const SERVICE_SHORT = {
  bike: 'Bike', car: 'Self Drive', 'self-drive': 'Self Drive',
  bus: 'Bus', truck: 'Truck', luxury: 'Luxury',
  chauffeur: 'Car', packers: 'Packers', equipment: 'Equip.',
};

export default function ChatScreen({ route, navigation }) {
  const {
    bookingId: initialBookingId,
    customerName: customerNameParam,
    bookingNumber: initialBookingNumber,
    serviceType: initialServiceType,
    customerAvatar: customerAvatarParam,
    customerBookings,  // array of all bookings for this customer
  } = route.params || {};

  // Header metadata. When this screen is opened from ChatListScreen, route
  // params carry everything we need. When it's opened via a notification
  // deep-link, only bookingId arrives — these states are then backfilled
  // from the /api/vendor/chat/[bookingId] response (customer + booking).
  const [customerName, setCustomerName]     = useState(customerNameParam || null);
  const [customerAvatar, setCustomerAvatar] = useState(customerAvatarParam || null);
  const [bookingNumber, setBookingNumber]   = useState(initialBookingNumber || null);
  const [bookingType, setBookingType]       = useState(initialServiceType || null);

  const allBookings = customerBookings && customerBookings.length > 0
    ? customerBookings
    : [{ bookingId: initialBookingId, bookingNumber, bookingType }];

  const [activeBookingId, setActiveBookingId] = useState(initialBookingId);
  const activeBooking = allBookings.find((b) => b.bookingId === activeBookingId) || allBookings[0];
  const activeServiceType = activeBooking?.bookingType || bookingType;

  const svc = SERVICE_MAP[activeServiceType] || { label: activeServiceType || 'Booking', color: C.g700, bg: C.g50, icon: 'car' };
  const customerInitial = (customerName || 'C').charAt(0).toUpperCase();
  const insets = useSafeAreaInsets();

  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const pollingRef = useRef(null);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  const handleViewBooking = () => {
    if (!activeBookingId || !activeServiceType) return;
    const screen = BOOKING_DETAIL_SCREEN_MAP[activeServiceType];
    if (screen) navigation.navigate(screen, { bookingId: activeBookingId, serviceType: activeServiceType });
  };

  const fetchMessages = useCallback(async () => {
    if (!activeBookingId) return;
    try {
      const response = await getChatMessages(activeBookingId);
      setMessages(response?.messages || []);
      // Backfill header meta from API when route.params were sparse (e.g.,
      // notification deep-link with only bookingId). Don't overwrite values
      // that ChatListScreen explicitly passed — those are richer.
      if (response?.customer?.name) setCustomerName((cur) => cur || response.customer.name);
      if (response?.customer?.image) setCustomerAvatar((cur) => cur || response.customer.image);
      if (response?.booking?.bookingNumber) setBookingNumber((cur) => cur || response.booking.bookingNumber);
      if (response?.booking?.bookingType) setBookingType((cur) => cur || response.booking.bookingType);
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [activeBookingId]);

  // Reset and reload when active booking changes
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchMessages, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      senderType: 'vendor',
      createdAt: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    try {
      await sendChatMessage(activeBookingId, messageText);
      await fetchMessages();
    } catch (error) {
      console.log('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

  // Booking switcher — tabs for ≤3, dropdown for >3
  const renderBookingSwitcher = () => {
    if (allBookings.length <= 1) return null;
    const useDropdown = allBookings.length > 3;
    const activeLabel = (() => {
      const b = activeBooking;
      const typeLabel = SERVICE_SHORT[(b?.bookingType || '').toLowerCase()] || (b?.bookingType || 'Booking');
      return `${typeLabel} · #${(b?.bookingNumber || b?.bookingId || '').slice(-6)}`;
    })();

    if (useDropdown) {
      const activeSvc = SERVICE_MAP[activeServiceType?.toLowerCase()] || { color: C.g700, bg: C.g50, icon: 'car-side' };
      return (
        <View style={st.switcherWrap}>
          {/* Trigger button */}
          <TouchableOpacity style={st.dropdownBtn} onPress={() => setShowDropdown(true)} activeOpacity={0.8}>
            <View style={[st.dropdownBtnIcon, { backgroundColor: activeSvc.bg }]}>
              <MaterialCommunityIcons name={activeSvc.icon || 'car-side'} size={13} color={activeSvc.color} />
            </View>
            <View style={st.dropdownBtnMid}>
              <Text style={st.dropdownBtnLabel} numberOfLines={1}>
                {SERVICE_SHORT[activeServiceType?.toLowerCase()] || activeServiceType || 'Booking'}
              </Text>
              <Text style={st.dropdownBtnNum} numberOfLines={1}>
                #{activeBooking?.bookingNumber || activeBookingId?.slice(-8)}
              </Text>
            </View>
            <View style={st.dropdownBtnRight}>
              <Text style={st.dropdownBtnCount}>{allBookings.length} bookings</Text>
              <MaterialCommunityIcons name="chevron-down" size={15} color={C.g700} />
            </View>
          </TouchableOpacity>

          {/* Bottom sheet */}
          <Modal visible={showDropdown} transparent animationType="slide" onRequestClose={() => setShowDropdown(false)}>
            <TouchableOpacity style={st.bsOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
              <TouchableOpacity activeOpacity={1} style={st.bsSheet} onPress={() => {}}>
                {/* Handle */}
                <View style={st.bsHandle} />
                {/* Title row */}
                <View style={st.bsTitleRow}>
                  <View>
                    <Text style={st.bsTitle}>Switch Booking</Text>
                    <Text style={st.bsSub}>{customerName} · {allBookings.length} bookings</Text>
                  </View>
                  <TouchableOpacity style={st.bsClose} onPress={() => setShowDropdown(false)}>
                    <MaterialCommunityIcons name="close" size={18} color={C.sub} />
                  </TouchableOpacity>
                </View>
                {/* Booking list */}
                <ScrollView style={st.bsScroll} showsVerticalScrollIndicator={false}>
                  {allBookings.map((b, idx) => {
                    const isActive = b.bookingId === activeBookingId;
                    const bType = (b.bookingType || '').toLowerCase();
                    const svcInfo = SERVICE_MAP[bType] || { label: b.bookingType || 'Booking', color: C.muted, bg: C.bg, icon: 'car-side' };
                    const iconName = SERVICE_ICONS[bType] || 'car-side';
                    return (
                      <TouchableOpacity
                        key={b.bookingId}
                        style={[st.bsItem, isActive && st.bsItemActive, idx < allBookings.length - 1 && st.bsItemBorder]}
                        onPress={() => { setActiveBookingId(b.bookingId); setShowDropdown(false); }}
                        activeOpacity={0.72}
                      >
                        {/* Icon */}
                        <View style={[st.bsItemIcon, { backgroundColor: isActive ? svcInfo.color + '20' : svcInfo.bg }]}>
                          <MaterialCommunityIcons name={iconName} size={20} color={svcInfo.color} />
                        </View>
                        {/* Info */}
                        <View style={st.bsItemInfo}>
                          <Text style={[st.bsItemType, isActive && { color: C.g700 }]}>{svcInfo.label}</Text>
                          <Text style={st.bsItemNum}>#{b.bookingNumber || b.bookingId?.slice(-10)}</Text>
                        </View>
                        {/* Badge + check */}
                        {(b.unreadCount > 0) && (
                          <View style={st.bsUnreadBadge}>
                            <Text style={st.bsUnreadTxt}>{b.unreadCount}</Text>
                          </View>
                        )}
                        {isActive
                          ? <MaterialCommunityIcons name="check-circle" size={22} color={C.g600} />
                          : <MaterialCommunityIcons name="chevron-right" size={20} color={C.border} />
                        }
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
      );
    }

    // ≤3 bookings — tab row
    return (
      <View style={st.switcherWrap}>
        <View style={st.tabRow}>
          {allBookings.map((b) => {
            const isActive = b.bookingId === activeBookingId;
            const typeLabel = SERVICE_SHORT[(b.bookingType || '').toLowerCase()] || (b.bookingType || 'Booking');
            return (
              <TouchableOpacity
                key={b.bookingId}
                style={[st.switcherTab, isActive && st.switcherTabActive]}
                onPress={() => { if (!isActive) setActiveBookingId(b.bookingId); }}
                activeOpacity={0.75}
              >
                <Text style={[st.switcherTabType, isActive && st.switcherTabTypeActive]}>{typeLabel}</Text>
                <Text style={[st.switcherTabNum, isActive && st.switcherTabNumActive]} numberOfLines={1}>
                  #{(b.bookingNumber || b.bookingId || '').slice(-6)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderMessage = ({ item, index }) => {
    const isVendor = item.senderType === 'vendor';
    const showDateHeader =
      index === 0 || formatDate(item.createdAt) !== formatDate(messages[index - 1]?.createdAt);

    return (
      <View>
        {showDateHeader && (
          <View style={st.dateHeaderRow}>
            <View style={st.datePill}>
              <Text style={st.datePillTxt}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )}

        <View style={[st.msgRow, isVendor ? st.msgRowRight : st.msgRowLeft]}>
          {/* Customer avatar on left */}
          {!isVendor && (
            customerAvatar ? (
              <Image source={{ uri: customerAvatar }} style={st.msgAvatarImg} />
            ) : (
              <View style={[st.msgAvatar, { backgroundColor: svc.color }]}>
                <Text style={st.msgAvatarTxt}>{customerInitial}</Text>
              </View>
            )
          )}

          {/* Bubble */}
          {isVendor ? (
            <LinearGradient
              colors={[C.g700, C.g600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[st.bubble, st.bubbleVendor]}
            >
              <Text style={st.bubbleTxtVendor}>{item.message}</Text>
              <View style={st.bubbleFooter}>
                <Text style={st.timeTxtVendor}>{formatTime(item.createdAt)}</Text>
                {item.sending
                  ? <MaterialCommunityIcons name="clock-outline" size={10} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
                  : <MaterialCommunityIcons name="check-all" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                }
              </View>
            </LinearGradient>
          ) : (
            <View style={[st.bubble, st.bubbleCustomer]}>
              <Text style={st.bubbleTxtCustomer}>{item.message}</Text>
              <View style={st.bubbleFooter}>
                <Text style={st.timeTxtCustomer}>{formatTime(item.createdAt)}</Text>
              </View>
            </View>
          )}

          {/* Vendor avatar on right */}
          {isVendor && (
            <LinearGradient
              colors={[C.g700, C.g500]}
              style={st.msgAvatar}
            >
              <MaterialCommunityIcons name="store-check" size={15} color="#fff" />
            </LinearGradient>
          )}
        </View>
      </View>
    );
  };

  const Header = () => (
    <LinearGradient colors={[C.g900, C.g800]} style={[st.header, { paddingTop: insets.top + 10 }]}>
      {/* Back */}
      <TouchableOpacity style={st.headerBack} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Customer avatar */}
      {customerAvatar ? (
        <Image source={{ uri: customerAvatar }} style={st.headerAvatarImg} />
      ) : (
        <View style={[st.headerAvatar, { backgroundColor: svc.color }]}>
          <Text style={st.headerAvatarTxt}>{customerInitial}</Text>
        </View>
      )}

      {/* Info */}
      <View style={st.headerInfo}>
        <Text style={st.headerName} numberOfLines={1}>{customerName || 'Customer'}</Text>
        <View style={st.headerMeta}>
          <View style={[st.svcChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MaterialCommunityIcons name={svc.icon} size={10} color="#fff" style={{ marginRight: 3 }} />
            <Text style={st.svcChipTxt}>{svc.label}</Text>
          </View>
          <Text style={st.headerBkNum}>#{activeBooking?.bookingNumber || bookingNumber || ''}</Text>
        </View>
      </View>

      {/* View Booking */}
      <TouchableOpacity style={st.headerAction} onPress={handleViewBooking}>
        <MaterialCommunityIcons name="calendar-text-outline" size={20} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={st.root}>
        <Header />
        {renderBookingSwitcher()}
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={C.g600} />
          <Text style={st.loaderTxt}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <Header />
      {renderBookingSwitcher()}

      {/* No keyboardVerticalOffset: this view is measured where it actually
          sits on screen (below Header + booking switcher), so that height is
          already accounted for. */}
      <KeyboardAvoidingView style={st.flex} behavior="padding">
        {/* Chat background tinted area */}
        <View style={st.chatBg}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id?.toString()}
            contentContainerStyle={st.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={() => (
              <View style={st.emptyWrap}>
                <View style={st.emptyIconBox}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={36} color={C.g600} />
                </View>
                <Text style={st.emptyTitle}>No messages yet</Text>
                <Text style={st.emptySub}>Start the conversation below</Text>
              </View>
            )}
          />
        </View>

        {/* Input Area */}
        <View style={[st.inputArea, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
          <View style={st.inputBox}>
            <TextInput
              style={st.input}
              placeholder="Type a message..."
              placeholderTextColor={C.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.85}
          >
            {inputText.trim() ? (
              <LinearGradient
                colors={[C.g700, C.g500]}
                style={st.sendBtn}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <MaterialCommunityIcons name="send" size={18} color="#fff" />
                }
              </LinearGradient>
            ) : (
              <View style={[st.sendBtn, st.sendBtnOff]}>
                <MaterialCommunityIcons name="send" size={18} color={C.muted} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  flex: { flex: 1 },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerAvatarImg: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerAvatarTxt: {
    fontSize: 18, fontWeight: '800', color: '#fff',
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 16, fontWeight: '700', color: '#fff',
  },
  headerMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3,
  },
  svcChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
  },
  svcChipTxt: {
    fontSize: 10, fontWeight: '600', color: '#fff',
  },
  headerBkNum: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500',
  },
  headerAction: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* ── Booking Switcher ── */
  switcherWrap: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  // ≤3: tab row
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  switcherTab: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
    alignItems: 'center',
  },
  switcherTabActive: {
    backgroundColor: C.g50,
    borderColor: C.g500,
  },
  switcherTabType: { fontSize: 11, fontWeight: '700', color: C.muted },
  switcherTabTypeActive: { color: C.g700 },
  switcherTabNum: { fontSize: 10, color: C.muted, marginTop: 1 },
  switcherTabNumActive: { color: C.g600, fontWeight: '600' },

  // >3: dropdown trigger button
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.g50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.g100,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dropdownBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBtnMid: { flex: 1 },
  dropdownBtnLabel: { fontSize: 13, fontWeight: '700', color: C.g800 },
  dropdownBtnNum: { fontSize: 11, color: C.g600, marginTop: 1 },
  dropdownBtnRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dropdownBtnCount: { fontSize: 11, color: C.muted, fontWeight: '500' },

  // Bottom sheet
  bsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,44,34,0.45)',
    justifyContent: 'flex-end',
  },
  bsSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  bsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  bsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  bsTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  bsSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  bsClose: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  bsScroll: { maxHeight: 400 },
  bsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bsItemActive: { backgroundColor: C.g50 },
  bsItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  bsItemIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  bsItemInfo: { flex: 1 },
  bsItemType: { fontSize: 15, fontWeight: '700', color: C.text },
  bsItemNum: { fontSize: 12, color: C.muted, marginTop: 2 },
  bsUnreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: C.red,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  bsUnreadTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  /* ── Loader ── */
  loaderWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loaderTxt: {
    fontSize: 14, color: C.muted,
  },

  /* ── Chat background ── */
  chatBg: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
  msgList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 80,
    flexGrow: 1,
  },

  /* ── Date header ── */
  dateHeaderRow: {
    alignItems: 'center',
    marginVertical: 14,
  },
  datePill: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  datePillTxt: {
    fontSize: 11, fontWeight: '600', color: C.sub,
  },

  /* ── Message row ── */
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarImg: {
    width: 30, height: 30, borderRadius: 15,
    flexShrink: 0,
  },
  msgAvatarTxt: {
    fontSize: 13, fontWeight: '800', color: '#fff',
  },

  /* ── Bubbles ── */
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleVendor: {
    borderBottomRightRadius: 4,
    shadowColor: C.g700,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleCustomer: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleTxtVendor: {
    fontSize: 14, color: '#fff', lineHeight: 21,
  },
  bubbleTxtCustomer: {
    fontSize: 14, color: C.text, lineHeight: 21,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  timeTxtVendor: {
    fontSize: 9, color: 'rgba(255,255,255,0.7)',
  },
  timeTxtCustomer: {
    fontSize: 9, color: C.muted,
  },

  /* ── Empty state ── */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    gap: 10,
  },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g100,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: C.text,
  },
  emptySub: {
    fontSize: 13, color: C.muted,
  },

  /* ── Input area ── */
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 44,
    maxHeight: 110,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 110,
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: {
    backgroundColor: '#E2E8F0',
  },
});
