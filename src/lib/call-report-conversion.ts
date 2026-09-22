/**
 * Has this call report already turned into a vendor / travel agent?
 *
 * Two separate things can say "yes", and they drift apart:
 *
 *   • the **link** — `vendorId` / `travelAgentId` on the report, set when the
 *     manager converts through the app
 *   • the **status** — `VENDOR_CREATED`, `TRAVEL_AGENT_CREATED`, `CONVERTED`,
 *     which any manager can set straight from the pill dropdown on the shared
 *     sheet, without a record being linked
 *
 * The screens used to read only the link, so a report a manager had marked
 * "Vendor Created" still offered a big "Ready to Become Vendor" button — the
 * page contradicting its own status field, and an invitation to create the
 * same vendor twice.
 *
 * Deciding it in one place keeps the view modal, the edit form and anything
 * added later telling the same story.
 */

/** Statuses that mean the contact is on the books already. */
export const CONVERTED_STATUSES = ['VENDOR_CREATED', 'TRAVEL_AGENT_CREATED', 'CONVERTED'] as const;

export type CallReportConversion =
  /** A record exists and we hold its id — link straight to it. */
  | { kind: 'linked'; target: 'vendor'; id: string; label: string }
  | { kind: 'linked'; target: 'travelAgent'; id: string; label: string }
  /** The status says converted but nothing is linked — state it, do not offer to convert again. */
  | { kind: 'already'; target: 'vendor' | 'travelAgent'; label: string }
  /** Still a lead: offering conversion is the right call. */
  | { kind: 'offer'; target: 'vendor' | 'travelAgent' };

interface Input {
  status: string;
  contactType: string;
  vendor?: { id: string; vid?: string | null } | null;
  travelAgent?: { id: string; tid?: string | null } | null;
}

export function getConversionState({ status, contactType, vendor, travelAgent }: Input): CallReportConversion {
  // A real link wins over everything: we can send the manager to the record.
  if (vendor) {
    return { kind: 'linked', target: 'vendor', id: vendor.id, label: vendor.vid ? vendor.vid.toUpperCase() : 'View vendor profile' };
  }
  if (travelAgent) {
    return { kind: 'linked', target: 'travelAgent', id: travelAgent.id, label: travelAgent.tid ? travelAgent.tid.toUpperCase() : 'View travel agent profile' };
  }

  // No link. `contactType` decides which kind of record the status is talking
  // about, except where the status names it outright — a report filed as a
  // vendor but marked TRAVEL_AGENT_CREATED means the manager corrected it on
  // the sheet, and the status is the later word.
  const target: 'vendor' | 'travelAgent' =
    status === 'TRAVEL_AGENT_CREATED' ? 'travelAgent'
      : status === 'VENDOR_CREATED' ? 'vendor'
        : contactType === 'TRAVEL_AGENT' ? 'travelAgent' : 'vendor';

  if ((CONVERTED_STATUSES as readonly string[]).includes(status)) {
    return {
      kind: 'already',
      target,
      label: target === 'vendor' ? 'Already a Vendor' : 'Already a Travel Agent',
    };
  }

  return { kind: 'offer', target };
}
