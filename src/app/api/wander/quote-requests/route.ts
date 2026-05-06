// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { generateCustomerId } from '@/lib/utils/id-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, customerId: bodyCustomerId, name, phone, email, password, travelDate, groupSize, pickupLocation, requirements, bookingFor, companyName } = body;

    if (!listingId) return NextResponse.json({ error: 'Tour listing is required' }, { status: 400 });
    if (!travelDate) return NextResponse.json({ error: 'Travel date is required' }, { status: 400 });

    // For guest users (no customerId), validate name/phone/email
    if (!bodyCustomerId) {
      if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      if (!phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Verify listing is active and not expired
    const listing = await (prisma as any).wander_listings.findFirst({
      where: { id: listingId, status: 'ACTIVE' },
    });
    if (!listing) return NextResponse.json({ error: 'Tour not found or unavailable' }, { status: 404 });

    if (listing.tourEndDate) {
      const endDate = new Date(listing.tourEndDate);
      endDate.setHours(23, 59, 59);
      if (endDate < new Date()) {
        return NextResponse.json({ error: 'This tour has ended and is no longer accepting quote requests' }, { status: 400 });
      }
    }

    // Use supplied customerId if the app sent it (logged-in customer), otherwise find/create
    let customer = null;
    if (bodyCustomerId) {
      customer = await prisma.customers.findUnique({ where: { id: bodyCustomerId } });
    }

    const normalizedEmail = email?.trim().toLowerCase() || '';

    if (!customer) {
      // Try matching by email first (since email is required)
      customer = await prisma.customers.findFirst({ where: { email: normalizedEmail } });

      if (customer) {
        // Email already in system. If they have a password, force them to login.
        if (customer.password) {
          return NextResponse.json(
            { error: 'This email is already registered. Please login first to send a quote request.', requiresLogin: true },
            { status: 409 }
          );
        }
        // No password yet → claim account with the password they just chose
        if (password && password.length >= 8) {
          const hashed = await bcrypt.hash(password, 12);
          customer = await prisma.customers.update({
            where: { id: customer.id },
            data: { password: hashed, name: customer.name || name.trim() },
          });
        }
      } else {
        // No email match — try phone match (legacy behavior, do NOT overwrite their password)
        customer = await prisma.customers.findFirst({ where: { phone: phone.trim() } });
      }
    }

    if (!customer) {
      // Brand new customer — password required
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: 'Please choose a password (minimum 8 characters) to create your account.' },
          { status: 400 }
        );
      }
      const hashed = await bcrypt.hash(password, 12);
      const newId = await generateCustomerId();
      customer = await prisma.customers.create({
        data: {
          id: newId,
          name: name.trim(),
          phone: phone.trim(),
          email: normalizedEmail,
          password: hashed,
          isActive: true,
        },
      });
    }

    // Generate requestId
    const count = await (prisma as any).wander_quote_requests.count();
    const requestId = `WND-REQ-${Date.now()}-${count + 1}`;

    const quoteRequest = await (prisma as any).wander_quote_requests.create({
      data: {
        requestId,
        wanderListingId: listingId,
        customerId: customer.id,
        travelDate: new Date(travelDate),
        groupSize: groupSize ? parseInt(groupSize) : 1,
        pickupLocation: pickupLocation?.trim() || null,
        requirements: requirements?.trim() || null,
        bookingFor: bookingFor === 'COMPANY' ? 'COMPANY' : 'PERSONAL',
        companyName: bookingFor === 'COMPANY' ? (companyName?.trim() || null) : null,
        status: 'PENDING',
      },
    });

    // For admin-listed tours, request stays pending admin review until admin
    // explicitly broadcasts it to all wander vendors. No vendor notification
    // sent here — admin must trigger broadcast from the admin panel.

    return NextResponse.json({ success: true, requestId: quoteRequest.requestId }, { status: 201 });
  } catch (error) {
    console.error('[Public Wander Quote Request POST]', error);
    return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500 });
  }
}
