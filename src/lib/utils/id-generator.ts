/**
 * ID Generation Utilities
 *
 * IMPORTANT: These functions handle numeric ID generation for tables with String @id fields.
 * They avoid the alphabetical ordering bug by fetching all IDs and finding the max numerically.
 *
 * DO NOT use orderBy: { id: 'desc' } on string ID fields - it uses alphabetical ordering!
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Generate next customer ID
 * Format: CUST_1, CUST_2, CUST_3, etc.
 */
export async function generateCustomerId(): Promise<string> {
  const allCustomers = await prisma.customers.findMany({
    where: { id: { startsWith: 'CUST_' } },
    select: { id: true },
  });

  const maxIdNumber = allCustomers.reduce((max, customer) => {
    const num = parseInt(customer.id.replace('CUST_', ''));
    return num > max ? num : max;
  }, 0);

  return `CUST_${maxIdNumber + 1}`;
}

/**
 * Generate next service location ID
 * Format: SL_1, SL_2, SL_3, etc.
 */
export async function generateServiceLocationId(): Promise<string> {
  const allSLIds = await prisma.service_locations.findMany({
    where: { id: { startsWith: 'SL_' } },
    select: { id: true },
  });

  const maxIdNumber = allSLIds.reduce((max, sl) => {
    const num = parseInt(sl.id.replace('SL_', ''));
    return num > max ? num : max;
  }, 0);

  return `SL_${maxIdNumber + 1}`;
}

/**
 * Generate next location ID
 * Format: LOC_1, LOC_2, LOC_3, etc.
 */
export async function generateLocationId(): Promise<string> {
  const allLocations = await prisma.locations.findMany({
    where: { id: { startsWith: 'LOC_' } },
    select: { id: true },
  });

  const maxIdNumber = allLocations.reduce((max, loc) => {
    const num = parseInt(loc.id.replace('LOC_', ''));
    return num > max ? num : max;
  }, 0);

  return `LOC_${maxIdNumber + 1}`;
}

/**
 * Generate next chauffeur route package ID
 * Format: CRP_1, CRP_2, CRP_3, etc.
 */
export async function generateRoutePackageId(): Promise<string> {
  const allRoutes = await prisma.chauffeur_route_packages.findMany({
    where: { id: { startsWith: 'CRP_' } },
    select: { id: true },
  });

  const maxIdNumber = allRoutes.reduce((max, route) => {
    const num = parseInt(route.id.replace('CRP_', ''));
    return num > max ? num : max;
  }, 0);

  return `CRP_${maxIdNumber + 1}`;
}

/**
 * Generic ID generator for any prefix
 * @param prefix - ID prefix (e.g., 'CUST_', 'SL_', 'LOC_')
 * @param tableName - Prisma model name
 * @returns Next sequential ID
 */
export async function generateId(
  prefix: string,
  getAllIds: () => Promise<{ id: string }[]>
): Promise<string> {
  const allIds = await getAllIds();

  const maxIdNumber = allIds.reduce((max, item) => {
    const num = parseInt(item.id.replace(prefix, ''));
    return num > max ? num : max;
  }, 0);

  return `${prefix}${maxIdNumber + 1}`;
}
