import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

/**
 * GET - Get single helpdesk ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ticket = await prisma.helpdesk_tickets.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        image: imagePath,
        images: ticket.images, // Keep original for web app
        booking_id: ticket.bookingId,
        resolution: ticket.resolution,
        created_at: ticket.createdAt.toISOString(),
        updated_at: ticket.updatedAt.toISOString(),
        customer: ticket.customers,
      },
    });
  } catch (error) {
    logger.error('Get helpdesk ticket error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update helpdesk ticket
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      data = {
        heading: formData.get('heading'),
        problem: formData.get('problem'),
        booking_id: formData.get('booking_id'),
      };

      // Handle keep_images for existing images
      const keepImages = formData.getAll('keep_images[]');
      const existingImages = keepImages.filter(img => typeof img === 'string' && img);

      // Handle new image uploads
      const imageFiles = formData.getAll('images[]');
      const newImagePaths: string[] = [];

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

        // Upload each new image
        for (const file of imageFiles) {
          if (file && typeof file !== 'string' && file instanceof File && file.size > 0) {
            try {
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);

              const ext = file.name.split('.').pop() || 'jpg';
              const filename = `ticket-${nanoid()}.${ext}`;
              const filepath = join(uploadDir, filename);

              await writeFile(filepath, buffer);
              newImagePaths.push(`uploads/helpdesk/${filename}`);
            } catch (uploadError) {
              logger.error('Image upload error during update', uploadError);
            }
          }
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImagePaths];
      if (allImages.length > 0) {
        data.images = JSON.stringify(allImages);
      }
    } else {
      data = await request.json();
    }

    // Check if ticket exists
    const existingTicket = await prisma.helpdesk_tickets.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (data.heading) updateData.heading = data.heading;
    if (data.problem) updateData.problem = data.problem;
    if (data.booking_id !== undefined) updateData.bookingId = data.booking_id || null;
    if (data.images !== undefined) updateData.images = data.images;

    // Update ticket
    const ticket = await prisma.helpdesk_tickets.update({
      where: { id },
      data: updateData,
    });

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

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: {
        id: ticket.id,
        ticket_no: ticket.ticketNo,
        heading: ticket.heading,
        problem: ticket.problem,
        status: ticket.status.toLowerCase(),
        image: imagePath,
        images: ticket.images, // Keep original for web app
        booking_id: ticket.bookingId,
        created_at: ticket.createdAt.toISOString(),
        updated_at: ticket.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Update helpdesk ticket error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
