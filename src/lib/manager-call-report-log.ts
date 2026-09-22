import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

/**
 * Record a call report in `manager_action_logs`.
 *
 * Call reports live in their own table, so for a long time none of them
 * reached the action log — and every performance number an admin sees is
 * counted from that log. A manager who spent the day on vendor calls showed
 * up as having done nothing. Writing a log row alongside the report is what
 * makes that work visible.
 *
 * The report itself stays the source of truth; this row is the audit trail
 * entry, which is why a failure here is logged and swallowed rather than
 * failing the request. Losing a stat line is not worth losing the report.
 */

/** call_report_status → the closest manager_action_type. */
const STATUS_TO_ACTION: Record<string, string> = {
  VENDOR_CREATED: 'CONVERTED',
  TRAVEL_AGENT_CREATED: 'CONVERTED',
  CONVERTED: 'CONVERTED',
  INTERESTED: 'CALLED',
  FOLLOW_UP: 'FOLLOW_UP',
  CALLBACK_LATER: 'FOLLOW_UP',
  NOT_INTERESTED: 'NOT_INTERESTED',
  NO_ANSWER: 'CUSTOMER_NOT_RESPONDING',
  WRONG_NUMBER: 'WRONG_NUMBER',
};

export const CALL_REPORT_RECORD_TYPE = 'CALL_REPORT';

export async function logCallReportAction(params: {
  managerId: string;
  reportId: string;
  /** A `call_report_status` value. */
  status: string;
  /** A `call_report_contact_type` value — becomes the serviceType column. */
  contactType: string;
  note?: string | null;
  previousStatus?: string | null;
}) {
  const { managerId, reportId, status, contactType, note, previousStatus } = params;

  try {
    await prisma.manager_action_logs.create({
      data: {
        recordType: CALL_REPORT_RECORD_TYPE,
        // serviceType is a free-text slug elsewhere in this table; the contact
        // type is the closest equivalent for a call report.
        serviceType: contactType === 'TRAVEL_AGENT' ? 'travel-agent' : 'vendor',
        recordId: reportId,
        actionType: (STATUS_TO_ACTION[status] ?? 'NOTE_ADDED') as any,
        note: note ?? null,
        previousStatus: previousStatus ?? null,
        newStatus: status,
        managerId,
      },
    });
  } catch (error) {
    logger.error('Failed to log call report action', error);
  }
}

/**
 * Record a flag / unflag on a call report.
 *
 * Flagging is not a status change, so it does not go through
 * `logCallReportAction` — but it is still manager work an admin should be
 * able to trace, especially since a flag is what puts a row in front of the
 * admin's delete button. Same swallow-on-failure rule as above.
 */
export async function logCallReportFlag(params: {
  actorId: string;
  reportId: string;
  contactType: string;
  flagged: boolean;
  reason?: string | null;
}) {
  const { actorId, reportId, contactType, flagged, reason } = params;

  try {
    await prisma.manager_action_logs.create({
      data: {
        recordType: CALL_REPORT_RECORD_TYPE,
        serviceType: contactType === 'TRAVEL_AGENT' ? 'travel-agent' : 'vendor',
        recordId: reportId,
        actionType: 'NOTE_ADDED',
        note: flagged ? `Flagged: ${reason || 'no reason given'}` : 'Flag removed',
        previousStatus: flagged ? 'UNFLAGGED' : 'FLAGGED',
        newStatus: flagged ? 'FLAGGED' : 'UNFLAGGED',
        managerId: actorId,
      },
    });
  } catch (error) {
    logger.error('Failed to log call report flag', error);
  }
}
