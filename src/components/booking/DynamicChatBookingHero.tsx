'use client';

import { usePathname } from 'next/navigation';
import { ChatBookingHero } from './ChatBookingHero';
import { getServiceFromPath, getLocationFromPath, getVehicleNameFromPath } from './serviceConfigs';
import { useLocation } from '@/contexts/LocationContext';

interface DynamicChatBookingHeroProps {
  // Optional overrides - if not provided, auto-detects from URL
  serviceType?: string;
  serviceName?: string;
  vehicleModelName?: string;
  defaultLocation?: string;
  vehicleName?: string;
  subServices?: { label: string; value: string }[];
  hideHeader?: boolean;
}

export function DynamicChatBookingHero({
  serviceType: manualServiceType,
  serviceName: manualServiceName,
  vehicleModelName: manualVehicleModelName,
  defaultLocation: manualLocation,
  vehicleName: manualVehicleName,
  subServices: manualSubServices,
  hideHeader = false,
}: DynamicChatBookingHeroProps = {}) {
  const pathname = usePathname();
  const { currentCity } = useLocation();

  // Auto-detect service from URL
  const autoServiceConfig = getServiceFromPath(pathname);
  const autoLocation = getLocationFromPath(pathname);
  const autoVehicleName = getVehicleNameFromPath(pathname);

  // Use manual props if provided, otherwise use auto-detected from URL,
  // and finally fall back to user's selected city from LocationContext
  const serviceType = manualServiceType || autoServiceConfig?.serviceType || 'service';
  const serviceName = manualServiceName || autoServiceConfig?.serviceName || 'Service';
  const vehicleModelName = manualVehicleModelName || autoServiceConfig?.vehicleModelName;
  const defaultLocation = manualLocation || autoLocation || currentCity?.name;
  const vehicleName = manualVehicleName || autoVehicleName;
  const subServices = manualSubServices || autoServiceConfig?.subServices;

  return (
    <ChatBookingHero
      serviceType={serviceType}
      serviceName={serviceName}
      vehicleModelName={vehicleModelName}
      defaultLocation={defaultLocation}
      vehicleName={vehicleName}
      subServices={subServices}
      hideHeader={hideHeader}
    />
  );
}
