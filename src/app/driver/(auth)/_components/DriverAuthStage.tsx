'use client';

// The frame the driver auth pages sit in — drawn entirely in code.
//
// The layout is the one that kept getting chosen: a dark panel carrying the
// pitch on the left, the form on the right. Everything in it is markup now,
// no artwork, so the headline is selectable text, the copy can be changed in
// one line, and nothing can be cropped at an awkward window size.
//
// What carries the left panel without a photograph is depth rather than
// decoration: a deep gradient, two soft brand-green glows, a fine grain, and
// a grid that recedes toward the horizon. All of it is transform or opacity,
// and all of it stops for prefers-reduced-motion.

import Image from 'next/image';
import Link from 'next/link';
import { Caveat } from 'next/font/google';
import type { ReactNode } from 'react';

const script = Caveat({ subsets: ['latin'], weight: ['600'], display: 'swap' });

export interface Feature {
  icon: ReactNode;
  title: string;
  body: string;
}

/** The hand-drawn underline that sits beneath the big word. */
function Swoosh({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 22" fill="none" className={className} aria-hidden preserveAspectRatio="none">
      <path
        d="M4 15.5C58 7.5 128 3.5 196 6.5c42 1.9 82 6.2 120 12"
        stroke="url(#da-swoosh)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="da-swoosh" x1="0" y1="0" x2="320" y2="0">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="70%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="rgba(22,163,74,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DriverAuthStage({
  children,
  kicker,
  titleTop,
  titleMain,
  blurb,
  features,
  featureLayout = 'row',
  tagline,
  wide = false,
  mirror = false,
}: {
  children: ReactNode;
  kicker?: string;
  titleTop: string;
  titleMain: string;
  blurb: ReactNode;
  features: Feature[];
  featureLayout?: 'row' | 'column';
  tagline: string[];
  /** Give the form column extra room — the sign-up form needs two columns. */
  wide?: boolean;
  /**
   * Put the form on the left and the panel on the right. Sign-up is the
   * mirror of sign-in, which is also what makes moving between the two read
   * as one screen sliding sideways rather than two unrelated pages.
   */
  mirror?: boolean;
}) {
  return (
    <div
      className={`da-stage${wide ? ' da-stage-wide' : ''}${mirror ? ' da-stage-mirror' : ''}`}
    >
      <StageStyles />

      {/* ── Left: the pitch ────────────────────────────────────────────── */}
      <div className="da-left">
        <span className="da-glow da-glow-1" aria-hidden />
        <span className="da-glow da-glow-2" aria-hidden />
        <span className="da-horizon" aria-hidden />
        <span className="da-grid" aria-hidden />
        <span className="da-grain" aria-hidden />

        <div className="da-left-inner">
          <Link href="/driver" className="da-logo" aria-label="TransRentals Driver">
            <Image src="/assets/logo-white.png" alt="TransRentals" width={3358} height={591} priority />
          </Link>

          <div className="da-copy">
            {kicker && <p className="da-kicker-pill">{kicker}</p>}
            <h1 className="da-h1">
              <span className="da-h1-top">{titleTop}</span>
              <span className="da-h1-main">
                {titleMain}
                <Swoosh className="da-h1-swoosh" />
              </span>
            </h1>
            <p className="da-blurb">{blurb}</p>
          </div>

          <div className={featureLayout === 'row' ? 'da-feats da-feats-row' : 'da-feats da-feats-col'}>
            {features.map((f) => (
              <div key={f.title} className="da-feat">
                <span className="da-feat-icon">{f.icon}</span>
                <span className="da-feat-text">
                  <span className="da-feat-title">{f.title}</span>
                  <span className="da-feat-body">{f.body}</span>
                </span>
              </div>
            ))}
          </div>

          <p className={`da-tagline ${script.className}`}>
            {tagline.map((word, i) => (
              <span key={word}>
                {i > 0 && <i className="da-tag-dot" />}
                {word}
              </span>
            ))}
            <Swoosh className="da-tag-swoosh" />
          </p>
        </div>
      </div>

      {/* ── Right: the form ────────────────────────────────────────────── */}
      <div className="da-right">
        {/* Kept in its own clipped layer: the orbs hang off the edges, and
            inside a column that may scroll they would otherwise drag a
            scrollbar along with them. */}
        <span className="da-right-bg" aria-hidden>
          <span className="da-orb da-orb-1" />
          <span className="da-orb da-orb-2" />
          <span className="da-orb da-orb-3" />
          <span className="da-dots" />
        </span>

        <Link href="/driver" className="da-logo-sm" aria-label="TransRentals Driver">
          <Image src="/assets/logo-trans.png" alt="TransRentals" width={1180} height={235} priority />
        </Link>

        <div className="da-right-inner">{children}</div>
      </div>
    </div>
  );
}

function StageStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .da-stage { display: flex; min-height: 100dvh; background: #06131F; }
      @media (min-width: 1024px) {
        .da-stage { height: 100dvh; min-height: 0; overflow: hidden; }
        /* Sign-up mirrors sign-in: form left, panel right. */
        .da-stage-mirror { flex-direction: row-reverse; }
        .da-stage-mirror .da-right-bg { transform: scaleX(-1); }
      }

      /* Moving between sign-in and sign-up: each column slides in from the
         side it is travelling from, so the two screens read as one surface
         sliding across rather than a hard cut. */
      @keyframes da-slide-in {
        from { opacity: 0; transform: translate3d(var(--da-from), 0, 0); }
        to   { opacity: 1; transform: none; }
      }
      .da-left, .da-right { animation: da-slide-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .da-left  { --da-from: -64px; }
      .da-right { --da-from: 64px; }
      .da-stage-mirror .da-left  { --da-from: 64px; }
      .da-stage-mirror .da-right { --da-from: -64px; }

      /* ── Left panel ─────────────────────────────────────────────────── */
      .da-left { display: none; }
      @media (min-width: 1024px) {
        .da-left {
          position: relative; display: flex; flex: 1 1 56%;
          overflow: hidden; color: #fff;
          background:
            radial-gradient(120% 90% at 14% 8%, #0B2E22 0%, transparent 58%),
            linear-gradient(160deg, #08213A 0%, #071A2B 42%, #05121D 100%);
        }
      }
      .da-left-inner {
        position: relative; z-index: 3;
        display: flex; flex-direction: column;
        width: 100%; padding: 40px 48px 36px;
      }
      @media (min-width: 1280px) { .da-left-inner { padding: 48px 64px 44px; } }

      .da-glow { position: absolute; z-index: 1; border-radius: 50%; filter: blur(88px); }
      .da-glow-1 {
        width: 46vw; height: 46vw; max-width: 620px; max-height: 620px;
        left: -12vw; top: -14vw; opacity: 0.55;
        background: radial-gradient(circle, rgba(22,163,74,0.9), transparent 66%);
        animation: da-float 22s ease-in-out infinite;
      }
      .da-glow-2 {
        width: 34vw; height: 34vw; max-width: 460px; max-height: 460px;
        right: -8vw; top: 26vh; opacity: 0.38;
        background: radial-gradient(circle, rgba(13,148,136,0.85), transparent 68%);
        animation: da-float 28s ease-in-out -11s infinite reverse;
      }
      @keyframes da-float {
        0%, 100% { transform: translate3d(0,0,0) scale(1); }
        50%      { transform: translate3d(3vw, 4vh, 0) scale(1.14); }
      }

      /* A line of light where the grid meets the distance. */
      .da-horizon {
        position: absolute; z-index: 1; left: -10%; right: -10%; bottom: 27%;
        height: 200px; filter: blur(30px);
        background: radial-gradient(60% 100% at 50% 100%, rgba(34,197,94,0.36), transparent 70%);
      }
      /* A plane laid back under a perspective: the lines converge by
         themselves, which is what makes it read as distance. */
      .da-grid {
        position: absolute; z-index: 1; left: -40%; right: -40%; bottom: -14%; height: 46%;
        transform: perspective(200px) rotateX(74deg);
        transform-origin: 50% 0;
        background-image:
          repeating-linear-gradient(to right,  rgba(34,197,94,0.16) 0 1px, transparent 1px 54px),
          repeating-linear-gradient(to bottom, rgba(34,197,94,0.13) 0 1px, transparent 1px 54px);
        -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.45) 52%, transparent 88%);
                mask-image: linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.45) 52%, transparent 88%);
      }
      .da-grain {
        position: absolute; z-index: 2; inset: 0; opacity: 0.16; mix-blend-mode: overlay;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .da-logo { display: block; width: 214px; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); }
      .da-logo img { width: 100%; height: auto; }
      .da-logo:hover { transform: translateY(-2px); }

      .da-copy { margin-top: auto; padding-top: 40px; }
      .da-kicker-pill {
        display: inline-block; margin-bottom: 16px;
        border: 1.5px solid rgba(34,197,94,0.45); border-radius: 999px;
        background: rgba(22,163,74,0.14); padding: 6px 15px;
        font-size: 11px; font-weight: 800; letter-spacing: 0.18em;
        text-transform: uppercase; color: #86EFAC;
      }
      .da-h1 { max-width: 15ch; }
      .da-h1-top {
        display: block; font-size: clamp(26px, 2.3vw, 36px);
        font-weight: 500; line-height: 1.16; color: rgba(255,255,255,0.92);
      }
      .da-h1-main {
        position: relative; display: inline-block; margin-top: 2px;
        font-size: clamp(52px, 5.4vw, 84px);
        font-weight: 800; line-height: 1; letter-spacing: -0.035em;
        background: linear-gradient(104deg, #FFFFFF 6%, #86EFAC 46%, #22C55E 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .da-h1-swoosh {
        position: absolute; left: 0; right: -6%; bottom: -0.3em; height: 0.22em;
        transform: scaleX(0); transform-origin: left;
        animation: da-draw 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s forwards;
      }
      @keyframes da-draw { to { transform: scaleX(1); } }

      .da-blurb {
        margin-top: 26px; max-width: 36ch;
        font-size: clamp(14.5px, 1.05vw, 16px); line-height: 1.65;
        color: rgba(255,255,255,0.66);
      }
      .da-blurb strong { color: #fff; font-weight: 700; }

      /* ── Features ───────────────────────────────────────────────────── */
      .da-feats { margin-top: auto; padding-top: 42px; }
      .da-feats-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 22px; }
      .da-feats-col { display: flex; flex-direction: column; gap: 20px; max-width: 30rem; }
      .da-feat { display: flex; gap: 14px; }
      .da-feats-row .da-feat { flex-direction: column; gap: 14px; }
      .da-feat-icon {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 50px; height: 50px; border-radius: 50%;
        background: linear-gradient(140deg, #22C55E, #15803D);
        color: #fff;
        box-shadow: 0 10px 22px -10px rgba(22,163,74,0.9);
        transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
      }
      .da-feat:hover .da-feat-icon { transform: translateY(-4px) scale(1.04); }
      .da-feat-title { display: block; font-size: 14.5px; font-weight: 700; color: #fff; }
      .da-feat-body { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.45; color: rgba(255,255,255,0.52); }

      /* ── Tagline ────────────────────────────────────────────────────── */
      .da-tagline {
        position: relative; margin-top: 40px; padding-bottom: 14px;
        display: flex; flex-wrap: wrap; align-items: center;
        font-size: clamp(24px, 2.1vw, 32px); color: #86EFAC;
      }
      .da-tag-dot {
        display: inline-block; width: 5px; height: 5px; border-radius: 50%;
        background: #22C55E; margin: 0 13px;
      }
      .da-tag-swoosh { position: absolute; left: 0; bottom: -4px; width: 62%; height: 14px; }

      /* ── Right panel ────────────────────────────────────────────────── */
      .da-right {
        position: relative; display: flex; flex: 1 1 auto;
        flex-direction: column; align-items: center;
        padding: 28px 16px; background: #F3F8F5;
      }
      @media (min-width: 640px) { .da-right { padding: 32px 28px; } }
      @media (min-width: 1024px) {
        /* The page itself never scrolls. If a very short window cannot hold
           the sign-up form, this column scrolls rather than hiding its end —
           "margin: auto" centres the card without eating its top edge the way
           "justify-content: center" does once content overflows. */
        .da-right { flex: 0 0 44%; padding: 24px 44px; overflow-y: auto; }
      }
      .da-right-inner { position: relative; z-index: 2; margin: auto; width: 100%; max-width: 536px; }
      @media (min-width: 1024px) {
        .da-stage-wide .da-left { flex: 1 1 51%; }
        .da-stage-wide .da-right { flex: 0 0 49%; }
        .da-stage-wide .da-right-inner { max-width: 620px; }
      }

      .da-right-bg { position: absolute; z-index: 1; inset: 0; overflow: hidden; pointer-events: none; }
      .da-orb { position: absolute; border-radius: 50%; }
      .da-orb-1 {
        width: 320px; height: 320px; right: -104px; top: -120px;
        background: radial-gradient(circle at 34% 34%, rgba(22,163,74,0.16), rgba(22,163,74,0.05) 60%, transparent 72%);
        border: 1.5px solid rgba(22,163,74,0.14);
      }
      .da-orb-2 {
        width: 58px; height: 58px; right: 172px; top: 52px;
        background: linear-gradient(140deg, rgba(22,163,74,0.32), rgba(22,163,74,0.10));
      }
      .da-orb-3 {
        width: 280px; height: 280px; right: -92px; bottom: -112px;
        background: radial-gradient(circle at 40% 40%, rgba(22,163,74,0.14), transparent 70%);
        border: 1.5px solid rgba(22,163,74,0.10);
      }
      .da-dots {
        position: absolute; left: 6%; bottom: 7%;
        width: 108px; height: 76px;
        background-image: radial-gradient(rgba(22,163,74,0.30) 1.6px, transparent 1.6px);
        background-size: 17px 17px;
      }
      @media (max-width: 1023px) { .da-orb-2, .da-dots { display: none; } }

      .da-logo-sm { position: relative; z-index: 2; margin-bottom: 20px; width: 178px; }
      .da-logo-sm img { width: 100%; height: auto; }
      @media (min-width: 1024px) { .da-logo-sm { display: none; } }

      /* Laptops at 720–768px tall. Nothing is dropped, the rhythm just
         tightens, so the panel still ends above the fold. */
      @media (min-width: 1024px) and (max-height: 910px) {
        .da-left-inner { padding: 28px 44px 26px; }
        .da-logo { width: 176px; }
        .da-copy { padding-top: 22px; }
        .da-blurb { margin-top: 24px; font-size: 14px; }
        .da-feats { padding-top: 26px; }
        .da-feats-col { gap: 13px; }
        .da-feats-row { gap: 16px; }
        .da-feat-icon { width: 42px; height: 42px; }
        .da-feat-icon svg { width: 19px; height: 19px; }
        .da-tagline { margin-top: 24px; }
        .da-right { padding: 18px 34px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .da-left, .da-right { animation: none; }
        .da-glow, .da-feat-icon { animation: none; transition: none; }
        .da-h1-swoosh { animation: none; transform: scaleX(1); }
        .da-logo { transition: none; }
      }
    `,
      }}
    />
  );
}
