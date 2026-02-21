'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
    UserPlus,
    LogIn,
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
                <p className="text-white font-bold text-sm">Create Your Vendor Account</p>
            </div>
            <div className="p-4 space-y-3">
                <Field label="Company / Business Name" value="Sharma Travels Pvt. Ltd." hint="Use your legal registered name" pin={1} color="blue" />
                <Field label="Owner / Director Name" value="Rajesh Sharma" pin={2} color="blue" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Email Address" value="rajesh@sharmatravels.com" />
                    <Field label="Phone Number" value="+91 98765 43210" pin={3} color="blue" />
                </div>
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold mt-1">
                    Continue to Step 2 →
                </div>
            </div>
            <PinLegend items={['Legal business name', 'Director / owner', 'OTP verification']} color="blue" />
        </div>
    );
}

function RegStep2Mock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-5 py-3">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Step 2 of 2</p>
                <p className="text-white font-bold text-sm">Business Details</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="GST Number" value="27AABCS1429B1ZB" hint="15-digit GSTIN" pin={1} color="blue" />
                    <Field label="PAN Number" value="AABCS1429B" hint="10-character PAN" pin={2} color="blue" />
                </div>
                <Field label="Business Address" value="123, MG Road, Andheri West" />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="City" value="Mumbai" />
                    <Field label="Pincode" value="400053" />
                </div>
                <Field label="Password" value="••••••••••" hint="Minimum 8 characters" pin={3} color="blue" />
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold">Register Account →</div>
            </div>
            <PinLegend items={['Must match GST certificate', 'Business PAN', 'Min 8 chars']} color="blue" />
        </div>
    );
}

function RegSuccessMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 py-8 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-bold text-base">Registration Successful!</p>
                <p className="text-green-100 text-xs mt-1">Your vendor account is ready</p>
            </div>
            <div className="p-5 space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Vendor ID</p>
                    <p className="text-2xl font-black text-slate-800 mt-1 tracking-widest">TR-VEN-02341</p>
                    <p className="text-[10px] text-slate-400 mt-1">Save this for future reference</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <span className="text-base">📧</span>
                    <p className="text-xs text-blue-700 font-medium">Verification email sent to rajesh@sharmatravels.com</p>
                </div>
                <div className="bg-blue-600 text-white rounded-lg py-2 text-center text-xs font-bold">Proceed to Login →</div>
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
                <Field label="Registered Email" value="rajesh@sharmatravels.com" pin={1} color="indigo" />
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
            <PinLegend items={['Email from registration', 'Password you set at signup']} color="indigo" />
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
        { name: 'GST Certificate', status: 'VERIFIED', pin: 1, style: 'bg-green-50 border-green-200 text-green-700', icon: '✅' },
        { name: 'PAN Card', status: 'UNDER REVIEW', pin: 2, style: 'bg-amber-50 border-amber-200 text-amber-700', icon: '⏳' },
        { name: 'Address Proof', status: 'PENDING UPLOAD', pin: 3, style: 'bg-red-50 border-red-200 text-red-700', icon: '❌' },
        { name: 'Aadhaar (Optional)', status: 'UPLOAD', pin: null, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
        { name: 'Cancelled Cheque', status: 'UPLOAD', pin: null, style: 'bg-slate-50 border-slate-200 text-slate-500', icon: '—' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-purple-700 px-5 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">KYC Documents</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">1 / 3 Done</span>
            </div>
            <div className="divide-y divide-slate-100">
                {docs.map(d => (
                    <div key={d.name} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <span className="text-sm">{d.icon}</span>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{d.name}</p>
                            </div>
                            {d.pin && <Pin n={d.pin} color="purple" />}
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${d.style}`}>{d.status}</span>
                    </div>
                ))}
            </div>
            <PinLegend items={['Already approved', 'Being checked by admin', 'Click to upload']} color="purple" />
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
                <p className="text-purple-200 text-xs mt-0.5">All required documents approved</p>
            </div>
            <div className="p-5 space-y-2">
                {['GST Certificate', 'PAN Card', 'Address Proof'].map(d => (
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
                    <p className="text-white font-bold text-sm">Select Your Cities</p>
                    <p className="text-teal-200 text-[10px]">Where do you offer your fleet?</p>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">3 selected</span>
            </div>
            <div className="p-4 space-y-3">
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
                    <p className="text-xs text-teal-700 font-medium">Mumbai, Pune, Nagpur selected — Admin will review your request within 24–48 hrs</p>
                </div>
                <div className="bg-teal-700 text-white rounded-lg py-2 text-center text-xs font-bold">Submit Location Request →</div>
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
                <p className="text-white font-bold text-sm">Select Service Categories</p>
                <p className="text-teal-200 text-[10px] mt-0.5">Choose what fleet you operate</p>
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
                <p className="text-amber-100 text-xs mt-0.5">Typical review time: 24–48 hours</p>
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
   STEP 10 — RECEIVE & VIEW QUOTE REQUESTS
   ───────────────────────────────────────────────────────────── */

function RequestsListMock() {
    const requests = [
        { id: 'BRQ-0024', ago: '2 hrs ago', vehicle: 'Honda Activa 6G', city: 'Mumbai', days: 3, helmets: 2, budget: '₹600–₹900/day', quotes: 5, status: 'new' },
        { id: 'BRQ-0023', ago: '5 hrs ago', vehicle: 'Royal Enfield Classic 350', city: 'Goa', days: 5, helmets: 1, budget: null, quotes: 2, status: 'quoted' },
    ];
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-700 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-sm">Bike Rental Requests</p>
                    <p className="text-sky-200 text-[10px]">Incoming customer requests</p>
                </div>
                <span className="bg-orange-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full">3 New</span>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
                {['New Requests', 'My Quotes', 'All'].map((t, i) => (
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
                                {r.status === 'new' ? 'NEW' : '✓ QUOTED'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">🏍️ {r.vehicle}</p>
                            <p className="text-[10px] text-slate-500">📍 {r.city} · {r.days} days · {r.helmets} helmets</p>
                            {r.budget && <p className="text-[10px] text-slate-500">💰 Budget: {r.budget}</p>}
                            <p className="text-[10px] text-slate-400">{r.quotes} quotes received so far</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 text-[10px] font-bold bg-slate-100 text-slate-600 py-1.5 rounded-lg">View Details</button>
                            {r.status === 'new'
                                ? <button className="flex-1 text-[10px] font-bold bg-sky-600 text-white py-1.5 rounded-lg">Send Quote →</button>
                                : <button className="flex-1 text-[10px] font-bold bg-green-600 text-white py-1.5 rounded-lg">View Your Quote</button>
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
                <p className="text-sky-200 text-[10px] font-semibold">REQUEST DETAILS</p>
                <p className="text-white font-bold text-sm">#BRQ-2024-0024</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {[
                        ['Vehicle', '🏍️ Honda Activa 6G'],
                        ['Location', '📍 Mumbai'],
                        ['Pickup', 'Jan 15, 2026 · 10:00 AM'],
                        ['Dropoff', 'Jan 18, 2026 · 10:00 AM'],
                        ['Duration', '3 days'],
                        ['Helmets', '2 required'],
                        ['Budget', '₹600 – ₹900 / day'],
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
                        <p className="text-[10px] text-slate-400">+91 98xxx xxxxx · Revealed after quoting</p>
                    </div>
                </div>
                <div className="bg-sky-600 text-white rounded-lg py-2 text-center text-xs font-bold">Send Quote for this Request →</div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   STEP 11 — SEND A QUOTE
   ───────────────────────────────────────────────────────────── */

function QuoteVehicleSelectMock() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-700 px-4 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Send Quote</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">#BRQ-0024</span>
            </div>
            <div className="p-4 space-y-3">
                {/* Request summary bar */}
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Request Summary</p>
                    <p className="text-xs font-bold text-slate-700">🏍️ Honda Activa 6G · Mumbai · 3 days</p>
                    <p className="text-[10px] text-slate-500">Jan 15 → Jan 18 · 2 helmets needed · Budget: ₹600–₹900/day</p>
                </div>
                {/* Template */}
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        Quick Fill with Template <span className="text-slate-300 font-normal">(optional)</span>
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                        Standard Bike Rental <span className="text-slate-300">▾</span>
                    </div>
                </div>
                {/* Fleet selection */}
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Select from Your Fleet <Pin n={1} color="blue" />
                    </label>
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg px-3 py-2 text-xs text-emerald-800 font-bold flex items-center justify-between">
                        Honda Activa 6G · MH-04-AB-1234 <span className="text-emerald-400">✓</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Bike Name *" value="Honda Activa 6G" />
                    <Field label="Brand" value="Honda" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Registration No." value="MH-04-AB-1234" />
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Helmets Included</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium flex items-center justify-between">
                            2 Helmets <span className="text-slate-300">▾</span>
                        </div>
                    </div>
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
                <p className="text-emerald-200 text-[10px]">3-day rental · Customer budget: ₹600–₹900/day</p>
            </div>
            <div className="p-4 space-y-3">
                {/* Hero price field */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-3 h-3" /> Total Price (3 days) * <Pin n={1} color="blue" />
                    </label>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-lg font-black text-blue-700">₹</span>
                        <div className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-xl font-black text-blue-700 flex-1">2,400</div>
                    </div>
                    <p className="text-[10px] text-blue-500 mt-1">₹800/day × 3 days (suggested)</p>
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
    const inclusions = ['Bike with full tank', 'Helmet(s) included', 'Valid insurance', 'Basic maintenance', 'Roadside assistance'];
    const exclusions = ['Fuel charges', 'Traffic challans/fines', 'Damage due to misuse', 'Personal accident coverage'];
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
                        "Bike is in excellent condition, serviced last week. Please carry your original driving license at pickup."
                    </div>
                </div>
                {/* Self-Drive extra note */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">Self-Drive? Extra fields appear:</p>
                    <div className="space-y-1">
                        {['Transmission (Manual / Automatic)', 'Fuel Type (Petrol / CNG / Electric…)', 'Seats (4 / 5 / 6 / 7 seater)', 'Delivery Charges (if customer requested delivery)', 'Pickup Charges'].map(f => (
                            <div key={f} className="flex items-center gap-1.5 text-[10px] text-blue-700">
                                <span className="text-blue-400">+</span>{f}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-emerald-600 text-white rounded-xl py-3 text-center text-sm font-black">
                    Send Quote (₹2,400) →
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-green-700">Quote sent successfully!</p>
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
        { id: 'BKQ-0024', vehicle: 'Honda Activa 6G', city: 'Mumbai', days: 3, total: '₹2,400', status: 'ACCEPTED', statusStyle: 'bg-green-100 text-green-700 border-green-200' },
        { id: 'BKQ-0023', vehicle: 'Royal Enfield Classic 350', city: 'Goa', days: 5, total: '₹8,500', status: 'VIEWED', statusStyle: 'bg-purple-100 text-purple-700 border-purple-200' },
        { id: 'BKQ-0022', vehicle: 'Yamaha FZ-S V3', city: 'Pune', days: 2, total: '₹2,800', status: 'SENT', statusStyle: 'bg-blue-100 text-blue-700 border-blue-200' },
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
                        <p className="text-xs font-bold text-slate-800">🏍️ {q.vehicle}</p>
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
                <span className="text-[10px] font-black bg-white/20 text-white px-2.5 py-1 rounded-full">#BKQ-2024-0024</span>
                <p className="text-white font-bold text-sm mt-2">✅ Quote Accepted!</p>
                <p className="text-green-100 text-[10px] mt-0.5">Customer accepted your quote</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                    {[
                        ['Vehicle', 'Honda Activa 6G (2022)'],
                        ['Helmets', '2 included'],
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
                    <span>🔑</span> Generate &amp; Send OTP to Customer
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
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Auto-advances to next box as you type</span>
                    <span className="text-blue-500 font-bold cursor-pointer">Resend (0:47)</span>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-black">
                    Verify OTP &amp; Start Trip 🚀
                </button>
                <p className="text-[10px] text-slate-400 text-center">OTP valid for 15 minutes · Expires at 10:15 AM</p>
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
                        ['KM Limit', '300 km total (100/day)'],
                        ['Extra KM Rate', '₹12 / km beyond limit'],
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
                    🏁 End Trip &amp; Complete Booking
                </button>
            </div>
        </div>
    );
}

/* — Complete trip form — */
function CompleteTrip() {
    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-orange-600 px-4 py-3 flex items-center justify-between">
                <p className="text-white font-bold text-sm">Complete Trip</p>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">#BKG-0341</span>
            </div>
            <div className="p-4 space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-sm">ℹ️</span>
                    <p className="text-[10px] text-amber-700 font-medium">Extra KM charges will be auto-calculated from the odometer reading.</p>
                </div>
                <Field label="Odometer End Reading (km)" value="11,243" hint="Check the bike's odometer at return" pin={1} color="orange" />
                <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        Damage Notes <span className="text-slate-300 font-normal">(optional)</span>
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[52px] text-xs text-slate-400 italic">
                        Minor scratches on left panel noted and photographed…
                    </div>
                </div>
                <Field label="Additional Charges (₹)" value="0" hint="Damage fees, cleaning, late return, etc." pin={2} color="orange" />
                {/* Auto-calculation preview */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Auto-calculated Summary</p>
                    {[
                        ['Odometer Start', '10,943 km'],
                        ['Odometer End', '11,243 km'],
                        ['Total KM Used', '300 km (within limit ✅)'],
                        ['Extra KM Charges', '₹0'],
                        ['Additional Charges', '₹0'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                            <span className="text-slate-400">{k}</span>
                            <span className="font-bold text-slate-700">{v}</span>
                        </div>
                    ))}
                </div>
                <button className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-black">✅ Mark Trip as Completed</button>
            </div>
            <PinLegend items={['Auto-calculates extra KM charges', 'Damage / late fees if any']} color="orange" />
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
                        ['Total KM', '300 km (no extra charges)'],
                        ['Base Amount', '₹2,400'],
                        ['Extra Charges', '₹0'],
                        ['Net Payable', '₹2,400 ✅'],
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

const steps = [
    {
        id: 1,
        title: 'Registration',
        icon: <UserPlus className="w-6 h-6" />,
        description: 'Provide your business identity and contact info across two simple steps.',
        url: 'https://transrentals.in/vendor/register',
        color: 'blue',
        tips: [
            'Step 1: Company Name, Owner, Email & Phone',
            'Step 2: GST/PAN, Address, City & Pincode',
            'Password: Minimum 8 characters',
        ],
        slides: [
            { label: 'Step 1 – Basic Info', mockup: <RegStep1Mock /> },
            { label: 'Step 2 – Business Details', mockup: <RegStep2Mock /> },
            { label: 'Success Screen', mockup: <RegSuccessMock /> },
        ],
    },
    {
        id: 2,
        title: 'Login',
        icon: <LogIn className="w-6 h-6" />,
        description: 'Access your secure vendor dashboard using your registered email and password.',
        url: 'https://transrentals.in/vendor/login',
        color: 'indigo',
        tips: [
            'Enter your registered business email',
            'Use the password set during registration',
            'SSL Encrypted & Secure',
        ],
        slides: [
            { label: 'Login Screen', mockup: <LoginScreenMock /> },
            { label: 'Dashboard Welcome', mockup: <DashboardWelcomeMock /> },
        ],
    },
    {
        id: 3,
        title: 'Document Upload (KYC)',
        icon: <FileCheck className="w-6 h-6" />,
        description: 'Submit your tax and business proofs for verification. Required: GST, PAN, Address Proof.',
        url: '/vendor/documents',
        color: 'purple',
        tips: [
            'Required: GST Certificate, PAN, Address Proof',
            'Optional: Aadhaar, Cancelled Cheque',
            'Format: PDF / JPG / PNG (Max 5 MB)',
        ],
        slides: [
            { label: 'Document List', mockup: <DocListMock /> },
            {
                label: 'Upload GST Certificate',
                mockup: (
                    <UploadModalMock
                        docName="GST Certificate"
                        requirements={[
                            'Clear & readable scan or photo',
                            'Must show your GSTIN number clearly',
                            'File should not be expired',
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
                            'Name must match registration details',
                            'JPG or PNG preferred',
                        ]}
                    />
                ),
            },
            { label: 'All Documents Approved', mockup: <DocsApprovedMock /> },
        ],
    },
    {
        id: 4,
        title: 'Service & Location Requests',
        icon: <MapPin className="w-6 h-6" />,
        description: 'Define where you operate and what fleet you bring to TransRentals.',
        url: '/vendor/locations',
        color: 'teal',
        tips: [
            'Select cities where you have your fleet',
            'Request service categories (Bike/Car/Bus/Truck)',
            'Admin reviews and approves your request',
        ],
        slides: [
            { label: 'Select Cities', mockup: <LocationSelectMock /> },
            { label: 'Select Services', mockup: <ServiceSelectMock /> },
            { label: 'Request Under Review', mockup: <UnderReviewMock /> },
        ],
    },
    {
        id: 5,
        title: 'Select Service & Vehicle Model',
        icon: <Layers className="w-6 h-6" />,
        description: 'Choose which service this vehicle is for, then pick the exact make & model from our catalogue. Car Rental uses a category + brand path instead.',
        url: '/vendor/fleet/add',
        color: 'violet' as string,
        tips: [
            'Pick service: Bike, Self-Drive, Car Rental, Bus, Luxury, Truck…',
            'For Bike / Self-Drive / Bus / Luxury: search & select model',
            'For Car Rental (with driver): select category + brand (no model)',
        ],
        slides: [
            { label: 'Fleet List → Add Vehicle', mockup: <FleetListMock /> },
            { label: 'Select Service', mockup: <ServiceSelectionMock /> },
            { label: 'Search & Select Model (Bike / Self-Drive / Bus)', mockup: <ModelSelectionMock /> },
            { label: 'Car Rental: Category + Brand path', mockup: <CarCategoryBrandMock /> },
        ],
    },
    {
        id: 6,
        title: 'Vehicle Details & Images',
        icon: <Car className="w-6 h-6" />,
        description: 'Enter the registration number, year, and color. Then upload photos from 5 angles — vehicles with images receive significantly more bookings.',
        url: '/vendor/fleet/add',
        color: 'violet' as string,
        tips: [
            'Registration number auto-converts to UPPERCASE',
            'Upload up to 5 images: Front, Back, Left, Right, Interior',
            'Images are optional but strongly recommended (more bookings)',
        ],
        slides: [
            { label: 'Basic Details (Reg No / Year / Color)', mockup: <VehicleDetailsMock /> },
            { label: 'Upload 5-angle vehicle photos', mockup: <VehicleImagesMock /> },
        ],
    },
    {
        id: 7,
        title: 'Choose Operating Locations',
        icon: <MapPin className="w-6 h-6" />,
        description: 'Select which of your approved cities this vehicle will be listed in. Only cities approved in Step 4 appear here.',
        url: '/vendor/fleet/add',
        color: 'teal' as string,
        tips: [
            'Only your admin-approved cities are shown',
            'Use "Select All" to enable all cities at once',
            'Vehicle will appear in listings for each selected city',
        ],
        slides: [
            { label: 'Select cities for this vehicle', mockup: <OperatingLocationsMock /> },
        ],
    },
    {
        id: 8,
        title: 'Set General Pricing',
        icon: <Tag className="w-6 h-6" />,
        description: 'Define your base rental rates. This step applies to Bike Rental, Self-Drive, and Bus Rental only — Truck, Equipment, Luxury & Car Rental use quote-based or admin-managed pricing.',
        url: '/vendor/fleet/add',
        color: 'blue' as string,
        tips: [
            'Per Day Rate is required and must be greater than ₹0',
            'Km Limit defaults to 100 km/day if left blank',
            'Security Deposit is refundable — collected at pickup',
        ],
        slides: [
            { label: 'Set Per Day Rate, Km Limit & Deposit', mockup: <GeneralPricingMock /> },
            { label: 'Pricing Summary before proceeding', mockup: <PricingSummaryMock /> },
        ],
    },
    {
        id: 9,
        title: 'City-wise Pricing',
        icon: <MapPin className="w-6 h-6" />,
        description: 'Optionally override the base price per city. Applies to Bike Rental and Self-Drive only. Leave blank to use the base rate everywhere.',
        url: '/vendor/fleet/add',
        color: 'indigo' as string,
        tips: [
            'Only for Bike Rental and Self-Drive services',
            'Leave any field blank → base price is used for that city',
            'Useful when your Mumbai rate differs from Nashik rate',
        ],
        slides: [
            { label: 'Per-city pricing overrides', mockup: <CityPricingMock /> },
            { label: 'Vehicle added successfully', mockup: <VehicleAddedSuccessMock /> },
        ],
    },
    {
        id: 10,
        title: 'Receive & View Quote Requests',
        icon: <FileCheck className="w-6 h-6" />,
        description: 'Customers send rental requests — you see them in real time under "New Requests". View the full request details before deciding to quote.',
        url: '/vendor/bike-rentals/requests',
        color: 'sky' as string,
        tips: [
            'Tab: "New Requests" shows unquoted requests',
            'Tab: "My Quotes" shows requests you already replied to',
            'Full customer notes & contact revealed after quoting',
        ],
        slides: [
            { label: 'Requests list with status tabs', mockup: <RequestsListMock /> },
            { label: 'Request detail — customer info & notes', mockup: <RequestDetailMock /> },
        ],
    },
    {
        id: 11,
        title: 'Send a Quote',
        icon: <Tag className="w-6 h-6" />,
        description: 'Fill your price, select vehicle from fleet, set inclusions/exclusions, and send the quote. Self-Drive quotes have extra fields: transmission, fuel type, and delivery charges.',
        url: '/vendor/bike-rentals/requests',
        color: 'emerald' as string,
        tips: [
            'Select vehicle from fleet → auto-fills bike name, brand, reg. no.',
            'Total Price = full rental period (not per day)',
            'Self-Drive: also fill transmission, fuel type, seats & delivery charges',
        ],
        slides: [
            { label: 'Select vehicle from fleet', mockup: <QuoteVehicleSelectMock /> },
            { label: 'Set total price, deposit, KM limit & advance', mockup: <QuotePricingMock /> },
            { label: 'Customise inclusions, exclusions & terms', mockup: <QuoteInclusionsMock /> },
            { label: 'Add notes & submit quote', mockup: <QuoteSubmitMock /> },
        ],
    },
    {
        id: 12,
        title: 'Manage Your Quotes',
        icon: <CheckCircle2 className="w-6 h-6" />,
        description: 'Track every quote you have sent — see if it was Viewed, Accepted, or Expired. Withdraw a quote if needed, or proceed to the booking once accepted.',
        url: '/vendor/bike-rentals/quotes',
        color: 'purple' as string,
        tips: [
            'Status: Sent → Viewed → Accepted (or Rejected / Expired)',
            'Accepted quotes automatically become bookings',
            'You can Withdraw any Sent or Viewed quote',
        ],
        slides: [
            { label: 'Quotes list with status & stats', mockup: <QuotesListMock /> },
            { label: 'Accepted quote detail & booking link', mockup: <QuoteDetailMock /> },
        ],
    },
    {
        id: 13,
        title: 'OTP Verification & Trip Lifecycle',
        icon: <ShieldCheck className="w-6 h-6" />,
        description: 'Every trip starts with a secure 6-digit OTP. You generate it, customer receives it on their phone, you verify it to start the trip — and complete it with odometer reading at return.',
        url: '/vendor/bike-rentals/bookings',
        color: 'purple' as string,
        tips: [
            'Click "Generate & Send OTP" on accepted booking → customer gets push notification',
            'Ask customer for their OTP → enter all 6 digits to start the trip',
            'On return: enter odometer reading — extra KM charges are auto-calculated',
        ],
        slides: [
            { label: 'Booking accepted — Generate OTP button', mockup: <BookingAcceptedMock /> },
            { label: 'OTP sent — customer push notification + display', mockup: <OtpSentMock /> },
            { label: 'Vendor enters 6-digit OTP from customer', mockup: <VendorOtpEntryMock /> },
            { label: 'Trip in progress', mockup: <TripInProgressMock /> },
            { label: 'Complete trip — odometer + damage notes', mockup: <CompleteTrip /> },
            { label: 'Trip completed — booking closed', mockup: <TripCompletedMock /> },
        ],
    },
    {
        id: 14,
        title: 'Dashboard & Earnings',
        icon: <Zap className="w-6 h-6" />,
        description: 'Grow your business with real-time stats, bookings, and service performance.',
        url: '/vendor/dashboard',
        color: 'orange',
        tips: [
            'Track monthly revenue at a glance',
            'Service-wise performance breakdown',
            'Instant booking notifications',
        ],
        slides: [
            { label: 'Dashboard Overview', mockup: <DashboardOverviewMock /> },
            { label: 'Monthly Earnings', mockup: <EarningsCardMock /> },
            { label: 'Service Performance', mockup: <ServicePerfMock /> },
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
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */

export default function VendorGuidePage() {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Hero */}
            <div className="relative bg-[#0f172a] py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 -right-10 w-72 h-72 bg-indigo-500 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-5xl mx-auto relative z-10 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <ShieldCheck className="w-4 h-4" /> Official Vendor Guide
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                        Grow Your Business with{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            TransRentals
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Follow our simple 14-step process to become a verified partner and start serving
                        thousands of customers across India.
                    </p>
                </div>
            </div>

            {/* Steps */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 pb-24">
                <div className="grid gap-10">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* LEFT: Instructions */}
                                <div className="p-10 flex flex-col justify-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}>
                                            {step.icon}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                Phase {step.id < 10 ? `0${step.id}` : step.id}
                                            </span>
                                            <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                                {step.title}
                                            </h2>
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
                                                    <CheckCircle2 className={`w-4 h-4 mt-0.5 text-${step.color}-500 flex-shrink-0`} />
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
                    ))}
                </div>

                {/* Support Section */}
                <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <Zap className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h3 className="text-3xl font-bold mb-4">Still have questions?</h3>
                        <p className="text-blue-50 text-lg mb-8 opacity-90">
                            Our dedicated Vendor Support team is available 24/7 to help you with onboarding
                            or any technical issues.
                        </p>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Link
                                href="/vendor/support"
                                className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-colors"
                            >
                                Contact Support
                            </Link>
                            <div className="flex items-center gap-3 text-blue-100">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase font-bold tracking-wider opacity-60">Avg. Response Time</p>
                                    <p className="font-semibold text-white">Less than 2 hours</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
