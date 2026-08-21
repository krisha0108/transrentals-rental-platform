import { Cormorant_Garamond } from 'next/font/google';

/**
 * Display face shared by every customer quote-detail page.
 *
 * Loaded once here rather than per page so all eight routes resolve to the same
 * font instance. Pages put `quoteDisplay.variable` on their root element and
 * then use the `.quote-serif` class (defined in globals.css) on the handful of
 * elements that carry the display treatment: the hero title, section headings,
 * the price, the vendor name and any vendor message.
 */
export const quoteDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--quote-display',
});
