'use client';

import { useState, useEffect } from 'react';

export interface ServiceInfo {
  id: string;
  name: string;
  slug: string;
  flowType: string;
  description: string | null;
  isActive: boolean;
  icon?: string | null;
}

interface UseServiceResult {
  service: ServiceInfo | null;
  loading: boolean;
  error: string | null;
}

// Cache to avoid refetching on every render
const serviceCache: Record<string, ServiceInfo> = {};

export function useService(slug: string): UseServiceResult {
  const [service, setService] = useState<ServiceInfo | null>(serviceCache[slug] || null);
  const [loading, setLoading] = useState(!serviceCache[slug]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // If cached, use it
    if (serviceCache[slug]) {
      setService(serviceCache[slug]);
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/info`);
        if (res.ok) {
          const data = await res.json();
          if (data.service) {
            serviceCache[slug] = data.service;
            setService(data.service);
            setError(null);
          } else {
            setError('Service not found');
            setService(null);
          }
        } else {
          setError('Service not found');
          setService(null);
        }
      } catch (err) {
        setError('Failed to load service');
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  return { service, loading, error };
}

// Helper to get service icon component based on name
export function getServiceIconName(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('bike') || name.includes('scooter')) return 'Bike';
  if (name.includes('bus')) return 'Bus';
  if (name.includes('truck') || name.includes('tempo') || name.includes('transporter')) return 'Truck';
  if (name.includes('packers') || name.includes('movers')) return 'Package';
  if (name.includes('equipment')) return 'Wrench';
  if (name.includes('luxury')) return 'Crown';
  if (name.includes('chauffeur') || name.includes('driver') || name.includes('car rental')) return 'CarTaxiFront';
  return 'Car';
}
