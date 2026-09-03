// Builds the decorative "Vendor Agreement Certificate" — a shareable,
// framed certificate a vendor can put up rather than the plain legal-style
// agreement PDF (src/lib/pdf/partnership-agreement-pdf.ts, which stays
// untouched and remains the primary download). Only offered once a manager
// has accepted the vendor's signature, since the certificate is itself a
// statement of that acceptance.
// @ts-nocheck
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const LOGO_PATH = path.join(process.cwd(), 'public', 'assets', 'logo-trans.png');
const LOGO_ASPECT = 235 / 1180;

const GREEN_DARK = [12, 58, 41];
const GREEN = [21, 128, 61];
const GREEN_BRIGHT = [34, 197, 94];
const GOLD = [180, 140, 45];
const INK = [24, 24, 24];
const MUTED = [90, 96, 92];
const FAINT = [140, 145, 141];
const WHITE = [255, 255, 255];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatCertDate(d: Date): string {
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCertDateTime(d: Date): string {
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${formatCertDate(d)}, ${time}`;
}

export function buildAgreementCertificatePdf(
  agreement: {
    signedByName: string;
    agreementVersion: string;
    termMonths: number;
    acceptedAt: string | Date;
    reviewedAt?: string | Date | null;
  },
  vendor: { businessName?: string | null; vid?: string | null } | null,
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cx = pageWidth / 2;

  let logoData: string | null = null;
  try {
    logoData = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  } catch {
    logoData = null;
  }

  /* ═══ Decorative corners (drawn first, frame + content go on top) ═══ */
  // Top-right
  doc.setFillColor(...GREEN_DARK);
  doc.triangle(pageWidth * 0.60, 0, pageWidth, 0, pageWidth, pageHeight * 0.30, 'F');
  doc.setFillColor(...GREEN_BRIGHT);
  doc.triangle(pageWidth * 0.70, 0, pageWidth, 0, pageWidth, pageHeight * 0.19, 'F');
  // Small white logo-mark chip inside the dark corner
  doc.setFillColor(...WHITE);
  doc.roundedRect(pageWidth - 40, 16, 22, 22, 3, 3, 'F');
  doc.setFillColor(...GREEN);
  doc.triangle(pageWidth - 35, 34, pageWidth - 35, 20, pageWidth - 21, 20, 'F');
  doc.setFillColor(...WHITE);
  doc.triangle(pageWidth - 33, 32, pageWidth - 33, 22, pageWidth - 23, 22, 'F');

  // Bottom-left / bottom-right, feeding into the footer bar
  doc.setFillColor(...GREEN_DARK);
  doc.triangle(0, pageHeight, 0, pageHeight - 34, pageWidth * 0.22, pageHeight, 'F');
  doc.triangle(pageWidth, pageHeight, pageWidth, pageHeight - 34, pageWidth * 0.78, pageHeight, 'F');
  doc.setFillColor(...GREEN_BRIGHT);
  doc.triangle(0, pageHeight, 0, pageHeight - 20, pageWidth * 0.13, pageHeight, 'F');
  doc.triangle(pageWidth, pageHeight, pageWidth, pageHeight - 20, pageWidth * 0.87, pageHeight, 'F');

  /* ═══ Frame ═══ */
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.7);
  doc.roundedRect(7, 7, pageWidth - 14, pageHeight - 14, 2, 2, 'S');
  doc.setDrawColor(...GREEN_BRIGHT);
  doc.setLineWidth(0.25);
  doc.roundedRect(9.5, 9.5, pageWidth - 19, pageHeight - 19, 2, 2, 'S');

  /* ═══ Footer bar ═══ */
  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  const footerParts = ['www.transrentals.in', '+91 9898438967', 'support@transrentals.in', 'India'];
  const footerGap = 8;
  doc.setFont('helvetica', 'normal');
  const widths = footerParts.map((p) => doc.getTextWidth(p));
  const dividerW = doc.getTextWidth('   |   ');
  const totalW = widths.reduce((a, b) => a + b, 0) + dividerW * (footerParts.length - 1);
  let fx = cx - totalW / 2;
  footerParts.forEach((part, i) => {
    doc.text(part, fx, pageHeight - 6.5);
    fx += widths[i];
    if (i < footerParts.length - 1) {
      doc.text('   |   ', fx, pageHeight - 6.5);
      fx += dividerW;
    }
  });

  let y = 22;

  /* ═══ Letterhead ═══ */
  if (logoData) {
    const lw = 48;
    doc.addImage(logoData, 'PNG', 20, y, lw, lw * LOGO_ASPECT);
    y += lw * LOGO_ASPECT + 3;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...GREEN);
    doc.text('TransRentals', 20, y + 8);
    y += 13;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('RELIABLE VEHICLES. TRUSTED PARTNERS.', 20, y);
  y += 3;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(20, y, 62, y);
  y += 14;

  /* ═══ Ornamental divider ═══ */
  function ornament(yy: number) {
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.3);
    doc.line(cx - 55, yy, cx - 6, yy);
    doc.line(cx + 6, yy, cx + 55, yy);
    doc.setFillColor(...GREEN_BRIGHT);
    doc.circle(cx, yy, 1.4, 'F');
  }
  ornament(y);
  y += 12;

  /* ═══ Title ═══ */
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...GREEN_DARK);
  doc.text('VENDOR AGREEMENT', cx, y, { align: 'center' });
  y += 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...GREEN);
  const certLabel = 'C E R T I F I C A T E';
  const certW = doc.getTextWidth(certLabel);
  doc.text(certLabel, cx, y, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(cx - certW / 2 - 14, y - 1.3, cx - certW / 2 - 3, y - 1.3);
  doc.line(cx + certW / 2 + 3, y - 1.3, cx + certW / 2 + 14, y - 1.3);
  y += 14;

  /* ═══ Certify line ═══ */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text('THIS IS TO CERTIFY THAT', cx, y, { align: 'center' });
  y += 13;

  /* ═══ Vendor name ═══ */
  const vendorLabel = agreement.signedByName;
  doc.setFont('times', 'italic');
  doc.setFontSize(27);
  doc.setTextColor(...GREEN_DARK);
  doc.text(vendorLabel, cx, y, { align: 'center' });
  const nameW = doc.getTextWidth(vendorLabel);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.3);
  doc.line(cx - Math.max(nameW / 2, 30) - 6, y + 4, cx + Math.max(nameW / 2, 30) + 6, y + 4);
  y += 14;

  /* ═══ Body paragraph ═══ */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  doc.text('has successfully accepted and complied with the', cx, y, { align: 'center' });
  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN_DARK);
  doc.text('TransRentals Vendor Partnership, Service & Settlement Agreement', cx, y, { align: 'center' });
  y += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('and is an authorized vendor partner on the TransRentals platform.', cx, y, { align: 'center' });
  y += 16;

  /* ═══ 4-column stat block ═══ */
  const acceptedAt = new Date(agreement.acceptedAt);
  const cols = [
    {
      label: 'VENDOR ID',
      value: vendor?.vid ? vendor.vid.toUpperCase() : '—',
      detail: 'Unique reference for\nthis vendor partnership\non TransRentals.',
      icon: 'id',
    },
    {
      label: 'EFFECTIVE DATE',
      value: formatCertDate(acceptedAt),
      detail: 'Agreement is effective\nfrom the above date.',
      icon: 'calendar',
    },
    {
      label: 'AGREEMENT TERM',
      value: `${agreement.termMonths} Months`,
      detail: `This agreement is valid\nfor a period of ${agreement.termMonths} months\nfrom the effective date.`,
      icon: 'clock',
    },
    {
      label: 'STATUS',
      value: 'Accepted',
      detail: 'Vendor has reviewed,\naccepted and agreed to\nthe terms & conditions.',
      icon: 'handshake',
    },
  ];
  const blockTop = y;
  const contentW = pageWidth - 40;
  const colW = contentW / 4;
  const iconY = blockTop + 8;

  cols.forEach((col, i) => {
    const colCx = 20 + colW * i + colW / 2;
    if (i > 0) {
      doc.setDrawColor(...GREEN_BRIGHT);
      doc.setLineWidth(0.25);
      doc.line(20 + colW * i, blockTop, 20 + colW * i, blockTop + 46);
    }

    // Icon badge
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.circle(colCx, iconY, 6, 'S');
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    if (col.icon === 'id') {
      doc.rect(colCx - 3.8, iconY - 2.7, 7.6, 5.4, 'S');
      doc.circle(colCx - 1.7, iconY - 0.5, 0.9, 'S');
      doc.line(colCx + 0.3, iconY - 1.2, colCx + 2.4, iconY - 1.2);
      doc.line(colCx + 0.3, iconY + 0.3, colCx + 2.4, iconY + 0.3);
    } else if (col.icon === 'shield') {
      doc.line(colCx - 2.5, iconY, colCx - 0.5, iconY + 2.2);
      doc.line(colCx - 0.5, iconY + 2.2, colCx + 3, iconY - 2.2);
    } else if (col.icon === 'calendar') {
      doc.rect(colCx - 3.5, iconY - 2.5, 7, 5.5, 'S');
      doc.line(colCx - 3.5, iconY - 0.7, colCx + 3.5, iconY - 0.7);
    } else if (col.icon === 'clock') {
      doc.line(colCx, iconY, colCx, iconY - 3);
      doc.line(colCx, iconY, colCx + 2.3, iconY + 1);
    } else {
      doc.line(colCx - 3.5, iconY - 1.5, colCx, iconY + 1.5);
      doc.line(colCx, iconY + 1.5, colCx + 3.5, iconY - 1.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    doc.text(col.label, colCx, iconY + 12, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...GREEN);
    doc.text(col.value, colCx, iconY + 18.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...FAINT);
    const detailLines = col.detail.split('\n');
    detailLines.forEach((line, li) => {
      doc.text(line, colCx, iconY + 24 + li * 3.4, { align: 'center' });
    });
  });

  y = blockTop + 52;

  /* ═══ Ornamental divider ═══ */
  ornament(y);
  y += 10;

  /* ═══ Closing paragraph ═══ */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const closing = doc.splitTextToSize(
    "This certificate acknowledges the vendor's commitment to provide quality services, " +
    'maintain legal compliance, and uphold the service standards of TransRentals.',
    contentW - 20,
  );
  closing.forEach((line: string, i: number) => {
    doc.text(line, cx, y + i * 5, { align: 'center' });
  });
  y += closing.length * 5 + 14;

  /* ═══ Signature row ═══ */
  const sigY = Math.min(y, pageHeight - 60);
  const leftCx = 20 + contentW * 0.18;
  const rightCx = 20 + contentW * 0.82;

  // Vendor signature (left)
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...GREEN_DARK);
  doc.text(agreement.signedByName, leftCx, sigY, { align: 'center' });
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(leftCx - 32, sigY + 4, leftCx + 32, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(agreement.signedByName.toUpperCase(), leftCx, sigY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...FAINT);
  doc.text('Authorized Signatory', leftCx, sigY + 13.5, { align: 'center' });

  // Gold seal (center)
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.circle(cx, sigY - 2, 15, 'S');
  doc.setLineWidth(0.25);
  doc.circle(cx, sigY - 2, 12.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD);
  doc.text('TRUST', cx, sigY - 5, { align: 'center' });
  doc.text('COMMITMENT', cx, sigY - 1.5, { align: 'center' });
  doc.text('PARTNERSHIP', cx, sigY + 2, { align: 'center' });
  // Tiny star below the seal text, approximated as two overlapping triangles
  doc.setFillColor(...GOLD);
  const starCx = cx, starCy = sigY + 7, starR = 2.2;
  doc.triangle(starCx, starCy - starR, starCx - starR * 0.95, starCy + starR * 0.6, starCx + starR * 0.95, starCy + starR * 0.6, 'F');
  doc.triangle(starCx, starCy + starR, starCx - starR * 0.95, starCy - starR * 0.6, starCx + starR * 0.95, starCy - starR * 0.6, 'F');

  // TransRentals acceptance signature (right)
  doc.setFont('times', 'italic');
  doc.setFontSize(15);
  doc.setTextColor(...GREEN_DARK);
  doc.text('TransRentals', rightCx, sigY, { align: 'center' });
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(rightCx - 32, sigY + 4, rightCx + 32, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('ACCEPTED BY TRANSRENTALS', rightCx, sigY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...FAINT);
  const acceptedDate = agreement.reviewedAt ? new Date(agreement.reviewedAt) : acceptedAt;
  doc.text(formatCertDateTime(acceptedDate), rightCx, sigY + 13.5, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
