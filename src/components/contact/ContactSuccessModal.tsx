'use client';

import Link from 'next/link';
import { CheckCircle2, X, LogIn, UserPlus } from 'lucide-react';

export default function ContactSuccessModal({
  referenceNumber,
  name,
  email,
  phone,
  isExistingCustomer,
  onClose,
}: {
  referenceNumber: string;
  name: string;
  email: string;
  phone: string;
  isExistingCustomer: boolean;
  onClose: () => void;
}) {
  const params = new URLSearchParams({ email, name, phone });
  const ctaHref = isExistingCustomer
    ? `/customer/login?mode=login&${params.toString()}`
    : `/customer/login?mode=register&${params.toString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900">Message Sent!</h2>
        <p className="text-sm text-gray-500 mt-1">
          We've received your message and will reply within one business day.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500">Reference</span>
          <span className="text-sm font-mono font-semibold text-gray-900 tracking-wide">{referenceNumber}</span>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-left">
          <p className="text-sm text-blue-900 font-medium">Don't miss our reply</p>
          <p className="text-sm text-blue-800 mt-1">
            {isExistingCustomer
              ? 'This email is already on a TransRentals account. Log in to track this message and get notified as soon as we respond.'
              : 'Create a free account to track this message and get notified as soon as we respond.'}
          </p>
          <Link
            href={ctaHref}
            className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            {isExistingCustomer ? (
              <>
                <LogIn className="w-4 h-4" />
                Log In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Free Account
              </>
            )}
          </Link>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
