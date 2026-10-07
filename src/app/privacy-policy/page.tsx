import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  ShieldCheck,
  Lock,
  Shield,
  MessageCircle,
  Info,
} from 'lucide-react';

const HIGHLIGHTS = [
  {
    title: 'Data minimised',
    detail: 'We only collect what is required for identity verification, payment, trip safety, and rental logistics.',
    icon: ShieldCheck,
  },
  {
    title: 'Transparent sharing',
    detail: 'Only verified vendors/drivers, payment processors, and regulators see your details, and only when needed.',
    icon: Lock,
  },
  {
    title: 'Secure storage',
    detail: 'Access-controlled systems, encryption in transit, and periodic reviews keep your information safe.',
    icon: Shield,
  },
];

const TOC = [
  { id: 'info-we-collect', label: '1. Information we collect' },
  { id: 'how-we-use', label: '2. How we use it' },
  { id: 'cookies', label: '3. Cookies & tracking' },
  { id: 'sharing', label: '4. How we share it' },
  { id: 'security', label: '5. Data security' },
  { id: 'retention', label: '6. Data retention' },
  { id: 'your-rights', label: '7. Your rights & choices' },
  { id: 'children', label: '8. Children’s information' },
  { id: 'governing-law', label: '9. Governing law' },
  { id: 'changes', label: '10. Changes to this policy' },
  { id: 'contact', label: '11. Contact & grievance officer' },
];

const SECTIONS: { id: string; title: string; content: ReactNode }[] = [
  {
    id: 'info-we-collect',
    title: '1. Information We Collect',
    content: (
      <>
        <p>
          To run bike, self-drive car, chauffeur-driven car, bus, truck, packers &amp; movers, luxury, and equipment
          rental bookings safely, we collect the following from Customers, Vendors/Driver Partners, and visitors to
          the Platform (&ldquo;You&rdquo;).
        </p>

        <p className="font-semibold text-slate-800">a. Information you provide</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-slate-800">Identity &amp; contact:</span> full name, phone number, email, photo, and address.</li>
          <li><span className="font-medium text-slate-800">Government ID / KYC:</span> Aadhaar, Driving Licence, or another government ID, where a booking or vendor onboarding requires it.</li>
          <li><span className="font-medium text-slate-800">Vendor/driver documents (Vendors only):</span> vehicle Registration Certificate, insurance, PUC certificate, and applicable permits.</li>
          <li><span className="font-medium text-slate-800">Financial &amp; payment data:</span> bank/UPI details and card details are collected and processed directly by our payment partner; we store the resulting transaction history, not your raw card details.</li>
          <li><span className="font-medium text-slate-800">Business data (B2B/corporate customers):</span> company name, GST details, and authorised-signatory contact information.</li>
        </ul>

        <p className="font-semibold text-slate-800">b. Information collected automatically</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Device and app usage data: device type, operating system, IP address, browser type, and crash logs.</li>
          <li>Cookies and analytics tools (see <a href="#cookies" className="text-primary underline underline-offset-2">Section 3</a>) that record how the Platform is used.</li>
          <li>Platform navigation: pages viewed, search terms, and referral links, to improve the booking flow.</li>
        </ul>

        <p className="font-semibold text-slate-800">c. Location &amp; trip tracking</p>
        <p>
          For self-drive and chauffeur-driven bookings, we may collect trip-related location data — pickup/drop
          coordinates, and live location during an active trip — to support route verification, delay/safety alerts,
          and dispute resolution. This is collected only for the duration of an active trip and only with the
          permission you grant on your device; you can withdraw it at any time from your device&rsquo;s location
          settings, though this may limit features that depend on it (such as live trip tracking).
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    content: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><span className="font-medium text-slate-800">Booking &amp; service fulfilment:</span> confirming bookings, processing payments and refunds, and sharing invoices.</li>
        <li><span className="font-medium text-slate-800">Communication:</span> sending booking updates, OTPs, and support responses via SMS, WhatsApp, email, or push notification.</li>
        <li><span className="font-medium text-slate-800">Vendor/driver vetting:</span> verifying documents and monitoring compliance with our onboarding policies.</li>
        <li><span className="font-medium text-slate-800">Safety &amp; trip monitoring:</span> live tracking during active trips, and responding to delays, breakdowns, or accidents.</li>
        <li><span className="font-medium text-slate-800">Marketing &amp; personalisation:</span> promotional offers and recommendations, which you can opt out of at any time (see <a href="#your-rights" className="text-primary underline underline-offset-2">Section 7</a>).</li>
        <li><span className="font-medium text-slate-800">Security &amp; fraud prevention:</span> detecting suspicious account activity, repeat cancellations, or payment fraud.</li>
        <li><span className="font-medium text-slate-800">Legal &amp; regulatory compliance:</span> responding to lawful requests from authorities and meeting tax/audit obligations.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: '3. Cookies & Tracking Technologies',
    content: (
      <>
        <p>
          We use cookies and analytics tools, including Google Analytics, for session management and to understand
          how the Platform is used.
        </p>
        <p>
          You can manage cookies through your browser settings at any time. Disabling non-essential cookies will not
          affect booking, payment, or security functions, but may reduce how personalised the Platform feels. For a
          broader opt-out request, write to us at the contact in <a href="#contact" className="text-primary underline underline-offset-2">Section 11</a>.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: '4. How We Share Your Information',
    content: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-medium text-slate-800">Service providers:</span> our payment partner (Razorpay) for processing payments, our messaging provider (WhatsApp Business Cloud API) and SMS/email providers for booking communication, and analytics providers (Google Analytics) for usage insights.</li>
          <li><span className="font-medium text-slate-800">Hosting &amp; infrastructure:</span> Linode.</li>
          <li><span className="font-medium text-slate-800">Vendors &amp; drivers:</span> only the booking details needed to fulfil your trip (name, phone number, pickup/drop, and, during an active trip, live location where applicable).</li>
          <li><span className="font-medium text-slate-800">Legal compliance:</span> when required by law, a government request, or a court order.</li>
          <li><span className="font-medium text-slate-800">Business transfers:</span> in the event of a merger, acquisition, or sale of assets, with notice to you.</li>
        </ul>
        <p className="font-semibold text-slate-800">We do not sell your personal data to any third party.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: '5. Data Security',
    content: (
      <p>
        We protect your information with encryption in transit (HTTPS/TLS), access-controlled systems, and periodic
        reviews of how data is collected and stored. Payment details are handled through our payment partner&rsquo;s
        PCI-DSS&ndash;compliant systems — we do not store full card numbers ourselves. No system is completely risk-free;
        we are not liable for a breach caused by a third party&rsquo;s systems unless it results from our own gross
        negligence.
      </p>
    ),
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: (
      <>
        <p>
          We retain personal data for as long as your account remains active on the Platform, with no fixed
          deletion schedule, except where lost due to a technical or server issue beyond our reasonable control:
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Data type</th>
                <th className="px-4 py-2.5">Retention period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Booking &amp; trip data (incl. location)</td>
                <td className="px-4 py-2.5">Retained for the lifetime of your account</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">KYC / identity documents</td>
                <td className="px-4 py-2.5">Retained for the lifetime of your account</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Payment &amp; financial records</td>
                <td className="px-4 py-2.5">Retained for the lifetime of your account</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">Support &amp; communication logs</td>
                <td className="px-4 py-2.5">Retained for the lifetime of your account</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We may retain data for longer where required by law, or where it relates to an active dispute or
          investigation.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '7. Your Rights & Choices',
    content: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><span className="font-medium text-slate-800">Access:</span> request a copy of your profile or booking history by emailing us.</li>
        <li><span className="font-medium text-slate-800">Correction:</span> ask us to fix outdated or inaccurate data.</li>
        <li><span className="font-medium text-slate-800">Withdraw consent:</span> e.g. for location access, by changing your device permissions at any time.</li>
        <li>
          <span className="font-medium text-slate-800">Deletion:</span> request deletion of your data by emailing
          us at the contact in <a href="#contact" className="text-primary underline underline-offset-2">Section 11</a>. There is currently no in-app self-service deletion option — every request is handled manually by our team.
        </li>
        <li><span className="font-medium text-slate-800">Marketing opt-out:</span> unsubscribe from promotional messages at any time; essential booking and security communication will continue.</li>
        <li><span className="font-medium text-slate-800">Grievance:</span> raise a concern with our Grievance Officer (see <a href="#contact" className="text-primary underline underline-offset-2">Section 11</a>).</li>
      </ul>
    ),
  },
  {
    id: 'children',
    title: '8. Children’s Information',
    content: (
      <p>
        TransRentals is not intended for individuals under the age of 18, and we do not knowingly collect personal
        data from them without a parent or legal guardian&rsquo;s consent. If you believe a minor has shared personal
        data with us without such consent, please contact our Grievance Officer so we can remove it.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: '9. Governing Law',
    content: (
      <p>
        This Policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023 and
        the Information Technology Act, 2000. TransRentals currently offers its services within India, and your data
        is processed and stored in India.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: (
      <p>
        We may update this Policy from time to time to reflect changes in law or in how we handle data. We will
        update the &ldquo;Last updated&rdquo; date above when we do, and call out material changes prominently on this page.
        Continuing to use TransRentals after an update means you accept the revised Policy.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '11. Contact & Grievance Officer',
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Grievance officer</p>
          <p className="mt-1 text-slate-800">Sauravsingh Tomar, Authorised Signatory</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Email</p>
          <p className="mt-1 text-slate-800">book@transrentals.in</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Phone</p>
          <p className="mt-1 text-slate-800">+91 98981 45548</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Registered office</p>
          <p className="mt-1 text-slate-800">Shakti Dhar Complex, 2nd Floor, Bapunagar, Ahmedabad, Gujarat - 382350</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Response time</p>
          <p className="mt-1 text-slate-800">Within 48 hours</p>
        </div>
      </div>
    ),
  },
];

export const metadata: Metadata = {
  title: 'Privacy Policy | TransRentals',
  description:
    'How TransRentals collects, uses, shares, and protects the information of customers and vendor/driver partners booking bikes, cars, buses, trucks, and equipment across 500+ Indian cities.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom space-y-10">
        <section className="rounded-[36px] mt-3 border border-white bg-gradient-to-br via-white to-white p-6 md:p-6 shadow-[0_35px_80px_rgba(15,23,42,0.12)]">
          <p className="text-lg font-semibold uppercase tracking-[0.4em] text-primary">
            Privacy Policy
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Your privacy, safeguarded
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
            This Policy explains how Seben Transportation Solutions Private Limited{' '}
            (&ldquo;TransRentals&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, shares, and safeguards your
            personal data when you use our website, mobile apps, and other digital interfaces (&ldquo;Platform&rdquo;)
            as a Customer, Vendor/Driver Partner, or Visitor, across 500+ Indian cities. By using the Platform, you
            agree to this Policy along with our Terms &amp; Conditions.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Last updated: 6 October 2026
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              500+ Cities
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold">
              Services offered within India
            </span>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </section>

        {/* ── jump-to-section index — the page below reads as a real legal
             document, not just highlight cards, so this keeps it navigable ── */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <Info className="h-4 w-4" /> On this page
          </p>
          <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-slate-600 underline-offset-2 hover:text-primary hover:underline"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          {SECTIONS.map((s) => (
            <article
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{s.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">{s.content}</div>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-primary/40 bg-gradient-to-br from-primary/5 to-white p-6 text-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Need help with your data?</p>
              <p className="text-sm text-slate-600">Email book@transrentals.in</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            Our team answers privacy requests within 48 hours and shares clear next steps.
          </p>
        </section>
      </div>
    </div>
  );
}
