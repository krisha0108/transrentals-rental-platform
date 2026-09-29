'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
    UserPlus,
    FileCheck,
    MapPin,
    Zap,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Clock,
    ChevronLeft,
    ChevronRight,
    Upload,
    TrendingUp,
    Car,
    Plus,
    Layers,
    Tag,
    IndianRupee,
    ImagePlus,
    Truck,
    Users,
    Repeat,
    Building2,
    Network,
    Compass,
    Smartphone,
    QrCode,
    Wrench,
    AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
   ───────────────────────────────────────────────────────────── */

function Pin({ n, color = 'blue' }: { n: number; color?: string }) {
    const c: Record<string, string> = {
        blue: 'bg-blue-500', indigo: 'bg-indigo-500',
        purple: 'bg-purple-500', teal: 'bg-teal-500', orange: 'bg-orange-500',
    };
    return (
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-black flex-shrink-0 ${c[color] ?? 'bg-blue-500'}`}>
            {n}
        </span>
    );
}

function Field({ label, value, hint, pin, color }: { label: string; value: string; hint?: string; pin?: number; color?: string }) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                {pin && <Pin n={pin} color={color} />}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium">{value}</div>
            {hint && <p className="text-[10px] text-slate-400 italic">{hint}</p>}
        </div>
    );
}

function PinLegend({ items, color }: { items: string[]; color: string }) {
    return (
        <div className="border-t border-slate-100 px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 bg-slate-50">
            {items.map((text, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <Pin n={i + 1} color={color} />
                    <span className="text-[10px] text-slate-400">{text}</span>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 1 — REGISTRATION
   ───────────────────────────────────────────────────────────── */

function RegStep1Mock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-5 py-3">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Step 1 of 2</p>
                <p className="text-white font-bold text-sm">Account &amp; Contact</p>
            </div>
            <div className="p-4 space-y-3">
                <Field label="Business Name" value="Sharma Travels" hint="e.g. Raj Bike Rentals" pin={1} color="blue" />
                <Field label="Business Type" value="Select (optional)" hint="Sole Proprietor / Pvt Ltd / LLP / Partnership…" />
                <Field label="Owner / Contact Name" value="Rajesh Sharma" pin={2} color="blue" />
                <Field label="Business Email" value="rajesh@sharmatravels.com" />
                <Field label="Mobile Number" value="+91 97379 65551" pin={3} color="blue" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Password" value="••••••••••" hint="Minimum 8 characters" />
                    <Field label="Confirm Password" value="••••••••••" />
                </div>
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold mt-1">
                    Next Step for Becoming a Vendor →
                </div>
            </div>
            <PinLegend items={['Legal business name', 'Owner / contact person', 'Used to log in']} color="blue" />
        </div>
    );
}

function RegStep2Mock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-5 py-3">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Step 2 of 2</p>
                <p className="text-white font-bold text-sm">Business Address</p>
            </div>
            <div className="p-4 space-y-3">
                <Field label="Business Address" value="123, MG Road, Andheri West" hint="Shop / office no., street, landmark" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="City" value="Mumbai" pin={1} color="blue" />
                    <Field label="State" value="Maharashtra" />
                </div>
                <Field label="Pincode" value="400053" hint="Optional" />
                <Field label="Service Location(s)" value="Mumbai ✕  Pune ✕  Nagpur ✕" hint="Search &amp; add at least 1 city — becomes your first location request automatically" pin={2} color="blue" />
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold">Next Step for Becoming a Vendor →</div>
            </div>
            <PinLegend items={['City & state required', 'No separate "request a location" step needed later']} color="blue" />
        </div>
    );
}

function RegSuccessMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-7 text-center">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎉</span>
                </div>
                <p className="text-white font-bold text-base">Welcome aboard, Sharma Travels!</p>
                <p className="text-blue-100 text-xs mt-1">Your vendor account is live. Just 2 quick steps left.</p>
            </div>
            <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-800 font-medium">Your service location request is already in — no extra step needed</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">To get fully verified</p>
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">📄 Upload documents — business license &amp; vehicle RC</div>
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">🔧 Request your services — car, bike, bus, truck &amp; more</div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold">Start with Documents →</div>
                <p className="text-[10px] text-slate-400 text-center">You're auto logged in — no separate login or email verification needed</p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 2 — LOGIN
   ───────────────────────────────────────────────────────────── */

function LoginScreenMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-700 px-5 py-5 text-center">
                <p className="text-2xl mb-1">🚐</p>
                <p className="text-white font-bold text-sm">TransRentals</p>
                <p className="text-indigo-200 text-[10px]">Vendor Portal Login</p>
            </div>
            <div className="p-5 space-y-3">
                <Field label="Email or Vendor ID" value="rajesh@sharmatravels.com" hint="or vn-0001" pin={1} color="indigo" />
                <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                            <Pin n={2} color="indigo" />
                        </div>
                        <span className="text-[10px] text-indigo-500 font-semibold cursor-pointer">Forgot?</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium">
                        ••••••••••
                    </div>
                </div>
                <div className="bg-indigo-700 text-white rounded-lg py-2.5 text-center text-xs font-bold">Sign In to Dashboard</div>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="text-[11px]">🔒</span>
                    <span className="text-[10px] text-slate-400 font-medium">256-bit SSL Encrypted & Secure</span>
                </div>
            </div>
            <PinLegend items={['Email or your VN-xxxx vendor ID', 'Password you set at signup']} color="indigo" />
        </div>
    );
}

function DashboardWelcomeMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-indigo-700 px-5 py-3 flex items-center justify-between">
                <div>
                    <p className="text-indigo-200 text-[10px] font-semibold">Good Morning 👋</p>
                    <p className="text-white font-bold text-sm">Rajesh Sharma</p>
                    <p className="text-indigo-300 text-[10px]">Sharma Travels Pvt. Ltd.</p>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-indigo-200">Vendor ID</p>
                    <p className="text-white font-black text-xs">TR-VEN-02341</p>
                </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
                {[
                    { label: 'Revenue', value: '₹48.2K', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
                    { label: 'Bookings', value: '127', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
                    { label: 'Pending', value: '4', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.bg}`}>
                        <p className={`font-black text-base ${s.text}`}>{s.value}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 opacity-70 ${s.text}`}>{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="px-4 pb-4 space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Recent Bookings</p>
                {[
                    { id: 'BK-2341', route: 'Mumbai → Pune', icon: '✅' },
                    { id: 'BK-2340', route: 'Airport Transfer', icon: '⏳' },
                    { id: 'BK-2339', route: 'Outstation – Goa', icon: '✅' },
                ].map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        <div>
                            <p className="text-xs font-semibold text-slate-700">{b.id}</p>
                            <p className="text-[10px] text-slate-400">{b.route}</p>
                        </div>
                        <span className="text-sm">{b.icon}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 3 — DOCUMENT UPLOAD (KYC)
   ───────────────────────────────────────────────────────────── */

function DocListMock() {
    const docs = [
        { name: 'Address Proof', required: true, status: 'VERIFIED', pin: 1, style: 'bg-green-50 border-green-200 text-green-700', icon: '✅' },
        { name: 'PAN Card', required: true, status: 'UNDER REVIEW', pin: 2, style: 'bg-amber-50 border-amber-200 text-amber-700', icon: '⏳' },
        { name: 'Business Registration', required: false, status: 'UPLOAD', pin: null, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
        { name: 'Cancelled Cheque', required: false, status: 'UPLOAD', pin: null, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
        { name: "Owner's Aadhaar", required: false, status: 'UPLOAD', pin: null, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
        { name: 'GST Certificate', required: false, status: 'UPLOAD', pin: 3, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-700 px-5 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">My Documents</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">1 / 2 Required Done</span>
            </div>
            <div className="divide-y divide-slate-100">
                {docs.map(d => (
                    <div key={d.name} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <span className="text-sm">{d.icon}</span>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{d.name}</p>
                                <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{d.required ? 'Required' : 'Optional'}</p>
                            </div>
                            {d.pin && <Pin n={d.pin} color="purple" />}
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${d.style}`}>{d.status}</span>
                    </div>
                ))}
            </div>
            <PinLegend items={['Already approved', 'Being checked by admin', 'GST is optional now — only Address Proof & PAN are required']} color="purple" />
        </div>
    );
}

function UploadModalMock({ docName, requirements }: { docName: string; requirements: string[] }) {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-700 px-5 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Upload: {docName}</p>
                <span className="text-white/60 text-base cursor-pointer">✕</span>
            </div>
            <div className="p-5 space-y-4">
                <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center bg-purple-50">
                    <Upload className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Drag & drop your file here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse</p>
                    <p className="text-[10px] text-slate-400 mt-3 font-semibold bg-white/70 inline-block px-3 py-1 rounded-full">
                        PDF / JPG / PNG — Max 5 MB
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                    <div className="space-y-1.5">
                        {requirements.map(r => (
                            <div key={r} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                <span className="text-xs text-slate-600">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-purple-700 text-white rounded-lg py-2 text-center text-xs font-bold">Upload Document</div>
            </div>
        </div>
    );
}

function DocsApprovedMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <p className="text-white font-bold text-sm">KYC Status: VERIFIED ✅</p>
                <p className="text-purple-200 text-xs mt-0.5">Both required documents approved</p>
            </div>
            <div className="p-5 space-y-2">
                {['Address Proof', 'PAN Card'].map(d => (
                    <div key={d} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                        <span className="text-sm font-medium text-slate-700">{d}</span>
                        <span className="text-[10px] font-black text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">✅ APPROVED</span>
                    </div>
                ))}
                <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-center">
                    <p className="text-xs text-indigo-700 font-semibold">🎉 You can now request service locations!</p>
                    <p className="text-[10px] text-indigo-500 mt-0.5">Move to Step 4 to choose your cities</p>
                </div>
                <div className="bg-purple-700 text-white rounded-lg py-2 text-center text-xs font-bold">Proceed to Services →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 4 — SERVICE & LOCATION REQUESTS
   ───────────────────────────────────────────────────────────── */

function LocationSelectMock() {
    const cities = [
        { name: 'Mumbai', checked: true },
        { name: 'Pune', checked: true },
        { name: 'Delhi', checked: false },
        { name: 'Surat', checked: false },
        { name: 'Nagpur', checked: true },
        { name: 'Nashik', checked: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-teal-700 px-5 py-3 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-sm">Request Locations</p>
                    <p className="text-teal-200 text-[10px]">Select cities where you want to operate</p>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">3 selected</span>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-sm">🔍</span>
                    <span className="text-xs text-slate-400">Search states or cities…</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {cities.map(c => (
                        <div
                            key={c.name}
                            className={`rounded-xl border-2 p-3 text-center ${c.checked ? 'bg-teal-50 border-teal-400' : 'bg-slate-50 border-slate-200'}`}
                        >
                            <div className={`w-4 h-4 rounded border-2 mx-auto mb-1.5 flex items-center justify-center ${c.checked ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                                {c.checked && <span className="text-white text-[9px] font-black">✓</span>}
                            </div>
                            <p className={`text-xs font-semibold ${c.checked ? 'text-teal-700' : 'text-slate-500'}`}>{c.name}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-start gap-2 bg-teal-50 rounded-lg p-3 border border-teal-100">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-teal-700 font-medium">Mumbai, Pune, Nagpur selected — our team will review your request</p>
                </div>
                <div className="bg-teal-700 text-white rounded-lg py-2 text-center text-xs font-bold">Request Selected (3) →</div>
            </div>
        </div>
    );
}

function ServiceSelectMock() {
    const services = [
        { icon: '🚗', name: 'Car Rental', sub: 'Cab / Outstation / Local', checked: true },
        { icon: '🏍️', name: 'Bike Rental', sub: 'Self-ride / Delivery', checked: true },
        { icon: '🚌', name: 'Bus Rental', sub: 'Corporate / School / Wedding', checked: false },
        { icon: '🚚', name: 'Truck / Tempo', sub: 'Packers & Movers / Freight', checked: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-teal-700 px-5 py-3">
                <p className="text-white font-bold text-sm">Manage Services</p>
                <p className="text-teal-200 text-[10px] mt-0.5">Request new services or remove ones you no longer offer</p>
            </div>
            <div className="p-4 space-y-2">
                {services.map(s => (
                    <div
                        key={s.name}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 ${s.checked ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'}`}
                    >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${s.checked ? 'bg-teal-500 border-teal-500' : 'border-slate-300'}`}>
                            {s.checked && <span className="text-white text-[9px] font-black">✓</span>}
                        </div>
                        <span className="text-lg leading-none">{s.icon}</span>
                        <div>
                            <p className={`text-sm font-bold ${s.checked ? 'text-teal-700' : 'text-slate-600'}`}>{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.sub}</p>
                        </div>
                    </div>
                ))}
                <p className="text-[10px] text-slate-400 text-center pt-1">You can request more services later after approval</p>
            </div>
        </div>
    );
}

function UnderReviewMock() {
    const stages = [
        { label: 'Request Submitted', done: true, active: false },
        { label: 'Under Admin Review', done: true, active: true },
        { label: 'Admin Approval', done: false, active: false },
        { label: 'Services Go Live', done: false, active: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-amber-500 px-5 py-4 text-center">
                <p className="text-white font-bold text-sm">⏳ Request Under Review</p>
                <p className="text-amber-100 text-xs mt-0.5">Reviewed by a person, not automatically</p>
            </div>
            <div className="p-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    {[
                        ['Services', 'Car Rental, Bike Rental'],
                        ['Locations', 'Mumbai, Pune, Nagpur'],
                        ['Submitted', 'Today, 11:32 AM'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-700">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-2.5">
                    {stages.map((s, i) => (
                        <div key={s.label} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black
                                ${s.active ? 'bg-amber-500 text-white animate-pulse' : s.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {s.done && !s.active ? '✓' : s.active ? '●' : i + 1}
                            </div>
                            <span className={`text-xs font-semibold ${s.active ? 'text-amber-600' : s.done ? 'text-green-600' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 10 — INCOMING BOOKINGS (Bike Rental — pre-priced, Accept/Decline)
   ───────────────────────────────────────────────────────────── */

function RequestsListMock() {
    const requests = [
        { id: 'BK-0024', ago: '2 hrs ago', vehicle: 'Honda Activa 6G', city: 'Mumbai', days: 3, total: '₹2,400', status: 'new' },
        { id: 'BK-0023', ago: '5 hrs ago', vehicle: 'Royal Enfield Classic 350', city: 'Goa', days: 5, total: '₹8,500', status: 'accepted' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-700 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-sm">Bike Rental Bookings</p>
                    <p className="text-sky-200 text-[10px]">Already priced by the customer at checkout — you accept or decline</p>
                </div>
                <span className="bg-orange-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full">3 New</span>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
                {['New', 'Upcoming', 'All'].map((t, i) => (
                    <button key={t} className={`flex-1 text-[10px] font-black py-2 ${i === 0 ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-400'}`}>{t}</button>
                ))}
            </div>
            <div className="divide-y divide-slate-100">
                {requests.map(r => (
                    <div key={r.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400">#{r.id}</span>
                                <span className="text-[10px] text-slate-300">· {r.ago}</span>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${r.status === 'new' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                {r.status === 'new' ? 'PENDING_VENDOR' : '✓ ACCEPTED'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">🏍️ {r.vehicle}</p>
                            <p className="text-[10px] text-slate-500">📍 {r.city} · {r.days} days · Grand total {r.total}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 text-[10px] font-bold bg-slate-100 text-slate-600 py-1.5 rounded-lg">View Details</button>
                            {r.status === 'new'
                                ? <button className="flex-1 text-[10px] font-bold bg-emerald-600 text-white py-1.5 rounded-lg">Accept Booking</button>
                                : <button className="flex-1 text-[10px] font-bold bg-green-600 text-white py-1.5 rounded-lg">Manage Trip →</button>
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RequestDetailMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-700 px-4 py-3">
                <p className="text-sky-200 text-[10px] font-semibold">BOOKING DETAILS</p>
                <p className="text-white font-bold text-sm">#BK-0024</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {[
                        ['Vehicle', '🏍️ Honda Activa 6G'],
                        ['Location', '📍 Mumbai'],
                        ['Duration', '3 days'],
                        ['Daily Rate', '₹800'],
                        ['Subtotal', '₹2,400'],
                        ['Security Deposit', '₹2,000'],
                        ['Grand Total', '₹4,400'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">Customer Notes</p>
                    <p className="text-xs text-slate-600 italic">"Need bike in good condition, planning a trip to Lonavala. Prefer CNG or Petrol."</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-base">👤</div>
                    <div>
                        <p className="text-xs font-bold text-slate-800">Priya Sharma</p>
                        <p className="text-[10px] text-slate-400">Call / WhatsApp / Email — all shown directly on the booking</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">Pricing is fixed by the customer's booking — nothing to set here</p>
                <div className="flex gap-2">
                    <div className="flex-1 border border-red-200 text-red-500 rounded-lg py-2 text-center text-xs font-bold">Decline</div>
                    <div className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-center text-xs font-bold">Accept Booking</div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 11 — SEND A QUOTE. Every service except Car Rental has its own
   Requests and Quotes pages, so this is the normal path, not a Self-Drive
   special case. These screens are Self-Drive; the rest follow the same
   shape. Car Rental arrives pre-priced — see Step 10.
   ───────────────────────────────────────────────────────────── */

function QuoteVehicleSelectMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-700 px-4 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Send Quote</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Request: PENDING</span>
            </div>
            <div className="p-4 space-y-3">
                {/* Request summary bar */}
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Request Summary</p>
                    <p className="text-xs font-bold text-slate-700">🚗 Self-Drive · Mumbai · 3 days</p>
                    <p className="text-[10px] text-slate-500">Jan 15 → Jan 18 · Customer is comparing quotes from multiple vendors</p>
                </div>
                {/* Fleet selection */}
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Select from Your Fleet <Pin n={1} color="blue" />
                    </label>
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg px-3 py-2 text-xs text-emerald-800 font-bold flex items-center justify-between">
                        Swift Dzire · MH-04-AB-1234 <span className="text-emerald-400">✓</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Car Name *" value="Swift Dzire" />
                    <Field label="Brand" value="Maruti Suzuki" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Registration No." value="MH-04-AB-1234" />
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transmission</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                            Manual <span className="text-slate-300">▾</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Type</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                            Petrol <span className="text-slate-300">▾</span>
                        </div>
                    </div>
                    <Field label="Seats" value="5" />
                </div>
            </div>
            <PinLegend items={['Auto-fills all fields below']} color="blue" />
        </div>
    );
}

function QuotePricingMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-700 px-4 py-3">
                <p className="text-white font-bold text-sm">Set Your Price</p>
                <p className="text-emerald-200 text-[10px]">3-day self-drive rental</p>
            </div>
            <div className="p-4 space-y-3">
                {/* Hero price field */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3 h-3" /> Daily Rate * <Pin n={1} color="blue" />
                    </label>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-lg font-black text-blue-700">₹</span>
                        <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-xl font-black text-blue-700 flex-1">800</div>
                    </div>
                    <p className="text-[10px] text-blue-500 mt-1">Total Amount = ₹800/day × 3 days = ₹2,400</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Security Deposit *" value="₹2,000" hint="Refundable at return" pin={2} color="blue" />
                    <Field label="KM Limit / Day" value="100 km" hint="Leave blank = unlimited" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advance Payment</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                            30% <span className="text-slate-300">▾</span>
                        </div>
                        <p className="text-[10px] text-slate-400">= ₹720 advance</p>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quote Valid For</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                            3 Days <span className="text-slate-300">▾</span>
                        </div>
                    </div>
                </div>
                {/* Price summary box */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Price Breakdown</p>
                    {[['Total (3 days)', '₹2,400', 'text-slate-800 font-black'], ['Advance (30%)', '₹720', 'text-blue-700 font-bold'], ['Deposit (refundable)', '₹2,000', 'text-slate-600 font-semibold']].map(([k, v, cls]) => (
                        <div key={k} className="flex justify-between text-xs"><span className="text-slate-400">{k}</span><span className={cls}>{v}</span></div>
                    ))}
                </div>
            </div>
            <PinLegend items={['For full rental period, not per day', 'Refunded after vehicle inspection']} color="blue" />
        </div>
    );
}

function QuoteInclusionsMock() {
    const inclusions = ['Car with full tank', 'Valid insurance', 'Basic maintenance', 'Roadside assistance', '24/7 support'];
    const exclusions = ['Fuel charges', 'Toll & parking fees', 'Traffic challans/fines', 'Damage due to misuse'];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-700 px-4 py-3">
                <p className="text-white font-bold text-sm">Inclusions & Exclusions</p>
                <p className="text-emerald-200 text-[10px]">Click Edit to customise each list</p>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">✅ What's Included</p>
                        <button className="text-[10px] font-bold text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg bg-emerald-50">Edit</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {inclusions.map(i => <span key={i} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg">{i}</span>)}
                        <span className="text-[10px] font-bold text-emerald-600 border border-dashed border-emerald-300 px-2 py-1 rounded-lg cursor-pointer">+ Add</span>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">❌ What's NOT Included</p>
                        <button className="text-[10px] font-bold text-red-500 border border-red-200 px-2 py-0.5 rounded-lg bg-red-50">Edit</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {exclusions.map(e => <span key={e} className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg">{e}</span>)}
                        <span className="text-[10px] font-bold text-red-400 border border-dashed border-red-200 px-2 py-1 rounded-lg cursor-pointer">+ Add</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">📋 Terms & Conditions</p>
                    <div className="space-y-1">
                        {['Valid driving license required', 'Security deposit refundable after inspection', 'No off-road or racing use', 'Late return charges apply'].map((t, i) => (
                            <div key={t} className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-black flex-shrink-0">{i + 1}</span>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuoteSubmitMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-700 px-4 py-3">
                <p className="text-white font-bold text-sm">Notes & Submit</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes for Customer <span className="font-normal text-slate-300">(optional)</span></label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[64px] text-xs text-slate-600 italic">
                        "Car is in excellent condition, serviced last week. Please carry your original driving license at pickup."
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Delivery Charges" value="₹200" hint="If customer requested delivery" />
                    <Field label="Pickup Charges" value="₹0" hint="Self pickup selected" />
                </div>
                <div className="bg-emerald-600 text-white rounded-xl py-3 text-center text-sm font-black">
                    Send Quote (₹2,400) →
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-green-700">Quote status: SENT</p>
                        <p className="text-[10px] text-green-600">Customer will be notified. Redirecting to My Quotes…</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 12 — MANAGE YOUR QUOTES
   ───────────────────────────────────────────────────────────── */

function QuotesListMock() {
    const quotes = [
        { id: 'SDQ-0024', vehicle: 'Swift Dzire', city: 'Mumbai', days: 3, total: '₹2,400', status: 'ACCEPTED', statusStyle: 'bg-green-100 text-green-700 border-green-200' },
        { id: 'SDQ-0023', vehicle: 'Hyundai Creta', city: 'Goa', days: 5, total: '₹8,500', status: 'VIEWED', statusStyle: 'bg-purple-100 text-purple-700 border-purple-200' },
        { id: 'SDQ-0022', vehicle: 'Baleno', city: 'Pune', days: 2, total: '₹2,800', status: 'SENT', statusStyle: 'bg-blue-100 text-blue-700 border-blue-200' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-700 px-4 py-3">
                <p className="text-white font-bold text-sm">My Quotes</p>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                {[['12', 'Total'], ['5', 'Pending'], ['3', 'Accepted'], ['₹28.4K', 'Won']].map(([v, l]) => (
                    <div key={l} className="py-2.5 text-center">
                        <p className="text-sm font-black text-slate-800">{v}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{l}</p>
                    </div>
                ))}
            </div>
            <div className="divide-y divide-slate-100">
                {quotes.map(q => (
                    <div key={q.id} className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500">#{q.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${q.statusStyle}`}>{q.status}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">🚗 {q.vehicle}</p>
                        <p className="text-[10px] text-slate-500">📍 {q.city} · {q.days} days · {q.total}</p>
                        <div className="flex gap-1.5">
                            {q.status === 'ACCEPTED'
                                ? <button className="flex-1 text-[10px] font-bold bg-green-600 text-white py-1.5 rounded-lg">View Booking →</button>
                                : <>
                                    <button className="flex-1 text-[10px] font-bold bg-slate-100 text-slate-600 py-1.5 rounded-lg">View Quote</button>
                                    <button className="flex-1 text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 py-1.5 rounded-lg">Withdraw</button>
                                </>
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QuoteDetailMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 text-center">
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full">#SDQ-0024</span>
                <p className="text-white font-bold text-sm mt-2">✅ Quote Accepted!</p>
                <p className="text-green-100 text-[10px] mt-0.5">Customer accepted your quote</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {[
                        ['Vehicle', 'Swift Dzire (2023)'],
                        ['Transmission / Fuel', 'Manual · Petrol'],
                        ['Daily Rate', '₹800 / day'],
                        ['Total (3 days)', '₹2,400'],
                        ['Advance (30%)', '₹720'],
                        ['Deposit', '₹2,000 (refundable)'],
                        ['KM Limit', '100 km/day · ₹12/extra km'],
                        ['Valid Until', 'Jan 17, 2026'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-black text-green-700">👁 Views</p>
                        <p className="text-base font-black text-green-800">4</p>
                    </div>
                    <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-black text-blue-700">📋 Status</p>
                        <p className="text-xs font-black text-blue-800">ACCEPTED</p>
                    </div>
                    <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-black text-amber-700">📅 Sent</p>
                        <p className="text-xs font-black text-amber-800">Jan 13</p>
                    </div>
                </div>
                <div className="bg-green-600 text-white rounded-lg py-2 text-center text-xs font-bold">View Full Booking →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 13 — OTP VERIFICATION & TRIP LIFECYCLE
   ───────────────────────────────────────────────────────────── */

/* — Booking accepted: Generate OTP button — */
function BookingAcceptedMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-green-700 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-green-200 text-[10px] font-semibold">BOOKING CONFIRMED</p>
                    <p className="text-white font-bold text-sm">#BKG-2024-0341</p>
                </div>
                <span className="bg-green-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-green-400">✅ ACCEPTED</span>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                    {[
                        ['Vehicle', '🏍️ Honda Activa 6G'],
                        ['Customer', 'Priya Sharma'],
                        ['Pickup', 'Jan 15, 2026 · 10:00 AM'],
                        ['Return', 'Jan 18, 2026 · 10:00 AM'],
                        ['Location', 'Mumbai'],
                        ['Amount', '₹2,400 (Advance ₹720 paid ✅)'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <span className="text-base">📅</span>
                    <div>
                        <p className="text-xs font-bold text-amber-800">Pickup day is approaching!</p>
                        <p className="text-[10px] text-amber-700">When customer arrives, generate an OTP and share it with them for secure verification.</p>
                    </div>
                </div>
                <button className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2">
                    <span>🔑</span> Send OTP to Customer
                </button>
            </div>
        </div>
    );
}

/* — OTP sent: what customer receives — */
function OtpSentMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-blue-200 text-[10px] font-semibold">STATUS UPDATED</p>
                    <p className="text-white font-bold text-sm">OTP Sent to Customer</p>
                </div>
                <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-full">READY FOR PICKUP</span>
            </div>
            <div className="p-4 space-y-3">
                {/* Push notification preview */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Customer receives this notification:</p>
                    <div className="bg-slate-800 rounded-2xl p-3.5 shadow-lg">
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-base">🔑</span>
                            </div>
                            <div>
                                <p className="text-white text-xs font-bold">Trip Start OTP · TransRentals</p>
                                <p className="text-slate-300 text-[10px] mt-0.5 leading-relaxed">Your OTP for Honda Activa 6G pickup is: <span className="font-black text-white">483 921</span>. Valid for 15 minutes.</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Customer's booking page OTP display */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Also shown on customer's booking page:</p>
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                            <ShieldCheck className="w-4 h-4 text-purple-200" />
                            <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider">Your Trip OTP</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 my-2">
                            {['4','8','3','9','2','1'].map((d, i) => (
                                <div key={i} className="w-9 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-black text-lg">{d}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-purple-300 text-[10px] mt-2">Valid for 15 minutes · Do not share until at pickup point</p>
                        <button className="mt-2 text-[10px] font-bold bg-white/20 text-white px-4 py-1.5 rounded-full">📋 Copy OTP</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* — Vendor enters 6-digit OTP — */
function VendorOtpEntryMock() {
    const digits = ['4', '8', '3', '9', '2', '1'];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-4 text-center">
                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-sm">Verify OTP to Start Trip</p>
                <p className="text-purple-200 text-[10px] mt-0.5">#BKG-2024-0341 · Priya Sharma</p>
            </div>
            <div className="p-5 space-y-4">
                <div className="text-center">
                    <p className="text-xs text-slate-600 font-medium">Ask customer for their 6-digit OTP and enter it below</p>
                </div>
                {/* 6 OTP boxes */}
                <div className="flex justify-center gap-2">
                    {digits.map((d, i) => (
                        <div key={i} className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center
                            ${i < 4 ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-slate-50'}`}>
                            <span className={`text-lg font-black ${i < 4 ? 'text-purple-700' : 'text-slate-300'}`}>
                                {i < 4 ? d : ''}
                            </span>
                        </div>
                    ))}
                </div>
                <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-black">
                    Verify &amp; Start Trip
                </button>
                <button className="w-full border border-slate-200 text-slate-500 rounded-xl py-2 text-xs font-bold">
                    ↻ Resend OTP
                </button>
            </div>
        </div>
    );
}

/* — Trip in progress state — */
function TripInProgressMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-5 py-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-white font-black text-base">Trip in Progress</p>
                </div>
                <p className="text-purple-200 text-[10px]">OTP verified · Started Jan 15 at 10:03 AM</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                    {[
                        ['Vehicle', '🏍️ Honda Activa 6G'],
                        ['Customer', 'Priya Sharma'],
                        ['Started At', 'Jan 15, 2026 · 10:03 AM'],
                        ['Expected Return', 'Jan 18, 2026 · 10:00 AM'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-700 font-semibold">Enjoy your ride! Drive safely.</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">When vehicle is returned, click below to complete the trip.</p>
                </div>
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl py-3 text-sm font-black">
                    🏁 End Trip &amp; Complete
                </button>
            </div>
        </div>
    );
}

/* — Complete trip: a single button, no odometer/damage form today — */
function CompleteTrip() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-orange-600 px-4 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Complete Trip</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">#BKG-0341</span>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <p className="text-xs text-slate-600 font-medium">When the customer returns the vehicle, just click below — no odometer reading or damage form needed today. Amount was already fixed when the booking was accepted.</p>
                </div>
                <button className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-black">✅ End Trip &amp; Complete</button>
            </div>
        </div>
    );
}

/* — Trip completed success — */
function TripCompletedMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-7 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-base">🎉 Trip Completed!</p>
                <p className="text-green-100 text-xs mt-1">Booking #BKG-2024-0341 closed</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                    {[
                        ['Vehicle', 'Honda Activa 6G'],
                        ['Customer', 'Priya Sharma'],
                        ['Rental Period', 'Jan 15 → Jan 18 (3 days)'],
                        ['Grand Total', '₹4,400 (fixed at booking)'],
                        ['Payment Status', '💰 PAID'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-black text-green-600">Customer gets</p>
                        <p className="text-xs font-black text-green-800">📱 "Trip Completed" notification</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] font-black text-blue-600">Revenue added to</p>
                        <p className="text-xs font-black text-blue-800">📊 Earnings Dashboard</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 14 — DASHBOARD & EARNINGS
   ───────────────────────────────────────────────────────────── */

function DashboardOverviewMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3">
                <p className="text-white font-bold text-sm">Vendor Dashboard</p>
                <p className="text-orange-100 text-[10px]">Sharma Travels Pvt. Ltd.</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
                {[
                    { label: 'This Month', value: '₹2.48L', icon: '💰', bg: 'bg-green-50 border-green-200', text: 'text-green-800' },
                    { label: 'Total Bookings', value: '342', icon: '📋', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
                    { label: 'Avg Rating', value: '4.8 ⭐', icon: '', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800' },
                    { label: 'Pending', value: '12', icon: '⏳', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
                        <p className="text-base leading-none">{s.icon}</p>
                        <p className={`font-black text-lg mt-1 ${s.text}`}>{s.value}</p>
                        <p className={`text-[10px] font-semibold opacity-70 ${s.text}`}>{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="px-4 pb-4 flex gap-2">
                {['Bookings', 'Fleet', 'Staff', 'Earnings'].map(tab => (
                    <div key={tab} className={`flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg cursor-pointer ${tab === 'Bookings' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {tab}
                    </div>
                ))}
            </div>
        </div>
    );
}

function EarningsCardMock() {
    const breakdown = [
        { service: 'Car Rental', amount: '₹1,42,000', pct: 57, color: 'bg-blue-500' },
        { service: 'Bike Rental', amount: '₹68,500', pct: 28, color: 'bg-teal-500' },
        { service: 'Others', amount: '₹38,000', pct: 15, color: 'bg-slate-300' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4">
                <p className="text-orange-100 text-[10px] font-semibold uppercase tracking-wider">Monthly Earnings — Feb 2026</p>
                <p className="text-white font-black text-2xl mt-0.5">₹2,48,500</p>
                <div className="flex items-center gap-1.5 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-300" />
                    <p className="text-green-300 text-xs font-bold">↑ 18% vs last month</p>
                </div>
            </div>
            <div className="p-4 space-y-3">
                <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>Monthly Target</span>
                        <span>₹3,00,000</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ width: '83%' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right font-semibold">83% of target achieved</p>
                </div>
                <div className="space-y-2.5">
                    {breakdown.map(b => (
                        <div key={b.service} className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 w-20 font-medium">{b.service}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 w-18 text-right">{b.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ServicePerfMock() {
    const bars = [
        { service: 'Car Rental', bookings: 83, color: 'bg-blue-500' },
        { service: 'Bike Rental', bookings: 44, color: 'bg-teal-500' },
        { service: 'Outstation', bookings: 28, color: 'bg-purple-400' },
        { service: 'Airport', bookings: 19, color: 'bg-orange-400' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Service Performance</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">This Month</span>
            </div>
            <div className="p-4 space-y-3">
                {bars.map(b => (
                    <div key={b.service}>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-700">{b.service}</span>
                            <span className="font-bold text-slate-500">{b.bookings} bookings</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.bookings}%` }} />
                        </div>
                    </div>
                ))}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-center gap-3 mt-1">
                    <span className="text-xl leading-none">🏆</span>
                    <div>
                        <p className="text-xs font-bold text-amber-700">Best Performer: Car Rental</p>
                        <p className="text-[10px] text-amber-600">Avg completion rate: 94.2%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FLEET STEPPER BAR (reused across steps 5-9)
   ───────────────────────────────────────────────────────────── */

function FleetStepper({ active }: { active: number }) {
    const steps = ['Vehicle', 'Details', 'Locations', 'Pricing', 'City Rates'];
    return (
        <div className="flex items-center gap-0 overflow-x-auto">
            {steps.map((s, i) => (
                <React.Fragment key={s}>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap
                        ${i === active ? 'bg-violet-100 text-violet-700' : i < active ? 'text-green-600' : 'text-slate-300'}`}>
                        {i < active ? '✓' : <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-black
                            ${i === active ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</span>}
                        <span className="ml-1">{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className="w-3 h-px bg-slate-200 flex-shrink-0" />}
                </React.Fragment>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 5 — SELECT SERVICE & VEHICLE MODEL
   ───────────────────────────────────────────────────────────── */

/* — Screen: Fleet list with Add Vehicle button — */
function FleetListMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-5 py-3 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-sm">My Fleet</p>
                    <p className="text-violet-200 text-[10px]">Sharma Travels Pvt. Ltd. · 3 vehicles</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Vehicle
                </div>
            </div>
            <div className="p-4 space-y-2">
                {[
                    { reg: 'MH-04-AB-1234', model: 'Swift Dzire', type: 'Self Drive', status: '🟢 Active' },
                    { reg: 'MH-04-CD-5678', model: 'Honda Activa 6G', type: 'Bike Rental', status: '🟢 Active' },
                    { reg: 'MH-04-EF-9999', model: 'Innova Crysta', type: 'Car Rental', status: '⏳ Under Review' },
                ].map(v => (
                    <div key={v.reg} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Car className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">{v.model}</p>
                                <p className="text-[10px] text-slate-400">{v.reg} · {v.type}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{v.status}</span>
                    </div>
                ))}
                <div className="border-2 border-dashed border-violet-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 border-2 border-violet-200 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <p className="text-xs font-semibold text-violet-400">Click "+ Add Vehicle" to start…</p>
                </div>
            </div>
        </div>
    );
}

/* — Screen: Service selection grid — */
function ServiceSelectionMock() {
    const services = [
        { icon: '🏍️', name: 'Bike Rental', color: 'bg-orange-50 border-orange-200 text-orange-700', selected: true },
        { icon: '🚗', name: 'Self Drive', color: 'bg-sky-50 border-sky-200 text-sky-700', selected: false },
        { icon: '👨‍✈️', name: 'Car Rental', color: 'bg-green-50 border-green-200 text-green-700', selected: false },
        { icon: '🚌', name: 'Bus Rental', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', selected: false },
        { icon: '💎', name: 'Luxury Car', color: 'bg-purple-50 border-purple-200 text-purple-700', selected: false },
        { icon: '🚛', name: 'Truck', color: 'bg-blue-50 border-blue-200 text-blue-700', selected: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={0} />
                <p className="text-white font-bold text-sm mt-2">Select Service</p>
                <p className="text-violet-200 text-[10px]">Which service does this vehicle belong to?</p>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
                {services.map(s => (
                    <div key={s.name} className={`rounded-xl border-2 p-3 text-center cursor-pointer ${s.selected ? 'bg-orange-50 border-orange-400' : 'bg-slate-50 border-slate-200'}`}>
                        <p className="text-xl leading-none mb-1">{s.icon}</p>
                        <p className={`text-[10px] font-bold ${s.selected ? 'text-orange-700' : 'text-slate-500'}`}>{s.name}</p>
                        {s.selected && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black mt-1 inline-block">✓</span>}
                    </div>
                ))}
            </div>
            <div className="px-4 pb-4">
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Select Model →</div>
            </div>
        </div>
    );
}

/* — Screen: Model search + selection (Bike / Self-Drive / Bus / Luxury) — */
function ModelSelectionMock() {
    const models = [
        { brand: 'Honda', name: 'Activa 6G', fuel: 'Petrol', seats: '2', selected: true },
        { brand: 'Honda', name: 'Shine 125', fuel: 'Petrol', seats: '2', selected: false },
        { brand: 'Yamaha', name: 'FZ-S V3', fuel: 'Petrol', seats: '2', selected: false },
        { brand: 'Royal Enfield', name: 'Classic 350', fuel: 'Petrol', seats: '2', selected: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={0} />
                <p className="text-white font-bold text-sm mt-2">Select Bike Model</p>
            </div>
            <div className="p-4 space-y-3">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="text-slate-400 text-sm">🔍</span>
                    <span className="text-xs text-slate-400">Search by brand or model…</span>
                </div>
                {/* Brand chips */}
                <div className="flex flex-wrap gap-1.5">
                    {['All Brands', 'Honda', 'Yamaha', 'Royal Enfield', 'Hero'].map((b, i) => (
                        <span key={b} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${i === 1 ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{b}</span>
                    ))}
                </div>
                {/* Model grid */}
                <div className="grid grid-cols-2 gap-2">
                    {models.map(m => (
                        <div key={m.name} className={`rounded-xl border-2 p-3 cursor-pointer ${m.selected ? 'bg-orange-50 border-orange-400' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <span className="text-base">🏍️</span>
                                </div>
                                {m.selected && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black">✓</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">{m.brand}</p>
                            <p className={`text-xs font-bold ${m.selected ? 'text-orange-700' : 'text-slate-700'}`}>{m.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{m.fuel} · {m.seats} seats</p>
                        </div>
                    ))}
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Vehicle Details →</div>
            </div>
        </div>
    );
}

/* — Screen: Car Rental alternative path (category + brand, no model) — */
function CarCategoryBrandMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-green-700 px-4 py-3">
                <FleetStepper active={0} />
                <p className="text-white font-bold text-sm mt-2">Car Rental — Select Category & Brand</p>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle Category *</p>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'Hatchback', seats: '4+1', selected: false },
                        { name: 'Sedan', seats: '4+1', selected: true },
                        { name: 'SUV', seats: '6+1', selected: false },
                        { name: 'MUV / Van', seats: '7+1', selected: false },
                    ].map(c => (
                        <div key={c.name} className={`rounded-xl border-2 p-3 cursor-pointer flex items-center gap-2 ${c.selected ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
                            <span className="text-base">🚗</span>
                            <div>
                                <p className={`text-xs font-bold ${c.selected ? 'text-green-700' : 'text-slate-700'}`}>{c.name}</p>
                                <p className="text-[10px] text-slate-400">{c.seats} seater</p>
                            </div>
                            {c.selected && <span className="ml-auto text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black">✓</span>}
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Brand *</p>
                <div className="flex flex-wrap gap-1.5">
                    {['Maruti', 'Hyundai', 'Toyota', 'Honda', 'Tata', 'Mahindra'].map((b, i) => (
                        <span key={b} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${i === 0 ? 'bg-green-600 text-white border-green-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{b}</span>
                    ))}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-center gap-2">
                    <span className="text-sm">ℹ️</span>
                    <p className="text-[10px] text-amber-700 font-medium">Pricing for Car Rental is managed by admin. You only add vehicle details & locations.</p>
                </div>
                <div className="bg-green-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Vehicle Details →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 6 — VEHICLE DETAILS & IMAGES
   ───────────────────────────────────────────────────────────── */

function VehicleDetailsMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={1} />
            </div>
            {/* Selected vehicle summary */}
            <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🏍️</div>
                <div>
                    <p className="text-xs font-black text-slate-800">Honda Activa 6G</p>
                    <p className="text-[10px] text-slate-500">Bike Rental · Petrol · 2 seats</p>
                </div>
            </div>
            <div className="p-4 space-y-3">
                <Field label="Registration Number" value="MH 04 AB 1234" hint="Auto-converted to UPPERCASE, exactly as on RC book" pin={1} color="violet" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Year of Manufacture" value="2022" pin={2} color="violet" />
                    <Field label="Color" value="Matte Black" />
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Upload Images →</div>
            </div>
            <PinLegend items={['Exactly as printed on RC', 'Between 2000 – current year']} color="violet" />
        </div>
    );
}

function VehicleImagesMock() {
    const angles = [
        { label: 'Front View', hint: 'Front side of the vehicle', hasImage: true },
        { label: 'Back View', hint: 'Rear side', hasImage: false },
        { label: 'Left Side', hint: 'Left side view', hasImage: false },
        { label: 'Right Side', hint: 'Right side view', hasImage: false },
        { label: 'Interior', hint: 'Inside / dashboard', hasImage: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={1} />
                <p className="text-white font-bold text-sm mt-2">Vehicle Images <span className="text-violet-300 font-normal text-[10px]">(Optional)</span></p>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-400">Upload photos from different angles. Vehicles with images get more bookings!</p>
                <div className="grid grid-cols-3 gap-2">
                    {angles.map(a => (
                        <div key={a.label} className={`rounded-xl border-2 overflow-hidden ${a.hasImage ? 'border-violet-300' : 'border-dashed border-slate-200'}`}>
                            {a.hasImage ? (
                                <div className="h-16 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center relative">
                                    <span className="text-2xl">🏍️</span>
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center cursor-pointer">
                                        <span className="text-white text-[8px] font-black">✕</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-16 bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer">
                                    <ImagePlus className="w-4 h-4 text-slate-300" />
                                </div>
                            )}
                            <div className="px-2 py-1.5">
                                <p className="text-[10px] font-bold text-slate-600">{a.label}</p>
                                <p className="text-[9px] text-slate-400">{a.hint}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-slate-400 text-center">JPG / PNG · Max 5 MB per image · Auto-compressed to 1200×1200px</p>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Choose Locations →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 7 — CHOOSE OPERATING LOCATIONS
   ───────────────────────────────────────────────────────────── */

function OperatingLocationsMock() {
    const cities = [
        { name: 'Mumbai', sel: true }, { name: 'Pune', sel: true },
        { name: 'Nagpur', sel: false }, { name: 'Nashik', sel: true },
        { name: 'Aurangabad', sel: false }, { name: 'Surat', sel: false },
        { name: 'Ahmedabad', sel: false }, { name: 'Vadodara', sel: false },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={2} />
                <p className="text-white font-bold text-sm mt-2">Choose Operating Locations</p>
                <p className="text-violet-200 text-[10px]">Where will this vehicle be available?</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <span className="text-slate-400 text-xs">🔍</span>
                        <span className="text-xs text-slate-400">Search locations…</span>
                    </div>
                    <button className="text-[10px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-2 rounded-lg">Select All</button>
                    <button className="text-[10px] font-bold text-slate-500 border border-slate-200 bg-slate-50 px-2.5 py-2 rounded-lg">Clear</button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Selected:</span>
                    <span className="text-[10px] font-black text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">3 of 8 locations</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                    {cities.map(c => (
                        <div key={c.name} className={`rounded-lg border-2 py-2 px-1 text-center cursor-pointer ${c.sel ? 'bg-violet-50 border-violet-400' : 'bg-slate-50 border-slate-200'}`}>
                            <MapPin className={`w-3 h-3 mx-auto mb-0.5 ${c.sel ? 'text-violet-600' : 'text-slate-300'}`} />
                            <p className={`text-[10px] font-bold ${c.sel ? 'text-violet-700' : 'text-slate-500'}`}>{c.name}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: Set Pricing →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 8 — SET PRICING (Bike / Self-Drive / Bus)
   ───────────────────────────────────────────────────────────── */

function GeneralPricingMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={3} />
                <p className="text-white font-bold text-sm mt-2">Set Pricing</p>
                <p className="text-violet-200 text-[10px]">For: Bike Rental · Honda Activa 6G</p>
            </div>
            <div className="p-4 space-y-3">
                {/* Per day — hero field */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3 h-3" /> Per Day Rate * <Pin n={1} color="blue" />
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-black text-blue-700">₹</span>
                        <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-xl font-black text-blue-700 flex-1">800</div>
                    </div>
                    <p className="text-[10px] text-blue-500 mt-1">Main rental rate customers will see</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">Km Limit / Day <Pin n={2} color="blue" /></label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm font-medium text-slate-700">
                            <span>100</span><span className="text-slate-400 text-xs">km</span>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extra Km Rate</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm font-medium text-slate-700">
                            <span>₹12</span><span className="text-slate-400 text-xs">/km</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Deposit</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm font-medium text-slate-700">
                        <span>₹2,000</span><span className="text-[10px] text-slate-400">Refundable at pickup</span>
                    </div>
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: City-wise Pricing →</div>
            </div>
            <PinLegend items={['Required · must be > 0', 'Free km per day included']} color="blue" />
        </div>
    );
}

function PricingSummaryMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={3} />
                <p className="text-white font-bold text-sm mt-2">Pricing Summary</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
                    {[
                        ['Per Day Rate', '₹800', 'text-green-700 font-black text-base'],
                        ['Km Limit', '100 km / day', 'text-slate-700 font-semibold text-sm'],
                        ['Extra Km', '₹12 / km', 'text-slate-700 font-semibold text-sm'],
                        ['Deposit', '₹2,000 (refundable)', 'text-slate-700 font-semibold text-sm'],
                    ].map(([k, v, cls]) => (
                        <div key={k} className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">{k}</span>
                            <span className={cls}>{v}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-semibold">Pricing looks good! Now set city-specific overrides.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <p className="text-[10px] text-amber-700">This is the base price. You can override it per city in the next step.</p>
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Next: City-wise Pricing →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 9 — CITY-WISE PRICING (Bike / Self-Drive only)
   ───────────────────────────────────────────────────────────── */

function CityPricingMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-violet-700 px-4 py-3">
                <FleetStepper active={4} />
                <p className="text-white font-bold text-sm mt-2">City-wise Pricing <span className="text-violet-300 font-normal">(Optional)</span></p>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-400">Leave blank to use base price <span className="font-bold text-slate-600">₹800/day</span> for all cities.</p>
                {/* Mumbai city card — filled */}
                <div className="bg-white rounded-xl border-2 border-violet-200 overflow-hidden">
                    <div className="bg-violet-50 px-3 py-2 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-violet-600" />
                        <p className="text-xs font-bold text-violet-700">Mumbai</p>
                        <span className="ml-auto text-[9px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-black">CUSTOM</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 p-2.5">
                        {[['Per Day', '₹900'], ['Km Limit', '100'], ['Extra Km', '₹14'], ['Deposit', '₹2,500']].map(([l, v]) => (
                            <div key={l} className="space-y-0.5">
                                <p className="text-[9px] text-slate-400 font-semibold">{l}</p>
                                <div className="bg-violet-50 border border-violet-200 rounded-md px-1.5 py-1 text-[10px] font-bold text-violet-700 text-center">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Pune city card — empty / base */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-xs font-bold text-slate-600">Pune</p>
                        <span className="ml-auto text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black">BASE PRICE</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 p-2.5">
                        {[['Per Day', '₹800'], ['Km Limit', '100'], ['Extra Km', '₹12'], ['Deposit', '₹2,000']].map(([l, v]) => (
                            <div key={l} className="space-y-0.5">
                                <p className="text-[9px] text-slate-400 font-semibold">{l}</p>
                                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-md px-1.5 py-1 text-[10px] text-slate-400 text-center">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-green-600 text-white rounded-lg py-2 text-center text-xs font-bold">✅ Add Vehicle to Fleet</div>
            </div>
        </div>
    );
}

function VehicleAddedSuccessMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-7 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Car className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-base">Vehicle Added! 🎉</p>
                <p className="text-violet-200 text-xs mt-1">Now live on TransRentals</p>
            </div>
            <div className="p-5 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {[
                        ['Vehicle', 'Honda Activa 6G (2022)'],
                        ['Reg. No.', 'MH-04-AB-1234'],
                        ['Service', 'Bike Rental · Petrol'],
                        ['Cities', 'Mumbai, Pune, Nashik'],
                        ['Pricing', '₹800/day · 100 km'],
                        ['Status', '🟢 Active'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{k}</span>
                            <span className="font-bold text-slate-800 text-right max-w-[55%]">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-green-700 font-semibold">✅ Customers can now find & book this vehicle</p>
                </div>
                <div className="bg-violet-700 text-white rounded-lg py-2 text-center text-xs font-bold">Add Another Vehicle →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEPS DATA
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   SCREENS FOR STEPS 8–15 — the rest of the platform, drawn the same
   way as the screens above: a coloured header bar, rows or a stat grid,
   and a pin legend where a screen needs explaining.
   ───────────────────────────────────────────────────────────── */

/** A row of small stat tiles, the shape used by the dashboard screens. */
function StatGrid({ items, cols = 2 }: { items: { label: string; value: string; bg: string; text: string }[]; cols?: number }) {
    return (
        <div className={`p-4 grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {items.map((s) => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
                    <p className={`font-black text-lg leading-none ${s.text}`}>{s.value}</p>
                    <p className={`text-[10px] font-semibold opacity-70 mt-1 ${s.text}`}>{s.label}</p>
                </div>
            ))}
        </div>
    );
}

/** A screen frame with the coloured title bar every mockup here uses. */
function Screen({
    title,
    subtitle,
    badge,
    bar,
    children,
}: {
    title: string;
    subtitle?: string;
    badge?: string;
    bar: string;
    children: React.ReactNode;
}) {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`${bar} px-5 py-3 flex items-center justify-between`}>
                <div>
                    <p className="text-white font-bold text-sm">{title}</p>
                    {subtitle && <p className="text-white/70 text-[10px]">{subtitle}</p>}
                </div>
                {badge && (
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

/** A list of rows: label on the left, a status chip on the right. */
function Rows({ rows }: { rows: { name: string; sub?: string; chip?: string; chipStyle?: string; pin?: number; pinColor?: string }[] }) {
    return (
        <div className="divide-y divide-slate-100">
            {rows.map((r) => (
                <div key={r.name} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{r.name}</p>
                            {r.sub && <p className="text-[10px] text-slate-400">{r.sub}</p>}
                        </div>
                        {r.pin && <Pin n={r.pin} color={r.pinColor ?? 'blue'} />}
                    </div>
                    {r.chip && (
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap ${r.chipStyle ?? 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            {r.chip}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

const OK = 'bg-green-50 border-green-200 text-green-700';
const WARN = 'bg-amber-50 border-amber-200 text-amber-700';
const BAD = 'bg-red-50 border-red-200 text-red-700';
const MUTED = 'bg-slate-50 border-slate-200 text-slate-500';
const INFO = 'bg-blue-50 border-blue-200 text-blue-700';

/* ── Step 15: bank details & the partnership agreement ──────────────────── */

function BankDetailsMock() {
    return (
        <Screen title="Bank Details" subtitle="Where your earnings are paid" bar="bg-emerald-700" badge="Payout account">
            <div className="p-4 space-y-3">
                <Field label="Account Holder" value="Sharma Travels Pvt. Ltd." pin={1} color="teal" />
                <Field label="Account Number" value="•••• •••• 4417" />
                <Field label="IFSC Code" value="HDFC0001234" hint="Branch fills in automatically" />
                <Field label="Cancelled Cheque" value="cheque-scan.jpg — optional" pin={2} color="teal" />
            </div>
            <PinLegend items={['Must match the name on your PAN', 'Optional, but it speeds up verification']} color="teal" />
        </Screen>
    );
}

function AgreementMock() {
    return (
        <Screen title="Partnership Agreement" subtitle="Read once, accept once" bar="bg-slate-800">
            <div className="p-4">
                <div className="h-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] leading-relaxed text-slate-500">
                        This agreement sets out the terms on which you list and fulfil bookings through
                        TransRentals — commission on completed bookings, payout timelines, cancellation
                        handling, and the standards expected of a verified vendor…
                    </p>
                </div>
                <label className="mt-3 flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 border-emerald-500 bg-emerald-500 text-[9px] font-black text-white">
                        ✓
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                        I have read and accept the terms of partnership
                    </span>
                </label>
                <div className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-xs font-bold text-white">
                    Accept &amp; Continue
                </div>
            </div>
        </Screen>
    );
}

/* ── Step 16: fleet documents and what is expiring ──────────────────────── */

function FleetDocsMock() {
    return (
        <Screen title="Fleet Documents" subtitle="GJ 01 AB 1234 · Swift Dzire" bar="bg-blue-700" badge="1 expiring">
            <Rows
                rows={[
                    { name: 'Registration Certificate (RC)', sub: 'Valid till 12 Mar 2031', chip: 'VALID', chipStyle: OK },
                    { name: 'Insurance', sub: 'Expires in 19 days', chip: 'EXPIRING', chipStyle: WARN, pin: 1, pinColor: 'blue' },
                    { name: 'Permit', sub: 'Valid till 30 Sep 2027', chip: 'VALID', chipStyle: OK },
                    { name: 'Fitness Certificate', sub: 'Not uploaded', chip: 'UPLOAD', chipStyle: MUTED },
                ]}
            />
            <PinLegend items={['You are warned before it lapses, not after']} color="blue" />
        </Screen>
    );
}

/* ── Step 17: service history and incidents ─────────────────────────────── */

function ServiceLogMock() {
    return (
        <Screen title="Service & Maintenance" subtitle="GJ 01 AB 1234" bar="bg-indigo-700" badge="Next due in 1,200 km">
            <Rows
                rows={[
                    { name: 'General service · 40,000 km', sub: '14 Aug 2026 · ₹6,400', chip: 'DONE', chipStyle: OK },
                    { name: 'Brake pads replaced', sub: '02 Jun 2026 · ₹2,100', chip: 'DONE', chipStyle: OK },
                    { name: 'Next service · 50,000 km', sub: 'Due around 20 Oct 2026', chip: 'UPCOMING', chipStyle: INFO, pin: 1, pinColor: 'indigo' },
                ]}
            />
            <PinLegend items={['Log the reading and the next one is worked out for you']} color="indigo" />
        </Screen>
    );
}

function IncidentMock() {
    return (
        <Screen title="Incident & Claim" subtitle="Reported 09 Sep 2026" bar="bg-rose-700" badge="Claim open">
            <div className="p-4 space-y-3">
                <Field label="Vehicle" value="GJ 01 AB 1234 · Swift Dzire" />
                <Field label="What happened" value="Rear bumper damaged while parked" />
                <Field label="Insurance Claim No." value="CLM-2026-08812" pin={1} color="orange" />
                <div className="flex gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${WARN}`}>SURVEYOR ASSIGNED</span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${MUTED}`}>₹18,500 CLAIMED</span>
                </div>
            </div>
            <PinLegend items={['The claim stays attached to the vehicle, not to a WhatsApp thread']} color="orange" />
        </Screen>
    );
}

/* ── Step 18: fuel cost and how the fleet is doing ──────────────────────── */

function FuelLogMock() {
    return (
        <Screen title="Fuel Tracking" subtitle="September 2026" bar="bg-orange-600" badge="₹41,280 this month">
            <Rows
                rows={[
                    { name: 'GJ 01 AB 1234 · Swift Dzire', sub: '38 L · 24 Sep', chip: '₹3,990', chipStyle: MUTED },
                    { name: 'GJ 01 CD 5678 · Innova', sub: '52 L · 23 Sep', chip: '₹5,460', chipStyle: MUTED },
                    { name: 'GJ 05 EF 9012 · Activa', sub: '9 L · 23 Sep', chip: '₹945', chipStyle: MUTED },
                ]}
            />
            <PinLegend items={['Per vehicle, so you can see which one is quietly eating the money']} color="orange" />
        </Screen>
    );
}

function FleetAnalyticsMock() {
    return (
        <Screen title="Fleet Analytics" subtitle="Last 30 days" bar="bg-teal-700">
            <StatGrid
                items={[
                    { label: 'Utilisation', value: '68%', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800' },
                    { label: 'Active vehicles', value: '14', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
                    { label: 'Idle 7+ days', value: '3', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
                    { label: 'Top earner', value: 'Innova', bg: 'bg-green-50 border-green-200', text: 'text-green-800' },
                ]}
            />
            <div className="px-4 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Earnings by vehicle</p>
                {[
                    ['Innova · GJ 01 CD 5678', '82%'],
                    ['Swift Dzire · GJ 01 AB 1234', '64%'],
                    ['Activa · GJ 05 EF 9012', '31%'],
                ].map(([name, pct]) => (
                    <div key={name} className="mb-2">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>{name}</span>
                            <span className="font-bold">{pct}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-teal-500" style={{ width: pct }} />
                        </div>
                    </div>
                ))}
            </div>
        </Screen>
    );
}

/* ── Step 19: staff, attendance and payroll ─────────────────────────────── */

function StaffListMock() {
    return (
        <Screen title="All Staff" subtitle="Sharma Travels Pvt. Ltd." bar="bg-violet-700" badge="6 employees">
            <Rows
                rows={[
                    { name: 'Rakesh Yadav', sub: 'Driver · ₹18,000 / month', chip: 'ACTIVE', chipStyle: OK },
                    { name: 'Imran Shaikh', sub: 'Driver · ₹18,000 / month', chip: 'ACTIVE', chipStyle: OK },
                    { name: 'Meena Patel', sub: 'Office · ₹22,000 / month', chip: 'ACTIVE', chipStyle: OK },
                    { name: 'Suresh Rao', sub: 'Driver · ₹18,000 / month', chip: 'ON LEAVE', chipStyle: WARN },
                ]}
            />
        </Screen>
    );
}

function AttendanceMock() {
    const days = ['P', 'P', 'P', 'A', 'P', 'P', 'H', 'P', 'P', 'P', 'P', 'P', 'A', 'H'];
    return (
        <Screen title="Attendance" subtitle="Rakesh Yadav · September" bar="bg-violet-700" badge="24 / 26 present">
            <div className="p-4">
                <div className="grid grid-cols-7 gap-1.5">
                    {days.map((d, i) => (
                        <div
                            key={i}
                            className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black ${
                                d === 'P' ? 'bg-green-100 text-green-700' : d === 'A' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                            }`}
                        >
                            {d}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex gap-3 text-[10px] text-slate-400">
                    <span><b className="text-green-600">P</b> Present</span>
                    <span><b className="text-red-500">A</b> Absent</span>
                    <span><b className="text-slate-400">H</b> Holiday</span>
                </div>
            </div>
            <PinLegend items={['Mark it daily — payroll reads straight off this']} color="purple" />
        </Screen>
    );
}

function PayrollMock() {
    return (
        <Screen title="Payroll" subtitle="September 2026" bar="bg-emerald-700" badge="Auto-calculated">
            <Rows
                rows={[
                    { name: 'Rakesh Yadav', sub: '24 days present', chip: '₹16,615', chipStyle: OK },
                    { name: 'Imran Shaikh', sub: '26 days present', chip: '₹18,000', chipStyle: OK },
                    { name: 'Meena Patel', sub: '25 days present', chip: '₹21,153', chipStyle: OK },
                    { name: 'Suresh Rao', sub: '11 days present', chip: '₹7,615', chipStyle: WARN, pin: 1, pinColor: 'teal' },
                ]}
            />
            <PinLegend items={['Worked out from attendance — no month-end arithmetic by hand']} color="teal" />
        </Screen>
    );
}

/* ── Step 20: bookings you bring in yourself ────────────────────────────── */

function DirectBookingMock() {
    return (
        <Screen title="New Direct Booking" subtitle="Customer who called you" bar="bg-blue-700" badge="No quote cycle">
            <div className="p-4 space-y-3">
                <Field label="Customer Name" value="Anil Kapadia" pin={1} color="blue" />
                <Field label="Mobile" value="+91 98240 11223" />
                <Field label="Vehicle" value="Swift Dzire · GJ 01 AB 1234" />
                <Field label="Dates" value="28 Sep → 01 Oct 2026 · 3 days" />
                <Field label="Amount" value="₹7,500" hint="You set it — this booking never went through search" />
            </div>
            <PinLegend items={['Your customer, booked into the same dashboard as ours']} color="blue" />
        </Screen>
    );
}

function BookingLinkMock() {
    return (
        <Screen title="My Booking Link" subtitle="Share it anywhere" bar="bg-indigo-700" badge="Live">
            <div className="p-4">
                <div className="flex items-center gap-4">
                    <div className="grid h-20 w-20 flex-shrink-0 grid-cols-5 grid-rows-5 gap-0.5 rounded-lg border border-slate-200 bg-white p-1.5">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <span key={i} className={`rounded-[1px] ${[0, 1, 2, 5, 7, 10, 12, 14, 18, 20, 22, 23, 24, 3, 9, 16].includes(i) ? 'bg-slate-900' : 'bg-transparent'}`} />
                        ))}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-medium text-slate-600">
                            transrentals.in/book/sharma-travels
                        </p>
                        <div className="mt-2 flex gap-2">
                            <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white">Copy link</span>
                            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500">Download QR</span>
                        </div>
                    </div>
                </div>
            </div>
            <PinLegend items={['On WhatsApp, on your shop board — every booking still lands here']} color="indigo" />
        </Screen>
    );
}

/* ── Step 21: the big jobs ──────────────────────────────────────────────── */

function BulkBookingMock() {
    return (
        <Screen title="Bulk / Event Booking" subtitle="Wedding · Patel family" bar="bg-purple-700" badge="6 vehicles">
            <Rows
                rows={[
                    { name: '2 × Innova Crysta', sub: '28 Nov · Baraat · 10 hrs', chip: 'ASSIGNED', chipStyle: OK },
                    { name: '3 × Tempo Traveller', sub: '28 Nov · Guest pickup', chip: 'ASSIGNED', chipStyle: OK },
                    { name: '1 × Luxury sedan', sub: '29 Nov · Couple', chip: 'PENDING', chipStyle: WARN, pin: 1, pinColor: 'purple' },
                ]}
            />
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                <span className="text-sm font-black text-slate-800">₹1,84,000</span>
            </div>
            <PinLegend items={['Short a vehicle? Pull one in through P2P instead of refusing the job']} color="purple" />
        </Screen>
    );
}

/* ── Step 22: corporate work ────────────────────────────────────────────── */

function B2BRequestsMock() {
    return (
        <Screen title="B2B — Open Requests" subtitle="Corporate clients" bar="bg-slate-800" badge="4 open">
            <Rows
                rows={[
                    { name: 'Infibeam Avenues Ltd.', sub: 'Daily staff pickup · 3 months', chip: 'PICK UP', chipStyle: INFO, pin: 1, pinColor: 'blue' },
                    { name: 'Torrent Power', sub: 'Site visits · 12 vehicles', chip: 'PICK UP', chipStyle: INFO },
                    { name: 'Adani Conference 2026', sub: 'Event fleet · 2 days', chip: 'PICK UP', chipStyle: INFO },
                    { name: 'Zydus Lifesciences', sub: 'Airport transfers · ongoing', chip: 'TAKEN', chipStyle: MUTED },
                ]}
            />
            <PinLegend items={['Work a single operator rarely wins alone — it comes to you here']} color="blue" />
        </Screen>
    );
}

function B2BAssignmentsMock() {
    return (
        <Screen title="My Assignments" subtitle="What you have taken on" bar="bg-slate-800" badge="2 running">
            <Rows
                rows={[
                    { name: 'Infibeam Avenues Ltd.', sub: 'Started 01 Sep · ₹2.4L / month', chip: 'RUNNING', chipStyle: OK },
                    { name: 'Torrent Power', sub: 'Starts 01 Oct', chip: 'SCHEDULED', chipStyle: INFO },
                ]}
            />
        </Screen>
    );
}

/* ── Step 23: vendor to vendor ──────────────────────────────────────────── */

function P2PPostMock() {
    return (
        <Screen title="Post an Idle Vehicle" subtitle="Let it earn instead of sitting" bar="bg-cyan-700" badge="P2P">
            <div className="p-4 space-y-3">
                <Field label="Vehicle" value="Innova Crysta · GJ 01 CD 5678" pin={1} color="teal" />
                <Field label="Free between" value="26 Sep → 30 Sep 2026" />
                <Field label="Your rate to other vendors" value="₹2,600 / day" hint="They quote their own customer on top" />
                <div className="rounded-xl bg-cyan-600 px-4 py-2.5 text-center text-xs font-bold text-white">
                    Post to marketplace
                </div>
            </div>
            <PinLegend items={['Only vehicles with no booking in that window can be posted']} color="teal" />
        </Screen>
    );
}

function P2PBrowseMock() {
    return (
        <Screen title="Available from other vendors" subtitle="Ahmedabad · 28 Nov" bar="bg-cyan-700" badge="Rent in">
            <Rows
                rows={[
                    { name: 'Tempo Traveller · 17 seat', sub: 'Krishna Tours · 2.1 km away', chip: '₹4,200/day', chipStyle: INFO },
                    { name: 'Innova Crysta', sub: 'Maruti Travels · 5.4 km away', chip: '₹2,800/day', chipStyle: INFO },
                    { name: 'Swift Dzire', sub: 'Shree Cabs · 1.8 km away', chip: '₹1,900/day', chipStyle: INFO, pin: 1, pinColor: 'teal' },
                ]}
            />
            <PinLegend items={['More demand than vehicles? Borrow instead of turning the customer away']} color="teal" />
        </Screen>
    );
}

/* ── Step 24: tour packages ─────────────────────────────────────────────── */

function WanderListingMock() {
    return (
        <Screen title="Wander — My Listings" subtitle="Tour packages" bar="bg-fuchsia-700" badge="3 live">
            <Rows
                rows={[
                    { name: 'Gir + Somnath · 3 nights', sub: 'From ₹12,400 per person', chip: 'LIVE', chipStyle: OK },
                    { name: 'Rann of Kutch · 2 nights', sub: 'From ₹9,800 per person', chip: 'LIVE', chipStyle: OK },
                    { name: 'Saputara weekend', sub: 'Draft — itinerary incomplete', chip: 'DRAFT', chipStyle: MUTED, pin: 1, pinColor: 'purple' },
                ]}
            />
            <PinLegend items={['Destination, itinerary and pricing — then it goes live']} color="purple" />
        </Screen>
    );
}

function WanderAnalyticsMock() {
    return (
        <Screen title="Listing Analytics" subtitle="Gir + Somnath · 3 nights" bar="bg-fuchsia-700">
            <StatGrid
                items={[
                    { label: 'Views', value: '1,842', bg: 'bg-fuchsia-50 border-fuchsia-200', text: 'text-fuchsia-800' },
                    { label: 'Enquiries', value: '96', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
                    { label: 'Booked', value: '31', bg: 'bg-green-50 border-green-200', text: 'text-green-800' },
                    { label: 'Rating', value: '4.7 ★', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
                ]}
            />
            <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-[10px] text-slate-500">
                    <b className="text-slate-700">&ldquo;Guide knew every corner of Gir.&rdquo;</b> — Ritu M., 12 Sep
                </p>
            </div>
        </Screen>
    );
}

/* ── Step 25: the money, all in one place ───────────────────────────────── */

function FinancialsMock() {
    return (
        <Screen title="Financials" subtitle="All services · September 2026" bar="bg-green-700" badge="Combined">
            <StatGrid
                items={[
                    { label: 'Earned', value: '₹4.82L', bg: 'bg-green-50 border-green-200', text: 'text-green-800' },
                    { label: 'Paid out', value: '₹3.90L', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
                    { label: 'Pending payout', value: '₹92,400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
                    { label: 'Expenses', value: '₹1.14L', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
                ]}
            />
            <div className="px-4 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">By service</p>
                {[
                    ['Self-Drive', '₹1.96L'],
                    ['Bike Rental', '₹1.12L'],
                    ['Bus & Tempo', '₹88,000'],
                    ['P2P & B2B', '₹86,000'],
                ].map(([svc, amt]) => (
                    <div key={svc} className="flex justify-between border-b border-slate-100 py-1.5 text-[11px] last:border-0">
                        <span className="text-slate-500">{svc}</span>
                        <span className="font-bold text-slate-700">{amt}</span>
                    </div>
                ))}
            </div>
        </Screen>
    );
}

/* ── Step 26: talking to customers ──────────────────────────────────────── */

function ChatMock() {
    return (
        <Screen title="Customer Chats" subtitle="Booking BK-2026-4412" bar="bg-blue-700" badge="On the record">
            <div className="space-y-2 p-4">
                <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2">
                    <p className="text-[11px] text-slate-600">Can I pick up at 8am instead of 10?</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">Anil · 9:14 am</p>
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-blue-600 px-3 py-2">
                    <p className="text-[11px] text-white">Yes, 8am works. Car will be ready.</p>
                    <p className="mt-0.5 text-[9px] text-blue-100">You · 9:16 am</p>
                </div>
            </div>
            <PinLegend items={['Stays attached to the booking instead of scattering across phones']} color="blue" />
        </Screen>
    );
}

function NotificationsMock() {
    return (
        <Screen title="Notifications" subtitle="What you want to hear about" bar="bg-blue-700">
            <Rows
                rows={[
                    { name: 'New quote request', sub: 'Push + email', chip: 'ON', chipStyle: OK },
                    { name: 'Booking confirmed', sub: 'Push + email', chip: 'ON', chipStyle: OK },
                    { name: 'Document expiring', sub: 'Email only', chip: 'ON', chipStyle: OK },
                    { name: 'Marketing updates', sub: 'Email', chip: 'OFF', chipStyle: MUTED, pin: 1, pinColor: 'blue' },
                ]}
            />
            <PinLegend items={['Turn off what you do not want — the settings page is yours']} color="blue" />
        </Screen>
    );
}

/* ── Step 27: where everything is right now ─────────────────────────────── */

function TrackingMock() {
    return (
        <Screen title="Live Tracking" subtitle="Ahmedabad" bar="bg-sky-700" badge="4 sharing">
            <div className="relative h-36 bg-slate-100">
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                {[
                    { top: '22%', left: '28%', label: 'Rakesh' },
                    { top: '58%', left: '62%', label: 'Imran' },
                    { top: '38%', left: '78%', label: 'Suresh' },
                ].map((m) => (
                    <div key={m.label} className="absolute flex items-center gap-1" style={{ top: m.top, left: m.left }}>
                        <span className="h-3 w-3 rounded-full border-2 border-white bg-sky-600 shadow" />
                        <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm">{m.label}</span>
                    </div>
                ))}
            </div>
            <Rows
                rows={[
                    { name: 'Rakesh Yadav', sub: 'On trip · SG Highway', chip: 'MOVING', chipStyle: OK },
                    { name: 'Imran Shaikh', sub: 'Idle · Maninagar', chip: 'PARKED', chipStyle: MUTED },
                ]}
            />
        </Screen>
    );
}

/* ── Step 28: the other vendors ─────────────────────────────────────────── */

function SocialFeedMock() {
    return (
        <Screen title="Vendor Community" subtitle="Vendors only" bar="bg-rose-700" badge="Feed">
            <div className="divide-y divide-slate-100">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[10px] font-black text-rose-700">KT</span>
                        <div>
                            <p className="text-[11px] font-bold text-slate-700">Krishna Tours · Surat</p>
                            <p className="text-[9px] text-slate-400">2 hours ago</p>
                        </div>
                        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full border ${BAD}`}>SOS</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                        Need a 17-seater in Ahmedabad this Sunday — my driver is down. Anyone free?
                    </p>
                    <div className="mt-2 flex gap-3 text-[10px] text-slate-400">
                        <span>💬 7 replies</span>
                        <span>👍 12</span>
                    </div>
                </div>
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-black text-blue-700">MT</span>
                        <div>
                            <p className="text-[11px] font-bold text-slate-700">Maruti Travels · Vadodara</p>
                            <p className="text-[9px] text-slate-400">Yesterday</p>
                        </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                        Tip: log fuel the same day. Month-end guessing cost me ₹9k last quarter.
                    </p>
                </div>
            </div>
        </Screen>
    );
}

/* ── Step 29: the same business, from a phone ───────────────────────────── */

function MobileAppMock() {
    return (
        <div className="mx-auto w-[210px] rounded-[2rem] border-4 border-slate-800 bg-slate-800 shadow-xl">
            <div className="overflow-hidden rounded-[1.6rem] bg-white">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pb-4 pt-5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-black text-white">ST</span>
                        <div>
                            <p className="text-[11px] font-bold text-white">Sharma Travels</p>
                            <p className="inline-flex items-center gap-1 text-[8px] font-bold text-blue-100">
                                ✓ Verified vendor
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 text-[9px] font-semibold uppercase tracking-wider text-blue-100">This month</p>
                    <p className="text-xl font-black text-white">₹2,48,000</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-3">
                    {[
                        ['📋', 'Bookings'],
                        ['🚗', 'Fleet'],
                        ['💬', 'Chats'],
                        ['💰', 'Earnings'],
                    ].map(([icon, label]) => (
                        <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                            <p className="text-sm leading-none">{icon}</p>
                            <p className="mt-1 text-[9px] font-bold text-slate-600">{label}</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-around border-t border-slate-100 py-2">
                    {['🏠', '📋', '🚗', '👤'].map((i, n) => (
                        <span key={n} className={`text-[11px] ${n === 0 ? '' : 'opacity-35'}`}>{i}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

const steps = [
    {
        id: 1,
        title: 'Register & Log In',
        icon: <UserPlus className="w-6 h-6" />,
        description: 'Two short forms and you are inside. Registration takes your business identity and your first service location; after that you sign in with the email — or the VN-xxxx vendor ID — you registered with.',
        url: '/vendor/register',
        color: 'blue' as string,
        tips: [
            'Step 1: Business Name, Owner, Email, Phone & Password — no GST/PAN needed here',
            'Step 2: Address + at least 1 Service Location (this IS your first location request)',
            'You\'re auto logged in straight to your dashboard — no separate verification email',
            'Later, sign in with your registered email OR your VN-xxxx vendor ID',
        ],
        slides: [
            { label: 'Step 1 – Basic Info', mockup: <RegStep1Mock /> },
            { label: 'Step 2 – Business Details', mockup: <RegStep2Mock /> },
            { label: 'Welcome Modal (on Dashboard)', mockup: <RegSuccessMock /> },
            { label: 'Login Screen', mockup: <LoginScreenMock /> },
            { label: 'Dashboard Welcome', mockup: <DashboardWelcomeMock /> },
        ],
    },
    {
        id: 2,
        title: 'Documents & Approval',
        icon: <FileCheck className="w-6 h-6" />,
        description: 'Submit your business proofs for verification. Only Address Proof & PAN Card are required — the rest are optional and can wait. Uploading the two required ones puts you Under Review.',
        url: '/vendor/documents',
        color: 'purple' as string,
        tips: [
            'Required: Address Proof, PAN Card',
            'Optional: GST Certificate, Business Registration, Cancelled Cheque, Owner\'s Aadhaar',
            'Format: PDF / JPG / PNG (Max 5 MB)',
            'Each document carries its own status — pending, approved, rejected, or resubmit required',
            'Most of the dashboard stays locked until a person approves you — that review is manual',
        ],
        slides: [
            { label: 'Document List', mockup: <DocListMock /> },
            {
                label: 'Upload Address Proof',
                mockup: (
                    <UploadModalMock
                        docName="Address Proof"
                        requirements={[
                            'Utility bill, rent agreement, or govt. address proof',
                            'Utility bills must be less than 3 months old',
                            'Clear & readable scan or photo',
                        ]}
                    />
                ),
            },
            {
                label: 'Upload PAN Card',
                mockup: (
                    <UploadModalMock
                        docName="PAN Card"
                        requirements={[
                            'Both sides of the PAN card visible',
                            'Business PAN or proprietor PAN accepted',
                            'JPG or PNG preferred',
                        ]}
                    />
                ),
            },
            { label: 'Required Documents Approved', mockup: <DocsApprovedMock /> },
        ],
    },
    {
        id: 3,
        title: 'Bank Details & Partnership Agreement',
        icon: <IndianRupee className="w-6 h-6" />,
        description: 'The last two things in setup. Add the account your earnings are paid into, then read and accept the terms of partnership. Both have to be done before you can go live.',
        url: '/vendor/bank-details',
        color: 'emerald' as string,
        tips: [
            'The account holder name should match the name on your PAN',
            'A cancelled cheque is optional, but it speeds verification up',
            'The partnership agreement is read and accepted digitally — once',
            'A Get Started checklist in your dashboard tracks everything still pending',
        ],
        slides: [
            { label: 'Bank details', mockup: <BankDetailsMock /> },
            { label: 'Partnership agreement', mockup: <AgreementMock /> },
        ],
    },
    {
        id: 4,
        title: 'Services & Cities',
        icon: <MapPin className="w-6 h-6" />,
        description: 'Your first city is already submitted at registration. Use this to request more cities, and to request the services you offer (always required, since registration never asks for these).',
        url: '/vendor/locations/request',
        color: 'teal' as string,
        tips: [
            'Request more cities anytime from "Request Locations"',
            'Request services from "Manage Services" — required at least once, registration doesn\'t collect these',
            'Our team reviews each request and approves or rejects it',
        ],
        slides: [
            { label: 'Request Locations', mockup: <LocationSelectMock /> },
            { label: 'Manage Services', mockup: <ServiceSelectMock /> },
            { label: 'Request Under Review', mockup: <UnderReviewMock /> },
        ],
    },
    {
        id: 5,
        title: 'Add a Vehicle',
        icon: <Car className="w-6 h-6" />,
        description: 'One wizard, start to finish: pick the service and model, enter the details and photos, choose the cities it runs in, and set your rates. How many stages you see depends on the service — pricing only appears where you actually set the price.',
        url: '/vendor/fleet/add',
        color: 'indigo' as string,
        tips: [
            'Pick service, then search & select the model — Car Rental uses category + brand instead',
            'Registration number auto-converts to UPPERCASE; add up to 5 photos (front, back, sides, interior)',
            'Only your admin-approved cities appear in the locations stage',
            'Pricing stage: Bike Rental, Self-Drive and Bus only — Truck, Equipment, Luxury and Car Rental are quote-based or admin-managed',
            'City-wise overrides: Bike Rental and Self-Drive only; leave blank to use the base rate',
        ],
        slides: [
            { label: 'Fleet List → Add Vehicle', mockup: <FleetListMock /> },
            { label: 'Select Service', mockup: <ServiceSelectionMock /> },
            { label: 'Search & Select Model (Bike / Self-Drive / Bus)', mockup: <ModelSelectionMock /> },
            { label: 'Car Rental: Category + Brand path', mockup: <CarCategoryBrandMock /> },
            { label: 'Basic Details (Reg No / Year / Color)', mockup: <VehicleDetailsMock /> },
            { label: 'Upload 5-angle vehicle photos', mockup: <VehicleImagesMock /> },
            { label: 'Select cities for this vehicle', mockup: <OperatingLocationsMock /> },
            { label: 'Set Per Day Rate, Km Limit & Deposit', mockup: <GeneralPricingMock /> },
            { label: 'Pricing Summary before proceeding', mockup: <PricingSummaryMock /> },
            { label: 'Per-city pricing overrides', mockup: <CityPricingMock /> },
            { label: 'Vehicle added successfully', mockup: <VehicleAddedSuccessMock /> },
        ],
    },
    {
        id: 6,
        title: 'Bookings & Quotes',
        icon: <Tag className="w-6 h-6" />,
        description: 'Two ways a job reaches you. Car Rental arrives already priced — the customer paid at checkout and you simply Accept or Decline. Every other service sends you a request: you pick the vehicle, set your price, and an accepted quote becomes a booking on its own.',
        url: '/vendor/self-drive/requests',
        color: 'sky' as string,
        tips: [
            'Pre-priced bookings arrive as PENDING_VENDOR / BROADCASTED — Accept or Decline, nothing to price',
            'Bike, Self-Drive, Bus, Truck, Transporter, Equipment, Packers and Luxury each have their own Requests and Quotes pages',
            'Select vehicle from fleet → auto-fills name, brand, reg. no., transmission & fuel; Daily Rate × days = Total',
            'Quote status: SENT → VIEWED → ACCEPTED (or WITHDRAWN); accepted quotes become bookings automatically',
            'Save a quote template and reuse it instead of retyping the same terms',
            'Cancelled bookings are kept in their own list so the active one stays clean',
        ],
        slides: [
            { label: 'Incoming bookings list', mockup: <RequestsListMock /> },
            { label: 'Booking detail — Accept / Decline', mockup: <RequestDetailMock /> },
            { label: 'Select vehicle from fleet', mockup: <QuoteVehicleSelectMock /> },
            { label: 'Set daily rate, deposit, KM limit & advance', mockup: <QuotePricingMock /> },
            { label: 'Customise inclusions, exclusions & terms', mockup: <QuoteInclusionsMock /> },
            { label: 'Add notes & submit quote', mockup: <QuoteSubmitMock /> },
            { label: 'Quotes list with status & stats', mockup: <QuotesListMock /> },
            { label: 'Accepted quote detail & booking link', mockup: <QuoteDetailMock /> },
        ],
    },
    {
        id: 7,
        title: 'Running the Trip',
        icon: <ShieldCheck className="w-6 h-6" />,
        description: 'Every trip starts with a secure 6-digit OTP. You send it, the customer receives it on their phone, you verify it to start the trip — and complete it with a single button at return.',
        url: '/vendor/bike-rentals/bookings',
        color: 'purple' as string,
        tips: [
            'Click "Send OTP to Customer" on an accepted booking → customer gets it by push notification',
            'Ask customer for their OTP → enter all 6 digits, then "Verify & Start Trip"',
            'On return: "End Trip & Complete" — no odometer or damage form today, amount was fixed at booking',
            'Luxury Cars also has an Active Trips view, so you can see which bookings are on the road right now',
        ],
        slides: [
            { label: 'Booking accepted — Send OTP button', mockup: <BookingAcceptedMock /> },
            { label: 'OTP sent — customer push notification + display', mockup: <OtpSentMock /> },
            { label: 'Vendor enters 6-digit OTP from customer', mockup: <VendorOtpEntryMock /> },
            { label: 'Trip in progress', mockup: <TripInProgressMock /> },
            { label: 'Complete trip — single button, no form', mockup: <CompleteTrip /> },
            { label: 'Trip completed — booking closed', mockup: <TripCompletedMock /> },
        ],
    },
    {
        id: 8,
        title: 'Fleet Management',
        icon: <Truck className="w-6 h-6" />,
        description: 'Not a listing page — the kind of fleet system a much bigger operator pays for separately. Paperwork with expiry tracking, service history, incidents and their insurance claims, fuel cost per vehicle, and how the whole fleet is performing.',
        url: '/vendor/fleet',
        color: 'blue' as string,
        tips: [
            'Per vehicle: RC, insurance and permits — expiry is tracked, so you are warned before it lapses',
            'Log the service and the reading; the next due date works itself out',
            'Accidents are recorded against the vehicle, with the insurance claim attached to the incident',
            'Fuel is logged per vehicle, not as one lump for the month',
            'Analytics shows utilisation and which vehicles earn the most — an idle one shows up here first',
        ],
        slides: [
            { label: 'Documents & expiry', mockup: <FleetDocsMock /> },
            { label: 'Service history', mockup: <ServiceLogMock /> },
            { label: 'Incident & insurance claim', mockup: <IncidentMock /> },
            { label: 'Fuel log', mockup: <FuelLogMock /> },
            { label: 'Fleet analytics', mockup: <FleetAnalyticsMock /> },
        ],
    },
    {
        id: 9,
        title: 'Staff, Attendance & Payroll',
        icon: <Users className="w-6 h-6" />,
        description: 'Add your drivers and staff, mark who showed up each day, and let payroll calculate itself off that attendance instead of doing the maths by hand at month-end.',
        url: '/vendor/staff',
        color: 'violet' as string,
        tips: [
            'A directory of your employees, with the form to add a new one',
            'Attendance is marked daily — present, absent or holiday',
            'Payroll reads straight off attendance; no month-end arithmetic',
            'If you employ even two or three people, this saves real hours',
        ],
        slides: [
            { label: 'All staff', mockup: <StaffListMock /> },
            { label: 'Attendance', mockup: <AttendanceMock /> },
            { label: 'Payroll', mockup: <PayrollMock /> },
        ],
    },
    {
        id: 10,
        title: 'Selling Directly',
        icon: <QrCode className="w-6 h-6" />,
        description: 'You are not limited to what TransRentals sends you. Book a customer who called you straight into the dashboard, share your own booking page with a QR code, or set up a bulk job for a wedding or an event.',
        url: '/vendor/direct-bookings',
        color: 'orange' as string,
        tips: [
            'Direct booking: create it yourself, no quote cycle needed',
            'Booking link: your own page plus a QR code — put it on WhatsApp or your shop signage',
            'Every booking through it still lands in this system, beside ours',
            'Bulk / Event: several vehicles and dates held together as one job',
            'Short a vehicle for a big job? Pull one in through P2P rather than refuse it',
        ],
        slides: [
            { label: 'Create a direct booking', mockup: <DirectBookingMock /> },
            { label: 'Your booking link & QR', mockup: <BookingLinkMock /> },
            { label: 'A wedding booking', mockup: <BulkBookingMock /> },
        ],
    },
    {
        id: 11,
        title: 'B2B / Corporate Work',
        icon: <Building2 className="w-6 h-6" />,
        description: 'Companies booking transport regularly, and event organisers needing a fleet for a day, usually go to whoever has the relationship or the bigger name. Through the B2B pipeline those requests reach you directly.',
        url: '/vendor/b2b-bookings',
        color: 'indigo' as string,
        tips: [
            'Open Requests — corporate jobs you can pick up',
            'My Assignments — the ones you have taken on, and their status',
            'Access to a category of business normally closed to smaller vendors',
        ],
        slides: [
            { label: 'Open requests', mockup: <B2BRequestsMock /> },
            { label: 'My assignments', mockup: <B2BAssignmentsMock /> },
        ],
    },
    {
        id: 12,
        title: 'P2P Marketplace',
        icon: <Repeat className="w-6 h-6" />,
        description: 'A vehicle with no booking today earns nothing. Lend it to another vendor for the day — and when you have more demand than vehicles, borrow instead of turning the customer away. It runs both ways.',
        url: '/vendor/p2p',
        color: 'teal' as string,
        tips: [
            'Post Vehicle — offer an idle vehicle to other vendors',
            'Available Vehicles — browse what others are offering and rent one in',
            'Share Booking — pass on a job you cannot cover yourself',
            'Available Bookings — pick up what other vendors are sharing',
            'My Activity / My Postings — everything you have posted or taken',
        ],
        slides: [
            { label: 'Post an idle vehicle', mockup: <P2PPostMock /> },
            { label: 'Rent in from another vendor', mockup: <P2PBrowseMock /> },
        ],
    },
    {
        id: 13,
        title: 'Wander Tours',
        icon: <Compass className="w-6 h-6" />,
        description: 'Wander is our separate travel-package marketplace. If you sell holidays and not only vehicles, list tour packages here, answer the requests they bring in, and see what each listing is doing.',
        url: '/vendor/wander/listings',
        color: 'purple' as string,
        tips: [
            'Create listings with destination, itinerary and pricing',
            'Receive and respond to quote requests for those tours',
            'Analytics — how many viewed a listing, and how many booked',
            'Reviews left by travellers who actually took the tour',
        ],
        slides: [
            { label: 'My tour listings', mockup: <WanderListingMock /> },
            { label: 'Listing analytics & reviews', mockup: <WanderAnalyticsMock /> },
        ],
    },
    {
        id: 14,
        title: 'Dashboard & Financials',
        icon: <TrendingUp className="w-6 h-6" />,
        description: 'Real-time stats on the dashboard, and behind it one combined view across every service and every source — our bookings, your direct ones, P2P and B2B — so you always know what is confirmed, pending and already paid out.',
        url: '/vendor/dashboard',
        color: 'green' as string,
        tips: [
            'Track monthly revenue at a glance, with a service-wise performance breakdown',
            'Every service also has its own earnings page, broken down booking by booking',
            'Financials pulls all of them together — overall profit and loss',
            'See how much is still pending to be paid out to you',
        ],
        slides: [
            { label: 'Dashboard Overview', mockup: <DashboardOverviewMock /> },
            { label: 'Monthly Earnings', mockup: <EarningsCardMock /> },
            { label: 'Service Performance', mockup: <ServicePerfMock /> },
            { label: 'Combined financials', mockup: <FinancialsMock /> },
        ],
    },
    {
        id: 15,
        title: 'Chats, Tracking, Community & App',
        icon: <Smartphone className="w-6 h-6" />,
        description: 'The rest of what comes with the platform: messaging that stays attached to the booking, a live map of your drivers, a feed of other vendors who do what you do, and an app so none of it needs a desktop.',
        url: '/vendor/chat',
        color: 'emerald' as string,
        tips: [
            'Chat sits with the booking instead of scattering across phones',
            'Alerts for new requests and confirmations, with a settings page to switch off what you do not want',
            'Live GPS — every driver sharing their location, on one map',
            'A vendors-only feed: ask questions, share what works, answer an SOS when someone needs a job covered',
            'The mobile app covers fleet, bookings and chat, and carries your verified-vendor badge',
        ],
        slides: [
            { label: 'Customer chat', mockup: <ChatMock /> },
            { label: 'Notification settings', mockup: <NotificationsMock /> },
            { label: 'Live map', mockup: <TrackingMock /> },
            { label: 'Community feed', mockup: <SocialFeedMock /> },
            { label: 'Vendor app', mockup: <MobileAppMock /> },
        ],
    },
];

/* ─────────────────────────────────────────────────────────────
   SLIDER COMPONENT
   ───────────────────────────────────────────────────────────── */

type Slide = { label: string; mockup: React.ReactNode };

function MockupSlider({ slides, color }: { slides: Slide[]; color: string }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
    const [selected, setSelected] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        return () => { emblaApi.off('select', onSelect); };
    }, [emblaApi]);

    const dotColors: Record<string, string> = {
        blue: 'bg-blue-500', indigo: 'bg-indigo-500',
        purple: 'bg-purple-500', teal: 'bg-teal-500', orange: 'bg-orange-500',
        violet: 'bg-violet-500', green: 'bg-green-500',
        sky: 'bg-sky-500', emerald: 'bg-emerald-500',
    };
    const activeDot = dotColors[color] ?? 'bg-blue-500';

    return (
        <div className="flex flex-col h-full w-full gap-4">
            {/* Viewport */}
            <div className="overflow-hidden rounded-2xl flex-1" ref={emblaRef}>
                <div className="flex h-full">
                    {slides.map((slide, i) => (
                        <div
                            key={i}
                            className="flex-[0_0_100%] flex flex-col items-center justify-center p-4 select-none"
                        >
                            {slide.mockup}
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-400 truncate max-w-[180px]">
                    {slides[selected].label}
                </span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={scrollPrev}
                        disabled={selected === 0}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <div className="flex gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => emblaApi?.scrollTo(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === selected ? `${activeDot} w-5` : 'bg-slate-200 w-2'}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={scrollNext}
                        disabled={selected === slides.length - 1}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   GUIDE CONTENT
   Everything below is what a vendor can actually do on the
   platform today. Nothing here is a projection or a number
   nobody measured.
   ───────────────────────────────────────────────────────────── */

/**
 * Tailwind only ships classes it can see written out, so a colour picked at
 * runtime has to map to whole class strings rather than be spliced into one.
 */
const STEP_COLORS: Record<string, { chip: string; tick: string; heading: string }> = {
    blue: { chip: 'bg-blue-50 text-blue-600', tick: 'text-blue-500', heading: 'group-hover:text-blue-600' },
    indigo: { chip: 'bg-indigo-50 text-indigo-600', tick: 'text-indigo-500', heading: 'group-hover:text-indigo-600' },
    purple: { chip: 'bg-purple-50 text-purple-600', tick: 'text-purple-500', heading: 'group-hover:text-purple-600' },
    teal: { chip: 'bg-teal-50 text-teal-600', tick: 'text-teal-500', heading: 'group-hover:text-teal-600' },
    orange: { chip: 'bg-orange-50 text-orange-600', tick: 'text-orange-500', heading: 'group-hover:text-orange-600' },
    violet: { chip: 'bg-violet-50 text-violet-600', tick: 'text-violet-500', heading: 'group-hover:text-violet-600' },
    green: { chip: 'bg-green-50 text-green-600', tick: 'text-green-500', heading: 'group-hover:text-green-600' },
    sky: { chip: 'bg-sky-50 text-sky-600', tick: 'text-sky-500', heading: 'group-hover:text-sky-600' },
    emerald: { chip: 'bg-emerald-50 text-emerald-600', tick: 'text-emerald-500', heading: 'group-hover:text-emerald-600' },
};
const stepColor = (c: string) => STEP_COLORS[c] ?? STEP_COLORS.blue;

/** The sections a reader can jump between. */
const SECTIONS = [
    { id: 'why', label: 'Why join' },
    { id: 'start', label: 'Getting started' },
    { id: 'walkthrough', label: 'Step by step' },
    { id: 'services', label: 'Services' },
    { id: 'cost', label: 'What it costs' },
];

/** The case for joining, in the vendor's own terms. */
const WHY = [
    {
        icon: <Layers className="w-5 h-5" />,
        chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        bar: 'bg-emerald-500',
        ghost: 'text-emerald-50',
        edge: 'hover:border-emerald-200',
        title: 'Your leads and your own, in one place',
        body: 'TransRentals sends you quote requests from customers searching in your cities — you see the request, you set your price, you win the job. But you are not limited to what we send. A customer who calls you directly, a walk-in, a referral: book them straight into the same dashboard. One view of everything you have running, instead of your leads living in your head and ours living somewhere else.',
    },
    {
        icon: <Wrench className="w-5 h-5" />,
        chip: 'bg-blue-50 text-blue-600 ring-blue-100',
        bar: 'bg-blue-500',
        ghost: 'text-blue-50',
        edge: 'hover:border-blue-200',
        title: 'Your vehicles, actually managed',
        body: 'Registration and insurance with expiry tracking so nothing lapses unnoticed, service and maintenance logs, fuel cost per vehicle, and incident and claim records when something goes wrong. Not a listing page — the kind of fleet system a much bigger operator pays for separately.',
    },
    {
        icon: <Users className="w-5 h-5" />,
        chip: 'bg-violet-50 text-violet-600 ring-violet-100',
        bar: 'bg-violet-500',
        ghost: 'text-violet-50',
        edge: 'hover:border-violet-200',
        title: 'Your team, on the same platform',
        body: 'Add your drivers and staff, mark daily attendance, and let payroll calculate itself off that attendance instead of doing the maths by hand at month-end. If you employ even two or three people, this alone saves real hours every month.',
    },
    {
        icon: <Repeat className="w-5 h-5" />,
        chip: 'bg-amber-50 text-amber-600 ring-amber-100',
        bar: 'bg-amber-500',
        ghost: 'text-amber-50',
        edge: 'hover:border-amber-200',
        title: 'Idle vehicles start earning',
        body: 'Every operator has a vehicle with no booking today, earning nothing. Lend it to another vendor for the day. It runs both ways: when you have more demand than vehicles — a big wedding, a sudden rush — pull in capacity instead of turning the customer away.',
    },
    {
        icon: <Building2 className="w-5 h-5" />,
        chip: 'bg-sky-50 text-sky-600 ring-sky-100',
        bar: 'bg-sky-500',
        ghost: 'text-sky-50',
        edge: 'hover:border-sky-200',
        title: 'Corporate work you would not win alone',
        body: 'Companies booking transport regularly and event organisers needing a fleet for a day usually go to whoever has the existing relationship or the bigger name. Through the B2B pipeline those requests come to you directly, and you pick up what fits your fleet.',
    },
    {
        icon: <Network className="w-5 h-5" />,
        chip: 'bg-rose-50 text-rose-600 ring-rose-100',
        bar: 'bg-rose-500',
        ghost: 'text-rose-50',
        edge: 'hover:border-rose-200',
        title: 'A network of vendors, not just customers',
        body: 'Post updates, ask questions, share what is working, answer a fellow vendor’s SOS when they need a job covered. Other people running the same business in other cities have usually already solved whatever you are stuck on.',
    },
];

/** Registering to live, in the order it actually happens. */
const GO_LIVE_STAGES = [
    ['Register', 'Business details and your first city.'],
    ['Upload two documents', 'Address Proof and PAN Card.'],
    ['Under Review', 'Our team checks each document.'],
    ['Approved', 'A person signs it off — not a script.'],
    ['Live', 'Full dashboard. Leads start arriving.'],
];

/** The states a single document can be in while it is being checked. */
const DOC_STATUSES = [
    ['Pending', 'bg-slate-100 text-slate-500'],
    ['Approved', 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'],
    ['Rejected', 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'],
    ['Resubmit required', 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'],
];

/** What is actually checked before a vendor goes live. */
const REQUIRED_DOCS = ['Address Proof', 'PAN Card'];
const OPTIONAL_DOCS = [
    'Business Registration',
    'Cancelled Cheque',
    'Owner\u2019s Aadhaar',
    'GST Certificate',
];

/** The rest of setup, none of which blocks you from uploading documents. */
const SETUP_ITEMS = [
    ['Business profile', 'Business name, owner details, contact info and your logo.'],
    ['Bank details', 'The account your earnings are paid into.'],
    ['Partnership agreement', 'Read and accept the terms before going live.'],
    ['Services and cities', 'What you offer and where. More of either can be requested later, and our team approves the request.'],
    ['Get Started checklist', 'A step-by-step list in your dashboard so none of the above gets missed.'],
];

/** The eight categories, all of which follow the same booking flow. */
const SERVICE_CATEGORIES = [
    'Bike Rentals',
    'Self-Drive Cars',
    'Car Rental (with driver)',
    'Luxury Cars',
    'Bus & Tempo Traveller',
    'Packers & Movers',
    'Transporter (trucks & heavy vehicles)',
    'Equipment Rental',
];

/** How a booking travels, the same way in every category. */
const BOOKING_FLOW = [
    'A customer submits a request — say, a bike for three days in Goa.',
    'You see it as a new quote request and reply with your price and terms.',
    'If the customer accepts, it becomes a confirmed booking on its own. Nothing extra for you to do.',
    'You track every booking for that service, with cancelled ones kept in a separate list so the active one stays clean.',
    'You see exactly what you earned from that service, booking by booking.',
];

/** A heading that is the same shape everywhere on the page. */
function SectionHeading({
    eyebrow,
    title,
    lead,
}: {
    eyebrow: string;
    title: string;
    lead?: string;
}) {
    return (
        <div className="max-w-3xl">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                {eyebrow}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                {title}
            </h2>
            {lead && <p className="mt-4 text-lg leading-relaxed text-slate-600">{lead}</p>}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */

export default function VendorGuidePage() {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* ── Hero ── */}
            <div className="relative bg-[#0f172a] px-6 pt-24 pb-28 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 -right-10 w-72 h-72 bg-indigo-500 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <ShieldCheck className="w-4 h-4" /> Official Vendor Guide
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.08]">
                        Run your whole transport business{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            in one place
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                        Yes, we send you real customer leads. The bigger thing you get is one system for
                        those leads and your own, your vehicles, your staff, your payments, your spare
                        capacity and your network of fellow operators — instead of a notebook, three
                        WhatsApp chats and a spreadsheet.
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-2">
                        {SECTIONS.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                {s.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* ── Why join ── */}
                <section id="why" className="scroll-mt-8 pt-20">
                    <SectionHeading
                        eyebrow="Why vendors join"
                        title="It is rarely the bookings that eat your week"
                        lead="Ask any operator what actually takes their time and it is seldom “not enough bookings.” It is the fifty small things around each one — where the paperwork for this vehicle is, who is driving tomorrow, whether last week’s customer ever paid, whether that truck is sitting idle again. This is built to hold all of it, not just to pass you leads."
                    />

                    {/* The pitch's own line, made visible: what this replaces. */}
                    <div className="mt-8 flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                        <span className="mr-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Instead of
                        </span>
                        {['A notebook', 'Three WhatsApp chats', 'A spreadsheet'].map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400 line-through decoration-slate-300"
                            >
                                {t}
                            </span>
                        ))}
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            One dashboard
                        </span>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        {WHY.map((w, i) => (
                            <article
                                key={w.title}
                                className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${w.edge}`}
                            >
                                {/* A rule that draws itself across the top on hover. */}
                                <span
                                    aria-hidden
                                    className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${w.bar}`}
                                />
                                <span
                                    aria-hidden
                                    className={`pointer-events-none absolute right-5 top-2 select-none text-7xl font-black leading-none ${w.ghost}`}
                                >
                                    {i + 1}
                                </span>

                                <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${w.chip}`}>
                                    {w.icon}
                                </div>
                                <h3 className="relative mt-5 text-lg font-extrabold leading-snug text-slate-900">
                                    {w.title}
                                </h3>
                                <p className="relative mt-2.5 text-sm leading-relaxed text-slate-600">{w.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── Getting started ── */}
                <section id="start" className="scroll-mt-8 pt-24">
                    <SectionHeading
                        eyebrow="Getting started"
                        title="What is checked before you go live"
                        lead="Registering takes a few minutes. Everything after it is a review, so it is worth knowing exactly what gets looked at and what can wait."
                    />

                    {/* The answer is a sequence, so it leads with the sequence. */}
                    <ol className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {GO_LIVE_STAGES.map(([label, note], i) => {
                            const last = i === GO_LIVE_STAGES.length - 1;
                            return (
                                <li
                                    key={label}
                                    className={`rounded-2xl border p-4 ${
                                        last
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${
                                            last ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                    <p className={`mt-3 text-sm font-extrabold ${last ? 'text-emerald-900' : 'text-slate-900'}`}>
                                        {label}
                                    </p>
                                    <p className={`mt-1 text-xs leading-relaxed ${last ? 'text-emerald-800/70' : 'text-slate-500'}`}>
                                        {note}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="space-y-5">
                            <div className="rounded-3xl border border-slate-200 bg-white p-7">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        Documents
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        2 required · 4 optional
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                                            <ShieldCheck className="h-4 w-4" />
                                            Required to go live
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            {REQUIRED_DOCS.map((d) => (
                                                <li
                                                    key={d}
                                                    className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-bold text-emerald-900"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                            <Plus className="h-4 w-4" />
                                            Optional — any time later
                                        </p>
                                        <ul className="mt-3 space-y-2">
                                            {OPTIONAL_DOCS.map((d) => (
                                                <li
                                                    key={d}
                                                    className="rounded-xl border border-dashed border-slate-200 px-3.5 py-2 text-sm text-slate-500"
                                                >
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-5">
                                    <p className="text-sm leading-relaxed text-slate-600">
                                        Uploading the two required ones moves you to{' '}
                                        <b className="text-slate-800">Under Review</b>. Each document then carries
                                        its own status, so you can see which one is holding things up:
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {DOC_STATUSES.map(([label, style]) => (
                                            <span
                                                key={label}
                                                className={`rounded-full px-3 py-1 text-[11px] font-bold ${style}`}
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-7">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    The rest of setup
                                </p>
                                <p className="mt-1.5 text-xs text-slate-400">
                                    None of it blocks the document review — it just has to be done before you go live.
                                </p>
                                <dl className="mt-5 divide-y divide-slate-100">
                                    {SETUP_ITEMS.map(([name, desc], i) => (
                                        <div key={name} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-blue-600">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <dt className="text-sm font-bold text-slate-800">{name}</dt>
                                                <dd className="text-sm leading-relaxed text-slate-600">{desc}</dd>
                                            </div>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>

                        {/* The one thing worth saying plainly before somebody signs up. */}
                        <aside className="h-fit overflow-hidden rounded-3xl border border-amber-200 bg-amber-50">
                            <div className="border-b border-amber-200/70 bg-amber-100/50 px-7 py-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
                                        <AlertTriangle className="h-5 w-5" />
                                    </span>
                                    <h3 className="text-lg font-extrabold text-amber-900">
                                        The honest caveat
                                    </h3>
                                </div>
                            </div>
                            <div className="px-7 py-6">
                                <p className="text-sm leading-relaxed text-amber-900/80">
                                    Approval is not instant or automatic. A real person reviews your documents and
                                    the final sign-off is a manual decision. It is usually the only wait in the
                                    whole process.
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-amber-900/80">
                                    That is not red tape for its own sake. It is the same review that makes the
                                    verified-vendor badge mean something to the customers you will be pitching to,
                                    and the same trust that makes another vendor willing to hand you their
                                    overflow booking.
                                </p>
                                <p className="mt-5 rounded-xl bg-amber-100/70 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
                                    Until you are approved you will see a limited dashboard — most features stay
                                    locked while your details are being checked.
                                </p>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* ── Step-by-step walkthrough (the existing screens) ── */}
                <section id="walkthrough" className="scroll-mt-8 pt-24">
                    <SectionHeading
                        eyebrow="Step by step"
                        title="The actual screens, in order"
                        lead="From registering to your first completed trip and the earnings that follow. Each step shows the screen you will be looking at."
                    />

                    <div className="mt-10 grid gap-10">
                        {steps.map((step) => {
                            const c = stepColor(step.color);
                            return (
                                <div
                                    key={step.id}
                                    className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2">
                                        {/* LEFT: Instructions */}
                                        <div className="p-10 flex flex-col justify-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl ${c.chip} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}>
                                                    {step.icon}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        Step {step.id < 10 ? `0${step.id}` : step.id} of {steps.length}
                                                    </span>
                                                    <h3 className={`text-2xl font-extrabold text-slate-900 ${c.heading} transition-colors leading-tight`}>
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
                                                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-blue-100 transition-all">
                                                            <CheckCircle2 className={`w-4 h-4 mt-0.5 ${c.tick} flex-shrink-0`} />
                                                            <span className="text-slate-600 text-sm font-medium">{tip}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Link
                                                href={step.url}
                                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all text-sm shadow-md shadow-slate-900/10 group/btn w-fit"
                                            >
                                                Go to {step.title}
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>

                                        {/* RIGHT: UI Mockup Slider */}
                                        <div className="bg-slate-50 lg:border-l border-slate-100 p-8 flex flex-col justify-center">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">UI Preview</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Exact screens you will see</p>
                                                </div>
                                                <span className="text-[10px] px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-400 font-semibold">
                                                    {step.slides.length} screen{step.slides.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <MockupSlider slides={step.slides} color={step.color} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Services ── */}
                <section id="services" className="scroll-mt-8 pt-24">
                    <SectionHeading
                        eyebrow="Services"
                        title="Eight categories, one way of working"
                        lead="Whichever of these you offer, a booking travels the same road — so learning one means you have learned them all."
                    />

                    <div className="mt-10 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-7">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                What you can list
                            </p>
                            <ul className="mt-4 space-y-2.5">
                                {SERVICE_CATEGORIES.map((s) => (
                                    <li key={s} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                        <Tag className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-7">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                How a booking travels
                            </p>
                            <ol className="mt-4 space-y-3">
                                {BOOKING_FLOW.map((line, i) => (
                                    <li key={i} className="flex gap-3.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-blue-600">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm leading-relaxed text-slate-600">{line}</span>
                                    </li>
                                ))}
                            </ol>

                            <div className="mt-6 space-y-2.5 rounded-2xl bg-slate-50 p-5">
                                <p className="flex gap-3 text-sm leading-relaxed text-slate-600">
                                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                    <span>
                                        <b className="text-slate-800">Quote templates.</b> Most services let you
                                        save pricing and terms you have written before, instead of typing the
                                        same reply over and over.
                                    </span>
                                </p>
                                <p className="flex gap-3 text-sm leading-relaxed text-slate-600">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                                    <span>
                                        <b className="text-slate-800">Active Trips.</b> Luxury Cars also tracks
                                        which of your bookings are on the road right now.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── What it costs ── */}
                <section id="cost" className="scroll-mt-8 pt-24">
                    <div className="overflow-hidden rounded-[2rem] bg-slate-900 p-10 sm:p-14">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">
                            What it costs
                        </span>
                        <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            We earn when you earn. Not before.
                        </h2>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
                            Signing up, listing your services and using every tool on this page is free.
                            TransRentals takes a standard commission on completed bookings.
                        </p>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            {[
                                'No upfront fee',
                                'No listing charges',
                                'No separate price for the fleet or staff tools',
                            ].map((t) => (
                                <div
                                    key={t}
                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                                >
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
                                    <span className="text-sm font-semibold text-slate-200">{t}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href="/vendor/register"
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-slate-900 transition-colors hover:bg-slate-100"
                            >
                                Register your business
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/vendor"
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-4 font-bold text-white transition-colors hover:bg-white/5"
                            >
                                More about partnering
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Support ── */}
                <section className="pt-10 pb-24">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-10 sm:p-12">
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="max-w-xl">
                                <h3 className="text-2xl font-extrabold text-slate-900">
                                    Stuck somewhere in this?
                                </h3>
                                <p className="mt-3 leading-relaxed text-slate-600">
                                    Our vendor support team can walk you through onboarding, documents, or
                                    anything on the platform that is not behaving.
                                </p>
                            </div>
                            <Link
                                href="/vendor/support"
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white transition-colors hover:bg-slate-700"
                            >
                                Contact Support
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer */}
            <footer className="py-10 border-t border-slate-200 text-center">
                <p className="text-slate-400 text-sm font-medium">
                    © {new Date().getFullYear()} TransRentals. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
