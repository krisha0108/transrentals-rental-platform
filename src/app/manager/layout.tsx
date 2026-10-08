import type { Metadata, Viewport } from 'next';

// Sets manager-specific PWA manifest for all /manager/* routes
export const metadata: Metadata = {
  manifest: '/manager-manifest.json',
  title: {
    default: 'Manager App | TransRentals',
    template: '%s | TR Manager',
  },
  description: 'Handle manager approvals, helpdesk, inquiries and chats on the go',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TR Manager',
  },
};

export const viewport: Viewport = {
  themeColor: '#16A34A',
};

export default function ManagerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
