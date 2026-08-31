// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import {
  AGREEMENT_TITLE, AGREEMENT_SUBTITLE, AGREEMENT_DISCLAIMER, AGREEMENT_VERSION,
  AGREEMENT_PARTIES, AGREEMENT_SECTIONS, COVERAGE_HIGHLIGHTS, termDescription,
} from '@/lib/content/partnership-agreement';

const LOGO_PATH = path.join(process.cwd(), 'public', 'assets', 'logo-white.png');
// Real aspect ratio of logo-white.png (3358x591) — used to size it without distortion.
const LOGO_ASPECT = 591 / 3358;

export const dynamic = 'force-dynamic';

// GET — download the current agreement as a clean, agreement-only PDF.
// Always generated fresh from the same content module the web pages use,
// so it can never drift out of sync with what's shown on-screen. If the
// vendor has already signed, their signature details are filled in;
// otherwise the signature block is left blank for reference.
export async function GET(request: NextRequest) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [signature, vendor] = await Promise.all([
    (prisma as any).vendor_partnership_agreements.findFirst({
      where: { vendorId: auth.vendorId, agreementVersion: AGREEMENT_VERSION },
      orderBy: { acceptedAt: 'desc' },
    }),
    prisma.vendors.findUnique({ where: { id: auth.vendorId }, select: { businessName: true, vid: true } }),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let y = 0;

  const PRIMARY = [5, 107, 62];
  const AMBER = [180, 83, 9];
  const AMBER_BG = [255, 251, 235];
  const SLATE_900 = [15, 23, 42];
  const SLATE_600 = [71, 85, 105];
  const SLATE_400 = [148, 163, 184];

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  }

  function paragraph(text: string, opts: any = {}) {
    const { fontSize = 10, color = SLATE_600, bold = false, lineHeight = 5, gapAfter = 3, indent = 0 } = opts;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    ensureSpace(lines.length * lineHeight + gapAfter);
    doc.text(lines, marginX + indent, y);
    y += lines.length * lineHeight + gapAfter;
  }

  function sectionHeading(text: string) {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...SLATE_900);
    doc.text(text, marginX, y);
    y += 7;
  }

  function hr() {
    ensureSpace(6);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  }

  /* Letterhead */
  const HEADER_HEIGHT = 52;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

  const logoWidth = 52;
  const logoHeight = logoWidth * LOGO_ASPECT;
  try {
    const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', marginX, 9, logoWidth, logoHeight);
  } catch {
    // Falls back to text-only header if the logo asset is unreadable.
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TRANSRENTALS', marginX, 18);
  }

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(marginX, 9 + logoHeight + 5, pageWidth - marginX, 9 + logoHeight + 5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(doc.splitTextToSize(AGREEMENT_TITLE, contentWidth), marginX, 9 + logoHeight + 12);

  y = HEADER_HEIGHT + 9;

  paragraph(AGREEMENT_SUBTITLE, { fontSize: 10, color: SLATE_600, gapAfter: 2 });
  const preparedFor = vendor?.businessName
    ? `Prepared for: ${vendor.businessName}${vendor.vid ? ` (${vendor.vid.toUpperCase()})` : ''}`
    : null;
  if (preparedFor) {
    paragraph(preparedFor, { fontSize: 9, bold: true, color: SLATE_900, gapAfter: 1 });
  }
  paragraph(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
    fontSize: 8.5, color: SLATE_400, gapAfter: 5,
  });

  /* Disclaimer */
  ensureSpace(16);
  doc.setFillColor(...AMBER_BG);
  const discLines = doc.splitTextToSize(`IMPORTANT: ${AGREEMENT_DISCLAIMER}`, contentWidth - 8);
  const discHeight = discLines.length * 4.6 + 6;
  doc.roundedRect(marginX, y, contentWidth, discHeight, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...AMBER);
  doc.text(discLines, marginX + 4, y + 5.5);
  y += discHeight + 6;

  /* Coverage highlights */
  sectionHeading('What This Agreement Covers');
  COVERAGE_HIGHLIGHTS.forEach(({ label, value, detail }) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...PRIMARY);
    doc.text(label.toUpperCase(), marginX, y);
    doc.setFontSize(10.5);
    doc.setTextColor(...SLATE_900);
    doc.text(value, marginX + 62, y);
    y += 5;
    paragraph(detail, { fontSize: 8.5, color: SLATE_400, gapAfter: 4, lineHeight: 4 });
  });
  hr();

  /* Term (if signed, use the actual agreed term; else the default description) */
  sectionHeading('Agreement Term');
  paragraph(termDescription(signature?.termMonths || 12), { gapAfter: 6 });

  /* Parties */
  paragraph(AGREEMENT_PARTIES.intro, { gapAfter: 2 });
  paragraph(`1. ${AGREEMENT_PARTIES.transrentals}`, { indent: 4, gapAfter: 2 });
  paragraph(`2. ${AGREEMENT_PARTIES.vendor}`, { indent: 4, gapAfter: 2 });
  paragraph(AGREEMENT_PARTIES.closing, { gapAfter: 6 });

  /* Clauses */
  AGREEMENT_SECTIONS.forEach((section) => {
    ensureSpace(14);
    sectionHeading(section.title);
    section.paras.forEach((p) => paragraph(p, { gapAfter: 3 }));
    y += 2;
  });

  /* Signature */
  ensureSpace(70);
  hr();
  sectionHeading('Signature');

  if (signature) {
    paragraph(
      `Digitally signed by ${signature.signedByName}${signature.signedByTitle ? `, ${signature.signedByTitle}` : ''} on ` +
      `${new Date(signature.acceptedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} ` +
      `(Agreement ${signature.agreementVersion}).`,
      { bold: true, color: PRIMARY, gapAfter: 3 }
    );
    if (signature.queryNote) {
      paragraph(`Vendor query at signing: "${signature.queryNote}"`, { fontSize: 9, color: SLATE_400, gapAfter: 3 });
    }
  } else {
    paragraph('This agreement has not yet been digitally signed on the TransRentals vendor dashboard.', { gapAfter: 6 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...SLATE_600);
    doc.text('Name:', marginX, y);
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX + 20, y, marginX + 90, y);
    y += 9;
    doc.text('Designation:', marginX, y);
    doc.line(marginX + 26, y, marginX + 90, y);
    y += 9;
    doc.text('Signature:', marginX, y);
    doc.line(marginX + 22, y, marginX + 90, y);
    y += 9;
    doc.text('Date:', marginX, y);
    doc.line(marginX + 16, y, marginX + 90, y);
    y += 9;
  }

  y += 4;
  paragraph(
    'This document is a starting draft prepared for TransRentals and has not been reviewed by a lawyer. ' +
    'Have it checked by legal counsel before relying on it.',
    { fontSize: 8, color: SLATE_400, gapAfter: 0 }
  );

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_400);
    doc.text(`${AGREEMENT_TITLE} — Page ${i} of ${pageCount}`, marginX, pageHeight - 10);
  }

  const buffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="TransRentals-Vendor-Agreement-${AGREEMENT_VERSION}.pdf"`,
      'Content-Length': String(buffer.length),
    },
  });
}
