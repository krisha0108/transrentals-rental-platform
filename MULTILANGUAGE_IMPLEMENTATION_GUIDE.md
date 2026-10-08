# Multi-Language (i18n) Implementation Guide

Status: **Planning — not yet implemented**
Stack: Next.js 14 (App Router), TypeScript, existing `middleware.ts`

---

## 1. Feasibility

Yes, fully possible with the current stack. Recommended library: **`next-intl`** — best-supported i18n solution for Next.js App Router, works with our existing `middleware.ts`.

---

## 2. Recommended Flow

### URL Structure
Path-based locale prefix: `tranrentals.in/en/...`, `tranrentals.in/hi/...`

Why not alternatives:
| Option | Verdict |
|---|---|
| `/en/`, `/hi/` path prefix (recommended) | Best for SEO, easy to reason about, each language gets crawlable, indexable URLs |
| `?lang=hi` query param | Avoid — Google does not index/rank query-param variants well |
| Subdomain (`hi.tranrentals.in`) | Overkill for 2-3 languages, adds DNS/infra complexity |
| Cookie-only (no URL change) | Bad for SEO — search engines can't discover the alternate-language pages |

### High-Level Architecture
```
Request → middleware.ts (detect/redirect locale) → src/app/[locale]/... → 
   useTranslations() reads messages/<locale>.json → rendered page
```

- Default locale (English) can be served without a prefix (`/`) or with one (`/en`) — decision needed, see Section 5.
- All existing routes move under a `[locale]` dynamic segment: `src/app/[locale]/(services)/...`, `src/app/[locale]/about`, etc.
- One JSON file per language holds translated strings, keyed by section: `messages/en.json`, `messages/hi.json`.
- Components stop using hardcoded text and instead call `useTranslations('hero')` → `t('title')`.

### Static Rendering
Each locale's pages are statically generated (SSG) at build time wherever current pages already are static — meaning **no runtime performance cost** for having multiple languages.

---

## 3. Effects

### SEO
- ✅ Positive: opens the site to Hindi/regional search queries — real incremental organic traffic for a travel/rental business targeting India.
- ✅ No impact on existing English page rankings, as long as current URLs are preserved.
- ⚠️ Must implement `hreflang` alternate tags on every page, or Google may treat translated pages as duplicate content instead of language alternates.
- ⚠️ New locale pages start ranking from zero — they don't inherit English pages' existing authority/backlinks. Expect a ramp-up period (weeks).
- Sitemap must list each locale's URLs separately for faster discovery/indexing.

### Indexing
- Google needs to separately crawl and index the new locale URLs — normal, not a penalty, just takes time.
- No effect on already-indexed English pages if their URLs don't change.

### Performance / Page Speed
- ✅ With SSG + per-locale message loading (only the active language's JSON is sent to the client), performance stays effectively the same as today.
- ⚠️ Risk only with a naive setup: bundling *all* languages' translation JSON into the client bundle — inflates JS payload, slows down First Contentful Paint / Time to Interactive. This is avoided by scoping message loading to the active locale (done correctly by `next-intl` config).
- Middleware adds a locale-detection step per request — negligible (edge-level, sub-millisecond).
- Optional: if root `/` auto-redirects to `/en` or `/hi`, that's one extra redirect hop. Avoidable by choosing "no prefix for default locale."

**Net assessment:** if implemented per this plan, SEO improves, indexing is unaffected for existing content, and page speed impact is effectively zero.

---

## 4. Implementation Steps (for reference, once approved)

1. Install `next-intl`, configure `i18n.ts` / `request.ts`.
2. Restructure routes: move everything from `src/app/*` into `src/app/[locale]/*`.
3. Update `middleware.ts` to add locale detection/routing on top of existing logic.
4. Create `messages/en.json` (extract current hardcoded strings) and `messages/<other-locale>.json`.
5. Replace hardcoded text in components with `useTranslations()` calls — largest effort item, done incrementally page by page (can start with marketplace hero/homepage since that's the most active area right now).
6. Add `hreflang` alternate tags + per-locale sitemap entries.
7. Add a language switcher component in the header/nav.
8. QA pass: verify no route/middleware regressions (auth, admin, API routes should stay locale-agnostic).

---

## 5. Decisions Needed From Your End

- [ ] **Which languages** to support beyond English? (e.g., Hindi only, or Hindi + others)
- [ ] **Default locale URL style**: `/` = English with no prefix, or `/en` explicit prefix for everything?
- [ ] **Who provides translations?** Options: professional translation, in-house review of AI-generated draft translations, or fully machine-translated (not recommended for customer-facing/booking flow copy — quality risk).
- [ ] **Scope of first rollout**: entire site at once, or start with high-traffic pages only (homepage, marketplace/hero, booking flow) and expand later?
- [ ] **Content ownership going forward**: every future new page/feature will need translated copy added — who maintains `messages/*.json` on an ongoing basis?

---

## 6. Effort Estimate

- Core i18n infra (routing, middleware, config): small-medium.
- String extraction + component updates: the bulk of the work — proportional to how many pages/components exist today (site has a large number of routes under `src/app`, so this is the long pole, not the infrastructure).
- Recommend a phased rollout (Section 4, step 8) rather than a big-bang switch.
