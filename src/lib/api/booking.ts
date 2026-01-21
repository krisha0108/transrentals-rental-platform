import { apiRequest } from './client';
import type {
  BikeBookingPayload,
  CarBookingPayload,
  BusBookingPayload,
  TruckBookingPayload,
  EquipmentBookingPayload,
  PackersMoversBookingPayload,
  APIResponse,
  Booking,
} from '@/types';

export const bookingAPI = {
  /**
   * Create bike booking
   */
  createBikeBooking: async (
    payload: BikeBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-bike-booking',
      data: payload,
    });
  },

  /**
   * Create car booking (one-way)
   */
  createOneWayCarBooking: async (
    payload: CarBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-oneway-booking',
      data: payload,
    });
  },

  /**
   * Create car booking (round-trip)
   */
  createRoundTripCarBooking: async (
    payload: CarBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-roundtrip-booking',
      data: payload,
    });
  },

  /**
   * Create airport car booking
   */
  createAirportCarBooking: async (
    payload: CarBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-airport-booking',
      data: payload,
    });
  },

  /**
   * Create bus booking (outstation)
   */
  createOutstationBusBooking: async (
    payload: BusBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-outstation-booking',
      data: payload,
    });
  },

  /**
   * Create bus booking (local)
   */
  createLocalBusBooking: async (
    payload: BusBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-local-booking',
      data: payload,
    });
  },

  /**
   * Create truck booking (commercial)
   */
  createCommercialTruckBooking: async (
    payload: TruckBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-commercial-booking',
      data: payload,
    });
  },

  /**
   * Create truck booking (personal)
   */
  createPersonalTruckBooking: async (
    payload: TruckBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-personal-booking',
      data: payload,
    });
  },

  /**
   * Create equipment booking
   */
  createEquipmentBooking: async (
    payload: EquipmentBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-equipment-booking',
      data: payload,
    });
  },

  /**
   * Create packers & movers booking (home)
   */
  createHomePackersBooking: async (
    payload: PackersMoversBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-home-booking',
      data: payload,
    });
  },

  /**
   * Create packers & movers booking (office)
   */
  createOfficePackersBooking: async (
    payload: PackersMoversBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-officePackerMovers',
      data: payload,
    });
  },

  /**
   * Create packers & movers booking (vehicle)
   */
  createVehiclePackersBooking: async (
    payload: PackersMoversBookingPayload
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-vehicle-booking',
      data: payload,
    });
  },

  /**
   * Create self-drive car booking
   */
  createSelfDriveBooking: async (
    payload: CarBookingPayload & {
      transmission?: string;
      fuel_type?: string;
      is_doorstep_delivery?: string;
    }
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/store-selfdrive-booking',
      data: payload,
    });
  },

  /**
   * Create luxury car booking
   */
  createLuxuryCarBooking: async (
    payload: CarBookingPayload & {
      luxury_type?: string;
      package?: string;
    }
  ): Promise<APIResponse<{ booking_id: number }>> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-luxury-booking',
      data: payload,
    });
  },

  /**
   * Get customer bookings by status
   */
  getCustomerBookingsByStatus: async (
    identifier: string,
    status: 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped'
  ): Promise<Booking[]> => {
    const response = await apiRequest<{ success: boolean; bookings: Booking[] }>({
      method: 'POST',
      url: '/customer-bookings-by-status',
      data: { identifier, status },
    });
    return response.bookings || [];
  },

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings: async (phone: string): Promise<Booking[]> => {
    const response = await apiRequest<{ success: boolean; bookings: Booking[] }>({
      method: 'POST',
      url: '/customer-upcoming-bookings',
      data: { phone },
    });
    return response.bookings || [];
  },

  /**
   * Get booking details with quotations
   */
  getBookingDetail: async (bookingId: number): Promise<{
    success: boolean;
    booking: Booking;
    quotations: any[];
    assigned_vehicle?: any;
    assigned_driver?: any;
  }> => {
    return apiRequest({
      method: 'GET',
      url: `/customer-booking-detail/${bookingId}`,
    });
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId: number): Promise<{ success: boolean; booking: Booking }> => {
    return apiRequest({
      method: 'GET',
      url: `/booking/${bookingId}`,
    });
  },

  /**
   * Get booking statistics
   */
  getBookingStats: async (phone: string): Promise<{
    openCount: number;
    completedCount: number;
    upcomingCount: number;
  }> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-booking-stats',
      data: { phone },
    });
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (identifier: string): Promise<{
    active_bookings: number;
    total_earnings: number;
  }> => {
    return apiRequest({
      method: 'POST',
      url: '/customer-dashboard-stats',
      data: { identifier },
    });
  },

  /**
   * Get recent quotes for customer
   */
  getRecentQuotes: async (phone: string): Promise<any[]> => {
    const response = await apiRequest<{ success: boolean; quotations: any[] }>({
      method: 'POST',
      url: '/customer-recent-quotes',
      data: { phone },
    });
    return response.quotations || [];
  },

  /**
   * Get quotation detail
   */
  getQuotationDetail: async (quotationId: number): Promise<any> => {
    return apiRequest({
      method: 'GET',
      url: `/quotation-detail/${quotationId}`,
    });
  },
};
