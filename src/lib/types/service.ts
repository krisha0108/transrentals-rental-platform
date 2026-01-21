// Types for Service Management (Mission Control)

export interface ServiceStats {
  totalBookings: number;
  pendingBookings: number;
  activeLocations: number;
  totalLocations: number;
  totalVehicles: number;
  activeVehicles: number;
  totalVendors: number;
  activeVendors: number;
  monthlyRevenue: number;
  pageViews: number;
  averageRating: number;
  conversionRate: number;
}

export interface ServiceFleetItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  vehicleType: string;
  subService: string;
  basePrice: number;
  locationCount: number;
  isActive: boolean;
  isFeatured: boolean;
  primaryImage?: string;
  specs?: Record<string, string | number>;
  createdAt: string;
}

export interface ServiceLocation {
  id: string;
  name: string;
  slug: string;
  state: string;
  tier: number;
  isEnabled: boolean;
  vehicleCount: number;
  vendorCount: number;
  isActive: boolean;
}

export interface ServiceBooking {
  id: string;
  bookingNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleName: string;
  subService: string;
  pickupLocation: string;
  dropLocation?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  vendorName?: string;
  createdAt: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface ServiceSettings {
  // General
  isEnabled: boolean;
  isFeatured: boolean;
  displayOrder: number;

  // Booking
  allowOnlineBooking: boolean;
  requireVerification: boolean;
  requireDeposit: boolean;
  depositAmount: number;
  minBookingHours: number;
  maxBookingDays: number;
  advanceBookingDays: number;
  cancellationHours: number;

  // Display
  showPricing: boolean;
  showReviews: boolean;
  showVendorInfo: boolean;
  showAvailability: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminAlerts: boolean;
}

export interface ServicePricing {
  minPrice: number;
  maxPrice: number;
  displayFormat: string;
  commission: number;
  extraKmRate: number;
  nightCharges: number;
  securityDeposit: number;
  cleaningFee: number;
  lateFee: number;
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'BASE' | 'DURATION' | 'TRIP_TYPE' | 'SURGE' | 'DISCOUNT';
  value: number;
  unit: 'FIXED' | 'PERCENT';
  conditions?: string;
  isActive: boolean;
}

export interface ServiceSEO {
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  schema: string;
}

export interface SubServiceItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  vehicleCount: number;
  isActive: boolean;
  displayOrder: number;
  imageUrl?: string;
}

// API Response types
export interface ServiceStatsResponse {
  success: boolean;
  stats: ServiceStats;
}

export interface ServiceFleetResponse {
  success: boolean;
  fleet: ServiceFleetItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ServiceLocationsResponse {
  success: boolean;
  locations: ServiceLocation[];
  enabledIds: string[];
}

export interface ServiceBookingsResponse {
  success: boolean;
  bookings: ServiceBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  };
}
