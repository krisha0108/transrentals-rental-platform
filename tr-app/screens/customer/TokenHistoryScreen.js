// TokenHistoryScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, StyleSheet, 
  Alert, Image, TouchableOpacity, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function TokenHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('earned'); // 'earned' or 'redeemed'
  const navigation = useNavigation();

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const customerData = await AsyncStorage.getItem('customer');
      const customer = JSON.parse(customerData);
      
      // ✅ Choose API endpoint based on tab
      const endpoint = activeTab === 'earned' ? '/spin/history' : '/redeem/history';
      const { data } = await api.get(endpoint, {
        params: { customer_id: customer.id },
      });

      // ✅ Update list data based on response type
      setHistory(data.history || data.redeem_history || []);
    } catch (e) {
      console.log('History error', e?.response?.data || e.message);
      Alert.alert('Error', 'Could not load token history');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
         <Image
          source={
            activeTab === 'earned'
              ? require('../../assets/spinner-win.png') // ✅ Earned image
              : require('../../assets/redeemed-token.png') // ✅ Redeemed image (use your new image here)
          }
          style={styles.historyIcon}
        />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.sourceText}>
            {activeTab === 'earned'
              ? item.source || 'Spinner Bonus'
              : `Redeemed (${item.status})`}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.tokenBadge,
            activeTab === 'redeemed' && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
          ]}
        >
          <Image
            source={{ uri: 'https://app.transrentals.in/assets/images/coin-back.png' }}
            style={styles.tokenIcon}
          />
          <Text
            style={[
              styles.tokenText,
              { color: activeTab === 'redeemed' ? '#991B1B' : '#065F46' },
            ]}
          >
            {activeTab === 'earned'
              ? `+${item.tokens}`
              : `-${item.requested_tokens}`}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color="#065F46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'earned' && styles.activeTab]}
          onPress={() => setActiveTab('earned')}
        >
          <Text style={[styles.tabText, activeTab === 'earned' && styles.activeTabText]}>
            Earned
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'redeemed' && styles.activeTab]}
          onPress={() => setActiveTab('redeemed')}
        >
          <Text style={[styles.tabText, activeTab === 'redeemed' && styles.activeTabText]}>
            Redeemed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
              No {activeTab === 'earned' ? 'Earnings' : 'Redemptions'} Yet
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'earned'
                ? 'Your earned tokens will appear here once you spin.'
                : 'Your redeemed tokens will appear here once you redeem some.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) => `${activeTab}-${index}`}
            renderItem={renderHistoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  headerRight: { width: 28 },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#065F46' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  activeTabText: { color: '#FFFFFF', fontWeight: '600' },

  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, fontSize: 13, color: '#6B7280' },
  listContent: { padding: 16 },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { marginRight: 12 },
  historyIcon: { width: 40, height: 40, borderRadius: 8 },
  textContainer: { flex: 1 },
  sourceText: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#6B7280' },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  tokenIcon: { width: 16, height: 16, marginRight: 4 },
  tokenText: { fontSize: 13, fontWeight: '700', color: '#065F46' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
});
