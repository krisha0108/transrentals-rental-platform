'use client';

import { useState, useEffect, useCallback } from 'react';
import { customerAPI } from '@/lib/api/customer';
import type { BookingDetail, BookingStats, Quotation, Vendor } from '@/types';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

/**
 * Hook for managing customer authentication state
 */
export function useCustomerAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load customer from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedCustomer = localStorage.getItem('customer');
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

      if (storedCustomer && token) {
        try {
          setCustomer(JSON.parse(storedCustomer));
          setIsAuthenticated(true);
        } catch (e) {
          console.error('Failed to parse stored customer:', e);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await customerAPI.login(email, password);
      if (response.customer && response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('customer', JSON.stringify(response.customer));
        setCustomer(response.customer);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    setCustomer(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; phone: string; password: string }) => {
      try {
        // Step 1: Send OTP
        const otpResponse = await customerAPI.sendOTP(data);
        if (otpResponse.status !== 'success') {
          return { success: false, message: otpResponse.message || 'Failed to send OTP' };
        }
        return { success: true, message: 'OTP sent successfully', requiresOTP: true };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },
    []
  );

  const verifyOTP = useCallback(async (name: string, email: string, otp: string) => {
    try {
      const response = await customerAPI.verifyOTP(name, email, otp);
      if (response.customer && response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('customer', JSON.stringify(response.customer));
        setCustomer(response.customer);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message || 'Verification failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }, []);

  const googleLogin = useCallback(async (token: string) => {
    try {
      const response = await customerAPI.googleLogin(token);
      if (response.customer && response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('customer', JSON.stringify(response.customer));
        setCustomer(response.customer);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message || 'Google login failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed',
      };
    }
  }, []);

  return {
    customer,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    verifyOTP,
    googleLogin,
  };
}

/**
 * Hook for fetching customer bookings
 */
export function useCustomerBookings(identifier?: string) {
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingsByStatus = useCallback(
    async (status: 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped') => {
      if (!identifier) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await customerAPI.getBookingsByStatus(identifier, status);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    },
    [identifier]
  );

  const fetchUpcomingBookings = useCallback(async () => {
    if (!identifier) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await customerAPI.getUpcomingBookings(identifier);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, [identifier]);

  return {
    bookings,
    isLoading,
    error,
    fetchBookingsByStatus,
    fetchUpcomingBookings,
  };
}

/**
 * Hook for fetching booking details
 */
export function useBookingDetail(bookingId?: number) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingDetail = useCallback(async () => {
    if (!bookingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await customerAPI.getBookingDetail(bookingId);
      if (response.success) {
        setBooking(response.booking);
        setQuotations(response.quotations || []);
        setAssignedVehicle(response.assigned_vehicle);
        setAssignedDriver(response.assigned_driver);
      } else {
        setError('Failed to fetch booking details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail();
    }
  }, [bookingId, fetchBookingDetail]);

  return {
    booking,
    quotations,
    assignedVehicle,
    assignedDriver,
    isLoading,
    error,
    refetch: fetchBookingDetail,
  };
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats(identifier?: string) {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!identifier) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await customerAPI.getBookingStats(identifier);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) {
      fetchStats();
    }
  }, [identifier, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for recent quotes
 */
export function useRecentQuotes(phone?: string) {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!phone) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await customerAPI.getRecentQuotes(phone);
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    if (phone) {
      fetchQuotes();
    }
  }, [phone, fetchQuotes]);

  return {
    quotes,
    isLoading,
    error,
    refetch: fetchQuotes,
  };
}

/**
 * Hook for featured vendors
 */
export function useFeaturedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await customerAPI.getFeaturedVendors();
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
    isLoading,
    error,
    refetch: fetchVendors,
  };
}
