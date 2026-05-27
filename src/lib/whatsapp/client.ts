import logger from '@/lib/security/logger';
import { WA_TEMPLATES, type WaTemplateKey } from './templates';
import { normalizeIndianPhone } from './phone';

const GRAPH_API_VERSION = 'v19.0';

interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: 'not_configured' | 'invalid_phone';
}

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

// Send a pre-approved template message via Meta WhatsApp Cloud API.
// Returns a result object — never throws. Safe to call fire-and-forget.
export async function sendTemplate(
  rawPhone: string,
  templateKey: WaTemplateKey,
  params: string[]
): Promise<SendResult> {
  const cfg = getConfig();
  if (!cfg) {
    logger.debug('WhatsApp send skipped: credentials not configured', {
      template: templateKey,
    });
    return { ok: false, skipped: 'not_configured' };
  }

  const to = normalizeIndianPhone(rawPhone);
  if (!to) {
    logger.warn('WhatsApp send skipped: invalid phone format', {
      template: templateKey,
      rawLength: rawPhone?.length,
    });
    return { ok: false, skipped: 'invalid_phone' };
  }

  const template = WA_TEMPLATES[templateKey];

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${cfg.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: template.name,
            language: { code: template.language },
            components: [
              {
                type: 'body',
                parameters: params.map((p) => ({ type: 'text', text: p })),
              },
            ],
          },
        }),
      }
    );

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      logger.error('WhatsApp API returned error', undefined, {
        template: templateKey,
        status: res.status,
        metaError: data?.error,
      });
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }

    const messageId: string | undefined = data?.messages?.[0]?.id;
    logger.info('WhatsApp message sent', { template: templateKey, messageId });
    return { ok: true, messageId };
  } catch (err: any) {
    logger.error('WhatsApp send threw', err, { template: templateKey });
    return { ok: false, error: err?.message || 'network error' };
  }
}

// Fire-and-forget wrapper. Use inside route handlers so a WhatsApp failure
// never blocks or breaks the primary response.
export function sendTemplateFireAndForget(
  rawPhone: string,
  templateKey: WaTemplateKey,
  params: string[]
): void {
  void sendTemplate(rawPhone, templateKey, params).catch((err) => {
    logger.error('WhatsApp fire-and-forget unexpected throw', err, {
      template: templateKey,
    });
  });
}

// ---------- High-level wrappers (one per business event) ----------

function formatPickupDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  // e.g. "21 May 2026"
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface BookingConfirmationInput {
  customerPhone: string;
  customerName: string;
  bookingNumber: string;
  pickupDate: Date | string;
  vehicleOrService: string;
}

export function sendBookingConfirmation(input: BookingConfirmationInput): void {
  sendTemplateFireAndForget(input.customerPhone, 'bookingConfirmation', [
    input.customerName,
    input.bookingNumber,
    formatPickupDate(input.pickupDate),
    input.vehicleOrService,
  ]);
}

interface InquiryReceivedInput {
  customerPhone: string;
  customerName: string;
  subject: string;
}

export function sendInquiryReceived(input: InquiryReceivedInput): void {
  sendTemplateFireAndForget(input.customerPhone, 'inquiryReceived', [
    input.customerName,
    input.subject,
  ]);
}
