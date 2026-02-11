import { parse } from 'node-html-parser';
import crypto from 'crypto';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export interface SEOAuditResult {
  id: string;
  pagePath: string;
  pageTitle: string | null;
  lastAuditDate: Date;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  onPageScore: number;

  // Meta tags
  hasTitle: boolean;
  titleLength: number | null;
  titleIssue: string | null;
  hasMetaDesc: boolean;
  metaDescLength: number | null;
  metaDescIssue: string | null;
  hasCanonical: boolean;
  canonicalUrl: string | null;

  // Headings
  hasH1: boolean;
  h1Count: number;
  h1Text: string | null;
  h2Count: number;
  h3Count: number;

  // Content
  wordCount: number;
  readingTime: number | null;

  // Images
  hasImages: boolean;
  imageCount: number;
  imagesWithAlt: number;
  imagesMissingAlt: number;

  // Links
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;

  // Technical
  isIndexable: boolean;
  hasRobotsMeta: string | null;
  hasStructuredData: boolean;
  structuredDataTypes: string | null;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  isMobileFriendly: boolean;
  viewportMeta: boolean;

  // Performance
  pageSize: number | null;
  loadTime: number | null;

  // Issues
  issues: string | null;
  warnings: string | null;
  passed: string | null;
}

export async function auditPage(url: string, baseUrl: string): Promise<SEOAuditResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0; +http://example.com/bot)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const loadTime = Date.now() - startTime;
    const pageSize = Buffer.byteLength(html, 'utf8');
    const root = parse(html);

    // Extract page path
    const pagePath = new URL(url).pathname;

    // ========== META TAGS ==========

    // Title
    const titleTag = root.querySelector('title');
    const pageTitle = titleTag?.text?.trim() || null;
    const hasTitle = !!pageTitle;
    const titleLength = pageTitle?.length || null;
    let titleIssue = null;

    if (!hasTitle) {
      issues.push('Missing title tag');
      titleIssue = 'Missing';
    } else if (titleLength! < 30) {
      warnings.push(`Title too short (${titleLength} chars)`);
      titleIssue = 'Too short';
    } else if (titleLength! > 60) {
      warnings.push(`Title too long (${titleLength} chars)`);
      titleIssue = 'Too long';
    } else {
      passed.push('Title length optimal');
    }

    // Meta description
    const metaDesc = root.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || null;
    const hasMetaDesc = !!metaDesc;
    const metaDescLength = metaDesc?.length || null;
    let metaDescIssue = null;

    if (!hasMetaDesc) {
      issues.push('Missing meta description');
      metaDescIssue = 'Missing';
    } else if (metaDescLength! < 120) {
      warnings.push(`Meta description too short (${metaDescLength} chars)`);
      metaDescIssue = 'Too short';
    } else if (metaDescLength! > 160) {
      warnings.push(`Meta description too long (${metaDescLength} chars)`);
      metaDescIssue = 'Too long';
    } else {
      passed.push('Meta description length optimal');
    }

    // Canonical
    const canonicalTag = root.querySelector('link[rel="canonical"]');
    const canonicalUrl = canonicalTag?.getAttribute('href') || null;
    const hasCanonical = !!canonicalUrl;

    if (!hasCanonical) {
      warnings.push('Missing canonical URL');
    } else {
      passed.push('Has canonical URL');
    }

    // ========== HEADINGS ==========

    const h1Elements = root.querySelectorAll('h1');
    const h1Count = h1Elements.length;
    const hasH1 = h1Count > 0;
    const h1Text = h1Elements[0]?.text?.trim() || null;

    if (!hasH1) {
      issues.push('Missing H1 tag');
    } else if (h1Count > 1) {
      warnings.push(`Multiple H1 tags found (${h1Count})`);
    } else {
      passed.push('Single H1 tag present');
    }

    const h2Count = root.querySelectorAll('h2').length;
    const h3Count = root.querySelectorAll('h3').length;

    if (h2Count === 0) {
      warnings.push('No H2 tags found');
    }

    // ========== CONTENT ==========

    // Extract text content
    const bodyText = root.querySelector('body')?.text || '';
    const words = bodyText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    if (wordCount < 300) {
      warnings.push(`Low word count (${wordCount} words)`);
    } else if (wordCount > 2000) {
      passed.push(`Good word count (${wordCount} words)`);
    } else {
      passed.push(`Adequate word count (${wordCount} words)`);
    }

    // ========== IMAGES ==========

    const images = root.querySelectorAll('img');
    const imageCount = images.length;
    const hasImages = imageCount > 0;
    const imagesWithAlt = images.filter(img => img.getAttribute('alt')).length;
    const imagesMissingAlt = imageCount - imagesWithAlt;

    if (hasImages && imagesMissingAlt > 0) {
      warnings.push(`${imagesMissingAlt} images missing alt text`);
    } else if (hasImages) {
      passed.push('All images have alt text');
    }

    // ========== LINKS ==========

    const links = root.querySelectorAll('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('http://') || href.startsWith('https://')) {
        if (href.includes(new URL(baseUrl).hostname)) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } else if (href.startsWith('/') || !href.startsWith('#')) {
        internalLinks++;
      }
    });

    if (internalLinks === 0) {
      warnings.push('No internal links found');
    }

    // ========== TECHNICAL SEO ==========

    // Robots meta
    const robotsMeta = root.querySelector('meta[name="robots"]')?.getAttribute('content') || null;
    const hasRobotsMeta = robotsMeta;
    const isIndexable = !robotsMeta || (!robotsMeta.includes('noindex') && !robotsMeta.includes('none'));

    if (!isIndexable) {
      issues.push('Page is set to noindex');
    } else {
      passed.push('Page is indexable');
    }

    // Structured data
    const structuredDataScripts = root.querySelectorAll('script[type="application/ld+json"]');
    const hasStructuredData = structuredDataScripts.length > 0;
    const structuredDataTypes: string[] = [];

    structuredDataScripts.forEach(script => {
      try {
        const data = JSON.parse(script.text);
        if (data['@type']) {
          structuredDataTypes.push(data['@type']);
        }
      } catch (e) {
        // Invalid JSON
      }
    });

    if (!hasStructuredData) {
      warnings.push('No structured data found');
    } else {
      passed.push(`Structured data present: ${structuredDataTypes.join(', ')}`);
    }

    // Open Graph
    const ogTags = root.querySelectorAll('meta[property^="og:"]');
    const hasOpenGraph = ogTags.length > 0;

    if (!hasOpenGraph) {
      warnings.push('Missing Open Graph tags');
    } else {
      passed.push('Open Graph tags present');
    }

    // Twitter Card
    const twitterTags = root.querySelectorAll('meta[name^="twitter:"]');
    const hasTwitterCard = twitterTags.length > 0;

    if (!hasTwitterCard) {
      warnings.push('Missing Twitter Card tags');
    } else {
      passed.push('Twitter Card tags present');
    }

    // Mobile-friendly
    const viewportTag = root.querySelector('meta[name="viewport"]');
    const viewportMeta = !!viewportTag;
    const isMobileFriendly = viewportMeta;

    if (!isMobileFriendly) {
      issues.push('Missing viewport meta tag (not mobile-friendly)');
    } else {
      passed.push('Mobile-friendly (viewport meta present)');
    }

    // ========== SCORING ==========

    // Technical Score (0-100)
    let technicalScore = 100;
    if (!isIndexable) technicalScore -= 30;
    if (!hasCanonical) technicalScore -= 10;
    if (!hasStructuredData) technicalScore -= 15;
    if (!hasOpenGraph) technicalScore -= 10;
    if (!hasTwitterCard) technicalScore -= 10;
    if (!isMobileFriendly) technicalScore -= 25;
    technicalScore = Math.max(0, technicalScore);

    // Content Score (0-100)
    let contentScore = 100;
    if (!hasTitle) contentScore -= 30;
    else if (titleIssue) contentScore -= 15;
    if (!hasMetaDesc) contentScore -= 20;
    else if (metaDescIssue) contentScore -= 10;
    if (wordCount < 300) contentScore -= 20;
    if (imagesMissingAlt > 0) contentScore -= Math.min(20, imagesMissingAlt * 5);
    contentScore = Math.max(0, contentScore);

    // On-Page Score (0-100)
    let onPageScore = 100;
    if (!hasH1) onPageScore -= 30;
    if (h1Count > 1) onPageScore -= 15;
    if (h2Count === 0) onPageScore -= 10;
    if (internalLinks === 0) onPageScore -= 20;
    if (wordCount < 300) onPageScore -= 15;
    onPageScore = Math.max(0, onPageScore);

    // Overall Score (average)
    const overallScore = Math.round((technicalScore + contentScore + onPageScore) / 3);

    return {
      id: generateId(),
      pagePath,
      pageTitle,
      lastAuditDate: new Date(),
      overallScore,
      technicalScore,
      contentScore,
      onPageScore,
      hasTitle,
      titleLength,
      titleIssue,
      hasMetaDesc,
      metaDescLength,
      metaDescIssue,
      hasCanonical,
      canonicalUrl,
      hasH1,
      h1Count,
      h1Text,
      h2Count,
      h3Count,
      wordCount,
      readingTime,
      hasImages,
      imageCount,
      imagesWithAlt,
      imagesMissingAlt,
      internalLinks,
      externalLinks,
      brokenLinks: 0, // Would need additional checks
      isIndexable,
      hasRobotsMeta,
      hasStructuredData,
      structuredDataTypes: structuredDataTypes.length > 0 ? JSON.stringify(structuredDataTypes) : null,
      hasOpenGraph,
      hasTwitterCard,
      isMobileFriendly,
      viewportMeta,
      pageSize,
      loadTime: loadTime / 1000, // Convert to seconds
      issues: issues.length > 0 ? JSON.stringify(issues) : null,
      warnings: warnings.length > 0 ? JSON.stringify(warnings) : null,
      passed: passed.length > 0 ? JSON.stringify(passed) : null,
    };
  } catch (error) {
    console.error(`Failed to audit ${url}:`, error);
    throw error;
  }
}

export async function auditMultiplePages(urls: string[], baseUrl: string): Promise<SEOAuditResult[]> {
  const results: SEOAuditResult[] = [];

  for (const url of urls) {
    try {
      const result = await auditPage(url, baseUrl);
      results.push(result);
    } catch (error) {
      console.error(`Skipping ${url} due to error:`, error);
    }
  }

  return results;
}

export function getSeverityColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

export function getSeverityLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}
