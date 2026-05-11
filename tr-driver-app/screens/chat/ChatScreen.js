import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getDriverChatMessages, sendDriverChatMessage, getBookingById } from '../api/client';
import { useAuth } from '../../contexts/AuthContext';
import moment from 'moment';

const C = {
  primary: '#16A34A', dark: '#043927', bg: '#ECF0F1', card: '#FFFFFF',
  border: '#E2EAF4', text: '#0F172A', sub: '#64748B',
};

const POLL_INTERVAL = 3000;

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = moment(msg.createdAt).format('MMMM D, YYYY');
    if (d !== lastDate) {
      groups.push({ type: 'date', date: d, id: `date-${d}` });
      lastDate = d;
    }
    groups.push({ ...msg, type: 'message' });
  }
  return groups;
}

function DateSeparator({ date }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateLine} />
      <View style={styles.datePill}>
        <Text style={styles.datePillText}>{date}</Text>
      </View>
      <View style={styles.dateLine} />
    </View>
  );
}

function MessageBubble({ msg, isDriver, customerInitial }) {
  const time = moment(msg.createdAt).format('h:mm A');

  return (
    <View style={[styles.bubbleRow, isDriver ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!isDriver && (
        <View style={styles.customerAvatar}>
          <Text style={styles.customerAvatarText}>{customerInitial}</Text>
        </View>
      )}

      <View style={[styles.bubbleOuter, isDriver ? styles.bubbleOuterRight : styles.bubbleOuterLeft]}>
        <View style={[styles.bubble, isDriver ? styles.bubbleDriver : styles.bubbleCustomer]}>
          <Text style={[styles.bubbleText, isDriver && styles.bubbleTextDriver]}>{msg.content}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isDriver && styles.bubbleTimeDriver]}>{time}</Text>
            {isDriver && (
              <Ionicons
                name={msg.status === 'READ' ? 'checkmark-done' : 'checkmark'}
                size={13}
                color={msg.status === 'READ' ? '#86EFAC' : 'rgba(255,255,255,0.6)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation, route }) {
  const { conversationId, customerName = 'Customer', bookingId, bookingType = 'chauffeur', bookingNumber } = route.params || {};
  const { driver } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [lastSince, setLastSince] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(false);

  const listRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = useCallback(async (since = null) => {
    try {
      const res = await getDriverChatMessages(conversationId, since);
      if (res.data?.success) {
        const newMsgs = res.data.messages || [];
        if (since) {
          if (newMsgs.length > 0) {
            setMessages(prev => {
              const ids = new Set(prev.map(m => m.id));
              const fresh = newMsgs.filter(m => !ids.has(m.id));
              return fresh.length > 0 ? [...prev, ...fresh] : prev;
            });
          }
        } else {
          setMessages(newMsgs);
        }
        if (newMsgs.length > 0) setLastSince(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch {}
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages(null);
    pollRef.current = setInterval(() => {
      setLastSince(prev => { fetchMessages(prev); return prev; });
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleViewBooking = async () => {
    if (!bookingId || viewingBooking) return;
    try {
      setViewingBooking(true);
      const res = await getBookingById(bookingId, bookingType);
      if (res.data?.booking) navigation.navigate('BookingDetail', { booking: res.data.booking });
    } catch {}
    finally { setViewingBooking(false); }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    Keyboard.dismiss();
    try {
      const res = await sendDriverChatMessage(conversationId, trimmed);
      if (res.data?.success) {
        const newMsg = res.data.message;
        setMessages(prev => [...prev, newMsg]);
        setLastSince(newMsg.createdAt);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
    setSending(false);
  };

  const grouped = groupByDate(messages);
  const customerInitial = customerName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Gradient Header */}
        <LinearGradient colors={['#043927', '#065F46', '#16A34A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{customerInitial}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.headerName}>{customerName}</Text>
              {(bookingNumber || bookingId) && (
                <Text style={styles.headerSub}>{bookingNumber || bookingId.slice(-8).toUpperCase()}</Text>
              )}
            </View>
          </View>

          {bookingId && (
            <TouchableOpacity style={styles.viewBookingBtn} onPress={handleViewBooking} disabled={viewingBooking}>
              {viewingBooking
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="receipt-outline" size={13} color="#fff" />
                    <Text style={styles.viewBookingText}>Booking</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Chat background */}
        <View style={styles.chatBg}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={grouped}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item.type === 'date') return <DateSeparator date={item.date} />;
                const isDriver = item.senderType === 'driver';
                return <MessageBubble msg={item} isDriver={isDriver} customerInitial={customerInitial} />;
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBg}>
                    <Ionicons name="chatbubble-outline" size={36} color={C.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptySub}>Start the conversation!</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={17} color="#fff" style={{ marginLeft: 2 }} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  headerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#86EFAC' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },
  viewBookingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  viewBookingText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  chatBg: { flex: 1, backgroundColor: '#E8EDD5' },

  msgList: { paddingHorizontal: 12, paddingVertical: 14, gap: 2 },

  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  datePill: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  datePillText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },

  customerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center',
    marginRight: 6, marginBottom: 2, flexShrink: 0,
  },
  customerAvatarText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  bubbleOuter: { maxWidth: '78%' },
  bubbleOuterLeft: { alignItems: 'flex-start' },
  bubbleOuterRight: { alignItems: 'flex-end' },

  bubble: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleCustomer: {
    backgroundColor: '#fff', borderTopLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  bubbleDriver: {
    backgroundColor: '#16A34A', borderTopRightRadius: 4,
    shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  bubbleText: { fontSize: 14, lineHeight: 21, color: C.text },
  bubbleTextDriver: { color: '#fff' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 2 },
  bubbleTime: { fontSize: 10, fontWeight: '500', color: '#94A3B8' },
  bubbleTimeDriver: { color: 'rgba(255,255,255,0.65)' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.border,
  },
  inputWrap: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 24,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 8, minHeight: 44,
  },
  input: { fontSize: 14, color: C.text, lineHeight: 20, maxHeight: 120, padding: 0 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },

  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptySub: { fontSize: 13, color: '#94A3B8' },
});
