import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Generate invoice HTML for Equipment Booking
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try to find by ID or booking number
        let booking = await prisma.equipment_bookings.findUnique({
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
            booking = await prisma.equipment_bookings.findUnique({
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

        const formatDate = (date: Date) => {
            return new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        };

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
            }).format(amount || 0);
        };

        // Generate HTML Invoice
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
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 28px; color: #333; margin-bottom: 5px; }
    .invoice-info p { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #f59e0b; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .info-box label { font-size: 12px; color: #666; display: block; margin-bottom: 5px; }
    .info-box p { font-size: 15px; color: #333; font-weight: 500; }
    .rental-details { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
    td { font-size: 14px; color: #333; }
    .text-right { text-align: right; }
    .subtotal td { border-top: 2px solid #e5e7eb; font-weight: 600; }
    .total td { background: #f59e0b; color: white; font-size: 16px; font-weight: bold; }
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
        <p style="font-size: 13px; color: #666;">${booking.customerEmail}</p>
      </div>
      <div class="info-box">
        <label>Booking Status</label>
        <p>
          <span class="status ${booking.status === 'COMPLETED' ? 'status-completed' :
                booking.status === 'CANCELLED' ? 'status-cancelled' :
                    ['CONFIRMED', 'EQUIPMENT_DEPLOYED', 'IN_USE', 'ADVANCE_PAID'].includes(booking.status) ? 'status-confirmed' :
                        'status-pending'
            }">
            ${booking.status.replace(/_/g, ' ')}
          </span>
        </p>
        ${booking.paymentStatus === 'PAID' ? '<p style="margin-top: 10px; color: #059669; font-weight: 600;">✓ Payment Received</p>' : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Rental Details</div>
      <div class="rental-details">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="font-size: 12px; color: #666;">Equipment Type</label>
            <p style="font-size: 15px; font-weight: 500;">${booking.equipmentType}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">Category</label>
            <p style="font-size: 15px; font-weight: 500;">${booking.equipmentCategory}</p>
          </div>
        </div>
        ${booking.equipmentModel ? `
        <div style="margin-bottom: 15px;">
          <label style="font-size: 12px; color: #666;">Model</label>
          <p style="font-size: 15px; font-weight: 500;">${booking.equipmentModel}</p>
        </div>
        ` : ''}
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          <div>
            <label style="font-size: 12px; color: #666;">Quantity</label>
            <p style="font-size: 15px; font-weight: 500;">${booking.quantity} Unit(s)</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">Start Date</label>
            <p style="font-size: 15px; font-weight: 500;">${formatDate(booking.startDate)}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">End Date</label>
            <p style="font-size: 15px; font-weight: 500;">${formatDate(booking.endDate)}</p>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
          <div>
            <label style="font-size: 12px; color: #666;">Rental Days</label>
            <p style="font-size: 15px; font-weight: 500;">${booking.rentalDays} Day(s)</p>
          </div>
          <div>
            <label style="font-size: 12px; color: #666;">Daily Rate</label>
            <p style="font-size: 15px; font-weight: 500;">${formatCurrency(booking.dailyRate)}/day</p>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <label style="font-size: 12px; color: #666;">Delivery Location</label>
          <p style="font-size: 15px; font-weight: 500;">${booking.deliveryAddress || booking.deliveryLocation}</p>
        </div>
      </div>
    </div>

    ${booking.operatorName ? `
    <div class="section">
      <div class="section-title">Operator Details</div>
      <div class="info-box">
        <label>Operator</label>
        <p>${booking.operatorName}</p>
        <p style="font-size: 13px; color: #666; margin-top: 5px;">${booking.operatorPhone || ''}</p>
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
          <tr>
            <td>Base Rental (${booking.rentalDays} days × ${formatCurrency(booking.dailyRate)})</td>
            <td class="text-right">${formatCurrency(booking.baseAmount)}</td>
          </tr>
          ${booking.transportCharges > 0 ? `
          <tr>
            <td>Transport Charges</td>
            <td class="text-right">${formatCurrency(booking.transportCharges)}</td>
          </tr>
          ` : ''}
          ${booking.operatorCharges > 0 ? `
          <tr>
            <td>Operator Charges</td>
            <td class="text-right">${formatCurrency(booking.operatorCharges)}</td>
          </tr>
          ` : ''}
          ${booking.maintenanceCharges > 0 ? `
          <tr>
            <td>Maintenance Charges</td>
            <td class="text-right">${formatCurrency(booking.maintenanceCharges)}</td>
          </tr>
          ` : ''}
          ${booking.fuelCharges > 0 ? `
          <tr>
            <td>Fuel Charges</td>
            <td class="text-right">${formatCurrency(booking.fuelCharges)}</td>
          </tr>
          ` : ''}
          ${booking.additionalCharges > 0 ? `
          <tr>
            <td>Additional Charges</td>
            <td class="text-right">${formatCurrency(booking.additionalCharges)}</td>
          </tr>
          ` : ''}
          ${booking.gstAmount > 0 ? `
          <tr>
            <td>GST (18%)</td>
            <td class="text-right">${formatCurrency(booking.gstAmount)}</td>
          </tr>
          ` : ''}
          <tr class="total">
            <td>Grand Total</td>
            <td class="text-right">${formatCurrency(booking.totalAmount)}</td>
          </tr>
          ${booking.advancePaid > 0 ? `
          <tr class="subtotal">
            <td>Advance Paid</td>
            <td class="text-right" style="color: #f59e0b;">${formatCurrency(booking.advancePaid)}</td>
          </tr>
          ` : ''}
          ${booking.balanceAmount > 0 ? `
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
      <button onclick="window.print()" style="padding: 12px 30px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
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
        logger.error('Failed to generate equipment invoice', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate invoice', details: error?.message },
            { status: 500 }
        );
    }
}
