// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   SafeAreaView,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   Dimensions,
//   TextInput
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
// import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Feather';
// import ProfileCheckModal from './profile/ProfileCheckModal';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
// import api from '../api';

// const { width } = Dimensions.get('window');

// export default function ExpensesScreen() {
//   const [expenses, setExpenses] = useState([]);
//   const [filteredExpenses, setFilteredExpenses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const navigation = useNavigation();

//   useEffect(() => {
//     fetchExpenses();
//   }, []);

//   useEffect(() => {
//     // Filter expenses based on search query
//     if (searchQuery) {
//       const filtered = expenses.filter(item => 
//         item.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.source_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       setFilteredExpenses(filtered);
//     } else {
//       setFilteredExpenses(expenses);
//     }
//   }, [searchQuery, expenses]);

//   const fetchExpenses = async () => {
//     try {
//       const customerId = await AsyncStorage.getItem("customer_id");
//       console.log(':man_standing: customer_id:', customerId);
//       if (!customerId) {
//         console.log('No customer ID found.');
//         return;
//       }
//       const res = await api.get(`/customer-expenses`, {
//         params: { customer_id: customerId } 
//       });
//       console.log(':package: API response data:', res.data);
//       if (res.data.status) {
//         setExpenses(res.data.expenses);
//         setFilteredExpenses(res.data.expenses);
//       } else {
//         console.error('Error:', res.data.message);
//       }
//     } catch (error) {
//       console.error('Error fetching expenses:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     setLoading(true);
//     fetchExpenses();
//     setRefreshing(false);
//   };

//   // Calculate total expenses
//   const totalExpenses = expenses.reduce((total, item) => total + parseFloat(item.amount || 0), 0);

//   const truncateText = (text, maxLength) => {
//     if (!text) return '';
//     return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
//   };

//   const renderExpenseItem = ({ item }) => (
//     <TouchableOpacity style={styles.quoteCard}>
//       <View style={styles.quoteHeader}>
//         <View style={styles.imageBox}>
//           <MaterialIcons name="payment" size={20} color="#D32F2F" />
//         </View>
//         <View style={styles.quoteInfo}>
//           <Text style={styles.quoteTitle}>Advance Payment</Text>
//           <Text style={styles.vendorName}>{item.vendor?.name || 'N/A'}</Text>
//         </View>
//         <Text style={styles.quotePrice}>₹{parseFloat(item.amount || 0).toFixed(2)}</Text>
//       </View>
      
//       <View style={styles.dashedDivider} />
      
//       <View style={styles.detailsContainer}>
//         <View style={styles.detailRow}>
//           <View style={styles.detailItem}>
//             <Text style={styles.detailLabel}>Source</Text>
//             <Text style={styles.detailValue}>{item.source_name || 'N/A'}</Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Text style={styles.detailLabel}>Quotation ID</Text>
//             <Text style={styles.detailValue}>{item.quotation_id || 'N/A'}</Text>
//           </View>
//         </View>
        
//         {item.description && (
//           <View style={styles.descriptionContainer}>
//             <Text style={styles.descriptionLabel}>Description</Text>
//             <Text style={styles.descriptionText}>{item.description}</Text>
//           </View>
//         )}
        
//         <View style={styles.dateContainer}>
//           <Ionicons name="calendar-outline" size={14} color="#666" />
//           <Text style={styles.dateText}>
//             {item.payment_date ? new Date(item.payment_date).toLocaleDateString() : 'Date not available'}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <ProfileCheckModal />
      
//       {/* Header */}
//       <View style={styles.MainHeader}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={30} color="#404040" />
//           </TouchableOpacity>
//           <Text style={styles.headerText}>Payments</Text>
//         </View>
//       </View>

//       {/* Total Expenses Card */}
//       {!loading && expenses.length > 0 && (
//         <View style={styles.totalExpensesCard}>
//           <View style={styles.totalExpensesContent}>
//             <Text style={styles.totalExpensesLabel}>Total Expenses</Text>
//             <Text style={styles.totalExpensesAmount}>₹{totalExpenses.toFixed(2)}</Text>
//           </View>
//           <MaterialIcons name="account-balance-wallet" size={24} color="#D32F2F" />
//         </View>
//       )}

//       {/* Search Bar */}
//       {!loading && expenses.length > 0 && (
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by vendor, source or description..."
//             placeholderTextColor="#999"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//           {searchQuery ? (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={20} color="#666" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       )}

//       <FlatList
//         data={loading ? Array(4).fill({}) : filteredExpenses}
//         keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
//         contentContainerStyle={styles.scrollContainer}
//         renderItem={({ item, index }) =>
//           loading ? (
//             <View style={styles.skeletonCard}>
//               <View style={styles.skeletonHeader}>
//                 <ShimmerPlaceHolder
//                   LinearGradient={LinearGradient}
//                   visible={false}
//                   autoRun
//                   style={styles.skeletonIcon}
//                 />
//                 <View style={styles.skeletonTextWrapper}>
//                   <ShimmerPlaceHolder
//                     LinearGradient={LinearGradient}
//                     visible={false}
//                     autoRun
//                     style={styles.skeletonLineShort}
//                   />
//                   <ShimmerPlaceHolder
//                     LinearGradient={LinearGradient}
//                     visible={false}
//                     autoRun
//                     style={styles.skeletonLineLong}
//                   />
//                 </View>
//                 <ShimmerPlaceHolder
//                   LinearGradient={LinearGradient}
//                   visible={false}
//                   autoRun
//                   style={styles.skeletonPrice}
//                 />
//               </View>
//               <View style={styles.skeletonBody}>
//                 <ShimmerPlaceHolder
//                   LinearGradient={LinearGradient}
//                   visible={false}
//                   autoRun
//                   style={styles.skeletonLineFull}
//                 />
//                 <ShimmerPlaceHolder
//                   LinearGradient={LinearGradient}
//                   visible={false}
//                   autoRun
//                   style={styles.skeletonLineMedium}
//                 />
//               </View>
//             </View>
//           ) : (
//             renderExpenseItem({ item })
//           )
//         }
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//         ListHeaderComponent={
//           <>
//             {/* Show no results message when search has no results */}
//             {!loading && searchQuery && filteredExpenses.length === 0 && (
//               <View style={styles.noResultsContainer}>
//                 <Ionicons name="search-outline" size={50} color="#ccc" />
//                 <Text style={styles.noResultsText}>No payments found for "{searchQuery}"</Text>
//               </View>
//             )}
            
//             {/* Show original no data message only when there are no expenses at all */}
//             {!loading && expenses.length === 0 && !searchQuery && (
//               <View style={styles.noDataContainer}>
//                 <Image
//                   source={require('../../assets/NoPayment.png')}
//                   style={styles.noDataImage}
//                   resizeMode="contain"
//                 />
//                 <Text style={styles.noDataText}>You Have Done No Transactions</Text>
//               </View>
//             )}
//           </>
//         }
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9F7F7',
//   },
//   MainHeader: {
//     backgroundColor: '#F9F7F7',
//     width: '100%',
//     paddingHorizontal: 10,
//     elevation: 5,
//   },
//   header: {
//     backgroundColor: '#F9F7F7',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//   },
//   headerText: {
//     color: '#404040',
//     fontSize: 20,
//     marginLeft: 10,
//   },
//   // Total Expenses Card
//   totalExpensesCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginTop: 15,
//     marginBottom: 10,
//     borderRadius: 10,
//     borderWidth: 1.2,
//     borderColor: '#B0B0B0',
//     padding: 16,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   totalExpensesContent: {
//     flex: 1,
//   },
//   totalExpensesLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   totalExpensesAmount: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#D32F2F',
//   },
//   // Search Bar
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginBottom: 15,
//     borderRadius: 10,
//     borderWidth: 1.2,
//     borderColor: '#B0B0B0',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: '#404040',
//     paddingVertical: 4,
//   },
//   scrollContainer: {
//     paddingBottom: 100,
//     paddingTop: 10,
//   },
//   // Quote Card Styles
//   quoteCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginBottom: 12,
//     borderRadius: 10,
//     borderWidth: 1.2,
//     borderColor: '#B0B0B0',
//     overflow: 'hidden',
//   },
//   quoteHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//   },
//   imageBox: {
//     backgroundColor: '#FFE6E6',
//     borderRadius: 5,
//     width: 30,
//     height: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#FF4444',
//   },
//   quoteInfo: {
//     flex: 1,
//     marginLeft: 10,
//   },
//   quoteTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000',
//     marginBottom: 4,
//   },
//   vendorName: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
//   quotePrice: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#D32F2F',
//   },
//   dashedDivider: {
//     borderTopWidth: 1,
//     borderStyle: 'dashed',
//     borderColor: '#C4C4C4',
//     marginHorizontal: 12,
//   },
//   detailsContainer: {
//     padding: 12,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   detailItem: {
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 12,
//     color: '#666',
//     fontWeight: '500',
//     marginBottom: 4,
//     textTransform: 'uppercase',
//   },
//   detailValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   descriptionContainer: {
//     marginBottom: 12,
//     backgroundColor: '#F9F9F9',
//     padding: 10,
//     borderRadius: 6,
//     borderLeftWidth: 3,
//     borderLeftColor: '#D32F2F', 
//   },
//   descriptionLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 4,
//   },
//   descriptionText: {
//     fontSize: 13,
//     color: '#555',
//     lineHeight: 18,
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//   },
//   dateText: {
//     fontSize: 12,
//     color: '#888',
//     marginLeft: 4,
//     fontStyle: 'italic',
//   },
//   // Skeleton Styles
//   skeletonCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     marginBottom: 12,
//     borderRadius: 10,
//     borderWidth: 1.2,
//     borderColor: '#B0B0B0',
//     overflow: 'hidden',
//     padding: 12,
//   },
//   skeletonHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   skeletonIcon: {
//     width: 64,
//     height: 64,
//     borderRadius: 10,
//     backgroundColor: '#E0E0E0',
//     marginRight: 10,
//   },
//   skeletonTextWrapper: {
//     flex: 1,
//   },
//   skeletonLineShort: {
//     width: '60%',
//     height: 16,
//     backgroundColor: '#E0E0E0',
//     marginBottom: 8,
//     borderRadius: 4,
//   },
//   skeletonLineLong: {
//     width: '80%',
//     height: 14,
//     backgroundColor: '#E0E0E0',
//     borderRadius: 4,
//   },
//   skeletonPrice: {
//     width: 80,
//     height: 20,
//     backgroundColor: '#E0E0E0',
//     borderRadius: 4,
//   },
//   skeletonBody: {
//     marginTop: 8,
//   },
//   skeletonLineFull: {
//     width: '100%',
//     height: 12,
//     backgroundColor: '#E0E0E0',
//     marginBottom: 8,
//     borderRadius: 4,
//   },
//   skeletonLineMedium: {
//     width: '70%',
//     height: 12,
//     backgroundColor: '#E0E0E0',
//     borderRadius: 4,
//   },
//   // No Data & No Results Styles
//   noDataContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 50,
//     paddingHorizontal: 20,
//   },
//   noDataImage: {
//     width: 250,
//     height: 250,
//     marginBottom: 20,
//   },
//   noDataText: {
//     fontSize: 18,
//     color: '#555',
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   noResultsContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 40,
//     marginTop: 20,
//   },
//   noResultsText: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginTop: 10,
//   },
// });
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import api from '../api';

const { width } = Dimensions.get('window');

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    // Complete Filter expenses based on search query
    if (searchQuery) {
      const filtered = expenses.filter(item => {
        const query = searchQuery.toLowerCase();
        
        // Existing search
        const vendorMatch = item.vendor?.name?.toLowerCase().includes(query);
        const sourceMatch = item.source_name?.toLowerCase().includes(query);
        const descriptionMatch = item.description?.toLowerCase().includes(query);
        
        // Price search
        const priceMatch = item.amount?.toString().includes(query) || 
                          `₹${item.amount}`.includes(query);
        
        // Quotation ID search
        const quotationIdMatch = item.quotation_id?.toString().includes(query);
        
        // Booking ID search
        const bookingIdMatch = item.booking_id?.toString().includes(query);

        // NEW: Service, location, destination search (assuming these fields exist in your API response)
        const serviceMatch = item.service_name?.toLowerCase().includes(query) ||
                            item.service_type?.toLowerCase().includes(query);

        const locationMatch = item.location_name?.toLowerCase().includes(query) ||
                             item.location?.toLowerCase().includes(query);

        const destinationMatch = item.destination?.toLowerCase().includes(query);

        return vendorMatch || sourceMatch || descriptionMatch || 
               priceMatch || quotationIdMatch || bookingIdMatch ||
               serviceMatch || locationMatch || destinationMatch;
      });
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [searchQuery, expenses]);

  const fetchExpenses = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customer_id");
      console.log(':man_standing: customer_id:', customerId);
      if (!customerId) {
        console.log('No customer ID found.');
        return;
      }
      const res = await api.get(`/customer/expenses`, {
        params: { customer_id: customerId }
      });
      console.log(':package: API response data:', res.data);
      
      // ✅ CHECK ALL AVAILABLE FIELDS
      if (res.data.expenses && res.data.expenses.length > 0) {
        console.log('🔍 Available fields in first expense:', Object.keys(res.data.expenses[0]));
        console.log('📍 Location fields:', {
          location: res.data.expenses[0].location,
          location_name: res.data.expenses[0].location_name,
          destination: res.data.expenses[0].destination
        });
        console.log('🚗 Service fields:', {
          service_type: res.data.expenses[0].service_type,
          service_name: res.data.expenses[0].service_name
        });
      }
      
      if (res.data.status) {
        // Sort expenses by date in descending order (newest first)
        const sortedExpenses = res.data.expenses.sort((a, b) => {
          // Use payment_date or created_at or any date field you have
          const dateA = new Date(a.payment_date || a.created_at || a.date);
          const dateB = new Date(b.payment_date || b.created_at || b.date);
          return dateB - dateA; // Descending order (newest first)
        });
        
        setExpenses(sortedExpenses);
        setFilteredExpenses(sortedExpenses);
      } else {
        console.error('Error:', res.data.message);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchExpenses();
    setRefreshing(false);
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((total, item) => total + parseFloat(item.amount || 0), 0);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Handle payment card click
  const handlePaymentCardClick = (item) => {
    if (!item.booking_id || !item.service_type) {
      console.log('No booking ID or service type found for this payment');
      alert('Booking details not available for this payment');
      return;
    }

    // Navigate to correct booking detail screen based on service type
    const screenMapping = {
      'bike': 'BikeBookingDetail',
      'self-drive': 'SelfDriveBookingDetail',
      'luxury': 'LuxuryBookingDetail',
      'truck': 'TruckBookingDetail',
      'equipment': 'EquipmentBookingDetail',
      'packers': 'PackersBookingDetail',
      'bus': 'BusBookingDetail',
    };

    const screen = screenMapping[item.service_type];
    if (screen) {
      navigation.navigate(screen, {
        bookingId: item.booking_id
      });
    } else {
      console.log('Unknown service type:', item.service_type);
      alert('Unable to open booking details');
    }
  };

  const renderExpenseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.quoteCard}
      onPress={() => handlePaymentCardClick(item)}
    >
      <View style={styles.quoteHeader}>
        <View style={styles.imageBox}>
          <MaterialIcons name="payment" size={20} color="#D32F2F" />
        </View>
        <View style={styles.quoteInfo}>
          <Text style={styles.label}>{item.source_name || 'Payment'}</Text>
          <Text style={styles.quoteTitle}>{item.booking_number || 'Advance Payment'}</Text>
        </View>
        <Text style={styles.quotePrice}>₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vendor</Text>
            <Text style={styles.detailValue}>{item.vendor?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Date</Text>
            <Text style={styles.detailValue}>
              {item.payment_date ? new Date(item.payment_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.paymentStatusRow}>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.statusText}>Payment Submitted</Text>
          </View>
          <TouchableOpacity style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="arrow-forward" size={14} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
      <View style={styles.MainHeader}>
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
      <Text style={styles.headerText}>Payments</Text>
      <Text style={styles.subTitle}>View all your transactions in one place</Text>
    </View>
  </View>
</View>

        {/* Search Bar - Moved to top */}
        {!loading && expenses.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by vendor, price, service, location, destination..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Total Expenses Card - Moved below search bar */}
        {!loading && expenses.length > 0 && (
          <View style={styles.totalExpensesCard}>
            <View style={styles.totalExpensesContent}>
              <Text style={styles.totalExpensesLabel}>Total Expenses</Text>
              <Text style={styles.totalExpensesAmount}>₹{totalExpenses.toFixed(2)}</Text>
            </View>
            <MaterialIcons name="account-balance-wallet" size={24} color="#D32F2F" />
          </View>
        )}

        <FlatList
          data={loading ? Array(4).fill({}) : filteredExpenses}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item, index }) =>
            loading ? (
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonHeader}>
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    visible={false}
                    autoRun
                    style={styles.skeletonIcon}
                  />
                  <View style={styles.skeletonTextWrapper}>
                    <ShimmerPlaceHolder
                      LinearGradient={LinearGradient}
                      visible={false}
                      autoRun
                      style={styles.skeletonLineShort}
                    />
                    <ShimmerPlaceHolder
                      LinearGradient={LinearGradient}
                      visible={false}
                      autoRun
                      style={styles.skeletonLineLong}
                    />
                  </View>
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    visible={false}
                    autoRun
                    style={styles.skeletonPrice}
                  />
                </View>
                <View style={styles.skeletonBody}>
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    visible={false}
                    autoRun
                    style={styles.skeletonLineFull}
                  />
                  <ShimmerPlaceHolder
                    LinearGradient={LinearGradient}
                    visible={false}
                    autoRun
                    style={styles.skeletonLineMedium}
                  />
                </View>
              </View>
            ) : (
              renderExpenseItem({ item })
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {/* Show no results message when search has no results */}
              {!loading && searchQuery && filteredExpenses.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={50} color="#ccc" />
                  <Text style={styles.noResultsText}>No payments found for "{searchQuery}"</Text>
                </View>
              )}
              
              {/* Show original no data message only when there are no expenses at all */}
              {!loading && expenses.length === 0 && !searchQuery && (
                <View style={styles.noDataContainer}>
                  <Image
                    source={require('../../assets/NoPayment.png')}
                    style={styles.noDataImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.noDataText}>You Have Done No Transactions</Text>
                </View>
              )}
            </>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F7F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F7F7',
  },
  MainHeader: {
    backgroundColor: '#F9F7F7',
    width: '100%',
    paddingVertical: 12,
    elevation: 5,
  },
  header: {
    backgroundColor: '#F9F7F7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  backButton: {
    marginRight: 8,
    marginTop: 5,
  },
  backButtonCircle: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 3,

  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 5,
  },
  headerText: {
    color: '#404040',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Total Expenses Card
  totalExpensesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 1,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#B0B0B0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  totalExpensesContent: {
    flex: 1,
  },
  totalExpensesLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalExpensesAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#B0B0B0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#404040',
    paddingVertical: 4,
  },
  scrollContainer: {
    paddingBottom: 100,
    paddingTop: 10,
  },
  // Quote Card Styles
  quoteCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#B0B0B0',
    overflow: 'hidden',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageBox: {
    backgroundColor: '#FFE6E6',
    borderRadius: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  quoteInfo: {
    flex: 1,
    marginLeft: 10,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quotePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C4C4C4',
    marginHorizontal: 12,
  },
  detailsContainer: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  descriptionContainer: {
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#D32F2F', 
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Booking ID Info
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  bookingIdText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  tapText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  // Skeleton Styles
  skeletonCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#B0B0B0',
    overflow: 'hidden',
    padding: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  skeletonTextWrapper: {
    flex: 1,
  },
  skeletonLineShort: {
    width: '60%',
    height: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonLineLong: {
    width: '80%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonPrice: {
    width: 80,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonBody: {
    marginTop: 8,
  },
  skeletonLineFull: {
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonLineMedium: {
    width: '70%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  // No Data & No Results Styles
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  noDataImage: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
  },
  noResultsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
});