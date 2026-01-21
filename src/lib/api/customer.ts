import { apiRequest } from './client';

// ============================================
// TYPES
// ============================================

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
  created_at?: string;
}

export interface BookingStats {
  openCount: number;
  completedCount: number;
  upcomingCount: number;
}

export interface DashboardStats {
  active_bookings: number;
  total_earnings: number;
}

export interface Vendor {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  image?: string;
  rating?: number;
}

export interface Quotation {
  id: number;
  booking_id: number;
  vendor_id: number;
  vendor?: Vendor;
  amount: number;
  description?: string;
  inclusions?: string;
  exclusions?: string;
  terms?: string;
  cancellation_policy?: string;
  payment_method?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface AssignedVehicle {
  id: number;
  vehicle_name: string;
  vehicle_type: string;
  model: string;
  reg_no: string;
}

export interface AssignedDriver {
  id: number;
  name: string;
  phone: string;
}

export interface BookingDetail {
  id: number;
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  status: 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped';
  vendor_id?: number;
  vendor?: Vendor;
  // Bike specific
  bike_type?: string;
  bike_duration?: string;
  // Car specific
  car_type?: string;
  trip_type?: string;
  total_passangers?: number;
  transmission?: string;
  fuel_type?: string;
  is_doorstep_delivery?: number;
  // Luxury specific
  luxury_type?: string;
  package?: string;
  // Bus specific
  location_type?: string;
  // Truck specific
  truck_mode?: string;
  truck_type?: string;
  commercial_good_type?: string;
  personal_good_type?: string;
  weight?: string;
  weight_val?: string;
  // Equipment specific
  machine_type?: string;
  job_duration?: string;
  no_of_equipments?: string;
  // Packers specific
  shifting_type?: string;
  home_shifting?: string;
  office_shifting?: string;
  vehicle_shifting?: string;
  job_date?: string;
  // General
  other_info?: string;
  created_at: string;
  updated_at?: string;
}

export interface BookingDetailResponse {
  success: boolean;
  booking: BookingDetail;
  quotations: Quotation[];
  assigned_vehicle?: AssignedVehicle;
  assigned_driver?: AssignedDriver;
}

export interface ChatMessage {
  id: number;
  booking_id: number;
  sender_type: 'customer' | 'vendor';
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  customer_id?: number;
  vendor_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// ============================================
// CUSTOMER API
// ============================================

export const customerAPI = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  /**
   * Customer Login with email/password
   */
  login: async (email: string, password: string) => {
    return apiRequest<{
      status?: string;
      message?: string;
      customer?: Customer;
      token?: string;
    }>({
      method: 'POST',
      url: '/login',
      data: { email, password },
    });
  },

  /**
   * Send OTP for registration
   */
  sendOTP: async (data: { name: string; email: string; phone: string; password: string }) => {
    return apiRequest<{ status?: string; message?: string }>({
      method: 'POST',
      url: '/send-otp',
      data,
    });
  },

  /**
   * Verify OTP and complete registration
   */
  verifyOTP: async (name: string, email: string, otp: string) => {
    return apiRequest<{
      status?: string;
      message?: string;
      customer?: Customer;
      token?: string;
    }>({
      method: 'POST',
      url: '/verify-otp',
      data: { name, email, otp },
    });
  },

  /**
   * Google Login
   */
  googleLogin: async (token: string) => {
    return apiRequest<{
      status?: string;
      message?: string;
      customer?: Customer;
      token?: string;
    }>({
      method: 'POST',
      url: '/google-login',
      data: { token },
    });
  },

  /**
   * Get customer by phone/email
   */
  getCustomerByIdentifier: async (identifier: string) => {
    return apiRequest<{
      success: boolean;
      customer?: Customer;
    }>({
      method: 'POST',
      url: '/get-customer-by-phone',
      data: { identifier },
    });
  },

  /**
   * Update customer profile
   */
  updateProfile: async (data: Partial<Customer>) => {
    return apiRequest<{
      status?: string;
      message?: string;
      customer?: Customer;
    }>({
      method: 'POST',
      url: '/update-profile',
      data,
    });
  },

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  /**
   * Send OTP for forgot password
   */
  forgotPasswordSendOTP: async (email: string) => {
    return apiRequest<{ status?: string; message?: string }>({
      method: 'POST',
      url: '/customer/forgot-password/send-otp',
      data: { email },
    });
  },

  /**
   * Verify OTP for forgot password
   */
  forgotPasswordVerifyOTP: async (email: string, otp: string) => {
    return apiRequest<{ status?: string; message?: string }>({
      method: 'POST',
      url: '/customer/forgot-password/verify-otp',
      data: { email, otp },
    });
  },

  /**
   * Reset password
   */
  forgotPasswordReset: async (email: string, password: string, password_confirmation: string) => {
    return apiRequest<{ status?: string; message?: string }>({
      method: 'POST',
      url: '/customer/forgot-password/reset',
      data: { email, password, password_confirmation },
    });
  },

  // ==========================================
  // DASHBOARD & STATS
  // ==========================================

  /**
   * Get booking statistics
   */
  getBookingStats: async (phone: string): Promise<BookingStats> => {
    const response = await apiRequest<{
      success: boolean;
      openCount: number;
      completedCount: number;
      upcomingCount: number;
    }>({
      method: 'POST',
      url: '/customer-booking-stats',
      data: { phone },
    });
    return {
      openCount: response.openCount || 0,
      completedCount: response.completedCount || 0,
      upcomingCount: response.upcomingCount || 0,
    };
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (identifier: string): Promise<DashboardStats> => {
    const response = await apiRequest<{
      success: boolean;
      active_bookings: number;
      total_earnings: number;
    }>({
      method: 'POST',
      url: '/customer-dashboard-stats',
      data: { identifier },
    });
    return {
      active_bookings: response.active_bookings || 0,
      total_earnings: response.total_earnings || 0,
    };
  },

  // ==========================================
  // BOOKINGS
  // ==========================================

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings: async (phone: string): Promise<BookingDetail[]> => {
    const response = await apiRequest<{
      success: boolean;
      bookings: BookingDetail[];
    }>({
      method: 'POST',
      url: '/customer-upcoming-bookings',
      data: { phone },
    });
    return response.bookings || [];
  },

  /**
   * Get bookings by status
   */
  getBookingsByStatus: async (
    identifier: string,
    status: 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped'
  ): Promise<BookingDetail[]> => {
    const response = await apiRequest<{
      success: boolean;
      bookings: BookingDetail[];
    }>({
      method: 'POST',
      url: '/customer-bookings-by-status',
      data: { identifier, status },
    });
    return response.bookings || [];
  },

  /**
   * Get booking detail with quotations
   */
  getBookingDetail: async (bookingId: number): Promise<BookingDetailResponse> => {
    return apiRequest<BookingDetailResponse>({
      method: 'GET',
      url: `/customer-booking-detail/${bookingId}`,
    });
  },

  /**
   * Get quotation detail
   */
  getQuotationDetail: async (quotationId: number): Promise<Quotation> => {
    return apiRequest<Quotation>({
      method: 'GET',
      url: `/quotation-detail/${quotationId}`,
    });
  },

  /**
   * Get recent quotes
   */
  getRecentQuotes: async (phone: string): Promise<Quotation[]> => {
    const response = await apiRequest<{
      success: boolean;
      quotations: Quotation[];
    }>({
      method: 'POST',
      url: '/customer-recent-quotes',
      data: { phone },
    });
    return response.quotations || [];
  },

  // ==========================================
  // VENDORS
  // ==========================================

  /**
   * Get featured vendors
   */
  getFeaturedVendors: async (): Promise<Vendor[]> => {
    const response = await apiRequest<{
      success: boolean;
      vendors: Vendor[];
    }>({
      method: 'GET',
      url: '/vendors/featured',
    });
    return response.vendors || [];
  },

  // ==========================================
  // CHAT
  // ==========================================

  /**
   * Get vendors for a booking (for chat)
   */
  getBookingVendors: async (bookingId: number): Promise<Vendor[]> => {
    const response = await apiRequest<{
      success: boolean;
      vendors: Vendor[];
    }>({
      method: 'GET',
      url: `/customer/bookings/${bookingId}/vendors`,
    });
    return response.vendors || [];
  },

  /**
   * Get chat messages for a booking with a vendor
   */
  getChatMessages: async (bookingId: number, vendorId: number): Promise<ChatMessage[]> => {
    const response = await apiRequest<{
      success: boolean;
      messages: ChatMessage[];
    }>({
      method: 'GET',
      url: `/customer/bookings/${bookingId}/chats/${vendorId}`,
    });
    return response.messages || [];
  },

  /**
   * Send chat message
   */
  sendChatMessage: async (bookingId: number, vendorId: number, message: string) => {
    return apiRequest<{
      success: boolean;
      message: ChatMessage;
    }>({
      method: 'POST',
      url: `/customer/bookings/${bookingId}/chats/${vendorId}`,
      data: { message },
    });
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (bookingId: number, vendorId: number) => {
    return apiRequest<{ success: boolean }>({
      method: 'POST',
      url: `/customer/bookings/${bookingId}/vendor/${vendorId}/read-messages`,
    });
  },

  /**
   * Get customer chat bookings
   */
  getChatBookings: async (): Promise<BookingDetail[]> => {
    const response = await apiRequest<{
      success: boolean;
      bookings: BookingDetail[];
    }>({
      method: 'GET',
      url: '/customer/chat/bookings',
    });
    return response.bookings || [];
  },

  /**
   * Get live chats
   */
  getLiveChats: async () => {
    return apiRequest<{
      success: boolean;
      chats: any[];
    }>({
      method: 'GET',
      url: '/customer/chat/live-chats',
    });
  },

  // ==========================================
  // REVIEWS
  // ==========================================

  /**
   * Submit review for a booking
   */
  submitReview: async (data: {
    booking_id: number;
    rating: number;
    comment?: string;
    category_ratings?: Record<string, number>;
  }) => {
    return apiRequest<{
      success: boolean;
      message?: string;
      review?: Review;
    }>({
      method: 'POST',
      url: '/customer/review',
      data,
    });
  },

  /**
   * Check if review exists for booking
   */
  checkReview: async (bookingId: number): Promise<boolean> => {
    const response = await apiRequest<{
      success: boolean;
      has_review: boolean;
    }>({
      method: 'GET',
      url: `/customer/review/check/${bookingId}`,
    });
    return response.has_review || false;
  },

  /**
   * Get review for booking
   */
  getReviewForBooking: async (bookingId: number): Promise<Review | null> => {
    const response = await apiRequest<{
      success: boolean;
      review: Review;
    }>({
      method: 'GET',
      url: `/customer/review/${bookingId}`,
    });
    return response.review || null;
  },

  /**
   * Get review categories
   */
  getReviewCategories: async (): Promise<{ id: number; name: string }[]> => {
    const response = await apiRequest<{
      success: boolean;
      categories: { id: number; name: string }[];
    }>({
      method: 'GET',
      url: '/customer/categories',
    });
    return response.categories || [];
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  /**
   * Get customer notifications
   */
  getNotifications: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      notifications: any[];
    }>({
      method: 'GET',
      url: `/customer-notifications/${customerId}`,
    });
  },

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount: async (customerId: number): Promise<number> => {
    const response = await apiRequest<{
      success: boolean;
      count: number;
    }>({
      method: 'POST',
      url: '/customer-unread-notification-count',
      data: { customer_id: customerId },
    });
    return response.count || 0;
  },

  // ==========================================
  // HELPDESK
  // ==========================================

  /**
   * Create helpdesk ticket
   */
  createHelpdeskTicket: async (
    data:
      | {
          customer_id: number;
          heading: string;
          problem: string;
          booking_id?: number;
        }
      | FormData
  ) => {
    return apiRequest<{
      success: boolean;
      message?: string;
      ticket?: any;
    }>({
      method: 'POST',
      url: '/customer/helpdesk/store',
      data,
    });
  },

  updateHelpdeskTicket: async (ticketId: number, data: FormData) => {
    return apiRequest<{
      success: boolean;
      message?: string;
      ticket?: any;
    }>({
      method: 'PUT',
      url: `/customer/helpdesk/tickets/${ticketId}`,
      data,
    });
  },

  /**
   * Get customer helpdesk tickets
   */
  getHelpdeskTickets: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      tickets: any[];
    }>({
      method: 'GET',
      url: '/customer/helpdesk/tickets',
      params: { customer_id: customerId },
    });
  },

  // ==========================================
  // EXPENSES
  // ==========================================

  /**
   * Get customer expenses
   */
  getExpenses: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      expenses: any[];
    }>({
      method: 'GET',
      url: '/customer-expenses',
      params: { customer_id: customerId },
    });
  },

  // ==========================================
  // BACKR (LOYALTY) SYSTEM
  // ==========================================

  /**
   * Get Backr wallet info
   */
  getBackrWallet: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      wallet: any;
    }>({
      method: 'GET',
      url: '/backr',
      params: { customer_id: customerId },
    });
  },

  /**
   * Update Backr wallet
   */
  updateBackrWallet: async (customerId: number, amount: number) => {
    return apiRequest<{
      success: boolean;
      message?: string;
    }>({
      method: 'POST',
      url: '/backr/update-wallet',
      data: { customer_id: customerId, amount },
    });
  },

  /**
   * Redeem Backr tokens
   */
  redeemBackrTokens: async (customerId: number, amount: number) => {
    return apiRequest<{
      success: boolean;
      message?: string;
    }>({
      method: 'POST',
      url: '/backr/redeem',
      data: { customer_id: customerId, amount },
    });
  },

  /**
   * Spin wheel start
   */
  spinWheelStart: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      can_spin: boolean;
    }>({
      method: 'POST',
      url: '/spin/start',
      data: { customer_id: customerId },
    });
  },

  /**
   * Spin wheel confirm
   */
  spinWheelConfirm: async (customerId: number, result: number) => {
    return apiRequest<{
      success: boolean;
      tokens_won: number;
    }>({
      method: 'POST',
      url: '/spin/confirm',
      data: { customer_id: customerId, result },
    });
  },

  /**
   * Get spin history
   */
  getSpinHistory: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      history: any[];
    }>({
      method: 'GET',
      url: '/spin/history',
      params: { customer_id: customerId },
    });
  },

  /**
   * Get redeem history
   */
  getRedeemHistory: async (customerId: number) => {
    return apiRequest<{
      success: boolean;
      history: any[];
    }>({
      method: 'GET',
      url: '/redeem/history',
      params: { customer_id: customerId },
    });
  },

  // ==========================================
  // PAYMENTS
  // ==========================================

  /**
   * Store payment
   */
  storePayment: async (data: {
    booking_id: number;
    quotation_id: number;
    amount: number;
    payment_method: string;
    transaction_id?: string;
  }) => {
    return apiRequest<{
      success: boolean;
      message?: string;
      payment?: any;
    }>({
      method: 'POST',
      url: '/payments/store',
      data,
    });
  },

  // ==========================================
  // LOCATION UPDATE
  // ==========================================

  /**
   * Update customer location
   */
  updateLocation: async (customerId: number, latitude: number, longitude: number) => {
    return apiRequest<{
      success: boolean;
      message?: string;
    }>({
      method: 'POST',
      url: '/customer/update-customer-location',
      data: { customer_id: customerId, latitude, longitude },
    });
  },

  // ==========================================
  // SLIDERS/BANNERS
  // ==========================================

  /**
   * Get active sliders
   */
  getSliders: async () => {
    return apiRequest<{
      success: boolean;
      sliders: any[];
    }>({
      method: 'GET',
      url: '/customer/sliders',
    });
  },
};
