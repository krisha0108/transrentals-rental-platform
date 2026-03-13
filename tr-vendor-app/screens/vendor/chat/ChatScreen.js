import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Keyboard,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getChatMessages, sendChatMessage } from '../../api/client';

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

export default function ChatScreen({ route, navigation }) {
  const { bookingId, customerName, bookingNumber, serviceType } = route.params || {};
  const svc = SERVICE_MAP[serviceType] || { label: serviceType || 'Booking', color: C.g700, bg: C.g50, icon: 'car' };
  const customerInitial = (customerName || 'C').charAt(0).toUpperCase();
  const insets = useSafeAreaInsets();

  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor(C.g900);
  }, []));

  const handleViewBooking = () => {
    if (!bookingId || !serviceType) return;
    const screen = BOOKING_DETAIL_SCREEN_MAP[serviceType];
    if (screen) navigation.navigate(screen, { bookingId, serviceType });
  };

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const response = await getChatMessages(bookingId);
      setMessages(response?.messages || []);
    } catch (error) {
      console.log('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
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
      await sendChatMessage(bookingId, messageText);
      await fetchMessages();
    } catch (error) {
      console.log('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setInputText(messageText);
    } finally {
      setSending(false);
    }
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
            <View style={[st.msgAvatar, { backgroundColor: svc.color }]}>
              <Text style={st.msgAvatarTxt}>{customerInitial}</Text>
            </View>
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
      <View style={[st.headerAvatar, { backgroundColor: svc.color }]}>
        <Text style={st.headerAvatarTxt}>{customerInitial}</Text>
      </View>

      {/* Info */}
      <View style={st.headerInfo}>
        <Text style={st.headerName} numberOfLines={1}>{customerName || 'Customer'}</Text>
        <View style={st.headerMeta}>
          <View style={[st.svcChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MaterialCommunityIcons name={svc.icon} size={10} color="#fff" style={{ marginRight: 3 }} />
            <Text style={st.svcChipTxt}>{svc.label}</Text>
          </View>
          <Text style={st.headerBkNum}>#{bookingNumber}</Text>
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

      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.top + 54) : 0}
      >
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
  },
  msgList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
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
