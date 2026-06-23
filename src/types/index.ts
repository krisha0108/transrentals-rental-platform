// Core Types for TransRentals
import type React from 'react';

export interface Location {
  id: number;
  name: string;
  slug: string;
  state?: string;
  state_slug?: string;
  latitude?: number;
  longitude?: number;
  is_popular?: boolean;
  image_url?: string;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  base_url: string;
}

export interface Vehicle {
  id: number;
  name: string;
  slug: string;
  category: 'bike' | 'car' | 'bus' | 'truck' | 'equipment';
  image_url?: string;
  specifications?: VehicleSpecifications;
  base_price?: number;
  available_locations?: number[];
}

export interface VehicleSpecifications {
  engine?: string;
  mileage?: string;
  fuel_type?: string;
  seating_capacity?: number;
  transmission?: string;
  features?: string[];
}

export interface BookingPayload {
  customer_id: string;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  other_info?: string;
  [key: string]: any;
}

export interface BikeBookingPayload extends BookingPayload {
  bike_duration: string;
  bike_type: string;
}

export interface CarBookingPayload extends BookingPayload {
  car_type: string;
  trip_type: string;
  total_passangers: string;
}

export interface BusBookingPayload extends BookingPayload {
  bus_type: string;
  trip_type: string;
  total_passengers: string;
}

export interface TruckBookingPayload extends BookingPayload {
  truck_mode: number;
  truck_type: number;
  commercial_good_type?: number;
  personal_good_type?: number;
  weight_val: string;
  weight: number;
}

export interface EquipmentBookingPayload extends BookingPayload {
  machine_type: number;
  job_duration: string;
  no_of_equipments: string;
  Equipment_duration: string;
}

export interface PackersMoversBookingPayload extends BookingPayload {
  shifting_type: 'Home' | 'Office' | 'Vehicle';
  home_shifting?: string;
  office_shifting?: string;
  vehicle_shifting?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Booking {
  id: number;
  booking_id?: string;
  customer_id: number;
  service_id: number;
  service_name: string;
  location_id: number;
  location_name: string;
  destination?: string;
  journey_datetime: string;
  return_datetime?: string;
  status: 'Open' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Dropped' | 'Cancelled';
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
  booking_type?: number; // For airport: 1=Drop, 2=Pickup
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

// Detailed booking returned by customer APIs (aligns with Booking shape)
export type BookingDetail = Booking;

export interface Vendor {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  image?: string;
  rating?: number;
  total_reviews?: number;
}

export interface Quote {
  id: number;
  booking_id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_phone?: string;
  amount: number;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
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
  bank_id?: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface AssignedVehicle {
  id: number;
  vehicle_name: string;
  vehicle_type: string;
  model: string;
  reg_no: string;
  image?: string;
}

export interface AssignedDriver {
  id: number;
  name: string;
  phone: string;
  image?: string;
}

export interface BookingDetailResponse {
  success: boolean;
  booking: Booking;
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

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
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

export interface LocationPageData {
  service: Service;
  location: Location;
  meta: {
    title: string;
    description: string;
    canonical_url: string;
    og_image?: string;
  };
  content: {
    hero_title: string;
    hero_subtitle: string;
    hero_image?: string;
    why_rent_content?: string;
    popular_routes?: PopularRoute[];
    available_vehicles?: Vehicle[];
    faqs?: FAQ[];
    nearby_locations?: Location[];
  };
  schema?: any;
}

export interface PopularRoute {
  from: string;
  to: string;
  distance?: string;
  duration?: string;
  description?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  category: string;
  tags?: string[];
  author?: string;
  published_at: string;
  views_count?: number;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  service_type: string;
  location: string;
  created_at: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
