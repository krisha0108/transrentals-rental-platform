// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

// POST /api/customer/wander-quote-requests/[id]/payment-proof
// FormData: txnId (required), note (optional), files[] (1-5 images)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await (prisma as any).travel_agent_leads.findUnique({
      where: { id: params.id },
    });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    if (!lead.customerAcceptedAt) {
      return NextResponse.json(
        { error: 'Please accept the quote before submitting payment proof' },
        { status: 400 },
      );
    }
    if (lead.paymentStatus === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Payment is already verified for this booking' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const txnId = ((formData.get('txnId') as string) || '').trim();
    const note = ((formData.get('note') as string) || '').trim();
    const files = formData.getAll('files') as File[];

    const validFiles = files.filter((f) => f && typeof f !== 'string') as File[];

    // Either transaction ID or at least one screenshot is required (or both).
    if (!txnId && validFiles.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a transaction ID or upload a payment screenshot' },
        { status: 400 },
      );
    }
    if (txnId && (txnId.length < 4 || txnId.length > 64)) {
      return NextResponse.json(
        { error: 'Transaction ID must be 4–64 characters' },
        { status: 400 },
      );
    }
    if (validFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `At most ${MAX_FILES} images can be uploaded` },
        { status: 400 },
      );
    }

    // Save uploaded images (if any)
    const uploadedUrls: string[] = [];
    if (validFiles.length > 0) {
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'lead-payments',
        lead.id,
      );
      await mkdir(uploadDir, { recursive: true });

      for (const f of validFiles) {
        if (!ALLOWED_TYPES.includes(f.type)) {
          return NextResponse.json(
            { error: `Unsupported file type: ${f.type}` },
            { status: 400 },
          );
        }
        if (f.size > MAX_BYTES) {
          return NextResponse.json(
            { error: `File too large (max 5 MB): ${f.name}` },
            { status: 400 },
          );
        }
        const ts = Date.now();
        const safe = (f.name || 'proof').replace(/[^a-zA-Z0-9.-]/g, '-');
        const ext = path.extname(safe) || '.jpg';
        const base = path.basename(safe, ext).slice(0, 40) || 'proof';
        const fileName = `${base}-${ts}-${Math.random().toString(36).slice(2, 6)}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        const bytes = await f.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
        uploadedUrls.push(`/uploads/lead-payments/${lead.id}/${fileName}`);
      }
    }

    // Merge with any existing images so re-submissions append, don't replace
    let existingImages: string[] = [];
    try {
      existingImages = lead.paymentProofImages
        ? JSON.parse(lead.paymentProofImages)
        : [];
      if (!Array.isArray(existingImages)) existingImages = [];
    } catch {
      existingImages = [];
    }
    const combined = [...existingImages, ...uploadedUrls].slice(-MAX_FILES);

    const updated = await (prisma as any).travel_agent_leads.update({
      where: { id: lead.id },
      data: {
        paymentTxnId: txnId || lead.paymentTxnId || null,
        paymentNote: note || null,
        paymentProofImages: combined.length ? JSON.stringify(combined) : null,
        paymentSubmittedAt: new Date(),
        paymentStatus: 'SUBMITTED',
        // Bump status so the agent sees it in their pipeline
        status: lead.status === 'BOOKED' ? lead.status : 'NEGOTIATING',
      },
    });

    await (prisma as any).travel_agent_lead_notes.create({
      data: {
        leadId: lead.id,
        note:
          `💸 Customer submitted payment proof.` +
          (txnId ? `\nTxn ID: ${txnId}` : '') +
          (note ? `\nNote: ${note}` : '') +
          (uploadedUrls.length ? `\nImages: ${uploadedUrls.length}` : '') +
          (!txnId && uploadedUrls.length ? '\n(no txn id — proof via screenshot only)' : ''),
      },
    });

    await notifyTravelAgent(lead.travelAgentId, {
      type: 'PAYMENT',
      title: 'Payment proof submitted',
      body: `${lead.customerName} submitted payment proof${txnId ? ` (Txn: ${txnId})` : ''}. Verify when ready.`,
      link: `/travel-agent/leads/${lead.id}`,
      metadata: { leadId: lead.id, txnId: txnId || null, imageCount: uploadedUrls.length },
    });

    return NextResponse.json({
      success: true,
      paymentStatus: updated.paymentStatus,
      paymentTxnId: updated.paymentTxnId,
      paymentSubmittedAt: updated.paymentSubmittedAt,
      images: combined,
    });
  } catch (error: any) {
    console.error('[Lead payment proof]', error);
    return NextResponse.json(
      { error: 'Failed to submit payment proof', details: error?.message },
      { status: 500 },
    );
  }
}
