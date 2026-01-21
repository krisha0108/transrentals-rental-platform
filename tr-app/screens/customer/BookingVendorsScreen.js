// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// export default function BookingVendorsScreen({ route, navigation }) {
//   const { bookingId } = route.params;
//   const [vendors, setVendors] = useState([]);

//   useEffect(() => {
//     fetchVendors();
//   }, []);

//   const fetchVendors = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const res = await axios.get(`https://app.transrentals.in/api/customer/bookings/${bookingId}/vendors`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setVendors(res.data);
//     } catch (error) {
//       console.error('Error fetching vendors:', error);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.vendorCard}
//       onPress={() => navigation.navigate('Chat', { bookingId, vendorId: item.id, vendorName: item.name })}
//     >
//       <Text style={styles.vendorName}>{item.name}</Text>
//       <Text style={styles.chatText}>Chat with Vendor</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <FlatList
//       data={vendors}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={renderItem}
//       contentContainerStyle={{ padding: 16 }}
//       ListEmptyComponent={<Text>No vendors found for this booking.</Text>}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   vendorCard: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 6,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   vendorName: {
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   chatText: {
//     marginTop: 4,
//     color: '#3B82F6',
//   },
// });


import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { CommonActions } from '@react-navigation/native';
import api from '../api';

export default function BookingVendorsScreen({ route, navigation }) {
  const { bookingId , bookingstatus, bookinglocation, bookingdate, bookingtime,service_name } = route.params;
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
    const interval = setInterval(() => {
      fetchVendors(); // Keep updating every 1s
    }, 1000);
  
    return () => clearInterval(interval); // Prevent memory leaks
  }, []);

  const fetchVendors = async () => {
    try {
      // setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await api.get(`/customer/bookings/${bookingId}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // console.log('hello world:',res.data);
      setVendors(res.data);
      
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setLoading(true);
    setVendors([]);
    fetchVendors();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
    style={styles.vendorCard}
    onPress={() => navigation.navigate('Chatsvendor', { bookingId, vendorId: item.id, vendorName: item.name, bookingstatus, bookinglocation,bookingdate,bookingtime,service_name }) }
  >
    <View style={styles.cardRow}>
      {/* Avatar Placeholder */}
      <View style={styles.avatarPlaceholder}>
  <Text style={styles.avatarText}>
    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
  </Text>
</View>
  
      {/* Right Side Content */}
      <View style={styles.cardContent}>
        {/* Top Row */}
        <View style={styles.topRow}>
          <Text style={styles.vendorName}>{item.name || 'Elite Cars'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
            </View>
          </View>
        </View>
        {/* Message + Time */}
        <View style={styles.messageRow}>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.last_message || 'No messages yet'} 
          </Text>
          <Text style={styles.timeText}>• {item.last_message_time || 'No time'}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
  );

  return (
    <SafeAreaView>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#404040" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Vendors List</Text>
      </View>
    {loading ? (
      <View style={{ backgroundColor: '#fff', padding: 8 }}>
        {[...Array(4)].map((_, idx) => (
          <View key={idx} style={{ flexDirection: 'row', marginBottom: 8, borderRadius: 12, backgroundColor: '#f3f4f6', padding: 12 }}>
            <ShimmerPlaceHolder
              style={{ width: 42, height: 42, borderRadius: 21 }}
              shimmerStyle={{ borderRadius: 21 }}
              visible={false}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ShimmerPlaceHolder
                style={{ width: '50%', height: 18, borderRadius: 4, marginBottom: 8 }}
                shimmerStyle={{ borderRadius: 4 }}
                visible={false}
              />
              <ShimmerPlaceHolder
                style={{ width: '80%', height: 13, borderRadius: 4, marginBottom: 8 }}
                shimmerStyle={{ borderRadius: 4 }}
                visible={false}
              />
            </View>
          </View>
        ))}
      </View>
    ) : (
    <FlatList
      data={vendors}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 8 }}
      ListEmptyComponent={<Text>No vendors found for this booking.</Text>}
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
     </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },  
   header: {
    height: 60,
    backgroundColor: '#F9F7F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 5,
  },
  headerText: {
    color: '#404040',
    fontSize: 20,
    marginLeft: 10,
  },
  cardContent: {
    flex: 1,
    gap:4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorName: {
    fontWeight: '600',
    fontSize: 18,
    color: '#111827',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatText: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
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
  avatarText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    flex: 1,
  },
  
});
