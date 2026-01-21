import type { Metadata } from 'next';
import { FAQPage } from '@/components/faq/FAQPage';

export const metadata: Metadata = {
  title: 'FAQ | TransRentals',
  description: 'Get quick answers about booking, cancelling, and using TransRentals across India.',
};

export default function FAQPageShell() {
  return <FAQPage />;
}
