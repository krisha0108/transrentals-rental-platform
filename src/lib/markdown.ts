import { slugify } from '@/lib/utils';

const createHeadingRegex = () => /^(#{1,3})\s+(.+)$/gm;
const createHtmlHeadingRegex = () => /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;

export interface HeadingMatch {
  id: string;
  text: string;
  level: number;
}

 const clampHeadingLevel = (hashes: string) => Math.min(hashes.length, 3);

export function extractHeadings(content: string): HeadingMatch[] {
  const regex = createHeadingRegex();
  const htmlRegex = createHtmlHeadingRegex();
  const headings: HeadingMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const level = clampHeadingLevel(match[1]);
    if (level < 2) continue;
    const text = match[2].trim();
    const id = slugify(text);

    if (text) {
      headings.push({ id, text, level });
    }
  }

  while ((match = htmlRegex.exec(content)) !== null) {
    const level = Number(match[1]);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (!text) continue;
    const id = slugify(text);
    headings.push({ id, text, level });
  }

  return headings;
}

export function renderBlogContent(content: string): string {
  if (!content) return '';

  // Add ids to markdown-style headings (## heading)
  const withMarkdownIds = content.replace(createHeadingRegex(), (_match, hashes, text) => {
    const level = clampHeadingLevel(hashes);
    const id = slugify(text.trim());
    return `<h${level} id="${id}">${text.trim()}</h${level}>`;
  });

  // Add ids to HTML-style headings from Tiptap (<h2>, <h3>) — skip if id already present
  const withHtmlIds = withMarkdownIds.replace(
    /<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, level, attrs, inner) => {
      if (/\bid=/i.test(attrs)) return _match; // already has id
      const text = inner.replace(/<[^>]*>/g, '').trim();
      if (!text) return _match;
      const id = slugify(text);
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return withHtmlIds.replace(/\n/g, '<br />');
}
