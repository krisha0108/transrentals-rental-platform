const whatsappRaw =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '+91 98765 43210';
const WHATSAPP_DIGITS = whatsappRaw.replace(/\D+/g, '');
const contactPhoneRaw =
  process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || '+91 98765 43210';
const CONTACT_PHONE_DIGITS = contactPhoneRaw.replace(/\D+/g, '');
const contactEmailRaw =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'support@transrentals.in';
const contactAddressRaw = process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() ?? '';
const CONTACT_ADDRESS_DECODED =
  contactAddressRaw || '215, Galaxy Business, 2nd Floor, SP Ring Road, Ahmedabad, Gujarat-382350';

export const WHATSAPP_NUMBER_DIGITS = WHATSAPP_DIGITS;
export const WHATSAPP_NUMBER_DISPLAY = whatsappRaw;
export const WHATSAPP_LINK = WHATSAPP_DIGITS
  ? `https://wa.me/${WHATSAPP_DIGITS}`
  : undefined;
export const CONTACT_PHONE = contactPhoneRaw;
export const CONTACT_PHONE_LINK = CONTACT_PHONE_DIGITS
  ? `tel:+${CONTACT_PHONE_DIGITS}`
  : undefined;
export const CONTACT_EMAIL = contactEmailRaw;
export const CONTACT_EMAIL_LINK = contactEmailRaw
  ? `mailto:${contactEmailRaw}`
  : undefined;
export const CONTACT_ADDRESS = CONTACT_ADDRESS_DECODED;
export const CONTACT_ADDRESS_LINK = CONTACT_ADDRESS_DECODED
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_ADDRESS_DECODED)}`
  : undefined;
