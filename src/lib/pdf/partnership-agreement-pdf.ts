// Builds the vendor partnership agreement PDF.
//
// Deliberately plain: black text on white, a TransRentals letterhead and a
// faint brand watermark behind the page — no accent colours, no summary
// cards. It is meant to read as a printable legal document rather than as a
// copy of the dashboard screen.
//
// Kept out of the route file because Next's App Router only allows the
// HTTP-verb exports there — and having it standalone means the document can
// be generated (and eyeballed) without spinning up auth or the DB. All
// wording comes from the shared content module, so the download can never
// drift out of sync with the on-screen agreement.
// @ts-nocheck
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import {
  AGREEMENT_TITLE, AGREEMENT_SUBTITLE, AGREEMENT_VERSION,
  AGREEMENT_PARTIES, AGREEMENT_SECTIONS, termDescription,
} from '@/lib/content/partnership-agreement';

const LOGO_PATH = path.join(process.cwd(), 'public', 'assets', 'logo-trans.png');
// Real pixel size of logo-trans.png (1180x235) — keeps it from being stretched.
const LOGO_ASPECT = 235 / 1180;

// Greyscale only. The logo is the one thing that keeps its own colour.
const BLACK = [0, 0, 0];
const INK = [26, 26, 26];
const MUTED = [102, 102, 102];
const FAINT = [140, 140, 140];
const RULE = [200, 200, 200];
const RULE_SOFT = [225, 225, 225];

export function buildAgreementPdf(
  signature: any | null,
  vendor: { businessName?: string | null; vid?: string | null } | null,
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  const BOTTOM = pageHeight - 20;
  let y = 0;

  let logoData: string | null = null;
  try {
    logoData = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  } catch {
    logoData = null;
  }

  /* Faint tilted brand mark behind the text, on every page. */
  function watermark() {
    if (!logoData) return;
    try {
      const w = 168;
      const h = w * LOGO_ASPECT;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.addImage(logoData, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h, undefined, 'FAST', -12);
      doc.restoreGraphicsState();
    } catch {
      // A missing or unreadable logo just means no watermark — never fatal.
    }
  }

  function newPage() {
    doc.addPage();
    watermark();
    y = 22;
  }

  function ensureSpace(needed: number) {
    if (y + needed > BOTTOM) newPage();
  }

  function textAt(text: string, x: number, yy: number, opts: any = {}) {
    const { size = 10, color = INK, style = 'normal', font = 'helvetica', align = 'left' } = opts;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(text, x, yy, align === 'left' ? undefined : { align });
  }

  // Flowing paragraph that breaks across pages.
  function paragraph(text: string, opts: any = {}) {
    const {
      size = 9.5, color = INK, style = 'normal', font = 'times',
      lineHeight = 5, gapAfter = 3, indent = 0, width = contentWidth - indent,
    } = opts;
    doc.setFont(font, style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.setFont(font, style);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    });
    y += gapAfter;
  }

  function rule(color = RULE_SOFT, weight = 0.3, gapBefore = 0, gapAfter = 6) {
    y += gapBefore;
    ensureSpace(gapAfter + 1);
    doc.setDrawColor(...color);
    doc.setLineWidth(weight);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += gapAfter;
  }

  /* ═══ Letterhead ═══ */
  watermark();
  y = 20;

  if (logoData) {
    const lw = 46;
    doc.addImage(logoData, 'PNG', marginX, y, lw, lw * LOGO_ASPECT);
  } else {
    textAt('TRANSRENTALS', marginX, y + 6, { size: 14, color: BLACK, style: 'bold' });
  }
  textAt('OFFICIAL VENDOR AGREEMENT', marginX + contentWidth, y + 3.5, {
    size: 7.5, color: MUTED, style: 'bold', align: 'right',
  });
  textAt(`Version ${AGREEMENT_VERSION}`, marginX + contentWidth, y + 8, {
    size: 8, color: FAINT, align: 'right',
  });
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  const title = doc.splitTextToSize(AGREEMENT_TITLE, contentWidth);
  doc.text(title, marginX, y);
  y += title.length * 6 + 2.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const sub = doc.splitTextToSize(AGREEMENT_SUBTITLE, contentWidth);
  doc.text(sub, marginX, y);
  y += sub.length * 4.6 + 3;

  // Heavy letterhead rule
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 6;

  /* Prepared for / generated on */
  const preparedFor = vendor?.businessName
    ? `Prepared for ${vendor.businessName}${vendor.vid ? ` (${vendor.vid.toUpperCase()})` : ''}`
    : null;
  if (preparedFor) {
    textAt(preparedFor, marginX, y, { size: 9, color: BLACK, style: 'bold' });
  }
  textAt(
    `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    marginX + contentWidth, y, { size: 8, color: FAINT, align: 'right' },
  );
  y += 10;

  /* Signed confirmation — plain, boxed, no colour */
  if (signature) {
    const noteLines = signature.queryNote
      ? doc.splitTextToSize(`Vendor query at signing: "${signature.queryNote}"`, contentWidth - 10)
      : [];
    const signH = 20 + (noteLines.length ? noteLines.length * 4.3 + 4 : 0);
    ensureSpace(signH + 8);

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.rect(marginX, y, contentWidth, signH, 'S');

    textAt('DIGITALLY SIGNED', marginX + 5, y + 6, { size: 7.5, color: MUTED, style: 'bold' });
    textAt(
      `${signature.signedByName}${signature.signedByTitle ? `, ${signature.signedByTitle}` : ''}`,
      marginX + 5, y + 12, { size: 10.5, color: BLACK, style: 'bold' },
    );
    textAt(
      `${new Date(signature.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` +
      ` · Agreement ${signature.agreementVersion} · ${signature.termMonths}-month term`,
      marginX + 5, y + 16.8, { size: 8, color: MUTED },
    );

    // Handwritten-looking signature on the right
    textAt(signature.signedByName, marginX + contentWidth - 5, y + 13.5, {
      size: 17, color: BLACK, style: 'italic', font: 'times', align: 'right',
    });

    if (noteLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(noteLines, marginX + 5, y + 24);
    }
    y += signH + 8;
  }

  /* ═══ Agreement body — serif, like a printed contract ═══ */
  paragraph(AGREEMENT_PARTIES.intro, { gapAfter: 2.5 });
  paragraph(`1.  ${AGREEMENT_PARTIES.transrentals}`, { indent: 6, gapAfter: 2 });
  paragraph(`2.  ${AGREEMENT_PARTIES.vendor}`, { indent: 6, gapAfter: 2 });
  paragraph(AGREEMENT_PARTIES.closing, { gapAfter: 5 });

  AGREEMENT_SECTIONS.forEach((section, i) => {
    ensureSpace(18);
    if (i > 0) rule(RULE_SOFT, 0.3, 0, 6);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    const heading = doc.splitTextToSize(section.title, contentWidth);
    doc.text(heading, marginX, y);
    y += heading.length * 5.2 + 2.5;
    section.paras.forEach((p) => paragraph(p, { gapAfter: 2.5 }));
    y += 2;
  });

  /* Agreement term */
  ensureSpace(26);
  rule(RULE_SOFT, 0.3, 0, 6);
  textAt('Agreement Term', marginX, y, { size: 11, color: BLACK, style: 'bold', font: 'times' });
  y += 6.5;
  paragraph(termDescription(signature?.termMonths || 12), { gapAfter: 6 });

  /* Signature block */
  ensureSpace(signature ? 28 : 66);
  rule(RULE_SOFT, 0.3, 0, 6);
  textAt('Signature', marginX, y, { size: 11, color: BLACK, style: 'bold', font: 'times' });
  y += 7;

  if (signature) {
    paragraph(
      `Digitally signed by ${signature.signedByName}${signature.signedByTitle ? `, ${signature.signedByTitle}` : ''} on ` +
      `${new Date(signature.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ` +
      `(Agreement ${signature.agreementVersion}).`,
      { style: 'bold', color: BLACK, font: 'helvetica', size: 9, gapAfter: 3 },
    );
    if (signature.queryNote) {
      paragraph(`Vendor query at signing: "${signature.queryNote}"`, {
        size: 8.5, color: MUTED, font: 'helvetica', gapAfter: 3,
      });
    }
  } else {
    paragraph('This agreement has not yet been digitally signed on the TransRentals vendor dashboard.', {
      font: 'helvetica', size: 9, color: INK, gapAfter: 7,
    });
    const rows: [string, number][] = [['Name:', 20], ['Designation:', 28], ['Signature:', 24], ['Date:', 16]];
    rows.forEach(([label, off]) => {
      ensureSpace(11);
      textAt(label, marginX, y, { size: 9, color: INK });
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(marginX + off, y + 0.8, marginX + 95, y + 0.8);
      y += 10;
    });
  }

  y += 3;
  paragraph(
    'This document is a starting draft prepared for TransRentals and has not been reviewed by a lawyer. ' +
    'Have it checked by legal counsel before relying on it.',
    { size: 7.5, color: FAINT, font: 'helvetica', lineHeight: 3.8, gapAfter: 0 },
  );

  /* Footer on every page */
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE_SOFT);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...FAINT);
    doc.text(`TransRentals · Vendor Partnership Agreement ${AGREEMENT_VERSION}`, marginX, pageHeight - 9.5);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 9.5, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
