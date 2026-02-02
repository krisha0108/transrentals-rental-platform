import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import chatService from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GREEN = '#09B368';
const BG = '#F5F5F7';

export default function BookingChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, bookingNumber, vendorName } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const flatListRef = useRef(null);

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
      <View
        style={[
          styles.messageBubble,
          isCustomer ? styles.customerMessage : styles.vendorMessage,
        ]}
      >
        <Text style={isCustomer ? styles.customerText : styles.vendorText}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{vendor?.name || vendorName || 'Vendor'}</Text>
          <Text style={styles.headerSubtitle}>Booking #{bookingNumber || bookingId.slice(-8)}</Text>
        </View>
        <TouchableOpacity style={styles.phoneBtn}>
          <Ionicons name="call-outline" size={22} color={GREEN} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        ) : (
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
        )}

        {/* Floating Scroll Down Button */}
        {showScrollButton && (
          <TouchableOpacity
            style={styles.scrollDownButton}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
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
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  phoneBtn: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  customerMessage: {
    alignSelf: 'flex-end',
    backgroundColor: GREEN,
  },
  vendorMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customerText: { color: '#fff', fontSize: 14 },
  vendorText: { color: '#000', fontSize: 14 },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.5 },
  scrollDownButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
