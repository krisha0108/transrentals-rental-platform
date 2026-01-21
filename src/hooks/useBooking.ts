'use client';

import { useState, useCallback } from 'react';
import { bookingAPI } from '@/lib/api/booking';
import { servicesAPI } from '@/lib/api/services';
import type {
  BikeBookingPayload,
  CarBookingPayload,
  BusBookingPayload,
  TruckBookingPayload,
  EquipmentBookingPayload,
  PackersMoversBookingPayload,
} from '@/types';

interface BookingResult {
  success: boolean;
  message: string;
  booking_id?: number;
}

/**
 * Hook for creating bookings
 */
export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBookingId, setLastBookingId] = useState<number | null>(null);

  const createBikeBooking = useCallback(async (payload: BikeBookingPayload): Promise<BookingResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await bookingAPI.createBikeBooking(payload);
      if (response.data?.booking_id) {
        setLastBookingId(response.data.booking_id);
        return {
          success: true,
          message: 'Bike booking created successfully!',
          booking_id: response.data.booking_id,
        };
      }
      return { success: false, message: response.message || 'Failed to create booking' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createCarBooking = useCallback(
    async (
      type: 'oneway' | 'roundtrip' | 'airport' | 'selfdrive' | 'luxury',
      payload: CarBookingPayload
    ): Promise<BookingResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        let response;

        switch (type) {
          case 'oneway':
            response = await bookingAPI.createOneWayCarBooking(payload);
            break;
          case 'roundtrip':
            response = await bookingAPI.createRoundTripCarBooking(payload);
            break;
          case 'airport':
            response = await bookingAPI.createAirportCarBooking(payload);
            break;
          case 'selfdrive':
            response = await bookingAPI.createSelfDriveBooking(payload as any);
            break;
          case 'luxury':
            response = await bookingAPI.createLuxuryCarBooking(payload as any);
            break;
          default:
            return { success: false, message: 'Invalid car booking type' };
        }

        if (response.data?.booking_id) {
          setLastBookingId(response.data.booking_id);
          return {
            success: true,
            message: 'Car booking created successfully!',
            booking_id: response.data.booking_id,
          };
        }
        return { success: false, message: response.message || 'Failed to create booking' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        return { success: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const createBusBooking = useCallback(
    async (type: 'outstation' | 'local', payload: BusBookingPayload): Promise<BookingResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response =
          type === 'outstation'
            ? await bookingAPI.createOutstationBusBooking(payload)
            : await bookingAPI.createLocalBusBooking(payload);

        if (response.data?.booking_id) {
          setLastBookingId(response.data.booking_id);
          return {
            success: true,
            message: 'Bus booking created successfully!',
            booking_id: response.data.booking_id,
          };
        }
        return { success: false, message: response.message || 'Failed to create booking' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        return { success: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const createTruckBooking = useCallback(
    async (type: 'personal' | 'commercial', payload: TruckBookingPayload): Promise<BookingResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response =
          type === 'personal'
            ? await bookingAPI.createPersonalTruckBooking(payload)
            : await bookingAPI.createCommercialTruckBooking(payload);

        if (response.data?.booking_id) {
          setLastBookingId(response.data.booking_id);
          return {
            success: true,
            message: 'Truck booking created successfully!',
            booking_id: response.data.booking_id,
          };
        }
        return { success: false, message: response.message || 'Failed to create booking' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        return { success: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const createEquipmentBooking = useCallback(
    async (payload: EquipmentBookingPayload): Promise<BookingResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await bookingAPI.createEquipmentBooking(payload);

        if (response.data?.booking_id) {
          setLastBookingId(response.data.booking_id);
          return {
            success: true,
            message: 'Equipment booking created successfully!',
            booking_id: response.data.booking_id,
          };
        }
        return { success: false, message: response.message || 'Failed to create booking' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        return { success: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const createPackersBooking = useCallback(
    async (
      type: 'home' | 'office' | 'vehicle',
      payload: PackersMoversBookingPayload
    ): Promise<BookingResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        let response;

        switch (type) {
          case 'home':
            response = await bookingAPI.createHomePackersBooking(payload);
            break;
          case 'office':
            response = await bookingAPI.createOfficePackersBooking(payload);
            break;
          case 'vehicle':
            response = await bookingAPI.createVehiclePackersBooking(payload);
            break;
          default:
            return { success: false, message: 'Invalid packers booking type' };
        }

        if (response.data?.booking_id) {
          setLastBookingId(response.data.booking_id);
          return {
            success: true,
            message: 'Packers & Movers booking created successfully!',
            booking_id: response.data.booking_id,
          };
        }
        return { success: false, message: response.message || 'Failed to create booking' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        return { success: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    error,
    lastBookingId,
    createBikeBooking,
    createCarBooking,
    createBusBooking,
    createTruckBooking,
    createEquipmentBooking,
    createPackersBooking,
  };
}

/**
 * Hook for fetching services and locations from backend
 */
export function useServicesAndLocations() {
  const [services, setServices] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await servicesAPI.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await servicesAPI.getLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBoth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [servicesData, locationsData] = await Promise.all([
        servicesAPI.getServices(),
        servicesAPI.getLocations(),
      ]);
      setServices(servicesData);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    services,
    locations,
    isLoading,
    error,
    fetchServices,
    fetchLocations,
    fetchBoth,
  };
}

/**
 * Hook for equipment types
 */
export function useEquipmentTypes() {
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipmentTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await servicesAPI.getEquipmentTypes();
      setEquipmentTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    equipmentTypes,
    isLoading,
    error,
    fetchEquipmentTypes,
  };
}
