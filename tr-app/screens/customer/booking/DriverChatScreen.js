import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import chatService from '../../services/chatService';
import moment from 'moment';
import { TEAL } from '../../../theme';

const POLL_INTERVAL = 3000;

export default function DriverChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, driverName = 'Driver', bookingId: paramBookingId, bookingNumber: paramBookingNumber, bookingType } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSince, setLastSince] = useState(null);
  const [bookingId, setBookingId] = useState(paramBookingId || null);
  const [bookingNumber, setBookingNumber] = useState(paramBookingNumber || null);

  const listRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async (since = null) => {
    try {
      const data = await chatService.getDriverMessages(conversationId, since);
      if (data?.messages) {
        const newMsgs = data.messages;
        if (since) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = newMsgs.filter(m => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        } else {
          setMessages(newMsgs);
          // Populate booking info from API response if not already set via params
          if (data.conversation?.bookingNumber) setBookingNumber(data.conversation.bookingNumber);
          if (data.conversation?.bookingId && !paramBookingId) setBookingId(data.conversation.bookingId);
        }
        if (newMsgs.length > 0) setLastSince(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch (e) {
      console.log('Driver fetch messages error:', e);
    }
    setLoading(false);
  }, [conversationId, paramBookingId]);

  useEffect(() => {
    fetchMessages(null);
    pollRef.current = setInterval(() => {
      setLastSince(prev => { fetchMessages(prev); return prev; });
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleViewBooking = () => {
    if (!bookingId) return;
    // driver chats are always linked to car/chauffeur bookings — BookingDetailScreen uses 'car' key
    const resolvedType = (bookingType === 'chauffeur' || !bookingType) ? 'car' : bookingType;
    navigation.navigate('BookingDetail', { bookingId, bookingType: resolvedType });
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    Keyboard.dismiss();
    try {
      const data = await chatService.sendDriverMessage(conversationId, content);
      if (data?.message) {
        setMessages(prev => [...prev, data.message]);
        setLastSince(data.message.createdAt);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.log('Send driver message error:', e);
      setText(content);
    }
    setSending(false);
  };

  const renderMessage = ({ item, index }) => {
    const isCustomer = item.senderType === 'customer';
    const time = moment(item.createdAt).format('h:mm A');
    const showDate = index === 0 || moment(item.createdAt).format('YYYY-MM-DD') !== moment(messages[index - 1].createdAt).format('YYYY-MM-DD');

    return (
      <View>
        {showDate && (
          <View style={styles.dateSep}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{moment(item.createdAt).format('MMM D, YYYY')}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <View style={[styles.bubbleRow, isCustomer ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          {!isCustomer && (
            <View style={styles.avatarSmall}>
              <Ionicons name="car" size={12} color="#16A34A" />
            </View>
          )}
          <View style={[styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleDriver]}>
            <Text style={[styles.bubbleText, isCustomer ? styles.bubbleTextCustomer : styles.bubbleTextDriver]}>{item.content}</Text>
            <Text style={[styles.bubbleTime, isCustomer ? styles.bubbleTimeCustomer : styles.bubbleTimeDriver]}>{time}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Ionicons name="car" size={16} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{driverName}</Text>
              {bookingNumber ? (
                <Text style={styles.headerSub}>Booking #{bookingNumber}</Text>
              ) : null}
            </View>
          </View>
          {bookingId ? (
            <TouchableOpacity onPress={handleViewBooking} style={styles.viewBookingBtn}>
              <Ionicons name="document-text-outline" size={15} color="#fff" />
              <Text style={styles.viewBookingText}>View</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={TEAL} /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySub}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0D7377', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  headerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 1 },
  viewBookingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  viewBookingText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  list: { padding: 14, gap: 4 },
  dateSep: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#E2EAF4' },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  avatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 6, marginBottom: 2 },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleDriver: { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 1 },
  bubbleCustomer: { backgroundColor: '#0D7377', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextDriver: { color: '#0F172A' },
  bubbleTextCustomer: { color: '#fff' },
  bubbleTime: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  bubbleTimeDriver: { color: '#94A3B8' },
  bubbleTimeCustomer: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2EAF4' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: '#F8FAFC', borderRadius: 21, borderWidth: 1, borderColor: '#E2EAF4', paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#0F172A', lineHeight: 20 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0D7377', justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: '#CBD5E1' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});
