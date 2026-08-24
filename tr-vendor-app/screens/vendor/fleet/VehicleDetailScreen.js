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
import { SC as T, G, rs, cardShadow, shade } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import AnimatedOrb from '../_shared/AnimatedOrb';

// Same key names this screen already uses everywhere below — only the
// values now come from the shared "Elevate" theme instead of hardcoded hex.
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  purple: T.purple, purpleL: T.purpleLight,
  indigo: T.indigo, indigoL: T.indigoLight,
};

// How far the summary ticket rides up over the hero's rounded bottom edge.
const TICKET_OVERLAP = 40;

const { width } = Dimensions.get('window');

/* ── Section wrapper ─────────────────────────────────────────────────────── */
const Section = ({ icon, title, iconBg, children }) => (
  <View style={s.card}>
    <View style={s.cardHead}>
      <View style={[s.cardIcon, iconBg && { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={s.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

/* ── Info row inside a card ──────────────────────────────────────────────── */
const InfoRow = ({ iconName, color, label, value, last }) => {
  const ic = color || C.muted;
  return (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.infoLeft}>
        <View style={[s.infoIconWrap, { backgroundColor: `${ic}18` }]}>
          <Ionicons name={iconName} size={15} color={ic} />
        </View>
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
};

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
    StatusBar.setBackgroundColor(C.g900);
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

  /* ── Loading ── */
  if (loading) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={s.heroSimple}>
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="car" size={16} color={C.g400} />
            <Text style={s.heroTitle}>Vehicle Details</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>
      <View style={s.centered}><ActivityIndicator size="large" color={C.g600} /></View>
    </SafeAreaView>
  );

  /* ── Not found ── */
  if (!vehicle) return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />
      <LinearGradient colors={G.hero} style={s.heroSimple}>
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="car" size={16} color={C.g400} />
            <Text style={s.heroTitle}>Vehicle Details</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>
      <View style={s.centered}>
        <View style={s.emptyIconWrap}>
          <Ionicons name="car-outline" size={44} color={C.g400} />
        </View>
        <Text style={s.emptyTitle}>Vehicle Not Found</Text>
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

  // Ticket "at a glance" stat — reuses the same pricing fields the Pricing
  // section below reads, just surfaces whichever one is most representative.
  const hasPricing = !!(pricing.basePrice || pricing.perDayRate || pricing.perKmRate);
  const glanceLabel = pricing.perDayRate ? 'PER DAY RATE' : pricing.basePrice ? 'BASE PRICE' : 'PER KM RATE';
  const glanceValue = pricing.perDayRate || pricing.basePrice || pricing.perKmRate || 0;

  const SPECS = [
    { icon: 'car',              color: C.blue,   bg: C.blueL,   label: 'Brand',        value: vehicle.brandName,       iconLib: 'mci' },
    { icon: 'car-side',         color: C.purple, bg: C.purpleL, label: 'Model',        value: vehicle.modelName,       iconLib: 'mci' },
    { icon: 'seat',             color: C.g700,   bg: C.g50,     label: 'Seats',        value: vehicle.seatingCapacity, iconLib: 'mci' },
    { icon: 'gas-station',      color: C.amber,  bg: C.amberL,  label: 'Fuel',         value: vehicle.fuelType,        iconLib: 'mci' },
    { icon: 'car-shift-pattern',color: C.red,    bg: C.redL,    label: 'Transmission', value: vehicle.transmission,    iconLib: 'mci' },
    { icon: 'calendar',         color: C.indigo, bg: C.indigoL, label: 'Year',         value: vehicle.year,            iconLib: 'mci' },
  ].filter(s => hasValidValue(s.value));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ══ Hero Header ══════════════════════════════════════════════════════ */}
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <AnimatedOrb style={s.deco1} />
        <AnimatedOrb style={s.deco2} delay={1200} dx={-10} dy={8} />

        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.titleWrap}>
            <MaterialCommunityIcons name="car" size={16} color={C.g400} />
            <Text style={s.heroTitle}>Vehicle Details</Text>
          </View>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Icon name="trash-2" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Identity block — which vehicle this is */}
        <View style={s.identityBlock}>
          <View style={s.identityIcon}>
            <MaterialCommunityIcons name="car-side" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: rs(12) }}>
            <Text style={s.identityLabel}>VEHICLE</Text>
            <Text style={s.identityName} numberOfLines={1}>
              {[vehicle.brandName, vehicle.modelName].filter(Boolean).join(' ') || vehicle.categoryName || 'Vehicle'}
            </Text>
            <Text style={s.identitySub} numberOfLines={1}>{vehicle.registrationNumber || 'No Registration'}</Text>
          </View>
        </View>

        {vehicle.serviceName && (
          <View style={s.heroBadgeRow}>
            <View style={s.svcBadge}>
              <Ionicons name="pricetag" size={11} color="#fff" />
              <Text style={s.svcBadgeTxt}>{vehicle.serviceName}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ══ Body ═════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g400} />}
      >
        {/* ── At-a-glance ticket — registration, status & (optional) rate ── */}
        <View style={s.ticketWrap}>
          <LinearGradient
            colors={[statusColors.dot, shade(statusColors.dot, -18)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.ticketRail}
          />
          <View style={s.ticketUpperStub}>
            <View style={s.ticketIconBox}>
              <MaterialCommunityIcons name="card-text-outline" size={20} color={C.g700} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.ticketLabel}>REGISTRATION</Text>
              <Text style={s.ticketNumber} numberOfLines={1}>{vehicle.registrationNumber || 'No Registration'}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusColors.bg }]}>
              <View style={[s.statusDot, { backgroundColor: statusColors.dot }]} />
              <Text style={[s.statusPillTxt, { color: statusColors.text }]}>
                {vehicle.isActive === false ? 'INACTIVE' : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {hasPricing && (
            <>
              <View style={s.perforationRow}>
                <View style={s.notchLeft} />
                <View style={s.dashLine} />
                <View style={s.notchRight} />
              </View>
              <View style={s.ticketLowerStub}>
                <View style={s.moneyIconWrap}>
                  <Ionicons name="cash" size={16} color={C.g700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ticketAmountLabel}>{glanceLabel}</Text>
                  <Text style={s.ticketAmountVal}>{formatCurrency(glanceValue)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Image Gallery ── */}
        {hasImages && (
          <View style={s.galleryHeadRow}>
            <View style={s.cardIcon}><Ionicons name="images-outline" size={15} color={C.g700} /></View>
            <Text style={s.cardTitle}>Vehicle Images</Text>
          </View>
        )}
        <View style={hasImages ? s.galleryWrap : s.imagePlaceholder}>
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
                  <View key={index} style={s.imageSlide}>
                    <Image source={{ uri: img.url }} style={s.vehicleImage} resizeMode="cover" />
                    {img.isFeatured && (
                      <View style={s.featuredBadge}>
                        <Icon name="star" size={11} color="#FFA500" />
                        <Text style={s.featuredText}>Featured</Text>
                      </View>
                    )}
                    <View style={s.imageLabel}>
                      <Text style={s.imageLabelText}>{img.label} ({index + 1}/{allImages.length})</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              {allImages.length > 1 && (
                <View style={s.imageDots}>
                  {allImages.map((_, i) => (
                    <View key={i} style={[s.imageDot, activeImageIndex === i && s.imageDotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="car" size={44} color={C.muted} />
              <Text style={s.imagePlaceholderTxt}>No images</Text>
            </>
          )}
        </View>

        {/* ── Service Info ── */}
        <Section icon={<Icon name="tag" size={14} color={C.g700} />} title="Service Info">
          <View style={s.infoChipRow}>
            {vehicle.serviceName && (
              <View style={s.infoChip}>
                <Ionicons name="car-sport" size={16} color={C.g700} />
                <View>
                  <Text style={s.infoChipLabel}>Service</Text>
                  <Text style={s.infoChipVal}>{vehicle.serviceName}</Text>
                </View>
              </View>
            )}
            {vehicle.categoryName && (
              <View style={s.infoChip}>
                <Ionicons name="grid" size={16} color={C.purple} />
                <View>
                  <Text style={s.infoChipLabel}>Category</Text>
                  <Text style={s.infoChipVal}>{vehicle.categoryName}</Text>
                </View>
              </View>
            )}
          </View>
        </Section>

        {/* ── Specifications ── */}
        {SPECS.length > 0 && (
          <Section icon={<Icon name="sliders" size={14} color={C.blue} />} title="Specifications" iconBg={C.blueL}>
            <View style={s.specsGrid}>
              {SPECS.map((spec, i) => (
                <View key={i} style={s.specItem}>
                  <View style={[s.specIcon, { backgroundColor: spec.bg }]}>
                    <MaterialCommunityIcons name={spec.icon} size={20} color={spec.color} />
                  </View>
                  <Text style={s.specLabel}>{spec.label}</Text>
                  <Text style={s.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Additional Details ── */}
        <Section icon={<Icon name="info" size={14} color={C.g700} />} title="Additional Details">
          <View>
            {vehicle.color && (
              <InfoRow iconName="color-palette-outline" color={C.muted} label="Color" value={vehicle.color} />
            )}
            {vehicle.insuranceExpiry && (
              <InfoRow iconName="shield-checkmark-outline" color={C.muted} label="Insurance Expiry" value={new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN')} />
            )}
            {vehicle.fitnessExpiry && (
              <InfoRow iconName="fitness-outline" color={C.muted} label="Fitness Expiry" value={new Date(vehicle.fitnessExpiry).toLocaleDateString('en-IN')} />
            )}
            {vehicle.permitExpiry && (
              <InfoRow iconName="document-text-outline" color={C.muted} label="Permit Expiry" value={new Date(vehicle.permitExpiry).toLocaleDateString('en-IN')} />
            )}
            <InfoRow
              iconName="time-outline" color={C.muted} label="Added On"
              value={vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN') : '--'}
              last
            />
          </View>
        </Section>

        {/* ── Pricing ── */}
        {hasPricing && (
          <Section icon={<Icon name="dollar-sign" size={14} color={C.g700} />} title="Pricing">
            <View style={s.pricingGrid}>
              {pricing.basePrice > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>Base Price</Text>
                  <Text style={s.pricingValue}>{formatCurrency(pricing.basePrice)}</Text>
                </View>
              )}
              {pricing.perDayRate > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>Per Day</Text>
                  <Text style={s.pricingValue}>{formatCurrency(pricing.perDayRate)}</Text>
                </View>
              )}
              {pricing.perKmRate > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>Per KM</Text>
                  <Text style={s.pricingValue}>{formatCurrency(pricing.perKmRate)}</Text>
                </View>
              )}
              {pricing.kmLimitPerDay > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>KM Limit/Day</Text>
                  <Text style={s.pricingValue}>{pricing.kmLimitPerDay} km</Text>
                </View>
              )}
              {pricing.extraKmCharge > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>Extra KM</Text>
                  <Text style={s.pricingValue}>{formatCurrency(pricing.extraKmCharge)}/km</Text>
                </View>
              )}
              {pricing.deposit > 0 && (
                <View style={s.pricingItem}>
                  <Text style={s.pricingLabel}>Deposit</Text>
                  <Text style={s.pricingValue}>{formatCurrency(pricing.deposit)}</Text>
                </View>
              )}
            </View>
          </Section>
        )}

        {/* ── Operating Locations ── */}
        {locations.length > 0 && (
          <Section icon={<Icon name="map-pin" size={14} color={C.g700} />} title="Operating Locations">
            <View style={s.locationsWrap}>
              {locations.map((location, i) => (
                <View key={i} style={s.locationChip}>
                  <Ionicons name="location" size={13} color={C.g700} />
                  <Text style={s.locationText}>{location.name}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Features ── */}
        {vehicle.features && vehicle.features.length > 0 && (
          <Section icon={<Icon name="check-circle" size={14} color={C.g700} />} title="Features">
            <View style={s.featuresWrap}>
              {vehicle.features.map((feature, i) => (
                <View key={i} style={s.featureChip}>
                  <Icon name="check" size={11} color={C.g700} />
                  <Text style={s.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Edit Button ── */}
        <TouchableOpacity
          style={s.editBtn}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddVehicleScreen', { vehicleId, vehicle })}
        >
          <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.editBtnGrad}>
            <Icon name="edit-2" size={18} color="#fff" />
            <Text style={s.editBtnTxt}>Edit Vehicle</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },

  /* Hero */
  hero:       { paddingHorizontal: 16, paddingBottom: 22, overflow: 'hidden', borderBottomLeftRadius: rs(24), borderBottomRightRadius: rs(24) },
  heroSimple: { paddingHorizontal: 16, paddingBottom: 18, overflow: 'hidden' },
  deco1: {
    position: 'absolute', width: width * 0.55, height: width * 0.55,
    borderRadius: width * 0.275, backgroundColor: 'rgba(52,211,153,0.06)',
    top: -width * 0.18, right: -width * 0.1,
  },
  deco2: {
    position: 'absolute', width: width * 0.32, height: width * 0.32,
    borderRadius: width * 0.16, backgroundColor: 'rgba(16,185,129,0.05)',
    bottom: 0, left: width * 0.38,
  },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginBottom: 16 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,38,38,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  identityBlock: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  identityIcon: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  identityLabel: { fontSize: 9.5, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1.4, marginBottom: 3 },
  identityName:  { fontFamily: DISPLAY, fontSize: 19, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  identitySub:   { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 3 },

  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  svcBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  svcBadgeTxt:  { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: TICKET_OVERLAP, paddingBottom: 24 },

  /* Ticket summary */
  ticketWrap: {
    marginTop: -TICKET_OVERLAP, backgroundColor: C.card,
    borderRadius: rs(16), overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    marginBottom: 12, ...cardShadow,
  },
  ticketRail: { height: 3, width: '100%' },
  ticketUpperStub: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 14 },
  ticketIconBox: { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  ticketLabel: { fontSize: 9.5, color: C.muted, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  ticketNumber: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '900', color: C.text, letterSpacing: -0.3 },

  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  statusPillTxt: { fontSize: 11, fontWeight: '800' },

  perforationRow: { height: 2, justifyContent: 'center' },
  dashLine:  { marginHorizontal: 20, borderTopWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  notchLeft: { position: 'absolute', left: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },
  notchRight:{ position: 'absolute', right: -9, top: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.bg },

  ticketLowerStub: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingTop: 14 },
  moneyIconWrap: { width: rs(30), height: rs(30), borderRadius: rs(9), backgroundColor: C.g50, alignItems: 'center', justifyContent: 'center' },
  ticketAmountLabel: { fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  ticketAmountVal:   { fontFamily: DISPLAY, fontSize: 22, fontWeight: '900', color: C.g700, letterSpacing: -0.4 },

  /* Gallery */
  galleryHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  galleryWrap: { borderRadius: rs(16), overflow: 'hidden', marginBottom: 12, ...cardShadow },
  imageSlide:  { width: width - 32, height: 200, position: 'relative' },
  vehicleImage:{ width: width - 32, height: 200 },
  featuredBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  featuredText:  { fontSize: 11, fontWeight: '600', color: '#fff' },
  imageLabel:    { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  imageLabelText:{ fontSize: 12, fontWeight: '600', color: '#fff', textAlign: 'center' },
  imagePlaceholder: { height: 180, backgroundColor: C.card, borderRadius: rs(16), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  imagePlaceholderTxt: { fontSize: 14, color: C.muted, marginTop: 8 },
  imageDots:     { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  imageDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  imageDotActive:{ backgroundColor: C.g600, width: 20 },

  /* Card / Section */
  card: {
    backgroundColor: C.card, borderRadius: rs(16), padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  cardHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g50 },
  cardTitle: { fontFamily: DISPLAY, fontSize: 14.5, fontWeight: '800', color: C.text },

  /* Service info chips */
  infoChipRow: { flexDirection: 'row', gap: 10 },
  infoChip:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, padding: 12, borderRadius: rs(12) },
  infoChipLabel: { fontSize: 10, color: C.muted, marginBottom: 2 },
  infoChipVal:   { fontSize: 13, fontWeight: '700', color: C.text },

  /* Specs */
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specItem:  { width: '30%', alignItems: 'center' },
  specIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  specLabel: { fontSize: 10, color: C.muted, marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },

  /* InfoRow (details list) */
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIconWrap:{ width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoLabel:   { fontSize: 13.5, color: C.sub },
  infoValue:   { fontSize: 13.5, fontWeight: '700', color: C.text },

  /* Pricing */
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pricingItem: { width: '47%', backgroundColor: C.bg, borderRadius: rs(12), padding: 12 },
  pricingLabel:{ fontSize: 11, color: C.muted, marginBottom: 4 },
  pricingValue:{ fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.g700 },

  /* Locations */
  locationsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.g50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.g100 },
  locationText:  { fontSize: 13, color: C.g700, fontWeight: '600' },

  /* Features */
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.g50, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.g100 },
  featureText:  { fontSize: 12, color: C.g700, fontWeight: '600' },

  /* Edit button */
  editBtn:    { marginTop: 8, borderRadius: rs(14), overflow: 'hidden' },
  editBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  editBtnTxt: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: '#fff' },

  /* Empty */
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.g50, justifyContent: 'center', alignItems: 'center' },
  emptyTitle:    { fontFamily: DISPLAY, fontSize: 16, fontWeight: '800', color: C.text, marginTop: 4 },
});
