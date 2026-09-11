// Bulk import for the manager call sheet — accepts the rows parsed from an Excel
// file on the client and creates one call report per row.
//
// Services and locations arrive as NAMES (that is what the export writes and what a
// manager would type in a spreadsheet), so they are resolved to ids here. A name that
// matches nothing is reported back against its row rather than silently dropped.
//
//   POST body: { rows: [{ vendorName, companyName?, companyDetails?, phone?, email?,
//        address?, city?, contactType?, services?, locations?, status?, notes?,
//        callDate?, nextFollowUpDate?, nextFollowUpTime?, nextAction? }] }
//        → { success, created, failed, errors: [{ row, message }] }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const STATUS_VALUES = [
  'VENDOR_CREATED',
  'TRAVEL_AGENT_CREATED',
  'INTERESTED',
  'FOLLOW_UP',
  'NOT_INTERESTED',
  'NO_ANSWER',
  'CALLBACK_LATER',
  'WRONG_NUMBER',
  'DUPLICATE',
] as const;

// Human labels (as written by the export) mapped back onto the enum, so a sheet that
// was exported from this page can be re-imported without editing.
const STATUS_BY_LABEL: Record<string, string> = {
  'vendor created': 'VENDOR_CREATED',
  'travel agent created': 'TRAVEL_AGENT_CREATED',
  'interested': 'INTERESTED',
  'follow up': 'FOLLOW_UP',
  'follow-up': 'FOLLOW_UP',
  'not interested': 'NOT_INTERESTED',
  'no answer': 'NO_ANSWER',
  'callback later': 'CALLBACK_LATER',
  'wrong number': 'WRONG_NUMBER',
  'duplicate': 'DUPLICATE',
};

// One import can create at most this many rows, so a mis-selected file cannot spend
// the whole request budget.
const MAX_ROWS = 2000;

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;
  if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return null;
  return { id: session.user.id, name: session.user.name || null, role };
}

/** Splits a "A; B, C" cell into trimmed names. */
function splitNames(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  const text = String(raw ?? '').trim();
  if (!text) return [];
  return text.split(/[;,|]/).map((v) => v.trim()).filter(Boolean);
}

function parseStatus(raw: unknown): string {
  const text = String(raw ?? '').trim();
  if (!text) return 'FOLLOW_UP';
  const upper = text.toUpperCase().replace(/[\s-]+/g, '_');
  if ((STATUS_VALUES as readonly string[]).includes(upper)) return upper;
  return STATUS_BY_LABEL[text.toLowerCase()] || 'FOLLOW_UP';
}

/** Accepts an ISO string, a dd/mm/yyyy cell, or an Excel serial number. */
function parseDate(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial days since 1899-12-30.
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const text = String(raw).trim();
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body: any = await request.json();
    const rows: any[] = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'The file had no rows to import.' }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `That file has ${rows.length} rows; the limit is ${MAX_ROWS} per import.` },
        { status: 400 },
      );
    }

    // Resolve every service/location name in the file in two queries rather than two
    // per row. Matching is case-insensitive on name, and also accepts a slug.
    const allServiceNames = new Set<string>();
    const allLocationNames = new Set<string>();
    rows.forEach((r) => {
      splitNames(r?.services).forEach((n) => allServiceNames.add(n.toLowerCase()));
      splitNames(r?.locations).forEach((n) => allLocationNames.add(n.toLowerCase()));
    });

    const [services, locations] = await Promise.all([
      allServiceNames.size
        ? prisma.services.findMany({ select: { id: true, name: true, slug: true } })
        : Promise.resolve([] as { id: string; name: string; slug: string }[]),
      allLocationNames.size
        ? prisma.locations.findMany({ select: { id: true, name: true, slug: true } })
        : Promise.resolve([] as { id: string; name: string; slug: string }[]),
    ]);

    const serviceByKey = new Map<string, string>();
    services.forEach((s) => {
      serviceByKey.set(s.name.toLowerCase(), s.id);
      if (s.slug) serviceByKey.set(s.slug.toLowerCase(), s.id);
    });
    const locationByKey = new Map<string, string>();
    locations.forEach((l) => {
      locationByKey.set(l.name.toLowerCase(), l.id);
      if (l.slug) locationByKey.set(l.slug.toLowerCase(), l.id);
    });

    const errors: { row: number; message: string }[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      // +2 so the number matches what the manager sees in Excel (1 = header row).
      const rowNumber = i + 2;
      const r = rows[i] || {};

      try {
        const vendorName = String(r.vendorName ?? '').trim();
        if (!vendorName) {
          errors.push({ row: rowNumber, message: 'Vendor name is empty' });
          continue;
        }

        const serviceNames = splitNames(r.services);
        const locationNames = splitNames(r.locations);

        const serviceIds: string[] = [];
        const unknownServices: string[] = [];
        serviceNames.forEach((n) => {
          const id = serviceByKey.get(n.toLowerCase());
          if (id) serviceIds.push(id);
          else unknownServices.push(n);
        });

        const locationIds: string[] = [];
        const unknownLocations: string[] = [];
        locationNames.forEach((n) => {
          const id = locationByKey.get(n.toLowerCase());
          if (id) locationIds.push(id);
          else unknownLocations.push(n);
        });

        if (unknownServices.length || unknownLocations.length) {
          const bits = [
            unknownServices.length ? `unknown service(s): ${unknownServices.join(', ')}` : '',
            unknownLocations.length ? `unknown location(s): ${unknownLocations.join(', ')}` : '',
          ].filter(Boolean);
          errors.push({ row: rowNumber, message: bits.join('; ') });
          continue;
        }

        const contactTypeRaw = String(r.contactType ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        const contactType = contactTypeRaw === 'TRAVEL_AGENT' ? 'TRAVEL_AGENT' : 'VENDOR';

        await prisma.manager_call_reports.create({
          data: {
            managerId: manager.id,
            vendorId: null,
            vendorName,
            companyName: String(r.companyName ?? '').trim() || null,
            companyDetails: String(r.companyDetails ?? '').trim() || null,
            phone: String(r.phone ?? '').trim() || null,
            email: String(r.email ?? '').trim().toLowerCase() || null,
            address: String(r.address ?? '').trim() || null,
            city: String(r.city ?? '').trim() || null,
            contactType,
            status: parseStatus(r.status) as any,
            nextFollowUpDate: parseDate(r.nextFollowUpDate),
            nextFollowUpTime: String(r.nextFollowUpTime ?? '').trim() || null,
            nextAction: String(r.nextAction ?? '').trim() || null,
            notes: String(r.notes ?? '').trim() || null,
            callDate: parseDate(r.callDate) ?? new Date(),
            manager_call_report_locations: locationIds.length
              ? { create: [...new Set(locationIds)].map((locationId) => ({ locationId })) }
              : undefined,
            manager_call_report_services: serviceIds.length
              ? { create: [...new Set(serviceIds)].map((serviceId) => ({ serviceId })) }
              : undefined,
          },
        });
        created++;
      } catch (err: any) {
        errors.push({ row: rowNumber, message: err?.message?.slice(0, 200) || 'Could not save this row' });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed: errors.length,
      total: rows.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    logger.error('Failed to import manager call reports', error);
    return NextResponse.json({ error: 'Failed to import call reports' }, { status: 500 });
  }
}
