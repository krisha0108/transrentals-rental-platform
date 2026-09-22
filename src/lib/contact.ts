const whatsappRaw =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || '+91 9737965551';
const WHATSAPP_DIGITS = whatsappRaw.replace(/\D+/g, '');
const contactPhoneRaw =
  process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || '+91 9737965551';
const CONTACT_PHONE_DIGITS = contactPhoneRaw.replace(/\D+/g, '');
const contactEmailRaw =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'book@transrentals.in';
const contactAddressRaw = process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() ?? '';
const CONTACT_ADDRESS_DECODED =
  contactAddressRaw || 'Shakti Dhar Complex, 2nd Floor, Bapunagar, Ahmedabad, Gujarat 382350';

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
/**
 * Driver app on Google Play — the live listing.
 *
 * Note the package id is `com.transdriver`, not the `com.transrentals.driverapp`
 * that the driver-app version endpoint reports; the published listing is the
 * one that matters here. Kept as a fallback so the download button works on an
 * environment that has not set the var — it used to fall back to '#' and
 * silently did nothing.
 */
export const DRIVER_APP_ANDROID_LINK =
  process.env.NEXT_PUBLIC_DRIVER_APP_ANDROID?.trim() ||
  'https://play.google.com/store/apps/details?id=com.transdriver&hl=en_IN';

export const CONTACT_ADDRESS = CONTACT_ADDRESS_DECODED;
export const CONTACT_ADDRESS_LINK = CONTACT_ADDRESS_DECODED
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_ADDRESS_DECODED)}`
  : undefined;
