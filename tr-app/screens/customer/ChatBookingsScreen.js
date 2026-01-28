// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet,SafeAreaView } from 'react-native';
// import axios from 'axios';
// import ProfileCheckModal from './profile/ProfileCheckModal';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Ionicons from 'react-native-vector-icons/Ionicons';
// export default function ChatBookingsScreen({ navigation }) {
//   const [bookings, setBookings] = useState([]);

//   useEffect(() => {
//     fetchBookings();
//   }, []);

//   const fetchBookings = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token'); // or your stored auth token
//       const res = await axios.get('https://app.transrentals.in/api/customer/chat/bookings', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setBookings(res.data);
//     } catch (error) {
//       console.log('Error fetching bookings:', error);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.card}>
//       <Text style={styles.title}>Booking #{item.id}</Text>
//       <Text>Service: {item.service?.name || 'N/A'}</Text>
//       <Text>Journey Date: {item.journey_datetime || '-'}</Text>
//       <TouchableOpacity 
//         style={styles.chatButton} 
//         onPress={() => navigation.navigate('BookingVendors', { bookingId: item.id })}
//       >
//         <Text style={styles.chatButtonText}>Chat</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//        <View style={styles.header}>
//               <TouchableOpacity onPress={() => navigation.goBack()}>
//                 <Ionicons name="arrow-back" size={24} color="#404040" />
//               </TouchableOpacity>
//               <Text style={styles.headerText}>Chat</Text>
//             </View>
//     <FlatList
//       data={bookings}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={renderItem}
//       contentContainerStyle={{ padding: 16 }}
//       ListEmptyComponent={<Text>No bookings found with chats.</Text>}
//     />
//     <ProfileCheckModal />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     padding: 16,
//     borderRadius: 6,
//     backgroundColor: 'white',
//     marginBottom: 12,
//     elevation: 2,
//   },
//   title: { fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
//   chatButton: {
//     marginTop: 10,
//     backgroundColor: '#3B82F6',
//     paddingVertical: 8,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//   },
//   chatButtonText: {
//     color: 'white',
//     paddingHorizontal: 16,
//   },
//    header: {
//     height: 60,
//     backgroundColor: '#F9F7F7',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     elevation: 5,  // Adds shadow to the header
//   },
//   headerText: {
//     color: '#404040',
//     fontSize: 20,
//     marginLeft: 10,  // Adjust space between back button and title
//   },
// });

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Modal, Dimensions, RefreshControl, InteractionManager } from 'react-native';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { IMAGE_BASE_URL } from '../api';

const MOCK_LIVE_CHATS = [
  {
    id: 1,
    title: 'Elite Cars',
    message: 'Looking forward to the rental. Is the c...',
    unreadCount: 2,
  },

];

const STATUS_COLORS = {
  Confirmed: '#2563eb', // blue
  Ongoing: '#22c55e',   // green
  Completed: '#6b7280', // gray
};

const ChatBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveChats, setLiveChats] = useState([]);
  const navigation = useNavigation();
  // useEffect(() => {
  //   fetchBookings();
  //   fetchLiveChats();
  //   const interval = setInterval(() => {
  //     fetchBookings();
  //     fetchLiveChats();
  //   }, 1000);

  //   return () => clearInterval(interval); // Prevent memory leaks
  // }, []);
  useFocusEffect(
  useCallback(() => {
    let intervalId;

    const fetchAll = () => {
      fetchBookings();
      fetchLiveChats();
    };

    fetchAll(); // Fetch immediately when screen is focused

    intervalId = setInterval(() => {
      fetchAll();
    }, 1000);

    return () => {
      // Cleanup interval when screen is unfocused
      clearInterval(intervalId);
    };
  }, [])
);

  const fetchBookings = async () => {
    try {
      // setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/customer/chat/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // console.log(res.data);
      // Add mock status, unreadCount, message, and time for demo
      const bookingsWithDefaults = (res.data || []).map((item, idx) => ({
        ...item,
        date: formatJourneyDate(item.journey_datetime),
        bookingtime: formatJourneyTime(item.journey_datetime),
        status: item.status || (idx === 0 ? 'Upcoming' : idx === 1 ? 'Active' : 'Completed'),
        unreadCount: item.unreadCount !== undefined ? item.unreadCount : (idx === 0 ? 2 : 0),
        message: item.message || (idx === 0 ? 'Looking forward to the rental. Is the ...' : idx === 1 ? 'Thank you for the excellent service!' : 'Car returned successfully. Thanks!'),
        time: item.time || (idx === 0 ? '2 min ago' : idx === 1 ? '1 hour ago' : '2 days ago'),
      }));
      setBookings(bookingsWithDefaults);
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveChats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/customer/chat/live-chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // console.log("live chats", res.data);
      setLiveChats(res.data || []);
    } catch (error) {
      console.log('Error fetching live chats:', error);
    }
  };

  const formatJourneyDate = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    const day = date.getDate();
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long' });

    // Get suffix for day
    const getSuffix = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getSuffix(day)} ${monthName} ${year}`;
  };

  const formatJourneyTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const renderStatusBadge = (status) => (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] || '#ccc' }]}>
      <Text style={styles.statusBadgeText}>{status}</Text>
    </View>
  );

  const renderUnreadBadge = (count) => (
    count > 0 ? (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadBadgeText}>{count}</Text>
      </View>
    ) : null
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BookingChat', {
        bookingId: item.id,
        bookingNumber: item.id?.toString() || `Booking ${item.id}`,
        vendorName: item.vendor_name || item.service?.name || 'Vendor'
      })}
      activeOpacity={0.9}
    >
      <View style={styles.cardRow}>
        {/* Avatar */}
        {item.service?.image ? (
          <Image
            source={{ uri: `${IMAGE_BASE_URL}/${item.service.image}` }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}

        {/* Right Side Content */}
        <View style={styles.cardContent}>
          {/* Top Row: Title + Status + Unread */}
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title || `Booking #${item.id}`}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {renderStatusBadge(item.status)}
              {renderUnreadBadge(item.unreadCount)}
            </View>
          </View>

          {/* Trip Info */}
          <Text style={styles.tripText}>
            <FontAwesome name="car" size={13} color="#6b7280" />  {item.trip || item.service?.name || '-'}
          </Text>

          {/* Date & Location */}
          <View style={styles.infoRow}>
            <MaterialIcons name="date-range" size={14} color="#6b7280" />
            <Text style={styles.infoText}>  {item.date || '-'} </Text>
            <Ionicons name="location-sharp" size={14} color="#6b7280" style={{ marginLeft: 12 }} />
            <Text style={styles.infoText}>  {item.location_name || '-'} </Text>
          </View>

          {/* Message + Time */}
          <View style={styles.messageRow}>
            <Text style={styles.messageText} numberOfLines={1}>{item.last_message ? `${item.last_message} - ${item.last_message_sender}` : 'No messages yet'}</Text>
            <Text style={styles.timeText}>• {item.last_message_time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Floating chat button unread count (sum of all unread)
  const totalUnread = bookings.reduce((sum, b) => sum + (b.unreadCount || 0), 0);

  const onRefresh = () => {
    setLoading(true);      // Show skeleton
    setBookings([]);       // Optionally clear data for instant skeleton
    fetchBookings();
  };

  return (
    <SafeAreaView style={styles.container}>

    <View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <View style={styles.backButtonCircle}>
      <Ionicons name="chevron-back" size={20} color="#404040" />
    </View>
  </TouchableOpacity>
  <View style={styles.headerTextContainer}>
    <Text style={styles.headerText}>Chat</Text>
  </View>
</View>
      {/* <TouchableOpacity onPress={() => navigation.navigate('LuxuryScreen')}>
  <Text>Go to Chat</Text>
</TouchableOpacity> */}

      {loading ? (
        <View style={{ backgroundColor: '#fff', padding: 16, height: '100%' }}>
          {[...Array(4)].map((_, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 16, borderRadius: 12, backgroundColor: '#f3f4f6', padding: 12 }}>
              <ShimmerPlaceHolder
                style={{ width: 42, height: 42, borderRadius: 21 }}
                shimmerStyle={{ borderRadius: 21 }}
                visible={false}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <ShimmerPlaceHolder
                  style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }}
                  shimmerStyle={{ borderRadius: 4 }}
                  visible={false}
                />
                <ShimmerPlaceHolder
                  style={{ width: '40%', height: 12, borderRadius: 4, marginBottom: 8 }}
                  shimmerStyle={{ borderRadius: 4 }}
                  visible={false}
                />
                <ShimmerPlaceHolder
                  style={{ width: '80%', height: 12, borderRadius: 4, marginBottom: 8 }}
                  shimmerStyle={{ borderRadius: 4 }}
                  visible={false}
                />
                <ShimmerPlaceHolder
                  style={{ width: '50%', height: 12, borderRadius: 4 }}
                  shimmerStyle={{ borderRadius: 4 }}
                  visible={false}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item, idx) => (item.id ? item.id.toString() : idx.toString())}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text>No bookings found with chats.</Text>}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={['#1cb55c']}
              tintColor="#1cb55c"
            />
          }
        />
      )}
      {/* Floating Chat Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
        {totalUnread > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </TouchableOpacity>
      {/* Live Chats Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Live Chats</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#404040" />
              </TouchableOpacity>
            </View>


            {liveChats.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20 }}>No live chats.</Text>
            ) : (
              liveChats
                .filter(chat => chat.unread_count > 0 && chat.last_message_sender === 'vendor')
                .map(chat => (
                  <TouchableOpacity
                    key={chat.vendor_id}
                    style={styles.liveChatItem}
                    onPress={() => {
                      setModalVisible(false);
                      InteractionManager.runAfterInteractions(() => {
                        const dateObj = new Date(chat.booking_date);

                        // Format booking date: "2nd July 2025"
                        const day = dateObj.getDate();
                        const year = dateObj.getFullYear();
                        const month = dateObj.toLocaleString('default', { month: 'long' });

                        const suffix = (d) => {
                          if (d > 3 && d < 21) return 'th';
                          switch (d % 10) {
                            case 1: return 'st';
                            case 2: return 'nd';
                            case 3: return 'rd';
                            default: return 'th';
                          }
                        };

                        const bookingdate = `${day}${suffix(day)} ${month} ${year}`;

                        // Format booking time: "6:44 AM"
                        const hours = dateObj.getHours();
                        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const bookingtime = `${hours % 12 || 12}:${minutes} ${ampm}`;

                        navigation.navigate('Chatsvendor', {
                          bookingId: chat.booking_id,
                          vendorId: chat.vendor_id,
                          vendorName: chat.vendor_name,
                          bookingstatus: chat.booking_status,
                          bookinglocation: chat.booking_location,
                          bookingdate,
                          bookingtime,
                          service_name: chat.service_name,
                        });
                      });
                    }}
                  >
                    <View style={styles.avatarPlaceholder}>
                      <Text style={{ color: '#888', fontWeight: 'bold', top: 12, left: 16 }}>
                        {chat.vendor_name[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontWeight: 'bold' }}>{chat.vendor_name}</Text>
                      <Text numberOfLines={1} style={{ color: '#555' }}>{chat.last_message}</Text>
                    </View>
                    {chat.unread_count > 0 && (
                      <View style={styles.fabBadge}>
                        <Text style={styles.fabBadgeText}>{chat.unread_count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
    resizeMode: 'contain',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  tripText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 6,
  },
  statusBadge: {
    backgroundColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  tripText: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 2,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 13,
  },
  messageText: {
    color: '#444',
    flex: 1,
    fontSize: 13,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  headerTextContainer: {
    flex: 1,
    // alignItems: 'center',
  },
  headerText: {
    color: '#404040',
    fontSize: 20,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 30,
    width: 58,
    height: 58,
    borderRadius: 32,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  fabBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  fabBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContent: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  liveChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});
export default ChatBookingsScreen;
