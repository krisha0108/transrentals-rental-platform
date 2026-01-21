import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * POST - Create a new helpdesk ticket with optional image upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const customer_id = formData.get('customer_id') as string;
    const heading = formData.get('heading') as string;
    const problem = formData.get('problem') as string;
    const booking_id = formData.get('booking_id') as string | null;
    const booking_type = formData.get('booking_type') as string | null;
    const imageFile = formData.get('image') as File | null;

    // Validate required fields
    if (!customer_id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!heading || !problem) {
      return NextResponse.json(
        { success: false, message: 'Heading and problem description are required' },
        { status: 400 }
      );
    }

    // Handle image upload
    let imagePath: string | null = null;
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const filename = `ticket-${nanoid()}.${ext}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'helpdesk');

        // Ensure upload directory exists
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (err) {
          // Directory might already exist
        }

        // Save file
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Store relative path in database
        imagePath = `uploads/helpdesk/${filename}`;
      } catch (uploadError) {
        logger.error('Image upload error', uploadError);
        // Continue without image if upload fails
      }
    }

    // Generate ticket number
    const ticketCount = await prisma.helpdesk_tickets.count();
    const ticketNo = `TKT${String(ticketCount + 1).padStart(6, '0')}`;

    // Create ticket
    const ticket = await prisma.helpdesk_tickets.create({
      data: {
        id: nanoid(),
        ticketNo,
        customerId: customer_id,
        heading,
        problem,
        bookingId: booking_id || null,
        bookingType: booking_type || null,
        status: 'OPEN',
        priority: 'NORMAL',
        images: imagePath,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket submitted successfully!',
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        image: ticket.images,
        created_at: ticket.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Create helpdesk ticket error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create ticket', details: error?.message },
      { status: 500 }
    );
  }
}
