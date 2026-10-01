import type { Metadata } from 'next';

// The guide itself is a client component, so it cannot carry metadata of its
// own. Without this the page inherits the site-wide title, which is what a
// vendor would see in their browser tab and in any link they were sent.
export const metadata: Metadata = {
  title: 'Vendor Guide | TransRentals',
  description:
    'How to run your transport business on TransRentals: registering, getting approved, adding vehicles, quoting, and every tool that comes with it.',
  openGraph: {
    title: 'Vendor Guide | TransRentals',
    description:
      'Registering, getting approved, adding vehicles, quoting, and every tool that comes with it — screen by screen.',
    type: 'article',
  },
};

export default function VendorGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
