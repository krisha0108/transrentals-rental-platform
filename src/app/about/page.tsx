import type { Metadata } from 'next';
import { WebPageSchema } from '@/components/seo/schemas';
import { AboutPageClient } from '@/components/about/AboutPageClient';

export const metadata: Metadata = {
  title: "About TransRentals - India's #1 Vehicle Rental Marketplace",
  description: "TransRentals is India's largest vehicle rental marketplace connecting customers with verified vendors across 500+ cities. Learn about our mission, values, and the story behind the platform.",
  alternates: { canonical: 'https://transrentals.in/about' },
  openGraph: {
    title: "About TransRentals - India's #1 Vehicle Rental Marketplace",
    description: "India's largest vehicle rental marketplace. 40K+ customers, 1000+ verified vehicles, 500+ cities.",
    type: 'website',
    url: 'https://transrentals.in/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <WebPageSchema
        type="AboutPage"
        name="About TransRentals - India's #1 Vehicle Rental Marketplace"
        description="TransRentals is India's largest vehicle rental marketplace connecting customers with verified vendors across 500+ cities. Learn about our mission and values."
        url="https://transrentals.in/about"
        breadcrumbs={[
          { name: 'Home', url: 'https://transrentals.in' },
          { name: 'About Us', url: 'https://transrentals.in/about' },
        ]}
      />
      <AboutPageClient />
    </>
  );
}
