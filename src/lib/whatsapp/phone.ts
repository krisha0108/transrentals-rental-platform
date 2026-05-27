// Normalize Indian phone numbers to the format Meta WhatsApp Cloud API expects:
// digits only, country code prefixed, no leading + or 0.
// Examples:
//   "+91 98765 43210" -> "919876543210"
//   "098765 43210"    -> "919876543210"
//   "9876543210"      -> "919876543210"
//   "919876543210"    -> "919876543210"
// Returns null if the input doesn't look like a valid Indian mobile number.
export function normalizeIndianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;

  // Strip leading zeros (e.g. "098765..." -> "98765...")
  digits = digits.replace(/^0+/, '');

  // If already prefixed with 91 and total length is 12, accept as-is
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // Plain 10-digit Indian mobile (must start with 6-9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // Anything else is suspicious — let caller decide what to do
  return null;
}
