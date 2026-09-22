// @ts-nocheck
'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
const B2BBookingChat = lazy(() => import('@/components/b2b/B2BBookingChat'));
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import BookingPaymentSafetyNotice from '@/components/customer/BookingPaymentSafetyNotice';
import {
  Loader2, ArrowLeft, Calendar, MapPin, Clock, CheckCircle,
  Copy, ExternalLink, Share2, Building2, Car, Users, Route,
  Phone, Mail, FileText, AlertCircle, Truck, Bus, Bike, Wrench, Package, Star,
  Fuel, Settings2, ChevronDown, ChevronLeft, ChevronRight, Eye, IndianRupee, MessageCircle,
} from 'lucide-react';

/* The booking dossier's own stylesheet. Every rule is scoped under `.bdx` so the
   short class names here (.chip, .trip, .veh…) cannot reach the rest of the app. */
const BDX_CSS = `
.bdx{
  --paper:#FFFFFF; --card:#FFFFFF; --card-2:#F8FBF9; --sunk:#F2F7F3; --deep:#0C1A14;
  --rule:#DFE8E2; --rule-2:#CBD9D1;
  --ink:#0A140F; --ink-2:#3F4C45; --muted:#6F7C74; --faint:#9DAAA2; --ghost:#C2CDC6;

  --em-1:#045030; --em-2:#09B368; --em-deep:#04321F; --em-mid:#056B3E;
  --mint:#E9F7F0; --mint-line:#C3E5D4;

  --amber:#B4700F; --amber-deep:#8A5409; --amber-bg:#FDF6E7; --amber-line:#EFE0BE;
  --red:#BE123C; --red-deep:#9F0F32; --red-bg:#FDEBEF; --red-line:#F6C9D4;
  --violet:#6D28D9; --violet-deep:#5B21B6; --violet-bg:#F5F1FE; --violet-line:#DCCEFA;
  --blue:#1D4ED8; --blue-bg:#E8F0FE; --blue-line:#C4D6F6;
  --teal:#0B7C74; --teal-bg:#E4F4F2; --teal-line:#BBE2DE;
  --sky:#0369A1; --sky-bg:#E4F2FB; --sky-line:#BEDEF2;
  --plate:#FBD34D; --plate-line:#D9A21A; --plate-ink:#5A4106;

  --serif:var(--quote-display),Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  --rest:0 1px 3px rgba(4,50,31,.07), 0 8px 20px -16px rgba(4,50,31,.14);
  --lift:0 26px 54px -30px rgba(4,50,31,.34);
}
.bdx{color:var(--ink); font-size:16px; line-height:1.55; -webkit-font-smoothing:antialiased}
.bdx *{box-sizing:border-box}
.bdx a{color:inherit; text-decoration:none}
.bdx :focus-visible{outline:2px solid var(--em-2); outline-offset:3px; border-radius:6px}
.bdx .wrap{max-width:1280px; margin:0 auto; padding:0 26px}
.bdx .num{font-variant-numeric:tabular-nums}
.bdx .mono{font-family:var(--mono)}
.bdx .k{font-size:10.5px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--faint)}
.bdx .cover{position:relative; overflow:hidden; color:#fff;
  background:linear-gradient(122deg,#042115 0%,#06412A 46%,#067C4A 100%)}
.bdx .cover > i{position:absolute; display:block; pointer-events:none}
.bdx .cover .ovgrid{inset:0; opacity:.07;
  background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
  background-size:42px 42px}
.bdx .cover .ovkey{inset:0; background-image:
  radial-gradient(820px 340px at 86% -40%,rgba(255,255,255,.22),transparent 64%),
  radial-gradient(360px 200px at 46% -20%,rgba(120,255,196,.10),transparent 66%),
  radial-gradient(520px 260px at 0% 135%,rgba(1,25,14,.62),transparent 64%)}
.bdx .cover .ovlit{inset-inline:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)}
.bdx .cover .wrap{position:relative; z-index:2; padding:26px 26px 0}
.bdx .chead{display:flex; align-items:flex-start; gap:18px; flex-wrap:wrap; padding-bottom:8px}
.bdx .mark{width:54px; height:54px; flex:none; border-radius:17px; display:grid; place-items:center;
  border:1px solid rgba(255,255,255,.24); background:rgba(255,255,255,.12); backdrop-filter:blur(4px)}
.bdx .chead .eyebrow{display:flex; align-items:center; gap:9px; font-size:10.5px; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.55)}
.bdx .chead .eyebrow::before{content:""; width:20px; height:1px; background:rgba(255,255,255,.32)}
.bdx .chead .no{display:flex; align-items:center; gap:13px; flex-wrap:wrap; margin-top:9px}
.bdx .chead .no b{font-family:var(--mono); font-size:26px; font-weight:700; letter-spacing:-.02em}
.bdx .stamp{display:inline-flex; align-items:center; gap:7px; border:1.5px solid rgba(255,255,255,.4);
  border-radius:7px; padding:4px 10px; font-size:10.5px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; background:rgba(255,255,255,.12); backdrop-filter:blur(4px)}
.bdx .stamp i{width:6px; height:6px; border-radius:999px; background:#C4B5FD}
.bdx .chead .who2{margin:10px 0 0; font-size:13.5px; color:rgba(255,255,255,.68)}
.bdx .chead .who2 b{font-weight:600; color:rgba(255,255,255,.9)}
.bdx .ta{display:inline-flex; align-items:center; gap:6px; margin-left:8px; border-radius:999px;
  border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.14); padding:2px 9px;
  font-size:10.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase}
.bdx .chead .side{margin-left:auto; display:flex; gap:9px; flex-wrap:wrap; padding-top:4px}
.bdx .btn{display:inline-flex; align-items:center; gap:8px; border-radius:11px; padding:9px 16px;
  font-size:13.5px; font-weight:700; transition:transform .18s, background .18s, border-color .18s, color .18s}
.bdx .btn:hover{transform:translateY(-2px)}
.bdx .btn.w{background:#fff; color:var(--em-deep); box-shadow:0 14px 26px -16px rgba(0,0,0,.8)}
.bdx .btn.g{border:1px solid rgba(255,255,255,.26); background:rgba(255,255,255,.12); color:#fff}
.bdx .btn.g:hover{background:rgba(255,255,255,.2)}
.bdx .btn.o{border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2)}
.bdx .btn.o:hover{border-color:var(--em-2); color:var(--em-mid)}
.bdx .facts{position:relative; z-index:2; margin-top:24px; display:flex; flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.16)}
.bdx .fact{flex:1 1 160px; padding:15px 20px 18px; border-right:1px solid rgba(255,255,255,.14)}
.bdx .fact:last-child{border-right:none}
.bdx .fact .k{color:rgba(255,255,255,.5)}
.bdx .fact .v{margin-top:6px; font-size:15px; font-weight:600; color:#fff}
.bdx .fact .v small{display:block; margin-top:3px; font-size:12px; font-weight:400; color:rgba(255,255,255,.5)}
.bdx .fact .v .to{display:flex; align-items:center; gap:7px; margin-top:3px; font-weight:400; color:rgba(255,255,255,.72)}
.bdx .fact .v .to::before{content:""; width:12px; height:1px; flex:none; background:rgba(255,255,255,.3)}
.bdx .fact.hot .v{color:#DDD0FE}

/* radd ho chuki booking ka cover rang chhod deta hai */
.bdx .cover.off{background:linear-gradient(122deg,#191F1C 0%,#2C3531 46%,#414C46 100%)}
.bdx .cover.off .ovkey{opacity:.5}

/* status, cover ki apni bhasha me */
.bdx .stamp2{display:inline-flex; align-items:center; gap:8px; border:1.5px solid rgba(255,255,255,.38);
  border-radius:8px; padding:5px 12px; font-size:10.5px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; background:rgba(255,255,255,.12); backdrop-filter:blur(4px)}
.bdx .stamp2 i{width:6px; height:6px; flex:none; border-radius:999px; box-shadow:0 0 0 3px rgba(255,255,255,.14)}

/* har fact ke aage uska chhota nishaan */
.bdx .fact .kk2{display:flex; align-items:center; gap:6px}
.bdx .fact .kk2 svg{opacity:.55; flex:none}

/* ── ticket: baayan stub, phata hua kinara, dayin taraf tally ──────────── */
.bdx .cover .tk{position:relative; z-index:2; max-width:1280px; margin:0 auto;
  padding:65px 26px 0}
.bdx .cover .stub{padding:26px 0 0; min-width:0}

/* phata hua kinara — ab lamba, aur dono kinaron par punch */
.bdx .cover .perf{position:relative; height:1px; margin:22px -26px 0;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.26) 0 6px,transparent 6px 12px)}
.bdx .cover .perf::before,.bdx .cover .perf::after{content:""; position:absolute; top:-9px;
  width:18px; height:18px; border-radius:9999px; background:#fff}
.bdx .cover .perf::before{left:-9px}
.bdx .cover .perf::after{right:-9px}

/* tally ke khaane — jitne fact utne khaane */
.bdx .cover .tally{display:grid; gap:10px; padding:22px 0 30px;
  grid-template-columns:repeat(var(--cols,5),minmax(0,1fr))}
@media (max-width:1000px){ .bdx .cover .tally{grid-template-columns:repeat(3,minmax(0,1fr))} }
@media (max-width:620px){ .bdx .cover .tally{grid-template-columns:repeat(2,minmax(0,1fr))} }
.bdx .cover .tile{position:relative; overflow:hidden; border-radius:16px;
  border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08);
  backdrop-filter:blur(4px); padding:11px 14px 13px}
.bdx .cover .tile .lit2{position:absolute; inset-inline:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)}
.bdx .cover .tile .tl{display:flex; align-items:center; gap:8px; margin:0;
  font-size:10.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(255,255,255,.66)}
.bdx .cover .tile .ch{width:22px; height:22px; flex:none; border-radius:8px; display:grid;
  place-items:center; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.14)}
.bdx .cover .tile .tv{margin:9px 0 0; font-size:17px; font-weight:600; line-height:1.25;
  color:#fff; font-variant-numeric:tabular-nums}

/* Track ka button upar dayin kone me, jaisa pehle tha */
.bdx .cover .stub .side{margin-left:auto; padding-top:2px}

/* cover ke bilkul neeche, kahan tak pahunche — 2px ki lakeer */
.bdx .cover .prog{position:relative; z-index:2; height:2px; background:rgba(255,255,255,.14)}
.bdx .cover .prog i{display:block; height:100%;
  background:linear-gradient(90deg,#22D383,#9FE8C4); transition:width .7s cubic-bezier(.2,.8,.3,1)}
.bdx .body{display:grid; gap:32px; grid-template-columns:minmax(0,1fr) 320px; padding:30px 0 72px}
@media (max-width:1120px){.bdx .body{grid-template-columns:1fr}
.bdx .rail{order:-1} }.bdx .spine{position:relative; padding-left:32px}
.bdx .node{position:relative; padding-bottom:26px}
.bdx .node:last-of-type{padding-bottom:0}

/* do dots ke beech ka tukda — us node ka apna, isliye rang hamesha sahi jagah badalta hai */
.bdx .node::before{content:""; position:absolute; left:-23px; top:20px; bottom:0; width:2px;
  background:var(--rule)}
.bdx .node:last-of-type::before{display:none}
.bdx .node.done::before{background:var(--em-2); box-shadow:0 0 7px rgba(9,179,104,.35)}
.bdx .node .dot{position:absolute; left:-32px; top:0; width:20px; height:20px; border-radius:999px;
  display:grid; place-items:center; background:var(--card); border:2px solid var(--rule-2);
  color:var(--ghost); font-size:10.5px; font-weight:700}
.bdx .node.done .dot{border-color:var(--em-2); background:var(--em-2); color:#fff}
.bdx .node.now .dot{border-color:var(--violet); background:var(--violet); color:#fff;
  box-shadow:0 0 0 5px var(--violet-bg); animation:bdxHere 2.6s ease-in-out infinite}
@keyframes bdxHere{
  0%,100%{box-shadow:0 0 0 5px var(--violet-bg)}
  50%{box-shadow:0 0 0 9px rgba(109,40,217,.09)}
}
.bdx .node .cap{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
.bdx .node .cap h3{margin:0; font-size:15.5px; font-weight:700; letter-spacing:-.01em}
.bdx .node.now .cap h3{color:var(--violet-deep)}
.bdx .node.todo .cap h3{color:var(--ghost)}
.bdx .node .say{transition:color .18s}
.bdx .node .cap time{font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums}
.bdx .tagn{border-radius:999px; padding:2px 9px; font-size:9.5px; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; border:1px solid var(--violet-line); background:var(--violet-bg); color:var(--violet)}
.bdx .node .say{margin:5px 0 0; font-size:13.5px; color:var(--muted)}
.bdx .node .say b{color:var(--ink-2); font-weight:600}
.bdx .node .panel{margin-top:13px}
.bdx .sheet{border-radius:16px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); overflow:hidden}
.bdx .sheet > .cap2{display:flex; align-items:center; gap:10px; padding:12px 18px;
  border-bottom:1px solid var(--rule); background:var(--card-2)}
.bdx .sheet > .cap2 b{font-family:var(--serif); font-size:20.5px; font-weight:600}
.bdx .sheet > .cap2 .n{margin-left:auto; font-size:12.5px; color:var(--faint); font-variant-numeric:tabular-nums}
.bdx .dl{display:grid; grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:760px){.bdx .dl{grid-template-columns:repeat(2,minmax(0,1fr))} }.bdx .dl > div{padding:12px 18px; border-right:1px solid var(--rule); border-bottom:1px solid var(--rule)}
.bdx .dl > div:nth-child(3n){border-right:none}
@media (max-width:760px){.bdx .dl > div:nth-child(3n){border-right:1px solid var(--rule)}
.bdx .dl > div:nth-child(2n){border-right:none} }.bdx .dl .v{margin-top:5px; font-size:15px; color:var(--ink-2)}
.bdx .dl .wide{grid-column:1/-1; border-right:none; border-bottom:none}
.bdx .dl .wide .v{font-size:14px; line-height:1.65; color:var(--muted)}
.bdx .dim{color:var(--ghost)}
.bdx .pref{margin:14px 18px 0; border-radius:14px; border:1px solid var(--sky-line);
  border-left:4px solid var(--sky); background:linear-gradient(120deg,var(--sky-bg),var(--card));
  padding:15px 17px}
.bdx .pref .row{display:flex; align-items:flex-start; gap:14px}
.bdx .pref .box{width:54px; height:54px; flex:none; border-radius:15px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--sky-line); color:var(--sky);
  box-shadow:0 8px 18px -12px rgba(3,105,161,.55)}
.bdx .pref .hd3{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
.bdx .pref .hd3 .k{color:var(--sky)}
.bdx .pref .hd3 .chip{border-color:var(--sky-line); background:var(--card); color:var(--sky)}
.bdx .pref h5{margin:5px 0 0; font-family:var(--serif); font-size:21px; font-weight:600; line-height:1.15}
.bdx .pref .chips{margin-top:9px}

/* ghar par delivery — pata apni line par, taaki dhoondhna na pade */
.bdx .pref .deliver{display:flex; align-items:flex-start; gap:10px; margin-top:12px; border-radius:11px;
  background:var(--card); border:1px solid var(--sky-line); padding:10px 12px}
.bdx .pref .deliver .di{width:26px; height:26px; flex:none; border-radius:9px; display:grid;
  place-items:center; background:var(--sky-bg); color:var(--sky)}
.bdx .pref .deliver b{display:block; font-size:13.5px; font-weight:700; color:#07405F}
.bdx .pref .deliver .addr{display:flex; align-items:flex-start; gap:6px; margin-top:4px;
  font-size:13px; line-height:1.55; color:var(--sky)}
.bdx .pref .deliver .addr svg{flex:none; margin-top:2px; opacity:.8}
.bdx .chips{display:flex; flex-wrap:wrap; gap:6px}
.bdx .chip{display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:3px 10px;
  font-size:12px; border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2)}
.bdx .chip.v{border-color:var(--violet-line); background:var(--violet-bg); color:var(--violet)}
.bdx .chip.b{border-color:var(--blue-line); background:var(--blue-bg); color:var(--blue)}
.bdx .chip.m{border-color:var(--mint-line); background:var(--mint); color:var(--em-mid)}
.bdx .chip.a{border-color:var(--amber-line); background:var(--amber-bg); color:var(--amber)}
.bdx .chip.r{border-color:var(--red-line); background:var(--red-bg); color:var(--red)}
.bdx .grp{padding:16px 18px; border-bottom:1px solid var(--rule)}
.bdx .grp:last-child{border-bottom:none}
.bdx .grp > .k{margin-bottom:12px}
.bdx .route{display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); align-items:center; gap:14px}
@media (max-width:620px){.bdx .route{grid-template-columns:1fr; gap:10px}
.bdx .route .mid{display:none} }.bdx .route .end{min-width:0}
.bdx .route .end .p{display:flex; align-items:center; gap:8px}
.bdx .route .end .p i{width:11px; height:11px; flex:none; border-radius:999px; border:3px solid var(--em-2); background:var(--card)}
.bdx .route .end.to .p i{border-color:var(--red); background:var(--red)}
.bdx .route .end .nm{font-family:var(--serif); font-size:23px; line-height:1.1; letter-spacing:-.015em}
.bdx .route .end .k{margin-top:5px}
.bdx .route .end.to{text-align:right}
.bdx .route .end.to .p{justify-content:flex-end}
@media (max-width:620px){
  .bdx .route .end.to{text-align:left}
  .bdx .route .end.to .p{flex-direction:row-reverse; justify-content:flex-end}
}
.bdx .route .mid{position:relative; min-width:150px; height:34px}
.bdx .route .mid .ln{position:absolute; inset-inline:0; top:16px; height:2px;
  background:repeating-linear-gradient(90deg,var(--rule-2) 0 6px,transparent 6px 12px)}
.bdx .route .mid .glyph{position:absolute; left:50%; top:0; transform:translateX(-50%);
  width:34px; height:34px; border-radius:999px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--mint-line); color:var(--em-mid)}
.bdx .sched{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0; margin-top:16px;
  border:1px solid var(--rule); border-radius:13px; overflow:hidden}
@media (max-width:620px){.bdx .sched{grid-template-columns:1fr} }.bdx .sched > div{padding:12px 15px; border-right:1px solid var(--rule); background:var(--card-2)}
.bdx .sched > div:last-child{border-right:none}
@media (max-width:620px){.bdx .sched > div{border-right:none; border-bottom:1px solid var(--rule)} }.bdx .sched .v{margin-top:6px; font-size:15.5px; font-weight:600; color:var(--ink-2); font-variant-numeric:tabular-nums}
.bdx .sched .v small{display:block; margin-top:2px; font-size:12.5px; font-weight:400; color:var(--muted)}
.bdx .sched .span{display:inline-flex; align-items:center; gap:6px; margin-top:6px; border-radius:999px;
  border:1px solid var(--amber-line); background:var(--amber-bg); color:var(--amber-deep);
  padding:3px 10px; font-size:12.5px; font-weight:700}
.bdx .fleet4{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); border:1px solid var(--rule);
  border-radius:13px; overflow:hidden}
@media (max-width:760px){.bdx .fleet4{grid-template-columns:repeat(2,minmax(0,1fr))} }.bdx .fleet4 > div{padding:13px 15px; border-right:1px solid var(--rule)}
.bdx .fleet4 > div:last-child{border-right:none}
@media (max-width:760px){.bdx .fleet4 > div:nth-child(2n){border-right:none}
.bdx .fleet4 > div:nth-child(-n+2){border-bottom:1px solid var(--rule)}
}.bdx .fleet4 .kk{display:flex; align-items:center; gap:7px}
.bdx .fleet4 .kk span{width:20px; height:20px; flex:none; border-radius:7px; display:grid; place-items:center}
.bdx .fleet4 .big{margin-top:9px; font-size:26px; font-weight:700; line-height:1;
  letter-spacing:-.03em; font-variant-numeric:tabular-nums}
.bdx .fleet4 .txt{margin-top:9px; font-size:15.5px; font-weight:600; color:var(--ink-2)}
.bdx .fleet4 .n{margin-top:5px; font-size:12px; color:var(--faint)}
.bdx .prefline{display:flex; align-items:center; gap:9px; margin-top:12px; border-radius:12px;
  border:1px solid var(--sky-line); background:linear-gradient(100deg,var(--sky-bg),var(--card));
  padding:10px 13px; font-size:14px; color:var(--sky)}
.bdx .prefline b{color:#07405F; font-weight:700}
.bdx .raiser{display:flex; align-items:center; gap:14px; border-radius:13px; border:1px solid var(--rule);
  background:var(--card-2); padding:14px 16px; flex-wrap:wrap}
.bdx .raiser .ini{width:44px; height:44px; flex:none; border-radius:14px; display:grid; place-items:center;
  color:#fff; font-size:18px; font-weight:700; background:linear-gradient(140deg,var(--em-1),var(--em-2));
  box-shadow:0 0 0 3px var(--card), 0 8px 18px -12px rgba(4,50,31,.7)}
.bdx .raiser .co{font-family:var(--serif); font-size:20px; line-height:1.1}
.bdx .raiser .by{margin-top:4px; font-size:13px; color:var(--muted)}

/* phone aur email ab dabaane laayak — tel: aur mailto: */
.bdx .raiser .ways{margin-left:auto; display:flex; gap:9px; flex-wrap:wrap}
.bdx .raiser .way{display:flex; align-items:center; gap:10px; min-width:0; border-radius:11px;
  border:1px solid var(--rule); background:var(--card); padding:8px 13px 9px;
  transition:border-color .18s, background .18s}
.bdx .raiser .way:hover{border-color:var(--mint-line); background:var(--mint)}
.bdx .raiser .way .wi{width:25px; height:25px; flex:none; border-radius:8px; display:grid;
  place-items:center; background:var(--card-2); color:var(--muted);
  transition:background .18s, color .18s}
.bdx .raiser .way:hover .wi{background:var(--card); color:var(--em-mid)}
.bdx .raiser .way > div{min-width:0}
.bdx .raiser .way .v{margin-top:3px; font-size:13.5px; color:var(--ink-2);
  font-variant-numeric:tabular-nums; transition:color .18s}
.bdx .raiser .way:hover .v{color:var(--em-deep)}
@media (max-width:640px){
  .bdx .raiser .ways{margin-left:0; width:100%}
  .bdx .raiser .way{flex:1 1 100%}
}
.bdx .callout{display:flex; gap:12px; border-radius:13px; border:1px solid var(--amber-line);
  border-left:4px solid var(--amber); background:var(--amber-bg); padding:13px 15px}
.bdx .callout .ic{width:28px; height:28px; flex:none; border-radius:9px; display:grid; place-items:center;
  border:1px solid var(--amber-line); background:var(--card); color:var(--amber)}
.bdx .callout .hd2{display:flex; align-items:baseline; gap:12px; flex-wrap:wrap}
.bdx .callout .hd2 .k{color:var(--amber)}
.bdx .callout .hd2 .from{margin-left:auto; font-size:11.5px; color:var(--amber)}
.bdx .callout p{margin:7px 0 0; font-size:14px; line-height:1.7; color:var(--amber-deep)}

/* kai nirdesh alag-alag line me hon to unhe alag-alag hi rakho */
.bdx .callout ul{margin:8px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:7px}
.bdx .callout li{display:flex; gap:10px; font-size:14px; line-height:1.65; color:var(--amber-deep)}
.bdx .callout li::before{content:""; width:5px; height:5px; flex:none; margin-top:7px;
  border-radius:999px; background:var(--amber)}
.bdx .decide{border-radius:18px; border:1.5px solid var(--violet-line); overflow:hidden;
  background:var(--card); box-shadow:0 24px 50px -30px rgba(109,40,217,.5)}
.bdx .decide .hd{display:flex; align-items:center; gap:13px; padding:15px 20px;
  border-bottom:1px solid var(--violet-line); background:linear-gradient(90deg,var(--violet-bg),var(--card))}
.bdx .decide .hd .ic{width:36px; height:36px; flex:none; border-radius:12px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--violet-line); color:var(--violet)}
.bdx .decide .hd h4{margin:0; font-family:var(--serif); font-size:21px; font-weight:600; color:var(--violet-deep)}
.bdx .decide .hd p{margin:2px 0 0; font-size:13px; color:var(--violet)}
.bdx .decide .hd .qn{margin-left:auto; font-family:var(--mono); font-size:12px; color:var(--violet); flex:none}
.bdx .money{display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-bottom:1px solid var(--rule)}
@media (max-width:640px){.bdx .money{grid-template-columns:1fr} }.bdx .money > div{padding:15px 20px; border-right:1px solid var(--rule)}
.bdx .money > div:last-child{border-right:none}
.bdx .money .v{margin-top:7px; font-size:23px; font-weight:700; line-height:1;
  letter-spacing:-.03em; font-variant-numeric:tabular-nums}
.bdx .money .n{margin-top:5px; font-size:12px; color:var(--faint)}
.bdx .money .pay{background:linear-gradient(180deg,var(--mint),var(--card))}
.bdx .money .pay .v{color:var(--em-mid)}
.bdx .rates{padding:6px 20px 16px}
.bdx .rates .row{display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px dashed var(--rule)}
.bdx .rates .row:last-of-type{border-bottom:none}
.bdx .rates .row .lbl{font-size:13.5px; color:var(--muted)}
.bdx .rates .row .amt{margin-left:auto; font-size:14px; font-weight:600; color:var(--ink-2); font-variant-numeric:tabular-nums}
.bdx .rates .tot{display:flex; align-items:baseline; gap:12px; margin-top:11px; padding-top:12px; border-top:2px solid var(--ink)}
.bdx .rates .tot .lbl{font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase}
.bdx .rates .tot .amt{margin-left:auto; font-size:20.5px; font-weight:800; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums}
.bdx .note{margin-top:12px; border-radius:12px; border:1px solid var(--amber-line); background:var(--amber-bg);
  padding:10px 13px; font-size:13.5px; line-height:1.6; color:var(--amber-deep)}
.bdx .note .k{color:var(--amber); margin-bottom:4px}
.bdx .note.plain{border-color:var(--rule-2); background:var(--card-2); color:var(--muted)}
.bdx .note.plain .k{color:var(--faint)}
.bdx .decide .act{display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:14px 20px;
  border-top:1px solid var(--rule); background:var(--card-2)}
.bdx .accept{display:inline-flex; align-items:center; gap:9px; border-radius:12px; padding:12px 22px;
  font-size:15px; font-weight:700; color:#fff; background:linear-gradient(180deg,#7C3AED,#6D28D9);
  box-shadow:0 16px 30px -16px rgba(109,40,217,.9); transition:transform .18s}
.bdx .accept:hover{transform:translateY(-2px)}
.bdx .decide .act .fine{font-size:12.5px; color:var(--muted)}
.bdx .decide .act .r{margin-left:auto}

/* jo quote abhi manzoori maang raha hai, uska rang card jaisa hi — violet */
.bdx .decide .money .pay{background:linear-gradient(180deg,var(--violet-bg),var(--card))}
.bdx .decide .money .pay .v{color:var(--violet-deep); font-size:27px}
.bdx .decide.ok .money .pay{background:linear-gradient(180deg,var(--mint),var(--card))}
.bdx .decide.ok .money .pay .v{color:var(--em-mid)}
.bdx .decide .money.q2{grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr)}
.bdx .decide .money.q2 > .counts{display:grid; gap:15px; padding:16px 20px;
  border-right:1px solid var(--rule)}
.bdx .decide .money.q2 > .pay{display:flex; flex-direction:column; justify-content:center}
.bdx .decide .money.q2 .counts .cv{margin-top:5px; font-size:22px; font-weight:700;
  letter-spacing:-.025em; line-height:1; font-variant-numeric:tabular-nums}
@media (max-width:640px){
  .bdx .decide .money.q2{grid-template-columns:1fr}
  .bdx .decide .money.q2 > .counts{border-right:none; border-bottom:1px solid var(--rule)}
}

/* quote ka note ab band nahi — details ke saath, ek italic pankti */
.bdx .decide .rates .qnote{margin:0; padding:14px 0 0; font-size:14px; line-height:1.7;
  color:var(--violet-deep); font-style:italic}

/* manzoori se pehle kya-kya hoga, teen line me */
.bdx .decide .act{flex-direction:row; align-items:center; gap:22px; flex-wrap:wrap;
  background:linear-gradient(180deg,var(--card),var(--violet-bg)); border-top-color:var(--violet-line)}
.bdx .decide .checks{flex:1 1 270px}
.bdx .decide .accept{flex:0 0 auto}
.bdx .decide.ok .act{background:linear-gradient(180deg,var(--card),var(--mint)); border-top-color:var(--mint-line)}
.bdx .decide .checks{display:flex; flex-direction:column; gap:7px}
.bdx .decide .checks > span{display:flex; align-items:flex-start; gap:9px; font-size:13px; color:var(--muted)}
.bdx .decide .checks b{font-weight:600; color:var(--ink-2)}
.bdx .decide .checks > span > svg{flex:none; margin-top:1px; color:var(--em-2)}
.bdx .decide .accept{padding:13px 24px; font-size:15.5px; justify-content:center}
@media (max-width:559px){ .bdx .decide .accept{flex:1 1 100%} }

/* quote ka apna note, header ke theek neeche */
.bdx .decide .qnote{margin:0; padding:13px 20px 0; font-size:14px; line-height:1.7;
  color:var(--violet-deep); font-style:italic}
.bdx .meter{padding:15px 18px; border-bottom:1px solid var(--rule); background:var(--card-2)}
.bdx .meter .hd{display:flex; align-items:baseline; justify-content:space-between; gap:12px}
.bdx .meter .hd b{font-size:14px; font-weight:600; color:var(--ink-2)}
.bdx .meter .hd .pc{font-size:17px; font-weight:800; letter-spacing:-.02em; color:var(--em-mid); font-variant-numeric:tabular-nums}
.bdx .meter .track{margin-top:9px; height:9px; border-radius:999px; background:var(--rule); overflow:hidden}
.bdx .meter .track i{display:block; height:100%; border-radius:999px;
  background:linear-gradient(90deg,#0EA47E,#22D383)}
.bdx .meter .n{margin-top:7px; font-size:12px; color:var(--faint)}
.bdx .fleet{display:grid; gap:14px; grid-template-columns:repeat(2,minmax(0,1fr)); padding:16px 18px}
@media (max-width:760px){.bdx .fleet{grid-template-columns:1fr} }.bdx .veh{border-radius:15px; border:1px solid var(--rule); background:var(--card); overflow:hidden;
  transition:transform .18s, box-shadow .18s, border-color .18s}
.bdx .veh:hover{transform:translateY(-2px); border-color:var(--mint-line); box-shadow:var(--lift)}
.bdx .shot{position:relative; height:132px; background:linear-gradient(150deg,#12241C,#1E3A2C 55%,#0E1B15);
  display:grid; place-items:center; overflow:hidden}
.bdx .shot .art{opacity:.4; color:#9FE8C4}
.bdx .shot::after{content:""; position:absolute; inset:0;
  background:linear-gradient(180deg,rgba(0,0,0,.24),transparent 42%,rgba(0,0,0,.62))}
.bdx .shot .idx{position:absolute; top:10px; left:10px; z-index:2; width:24px; height:24px; border-radius:999px;
  display:grid; place-items:center; font-size:12px; font-weight:700; color:#fff;
  background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); backdrop-filter:blur(4px)}
.bdx .shot .nm{position:absolute; left:12px; right:44px; bottom:10px; z-index:2; color:#fff;
  font-size:15px; font-weight:700; text-shadow:0 2px 8px rgba(0,0,0,.6);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
.bdx .shot .nav{position:absolute; top:50%; transform:translateY(-50%); z-index:2; width:26px; height:26px;
  border-radius:999px; display:grid; place-items:center; color:#fff;
  background:rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.2); backdrop-filter:blur(3px)}
.bdx .shot .nav.l{left:8px}
.bdx .shot .nav.r{right:8px}
.bdx .shot .dots{position:absolute; bottom:11px; left:50%; transform:translateX(-50%); z-index:2;
  display:flex; gap:5px}
.bdx .shot .dots i{width:6px; height:6px; border-radius:999px; background:rgba(255,255,255,.5)}
.bdx .shot .dots i.on{width:14px; background:#fff}
.bdx .veh{display:flex; flex-direction:column}
.bdx .veh .info{flex:1; display:flex; flex-direction:column; padding:12px 14px 13px}

/* number plate apni line par — gate par yahi milaana padta hai */
.bdx .veh .plateline{margin-bottom:9px}
.bdx .veh .plateline .plate{font-size:13.5px; padding:4px 10px; letter-spacing:.1em}

/* driver ka hissa hamesha card ke pendhe par, taaki ek kataar ke cards barabar dikhein */
.bdx .veh .foot2{margin-top:auto; padding-top:11px}

/* photo par hover — halki si zoom */
.bdx .veh .shot img{transition:transform .5s cubic-bezier(.2,.8,.3,1)}
.bdx .veh:hover .shot img{transform:scale(1.06)}
.bdx .plate{display:inline-flex; align-items:center; border-radius:5px; padding:3px 8px;
  font-family:var(--mono); font-size:12.5px; font-weight:700; letter-spacing:.09em;
  background:var(--plate); border:1px solid var(--plate-line); color:var(--plate-ink)}
.bdx .veh .driver{display:flex; align-items:center; gap:11px; border-radius:12px;
  padding:10px 12px; border:1px solid #A8D9D3;
  background:linear-gradient(100deg,#D6EEEB,var(--teal-bg))}
.bdx .veh .driver .pic{width:36px; height:36px; flex:none; border-radius:999px; display:grid; place-items:center;
  color:#fff; font-size:15px; font-weight:700; background:linear-gradient(135deg,#0d9488,#059669);
  box-shadow:0 0 0 2px var(--card), 0 0 0 4px #5EC9B4}
.bdx .veh .driver .nm2{font-size:14px; font-weight:700}
.bdx .veh .driver .ph{margin-top:2px; font-size:12.5px; color:var(--teal); display:flex; align-items:center; gap:5px;
  font-variant-numeric:tabular-nums}
.bdx .veh .waiting{display:flex; align-items:center; gap:9px; border-radius:12px;
  border:1px dashed var(--rule-2); background:var(--card-2); padding:9px 11px;
  font-size:13px; font-style:italic; color:var(--faint)}
.bdx .slots{padding:0 18px 16px; display:grid; gap:10px; grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:760px){.bdx .slots{grid-template-columns:repeat(2,minmax(0,1fr))} }.bdx .slot{border-radius:12px; border:1px dashed var(--rule-2); background:var(--card-2);
  padding:12px; text-align:center; font-size:12px; color:var(--faint)}
.bdx .slot b{display:block; font-family:var(--mono); font-size:12.5px; color:var(--ghost); margin-bottom:3px}
.bdx .slots .head{grid-column:1/-1; display:flex; align-items:center; gap:9px; margin-bottom:-2px}
.bdx .slots .head .ln{flex:1; height:1px; background:var(--rule)}

/* meter ke neeche teen ginti — kitne lage, kitne driver, kitne baaki */
.bdx .meter .mstat{display:flex; flex-wrap:wrap; gap:6px 18px; margin-top:10px; font-size:12.5px; color:var(--muted)}
.bdx .meter .mstat > span{display:inline-flex; align-items:baseline; gap:5px}
.bdx .meter .mstat b{font-size:15px; font-weight:700; color:var(--ink-2); font-variant-numeric:tabular-nums}
.bdx .meter .mstat > span:first-child b{color:var(--em-mid)}
.bdx .meter .track i{transition:width .6s cubic-bezier(.2,.8,.3,1)}

/* gaadi ka card thoda aur padhne laayak */
.bdx .veh .info .chips{align-items:center}
.bdx .veh .driver .ph{transition:color .18s}
.bdx .veh .driver a.ph:hover{color:var(--em-mid); text-decoration:underline}
.bdx .veh .seat{margin-left:auto; font-size:12px; color:var(--faint)}
.bdx .empty .ic{width:44px; height:44px; margin:0 auto 10px; border-radius:14px; display:grid;
  place-items:center; border:1px solid var(--rule); background:var(--card); color:var(--ghost)}
.bdx .trip{display:flex; align-items:center; gap:14px; padding:13px 18px; border-bottom:1px solid var(--rule);
  border-left:3px solid var(--rule-2); transition:background .18s}
.bdx .trip:last-child{border-bottom:none}
.bdx .trip:hover{background:var(--card-2)}
.bdx .trip.wait{border-left-color:#E0A93C}
.bdx .trip.run{border-left-color:var(--teal)}
.bdx .trip.done{border-left-color:var(--rule-2)}
.bdx .trip .idx{width:26px; height:26px; flex:none; border-radius:999px; display:grid; place-items:center;
  background:var(--sunk); font-size:12px; font-weight:700; color:var(--muted)}
.bdx .trip .l1{display:flex; align-items:center; gap:9px; flex-wrap:wrap}
.bdx .trip .code{font-family:var(--mono); font-size:13.5px; font-weight:700}
.bdx .trip .l2{margin-top:3px; font-size:13px; color:var(--muted)}
.bdx .trip .l3{margin-top:2px; font-size:12.5px; font-weight:600; color:var(--teal)}
.bdx .trip .acts{margin-left:auto; display:flex; gap:7px; flex:none}
.bdx .mini{display:inline-flex; align-items:center; gap:6px; border-radius:9px; padding:6px 11px;
  font-size:12.5px; font-weight:700; border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2);
  transition:border-color .18s, color .18s}
.bdx .mini:hover{border-color:var(--em-2); color:var(--em-mid)}
.bdx .mini.share{border-color:var(--mint-line); background:var(--mint); color:var(--em-mid)}
.bdx .pill{display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:2px 9px;
  font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; border:1px solid}
.bdx .p-wait{border-color:var(--amber-line); background:var(--amber-bg); color:var(--amber)}
.bdx .p-run{border-color:var(--teal-line); background:var(--teal-bg); color:var(--teal)}
.bdx .p-done{border-color:var(--rule-2); background:var(--card-2); color:var(--muted)}
.bdx .rail{display:flex; flex-direction:column; gap:13px; align-self:start; position:sticky; top:74px}
@media (max-width:1120px){.bdx .rail{position:static} }.bdx .rcard{border-radius:15px; border:1px solid var(--rule); background:var(--card); box-shadow:var(--rest); overflow:hidden}
.bdx .rcard .rc{padding:12px 16px; border-bottom:1px solid var(--rule); background:var(--card-2)}
.bdx .rcard .rc b{font-family:var(--serif); font-size:19.5px; font-weight:600}
.bdx .kv{display:flex; align-items:baseline; gap:12px; padding:10px 16px; border-bottom:1px solid var(--rule)}
.bdx .kv:last-child{border-bottom:none}
.bdx .kv .a{margin-left:auto; font-size:14px; font-weight:600; color:var(--ink-2); text-align:right; font-variant-numeric:tabular-nums}
.bdx .kv.big{background:var(--mint)}
.bdx .kv.big .a{font-size:18px; font-weight:800; letter-spacing:-.02em; color:var(--em-mid)}
.bdx .rcard.inv{border-color:var(--amber-line)}
.bdx .rcard.inv .rc{background:linear-gradient(90deg,var(--amber-bg),var(--card)); border-bottom-color:var(--amber-line)}
.bdx .rcard.inv .rc b{color:var(--amber-deep)}
.bdx .rcard.inv .amt{font-size:23px; font-weight:800; letter-spacing:-.02em; line-height:1; margin:12px 16px 0;
  color:var(--amber-deep); font-variant-numeric:tabular-nums}
.bdx .rcard.inv .sub{margin:6px 16px 0; font-size:12.5px; color:var(--amber); line-height:1.6}
.bdx .rcard.inv .pay{display:flex; align-items:center; justify-content:center; gap:8px; margin:12px 16px 14px;
  border-radius:11px; padding:10px; font-size:13.5px; font-weight:700; color:#fff;
  background:linear-gradient(180deg,#D9930F,#B4700F); box-shadow:0 14px 26px -16px rgba(180,112,15,.9);
  transition:transform .18s}
.bdx .rcard.inv .pay:hover{transform:translateY(-2px)}

/* summary ki panktiyan — waqt, meter, aur bina-quote wala haal */
.bdx .kv .sub2{display:block; margin-top:2px; font-size:12px; font-weight:400; color:var(--faint)}
.bdx .kv.stack{display:block}
.bdx .kv.stack .a{margin-left:0; margin-top:6px; text-align:left; display:block}
.bdx .rcard .bar{display:block; margin-top:7px; height:6px; border-radius:999px;
  background:var(--rule); overflow:hidden}
.bdx .rcard .bar i{display:block; height:100%; border-radius:999px;
  background:linear-gradient(90deg,#0EA47E,#22D383); transition:width .6s cubic-bezier(.2,.8,.3,1)}
.bdx .kv.wait{background:var(--card-2)}
.bdx .kv.wait .a{font-size:13px; font-weight:600; color:var(--faint)}

/* invoice — do khaane, due ki lakeer, aur chukta ho jaane par emerald */
.bdx .rcard.inv .duo{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); margin:13px 16px 0;
  border:1px solid var(--rule); border-radius:11px; overflow:hidden}
.bdx .rcard.inv .duo > div{padding:9px 12px; border-right:1px solid var(--rule); background:var(--card-2)}
.bdx .rcard.inv .duo > div:last-child{border-right:none}
.bdx .rcard.inv .duo .v2{margin:4px 0 0; font-size:15px; font-weight:700; color:var(--ink-2);
  font-variant-numeric:tabular-nums}
.bdx .rcard.inv .due{display:flex; align-items:center; gap:7px; flex-wrap:wrap;
  margin:11px 16px 0; font-size:13px; color:var(--amber-deep)}
.bdx .rcard.inv .due .od{border-radius:999px; border:1px solid var(--red-line); background:var(--red-bg);
  color:var(--red); padding:2px 8px; font-size:9.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase}
.bdx .rcard.inv.paid{border-color:var(--mint-line)}
.bdx .rcard.inv.paid .rc{background:linear-gradient(90deg,var(--mint),var(--card)); border-bottom-color:var(--mint-line)}
.bdx .rcard.inv.paid .rc b{color:var(--em-deep)}
.bdx .rcard.inv.paid .amt{color:var(--em-mid)}
.bdx .rcard.inv.paid .due{color:var(--em-mid)}
.bdx .rcard.inv.paid .pay{background:var(--card); border:1px solid var(--mint-line);
  color:var(--em-mid); box-shadow:none}
.bdx .rcard.inv.paid .pay:hover{background:var(--mint)}
.bdx .person{display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--rule)}
.bdx .person:last-child{border-bottom:none}
.bdx .person .ic{width:28px; height:28px; flex:none; border-radius:10px; display:grid; place-items:center}
.bdx .person .v{font-size:14px; color:var(--ink-2)}
.bdx .i-blue{background:var(--blue-bg); color:var(--blue)}
.bdx .i-mint{background:var(--mint); color:var(--em-mid)}
.bdx .i-violet{background:var(--violet-bg); color:var(--violet)}
.bdx .i-amber{background:var(--amber-bg); color:var(--amber)}
/* rail ka status badge — cover wale stamp jaisi bhasha, halke ground par:
   pill neutral, rang sirf bindu me. Pehle Tailwind ka bhara pastel chip tha. */
.bdx .spill{display:inline-flex; align-items:center; gap:7px; flex:none; margin-left:auto;
  border:1px solid var(--rule-2); border-radius:999px; background:var(--card);
  padding:4px 11px 4px 9px; font-size:10.5px; font-weight:700; letter-spacing:.07em;
  text-transform:uppercase; color:var(--sc,var(--ink-2)); white-space:nowrap}
/* pill ka ground aur border bhi usi rang se — halke me. color-mix na chale to
   upar wali neutral values bani rehti hain, text phir bhi rangeen rehta hai. */
.bdx .spill{border-color:color-mix(in srgb, var(--sc,#6F7C74) 30%, transparent);
  background:color-mix(in srgb, var(--sc,#6F7C74) 8%, #fff)}
.bdx .spill i{width:6px; height:6px; flex:none; border-radius:999px; background:var(--sc,var(--muted))}
/* summary ka label lamba ho sakta hai ("Vendor Responses Received") — isliye
   badge ko title ke bagal me thoosne ki jagah apni pankti di hai */
.bdx .rcard .rc-stack{display:block}
.bdx .rcard .rc-stack .spill{display:flex; width:fit-content; margin-left:0; margin-top:9px}

/* booking number sabse upar — yahi email/call par bola jaata hai */
.bdx .rcard .bno{display:flex; align-items:center; gap:11px; padding:13px 16px;
  border-bottom:1px solid var(--rule); background:linear-gradient(90deg,var(--mint),var(--card))}
.bdx .rcard .bno .bi{width:32px; height:32px; flex:none; border-radius:11px; display:grid;
  place-items:center; background:var(--card); border:1px solid var(--mint-line); color:var(--em-mid)}
.bdx .rcard .bno .bv{font-family:var(--mono); font-size:15px; font-weight:700;
  color:var(--em-deep); overflow-wrap:anywhere; line-height:1.25}

/* chhote tathya do khaano ki ruled grid me — kataar-dar-kataar se aadhi jagah lagti hai */
.bdx .rcard .duo2{display:grid; grid-template-columns:repeat(2,minmax(0,1fr))}
.bdx .rcard .duo2 > div{padding:10px 16px; border-right:1px solid var(--rule);
  border-bottom:1px solid var(--rule); min-width:0}
.bdx .rcard .duo2 > div:nth-child(2n){border-right:none}
.bdx .rcard .duo2 .v3{margin-top:4px; font-size:14px; font-weight:600; color:var(--ink-2);
  font-variant-numeric:tabular-nums}

/* fleet ka meter — wahi label-upar-value ka dhaancha */
.bdx .rcard .fleetrow{padding:11px 16px 13px; border-bottom:1px solid var(--rule)}
.bdx .rcard .fleetrow .v3{margin-top:4px; font-size:14px; font-weight:600; color:var(--ink-2);
  font-variant-numeric:tabular-nums}
.bdx .rcard .fleetrow .bar{margin-top:9px}

/* total apna block — kv pankti nahi, taaki wo card ka ant lage */
.bdx .rcard .totalrow{padding:13px 16px 15px; background:var(--mint)}
.bdx .rcard .totalrow .amt2{margin-top:6px; font-size:24px; font-weight:800; letter-spacing:-.025em;
  line-height:1; color:var(--em-mid); font-variant-numeric:tabular-nums}
.bdx .rcard .totalrow .n3{margin-top:7px; font-size:12px; color:var(--em-mid); opacity:.72}
.bdx .rcard .totalrow.wait2{background:var(--card-2)}
.bdx .rcard .totalrow.wait2 .amt2{font-size:15px; font-weight:600; color:var(--faint)}
.bdx .rcard .totalrow.wait2 .n3{color:var(--faint)}

/* contact info — upar pehchaan, neeche wo panktiyan jinpar click hota hai */
.bdx .ident{display:flex; align-items:center; gap:11px; padding:13px 16px;
  border-bottom:1px solid var(--rule); background:var(--card-2)}
.bdx .ident .ini2{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  color:#fff; font-size:16px; font-weight:700; background:linear-gradient(140deg,var(--em-1),var(--em-2))}
.bdx .ident .co2{margin:0; font-family:var(--serif); font-size:20.5px; font-weight:600; line-height:1.15}
.bdx .ident .by2{margin:3px 0 0; font-size:12.5px; color:var(--muted)}
.bdx a.person{transition:background .18s}
.bdx a.person:hover{background:var(--card-2)}
.bdx a.person:hover .v{color:var(--em-mid)}
.bdx .person .go2{margin-left:auto; flex:none; color:var(--ghost); transition:color .18s, transform .18s}
.bdx a.person:hover .go2{color:var(--em-2); transform:translateX(2px)}

.bdx .chat{display:flex; align-items:center; gap:11px; padding:13px 16px}
.bdx .chat .ic{width:33px; height:33px; flex:none; border-radius:12px; display:grid; place-items:center;
  background:var(--mint); color:var(--em-mid)}
.bdx .chat .go{margin-left:auto; color:var(--ghost)}

/* vendor se baat — sheet ke andar ka parichay aur uska button */
.bdx .vchat{display:flex; align-items:center; gap:13px; padding:15px 18px}
.bdx .vchat .ic{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  background:var(--mint); border:1px solid var(--mint-line); color:var(--em-mid)}
.bdx .vchat .t{margin:0; font-size:15px; font-weight:600; color:var(--ink-2)}
.bdx .vchat .s{margin:3px 0 0; font-size:13px; color:var(--muted)}
.bdx .vchat .who3{display:flex; flex-wrap:wrap; gap:6px; margin-top:7px}
.bdx .vchat .who3 span{display:inline-flex; align-items:center; gap:5px; border-radius:999px;
  border:1px solid var(--mint-line); background:var(--mint); color:var(--em-mid);
  padding:3px 10px; font-size:12px; font-weight:600}
.bdx .vcta{padding:0 18px 16px}
.bdx .vcta .skel{height:44px; border-radius:12px; background:var(--sunk)}
.bdx .chat:hover .go{color:var(--em-2)}

/* ── the dialog ─────────────────────────────────────────── */
.bdx.mask{position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding:20px}
.bdx.mask .veil{position:absolute; inset:0; background:rgba(6,20,14,.62); backdrop-filter:blur(7px)}
.bdx .mdl{position:relative; width:100%; max-width:400px; border-radius:18px; overflow:hidden;
  background:var(--card); border:1px solid var(--rule);
  box-shadow:0 44px 84px -42px rgba(3,26,16,.85)}
.bdx .mdl .mhd{display:flex; align-items:center; gap:13px; padding:16px 20px; border-bottom:1px solid var(--rule)}
.bdx .mdl .mic{width:40px; height:40px; flex:none; border-radius:13px; display:grid; place-items:center;
  border:1px solid; background:var(--card)}
.bdx .mdl .mhd h4{margin:3px 0 0; font-family:var(--serif); font-size:22px; font-weight:600; line-height:1.15}
.bdx .mdl .msg{margin:0; padding:15px 20px 0; font-size:14px; line-height:1.7; color:var(--muted)}
.bdx .mdl .recap{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); margin:15px 20px 0;
  border:1px solid var(--rule); border-radius:13px; overflow:hidden}
.bdx .mdl .recap > div{padding:11px 14px; border-right:1px solid var(--rule); background:var(--card-2)}
.bdx .mdl .recap > div:last-child{border-right:none; background:linear-gradient(180deg,var(--mint),var(--card))}
.bdx .mdl .recap .v{margin-top:6px; font-size:20.5px; font-weight:800; letter-spacing:-.02em;
  font-variant-numeric:tabular-nums}
.bdx .mdl .recap > div:last-child .v{color:var(--em-mid)}
.bdx .mdl .mact{display:flex; gap:10px; margin-top:17px; padding:15px 20px;
  border-top:1px solid var(--rule); background:var(--card-2)}
.bdx .mdl .mact > *{flex:1; justify-content:center}

.bdx .mdl.confirm{border-color:var(--violet-line)}
.bdx .mdl.confirm .mhd{background:linear-gradient(90deg,var(--violet-bg),var(--card)); border-bottom-color:var(--violet-line)}
.bdx .mdl.confirm .mic{border-color:var(--violet-line); color:var(--violet)}
.bdx .mdl.confirm .mhd h4{color:var(--violet-deep)}
.bdx .mdl.success{border-color:var(--mint-line)}
.bdx .mdl.success .mhd{background:linear-gradient(90deg,var(--mint),var(--card)); border-bottom-color:var(--mint-line)}
.bdx .mdl.success .mic{border-color:var(--mint-line); color:var(--em-mid)}
.bdx .mdl.success .mhd h4{color:var(--em-deep)}
.bdx .mdl.error{border-color:var(--red-line)}
.bdx .mdl.error .mhd{background:linear-gradient(90deg,var(--red-bg),var(--card)); border-bottom-color:var(--red-line)}
.bdx .mdl.error .mic{border-color:var(--red-line); color:var(--red)}
.bdx .mdl.error .mhd h4{color:var(--red-deep)}

.bdx .mbtn{display:inline-flex; align-items:center; gap:8px; border-radius:12px; padding:11px 18px;
  font-size:14px; font-weight:700; transition:transform .18s, background .18s, border-color .18s, color .18s}
.bdx .mbtn:hover{transform:translateY(-2px)}
.bdx .mbtn.ghost{border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2)}
.bdx .mbtn.ghost:hover{color:var(--ink)}
.bdx .mbtn.go{color:#fff; background:linear-gradient(180deg,#7C3AED,#6D28D9);
  box-shadow:0 16px 30px -16px rgba(109,40,217,.9)}
.bdx .mbtn.ok{color:#fff; background:linear-gradient(180deg,#0EA47E,#056B3E);
  box-shadow:0 16px 30px -16px rgba(4,50,31,.9)}

@keyframes bdxVeil{from{opacity:0} to{opacity:1}}
@keyframes bdxMdl{from{opacity:0; transform:translateY(12px) scale(.975)} to{opacity:1; transform:none}}
.bdx.mask .veil{animation:bdxVeil .2s ease-out}
.bdx .mdl{animation:bdxMdl .24s cubic-bezier(.2,.8,.3,1)}

@media (prefers-reduced-motion:reduce){.bdx *{transition:none !important; animation:none !important} }

/* ── React markup ke liye chhote additions ─────────────────────────────── */
.bdx .shot img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.9}
.bdx .shot .dots button{width:6px; height:6px; border-radius:999px; background:rgba(255,255,255,.5); padding:0; border:none}
.bdx .shot .dots button.on{width:14px; background:#fff}
.bdx .veh .driver img.pic{object-fit:cover}
.bdx .grp .pref{margin:12px 0 0}
.bdx .fleet4.c2{grid-template-columns:repeat(2,minmax(0,1fr))}
.bdx .fleet4.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.bdx .money.c2{grid-template-columns:repeat(2,minmax(0,1fr))}
.bdx .money.c1{grid-template-columns:minmax(0,1fr)}

/* quote card jab accept ho chuka ho — wahi dhaancha, emerald me */
.bdx .decide.ok{border-color:var(--mint-line); box-shadow:0 24px 50px -30px rgba(4,50,31,.42)}
.bdx .decide.ok .hd{border-bottom-color:var(--mint-line); background:linear-gradient(90deg,var(--mint),var(--card))}
.bdx .decide.ok .hd .ic{border-color:var(--mint-line); color:var(--em-mid)}
.bdx .decide.ok .hd h4{color:var(--em-deep)}
.bdx .decide.ok .hd p, .bdx .decide.ok .hd .qn{color:var(--em-mid)}

/* trip ki gin-ti ka strip */
.bdx .stats{display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); margin-bottom:13px;
  border:1px solid var(--rule); border-radius:13px; overflow:hidden; background:var(--card); box-shadow:var(--rest)}
@media (max-width:760px){ .bdx .stats{grid-template-columns:repeat(3,minmax(0,1fr))} }
.bdx .stats > div{padding:11px 12px; text-align:center; border-right:1px solid var(--rule)}
.bdx .stats > div:last-child{border-right:none}
@media (max-width:760px){
  .bdx .stats > div:nth-child(3n){border-right:none}
  .bdx .stats > div:nth-child(-n+3){border-bottom:1px solid var(--rule)}
}
.bdx .stats .v{font-size:21px; font-weight:700; line-height:1; letter-spacing:-.02em; font-variant-numeric:tabular-nums}
.bdx .stats .l{margin-top:3px; font-size:11.5px; color:var(--faint)}

/* radd ki hui trip */
.bdx .trip.cx{border-left-color:var(--red)}
.bdx .p-cx{border-color:var(--red-line); background:var(--red-bg); color:var(--red)}

/* trip ki kataar — code upar, gaadi/driver neeche, vendor dayin taraf */
.bdx .trip > div{flex:1; min-width:0}
.bdx .trip .l1 .vend{margin-left:auto; flex:none; display:inline-flex; align-items:center; gap:5px;
  font-size:12px; color:var(--teal)}
.bdx .trip .l2{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:5px;
  font-size:13px; color:var(--muted)}
.bdx .trip .l2 b{font-size:13.5px; font-weight:600; color:var(--ink-2)}
.bdx .trip .l2 .plate{font-size:11px; padding:2px 6px; letter-spacing:.07em;
  background:#FDF3D6; border-color:#E8CE8C}
.bdx .trip .l2 a{display:inline-flex; align-items:center; gap:4px; color:var(--muted); transition:color .18s}
.bdx .trip .l2 a:hover{color:var(--em-mid); text-decoration:underline}
.bdx .trip .l2 .sep{width:1px; height:11px; flex:none; background:var(--rule-2)}
.bdx .trip .l2 .sd{color:var(--sky)}
.bdx .mini.track{border-color:var(--blue-line); background:var(--blue-bg); color:var(--blue)}
.bdx .mini.track:hover{border-color:var(--blue); color:var(--blue)}
.bdx .mini.copied{border-color:var(--mint-line); background:var(--mint); color:var(--em-mid)}

/* chhoti screen par kataar do line me — buttons neeche apni line par */
@media (max-width:640px){
  .bdx .trip{flex-wrap:wrap}
  .bdx .trip > div:not(.acts){flex:1 1 auto; min-width:0}
  .bdx .trip .acts{flex:1 1 100%; margin-left:0; margin-top:10px}
  .bdx .trip .acts > *{flex:1; justify-content:center}
  .bdx .trip .l1 .vend{margin-left:0}
}

/* lambi list ke aakhir me halka dhundhlapan, taaki pata chale aur bhi hai */
.bdx .tlist{position:relative}
.bdx .tlist .scroller{max-height:480px; overflow-y:auto}
.bdx .tlist.more::after{content:""; position:absolute; inset-inline:0; bottom:0; height:34px;
  pointer-events:none; background:linear-gradient(180deg,rgba(255,255,255,0),var(--card))}

/* jinki ginti sifar hai, unhe halka rakho */
.bdx .stats .l{display:inline-flex; align-items:center; gap:5px}
.bdx .stats .l i{width:5px; height:5px; flex:none; border-radius:999px}
.bdx .stats > div.zero .v{color:var(--ghost)}
.bdx .stats > div.zero .l i{background:var(--rule-2)}

/* "Total" baaki paanch ka jod hai, isliye alag dikhna chahiye */
.bdx .stats > div.tot{background:var(--card-2); border-right-width:2px}

/* ginti ke neeche unka anupaat — ek nazar me pata chale kaunsa hissa kitna hai */
.bdx .stats .mix{grid-column:1/-1; border-right:none; border-top:1px solid var(--rule);
  background:var(--card-2); padding:12px 15px 13px; text-align:left}
.bdx .stats .mix .bar2{display:flex; gap:3px; height:7px}
.bdx .stats .mix .bar2 > span{position:relative; border-radius:999px; overflow:hidden; min-width:3px}
.bdx .stats .mix .bar2 > span::after{content:""; position:absolute; inset-inline:0; top:0;
  height:50%; border-radius:999px; background:rgba(255,255,255,.32)}
.bdx .stats .mix .cap3{display:flex; align-items:baseline; justify-content:space-between; gap:12px;
  margin-bottom:8px}
.bdx .stats .mix .cap3 .n2{font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums}
.bdx .stats .mix .cap3 .n2 b{font-weight:700; color:var(--ink-2)}

/* khaali fleet ka sandesh */
.bdx .empty{grid-column:1/-1; border-radius:13px; border:1px dashed var(--rule-2); background:var(--card-2);
  padding:26px; text-align:center}
.bdx .empty b{display:block; font-size:14px; color:var(--muted)}
.bdx .empty span{display:block; margin-top:4px; font-size:12.5px; color:var(--faint)}

.bdx .btn:disabled, .bdx .accept:disabled{opacity:.5; transform:none; cursor:default}
`;

function VehicleCard({ index, displayName, images, vehicle: v, driver: d, isSelfDrive, Art = Car }: {
  index: number; displayName: string; images: string[]; vehicle: any; driver: any; isSelfDrive: boolean;
  Art?: any;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;

  return (
    <div className="veh">
      <div className="shot">
        <span className="idx">{index + 1}</span>
        {hasImages ? (
          <>
            <img src={images[imgIdx]} alt={`${displayName} ${imgIdx + 1}`} />
            {hasMultiple && (
              <>
                <button className="nav l" aria-label="Previous photo"
                  onClick={() => setImgIdx((imgIdx - 1 + images.length) % images.length)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="nav r" aria-label="Next photo"
                  onClick={() => setImgIdx((imgIdx + 1) % images.length)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="dots">
                  {images.map((_: string, j: number) => (
                    <button key={j} onClick={() => setImgIdx(j)} aria-label={`Photo ${j + 1}`}
                      className={j === imgIdx ? 'on' : ''} />
                  ))}
                </span>
              </>
            )}
          </>
        ) : (
          <span className="art"><Art width={86} height={86} strokeWidth={1.1} /></span>
        )}
        <span className="nm">{displayName}</span>
      </div>

      <div className="info">
        {v?.registrationNumber && (
          <div className="plateline"><span className="plate">{v.registrationNumber}</span></div>
        )}
        <div className="chips">
          {v?.color && <span className="chip">{v.color}</span>}
          {v?.seatingCapacity && (
            <span className="chip b"><Users className="w-2.5 h-2.5" /> {v.seatingCapacity} seats</span>
          )}
          {v?.fuelType && (
            <span className="chip m"><Fuel className="w-2.5 h-2.5" /> {v.fuelType}</span>
          )}
          {v?.transmission && (
            <span className="chip v"><Settings2 className="w-2.5 h-2.5" /> {v.transmission}</span>
          )}
        </div>

        {!isSelfDrive && (
          <div className="foot2">
            {d ? (
              <div className="driver">
                {d.profilePhoto
                  ? <img src={d.profilePhoto} alt={d.name} className="pic" />
                  : <span className="pic">{d.name?.charAt(0)?.toUpperCase()}</span>}
                <div style={{ minWidth: 0 }}>
                  <p className="nm2">{d.name}</p>
                  {d.phone && (
                    <a className="ph" href={`tel:${d.phone}`} onClick={e => e.stopPropagation()}>
                      <Phone className="w-3 h-3" /> {d.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="waiting"><Clock className="w-3.5 h-3.5" /> Driver to be assigned</div>
            )}
          </div>
        )}

        {isSelfDrive && (
          <div className="foot2">
            <span className="chip b"><Car className="w-2.5 h-2.5" /> Self Drive</span>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  OPEN_FOR_QUOTES: 'Open for Quotes', QUOTES_RECEIVED: 'Vendor Responses Received',
  SUPER_QUOTE_SENT: 'Quote Ready for Review', CONFIRMED: 'Confirmed',
  TRIPS_CREATED: 'Trips Created', IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed', INVOICED: 'Invoice Sent', PAID: 'Paid', CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
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

/* Cover ke gehre ground par light-pastel pill achhi nahi lagti, isliye wahan
   stamp + is naqshe ka bindu. STATUS_COLORS rail me jaisa tha waisa hi hai. */
const STATUS_DOTS = {
  OPEN_FOR_QUOTES: '#93C5FD', QUOTES_RECEIVED: '#A5B4FC', SUPER_QUOTE_SENT: '#C4B5FD',
  CONFIRMED: '#6EE7B7', TRIPS_CREATED: '#5EEAD4', IN_PROGRESS: '#86EFAC',
  COMPLETED: '#D1D5DB', INVOICED: '#FDBA74', PAID: '#4ADE80', CANCELLED: '#FCA5A5',
};

/* Aur ye halke ground (rail) ke liye — STATUS_COLORS ke wahi hue, par thos,
   taaki pill neutral rahe aur rang sirf bindu me aaye. */
const STATUS_INK = {
  OPEN_FOR_QUOTES: '#1D4ED8', QUOTES_RECEIVED: '#4338CA', SUPER_QUOTE_SENT: '#6D28D9',
  CONFIRMED: '#047857', TRIPS_CREATED: '#0B7C74', IN_PROGRESS: '#059669',
  COMPLETED: '#4B5563', INVOICED: '#B4700F', PAID: '#047857', CANCELLED: '#BE123C',
};

const STATUS_STEPS = [
  'OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED',
];

const TRIP_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700', DRIVER_ARRIVED: 'bg-blue-100 text-blue-700',
  STARTED: 'bg-green-100 text-green-700', COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700', VENDOR_CANCELLED: 'bg-red-100 text-red-700',
};

const TRIP_TONES = {
  PENDING: ['wait', 'p-wait'], DRIVER_ARRIVED: ['run', 'p-run'],
  STARTED: ['run', 'p-run'], COMPLETED: ['done', 'p-done'],
  CANCELLED: ['cx', 'p-cx'], VENDOR_CANCELLED: ['cx', 'p-cx'],
};

const SERVICE_ICONS = {
  car: Car, bus: Bus, bike: Bike, truck: Truck, equipment: Wrench,
  packers: Package, luxury: Star, 'self-drive': Car,
};

const TRIP_TYPE_LABELS = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly', SELF_DRIVE: 'Self Drive',
};

function parseSelfDrivePreference(notes: string | null): any {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch { return null; }
}

export default function CustomerB2BBookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState(searchParams.get('customer_id') || '');
  const openChat = searchParams.get('open_chat') === '1';
  const [booking, setBooking] = useState<any>(null);
  const [tripStats, setTripStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [modal, setModal] = useState<{ type: 'confirm' | 'success' | 'error'; title: string; message: string; onConfirm?: () => void } | null>(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);

  useEffect(() => {
    if (!customerId && typeof window !== 'undefined') {
      const stored = localStorage.getItem('customer');
      if (stored) {
        try { const c = JSON.parse(stored); if (c.id) setCustomerId(String(c.id)); } catch (e) {}
      }
    }
  }, [customerId]);

  useEffect(() => {
    fetchBooking();
    const iv = setInterval(fetchBooking, 15000);
    return () => clearInterval(iv);
  }, []);

  async function fetchBooking() {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('customerToken') || localStorage.getItem('token')
          : null;
      const res = await fetch(`/api/b2b/bookings/${params.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.status === 'success') { setBooking(data.booking); setTripStats(data.tripStats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function confirmAcceptSuperQuote(superQuoteId: string) {
    setModal({
      type: 'confirm',
      title: 'Confirm Booking',
      message: 'Are you sure you want to accept this quote? Trips will be created automatically and vehicles will be assigned for your booking.',
      onConfirm: () => doAcceptSuperQuote(superQuoteId),
    });
  }

  async function doAcceptSuperQuote(superQuoteId: string) {
    setModal(null);
    setAccepting(true);
    try {
      const res = await fetch(`/api/b2b/super-quotes/${superQuoteId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setModal({
          type: 'success',
          title: 'Booking Confirmed!',
          message: `Your booking has been confirmed. ${data.tripsCreated} trip${data.tripsCreated > 1 ? 's have' : ' has'} been created. You can track all trips from this page.`,
        });
        fetchBooking();
      } else {
        setModal({ type: 'error', title: 'Failed', message: data.error || 'Could not accept the quote. Please try again.' });
      }
    } catch (e) {
      setModal({ type: 'error', title: 'Error', message: 'Something went wrong. Please check your connection and try again.' });
    } finally {
      setAccepting(false);
    }
  }

  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  function copyTripLink(tripCode: string, tripId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/trip/${tripCode}`);
    setCopiedTripId(tripId);
    setTimeout(() => setCopiedTripId(null), 2000);
  }

  function shareTrip(trip: any, index: number) {
    const link = `${window.location.origin}/trip/${trip.tripCode}`;
    const vehicleInfo = trip.vehicleName || trip.vehicleNumber || `Vehicle ${index + 1}`;
    const driverInfo = booking.serviceType !== 'self-drive' && trip.driverName ? `\nDriver: ${trip.driverName}${trip.driverPhone ? ` (${trip.driverPhone})` : ''}` : '';
    const text = `🚗 *Trip ${index + 1} Details*\nBooking: ${booking.bookingNumber}\nVehicle: ${vehicleInfo}${driverInfo}\n\nTrack live: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-white flex justify-center items-center pt-24`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#09B368]" />
        <p className="text-sm text-gray-500">Loading booking details...</p>
      </div>
    </div>
  );
  if (!booking) return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-white flex justify-center items-center pt-24`}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Booking not found</p>
      </div>
    </div>
  );

  const SvcIcon = SERVICE_ICONS[booking.serviceType] || Car;
  const latestSuperQuote = booking.superQuotes?.find((sq: any) => sq.status === 'SENT' || sq.status === 'ACCEPTED');
  const currentStepIndex = STATUS_STEPS.indexOf(booking.status);
  // Get quote IDs included in the active super quote
  const superQuoteVendorIds = new Set(
    latestSuperQuote?.items?.map((item: any) => item.vendorQuoteId) || []
  );
  const confirmedQuotes = booking.vendorQuotes?.filter((q: any) =>
    q.status === 'CONFIRMED' || q.status === 'ACCEPTED' || superQuoteVendorIds.has(q.id)
  ) || [];
  const totalVendorVehicles = confirmedQuotes.reduce((sum: number, q: any) => sum + q.vehicleCount, 0);
  const isSelfDrive = booking.serviceType === 'self-drive';
  const selfDrivePref = isSelfDrive ? parseSelfDrivePreference(booking.specialNotes) : null;

  /* Sirf dikhawe ke liye — kaun sa padav kis haalat me hai, aur do-teen labels.
     Data, conditions aur handlers me kuch nahi badla. */
  const cancelled = booking.status === 'CANCELLED';
  const nodeState = (i: number) =>
    cancelled ? 'todo' : i === currentStepIndex ? 'now' : i < currentStepIndex ? 'done' : 'todo';
  const nodeClass = (i: number) => `node ${nodeState(i)}`;
  const spineFill = cancelled ? 0 : Math.round(((currentStepIndex + 1) / 8) * 100);
  const assignedPct = booking.vehiclesRequired
    ? Math.round((totalVendorVehicles / booking.vehiclesRequired) * 100)
    : 0;
  const fleetCells = 2 + (booking.passengerCount ? 1 : 0) + (isSelfDrive ? 0 : 1);
  /* Note wahi source se aata hai jo pehle tha — self-drive me parsed preference se,
     warna booking.specialNotes se. Alag-alag line ho to alag-alag nirdesh maan lo. */
  const specialNote = isSelfDrive ? (selfDrivePref?.customerNotes || '') : (booking.specialNotes || '');
  const noteLines = String(specialNote).split(/\r?\n+/).map((t: string) => t.trim()).filter(Boolean);

  const summaryFacts = [
    { k: 'Service', v: isSelfDrive ? 'Self Drive' : booking.serviceType, cap: true },
    ...(isSelfDrive ? [] : [{ k: 'Trip type', v: TRIP_TYPE_LABELS[booking.tripType] || booking.tripType }]),
    { k: 'Vehicles', v: booking.vehiclesRequired },
    ...(booking.passengerCount ? [{ k: 'Passengers', v: booking.passengerCount }] : []),
    { k: isSelfDrive ? 'Starts' : 'Date', v: formatDate(booking.scheduledDate) },
    ...(booking.scheduledTime ? [{ k: 'Time', v: formatTime(booking.scheduledTime) }] : []),
    ...(booking.returnDate ? [{ k: isSelfDrive ? 'Ends' : 'Returns', v: formatDate(booking.returnDate) }] : []),
    ...(booking.returnDate && booking.returnTime ? [{ k: 'Return time', v: formatTime(booking.returnTime) }] : []),
  ];

  const ticketFacts = [
    { k: isSelfDrive ? 'Location' : 'Pickup', v: booking.pickupLocation, Icon: MapPin },
    { k: 'Scheduled', v: formatDate(booking.scheduledDate), Icon: Calendar },
    { k: 'Vehicles', v: `${booking.vehiclesRequired} Vehicle${booking.vehiclesRequired > 1 ? 's' : ''}`, Icon: Car },
    ...(booking.passengerCount
      ? [{ k: 'Passengers', v: `${booking.passengerCount} Passengers`, Icon: Users }]
      : []),
    { k: 'Service', v: isSelfDrive ? 'Self Drive' : `${booking.serviceType} Rental`, Icon: SvcIcon, cap: true },
  ];
  const awaiting = Math.max(0, (booking.vehiclesRequired || 0) - totalVendorVehicles);
  const vendorNames: string[] = [...new Set(
    (booking.trips || []).map((t: any) => t?.vendor?.businessName).filter(Boolean)
  )] as string[];
  const driversConfirmed = confirmedQuotes
    .flatMap((q: any) => q.quoteVehicles || [])
    .filter((qv: any) => qv.driver).length;
  const pad2 = (x: number) => String(x).padStart(2, '0');
  const slotBatches = (() => {
    if (awaiting < 1) return [];
    const groups = Math.min(4, awaiting);
    const per = Math.ceil(awaiting / groups);
    const out: number[][] = [];
    let from = totalVendorVehicles + 1;
    while (from <= booking.vehiclesRequired) {
      const to = Math.min(from + per - 1, booking.vehiclesRequired);
      out.push([from, to]);
      from = to + 1;
    }
    return out;
  })();
  const durationLabel = (() => {
    if (!booking.returnDate) return 'Single day';
    const start = new Date(booking.scheduledDate);
    const end = new Date(booking.returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Same day';
  })();

  const Tick = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  );
  const Glyph = ({ i, n }: { i: number; n: number }) => {
    const st = nodeState(i);
    if (st === 'done') return <Tick />;
    if (st === 'now') return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <circle cx="12" cy="12" r="5" />
      </svg>
    );
    return <>{n}</>;
  };

  return (
    <>
      <CustomerHeader showBackButton backHref={`/customer/b2b-bookings?customer_id=${customerId}`} title="Booking Detail" />
      <style dangerouslySetInnerHTML={{ __html: BDX_CSS }} />

      <div className={`${quoteDisplay.variable} bdx min-h-screen bg-white`}>

        {/* ══ the dossier cover ══ */}
        <section className={`cover ${cancelled ? 'off' : ''}`}>
          <i className="ovgrid" /><i className="ovkey" /><i className="ovlit" />
          <div className="tk">

            {/* baayan stub — booking ki pehchaan */}
            <div className="stub">
              <div className="chead">
                <span className="mark"><SvcIcon className="w-6 h-6" /></span>
                <div style={{ minWidth: 0 }}>
                  <p className="eyebrow">B2B corporate booking</p>
                  <div className="no">
                    <b>{booking.bookingNumber}</b>
                    <span className="stamp2">
                      <i style={{ background: STATUS_DOTS[booking.status] || '#D1D5DB' }} />
                      {STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>
                  <p className="who2">
                    <b>{booking.companyName}</b> · raised by {booking.customerName}
                    {booking.bookingMode && <span className="ta">🌟 TA · {booking.bookingMode}</span>}
                  </p>
                </div>

                {booking.travelAgentId && (
                  <div className="side">
                    <Link href="/travel-agent/bookings" className="btn w">
                      <Building2 className="w-3.5 h-3.5" />
                      Track on Business Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* phata hua kinara */}
            <div className="perf" />

            {/* dayin taraf tally — wahi paanch cheezein */}
            <div className="tally" style={{ ['--cols' as any]: ticketFacts.length }}>
              {ticketFacts.map((f: any) => (
                <div key={f.k} className="tile">
                  <span className="lit2" />
                  <p className="tl"><span className="ch"><f.Icon className="w-3 h-3" /></span>{f.k}</p>
                  <p className={`tv ${f.cap ? 'capitalize' : ''}`}>{f.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="prog"><i style={{ width: `${spineFill}%` }} /></div>
        </section>

        <main className="wrap">
          <div className="body">

            {/* ══ the spine — every stage of the booking, in order ══ */}
            <div className="spine">

              {/* 0 ─ the requirement itself */}
              <article className="node done">
                <span className="dot"><Tick /></span>
                <div className="cap"><h3>Requirement raised</h3></div>
                <p className="say">{booking.customerName} posted this for <b>{booking.companyName}</b>.</p>

                <div className="panel sheet">
                  <div className="cap2">
                    <FileText className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    <b>Booking details</b>
                    <span className="n">as submitted</span>
                  </div>

                  {/* the journey */}
                  <div className="grp">
                    <p className="k">The journey</p>
                    <div className="route">
                      <div className="end">
                        <p className="p"><i /><span className="nm">{booking.pickupLocation}</span></p>
                        <p className="k">{isSelfDrive ? 'Location' : 'Pickup location'}</p>
                      </div>
                      {booking.dropLocation && !isSelfDrive && (
                        <>
                          <div className="mid">
                            <span className="ln" />
                            <span className="glyph"><SvcIcon className="w-4 h-4" /></span>
                          </div>
                          <div className="end to">
                            <p className="p"><span className="nm">{booking.dropLocation}</span><i /></p>
                            <p className="k">Drop location</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="sched">
                      <div>
                        <p className="k">{isSelfDrive ? 'Rental starts' : 'Departs'}</p>
                        <p className="v">{formatDate(booking.scheduledDate)}<small>{formatTime(booking.scheduledTime)}</small></p>
                      </div>
                      <div>
                        <p className="k">{isSelfDrive ? 'Rental ends' : 'Returns'}</p>
                        {booking.returnDate ? (
                          <p className="v">
                            {formatDate(booking.returnDate)}
                            <small>{booking.returnTime ? formatTime(booking.returnTime) : ''}</small>
                          </p>
                        ) : (
                          <p className="v" style={{ color: 'var(--ghost)', fontWeight: 400 }}>
                            No return leg
                            <small style={{ color: 'var(--faint)' }}>{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</small>
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="k">Duration</p>
                        <span className="span"><Clock className="w-3 h-3" /> {durationLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* the fleet asked for */}
                  <div className="grp">
                    <p className="k">The fleet asked for</p>
                    <div className={`fleet4 c${fleetCells}`}>
                      <div>
                        <p className="kk k">
                          <span style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><Car className="w-2.5 h-2.5" /></span>
                          Vehicles
                        </p>
                        <p className="big" style={{ color: 'var(--blue)' }}>{booking.vehiclesRequired}</p>
                        <p className="n">{booking.vehicleCategory ? `Category: ${booking.vehicleCategory}` : 'Required'}</p>
                      </div>

                      {booking.passengerCount ? (
                        <div>
                          <p className="kk k">
                            <span style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}><Users className="w-2.5 h-2.5" /></span>
                            Passengers
                          </p>
                          <p className="big" style={{ color: 'var(--violet)' }}>{booking.passengerCount}</p>
                          <p className="n">Riders in total</p>
                        </div>
                      ) : null}

                      <div>
                        <p className="kk k">
                          <span style={{ background: 'var(--mint)', color: 'var(--em-mid)' }}><SvcIcon className="w-2.5 h-2.5" /></span>
                          Service
                        </p>
                        <p className="txt capitalize">{isSelfDrive ? 'Self Drive Rental' : `${booking.serviceType} Rental`}</p>
                        <p className="n">Service type</p>
                      </div>

                      {!isSelfDrive && (
                        <div>
                          <p className="kk k">
                            <span style={{ background: 'var(--card-2)', color: 'var(--muted)' }}><Route className="w-2.5 h-2.5" /></span>
                            Trip type
                          </p>
                          <p className="txt">{TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}</p>
                          <p className="n">As requested</p>
                        </div>
                      )}
                    </div>

                    {/* self-drive: the vehicle the customer named */}
                    {isSelfDrive && selfDrivePref && (selfDrivePref.vehicleModelName || selfDrivePref.vehicleBrand) && (
                      <div className="pref">
                        <div className="row">
                          <span className="box"><SvcIcon className="w-7 h-7" /></span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="hd3">
                              <p className="k">Preferred vehicle</p>
                              <span className="chip b" style={{ marginLeft: 'auto' }}>What you asked for</span>
                            </div>
                            <h5>
                              {`${selfDrivePref.vehicleBrand || ''} ${selfDrivePref.vehicleModelName || ''}`.trim()}
                            </h5>
                            <div className="chips">
                              {selfDrivePref.vehicleCategory && <span className="chip v">{selfDrivePref.vehicleCategory}</span>}
                              {selfDrivePref.transmission && <span className="chip b"><Settings2 className="w-2.5 h-2.5" /> {selfDrivePref.transmission}</span>}
                              {selfDrivePref.fuelType && <span className="chip m"><Fuel className="w-2.5 h-2.5" /> {selfDrivePref.fuelType}</span>}
                              {selfDrivePref.minSeats && <span className="chip"><Users className="w-2.5 h-2.5" /> {selfDrivePref.minSeats}+ seats</span>}
                            </div>
                          </div>
                        </div>

                        {selfDrivePref.isDeliveryRequested && (
                          <div className="deliver">
                            <span className="di"><Truck className="w-3.5 h-3.5" /></span>
                            <div style={{ minWidth: 0 }}>
                              <b>Home delivery requested</b>
                              {selfDrivePref.pickupAddress && (
                                <p className="addr">
                                  <MapPin className="w-3 h-3" />
                                  {selfDrivePref.pickupAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* who raised it */}
                  <div className="grp">
                    <p className="k">Raised by</p>
                    <div className="raiser">
                      <span className="ini">{(booking.companyName || booking.customerName || '?').charAt(0).toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <p className="co">{booking.companyName}</p>
                        <p className="by">{booking.customerName}</p>
                      </div>
                      <div className="ways">
                        {booking.customerPhone && (
                          <a className="way" href={`tel:${booking.customerPhone}`}>
                            <span className="wi"><Phone className="w-3 h-3" /></span>
                            <div>
                              <p className="k">Phone</p>
                              <p className="v num">{booking.customerPhone}</p>
                            </div>
                          </a>
                        )}
                        {booking.customerEmail && (
                          <a className="way" href={`mailto:${booking.customerEmail}`}>
                            <span className="wi"><Mail className="w-3 h-3" /></span>
                            <div>
                              <p className="k">Email</p>
                              <p className="v" style={{ overflowWrap: 'anywhere' }}>{booking.customerEmail}</p>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* special notes */}
                  {noteLines.length > 0 && (
                    <div className="grp">
                      <div className="callout">
                        <span className="ic"><FileText className="w-3.5 h-3.5" /></span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="hd2">
                            <p className="k">Special notes</p>
                            {booking.customerName && <span className="from">From {booking.customerName}</span>}
                          </div>
                          {noteLines.length > 1 ? (
                            <ul>
                              {noteLines.map((line: string, i: number) => <li key={i}>{line}</li>)}
                            </ul>
                          ) : (
                            <p>{noteLines[0]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>

              {/* 1 ─ open for quotes */}
              <article className={nodeClass(0)}>
                <span className="dot"><Glyph i={0} n={1} /></span>
                <div className="cap"><h3>{STATUS_LABELS.OPEN_FOR_QUOTES}</h3></div>
                <p className="say">
                  Sent to verified vendors across {booking.pickupLocation}
                  {booking.dropLocation && !isSelfDrive ? ` and ${booking.dropLocation}` : ''}.
                </p>
              </article>

              {/* 2 ─ vendors respond */}
              <article className={nodeClass(1)}>
                <span className="dot"><Glyph i={1} n={2} /></span>
                <div className="cap"><h3>{STATUS_LABELS.QUOTES_RECEIVED}</h3></div>
                <p className="say">
                  {booking.vendorQuotes?.length
                    ? <><b>{booking.vendorQuotes.length} vendor{booking.vendorQuotes.length > 1 ? 's' : ''}</b> quoted. TransRentals reviews them and puts one forward.</>
                    : 'Vendor responses appear here as they come in.'}
                </p>
              </article>

              {/* 3 ─ the decision */}
              <article className={nodeClass(2)}>
                <span className="dot"><Glyph i={2} n={3} /></span>
                <div className="cap">
                  <h3>{STATUS_LABELS.SUPER_QUOTE_SENT}</h3>
                  {latestSuperQuote && latestSuperQuote.status === 'SENT' && (!booking.trips || booking.trips.length === 0) && (
                    <span className="tagn">Needs your approval</span>
                  )}
                </div>
                <p className="say">Accept to lock the fleet and the rate. Trips are created and vehicles assigned right away.</p>

                {/* pending approval */}
                {latestSuperQuote && latestSuperQuote.status === 'SENT' && (!booking.trips || booking.trips.length === 0) && (
                  <div className="panel decide">
                    <div className="hd">
                      <span className="ic"><FileText className="w-4 h-4" /></span>
                      <div>
                        <h4>Quote Ready for Approval</h4>
                        <p>Review and confirm your corporate booking</p>
                      </div>
                      <span className="qn">#{latestSuperQuote.quoteNumber}</span>
                    </div>

                    <div className="money q2">
                      <div className="counts">
                        <div>
                          <p className="k">Vehicles</p>
                          <p className="cv num">{booking.vehiclesRequired}</p>
                          <p className="n">Quoted as one fleet</p>
                        </div>
                        {booking.vendorQuotes?.length ? (
                          <div>
                            <p className="k">Vendors quoted</p>
                            <p className="cv num">{booking.vendorQuotes.length}</p>
                            <p className="n">TransRentals put this one forward</p>
                          </div>
                        ) : null}
                      </div>
                      <div className="pay">
                        <p className="k">Total amount</p>
                        <p className="v num">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                        <p className="n">All inclusive</p>
                      </div>
                    </div>

                    <div className="rates">
                      {latestSuperQuote.notes && (
                        <p className="qnote">&ldquo;{latestSuperQuote.notes}&rdquo;</p>
                      )}

                      <button onClick={() => setShowQuoteDetails(!showQuoteDetails)} className="btn o"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 13 }}>
                        <Eye className="w-3.5 h-3.5" />
                        {showQuoteDetails ? 'Hide Quote Details' : 'View Full Quote Details'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuoteDetails ? 'rotate-180' : ''}`} />
                      </button>

                      {showQuoteDetails && (() => {
                        const quoteDetails = confirmedQuotes
                          .map((q: any) => {
                            try { return { ...JSON.parse(q.notes), vehicleCount: q.vehicleCount }; } catch { return null; }
                          })
                          .filter(Boolean);

                        if (quoteDetails.length === 0) return (
                          <div className="note plain" style={{ marginTop: 13 }}>No detailed quote information available.</div>
                        );

                        const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
                        const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
                        const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
                        const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

                        return (
                          <>
                            <p className="k" style={{ marginTop: 15 }}>Service details</p>
                            <div className="chips" style={{ marginTop: 7 }}>
                              <span className="chip m">
                                <SvcIcon className="w-2.5 h-2.5" />
                                <span className="capitalize">{booking.serviceType} {isSelfDriveQuote ? '(Self Drive)' : 'Rental'}</span>
                              </span>
                              {quoteDetails[0]?.tripType && (
                                <span className="chip b"><Route className="w-2.5 h-2.5" /> {TRIP_TYPE_LABELS[quoteDetails[0].tripType] || quoteDetails[0].tripType}</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.kmLimit && (
                                <span className="chip b">{quoteDetails[0].kmLimit} km/day limit</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.extraKmCharge && (
                                <span className="chip a">Extra km: ₹{quoteDetails[0].extraKmCharge}/km</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.fuelPolicy && (
                                <span className="chip m">Fuel: {quoteDetails[0].fuelPolicy}</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.deliveryCharges > 0 && (
                                <span className="chip v">Delivery: ₹{quoteDetails[0].deliveryCharges}</span>
                              )}
                            </div>

                            {!isSelfDriveQuote && quoteDetails[0] && (quoteDetails[0].basePrice > 0 || quoteDetails[0].pricePerVehicle > 0) && (() => {
                              const d = quoteDetails[0];
                              const firstVehicle = confirmedQuotes[0]?.quoteVehicles?.[0];
                              const rawBp = d.basePrice || firstVehicle?.basePrice || 0;
                              const da = d.driverAllowance || firstVehicle?.driverAllowance || 0;
                              const pkm = d.perKmRate || firstVehicle?.perKmRate || 0;
                              const pday = d.perDayRate || firstVehicle?.perDayRate || 0;
                              const nc = d.nightCharges || firstVehicle?.nightCharges || 0;
                              const ekm = d.extraKmCharge || firstVehicle?.extraKmCharge || 0;

                              const totalVehicles = booking.vehiclesRequired || 1;
                              const marginPerVehicle = latestSuperQuote?.companyMargin
                                ? Math.round(latestSuperQuote.companyMargin / totalVehicles)
                                : 0;
                              const bp = rawBp + marginPerVehicle;

                              return (
                                <>
                                  <p className="k" style={{ marginTop: 17 }}>Rate information — per vehicle</p>
                                  {bp > 0 && <div className="row"><span className="lbl">Base price</span><span className="amt num">₹{bp.toLocaleString('en-IN')}</span></div>}
                                  {da > 0 && <div className="row"><span className="lbl">Driver allowance</span><span className="amt num">₹{da.toLocaleString('en-IN')}</span></div>}
                                  {pkm > 0 && <div className="row"><span className="lbl">Per km rate</span><span className="amt num">₹{pkm} / km</span></div>}
                                  {pday > 0 && <div className="row"><span className="lbl">Per day rate</span><span className="amt num">₹{pday} / day</span></div>}
                                  {nc > 0 && <div className="row"><span className="lbl">Night charges</span><span className="amt num">₹{nc}</span></div>}
                                  {ekm > 0 && <div className="row"><span className="lbl">Extra km charge</span><span className="amt num">₹{ekm} / km</span></div>}
                                  {(bp > 0 || da > 0) && (
                                    <div className="tot"><span className="lbl">Per vehicle total</span><span className="amt num">₹{(bp + da).toLocaleString('en-IN')}</span></div>
                                  )}
                                </>
                              );
                            })()}

                            {allInclusions.length > 0 && (
                              <>
                                <p className="k" style={{ marginTop: 17 }}>What&rsquo;s included</p>
                                <div className="chips" style={{ marginTop: 7 }}>
                                  {allInclusions.map((item: string, i: number) => (
                                    <span key={i} className="chip m"><CheckCircle className="w-2.5 h-2.5" /> {item}</span>
                                  ))}
                                </div>
                              </>
                            )}

                            {allExclusions.length > 0 && (
                              <>
                                <p className="k" style={{ marginTop: 15 }}>What&rsquo;s not included</p>
                                <div className="chips" style={{ marginTop: 7 }}>
                                  {allExclusions.map((item: string, i: number) => (
                                    <span key={i} className="chip r"><AlertCircle className="w-2.5 h-2.5" /> {item}</span>
                                  ))}
                                </div>
                              </>
                            )}

                            {quoteDetails.some((d: any) => d.vendorMessage) && (
                              <div className="note">
                                <p className="k">Vendor notes</p>
                                {quoteDetails.filter((d: any) => d.vendorMessage).map((d: any, i: number) => (
                                  <p key={i} style={{ margin: 0 }}>&ldquo;{d.vendorMessage}&rdquo;</p>
                                ))}
                              </div>
                            )}

                            {allTerms.length > 0 && (
                              <div className="note plain">
                                <p className="k">Terms &amp; conditions</p>
                                {allTerms.map((item: string, i: number) => (
                                  <p key={i} style={{ margin: 0 }}>{i + 1}. {item}</p>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="act">
                      <div className="checks">
                        <span>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>The fleet and the rate are <b>locked at ₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</b></span>
                        </span>
                        <span>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span><b>{booking.vehiclesRequired} trip{booking.vehiclesRequired > 1 ? 's' : ''}</b> are created automatically &mdash; one per vehicle</span>
                        </span>
                        <span>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span><b>No payment now</b> &mdash; post-trip corporate billing</span>
                        </span>
                      </div>
                      <button onClick={() => confirmAcceptSuperQuote(latestSuperQuote.id)} disabled={accepting} className="accept">
                        {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {accepting ? 'Confirming...' : 'Accept Quote & Confirm Booking'}
                      </button>
                    </div>
                  </div>
                )}

                {/* already accepted */}
                {latestSuperQuote && (latestSuperQuote.status === 'ACCEPTED' || (booking.trips && booking.trips.length > 0)) && (
                  <div className="panel decide ok">
                    <div className="hd">
                      <span className="ic"><CheckCircle className="w-4 h-4" /></span>
                      <div>
                        <h4>Quote Confirmed</h4>
                        <p>Your booking is locked in</p>
                      </div>
                      <span className="qn">#{latestSuperQuote.quoteNumber}</span>
                    </div>

                    <div className="money c2">
                      <div>
                        <p className="k">Total vehicles</p>
                        <p className="v num">{booking.vehiclesRequired}</p>
                        <p className="n">Confirmed as one fleet</p>
                      </div>
                      <div className="pay">
                        <p className="k">Total amount</p>
                        <p className="v num">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                        <p className="n">All inclusive</p>
                      </div>
                    </div>

                    <div className="rates">
                      <button onClick={() => setShowQuoteDetails(!showQuoteDetails)} className="btn o"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 13 }}>
                        <Eye className="w-3.5 h-3.5" />
                        {showQuoteDetails ? 'Hide Quote Details' : 'View Quote Details'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuoteDetails ? 'rotate-180' : ''}`} />
                      </button>

                      {showQuoteDetails && (() => {
                        const quoteDetails = confirmedQuotes
                          .map((q: any) => {
                            try { return { ...JSON.parse(q.notes), vehicleCount: q.vehicleCount }; } catch { return null; }
                          })
                          .filter(Boolean);

                        if (quoteDetails.length === 0) return (
                          <div className="note plain" style={{ marginTop: 13 }}>No detailed quote information available.</div>
                        );

                        const allInclusions = [...new Set(quoteDetails.flatMap((d: any) => d.inclusions || []))];
                        const allExclusions = [...new Set(quoteDetails.flatMap((d: any) => d.exclusions || []))];
                        const allTerms = [...new Set(quoteDetails.flatMap((d: any) => d.termsConditions || []))];
                        const isSelfDriveQuote = quoteDetails.some((d: any) => d.isSelfDriveQuote);

                        return (
                          <>
                            <p className="k" style={{ marginTop: 15 }}>Service details</p>
                            <div className="chips" style={{ marginTop: 7 }}>
                              <span className="chip m">
                                <SvcIcon className="w-2.5 h-2.5" />
                                <span className="capitalize">{booking.serviceType} {isSelfDriveQuote ? '(Self Drive)' : 'Rental'}</span>
                              </span>
                              {quoteDetails[0]?.tripType && (
                                <span className="chip b"><Route className="w-2.5 h-2.5" /> {TRIP_TYPE_LABELS[quoteDetails[0].tripType] || quoteDetails[0].tripType}</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.kmLimit && (
                                <span className="chip b">{quoteDetails[0].kmLimit} km/day limit</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.extraKmCharge && (
                                <span className="chip a">Extra km: ₹{quoteDetails[0].extraKmCharge}/km</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.fuelPolicy && (
                                <span className="chip m">Fuel: {quoteDetails[0].fuelPolicy}</span>
                              )}
                              {isSelfDriveQuote && quoteDetails[0]?.deliveryCharges > 0 && (
                                <span className="chip v">Delivery: ₹{quoteDetails[0].deliveryCharges}</span>
                              )}
                            </div>

                            {!isSelfDriveQuote && quoteDetails[0] && (quoteDetails[0].basePrice > 0 || quoteDetails[0].pricePerVehicle > 0) && (() => {
                              const d = quoteDetails[0];
                              const firstVehicle = confirmedQuotes[0]?.quoteVehicles?.[0];
                              const rawBp = d.basePrice || firstVehicle?.basePrice || 0;
                              const da = d.driverAllowance || firstVehicle?.driverAllowance || 0;
                              const pkm = d.perKmRate || firstVehicle?.perKmRate || 0;
                              const pday = d.perDayRate || firstVehicle?.perDayRate || 0;
                              const nc = d.nightCharges || firstVehicle?.nightCharges || 0;
                              const ekm = d.extraKmCharge || firstVehicle?.extraKmCharge || 0;

                              const totalVehicles = booking.vehiclesRequired || 1;
                              const marginPerVehicle = latestSuperQuote?.companyMargin
                                ? Math.round(latestSuperQuote.companyMargin / totalVehicles)
                                : 0;
                              const bp = rawBp + marginPerVehicle;

                              return (
                                <>
                                  <p className="k" style={{ marginTop: 17 }}>Rate information — per vehicle</p>
                                  {bp > 0 && <div className="row"><span className="lbl">Base price</span><span className="amt num">₹{bp.toLocaleString('en-IN')}</span></div>}
                                  {da > 0 && <div className="row"><span className="lbl">Driver allowance</span><span className="amt num">₹{da.toLocaleString('en-IN')}</span></div>}
                                  {pkm > 0 && <div className="row"><span className="lbl">Per km rate</span><span className="amt num">₹{pkm} / km</span></div>}
                                  {pday > 0 && <div className="row"><span className="lbl">Per day rate</span><span className="amt num">₹{pday} / day</span></div>}
                                  {nc > 0 && <div className="row"><span className="lbl">Night charges</span><span className="amt num">₹{nc}</span></div>}
                                  {ekm > 0 && <div className="row"><span className="lbl">Extra km charge</span><span className="amt num">₹{ekm} / km</span></div>}
                                  {(bp > 0 || da > 0) && (
                                    <div className="tot"><span className="lbl">Per vehicle total</span><span className="amt num">₹{(bp + da).toLocaleString('en-IN')}</span></div>
                                  )}
                                </>
                              );
                            })()}

                            {allInclusions.length > 0 && (
                              <>
                                <p className="k" style={{ marginTop: 17 }}>What&rsquo;s included</p>
                                <div className="chips" style={{ marginTop: 7 }}>
                                  {allInclusions.map((item: string, i: number) => (
                                    <span key={i} className="chip m"><CheckCircle className="w-2.5 h-2.5" /> {item}</span>
                                  ))}
                                </div>
                              </>
                            )}

                            {allExclusions.length > 0 && (
                              <>
                                <p className="k" style={{ marginTop: 15 }}>What&rsquo;s not included</p>
                                <div className="chips" style={{ marginTop: 7 }}>
                                  {allExclusions.map((item: string, i: number) => (
                                    <span key={i} className="chip r"><AlertCircle className="w-2.5 h-2.5" /> {item}</span>
                                  ))}
                                </div>
                              </>
                            )}

                            {quoteDetails.some((d: any) => d.vendorMessage) && (
                              <div className="note">
                                <p className="k">Vendor notes</p>
                                {quoteDetails.filter((d: any) => d.vendorMessage).map((d: any, i: number) => (
                                  <p key={i} style={{ margin: 0 }}>&ldquo;{d.vendorMessage}&rdquo;</p>
                                ))}
                              </div>
                            )}

                            {allTerms.length > 0 && (
                              <div className="note plain">
                                <p className="k">Terms &amp; conditions</p>
                                {allTerms.map((item: string, i: number) => (
                                  <p key={i} style={{ margin: 0 }}>{i + 1}. {item}</p>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </article>

              {/* 4 ─ the fleet fills up */}
              <article className={nodeClass(3)}>
                <span className="dot"><Glyph i={3} n={4} /></span>
                <div className="cap"><h3>{booking.serviceType === 'self-drive' ? 'Vehicles assigned' : 'Vehicles & drivers assigned'}</h3></div>
                <p className="say">The vendor fills the fleet. Each vehicle appears here with its driver as it is confirmed.</p>

                {['SUPER_QUOTE_SENT', 'CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'PAID'].includes(booking.status) && confirmedQuotes.length > 0 && (
                  <div className="panel sheet">
                    <div className="cap2">
                      <Car className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                      <b>{booking.serviceType === 'self-drive' ? 'Assigned Vehicles' : 'Assigned Vehicles & Drivers'}</b>
                      <span className="n">{totalVendorVehicles} of {booking.vehiclesRequired}</span>
                    </div>

                    <div className="meter">
                      <div className="hd">
                        <b>{totalVendorVehicles} of {booking.vehiclesRequired} vehicles assigned</b>
                        <span className="pc num">{Math.round((totalVendorVehicles / booking.vehiclesRequired) * 100)}%</span>
                      </div>
                      <div className="track">
                        <i style={{ width: `${Math.min((totalVendorVehicles / booking.vehiclesRequired) * 100, 100)}%` }} />
                      </div>
                      <div className="mstat">
                        <span><b>{totalVendorVehicles}</b> assigned</span>
                        {!isSelfDrive && (
                          <span><b>{driversConfirmed}</b> driver{driversConfirmed === 1 ? '' : 's'} confirmed</span>
                        )}
                        {awaiting > 0 && <span><b>{awaiting}</b> awaiting vendor</span>}
                      </div>
                    </div>

                    {(() => {
                      const allVehicles = confirmedQuotes.flatMap((q: any) =>
                        q.quoteVehicles?.map((qv: any) => ({ ...qv, quoteStatus: q.status })) || []
                      );

                      if (allVehicles.length === 0) {
                        return (
                          <div className="fleet">
                            <div className="empty">
                              <span className="ic"><Clock className="w-5 h-5" /></span>
                              <b>Waiting for vehicles to be assigned...</b>
                              <span>Vehicles and drivers will appear here once assigned</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="fleet">
                          {allVehicles.map((qv: any, i: number) => {
                            const v = qv.vehicle;
                            const d = qv.driver;
                            let allImages: string[] = [];
                            if (v?.images) {
                              try {
                                const parsed = typeof v.images === 'string' ? JSON.parse(v.images) : v.images;
                                if (Array.isArray(parsed)) {
                                  allImages = parsed.filter((x: any) => typeof x === 'string' && x);
                                } else if (parsed && typeof parsed === 'object') {
                                  allImages = Object.values(parsed).filter((x: any) => typeof x === 'string' && x) as string[];
                                }
                              } catch {}
                            }
                            if (v?.vehicle_models?.sideImage) allImages = [v.vehicle_models.sideImage, ...allImages.filter((img: string) => img !== v.vehicle_models.sideImage)];
                            if (v?.chauffeur_vehicle_categories?.image && allImages.length === 0) allImages.push(v.chauffeur_vehicle_categories.image);

                            const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
                            const modelName = v?.vehicle_models?.name || '';
                            const displayName = v?.vehicleName || `${brandName} ${modelName}`.trim() || qv.vehicleName || 'Vehicle';

                            return (
                              <VehicleCard key={qv.id} index={i} displayName={displayName} images={allImages} vehicle={v} driver={d} isSelfDrive={booking.serviceType === 'self-drive'} Art={SvcIcon} />
                            );
                          })}
                        </div>
                      );
                    })()}

                    {slotBatches.length > 0 && (
                      <div className="slots">
                        <div className="head">
                          <p className="k">Still with the vendor</p>
                          <span className="ln" />
                        </div>
                        {slotBatches.map(([from, to]) => (
                          <div key={from} className="slot">
                            <b>{from === to ? pad2(from) : `${pad2(from)} – ${pad2(to)}`}</b>
                            awaiting vendor
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>

              {/* 5 ─ trips */}
              <article className={nodeClass(4)}>
                <span className="dot"><Glyph i={4} n={5} /></span>
                <div className="cap"><h3>{STATUS_LABELS.TRIPS_CREATED}</h3></div>
                <p className="say">One trip per vehicle, each with its own code you can share with the rider.</p>

                {tripStats && tripStats.total > 0 && (
                  <div className="panel">
                    {(() => {
                      const states = [
                        { l: 'Pending', v: tripStats.pending, c: 'var(--amber)' },
                        { l: 'Arrived', v: tripStats.driverArrived, c: 'var(--violet)' },
                        { l: 'Started', v: tripStats.started, c: 'var(--em-mid)' },
                        { l: 'Done', v: tripStats.completed, c: 'var(--ink-2)' },
                        { l: 'Cancelled', v: tripStats.cancelled, c: 'var(--red)' },
                      ];
                      const mix = states.filter((x) => x.v > 0);
                      const mixTotal = mix.reduce((sum, x) => sum + x.v, 0);
                      /* jo abhi khatam ya radd nahi hue */
                      const stillOpen = (tripStats.pending || 0) + (tripStats.driverArrived || 0) + (tripStats.started || 0);
                      return (
                        <div className="stats">
                          <div className={`tot ${tripStats.total ? '' : 'zero'}`}>
                            <p className="v" style={{ color: tripStats.total ? 'var(--blue)' : undefined }}>{tripStats.total}</p>
                            <p className="l"><i style={{ background: tripStats.total ? 'var(--blue)' : undefined }} />Total</p>
                          </div>
                          {states.map((st) => (
                            <div key={st.l} className={st.v ? '' : 'zero'}>
                              <p className="v" style={{ color: st.v ? st.c : undefined }}>{st.v}</p>
                              <p className="l"><i style={{ background: st.v ? st.c : undefined }} />{st.l}</p>
                            </div>
                          ))}

                          {mixTotal > 0 && (
                            <div className="mix">
                              <div className="cap3">
                                <p className="k">Where the trips stand</p>
                                <p className="n2"><b>{stillOpen}</b> of <b>{mixTotal}</b> still open</p>
                              </div>
                              <div className="bar2">
                                {mix.map((x) => (
                                  <span key={x.l} title={`${x.l}: ${x.v}`}
                                    style={{ width: `${(x.v / mixTotal) * 100}%`, background: x.c }} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="sheet">
                      <div className="cap2">
                        <Route className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                        <b>Trip details</b>
                        <span className="n">{booking.trips?.length} created</span>
                      </div>
                      <div className={`tlist ${(booking.trips?.length || 0) > 5 ? 'more' : ''}`}>
                        <div className="scroller">
                        {booking.trips?.map((trip: any, i: number) => {
                          const tone = TRIP_TONES[trip.status] || ['', 'p-done'];
                          return (
                            <div key={trip.id} className={`trip ${tone[0]}`}>
                              <span className="idx">{i + 1}</span>
                              <div>
                                <div className="l1">
                                  <span className="code">{trip.tripCode}</span>
                                  <span className={`pill ${tone[1]}`}>{trip.status.replace(/_/g, ' ')}</span>
                                  {trip.vendor?.businessName && (
                                    <span className="vend"><Building2 className="w-2.5 h-2.5" /> {trip.vendor.businessName}</span>
                                  )}
                                </div>
                                <div className="l2">
                                  <b>{trip.vehicleName || trip.vehicleNumber || '-'}</b>
                                  {trip.vehicleName && trip.vehicleNumber && (
                                    <span className="plate">{trip.vehicleNumber}</span>
                                  )}
                                  {booking.serviceType !== 'self-drive' && (
                                    <>
                                      <span className="sep" />
                                      <span>{trip.driverName || 'Driver to be assigned'}</span>
                                      {trip.driverPhone && (
                                        <a href={`tel:${trip.driverPhone}`}><Phone className="w-2.5 h-2.5" /> {trip.driverPhone}</a>
                                      )}
                                    </>
                                  )}
                                  {booking.serviceType === 'self-drive' && (
                                    <><span className="sep" /><span className="sd">Self Drive</span></>
                                  )}
                                </div>
                              </div>
                              <div className="acts">
                                <a href={`/trip/${trip.tripCode}`} target="_blank" rel="noreferrer" className="mini track">
                                  <ExternalLink className="w-3 h-3" /> Track
                                </a>
                                <button onClick={() => copyTripLink(trip.tripCode, trip.id)} className={`mini ${copiedTripId === trip.id ? 'copied' : ''}`}>
                                  {copiedTripId === trip.id
                                    ? <><CheckCircle className="w-3 h-3" /> Copied!</>
                                    : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                                <button onClick={() => shareTrip(trip, i)} className="mini share">
                                  <Share2 className="w-3 h-3" /> Share
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>

              {/* 6 ─ on the road */}
              <article className={nodeClass(5)}>
                <span className="dot"><Glyph i={5} n={6} /></span>
                <div className="cap"><h3>{STATUS_LABELS.IN_PROGRESS}</h3></div>
                <p className="say">Live trip status shows here once the riders start.</p>
              </article>

              {/* 7 ─ closed out */}
              <article className={nodeClass(6)}>
                <span className="dot"><Glyph i={6} n={7} /></span>
                <div className="cap"><h3>Completed &amp; invoiced</h3></div>
                <p className="say">Corporate billing is raised after the trips finish, not before.</p>
              </article>

              {/* the vendor conversation */}
              {booking && ['CONFIRMED', 'TRIPS_CREATED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
                <div className="sheet" style={{ marginTop: 22 }}>
                  <div className="cap2">
                    <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    <b>Contact Vendor</b>
                    {vendorNames.length > 0 && (
                      <span className="n">{vendorNames.length} vendor{vendorNames.length > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  <div className="vchat">
                    <span className="ic"><MessageCircle className="w-4 h-4" /></span>
                    <div style={{ minWidth: 0 }}>
                      <p className="t">Message the vendor about this booking</p>
                      <p className="s">
                        Pickup timing, driver details, or a change &mdash; ask here and it stays on
                        booking {booking.bookingNumber}.
                      </p>
                      {vendorNames.length > 0 && (
                        <div className="who3">
                          {vendorNames.map((v: string) => (
                            <span key={v}><Building2 className="w-2.5 h-2.5" /> {v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="vcta">
                    <Suspense fallback={<div className="skel animate-pulse" />}>
                      <B2BBookingChat
                        bookingId={params.id as string}
                        customerId={customerId}
                        customerName={booking.customerName}
                        defaultOpen={openChat}
                      />
                    </Suspense>
                  </div>

                  {vendorNames.length > 0 && (
                    <div style={{ padding: '0 18px 18px' }}>
                      <BookingPaymentSafetyNotice />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ══ the rail ══ */}
            <aside className="rail">

              <div className="rcard">
                <div className="rc rc-stack">
                  <b>Booking summary</b>
                  <span className="spill" style={{ ['--sc' as any]: STATUS_INK[booking.status] || 'var(--muted)' }}>
                    <i />
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
                <div className="bno">
                  <span className="bi"><SvcIcon className="w-4 h-4" /></span>
                  <div style={{ minWidth: 0 }}>
                    <p className="k">Booking no.</p>
                    <p className="bv">{booking.bookingNumber}</p>
                  </div>
                </div>

                <div className="duo2">
                  {summaryFacts.map((f: any, i: number) => (
                    <div key={f.k}
                      style={{ gridColumn: (summaryFacts.length % 2 === 1 && i === summaryFacts.length - 1) ? 'span 2' : undefined }}>
                      <p className="k">{f.k}</p>
                      <p className={`v3 ${f.cap ? 'capitalize' : ''}`}>{f.v}</p>
                    </div>
                  ))}
                </div>

                <div className="fleetrow">
                  <p className="k">Fleet assigned</p>
                  <p className="v3">{totalVendorVehicles} of {booking.vehiclesRequired} &middot; {assignedPct}%</p>
                  <span className="bar"><i style={{ width: `${Math.min(assignedPct, 100)}%` }} /></span>
                </div>

                {latestSuperQuote ? (
                  <div className="totalrow">
                    <p className="k">Total amount</p>
                    <p className="amt2">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                    <p className="n3">Post-trip corporate billing</p>
                  </div>
                ) : (
                  <div className="totalrow wait2">
                    <p className="k">Total amount</p>
                    <p className="amt2">Awaiting quote</p>
                    <p className="n3">Shown once TransRentals sends the quote</p>
                  </div>
                )}
              </div>

              {booking.invoices?.length > 0 && booking.invoices.map((inv: any) => {
                const paid = inv.status === 'PAID';
                const overdue = !paid && inv.dueDate &&
                  new Date(inv.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                return (
                  <div key={inv.id} className={`rcard inv ${paid ? 'paid' : ''}`}>
                    <div className="rc" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <b>Invoice</b>
                      <span className="spill" style={{ ['--sc' as any]: paid ? '#047857' : '#B4700F' }}>
                        <i />
                        {inv.status}
                      </span>
                    </div>
                    <div style={{ padding: '13px 16px 0' }}><p className="k mono">{inv.invoiceNumber}</p></div>
                    <p className="amt num">₹{inv.totalAmount?.toLocaleString('en-IN')}</p>

                    <div className="duo">
                      <div><p className="k">Vehicles</p><p className="v2">{inv.totalVehicles}</p></div>
                      <div><p className="k">Trips done</p><p className="v2">{inv.tripsCompleted}</p></div>
                    </div>

                    <p className="due">
                      <Calendar className="w-3 h-3" />
                      Due {formatDate(inv.dueDate)}
                      {overdue && <span className="od">Overdue</span>}
                    </p>

                    <a href={`/invoice/b2b/${inv.id}`} target="_blank" className="pay">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {paid ? 'View Invoice' : 'View & Pay Invoice'}
                    </a>
                    <p style={{ margin: '0 16px 14px', fontSize: 12, color: 'var(--faint)', lineHeight: 1.6 }}>
                      Post-trip corporate billing — raised once the last trip closes.
                    </p>
                  </div>
                );
              })}

              <div className="rcard">
                <div className="rc"><b>Contact info</b></div>

                <div className="ident">
                  <span className="ini2">{(booking.companyName || booking.customerName || '?').charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <p className="co2">{booking.companyName}</p>
                    <p className="by2">{booking.customerName} &middot; raised this booking</p>
                  </div>
                </div>

                {booking.customerPhone && (
                  <a className="person" href={`tel:${booking.customerPhone}`} title={`Call ${booking.customerName || ''}`.trim()}>
                    <span className="ic i-violet"><Phone className="w-3.5 h-3.5" /></span>
                    <div style={{ minWidth: 0 }}><p className="k">Call</p><p className="v num">{booking.customerPhone}</p></div>
                    <span className="go2"><ChevronRight className="w-3.5 h-3.5" /></span>
                  </a>
                )}

                {booking.customerEmail && (
                  <a className="person" href={`mailto:${booking.customerEmail}`} title={`Email ${booking.customerEmail}`}>
                    <span className="ic i-amber"><Mail className="w-3.5 h-3.5" /></span>
                    <div style={{ minWidth: 0 }}><p className="k">Email</p><p className="v" style={{ overflowWrap: 'anywhere' }}>{booking.customerEmail}</p></div>
                    <span className="go2"><ChevronRight className="w-3.5 h-3.5" /></span>
                  </a>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* The dialog — same three states, dossier ki bhasha me */}
      {modal && (
        <div className="bdx mask" onClick={() => modal.type !== 'confirm' && setModal(null)}>
          <div className="veil" />
          <div className={`mdl ${modal.type}`} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>

            <div className="mhd">
              <span className="mic">
                {modal.type === 'confirm' && <FileText className="w-4 h-4" />}
                {modal.type === 'success' && <CheckCircle className="w-4 h-4" />}
                {modal.type === 'error' && <AlertCircle className="w-4 h-4" />}
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="k mono">{booking.bookingNumber}</p>
                <h4>{modal.title}</h4>
              </div>
            </div>

            <p className="msg">{modal.message}</p>

            {modal.type === 'confirm' && latestSuperQuote && (
              <div className="recap">
                <div>
                  <p className="k">Vehicles</p>
                  <p className="v num">{booking.vehiclesRequired}</p>
                </div>
                <div>
                  <p className="k">Total amount</p>
                  <p className="v num">₹{latestSuperQuote.finalAmount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            <div className="mact">
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={() => setModal(null)} className="mbtn ghost">Cancel</button>
                  <button onClick={modal.onConfirm} className="mbtn go">
                    <CheckCircle className="w-3.5 h-3.5" /> Yes, Confirm
                  </button>
                </>
              ) : (
                <button onClick={() => setModal(null)} className={`mbtn ${modal.type === 'success' ? 'ok' : 'ghost'}`}>
                  {modal.type === 'success' ? 'Great!' : 'OK'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
