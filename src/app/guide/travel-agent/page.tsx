'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  LogIn,
  FileCheck,
  Banknote,
  Building2,
  Compass,
  Bed,
  Car,
  Link2,
  Inbox,
  LayoutGrid,
  Bell,
  MessageSquare,
  Send,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Sparkles,
  Megaphone,
  Globe,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  Target,
  Flame,
  Eye,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
   ───────────────────────────────────────────────────────────── */

type ColorKey =
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'pink';

const COLOR_BG: Record<ColorKey, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  teal: 'bg-teal-50 text-teal-600',
  sky: 'bg-sky-50 text-sky-600',
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
  rose: 'bg-rose-50 text-rose-600',
  pink: 'bg-pink-50 text-pink-600',
};

const COLOR_DOT: Record<ColorKey, string> = {
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
  pink: 'bg-pink-500',
};

const COLOR_CHECK: Record<ColorKey, string> = {
  emerald: 'text-emerald-500',
  teal: 'text-teal-500',
  sky: 'text-sky-500',
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  violet: 'text-violet-500',
  purple: 'text-purple-500',
  amber: 'text-amber-500',
  orange: 'text-orange-500',
  rose: 'text-rose-500',
  pink: 'text-pink-500',
};

function MockFrame({
  title,
  subtitle,
  accent = 'emerald',
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: ColorKey;
  children: React.ReactNode;
}) {
  const ACCENT: Record<ColorKey, string> = {
    emerald: 'bg-emerald-600',
    teal: 'bg-teal-600',
    sky: 'bg-sky-600',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    violet: 'bg-violet-600',
    purple: 'bg-purple-600',
    amber: 'bg-amber-600',
    orange: 'bg-orange-600',
    rose: 'bg-rose-600',
    pink: 'bg-pink-600',
  };
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`${ACCENT[accent]} px-5 py-3`}>
        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
          {subtitle || 'TransRentals · Travel Agent'}
        </p>
        <p className="text-white font-bold text-sm">{title}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium">
        {value}
      </div>
      {hint && <p className="text-[10px] text-slate-400 italic">{hint}</p>}
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  meta,
  right,
  color = 'emerald',
}: {
  icon: any;
  title: string;
  meta?: string;
  right?: string;
  color?: ColorKey;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${COLOR_BG[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
        {meta && <p className="text-[11px] text-slate-500 truncate">{meta}</p>}
      </div>
      {right && (
        <span className={`text-xs font-bold whitespace-nowrap ${COLOR_BG[color]} px-2 py-1 rounded-md`}>
          {right}
        </span>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color = 'emerald',
}: {
  label: string;
  value: string;
  icon: any;
  color?: ColorKey;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-1.5 ${COLOR_BG[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-lg font-extrabold text-slate-800 leading-none tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function Pill({ children, color = 'emerald' }: { children: React.ReactNode; color?: ColorKey }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${COLOR_BG[color]}`}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHASE A — ONBOARDING
   ───────────────────────────────────────────────────────────── */

function RegisterMock() {
  return (
    <MockFrame title="Create Your Travel Agent Account" subtitle="Step 1 of 2" accent="emerald">
      <Field label="Agency Name" value="Wanderlust Tours & Travels" hint="Use your registered business name" />
      <Field label="Owner Name" value="Priya Mehta" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email" value="priya@wanderlust.in" />
        <Field label="Phone" value="+91 98273 65551" />
      </div>
      <Field label="Password" value="••••••••••" hint="Minimum 8 characters" />
      <div className="bg-emerald-600 text-white rounded-lg py-2 text-center text-xs font-bold mt-1">
        Continue to Agency Details →
      </div>
    </MockFrame>
  );
}

function LoginMock() {
  return (
    <MockFrame title="Sign in to your dashboard" subtitle="Travel Agent Login" accent="emerald">
      <Field label="Email" value="priya@wanderlust.in" />
      <Field label="Password" value="••••••••••" />
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-1.5 text-slate-500">
          <span className="w-3 h-3 border border-slate-300 rounded-sm" /> Keep me signed in
        </label>
        <span className="text-emerald-600 font-semibold">Forgot password?</span>
      </div>
      <div className="bg-emerald-600 text-white rounded-lg py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2">
        Sign In to Dashboard <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </MockFrame>
  );
}

function GetStartedMock() {
  return (
    <MockFrame title="Get Started — Onboarding Checklist" subtitle="3 steps to APPROVED" accent="emerald">
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <div>
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Progress</p>
          <p className="text-sm font-extrabold text-emerald-800">2 of 3 done</p>
        </div>
        <div className="text-2xl font-extrabold text-emerald-700">66%</div>
      </div>
      <Row icon={Building2} title="Complete Agency Profile" meta="GST, address, owner details" right="Done" color="emerald" />
      <Row icon={FileCheck} title="Upload KYC Documents" meta="GST, PAN, Address proof" right="Done" color="emerald" />
      <Row icon={Banknote} title="Add Bank Details" meta="For weekly payouts" right="Pending" color="amber" />
    </MockFrame>
  );
}

function ProfileMock() {
  return (
    <MockFrame title="Agency Profile" subtitle="Public-facing info" accent="teal">
      <Field label="Agency Name" value="Wanderlust Tours & Travels" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="GSTIN" value="24ABCDE1234F1Z5" />
        <Field label="PAN" value="ABCDE1234F" />
      </div>
      <Field label="Registered Address" value="3rd Floor, MG Road, Ahmedabad — 380009" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" value="Ahmedabad" />
        <Field label="Public Slug" value="/agent/wanderlust" hint="Your shareable profile URL" />
      </div>
    </MockFrame>
  );
}

function DocumentsMock() {
  return (
    <MockFrame title="KYC Documents" subtitle="3 required for verification" accent="violet">
      <Row icon={FileCheck} title="GST Certificate" meta="Uploaded · Approved" right="✓" color="emerald" />
      <Row icon={FileCheck} title="PAN Card" meta="Uploaded · Approved" right="✓" color="emerald" />
      <Row icon={FileCheck} title="Address Proof" meta="Electricity bill / Rent agreement" right="Pending Upload" color="amber" />
      <div className="text-[11px] text-slate-500 italic">
        Accepted: PDF / JPG / PNG · Max 5 MB · Clear & readable
      </div>
    </MockFrame>
  );
}

function BankMock() {
  return (
    <MockFrame title="Bank Account for Payouts" subtitle="Encrypted & secure" accent="indigo">
      <Field label="Account Holder Name" value="Wanderlust Tours & Travels" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Account Number" value="•••• •••• 4521" />
        <Field label="IFSC Code" value="HDFC0001234" />
      </div>
      <Field label="Bank & Branch" value="HDFC Bank · CG Road, Ahmedabad" />
      <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-2 text-xs font-medium">
        Payouts run every Monday for the previous week.
      </div>
    </MockFrame>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHASE B — LIST YOUR INVENTORY
   ───────────────────────────────────────────────────────────── */

function ToursMock() {
  return (
    <MockFrame title="My Tour Packages" subtitle="3 active · 1 draft" accent="orange">
      <Row icon={Compass} title="Kashmir Honeymoon · 6N/7D" meta="Srinagar → Gulmarg → Pahalgam · From ₹38,000" right="Active" color="emerald" />
      <Row icon={Compass} title="Rajasthan Heritage · 5N/6D" meta="Jaipur → Jodhpur → Udaipur · From ₹24,500" right="Active" color="emerald" />
      <Row icon={Compass} title="Kerala Backwaters · 4N/5D" meta="Cochin → Munnar → Alleppey · From ₹19,800" right="Active" color="emerald" />
      <Row icon={Compass} title="Ladakh Adventure · 8N/9D" meta="Draft — not visible yet" right="Draft" color="amber" />
    </MockFrame>
  );
}

function PropertiesMock() {
  return (
    <MockFrame title="My Properties" subtitle="Hotels · Homestays · Resorts" accent="pink">
      <Row icon={Bed} title="Heritage Haveli, Udaipur" meta="₹4,200/night · Standard double" right="Active" color="emerald" />
      <Row icon={Bed} title="Munnar Tea Estate Bungalow" meta="₹6,500/night · 2BHK · Includes breakfast" right="Active" color="emerald" />
      <Row icon={Bed} title="Goa Beachfront Villa" meta="₹12,000/night · 3BHK · Pool" right="Active" color="emerald" />
    </MockFrame>
  );
}

function FleetMock() {
  return (
    <MockFrame title="My Fleet" subtitle="Vehicles · Drivers · Calendar" accent="sky">
      <Row icon={Car} title="Toyota Innova Crysta · GJ-01-XX-1234" meta="7 seats · Diesel · Verified driver" right="Available" color="emerald" />
      <Row icon={Car} title="Maruti Ertiga · GJ-01-YY-5678" meta="6 seats · CNG · ₹14/km" right="On Trip" color="amber" />
      <Row icon={Car} title="Tempo Traveller 12-seater" meta="Bus license · ₹22/km" right="Available" color="emerald" />
      <div className="text-[11px] text-slate-500 italic">
        Calendar shows live availability per vehicle. Insurance & RC expiry alerts built in.
      </div>
    </MockFrame>
  );
}

function PublicProfileMock() {
  return (
    <div className="w-full bg-gradient-to-br from-emerald-700 via-teal-700 to-teal-900 rounded-2xl p-5 text-white shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED PARTNER
          </span>
          <h3 className="text-xl font-extrabold mt-0.5">Wanderlust Tours & Travels</h3>
          <p className="text-emerald-100 text-xs">transrentals.in/agent/wanderlust</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tours', value: 12 },
          { label: 'Stays', value: 5 },
          { label: 'Vehicles', value: 8 },
        ].map((s) => (
          <div key={s.label} className="bg-white/15 backdrop-blur border border-white/30 rounded-xl px-3 py-3 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-200">{s.label}</p>
            <p className="text-2xl font-extrabold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-white text-emerald-700 text-xs font-bold rounded-xl py-2 inline-flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
        </div>
        <div className="bg-white/15 backdrop-blur text-white text-xs font-bold rounded-xl py-2 inline-flex items-center justify-center gap-1.5 border border-white/30">
          <Phone className="w-3.5 h-3.5" /> Call
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHASE C — CAPTURE LEADS
   ───────────────────────────────────────────────────────────── */

function CaptureLinkMock() {
  return (
    <MockFrame title="Shareable Lead Capture Links" subtitle="Embed anywhere — WhatsApp, Insta bio" accent="amber">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">Kashmir-Honeymoon-2026</span>
          <Pill color="emerald">Active</Pill>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          transrentals.in/travel-agent/lead/kashmir-honeymoon-2026
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>📥 24 submissions</span>
          <span>🎯 18 leads created</span>
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">Goa-Group-Inquiry</span>
          <Pill color="emerald">Active</Pill>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          transrentals.in/travel-agent/lead/goa-group-inquiry
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>📥 9 submissions</span>
          <span>🎯 7 leads created</span>
        </div>
      </div>
    </MockFrame>
  );
}

function LeadsMock() {
  return (
    <MockFrame title="Leads · Inbox" subtitle="34 total · 6 new today" accent="blue">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="New" value="6" icon={Inbox} color="blue" />
        <Stat label="Hot" value="4" icon={Flame} color="rose" />
        <Stat label="Quoted" value="11" icon={Send} color="violet" />
        <Stat label="Booked" value="9" icon={CheckCircle2} color="emerald" />
      </div>
      <Row icon={Phone} title="Aarav Patel · +91 98765-43210" meta="Kashmir · 4 pax · 12 Jun" right="Hot" color="rose" />
      <Row icon={Phone} title="Sneha R. · +91 90876-12345" meta="Goa group · 14 pax · 22 Jun" right="New" color="blue" />
    </MockFrame>
  );
}

function TourQuoteRequestsMock() {
  return (
    <MockFrame title="Tour Quote Requests" subtitle="Inbound from your tour pages" accent="purple">
      <Row
        icon={Compass}
        title="Kerala Backwaters · 4N/5D"
        meta="Customer: Rohit M. · 6 pax · ₹19,800 starting"
        right="Awaiting Quote"
        color="amber"
      />
      <Row
        icon={Compass}
        title="Rajasthan Heritage · 5N/6D"
        meta="Customer: Mehta family · 8 pax · ₹24,500 starting"
        right="Quote Sent"
        color="violet"
      />
      <div className="text-[11px] text-slate-500 italic">
        Every quote request becomes a Lead automatically — track it in the Pipeline.
      </div>
    </MockFrame>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHASE D — CONVERT LEADS → BOOKINGS
   ───────────────────────────────────────────────────────────── */

function PipelineMock() {
  const cols = [
    { name: 'New', count: 6, color: 'blue' as ColorKey },
    { name: 'Contacted', count: 9, color: 'sky' as ColorKey },
    { name: 'Quoted', count: 11, color: 'violet' as ColorKey },
    { name: 'Booked', count: 4, color: 'emerald' as ColorKey },
  ];
  return (
    <MockFrame title="Pipeline · Drag to move stages" subtitle="Kanban board" accent="indigo">
      <div className="grid grid-cols-4 gap-2">
        {cols.map((c) => (
          <div key={c.name} className="bg-slate-50 border border-slate-200 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider ${COLOR_CHECK[c.color]}`}>
                {c.name}
              </p>
              <span className={`text-[10px] font-bold ${COLOR_BG[c.color]} px-1.5 rounded`}>{c.count}</span>
            </div>
            <div className="space-y-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-1.5">
                  <p className="text-[10px] font-bold text-slate-700 truncate">Lead #{c.name[0]}{i}</p>
                  <p className="text-[9px] text-slate-400 truncate">Kashmir · 4 pax</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

function FollowUpsMock() {
  return (
    <MockFrame title="Follow-ups" subtitle="Today · This week · Overdue" accent="rose">
      <Row icon={Bell} title="Call Aarav Patel" meta="Kashmir lead · Due in 2 hours" right="Today" color="rose" />
      <Row icon={Bell} title="Send revised quote to Sneha" meta="Goa group · Due tomorrow" right="Tomorrow" color="amber" />
      <Row icon={Bell} title="Check in with Mehta family" meta="Rajasthan tour · 5 days" right="This week" color="sky" />
    </MockFrame>
  );
}

function ChatBookingShareMock() {
  return (
    <MockFrame title="Chats & Booking Share" subtitle="In-app messaging + secure share links" accent="teal">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">Aarav Patel</p>
            <p className="text-[11px] text-slate-600 bg-white rounded-lg px-2 py-1 mt-1">
              Hi! Is Pahalgam included in the Day-3 plan?
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 flex-row-reverse">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white bg-emerald-600 rounded-lg px-2 py-1">
              Yes — full day in Pahalgam with Aru & Betaab Valley.
            </p>
          </div>
        </div>
      </div>
      <Row
        icon={Link2}
        title="Share booking with customer"
        meta="transrentals.in/travel-agent/booking/share/4f9c…"
        right="Copy"
        color="teal"
      />
    </MockFrame>
  );
}

/* ─────────────────────────────────────────────────────────────
   PHASE E — RUN YOUR AGENCY
   ───────────────────────────────────────────────────────────── */

function DashboardMock() {
  return (
    <MockFrame title="Dashboard · This Month" subtitle="Snapshot of your agency" accent="emerald">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total Leads" value="34" icon={Target} color="blue" />
        <Stat label="Conversion" value="26%" icon={TrendingUp} color="emerald" />
        <Stat label="Bookings" value="9" icon={ShoppingBag} color="violet" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Revenue" value="₹4.8L" icon={IndianRupee} color="emerald" />
        <Stat label="Paid Out" value="₹3.2L" icon={Banknote} color="teal" />
      </div>
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-xs font-medium">
        🔥 4 hot leads need your attention today.
      </div>
    </MockFrame>
  );
}

function BookingsMock() {
  return (
    <MockFrame title="Bookings" subtitle="Confirmed · In progress · Completed" accent="violet">
      <Row icon={ShoppingBag} title="BK-2026-00187 · Aarav Patel" meta="Kashmir Honeymoon · 12-18 Jun · ₹38,000" right="Confirmed" color="emerald" />
      <Row icon={ShoppingBag} title="BK-2026-00184 · Mehta family" meta="Rajasthan Heritage · 22-27 Jun · ₹1.96L" right="In Progress" color="amber" />
      <Row icon={ShoppingBag} title="BK-2026-00179 · Sharma Inc." meta="Corporate offsite · 30 May · ₹85,000" right="Completed" color="sky" />
    </MockFrame>
  );
}

function PaymentsEarningsMock() {
  return (
    <MockFrame title="Payments & Earnings" subtitle="Weekly payouts every Monday" accent="emerald">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="This Month" value="₹4.8L" icon={IndianRupee} color="emerald" />
        <Stat label="Pending" value="₹38K" icon={Clock} color="amber" />
      </div>
      <Row icon={Banknote} title="Payout · Week 21" meta="HDFC •••• 4521 · 19 May 2026" right="₹1.12L" color="emerald" />
      <Row icon={Banknote} title="Payout · Week 20" meta="HDFC •••• 4521 · 12 May 2026" right="₹84K" color="emerald" />
      <div className="text-[11px] text-slate-500 italic">
        Drill into any booking to see vendor cost, your margin & GST breakdown.
      </div>
    </MockFrame>
  );
}

function SocialMock() {
  return (
    <MockFrame title="Social Feed" subtitle="Get discovered organically" accent="pink">
      <Row
        icon={Megaphone}
        title="Post: Kashmir Aug-itineraries are live"
        meta="2.3k impressions · 47 saves · 12 inquiries"
        right="Live"
        color="emerald"
      />
      <Row
        icon={Megaphone}
        title="Post: Goa monsoon group rate"
        meta="1.1k impressions · 31 saves · 9 inquiries"
        right="Live"
        color="emerald"
      />
      <div className="text-[11px] text-slate-500 italic">
        Comments & DMs land in your inbox. Profile views convert to leads.
      </div>
    </MockFrame>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEPS DATA
   ───────────────────────────────────────────────────────────── */

type Step = {
  id: number;
  phase: 'A' | 'B' | 'C' | 'D' | 'E';
  phaseLabel: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  url: string;
  color: ColorKey;
  tips: string[];
  mockup: React.ReactNode;
};

const steps: Step[] = [
  /* ────── PHASE A ────── */
  {
    id: 1,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Register your agency',
    icon: <UserPlus className="w-6 h-6" />,
    description:
      'Sign up free in 2 minutes. Enter your agency name, owner details, contact info and a secure password — no credit card needed.',
    url: '/travel-agent/register',
    color: 'emerald',
    tips: [
      'Use your legally registered business name',
      'Owner / proprietor name for verification',
      'Email & phone — both will be verified',
    ],
    mockup: <RegisterMock />,
  },
  {
    id: 2,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Sign in to your dashboard',
    icon: <LogIn className="w-6 h-6" />,
    description:
      'Use your registered email and password to access your secure travel-agent dashboard. Stay signed in on trusted devices.',
    url: '/travel-agent/login',
    color: 'emerald',
    tips: [
      'Same email used during registration',
      '"Keep me signed in" remembers your device',
      'Forgot password? Reset via email OTP',
    ],
    mockup: <LoginMock />,
  },
  {
    id: 3,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Get Started — your onboarding checklist',
    icon: <CheckCircle2 className="w-6 h-6" />,
    description:
      'Once logged in, the Get Started page walks you through the 3 things you need before going live: complete profile, upload KYC docs, add bank details. Finish all three to get the "Verified Partner" badge.',
    url: '/travel-agent/get-started',
    color: 'emerald',
    tips: [
      'Step 1: Agency profile (GST, address, owner)',
      'Step 2: Upload KYC documents',
      'Step 3: Add bank account for payouts',
    ],
    mockup: <GetStartedMock />,
  },
  {
    id: 4,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Complete your agency profile',
    icon: <Building2 className="w-6 h-6" />,
    description:
      'This is the info customers see on your public page. Fill in agency name, GST number, complete address, city and your preferred URL slug.',
    url: '/travel-agent/profile',
    color: 'teal',
    tips: [
      'GSTIN is mandatory for invoicing',
      'Address should match GST registration',
      'Slug becomes your public URL: /agent/your-slug',
    ],
    mockup: <ProfileMock />,
  },
  {
    id: 5,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Upload KYC documents',
    icon: <FileCheck className="w-6 h-6" />,
    description:
      'Three documents are required for verification: GST Certificate, PAN Card, and Address Proof. Admin reviews within 24-48 hours.',
    url: '/travel-agent/documents',
    color: 'violet',
    tips: [
      'GST Certificate — clear, current, not expired',
      'PAN Card — both sides, name matches GST',
      'Address Proof — utility bill or rent agreement',
    ],
    mockup: <DocumentsMock />,
  },
  {
    id: 6,
    phase: 'A',
    phaseLabel: 'Onboarding',
    title: 'Add bank account for payouts',
    icon: <Banknote className="w-6 h-6" />,
    description:
      'Payouts run every Monday for the previous week. Add your business bank account — account holder name should match your agency name on GST.',
    url: '/travel-agent/bank-details',
    color: 'indigo',
    tips: [
      'Account holder name must match agency name',
      'IFSC code is validated against RBI master',
      'Cancelled cheque or bank statement may be requested',
    ],
    mockup: <BankMock />,
  },

  /* ────── PHASE B ────── */
  {
    id: 7,
    phase: 'B',
    phaseLabel: 'List Inventory',
    title: 'List your tour packages',
    icon: <Compass className="w-6 h-6" />,
    description:
      'Add tours with destination, duration, starting price, day-wise itinerary, inclusions / exclusions and a cover image. Active tours appear on your public profile and become searchable.',
    url: '/travel-agent/tours',
    color: 'orange',
    tips: [
      'Cover image — landscape, > 1200px wide',
      'Day-wise plan boosts conversion 3x',
      'Mark "Public" to show on your /agent page',
    ],
    mockup: <ToursMock />,
  },
  {
    id: 8,
    phase: 'B',
    phaseLabel: 'List Inventory',
    title: 'Add properties — hotels, homestays, resorts',
    icon: <Bed className="w-6 h-6" />,
    description:
      'List places where your customers stay. Add address, room types, per-night price, amenities and photos. Pair them with tours to create complete packages.',
    url: '/travel-agent/properties',
    color: 'pink',
    tips: [
      'Multiple room types per property supported',
      'Add cancellation policy upfront',
      'Photos: at least 4 — exterior, room, bathroom, view',
    ],
    mockup: <PropertiesMock />,
  },
  {
    id: 9,
    phase: 'B',
    phaseLabel: 'List Inventory',
    title: 'List your fleet — vehicles & drivers',
    icon: <Car className="w-6 h-6" />,
    description:
      'Add the vehicles you own or have tied-up — cars, tempo travellers, mini-buses. Track registration, fuel type, seating, insurance & RC expiry, and live availability calendar.',
    url: '/travel-agent/fleet',
    color: 'sky',
    tips: [
      'Insurance & RC expiry — auto reminders',
      'Calendar prevents double-booking',
      'Assign verified drivers per vehicle',
    ],
    mockup: <FleetMock />,
  },
  {
    id: 10,
    phase: 'B',
    phaseLabel: 'List Inventory',
    title: 'Your public profile is live',
    icon: <Globe className="w-6 h-6" />,
    description:
      'After approval, your shareable page at transrentals.in/agent/your-slug goes live with logo, tours, stays, vehicles and WhatsApp / Call buttons. Share the link via Insta bio, WhatsApp status, business cards.',
    url: '/agent/wanderlust',
    color: 'emerald',
    tips: [
      'Mobile-first design — converts on phone',
      'Verified badge after KYC for instant trust',
      'No website needed — share one link',
    ],
    mockup: <PublicProfileMock />,
  },

  /* ────── PHASE C ────── */
  {
    id: 11,
    phase: 'C',
    phaseLabel: 'Capture Leads',
    title: 'Create shareable lead-capture links',
    icon: <Link2 className="w-6 h-6" />,
    description:
      'Build branded inquiry forms with a custom slug. Share one link per campaign — every submission lands in your Leads inbox with the source tagged automatically.',
    url: '/travel-agent/capture-links',
    color: 'amber',
    tips: [
      'One link per campaign — Insta bio, WhatsApp status',
      'Pre-fill trip type (One-way / Tour / Stay)',
      'Track submissions & lead conversion per link',
    ],
    mockup: <CaptureLinkMock />,
  },
  {
    id: 12,
    phase: 'C',
    phaseLabel: 'Capture Leads',
    title: 'Manage leads in your inbox',
    icon: <Inbox className="w-6 h-6" />,
    description:
      'Every inquiry — from capture links, tour pages or manual entry — appears here. Mark priority (Hot / Warm / Cold), set next follow-up date, and move through stages: New → Contacted → Interested → Quoted → Negotiating → Booked.',
    url: '/travel-agent/leads',
    color: 'blue',
    tips: [
      'Add lead manually for offline inquiries (calls / walk-ins)',
      'Notes & call logs per lead — never lose context',
      'Auto-WhatsApp button for one-tap reply',
    ],
    mockup: <LeadsMock />,
  },
  {
    id: 13,
    phase: 'C',
    phaseLabel: 'Capture Leads',
    title: 'Receive tour quote requests',
    icon: <Send className="w-6 h-6" />,
    description:
      'When a customer views your tour page and clicks "Get Quote", it lands here. Reply with price + day-wise plan inside chat — and the request automatically becomes a Lead.',
    url: '/travel-agent/tour-quote-requests',
    color: 'purple',
    tips: [
      'Reply within 1 hour — conversion drops 60% after 24h',
      'Quote with day-wise breakdown wins more',
      'Each request auto-creates a Lead — no double-entry',
    ],
    mockup: <TourQuoteRequestsMock />,
  },

  /* ────── PHASE D ────── */
  {
    id: 14,
    phase: 'D',
    phaseLabel: 'Convert',
    title: 'Move leads through the Pipeline',
    icon: <LayoutGrid className="w-6 h-6" />,
    description:
      'Kanban-style board showing all active leads by stage. Drag a lead from "Quoted" to "Booked" when payment is received. Visual, fast, no spreadsheet juggling.',
    url: '/travel-agent/pipeline',
    color: 'indigo',
    tips: [
      'Drag-drop between columns — auto-saves',
      'LOST / COLD leads hidden by default',
      'Filter by source, priority, value',
    ],
    mockup: <PipelineMock />,
  },
  {
    id: 15,
    phase: 'D',
    phaseLabel: 'Convert',
    title: 'Stay on top with follow-ups',
    icon: <Bell className="w-6 h-6" />,
    description:
      'For every lead, set the next follow-up date — and they all show up here, sorted by Today / Tomorrow / This week / Overdue. Browser notifications keep you reminded.',
    url: '/travel-agent/follow-ups',
    color: 'rose',
    tips: [
      'Bulk-mark "Done" after a call session',
      'Overdue follow-ups bubble to top',
      'Enable browser notifications for desktop alerts',
    ],
    mockup: <FollowUpsMock />,
  },
  {
    id: 16,
    phase: 'D',
    phaseLabel: 'Convert',
    title: 'Chat with customers + share bookings',
    icon: <MessageSquare className="w-6 h-6" />,
    description:
      'Every lead has an in-app chat thread — share itineraries, voice notes, photos and revised quotes inline. When the deal closes, generate a secure booking-share link the customer can open without signing up.',
    url: '/travel-agent/chats',
    color: 'teal',
    tips: [
      'Voice notes and images send instantly',
      'Booking share link works without customer login',
      'Read receipts show when customer opens',
    ],
    mockup: <ChatBookingShareMock />,
  },

  /* ────── PHASE E ────── */
  {
    id: 17,
    phase: 'E',
    phaseLabel: 'Run Agency',
    title: 'Your Dashboard — the daily snapshot',
    icon: <Sparkles className="w-6 h-6" />,
    description:
      'Open this every morning. Total leads, conversion rate, bookings, revenue this month, paid-out balance — plus a today-focus card highlighting hot leads needing action.',
    url: '/travel-agent/dashboard',
    color: 'emerald',
    tips: [
      'Conversion rate — your biggest health metric',
      '"Today" card surfaces hot leads instantly',
      'Compare month-over-month at a glance',
    ],
    mockup: <DashboardMock />,
  },
  {
    id: 18,
    phase: 'E',
    phaseLabel: 'Run Agency',
    title: 'Manage all your bookings',
    icon: <ShoppingBag className="w-6 h-6" />,
    description:
      'Confirmed bookings live here — with traveler details, dates, services, payment status and trip docs. Mark as In-Progress when the trip starts, Complete when it ends.',
    url: '/travel-agent/bookings',
    color: 'violet',
    tips: [
      'Add booking manually for offline / phone deals',
      'Edit dates, add extras, generate invoice',
      'Trip docs (e.g., voucher) attach per booking',
    ],
    mockup: <BookingsMock />,
  },
  {
    id: 19,
    phase: 'E',
    phaseLabel: 'Run Agency',
    title: 'Payments & weekly earnings',
    icon: <IndianRupee className="w-6 h-6" />,
    description:
      'See what customers paid, what is due, and what TransRentals paid you out. Weekly payouts hit your bank every Monday for the previous week — GST invoice auto-generated.',
    url: '/travel-agent/earnings',
    color: 'emerald',
    tips: [
      'Drill into each booking for vendor cost vs. your margin',
      'GST invoice auto-generated per payout',
      'Pending amount = booked but not yet paid by customer',
    ],
    mockup: <PaymentsEarningsMock />,
  },
  {
    id: 20,
    phase: 'E',
    phaseLabel: 'Run Agency',
    title: 'Social feed — get discovered',
    icon: <Megaphone className="w-6 h-6" />,
    description:
      'Post tour highlights, customer reviews, monsoon offers — they show up in the TransRentals social feed and on your public profile. Comments & DMs land in your inbox and convert into leads.',
    url: '/travel-agent/social',
    color: 'pink',
    tips: [
      'Post 2-3x a week for organic reach',
      'Tag tours / properties to make posts shoppable',
      'Replies from posts auto-create leads',
    ],
    mockup: <SocialMock />,
  },
];

const PHASE_META: Record<Step['phase'], { title: string; subtitle: string; color: ColorKey }> = {
  A: { title: 'Onboarding', subtitle: 'Sign up · KYC · Get verified', color: 'emerald' },
  B: { title: 'List Your Inventory', subtitle: 'Tours · Stays · Fleet · Public profile', color: 'sky' },
  C: { title: 'Capture Leads', subtitle: 'Inbound + outbound lead generation', color: 'amber' },
  D: { title: 'Convert to Bookings', subtitle: 'Pipeline · Follow-ups · Close the deal', color: 'indigo' },
  E: { title: 'Run Your Agency', subtitle: 'Daily ops, money & growth', color: 'violet' },
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */

export default function TravelAgentGuidePage() {
  const phases = (['A', 'B', 'C', 'D', 'E'] as const).map((p) => ({
    key: p,
    ...PHASE_META[p],
    steps: steps.filter((s) => s.phase === p),
  }));

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-0 -left-10 w-72 h-72 bg-emerald-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 -right-10 w-72 h-72 bg-teal-400 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-400 rounded-full blur-[140px] opacity-30" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" /> Official Travel Agent Guide
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Run your travel agency on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-300">
              TransRentals
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Follow this 20-step journey across 5 phases — from sign-up to your first booking,
            then daily ops at scale. Built for solo agents and growing agencies.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/travel-agent/register"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold text-base px-6 py-3 rounded-xl shadow-xl"
            >
              Sign up free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/travel-agent/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold text-base px-6 py-3 rounded-xl"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ── Phase Navigator ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {phases.map((ph) => (
            <a key={ph.key} href={`#phase-${ph.key}`} className="block group">
              <div className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl p-3 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-extrabold ${COLOR_CHECK[ph.color]}`}>
                    PHASE {ph.key}
                  </span>
                  <span className="text-[10px] bg-white border border-slate-200 rounded-full px-1.5 text-slate-500 font-bold">
                    {ph.steps.length} steps
                  </span>
                </div>
                <p className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-700">
                  {ph.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ph.subtitle}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Steps grouped by phase ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {phases.map((ph) => (
          <section key={ph.key} id={`phase-${ph.key}`} className="scroll-mt-8">
            {/* Phase header */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className={`w-14 h-14 rounded-2xl ${COLOR_BG[ph.color]} flex items-center justify-center text-xl font-extrabold`}
              >
                {ph.key}
              </div>
              <div>
                <p className={`text-xs font-black ${COLOR_CHECK[ph.color]} uppercase tracking-[0.2em]`}>
                  Phase {ph.key}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900">{ph.title}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{ph.subtitle}</p>
              </div>
            </div>

            {/* Steps grid */}
            <div className="grid gap-10">
              {ph.steps.map((step) => (
                <div
                  key={step.id}
                  className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 overflow-hidden"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* LEFT: Instructions */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center gap-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 rounded-2xl ${COLOR_BG[step.color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}
                        >
                          {step.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Step {step.id < 10 ? `0${step.id}` : step.id}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${COLOR_BG[step.color]}`}
                            >
                              {step.phaseLabel}
                            </span>
                          </div>
                          <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-slate-600 text-base leading-relaxed">{step.description}</p>

                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                          What you&apos;ll do
                        </p>
                        <div className="grid gap-2">
                          {step.tips.map((tip, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-emerald-100 transition-all"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COLOR_CHECK[step.color]}`}
                              />
                              <span className="text-slate-600 text-sm font-medium">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={step.url}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all text-sm shadow-md shadow-slate-900/10 w-fit"
                      >
                        Go to {step.title}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* RIGHT: Mockup */}
                    <div className="bg-slate-50 lg:border-l border-slate-100 p-6 lg:p-8 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            UI Preview
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">What you&apos;ll see on the screen</p>
                        </div>
                        <span className="text-[10px] px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500 font-semibold inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Preview
                        </span>
                      </div>
                      {step.mockup}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── Support ── */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-800 rounded-[2rem] p-10 lg:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl font-extrabold mb-3">Need a hand getting started?</h3>
            <p className="text-emerald-50 text-lg mb-8 opacity-95">
              Our partner-success team is available 24/7 to help with onboarding, KYC, listing your first
              tour, or any technical issue. Average response: under 2 hours.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="https://wa.me/919737965551"
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-white text-emerald-700 rounded-2xl font-extrabold hover:bg-emerald-50 transition-colors inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" /> WhatsApp Support
              </a>
              <a
                href="mailto:partners@transrentals.in"
                className="px-8 py-4 bg-white/10 border border-white/30 backdrop-blur text-white rounded-2xl font-bold hover:bg-white/20 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" /> partners@transrentals.in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} TransRentals. Built for travel agents across India.
        </p>
      </footer>
    </div>
  );
}
