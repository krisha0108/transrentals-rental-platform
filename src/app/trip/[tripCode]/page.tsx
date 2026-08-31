// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Calendar, Clock, Phone, Car, User, Shield,
  CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, Mail, Headphones,
} from 'lucide-react';
import { quoteDisplay } from '@/lib/quote-font';

/* Is page ka apna stylesheet. Har rule `.tpx` ke andar scoped hai, isliye yahan
   ke chhote class naam (.card, .pass, .chip…) baaki app tak nahi pahunchte. */
const TPX_CSS = `
.tpx{
  --paper:#F4F8F6; --card:#FFFFFF; --card-2:#F8FBF9; --sunk:#F2F7F3;
  --rule:#DFE8E2; --rule-2:#CBD9D1;
  --ink:#0A140F; --ink-2:#3F4C45; --muted:#6F7C74; --faint:#9DAAA2; --ghost:#C2CDC6;

  --em-1:#045030; --em-2:#09B368; --em-deep:#04321F; --em-mid:#056B3E;
  --mint:#E9F7F0; --mint-line:#C3E5D4;

  --amber:#B4700F; --amber-deep:#8A5409; --amber-bg:#FDF6E7; --amber-line:#EFE0BE;
  --red:#BE123C; --red-deep:#9F0F32; --red-bg:#FDEBEF; --red-line:#F6C9D4;
  --blue:#1D4ED8; --blue-bg:#E8F0FE; --blue-line:#C4D6F6;
  --teal:#0B7C74; --teal-deep:#0A4F4A; --teal-bg:#E4F4F2; --teal-line:#BBE2DE;
  --slate:#4B5563; --slate-bg:#F1F3F5; --slate-line:#DDE1E6;
  --plate:#FBD34D; --plate-line:#D9A21A; --plate-ink:#5A4106;

  --serif:var(--quote-display),Georgia,"Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  --rest:0 1px 3px rgba(4,50,31,.07), 0 10px 24px -18px rgba(4,50,31,.2);
}
.tpx{color:var(--ink); font-size:14px; line-height:1.55; -webkit-font-smoothing:antialiased;
  background:var(--paper); min-height:100vh}
.tpx *{box-sizing:border-box}
.tpx a{color:inherit; text-decoration:none}
.tpx :focus-visible{outline:2px solid var(--em-2); outline-offset:3px; border-radius:8px}
.tpx [hidden]{display:none !important}
.tpx .k{font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--faint)}
.tpx .num{font-variant-numeric:tabular-nums}
.tpx .page{max-width:560px; margin:0 auto; padding:20px 16px 40px}
@media (min-width:600px){.tpx .page{padding:32px 20px 56px} }.tpx .grid{display:block}
/* Chhoti screen par dono column ke wrapper hat jaate hain, saare card ek hi
   kataar me — aur help sabse aakhir me, jahan uski jagah hai. */
@media (max-width:939px){
  .tpx .grid{display:flex; flex-direction:column}
  .tpx .col{display:contents}
  .tpx .helpCard{order:2}
}
@media (min-width:940px){.tpx .page{max-width:1060px}
.tpx .grid{display:grid; grid-template-columns:376px minmax(0,1fr); gap:20px; align-items:start}
.tpx .col.a{position:sticky; top:28px}
.tpx .col > :last-child{margin-bottom:0}
}.tpx .card{border-radius:20px; border:1px solid var(--rule); background:var(--card);
  box-shadow:var(--rest); overflow:hidden; margin-bottom:14px}
.tpx .pad{padding:18px}
.tpx .hd{display:flex; align-items:center; gap:10px; padding:15px 18px; border-bottom:1px solid var(--rule);
  background:var(--card-2)}
.tpx .hd b{font-family:var(--serif); font-size:20px; font-weight:600}
.tpx .hd .n2{margin-left:auto; font-size:11.5px; color:var(--faint)}
.tpx .brand{display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:18px}
.tpx .brand .m{width:26px; height:26px; border-radius:9px; display:grid; place-items:center; color:#fff;
  background:linear-gradient(140deg,var(--em-1),var(--em-2))}
.tpx .brand span{font-size:13px; font-weight:700; letter-spacing:-.01em}
.tpx .pass{position:relative; overflow:hidden; border-radius:20px; color:#fff; margin-bottom:14px;
  background:linear-gradient(122deg,#042115 0%,#06412A 48%,#067C4A 100%);
  box-shadow:0 20px 44px -26px rgba(4,50,31,.7)}
.tpx .pass > i{position:absolute; display:block; pointer-events:none}
.tpx .pass .ovgrid{inset:0; opacity:.08;
  background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
  background-size:34px 34px}
.tpx .pass .ovkey{inset:0; background-image:
  radial-gradient(520px 240px at 88% -30%,rgba(255,255,255,.22),transparent 64%),
  radial-gradient(360px 200px at 0% 130%,rgba(1,25,14,.6),transparent 64%)}
.tpx .pass .body{position:relative; z-index:2; padding:22px 20px 20px; text-align:center}
.tpx .pass .co{margin:0; font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(255,255,255,.55)}
.tpx .pass .code{margin:9px 0 0; font-family:var(--mono); font-size:26px; font-weight:800;
  letter-spacing:.02em}
.tpx .pass .stat{display:inline-flex; align-items:center; gap:9px; margin-top:14px; border-radius:999px;
  border:1.5px solid rgba(255,255,255,.4); background:rgba(255,255,255,.14); backdrop-filter:blur(4px);
  padding:7px 16px; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase}
.tpx .pass .stat i{width:8px; height:8px; flex:none; border-radius:999px; background:var(--sd,#FCD34D)}
.tpx .pass.live .stat i{animation:beat 1.5s ease-in-out infinite}
@keyframes beat{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}50%{box-shadow:0 0 0 6px rgba(74,222,128,0)}}.tpx .pass.off{background:linear-gradient(122deg,#191F1C 0%,#2C3531 46%,#414C46 100%)}
.tpx .pass.bad{background:linear-gradient(122deg,#2A0C15 0%,#4A1122 46%,#7A1B36 100%)}
.tpx .pass .tear{position:relative; z-index:2; height:1px; margin:0 -1px;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.3) 0 6px,transparent 6px 12px)}
.tpx .pass .tear::before, .tpx .pass .tear::after{content:""; position:absolute; top:-9px;
  width:18px; height:18px; border-radius:999px; background:var(--paper)}
.tpx .pass .tear::before{left:-9px}
.tpx .pass .tear::after{right:-9px}
.tpx .pass .foot{position:relative; z-index:2; display:flex; padding:0}
.tpx .pass .foot > div{flex:1; padding:13px 16px 15px; border-right:1px solid rgba(255,255,255,.14);
  min-width:0}
.tpx .pass .foot > div:last-child{border-right:none}
.tpx .pass .foot .kk{font-size:9.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
  color:rgba(255,255,255,.5)}
.tpx .pass .foot .vv{margin-top:5px; font-size:13px; font-weight:600; overflow-wrap:anywhere}
.tpx .otp{border-color:var(--teal-line); background:linear-gradient(170deg,var(--teal-bg),var(--card) 62%)}
.tpx .otp .top2{display:flex; align-items:center; gap:11px; padding:16px 18px 0}
.tpx .otp .top2 .ic{width:36px; height:36px; flex:none; border-radius:12px; display:grid; place-items:center;
  background:var(--card); border:1px solid var(--teal-line); color:var(--teal)}
.tpx .otp h3{margin:0; font-family:var(--serif); font-size:21px; font-weight:600; color:var(--teal-deep)}
.tpx .otp .sub{margin:3px 0 0; font-size:12.5px; color:var(--teal)}
.tpx .otp .box{margin:15px 18px 0; border-radius:15px; border:1px dashed var(--teal-line);
  background:var(--card); padding:20px 12px; text-align:center}
.tpx .otp .digits{margin:0; font-family:var(--mono); font-size:38px; font-weight:800; letter-spacing:.34em;
  line-height:1; color:var(--teal-deep); text-indent:.34em}
.tpx .otp .note{margin:0; padding:13px 18px 17px; font-size:11.5px; text-align:center; color:var(--muted)}
.tpx .shot{position:relative; background:linear-gradient(150deg,#12241C,#1E3A2C 55%,#0E1B15);
  height:230px; display:grid; place-items:center; overflow:hidden}
.tpx .shot img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover}
.tpx .shot .art{opacity:.35; color:#9FE8C4}
.tpx .tag{position:absolute; z-index:2; top:12px; border-radius:999px; padding:4px 11px; font-size:11px;
  font-weight:600; color:#fff; background:rgba(0,0,0,.5); backdrop-filter:blur(5px)}
.tpx .tag.l{left:12px}
.tpx .tag.r{right:12px; font-variant-numeric:tabular-nums}
.tpx .nav{position:absolute; z-index:2; top:50%; transform:translateY(-50%); width:34px; height:34px;
  border-radius:999px; display:grid; place-items:center; color:var(--ink-2);
  background:rgba(255,255,255,.86); backdrop-filter:blur(4px); box-shadow:0 4px 14px rgba(0,0,0,.25);
  transition:background .18s}
.tpx .nav:hover{background:#fff}
.tpx .nav.p{left:10px}
.tpx .nav.n{right:10px}
.tpx .thumbs{display:flex; gap:7px; padding:10px 12px; background:var(--card-2);
  border-bottom:1px solid var(--rule); overflow-x:auto}
.tpx .thumbs button{flex:none; width:58px; height:42px; border-radius:10px; overflow:hidden;
  border:2px solid transparent; opacity:.55; transition:opacity .18s, border-color .18s}
.tpx .thumbs button img{width:100%; height:100%; object-fit:cover; display:block}
.tpx .thumbs button:hover{opacity:.85}
.tpx .thumbs button.on{opacity:1; border-color:var(--em-2)}
.tpx .vh{display:flex; align-items:flex-start; gap:12px}
.tpx .vh h2{margin:0; font-family:var(--serif); font-size:24px; font-weight:600; line-height:1.1}
.tpx .vh .brandchip{margin-left:auto; flex:none; border-radius:999px; padding:4px 11px; font-size:11px;
  font-weight:700; border:1px solid var(--mint-line); background:var(--mint); color:var(--em-mid)}
.tpx .chips{display:flex; flex-wrap:wrap; gap:7px; margin-top:10px}
.tpx .chip{display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:4px 11px;
  font-size:12px; border:1px solid var(--rule-2); background:var(--card); color:var(--ink-2)}
.tpx .chip.m{border-color:var(--mint-line); background:var(--mint); color:var(--em-mid)}
.tpx .chip.b{border-color:var(--blue-line); background:var(--blue-bg); color:var(--blue)}
.tpx .chip.t{border-color:var(--teal-line); background:var(--teal-bg); color:var(--teal)}
.tpx .plate{display:inline-flex; align-items:center; border-radius:6px; padding:4px 10px;
  font-family:var(--mono); font-size:12.5px; font-weight:700; letter-spacing:.09em;
  background:var(--plate); border:1px solid var(--plate-line); color:var(--plate-ink)}
.tpx .specs{display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; padding-top:13px;
  border-top:1px solid var(--rule)}
.tpx .drv{display:flex; align-items:center; gap:14px; padding:16px 18px}
.tpx .drv .pic{width:56px; height:56px; flex:none; border-radius:999px; display:grid; place-items:center;
  color:#fff; font-size:20px; font-weight:700; object-fit:cover;
  background:linear-gradient(135deg,#0d9488,#059669);
  box-shadow:0 0 0 3px var(--card), 0 0 0 5px var(--teal-line)}
.tpx .drv .nm{margin:0; font-size:17px; font-weight:700; line-height:1.2}
.tpx .drv .ph{margin:4px 0 0; font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums}
.tpx .call{display:flex; align-items:center; justify-content:center; gap:9px; margin:0 18px 18px;
  border-radius:14px; padding:14px; font-size:14.5px; font-weight:700; color:#fff;
  background:linear-gradient(180deg,#0EA47E,#056B3E);
  box-shadow:0 16px 30px -18px rgba(4,50,31,.9); transition:transform .18s}
.tpx .call:hover{transform:translateY(-2px)}
.tpx .leg{display:flex; gap:13px}
.tpx .leg .rail{display:flex; flex-direction:column; align-items:center; flex:none; width:22px}
.tpx .leg .dot{width:13px; height:13px; flex:none; border-radius:999px; border:3px solid var(--em-2);
  background:var(--card)}
.tpx .leg .dot.b{border-color:var(--red); background:var(--red)}
.tpx .leg .line{flex:1; width:2px; min-height:26px; margin:4px 0;
  background:repeating-linear-gradient(180deg,var(--rule-2) 0 4px,transparent 4px 8px)}
.tpx .leg .txt{padding-bottom:16px; min-width:0}
.tpx .leg:last-child .txt{padding-bottom:0}
.tpx .leg .plc{margin:1px 0 0; font-size:15px; font-weight:600; color:var(--ink-2); overflow-wrap:anywhere}
.tpx .when{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:16px;
  border:1px solid var(--rule); border-radius:14px; overflow:hidden}
.tpx .when > div{padding:11px 14px; border-right:1px solid var(--rule); background:var(--card-2)}
.tpx .when > div:last-child{border-right:none}
.tpx .when .v2{margin:5px 0 0; font-size:14px; font-weight:600; color:var(--ink-2);
  font-variant-numeric:tabular-nums}
.tpx .tl{display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px dashed var(--rule)}
.tpx .tl:last-child{border-bottom:none}
.tpx .tl .d2{width:11px; height:11px; flex:none; border-radius:999px}
.tpx .tl b{font-size:13.5px; font-weight:600; color:var(--ink-2)}
.tpx .tl time{margin-left:auto; font-family:var(--mono); font-size:12.5px; color:var(--muted);
  font-variant-numeric:tabular-nums}
.tpx .done{border-color:var(--mint-line);
  background:linear-gradient(165deg,var(--mint),var(--card) 70%); text-align:center; padding:26px 20px}
.tpx .done .ic{width:50px; height:50px; margin:0 auto 12px; border-radius:17px; display:grid;
  place-items:center; background:var(--card); border:1px solid var(--mint-line); color:var(--em-mid)}
.tpx .done h3{margin:0; font-family:var(--serif); font-size:25px; font-weight:600; color:var(--em-deep)}
.tpx .done p{margin:6px 0 0; font-size:13px; color:var(--em-mid)}
.tpx .help{display:flex; align-items:center; gap:12px; padding:15px 18px;
  transition:background .18s}
.tpx .help:hover{background:var(--card-2)}
.tpx .help .ic{width:38px; height:38px; flex:none; border-radius:13px; display:grid; place-items:center;
  background:var(--teal-bg); border:1px solid var(--teal-line); color:var(--teal)}
.tpx .help b{display:block; font-size:13.5px; font-weight:600}
.tpx .help span{display:block; margin-top:2px; font-size:12.5px; color:var(--muted)}
.tpx .help .go{margin-left:auto; color:var(--ghost)}
.tpx .help:hover .go{color:var(--em-2)}
.tpx .foot2{margin:22px 0 0; text-align:center; font-size:11.5px; color:var(--faint)}
.tpx .gone{text-align:center; padding:48px 24px}
.tpx .gone .ic{width:60px; height:60px; margin:0 auto 16px; border-radius:20px; display:grid;
  place-items:center; background:var(--red-bg); border:1px solid var(--red-line); color:var(--red)}
.tpx .gone h1{margin:0; font-family:var(--serif); font-size:27px; font-weight:600}
.tpx .gone p{margin:8px 0 0; font-size:13.5px; color:var(--muted)}
.tpx [hidden]{display:none !important}

@media (prefers-reduced-motion:reduce){.tpx *{transition:none !important; animation:none !important} }

/* ── React markup ke liye chhote additions ─────────────────────────────── */
.tpx .thumbs button img{width:100%; height:100%; object-fit:cover; display:block}
.tpx .drv img.pic{object-fit:cover}
.tpx .spin{display:grid; place-items:center; min-height:100vh}
`;


const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Waiting for Driver', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  DRIVER_ARRIVED: { label: 'Driver Arrived', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  STARTED: { label: 'Trip in Progress', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  COMPLETED: { label: 'Trip Completed', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  CANCELLED: { label: 'Trip Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  VENDOR_CANCELLED: { label: 'Cancelled by Vendor', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly',
};

const IMAGE_LABELS: Record<string, string> = {
  front: 'Front', back: 'Back', leftSide: 'Left Side', rightSide: 'Right Side',
  inside: 'Interior', interior: 'Interior', left: 'Left', right: 'Right',
};

/* Pass ke gehre ground par status ka rang — statusConfig ke wahi hue,
   bindu ke liye halke roop me. statusConfig jaisa tha waisa hi hai. */
const STATUS_DOT: Record<string, string> = {
  PENDING: '#FCD34D', DRIVER_ARRIVED: '#93C5FD', STARTED: '#4ADE80',
  COMPLETED: '#D1D5DB', CANCELLED: '#FCA5A5', VENDOR_CANCELLED: '#FCA5A5',
};

/* Pass ka mizaaj: chalti trip emerald aur dhadakti hui, poori ho chuki slate,
   radd hui rose. */
const PASS_TONE: Record<string, string> = {
  STARTED: 'live', COMPLETED: 'off', CANCELLED: 'bad', VENDOR_CANCELLED: 'bad',
};

function parseVehicleImages(images: any): { url: string; label: string }[] {
  if (!images) return [];

  // If it's a JSON string, parse it
  let parsed = images;
  if (typeof images === 'string') {
    try { parsed = JSON.parse(images); } catch { return []; }
  }

  // If it's an object with keys like front, back, etc.
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return Object.entries(parsed)
      .filter(([, url]) => url && typeof url === 'string')
      .map(([key, url]) => ({ url: url as string, label: IMAGE_LABELS[key] || key }));
  }

  // If it's an array of URLs
  if (Array.isArray(parsed)) {
    return parsed.filter(Boolean).map((url, i) => ({ url, label: `Photo ${i + 1}` }));
  }

  return [];
}

export default function TripPage() {
  const params = useParams();
  const tripCode = params.tripCode as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, 10000);
    return () => clearInterval(interval);
  }, [tripCode]);

  async function fetchTrip() {
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}`);
      const data = await res.json();
      if (data.status === 'success') { setTrip(data.trip); setError(''); }
      else { setError(data.error || 'Trip not found'); }
    } catch { setError('Failed to load trip'); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length < 4) return;
    setVerifying(true);
    setMessage('');
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (data.status === 'success') { setMessage('Trip started successfully!'); fetchTrip(); }
      else { setMessage(data.error || 'Invalid OTP'); }
    } catch { setMessage('Failed to verify OTP'); }
    finally { setVerifying(false); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className={`${quoteDisplay.variable} tpx`}>
        <style dangerouslySetInnerHTML={{ __html: TPX_CSS }} />
        <div className="spin"><Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--em-2)' }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${quoteDisplay.variable} tpx`}>
        <style dangerouslySetInnerHTML={{ __html: TPX_CSS }} />
        <div className="page">
          <div className="brand">
            <span className="m"><ChevronRight className="w-3.5 h-3.5" /></span>
            <span>TransRentals</span>
          </div>
          <section className="card gone">
            <span className="ic"><AlertCircle className="w-6 h-6" /></span>
            <h1>Trip Not Found</h1>
            <p>{error}</p>
          </section>
        </div>
      </div>
    );
  }

  const v = trip.vehicle;
  const d = trip.driver;
  const vehicleImages = parseVehicleImages(v?.images);
  const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
  const modelName = v?.vehicle_models?.name || '';
  const displayVehicleName = v?.vehicleName || `${brandName} ${modelName}`.trim() || trip.vehicleName || 'Vehicle';
  const sc = statusConfig[trip.status] || statusConfig.PENDING;

  const scrollToImage = (index: number) => {
    setCurrentImageIndex(index);
    if (scrollRef.current) {
      const children = scrollRef.current.children;
      if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return (
    <div className={`${quoteDisplay.variable} tpx`}>
      <style dangerouslySetInnerHTML={{ __html: TPX_CSS }} />

      <div className="page">

        <div className="brand">
          <span className="m"><ChevronRight className="w-3.5 h-3.5" /></span>
          <span>TransRentals</span>
        </div>

        <div className="grid">

          {/* ══ baayen: trip ki pehchaan aur driver ══ */}
          <div className="col a">

            {/* ── pass ── */}
            <section className={`pass ${PASS_TONE[trip.status] || ''}`}>
              <i className="ovgrid" /><i className="ovkey" />
              <div className="body">
                {trip.booking?.companyName && <p className="co">{trip.booking.companyName}</p>}
                <p className="code">{tripCode}</p>
                <span className="stat" style={{ ['--sd' as any]: STATUS_DOT[trip.status] || '#D1D5DB' }}>
                  {trip.status === 'COMPLETED'
                    ? <CheckCircle className="w-3.5 h-3.5" />
                    : trip.status === 'STARTED'
                      ? <i />
                      : <Clock className="w-3.5 h-3.5" />}
                  {sc.label}
                </span>
              </div>
              <div className="tear" />
              <div className="foot">
                <div>
                  <p className="kk">Vehicle</p>
                  <p className="vv">{displayVehicleName}</p>
                </div>
                {(trip.driverName || d?.name) && (
                  <div>
                    <p className="kk">Driver</p>
                    <p className="vv">{d?.name || trip.driverName}</p>
                  </div>
                )}
                <div>
                  <p className="kk">Date</p>
                  <p className="vv num">{formatDate(trip.scheduledDate)}</p>
                </div>
              </div>
            </section>

            {/* ── driver ── */}
            {(trip.driverName || d) && (
              <section className="card">
                <div className="hd">
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                  <b>Driver</b>
                </div>
                <div className="drv">
                  {d?.profilePhoto
                    ? <img src={d.profilePhoto} alt={d.name || trip.driverName} className="pic" />
                    : <span className="pic">{(d?.name || trip.driverName || '?').charAt(0).toUpperCase()}</span>}
                  <div style={{ minWidth: 0 }}>
                    <p className="nm">{d?.name || trip.driverName}</p>
                    {(trip.driverPhone || d?.phone) && (
                      <p className="ph">{trip.driverPhone || d.phone}</p>
                    )}
                  </div>
                </div>
                {(trip.driverPhone || d?.phone) && (
                  <a className="call" href={`tel:${trip.driverPhone || d.phone}`}>
                    <Phone className="w-4 h-4" />
                    Call the driver
                  </a>
                )}
              </section>
            )}

            {/* ── madad ── */}
            <section className="card helpCard">
              <div className="hd">
                <Headphones className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                <b>Need Help?</b>
              </div>
              <a className="help" href="mailto:book@transrentals.in">
                <span className="ic"><Mail className="w-4 h-4" /></span>
                <div>
                  <b>book@transrentals.in</b>
                  <span>Write to us about this trip</span>
                </div>
                <span className="go"><ChevronRight className="w-4 h-4" /></span>
              </a>
            </section>
          </div>

          {/* ══ daayen: baaki sab ══ */}
          <div className="col b">

            {/* ── OTP ── */}
            {trip.showOtp && trip.otp && (
              <section className="card otp">
                <div className="top2">
                  <span className="ic"><Shield className="w-4 h-4" /></span>
                  <div>
                    <h3>Your Trip OTP</h3>
                    <p className="sub">Share this OTP with the driver to start your trip</p>
                  </div>
                </div>
                <div className="box"><p className="digits">{trip.otp}</p></div>
                <p className="note">The driver will verify this OTP to begin the trip</p>
              </section>
            )}

            {/* ── gaadi ── */}
            <section className="card">
              {vehicleImages.length > 0 ? (
                <>
                  <div className="shot">
                    <img
                      src={vehicleImages[currentImageIndex]?.url}
                      alt={vehicleImages[currentImageIndex]?.label || displayVehicleName}
                    />
                    <span className="tag l">{vehicleImages[currentImageIndex]?.label}</span>
                    <span className="tag r">{currentImageIndex + 1} / {vehicleImages.length}</span>
                    {vehicleImages.length > 1 && (
                      <>
                        <button type="button" className="nav p" aria-label="Previous photo"
                          onClick={() => scrollToImage(currentImageIndex > 0 ? currentImageIndex - 1 : vehicleImages.length - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button type="button" className="nav n" aria-label="Next photo"
                          onClick={() => scrollToImage(currentImageIndex < vehicleImages.length - 1 ? currentImageIndex + 1 : 0)}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {vehicleImages.length > 1 && (
                    <div className="thumbs" ref={scrollRef}>
                      {vehicleImages.map((img, i) => (
                        <button key={i} type="button" onClick={() => setCurrentImageIndex(i)}
                          className={i === currentImageIndex ? 'on' : ''}>
                          <img src={img.url} alt={img.label} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="shot">
                  <span className="art"><Car width={92} height={92} strokeWidth={1} /></span>
                </div>
              )}

              <div className="pad">
                <div className="vh">
                  <div style={{ minWidth: 0 }}>
                    <h2>{displayVehicleName}</h2>
                    <div className="chips">
                      {(trip.vehicleNumber || v?.registrationNumber) && (
                        <span className="plate">{trip.vehicleNumber || v.registrationNumber}</span>
                      )}
                      {v?.color && <span className="chip">{v.color}</span>}
                      {v?.yearOfManufacture && <span className="chip">{v.yearOfManufacture}</span>}
                    </div>
                  </div>
                  {brandName && <span className="brandchip">{brandName}</span>}
                </div>

                {v && (v.seatingCapacity || v.fuelType || v.transmission) && (
                  <div className="specs">
                    {v.seatingCapacity && (
                      <span className="chip t"><User className="w-3 h-3" /> {v.seatingCapacity} Seats</span>
                    )}
                    {v.fuelType && <span className="chip m">{v.fuelType}</span>}
                    {v.transmission && <span className="chip b">{v.transmission}</span>}
                  </div>
                )}
              </div>
            </section>

            {/* ── safar ── */}
            <section className="card">
              <div className="hd">
                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                <b>Trip Details</b>
              </div>
              <div className="pad">
                <div className="leg">
                  <span className="rail">
                    <span className="dot" />
                    {trip.dropLocation && <span className="line" />}
                  </span>
                  <div className="txt">
                    <p className="k">Pickup</p>
                    <p className="plc">{trip.pickupLocation}</p>
                  </div>
                </div>

                {trip.dropLocation && (
                  <div className="leg">
                    <span className="rail"><span className="dot b" /></span>
                    <div className="txt">
                      <p className="k">Drop</p>
                      <p className="plc">{trip.dropLocation}</p>
                    </div>
                  </div>
                )}

                <div className="when">
                  <div>
                    <p className="k">Date</p>
                    <p className="v2">{formatDate(trip.scheduledDate)}</p>
                  </div>
                  <div>
                    <p className="k">Time</p>
                    <p className="v2">{formatTime(trip.scheduledTime)}</p>
                  </div>
                </div>

                <div className="chips" style={{ marginTop: 14 }}>
                  <span className="chip m" style={{ textTransform: 'capitalize' }}>
                    {trip.booking?.serviceType} Rental
                  </span>
                  <span className="chip">
                    {TRIP_TYPE_LABELS[trip.booking?.tripType] || trip.booking?.tripType}
                  </span>
                </div>
              </div>
            </section>

            {/* ── kahan tak pahunche ── */}
            {(trip.driverArrivedAt || trip.startedAt || trip.completedAt) && (
              <section className="card">
                <div className="hd">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                  <b>Timeline</b>
                </div>
                <div className="pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
                  {[
                    { label: 'Driver Arrived', time: trip.driverArrivedAt, color: '#1D4ED8' },
                    { label: 'Trip Started', time: trip.startedAt, color: '#09B368' },
                    { label: 'Trip Completed', time: trip.completedAt, color: '#6F7C74' },
                  ].filter(e => e.time).map((entry, i) => (
                    <div key={i} className="tl">
                      <span className="d2" style={{ background: entry.color }} />
                      <b>{entry.label}</b>
                      <time>
                        {new Date(entry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </time>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── poori ho gayi ── */}
            {trip.status === 'COMPLETED' && (
              <section className="card done">
                <span className="ic"><CheckCircle className="w-5 h-5" /></span>
                <h3>Trip Completed</h3>
                <p>Thank you for travelling with TransRentals</p>
              </section>
            )}

          </div>
        </div>

        <p className="foot2">Powered by TransRentals</p>
      </div>
    </div>
  );
}
