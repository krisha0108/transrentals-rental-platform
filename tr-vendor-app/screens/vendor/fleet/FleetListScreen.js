import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorFleet, deleteVehicle, getBaseURL } from '../../api/client';
import { showConfirm, showError, showSuccess } from '../../../services/alertService';
import { useVerificationGate, VerificationBanner } from '../../../components/VerificationGate';
import { SC as T, G, rs, shade, cardShadow } from '../_shared/theme';
import { DISPLAY } from '../_shared/typography';
import CornerGrid from '../_shared/CornerGrid';

const Bone = ({ w, h, r = 8, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#DDE4EE' }, style]} />
);

// Same key names this screen already used — only the values now come from
// the shared "Elevate" theme instead of hardcoded hex. Matches the mapping
// convention established in AddVehicleScreen.js (same folder).
const C = {
  g900: T.forestDark, g800: T.forest, g700: T.emeraldDeep, g600: T.emerald600,
  g500: T.emerald500, g400: T.emerald, g100: T.tintEmerald, g50: T.tintEmerald,
  bg: T.bg, card: T.card, border: T.border,
  text: T.ink, sub: T.text, muted: T.subText,
  blue: T.blue, blueL: T.blueLight,
  amber: T.amber, amberL: T.amberLight,
  red: T.red, redL: T.redLight,
  orange: T.orange, orangeL: T.orangeL,
  indigo: T.indigo, indigoL: T.indigoLight,
  purple: T.purple, purpleL: T.purpleLight,
  pink: T.rose, pinkL: T.roseLight,
  teal: T.teal, tealL: T.tintOcean,
  cyan: shade(T.ocean, 25), cyanL: T.tintOcean,
};

const VEHICLE_ICONS = {
  car: 'car-side', bike: 'motorbike', bus: 'bus',
  truck: 'truck-delivery', tempo: 'truck', default: 'car',
};

const SERVICE_CONFIG = {
  'bike-rental':       { icon: 'motorbike',        color: C.blue,   label: 'Bike Rental',      shortLabel: 'Bike' },
  'self-drive':        { icon: 'car',               color: C.g700,   label: 'Self Drive',       shortLabel: 'Self Drive' },
  'self-drive-car-rental': { icon: 'car',           color: C.g700,   label: 'Self Drive',       shortLabel: 'Self Drive' },
  'car-rental':        { icon: 'car-side',          color: C.red,    label: 'Car Rental',       shortLabel: 'Car Rental' },
  'bus-rental':        { icon: 'bus',               color: C.amber,  label: 'Bus Rental',       shortLabel: 'Bus' },
  'truck-rental':      { icon: 'truck-delivery',    color: C.purple, label: 'Truck Rental',     shortLabel: 'Truck' },
  'truck-transporter': { icon: 'truck-delivery',    color: C.purple, label: 'Truck / Transporter', shortLabel: 'Truck' },
  'packers-movers':    { icon: 'package-variant',   color: C.pink,   label: 'Packers & Movers', shortLabel: 'Packers' },
  'equipment-rental':  { icon: 'crane',             color: C.cyan,   label: 'Equipment Rental', shortLabel: 'Equipment' },
  'luxury-car-rental': { icon: 'car-sports',        color: C.indigo, label: 'Luxury Cars',      shortLabel: 'Luxury' },
  default:             { icon: 'car',               color: C.muted,  label: 'Other',            shortLabel: 'Other' },
};

/* ── Illustrated empty state ──────────────────────────────────────────── */
const FleetEmptyState = ({ noneAtAll, onAddVehicle, addIcon }) => (
  <View style={styles.emptyCardWrap}>
    <View style={styles.emptyArt}>
      <View style={styles.emptyArtCardBack} />
      <View style={styles.emptyArtCard}>
        <Ionicons name={noneAtAll ? 'car-outline' : 'search'} size={rs(40)} color={C.g400} />
      </View>
      <View style={styles.emptyArtDot} />
      <View style={styles.emptyArtTag}>
        <Text style={styles.emptyArtTagTxt}>{noneAtAll ? 'EMPTY' : 'NO MATCH'}</Text>
      </View>
    </View>

    <Text style={styles.emptyTitle}>No Vehicles Found</Text>
    <Text style={styles.emptyBody}>
      {noneAtAll ? 'Add your first vehicle to get started' : 'No vehicles match your filters'}
    </Text>

    {noneAtAll && (
      <TouchableOpacity style={styles.emptyCtaWrap} onPress={onAddVehicle} activeOpacity={0.9}>
        <LinearGradient colors={G.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyCta}>
          <Icon name={addIcon} size={16} color="#fff" />
          <Text style={styles.emptyCtaText}>Add Vehicle</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

export default function FleetListScreen({ navigation }) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [vehicles, setVehicles]       = useState([]);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [baseURL, setBaseURL]         = useState(null);

  const fetchFleet = useCallback(async () => {
    try {
      const response = await getVendorFleet();
      const fleetData = response?.fleet || response?.vehicles || [];
      setVehicles(fleetData);
    } catch (error) {
      console.log('Error fetching fleet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFleet(); }, [fetchFleet]);

  useEffect(() => {
    const initBaseURL = async () => {
      const url = await getBaseURL();
      setBaseURL(url);
    };
    initBaseURL();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFleet();
    }, [fetchFleet])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFleet();
    setRefreshing(false);
  }, [fetchFleet]);

  // Verification gate — pending vendors can browse the fleet list but
  // Add / Delete actions are locked behind a verification prompt.
  const { status: vendorStatus, gate, LockGateModal } = useVerificationGate(navigation);

  const handleDeleteVehicle = (vehicleId) => {
    showConfirm('Delete Vehicle', 'Are you sure you want to delete this vehicle?', async () => {
      try {
        await deleteVehicle(vehicleId);
        await fetchFleet();
      } catch (error) {
        showError('Failed to delete vehicle');
      }
    }, { confirmText: 'Delete', destructive: true });
  };

  const getServiceConfig = (vehicle) => {
    if (!vehicle?.services) return SERVICE_CONFIG.default;
    const slug = vehicle.services.slug?.toLowerCase() || '';
    const name = vehicle.services.name?.toLowerCase() || '';
    if (slug.includes('packer') || slug.includes('mover') || name.includes('packer') || name.includes('mover')) return SERVICE_CONFIG['packers-movers'];
    if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) return SERVICE_CONFIG['self-drive'];
    if (slug.includes('luxury') || name.includes('luxury')) return SERVICE_CONFIG['luxury-car-rental'];
    if (slug.includes('bike') || name.includes('bike')) return SERVICE_CONFIG['bike-rental'];
    if (slug.includes('bus') || name.includes('bus')) return SERVICE_CONFIG['bus-rental'];
    if (slug.includes('truck') || slug.includes('transporter') || name.includes('truck') || name.includes('transporter')) return SERVICE_CONFIG['truck-rental'];
    if (slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb') || name.includes('equipment') || name.includes('crane')) return SERVICE_CONFIG['equipment-rental'];
    if (slug.includes('car-rental') || slug.includes('chauffeur') || name.includes('car rental') || name.includes('chauffeur')) return SERVICE_CONFIG['car-rental'];
    return SERVICE_CONFIG.default;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':   return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
      case 'booked':
      case 'on_trip':     return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
      case 'maintenance': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case 'inactive':    return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
      default:            return { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };
    }
  };

  const getNormalizedServiceSlug = (vehicle) => {
    if (!vehicle?.services) return 'default';
    const slug = vehicle.services.slug?.toLowerCase() || '';
    const name = vehicle.services.name?.toLowerCase() || '';
    if (slug.includes('packer') || slug.includes('mover') || name.includes('packer') || name.includes('mover')) return 'packers-movers';
    if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) return 'self-drive';
    if (slug.includes('luxury') || name.includes('luxury')) return 'luxury-car-rental';
    if (slug.includes('bike') || name.includes('bike')) return 'bike-rental';
    if (slug.includes('bus') || name.includes('bus')) return 'bus-rental';
    if (slug.includes('truck') || slug.includes('transporter') || name.includes('truck') || name.includes('transporter')) return 'truck-rental';
    if (slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb') || name.includes('equipment') || name.includes('crane')) return 'equipment-rental';
    if (slug.includes('car-rental') || slug.includes('chauffeur') || name.includes('car rental') || name.includes('chauffeur')) return 'car-rental';
    return 'default';
  };

  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((v) => {
      const statusMatch = statusFilter === 'all' || v.status?.toLowerCase() === statusFilter;
      const normalizedSlug = getNormalizedServiceSlug(v);
      const serviceMatch = serviceFilter === 'all' || normalizedSlug === serviceFilter;
      return statusMatch && serviceMatch;
    });
  }, [vehicles, statusFilter, serviceFilter]);

  const availableServices = React.useMemo(() => {
    const servicesMap = new Map();
    vehicles.forEach((v) => {
      if (v.services) {
        const slug = v.services.slug?.toLowerCase() || '';
        const name = v.services.name?.toLowerCase() || '';
        let normalizedSlug = 'default';
        if (slug.includes('packer') || slug.includes('mover') || name.includes('packer') || name.includes('mover')) normalizedSlug = 'packers-movers';
        else if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) normalizedSlug = 'self-drive';
        else if (slug.includes('luxury') || name.includes('luxury')) normalizedSlug = 'luxury-car-rental';
        else if (slug.includes('bike') || name.includes('bike')) normalizedSlug = 'bike-rental';
        else if (slug.includes('bus') || name.includes('bus')) normalizedSlug = 'bus-rental';
        else if (slug.includes('truck') || slug.includes('transporter') || name.includes('truck') || name.includes('transporter')) normalizedSlug = 'truck-rental';
        else if (slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb') || name.includes('equipment') || name.includes('crane')) normalizedSlug = 'equipment-rental';
        else if (slug.includes('car-rental') || slug.includes('chauffeur') || name.includes('car rental') || name.includes('chauffeur')) normalizedSlug = 'car-rental';
        const serviceConfig = SERVICE_CONFIG[normalizedSlug] || SERVICE_CONFIG.default;
        if (!servicesMap.has(normalizedSlug)) {
          servicesMap.set(normalizedSlug, { slug: normalizedSlug, ...serviceConfig, count: 0 });
        }
        servicesMap.get(normalizedSlug).count += 1;
      }
    });
    return Array.from(servicesMap.values());
  }, [vehicles]);

  const statusFilters = [
    { key: 'all',         label: 'All' },
    { key: 'active',      label: 'Active' },
    { key: 'booked',      label: 'Booked' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  const FLEET_TOOLS = [
    { label: 'Documents',  icon: 'file-document-outline', color: C.blue,   bg: C.blueL,   screen: 'FleetDocumentsScreen' },
    { label: 'Fuel',       icon: 'gas-station',           color: C.amber,  bg: C.amberL,  screen: 'FuelTrackingScreen' },
    { label: 'Incidents',  icon: 'alert-circle-outline',  color: C.red,    bg: C.redL,    screen: 'IncidentsScreen' },
    { label: 'Service',    icon: 'wrench-outline',        color: C.g700,   bg: C.g50,     screen: 'ServiceMaintenanceScreen' },
  ];

  const renderVehicle = ({ item }) => {
    const statusColors  = getStatusColor(item.status);
    const serviceConfig = getServiceConfig(item);

    let vehicleName = 'Vehicle';
    if (item.vehicle_models?.brands?.name && item.vehicle_models?.name) {
      vehicleName = `${item.vehicle_models.brands.name} ${item.vehicle_models.name}`;
    } else if (item.brands?.name && item.chauffeur_vehicle_categories?.name) {
      vehicleName = `${item.brands.name} ${item.chauffeur_vehicle_categories.name}`;
    } else if (item.chauffeur_vehicle_categories?.name) {
      vehicleName = item.chauffeur_vehicle_categories.name;
    } else if (item.brands?.name) {
      vehicleName = item.brands.name;
    }

    const getFullImageUrl = (imagePath) => {
      if (!imagePath) return null;
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) return imagePath;
      const url = baseURL || 'https://transrentals.in';
      return `${url}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    const featuredImage = item.vehicle_models?.sideImage || item.chauffeur_vehicle_categories?.image;
    const imageUri = getFullImageUrl(featuredImage);

    const seatingCapacity = item.seatingCapacity || item.vehicle_models?.seatingCapacity || item.chauffeur_vehicle_categories?.seatingCapacity || null;
    const fuelType        = item.fuelType        || item.vehicle_models?.fuelType        || item.chauffeur_vehicle_categories?.fuelType        || null;

    return (
      <View style={styles.card}>
        {/* Accent rail — tinted by vehicle status, mirroring the compact
            booking-card template's status-tinted rail. */}
        <LinearGradient
          colors={[statusColors.dot, shade(statusColors.dot, -20)]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.cardRail}
        />

        <View style={styles.cardInner}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VehicleDetailScreen', { vehicleId: item.id })}
          >
            {/* Top stripe: icon/photo box + name + status pill + delete */}
            <View style={styles.cardTopStripe}>
              <View style={[styles.iconBox, { backgroundColor: serviceConfig.color + '15' }]}>
                {imageUri
                  ? <Image source={{ uri: imageUri }} style={styles.vehicleImg} resizeMode="cover" />
                  : <MaterialCommunityIcons name={serviceConfig.icon} size={rs(18)} color={serviceConfig.color} />
                }
              </View>

              <Text style={styles.cardName} numberOfLines={1}>{vehicleName}</Text>

              {item.status && (
                <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors.text }]} numberOfLines={1}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.vDel}
                onPress={(e) => { e.stopPropagation(); gate(() => handleDeleteVehicle(item.id), 'delete vehicles')(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="trash-2" size={13} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Body: registration + meta chips, aligned under the name */}
            <View style={styles.cardBody}>
              {item.registrationNumber && (
                <Text style={styles.regText}>{item.registrationNumber}</Text>
              )}

              <View style={styles.metaRow}>
                <View style={[styles.svcTag, { backgroundColor: serviceConfig.color + '15' }]}>
                  <MaterialCommunityIcons name={serviceConfig.icon} size={10} color={serviceConfig.color} />
                  <Text style={[styles.svcTagTxt, { color: serviceConfig.color }]}>{serviceConfig.shortLabel}</Text>
                </View>
                {seatingCapacity && (
                  <View style={styles.metaItem}>
                    <Icon name="users" size={10} color={C.muted} />
                    <Text style={styles.metaText}>{seatingCapacity}</Text>
                  </View>
                )}
                {fuelType && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="gas-station" size={11} color={C.muted} />
                    <Text style={styles.metaText}>{fuelType}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={G.hero} style={styles.headerLoading}>
          <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.topBar}>
              <Bone w={40} h={40} r={20} />
              <View style={styles.titleWrap}>
                <Bone w={90} h={11} r={4} style={{ marginBottom: 6 }} />
                <Bone w={90} h={17} r={5} />
              </View>
              <Bone w={40} h={40} r={20} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={[styles.overviewCard, { marginHorizontal: 16, marginTop: rs(14) }]}>
          <View style={styles.statsRow}>
            {[0,1,2,3].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statBox}>
                  <Bone w={26} h={17} r={4} style={{ marginBottom: 6 }} />
                  <Bone w={44} h={9} r={3} />
                </View>
              </React.Fragment>
            ))}
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.toolsInnerRow}>
            {[0,1,2,3].map(i => (
              <React.Fragment key={i}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.toolCol}>
                  <Bone w={34} h={34} r={10} />
                  <Bone w={40} h={9} r={3} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
          {[0,1,2,3].map(i => (
            <View key={i} style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: rs(14), borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
              <View style={{ width: 3, backgroundColor: '#DDE4EE' }} />
              <View style={{ flex: 1, padding: 11, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bone w={42} h={42} r={11} />
                  <Bone w={130} h={13} r={4} />
                  <Bone w={60} h={18} r={9} style={{ marginLeft: 'auto' }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Bone w={70} h={16} r={7} />
                  <Bone w={50} h={16} r={7} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const activeCount = vehicles.filter(v => v.status?.toLowerCase() === 'active').length;
  const bookedCount = vehicles.filter(v => v.status?.toLowerCase() === 'booked').length;
  const isFilteredEmpty = filteredVehicles.length === 0;
  const noneAtAll = vehicles.length === 0;
  const addIcon = vendorStatus === 'APPROVED' ? 'plus' : 'lock';

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={G.hero} style={styles.header}>
        <CornerGrid style={styles.headerDots} corner="top-right" lineColor="rgba(255,255,255,0.35)" cellSize={16} />
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="car-multiple" size={11} color={C.g400} />
                <Text style={styles.heroBadgeTxt}>Fleet Manager</Text>
              </View>
              <Text style={styles.headerTitle}>My Fleet</Text>
            </View>
            <TouchableOpacity
              style={styles.addCircle}
              onPress={gate(() => navigation.navigate('AddVehicleScreen'), 'add vehicles')}
              activeOpacity={0.85}
            >
              <Icon name={addIcon} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filters — fixed, always visible above the scrolling list */}
      <View style={styles.filtersFixed}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.svcScrollOuter} contentContainerStyle={styles.svcScroll}>
          {[{ slug:'all', icon:'car-multiple', color: C.g700, shortLabel:'All', count: vehicles.length }, ...availableServices].map(svc => {
            const isActive = serviceFilter === svc.slug;
            return (
              <TouchableOpacity
                key={svc.slug}
                style={[styles.svcChip, isActive && { backgroundColor: svc.color + '1A', borderColor: svc.color }]}
                onPress={() => setServiceFilter(svc.slug)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={svc.icon} size={13} color={isActive ? svc.color : C.muted} />
                <Text numberOfLines={1} style={[styles.svcChipTxt, isActive && { color: svc.color }]}>{svc.shortLabel}</Text>
                <Text style={[styles.svcChipCnt, isActive && { color: svc.color }]}>{svc.count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.statusRow}>
          {statusFilters.map(f => {
            const cnt = f.key === 'all' ? vehicles.length : vehicles.filter(v => v.status?.toLowerCase() === f.key).length;
            const isActive = statusFilter === f.key;
            const color = f.key === 'all' ? C.g600 : getStatusColor(f.key).dot;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.statusTab, isActive && { borderBottomColor: color }]}
                onPress={() => setStatusFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.statusTabTxt, isActive && { color, fontWeight: '800' }]}>{f.label}</Text>
                <View style={[styles.statusTabCnt, isActive && { backgroundColor: color }]}>
                  <Text style={[styles.statusTabCntTxt, isActive && { color: '#fff' }]}>{cnt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {(statusFilter !== 'all' || serviceFilter !== 'all') && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterTxt}>{filteredVehicles.length} result{filteredVehicles.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => { setStatusFilter('all'); setServiceFilter('all'); }}>
              <Text style={styles.clearFilterTxt}>Clear filters ×</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── VEHICLE LIST — stats/banner/tools scroll away with the list;
          filters above stay fixed so the active filter is always visible. ── */}
      <FlatList
        style={{ flex: 1 }}
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: rs(14), gap: 14 }}>
            {/* Fleet overview — one panel: stats on top, quick tools below */}
            <View style={styles.overviewCard}>
              <View style={styles.statsRow}>
                {[
                  { label: 'Total',    value: vehicles.length,            color: C.text  },
                  { label: 'Active',   value: activeCount,                color: C.g700  },
                  { label: 'Booked',   value: bookedCount,                color: C.blue  },
                  { label: 'Services', value: availableServices.length,   color: C.amber },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <View style={styles.statDiv} />}
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.overviewDivider} />

              <View style={styles.toolsInnerRow}>
                {FLEET_TOOLS.map((tool, idx) => {
                  const gc = idx===0?['#1D4ED8','#60A5FA']:idx===1?['#B45309','#FBBF24']:idx===2?['#B91C1C','#F87171']:[C.g800,C.g500];
                  return (
                    <React.Fragment key={tool.label}>
                      {idx > 0 && <View style={styles.statDiv} />}
                      <TouchableOpacity style={styles.toolCol} onPress={() => navigation.navigate(tool.screen)} activeOpacity={0.7}>
                        <LinearGradient colors={gc} style={styles.toolColIcon}>
                          <MaterialCommunityIcons name={tool.icon} size={17} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.toolColLabel} numberOfLines={1}>{tool.label}</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>

            {/* Pending-vendor verification banner */}
            <VerificationBanner status={vendorStatus} navigation={navigation} />

            {!isFilteredEmpty && (
              <View style={[styles.sectionHead, { paddingBottom: 0 }]}>
                <Text style={styles.sectionTitle}>MY VEHICLES</Text>
                <Text style={styles.sectionCount}>{filteredVehicles.length} of {vehicles.length}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <FleetEmptyState
            noneAtAll={noneAtAll}
            onAddVehicle={gate(() => navigation.navigate('AddVehicleScreen'), 'add vehicles')}
            addIcon={addIcon}
          />
        }
      />
      {LockGateModal}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Hero */
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerLoading: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(26), borderBottomRightRadius: rs(26),
    paddingBottom: rs(8),
  },
  headerSafe: { paddingHorizontal: 16 },
  headerDots: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: rs(16) },
  titleWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  addCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },

  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  heroBadgeTxt: { fontSize: 12, fontWeight: '600', color: C.g400, fontFamily: DISPLAY },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2, fontFamily: DISPLAY },

  /* Fleet overview panel — stats on top, quick tools below, one card */
  overviewCard: {
    backgroundColor: C.card, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.border,
    ...cardShadow,
  },
  statsRow: { flexDirection: 'row', paddingVertical: 13 },
  overviewDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  statDiv:  { width: 1, backgroundColor: C.border, marginVertical: 4 },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 17, fontWeight: '800', fontFamily: DISPLAY, marginBottom: 2 },
  statLabel:{ fontSize: 10.5, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },

  toolsInnerRow: { flexDirection: 'row', paddingVertical: 12 },
  toolCol: { flex: 1, alignItems: 'center', gap: 6 },
  toolColIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  toolColLabel: { fontSize: 10.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY },

  /* Fixed filters */
  filtersFixed: { paddingTop: 8 },
  svcScrollOuter: { flexGrow: 0, flexShrink: 0, height: 50 },
  svcScroll: { gap: 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center' },
  svcChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  svcChipTxt: { fontSize: 13, fontWeight: '700', color: C.muted, fontFamily: DISPLAY },
  svcChipCnt: { fontSize: 12, fontWeight: '800', color: C.muted },

  statusRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statusTab: { flex: 1, alignItems: 'center', paddingVertical: 9, gap: 3, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  statusTabTxt: { fontSize: 12, fontWeight: '700', color: C.muted, fontFamily: DISPLAY },
  statusTabCnt: { minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: C.bg, alignItems: 'center' },
  statusTabCntTxt: { fontSize: 11, fontWeight: '800', color: C.muted },

  activeFilterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  activeFilterTxt: { fontSize: 13, color: C.sub, fontWeight: '600' },
  clearFilterTxt: { fontSize: 13, color: C.red, fontWeight: '700' },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 10, paddingTop: 4 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: DISPLAY },
  sectionCount: { fontSize: 13, fontWeight: '600', color: C.sub },

  /* Vehicle card */
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardRail: { width: 3 },
  cardInner: { flex: 1, padding: 11, minWidth: 0 },

  cardTopStripe: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconBox: { width: 42, height: 42, borderRadius: rs(11), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  vehicleImg: { width: 42, height: 42, borderRadius: rs(11) },
  cardName: { fontSize: 14.5, fontWeight: '700', color: C.text, fontFamily: DISPLAY, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' },
  vDel: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

  cardBody: { marginLeft: 50 },
  regText: { fontSize: 12.5, color: C.blue, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, color: C.sub, fontWeight: '600' },
  svcTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  svcTagTxt: { fontSize: 11, fontWeight: '700', fontFamily: DISPLAY },

  /* Illustrated empty state */
  emptyCardWrap: {
    alignItems: 'center',
    backgroundColor: C.card, borderRadius: rs(24),
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 20, paddingVertical: rs(30),
    marginTop: rs(6),
  },
  emptyArt: {
    width: rs(140), height: rs(112), marginBottom: rs(16),
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtCardBack: {
    position: 'absolute', top: rs(12), right: rs(20),
    width: rs(88), height: rs(64), borderRadius: rs(14),
    backgroundColor: C.g50, transform: [{ rotate: '8deg' }],
  },
  emptyArtCard: {
    width: rs(88), height: rs(78), borderRadius: rs(16),
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.g50,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyArtDot: {
    position: 'absolute', top: rs(4), right: rs(16),
    width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: C.g400,
    borderWidth: rs(3), borderColor: C.card,
  },
  emptyArtTag: {
    position: 'absolute', bottom: rs(8), left: rs(4),
    backgroundColor: C.card, borderRadius: rs(8),
    paddingHorizontal: rs(8), paddingVertical: rs(3),
    borderWidth: 1, borderColor: C.g50,
    transform: [{ rotate: '-8deg' }],
  },
  emptyArtTagTxt: { fontSize: 8.5, fontWeight: '700', color: C.g700, letterSpacing: 0.6, fontFamily: DISPLAY },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6, fontFamily: DISPLAY, textAlign: 'center' },
  emptyBody: {
    fontSize: 14, color: C.muted, textAlign: 'center',
    lineHeight: 19, maxWidth: rs(260),
  },
  emptyCtaWrap: { marginTop: rs(16) },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 24, borderRadius: rs(14),
  },
  emptyCtaText: { fontSize: 13.5, fontWeight: '700', color: '#fff', fontFamily: DISPLAY },
});
