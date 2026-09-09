import { prisma } from '@/lib/db/prisma';
import { computeManagerStats } from '@/lib/manager-performance';
import {
  getDateRange, getUntouchedInquiries, getUntouchedBookings,
  getVendorsNeedingAction, getCoverageGaps, getIdleVendorCoverage,
  getPaymentFailures, getSystemHealth,
} from '@/lib/admin-operations';

const OPS_PERIOD_ENUM = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'lastMonth', 'all'] as const;

// Tool definitions in OpenAI / DeepSeek function-calling format
export const ADMIN_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_overview_stats',
      description:
        'Get a quick overview of all platform statistics: vendors, customers, drivers, inquiries, travel agents, fleet, bookings.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_booking_stats',
      description:
        'Get booking counts by status. Optionally filter by date range or booking type (car/bike/chauffeur/truck/all). Use period for "today", "yesterday", "thisMonth", "lastMonth".',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'thisMonth', 'lastMonth', 'all'],
            description: 'Predefined time period',
          },
          startDate: { type: 'string', description: 'Custom start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'Custom end date YYYY-MM-DD' },
          type: {
            type: 'string',
            enum: ['car', 'bike', 'chauffeur', 'truck', 'all'],
            description: 'Booking type',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_vendor_info',
      description:
        'Get vendor counts by status, or search for specific vendors by name, email, phone, or city.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by business name, email, phone, or city' },
          status: {
            type: 'string',
            enum: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_customer_info',
      description: 'Get total customer count, or search for specific customers by name, email, or phone.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name, email, or phone' },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_driver_info',
      description: 'Get driver counts by status, or search for specific drivers.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name, email, or phone' },
          status: {
            type: 'string',
            enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_inquiry_info',
      description:
        'Get quote/inquiry counts across ALL services (bike, car/self-drive, bus, truck, equipment, luxury, packers). Supports date filtering by period or custom date range. Returns total and per-service breakdown.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'thisMonth', 'lastMonth', 'all'],
            description: 'Predefined time period. Use this for questions like "yesterday", "this month", etc.',
          },
          startDate: { type: 'string', description: 'Custom start date YYYY-MM-DD (alternative to period)' },
          endDate: { type: 'string', description: 'Custom end date YYYY-MM-DD (alternative to period)' },
          service: {
            type: 'string',
            enum: ['bike', 'car', 'bus', 'truck', 'equipment', 'luxury', 'packers', 'all'],
            description: 'Filter by service type (default all)',
          },
          limit: { type: 'number', description: 'Max recent inquiries to show (default 5)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_revenue_stats',
      description: 'Get revenue from completed car bookings. Optionally filter by date range.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_fleet_stats',
      description: 'Get fleet and vehicle statistics: total vehicles, active vehicles, locations, categories.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_booking_city_breakdown',
      description:
        'Get city-wise booking counts for a specific booking type (car, bike, chauffeur, or truck). Shows which cities have the most bookings.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['car', 'bike', 'chauffeur', 'truck'],
            description: 'Booking type to analyze',
          },
          limit: { type: 'number', description: 'Top N cities to return (default 10)' },
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD (optional)' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD (optional)' },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_keyword_rankings',
      description:
        'Get SEO keyword ranking data. Can filter by page path, minimum/maximum position, or search for specific keywords. Returns current position, previous position, search volume, and ranking history.',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search for a specific keyword (partial match)' },
          pagePath: { type: 'string', description: 'Filter by page path (partial match, e.g. "/self-drive-car-rentals/delhi")' },
          topN: { type: 'number', description: 'Return top N keywords by position (default 10)' },
          onlyTracking: { type: 'boolean', description: 'Only return actively tracked keywords (default true)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_page_analytics',
      description:
        'Get traffic and engagement analytics for specific pages or top pages overall. Returns page views, unique visitors, organic traffic, form submissions, bounce rate, etc.',
      parameters: {
        type: 'object',
        properties: {
          pagePath: { type: 'string', description: 'Specific page path to analyze (partial match)' },
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
          topN: { type: 'number', description: 'Return top N pages by views (default 10)' },
          sortBy: { type: 'string', enum: ['pageViews', 'organicTraffic', 'formSubmissions', 'uniqueVisitors'], description: 'Sort by this metric (default pageViews)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_analytics_summary',
      description:
        'Get overall site analytics summary: total page views, unique visitors, bounce rate, form conversions, chat stats. Can filter by date range.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
          days: { type: 'number', description: 'Last N days of data (e.g. 7, 30). Used if startDate/endDate not provided.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_travel_agent_info',
      description: 'Get travel agent counts by status, or search for specific travel agents.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by agency name, owner, email, or city' },
          status: {
            type: 'string',
            enum: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_manager_performance',
      description:
        "Manager performance / accountability: inquiries and bookings each manager has actioned vs the total in their assigned locations+services (coverage %), plus vendors they've created/approved. Use for questions like 'which manager is underperforming', 'how is <name> doing this week', 'manager coverage today'. Omit managerName to get ALL managers, sorted worst-inquiry-coverage first.",
      parameters: {
        type: 'object',
        properties: {
          managerName: { type: 'string', description: 'Filter to one manager by name or email (partial match)' },
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default today)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_untouched_inquiries',
      description:
        "Admin-wide count (and a sample) of customer inquiries — across every service and city, logged by anyone — that NO manager has taken any action on yet. Use for 'how many inquiries are untouched', 'leads nobody has called'.",
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default today)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_untouched_bookings',
      description: 'Same as get_untouched_inquiries but for bookings — admin-wide bookings nobody has actioned yet.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default today)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_vendors_needing_action',
      description:
        "Vendors stuck in PENDING/DOCUMENTS_PENDING/UNDER_REVIEW status with nobody acting on them for several days — onboarding leads going cold. Use for 'which vendors need follow-up', 'vendors stuck in review'.",
      parameters: {
        type: 'object',
        properties: {
          staleDays: { type: 'number', description: 'Minimum days stuck with no action (default 3)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_coverage_gaps',
      description:
        "Demand without supply: locations/services where customer inquiries came in but there was NO vendor available to serve them — lost business. Grouped by location + service, with counts. Use for 'where are we losing business', 'which cities have no vendor coverage'.",
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default thisWeek)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_idle_vendor_coverage',
      description:
        "Supply without demand: locations/services with active, approved vendors but ZERO customer inquiries in the period — vendor capacity sitting unused. The opposite of get_coverage_gaps. Use for 'which vendors are getting no leads', 'idle coverage'.",
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default thisMonth)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_payment_failures',
      description:
        "Bookings where the payment attempt genuinely FAILED at the gateway (Razorpay), across all 8 service types (bike, bus, car, chauffeur, equipment, luxury, packers, truck). Use for 'how many payments failed', 'which service has the most payment failures', 'failed transactions'.",
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: [...OPS_PERIOD_ENUM], description: 'Date range (default today)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_system_health',
      description:
        "Operational health of background cron jobs (auto-drop-bookings, seo-content-refresh, expire-web-stories) and push-notification delivery (customer + travel agent FCM) over the last 7 days — last run status, failure counts, success rate. Use for 'is the auto-drop cron working', 'are push notifications failing', 'system health'.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

type ToolInput = Record<string, any>;

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  try {
    switch (name) {
      case 'get_overview_stats':    return JSON.stringify(await getOverviewStats());
      case 'get_booking_stats':     return JSON.stringify(await getBookingStats(input));
      case 'get_vendor_info':       return JSON.stringify(await getVendorInfo(input));
      case 'get_customer_info':     return JSON.stringify(await getCustomerInfo(input));
      case 'get_driver_info':       return JSON.stringify(await getDriverInfo(input));
      case 'get_inquiry_info':      return JSON.stringify(await getInquiryInfo(input));
      case 'get_revenue_stats':     return JSON.stringify(await getRevenueStats(input));
      case 'get_fleet_stats':       return JSON.stringify(await getFleetStats());
      case 'get_booking_city_breakdown': return JSON.stringify(await getBookingCityBreakdown(input));
      case 'get_keyword_rankings':       return JSON.stringify(await getKeywordRankings(input));
      case 'get_page_analytics':         return JSON.stringify(await getPageAnalytics(input));
      case 'get_analytics_summary':      return JSON.stringify(await getAnalyticsSummary(input));
      case 'get_travel_agent_info':      return JSON.stringify(await getTravelAgentInfo(input));
      case 'get_manager_performance':    return JSON.stringify(await getManagerPerformanceTool(input));
      case 'get_untouched_inquiries':    return JSON.stringify(await getUntouchedInquiriesTool(input));
      case 'get_untouched_bookings':     return JSON.stringify(await getUntouchedBookingsTool(input));
      case 'get_vendors_needing_action': return JSON.stringify(await getVendorsNeedingActionTool(input));
      case 'get_coverage_gaps':          return JSON.stringify(await getCoverageGapsTool(input));
      case 'get_idle_vendor_coverage':   return JSON.stringify(await getIdleVendorCoverageTool(input));
      case 'get_payment_failures':       return JSON.stringify(await getPaymentFailuresTool(input));
      case 'get_system_health':          return JSON.stringify(await getSystemHealthTool());
      default:                           return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

// ── Tool implementations ──────────────────────────────────────────────────────

function resolveDateFilter(period?: string, startDate?: string, endDate?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return { gte: today };
  if (period === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { gte: yesterday, lt: today };
  }
  if (period === 'thisMonth') return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  if (period === 'lastMonth') {
    return {
      gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }
  if (startDate || endDate) {
    return {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }
  return undefined;
}

async function getOverviewStats() {
  const [
    totalVendors, approvedVendors, pendingVendors,
    totalCustomers,
    totalDrivers, activeDrivers, pendingDrivers,
    totalInquiries, pendingInquiries,
    totalTravelAgents, approvedTravelAgents,
    totalFleet, activeFleet,
    totalLocations,
    carBookings, bikeBookings, chauffeurBookings, truckBookings,
  ] = await Promise.all([
    prisma.vendors.count(),
    prisma.vendors.count({ where: { status: 'APPROVED' } }),
    prisma.vendors.count({ where: { status: { in: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] } } }),
    prisma.customers.count(),
    prisma.drivers.count(),
    prisma.drivers.count({ where: { status: 'ACTIVE' } }),
    prisma.drivers.count({ where: { status: 'PENDING' } }),
    prisma.self_drive_quote_requests.count(),
    prisma.self_drive_quote_requests.count({ where: { status: 'PENDING' } }),
    prisma.travel_agents.count(),
    prisma.travel_agents.count({ where: { status: 'APPROVED' } }),
    prisma.fleet.count(),
    prisma.fleet.count({ where: { isActive: true } }).catch(() => 0),
    prisma.locations.count({ where: { isActive: true } }),
    prisma.car_bookings.count().catch(() => 0),
    prisma.bike_bookings.count().catch(() => 0),
    prisma.chauffeur_bookings.count().catch(() => 0),
    prisma.truck_bookings.count().catch(() => 0),
  ]);

  return {
    vendors: { total: totalVendors, approved: approvedVendors, pending: pendingVendors },
    customers: { total: totalCustomers },
    drivers: { total: totalDrivers, active: activeDrivers, pending: pendingDrivers },
    inquiries: { total: totalInquiries, pending: pendingInquiries },
    travelAgents: { total: totalTravelAgents, approved: approvedTravelAgents },
    fleet: { total: totalFleet, active: activeFleet },
    locations: { total: totalLocations },
    bookings: {
      car: carBookings,
      bike: bikeBookings,
      chauffeur: chauffeurBookings,
      truck: truckBookings,
      total: carBookings + bikeBookings + chauffeurBookings + truckBookings,
    },
  };
}

async function getBookingStats({ startDate, endDate, period, type = 'all' }: ToolInput) {
  const dateRange = resolveDateFilter(period, startDate, endDate);
  const dateFilter = dateRange ? { createdAt: dateRange } : {};

  if (type === 'car') {
    const [total, active, completed, cancelled] = await Promise.all([
      prisma.car_bookings.count({ where: dateFilter }).catch(() => 0),
      prisma.car_bookings.count({ where: { ...dateFilter, status: { in: ['PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS'] } } }).catch(() => 0),
      prisma.car_bookings.count({ where: { ...dateFilter, status: 'COMPLETED' } }).catch(() => 0),
      prisma.car_bookings.count({ where: { ...dateFilter, status: { in: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }).catch(() => 0),
    ]);
    return { type: 'car', total, active, completed, cancelled };
  }

  if (type === 'bike') {
    const total = await prisma.bike_bookings.count({ where: dateFilter }).catch(() => 0);
    return { type: 'bike', total };
  }
  if (type === 'chauffeur') {
    const total = await prisma.chauffeur_bookings.count({ where: dateFilter }).catch(() => 0);
    return { type: 'chauffeur', total };
  }
  if (type === 'truck') {
    const total = await prisma.truck_bookings.count({ where: dateFilter }).catch(() => 0);
    return { type: 'truck', total };
  }

  const [car, carActive, carCompleted, carCancelled, bike, chauffeur, truck] = await Promise.all([
    prisma.car_bookings.count({ where: dateFilter }).catch(() => 0),
    prisma.car_bookings.count({ where: { ...dateFilter, status: { in: ['PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_PROGRESS'] } } }).catch(() => 0),
    prisma.car_bookings.count({ where: { ...dateFilter, status: 'COMPLETED' } }).catch(() => 0),
    prisma.car_bookings.count({ where: { ...dateFilter, status: { in: ['CANCELLED', 'EXPIRED', 'REFUNDED'] } } }).catch(() => 0),
    prisma.bike_bookings.count({ where: dateFilter }).catch(() => 0),
    prisma.chauffeur_bookings.count({ where: dateFilter }).catch(() => 0),
    prisma.truck_bookings.count({ where: dateFilter }).catch(() => 0),
  ]);

  return {
    type: 'all',
    grandTotal: car + bike + chauffeur + truck,
    car: { total: car, active: carActive, completed: carCompleted, cancelled: carCancelled },
    bike: { total: bike },
    chauffeur: { total: chauffeur },
    truck: { total: truck },
  };
}

async function getVendorInfo({ search, status, limit = 10 }: ToolInput) {
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { businessName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const [total, approved, pending, suspended, list] = await Promise.all([
    prisma.vendors.count({ where }),
    prisma.vendors.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.vendors.count({ where: { ...where, status: { in: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] } } }),
    prisma.vendors.count({ where: { ...where, status: 'SUSPENDED' } }),
    (search || status)
      ? prisma.vendors.findMany({
          where,
          select: { id: true, businessName: true, email: true, phone: true, city: true, state: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  return { total, approved, pending, suspended, list };
}

async function getCustomerInfo({ search, limit = 10 }: ToolInput) {
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [total, list] = await Promise.all([
    prisma.customers.count({ where }),
    search
      ? prisma.customers.findMany({
          where,
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  return { total, list };
}

async function getDriverInfo({ search, status, limit = 10 }: ToolInput) {
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [total, pending, active, suspended, inactive, list] = await Promise.all([
    prisma.drivers.count({ where }),
    prisma.drivers.count({ where: { ...where, status: 'PENDING' } }),
    prisma.drivers.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.drivers.count({ where: { ...where, status: 'SUSPENDED' } }),
    prisma.drivers.count({ where: { ...where, status: 'INACTIVE' } }),
    (search || status)
      ? prisma.drivers.findMany({
          where,
          select: { id: true, name: true, email: true, phone: true, city: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  return { total, pending, active, suspended, inactive, list };
}

async function getInquiryInfo({ period, startDate, endDate, service = 'all', limit = 5 }: ToolInput) {
  const dateRange = resolveDateFilter(period, startDate, endDate);
  const dateFilter = dateRange ? { createdAt: dateRange } : {};

  const countTable = async (model: any, extra: any = {}) =>
    model.count({ where: { ...dateFilter, ...extra } }).catch(() => 0);

  // Query all quote request tables in parallel
  const [
    bikeTotal, bikePending,
    carTotal, carPending, carQuotesReceived, carAccepted, carConfirmed, carCancelled,
    busTotal, busPending,
    truckTotal, truckPending,
    equipmentTotal, equipmentPending,
    luxuryTotal, luxuryPending,
    packersTotal, packersPending,
  ] = await Promise.all([
    countTable(prisma.bike_quote_requests),
    countTable(prisma.bike_quote_requests, { status: 'PENDING' }),
    countTable(prisma.self_drive_quote_requests),
    countTable(prisma.self_drive_quote_requests, { status: 'PENDING' }),
    countTable(prisma.self_drive_quote_requests, { status: 'QUOTES_RECEIVED' }),
    countTable(prisma.self_drive_quote_requests, { status: 'QUOTE_ACCEPTED' }),
    countTable(prisma.self_drive_quote_requests, { status: 'BOOKING_CONFIRMED' }),
    countTable(prisma.self_drive_quote_requests, { status: 'CANCELLED' }),
    countTable(prisma.bus_quote_requests),
    countTable(prisma.bus_quote_requests, { status: 'PENDING' }),
    countTable(prisma.truck_quote_requests),
    countTable(prisma.truck_quote_requests, { status: 'PENDING' }),
    countTable(prisma.equipment_quote_requests),
    countTable(prisma.equipment_quote_requests, { status: 'PENDING' }),
    countTable(prisma.luxury_quote_requests),
    countTable(prisma.luxury_quote_requests, { status: 'PENDING' }),
    countTable(prisma.packers_quote_requests),
    countTable(prisma.packers_quote_requests, { status: 'PENDING' }),
  ]);

  const byService = {
    'Car / Self-Drive': { total: carTotal, pending: carPending, quotesReceived: carQuotesReceived, accepted: carAccepted, confirmed: carConfirmed, cancelled: carCancelled },
    'Bike Rental':      { total: bikeTotal, pending: bikePending },
    'Bus Rental':       { total: busTotal, pending: busPending },
    'Truck Rental':     { total: truckTotal, pending: truckPending },
    'Equipment':        { total: equipmentTotal, pending: equipmentPending },
    'Luxury Cars':      { total: luxuryTotal, pending: luxuryPending },
    'Packers & Movers': { total: packersTotal, pending: packersPending },
  };

  const grandTotal = bikeTotal + carTotal + busTotal + truckTotal + equipmentTotal + luxuryTotal + packersTotal;
  const grandPending = bikePending + carPending + busPending + truckPending + equipmentPending + luxuryPending + packersPending;

  // Recent inquiries — use car/self-drive as main source (most detailed schema)
  const recent = await prisma.self_drive_quote_requests.findMany({
    where: dateFilter,
    select: { id: true, customerName: true, locationName: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }).catch(() => []);

  const result: any = {
    period: period ?? (startDate || endDate ? `${startDate ?? ''}–${endDate ?? ''}` : 'all time'),
    grandTotal,
    grandPending,
    byService,
    recentCarInquiries: recent,
  };

  // If specific service requested, highlight it
  if (service !== 'all') {
    const key = Object.keys(byService).find((k) => k.toLowerCase().includes(service.toLowerCase()));
    if (key) result.filtered = { service: key, ...(byService as any)[key] };
  }

  return result;
}

async function getRevenueStats({ startDate, endDate }: ToolInput) {
  const dateFilter = (startDate || endDate)
    ? { createdAt: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
    : {};

  const result = await prisma.car_bookings.aggregate({
    where: { ...dateFilter, status: 'COMPLETED' },
    _sum: { grandTotal: true },
    _count: true,
  }).catch(() => ({ _sum: { grandTotal: null }, _count: 0 }));

  return {
    completedCarBookings: result._count,
    totalRevenue: result._sum.grandTotal ?? 0,
    note: 'Revenue shown for completed car bookings only',
  };
}

async function getFleetStats() {
  const [total, active, locations, categories, sampleLocations] = await Promise.all([
    prisma.fleet.count(),
    prisma.fleet.count({ where: { isActive: true } }).catch(() => 0),
    prisma.locations.count({ where: { isActive: true } }),
    prisma.fleet_categories.count().catch(() => 0),
    prisma.locations.findMany({
      where: { isActive: true },
      select: { name: true, type: true },
      orderBy: { name: 'asc' },
      take: 10,
    }),
  ]);

  return { total, active, locations, categories, sampleLocations };
}

async function getTravelAgentInfo({ search, status, limit = 10 }: ToolInput) {
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { agencyName: { contains: search } },
      { ownerName: { contains: search } },
      { email: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const [total, approved, pending, rejected, list] = await Promise.all([
    prisma.travel_agents.count({ where }),
    prisma.travel_agents.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.travel_agents.count({ where: { ...where, status: { in: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] } } }),
    prisma.travel_agents.count({ where: { ...where, status: { in: ['REJECTED', 'SUSPENDED', 'BLOCKED'] } } }),
    (search || status)
      ? prisma.travel_agents.findMany({
          where,
          select: { id: true, agencyName: true, ownerName: true, email: true, city: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : Promise.resolve([]),
  ]);

  return { total, approved, pending, rejected, list };
}

async function getBookingCityBreakdown({ type, limit = 10, startDate, endDate }: ToolInput) {
  const dateFilter = (startDate || endDate)
    ? { createdAt: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
    : {};

  type CityRow = { locationName: string; _count: { _all: number } };

  let rows: CityRow[] = [];
  if (type === 'bike') {
    rows = await (prisma.bike_bookings as any).groupBy({
      by: ['locationName'],
      where: dateFilter,
      _count: { _all: true },
      orderBy: { _count: { locationName: 'desc' } },
      take: limit,
    });
  } else if (type === 'car') {
    rows = await (prisma.car_bookings as any).groupBy({
      by: ['locationName'],
      where: dateFilter,
      _count: { _all: true },
      orderBy: { _count: { locationName: 'desc' } },
      take: limit,
    });
  } else if (type === 'chauffeur') {
    rows = await (prisma.chauffeur_bookings as any).groupBy({
      by: ['locationName'],
      where: dateFilter,
      _count: { _all: true },
      orderBy: { _count: { locationName: 'desc' } },
      take: limit,
    });
  } else if (type === 'truck') {
    rows = await (prisma.truck_bookings as any).groupBy({
      by: ['locationName'],
      where: dateFilter,
      _count: { _all: true },
      orderBy: { _count: { locationName: 'desc' } },
      take: limit,
    });
  }

  const cities = rows.map((r) => ({ city: r.locationName, bookings: r._count._all }));
  const total = cities.reduce((sum, c) => sum + c.bookings, 0);
  return { type, cities, total };
}

async function getKeywordRankings({ keyword, pagePath, topN = 10, onlyTracking = true }: ToolInput) {
  const where: any = {};
  if (onlyTracking) where.isTracking = true;
  if (keyword) where.keyword = { contains: keyword };
  if (pagePath) where.pagePath = { contains: pagePath };

  const [keywords, totalTracked, top10, improved, dropped] = await Promise.all([
    prisma.keyword_rankings.findMany({
      where,
      select: {
        keyword: true, pagePath: true, position: true, previousPosition: true,
        bestPosition: true, searchVolume: true, lastChecked: true,
      },
      orderBy: { position: 'asc' },
      take: topN,
    }),
    prisma.keyword_rankings.count({ where: { isTracking: true } }),
    prisma.keyword_rankings.count({ where: { isTracking: true, position: { lte: 10 } } }),
    prisma.keyword_rankings.count({
      where: { isTracking: true, position: { not: null }, previousPosition: { not: null } },
    }).then(async () => {
      const rows = await prisma.keyword_rankings.findMany({
        where: { isTracking: true, position: { not: null }, previousPosition: { not: null } },
        select: { position: true, previousPosition: true },
      });
      return rows.filter((r) => r.position! < r.previousPosition!).length;
    }),
    prisma.keyword_rankings.findMany({
      where: { isTracking: true, position: { not: null }, previousPosition: { not: null } },
      select: { position: true, previousPosition: true },
    }).then((rows) => rows.filter((r) => r.position! > r.previousPosition!).length),
  ]);

  return {
    totalTracked,
    inTop10: top10,
    improved,
    dropped,
    keywords: keywords.map((k) => ({
      keyword: k.keyword,
      page: k.pagePath,
      position: k.position,
      previousPosition: k.previousPosition,
      change: k.previousPosition != null && k.position != null ? k.previousPosition - k.position : null,
      bestPosition: k.bestPosition,
      searchVolume: k.searchVolume,
      lastChecked: k.lastChecked,
    })),
  };
}

async function getPageAnalytics({ pagePath, startDate, endDate, topN = 10, sortBy = 'pageViews' }: ToolInput) {
  const dateFilter = (startDate || endDate)
    ? { date: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
    : {};
  const pathFilter = pagePath ? { pagePath: { contains: pagePath } } : {};
  const where = { ...dateFilter, ...pathFilter };

  const validSortFields = ['pageViews', 'organicTraffic', 'formSubmissions', 'uniqueVisitors'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'pageViews';

  const rows = await (prisma.page_analytics as any).groupBy({
    by: ['pagePath'],
    where,
    _sum: {
      pageViews: true,
      uniqueVisitors: true,
      organicTraffic: true,
      formSubmissions: true,
      formStarts: true,
      ctaClicks: true,
      phoneClicks: true,
    },
    orderBy: { _sum: { [orderField]: 'desc' } },
    take: topN,
  });

  const pages = rows.map((r: any) => ({
    page: r.pagePath,
    pageViews: r._sum.pageViews ?? 0,
    uniqueVisitors: r._sum.uniqueVisitors ?? 0,
    organicTraffic: r._sum.organicTraffic ?? 0,
    formSubmissions: r._sum.formSubmissions ?? 0,
    formStarts: r._sum.formStarts ?? 0,
    ctaClicks: r._sum.ctaClicks ?? 0,
    phoneClicks: r._sum.phoneClicks ?? 0,
  }));

  const totals = pages.reduce(
    (acc: any, p: any) => ({
      pageViews: acc.pageViews + p.pageViews,
      organicTraffic: acc.organicTraffic + p.organicTraffic,
      formSubmissions: acc.formSubmissions + p.formSubmissions,
    }),
    { pageViews: 0, organicTraffic: 0, formSubmissions: 0 },
  );

  return { pages, totals, sortedBy: orderField };
}

async function getAnalyticsSummary({ startDate, endDate, days }: ToolInput) {
  let start = startDate ? new Date(startDate) : undefined;
  let end = endDate ? new Date(endDate) : undefined;
  if (!start && days) {
    start = new Date();
    start.setDate(start.getDate() - days);
  }

  const dateFilter = (start || end)
    ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } }
    : {};

  const result = await prisma.analytics_summary.aggregate({
    where: dateFilter,
    _sum: {
      totalPageViews: true,
      uniqueVisitors: true,
      newVisitors: true,
      totalFormSubmissions: true,
      chatBookings: true,
      phoneClicks: true,
      ctaClicks: true,
      mobileVisitors: true,
      desktopVisitors: true,
    },
    _avg: {
      bounceRate: true,
      formConversionRate: true,
      avgPagesPerSession: true,
    },
    _count: true,
  });

  const latest = await prisma.analytics_summary.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true, totalPageViews: true, uniqueVisitors: true, bounceRate: true, topPages: true },
  });

  let topPages: any[] = [];
  if (latest?.topPages) {
    try { topPages = JSON.parse(latest.topPages).slice(0, 5); } catch {}
  }

  return {
    period: { days: result._count, from: start ?? null, to: end ?? null },
    totals: {
      pageViews: result._sum.totalPageViews ?? 0,
      uniqueVisitors: result._sum.uniqueVisitors ?? 0,
      newVisitors: result._sum.newVisitors ?? 0,
      formSubmissions: result._sum.totalFormSubmissions ?? 0,
      chatBookings: result._sum.chatBookings ?? 0,
      phoneClicks: result._sum.phoneClicks ?? 0,
      ctaClicks: result._sum.ctaClicks ?? 0,
    },
    averages: {
      bounceRate: result._avg.bounceRate ? `${(result._avg.bounceRate * 100).toFixed(1)}%` : null,
      formConversionRate: result._avg.formConversionRate ? `${(result._avg.formConversionRate * 100).toFixed(1)}%` : null,
      pagesPerSession: result._avg.avgPagesPerSession?.toFixed(2) ?? null,
    },
    devices: {
      mobile: result._sum.mobileVisitors ?? 0,
      desktop: result._sum.desktopVisitors ?? 0,
    },
    latestDay: latest ? { date: latest.date, pageViews: latest.totalPageViews, uniqueVisitors: latest.uniqueVisitors } : null,
    topPages,
  };
}

// ── Operations Tracker tools — thin wrappers around the same
// src/lib/admin-operations.ts and src/lib/manager-performance.ts functions
// that power the /admin/operations dashboard, so the assistant's numbers
// always match what's on that page. ──

function opsDateFilterObj(period?: string) {
  const range = getDateRange(period || 'today');
  return Object.keys(range).length > 0 ? { createdAt: range } : {};
}

async function getManagerPerformanceTool({ managerName, period = 'today' }: ToolInput) {
  const where: any = { role: 'MANAGER' };
  if (managerName) {
    where.OR = [{ name: { contains: managerName } }, { email: { contains: managerName } }];
  }

  const managers = await prisma.admin_users.findMany({
    where,
    include: {
      manager_locations: { include: { locations: true } },
      manager_services: { include: { services: true } },
    },
  });
  if (managers.length === 0) {
    return { error: managerName ? `No manager found matching "${managerName}"` : 'No managers found' };
  }

  const dateFilterObj = opsDateFilterObj(period);
  const results = await Promise.all(managers.map(async (m) => {
    const stats = await computeManagerStats(m, dateFilterObj);
    return { id: m.id, name: m.name, email: m.email, ...stats };
  }));
  results.sort((a, b) => (a.inquiries.coveragePct ?? 101) - (b.inquiries.coveragePct ?? 101));

  return { period, managers: results };
}

async function getUntouchedInquiriesTool({ period = 'today' }: ToolInput) {
  const result = await getUntouchedInquiries(opsDateFilterObj(period), { limit: 10 });
  return {
    period,
    totalInquiries: result.total,
    actioned: result.actioned,
    untouchedCount: result.untouchedTotal,
    sampleUntouched: result.items,
  };
}

async function getUntouchedBookingsTool({ period = 'today' }: ToolInput) {
  const result = await getUntouchedBookings(opsDateFilterObj(period), { limit: 10 });
  return {
    period,
    totalBookings: result.total,
    actioned: result.actioned,
    untouchedCount: result.untouchedTotal,
    sampleUntouched: result.items,
  };
}

async function getVendorsNeedingActionTool({ staleDays = 3 }: ToolInput) {
  const result = await getVendorsNeedingAction(staleDays, { limit: 15 });
  return { staleDays, total: result.total, vendors: result.items };
}

async function getCoverageGapsTool({ period = 'thisWeek' }: ToolInput) {
  const result = await getCoverageGaps(opsDateFilterObj(period), { limit: 15 });
  return { period, totalGapEvents: result.total, locationsAffected: result.groupsTotal, groups: result.items };
}

async function getIdleVendorCoverageTool({ period = 'thisMonth' }: ToolInput) {
  const result = await getIdleVendorCoverage(opsDateFilterObj(period), { limit: 15 });
  // byLocation (summed per location) is the more useful signal — the raw
  // per-service rows are almost always tied at the same small count, which
  // reads as noise rather than "which location most needs demand".
  return { period, total: result.total, topLocations: result.byLocation, idle: result.items };
}

async function getPaymentFailuresTool({ period = 'today' }: ToolInput) {
  const result = await getPaymentFailures(opsDateFilterObj(period), { limit: 15 });
  const byService = new Map<string, number>();
  for (const item of result.items) byService.set(item.serviceName, (byService.get(item.serviceName) || 0) + 1);
  return {
    period,
    total: result.total,
    byService: [...byService.entries()].map(([serviceName, count]) => ({ serviceName, count })).sort((a, b) => b.count - a.count),
    failures: result.items,
  };
}

async function getSystemHealthTool() {
  return getSystemHealth();
}
