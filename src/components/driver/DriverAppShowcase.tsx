import {
  CheckCircle,
  Star,
} from 'lucide-react';
import { DRIVER_APP_ANDROID_LINK } from '@/lib/contact';
import { DriverPhoneFrame } from '@/components/driver/DriverPhoneFrame';

/**
 * The driver app section: the real app screen in a real device frame, and one
 * button that installs it.
 *
 * The screen is drawn rather than screenshotted so it stays sharp at any size
 * and never goes stale when the app ships a new build. It mirrors the actual
 * driver home screen — greeting, employer chip, month-to-date card, quick
 * actions, available bookings — so what a driver sees here is what they get.
 */

const FEATURES = [
  'Instant trip notifications with route details',
  'Live earnings tracker & trip history',
  'Turn-by-turn navigation for every trip',
  'Add & manage your vehicle fleet',
  'Vehicle fuel & maintenance log',
  'Weekly payout to your bank account',
  'In-app support & help center',
  'Performance ratings & badges',
];

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      {/* The four faces of the Play mark, split out of the single-path version
          so each one carries its own brand colour. */}
      <path fill="#34A853" d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
      <path
        fill="#4285F4"
        d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5Z"
      />
      <path
        fill="#FBBC04"
        d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81Z"
      />
      <path fill="#EA4335" d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12Z" />
    </svg>
  );
}

export function DriverAppShowcase() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 py-16 md:py-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="container-custom relative">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <DriverPhoneFrame />
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              The driver app
            </span>

            <h2 className="mt-4 text-3xl md:text-[2.6rem] md:leading-[1.1] font-black tracking-tight">
              Everything in one<br />
              <span className="text-emerald-300">driver app.</span>
            </h2>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-emerald-100/80">
              Go online, accept the trips you want, follow the route, and watch your earnings
              add up — all from your phone. Payouts land in your bank every week.
            </p>

            <ul className="mt-7 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckCircle className="mt-0.5 h-[17px] w-[17px] shrink-0 text-emerald-300" />
                  <span className="text-[13.5px] leading-relaxed text-emerald-50/90">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={DRIVER_APP_ANDROID_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group/play inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-gray-900 shadow-lg shadow-emerald-950/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-950/40"
              >
                <GooglePlayIcon className="h-7 w-7 transition-transform duration-300 group-hover/play:scale-110" />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wide text-gray-500">
                    Get it on
                  </span>
                  <span className="block text-[15px] font-bold">Google Play</span>
                </span>
              </a>

              <div className="flex items-center gap-2 text-emerald-100/80">
                <span className="flex" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
                <span className="text-[13px] font-semibold">Free · Android</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
