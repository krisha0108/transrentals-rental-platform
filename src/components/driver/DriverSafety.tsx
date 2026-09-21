import { BadgeCheck, Headphones, LifeBuoy, MapPinned, ShieldCheck, UserCheck } from 'lucide-react';
import { Reveal } from '@/components/driver/Reveal';

/**
 * What protects the driver.
 *
 * Every other section sells the upside. The question a driver actually asks
 * before signing up is what happens when something goes wrong — an unknown
 * rider, a breakdown at night, a payment that does not arrive. This answers
 * that, which is why it sits just before the closing CTA.
 */

const GUARDS = [
  {
    Icon: UserCheck,
    title: 'Every rider is verified',
    body: 'Bookings come from customers with a verified phone number and account. You see the pickup, the drop and the trip type before you accept.',
  },
  {
    Icon: MapPinned,
    title: 'Live trip tracking',
    body: 'Your route is tracked for the whole trip, so support can find you instantly if anything goes wrong on the road.',
  },
  {
    Icon: LifeBuoy,
    title: 'SOS from the app',
    body: 'An emergency button in the driver app reaches our team and your emergency contact at the same time.',
  },
  {
    Icon: ShieldCheck,
    title: 'Payment protection',
    body: 'Fares are settled through the platform and paid into your bank weekly — never left to be argued about at the end of a trip.',
  },
  {
    Icon: Headphones,
    title: 'Support 7 days a week',
    body: 'Reach a real person by phone or WhatsApp, not a form. Breakdowns, disputes and document questions all go the same way.',
  },
  {
    Icon: BadgeCheck,
    title: 'Ratings that count',
    body: 'Consistent drivers get priority on the trips they want. One bad day does not undo a good record.',
  },
];

export function DriverSafety() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 py-16 md:py-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(#6EE7B7 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="container-custom relative">
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              You are not on your own
            </span>
            <h2 className="mt-4 text-3xl md:text-[2.5rem] font-black leading-[1.12] tracking-tight">
              Safety and support,<br />
              <span className="text-emerald-300">built in.</span>
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-emerald-100/75">
              Driving for a living means dealing with the days that do not go to plan.
              Here is what stands behind you when they happen.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {GUARDS.map(({ Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="group h-full rounded-2xl border-[1.5px] border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-400/30 hover:bg-white/[0.1]">
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 transition-colors duration-300 group-hover:bg-emerald-400/30">
                  <Icon className="h-5 w-5 text-emerald-300 transition-transform duration-500 group-hover:scale-110" />
                </span>
                <h3 className="text-[16px] font-bold leading-snug">{title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-emerald-100/70">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
