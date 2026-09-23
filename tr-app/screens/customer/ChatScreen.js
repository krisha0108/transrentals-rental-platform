// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Pusher } from '@pusher/pusher-websocket-react-native';

// const pusher = Pusher.getInstance();

// export default function ChatScreen({ route }) {
//   const { bookingId, vendorId, vendorName } = route.params;
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const flatListRef = useRef();

//   useEffect(() => {
//     console.log('[ChatScreen] useEffect start');
//     fetchMessages();
//     setupPusher();

//     return () => {
//       console.log('[ChatScreen] Cleanup - unsubscribe and disconnect');
//       pusher.unsubscribe(`booking.${bookingId}`)
//         .then(() => console.log('[ChatScreen] Unsubscribed successfully'))
//         .catch(e => console.warn('[ChatScreen] Unsubscribe error:', e));
//       // Optionally keep connected for app lifetime, so no disconnect here
//     };
//   }, []);

//   const fetchMessages = async () => {
//     console.log('[fetchMessages] Fetching messages from API...');
//     try {
//       const token = await AsyncStorage.getItem('token');
//       console.log('[fetchMessages] Retrieved token:', token ? 'Exists' : 'Null');
//       const res = await axios.get(
//         `https://app.transrentals.in/api/customer/bookings/${bookingId}/chats/${vendorId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log('[fetchMessages] Response data count:', res.data.length);
//       setMessages(res.data);
//       // Scroll after messages set
//       setTimeout(() => {
//         console.log('[fetchMessages] Scrolling to bottom');
//         flatListRef.current?.scrollToEnd({ animated: true });
//       }, 100);
//     } catch (error) {
//       console.log('[fetchMessages] Error fetching messages:', error);
//     }
//   };

//   const setupPusher = async () => {
//     try {
//       console.log('[setupPusher] Initializing Pusher...');
//       await pusher.init({
//         apiKey: '59ceeade4d6ec7c7ec88',
//         cluster: 'ap2',
//         enableLogging: true,
//       });
//       console.log('[setupPusher] Connecting to Pusher...');
//       await pusher.connect();
//       console.log('[setupPusher] Connected to Pusher!');

//       const channel = await pusher.subscribe({
//         channelName: `booking.${bookingId}`,
//         onEvent: (event) => {
//           console.log('[Pusher] Raw event received:', event);

//           if (!event) {
//             console.warn('[Pusher] Received null/undefined event');
//             return;
//           }

//           if (event.event) {
//             console.log('[Pusher] Event name:', event.event);
//           }

//           let data = null;
//           if (typeof event === 'string') {
//             try {
//               data = JSON.parse(event);
//               console.log('[Pusher] Parsed event string JSON:', data);
//             } catch (e) {
//               console.log('[Pusher] Failed to parse event string:', e);
//               return;
//             }
//           } else if (event.data) {
//             try {
//               data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
//               console.log('[Pusher] Parsed event.data JSON:', data);
//             } catch (e) {
//               console.log('[Pusher] Failed to parse event.data:', e);
//               return;
//             }
//           } else {
//             data = event;
//             console.log('[Pusher] Event data fallback:', data);
//           }

//           if (event.eventName === 'BookingChatMessageSent' && data && data.chat) {
//             console.log('[Pusher] Valid chat event, updating messages');
//             setMessages((prev) => {
//               // Prevent duplicates
//               if (prev.some(m => m.id === data.chat.id)) {
//                 return prev;
//               }
//               const newMessages = [...prev, data.chat];
//               console.log('[Pusher] Messages state updated:', newMessages.length);
//               return newMessages;
//             });
//             setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
//           } else {
//             console.warn('[Pusher] Ignored event or missing chat data:', event.event, data);
//           }
//         },
//       });
//       console.log('[setupPusher] Subscribed to channel:', channel.channelName);
//     } catch (error) {
//       console.log('[setupPusher] Pusher setup error:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim()) {
//       console.log('[sendMessage] Empty input, ignoring send');
//       return;
//     }
//     console.log('[sendMessage] Sending message:', input);

//     try {
//       const token = await AsyncStorage.getItem('token');
//       const res = await axios.post(
//         `https://app.transrentals.in/api/customer/bookings/${bookingId}/chats/${vendorId}`,
//         { message: input },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log('[sendMessage] Message sent successfully, appending locally');
//       setMessages((prev) => {
//         if (prev.some(m => m.id === res.data.id)) {
//           return prev;
//         }
//         return [...prev, res.data];
//       });
//       setInput('');
//       flatListRef.current.scrollToEnd({ animated: true });
//     } catch (error) {
//       console.log('[sendMessage] Error sending message:', error);
//     }
//   };

//   const renderItem = ({ item }) => {
//     const isCustomer = item.sender_type === 'customer';
//     return (
//       <View
//         style={[
//           styles.messageContainer,
//           isCustomer ? styles.messageRight : styles.messageLeft,
//         ]}
//       >
//         <Text style={[styles.messageText, isCustomer ? styles.textWhite : styles.textBlack]}>
//           {item.message}
//         </Text>
//         <Text style={styles.messageTime}>
//           {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id.toString()}
//         contentContainerStyle={{ padding: 16 }}
//         onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
//         onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
//       />
//       <View style={styles.inputContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder={`Message ${vendorName}`}
//           value={input}
//           onChangeText={setInput}
//           onSubmitEditing={sendMessage}
//           returnKeyType="send"
//         />
//         <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//           <Text style={{ color: 'white' }}>Send</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   messageContainer: {
//     maxWidth: '70%',
//     marginBottom: 12,
//     padding: 10,
//     borderRadius: 10,
//   },
//   messageRight: {
//     backgroundColor: '#3B82F6',
//     alignSelf: 'flex-end',
//   },
//   messageLeft: {
//     backgroundColor: '#E5E7EB',
//     alignSelf: 'flex-start',
//   },
//   messageText: {
//     fontSize: 16,
//   },
//   textWhite: {
//     color: 'white',
//   },
//   textBlack: {
//     color: 'black',
//   },
//   messageTime: {
//     fontSize: 10,
//     marginTop: 4,
//     color: '#9CA3AF',
//     alignSelf: 'flex-end',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 12,
//     borderTopWidth: 1,
//     borderColor: '#ddd',
//     backgroundColor: 'white',
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#f1f1f1',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     fontSize: 16,
//   },
//   sendButton: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#3B82F6',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     marginLeft: 10,
//   },
// });

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated, Easing,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pusher } from '@pusher/pusher-websocket-react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import api from '../api';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from '../../theme';

const BG = '#F0FDF4';

const SHADOW_SM = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  android: { elevation: 2 },
});
const SHADOW_MD = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  android: { elevation: 5 },
});

const pusher = Pusher.getInstance();

export default function ChatScreen({ route, navigation }) {
  const { bookingId, vendorId, vendorName, bookingstatus, bookinglocation, bookingdate, bookingtime, service_name } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Scroll to end when keyboard opens
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150)
    );
    return () => showSub.remove();
  }, []);

  /* ── StatusBar management ──────────────── */
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(TEAL_DEEP);
        StatusBar.setTranslucent(false);
      }
      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#0A6B3F');
        }
      };
    }, [])
  );

  useEffect(() => {
    console.log('[ChatScreen] useEffect start');
    fetchMessages();
    setupPusher();

    return () => {
      console.log('[ChatScreen] Cleanup - unsubscribe and disconnect');
      pusher.unsubscribe(`booking.${bookingId}`)
        .then(() => console.log('[ChatScreen] Unsubscribed successfully'))
        .catch(e => console.warn('[ChatScreen] Unsubscribe error:', e));
      // Optionally keep connected for app lifetime, so no disconnect here
    };
  }, []);

  const toggleBookingDetails = () => {
    const toValue = showDetails ? 0 : 1;
    setShowDetails(!showDetails);

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  const dropdownHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 164], // adjust height as needed
  });

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get(
        `/customer/bookings/${bookingId}/chats/${vendorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[fetchMessages] Response data count:', res.data.length);
      setMessages(res.data);
       // Mark vendor messages as read (Important)
    await api.post(
      `/customer/bookings/${bookingId}/vendor/${vendorId}/read-messages`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('[fetchMessages] Unread messages marked as read');
      // Scroll after messages set
      setTimeout(() => {
        console.log('[fetchMessages] Scrolling to bottom');
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log('[fetchMessages] Error fetching messages:', error);
    } finally {
    setLoading(false);
  }
  };

  const SkeletonBubble = ({ isRight, index }) => {
    // Use index to control variation: every 3rd bubble will be shorter
    const isShort = index % 3 === 0;

    const width = Math.floor(Math.random() * (240 - 140 + 1)) + 140; // width 140-240
    const height = isShort
      ? Math.floor(Math.random() * (25 - 20 + 1)) + 20   // small bubble: 20-25
      : Math.floor(Math.random() * (50 - 40 + 1)) + 40;  // large bubble: 40-50

    return (
      <View
        style={{
          alignSelf: isRight ? 'flex-end' : 'flex-start',
          marginBottom: hp(1.5),
          maxWidth: '80%',
        }}
      >
        <ShimmerPlaceHolder
          style={{
            width,
            height,
            borderRadius: wp(4),
            backgroundColor: TEAL_LIGHT,
          }}
          shimmerStyle={{ borderRadius: wp(4) }}
          shimmerColors={['#E6F7F0', '#D1FAE5', '#E6F7F0']}
          visible={false}
        />
      </View>
    );
  };

  const setupPusher = async () => {
    try {
      console.log('[setupPusher] Initializing Pusher...');
      await pusher.init({
        apiKey: '59ceeade4d6ec7c7ec88',
        cluster: 'ap2',
        enableLogging: true,
      });
      console.log('[setupPusher] Connecting to Pusher...');
      await pusher.connect();
      console.log('[setupPusher] Connected to Pusher!');

      const channel = await pusher.subscribe({
        channelName: `booking.${bookingId}`,
        onEvent: (event) => {
          console.log('[Pusher] Raw event received:', event);

          if (!event) {
            console.warn('[Pusher] Received null/undefined event');
            return;
          }

          if (event.event) {
            console.log('[Pusher] Event name:', event.event);
          }

          let data = null;
          if (typeof event === 'string') {
            try {
              data = JSON.parse(event);
              console.log('[Pusher] Parsed event string JSON:', data);
            } catch (e) {
              console.log('[Pusher] Failed to parse event string:', e);
              return;
            }
          } else if (event.data) {
            try {
              data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              console.log('[Pusher] Parsed event.data JSON:', data);
            } catch (e) {
              console.log('[Pusher] Failed to parse event.data:', e);
              return;
            }
          } else {
            data = event;
            console.log('[Pusher] Event data fallback:', data);
          }

          if (event.eventName === 'BookingChatMessageSent' && data && data.chat) {
            console.log('[Pusher] Valid chat event, updating messages');
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some(m => m.id === data.chat.id)) {
                return prev;
              }
              const newMessages = [...prev, data.chat];
              console.log('[Pusher] Messages state updated:', newMessages.length);
              return newMessages;
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          } else {
            console.warn('[Pusher] Ignored event or missing chat data:', event.event, data);
          }
        },
      });
      console.log('[setupPusher] Subscribed to channel:', channel.channelName);
    } catch (error) {
      console.log('[setupPusher] Pusher setup error:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) {
      console.log('[sendMessage] Empty input, ignoring send');
      return;
    }
    console.log('[sendMessage] Sending message:', input);

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.post(
        `/customer/bookings/${bookingId}/chats/${vendorId}`,
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[sendMessage] Message sent successfully, appending locally');
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data.id)) {
          return prev;
        }
        return [...prev, res.data];
      });
      setInput('');
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.log('[sendMessage] Error sending message:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isCustomer = item.sender_type === 'customer';
    return (
      <View
        style={[
          styles.messageWrapper,
          isCustomer ? styles.alignRight : styles.alignLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isCustomer ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text style={[styles.messageText, isCustomer ? styles.textWhite : styles.textDark]}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, isCustomer && styles.timeTextCustomer]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TEAL_DEEP }} edges={['bottom']}>
    <View style={{ flex: 1, backgroundColor: BG, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}>
      {/* ── Teal Gradient Header ─────────────── */}
      <LinearGradient
        colors={[TEAL_DEEP, TEAL_MID, '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={wp(5.5)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <LinearGradient
            colors={[TEAL, '#059669']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {vendorName?.charAt(0).toUpperCase() || 'V'}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName} numberOfLines={1}>{vendorName}</Text>
            <Text style={styles.serviceName}>{service_name || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleBookingDetails}
          style={styles.dropdownToggle}
        >
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={wp(5)}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Booking Details Dropdown ─────────── */}
      <Animated.View style={[styles.bookingDropdown, { height: dropdownHeight }]}>
        {showDetails && (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeaderRow}>
              <Text style={styles.bookingTitle}>Booking Details</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{bookingstatus || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="date-range" size={wp(4.2)} color={TEAL} />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{bookingdate || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={wp(4.2)} color={TEAL} />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{bookingtime || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-sharp" size={wp(4.2)} color={TEAL} />
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{bookinglocation || 'N/A'}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Messages / Skeleton ─────────────── */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          {[...Array(8)].map((_, i) => (
            <SkeletonBubble key={i} isRight={i % 2 === 0} index={i} />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: wp(4), paddingVertical: hp(1.5) }}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
      )}

      {/* ── Input Bar ────────────────────────── */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={TEXT_MUTED}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendIconButton} onPress={sendMessage}>
          <Ionicons name="send" size={wp(4.5)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ── Header ──────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(1.8),
    paddingBottom: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomLeftRadius: wp(6),
    borderBottomRightRadius: wp(6),
    overflow: 'hidden',
  },
  backButton: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: wp(3),
  },
  avatar: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(5.25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2.5),
  },
  avatarText: {
    fontSize: wp(4.5),
    fontWeight: '700',
    color: '#fff',
  },
  vendorName: {
    fontWeight: '700',
    fontSize: wp(4),
    color: '#fff',
  },
  serviceName: {
    fontSize: wp(3.2),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(0.2),
  },
  dropdownToggle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Booking Dropdown ────────────────── */
  bookingDropdown: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingCard: {
    backgroundColor: BG,
    borderRadius: wp(3),
    padding: wp(4),
    marginTop: hp(0.5),
    borderWidth: 1,
    borderColor: TEAL_LIGHT,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  bookingTitle: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  statusBadge: {
    backgroundColor: TEAL,
    paddingHorizontal: wp(2.8),
    paddingVertical: hp(0.4),
    borderRadius: wp(3),
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: wp(2.8),
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  detailLabel: {
    flex: 1,
    marginLeft: wp(2.5),
    fontSize: wp(3.4),
    color: TEXT_SECONDARY,
  },
  detailValue: {
    fontSize: wp(3.4),
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'right',
    flex: 1.5,
  },

  /* ── Messages ────────────────────────── */
  messageWrapper: {
    marginBottom: hp(1.2),
    maxWidth: '80%',
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3.8),
    borderRadius: wp(4),
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TEAL_LIGHT,
    borderTopLeftRadius: wp(1),
    ...SHADOW_SM,
  },
  bubbleRight: {
    backgroundColor: TEAL_MID,
    borderTopRightRadius: wp(1),
    ...SHADOW_SM,
  },
  messageText: {
    fontSize: wp(3.7),
    lineHeight: wp(5.2),
  },
  textWhite: {
    color: '#fff',
  },
  textDark: {
    color: TEXT_PRIMARY,
  },
  timeText: {
    fontSize: wp(2.7),
    color: TEXT_MUTED,
    marginTop: hp(0.5),
    textAlign: 'right',
  },
  timeTextCustomer: {
    color: 'rgba(255,255,255,0.6)',
  },

  /* ── Skeleton ────────────────────────── */
  skeletonContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    flex: 1,
  },

  /* ── Input Bar ───────────────────────── */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3.5),
    borderTopWidth: 2,
    borderColor: '#586273',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: wp(2.5),
    paddingVertical: Platform.OS === 'ios' ? hp(2) : hp(1.8),
    paddingHorizontal: wp(4),
    fontSize: wp(3.8),
    borderWidth: 2,
    borderColor: '#586273',
    color: TEXT_PRIMARY,
  },
  sendIconButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(2.5),
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2.5),
  },
});
