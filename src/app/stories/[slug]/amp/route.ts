import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const CANVAS_W = 390;
const CANVAS_H = 693;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** HTML-escape for attribute values and text content */
function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Make relative URL absolute */
function abs(src: string | null | undefined, base: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${base}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** px → percentage string for canvas positioning */
function pct(px: number, total: number): string {
  return (px / total * 100).toFixed(3) + '%';
}

/** font-size px → viewport-width units */
function fsVw(px: number): string {
  return (px / CANVAS_W * 100).toFixed(3) + 'vw';
}

function hexToRgba(hex: string, alpha = 1): string {
  if (!hex || !hex.startsWith('#')) return hex || 'transparent';
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${isNaN(alpha) ? 1 : alpha})`;
}

function getClipPath(shapeType: string): string {
  switch (shapeType) {
    case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':  return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star':     return 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)';
    case 'hexagon':  return 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';
    default:         return '';
  }
}

function shadowFilter(el: any): string {
  const has = el.shadowBlur !== undefined || el.shadowX !== undefined
    || el.shadowY !== undefined || el.shadowAlpha !== undefined;
  if (!has) return '';
  const c = hexToRgba(el.shadowColor || '#000000', el.shadowAlpha ?? 0.6);
  return `drop-shadow(${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${c})`;
}

function textShadow(el: any): string {
  const has = el.shadowBlur !== undefined || el.shadowX !== undefined
    || el.shadowY !== undefined || el.shadowAlpha !== undefined;
  if (!has) return '';
  const c = hexToRgba(el.shadowColor || '#000000', el.shadowAlpha ?? 0.6);
  return `${el.shadowX ?? 0}px ${el.shadowY ?? 4}px ${el.shadowBlur ?? 8}px ${c}`;
}

// ─── Canvas Element → AMP HTML ────────────────────────────────────────────────

function renderEl(el: any, siteUrl: string): string {
  const left   = pct(el.x, CANVAS_W);
  const top    = pct(el.y, CANVAS_H);
  const width  = pct(el.w, CANVAS_W);
  const height = pct(el.h, CANVAS_H);
  const opacity = el.opacity ?? 1;
  const rot  = el.rot || 0;
  const flip = `${el.flipX ? ' scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`;
  const transformStr = (rot !== 0 || flip.trim())
    ? `transform:rotate(${rot}deg)${flip};` : '';
  const pos = `position:absolute;left:${left};top:${top};width:${width};height:${height};opacity:${opacity};z-index:${el.z || 0};${transformStr}`;

  // ── Text ────────────────────────────────────────────────────────────────────
  if (el.type === 'text') {
    const color = el.colorAlpha !== undefined && el.colorAlpha < 1 && el.color
      ? hexToRgba(el.color, el.colorAlpha)
      : (el.color || '#ffffff');
    const bg = el.bgColor && el.bgAlpha && el.bgAlpha > 0
      ? hexToRgba(el.bgColor, el.bgAlpha) : '';
    const ts = textShadow(el);
    const content = String(el.content || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const innerStyle = [
      `font-size:${fsVw(el.fontSize || 24)}`,
      `font-family:${el.fontFamily || 'Poppins, sans-serif'}`,
      `font-weight:${el.bold ? 'bold' : 'normal'}`,
      `font-style:${el.italic ? 'italic' : 'normal'}`,
      `text-decoration:${el.underline ? 'underline' : 'none'}`,
      `text-align:${el.align || 'left'}`,
      `color:${color}`,
      `line-height:${el.lineHeight || 1.3}`,
      'word-break:break-word',
      'width:100%',
      bg ? `background-color:${bg}` : '',
      el.borderRadius ? `border-radius:${el.borderRadius}px` : '',
      bg ? 'padding:2px 8px' : '',
      ts ? `text-shadow:${ts}` : '',
    ].filter(Boolean).join(';');

    return `<div style="${pos}display:flex;align-items:flex-start;overflow:visible"><div style="${innerStyle}">${content}</div></div>`;
  }

  // ── Image ───────────────────────────────────────────────────────────────────
  if (el.type === 'image' && el.src) {
    const src = abs(el.src, siteUrl);
    if (!src) return '';
    const sf = shadowFilter(el);
    const filter = [el.filterCss, sf].filter(Boolean).join(' ');
    const border  = el.borderWidth && el.borderColor ? `border:${el.borderWidth}px solid ${el.borderColor};` : '';
    const br      = el.borderRadius ? `border-radius:${el.borderRadius}px;` : '';
    const filterS = filter ? `filter:${filter};` : '';
    const fit = el.objectFit || 'cover';
    const pos2 = el.objectPosition || 'center center';
    return `<div style="${pos}overflow:hidden;${border}${br}${filterS}"><amp-img src="${esc(src)}" layout="fill" object-fit="${fit}" object-position="${pos2}"></amp-img></div>`;
  }

  // ── Shape ───────────────────────────────────────────────────────────────────
  if (el.type === 'shape') {
    const shapeType = el.shapeType || 'rect';
    const clip      = getClipPath(shapeType);
    const filled    = el.filled !== false;
    const fillColor = el.bgColor ? hexToRgba(el.bgColor, el.bgAlpha ?? 1) : '#6366f1';
    const sf        = shadowFilter(el);
    const filter    = [el.filterCss, sf].filter(Boolean).join(' ');
    const filterS   = filter ? `filter:${filter};` : '';
    const border    = el.borderWidth && el.borderColor && !clip
      ? `border:${el.borderWidth}px solid ${el.borderColor};` : '';
    const br        = shapeType === 'circle' ? 'border-radius:50%;'
      : el.borderRadius ? `border-radius:${el.borderRadius}px;` : '';
    const clipS     = clip ? `clip-path:${clip};` : '';

    if (el.bgImage && filled) {
      const src = abs(el.bgImage, siteUrl);
      return `<div style="${pos}${clipS}${br}${filterS}overflow:hidden;"><amp-img src="${esc(src)}" layout="fill" object-fit="cover"></amp-img></div>`;
    }
    return `<div style="${pos}background-color:${filled ? fillColor : 'transparent'};${clipS}${br}${border}${filterS}"></div>`;
  }

  // ── Button ──────────────────────────────────────────────────────────────────
  if (el.type === 'button') {
    const color = el.colorAlpha !== undefined && el.colorAlpha < 1 && el.color
      ? hexToRgba(el.color, el.colorAlpha)
      : (el.color || '#000000');
    const bgColor = el.bgColor ? hexToRgba(el.bgColor, el.bgAlpha ?? 1) : '#ffffff';
    const border  = el.borderWidth && el.borderColor
      ? `border:${el.borderWidth}px solid ${el.borderColor};` : '';
    const br      = `border-radius:${el.borderRadius ?? 50}px;`;
    const content = String(el.content || 'Tap Here')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Note: <a> tags are NOT allowed inside amp-story-grid-layer.
    // Buttons with href are rendered as visual-only here; a separate
    // amp-story-cta-layer is added by renderSlide() for the actual link.
    const inner   = `display:flex;width:100%;height:100%;align-items:center;justify-content:center;background-color:${bgColor};${br}${border}`;
    const spanS   = `font-size:${fsVw(el.fontSize || 16)};font-family:${el.fontFamily || 'Poppins, sans-serif'};font-weight:bold;color:${color};`;
    const label   = `<span style="${spanS}">${content}</span>`;
    return `<div style="${pos}"><div style="${inner}">${label}</div></div>`;
  }

  return '';
}

// ─── Slide → amp-story-page ───────────────────────────────────────────────────

function renderSlide(slide: any, idx: number, siteUrl: string): string {
  const dur = slide.duration || 5;
  const canvasEls: any[] = Array.isArray(slide.canvasData) ? slide.canvasData : [];

  // Background — always use a grid-layer so amp-story-page is never childless
  let bgLayer = '';

  if (slide.bgType === 'IMAGE' && slide.bgImage) {
    const src = abs(slide.bgImage, siteUrl);
    const cfg = slide.canvasConfig || {};
    const fit = cfg.bgImageFit || 'cover';
    const pos2 = cfg.bgImagePosition || 'center center';
    const imgOpacity = cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 1;
    const blur = cfg.bgBlur ? `filter:blur(${cfg.bgBlur}px);` : '';
    const overlayColor = cfg.bgOverlayColor || '#000000';
    const overlayOpacity = cfg.bgOverlayOpacity !== undefined ? cfg.bgOverlayOpacity : 0;
    const overlay = overlayOpacity > 0
      ? `<div style="position:absolute;inset:0;background-color:${overlayColor};opacity:${overlayOpacity};"></div>`
      : '';
    bgLayer = `<amp-story-grid-layer template="fill"><div style="position:relative;width:100%;height:100%;${blur}opacity:${imgOpacity}"><amp-img src="${esc(src)}" layout="fill" object-fit="${fit}" object-position="${pos2}"></amp-img>${overlay}</div></amp-story-grid-layer>`;
  } else if (slide.bgType === 'VIDEO' && slide.bgVideo) {
    const src = abs(slide.bgVideo, siteUrl);
    bgLayer = `<amp-story-grid-layer template="fill"><amp-video src="${esc(src)}" layout="fill" autoplay loop muted playsinline></amp-video></amp-story-grid-layer>`;
  } else if (slide.bgType === 'GRADIENT' && slide.bgGradient) {
    bgLayer = `<amp-story-grid-layer template="fill"><div style="width:100%;height:100%;background:${slide.bgGradient}"></div></amp-story-grid-layer>`;
  } else if (slide.bgType === 'COLOR' && slide.bgColor) {
    bgLayer = `<amp-story-grid-layer template="fill"><div style="width:100%;height:100%;background-color:${slide.bgColor}"></div></amp-story-grid-layer>`;
  } else {
    bgLayer = `<amp-story-grid-layer template="fill"><div style="width:100%;height:100%;background-color:#1a1a2e"></div></amp-story-grid-layer>`;
  }

  // Canvas elements layer
  let canvasLayer = '';
  if (canvasEls.length > 0) {
    const sorted = [...canvasEls].sort((a, b) => (a.z || 0) - (b.z || 0));
    const els = sorted.map(el => renderEl(el, siteUrl)).filter(Boolean).join('');
    canvasLayer = `<amp-story-grid-layer template="fill"><div style="position:relative;width:100%;height:100%;overflow:hidden;">${els}</div></amp-story-grid-layer>`;
  }

  // Legacy text layer (slides with heading/subtext but no canvas elements)
  let legacyLayer = '';
  if (canvasEls.length === 0 && (slide.heading || slide.subtext || slide.ctaText)) {
    const headSize = slide.headingSize === 'SM' ? '6vw' : slide.headingSize === 'LG' ? '11vw' : '8.5vw';
    legacyLayer = `<amp-story-grid-layer template="thirds">
      <div style="grid-column:1/span 3;grid-row:3;padding:20px 16px;background:linear-gradient(transparent,rgba(0,0,0,0.75));">
        ${slide.heading ? `<h2 style="color:${esc(slide.headingColor || '#fff')};font-size:${headSize};margin:0 0 10px;font-weight:700;line-height:1.2;font-family:Poppins,sans-serif;">${esc(slide.heading)}</h2>` : ''}
        ${slide.subtext ? `<p style="color:${esc(slide.subtextColor || '#fff')};font-size:4.5vw;margin:0 0 14px;line-height:1.5;font-family:Poppins,sans-serif;opacity:0.9;">${esc(slide.subtext)}</p>` : ''}
        ${slide.ctaText && slide.ctaUrl ? `<a href="${esc(slide.ctaUrl)}" target="_top" style="display:inline-block;padding:10px 22px;background:#ffffff;color:#111111;border-radius:50px;font-weight:700;text-decoration:none;font-size:4vw;font-family:Poppins,sans-serif;">${esc(slide.ctaText)}</a>` : ''}
      </div>
    </amp-story-grid-layer>`;
  }

  // CTA layer — <a> tags are disallowed in amp-story-grid-layer, so button
  // elements with href are promoted to amp-story-cta-layer (AMP requirement)
  let ctaLayer = '';
  const ctaBtn = canvasEls.find(el => el.type === 'button' && (el.href || el.ctaUrl));
  if (ctaBtn) {
    const href     = esc(ctaBtn.href || ctaBtn.ctaUrl || '');
    const btnText  = String(ctaBtn.content || 'Tap Here')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bgColor  = ctaBtn.bgColor ? hexToRgba(ctaBtn.bgColor, ctaBtn.bgAlpha ?? 1) : '#ffffff';
    const color    = ctaBtn.color || '#000000';
    const br       = `border-radius:${ctaBtn.borderRadius ?? 50}px;`;
    const fontSize = fsVw(ctaBtn.fontSize || 16);
    const ff       = ctaBtn.fontFamily || 'Poppins, sans-serif';
    ctaLayer = `<amp-story-cta-layer><a href="${href}" target="_blank" style="background-color:${bgColor};color:${color};${br}padding:10px 24px;font-weight:bold;text-decoration:none;font-family:${ff};font-size:${fontSize};">${btnText}</a></amp-story-cta-layer>`;
  } else if (canvasEls.length === 0 && slide.ctaText && slide.ctaUrl) {
    // Legacy CTA
    ctaLayer = `<amp-story-cta-layer><a href="${esc(slide.ctaUrl)}" target="_blank" style="background:#fff;color:#111;border-radius:50px;padding:10px 22px;font-weight:700;text-decoration:none;font-size:4vw;font-family:Poppins,sans-serif;">${esc(slide.ctaText)}</a></amp-story-cta-layer>`;
  }

  return `<amp-story-page id="page-${idx + 1}" auto-advance-after="${dur}s">${bgLayer}${canvasLayer}${legacyLayer}${ctaLayer}</amp-story-page>`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL
    || `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host') || 'localhost'}`;

  try {
    const now = new Date();
    const story = await prisma.web_stories.findUnique({
      where: { slug },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    if (!story || !story.isPublished || story.isArchived || !story.slides.length) {
      return new NextResponse('Not Found', { status: 404 });
    }
    if (story.expiresAt && story.expiresAt <= now) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const slides = story.slides.map((s: any) => {
      // canvasData is stored as { config: {...}, elements: [...] } by StoryDesignEditor
      // Legacy format was a plain array — handle both
      let canvasElements: any[] = [];
      let canvasConfig: any = {};
      if (s.canvasData) {
        try {
          const parsed = typeof s.canvasData === 'string' ? JSON.parse(s.canvasData) : s.canvasData;
          if (Array.isArray(parsed)) {
            // Legacy format: direct array of elements
            canvasElements = parsed;
          } else if (parsed && parsed.elements !== undefined) {
            // New format: { config: {...}, elements: [...] }
            canvasElements = Array.isArray(parsed.elements) ? parsed.elements : [];
            canvasConfig = parsed.config || {};
          }
        } catch (e) {
          canvasElements = [];
        }
      }
      return {
        id: s.id,
        duration: s.duration,
        bgType: s.bgType,
        bgImage: s.bgImage,
        bgVideo: s.bgVideo,
        bgColor: s.bgColor,
        bgGradient: s.bgGradient,
        heading: s.heading,
        headingSize: s.headingSize,
        headingColor: s.headingColor,
        subtext: s.subtext,
        subtextColor: s.subtextColor,
        textPosition: s.textPosition,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        canvasData: canvasElements,
        canvasConfig,
      };
    });

    const coverImage   = abs(story.coverImage, siteUrl);
    const coverSquare  = abs((story as any).coverImageSquare, siteUrl) || coverImage;
    const publisherLogo = abs(story.publisherLogo, siteUrl) || `${siteUrl}/logo.png`;
    const publisherName = story.publisherName || 'TransRentals';
    const description   = (story as any).metaDescription || story.description
      || `${story.title} — Read on ${publisherName}`;
    const canonicalUrl  = `${siteUrl}/stories/${slug}/amp`;
    const publishedAt   = story.publishedAt?.toISOString() || new Date().toISOString();

    // Schema.org Article
    const schema = JSON.stringify({
      '@context': 'https://schema.org',
      '@type':    'Article',
      headline:   story.title,
      description,
      image:      coverImage ? [coverImage] : [],
      datePublished: publishedAt,
      dateModified:  publishedAt,
      author:    { '@type': 'Organization', name: publisherName },
      publisher: {
        '@type': 'Organization',
        name:    publisherName,
        logo:    { '@type': 'ImageObject', url: publisherLogo },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/stories/${slug}` },
    });

    // Bookend JSON (safe for <script type="application/json">)
    const bookend = JSON.stringify({
      bookendVersion: 'v1.0',
      shareProviders: ['twitter', 'whatsapp', 'email', 'link'],
      components: [
        { type: 'heading', text: 'Share this Story' },
        {
          type:     'landscape',
          title:    `More Stories on ${publisherName}`,
          url:      `${siteUrl}/stories`,
          image:    coverImage || '',
          category: 'Stories',
        },
      ],
    }).replace(/<\/script>/gi, '<\\/script>');

    const slidesHtml = slides.map((s, i) => renderSlide(s, i, siteUrl)).join('\n');

    const html = `<!doctype html>
<html ⚡ lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<title>${esc(story.title)}</title>
<link rel="canonical" href="${canonicalUrl}">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
<noscript><style amp-boilerplate>body{visibility:visible}</style></noscript>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&amp;family=Poppins:wght@400;600;700;900&amp;family=Montserrat:wght@400;700&amp;family=Open+Sans:wght@400;700&amp;family=Raleway:wght@400;700&amp;family=Playfair+Display:wght@400;700&amp;family=Oswald:wght@400;700&amp;family=Lobster&amp;family=Dancing+Script:wght@400;700&amp;family=Pacifico&amp;family=Quicksand:wght@400;700&amp;family=Nunito:wght@400;700&amp;family=Lato:wght@400;700&amp;family=Merriweather:wght@400;700&amp;family=Ubuntu:wght@400;700&amp;family=Bebas+Neue&amp;family=Inter:wght@400;700&amp;display=swap" rel="stylesheet">
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(story.title)}">
<meta property="og:description" content="${esc(description)}">
${coverImage ? `<meta property="og:image" content="${esc(coverImage)}">` : ''}
<meta property="og:url" content="${canonicalUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(story.title)}">
<meta name="twitter:description" content="${esc(description)}">
${coverImage ? `<meta name="twitter:image" content="${esc(coverImage)}">` : ''}
<script type="application/ld+json">${schema}</script>
<style amp-custom>
*{box-sizing:border-box}
amp-story{font-family:'Poppins',Roboto,sans-serif}
amp-story-page{background:#1a1a2e}
amp-img{display:block}
</style>
</head>
<body>
<amp-story
  standalone
  title="${esc(story.title)}"
  publisher="${esc(publisherName)}"
  publisher-logo-src="${esc(publisherLogo)}"
  ${coverImage  ? `poster-portrait-src="${esc(coverImage)}"` : ''}
  ${coverSquare ? `poster-square-src="${esc(coverSquare)}"` : ''}
  supports-landscape>

${slidesHtml}

<amp-story-bookend layout="nodisplay">
<script type="application/json">${bookend}</script>
</amp-story-bookend>

</amp-story>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error) {
    console.error('[AMP Story]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
