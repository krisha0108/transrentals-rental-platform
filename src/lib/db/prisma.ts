import { PrismaClient } from "@prisma/client";

// Extend global type for Prisma singleton
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

// Check if we should skip database calls (during CI/CD build)
const SKIP_DATABASE = process.env.SKIP_DATABASE_CALLS === '1';

// Create a mock prisma client for build time that returns empty results
function createMockPrismaClient(): PrismaClient {
  console.log("🔧 Creating mock Prisma Client for CI/CD build (SKIP_DATABASE_CALLS=1)");

  // Create a proxy that returns empty arrays/null for all queries
  const handler: ProxyHandler<object> = {
    get(target, prop) {
      // Handle special properties
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => undefined;
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') {
        return async () => [];
      }
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }

      // For any model access (e.g., prisma.user), return another proxy
      return new Proxy({}, {
        get(target, modelProp) {
          // Return async functions that return empty/null for all operations
          if (modelProp === 'findMany' || modelProp === 'findFirst' || modelProp === 'findUnique') {
            return async () => modelProp === 'findMany' ? [] : null;
          }
          if (modelProp === 'create' || modelProp === 'update' || modelProp === 'upsert') {
            return async () => ({});
          }
          if (modelProp === 'delete' || modelProp === 'deleteMany') {
            return async () => ({ count: 0 });
          }
          if (modelProp === 'count') {
            return async () => 0;
          }
          if (modelProp === 'aggregate') {
            return async () => ({});
          }
          if (modelProp === 'groupBy') {
            return async () => [];
          }
          // Default: return async function that returns null
          return async () => null;
        }
      });
    }
  };

  return new Proxy({}, handler) as unknown as PrismaClient;
}

// Create Prisma client with proper error handling
function createPrismaClient(): PrismaClient {
  // If SKIP_DATABASE_CALLS is set, return mock client
  if (SKIP_DATABASE) {
    return createMockPrismaClient();
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    const error = "DATABASE_URL is not configured in environment variables";
    console.error("❌", error);
    throw new Error(error);
  }

  console.log("🔄 Creating new Prisma Client instance...");

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    });

    console.log("✅ Prisma Client instance created successfully");
    return client;
  } catch (error) {
    console.error("❌ Failed to create Prisma Client:", error);
    throw error;
  }
}

// Initialize or reuse the global Prisma client
function getPrismaClient(): PrismaClient {
  // If SKIP_DATABASE_CALLS is set, always return mock client
  if (SKIP_DATABASE) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createMockPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  // In production, always create a new instance
  if (process.env.NODE_ENV === "production") {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return globalForPrisma.prisma;
  }

  // In development, reuse the global instance to avoid HMR issues
  if (!globalForPrisma.prisma) {
    console.log("📦 No existing Prisma Client found, creating new one...");
    globalForPrisma.prisma = createPrismaClient();

    // Test connection in development
    globalForPrisma.prisma.$connect()
      .then(() => {
        console.log("✅ Database connection established successfully");
      })
      .catch((error) => {
        console.error("❌ Database connection failed:", error.message);
      });
  } else {
    console.log("♻️ Reusing existing Prisma Client instance (HMR)");
  }

  return globalForPrisma.prisma;
}

// Export the Prisma client instance
export const prisma = getPrismaClient();

// Only validate client when not in build mode
if (!SKIP_DATABASE && !prisma) {
  throw new Error("Failed to initialize Prisma Client");
}
