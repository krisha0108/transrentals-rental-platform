import type { Metadata } from 'next';
import { FileCheck2, IndianRupee, AlertTriangle, Scale, CalendarClock } from 'lucide-react';
import {
  AGREEMENT_SECTIONS, AGREEMENT_TITLE, AGREEMENT_SUBTITLE, AGREEMENT_DISCLAIMER,
  AGREEMENT_PARTIES, COVERAGE_HIGHLIGHTS, AGREEMENT_TERM,
} from '@/lib/content/partnership-agreement';

export const metadata: Metadata = {
  title: 'Vendor Partnership Agreement | TransRentals',
  description: AGREEMENT_SUBTITLE,
  robots: { index: false, follow: false },
};

const KEY_TERM_ICONS = [FileCheck2, IndianRupee, AlertTriangle, Scale];
const KEY_TERMS = COVERAGE_HIGHLIGHTS.map((term, i) => ({ ...term, icon: KEY_TERM_ICONS[i] }));

export default function PartnershipAgreementPage() {
  return (
    <div className="bg-slate-50 py-12 md:py-16">
      <div className="container-custom max-w-4xl space-y-10">
        {/* Header */}
        <header className="rounded-[36px] border border-white bg-gradient-to-br from-primary/5 via-white to-white p-8 shadow-[0_30px_70px_rgba(15,23,42,0.15)] md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">
            Vendor Agreement
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            {AGREEMENT_TITLE}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {AGREEMENT_SUBTITLE}
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Important:</strong> {AGREEMENT_DISCLAIMER}
          </div>
        </header>

        {/* Coverage highlights */}
        <section>
          <div className="mb-4 text-sm uppercase tracking-[0.4em] text-slate-400">
            What this agreement covers
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {KEY_TERMS.map((term) => (
              <div
                key={term.label}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-500">
                  <term.icon className="h-4 w-4 text-primary" />
                  {term.label}
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">{term.value}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{term.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Exact revenue share, fees, and payment cycle are set out in the vendor dashboard and
            booking confirmation, per Section 5 below — not fixed in this document.
          </p>
        </section>

        {/* Agreement term — added as an operational note, kept separate from the reviewed clause text below */}
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <CalendarClock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agreement Term</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{AGREEMENT_TERM}</p>
          </div>
        </div>

        {/* Formal contract body */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="space-y-8 text-sm leading-relaxed text-slate-700 font-serif">

            <div>
              <p>{AGREEMENT_PARTIES.intro}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>{AGREEMENT_PARTIES.transrentals}</li>
                <li>{AGREEMENT_PARTIES.vendor}</li>
              </ol>
              <p className="mt-3">{AGREEMENT_PARTIES.closing}</p>
            </div>

            {AGREEMENT_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
                {section.paras.map((p, i) => (
                  <p key={i} className="mt-2">{p}</p>
                ))}
              </div>
            ))}

            {/* Signatures */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-base font-bold text-slate-900">Signatures</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    For TransRentals
                  </p>
                  <div className="space-y-3 text-sm">
                    <p>Name: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Designation: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Signature: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Date: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    For the Vendor
                  </p>
                  <div className="space-y-3 text-sm">
                    <p>Vendor/Business Name: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Authorized Person: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Designation: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Signature: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                    <p>Date: <span className="inline-block w-40 border-b border-slate-300">&nbsp;</span></p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          This document is a starting draft prepared for TransRentals and has not been reviewed by a
          lawyer. Have it checked by legal counsel before sending it out for signature.
        </p>
      </div>
    </div>
  );
}
