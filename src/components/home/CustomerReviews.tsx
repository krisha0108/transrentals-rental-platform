'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  Star,
  Quote,
  PenLine,
  X,
  Loader2,
  CheckCircle2,
  BadgeCheck,
  MessageSquareQuote,
  ThumbsUp,
  ArrowRight,
} from 'lucide-react';

type PublicReview = {
  id: string;
  name: string;
  city: string | null;
  service: string | null;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
};


const SERVICES = [
  'Bike Rental',
  'Car Rental',
  'Self Drive',
  'Luxury Cars',
  'Bus & Tempo',
  'Transporter',
  'Packers & Movers',
  'Equipment Rental',
  'Chauffeur Service',
  'Wander Tours',
  'Other',
];

const AVATAR_STYLES = [
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-amber-50 text-amber-700 ring-amber-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
];

/** 22 Sept 2026 — short enough for a card footer. */
function longDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MAX_COMMENT = 1000;

// Enough to fill three moving rows without the same face coming round too
// often; each row still repeats its own slice to close the loop.
const SHOWN_REVIEWS = 12;


function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// What each rating looks and sounds like while it is being picked. A single
// amber row tells you nothing until you read the count; a red one at one star
// and a green one at five reads before the number does.
const RATING_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#facc15',
  4: '#84cc16',
  5: '#16a34a',
};
const RATING_WORDS: Record<number, string> = {
  1: 'Bad',
  2: 'Poor',
  3: 'Average',
  4: 'Great',
  5: 'Excellent',
};

/** The row of stars, used read-only on a card and clickable in the form. */
function Stars({
  value,
  onChange,
  size = 'sm',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls = size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  // While the pointer is over the row, show the rating it would set.
  const [preview, setPreview] = useState(0);
  const picking = !!onChange;
  const active = picking ? preview || value : value;
  const colour = picking ? RATING_COLORS[active] : undefined;

  return (
    <div className="flex gap-0.5" onMouseLeave={picking ? () => setPreview(0) : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= active;
        const star = (
          <Star
            className={`${cls} ${filled && !picking ? 'fill-amber-400 text-amber-400' : ''} ${
              filled ? '' : 'text-slate-300/70'
            }`}
            style={filled && colour ? { fill: colour, color: colour } : undefined}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setPreview(n)}
            onFocus={() => setPreview(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''} — ${RATING_WORDS[n]}`}
            className="transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

function ReviewForm({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  // The text fields are deliberately uncontrolled. A controlled input is
  // rewritten from state on every render, so anything the browser autofilled —
  // which React never hears about — is wiped the moment the visitor types in
  // some other field, leaving a filled-looking box that fails validation.
  // Uncontrolled fields keep whatever is really on screen, and the form itself
  // is read on submit.
  const [rating, setRating] = useState(0);
  const [commentLength, setCommentLength] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Set on the first submit, so the stars only turn red once someone has
  // actually tried to send the form — not while they are still filling it in.
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // A logged-in customer should not have to retype what we already know. Read
  // once, for the initial values; the server re-checks the id before it
  // trusts it.
  const [prefill] = useState(() => {
    if (typeof window === 'undefined') return { name: '', email: '', phone: '', customerId: '' };
    try {
      const stored = localStorage.getItem('customer');
      if (!stored) return { name: '', email: '', phone: '', customerId: '' };
      const c = JSON.parse(stored);
      return {
        name: c?.name || c?.full_name || '',
        email: c?.email || '',
        phone: c?.phone || '',
        customerId: c?.id ? String(c.id) : '',
      };
    } catch {
      // A missing or unreadable entry just means an empty form.
      return { name: '', email: '', phone: '', customerId: '' };
    }
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setAttempted(true);

    const fd = new FormData(e.currentTarget);
    const field = (key: string) => String(fd.get(key) ?? '').trim();

    const nameValue = field('name');
    const cityValue = field('city');
    const serviceValue = field('service');
    const emailValue = field('email');
    const phoneValue = field('phone');
    const commentValue = field('comment');

    // The message for this one sits under the stars, where the eye already is.
    if (rating < 1) return;
    if (nameValue.length < 2) return setError('Please enter your name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return setError('Please enter a valid email');
    }
    if (phoneValue.replace(/\D/g, '').length < 10) {
      return setError('Please enter a valid phone number');
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.set('name', nameValue);
      payload.set('email', emailValue);
      payload.set('phone', phoneValue);
      payload.set('rating', String(rating));
      payload.set('comment', commentValue);
      if (cityValue) payload.set('city', cityValue);
      if (serviceValue) payload.set('service', serviceValue);
      if (prefill.customerId) payload.set('customerId', prefill.customerId);

      const res = await fetch('/api/reviews', { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not submit your review');
        return;
      }
      setDone(true);
      onSubmitted();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary-500';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading text-xl font-extrabold text-slate-900">
              {done ? 'Thank you!' : 'Write a review'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {done
                ? 'Your review has been sent for a quick check.'
                : 'Tell other travellers how your rental went.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary-600" />
            <p className="mt-4 text-slate-600">
              Reviews go live once our team has read them, so it may take a little while to
              appear on this page.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-primary-600 py-3 font-bold text-white transition-colors hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Your rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div
                  className={
                    attempted && rating < 1
                      ? 'inline-flex rounded-xl bg-red-50 px-2 py-1.5 ring-1 ring-red-200'
                      : 'inline-flex'
                  }
                >
                  <Stars value={rating} onChange={setRating} size="lg" />
                </div>
                {rating > 0 && (
                  <span
                    className="text-sm font-bold"
                    style={{ color: RATING_COLORS[rating] }}
                  >
                    {RATING_WORDS[rating]}
                  </span>
                )}
              </div>
              {attempted && rating < 1 && (
                <p className="mt-1.5 text-xs font-medium text-red-600">Please pick a rating</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={prefill.name}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">City</label>
                <input
                  name="city"
                  maxLength={120}
                  autoComplete="address-level2"
                  placeholder="Ahmedabad"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Service used</label>
                <select name="service" defaultValue="" className={`${inputClass} bg-white`}>
                  <option value="">Select a service</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={prefill.email}
                  maxLength={160}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                name="phone"
                defaultValue={prefill.phone}
                maxLength={20}
                autoComplete="tel"
                placeholder="98765 43210"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">
                Your email and phone are only used to verify the review — neither is shown on
                the site.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Your review <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                name="comment"
                rows={4}
                maxLength={MAX_COMMENT}
                onChange={(e) => setCommentLength(e.target.value.length)}
                placeholder="What went well? How was the vehicle and the vendor? (optional)"
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {commentLength}/{MAX_COMMENT}
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Sending…' : 'Submit review'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Reviews are published after a quick check by our team.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/** Counts up to `value` once the element is on screen. */
function CountUp({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const DURATION = 1000;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // ease-out, so it decelerates into the final number
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduced]);

  return <span ref={ref}>{(reduced ? value : shown).toFixed(decimals)}</span>;
}

/** Read-only stars that pop in one after another when scrolled to. */
function StarRow({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-7 w-7' : size === 'md' ? 'h-5 w-5' : 'h-[17px] w-[17px]';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.span
          key={n}
          initial={{ scale: 0, rotate: -35 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: n * 0.05 }}
        >
          <Star
            className={`${cls} ${
              n <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
            }`}
          />
        </motion.span>
      ))}
    </div>
  );
}

/**
 * The average, drawn as a ring whose arc fills to its share of five, and fills
 * again when you point at it.
 */
function RatingRing({ average }: { average: number }) {
  const RADIUS = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const share = Math.max(0, Math.min(1, average / 5));
  const filled = CIRCUMFERENCE * (1 - share);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  const arc = useAnimationControls();

  const fill = useCallback(
    (duration = 1.1) =>
      arc.start({ strokeDashoffset: filled, transition: { duration, ease: 'easeOut' } }),
    [arc, filled]
  );

  // The one that plays on its own honours a reduced-motion preference.
  useEffect(() => {
    if (inView) fill(reduced ? 0 : 1.1);
  }, [inView, fill, reduced]);

  // This one is asked for: someone pointed at the ring to see it fill, so it
  // runs either way. Back to empty with no transition first, so what you see
  // is the arc filling up rather than unwinding.
  const replay = () => {
    arc.set({ strokeDashoffset: CIRCUMFERENCE });
    fill(1.1);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={replay}
      onTouchStart={replay}
      className="relative h-[128px] w-[128px] shrink-0 cursor-pointer sm:h-[156px] sm:w-[156px]"
    >
      <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90">
        <circle cx="84" cy="84" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        <motion.circle
          cx="84"
          cy="84"
          r={RADIUS}
          fill="none"
          stroke="url(#ratingArc)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={arc}
        />
        <defs>
          <linearGradient id="ratingArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[42px] font-black leading-none tracking-tight text-slate-900">
          <CountUp value={average} />
        </span>
        <span className="mt-1 text-[12px] font-medium text-slate-400">out of 5</span>
      </div>
    </div>
  );
}

/** One 5★…1★ row, its bar growing to share once scrolled into view. */
function DistributionRow({
  stars,
  count,
  total,
  index,
}: {
  stars: number;
  count: number;
  total: number;
  index: number;
}) {
  const share = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-7 shrink-0 items-center gap-1 text-[13px] font-bold text-slate-700">
        {stars} <Star className="h-3 w-3 fill-primary-500 text-primary-500" />
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
          initial={{ width: 0 }}
          whileInView={{ width: `${share}%` }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className="w-4 shrink-0 text-right text-[13px] text-slate-400">{count}</span>
    </div>
  );
}

/** The way into the form. */
function ReviewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-primary-600 px-5 py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_22px_-14px_rgba(5,150,105,.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-14px_rgba(5,150,105,.95)]"
    >
      {/* the darker shade arrives from the left instead of the colour snapping */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-primary-800 transition-transform duration-300 ease-out group-hover:translate-x-0"
      />
      <span className="relative flex items-center justify-center gap-2.5">
        <PenLine className="h-[18px] w-[18px] transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
        Write a Review
        <ArrowRight className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1.5" />
      </span>
    </button>
  );
}

/** One review, as a card in a moving row. */
function ReviewCard({ review, index }: { review: PublicReview; index: number }) {
  return (
    <article className="group relative flex h-[212px] w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,.45)]">
      <Quote
        aria-hidden
        className="absolute right-4 top-4 h-8 w-8 text-slate-100 transition-colors duration-300 group-hover:text-primary-100"
      />

      <header className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ring-1 ${
            AVATAR_STYLES[index % AVATAR_STYLES.length]
          }`}
        >
          {initialsOf(review.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
            {review.name}
          </p>
          <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {review.city || 'Verified customer'}
          </p>
        </div>
      </header>

      <div className="mt-3.5 flex items-center gap-2">
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-[15px] w-[15px] ${
                n <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
              }`}
            />
          ))}
        </span>
        <span className="text-[13px] font-bold text-slate-900">{review.rating.toFixed(1)}</span>
        {review.service && (
          <span className="ml-auto truncate rounded-md bg-slate-50 px-2 py-1 text-[10.5px] font-semibold text-slate-500">
            {review.service}
          </span>
        )}
      </div>

      {review.comment?.trim() && (
        <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.55] text-slate-600">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-[11px] font-medium text-slate-400">
          {longDate(review.createdAt)}
        </span>
        {review.isVerified && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-primary-600">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
      </footer>
    </article>
  );
}

/**
 * One row of the wall. The cards are laid out twice and the track travels
 * exactly half its own width, so the loop closes on itself with no seam.
 */
function MarqueeRow({
  reviews,
  offset,
  direction,
  seconds,
}: {
  reviews: PublicReview[];
  offset: number;
  direction: 'left' | 'right';
  seconds: number;
}) {
  if (!reviews.length) return null;

  // The loop closes on itself by laying the row out twice, which only works
  // if one pass is already wider than the row — otherwise a gap slides past.
  // A card is 340px plus a 16px gap, so four of them clear any sane column.
  const MIN_CARDS = 4;
  const filled = [...reviews];
  while (filled.length < MIN_CARDS) filled.push(...reviews);
  const cards = [...filled, ...filled];

  return (
    <div
      className="review-marquee relative overflow-hidden"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)',
      }}
    >
      <div
        className="review-track flex w-max gap-4"
        style={{
          animation: `review-marquee-${direction} ${seconds}s linear infinite`,
        }}
      >
        {cards.map((review, i) => (
          <ReviewCard key={`${review.id}-${i}`} review={review} index={offset + i} />
        ))}
      </div>
    </div>
  );
}

export function CustomerReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?limit=${SHOWN_REVIEWS}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverage(data.averageRating ?? null);
        setTotal(data.total || 0);
        setDistribution(data.distribution || {});
      }
    } catch {
      // The section still renders its invitation to write one.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasReviews = !loading && reviews.length > 0;
  const hasSummary = total > 0 && average !== null;

  // Share of reviewers who gave four stars or more — the one number people
  // actually read off a ratings block.
  const recommend =
    total > 0
      ? Math.round((((distribution[4] || 0) + (distribution[5] || 0)) / total) * 100)
      : 0;

  // Four cards to a row. The fifth review opens a second row and the ninth a
  // third, so a row never grows long enough to turn into a blur and twelve
  // reviews sit as an even 4 / 4 / 4. Below three reviews nothing moves at
  // all — a row holding one or two people would just show the same face
  // coming round again.
  const MAX_PER_ROW = 4;
  const MIN_TO_MOVE = 3;
  const rowCount =
    reviews.length < MIN_TO_MOVE
      ? 0
      : Math.min(3, Math.ceil(reviews.length / MAX_PER_ROW));

  // Dealt out one card at a time, so each row gets a mix rather than the
  // newest in row one and the oldest in the last.
  const rows: PublicReview[][] = Array.from({ length: Math.max(1, rowCount) }, () => []);
  reviews.forEach((review, i) => rows[i % rows.length].push(review));

  const ROW_SPEEDS = [46, 52, 58];
  const ROW_DIRECTIONS: ('left' | 'right')[] = ['right', 'left', 'right'];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <span className="text-xs font-black uppercase tracking-widest text-primary-600">
            Straight from our customers
          </span>
          <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Customer Reviews &amp; Ratings
          </h2>
          <p className="mt-3 text-slate-500">
            Real experiences from people who rented through TransRentals
          </p>
        </motion.div>

        {/* minmax(0,1fr) matters: a plain 1fr will not shrink below the track's
            max-content width, and the rows would push the page sideways. */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-8 lg:grid-cols-[360px_minmax(0,1fr)]"
        >
          {/* ── the score ── */}
          <aside className="flex flex-col rounded-2xl border border-slate-300 bg-white px-7 py-8 shadow-[0_10px_26px_-20px_rgba(15,23,42,.4)]">
            {hasSummary ? (
              <div>
                <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-slate-400">
                  Overall Rating
                </h3>

                <div className="mt-4 flex items-center gap-5">
                  <RatingRing average={average} />
                  <div className="min-w-0">
                    <StarRow value={Math.round(average)} size="md" />
                    <p className="mt-2 text-sm text-slate-500">
                      From {total} review{total === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {recommend > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 shrink-0" /> {recommend}% rated 4★ or higher
                  </motion.p>
                )}

                <div className="mt-6 space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars, i) => (
                    <DistributionRow
                      key={stars}
                      stars={stars}
                      count={distribution[stars] || 0}
                      total={total}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <MessageSquareQuote className="h-10 w-10 text-primary-300" />
                <h3 className="mt-3 font-heading text-xl font-extrabold text-slate-900">
                  No ratings yet
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  The first review will set the score for this page.
                </p>
              </div>
            )}

            <div className="mt-auto pt-7">
              <ReviewButton onClick={() => setFormOpen(true)} />
              <p className="mt-2.5 text-center text-xs text-slate-400">
                Reviews are published after a quick check
              </p>
            </div>
          </aside>

          {/* ── the wall ── */}
          {hasReviews && rowCount >= 1 ? (
            <div className="flex flex-col justify-center gap-4">
              {rows.map((row, i) => (
                <MarqueeRow
                  key={i}
                  reviews={row}
                  offset={i}
                  direction={ROW_DIRECTIONS[i]}
                  seconds={ROW_SPEEDS[i]}
                />
              ))}
            </div>
          ) : hasReviews ? (
            // Too few to move: show them still, centred, and let them speak.
            <div className="my-auto flex flex-wrap items-stretch justify-center gap-4">
              {reviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
              <MessageSquareQuote className="h-8 w-8 text-primary-300" />
              <h3 className="mt-3 font-heading text-base font-bold text-slate-900">
                {loading ? 'Loading reviews…' : 'No reviews yet'}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                {loading
                  ? ' '
                  : 'Rented with us? Be the first to tell other travellers how it went.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {formOpen && <ReviewForm onClose={() => setFormOpen(false)} onSubmitted={load} />}
    </section>
  );
}
