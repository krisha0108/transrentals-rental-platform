import Link from 'next/link';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';

// Fraud-prevention notice shown on booking detail pages once a vendor is
// assigned and their contact info is revealed — this is the stage where a
// customer can actually be contacted off-platform, so it's a separate,
// stronger notice from QuotePaymentSafetyNotice (shown earlier, before a
// vendor exists at all).
//
// The two rules a customer breaks most often are always on screen; the rest —
// the remaining rules, the liability wording and the warning about smooth
// coordination — sits behind a disclosure so the card is not a wall of red on
// first sight. Nothing is dropped: <details> keeps every word in the page and
// in the markup, one click away. The link to report a vendor stays outside the
// disclosure, because that is the thing someone needs to reach in a hurry.
export default function BookingPaymentSafetyNotice() {
  return (
    <div className="relative rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-5 overflow-hidden">
      <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-pulse pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
          <div className="relative w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-red-800">
            ⚠️ Important: Stay Safe from Direct Payment &amp; Fraud
          </h3>
          <p className="text-sm text-gray-700 mt-1">
            To provide you with a smooth booking experience, your contact details may be shared
            with our verified vendor for booking-related coordination. This does not mean you
            should make any direct payment or accept any offer from the vendor outside the
            TransRentals platform.
          </p>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
              <span>
                Do not make any payment directly to the vendor before your vehicle/service has
                been officially handed over to you — this applies even if the vendor is a
                registered or verified TransRentals vendor
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
              <span>
                Do not make payments based on any WhatsApp message, phone call, personal UPI ID,
                bank account, payment link, or any other communication received outside the
                TransRentals platform
              </span>
            </div>
          </div>

          <details className="group mt-2.5">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-red-700 transition-colors hover:text-red-800 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
              <span className="group-open:hidden">Read the rest of this warning</span>
              <span className="hidden group-open:inline">Show less</span>
            </summary>

            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0 animate-pulse" />
                <span>
                  Attractive discounts, offers, urgent payment requests, or promises of booking
                  confirmation are not a reason to make a direct payment
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0 animate-pulse" />
                <span>For your safety, use the TransRentals platform and its chat for all vendor communication and payment-related matters</span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-100/60 px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-red-900">
                If you choose to make any payment directly to a vendor outside the TransRentals
                platform, TransRentals will not be responsible for any fraud, financial loss,
                refund, dispute, or other issue arising from that payment — even if the vendor is
                registered with TransRentals.
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 italic mt-3">
              Stay alert. A smooth vendor coordination process does not mean that any payment made
              before vehicle/service handover is authorized or protected by TransRentals.
            </p>
          </details>

          <p className="text-sm text-gray-700 mt-3">
            If a vendor asks for direct payment or tries to move the conversation outside
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
