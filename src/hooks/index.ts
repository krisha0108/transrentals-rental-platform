/**
 * TransRentals Custom Hooks
 *
 * Usage:
 * ```typescript
 * import { useCustomerAuth, useBooking, useServicesAndLocations } from '@/hooks';
 *
 * // In your component
 * const { customer, isAuthenticated, login, logout } = useCustomerAuth();
 * const { createBikeBooking, isSubmitting } = useBooking();
 * const { services, locations, fetchBoth } = useServicesAndLocations();
 * ```
 */

// Customer hooks
export {
  useCustomerAuth,
  useCustomerBookings,
  useBookingDetail,
  useDashboardStats,
  useRecentQuotes,
  useFeaturedVendors,
} from './useCustomer';

// Booking hooks
export { useBooking, useServicesAndLocations, useEquipmentTypes } from './useBooking';
