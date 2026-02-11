'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Car,
  Search,
  Plus,
  Loader2,
  Edit,
  Trash2,
  MapPin,
  Eye,
  MoreVertical,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  ChevronRight,
  ChevronDown,
  Square,
  CheckSquare,
  MinusSquare,
  Image as ImageIcon,
  X,
  FolderOpen,
  Link as LinkIcon,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { FLOW_TYPE_CONFIG } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface FleetItem {
  id: string;
  name: string;
  brand: string;
  brandId?: string;
  model: string;
  services_vehicle_models_subServiceIdToservices: string;
  subServiceId?: string;
  basePrice: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  locations: number;
  isActive: boolean;
  imageUrl?: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  specs?: Record<string, string>;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface SubService {
  id: string;
  name: string;
  slug: string;
}

interface LocationItem {
  id: string;
  name: string;
  slug: string;
  stateName?: string;
  isAssigned?: boolean;
}

interface AssignedLocation {
  id: string;
  locationId: string;
  locationName: string;
  locationSlug: string;
  isActive: boolean;
  basePricePerDay: number | null;
}

interface CityItem {
  id: string;
  name: string;
  slug: string;
  type: 'city';
  isAssigned: boolean;
}

interface StateLocation {
  id: string;
  name: string;
  slug: string;
  type: 'state';
  cities: CityItem[];
  assignedCount: number;
  totalCount: number;
  isExpanded?: boolean;
}

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  folder: string;
}

interface MediaFolder {
  id: string;
  name: string;
  itemCount: number;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

// No mock data - all fleet data comes from the database

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  flowType?: string;
}

export default function ServiceFleetPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subServiceFilter, setSubServiceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetItem | null>(null);
  const [allLocations, setAllLocations] = useState<LocationItem[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<StateLocation[]>([]);
  const [assignedLocations, setAssignedLocations] = useState<AssignedLocation[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);

  // Image picker modal state
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaFolder, setMediaFolder] = useState('fleet');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePickerMode, setImagePickerMode] = useState<'gallery' | 'url' | 'upload'>('gallery');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper to check if this is equipment rental service
  const isEquipmentService = slug === 'equipment-rental';

  // Helper to check if this is packers and movers service
  const isPackersService = slug === 'packers-and-movers';

  // Form state - includes vehicle, equipment, and packers fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brandId: '',
    subServiceId: '',
    // Vehicle-specific fields
    fuelType: '',
    transmission: '',
    seatingCapacity: '',
    engineCC: '',
    mileage: '',
    // Equipment-specific fields
    powerCapacity: '',
    loadCapacity: '',
    operatorIncluded: false,
    securityDeposit: '',
    specifications: '',
    // Packers-specific fields
    vehicleCapacity: '',
    teamSize: '',
    registrationNumber: '',
    // Common pricing fields
    basePricePerDay: '',
    weeklyDiscount: '',
    monthlyDiscount: '',
    weeklyRate: '',
    monthlyRate: '',
    sideImage: '',
    isActive: true,
  });

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  // Fetch brands and subServices on mount
  useEffect(() => {
    const fetchBrands = async () => {
      if (!slug) return;
      try {
        // Fetch brands only for this specific service
        const res = await fetch(`/api/admin/services/${slug}/brands`);
        if (res.ok) {
          const data = await res.json();
          setBrands(data.brands || []);
          console.log(`[${slug}] Fetched ${data.brands?.length || 0} brands for this service`);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      }
    };

    const fetchSubServices = async () => {
      try {
        // Get subServices from the fleet API which returns database IDs
        const res = await fetch(`/api/admin/services/${slug}/fleet?limit=1`);
        if (res.ok) {
          const data = await res.json();
          setSubServices(data.subServices || []);
        }
      } catch (error) {
        console.error('Failed to fetch sub-services:', error);
      }
    };

    if (slug) {
      fetchBrands();
      fetchSubServices();
    }
  }, [slug]);

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate slug from name
    if (name === 'name' && !editingVehicle) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      slug: '',
      brandId: '',
      subServiceId: '',
      // Vehicle fields
      fuelType: '',
      transmission: '',
      seatingCapacity: '',
      engineCC: '',
      mileage: '',
      // Equipment fields
      powerCapacity: '',
      loadCapacity: '',
      operatorIncluded: false,
      securityDeposit: '',
      specifications: '',
      // Packers fields
      vehicleCapacity: '',
      teamSize: '',
      registrationNumber: '',
      // Pricing
      basePricePerDay: '',
      weeklyDiscount: '',
      monthlyDiscount: '',
      weeklyRate: '',
      monthlyRate: '',
      sideImage: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (vehicle: FleetItem) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      slug: vehicle.model,
      brandId: vehicle.brandId || '',
      subServiceId: vehicle.subServiceId || '',
      // Vehicle fields
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      seatingCapacity: vehicle.seatingCapacity?.toString() || '',
      engineCC: vehicle.specs?.engineCC || '',
      mileage: vehicle.specs?.mileage || '',
      // Equipment fields
      powerCapacity: vehicle.specs?.powerCapacity || '',
      loadCapacity: vehicle.specs?.loadCapacity || '',
      operatorIncluded: vehicle.specs?.operatorIncluded === 'true' || String(vehicle.specs?.operatorIncluded) === 'true',
      securityDeposit: vehicle.specs?.securityDeposit || '',
      specifications: vehicle.specs?.specifications || '',
      // Packers fields
      vehicleCapacity: vehicle.specs?.vehicleCapacity || '',
      teamSize: vehicle.specs?.teamSize || '',
      registrationNumber: vehicle.specs?.registrationNumber || '',
      // Pricing
      basePricePerDay: vehicle.basePrice?.toString() || '',
      weeklyDiscount: vehicle.weeklyDiscount?.toString() || '',
      monthlyDiscount: vehicle.monthlyDiscount?.toString() || '',
      weeklyRate: vehicle.specs?.weeklyRate || '',
      monthlyRate: vehicle.specs?.monthlyRate || '',
      sideImage: vehicle.imageUrl || '',
      isActive: vehicle.isActive,
    });
    setShowModal(true);
  };

  // Fetch media from main media library
  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      // Fetch from main media library with folder filter
      const res = await fetch(`/api/admin/media?folder=${mediaFolder === 'all' ? '' : mediaFolder}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        // Transform to match expected format
        const transformedMedia = (data.media || []).map((m: any) => ({
          id: m.id,
          name: m.originalName || m.filename,
          url: m.url,
          type: m.mimeType?.startsWith('image/') ? 'image' :
                m.mimeType?.startsWith('video/') ? 'video' : 'document',
          folder: m.folder || 'uploads',
        }));
        setMediaItems(transformedMedia);
        // Set folders from response
        const folderList = (data.folders || []).map((f: string) => ({
          id: f,
          name: f,
          itemCount: 0,
        }));
        setMediaFolders(folderList);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const openImagePicker = () => {
    setShowImagePicker(true);
    setNewImageUrl('');
    setImagePickerMode('upload');
    fetchMedia();
  };

  const selectImage = (url: string) => {
    setFormData(prev => ({ ...prev, sideImage: url }));
    setShowImagePicker(false);
  };

  const addNewImage = async () => {
    if (!newImageUrl.trim()) return;

    // Simply use the URL directly - external URLs don't need to be added to media library
    setFormData(prev => ({ ...prev, sideImage: newImageUrl }));
    setShowImagePicker(false);
    setNewImageUrl('');
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, sideImage: '' }));
  };

  // File upload handlers - uploads to main media library
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append('files', file);
      });
      uploadFormData.append('folder', 'fleet');

      // Upload to main media library
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.media && data.media.length > 0) {
          // Select the first uploaded image
          setFormData(prev => ({ ...prev, sideImage: data.media[0].url }));
          setShowImagePicker(false);
          // Refresh media items if still on gallery tab
          fetchMedia();
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files');
    } finally {
      setUploadingFiles(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingVehicle
        ? `/api/admin/services/${slug}/fleet/${editingVehicle.id}`
        : `/api/admin/services/${slug}/fleet`;
      const method = editingVehicle ? 'PUT' : 'POST';

      // Build request body based on service type
      const requestBody: Record<string, any> = {
        name: formData.name,
        vehicleSlug: formData.slug,
        brandId: formData.brandId || null,
        subServiceId: formData.subServiceId || null,
        sideImage: formData.sideImage || null,
        basePricePerDay: formData.basePricePerDay || null,
        isActive: formData.isActive,
      };

      if (isEquipmentService) {
        // Equipment-specific fields
        requestBody.powerCapacity = formData.powerCapacity || null;
        requestBody.loadCapacity = formData.loadCapacity || null;
        requestBody.operatorIncluded = formData.operatorIncluded;
        requestBody.securityDeposit = formData.securityDeposit || null;
        requestBody.specifications = formData.specifications || null;
        requestBody.weeklyRate = formData.weeklyRate || null;
        requestBody.monthlyRate = formData.monthlyRate || null;
      } else if (isPackersService) {
        // Packers-specific fields
        requestBody.vehicleCapacity = formData.vehicleCapacity || null;
        requestBody.teamSize = formData.teamSize || null;
        requestBody.registrationNumber = formData.registrationNumber || null;
        requestBody.specifications = formData.specifications || null;
      } else {
        // Vehicle-specific fields (car rental, bus rental, etc.)
        requestBody.fuelType = formData.fuelType || null;
        requestBody.transmission = formData.transmission || null;
        requestBody.seatingCapacity = formData.seatingCapacity || null;
        requestBody.engineCC = formData.engineCC || null;
        requestBody.mileage = formData.mileage || null;
        requestBody.weeklyDiscount = formData.weeklyDiscount || null;
        requestBody.monthlyDiscount = formData.monthlyDiscount || null;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        setShowModal(false);
        // Refresh fleet list
        window.location.reload();
      } else {
        const error = await res.json();
        const itemType = isEquipmentService ? 'equipment' : isPackersService ? 'vehicle' : 'vehicle';
        alert(error.error || `Failed to save ${itemType}`);
      }
    } catch (error) {
      const itemType = isEquipmentService ? 'equipment' : isPackersService ? 'vehicle' : 'vehicle';
      console.error(`Failed to save ${itemType}:`, error);
      alert(`Failed to save ${itemType}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/${slug}/fleet/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFleet(prev => prev.filter(v => v.id !== id));
      } else {
        alert('Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  // Location management functions
  const openLocationModal = async (vehicle: FleetItem) => {
    setSelectedVehicle(vehicle);
    setShowLocationModal(true);
    setLoadingLocations(true);
    setLocationSearch('');

    try {
      const res = await fetch(`/api/admin/services/${slug}/fleet/${vehicle.id}/locations`);
      if (res.ok) {
        const data = await res.json();
        setAllLocations(data.allLocations || []);
        setLocationHierarchy((data.locationHierarchy || []).map((s: StateLocation) => ({ ...s, isExpanded: false })));
        setAssignedLocations(data.assignedLocations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const toggleStateExpanded = (stateId: string) => {
    setLocationHierarchy(prev => prev.map(s =>
      s.id === stateId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const toggleStateAllCities = async (state: StateLocation) => {
    if (!selectedVehicle) return;

    setSavingLocations(true);
    try {
      const allAssigned = state.cities.every(c => c.isAssigned);

      if (allAssigned) {
        // Remove all cities from this state
        for (const city of state.cities) {
          await fetch(
            `/api/admin/services/${slug}/fleet/${selectedVehicle.id}/locations?locationId=${city.id}`,
            { method: 'DELETE' }
          );
        }
      } else {
        // Add all cities from this state
        const unassignedCityIds = state.cities.filter(c => !c.isAssigned).map(c => c.id);
        await fetch(`/api/admin/services/${slug}/fleet/${selectedVehicle.id}/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationIds: unassignedCityIds }),
        });
      }

      // Update local fleet state
      const count = allAssigned
        ? assignedLocations.length - state.cities.length
        : assignedLocations.length + state.cities.filter(c => !c.isAssigned).length;
      updateFleetLocationCount(selectedVehicle.id, count);

      // Refresh locations
      openLocationModal(selectedVehicle);
    } catch (error) {
      console.error('Failed to toggle state cities:', error);
    } finally {
      setSavingLocations(false);
    }
  };

  const updateFleetLocationCount = (vehicleId: string, count: number) => {
    setFleet(prev => prev.map(v =>
      v.id === vehicleId ? { ...v, locations: count } : v
    ));
  };

  const toggleLocation = async (locationId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedVehicle) return;

    setSavingLocations(true);
    try {
      if (isCurrentlyAssigned) {
        // Remove location
        const res = await fetch(
          `/api/admin/services/${slug}/fleet/${selectedVehicle.id}/locations?locationId=${locationId}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          setAssignedLocations(prev => prev.filter(l => l.locationId !== locationId));
          setAllLocations(prev => prev.map(l =>
            l.id === locationId ? { ...l, isAssigned: false } : l
          ));
          // Update local fleet state
          updateFleetLocationCount(selectedVehicle.id, assignedLocations.length - 1);

          // Update hierarchy
          setLocationHierarchy(prev => prev.map(state => ({
            ...state,
            cities: state.cities.map(city =>
              city.id === locationId ? { ...city, isAssigned: false } : city
            ),
            assignedCount: state.cities.filter(c =>
              c.id === locationId ? false : c.isAssigned
            ).length,
          })));
        }
      } else {
        // Add location
        const res = await fetch(`/api/admin/services/${slug}/fleet/${selectedVehicle.id}/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationIds: [locationId] }),
        });
        if (res.ok) {
          const location = allLocations.find(l => l.id === locationId);
          if (location) {
            setAssignedLocations(prev => [...prev, {
              id: `new-${locationId}`,
              locationId,
              locationName: location.name,
              locationSlug: location.slug,
              isActive: true,
              basePricePerDay: null,
            }]);
            setAllLocations(prev => prev.map(l =>
              l.id === locationId ? { ...l, isAssigned: true } : l
            ));
            // Update local fleet state
            updateFleetLocationCount(selectedVehicle.id, assignedLocations.length + 1);

            // Update hierarchy
            setLocationHierarchy(prev => prev.map(state => ({
              ...state,
              cities: state.cities.map(city =>
                city.id === locationId ? { ...city, isAssigned: true } : city
              ),
              assignedCount: state.cities.filter(c =>
                c.id === locationId ? true : c.isAssigned
              ).length,
            })));
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle location:', error);
    } finally {
      setSavingLocations(false);
    }
  };

  const assignAllLocations = async () => {
    if (!selectedVehicle) return;

    const unassignedLocations = allLocations.filter(l => !l.isAssigned);
    if (unassignedLocations.length === 0) return;

    setSavingLocations(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/fleet/${selectedVehicle.id}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationIds: unassignedLocations.map(l => l.id) }),
      });
      if (res.ok) {
        // Update local fleet state
        updateFleetLocationCount(selectedVehicle.id, allLocations.length);

        // Refresh locations
        openLocationModal(selectedVehicle);
      }
    } catch (error) {
      console.error('Failed to assign all locations:', error);
    } finally {
      setSavingLocations(false);
    }
  };

  const filteredLocations = allLocations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleExport = () => {
    if (fleet.length === 0) {
      alert('No fleet data to export');
      return;
    }

    // Prepare data for export
    const exportData = fleet.map((item: any, index) => ({
      'S.No': index + 1,
      'Name': item.name,
      'Brand': item.brand,
      'Model': item.model,
      'Category': item.sub_service || '-',
      'Base Price (₹)': item.basePrice || 0,
      ...(isEquipmentService
        ? {
            'Power Capacity': item.specs?.powerCapacity || '-',
            'Load Capacity': item.specs?.loadCapacity || '-',
            'Operator Included': item.specs?.operatorIncluded === 'true' ? 'Yes' : 'No',
            'Security Deposit (₹)': item.specs?.securityDeposit || '-',
            'Weekly Rate (₹)': item.specs?.weeklyRate || '-',
            'Monthly Rate (₹)': item.specs?.monthlyRate || '-',
          }
        : isPackersService
        ? {
            'Vehicle Capacity': item.specs?.vehicleCapacity || '-',
            'Team Size': item.specs?.teamSize || '-',
            'Registration Number': item.specs?.registrationNumber || '-',
          }
        : {
            'Fuel Type': item.fuelType || '-',
            'Transmission': item.transmission || '-',
            'Seating Capacity': item.seatingCapacity || '-',
            'Engine (CC)': item.specs?.engineCC || '-',
            'Mileage': item.specs?.mileage || '-',
            'Weekly Discount (%)': item.weeklyDiscount || 0,
            'Monthly Discount (%)': item.monthlyDiscount || 0,
          }
      ),
      'Locations': `${item.locations} cities`,
      'Status': item.isActive ? 'Active' : 'Inactive',
      'Image URL': item.imageUrl || '-',
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Name
      { wch: 15 }, // Brand
      { wch: 20 }, // Model
      { wch: 15 }, // Category
      { wch: 15 }, // Base Price
      { wch: 15 }, // Additional fields
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 }, // Locations
      { wch: 10 }, // Status
      { wch: 40 }, // Image URL
    ];
    ws['!cols'] = columnWidths;

    // Add worksheet to workbook
    const sheetName = isEquipmentService ? 'Equipment Fleet' : isPackersService ? 'Packers Fleet' : 'Vehicle Fleet';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename with service name and current date
    const serviceName = service?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'fleet';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${serviceName}_fleet_${date}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const fetchFleet = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (search) params.append('search', search);
      if (subServiceFilter !== 'ALL') params.append('subServiceId', subServiceFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter.toLowerCase());

      const res = await fetch(`/api/admin/services/${slug}/fleet?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPagination(data.pagination);
        setFleet(data.fleet.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          brandId: item.brandId,
          model: item.slug,
          services_vehicle_models_subServiceIdToservices: item.services_vehicle_models_subServiceIdToservices,
          sub_service: item.services_vehicle_models_subServiceIdToservices,
          subServiceId: item.subServiceId,
          basePrice: item.basePricePerDay || 0,
          weeklyDiscount: item.weeklyDiscount || 0,
          monthlyDiscount: item.monthlyDiscount || 0,
          locations: item.locationCount,
          isActive: item.isActive,
          imageUrl: item.sideImage,
          fuelType: item.fuelType,
          transmission: item.transmission,
          seatingCapacity: item.seatingCapacity,
          specs: item.specs,
        })));
      } else {
        console.error('Failed to fetch fleet from API');
        setFleet([]);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
      setFleet([]);
    } finally {
      setLoading(false);
    }
  }, [slug, search, subServiceFilter, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    if (slug) {
      fetchFleet();
    }
  }, [slug, fetchFleet]);

  const filteredFleet = fleet.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.model.toLowerCase().includes(search.toLowerCase());
    const matchesSubService = subServiceFilter === 'ALL' || item.sub_service === subServiceFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && item.isActive) ||
      (statusFilter === 'INACTIVE' && !item.isActive);
    return matchesSearch && matchesSubService && matchesStatus;
  });

  const stats = {
    total: fleet.length,
    active: fleet.filter((f) => f.isActive).length,
    inactive: fleet.filter((f) => !f.isActive).length,
    totalLocations: fleet.reduce((acc, f) => acc + f.locations, 0),
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  const flowConfig = FLOW_TYPE_CONFIG[(service.flowType || 'BROWSE_FIRST') as keyof typeof FLOW_TYPE_CONFIG];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <ServiceIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={openAddModal}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {isEquipmentService ? 'Equipment' : isPackersService ? 'Vehicle' : 'Vehicle'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total {isEquipmentService ? 'Equipment' : 'Vehicles'}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Location Mappings</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalLocations}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sub-Service Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={subServiceFilter}
              onChange={(e) => setSubServiceFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {subServices.map((sub) => (
                <option key={sub.slug} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredFleet.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            {isEquipmentService ? <Wrench className="w-12 h-12 mb-4" /> : <Car className="w-12 h-12 mb-4" />}
            <p className="font-medium">No {isEquipmentService ? 'equipment' : 'vehicles'} found</p>
            <p className="text-sm">Add {isEquipmentService ? 'equipment' : 'vehicles'} to this service to get started</p>
            <Button className="mt-4" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First {isEquipmentService ? 'Equipment' : 'Vehicle'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">{isEquipmentService ? 'Equipment' : 'Vehicle'}</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Category</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">{isEquipmentService ? 'Daily Rate' : 'Base Price'}</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Locations</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFleet.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ServiceIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.brand} • {item.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{item.sub_service}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.basePrice > 0 ? (
                        <div>
                          <span className="font-medium">₹{item.basePrice.toLocaleString()}</span>
                          <span className="text-gray-500">/day</span>
                          {(item.weeklyDiscount || item.monthlyDiscount) ? (
                            <div className="text-xs text-green-600">
                              {item.weeklyDiscount ? `${item.weeklyDiscount}% weekly` : ''}
                              {item.weeklyDiscount && item.monthlyDiscount ? ' • ' : ''}
                              {item.monthlyDiscount ? `${item.monthlyDiscount}% monthly` : ''}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        <MapPin className="w-4 h-4" />
                        {item.locations} cities
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/services/${slug}/fleet/${item.id}`}>
                          <Button variant="ghost" size="sm" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => openEditModal(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Manage Locations" onClick={() => openLocationModal(item)}>
                          <MapPin className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(item.id, item.name)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination!.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination!.pages - 2) {
                    pageNum = pagination!.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination!.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle/Equipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVehicle
                  ? `Edit ${isEquipmentService ? 'Equipment' : isPackersService ? 'Moving Vehicle' : 'Vehicle'}`
                  : `Add New ${isEquipmentService ? 'Equipment' : isPackersService ? 'Moving Vehicle' : 'Vehicle'}`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEquipmentService ? 'Equipment Name' : isPackersService ? 'Vehicle Name' : 'Vehicle Name'} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder={isEquipmentService ? 'e.g., JCB 3DX Backhoe Loader' : isPackersService ? 'e.g., Tata 407 Mini Truck' : 'e.g., Maruti Swift VXI'}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleFormChange}
                  placeholder={isEquipmentService ? 'e.g., jcb-3dx-backhoe-loader' : isPackersService ? 'e.g., tata-407-mini-truck' : 'e.g., maruti-swift-vxi'}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Brand - Optional for equipment and packers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand {(isEquipmentService || isPackersService) ? '(Optional)' : '*'}
                </label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={!isEquipmentService && !isPackersService}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category/Sub-Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="subServiceId"
                  value={formData.subServiceId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {subServices.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields based on Service Type */}
              {isEquipmentService ? (
                <>
                  {/* Equipment-specific fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Power Capacity
                      </label>
                      <input
                        type="text"
                        name="powerCapacity"
                        value={formData.powerCapacity}
                        onChange={handleFormChange}
                        placeholder="e.g., 100 KVA, 50 HP"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Load Capacity
                      </label>
                      <input
                        type="text"
                        name="loadCapacity"
                        value={formData.loadCapacity}
                        onChange={handleFormChange}
                        placeholder="e.g., 5 Tons, 10 Tons"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Operator Included */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      name="operatorIncluded"
                      checked={formData.operatorIncluded}
                      onChange={handleFormChange}
                      className="w-5 h-5 rounded border-gray-300"
                      id="operatorIncluded"
                    />
                    <label htmlFor="operatorIncluded" className="text-sm text-gray-700">
                      Operator Included with Rental
                    </label>
                  </div>

                  {/* Security Deposit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleFormChange}
                      placeholder="e.g., 50000"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Specifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications
                    </label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleFormChange}
                      placeholder="Enter equipment specifications, features, and technical details..."
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : isPackersService ? (
                <>
                  {/* Packers-specific fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Capacity
                      </label>
                      <input
                        type="text"
                        name="vehicleCapacity"
                        value={formData.vehicleCapacity}
                        onChange={handleFormChange}
                        placeholder="e.g., Mini, Small, Medium, Large"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Size category for moving capacity</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Team Size
                      </label>
                      <input
                        type="number"
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleFormChange}
                        placeholder="e.g., 4"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of workers included</p>
                    </div>
                  </div>

                  {/* Registration Number - Hide for equipment and packers services */}
                  {!isEquipmentService && !isPackersService && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Registration Number
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleFormChange}
                        placeholder="e.g., DL 01 AB 1234"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Specifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Details & Features
                    </label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleFormChange}
                      placeholder="Enter vehicle specifications, features, loading capacity, dimensions, etc."
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Vehicle-specific fields (cars, bikes, buses) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transmission
                      </label>
                      <select
                        name="transmission"
                        value={formData.transmission}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                        <option value="AMT">AMT</option>
                        <option value="CVT">CVT</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seating Capacity
                      </label>
                      <input
                        type="number"
                        name="seatingCapacity"
                        value={formData.seatingCapacity}
                        onChange={handleFormChange}
                        placeholder="e.g., 5"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engine (CC)
                      </label>
                      <input
                        type="number"
                        name="engineCC"
                        value={formData.engineCC}
                        onChange={handleFormChange}
                        placeholder="e.g., 1197"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage
                    </label>
                    <input
                      type="text"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleFormChange}
                      placeholder="e.g., 22 kmpl"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Image */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEquipmentService ? 'Equipment Image' : isPackersService ? 'Vehicle Image' : 'Vehicle Image'}
                </label>
                {formData.sideImage ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.sideImage}
                      alt={isEquipmentService ? 'Equipment' : 'Vehicle'}
                      className="w-48 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={openImagePicker}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 text-gray-700 rounded text-xs hover:bg-white"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openImagePicker}
                    className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Add Image</span>
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Upload from your computer, select from media gallery, or add an image URL
                </p>
              </div>

              {/* Pricing Section */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h3>
                {isEquipmentService ? (
                  <>
                    {/* Equipment pricing - Daily/Weekly/Monthly Rates */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Rate (₹)
                        </label>
                        <input
                          type="number"
                          name="basePricePerDay"
                          value={formData.basePricePerDay}
                          onChange={handleFormChange}
                          placeholder="e.g., 5000"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Rate (₹)
                        </label>
                        <input
                          type="number"
                          name="weeklyRate"
                          value={formData.weeklyRate}
                          onChange={handleFormChange}
                          placeholder="e.g., 30000"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Rate (₹)
                        </label>
                        <input
                          type="number"
                          name="monthlyRate"
                          value={formData.monthlyRate}
                          onChange={handleFormChange}
                          placeholder="e.g., 100000"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Set rental rates for different durations. You can override prices per location when assigning locations.
                    </p>
                  </>
                ) : isPackersService ? (
                  <>
                    {/* Packers pricing - Base rate only (quotes are dynamic) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Rate (₹)
                      </label>
                      <input
                        type="number"
                        name="basePricePerDay"
                        value={formData.basePricePerDay}
                        onChange={handleFormChange}
                        placeholder="e.g., 5000"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Base reference rate for this vehicle. Actual quotes will be generated based on distance, load, and requirements.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Vehicle pricing - Base Price with Discounts */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price/Day (₹)
                        </label>
                        <input
                          type="number"
                          name="basePricePerDay"
                          value={formData.basePricePerDay}
                          onChange={handleFormChange}
                          placeholder="e.g., 1500"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Discount (%)
                        </label>
                        <input
                          type="number"
                          name="weeklyDiscount"
                          value={formData.weeklyDiscount}
                          onChange={handleFormChange}
                          placeholder="e.g., 10"
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Discount (%)
                        </label>
                        <input
                          type="number"
                          name="monthlyDiscount"
                          value={formData.monthlyDiscount}
                          onChange={handleFormChange}
                          placeholder="e.g., 20"
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Set default pricing here. You can override prices per location when assigning locations.
                    </p>
                  </>
                )}
              </div>

              {/* Active Status */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingVehicle
                        ? `Update ${isEquipmentService ? 'Equipment' : isPackersService ? 'Vehicle' : 'Vehicle'}`
                        : `Add ${isEquipmentService ? 'Equipment' : isPackersService ? 'Vehicle' : 'Vehicle'}`}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Management Modal */}
      {showLocationModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Locations</h2>
                <p className="text-sm text-gray-500">{selectedVehicle.name}</p>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b">
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {assignedLocations.length} cities assigned
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {locationHierarchy.length} states
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={assignAllLocations}
                disabled={savingLocations || allLocations.every(l => l.isAssigned)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Assign All Cities
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search states or cities..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Locations Tree */}
            <div className="flex-1 overflow-y-auto">
              {loadingLocations ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : locationHierarchy.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No locations found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locationHierarchy
                    .filter(state =>
                      !locationSearch ||
                      state.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                      state.cities.some(c => c.name.toLowerCase().includes(locationSearch.toLowerCase()))
                    )
                    .map((state) => {
                      const filteredCities = locationSearch
                        ? state.cities.filter(c => c.name.toLowerCase().includes(locationSearch.toLowerCase()))
                        : state.cities;
                      const allCitiesAssigned = state.cities.length > 0 && state.cities.every(c => c.isAssigned);
                      const someCitiesAssigned = state.cities.some(c => c.isAssigned);

                      return (
                        <div key={state.id} className="border rounded-lg overflow-hidden">
                          {/* State Header */}
                          <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                            <button
                              onClick={() => toggleStateExpanded(state.id)}
                              className="flex-1 flex items-center gap-2 p-3 text-left"
                            >
                              {state.isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-medium text-gray-900">{state.name}</span>
                              <span className="text-sm text-gray-500 ml-auto mr-3">
                                {state.assignedCount}/{state.totalCount} cities
                              </span>
                            </button>
                            <button
                              onClick={() => toggleStateAllCities(state)}
                              disabled={savingLocations || state.cities.length === 0}
                              className="p-3 hover:bg-gray-200 rounded transition-colors"
                              title={allCitiesAssigned ? "Deselect all cities" : "Select all cities"}
                            >
                              {allCitiesAssigned ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : someCitiesAssigned ? (
                                <MinusSquare className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>

                          {/* Cities List */}
                          {state.isExpanded && filteredCities.length > 0 && (
                            <div className="border-t bg-white p-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {filteredCities.map((city) => (
                                  <button
                                    key={city.id}
                                    onClick={() => toggleLocation(city.id, city.isAssigned)}
                                    disabled={savingLocations}
                                    className={`p-2 rounded-lg border text-left transition-all text-sm ${city.isAssigned
                                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate">{city.name}</span>
                                      {city.isAssigned ? (
                                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Show when expanded but no cities match search */}
                          {state.isExpanded && filteredCities.length === 0 && locationSearch && (
                            <div className="border-t bg-white p-3 text-center text-sm text-gray-500">
                              No cities match your search
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => setShowLocationModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                Select {isEquipmentService ? 'Equipment' : isPackersService ? 'Vehicle' : 'Vehicle'} Image
              </h2>
              <button
                onClick={() => setShowImagePicker(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setImagePickerMode('upload')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${imagePickerMode === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => setImagePickerMode('gallery')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${imagePickerMode === 'gallery'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FolderOpen className="w-4 h-4" />
                Media Gallery
              </button>
              <button
                onClick={() => setImagePickerMode('url')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${imagePickerMode === 'url'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <LinkIcon className="w-4 h-4" />
                Add URL
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {imagePickerMode === 'upload' ? (
                <div className="space-y-4">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileSelector}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                  >
                    {uploadingFiles ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-gray-600 font-medium">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDragging ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-1">
                          {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
                        </p>
                        <p className="text-gray-500 mb-4">or</p>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFileSelector();
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Browse Files
                        </Button>
                        <p className="text-xs text-gray-400 mt-4">
                          Supported formats: JPG, PNG, GIF, WebP, SVG (Max 5MB)
                        </p>
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tips:</h4>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Use high-quality images for better display</li>
                      <li>• Recommended size: 800x600 pixels or larger</li>
                      <li>• Images will be saved to the Fleet folder automatically</li>
                    </ul>
                  </div>
                </div>
              ) : imagePickerMode === 'gallery' ? (
                <>
                  {/* Folder Filter */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Folder:</span>
                    <select
                      value={mediaFolder}
                      onChange={(e) => {
                        setMediaFolder(e.target.value);
                        // Re-fetch media with new folder filter
                        setLoadingMedia(true);
                        fetch(`/api/admin/media?folder=${e.target.value === 'all' ? '' : e.target.value}&limit=100`)
                          .then(res => res.json())
                          .then(data => {
                            const transformedMedia = (data.media || []).map((m: any) => ({
                              id: m.id,
                              name: m.originalName || m.filename,
                              url: m.url,
                              type: m.mimeType?.startsWith('image/') ? 'image' :
                                    m.mimeType?.startsWith('video/') ? 'video' : 'document',
                              folder: m.folder || 'uploads',
                            }));
                            setMediaItems(transformedMedia);
                            const folderList = (data.folders || []).map((f: string) => ({
                              id: f,
                              name: f,
                              itemCount: 0,
                            }));
                            setMediaFolders(folderList);
                          })
                          .finally(() => setLoadingMedia(false));
                      }}
                      className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Files</option>
                      <option value="fleet">Fleet Images</option>
                      {mediaFolders
                        .filter(f => f.name !== 'fleet')
                        .map((folder) => (
                          <option key={folder.id} value={folder.name}>
                            {folder.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {loadingMedia ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : mediaItems.filter(m => m.type === 'image').length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No images in this folder</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Upload new images or select a different folder
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {mediaItems
                        .filter(m => m.type === 'image')
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => selectImage(item.url)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition hover:border-blue-400 ${formData.sideImage === item.url
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200'
                              }`}
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {formData.sideImage === item.url && (
                              <div className="absolute top-2 right-2 p-1 bg-blue-500 rounded-full">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-white truncate">{item.name}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/vehicle-image.jpg"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a direct URL to an image file (JPG, PNG, WebP)
                    </p>
                  </div>

                  {/* Preview */}
                  {newImageUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preview
                      </label>
                      <div className="w-48 h-32 rounded-lg border overflow-hidden bg-gray-100">
                        <img
                          src={newImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={addNewImage}
                    disabled={!newImageUrl.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Image & Select
                  </Button>
                  <p className="text-xs text-gray-500">
                    This image will be saved to the Fleet folder in the service media gallery
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <Button variant="outline" onClick={() => setShowImagePicker(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
