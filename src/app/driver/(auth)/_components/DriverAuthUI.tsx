'use client';

// The white card and the controls inside it.
//
// The label sits inside the field rather than above it, which keeps a long
// form compact; it stays visible once something is typed, so nobody has to
// remember what a filled box was asking for.

import type { ReactNode } from 'react';

// The brand green, taken from the logo and the driver landing page so the
// sign-in screens sit in the same family as the rest of the site.
const BRAND = '#16A34A';

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="da-card">
      <CardStyles />
      {children}
    </div>
  );
}

export function CardHeading({
  icon,
  kicker,
  title,
  subtitle,
  stacked = false,
  compactSubtitle = false,
}: {
  icon: ReactNode;
  kicker?: string;
  title: string;
  subtitle: string;
  /** Icon above the title rather than beside it. */
  stacked?: boolean;
  /**
   * Drop the subtitle once the window is too short to hold the form without
   * scrolling. The title above it already names the screen, so this is the
   * first line the layout can spare.
   */
  compactSubtitle?: boolean;
}) {
  return (
    <div className="mb-5">
      <div className={stacked ? '' : 'flex items-center gap-4'}>
        <span className="da-avatar">{icon}</span>
        <div className={stacked ? 'mt-4' : ''}>
          {kicker && <p className="da-kicker">{kicker}</p>}
          <h1 className="da-card-title">{title}</h1>
        </div>
      </div>
      <p className={`mt-2.5 text-[14px] text-[#66718C]${compactSubtitle ? ' da-sub-compact' : ''}`}>{subtitle}</p>
    </div>
  );
}

export function Field({
  id,
  label,
  icon,
  required,
  optional,
  suffix,
  hint,
  ...input
}: {
  id: string;
  label: string;
  icon: ReactNode;
  optional?: boolean;
  suffix?: ReactNode;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="da-field">
        <span className="da-field-icon">{icon}</span>
        <span className="da-field-body">
          <label htmlFor={id} className="da-field-label">
            {label}
            {required && <b className="da-req">*</b>}
            {optional && <em className="da-opt">(Optional)</em>}
          </label>
          <input
            id={id}
            required={required}
            {...input}
            className={`da-field-input${input.type === 'date' && !input.value ? ' da-empty-date' : ''}`}
          />
        </span>
        {suffix}
      </div>
      {hint && <p className="da-hint">{hint}</p>}
    </div>
  );
}

/** Icon plus placeholder, no label — the shape the login screen uses. */
export function PlainField({
  id,
  icon,
  suffix,
  ...input
}: { id: string; icon: ReactNode; suffix?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="da-field da-field-plain">
      <span className="da-field-icon">{icon}</span>
      <input id={id} {...input} className="da-field-input da-field-input-plain" />
      {suffix}
    </div>
  );
}

export function PrimaryButton({
  children,
  loading,
  ...rest
}: { children: ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className="da-primary">
      <span className="da-primary-shine" aria-hidden />
      <span className="relative flex items-center justify-center gap-2.5">{children}</span>
    </button>
  );
}

function CardStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .da-card {
        position: relative; z-index: 1;
        border-radius: 26px; background: #fff;
        padding: 26px 22px;
        box-shadow: 0 28px 64px -26px rgba(11,22,58,0.35), 0 0 0 1px rgba(17,28,64,0.045);
      }
      @media (min-width: 640px) { .da-card { padding: 38px 38px; } }
      @media (min-width: 1024px) { .da-card { padding: 28px 36px; } }

      .da-avatar {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 52px; height: 52px; border-radius: 50%;
        background: #E7F6ED; color: #15803D;
      }
      .da-kicker {
        font-size: 11px; font-weight: 800; letter-spacing: 0.18em;
        text-transform: uppercase; color: #15803D; margin-bottom: 3px;
      }
      .da-card-title {
        font-size: 27px; font-weight: 800; letter-spacing: -0.02em; color: #14203F;
      }
      @media (min-width: 640px) { .da-card-title { font-size: 28px; } }

      /* ── Fields ─────────────────────────────────────────────────────── */
      .da-field {
        display: flex; align-items: center; gap: 12px;
        border: 1.5px solid #E3E8F4; border-radius: 14px;
        background: #FBFCFF; padding: 9px 14px; min-height: 58px;
        transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      }
      .da-field:hover { border-color: #CBD4EA; }
      .da-field:focus-within {
        border-color: ${BRAND}; background: #fff;
        box-shadow: 0 0 0 4px rgba(22,163,74,0.14);
      }
      .da-field-icon {
        display: grid; place-items: center; flex: 0 0 auto;
        width: 24px; color: #8C97B3; transition: color 0.2s ease;
      }
      .da-field:focus-within .da-field-icon { color: ${BRAND}; }
      .da-field-body { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; }
      .da-field-label {
        font-size: 12px; font-weight: 700; color: #26324F; line-height: 1.2;
      }
      .da-req { color: #E4572E; margin-left: 3px; font-weight: 700; }
      .da-opt { color: #98A2BA; font-style: normal; font-weight: 500; margin-left: 5px; font-size: 11.5px; }
      .da-field-input {
        width: 100%; margin-top: 3px; padding: 0;
        border: 0; outline: none; background: transparent;
        font-size: 14.5px; color: #14203F; font-weight: 500;
      }
      .da-field-input::placeholder { color: #A5AFC6; font-weight: 400; }
      .da-empty-date { color: #A5AFC6; font-weight: 400; }
      .da-field-input:-webkit-autofill,
      .da-field-input:-webkit-autofill:hover,
      .da-field-input:-webkit-autofill:focus {
        -webkit-text-fill-color: #14203F;
        -webkit-box-shadow: 0 0 0 1000px #FBFCFF inset;
      }
      .da-field-input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      .da-hint { margin-top: 6px; padding-left: 4px; font-size: 11.5px; color: #8C97B3; }

      .da-field-plain { min-height: 60px; padding: 0 16px; }
      .da-field-input-plain { margin-top: 0; font-size: 15px; }

      /* Two password boxes side by side leave very little room, so their
         labels wrap instead of cutting the placeholder in half. */
      .da-field-label { overflow-wrap: anywhere; }

      .da-eye {
        display: grid; place-items: center; flex: 0 0 auto;
        padding: 8px; border-radius: 9px; color: #8C97B3;
        transition: color 0.2s ease, background 0.2s ease;
      }
      .da-eye:hover { color: #14203F; background: #F1F4FB; }

      /* ── Primary button ─────────────────────────────────────────────── */
      .da-primary {
        position: relative; overflow: hidden; width: 100%; cursor: pointer;
        border: 0; border-radius: 14px;
        padding: 18px 20px;
        font-size: 16px; font-weight: 700; color: #fff;
        background: linear-gradient(100deg, ${BRAND} 0%, #22C55E 100%);
        box-shadow: 0 16px 32px -14px rgba(22,163,74,0.8);
        transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, filter 0.25s ease;
      }
      .da-primary:hover:not(:disabled) {
        transform: translateY(-2px); filter: brightness(1.06);
        box-shadow: 0 24px 42px -16px rgba(22,163,74,0.9);
      }
      .da-primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
      .da-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .da-primary:focus-visible { outline: 3px solid rgba(22,163,74,0.45); outline-offset: 3px; }
      .da-primary-shine {
        position: absolute; top: 0; bottom: 0; width: 36%; left: -45%;
        background: linear-gradient(100deg, transparent, rgba(255,255,255,0.32), transparent);
        transform: skewX(-18deg);
      }
      .da-primary:hover:not(:disabled) .da-primary-shine { animation: da-sweep 0.75s ease-out; }
      @keyframes da-sweep { to { left: 115%; } }

      /* ── Secondary ──────────────────────────────────────────────────── */
      .da-soft {
        display: flex; align-items: center; justify-content: center; gap: 9px;
        width: 100%; border-radius: 14px; background: #F1F6F3;
        padding: 16px 16px; font-size: 14px; color: #5A6684;
        transition: background 0.2s ease, transform 0.22s cubic-bezier(0.22,1,0.36,1);
      }
      .da-soft:hover { background: #E7F4EC; transform: translateY(-2px); }
      /* One line on a phone rather than a two-line block. */
      @media (max-width: 430px) { .da-soft { gap: 6px; padding: 15px 10px; font-size: 13px; } }
      .da-soft strong { color: ${BRAND}; font-weight: 700; }
      .da-soft:hover .da-soft-arrow { transform: translateX(3px); }
      .da-soft-arrow { transition: transform 0.22s cubic-bezier(0.22,1,0.36,1); }

      .da-strip {
        display: grid; grid-template-columns: 1fr 1fr;
        border-radius: 14px; background: #F1F6F3; padding: 15px 8px;
        font-size: 12.5px; font-weight: 600; color: #465273;
      }
      .da-strip > * { display: flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
      .da-strip > * + * { border-left: 1px solid #DDE3F4; }
      .da-strip svg { color: ${BRAND}; }

      .da-alert {
        display: flex; align-items: flex-start; gap: 10px;
        border: 1.5px solid #F5C2C7; border-radius: 13px; background: #FDF2F3;
        padding: 12px 14px; font-size: 13px; line-height: 1.45; color: #B02A37;
        animation: da-shake 0.42s cubic-bezier(0.36,0.07,0.19,0.97);
      }
      @keyframes da-shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-4px); }
        40%, 60% { transform: translateX(4px); }
      }

      /* Same idea as the panel: on a short laptop screen the card tightens
         rather than running past the bottom of the window. */
      @media (min-width: 1024px) and (max-height: 910px) {
        .da-card { padding: 26px 30px; }
        .da-card-title { font-size: 26px; }
        .da-avatar { width: 52px; height: 52px; }
        .da-field { min-height: 56px; }
        .da-primary { padding: 15px 20px; }
      }

      @media (min-width: 1024px) and (max-height: 800px) {
        .da-sub-compact { display: none; }
        .da-card { padding: 18px 26px; border-radius: 20px; }
        .da-card-title { font-size: 22px; }
        .da-avatar { width: 42px; height: 42px; }
        .da-avatar svg { width: 20px; height: 20px; }
        .da-field { min-height: 50px; padding: 6px 12px; }
        .da-field-label { font-size: 11px; }
        .da-field-input { font-size: 13.5px; margin-top: 2px; }
        .da-hint { margin-top: 4px; font-size: 10.5px; line-height: 1.35; }
        .da-primary { padding: 12px 20px; font-size: 15px; }
        .da-select, .da-caret { font-size: 13.5px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .da-primary, .da-soft { transition: none; }
        .da-primary-shine { display: none; }
        .da-alert { animation: none; }
      }
    `,
      }}
    />
  );
}
