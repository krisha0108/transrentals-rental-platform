/**
 * TransRentals API Module
 *
 * This module exports all API functions for interacting with the TransRentals CRM backend.
 * Backend URL: https://app.transrentals.in/api
 *
 * Usage:
 * ```typescript
 * import { bookingAPI, customerAPI, servicesAPI } from '@/lib/api';
 *
 * // Create a booking
 * const result = await bookingAPI.createBikeBooking(payload);
 *
 * // Get customer bookings
 * const bookings = await customerAPI.getBookingsByStatus(identifier, 'Open');
 *
 * // Get all services
 * const services = await servicesAPI.getServices();
 * ```
 */

// Core API clients
export { apiClient } from './apiClient';
export { apiClient as axiosClient, apiRequest } from './client';

// Booking APIs
export { bookingAPI } from './booking';

// Customer APIs
export { customerAPI } from './customer';

// Services & Locations APIs
export { servicesAPI, callbackAPI } from './services';

// Locations API
export { locationsAPI } from './locations';

// Auth Service
export { authService } from './services/authService';

// Booking Service (legacy - use bookingAPI instead)
export { bookingService } from './services/bookingService';

// Re-export types for convenience
export type {
  Location,
  Service,
  Vehicle,
  VehicleSpecifications,
  BookingPayload,
  BikeBookingPayload,
  CarBookingPayload,
  BusBookingPayload,
  TruckBookingPayload,
  EquipmentBookingPayload,
  PackersMoversBookingPayload,
  Customer,
  Booking,
  Vendor,
  Quote,
  Quotation,
  AssignedVehicle,
  AssignedDriver,
  BookingDetailResponse,
  ChatMessage,
  Notification,
  BookingStats,
  DashboardStats,
  LocationPageData,
  PopularRoute,
  FAQ,
  BlogPost,
  Review,
  APIResponse,
  PaginatedResponse,
} from '@/types';
