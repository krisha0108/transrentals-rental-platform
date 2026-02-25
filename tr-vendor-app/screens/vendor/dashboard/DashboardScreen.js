import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVendorProfile, getVendorBookings, getVendorEarnings } from '../../api/client';
import { NotifBadgeContext } from '../../../contexts/NotifBadgeContext';

// Color scheme from old app (user likes this)
const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  card: '#F9FAFB',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  red: '#EF4444',
  yellow: '#F59E0B',
  chipBg: '#F3F4F6',
  chipActiveBg: '#DCFCE7',
  chipActiveBorder: '#86EFAC',
};

const { width: screenWidth } = Dimensions.get('window');

// Vendor Status Constants
const VENDOR_STATUS = {
  PENDING: 'PENDING',
  DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  SUSPENDED: 'SUSPENDED',
};

// Service IDs mapping
const SERVICE_IDS = {
  BIKE: 'SVC_1',
  SELF_DRIVE: 'SVC_2',
  BUS: 'SVC_3',
  TRANSPORTER: 'SVC_4',
  CAR_RENTAL: 'SVC_5',
  PACKERS: 'SVC_6',
  EQUIPMENT: 'SVC_7',
  LUXURY: 'SVC_8',
};

export default function DashboardScreen({ navigation }) {
  const { unreadCount } = React.useContext(NotifBadgeContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      // Get stored vendor data
      const vendorStr = await AsyncStorage.getItem('vendor');
      if (vendorStr) {
        setVendor(JSON.parse(vendorStr));
      }

      // Fetch profile from API
      const profileData = await getVendorProfile();
      if (profileData) {
        setProfile(profileData);
        // Update stored vendor data
        await AsyncStorage.setItem('vendor', JSON.stringify(profileData));
        setVendor(profileData);
      }

      // Fetch earnings if approved
      if (profileData?.status === 'APPROVED') {
        try {
          const earningsRes = await getVendorEarnings();
          if (earningsRes?.success) {
            setEarnings(earningsRes.earnings);
            setBookingsData(earningsRes.bookings);
          }
        } catch (e) {
          // silently fail
        }

        // Fetch recent bookings
        try {
          const bookingsRes = await getVendorBookings({ limit: 5 });
          if (bookingsRes?.bookings) {
            setRecentBookings(bookingsRes.bookings.slice(0, 5));
          }
        } catch (e) {
          // silently fail
        }
      }
    } catch (error) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const vendorStatus = profile?.status || vendor?.status || VENDOR_STATUS.PENDING;
  const isApproved = vendorStatus === VENDOR_STATUS.APPROVED;
  const approvedServiceIds = profile?.approvedServiceIds || [];

  // Check if vendor has specific service approved
  const hasService = (serviceId) => approvedServiceIds.includes(serviceId);

  const getStatusSteps = () => {
    const steps = [
      { id: 1, name: 'Registration', status: 'completed' },
      {
        id: 2,
        name: 'Upload Documents',
        status:
          vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING
            ? 'current'
            : vendorStatus === VENDOR_STATUS.PENDING
            ? 'pending'
            : 'completed',
      },
      {
        id: 3,
        name: 'Under Review',
        status:
          vendorStatus === VENDOR_STATUS.UNDER_REVIEW
            ? 'current'
            : [VENDOR_STATUS.APPROVED, VENDOR_STATUS.REJECTED].includes(vendorStatus)
            ? 'completed'
            : 'pending',
      },
      {
        id: 4,
        name: 'Approval',
        status:
          vendorStatus === VENDOR_STATUS.APPROVED
            ? 'completed'
            : vendorStatus === VENDOR_STATUS.REJECTED
            ? 'rejected'
            : 'pending',
      },
    ];
    return steps;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case VENDOR_STATUS.APPROVED:
        return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
      case VENDOR_STATUS.DOCUMENTS_PENDING:
        return { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74' };
      case VENDOR_STATUS.UNDER_REVIEW:
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
      case VENDOR_STATUS.PENDING:
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case VENDOR_STATUS.REJECTED:
      case VENDOR_STATUS.SUSPENDED:
      case VENDOR_STATUS.BLOCKED:
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  // Quick actions for non-approved vendors
  const pendingQuickActions = [
    {
      name: 'Complete Profile',
      description: 'Add business details',
      icon: 'building',
      iconLib: 'feather',
      color: C.blue,
      route: 'ProfileScreen',
    },
    {
      name: 'Upload Documents',
      description: 'GST, PAN, and more',
      icon: 'file-text',
      iconLib: 'feather',
      color: C.purple,
      route: 'VendorDocuments',
    },
    {
      name: 'Request Services',
      description: 'Select services you offer',
      icon: 'layers',
      iconLib: 'feather',
      color: C.brand,
      route: 'VendorServices',
    },
    {
      name: 'Request Locations',
      description: 'Select cities you operate in',
      icon: 'map-pin',
      iconLib: 'feather',
      color: C.orange,
      route: 'VendorLocations',
    },
  ];

  // Stats for approved vendors (now includes booking data)
  const stats = [
    {
      label: 'Today',
      value: bookingsData?.today || 0,
      subLabel: 'Bookings',
      icon: 'calendar',
      color: C.brand,
      route: null,
    },
    {
      label: 'Active',
      value: bookingsData?.active || 0,
      subLabel: 'Ongoing',
      icon: 'zap',
      color: C.blue,
      route: 'BookingsListScreen',
    },
    {
      label: 'Vehicles',
      value: profile?.fleetsCount || 0,
      subLabel: 'Fleet',
      icon: 'truck',
      color: C.purple,
      route: 'FleetListScreen',
    },
    {
      label: 'Rating',
      value: profile?.rating?.toFixed(1) || '5.0',
      subLabel: `${profile?.totalRatings || 0} reviews`,
      icon: 'star',
      color: C.orange,
      route: null,
    },
  ];

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0';
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  // Service modules for approved vendors (only show approved services)
  const serviceModules = [
    {
      serviceId: SERVICE_IDS.BIKE,
      name: 'Bike Rentals',
      icon: 'motorbike',
      iconLib: 'mci',
      color: '#F59E0B',
      route: 'BikeHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.SELF_DRIVE,
      name: 'Self-Drive Cars',
      icon: 'car-side',
      iconLib: 'mci',
      color: '#3B82F6',
      route: 'SelfDriveHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.CAR_RENTAL,
      name: 'Car Rental',
      icon: 'car',
      iconLib: 'mci',
      color: '#10B981',
      route: 'CarRentalHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.LUXURY,
      name: 'Luxury Cars',
      icon: 'car-sports',
      iconLib: 'mci',
      color: '#8B5CF6',
      route: 'LuxuryHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.BUS,
      name: 'Bus & Tempo',
      icon: 'bus',
      iconLib: 'mci',
      color: '#EC4899',
      route: 'BusHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.TRANSPORTER,
      name: 'Transporter',
      icon: 'truck-delivery',
      iconLib: 'mci',
      color: '#EF4444',
      route: 'TruckHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.PACKERS,
      name: 'Packers & Movers',
      icon: 'package-variant',
      iconLib: 'mci',
      color: '#14B8A6',
      route: 'PackersHomeScreen',
    },
    {
      serviceId: SERVICE_IDS.EQUIPMENT,
      name: 'Equipment',
      icon: 'hammer-wrench',
      iconLib: 'mci',
      color: '#6366F1',
      route: 'EquipmentHomeScreen',
    },
  ];

  const approvedServiceModules = serviceModules.filter((m) =>
    hasService(m.serviceId)
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(vendorStatus);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroHello}>
                Hello <Text style={styles.heroName}>{profile?.businessName || vendor?.businessName || 'Vendor'}</Text>,
              </Text>
              <Text style={styles.heroSub}>
                {isApproved
                  ? 'Manage your fleet, services & grow your business'
                  : 'Complete your profile to start receiving bookings'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('NotificationsScreen')}
            >
              <Ionicons name="notifications-outline" size={20} color={C.brand} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              Status: {vendorStatus.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Non-Approved: Approval Progress */}
        {!isApproved && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Approval Progress</Text>
            <View style={styles.stepsContainer}>
              {getStatusSteps().map((step, index) => (
                <React.Fragment key={step.id}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        step.status === 'completed' && styles.stepCompleted,
                        step.status === 'current' && styles.stepCurrent,
                        step.status === 'rejected' && styles.stepRejected,
                      ]}
                    >
                      {step.status === 'completed' ? (
                        <Icon name="check" size={14} color="#fff" />
                      ) : step.status === 'current' ? (
                        <Icon name="clock" size={14} color="#fff" />
                      ) : step.status === 'rejected' ? (
                        <Icon name="x" size={14} color="#fff" />
                      ) : (
                        <Text style={styles.stepNumber}>{step.id}</Text>
                      )}
                    </View>
                    <Text style={styles.stepName}>{step.name}</Text>
                  </View>
                  {index < getStatusSteps().length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        step.status === 'completed' && styles.stepLineCompleted,
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Status Messages */}
            {vendorStatus === VENDOR_STATUS.DOCUMENTS_PENDING && (
              <TouchableOpacity
                style={[styles.statusMessage, { backgroundColor: '#FEF3C7' }]}
                onPress={() => navigation.navigate('VendorDocuments')}
              >
                <Icon name="alert-circle" size={18} color="#D97706" />
                <View style={styles.statusMessageContent}>
                  <Text style={[styles.statusMessageTitle, { color: '#92400E' }]}>
                    Documents Required
                  </Text>
                  <Text style={[styles.statusMessageText, { color: '#B45309' }]}>
                    Please upload your business documents to proceed.
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color="#D97706" />
              </TouchableOpacity>
            )}

            {vendorStatus === VENDOR_STATUS.UNDER_REVIEW && (
              <View style={[styles.statusMessage, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="clock" size={18} color="#2563EB" />
                <View style={styles.statusMessageContent}>
                  <Text style={[styles.statusMessageTitle, { color: '#1E40AF' }]}>
                    Under Review
                  </Text>
                  <Text style={[styles.statusMessageText, { color: '#1D4ED8' }]}>
                    Your documents are being reviewed. Usually takes 1-2 days.
                  </Text>
                </View>
              </View>
            )}

            {vendorStatus === VENDOR_STATUS.REJECTED && (
              <View style={[styles.statusMessage, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="x-circle" size={18} color="#DC2626" />
                <View style={styles.statusMessageContent}>
                  <Text style={[styles.statusMessageTitle, { color: '#991B1B' }]}>
                    Application Rejected
                  </Text>
                  <Text style={[styles.statusMessageText, { color: '#B91C1C' }]}>
                    {profile?.rejectionReason || 'Please contact support for more info.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Earnings Card - Only for approved vendors */}
        {isApproved && (
          <TouchableOpacity
            style={styles.earningsCard}
            onPress={() => navigation.navigate('EarningsScreen')}
            activeOpacity={0.8}
          >
            <View style={styles.earningsHeader}>
              <View>
                <Text style={styles.earningsLabel}>This Month's Earnings</Text>
                <Text style={styles.earningsAmount}>
                  ₹{formatCurrency(earnings?.thisMonth || 0)}
                </Text>
              </View>
              <View style={styles.earningsGrowth}>
                <Icon
                  name={earnings?.growth >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={earnings?.growth >= 0 ? '#22C55E' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.earningsGrowthText,
                    { color: earnings?.growth >= 0 ? '#22C55E' : '#EF4444' },
                  ]}
                >
                  {Math.abs(earnings?.growth || 0)}%
                </Text>
              </View>
            </View>

            <View style={styles.earningsStats}>
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>
                  ₹{formatCurrency(earnings?.today || 0)}
                </Text>
                <Text style={styles.earningsStatLabel}>Today</Text>
              </View>
              <View style={styles.earningsStatDivider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>
                  ₹{formatCurrency(earnings?.pendingPayout || 0)}
                </Text>
                <Text style={styles.earningsStatLabel}>Pending Payout</Text>
              </View>
              <View style={styles.earningsStatDivider} />
              <View style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>
                  {bookingsData?.completed || 0}
                </Text>
                <Text style={styles.earningsStatLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.earningsFooter}>
              <Text style={styles.earningsFooterText}>View Detailed Earnings</Text>
              <Icon name="arrow-right" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>
          {isApproved ? 'Quick Stats' : 'Quick Actions'}
        </Text>
        <View style={styles.quickActionsGrid}>
          {(isApproved ? stats : pendingQuickActions).map((item, index) => {
            const IconComponent = item.iconLib === 'mci' ? MaterialCommunityIcons : Icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => item.route && navigation.navigate(item.route)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${item.color}14`, borderColor: `${item.color}33` },
                  ]}
                >
                  <IconComponent name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.quickActionValue}>
                  {isApproved ? item.value : null}
                </Text>
                <Text style={styles.quickActionLabel}>{item.label || item.name}</Text>
                <Text style={styles.quickActionSubLabel}>
                  {isApproved ? item.subLabel : item.description}
                </Text>
                {item.route && (
                  <View style={styles.quickActionArrow}>
                    <Icon name="arrow-up-right" size={14} color={C.muted} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Approved Vendors: Service Modules */}
        {isApproved && approvedServiceModules.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Services</Text>
            <View style={styles.servicesGrid}>
              {approvedServiceModules.map((service, index) => {
                const IconComponent =
                  service.iconLib === 'mci' ? MaterialCommunityIcons : Icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.serviceCard}
                    onPress={() => navigation.navigate(service.route)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.serviceIcon,
                        { backgroundColor: `${service.color}14` },
                      ]}
                    >
                      <IconComponent
                        name={service.icon}
                        size={24}
                        color={service.color}
                      />
                    </View>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Icon name="chevron-right" size={16} color={C.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Approved Vendors: Quick Actions Row */}
        {isApproved && (
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickActionsRow}
              contentContainerStyle={styles.quickActionsRowContent}
            >
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('AddVehicleScreen')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="plus-circle" size={18} color="#2563EB" />
                </View>
                <Text style={styles.quickActionBtnText}>Add Vehicle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('AddStaffScreen')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="user-plus" size={18} color="#8B5CF6" />
                </View>
                <Text style={styles.quickActionBtnText}>Add Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('VendorDocuments')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="folder" size={18} color="#22C55E" />
                </View>
                <Text style={styles.quickActionBtnText}>Documents</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('VendorServices')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Icon name="layers" size={18} color="#EF4444" />
                </View>
                <Text style={styles.quickActionBtnText}>Services</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('VendorLocations')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Icon name="map-pin" size={18} color="#4F46E5" />
                </View>
                <Text style={styles.quickActionBtnText}>Locations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('DirectBookings')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="book-open" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.quickActionBtnText}>Direct Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('BookingLinks')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Icon name="link-2" size={18} color="#6366F1" />
                </View>
                <Text style={styles.quickActionBtnText}>Booking Links</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Financials')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Icon name="bar-chart-2" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.quickActionBtnText}>Financials</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('P2PDashboard')}
              >
                <View style={[styles.quickActionBtnIcon, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color="#10B981" />
                </View>
                <Text style={styles.quickActionBtnText}>P2P Market</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {/* Approved Vendors: Manage Grid */}
        {isApproved && (
          <>
            <Text style={styles.sectionTitle}>Manage</Text>
            <View style={styles.manageGrid}>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('FleetListScreen')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Icon name="truck" size={18} color={C.blue} />
                </View>
                <Text style={styles.manageText}>Fleet</Text>
                <Text style={styles.manageCount}>{profile?.fleetsCount || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('StaffListScreen')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="users" size={18} color={C.purple} />
                </View>
                <Text style={styles.manageText}>Staff</Text>
                <Text style={styles.manageCount}>Manage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('ChatListScreen')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="message-circle" size={18} color={C.brand} />
                </View>
                <Text style={styles.manageText}>Chats</Text>
                <Text style={styles.manageCount}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('ProfileScreen')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="settings" size={18} color={C.orange} />
                </View>
                <Text style={styles.manageText}>Settings</Text>
                <Text style={styles.manageCount}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('DirectBookings')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Icon name="book-open" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.manageText}>Direct</Text>
                <Text style={styles.manageCount}>Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('BookingLinks')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Icon name="link-2" size={18} color="#6366F1" />
                </View>
                <Text style={styles.manageText}>Booking</Text>
                <Text style={styles.manageCount}>Links</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('Financials')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Icon name="bar-chart-2" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.manageText}>Financials</Text>
                <Text style={styles.manageCount}>P&L</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageCard}
                onPress={() => navigation.navigate('P2PDashboard')}
              >
                <View style={[styles.manageCardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color="#10B981" />
                </View>
                <Text style={styles.manageText}>P2P</Text>
                <Text style={styles.manageCount}>Market</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Getting Started Guide (Non-approved) */}
        {!isApproved && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Getting Started Guide</Text>
            <View style={styles.guideList}>
              {[
                { step: 1, title: 'Complete Your Profile', desc: 'Add your business details and logo.' },
                { step: 2, title: 'Upload Documents', desc: 'GST, PAN, and business registration.' },
                { step: 3, title: 'Request Services & Locations', desc: 'Select what services you offer and where.' },
                { step: 4, title: 'Add Your Fleet', desc: 'Once approved, add vehicles with photos.' },
              ].map((item) => (
                <View key={item.step} style={styles.guideItem}>
                  <View style={styles.guideNumber}>
                    <Text style={styles.guideNumberText}>{item.step}</Text>
                  </View>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>{item.title}</Text>
                    <Text style={styles.guideDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Hero Section
  hero: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  heroHello: {
    fontSize: 18,
    color: C.text,
    fontWeight: '600',
  },
  heroName: {
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: C.brand,
  },
  stepCurrent: {
    backgroundColor: C.blue,
  },
  stepRejected: {
    backgroundColor: C.red,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: C.muted,
  },
  stepName: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },
  stepLine: {
    flex: 0.5,
    height: 2,
    backgroundColor: C.border,
    marginBottom: 24,
  },
  stepLineCompleted: {
    backgroundColor: C.brand,
  },

  // Status Message
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statusMessageContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  statusMessageTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusMessageText: {
    fontSize: 12,
    marginTop: 2,
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: C.brand,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  earningsGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earningsGrowthText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  earningsStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  earningsStat: {
    flex: 1,
    alignItems: 'center',
  },
  earningsStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  earningsStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  earningsStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  earningsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsFooterText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  quickActionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 2,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  quickActionSubLabel: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  quickActionArrow: {
    position: 'absolute',
    top: 14,
    right: 14,
  },

  // Services Grid
  servicesGrid: {
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },

  // Quick Actions Row (horizontal scroll)
  quickActionsRow: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  quickActionsRowContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickActionBtn: {
    alignItems: 'center',
    width: 72,
  },
  quickActionBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionBtnText: {
    fontSize: 10,
    color: C.text,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Manage Grid
  manageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  manageCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  manageText: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
    flex: 1,
  },
  manageCount: {
    fontSize: 11,
    color: C.muted,
  },

  // Guide List
  guideList: {
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
  },
  guideNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  guideDesc: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
});
