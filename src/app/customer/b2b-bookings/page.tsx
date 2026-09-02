// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Loader2, Building2, Truck, Calendar, MapPin, ChevronRight,
  Clock, CheckCircle, FileText, Car, Bus, Bike, Wrench, Package, Star,
  Filter, IndianRupee, Users, AlertCircle, MessageCircle, RefreshCw, Search,
} from 'lucide-react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';

/* Is page ka apna stylesheet. Har rule `.blx` ke andar scoped hai, isliye yahan
   ke chhote class naam (.chip, .bar, .sheet…) baaki app tak nahi pahunchte. */
const BLX_CSS = `
.blx{
  --paper:#FFFFFF; --card:#FFFFFF; --card-2:#F8FBF9; --sunk:#F2F7F3;
  --rule:#DFE8E2; --rule-2:#CBD9D1;
  --ink:#0A140F; --ink-2:#3F4C45; --muted:#6F7C74; --faint:#9DAAA2; --ghost:#C2CDC6;

  --em-1:#045030; --em-2:#09B368; --em-deep:#04321F; --em-mid:#056B3E;
  --mint:#E9F7F0; --mint-line:#C3E5D4;

  --amber:#B4700F; --amber-deep:#8A5409; --amber-bg:#FDF6E7; --amber-line:#EFE0BE;
  --red:#BE123C; --red-deep:#9F0F32; --red-bg:#FDEBEF; --red-line:#F6C9D4;
  --violet:#6D28D9; --violet-deep:#5B21B6; --violet-bg:#F5F1FE; --violet-line:#DCCEFA;
  --blue:#1D4ED8; --blue-bg:#E8F0FE; --blue-line:#C4D6F6;
  --indigo:#4338CA; --indigo-bg:#EEF0FE;
  --teal:#0B7C74; --teal-bg:#E4F4F2; --teal-line:#BBE2DE;
  --sky:#0369A1; --sky-bg:#E4F2FB;
  --pink:#BE185D; --pink-bg:#FCE9F1;
  --cyan:#0E7490; --cyan-bg:#E2F5F9;
  --gold:#A16207; --gold-bg:#FDF7E3;

  --serif:var(--quote-display),Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  --rest:0 1px 3px rgba(4,50,31,.07), 0 8px 20px -16px rgba(4,50,31,.14);
}
.blx{color:var(--ink); font-size:14px; line-height:1.55; -webkit-font-smoothing:antialiased}
.blx *{box-sizing:border-box}
.blx a{color:inherit; text-decoration:none}
.blx :focus-visible{outline:2px solid var(--em-2); outline-offset:2px; border-radius:8px}
.blx .wrap{max-width:1320px; margin:0 auto; padding:0 26px}
.blx .num{font-variant-numeric:tabular-nums}
.blx .mono{font-family:var(--mono)}
.blx .k{font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--faint)}
.blx .cover{position:relative; overflow:hidden; color:#fff;
  background:linear-gradient(122deg,#042115 0%,#06412A 46%,#067C4A 100%)}
.blx .cover > i{position:absolute; display:block; pointer-events:none}
.blx .cover .ovgrid{inset:0; opacity:.07;
  background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
  background-size:42px 42px}
.blx .cover .ovkey{inset:0; background-image:
  radial-gradient(820px 340px at 86% -40%,rgba(255,255,255,.22),transparent 64%),
  radial-gradient(520px 260px at 0% 135%,rgba(1,25,14,.62),transparent 64%)}
.blx .cover .ovlit{inset-inline:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)}
.blx .cover .wrap{position:relative; z-index:2; padding:36px 26px 0}
.blx .chead{display:flex; align-items:center; gap:20px; flex-wrap:wrap}
.blx .mark{width:52px; height:52px; flex:none; border-radius:17px; display:grid; place-items:center;
  border:1px solid rgba(255,255,255,.24); background:rgba(255,255,255,.12); backdrop-filter:blur(4px)}
.blx .eyebrow{display:flex; align-items:center; gap:9px; margin:0; font-size:10px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.56)}
.blx .eyebrow::before{content:""; width:22px; height:1px; background:rgba(255,255,255,.34)}
.blx .chead h1{margin:8px 0 0; font-family:var(--serif); font-size:36px; font-weight:600;
  line-height:1; letter-spacing:-.02em; text-shadow:0 2px 24px rgba(0,0,0,.3)}
.blx .chead .cnt{margin:8px 0 0; font-size:12.5px; color:rgba(255,255,255,.6)}
.blx .chead .side{margin-left:auto; display:flex; align-items:center; gap:12px; flex-wrap:wrap}
.blx .money{display:flex; align-items:center; gap:18px; border-radius:15px;
  border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.13);
  backdrop-filter:blur(4px); padding:11px 18px}
.blx .money .kk{font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(255,255,255,.55)}
.blx .money .vv{margin-top:4px; font-size:19px; font-weight:700; letter-spacing:-.02em;
  font-variant-numeric:tabular-nums}
.blx .money .sep{width:1px; align-self:stretch; background:rgba(255,255,255,.2)}
.blx .money .hot .kk{color:#F5D9A8}
.blx .money .hot .vv{color:#FBE3BC}
.blx .btn{display:inline-flex; align-items:center; gap:8px; border-radius:12px; padding:10px 17px;
  font-size:13px; font-weight:700; transition:transform .18s, background .18s, border-color .18s, color .18s}
.blx .btn:hover{transform:translateY(-2px)}
.blx .btn.w{background:#fff; color:var(--em-deep); box-shadow:0 14px 26px -16px rgba(0,0,0,.8)}
.blx .btn.g{border:1px solid rgba(255,255,255,.26); background:rgba(255,255,255,.12); color:#fff}
.blx .btn.g:hover{background:rgba(255,255,255,.2)}
.blx .facts{position:relative; z-index:2; margin-top:28px; display:flex; flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.16)}
.blx .fact{flex:1 1 160px; display:flex; align-items:center; gap:12px; padding:18px 20px 20px;
  border-right:1px solid rgba(255,255,255,.14)}
.blx .fact:last-child{border-right:none}
.blx .fact .n{font-size:25px; font-weight:700; letter-spacing:-.025em; line-height:1;
  font-variant-numeric:tabular-nums}
.blx .fact .l{font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:rgba(255,255,255,.6)}
.blx .fact .l small{display:block; margin-top:3px; font-size:10.5px; font-weight:400; letter-spacing:0;
  text-transform:none; color:rgba(255,255,255,.45)}
.blx .fact.zero .n{color:rgba(255,255,255,.42)}
/* rail ka aakhri khaana ek ginti nahi, ek raasta hai — isliye margin-left:auto */
.blx .facts .go3{flex:none; margin-left:auto; display:flex; align-items:center; padding:15px 20px 17px}
.blx .body{padding:22px 0 76px; display:flex; flex-direction:column; gap:16px}
.blx .alert{display:flex; align-items:center; gap:14px; border-radius:16px;
  border:1px solid var(--amber-line); border-left:4px solid var(--amber);
  background:linear-gradient(100deg,var(--amber-bg),var(--card)); padding:15px 18px;
  box-shadow:var(--rest)}
.blx .alert .ic{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--amber-line); color:var(--amber)}
.blx .alert b{display:block; font-family:var(--serif); font-size:21px; font-weight:600; line-height:1.15;
  color:var(--amber-deep)}
.blx .alert p{margin:3px 0 0; font-size:12.5px; color:var(--amber)}
.blx .alert .go{margin-left:auto; flex:none}
.blx .alert[hidden]{display:none}
.blx .bar{border-radius:16px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); padding:13px 16px; display:flex; align-items:center; gap:14px;
  flex-wrap:wrap}
.blx .seg{display:flex; gap:4px; border-radius:12px; border:1px solid var(--rule); background:var(--card-2);
  padding:4px}
.blx .seg button{display:inline-flex; align-items:center; gap:7px; border-radius:9px; padding:7px 13px;
  font-size:12.5px; font-weight:600; color:var(--muted); white-space:nowrap;
  transition:background .18s, color .18s}
.blx .seg button:hover{color:var(--ink-2)}
.blx .seg button .c{border-radius:999px; padding:1px 7px; font-size:11px; font-weight:700;
  background:var(--sunk); color:var(--muted); font-variant-numeric:tabular-nums}
.blx .seg button.on{background:var(--em-mid); color:#fff}
.blx .seg button.on .c{background:rgba(255,255,255,.22); color:#fff}
.blx .find{position:relative; display:flex; align-items:center; min-width:210px; flex:1 1 210px;
  max-width:330px}
.blx .find svg{position:absolute; left:12px; color:var(--faint); pointer-events:none}
.blx .find input{width:100%; border-radius:12px; border:1px solid var(--rule-2); background:var(--card);
  padding:10px 14px 10px 36px; font-size:13.5px;
  transition:border-color .18s, box-shadow .18s}
.blx .find input::placeholder{color:var(--ghost)}
.blx .find input:focus{outline:none; border-color:var(--em-2); box-shadow:0 0 0 4px rgba(9,179,104,.12)}
.blx .svcbar{display:flex; align-items:center; gap:8px; flex-wrap:wrap; width:100%;
  padding-top:13px; border-top:1px solid var(--rule)}
.blx .svcbar > svg{color:var(--faint); flex:none}
.blx .chip{display:inline-flex; align-items:center; gap:7px; border-radius:999px; padding:5px 12px;
  font-size:12px; font-weight:600; border:1px solid var(--rule-2); background:var(--card);
  color:var(--ink-2); white-space:nowrap; text-transform:capitalize;
  transition:border-color .18s, background .18s, color .18s}
.blx .chip:hover{border-color:var(--rule-2); background:var(--card-2)}
.blx .chip.on{border-color:var(--ink); background:var(--ink); color:#fff}
.blx .chip.on .g2{background:rgba(255,255,255,.2); color:#fff}
.blx .chip .g2{width:18px; height:18px; flex:none; border-radius:6px; display:grid; place-items:center}
.blx .sheet{border-radius:18px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); overflow:hidden}
.blx .cap{display:flex; align-items:center; gap:12px; padding:15px 20px; border-bottom:1px solid var(--rule);
  background:var(--card-2); flex-wrap:wrap}
.blx .cap b{font-family:var(--serif); font-size:22px; font-weight:600}
.blx .cap p{margin:2px 0 0; font-size:12px; color:var(--faint)}
.blx .cap .r{margin-left:auto; font-size:12px; color:var(--faint)}
.blx .scroll{overflow-x:auto}
.blx table{width:100%; border-collapse:collapse; min-width:900px}
.blx thead th{position:sticky; top:0; z-index:2; background:var(--card);
  padding:11px 20px; text-align:left; font-size:10px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:var(--faint); border-bottom:1px solid var(--rule); white-space:nowrap}
.blx thead th.r{text-align:right}
.blx tbody tr{border-bottom:1px solid var(--rule); cursor:pointer; transition:background .16s}
.blx tbody tr:last-child{border-bottom:none}
.blx tbody tr:hover{background:var(--card-2)}
.blx tbody td{padding:14px 20px; vertical-align:middle}
.blx tbody td.r{text-align:right}
.blx tbody tr.act{background:linear-gradient(90deg,var(--amber-bg) 0%,#FEFAF1 100%)}
.blx tbody tr.act:hover{background:linear-gradient(90deg,#FAEACB 0%,#FCF4E4 100%)}
.blx tbody tr.act td:first-child{box-shadow:inset 3px 0 0 var(--amber)}
.blx .bk{display:flex; align-items:center; gap:13px; min-width:0}
.blx .bk .g3{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center}
.blx .bk .l1{display:flex; align-items:center; gap:9px; flex-wrap:wrap}
.blx .bk .no{font-family:var(--mono); font-size:13px; font-weight:700; letter-spacing:-.01em;
  white-space:nowrap}
.blx .bk .l2{margin:3px 0 0; font-size:11.5px; color:var(--muted); text-transform:capitalize}
.blx .need{border-radius:999px; padding:2px 8px; font-size:9.5px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; border:1px solid var(--amber-line); background:var(--amber-bg);
  color:var(--amber)}
.blx .rt{display:flex; align-items:center; gap:8px; min-width:0; font-size:13px; color:var(--ink-2)}
.blx .rt i{width:8px; height:8px; flex:none; border-radius:999px; border:2px solid var(--em-2);
  background:var(--card)}
.blx .rt .arw{flex:none; color:var(--ghost)}
.blx .rt .b{width:8px; height:8px; flex:none; border-radius:999px; border:2px solid var(--red);
  background:var(--red)}
.blx .rt span{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:150px}
.blx .dt{font-size:13px; color:var(--ink-2); font-variant-numeric:tabular-nums; white-space:nowrap}
.blx .dt small{display:block; margin-top:2px; font-size:11px; color:var(--faint)}
.blx .st{display:inline-flex; align-items:center; gap:7px; border-radius:999px; padding:4px 11px 4px 9px;
  font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  border:1px solid; white-space:nowrap;
  color:var(--sc); border-color:color-mix(in srgb, var(--sc) 30%, transparent);
  background:color-mix(in srgb, var(--sc) 8%, #fff)}
.blx .st i{width:6px; height:6px; flex:none; border-radius:999px; background:var(--sc)}
.blx .amt{font-size:14px; font-weight:700; letter-spacing:-.01em; font-variant-numeric:tabular-nums}
.blx .amt.none{font-size:12.5px; font-weight:400; color:var(--ghost)}
.blx .amt small{display:block; margin-top:3px; font-size:11px; font-weight:400; color:var(--faint)}
.blx .acts{display:inline-flex; align-items:center; gap:8px}
.blx .chat{width:32px; height:32px; flex:none; border-radius:11px; display:grid; place-items:center;
  border:1px solid var(--mint-line); background:var(--mint); color:var(--em-mid);
  transition:background .18s, transform .18s}
.blx .chat:hover{background:#D8F0E4; transform:translateY(-1px)}
.blx .go2{color:var(--ghost); transition:color .18s, transform .18s}
.blx tbody tr:hover .go2{color:var(--em-2); transform:translateX(2px)}
.blx .empty{padding:64px 24px; text-align:center}
.blx .empty .ic2{width:58px; height:58px; margin:0 auto 16px; border-radius:19px; display:grid;
  place-items:center; border:1px solid var(--rule); background:var(--card-2); color:var(--ghost)}
.blx .empty h3{margin:0; font-family:var(--serif); font-size:24px; font-weight:600}
.blx .empty p{margin:7px 0 0; font-size:13px; color:var(--muted)}
.blx .empty .cta{margin-top:18px}
.blx .btn.o{border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2)}
.blx .btn.o:hover{border-color:var(--em-2); color:var(--em-mid)}
.blx .btn.e{background:linear-gradient(180deg,#0EA47E,#056B3E); color:#fff;
  box-shadow:0 16px 30px -18px rgba(4,50,31,.9)}
.blx .empty[hidden]{display:none}

@media (max-width:900px){.blx .chead .side{margin-left:0; width:100%}
.blx .money{flex:1 1 auto}
}


@media (max-width:820px){.blx .scroll{overflow-x:visible}
.blx table{min-width:0}
.blx thead{display:none}
.blx table, .blx tbody, .blx tbody tr, .blx tbody td{display:block; width:100%}
.blx tbody tr{padding:6px 0 10px}
.blx tbody tr.act td:first-child{box-shadow:none}
.blx tbody tr.act{box-shadow:inset 3px 0 0 var(--amber)}
.blx tbody td{padding:7px 18px}
.blx tbody td.r{text-align:left}
.blx tbody td[data-l]{display:flex; align-items:center; justify-content:space-between; gap:14px}
.blx tbody td[data-l]::before{content:attr(data-l); flex:none;
    font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--faint)}
.blx tbody td:last-child{display:none}
.blx .rt span{max-width:none}
.blx .acts{justify-content:flex-end}
}
@media (prefers-reduced-motion:reduce){.blx *{transition:none !important; animation:none !important} }

/* ── React markup ke liye chhote additions ─────────────────────────────── */
.blx .alert .go{margin-left:auto; flex:none}
.blx .rowlink{display:contents}
.blx .amt small{display:block; margin-top:3px; font-size:11px; font-weight:400; color:var(--faint)}
.blx .fact.zero .l{color:rgba(255,255,255,.44)}
.blx .empty .cta{margin-top:18px}
.blx .spin{display:grid; place-items:center; padding:64px 0}
`;


const STATUS_LABELS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Quotes Received',
  SUPER_QUOTE_SENT: 'Quote Ready', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN_FOR_QUOTES: 'bg-blue-100 text-blue-700 border-blue-200',
  QUOTES_RECEIVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SUPER_QUOTE_SENT: 'bg-purple-100 text-purple-700 border-purple-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRIPS_CREATED: 'bg-teal-100 text-teal-700 border-teal-200',
  IN_PROGRESS: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  INVOICED: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const SERVICE_ICONS: Record<string, any> = {
  car: Car, bus: Bus, bike: Bike, truck: Truck, equipment: Wrench,
  packers: Package, luxury: Star, 'self-drive': Car,
};

const SERVICE_COLORS: Record<string, string> = {
  car: 'bg-purple-50 text-purple-600', bus: 'bg-amber-50 text-amber-600',
  bike: 'bg-blue-50 text-blue-600', truck: 'bg-red-50 text-red-600',
  equipment: 'bg-cyan-50 text-cyan-600', packers: 'bg-pink-50 text-pink-600',
  luxury: 'bg-yellow-50 text-yellow-700', 'self-drive': 'bg-sky-50 text-sky-600',
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

/* Ledger ke liye do naqshe — sirf dikhawe ke. STATUS_COLORS aur SERVICE_COLORS
   jaise the waise hi hain; ye unke wahi hue thos roop me dete hain, taaki pill
   neutral rahe aur rang sirf bindu/tile me aaye. */
const STATUS_INK: Record<string, string> = {
  OPEN_FOR_QUOTES: '#1D4ED8', QUOTES_RECEIVED: '#4338CA', SUPER_QUOTE_SENT: '#6D28D9',
  CONFIRMED: '#047857', TRIPS_CREATED: '#0B7C74', IN_PROGRESS: '#059669',
  COMPLETED: '#4B5563', INVOICED: '#B4700F', PAID: '#047857', CANCELLED: '#BE123C',
};

const SERVICE_TINT: Record<string, { ink: string; bg: string }> = {
  car: { ink: '#6D28D9', bg: '#F5F1FE' },
  bus: { ink: '#B4700F', bg: '#FDF6E7' },
  bike: { ink: '#1D4ED8', bg: '#E8F0FE' },
  truck: { ink: '#BE123C', bg: '#FDEBEF' },
  equipment: { ink: '#0E7490', bg: '#E2F5F9' },
  packers: { ink: '#BE185D', bg: '#FCE9F1' },
  luxury: { ink: '#A16207', bg: '#FDF7E3' },
  'self-drive': { ink: '#0369A1', bg: '#E4F2FB' },
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

const CHAT_ELIGIBLE = ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED'];

function CustomerB2BBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) fetchBookings();
    else setLoading(false);
  }, [customerId]);

  async function fetchBookings() {
    try {
      let res = await fetch(`/api/b2b/bookings?customer_id=${customerId}`);
      let data = await res.json();
      if (data.status === 'success' && data.bookings?.length > 0) {
        setBookings(data.bookings);
      } else {
        const stored = localStorage.getItem('customer');
        if (stored) {
          const customer = JSON.parse(stored);
          if (customer.email) {
            res = await fetch(`/api/b2b/bookings?email=${customer.email}`);
            data = await res.json();
            if (data.status === 'success') setBookings(data.bookings);
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const serviceTypes = useMemo(() => {
    const types = [...new Set(bookings.map((b: any) => b.serviceType))];
    return types.sort();
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      if (serviceFilter !== 'all' && b.serviceType !== serviceFilter) return false;
      if (statusFilter === 'active') return ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status);
      if (statusFilter === 'pending') return ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status);
      if (statusFilter === 'completed') return ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(b.status);
      return true;
    });
  }, [bookings, statusFilter, serviceFilter]);

  const actionNeeded = bookings.filter((b: any) => b.status === 'SUPER_QUOTE_SENT').length;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Stats
  const stats = useMemo(() => {
    const totalValue = bookings.reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const paidValue = bookings.filter((b: any) => b.status === 'PAID').reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    const unpaidValue = bookings.filter((b: any) => ['INVOICED', 'COMPLETED'].includes(b.status)).reduce((sum: number, b: any) => sum + (b.finalAmount || 0), 0);
    return {
      total: bookings.length,
      active: bookings.filter((b: any) => ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS'].includes(b.status)).length,
      pending: bookings.filter((b: any) => ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT'].includes(b.status)).length,
      completed: bookings.filter((b: any) => ['COMPLETED', 'INVOICED', 'PAID'].includes(b.status)).length,
      totalValue, paidValue, unpaidValue,
    };
  }, [bookings]);

  /* ── Sirf is naye UI ke liye. Aapka filteredBookings jaisa tha waisa hi hai;
     ye uske upar ek aur chhalni hai, aur kuch chhote presentational helpers. ── */
  const [query, setQuery] = useState('');
  const flat = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const terms = flat(query).split(' ').filter(Boolean);
  const visibleBookings = terms.length
    ? filteredBookings.filter((b: any) => {
        const hay = flat([
          b.bookingNumber, b.serviceType, b.pickupLocation, b.dropLocation,
          STATUS_LABELS[b.status] || b.status, TRIP_TYPE_LABELS[b.tripType] || b.tripType,
        ].filter(Boolean).join(' '));
        return terms.every((t) => hay.includes(t));
      })
    : filteredBookings;

  const tint = (t: string) => SERVICE_TINT[t] || { ink: 'var(--em-mid)', bg: 'var(--mint)' };
  const svcLabel = (t: string) => (t === 'self-drive' ? 'Self Drive' : t);
  const counts: Record<string, number> = {
    all: bookings.length, active: stats.active, pending: stats.pending, completed: stats.completed,
  };

  return (
    <div className={`${quoteDisplay.variable} blx min-h-screen bg-white`}>
      <CustomerHeader showBackButton backHref="/customer/dashboard" title="B2B Bookings" />
      <style dangerouslySetInnerHTML={{ __html: BLX_CSS }} />

      <main className="pt-16 pb-12">

        {/* ══ masthead ══ */}
        <section className="cover">
          <i className="ovgrid" /><i className="ovkey" /><i className="ovlit" />
          <div className="wrap">

            <div className="chead">
              <span className="mark">
                <Building2 className="w-6 h-6" />
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="eyebrow">Corporate transport</p>
                <h1>B2B Bookings</h1>
                <p className="cnt">
                  <b>{bookings.length}</b> total booking{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="side">
                {bookings.length > 0 && stats.totalValue > 0 && (
                  <div className="money">
                    <div>
                      <p className="kk">Total value</p>
                      <p className="vv">₹{stats.totalValue.toLocaleString('en-IN')}</p>
                    </div>
                    {stats.unpaidValue > 0 && (
                      <>
                        <span className="sep" />
                        <div className="hot">
                          <p className="kk">Pending payment</p>
                          <p className="vv">₹{stats.unpaidValue.toLocaleString('en-IN')}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="facts">
              {bookings.length > 0 && (
                <>
                  {[
                    { l: 'Total', v: stats.total, s: 'All time' },
                    { l: 'Active', v: stats.active, s: 'Confirmed & running' },
                    { l: 'Pending', v: stats.pending, s: 'Out for quotes' },
                    { l: 'Completed', v: stats.completed, s: 'Delivered & invoiced' },
                  ].map((f) => (
                    <div key={f.l} className={`fact ${f.v ? '' : 'zero'}`}>
                      <span className="n">{f.v}</span>
                      <span className="l">{f.l}<small>{f.s}</small></span>
                    </div>
                  ))}
                </>
              )}

              <div className="go3">
                <Link href={`/customer/b2b-bookings/invoices?customer_id=${customerId}`} className="btn w">
                  <FileText className="w-3.5 h-3.5" /> Invoices
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap">
          <div className="body">

            {/* ══ jise aapki manzoori chahiye ══ */}
            {actionNeeded > 0 && (
              <div className="alert">
                <span className="ic"><AlertCircle className="w-4 h-4" /></span>
                <div>
                  <b>{actionNeeded} Quote{actionNeeded > 1 ? 's' : ''} Ready for Review</b>
                  <p>Review and accept to confirm your booking</p>
                </div>
              </div>
            )}

            {/* ══ chhaanne ki patti ══ */}
            {bookings.length > 0 && (
              <div className="bar">
                <div className="seg">
                  {STATUS_FILTERS.map((f) => (
                    <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                      className={statusFilter === f.key ? 'on' : ''}>
                      {f.label}
                      <span className="c">{counts[f.key]}</span>
                    </button>
                  ))}
                </div>

                <div className="find">
                  <Search className="w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search booking no., route or service"
                  />
                </div>

                {serviceTypes.length > 1 && (
                  <div className="svcbar">
                    <Filter className="w-3.5 h-3.5" />
                    <button type="button" onClick={() => setServiceFilter('all')}
                      className={`chip ${serviceFilter === 'all' ? 'on' : ''}`}>
                      All services
                    </button>
                    {serviceTypes.map((st: string) => {
                      const Icon = SERVICE_ICONS[st] || Truck;
                      const c = tint(st);
                      return (
                        <button key={st} type="button" onClick={() => setServiceFilter(st)}
                          className={`chip ${serviceFilter === st ? 'on' : ''}`}>
                          <span className="g2" style={{ background: c.bg, color: c.ink }}>
                            <Icon className="w-3 h-3" />
                          </span>
                          {svcLabel(st)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ ledger ══ */}
            <div className="sheet">
              <div className="cap">
                <div>
                  <b>Corporate Bookings</b>
                  <p>Raised by your company</p>
                </div>
                <span className="r">Showing <b>{visibleBookings.length}</b> of <b>{bookings.length}</b></span>
              </div>

              {loading ? (
                <div className="spin"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--em-2)' }} /></div>
              ) : !customerId ? (
                <div className="empty">
                  <span className="ic2"><AlertCircle className="w-6 h-6" /></span>
                  <h3>Customer ID required</h3>
                  <p>Sign in again to see your corporate bookings.</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="empty">
                  <span className="ic2"><Building2 className="w-6 h-6" /></span>
                  <h3>No B2B bookings yet</h3>
                  <p>No corporate bulk bookings found</p>
                  <div className="cta"><Link href="/" className="btn e">Go to Home</Link></div>
                </div>
              ) : visibleBookings.length === 0 ? (
                <div className="empty">
                  <span className="ic2"><Filter className="w-6 h-6" /></span>
                  <h3>Nothing matches those filters</h3>
                  <p>No bookings match the selected filters</p>
                </div>
              ) : (
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="r">Amount</th>
                        <th className="r"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBookings.map((b: any) => {
                        const ServiceIcon = SERVICE_ICONS[b.serviceType] || Truck;
                        const isActionNeeded = b.status === 'SUPER_QUOTE_SENT';
                        const canChat = CHAT_ELIGIBLE.includes(b.status);
                        const detailHref = `/customer/b2b-bookings/${b.id}?customer_id=${customerId}`;
                        const c = tint(b.serviceType);
                        return (
                          <tr key={b.id} onClick={() => window.location.href = detailHref}
                            className={isActionNeeded ? 'act' : ''}>
                            <td>
                              <div className="bk">
                                <span className="g3" style={{ background: c.bg, color: c.ink }}>
                                  <ServiceIcon className="w-4 h-4" />
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div className="l1">
                                    <span className="no">{b.bookingNumber}</span>
                                    {isActionNeeded && <span className="need">Action needed</span>}
                                  </div>
                                  <p className="l2">
                                    {svcLabel(b.serviceType)} &middot; {b.vehiclesRequired} vehicle{b.vehiclesRequired > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td data-l="Route">
                              <div className="rt">
                                <i />
                                <span>{b.pickupLocation}</span>
                                {b.dropLocation && (
                                  <>
                                    <ChevronRight className="arw w-3.5 h-3.5" />
                                    <span>{b.dropLocation}</span>
                                    <span className="b" />
                                  </>
                                )}
                              </div>
                            </td>

                            <td data-l="Date">
                              <span className="dt">
                                {formatDate(b.scheduledDate)}
                                {b.tripType && <small>{TRIP_TYPE_LABELS[b.tripType] || b.tripType}</small>}
                              </span>
                            </td>

                            <td data-l="Status">
                              <span className="st" style={{ ['--sc' as any]: STATUS_INK[b.status] || 'var(--muted)' }}>
                                <i />
                                {STATUS_LABELS[b.status] || b.status}
                              </span>
                            </td>

                            <td className="r" data-l="Amount" onClick={(e) => e.stopPropagation()}>
                              <span className="acts">
                                {b.finalAmount > 0 ? (
                                  <span>
                                    <p className="amt">₹{b.finalAmount.toLocaleString('en-IN')}</p>
                                    {b._count?.trips > 0 && <small>{b._count.trips} trips</small>}
                                  </span>
                                ) : (
                                  <p className="amt none">Not quoted yet</p>
                                )}
                                {canChat && (
                                  <button type="button" className="chat" title="Chat"
                                    onClick={(e) => { e.stopPropagation(); router.push(`${detailHref}&open_chat=1`); }}>
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </span>
                            </td>

                            <td className="r">
                              <ChevronRight className="go2 w-4 h-4" style={{ marginLeft: 'auto' }} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export default function CustomerB2BBookingsPage() {
  return (
    <Suspense fallback={<div className={`${quoteDisplay.variable} flex items-center justify-center min-h-screen bg-[#F8FAF9]`}><div className="animate-spin w-9 h-9 border-4 border-[#09B368] border-t-transparent rounded-full" /></div>}>
      <CustomerB2BBookingsContent />
    </Suspense>
  );
}
