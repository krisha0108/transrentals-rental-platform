'use client';

// The handful of shapes every screen in the driver portal needs.
//
// Each page had been rolling its own page title, its own figure boxes and its
// own "nothing here yet" panel, so no two looked quite alike and a heading on
// one page could be twice the size of the same heading on the next. These are
// the shared ones; the styles behind them live in the portal layout.

import React from 'react';
import Link from 'next/link';

/** Title, one line of context, and whatever actions belong to the screen. */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="dv-page-head">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="dv-page-icon">
            <Icon className="w-[22px] h-[22px]" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="dv-page-title">{title}</h1>
          {subtitle && <p className="dv-page-sub">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export interface StatTileProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Tailwind background for the 4px rail down the left edge. */
  accent?: string;
  /** Tailwind background + text for the icon chip. */
  tone?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'bg-green-400',
  tone = 'bg-green-100 text-green-600',
  onClick,
  selected,
}: StatTileProps) {
  const body = (
    <>
      <span className={`dv-stat-accent ${accent}`} />
      <span className="dv-stat-body">
        <span className={`dv-stat-icon ${tone}`}><Icon className="w-5 h-5" /></span>
        <span className="min-w-0 block">
          <span className="dv-stat-value block truncate">{value}</span>
          <span className="dv-stat-label block truncate">{label}</span>
          {hint && <span className="dv-stat-hint block truncate">{hint}</span>}
        </span>
      </span>
    </>
  );

  if (!onClick) return <div className="dv-stat">{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`dv-stat dv-stat-button text-left ${selected ? 'is-selected' : ''}`}
    >
      {body}
    </button>
  );
}

/** A screen with nothing on it should still say what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ElementType;
  title: string;
  message?: string;
  action?: { href: string; label: string; icon?: React.ElementType };
}) {
  const ActionIcon = action?.icon;
  return (
    <div className="dv-empty">
      <span className="dv-empty-icon"><Icon className="w-7 h-7" /></span>
      <p className="dv-empty-title">{title}</p>
      {message && <p className="dv-empty-sub">{message}</p>}
      {action && (
        <Link href={action.href} className="dv-empty-cta">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** The white panel most content sits in. */
export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dv-panel ${className}`}>
      {(title || action) && (
        <header className="dv-panel-head">
          {title && <h2 className="dv-panel-title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Pill row used for service / status filters. */
export function FilterPills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; icon?: React.ElementType; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="dv-pills">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`dv-pill ${active ? 'is-active' : ''}`}
          >
            {Icon && <Icon className="w-[15px] h-[15px]" />}
            {o.label}
            {o.count != null && o.count > 0 && <span className="dv-pill-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
