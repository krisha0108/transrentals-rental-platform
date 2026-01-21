import { prisma } from '@/lib/db/prisma';

export interface PaymentConfig {
  gst: number;
  platformFee: number;
  advancePercentage: number;
  securityDeposit: number;
  minBookingDays: number;
  maxBookingDays: number;
}

export interface PriceBreakdown {
  basePrice: number;
  taxAmount: number;
  platformFee: number;
  totalAmount: number;
  advanceAmount: number;
  securityDeposit: number;
  payableNow: number;
  payableAtCounter: number;
}

/**
 * defaults to use if no database settings are found
 */
const FALLBACK_DEFAULTS: PaymentConfig = {
  gst: 18,
  platformFee: 99,
  advancePercentage: 20,
  securityDeposit: 2000,
  minBookingDays: 1,
  maxBookingDays: 30,
};

/**
 * Fetches the effective payment configuration for a given service.
 * Hierarchy: Service Level > Global Level > Hardcoded Fallbacks
 */
export async function getPaymentConfig(serviceId?: string): Promise<PaymentConfig> {
  // 1. Fetch Global Settings
  const globalSettings = await prisma.payment_settings.findFirst();

  // 2. Fetch Service Settings (if serviceId provided)
  let serviceSettings = null;
  if (serviceId) {
    serviceSettings = await prisma.service_payment_configs.findUnique({
      where: { serviceId },
    });
  }

  // 3. Merge configs
  const config = { ...FALLBACK_DEFAULTS };

  // Apply global db settings
  if (globalSettings) {
    config.gst = globalSettings.defaultGst;
    config.platformFee = globalSettings.defaultPlatformFee;
    config.advancePercentage = globalSettings.defaultAdvance;
    config.securityDeposit = globalSettings.defaultSecurityDeposit;
  }

  // Apply service overrides
  if (serviceSettings) {
    if (serviceSettings.gst !== null) config.gst = serviceSettings.gst;
    if (serviceSettings.platformFee !== null) config.platformFee = serviceSettings.platformFee;
    if (serviceSettings.advancePercentage !== null) config.advancePercentage = serviceSettings.advancePercentage;
    if (serviceSettings.securityDeposit !== null) config.securityDeposit = serviceSettings.securityDeposit;
    if (serviceSettings.minBookingDays !== null) config.minBookingDays = serviceSettings.minBookingDays;
    if (serviceSettings.maxBookingDays !== null) config.maxBookingDays = serviceSettings.maxBookingDays;
  }

  return config;
}

/**
 * Calculates the full price breakdown based on base price and configuration
 */
export function calculatePaymentBreakdown(
  basePrice: number,
  config: PaymentConfig
): PriceBreakdown {
  // 1. Calculate Tax
  const taxAmount = (basePrice * config.gst) / 100;

  // 2. Total Trip Cost (Base + Tax + Platform Fee)
  // Note: Platform fee is usually added on top of base+tax, or sometimes included. 
  // Assuming: Base + Tax + Platform Fee = Total Billable to Customer for the 'online' portion logic
  const totalAmount = basePrice + taxAmount + config.platformFee;

  // 3. Calculate Advance (Percentage of Total amount)
  const advanceAmount = (totalAmount * config.advancePercentage) / 100;

  // 4. Payable Now = Advance + Platform Fee? 
  // Actually, usually Advance is calculated on the TRIP cost. 
  // And Platform Fee is fully paid upfront.
  // Method: 
  //   Advance = (Base + Tax) * Advance%
  //   Payable Now = Advance + Platform Fee
  // Let's refine based on user requirement: "advance payment and total all costa nd gst sab achhe se dikhe"

  // Standard implementation:
  // Total = Base + Tax + Platform Fee
  // Advance Part = Total * Advance% 
  // PayableNow = Advance Part + Security Deposit?

  // Let's go with a clear split:
  // Advance covers a % of the Rental Cost (Base + GST).
  // Platform Fee is usually 100% upfront.

  const rentalCost = basePrice + taxAmount;
  const advanceOnRental = (rentalCost * config.advancePercentage) / 100;

  const payableNow = advanceOnRental + config.platformFee + config.securityDeposit;
  const payableAtCounter = totalAmount + config.securityDeposit - payableNow;
  // Wait, Total Amount usually doesn't include Security Deposit in the "Trip Cost", it's separate.

  return {
    basePrice,
    taxAmount,
    platformFee: config.platformFee,
    totalAmount, // Rental + Platform Fee
    advanceAmount: advanceOnRental,
    securityDeposit: config.securityDeposit,
    payableNow,
    payableAtCounter: Math.max(0, payableAtCounter),
  };
}
