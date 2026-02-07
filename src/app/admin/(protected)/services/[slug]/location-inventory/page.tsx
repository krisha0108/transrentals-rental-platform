'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';

export default function LocationInventoryPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchInventory();
  }, [serviceSlug]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${serviceSlug}/location-inventory`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/admin/services/${serviceSlug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Service
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-blue-600" />
            Location-wise Inventory
          </h1>
          <p className="text-gray-600 mt-1">
            Service: {serviceSlug}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
