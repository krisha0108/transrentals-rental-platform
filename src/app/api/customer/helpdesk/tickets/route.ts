import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get helpdesk tickets for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const identifier = searchParams.get('identifier');

    if (!customerId && !identifier) {
      return NextResponse.json(
        { success: false, tickets: [], message: 'Customer ID or identifier required' },
        { status: 400 }
      );
    }

    // Find customer if identifier provided
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && identifier) {
      const customer = await prisma.customers.findFirst({
        where: {
          OR: [
            { phone: identifier },
            { email: identifier },
          ],
        },
        select: { id: true },
      });
      resolvedCustomerId = customer?.id || null;
    }

    if (!resolvedCustomerId) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    // Get tickets for this customer
    const tickets = await prisma.helpdesk_tickets.findMany({
      where: {
        customerId: resolvedCustomerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Transform to expected format
    const transformedTickets = tickets.map((ticket) => {
      // Handle images - can be a single path or JSON array
      let imagePath = null;
      if (ticket.images) {
        try {
          const parsed = JSON.parse(ticket.images);
          // If it's an array, take the first image
          imagePath = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ticket.images;
        } catch {
          // Not JSON, treat as a single path
          imagePath = ticket.images;
        }
      }

      return {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority,
        image: imagePath,
        images: ticket.images,
        booking_id: ticket.bookingId,
        resolution: ticket.resolution,
        resolvedAt: ticket.resolvedAt?.toISOString() || null,
        resolvedBy: ticket.resolvedBy,
        created_at: ticket.createdAt.toISOString(),
        updated_at: ticket.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      tickets: transformedTickets,
    });
  } catch (error) {
    logger.error('Get helpdesk tickets error', error);
    return NextResponse.json(
      { success: false, tickets: [], message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new helpdesk ticket
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let data: any;
    let imagePaths: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data = {
        customer_id: formData.get('customer_id'),
        heading: formData.get('heading'),
        problem: formData.get('problem'),
        booking_id: formData.get('booking_id'),
        booking_type: formData.get('booking_type'),
      };

      // Handle image uploads
      const imageFiles = formData.getAll('images[]');
      if (imageFiles && imageFiles.length > 0) {
        const { writeFile, mkdir } = await import('fs/promises');
        const { join } = await import('path');
        const { nanoid } = await import('nanoid');

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'helpdesk');

        // Ensure upload directory exists
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (err) {
          // Directory might already exist
        }

        // Upload each image
        for (const file of imageFiles) {
          if (file && typeof file !== 'string' && file instanceof File && file.size > 0) {
            try {
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);

              const ext = file.name.split('.').pop() || 'jpg';
              const filename = `ticket-${nanoid()}.${ext}`;
              const filepath = join(uploadDir, filename);

              await writeFile(filepath, buffer);
              imagePaths.push(`uploads/helpdesk/${filename}`);
            } catch (uploadError) {
              logger.error('Image upload error', uploadError);
            }
          }
        }
      }
    } else {
      data = await request.json();
    }

    const { customer_id, heading, problem, booking_id, booking_type } = data;

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

    // Generate ticket number
    const ticketCount = await prisma.helpdesk_tickets.count();
    const ticketNo = `TKT${String(ticketCount + 1).padStart(6, '0')}`;

    // Generate ID
    const { nanoid } = await import('nanoid');
    const ticketId = nanoid();

    // Create ticket
    const ticket = await prisma.helpdesk_tickets.create({
      data: {
        id: ticketId,
        ticketNo,
        customerId: customer_id,
        heading,
        problem,
        bookingId: booking_id || null,
        bookingType: booking_type || null,
        status: 'OPEN',
        priority: 'NORMAL',
        images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        images: ticket.images,
        created_at: ticket.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Create helpdesk ticket error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
