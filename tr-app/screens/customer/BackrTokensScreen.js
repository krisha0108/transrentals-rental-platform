// BackrTokensScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl,
  Animated, Easing, Image, TextInput, TouchableOpacity, Modal, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from '../api';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const Coin = ({ size = 80 }) => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateY = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] });
  const frontUri = `https://app.transrentals.in/assets/images/coin-front.png`;
  const backUri = `https://app.transrentals.in/assets/images/coin-back.png`;
  return (
    <View style={styles.coinWrap}>
      <Animated.View style={[styles.coin, { width: size, height: size, transform: [{ rotateY }, { translateY }] }]}>
        <Image source={{ uri: frontUri }} style={styles.coinFace} />
        <Image source={{ uri: backUri }} style={[styles.coinFace, styles.coinBack]} />
      </Animated.View>
    </View>
  );
};

const StatCard = ({ label, value, color = '#10B981' }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Section = ({ title, children, right }) => (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
    {children}
  </View>
);

export default function BackrTokensScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [wallet, setWallet] = useState('');
  const [initialWallet, setInitialWallet] = useState('');
  const hasWallet = useMemo(() => !!initialWallet?.trim(), [initialWallet]);
  const [earned, setEarned] = useState(0);
  const [redeemed, setRedeemed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemValue, setRedeemValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const navigation = useNavigation();
  
  const canSaveWallet = useMemo(
    () => wallet?.trim().length > 0 && wallet !== initialWallet,
    [wallet, initialWallet]
  );
  
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  
  const startPendingCountdown = () => {
    setCountdown(10);
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setPendingModalVisible(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const bootstrap = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customer');
      if (!customerData) throw new Error('No customer found in storage.');
      const customer = JSON.parse(customerData);
      setCustomerId(customer.id);
      await fetchData(customer.id, false);
    } catch (e) {
      console.log('bootstrap error:', e);
      Alert.alert('Error', 'Could not load customer.');
      setLoading(false);
    }
  };

  const fetchData = async (cid, silent = true) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/backr', { params: { customer_id: cid } });
      const w = data?.customer?.solana_wallet || '';
      console.log('wallet:', data);
      setWallet(w);
      setInitialWallet(w);
      setEarned(data?.tokens?.earned_tokens ?? 0);
      setRedeemed(data?.tokens?.redeemed_tokens ?? 0);
      setRemaining(data?.tokens?.remaining_tokens ?? 0);
    } catch (e) {
      console.log('GET /api/backr error:', e?.response?.data || e.message);
      Alert.alert('Error', 'Failed to load Backr data.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const onRefresh = () => {
    if (!customerId) return;
    setRefreshing(true);
    fetchData(customerId, true);
  };

  const handleSaveWallet = async () => {
    if (!wallet?.trim()) {
      Alert.alert('Wallet required', 'Please enter your Solana wallet address.');
      return;
    }
    if (wallet.trim().length > 44) {
      Alert.alert('Invalid Wallet', 'Wallet address must be up to 44 characters.');
      return;
    }
    try {
      setSavingWallet(true);
      await api.post('/backr/update-wallet', {
        customer_id: customerId,
        solana_wallet: wallet.trim(),
      });
      setInitialWallet(wallet.trim());
      Alert.alert('Saved', 'Solana wallet updated.');
    } catch (e) {
      console.log('POST /backr/update-wallet error:', e?.response?.data || e.message);
      const msg = e?.response?.data?.message || 'Could not update wallet. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSavingWallet(false);
    }
  };

  const openRedeem = () => {
    if (!wallet?.trim()) {
      Alert.alert('Wallet required', 'Please submit your Solana wallet address before redeeming tokens.');
      return;
    }
    if (!remaining || remaining <= 0) {
      Alert.alert('No tokens', 'You have no backer tokens to redeem.');
      return;
    }
    setRedeemValue('');
    setModalVisible(true);
  };

  const submitRedeem = async () => {
    const val = Number(redeemValue);
    if (!val || val < 1) {
      Alert.alert('Invalid amount', 'Enter a token amount of at least 1.');
      return;
    }
    if (val > remaining) {
      Alert.alert('Too many tokens', 'You cannot redeem more than your available tokens.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/backr/redeem', {
        customer_id: customerId,
        redeem_value: val,
      });
      setModalVisible(false);
      setPendingAmount(val);
      setPendingModalVisible(true);
      startPendingCountdown();
      fetchData(customerId, true);
    } catch (e) {
      console.log('POST /backr/redeem error:', e?.response?.data || e.message);
      const msg =
        e?.response?.data?.errors?.redeem_value?.[0] ||
        e?.response?.data?.errors?.redeem_error?.[0] ||
        e?.response?.data?.message ||
        'Could not submit redemption. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={20} color="#065F46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backr Tokens</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TokenHistoryScreen')}
              style={styles.historyButton}
            >
              <Text style={styles.historyText}>History</Text>
              <Icon name="chevron-forward" size={14} color="#10B981" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContent}>
            <Coin size={80} />
            <Text style={styles.balanceAmount}>{remaining}</Text>
            <Text style={styles.balanceSubtitle}>Backr Tokens</Text>
          </View>

          {/* Wallet Section */}
          {hasWallet ? (
            <View style={styles.walletDisplay}>
              <View style={styles.walletInfo}>
                <Icon name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.walletVerified}>Wallet Connected</Text>
              </View>
              <Text style={styles.walletAddress}>{initialWallet}</Text>
            </View>
          ) : (
            <View style={styles.walletInputSection}>
              <Text style={styles.walletLabel}>Connect Solana Wallet</Text>
              <TextInput
                placeholder="Enter wallet address"
                value={wallet}
                onChangeText={setWallet}
                style={styles.walletInput}
                maxLength={44}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                disabled={!canSaveWallet || savingWallet}
                onPress={handleSaveWallet}
                style={[styles.saveBtn, (!canSaveWallet || savingWallet) && styles.saveBtnDisabled]}
              >
                {savingWallet ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Connect Wallet</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <StatCard label="Total Earned" value={earned} color="#10B981" />
          <StatCard label="Total Redeemed" value={redeemed} color="#EF4444" />
          <StatCard label="Available" value={remaining} color="#3B82F6" />
        </View>

        {/* Action Cards */}
        <View style={styles.actionsGrid}>
          {/* Earn Card */}
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="add-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Earn Tokens</Text>
            </View>
            <Text style={styles.actionDescription}>
              Complete bookings to earn more Backr tokens
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('EarnBackrTasksScreen')}
            >
              <Text style={styles.actionButtonText}>Start Earning</Text>
            </TouchableOpacity>
          </View>

          {/* Redeem Card */}
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Icon name="gift" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Redeem Tokens</Text>
            </View>
            <Text style={styles.actionDescription}>
              Convert your tokens to rewards
            </Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.redeemButton]}
              onPress={openRedeem}
            >
              <Text style={styles.actionButtonText}>Redeem Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Icon name="information-circle" size={16} color="#6B7280" />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            • Earn 1 Backr token for every completed booking{'\n'}
            • Redeem tokens for exclusive rewards{'\n'}
            • Connect your Solana wallet to receive tokens
          </Text>
        </View>
      </ScrollView>

      {/* Redeem Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.select({ ios: 'padding', android: undefined })}>
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIcon}>
                  <Icon name="gift" size={24} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Redeem Tokens</Text>
                <Text style={styles.modalSubtitle}>
                  Available: <Text style={styles.bold}>{remaining}</Text> tokens
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount to Redeem</Text>
                <TextInput
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={redeemValue}
                  onChangeText={setRedeemValue}
                  style={styles.modalInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, submitting && styles.modalButtonDisabled]} 
                onPress={submitRedeem} 
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Confirm Redeem</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Pending Modal */}
      <Modal visible={pendingModalVisible} transparent animationType="fade" onRequestClose={() => setPendingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pendingModalContainer}>
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <View style={styles.successIcon}>
                  <Icon name="checkmark-circle" size={32} color="#10B981" />
                </View>
                <Text style={styles.pendingTitle}>Request Submitted</Text>
                <Text style={styles.pendingSubtitle}>
                  Redeeming <Text style={styles.bold}>{pendingAmount}</Text> tokens
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.pendingText}>Waiting for approval...</Text>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.countdownText}>Auto close in {countdown}s</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (timerRef.current) clearInterval(timerRef.current);
                      setPendingModalVisible(false);
                    }}
                    style={styles.okButton}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 2,
  },
  balanceContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 8,
  },
  balanceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  // Wallet Section
  walletDisplay: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletVerified: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  walletAddress: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  walletInputSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  walletInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  // Stats Overview
  statsOverview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  redeemButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  // Info Section
  infoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  // Coin Styles
  coinWrap: {
    alignItems: 'center',
  },
  coin: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinFace: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  coinBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.0,
  },
  bold: {
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  modalButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalCancel: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 14,
  },
  // Pending Modal
  pendingModalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  pendingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  okButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});