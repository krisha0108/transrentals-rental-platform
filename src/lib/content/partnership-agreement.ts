// Shared content for the TransRentals Vendor Partnership, Service &
// Settlement Agreement — used by both the public draft page
// (/partnership-agreement) and the vendor-dashboard e-signature page
// (/vendor/partnership-agreement), and by the vendor-signing API route.
//
// Sourced from the reviewed draft
// "TransRentals-Vendor-Partnership-Service-Settlement-Agreement.pdf".
// Bump AGREEMENT_VERSION whenever the clauses below change materially;
// vendors who signed an older version will show as unsigned again and be
// prompted to re-sign.

export const AGREEMENT_VERSION = 'v3';

export const AGREEMENT_TITLE = 'TransRentals Vendor Partnership, Service & Settlement Agreement';
export const AGREEMENT_SUBTITLE =
  'Draft agreement for vendor onboarding, service performance, revenue sharing and financial settlement.';

export const AGREEMENT_DISCLAIMER =
  'This is a commercial draft prepared for operational use and should be reviewed and finalized by qualified legal counsel before execution.';

// The source draft intentionally leaves the agreement's term/renewal open
// (Section 10 covers suspension/termination but not an initial duration).
// This term was added on request and is shown as an operational note next
// to the sign form — not inserted into the numbered legal clauses above —
// so it stays visibly separate from the reviewed draft text. Confirm this
// with legal counsel along with the rest of the agreement.
export const AGREEMENT_TERM =
  'This Agreement is valid for 12 months from the date of signing and renews automatically for successive 12-month periods, unless suspended or terminated earlier under Section 10 (Suspension & Termination).';

// Vendor-selectable term lengths at signing time (default 12).
export const TERM_OPTIONS_MONTHS = [3, 6, 12] as const;
export const DEFAULT_TERM_MONTHS = 12;

export function termDescription(months: number): string {
  return `This Agreement is valid for ${months} month${months === 1 ? '' : 's'} from the date of signing and renews automatically for successive ${months}-month periods, unless suspended or terminated earlier under Section 10 (Suspension & Termination).`;
}

// Quick-glance topic tiles. The agreement deliberately leaves exact revenue
// share / payment-cycle numbers to the vendor dashboard and booking
// confirmation rather than fixing them here — so these are coverage
// summaries, not commercial figures, to avoid stating a number the
// agreement itself doesn't commit to.
export const COVERAGE_HIGHLIGHTS = [
  {
    label: 'Onboarding & Documents',
    value: 'Verification required',
    detail: 'PAN/Aadhaar, GST, bank proof, vehicle RC, insurance and permits are verified before approval.',
  },
  {
    label: 'Payments & Settlement',
    value: 'Per your dashboard terms',
    detail: 'Revenue share, fees and payment cycle are communicated via the vendor dashboard and booking confirmation.',
  },
  {
    label: 'Suspension & Termination',
    value: 'For cause, with notice',
    detail: 'Document/fraud concerns, safety issues or material breach can trigger suspension or termination.',
  },
  {
    label: 'Dispute Resolution',
    value: 'Good-faith first',
    detail: 'Disputes are first discussed in good faith, then arbitration/lawful process under Indian law.',
  },
];

export const AGREEMENT_PARTIES = {
  intro: 'This Vendor Partnership, Service & Settlement Agreement (the "Agreement") is made on [Effective Date] between:',
  transrentals:
    'TransRentals: [Legal Entity Name], having its registered office at [Registered Address], CIN [CIN Number], hereinafter referred to as "TransRentals" or the "Company"; and',
  vendor:
    'Vendor: [Vendor Legal/Business Name], having its business address at [Vendor Address], hereinafter referred to as the "Vendor".',
  closing: 'TransRentals and the Vendor are individually a "Party" and together the "Parties".',
};

export const AGREEMENT_SECTIONS: { title: string; paras: string[] }[] = [
  {
    title: '1. Purpose & Vendor Onboarding',
    paras: [
      '1.1 The Vendor wishes to list and provide vehicle rental, transport or related services through the TransRentals platform.',
      '1.2 Registration does not guarantee approval. TransRentals may approve, reject, suspend or request additional information from any Vendor at its reasonable discretion.',
      '1.3 The Vendor shall provide accurate business, contact, bank, vehicle and service information at all times and promptly update any material change.',
    ],
  },
  {
    title: '2. Documents & Verification',
    paras: [
      '2.1 The Vendor shall provide all documents requested by TransRentals, including, where applicable: PAN, Aadhaar or other identity documents, GST registration, business registration documents, bank proof, cancelled cheque, vehicle RC, insurance, permits, fitness certificates and other regulatory documents.',
      '2.2 The Vendor represents that all submitted documents are genuine, valid, current and lawfully obtained.',
      '2.3 TransRentals may independently verify documents and may require originals, updated copies or additional verification.',
      '2.4 Submission of false, forged, expired or misleading documents may result in immediate suspension, withholding of settlement pending investigation, termination and other lawful action.',
    ],
  },
  {
    title: '3. Vendor Service Responsibilities',
    paras: [
      '3.1 The Vendor is responsible for the vehicles, drivers, permits, insurance, maintenance, cleanliness, legal compliance and safe delivery of services supplied by the Vendor.',
      '3.2 The Vendor shall provide the vehicle/service confirmed for the booking, or a suitable equivalent approved by the customer and TransRentals where required.',
      '3.3 The Vendor shall ensure timely reporting, professional conduct and compliance with applicable transport, consumer and safety laws.',
    ],
  },
  {
    title: '4. Bookings, Acceptance & Non-Performance',
    paras: [
      '4.1 The Vendor shall respond to booking requests within the operational time specified by TransRentals.',
      '4.2 Once a booking is accepted or confirmed, the Vendor shall perform the booking according to the confirmed terms.',
      '4.3 Non-performance includes, without limitation: failure to provide a vehicle or driver, unjustified cancellation, significant delay, wrong vehicle, unsafe vehicle, refusal of confirmed service, material service deficiency or misleading information.',
      '4.4 Repeated non-performance or poor service may result in warning, temporary suspension, reduced booking visibility, recovery of customer compensation or other legitimate costs where contractually applicable, or termination.',
    ],
  },
  {
    title: '5. Pricing, Revenue Sharing & Platform Fees',
    paras: [
      '5.1 Revenue sharing, commission, service fee or platform fee applicable to a booking shall be communicated through the applicable commercial terms, vendor dashboard, booking confirmation or written agreement between the Parties.',
      '5.2 Unless otherwise agreed in writing, the Vendor shall not demand a higher amount from a customer than the confirmed booking terms, except for properly disclosed and authorized extra charges.',
      '5.3 Taxes, GST, TDS and other statutory deductions shall be handled according to applicable law and the commercial arrangement between the Parties.',
      '5.4 TransRentals may maintain booking and settlement records for calculating amounts payable to the Vendor.',
    ],
  },
  {
    title: '6. Payment & Fund Settlement',
    paras: [
      '6.1 Settlement shall be made according to the payment cycle communicated or agreed with the Vendor.',
      '6.2 Settlement amounts may be adjusted for applicable platform fees, refunds, cancellations, chargebacks, taxes, TDS, agreed customer compensation, duplicate payments, fraud investigations or other legitimate booking-related adjustments.',
      '6.3 The Vendor shall provide correct bank account details. TransRentals shall not be responsible for delays caused by incorrect or incomplete bank information provided by the Vendor.',
      '6.4 The Vendor should raise settlement discrepancies within the reasonable review period communicated by TransRentals, along with supporting booking details.',
    ],
  },
  {
    title: '7. Cancellations, Refunds & Disputes',
    paras: [
      '7.1 Customer cancellations and refunds shall be handled according to the applicable booking terms and policies.',
      '7.2 Where a Vendor-caused failure results in a customer refund or compensation, TransRentals may review the circumstances and adjust the Vendor settlement where permitted under the agreed commercial terms.',
      '7.3 The Parties shall cooperate in resolving customer complaints, payment disputes and booking disputes and provide reasonable supporting information when requested.',
    ],
  },
  {
    title: '8. Customer Data & Platform Protection',
    paras: [
      '8.1 Customer contact details and booking information shall be used only for fulfilling the relevant booking and legitimate operational purposes.',
      '8.2 The Vendor shall not misuse customer data, engage in fraudulent activity or make unauthorized representations on behalf of TransRentals.',
      '8.3 Any platform bypass, direct solicitation or other conduct intended to improperly avoid agreed platform fees may be investigated and addressed under applicable commercial terms and law.',
    ],
  },
  {
    title: '9. Performance Review & Business Meetings',
    paras: [
      '9.1 The Parties may conduct monthly performance reviews covering booking acceptance, fulfilment, cancellations, delays, customer feedback, complaints, document compliance and settlement issues.',
      '9.2 The Parties may conduct an annual business review to discuss performance, growth opportunities, commercial terms, service quality and future collaboration.',
      '9.3 The Vendor shall reasonably cooperate with TransRentals in performance improvement and corrective actions where material issues are identified.',
    ],
  },
  {
    title: '10. Suspension & Termination',
    paras: [
      '10.1 TransRentals may suspend a Vendor account where there is reasonable concern regarding document validity, fraud, customer safety, serious service failure, legal non-compliance or material breach.',
      '10.2 Either Party may terminate the commercial relationship in accordance with the agreed notice terms, subject to completion of legitimate pending settlements and investigations.',
      '10.3 Serious misconduct, fraud, forged documents or conduct creating significant customer or legal risk may justify immediate suspension or termination, subject to applicable law.',
    ],
  },
  {
    title: '11. Confidentiality & Intellectual Property',
    paras: [
      '11.1 Each Party shall keep confidential non-public business, financial, customer and operational information received from the other Party and use it only for the business relationship.',
      '11.2 TransRentals retains ownership of its brand, logo, platform, technology and materials. The Vendor may use approved TransRentals branding only as authorized.',
    ],
  },
  {
    title: '12. Independent Relationship',
    paras: [
      'The Vendor is an independent service provider. Nothing in this Agreement creates employment, agency, legal partnership or joint venture, and neither Party may bind the other without written authority.',
    ],
  },
  {
    title: '13. Liability & Indemnity',
    paras: [
      '13.1 Each Party remains responsible for its own breach, negligence and violation of applicable law.',
      '13.2 The Vendor remains responsible for the legality, safety and operational compliance of its vehicles, drivers and services.',
      '13.3 Any limitation of liability and indemnity provisions should be finalized by legal counsel based on TransRentals’ commercial model and applicable law.',
    ],
  },
  {
    title: '14. Dispute Resolution & Governing Law',
    paras: [
      '14.1 The Parties shall first attempt to resolve disputes through good-faith discussion.',
      '14.2 If a dispute remains unresolved, the Parties may pursue arbitration or other lawful dispute-resolution procedures as finalized in the executed Agreement.',
      '14.3 This Agreement shall be governed by the laws of India. The final jurisdiction and arbitration provisions should be confirmed by legal counsel.',
    ],
  },
  {
    title: '15. General',
    paras: [
      '15.1 Amendments must be made in writing by authorized representatives of both Parties.',
      '15.2 If any provision is held invalid, the remaining provisions shall continue to the extent legally permissible.',
      '15.3 This Agreement and applicable written commercial terms constitute the understanding between the Parties regarding the Vendor relationship.',
    ],
  },
  // Added on request — not part of the original reviewed PDF, but drafted
  // in the same style/numbering so it reads as an integrated part of the
  // agreement. Still needs the same legal-counsel review as the rest.
  {
    title: '16. Platform Role, Permit Compliance & Limitation of Liability',
    paras: [
      '16.1 TransRentals operates solely as an online marketplace and lead-generation platform that connects prospective customers with independent, third-party Vendors based on service category and location. TransRentals does not itself own, operate, or provide any vehicle, driver, or transport service, and is not a party to the underlying rental/transport transaction between the Vendor and the customer.',
      '16.2 TransRentals does not list, support, or facilitate bookings for any vehicle or service category for which the Vendor does not hold a valid, current permit issued by the jurisdictional Regional Transport Office (RTO) or other competent authority under the Motor Vehicles Act, 1988 and applicable state motor vehicle rules (including, as applicable, Contract Carriage Permit, All India Tourist Permit, State Permit, National Permit, or equivalent). Services for which the required RTO permit is not held, has expired, or is not permitted for the relevant route/category are not supported on the platform, and TransRentals may suspend or remove any listing found to be operating without a valid permit.',
      '16.3 As TransRentals does not control the actual delivery of the service — including vehicle condition, driver conduct, route, or timing — TransRentals shall not be liable for any accident, injury, death, property damage, theft, breakdown, delay, dispute, or other mishap ("Mishap") arising during or in connection with a Vendor’s provision of service to a customer. Full responsibility for preventing, investigating, and managing any such Mishap — including police reporting, insurance claims, customer compensation, and any resulting legal proceedings — rests solely with the Vendor.',
      '16.4 The Vendor shall, at all times, maintain valid vehicle registration, permits, fitness certificates, and third-party (and where applicable, comprehensive) insurance, and ensure drivers hold valid and appropriate driving licenses. TransRentals bears no responsibility for any lapse in the above, and such lapse may independently constitute grounds for suspension or termination under Section 10.',
      '16.5 This Section is in addition to, and does not limit, the Vendor’s responsibilities under Section 3 (Vendor Service Responsibilities), Section 13 (Liability & Indemnity), or the Vendor’s indemnity obligations under Section 11.',
    ],
  },
];
