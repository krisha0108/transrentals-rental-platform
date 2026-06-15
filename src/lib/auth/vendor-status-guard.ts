import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

// Statuses that block ALL write operations
const BLOCKED_STATUSES = ['REJECTED', 'SUSPENDED', 'BLOCKED'] as const;

type GuardResult =
  | { blocked: false }
  | { blocked: true; response: NextResponse };

/**
 * Call this at the top of any vendor POST/PUT/PATCH/DELETE handler.
 * Returns a 403 response if the vendor is REJECTED, SUSPENDED, or BLOCKED.
 *
 * Usage:
 *   const guard = await vendorStatusGuard(vendorId);
 *   if (guard.blocked) return guard.response;
 */
export async function vendorStatusGuard(vendorId: string): Promise<GuardResult> {
  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { status: true },
  });

  if (!vendor) {
    return {
      blocked: true,
      response: NextResponse.json({ error: 'Vendor not found' }, { status: 404 }),
    };
  }

  if ((BLOCKED_STATUSES as readonly string[]).includes(vendor.status)) {
    const messages: Record<string, string> = {
      REJECTED: 'Your account has been rejected. You cannot perform this action.',
      SUSPENDED: 'Your account is suspended. You cannot perform this action.',
      BLOCKED: 'Your account is blocked. You cannot perform this action.',
    };
    return {
      blocked: true,
      response: NextResponse.json(
        { error: messages[vendor.status] ?? 'Your account is not authorized for this action.' },
        { status: 403 }
      ),
    };
  }

  return { blocked: false };
}
