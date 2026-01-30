"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  Bus,
  Car,
  CarFront,
  Check,
  ChevronRight,
  Fuel,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  MapPin,
  Plus,
  Search,
  Tag,
  Upload,
  UserCheck,
  Truck,
  Wrench,
  Package,
  Crown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VehicleModel {
  id: string;
  name: string;
  slug: string;
  sideImage?: string;

  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  engineCC?: number;

  brand: { id: string; name: string; logo?: string };

  service?: { id: string; slug: string; name: string; parentId?: string | null };
  serviceId?: string;
  subServiceId?: string | null;
  sub_service?: { id: string; name: string };
  vehicleCategoryId?: string | null;
  vehicle_category?: { id: string; name: string; slug: string };
}

interface Service {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  children?: { id: string; name: string; slug?: string }[];
}

interface Location {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  parent?: { name: string } | null;
}

interface TripType {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  serviceId?: string;
  vehicleCategoryId?: string;
}

interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seatingCapacity?: number;
  luggageCapacity?: string;
  acType?: string;
  fuelType?: string;
  image?: string;
  serviceId?: string;
}

interface PricingEntry {
  locationId?: string;
  tripTypeId: string;
  pricingType: string;
  basePrice: number;
  perDayRate?: number;
  perKmRate?: number;
  kmLimit?: number;
  deposit?: number;
}

type ServiceType = "bike-rental" | "car-rental" | "self-drive" | "with-driver" | "bus-rental" | "truck-rental" | "equipment-rental" | "packers-movers" | "luxury-car-rental" | "default";

export default function AddFleetVehiclePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Data from API
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [approvedServices, setApprovedServices] = useState<Service[]>([]);
  const [approvedLocations, setApprovedLocations] = useState<Location[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);

  // Form state
  const [vehicleModelId, setVehicleModelId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [subServiceId, setSubServiceId] = useState(""); // Bike category (sub-service)
  const [selectedVehicleCategoryId, setSelectedVehicleCategoryId] = useState(""); // Car category
  const [selectedBrandId, setSelectedBrandId] = useState(""); // Brand (car or optional filter)
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [color, setColor] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Vehicle images (optional, for specific services)
  const [vehicleImages, setVehicleImages] = useState<{
    front?: string;
    back?: string;
    leftSide?: string;
    rightSide?: string;
    inside?: string;
  }>({});

  // Bike pricing
  const [perDayRate, setPerDayRate] = useState("");
  const [kmPerDay, setKmPerDay] = useState("100");
  const [extraKmRate, setExtraKmRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [cityPricing, setCityPricing] = useState<Record<string, {
    perDayRate?: string;
    kmPerDay?: string;
    extraKmRate?: string;
    securityDeposit?: string
  }>>({});

  // Search/filter
  const [modelSearch, setModelSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/vendor/fleet");
        const data = await res.json();
        if (res.ok && data.success) {
          setVehicleModels(data.vehicleModels || []);
          setApprovedServices(data.approvedServices || []);
          setApprovedLocations(data.approvedLocations || []);
          setTripTypes(data.tripTypes || []);
          setBrands(data.brands || []);
          setVehicleCategories(data.vehicleCategories || []);
        } else {
          console.error("Failed to fetch data:", data.error || data.details);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Main/parent services only
  const mainServices = useMemo(() => approvedServices.filter((s) => !s.parentId), [approvedServices]);

  const selectedService = useMemo(
    () => mainServices.find((s) => s.id === serviceId),
    [mainServices, serviceId]
  );

  const selectedModel = useMemo(
    () => vehicleModels.find((m) => m.id === vehicleModelId),
    [vehicleModels, vehicleModelId]
  );

  // Service type detector (safe + consistent)
  // IMPORTANT: Order matters! Check specific services BEFORE generic ones
  const serviceType: ServiceType = useMemo(() => {
    if (!selectedService) return "default";
    const name = selectedService.name.toLowerCase();
    const slug = (selectedService.slug || "").toLowerCase();

    if (name.includes("bike") || slug.includes("bike")) return "bike-rental";
    // Check bus BEFORE car-rental
    if (name.includes("bus") || slug.includes("bus")) return "bus-rental";
    // Check truck/transporter
    if (name.includes("truck") || slug.includes("truck") || name.includes("transporter") || slug.includes("transporter")) return "truck-rental";
    // Check equipment
    if (name.includes("equipment") || slug.includes("equipment") || name.includes("crane") || name.includes("jcb")) return "equipment-rental";
    // Check packers & movers
    if (name.includes("packer") || slug.includes("packer") || name.includes("mover") || slug.includes("mover")) return "packers-movers";
    // Check luxury car rental BEFORE regular car-rental
    if (name.includes("luxury") || slug.includes("luxury")) return "luxury-car-rental";
    // Check self-drive FIRST (before car-rental) because slug might be "self-drive-car-rental"
    if (name.includes("self-drive") || name.includes("self drive") || slug.includes("self-drive")) return "self-drive";
    if (name.includes("car rental") || slug.includes("car-rental")) return "car-rental";
    if (name.includes("driver") || name.includes("chauffeur") || slug.includes("chauffeur")) return "with-driver";
    return "default";
  }, [selectedService]);

  const isBikeService = serviceType === "bike-rental";
  const isSelfDriveService = serviceType === "self-drive";
  const isBusService = serviceType === "bus-rental";
  const isTruckService = serviceType === "truck-rental";
  const isEquipmentService = serviceType === "equipment-rental";
  const isPackersService = serviceType === "packers-movers";
  const isLuxuryService = serviceType === "luxury-car-rental";
  const isCarService = serviceType === "car-rental" || serviceType === "with-driver"; // your "car flow"

  // Services that need vehicle image upload (5 specific services)
  const needsVehicleImages = isLuxuryService || isSelfDriveService || isBusService || isCarService || isBikeService;

  // Bike, Self-drive, Bus, Luxury need model selection
  // Truck, Equipment, Packers only need category selection (no models)
  const needsModelSelection = isBikeService || isSelfDriveService || isBusService || isLuxuryService;
  // Truck, Equipment, Packers only need category selection
  const needsCategoryOnly = isTruckService || isEquipmentService || isPackersService;
  // Bike, Self-drive, and Bus need vendor pricing; Truck, Equipment, Packers, Luxury don't (quote-based)
  const needsPricing = isBikeService || isSelfDriveService || isBusService;
  // ONLY Bike and Self-drive need city-wise pricing overrides
  const needsCityPricing = isBikeService || isSelfDriveService;
  const totalSteps = needsPricing ? (needsCityPricing ? 5 : 4) : 3;

  // Icons + colors (optional UX helpers)
  const getServiceIcon = (service: Service) => {
    const name = service.name.toLowerCase();
    const slug = (service.slug || "").toLowerCase();
    if (name.includes("bike") || slug.includes("bike")) return Bike;
    if (name.includes("bus") || slug.includes("bus")) return Bus;
    if (name.includes("truck") || slug.includes("truck") || name.includes("transporter") || slug.includes("transporter")) return Truck;
    if (name.includes("equipment") || slug.includes("equipment") || name.includes("crane") || name.includes("jcb")) return Wrench;
    if (name.includes("packer") || slug.includes("packer") || name.includes("mover") || slug.includes("mover")) return Package;
    if (name.includes("luxury") || slug.includes("luxury")) return Crown;
    if (name.includes("self-drive") || slug.includes("self-drive")) return CarFront;
    if (name.includes("driver") || name.includes("chauffeur") || slug.includes("car-rental")) return UserCheck;
    return Car;
  };

  const getServiceColor = (service: Service) => {
    const name = service.name.toLowerCase();
    const slug = (service.slug || "").toLowerCase();
    if (name.includes("bike") || slug.includes("bike"))
      return { bg: "bg-orange-50", border: "border-orange-500", icon: "text-orange-600", activeBg: "bg-orange-100" };
    if (name.includes("bus") || slug.includes("bus"))
      return { bg: "bg-indigo-50", border: "border-indigo-500", icon: "text-indigo-600", activeBg: "bg-indigo-100" };
    if (name.includes("truck") || slug.includes("truck") || name.includes("transporter") || slug.includes("transporter"))
      return { bg: "bg-blue-50", border: "border-blue-500", icon: "text-blue-600", activeBg: "bg-blue-100" };
    if (name.includes("equipment") || slug.includes("equipment") || name.includes("crane") || name.includes("jcb"))
      return { bg: "bg-amber-50", border: "border-amber-500", icon: "text-amber-600", activeBg: "bg-amber-100" };
    if (name.includes("packer") || slug.includes("packer") || name.includes("mover") || slug.includes("mover"))
      return { bg: "bg-cyan-50", border: "border-cyan-500", icon: "text-cyan-600", activeBg: "bg-cyan-100" };
    if (name.includes("luxury") || slug.includes("luxury"))
      return { bg: "bg-purple-50", border: "border-purple-500", icon: "text-purple-600", activeBg: "bg-purple-100" };
    if (name.includes("self-drive") || slug.includes("self-drive"))
      return { bg: "bg-sky-50", border: "border-sky-500", icon: "text-sky-600", activeBg: "bg-sky-100" };
    if (name.includes("driver") || name.includes("chauffeur") || slug.includes("car-rental"))
      return { bg: "bg-green-50", border: "border-green-500", icon: "text-green-600", activeBg: "bg-green-100" };
    return { bg: "bg-gray-50", border: "border-gray-500", icon: "text-gray-600", activeBg: "bg-gray-100" };
  };

  // Categories (sub-services) for selected service (main)
  const availableCategories = useMemo(() => selectedService?.children || [], [selectedService]);

  // Service-specific: Filter vehicle categories by service
  const busVehicleCategories = useMemo(() => {
    if (!isBusService || !serviceId) return [];
    return vehicleCategories.filter((c) => c.serviceId === serviceId);
  }, [isBusService, serviceId, vehicleCategories]);

  const truckVehicleCategories = useMemo(() => {
    if (!isTruckService || !serviceId) return [];
    return vehicleCategories.filter((c) => c.serviceId === serviceId);
  }, [isTruckService, serviceId, vehicleCategories]);

  const equipmentVehicleCategories = useMemo(() => {
    if (!isEquipmentService || !serviceId) return [];
    return vehicleCategories.filter((c) => c.serviceId === serviceId);
  }, [isEquipmentService, serviceId, vehicleCategories]);

  const packersVehicleCategories = useMemo(() => {
    if (!isPackersService || !serviceId) return [];
    return vehicleCategories.filter((c) => c.serviceId === serviceId);
  }, [isPackersService, serviceId, vehicleCategories]);

  const luxuryVehicleCategories = useMemo(() => {
    if (!isLuxuryService || !serviceId) return [];
    return vehicleCategories.filter((c) => c.serviceId === serviceId);
  }, [isLuxuryService, serviceId, vehicleCategories]);

  // Filter models by selected service + optional category
  const serviceFilteredModels = useMemo(() => {
    if (!serviceId) return [];

    return vehicleModels.filter((m) => {
      const mServiceId = m.serviceId || m.service?.id;
      const mParentId = m.service?.parentId;

      // direct match
      if (mServiceId === serviceId) return true;
      // if model belongs to a child service, parent match
      if (mParentId === serviceId) return true;

      // fallback slug fuzzy match (optional)
      const svc = approvedServices.find((s) => s.id === serviceId);
      if (svc?.slug && m.service?.slug) {
        const svcSlug = svc.slug.toLowerCase();
        const modelSlug = m.service.slug.toLowerCase();
        if (svcSlug && modelSlug && (modelSlug.includes(svcSlug) || svcSlug.includes(modelSlug))) return true;
      }
      return false;
    });
  }, [vehicleModels, serviceId, approvedServices]);

  const categoryFilteredModels = useMemo(() => {
    // For bus, luxury service, filter by vehicleCategoryId
    if ((isBusService || isLuxuryService) && selectedVehicleCategoryId) {
      return serviceFilteredModels.filter((m) => m.vehicleCategoryId === selectedVehicleCategoryId);
    }
    // For other services, filter by subServiceId
    if (!subServiceId) return serviceFilteredModels;
    return serviceFilteredModels.filter((m) => {
      const mSub = m.subServiceId || m.sub_service?.id;
      const mServiceId = m.serviceId || m.service?.id;
      return mSub === subServiceId || mServiceId === subServiceId;
    });
  }, [serviceFilteredModels, subServiceId, isBusService, isLuxuryService, selectedVehicleCategoryId]);

  // Brand options:
  // - For car flow: use admin brands (and optionally filter by selected vehicle category)
  // - For bike flow: derive brands from filtered models
  const derivedBrandsForModels = useMemo(() => {
    const map = new Map<string, { id: string; name: string; logo?: string; count: number }>();
    categoryFilteredModels.forEach((m) => {
      if (!m.brand?.id) return;
      const existing = map.get(m.brand.id);
      if (existing) existing.count += 1;
      else map.set(m.brand.id, { id: m.brand.id, name: m.brand.name, logo: m.brand.logo, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryFilteredModels]);

  const availableBrands = useMemo(() => {
    if (isCarService) {
      // Filter brands by serviceId (brands are associated with service, not category)
      const carServiceId = selectedService?.id;
      if (carServiceId) {
        return brands.filter((b) => b.serviceId === carServiceId);
      }
      return brands;
    }
    return derivedBrandsForModels;
  }, [isCarService, brands, selectedService?.id, derivedBrandsForModels]);

  // Models list for bike selection (brand + search)
  const filteredModels = useMemo(() => {
    let models = categoryFilteredModels;

    if (selectedBrandId && !isCarService) {
      models = models.filter((m) => m.brand?.id === selectedBrandId);
    }

    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase();
      models = models.filter((m) => m.name.toLowerCase().includes(q) || m.brand?.name.toLowerCase().includes(q));
    }

    return models;
  }, [categoryFilteredModels, selectedBrandId, modelSearch, isCarService]);

  // Locations filter
  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return approvedLocations;
    const q = locationSearch.toLowerCase();
    return approvedLocations.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [approvedLocations, locationSearch]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocations((prev) => (prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId]));
  };

  const selectAllLocations = () => setSelectedLocations(approvedLocations.map((l) => l.id));
  const clearAllLocations = () => setSelectedLocations([]);

  const resetOnServiceChange = (newServiceId: string) => {
    setServiceId(newServiceId);

    // clear downstream selections
    setSubServiceId("");
    setVehicleModelId("");
    setSelectedVehicleCategoryId("");
    setSelectedBrandId("");
    setModelSearch("");

    // clear pricing fields (only matters for bikes)
    setPerDayRate("");
    setKmPerDay("100");
    setExtraKmRate("");
    setSecurityDeposit("");
    setCityPricing({});
  };

  const handleSubmit = async () => {
    // validations
    if (!serviceId) {
      alert("Please select a service");
      return;
    }

    if (isCarService) {
      if (!selectedVehicleCategoryId) {
        alert("Please select a vehicle category");
        return;
      }
      if (!selectedBrandId) {
        alert("Please select a brand");
        return;
      }
      if (!registrationNumber.trim()) {
        alert("Please enter registration number");
        return;
      }
    }

    // Services that only need category selection (truck, equipment, packers, luxury)
    if (needsCategoryOnly && !selectedVehicleCategoryId) {
      alert(`Please select a ${isTruckService ? "truck" : isEquipmentService ? "equipment" : isPackersService ? "vehicle" : isLuxuryService ? "luxury car" : "vehicle"} category`);
      return;
    }

    // Services that need model selection (bike, self-drive, bus, luxury)
    if (needsModelSelection && !needsCategoryOnly && !vehicleModelId) {
      alert(`Please select a ${isBikeService ? "bike" : isBusService ? "bus" : isLuxuryService ? "luxury car" : "vehicle"} model`);
      return;
    }

    // Only services that need pricing (not quote-based services)
    if (needsPricing && (!perDayRate || Number(perDayRate) <= 0)) {
      alert("Please enter a valid per day rate");
      return;
    }

    if (selectedLocations.length === 0) {
      alert("Please select at least one location");
      return;
    }

    setSubmitting(true);
    try {
      let finalPricing: PricingEntry[] | undefined = undefined;

      // Both bike and self-drive need pricing
      if (needsPricing) {
        // 1. Base pricing (global)
        finalPricing = [
          {
            tripTypeId: "self-drive",
            pricingType: "PER_DAY",
            basePrice: Number(perDayRate),
            perDayRate: Number(perDayRate),
            perKmRate: extraKmRate ? Number(extraKmRate) : undefined,
            deposit: securityDeposit ? Number(securityDeposit) : undefined,
            kmLimit: kmPerDay ? Number.parseInt(kmPerDay, 10) : 100,
          },
        ];

        // 2. City-wise overrides
        Object.entries(cityPricing).forEach(([locId, cityData]) => {
          if (cityData && Object.values(cityData).some(val => val && Number(val) > 0)) {
            finalPricing?.push({
              locationId: locId,
              tripTypeId: "self-drive",
              pricingType: "PER_DAY",
              basePrice: Number(cityData.perDayRate) || Number(perDayRate),
              perDayRate: Number(cityData.perDayRate) || Number(perDayRate),
              perKmRate: cityData.extraKmRate ? Number(cityData.extraKmRate) : (extraKmRate ? Number(extraKmRate) : undefined),
              deposit: cityData.securityDeposit ? Number(cityData.securityDeposit) : (securityDeposit ? Number(securityDeposit) : undefined),
              kmLimit: cityData.kmPerDay ? Number.parseInt(cityData.kmPerDay, 10) : (kmPerDay ? Number.parseInt(kmPerDay, 10) : 100),
            });
          }
        });
      }

      const res = await fetch("/api/vendor/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleModelId: needsModelSelection && !needsCategoryOnly ? vehicleModelId : undefined,
          serviceId,
          subServiceId: needsModelSelection && !needsCategoryOnly ? subServiceId || undefined : undefined,

          // For car services: category + brand; For truck/equipment/packers: category only
          vehicleCategoryId: isCarService || needsCategoryOnly ? selectedVehicleCategoryId || undefined : undefined,
          brandId: isCarService ? selectedBrandId || undefined : undefined,

          registrationNumber: registrationNumber || undefined,
          yearOfManufacture: yearOfManufacture ? Number.parseInt(yearOfManufacture, 10) : undefined,
          color: color || undefined,
          locationIds: selectedLocations,
          pricing: finalPricing,

          // Include vehicle images if any are uploaded
          images: needsVehicleImages && Object.keys(vehicleImages).length > 0
            ? JSON.stringify(vehicleImages)
            : undefined,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        router.push("/vendor/fleet");
      } else {
        alert(result.error || result.details || "Failed to add vehicle");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Failed to add vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo(() => {
    let base = needsModelSelection
      ? [
        { num: 1, label: "Vehicle", icon: isBikeService ? Bike : CarFront },
        { num: 2, label: "Details", icon: Layers },
        { num: 3, label: "Locations", icon: MapPin },
      ]
      : [
        { num: 1, label: "Category", icon: Car },
        { num: 2, label: "Details", icon: Layers },
        { num: 3, label: "Locations", icon: MapPin },
      ];

    if (needsPricing) {
      base.push({ num: 4, label: "General Pricing", icon: Tag });
      if (needsCityPricing) {
        base.push({ num: 5, label: "City Pricing", icon: MapPin });
      }
    }
    return base;
  }, [needsModelSelection, needsPricing, needsCityPricing, isBikeService]);

  // Step 1 enable rule
  const canGoStep2 =
    !!serviceId &&
    (needsModelSelection
      ? !!vehicleModelId
      : needsCategoryOnly
        ? !!selectedVehicleCategoryId // Truck, Equipment, Packers only need category
        : !!selectedVehicleCategoryId && !!selectedBrandId); // Car services need category + brand

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (mainServices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
        </div>

        <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-200">
          <Layers className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Approved Services</h2>
          <p className="text-yellow-700 mb-4">You need at least one approved service before adding vehicles to your fleet.</p>
          <Button onClick={() => router.push("/vendor/services/request")}>Request Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
          <p className="text-gray-600">Add a new vehicle to your fleet</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => {
                  if (s.num <= step) setStep(s.num);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  step === s.num ? "bg-blue-100 text-blue-700" : step > s.num ? "text-green-600 cursor-pointer" : "text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === s.num ? "bg-blue-600 text-white" : step > s.num ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                  )}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="hidden md:block font-medium">{s.label}</span>
              </button>
              {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Service Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Select Service</h2>
                <p className="text-sm text-gray-500">Choose the service type for this vehicle</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainServices.map((service) => {
                const Icon = getServiceIcon(service);
                const colors = getServiceColor(service);
                const isSelected = serviceId === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => resetOnServiceChange(service.id)}
                    className={cn(
                      "p-5 rounded-xl border-2 transition-all text-left group",
                      isSelected ? `${colors.border} ${colors.activeBg} shadow-md` : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors", isSelected ? colors.bg : "bg-gray-100 group-hover:bg-gray-200")}>
                      <Icon className={cn("w-6 h-6", isSelected ? colors.icon : "text-gray-500")} />
                    </div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    {service.children?.length ? <p className="text-xs text-gray-500 mt-1">{service.children.length} categories</p> : null}
                    {isSelected ? (
                      <div className={cn("mt-2 flex items-center text-sm", colors.icon)}>
                        <Check className="w-4 h-4 mr-1" />
                        Selected
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection (for Bike and Self-Drive) */}
          {needsModelSelection && selectedService && availableCategories.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select {isBikeService ? "Bike" : "Car"} Category
                  </h2>
                  <p className="text-sm text-gray-500">Optional filter</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSubServiceId("")}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-colors font-medium",
                    !subServiceId ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                  )}
                >
                  All Categories
                </button>
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSubServiceId(category.id);
                      setVehicleModelId("");
                      setSelectedBrandId("");
                      setModelSearch("");
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-colors font-medium",
                      subServiceId === category.id ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bus Vehicle Category Selection */}
          {isBusService && serviceId && busVehicleCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Bus Category</h2>
                <p className="text-sm text-gray-600 mt-1">Choose the type of bus (optional filter for models)</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedVehicleCategoryId("");
                      setVehicleModelId("");
                      setSelectedBrandId("");
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      !selectedVehicleCategoryId ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Bus className="w-6 h-6 text-indigo-600" />
                      <div>
                        <p className="font-medium text-gray-900">All Categories</p>
                        <p className="text-xs text-gray-500">Show all bus models</p>
                      </div>
                    </div>
                  </button>
                  {busVehicleCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedVehicleCategoryId(category.id);
                        setVehicleModelId("");
                        setSelectedBrandId("");
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedVehicleCategoryId === category.id ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Bus className="w-6 h-6 text-indigo-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.seatingCapacity ? <p className="text-xs text-gray-500">{category.seatingCapacity} Seater</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Truck Vehicle Category Selection */}
          {isTruckService && serviceId && truckVehicleCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Truck Category <span className="text-red-500">*</span></h2>
                <p className="text-sm text-gray-600 mt-1">Choose the type of truck for your fleet</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {truckVehicleCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedVehicleCategoryId(category.id);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedVehicleCategoryId === category.id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Truck className="w-6 h-6 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.luggageCapacity ? <p className="text-xs text-gray-500">{category.luggageCapacity}</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Equipment Category Selection */}
          {isEquipmentService && serviceId && equipmentVehicleCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Equipment Category <span className="text-red-500">*</span></h2>
                <p className="text-sm text-gray-600 mt-1">Choose the type of equipment for your fleet</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {equipmentVehicleCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedVehicleCategoryId(category.id);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedVehicleCategoryId === category.id ? "border-amber-500 bg-amber-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Wrench className="w-6 h-6 text-amber-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.description ? <p className="text-xs text-gray-500 truncate">{category.description}</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Packers & Movers Vehicle Category Selection */}
          {isPackersService && serviceId && packersVehicleCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Vehicle Category <span className="text-red-500">*</span></h2>
                <p className="text-sm text-gray-600 mt-1">Choose the type of vehicle for your fleet</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {packersVehicleCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedVehicleCategoryId(category.id);
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedVehicleCategoryId === category.id ? "border-cyan-500 bg-cyan-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-cyan-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.luggageCapacity ? <p className="text-xs text-gray-500">{category.luggageCapacity}</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Luxury Car Category Selection (Optional Filter) */}
          {isLuxuryService && serviceId && luxuryVehicleCategories.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-purple-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Select Luxury Car Category</h2>
                    <p className="text-sm text-gray-600 mt-1">Filter models by category (optional)</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedVehicleCategoryId("");
                      setVehicleModelId("");
                      setSelectedBrandId("");
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      !selectedVehicleCategoryId ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">All Categories</p>
                        <p className="text-xs text-gray-500">Show all luxury models</p>
                      </div>
                    </div>
                  </button>
                  {luxuryVehicleCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedVehicleCategoryId(category.id);
                        setVehicleModelId("");
                        setSelectedBrandId("");
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        selectedVehicleCategoryId === category.id ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Crown className="w-6 h-6 text-purple-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          {category.seatingCapacity ? <p className="text-xs text-gray-500">{category.seatingCapacity} Seater</p> : null}
                          {category.description ? <p className="text-xs text-gray-400 truncate">{category.description}</p> : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800">Quote-Based Pricing</p>
                      <p className="text-sm text-purple-600 mt-1">Luxury car rental is quote-based. You'll set pricing when sending quotes to customers, not while adding vehicles.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Car Category + Brand */}
          {isCarService && serviceId && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Vehicle Category & Brand</h2>
                <p className="text-sm text-gray-600 mt-1">For car rentals, choose category + brand (pricing is handled by admin)</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Vehicle Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Vehicle Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vehicleCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedVehicleCategoryId(category.id);
                          setSelectedBrandId("");
                        }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          selectedVehicleCategoryId === category.id ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <Car className="w-6 h-6 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                            {category.seatingCapacity ? <p className="text-xs text-gray-500">{category.seatingCapacity} Seater</p> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                {selectedVehicleCategoryId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Brand <span className="text-red-500">*</span>
                    </label>

                    {availableBrands.length === 0 ? (
                      <p className="text-sm text-yellow-600">No brands available for this category. Contact admin to add brands.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableBrands.map((brand) => (
                          <button
                            key={brand.id}
                            onClick={() => setSelectedBrandId(brand.id)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                              selectedBrandId === brand.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {brand.logo ? <img src={brand.logo} alt={brand.name} className="w-4 h-4 object-contain" /> : null}
                            {brand.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Pricing Note</p>
                          <p className="text-sm text-blue-600 mt-1">Pricing for car rentals is managed by the admin. You just add vehicle details and locations.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Model Selection (for Bike, Self-Drive, Bus, Luxury) */}
          {needsModelSelection && !needsCategoryOnly && serviceId && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isBikeService ? "bg-orange-100" :
                    isBusService ? "bg-indigo-100" :
                      isLuxuryService ? "bg-purple-100" :
                        "bg-blue-100"
                )}>
                  {isBikeService ? (
                    <Bike className="w-4 h-4 text-orange-600" />
                  ) : isBusService ? (
                    <Bus className="w-4 h-4 text-indigo-600" />
                  ) : isLuxuryService ? (
                    <Crown className="w-4 h-4 text-purple-600" />
                  ) : (
                    <CarFront className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Select {isBikeService ? "Bike" : isBusService ? "Bus" : isLuxuryService ? "Luxury Car" : "Car"} Model
                  </h2>
                  <p className="text-sm text-gray-500">{filteredModels.length} models available</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by brand or model..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Brand chips (optional filter) */}
              {availableBrands.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Filter by Brand:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBrandId("")}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        !selectedBrandId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      All Brands
                    </button>
                    {availableBrands.map((b: any) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBrandId(b.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                          selectedBrandId === b.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {b.name}
                        {"count" in b ? (
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full", selectedBrandId === b.id ? "bg-blue-500" : "bg-gray-200")}>
                            {b.count}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Models Grid */}
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  {isBikeService ? (
                    <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  ) : isBusService ? (
                    <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  ) : isLuxuryService ? (
                    <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  ) : (
                    <CarFront className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  )}
                  <p className="text-gray-500">No models found</p>
                  <p className="text-sm text-gray-400">Try another search/filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
                  {filteredModels.map((model) => {
                    const isSelected = vehicleModelId === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setVehicleModelId(model.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                          isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {model.sideImage ? (
                            <img src={model.sideImage} alt={model.name} className="w-full h-full object-contain" />
                          ) : isBikeService ? (
                            <Bike className="w-8 h-8 text-gray-400" />
                          ) : isBusService ? (
                            <Bus className="w-8 h-8 text-gray-400" />
                          ) : isLuxuryService ? (
                            <Crown className="w-8 h-8 text-gray-400" />
                          ) : (
                            <CarFront className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{model.name}</p>
                          <p className="text-sm text-gray-500">{model.brand?.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            {model.fuelType ? (
                              <span className="flex items-center gap-1">
                                <Fuel className="w-3 h-3" />
                                {model.fuelType}
                              </span>
                            ) : null}
                            {model.transmission ? <span>{model.transmission}</span> : null}
                            {model.seatingCapacity ? <span>{model.seatingCapacity} Seater</span> : null}
                          </div>
                        </div>
                        {isSelected ? <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Next */}
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canGoStep2}>
              Next: Vehicle Details
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Details</h2>
            <p className="text-sm text-gray-600 mt-1">Enter your vehicle's specific details</p>
          </div>

          <div className={cn("p-4 border-b", isLuxuryService ? "bg-purple-50" : "bg-blue-50")}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {needsModelSelection && selectedModel?.sideImage ? (
                  <img src={selectedModel.sideImage} alt={selectedModel.name} className="w-full h-full object-contain" />
                ) : isBikeService ? (
                  <Bike className="w-8 h-8 text-orange-600" />
                ) : isTruckService ? (
                  <Truck className="w-8 h-8 text-blue-600" />
                ) : isEquipmentService ? (
                  <Wrench className="w-8 h-8 text-amber-600" />
                ) : isPackersService ? (
                  <Package className="w-8 h-8 text-cyan-600" />
                ) : isLuxuryService ? (
                  <Crown className="w-8 h-8 text-purple-600" />
                ) : isBusService ? (
                  <Bus className="w-8 h-8 text-indigo-600" />
                ) : isSelfDriveService ? (
                  <CarFront className="w-8 h-8 text-blue-600" />
                ) : (
                  <Car className="w-8 h-8 text-green-600" />
                )}
              </div>
              <div>
                {needsModelSelection && !needsCategoryOnly && selectedModel ? (
                  <>
                    <p className="font-bold text-gray-900">
                      {selectedModel.brand.name} {selectedModel.name}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {selectedModel.fuelType ? <span>{selectedModel.fuelType}</span> : null}
                      {selectedModel.transmission ? <span>{selectedModel.transmission}</span> : null}
                      {selectedModel.seatingCapacity ? <span>{selectedModel.seatingCapacity} Seater</span> : null}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{selectedService?.name}</p>
                  </>
                ) : needsCategoryOnly && selectedVehicleCategoryId ? (
                  <>
                    <p className="font-bold text-gray-900">
                      {(isTruckService ? truckVehicleCategories : isEquipmentService ? equipmentVehicleCategories : isLuxuryService ? luxuryVehicleCategories : packersVehicleCategories).find((c) => c.id === selectedVehicleCategoryId)?.name || "Vehicle Category"}
                    </p>
                    <p className="text-sm text-gray-500">{selectedService?.name}</p>
                  </>
                ) : isCarService ? (
                  <>
                    <p className="font-bold text-gray-900">
                      {vehicleCategories.find((c) => c.id === selectedVehicleCategoryId)?.name || "Vehicle"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {availableBrands.find((b) => b.id === selectedBrandId)?.name || "Brand"} | {selectedService?.name}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number {isCarService ? <span className="text-red-500">*</span> : null}
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., GJ01AB1234"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Manufacture</label>
                <input
                  type="number"
                  value={yearOfManufacture}
                  onChange={(e) => setYearOfManufacture(e.target.value)}
                  placeholder="e.g., 2022"
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder={isBikeService ? "e.g., Matte Black" : "e.g., White"}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vehicle Images Section - Only for specific services */}
            {needsVehicleImages && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Vehicle Images (Optional)</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload images of your vehicle from different angles to help customers see your vehicle better. All images are optional.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'front', label: 'Front View', description: 'Front side of the vehicle' },
                    { key: 'back', label: 'Back View', description: 'Rear side of the vehicle' },
                    { key: 'leftSide', label: 'Left Side View', description: 'Left side of the vehicle' },
                    { key: 'rightSide', label: 'Right Side View', description: 'Right side of the vehicle' },
                    { key: 'inside', label: 'Interior View', description: 'Inside/dashboard view' },
                  ].map((imageType) => (
                    <div key={imageType.key} className="relative">
                      <div className="text-xs font-medium text-gray-700 mb-1">{imageType.label}</div>
                      <div className="text-xs text-gray-500 mb-2">{imageType.description}</div>

                      {vehicleImages[imageType.key as keyof typeof vehicleImages] ? (
                        <div className="relative group">
                          <img
                            src={vehicleImages[imageType.key as keyof typeof vehicleImages]}
                            alt={imageType.label}
                            className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVehicleImages(prev => {
                                const updated = { ...prev };
                                delete updated[imageType.key as keyof typeof vehicleImages];
                                return updated;
                              });
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100">Click X to remove</span>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-white transition block">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Check file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Image size should be less than 5MB. Please choose a smaller image.');
                                  e.target.value = '';
                                  return;
                                }

                                // Compress and resize image before converting to base64
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const img = new Image();
                                  img.onload = () => {
                                    // Create canvas to resize
                                    const canvas = document.createElement('canvas');
                                    const maxWidth = 1200;
                                    const maxHeight = 1200;
                                    let width = img.width;
                                    let height = img.height;

                                    // Calculate new dimensions
                                    if (width > height) {
                                      if (width > maxWidth) {
                                        height = (height * maxWidth) / width;
                                        width = maxWidth;
                                      }
                                    } else {
                                      if (height > maxHeight) {
                                        width = (width * maxHeight) / height;
                                        height = maxHeight;
                                      }
                                    }

                                    canvas.width = width;
                                    canvas.height = height;

                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, 0, 0, width, height);

                                    // Convert to base64 with compression (0.8 quality)
                                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

                                    setVehicleImages(prev => ({
                                      ...prev,
                                      [imageType.key]: compressedBase64
                                    }));
                                  };
                                  img.src = event.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <div className="text-xs text-gray-500">Click to upload</div>
                          <div className="text-xs text-gray-400 mt-1">Max 5MB</div>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next: Select Locations</Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Select Operating Locations</h2>
            <p className="text-sm text-gray-600 mt-1">Choose where this vehicle will be available for booking</p>
          </div>

          <div className="p-6">
            {approvedLocations.length === 0 ? (
              <div className="text-center py-12 bg-yellow-50 rounded-xl">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <p className="text-yellow-800 font-medium">No Approved Locations</p>
                <p className="text-yellow-600 text-sm mt-1 mb-4">You need approved locations to add vehicles</p>
                <Button variant="outline" onClick={() => router.push("/vendor/locations/request")}>
                  Request Location Approval
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllLocations} className="whitespace-nowrap">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllLocations} className="whitespace-nowrap">
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Selected:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedLocations.length} of {approvedLocations.length} locations
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                  {filteredLocations.map((location) => {
                    const isSelected = selectedLocations.includes(location.id);
                    return (
                      <button
                        key={location.id}
                        onClick={() => toggleLocation(location.id)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all text-left",
                          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-blue-600" : "text-gray-400")} />
                          <span className={cn("font-medium truncate", isSelected ? "text-blue-700" : "text-gray-700")}>{location.name}</span>
                        </div>
                        {isSelected ? (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {needsPricing ? (
              <Button onClick={() => setStep(4)} disabled={selectedLocations.length === 0}>
                Next: Set Pricing
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || selectedLocations.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Vehicle...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 4 (Bike and Self-Drive) */}
      {step === 4 && needsPricing && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Set Pricing</h2>
            <p className="text-sm text-gray-600 mt-1">
              Define your {isBikeService ? "bike" : "car"} rental rates and policies
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Per Day Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={perDayRate}
                  onChange={(e) => setPerDayRate(e.target.value)}
                  placeholder="Enter daily rate"
                  className="w-full pl-10 pr-4 py-4 text-xl font-bold border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-sm text-blue-600 mt-2">This is the main rental rate customers will see</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Km Limit Per Day</label>
                <div className="relative">
                  <input
                    type="number"
                    value={kmPerDay}
                    onChange={(e) => setKmPerDay(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extra Km Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={extraKmRate}
                    onChange={(e) => setExtraKmRate(e.target.value)}
                    placeholder="5"
                    className="w-full pl-10 pr-16 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">/km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Refundable deposit collected at pickup</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-500" />
                Pricing Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Per Day</p>
                  <p className="font-bold text-gray-900">₹{perDayRate || "0"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Km Limit</p>
                  <p className="font-bold text-gray-900">{kmPerDay || "100"} km/day</p>
                </div>
                <div>
                  <p className="text-gray-500">Extra Km</p>
                  <p className="font-bold text-gray-900">₹{extraKmRate || "0"}/km</p>
                </div>
                <div>
                  <p className="text-gray-500">Deposit</p>
                  <p className="font-bold text-gray-900">₹{securityDeposit || "0"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {needsCityPricing ? (
              <Button onClick={() => setStep(5)} disabled={!perDayRate || Number(perDayRate) <= 0}>
                Next: City Wise Pricing
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !perDayRate || Number(perDayRate) <= 0}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Vehicle...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 5 - City Wise Pricing */}
      {step === 5 && needsPricing && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">City Wise Pricing (Optional)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Set specific prices for individual cities. Leave blank to use the base price of ₹{perDayRate}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search selected cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {selectedLocations.filter(id => {
                const loc = approvedLocations.find(l => l.id === id);
                return loc?.name.toLowerCase().includes(citySearch.toLowerCase());
              }).map((locId) => {
                const location = approvedLocations.find((l) => l.id === locId);
                if (!location) return null;

                return (
                  <div key={locId} className="p-5 rounded-xl border bg-gray-50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-900">{location.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Per Day (₹)</label>
                        <input
                          type="number"
                          value={cityPricing[locId]?.perDayRate || ""}
                          onChange={(e) => setCityPricing((prev) => ({
                            ...prev,
                            [locId]: { ...prev[locId], perDayRate: e.target.value }
                          }))}
                          placeholder={perDayRate}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Km Limit</label>
                        <input
                          type="number"
                          value={cityPricing[locId]?.kmPerDay || ""}
                          onChange={(e) => setCityPricing((prev) => ({
                            ...prev,
                            [locId]: { ...prev[locId], kmPerDay: e.target.value }
                          }))}
                          placeholder={kmPerDay}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Extra Km (₹)</label>
                        <input
                          type="number"
                          value={cityPricing[locId]?.extraKmRate || ""}
                          onChange={(e) => setCityPricing((prev) => ({
                            ...prev,
                            [locId]: { ...prev[locId], extraKmRate: e.target.value }
                          }))}
                          placeholder={extraKmRate}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Deposit (₹)</label>
                        <input
                          type="number"
                          value={cityPricing[locId]?.securityDeposit || ""}
                          onChange={(e) => setCityPricing((prev) => ({
                            ...prev,
                            [locId]: { ...prev[locId], securityDeposit: e.target.value }
                          }))}
                          placeholder={securityDeposit}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedLocations.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                <p className="text-gray-500">No locations selected. Please go back to Step 3.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Safety: if step > totalSteps */}
      {step > totalSteps ? (
        <div className="bg-white rounded-xl p-6 border text-center text-gray-600">
          Invalid step.{" "}
          <Button variant="outline" onClick={() => setStep(1)}>
            Go to Step 1
          </Button>
        </div>
      ) : null}
    </div>
  );
}
