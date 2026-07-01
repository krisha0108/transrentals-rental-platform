'use client';

import { useEffect, useState } from 'react';
import { Coins, Zap, ExternalLink, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';

interface BackrIdentity {
  linked: boolean;
  wallet?: string;
  backrEmail?: string;
  xp?: number;
  level?: number;
}

interface BackrCardProps {
  type: 'customer' | 'vendor' | 'driver' | 'travel_agent';
  uid?: string; // required for customer (their id)
}

function shortWallet(w: string) {
  return w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

export default function BackrCard({ type, uid }: BackrCardProps) {
  const [identity, setIdentity] = useState<BackrIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = type === 'customer' && uid
      ? `/api/backr/status?type=customer&uid=${encodeURIComponent(uid)}`
      : `/api/backr/status?type=${type}`;

    fetch(url)
      .then(r => r.json())
      .then(d => setIdentity(d))
      .catch(() => setIdentity({ linked: false }))
      .finally(() => setLoading(false));
  }, [type, uid]);

  const handleConnect = () => {
    const url = type === 'customer' && uid
      ? `/api/backr/connect?type=customer&uid=${encodeURIComponent(uid)}`
      : `/api/backr/connect?type=${type}`;
    window.location.href = url;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: 'linear-gradient(135deg, #2d1b6b 0%, #4c2fb5 45%, #6547d4 100%)' }}
    >
      {/* Decorative rings */}
      <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute -bottom-10 -right-3 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute top-6 right-20 w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

      {/* Coin stack */}
      <div className="absolute top-4 right-5 flex flex-col items-center gap-[3px] select-none pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-10 h-[9px] rounded-full shadow-md"
            style={{
              background: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)',
              border: '1px solid rgba(251,191,36,0.5)',
              transform: `translateY(${i * -3}px) scaleX(${1 - i * 0.04})`,
              opacity: 1 - i * 0.15,
            }}
          />
        ))}
        <Coins className="w-5 h-5 text-yellow-300 mt-1" style={{ filter: 'drop-shadow(0 0 5px rgba(253,224,71,0.6))' }} />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Zap className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-violet-300">BACKR Ecosystem</p>
            <p className="text-[15px] font-black text-white leading-tight">Rewards Program</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-violet-300 animate-spin" />
          </div>
        ) : identity?.linked ? (
          // ── CONNECTED STATE ───────────────────────────────────────────────
          <>
            {/* Connected badge */}
            <div
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-violet-300">Connected as</p>
                <p className="text-xs font-bold text-white truncate">{identity.backrEmail ?? 'BACKR account'}</p>
              </div>
            </div>

            {/* XP + Level */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div
                className="rounded-xl p-2.5 flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white">{identity.xp?.toLocaleString('en-IN') ?? '0'} XP</p>
                  <p className="text-[9px] text-violet-300">Experience</p>
                </div>
              </div>
              <div
                className="rounded-xl p-2.5 flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Coins className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white">Level {identity.level ?? 1}</p>
                  <p className="text-[9px] text-violet-300">BACKR rank</p>
                </div>
              </div>
            </div>

            {/* Wallet address */}
            {identity.wallet && (
              <div
                className="mb-3 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-[9px] text-violet-400 mb-0.5">Wallet</p>
                <p className="text-xs font-mono text-violet-200">{shortWallet(identity.wallet)}</p>
              </div>
            )}

            <p className="text-[9px] text-violet-400 text-center">
              Powered by backrcoin.org · Earning on every booking
            </p>
          </>
        ) : (
          // ── NOT CONNECTED STATE ────────────────────────────────────────────
          <>
            {/* Earn chips */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: Coins,      label: 'Per booking', value: '+50 tokens', glow: '#fbbf24' },
                { icon: TrendingUp, label: 'XP earned',   value: '+30 XP',     glow: '#a78bfa' },
              ].map(({ icon: Icon, label, value, glow }) => (
                <div
                  key={label}
                  className="rounded-xl p-2.5 flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: glow }} />
                  <div>
                    <p className="text-[11px] font-bold text-white">{value}</p>
                    <p className="text-[9px] text-violet-300">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#1c1003', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
            >
              <ExternalLink className="w-4 h-4" /> Connect BACKR Wallet
            </button>

            <p className="text-[9px] text-violet-400 text-center mt-2.5">
              Powered by backrcoin.org · Earn on every booking
            </p>
          </>
        )}
      </div>
    </div>
  );
}
