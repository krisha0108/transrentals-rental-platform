import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

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
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-red-800">Pay Only Through TransRentals</h3>
          <p className="text-sm text-gray-700 mt-1">
            Before accepting any quote or making a payment, make sure you're on the official
            TransRentals platform. Never pay a vendor directly outside TransRentals — not for
            booking confirmation, not for the quotation, and not at any point until your trip is
            complete.
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0 animate-pulse" />
              <span>Accept quotes and pay only through the TransRentals platform</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
              <span>If you pay a vendor directly, TransRentals cannot help with any issues, refunds, or disputes for that booking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
