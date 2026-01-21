/**
 * Transform Prisma responses to match frontend expectations
 * Maps snake_case Prisma field names to camelCase frontend field names
 */

export function transformPrismaResponse<T = any>(data: any): T {
  if (!data) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(transformPrismaResponse) as T;
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Map Prisma field names to frontend expected names
      let mappedKey = key;
      
      // Common relation mappings
      if (key === 'other_locations') mappedKey = 'children';
      else if (key === 'other_services') mappedKey = 'children';
      else if (key === 'locations' && data.parentId !== undefined) mappedKey = 'parent';
      else if (key === 'brands') mappedKey = 'brand';
      else if (key === 'services_vehicle_models_subServiceIdToservices') mappedKey = 'subService';
      else if (key === 'services_vehicle_models_serviceIdToservices') mappedKey = 'service';
      else if (key === 'vendor_fleets') mappedKey = 'vendorFleets';
      else if (key === 'vendor_fleet_locations') mappedKey = 'fleetLocations';
      else if (key === 'fleet_locations') mappedKey = 'fleetLocations';
      else if (key === 'fleet_pricing') mappedKey = 'fleetPricing';
      else if (key === 'vehicle_model_locations') mappedKey = 'locations';
      else if (key === 'chauffeur_vehicle_categories') mappedKey = 'vehicleCategory';
      else if (key === 'service_locations') mappedKey = 'serviceLocations';
      else if (key === 'vendor_approved_services') mappedKey = 'approvedServices';
      
      // Special handling for _count
      if (key === '_count' && value && typeof value === 'object') {
        transformed._count = {};
        for (const [countKey, countValue] of Object.entries(value)) {
          if (countKey === 'other_locations') transformed._count.children = countValue;
          else if (countKey === 'other_services') transformed._count.children = countValue;
          else if (countKey === 'service_locations') transformed._count.serviceLocations = countValue;
          else if (countKey === 'vehicle_models') transformed._count.vehicleModels = countValue;
          else if (countKey === 'vendor_fleets') transformed._count.vendorFleets = countValue;
          else transformed._count[countKey] = countValue;
        }
      } else {
        // Recursively transform nested objects and arrays
        transformed[mappedKey] = transformPrismaResponse(value);
      }
    }
    
    return transformed as T;
  }
  
  // Return primitives as-is
  return data as T;
}
