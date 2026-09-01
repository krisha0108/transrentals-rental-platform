// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';

/* Is page ka apna stylesheet. Har rule `.ivx` ke andar scoped hai, isliye yahan
   ke chhote class naam (.cover, .fact, .st…) baaki app tak nahi pahunchte. */
const IVX_CSS = `
.ivx{
  --paper:#FFFFFF; --card:#FFFFFF; --card-2:#F8FBF9; --sunk:#F2F7F3;
  --rule:#DFE8E2; --rule-2:#CBD9D1;
  --ink:#0A140F; --ink-2:#3F4C45; --muted:#6F7C74; --faint:#9DAAA2; --ghost:#C2CDC6;

  --em-1:#045030; --em-2:#09B368; --em-deep:#04321F; --em-mid:#056B3E;
  --mint:#E9F7F0; --mint-line:#C3E5D4;

  --amber:#B4700F; --amber-deep:#8A5409; --amber-bg:#FDF6E7; --amber-line:#EFE0BE;
  --red:#BE123C; --red-deep:#9F0F32; --red-bg:#FDEBEF; --red-line:#F6C9D4;
  --blue:#1D4ED8; --blue-bg:#E8F0FE; --blue-line:#C4D6F6;
  --slate:#4B5563; --slate-bg:#F1F3F5; --slate-line:#DDE1E6;

  --serif:var(--quote-display),Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  --rest:0 1px 3px rgba(4,50,31,.07), 0 8px 20px -16px rgba(4,50,31,.14);
}
.ivx{color:var(--ink); font-size:14px; line-height:1.55; -webkit-font-smoothing:antialiased;
  background:var(--paper); min-height:100vh}
.ivx *{box-sizing:border-box}
.ivx a{color:inherit; text-decoration:none}
.ivx :focus-visible{outline:2px solid var(--em-2); outline-offset:2px; border-radius:8px}
.ivx [hidden]{display:none !important}
.ivx .wrap{max-width:1180px; margin:0 auto; padding:0 26px}
.ivx .num{font-variant-numeric:tabular-nums}
.ivx .mono{font-family:var(--mono)}
.ivx .k{font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--faint)}
.ivx .cover{position:relative; overflow:hidden; color:#fff;
  background:linear-gradient(122deg,#042115 0%,#06412A 46%,#067C4A 100%)}
.ivx .cover > i{position:absolute; display:block; pointer-events:none}
.ivx .cover .ovgrid{inset:0; opacity:.07;
  background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
  background-size:42px 42px}
.ivx .cover .ovkey{inset:0; background-image:
  radial-gradient(820px 340px at 86% -40%,rgba(255,255,255,.22),transparent 64%),
  radial-gradient(520px 260px at 0% 135%,rgba(1,25,14,.62),transparent 64%)}
.ivx .cover .ovlit{inset-inline:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)}
.ivx .cover .wrap{position:relative; z-index:2; padding:24px 26px 0}
.ivx .chead{display:flex; align-items:center; gap:20px; flex-wrap:wrap}
.ivx .mark{width:44px; height:44px; flex:none; border-radius:15px; display:grid; place-items:center;
  border:1px solid rgba(255,255,255,.24); background:rgba(255,255,255,.12); backdrop-filter:blur(4px)}
.ivx .eyebrow{display:flex; align-items:center; gap:9px; margin:0; font-size:10px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.56)}
.ivx .eyebrow::before{content:""; width:22px; height:1px; background:rgba(255,255,255,.34)}
.ivx .chead h1{margin:6px 0 0; font-family:var(--serif); font-size:31px; font-weight:600;
  line-height:1; letter-spacing:-.02em; text-shadow:0 2px 24px rgba(0,0,0,.3)}
.ivx .chead .sub{margin:5px 0 0; font-size:12.5px; color:rgba(255,255,255,.6)}
.ivx .due{margin-left:auto; text-align:right; flex:none}
.ivx .due .kk{font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:#F5D9A8}
.ivx .due .vv{margin:5px 0 0; font-size:30px; font-weight:800; letter-spacing:-.03em; line-height:1;
  color:#FBE3BC; font-variant-numeric:tabular-nums}
.ivx .due .nn{margin:5px 0 0; font-size:11.5px; color:rgba(255,255,255,.55)}
.ivx .due.clear .kk{color:#A7E8C6}
.ivx .due.clear .vv{color:#C9F4DC}
.ivx .facts{position:relative; z-index:2; margin-top:20px; display:flex; flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.16)}
.ivx .fact{flex:1 1 190px; padding:13px 20px 15px; border-right:1px solid rgba(255,255,255,.14)}
.ivx .fact:last-child{border-right:none}
.ivx .fact .kk{font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:rgba(255,255,255,.55)}
.ivx .fact .vv{margin-top:6px; font-size:20px; font-weight:700; letter-spacing:-.02em;
  font-variant-numeric:tabular-nums}
.ivx .fact .nn{margin-top:4px; font-size:11px; color:rgba(255,255,255,.45)}
.ivx .fact .nn b{font-weight:700; color:rgba(255,255,255,.72)}
.ivx .fact.owed .nn b{color:#FBE3BC}
.ivx .fact.paid .vv{color:#9FE8C4}
.ivx .fact.owed .vv{color:#FBE3BC}
/* kitna chukta hua — cover ke bilkul pendhe par ek seam, apna band nahi.
   Rakam ab facts ki notes me hai, isliye alag legend ki zaroorat nahi. */
.ivx .settled{position:relative; z-index:2; display:flex; height:3px;
  background:rgba(255,255,255,.16)}
.ivx .settled i{display:block; transition:width .6s cubic-bezier(.2,.8,.3,1)}
.ivx .body{padding:22px 0 76px; display:flex; flex-direction:column; gap:16px}
.ivx .alert{display:flex; align-items:center; gap:14px; border-radius:16px;
  border:1px solid var(--red-line); border-left:4px solid var(--red);
  background:linear-gradient(100deg,var(--red-bg),var(--card)); padding:15px 18px;
  box-shadow:var(--rest)}
.ivx .alert .ic{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--red-line); color:var(--red)}
.ivx .alert b{display:block; font-family:var(--serif); font-size:21px; font-weight:600; line-height:1.15;
  color:var(--red-deep)}
.ivx .alert p{margin:3px 0 0; font-size:12.5px; color:var(--red)}
.ivx .alert .amt2{margin-left:auto; flex:none; text-align:right}
.ivx .alert .amt2 .n2{font-size:19px; font-weight:800; letter-spacing:-.02em; color:var(--red-deep);
  font-variant-numeric:tabular-nums}
.ivx .alert .amt2 .l2{margin-top:3px; font-size:10.5px; color:var(--red)}
.ivx .bar2{border-radius:16px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); padding:13px 16px; display:flex; align-items:center; gap:14px;
  flex-wrap:wrap}
.ivx .seg{display:flex; gap:4px; border-radius:12px; border:1px solid var(--rule); background:var(--card-2);
  padding:4px}
.ivx .seg button{display:inline-flex; align-items:center; gap:7px; border-radius:9px; padding:7px 13px;
  font-size:12.5px; font-weight:600; color:var(--muted); white-space:nowrap;
  transition:background .18s, color .18s}
.ivx .seg button:hover{color:var(--ink-2)}
.ivx .seg button .c{border-radius:999px; padding:1px 7px; font-size:11px; font-weight:700;
  background:var(--sunk); color:var(--muted); font-variant-numeric:tabular-nums}
.ivx .seg button.on{background:var(--em-mid); color:#fff}
.ivx .seg button.on .c{background:rgba(255,255,255,.22); color:#fff}
.ivx .bar2 .r{margin-left:auto; font-size:12px; color:var(--faint)}
.ivx .sheet{border-radius:18px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); overflow:hidden}
.ivx .cap{display:flex; align-items:center; gap:12px; padding:15px 20px; border-bottom:1px solid var(--rule);
  background:var(--card-2); flex-wrap:wrap}
.ivx .cap b{font-family:var(--serif); font-size:22px; font-weight:600}
.ivx .cap p{margin:2px 0 0; font-size:12px; color:var(--faint)}
.ivx .cap .r{margin-left:auto; font-size:12px; color:var(--faint)}
.ivx .scroll{overflow-x:auto}
.ivx table{width:100%; border-collapse:collapse; min-width:940px}
.ivx thead th{padding:11px 20px; text-align:left; font-size:10px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:var(--faint); border-bottom:1px solid var(--rule); white-space:nowrap;
  background:var(--card)}
.ivx thead th.r{text-align:right}
.ivx tbody tr{border-bottom:1px solid var(--rule); transition:background .16s}
.ivx tbody tr:last-child{border-bottom:none}
.ivx tbody tr:hover{background:var(--card-2)}
.ivx tbody td{padding:14px 20px; vertical-align:middle}
.ivx tbody td.r{text-align:right}
.ivx tbody tr td:first-child{box-shadow:inset 3px 0 0 var(--sc,transparent)}
.ivx tbody tr.od{background:linear-gradient(90deg,var(--red-bg) 0%,#FEF6F8 100%)}
.ivx tbody tr.od:hover{background:linear-gradient(90deg,#FBDDE4 0%,#FDEFF2 100%)}
.ivx .inv{display:flex; align-items:center; gap:13px; min-width:0}
.ivx .inv .g{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  background:color-mix(in srgb, var(--sc) 9%, #fff); color:var(--sc);
  border:1px solid color-mix(in srgb, var(--sc) 26%, transparent)}
.ivx .inv .no{font-family:var(--mono); font-size:12.5px; font-weight:700; letter-spacing:-.01em;
  white-space:nowrap}
.ivx .inv .l2{margin:3px 0 0; font-size:11.5px; color:var(--muted); text-transform:capitalize}
.ivx .st{display:inline-flex; align-items:center; gap:7px; border-radius:999px; padding:4px 11px 4px 9px;
  font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  border:1px solid; white-space:nowrap;
  color:var(--sc); border-color:color-mix(in srgb, var(--sc) 30%, transparent);
  background:color-mix(in srgb, var(--sc) 8%, #fff)}
.ivx .st i{width:6px; height:6px; flex:none; border-radius:999px; background:var(--sc)}
.ivx .dt{font-size:13px; color:var(--ink-2); font-variant-numeric:tabular-nums; white-space:nowrap}
.ivx .dt small{display:block; margin-top:3px; font-size:11px; color:var(--faint)}
.ivx .dt small.hot{color:var(--red); font-weight:600}
.ivx .dt small.soon{color:var(--amber); font-weight:600}
.ivx .dt small.ok{color:var(--em-mid)}
.ivx .amt{font-size:15px; font-weight:800; letter-spacing:-.02em; font-variant-numeric:tabular-nums;
  color:var(--ink)}
.ivx .amt.paid{color:var(--em-mid)}
.ivx .amt.od{color:var(--red-deep)}
.ivx .acts{display:inline-flex; align-items:center; gap:8px}
.ivx .mini{display:inline-flex; align-items:center; gap:6px; border-radius:10px; padding:7px 12px;
  font-size:11.5px; font-weight:700; border:1px solid var(--rule-2); background:var(--card);
  color:var(--ink-2); white-space:nowrap; transition:border-color .18s, color .18s}
.ivx .mini:hover{border-color:var(--em-2); color:var(--em-mid)}
.ivx .pay{border:none; color:#fff; background:linear-gradient(180deg,#D9930F,#B4700F);
  box-shadow:0 12px 22px -14px rgba(180,112,15,.9); transition:transform .18s}
.ivx .pay:hover{transform:translateY(-2px)}
.ivx .pay.hot{background:linear-gradient(180deg,#D6294F,#BE123C);
  box-shadow:0 12px 22px -14px rgba(190,18,60,.9)}
.ivx .empty{padding:64px 24px; text-align:center}
.ivx .empty .ic2{width:58px; height:58px; margin:0 auto 16px; border-radius:19px; display:grid;
  place-items:center; border:1px solid var(--rule); background:var(--card-2); color:var(--ghost)}
.ivx .empty h3{margin:0; font-family:var(--serif); font-size:24px; font-weight:600}
.ivx .empty p{margin:7px 0 0; font-size:13px; color:var(--muted)}

@media (max-width:820px){.ivx .fact{flex-basis:140px}
.ivx .bar2{flex-wrap:nowrap; overflow-x:auto; -webkit-overflow-scrolling:touch}
.ivx .bar2 .r{display:none}
.ivx .seg{flex:none}
.ivx .scroll{overflow-x:visible}
.ivx table{min-width:0}
.ivx thead{display:none}
.ivx table, .ivx tbody, .ivx tbody tr, .ivx tbody td{display:block; width:100%}
.ivx tbody tr{padding:6px 0 12px}
.ivx tbody tr td:first-child{box-shadow:none}
.ivx tbody tr{box-shadow:inset 3px 0 0 var(--sc,transparent)}
.ivx tbody td{padding:7px 18px}
.ivx tbody td.r{text-align:left}
.ivx tbody td[data-l]{display:flex; align-items:center; justify-content:space-between; gap:14px}
.ivx tbody td[data-l]::before{content:attr(data-l); flex:none;
    font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--faint)}
.ivx .acts{justify-content:flex-end}
.ivx .due{margin-left:0; text-align:left; width:100%}
}
@media (prefers-reduced-motion:reduce){.ivx *{transition:none !important; animation:none !important} }

/* ── React markup ke liye chhote additions ─────────────────────────────── */
.ivx .spin{display:grid; place-items:center; padding:64px 0}
.ivx .dt .mono{font-family:var(--mono)}
`;

import {
  Loader2, FileText, Calendar, ExternalLink, CheckCircle, Clock,
  AlertCircle, IndianRupee, ArrowLeft, Filter, CreditCard, Download,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  GENERATED: { label: 'Unpaid', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  SENT: { label: 'Unpaid', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  PAID: { label: 'Paid', color: 'text-green-700', bg: 'bg-green-100 border-green-200' },
  OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-200' },
};

/* Statement ke liye — STATUS_CONFIG ke wahi hue, thos roop me, taaki pill
   neutral rahe aur rang sirf bindu me aaye. STATUS_CONFIG jaisa tha waisa hi hai. */
const STATUS_INK: Record<string, string> = {
  GENERATED: '#B4700F', SENT: '#B4700F', PAID: '#047857',
  OVERDUE: '#BE123C', CANCELLED: '#6F7C74',
};

function CustomerB2BInvoicesContent() {
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) fetchInvoices();
    else setLoading(false);
  }, [customerId]);

  async function fetchInvoices() {
    try {
      const res = await fetch(`/api/b2b/invoices?customer_id=${customerId}&limit=100`);
      const data = await res.json();
      if (data.status === 'success') setInvoices(data.invoices || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatCurrency = (v: number) => `₹${(v || 0).toLocaleString('en-IN')}`;

  const isOverdue = (inv: any) => {
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') return false;
    return new Date(inv.dueDate) < new Date();
  };

  const getStatus = (inv: any) => {
    if (inv.status === 'PAID') return 'PAID';
    if (inv.status === 'CANCELLED') return 'CANCELLED';
    if (isOverdue(inv)) return 'OVERDUE';
    return 'GENERATED';
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    if (statusFilter === 'unpaid') return invoices.filter((inv: any) => !['PAID', 'CANCELLED'].includes(inv.status));
    if (statusFilter === 'paid') return invoices.filter((inv: any) => inv.status === 'PAID');
    if (statusFilter === 'overdue') return invoices.filter((inv: any) => isOverdue(inv));
    return invoices;
  }, [invoices, statusFilter]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const paidAmount = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const unpaidAmount = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const overdueCount = invoices.filter((i: any) => isOverdue(i)).length;
    return { totalAmount, paidAmount, unpaidAmount, overdueCount };
  }, [invoices]);

  /* ── Sirf dikhawe ke liye. Aapke stats, filteredInvoices, getStatus, isOverdue
     jaise the waise hi hain — ye unke upar do chhote hisaab hain. ── */
  const overdueAmount = invoices
    .filter((i: any) => isOverdue(i))
    .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
  const dueAmount = Math.max(0, stats.unpaidAmount - overdueAmount);
  const unpaidCount = invoices.filter((i: any) => !['PAID', 'CANCELLED'].includes(i.status)).length;
  const paidCount = invoices.filter((i: any) => i.status === 'PAID').length;
  const pct = (v: number) => (stats.totalAmount > 0 ? (v / stats.totalAmount) * 100 : 0);

  return (
    <div className={`${quoteDisplay.variable} ivx`}>
      <CustomerHeader showBackButton />
      <style dangerouslySetInnerHTML={{ __html: IVX_CSS }} />

      <main className="pt-16">

        {/* ══ statement ka sar ══ */}
        <section className="cover">
          <i className="ovgrid" /><i className="ovkey" /><i className="ovlit" />
          <div className="wrap">

            <div className="chead">
              <Link href={`/customer/b2b-bookings?customer_id=${customerId}`} className="mark">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div style={{ minWidth: 0 }}>
                <p className="eyebrow">Corporate billing</p>
                <h1>Invoices</h1>
                <p className="sub">All your B2B booking invoices</p>
              </div>

              {invoices.length > 0 && (
                <div className={`due ${stats.unpaidAmount === 0 ? 'clear' : ''}`}>
                  <p className="kk">Outstanding</p>
                  <p className="vv">{formatCurrency(stats.unpaidAmount)}</p>
                  <p className="nn">
                    {stats.unpaidAmount === 0
                      ? 'Everything settled'
                      : `Across ${unpaidCount} unpaid invoice${unpaidCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
            </div>

            {invoices.length > 0 && (
              <>
                <div className="facts">
                  <div className="fact">
                    <p className="kk">Total invoiced</p>
                    <p className="vv">{formatCurrency(stats.totalAmount)}</p>
                    <p className="nn">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}, all time</p>
                  </div>
                  <div className="fact paid">
                    <p className="kk">Paid</p>
                    <p className="vv">{formatCurrency(stats.paidAmount)}</p>
                    <p className="nn">
                      {stats.paidAmount === 0
                        ? 'Nothing settled yet'
                        : <><b>{Math.round(pct(stats.paidAmount))}%</b> of the total, settled</>}
                    </p>
                  </div>
                  <div className="fact owed">
                    <p className="kk">Unpaid</p>
                    <p className="vv">{formatCurrency(stats.unpaidAmount)}</p>
                    <p className="nn">
                      {stats.unpaidAmount === 0
                        ? 'Nothing outstanding'
                        : stats.overdueCount > 0
                          ? <><b>{formatCurrency(overdueAmount)}</b> of it overdue &middot; {formatCurrency(dueAmount)} not yet due</>
                          : 'None overdue'}
                    </p>
                  </div>
                </div>

              </>
            )}
          </div>

          {/* kitna chukta hua — cover ke pendhe ki seam */}
          {invoices.length > 0 && stats.totalAmount > 0 && (
            <div className="settled">
              <i style={{ width: `${pct(stats.paidAmount)}%`, background: 'linear-gradient(90deg,#0EA47E,#22D383)' }}
                title={`Paid ${formatCurrency(stats.paidAmount)}`} />
              <i style={{ width: `${pct(dueAmount)}%`, background: '#D9930F' }}
                title={`Due ${formatCurrency(dueAmount)}`} />
              <i style={{ width: `${pct(overdueAmount)}%`, background: '#D6294F' }}
                title={`Overdue ${formatCurrency(overdueAmount)}`} />
            </div>
          )}
        </section>

        <div className="wrap">
          <div className="body">

            {/* ══ overdue ki chetavani ══ */}
            {stats.overdueCount > 0 && (
              <div className="alert">
                <span className="ic"><AlertCircle className="w-4 h-4" /></span>
                <div>
                  <b>{stats.overdueCount} Overdue Invoice{stats.overdueCount > 1 ? 's' : ''}</b>
                  <p>Please clear the pending payments to avoid service disruption</p>
                </div>
                <div className="amt2">
                  <p className="n2">{formatCurrency(overdueAmount)}</p>
                  <p className="l2">past due date</p>
                </div>
              </div>
            )}

            {/* ══ chhaanne ki patti ══ */}
            {invoices.length > 0 && (
              <div className="bar2">
                <div className="seg">
                  {[
                    { key: 'all', label: 'All', n: invoices.length },
                    { key: 'unpaid', label: 'Unpaid', n: unpaidCount },
                    { key: 'paid', label: 'Paid', n: paidCount },
                    { key: 'overdue', label: 'Overdue', n: stats.overdueCount },
                  ].map((f) => (
                    <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                      className={statusFilter === f.key ? 'on' : ''}>
                      {f.label}
                      <span className="c">{f.n}</span>
                    </button>
                  ))}
                </div>
                <span className="r">Newest first</span>
              </div>
            )}

            {/* ══ statement ══ */}
            <div className="sheet">
              <div className="cap">
                <div>
                  <b>Invoice statement</b>
                  <p>Raised against your completed bookings</p>
                </div>
                <span className="r">
                  Showing <b>{filteredInvoices.length}</b> of <b>{invoices.length}</b>
                </span>
              </div>

              {loading ? (
                <div className="spin"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--em-2)' }} /></div>
              ) : !customerId ? (
                <div className="empty">
                  <span className="ic2"><AlertCircle className="w-6 h-6" /></span>
                  <h3>Customer ID required</h3>
                  <p>Sign in again to see your invoices.</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="empty">
                  <span className="ic2"><FileText className="w-6 h-6" /></span>
                  <h3>No invoices yet</h3>
                  <p>Invoices will appear here once your bookings are completed</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="empty">
                  <span className="ic2"><Filter className="w-6 h-6" /></span>
                  <h3>Nothing matches that filter</h3>
                  <p>No invoices match the selected filter</p>
                </div>
              ) : (
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Booking</th>
                        <th>Due</th>
                        <th>Status</th>
                        <th className="r">Amount</th>
                        <th className="r"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv: any) => {
                        const effectiveStatus = getStatus(inv);
                        const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.GENERATED;
                        const overdue = effectiveStatus === 'OVERDUE';
                        const daysUntilDue = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const sc = STATUS_INK[effectiveStatus] || STATUS_INK.GENERATED;

                        return (
                          <tr key={inv.id} className={overdue ? 'od' : ''} style={{ ['--sc' as any]: sc }}>
                            <td>
                              <div className="inv">
                                <span className="g">
                                  {effectiveStatus === 'PAID'
                                    ? <CheckCircle className="w-4 h-4" />
                                    : overdue
                                      ? <AlertCircle className="w-4 h-4" />
                                      : <FileText className="w-4 h-4" />}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <p className="no">{inv.invoiceNumber}</p>
                                  <p className="l2">{inv.totalVehicles} vehicles &middot; {inv.tripsCompleted} trips</p>
                                </div>
                              </div>
                            </td>

                            <td data-l="Booking">
                              <span className="dt mono" style={{ fontSize: 12 }}>
                                {inv.booking?.bookingNumber}
                                <small style={{ textTransform: 'capitalize' }}>
                                  {inv.booking?.serviceType === 'self-drive' ? 'Self Drive' : inv.booking?.serviceType}
                                </small>
                              </span>
                            </td>

                            <td data-l="Due">
                              <span className="dt">
                                {formatDate(inv.dueDate)}
                                {effectiveStatus === 'PAID' && inv.paidAt ? (
                                  <small className="ok">Paid on {formatDate(inv.paidAt)}</small>
                                ) : overdue ? (
                                  <small className="hot">
                                    Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                                  </small>
                                ) : effectiveStatus === 'CANCELLED' ? (
                                  <small>No longer payable</small>
                                ) : daysUntilDue >= 0 && daysUntilDue <= 3 ? (
                                  <small className="soon">Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</small>
                                ) : (
                                  <small>{daysUntilDue} days left</small>
                                )}
                              </span>
                            </td>

                            <td data-l="Status">
                              <span className="st"><i />{config.label}</span>
                            </td>

                            <td className="r" data-l="Amount">
                              <p className={`amt ${effectiveStatus === 'PAID' ? 'paid' : overdue ? 'od' : ''}`}
                                style={effectiveStatus === 'CANCELLED' ? { color: 'var(--ghost)' } : undefined}>
                                {formatCurrency(inv.totalAmount)}
                              </p>
                            </td>

                            <td className="r">
                              <span className="acts">
                                <a className="mini" href={`/invoice/b2b/${inv.id}`} target="_blank">
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                                {effectiveStatus !== 'PAID' && (
                                  <a className={`mini pay ${overdue ? 'hot' : ''}`} href={`/invoice/b2b/${inv.id}`} target="_blank">
                                    <CreditCard className="w-3 h-3" /> Pay Now
                                  </a>
                                )}
                              </span>
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


export default function CustomerB2BInvoicesPage() {
  return (
    <Suspense fallback={<div className={`${quoteDisplay.variable} flex items-center justify-center min-h-screen`}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <CustomerB2BInvoicesContent />
    </Suspense>
  );
}
