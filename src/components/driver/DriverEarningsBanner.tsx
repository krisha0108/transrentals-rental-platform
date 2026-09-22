import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Wallet, Zap, TrendingUp } from 'lucide-react';

/**
 * The "how much can you earn" banner.
 *
 * Deliberately quotes no figure: what a driver takes home depends on their
 * city, trip count and vehicle, and a number printed here would read as a
 * promise the platform cannot keep. The section sells the shape of the
 * earnings — steady, weekly, on your own hours — and sends them to register.
 *
 * The movement is all CSS so this stays a server component, and every
 * animation is dropped for anyone who asked their OS to reduce motion.
 */

const PERKS = [
  { Icon: Clock, label: 'Flexible Hours' },
  { Icon: MapPin, label: '500+ Cities' },
  { Icon: Zap, label: 'Daily Trips' },
  { Icon: Wallet, label: 'Weekly Payouts' },
];

export function DriverEarningsBanner() {
  return (
    <section className="py-16 bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes drv-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes drv-slide-in {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes drv-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes drv-halo {
          0%, 100% { opacity: .45; transform: scale(1); }
          50%      { opacity: .85; transform: scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .drv-motion { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `,
        }}
      />

      <div className="container-custom max-w-5xl">
        <div
          className="drv-motion group relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl border-[1.5px] border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-lg transition-shadow duration-500 hover:shadow-xl md:flex-row md:p-10"
          style={{ animation: 'drv-rise .7s cubic-bezier(.22,1,.36,1) both' }}
        >
          {/* drifting dot texture, so the panel is not a flat wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.45]"
            style={{
              backgroundImage: 'radial-gradient(#A7F3D0 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage:
                'radial-gradient(320px 220px at 8% 12%, #000 0%, transparent 70%), radial-gradient(320px 220px at 92% 88%, #000 0%, transparent 70%)',
              maskImage:
                'radial-gradient(320px 220px at 8% 12%, #000 0%, transparent 70%), radial-gradient(320px 220px at 92% 88%, #000 0%, transparent 70%)',
            }}
          />

          {/* icon */}
          <div className="relative flex-shrink-0">
            <span
              aria-hidden
              className="drv-motion absolute inset-0 rounded-2xl bg-emerald-400/40 blur-xl"
              style={{ animation: 'drv-halo 3.4s ease-in-out infinite' }}
            />
            <div
              className="drv-motion relative grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg transition-transform duration-500 group-hover:scale-105"
              style={{ animation: 'drv-bob 4.5s ease-in-out infinite' }}
            >
              <Wallet className="h-9 w-9 text-white" />
            </div>
          </div>

          {/* copy */}
          <div className="relative flex-1 text-center md:text-left">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              Earning Potential
            </span>

            <h2 className="mb-3 text-2xl md:text-3xl font-bold text-gray-900">
              How Much Can You Earn?
            </h2>

            <p className="mb-6 max-w-2xl text-sm md:text-base leading-relaxed text-gray-500">
              Drive full-time for a steady monthly income, or part-time around your own
              schedule — you decide. What you take home depends on your city, how many trips
              you accept and the vehicle you drive, and it lands in your bank every week.
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/driver/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg"
              >
                Start Earning Today
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/driver/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Already a Driver? Login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* perks — stagger in, then breathe */}
          <div className="relative hidden flex-shrink-0 flex-col gap-3 lg:flex">
            {PERKS.map(({ Icon, label }, i) => (
              <div
                key={label}
                className="drv-motion flex items-center gap-2 rounded-lg border-[1.5px] border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-emerald-300 hover:shadow-md"
                style={{ animation: `drv-slide-in .6s cubic-bezier(.22,1,.36,1) ${300 + i * 110}ms both` }}
              >
                <Icon className="h-4 w-4 text-emerald-600" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
