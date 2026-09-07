'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FileText, CheckCircle, Loader2, IndianRupee, FileCheck2, AlertTriangle, Scale,
  PenLine, Download, Info, CalendarClock, MessageSquare, Clock, XCircle, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AGREEMENT_SECTIONS, AGREEMENT_VERSION, AGREEMENT_TITLE, AGREEMENT_SUBTITLE,
  AGREEMENT_DISCLAIMER, AGREEMENT_PARTIES, COVERAGE_HIGHLIGHTS,
  TERM_OPTIONS_MONTHS, DEFAULT_TERM_MONTHS, termDescription,
} from '@/lib/content/partnership-agreement';

const KEY_TERM_ICONS = [FileCheck2, IndianRupee, AlertTriangle, Scale];
const KEY_TERM_ACCENTS = [
  { chip: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
  { chip: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
  { chip: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
  { chip: 'bg-teal-50 text-teal-600', ring: 'ring-teal-100' },
];

const slugify = (title: string) => `section-${title.split('.')[0].trim()}`;

const DESIGNATION_OPTIONS = ['Owner', 'Manager', 'Director', 'Partner', 'Authorized Signatory', 'Other'];

interface SignedAgreement {
  signedByName: string;
  signedByTitle: string | null;
  queryNote: string | null;
  termMonths: number;
  acceptedAt: string;
  agreementVersion: string;
  // Filled in once a manager has looked at the signature.
  reviewStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export default function VendorPartnershipAgreementPage() {
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [agreement, setAgreement] = useState<SignedAgreement | null>(null);
  // A manager can send a signature back; the vendor then signs again, so the
  // rejected record is kept around just to show them why.
  const [rejected, setRejected] = useState<SignedAgreement | null>(null);

  const [signedByName, setSignedByName] = useState('');
  const [designationChoice, setDesignationChoice] = useState('');
  const [customDesignation, setCustomDesignation] = useState('');
  const signedByTitle = designationChoice === 'Other' ? customDesignation : designationChoice;
  const [queryNote, setQueryNote] = useState('');
  const [termMonths, setTermMonths] = useState<number>(DEFAULT_TERM_MONTHS);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/vendor/partnership-agreement');
      const data = await res.json();
      setSigned(!!data.signed);
      setAgreement(data.agreement || null);
      setRejected(data.agreement?.reviewStatus === 'REJECTED' ? data.agreement : null);
    } catch {
      setError('Failed to load agreement status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSign = async () => {
    setError(null);
    if (!agreed) {
      setError('Please confirm you have read and agree to the terms above');
      return;
    }
    if (!signedByName.trim() || signedByName.trim().length < 2) {
      setError('Please type your full name to sign');
      return;
    }
    if (!designationChoice) {
      setError('Please select your designation');
      return;
    }
    if (designationChoice === 'Other' && !customDesignation.trim()) {
      setError('Please type your designation');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/partnership-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreed: true,
          signedByName: signedByName.trim(),
          signedByTitle: signedByTitle.trim(),
          queryNote: queryNote.trim(),
          termMonths,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSigned(true);
        setAgreement(data.agreement);
        setRejected(null);
      } else {
        setError(data.error || 'Failed to sign agreement');
      }
    } catch {
      setError('Failed to sign agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-200/50">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-snug">{AGREEMENT_TITLE}</h1>
              <p className="text-sm text-white/80">{AGREEMENT_SUBTITLE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-semibold">
              Agreement {AGREEMENT_VERSION}
            </span>
            <a
              href="/api/vendor/partnership-agreement/pdf"
              className="print:hidden inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* Legal-review disclaimer — carried over verbatim from the source draft */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> {AGREEMENT_DISCLAIMER}
        </p>
      </div>

      {/* Signed status */}
      {signed && agreement && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-200">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-emerald-900">
                    Signed by {agreement.signedByName}
                    {agreement.signedByTitle ? `, ${agreement.signedByTitle}` : ''}
                  </p>
                  {agreement.reviewStatus === 'ACCEPTED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      <CheckCircle className="w-3 h-3" /> Accepted by TransRentals
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                      <Clock className="w-3 h-3" /> Awaiting TransRentals review
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-700">
                  {new Date(agreement.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' · '}Agreement {agreement.agreementVersion}
                  {' · '}{agreement.termMonths}-month term
                </p>
              </div>
            </div>
            <p
              className="hidden sm:block flex-shrink-0 text-2xl text-emerald-700/80 pr-2"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Apple Chancery', cursive" }}
            >
              {agreement.signedByName}
            </p>
          </div>
          {agreement.reviewStatus === 'ACCEPTED' && agreement.reviewedAt && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-emerald-700">
                Accepted on {new Date(agreement.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                {agreement.reviewNote ? ` — ${agreement.reviewNote}` : ''}
              </p>
              <a
                href="/api/vendor/partnership-agreement/certificate"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                Download Certificate
              </a>
            </div>
          )}
          {agreement.reviewStatus !== 'ACCEPTED' && (
            <p className="mt-3 text-sm text-emerald-700/80">
              Your signature has been sent to the TransRentals team. You&apos;ll see it marked accepted here once a manager reviews it.
            </p>
          )}
          {agreement.queryNote && (
            <div className="mt-4 pt-4 border-t border-emerald-200/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Your query, sent to TransRentals</p>
              <p className="mt-1 text-sm text-emerald-800">{agreement.queryNote}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
          {/* Coverage highlights — topic summaries, not fixed commercial figures (the agreement itself leaves those to the dashboard/booking terms) */}
          <div className="grid gap-4 sm:grid-cols-2">
            {COVERAGE_HIGHLIGHTS.map((term, i) => {
              const Icon = KEY_TERM_ICONS[i];
              const accent = KEY_TERM_ACCENTS[i];
              return (
                <div key={term.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className={cn('inline-flex w-9 h-9 items-center justify-center rounded-xl ring-4', accent.chip, accent.ring)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{term.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{term.value}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{term.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Contract body — styled as a letterhead document, with a faint brand watermark behind the text */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100">
            {/* Watermark */}
            <div className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
              <Image
                src="/assets/logo-trans.png"
                alt=""
                width={640}
                height={128}
                aria-hidden
                className="opacity-[0.05] -rotate-12 w-[640px] h-auto max-w-none"
              />
            </div>

            {/* Letterhead */}
            <div className="relative z-10 px-6 sm:px-8 pt-7 pb-5 border-b-2 border-gray-900/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <Image
                  src="/assets/logo-trans.png"
                  alt="TransRentals"
                  width={168}
                  height={34}
                  className="h-8 w-auto object-contain"
                />
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Official Vendor Agreement</p>
                  <p className="text-xs text-gray-400 mt-0.5">Version {AGREEMENT_VERSION}</p>
                </div>
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900 tracking-tight">{AGREEMENT_TITLE}</h2>
            </div>

            <div className="relative z-10 px-6 sm:px-8 py-6 max-w-3xl font-serif">
              <p className="text-[14.5px] leading-[1.7] text-gray-600">{AGREEMENT_PARTIES.intro}</p>
              <ol className="mt-2.5 list-decimal space-y-2 pl-5 text-[14.5px] leading-[1.7] text-gray-600">
                <li>{AGREEMENT_PARTIES.transrentals}</li>
                <li>{AGREEMENT_PARTIES.vendor}</li>
              </ol>
              <p className="mt-2.5 text-[14.5px] leading-[1.7] text-gray-600">{AGREEMENT_PARTIES.closing}</p>
            </div>
            <div className="relative z-10 px-6 sm:px-8 pb-2 max-w-3xl font-serif">
              {AGREEMENT_SECTIONS.map((section) => (
                <div
                  key={section.title}
                  id={slugify(section.title)}
                  className="scroll-mt-6 py-5 border-t border-gray-100 first:border-t-0 first:pt-4"
                >
                  <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">{section.title}</h3>
                  <div className="mt-2 space-y-2 text-[14.5px] leading-[1.7] text-gray-600">
                    {section.paras.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign form */}
          <div id="sign" className="scroll-mt-6 print:hidden">
            {rejected && !signed && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-rose-900">TransRentals sent your signature back</p>
                    {rejected.reviewNote && <p className="mt-1 text-sm text-rose-800">{rejected.reviewNote}</p>}
                    <p className="mt-1.5 text-xs text-rose-600">
                      Signed {new Date(rejected.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {rejected.reviewedAt
                        ? ` · reviewed ${new Date(rejected.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
                        : ''}
                      {' · '}Please sign again below.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!signed ? (
              <div className="rounded-2xl border-2 border-emerald-200 bg-white shadow-md shadow-emerald-100/30 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center gap-2.5">
                  <PenLine className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-gray-900">Sign this Agreement</h2>
                </div>
                <div className="px-6 py-5 space-y-4 max-w-2xl">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Agreement Term
                    </p>
                    <div className="mt-2 flex gap-2">
                      {TERM_OPTIONS_MONTHS.map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setTermMonths(months)}
                          className={cn(
                            'px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors',
                            termMonths === months
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                          )}
                        >
                          {months} Months
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{termDescription(termMonths)}</p>
                  </div>

                  <label className="flex items-start gap-2.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    I have read and agree to the Vendor Partnership, Service &amp; Settlement Agreement above.
                  </label>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name (your e-signature) *</label>
                      <input
                        type="text"
                        value={signedByName}
                        onChange={(e) => setSignedByName(e.target.value)}
                        placeholder="Type your full legal name"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation *</label>
                      <select
                        value={designationChoice}
                        onChange={(e) => setDesignationChoice(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                      >
                        <option value="">Select designation</option>
                        {DESIGNATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {designationChoice === 'Other' && (
                        <input
                          type="text"
                          value={customDesignation}
                          onChange={(e) => setCustomDesignation(e.target.value)}
                          placeholder="Type your designation"
                          className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      Have a question about this agreement? (optional)
                    </label>
                    <textarea
                      value={queryNote}
                      onChange={(e) => setQueryNote(e.target.value)}
                      placeholder="e.g. Can you clarify the settlement cycle for my category?"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">This is sent to TransRentals along with your signature and shown on your account.</p>
                  </div>

                  {signedByName.trim() && (
                    <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Signature preview</p>
                      <p
                        className="mt-1 text-3xl text-emerald-700"
                        style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Apple Chancery', cursive" }}
                      >
                        {signedByName}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                  )}

                  <Button
                    onClick={handleSign}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Sign Agreement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
                You&apos;ve already signed this agreement — see the confirmation above.
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
