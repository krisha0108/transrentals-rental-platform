import { useState, useEffect } from 'react';
import { bookingService } from '@/lib/api/services/bookingService';

export interface Service {
  id: number;
  name: string;
  parent_id?: number;
  status?: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('useServices: Fetching services from API...');
        const data = await bookingService.getServices();
        console.log('useServices: Received data:', data);

        if (!data || data.length === 0) {
          console.warn('useServices: No services returned from API, using fallback');
          throw new Error('No services returned');
        }

        setServices(data);
        console.log('useServices: Successfully set services:', data.length, 'services');
      } catch (err) {
        console.error('useServices: Failed to fetch services:', err);
        setError('Failed to load services');
        // Set some default services as fallback
        const fallbackServices = [
          { id: 1, name: 'Cab Rental' },
          { id: 2, name: 'Bike Rental' },
          { id: 3, name: 'Round Trip Car' },
          { id: 4, name: 'One-Way Car' },
          { id: 5, name: 'Bus Rental' },
          { id: 6, name: 'Bus Rental' },
          { id: 7, name: 'Transporter' },
          { id: 8, name: 'Equipment' },
          { id: 9, name: 'Packers & Movers' },
        ];
        console.log('useServices: Using fallback services:', fallbackServices);
        setServices(fallbackServices);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, isLoading, error };
}
