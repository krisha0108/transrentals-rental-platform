// Registry of WhatsApp template names submitted to Meta for approval.
// Keep the names here in sync with what's actually approved in the Meta console.
// See README.md in this folder for the exact body text to paste into Meta.

export const WA_TEMPLATES = {
  bookingConfirmation: {
    name: 'booking_confirmation',
    // Language code must match what's approved in Meta. English templates with
    // Hinglish/Indian-English wording are submitted as 'en'.
    language: 'en',
  },
  inquiryReceived: {
    name: 'inquiry_received',
    language: 'en',
  },
} as const;

export type WaTemplateKey = keyof typeof WA_TEMPLATES;
