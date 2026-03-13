import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, deleteVehicle, debugAuthState, getBaseURL } from '../../api/client';
import { showConfirm, showError } from '../../../services/alertService';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEE2E2',
  orange: '#EA580C',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  indigo: '#4F46E5', indigoL: '#E0E7FF',
};

const { width } = Dimensions.get('window');

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicleId } = route.params || {};
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [vehicle, setVehicle]           = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [baseURL, setBaseURL]           = useState(null);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) return;
    let retries = 0;
    const maxRetries = 2;
    while (retries <= maxRetries) {
      try {
        if (retries === 0) await debugAuthState();
        const response = await apiGet(`/vendor/fleet/${vehicleId}`);
        const vehicleData = response.data?.vehicle || response.data;
        if (vehicleData) {
          if (vehicleData.images) {
            if (typeof vehicleData.images === 'string') {
              try { vehicleData.images = JSON.parse(vehicleData.images); } catch (e) {}
            }
          }
          vehicleData.brandName       = vehicleData.brands?.name || vehicleData.vehicle_models?.brands?.name || null;
          vehicleData.modelName       = vehicleData.vehicle_models?.name || vehicleData.model || null;
          vehicleData.serviceName     = vehicleData.services?.name || null;
          vehicleData.categoryName    = vehicleData.chauffeur_vehicle_categories?.name || vehicleData.vehicle_models?.chauffeur_vehicle_categories?.name || null;
          vehicleData.seatingCapacity = vehicleData.chauffeur_vehicle_categories?.seatingCapacity || vehicleData.vehicle_models?.chauffeur_vehicle_categories?.seatingCapacity || vehicleData.seatingCapacity || vehicleData.vehicle_models?.seatingCapacity || null;
          vehicleData.fuelType        = vehicleData.chauffeur_vehicle_categories?.fuelType || vehicleData.vehicle_models?.chauffeur_vehicle_categories?.fuelType || vehicleData.fuelType || vehicleData.vehicle_models?.fuelType || null;
          vehicleData.transmission    = vehicleData.chauffeur_vehicle_categories?.acType || vehicleData.vehicle_models?.chauffeur_vehicle_categories?.acType || vehicleData.transmission || vehicleData.vehicle_models?.transmission || null;
          vehicleData.year            = vehicleData.yearOfManufacture || vehicleData.year || null;
        }
        setVehicle(vehicleData);
        setLoading(false);
        setRefreshing(false);
        return;
      } catch (error) {
        if (error?.response?.status === 401 && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        showError(error?.response?.status === 401
          ? 'You do not have permission to view this vehicle.'
          : 'Failed to load vehicle details. Please try again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
  }, [vehicleId]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);
  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#022C22');
  }, []));

  useEffect(() => {
    const initBaseURL = async () => { const url = await getBaseURL(); setBaseURL(url); };
    initBaseURL();
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchVehicle(); };

  const handleDelete = () => {
    showConfirm('Delete Vehicle', 'Are you sure you want to delete this vehicle?', async () => {
      try { await deleteVehicle(vehicleId); navigation.goBack(); }
      catch (error) { showError('Failed to delete vehicle'); }
    }, { confirmText: 'Delete', destructive: true });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const hasValidValue = (value) => value != null && value !== '' && value !== 'N/A' && value !== '--';

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) return imagePath;
    const url = baseURL || 'https://transrentals.in';
    return `${url}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':   return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
      case 'booked':
      case 'on_trip':     return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
      case 'maintenance': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      default:            return { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };
    }
  };

  if (loading) return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
        <View style={st.heroTopSimple}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.heroTitle}>Vehicle Details</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>
      <View style={st.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </SafeAreaView>
  );

  if (!vehicle) return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
        <View style={st.heroTopSimple}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={st.heroTitle}>Vehicle Details</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>
      <View style={st.centered}>
        <Ionicons name="car-outline" size={64} color={C.border} />
        <Text style={{ fontSize: 16, color: C.muted, marginTop: 12 }}>Vehicle not found</Text>
      </View>
    </SafeAreaView>
  );

  const statusColors = getStatusColor(vehicle.status);

  const getAllImages = () => {
    const imageList = [];
    let featuredImageUrl = null;
    if (vehicle.vehicle_models?.sideImage) featuredImageUrl = vehicle.vehicle_models.sideImage;
    else if (vehicle.chauffeur_vehicle_categories?.image) featuredImageUrl = vehicle.chauffeur_vehicle_categories.image;
    if (featuredImageUrl) {
      imageList.push({ url: getFullImageUrl(featuredImageUrl), label: 'Featured', isFeatured: true });
    }
    if (vehicle.images) {
      if (Array.isArray(vehicle.images)) {
        vehicle.images.forEach((imgUrl, index) => {
          if (imgUrl) imageList.push({ url: getFullImageUrl(imgUrl), label: `Image ${index + 1}`, isFeatured: false });
        });
      } else if (typeof vehicle.images === 'object' && vehicle.images !== null) {
        const views = { front: 'Front View', back: 'Back View', leftSide: 'Left Side', rightSide: 'Right Side', inside: 'Interior' };
        Object.entries(views).forEach(([key, label]) => {
          if (vehicle.images[key]) imageList.push({ url: getFullImageUrl(vehicle.images[key]), label, isFeatured: false });
        });
      } else if (typeof vehicle.images === 'string') {
        imageList.push({ url: getFullImageUrl(vehicle.images), label: 'Vehicle Image', isFeatured: false });
      }
    }
    return imageList;
  };

  const allImages = getAllImages();
  const hasImages = allImages.length > 0;
  const pricing   = vehicle.fleetPricing?.[0] || {};
  const locations = vehicle.fleetLocations?.map(fl => fl.location).filter(Boolean) || [];

  const SPECS = [
    { icon: 'car',              color: C.blue,   bg: C.blueL,   label: 'Brand',        value: vehicle.brandName,       iconLib: 'mci' },
    { icon: 'car-side',         color: C.purple, bg: C.purpleL, label: 'Model',        value: vehicle.modelName,       iconLib: 'mci' },
    { icon: 'seat',             color: C.g700,   bg: C.g50,     label: 'Seats',        value: vehicle.seatingCapacity, iconLib: 'mci' },
    { icon: 'gas-station',      color: C.amber,  bg: C.amberL,  label: 'Fuel',         value: vehicle.fuelType,        iconLib: 'mci' },
    { icon: 'car-shift-pattern',color: C.red,    bg: C.redL,    label: 'Transmission', value: vehicle.transmission,    iconLib: 'mci' },
    { icon: 'calendar',         color: C.indigo, bg: C.indigoL, label: 'Year',         value: vehicle.year,            iconLib: 'mci' },
  ].filter(s => hasValidValue(s.value));

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
        <View style={[st.deco, { width: 160, height: 160, top: -60, right: -40, opacity: 0.07 }]} />
        <View style={st.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroMid}>
            <Text style={st.heroTitle} numberOfLines={1}>
              {[vehicle.brandName, vehicle.modelName].filter(Boolean).join(' ') || vehicle.categoryName || 'Vehicle'}
            </Text>
            <Text style={st.heroSub}>{vehicle.registrationNumber || 'No Registration'}</Text>
          </View>
          <TouchableOpacity style={st.deleteBtn} onPress={handleDelete}>
            <Icon name="trash-2" size={17} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
        <View style={st.heroBadges}>
          <View style={[st.statusBadge, { backgroundColor: statusColors.bg }]}>
            <View style={[st.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[st.statusTxt, { color: statusColors.text }]}>
              {vehicle.isActive === false ? 'INACTIVE' : 'ACTIVE'}
            </Text>
          </View>
          {vehicle.serviceName && (
            <View style={st.svcBadge}>
              <Text style={st.svcBadgeTxt}>{vehicle.serviceName}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
      >
        {/* ── IMAGE GALLERY ── */}
        <View style={st.galleryWrap}>
          {hasImages ? (
            <>
              <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                  setActiveImageIndex(index);
                }}
              >
                {allImages.map((img, index) => (
                  <View key={index} style={st.imageSlide}>
                    <Image source={{ uri: img.url }} style={st.vehicleImage} resizeMode="cover" />
                    {img.isFeatured && (
                      <View style={st.featuredBadge}>
                        <Icon name="star" size={11} color="#FFA500" />
                        <Text style={st.featuredText}>Featured</Text>
                      </View>
                    )}
                    <View style={st.imageLabel}>
                      <Text style={st.imageLabelText}>{img.label} ({index + 1}/{allImages.length})</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {allImages.length > 1 && (
                <View style={st.imageDots}>
                  {allImages.map((_, i) => (
                    <View key={i} style={[st.imageDot, activeImageIndex === i && st.imageDotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={st.imagePlaceholder}>
              <MaterialCommunityIcons name="car" size={48} color={C.muted} />
              <Text style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>No images</Text>
            </View>
          )}
        </View>

        {/* ── SERVICE INFO ── */}
        <View style={st.section}>
          <View style={st.secHead}>
            <View style={[st.secIcon, { backgroundColor: C.g50 }]}>
              <Icon name="tag" size={13} color={C.g700} />
            </View>
            <Text style={st.secTitle}>Service Info</Text>
          </View>
          <View style={st.infoRow}>
            {vehicle.serviceName && (
              <View style={st.infoChip}>
                <Ionicons name="car-sport" size={16} color={C.g700} />
                <View>
                  <Text style={st.infoChipLabel}>Service</Text>
                  <Text style={st.infoChipVal}>{vehicle.serviceName}</Text>
                </View>
              </View>
            )}
            {vehicle.categoryName && (
              <View style={st.infoChip}>
                <Ionicons name="grid" size={16} color={C.purple} />
                <View>
                  <Text style={st.infoChipLabel}>Category</Text>
                  <Text style={st.infoChipVal}>{vehicle.categoryName}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── SPECS GRID ── */}
        {SPECS.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View style={[st.secIcon, { backgroundColor: C.blueL }]}>
                <Icon name="sliders" size={13} color={C.blue} />
              </View>
              <Text style={st.secTitle}>Specifications</Text>
            </View>
            <View style={st.specsGrid}>
              {SPECS.map((spec, i) => (
                <View key={i} style={st.specItem}>
                  <View style={[st.specIcon, { backgroundColor: spec.bg }]}>
                    <MaterialCommunityIcons name={spec.icon} size={20} color={spec.color} />
                  </View>
                  <Text style={st.specLabel}>{spec.label}</Text>
                  <Text style={st.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ADDITIONAL DETAILS ── */}
        <View style={st.section}>
          <View style={st.secHead}>
            <View style={[st.secIcon, { backgroundColor: C.g50 }]}>
              <Icon name="info" size={13} color={C.g700} />
            </View>
            <Text style={st.secTitle}>Additional Details</Text>
          </View>
          <View style={st.detailsList}>
            {vehicle.color && (
              <View style={st.detailRow}>
                <View style={st.detailLeft}>
                  <Ionicons name="color-palette-outline" size={16} color={C.muted} />
                  <Text style={st.detailLabel}>Color</Text>
                </View>
                <Text style={st.detailValue}>{vehicle.color}</Text>
              </View>
            )}
            {vehicle.insuranceExpiry && (
              <View style={st.detailRow}>
                <View style={st.detailLeft}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={C.muted} />
                  <Text style={st.detailLabel}>Insurance Expiry</Text>
                </View>
                <Text style={st.detailValue}>{new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN')}</Text>
              </View>
            )}
            {vehicle.fitnessExpiry && (
              <View style={st.detailRow}>
                <View style={st.detailLeft}>
                  <Ionicons name="fitness-outline" size={16} color={C.muted} />
                  <Text style={st.detailLabel}>Fitness Expiry</Text>
                </View>
                <Text style={st.detailValue}>{new Date(vehicle.fitnessExpiry).toLocaleDateString('en-IN')}</Text>
              </View>
            )}
            {vehicle.permitExpiry && (
              <View style={st.detailRow}>
                <View style={st.detailLeft}>
                  <Ionicons name="document-text-outline" size={16} color={C.muted} />
                  <Text style={st.detailLabel}>Permit Expiry</Text>
                </View>
                <Text style={st.detailValue}>{new Date(vehicle.permitExpiry).toLocaleDateString('en-IN')}</Text>
              </View>
            )}
            <View style={[st.detailRow, { borderBottomWidth: 0 }]}>
              <View style={st.detailLeft}>
                <Ionicons name="time-outline" size={16} color={C.muted} />
                <Text style={st.detailLabel}>Added On</Text>
              </View>
              <Text style={st.detailValue}>
                {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN') : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── PRICING ── */}
        {(pricing.basePrice || pricing.perDayRate || pricing.perKmRate) && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View style={[st.secIcon, { backgroundColor: C.g50 }]}>
                <Icon name="dollar-sign" size={13} color={C.g700} />
              </View>
              <Text style={st.secTitle}>Pricing</Text>
            </View>
            <View style={st.pricingGrid}>
              {pricing.basePrice > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>Base Price</Text>
                  <Text style={st.pricingValue}>{formatCurrency(pricing.basePrice)}</Text>
                </View>
              )}
              {pricing.perDayRate > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>Per Day</Text>
                  <Text style={st.pricingValue}>{formatCurrency(pricing.perDayRate)}</Text>
                </View>
              )}
              {pricing.perKmRate > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>Per KM</Text>
                  <Text style={st.pricingValue}>{formatCurrency(pricing.perKmRate)}</Text>
                </View>
              )}
              {pricing.kmLimitPerDay > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>KM Limit/Day</Text>
                  <Text style={st.pricingValue}>{pricing.kmLimitPerDay} km</Text>
                </View>
              )}
              {pricing.extraKmCharge > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>Extra KM</Text>
                  <Text style={st.pricingValue}>{formatCurrency(pricing.extraKmCharge)}/km</Text>
                </View>
              )}
              {pricing.deposit > 0 && (
                <View style={st.pricingItem}>
                  <Text style={st.pricingLabel}>Deposit</Text>
                  <Text style={st.pricingValue}>{formatCurrency(pricing.deposit)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── LOCATIONS ── */}
        {locations.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View style={[st.secIcon, { backgroundColor: C.g50 }]}>
                <Icon name="map-pin" size={13} color={C.g700} />
              </View>
              <Text style={st.secTitle}>Operating Locations</Text>
            </View>
            <View style={st.locationsWrap}>
              {locations.map((location, i) => (
                <View key={i} style={st.locationChip}>
                  <Ionicons name="location" size={13} color={C.g700} />
                  <Text style={st.locationText}>{location.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── FEATURES ── */}
        {vehicle.features && vehicle.features.length > 0 && (
          <View style={st.section}>
            <View style={st.secHead}>
              <View style={[st.secIcon, { backgroundColor: C.g50 }]}>
                <Icon name="check-circle" size={13} color={C.g700} />
              </View>
              <Text style={st.secTitle}>Features</Text>
            </View>
            <View style={st.featuresWrap}>
              {vehicle.features.map((feature, i) => (
                <View key={i} style={st.featureChip}>
                  <Icon name="check" size={11} color={C.g700} />
                  <Text style={st.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── EDIT BUTTON ── */}
        <TouchableOpacity
          style={st.editBtn}
          onPress={() => navigation.navigate('AddVehicleScreen', { vehicleId, vehicle })}
        >
          <LinearGradient colors={[C.g800, C.g600]} style={st.editBtnGrad}>
            <Icon name="edit-2" size={18} color="#fff" />
            <Text style={st.editBtnTxt}>Edit Vehicle</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Hero */
  hero:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, overflow: 'hidden' },
  heroLoading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  heroTopSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  heroMid: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  deleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.25)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },

  heroBadges:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusTxt:   { fontSize: 11, fontWeight: '800' },
  svcBadge:    { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  svcBadgeTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },

  /* Gallery */
  galleryWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  imageSlide:  { width: width - 32, height: 200, position: 'relative' },
  vehicleImage:{ width: width - 32, height: 200 },
  featuredBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  featuredText:  { fontSize: 11, fontWeight: '600', color: '#fff' },
  imageLabel:    { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  imageLabelText:{ fontSize: 12, fontWeight: '600', color: '#fff', textAlign: 'center' },
  imagePlaceholder: { height: 180, backgroundColor: C.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  imageDots:     { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  imageDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  imageDotActive:{ backgroundColor: C.g600, width: 20 },

  /* Sections */
  section: { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  secIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  secTitle:{ fontSize: 13, fontWeight: '800', color: C.text },

  /* Service info */
  infoRow: { flexDirection: 'row', gap: 10, padding: 14 },
  infoChip:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, padding: 12, borderRadius: 12 },
  infoChipLabel: { fontSize: 10, color: C.muted, marginBottom: 2 },
  infoChipVal:   { fontSize: 13, fontWeight: '700', color: C.text },

  /* Specs */
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 },
  specItem:  { width: '30%', alignItems: 'center' },
  specIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  specLabel: { fontSize: 10, color: C.muted, marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },

  /* Details list */
  detailsList: { paddingHorizontal: 14 },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 14, color: C.muted },
  detailValue: { fontSize: 14, fontWeight: '700', color: C.text },

  /* Pricing */
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  pricingItem: { width: '47%', backgroundColor: C.bg, borderRadius: 12, padding: 12 },
  pricingLabel:{ fontSize: 11, color: C.muted, marginBottom: 4 },
  pricingValue:{ fontSize: 16, fontWeight: '800', color: C.g700 },

  /* Locations */
  locationsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  locationChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.g50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.g100 },
  locationText:  { fontSize: 13, color: C.g700, fontWeight: '600' },

  /* Features */
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  featureChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.g100 },
  featureText:  { fontSize: 12, color: C.g700, fontWeight: '600' },

  /* Edit button */
  editBtn:    { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  editBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  editBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
