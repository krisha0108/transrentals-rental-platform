import type { Metadata } from 'next';
import { FAQPage } from '@/components/faq/FAQPage';
import { FAQSchema, BreadcrumbSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | TransRentals',
  description: 'Get quick answers about booking, cancelling, payments, and using TransRentals across 150+ cities in India. All vehicle rental FAQs answered.',
  alternates: { canonical: 'https://transrentals.in/faq' },
};

const FAQ_ITEMS = [
  { question: 'How do I book a vehicle or equipment?', answer: 'Choose your vehicle type, trip dates, and city from the homepage. We cover 150+ cities, so simply enter pickup/drop, verify your ID, and pay securely to get instant confirmation.' },
  { question: 'Which documents are required?', answer: 'A government-issued photo ID (Aadhaar, Passport, or Driving Licence) plus a selfie are enough for standard rentals. Trucks, buses, or equipment may require additional business documents, which we highlight before payment.' },
  { question: 'How do I cancel or modify a booking?', answer: 'Modify or cancel up to 48 hours before pickup via your dashboard or by calling 9737965551. We email the updated charges, and any penalties follow the published cancellation policy.' },
  { question: 'What if the vehicle or vendor is unavailable?', answer: 'We either assign another verified vendor in the same city or refund you per the refund policy. Contact us at 9737965551 immediately and we will re-route the replacement.' },
  { question: 'How do payments and refunds work?', answer: 'Pay with cards, UPI, or wallets. Vendors receive payment after your trip, and refunds process instantly once a cancellation is confirmed — expect a 5–7 business day window for cards/UPI.' },
  { question: 'How can I reach support while on the move?', answer: 'Call or WhatsApp us at 9737965551 for immediate help. Premium services add a dedicated booking manager, and every support channel spans our 150+ city network.' },
];

export default function FAQPageShell() {
  return (
    <>
      <FAQSchema faqs={FAQ_ITEMS} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://transrentals.in' },
        { name: 'FAQ', url: 'https://transrentals.in/faq' },
      ]} />
      <FAQPage />
    </>
  );
}
