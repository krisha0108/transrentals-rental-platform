import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorFleet, deleteVehicle, getBaseURL } from '../../api/client';
import { showConfirm, showError, showSuccess } from '../../../services/alertService';
import { ListSkeleton } from '../../../components/SkeletonLoader';

const C = {
  g900: '#022C22', g800: '#065F46', g700: '#047857', g600: '#059669',
  g500: '#10B981', g400: '#34D399', g100: '#D1FAE5', g50: '#ECFDF5',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', sub: '#475569', muted: '#94A3B8',
  blue: '#2563EB', blueL: '#EFF6FF',
  amber: '#D97706', amberL: '#FFFBEB',
  red: '#DC2626', redL: '#FEF2F2',
  orange: '#EA580C', orangeL: '#FFF7ED',
  indigo: '#4F46E5', indigoL: '#EEF2FF',
  purple: '#7C3AED', purpleL: '#F5F3FF',
  pink: '#DB2777', pinkL: '#FDF2F8',
  teal: '#0D9488', tealL: '#F0FDFA',
  cyan: '#0891B2', cyanL: '#ECFEFF',
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

    const seatingCapacity = item.vehicle_models?.seatingCapacity || item.chauffeur_vehicle_categories?.seatingCapacity || item.seatingCapacity;
    const fuelType        = item.vehicle_models?.fuelType        || item.chauffeur_vehicle_categories?.fuelType        || item.fuelType;

    return (
      <TouchableOpacity
        style={[st.vCard, { borderLeftColor: serviceConfig.color }]}
        onPress={() => navigation.navigate('VehicleDetailScreen', { vehicleId: item.id })}
        activeOpacity={0.85}
      >
        <View style={st.vRow}>
          {/* Icon box */}
          <View style={[st.vIconBox, { backgroundColor: serviceConfig.color + '15' }]}>
            {imageUri
              ? <Image source={{ uri: imageUri }} style={st.vImg} resizeMode="cover" />
              : <MaterialCommunityIcons name={serviceConfig.icon} size={22} color={serviceConfig.color} />
            }
          </View>

          {/* Info */}
          <View style={st.vMeta}>
            <View style={st.vMetaTop}>
              <Text style={st.vName} numberOfLines={1}>{vehicleName}</Text>
              {item.status && (
                <View style={[st.vStatusBadge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[st.vStatusTxt, { color: statusColors.text }]}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              )}
            </View>

            {item.registrationNumber && (
              <Text style={st.vReg}>{item.registrationNumber}</Text>
            )}

            <View style={st.vMetaBot}>
              <View style={[st.vSvcTag, { backgroundColor: serviceConfig.color + '15' }]}>
                <MaterialCommunityIcons name={serviceConfig.icon} size={10} color={serviceConfig.color} />
                <Text style={[st.vSvcTagTxt, { color: serviceConfig.color }]}>{serviceConfig.shortLabel}</Text>
              </View>
              {seatingCapacity && (
                <View style={st.vSpec}><Icon name="users" size={10} color={C.muted} /><Text style={st.vSpecTxt}>{seatingCapacity}</Text></View>
              )}
              {fuelType && (
                <View style={st.vSpec}><MaterialCommunityIcons name="gas-station" size={11} color={C.muted} /><Text style={st.vSpecTxt}>{fuelType}</Text></View>
              )}
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={st.vDel}
            onPress={(e) => { e.stopPropagation(); handleDeleteVehicle(item.id); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-2" size={14} color={C.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={C.g900} />
        <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.heroLoading}>
          <View style={st.heroTopSimple}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={st.heroTitle}>My Fleet</Text>
            <View style={{ width: 38 }} />
          </View>
        </LinearGradient>
        <ListSkeleton count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.g900} />

      {/* ── HERO HEADER ── */}
      <LinearGradient colors={[C.g900, C.g800, C.g700]} style={st.hero}>
        <View style={[st.deco, { width: 180, height: 180, top: -70, right: -50, opacity: 0.07 }]} />
        <View style={[st.deco, { width: 80,  height: 80,  top: 10,  right: 110, opacity: 0.04 }]} />

        <View style={st.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={st.heroMid}>
            <View style={st.heroBadge}>
              <MaterialCommunityIcons name="car-multiple" size={12} color={C.g400} />
              <Text style={st.heroBadgeTxt}>Fleet Manager</Text>
            </View>
            <Text style={st.heroTitle}>My Fleet</Text>
            <Text style={st.heroSub}>{vehicles.length} vehicles · {availableServices.length} services</Text>
          </View>
          <TouchableOpacity style={st.addBtn} onPress={() => navigation.navigate('AddVehicleScreen')}>
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={st.statsRow}>
          {[
            { label: 'Total',       value: vehicles.length,                                                        color: '#fff' },
            { label: 'Active',      value: vehicles.filter(v => v.status?.toLowerCase() === 'active').length,      color: C.g400 },
            { label: 'Booked',      value: vehicles.filter(v => v.status?.toLowerCase() === 'booked').length,      color: '#93C5FD' },
            { label: 'Services',    value: availableServices.length,                                               color: '#FCD34D' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={st.statDiv} />}
              <View style={st.statBox}>
                <Text style={[st.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={st.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {/* ── ALL SCROLLABLE CONTENT ── */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.g600]} tintColor={C.g600} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>

            {/* ── FLEET TOOLS ── */}
            <View style={st.toolsRow}>
              {FLEET_TOOLS.map((tool, idx) => {
                const gc = idx===0?['#1D4ED8','#60A5FA']:idx===1?['#B45309','#FBBF24']:idx===2?['#B91C1C','#F87171']:[C.g800,C.g500];
                return (
                  <TouchableOpacity key={tool.label} style={st.toolItem} onPress={() => navigation.navigate(tool.screen)} activeOpacity={0.8}>
                    <LinearGradient colors={gc} style={st.toolItemIcon}>
                      <MaterialCommunityIcons name={tool.icon} size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={st.toolItemLabel} numberOfLines={1}>{tool.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── SECTION HEADER ── */}
            <View style={st.listSectionHead}>
              <Text style={st.listSectionTitle}>MY VEHICLES</Text>
              <Text style={st.listSectionCount}>{filteredVehicles.length} of {vehicles.length}</Text>
            </View>

            {/* ── SERVICE CHIPS ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.svcScroll}>
              {[{ slug:'all', icon:'car-multiple', color: C.g700, shortLabel:'All', count: vehicles.length }, ...availableServices].map(svc => {
                const isActive = serviceFilter === svc.slug;
                return (
                  <TouchableOpacity
                    key={svc.slug}
                    style={[st.svcChip, isActive && { backgroundColor: svc.color + '1A', borderColor: svc.color }]}
                    onPress={() => setServiceFilter(svc.slug)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons name={svc.icon} size={13} color={isActive ? svc.color : C.muted} />
                    <Text style={[st.svcChipTxt, isActive && { color: svc.color }]}>{svc.shortLabel}</Text>
                    <Text style={[st.svcChipCnt, isActive && { color: svc.color }]}>{svc.count}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── STATUS TABS ── */}
            <View style={st.statusRow}>
              {statusFilters.map(f => {
                const cnt = f.key === 'all' ? vehicles.length : vehicles.filter(v => v.status?.toLowerCase() === f.key).length;
                const isActive = statusFilter === f.key;
                const color = f.key === 'all' ? C.g600 : getStatusColor(f.key).dot;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[st.statusTab, isActive && { borderBottomColor: color }]}
                    onPress={() => setStatusFilter(f.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[st.statusTabTxt, isActive && { color, fontWeight: '800' }]}>{f.label}</Text>
                    <View style={[st.statusTabCnt, isActive && { backgroundColor: color }]}>
                      <Text style={[st.statusTabCntTxt, isActive && { color: '#fff' }]}>{cnt}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {(statusFilter !== 'all' || serviceFilter !== 'all') && (
              <View style={st.activeFilterRow}>
                <Text style={st.activeFilterTxt}>{filteredVehicles.length} result{filteredVehicles.length !== 1 ? 's' : ''}</Text>
                <TouchableOpacity onPress={() => { setStatusFilter('all'); setServiceFilter('all'); }}>
                  <Text style={st.clearFilterTxt}>Clear filters ×</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredVehicles.length === 0 && (
              <View style={st.empty}>
                <View style={st.emptyIcon}><MaterialCommunityIcons name="car-off" size={36} color={C.muted} /></View>
                <Text style={st.emptyTitle}>No Vehicles Found</Text>
                <Text style={st.emptyMsg}>{vehicles.length === 0 ? 'Add your first vehicle to get started' : 'No vehicles match your filters'}</Text>
                {vehicles.length === 0 && (
                  <TouchableOpacity style={st.emptyBtn} onPress={() => navigation.navigate('AddVehicleScreen')}>
                    <Icon name="plus" size={16} color="#fff" /><Text style={st.emptyBtnTxt}>Add Vehicle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Hero */
  hero:        { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, overflow: 'hidden' },
  heroLoading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },
  heroTopSimple: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deco: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  heroMid: { flex: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.g400 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 3 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 4 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statDiv:  { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 18, fontWeight: '800', marginBottom: 3 },
  statLabel:{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.4 },

  /* Fleet Tools single row */
  toolsRow: { flexDirection: 'row', paddingTop: 14, paddingBottom: 6, gap: 8 },
  toolItem: { flex: 1, alignItems: 'center', backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  toolItemIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  toolItemLabel: { fontSize: 11, fontWeight: '700', color: C.text },

  /* Section header — no horizontal padding (FlatList contentContainerStyle already has 16px) */
  listSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border },
  listSectionTitle: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  listSectionCount: { fontSize: 12, fontWeight: '600', color: C.sub },

  /* Service chips */
  svcScroll: { gap: 8, paddingBottom: 12 },
  svcChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  svcChipTxt: { fontSize: 12, fontWeight: '700', color: C.muted },
  svcChipCnt: { fontSize: 11, fontWeight: '800', color: C.muted },

  /* Status underline tabs */
  statusRow: { flexDirection: 'row', marginBottom: 10, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statusTab: { flex: 1, alignItems: 'center', paddingVertical: 9, gap: 3, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  statusTabTxt: { fontSize: 11, fontWeight: '700', color: C.muted },
  statusTabCnt: { minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, backgroundColor: C.bg, alignItems: 'center' },
  statusTabCntTxt: { fontSize: 10, fontWeight: '800', color: C.muted },

  /* Active filter clear row */
  activeFilterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 },
  activeFilterTxt: { fontSize: 12, color: C.sub, fontWeight: '600' },
  clearFilterTxt: { fontSize: 12, color: C.red, fontWeight: '700' },

  /* Vehicle cards */
  list: { paddingHorizontal: 16, paddingBottom: 120, gap: 10, paddingTop: 0 },
  vCard: {
    backgroundColor: C.card, borderRadius: 14,
    borderLeftWidth: 4,
  },
  vRow: { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 11 },
  vIconBox: { width: 50, height: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  vImg: { width: 50, height: 50, borderRadius: 13 },

  vMeta: { flex: 1, gap: 3 },
  vMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vName: { fontSize: 14, fontWeight: '800', color: C.text, flex: 1 },
  vStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  vStatusDot: { width: 6, height: 6, borderRadius: 3 },
  vStatusTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  vReg: { fontSize: 12, color: C.blue, fontWeight: '700', letterSpacing: 0.3 },

  vMetaBot: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  vSvcTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  vSvcTagTxt: { fontSize: 10, fontWeight: '700' },
  vSpec: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  vSpecTxt: { fontSize: 11, color: C.muted, fontWeight: '500' },

  vDel: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

  /* Empty state */
  empty:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyTitle:{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyMsg:  { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.g700, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clearBtn:  { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  clearBtnTxt: { color: C.text, fontWeight: '600', fontSize: 13 },
});
