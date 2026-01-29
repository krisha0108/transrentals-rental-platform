import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiGet, deleteVehicle, debugAuthState } from '../../api/client';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  border: '#E5E7EB',
  brand: '#22C55E',
  brandLight: '#D1FAE5',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  orange: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

const { width } = Dimensions.get('window');

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicleId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) return;

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        console.log(`[VehicleDetail] Fetching vehicle (attempt ${retries + 1}/${maxRetries + 1}):`, vehicleId);

        if (retries === 0) {
          await debugAuthState();
        }

        const response = await apiGet(`/vendor/fleet/${vehicleId}`);
        console.log('[VehicleDetail] Response received');

        const vehicleData = response.data?.vehicle || response.data;

        if (vehicleData) {
          // Ensure images is always an array
          if (!vehicleData.images || !Array.isArray(vehicleData.images)) {
            vehicleData.images = [];
          }

          // Map backend field names to display-friendly names
          // Note: API returns vehicle_models, brands, chauffeur_vehicle_categories, services (snake_case)
          vehicleData.brandName = vehicleData.brands?.name || vehicleData.vehicle_models?.brands?.name || 'N/A';
          vehicleData.modelName = vehicleData.vehicle_models?.name || vehicleData.model || 'N/A';
          vehicleData.serviceName = vehicleData.services?.name || 'N/A';
          vehicleData.categoryName = vehicleData.chauffeur_vehicle_categories?.name || 'N/A';
          vehicleData.seatingCapacity = vehicleData.chauffeur_vehicle_categories?.seatingCapacity || vehicleData.seatingCapacity || vehicleData.vehicle_models?.seatingCapacity || '--';
          vehicleData.fuelType = vehicleData.chauffeur_vehicle_categories?.fuelType || vehicleData.fuelType || vehicleData.vehicle_models?.fuelType || '--';
          vehicleData.transmission = vehicleData.chauffeur_vehicle_categories?.acType || vehicleData.transmission || vehicleData.vehicle_models?.transmission || '--';
          vehicleData.year = vehicleData.yearOfManufacture || vehicleData.year;
        }

        setVehicle(vehicleData);
        setLoading(false);
        setRefreshing(false);
        return;
      } catch (error) {
        console.error(`[VehicleDetail] Attempt ${retries + 1} failed:`, error?.response?.status, error?.response?.data);

        if (error?.response?.status === 401 && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        Alert.alert(
          'Error',
          error?.response?.status === 401
            ? 'You do not have permission to view this vehicle.'
            : 'Failed to load vehicle details. Please try again.'
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicle();
  };

  const handleDelete = () => {
    Alert.alert('Delete Vehicle', 'Are you sure you want to delete this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(vehicleId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete vehicle');
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'booked':
      case 'on_trip':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'maintenance':
        return { bg: '#FEF3C7', text: '#92400E' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={C.border} />
          <Text style={styles.emptyText}>Vehicle not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(vehicle.status);
  const images = Array.isArray(vehicle.images) ? vehicle.images : [];
  const pricing = vehicle.fleetPricing?.[0] || {};
  const locations = vehicle.fleetLocations?.map(fl => fl.location).filter(Boolean) || [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="trash-2" size={18} color={C.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brand]} />
        }
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                  setActiveImageIndex(index);
                }}
              >
                {images.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={styles.vehicleImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.imageDots}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.imageDot,
                        activeImageIndex === index && styles.imageDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="car" size={48} color={C.muted} />
              <Text style={styles.noImageText}>No images</Text>
            </View>
          )}
        </View>

        {/* Vehicle Info Header */}
        <View style={styles.infoHeader}>
          <View style={styles.infoHeaderLeft}>
            <Text style={styles.vehicleName}>
              {vehicle.brandName} {vehicle.modelName}
            </Text>
            <Text style={styles.regNumber}>
              {vehicle.registrationNumber || 'No Registration'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {vehicle.isActive === false ? 'INACTIVE' : (vehicle.isAvailable === false ? 'UNAVAILABLE' : 'ACTIVE')}
            </Text>
          </View>
        </View>

        {/* Service & Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Info</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="car-sport" size={18} color={C.brand} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{vehicle.serviceName}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="grid" size={18} color={C.purple} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{vehicle.categoryName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Specs Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: C.blueLight }]}>
                <MaterialCommunityIcons name="car" size={20} color={C.blue} />
              </View>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={styles.specValue}>{vehicle.brandName}</Text>
            </View>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="car-side" size={20} color={C.purple} />
              </View>
              <Text style={styles.specLabel}>Model</Text>
              <Text style={styles.specValue}>{vehicle.modelName}</Text>
            </View>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: C.brandLight }]}>
                <MaterialCommunityIcons name="seat" size={20} color={C.brand} />
              </View>
              <Text style={styles.specLabel}>Seats</Text>
              <Text style={styles.specValue}>{vehicle.seatingCapacity}</Text>
            </View>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="gas-station" size={20} color={C.orange} />
              </View>
              <Text style={styles.specLabel}>Fuel</Text>
              <Text style={styles.specValue}>{vehicle.fuelType}</Text>
            </View>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="car-shift-pattern" size={20} color={C.red} />
              </View>
              <Text style={styles.specLabel}>Transmission</Text>
              <Text style={styles.specValue}>{vehicle.transmission}</Text>
            </View>
            <View style={styles.specItem}>
              <View style={[styles.specIcon, { backgroundColor: '#E0E7FF' }]}>
                <MaterialCommunityIcons name="calendar" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.specLabel}>Year</Text>
              <Text style={styles.specValue}>{vehicle.year || '--'}</Text>
            </View>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Details</Text>
          <View style={styles.detailsList}>
            {vehicle.color && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="color-palette-outline" size={18} color={C.muted} />
                  <Text style={styles.detailLabel}>Color</Text>
                </View>
                <Text style={styles.detailValue}>{vehicle.color}</Text>
              </View>
            )}
            {vehicle.insuranceExpiry && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={C.muted} />
                  <Text style={styles.detailLabel}>Insurance Expiry</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(vehicle.insuranceExpiry).toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            {vehicle.fitnessExpiry && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="fitness-outline" size={18} color={C.muted} />
                  <Text style={styles.detailLabel}>Fitness Expiry</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(vehicle.fitnessExpiry).toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            {vehicle.permitExpiry && (
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="document-text-outline" size={18} color={C.muted} />
                  <Text style={styles.detailLabel}>Permit Expiry</Text>
                </View>
                <Text style={styles.detailValue}>
                  {new Date(vehicle.permitExpiry).toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="time-outline" size={18} color={C.muted} />
                <Text style={styles.detailLabel}>Added On</Text>
              </View>
              <Text style={styles.detailValue}>
                {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN') : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        {(pricing.basePrice || pricing.perDayRate || pricing.perKmRate) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pricing</Text>
            <View style={styles.pricingGrid}>
              {pricing.basePrice > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Base Price</Text>
                  <Text style={styles.pricingValue}>{formatCurrency(pricing.basePrice)}</Text>
                </View>
              )}
              {pricing.perDayRate > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Per Day</Text>
                  <Text style={styles.pricingValue}>{formatCurrency(pricing.perDayRate)}</Text>
                </View>
              )}
              {pricing.perKmRate > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Per KM</Text>
                  <Text style={styles.pricingValue}>{formatCurrency(pricing.perKmRate)}</Text>
                </View>
              )}
              {pricing.kmLimitPerDay > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>KM Limit/Day</Text>
                  <Text style={styles.pricingValue}>{pricing.kmLimitPerDay} km</Text>
                </View>
              )}
              {pricing.extraKmCharge > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Extra KM</Text>
                  <Text style={styles.pricingValue}>{formatCurrency(pricing.extraKmCharge)}/km</Text>
                </View>
              )}
              {pricing.deposit > 0 && (
                <View style={styles.pricingItem}>
                  <Text style={styles.pricingLabel}>Deposit</Text>
                  <Text style={styles.pricingValue}>{formatCurrency(pricing.deposit)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Operating Locations */}
        {locations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Operating Locations</Text>
            <View style={styles.locationsContainer}>
              {locations.map((location, index) => (
                <View key={index} style={styles.locationChip}>
                  <Ionicons name="location" size={14} color={C.brand} />
                  <Text style={styles.locationText}>{location.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Features */}
        {vehicle.features && vehicle.features.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {vehicle.features.map((feature, index) => (
                <View key={index} style={styles.featureChip}>
                  <Icon name="check" size={12} color={C.brand} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddVehicleScreen', { vehicleId, vehicle })}
        >
          <Icon name="edit-2" size={18} color="#fff" />
          <Text style={styles.editButtonText}>Edit Vehicle</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: C.muted,
    marginTop: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  vehicleImage: {
    width: width - 32,
    height: 200,
    borderRadius: 14,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: C.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  noImageText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 8,
  },
  imageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.border,
  },
  imageDotActive: {
    backgroundColor: C.brand,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoHeaderLeft: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
  regNumber: {
    fontSize: 14,
    color: C.blue,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: C.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '30%',
    alignItems: 'center',
  },
  specIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 11,
    color: C.muted,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginTop: 2,
    textAlign: 'center',
  },
  detailsList: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: C.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pricingItem: {
    width: '47%',
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
  },
  pricingLabel: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 4,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: C.brand,
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: C.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blue,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
