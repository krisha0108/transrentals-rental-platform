import { PrismaClient } from "@prisma/client";

// Extend global type for Prisma singleton
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

// Create Prisma client with proper error handling
function createPrismaClient(): PrismaClient {
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

    // Note: Auto ID generation handled via helper functions (see src/lib/utils/id-generator.ts)
    // Prisma 6.x extensions have connection pool issues with temp clients
    console.log("✅ Prisma Client instance created successfully");
    return client;
  } catch (error) {
    console.error("❌ Failed to create Prisma Client:", error);
    throw error;
  }
}

// Initialize or reuse the global Prisma client
function getPrismaClient(): PrismaClient {
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

// Ensure we always have a valid client
if (!prisma) {
  throw new Error("Failed to initialize Prisma Client");
}
