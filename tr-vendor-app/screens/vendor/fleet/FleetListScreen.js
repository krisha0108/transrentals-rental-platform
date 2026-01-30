import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getVendorFleet, deleteVehicle } from '../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  blue: '#2563EB',
  orange: '#F59E0B',
  red: '#EF4444',
  emerald: '#10B981',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  indigo: '#6366F1',
};

const VEHICLE_ICONS = {
  car: 'car-side',
  bike: 'motorbike',
  bus: 'bus',
  truck: 'truck-delivery',
  tempo: 'truck',
  default: 'car',
};

// Service configuration for consistent theming
const SERVICE_CONFIG = {
  'bike-rental': {
    icon: 'motorbike',
    color: C.blue,
    label: 'Bike Rental',
    shortLabel: 'Bike'
  },
  'self-drive': {
    icon: 'car',
    color: C.emerald,
    label: 'Self Drive',
    shortLabel: 'Self Drive'
  },
  'self-drive-car-rental': {
    icon: 'car',
    color: C.emerald,
    label: 'Self Drive',
    shortLabel: 'Self Drive'
  },
  'car-rental': {
    icon: 'car-side',
    color: C.red,
    label: 'Car Rental',
    shortLabel: 'Car Rental'
  },
  'bus-rental': {
    icon: 'bus',
    color: C.orange,
    label: 'Bus Rental',
    shortLabel: 'Bus'
  },
  'truck-rental': {
    icon: 'truck-delivery',
    color: C.purple,
    label: 'Truck Rental',
    shortLabel: 'Truck'
  },
  'truck-transporter': {
    icon: 'truck-delivery',
    color: C.purple,
    label: 'Truck / Transporter',
    shortLabel: 'Truck'
  },
  'packers-movers': {
    icon: 'package-variant',
    color: C.pink,
    label: 'Packers & Movers',
    shortLabel: 'Packers'
  },
  'equipment-rental': {
    icon: 'crane',
    color: C.cyan,
    label: 'Equipment Rental',
    shortLabel: 'Equipment'
  },
  'luxury-car-rental': {
    icon: 'car-sports',
    color: C.indigo,
    label: 'Luxury Cars',
    shortLabel: 'Luxury'
  },
  default: {
    icon: 'car',
    color: C.muted,
    label: 'Other',
    shortLabel: 'Other'
  },
};

export default function FleetListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const fetchFleet = useCallback(async () => {
    try {
      const response = await getVendorFleet();
      const fleetData = response?.fleet || response?.vehicles || [];
      console.log('[Fleet] Fetched vehicles:', fleetData.length);

      // Debug log for first vehicle with service info
      if (fleetData.length > 0) {
        fleetData.forEach((v, idx) => {
          if (v.services) {
            console.log(`[Fleet] Vehicle ${idx}:`, {
              name: v.vehicle_models?.name || v.chauffeur_vehicle_categories?.name || 'Unknown',
              serviceSlug: v.services.slug,
              serviceName: v.services.name,
              status: v.status,
            });
          }
        });
      }

      setVehicles(fleetData);
    } catch (error) {
      console.log('Error fetching fleet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleet();
  }, [fetchFleet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFleet();
    setRefreshing(false);
  }, [fetchFleet]);

  const handleDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              await fetchFleet();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  // Get service config for a vehicle
  const getServiceConfig = (vehicle) => {
    if (!vehicle?.services) return SERVICE_CONFIG.default;

    const serviceSlug = vehicle.services.slug?.toLowerCase() || '';
    const serviceName = vehicle.services.name?.toLowerCase() || '';

    // Debug log
    if (serviceName.includes('pack') || serviceName.includes('mover')) {
      console.log('[Fleet] Packers service found:', { serviceSlug, serviceName });
    }

    // Check for specific service types first (most specific to least specific)

    // Packers & Movers
    if (serviceSlug.includes('packer') || serviceSlug.includes('mover') ||
        serviceName.includes('packer') || serviceName.includes('mover')) {
      return SERVICE_CONFIG['packers-movers'];
    }

    // Self Drive (check before general car-rental)
    if (serviceSlug.includes('self-drive') || serviceName.includes('self-drive') ||
        serviceName.includes('self drive')) {
      return SERVICE_CONFIG['self-drive'];
    }

    // Luxury Cars
    if (serviceSlug.includes('luxury') || serviceName.includes('luxury')) {
      return SERVICE_CONFIG['luxury-car-rental'];
    }

    // Bike Rental
    if (serviceSlug.includes('bike') || serviceName.includes('bike')) {
      return SERVICE_CONFIG['bike-rental'];
    }

    // Bus Rental
    if (serviceSlug.includes('bus') || serviceName.includes('bus')) {
      return SERVICE_CONFIG['bus-rental'];
    }

    // Truck / Transporter
    if (serviceSlug.includes('truck') || serviceSlug.includes('transporter') ||
        serviceName.includes('truck') || serviceName.includes('transporter')) {
      return SERVICE_CONFIG['truck-rental'];
    }

    // Equipment Rental
    if (serviceSlug.includes('equipment') || serviceSlug.includes('crane') || serviceSlug.includes('jcb') ||
        serviceName.includes('equipment') || serviceName.includes('crane') || serviceName.includes('jcb')) {
      return SERVICE_CONFIG['equipment-rental'];
    }

    // Car Rental (chauffeur-driven)
    if (serviceSlug.includes('car-rental') || serviceSlug.includes('chauffeur') ||
        serviceName.includes('car rental') || serviceName.includes('chauffeur')) {
      return SERVICE_CONFIG['car-rental'];
    }

    // If no match, return default
    console.log('[Fleet] No match found for service:', { serviceSlug, serviceName });
    return SERVICE_CONFIG.default;
  };

  const getVehicleIcon = (type) => {
    const normalizedType = type?.toLowerCase() || 'default';
    return VEHICLE_ICONS[normalizedType] || VEHICLE_ICONS.default;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
      case 'booked':
      case 'on_trip':
        return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
      case 'maintenance':
        return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case 'inactive':
        return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };
    }
  };

  // Get normalized service slug for filtering
  const getNormalizedServiceSlug = (vehicle) => {
    if (!vehicle?.services) return 'default';

    const slug = vehicle.services.slug?.toLowerCase() || '';
    const name = vehicle.services.name?.toLowerCase() || '';

    // Use same logic as availableServices to normalize
    if (slug.includes('packer') || slug.includes('mover') || name.includes('packer') || name.includes('mover')) {
      return 'packers-movers';
    } else if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) {
      return 'self-drive';
    } else if (slug.includes('luxury') || name.includes('luxury')) {
      return 'luxury-car-rental';
    } else if (slug.includes('bike') || name.includes('bike')) {
      return 'bike-rental';
    } else if (slug.includes('bus') || name.includes('bus')) {
      return 'bus-rental';
    } else if (slug.includes('truck') || slug.includes('transporter') || name.includes('truck') || name.includes('transporter')) {
      return 'truck-rental';
    } else if (slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb') || name.includes('equipment') || name.includes('crane')) {
      return 'equipment-rental';
    } else if (slug.includes('car-rental') || slug.includes('chauffeur') || name.includes('car rental') || name.includes('chauffeur')) {
      return 'car-rental';
    }

    return 'default';
  };

  // Apply both status and service filters
  const filteredVehicles = React.useMemo(() => {
    const filtered = vehicles.filter((v) => {
      // Status filter
      const statusMatch = statusFilter === 'all' || v.status?.toLowerCase() === statusFilter;

      // Service filter - use normalized slug matching
      const normalizedSlug = getNormalizedServiceSlug(v);
      const serviceMatch = serviceFilter === 'all' || normalizedSlug === serviceFilter;

      return statusMatch && serviceMatch;
    });

    // Debug log
    if (serviceFilter !== 'all') {
      console.log(`[Fleet Filter] Applied filter: ${serviceFilter}, Found: ${filtered.length} vehicles`);
    }

    return filtered;
  }, [vehicles, statusFilter, serviceFilter]);

  // Get unique services from fleet
  const availableServices = React.useMemo(() => {
    const servicesMap = new Map();

    vehicles.forEach((v) => {
      if (v.services) {
        const config = getServiceConfig(v);
        const slug = v.services.slug?.toLowerCase() || '';
        const name = v.services.name?.toLowerCase() || '';

        // Map similar services together using same logic as getServiceConfig
        let normalizedSlug = 'default';

        if (slug.includes('packer') || slug.includes('mover') || name.includes('packer') || name.includes('mover')) {
          normalizedSlug = 'packers-movers';
        } else if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) {
          normalizedSlug = 'self-drive';
        } else if (slug.includes('luxury') || name.includes('luxury')) {
          normalizedSlug = 'luxury-car-rental';
        } else if (slug.includes('bike') || name.includes('bike')) {
          normalizedSlug = 'bike-rental';
        } else if (slug.includes('bus') || name.includes('bus')) {
          normalizedSlug = 'bus-rental';
        } else if (slug.includes('truck') || slug.includes('transporter') || name.includes('truck') || name.includes('transporter')) {
          normalizedSlug = 'truck-rental';
        } else if (slug.includes('equipment') || slug.includes('crane') || slug.includes('jcb') || name.includes('equipment') || name.includes('crane')) {
          normalizedSlug = 'equipment-rental';
        } else if (slug.includes('car-rental') || slug.includes('chauffeur') || name.includes('car rental') || name.includes('chauffeur')) {
          normalizedSlug = 'car-rental';
        }

        // Get the service config for this normalized slug
        const serviceConfig = SERVICE_CONFIG[normalizedSlug] || SERVICE_CONFIG.default;

        if (!servicesMap.has(normalizedSlug)) {
          servicesMap.set(normalizedSlug, {
            slug: normalizedSlug,
            ...serviceConfig,
            count: 0,
          });
        }

        const service = servicesMap.get(normalizedSlug);
        service.count += 1;
      }
    });

    return Array.from(servicesMap.values());
  }, [vehicles]);

  const statusFilters = [
    { key: 'all', label: 'All Status' },
    { key: 'active', label: 'Active' },
    { key: 'booked', label: 'Booked' },
    { key: 'maintenance', label: 'Maintenance' },
  ];

  const renderVehicle = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    const serviceConfig = getServiceConfig(item);

    // Get vehicle name (brand + model or category name)
    // Note: API returns vehicle_models, brands, chauffeur_vehicle_categories (snake_case)
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

    // Get image
    const imageUri = item.images?.[0] || item.vehicle_models?.sideImage || item.chauffeur_vehicle_categories?.image;

    // Get seating capacity
    const seatingCapacity =
      item.vehicle_models?.seatingCapacity ||
      item.chauffeur_vehicle_categories?.seatingCapacity ||
      item.seatingCapacity;

    // Get fuel type
    const fuelType =
      item.vehicle_models?.fuelType ||
      item.chauffeur_vehicle_categories?.fuelType ||
      item.fuelType;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, { borderLeftColor: serviceConfig.color }]}
        onPress={() => navigation.navigate('VehicleDetailScreen', { vehicleId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.vehicleImageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.vehicleImage} />
          ) : (
            <View style={styles.vehicleImagePlaceholder}>
              <MaterialCommunityIcons name={serviceConfig.icon} size={32} color={C.muted} />
            </View>
          )}
        </View>

        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicleName}
            </Text>
            {item.status && (
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
          </View>

          {/* Service Badge */}
          <View style={styles.serviceBadgeRow}>
            <View style={[styles.serviceBadge, { backgroundColor: serviceConfig.color + '15' }]}>
              <MaterialCommunityIcons name={serviceConfig.icon} size={12} color={serviceConfig.color} />
              <Text style={[styles.serviceBadgeText, { color: serviceConfig.color }]}>
                {serviceConfig.shortLabel}
              </Text>
            </View>
            {item.registrationNumber && (
              <Text style={styles.vehicleNumber}>{item.registrationNumber}</Text>
            )}
          </View>

          <View style={styles.vehicleDetails}>
            {seatingCapacity && (
              <View style={styles.detailItem}>
                <Icon name="users" size={12} color={C.muted} />
                <Text style={styles.detailText}>{seatingCapacity} seats</Text>
              </View>
            )}
            {fuelType && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="gas-station" size={12} color={C.muted} />
                <Text style={styles.detailText}>{fuelType}</Text>
              </View>
            )}
            {item.fleetLocations?.length > 0 && (
              <View style={styles.detailItem}>
                <Icon name="map-pin" size={12} color={C.muted} />
                <Text style={styles.detailText}>
                  {item.fleetLocations[0].location?.name}
                  {item.fleetLocations.length > 1 && ` +${item.fleetLocations.length - 1}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteVehicle(item.id);
          }}
        >
          <Icon name="trash-2" size={16} color={C.red} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Fleet</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Fleet</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddVehicleScreen')}
        >
          <Icon name="plus" size={20} color={C.brand} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Total Fleet</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: C.brand }]}>
            {vehicles.filter((v) => v.status?.toLowerCase() === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: C.blue }]}>
            {vehicles.filter((v) => v.status?.toLowerCase() === 'booked').length}
          </Text>
          <Text style={styles.statLabel}>Booked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: availableServices.length > 0 ? C.purple : C.muted }]}>
            {availableServices.length}
          </Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
      </View>

      {/* Service Filters */}
      {availableServices.length > 0 && (
        <View style={styles.filtersSection}>
          <Text style={styles.filterSectionLabel}>Filter by Service</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.serviceFilterChip, serviceFilter === 'all' && styles.serviceFilterChipActive]}
              onPress={() => setServiceFilter('all')}
            >
              <Text style={[styles.serviceFilterText, serviceFilter === 'all' && styles.serviceFilterTextActive]}>
                All Services
              </Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{vehicles.length}</Text>
              </View>
            </TouchableOpacity>

            {availableServices.map((service) => (
              <TouchableOpacity
                key={service.slug}
                style={[
                  styles.serviceFilterChip,
                  serviceFilter === service.slug && styles.serviceFilterChipActive,
                ]}
                onPress={() => setServiceFilter(service.slug)}
              >
                <View style={[styles.serviceIconCircle, { backgroundColor: service.color + '20' }]}>
                  <MaterialCommunityIcons name={service.icon} size={14} color={service.color} />
                </View>
                <Text style={[styles.serviceFilterText, serviceFilter === service.slug && styles.serviceFilterTextActive]}>
                  {service.shortLabel}
                </Text>
                <View style={[styles.filterBadge, { backgroundColor: service.color + '15' }]}>
                  <Text style={[styles.filterBadgeText, { color: service.color }]}>{service.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Status Filters */}
      <View style={styles.statusFiltersContainer}>
        {statusFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.statusFilterChip, statusFilter === f.key && styles.statusFilterChipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.statusFilterText, statusFilter === f.key && styles.statusFilterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredVehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="car-off" size={48} color={C.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Vehicles Found</Text>
          <Text style={styles.emptyText}>
            {vehicles.length === 0
              ? 'Add your first vehicle to get started'
              : statusFilter !== 'all' || serviceFilter !== 'all'
              ? 'No vehicles match your filters'
              : 'No vehicles available'}
          </Text>
          {vehicles.length === 0 && (
            <TouchableOpacity
              style={styles.addVehicleBtn}
              onPress={() => navigation.navigate('AddVehicleScreen')}
            >
              <Icon name="plus" size={18} color="#fff" />
              <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          )}
          {(statusFilter !== 'all' || serviceFilter !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                setStatusFilter('all');
                setServiceFilter('all');
              }}
            >
              <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.brand}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: '500',
  },
  filtersSection: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingRight: 16,
    gap: 8,
  },
  serviceFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  serviceFilterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: C.brand,
  },
  serviceFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
  },
  serviceFilterTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
  serviceIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
  },
  statusFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusFilterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusFilterText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  vehicleImageContainer: {
    marginRight: 12,
  },
  vehicleImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  vehicleImagePlaceholder: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  serviceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
    gap: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleNumber: {
    fontSize: 11,
    color: C.blue,
    fontWeight: '500',
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: C.muted,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addVehicleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  clearFiltersBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    marginTop: 12,
  },
  clearFiltersBtnText: {
    color: C.text,
    fontWeight: '600',
    fontSize: 13,
  },
});
