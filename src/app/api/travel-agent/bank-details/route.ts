import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.travel_agent_bank_accounts.findMany({
      where: { travelAgentId: auth.travelAgentId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    logger.error('List travel agent bank accounts error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      accountType,
      branchName,
      upiId,
      isPrimary,
    } = body;

    if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
      return NextResponse.json(
        { error: 'bankName, accountHolderName, accountNumber, and ifscCode are required' },
        { status: 400 },
      );
    }

    if (isPrimary) {
      // demote existing primary accounts
      await prisma.travel_agent_bank_accounts.updateMany({
        where: { travelAgentId: auth.travelAgentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const account = await prisma.travel_agent_bank_accounts.create({
      data: {
        travelAgentId: auth.travelAgentId,
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountType: accountType || 'SAVINGS',
        branchName: branchName || null,
        upiId: upiId || null,
        isPrimary: !!isPrimary,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent bank account error', error);
    return NextResponse.json(
      { error: 'Failed to add bank account', details: error?.message },
      { status: 500 },
    );
  }
}

// PATCH — set an existing account as primary (demotes others). Avoids the
// duplicate-row problem of re-POSTing to flip primary.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Account id is required' }, { status: 400 });
    }

    const account = await prisma.travel_agent_bank_accounts.findUnique({ where: { id } });
    if (!account || account.travelAgentId !== auth.travelAgentId || !account.isActive) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.travel_agent_bank_accounts.updateMany({
        where: { travelAgentId: auth.travelAgentId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.travel_agent_bank_accounts.update({ where: { id }, data: { isPrimary: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Set primary travel agent bank account error', error);
    return NextResponse.json(
      { error: 'Failed to set primary account', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Account id is required' }, { status: 400 });
    }

    const account = await prisma.travel_agent_bank_accounts.findUnique({ where: { id } });
    if (!account || account.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // Soft delete via isActive flag — keeps audit trail
    await prisma.travel_agent_bank_accounts.update({
      where: { id },
      data: { isActive: false, isPrimary: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete travel agent bank account error', error);
    return NextResponse.json(
      { error: 'Failed to remove bank account', details: error?.message },
      { status: 500 },
    );
  }
}
