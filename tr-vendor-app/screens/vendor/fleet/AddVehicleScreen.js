import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getVendorFleet, addVehicle, updateVehicle } from '../../api/client';
import { showConfirm, showError, showInfo, showSuccess } from '../../../services/alertService';

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
  red: '#EF4444',
  yellow: '#F59E0B',
};

const FUEL_TYPES = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'CNG', value: 'cng' },
  { label: 'Electric', value: 'electric' },
  { label: 'Hybrid', value: 'hybrid' },
];

const TRANSMISSIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Automatic', value: 'automatic' },
];

export default function AddVehicleScreen({ route, navigation }) {
  const { vehicleId, vehicle: existingVehicle } = route.params || {};
  const isEditing = !!vehicleId;

  // Data from API
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvedServices, setApprovedServices] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [approvedLocations, setApprovedLocations] = useState([]);
  const [tripTypes, setTripTypes] = useState([]);

  // Form state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  // Change images to object with 5 specific types
  const [vehicleImages, setVehicleImages] = useState({
    front: null,
    back: null,
    leftSide: null,
    rightSide: null,
    inside: null,
  });
  const [form, setForm] = useState({
    registrationNumber: '',
    yearOfManufacture: '',
    color: '',
    fuelType: '',
    transmission: '',
    seatingCapacity: '',
  });
  const [pricing, setPricing] = useState({
    basePrice: '',
    perDayRate: '',
    perKmRate: '',
    kmLimitPerDay: '',
    extraKmCharge: '',
    deposit: '',
  });

  // Modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (existingVehicle && approvedServices.length > 0) {
      // Find and set service
      const service = approvedServices.find(s => s.id === existingVehicle.serviceId);
      if (service) setSelectedService(service);

      // Set model or category/brand based on service type
      if (existingVehicle.vehicleModelId && vehicleModels.length > 0) {
        const model = vehicleModels.find(m => m.id === existingVehicle.vehicleModelId);
        if (model) setSelectedModel(model);
      }
      if (existingVehicle.vehicleCategoryId && vehicleCategories.length > 0) {
        const category = vehicleCategories.find(c => c.id === existingVehicle.vehicleCategoryId);
        if (category) setSelectedCategory(category);
      }
      if (existingVehicle.brandId && brands.length > 0) {
        const brand = brands.find(b => b.id === existingVehicle.brandId);
        if (brand) setSelectedBrand(brand);
      }

      // Set locations
      if (existingVehicle.fleetLocations) {
        const locationIds = existingVehicle.fleetLocations.map(fl => fl.location?.id).filter(Boolean);
        setSelectedLocations(approvedLocations.filter(l => locationIds.includes(l.id)));
      }

      // Set basic form fields
      setForm({
        registrationNumber: existingVehicle.registrationNumber || '',
        yearOfManufacture: existingVehicle.yearOfManufacture?.toString() || '',
        color: existingVehicle.color || '',
        fuelType: existingVehicle.fuelType || '',
        transmission: existingVehicle.transmission || '',
        seatingCapacity: existingVehicle.seatingCapacity?.toString() || '',
      });

      // Set pricing from first pricing entry
      if (existingVehicle.fleetPricing && existingVehicle.fleetPricing.length > 0) {
        const p = existingVehicle.fleetPricing[0];
        setPricing({
          basePrice: p.basePrice?.toString() || '',
          perDayRate: p.perDayRate?.toString() || '',
          perKmRate: p.perKmRate?.toString() || '',
          kmLimitPerDay: p.kmLimitPerDay?.toString() || '',
          extraKmCharge: p.extraKmCharge?.toString() || '',
          deposit: p.deposit?.toString() || '',
        });
      }

      // Set images - handle array, string, and object formats
      if (existingVehicle.images) {
        let imgs = existingVehicle.images;

        // Parse if string
        if (typeof imgs === 'string') {
          try {
            imgs = JSON.parse(imgs);
          } catch (e) {
            console.log('Failed to parse images:', e);
            imgs = {};
          }
        }

        // Convert to new object format
        if (Array.isArray(imgs)) {
          // Old format: array of URIs - convert to object format
          console.log('[AddVehicle] Converting old array format to new object format');
          const imageObj = {};
          const keys = ['front', 'back', 'leftSide', 'rightSide', 'inside'];
          imgs.forEach((uri, index) => {
            if (uri && index < keys.length) {
              imageObj[keys[index]] = { uri, isExisting: true };
            }
          });
          setVehicleImages(imageObj);
        } else if (typeof imgs === 'object' && imgs !== null) {
          // New format: { front, back, leftSide, rightSide, inside }
          const imageObj = {};
          Object.keys(imgs).forEach(key => {
            if (imgs[key]) {
              imageObj[key] = { uri: imgs[key], isExisting: true };
            }
          });
          setVehicleImages(imageObj);
        }
      }
    }
  }, [existingVehicle, approvedServices, vehicleModels, vehicleCategories, brands, approvedLocations]);

  const fetchData = async () => {
    try {
      const data = await getVendorFleet();
      setApprovedServices(data.approvedServices || []);

      // Transform vehicle models to include full image URLs
      const baseURL = await import('../../api/client').then(m => m.getBaseURL());
      const transformedModels = (data.vehicleModels || []).map(model => {
        if (model.sideImage && !model.sideImage.startsWith('http')) {
          // Convert relative path to full URL
          return {
            ...model,
            sideImage: `${baseURL}${model.sideImage}`
          };
        }
        return model;
      });

      setVehicleModels(transformedModels);
      setBrands(data.brands || []);
      setVehicleCategories(data.vehicleCategories || []);
      setApprovedLocations(data.approvedLocations || []);
      setTripTypes(data.tripTypes || []);

      // Debug: Check transformed URLs
      console.log('[AddVehicle] Total vehicle models:', transformedModels.length);
      const modelsWithImages = transformedModels.filter(m => m.sideImage);
      console.log('[AddVehicle] Models with sideImage:', modelsWithImages.length);
      if (modelsWithImages.length > 0) {
        console.log('[AddVehicle] Sample transformed image URLs:', modelsWithImages.slice(0, 2).map(m => ({
          name: m.name,
          brand: m.brand?.name,
          sideImage: m.sideImage
        })));
      }
    } catch (error) {
      console.log('Error fetching fleet data:', error);
      showError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine service type
  const getServiceType = (service) => {
    if (!service) return null;
    const slug = service.slug?.toLowerCase() || '';
    const name = service.name?.toLowerCase() || '';

    if (slug.includes('self-drive') || name.includes('self-drive') || name.includes('self drive')) {
      return 'self-drive';
    }
    if (slug.includes('bike') || name.includes('bike')) return 'bike';
    if (slug.includes('bus') || name.includes('bus')) return 'bus';
    if (slug.includes('luxury') || name.includes('luxury')) return 'luxury';
    if (slug.includes('truck') || name.includes('truck') || name.includes('transporter')) return 'truck';
    if (slug.includes('equipment') || name.includes('equipment') || name.includes('crane') || name.includes('jcb')) return 'equipment';
    if (slug.includes('packer') || name.includes('packer') || slug.includes('mover') || name.includes('mover')) return 'packers';
    if (slug === 'car-rental' || name.includes('car rental')) return 'car-rental';
    return 'other';
  };

  const serviceType = getServiceType(selectedService);
  // ALL services now need model selection (including truck, equipment, packers)
  const needsModel = ['self-drive', 'bike', 'bus', 'luxury', 'truck', 'equipment', 'packers'].includes(serviceType);
  const needsCategoryAndBrand = serviceType === 'car-rental';
  // No service needs category-only anymore (all use models now)
  const needsCategoryOnly = false;
  const needsVehicleImages = ['self-drive', 'bike', 'bus', 'car-rental', 'luxury'].includes(serviceType);

  // Filter models by selected service
  const filteredModels = useMemo(() => {
    if (!selectedService) return [];
    return vehicleModels.filter(model => {
      // Match by serviceId
      if (model.serviceId === selectedService.id) return true;
      // Also match by parent service ID if available
      if (selectedService.parentId && model.serviceId === selectedService.parentId) return true;
      // Match by service slug/name patterns
      const modelServiceSlug = model.service?.slug?.toLowerCase() || '';
      const modelServiceName = model.service?.name?.toLowerCase() || '';
      const serviceSlug = selectedService.slug?.toLowerCase() || '';
      const serviceName = selectedService.name?.toLowerCase() || '';

      if (serviceType === 'self-drive' && (modelServiceSlug.includes('self-drive') || modelServiceName.includes('self-drive'))) return true;
      if (serviceType === 'bike' && (modelServiceSlug.includes('bike') || modelServiceName.includes('bike'))) return true;
      if (serviceType === 'bus' && (modelServiceSlug.includes('bus') || modelServiceName.includes('bus'))) return true;
      if (serviceType === 'luxury' && (modelServiceSlug.includes('luxury') || modelServiceName.includes('luxury'))) return true;

      return false;
    });
  }, [selectedService, vehicleModels, serviceType]);

  // Filter brands by selected service
  const filteredBrands = useMemo(() => {
    if (!selectedService) return brands;
    return brands.filter(brand => {
      if (!brand.serviceId) return true;
      return brand.serviceId === selectedService.id;
    });
  }, [selectedService, brands]);

  // Filter categories by selected service
  const filteredCategories = useMemo(() => {
    if (!selectedService) return vehicleCategories;
    return vehicleCategories.filter(cat => {
      if (!cat.serviceId) return true;
      return cat.serviceId === selectedService.id || cat.serviceId === selectedService.parentId;
    });
  }, [selectedService, vehicleCategories]);

  // Search filter for modals
  const filterBySearch = (items, fields) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toLowerCase().includes(query);
      })
    );
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updatePricing = (key, value) => {
    setPricing(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async (imageType) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
      includeBase64: true, // Include base64 for upload
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      // Store both uri (for display) and base64 (for upload)
      setVehicleImages(prev => ({
        ...prev,
        [imageType]: {
          uri: asset.uri,
          base64: `data:${asset.type};base64,${asset.base64}`,
          type: asset.type,
          name: asset.fileName,
        }
      }));
    }
  };

  const removeImage = (imageType) => {
    setVehicleImages(prev => ({
      ...prev,
      [imageType]: null
    }));
  };

  const toggleLocation = (location) => {
    setSelectedLocations(prev => {
      const exists = prev.some(l => l.id === location.id);
      if (exists) {
        return prev.filter(l => l.id !== location.id);
      }
      return [...prev, location];
    });
  };

  const selectAllLocations = () => {
    setSelectedLocations([...approvedLocations]);
  };

  const deselectAllLocations = () => {
    setSelectedLocations([]);
  };

  const validateForm = () => {
    if (!selectedService) {
      showError('Please select a service');
      return false;
    }

    if (needsModel && !selectedModel) {
      showError('Please select a vehicle model');
      return false;
    }

    if (needsCategoryAndBrand && !selectedCategory) {
      showError('Please select a vehicle category');
      return false;
    }

    if (needsCategoryOnly && !selectedCategory) {
      showError('Please select a vehicle category');
      return false;
    }

    if (!form.registrationNumber.trim()) {
      showError('Please enter registration number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Build image object with base64 data for upload
      const imageData = {};
      Object.keys(vehicleImages).forEach(key => {
        if (vehicleImages[key]) {
          // Send base64 data for new images, or uri for existing images
          imageData[key] = vehicleImages[key].base64 || vehicleImages[key].uri || vehicleImages[key];
        }
      });

      // Build request body
      const requestBody = {
        serviceId: selectedService.id,
        registrationNumber: form.registrationNumber,
        yearOfManufacture: form.yearOfManufacture ? parseInt(form.yearOfManufacture) : null,
        color: form.color || null,
        locationIds: selectedLocations.map(l => l.id),
        // Include vehicle images as stringified JSON (matching web app format)
        images: Object.keys(imageData).length > 0 ? JSON.stringify(imageData) : null,
      };

      // Add model or category based on service type
      if (needsModel && selectedModel) {
        requestBody.vehicleModelId = selectedModel.id;
      }
      if ((needsCategoryAndBrand || needsCategoryOnly) && selectedCategory) {
        requestBody.vehicleCategoryId = selectedCategory.id;
      }
      if (needsCategoryAndBrand && selectedBrand) {
        requestBody.brandId = selectedBrand.id;
      }

      // Add pricing
      const pricingData = [];
      if (pricing.basePrice || pricing.perDayRate) {
        const priceEntry = {
          basePrice: parseFloat(pricing.basePrice) || 0,
          perDayRate: parseFloat(pricing.perDayRate) || 0,
          perKmRate: parseFloat(pricing.perKmRate) || null,
          kmLimitPerDay: parseInt(pricing.kmLimitPerDay) || null,
          extraKmCharge: parseFloat(pricing.extraKmCharge) || null,
          deposit: parseFloat(pricing.deposit) || null,
        };

        // Find appropriate trip type
        if (tripTypes.length > 0) {
          const tripType = tripTypes.find(t => {
            const slug = t.slug?.toLowerCase() || '';
            if (serviceType === 'self-drive' && slug.includes('self-drive')) return true;
            if (serviceType === 'bike' && slug.includes('bike')) return true;
            return slug.includes('daily') || slug.includes('rental');
          }) || tripTypes[0];
          priceEntry.tripTypeId = tripType.id;
        }

        pricingData.push(priceEntry);
      }
      requestBody.pricing = pricingData;

      if (isEditing) {
        await updateVehicle(vehicleId, requestBody);
        showSuccess('Vehicle updated successfully', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
      } else {
        await addVehicle(requestBody);
        showSuccess('Vehicle added successfully', 'Success', { actions: [{ label: 'OK', onPress: () => navigation.goBack(), variant: 'primary' }] });
      }
    } catch (error) {
      console.log('Error saving vehicle:', error);
      showError(error?.response?.data?.error || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // Selection modal component
  const SelectionModal = ({ visible, onClose, title, data, onSelect, selected, searchFields, renderItem }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Icon name="x" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={C.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={C.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x-circle" size={18} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filterBySearch(data, searchFields)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => renderItem(item, selected?.id === item.id)}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="inbox" size={40} color={C.border} />
                <Text style={styles.emptyText}>No items found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.stepBadge, selectedService && styles.stepBadgeComplete]}>
              {selectedService ? <Icon name="check" size={14} color="#fff" /> : <Text style={styles.stepNumber}>1</Text>}
            </View>
            <Text style={styles.sectionTitle}>Select Service</Text>
          </View>

          <TouchableOpacity
            style={[styles.selectBox, selectedService && styles.selectBoxActive]}
            onPress={() => setShowServiceModal(true)}
          >
            {selectedService ? (
              <View style={styles.selectedItem}>
                <View style={styles.selectedIcon}>
                  <Ionicons name="car-sport" size={20} color={C.brand} />
                </View>
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedName}>{selectedService.name}</Text>
                  <Text style={styles.selectedSub}>Tap to change</Text>
                </View>
                <Icon name="chevron-right" size={20} color={C.muted} />
              </View>
            ) : (
              <View style={styles.placeholderRow}>
                <Icon name="plus-circle" size={20} color={C.muted} />
                <Text style={styles.placeholderText}>Select a service you're approved for</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Step 2: Select Model/Category based on service type */}
        {selectedService && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, (selectedModel || selectedCategory) && styles.stepBadgeComplete]}>
                {(selectedModel || selectedCategory) ? <Icon name="check" size={14} color="#fff" /> : <Text style={styles.stepNumber}>2</Text>}
              </View>
              <Text style={styles.sectionTitle}>
                {needsModel ? 'Select Vehicle Model' : needsCategoryAndBrand ? 'Select Category & Brand' : 'Select Category'}
              </Text>
            </View>

            {needsModel && (
              <TouchableOpacity
                style={[styles.selectBox, selectedModel && styles.selectBoxActive]}
                onPress={() => setShowModelModal(true)}
              >
                {selectedModel ? (
                  <View style={styles.selectedItem}>
                    {selectedModel.sideImage ? (
                      <Image
                        source={{ uri: selectedModel.sideImage }}
                        style={styles.modelImage}
                        onError={(e) => {
                          console.log(`[AddVehicle] Selected model image error for ${selectedModel.name}:`, e.nativeEvent?.error);
                        }}
                        onLoad={() => {
                          console.log('[AddVehicle] Selected model image loaded:', selectedModel.name);
                        }}
                      />
                    ) : (
                      <View style={styles.selectedIcon}>
                        <Ionicons name="car" size={20} color={C.brand} />
                      </View>
                    )}
                    <View style={styles.selectedInfo}>
                      <Text style={styles.selectedName}>{selectedModel.brand?.name} {selectedModel.name}</Text>
                      <Text style={styles.selectedSub}>
                        {selectedModel.fuelType || ''} {selectedModel.transmission ? `• ${selectedModel.transmission}` : ''}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={C.muted} />
                  </View>
                ) : (
                  <View style={styles.placeholderRow}>
                    <Icon name="plus-circle" size={20} color={C.muted} />
                    <Text style={styles.placeholderText}>
                      {filteredModels.length === 0 ? 'No models available for this service' : 'Select vehicle model'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {(needsCategoryAndBrand || needsCategoryOnly) && (
              <>
                <TouchableOpacity
                  style={[styles.selectBox, selectedCategory && styles.selectBoxActive]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  {selectedCategory ? (
                    <View style={styles.selectedItem}>
                      <View style={styles.selectedIcon}>
                        <Ionicons name="grid" size={20} color={C.brand} />
                      </View>
                      <View style={styles.selectedInfo}>
                        <Text style={styles.selectedName}>{selectedCategory.name}</Text>
                        <Text style={styles.selectedSub}>
                          {selectedCategory.seatingCapacity ? `${selectedCategory.seatingCapacity} seater` : 'Category'}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={20} color={C.muted} />
                    </View>
                  ) : (
                    <View style={styles.placeholderRow}>
                      <Icon name="plus-circle" size={20} color={C.muted} />
                      <Text style={styles.placeholderText}>Select vehicle category</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {needsCategoryAndBrand && (
                  <TouchableOpacity
                    style={[styles.selectBox, selectedBrand && styles.selectBoxActive, { marginTop: 12 }]}
                    onPress={() => setShowBrandModal(true)}
                  >
                    {selectedBrand ? (
                      <View style={styles.selectedItem}>
                        {selectedBrand.logo ? (
                          <Image source={{ uri: selectedBrand.logo }} style={styles.brandLogo} />
                        ) : (
                          <View style={styles.selectedIcon}>
                            <Ionicons name="business" size={20} color={C.brand} />
                          </View>
                        )}
                        <View style={styles.selectedInfo}>
                          <Text style={styles.selectedName}>{selectedBrand.name}</Text>
                          <Text style={styles.selectedSub}>Brand</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={C.muted} />
                      </View>
                    ) : (
                      <View style={styles.placeholderRow}>
                        <Icon name="plus-circle" size={20} color={C.muted} />
                        <Text style={styles.placeholderText}>Select brand (optional)</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {/* Step 3: Vehicle Details */}
        {selectedService && (selectedModel || selectedCategory || needsCategoryOnly) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, form.registrationNumber && styles.stepBadgeComplete]}>
                {form.registrationNumber ? <Icon name="check" size={14} color="#fff" /> : <Text style={styles.stepNumber}>3</Text>}
              </View>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registration Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., MH01AB1234"
                placeholderTextColor={C.muted}
                value={form.registrationNumber}
                onChangeText={v => updateForm('registrationNumber', v.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2022"
                  placeholderTextColor={C.muted}
                  value={form.yearOfManufacture}
                  onChangeText={v => updateForm('yearOfManufacture', v)}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., White"
                  placeholderTextColor={C.muted}
                  value={form.color}
                  onChangeText={v => updateForm('color', v)}
                />
              </View>
            </View>

            {/* Images - Only for specific services */}
            {needsVehicleImages && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Images (Optional)</Text>
                <Text style={[styles.label, { fontSize: 12, fontWeight: '400', color: C.muted, marginBottom: 12 }]}>
                  Upload images from different angles to help customers see your vehicle better
                </Text>

                {[
                  { key: 'front', label: 'Front View', description: 'Front side of the vehicle' },
                  { key: 'back', label: 'Back View', description: 'Rear side of the vehicle' },
                  { key: 'leftSide', label: 'Left Side View', description: 'Left side of the vehicle' },
                  { key: 'rightSide', label: 'Right Side View', description: 'Right side of the vehicle' },
                  { key: 'inside', label: 'Interior View', description: 'Inside/dashboard view' },
                ].map((imageType) => (
                  <View key={imageType.key} style={styles.imageTypeContainer}>
                    <View style={styles.imageTypeHeader}>
                      <Text style={styles.imageTypeLabel}>{imageType.label}</Text>
                      <Text style={styles.imageTypeDescription}>{imageType.description}</Text>
                    </View>

                    {vehicleImages[imageType.key] ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: vehicleImages[imageType.key].uri }}
                          style={styles.imagePreviewLarge}
                        />
                        <TouchableOpacity
                          style={styles.removeImageBtnLarge}
                          onPress={() => removeImage(imageType.key)}
                        >
                          <Icon name="x" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.imageUploadBtn}
                        onPress={() => pickImage(imageType.key)}
                      >
                        <Icon name="camera" size={24} color={C.muted} />
                        <Text style={styles.imageUploadText}>Tap to upload</Text>
                        <Text style={styles.imageUploadSubtext}>Max 5MB</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Step 4: Locations */}
        {selectedService && (selectedModel || selectedCategory) && approvedLocations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, selectedLocations.length > 0 && styles.stepBadgeComplete]}>
                {selectedLocations.length > 0 ? <Icon name="check" size={14} color="#fff" /> : <Text style={styles.stepNumber}>4</Text>}
              </View>
              <Text style={styles.sectionTitle}>Operating Locations</Text>
            </View>

            <TouchableOpacity
              style={[styles.selectBox, selectedLocations.length > 0 && styles.selectBoxActive]}
              onPress={() => setShowLocationModal(true)}
            >
              {selectedLocations.length > 0 ? (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedIcon}>
                    <Ionicons name="location" size={20} color={C.brand} />
                  </View>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedLocations.length} location(s) selected</Text>
                    <Text style={styles.selectedSub} numberOfLines={1}>
                      {selectedLocations.map(l => l.name).join(', ')}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={C.muted} />
                </View>
              ) : (
                <View style={styles.placeholderRow}>
                  <Icon name="plus-circle" size={20} color={C.muted} />
                  <Text style={styles.placeholderText}>Select operating locations</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Pricing */}
        {selectedService && (selectedModel || selectedCategory) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, pricing.basePrice && styles.stepBadgeComplete]}>
                {pricing.basePrice ? <Icon name="check" size={14} color="#fff" /> : <Text style={styles.stepNumber}>5</Text>}
              </View>
              <Text style={styles.sectionTitle}>Pricing</Text>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Base Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  value={pricing.basePrice}
                  onChangeText={v => updatePricing('basePrice', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Per Day (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  value={pricing.perDayRate}
                  onChangeText={v => updatePricing('perDayRate', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {(serviceType === 'self-drive' || serviceType === 'bike') && (
              <>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>KM Limit/Day</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 300"
                      placeholderTextColor={C.muted}
                      value={pricing.kmLimitPerDay}
                      onChangeText={v => updatePricing('kmLimitPerDay', v)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={styles.label}>Extra KM (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={C.muted}
                      value={pricing.extraKmCharge}
                      onChangeText={v => updatePricing('extraKmCharge', v)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Security Deposit (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    value={pricing.deposit}
                    onChangeText={v => updatePricing('deposit', v)}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Service Selection Modal */}
      <SelectionModal
        visible={showServiceModal}
        onClose={() => { setShowServiceModal(false); setSearchQuery(''); }}
        title="Select Service"
        data={approvedServices}
        selected={selectedService}
        searchFields={['name', 'slug']}
        onSelect={(item) => {
          setSelectedService(item);
          setSelectedModel(null);
          setSelectedCategory(null);
          setSelectedBrand(null);
          setShowServiceModal(false);
          setSearchQuery('');
        }}
        renderItem={(item, isSelected) => (
          <TouchableOpacity
            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
            onPress={() => {
              setSelectedService(item);
              setSelectedModel(null);
              setSelectedCategory(null);
              setSelectedBrand(null);
              setShowServiceModal(false);
              setSearchQuery('');
            }}
          >
            <View style={[styles.modalItemIcon, isSelected && styles.modalItemIconSelected]}>
              <Ionicons name="car-sport" size={20} color={isSelected ? '#fff' : C.brand} />
            </View>
            <View style={styles.modalItemInfo}>
              <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>{item.name}</Text>
            </View>
            {isSelected && <Icon name="check" size={20} color={C.brand} />}
          </TouchableOpacity>
        )}
      />

      {/* Model Selection Modal */}
      <SelectionModal
        visible={showModelModal}
        onClose={() => { setShowModelModal(false); setSearchQuery(''); }}
        title="Select Vehicle Model"
        data={filteredModels}
        selected={selectedModel}
        searchFields={['name', 'brand.name']}
        onSelect={(item) => {
          setSelectedModel(item);
          setShowModelModal(false);
          setSearchQuery('');
        }}
        renderItem={(item, isSelected) => (
          <TouchableOpacity
            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
            onPress={() => {
              console.log(`[AddVehicle] Model selected: ${item.name}, has image: ${!!item.sideImage}`);
              setSelectedModel(item);
              setShowModelModal(false);
              setSearchQuery('');
            }}
          >
            {item.sideImage ? (
              <Image
                source={{ uri: item.sideImage }}
                style={styles.modalModelImage}
                onError={(e) => {
                  console.log(`[AddVehicle Modal] Image error for ${item.name}:`, item.sideImage);
                }}
              />
            ) : (
              <View style={[styles.modalItemIcon, isSelected && styles.modalItemIconSelected]}>
                <Ionicons name="car" size={20} color={isSelected ? '#fff' : C.brand} />
              </View>
            )}
            <View style={styles.modalItemInfo}>
              <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                {item.brand?.name} {item.name}
              </Text>
              <Text style={styles.modalItemSub}>
                {item.fuelType || ''} {item.transmission ? `• ${item.transmission}` : ''} {item.seatingCapacity ? `• ${item.seatingCapacity} seater` : ''}
              </Text>
            </View>
            {isSelected && <Icon name="check" size={20} color={C.brand} />}
          </TouchableOpacity>
        )}
      />

      {/* Category Selection Modal */}
      <SelectionModal
        visible={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setSearchQuery(''); }}
        title="Select Category"
        data={filteredCategories}
        selected={selectedCategory}
        searchFields={['name', 'description']}
        onSelect={(item) => {
          setSelectedCategory(item);
          setShowCategoryModal(false);
          setSearchQuery('');
        }}
        renderItem={(item, isSelected) => (
          <TouchableOpacity
            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
            onPress={() => {
              setSelectedCategory(item);
              setShowCategoryModal(false);
              setSearchQuery('');
            }}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.modalModelImage} />
            ) : (
              <View style={[styles.modalItemIcon, isSelected && styles.modalItemIconSelected]}>
                <Ionicons name="grid" size={20} color={isSelected ? '#fff' : C.brand} />
              </View>
            )}
            <View style={styles.modalItemInfo}>
              <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>{item.name}</Text>
              <Text style={styles.modalItemSub}>
                {item.seatingCapacity ? `${item.seatingCapacity} seater` : ''} {item.acType ? `• ${item.acType}` : ''}
              </Text>
            </View>
            {isSelected && <Icon name="check" size={20} color={C.brand} />}
          </TouchableOpacity>
        )}
      />

      {/* Brand Selection Modal */}
      <SelectionModal
        visible={showBrandModal}
        onClose={() => { setShowBrandModal(false); setSearchQuery(''); }}
        title="Select Brand"
        data={filteredBrands}
        selected={selectedBrand}
        searchFields={['name']}
        onSelect={(item) => {
          setSelectedBrand(item);
          setShowBrandModal(false);
          setSearchQuery('');
        }}
        renderItem={(item, isSelected) => (
          <TouchableOpacity
            style={[styles.modalItem, isSelected && styles.modalItemSelected]}
            onPress={() => {
              setSelectedBrand(item);
              setShowBrandModal(false);
              setSearchQuery('');
            }}
          >
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.brandLogoModal} />
            ) : (
              <View style={[styles.modalItemIcon, isSelected && styles.modalItemIconSelected]}>
                <Ionicons name="business" size={20} color={isSelected ? '#fff' : C.brand} />
              </View>
            )}
            <View style={styles.modalItemInfo}>
              <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>{item.name}</Text>
            </View>
            {isSelected && <Icon name="check" size={20} color={C.brand} />}
          </TouchableOpacity>
        )}
      />

      {/* Location Selection Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Locations</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowLocationModal(false)}>
                <Icon name="x" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <Icon name="search" size={18} color={C.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                placeholderTextColor={C.muted}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')}>
                  <Icon name="x-circle" size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Select All / Deselect All */}
            <View style={styles.bulkActionsRow}>
              <TouchableOpacity
                style={styles.bulkActionBtn}
                onPress={selectAllLocations}
              >
                <Icon name="check-square" size={16} color={C.blue} />
                <Text style={styles.bulkActionText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkActionBtn}
                onPress={deselectAllLocations}
              >
                <Icon name="square" size={16} color={C.muted} />
                <Text style={[styles.bulkActionText, { color: C.muted }]}>Deselect All</Text>
              </TouchableOpacity>
            </View>

            {selectedLocations.length > 0 && (
              <View style={styles.selectedCountBar}>
                <Text style={styles.selectedCountText}>{selectedLocations.length} selected</Text>
              </View>
            )}

            <FlatList
              data={approvedLocations.filter(loc =>
                locationSearch.trim() === '' ||
                loc.name.toLowerCase().includes(locationSearch.toLowerCase())
              )}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedLocations.some(l => l.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.locationItem, isSelected && styles.locationItemSelected]}
                    onPress={() => toggleLocation(item)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Icon name="check" size={14} color="#fff" />}
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalList}
            />

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: C.muted,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Section
  section: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeComplete: {
    backgroundColor: C.brand,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },

  // Select Box
  selectBox: {
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    borderStyle: 'dashed',
  },
  selectBoxActive: {
    borderColor: C.brand,
    borderStyle: 'solid',
    backgroundColor: C.brandLight,
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 14,
    color: C.muted,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  selectedSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  modelImage: {
    width: 60,
    height: 40,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    resizeMode: 'contain',
  },

  // Input
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  rowInputs: {
    flexDirection: 'row',
  },

  // Images - New 5-type format
  imageTypeContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: C.bg,
  },
  imageTypeHeader: {
    marginBottom: 10,
  },
  imageTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  imageTypeDescription: {
    fontSize: 12,
    color: C.muted,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreviewLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageBtnLarge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageUploadBtn: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  imageUploadText: {
    fontSize: 13,
    color: C.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  imageUploadSubtext: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.brand,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  modalClose: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  modalList: {
    padding: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: C.muted,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: C.bg,
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: C.brandLight,
    borderWidth: 1,
    borderColor: C.brand,
  },
  modalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemIconSelected: {
    backgroundColor: C.brand,
  },
  modalModelImage: {
    width: 60,
    height: 44,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  brandLogoModal: {
    width: 44,
    height: 44,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  modalItemNameSelected: {
    color: C.brand,
  },
  modalItemSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },

  // Location modal
  bulkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  bulkActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.blue,
  },
  selectedCountBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.blueLight,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.blue,
  },
  clearAllText: {
    fontSize: 14,
    color: C.red,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: C.bg,
    gap: 12,
  },
  locationItemSelected: {
    backgroundColor: C.brandLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  modalDoneBtn: {
    backgroundColor: C.brand,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
