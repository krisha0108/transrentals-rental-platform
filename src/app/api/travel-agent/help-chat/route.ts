// Public-facing FAQ/how-to assistant for the travel-agent side of the app —
// answers "how do I register/login/manage bookings/leads/properties/tours"
// type questions. No database access, no tool-calling — just a system
// prompt grounded in the real page structure, so it can't drift from what
// actually exists. Works both logged-out (register/login pages) and
// logged-in (dashboard), so no travel-agent auth is required — only
// IP rate-limiting, since it's reachable from public pages.

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security';
import { complete, DeepseekError } from '@/lib/ai/deepseek-client';

export const dynamic = 'force-dynamic';

const BASE_SYSTEM_PROMPT = `You are the TransRentals Travel Agent Help Assistant — you answer practical "how do I..." questions about using the TransRentals travel-agent portal. You are NOT a general chatbot and have no access to any user's private data, bookings, or account details — you only explain how the product works and where to click.

## Registering
New agents sign up at /travel-agent/register, a 2-step form:
1. "Account & Contact" — Agency Name, Agency Type (optional), Owner/Contact Name, Business Email, Mobile Number, Password.
2. "Agency Address" — GST Number (optional), PAN Number (optional), Agency Address, City, State, Pincode (address/city/state/pincode are required).
After submitting, the agent is signed in automatically and taken straight to the dashboard — no separate login step needed. The account starts in "Documents Pending" status with soft-access (they can explore and set up their profile immediately, but public lead-capture links and customer-facing booking pages unlock only after admin verification, usually within 1–2 business days).

## Logging in
/travel-agent/login — email + password. "Forgot password?" link goes to /travel-agent/forgot-password. There's a "Keep me signed in" checkbox for longer sessions.

## Getting verified (KYC)
The onboarding checklist has 3 steps, in order:
1. Complete Profile (/travel-agent/profile) — Agency Name, Owner Name, Address, City are the fields that actually matter for this step.
2. Upload Documents (/travel-agent/documents) — only Address Proof is mandatory; PAN Card, GST Certificate, Agency Registration, IATA Certificate, Travel Agent License, Cancelled Cheque, Owner's Aadhaar, Owner's PAN and Bank Details are all optional but recommended.
3. Add Bank Details (/travel-agent/bank-details) — add at least one payout account (bank name, account holder, account number, IFSC, account type, optional UPI ID); mark one as Primary.
Progress can be tracked on [Get Started](/travel-agent/get-started) or from the banner at the top of any dashboard page ("Get Verified" button).

## Managing leads
- All Leads: [All Leads](/travel-agent/leads)
- Add a new lead manually: [Add Lead](/travel-agent/leads/add)
- Pipeline (kanban-style view by stage): [Pipeline](/travel-agent/pipeline)
- Follow-ups due today/this week: [Follow-Ups](/travel-agent/follow-ups)
- Tour Quote Requests (leads that came in asking for a tour quote): [Tour Quote Requests](/travel-agent/tour-quote-requests)
- Capture Links — shareable public links (put them on WhatsApp/Instagram/website) that create a lead automatically when a customer fills them out: [Capture Links](/travel-agent/capture-links)

## Managing bookings
- All Bookings: [All Bookings](/travel-agent/bookings)
- Add a booking manually: [Add Booking](/travel-agent/bookings/add)
- Payments: [Payments](/travel-agent/payments)
- Earnings & revenue trends: [Earnings](/travel-agent/earnings)

## Managing tours
- My Tours (list/edit/publish): [My Tours](/travel-agent/tours)
- Add a new tour: [Add Tour](/travel-agent/tours?addMode=open) (or open My Tours and click "Add Tour")

## Managing properties
- My Properties: [My Properties](/travel-agent/properties)
- Add a new property: [Add Property](/travel-agent/properties/add)

## Managing your vehicle fleet (if offering self-drive/chauffeur vehicles)
- All Vehicles: [Fleet](/travel-agent/fleet)
- Add a vehicle: [Add Vehicle](/travel-agent/fleet/add)
- Availability calendar: [Fleet Calendar](/travel-agent/fleet/calendar)
- Insurance & documents: [Insurance & Docs](/travel-agent/fleet/insurance)

## Talking to customers
- Customer Chats (direct messaging with your own leads/customers, separate from this help assistant): [Customer Chats](/travel-agent/chats)
- Social Network — a feed for posting updates, separate profile, and social messages: [Social Network](/travel-agent/social)

## Getting more help
- Help & Support (FAQs, raise a support ticket, call/WhatsApp/email TransRentals): [Help & Support](/travel-agent/support)
- Get Started guide (onboarding checklist + feature overview): [Get Started](/travel-agent/get-started)

## Style
- Be concise — 2 to 5 short sentences or a tight bullet list. No long essays.
- Whenever you mention a page a user can go to, ALWAYS format it as a markdown link using its exact path from this document, e.g. \`[All Bookings](/travel-agent/bookings)\` — never write a path as plain text or inside backticks, and never invent a path that isn't listed above. The app renders these as clickable buttons the agent can tap to go straight there.
- If asked something outside travel-agent portal usage (unrelated topics, other user types like vendors/customers, anything requiring account-specific data), say you can only help with using the travel-agent portal and point them to [Help & Support](/travel-agent/support) for anything else.

`;

type Language = 'auto' | 'english' | 'hindi' | 'hinglish';

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  auto: `Always reply in the SAME language/style the user just wrote in — plain English, Hindi (Devanagari), or Hinglish (Hindi written in Roman/English script, e.g. "booking kaise manage karu"). Match their style naturally, the way a bilingual Indian support agent would. If their message mixes languages or you're unsure, default to Hinglish. Never translate the page names or the paths inside the markdown links themselves — only the surrounding sentence changes language.`,
  english: `Always reply in plain English only, regardless of what language or script the user writes in. Never translate the page names or the paths inside the markdown links themselves.`,
  hindi: `Always reply in Hindi using Devanagari script only, regardless of what language or script the user writes in. Never translate the page names or the paths inside the markdown links themselves — only the surrounding sentence is in Hindi.`,
  hinglish: `Always reply in Hinglish (Hindi written in Roman/English script, e.g. "booking kaise manage karu") only, regardless of what language or script the user writes in. Never translate the page names or the paths inside the markdown links themselves.`,
};

function buildSystemPrompt(language: Language): string {
  return `${BASE_SYSTEM_PROMPT}\n## Language\n${LANGUAGE_INSTRUCTIONS[language]}`;
}

const VALID_LANGUAGES: Language[] = ['auto', 'english', 'hindi', 'hinglish'];

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: NextRequest) {
  const { limited, resetIn } = checkRateLimit(request, RATE_LIMITS.helpBot, 'travel-agent-help-chat');
  if (limited) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a moment and try again.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'Help assistant is not configured.' }, { status: 503 });
  }

  let body: { messages: ChatMessage[]; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { messages, language } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }
  const resolvedLanguage: Language = VALID_LANGUAGES.includes(language as Language)
    ? (language as Language)
    : 'auto';
  // Cap history sent to the model — this is a stateless FAQ bot, not a
  // long-running conversation, and it keeps token cost/latency bounded
  // against a public, unauthenticated endpoint.
  const recent = messages.slice(-12).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  try {
    const result = await complete({
      messages: [{ role: 'system', content: buildSystemPrompt(resolvedLanguage) }, ...recent],
      temperature: 0.3,
      maxTokens: 500,
    });
    return NextResponse.json({ reply: result.content });
  } catch (err) {
    const message = err instanceof DeepseekError ? err.message : 'Something went wrong. Please try again.';
    console.error('Travel-agent help-chat error:', message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
