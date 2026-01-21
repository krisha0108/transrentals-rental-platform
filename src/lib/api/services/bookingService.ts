import { apiClient } from '../apiClient';

export interface Service {
  id: number;
  name: string;
  parent_id?: number;
  status: string;
  image?: string;
}

export interface Location {
  id: number;
  name: string;
  type: string;
  parent_id?: number;
  status: string;
  state?: string;
}

export interface BookingResponse {
  message?: string;
  status?: boolean;
  booking_id?: number;
}

// Bike Booking
export interface BikeBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  bike_duration: string; // 1: Hourly, 2: Daily, 3: Weekly, 4: Monthly
  bike_type: string; // 1: Sport, 2: Scooter, 3: Cruiser, 4: Street, 5: Adventure, 6: Dirt
  other_info?: string;
}

// Car Booking (Round Trip, One Way, Airport)
export interface CarBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  trip_type: string; // 1: One Way, 2: Airport, 3: Round Trip
  car_type: string; // 1: Hatchback, 2: Sedan, 3: MUV, 4: SUV
  total_passangers?: number;
  other_info?: string;
  airport_option?: string; // For Airport Transfer: 1: Pickup, 2: Drop
}

// Self Drive Car Booking
export interface SelfDriveBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  car_type: string;
  transmission: string; // 1: Automatic, 2: Manual
  fuel_type: string; // 1: Diesel, 2: Petrol, 3: Electric, 4: CNG
  is_doorstep_delivery: string; // 0: No, 1: Yes
  total_passangers?: number;
  other_info?: string;
}

// Luxury Car Booking
export interface LuxuryCarBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  luxury_type: string; // 1: Wedding, 2: Personal, 3: Corporate
  package?: string; // 1: Local 4hr/40km, 2: Outstation Trip, 3: Airport Transfer
  total_passangers?: number;
  other_info?: string;
}

// Bus Booking
export interface BusBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  service_type: string; // 1: Outstation, 2: Local
  total_passangers?: number;
  other_info?: string;
}

// Truck Booking
export interface TruckBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  truck_mode: string; // 1: Personal, 2: Commercial
  truck_type: string;
  commercial_good_type?: string;
  personal_good_type?: string;
  weight: string; // 1: KG, 2: TON
  weight_val?: string;
  other_info?: string;
}

// Equipment Booking
export interface EquipmentBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  journey_datetime: string;
  return_datetime?: string;
  machine_type: string;
  job_duration: string; // 1: 1-5 days, 2: 6-15 days, 3: 16-30 days, 4: 30+ days
  no_of_equipments?: string;
  other_info?: string;
}

// Packers & Movers Booking
export interface PackersMoversBookingData {
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  job_date: string;
  shifting_type: string; // Home, Office, Vehicle
  home_shifting?: string; // 1: 1BHK, 2: 2BHK, 3: 3BHK, 4: 4+BHK, 5: Villa
  office_shifting?: string; // 1: Individual, 2: 10 employees, 3: 20 employees, 4: 20+ employees
  vehicle_shifting?: string; // 1: Bike, 2: Car, 3: SUV
  other_info?: string;
}

export const bookingService = {
  /**
   * Get Active Services
   */
  async getServices(): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>('/services');
    console.log('bookingService.getServices - Full response:', response);
    // apiClient returns the data directly, not wrapped in response.data
    return response.services || [];
  },

  /**
   * Get Active Locations (Cities) from Database
   */
  async getLocations(): Promise<Location[]> {
    const response = await apiClient.get<{ success: boolean; locations: Location[] }>(
      '/locations'
    );
    return response.locations || [];
  },

  /**
   * Create Bike Booking
   */
  async createBikeBooking(data: any): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/bike-bookings', data);
  },

  /**
   * Create Round Trip Booking
   */
  async createRoundTripBooking(data: any): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/car-bookings', { ...data, tripType: 'roundtrip' });
  },

  /**
   * Create One Way Booking
   */
  async createOneWayBooking(data: any): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/car-bookings', { ...data, tripType: 'oneway' });
  },

  /**
   * Create Airport Transfer Booking
   */
  async createAirportBooking(data: any): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/car-bookings', { ...data, tripType: 'airport' });
  },

  /**
   * Create Self Drive Booking
   */
  async createSelfDriveBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/self-drive-bookings', data);
  },

  /**
   * Create Luxury Car Booking
   */
  async createLuxuryBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/luxury-bookings', data);
  },

  /**
   * Create Outstation Bus Booking
   */
  async createOutstationBusBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/bus-bookings', { ...data, tripType: 'outstation' });
  },

  /**
   * Create Local Bus Booking
   */
  async createLocalBusBooking(data: any): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/bus-bookings', { ...data, tripType: 'local' });
  },

  /**
   * Create Personal Truck Booking
   */
  async createPersonalTruckBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/truck-bookings', { ...data, type: 'personal' });
  },

  /**
   * Create Commercial Truck Booking
   */
  async createCommercialTruckBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>(
      '/truck-bookings',
      { ...data, type: 'commercial' }
    );
  },

  /**
   * Create Equipment Booking
   */
  async createEquipmentBooking(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/equipment-bookings', data);
  },

  /**
   * Create Home Shifting (Packers & Movers)
   */
  async createHomeShifting(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/packers-bookings', { ...data, shiftingType: 'Home' });
  },

  /**
   * Create Office Shifting (Packers & Movers)
   */
  async createOfficeShifting(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/packers-bookings', { ...data, shiftingType: 'Office' });
  },

  /**
   * Create Vehicle Shifting (Packers & Movers)
   */
  async createVehicleShifting(
    data: any
  ): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/packers-bookings', { ...data, shiftingType: 'Vehicle' });
  },
};
