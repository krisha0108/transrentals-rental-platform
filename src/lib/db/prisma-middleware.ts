/**
 * Prisma Middleware for Automatic ID Generation
 *
 * This middleware automatically generates IDs for all models with String @id fields.
 * It solves the alphabetical ordering bug by finding the max ID numerically.
 */

import { Prisma } from '@prisma/client';

/**
 * ID prefix mapping for each model
 * Format: modelName -> prefix
 */
const ID_PREFIXES: Record<string, string> = {
  active_sessions: 'SESS_',
  admin_users: 'ADMIN_',
  analytics_summary: 'AS_',
  backlinks: 'BL_',
  bank_details: 'BANK_',
  bike_quotes: 'BQ_',
  blog_categories: 'BCAT_',
  blog_posts: 'BP_',
  brands: 'BRAND_',
  bus_quotes: 'BUSQ_',
  chat_conversations: 'CONV_',
  chat_interactions: 'CINT_',
  chat_messages: 'MSG_',
  chat_quick_replies: 'QR_',
  chauffeur_bookings: 'CB_',
  chauffeur_city_pricing: 'CCP_',
  chauffeur_local_packages: 'CLP_',
  chauffeur_route_packages: 'CRP_',
  chauffeur_vehicle_categories: 'CVC_',
  city_distance_matrix: 'CDM_',
  click_events: 'CLICK_',
  competitor_tracking: 'CT_',
  contact_inquiries: 'INQ_',
  crawl_data: 'CRAWL_',
  customers: 'CUST_',
  daily_analytics: 'DA_',
  equipment_quotes: 'EQ_',
  fleet: 'FLEET_',
  fleet_availability: 'FA_',
  fleet_categories: 'FCAT_',
  fleet_location_rates: 'FLR_',
  fleet_locations: 'FLOC_',
  fleet_pricing: 'FP_',
  fleet_types: 'FT_',
  form_submissions: 'FORM_',
  helpdesk_tickets: 'TKT_',
  keyword_rankings: 'KR_',
  knowledge_base: 'KB_',
  local_packages: 'LP_',
  locations: 'LOC_',
  luxury_bids: 'LBID_',
  luxury_quotes: 'LQ_',
  luxury_vendor_rates: 'LVR_',
  manager_locations: 'ML_',
  manager_services: 'MS_',
  media: 'MEDIA_',
  packers_quotes: 'PQ_',
  page_analytics: 'PA_',
  page_performance: 'PP_',
  pages: 'PAGE_',
  payment_settings: 'PS_',
  redirects: 'REDIR_',
  route_pricing: 'RP_',
  search_queries: 'SQ_',
  self_drive_quotes: 'SDQ_',
  seo_audits: 'SEO_',
  seo_meta: 'SM_',
  service_locations: 'SL_',
  service_payment_configs: 'SPC_',
  service_trip_types: 'STT_',
  services: 'SVC_',
  settings: 'SET_',
  staff_attendance: 'SA_',
  trip_types: 'TT_',
  truck_quotes: 'TQ_',
  vehicle_model_locations: 'VML_',
  vehicle_models: 'VM_',
  vendor_approved_locations: 'VAL_',
  vendor_approved_services: 'VAS_',
  vendor_bike_templates: 'VBT_',
  vendor_bus_templates: 'VBUST_',
  vendor_documents: 'VDOC_',
  vendor_equipment_templates: 'VET_',
  vendor_fleet_locations: 'VFL_',
  vendor_fleets: 'VF_',
  vendor_location_requests: 'VLR_',
  vendor_luxury_templates: 'VLT_',
  vendor_packers_templates: 'VPT_',
  vendor_self_drive_templates: 'VSDT_',
  vendor_service_requests: 'VSR_',
  vendor_staff: 'VSTAFF_',
  vendor_truck_templates: 'VTT_',
  vendors: 'VENDOR_',
  web_vitals: 'WV_',
};

/**
 * Generate next ID for a model
 * Handles the alphabetical ordering bug by finding max numerically
 */
async function generateNextId(
  prisma: any,
  modelName: string,
  prefix: string
): Promise<string> {
  try {
    // Get all IDs for this model with the prefix
    const allRecords = await prisma[modelName].findMany({
      where: { id: { startsWith: prefix } },
      select: { id: true },
    });

    // Find the maximum ID number
    const maxIdNumber = allRecords.reduce((max: number, record: { id: string }) => {
      const num = parseInt(record.id.replace(prefix, ''));
      return num > max ? num : max;
    }, 0);

    return `${prefix}${maxIdNumber + 1}`;
  } catch (error) {
    console.error(`Error generating ID for ${modelName}:`, error);
    // Fallback: use timestamp
    return `${prefix}${Date.now()}`;
  }
}

/**
 * Prisma middleware to auto-generate IDs
 *
 * @param prismaClient - The Prisma client instance (passed to avoid circular dependency)
 */
export function createIdGenerationMiddleware(prismaClient: any) {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    // Only intercept 'create' and 'createMany' actions
    if (params.action === 'create' || params.action === 'upsert') {
      const modelName = params.model;

      if (!modelName) {
        return next(params);
      }

      const prefix = ID_PREFIXES[modelName];

      // If this model needs ID generation and no ID is provided
      if (prefix) {
        if (params.action === 'create') {
          // Check if ID is already provided in the data
          if (!params.args.data?.id) {
            const newId = await generateNextId(prismaClient, modelName, prefix);
            params.args.data = {
              ...params.args.data,
              id: newId,
            };
          }
        } else if (params.action === 'upsert') {
          // For upsert, only generate ID for create data if not provided
          if (!params.args.create?.id) {
            const newId = await generateNextId(prismaClient, modelName, prefix);
            params.args.create = {
              ...params.args.create,
              id: newId,
            };
          }
        }
      }
    }

    // Handle createMany (batch creation) - more complex case
    if (params.action === 'createMany') {
      const modelName = params.model;

      if (!modelName) {
        return next(params);
      }

      const prefix = ID_PREFIXES[modelName];

      if (prefix && Array.isArray(params.args.data)) {
        // Find records without IDs
        const recordsNeedingIds = params.args.data.filter((record: any) => !record.id);

        if (recordsNeedingIds.length > 0) {
          // Get all existing IDs
          const allRecords = await (prismaClient as any)[modelName].findMany({
            where: { id: { startsWith: prefix } },
            select: { id: true },
          });

          let maxIdNumber = allRecords.reduce((max: number, record: { id: string }) => {
            const num = parseInt(record.id.replace(prefix, ''));
            return num > max ? num : max;
          }, 0);

          // Assign IDs to records that don't have them
          params.args.data = params.args.data.map((record: any) => {
            if (!record.id) {
              maxIdNumber++;
              return { ...record, id: `${prefix}${maxIdNumber}` };
            }
            return record;
          });
        }
      }
    }

    return next(params);
  };
}

/**
 * Helper to get the next ID for a specific model (for manual usage)
 */
export async function getNextId(prisma: any, modelName: string): Promise<string | null> {
  const prefix = ID_PREFIXES[modelName];
  if (!prefix) {
    console.warn(`No ID prefix configured for model: ${modelName}`);
    return null;
  }
  return generateNextId(prisma, modelName, prefix);
}
