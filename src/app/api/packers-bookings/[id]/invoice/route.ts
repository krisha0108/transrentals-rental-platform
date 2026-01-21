import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Logo as base64 - TransRentals logo
        const logoBase64 = 'data:image/png;base64,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';

        let booking = await prisma.packers_bookings.findUnique({
            where: { id },
            include: {
                vendors: {
                    select: {
                        businessName: true,
                        phone: true,
                        email: true,
                        address: true,
                        gstNumber: true,
                    },
                },
            },
        });

        if (!booking) {
            booking = await prisma.packers_bookings.findUnique({
                where: { bookingNumber: id },
                include: {
                    vendors: {
                        select: {
                            businessName: true,
                            phone: true,
                            email: true,
                            address: true,
                            gstNumber: true,
                        },
                    },
                },
            });
        }

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        const formatDate = (date: Date | null) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        };

        const formatCurrency = (amount: number | null) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
            }).format(amount || 0);
        };

        const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${booking.bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #0891b2; }
    .logo span { color: #333; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 28px; color: #333; margin-bottom: 5px; }
    .invoice-info p { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #0891b2; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .info-box label { font-size: 12px; color: #666; display: block; margin-bottom: 5px; }
    .info-box p { font-size: 15px; color: #333; font-weight: 500; }
    .trip-details { background: #ecfeff; padding: 20px; border-radius: 8px; border-left: 4px solid #0891b2; }
    .route { display: flex; align-items: center; gap: 20px; margin-bottom: 15px; }
    .route-point { flex: 1; }
    .route-point label { font-size: 12px; color: #666; }
    .route-point p { font-size: 15px; color: #333; font-weight: 500; }
    .route-arrow { font-size: 24px; color: #0891b2; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
    td { font-size: 14px; color: #333; }
    .text-right { text-align: right; }
    .subtotal td { border-top: 2px solid #e5e7eb; font-weight: 600; }
    .total td { background: #0891b2; color: white; font-size: 16px; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <img src="https://transrentals.in/assets/logo-trans.png" alt="TransRentals" style="height: 50px; width: auto;" />
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p>#${booking.bookingNumber}</p>
        <p>${formatDate(booking.createdAt)}</p>
      </div>
    </div>

    <div class="info-grid section">
      <div class="info-box">
        <label>Customer</label>
        <p>${booking.customerName}</p>
        <p style="font-size: 13px; color: #666; margin-top: 5px;">${booking.customerPhone}</p>
        <p style="font-size: 13px; color: #666;">${booking.customerEmail || ''}</p>
      </div>
      <div class="info-box">
        <label>Booking Status</label>
        <p>
          <span class="status ${booking.status === 'COMPLETED' ? 'status-completed' :
                booking.status === 'CANCELLED' ? 'status-cancelled' :
                    ['CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'ADVANCE_PAID'].includes(booking.status) ? 'status-confirmed' :
                        'status-pending'
            }">
            ${booking.status.replace(/_/g, ' ')}
          </span>
        </p>
        ${booking.paymentStatus === 'PAID' ? '<p style="margin-top: 10px; color: #059669; font-weight: 600;">Payment Received</p>' : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Moving Details</div>
      <div class="trip-details">
        <div class="route">
          <div class="route-point">
            <label>Pickup Location</label>
            <p>${booking.pickupAddress || booking.pickupCity}</p>
            ${booking.pickupFloor ? `<p style="font-size: 13px; color: #666;">Floor: ${booking.pickupFloor}</p>` : ''}
          </div>
          <span class="route-arrow">→</span>
          <div class="route-point">
            <label>Drop Location</label>
            <p>${booking.dropAddress || booking.dropCity}</p>
            ${booking.dropFloor ? `<p style="font-size: 13px; color: #666;">Floor: ${booking.dropFloor}</p>` : ''}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div>
            <label style="font-size: 12px; color: #666;">Service Type</label>
            <p style="font-size: 14px; font-weight: 500;">${booking.serviceType || 'Packers & Movers'}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">Shifting Type</label>
            <p style="font-size: 14px; font-weight: 500;">${booking.shiftingType || '-'}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">Scheduled Date</label>
            <p style="font-size: 14px; font-weight: 500;">${formatDate(booking.scheduledDate)}</p>
          </div>
        </div>
      </div>
    </div>

    ${booking.teamLeaderName ? `
    <div class="section">
      <div class="section-title">Team Details</div>
      <div class="info-grid">
        <div class="info-box">
          <label>Team Leader</label>
          <p>${booking.teamLeaderName}</p>
          <p style="font-size: 13px; color: #666; margin-top: 5px;">${booking.teamLeaderPhone || ''}</p>
        </div>
        <div class="info-box">
          <label>Team Size</label>
          <p>${booking.teamSize || '-'} members</p>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Fare Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(booking.packingCharges || 0) > 0 ? `
          <tr>
            <td>Packing Charges</td>
            <td class="text-right">${formatCurrency(booking.packingCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.materialCharges || 0) > 0 ? `
          <tr>
            <td>Material Charges</td>
            <td class="text-right">${formatCurrency(booking.materialCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.loadingCharges || 0) > 0 ? `
          <tr>
            <td>Loading Charges</td>
            <td class="text-right">${formatCurrency(booking.loadingCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.transportCharges || 0) > 0 ? `
          <tr>
            <td>Transportation Charges</td>
            <td class="text-right">${formatCurrency(booking.transportCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.unloadingCharges || 0) > 0 ? `
          <tr>
            <td>Unloading Charges</td>
            <td class="text-right">${formatCurrency(booking.unloadingCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.unpackingCharges || 0) > 0 ? `
          <tr>
            <td>Unpacking Charges</td>
            <td class="text-right">${formatCurrency(booking.unpackingCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.storageCharges || 0) > 0 ? `
          <tr>
            <td>Storage Charges</td>
            <td class="text-right">${formatCurrency(booking.storageCharges)}</td>
          </tr>
          ` : ''}
          ${(booking.insuranceCharges || 0) > 0 ? `
          <tr>
            <td>Insurance Charges</td>
            <td class="text-right">${formatCurrency(booking.insuranceCharges)}</td>
          </tr>
          ` : ''}
          <tr class="total">
            <td>Grand Total</td>
            <td class="text-right">${formatCurrency(booking.totalAmount)}</td>
          </tr>
          ${(booking.advancePaid || 0) > 0 ? `
          <tr class="subtotal">
            <td>Advance Paid</td>
            <td class="text-right" style="color: #0891b2;">${formatCurrency(booking.advancePaid)}</td>
          </tr>
          ` : ''}
          ${(booking.balanceAmount || 0) > 0 ? `
          <tr class="subtotal">
            <td>Balance Due</td>
            <td class="text-right" style="color: #333;">${formatCurrency(booking.balanceAmount)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    ${booking.vendors ? `
    <div class="section">
      <div class="section-title">Vendor Details</div>
      <div class="info-box">
        <p><strong>${booking.vendors.businessName}</strong></p>
        ${booking.vendors.address ? `<p style="font-size: 13px; color: #666; margin-top: 5px;">${booking.vendors.address}</p>` : ''}
        ${booking.vendors.phone ? `<p style="font-size: 13px; color: #666;">Phone: ${booking.vendors.phone}</p>` : ''}
        ${booking.vendors.gstNumber ? `<p style="font-size: 13px; color: #666;">GST: ${booking.vendors.gstNumber}</p>` : ''}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p style="margin-bottom: 10px;">Thank you for choosing TransRentals!</p>
      <p>For support, contact us at support@transrentals.in | +91 9876543210</p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 30px;">
      <button onclick="window.print()" style="padding: 12px 30px; background: #0891b2; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
        Print Invoice
      </button>
    </div>
  </div>
</body>
</html>
    `;

        return new NextResponse(invoiceHtml, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error: any) {
        logger.error('Failed to generate packers invoice', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate invoice', details: error?.message },
            { status: 500 }
        );
    }
}
