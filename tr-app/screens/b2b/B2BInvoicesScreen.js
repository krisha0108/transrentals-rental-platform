import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Dimensions, Platform,} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { b2bService } from '../services';

const { width } = Dimensions.get('window');
const scale = (size) => (size * width) / 375;

const STATUS_CONFIG = {
  GENERATED: { color: '#F59E0B', icon: 'file-text' },
  SENT: { color: '#3B82F6', icon: 'send' },
  PAID: { color: '#22C55E', icon: 'check-circle' },
  OVERDUE: { color: '#EF4444', icon: 'alert-circle' },
  CANCELLED: { color: '#999', icon: 'x-circle' },
};

export default function B2BInvoicesScreen({ navigation }) {
  /* -- StatusBar management (light top bar, needs dark icons) -- */
  useFocusEffect(
    useCallback(() => {
      SystemBars.setStyle('dark');
      return () => {
        SystemBars.setStyle('dark');
      };
    }, [])
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadInvoices = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await b2bService.getInvoices(params);
      setInvoices(res?.invoices || []);
    } catch (err) {
      console.log('Load invoices error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); loadInvoices(); }, [loadInvoices]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatCurrency = (amt) => amt ? `Rs. ${Number(amt).toLocaleString('en-IN')}` : 'Rs. 0';

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'GENERATED', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  const renderInvoice = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.GENERATED;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('B2BInvoiceDetail', { invoiceId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: config.color + '15' }]}>
            <Icon name={config.icon} size={scale(18)} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
            <Text style={styles.companyName}>{item.companyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicles</Text>
            <Text style={styles.detailValue}>{item.totalVehicles || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Generated</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.dueDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={[styles.detailValue, item.status === 'OVERDUE' && { color: '#EF4444', fontWeight: '700' }]}>
                {formatDate(item.dueDate)}
              </Text>
            </View>
          )}
        </View>

        {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => navigation.navigate('B2BInvoiceDetail', { invoiceId: item.id })}
          >
            <Icon name="credit-card" size={scale(14)} color="#fff" />
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={scale(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B2B Invoices</Text>
        <View style={{ width: scale(22) }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#22C55E" /></View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInvoices(); }} colors={['#22C55E']} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="file-text" size={scale(50)} color="#ddd" />
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    paddingBottom: scale(20),
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: scale(18), fontWeight: '700', color: '#1A1A1A' },
  filterRow: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: scale(10),
    paddingHorizontal: scale(16), gap: scale(8), borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flex: 1, paddingVertical: scale(8), borderRadius: scale(10),
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  filterTabActive: { backgroundColor: '#22C55E' },
  filterText: { fontSize: scale(12), fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#fff' },
  listContent: { padding: scale(16), paddingBottom: scale(100) },
  card: {
    backgroundColor: '#fff', borderRadius: scale(14), padding: scale(16),
    marginBottom: scale(12), elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(12), gap: scale(10) },
  iconBox: { width: scale(40), height: scale(40), borderRadius: scale(10), alignItems: 'center', justifyContent: 'center' },
  invoiceNum: { fontSize: scale(14), fontWeight: '700', color: '#333' },
  companyName: { fontSize: scale(11), color: '#999', marginTop: scale(2) },
  statusBadge: { paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(10) },
  statusText: { fontSize: scale(10), fontWeight: '700' },
  cardBody: { gap: scale(6), borderTopWidth: 0.5, borderTopColor: '#f0f0f0', paddingTop: scale(10) },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: scale(12), color: '#666' },
  detailValue: { fontSize: scale(12), fontWeight: '500', color: '#333' },
  amountText: { fontSize: scale(16), fontWeight: '800', color: '#22C55E' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#22C55E', borderRadius: scale(10), paddingVertical: scale(10),
    marginTop: scale(12), gap: scale(6),
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: scale(13) },
  emptyText: { fontSize: scale(14), color: '#999', marginTop: scale(12) },
});
