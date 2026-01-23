/**
 * Prisma Client Extension for Automatic ID Generation (Prisma 5+)
 *
 * This extension automatically generates IDs for all models with String @id fields.
 * It solves the alphabetical ordering bug by finding the max ID numerically.
 */

import { Prisma } from '@prisma/client';

/**
 * ID prefix mapping for each model
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
 * Generate next ID for a model using raw query to avoid extension recursion
 */
async function generateNextId(
  prisma: any,
  modelName: string,
  prefix: string
): Promise<string> {
  try {
    // Use raw query to bypass the extension and avoid recursion
    const tableName = modelName.toLowerCase();
    const result = await prisma.$queryRawUnsafe(
      `SELECT id FROM ${tableName} WHERE id LIKE '${prefix}%' ORDER BY CAST(SUBSTRING(id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
    );

    if (result && result.length > 0) {
      const lastId = result[0].id;
      const num = parseInt(lastId.replace(prefix, ''));
      return `${prefix}${num + 1}`;
    }

    return `${prefix}1`;
  } catch (error) {
    console.error(`Error generating ID for ${modelName}:`, error);
    // Fallback: use timestamp
    return `${prefix}${Date.now()}`;
  }
}

/**
 * Create Prisma extension for automatic ID generation (Prisma 5+)
 */
export function createIdGenerationExtension() {
  return Prisma.defineExtension({
    name: 'autoIdGeneration',
    query: {
      $allModels: {
        async create({ args, query, model }: any) {
          const modelName = model;
          const prefix = ID_PREFIXES[modelName];

          // If this model needs ID generation and no ID is provided
          if (prefix && args.data && !args.data.id) {
            // We need to get the base prisma client to avoid recursion
            // Use a workaround: import PrismaClient directly
            const { PrismaClient } = await import('@prisma/client');
            const tempClient = new PrismaClient();

            try {
              const newId = await generateNextId(tempClient, modelName, prefix);
              args.data.id = newId;
            } finally {
              await tempClient.$disconnect();
            }
          }

          return query(args);
        },

        async createMany({ args, query, model }: any) {
          const modelName = model;
          const prefix = ID_PREFIXES[modelName];

          if (prefix && Array.isArray(args.data)) {
            const recordsNeedingIds = args.data.filter((record: any) => !record.id);

            if (recordsNeedingIds.length > 0) {
              const { PrismaClient } = await import('@prisma/client');
              const tempClient = new PrismaClient();

              try {
                // Get the highest ID
                const result = await tempClient.$queryRawUnsafe(
                  `SELECT id FROM ${modelName.toLowerCase()} WHERE id LIKE '${prefix}%' ORDER BY CAST(SUBSTRING(id, ${prefix.length + 1}) AS UNSIGNED) DESC LIMIT 1`
                );

                let maxIdNumber = 0;
                if (result && (result as any[]).length > 0) {
                  const lastId = (result as any[])[0].id;
                  maxIdNumber = parseInt(lastId.replace(prefix, ''));
                }

                // Assign IDs to records that don't have them
                args.data = args.data.map((record: any) => {
                  if (!record.id) {
                    maxIdNumber++;
                    return { ...record, id: `${prefix}${maxIdNumber}` };
                  }
                  return record;
                });
              } finally {
                await tempClient.$disconnect();
              }
            }
          }

          return query(args);
        },

        async upsert({ args, query, model }: any) {
          const modelName = model;
          const prefix = ID_PREFIXES[modelName];

          // For upsert, only generate ID for create data if not provided
          if (prefix && args.create && !args.create.id) {
            const { PrismaClient } = await import('@prisma/client');
            const tempClient = new PrismaClient();

            try {
              const newId = await generateNextId(tempClient, modelName, prefix);
              args.create.id = newId;
            } finally {
              await tempClient.$disconnect();
            }
          }

          return query(args);
        },
      },
    },
  });
}
