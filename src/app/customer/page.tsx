'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if customer is already logged in
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const customer = localStorage.getItem('customer');

    if (token && customer) {
      // Already logged in, redirect to dashboard
      router.push('/customer/dashboard');
    } else {
      // Not logged in, redirect to login page
      router.push('/customer/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
