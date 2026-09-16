import Link from 'next/link';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// Fraud-prevention notice shown on quote-request detail pages, both while
// waiting for quotes and after they arrive — payment safety applies at
// every stage, not just before a vendor has responded. Layered animation
// (border pulse, icon ring ping + breathing scale, light sweep) draws the
// eye without ever touching text opacity/position, so copy stays readable.
export default function QuotePaymentSafetyNotice() {
  return (
    <div className="relative rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-5 overflow-hidden">
      <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-pulse pointer-events-none" />

      {/* Diagonal light sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="tr-safety-sweep absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>

      <div className="relative flex items-start gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
          <div className="tr-safety-icon-breathe relative w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-red-800">
            ⚠️ Stay Alert: Pay &amp; Communicate Only Through TransRentals
          </h3>
          <p className="text-sm text-gray-700 mt-1">
            Never make any direct payment to a vendor outside the TransRentals platform. For
            self-drive rentals and other services, a vendor may request an advance payment where
            applicable — but until the vehicle/service is officially handed over to you, do not
            make any additional or direct payment outside TransRentals for any reason.
          </p>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0 animate-pulse" />
              <span>Accept quotes and make payments only through the official TransRentals platform</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0 animate-pulse" />
              <span>
                Use TransRentals Chat only to talk to vendors — never continue conversations or
                arrange payment over WhatsApp, personal phone numbers, SMS, or any other external
                platform
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
              <span>
                If anyone claiming to be a TransRentals vendor contacts you on WhatsApp or by
                phone and asks you to pay directly, do not pay — ask them to communicate through
                the TransRentals platform instead
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
              <span>
                Never share payment details or OTPs, and never make a bank transfer/UPI payment to
                a vendor based on an external call or message
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-100/60 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm font-medium text-red-900">
              If you make any payment outside the TransRentals platform, TransRentals will not be
              responsible for any resulting fraud, loss, refund, cancellation, or dispute.
            </p>
          </div>

          <p className="text-sm text-gray-700 mt-3">
            If a vendor insists on direct payment or asks you to move the conversation outside
            TransRentals,{' '}
            <Link href="/customer/helpdesk" className="font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
              report it to TransRentals immediately
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
