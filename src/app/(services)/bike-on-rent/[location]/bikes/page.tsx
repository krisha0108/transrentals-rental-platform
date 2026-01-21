'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BikeFleetGridMultiVendor } from '@/components/bike/BikeFleetGridMultiVendor';

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
}

interface AggregatedBike {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  categoryId?: string;
  categoryName?: string;
  sideImage?: string;
  fuelType?: string;
  transmission?: string;
  engineCC?: number;
  mileage?: string;
  features?: string[];
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

interface ApiResponse {
  location: {
    id: string;
    name: string;
    slug: string;
  };
  bikes: AggregatedBike[];
  totalCount: number;
  filters: {
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string; slug: string; logo?: string }[];
    priceRange: { min: number; max: number };
  };
}

export default function BikesSearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const location = params.location as string;
  const pickupDate = searchParams.get('pickupDate') || '';
  const pickupTime = searchParams.get('pickupTime') || '';
  const dropDate = searchParams.get('dropDate') || '';
  const dropTime = searchParams.get('dropTime') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    // Validate search params
    if (!pickupDate || !pickupTime || !dropDate || !dropTime) {
      router.push(`/bike-on-rent/${location}`);
      return;
    }

    const fetchBikes = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/bikes/${location}`);
        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch bikes');
        }

        setData(result);
      } catch (err: any) {
        console.error('Error fetching bikes:', err);
        setError(err.message || 'Failed to load bikes');
      } finally {
        setLoading(false);
      }
    };

    fetchBikes();
  }, [location, pickupDate, pickupTime, dropDate, dropTime, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bikes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/bike-on-rent/${location}`)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.bikes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <div className="text-5xl mb-4">🏍️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Bikes Available</h2>
          <p className="text-gray-600 mb-4">
            Sorry, no bikes are currently available at this location. Please try a different location or date.
          </p>
          <button
            onClick={() => router.push(`/bike-on-rent/${location}`)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Change Dates
          </button>
        </div>
      </div>
    );
  }

  return (
    <BikeFleetGridMultiVendor
      bikes={data.bikes}
      location={data.location}
      filters={data.filters}
      pickupDate={pickupDate}
      pickupTime={pickupTime}
      dropDate={dropDate}
      dropTime={dropTime}
    />
  );
}
