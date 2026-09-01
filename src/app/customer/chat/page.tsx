'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import {
  MessageCircle, Send, Search, CheckCheck, Check, RefreshCw,
  ArrowLeft, Smile, Paperclip, X, Zap, FileIcon, Download,
  Loader2, Eye, ChevronDown, Building2, Car, Bike, Bus, Truck,
  Package, Star, Settings, Phone,
} from 'lucide-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const TravelAgentChat = dynamic(
  () => import('@/components/travel-agent/chat/TravelAgentChat'),
  { ssr: false },
);

interface AgentConversation {
  id: string;
  subject: string | null;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: { id: string; content: string; senderType: string; createdAt: string } | null;
  agency: { id: string; agencyName: string; logo: string | null; phone: string | null } | null;
  createdAt: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  bookingType: string;
  bookingId: string | null;
  bookingNumber: string | null;
  subject: string | null;
  status: string;
  unreadCount: number;
  lastMessage: { id: string; content: string; senderType: string; messageType: string; createdAt: string } | null;
  lastMessageAt: string | null;
  participant: { id: string; name: string; logo?: string; phone?: string };
  createdAt: string;
}

interface Message {
  id: string;
  senderType: string;
  senderId: string | null;
  senderName: string | null;
  messageType: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  logo?: string;
  phone?: string;
  conversations: Conversation[];
  totalUnread: number;
  lastMessageAt: string | null;
  lastMessage: Conversation['lastMessage'];
}

interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  bike: '#3B82F6', car: '#8B5CF6', chauffeur: '#8B5CF6', luxury: '#EC4899',
  bus: '#F97316', truck: '#6366F1', equipment: '#14B8A6', packers: '#F59E0B',
  'self-drive': '#06B6D4', wander: '#10B981', wander_booking: '#10B981',
};

const TYPE_LABELS: Record<string, string> = {
  bike: 'Bike', car: 'Self-Drive', chauffeur: 'Car', luxury: 'Luxury',
  bus: 'Bus', truck: 'Truck', equipment: 'Equipment', packers: 'Packers',
  'self-drive': 'Self-Drive', wander: 'Wander', wander_booking: 'Wander',
};

// ─── Scoped stylesheet (presentation only) ───────────────────────────────────

const CXX_CSS = `
.cxx{
  --card:#FFFFFF; --card-2:#F7FAF8; --sunk:#F1F6F3;
  --rule:#E0E8E3; --rule-2:#CAD8D0; --rule-3:#B4C7BC;
  --ink:#08150F; --ink-2:#2C3A33; --body:#4B5A52; --muted:#75837B; --faint:#9AA8A0; --ghost:#BECAC3;
  --forest:#062E1D; --em:#056B3E; --em-2:#09B368; --em-3:#3FD79A;
  --mint:#E7F6EF; --mint-2:#CDEADC;
  --teal:#0B7C74; --teal-bg:#E2F3F1; --teal-ln:#B6E0DB;
  --indigo:#4338CA; --indigo-bg:#EDEEFD; --indigo-ln:#CBD0F8;
  --amber:#A96509; --amber-bg:#FCF4E4; --amber-ln:#ECDCB8;
  --rose:#B0143C; --rose-bg:#FCE9ED;
  --serif:var(--quote-display, Georgia, "Times New Roman", serif);
  --mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  --lift-1:0 1px 2px rgba(6,46,29,.05), 0 6px 16px -12px rgba(6,46,29,.28);
  --lift-2:0 2px 6px rgba(6,46,29,.06), 0 22px 44px -30px rgba(6,46,29,.5);
  color:var(--ink);
}
.cxx *{box-sizing:border-box}
.cxx button{font:inherit; color:inherit; background:none; border:none; cursor:pointer; padding:0}
.cxx a{color:inherit; text-decoration:none}
.cxx ::-webkit-scrollbar{width:9px; height:9px}
.cxx ::-webkit-scrollbar-thumb{background:var(--rule-2); border:3px solid var(--card); border-radius:9px}
.cxx ::-webkit-scrollbar-track{background:transparent}
.cxx .eyebrow{margin:0; font-family:var(--mono); font-size:9.5px; font-weight:600; letter-spacing:.16em;
  text-transform:uppercase; color:var(--faint)}
.cxx .tnum{font-variant-numeric:tabular-nums}
.cxx .mono{font-family:var(--mono)}

@keyframes cxxIn{from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)}}
@keyframes cxxUp{from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:translateY(0)}}
@keyframes cxxShim{0%{background-position:-200% 0} 100%{background-position:200% 0}}
.cxx .msg-in{animation:cxxIn .25s ease-out}
.cxx .fade-in-up{animation:cxxUp .35s ease-out}
.cxx .shimmer-teal{background:linear-gradient(90deg,#E7F6EF 25%,#CDEADC 50%,#E7F6EF 75%);
  background-size:200% 100%; animation:cxxShim 1.5s ease-in-out infinite}

/* ── frame ── */
.cxx .frame{flex:1; min-width:0; min-height:0; display:grid;
  grid-template-columns:66px 306px minmax(0,1fr) 312px;
  border-radius:22px; overflow:hidden; background:var(--card);
  box-shadow:var(--lift-2), 0 0 0 1px var(--rule)}
.cxx .frame.noctx{grid-template-columns:66px 306px minmax(0,1fr)}

/* ── 1. channel spine ── */
.cxx .spine{display:flex; flex-direction:column; align-items:center; gap:5px; padding:14px 0 12px;
  background:linear-gradient(178deg,#0A4A2E 0%,#062E1D 58%,#042115 100%); color:#fff}
.cxx .crest{width:36px; height:36px; border-radius:12px; display:grid; place-items:center;
  background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.16);
  color:var(--em-3); margin-bottom:12px; flex:none}
.cxx .ch{position:relative; width:46px; flex:none; padding:9px 0 7px; border-radius:13px;
  display:flex; flex-direction:column; align-items:center; gap:5px;
  color:rgba(255,255,255,.52); transition:background .18s, color .18s}
.cxx .ch:hover{background:rgba(255,255,255,.07); color:rgba(255,255,255,.86)}
.cxx .ch .lbl{font-size:9px; font-weight:600; letter-spacing:.04em}
.cxx .ch .dot{position:absolute; top:5px; right:5px; min-width:16px; height:16px; padding:0 4px;
  border-radius:999px; font-size:9.5px; font-weight:700; line-height:16px;
  background:#E11D48; color:#fff; box-shadow:0 0 0 2px #08301E; font-variant-numeric:tabular-nums}
.cxx .ch.on{background:rgba(255,255,255,.13); color:#fff; box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.cxx .ch.on::before{content:""; position:absolute; left:-14px; top:12px; bottom:12px; width:3px;
  border-radius:0 3px 3px 0; background:var(--em-3)}
.cxx .spine .foot{margin-top:auto; display:flex; flex-direction:column; align-items:center; gap:9px}
.cxx .spine .foot .me{width:32px; height:32px; border-radius:999px; display:grid; place-items:center;
  font-size:12px; font-weight:700; background:rgba(255,255,255,.14); color:#fff;
  border:1px solid rgba(255,255,255,.2)}

/* ── 2. rail ── */
.cxx .rail{display:flex; flex-direction:column; min-width:0; min-height:0;
  border-right:1px solid var(--rule); background:var(--card-2)}
.cxx .rhead{flex:none; padding:16px 16px 12px; border-bottom:1px solid var(--rule)}
.cxx .rhead h1{margin:0; font-family:var(--serif); font-size:27px; font-weight:600; line-height:1;
  letter-spacing:-.01em}
.cxx .rsub{display:flex; align-items:center; gap:7px; margin:7px 0 0}
.cxx .rsub p{margin:0; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis;
  white-space:nowrap}
.cxx .refresh{margin-left:auto; flex:none; width:27px; height:27px; border-radius:9px; display:grid;
  place-items:center; color:var(--faint); transition:background .18s, color .18s}
.cxx .refresh:hover{background:var(--sunk); color:var(--em)}
.cxx .tally{flex:none; display:inline-flex; align-items:center; gap:5px; border-radius:999px;
  padding:1px 8px 1px 5px; background:var(--mint); border:1px solid var(--mint-2);
  font-size:11px; font-weight:700; color:var(--em); font-variant-numeric:tabular-nums}
.cxx .tally i{width:5px; height:5px; border-radius:999px; background:var(--em-2)}

.cxx .seek{position:relative; display:flex; align-items:center; margin-top:12px}
.cxx .seek .si{position:absolute; left:11px; color:var(--faint); pointer-events:none}
.cxx .seek input{width:100%; border-radius:11px; border:1px solid var(--rule-2); background:var(--card);
  padding:9px 12px 9px 34px; font-size:13px; color:var(--ink);
  transition:border-color .18s, box-shadow .18s}
.cxx .seek input::placeholder{color:var(--ghost)}
.cxx .seek input:focus{outline:none; border-color:var(--em-2); box-shadow:0 0 0 3.5px rgba(9,179,104,.12)}

.cxx .tabrow{position:relative; margin-top:10px}
.cxx .tabrow::after{content:""; position:absolute; right:0; top:0; bottom:0; width:28px;
  pointer-events:none; background:linear-gradient(90deg,rgba(247,250,248,0),var(--card-2))}
.cxx .tabs{display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; padding-bottom:1px}
.cxx .tabs::-webkit-scrollbar{display:none}
.cxx .tab{flex:none; position:relative; padding:5px 3px 7px; font-size:12.5px; font-weight:500;
  color:var(--muted); white-space:nowrap; margin-right:9px; transition:color .18s}
.cxx .tab:hover{color:var(--ink-2)}
.cxx .tab::after{content:""; position:absolute; left:0; right:0; bottom:0; height:2px;
  border-radius:2px; background:transparent; transition:background .18s}
.cxx .tab.on{color:var(--ink); font-weight:700}
.cxx .tab.on::after{background:var(--em-2)}

.cxx .threads{flex:1; min-height:0; overflow-y:auto; padding:4px 8px 10px}
.cxx .dayline{display:flex; align-items:center; gap:9px; padding:13px 6px 6px; position:sticky; top:0;
  z-index:2; background:linear-gradient(180deg,var(--card-2) 62%,rgba(247,250,248,0))}
.cxx .dayline .ln{flex:1; height:1px; background:var(--rule)}

.cxx .conv{position:relative; width:100%; display:flex; gap:11px; text-align:left; border-radius:14px;
  padding:11px 11px 11px 12px; margin-bottom:6px; overflow:hidden;
  background:var(--card);
  box-shadow:0 1px 2px rgba(6,46,29,.04), inset 0 0 0 1px var(--rule);
  transition:box-shadow .2s cubic-bezier(.4,0,.2,1), transform .2s cubic-bezier(.4,0,.2,1),
             background .2s ease}

/* service colour ka wash — baayin se aata hai */
.cxx .conv::after{content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
  border-radius:inherit; opacity:0; transition:opacity .2s ease;
  background:linear-gradient(96deg,
    color-mix(in srgb, var(--sc,#75837B) 11%, transparent) 0%,
    transparent 52%)}
.cxx .conv:hover::after{opacity:1}
.cxx .conv.on::after{opacity:.72}

/* left accent bar — hover par khulta hai, select par tik jaata hai */
.cxx .conv::before{content:""; position:absolute; left:0; top:12px; bottom:12px; width:3px; z-index:2;
  border-radius:0 3px 3px 0; background:var(--sc,var(--em-2));
  transform:scaleY(0); transform-origin:center; opacity:.6;
  transition:transform .24s cubic-bezier(.34,1.4,.64,1), opacity .2s ease}
.cxx .conv:hover::before{transform:scaleY(1)}
.cxx .conv.on::before{transform:scaleY(1); opacity:1}

.cxx .conv > *{position:relative; z-index:1}

.cxx .conv:hover{transform:translateY(-2px);
  box-shadow:0 4px 10px -4px rgba(6,46,29,.13), 0 14px 26px -18px rgba(6,46,29,.5),
             inset 0 0 0 1px color-mix(in srgb, var(--sc,#75837B) 26%, var(--rule))}
.cxx .conv:active{transform:translateY(0) scale(.995);
  transition-duration:.08s}
.cxx .conv.on{transform:none;
  box-shadow:var(--lift-1), inset 0 0 0 1.5px color-mix(in srgb, var(--sc,#75837B) 42%, var(--rule))}
.cxx .conv.on:hover{transform:none;
  box-shadow:0 4px 10px -4px rgba(6,46,29,.13), 0 14px 26px -18px rgba(6,46,29,.5),
             inset 0 0 0 1.5px color-mix(in srgb, var(--sc,#75837B) 55%, var(--rule))}

/* avatar zara sa uthta hai aur uske around service colour ki ring aati hai */
.cxx .conv .face{transition:transform .24s cubic-bezier(.34,1.4,.64,1), box-shadow .2s ease}
.cxx .conv:hover .face{transform:scale(1.06);
  box-shadow:0 0 0 3px color-mix(in srgb, var(--sc,#75837B) 13%, transparent)}
.cxx .conv:hover .cname{color:var(--ink)}
.cxx .conv:hover .last{color:var(--body)}
.cxx .conv .cname,.cxx .conv .last{transition:color .2s ease}
.cxx .face{position:relative; width:38px; height:38px; flex:none; border-radius:12px; display:grid;
  place-items:center; overflow:hidden; font-size:13px; font-weight:700;
  background:var(--fbg,#EFF3F1); color:var(--sc,#75837B)}
.cxx .face img{width:100%; height:100%; object-fit:cover}
.cxx .conv .cbody{flex:1; min-width:0}
.cxx .conv .r1{display:flex; align-items:center; gap:8px}
.cxx .conv .cname{flex:1; min-width:0; font-size:13.5px; font-weight:600; color:var(--ink-2);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .conv.new .cname{font-weight:800; color:var(--ink)}
.cxx .conv .when{flex:none; font-size:10.5px; font-family:var(--mono); color:var(--faint)}
.cxx .conv.new .when{color:var(--em); font-weight:700}
.cxx .conv .r2{display:flex; align-items:center; gap:7px; margin-top:3px}
.cxx .conv .last{flex:1; min-width:0; margin:0; font-size:12.5px; color:var(--faint);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .conv.new .last{color:var(--body)}
.cxx .conv .last .mine{color:var(--ghost); display:inline-flex; vertical-align:-2px; margin-right:3px}
.cxx .conv .r3{display:flex; align-items:center; gap:6px; margin-top:5px}
.cxx .chip{flex:none; border-radius:6px; padding:1px 6px; font-size:9.5px; font-weight:700;
  letter-spacing:.05em; text-transform:uppercase; background:var(--fbg,#EFF3F1); color:var(--sc,#75837B)}
.cxx .ref{flex:none; font-family:var(--mono); font-size:10px; color:var(--ghost); overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap}
.cxx .n{flex:none; min-width:19px; height:19px; padding:0 5px; border-radius:999px; font-size:10.5px;
  font-weight:700; line-height:19px; text-align:center; background:var(--em); color:#fff;
  font-variant-numeric:tabular-nums}
.cxx .n.teal{background:var(--teal)}
.cxx .n.indigo{background:var(--indigo)}
.cxx .stack{flex:none; display:inline-flex; align-items:center; border-radius:999px;
  border:1px solid var(--rule-2); background:var(--card); padding:0 6px; height:18px;
  font-size:10px; font-weight:600; color:var(--muted)}

.cxx .void{padding:44px 20px; text-align:center}
.cxx .void .g{width:46px; height:46px; margin:0 auto 12px; border-radius:15px; display:grid;
  place-items:center; background:var(--sunk); color:var(--ghost)}
.cxx .void b{display:block; font-size:13px; font-weight:600; color:var(--ink-2)}
.cxx .void span{display:block; margin-top:3px; font-size:12px; color:var(--faint)}
.cxx .skel{display:flex; align-items:center; gap:11px; padding:11px}
.cxx .skel .a{width:38px; height:38px; border-radius:12px; flex:none}
.cxx .skel .b{flex:1; display:flex; flex-direction:column; gap:6px}
.cxx .skel .b i{display:block; height:9px; border-radius:5px}

/* ── 3. thread ── */
.cxx .room{display:flex; flex-direction:column; min-width:0; min-height:0; background:var(--card)}
.cxx .thead{flex:none; display:flex; align-items:center; gap:12px; padding:13px 18px;
  border-bottom:1px solid var(--rule)}
.cxx .icon{width:32px; height:32px; flex:none; border-radius:10px; display:grid; place-items:center;
  color:var(--muted); transition:background .18s, color .18s}
.cxx .icon:hover{background:var(--sunk); color:var(--ink-2)}
.cxx .backb{display:none}
.cxx .infob{display:none}
.cxx .veil{display:none}
.cxx .thead .ttl{min-width:0; flex:1}
.cxx .thead h2{margin:0; font-family:var(--serif); font-size:19px; font-weight:600; line-height:1.2;
  letter-spacing:-.01em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .thead .under{display:flex; align-items:center; gap:8px; margin-top:2px; flex-wrap:wrap}
.cxx .thead .under p{margin:0; font-size:11px; color:var(--muted)}
.cxx .thead .under p b{font-family:var(--mono); font-size:10.5px; font-weight:600; color:var(--ink-2)}
.cxx .tone{flex:none; border-radius:7px; padding:2px 8px; font-size:10px; font-weight:700;
  letter-spacing:.05em; text-transform:uppercase; background:var(--fbg,#EFF3F1); color:var(--sc,#75837B);
  border:1px solid transparent}
.cxx .tone.live{background:var(--mint); color:var(--em); border-color:var(--mint-2)}
.cxx .act{display:inline-flex; align-items:center; gap:6px; border-radius:10px; padding:7px 12px;
  font-size:12px; font-weight:600; border:1px solid var(--rule-2); background:var(--card);
  color:var(--ink-2); white-space:nowrap;
  transition:border-color .18s, color .18s, background .18s}
.cxx .act:hover{border-color:var(--rule-3); background:var(--card-2)}
.cxx .act.key{border-color:transparent; color:#fff;
  background:linear-gradient(178deg,#0A5F3A,#04361F); box-shadow:0 10px 18px -14px rgba(6,46,29,.9)}
.cxx .act.key:hover{background:linear-gradient(178deg,#0B6C42,#053E24)}

.cxx .docks{flex:none; display:flex; align-items:center; gap:8px; padding:9px 18px;
  border-bottom:1px solid var(--rule); background:var(--card-2); overflow-x:auto; scrollbar-width:none}
.cxx .docks::-webkit-scrollbar{display:none}
.cxx .dock{flex:none; display:inline-flex; align-items:center; gap:7px; border-radius:10px;
  border:1px solid var(--rule-2); background:var(--card); padding:5px 11px; font-size:11.5px;
  font-weight:500; color:var(--muted); white-space:nowrap; transition:border-color .18s, color .18s}
.cxx .dock:hover{border-color:var(--rule-3); color:var(--ink-2)}
.cxx .dock .no{font-family:var(--mono); font-size:10.5px; opacity:.75}
.cxx .dock.on{color:#fff; border-color:transparent; background:linear-gradient(178deg,#0A4A2E,#062E1D)}
.cxx .dock.on::before{content:""; width:6px; height:6px; border-radius:999px; flex:none;
  background:var(--sc,var(--em-3))}
.cxx .dock.on .no{opacity:.72}
.cxx .dock .n{height:16px; min-width:16px; line-height:16px; font-size:9.5px}
.cxx .sw{flex:none; position:relative; display:flex; align-items:center}
.cxx .sw select{appearance:none; border-radius:10px; border:1px solid var(--rule-2);
  background:var(--card); padding:6px 27px 6px 11px; font-size:11.5px; font-weight:600;
  color:var(--ink-2); cursor:pointer}
.cxx .sw select:focus{outline:none; border-color:var(--em-2)}
.cxx .sw .cv{position:absolute; right:9px; color:var(--faint); pointer-events:none}

.cxx .flow{flex:1; min-height:0; overflow-y:auto;
  padding:14px 22px 6px;
  background:
    radial-gradient(600px 320px at 100% -12%, rgba(9,179,104,.055), transparent 64%),
    linear-gradient(180deg,var(--card-2) 0%, var(--card) 34%)}
.cxx .stamp{display:flex; justify-content:center; margin:16px 0 10px}
.cxx .stamp span{border-radius:999px; border:1px solid var(--rule); background:var(--card);
  padding:3px 13px; font-family:var(--mono); font-size:9.5px; font-weight:600; letter-spacing:.12em;
  text-transform:uppercase; color:var(--muted)}
.cxx .msg{display:flex; align-items:flex-end; gap:9px; margin-top:9px}
.cxx .msg.mine{justify-content:flex-end}
.cxx .msg.run{margin-top:2px}
.cxx .who{width:26px; height:26px; flex:none; margin-bottom:17px; border-radius:9px; display:grid;
  place-items:center; overflow:hidden; font-size:10px; font-weight:700;
  background:var(--fbg,#EFF3F1); color:var(--sc,#75837B)}
.cxx .who img{width:100%; height:100%; object-fit:cover}
.cxx .who.hole{background:none}
.cxx .wrap{max-width:min(760px,72%); display:flex; flex-direction:column; gap:3px}
.cxx .msg.mine .wrap{align-items:flex-end}
.cxx .say{position:relative; border-radius:16px 16px 16px 5px; padding:9px 13px;
  border:1px solid var(--rule); background:var(--card); box-shadow:var(--lift-1)}
.cxx .msg.run .say{border-radius:16px}
.cxx .msg.mine .say{border-radius:16px 16px 5px 16px; border-color:transparent; color:#fff;
  background:linear-gradient(176deg,#0C8F5C 0%,#054F2F 100%);
  box-shadow:0 10px 20px -16px rgba(6,46,29,.95)}
.cxx .msg.mine.run .say{border-radius:16px}
.cxx .msg.mine .say.teal{background:linear-gradient(176deg,#12A79D,#08514C)}
.cxx .say p{margin:0; font-size:13.5px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere;
  color:var(--ink-2)}
.cxx .msg.mine .say p{color:#fff}
.cxx .say.pic{padding:5px}
.cxx .tail{display:flex; align-items:center; gap:5px; padding:0 3px; font-family:var(--mono);
  font-size:9.5px; color:var(--faint); font-variant-numeric:tabular-nums}
.cxx .tail .tk{display:inline-flex; color:var(--ghost)}
.cxx .tail .tk.seen{color:var(--em-2)}
.cxx .shotwrap{position:relative; display:block; border-radius:13px; overflow:hidden; line-height:0}
.cxx .shotwrap img{display:block; max-width:250px; max-height:250px; border-radius:13px;
  object-fit:cover}
.cxx .shotwrap .grab{position:absolute; inset:0; display:grid; place-items:center; color:#fff;
  background:rgba(8,21,15,0); opacity:0; transition:opacity .18s, background .18s}
.cxx .shotwrap:hover .grab{opacity:1; background:rgba(8,21,15,.28)}
.cxx .doc{display:flex; align-items:center; gap:10px; border-radius:11px; padding:8px 10px;
  background:var(--card-2); border:1px solid var(--rule)}
.cxx .msg.mine .doc{background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.22)}
.cxx .doc .ext{width:32px; height:32px; flex:none; border-radius:9px; display:grid; place-items:center;
  background:var(--rose-bg); color:var(--rose)}
.cxx .msg.mine .doc .ext{background:rgba(255,255,255,.2); color:#fff}
.cxx .doc .fn{min-width:0; font-size:12.5px; font-weight:600; overflow:hidden;
  text-overflow:ellipsis; white-space:nowrap}
.cxx .doc .pull{margin-left:auto; flex:none; display:grid; place-items:center; opacity:.6}

/* ── compose ── */
.cxx .desk{flex:none; position:relative; border-top:1px solid var(--rule); background:var(--card);
  padding:10px 20px 13px}
.cxx .desk .glow{position:absolute; left:0; right:0; top:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(9,179,104,.34),transparent)}
.cxx .rising{display:flex; align-items:center; gap:9px; margin-bottom:9px; border-radius:12px;
  border:1px solid var(--mint-2); background:var(--mint); padding:8px 12px; font-size:12px;
  font-weight:600; color:var(--em)}
.cxx .pen{display:flex; align-items:flex-end; gap:9px}
.cxx .orb{width:40px; height:40px; flex:none; border-radius:13px; display:grid; place-items:center;
  color:var(--muted); border:1px solid transparent;
  transition:background .18s, color .18s, border-color .18s}
.cxx .orb:hover{background:var(--sunk); color:var(--em)}
.cxx .orb:disabled{opacity:.4; cursor:default}
.cxx .orb.lit{background:var(--amber-bg); border-color:var(--amber-ln); color:var(--amber)}
.cxx .slate{flex:1; min-width:0; display:flex; align-items:flex-end; gap:3px; border-radius:16px;
  border:1px solid var(--rule-2); background:var(--card-2); padding:2px 4px 2px 14px;
  transition:border-color .18s, box-shadow .18s, background .18s}
.cxx .slate:focus-within{border-color:var(--em-2); background:var(--card);
  box-shadow:0 0 0 3.5px rgba(9,179,104,.12)}
.cxx .slate textarea{flex:1; min-width:0; border:none; background:none; resize:none; padding:10px 0;
  font-size:13.5px; line-height:1.45; color:var(--ink); font-family:inherit}
.cxx .slate textarea:focus{outline:none}
.cxx .slate textarea::placeholder{color:var(--ghost)}
.cxx .fly{width:40px; height:40px; flex:none; border-radius:13px; display:grid; place-items:center;
  color:#fff; background:linear-gradient(176deg,#0C8F5C,#054F2F);
  box-shadow:0 12px 22px -15px rgba(6,46,29,.95);
  transition:transform .18s, opacity .18s, box-shadow .18s}
.cxx .fly:hover{transform:translateY(-2px)}
.cxx .fly:disabled{opacity:.35; transform:none; box-shadow:none; cursor:default}
.cxx .fly.teal{background:linear-gradient(176deg,#12A79D,#08514C)}
.cxx .emojipad{position:absolute; bottom:100%; right:16px; margin-bottom:8px; z-index:50;
  border-radius:16px; overflow:hidden; border:1px solid var(--rule-2); box-shadow:var(--lift-2)}

/* ── 4. details ── */
.cxx .ctx{display:flex; flex-direction:column; min-width:0; min-height:0;
  border-left:1px solid var(--rule); background:var(--card-2)}
.cxx .ctx .ctop{flex:none; display:flex; align-items:center; padding:13px 15px;
  border-bottom:1px solid var(--rule)}
.cxx .ctx .shut{margin-left:auto; display:none}
.cxx .ctx .cscroll{flex:1; min-height:0; overflow-y:auto; padding:15px}
.cxx .plate{border-radius:16px; border:1px solid var(--rule); background:var(--card); padding:15px;
  box-shadow:var(--lift-1)}
.cxx .plate + .plate{margin-top:12px}
.cxx .plate .phead{display:flex; align-items:center; gap:8px; margin-bottom:11px}
.cxx .plate .phead .ln{flex:1; height:1px; background:var(--rule)}
.cxx .cardv{display:flex; flex-direction:column; align-items:center; text-align:center}
.cxx .cardv .face{width:52px; height:52px; border-radius:16px; font-size:17px}
.cxx .cardv h3{margin:11px 0 0; font-family:var(--serif); font-size:19px; font-weight:600;
  line-height:1.2; letter-spacing:-.01em}
.cxx .cardv .pair{display:flex; flex-wrap:wrap; justify-content:center; gap:7px; margin-top:9px}
.cxx .rows{width:100%; margin-top:14px}
.cxx .kv{display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid var(--rule);
  text-align:left}
.cxx .kv:first-child{border-top:none}
.cxx .kv .k{flex:none; width:66px}
.cxx .kv .v{flex:1; min-width:0; font-size:12.5px; font-weight:600; color:var(--ink-2);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .kv .v.mono{font-family:var(--mono); font-size:11.5px}
.cxx .pairbtn{display:grid; grid-template-columns:1fr 1fr; gap:7px; width:100%; margin-top:13px}
.cxx .pairbtn .act{justify-content:center}
.cxx .pairbtn.one{grid-template-columns:1fr}
.cxx .item{display:flex; align-items:center; gap:10px; width:100%; border-radius:11px; padding:9px;
  text-align:left; transition:background .16s}
.cxx .item:hover{background:var(--card-2)}
.cxx .item.on{background:var(--sunk); box-shadow:inset 0 0 0 1px var(--rule)}
.cxx .item .sq{width:30px; height:30px; flex:none; border-radius:9px; display:grid; place-items:center;
  background:var(--fbg,#EFF3F1); color:var(--sc,#75837B)}
.cxx .item .it{flex:1; min-width:0}
.cxx .item .it b{display:block; font-size:12.5px; font-weight:600; color:var(--ink-2);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .item .it span{display:block; font-family:var(--mono); font-size:10px; color:var(--faint)}
.cxx .tiles{display:grid; grid-template-columns:repeat(3,1fr); gap:7px}
.cxx .tile{position:relative; aspect-ratio:1; border-radius:11px; overflow:hidden; display:block;
  background:var(--sunk); box-shadow:inset 0 0 0 1px var(--rule)}
.cxx .tile img{width:100%; height:100%; object-fit:cover; display:block}
.cxx .filerow{display:flex; align-items:center; gap:9px; padding:8px 0; border-top:1px solid var(--rule)}
.cxx .filerow:first-child{border-top:none}
.cxx .filerow .ext{width:28px; height:28px; flex:none; border-radius:8px; display:grid;
  place-items:center; background:var(--rose-bg); color:var(--rose)}
.cxx .filerow .it{flex:1; min-width:0}
.cxx .filerow .it b{display:block; font-size:12px; font-weight:600; color:var(--ink-2);
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.cxx .filerow .it span{font-family:var(--mono); font-size:9.5px; color:var(--faint)}

/* ── empty room ── */
.cxx .hollow{flex:1; display:grid; place-items:center; padding:32px;
  background:
    radial-gradient(600px 320px at 100% -12%, rgba(9,179,104,.055), transparent 64%),
    linear-gradient(180deg,var(--card-2) 0%, var(--card) 34%)}
.cxx .hollow .in{text-align:center; max-width:330px}
.cxx .hollow .g{width:64px; height:64px; margin:0 auto 16px; border-radius:21px; display:grid;
  place-items:center; background:var(--mint); border:1px solid var(--mint-2); color:var(--em)}
.cxx .hollow .g.t{background:var(--teal-bg); border-color:var(--teal-ln); color:var(--teal)}
.cxx .hollow .g.i{background:var(--indigo-bg); border-color:var(--indigo-ln); color:var(--indigo)}
.cxx .hollow h2{margin:0; font-family:var(--serif); font-size:25px; font-weight:600;
  letter-spacing:-.015em}
.cxx .hollow p{margin:8px 0 0; font-size:13px; color:var(--muted)}
.cxx .midblank{display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height:46vh; text-align:center}
.cxx .midblank .g{width:52px; height:52px; margin:0 auto 12px; border-radius:17px; display:grid;
  place-items:center; background:var(--mint); border:1px solid var(--mint-2); color:var(--em)}
.cxx .midblank p{margin:0; font-size:13px; color:var(--muted)}
.cxx .spin{width:22px; height:22px; border-radius:999px; border:3px solid var(--mint-2);
  border-top-color:var(--em); animation:cxxSpin .8s linear infinite; margin:36px auto}
@keyframes cxxSpin{to{transform:rotate(360deg)}}
.cxx .dotspin{width:16px; height:16px; border-radius:999px; border:2px solid rgba(255,255,255,.45);
  border-top-color:#fff; animation:cxxSpin .8s linear infinite}

/* ── login gate ── */
.cxx.gate{display:grid; place-items:center; min-height:calc(100vh - 64px); padding:24px}
.cxx .gateBox{max-width:360px; text-align:center; border-radius:20px; border:1px solid var(--rule);
  background:var(--card); box-shadow:var(--lift-2); padding:36px 28px}
.cxx .gateBox .g{width:56px; height:56px; margin:0 auto 15px; border-radius:19px; display:grid;
  place-items:center; background:var(--mint); border:1px solid var(--mint-2); color:var(--em)}
.cxx .gateBox h2{margin:0; font-family:var(--serif); font-size:25px; font-weight:600}
.cxx .gateBox p{margin:7px 0 0; font-size:13px; color:var(--muted)}
.cxx .gateGo{display:inline-flex; align-items:center; gap:8px; margin-top:18px; border-radius:12px;
  padding:11px 20px; font-size:13.5px; font-weight:700; color:#fff;
  background:linear-gradient(178deg,#0A5F3A,#04361F)}

/* ── choti screen — sabse aakhir me ── */
@media (max-width:1180px){
  .cxx .frame{grid-template-columns:66px 288px minmax(0,1fr)}
  .cxx .ctx{position:fixed; top:74px; right:12px; bottom:12px; width:318px; z-index:60;
    border-radius:20px; border:1px solid var(--rule); box-shadow:var(--lift-2);
    transform:translateX(calc(100% + 20px)); transition:transform .24s ease}
  .cxx .ctx.open{transform:none}
  .cxx .ctx .shut{display:grid}
  .cxx .veil{display:block; position:fixed; inset:0; z-index:59; background:rgba(8,21,15,.28); opacity:0;
    pointer-events:none; transition:opacity .24s}
  .cxx .veil.open{opacity:1; pointer-events:auto}
  .cxx .infob{display:grid}
}
@media (max-width:900px){
  .cxx.chatroot{padding-left:0; padding-right:0; padding-bottom:0}
  .cxx .frame{grid-template-columns:minmax(0,1fr); border-radius:0; box-shadow:none;
    padding-bottom:60px}
  .cxx .spine{position:fixed; left:0; right:0; bottom:0; z-index:70; height:60px;
    flex-direction:row; justify-content:space-around; align-items:center; gap:0; padding:0 8px}
  .cxx .spine .crest,.cxx .spine .foot{display:none}
  .cxx .ch{width:auto; flex:1; padding:7px 0 6px; border-radius:12px}
  .cxx .ch.on::before{left:50%; transform:translateX(-50%); top:0; bottom:auto; width:24px; height:3px;
    border-radius:0 0 3px 3px}
  .cxx .ch .dot{top:2px; right:calc(50% - 24px)}
  .cxx .rail{border-right:none}
  .cxx .rail.away,.cxx .room.away{display:none}
  .cxx .backb{display:grid}
  .cxx .ctx{top:0; right:0; bottom:60px; width:min(318px,88vw); border-radius:0}
  .cxx .flow{padding:12px 14px 6px}
  .cxx .desk{padding:9px 12px 12px}
  .cxx .wrap{max-width:84%}
  .cxx .thead{padding:11px 12px; gap:9px}
  .cxx .thead h2{font-size:16.5px}
  .cxx .thead .act{padding:9px; gap:0}
  .cxx .thead .act .lb{display:none}
  .cxx .docks{padding:8px 12px}
  .cxx .rhead{padding:14px 14px 11px}
  .cxx .emojipad{right:8px; left:8px}
}
@media (prefers-reduced-motion:reduce){
  .cxx *{transition:none !important; animation:none !important}
}
`;

// Ek hi service colour se pill ka background aur text — dono nikal lete hain.
const tint = (c: string): React.CSSProperties =>
  ({ ['--sc' as any]: c, ['--fbg' as any]: `${c}18` } as React.CSSProperties);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerChatPage() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedVendorGroup, setSelectedVendorGroup] = useState<VendorGroup | null>(null);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMode, setChatMode] = useState<'vendor' | 'driver' | 'agent'>('vendor');
  const [agentConversations, setAgentConversations] = useState<AgentConversation[]>([]);
  const [selectedAgentConvId, setSelectedAgentConvId] = useState<string | null>(null);
  const [agentTotalUnread, setAgentTotalUnread] = useState(0);
  const [isLoadingAgentConvs, setIsLoadingAgentConvs] = useState(false);
  const [driverConversations, setDriverConversations] = useState<any[]>([]);
  const [selectedDriverConvId, setSelectedDriverConvId] = useState<string | null>(null);
  const [driverMessages, setDriverMessages] = useState<any[]>([]);
  const [driverTotalUnread, setDriverTotalUnread] = useState(0);
  const [isLoadingDriverMsgs, setIsLoadingDriverMsgs] = useState(false);
  const [isLoadingDriverConvs, setIsLoadingDriverConvs] = useState(false);
  const [driverLastSince, setDriverLastSince] = useState<string | null>(null);
  const [driverNewMsg, setDriverNewMsg] = useState('');
  const [isDriverSending, setIsDriverSending] = useState(false);
  const [showCtx, setShowCtx] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Derived: active conversation
  const selectedConversation = useMemo(() => {
    if (!selectedVendorGroup) return null;
    return selectedVendorGroup.conversations.find(c => c.id === activeConvId)
      || selectedVendorGroup.conversations[0]
      || null;
  }, [selectedVendorGroup, activeConvId]);

  // ── Load customer from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('customer');
      if (raw) setCustomer(JSON.parse(raw));
    } catch {}
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async () => {
    if (!customer) return;
    const identifier = customer.phone || customer.email || '';
    if (!identifier) return;
    try {
      const param = customer.phone ? `phone=${customer.phone}` : `email=${customer.email}`;
      const res = await fetch(`/api/chat/conversations?userType=customer&${param}`);
      const data = await res.json();
      if (data.success) {
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);
        setTotalUnread(data.totalUnread || 0);

        // Auto-select vendor conversation from URL params (only on first load)
        const urlParams = new URLSearchParams(window.location.search);
        const urlConvId = urlParams.get('conv');
        const urlMode = urlParams.get('mode');
        if (urlConvId && urlMode === 'vendor') {
          const target = convs.find(c => c.id === urlConvId);
          if (target) {
            const vendorId = target.participant.id;
            const group: VendorGroup = {
              vendorId,
              vendorName: target.participant.name,
              logo: target.participant.logo,
              phone: target.participant.phone,
              conversations: convs.filter(c => c.participant.id === vendorId),
              totalUnread: 0,
              lastMessageAt: target.lastMessageAt,
              lastMessage: target.lastMessage,
            };
            group.totalUnread = group.conversations.reduce((s, c) => s + c.unreadCount, 0);
            setSelectedVendorGroup(group);
            setActiveConvId(urlConvId);
            setShowMobileSidebar(false);
            // Clear params so polls don't re-select on every tick
            window.history.replaceState({}, '', '/customer/chat');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}?userType=customer`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setConversations(prev =>
          prev.map(c => c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation]);

  // ── Driver chat fetch functions ──
  const fetchDriverConversations = useCallback(async () => {
    if (!customer) return;
    const param = customer.phone ? `phone=${customer.phone}` : customer.email ? `email=${customer.email}` : '';
    if (!param) return;
    setIsLoadingDriverConvs(true);
    try {
      const res = await fetch(`/api/customer/driver-chat?${param}`);
      const data = await res.json();
      if (data.success) {
        setDriverConversations(data.conversations || []);
        setDriverTotalUnread(data.totalUnread || 0);
      }
    } catch {}
    setIsLoadingDriverConvs(false);
  }, [customer]);

  // ── Travel-agent chats: fetch the customer's conversations by phone ──
  const fetchAgentConversations = useCallback(async () => {
    if (!customer?.phone) { setAgentConversations([]); setAgentTotalUnread(0); return; }
    setIsLoadingAgentConvs(true);
    try {
      const res = await fetch(
        `/api/travel-agent-chat/conversations?phone=${encodeURIComponent(customer.phone)}`,
      );
      const data = await res.json();
      if (data.success) {
        const convs: AgentConversation[] = data.conversations || [];
        setAgentConversations(convs);
        setAgentTotalUnread(convs.reduce((s, c) => s + (c.unreadCount || 0), 0));
      }
    } catch {}
    setIsLoadingAgentConvs(false);
  }, [customer?.phone]);

  const fetchDriverMessages = useCallback(async (since?: string | null) => {
    if (!selectedDriverConvId) return;
    try {
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      const res = await fetch(`/api/customer/driver-chat/${selectedDriverConvId}/messages${qs}`);
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.messages || [];
        if (since) {
          setDriverMessages(prev => {
            const ids = new Set(prev.map((m: any) => m.id));
            const fresh = newMsgs.filter((m: any) => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        } else {
          setDriverMessages(newMsgs);
          // Backfill bookingNumber into driverConversations if not already present
          if (data.conversation?.bookingNumber) {
            setDriverConversations(prev => prev.map(c =>
              c.id === selectedDriverConvId && !c.bookingNumber
                ? { ...c, bookingNumber: data.conversation.bookingNumber }
                : c
            ));
          }
        }
        if (newMsgs.length > 0) setDriverLastSince(newMsgs[newMsgs.length - 1].createdAt);
      }
    } catch {}
    setIsLoadingDriverMsgs(false);
  }, [selectedDriverConvId]);

  const sendDriverMessage = async () => {
    if (!driverNewMsg.trim() || !selectedDriverConvId || isDriverSending) return;
    const text = driverNewMsg.trim();
    setDriverNewMsg('');
    setIsDriverSending(true);
    const tempId = `temp-${Date.now()}`;
    setDriverMessages(prev => [...prev, { id: tempId, senderType: 'customer', content: text, createdAt: new Date().toISOString(), status: 'SENT' }]);
    try {
      const res = await fetch(`/api/customer/driver-chat/${selectedDriverConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, senderName: customer?.name || 'Customer' }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        setDriverLastSince(data.message.createdAt);
      } else {
        setDriverMessages(prev => prev.filter(m => m.id !== tempId));
        setDriverNewMsg(text);
      }
    } catch {
      setDriverMessages(prev => prev.filter(m => m.id !== tempId));
      setDriverNewMsg(text);
    } finally {
      setIsDriverSending(false);
    }
  };

  // ── Send message ──
  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || isSending) return;
    const text = content.trim();
    setNewMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, senderType: 'customer', senderId: null, senderName: 'You',
      messageType: 'TEXT', content: text, status: 'SENT', readAt: null, createdAt: new Date().toISOString(),
    }]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'customer', content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        setConversations(prev => prev.map(c => c.id === selectedConversation.id
          ? { ...c, lastMessage: { id: data.message.id, content: text, senderType: 'customer', messageType: 'TEXT', createdAt: new Date().toISOString() }, lastMessageAt: new Date().toISOString() }
          : c
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(text);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // ── File upload ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { alert('Failed to upload file'); return; }

      const fileUrl = uploadData.url;
      const isImage = file.type.startsWith('image/');
      const contentText = isImage ? `📷 ${file.name}` : file.name;
      const tempId = `temp-${Date.now()}`;

      setMessages(prev => [...prev, {
        id: tempId, senderType: 'customer', senderId: null, senderName: 'You',
        messageType: isImage ? 'IMAGE' : 'FILE', content: contentText,
        attachmentUrl: fileUrl, attachmentName: file.name, status: 'SENT', readAt: null, createdAt: new Date().toISOString(),
      }]);
      scrollToBottom();

      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'customer', content: contentText, messageType: isImage ? 'IMAGE' : 'FILE', attachmentUrl: fileUrl, attachmentName: file.name, attachmentSize: file.size, attachmentType: file.type }),
      });
      const data = await res.json();
      if (data.success) setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      else setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch { } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Emoji ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // ── Initial load ──
  useEffect(() => {
    if (customer) fetchConversations();
  }, [customer, fetchConversations]);

  // ── Auto-select conversation from URL query params ──
  useEffect(() => {
    if (!customer) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const convId = params.get('conv');
    if (!convId) return;

    if (mode === 'driver') {
      setChatMode('driver');
      setSelectedDriverConvId(convId);
      setShowMobileSidebar(false);
      fetchDriverConversations();
      window.history.replaceState({}, '', '/customer/chat');
    } else if (mode === 'agent') {
      setChatMode('agent');
      setSelectedAgentConvId(convId);
      setShowMobileSidebar(false);
      fetchAgentConversations();
      window.history.replaceState({}, '', '/customer/chat');
    } else if (mode === 'vendor') {
      setChatMode('vendor');
      setShowMobileSidebar(false);
      // fetchConversations handles vendor auto-select via window.location.search
    }
  }, [customer, fetchDriverConversations]);

  // ── Load messages + polling ──
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      setMessages([]);
      fetchMessages();
      setShowMobileSidebar(false);
      pollingRef.current = setInterval(fetchMessages, 3000);
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [selectedConversation?.id, fetchMessages]);

  // ── Scroll on new messages ──
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const container = messagesEndRef.current?.parentElement;
      if (container) {
        const near = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (near || prevMsgCount.current === 0) scrollToBottom();
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, scrollToBottom]);

  // ── Poll conversations ──
  useEffect(() => {
    if (!customer) return;
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations, customer]);

  // ── Fetch driver conversations ──
  useEffect(() => {
    if (customer && chatMode === 'driver') fetchDriverConversations();
  }, [customer, chatMode, fetchDriverConversations]);

  // ── Fetch agent conversations + refresh every 15s while on the tab ──
  useEffect(() => {
    if (!customer?.phone || chatMode !== 'agent') return;
    fetchAgentConversations();
    const t = setInterval(fetchAgentConversations, 15000);
    return () => clearInterval(t);
  }, [customer?.phone, chatMode, fetchAgentConversations]);

  // ── Driver messages polling ──
  useEffect(() => {
    if (chatMode !== 'driver' || !selectedDriverConvId) return;
    setIsLoadingDriverMsgs(true);
    setDriverMessages([]);
    setDriverLastSince(null);
    fetchDriverMessages(null);
    driverPollRef.current = setInterval(() => {
      setDriverLastSince(prev => { fetchDriverMessages(prev); return prev; });
    }, 3000);
    return () => { if (driverPollRef.current) clearInterval(driverPollRef.current); };
  }, [selectedDriverConvId, chatMode]);

  // ── Helpers ──
  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString('en-IN', { weekday: 'short' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDateGroup = (d: string | null) => {
    if (!d) return 'Earlier';
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return 'This Week';
    return 'Earlier';
  };

  // ── Filter ──
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return conv.unreadCount > 0;
      return conv.bookingType.toLowerCase().includes(activeTab);
    }
    const q = searchQuery.toLowerCase();
    return conv.participant.name.toLowerCase().includes(q) || conv.bookingType.toLowerCase().includes(q);
  });

  // ── Group by vendor ──
  const vendorGroups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, VendorGroup>();
    filteredConversations.forEach(conv => {
      const existing = map.get(conv.participant.id);
      if (existing) {
        existing.conversations.push(conv);
        existing.totalUnread += conv.unreadCount;
        if (!existing.lastMessageAt || (conv.lastMessageAt && conv.lastMessageAt > existing.lastMessageAt)) {
          existing.lastMessageAt = conv.lastMessageAt;
          existing.lastMessage = conv.lastMessage;
        }
      } else {
        map.set(conv.participant.id, {
          vendorId: conv.participant.id,
          vendorName: conv.participant.name,
          logo: conv.participant.logo,
          phone: conv.participant.phone,
          conversations: [conv],
          totalUnread: conv.unreadCount,
          lastMessageAt: conv.lastMessageAt,
          lastMessage: conv.lastMessage,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    });
  }, [filteredConversations]);

  // ── Group vendors by date ──
  const groupedVendors: { label: string; items: VendorGroup[] }[] = [];
  let currentDateGroup = '';
  vendorGroups.forEach(vg => {
    const label = getDateGroup(vg.lastMessageAt);
    if (label !== currentDateGroup) {
      currentDateGroup = label;
      groupedVendors.push({ label, items: [vg] });
    } else {
      groupedVendors[groupedVendors.length - 1].items.push(vg);
    }
  });

  const uniqueTypes = Array.from(new Set(conversations.map(c => c.bookingType)));
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    ...uniqueTypes.map(t => ({ id: t, label: TYPE_LABELS[t] || t })),
  ];

  // ── Presentational helpers (UI only — no data/flow changes) ──
  const modeUnread = chatMode === 'vendor' ? totalUnread : chatMode === 'driver' ? driverTotalUnread : agentTotalUnread;
  const activeDriverConv = driverConversations.find((c: any) => c.id === selectedDriverConvId) || null;
  const activeAgentConv = agentConversations.find(c => c.id === selectedAgentConvId) || null;
  const headSc = SERVICE_COLORS[selectedConversation?.bookingType || ''] || '#6B7280';
  const roomOpen = chatMode === 'vendor' ? !!selectedVendorGroup
    : chatMode === 'driver' ? !!selectedDriverConvId
    : !!selectedAgentConvId;
  const railAway = roomOpen && !showMobileSidebar;
  const sharedImages = messages.filter(m => m.messageType === 'IMAGE' && m.attachmentUrl).slice(-6).reverse();
  const sharedFiles = messages.filter(m => m.messageType === 'FILE' && m.attachmentUrl).slice(-5).reverse();
  const railTitle = chatMode === 'vendor' ? 'My Chats' : chatMode === 'driver' ? 'Driver Chats' : 'Agent Chats';

  // ── Not logged in ──
  if (!isLoading && !customer) {
    return (
      <>
        <CustomerHeader showBackButton backHref="/" title="Messages" />
        <style dangerouslySetInnerHTML={{ __html: CXX_CSS }} />
        <div className="cxx gate pt-16">
          <div className="gateBox">
            <span className="g"><MessageCircle className="w-7 h-7" /></span>
            <h2>Please log in</h2>
            <p>Login to view your chats with vendors</p>
            <Link href="/customer/login" className="gateGo">Go to Login</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <CustomerHeader showBackButton backHref="/customer/dashboard" title="Messages" />
    <style dangerouslySetInnerHTML={{ __html: CXX_CSS }} />

    <div className="cxx chatroot pt-16 h-screen flex flex-col p-3 bg-[#E9EEEB]">
      <div className="frame">

        {/* ══════ 1. CHANNEL SPINE — mode switch ══════ */}
        <nav className="spine">
          <span className="crest"><MessageCircle className="w-[18px] h-[18px]" /></span>

          <button
            onClick={() => { setChatMode('vendor'); setSelectedDriverConvId(null); setSelectedAgentConvId(null); }}
            className={`ch${chatMode === 'vendor' ? ' on' : ''}`}
            title="Vendor chats">
            <Building2 className="w-[18px] h-[18px]" />
            <span className="lbl">Vendor</span>
            {totalUnread > 0 && <span className="dot tnum">{totalUnread}</span>}
          </button>

          <button
            onClick={() => { setChatMode('driver'); setSelectedVendorGroup(null); setActiveConvId(null); setSelectedAgentConvId(null); fetchDriverConversations(); }}
            className={`ch${chatMode === 'driver' ? ' on' : ''}`}
            title="Driver chats">
            <Car className="w-[18px] h-[18px]" />
            <span className="lbl">Driver</span>
            {driverTotalUnread > 0 && <span className="dot tnum">{driverTotalUnread}</span>}
          </button>

          <button
            onClick={() => { setChatMode('agent'); setSelectedVendorGroup(null); setActiveConvId(null); setSelectedDriverConvId(null); fetchAgentConversations(); }}
            className={`ch${chatMode === 'agent' ? ' on' : ''}`}
            title="Travel agent chats">
            <Star className="w-[18px] h-[18px]" />
            <span className="lbl">Agent</span>
            {agentTotalUnread > 0 && <span className="dot tnum">{agentTotalUnread}</span>}
          </button>

          <div className="foot">
            <span className="me">{(customer?.name || 'C').charAt(0).toUpperCase()}</span>
          </div>
        </nav>

        {/* ══════ 2. CONVERSATION RAIL ══════ */}
        <aside className={`rail${railAway ? ' away' : ''}`}>
          <div className="rhead">
            <h1>{railTitle}</h1>
            <div className="rsub">
              <p>{customer?.name || 'Customer'}</p>
              {modeUnread > 0 && <span className="tally"><i />{modeUnread} unread</span>}
              <button
                onClick={chatMode === 'vendor' ? fetchConversations : chatMode === 'driver' ? fetchDriverConversations : fetchAgentConversations}
                className="refresh" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="seek">
              <Search className="w-3.5 h-3.5 si" />
              <input type="text" placeholder="Search vendors..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} />
            </div>

            <div className="tabrow">
              <div className="tabs">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`tab${activeTab === tab.id ? ' on' : ''}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── list ── */}
          <div className="threads">
            {chatMode === 'agent' ? (
              /* Travel-agent conversations list */
              !customer?.phone ? (
                <div className="void fade-in-up">
                  <span className="g"><Building2 className="w-5 h-5" /></span>
                  <b>Phone number missing</b>
                  <span>Agent chats are matched by phone</span>
                </div>
              ) : isLoadingAgentConvs ? (
                <div>{[...Array(4)].map((_, i) => (
                  <div key={i} className="skel">
                    <div className="a shimmer-teal" />
                    <div className="b"><i className="shimmer-teal" style={{ width: '58%' }} /><i className="shimmer-teal" style={{ width: '84%' }} /></div>
                  </div>
                ))}</div>
              ) : agentConversations.length === 0 ? (
                <div className="void fade-in-up">
                  <span className="g"><Building2 className="w-5 h-5" /></span>
                  <b>No agent chats yet</b>
                  <span>Agents will reach out about your travel enquiries</span>
                </div>
              ) : (
                <div>
                  {agentConversations.map((conv) => {
                    const isActive = selectedAgentConvId === conv.id;
                    const agencyName = conv.agency?.agencyName || 'Travel Agent';
                    return (
                      <button key={conv.id}
                        onClick={() => { setSelectedAgentConvId(conv.id); setShowMobileSidebar(false); }}
                        style={tint('#4338CA')}
                        className={`conv${isActive ? ' on' : ''}${conv.unreadCount > 0 ? ' new' : ''}`}>
                        <span className="face">
                          {conv.agency?.logo
                            ? <img src={conv.agency.logo} alt="" />
                            : agencyName.charAt(0).toUpperCase()}
                        </span>
                        <span className="cbody">
                          <span className="r1">
                            <span className="cname">{agencyName}</span>
                            <span className="when">
                              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                            </span>
                          </span>
                          <span className="r2">
                            <span className="last">
                              {conv.lastMessage?.senderType === 'customer' && <span className="mine">You: </span>}
                              {conv.lastMessage?.content || conv.subject || 'No messages'}
                            </span>
                            {conv.unreadCount > 0 && <span className="n indigo tnum">{conv.unreadCount}</span>}
                          </span>
                          <span className="r3">
                            <span className="chip">Agent</span>
                            {conv.subject && <span className="ref">{conv.subject}</span>}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : chatMode === 'driver' ? (
              /* Driver conversations list */
              isLoadingDriverConvs ? (
                <div>{[...Array(4)].map((_, i) => (
                  <div key={i} className="skel">
                    <div className="a shimmer-teal" />
                    <div className="b"><i className="shimmer-teal" style={{ width: '58%' }} /><i className="shimmer-teal" style={{ width: '84%' }} /></div>
                  </div>
                ))}</div>
              ) : driverConversations.length === 0 ? (
                <div className="void fade-in-up">
                  <span className="g"><Car className="w-5 h-5" /></span>
                  <b>No driver chats</b>
                  <span>Driver chats appear after booking acceptance</span>
                </div>
              ) : (
                <div>
                  {driverConversations.map((conv: any) => {
                    const isActive = selectedDriverConvId === conv.id;
                    const driverName = conv.driver?.name || 'Driver';
                    return (
                      <button key={conv.id}
                        onClick={() => { setSelectedDriverConvId(conv.id); setShowMobileSidebar(false); }}
                        style={tint('#0B7C74')}
                        className={`conv${isActive ? ' on' : ''}${conv.unreadCount > 0 ? ' new' : ''}`}>
                        <span className="face">{driverName.charAt(0).toUpperCase()}</span>
                        <span className="cbody">
                          <span className="r1">
                            <span className="cname">{driverName}</span>
                            <span className="when">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}</span>
                          </span>
                          <span className="r2">
                            <span className="last">{conv.lastMessage?.content || 'No messages'}</span>
                            {conv.unreadCount > 0 && <span className="n teal tnum">{conv.unreadCount}</span>}
                          </span>
                          <span className="r3">
                            <span className="chip">Driver</span>
                            <span className="ref">{conv.bookingNumber ? `#${conv.bookingNumber}` : 'Chauffeur booking'}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : isLoading ? (
              <div>{[...Array(6)].map((_, i) => (
                <div key={i} className="skel">
                  <div className="a shimmer-teal" />
                  <div className="b"><i className="shimmer-teal" style={{ width: '58%' }} /><i className="shimmer-teal" style={{ width: '84%' }} /></div>
                </div>
              ))}</div>
            ) : vendorGroups.length === 0 ? (
              <div className="void fade-in-up">
                <span className="g"><MessageCircle className="w-5 h-5" /></span>
                <b>No conversations yet</b>
                <span>Start a chat from your booking page</span>
              </div>
            ) : (
              <div>
                {groupedVendors.map(section => (
                  <div key={section.label}>
                    <div className="dayline"><p className="eyebrow">{section.label}</p><span className="ln" /></div>
                    {section.items.map(vg => {
                      const isSelected = selectedVendorGroup?.vendorId === vg.vendorId;
                      const latestConv = vg.conversations[0];
                      const sc = SERVICE_COLORS[latestConv?.bookingType] || '#6B7280';
                      const ref = latestConv?.bookingNumber || latestConv?.bookingId || '';

                      return (
                        <button key={vg.vendorId}
                          onClick={() => {
                            const latest = [...vg.conversations].sort((a, b) =>
                              (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')
                            )[0];
                            setSelectedVendorGroup(vg);
                            setActiveConvId(latest?.id || vg.conversations[0]?.id || null);
                          }}
                          style={tint(sc)}
                          className={`conv${isSelected ? ' on' : ''}${vg.totalUnread > 0 ? ' new' : ''}`}>

                          <span className="face">
                            {vg.logo ? <img src={vg.logo} alt="" /> : <Building2 className="w-[17px] h-[17px]" />}
                          </span>

                          <span className="cbody">
                            <span className="r1">
                              <span className="cname">{vg.vendorName}</span>
                              <span className="when">{vg.lastMessageAt ? formatTime(vg.lastMessageAt) : ''}</span>
                            </span>
                            <span className="r2">
                              <span className="last">
                                {vg.lastMessage?.senderType === 'customer' && <span className="mine"><CheckCheck className="w-3 h-3" /></span>}
                                {vg.lastMessage?.content || 'No messages'}
                              </span>
                            </span>
                            <span className="r3">
                              {latestConv && <span className="chip">{TYPE_LABELS[latestConv.bookingType] || latestConv.bookingType}</span>}
                              {ref && <span className="ref">#{ref.slice(-8)}</span>}
                              {vg.conversations.length > 1 && (
                                <span className="stack">{vg.conversations.length} bookings</span>
                              )}
                              {vg.totalUnread > 0 && <span className="n tnum" style={{ marginLeft: 'auto' }}>{vg.totalUnread}</span>}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ══════ 3. THREAD ══════ */}
        <section className={`room${railAway ? '' : ' away'}`}>
          {chatMode === 'agent' ? (
            !selectedAgentConvId ? (
              <div className="hollow">
                <div className="in fade-in-up">
                  <span className="g i"><Building2 className="w-7 h-7" /></span>
                  <h2>Select an agent conversation</h2>
                  <p>Choose a travel agent to view messages</p>
                </div>
              </div>
            ) : (
              <>
                <div className="thead">
                  <button onClick={() => { setSelectedAgentConvId(null); setShowMobileSidebar(true); }} className="icon backb" aria-label="Back">
                    <ArrowLeft className="w-[17px] h-[17px]" />
                  </button>
                  <span className="face" style={tint('#4338CA')}>
                    {activeAgentConv?.agency?.logo
                      ? <img src={activeAgentConv.agency.logo} alt="" />
                      : (activeAgentConv?.agency?.agencyName || 'Travel Agent').charAt(0).toUpperCase()}
                  </span>
                  <div className="ttl">
                    <h2>{activeAgentConv?.agency?.agencyName || 'Travel Agent'}</h2>
                    <div className="under">
                      <span className="tone" style={tint('#4338CA')}>Travel agent</span>
                      <p>{activeAgentConv?.subject || 'Travel enquiry'}</p>
                    </div>
                  </div>
                  {activeAgentConv?.agency?.phone && (
                    <a href={`tel:${activeAgentConv.agency.phone}`} className="act">
                      <Phone className="w-3.5 h-3.5" /><span className="lb">Call</span>
                    </a>
                  )}
                  <button onClick={() => setShowCtx(v => !v)} className="icon infob" aria-label="Details">
                    <Zap className="w-[17px] h-[17px]" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <TravelAgentChat
                    key={selectedAgentConvId}
                    conversationId={selectedAgentConvId}
                    senderType="customer"
                    senderName={customer?.name || 'Customer'}
                    customerPhone={customer?.phone || ''}
                    hideHeader
                    heightClass="flex-1 min-h-0"
                    className="h-full"
                  />
                </div>
              </>
            )
          ) : chatMode === 'driver' && !selectedDriverConvId ? (
            <div className="hollow">
              <div className="in fade-in-up">
                <span className="g t"><Car className="w-7 h-7" /></span>
                <h2>Select a driver conversation</h2>
                <p>Choose a driver to view messages</p>
              </div>
            </div>
          ) : chatMode === 'driver' && selectedDriverConvId ? (
            /* ── Driver chat area ── */
            <>
              <div className="thead">
                <button onClick={() => { setSelectedDriverConvId(null); setShowMobileSidebar(true); }} className="icon backb" aria-label="Back">
                  <ArrowLeft className="w-[17px] h-[17px]" />
                </button>
                <span className="face" style={tint('#0B7C74')}>
                  {(activeDriverConv?.driver?.name || 'Driver').charAt(0).toUpperCase()}
                </span>
                <div className="ttl">
                  <h2>{activeDriverConv?.driver?.name || 'Driver'}</h2>
                  <div className="under">
                    <span className="tone" style={tint('#0B7C74')}>Driver</span>
                    {activeDriverConv?.bookingNumber
                      ? <p>Booking <b>#{activeDriverConv.bookingNumber}</b></p>
                      : <p>Chauffeur booking</p>}
                  </div>
                </div>
                {activeDriverConv?.bookingNumber && (
                  <Link href={activeDriverConv?.bookingType === 'car' ? `/customer/car-bookings/${activeDriverConv.bookingNumber}` : `/customer/car-rental-bookings/${activeDriverConv.bookingNumber}`}
                    className="act key">
                    <Eye className="w-3.5 h-3.5" /><span className="lb">View</span>
                  </Link>
                )}
                {activeDriverConv?.driver?.phone && (
                  <a href={`tel:${activeDriverConv.driver.phone}`} className="act">
                    <Phone className="w-3.5 h-3.5" /><span className="lb">Call</span>
                  </a>
                )}
                <button onClick={() => setShowCtx(v => !v)} className="icon infob" aria-label="Details">
                  <Zap className="w-[17px] h-[17px]" />
                </button>
              </div>

              <div className="flow">
                {isLoadingDriverMsgs ? (
                  <div className="spin" />
                ) : driverMessages.length === 0 ? (
                  <div className="midblank fade-in-up">
                    <span className="g"><Send className="w-6 h-6" /></span>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {driverMessages.map((msg: any, idx: number) => {
                      const isCustomer = msg.senderType === 'customer';
                      const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(driverMessages[idx - 1].createdAt).toDateString();
                      const isSameSender = idx > 0 && driverMessages[idx - 1].senderType === msg.senderType && !showDate;
                      return (
                        <div key={msg.id} className="msg-in">
                          {showDate && (
                            <div className="stamp">
                              <span>{new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                          <div className={`msg${isCustomer ? ' mine' : ''}${isSameSender ? ' run' : ''}`}>
                            {!isCustomer && (
                              isSameSender
                                ? <span className="who hole" />
                                : <span className="who" style={tint('#0B7C74')}><Car className="w-3.5 h-3.5" /></span>
                            )}
                            <div className="wrap">
                              <div className={`say${isCustomer ? ' teal' : ''}`}>
                                <p>{msg.content}</p>
                              </div>
                              <div className="tail">
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                {isCustomer && <span className="tk"><Check className="w-3 h-3" /></span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="desk">
                <span className="glow" />
                <form onSubmit={e => { e.preventDefault(); sendDriverMessage(); }} className="pen">
                  <div className="slate">
                    <textarea value={driverNewMsg} onChange={e => setDriverNewMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDriverMessage(); } }}
                      placeholder="Type a message..." rows={1} style={{ maxHeight: '110px' }} />
                  </div>
                  <button type="submit" disabled={!driverNewMsg.trim() || isDriverSending} className="fly teal">
                    {isDriverSending ? <span className="dotspin" /> : <Send className="w-[17px] h-[17px]" />}
                  </button>
                </form>
              </div>
            </>
          ) : !selectedVendorGroup ? (
            <div className="hollow">
              <div className="in fade-in-up">
                <span className="g"><MessageCircle className="w-7 h-7" /></span>
                <h2>Select a conversation</h2>
                <p>Choose a vendor to start chatting</p>
              </div>
            </div>
          ) : (
            /* ── Vendor chat area ── */
            <>
              <div className="thead">
                <button onClick={() => { setSelectedVendorGroup(null); setActiveConvId(null); setShowMobileSidebar(true); }}
                  className="icon backb" aria-label="Back">
                  <ArrowLeft className="w-[17px] h-[17px]" />
                </button>

                <span className="face" style={tint(headSc)}>
                  {selectedVendorGroup.logo
                    ? <img src={selectedVendorGroup.logo} alt="" />
                    : <Building2 className="w-[17px] h-[17px]" />}
                </span>

                <div className="ttl">
                  <h2>{selectedVendorGroup.vendorName}</h2>
                  <div className="under">
                    {selectedConversation && (
                      <span className="tone" style={tint(headSc)}>
                        {TYPE_LABELS[selectedConversation.bookingType] || selectedConversation.bookingType}
                      </span>
                    )}
                    {selectedConversation?.bookingId && (
                      <p>Booking <b>#{(selectedConversation.bookingNumber || selectedConversation.bookingId).slice(-8)}</b></p>
                    )}
                  </div>
                </div>

                {selectedVendorGroup.phone && (
                  <a href={`tel:${selectedVendorGroup.phone}`} className="act">
                    <Phone className="w-3.5 h-3.5" /><span className="lb">Call</span>
                  </a>
                )}
                <button onClick={() => setShowCtx(v => !v)} className="icon infob" aria-label="Details">
                  <Zap className="w-[17px] h-[17px]" />
                </button>
              </div>

              {/* ── BOOKING SWITCHER ── */}
              {selectedVendorGroup.conversations.length > 1 && (() => {
                const convs = selectedVendorGroup.conversations;
                const useDropdown = convs.length > 3;

                return (
                  <div className="docks">
                    <p className="eyebrow" style={{ flex: 'none' }}>Booking</p>

                    {useDropdown ? (
                      <div className="sw">
                        <select value={activeConvId || ''} onChange={e => setActiveConvId(e.target.value)}>
                          {convs.map(conv => (
                            <option key={conv.id} value={conv.id}>
                              {TYPE_LABELS[conv.bookingType] || conv.bookingType}
                              {conv.bookingNumber ? ` #${conv.bookingNumber.slice(-8)}` : conv.bookingId ? ` #${conv.bookingId.slice(-6)}` : ''}
                              {conv.unreadCount > 0 ? ` (${conv.unreadCount})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 cv" />
                      </div>
                    ) : (
                      convs.map(conv => {
                        const isActive = activeConvId === conv.id;
                        const color = SERVICE_COLORS[conv.bookingType] || '#6B7280';
                        return (
                          <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                            style={tint(color)}
                            className={`dock${isActive ? ' on' : ''}`}>
                            {TYPE_LABELS[conv.bookingType] || conv.bookingType}
                            {(conv.bookingNumber || conv.bookingId) && (
                              <span className="no">#{(conv.bookingNumber || conv.bookingId || '').slice(-6)}</span>
                            )}
                            {conv.unreadCount > 0 && !isActive && (
                              <span className="n tnum">{conv.unreadCount}</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* ── MESSAGES ── */}
              <div className="flow">
                {isLoadingMessages ? (
                  <div className="spin" />
                ) : messages.length === 0 ? (
                  <div className="midblank fade-in-up">
                    <span className="g"><Send className="w-6 h-6" /></span>
                    <p>Send a message to start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isCustomer = msg.senderType === 'customer';
                      const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
                      const isSameSender = idx > 0 && messages[idx - 1].senderType === msg.senderType && !showDate;
                      const isLastInGroup = idx === messages.length - 1 || messages[idx + 1]?.senderType !== msg.senderType;

                      return (
                        <div key={msg.id} className="msg-in">
                          {showDate && (
                            <div className="stamp">
                              <span>{new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                          )}
                          <div className={`msg${isCustomer ? ' mine' : ''}${isSameSender ? ' run' : ''}`}>
                            {!isCustomer && (
                              isSameSender
                                ? <span className="who hole" />
                                : (
                                  <span className="who" style={tint(headSc)}>
                                    {selectedVendorGroup.logo
                                      ? <img src={selectedVendorGroup.logo} alt="" />
                                      : <Building2 className="w-3.5 h-3.5" />}
                                  </span>
                                )
                            )}

                            <div className="wrap">
                              <div className={`say${msg.messageType === 'IMAGE' ? ' pic' : ''}${!isLastInGroup ? ' run' : ''}`}>
                                {msg.messageType === 'IMAGE' && msg.attachmentUrl && (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="shotwrap">
                                    <img src={msg.attachmentUrl} alt="" />
                                    <span className="grab"><Download className="w-5 h-5" /></span>
                                  </a>
                                )}

                                {msg.messageType === 'FILE' && msg.attachmentUrl && (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="doc">
                                    <span className="ext"><FileIcon className="w-3.5 h-3.5" /></span>
                                    <span className="fn">{msg.attachmentName || 'File'}</span>
                                    <span className="pull"><Download className="w-3.5 h-3.5" /></span>
                                  </a>
                                )}

                                {msg.content && msg.messageType !== 'IMAGE'
                                  && !(msg.messageType === 'FILE' && msg.content === msg.attachmentName) && (
                                  <p style={msg.messageType === 'FILE' ? { marginTop: '7px' } : undefined}>{msg.content}</p>
                                )}
                              </div>

                              <div className="tail">
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                {isCustomer && (
                                  msg.status === 'READ'
                                    ? <span className="tk seen"><CheckCheck className="w-3 h-3" /></span>
                                    : msg.status === 'DELIVERED'
                                      ? <span className="tk"><CheckCheck className="w-3 h-3" /></span>
                                      : <span className="tk"><Check className="w-3 h-3" /></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* ── INPUT BAR ── */}
              <div className="desk">
                <span className="glow" />

                {showEmojiPicker && (
                  <div ref={emojiRef} className="emojipad">
                    <EmojiPicker onEmojiClick={(d: any) => { setNewMessage(p => p + d.emoji); inputRef.current?.focus(); }} width={320} height={380} searchPlaceHolder="Search emoji..." previewConfig={{ showPreview: false }} />
                  </div>
                )}

                {isUploading && (
                  <div className="rising">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />

                <form onSubmit={e => { e.preventDefault(); sendMessage(newMessage); }} className="pen">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="orb" title="Attach">
                    <Paperclip className="w-[19px] h-[19px]" />
                  </button>

                  <div className="slate">
                    <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(newMessage); } }}
                      placeholder="Type a message..." rows={1} style={{ maxHeight: '110px' }} />
                    <button type="button" onClick={() => setShowEmojiPicker(p => !p)}
                      className={`orb${showEmojiPicker ? ' lit' : ''}`} title="Emoji">
                      <Smile className="w-[19px] h-[19px]" />
                    </button>
                  </div>

                  <button type="submit" disabled={(!newMessage.trim() && !isUploading) || isSending} className="fly">
                    {isSending ? <span className="dotspin" /> : <Send className="w-[17px] h-[17px]" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        {/* ══════ 4. DETAILS ══════ */}
        <aside className={`ctx${showCtx ? ' open' : ''}`}>
          <div className="ctop">
            <p className="eyebrow">Details</p>
            <button className="icon shut" onClick={() => setShowCtx(false)} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="cscroll">
            {chatMode === 'vendor' && selectedVendorGroup ? (
              <>
                <div className="plate cardv">
                  <span className="face" style={tint(headSc)}>
                    {selectedVendorGroup.logo
                      ? <img src={selectedVendorGroup.logo} alt="" />
                      : <Building2 className="w-[22px] h-[22px]" />}
                  </span>
                  <h3>{selectedVendorGroup.vendorName}</h3>
                  <div className="pair">
                    {selectedConversation && (
                      <span className="tone" style={tint(headSc)}>
                        {TYPE_LABELS[selectedConversation.bookingType] || selectedConversation.bookingType}
                      </span>
                    )}
                    {selectedConversation?.status && <span className="tone live">{selectedConversation.status}</span>}
                  </div>
                  <div className="rows">
                    {selectedConversation?.bookingId && (
                      <div className="kv">
                        <span className="k eyebrow">Booking</span>
                        <span className="v mono">#{(selectedConversation.bookingNumber || selectedConversation.bookingId).slice(-8)}</span>
                      </div>
                    )}
                    {selectedConversation?.subject && (
                      <div className="kv"><span className="k eyebrow">Subject</span><span className="v">{selectedConversation.subject}</span></div>
                    )}
                    <div className="kv">
                      <span className="k eyebrow">Chats</span>
                      <span className="v tnum">{selectedVendorGroup.conversations.length}</span>
                    </div>
                    {selectedVendorGroup.phone && (
                      <div className="kv"><span className="k eyebrow">Phone</span><span className="v mono">{selectedVendorGroup.phone}</span></div>
                    )}
                    {selectedVendorGroup.lastMessageAt && (
                      <div className="kv"><span className="k eyebrow">Last seen</span><span className="v">{formatTime(selectedVendorGroup.lastMessageAt)}</span></div>
                    )}
                  </div>
                  {selectedVendorGroup.phone && (
                    <div className="pairbtn one">
                      <a href={`tel:${selectedVendorGroup.phone}`} className="act key">
                        <Phone className="w-3.5 h-3.5" />Call vendor
                      </a>
                    </div>
                  )}
                </div>

                <div className="plate">
                  <div className="phead"><p className="eyebrow">Bookings with this vendor</p><span className="ln" /></div>
                  {selectedVendorGroup.conversations.map(conv => {
                    const c = SERVICE_COLORS[conv.bookingType] || '#6B7280';
                    return (
                      <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                        style={tint(c)}
                        className={`item${activeConvId === conv.id ? ' on' : ''}`}>
                        <span className="sq"><Building2 className="w-[15px] h-[15px]" /></span>
                        <span className="it">
                          <b>{TYPE_LABELS[conv.bookingType] || conv.bookingType}</b>
                          <span>{conv.bookingNumber ? `#${conv.bookingNumber}` : conv.bookingId ? `#${conv.bookingId.slice(-8)}` : 'No booking ref'}</span>
                        </span>
                        {conv.unreadCount > 0 && <span className="n tnum">{conv.unreadCount}</span>}
                      </button>
                    );
                  })}
                </div>

                {(sharedImages.length > 0 || sharedFiles.length > 0) && (
                  <div className="plate">
                    <div className="phead"><p className="eyebrow">Shared in this chat</p><span className="ln" /></div>
                    {sharedImages.length > 0 && (
                      <div className="tiles">
                        {sharedImages.slice(0, 6).map(m => (
                          <a key={m.id} className="tile" href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                            <img src={m.attachmentUrl} alt="" />
                          </a>
                        ))}
                      </div>
                    )}
                    {sharedFiles.length > 0 && (
                      <div style={{ marginTop: sharedImages.length > 0 ? '11px' : 0 }}>
                        {sharedFiles.map(m => (
                          <div key={m.id} className="filerow">
                            <span className="ext"><FileIcon className="w-3.5 h-3.5" /></span>
                            <span className="it">
                              <b>{m.attachmentName || 'File'}</b>
                              <span>{formatTime(m.createdAt)}</span>
                            </span>
                            <a className="icon" href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" aria-label="Download">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : chatMode === 'driver' && activeDriverConv ? (
              <div className="plate cardv">
                <span className="face" style={tint('#0B7C74')}>
                  {(activeDriverConv?.driver?.name || 'Driver').charAt(0).toUpperCase()}
                </span>
                <h3>{activeDriverConv?.driver?.name || 'Driver'}</h3>
                <div className="pair">
                  <span className="tone" style={tint('#0B7C74')}>Driver</span>
                </div>
                <div className="rows">
                  <div className="kv">
                    <span className="k eyebrow">Booking</span>
                    <span className="v mono">{activeDriverConv?.bookingNumber ? `#${activeDriverConv.bookingNumber}` : 'Chauffeur booking'}</span>
                  </div>
                  {activeDriverConv?.driver?.phone && (
                    <div className="kv"><span className="k eyebrow">Phone</span><span className="v mono">{activeDriverConv.driver.phone}</span></div>
                  )}
                  {activeDriverConv?.lastMessageAt && (
                    <div className="kv"><span className="k eyebrow">Last seen</span><span className="v">{formatTime(activeDriverConv.lastMessageAt)}</span></div>
                  )}
                </div>
                <div className={`pairbtn${activeDriverConv?.bookingNumber && activeDriverConv?.driver?.phone ? '' : ' one'}`}>
                  {activeDriverConv?.driver?.phone && (
                    <a href={`tel:${activeDriverConv.driver.phone}`} className="act">
                      <Phone className="w-3.5 h-3.5" />Call
                    </a>
                  )}
                  {activeDriverConv?.bookingNumber && (
                    <Link href={activeDriverConv?.bookingType === 'car' ? `/customer/car-bookings/${activeDriverConv.bookingNumber}` : `/customer/car-rental-bookings/${activeDriverConv.bookingNumber}`}
                      className="act key">
                      <Eye className="w-3.5 h-3.5" />View
                    </Link>
                  )}
                </div>
              </div>
            ) : chatMode === 'agent' && activeAgentConv ? (
              <div className="plate cardv">
                <span className="face" style={tint('#4338CA')}>
                  {activeAgentConv?.agency?.logo
                    ? <img src={activeAgentConv.agency.logo} alt="" />
                    : (activeAgentConv?.agency?.agencyName || 'Travel Agent').charAt(0).toUpperCase()}
                </span>
                <h3>{activeAgentConv?.agency?.agencyName || 'Travel Agent'}</h3>
                <div className="pair">
                  <span className="tone" style={tint('#4338CA')}>Travel agent</span>
                  {activeAgentConv?.status && <span className="tone live">{activeAgentConv.status}</span>}
                </div>
                <div className="rows">
                  {activeAgentConv?.subject && (
                    <div className="kv"><span className="k eyebrow">Enquiry</span><span className="v">{activeAgentConv.subject}</span></div>
                  )}
                  {activeAgentConv?.agency?.phone && (
                    <div className="kv"><span className="k eyebrow">Phone</span><span className="v mono">{activeAgentConv.agency.phone}</span></div>
                  )}
                  {activeAgentConv?.createdAt && (
                    <div className="kv"><span className="k eyebrow">Started</span><span className="v">{new Date(activeAgentConv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                  )}
                  {activeAgentConv?.lastMessageAt && (
                    <div className="kv"><span className="k eyebrow">Last seen</span><span className="v">{formatTime(activeAgentConv.lastMessageAt)}</span></div>
                  )}
                </div>
                {activeAgentConv?.agency?.phone && (
                  <div className="pairbtn one">
                    <a href={`tel:${activeAgentConv.agency.phone}`} className="act key">
                      <Phone className="w-3.5 h-3.5" />Call agent
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="void">
                <span className="g"><MessageCircle className="w-5 h-5" /></span>
                <b>Nothing selected</b>
                <span>Open a conversation to see its details</span>
              </div>
            )}
          </div>
        </aside>

        <div className={`veil${showCtx ? ' open' : ''}`} onClick={() => setShowCtx(false)} />
      </div>
    </div>
    </>
  );
}
